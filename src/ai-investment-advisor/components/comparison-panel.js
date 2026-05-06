/**
 * Comparison Panel Component
 * 
 * Displays side-by-side comparison of up to 5 industrial zones.
 * Shows all criteria scores, logistics costs, growth potential, and rental price forecasts.
 * Highlights the best zone for each criterion.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 17.2, 17.6
 */

import { ExportGenerator } from '../utils/export-generator.js';

export class ComparisonPanel {
  /**
   * Initialize comparison panel
   * @param {Array<Object>} recommendations - Array of Recommendation instances (max 5)
   * @param {Object} options - Additional options
   * @param {string} [options.language='vi'] - Display language ('vi' or 'en')
   * @param {Function} [options.onClose] - Callback when panel is closed
   * @param {Object} [options.mapInstance=null] - Mapbox GL JS map instance for PDF snapshots
   */
  constructor(recommendations, options = {}) {
    this.recommendations = recommendations.slice(0, 5); // Max 5 zones
    this.language = options.language || 'vi';
    this.onClose = options.onClose || null;
    this.mapInstance = options.mapInstance || null;
    
    // Initialize export generator
    this.exportGenerator = new ExportGenerator({
      language: this.language,
      mapInstance: this.mapInstance
    });
    
    // Vietnamese translations (default language)
    this.translations = {
      vi: {
        title: 'So Sánh Khu Công Nghiệp',
        subtitle: 'So sánh chi tiết {count} khu công nghiệp',
        zone: 'Khu',
        close: 'Đóng',
        export_pdf: 'Xuất PDF',
        export_csv: 'Xuất CSV',
        
        // Basic info
        zone_name: 'Tên khu',
        location: 'Vị trí',
        province: 'Tỉnh/Thành',
        district: 'Quận/Huyện',
        price: 'Giá thuê',
        acreage: 'Diện tích',
        overall_score: 'Điểm tổng',
        
        // Criteria scores
        criteria_scores: 'Điểm Tiêu Chí',
        price_score: 'Điểm giá',
        location_score: 'Điểm vị trí',
        infrastructure_score: 'Điểm hạ tầng',
        logistics_score: 'Điểm logistics',
        
        // Logistics
        logistics_info: 'Thông Tin Logistics',
        nearest_port: 'Cảng gần nhất',
        nearest_airport: 'Sân bay gần nhất',
        nearest_city: 'Thành phố gần nhất',
        distance: 'Khoảng cách',
        cost: 'Chi phí',
        
        // Growth & Forecast
        growth_potential: 'Tiềm năng tăng trưởng',
        rental_forecast: 'Dự báo giá thuê',
        current_price: 'Giá hiện tại',
        forecast_1yr: 'Dự báo 1 năm',
        forecast_2yr: 'Dự báo 2 năm',
        
        // Units
        usd_per_sqm: 'USD/m²/kỳ',
        hectares: 'ha',
        km: 'km',
        vnd: 'VND',
        points: 'điểm',
        
        // Best indicators
        best: 'Tốt nhất',
        lowest_price: 'Giá thấp nhất',
        highest_score: 'Điểm cao nhất',
        best_location: 'Vị trí tốt nhất',
        best_infrastructure: 'Hạ tầng tốt nhất',
        best_logistics: 'Logistics tốt nhất',
        highest_growth: 'Tăng trưởng cao nhất',
        nearest: 'Gần nhất'
      },
      en: {
        title: 'Industrial Zone Comparison',
        subtitle: 'Detailed comparison of {count} industrial zones',
        zone: 'Zone',
        close: 'Close',
        export_pdf: 'Export PDF',
        export_csv: 'Export CSV',
        
        // Basic info
        zone_name: 'Zone Name',
        location: 'Location',
        province: 'Province/City',
        district: 'District',
        price: 'Rental Price',
        acreage: 'Acreage',
        overall_score: 'Overall Score',
        
        // Criteria scores
        criteria_scores: 'Criteria Scores',
        price_score: 'Price Score',
        location_score: 'Location Score',
        infrastructure_score: 'Infrastructure Score',
        logistics_score: 'Logistics Score',
        
        // Logistics
        logistics_info: 'Logistics Information',
        nearest_port: 'Nearest Port',
        nearest_airport: 'Nearest Airport',
        nearest_city: 'Nearest City',
        distance: 'Distance',
        cost: 'Cost',
        
        // Growth & Forecast
        growth_potential: 'Growth Potential',
        rental_forecast: 'Rental Forecast',
        current_price: 'Current Price',
        forecast_1yr: '1-Year Forecast',
        forecast_2yr: '2-Year Forecast',
        
        // Units
        usd_per_sqm: 'USD/m²/term',
        hectares: 'ha',
        km: 'km',
        vnd: 'VND',
        points: 'points',
        
        // Best indicators
        best: 'Best',
        lowest_price: 'Lowest Price',
        highest_score: 'Highest Score',
        best_location: 'Best Location',
        best_infrastructure: 'Best Infrastructure',
        best_logistics: 'Best Logistics',
        highest_growth: 'Highest Growth',
        nearest: 'Nearest'
      }
    };
  }
  
  /**
   * Get translated text
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} - Translated text
   */
  t(key, params = {}) {
    let text = this.translations[this.language][key] || key;
    
    // Simple interpolation
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }
  
  /**
   * Render comparison panel
   * @returns {HTMLElement} - Panel element
   */
  render() {
    const panel = document.createElement('div');
    panel.className = 'comparison-panel';
    panel.id = 'comparison-panel';
    
    panel.innerHTML = `
      <div class="comparison-content">
        <div class="comparison-header">
          <div class="comparison-header-text">
            <h2 class="comparison-title">${this.t('title')}</h2>
            <p class="comparison-subtitle">${this.t('subtitle', { count: this.recommendations.length })}</p>
          </div>
          <button class="comparison-close-btn" id="close-comparison" aria-label="${this.t('close')}">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
        
        <div class="comparison-body">
          ${this.renderComparisonTable()}
        </div>
        
        <div class="comparison-footer">
          <button class="btn btn-secondary" id="export-pdf-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            ${this.t('export_pdf')}
          </button>
          <button class="btn btn-secondary" id="export-csv-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            ${this.t('export_csv')}
          </button>
          <button class="btn btn-primary" id="close-comparison-btn">
            ${this.t('close')}
          </button>
        </div>
      </div>
    `;
    
    return panel;
  }
  
  /**
   * Render comparison table
   * @returns {string} - HTML for comparison table
   */
  renderComparisonTable() {
    return `
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th class="criterion-column">${this.t('zone')}</th>
              ${this.recommendations.map((rec, index) => `
                <th class="zone-column">
                  <div class="zone-header-cell">
                    <span class="zone-number">#${rec.rank || index + 1}</span>
                    <span class="zone-name-short">${this.truncateText(rec.zone.properties.name || 'N/A', 30)}</span>
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <!-- Basic Information Section -->
            <tr class="section-header">
              <td colspan="${this.recommendations.length + 1}">
                <strong>Thông Tin Cơ Bản</strong>
              </td>
            </tr>
            
            ${this.renderRow('zone_name', (rec) => rec.zone.properties.name || 'N/A', false)}
            ${this.renderRow('province', (rec) => rec.zone.properties.province || 'N/A', false)}
            ${this.renderRow('district', (rec) => rec.zone.properties.district || 'N/A', false)}
            ${this.renderRow('price', (rec) => this.formatPrice(rec.zone.properties.price) + ' ' + this.t('usd_per_sqm'), true, 'price', true)}
            ${this.renderRow('acreage', (rec) => this.formatNumber(rec.zone.properties.acreage) + ' ' + this.t('hectares'), false)}
            ${this.renderRow('overall_score', (rec) => rec.score.toFixed(1) + ' ' + this.t('points'), true, 'score')}
            
            <!-- Criteria Scores Section -->
            <tr class="section-header">
              <td colspan="${this.recommendations.length + 1}">
                <strong>${this.t('criteria_scores')}</strong>
              </td>
            </tr>
            
            ${this.renderScoreRow('price_score', 'price')}
            ${this.renderScoreRow('location_score', 'location')}
            ${this.renderScoreRow('infrastructure_score', 'infrastructure')}
            ${this.renderScoreRow('logistics_score', 'logistics')}
            
            <!-- Logistics Information Section -->
            <tr class="section-header">
              <td colspan="${this.recommendations.length + 1}">
                <strong>${this.t('logistics_info')}</strong>
              </td>
            </tr>
            
            ${this.renderLogisticsRow('nearest_port', 'nearestPort')}
            ${this.renderLogisticsRow('nearest_airport', 'nearestAirport')}
            ${this.renderLogisticsRow('nearest_city', 'nearestCity')}
            
            <!-- Growth & Forecast Section -->
            <tr class="section-header">
              <td colspan="${this.recommendations.length + 1}">
                <strong>${this.t('growth_potential')} & ${this.t('rental_forecast')}</strong>
              </td>
            </tr>
            
            ${this.renderRow('growth_potential', (rec) => {
              const growth = rec.growthPotential || 0;
              return `<span class="growth-badge ${this.getGrowthClass(growth)}">${growth.toFixed(0)}/100</span>`;
            }, true, 'growth')}
            
            ${this.renderRow('current_price', (rec) => this.formatPrice(rec.zone.properties.price) + ' ' + this.t('usd_per_sqm'), false)}
            ${this.renderRow('forecast_1yr', (rec) => this.calculateForecast(rec.zone.properties.price, rec.zone.properties.province, 1), false)}
            ${this.renderRow('forecast_2yr', (rec) => this.calculateForecast(rec.zone.properties.price, rec.zone.properties.province, 2), false)}
          </tbody>
        </table>
      </div>
    `;
  }
  
  /**
   * Render a standard comparison row
   * @param {string} labelKey - Translation key for row label
   * @param {Function} valueGetter - Function to get value from recommendation
   * @param {boolean} highlightBest - Whether to highlight best value
   * @param {string} compareKey - Key to use for comparison (if different from labelKey)
   * @param {boolean} lowerIsBetter - Whether lower values are better (for price)
   * @returns {string} - HTML for row
   */
  renderRow(labelKey, valueGetter, highlightBest = false, compareKey = null, lowerIsBetter = false) {
    const values = this.recommendations.map(rec => ({
      rec,
      value: valueGetter(rec),
      numericValue: this.getNumericValue(rec, compareKey || labelKey)
    }));
    
    let bestIndex = -1;
    if (highlightBest) {
      bestIndex = this.findBestIndex(values, lowerIsBetter);
    }
    
    return `
      <tr class="comparison-row">
        <td class="criterion-column">
          <strong>${this.t(labelKey)}</strong>
        </td>
        ${values.map((item, index) => `
          <td class="zone-column ${bestIndex === index ? 'best-value' : ''}">
            ${item.value}
            ${bestIndex === index ? `<span class="best-badge">${this.t('best')}</span>` : ''}
          </td>
        `).join('')}
      </tr>
    `;
  }
  
  /**
   * Render a score row with visual bar
   * @param {string} labelKey - Translation key for row label
   * @param {string} criterion - Criterion key in breakdown
   * @returns {string} - HTML for row
   */
  renderScoreRow(labelKey, criterion) {
    const values = this.recommendations.map(rec => ({
      rec,
      score: rec.breakdown[criterion]?.score || 0,
      weight: rec.breakdown[criterion]?.weight || 0
    }));
    
    const bestIndex = values.reduce((maxIdx, item, idx, arr) => 
      item.score > arr[maxIdx].score ? idx : maxIdx, 0
    );
    
    return `
      <tr class="comparison-row score-row">
        <td class="criterion-column">
          <strong>${this.t(labelKey)}</strong>
        </td>
        ${values.map((item, index) => `
          <td class="zone-column ${bestIndex === index ? 'best-value' : ''}">
            <div class="score-cell">
              <div class="score-bar-container">
                <div class="score-bar" style="width: ${item.score}%; background-color: ${this.getScoreColor(item.score)}"></div>
              </div>
              <span class="score-text">${item.score.toFixed(1)}</span>
              ${bestIndex === index ? `<span class="best-badge">${this.t('best')}</span>` : ''}
            </div>
          </td>
        `).join('')}
      </tr>
    `;
  }
  
  /**
   * Render a logistics row with distance and cost
   * @param {string} labelKey - Translation key for row label
   * @param {string} logisticsKey - Key in logisticsCosts object
   * @returns {string} - HTML for row
   */
  renderLogisticsRow(labelKey, logisticsKey) {
    const values = this.recommendations.map(rec => ({
      rec,
      name: rec.logisticsCosts[logisticsKey]?.name || 'N/A',
      distance: rec.logisticsCosts[logisticsKey]?.distance || 0,
      cost: rec.logisticsCosts[logisticsKey]?.cost || 0
    }));
    
    const bestIndex = values.reduce((minIdx, item, idx, arr) => 
      item.distance > 0 && (arr[minIdx].distance === 0 || item.distance < arr[minIdx].distance) ? idx : minIdx, 0
    );
    
    return `
      <tr class="comparison-row logistics-row">
        <td class="criterion-column">
          <strong>${this.t(labelKey)}</strong>
        </td>
        ${values.map((item, index) => `
          <td class="zone-column ${bestIndex === index && item.distance > 0 ? 'best-value' : ''}">
            <div class="logistics-cell">
              <div class="logistics-name">${this.truncateText(item.name, 25)}</div>
              <div class="logistics-details">
                <span class="logistics-distance">${this.formatNumber(item.distance)} ${this.t('km')}</span>
                ${bestIndex === index && item.distance > 0 ? `<span class="best-badge">${this.t('nearest')}</span>` : ''}
              </div>
            </div>
          </td>
        `).join('')}
      </tr>
    `;
  }
  
  /**
   * Get numeric value for comparison
   * @param {Object} rec - Recommendation
   * @param {string} key - Key to extract
   * @returns {number} - Numeric value
   */
  getNumericValue(rec, key) {
    switch (key) {
      case 'price':
        return rec.zone.properties.price || 0;
      case 'score':
        return rec.score || 0;
      case 'growth':
        return rec.growthPotential || 0;
      default:
        return 0;
    }
  }
  
  /**
   * Find index of best value
   * @param {Array} values - Array of value objects
   * @param {boolean} lowerIsBetter - Whether lower values are better
   * @returns {number} - Index of best value
   */
  findBestIndex(values, lowerIsBetter = false) {
    if (values.length === 0) return -1;
    
    return values.reduce((bestIdx, item, idx, arr) => {
      const currentBest = arr[bestIdx].numericValue;
      const currentValue = item.numericValue;
      
      if (currentValue === 0) return bestIdx;
      if (currentBest === 0) return idx;
      
      if (lowerIsBetter) {
        return currentValue < currentBest ? idx : bestIdx;
      } else {
        return currentValue > currentBest ? idx : bestIdx;
      }
    }, 0);
  }
  
  /**
   * Calculate rental price forecast
   * @param {number} currentPrice - Current rental price
   * @param {string} province - Province name
   * @param {number} years - Years ahead (1 or 2)
   * @returns {string} - Formatted forecast
   */
  calculateForecast(currentPrice, province, years) {
    if (!currentPrice || currentPrice === 0) return 'N/A';
    
    // Simple growth rate based on province development level
    // This is a simplified version - in production, use PredictionEngine
    const growthRates = {
      'high': 0.08,
      'medium': 0.05,
      'low': 0.03
    };
    
    // Determine development level (simplified)
    const highDevProvinces = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai'];
    const devLevel = highDevProvinces.includes(province) ? 'high' : 'medium';
    
    const growthRate = growthRates[devLevel];
    const forecast = currentPrice * Math.pow(1 + growthRate, years);
    
    return this.formatPrice(forecast) + ' ' + this.t('usd_per_sqm');
  }
  
  /**
   * Get CSS class for growth potential
   * @param {number} growth - Growth potential score
   * @returns {string} - CSS class name
   */
  getGrowthClass(growth) {
    if (growth >= 70) return 'growth-high';
    if (growth >= 40) return 'growth-medium';
    return 'growth-low';
  }
  
  /**
   * Get color for score value
   * @param {number} score - Score value (0-100)
   * @returns {string} - CSS color
   */
  getScoreColor(score) {
    if (score >= 70) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  }
  
  /**
   * Format price with thousand separators
   * @param {number} price - Price value
   * @returns {string} - Formatted price
   */
  formatPrice(price) {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    
    return price.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
  
  /**
   * Format number with thousand separators
   * @param {number} value - Numeric value
   * @returns {string} - Formatted number
   */
  formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    return value.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
  }
  
  /**
   * Truncate text to maximum length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Show comparison panel
   */
  show() {
    // Remove existing panel if any
    const existing = document.getElementById('comparison-panel');
    if (existing) {
      existing.remove();
    }
    
    // Render and append to body
    const panel = this.render();
    document.body.appendChild(panel);
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Animate in
    requestAnimationFrame(() => {
      panel.classList.add('show');
    });
  }
  
  /**
   * Hide comparison panel
   */
  hide() {
    const panel = document.getElementById('comparison-panel');
    if (panel) {
      panel.classList.remove('show');
      setTimeout(() => {
        panel.remove();
        if (this.onClose) {
          this.onClose();
        }
      }, 300);
    }
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button in header
    const closeBtn = document.getElementById('close-comparison');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // Close button in footer
    const closeFooterBtn = document.getElementById('close-comparison-btn');
    if (closeFooterBtn) {
      closeFooterBtn.addEventListener('click', () => this.hide());
    }
    
    // Export PDF button
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => this.handleExportPDF());
    }
    
    // Export CSV button
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.handleExportCSV());
    }
    
    // Close on backdrop click
    const panel = document.getElementById('comparison-panel');
    if (panel) {
      panel.addEventListener('click', (e) => {
        if (e.target === panel) {
          this.hide();
        }
      });
    }
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
  
  /**
   * Handle PDF export
   */
  async handleExportPDF() {
    try {
      // Show loading indicator
      const pdfBtn = document.getElementById('export-pdf-btn');
      if (pdfBtn) {
        pdfBtn.disabled = true;
        pdfBtn.textContent = this.language === 'vi' ? 'Đang tạo PDF...' : 'Generating PDF...';
      }
      
      // Export to PDF
      await this.exportGenerator.exportComparisonToPDF(this.recommendations, {
        includeMap: this.mapInstance !== null
      });
      
      // Reset button
      if (pdfBtn) {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
          ${this.t('export_pdf')}
        `;
      }
    } catch (error) {
      console.error('[ComparisonPanel] Error exporting PDF:', error);
      alert(this.language === 'vi' 
        ? 'Lỗi khi xuất PDF. Vui lòng thử lại.' 
        : 'Error exporting PDF. Please try again.');
      
      // Reset button
      const pdfBtn = document.getElementById('export-pdf-btn');
      if (pdfBtn) {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
          ${this.t('export_pdf')}
        `;
      }
    }
  }
  
  /**
   * Handle CSV export
   */
  handleExportCSV() {
    try {
      this.exportGenerator.exportRecommendationsToCSV(this.recommendations);
    } catch (error) {
      console.error('[ComparisonPanel] Error exporting CSV:', error);
      alert(this.language === 'vi' 
        ? 'Lỗi khi xuất CSV. Vui lòng thử lại.' 
        : 'Error exporting CSV. Please try again.');
    }
  }
  
  /**
   * Update language
   * @param {string} language - Language code ('vi' or 'en')
   */
  setLanguage(language) {
    this.language = language;
    this.exportGenerator.setLanguage(language);
    
    // Re-render if panel is visible
    const panel = document.getElementById('comparison-panel');
    if (panel) {
      this.show();
    }
  }
  
  /**
   * Update map instance for PDF snapshots
   * @param {Object} mapInstance - Mapbox GL JS map instance
   */
  setMapInstance(mapInstance) {
    this.mapInstance = mapInstance;
    this.exportGenerator.setMapInstance(mapInstance);
  }
}
