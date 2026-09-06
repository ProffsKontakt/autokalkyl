"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Password field with a show/hide toggle – typing a long password on a phone is much easier when you can see it. */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-12", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-500 transition-colors hover:text-ink-900"
          aria-label={visible ? "Dölj lösenord" : "Visa lösenord"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
    );
  },
);
