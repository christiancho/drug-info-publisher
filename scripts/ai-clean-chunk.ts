#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Sanitize and convert HTML to shortcodes using Claude AI
 */
async function cleanTextWithClaude(text: string, fieldName: string, anthropic: Anthropic): Promise<string> {
  const prompt = `Please clean and improve this FDA drug label text. Your tasks:

1. Fix all text encoding issues, malformed characters, and formatting problems
2. Convert HTML tags to safe shortcodes using this mapping:
   - <section> → [section]...[/section]
   - <div> → [div]...[/div]  
   - <p> → [p]...[/p]
   - <h1>, <h2>, <h3> → [h1], [h2], [h3]...[/h1], [/h2], [/h3]
   - <span> → [span]...[/span]
   - <a href="..."> → [link href="..."]...[/link]
   - <ul>, <ol> → [ul], [ol]...[/ul], [/ol]
   - <li> → [li]...[/li]
   - <table>, <tr>, <td>, <th> → [table], [tr], [td], [th]...[/table], [/tr], [/td], [/th]
   - <br/> → [br]
   - <img> → [img src="..." alt="..."]
   - Preserve all attributes as key="value" pairs
3. Clean up any encoding artifacts, weird characters, or formatting issues
4. Maintain the exact medical information and structure
5. Ensure proper spacing and readability

Field: ${fieldName}

Text to clean:
${text}

Return only the cleaned text with shortcodes, no explanations.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(4000, Math.ceil(text.length * 1.5)),
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error(`❌ Failed to clean ${fieldName}:`, error);
    return text; // Return original if AI fails
  }
}

/**
 * Process all text fields in the drug data
 */
async function processTextFields(obj: any, path: string, anthropic: Anthropic): Promise<any> {
  if (typeof obj === 'string' && obj.length > 50) { // Only process substantial text
    const fieldName = path.split('.').pop() || 'unknown';
    console.log(`🔧 Processing ${path} (${obj.length} chars)...`);
    
    const cleaned = await cleanTextWithClaude(obj, fieldName, anthropic);
    
    const sizeDiff = obj.length - cleaned.length;
    console.log(`   ✅ Completed: ${obj.length} → ${cleaned.length} chars (${sizeDiff >= 0 ? '-' : '+'}${Math.abs(sizeDiff)})`);
    
    return cleaned;
  } else if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      const processedArray = [];
      for (let i = 0; i < obj.length; i++) {
        processedArray.push(await processTextFields(obj[i], `${path}[${i}]`, anthropic));
      }
      return processedArray;
    } else {
      const processedObject: any = {};
      for (const key of Object.keys(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        processedObject[key] = await processTextFields(obj[key], newPath, anthropic);
      }
      return processedObject;
    }
  }
  
  return obj; // Return unchanged for non-text or short strings
}

/**
 * Main function
 */
async function main() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not found in environment variables');
    console.log('Please add CLAUDE_API_KEY to your .env file');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // File paths
  const inputFile = path.join(process.cwd(), 'data', 'sanitized', 'chunk_001.json');
  const outputFile = path.join(process.cwd(), 'data', 'sanitized', 'chunk_001_ai_cleaned.json');
  
  console.log('📖 Reading chunk_001.json...');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    return;
  }
  
  const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const drug = originalData[0];
  
  console.log(`🎯 Processing drug: ${drug.drugName}`);
  console.log(`📊 Starting AI text cleaning and HTML→shortcode conversion...\n`);
  
  // Process the data
  const cleanedData = await processTextFields(originalData, 'root', anthropic);
  
  // Write cleaned data
  fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), 'utf-8');
  
  console.log(`\n✅ AI-cleaned data saved to: ${outputFile}`);
  
  // Show file size comparison
  const originalSize = fs.readFileSync(inputFile, 'utf-8').length;
  const cleanedSize = fs.readFileSync(outputFile, 'utf-8').length;
  const sizeDiff = originalSize - cleanedSize;
  
  console.log(`\n📏 Final comparison:`);
  console.log(`  Original: ${originalSize.toLocaleString()} characters`);
  console.log(`  AI-cleaned: ${cleanedSize.toLocaleString()} characters`);
  console.log(`  Change: ${sizeDiff >= 0 ? '-' : '+'}${Math.abs(sizeDiff).toLocaleString()} characters (${((sizeDiff/originalSize)*100).toFixed(1)}%)`);
  
  // Show a sample of the transformation
  console.log(`\n🔍 Sample transformation:`);
  const originalSample = drug.label.indicationsAndUsage?.substring(0, 200) || 'N/A';
  const cleanedSample = cleanedData[0].label.indicationsAndUsage?.substring(0, 200) || 'N/A';
  
  console.log(`Original: ${originalSample}...`);
  console.log(`Cleaned:  ${cleanedSample}...`);
}

main().catch(console.error);