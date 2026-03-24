namespace TijarahJo.Infrastructure.Persistence;

/// <summary>
/// Wraps the 32-byte AES-256 key used to encrypt TOTP secrets at rest.
/// Registered as a singleton in DI so it is available to DbContext.
/// </summary>
public sealed class TotpEncryptionKey
{
    public byte[] Key { get; }

    public TotpEncryptionKey(byte[] key)
    {
        if (key.Length != 32)
            throw new ArgumentException("TOTP encryption key must be exactly 32 bytes (AES-256).", nameof(key));
        Key = key;
    }
}
