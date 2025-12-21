'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/schemas/register.schema';
import { FormField } from '@/components/molecules/FormField';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
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
