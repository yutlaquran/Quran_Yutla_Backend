# Quran Hafs Data Migration Guide

This guide explains how to migrate from external Quran API to local database using Hafs Quran data.

## Overview

The migration includes:

- ✅ TypeORM entities for Surahs and Ayahs
- ✅ Database repository for data access
- ✅ Service layer compatible with existing API
- ✅ Data conversion from original Hafs SQL format
- ✅ Module configuration updates

## Files Created

### Entities

- `src/modules/quran/entities/surah.entity.ts` - Surah entity with metadata
- `src/modules/quran/entities/ayah.entity.ts` - Ayah entity with text and positioning

### Services & Repository

- `src/modules/quran/quran.repository.ts` - Database access layer
- `src/modules/quran/quran-data.service.ts` - Database-based service (replaces API calls)

### Migration Files

- `migrations/1754920000000-add-hafs-quran-data.ts` - TypeORM migration (creates tables and indexes)
- `migrations/converted-hafs-data.sql` - Converted Hafs data (6,236 ayahs)
- `migrations/convert-hafs-data.js` - Conversion script

## Column Mapping

The original Hafs data columns are mapped as follows:

| Original Column   | New Column              | Description                     |
| ----------------- | ----------------------- | ------------------------------- |
| `id`              | `id`                    | Primary key                     |
| `jozz`            | `juz`                   | Juz number (1-30)               |
| `page`            | `page`                  | Mushaf page number              |
| `sura_no`         | `surah_number`          | Surah number (1-114)            |
| `sura_name_en`    | Used for Surah metadata | English name                    |
| `sura_name_ar`    | Used for Surah metadata | Arabic name                     |
| `aya_no`          | `number_in_surah`       | Ayah number within surah        |
| `aya_text`        | `text`                  | Original Arabic text            |
| `aya_text_emlaey` | `text_emlaey`           | Simplified spelling text        |
| `line_start`      | `line_start`            | Starting line on page           |
| `line_end`        | `line_end`              | Ending line on page             |
| -                 | `number`                | Global ayah number (calculated) |
| -                 | `hizb_quarter`          | Hizb quarter (to be added)      |
| -                 | `sajda`                 | Prostration ayah flag           |

## Migration Steps

### 1. Run TypeORM Migration

```bash
# Generate and run the migration
npm run typeorm:migration:run
```

### 2. Import Hafs Data

```bash
# Import the converted Hafs data
psql -d your_database -f migrations/converted-hafs-data.sql
```

### 3. Verify Data Import

```sql
-- Check total counts
SELECT
    COUNT(*) as total_ayahs,
    COUNT(DISTINCT surah_number) as total_surahs,
    MIN(juz) as min_juz,
    MAX(juz) as max_juz
FROM ayahs;

-- Should return: 6236 ayahs, 114 surahs, juz 1-30

-- Check surah completeness
SELECT
    s.number as surah_number,
    s.name as surah_name,
    s.number_of_ayahs as expected_ayahs,
    COUNT(a.id) as actual_ayahs
FROM surahs s
LEFT JOIN ayahs a ON s.number = a.surah_number
GROUP BY s.number, s.name, s.number_of_ayahs
HAVING s.number_of_ayahs != COUNT(a.id)
ORDER BY s.number;

-- Should return empty result if all surahs are complete
```

## Usage

### Using the Database Service

```typescript
// Inject the new database service
constructor(
  private readonly quranDataService: QuranDataService,
) {}

// Replace API calls with database calls
// Old: this.quranService.getSurah(1)
// New: this.quranDataService.getSurah(1)

// All methods maintain the same interface:
await this.quranDataService.getSurah(1);
await this.quranDataService.getJuz(1);
await this.quranDataService.getAyah(1);
await this.quranDataService.searchQuran('البقرة');
```

### API Endpoints Remain the Same

No changes required to controllers or API consumers - all endpoints maintain the same response format.

## Performance Considerations

### Indexes Created

- `idx_ayahs_surah_number` - For surah-based queries
- `idx_ayahs_juz` - For juz-based queries
- `idx_ayahs_page` - For page-based queries
- `idx_ayahs_number` - For global ayah number queries
- `idx_ayahs_text_search` - Full-text search on Arabic text
- `idx_ayahs_text_emlaey_search` - Full-text search on simplified text

### Query Optimization

- Database queries are optimized for pagination
- Text search uses PostgreSQL's full-text search capabilities
- Foreign key relationships ensure data integrity

## Rollback Plan

To rollback to external API:

1. Switch service injection back to `QuranService`
2. Keep entities and tables for future use
3. No data loss - external API remains available

## Data Integrity

### Sajda Ayahs

The following ayahs are marked with `sajda = TRUE`:

- Surah 7, Ayah 206 (Al-A'raf)
- Surah 13, Ayah 15 (Ar-Ra'd)
- Surah 16, Ayah 50 (An-Nahl)
- Surah 17, Ayah 109 (Al-Isra)
- Surah 19, Ayah 58 (Maryam)
- Surah 22, Ayah 18 & 77 (Al-Hajj)
- Surah 25, Ayah 60 (Al-Furqan)
- Surah 27, Ayah 26 (An-Naml)
- Surah 32, Ayah 15 (As-Sajda)
- Surah 38, Ayah 24 (Sad)
- Surah 41, Ayah 38 (Fussilat)
- Surah 53, Ayah 62 (An-Najm)
- Surah 84, Ayah 21 (Al-Inshiqaq)
- Surah 96, Ayah 19 (Al-Alaq)

### Global Ayah Numbering

- Total ayahs: 6,236
- Calculated based on cumulative count across surahs
- Function `calculate_global_ayah_number()` handles the calculation

## Testing

```bash
# Test the migration
npm run test

# Test specific Quran functionality
npm run test -- --grep "Quran"
```

## Troubleshooting

### Common Issues

1. **Migration fails**: Check PostgreSQL version supports full-text search
2. **Data import fails**: Ensure proper encoding for Arabic text (UTF-8)
3. **Performance issues**: Check if indexes were created successfully

### Verification Queries

```sql
-- Check if all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('surahs', 'ayahs');

-- Check if indexes exist
SELECT indexname FROM pg_indexes WHERE tablename IN ('surahs', 'ayahs');

-- Test full-text search
SELECT COUNT(*) FROM ayahs WHERE to_tsvector('arabic', text) @@ to_tsquery('arabic', 'الله');
```
