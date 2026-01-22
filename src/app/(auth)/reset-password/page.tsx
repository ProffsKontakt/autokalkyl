import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResetPasswordForm } from './reset-password-form';
import { validateResetToken } from '@/actions/password-reset';
import Link from 'next/link';

export const metadata = {
  title: 'Återställ lösenord - Kalkyla.se',
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
          <CardTitle className="text-center">Ogiltig länk</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Länken för att återställa lösenord saknas eller är ogiltig.
          </p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Begär en ny återställningslänk
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
          <CardTitle className="text-center">Länken är ogiltig</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Begär en ny återställningslänk
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Välj nytt lösenord</CardTitle>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
