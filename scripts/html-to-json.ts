#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface ParsedSection {
  title?: string;
  content: Array<{
    type: 'paragraph' | 'list' | 'table' | 'subsection';
    content: string | string[] | TableData | SubsectionData;
  }>;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface SubsectionData {
  title: string;
  content: Array<{
    type: 'paragraph' | 'list' | 'table';
    content: string | string[] | TableData;
  }>;
}

/**
 * Clean text content by removing extra whitespace and unwanted characters
 */
function cleanText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  return text
    .replace(/Â/g, '') // Remove specific Â character
    .replace(/[\u00A0\u2000-\u200D\u2028-\u2029\u202F\u205F\u3000\uFEFF]/g, ' ') // Replace invisible chars
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .trim();
}

/**
 * Parse HTML table into structured data
 */
function parseTable(table: Element): TableData {
  const headers: string[] = [];
  const rows: string[][] = [];

  // Extract headers
  const headerCells = table.querySelectorAll('thead tr th, tr:first-child th, tr:first-child td');
  headerCells.forEach(cell => {
    headers.push(cleanText(cell.textContent || ''));
  });

  // Extract rows
  const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
  dataRows.forEach(row => {
    const cells = row.querySelectorAll('td, th');
    const rowData: string[] = [];
    cells.forEach(cell => {
      rowData.push(cleanText(cell.textContent || ''));
    });
    if (rowData.length > 0) {
      rows.push(rowData);
    }
  });

  return { headers, rows };
}

/**
 * Parse HTML list into array of strings
 */
function parseList(list: Element): string[] {
  const items: string[] = [];
  const listItems = list.querySelectorAll('li');
  
  listItems.forEach(item => {
    const text = cleanText(item.textContent || '');
    if (text) {
      items.push(text);
    }
  });

  return items;
}

/**
 * Parse subsection with nested content
 */
function parseSubsection(section: Element): SubsectionData {
  const title = cleanText(section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || '');
  const content: Array<{ type: 'paragraph' | 'list' | 'table'; content: string | string[] | TableData }> = [];

  // Process child elements
  const children = Array.from(section.children);
  for (const child of children) {
    if (child.tagName.match(/^H[1-6]$/)) {
      // Skip headers as they're used as titles
      continue;
    } else if (child.tagName === 'P') {
      const text = cleanText(child.textContent || '');
      if (text) {
        content.push({ type: 'paragraph', content: text });
      }
    } else if (child.tagName === 'UL' || child.tagName === 'OL') {
      const items = parseList(child);
      if (items.length > 0) {
        content.push({ type: 'list', content: items });
      }
    } else if (child.tagName === 'TABLE') {
      const tableData = parseTable(child);
      content.push({ type: 'table', content: tableData });
    }
  }

  return { title, content };
}

/**
 * Parse HTML section into structured JSON
 */
function parseHTMLSection(html: string): ParsedSection | null {
  if (!html || typeof html !== 'string') {
    return null;
  }

  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const section = document.querySelector('section') || document.body;

    if (!section) {
      return null;
    }

    const title = cleanText(section.querySelector('h1')?.textContent || '');
    const content: Array<{
      type: 'paragraph' | 'list' | 'table' | 'subsection';
      content: string | string[] | TableData | SubsectionData;
    }> = [];

    // Get all direct children of the section
    const children = Array.from(section.children);
    
    for (const child of children) {
      if (child.tagName.match(/^H[1-6]$/) && child !== section.querySelector('h1')) {
        // This is a subsection header - look for following content until next header
        const subsectionElements = [child];
        let nextSibling = child.nextElementSibling;
        
        while (nextSibling && !nextSibling.tagName.match(/^H[1-6]$/)) {
          subsectionElements.push(nextSibling);
          nextSibling = nextSibling.nextElementSibling;
        }

        // Create a temporary container for the subsection
        const tempDiv = document.createElement('div');
        subsectionElements.forEach(el => tempDiv.appendChild(el.cloneNode(true)));
        
        const subsectionData = parseSubsection(tempDiv);
        if (subsectionData.title || subsectionData.content.length > 0) {
          content.push({ type: 'subsection', content: subsectionData });
        }
      } else if (child.tagName === 'P') {
        const text = cleanText(child.textContent || '');
        if (text) {
          content.push({ type: 'paragraph', content: text });
        }
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        const items = parseList(child);
        if (items.length > 0) {
          content.push({ type: 'list', content: items });
        }
      } else if (child.tagName === 'TABLE') {
        const tableData = parseTable(child);
        content.push({ type: 'table', content: tableData });
      } else if (child.tagName === 'DIV' && child.classList.contains('Section')) {
        // Handle nested sections
        const subsectionData = parseSubsection(child);
        if (subsectionData.title || subsectionData.content.length > 0) {
          content.push({ type: 'subsection', content: subsectionData });
        }
      }
    }

    return { title: title || undefined, content };
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return null;
  }
}

/**
 * Process all HTML fields in drug data and convert to structured JSON
 */
function processHTMLFields(obj: any): any {
  if (typeof obj === 'string' && obj.includes('<') && obj.includes('>')) {
    // This looks like HTML, try to parse it
    const parsed = parseHTMLSection(obj);
    return parsed || obj; // Return parsed data or original if parsing fails
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => processHTMLFields(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const processedObject: any = {};
    for (const [key, value] of Object.entries(obj)) {
      processedObject[key] = processHTMLFields(value);
    }
    return processedObject;
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
    console.log('Usage: npx tsx scripts/html-to-json.ts 001');
    return;
  }

  // File paths
  const dataDir = path.join(process.cwd(), 'data');
  const sanitizedDir = path.join(dataDir, 'sanitized');
  const jsonDir = path.join(dataDir, 'json');
  
  const inputFileName = `chunk_${chunkNumber}.json`;
  const inputFile = path.join(sanitizedDir, inputFileName);
  const outputFile = path.join(jsonDir, inputFileName);
  
  console.log(`📖 Reading ${inputFileName} from sanitized directory...`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    return;
  }
  
  // Create output directory if needed
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }
  
  const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  console.log(`  📊 ${originalData.length} drug(s) found`);
  
  console.log(`\n🔄 Converting HTML to structured JSON...`);
  const processedData = processHTMLFields(originalData);
  
  console.log(`\n💾 Saving structured JSON data...`);
  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2), 'utf-8');
  
  console.log(`  ✅ Saved to ${outputFile}`);
  console.log(`\n🎉 HTML to JSON conversion complete!`);
}

main();