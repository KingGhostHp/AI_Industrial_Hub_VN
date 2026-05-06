/**
 * Manual test script for DataManager
 * Run this in the browser console to test DataManager functionality
 */

import DataManager from './data-manager.js';

async function testDataManager() {
  console.log('=== Testing DataManager ===\n');
  
  try {
    // Create instance
    console.log('1. Creating DataManager instance...');
    const dm = new DataManager();
    console.log('✓ DataManager created\n');
    
    // Initialize
    console.log('2. Initializing DataManager...');
    await dm.initialize();
    console.log('✓ DataManager initialized\n');
    
    // Load zone data
    console.log('3. Loading zone data...');
    const zones = await dm.loadZoneData();
    console.log(`✓ Loaded ${zones.features.length} zones\n`);
    
    // Test getting zones by province
    console.log('4. Testing getZonesByProvince...');
    const hanoiZones = dm.getZonesByProvince('Hà Nội');
    console.log(`✓ Found ${hanoiZones.length} zones in Hà Nội\n`);
    
    // Load strategic locations
    console.log('5. Loading seaports...');
    const seaports = await dm.loadStrategicLocations('seaport');
    console.log(`✓ Loaded ${seaports.features.length} seaports\n`);
    
    console.log('6. Loading airports...');
    const airports = await dm.loadStrategicLocations('airport');
    console.log(`✓ Loaded ${airports.features.length} airports\n`);
    
    console.log('7. Loading city centers...');
    const cityCenters = await dm.loadStrategicLocations('city_center');
    console.log(`✓ Loaded ${cityCenters.features.length} city centers\n`);
    
    // Test user preferences
    console.log('8. Testing user preferences...');
    const prefs = dm.getUserPreferences();
    console.log(`✓ Loaded preferences: industry=${prefs.industryProfile}, language=${prefs.language}\n`);
    
    // Test update status
    console.log('9. Checking update status...');
    const status = dm.getUpdateStatus();
    console.log('✓ Update status:', status);
    console.log('');
    
    // Test logs
    console.log('10. Getting operation logs...');
    const logs = dm.getLogs(10);
    console.log(`✓ Retrieved ${logs.length} log entries\n`);
    
    console.log('=== All tests passed! ===');
    
    return {
      success: true,
      dataManager: dm,
      zones: zones.features.length,
      seaports: seaports.features.length,
      airports: airports.features.length,
      cityCenters: cityCenters.features.length
    };
    
  } catch (error) {
    console.error('✗ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in browser console
window.testDataManager = testDataManager;

console.log('DataManager test loaded. Run testDataManager() to execute tests.');
