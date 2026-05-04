/**
 * Tests for GeoJSON Validator
 * 
 * Run with: node geojson-validator.test.js
 */

const validator = require('./geojson-validator.js');
const fs = require('fs');
const path = require('path');

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

function testValidGeoJSON() {
  console.log('\n=== Testing Valid GeoJSON ===');
  
  const validData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [107.0461648, 10.7735963]
        },
        properties: {
          name: 'Test Airport',
          'name:en': 'Test Airport',
          aeroway: 'aerodrome'
        }
      }
    ]
  };

  const result = validator.validateGeoJSON(validData);
  assert(result.valid === true, 'Valid GeoJSON should pass validation');
  assert(result.errors.length === 0, 'Valid GeoJSON should have no errors');
  assert(result.validFeatureCount === 1, 'Should count 1 valid feature');
}

function testInvalidGeoJSON() {
  console.log('\n=== Testing Invalid GeoJSON ===');
  
  // Test null data
  let result = validator.validateGeoJSON(null);
  assert(result.valid === false, 'Null data should fail validation');
  assert(result.errors.length > 0, 'Null data should have errors');

  // Test wrong type
  result = validator.validateGeoJSON({ type: 'Feature' });
  assert(result.valid === false, 'Wrong type should fail validation');

  // Test missing features
  result = validator.validateGeoJSON({ type: 'FeatureCollection' });
  assert(result.valid === false, 'Missing features array should fail validation');

  // Test empty features
  result = validator.validateGeoJSON({ type: 'FeatureCollection', features: [] });
  assert(result.valid === true, 'Empty features should pass but warn');
  assert(result.warnings.length > 0, 'Empty features should have warnings');
}

function testInvalidFeature() {
  console.log('\n=== Testing Invalid Features ===');
  
  const data = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [200, 100] // Invalid coordinates
        },
        properties: {}
      }
    ]
  };

  const result = validator.validateGeoJSON(data);
  assert(result.valid === false, 'Invalid coordinates should fail validation');
  assert(result.errors.length > 0, 'Invalid coordinates should have errors');
}

function testGeometryTypes() {
  console.log('\n=== Testing Different Geometry Types ===');
  
  // Test Point
  let data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100, 50] },
      properties: { name: 'Test Point' }
    }]
  };
  let result = validator.validateGeoJSON(data);
  assert(result.valid === true, 'Valid Point geometry should pass');

  // Test LineString
  data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { 
        type: 'LineString', 
        coordinates: [[100, 50], [101, 51]] 
      },
      properties: { name: 'Test Line' }
    }]
  };
  result = validator.validateGeoJSON(data);
  assert(result.valid === true, 'Valid LineString geometry should pass');

  // Test Polygon
  data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { 
        type: 'Polygon', 
        coordinates: [[[100, 50], [101, 50], [101, 51], [100, 51], [100, 50]]]
      },
      properties: { name: 'Test Polygon' }
    }]
  };
  result = validator.validateGeoJSON(data);
  assert(result.valid === true, 'Valid Polygon geometry should pass');
}

function testLocationTypeValidation() {
  console.log('\n=== Testing Location Type Validation ===');
  
  // Test airport with Point (correct)
  let data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100, 50] },
      properties: { name: 'Airport' }
    }]
  };
  let result = validator.validateGeoJSON(data, 'airport');
  assert(result.valid === true, 'Airport with Point geometry should pass');
  assert(result.warnings.length === 0, 'Airport with Point should have no warnings');

  // Test highway with LineString (correct)
  data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[100, 50], [101, 51]] },
      properties: { name: 'Highway' }
    }]
  };
  result = validator.validateGeoJSON(data, 'highway');
  assert(result.valid === true, 'Highway with LineString geometry should pass');

  // Test highway with Point (incorrect but should warn, not error)
  data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100, 50] },
      properties: { name: 'Highway' }
    }]
  };
  result = validator.validateGeoJSON(data, 'highway');
  assert(result.valid === true, 'Highway with wrong geometry should still be valid');
  assert(result.warnings.length > 0, 'Highway with wrong geometry should have warnings');
}

function testFilterValidFeatures() {
  console.log('\n=== Testing Filter Valid Features ===');
  
  const data = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [100, 50] },
        properties: { name: 'Valid' }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [200, 100] }, // Invalid
        properties: { name: 'Invalid' }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [101, 51] },
        properties: { name: 'Valid 2' }
      }
    ]
  };

  const filtered = validator.filterValidFeatures(data);
  assert(filtered.type === 'FeatureCollection', 'Filtered result should be FeatureCollection');
  assert(filtered.features.length === 2, 'Should filter out 1 invalid feature');
}

function testRealDataFile() {
  console.log('\n=== Testing Real Data File ===');
  
  try {
    const dataPath = path.join(__dirname, '../../../data/export.geojson');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      const result = validator.validateGeoJSON(data, 'airport');
      
      console.log(`  File: export.geojson`);
      console.log(`  Features: ${data.features.length}`);
      console.log(`  Valid: ${result.valid}`);
      console.log(`  Valid Features: ${result.validFeatureCount}`);
      console.log(`  Errors: ${result.errors.length}`);
      console.log(`  Warnings: ${result.warnings.length}`);
      
      assert(result.valid === true || result.validFeatureCount > 0, 'Real data should have some valid features');
    } else {
      console.log('  Skipping real data test - file not found');
    }
  } catch (error) {
    console.error('  Error testing real data:', error.message);
  }
}

// Run all tests
console.log('Running GeoJSON Validator Tests...\n');

testValidGeoJSON();
testInvalidGeoJSON();
testInvalidFeature();
testGeometryTypes();
testLocationTypeValidation();
testFilterValidFeatures();
testRealDataFile();

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed!');
  process.exit(1);
}
