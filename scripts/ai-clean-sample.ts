#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Clean text and convert HTML to shortcodes
 */
async function cleanTextWithClaude(text: string, fieldName: string, anthropic: Anthropic): Promise<string> {
  const prompt = `Clean this FDA drug label text and convert HTML to safe shortcodes:

SHORTCODE CONVERSIONS:
- <section> → [section]...[/section]
- <div> → [div]...[/div]  
- <p> → [p]...[/p]
- <h1>, <h2>, <h3> → [h1], [h2], [h3]...[/h1], [/h2], [/h3]
- <span> → [span]...[/span]
- <a href="..."> → [link href="..."]...[/link]
- <ul>, <ol> → [ul], [ol]...[/ul], [/ol]
- <li> → [li]...[/li]
- <br/> → [br]
- Keep all attributes as key="value"

ALSO FIX:
- Encoding issues (Â, weird characters)
- Malformed HTML entities
- Excessive whitespace
- Any text artifacts

PRESERVE:
- All medical information exactly
- Document structure
- Proper formatting

Field: ${fieldName}
Text: ${text}

Return only cleaned text with shortcodes:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(4000, Math.ceil(text.length * 1.2)),
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error(`❌ Failed to clean ${fieldName}:`, error);
    return text;
  }
}

async function main() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Read the data
  const inputFile = path.join(process.cwd(), 'data', 'sanitized', 'chunk_001.json');
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const drug = data[0];
  
  console.log(`🎯 Processing sample fields for: ${drug.drugName}\n`);
  
  // Process just a few key fields as a demo
  const fieldsToProcess = [
    'indicationsAndUsage',
    'dosageAndAdministration', 
    'warningsAndPrecautions'
  ];
  
  const results: any = {};
  
  for (const field of fieldsToProcess) {
    const originalText = drug.label[field];
    if (originalText && originalText.length > 50) {
      console.log(`🔧 Processing ${field} (${originalText.length} chars)...`);
      
      const cleaned = await cleanTextWithClaude(originalText, field, anthropic);
      results[field] = {
        original: originalText,
        cleaned: cleaned,
        originalLength: originalText.length,
        cleanedLength: cleaned.length,
        reduction: originalText.length - cleaned.length
      };
      
      console.log(`   ✅ ${originalText.length} → ${cleaned.length} chars (-${originalText.length - cleaned.length})\n`);
    }
  }
  
  // Save results
  const outputFile = path.join(process.cwd(), 'data', 'sanitized', 'ai_cleaning_sample.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
  
  console.log(`✅ Sample results saved to: ${outputFile}`);
  
  // Show sample transformation
  if (results.indicationsAndUsage) {
    console.log(`\n🔍 Sample transformation (indicationsAndUsage):`);
    console.log(`\n📝 BEFORE (${results.indicationsAndUsage.originalLength} chars):`);
    console.log(results.indicationsAndUsage.original.substring(0, 300) + '...');
    
    console.log(`\n✨ AFTER (${results.indicationsAndUsage.cleanedLength} chars):`);
    console.log(results.indicationsAndUsage.cleaned.substring(0, 300) + '...');
  }
}

main().catch(console.error);