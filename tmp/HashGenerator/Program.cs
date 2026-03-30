using System;
using System.Security.Cryptography;

namespace HashGenerator;

public static class PasswordHelper
{
    private const string Pbkdf2Prefix = "PBKDF2_SHA256";
    private const int Pbkdf2Iterations = 100_000;
    private const int SaltSize = 16;
    private const int KeySize = 32;

    public static string HashPassword(string password)
    {
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
}

class Program
{
    static void Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: Program <password>");
            return;
        }

        string password = args[0];
        string hashedPassword = PasswordHelper.HashPassword(password);
        Console.WriteLine(hashedPassword);
    }
}
