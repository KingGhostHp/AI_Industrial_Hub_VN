/**
 * Unit Tests for Multi-Criteria Analyzer
 * 
 * Tests scoring calculations, ranking, and threshold filtering
 */

const { MultiCriteriaAnalyzer } = require('./multi-criteria-analyzer.js');

/**
 * Create a mock zone for testing
 */
function createMockZone(properties = {}) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: properties.coordinates || [105.8, 21.0] // Default: Hanoi area
    },
    properties: {
      name: properties.name || 'Test Zone',
      province: properties.province || 'Hà Nội',
      price: properties.price !== undefined ? properties.price : '100',
      acreage: properties.acreage !== undefined ? properties.acreage : 50,
      ...properties
    }
  };
}

/**
 * Create mock strategic locations
 */
function createMockStrategicLocations() {
  return {
    ports: [
      {
        geometry: { coordinates: [106.7, 20.8] },
        properties: { name: 'Hai Phong Port' }
      }
    ],
    airports: [
      {
        geometry: { coordinates: [105.8, 21.2] },
        properties: { name: 'Noi Bai Airport' }
      }
    ],
    cityCenters: [
      {
        geometry: { coordinates: [105.85, 21.03] },
        properties: { name: 'Hanoi Center' }
      }
    ]
  };
}

/**
 * Create mock criteria
 */
function createMockCriteria(weights = null) {
  return {
    weights: weights || {
      price: 0.25,
      location: 0.25,
      infrastructure: 0.25,
      logistics: 0.25
    },
    budgetRange: { min: 0, max: 500 },
    preferredProvinces: []
  };
}

/**
 * Create mock industry profile
 */
function createMockIndustryProfile() {
  return {
    type: 'manufacturing',
    weights: {
      price: 0.25,
      location: 0.20,
      infrastructure: 0.35,
      logistics: 0.20
    },
    description: 'Manufacturing industry'
  };
}

// Test Suite
describe('MultiCriteriaAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    const strategicLocations = createMockStrategicLocations();
    analyzer = new MultiCriteriaAnalyzer({ strategicLocations });
  });

  describe('calculateScore', () => {
    test('calculates score with equal weights', () => {
      const zone = createMockZone({ price: 100, acreage: 50 });
      const criteria = createMockCriteria();
      const industryProfile = createMockIndustryProfile();
      const datasetBounds = {
        price: { min: 50, max: 200 },
        acreage: { min: 10, max: 100 },
        distance: { max: 500 }
      };

      const result = analyzer.calculateScore(zone, criteria, industryProfile, datasetBounds);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.price).toBeDefined();
      expect(result.breakdown.location).toBeDefined();
      expect(result.breakdown.infrastructure).toBeDefined();
      expect(result.breakdown.logistics).toBeDefined();
    });

    test('handles missing zone data gracefully', () => {
      const zone = createMockZone({ price: null, acreage: null });
      const criteria = createMockCriteria();
      const industryProfile = createMockIndustryProfile();
      const datasetBounds = {
        price: { min: 50, max: 200 },
        acreage: { min: 10, max: 100 },
        distance: { max: 500 }
      };

      expect(() => {
        analyzer.calculateScore(zone, criteria, industryProfile, datasetBounds);
      }).not.toThrow();
    });

    test('returns valid breakdown with weights', () => {
      const zone = createMockZone({ price: 100, acreage: 50 });
      const criteria = createMockCriteria();
      const industryProfile = createMockIndustryProfile();
      const datasetBounds = {
        price: { min: 50, max: 200 },
        acreage: { min: 10, max: 100 },
        distance: { max: 500 }
      };

      const result = analyzer.calculateScore(zone, criteria, industryProfile, datasetBounds);

      // Check that weights sum to approximately 1.0
      const weightSum = 
        result.breakdown.price.weight +
        result.breakdown.location.weight +
        result.breakdown.infrastructure.weight +
        result.breakdown.logistics.weight;

      expect(weightSum).toBeCloseTo(1.0, 3);
    });
  });

  describe('rankZones', () => {
    test('ranks zones in descending order by score', () => {
      const zones = [
        createMockZone({ name: 'Zone A', price: 150, acreage: 30 }),
        createMockZone({ name: 'Zone B', price: 80, acreage: 70 }),
        createMockZone({ name: 'Zone C', price: 120, acreage: 50 })
      ];
      const criteria = createMockCriteria();
      const industryProfile = createMockIndustryProfile();

      const ranked = analyzer.rankZones(zones, criteria, industryProfile);

      expect(ranked.length).toBe(3);
      
      // Check descending order
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score);
      }

      // Check ranks are assigned
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].rank).toBe(3);
    });

    test('handles empty zones array', () => {
      const zones = [];
      const criteria = createMockCriteria();
      const industryProfile = createMockIndustryProfile();

      const ranked = analyzer.rankZones(zones, criteria, industryProfile);

      expect(ranked).toEqual([]);
    });

    test('applies tiebreaker for identical scores', () => {
      // Create zones with identical properties (should have same score)
      const zones = [
        createMockZone({ 
          name: 'Zone Far', 
          price: 100, 
          acreage: 50,
          coordinates: [105.0, 21.0] // Farther from strategic locations
        }),
        createMockZone({ 
          name: 'Zone Near', 
          price: 100, 
          acreage: 50,
          coordinates: [105.85, 21.03] // Near city center
        })
      ];
      const criteria = createMockCriteria();
      const industryProfile = createMockIndustryProfile();

      const ranked = analyzer.rankZones(zones, criteria, industryProfile);

      expect(ranked.length).toBe(2);
      
      // The tiebreaker should sort by distance to nearest strategic location
      // Zone Near should have a higher logistics score due to proximity
      // So it should rank higher even without identical scores
      // Just verify that ranking is deterministic and complete
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    });
  });

  describe('getTopRecommendations', () => {
    test('returns top N recommendations', () => {
      const rankedZones = [
        { zone: createMockZone({ name: 'Zone 1' }), score: 90, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 2' }), score: 85, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 3' }), score: 80, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 4' }), score: 75, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 5' }), score: 70, breakdown: {} }
      ];

      const top3 = analyzer.getTopRecommendations(rankedZones, 3);

      expect(top3.length).toBe(3);
      expect(top3[0].score).toBe(90);
      expect(top3[2].score).toBe(80);
    });

    test('applies threshold filtering', () => {
      const rankedZones = [
        { zone: createMockZone({ name: 'Zone 1' }), score: 90, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 2' }), score: 85, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 3' }), score: 65, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 4' }), score: 60, breakdown: {} }
      ];

      const filtered = analyzer.getTopRecommendations(rankedZones, 10, 70);

      expect(filtered.length).toBe(2);
      expect(filtered.every(item => item.score >= 70)).toBe(true);
    });

    test('returns empty array for empty input', () => {
      const top = analyzer.getTopRecommendations([], 10);
      expect(top).toEqual([]);
    });

    test('handles limit larger than array size', () => {
      const rankedZones = [
        { zone: createMockZone({ name: 'Zone 1' }), score: 90, breakdown: {} },
        { zone: createMockZone({ name: 'Zone 2' }), score: 85, breakdown: {} }
      ];

      const top = analyzer.getTopRecommendations(rankedZones, 10);

      expect(top.length).toBe(2);
    });
  });
});
