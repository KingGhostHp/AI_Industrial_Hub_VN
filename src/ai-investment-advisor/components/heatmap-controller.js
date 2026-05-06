/**
 * Heatmap Controller Component
 * 
 * Manages heatmap layers on Mapbox GL JS for various industrial metrics.
 * Supports rental price, development trend, saturation index, logistics cost, and growth potential.
 * 
 * Requirements: 6.5, 6.6, 6.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 20.3, 20.5
 */

export class HeatmapController {
  /**
   * Initialize heatmap controller
   * @param {Object} mapInstance - Mapbox GL JS map instance
   */
  constructor(mapInstance) {
    this.map = mapInstance;
    this.activeMetric = null;
    this.opacity = 0.7;
    this.isVisible = false;
    
    // Layer and source IDs
    this.layerId = 'ai-heatmap-layer';
    this.outlineLayerId = 'ai-heatmap-outline-layer';
    this.sourceId = 'vn-provinces'; // Existing province source
    
    // Metric color gradients (7-step)
    this.gradients = {
      price: [
        0, '#10B981',   // Low price (Green)
        25, '#34D399',
        50, '#F59E0B',  // Mid price (Yellow/Orange)
        75, '#F87171',
        100, '#EF4444'  // High price (Red)
      ],
      growth: [
        0, '#EF4444',   // Low growth (Red)
        25, '#F87171',
        50, '#F59E0B',  // Mid growth (Yellow/Orange)
        75, '#34D399',
        100, '#10B981'  // High growth (Green)
      ],
      saturation: [
        0, '#10B981',   // Low saturation (Green)
        25, '#34D399',
        50, '#F59E0B',  // Mid saturation (Yellow/Orange)
        75, '#F87171',
        100, '#EF4444'  // High saturation (Red)
      ],
      logistics: [
        0, '#10B981',   // Low cost (Green)
        25, '#34D399',
        50, '#F59E0B',  // Mid cost (Yellow/Orange)
        75, '#F87171',
        100, '#EF4444'  // High cost (Red)
      ]
    };
  }

  /**
   * Render heatmap layer for a specific metric
   * @param {string} metric - 'price', 'growth', 'saturation', 'logistics'
   * @param {number} [opacity=0.7] - Layer opacity (0.3 to 1.0)
   */
  renderHeatmap(metric, opacity = 0.7) {
    if (!this.map || !this.map.isStyleLoaded()) return;
    
    this.activeMetric = metric;
    this.opacity = opacity;
    this.isVisible = true;

    // Remove existing heatmap layers if any
    this._removeLayers();

    // Mapbox property name based on metric
    // In a real implementation, these would be properties in the GeoJSON
    // For now, we use existing province classification or mock properties
    const propertyName = this._getMetricPropertyName(metric);

    // Add fill layer
    this.map.addLayer({
      id: this.layerId,
      type: 'fill',
      source: this.sourceId,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', propertyName],
          ...this.gradients[metric] || this.gradients.price
        ],
        'fill-opacity': opacity
      }
    }, 'vn-provinces-outline'); // Insert below province outlines

    // Add outline layer for clarity
    this.map.addLayer({
      id: this.outlineLayerId,
      type: 'line',
      source: this.sourceId,
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 1,
        'line-opacity': 0.5
      }
    }, 'vn-provinces-label');
  }

  /**
   * Toggle heatmap visibility
   * @param {boolean} visible 
   */
  toggle(visible) {
    this.isVisible = visible;
    const visibility = visible ? 'visible' : 'none';
    
    if (this.map.getLayer(this.layerId)) {
      this.map.setLayoutProperty(this.layerId, 'visibility', visibility);
    }
    
    if (this.map.getLayer(this.outlineLayerId)) {
      this.map.setLayoutProperty(this.outlineLayerId, 'visibility', visibility);
    }
  }

  /**
   * Update layer opacity
   * @param {number} opacity - 0.3 to 1.0
   */
  setOpacity(opacity) {
    this.opacity = opacity;
    if (this.map.getLayer(this.layerId)) {
      this.map.setPaintProperty(this.layerId, 'fill-opacity', opacity);
    }
  }

  /**
   * Remove heatmap layers from map
   */
  _removeLayers() {
    if (this.map.getLayer(this.layerId)) {
      this.map.removeLayer(this.layerId);
    }
    if (this.map.getLayer(this.outlineLayerId)) {
      this.map.removeLayer(this.outlineLayerId);
    }
  }

  /**
   * Get Mapbox property name for the given metric
   * @param {string} metric 
   * @returns {string}
   */
  _getMetricPropertyName(metric) {
    // These should match the properties provided by DataManager/PredictionEngine
    const mapping = {
      price: 'avg_rental_price',
      growth: 'growth_potential_score',
      saturation: 'saturation_index',
      logistics: 'avg_logistics_cost'
    };
    return mapping[metric] || 'score';
  }

  /**
   * Show legend for the active metric
   */
  renderLegend() {
    // Implementation for legend UI
    // Similar to existing createProvinceLegend but for heatmap
  }
}
