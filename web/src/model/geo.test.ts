import { describe, expect, it } from 'vitest';
import { bearingDeg, circle, compass8, formatKm, haversineKm } from './geo';

describe('geo', () => {
  it('measures great-circle distance in km', () => {
    expect(haversineKm([40.4406, -79.9959], [43.6532, -79.3832])).toBeCloseTo(361, -1);
    expect(haversineKm([10, 10], [10, 10])).toBe(0);
  });

  it('names the compass direction of a bearing', () => {
    expect(compass8(bearingDeg([40.44, -80], [43.65, -79.38]))).toBe('N');
    expect(compass8(bearingDeg([40, -80], [40, -70]))).toBe('E');
    expect(compass8(bearingDeg([40, -80], [30, -90]))).toBe('SW');
    expect(compass8(359)).toBe('N');
    expect(compass8(22.4)).toBe('N');
    expect(compass8(22.6)).toBe('NE');
  });

  it('formats kilometres with a thousands separator', () => {
    expect(formatKm(1030.4)).toBe('1,030 km');
    expect(formatKm(305.2)).toBe('305 km');
  });

  it('draws a circle of true radius that closes on itself', () => {
    const c: [number, number] = [40, -80];
    const pts = circle(c, 150, 36);
    expect(pts).toHaveLength(37);
    expect(pts[0]).toEqual(pts[36]);
    for (const p of pts) expect(haversineKm(c, p)).toBeCloseTo(150, 0);
  });
});
