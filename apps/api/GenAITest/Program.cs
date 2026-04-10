using System;
using System.Linq;
using Google.GenAI;

class Program {
    static void Main() {
        var asm = typeof(Client).Assembly;
        var types = asm.GetTypes().Where(t => t.Name.Contains("Config") || t.Name.Contains("Generate") || t.Name.Contains("Models")).Select(t => t.Name);
        foreach(var t in types) Console.WriteLine(t);
    }
}
