using System.Security.Cryptography;
using System.Text;

namespace TijarahJoDB.Application.Common;

public static class PasswordHelper
{
    private const string Pbkdf2Prefix = "PBKDF2_SHA256";
    private const int Pbkdf2Iterations = 100_000;
    private const int SaltSize = 16;
    private const int KeySize = 32;

    public static string HashPassword(string password)
    {
        ValidatePassword(password);

        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] key = Rfc2898DeriveBytes.Pbkdf2(
            password: password,
            salt: salt,
            iterations: Pbkdf2Iterations,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: KeySize
        );

        return $"{Pbkdf2Prefix}${Pbkdf2Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }

    public static string HashPasswordLegacy(string password)
    {
        ValidatePassword(password);

        using SHA256 sha256 = SHA256.Create();
        byte[] bytes = Encoding.UTF8.GetBytes(password);
        byte[] hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    public static bool VerifyPassword(string password, string hashedPassword)
    {
        ValidatePassword(password);

        if (string.IsNullOrWhiteSpace(hashedPassword))
        {
            return false;
        }

        if (IsPbkdf2Hash(hashedPassword))
        {
            return VerifyPbkdf2(password, hashedPassword);
        }

        string? pepperHash = TryHashWithPepper(password);
        if (!string.IsNullOrEmpty(pepperHash) && FixedTimeEquals(pepperHash, hashedPassword))
        {
            return true;
        }

        string legacyHash = HashPasswordLegacy(password);
        return FixedTimeEquals(legacyHash, hashedPassword);
    }

    public static bool NeedsRehash(string hashedPassword)
    {
        if (!IsPbkdf2Hash(hashedPassword))
        {
            return true;
        }

        string[] parts = hashedPassword.Split('$');
        if (parts.Length != 4 || !int.TryParse(parts[1], out int iterations))
        {
            return true;
        }

        return iterations < Pbkdf2Iterations;
    }

    private static bool VerifyPbkdf2(string password, string hashedPassword)
    {
        string[] parts = hashedPassword.Split('$');
        if (parts.Length != 4 || !string.Equals(parts[0], Pbkdf2Prefix, StringComparison.Ordinal))
        {
            return false;
        }

        if (!int.TryParse(parts[1], out int iterations) || iterations <= 0)
        {
            return false;
        }

        try
        {
            byte[] salt = Convert.FromBase64String(parts[2]);
            byte[] expected = Convert.FromBase64String(parts[3]);

            byte[] actual = Rfc2898DeriveBytes.Pbkdf2(
                password: password,
                salt: salt,
                iterations: iterations,
                hashAlgorithm: HashAlgorithmName.SHA256,
                outputLength: expected.Length
            );

            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static bool IsPbkdf2Hash(string hashedPassword)
    {
        return hashedPassword.StartsWith($"{Pbkdf2Prefix}$", StringComparison.Ordinal);
    }

    private static string? TryHashWithPepper(string password)
    {
        string? pepper = GetPepper();
        if (string.IsNullOrWhiteSpace(pepper))
        {
            return null;
        }

        using HMACSHA256 hmac = new HMACSHA256(Encoding.UTF8.GetBytes(pepper));
        byte[] bytes = Encoding.UTF8.GetBytes(password);
        byte[] hash = hmac.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        byte[] leftBytes = Encoding.UTF8.GetBytes(left);
        byte[] rightBytes = Encoding.UTF8.GetBytes(right);
        if (leftBytes.Length != rightBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private static void ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required.", nameof(password));
        }
    }

    private static string? GetPepper()
    {
        return Environment.GetEnvironmentVariable("PASSWORD_PEPPER")
            ?? Environment.GetEnvironmentVariable("PASSWORD_PEPPER_LEGACY");
    }
}
