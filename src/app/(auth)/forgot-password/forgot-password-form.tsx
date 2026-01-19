'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/actions/password-reset';

const forgotPasswordSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(data);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          Om det finns ett konto med denna e-postadress har vi skickat instruktioner for att aterstalla losenordet.
        </div>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Tillbaka till inloggning
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-postadress</Label>
        <Input
          id="email"
          type="email"
          placeholder="namn@foretag.se"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Skickar...' : 'Skicka aterstaLlningslank'}
      </Button>

      <div className="text-center">
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Tillbaka till inloggning
        </Link>
      </div>
    </form>
  );
}
