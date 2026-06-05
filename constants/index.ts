export * from './colors';
export * from './ministries';
export * from './typography';
export * from './spacing';

export const SUBSCRIPTION_PLANS = {
  free: { label: 'Gratuito', memberLimit: 7, priceMonthly: 0 },
  starter: { label: 'Starter', memberLimit: 15, priceMonthly: 2.99 },
  growth: { label: 'Growth', memberLimit: 25, priceMonthly: 5.99 },
  pro: { label: 'Pro', memberLimit: 35, priceMonthly: 8.99 },
  enterprise: { label: 'Enterprise', memberLimit: 50, priceMonthly: 15.0 },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
