/**
 * Unit Tests for PredictionEngine
 * 
 * Tests core functionality of the prediction engine including:
 * - Growth potential calculation
 * - Rental price forecasting
 * - Development trend prediction
 * - Saturation index calculation
 * - Caching mechanism
 */

const { PredictionEngine } = require('./prediction-engine.js');

describe('PredictionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new PredictionEngine();
  });

  describe('calculateGrowthPotential', () => {
    test('calculates growth potential with valid data', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          name: 'Test Zone',
          price: 80,
          acreage: 150
        }
      };

      const provinceData = {
        developmentLevel: 3,
        saturationIndex: 40,
        averagePrice: 100
      };

      const score = engine.calculateGrowthPotential(zone, provinceData);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    });

    test('handles missing zone properties gracefully', () => {
      const zone = { properties: {} };
      const provinceData = { developmentLevel: 2 };

      const score = engine.calculateGrowthPotential(zone, provinceData);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('returns neutral score on error', () => {
      const zone = null;
      const provinceData = {};

      const score = engine.calculateGrowthPotential(zone, provinceData);

      expect(score).toBe(50);
    });
  });

  describe('forecastRentalPrice', () => {
    test('forecasts rental price with valid data', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      const provinceData = { developmentLevel: 3 };
      const forecast = engine.forecastRentalPrice(zone, 2, provinceData);

      expect(forecast.forecast).toBeGreaterThan(100); // Should grow
      expect(forecast.lower).toBeLessThan(forecast.forecast);
      expect(forecast.upper).toBeGreaterThan(forecast.forecast);
      expect(forecast.confidence).toBe(0.15);
      expect(forecast.current).toBe(100);
      expect(forecast.years).toBe(2);
    });

    test('calculates different forecasts for different development levels', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      const forecastHigh = engine.forecastRentalPrice(zone, 2, { developmentLevel: 3 });
      const forecastLow = engine.forecastRentalPrice(zone, 2, { developmentLevel: 1 });

      expect(forecastHigh.forecast).toBeGreaterThan(forecastLow.forecast);
    });

    test('uses cache for repeated calls', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      const forecast1 = engine.forecastRentalPrice(zone, 2, { developmentLevel: 3 });
      const forecast2 = engine.forecastRentalPrice(zone, 2, { developmentLevel: 3 });

      expect(forecast1).toEqual(forecast2);
      expect(engine.getCacheStats().size).toBeGreaterThan(0);
    });

    test('handles invalid price gracefully', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          price: 0
        }
      };

      const forecast = engine.forecastRentalPrice(zone, 2, { developmentLevel: 2 });

      expect(forecast.forecast).toBe(0);
      expect(forecast.lower).toBe(0);
    });
  });

  describe('predictDevelopmentTrend', () => {
    test('predicts development trend with valid data', () => {
      const provinceData = {
        currentZones: 50,
        developmentLevel: 3
      };

      const trend = engine.predictDevelopmentTrend('HN', 2, provinceData);

      expect(trend.trend).toBeDefined();
      expect(['high', 'moderate', 'low']).toContain(trend.category);
      expect(trend.metrics.currentZones).toBe(50);
      expect(trend.predictedZones).toBeGreaterThanOrEqual(50);
    });

    test('classifies high growth correctly', () => {
      const provinceData = {
        currentZones: 50,
        developmentLevel: 3,
        historicalGrowthRate: 0.18 // 18% growth
      };

      const trend = engine.predictDevelopmentTrend('HN', 2, provinceData);

      expect(trend.category).toBe('high');
    });

    test('classifies moderate growth correctly', () => {
      const provinceData = {
        currentZones: 50,
        developmentLevel: 2,
        historicalGrowthRate: 0.08 // 8% growth
      };

      const trend = engine.predictDevelopmentTrend('HN', 2, provinceData);

      expect(trend.category).toBe('moderate');
    });

    test('classifies low growth correctly', () => {
      const provinceData = {
        currentZones: 50,
        developmentLevel: 1,
        historicalGrowthRate: 0.03 // 3% growth
      };

      const trend = engine.predictDevelopmentTrend('HN', 2, provinceData);

      expect(trend.category).toBe('low');
    });

    test('uses cache for repeated calls', () => {
      const provinceData = {
        currentZones: 50,
        developmentLevel: 3
      };

      const trend1 = engine.predictDevelopmentTrend('HN', 2, provinceData);
      const trend2 = engine.predictDevelopmentTrend('HN', 2, provinceData);

      expect(trend1).toEqual(trend2);
    });
  });

  describe('calculateSaturationIndex', () => {
    test('calculates saturation index with valid data', () => {
      const provinceData = {
        zoneCount: 50,
        provinceArea: 1000,
        occupancyRate: 75,
        developmentLevel: 3
      };

      const saturation = engine.calculateSaturationIndex('HN', provinceData);

      expect(saturation.index).toBeGreaterThanOrEqual(0);
      expect(saturation.index).toBeLessThanOrEqual(100);
      expect(saturation.density).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(saturation.riskLevel);
    });

    test('identifies high risk correctly', () => {
      const provinceData = {
        zoneCount: 100,
        provinceArea: 500,
        occupancyRate: 90,
        developmentLevel: 3
      };

      const saturation = engine.calculateSaturationIndex('HN', provinceData);

      expect(saturation.riskLevel).toBe('high');
      expect(saturation.index).toBeGreaterThanOrEqual(80);
    });

    test('identifies low risk correctly', () => {
      const provinceData = {
        zoneCount: 10,
        provinceArea: 2000,
        occupancyRate: 30,
        developmentLevel: 1
      };

      const saturation = engine.calculateSaturationIndex('HN', provinceData);

      expect(saturation.riskLevel).toBe('low');
      expect(saturation.index).toBeLessThan(60);
    });

    test('calculates density correctly', () => {
      const provinceData = {
        zoneCount: 50,
        provinceArea: 1000,
        occupancyRate: 50,
        developmentLevel: 2
      };

      const saturation = engine.calculateSaturationIndex('HN', provinceData);

      // Density should be (50 / 1000) * 1000 = 50
      expect(saturation.density).toBe(50);
    });

    test('uses cache for repeated calls', () => {
      const provinceData = {
        zoneCount: 50,
        provinceArea: 1000,
        occupancyRate: 75,
        developmentLevel: 3
      };

      const saturation1 = engine.calculateSaturationIndex('HN', provinceData);
      const saturation2 = engine.calculateSaturationIndex('HN', provinceData);

      expect(saturation1).toEqual(saturation2);
    });
  });

  describe('Cache Management', () => {
    test('clearCache removes all cached entries', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      engine.forecastRentalPrice(zone, 2, { developmentLevel: 3 });
      expect(engine.getCacheStats().size).toBeGreaterThan(0);

      engine.clearCache();
      expect(engine.getCacheStats().size).toBe(0);
    });

    test('cache can be disabled', () => {
      const engineNoCache = new PredictionEngine({ enableCache: false });
      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      engineNoCache.forecastRentalPrice(zone, 2, { developmentLevel: 3 });
      expect(engineNoCache.getCacheStats().size).toBe(0);
    });

    test('getCacheStats returns correct information', () => {
      const stats = engine.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('ttl');
      expect(stats).toHaveProperty('enabled');
      expect(stats.ttl).toBe(86400000); // 24 hours
      expect(stats.enabled).toBe(true);
    });

    test('clearExpiredCache removes only expired entries', () => {
      // Create engine with short TTL for testing
      const shortTTLEngine = new PredictionEngine({ cacheTTL: 100 }); // 100ms

      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      shortTTLEngine.forecastRentalPrice(zone, 2, { developmentLevel: 3 });
      expect(shortTTLEngine.getCacheStats().size).toBe(1);

      // Wait for cache to expire
      return new Promise(resolve => {
        setTimeout(() => {
          shortTTLEngine.clearExpiredCache();
          expect(shortTTLEngine.getCacheStats().size).toBe(0);
          resolve();
        }, 150);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles null zone gracefully', () => {
      const score = engine.calculateGrowthPotential(null, {});
      expect(score).toBe(50);
    });

    test('handles missing province data gracefully', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      const forecast = engine.forecastRentalPrice(zone, 2);
      expect(forecast).toBeDefined();
      expect(forecast.forecast).toBeGreaterThanOrEqual(0);
    });

    test('handles invalid forecast horizon', () => {
      const zone = {
        properties: {
          code: 'TEST001',
          price: 100
        }
      };

      const forecast = engine.forecastRentalPrice(zone, 5, { developmentLevel: 2 });
      expect(forecast).toBeDefined();
    });
  });
});
