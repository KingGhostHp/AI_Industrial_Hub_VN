/**
 * Unit Tests for Scoring Formulas
 * 
 * Tests individual scoring functions and weighted score calculation
 */

const {
  normalizeWeights,
  calculatePriceScore,
  calculateLocationScore,
  calculateInfrastructureScore,
  calculateAcreageScore,
  calculateProximityScore,
  calculateLogisticsScore,
  calculateWeightedScore,
  safeDivide,
  clamp
} = require('./scoring-formulas.js');

describe('normalizeWeights', () => {
  test('normalizes weights that sum to 2.0', () => {
    const weights = { price: 0.5, location: 0.5, infrastructure: 0.5, logistics: 0.5 };
    const normalized = normalizeWeights(weights);
    
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    
    // Check proportions are preserved
    expect(normalized.price).toBe(0.25);
    expect(normalized.location).toBe(0.25);
    expect(normalized.infrastructure).toBe(0.25);
    expect(normalized.logistics).toBe(0.25);
  });

  test('normalizes weights that already sum to 1.0', () => {
    const weights = { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 };
    const normalized = normalizeWeights(weights);
    
    expect(normalized.price).toBeCloseTo(0.25, 5);
    expect(normalized.location).toBeCloseTo(0.25, 5);
    expect(normalized.infrastructure).toBeCloseTo(0.25, 5);
    expect(normalized.logistics).toBeCloseTo(0.25, 5);
  });

  test('handles zero sum by returning equal weights', () => {
    const weights = { price: 0, location: 0, infrastructure: 0, logistics: 0 };
    const normalized = normalizeWeights(weights);
    
    expect(normalized.price).toBe(0.25);
    expect(normalized.location).toBe(0.25);
    expect(normalized.infrastructure).toBe(0.25);
    expect(normalized.logistics).toBe(0.25);
  });

  test('preserves relative proportions', () => {
    const weights = { price: 0.4, location: 0.2, infrastructure: 0.3, logistics: 0.1 };
    const normalized = normalizeWeights(weights);
    
    // Check that price > infrastructure > location > logistics
    expect(normalized.price).toBeGreaterThan(normalized.infrastructure);
    expect(normalized.infrastructure).toBeGreaterThan(normalized.location);
    expect(normalized.location).toBeGreaterThan(normalized.logistics);
  });

  test('throws error for invalid input', () => {
    expect(() => normalizeWeights(null)).toThrow();
    expect(() => normalizeWeights({ price: -1, location: 0.5, infrastructure: 0.5, logistics: 0.5 })).toThrow();
  });
});

describe('calculatePriceScore', () => {
  test('returns 100 for minimum price', () => {
    const score = calculatePriceScore(50, 50, 200);
    expect(score).toBe(100);
  });

  test('returns 0 for maximum price', () => {
    const score = calculatePriceScore(200, 50, 200);
    expect(score).toBe(0);
  });

  test('returns 50 for middle price', () => {
    const score = calculatePriceScore(125, 50, 200);
    expect(score).toBe(50);
  });

  test('handles equal min and max prices', () => {
    const score = calculatePriceScore(100, 100, 100);
    expect(score).toBe(50);
  });

  test('clamps score to [0, 100] range', () => {
    const score1 = calculatePriceScore(-10, 50, 200);
    expect(score1).toBeGreaterThanOrEqual(0);
    
    const score2 = calculatePriceScore(300, 50, 200);
    expect(score2).toBeLessThanOrEqual(100);
  });
});

describe('calculateLocationScore', () => {
  test('returns correct score for low development', () => {
    const score = calculateLocationScore(1);
    expect(score).toBeCloseTo(33.33, 1);
  });

  test('returns correct score for medium development', () => {
    const score = calculateLocationScore(2);
    expect(score).toBeCloseTo(66.67, 1);
  });

  test('returns correct score for high development', () => {
    const score = calculateLocationScore(3);
    expect(score).toBe(100);
  });

  test('handles invalid input with default', () => {
    const score = calculateLocationScore(5);
    expect(score).toBe(50);
  });
});

describe('calculateInfrastructureScore', () => {
  test('calculates weighted combination correctly', () => {
    const score = calculateInfrastructureScore(80, 60);
    expect(score).toBe(72); // 80 * 0.6 + 60 * 0.4 = 48 + 24 = 72
  });

  test('handles invalid inputs with defaults', () => {
    const score = calculateInfrastructureScore(-10, 150);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('calculateAcreageScore', () => {
  test('returns 100 for maximum acreage', () => {
    const score = calculateAcreageScore(500, 10, 500);
    expect(score).toBe(100);
  });

  test('returns 0 for minimum acreage', () => {
    const score = calculateAcreageScore(10, 10, 500);
    expect(score).toBe(0);
  });

  test('returns 50 for middle acreage', () => {
    const score = calculateAcreageScore(255, 10, 500);
    expect(score).toBe(50);
  });
});

describe('calculateLogisticsScore', () => {
  test('returns 100 for zero distance', () => {
    const score = calculateLogisticsScore(0, 500);
    expect(score).toBe(100);
  });

  test('returns 0 for maximum distance', () => {
    const score = calculateLogisticsScore(500, 500);
    expect(score).toBe(0);
  });

  test('returns 50 for middle distance', () => {
    const score = calculateLogisticsScore(250, 500);
    expect(score).toBe(50);
  });
});

describe('calculateWeightedScore', () => {
  test('calculates weighted score with equal weights', () => {
    const scores = { price: 80, location: 60, infrastructure: 70, logistics: 90 };
    const weights = { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 };
    const result = calculateWeightedScore(scores, weights);
    
    expect(result).toBe(75); // (80 + 60 + 70 + 90) / 4 = 75
  });

  test('calculates weighted score with custom weights', () => {
    const scores = { price: 100, location: 0, infrastructure: 0, logistics: 0 };
    const weights = { price: 1.0, location: 0, infrastructure: 0, logistics: 0 };
    const result = calculateWeightedScore(scores, weights);
    
    expect(result).toBe(100);
  });

  test('normalizes weights automatically', () => {
    const scores = { price: 80, location: 60, infrastructure: 70, logistics: 90 };
    const weights = { price: 0.5, location: 0.5, infrastructure: 0.5, logistics: 0.5 };
    const result = calculateWeightedScore(scores, weights);
    
    expect(result).toBe(75); // Same as equal weights after normalization
  });

  test('clamps result to [0, 100] range', () => {
    const scores = { price: 100, location: 100, infrastructure: 100, logistics: 100 };
    const weights = { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 };
    const result = calculateWeightedScore(scores, weights);
    
    expect(result).toBe(100);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('safeDivide', () => {
  test('performs normal division', () => {
    expect(safeDivide(10, 2)).toBe(5);
  });

  test('returns default for division by zero', () => {
    expect(safeDivide(10, 0)).toBe(0);
    expect(safeDivide(10, 0, 99)).toBe(99);
  });

  test('handles invalid inputs', () => {
    expect(safeDivide('10', 2)).toBe(0);
    expect(safeDivide(10, null)).toBe(0);
  });
});

describe('clamp', () => {
  test('clamps value to range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test('handles invalid input', () => {
    expect(clamp('invalid', 0, 10)).toBe(0);
  });
});
