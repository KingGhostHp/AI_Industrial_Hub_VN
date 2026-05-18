/**
 * Heatmap Controller Component — Paint-Property Strategy
 *
 * Thay vì thêm/xóa layer mới, component này cập nhật trực tiếp `fill-color`
 * của layer `vn-provinces-fill` có sẵn theo metric được chọn.
 *
 * Ưu điểm:
 * - Không lag khi bật/tắt (không thêm/xóa layer)
 * - Không xung đột với layer mức độ phát triển
 * - Dữ liệu được tính 1 lần khi khởi tạo, switch tức thì
 *
 * Requirements: 6.5, 6.6, 6.7, 8.1–8.7, 20.3, 20.5
 */

export class HeatmapController {
  /**
   * @param {Object} mapInstance - Mapbox GL JS map instance
   */
  constructor(mapInstance) {
    this.map = mapInstance;
    this.activeMetric = null;

    // The existing layer we'll repaint (not a new layer)
    this.fillLayerId = 'vn-provinces-fill';

    // Stored enriched data keyed by province display_name
    // { 'Hà Nội': { avg_rental_price: 90, growth_potential_score: 78, ... }, ... }
    this._enrichedData = {};
    this._dataReady = false;

    // Original fill-color expression (development level gradient) — restored on deactivate
    this._originalColorExpr = ['coalesce', ['get', 'color'], '#9b59b6'];
    this._originalOpacity = 0.6;

    // Color stops for each metric [value, color, ...]
    // Values are normalised 0-100
    this._stops = {
      price: [
        [0,   '#1a9641'],
        [20,  '#a6d96a'],
        [40,  '#ffffbf'],
        [60,  '#fdae61'],
        [80,  '#d7191c'],
        [100, '#a50026'],
      ],
      growth: [
        [0,   '#d7191c'],
        [20,  '#fdae61'],
        [40,  '#ffffbf'],
        [60,  '#a6d96a'],
        [80,  '#1a9641'],
        [100, '#006837'],
      ],
      saturation: [
        [0,   '#1a9641'],
        [20,  '#a6d96a'],
        [40,  '#ffffbf'],
        [60,  '#fdae61'],
        [80,  '#d7191c'],
        [100, '#a50026'],
      ],
      logistics: [
        [0,   '#1a9641'],
        [20,  '#a6d96a'],
        [40,  '#ffffbf'],
        [60,  '#fdae61'],
        [80,  '#d7191c'],
        [100, '#a50026'],
      ],
    };

    // Property name stored in GeoJSON per metric
    this._propNames = {
      price:      'hm_price',
      growth:     'hm_growth',
      saturation: 'hm_saturation',
      logistics:  'hm_logistics',
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Store enriched metric data for all provinces.
   * Called once by AnalyticsDashboard after initial computation.
   * @param {Object} dataByProvince  { 'Hà Nội': { avgPrice, growthScore, saturationIndex, logisticsScore }, ... }
   */
  setEnrichedData(dataByProvince) {
    this._enrichedData = dataByProvince || {};
    this._dataReady = Object.keys(this._enrichedData).length > 0;
    console.log(`[HeatmapController] Enriched data stored for ${Object.keys(this._enrichedData).length} provinces`);

    // Push values into the live GeoJSON source so expressions can read them
    this._patchSource();
  }

  /**
   * Activate a metric heatmap. Switches instantly via setPaintProperty.
   * @param {'price'|'growth'|'saturation'|'logistics'} metric
   */
  activate(metric) {
    if (!this._layerExists()) return;
    if (!this._dataReady) {
      console.warn('[HeatmapController] Data not ready yet — call setEnrichedData first');
      return;
    }

    this.activeMetric = metric;

    const prop = this._propNames[metric];
    const stops = this._stops[metric];

    // Build a match/step expression from the stored property
    const colorExpr = this._buildInterpolateExpr(prop, stops);

    this.map.setPaintProperty(this.fillLayerId, 'fill-color', colorExpr);
    this.map.setPaintProperty(this.fillLayerId, 'fill-opacity', 0.82);

    console.log(`[HeatmapController] Activated heatmap: ${metric}`);
  }

  /**
   * Deactivate heatmap — restore original development-level colours.
   */
  deactivate() {
    if (!this._layerExists()) return;

    this.activeMetric = null;
    this.map.setPaintProperty(this.fillLayerId, 'fill-color', this._originalColorExpr);
    this.map.setPaintProperty(this.fillLayerId, 'fill-opacity', this._originalOpacity);

    console.log('[HeatmapController] Deactivated — restored original colours');
  }

  /**
   * Legacy alias used by AnalyticsDashboard._toggleHeatmap
   */
  toggle(visible) {
    if (!visible) this.deactivate();
  }

  /**
   * Legacy alias — no-op, kept for API compatibility.
   * The new flow uses activate() after setEnrichedData().
   */
  async renderHeatmap(metric) {
    this.activate(metric);
  }

  /**
   * Legacy alias — no-op, the new flow patches source directly.
   */
  async updateSourceData() {
    // intentionally left empty — data is patched via setEnrichedData → _patchSource
  }

  destroy() {
    this.deactivate();
    this.map = null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  _layerExists() {
    return this.map && this.map.getLayer(this.fillLayerId);
  }

  /**
   * Write hm_* properties into every feature in the live GeoJSON source
   * so that Mapbox expressions can read them.
   */
  _patchSource() {
    if (!window.provinceGeojson) {
      console.warn('[HeatmapController] provinceGeojson not on window yet — will retry');
      setTimeout(() => this._patchSource(), 800);
      return;
    }

    const normalize = window.normalizeProvinceName || (s => s);

    const patched = {
      ...window.provinceGeojson,
      features: window.provinceGeojson.features.map(f => {
        const rawName = f.properties.ten_tinh || f.properties.name || f.properties.display_name || '';
        const name = normalize(rawName);
        const stats = this._enrichedData[name] || {};

        // Normalise price to 0-100 (treat 200 USD/m² as max)
        const priceNorm  = Math.min(100, ((stats.avgPrice || 0) / 200) * 100);
        const growth     = Math.min(100, Math.max(0, stats.growthScore || 50));
        const saturation = Math.min(100, Math.max(0, stats.saturationIndex || 0));
        const logistics  = Math.min(100, Math.max(0, 100 - (stats.logisticsScore || 50)));

        return {
          ...f,
          properties: {
            ...f.properties,
            hm_price:      Math.round(priceNorm),
            hm_growth:     Math.round(growth),
            hm_saturation: Math.round(saturation),
            hm_logistics:  Math.round(logistics),
          }
        };
      })
    };

    // Update both the global reference and the live Mapbox source
    window.provinceGeojson = patched;

    const source = this.map && this.map.getSource('vn-provinces');
    if (source) {
      source.setData(patched);
      console.log('[HeatmapController] Live source patched with hm_* properties');
    }
  }

  /**
   * Build a Mapbox GL interpolate expression.
   * @param {string} prop - GeoJSON property name
   * @param {Array}  stops - [[value, color], ...]
   */
  _buildInterpolateExpr(prop, stops) {
    const flat = stops.flatMap(([v, c]) => [v, c]);
    return [
      'interpolate', ['linear'],
      ['coalesce', ['get', prop], 0],
      ...flat
    ];
  }
}
