using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<MessageEntity>
{
    public void Configure(EntityTypeBuilder<MessageEntity> builder)
    {
        builder.ToTable("Messages", tableBuilder =>
        {
            tableBuilder.HasTrigger("TR_Messages_ParticipantValidation");
        });
        builder.HasKey(e => e.MessageID);
        builder.Property(e => e.MessageID).ValueGeneratedOnAdd();
        builder.Property(e => e.Content).HasMaxLength(4000).IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.SenderID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.ReceiverID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Conversation)
            .WithMany()
            .HasForeignKey(e => e.ConversationID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
