"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import NewsFeed from "@/components/feed/NewsFeed";

export default function NewsManagePage() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useMemo(() => pathname.split("/")[1] || "en", [pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold">Gérer les actualités</h1>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/news/create`)}
            className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
          >
            Créer une actualité
          </button>
        </div>

        <NewsFeed locale={locale} userRoles={user.roles} />
      </div>
    </div>
  );
}
