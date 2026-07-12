import { apiFetch } from '@/lib/api-client';
import type { AnalyticsOverview } from './types';

export function fetchAnalytics(months: number): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>(`/analytics/overview?months=${months}`);
}
