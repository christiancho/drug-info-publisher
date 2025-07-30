#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

function sanitizeText(text: string): string {
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

function sanitizeRecursively(obj: any, path: string = ''): { sanitized: any, changes: Array<{path: string, originalLength: number, cleanedLength: number, removedChars: string[]}> } {
  const changes: Array<{path: string, originalLength: number, cleanedLength: number, removedChars: string[]}> = [];
  
  if (typeof obj === 'string') {
    const original = obj;
    const cleaned = sanitizeText(original);
    
    if (original !== cleaned) {
      // Find what characters were removed
      const problemChars = original.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g) || [];
      const uniqueChars = [...new Set(problemChars)];
      
      changes.push({
        path,
        originalLength: original.length,
        cleanedLength: cleaned.length,
        removedChars: uniqueChars.map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
      });
    }
    
    return { sanitized: cleaned, changes };
  } else if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      const sanitizedArray: any[] = [];
      obj.forEach((item, index) => {
        const result = sanitizeRecursively(item, `${path}[${index}]`);
        sanitizedArray.push(result.sanitized);
        changes.push(...result.changes);
      });
      return { sanitized: sanitizedArray, changes };
    } else {
      const sanitizedObject: any = {};
      Object.keys(obj).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        const result = sanitizeRecursively(obj[key], newPath);
        sanitizedObject[key] = result.sanitized;
        changes.push(...result.changes);
      });
      return { sanitized: sanitizedObject, changes };
    }
  } else {
    // For non-string, non-object types (numbers, booleans, null), return as-is
    return { sanitized: obj, changes };
  }
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
    const originalData = JSON.parse(rawData);
    
    console.log(`Processing ${originalData.length} drug(s)...`);
    
    const result = sanitizeRecursively(originalData, 'root');
    const sanitizedData = result.sanitized;
    const allChanges = result.changes;
    
    // Write sanitized version
    fs.writeFileSync(outputFile, JSON.stringify(sanitizedData, null, 2), 'utf-8');
    console.log(`\n✅ Sanitized data written to: ${outputFile}`);
    
    // Report changes
    console.log(`\n📊 Sanitization Report:`);
    console.log(`Fields cleaned: ${allChanges.length}`);
    
    if (allChanges.length > 0) {
      console.log(`\nDetailed changes:`);
      allChanges.forEach(change => {
        const sizeDiff = change.originalLength - change.cleanedLength;
        console.log(`  ${change.path}: removed ${sizeDiff} characters`);
        if (change.removedChars.length > 0) {
          console.log(`    Invisible chars: ${change.removedChars.join(', ')}`);
        }
      });
    }
    
    // Show comparison stats
    const originalSize = rawData.length;
    const sanitizedSize = fs.readFileSync(outputFile, 'utf-8').length;
    const sizeDiff = originalSize - sanitizedSize;
    
    console.log(`\n📏 File size comparison:`);
    console.log(`  Original: ${originalSize.toLocaleString()} characters`);
    console.log(`  Sanitized: ${sanitizedSize.toLocaleString()} characters`);
    console.log(`  Cleaned: ${sizeDiff.toLocaleString()} characters (${((sizeDiff/originalSize)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);