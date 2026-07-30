#!/usr/bin/env node

/**
 * Hafs Data Converter
 * Converts hafsData_v2-0-clean.sql to match our new schema.
 *
 * The clean file is the canonical source: end-of-ayah presentation glyphs
 * (U+FC00-U+FDFF) are stripped, since they are typography rather than text.
 */

const fs = require('fs');
const path = require('path');

// Two levels up: this script lives in scripts/quran-data/, the SQL is at the
// repository root. (The previous path resolved to scripts/, which never held
// the file — the script could not have run as written.)
const inputFile = path.join(__dirname, '..', '..', 'hafsData_v2-0-clean.sql');
const outputFile = path.join(__dirname, 'converted-hafs-data.sql');

console.log('Converting Hafs data to new schema...');
console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);

try {
  // Read the original SQL file
  const originalData = fs.readFileSync(inputFile, 'utf8');

  // Create the header for the converted file
  let convertedData = `-- Converted Hafs Data for New Schema
-- Generated automatically from ${path.basename(inputFile)}
-- Date: ${new Date().toISOString()}

-- Create temporary table to hold original data
CREATE TEMP TABLE IF NOT EXISTS temp_hafs_data (
    id INTEGER,
    jozz INTEGER,
    page INTEGER,
    sura_no INTEGER,
    sura_name_en VARCHAR(255),
    sura_name_ar VARCHAR(255),
    line_start INTEGER,
    line_end INTEGER,
    aya_no INTEGER,
    aya_text TEXT,
    aya_text_emlaey TEXT
);

-- Insert original data into temporary table
`;

  // Process each line
  const lines = originalData.split('\n');
  let insertCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (
      !trimmedLine ||
      trimmedLine.startsWith('--') ||
      trimmedLine.startsWith('/*')
    ) {
      continue;
    }

    // Convert INSERT statements
    if (trimmedLine.startsWith('INSERT INTO ``')) {
      insertCount++;

      // Replace the table name and column format
      const convertedLine = trimmedLine
        .replace('INSERT INTO ``', 'INSERT INTO temp_hafs_data')
        .replace(/`([^`]+)`/g, '$1'); // Remove backticks from column names

      convertedData += convertedLine + '\n';
    } else if (trimmedLine.startsWith('(') && insertCount > 0) {
      // This is a VALUES line, add it as is
      convertedData += trimmedLine + '\n';
    }
  }

  // Add the conversion logic
  convertedData += `
-- Convert temporary data to ayahs table
INSERT INTO ayahs (
    id,
    number, -- Will be calculated later
    text,
    text_emlaey,
    number_in_surah,
    juz,
    page,
    hizb_quarter,
    line_start,
    line_end,
    sajda,
    surah_number,
    created_at,
    updated_at
)
SELECT 
    id,
    0 as number, -- Temporary, will be updated by function
    aya_text as text,
    aya_text_emlaey as text_emlaey,
    aya_no as number_in_surah,
    jozz as juz,
    page,
    NULL as hizb_quarter,
    line_start,
    line_end,
    FALSE as sajda,
    sura_no as surah_number,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM temp_hafs_data
ORDER BY id;

-- Update global ayah numbers
SELECT update_global_ayah_numbers();

-- Update sajda ayahs
UPDATE ayahs SET sajda = TRUE WHERE 
    (surah_number = 7 AND number_in_surah = 206) OR  -- Al-A'raf
    (surah_number = 13 AND number_in_surah = 15) OR  -- Ar-Ra'd
    (surah_number = 16 AND number_in_surah = 50) OR  -- An-Nahl
    (surah_number = 17 AND number_in_surah = 109) OR -- Al-Isra
    (surah_number = 19 AND number_in_surah = 58) OR  -- Maryam
    (surah_number = 22 AND number_in_surah = 18) OR  -- Al-Hajj
    (surah_number = 22 AND number_in_surah = 77) OR  -- Al-Hajj
    (surah_number = 25 AND number_in_surah = 60) OR  -- Al-Furqan
    (surah_number = 27 AND number_in_surah = 26) OR  -- An-Naml
    (surah_number = 32 AND number_in_surah = 15) OR  -- As-Sajda
    (surah_number = 38 AND number_in_surah = 24) OR  -- Sad
    (surah_number = 41 AND number_in_surah = 38) OR  -- Fussilat
    (surah_number = 53 AND number_in_surah = 62) OR  -- An-Najm
    (surah_number = 84 AND number_in_surah = 21) OR  -- Al-Inshiqaq
    (surah_number = 96 AND number_in_surah = 19);    -- Al-Alaq

-- Clean up temporary table
DROP TABLE temp_hafs_data;

-- Verification queries
SELECT 
    COUNT(*) as total_ayahs,
    COUNT(DISTINCT surah_number) as total_surahs,
    MIN(juz) as min_juz,
    MAX(juz) as max_juz,
    MIN(page) as min_page,
    MAX(page) as max_page
FROM ayahs;

SELECT 'Hafs data conversion completed successfully!' as status;
`;

  // Write the converted file
  fs.writeFileSync(outputFile, convertedData);

  console.log(`✅ Conversion completed successfully!`);
  console.log(`📄 Processed ${insertCount} INSERT statements`);
  console.log(`📁 Output saved to: ${outputFile}`);
  console.log(`
Next steps:
1. Run the base migration: 1754920000000-add-hafs-quran-data.sql
2. Run the converted data script: converted-hafs-data.sql
3. Update your quran.module.ts to include the new entities
    `);
} catch (error) {
  console.error('❌ Error converting file:', error.message);
  process.exit(1);
}
