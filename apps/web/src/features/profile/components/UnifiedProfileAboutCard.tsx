import type { UnifiedProfileViewModel } from "../types";
import type { UnifiedProfileLabels } from "./unifiedProfileLabels";

interface UnifiedProfileAboutCardProps {
  viewModel: UnifiedProfileViewModel;
  labels: UnifiedProfileLabels;
}

export function UnifiedProfileAboutCard({
  viewModel,
  labels,
}: UnifiedProfileAboutCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="max-w-3xl">
        <h2 className="text-xl font-bold text-foreground">{labels.aboutMe}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {viewModel.profile.bio?.trim() || labels.noBio}
        </p>
      </div>
    </div>
  );
}
