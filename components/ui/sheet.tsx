"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A panel that slides over the page: a side drawer on wide screens, a bottom
 * sheet on a phone. Built on Radix Dialog, so focus is trapped and returned,
 * and Escape closes it.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = "drawer",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "drawer" | "dialog";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="no-print fixed inset-0 z-40 bg-ink/45" />
        <Dialog.Content
          className={cn(
            "no-print sheet-in fixed z-50 flex flex-col bg-paper shadow-2xl outline-none",
            variant === "drawer"
              ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[30rem] sm:rounded-none"
              : "inset-x-3 top-[12dvh] mx-auto max-h-[80dvh] max-w-md rounded-2xl",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-rule px-5 pt-5 pb-4">
            <div>
              <Dialog.Title className="font-serif text-xl leading-snug font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-stone">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-stone hover:bg-sand hover:text-ink"
              aria-label="Close"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
