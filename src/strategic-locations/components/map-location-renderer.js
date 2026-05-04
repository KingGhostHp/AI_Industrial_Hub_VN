/**
 * MapLocationRenderer Class
 * 
 * Handles rendering of strategic locations on a Mapbox GL JS map.
 * Supports Point, LineString, and Polygon geometries with custom styling.
 * 
 * Requirements validated: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 4.1, 4.2
 */

/**
 * MapLocationRenderer class
 * Renders strategic locations on a Mapbox GL JS map with custom markers and layers
 */
class MapLocationRenderer {
  /**
   * Constructor
   * Initializes the renderer with a Mapbox map instance
   * 
   * @param {mapboxgl.Map} map - The Mapbox GL JS map instance
   */
  constructor(map) {
    if (!map) {
      throw new Error('MapLocationRenderer requires a valid Mapbox map instance');
    }

    /**
     * Mapbox map instance
     * @private
     */
    this.map = map;

    /**
     * Markers for Point geometries
     * Map<locationTypeId, Array<mapboxgl.Marker>>
     * @private
     */
    this.markers = new Map();

    /**
     * Layer IDs for LineString and Polygon geometries
     * Map<locationTypeId, Array<string>>
     * @private
     */
    this.layers = new Map();

    /**
     * Source IDs for Mapbox GL sources
     * Map<locationTypeId, string>
     * @private
     */
    this.sources = new Map();

    /**
     * Visibility state for strategic locations
     * @private
     */
    this.strategicLocationsVisible = true;

    /**
     * Visibility state for industrial zones
     * @private
     */
    this.industrialZonesVisible = true;
  }

  /**
   * Render all strategic locations
   * Renders locations for all provided types
   * 
   * @param {Object} locationsData - GeoJSON FeatureCollection with all locations
   * @param {Array<Object>} types - Array of location type configurations
   */
  renderStrategicLocations(locationsData, types) {
    console.log('Rendering strategic locations...');

    if (!locationsData || !locationsData.features) {
      console.warn('No location data provided');
      return;
    }

    if (!Array.isArray(types) || types.length === 0) {
      console.warn('No location types provided');
      return;
    }

    // Group features by location type
    const featuresByType = new Map();
    
    for (const feature of locationsData.features) {
      const typeId = feature.properties?.locationType;
      if (!typeId) {
        console.warn('Feature missing locationType property:', feature);
        continue;
      }

      if (!featuresByType.has(typeId)) {
        featuresByType.set(typeId, []);
      }
      featuresByType.get(typeId).push(feature);
    }

    // Render each location type
    for (const type of types) {
      const features = featuresByType.get(type.id) || [];
      if (features.length > 0) {
        const typeData = {
          type: 'FeatureCollection',
          features: features
        };
        this.renderLocationType(type.id, typeData, type);
      }
    }

    // Setup zoom listener for dynamic sizing (only once)
    if (!this._zoomListenerSetup) {
      this.setupZoomListener();
      this._zoomListenerSetup = true;
    }
    
    // Initial marker size update
    this.updateStrategicMarkerVisibility();

    console.log('✓ Strategic locations rendered');
  }

  /**
   * Render a specific location type
   * Chooses rendering strategy based on geometry type
   * 
   * @param {string} typeId - The location type ID
   * @param {Object} locationsData - GeoJSON FeatureCollection for this type
   * @param {Object} type - Location type configuration
   */
  renderLocationType(typeId, locationsData, type) {
    if (!locationsData || !locationsData.features || locationsData.features.length === 0) {
      console.log(`No features to render for type: ${typeId}`);
      return;
    }

    console.log(`Rendering ${locationsData.features.length} ${type.name} locations...`);

    try {
      // Choose rendering strategy based on geometry type
      switch (type.geometryType) {
        case 'Point':
          this._renderPointGeometries(typeId, locationsData, type);
          break;
        case 'LineString':
          this._renderLineStringGeometries(typeId, locationsData, type);
          break;
        case 'Polygon':
          this._renderPolygonGeometries(typeId, locationsData, type);
          break;
        default:
          console.warn(`Unknown geometry type: ${type.geometryType}`);
      }
    } catch (error) {
      console.error(`Error rendering location type ${typeId}:`, error);
    }
  }

  /**
   * Render Point geometries as custom markers
   * Creates Mapbox markers with Lucide icons using batch processing
   * 
   * @private
   * @param {string} typeId - The location type ID
   * @param {Object} locationsData - GeoJSON FeatureCollection
   * @param {Object} type - Location type configuration
   */
  _renderPointGeometries(typeId, locationsData, type) {
    const markers = [];
    const features = locationsData.features;
    
    console.log(`🎯 Creating markers for ${features.length} ${type.name} locations...`);

    // TẠO MARKERS THEO BATCH để không block UI
    const BATCH_SIZE = 50; // Tạo 50 markers mỗi lần
    let currentBatch = 0;
    
    const createMarkerBatch = () => {
      const start = currentBatch * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, features.length);
      
      for (let i = start; i < end; i++) {
        const feature = features[i];
        try {
          const marker = this._createMarker(feature, type);
          if (marker) {
            marker.addTo(this.map);
            markers.push(marker);
          }
        } catch (error) {
          console.error(`Error creating marker for feature:`, error, feature);
        }
      }
      
      currentBatch++;
      
      // Nếu còn markers chưa tạo, tiếp tục batch tiếp theo
      if (end < features.length) {
        // Sử dụng setTimeout để không block UI
        setTimeout(createMarkerBatch, 0);
      } else {
        console.log(`✅ Created ${markers.length} markers for ${type.name} in ${currentBatch} batches`);
        
        // Initialize Lucide icons sau khi tạo xong tất cả markers
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      }
    };
    
    // Bắt đầu tạo markers
    createMarkerBatch();

    // Store markers for this type
    this.markers.set(typeId, markers);
  }

  /**
   * Render LineString geometries as Mapbox layers
   * Creates line layers with custom styling
   * 
   * @private
   * @param {string} typeId - The location type ID
   * @param {Object} locationsData - GeoJSON FeatureCollection
   * @param {Object} type - Location type configuration
   */
  _renderLineStringGeometries(typeId, locationsData, type) {
    const sourceId = `${typeId}-source`;
    const layerId = `${typeId}-layer`;

    // Add source if it doesn't exist
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: locationsData
      });
      this.sources.set(typeId, sourceId);
    } else {
      // Update existing source
      this.map.getSource(sourceId).setData(locationsData);
    }

    // Add layer if it doesn't exist
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': type.color,
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      // Store layer ID
      if (!this.layers.has(typeId)) {
        this.layers.set(typeId, []);
      }
      this.layers.get(typeId).push(layerId);

      // Add click handler for popup
      this._addLayerClickHandler(layerId, type);
    }

    console.log(`✓ Created line layer for ${type.name}`);
  }

  /**
   * Render Polygon geometries as Mapbox layers
   * Creates fill and outline layers
   * 
   * @private
   * @param {string} typeId - The location type ID
   * @param {Object} locationsData - GeoJSON FeatureCollection
   * @param {Object} type - Location type configuration
   */
  _renderPolygonGeometries(typeId, locationsData, type) {
    const sourceId = `${typeId}-source`;
    const fillLayerId = `${typeId}-fill`;
    const outlineLayerId = `${typeId}-outline`;

    // Add source if it doesn't exist
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: locationsData
      });
      this.sources.set(typeId, sourceId);
    } else {
      // Update existing source
      this.map.getSource(sourceId).setData(locationsData);
    }

    // Add fill layer if it doesn't exist
    if (!this.map.getLayer(fillLayerId)) {
      this.map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': type.color,
          'fill-opacity': 0.2
        }
      });

      // Store layer ID
      if (!this.layers.has(typeId)) {
        this.layers.set(typeId, []);
      }
      this.layers.get(typeId).push(fillLayerId);

      // Add click handler for popup
      this._addLayerClickHandler(fillLayerId, type);
    }

    // Add outline layer if it doesn't exist
    if (!this.map.getLayer(outlineLayerId)) {
      this.map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': type.color,
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      this.layers.get(typeId).push(outlineLayerId);
    }

    console.log(`✓ Created polygon layers for ${type.name}`);
  }

  /**
   * Create a custom marker for a Point feature
   * Creates a marker with Lucide icon and popup - EXACTLY like industrial zones
   * NO CSS classes, all inline styles and JavaScript event handlers
   * 
   * @private
   * @param {Object} feature - GeoJSON Feature
   * @param {Object} type - Location type configuration
   * @returns {mapboxgl.Marker|null} The created marker or null if creation failed
   */
  _createMarker(feature, type) {
    if (!feature.geometry || feature.geometry.type !== 'Point') {
      console.warn('Invalid Point geometry:', feature);
      return null;
    }

    const coordinates = feature.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      console.warn('Invalid coordinates:', coordinates);
      return null;
    }

    const props = feature.properties || {};

    // Create marker element - NO CSS class, all inline like industrial zones
    const el = document.createElement('div');
    // NO className - industrial zones don't use CSS classes
    el.style.width = '36px';
    el.style.height = '36px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#fff';
    el.style.border = `3px solid ${type.color}`;
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    // NO transition - industrial zones don't have transitions
    
    // Add Lucide icon
    el.innerHTML = `<i data-lucide="${type.icon}" style="width: 20px; height: 20px; color: ${type.color};"></i>`;

    // Hover effects via JavaScript (optional - industrial zones don't have this)
    // Commenting out to match industrial zones exactly
    /*
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.1)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });
    */

    // Click event with stopPropagation - EXACTLY like industrial zones
    el.addEventListener('click', (e) => {
      e.stopPropagation(); // Ngăn event lan ra map
      
      // Create popup content
      const name = props['name:vi'] || props.name || props['name:en'] || 
                   props.industrial || props.landuse || props.amenity || 
                   'Unnamed location';
      
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`;
      
      let popupHtml = `
        <div style="font-family: Arial; min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: ${type.color}; font-size: 16px;">${name}</h3>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Loại:</strong> <em>${type.name}</em></p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>🗺️ Tọa độ:</strong> ${coordinates[1].toFixed(6)}°N, ${coordinates[0].toFixed(6)}°E</p>
      `;
      
      // Add additional properties
      if (props['name:en']) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Tên tiếng Anh:</strong> ${props['name:en']}</p>`;
      }
      if (props.iata) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Mã IATA:</strong> ${props.iata}</p>`;
      }
      if (props.icao) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Mã ICAO:</strong> ${props.icao}</p>`;
      }
      if (props.operator) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Đơn vị vận hành:</strong> ${props.operator}</p>`;
      }
      if (props.website) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Website:</strong> <a href="${props.website}" target="_blank" rel="noopener" style="color: #0066cc;">${props.website}</a></p>`;
      }
      
      popupHtml += `
          <a href="${googleUrl}" target="_blank" rel="noopener" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">📍 Google Maps</a>
        </div>
      `;
      
      // Create and show popup
      const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: '350px' })
        .setLngLat(coordinates)
        .setHTML(popupHtml)
        .addTo(this.map);
    });

    // Create marker - EXACTLY like industrial zones
    const marker = new mapboxgl.Marker(el)
      .setLngLat(coordinates);
      // Note: .addTo(map) is called in batch processing

    return marker;
  }

  /**
   * Add click handler to a layer for showing popups
   * 
   * @private
   * @param {string} layerId - The layer ID
   * @param {Object} type - Location type configuration
   */
  _addLayerClickHandler(layerId, type) {
    // Change cursor on hover
    this.map.on('mouseenter', layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = '';
    });

    // Show popup on click
    this.map.on('click', layerId, (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties || {};
      const coords = e.lngLat;
      
      // Get display name
      const name = props['name:vi'] || props.name || props['name:en'] || 
                   props.industrial || props.landuse || props.amenity || 
                   'Unnamed location';
      
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
      
      let popupHtml = `
        <div style="font-family: Arial; min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: ${type.color}; font-size: 16px;">${name}</h3>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Loại:</strong> <em>${type.name}</em></p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>🗺️ Tọa độ:</strong> ${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E</p>
      `;
      
      // Add additional properties
      if (props['name:en']) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Tên tiếng Anh:</strong> ${props['name:en']}</p>`;
      }
      if (props.operator) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Đơn vị vận hành:</strong> ${props.operator}</p>`;
      }
      if (props.website) {
        popupHtml += `<p style="margin: 5px 0; font-size: 12px;"><strong>Website:</strong> <a href="${props.website}" target="_blank" rel="noopener" style="color: #0066cc;">${props.website}</a></p>`;
      }
      
      popupHtml += `
          <a href="${googleUrl}" target="_blank" rel="noopener" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">📍 Google Maps</a>
        </div>
      `;

      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(popupHtml)
        .addTo(this.map);
    });
  }

  /**
   * Clear all strategic location markers and layers
   * Removes all rendered locations from the map
   */
  clearStrategicLocations() {
    console.log('Clearing strategic locations...');

    // Remove all markers
    for (const [typeId, markers] of this.markers.entries()) {
      for (const marker of markers) {
        marker.remove();
      }
    }
    this.markers.clear();

    // Remove all layers
    for (const [typeId, layerIds] of this.layers.entries()) {
      for (const layerId of layerIds) {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      }
    }
    this.layers.clear();

    // Remove all sources
    for (const [typeId, sourceId] of this.sources.entries()) {
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    }
    this.sources.clear();

    console.log('✓ Strategic locations cleared');
  }

  /**
   * Toggle visibility of strategic locations
   * Shows or hides all strategic location markers and layers
   * 
   * @param {boolean} visible - True to show, false to hide
   */
  toggleStrategicLocations(visible) {
    this.strategicLocationsVisible = visible;

    console.log(`${visible ? 'Showing' : 'Hiding'} strategic locations...`);

    // Toggle markers
    for (const [typeId, markers] of this.markers.entries()) {
      for (const marker of markers) {
        const el = marker.getElement();
        if (el) {
          el.style.display = visible ? 'flex' : 'none'; // Use 'flex' instead of 'block' for proper centering
        }
      }
    }

    // Toggle layers
    for (const [typeId, layerIds] of this.layers.entries()) {
      for (const layerId of layerIds) {
        if (this.map.getLayer(layerId)) {
          this.map.setLayoutProperty(
            layerId,
            'visibility',
            visible ? 'visible' : 'none'
          );
        }
      }
    }

    // Re-initialize Lucide icons when showing markers
    if (visible && typeof lucide !== 'undefined' && lucide.createIcons) {
      // Use setTimeout to ensure DOM is updated before initializing icons
      setTimeout(() => {
        lucide.createIcons();
        console.log('✓ Lucide icons re-initialized');
      }, 0);
    }
    
    // Update marker sizes based on current zoom
    if (visible) {
      this.updateStrategicMarkerVisibility();
    }

    console.log(`✓ Strategic locations ${visible ? 'shown' : 'hidden'}`);
  }

  /**
   * Update strategic marker visibility and size based on zoom level
   * Dynamically adjusts marker size as user zooms in/out
   */
  updateStrategicMarkerVisibility() {
    const currentZoom = this.map.getZoom();
    
    // Check if layer is visible
    const isLayerVisible = this.strategicLocationsVisible;
    
    // If layer is off, hide all markers
    if (!isLayerVisible) {
      for (const [typeId, markers] of this.markers.entries()) {
        for (const marker of markers) {
          const el = marker.getElement();
          if (el) {
            el.style.display = 'none';
          }
        }
      }
      return;
    }
    
    // Calculate marker size based on zoom - same as industrial zones
    let markerSize, iconSize;
    if (currentZoom < 8) {
      markerSize = 24;
      iconSize = 14;
    } else if (currentZoom < 10) {
      markerSize = 32;
      iconSize = 18;
    } else {
      markerSize = 40;
      iconSize = 22;
    }
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      for (const [typeId, markers] of this.markers.entries()) {
        for (const marker of markers) {
          const el = marker.getElement();
          if (el) {
            // Always show strategic locations (no LOD filtering like industrial zones)
            const currentWidth = el.style.width;
            const newWidth = `${markerSize}px`;
            
            // Only update if size changed
            if (currentWidth !== newWidth) {
              el.style.width = newWidth;
              el.style.height = newWidth;
              
              // Update icon size inside
              const icon = el.querySelector('i[data-lucide]');
              if (icon) {
                icon.style.width = `${iconSize}px`;
                icon.style.height = `${iconSize}px`;
              }
              
              // Update border width proportionally
              const borderWidth = markerSize < 32 ? 2 : 3;
              el.style.borderWidth = `${borderWidth}px`;
            }
            
            // Ensure marker is visible
            if (el.style.display !== 'flex') {
              el.style.display = 'flex';
            }
          }
        }
      }
    });
  }

  /**
   * Setup zoom listener for dynamic marker sizing
   * Call this after rendering markers
   */
  setupZoomListener() {
    let zoomTimeout = null;
    
    this.map.on('zoom', () => {
      // Debounce to avoid too many updates
      clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        this.updateStrategicMarkerVisibility();
      }, 200);
    });
    
    console.log('✓ Zoom listener setup for strategic locations');
  }

  /**
   * Toggle visibility of industrial zones
   * Shows or hides industrial zone markers
   * 
   * Note: This method assumes industrial zones are rendered as markers
   * with a specific class or data attribute. Implementation may need
   * to be adjusted based on how industrial zones are actually rendered.
   * 
   * @param {boolean} visible - True to show, false to hide
   */
  toggleIndustrialZones(visible) {
    this.industrialZonesVisible = visible;

    console.log(`${visible ? 'Showing' : 'Hiding'} industrial zones...`);

    // Toggle industrial zone layers if they exist
    const industrialLayerIds = [
      'industrial-zones-layer',
      'industrial-zones-fill',
      'industrial-zones-outline',
      'industrial-zones-points'
    ];

    for (const layerId of industrialLayerIds) {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        );
      }
    }

    // Toggle industrial zone markers if they exist
    // This assumes markers have a specific class or data attribute
    const industrialMarkers = document.querySelectorAll('.industrial-zone-marker');
    for (const marker of industrialMarkers) {
      marker.style.display = visible ? 'block' : 'none';
    }

    console.log(`✓ Industrial zones ${visible ? 'shown' : 'hidden'}`);
  }

  /**
   * Get visibility state of strategic locations
   * 
   * @returns {boolean} True if visible, false if hidden
   */
  isStrategicLocationsVisible() {
    return this.strategicLocationsVisible;
  }

  /**
   * Get visibility state of industrial zones
   * 
   * @returns {boolean} True if visible, false if hidden
   */
  isIndustrialZonesVisible() {
    return this.industrialZonesVisible;
  }

  /**
   * Get count of rendered markers
   * 
   * @returns {number} Total number of markers
   */
  getMarkerCount() {
    let count = 0;
    for (const markers of this.markers.values()) {
      count += markers.length;
    }
    return count;
  }

  /**
   * Get count of rendered layers
   * 
   * @returns {number} Total number of layers
   */
  getLayerCount() {
    let count = 0;
    for (const layerIds of this.layers.values()) {
      count += layerIds.length;
    }
    return count;
  }

  /**
   * Highlight a specific location
   * Zooms to the location and shows its popup
   * 
   * @param {Object} feature - GeoJSON Feature to highlight
   * @param {Object} type - Location type configuration
   */
  highlightLocation(feature, type) {
    if (!feature || !feature.geometry) {
      console.warn('Invalid feature for highlighting');
      return;
    }

    // Get coordinates based on geometry type
    let coordinates;
    if (feature.geometry.type === 'Point') {
      coordinates = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'LineString') {
      // Use first coordinate of line
      coordinates = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'Polygon') {
      // Use first coordinate of first ring
      coordinates = feature.geometry.coordinates[0][0];
    } else {
      console.warn('Unsupported geometry type for highlighting:', feature.geometry.type);
      return;
    }

    // Zoom to location
    this.map.flyTo({
      center: coordinates,
      zoom: 14,
      duration: 1000
    });

    // Show popup after zoom
    setTimeout(() => {
      const props = feature.properties || {};
      const name = props['name:vi'] || props.name || props['name:en'] || 
                   props.industrial || props.landuse || props.amenity || 
                   'Unnamed location';
      
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`;
      
      let popupHtml = `
        <div style="font-family: Arial; min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: ${type.color}; font-size: 16px;">${name}</h3>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Loại:</strong> <em>${type.name}</em></p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>🗺️ Tọa độ:</strong> ${coordinates[1].toFixed(6)}°N, ${coordinates[0].toFixed(6)}°E</p>
          <a href="${googleUrl}" target="_blank" rel="noopener" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">📍 Google Maps</a>
        </div>
      `;
      
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupHtml)
        .addTo(this.map);
    }, 1000);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { MapLocationRenderer };
}

// ES6 module export for browser
export default MapLocationRenderer;
