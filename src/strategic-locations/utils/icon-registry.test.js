/**
 * Tests for Icon Registry
 * 
 * Run with: node icon-registry.test.js
 */

const iconRegistry = require('./icon-registry.js');

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

function testGetIconByType() {
  console.log('\n=== Testing getIconByType ===');
  
  // Test all registered types
  assert(iconRegistry.getIconByType('seaport') === 'anchor', 'Should return anchor for seaport');
  assert(iconRegistry.getIconByType('airport') === 'plane', 'Should return plane for airport');
  assert(iconRegistry.getIconByType('highway') === 'highway', 'Should return highway for highway');
  assert(iconRegistry.getIconByType('city_center') === 'building-2', 'Should return building-2 for city_center');
  assert(iconRegistry.getIconByType('residential') === 'home', 'Should return home for residential');
  
  // Test unknown types (should return default)
  assert(iconRegistry.getIconByType('unknown') === 'map-pin', 'Should return map-pin for unknown type');
  assert(iconRegistry.getIconByType(null) === 'map-pin', 'Should return map-pin for null');
  assert(iconRegistry.getIconByType(undefined) === 'map-pin', 'Should return map-pin for undefined');
  assert(iconRegistry.getIconByType('') === 'map-pin', 'Should return map-pin for empty string');
}

function testGetAllIconMappings() {
  console.log('\n=== Testing getAllIconMappings ===');
  
  const mappings = iconRegistry.getAllIconMappings();
  
  assert(typeof mappings === 'object', 'Should return an object');
  assert(mappings.seaport === 'anchor', 'Should have seaport mapping');
  assert(mappings.airport === 'plane', 'Should have airport mapping');
  assert(mappings.highway === 'highway', 'Should have highway mapping');
  assert(mappings.city_center === 'building-2', 'Should have city_center mapping');
  assert(mappings.residential === 'home', 'Should have residential mapping');
  assert(Object.keys(mappings).length === 5, 'Should have 5 mappings');
  
  // Test that it returns a copy
  mappings.seaport = 'modified';
  assert(iconRegistry.getIconByType('seaport') === 'anchor', 'Should return a copy, not the original');
}

function testHasIcon() {
  console.log('\n=== Testing hasIcon ===');
  
  // Test registered types
  assert(iconRegistry.hasIcon('seaport') === true, 'Should return true for seaport');
  assert(iconRegistry.hasIcon('airport') === true, 'Should return true for airport');
  assert(iconRegistry.hasIcon('highway') === true, 'Should return true for highway');
  assert(iconRegistry.hasIcon('city_center') === true, 'Should return true for city_center');
  assert(iconRegistry.hasIcon('residential') === true, 'Should return true for residential');
  
  // Test unregistered types
  assert(iconRegistry.hasIcon('unknown') === false, 'Should return false for unknown type');
  assert(iconRegistry.hasIcon('railway') === false, 'Should return false for railway');
  assert(iconRegistry.hasIcon('port') === false, 'Should return false for port');
  assert(iconRegistry.hasIcon(null) === false, 'Should return false for null');
  assert(iconRegistry.hasIcon(undefined) === false, 'Should return false for undefined');
  assert(iconRegistry.hasIcon('') === false, 'Should return false for empty string');
}

function testGetRegisteredTypes() {
  console.log('\n=== Testing getRegisteredTypes ===');
  
  const types = iconRegistry.getRegisteredTypes();
  
  assert(Array.isArray(types), 'Should return an array');
  assert(types.length === 5, 'Should return 5 types');
  assert(types.includes('seaport'), 'Should include seaport');
  assert(types.includes('airport'), 'Should include airport');
  assert(types.includes('highway'), 'Should include highway');
  assert(types.includes('city_center'), 'Should include city_center');
  assert(types.includes('residential'), 'Should include residential');
}

function testIconMappingExport() {
  console.log('\n=== Testing ICON_MAPPING Export ===');
  
  const mapping = iconRegistry.ICON_MAPPING;
  
  assert(typeof mapping === 'object', 'ICON_MAPPING should be an object');
  assert(mapping.seaport === 'anchor', 'ICON_MAPPING should have seaport');
  assert(mapping.airport === 'plane', 'ICON_MAPPING should have airport');
  assert(mapping.highway === 'highway', 'ICON_MAPPING should have highway');
  assert(mapping.city_center === 'building-2', 'ICON_MAPPING should have city_center');
  assert(mapping.residential === 'home', 'ICON_MAPPING should have residential');
}

function testIconNameValidation() {
  console.log('\n=== Testing Icon Name Validation ===');
  
  // These are the expected Lucide icon names from the design doc
  const validLucideIcons = [
    'anchor',
    'plane',
    'highway',
    'building-2',
    'home',
    'map-pin' // default icon
  ];
  
  const mappings = iconRegistry.getAllIconMappings();
  const allIcons = Object.values(mappings);
  
  let allValid = true;
  allIcons.forEach(icon => {
    if (!validLucideIcons.includes(icon)) {
      allValid = false;
      console.error(`  Invalid icon name: ${icon}`);
    }
  });
  
  assert(allValid, 'All icon names should be valid Lucide icons');
}

function testRequirementsValidation() {
  console.log('\n=== Testing Requirements Validation ===');
  
  // Requirements 2.1-2.6 specify exact icon mappings
  assert(iconRegistry.getIconByType('seaport') === 'anchor', 'Requirement 2.1: Seaport should use anchor icon');
  assert(iconRegistry.getIconByType('airport') === 'plane', 'Requirement 2.2: Airport should use plane icon');
  assert(iconRegistry.getIconByType('highway') === 'highway', 'Requirement 2.3: Highway should use highway icon');
  assert(iconRegistry.getIconByType('city_center') === 'building-2', 'Requirement 2.4: City center should use building icon');
  assert(iconRegistry.getIconByType('residential') === 'home', 'Requirement 2.5: Residential should use home icon');
  
  // Requirement 5.5: System should display legend for icons
  const types = iconRegistry.getRegisteredTypes();
  assert(types.length === 5, 'Requirement 5.5: Should have all 5 location types for legend');
}

// Run all tests
console.log('Running Icon Registry Tests...\n');

testGetIconByType();
testGetAllIconMappings();
testHasIcon();
testGetRegisteredTypes();
testIconMappingExport();
testIconNameValidation();
testRequirementsValidation();

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
