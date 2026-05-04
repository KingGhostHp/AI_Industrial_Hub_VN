/**
 * Simple test runner for MapLocationRenderer
 * Can be run in Node.js environment
 */

// Mock Mapbox GL JS for testing
class MockMap {
  constructor() {
    this.sources = new Map();
    this.layers = new Map();
    this.eventHandlers = new Map();
    this.canvas = { style: { cursor: '' } };
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

// Mock DOM
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tag) => ({
      className: '',
      innerHTML: '',
      style: {},
      querySelectorAll: () => []
    }),
    querySelectorAll: () => []
  };
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

// Test data
const testData = {
  points: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.7, 10.8] },
        properties: {
          locationType: 'seaport',
          name: 'Test Seaport',
          'name:vi': 'Cảng thử nghiệm'
        }
      }
    ]
  },
  lines: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[106.6, 10.7], [106.7, 10.75]]
        },
        properties: {
          locationType: 'highway',
          name: 'Test Highway'
        }
      }
    ]
  },
  polygons: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[106.7, 10.8], [106.8, 10.8], [106.8, 10.9], [106.7, 10.9], [106.7, 10.8]]]
        },
        properties: {
          locationType: 'residential',
          name: 'Test Area'
        }
      }
    ]
  }
};

const locationTypes = [
  { id: 'seaport', name: 'Cảng biển', icon: 'anchor', color: '#0EA5E9', geometryType: 'Point' },
  { id: 'highway', name: 'Cao tốc', icon: 'highway', color: '#F59E0B', geometryType: 'LineString' },
  { id: 'residential', name: 'Khu dân cư', icon: 'home', color: '#10B981', geometryType: 'Polygon' }
];

// Test runner
function runTests() {
  console.log('='.repeat(60));
  console.log('MapLocationRenderer Test Suite');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  // Test 1: Constructor
  test('Constructor should initialize with map instance', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    if (renderer.map !== map) throw new Error('Map not set');
    if (!(renderer.markers instanceof Map)) throw new Error('Markers not initialized');
    if (!(renderer.layers instanceof Map)) throw new Error('Layers not initialized');
  });

  // Test 2: Constructor error handling
  test('Constructor should throw error without map', () => {
    try {
      new MapLocationRenderer();
      throw new Error('Should have thrown error');
    } catch (error) {
      if (!error.message.includes('valid Mapbox map')) {
        throw new Error('Wrong error message');
      }
    }
  });

  // Test 3: Render Point geometries
  test('Should render Point geometries as markers', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    const types = [locationTypes[0]]; // seaport
    
    renderer.renderStrategicLocations(testData.points, types);
    
    if (!renderer.markers.has('seaport')) throw new Error('Seaport markers not created');
    if (renderer.markers.get('seaport').length !== 1) throw new Error('Wrong marker count');
  });

  // Test 4: Render LineString geometries
  test('Should render LineString geometries as layers', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    const types = [locationTypes[1]]; // highway
    
    renderer.renderStrategicLocations(testData.lines, types);
    
    if (!map.sources.has('highway-source')) throw new Error('Highway source not created');
    if (!map.layers.has('highway-layer')) throw new Error('Highway layer not created');
  });

  // Test 5: Render Polygon geometries
  test('Should render Polygon geometries as layers', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    const types = [locationTypes[2]]; // residential
    
    renderer.renderStrategicLocations(testData.polygons, types);
    
    if (!map.sources.has('residential-source')) throw new Error('Residential source not created');
    if (!map.layers.has('residential-fill')) throw new Error('Residential fill layer not created');
    if (!map.layers.has('residential-outline')) throw new Error('Residential outline layer not created');
  });

  // Test 6: Clear locations
  test('Should clear all locations', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    renderer.renderStrategicLocations(testData.points, [locationTypes[0]]);
    renderer.clearStrategicLocations();
    
    if (renderer.markers.size !== 0) throw new Error('Markers not cleared');
    if (renderer.layers.size !== 0) throw new Error('Layers not cleared');
    if (renderer.sources.size !== 0) throw new Error('Sources not cleared');
  });

  // Test 7: Toggle visibility
  test('Should toggle strategic locations visibility', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    renderer.renderStrategicLocations(testData.points, [locationTypes[0]]);
    
    if (!renderer.isStrategicLocationsVisible()) throw new Error('Should be visible initially');
    
    renderer.toggleStrategicLocations(false);
    if (renderer.isStrategicLocationsVisible()) throw new Error('Should be hidden');
    
    renderer.toggleStrategicLocations(true);
    if (!renderer.isStrategicLocationsVisible()) throw new Error('Should be visible again');
  });

  // Test 8: Get marker count
  test('Should return correct marker count', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    if (renderer.getMarkerCount() !== 0) throw new Error('Initial count should be 0');
    
    renderer.renderStrategicLocations(testData.points, [locationTypes[0]]);
    
    if (renderer.getMarkerCount() !== 1) throw new Error('Count should be 1 after rendering');
  });

  // Test 9: Get layer count
  test('Should return correct layer count', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    if (renderer.getLayerCount() !== 0) throw new Error('Initial count should be 0');
    
    renderer.renderStrategicLocations(testData.polygons, [locationTypes[2]]);
    
    if (renderer.getLayerCount() !== 2) throw new Error('Count should be 2 (fill + outline)');
  });

  // Test 10: Handle empty data
  test('Should handle empty location data gracefully', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    const emptyData = { type: 'FeatureCollection', features: [] };
    renderer.renderStrategicLocations(emptyData, locationTypes);
    
    if (renderer.getMarkerCount() !== 0) throw new Error('Should have no markers');
  });

  // Test 11: Handle null data
  test('Should handle null location data gracefully', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    renderer.renderStrategicLocations(null, locationTypes);
    
    if (renderer.getMarkerCount() !== 0) throw new Error('Should have no markers');
  });

  // Test 12: Highlight location
  test('Should highlight location without errors', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    const feature = testData.points.features[0];
    const type = locationTypes[0];
    
    renderer.highlightLocation(feature, type);
    // Should not throw error
  });

  // Test 13: Create popup content
  test('Should create popup content with location info', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    const feature = testData.points.features[0];
    const type = locationTypes[0];
    
    const html = renderer._createPopupContent(feature, type);
    
    if (!html.includes('Cảng thử nghiệm')) throw new Error('Vietnamese name not in popup');
    if (!html.includes('Cảng biển')) throw new Error('Type name not in popup');
    if (!html.includes('10.800000')) throw new Error('Coordinates not in popup');
  });

  // Test 14: Render all geometry types
  test('Should render all geometry types together', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    const allData = {
      type: 'FeatureCollection',
      features: [
        ...testData.points.features,
        ...testData.lines.features,
        ...testData.polygons.features
      ]
    };
    
    renderer.renderStrategicLocations(allData, locationTypes);
    
    if (renderer.getMarkerCount() !== 1) throw new Error('Wrong marker count');
    if (renderer.getLayerCount() !== 3) throw new Error('Wrong layer count (1 line + 2 polygon)');
  });

  // Test 15: Toggle industrial zones
  test('Should toggle industrial zones visibility', () => {
    const map = new MockMap();
    const renderer = new MapLocationRenderer(map);
    
    if (!renderer.isIndustrialZonesVisible()) throw new Error('Should be visible initially');
    
    renderer.toggleIndustrialZones(false);
    if (renderer.isIndustrialZonesVisible()) throw new Error('Should be hidden');
    
    renderer.toggleIndustrialZones(true);
    if (!renderer.isIndustrialZonesVisible()) throw new Error('Should be visible again');
  });

  // Summary
  console.log('='.repeat(60));
  console.log(`Tests completed: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
