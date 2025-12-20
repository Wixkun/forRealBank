import { RegisterForm } from '@/components/organisms/RegisterForm';
import { AuthLayout } from '@/components/templates/AuthLayout';

export const metadata = {
  title: 'Register',
  robots: 'noindex',
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
