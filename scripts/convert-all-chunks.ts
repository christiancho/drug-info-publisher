#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Convert all chunks from HTML to structured JSON
 */
async function main() {
  console.log('🚀 Starting batch conversion of all chunks from HTML to structured JSON...');

  const dataDir = path.join(process.cwd(), 'data');
  
  // Check if data directory exists
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Data directory not found!');
    process.exit(1);
  }

  // Find all chunk files in the data directory
  const files = fs.readdirSync(dataDir);
  const chunkFiles = files
    .filter(file => file.match(/^chunk_\d+\.json$/))
    .sort();

  if (chunkFiles.length === 0) {
    console.error('❌ No chunk files found in data directory!');
    process.exit(1);
  }

  const chunks = chunkFiles.map(file => file.match(/chunk_(\d+)\.json$/)?.[1]).filter(Boolean);
  console.log(`📋 Found chunks: ${chunks.join(', ')}`);

  let successCount = 0;
  const totalCount = chunks.length;

  // Process each chunk
  for (const chunk of chunks) {
    console.log('');
    console.log(`📦 Processing chunk ${chunk}...`);
    
    try {
      execSync(`npx tsx scripts/sanitize-data.ts ${chunk}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      successCount++;
      console.log(`✅ Chunk ${chunk} processed successfully`);
    } catch (error) {
      console.error(`❌ Failed to process chunk ${chunk}`);
      console.error(error);
    }
  }

  console.log('');
  console.log('🎉 Batch conversion complete!');
  console.log(`📊 Successfully processed: ${successCount}/${totalCount} chunks`);

  if (successCount === totalCount) {
    console.log('✅ All chunks converted successfully!');
  } else {
    console.log('⚠️  Some chunks failed to convert');
    process.exit(1);
  }
}

main().catch(console.error);