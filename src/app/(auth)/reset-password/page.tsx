import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResetPasswordForm } from './reset-password-form';
import { validateResetToken } from '@/actions/password-reset';
import Link from 'next/link';

export const metadata = {
  title: 'Aterstall losenord - Kalkyla.se',
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Ogiltig lank</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Lanken for att aterstalla losenord saknas eller ar ogiltig.
          </p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Begar en ny aterstallningslank
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { valid, error } = await validateResetToken(token);

  if (!valid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Lanken ar ogiltig</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Begar en ny aterstallningslank
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Valj nytt losenord</CardTitle>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
