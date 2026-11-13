import { FEATURES, type Feature, type FeatureOverrides, type LimitOverrides } from '../api/types';

export interface LimitInputs {
  units: string;
  barbers: string;
  receptionists: string;
  aiConversationsPerMonth: string;
}

export function featureOverrides(planFeatures: string[], chosen: Set<Feature>): FeatureOverrides {
  const included = new Set(planFeatures);
  return {
    enabled: FEATURES.filter((feature) => chosen.has(feature) && !included.has(feature)),
    disabled: FEATURES.filter((feature) => !chosen.has(feature) && included.has(feature)),
  };
}

type Parsed = { ok: true; value: LimitOverrides | null } | { ok: false; error: string };

const NAMES: Record<keyof LimitInputs, string> = {
  units: 'unidades',
  barbers: 'barbeiros',
  receptionists: 'recepcionistas',
  aiConversationsPerMonth: 'conversas da IA',
};

export function limitOverrides(inputs: LimitInputs): Parsed {
  const value: LimitOverrides = {};
  for (const key of Object.keys(NAMES) as (keyof LimitInputs)[]) {
    const raw = inputs[key].trim().toLowerCase();
    if (!raw) {
      continue;
    }
    if (raw === 'ilimitado') {
      if (key === 'aiConversationsPerMonth') {
        return { ok: false, error: 'Conversas da IA precisam de um número.' };
      }
      value[key] = null;
      continue;
    }
    const number = Number(raw);
    const minimum = key === 'aiConversationsPerMonth' ? 0 : 1;
    if (!Number.isInteger(number) || number < minimum) {
      return { ok: false, error: `Limite de ${NAMES[key]} inválido.` };
    }
    value[key] = number;
  }
  return { ok: true, value: Object.keys(value).length ? value : null };
}
