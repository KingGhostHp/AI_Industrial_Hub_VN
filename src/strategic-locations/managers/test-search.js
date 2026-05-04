/**
 * Simple test script for searchLocations() method
 * Run this in Node.js to verify the search functionality
 */

const { LocationManager } = require('./location-manager.js');

// Mock data for testing
function createMockLocationManager() {
  const manager = new LocationManager();
  
  // Add mock seaport data
  manager.locations.set('seaport', {
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

  // Add mock airport data
  manager.locations.set('airport', {
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

  // Add mock city center data
  manager.locations.set('city_center', {
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

  return manager;
}

// Test functions
function testSearchByVietnameseName() {
  console.log('\n=== Test: Search by Vietnamese name ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('Sài Gòn');
  console.log(`Query: "Sài Gòn"`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: > 0`);
  console.log(`Status: ${results.length > 0 ? '✓ PASS' : '✗ FAIL'}`);
  if (results.length > 0) {
    console.log(`First result: ${results[0].displayName} (${results[0].locationType.name})`);
  }
}

function testSearchByEnglishName() {
  console.log('\n=== Test: Search by English name ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('Saigon');
  console.log(`Query: "Saigon"`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: > 0`);
  console.log(`Status: ${results.length > 0 ? '✓ PASS' : '✗ FAIL'}`);
}

function testSearchCaseInsensitive() {
  console.log('\n=== Test: Case insensitive search ===');
  const manager = createMockLocationManager();
  const results1 = manager.searchLocations('sài gòn');
  const results2 = manager.searchLocations('SÀI GÒN');
  console.log(`Query 1: "sài gòn" -> ${results1.length} results`);
  console.log(`Query 2: "SÀI GÒN" -> ${results2.length} results`);
  console.log(`Expected: Same count`);
  console.log(`Status: ${results1.length === results2.length ? '✓ PASS' : '✗ FAIL'}`);
}

function testSearchByLocationType() {
  console.log('\n=== Test: Search by location type ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('Cảng biển');
  console.log(`Query: "Cảng biển"`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: 2 (all seaports)`);
  console.log(`Status: ${results.length === 2 ? '✓ PASS' : '✗ FAIL'}`);
  if (results.length > 0) {
    const allSeaports = results.every(r => r.locationType.id === 'seaport');
    console.log(`All results are seaports: ${allSeaports ? '✓ PASS' : '✗ FAIL'}`);
  }
}

function testSearchPartialMatch() {
  console.log('\n=== Test: Partial name match ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('Cảng');
  console.log(`Query: "Cảng"`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: 2 (both ports)`);
  console.log(`Status: ${results.length === 2 ? '✓ PASS' : '✗ FAIL'}`);
}

function testSearchEmptyQuery() {
  console.log('\n=== Test: Empty query ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('');
  console.log(`Query: ""`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: 0`);
  console.log(`Status: ${results.length === 0 ? '✓ PASS' : '✗ FAIL'}`);
}

function testSearchNullQuery() {
  console.log('\n=== Test: Null query ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations(null);
  console.log(`Query: null`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: 0`);
  console.log(`Status: ${results.length === 0 ? '✓ PASS' : '✗ FAIL'}`);
}

function testSearchWhitespace() {
  console.log('\n=== Test: Whitespace query ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('   ');
  console.log(`Query: "   "`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: 0`);
  console.log(`Status: ${results.length === 0 ? '✓ PASS' : '✗ FAIL'}`);
}

function testSearchNoMatch() {
  console.log('\n=== Test: No match ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('NonExistentLocation12345');
  console.log(`Query: "NonExistentLocation12345"`);
  console.log(`Results: ${results.length}`);
  console.log(`Expected: 0`);
  console.log(`Status: ${results.length === 0 ? '✓ PASS' : '✗ FAIL'}`);
}

function testResultStructure() {
  console.log('\n=== Test: Result structure ===');
  const manager = createMockLocationManager();
  const results = manager.searchLocations('Sài Gòn');
  
  if (results.length === 0) {
    console.log('✗ FAIL: No results to check structure');
    return;
  }

  const result = results[0];
  const hasFeature = result.hasOwnProperty('feature');
  const hasLocationType = result.hasOwnProperty('locationType');
  const hasDisplayName = result.hasOwnProperty('displayName');
  const hasTypeId = result.hasOwnProperty('typeId');

  console.log(`Has feature: ${hasFeature ? '✓' : '✗'}`);
  console.log(`Has locationType: ${hasLocationType ? '✓' : '✗'}`);
  console.log(`Has displayName: ${hasDisplayName ? '✓' : '✗'}`);
  console.log(`Has typeId: ${hasTypeId ? '✓' : '✗'}`);

  const allPresent = hasFeature && hasLocationType && hasDisplayName && hasTypeId;
  console.log(`Status: ${allPresent ? '✓ PASS' : '✗ FAIL'}`);
}

function testGetDisplayName() {
  console.log('\n=== Test: _getDisplayName() priority ===');
  const manager = createMockLocationManager();

  // Test priority: name:vi > name > name:en
  const test1 = manager._getDisplayName({
    'name:vi': 'Vietnamese',
    name: 'Generic',
    'name:en': 'English'
  });
  console.log(`Priority test 1: ${test1 === 'Vietnamese' ? '✓ PASS' : '✗ FAIL'} (got: ${test1})`);

  const test2 = manager._getDisplayName({
    name: 'Generic',
    'name:en': 'English'
  });
  console.log(`Priority test 2: ${test2 === 'Generic' ? '✓ PASS' : '✗ FAIL'} (got: ${test2})`);

  const test3 = manager._getDisplayName({
    'name:en': 'English',
    industrial: 'Industrial'
  });
  console.log(`Priority test 3: ${test3 === 'English' ? '✓ PASS' : '✗ FAIL'} (got: ${test3})`);

  const test4 = manager._getDisplayName({});
  console.log(`Empty properties: ${test4 === 'Unnamed location' ? '✓ PASS' : '✗ FAIL'} (got: ${test4})`);
}

// Run all tests
console.log('========================================');
console.log('LocationManager Search Tests');
console.log('========================================');

testSearchByVietnameseName();
testSearchByEnglishName();
testSearchCaseInsensitive();
testSearchByLocationType();
testSearchPartialMatch();
testSearchEmptyQuery();
testSearchNullQuery();
testSearchWhitespace();
testSearchNoMatch();
testResultStructure();
testGetDisplayName();

console.log('\n========================================');
console.log('All tests completed!');
console.log('========================================\n');
