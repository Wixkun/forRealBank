'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const response = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user || null);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          
          if (pathname.includes('/dashboard') || 
              pathname.includes('/account') || 
              pathname.includes('/brokerage') ||
              pathname.includes('/trading') ||
              pathname.includes('/chat')) {
            const locale = pathname.split('/')[1] || 'en';
            router.push(`/${locale}/login`);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        
        if (pathname.includes('/dashboard') || 
            pathname.includes('/account') || 
            pathname.includes('/brokerage') ||
            pathname.includes('/trading') ||
            pathname.includes('/chat')) {
          const locale = pathname.split('/')[1] || 'en';
          router.push(`/${locale}/login`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  return { isAuthenticated, isLoading, user };
}
