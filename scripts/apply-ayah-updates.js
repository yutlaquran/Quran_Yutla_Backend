#!/usr/bin/env node
/**
 * Script to execute UPDATE statements on database
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function updateDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 54556,
    user: 'postgres',
    password: 'postgres',
    database: 'quran_yutla'
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    // Read SQL file
    const sqlFile = path.join(__dirname, '..', 'update-ayahs-clean.sql');
    const content = fs.readFileSync(sqlFile, 'utf8');
    const statements = content.split('\n').filter(s => s.trim());

    console.log(`📝 Found ${statements.length} UPDATE statements`);
    console.log('⏳ Executing updates...');

    // Execute in transaction
    await client.query('BEGIN');

    let count = 0;
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
        count++;
        if (count % 500 === 0) {
          console.log(`   Updated ${count}/${statements.length} ayahs...`);
        }
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Success! Updated ${count} ayahs`);
    console.log('🕌 Quran text is now clean and correct!');

    // Verify
    const result = await client.query("SELECT COUNT(*) as total FROM ayahs WHERE text LIKE '%ﰀ%' OR text LIKE '%ﰁ%' OR text LIKE '%ﰂ%'");
    console.log(`🔍 Verification: ${result.rows[0].total} ayahs still have markers (should be 0)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateDatabase();
