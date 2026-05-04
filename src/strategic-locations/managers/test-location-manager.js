/**
 * Simple test script for LocationManager
 * Run with: node test-location-manager.js
 */

const { LocationManager, LOCATION_TYPES } = require('./location-manager.js');
const fs = require('fs');
const path = require('path');

// Mock fetch for Node.js environment
global.fetch = async (url) => {
  const filePath = path.join(process.cwd(), url);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(data)
    };
  } catch (error) {
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found'
    };
  }
};

async function runTests() {
  console.log('='.repeat(60));
  console.log('LocationManager Test Suite');
  console.log('='.repeat(60));
  console.log();

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

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  // Test 1: Constructor
  console.log('\n1. Constructor Tests');
  console.log('-'.repeat(60));
  
  const locationManager = new LocationManager();
  
  test('Should initialize with empty cache', () => {
    if (locationManager.locations.size !== 0) {
      throw new Error(`Expected cache size 0, got ${locationManager.locations.size}`);
    }
  });

  test('Should have 5 location types', () => {
    const types = locationManager.getLocationTypes();
    if (types.length !== 5) {
      throw new Error(`Expected 5 location types, got ${types.length}`);
    }
  });

  // Test 2: Location Types
  console.log('\n2. Location Types Tests');
  console.log('-'.repeat(60));

  test('Should return all location types', () => {
    const types = locationManager.getLocationTypes();
    const ids = types.map(t => t.id);
    const expected = ['seaport', 'airport', 'highway', 'city_center', 'residential'];
    expected.forEach(id => {
      if (!ids.includes(id)) {
        throw new Error(`Missing location type: ${id}`);
      }
    });
  });

  test('Should return location type by ID', () => {
    const seaport = locationManager.getLocationType('seaport');
    if (!seaport || seaport.id !== 'seaport') {
      throw new Error('Failed to get seaport location type');
    }
    if (seaport.name !== 'Cảng biển') {
      throw new Error(`Expected name "Cảng biển", got "${seaport.name}"`);
    }
  });

  test('Should return null for invalid ID', () => {
    const invalid = locationManager.getLocationType('invalid');
    if (invalid !== null) {
      throw new Error('Expected null for invalid ID');
    }
  });

  // Test 3: Load Location Type
  console.log('\n3. Load Location Type Tests');
  console.log('-'.repeat(60));

  await testAsync('Should load seaport data', async () => {
    const data = await locationManager.loadLocationType('seaport');
    if (!data || data.type !== 'FeatureCollection') {
      throw new Error('Invalid data structure');
    }
    console.log(`  Loaded ${data.features.length} seaport features`);
  });

  await testAsync('Should cache loaded data', async () => {
    if (!locationManager.isLoaded('seaport')) {
      throw new Error('Seaport data not cached');
    }
  });

  await testAsync('Should handle invalid type ID', async () => {
    const data = await locationManager.loadLocationType('invalid_type');
    if (!data || data.type !== 'FeatureCollection' || data.features.length !== 0) {
      throw new Error('Should return empty FeatureCollection for invalid type');
    }
  });

  // Test 4: Load All Locations
  console.log('\n4. Load All Locations Tests');
  console.log('-'.repeat(60));

  await testAsync('Should load all location types', async () => {
    await locationManager.loadAllLocations();
    if (!locationManager.areAllLoaded()) {
      throw new Error('Not all location types loaded');
    }
    console.log(`  Total features: ${locationManager.getTotalCount()}`);
  });

  // Test 5: Get Locations
  console.log('\n5. Get Locations Tests');
  console.log('-'.repeat(60));

  test('Should get locations by type', () => {
    const seaports = locationManager.getLocationsByType('seaport');
    if (!seaports || !seaports.features) {
      throw new Error('Failed to get seaport locations');
    }
    console.log(`  Seaport features: ${seaports.features.length}`);
  });

  test('Should get all locations', () => {
    const all = locationManager.getAllLocations();
    if (!all || !all.features) {
      throw new Error('Failed to get all locations');
    }
    console.log(`  Total features: ${all.features.length}`);
    
    // Verify locationType property is added
    if (all.features.length > 0) {
      const firstFeature = all.features[0];
      if (!firstFeature.properties.locationType) {
        throw new Error('locationType property not added to features');
      }
    }
  });

  // Test 6: Counts
  console.log('\n6. Count Tests');
  console.log('-'.repeat(60));

  test('Should get total count', () => {
    const total = locationManager.getTotalCount();
    if (total === 0) {
      throw new Error('Total count is 0');
    }
    console.log(`  Total count: ${total}`);
  });

  test('Should get count by type', () => {
    const types = locationManager.getLocationTypes();
    types.forEach(type => {
      const count = locationManager.getCountByType(type.id);
      console.log(`  ${type.name}: ${count}`);
    });
  });

  // Test 7: Cache Management
  console.log('\n7. Cache Management Tests');
  console.log('-'.repeat(60));

  test('Should clear cache for specific type', () => {
    locationManager.clearCacheForType('seaport');
    if (locationManager.isLoaded('seaport')) {
      throw new Error('Seaport cache not cleared');
    }
  });

  test('Should clear all cache', () => {
    locationManager.clearCache();
    if (locationManager.locations.size !== 0) {
      throw new Error('Cache not cleared');
    }
  });

  // Test 8: Validation
  console.log('\n8. Validation Tests');
  console.log('-'.repeat(60));

  test('Should validate valid GeoJSON', () => {
    const valid = locationManager._validateGeoJSON({
      type: 'FeatureCollection',
      features: []
    }, 'test');
    if (!valid) {
      throw new Error('Valid GeoJSON marked as invalid');
    }
  });

  test('Should reject null data', () => {
    const valid = locationManager._validateGeoJSON(null, 'test');
    if (valid) {
      throw new Error('Null data marked as valid');
    }
  });

  test('Should reject invalid type', () => {
    const valid = locationManager._validateGeoJSON({
      type: 'Feature',
      features: []
    }, 'test');
    if (valid) {
      throw new Error('Invalid type marked as valid');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log();

  if (failed === 0) {
    console.log('✓ All tests passed!');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
