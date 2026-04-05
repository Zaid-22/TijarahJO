using System;
using System.Security.Cryptography;

// Replicates PasswordHelper.HashPassword("Admin@123")
const string password = "Admin@123";
const int iterations = 100_000;
const int saltSize = 16;
const int keySize = 32;

byte[] salt = RandomNumberGenerator.GetBytes(saltSize);
byte[] key = Rfc2898DeriveBytes.Pbkdf2(
    password: password,
    salt: salt,
    iterations: iterations,
    hashAlgorithm: HashAlgorithmName.SHA256,
    outputLength: keySize
);

string hash = $"PBKDF2_SHA256${iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
Console.WriteLine($"Password: {password}");
Console.WriteLine($"Hash:     {hash}");

// Verify it works
string[] parts = hash.Split('$');
byte[] salt2 = Convert.FromBase64String(parts[2]);
byte[] expected = Convert.FromBase64String(parts[3]);
byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt2, int.Parse(parts[1]), HashAlgorithmName.SHA256, expected.Length);
Console.WriteLine($"Verify:   {CryptographicOperations.FixedTimeEquals(actual, expected)}");
