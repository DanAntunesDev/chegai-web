import { describe, expect, it } from 'vitest';
import { featureOverrides, limitOverrides } from './overrides';

describe('featureOverrides', () => {
  it('records only differences from the plan', () => {
    expect(
      featureOverrides(['public_booking', 'loyalty'], new Set(['public_booking', 'waitlist'])),
    ).toEqual({ enabled: ['waitlist'], disabled: ['loyalty'] });
  });
});

describe('limitOverrides', () => {
  const empty = { units: '', barbers: '', receptionists: '', aiConversationsPerMonth: '' };

  it('returns null when nothing is overridden', () => {
    expect(limitOverrides(empty)).toEqual({ ok: true, value: null });
  });

  it('reads numbers and unlimited', () => {
    expect(limitOverrides({ ...empty, units: '3', barbers: 'Ilimitado' })).toEqual({
      ok: true,
      value: { units: 3, barbers: null },
    });
  });

  it('rejects bad values', () => {
    expect(limitOverrides({ ...empty, units: '0' }).ok).toBe(false);
    expect(limitOverrides({ ...empty, aiConversationsPerMonth: 'ilimitado' }).ok).toBe(false);
    expect(limitOverrides({ ...empty, barbers: '2.5' }).ok).toBe(false);
  });
});
