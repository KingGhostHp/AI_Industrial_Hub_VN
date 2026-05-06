/**
 * Services Integration Test
 * 
 * Tests that all services (Multi-Criteria Analyzer, Logistics Calculator, 
 * Prediction Engine, LLM API Service, Data Manager) can work together.
 */

const { MultiCriteriaAnalyzer } = require('./multi-criteria-analyzer.js');
const LogisticsCalculator = require('./logistics-calculator.js').default;
const { PredictionEngine } = require('./prediction-engine.js');

describe('Services Integration', () => {
  let analyzer;
  let logisticsCalculator;
  let predictionEngine;
  let strategicLocations;
  let sampleZones;

  beforeEach(() => {
    // Setup strategic locations in GeoJSON FeatureCollection format
    strategicLocations = {
      ports: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.0, 10.0] },
            properties: { name: 'Port A' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [107.0, 11.0] },
            properties: { name: 'Port B' }
          }
        ]
      },
      airports: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.5, 10.5] },
            properties: { name: 'Airport A' }
          }
        ]
      },
      cityCenters: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.2, 10.2] },
            properties: { name: 'City Center A' }
          }
        ]
      }
    };

    // Setup sample zones
    sampleZones = [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.1, 10.1] },
        properties: {
          code: 'ZONE001',
          name: 'Industrial Zone A',
          province: 'Hà Nội',
          price: 100,
          acreage: 200
        }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [107.5, 11.5] },
        properties: {
          code: 'ZONE002',
          name: 'Industrial Zone B',
          province: 'Đà Nẵng',
          price: 80,
          acreage: 150
        }
      }
    ];

    // Initialize services
    analyzer = new MultiCriteriaAnalyzer({
      strategicLocations: {
        ports: strategicLocations.ports.features,
        airports: strategicLocations.airports.features,
        cityCenters: strategicLocations.cityCenters.features
      },
      distanceCalculator: (coord1, coord2) => {
        // Simple Haversine distance calculator
        const [lng1, lat1] = coord1;
        const [lng2, lat2] = coord2;
        const R = 6371;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }
    });

    logisticsCalculator = new LogisticsCalculator(strategicLocations);
    predictionEngine = new PredictionEngine({ enableCache: false });
  });

  test('Multi-Criteria Analyzer and Logistics Calculator integration', () => {
    // User criteria
    const criteria = {
      weights: {
        price: 0.3,
        location: 0.2,
        infrastructure: 0.2,
        logistics: 0.3
      }
    };

    // Industry profile
    const industryProfile = {
      weights: {
        price: 0.3,
        location: 0.2,
        infrastructure: 0.2,
        logistics: 0.3
      }
    };

    // Calculate scores using Multi-Criteria Analyzer
    const rankedZones = analyzer.rankZones(sampleZones, criteria, industryProfile);

    expect(rankedZones).toHaveLength(2);
    expect(rankedZones[0].score).toBeGreaterThanOrEqual(0);
    expect(rankedZones[0].score).toBeLessThanOrEqual(100);

    // Calculate logistics score for the top zone
    const topZone = rankedZones[0].zone;
    const logisticsScore = logisticsCalculator.calculateLogisticsScore(topZone);

    expect(logisticsScore).toBeGreaterThanOrEqual(0);
    expect(logisticsScore).toBeLessThanOrEqual(100);

    // Find nearest locations
    const nearestPorts = logisticsCalculator.findNearestLocations(topZone, 'port', 2);
    expect(nearestPorts.length).toBeGreaterThan(0);
    expect(nearestPorts[0]).toHaveProperty('distance');
    expect(nearestPorts[0]).toHaveProperty('cost');
  });

  test('Prediction Engine integration with zone data', () => {
    const zone = sampleZones[0];
    const provinceData = {
      developmentLevel: 3,
      saturationIndex: 40,
      averagePrice: 100,
      currentZones: 50,
      zoneCount: 50,
      provinceArea: 1000,
      occupancyRate: 75
    };

    // Calculate growth potential
    const growthScore = predictionEngine.calculateGrowthPotential(zone, provinceData);
    expect(growthScore).toBeGreaterThanOrEqual(0);
    expect(growthScore).toBeLessThanOrEqual(100);

    // Forecast rental price
    const forecast = predictionEngine.forecastRentalPrice(zone, 2, provinceData);
    expect(forecast).toHaveProperty('forecast');
    expect(forecast).toHaveProperty('lower');
    expect(forecast).toHaveProperty('upper');
    expect(forecast.forecast).toBeGreaterThan(0);

    // Predict development trend
    const trend = predictionEngine.predictDevelopmentTrend('HN', 2, provinceData);
    expect(trend).toHaveProperty('trend');
    expect(trend).toHaveProperty('category');
    expect(['high', 'moderate', 'low']).toContain(trend.category);

    // Calculate saturation index
    const saturation = predictionEngine.calculateSaturationIndex('HN', provinceData);
    expect(saturation).toHaveProperty('index');
    expect(saturation).toHaveProperty('riskLevel');
    expect(['high', 'medium', 'low']).toContain(saturation.riskLevel);
  });

  test('Complete workflow: Analyze, Calculate Logistics, Predict Growth', () => {
    // Step 1: Rank zones using Multi-Criteria Analyzer
    const criteria = {
      weights: { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 }
    };
    const industryProfile = {
      weights: { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 }
    };

    const rankedZones = analyzer.rankZones(sampleZones, criteria, industryProfile);
    expect(rankedZones.length).toBeGreaterThan(0);

    const topZone = rankedZones[0].zone;

    // Step 2: Calculate logistics details
    const nearestPort = logisticsCalculator.findNearestLocations(topZone, 'port', 1)[0];
    const nearestAirport = logisticsCalculator.findNearestLocations(topZone, 'airport', 1)[0];
    const logisticsScore = logisticsCalculator.calculateLogisticsScore(topZone);

    expect(nearestPort).toBeDefined();
    expect(nearestAirport).toBeDefined();
    expect(logisticsScore).toBeGreaterThanOrEqual(0);

    // Step 3: Predict growth potential
    const provinceData = {
      developmentLevel: 3,
      saturationIndex: 40,
      averagePrice: 100
    };
    const growthScore = predictionEngine.calculateGrowthPotential(topZone, provinceData);
    expect(growthScore).toBeGreaterThanOrEqual(0);
    expect(growthScore).toBeLessThanOrEqual(100);

    // Step 4: Forecast rental price
    const forecast = predictionEngine.forecastRentalPrice(topZone, 1, provinceData);
    expect(forecast.forecast).toBeGreaterThan(topZone.properties.price);

    // Verify complete recommendation data
    const recommendation = {
      zone: topZone,
      score: rankedZones[0].score,
      breakdown: rankedZones[0].breakdown,
      logistics: {
        nearestPort: nearestPort,
        nearestAirport: nearestAirport,
        score: logisticsScore
      },
      prediction: {
        growthScore: growthScore,
        priceForecasts: forecast
      }
    };

    expect(recommendation.zone).toBeDefined();
    expect(recommendation.score).toBeGreaterThanOrEqual(0);
    expect(recommendation.breakdown).toBeDefined();
    expect(recommendation.logistics).toBeDefined();
    expect(recommendation.prediction).toBeDefined();

    console.log('\n✓ Complete workflow test passed');
    console.log('  Zone:', recommendation.zone.properties.name);
    console.log('  Score:', recommendation.score.toFixed(2));
    console.log('  Logistics Score:', recommendation.logistics.score.toFixed(2));
    console.log('  Growth Score:', recommendation.prediction.growthScore.toFixed(2));
    console.log('  Price Forecast (1 year):', recommendation.prediction.priceForecasts.forecast.toFixed(2));
  });

  test('Services handle edge cases gracefully', () => {
    // Test with zone missing some properties
    const incompleteZone = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [106.0, 10.0] },
      properties: {
        name: 'Incomplete Zone'
        // Missing: price, acreage, province
      }
    };

    const criteria = {
      weights: { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 }
    };
    const industryProfile = {
      weights: { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 }
    };

    // Should not throw errors
    const result = analyzer.calculateScore(incompleteZone, criteria, industryProfile, {
      price: { min: 0, max: 1000 },
      acreage: { min: 0, max: 1000 },
      distance: { max: 500 }
    });

    expect(result).toHaveProperty('score');
    expect(result.score).toBeGreaterThanOrEqual(0);

    // Logistics calculator should handle it
    const logisticsScore = logisticsCalculator.calculateLogisticsScore(incompleteZone);
    expect(logisticsScore).toBeGreaterThanOrEqual(0);

    // Prediction engine should handle it
    const growthScore = predictionEngine.calculateGrowthPotential(incompleteZone, {
      developmentLevel: 2,
      saturationIndex: 50,
      averagePrice: 100
    });
    expect(growthScore).toBeGreaterThanOrEqual(0);
  });

  test('LLM API Service cache configuration', () => {
    // Test that LLM API Service can be configured
    const LLMAPIService = require('./llm-api-service.js').default;

    const llmService = new LLMAPIService({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      maxCallsPerHour: 100,
      cacheTTL: 86400,
      enableFallback: true
    });

    expect(llmService.provider).toBe('openai');
    expect(llmService.model).toBe('gpt-4');
    expect(llmService.temperature).toBe(0.7);
    expect(llmService.maxTokens).toBe(500);
    expect(llmService.maxCallsPerHour).toBe(100);
    expect(llmService.cacheTTL).toBe(86400);
    expect(llmService.enableFallback).toBe(true);

    // Test cost tracking
    const costTracking = llmService.getCostTracking();
    expect(costTracking).toHaveProperty('totalCalls');
    expect(costTracking).toHaveProperty('cachedHits');
    expect(costTracking).toHaveProperty('apiCalls');
    expect(costTracking).toHaveProperty('estimatedCost');
  });
});
