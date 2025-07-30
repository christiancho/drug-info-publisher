#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define HTML to shortcode mapping
const HTML_TO_SHORTCODE_MAP: Record<string, string> = {
  'section': 'section',
  'div': 'div',
  'p': 'p',
  'h1': 'h1',
  'h2': 'h2',
  'h3': 'h3',
  'h4': 'h4',
  'h5': 'h5',
  'h6': 'h6',
  'span': 'span',
  'a': 'link',
  'ul': 'ul',
  'ol': 'ol',
  'li': 'li',
  'table': 'table',
  'tr': 'tr',
  'td': 'td',
  'th': 'th',
  'thead': 'thead',
  'tbody': 'tbody',
  'caption': 'caption',
  'br': 'br',
  'img': 'img',
  'strong': 'strong',
  'em': 'em',
  'b': 'b',
  'i': 'i',
  'u': 'u'
};

/**
 * Simple HTML parser that converts HTML to a nested structure
 */
function parseHtmlToStructure(html: string): any {
  // Clean up the HTML first
  html = html.replace(/\s+/g, ' ').trim();
  
  const result: any = {
    type: 'root',
    children: []
  };
  
  let pos = 0;
  
  function parseNode(): any {
    // Skip whitespace
    while (pos < html.length && /\s/.test(html[pos])) pos++;
    
    if (pos >= html.length) return null;
    
    if (html[pos] === '<') {
      // Parse HTML tag
      const tagStart = pos;
      pos++; // skip '<'
      
      // Check if it's a closing tag
      if (html[pos] === '/') {
        // This is a closing tag, let parent handle it
        return null;
      }
      
      // Find tag name and attributes
      let tagEnd = pos;
      while (tagEnd < html.length && html[tagEnd] !== '>' && html[tagEnd] !== ' ') {
        tagEnd++;
      }
      
      const tagName = html.substring(pos, tagEnd).toLowerCase();
      
      // Find the end of the opening tag
      let openTagEnd = tagEnd;
      while (openTagEnd < html.length && html[openTagEnd] !== '>') {
        openTagEnd++;
      }
      
      // Extract attributes
      const attributesStr = html.substring(tagEnd, openTagEnd).trim();
      const attributes: Record<string, string> = {};
      
      if (attributesStr) {
        const attrRegex = /(\w+)=["']([^"']*)["']/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
          attributes[attrMatch[1]] = attrMatch[2];
        }
      }
      
      pos = openTagEnd + 1; // skip '>'
      
      // Check if it's a self-closing tag
      if (['br', 'img', 'hr'].includes(tagName)) {
        return {
          type: 'element',
          tagName,
          attributes,
          children: []
        };
      }
      
      // Parse children until we find the closing tag
      const children: any[] = [];
      
      while (pos < html.length) {
        // Look for closing tag
        const closingTagPattern = `</${tagName}`;
        const closingTagIndex = html.indexOf(closingTagPattern, pos);
        
        if (closingTagIndex === -1) {
          // No closing tag found, treat remaining as text
          const remainingText = html.substring(pos).trim();
          if (remainingText) {
            children.push({
              type: 'text',
              content: remainingText
            });
          }
          pos = html.length;
          break;
        }
        
        // Check if there's text or other elements before the closing tag
        const beforeClosing = html.substring(pos, closingTagIndex);
        
        if (beforeClosing.includes('<')) {
          // There are nested elements
          const child = parseNode();
          if (child) {
            children.push(child);
          }
        } else {
          // Just text content
          const textContent = beforeClosing.trim();
          if (textContent) {
            children.push({
              type: 'text',
              content: textContent
            });
          }
          
          // Skip to after the closing tag
          pos = html.indexOf('>', closingTagIndex) + 1;
          break;
        }
      }
      
      return {
        type: 'element',
        tagName,
        attributes,
        children
      };
    } else {
      // Parse text content
      const textStart = pos;
      while (pos < html.length && html[pos] !== '<') {
        pos++;
      }
      
      const textContent = html.substring(textStart, pos).trim();
      if (textContent) {
        return {
          type: 'text',
          content: textContent
        };
      }
      
      return null;
    }
  }
  
  // Parse all top-level nodes
  while (pos < html.length) {
    const node = parseNode();
    if (node) {
      result.children.push(node);
    }
  }
  
  return result;
}

/**
 * Convert parsed HTML structure to shortcodes
 */
function structureToShortcodes(structure: any): string {
  if (!structure) return '';
  
  if (structure.type === 'text') {
    return structure.content;
  }
  
  if (structure.type === 'element') {
    const tagName = structure.tagName;
    const shortcodeName = HTML_TO_SHORTCODE_MAP[tagName] || tagName;
    
    // Build attributes string
    let attributesStr = '';
    if (structure.attributes && Object.keys(structure.attributes).length > 0) {
      attributesStr = ' ' + Object.entries(structure.attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    }
    
    // Handle self-closing tags
    if (['br', 'img', 'hr'].includes(tagName)) {
      return `[${shortcodeName}${attributesStr}]`;
    }
    
    // Handle regular tags with children
    const childrenContent = structure.children
      ? structure.children.map((child: any) => structureToShortcodes(child)).join('')
      : '';
    
    return `[${shortcodeName}${attributesStr}]${childrenContent}[/${shortcodeName}]`;
  }
  
  if (structure.type === 'root') {
    return structure.children
      ? structure.children.map((child: any) => structureToShortcodes(child)).join('')
      : '';
  }
  
  return '';
}

/**
 * Clean text content only (not HTML structure) using Claude AI
 */
async function cleanTextContent(text: string, anthropic: Anthropic): Promise<string> {
  // Only process substantial text that might have encoding issues
  if (!text || text.length < 20) {
    return text;
  }
  
  // Check if text has encoding issues or artifacts
  if (!text.includes('Â') && !text.includes('&') && !text.includes('\\')) {
    return text;
  }
  
  const prompt = `Clean this text by fixing encoding issues, malformed entities, and artifacts. Keep ALL medical information exactly as-is. Return ONLY the cleaned text:

${text}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(2000, Math.ceil(text.length * 1.5)),
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error(`❌ Failed to clean text:`, error);
    return text; // Return original if AI fails
  }
}

/**
 * Process HTML field: parse structure, clean text content, convert to shortcodes
 */
async function processHtmlField(html: string, fieldName: string, anthropic: Anthropic): Promise<string> {
  console.log(`    🔧 ${fieldName} (${html.length} chars)...`);
  
  try {
    // Step 1: Parse HTML to structure
    const structure = parseHtmlToStructure(html);
    
    // Step 2: Clean text content in the structure
    async function cleanStructureText(node: any): Promise<any> {
      if (node.type === 'text') {
        const cleaned = await cleanTextContent(node.content, anthropic);
        return { ...node, content: cleaned };
      }
      
      if (node.type === 'element' && node.children) {
        const cleanedChildren = await Promise.all(
          node.children.map((child: any) => cleanStructureText(child))
        );
        return { ...node, children: cleanedChildren };
      }
      
      if (node.type === 'root' && node.children) {
        const cleanedChildren = await Promise.all(
          node.children.map((child: any) => cleanStructureText(child))
        );
        return { ...node, children: cleanedChildren };
      }
      
      return node;
    }
    
    const cleanedStructure = await cleanStructureText(structure);
    
    // Step 3: Convert to shortcodes
    const shortcodes = structureToShortcodes(cleanedStructure);
    
    const reduction = html.length - shortcodes.length;
    console.log(`       ✅ ${html.length} → ${shortcodes.length} chars (${reduction >= 0 ? '-' : '+'}${Math.abs(reduction)})`);
    
    return shortcodes;
    
  } catch (error) {
    console.error(`❌ Failed to process ${fieldName}:`, error);
    return html; // Return original if processing fails
  }
}

/**
 * Process all text fields in an object recursively
 */
async function processTextFields(obj: any, path: string, anthropic: Anthropic, minLength: number = 100): Promise<any> {
  if (typeof obj === 'string' && obj.length >= minLength) {
    const fieldName = path.split('.').pop() || 'unknown';
    
    // Check if this looks like HTML content
    if (obj.includes('<') && obj.includes('>')) {
      return await processHtmlField(obj, fieldName, anthropic);
    } else {
      // Just clean the text content
      console.log(`    🔧 ${fieldName} (${obj.length} chars, text-only)...`);
      const cleaned = await cleanTextContent(obj, anthropic);
      const reduction = obj.length - cleaned.length;
      console.log(`       ✅ ${obj.length} → ${cleaned.length} chars (${reduction >= 0 ? '-' : '+'}${Math.abs(reduction)})`);
      return cleaned;
    }
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
 * Main function to process a single chunk file
 */
async function main() {
  const chunkNumber = process.argv[2];
  
  if (!chunkNumber) {
    console.error('❌ Please provide chunk number (e.g., 001, 002, etc.)');
    console.log('Usage: npx tsx scripts/ai-clean-structured.ts 001');
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
  const aiCleanedDir = path.join(dataDir, 'ai-cleaned');
  
  const inputFileName = `chunk_${chunkNumber}.json`;
  
  // Try sanitized version first, then regular
  const sanitizedPath = path.join(sanitizedDir, inputFileName);
  const regularPath = path.join(dataDir, inputFileName);
  const inputFile = fs.existsSync(sanitizedPath) ? sanitizedPath : regularPath;
  const outputFile = path.join(aiCleanedDir, inputFileName);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    return;
  }
  
  // Create output directory if needed
  if (!fs.existsSync(aiCleanedDir)) {
    fs.mkdirSync(aiCleanedDir, { recursive: true });
  }
  
  console.log(`📖 Processing ${inputFileName} with structured approach...`);
  
  const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const originalSize = fs.readFileSync(inputFile, 'utf-8').length;
  
  console.log(`  📊 ${originalData.length} drug(s) found`);
  
  // Process the data
  const cleanedData = await processTextFields(originalData, 'root', anthropic, 50);
  
  // Write cleaned data
  fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), 'utf-8');
  const cleanedSize = fs.readFileSync(outputFile, 'utf-8').length;
  
  console.log(`  ✅ Saved to ${inputFileName}`);
  console.log(`  📏 ${originalSize.toLocaleString()} → ${cleanedSize.toLocaleString()} chars`);
  console.log(`  📉 Reduction: ${(originalSize - cleanedSize).toLocaleString()} chars (${((originalSize - cleanedSize)/originalSize*100).toFixed(1)}%)`);
}

main().catch(console.error);