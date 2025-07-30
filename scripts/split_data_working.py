#!/usr/bin/env python3
import json
import os
import math
from pathlib import Path

def split_json_files():
    data_dir = Path("data")
    
    # Read all drugs from existing files
    all_drugs = []
    
    print("Reading existing chunk files...")
    for i in range(1, 17):  # chunk_1.json to chunk_16.json
        file_path = data_dir / f"chunk_{i}.json"
        if file_path.exists():
            print(f"Processing {file_path}...")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    raw_content = f.read().strip()
                    
                    # The file is a JSON-encoded string, so we need to decode it first
                    if raw_content.startswith('"') and raw_content.endswith('"'):
                        # Parse the outer JSON string to get the inner JSON string
                        json_string = json.loads(raw_content)
                        
                        # Now parse the inner JSON string to get the actual data
                        drugs = json.loads(json_string)
                        
                        if isinstance(drugs, list):
                            all_drugs.extend(drugs)
                            print(f"  ✓ Added {len(drugs)} drugs from {file_path}")
                        else:
                            print(f"  ✗ Parsed content is not a list: {type(drugs)}")
                    else:
                        print(f"  ✗ File doesn't have expected JSON string format")
                        
            except json.JSONDecodeError as e:
                print(f"  ✗ JSON decode error in {file_path}: {e}")
                # Let's try a different approach - read as bytes and decode manually
                try:
                    with open(file_path, 'rb') as f:
                        raw_bytes = f.read()
                        # Convert to string and remove outer quotes
                        content_str = raw_bytes.decode('utf-8').strip()
                        if content_str.startswith('"') and content_str.endswith('"'):
                            # Use raw string literals to avoid escape issues
                            inner_json = content_str[1:-1].encode().decode('unicode_escape')
                            drugs = json.loads(inner_json)
                            if isinstance(drugs, list):
                                all_drugs.extend(drugs)
                                print(f"  ✓ (Fallback) Added {len(drugs)} drugs from {file_path}")
                except Exception as e2:
                    print(f"  ✗ Fallback also failed for {file_path}: {e2}")
            except Exception as e:
                print(f"  ✗ Error processing {file_path}: {e}")
    
    total_drugs = len(all_drugs)
    print(f"\nTotal drugs collected: {total_drugs}")
    
    if total_drugs == 0:
        print("No drugs found. Exiting.")
        return
    
    # Calculate drugs per chunk for 80 files
    drugs_per_chunk = math.ceil(total_drugs / 80)
    print(f"Drugs per chunk (80 files): {drugs_per_chunk}")
    
    # Create backup directory for original files
    backup_dir = data_dir / "original_chunks"
    backup_dir.mkdir(exist_ok=True)
    
    # Move original files to backup
    print("\nBacking up original files...")
    for i in range(1, 17):
        original_file = data_dir / f"chunk_{i}.json"
        if original_file.exists():
            backup_file = backup_dir / f"chunk_{i}.json"
            if not backup_file.exists():  # Don't overwrite existing backups
                original_file.rename(backup_file)
                print(f"  Moved {original_file} to {backup_file}")
            else:
                original_file.unlink()  # Delete original since backup exists
                print(f"  Deleted {original_file} (backup already exists)")
    
    # Split into 80 new files
    print(f"\nCreating 80 new chunk files...")
    files_created = 0
    for i in range(80):
        start_idx = i * drugs_per_chunk
        end_idx = min(start_idx + drugs_per_chunk, total_drugs)
        
        if start_idx >= total_drugs:
            break
            
        chunk_drugs = all_drugs[start_idx:end_idx]
        
        # Use 3-digit numbering for proper sorting
        chunk_filename = data_dir / f"chunk_{i+1:03d}.json"
        
        with open(chunk_filename, 'w', encoding='utf-8') as f:
            json.dump(chunk_drugs, f, indent=2, ensure_ascii=False)
        
        files_created += 1
        print(f"  Created {chunk_filename} with {len(chunk_drugs)} drugs")
    
    print(f"\n✅ Successfully split {total_drugs} drugs into {files_created} files!")
    print(f"Each file contains approximately {drugs_per_chunk} drugs")
    print(f"Original files backed up to: {backup_dir}")

if __name__ == "__main__":
    split_json_files()