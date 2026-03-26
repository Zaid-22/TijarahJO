using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace TijarahJo.Infrastructure.Persistence;

/// <summary>
/// AES-256-GCM encryption for sensitive string columns.
/// Used as an EF Core <see cref="ValueConverter{TModel,TProvider}"/> to transparently
/// encrypt values on write and decrypt on read.
///
/// Storage format: Base64(nonce[12] + ciphertext[N] + tag[16])
/// The nonce is generated randomly per write so identical plaintext produces different ciphertexts.
/// </summary>
public sealed class AesGcmStringConverter : ValueConverter<string?, string?>
{
    private const int NonceSize = 12; // AES-GCM standard
    private const int TagSize = 16;   // AES-GCM standard
    private const string LegacyFallbackEnvironmentVariable = "ALLOW_LEGACY_PLAINTEXT_TOTP";

    public AesGcmStringConverter(byte[] key)
        : base(
            plaintext => Encrypt(plaintext, key),
            ciphertext => Decrypt(ciphertext, key))
    {
        if (key.Length != 32)
            throw new ArgumentException("AES-256 requires a 32-byte key.", nameof(key));
    }

    private static string? Encrypt(string? plaintext, byte[] key)
    {
        if (string.IsNullOrEmpty(plaintext))
            return plaintext;

        byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        byte[] nonce = RandomNumberGenerator.GetBytes(NonceSize);
        byte[] ciphertext = new byte[plaintextBytes.Length];
        byte[] tag = new byte[TagSize];

        using var aes = new AesGcm(key, TagSize);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        // Pack as: nonce + ciphertext + tag
        byte[] result = new byte[NonceSize + ciphertext.Length + TagSize];
        Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
        Buffer.BlockCopy(ciphertext, 0, result, NonceSize, ciphertext.Length);
        Buffer.BlockCopy(tag, 0, result, NonceSize + ciphertext.Length, TagSize);

        return Convert.ToBase64String(result);
    }

    private static string? Decrypt(string? base64Ciphertext, byte[] key)
    {
        if (string.IsNullOrEmpty(base64Ciphertext))
            return base64Ciphertext;

        byte[] packed;
        try
        {
            packed = Convert.FromBase64String(base64Ciphertext);
        }
        catch (FormatException)
        {
            if (ShouldAllowLegacyPlaintextFallback())
            {
                return base64Ciphertext;
            }

            throw new CryptographicException("Stored TOTP secret is not valid encrypted data.");
        }

        if (packed.Length < NonceSize + TagSize)
        {
            if (ShouldAllowLegacyPlaintextFallback())
            {
                return base64Ciphertext;
            }

            throw new CryptographicException("Stored TOTP secret has an invalid encrypted payload.");
        }

        byte[] nonce = new byte[NonceSize];
        byte[] tag = new byte[TagSize];
        int ciphertextLength = packed.Length - NonceSize - TagSize;
        byte[] ciphertext = new byte[ciphertextLength];
        byte[] plaintext = new byte[ciphertextLength];

        Buffer.BlockCopy(packed, 0, nonce, 0, NonceSize);
        Buffer.BlockCopy(packed, NonceSize, ciphertext, 0, ciphertextLength);
        Buffer.BlockCopy(packed, NonceSize + ciphertextLength, tag, 0, TagSize);

        try
        {
            using var aes = new AesGcm(key, TagSize);
            aes.Decrypt(nonce, ciphertext, tag, plaintext);
            return Encoding.UTF8.GetString(plaintext);
        }
        catch (CryptographicException)
        {
            if (ShouldAllowLegacyPlaintextFallback())
            {
                return base64Ciphertext;
            }

            throw new CryptographicException("Stored TOTP secret could not be decrypted.");
        }
    }

    private static bool ShouldAllowLegacyPlaintextFallback()
    {
        string? raw = Environment.GetEnvironmentVariable(LegacyFallbackEnvironmentVariable);
        return string.Equals(raw, "1", StringComparison.Ordinal) ||
               string.Equals(raw, "true", StringComparison.OrdinalIgnoreCase);
    }
}
