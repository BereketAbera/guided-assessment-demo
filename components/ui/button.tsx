import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-pine text-white hover:bg-pine-deep",
        secondary: "border border-line bg-paper text-ink hover:bg-sand",
        quiet: "text-pine underline decoration-1 underline-offset-4 hover:text-pine-deep hover:decoration-2",
        danger: "border border-clay bg-paper text-clay hover:bg-clay hover:text-white",
      },
      size: {
        md: "min-h-11 px-5 text-[0.95rem]",
        lg: "min-h-13 px-6 text-base",
        sm: "min-h-9 px-3 text-sm",
        bare: "min-h-11 px-1 text-[0.95rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, type = "button", ...props }: Props) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
