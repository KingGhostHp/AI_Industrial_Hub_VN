# Strategic Locations Utilities

This directory contains utility modules for the Strategic Locations feature.

## Modules

### 1. GeoJSON Validator

Provides comprehensive validation for GeoJSON data used in the Strategic Locations feature.

**Files:**
- **geojson-validator.js** - Main validator module with validation functions
- **geojson-validator.test.js** - Unit tests for the validator
- **validate-all-data.js** - Script to validate all strategic location data files

### 2. Icon Registry

Maps location types to Lucide icon names for consistent icon usage across the application.

**Files:**
- **icon-registry.js** - Icon mapping and helper functions
- **icon-registry.test.js** - Unit tests for the icon registry

---

## Icon Registry

The Icon Registry provides a centralized mapping of location types to Lucide icon names, ensuring consistent icon usage throughout the Strategic Locations feature.

### Usage

```javascript
const iconRegistry = require('./icon-registry.js');

// Get icon for a specific location type
const icon = iconRegistry.getIconByType('seaport');
console.log(icon); // 'anchor'

// Get all icon mappings
const allMappings = iconRegistry.getAllIconMappings();
console.log(allMappings);
// { seaport: 'anchor', airport: 'plane', ... }

// Check if a location type has a registered icon
if (iconRegistry.hasIcon('airport')) {
  console.log('Airport has a registered icon');
}

// Get all registered location types
const types = iconRegistry.getRegisteredTypes();
console.log(types);
// ['seaport', 'airport', 'highway', 'city_center', 'residential']
```

### Icon Mappings

The following icon mappings are defined (per Requirements 2.1-2.6):

| Location Type | Icon Name | Lucide Icon | Requirement |
|--------------|-----------|-------------|-------------|
| seaport | anchor | ⚓ | 2.1 |
| airport | plane | ✈️ | 2.2 |
| highway | highway | 🛣️ | 2.3 |
| city_center | building-2 | 🏢 | 2.4 |
| residential | home | 🏠 | 2.5 |

**Default Icon:** `map-pin` (used when location type is not recognized)

### API Reference

#### `getIconByType(locationType)`

Get the Lucide icon name for a given location type.

**Parameters:**
- `locationType` (string) - The location type ID

**Returns:** (string) - The Lucide icon name, or 'map-pin' as default

**Example:**
```javascript
getIconByType('seaport')  // returns 'anchor'
getIconByType('unknown')  // returns 'map-pin'
```

#### `getAllIconMappings()`

Get all available location types with their icon mappings.

**Returns:** (Object) - Object mapping location types to icon names

**Example:**
```javascript
getAllIconMappings()
// returns { seaport: 'anchor', airport: 'plane', ... }
```

#### `hasIcon(locationType)`

Check if a location type has a registered icon.

**Parameters:**
- `locationType` (string) - The location type ID to check

**Returns:** (boolean) - True if the location type has a registered icon

**Example:**
```javascript
hasIcon('seaport')  // returns true
hasIcon('unknown')  // returns false
```

#### `getRegisteredTypes()`

Get a list of all registered location types.

**Returns:** (Array) - Array of location type IDs

**Example:**
```javascript
getRegisteredTypes()
// returns ['seaport', 'airport', 'highway', 'city_center', 'residential']
```

#### `ICON_MAPPING`

Direct access to the icon mapping object.

**Type:** Object<string, string>

**Example:**
```javascript
const { ICON_MAPPING } = require('./icon-registry.js');
console.log(ICON_MAPPING.seaport); // 'anchor'
```

### Running Tests

```bash
node src/strategic-locations/utils/icon-registry.test.js
```

This runs 48 unit tests covering:
- Icon retrieval for all location types
- Default icon for unknown types
- Edge cases (null, undefined, empty string)
- Icon mapping immutability
- Registered type queries
- Requirements validation (2.1-2.6, 5.5)

### Integration with Components

The Icon Registry is used by various components:

**LayerControlPanel:**
```javascript
const iconRegistry = require('./utils/icon-registry.js');

// Create legend items
const types = iconRegistry.getRegisteredTypes();
types.forEach(typeId => {
  const iconName = iconRegistry.getIconByType(typeId);
  // Create legend item with icon
});
```

**MapLocationRenderer:**
```javascript
const iconRegistry = require('./utils/icon-registry.js');

function createMarker(location, type) {
  const iconName = iconRegistry.getIconByType(type.id);
  const el = document.createElement('div');
  el.innerHTML = `<i data-lucide="${iconName}"></i>`;
  lucide.createIcons({ el });
  return new mapboxgl.Marker(el);
}
```

---

## GeoJSON Validator

### Basic Validation

```javascript
const validator = require('./geojson-validator.js');

// Load your GeoJSON data
const data = {
  type: 'FeatureCollection',
  features: [...]
};

// Validate the data
const result = validator.validateGeoJSON(data);

if (result.valid) {
  console.log('✓ GeoJSON is valid');
  console.log(`Valid features: ${result.validFeatureCount}`);
} else {
  console.error('✗ GeoJSON has errors');
  console.error('Errors:', result.errors);
}

// Check warnings
if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

### Location Type Specific Validation

```javascript
// Validate with expected geometry type checking
const result = validator.validateGeoJSON(data, 'airport');

// This will warn if features don't have the expected geometry type
// For example, airports should have Point geometry
```

### Filter Valid Features

```javascript
// Remove invalid features and get a clean FeatureCollection
const cleanData = validator.filterValidFeatures(data, 'seaport');

// cleanData now contains only valid features
console.log(`Filtered ${cleanData.features.length} valid features`);
```

## Validation Rules

### FeatureCollection Structure

- Must have `type: "FeatureCollection"`
- Must have a `features` array
- Warns if features array is empty

### Feature Structure

- Must have `type: "Feature"`
- Must have a `geometry` object
- Should have a `properties` object (warns if missing)
- Warns if no name property found (`name`, `name:vi`, or `name:en`)

### Geometry Validation

Validates all standard GeoJSON geometry types:
- Point
- LineString
- Polygon
- MultiPoint
- MultiLineString
- MultiPolygon
- GeometryCollection

### Coordinate Validation

- Coordinates must be numbers
- Coordinates must be finite
- Longitude must be between -180 and 180
- Latitude must be between -90 and 90
- LineStrings must have at least 2 positions
- Polygons must have at least 4 positions (closed ring)
- Warns if polygon rings are not closed

### Location Type Specific Validation

Expected geometry types for each location type:

| Location Type | Expected Geometry |
|--------------|-------------------|
| seaport | Point |
| airport | Point |
| highway | LineString, MultiLineString |
| city_center | Point |
| residential | Polygon, MultiPolygon |

The validator will warn if a feature has an unexpected geometry type for its location type, but will not fail validation.

## Running Tests

### Unit Tests

```bash
node src/strategic-locations/utils/geojson-validator.test.js
```

This runs 22 unit tests covering:
- Valid and invalid GeoJSON structures
- Different geometry types
- Coordinate validation
- Location type specific validation
- Feature filtering
- Real data file validation

### Validate All Data Files

```bash
node src/strategic-locations/utils/validate-all-data.js
```

This validates all 5 strategic location data files:
- `data/cangbienexport.geojson` (Seaports)
- `data/export.geojson` (Airports)
- `data/caotocexport.geojson` (Highways)
- `data/trungtamthanhphoexport.geojson` (City Centers)
- `data/khudancu.geojson` (Residential Areas)

## Validation Results

The validator returns an object with:

```javascript
{
  valid: boolean,           // true if no errors
  errors: string[],         // array of error messages
  warnings: string[],       // array of warning messages
  validFeatureCount: number // number of valid features
}
```

### Errors vs Warnings

**Errors** indicate structural problems that prevent the data from being used:
- Invalid GeoJSON structure
- Missing required fields
- Invalid coordinate values
- Invalid geometry types

**Warnings** indicate potential issues but don't prevent usage:
- Missing name properties
- Unexpected geometry types for location
- Unclosed polygon rings
- Empty feature collections

## Integration with LocationManager

The validator is used by the LocationManager to ensure data quality:

```javascript
async loadLocationType(typeId) {
  const response = await fetch(type.dataFile);
  const data = await response.json();
  
  // Validate the data
  const validation = validateGeoJSON(data, typeId);
  
  if (!validation.valid) {
    console.error(`Invalid GeoJSON for ${typeId}`);
    // Filter out invalid features
    return filterValidFeatures(data, typeId);
  }
  
  return data;
}
```

## Error Handling

The validator is designed to be forgiving:
- It logs errors and warnings to the console
- It continues validation even if some features are invalid
- It provides the `filterValidFeatures` function to clean data
- It never throws exceptions

This allows the application to gracefully handle imperfect data and continue functioning with valid features.

## Current Data Status

As of the last validation run:

| File | Features | Valid | Errors | Warnings |
|------|----------|-------|--------|----------|
| Seaports | 114 | 114 | 0 | 26 |
| Airports | 44 | 44 | 0 | 2 |
| Highways | 8,383 | 8,383 | 0 | 2,322 |
| City Centers | 1,801 | 1,801 | 0 | 0 |
| Residential | 11,219 | 11,219 | 0 | 21,130 |
| **Total** | **21,561** | **21,561** | **0** | **23,480** |

All features are structurally valid. Warnings are primarily about:
- Missing name properties (some features don't have names)
- Residential areas using Point geometry instead of Polygon (data source limitation)

## Future Enhancements

Potential improvements:
- Add validation for specific property schemas
- Add validation for CRS (Coordinate Reference System)
- Add validation for bounding boxes
- Add performance metrics
- Add validation for custom properties
- Add support for GeoJSON validation against JSON Schema
