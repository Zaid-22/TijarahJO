using System;
using System.Text.Json;

class Program {
    static void Main() {
        var errorResponse = new { success = false, error = new { message = "Gemini API Error [BadRequest]: { \"error\": { \"code\": 400 } }" } };
        Console.WriteLine(JsonSerializer.Serialize(errorResponse));
    }
}
