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
                    content = f.read().strip()
                    
                    # Handle different formats
                    drugs = None
                    
                    # Try parsing as direct JSON array first
                    try:
                        drugs = json.loads(content)
                        if isinstance(drugs, list):
                            print(f"  Direct JSON array with {len(drugs)} items")
                        else:
                            drugs = None
                    except:
                        pass
                    
                    # If that fails, try parsing as JSON-encoded string
                    if drugs is None:
                        try:
                            # Remove leading/trailing quotes if present
                            if content.startswith('"') and content.endswith('"'):
                                json_string = json.loads(content)
                                drugs = json.loads(json_string)
                                if isinstance(drugs, list):
                                    print(f"  JSON-encoded string with {len(drugs)} items")
                                else:
                                    drugs = None
                        except:
                            pass
                    
                    # If still no luck, try removing quotes and parsing
                    if drugs is None:
                        try:
                            if content.startswith('"'):
                                # Remove outer quotes and unescape
                                unquoted = content[1:-1].replace('\\"', '"').replace('\\n', '\n').replace('\\\\', '\\')
                                drugs = json.loads(unquoted)
                                if isinstance(drugs, list):
                                    print(f"  Manually unescaped with {len(drugs)} items")
                                else:
                                    drugs = None
                        except:
                            pass
                    
                    if drugs and isinstance(drugs, list):
                        all_drugs.extend(drugs)
                        print(f"  ✓ Added {len(drugs)} drugs from {file_path}")
                    else:
                        print(f"  ✗ Could not parse {file_path} - content type: {type(drugs)}")
                        
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
    for i in range(80):
        start_idx = i * drugs_per_chunk
        end_idx = min(start_idx + drugs_per_chunk, total_drugs)
        
        if start_idx >= total_drugs:
            break
            
        chunk_drugs = all_drugs[start_idx:end_idx]
        
        # Pad with leading zeros for proper sorting
        chunk_filename = data_dir / f"chunk_{i+1:03d}.json"
        
        with open(chunk_filename, 'w', encoding='utf-8') as f:
            json.dump(chunk_drugs, f, indent=2, ensure_ascii=False)
        
        print(f"  Created {chunk_filename} with {len(chunk_drugs)} drugs")
    
    print(f"\n✓ Successfully split {total_drugs} drugs into 80 files!")
    print(f"Each file contains approximately {drugs_per_chunk} drugs")
    print(f"Original files backed up to: {backup_dir}")

if __name__ == "__main__":
    split_json_files()