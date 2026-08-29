import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "pill" | "google";

type Props = {
  href?: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  href,
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: Props) {
  const classes = `btn btn-${variant} ${className}`.trim();

  if (href) {
    const isRedirect = href.startsWith("/go/") || href.startsWith("http");
    if (isRedirect) {
      return (
        <a href={href} className={classes}>
          <span>{children}</span>
        </a>
      );
    }

    return (
      <Link href={href} className={classes}>
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      <span>{children}</span>
    </button>
  );
}
