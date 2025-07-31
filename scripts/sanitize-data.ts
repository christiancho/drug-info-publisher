#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

import { parseDrug } from '../functions/src/parseDrug';
import { sanitizeString } from '../functions/src/sanitizeString';

/**
 * Recursively sanitize all "content" keys in an object
 */
function sanitizeContentKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeContentKeys(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'content' && typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else {
        result[key] = sanitizeContentKeys(value);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Main function
 */
function main() {
  const chunkNumber = process.argv[2];
  
  if (!chunkNumber) {
    console.error('❌ Please provide chunk number (e.g., 001, 002, etc.)');
    console.log('Usage: npx tsx scripts/sanitize-data.ts 001');
    return;
  }

  // File paths
  const dataDir = path.join(process.cwd(), 'data');
  const jsonDir = path.join(dataDir, 'sanitized');
  
  const inputFileName = `chunk_${chunkNumber}.json`;
  const inputFile = path.join(dataDir, 'original', inputFileName);
  const outputFile = path.join(jsonDir, inputFileName);
  
  // Step 1: Read from the JSON file
  console.log(`📖 Step 1: Reading ${inputFileName}...`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    return;
  }
  
  // Create output directory if needed
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }
  
  const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const originalSize = fs.readFileSync(inputFile, 'utf-8').length;
  
  console.log(`  📊 ${originalData.length} drug(s) found`);
  console.log(`  📏 Original size: ${originalSize.toLocaleString()} chars`);
  
  // Step 2-5: Process all fields and convert HTML to JSON
  console.log(`\n🔍 Step 2-5: Processing fields and converting HTML to structured JSON...`);
  const processedData = parseDrug(originalData);
  
  // Step 6: Sanitize all "content" keys
  console.log(`\n🧹 Step 6: Sanitizing content fields...`);
  const sanitizedData = sanitizeContentKeys(processedData);
  
  // Step 7: Save the resulting drug info under /data/json
  console.log(`\n💾 Step 7: Saving sanitized JSON data...`);
  fs.writeFileSync(outputFile, JSON.stringify(sanitizedData, null, 2), 'utf-8');
  const processedSize = fs.readFileSync(outputFile, 'utf-8').length;
  
  console.log(`  ✅ Saved to ${outputFile}`);
  console.log(`  📏 Final size: ${processedSize.toLocaleString()} chars`);
  console.log(`  📉 Change: ${(originalSize - processedSize).toLocaleString()} chars (${((originalSize - processedSize)/originalSize*100).toFixed(1)}%)`);
  
  console.log(`\n🎉 HTML to JSON conversion complete!`);
}

main();