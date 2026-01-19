import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Logga in - Kalkyla.se',
  description: 'Logga in till ditt Kalkyla-konto',
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Logga in</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
