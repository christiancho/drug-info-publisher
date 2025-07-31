require('reflect-metadata');
const fs = require('fs');
const path = require('path');
const { DataSource } = require('typeorm');

// Define Drug entity inline
const { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } = require('typeorm');

function Drug() {}
function DrugContent() {}

// Apply decorators for Drug entity
require('typeorm').Entity('drugs')(Drug);
require('typeorm').PrimaryGeneratedColumn('uuid')(Drug.prototype, 'id');
require('typeorm').Column('varchar')(Drug.prototype, 'drugName');
require('typeorm').Column('varchar')(Drug.prototype, 'setId');
require('typeorm').Column('varchar')(Drug.prototype, 'slug');
require('typeorm').Column('varchar')(Drug.prototype, 'labeler');
require('typeorm').CreateDateColumn()(Drug.prototype, 'createdAt');
require('typeorm').UpdateDateColumn()(Drug.prototype, 'updatedAt');

// Apply decorators for DrugContent entity
require('typeorm').Entity('drug_contents')(DrugContent);
require('typeorm').PrimaryGeneratedColumn('uuid')(DrugContent.prototype, 'id');
require('typeorm').Column('varchar')(DrugContent.prototype, 'drugId');
require('typeorm').OneToOne(() => Drug, { onDelete: 'CASCADE' })(DrugContent.prototype, 'drug');
require('typeorm').JoinColumn({ name: 'drugId' })(DrugContent.prototype, 'drug');
require('typeorm').Column('varchar', { nullable: true })(DrugContent.prototype, 'genericName');
require('typeorm').Column('varchar', { nullable: true })(DrugContent.prototype, 'labelerName');
require('typeorm').Column('varchar', { nullable: true })(DrugContent.prototype, 'productType');
require('typeorm').Column('varchar', { nullable: true })(DrugContent.prototype, 'effectiveTime');
require('typeorm').Column('varchar', { nullable: true })(DrugContent.prototype, 'title');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'indicationsAndUsage');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'dosageAndAdministration');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'dosageFormsAndStrengths');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'contraindications');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'warningsAndPrecautions');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'adverseReactions');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'clinicalPharmacology');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'clinicalStudies');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'mechanismOfAction');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'boxedWarning');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'highlights');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'description');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'howSupplied');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'instructionsForUse');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'nonclinicalToxicology');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'useInSpecificPopulations');
require('typeorm').Column('jsonb', { nullable: true })(DrugContent.prototype, 'drugInteractions');
require('typeorm').CreateDateColumn()(DrugContent.prototype, 'createdAt');
require('typeorm').UpdateDateColumn()(DrugContent.prototype, 'updatedAt');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'prescriberpoint',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'prescriberpoint',
  entities: [Drug, DrugContent],
  synchronize: true,
});

function generateSlug(drugName) {
  return drugName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function populateDatabase() {
  const sanitizedDir = path.join(process.cwd(), 'data', 'sanitized');
  
  console.log('🔌 Connecting to database...');
  
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const drugRepository = AppDataSource.getRepository(Drug);
    const drugContentRepository = AppDataSource.getRepository(DrugContent);
    
    console.log('🧹 Clearing existing drug data...');
    await AppDataSource.query('TRUNCATE TABLE drug_contents CASCADE');
    await AppDataSource.query('TRUNCATE TABLE drugs CASCADE');
    
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
          // Create Drug record
          const drug = new Drug();
          drug.drugName = drugData.drugName || 'Unknown';
          drug.setId = drugData.setId || '';
          drug.slug = drugData.slug || generateSlug(drug.drugName);
          drug.labeler = drugData.labeler || '';
          
          const savedDrug = await drugRepository.save(drug);
          
          // Create DrugContent record with label data
          if (drugData.label) {
            const drugContent = new DrugContent();
            drugContent.drugId = savedDrug.id;
            drugContent.genericName = drugData.label.genericName || null;
            drugContent.labelerName = drugData.label.labelerName || null;
            drugContent.productType = drugData.label.productType || null;
            drugContent.effectiveTime = drugData.label.effectiveTime || null;
            drugContent.title = drugData.label.title || null;
            drugContent.indicationsAndUsage = drugData.label.indicationsAndUsage || null;
            drugContent.dosageAndAdministration = drugData.label.dosageAndAdministration || null;
            drugContent.dosageFormsAndStrengths = drugData.label.dosageFormsAndStrengths || null;
            drugContent.contraindications = drugData.label.contraindications || null;
            drugContent.warningsAndPrecautions = drugData.label.warningsAndPrecautions || null;
            drugContent.adverseReactions = drugData.label.adverseReactions || null;
            drugContent.clinicalPharmacology = drugData.label.clinicalPharmacology || null;
            drugContent.clinicalStudies = drugData.label.clinicalStudies || null;
            drugContent.mechanismOfAction = drugData.label.mechanismOfAction || null;
            drugContent.boxedWarning = drugData.label.boxedWarning || null;
            drugContent.highlights = drugData.label.highlights || null;
            drugContent.description = drugData.label.description || null;
            drugContent.howSupplied = drugData.label.howSupplied || null;
            drugContent.instructionsForUse = drugData.label.instructionsForUse || null;
            drugContent.nonclinicalToxicology = drugData.label.nonclinicalToxicology || null;
            drugContent.useInSpecificPopulations = drugData.label.useInSpecificPopulations || null;
            drugContent.drugInteractions = drugData.label.drugInteractions || null;
            
            await drugContentRepository.save(drugContent);
          }
          
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

populateDatabase().catch(console.error);