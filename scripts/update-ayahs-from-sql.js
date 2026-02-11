#!/usr/bin/env node
/**
 * Script to update ayahs table with clean Quran text
 */

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, '..', 'hafsData_v2-0-clean.sql');

console.log('📖 Reading clean SQL file...');

const content = fs.readFileSync(sqlFile, 'utf8');
const lines = content.split('\n').filter(l => l.trim().startsWith('INSERT'));

console.log(`✅ Found ${lines.length} ayahs`);

// Parse SQL INSERT and extract values
const updates = [];
const regex = /VALUES \((\d+),(\d+),(\d+),(\d+),'([^']+)','([^']+)',(\d+),(\d+),(\d+),'([^']+)','([^']+)'\)/;

lines.forEach((line, index) => {
  const match = line.match(regex);
  if (match) {
    const [, id, juz, page, suraNo, suraNameEn, suraNameAr, lineStart, lineEnd, ayaNo, ayaText, ayaTextEmlaey] = match;
    
    // Escape single quotes for SQL
    const escapedAyaText = ayaText.replace(/'/g, "''");
    const escapedAyaTextEmlaey = ayaTextEmlaey.replace(/'/g, "''");
    
    updates.push(
      `UPDATE ayahs SET text = '${escapedAyaText}', text_emlaey = '${escapedAyaTextEmlaey}' WHERE id = ${id};`
    );
  } else {
    console.log(`⚠️  Warning: Could not parse line ${index + 1}`);
  }
});

console.log(`📝 Generated ${updates.length} UPDATE statements`);

// Write to file
const outputFile = path.join(__dirname, '..', 'update-ayahs-clean.sql');
fs.writeFileSync(outputFile, updates.join('\n'), 'utf8');

console.log(`✅ Update SQL file created: update-ayahs-clean.sql`);
console.log('📌 To apply updates, run this SQL file in your database');
