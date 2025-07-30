#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Clean text and convert HTML to shortcodes
 */
async function cleanTextWithClaude(text: string, fieldName: string, anthropic: Anthropic): Promise<string> {
  const prompt = `Transform this FDA drug label text by:

1. Converting ALL HTML tags to shortcodes:
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
   - Keep all attributes as key="value"

2. Fixing encoding issues (Â, malformed entities, artifacts)
3. Preserving ALL medical information exactly
4. Maintaining document structure and formatting

CRITICAL: Return ONLY the transformed text. Do not add explanations, notes, or commentary.

${text}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(4000, Math.ceil(text.length * 1.2)),
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error(`❌ Failed to clean ${fieldName}:`, error);
    return text; // Return original if AI fails
  }
}

/**
 * Process all text fields in an object recursively
 */
async function processTextFields(obj: any, path: string, anthropic: Anthropic, minLength: number = 100): Promise<any> {
  if (typeof obj === 'string' && obj.length >= minLength) {
    const fieldName = path.split('.').pop() || 'unknown';
    console.log(`    🔧 ${fieldName} (${obj.length} chars)...`);
    
    const cleaned = await cleanTextWithClaude(obj, fieldName, anthropic);
    const reduction = obj.length - cleaned.length;
    
    console.log(`       ✅ ${obj.length} → ${cleaned.length} chars (${reduction >= 0 ? '-' : '+'}${Math.abs(reduction)})`);
    
    return cleaned;
  } else if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      const processedArray = [];
      for (let i = 0; i < obj.length; i++) {
        processedArray.push(await processTextFields(obj[i], `${path}[${i}]`, anthropic, minLength));
      }
      return processedArray;
    } else {
      const processedObject: any = {};
      for (const key of Object.keys(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        processedObject[key] = await processTextFields(obj[key], newPath, anthropic, minLength);
      }
      return processedObject;
    }
  }
  
  return obj; // Return unchanged for non-text or short strings
}

/**
 * Process a single chunk file
 */
async function processChunkFile(inputFile: string, outputFile: string, anthropic: Anthropic): Promise<{
  fileName: string;
  originalSize: number;
  cleanedSize: number;
  drugCount: number;
  fieldsProcessed: number;
}> {
  console.log(`📖 Processing ${path.basename(inputFile)}...`);
  
  const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const originalSize = fs.readFileSync(inputFile, 'utf-8').length;
  
  console.log(`  📊 ${originalData.length} drug(s) found`);
  
  // Process the data
  const cleanedData = await processTextFields(originalData, 'root', anthropic, 100);
  
  // Write cleaned data
  fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), 'utf-8');
  const cleanedSize = fs.readFileSync(outputFile, 'utf-8').length;
  
  console.log(`  ✅ Saved to ${path.basename(outputFile)}`);
  console.log(`  📏 ${originalSize.toLocaleString()} → ${cleanedSize.toLocaleString()} chars\n`);
  
  return {
    fileName: path.basename(inputFile),
    originalSize,
    cleanedSize,
    drugCount: originalData.length,
    fieldsProcessed: 0 // Could track this if needed
  };
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

  // Find all chunk files
  const dataDir = path.join(process.cwd(), 'data');
  const sanitizedDir = path.join(dataDir, 'sanitized');
  const aiCleanedDir = path.join(dataDir, 'ai-cleaned');
  
  // Create output directory
  if (!fs.existsSync(aiCleanedDir)) {
    fs.mkdirSync(aiCleanedDir, { recursive: true });
    console.log(`📁 Created directory: ${aiCleanedDir}`);
  }
  
  // Find all chunk files (either in root data or sanitized folder)
  const chunkFiles = glob.sync('chunk_*.json', { cwd: dataDir })
    .concat(glob.sync('chunk_*.json', { cwd: sanitizedDir }).map(f => `sanitized/${f}`));
  
  // Remove duplicates and prefer sanitized versions
  const uniqueChunks = [...new Set(chunkFiles.map(f => f.replace('sanitized/', '')))];
  const finalChunks = uniqueChunks.map(chunk => {
    const sanitizedPath = path.join(sanitizedDir, chunk);
    const regularPath = path.join(dataDir, chunk);
    return fs.existsSync(sanitizedPath) ? sanitizedPath : regularPath;
  });
  
  console.log(`🎯 Found ${finalChunks.length} chunk files to process`);
  console.log(`📤 Output directory: ${aiCleanedDir}\n`);
  
  const results = [];
  const startTime = Date.now();
  
  // Process each chunk file
  for (let i = 0; i < finalChunks.length; i++) {
    const inputFile = finalChunks[i];
    const fileName = path.basename(inputFile);
    const outputFile = path.join(aiCleanedDir, fileName);
    
    console.log(`📋 [${i + 1}/${finalChunks.length}] Processing ${fileName}`);
    
    try {
      const result = await processChunkFile(inputFile, outputFile, anthropic);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to process ${fileName}:`, error);
      results.push({
        fileName,
        originalSize: 0,
        cleanedSize: 0,
        drugCount: 0,
        fieldsProcessed: 0,
        error: error.message
      });
    }
  }
  
  // Generate summary report
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCleanedSize = results.reduce((sum, r) => sum + r.cleanedSize, 0);
  const totalDrugs = results.reduce((sum, r) => sum + r.drugCount, 0);
  const totalReduction = totalOriginalSize - totalCleanedSize;
  
  console.log(`\n🎉 PROCESSING COMPLETE!`);
  console.log(`⏱️  Total time: ${duration.toFixed(1)} seconds`);
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${results.length}`);
  console.log(`   Total drugs: ${totalDrugs}`);
  console.log(`   Original size: ${totalOriginalSize.toLocaleString()} chars`);
  console.log(`   AI-cleaned size: ${totalCleanedSize.toLocaleString()} chars`);
  console.log(`   Total reduction: ${totalReduction.toLocaleString()} chars (${((totalReduction/totalOriginalSize)*100).toFixed(1)}%)`);
  
  // Save summary report
  const summaryFile = path.join(aiCleanedDir, '_processing_summary.json');
  const summary = {
    processedAt: new Date().toISOString(),
    duration: `${duration.toFixed(1)}s`,
    stats: {
      filesProcessed: results.length,
      totalDrugs,
      totalOriginalSize,
      totalCleanedSize,
      totalReduction,
      reductionPercentage: ((totalReduction/totalOriginalSize)*100).toFixed(1)
    },
    files: results
  };
  
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`\n📋 Processing summary saved to: ${summaryFile}`);
}

main().catch(console.error);