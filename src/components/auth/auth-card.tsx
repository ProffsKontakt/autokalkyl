import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

const iconTones = {
  brand: "bg-brand-50 text-brand-700",
  danger: "bg-red-50 text-danger",
} as const;

/**
 * Shared frame for every auth page: a white card with an optional icon tile, an h1,
 * a short description and the form, plus a line of secondary links below the card.
 */
export function AuthCard({
  icon: Icon,
  iconTone = "brand",
  title,
  description,
  children,
  footer,
}: {
  icon?: LucideIcon;
  iconTone?: keyof typeof iconTones;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            {Icon ? (
              <div className={cn("mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl", iconTones[iconTone])} aria-hidden>
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
            {description ? <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{description}</p> : null}
          </div>
          {children}
        </CardContent>
      </Card>
      {footer ? <div className="mt-5 text-center text-sm text-ink-600">{footer}</div> : null}
    </div>
  );
}

/** Inline text link in the brand colour, used for "Skapa konto", "Glömt lösenordet?" etc. */
export function AuthLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link className={cn("font-medium text-brand-700 underline-offset-4 transition-colors hover:text-brand-800 hover:underline", className)} {...props} />;
}
