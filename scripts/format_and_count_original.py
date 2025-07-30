#!/usr/bin/env python3
import json
import re
from pathlib import Path

def format_and_count_original():
    original_file = Path("data/original.json")
    
    if not original_file.exists():
        print("original.json not found")
        return
    
    print("Reading original.json...")
    try:
        with open(original_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"File size: {len(content)} characters")
        
        # Try to parse as JSON first
        try:
            data = json.loads(content)
            print(f"✓ Successfully parsed as JSON: {len(data)} drugs")
            
            # Create formatted backup
            formatted_file = Path("data/original_formatted.json")
            with open(formatted_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"✓ Created formatted version: {formatted_file}")
            
            # Show first few drugs
            print("\nFirst few drugs in original.json:")
            for i, drug in enumerate(data[:5]):
                print(f"  {i+1}. {drug.get('drugName', 'Unknown')} ({drug.get('label', {}).get('genericName', 'N/A')})")
            if len(data) > 5:
                print(f"  ... and {len(data) - 5} more")
                
            return len(data)
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            print("Trying to extract drug names with regex...")
            
            # Use regex to find drug names
            drug_pattern = r'"drugName":\s*"([^"]+)"'
            drugs = re.findall(drug_pattern, content)
            print(f"Found {len(drugs)} drug names via regex:")
            
            for i, drug in enumerate(drugs[:10]):
                print(f"  {i+1}. {drug}")
            if len(drugs) > 10:
                print(f"  ... and {len(drugs) - 10} more")
            
            # Try to fix the JSON by finding where it might have been truncated
            print(f"\nLast 200 characters of file:")
            print(repr(content[-200:]))
            
            # Check if we can find complete drug objects
            complete_objects = content.count('{"drugName"')
            print(f"Found {complete_objects} potential complete drug objects")
            
            return len(drugs)
            
    except Exception as e:
        print(f"Error reading file: {e}")
        return 0

if __name__ == "__main__":
    count = format_and_count_original()
    print(f"\nTotal drugs found: {count}")