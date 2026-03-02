import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { cn } from "./utils";

interface InfoPageIntroCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function InfoPageIntroCard({
  icon: Icon,
  title,
  description,
  className,
}: InfoPageIntroCardProps) {
  return (
    <Card className={cn("border-primary/20 bg-card/95 backdrop-blur-sm", className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

interface InfoPageSupportCardProps {
  label: string;
  ctaLabel: string;
  to?: string;
  className?: string;
}

export function InfoPageSupportCard({
  label,
  ctaLabel,
  to = "/help",
  className,
}: InfoPageSupportCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Link
          to={to}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-primary text-primary",
          )}
        >
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
