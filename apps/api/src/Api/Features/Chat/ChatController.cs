using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using System;
using System.Collections.Generic;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Hubs;

namespace TijarahJoDBAPI.Features.Chat
{
    [Authorize]
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IMessageService _messages;

        public ChatController(IMessageService messages)
        {
            _messages = messages;
        }

        [HttpGet("history/{otherUserId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<MessageModel>> GetChatHistory(int otherUserId)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            if (otherUserId < 1)
            {
                return BadRequest("Invalid chat user ID.");
            }

            // Mark messages as read when fetching history
            _messages.MarkAsRead(currentUserId, otherUserId);

            var history = _messages.GetChatHistory(currentUserId, otherUserId);
            return Ok(history);
        }

        [HttpGet("recent")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<MessageModel>> GetRecentChats()
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            var recentChats = _messages.GetRecentChats(currentUserId);
            return Ok(recentChats);
        }

        [HttpGet("presence/{otherUserId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult GetPresence(int otherUserId)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            if (otherUserId < 1)
            {
                return BadRequest("Invalid chat user ID.");
            }

            if (otherUserId == currentUserId)
            {
                return Ok(new { userId = otherUserId, isOnline = true });
            }

            bool isOnline = ChatHub.IsUserOnline(otherUserId.ToString());
            return Ok(new { userId = otherUserId, isOnline });
        }

        // Fallback for HTTP sending if SignalR fails
        [HttpPost("send")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult SendMessage([FromBody] MessageModel? message)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            if (message == null)
            {
                return BadRequest("Message payload is required.");
            }

            if (message.ReceiverId < 1)
            {
                return BadRequest("A valid receiver ID is required.");
            }

            if (message.ReceiverId == currentUserId)
            {
                return BadRequest("Cannot send a message to yourself.");
            }

            if (string.IsNullOrWhiteSpace(message.Content))
            {
                return BadRequest("Message content is required.");
            }

            message.Content = message.Content.Trim();
            message.SenderId = currentUserId;
            message.Timestamp = DateTime.UtcNow;
            message.IsRead = false;

            var msg = _messages.Create(message);
            if (_messages.Save(msg))
            {
                return Ok(msg.MessageModel);
            }
            return BadRequest("Failed to send message");
        }
    }
}
