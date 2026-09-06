"use client";

import { useActionState, useId, useState } from "react";
import { Building2, Check, User, type LucideIcon } from "lucide-react";
import { registerAction, type ActionResult } from "@/actions/auth";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AuthLink } from "./auth-card";
import { FormNotice } from "./form-notice";
import { PasswordHint, PASSWORD_MIN_LENGTH } from "./password-hint";
import { PasswordInput } from "./password-input";

export type AccountType = "PRIVATE" | "BUSINESS";

const FIELDS = ["name", "email", "password", "accountType", "accept"] as const;

const accountTypes: { value: AccountType; label: string; text: string; icon: LucideIcon }[] = [
  { value: "PRIVATE", label: "Privatperson", text: "Gratis. Kom igång på en minut.", icon: User },
  { value: "BUSINESS", label: "Företag", text: "Väntelista – vi hör av oss.", icon: Building2 },
];

export function RegisterForm({ initialAccountType = "PRIVATE" }: { initialAccountType?: AccountType }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(registerAction, null);
  // Controlled inputs so nothing is lost when the server sends back a validation error.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
  const [accept, setAccept] = useState(false);
  const id = useId();

  const fieldErrors: Record<string, string> = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const hasFieldError = FIELDS.some((field) => Boolean(fieldErrors[field]));
  const formError = state && !state.ok && !hasFieldError ? state.error : null;
  const isBusiness = accountType === "BUSINESS";

  return (
    <form action={formAction} className="space-y-5" aria-busy={pending}>
      {formError ? <FormNotice tone="error">{formError}</FormNotice> : null}

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-ink-800">Vem ska spara kvitton?</legend>
        <div className="grid grid-cols-2 gap-3">
          {accountTypes.map((option) => {
            const selected = accountType === option.value;
            const Icon = option.icon;
            return (
              <label key={option.value} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value={option.value}
                  checked={selected}
                  onChange={() => setAccountType(option.value)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex h-full flex-col gap-2 rounded-xl border bg-white p-3.5 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2",
                    selected ? "border-brand-600 bg-brand-50 shadow-soft ring-1 ring-brand-600" : "border-ink-200 hover:border-ink-300",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        selected ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {selected ? <Check className="h-4 w-4 text-brand-700" aria-hidden /> : null}
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{option.label}</span>
                  <span className="text-xs leading-snug text-ink-500">{option.text}</span>
                </span>
              </label>
            );
          })}
        </div>
        <FieldError>{fieldErrors.accountType}</FieldError>
        {isBusiness ? (
          <FormNotice tone="info" className="mt-3">
            Företagskonton öppnar vi stegvis. När du klickar på <strong className="font-semibold">Skapa konto</strong> hamnar du i kön på
            väntelistan med dina uppgifter förifyllda – vi hör av oss så fort din plats är klar.
          </FormNotice>
        ) : null}
      </fieldset>

      <div>
        <Label htmlFor={`${id}-name`}>Namn</Label>
        <Input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          placeholder="Anna Andersson"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={fieldErrors.name ? true : undefined}
        />
        <FieldError>{fieldErrors.name}</FieldError>
      </div>

      <div>
        <Label htmlFor={`${id}-email`}>E-post</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          placeholder="anna@exempel.se"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
        />
        <FieldError>{fieldErrors.email}</FieldError>
      </div>

      <div>
        <Label htmlFor={`${id}-password`}>Lösenord</Label>
        <PasswordInput
          id={`${id}-password`}
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={128}
          placeholder="Minst 8 tecken"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={`${id}-password-hint`}
        />
        <FieldError>{fieldErrors.password}</FieldError>
        <PasswordHint id={`${id}-password-hint`} length={password.length} />
      </div>

      <div>
        <label htmlFor={`${id}-accept`} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-700">
          <input
            id={`${id}-accept`}
            name="accept"
            type="checkbox"
            value="on"
            required
            checked={accept}
            onChange={(event) => setAccept(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-ink-300 accent-brand-600"
            aria-invalid={fieldErrors.accept ? true : undefined}
          />
          <span>
            Jag godkänner{" "}
            <AuthLink href="/villkor" target="_blank" rel="noopener noreferrer">
              användarvillkoren
            </AuthLink>{" "}
            och har läst{" "}
            <AuthLink href="/integritet" target="_blank" rel="noopener noreferrer">
              integritetspolicyn
            </AuthLink>
            .
          </span>
        </label>
        <FieldError>{fieldErrors.accept}</FieldError>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? (isBusiness ? "Skickar…" : "Skapar konto…") : "Skapa konto"}
      </Button>
    </form>
  );
}
