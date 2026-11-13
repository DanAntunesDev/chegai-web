import { describe, expect, it } from 'vitest';
import { TtlCache } from './domain-cache';

describe('TtlCache', () => {
  it('forgets entries after the ttl', () => {
    let now = 0;
    const cache = new TtlCache<string>(1000, 10, () => now);
    cache.set('a', 'x');
    expect(cache.get('a')).toBe('x');
    now = 1000;
    expect(cache.get('a')).toBeUndefined();
  });

  it('evicts the oldest entry when full', () => {
    const cache = new TtlCache<number>(1000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });
});
