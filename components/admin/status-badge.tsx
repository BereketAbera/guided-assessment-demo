import type { Status } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";

const tone: Record<Status, string> = {
  not_started: "border-line text-stone",
  in_progress: "border-pine text-pine",
  preparing: "border-pine text-pine",
  report_ready: "border-pine bg-pine text-white",
  expired: "border-clay text-clay",
  deleted: "border-line bg-sand text-stone",
};

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tone[status])}>
      {label}
    </span>
  );
}
