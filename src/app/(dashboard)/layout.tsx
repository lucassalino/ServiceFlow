import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getAuthUser();
  if (!user) redirect('/login');
  return <>{children}</>;
}
