USE TijarahJoDB;
GO

PRINT 'Applying baseline locations seed data...';
GO

-- 1. Seed Cities
MERGE dbo.Cities AS target
USING
(
    VALUES
        (N'Amman'),
        (N'Irbid'),
        (N'Zarqa'),
        (N'Aqaba'),
        (N'Mafraq'),
        (N'Jerash'),
        (N'Ajloun'),
        (N'Balqa'),
        (N'Madaba'),
        (N'Karak'),
        (N'Tafilah'),
        (N'Maan')
) AS source (CityName)
ON target.CityName = source.CityName
WHEN NOT MATCHED BY TARGET THEN
    INSERT (CityName)
    VALUES (source.CityName);
GO

-- 2. Seed Areas for Amman (Example subset)
DECLARE @AmmanId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Amman');
IF @AmmanId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@AmmanId, N'West Amman'),
            (@AmmanId, N'East Amman'),
            (@AmmanId, N'Abdali'),
            (@AmmanId, N'Sweifieh'),
            (@AmmanId, N'Jubaiha')
    ) AS source (CityID, AreaName)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName)
        VALUES (source.CityID, source.AreaName);
END
GO

-- Seed Areas for Irbid
DECLARE @IrbidId INT = (SELECT CityID FROM dbo.Cities WHERE CityName = N'Irbid');
IF @IrbidId IS NOT NULL
BEGIN
    MERGE dbo.Areas AS target
    USING
    (
        VALUES
            (@IrbidId, N'City Center'),
            (@IrbidId, N'Husn'),
            (@IrbidId, N'Bani Obaid')
    ) AS source (CityID, AreaName)
    ON target.CityID = source.CityID AND target.AreaName = source.AreaName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CityID, AreaName)
        VALUES (source.CityID, source.AreaName);
END
GO

PRINT 'Baseline locations seed data completed.';
GO
