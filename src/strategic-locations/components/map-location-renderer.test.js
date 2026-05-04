/**
 * Unit Tests for MapLocationRenderer
 * 
 * Tests the rendering of strategic locations on Mapbox GL JS map
 */

// Mock Mapbox GL JS
class MockMap {
  constructor() {
    this.sources = new Map();
    this.layers = new Map();
    this.eventHandlers = new Map();
    this.canvas = document.createElement('canvas');
  }

  getSource(id) {
    return this.sources.get(id);
  }

  addSource(id, config) {
    this.sources.set(id, {
      id,
      config,
      setData: (data) => {
        this.sources.get(id).data = data;
      }
    });
  }

  removeSource(id) {
    this.sources.delete(id);
  }

  getLayer(id) {
    return this.layers.get(id);
  }

  addLayer(config) {
    this.layers.set(config.id, config);
  }

  removeLayer(id) {
    this.layers.delete(id);
  }

  setLayoutProperty(layerId, property, value) {
    const layer = this.layers.get(layerId);
    if (layer) {
      if (!layer.layout) layer.layout = {};
      layer.layout[property] = value;
    }
  }

  on(event, layerIdOrHandler, handler) {
    const key = handler ? `${event}-${layerIdOrHandler}` : event;
    const fn = handler || layerIdOrHandler;
    
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, []);
    }
    this.eventHandlers.get(key).push(fn);
  }

  flyTo(options) {
    // Mock implementation
  }

  getCanvas() {
    return this.canvas;
  }
}

class MockMarker {
  constructor(element) {
    this.element = element;
    this.lngLat = null;
    this.popup = null;
    this.addedToMap = false;
  }

  setLngLat(lngLat) {
    this.lngLat = lngLat;
    return this;
  }

  setPopup(popup) {
    this.popup = popup;
    return this;
  }

  addTo(map) {
    this.addedToMap = true;
    return this;
  }

  remove() {
    this.addedToMap = false;
  }

  getElement() {
    return this.element;
  }

  getLngLat() {
    return this.lngLat;
  }
}

class MockPopup {
  constructor(options) {
    this.options = options;
    this.html = null;
    this.lngLat = null;
  }

  setHTML(html) {
    this.html = html;
    return this;
  }

  setLngLat(lngLat) {
    this.lngLat = lngLat;
    return this;
  }

  addTo(map) {
    return this;
  }
}

// Setup global mocks
global.mapboxgl = {
  Marker: MockMarker,
  Popup: MockPopup
};

global.lucide = {
  createIcons: () => {}
};

// Load the MapLocationRenderer
const { MapLocationRenderer } = require('./map-location-renderer.js');

describe('MapLocationRenderer', () => {
  let map;
  let renderer;

  beforeEach(() => {
    map = new MockMap();
    renderer = new MapLocationRenderer(map);
  });

  describe('Constructor', () => {
    test('should initialize with a map instance', () => {
      expect(renderer.map).toBe(map);
      expect(renderer.markers).toBeInstanceOf(Map);
      expect(renderer.layers).toBeInstanceOf(Map);
      expect(renderer.sources).toBeInstanceOf(Map);
    });

    test('should throw error if map is not provided', () => {
      expect(() => new MapLocationRenderer()).toThrow();
    });

    test('should initialize visibility states to true', () => {
      expect(renderer.strategicLocationsVisible).toBe(true);
      expect(renderer.industrialZonesVisible).toBe(true);
    });
  });

  describe('renderStrategicLocations', () => {
    test('should render locations for all types', () => {
      const locationsData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.0, 10.0] },
            properties: { locationType: 'seaport', name: 'Test Port' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [107.0, 11.0] },
            properties: { locationType: 'airport', name: 'Test Airport' }
          }
        ]
      };

      const types = [
        { id: 'seaport', name: 'Cảng biển', icon: 'anchor', color: '#0EA5E9', geometryType: 'Point' },
        { id: 'airport', name: 'Sân bay', icon: 'plane', color: '#8B5CF6', geometryType: 'Point' }
      ];

      renderer.renderStrategicLocations(locationsData, types);

      expect(renderer.markers.has('seaport')).toBe(true);
      expect(renderer.markers.has('airport')).toBe(true);
      expect(renderer.markers.get('seaport').length).toBe(1);
      expect(renderer.markers.get('airport').length).toBe(1);
    });

    test('should handle empty location data', () => {
      const locationsData = { type: 'FeatureCollection', features: [] };
      const types = [];

      expect(() => renderer.renderStrategicLocations(locationsData, types)).not.toThrow();
    });

    test('should handle null location data', () => {
      expect(() => renderer.renderStrategicLocations(null, [])).not.toThrow();
    });
  });

  describe('renderLocationType', () => {
    test('should render Point geometries as markers', () => {
      const locationsData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [106.0, 10.0] },
            properties: { name: 'Test Location' }
          }
        ]
      };

      const type = {
        id: 'seaport',
        name: 'Cảng biển',
        icon: 'anchor',
        color: '#0EA5E9',
        geometryType: 'Point'
      };

      renderer.renderLocationType('seaport', locationsData, type);

      expect(renderer.markers.has('seaport')).toBe(true);
      expect(renderer.markers.get('seaport').length).toBe(1);
    });

    test('should render LineString geometries as layers', () => {
      const locationsData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[106.0, 10.0], [107.0, 11.0]]
            },
            properties: { name: 'Test Highway' }
          }
        ]
      };

      const type = {
        id: 'highway',
        name: 'Cao tốc',
        icon: 'highway',
        color: '#F59E0B',
        geometryType: 'LineString'
      };

      renderer.renderLocationType('highway', locationsData, type);

      expect(map.sources.has('highway-source')).toBe(true);
      expect(map.layers.has('highway-layer')).toBe(true);
    });

    test('should render Polygon geometries as layers', () => {
      const locationsData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[106.0, 10.0], [107.0, 10.0], [107.0, 11.0], [106.0, 11.0], [106.0, 10.0]]]
            },
            properties: { name: 'Test Area' }
          }
        ]
      };

      const type = {
        id: 'residential',
        name: 'Khu dân cư',
        icon: 'home',
        color: '#10B981',
        geometryType: 'Polygon'
      };

      renderer.renderLocationType('residential', locationsData, type);

      expect(map.sources.has('residential-source')).toBe(true);
      expect(map.layers.has('residential-fill')).toBe(true);
      expect(map.layers.has('residential-outline')).toBe(true);
    });

    test('should handle empty features array', () => {
      const locationsData = { type: 'FeatureCollection', features: [] };
      const type = { id: 'seaport', name: 'Cảng biển', geometryType: 'Point' };

      expect(() => renderer.renderLocationType('seaport', locationsData, type)).not.toThrow();
    });
  });

  describe('clearStrategicLocations', () => {
    test('should remove all markers', () => {
      // Add some markers
      const marker1 = new MockMarker(document.createElement('div'));
      const marker2 = new MockMarker(document.createElement('div'));
      marker1.addTo(map);
      marker2.addTo(map);
      
      renderer.markers.set('seaport', [marker1, marker2]);

      renderer.clearStrategicLocations();

      expect(renderer.markers.size).toBe(0);
      expect(marker1.addedToMap).toBe(false);
      expect(marker2.addedToMap).toBe(false);
    });

    test('should remove all layers and sources', () => {
      // Add some layers and sources
      map.addSource('test-source', { type: 'geojson', data: {} });
      map.addLayer({ id: 'test-layer', type: 'line', source: 'test-source' });
      
      renderer.sources.set('test', 'test-source');
      renderer.layers.set('test', ['test-layer']);

      renderer.clearStrategicLocations();

      expect(renderer.sources.size).toBe(0);
      expect(renderer.layers.size).toBe(0);
      expect(map.sources.size).toBe(0);
      expect(map.layers.size).toBe(0);
    });
  });

  describe('toggleStrategicLocations', () => {
    test('should hide markers when visible is false', () => {
      const el = document.createElement('div');
      const marker = new MockMarker(el);
      marker.addTo(map);
      
      renderer.markers.set('seaport', [marker]);

      renderer.toggleStrategicLocations(false);

      expect(el.style.display).toBe('none');
      expect(renderer.strategicLocationsVisible).toBe(false);
    });

    test('should show markers when visible is true', () => {
      const el = document.createElement('div');
      el.style.display = 'none';
      const marker = new MockMarker(el);
      marker.addTo(map);
      
      renderer.markers.set('seaport', [marker]);

      renderer.toggleStrategicLocations(true);

      expect(el.style.display).toBe('block');
      expect(renderer.strategicLocationsVisible).toBe(true);
    });

    test('should toggle layer visibility', () => {
      map.addLayer({ id: 'test-layer', type: 'line' });
      renderer.layers.set('test', ['test-layer']);

      renderer.toggleStrategicLocations(false);

      const layer = map.layers.get('test-layer');
      expect(layer.layout.visibility).toBe('none');

      renderer.toggleStrategicLocations(true);
      expect(layer.layout.visibility).toBe('visible');
    });
  });

  describe('toggleIndustrialZones', () => {
    test('should update visibility state', () => {
      renderer.toggleIndustrialZones(false);
      expect(renderer.industrialZonesVisible).toBe(false);

      renderer.toggleIndustrialZones(true);
      expect(renderer.industrialZonesVisible).toBe(true);
    });

    test('should toggle industrial zone layers if they exist', () => {
      map.addLayer({ id: 'industrial-zones-layer', type: 'fill' });

      renderer.toggleIndustrialZones(false);

      const layer = map.layers.get('industrial-zones-layer');
      expect(layer.layout.visibility).toBe('none');
    });
  });

  describe('Utility methods', () => {
    test('getMarkerCount should return total marker count', () => {
      renderer.markers.set('seaport', [new MockMarker(), new MockMarker()]);
      renderer.markers.set('airport', [new MockMarker()]);

      expect(renderer.getMarkerCount()).toBe(3);
    });

    test('getLayerCount should return total layer count', () => {
      renderer.layers.set('highway', ['highway-layer']);
      renderer.layers.set('residential', ['residential-fill', 'residential-outline']);

      expect(renderer.getLayerCount()).toBe(3);
    });

    test('isStrategicLocationsVisible should return visibility state', () => {
      expect(renderer.isStrategicLocationsVisible()).toBe(true);
      
      renderer.toggleStrategicLocations(false);
      expect(renderer.isStrategicLocationsVisible()).toBe(false);
    });

    test('isIndustrialZonesVisible should return visibility state', () => {
      expect(renderer.isIndustrialZonesVisible()).toBe(true);
      
      renderer.toggleIndustrialZones(false);
      expect(renderer.isIndustrialZonesVisible()).toBe(false);
    });
  });

  describe('highlightLocation', () => {
    test('should zoom to Point location', () => {
      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.0, 10.0] },
        properties: { name: 'Test Location' }
      };

      const type = {
        id: 'seaport',
        name: 'Cảng biển',
        icon: 'anchor',
        color: '#0EA5E9'
      };

      // Mock flyTo to capture the call
      let flyToCalled = false;
      map.flyTo = (options) => {
        flyToCalled = true;
        expect(options.center).toEqual([106.0, 10.0]);
        expect(options.zoom).toBe(14);
      };

      renderer.highlightLocation(feature, type);

      expect(flyToCalled).toBe(true);
    });

    test('should handle LineString geometry', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[106.0, 10.0], [107.0, 11.0]]
        },
        properties: { name: 'Test Highway' }
      };

      const type = { id: 'highway', name: 'Cao tốc', icon: 'highway', color: '#F59E0B' };

      let flyToCalled = false;
      map.flyTo = (options) => {
        flyToCalled = true;
        expect(options.center).toEqual([106.0, 10.0]);
      };

      renderer.highlightLocation(feature, type);

      expect(flyToCalled).toBe(true);
    });

    test('should handle Polygon geometry', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[106.0, 10.0], [107.0, 10.0], [107.0, 11.0], [106.0, 10.0]]]
        },
        properties: { name: 'Test Area' }
      };

      const type = { id: 'residential', name: 'Khu dân cư', icon: 'home', color: '#10B981' };

      let flyToCalled = false;
      map.flyTo = (options) => {
        flyToCalled = true;
        expect(options.center).toEqual([106.0, 10.0]);
      };

      renderer.highlightLocation(feature, type);

      expect(flyToCalled).toBe(true);
    });

    test('should handle invalid feature gracefully', () => {
      expect(() => renderer.highlightLocation(null, {})).not.toThrow();
      expect(() => renderer.highlightLocation({}, {})).not.toThrow();
    });
  });

  describe('_createPopupContent', () => {
    test('should create popup with location name and coordinates', () => {
      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.123456, 10.654321] },
        properties: { name: 'Test Location' }
      };

      const type = {
        id: 'seaport',
        name: 'Cảng biển',
        icon: 'anchor',
        color: '#0EA5E9'
      };

      const html = renderer._createPopupContent(feature, type);

      expect(html).toContain('Test Location');
      expect(html).toContain('Cảng biển');
      expect(html).toContain('10.654321');
      expect(html).toContain('106.123456');
      expect(html).toContain('Copy');
    });

    test('should handle Vietnamese name', () => {
      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.0, 10.0] },
        properties: { 'name:vi': 'Cảng Sài Gòn' }
      };

      const type = { id: 'seaport', name: 'Cảng biển', icon: 'anchor', color: '#0EA5E9' };

      const html = renderer._createPopupContent(feature, type);

      expect(html).toContain('Cảng Sài Gòn');
    });

    test('should handle unnamed location', () => {
      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.0, 10.0] },
        properties: {}
      };

      const type = { id: 'seaport', name: 'Cảng biển', icon: 'anchor', color: '#0EA5E9' };

      const html = renderer._createPopupContent(feature, type);

      expect(html).toContain('Unnamed location');
    });

    test('should include additional properties', () => {
      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.0, 10.0] },
        properties: {
          name: 'Test Location',
          'name:en': 'Test Location EN',
          operator: 'Test Operator',
          website: 'https://example.com'
        }
      };

      const type = { id: 'seaport', name: 'Cảng biển', icon: 'anchor', color: '#0EA5E9' };

      const html = renderer._createPopupContent(feature, type);

      expect(html).toContain('name:en');
      expect(html).toContain('Test Location EN');
      expect(html).toContain('operator');
      expect(html).toContain('Test Operator');
      expect(html).toContain('website');
      expect(html).toContain('https://example.com');
    });
  });
});
