/**
 * Unit tests for LogisticsCalculator
 * 
 * Tests the logistics cost calculation, nearest location finding,
 * and logistics score calculation functionality.
 */

import LogisticsCalculator from './logistics-calculator.js';

describe('LogisticsCalculator', () => {
  let calculator;
  let mockStrategicLocations;

  beforeEach(() => {
    // Create mock strategic locations data
    mockStrategicLocations = {
      ports: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Port A' },
            geometry: { type: 'Point', coordinates: [106.0, 10.0] }
          },
          {
            type: 'Feature',
            properties: { name: 'Port B' },
            geometry: { type: 'Point', coordinates: [107.0, 11.0] }
          },
          {
            type: 'Feature',
            properties: { name: 'Port C' },
            geometry: { type: 'Point', coordinates: [108.0, 12.0] }
          }
        ]
      },
      airports: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Airport A' },
            geometry: { type: 'Point', coordinates: [106.5, 10.5] }
          },
          {
            type: 'Feature',
            properties: { name: 'Airport B' },
            geometry: { type: 'Point', coordinates: [107.5, 11.5] }
          }
        ]
      },
      cityCenters: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'City Center A' },
            geometry: { type: 'Point', coordinates: [106.2, 10.2] }
          }
        ]
      }
    };

    calculator = new LogisticsCalculator(mockStrategicLocations);
  });

  describe('calculateCost', () => {
    test('calculates cost with valid coordinates', () => {
      const zone = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.0, 10.0] }
      };
      const location = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [107.0, 11.0] }
      };

      const result = calculator.calculateCost(zone, location);

      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('cost');
      expect(result).toHaveProperty('time');
      expect(result.distance).toBeGreaterThan(0);
      expect(result.cost).toBe(result.distance * 15000);
      expect(result.cost).toBeGreaterThan(0);
    });

    test('calculates cost with coordinate arrays', () => {
      const zoneCoords = [106.0, 10.0];
      const locationCoords = [107.0, 11.0];

      const result = calculator.calculateCost(zoneCoords, locationCoords);

      expect(result.distance).toBeGreaterThan(0);
      expect(result.cost).toBe(result.distance * 15000);
    });

    test('throws error for invalid zone coordinates', () => {
      const invalidZone = [200, 100]; // Invalid longitude/latitude
      const validLocation = [106.0, 10.0];

      expect(() => {
        calculator.calculateCost(invalidZone, validLocation);
      }).toThrow();
    });

    test('throws error for invalid location coordinates', () => {
      const validZone = [106.0, 10.0];
      const invalidLocation = [200, 100]; // Invalid longitude/latitude

      expect(() => {
        calculator.calculateCost(validZone, invalidLocation);
      }).toThrow();
    });

    test('uses truck transport mode by default', () => {
      const zone = [106.0, 10.0];
      const location = [107.0, 11.0];

      const result = calculator.calculateCost(zone, location);

      expect(result.cost).toBe(result.distance * 15000);
    });

    test('handles different transport modes', () => {
      const zone = [106.0, 10.0];
      const location = [107.0, 11.0];

      const truckResult = calculator.calculateCost(zone, location, 'truck');
      const railResult = calculator.calculateCost(zone, location, 'rail');
      const seaResult = calculator.calculateCost(zone, location, 'sea');

      // Currently all modes use the same rate
      expect(truckResult.cost).toBe(railResult.cost);
      expect(truckResult.cost).toBe(seaResult.cost);
    });
  });

  describe('findNearestLocations', () => {
    test('finds nearest ports sorted by distance', () => {
      const zone = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.0, 10.0] }
      };

      const results = calculator.findNearestLocations(zone, 'port', 3);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('feature');
      expect(results[0]).toHaveProperty('distance');
      expect(results[0]).toHaveProperty('cost');
      expect(results[0]).toHaveProperty('name');
      
      // Verify sorted by distance (ascending)
      expect(results[0].distance).toBeLessThanOrEqual(results[1].distance);
      expect(results[1].distance).toBeLessThanOrEqual(results[2].distance);
    });

    test('finds nearest airports', () => {
      const zone = [106.5, 10.5];

      const results = calculator.findNearestLocations(zone, 'airport', 2);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Airport A');
    });

    test('finds nearest city center', () => {
      const zone = [106.2, 10.2];

      const results = calculator.findNearestLocations(zone, 'city_center', 1);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('City Center A');
    });

    test('respects limit parameter', () => {
      const zone = [106.0, 10.0];

      const results = calculator.findNearestLocations(zone, 'port', 2);

      expect(results).toHaveLength(2);
    });

    test('returns empty array for unknown location type', () => {
      const zone = [106.0, 10.0];

      const results = calculator.findNearestLocations(zone, 'unknown_type', 3);

      expect(results).toHaveLength(0);
    });

    test('returns empty array when no locations available', () => {
      const emptyCalculator = new LogisticsCalculator({
        ports: { type: 'FeatureCollection', features: [] },
        airports: { type: 'FeatureCollection', features: [] },
        cityCenters: { type: 'FeatureCollection', features: [] }
      });

      const zone = [106.0, 10.0];
      const results = emptyCalculator.findNearestLocations(zone, 'port', 3);

      expect(results).toHaveLength(0);
    });

    test('throws error for invalid zone coordinates', () => {
      const invalidZone = [200, 100];

      expect(() => {
        calculator.findNearestLocations(invalidZone, 'port', 3);
      }).toThrow();
    });

    test('skips locations with invalid coordinates', () => {
      const calculatorWithInvalidData = new LogisticsCalculator({
        ports: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Valid Port' },
              geometry: { type: 'Point', coordinates: [106.0, 10.0] }
            },
            {
              type: 'Feature',
              properties: { name: 'Invalid Port' },
              geometry: { type: 'Point', coordinates: [200, 100] }
            }
          ]
        },
        airports: { type: 'FeatureCollection', features: [] },
        cityCenters: { type: 'FeatureCollection', features: [] }
      });

      const zone = [106.0, 10.0];
      const results = calculatorWithInvalidData.findNearestLocations(zone, 'port', 3);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Valid Port');
    });
  });

  describe('calculateLogisticsScore', () => {
    test('calculates score based on average distance', () => {
      const zone = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.0, 10.0] }
      };

      const score = calculator.calculateLogisticsScore(zone);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('returns higher score for zones closer to strategic locations', () => {
      // Zone very close to Port A
      const closeZone = [106.01, 10.01];
      const closeScore = calculator.calculateLogisticsScore(closeZone);

      // Zone far from all locations
      const farZone = [120.0, 20.0];
      const farScore = calculator.calculateLogisticsScore(farZone);

      expect(closeScore).toBeGreaterThan(farScore);
    });

    test('returns 0 when no strategic locations available', () => {
      const emptyCalculator = new LogisticsCalculator({
        ports: { type: 'FeatureCollection', features: [] },
        airports: { type: 'FeatureCollection', features: [] },
        cityCenters: { type: 'FeatureCollection', features: [] }
      });

      const zone = [106.0, 10.0];
      const score = emptyCalculator.calculateLogisticsScore(zone);

      expect(score).toBe(0);
    });

    test('throws error for invalid zone coordinates', () => {
      const invalidZone = [200, 100];

      expect(() => {
        calculator.calculateLogisticsScore(invalidZone);
      }).toThrow();
    });

    test('handles zones with coordinate arrays', () => {
      const zone = [106.0, 10.0];

      const score = calculator.calculateLogisticsScore(zone);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('edge cases', () => {
    test('handles zone at same location as strategic location', () => {
      const zone = [106.0, 10.0]; // Same as Port A

      const results = calculator.findNearestLocations(zone, 'port', 1);

      expect(results).toHaveLength(1);
      expect(results[0].distance).toBe(0);
      expect(results[0].cost).toBe(0);
    });

    test('handles very large distances', () => {
      const zone = [106.0, 10.0];
      const farLocation = [140.0, 40.0]; // Very far location

      const result = calculator.calculateCost(zone, farLocation);

      expect(result.distance).toBeGreaterThan(1000);
      expect(result.cost).toBeGreaterThan(15000000);
    });
  });
});
