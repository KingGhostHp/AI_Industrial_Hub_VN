/**
 * RouteVisualizer - Renders route polylines on Mapbox map
 * 
 * This class manages the visualization of routes from industrial zones to strategic locations.
 * It handles route rendering with color-coded paths, endpoint markers, and viewport adjustment.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
class RouteVisualizer {
  /**
   * Create a RouteVisualizer instance
   * @param {mapboxgl.Map} map - Mapbox map instance
   */
  constructor(map) {
    if (!map) {
      throw new Error('Map instance is required');
    }
    this.map = map;
    this.routeLayerIds = [];
    this.routeSourceIds = [];
    this.markers = [];
  }

  /**
   * Render routes on map with color-coded paths
   * @param {Array<Object>} routes - Array of route objects
   * [
   *   {
   *     type: 'seaport' | 'airport' | 'city_center',
   *     geometry: GeoJSON LineString,
   *     destination: { name: string, coordinates: [lng, lat] }
   *   }
   * ]
   */
  renderRoutes(routes) {
    if (!Array.isArray(routes)) {
      console.error('[RouteVisualizer] Routes must be an array, got:', typeof routes);
      return;
    }

    console.log(`[RouteVisualizer] Rendering ${routes.length} routes`);

    // Clear existing routes before rendering new ones (Requirement 4.5)
    this.clearRoutes();

    let successCount = 0;
    let errorCount = 0;

    // Render each route
    routes.forEach((route, index) => {
      if (!route.geometry || !route.type || !route.destination) {
        console.warn('[RouteVisualizer] Invalid route object, skipping:', {
          index,
          hasGeometry: !!route.geometry,
          hasType: !!route.type,
          hasDestination: !!route.destination
        });
        errorCount++;
        return;
      }

      try {
        const sourceId = `route-source-${index}`;
        const layerId = `route-layer-${index}`;

        // Add route source
        this.map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: route.geometry
          }
        });

        // Add route layer with color coding and opacity (Requirements 4.2, 4.3)
        this.map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': this._getRouteColor(route.type),
            'line-width': 4,
            'line-opacity': 0.6 // 60% opacity
          }
        });

        this.routeSourceIds.push(sourceId);
        this.routeLayerIds.push(layerId);

        // Add endpoint marker (Requirement 4.4)
        this._addEndpointMarker(
          route.destination.coordinates,
          route.type,
          route.destination.name
        );

        successCount++;
        console.debug(`[RouteVisualizer] Route ${index} rendered successfully:`, {
          type: route.type,
          destination: route.destination.name
        });
      } catch (error) {
        console.error(`[RouteVisualizer] Error rendering route ${index}:`, {
          error: error.message,
          route: route.type
        });
        errorCount++;
      }
    });

    console.log(`[RouteVisualizer] Rendering complete: ${successCount} successful, ${errorCount} errors`);

    // Adjust viewport to show all routes (Requirement 4.6)
    if (routes.length > 0 && successCount > 0) {
      try {
        this._fitBoundsToRoutes(routes);
      } catch (error) {
        console.error('[RouteVisualizer] Error adjusting viewport:', error);
      }
    }
  }

  /**
   * Clear all existing routes from map (Requirement 4.5)
   */
  clearRoutes() {
    console.log('[RouteVisualizer] Clearing routes...');
    
    let layersRemoved = 0;
    let sourcesRemoved = 0;
    let markersRemoved = 0;

    // Remove all route layers
    this.routeLayerIds.forEach(layerId => {
      try {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
          layersRemoved++;
        }
      } catch (error) {
        console.error(`[RouteVisualizer] Error removing layer ${layerId}:`, error);
      }
    });

    // Remove all route sources
    this.routeSourceIds.forEach(sourceId => {
      try {
        if (this.map.getSource(sourceId)) {
          this.map.removeSource(sourceId);
          sourcesRemoved++;
        }
      } catch (error) {
        console.error(`[RouteVisualizer] Error removing source ${sourceId}:`, error);
      }
    });

    // Remove all markers
    this.markers.forEach(marker => {
      try {
        marker.remove();
        markersRemoved++;
      } catch (error) {
        console.error('[RouteVisualizer] Error removing marker:', error);
      }
    });

    console.debug(`[RouteVisualizer] Cleared: ${layersRemoved} layers, ${sourcesRemoved} sources, ${markersRemoved} markers`);

    // Reset tracking arrays
    this.routeLayerIds = [];
    this.routeSourceIds = [];
    this.markers = [];
  }

  /**
   * Add endpoint marker at strategic location
   * @private
   * @param {Array<number>} coordinates - [lng, lat]
   * @param {string} type - 'seaport' | 'airport' | 'city_center'
   * @param {string} name - Location name
   */
  _addEndpointMarker(coordinates, type, name) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      console.error('[RouteVisualizer] Invalid coordinates for marker:', coordinates);
      return;
    }

    try {
      // Create marker element with color matching route type
      const el = document.createElement('div');
      el.className = 'route-endpoint-marker';
      el.style.backgroundColor = this._getRouteColor(type);
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      // Create popup with location name
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`<div style="font-weight: 500;">${name}</div>`);

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(this.map);

      this.markers.push(marker);
      
      console.debug(`[RouteVisualizer] Marker added for ${type}:`, name);
    } catch (error) {
      console.error('[RouteVisualizer] Error adding endpoint marker:', {
        error: error.message,
        type,
        name,
        coordinates
      });
    }
  }

  /**
   * Adjust map viewport to show all routes
   * @private
   * @param {Array<Object>} routes - Array of route objects
   */
  _fitBoundsToRoutes(routes) {
    if (!routes || routes.length === 0) {
      console.debug('[RouteVisualizer] No routes to fit bounds');
      return;
    }

    try {
      const bounds = new mapboxgl.LngLatBounds();
      let coordinateCount = 0;

      // Extend bounds to include all route coordinates
      routes.forEach(route => {
        if (route.geometry && route.geometry.coordinates) {
          route.geometry.coordinates.forEach(coord => {
            bounds.extend(coord);
            coordinateCount++;
          });
        }
      });

      if (coordinateCount === 0) {
        console.warn('[RouteVisualizer] No valid coordinates found in routes');
        return;
      }

      // Fit map to bounds with padding
      this.map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
        maxZoom: 12
      });

      console.debug(`[RouteVisualizer] Viewport adjusted to fit ${coordinateCount} coordinates`);
    } catch (error) {
      console.error('[RouteVisualizer] Error fitting bounds:', error);
    }
  }

  /**
   * Get color for route type (Requirement 4.2)
   * @private
   * @param {string} type - 'seaport' | 'airport' | 'city_center'
   * @returns {string} Hex color code
   */
  _getRouteColor(type) {
    const colors = {
      seaport: '#0EA5E9',      // blue
      airport: '#F97316',       // orange
      city_center: '#10B981'    // green
    };

    return colors[type] || '#6B7280'; // default gray if type unknown
  }
}


export default RouteVisualizer;
