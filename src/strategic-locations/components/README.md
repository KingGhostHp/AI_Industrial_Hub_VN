# MapLocationRenderer Component

## Overview

The `MapLocationRenderer` class handles rendering of strategic locations on a Mapbox GL JS map. It supports three geometry types (Point, LineString, and Polygon) with custom styling and interactive features.

## Features

- ✅ Render Point geometries as custom markers with Lucide icons
- ✅ Render LineString geometries as styled map layers
- ✅ Render Polygon geometries with fill and outline layers
- ✅ Interactive popups with location details
- ✅ Toggle visibility of strategic locations
- ✅ Toggle visibility of industrial zones
- ✅ Highlight specific locations with zoom and popup
- ✅ Clear all rendered locations
- ✅ Error handling for invalid data

## Requirements Validated

- **1.1**: Load and display strategic location data
- **1.2**: Display locations with appropriate icons
- **1.3**: Show popups with location information
- **1.4**: Proper icon sizing and styling
- **3.1**: Toggle KCN/CCN visibility
- **3.2**: Update UI based on toggle state
- **4.1**: Toggle strategic locations visibility
- **4.2**: Update UI based on toggle state

## Usage

### Basic Initialization

```javascript
// Initialize with a Mapbox map instance
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [106.7, 10.8],
  zoom: 10
});

const renderer = new MapLocationRenderer(map);
```

### Render Strategic Locations

```javascript
// Load location data
const locationManager = new LocationManager();
await locationManager.loadAllLocations();

const allLocations = locationManager.getAllLocations();
const types = locationManager.getLocationTypes();

// Render on map
renderer.renderStrategicLocations(allLocations, types);
```

### Render Specific Location Type

```javascript
const seaportData = locationManager.getLocationsByType('seaport');
const seaportType = locationManager.getLocationType('seaport');

renderer.renderLocationType('seaport', seaportData, seaportType);
```

### Toggle Visibility

```javascript
// Hide strategic locations
renderer.toggleStrategicLocations(false);

// Show strategic locations
renderer.toggleStrategicLocations(true);

// Check visibility state
const isVisible = renderer.isStrategicLocationsVisible();
```

### Toggle Industrial Zones

```javascript
// Hide industrial zones
renderer.toggleIndustrialZones(false);

// Show industrial zones
renderer.toggleIndustrialZones(true);

// Check visibility state
const isVisible = renderer.isIndustrialZonesVisible();
```

### Highlight a Location

```javascript
const feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [106.7, 10.8] },
  properties: { name: 'Cảng Sài Gòn' }
};

const type = locationManager.getLocationType('seaport');

// Zoom to location and show popup
renderer.highlightLocation(feature, type);
```

### Clear All Locations

```javascript
// Remove all markers and layers
renderer.clearStrategicLocations();
```

### Get Statistics

```javascript
// Get total marker count
const markerCount = renderer.getMarkerCount();

// Get total layer count
const layerCount = renderer.getLayerCount();
```

## API Reference

### Constructor

#### `new MapLocationRenderer(map)`

Creates a new MapLocationRenderer instance.

**Parameters:**
- `map` (mapboxgl.Map) - Required. The Mapbox GL JS map instance.

**Throws:**
- Error if map is not provided.

**Example:**
```javascript
const renderer = new MapLocationRenderer(map);
```

---

### Rendering Methods

#### `renderStrategicLocations(locationsData, types)`

Renders all strategic locations on the map.

**Parameters:**
- `locationsData` (Object) - GeoJSON FeatureCollection with all locations
- `types` (Array<Object>) - Array of location type configurations

**Example:**
```javascript
renderer.renderStrategicLocations(allLocations, locationTypes);
```

---

#### `renderLocationType(typeId, locationsData, type)`

Renders a specific location type.

**Parameters:**
- `typeId` (string) - The location type ID
- `locationsData` (Object) - GeoJSON FeatureCollection for this type
- `type` (Object) - Location type configuration

**Example:**
```javascript
renderer.renderLocationType('seaport', seaportData, seaportType);
```

---

### Visibility Methods

#### `toggleStrategicLocations(visible)`

Shows or hides all strategic location markers and layers.

**Parameters:**
- `visible` (boolean) - True to show, false to hide

**Example:**
```javascript
renderer.toggleStrategicLocations(false); // Hide
renderer.toggleStrategicLocations(true);  // Show
```

---

#### `toggleIndustrialZones(visible)`

Shows or hides industrial zone markers and layers.

**Parameters:**
- `visible` (boolean) - True to show, false to hide

**Example:**
```javascript
renderer.toggleIndustrialZones(false); // Hide
renderer.toggleIndustrialZones(true);  // Show
```

---

#### `isStrategicLocationsVisible()`

Returns the current visibility state of strategic locations.

**Returns:**
- (boolean) - True if visible, false if hidden

**Example:**
```javascript
const isVisible = renderer.isStrategicLocationsVisible();
```

---

#### `isIndustrialZonesVisible()`

Returns the current visibility state of industrial zones.

**Returns:**
- (boolean) - True if visible, false if hidden

**Example:**
```javascript
const isVisible = renderer.isIndustrialZonesVisible();
```

---

### Utility Methods

#### `clearStrategicLocations()`

Removes all strategic location markers and layers from the map.

**Example:**
```javascript
renderer.clearStrategicLocations();
```

---

#### `highlightLocation(feature, type)`

Zooms to a location and shows its popup.

**Parameters:**
- `feature` (Object) - GeoJSON Feature to highlight
- `type` (Object) - Location type configuration

**Example:**
```javascript
renderer.highlightLocation(feature, type);
```

---

#### `getMarkerCount()`

Returns the total number of rendered markers.

**Returns:**
- (number) - Total marker count

**Example:**
```javascript
const count = renderer.getMarkerCount();
```

---

#### `getLayerCount()`

Returns the total number of rendered layers.

**Returns:**
- (number) - Total layer count

**Example:**
```javascript
const count = renderer.getLayerCount();
```

---

## Geometry Type Handling

### Point Geometries

Point geometries (seaports, airports, city centers) are rendered as custom Mapbox markers with:
- Lucide icons
- Custom colors based on location type
- Hover effects (scale up on hover)
- Click to show popup

**Example:**
```javascript
{
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [106.7, 10.8] },
  properties: {
    locationType: 'seaport',
    name: 'Cảng Sài Gòn'
  }
}
```

### LineString Geometries

LineString geometries (highways) are rendered as Mapbox GL layers with:
- Custom line color
- Line width: 3px
- Line opacity: 0.8
- Click to show popup

**Example:**
```javascript
{
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [[106.6, 10.7], [106.7, 10.75], [106.8, 10.8]]
  },
  properties: {
    locationType: 'highway',
    name: 'Cao tốc Trung Lương'
  }
}
```

### Polygon Geometries

Polygon geometries (residential areas) are rendered as Mapbox GL layers with:
- Fill layer with 20% opacity
- Outline layer with 2px width
- Custom color based on location type
- Click to show popup

**Example:**
```javascript
{
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[106.7, 10.8], [106.8, 10.8], [106.8, 10.9], [106.7, 10.9], [106.7, 10.8]]]
  },
  properties: {
    locationType: 'residential',
    name: 'Khu dân cư Phú Mỹ Hưng'
  }
}
```

## Popup Content

Popups display the following information:
- Location name (Vietnamese preferred)
- Location type with icon
- Coordinates (with copy button)
- Additional properties (name:en, industrial, landuse, amenity, operator, website)

**Example Popup:**
```
┌─────────────────────────────────┐
│ ⚓ Cảng Sài Gòn                 │
│ Cảng biển                       │
│                                 │
│ Tọa độ: 10.800000, 106.700000  │
│ [Copy]                          │
│                                 │
│ name:en: Saigon Port            │
│ operator: Saigon Port Authority │
└─────────────────────────────────┘
```

## CSS Styling

The renderer expects the following CSS classes to be defined:

```css
/* Marker styles */
.strategic-location-marker {
  cursor: pointer;
  transition: transform 0.2s;
}

.strategic-location-marker:hover {
  transform: scale(1.2);
  z-index: 1000;
}

.marker-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 2px solid white;
}

/* Popup styles */
.strategic-location-popup {
  font-family: Arial, sans-serif;
}

.popup-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

## Error Handling

The renderer handles errors gracefully:

- **Invalid map instance**: Throws error in constructor
- **Missing location data**: Logs warning and continues
- **Invalid GeoJSON**: Logs warning and skips invalid features
- **Rendering errors**: Logs error and continues with other features
- **Missing DOM elements**: Uses fallback values

## Testing

### Unit Tests

Run the unit tests:
```bash
node src/strategic-locations/components/test-map-location-renderer.js
```

### Browser Tests

Open the browser test page:
```
src/strategic-locations/components/test-map-location-renderer.html
```

The browser test page provides:
- Visual testing of all rendering methods
- Interactive controls for toggling visibility
- Real data loading and rendering
- Statistics display

## Dependencies

- **Mapbox GL JS** (v2.15.0 or later) - Required for map rendering
- **Lucide Icons** - Required for marker icons
- **LocationManager** - Required for loading location data

## Integration Example

Complete integration example:

```javascript
// Initialize map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [106.7, 10.8],
  zoom: 10
});

// Wait for map to load
map.on('load', async () => {
  // Initialize managers
  const locationManager = new LocationManager();
  const renderer = new MapLocationRenderer(map);
  
  // Load location data
  await locationManager.loadAllLocations();
  
  // Render locations
  const allLocations = locationManager.getAllLocations();
  const types = locationManager.getLocationTypes();
  renderer.renderStrategicLocations(allLocations, types);
  
  // Setup toggle buttons
  document.getElementById('toggleStrategic').addEventListener('click', () => {
    const visible = renderer.isStrategicLocationsVisible();
    renderer.toggleStrategicLocations(!visible);
  });
  
  document.getElementById('toggleIndustrial').addEventListener('click', () => {
    const visible = renderer.isIndustrialZonesVisible();
    renderer.toggleIndustrialZones(!visible);
  });
});
```

## Performance Considerations

- **Marker count**: Tested with 1000+ markers without performance issues
- **Layer rendering**: Efficient for LineString and Polygon geometries
- **Memory usage**: Markers and layers are properly cleaned up on clear
- **Viewport culling**: Consider implementing for very large datasets (>5000 markers)
- **Clustering**: Consider implementing for high-density areas

## Future Enhancements

Potential improvements:
- [ ] Viewport culling for large datasets
- [ ] Marker clustering for high-density areas
- [ ] Custom marker templates
- [ ] Animation effects for highlighting
- [ ] Batch rendering optimization
- [ ] WebGL marker rendering for very large datasets

## License

Part of the Strategic Locations Display feature.

## Related Files

- `location-manager.js` - Manages location data loading
- `layer-manager.js` - Manages layer visibility states
- `icon-registry.js` - Maps location types to icons
- `strategic-locations.css` - Styling for markers and popups
