/**
 * Unit tests for LocationManager
 * 
 * Tests the core functionality of loading, caching, and retrieving strategic location data.
 */

const { LocationManager, LOCATION_TYPES } = require('./location-manager.js');

describe('LocationManager', () => {
  let locationManager;

  beforeEach(() => {
    locationManager = new LocationManager();
  });

  describe('Constructor', () => {
    test('should initialize with empty cache', () => {
      expect(locationManager.locations.size).toBe(0);
      expect(locationManager.locationTypes).toEqual(LOCATION_TYPES);
    });

    test('should have 5 location types configured', () => {
      expect(locationManager.getLocationTypes()).toHaveLength(5);
    });
  });

  describe('getLocationTypes()', () => {
    test('should return all location types', () => {
      const types = locationManager.getLocationTypes();
      expect(types).toHaveLength(5);
      expect(types[0]).toHaveProperty('id');
      expect(types[0]).toHaveProperty('name');
      expect(types[0]).toHaveProperty('icon');
      expect(types[0]).toHaveProperty('color');
      expect(types[0]).toHaveProperty('dataFile');
      expect(types[0]).toHaveProperty('geometryType');
    });

    test('should return a copy of location types', () => {
      const types1 = locationManager.getLocationTypes();
      const types2 = locationManager.getLocationTypes();
      expect(types1).not.toBe(types2); // Different array instances
      expect(types1).toEqual(types2); // Same content
    });

    test('should include all expected location type IDs', () => {
      const types = locationManager.getLocationTypes();
      const ids = types.map(t => t.id);
      expect(ids).toContain('seaport');
      expect(ids).toContain('airport');
      expect(ids).toContain('highway');
      expect(ids).toContain('city_center');
      expect(ids).toContain('residential');
    });
  });

  describe('getLocationType()', () => {
    test('should return location type by ID', () => {
      const seaport = locationManager.getLocationType('seaport');
      expect(seaport).toBeDefined();
      expect(seaport.id).toBe('seaport');
      expect(seaport.name).toBe('Cảng biển');
      expect(seaport.icon).toBe('anchor');
      expect(seaport.color).toBe('#0EA5E9');
    });

    test('should return null for invalid ID', () => {
      const invalid = locationManager.getLocationType('invalid_type');
      expect(invalid).toBeNull();
    });
  });

  describe('getLocationsByType()', () => {
    test('should return empty FeatureCollection for unloaded type', () => {
      const result = locationManager.getLocationsByType('seaport');
      expect(result).toEqual({
        type: 'FeatureCollection',
        features: []
      });
    });

    test('should warn when accessing unloaded type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      locationManager.getLocationsByType('seaport');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('not loaded yet')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getAllLocations()', () => {
    test('should return empty FeatureCollection when no data loaded', () => {
      const result = locationManager.getAllLocations();
      expect(result).toEqual({
        type: 'FeatureCollection',
        features: []
      });
    });

    test('should combine features from multiple types', () => {
      // Mock some data
      locationManager.locations.set('seaport', {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { name: 'Port 1' } }
        ]
      });
      locationManager.locations.set('airport', {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: { name: 'Airport 1' } }
        ]
      });

      const result = locationManager.getAllLocations();
      expect(result.features).toHaveLength(2);
      expect(result.features[0].properties.locationType).toBe('seaport');
      expect(result.features[1].properties.locationType).toBe('airport');
    });
  });

  describe('isLoaded()', () => {
    test('should return false for unloaded type', () => {
      expect(locationManager.isLoaded('seaport')).toBe(false);
    });

    test('should return true for loaded type', () => {
      locationManager.locations.set('seaport', {
        type: 'FeatureCollection',
        features: []
      });
      expect(locationManager.isLoaded('seaport')).toBe(true);
    });
  });

  describe('areAllLoaded()', () => {
    test('should return false when no data loaded', () => {
      expect(locationManager.areAllLoaded()).toBe(false);
    });

    test('should return false when some data loaded', () => {
      locationManager.locations.set('seaport', {
        type: 'FeatureCollection',
        features: []
      });
      expect(locationManager.areAllLoaded()).toBe(false);
    });

    test('should return true when all types loaded', () => {
      LOCATION_TYPES.forEach(type => {
        locationManager.locations.set(type.id, {
          type: 'FeatureCollection',
          features: []
        });
      });
      expect(locationManager.areAllLoaded()).toBe(true);
    });
  });

  describe('getTotalCount()', () => {
    test('should return 0 when no data loaded', () => {
      expect(locationManager.getTotalCount()).toBe(0);
    });

    test('should return total count across all types', () => {
      locationManager.locations.set('seaport', {
        type: 'FeatureCollection',
        features: [1, 2, 3] // Mock features
      });
      locationManager.locations.set('airport', {
        type: 'FeatureCollection',
        features: [1, 2] // Mock features
      });
      expect(locationManager.getTotalCount()).toBe(5);
    });
  });

  describe('getCountByType()', () => {
    test('should return 0 for unloaded type', () => {
      expect(locationManager.getCountByType('seaport')).toBe(0);
    });

    test('should return correct count for loaded type', () => {
      locationManager.locations.set('seaport', {
        type: 'FeatureCollection',
        features: [1, 2, 3] // Mock features
      });
      expect(locationManager.getCountByType('seaport')).toBe(3);
    });
  });

  describe('clearCache()', () => {
    test('should clear all cached data', () => {
      locationManager.locations.set('seaport', { type: 'FeatureCollection', features: [] });
      locationManager.locations.set('airport', { type: 'FeatureCollection', features: [] });
      
      locationManager.clearCache();
      
      expect(locationManager.locations.size).toBe(0);
      expect(locationManager.loadingPromises.size).toBe(0);
    });
  });

  describe('clearCacheForType()', () => {
    test('should clear cache for specific type', () => {
      locationManager.locations.set('seaport', { type: 'FeatureCollection', features: [] });
      locationManager.locations.set('airport', { type: 'FeatureCollection', features: [] });
      
      locationManager.clearCacheForType('seaport');
      
      expect(locationManager.isLoaded('seaport')).toBe(false);
      expect(locationManager.isLoaded('airport')).toBe(true);
    });
  });

  describe('_validateGeoJSON()', () => {
    test('should return false for null data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(locationManager._validateGeoJSON(null, 'test')).toBe(false);
      consoleSpy.mockRestore();
    });

    test('should return false for non-object data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(locationManager._validateGeoJSON('string', 'test')).toBe(false);
      consoleSpy.mockRestore();
    });

    test('should return false for invalid type', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(locationManager._validateGeoJSON({ type: 'Feature' }, 'test')).toBe(false);
      consoleSpy.mockRestore();
    });

    test('should return false for missing features array', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(locationManager._validateGeoJSON({ type: 'FeatureCollection' }, 'test')).toBe(false);
      consoleSpy.mockRestore();
    });

    test('should return true for valid FeatureCollection', () => {
      const data = {
        type: 'FeatureCollection',
        features: []
      };
      expect(locationManager._validateGeoJSON(data, 'test')).toBe(true);
    });

    test('should warn for empty features array', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const data = {
        type: 'FeatureCollection',
        features: []
      };
      locationManager._validateGeoJSON(data, 'test');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('has no features')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('searchLocations()', () => {
    beforeEach(() => {
      // Mock some location data for search tests
      locationManager.locations.set('seaport', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.7, 10.8] },
            properties: {
              name: 'Cảng Sài Gòn',
              'name:en': 'Saigon Port',
              'name:vi': 'Cảng Sài Gòn'
            }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [107.1, 10.4] },
            properties: {
              name: 'Cảng Cái Mép',
              'name:en': 'Cai Mep Port'
            }
          }
        ]
      });

      locationManager.locations.set('airport', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.65, 10.82] },
            properties: {
              name: 'Sân bay Tân Sơn Nhất',
              'name:en': 'Tan Son Nhat Airport',
              'name:vi': 'Sân bay Tân Sơn Nhất'
            }
          }
        ]
      });

      locationManager.locations.set('city_center', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.7, 10.77] },
            properties: {
              name: 'Trung tâm Quận 1',
              landuse: 'commercial'
            }
          }
        ]
      });
    });

    test('should return empty array for null query', () => {
      const results = locationManager.searchLocations(null);
      expect(results).toEqual([]);
    });

    test('should return empty array for undefined query', () => {
      const results = locationManager.searchLocations(undefined);
      expect(results).toEqual([]);
    });

    test('should return empty array for empty string', () => {
      const results = locationManager.searchLocations('');
      expect(results).toEqual([]);
    });

    test('should return empty array for whitespace-only string', () => {
      const results = locationManager.searchLocations('   ');
      expect(results).toEqual([]);
    });

    test('should search by Vietnamese name', () => {
      const results = locationManager.searchLocations('Sài Gòn');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].displayName).toContain('Sài Gòn');
      expect(results[0].locationType.id).toBe('seaport');
    });

    test('should search by English name', () => {
      const results = locationManager.searchLocations('Saigon');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].displayName).toContain('Sài Gòn');
    });

    test('should be case-insensitive', () => {
      const results1 = locationManager.searchLocations('sài gòn');
      const results2 = locationManager.searchLocations('SÀI GÒN');
      const results3 = locationManager.searchLocations('Sài Gòn');
      
      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });

    test('should search by partial name', () => {
      const results = locationManager.searchLocations('Cảng');
      expect(results.length).toBe(2); // Should find both ports
      expect(results.every(r => r.locationType.id === 'seaport')).toBe(true);
    });

    test('should search by location type name', () => {
      const results = locationManager.searchLocations('Cảng biển');
      expect(results.length).toBe(2); // Should find all seaports
      expect(results.every(r => r.locationType.id === 'seaport')).toBe(true);
    });

    test('should search by location type name in lowercase', () => {
      const results = locationManager.searchLocations('sân bay');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.locationType.id === 'airport')).toBe(true);
    });

    test('should return results with correct structure', () => {
      const results = locationManager.searchLocations('Sài Gòn');
      expect(results.length).toBeGreaterThan(0);
      
      const result = results[0];
      expect(result).toHaveProperty('feature');
      expect(result).toHaveProperty('locationType');
      expect(result).toHaveProperty('displayName');
      expect(result).toHaveProperty('typeId');
      
      expect(result.feature).toHaveProperty('type', 'Feature');
      expect(result.feature).toHaveProperty('geometry');
      expect(result.feature).toHaveProperty('properties');
      
      expect(result.locationType).toHaveProperty('id');
      expect(result.locationType).toHaveProperty('name');
      expect(result.locationType).toHaveProperty('icon');
      expect(result.locationType).toHaveProperty('color');
    });

    test('should search across multiple location types', () => {
      const results = locationManager.searchLocations('Tân Sơn');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].locationType.id).toBe('airport');
    });

    test('should search by landuse property', () => {
      const results = locationManager.searchLocations('commercial');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].displayName).toContain('Quận 1');
    });

    test('should handle locations with no name gracefully', () => {
      locationManager.locations.set('residential', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
            properties: {}
          }
        ]
      });

      const results = locationManager.searchLocations('Khu dân cư');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].displayName).toBe('Unnamed location');
    });

    test('should not return results for non-matching query', () => {
      const results = locationManager.searchLocations('NonExistentLocation12345');
      expect(results).toEqual([]);
    });

    test('should trim whitespace from query', () => {
      const results1 = locationManager.searchLocations('  Sài Gòn  ');
      const results2 = locationManager.searchLocations('Sài Gòn');
      expect(results1.length).toBe(results2.length);
    });
  });

  describe('_getDisplayName()', () => {
    test('should prioritize name:vi', () => {
      const properties = {
        'name:vi': 'Vietnamese Name',
        name: 'Generic Name',
        'name:en': 'English Name'
      };
      expect(locationManager._getDisplayName(properties)).toBe('Vietnamese Name');
    });

    test('should fall back to name if name:vi not available', () => {
      const properties = {
        name: 'Generic Name',
        'name:en': 'English Name'
      };
      expect(locationManager._getDisplayName(properties)).toBe('Generic Name');
    });

    test('should fall back to name:en if name:vi and name not available', () => {
      const properties = {
        'name:en': 'English Name',
        industrial: 'Industrial Area'
      };
      expect(locationManager._getDisplayName(properties)).toBe('English Name');
    });

    test('should fall back to industrial if no name fields', () => {
      const properties = {
        industrial: 'Industrial Area',
        landuse: 'commercial'
      };
      expect(locationManager._getDisplayName(properties)).toBe('Industrial Area');
    });

    test('should fall back to landuse if no name or industrial', () => {
      const properties = {
        landuse: 'commercial',
        amenity: 'parking'
      };
      expect(locationManager._getDisplayName(properties)).toBe('commercial');
    });

    test('should fall back to amenity if no other fields', () => {
      const properties = {
        amenity: 'parking'
      };
      expect(locationManager._getDisplayName(properties)).toBe('parking');
    });

    test('should return "Unnamed location" if no properties', () => {
      const properties = {};
      expect(locationManager._getDisplayName(properties)).toBe('Unnamed location');
    });
  });

  describe('LOCATION_TYPES configuration', () => {
    test('should have correct seaport configuration', () => {
      const seaport = LOCATION_TYPES.find(t => t.id === 'seaport');
      expect(seaport).toEqual({
        id: 'seaport',
        name: 'Cảng biển',
        icon: 'anchor',
        color: '#0EA5E9',
        dataFile: 'data/cangbienexport.geojson',
        geometryType: 'Point'
      });
    });

    test('should have correct airport configuration', () => {
      const airport = LOCATION_TYPES.find(t => t.id === 'airport');
      expect(airport).toEqual({
        id: 'airport',
        name: 'Sân bay',
        icon: 'plane',
        color: '#8B5CF6',
        dataFile: 'data/export.geojson',
        geometryType: 'Point'
      });
    });

    test('should have correct highway configuration', () => {
      const highway = LOCATION_TYPES.find(t => t.id === 'highway');
      expect(highway).toEqual({
        id: 'highway',
        name: 'Cao tốc',
        icon: 'highway',
        color: '#F59E0B',
        dataFile: 'data/caotocexport.geojson',
        geometryType: 'LineString'
      });
    });

    test('should have correct city_center configuration', () => {
      const cityCenter = LOCATION_TYPES.find(t => t.id === 'city_center');
      expect(cityCenter).toEqual({
        id: 'city_center',
        name: 'Trung tâm TP',
        icon: 'building-2',
        color: '#EF4444',
        dataFile: 'data/trungtamthanhphoexport.geojson',
        geometryType: 'Point'
      });
    });

    test('should have correct residential configuration', () => {
      const residential = LOCATION_TYPES.find(t => t.id === 'residential');
      expect(residential).toEqual({
        id: 'residential',
        name: 'Khu dân cư',
        icon: 'home',
        color: '#10B981',
        dataFile: 'data/khudancu.geojson',
        geometryType: 'Polygon'
      });
    });
  });
});
