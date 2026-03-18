using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Common
{
    public class Message
    {
        public MessageModel MessageModel { get; set; }

        public Message()
        {
            this.MessageModel = new MessageModel();
        }

        public Message(MessageModel messageModel)
        {
            this.MessageModel = messageModel;
        }
    }
}
