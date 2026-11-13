import { describe, expect, it, vi } from 'vitest';
import { singleFlight } from './single-flight';

describe('singleFlight', () => {
  it('shares one run between concurrent callers', async () => {
    let resolve: (value: number) => void = () => undefined;
    const task = vi.fn(() => new Promise<number>((done) => (resolve = done)));
    const run = singleFlight(task);

    const first = run();
    const second = run();
    resolve(7);

    await expect(Promise.all([first, second])).resolves.toEqual([7, 7]);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('starts again after the previous run settles', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(2);
    const run = singleFlight(task as () => Promise<number>);

    await expect(run()).rejects.toThrow('boom');
    await expect(run()).resolves.toBe(2);
    expect(task).toHaveBeenCalledTimes(2);
  });
});
