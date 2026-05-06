/**
 * Unit Tests for Statistical Methods
 * 
 * Tests statistical formulas for predictive analytics
 */

const {
  calculateGrowthPotential,
  forecastRentalPrice,
  calculateConfidenceInterval,
  calculateSaturationIndex,
  calculateDensity,
  classifyDevelopmentTrend,
  calculatePriceCompetitiveness,
  predictDevelopmentTrend,
  calculateMovingAverage,
  calculateSaturationRisk
} = require('./statistical-methods.js');

describe('calculateGrowthPotential', () => {
  test('calculates growth potential with valid inputs', () => {
    const result = calculateGrowthPotential({
      provinceDevLevel: 3,
      saturationIndex: 40,
      proximityScore: 80,
      priceCompetitiveness: 70,
      infrastructureScore: 85
    });
    
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('returns value in [0, 100] range', () => {
    const result = calculateGrowthPotential({
      provinceDevLevel: 1,
      saturationIndex: 100,
      proximityScore: 0,
      priceCompetitiveness: 0,
      infrastructureScore: 0
    });
    
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('handles missing parameters with defaults', () => {
    const result = calculateGrowthPotential({});
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('forecastRentalPrice', () => {
  test('forecasts price with high development', () => {
    const result = forecastRentalPrice(100, 3, 2);
    
    expect(result.forecast).toBeGreaterThan(100);
    expect(result.growthRate).toBe(0.08);
    expect(result.years).toBe(2);
    expect(result.forecast).toBeCloseTo(116.64, 1);
  });

  test('forecasts price with medium development', () => {
    const result = forecastRentalPrice(100, 2, 1);
    
    expect(result.forecast).toBe(105);
    expect(result.growthRate).toBe(0.05);
  });

  test('forecasts price with low development', () => {
    const result = forecastRentalPrice(100, 1, 1);
    
    expect(result.forecast).toBe(103);
    expect(result.growthRate).toBe(0.03);
  });

  test('throws error for negative price', () => {
    expect(() => forecastRentalPrice(-10, 2, 1)).toThrow();
  });

  test('clamps forecast horizon to [1, 2]', () => {
    const result = forecastRentalPrice(100, 2, 5);
    expect(result.years).toBe(2);
  });
});

describe('calculateConfidenceInterval', () => {
  test('calculates confidence interval with default 15%', () => {
    const result = calculateConfidenceInterval(100);
    
    expect(result.lower).toBe(85);
    expect(result.upper).toBe(115);
    expect(result.confidence).toBe(0.15);
  });

  test('calculates confidence interval with custom percentage', () => {
    const result = calculateConfidenceInterval(100, 20);
    
    expect(result.lower).toBe(80);
    expect(result.upper).toBe(120);
    expect(result.confidence).toBe(0.20);
  });

  test('clamps confidence to [10, 20] range', () => {
    const result1 = calculateConfidenceInterval(100, 5);
    expect(result1.confidence).toBe(0.10);
    
    const result2 = calculateConfidenceInterval(100, 30);
    expect(result2.confidence).toBe(0.20);
  });

  test('ensures lower bound is non-negative', () => {
    const result = calculateConfidenceInterval(10, 20);
    expect(result.lower).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateSaturationIndex', () => {
  test('calculates saturation index with valid inputs', () => {
    const result = calculateSaturationIndex({
      zoneCount: 50,
      provinceArea: 1000,
      occupancyRate: 75,
      developmentLevel: 3
    });
    
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('returns value in [0, 100] range', () => {
    const result = calculateSaturationIndex({
      zoneCount: 0,
      provinceArea: 1000,
      occupancyRate: 0,
      developmentLevel: 1
    });
    
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('handles high density correctly', () => {
    const result = calculateSaturationIndex({
      zoneCount: 200,
      provinceArea: 1000,
      occupancyRate: 100,
      developmentLevel: 3
    });
    
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('calculateDensity', () => {
  test('calculates density correctly', () => {
    const result = calculateDensity(50, 1000);
    expect(result).toBe(50);
  });

  test('calculates density for different values', () => {
    const result = calculateDensity(100, 500);
    expect(result).toBe(200);
  });

  test('throws error for negative zone count', () => {
    expect(() => calculateDensity(-10, 1000)).toThrow();
  });

  test('throws error for zero area', () => {
    expect(() => calculateDensity(50, 0)).toThrow();
  });
});

describe('classifyDevelopmentTrend', () => {
  test('classifies high growth correctly', () => {
    expect(classifyDevelopmentTrend(0.18)).toBe('high');
    expect(classifyDevelopmentTrend(0.16)).toBe('high');
  });

  test('classifies moderate growth correctly', () => {
    expect(classifyDevelopmentTrend(0.15)).toBe('moderate');
    expect(classifyDevelopmentTrend(0.10)).toBe('moderate');
    expect(classifyDevelopmentTrend(0.05)).toBe('moderate');
  });

  test('classifies low growth correctly', () => {
    expect(classifyDevelopmentTrend(0.04)).toBe('low');
    expect(classifyDevelopmentTrend(0.01)).toBe('low');
  });

  test('handles boundary values correctly', () => {
    expect(classifyDevelopmentTrend(0.15)).toBe('moderate');
    expect(classifyDevelopmentTrend(0.1501)).toBe('high');
    expect(classifyDevelopmentTrend(0.05)).toBe('moderate');
    expect(classifyDevelopmentTrend(0.0499)).toBe('low');
  });
});

describe('calculatePriceCompetitiveness', () => {
  test('returns 100 for very low price', () => {
    const result = calculatePriceCompetitiveness(50, 100);
    expect(result).toBe(100);
  });

  test('returns 50 for average price', () => {
    const result = calculatePriceCompetitiveness(100, 100);
    expect(result).toBe(50);
  });

  test('returns 0 for very high price', () => {
    const result = calculatePriceCompetitiveness(150, 100);
    expect(result).toBe(0);
  });

  test('handles invalid inputs with default', () => {
    const result = calculatePriceCompetitiveness(-10, 100);
    expect(result).toBe(50);
  });
});

describe('predictDevelopmentTrend', () => {
  test('predicts development trend correctly', () => {
    const result = predictDevelopmentTrend({
      currentZones: 50,
      growthRate: 0.08,
      forecastHorizon: 2
    });
    
    expect(result.predictedZones).toBeGreaterThan(50);
    expect(result.category).toBe('moderate');
    expect(result.growthRate).toBe(0.08);
  });

  test('rounds predicted zones to integer', () => {
    const result = predictDevelopmentTrend({
      currentZones: 50,
      growthRate: 0.05,
      forecastHorizon: 1
    });
    
    expect(Number.isInteger(result.predictedZones)).toBe(true);
  });

  test('classifies trend category correctly', () => {
    const result = predictDevelopmentTrend({
      currentZones: 50,
      growthRate: 0.18,
      forecastHorizon: 1
    });
    
    expect(result.category).toBe('high');
  });
});

describe('calculateMovingAverage', () => {
  test('calculates moving average correctly', () => {
    const result = calculateMovingAverage([10, 20, 30, 40, 50], 3);
    expect(result).toEqual([20, 30, 40]);
  });

  test('handles window size of 1', () => {
    const result = calculateMovingAverage([10, 20, 30], 1);
    expect(result).toEqual([10, 20, 30]);
  });

  test('handles window size equal to array length', () => {
    const result = calculateMovingAverage([10, 20, 30], 3);
    expect(result).toEqual([20]);
  });

  test('throws error for empty array', () => {
    expect(() => calculateMovingAverage([], 3)).toThrow();
  });

  test('throws error for invalid window size', () => {
    expect(() => calculateMovingAverage([10, 20, 30], 5)).toThrow();
  });
});

describe('calculateSaturationRisk', () => {
  test('classifies high risk correctly', () => {
    expect(calculateSaturationRisk(85)).toBe('high');
    expect(calculateSaturationRisk(80)).toBe('high');
  });

  test('classifies medium risk correctly', () => {
    expect(calculateSaturationRisk(70)).toBe('medium');
    expect(calculateSaturationRisk(60)).toBe('medium');
  });

  test('classifies low risk correctly', () => {
    expect(calculateSaturationRisk(50)).toBe('low');
    expect(calculateSaturationRisk(30)).toBe('low');
  });

  test('handles boundary values correctly', () => {
    expect(calculateSaturationRisk(80)).toBe('high');
    expect(calculateSaturationRisk(79)).toBe('medium');
    expect(calculateSaturationRisk(60)).toBe('medium');
    expect(calculateSaturationRisk(59)).toBe('low');
  });
});
