"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Building2 } from "lucide-react";
import { joinWaitlistAction } from "@/actions/waitlist";
import type { ActionResult } from "@/actions/auth";
import { Button, ButtonLink, Checkmark, FieldError, Hint, Input, Label, Textarea } from "@/components/ui";
import { brand } from "@/lib/brand";

const MESSAGE_MAX = 1000;
const VISIBLE_FIELDS = ["name", "email", "company", "message"] as const;

export function WaitlistForm({
  initialName = "",
  initialEmail = "",
  fromRegistration = false,
}: {
  initialName?: string;
  initialEmail?: string;
  /** True when the user was redirected here after choosing a business account at registration. */
  fromRegistration?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(joinWaitlistAction, null);
  // Controlled inputs so the user's text survives a validation round-trip (React resets uncontrolled forms after an action).
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const id = useId();

  const fieldErrors: Record<string, string> = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const hasVisibleFieldError = VISIBLE_FIELDS.some((field) => Boolean(fieldErrors[field]));
  const formError = state && !state.ok && !hasVisibleFieldError ? state.error : null;

  if (state?.ok) {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center py-4 text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Checkmark size={104} label="Du står i kön" />
        <h2 className="mt-6 text-2xl font-bold text-ink-900">Tack – du står i kön!</h2>
        <p className="mt-2 max-w-sm text-ink-600">
          Vi hör av oss till <strong className="font-semibold text-ink-900">{email.trim().toLowerCase()}</strong> så fort företagsversionen av{" "}
          {brand.name} går att testa.
        </p>
        <p className="mt-6 text-sm text-ink-500">Under tiden kan du spara dina privata kvitton – det är gratis.</p>
        <ButtonLink href="/registrera" variant="outline" size="sm" className="mt-3">
          Skapa ett privat konto
        </ButtonLink>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="relative space-y-4" aria-busy={pending}>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-brand-700">
          <Building2 className="h-5 w-5" aria-hidden />
          <span className="text-sm font-semibold">Väntelista för företag</span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-ink-900">{fromRegistration ? "Tack för intresset!" : "Ställ dig i kön"}</h2>
        <p className="mt-1 text-sm text-ink-600">
          {fromRegistration
            ? "Företagskonton öppnar vi stegvis. Bekräfta dina uppgifter så hör vi av oss så fort din plats är klar."
            : "Lämna dina uppgifter så mailar vi dig när företagsversionen går att testa. Ingen spam, inga nyhetsbrev."}
        </p>
      </div>

      {formError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
          {formError}
        </div>
      ) : null}

      <div>
        <Label htmlFor={`${id}-name`}>Namn</Label>
        <Input
          id={`${id}-name`}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoComplete="name"
          maxLength={100}
          placeholder="Anna Andersson"
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          maxLength={254}
          placeholder="anna@foretaget.se"
          aria-invalid={fieldErrors.email ? true : undefined}
        />
        <FieldError>{fieldErrors.email}</FieldError>
      </div>

      <div>
        <Label htmlFor={`${id}-company`}>
          Företag <span className="font-normal text-ink-500">(valfritt)</span>
        </Label>
        <Input
          id={`${id}-company`}
          name="company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          autoComplete="organization"
          maxLength={150}
          placeholder="Företaget AB"
          aria-invalid={fieldErrors.company ? true : undefined}
        />
        <FieldError>{fieldErrors.company}</FieldError>
      </div>

      <div>
        <Label htmlFor={`${id}-message`}>
          Meddelande <span className="font-normal text-ink-500">(valfritt)</span>
        </Label>
        <Textarea
          id={`${id}-message`}
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX))}
          maxLength={MESSAGE_MAX}
          rows={3}
          placeholder="Vilket bokföringssystem använder ni? Ungefär hur många kvitton hanterar ni per månad?"
          aria-invalid={fieldErrors.message ? true : undefined}
        />
        <FieldError>{fieldErrors.message}</FieldError>
        <Hint>{message.length > 0 ? `${message.length} / ${MESSAGE_MAX} tecken` : "Berätta gärna vad ni behöver – det hjälper oss prioritera rätt."}</Hint>
      </div>

      {/* Honeypot: hidden from people, filled in by naive bots. The server rejects any submission where it is non-empty. */}
      <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Webbplats – lämna tomt</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Skickar…" : "Ställ mig i kön"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-ink-500">
        Vi använder uppgifterna bara för att kontakta dig om företagsversionen. Läs mer i vår{" "}
        <Link href="/integritet" className="underline underline-offset-4 hover:text-ink-900">
          integritetspolicy
        </Link>
        .
      </p>
    </form>
  );
}
