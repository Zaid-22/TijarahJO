import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const locationsPath = path.join(scriptDir, 'seeds/baseline/BASELINE_LOCATIONS.sql');
const referencePath = path.join(scriptDir, 'seeds/baseline/BASELINE_REFERENCE_DATA.sql');
const outPath = path.join(scriptDir, 'migrations/V202605220001__repair_arabic_utf8_mojibake.sql');

const locations = fs.readFileSync(locationsPath, 'utf8');
const reference = fs.readFileSync(referencePath, 'utf8');

const categoriesMatch = reference.match(/MERGE dbo\.Categories[\s\S]*?^GO/m);
if (!categoriesMatch) {
  throw new Error('Categories MERGE not found in BASELINE_REFERENCE_DATA.sql');
}

let areasSection = locations
  .replace(/^[\s\S]*?^-- =+\r?\n-- 2\. Seed Areas[\s\S]*?\r?\n\r?\n/m, '')
  .replace(/\r?\nPRINT 'Baseline locations seed data completed\.';\r?\nGO\s*$/m, '')
  .replace(/^\s*GO\s*$/gm, '')
  .trim();

const indent = (sql) =>
  sql
    .split(/\r?\n/)
    .map((line) => (line.length ? `    ${line}` : ''))
    .join('\n');

const hero = `
    IF OBJECT_ID(N'dbo.HeroBanners', N'U') IS NOT NULL
    BEGIN
        UPDATE dbo.HeroBanners
        SET
            TitleAr = CASE DisplayOrder
                WHEN 0 THEN N'اشتري وبيع بسهولة'
                WHEN 1 THEN N'إلكترونيات مميزة'
                WHEN 2 THEN N'جدد بيتك'
                ELSE TitleAr
            END,
            SubtitleAr = CASE DisplayOrder
                WHEN 0 THEN N'انضم إلى أكبر سوق إلكتروني في الأردن اليوم.'
                WHEN 1 THEN N'خصومات تصل إلى 50٪ على أفضل العلامات التجارية.'
                WHEN 2 THEN N'أثاث عصري لكل غرفة.'
                ELSE SubtitleAr
            END,
            ButtonTextAr = CASE DisplayOrder
                WHEN 0 THEN N'ابدأ الآن'
                WHEN 1 THEN N'تسوق العروض'
                WHEN 2 THEN N'استكشف الأثاث'
                ELSE ButtonTextAr
            END,
            AltTextAr = CASE DisplayOrder
                WHEN 0 THEN N'اشتري وبيع بسهولة في الأردن'
                WHEN 1 THEN N'عروض الإلكترونيات'
                WHEN 2 THEN N'المنزل والأثاث'
                ELSE AltTextAr
            END
        WHERE DisplayOrder IN (0, 1, 2)
          AND ImageUrl IN (
              N'/banners/asset-slide-1.webp',
              N'/banners/asset-slide-2.webp',
              N'/banners/asset-slide-3.webp'
          );
    END;
`;

const header = `-- =============================================================================
-- V202605220001 -- Repair Arabic text corrupted by non-UTF-8 sqlcmd/SSMS import
-- =============================================================================
-- Symptom: mojibake (e.g. Latin letters with accents) instead of Arabic letters.
-- Cause: UTF-8 SQL scripts executed without sqlcmd code page 65001.
-- Fix: Re-apply canonical Arabic from baseline seeds. Use sqlcmd -f 65001 on Windows.

SET XACT_ABORT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

`;

const footer = `
    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM dbo.SchemaMigrations
           WHERE ScriptName = N'V202605220001__repair_arabic_utf8_mojibake.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES (
            N'V202605220001__repair_arabic_utf8_mojibake.sql',
            SYSUTCDATETIME(),
            N'Re-apply canonical Arabic reference data after UTF-8 mojibake from sqlcmd without code page 65001'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
`;

const citiesMerge = locations.match(/MERGE dbo\.Cities[\s\S]*?^GO/m)?.[0];
if (!citiesMerge) {
  throw new Error('Cities MERGE not found in BASELINE_LOCATIONS.sql');
}

const content =
  header +
  indent(categoriesMatch[0].replace(/\r?\nGO\s*$/, '')) +
  '\n\n' +
  indent(citiesMerge.replace(/\r?\nGO\s*$/, '')) +
  '\n\n' +
  indent(areasSection) +
  '\n\n' +
  hero +
  '\n' +
  footer;

fs.writeFileSync(outPath, content, { encoding: 'utf8' });
const areaMerges = (areasSection.match(/MERGE dbo\.Areas/g) ?? []).length;
console.log(`Wrote ${outPath} (${content.length} chars, ${areaMerges} area MERGE blocks)`);
