USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

THROW 51091, 'This script moved. Use apps/api/database/ops/dev-only/CLEANUP_TEST_DATA.sql with sqlcmd variable ALLOW_DEV_DATA_CLEANUP=1.', 1;
GO
