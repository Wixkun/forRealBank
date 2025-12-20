'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/schemas/register.schema';
import { FormField } from '@/components/molecules/FormField';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    router.push('/login?registered=true');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex gap-4">
        <FormField
          label={t('firstName')}
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <FormField
          label={t('lastName')}
          {...register('lastName')}
          error={errors.lastName?.message}
        />
      </div>

      <FormField
        label={t('email')}
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />

      <FormField
        label={t('password')}
        type="password"
        {...register('password')}
        error={errors.password?.message}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('loading') : t('submit')}
      </Button>
    </form>
  );
}
