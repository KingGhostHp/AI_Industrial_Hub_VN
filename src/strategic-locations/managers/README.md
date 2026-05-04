# LocationManager

## Overview

The `LocationManager` class manages loading, caching, and providing access to strategic location data for the map application. It handles 5 types of strategic locations:

1. **Seaport** (Cảng biển) - 114 locations
2. **Airport** (Sân bay) - 44 locations
3. **Highway** (Cao tốc) - 8,383 locations
4. **City Center** (Trung tâm TP) - 1,801 locations
5. **Residential** (Khu dân cư) - 11,219 locations

**Total: 21,561 strategic locations**

## Features

- ✅ Load GeoJSON data from files
- ✅ Cache loaded data in memory
- ✅ Prevent duplicate loading requests
- ✅ Error handling for missing files
- ✅ GeoJSON validation
- ✅ Query locations by type
- ✅ Get combined locations with type information
- ✅ Count features by type
- ✅ Cache management

## Usage

### Basic Usage

```javascript
// Initialize the manager
const locationManager = new LocationManager();

// Load all location types
await locationManager.loadAllLocations();

// Get all locations
const allLocations = locationManager.getAllLocations();
console.log(`Total locations: ${allLocations.features.length}`);

// Get locations by type
const seaports = locationManager.getLocationsByType('seaport');
console.log(`Seaports: ${seaports.features.length}`);
```

### Load Specific Location Type

```javascript
// Load only seaports
const seaportData = await locationManager.loadLocationType('seaport');
console.log(`Loaded ${seaportData.features.length} seaports`);

// Data is cached, subsequent calls return immediately
const cachedData = await locationManager.loadLocationType('seaport');
```

### Get Location Type Configuration

```javascript
// Get all location types
const types = locationManager.getLocationTypes();
types.forEach(type => {
  console.log(`${type.name}: ${type.icon} (${type.color})`);
});

// Get specific location type
const seaportType = locationManager.getLocationType('seaport');
console.log(seaportType);
// {
//   id: 'seaport',
//   name: 'Cảng biển',
//   icon: 'anchor',
//   color: '#0EA5E9',
//   dataFile: 'data/cangbienexport.geojson',
//   geometryType: 'Point'
// }
```

### Check Loading Status

```javascript
// Check if a specific type is loaded
if (locationManager.isLoaded('seaport')) {
  console.log('Seaport data is loaded');
}

// Check if all types are loaded
if (locationManager.areAllLoaded()) {
  console.log('All location types are loaded');
}
```

### Get Counts

```javascript
// Get total count across all types
const total = locationManager.getTotalCount();
console.log(`Total locations: ${total}`);

// Get count for specific type
const seaportCount = locationManager.getCountByType('seaport');
console.log(`Seaports: ${seaportCount}`);
```

### Cache Management

```javascript
// Clear cache for specific type
locationManager.clearCacheForType('seaport');

// Clear all cache
locationManager.clearCache();

// Reload data
await locationManager.loadAllLocations();
```

## Location Types Configuration

### LOCATION_TYPES

```javascript
const LOCATION_TYPES = [
  {
    id: 'seaport',
    name: 'Cảng biển',
    icon: 'anchor',
    color: '#0EA5E9', // Sky blue
    dataFile: 'data/cangbienexport.geojson',
    geometryType: 'Point'
  },
  {
    id: 'airport',
    name: 'Sân bay',
    icon: 'plane',
    color: '#8B5CF6', // Purple
    dataFile: 'data/export.geojson',
    geometryType: 'Point'
  },
  {
    id: 'highway',
    name: 'Cao tốc',
    icon: 'highway',
    color: '#F59E0B', // Amber
    dataFile: 'data/caotocexport.geojson',
    geometryType: 'LineString'
  },
  {
    id: 'city_center',
    name: 'Trung tâm TP',
    icon: 'building-2',
    color: '#EF4444', // Red
    dataFile: 'data/trungtamthanhphoexport.geojson',
    geometryType: 'Point'
  },
  {
    id: 'residential',
    name: 'Khu dân cư',
    icon: 'home',
    color: '#10B981', // Green
    dataFile: 'data/khudancu.geojson',
    geometryType: 'Polygon'
  }
];
```

## API Reference

### Constructor

```javascript
new LocationManager()
```

Creates a new LocationManager instance with empty cache.

### Methods

#### `async loadAllLocations()`

Loads all 5 location types in parallel.

**Returns:** `Promise<void>`

**Example:**
```javascript
await locationManager.loadAllLocations();
```

#### `async loadLocationType(typeId)`

Loads a specific location type from its GeoJSON file.

**Parameters:**
- `typeId` (string): Location type ID ('seaport', 'airport', 'highway', 'city_center', 'residential')

**Returns:** `Promise<Object>` - GeoJSON FeatureCollection

**Example:**
```javascript
const data = await locationManager.loadLocationType('seaport');
```

#### `getLocationsByType(typeId)`

Gets cached location data for a specific type.

**Parameters:**
- `typeId` (string): Location type ID

**Returns:** `Object` - GeoJSON FeatureCollection (empty if not loaded)

**Example:**
```javascript
const seaports = locationManager.getLocationsByType('seaport');
```

#### `getAllLocations()`

Gets all loaded locations combined into a single FeatureCollection. Each feature is augmented with a `locationType` property.

**Returns:** `Object` - Combined GeoJSON FeatureCollection

**Example:**
```javascript
const all = locationManager.getAllLocations();
all.features.forEach(feature => {
  console.log(feature.properties.locationType); // 'seaport', 'airport', etc.
});
```

#### `getLocationTypes()`

Gets the array of location type configurations.

**Returns:** `Array<Object>` - Array of location type definitions

**Example:**
```javascript
const types = locationManager.getLocationTypes();
```

#### `getLocationType(typeId)`

Gets the configuration for a specific location type.

**Parameters:**
- `typeId` (string): Location type ID

**Returns:** `Object|null` - Location type configuration or null if not found

**Example:**
```javascript
const seaportType = locationManager.getLocationType('seaport');
```

#### `isLoaded(typeId)`

Checks if a location type is loaded.

**Parameters:**
- `typeId` (string): Location type ID

**Returns:** `boolean`

**Example:**
```javascript
if (locationManager.isLoaded('seaport')) {
  // Data is available
}
```

#### `areAllLoaded()`

Checks if all location types are loaded.

**Returns:** `boolean`

**Example:**
```javascript
if (locationManager.areAllLoaded()) {
  // All data is available
}
```

#### `getTotalCount()`

Gets the total count of locations across all types.

**Returns:** `number`

**Example:**
```javascript
const total = locationManager.getTotalCount();
```

#### `getCountByType(typeId)`

Gets the count of locations for a specific type.

**Parameters:**
- `typeId` (string): Location type ID

**Returns:** `number`

**Example:**
```javascript
const count = locationManager.getCountByType('seaport');
```

#### `clearCache()`

Clears all cached location data.

**Example:**
```javascript
locationManager.clearCache();
```

#### `clearCacheForType(typeId)`

Clears cache for a specific location type.

**Parameters:**
- `typeId` (string): Location type ID

**Example:**
```javascript
locationManager.clearCacheForType('seaport');
```

## Error Handling

The LocationManager handles errors gracefully:

- **Missing files**: Returns empty FeatureCollection, logs warning
- **Invalid GeoJSON**: Returns empty FeatureCollection, logs error
- **Invalid type ID**: Returns empty FeatureCollection, logs error
- **Network errors**: Returns empty FeatureCollection, logs error

All errors are logged to console but don't throw exceptions, allowing the application to continue functioning with partial data.

## Data Structure

### Input: GeoJSON FeatureCollection

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "@id": "relation/6946894",
        "industrial": "port",
        "landuse": "industrial",
        "name": "Cảng Sài Gòn Khánh Hội"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.7142392, 10.7616165]
      },
      "id": "relation/6946894"
    }
  ]
}
```

### Output: Enhanced Features

When using `getAllLocations()`, features are augmented with `locationType`:

```json
{
  "type": "Feature",
  "properties": {
    "@id": "relation/6946894",
    "industrial": "port",
    "name": "Cảng Sài Gòn Khánh Hội",
    "locationType": "seaport"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [106.7142392, 10.7616165]
  }
}
```

## Testing

Run the test suite:

```bash
node src/strategic-locations/managers/test-location-manager.js
```

Or open the HTML test page in a browser:

```
src/strategic-locations/managers/test-location-manager.html
```

## Requirements Validated

- ✅ **Requirement 1.1**: Load dữ liệu các địa điểm chiến lược từ GeoJSON files
- ✅ **Requirement 1.2**: Hiển thị các địa điểm trên bản đồ với icon tương ứng với Location_Type

## Performance

- **Caching**: Loaded data is cached in memory to avoid redundant fetches
- **Parallel loading**: `loadAllLocations()` loads all types in parallel
- **Duplicate prevention**: Prevents multiple simultaneous requests for the same type
- **Lazy loading**: Data is only loaded when requested

## Browser Compatibility

Works in all modern browsers that support:
- ES6 classes
- Async/await
- Fetch API
- Map data structure

## Dependencies

None. Pure JavaScript implementation.
