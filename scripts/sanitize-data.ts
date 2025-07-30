#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface DrugLabel {
  genericName?: string;
  labelerName?: string;
  productType?: string;
  effectiveTime?: string;
  title?: string;
  indicationsAndUsage?: string;
  dosageAndAdministration?: string;
  dosageFormsAndStrengths?: string;
  contraindications?: string;
  warningsAndPrecautions?: string;
  adverseReactions?: string;
  clinicalPharmacology?: string;
  clinicalStudies?: string;
  mechanismOfAction?: string;
  boxedWarning?: string;
  highlights?: string;
}

interface Drug {
  drugName: string;
  setId: string;
  slug: string;
  labeler: string;
  label: DrugLabel;
}

function sanitizeText(text: string | object | undefined): string {
  if (!text) return '';
  
  // If it's an object, stringify it first
  if (typeof text === 'object') {
    text = JSON.stringify(text);
  }
  
  // Now we know it's a string
  if (typeof text !== 'string') return String(text);
  
  // Remove invisible characters and control characters (except newlines and tabs)
  let sanitized = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  // Clean up HTML entities
  sanitized = sanitized
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Remove excessive whitespace but preserve intentional formatting
  sanitized = sanitized
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove leading whitespace on lines
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace on lines
    .replace(/\n{3,}/g, '\n\n');  // Multiple newlines to max 2
  
  // Clean up common HTML artifacts that might be poorly formatted
  sanitized = sanitized
    .replace(/<\s+/g, '<')  // Remove spaces after opening brackets
    .replace(/\s+>/g, '>')  // Remove spaces before closing brackets
    .replace(/\s+\/>/g, '/>')  // Clean self-closing tags
    .replace(/"\s+/g, '" ')  // Clean up quote spacing
    .replace(/\s+"/g, ' "')  // Clean up quote spacing
    .replace(/'\s+/g, "' ")  // Clean up single quote spacing
    .replace(/\s+'/g, " '")  // Clean up single quote spacing
    .replace(/class\s*=\s*"\s*/g, 'class="')  // Clean class attributes
    .replace(/\s*"\s*>/g, '">')  // Clean attribute endings
    .replace(/\s*=\s*"/g, '="');  // Clean attribute assignments
  
  // Remove zero-width characters and other Unicode troublemakers
  sanitized = sanitized
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Zero-width spaces
    .replace(/[\u2000-\u200A]/g, ' ')  // Various Unicode spaces to regular space
    .replace(/\u00A0/g, ' ');  // Non-breaking space to regular space
  
  return sanitized.trim();
}

function sanitizeDrug(drug: Drug): Drug {
  console.log(`Sanitizing drug: ${drug.drugName}`);
  
  const sanitized: Drug = {
    drugName: sanitizeText(drug.drugName),
    setId: sanitizeText(drug.setId),
    slug: sanitizeText(drug.slug),
    labeler: sanitizeText(drug.labeler),
    label: {}
  };
  
  // Sanitize all label fields
  const labelFields: (keyof DrugLabel)[] = [
    'genericName', 'labelerName', 'productType', 'effectiveTime', 'title',
    'indicationsAndUsage', 'dosageAndAdministration', 'dosageFormsAndStrengths',
    'contraindications', 'warningsAndPrecautions', 'adverseReactions',
    'clinicalPharmacology', 'clinicalStudies', 'mechanismOfAction',
    'boxedWarning', 'highlights'
  ];
  
  for (const field of labelFields) {
    if (drug.label[field]) {
      const original = drug.label[field]!;
      const cleaned = sanitizeText(original);
      sanitized.label[field] = cleaned;
      
      // Report changes
      if (original !== cleaned) {
        const sizeDiff = original.length - cleaned.length;
        console.log(`  ${field}: cleaned ${sizeDiff} characters`);
        
        // Show sample of problematic characters found
        const problemChars = original.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g);
        if (problemChars && problemChars.length > 0) {
          const uniqueChars = [...new Set(problemChars)];
          console.log(`    Removed invisible chars: ${uniqueChars.map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(', ')}`);
        }
      }
    }
  }
  
  return sanitized;
}

async function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const sanitizedDir = path.join(dataDir, 'sanitized');
  const inputFile = path.join(dataDir, 'chunk_001.json');
  const outputFile = path.join(sanitizedDir, 'chunk_001.json');
  
  // Create sanitized directory if it doesn't exist
  if (!fs.existsSync(sanitizedDir)) {
    fs.mkdirSync(sanitizedDir, { recursive: true });
    console.log(`Created directory: ${sanitizedDir}`);
  }
  
  console.log('Reading chunk_001.json...');
  
  try {
    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const drugs: Drug[] = JSON.parse(rawData);
    
    console.log(`Found ${drugs.length} drugs to sanitize`);
    
    const sanitizedDrugs = drugs.map(sanitizeDrug);
    
    // Write sanitized version
    fs.writeFileSync(outputFile, JSON.stringify(sanitizedDrugs, null, 2), 'utf-8');
    console.log(`\n✅ Sanitized data written to: ${outputFile}`);
    
    // Show comparison stats
    const originalSize = rawData.length;
    const sanitizedSize = fs.readFileSync(outputFile, 'utf-8').length;
    const sizeDiff = originalSize - sanitizedSize;
    
    console.log(`\nFile size comparison:`);
    console.log(`  Original: ${originalSize.toLocaleString()} characters`);
    console.log(`  Sanitized: ${sanitizedSize.toLocaleString()} characters`);
    console.log(`  Cleaned: ${sizeDiff.toLocaleString()} characters (${((sizeDiff/originalSize)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);