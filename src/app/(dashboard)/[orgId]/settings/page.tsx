import { SettingsClient } from '@/modules/settings/SettingsClient';
interface Props { params: Promise<{ orgId: string }> }
export default async function SettingsPage({ params }: Props) {
  const { orgId } = await params;
  return <SettingsClient orgId={orgId} />;
}
