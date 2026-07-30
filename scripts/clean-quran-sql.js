#!/usr/bin/env node
/**
 * ⚠️ OBSOLETE — kept only as a record of how the clean file was produced.
 *
 * This generated hafsData_v2-0-clean.sql from the raw hafsData_v2-0.sql by
 * stripping end-of-ayah markers (ﰀ ﰁ ﰂ — U+FC00..U+FDFF), which are typography
 * rather than Quran text.
 *
 * The raw file is no longer kept in the repository: the clean file is now the
 * canonical source and is committed directly. Running this script will fail on
 * the missing input, which is expected. Do not "fix" it by pointing it at the
 * clean file — that would just rewrite the source onto itself.
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'hafsData_v2-0.sql');
const outputFile = path.join(__dirname, '..', 'hafsData_v2-0-clean.sql');

console.log('🔄 Reading SQL file...');

try {
  // Read the file
  const content = fs.readFileSync(inputFile, 'utf8');
  
  console.log(`📄 Original file: ${content.split('\n').length} lines`);
  
  // Define regex to match end-of-ayah markers
  // These are in Unicode range U+FC00 to U+FDFF (Arabic Presentation Forms-A)
  const ayahMarkersRegex = /[\uFC00-\uFDFF]/g;
  
  // Count markers before removal
  const markers = content.match(ayahMarkersRegex);
  const markersCount = markers ? markers.length : 0;
  
  console.log(`🔍 Found ${markersCount} end-of-ayah markers to remove`);
  
  // Remove the markers
  let cleanedContent = content.replace(ayahMarkersRegex, '');
  
  // Remove trailing spaces in Arabic text fields (before ','<text>')
  // This removes spaces at the end of aya_text field
  cleanedContent = cleanedContent.replace(/\s+','([^']+)'\)/g, "','$1')");
  
  console.log(`🧹 Cleaned trailing spaces from ayah text`);
  
  // Write cleaned content
  console.log(`💾 Writing cleaned file to: ${outputFile}`);
  fs.writeFileSync(outputFile, cleanedContent, 'utf8');
  
  console.log(`✅ Success! Cleaned ${markersCount} ayah markers`);
  console.log(`📝 Clean file saved: hafsData_v2-0-clean.sql`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
