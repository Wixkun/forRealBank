'use client';

// L'état d'auth est désormais partagé via AuthProvider (monté dans le layout
// racine) : un seul fetch /auth/me par navigation au lieu d'un par composant.
export { useAuth } from '@/contexts/AuthContext';
