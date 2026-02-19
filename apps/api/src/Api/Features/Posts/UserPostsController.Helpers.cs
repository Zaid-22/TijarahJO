using Models;
using System;
using System.Collections.Generic;
using System.Security.Claims;

namespace TijarahJoDBAPI.Features.Posts
{
	public partial class UserPostsController
	{
		private static readonly DateTime SqlDateTimeMinUtc = new DateTime(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		private static bool IsAdminUser(ClaimsPrincipal user)
		{
			var roleClaim = user.FindFirst(ClaimTypes.Role)?.Value;
			return int.TryParse(roleClaim, out int roleId) && roleId == 1;
		}

		private static DateTime NormalizeSqlDateTime(DateTime value)
		{
			if (value == default || value < SqlDateTimeMinUtc)
			{
				return DateTime.UtcNow;
			}

			return value.Kind switch
			{
				DateTimeKind.Utc => value,
				DateTimeKind.Local => value.ToUniversalTime(),
				_ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
			};
		}
	}
}
