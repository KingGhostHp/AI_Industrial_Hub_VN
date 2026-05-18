/**
 * Analytics Dashboard Component
 * 
 * Provides visual insights into industrial zone trends, forecasts, and statistics.
 * Includes development trends, density analysis, price forecasts, and heatmap controls.
 * 
 * Requirements: 5.1, 5.3, 5.4, 5.6, 7.3, 7.6, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */

export class AnalyticsDashboard {
  /**
   * Initialize dashboard
   * @param {string} containerId - ID of the container element
   * @param {Object} options - Services and configuration
   * @param {Object} options.dataManager - Data manager service
   * @param {Object} options.predictionEngine - Prediction engine service
   * @param {Object} options.heatmapController - Heatmap controller service
   * @param {Object} options.exportGenerator - Export generator service
   * @param {Object} options.logisticsCalculator - Logistics calculator service
   */
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.dataManager = options.dataManager;
    this.predictionEngine = options.predictionEngine;
    this.heatmapController = options.heatmapController;
    this.exportGenerator = options.exportGenerator;
    this.logisticsCalculator = options.logisticsCalculator;
    this.onClose = options.onClose;
    
    this.isVisible = false;
    this.currentProvince = 'all';
    this.forecastHorizon = 1; // Default 1 year
    this._heatmapDataReady = false; // Flag: enrichment computed at least once
    
    // Vietnamese translations (default)
    this.translations = {
      vi: {
        title: 'Bảng Điều Khiển Phân Tích',
        dev_trends: 'Xu Hướng Phát Triển',
        density_analysis: 'Phân Tích Mật Độ',
        price_forecasts: 'Dự Báo Giá Thuê',
        heatmaps: 'Bản Đồ Nhiệt',
        all_provinces: 'Tất cả tỉnh thành',
        select_province: 'Chọn tỉnh thành',
        forecast_years: 'Số năm dự báo',
        summary_stats: 'Thống Kê Tổng Quan',
        zone_count: 'Số lượng KCN/CCN',
        avg_price: 'Giá thuê TB',
        occupancy: 'Tỷ lệ lấp đầy',
        growth_potential: 'Tiềm năng tăng trưởng',
        saturation: 'Độ bão hòa công nghiệp',
        high: 'Mức độ cao',
        moderate: 'Mức độ trung bình',
        low: 'Mức độ thấp',
        close: 'Đóng',
        fullscreen: 'Toàn màn hình',
        export: 'Xuất báo cáo',
        year: 'Năm',
        price_unit: 'USD/m²'
      },
      en: {
        title: 'Analytics Dashboard',
        dev_trends: 'Development Trends',
        density_analysis: 'Density Analysis',
        price_forecasts: 'Price Forecasts',
        heatmaps: 'Heatmaps',
        all_provinces: 'All Provinces',
        select_province: 'Select Province',
        forecast_years: 'Forecast Years',
        summary_stats: 'Summary Statistics',
        zone_count: 'Zone Count',
        avg_price: 'Avg Rental Price',
        occupancy: 'Occupancy Rate',
        growth_potential: 'Growth Potential',
        saturation: 'Saturation',
        high: 'High',
        moderate: 'Moderate',
        low: 'Low',
        close: 'Close',
        fullscreen: 'Fullscreen',
        export: 'Export Report',
        year: 'Year',
        price_unit: 'USD/m²'
      }
    };
    
    this.language = 'vi';
  }


  /**
   * Get translated text
   * @param {string} key - Translation key
   * @returns {string}
   */
  t(key) {
    return this.translations[this.language][key] || key;
  }

  /**
   * Render the dashboard
   */
  render() {
    const dashboard = document.createElement('div');
    dashboard.className = 'analytics-dashboard';
    dashboard.id = 'analytics-dashboard';
    
    dashboard.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <div class="header-left">
            <h2 class="dashboard-title">${this.t('title')}</h2>
            <div class="dashboard-filters">
              <select id="province-filter" class="dashboard-select">
                <option value="all">${this.t('all_provinces')}</option>
                ${this._getProvinceOptions()}
              </select>
              <select id="forecast-horizon" class="dashboard-select">
                <option value="1">1 ${this.t('year')}</option>
                <option value="2">2 ${this.t('year')}s</option>
              </select>
            </div>
          </div>
          <div class="header-right">
            <button class="icon-btn" id="dashboard-export" title="${this.t('export')}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
            <button class="icon-btn" id="dashboard-fullscreen" title="${this.t('fullscreen')}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
            <button class="icon-btn" id="dashboard-close" title="${this.t('close')}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="dashboard-body">
          <!-- Summary Statistics -->
          <div class="dashboard-section summary-stats">
            <h3 class="section-title">${this.t('summary_stats')}</h3>
            <div class="stats-grid" id="summary-stats-grid">
              ${this._renderSummaryStats()}
            </div>
          </div>
          
          <div class="dashboard-grid">
            <!-- Development Trends -->
            <div class="dashboard-section trends-section">
              <h3 class="section-title">${this.t('dev_trends')}</h3>
              <div class="chart-container" id="trends-chart">
                ${this._renderTrendsPlaceholder()}
              </div>
            </div>
            
            <!-- Price Forecasts -->
            <div class="dashboard-section price-section">
              <h3 class="section-title">${this.t('price_forecasts')}</h3>
              <div class="chart-container" id="price-chart">
                ${this._renderPricePlaceholder()}
              </div>
            </div>
            
            <!-- Density & Saturation -->
            <div class="dashboard-section saturation-section">
              <h3 class="section-title">${this.t('saturation')}</h3>
              <div class="chart-container" id="saturation-chart">
                ${this._renderSaturationPlaceholder()}
              </div>
            </div>
            
            <!-- Heatmap Controls (Quick Access) -->
            <div class="dashboard-section heatmap-section">
              <h3 class="section-title">${this.t('heatmaps')}</h3>
              <div class="heatmap-quick-controls">
                ${this._renderHeatmapControls()}
              </div>
              <div id="heatmap-legend" class="heatmap-legend" style="display:none;">
                <div class="legend-gradient" id="legend-gradient-bar"></div>
                <div class="legend-labels">
                  <span id="legend-label-low">Thấp</span>
                  <span id="legend-label-mid">Trung bình</span>
                  <span id="legend-label-high">Cao</span>
                </div>
                <div class="legend-title" id="legend-title-text"></div>
              </div>
              <div id="heatmap-loading" class="heatmap-loading" style="display:none;">⏳ Đang tính toán dữ liệu...</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return dashboard;
  }

  /**
   * Show the dashboard
   */
  show() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const dashboard = this.render();
    container.appendChild(dashboard);
    
    this.isVisible = true;
    this._attachEventListeners();
    
    this.updateData();
  }

  /**
   * Hide the dashboard
   */
  hide() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
      this.isVisible = false;
      
      // Notify orchestrator if callback provided
      if (typeof this.onClose === 'function') {
        this.onClose();
      }
    }
  }

  /**
   * Update dashboard data based on current filters
   */
  async updateData() {
    this._setLoading(true);
    try {
      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const stats = this._calculateStats();
      if (!stats) throw new Error('Failed to retrieve analytics data');
      
      this._updateSummaryStats(stats);
      this._updateCharts(stats);
      
      // Enrich heatmap source with fresh metrics if it was already initialized
      if (this._heatmapDataReady) {
        await this._precomputeHeatmapData();
        // If a metric is active, re-activate it to apply new colors
        if (this.activeHeatmap) {
          this.heatmapController.activate(this.activeHeatmap);
        }
      }
      
      this._setLoading(false);
    } catch (error) {
      console.error('[AnalyticsDashboard] Update error:', error);
      this._setLoading(false);
      this.showNotification(error.message, 'error');
    }
  }

  /**
   * Set loading state UI
   * @private
   */
  _setLoading(isLoading) {
    const dashboard = document.getElementById('analytics-dashboard');
    if (!dashboard) return;
    
    if (isLoading) {
      dashboard.classList.add('loading');
    } else {
      dashboard.classList.remove('loading');
    }
  }

  /**
   * Show notification message
   * @param {string} message 
   * @param {string} type - 'success', 'error', 'info'
   */
  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `dashboard-toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        ${type === 'error' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️')}
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    const container = document.querySelector('.dashboard-container') || document.body;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  /**
   * Attach event listeners to dashboard elements
   */
  _attachEventListeners() {
    const closeBtn = document.getElementById('dashboard-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
    
    const provinceFilter = document.getElementById('province-filter');
    if (provinceFilter) {
      provinceFilter.addEventListener('change', (e) => {
        this.currentProvince = e.target.value;
        this.updateData();
        
        // Programmatic map interaction: Fly to selected province
        this._syncMapToProvince(this.currentProvince);
      });
    }
    
    const horizonFilter = document.getElementById('forecast-horizon');
    if (horizonFilter) {
      horizonFilter.addEventListener('change', (e) => {
        this.forecastHorizon = parseInt(e.target.value);
        this.updateData();
      });
    }
    
    const fullscreenBtn = document.getElementById('dashboard-fullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const dashboard = document.getElementById('analytics-dashboard');
        if (!document.fullscreenElement) {
          dashboard.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      });
    }

    const exportBtn = document.getElementById('dashboard-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this._handleExport());
    }

    // Heatmap control listeners
    const heatmapToggles = document.querySelectorAll('.heatmap-toggle');
    heatmapToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const metric = e.currentTarget.dataset.metric;
        console.log(`[AnalyticsDashboard] Heatmap toggle clicked: ${metric}`);
        this._toggleHeatmap(metric);
      });
    });
  }

  /**
   * Calculate statistics based on current filters
   */
  _calculateStats() {
    if (!this.dataManager) return null;
    
    let zones = this.dataManager.getAllZones();
    
    // Filter by province if selected
    if (this.currentProvince !== 'all') {
      zones = zones.filter(z => {
        let p = z.properties.province || z.properties.tinh || '';
        if (typeof p !== 'string') return false;
        
        // Normalize for comparison using global utility
        const normalizedP = window.normalizeProvinceName ? window.normalizeProvinceName(p) : p.trim();
        return normalizedP === this.currentProvince;
      });
    }
    
    if (zones.length === 0) {
      return {
        zoneCount: 0,
        avgPrice: 0,
        occupancy: 0,
        growthScore: 0,
        saturationIndex: 0,
        trends: []
      };
    }
    
    // Calculate basic stats
    const totalZones = zones.length;
    let totalPrice = 0;
    let pricedZones = 0;
    
    zones.forEach(z => {
      const priceStr = z.properties.price || '';
      const priceMatch = priceStr.match(/(\d+\.?\d*)/);
      if (priceMatch) {
        totalPrice += parseFloat(priceMatch[1]);
        pricedZones++;
      }
    });
    
    const avgPrice = pricedZones > 0 ? (totalPrice / pricedZones) : 0;
    
    // Growth Potential (weighted avg)
    // For now use a simulated but province-aware base
    const baseGrowth = this.currentProvince === 'all' ? 74 : 65 + (Math.random() * 20);
    const baseSaturation = this.currentProvince === 'all' ? 68 : 40 + (Math.random() * 40);
    
    // Simulation of trends for the chart
    const currentYear = 2026;
    const trends = [];
    for (let i = -3; i <= 1; i++) {
      const year = currentYear + i;
      const factor = 1 + (i * 0.05) + (Math.random() * 0.02);
      trends.push({
        year: year,
        count: Math.round(totalZones * factor)
      });
    }

    // Simulation of price trends
    const priceTrends = [];
    const basePrice = avgPrice > 0 ? avgPrice : 85;
    for (let i = -3; i <= 1; i++) {
      const year = currentYear + i;
      const growth = 1 + (i * 0.08) + (Math.random() * 0.03);
      priceTrends.push({
        year: year,
        price: parseFloat((basePrice * growth).toFixed(1))
      });
    }
    
    return {
      zoneCount: totalZones,
      avgPrice: parseFloat(avgPrice.toFixed(1)),
      occupancy: 78 + (Math.random() * 10), // Use numbers here, formatting is in _updateSummaryStats
      growthScore: Math.round(baseGrowth),
      saturationIndex: Math.round(baseSaturation),
      trends: trends,
      priceTrends: priceTrends
    };
  }

  /**
   * Render summary statistics HTML
   */
  _renderSummaryStats(stats = null) {
    const s = stats || { zoneCount: '-', avgPrice: '-', occupancy: '-', growthScore: '-' };
    return `
      <div class="stat-card">
        <span class="stat-label">${this.t('zone_count')}</span>
        <span class="stat-value">${s.zoneCount}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">${this.t('avg_price')}</span>
        <span class="stat-value">${s.avgPrice} <small>${this.t('price_unit')}</small></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">${this.t('occupancy')}</span>
        <span class="stat-value">${typeof s.occupancy === 'number' ? s.occupancy.toFixed(1) : s.occupancy}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">${this.t('growth_potential')}</span>
        <span class="stat-value highlight">${s.growthScore}/100</span>
      </div>
    `;
  }

  /**
   * Update summary stats in DOM
   */
  _updateSummaryStats(stats) {
    const grid = document.getElementById('summary-stats-grid');
    if (grid) grid.innerHTML = this._renderSummaryStats(stats);
  }

  /**
   * Update charts in DOM
   */
  _updateCharts(stats) {
    // Render trend chart
    const trendsContainer = document.getElementById('trends-chart');
    if (trendsContainer) {
      trendsContainer.innerHTML = this._renderTrendsChart(stats.trends);
    }
    
    // Render price chart
    const priceContainer = document.getElementById('price-chart');
    if (priceContainer) {
      priceContainer.innerHTML = this._renderPriceChart(stats.priceTrends);
    }

    // Render saturation chart
    const saturationContainer = document.getElementById('saturation-chart');
    if (saturationContainer) {
      saturationContainer.innerHTML = this._renderSaturationChart(stats.saturationIndex);
    }
  }

  _renderTrendsChart(trends) {
    const max = Math.max(...trends.map(t => t.count)) * 1.2;
    return `
      <div class="bar-chart horizontal">
        ${trends.map(t => `
          <div class="chart-row">
            <span class="chart-label">${t.year}</span>
            <div class="chart-bar-bg">
              <div class="chart-bar" style="width: ${(t.count / max) * 100}%">
                <span class="bar-text">${t.count}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _renderPriceChart(priceTrends) {
    if (!priceTrends || priceTrends.length === 0) return this._renderPricePlaceholder();
    
    const max = Math.max(...priceTrends.map(t => t.price)) * 1.2;
    
    return `
      <div class="line-chart-placeholder">
        <div class="bar-chart horizontal">
          ${priceTrends.map(t => `
            <div class="chart-row">
              <span class="chart-label">${t.year}</span>
              <div class="chart-bar-bg">
                <div class="chart-bar price-bar" style="width: ${(t.price / max) * 100}%">
                  <span class="bar-text">${t.price} USD</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  _renderSaturationChart(index) {
    const color = index >= 80 ? '#EF4444' : (index >= 60 ? '#F59E0B' : '#10B981');
    const status = index >= 80 ? this.t('high') : (index >= 60 ? this.t('moderate') : this.t('low'));
    
    let description = '';
    if (index >= 80) description = 'Quỹ đất hạn chế, cạnh tranh cao';
    else if (index >= 60) description = 'Phát triển ổn định, cân bằng';
    else description = 'Còn nhiều quỹ đất, tiềm năng lớn';

    return `
      <div class="gauge-container">
        <div class="gauge-ring">
          <div class="gauge-fill" style="width: ${index}%; background-color: ${color}"></div>
        </div>
        <div class="gauge-labels">
          <span>0</span>
          <span class="gauge-value">${index}%</span>
          <span>100</span>
        </div>
        <div class="gauge-status" style="color: ${color}; font-weight: 700; margin-top: 8px;">
          ${status}
        </div>
        <p class="gauge-description" style="font-size: 12px; opacity: 0.8; margin-top: 4px;">
          ${description}
        </p>
      </div>
    `;
  }

  _renderHeatmapControls() {
    const metrics = [
      { id: 'price',      label: 'Giá thuê',         icon: '💰' },
      { id: 'growth',     label: 'Tăng trưởng',      icon: '📈' },
      { id: 'saturation', label: 'Bão hòa',           icon: '🏗️' },
      { id: 'logistics',  label: 'Chi phí Logistics', icon: '🚛' }
    ];
    
    return metrics.map(m => `
      <button class="heatmap-toggle" data-metric="${m.id}" title="Bật/tắt bản đồ màu ${m.label}">
        <span class="metric-icon">${m.icon}</span>
        <span class="metric-label">${m.label}</span>
      </button>
    `).join('');
  }

  _getProvinceOptions() {
    if (!this.dataManager) return '';
    
    // Source of truth: Strategic locations (city centers)
    // This file (34-tinh-thanh-trung-tam.geojson) actually contains all 63 provinces/cities
    const cityCenters = this.dataManager.getStrategicLocationsByType('city_center');
    let provinceNames = [];
    
    if (cityCenters && cityCenters.features && cityCenters.features.length > 0) {
      provinceNames = cityCenters.features
        .map(f => f.properties.name)
        .filter(name => name && typeof name === 'string' && name.length > 1);
    } else {
      // Fallback: extract from industrial zones but with very strict cleaning
      const zones = this.dataManager.getAllZones();
      const provinceSet = new Set();
      
      const excludeKeywords = ['xã', 'huyện', 'thôn', 'ấp', 'khu', 'cụm', 'đội', 'khối', 'đường', 'phố'];
      
      zones.forEach(z => {
        let p = z.properties.province || z.properties.tinh;
        if (p && typeof p === 'string') {
          // Clean up common data issues using global utility
          p = window.normalizeProvinceName ? window.normalizeProvinceName(p) : p.trim().replace(/\.$/, '');
          
          // Check if it looks like a valid province (not a code, not too short, not containing sub-admin keywords)
          const lowerP = p.toLowerCase();
          const isGarbage = excludeKeywords.some(kw => lowerP.includes(kw)) || 
                           /^\d+$/.test(p) || 
                           p.length < 3;
          
          if (!isGarbage) {
            provinceSet.add(p);
          }
        }
      });
      provinceNames = Array.from(provinceSet);
    }
    
    // Final unique list, sorted alphabetically (Vietnamese aware)
    const uniqueProvinces = [...new Set(provinceNames)].sort((a, b) => a.localeCompare(b, 'vi'));
    
    return uniqueProvinces.map(p => `<option value="${p}" ${p === this.currentProvince ? 'selected' : ''}>${p}</option>`).join('');
  }

  _renderTrendsPlaceholder() { return '<div class="loading-placeholder"></div>'; }
  _renderPricePlaceholder() { return '<div class="loading-placeholder"></div>'; }
  _renderSaturationPlaceholder() { return '<div class="loading-placeholder"></div>'; }

  _toggleHeatmap(metric) {
    if (!this.heatmapController) return;

    const isActive = this.activeHeatmap === metric;

    if (isActive) {
      // Turn off — restore original province colours
      this.heatmapController.deactivate();
      this.activeHeatmap = null;
      this._showLegend(false);
    } else {
      if (!this._heatmapDataReady) {
        // First use: show loading, compute & push data, then activate
        this._showLoading(true);
        this._precomputeHeatmapData().then(() => {
          this._showLoading(false);
          this.heatmapController.activate(metric);
          this.activeHeatmap = metric;
          this._updateHeatmapToggleUI(metric, false);
          this._showLegend(true, metric);
        });
        return; // UI will be updated inside the promise
      }
      // Data already computed — switch instantly
      this.heatmapController.activate(metric);
      this.activeHeatmap = metric;
      this._showLegend(true, metric);
    }

    this._updateHeatmapToggleUI(metric, isActive);
  }

  _updateHeatmapToggleUI(metric, wasActive) {
    const toggles = document.querySelectorAll('.heatmap-toggle');
    toggles.forEach(t => {
      if (t.dataset.metric === metric && !wasActive) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
  }

  _showLoading(visible) {
    const el = document.getElementById('heatmap-loading');
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  _showLegend(visible, metric = null) {
    const el = document.getElementById('heatmap-legend');
    if (!el) return;

    if (!visible || !metric) {
      el.style.display = 'none';
      return;
    }

    // Gradient configs matching HeatmapController stops
    const gradients = {
      price:      'linear-gradient(to right, #1a9641, #a6d96a, #ffffbf, #fdae61, #a50026)',
      growth:     'linear-gradient(to right, #d7191c, #fdae61, #ffffbf, #a6d96a, #006837)',
      saturation: 'linear-gradient(to right, #1a9641, #a6d96a, #ffffbf, #fdae61, #a50026)',
      logistics:  'linear-gradient(to right, #1a9641, #a6d96a, #ffffbf, #fdae61, #a50026)',
    };
    const titles = {
      price:      'Giá thuê (Thấp → Cao)',
      growth:     'Tiềm năng tăng trưởng (Thấp → Cao)',
      saturation: 'Độ bão hòa KCN (Thấp → Cao)',
      logistics:  'Chi phí Logistics (Thấp → Cao)',
    };

    const gradientBar = document.getElementById('legend-gradient-bar');
    const titleEl     = document.getElementById('legend-title-text');
    if (gradientBar) gradientBar.style.background = gradients[metric] || gradients.price;
    if (titleEl)     titleEl.textContent = titles[metric] || '';

    el.style.display = 'block';
  }


  _handleExport() {
    if (!this.exportGenerator) {
      alert('Export service not available');
      return;
    }
    
    const stats = this._calculateStats();
    const reportData = {
      province: this.currentProvince,
      timestamp: new Date().toISOString(),
      stats: stats
    };

    alert('Đang khởi tạo báo cáo phân tích...');
    this.exportGenerator.generateInvestmentReport(this.currentProvince, reportData);
  }

  /**
   * Sync map view and filters to the selected province
   * @param {string} provinceName 
   * @private
   */
  _syncMapToProvince(provinceName) {
    if (!window.map) return;

    if (provinceName === 'all') {
      window.map.setFilter('vn-provinces-fill', null);
      window.map.flyTo({ center: [105.8342, 21.0278], zoom: 5.3, duration: 1500 });
      return;
    }

    // Apply filter to highlight selected province
    window.map.setFilter('vn-provinces-fill', ['==', ['get', 'display_name'], provinceName]);

    // Fly to the province center
    const cityCenters = this.dataManager.getStrategicLocationsByType('city_center');
    if (cityCenters) {
      const city = cityCenters.find(f => f.properties.name === provinceName);
      if (city && city.geometry && city.geometry.coordinates) {
        window.map.flyTo({
          center: city.geometry.coordinates,
          zoom: 8.5,
          duration: 1500,
          essential: true
        });
      }
    }
  }

  /**
   * Pre-compute metric stats for ALL provinces and push to HeatmapController.
   * Runs once; subsequent heatmap switches are instant.
   * @returns {Promise<void>}
   */
  async _precomputeHeatmapData() {
    if (!this.heatmapController || !this.dataManager) return;

    // Wait until provinceGeojson is available
    if (!window.provinceGeojson) {
      await new Promise(resolve => {
        const poll = () => window.provinceGeojson ? resolve() : setTimeout(poll, 400);
        poll();
      });
    }

    const normalize = window.normalizeProvinceName || (s => s);
    const dataByProvince = {};

    window.provinceGeojson.features.forEach(feature => {
      const props = feature.properties;
      const name = normalize(props.ten_tinh || props.name || props.display_name || '');
      if (!name) return;
      dataByProvince[name] = this._calculateStatsForProvince(name);
    });

    // Hand off to controller — it will patch the live source
    this.heatmapController.setEnrichedData(dataByProvince);
    this._heatmapDataReady = true;

    const sample = Object.entries(dataByProvince)[0];
    if (sample) {
      console.log(`[AnalyticsDashboard] Pre-computed ${Object.keys(dataByProvince).length} provinces. Sample "${sample[0]}":`, sample[1]);
    }
  }

  /**
   * Helper to calculate stats for a specific province (used for heatmap enrichment)
   * @private
   */
  _calculateStatsForProvince(provinceName) {
    // This uses similar logic to _calculateStats but specific to one province
    const zones = this.dataManager.getZonesByProvince(provinceName);
    
    let totalPrice = 0;
    let pricedZones = 0;
    zones.forEach(z => {
      const priceStr = z.properties.price || '';
      const priceMatch = priceStr.match(/(\d+\.?\d*)/);
      if (priceMatch) {
        totalPrice += parseFloat(priceMatch[1]);
        pricedZones++;
      }
    });

    const avgPrice = pricedZones > 0 ? (totalPrice / pricedZones) : 85;
    
    // Calculate logistics score using LogisticsCalculator
    let logisticsScore = 50;
    if (this.logisticsCalculator) {
      // Find city center to use as proxy for province logistics score
      const cityCenters = this.dataManager.getStrategicLocationsByType('city_center');
      const city = cityCenters?.features?.find(f => {
        const cityName = window.normalizeProvinceName ? 
          window.normalizeProvinceName(f.properties.name) : 
          f.properties.name;
        return cityName === provinceName;
      });
      if (city) {
        try {
          logisticsScore = this.logisticsCalculator.calculateLogisticsScore(city);
          // console.log(`[Logistics] ${provinceName} Score: ${logisticsScore.toFixed(1)}`);
        } catch (e) {
          console.warn(`[AnalyticsDashboard] Logistics calc failed for ${provinceName}:`, e.message);
        }
      } else {
        // console.warn(`[Logistics] City center NOT found for: ${provinceName}`);
      }
    } else {
      logisticsScore = 50 + (Math.random() * 40);
    }
    
    if (logisticsScore === 50 && this.logisticsCalculator) {
       // Debug: Why is it fallback to 50?
       // console.log(`[AnalyticsDashboard] Logistics fallback for ${provinceName}`);
    }

    // Calculate growth potential via prediction engine if available
    let growthScore = 0;
    if (this.predictionEngine && zones.length > 0) {
      let totalGrowth = 0;
      zones.forEach(z => {
        try {
          totalGrowth += this.predictionEngine.calculateGrowthPotential(z, {});
        } catch (e) {
          totalGrowth += 50;
        }
      });
      growthScore = totalGrowth / zones.length;
    } else {
      growthScore = 60 + (Math.random() * 20); // Default fallback
    }
    
    // Calculate saturation based on zone density (higher zones = higher saturation)
    const saturationIndex = Math.min(100, zones.length * 8); 

    return {
      avgPrice,
      growthScore,
      saturationIndex,
      logisticsScore
    };
  }

  /**
   * Cleanup and remove dashboard from DOM
   */
  destroy() {
    this.hide();
    this.dataManager = null;
    this.predictionEngine = null;
    this.heatmapController = null;
    this.exportGenerator = null;
  }
}

