/**
 * MapRouteRenderer
 * 
 * Renders routes on Mapbox GL JS map with proper styling.
 * Handles route layers, waypoint markers, and map bounds.
 */

class MapRouteRenderer {
  /**
   * @param {mapboxgl.Map} map - Mapbox GL JS map instance
   */
  constructor(map) {
    this.map = map;
    this.routeSourceId = 'route-source';
    this.routeLayerId = 'route-layer';
    this.alternativeRouteLayerId = 'alternative-route-layer';
    this.waypointMarkers = [];
  }

  /**
   * Render a single route on the map
   * @param {import('../types/index.js').Route} route
   * @param {boolean} isAlternative - Whether this is an alternative route
   */
  renderRoute(route, isAlternative = false) {
    if (!route || !route.geometry) {
      console.warn('Invalid route for rendering');
      return;
    }

    const sourceId = isAlternative 
      ? `${this.routeSourceId}-alt-${route.id}`
      : this.routeSourceId;
    const layerId = isAlternative
      ? `${this.alternativeRouteLayerId}-${route.id}`
      : this.routeLayerId;

    // Add or update source
    if (this.map.getSource(sourceId)) {
      this.map.getSource(sourceId).setData(route.geometry);
    } else {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: route.geometry,
      });
    }

    // Add or update layer
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': isAlternative ? '#9CA3AF' : '#3B82F6', // Gray for alt, blue for main
          'line-width': isAlternative ? 4 : 6,
          'line-opacity': isAlternative ? 0.5 : 0.9,
        },
      });
    }

    // Fit bounds to route
    if (!isAlternative) {
      this.fitBounds(route);
    }
  }

  /**
   * Render multiple routes (main + alternatives)
   * @param {import('../types/index.js').Route[]} routes
   */
  renderRoutes(routes) {
    if (!routes || routes.length === 0) {
      return;
    }

    // Clear existing routes first
    this.clearRoutes();

    // Render main route (first one)
    this.renderRoute(routes[0], false);

    // Render alternative routes
    for (let i = 1; i < routes.length; i++) {
      this.renderRoute(routes[i], true);
    }
  }

  /**
   * Highlight a specific route
   * @param {string} routeId - Route ID to highlight
   */
  highlightRoute(routeId) {
    // Find and highlight the route layer
    const layerId = `${this.alternativeRouteLayerId}-${routeId}`;
    if (this.map.getLayer(layerId)) {
      this.map.setPaintProperty(layerId, 'line-color', '#3B82F6');
      this.map.setPaintProperty(layerId, 'line-width', 6);
      this.map.setPaintProperty(layerId, 'line-opacity', 0.9);
    }
  }

  /**
   * Clear all routes from map
   */
  clearRoutes() {
    // Remove main route
    if (this.map.getLayer(this.routeLayerId)) {
      this.map.removeLayer(this.routeLayerId);
    }
    if (this.map.getSource(this.routeSourceId)) {
      this.map.removeSource(this.routeSourceId);
    }

    // Remove alternative routes
    const layers = this.map.getStyle().layers;
    layers.forEach(layer => {
      if (layer.id.startsWith(this.alternativeRouteLayerId)) {
        this.map.removeLayer(layer.id);
        const sourceId = layer.source;
        if (this.map.getSource(sourceId)) {
          this.map.removeSource(sourceId);
        }
      }
    });
  }

  /**
   * Add waypoint markers to map
   * @param {import('../types/index.js').Waypoint[]} waypoints
   */
  addWaypointMarkers(waypoints) {
    // Remove existing markers
    this.removeWaypointMarkers();

    waypoints.forEach((waypoint, index) => {
      const el = document.createElement('div');
      el.className = 'route-waypoint-marker';
      
      // Style based on waypoint type
      if (waypoint.type === 'origin') {
        el.style.backgroundColor = '#10B981'; // Green
        el.innerHTML = '<span style="color: white; font-weight: bold;">A</span>';
      } else if (waypoint.type === 'destination') {
        el.style.backgroundColor = '#EF4444'; // Red
        el.innerHTML = '<span style="color: white; font-weight: bold;">B</span>';
      } else {
        el.style.backgroundColor = '#3B82F6'; // Blue
        el.innerHTML = `<span style="color: white; font-weight: bold;">${index}</span>`;
      }

      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(waypoint.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<strong>${waypoint.name}</strong>`)
        )
        .addTo(this.map);

      this.waypointMarkers.push(marker);
    });
  }

  /**
   * Remove all waypoint markers
   */
  removeWaypointMarkers() {
    this.waypointMarkers.forEach(marker => marker.remove());
    this.waypointMarkers = [];
  }

  /**
   * Fit map bounds to route
   * @param {import('../types/index.js').Route} route
   */
  fitBounds(route) {
    if (!route || !route.geometry || !route.geometry.coordinates) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    
    route.geometry.coordinates.forEach(coord => {
      bounds.extend(coord);
    });

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 400, right: 100 },
        duration: 1000,
      });
    }
  }
}

// Export as default for ES6 modules
export default MapRouteRenderer;
