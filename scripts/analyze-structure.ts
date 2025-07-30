import * as fs from 'fs';

function analyzeStructure(obj: any, path: string = '', depth: number = 0): void {
  if (depth > 10) return; // Prevent infinite recursion
  
  const indent = '  '.repeat(depth);
  
  if (typeof obj === 'string') {
    const hasInvisibleChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/.test(obj);
    const length = obj.length;
    console.log(`${indent}${path}: string (${length} chars)${hasInvisibleChars ? ' ⚠️ HAS INVISIBLE CHARS' : ''}`);
    
    if (hasInvisibleChars) {
      const problemChars = obj.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g) || [];
      const uniqueChars = [...new Set(problemChars)];
      console.log(`${indent}  Problem chars: ${uniqueChars.map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(', ')}`);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      console.log(`${indent}${path}: array (${obj.length} items)`);
      obj.forEach((item, index) => {
        analyzeStructure(item, `${path}[${index}]`, depth + 1);
      });
    } else {
      console.log(`${indent}${path}: object`);
      Object.keys(obj).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        analyzeStructure(obj[key], newPath, depth + 1);
      });
    }
  } else {
    console.log(`${indent}${path}: ${typeof obj} (${obj})`);
  }
}

const data = JSON.parse(fs.readFileSync('data/chunk_001.json', 'utf-8'));
console.log('Analyzing structure of chunk_001.json...\n');
analyzeStructure(data, 'root');