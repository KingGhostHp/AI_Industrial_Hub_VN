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
   */
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.dataManager = options.dataManager;
    this.predictionEngine = options.predictionEngine;
    this.heatmapController = options.heatmapController;
    this.exportGenerator = options.exportGenerator;
    
    this.isVisible = false;
    this.currentProvince = 'all';
    this.forecastHorizon = 1; // Default 1 year
    
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
        saturation: 'Độ bão hòa',
        high: 'Cao',
        moderate: 'Trung bình',
        low: 'Thấp',
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
    }
  }

  /**
   * Update dashboard data based on current filters
   */
  updateData() {
    const stats = this._calculateStats();
    this._updateSummaryStats(stats);
    this._updateCharts(stats);
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
        this._toggleHeatmap(metric);
      });
    });
  }

  /**
   * Calculate statistics based on current filters
   */
  _calculateStats() {
    // In a real implementation, this would use the DataManager
    // For now, return mock/dummy data
    return {
      zoneCount: 1052,
      avgPrice: 85.5,
      occupancy: 78.2,
      growthScore: 72,
      saturationIndex: 65,
      trends: [
        { year: 2021, count: 850 },
        { year: 2022, count: 920 },
        { year: 2023, count: 1052 },
        { year: 2024, count: 1120 }, // Forecast
        { year: 2025, count: 1180 }  // Forecast
      ]
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
        <span class="stat-value">${s.occupancy}%</span>
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
      priceContainer.innerHTML = this._renderPriceChart();
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

  _renderPriceChart() {
    // Mock price data
    const prices = [75, 80, 85.5, 92, 98];
    const labels = [2021, 2022, 2023, 2024, 2025];
    const max = 120;
    
    return `
      <div class="line-chart-placeholder">
        <div class="bar-chart horizontal">
          ${prices.map((p, i) => `
            <div class="chart-row">
              <span class="chart-label">${labels[i]}</span>
              <div class="chart-bar-bg">
                <div class="chart-bar price-bar" style="width: ${(p / max) * 100}%">
                  <span class="bar-text">${p} USD</span>
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
        <p class="gauge-description">
          ${index >= 80 ? this.t('high') : (index >= 60 ? this.t('moderate') : this.t('low'))} Saturation
        </p>
      </div>
    `;
  }

  _renderHeatmapControls() {
    const metrics = [
      { id: 'price', label: 'Rental Price', icon: '💰' },
      { id: 'growth', label: 'Growth Potential', icon: '📈' },
      { id: 'saturation', label: 'Saturation', icon: '🏗️' },
      { id: 'logistics', label: 'Logistics Cost', icon: '🚛' }
    ];
    
    return metrics.map(m => `
      <button class="heatmap-toggle" data-metric="${m.id}">
        <span class="metric-icon">${m.icon}</span>
        <span class="metric-label">${m.label}</span>
      </button>
    `).join('');
  }

  _getProvinceOptions() {
    // Real implementation would get this from DataManager
    const provinces = [
      'TP Hà Nội', 'TP Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Bắc Ninh', 'Long An'
    ];
    return provinces.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  _renderTrendsPlaceholder() { return '<div class="loading-placeholder"></div>'; }
  _renderPricePlaceholder() { return '<div class="loading-placeholder"></div>'; }
  _renderSaturationPlaceholder() { return '<div class="loading-placeholder"></div>'; }

  _toggleHeatmap(metric) {
    if (!this.heatmapController) return;

    const isActive = this.activeHeatmap === metric;
    
    if (isActive) {
      this.heatmapController.toggle(false);
      this.activeHeatmap = null;
    } else {
      this.heatmapController.renderHeatmap(metric);
      this.activeHeatmap = metric;
    }

    // Update UI toggle states
    const toggles = document.querySelectorAll('.heatmap-toggle');
    toggles.forEach(t => {
      if (t.dataset.metric === metric && !isActive) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
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
}
