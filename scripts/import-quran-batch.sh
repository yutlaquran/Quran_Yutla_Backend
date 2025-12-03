#!/bin/bash

# Production Quran Data Import with Batch Commits
# This script imports data in batches to show progress

DB_HOST="57.128.59.32"
DB_PORT="31499"
DB_USER="alazhar_admin"
DB_NAME="alazhar_db"
DB_PASSWORD="alazhar@Opream1379"

echo "🚀 Starting Quran data import to production database..."
echo "📊 Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo ""

# Set password for non-interactive mode
export PGPASSWORD="$DB_PASSWORD"

# Re-insert surahs data first
echo "📚 Inserting Surahs data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
INSERT INTO surahs (number, name, english_name, english_name_translation, revelation_type, number_of_ayahs) VALUES
(1, 'الفَاتِحة', 'Al-Fātiḥah', 'The Opening', 'Meccan', 7),
(2, 'البَقَرَة', 'Al-Baqarah', 'The Cow', 'Medinan', 286),
(3, 'آل عِمۡرَان', 'Āl ʿImrān', 'The Family of Imran', 'Medinan', 200),
(4, 'النِّسَاء', 'An-Nisāʾ', 'The Women', 'Medinan', 176),
(5, 'الۡمَائِدَة', 'Al-Māʾidah', 'The Table', 'Medinan', 120),
(6, 'الۡأَنۡعَام', 'Al-Anʿām', 'The Cattle', 'Meccan', 165),
(7, 'الۡأَعۡرَاف', 'Al-Aʿrāf', 'The Heights', 'Meccan', 206),
(8, 'الۡأَنۡفَال', 'Al-Anfāl', 'The Spoils of War', 'Medinan', 75),
(9, 'التَّوۡبَة', 'At-Tawbah', 'The Repentance', 'Medinan', 129),
(10, 'يُونُس', 'Yūnus', 'Jonah', 'Meccan', 109),
(11, 'هُود', 'Hūd', 'Hud', 'Meccan', 123),
(12, 'يُوسُف', 'Yūsuf', 'Joseph', 'Meccan', 111),
(13, 'الرَّعۡد', 'Ar-Raʿd', 'The Thunder', 'Medinan', 43),
(14, 'إِبۡرَاهِيم', 'Ibrāhīm', 'Abraham', 'Meccan', 52),
(15, 'الۡحِجۡر', 'Al-Ḥijr', 'The Rocky Tract', 'Meccan', 99),
(16, 'النَّحۡل', 'An-Naḥl', 'The Bee', 'Meccan', 128),
(17, 'الۡإِسۡرَاء', 'Al-Isrāʾ', 'The Night Journey', 'Meccan', 111),
(18, 'الۡكَهۡف', 'Al-Kahf', 'The Cave', 'Meccan', 110),
(19, 'مَرۡيَم', 'Maryam', 'Mary', 'Meccan', 98),
(20, 'طه', 'Ṭāhā', 'Ta-Ha', 'Meccan', 135),
(21, 'الۡأَنۡبِيَاء', 'Al-Anbiyāʾ', 'The Prophets', 'Meccan', 112),
(22, 'الۡحَجّ', 'Al-Ḥajj', 'The Pilgrimage', 'Medinan', 78),
(23, 'الۡمُؤۡمِنُون', 'Al-Muʾminūn', 'The Believers', 'Meccan', 118),
(24, 'النُّور', 'An-Nūr', 'The Light', 'Medinan', 64),
(25, 'الۡفُرۡقَان', 'Al-Furqān', 'The Criterion', 'Meccan', 77),
(26, 'الشُّعَرَاء', 'Ash-Shuʿarāʾ', 'The Poets', 'Meccan', 227),
(27, 'النَّمۡل', 'An-Naml', 'The Ant', 'Meccan', 93),
(28, 'الۡقَصَص', 'Al-Qaṣaṣ', 'The Stories', 'Meccan', 88),
(29, 'الۡعَنۡكَبُوت', 'Al-ʿAnkabūt', 'The Spider', 'Meccan', 69),
(30, 'الرُّوم', 'Ar-Rūm', 'The Byzantines', 'Meccan', 60),
(31, 'لُقۡمَان', 'Luqmān', 'Luqman', 'Meccan', 34),
(32, 'السَّجۡدَة', 'As-Sajdah', 'The Prostration', 'Meccan', 30),
(33, 'الۡأَحۡزَاب', 'Al-Aḥzāb', 'The Clans', 'Medinan', 73),
(34, 'سَبَإ', 'Sabaʾ', 'Sheba', 'Meccan', 54),
(35, 'فَاطِر', 'Fāṭir', 'The Creator', 'Meccan', 45),
(36, 'يس', 'Yāsīn', 'Ya-Sin', 'Meccan', 83),
(37, 'الصَّافَّات', 'Aṣ-Ṣāffāt', 'Those Who Set The Ranks', 'Meccan', 182),
(38, 'ص', 'Ṣād', 'The Letter Sad', 'Meccan', 88),
(39, 'الزُّمَر', 'Az-Zumar', 'The Troops', 'Meccan', 75),
(40, 'غَافِر', 'Ghāfir', 'The Forgiver', 'Meccan', 85),
(41, 'فُصِّلَت', 'Fuṣṣilat', 'Explained In Detail', 'Meccan', 54),
(42, 'الشُّورَىٰ', 'Ash-Shūrā', 'The Consultation', 'Meccan', 53),
(43, 'الزُّخۡرُف', 'Az-Zukhruf', 'The Ornaments of Gold', 'Meccan', 89),
(44, 'الدُّخَان', 'Ad-Dukhān', 'The Smoke', 'Meccan', 59),
(45, 'الۡجَاثِيَة', 'Al-Jāthiyah', 'The Crouching', 'Meccan', 37),
(46, 'الۡأَحۡقَاف', 'Al-Aḥqāf', 'The Wind-Curved Sandhills', 'Meccan', 35),
(47, 'مُحَمَّد', 'Muḥammad', 'Muhammad', 'Medinan', 38),
(48, 'الۡفَتۡح', 'Al-Fatḥ', 'The Victory', 'Medinan', 29),
(49, 'الۡحُجُرَات', 'Al-Ḥujurāt', 'The Rooms', 'Medinan', 18),
(50, 'ق', 'Qāf', 'The Letter Qaf', 'Meccan', 45),
(51, 'الذَّارِيَات', 'Adh-Dhāriyāt', 'The Winnowing Winds', 'Meccan', 60),
(52, 'الطُّور', 'Aṭ-Ṭūr', 'The Mount', 'Meccan', 49),
(53, 'النَّجۡم', 'An-Najm', 'The Star', 'Meccan', 62),
(54, 'الۡقَمَر', 'Al-Qamar', 'The Moon', 'Meccan', 55),
(55, 'الرَّحۡمَٰن', 'Ar-Raḥmān', 'The Beneficent', 'Meccan', 78),
(56, 'الۡوَاقِعَة', 'Al-Wāqiʿah', 'The Inevitable', 'Meccan', 96),
(57, 'الۡحَدِيد', 'Al-Ḥadīd', 'The Iron', 'Medinan', 29),
(58, 'الۡمُجَادِلَة', 'Al-Mujādilah', 'The Pleading Woman', 'Medinan', 22),
(59, 'الۡحَشۡر', 'Al-Ḥashr', 'The Exile', 'Medinan', 24),
(60, 'الۡمُمۡتَحَنَة', 'Al-Mumtaḥanah', 'She That Is To Be Examined', 'Medinan', 13),
(61, 'الصَّف', 'Aṣ-Ṣaff', 'The Ranks', 'Medinan', 14),
(62, 'الۡجُمُعَة', 'Al-Jumuʿah', 'The Congregation', 'Medinan', 11),
(63, 'الۡمُنَافِقُون', 'Al-Munāfiqūn', 'The Hypocrites', 'Medinan', 11),
(64, 'التَّغَابُن', 'At-Taghābun', 'The Mutual Disillusion', 'Medinan', 18),
(65, 'الطَّلَاق', 'Aṭ-Ṭalāq', 'The Divorce', 'Medinan', 12),
(66, 'التَّحۡرِيم', 'At-Taḥrīm', 'The Prohibition', 'Medinan', 12),
(67, 'الۡمُلۡك', 'Al-Mulk', 'The Sovereignty', 'Meccan', 30),
(68, 'الۡقَلَم', 'Al-Qalam', 'The Pen', 'Meccan', 52),
(69, 'الۡحَاقَّة', 'Al-Ḥāqqah', 'The Reality', 'Meccan', 52),
(70, 'الۡمَعَارِج', 'Al-Maʿārij', 'The Ascending Stairways', 'Meccan', 44),
(71, 'نُوح', 'Nūḥ', 'Noah', 'Meccan', 28),
(72, 'الۡجِنّ', 'Al-Jinn', 'The Jinn', 'Meccan', 28),
(73, 'الۡمُزَّمِّل', 'Al-Muzzammil', 'The Enshrouded One', 'Meccan', 20),
(74, 'الۡمُدَّثِّر', 'Al-Muddaththir', 'The Cloaked One', 'Meccan', 56),
(75, 'الۡقِيَامَة', 'Al-Qiyāmah', 'The Resurrection', 'Meccan', 40),
(76, 'الۡإِنۡسَان', 'Al-Insān', 'The Man', 'Medinan', 31),
(77, 'الۡمُرۡسَلَات', 'Al-Mursalāt', 'The Emissaries', 'Meccan', 50),
(78, 'النَّبَإ', 'An-Nabaʾ', 'The Tidings', 'Meccan', 40),
(79, 'النَّازِعَات', 'An-Nāziʿāt', 'Those Who Drag Forth', 'Meccan', 46),
(80, 'عَبَس', 'ʿAbasa', 'He Frowned', 'Meccan', 42),
(81, 'التَّكۡوِير', 'At-Takwīr', 'The Overthrowing', 'Meccan', 29),
(82, 'الۡإِنۡفِطَار', 'Al-Infiṭār', 'The Cleaving', 'Meccan', 19),
(83, 'الۡمُطَفِّفِين', 'Al-Muṭaffifīn', 'The Defrauding', 'Meccan', 36),
(84, 'الۡإِنۡشِقَاق', 'Al-Inshiqāq', 'The Sundering', 'Meccan', 25),
(85, 'الۡبُرُوج', 'Al-Burūj', 'The Mansions of the Stars', 'Meccan', 22),
(86, 'الطَّارِق', 'Aṭ-Ṭāriq', 'The Morning Star', 'Meccan', 17),
(87, 'الۡأَعۡلَىٰ', 'Al-Aʿlā', 'The Most High', 'Meccan', 19),
(88, 'الۡغَاشِيَة', 'Al-Ghāshiyah', 'The Overwhelming', 'Meccan', 26),
(89, 'الۡفَجۡر', 'Al-Fajr', 'The Dawn', 'Meccan', 30),
(90, 'الۡبَلَد', 'Al-Balad', 'The City', 'Meccan', 20),
(91, 'الشَّمۡس', 'Ash-Shams', 'The Sun', 'Meccan', 15),
(92, 'الَّيۡل', 'Al-Layl', 'The Night', 'Meccan', 21),
(93, 'الضُّحَىٰ', 'Aḍ-Ḍuḥā', 'The Morning Hours', 'Meccan', 11),
(94, 'الشَّرۡح', 'Ash-Sharḥ', 'The Consolation', 'Meccan', 8),
(95, 'التِّين', 'At-Tīn', 'The Fig', 'Meccan', 8),
(96, 'الۡعَلَق', 'Al-ʿAlaq', 'The Clot', 'Meccan', 19),
(97, 'الۡقَدۡر', 'Al-Qadr', 'The Power', 'Meccan', 5),
(98, 'الۡبَيِّنَة', 'Al-Bayyinah', 'The Evidence', 'Medinan', 8),
(99, 'الزَّلۡزَلَة', 'Az-Zalzalah', 'The Earthquake', 'Medinan', 8),
(100, 'الۡعَادِيَات', 'Al-ʿĀdiyāt', 'The Courser', 'Meccan', 11),
(101, 'الۡقَارِعَة', 'Al-Qāriʿah', 'The Calamity', 'Meccan', 11),
(102, 'التَّكَاثُر', 'At-Takāthur', 'The Rivalry In World Increase', 'Meccan', 8),
(103, 'الۡعَصۡر', 'Al-ʿAṣr', 'The Declining Day', 'Meccan', 3),
(104, 'الۡهُمَزَة', 'Al-Humazah', 'The Traducer', 'Meccan', 9),
(105, 'الۡفِيل', 'Al-Fīl', 'The Elephant', 'Meccan', 5),
(106, 'قُرَيۡش', 'Quraysh', 'Quraysh', 'Meccan', 4),
(107, 'الۡمَاعُون', 'Al-Māʿūn', 'The Small Kindness', 'Meccan', 7),
(108, 'الۡكَوۡثَر', 'Al-Kawthar', 'The Abundance', 'Meccan', 3),
(109, 'الۡكَافِرُون', 'Al-Kāfirūn', 'The Disbelievers', 'Meccan', 6),
(110, 'النَّصۡر', 'An-Naṣr', 'The Divine Support', 'Medinan', 3),
(111, 'الۡمَسَد', 'Al-Masad', 'The Palm Fiber', 'Meccan', 5),
(112, 'الۡإِخۡلَاص', 'Al-Ikhlāṣ', 'The Sincerity', 'Meccan', 4),
(113, 'الۡفَلَق', 'Al-Falaq', 'The Daybreak', 'Meccan', 5),
(114, 'النَّاس', 'An-Nās', 'The Mankind', 'Meccan', 6)
ON CONFLICT (number) DO NOTHING;
" > /dev/null 2>&1

echo "✅ Surahs inserted (114 surahs)"

# Now import ayahs using the existing converted file but in batches
echo "📖 Starting Ayahs import with progress tracking..."
echo ""

# Split the converted file into batches
BATCH_SIZE=100
TEMP_DIR="./temp_batches"
mkdir -p "$TEMP_DIR"

# Extract only the INSERT statements for ayahs
grep "INSERT INTO ayahs" scripts/quran-data/converted-hafs-data.sql > "$TEMP_DIR/ayahs_only.sql"

# Count total lines
TOTAL_LINES=$(wc -l < "$TEMP_DIR/ayahs_only.sql")
echo "📄 Total ayahs to import: $TOTAL_LINES"

# Split into batches
split -l $BATCH_SIZE "$TEMP_DIR/ayahs_only.sql" "$TEMP_DIR/batch_"

CURRENT_BATCH=0
TOTAL_BATCHES=$(ls "$TEMP_DIR"/batch_* | wc -l)

for batch_file in "$TEMP_DIR"/batch_*; do
    CURRENT_BATCH=$((CURRENT_BATCH + 1))
    BATCH_COUNT=$(wc -l < "$batch_file")
    
    echo "📦 Processing batch $CURRENT_BATCH/$TOTAL_BATCHES ($BATCH_COUNT records)..."
    
    # Execute the batch
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$batch_file" > /dev/null 2>&1
    
    # Check current progress
    CURRENT_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM ayahs;" | xargs)
    PERCENTAGE=$((CURRENT_COUNT * 100 / 6236))
    
    echo "✅ Batch $CURRENT_BATCH completed - Total ayahs: $CURRENT_COUNT/6236 ($PERCENTAGE%)"
    
    # Small delay to prevent overwhelming the database
    sleep 0.1
done

# Update global ayah numbers
echo ""
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

# Cleanup
rm -rf "$TEMP_DIR"

if [ "$FINAL_COUNT" -eq 6236 ] && [ "$SURAH_COUNT" -eq 114 ]; then
    echo "✅ All data imported successfully!"
    echo "🚀 Your production database is ready with complete Quran data!"
else
    echo "⚠️  Warning: Expected 6236 ayahs and 114 surahs"
    echo "    Please check for any issues in the import process"
fi
