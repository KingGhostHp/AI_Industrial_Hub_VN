/**
 * Simple Node.js test runner for LayerManager
 * Run with: node test-layer-manager.js
 */

const { LayerManager, LAYER_IDS, DEFAULT_LAYER_STATES } = require('./layer-manager.js');

// Mock localStorage for Node.js environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

// Test utilities
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

function assertEquals(actual, expected, message) {
  if (actual === expected) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    testsFailed++;
  }
}

function testSection(name) {
  console.log(`\n=== ${name} ===`);
}

// Run tests
console.log('LayerManager Test Suite\n');

// Test 1: Constructor
testSection('Test 1: Constructor');
const manager = new LayerManager();
assert(manager !== null, 'LayerManager instance created');
assertEquals(manager.storageKey, 'map-layer-states', 'Default storage key is correct');
assert(manager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), 'Industrial zones visible by default');
assert(manager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS), 'Strategic locations visible by default');

// Test 2: Custom storage key
testSection('Test 2: Custom Storage Key');
const customManager = new LayerManager('custom-key');
assertEquals(customManager.storageKey, 'custom-key', 'Custom storage key is set');

// Test 3: Toggle layer
testSection('Test 3: Toggle Layer');
const manager2 = new LayerManager();
const initialState = manager2.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES);
const newState = manager2.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES);
assertEquals(newState, !initialState, 'Toggle returns new state');
assertEquals(manager2.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), newState, 'Layer state updated');

// Test 4: Set layer visibility
testSection('Test 4: Set Layer Visibility');
const manager3 = new LayerManager();
manager3.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
assertEquals(manager3.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), false, 'Layer set to hidden');
manager3.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, true);
assertEquals(manager3.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), true, 'Layer set to visible');

// Test 5: Get all layer states
testSection('Test 5: Get All Layer States');
const manager4 = new LayerManager();
const states = manager4.getAllLayerStates();
assert(states instanceof Map, 'Returns a Map');
assertEquals(states.size, 2, 'Map has 2 entries');
assert(states.has(LAYER_IDS.INDUSTRIAL_ZONES), 'Has industrial-zones key');
assert(states.has(LAYER_IDS.STRATEGIC_LOCATIONS), 'Has strategic-locations key');

// Test 6: Save and load state
testSection('Test 6: Save and Load State');
localStorage.clear();
const manager5 = new LayerManager();
manager5.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
manager5.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
manager5.saveState();

const savedData = localStorage.getItem('map-layer-states');
assert(savedData !== null, 'State saved to localStorage');

const manager6 = new LayerManager();
manager6.loadState();
assertEquals(manager6.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), false, 'Industrial zones state loaded');
assertEquals(manager6.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS), false, 'Strategic locations state loaded');

// Test 7: Reset to default
testSection('Test 7: Reset to Default');
const manager7 = new LayerManager();
manager7.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
manager7.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
manager7.resetToDefault();
assertEquals(manager7.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), true, 'Industrial zones reset to default');
assertEquals(manager7.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS), true, 'Strategic locations reset to default');

// Test 8: Invalid layer ID
testSection('Test 8: Invalid Layer ID');
const manager8 = new LayerManager();
const invalidResult = manager8.toggleLayer('invalid-layer');
assertEquals(invalidResult, false, 'Toggle invalid layer returns false');
assertEquals(manager8.isLayerVisible('invalid-layer'), false, 'Invalid layer returns false');

// Test 9: Invalid visibility value
testSection('Test 9: Invalid Visibility Value');
const manager9 = new LayerManager();
const beforeState = manager9.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES);
manager9.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, 'invalid');
assertEquals(manager9.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), beforeState, 'State unchanged with invalid value');

// Test 10: Helper methods
testSection('Test 10: Helper Methods');
const manager10 = new LayerManager();
const validIds = manager10.getValidLayerIds();
assert(Array.isArray(validIds), 'getValidLayerIds returns array');
assertEquals(validIds.length, 2, 'Returns 2 valid IDs');
assert(validIds.includes(LAYER_IDS.INDUSTRIAL_ZONES), 'Includes industrial-zones');
assert(validIds.includes(LAYER_IDS.STRATEGIC_LOCATIONS), 'Includes strategic-locations');

const stateObj = manager10.getStateAsObject();
assert(typeof stateObj === 'object', 'getStateAsObject returns object');
assert(stateObj[LAYER_IDS.INDUSTRIAL_ZONES] !== undefined, 'Object has industrial-zones');
assert(stateObj[LAYER_IDS.STRATEGIC_LOCATIONS] !== undefined, 'Object has strategic-locations');

// Test 11: Multiple toggles
testSection('Test 11: Multiple Toggles');
const manager11 = new LayerManager();
assert(manager11.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), 'Initial state is true');
manager11.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES);
assertEquals(manager11.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), false, 'After 1st toggle: false');
manager11.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES);
assertEquals(manager11.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), true, 'After 2nd toggle: true');
manager11.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES);
assertEquals(manager11.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), false, 'After 3rd toggle: false');

// Test 12: Persistence scenario
testSection('Test 12: Persistence Scenario');
localStorage.clear();
const session1 = new LayerManager();
session1.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
session1.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
session1.saveState();

const session2 = new LayerManager();
session2.loadState();
assertEquals(session2.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), false, 'Session 2: industrial-zones is false');
assertEquals(session2.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS), false, 'Session 2: strategic-locations is false');

// Test 13: Load with no saved state
testSection('Test 13: Load with No Saved State');
localStorage.clear();
const manager13 = new LayerManager();
manager13.loadState();
assertEquals(manager13.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), true, 'Uses default when no saved state');
assertEquals(manager13.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS), true, 'Uses default when no saved state');

// Test 14: Load with invalid JSON
testSection('Test 14: Load with Invalid JSON');
localStorage.clear();
localStorage.setItem('map-layer-states', 'invalid json');
const manager14 = new LayerManager();
manager14.loadState();
assertEquals(manager14.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES), true, 'Falls back to default with invalid JSON');

// Test 15: Constants
testSection('Test 15: Constants');
assert(LAYER_IDS.INDUSTRIAL_ZONES === 'industrial-zones', 'LAYER_IDS.INDUSTRIAL_ZONES is correct');
assert(LAYER_IDS.STRATEGIC_LOCATIONS === 'strategic-locations', 'LAYER_IDS.STRATEGIC_LOCATIONS is correct');
assert(DEFAULT_LAYER_STATES['industrial-zones'] === true, 'Default industrial-zones is true');
assert(DEFAULT_LAYER_STATES['strategic-locations'] === true, 'Default strategic-locations is true');

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed!');
  process.exit(1);
}
