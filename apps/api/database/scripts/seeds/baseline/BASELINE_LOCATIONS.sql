USE TijarahJoDB;
GO

PRINT 'Applying baseline locations seed data...';
GO

-- 1. Seed Cities
MERGE dbo.Cities AS target
USING
(
    VALUES
        (N'Amman', N'عمان'),
        (N'Irbid', N'إربد'),
        (N'Zarqa', N'الزرقاء'),
        (N'Aqaba', N'العقبة'),
        (N'Mafraq', N'المفرق'),
        (N'Jerash', N'جرش'),
        (N'Ajloun', N'عجلون'),
        (N'Balqa', N'البلقاء'),
        (N'Madaba', N'مأدبا'),
        (N'Karak', N'الكرك'),
        (N'Tafilah', N'الطفيلة'),
        (N'Maan', N'معان')
) AS source (CityName, CityNameAr)
ON target.CityName = source.CityName
WHEN NOT MATCHED BY TARGET THEN
    INSERT (CityName, CityNameAr)
    VALUES (source.CityName, source.CityNameAr);
GO

-- ============================================================================
-- 2. Seed Areas for each city
-- ============================================================================

-- Amman
DECLARE @AmmanId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Amman');
IF @AmmanId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@AmmanId, N'West Amman', N'عمان الغربية'),
            (@AmmanId, N'East Amman', N'عمان الشرقية'),
            (@AmmanId, N'Abdali', N'العبدلي'),
            (@AmmanId, N'Sweifieh', N'الصويفية'),
            (@AmmanId, N'Jubaiha', N'الجبيهة'),
            (@AmmanId, N'Shmeisani', N'الشميساني'),
            (@AmmanId, N'Abdoun', N'عبدون'),
            (@AmmanId, N'Khalda', N'خلدا'),
            (@AmmanId, N'Tla Al Ali', N'تلاع العلي'),
            (@AmmanId, N'Um Uthaina', N'أم أذينة'),
            (@AmmanId, N'Dahiyat Al Rasheed', N'ضاحية الرشيد'),
            (@AmmanId, N'Jabal Amman', N'جبل عمان'),
            (@AmmanId, N'Jabal Hussein', N'جبل الحسين'),
            (@AmmanId, N'Jabal Al Weibdeh', N'جبل اللويبدة'),
            (@AmmanId, N'Marj Al Hamam', N'مرج الحمام'),
            (@AmmanId, N'Abu Alanda', N'أبو علندا'),
            (@AmmanId, N'Marka', N'ماركا'),
            (@AmmanId, N'Sahab', N'سحاب'),
            (@AmmanId, N'Tabarbour', N'طبربور'),
            (@AmmanId, N'Al Hashmi Al Shamali', N'الهاشمي الشمالي'),
            (@AmmanId, N'7th Circle', N'الدوار السابع'),
            (@AmmanId, N'8th Circle', N'الدوار الثامن'),
            (@AmmanId, N'Rabieh', N'الرابية'),
            (@AmmanId, N'Deir Ghbar', N'دير غبار'),
            (@AmmanId, N'Gardens', N'الجاردنز'),
            (@AmmanId, N'Bayader Wadi Al Seer', N'بيادر وادي السير'),
            (@AmmanId, N'Wadi Al Seer', N'وادي السير'),
            (@AmmanId, N'Naour', N'ناعور'),
            (@AmmanId, N'Airport Road', N'طريق المطار'),
            (@AmmanId, N'Al Muqabalain', N'المقابلين')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Irbid
DECLARE @IrbidId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Irbid');
IF @IrbidId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@IrbidId, N'City Center', N'وسط البلد'),
            (@IrbidId, N'Husn', N'الحصن'),
            (@IrbidId, N'Bani Obaid', N'بني عبيد'),
            (@IrbidId, N'Al Ramtha', N'الرمثا'),
            (@IrbidId, N'Bani Kinanah', N'بني كنانة'),
            (@IrbidId, N'Al Taybeh', N'الطيبة'),
            (@IrbidId, N'Koora', N'الكورة'),
            (@IrbidId, N'Aydoun', N'ايدون'),
            (@IrbidId, N'Al Huson', N'مخيم الحصن'),
            (@IrbidId, N'Al Mazar Al Shamali', N'المزار الشمالي'),
            (@IrbidId, N'University Area', N'منطقة الجامعة')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Zarqa
DECLARE @ZarqaId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Zarqa');
IF @ZarqaId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@ZarqaId, N'City Center', N'وسط البلد'),
            (@ZarqaId, N'New Zarqa', N'الزرقاء الجديدة'),
            (@ZarqaId, N'Russeifa', N'الرصيفة'),
            (@ZarqaId, N'Hashemiyeh', N'الهاشمية'),
            (@ZarqaId, N'Azraq', N'الأزرق'),
            (@ZarqaId, N'Dleil', N'الضليل'),
            (@ZarqaId, N'Sukhneh', N'السخنة'),
            (@ZarqaId, N'Zarqa Al Jadeedah', N'الزرقاء الجديدة'),
            (@ZarqaId, N'Al Tatweer', N'التطوير')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Aqaba
DECLARE @AqabaId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Aqaba');
IF @AqabaId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@AqabaId, N'City Center', N'وسط البلد'),
            (@AqabaId, N'Al Shalalah', N'الشلالة'),
            (@AqabaId, N'Al Mahdood', N'المحدود'),
            (@AqabaId, N'Al Sakaneyeh', N'السكنية'),
            (@AqabaId, N'Tala Bay', N'تالا باي'),
            (@AqabaId, N'Ayla Oasis', N'واحة أيلة'),
            (@AqabaId, N'Marsa Zayed', N'مرسى زايد'),
            (@AqabaId, N'Al Reem', N'الريم'),
            (@AqabaId, N'South Beach', N'الشاطئ الجنوبي')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Mafraq
DECLARE @MafraqId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Mafraq');
IF @MafraqId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@MafraqId, N'City Center', N'وسط البلد'),
            (@MafraqId, N'Al Zaatari', N'الزعتري'),
            (@MafraqId, N'Rhab', N'رحاب'),
            (@MafraqId, N'Sabha', N'صبحة'),
            (@MafraqId, N'Bala ama', N'بلعما'),
            (@MafraqId, N'Al Khalidiyah', N'الخالدية'),
            (@MafraqId, N'North Badia', N'البادية الشمالية')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Jerash
DECLARE @JerashId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Jerash');
IF @JerashId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@JerashId, N'City Center', N'وسط البلد'),
            (@JerashId, N'Souf', N'سوف'),
            (@JerashId, N'Sakeb', N'ساكب'),
            (@JerashId, N'Mastaba', N'المصطبة'),
            (@JerashId, N'Burma', N'برما'),
            (@JerashId, N'Qafqafa', N'قفقفا'),
            (@JerashId, N'Al Kitteh', N'الكتة')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Ajloun
DECLARE @AjlounId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Ajloun');
IF @AjlounId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@AjlounId, N'City Center', N'وسط البلد'),
            (@AjlounId, N'Kufranjah', N'كفرنجة'),
            (@AjlounId, N'Anjara', N'عنجرة'),
            (@AjlounId, N'Ishtafaina', N'اشتفينا'),
            (@AjlounId, N'Arjan', N'عرجان'),
            (@AjlounId, N'Ain Janna', N'عين جنا'),
            (@AjlounId, N'Rasoun', N'راسون')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Balqa
DECLARE @BalqaId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Balqa');
IF @BalqaId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@BalqaId, N'Salt', N'السلط'),
            (@BalqaId, N'Fuhais', N'الفحيص'),
            (@BalqaId, N'Mahis', N'ماحص'),
            (@BalqaId, N'Ain Al Basha', N'عين الباشا'),
            (@BalqaId, N'Deir Alla', N'دير علا'),
            (@BalqaId, N'South Shouneh', N'الشونة الجنوبية'),
            (@BalqaId, N'Sweileh', N'صويلح')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Madaba
DECLARE @MadabaId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Madaba');
IF @MadabaId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@MadabaId, N'City Center', N'وسط البلد'),
            (@MadabaId, N'Dhiban', N'ذيبان'),
            (@MadabaId, N'Ma in', N'ماعين'),
            (@MadabaId, N'Leb', N'لب'),
            (@MadabaId, N'Hanina', N'حنينا'),
            (@MadabaId, N'Mlieh', N'مليح')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Karak
DECLARE @KarakId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Karak');
IF @KarakId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@KarakId, N'City Center', N'وسط البلد'),
            (@KarakId, N'Al Mazar Al Janoubi', N'المزار الجنوبي'),
            (@KarakId, N'Mu tah', N'مؤتة'),
            (@KarakId, N'Qasr', N'القصر'),
            (@KarakId, N'Ghor Al Safi', N'غور الصافي'),
            (@KarakId, N'Faqou', N'فقوع'),
            (@KarakId, N'Ai', N'عي')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Tafilah
DECLARE @TafilahId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Tafilah');
IF @TafilahId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@TafilahId, N'City Center', N'وسط البلد'),
            (@TafilahId, N'Busaira', N'بصيرا'),
            (@TafilahId, N'Dana', N'ضانا'),
            (@TafilahId, N'Hasa', N'الحسا'),
            (@TafilahId, N'Ain Al Bayda', N'عين البيضاء'),
            (@TafilahId, N'Tafilah Al Jadeedah', N'الطفيلة الجديدة')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

-- Maan
DECLARE @MaanId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Maan');
IF @MaanId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@MaanId, N'City Center', N'وسط البلد'),
            (@MaanId, N'Petra', N'البتراء'),
            (@MaanId, N'Wadi Musa', N'وادي موسى'),
            (@MaanId, N'Shoubak', N'الشوبك'),
            (@MaanId, N'Hussainiyeh', N'الحسينية'),
            (@MaanId, N'Ayl', N'ايل'),
            (@MaanId, N'Jafr', N'الجفر')
    ) AS source (CityID, AreaName, AreaNameAr)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName, AreaNameAr)
        VALUES (source.CityID, source.AreaName, source.AreaNameAr);
END
GO

PRINT 'Baseline locations seed data completed.';
GO
