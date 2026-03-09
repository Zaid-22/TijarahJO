import { HelpCircle, Mail, Shield } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Separator } from "../../../shared/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import type { SettingsTranslations } from "../../../translations/settings";

interface HelpSectionProps {
  text: SettingsTranslations;
  isRTL: boolean;
  onOpenHelpCenter?: () => void;
  onContactSupport?: () => void;
  onReportIssue?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export function HelpSection({
  text,
  isRTL,
  onOpenHelpCenter,
  onContactSupport,
  onReportIssue,
  onOpenTerms,
  onOpenPrivacy,
}: HelpSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{text.help}</CardTitle>
            <CardDescription>{text.helpDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onOpenHelpCenter}
        >
          <HelpCircle className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {text.helpCenter}
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onContactSupport}
        >
          <Mail className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {text.contactSupport}
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onReportIssue}
        >
          <Shield className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {text.reportIssue}
        </Button>
        <Separator />
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={onOpenTerms}
        >
          {text.termsOfService}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={onOpenPrivacy}
        >
          {text.privacyPolicy}
        </Button>
      </CardContent>
    </Card>
  );
}
