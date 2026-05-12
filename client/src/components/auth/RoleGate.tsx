import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/lib/constants';

export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allow.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
