# Nearest Strategic Locations Feature

Tính năng tự động tìm kiếm và hiển thị các địa điểm chiến lược gần nhất cho các Khu công nghiệp (KCN) và Cụm công nghiệp (CCN).

## Directory Structure

```
src/nearest-locations/
├── index.js                 # Main entry point and orchestration
├── utils/                   # Core utility classes
│   ├── DistanceCalculator.js       # Haversine distance calculations
│   ├── RouteCalculator.js          # Mapbox Directions API integration
│   └── NearestLocationFinder.js    # Spatial search for nearest locations
├── components/              # UI components
│   ├── RouteVisualizer.js          # Map route rendering
│   └── InformationPanel.js         # Information panel UI
└── styles/                  # CSS stylesheets
    └── nearest-locations.css       # Feature styles
```

## Features

- **Automatic Location Discovery**: Finds nearest seaport, airport, and city center
- **Distance Calculation**: Calculates both straight-line and route distances
- **Route Visualization**: Displays color-coded routes on the map
- **Information Panel**: Shows detailed metrics in a user-friendly table
- **Performance Optimized**: Uses caching and debouncing for fast response
- **Error Handling**: Graceful degradation with retry logic

## Usage

```javascript
import { initializeNearestLocations } from './src/nearest-locations/index.js';

// Initialize after map loads
map.on('load', () => {
  initializeNearestLocations(map, locationManager);
});
```

## Requirements

- Mapbox GL JS v3.1.2+
- Mapbox Directions API access token
- LocationManager instance for strategic location data

## Development

See `.kiro/specs/nearest-strategic-locations/` for complete requirements, design, and implementation tasks.
