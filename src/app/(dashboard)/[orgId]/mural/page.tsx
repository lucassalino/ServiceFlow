import { MuralClient } from '@/modules/mural/MuralClient';
import { OrgFeatureGate } from '@/components/OrgFeatureGate';

export default function MuralPage() {
  return (
    <OrgFeatureGate feature="mural">
      <MuralClient />
    </OrgFeatureGate>
  );
}
