#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface FileChecksum {
  filename: string;
  size: number;
  modified: string;
  sha256: string;
}

interface ChecksumManifest {
  generated: string;
  totalFiles: number;
  totalSize: number;
  overallHash: string;
  files: FileChecksum[];
}

function generateFileChecksum(filePath: string): FileChecksum {
  const content = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);
  
  return {
    filename: path.basename(filePath),
    size: stats.size,
    modified: stats.mtime.toISOString(),
    sha256: crypto.createHash('sha256').update(content).digest('hex')
  };
}

function generateOverallHash(fileChecksums: FileChecksum[]): string {
  const combinedHashes = fileChecksums
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .map(f => f.sha256)
    .join('');
  
  return crypto.createHash('sha256').update(combinedHashes).digest('hex');
}

function generateChecksums(directory: string): ChecksumManifest {
  console.log(`📁 Scanning directory: ${directory}`);
  
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }
  
  const files = fs.readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(directory, file));
  
  console.log(`🔍 Found ${files.length} JSON files`);
  
  const fileChecksums: FileChecksum[] = [];
  let totalSize = 0;
  
  for (const file of files) {
    console.log(`  🔐 Processing ${path.basename(file)}...`);
    const checksum = generateFileChecksum(file);
    fileChecksums.push(checksum);
    totalSize += checksum.size;
  }
  
  const overallHash = generateOverallHash(fileChecksums);
  
  const manifest: ChecksumManifest = {
    generated: new Date().toISOString(),
    totalFiles: fileChecksums.length,
    totalSize,
    overallHash,
    files: fileChecksums
  };
  
  console.log(`✅ Generated checksums for ${manifest.totalFiles} files`);
  console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🔐 Overall hash: ${overallHash}`);
  
  return manifest;
}

function saveChecksumManifest(manifest: ChecksumManifest, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`💾 Saved checksum manifest to: ${outputPath}`);
}

function loadChecksumManifest(manifestPath: string): ChecksumManifest | null {
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading manifest: ${error.message}`);
    return null;
  }
}

function compareManifests(oldManifest: ChecksumManifest | null, newManifest: ChecksumManifest): {
  hasChanges: boolean;
  changedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
} {
  if (!oldManifest) {
    return {
      hasChanges: true,
      changedFiles: [],
      newFiles: newManifest.files.map(f => f.filename),
      deletedFiles: []
    };
  }
  
  const oldFiles = new Map(oldManifest.files.map(f => [f.filename, f]));
  const newFiles = new Map(newManifest.files.map(f => [f.filename, f]));
  
  const changedFiles: string[] = [];
  const newFilesList: string[] = [];
  const deletedFiles: string[] = [];
  
  // Check for new and changed files
  for (const [filename, newFile] of newFiles) {
    const oldFile = oldFiles.get(filename);
    if (!oldFile) {
      newFilesList.push(filename);
    } else if (oldFile.sha256 !== newFile.sha256) {
      changedFiles.push(filename);
    }
  }
  
  // Check for deleted files
  for (const filename of oldFiles.keys()) {
    if (!newFiles.has(filename)) {
      deletedFiles.push(filename);
    }
  }
  
  const hasChanges = changedFiles.length > 0 || newFilesList.length > 0 || deletedFiles.length > 0;
  
  return {
    hasChanges,
    changedFiles,
    newFiles: newFilesList,
    deletedFiles
  };
}

function main() {
  const sanitizedDir = path.join(process.cwd(), 'data', 'sanitized');
  const manifestPath = path.join(process.cwd(), 'data', 'checksums.json');
  
  console.log('🔐 Generating checksums for sanitized data...\n');
  
  try {
    // Load existing manifest
    const oldManifest = loadChecksumManifest(manifestPath);
    
    // Generate new checksums
    const newManifest = generateChecksums(sanitizedDir);
    
    // Compare manifests
    const comparison = compareManifests(oldManifest, newManifest);
    
    console.log('\n📊 Comparison Results:');
    if (!comparison.hasChanges) {
      console.log('✅ No changes detected');
    } else {
      console.log('🔄 Changes detected:');
      if (comparison.newFiles.length > 0) {
        console.log(`  ➕ New files: ${comparison.newFiles.join(', ')}`);
      }
      if (comparison.changedFiles.length > 0) {
        console.log(`  🔄 Changed files: ${comparison.changedFiles.join(', ')}`);
      }
      if (comparison.deletedFiles.length > 0) {
        console.log(`  ➖ Deleted files: ${comparison.deletedFiles.join(', ')}`);
      }
    }
    
    // Save new manifest
    saveChecksumManifest(newManifest, manifestPath);
    
    // Exit with appropriate code
    process.exit(comparison.hasChanges ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateChecksums, compareManifests, loadChecksumManifest, ChecksumManifest };