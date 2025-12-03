# Migration from Surah/Ayah Pairs to Absolute Ayah Numbers

## Overview

This migration updates the Jalsa Template system from using separate surah and ayah number pairs to using absolute ayah numbers (1-6236) for referencing Quranic verses.

## Changes Made

### 1. Entity Changes (`jalsa-template.entity.ts`)

**Before:**

- `fromSurah`, `fromAyah`, `toSurah`, `toAyah`
- `memFromSurah`, `memFromAyah`, `memToSurah`, `memToAyah`
- `nearPastFromSurah`, `nearPastFromAyah`, `nearPastToSurah`, `nearPastToAyah`
- `farPastFromSurah`, `farPastFromAyah`, `farPastToSurah`, `farPastToAyah`

**After:**

- `fromAyah`, `toAyah` (absolute ayah numbers)
- `memFromAyah`, `memToAyah` (absolute ayah numbers)
- `nearPastFromAyah`, `nearPastToAyah` (absolute ayah numbers)
- `farPastFromAyah`, `farPastToAyah` (absolute ayah numbers)

### 2. CSV File Changes

**Old CSV Structure:**

```csv
fromSurah,fromAyah,toSurah,toAyah,MemFromSurah,MemFromAyah,MemToSurah,MemToAyah,NearPastFromSurah,NearPastFromAyah,NearPastToSurah,NearPastToAyah,FarPastFromSurah,FarPastFromAyah,FarPastToSurah,FarPastToAyah
1,1,1,5,1,6,1,7,**,**,**,**,**,**,**,**
```

**New CSV Structure:**

```csv
fromAyah,toAyah,MemFromAyah,MemToAyah,NearPastFromAyah,NearPastToAyah,FarPastFromAyah,FarPastToAyah
,1,5,6,7,,,,
1,5,6231,6236,,,,
```

### 3. Service Changes

#### `jalsa-template-seeder.service.ts`

- Updated CSV interface to use absolute ayah numbers
- Modified CSV parsing logic to handle new format
- Updated validation to check ayah numbers (1-6236) instead of surah numbers (1-114)
- Changed CSV directory path from `data/csv` to `data/csv/new`

#### `jalsa-template.service.ts`

- Removed `getAyahId()` method (no longer needed)
- Added `getAyahDetailsById()` method for absolute ayah lookups
- Updated jalsa generation to directly use absolute ayah IDs
- Simplified ayah assignment logic (no more surah/ayah conversion)

#### `riwaq-type.enum.ts`

- Updated `CsvFileToRiwaqType` mapping to use new CSV file names
- Changed from `old-azhar-riwaqs-*.csv` to `jalsa_templates_seeding-*.csv`

### 4. Database Migration

Created migration `1755555555555-UpdateJalsaTemplateToAbsoluteAyahs.ts`:

- Drops old jalsa_templates table structure
- Creates new table with absolute ayah columns only
- Maintains indexes and constraints

## Benefits

1. **Simplified Logic**: No need to convert between surah/ayah pairs and absolute IDs
2. **Better Performance**: Direct ayah ID assignment without database lookups
3. **Cleaner Code**: Reduced complexity in template processing
4. **Data Integrity**: Direct reference to ayah IDs ensures consistency

## File Locations

### CSV Files

- **Old Format**: `data/csv/old/old-azhar-riwaqs-*.csv`
- **New Format**: `data/csv/new/jalsa_templates_seeding-*.csv`

### Updated Files

- `src/modules/jalsa/entities/jalsa-template.entity.ts`
- `src/modules/jalsa/services/jalsa-template-seeder.service.ts`
- `src/modules/jalsa/services/jalsa-template.service.ts`
- `src/modules/riwaq/enums/riwaq-type.enum.ts`
- `migrations/1755555555555-UpdateJalsaTemplateToAbsoluteAyahs.ts`

## Migration Steps

1. Run the database migration to update table structure
2. Re-seed jalsa templates using the new CSV files
3. Test jalsa generation with new absolute ayah format
4. Verify ayah details are correctly retrieved using absolute IDs

## Validation Range

- **Absolute Ayah Numbers**: 1-6236 (total ayahs in Quran)
- **Previous Surah Numbers**: 1-114 (total surahs in Quran)

This migration streamlines the jalsa template system and aligns it with the absolute ayah numbering system used throughout the Quran database.
