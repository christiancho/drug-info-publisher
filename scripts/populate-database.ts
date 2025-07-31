#!/usr/bin/env tsx

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Drug } from './drug-entity';
import { generateChecksums, compareManifests, loadChecksumManifest } from './generate-checksums';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'prescriberpoint',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'prescriberpoint',
  entities: [Drug],
  synchronize: true,
});

function generateSlug(drugName: string): string {
  return drugName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function populateDatabase(forceUpdate: boolean = false) {
  const sanitizedDir = path.join(process.cwd(), 'data', 'sanitized');
  const manifestPath = path.join(process.cwd(), 'data', 'checksums.json');
  
  console.log('🔐 Checking data checksums...');
  
  // Check if update is needed
  if (!forceUpdate) {
    const oldManifest = loadChecksumManifest(manifestPath);
    const newManifest = generateChecksums(sanitizedDir);
    const comparison = compareManifests(oldManifest, newManifest);
    
    if (!comparison.hasChanges) {
      console.log('✅ No data changes detected. Database update not needed.');
      console.log('Use --force to update anyway.');
      return;
    }
    
    console.log('🔄 Data changes detected:');
    if (comparison.newFiles.length > 0) {
      console.log(`  ➕ New files: ${comparison.newFiles.join(', ')}`);
    }
    if (comparison.changedFiles.length > 0) {
      console.log(`  🔄 Changed files: ${comparison.changedFiles.join(', ')}`);
    }
    if (comparison.deletedFiles.length > 0) {
      console.log(`  ➖ Deleted files: ${comparison.deletedFiles.join(', ')}`);
    }
    
    // Save updated checksums
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2), 'utf-8');
  }
  
  console.log('\n🔌 Connecting to database...');
  
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const drugRepository = AppDataSource.getRepository(Drug);
    
    console.log('🧹 Clearing existing drug data...');
    await drugRepository.clear();
    
    if (!fs.existsSync(sanitizedDir)) {
      console.error('❌ Sanitized data directory not found:', sanitizedDir);
      return;
    }
    
    const files = fs.readdirSync(sanitizedDir).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${files.length} sanitized files`);
    
    let totalDrugs = 0;
    
    for (const file of files) {
      console.log(`\n📖 Processing ${file}...`);
      
      const filePath = path.join(sanitizedDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (!Array.isArray(data)) {
        console.log(`⚠️  Skipping ${file} - not an array`);
        continue;
      }
      
      for (const drugData of data) {
        try {
          const drug = new Drug();
          
          drug.drugName = drugData.drugName || 'Unknown';
          drug.setId = drugData.setId || '';
          drug.slug = drugData.slug || generateSlug(drug.drugName);
          drug.labeler = drugData.labeler || '';
          drug.genericName = drugData.genericName || null;
          drug.labelerName = drugData.labelerName || null;
          drug.productType = drugData.productType || null;
          drug.effectiveTime = drugData.effectiveTime || null;
          drug.title = drugData.title || null;
          
          drug.indicationsAndUsage = drugData.indicationsAndUsage || null;
          drug.dosageAndAdministration = drugData.dosageAndAdministration || null;
          drug.dosageFormsAndStrengths = drugData.dosageFormsAndStrengths || null;
          drug.contraindications = drugData.contraindications || null;
          drug.warningsAndPrecautions = drugData.warningsAndPrecautions || null;
          drug.adverseReactions = drugData.adverseReactions || null;
          drug.clinicalPharmacology = drugData.clinicalPharmacology || null;
          drug.clinicalStudies = drugData.clinicalStudies || null;
          drug.mechanismOfAction = drugData.mechanismOfAction || null;
          drug.boxedWarning = drugData.boxedWarning || null;
          drug.highlights = drugData.highlights || null;
          drug.description = drugData.description || null;
          drug.howSupplied = drugData.howSupplied || null;
          drug.instructionsForUse = drugData.instructionsForUse || null;
          drug.nonclinicalToxicology = drugData.nonclinicalToxicology || null;
          drug.useInSpecificPopulations = drugData.useInSpecificPopulations || null;
          drug.drugInteractions = drugData.drugInteractions || null;
          
          await drugRepository.save(drug);
          totalDrugs++;
          
          if (totalDrugs % 10 === 0) {
            console.log(`  💾 Saved ${totalDrugs} drugs...`);
          }
          
        } catch (error) {
          console.error(`❌ Error saving drug from ${file}:`, error.message);
        }
      }
      
      console.log(`✅ Completed ${file}`);
    }
    
    console.log(`\n🎉 Successfully populated database with ${totalDrugs} drugs!`);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

if (require.main === module) {
  const forceUpdate = process.argv.includes('--force');
  populateDatabase(forceUpdate).catch(console.error);
}

export { populateDatabase };