using System.Security.Cryptography;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Auth;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth/google")]
public class OAuthController : ControllerBase
{
    private const string GoogleStateCookieName = "tj-google-oauth-state";
    private const string GoogleNonceCookieName = "tj-google-oauth-nonce";

    private readonly GoogleAuthService _googleAuthService;
    private readonly IAuthCommandService _authCommands;
    private readonly TwoFactorService _twoFactorService;
    private readonly ITokenService _tokenService;
    private readonly ILogger<OAuthController> _logger;

    public OAuthController(
        GoogleAuthService googleAuthService,
        IAuthCommandService authCommands,
        TwoFactorService twoFactorService,
        ITokenService tokenService,
        ILogger<OAuthController> logger)
    {
        _googleAuthService = googleAuthService;
        _authCommands = authCommands;
        _twoFactorService = twoFactorService;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpGet("start")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public ActionResult StartGoogleOAuth()
    {
        if (!_googleAuthService.IsConfigured)
        {
            return Redirect(BuildGoogleFailureRedirectUri($"Google sign-in is not configured. Debug: {_googleAuthService.GetDebugConfiguredError()}"));
        }

        string state = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        string nonce = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

        AuthShared.SetShortLivedAuthCookie(Response, GoogleStateCookieName, state, TimeSpan.FromMinutes(10));
        AuthShared.SetShortLivedAuthCookie(Response, GoogleNonceCookieName, nonce, TimeSpan.FromMinutes(10));

        string authorizationUrl = _googleAuthService.BuildAuthorizationUrl(state, nonce);
        return Redirect(authorizationUrl);
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public async Task<ActionResult> GoogleOAuthCallback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        CancellationToken cancellationToken)
    {
        string expectedState = Request.Cookies[GoogleStateCookieName] ?? string.Empty;
        string expectedNonce = Request.Cookies[GoogleNonceCookieName] ?? string.Empty;

        AuthShared.DeleteCookie(Response, GoogleStateCookieName);
        AuthShared.DeleteCookie(Response, GoogleNonceCookieName);

        if (!_googleAuthService.IsConfigured)
        {
            return Redirect(BuildGoogleFailureRedirectUri("Google sign-in is not configured."));
        }

        if (!string.IsNullOrWhiteSpace(error))
        {
            return Redirect(BuildGoogleFailureRedirectUri("Google sign-in was cancelled or denied."));
        }

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
        {
            return Redirect(BuildGoogleFailureRedirectUri("Google sign-in did not return the required response data."));
        }

        if (!AuthShared.FixedTimeEquals(state, expectedState))
        {
            return Redirect(BuildGoogleFailureRedirectUri("Google sign-in session validation failed. Please try again."));
        }

        if (string.IsNullOrWhiteSpace(expectedNonce))
        {
            return Redirect(BuildGoogleFailureRedirectUri("Google sign-in session expired. Please try again."));
        }

        GoogleIdentityResult googleIdentity = await _googleAuthService.ExchangeCodeForIdentityAsync(
            code,
            expectedNonce,
            cancellationToken
        );

        if (!googleIdentity.Success || googleIdentity.Identity == null)
        {
            return Redirect(BuildGoogleFailureRedirectUri(
                googleIdentity.Error ?? "Google sign-in failed. Please try again."
            ));
        }

        AuthCommandResult result = await _authCommands.GoogleAuthAsync(new GoogleAuthCommand
        {
            Subject = googleIdentity.Identity.Subject,
            Email = googleIdentity.Identity.Email,
            FirstName = googleIdentity.Identity.GivenName,
            LastName = googleIdentity.Identity.FamilyName,
            Avatar = googleIdentity.Identity.PictureUrl
        }, cancellationToken);

        if (!result.Success || result.User == null || result.User.UserID == null || string.IsNullOrWhiteSpace(result.RoleName))
        {
            _logger.LogWarning(
                "Google auth command failed. reason={Reason} message={Message}",
                result.FailureReason,
                result.Message
            );
            return Redirect(BuildGoogleFailureRedirectUri(
                result.Message ?? "Unable to sign in with Google."
            ));
        }

        if (result.User.TwoFactorEnabled)
        {
            if (string.IsNullOrWhiteSpace(result.User.TwoFactorSecret))
            {
                return Redirect(BuildGoogleFailureRedirectUri(
                    "Two-factor secret is unavailable. Please reset 2FA from settings."
                ));
            }

            string challengeToken = _twoFactorService.IssueLoginChallengeToken(
                result.User.UserID.Value,
                DateTimeOffset.UtcNow
            );

            string challengeRedirect = QueryHelpers.AddQueryString(
                _googleAuthService.GetFrontendFailureUrl(),
                new Dictionary<string, string?>
                {
                    ["twoFactorRequired"] = "1",
                    ["twoFactorToken"] = challengeToken
                }
            );
            return Redirect(challengeRedirect);
        }

        _ = AuthShared.CreateAuthenticatedResponse(_tokenService, Response, result.User, result.RoleName);
        return Redirect(_googleAuthService.GetFrontendSuccessUrl());
    }

    private string BuildGoogleFailureRedirectUri(string message)
    {
        string frontendFailureUrl = _googleAuthService.GetFrontendFailureUrl();
        return QueryHelpers.AddQueryString(frontendFailureUrl, "googleError", message);
    }
}
