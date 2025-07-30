#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { HTMLToJSON } from 'html-to-json-parser';

// Load environment variables
dotenv.config();

/**
 * Step 4: Aggressively clean text using regex to keep only readable characters
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  // Keep only alphanumeric, punctuation, and standard whitespace
  // This regex keeps: letters, numbers, punctuation, and normal spaces/newlines
  const cleaned = text
    .replace(/[^\w\s\.,;:!?'"()\[\]{}<>/@#$%^&*+=|\\~`-]/g, '')
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .trim();
  
  return cleaned;
}

/**
 * Step 4: Recursively sanitize 'content' fields in parsed JSON
 */
async function sanitizeContentFields(obj: any): Promise<any> {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    const sanitizedArray = [];
    for (const item of obj) {
      sanitizedArray.push(await sanitizeContentFields(item));
    }
    return sanitizedArray;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitizedObj: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'content' && typeof value === 'string') {
        // This is a content field - sanitize it
        console.log(`      🧹 Sanitizing content (${value.length} chars)...`);
        const sanitized = sanitizeText(value);
        const reduction = value.length - sanitized.length;
        console.log(`         ✅ ${value.length} → ${sanitized.length} chars (${reduction >= 0 ? '-' : '+'}${Math.abs(reduction)})`);
        sanitizedObj[key] = sanitized;
      } else if (key === 'content' && Array.isArray(value)) {
        // Content is an array - sanitize each string in it
        console.log(`      🧹 Sanitizing content array (${value.length} items)...`);
        const sanitizedArray = [];
        for (const item of value) {
          if (typeof item === 'string') {
            sanitizedArray.push(sanitizeText(item));
          } else {
            sanitizedArray.push(await sanitizeContentFields(item));
          }
        }
        sanitizedObj[key] = sanitizedArray;
      } else {
        // Recursively process other fields
        sanitizedObj[key] = await sanitizeContentFields(value);
      }
    }
    
    return sanitizedObj;
  }
  
  return obj;
}

/**
 * Step 2: Check if a string contains HTML
 */
function hasHTML(str: string): boolean {
  return typeof str === 'string' && str.includes('<') && str.includes('>');
}

/**
 * Step 3: Parse HTML to JSON using html-to-json-parser
 */
async function parseHTMLToJSON(htmlString: string): Promise<any> {
  try {
    const parsed = HTMLToJSON(htmlString);
    return parsed;
  } catch (error) {
    console.error(`❌ Failed to parse HTML:`, error);
    return htmlString; // Return original if parsing fails
  }
}

/**
 * Step 2: Recursively process all fields to find HTML and convert to JSON
 */
async function processFields(obj: any, path: string): Promise<any> {
  if (typeof obj === 'string') {
    if (hasHTML(obj)) {
      const fieldName = path.split('.').pop() || 'unknown';
      console.log(`    🔧 Processing HTML field: ${fieldName} (${obj.length} chars)...`);
      
      // Step 3: Parse HTML to JSON
      console.log(`      📄 Converting HTML to JSON...`);
      const parsedJSON = await parseHTMLToJSON(obj);
      
      // Step 4: Sanitize content fields in the parsed JSON
      console.log(`      🧹 Sanitizing content fields...`);
      const sanitizedJSON = await sanitizeContentFields(parsedJSON);
      
      console.log(`       ✅ HTML field processed and sanitized`);
      return sanitizedJSON;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    const processedArray = [];
    for (let i = 0; i < obj.length; i++) {
      processedArray.push(await processFields(obj[i], `${path}[${i}]`));
    }
    return processedArray;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const processedObject: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      processedObject[key] = await processFields(value, newPath);
    }
    return processedObject;
  }
  
  return obj;
}

/**
 * Main function
 */
async function main() {
  const chunkNumber = process.argv[2];
  
  if (!chunkNumber) {
    console.error('❌ Please provide chunk number (e.g., 001, 002, etc.)');
    console.log('Usage: npx tsx scripts/html-to-json-sanitize.ts 001');
    return;
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not found in environment variables');
    console.log('Please add CLAUDE_API_KEY to your .env file');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // File paths
  const dataDir = path.join(process.cwd(), 'data');
  const sanitizedDir = path.join(dataDir, 'sanitized');
  
  const inputFileName = `chunk_${chunkNumber}.json`;
  const inputFile = path.join(dataDir, inputFileName);
  const outputFile = path.join(sanitizedDir, inputFileName);
  
  // Step 1: Read from the JSON file
  console.log(`📖 Step 1: Reading ${inputFileName}...`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    return;
  }
  
  // Create output directory if needed
  if (!fs.existsSync(sanitizedDir)) {
    fs.mkdirSync(sanitizedDir, { recursive: true });
  }
  
  const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const originalSize = fs.readFileSync(inputFile, 'utf-8').length;
  
  console.log(`  📊 ${originalData.length} drug(s) found`);
  console.log(`  📏 Original size: ${originalSize.toLocaleString()} chars`);
  
  // Step 2-5: Process all fields
  console.log(`\n🔍 Step 2-5: Processing fields...`);
  const processedData = await processFields(originalData, 'root', anthropic);
  
  // Step 5: Save the resulting drug info under /data/sanitized
  console.log(`\n💾 Step 5: Saving sanitized data...`);
  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2), 'utf-8');
  const processedSize = fs.readFileSync(outputFile, 'utf-8').length;
  
  console.log(`  ✅ Saved to ${inputFileName}`);
  console.log(`  📏 Final size: ${processedSize.toLocaleString()} chars`);
  console.log(`  📉 Change: ${(originalSize - processedSize).toLocaleString()} chars (${((originalSize - processedSize)/originalSize*100).toFixed(1)}%)`);
  
  console.log(`\n🎉 Processing complete!`);
}

main().catch(console.error);