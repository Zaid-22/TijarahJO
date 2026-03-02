using Microsoft.AspNetCore.Authorization;
using TijarahJoDBAPI.Features.Auth;

namespace TijarahJoDBAPI.Tests;

public sealed class AuthControllerMetadataTests
{
    [Fact]
    public void Login_HasAllowAnonymousAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.Login));

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault());
    }

    [Fact]
    public void Signup_HasAllowAnonymousAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.Signup));

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault());
    }

    [Fact]
    public void RequestPasswordReset_HasAllowAnonymousAttribute()
    {
        var method = typeof(PasswordResetController).GetMethod(nameof(PasswordResetController.RequestPasswordReset));

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault());
    }

    [Fact]
    public void ConfirmPasswordReset_HasAllowAnonymousAttribute()
    {
        var method = typeof(PasswordResetController).GetMethod(nameof(PasswordResetController.ConfirmPasswordReset));

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault());
    }
}

