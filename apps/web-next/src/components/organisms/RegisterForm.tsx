'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/schemas/register.schema';
import { FormField } from '@/components/molecules/FormField';
import { Button } from '@/components/ui/Button';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string>('');
  const locale = pathname.split('/')[1] || 'en';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          router.push(`/${locale}/dashboard`);
        }
      } catch {
      }
    };
    
    checkAuth();
  }, [router, locale]);

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
      const response = await fetch(`${apiUrl}/auth/register`, {
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

      <div className="text-center text-sm mt-4">
        <span className="text-gray-400">{tCommon('alreadyHaveAccount')} </span>
        <Link 
          href={`/${locale}/login`}
          className="text-teal-400 hover:text-teal-300 transition font-medium"
        >
          {tCommon('signIn')}
        </Link>
      </div>
    </form>
  );
}
