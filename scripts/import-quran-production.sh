#!/bin/bash

# Production Quran Data Import with Progress Tracking
# This script imports data in small batches with individual commits

DB_HOST="57.128.59.32"
DB_PORT="31499"
DB_USER="alazhar_admin"
DB_NAME="alazhar_db"
DB_PASSWORD="alazhar@Opream1379"

echo "🚀 Starting Quran data import to production database..."
echo "📊 Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo ""

# Set password for non-interactive mode
export PGPASSWORD="$DB_PASSWORD"

# First, create the temporary table and conversion setup (if not exists)
echo "📋 Setting up temporary table..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
-- Create temporary table if not exists
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
"

# Count total lines in the source file to show progress
TOTAL_LINES=$(grep -c "INSERT INTO" ../hafsData_v2-0.sql)
echo "📄 Total ayahs to import: $TOTAL_LINES"
echo ""

# Process the original file line by line
CURRENT=0
BATCH_SIZE=50  # Commit every 50 inserts

echo "⚡ Starting import with batch size: $BATCH_SIZE"

# Read the original hafsData file and process in batches
while IFS= read -r line; do
    if [[ $line == INSERT\ INTO* ]]; then
        # Convert the INSERT statement
        CONVERTED_LINE=$(echo "$line" | sed 's/INSERT INTO ``/INSERT INTO temp_hafs_data/' | sed 's/`\([^`]*\)`/\1/g')
        
        # Execute the insert
        echo "$CONVERTED_LINE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
        
        CURRENT=$((CURRENT + 1))
        
        # Commit every batch_size records
        if [ $((CURRENT % BATCH_SIZE)) -eq 0 ]; then
            # Move data from temp table to ayahs table for this batch
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            INSERT INTO ayahs (
                id, number, text, text_emlaey, number_in_surah, juz, page,
                hizb_quarter, line_start, line_end, sajda, surah_number,
                created_at, updated_at
            )
            SELECT 
                id, 0 as number, aya_text as text, aya_text_emlaey as text_emlaey,
                aya_no as number_in_surah, jozz as juz, page, NULL as hizb_quarter,
                line_start, line_end, FALSE as sajda, sura_no as surah_number,
                CURRENT_TIMESTAMP as created_at, CURRENT_TIMESTAMP as updated_at
            FROM temp_hafs_data;
            
            -- Clear temp table for next batch
            DELETE FROM temp_hafs_data;
            " > /dev/null 2>&1
            
            PERCENTAGE=$((CURRENT * 100 / TOTAL_LINES))
            echo "📈 Progress: $CURRENT/$TOTAL_LINES ($PERCENTAGE%) - Batch committed ✅"
        else
            # Show progress every 10 records
            if [ $((CURRENT % 10)) -eq 0 ]; then
                PERCENTAGE=$((CURRENT * 100 / TOTAL_LINES))
                echo "📊 Progress: $CURRENT/$TOTAL_LINES ($PERCENTAGE%)"
            fi
        fi
    fi
done < "../hafsData_v2-0.sql"

# Process any remaining records in the final batch
if [ -n "$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM temp_hafs_data;" | xargs)" ] && [ "$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM temp_hafs_data;" | xargs)" -gt 0 ]; then
    echo "📝 Processing final batch..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO ayahs (
        id, number, text, text_emlaey, number_in_surah, juz, page,
        hizb_quarter, line_start, line_end, sajda, surah_number,
        created_at, updated_at
    )
    SELECT 
        id, 0 as number, aya_text as text, aya_text_emlaey as text_emlaey,
        aya_no as number_in_surah, jozz as juz, page, NULL as hizb_quarter,
        line_start, line_end, FALSE as sajda, sura_no as surah_number,
        CURRENT_TIMESTAMP as created_at, CURRENT_TIMESTAMP as updated_at
    FROM temp_hafs_data;
    " > /dev/null 2>&1
fi

# Update global ayah numbers
echo "🔢 Updating global ayah numbers..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT update_global_ayah_numbers();" > /dev/null 2>&1

# Update sajda ayahs
echo "🕌 Marking sajda ayahs..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
UPDATE ayahs SET sajda = TRUE WHERE 
    (surah_number = 7 AND number_in_surah = 206) OR
    (surah_number = 13 AND number_in_surah = 15) OR
    (surah_number = 16 AND number_in_surah = 50) OR
    (surah_number = 17 AND number_in_surah = 109) OR
    (surah_number = 19 AND number_in_surah = 58) OR
    (surah_number = 22 AND number_in_surah = 18) OR
    (surah_number = 22 AND number_in_surah = 77) OR
    (surah_number = 25 AND number_in_surah = 60) OR
    (surah_number = 27 AND number_in_surah = 26) OR
    (surah_number = 32 AND number_in_surah = 15) OR
    (surah_number = 38 AND number_in_surah = 24) OR
    (surah_number = 41 AND number_in_surah = 38) OR
    (surah_number = 53 AND number_in_surah = 62) OR
    (surah_number = 84 AND number_in_surah = 21) OR
    (surah_number = 96 AND number_in_surah = 19);
" > /dev/null 2>&1

# Final verification
FINAL_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM ayahs;" | xargs)
SURAH_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM surahs;" | xargs)
SAJDA_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM ayahs WHERE sajda = TRUE;" | xargs)

echo ""
echo "🎉 Import completed successfully!"
echo "📊 Final Statistics:"
echo "   📖 Ayahs imported: $FINAL_COUNT"
echo "   📚 Surahs available: $SURAH_COUNT"
echo "   🕌 Sajda ayahs marked: $SAJDA_COUNT"
echo ""

if [ "$FINAL_COUNT" -eq 6236 ] && [ "$SURAH_COUNT" -eq 114 ]; then
    echo "✅ All data imported successfully!"
    echo "🚀 Your production database is ready with complete Quran data!"
else
    echo "⚠️  Warning: Expected 6236 ayahs and 114 surahs"
    echo "    Please check for any issues in the import process"
fi
