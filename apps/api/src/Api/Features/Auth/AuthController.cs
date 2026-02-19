using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Contracts.Responses;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDBAPI.Common.Utils;

namespace TijarahJoDBAPI.Features.Auth
{
	[ApiController]
	[Route("api/auth")]
	public class AuthController : ControllerBase
	{
		private readonly TokenService _tokenService;
		private readonly ILogger<AuthController> _logger;
		private readonly IUserService _users;

		public AuthController(TokenService tokenService, ILogger<AuthController> logger, IUserService users)
		{
			_tokenService = tokenService;
			_logger = logger;
			_users = users;
		}

		[HttpPost("login", Name = "Login")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
		{
			if (request == null ||
				string.IsNullOrWhiteSpace(request.Login) ||
				string.IsNullOrWhiteSpace(request.Password))
			{
				return BadRequest(new AuthResponse
				{
					Success = false,
					Message = "Invalid login data."
				});
			}

				List<string> loginCandidates = BuildLoginCandidates(request.Login!);
				UserAccount? user = TryFindByLoginCandidates(loginCandidates);

				if (user == null || user.UserID == null || !PasswordHelper.VerifyPassword(request.Password!, user.HashedPassword))
				{
					_logger.LogInformation("Login failed for {Login}", request.Login);
					return Unauthorized(new AuthResponse
					{
						Success = false,
						Message = "Invalid email/phone or password."
					});
				}

				if (user.IsDeleted)
				{
					return Unauthorized(new AuthResponse
					{
						Success = false,
						Message = "User account is deleted."
					});
				}

				if (user.Status != 1)
				{
					return Unauthorized(new AuthResponse
					{
						Success = false,
						Message = "User account is banned or inactive."
					});
				}

				if (PasswordHelper.NeedsRehash(user.HashedPassword))
				{
					try
					{
						user.HashedPassword = PasswordHelper.HashPassword(request.Password!);
						if (_users.Save(user))
						{
							_logger.LogInformation("Upgraded password hash for UserID {UserId}", user.UserID);
						}
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Failed to upgrade password hash for UserID {UserId}", user.UserID);
					}
				}

			// Generate JWT token
			string token = _tokenService.GenerateToken(
				user.UserID.Value,
				user.Email,
				user.RoleID
			);

			SetTokenCookie(token);

			return Ok(new AuthResponse
			{
				Success = true,
				Token = token,
				User = DTOMapper.ToUserResponseDTO(user.UserModel)
			});
		}

		[HttpPost("signup", Name = "Signup")]
		[ProducesResponseType(StatusCodes.Status201Created)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
			public ActionResult<AuthResponse> Signup([FromBody] SignUpRequest request)
			{
				if (request == null ||
					string.IsNullOrWhiteSpace(request.Password) ||
					string.IsNullOrWhiteSpace(request.FirstName))
				{
					return BadRequest(new AuthResponse
					{
						Success = false,
						Message = "Invalid signup data. Password and first name are required."
					});
				}

				string? normalizedEmail = NormalizeEmail(request.Email);
				string? normalizedPhone = NormalizePhone(request.Phone) ?? NormalizePhone(request.Email);
				bool isPhoneOnlySignup = string.IsNullOrWhiteSpace(normalizedEmail) && !string.IsNullOrWhiteSpace(normalizedPhone);

				if (string.IsNullOrWhiteSpace(normalizedEmail) && string.IsNullOrWhiteSpace(normalizedPhone))
				{
					return BadRequest(new AuthResponse
					{
						Success = false,
						Message = "Email or phone number is required."
					});
				}

				if (string.IsNullOrWhiteSpace(normalizedEmail) && !string.IsNullOrWhiteSpace(normalizedPhone))
				{
					normalizedEmail = BuildPhoneAliasEmail(normalizedPhone!);
				}

				// Hash password
				string hashedPassword = PasswordHelper.HashPassword(request.Password!);
				string? normalizedCity = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
				string? normalizedArea = string.IsNullOrWhiteSpace(request.Area) ? null : request.Area.Trim();
				string? normalizedBio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
				string? normalizedAvatar = string.IsNullOrWhiteSpace(request.Avatar) ? null : request.Avatar.Trim();

			// Create user model
			Models.UserModel newUser = new Models.UserModel
			(
					null, // UserID - will be set after save
					hashedPassword,
					normalizedEmail!,
					request.FirstName.Trim(),
					request.LastName?.Trim() ?? string.Empty,
					normalizedPhone,
					normalizedCity,
					normalizedArea,
					normalizedBio,
					normalizedAvatar,
					DateTime.UtcNow, // JoinDate
					1, // Status - Active
					2, // RoleID - User (1=Admin, 2=User)
				false // IsDeleted
			);

		try
		{
			UserAccount user = _users.Create(newUser);

			if (!_users.Save(user))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, new AuthResponse
				{
					Success = false,
					Message = "Error creating user account. Please try again."
				});
			}

			// Generate JWT token
			string token = _tokenService.GenerateToken(
				user.UserID!.Value,
				user.Email,
				user.RoleID
			);

			SetTokenCookie(token);

			var authResponse = new AuthResponse
			{
				Success = true,
				Token = token,
				User = DTOMapper.ToUserResponseDTO(user.UserModel)
			};

			return StatusCode(StatusCodes.Status201Created, authResponse);
			}
			catch (SqlException sqlEx)
			{
				_logger.LogError(sqlEx, "SQL exception during signup (Number={SqlNumber}, Procedure={SqlProcedure})", sqlEx.Number, sqlEx.Procedure);
				
				// Handle stored procedure not found
				if (sqlEx.Number == 2812
					|| sqlEx.Message.Contains("could not be found")
					|| sqlEx.Message.Contains("SP_AddTbUser")
					|| sqlEx.Message.Contains("usp_AddTbUser"))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, new AuthResponse
				{
					Success = false,
					Message = "Database configuration error. Please contact support."
				});
			}

				// Handle unique constraint violations
				// SQL Server error numbers: 2627 = Unique constraint violation, 2601 = Duplicate key
				if (sqlEx.Number == 2627 || sqlEx.Number == 2601)
				{
					string errorMsgUpper = sqlEx.Message.ToUpper();
					string errorMessage;

						// Check for email constraint violation
						// Constraint name might be: UQ_TbUsers_Email or UQ_TbUsers_E or just contain "Email"
						if (errorMsgUpper.Contains("UQ_TBUSERS_EMAIL") || 
						    errorMsgUpper.Contains("UQ_TBUSERS_E") || 
						    (errorMsgUpper.Contains("EMAIL") && errorMsgUpper.Contains("UNIQUE")))
						{
							errorMessage = isPhoneOnlySignup
								? "An account with this phone number already exists. Please use a different phone number or try logging in."
								: "An account with this email address already exists. Please use a different email or try logging in.";
						}
						else
						{
						// Generic unique constraint error
						errorMessage = "An account with this information already exists. Please check your details and try again.";
						_logger.LogWarning(sqlEx, "Unhandled unique-constraint pattern during signup.");
					}

					return BadRequest(new AuthResponse
					{
						Success = false,
					Message = errorMessage
				});
			}

				// Handle other SQL errors
				return StatusCode(StatusCodes.Status500InternalServerError, new AuthResponse
				{
					Success = false,
				Message = "Database operation failed. Please verify server configuration and try again."
			});
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Unhandled exception during signup.");
				
				// Handle other exceptions
				return StatusCode(StatusCodes.Status500InternalServerError, new AuthResponse
			{
				Success = false,
				Message = "An error occurred while creating your account. Please try again."
			});
		}
		}

		[HttpGet("me", Name = "GetCurrentUser")]
		[Authorize]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		public ActionResult<UserResponseDTO> GetCurrentUser()
		{
			// Extract user ID from JWT token claims
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

			if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
			{
				return Unauthorized(new { message = "Invalid token. User ID not found." });
			}

			// Get user from database
			UserAccount? user = _users.Find(userId);

				if (user == null || user.IsDeleted)
				{
					return Unauthorized(new { message = "User not found or deleted." });
				}

				if (user.Status != 1)
				{
					return Unauthorized(new { message = "User account is banned or inactive." });
				}

				return Ok(DTOMapper.ToUserResponseDTO(user.UserModel));
			}

		[HttpPost("logout", Name = "Logout")]
		[Authorize]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
			public ActionResult Logout()
			{
				Response.Cookies.Delete("jwt");
				Response.Cookies.Delete("tj-csrf");
				Response.Cookies.Delete("XSRF-TOKEN");
				return Ok(new { message = "Logged out successfully" });
			}

			private static List<string> BuildLoginCandidates(string login)
			{
				var candidates = new List<string>();
				string trimmedLogin = login?.Trim() ?? string.Empty;
				if (!string.IsNullOrWhiteSpace(trimmedLogin))
				{
					candidates.Add(trimmedLogin);
				}

				string? normalizedPhone = NormalizePhone(trimmedLogin);
				if (!string.IsNullOrWhiteSpace(normalizedPhone) &&
					!candidates.Any(c => string.Equals(c, normalizedPhone, StringComparison.OrdinalIgnoreCase)))
				{
					candidates.Add(normalizedPhone);
				}

				return candidates;
			}

			private UserAccount? TryFindByLoginCandidates(IEnumerable<string> loginCandidates)
			{
				foreach (string loginCandidate in loginCandidates)
				{
					UserAccount? user = _users.FindByLogin(loginCandidate);
					if (user != null && user.UserID != null)
					{
						return user;
					}
				}

				return null;
			}

			private static string? NormalizeEmail(string? email)
			{
				if (string.IsNullOrWhiteSpace(email))
				{
					return null;
				}

				return email.Trim().ToLowerInvariant();
			}

			private static string? NormalizePhone(string? phone)
			{
				if (string.IsNullOrWhiteSpace(phone))
				{
					return null;
				}

				string digitsOnly = new string(phone.Where(char.IsDigit).ToArray());
				if (string.IsNullOrWhiteSpace(digitsOnly))
				{
					return null;
				}

				if (digitsOnly.StartsWith("962", StringComparison.Ordinal))
				{
					digitsOnly = digitsOnly.Substring(3);
				}

				if (digitsOnly.StartsWith("0", StringComparison.Ordinal) && digitsOnly.Length == 10)
				{
					digitsOnly = digitsOnly.Substring(1);
				}

				if (digitsOnly.Length != 9)
				{
					return null;
				}

				return $"+962{digitsOnly}";
			}

			private static string BuildPhoneAliasEmail(string normalizedPhone)
			{
				string digitsOnly = new string(normalizedPhone.Where(char.IsDigit).ToArray());
				return $"phone_{digitsOnly}@tijarahjo.local";
			}

			private void SetTokenCookie(string token)
			{
			bool isHttpsRequest = HttpContext.Request.IsHttps;

			var cookieOptions = new CookieOptions
			{
				HttpOnly = true,
				Expires = DateTime.UtcNow.AddDays(7),
				// SameSite=None requires Secure=true; for local HTTP dev use Lax to avoid silently dropped cookies.
				Secure = isHttpsRequest,
				SameSite = isHttpsRequest ? SameSiteMode.None : SameSiteMode.Lax
			};
			Response.Cookies.Append("jwt", token, cookieOptions);
		}
	}
}
