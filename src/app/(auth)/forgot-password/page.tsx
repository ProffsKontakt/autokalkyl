import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata = {
  title: 'Glömt lösenord - Kalkyla.se',
  description: 'Återställ ditt lösenord',
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Glömt lösenord?</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
        </p>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
