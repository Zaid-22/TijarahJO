using System.Security.Cryptography;

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
