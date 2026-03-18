using System;
using System.Linq;

namespace TijarahJo.Application.Common;

public static class PhoneNumberNormalizer
{
    // Canonical storage format for Jordan mobile numbers: +962XXXXXXXXX (9 digits after country code).
    public static string? NormalizeJordanPhone(string? rawPhone)
    {
        if (string.IsNullOrWhiteSpace(rawPhone))
        {
            return null;
        }

        string digitsOnly = new(rawPhone.Where(char.IsDigit).ToArray());
        if (digitsOnly.Length == 0)
        {
            return null;
        }

        if (digitsOnly.StartsWith("962", StringComparison.Ordinal))
        {
            digitsOnly = digitsOnly.Substring(3);
        }

        if (digitsOnly.StartsWith('0') && digitsOnly.Length == 10)
        {
            digitsOnly = digitsOnly.Substring(1);
        }

        if (digitsOnly.Length != 9)
        {
            return null;
        }

        return $"+962{digitsOnly}";
    }
}
