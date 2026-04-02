import { User, Camera, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/ui/avatar";

interface AuthAvatarUploadProps {
  avatarPreview?: string;
  onAvatarClick?: () => void;
  tapToUploadText: string;
  uploadPhotoOptionalText: string;
}

export function AuthAvatarUpload({
  avatarPreview,
  onAvatarClick,
  tapToUploadText,
  uploadPhotoOptionalText,
}: AuthAvatarUploadProps) {
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <button
        type="button"
        className="relative cursor-pointer group rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={onAvatarClick}
        aria-label={tapToUploadText}
      >
        <Avatar className="w-24 h-24 border border-border">
          <AvatarImage
            src={avatarPreview}
            className="object-cover object-center"
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-9 w-9" />
          </AvatarFallback>
        </Avatar>
          <div className="absolute bottom-0 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 opacity-90 group-hover:opacity-100 transition-opacity">
          <Camera className="w-4 h-4" />
        </div>
      </button>
      <button
        type="button"
        onClick={onAvatarClick}
        className="mt-3 text-sm font-medium text-primary hover:underline flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-sm px-1 py-0.5"
      >
        <Upload className="w-3.5 h-3.5" />
        {uploadPhotoOptionalText}
      </button>
    </div>
  );
}
