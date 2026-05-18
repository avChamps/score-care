import Link from "next/link";
import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-full text-center text-sm font-black transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f8a5b] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border border-[#2d2119] bg-[#2d2119] px-5 py-3 text-[#fff7e8] shadow-[0_16px_0_rgba(111,89,72,0.18)] hover:-translate-y-1 hover:bg-[#1f8a5b] hover:shadow-[0_20px_0_rgba(31,138,91,0.18)]",
        secondary:
          "border border-[#6f5948]/20 bg-[#fffdf7]/85 px-5 py-3 text-[#2d2119] shadow-[0_10px_30px_rgba(92,62,37,0.08)] backdrop-blur hover:-translate-y-1 hover:border-[#1f8a5b]/40 hover:bg-[#f7e7c6]/80 dark:border-[#6f5948]/20 dark:bg-[#fffdf7]/85 dark:text-[#2d2119]",
        ghost:
          "px-4 py-2 text-[#6f5948] hover:bg-[#f7e7c6]/70 dark:text-[#6f5948] dark:hover:bg-[#f7e7c6]/70",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-12 px-5",
        lg: "h-14 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    href?: string;
    children: ReactNode;
  };

export function Button({ className, variant, size, href, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
