import { settings } from "@/lib/settings";
import { cn } from "@/lib/utils";

/** The mark: a shape and its reflection across a thin line. Original, drawn for this sample. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden focusable="false">
      <path d="M6 14.5a10 10 0 0 1 20 0Z" fill="#1F5C55" />
      <path d="M26 18.5a10 10 0 0 1-20 0Z" fill="none" stroke="#1F5C55" strokeWidth="1.6" />
      <rect x="3" y="15.9" width="26" height="1.2" fill="#A8472B" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="font-serif text-[1.05rem] font-semibold tracking-tight">{settings.assessment.brand}</span>
    </span>
  );
}
