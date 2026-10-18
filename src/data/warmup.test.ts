import { describe, expect, it } from 'vitest';
import { warmupFor } from './exercises';

describe('warmupFor', () => {
  it('picks the routine by region and every routine lasts 5 min', () => {
    expect(warmupFor(['upper', 'core']).title).toMatch(/Upper/);
    expect(warmupFor(['lower']).title).toMatch(/Lower/);
    expect(warmupFor(['upper', 'lower']).title).toMatch(/Full/);
    expect(warmupFor([]).title).toMatch(/Full/);
    for (const r of [['upper'], ['lower'], []] as const) {
      expect(warmupFor([...r]).drills.reduce((a, d) => a + d.sec, 0)).toBe(300);
    }
  });
});
