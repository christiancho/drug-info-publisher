#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test the AI sanitization with a sample of problematic text
 */
async function testAISanitization() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not found in environment variables');
    console.log('Please set CLAUDE_API_KEY in your .env file');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Read a sample from the sanitized file that still has issues
  const sanitizedFile = path.join(process.cwd(), 'data', 'sanitized', 'chunk_001.json');
  const data = JSON.parse(fs.readFileSync(sanitizedFile, 'utf-8'));
  const drug = data[0];
  
  // Find text with "Â" characters
  const problematicText = drug.label.adverseReactions;
  const sampleText = problematicText.substring(0, 500); // Take first 500 chars
  
  console.log('🔍 Testing AI sanitization...');
  console.log('\n📝 Original text sample:');
  console.log(sampleText);
  console.log('\n🔧 Characters found:', [...new Set(sampleText.match(/Â/g) || [])]);

  const prompt = `Please clean and sanitize this text from an FDA drug label. Fix encoding issues, remove artifacts, and improve readability while preserving all medical information and HTML structure.

Context: This text is from the adverseReactions section of a drug label.

Common issues to fix:
- Encoding artifacts like "Â" characters  
- Malformed HTML entities
- Inconsistent spacing and formatting
- Invisible or control characters
- Broken Unicode characters
- Redundant whitespace

IMPORTANT: 
- Preserve all medical information exactly
- Keep HTML tags and structure intact
- Fix only formatting/encoding issues, not medical content
- Return only the cleaned text, no explanations

Text to clean:
${sampleText}`;

  try {
    console.log('\n🤖 Calling Claude API...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const cleanedText = response.content[0].text.trim();
    
    console.log('\n✨ AI-sanitized text:');
    console.log(cleanedText);
    
    console.log('\n📊 Comparison:');
    console.log(`Original length: ${sampleText.length}`);
    console.log(`Cleaned length: ${cleanedText.length}`);
    console.log(`Characters removed: ${sampleText.length - cleanedText.length}`);
    
    // Check if "Â" characters were removed
    const remainingProblems = cleanedText.match(/Â/g) || [];
    console.log(`Remaining "Â" characters: ${remainingProblems.length}`);
    
    if (remainingProblems.length === 0) {
      console.log('✅ AI successfully removed encoding artifacts!');
    } else {
      console.log('⚠️  Some encoding issues may remain');
    }
    
  } catch (error) {
    console.error('❌ Error calling Claude API:', error);
  }
}

testAISanitization().catch(console.error);