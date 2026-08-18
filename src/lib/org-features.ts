/**
 * Funcionalidades que o administrador pode esconder da app para a sua
 * organização (independente do plano — é uma preferência, não um limite).
 *
 * Fonte de verdade: `organizations.disabled_features` (migração 041).
 * Uma funcionalidade ausente dessa lista está visível — o padrão é "tudo
 * ligado", para não esconder nada de quem já usa a app.
 */

export type OrgToggleFeature = 'checkin' | 'engagement_reports' | 'liturgies' | 'mural';

export const ORG_TOGGLE_FEATURES: OrgToggleFeature[] = [
  'checkin', 'engagement_reports', 'liturgies', 'mural',
];

export const ORG_FEATURE_INFO: Record<OrgToggleFeature, { label: string; description: string }> = {
  checkin: {
    label: 'Check-in',
    description: 'Registo de presença dos voluntários e líderes nos eventos.',
  },
  engagement_reports: {
    label: 'Relatórios',
    description: 'Taxa de resposta, confirmações e frequência de participação.',
  },
  liturgies: {
    label: 'Roteiros',
    description: 'Ordem e horários dos momentos do culto.',
  },
  mural: {
    label: 'Mural',
    description: 'Avisos e comunicados para a equipa.',
  },
};

export function isOrgFeatureEnabled(
  disabledFeatures: string[] | null | undefined,
  feature: OrgToggleFeature,
): boolean {
  return !(disabledFeatures ?? []).includes(feature);
}
