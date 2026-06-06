import { BadgeCheck, ShieldAlert, Clock } from "lucide-react";
import type { VerificationStatus } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function VerificationBadge({
  status,
  className,
  showLabel = true,
}: {
  status: VerificationStatus;
  className?: string;
  showLabel?: boolean;
}) {
  if (status === "verified") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary", className)}>
        <BadgeCheck className="h-3.5 w-3.5" />
        {showLabel && "Verified"}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400", className)}>
        <Clock className="h-3.5 w-3.5" />
        {showLabel && "Pending"}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground", className)}>
      <ShieldAlert className="h-3.5 w-3.5" />
      {showLabel && "Unverified"}
    </span>
  );
}
