using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using TijarahJoDBAPI.Common.Configuration;

namespace TijarahJoDBAPI.Common.Services;

public sealed class TwoFactorService
{
    private const int SecretByteLength = 20;
    private const int AesNonceLength = 12;
    private const int AesTagLength = 16;

    private static readonly char[] Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".ToCharArray();

    private readonly TwoFactorOptions _options;
    private readonly byte[] _secretEncryptionKey;
    private readonly byte[] _challengeSigningKey;

    public TwoFactorService(IOptions<TwoFactorOptions> optionsAccessor, JwtOptions jwtOptions)
    {
        _options = optionsAccessor.Value ?? new TwoFactorOptions();

        string baseKey = string.IsNullOrWhiteSpace(jwtOptions.SigningKey)
            ? throw new InvalidOperationException("JWT signing key is required to derive 2FA keys.")
            : jwtOptions.SigningKey;

        string secretKeyMaterial = string.IsNullOrWhiteSpace(_options.SecretEncryptionKey)
            ? $"twofactor-secret::{baseKey}"
            : _options.SecretEncryptionKey.Trim();
        string challengeKeyMaterial = string.IsNullOrWhiteSpace(_options.ChallengeSigningKey)
            ? $"twofactor-challenge::{baseKey}"
            : _options.ChallengeSigningKey.Trim();

        _secretEncryptionKey = SHA256.HashData(Encoding.UTF8.GetBytes(secretKeyMaterial));
        _challengeSigningKey = SHA256.HashData(Encoding.UTF8.GetBytes(challengeKeyMaterial));

        _options.TimeStepSeconds = Math.Clamp(_options.TimeStepSeconds, 15, 90);
        _options.AllowedTimeDriftSteps = Math.Clamp(_options.AllowedTimeDriftSteps, 0, 5);
        _options.Digits = Math.Clamp(_options.Digits, 6, 8);
        _options.LoginChallengeLifetimeSeconds = Math.Clamp(_options.LoginChallengeLifetimeSeconds, 60, 900);
        _options.Issuer = string.IsNullOrWhiteSpace(_options.Issuer) ? "TijarahJo" : _options.Issuer.Trim();
    }

    public string Issuer => _options.Issuer;

    public string GenerateSecretKey()
    {
        byte[] secretBytes = RandomNumberGenerator.GetBytes(SecretByteLength);
        return Base32Encode(secretBytes);
    }

    public string BuildOtpAuthUri(string accountName, string secretKey)
    {
        string normalizedAccount = string.IsNullOrWhiteSpace(accountName)
            ? "user@tijarahjo.local"
            : accountName.Trim();

        string label = Uri.EscapeDataString($"{_options.Issuer}:{normalizedAccount}");
        string issuer = Uri.EscapeDataString(_options.Issuer);
        string secret = Uri.EscapeDataString(secretKey);

        return $"otpauth://totp/{label}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits={_options.Digits}&period={_options.TimeStepSeconds}";
    }

    public string ProtectSecret(string rawSecret)
    {
        if (string.IsNullOrWhiteSpace(rawSecret))
        {
            throw new ArgumentException("Secret is required.", nameof(rawSecret));
        }

        byte[] plaintext = Encoding.UTF8.GetBytes(rawSecret.Trim());
        byte[] nonce = RandomNumberGenerator.GetBytes(AesNonceLength);
        byte[] ciphertext = new byte[plaintext.Length];
        byte[] tag = new byte[AesTagLength];

        using var aesGcm = new AesGcm(_secretEncryptionKey, AesTagLength);
        aesGcm.Encrypt(nonce, plaintext, ciphertext, tag);

        byte[] payload = new byte[1 + nonce.Length + tag.Length + ciphertext.Length];
        payload[0] = 0x01;
        Buffer.BlockCopy(nonce, 0, payload, 1, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, 1 + nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, payload, 1 + nonce.Length + tag.Length, ciphertext.Length);

        return WebEncoders.Base64UrlEncode(payload);
    }

    public bool TryUnprotectSecret(string? protectedSecret, out string secret)
    {
        secret = string.Empty;
        if (string.IsNullOrWhiteSpace(protectedSecret))
        {
            return false;
        }

        byte[] payload;
        try
        {
            payload = WebEncoders.Base64UrlDecode(protectedSecret.Trim());
        }
        catch (FormatException)
        {
            return false;
        }

        if (payload.Length < 1 + AesNonceLength + AesTagLength || payload[0] != 0x01)
        {
            return false;
        }

        ReadOnlySpan<byte> nonce = payload.AsSpan(1, AesNonceLength);
        ReadOnlySpan<byte> tag = payload.AsSpan(1 + AesNonceLength, AesTagLength);
        ReadOnlySpan<byte> ciphertext = payload.AsSpan(1 + AesNonceLength + AesTagLength);
        byte[] plaintext = new byte[ciphertext.Length];

        try
        {
            using var aesGcm = new AesGcm(_secretEncryptionKey, AesTagLength);
            aesGcm.Decrypt(nonce, ciphertext, tag, plaintext);
        }
        catch (CryptographicException)
        {
            return false;
        }

        secret = Encoding.UTF8.GetString(plaintext);
        return !string.IsNullOrWhiteSpace(secret);
    }

    public string IssueLoginChallengeToken(int userId, DateTimeOffset utcNow)
    {
        var payload = new LoginChallengeTokenPayload
        {
            UserId = userId,
            ExpiresAtUnixSeconds = utcNow.AddSeconds(_options.LoginChallengeLifetimeSeconds).ToUnixTimeSeconds(),
            Nonce = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(16))
        };

        byte[] payloadBytes = JsonSerializer.SerializeToUtf8Bytes(payload);
        byte[] signatureBytes = ComputeChallengeSignature(payloadBytes);

        return $"{WebEncoders.Base64UrlEncode(payloadBytes)}.{WebEncoders.Base64UrlEncode(signatureBytes)}";
    }

    public bool TryValidateLoginChallengeToken(
        string? token,
        DateTimeOffset utcNow,
        out int userId,
        out string failureMessage)
    {
        userId = 0;
        failureMessage = "Two-factor session is invalid or expired.";

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        string[] parts = token.Trim().Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2)
        {
            return false;
        }

        byte[] payloadBytes;
        byte[] signatureBytes;
        try
        {
            payloadBytes = WebEncoders.Base64UrlDecode(parts[0]);
            signatureBytes = WebEncoders.Base64UrlDecode(parts[1]);
        }
        catch (FormatException)
        {
            return false;
        }

        byte[] expectedSignature = ComputeChallengeSignature(payloadBytes);
        if (signatureBytes.Length != expectedSignature.Length ||
            !CryptographicOperations.FixedTimeEquals(signatureBytes, expectedSignature))
        {
            return false;
        }

        LoginChallengeTokenPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<LoginChallengeTokenPayload>(payloadBytes);
        }
        catch (JsonException)
        {
            return false;
        }

        if (payload == null || payload.UserId < 1 || payload.ExpiresAtUnixSeconds <= 0)
        {
            return false;
        }

        if (utcNow.ToUnixTimeSeconds() > payload.ExpiresAtUnixSeconds)
        {
            failureMessage = "Two-factor session has expired. Please sign in again.";
            return false;
        }

        userId = payload.UserId;
        failureMessage = string.Empty;
        return true;
    }

    public bool VerifyCode(string rawSecret, string? submittedCode, DateTimeOffset utcNow)
    {
        string normalizedCode = NormalizeCode(submittedCode);
        if (normalizedCode.Length != _options.Digits)
        {
            return false;
        }

        byte[] secret;
        try
        {
            secret = Base32Decode(rawSecret);
        }
        catch (FormatException)
        {
            return false;
        }

        if (secret.Length == 0)
        {
            return false;
        }

        long unixSeconds = utcNow.ToUnixTimeSeconds();
        long currentCounter = unixSeconds / _options.TimeStepSeconds;

        for (int offset = -_options.AllowedTimeDriftSteps; offset <= _options.AllowedTimeDriftSteps; offset++)
        {
            long counter = currentCounter + offset;
            if (counter < 0)
            {
                continue;
            }

            string expectedCode = GenerateCode(secret, counter);
            if (FixedTimeEquals(expectedCode, normalizedCode))
            {
                return true;
            }
        }

        return false;
    }

    public string NormalizeCode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return new string(value.Trim().Where(char.IsDigit).ToArray());
    }

    private byte[] ComputeChallengeSignature(byte[] payloadBytes)
    {
        using var hmac = new HMACSHA256(_challengeSigningKey);
        return hmac.ComputeHash(payloadBytes);
    }

    private string GenerateCode(byte[] secret, long counter)
    {
        Span<byte> counterBytes = stackalloc byte[8];
        for (int index = 7; index >= 0; index--)
        {
            counterBytes[index] = (byte)(counter & 0xFF);
            counter >>= 8;
        }

        byte[] hash;
        using (var hmac = new HMACSHA1(secret))
        {
            hash = hmac.ComputeHash(counterBytes.ToArray());
        }

        int offset = hash[^1] & 0x0F;
        int binaryCode =
            ((hash[offset] & 0x7F) << 24) |
            (hash[offset + 1] << 16) |
            (hash[offset + 2] << 8) |
            hash[offset + 3];

        int divisor = (int)Math.Pow(10, _options.Digits);
        int otp = binaryCode % divisor;
        return otp.ToString($"D{_options.Digits}");
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        byte[] leftBytes = Encoding.UTF8.GetBytes(left);
        byte[] rightBytes = Encoding.UTF8.GetBytes(right);
        return leftBytes.Length == rightBytes.Length &&
               CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private static string Base32Encode(byte[] data)
    {
        if (data.Length == 0)
        {
            return string.Empty;
        }

        var output = new StringBuilder((data.Length * 8 + 4) / 5);
        int buffer = data[0];
        int next = 1;
        int bitsLeft = 8;

        while (bitsLeft > 0 || next < data.Length)
        {
            if (bitsLeft < 5)
            {
                if (next < data.Length)
                {
                    buffer <<= 8;
                    buffer |= data[next++] & 0xFF;
                    bitsLeft += 8;
                }
                else
                {
                    int pad = 5 - bitsLeft;
                    buffer <<= pad;
                    bitsLeft += pad;
                }
            }

            int index = 0x1F & (buffer >> (bitsLeft - 5));
            bitsLeft -= 5;
            output.Append(Base32Alphabet[index]);
        }

        return output.ToString();
    }

    private static byte[] Base32Decode(string base32)
    {
        if (string.IsNullOrWhiteSpace(base32))
        {
            return Array.Empty<byte>();
        }

        string normalized = base32.Trim().TrimEnd('=').ToUpperInvariant();
        int buffer = 0;
        int bitsLeft = 0;
        var output = new List<byte>(normalized.Length * 5 / 8);

        foreach (char character in normalized)
        {
            int value = character switch
            {
                >= 'A' and <= 'Z' => character - 'A',
                >= '2' and <= '7' => character - '2' + 26,
                _ => -1
            };

            if (value < 0)
            {
                throw new FormatException("Invalid Base32 secret.");
            }

            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            if (bitsLeft >= 8)
            {
                output.Add((byte)((buffer >> (bitsLeft - 8)) & 0xFF));
                bitsLeft -= 8;
            }
        }

        return output.ToArray();
    }

    private sealed class LoginChallengeTokenPayload
    {
        public int UserId { get; set; }
        public long ExpiresAtUnixSeconds { get; set; }
        public string Nonce { get; set; } = string.Empty;
    }
}
