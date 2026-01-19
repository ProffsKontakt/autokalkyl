import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata = {
  title: 'Glomt losenord - Kalkyla.se',
  description: 'Aterstall ditt losenord',
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Glomt losenord?</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Ange din e-postadress sa skickar vi en lank for att aterstalla ditt losenord.
        </p>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
