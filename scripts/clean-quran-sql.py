#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to clean Quran SQL file by removing end-of-ayah markers
These Unicode symbols (ﰀ ﰁ ﰂ etc.) are not part of the Quran text
"""

import re
import sys

def clean_sql_file(input_file, output_file):
    """Remove end-of-ayah markers from SQL file"""
    
    # Define the Unicode range for end-of-ayah markers
    # These are in the Arabic Presentation Forms-A block (U+FB50 to U+FDFF)
    # Specifically U+FC00 onwards
    ayah_markers_pattern = r'[\uFC00-\uFDFF]'
    
    print(f"Reading {input_file}...")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_lines = content.count('\n')
        print(f"Original file: {original_lines} lines")
        
        # Remove the ayah markers
        cleaned_content = re.sub(ayah_markers_pattern, '', content)
        
        # Count how many markers were removed
        markers_removed = len(re.findall(ayah_markers_pattern, content))
        print(f"Removed {markers_removed} end-of-ayah markers")
        
        # Write cleaned content
        print(f"Writing to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        
        print(f"✅ Success! Cleaned file saved to: {output_file}")
        print(f"Total ayahs cleaned: {markers_removed}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_file = r"e:\Halim\freelancer\Quran-Yutla\hafsData_v2-0.sql"
    output_file = r"e:\Halim\freelancer\Quran-Yutla\hafsData_v2-0-clean.sql"
    
    clean_sql_file(input_file, output_file)
