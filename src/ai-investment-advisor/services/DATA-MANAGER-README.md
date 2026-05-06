# DataManager Service

## Overview

The DataManager service provides a centralized data access layer for the AI Investment Advisor system. It manages loading, caching, and providing access to:

- Industrial zone data (GeoJSON)
- Strategic locations (ports, airports, city centers)
- IIP Vietnam API updates
- User preferences

## Features

✅ **Data Loading & Caching**
- Load zone data from GeoJSON files
- Load strategic locations (seaports, airports, city centers)
- Cache data in memory for fast access
- Prevent duplicate loading with promise deduplication

✅ **IIP Vietnam API Integration**
- Fetch updates from IIP Vietnam API
- 24-hour update cycle
- Graceful fallback to cached data on API failures

✅ **User Preferences Management**
- Save/load user preferences to localStorage
- Manage industry profiles, criteria weights, budget ranges

✅ **Error Handling**
- Graceful error handling for missing files
- Fallback to cached data on load failures
- Clear error messages with context

✅ **Operation Logging**
- Log all data operations with timestamps
- Track data update times
- Maintain operation history (last 100 entries)

## Requirements Validated

- **11.1**: Integration with existing GeoJSON data source
- **11.2**: Integration with IIP Vietnam API
- **11.4**: Update zone information within 24 hours
- **11.6**: Log all data updates and API calls with timestamps
- **11.7**: Display warning and use cached data on failures
- **16.2**: Handle IIP API unavailability gracefully

## Usage

### Basic Usage

```javascript
import { dataManager } from './services/data-manager.js';

// Initialize the data manager
await dataManager.initialize();

// Load zone data
const zones = await dataManager.loadZoneData();
console.log(`Loaded ${zones.features.length} zones`);

// Load strategic locations
const seaports = await dataManager.loadStrategicLocations('seaport');
const airports = await dataManager.loadStrategicLocations('airport');
const cityCenters = await dataManager.loadStrategicLocations('city_center');

// Or load all at once
await dataManager.loadAllStrategicLocations();
```

### Getting Zone Data

```javascript
// Get all zones
const allZones = dataManager.getAllZones();

// Get zones by province
const hanoiZones = dataManager.getZonesByProvince('Hà Nội');

// Get zone by code
const zone = dataManager.getZoneByCode('khu-cong-nghiep-example');
```

### Getting Strategic Locations

```javascript
// Get seaports
const seaports = dataManager.getStrategicLocationsByType('seaport');

// Get airports
const airports = dataManager.getStrategicLocationsByType('airport');

// Get city centers
const cityCenters = dataManager.getStrategicLocationsByType('city_center');
```

### Managing User Preferences

```javascript
// Get current preferences
const prefs = dataManager.getUserPreferences();

// Modify preferences
prefs.industryProfile = 'technology';
prefs.budgetRange = { min: 100, max: 500 };

// Save preferences
dataManager.saveUserPreferences(prefs);

// Reload preferences
const reloadedPrefs = dataManager.loadUserPreferences();
```

### Fetching IIP API Updates

```javascript
// Fetch updates from IIP Vietnam API
try {
  const updates = await dataManager.fetchIIPUpdates();
  console.log('IIP API updates fetched successfully');
} catch (error) {
  console.error('Failed to fetch IIP updates:', error);
  // DataManager will automatically fall back to cached data
}
```

### Auto-Update

```javascript
// Check and perform auto-updates (24-hour cycle)
await dataManager.autoUpdate();

// Check if update is needed
const needsUpdate = dataManager.needsUpdate('zones');
if (needsUpdate) {
  await dataManager.loadZoneData(true); // Force reload
}
```

### Update Status

```javascript
// Get update status for all data types
const status = dataManager.getUpdateStatus();

console.log('Zones last update:', new Date(status.zones.lastUpdate));
console.log('Zones needs update:', status.zones.needsUpdate);
console.log('Zones data age (ms):', status.zones.dataAge);
```

### Operation Logs

```javascript
// Get recent logs
const logs = dataManager.getLogs(50); // Last 50 entries

logs.forEach(log => {
  console.log(`[${log.level}] ${log.timestamp}: ${log.message}`);
});

// Clear logs
dataManager.clearLogs();
```

### Cache Management

```javascript
// Clear all cached data
dataManager.clearCache();

// This will force reload on next access
const zones = await dataManager.loadZoneData(); // Reloads from file
```

## Configuration

### Constructor Options

```javascript
const dm = new DataManager({
  zonesDataFile: 'data/industrial_zones.geojson',  // Path to zones GeoJSON
  updateInterval: 86400000,                         // Update interval (24 hours)
  enableLogging: true                               // Enable operation logging
});
```

### Strategic Location Types

The DataManager supports three strategic location types:

| Type | Name | Data File |
|------|------|-----------|
| `seaport` | Cảng biển | `data/cangbienexport.geojson` |
| `airport` | Sân bay | `data/export.geojson` |
| `city_center` | Trung tâm tỉnh/TP | `data/34-tinh-thanh-trung-tam.geojson` |

## Error Handling

The DataManager handles errors gracefully:

### Missing Files
```javascript
try {
  const zones = await dataManager.loadZoneData();
} catch (error) {
  // Error logged, exception thrown
  console.error('Failed to load zones:', error.message);
}
```

### IIP API Failures
```javascript
try {
  const updates = await dataManager.fetchIIPUpdates();
} catch (error) {
  // Falls back to cached data automatically
  // Error logged but not thrown
  const zones = dataManager.getAllZones(); // Returns cached data
}
```

### Invalid GeoJSON
```javascript
// DataManager validates GeoJSON structure
// Throws error if:
// - Not a FeatureCollection
// - Missing features array
// - Invalid JSON format
```

## Logging

All operations are logged with timestamps:

```javascript
{
  timestamp: "2025-02-25T10:30:45.123Z",
  level: "INFO",  // or "ERROR"
  message: "Loading zone data from data/industrial_zones.geojson",
  error: "...",   // Only for ERROR level
  stack: "..."    // Only for ERROR level
}
```

## Singleton Instance

The module exports a singleton instance for convenience:

```javascript
import { dataManager } from './services/data-manager.js';

// Use the singleton
await dataManager.initialize();
const zones = await dataManager.loadZoneData();
```

Or create your own instance:

```javascript
import DataManager from './services/data-manager.js';

const dm = new DataManager({
  zonesDataFile: 'custom/path/zones.geojson',
  updateInterval: 3600000 // 1 hour
});

await dm.initialize();
```

## Testing

### Manual Testing

Open `test-data-manager.html` in a browser to run interactive tests:

```bash
# Start a local server
python -m http.server 8000

# Open in browser
open http://localhost:8000/test-data-manager.html
```

### Programmatic Testing

```javascript
import DataManager from './services/data-manager.js';

async function testDataManager() {
  const dm = new DataManager();
  await dm.initialize();
  
  // Test zone loading
  const zones = await dm.loadZoneData();
  console.assert(zones.features.length > 0, 'Zones loaded');
  
  // Test strategic locations
  const seaports = await dm.loadStrategicLocations('seaport');
  console.assert(seaports.features.length > 0, 'Seaports loaded');
  
  // Test preferences
  const prefs = dm.getUserPreferences();
  console.assert(prefs.industryProfile !== null, 'Preferences loaded');
  
  console.log('All tests passed!');
}

testDataManager();
```

## Integration with Other Services

### Multi-Criteria Analyzer

```javascript
import { dataManager } from './services/data-manager.js';
import MultiCriteriaAnalyzer from './services/multi-criteria-analyzer.js';

await dataManager.initialize();
const zones = await dataManager.loadZoneData();
const prefs = dataManager.getUserPreferences();

const analyzer = new MultiCriteriaAnalyzer();
const recommendations = analyzer.rankZones(zones.features, prefs);
```

### Logistics Calculator

```javascript
import { dataManager } from './services/data-manager.js';
import LogisticsCalculator from './services/logistics-calculator.js';

await dataManager.initialize();
const seaports = await dataManager.loadStrategicLocations('seaport');
const airports = await dataManager.loadStrategicLocations('airport');

const calculator = new LogisticsCalculator();
const cost = calculator.calculateCost(zone, seaports.features[0]);
```

### Prediction Engine

```javascript
import { dataManager } from './services/data-manager.js';
import PredictionEngine from './services/prediction-engine.js';

await dataManager.initialize();
const zones = await dataManager.loadZoneData();

const engine = new PredictionEngine();
const growth = engine.calculateGrowthPotential(zones.features[0], provinceData);
```

## Performance Considerations

- **Caching**: All data is cached in memory after first load
- **Promise Deduplication**: Multiple simultaneous requests share the same loading promise
- **Lazy Loading**: Data is only loaded when requested
- **Update Cycle**: 24-hour update interval prevents excessive API calls
- **Log Rotation**: Keeps only last 100 log entries to prevent memory bloat

## Future Enhancements

- [ ] Add province statistics calculation
- [ ] Implement data validation and sanitization
- [ ] Add support for custom data sources
- [ ] Implement data versioning and migration
- [ ] Add support for offline mode with service workers
- [ ] Implement data compression for localStorage
- [ ] Add support for incremental updates from IIP API

## Dependencies

- `UserPreferences` model from `../models/user-preferences.js`
- `envLoader` utility from `../utils/env-loader.js`
- Browser `fetch` API for loading data
- Browser `localStorage` for preferences persistence

## Browser Compatibility

- Modern browsers with ES6 module support
- Fetch API support (all modern browsers)
- localStorage support (all modern browsers)

## License

Part of the AI Investment Advisor system for Vietnam Industrial Zones.
