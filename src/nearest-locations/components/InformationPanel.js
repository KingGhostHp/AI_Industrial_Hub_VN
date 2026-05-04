/**
 * InformationPanel - UI component for displaying nearest location results
 * 
 * This class manages the information panel that displays distance and travel time
 * information for the nearest strategic locations.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5
 */
class InformationPanel {
  /**
   * Create an InformationPanel instance
   * @param {string} containerId - ID of the container element
   */
  constructor(containerId) {
    if (!containerId) {
      throw new Error('Container ID is required');
    }

    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }

    this.isVisible = false;
  }

  /**
   * Display loading state (Requirement 6.1)
   * @param {string} industrialZoneName - Name of selected industrial zone
   */
  showLoading(industrialZoneName) {
    console.log('[InformationPanel] Showing loading state for:', industrialZoneName);
    
    this.isVisible = true;
    this.container.style.display = 'block';
    
    this.container.innerHTML = `
      <div class="nearest-locations-panel-content">
        <div class="panel-header">
          <h3 class="panel-title">Địa điểm chiến lược gần nhất</h3>
          <button class="panel-close-btn" onclick="this.closest('.nearest-locations-panel-content').parentElement.style.display='none'">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
        
        <div class="panel-body">
          <div class="selected-zone">
            <strong>Khu công nghiệp:</strong> ${this._escapeHtml(industrialZoneName)}
          </div>
          
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Đang tính toán tuyến đường...</p>
          </div>
        </div>
      </div>
    `;

    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  /**
   * Display route results (Requirements 5.1, 5.2, 5.3, 5.4, 5.5)
   * @param {string} industrialZoneName - Name of selected industrial zone
   * @param {Object} results - Results object with seaport, airport, city_center data
   */
  displayResults(industrialZoneName, results) {
    console.log('[InformationPanel] Displaying results for:', industrialZoneName);
    
    this.isVisible = true;
    this.container.style.display = 'block';

    // Build table rows
    const rows = this._buildTableRows(results);

    this.container.innerHTML = `
      <div class="nearest-locations-panel-content">
        <div class="panel-header">
          <h3 class="panel-title">Địa điểm chiến lược gần nhất</h3>
          <button class="panel-close-btn" onclick="this.closest('.nearest-locations-panel-content').parentElement.style.display='none'">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
        
        <div class="panel-body">
          <div class="selected-zone">
            <strong>Khu công nghiệp:</strong> ${this._escapeHtml(industrialZoneName)}
          </div>
          
          <div class="results-table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th>Loại địa điểm</th>
                  <th>Tên</th>
                  <th>Khoảng cách thẳng</th>
                  <th>Khoảng cách đường</th>
                  <th>Thời gian di chuyển</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  /**
   * Display error message with retry button (Requirements 6.4, 6.5)
   * @param {string} message - Error message to display
   * @param {Function} retryCallback - Function to call when retry button is clicked
   */
  showError(message, retryCallback) {
    console.error('[InformationPanel] Showing error:', message);
    
    this.isVisible = true;
    this.container.style.display = 'block';

    this.container.innerHTML = `
      <div class="nearest-locations-panel-content">
        <div class="panel-header">
          <h3 class="panel-title">Địa điểm chiến lược gần nhất</h3>
          <button class="panel-close-btn" onclick="this.closest('.nearest-locations-panel-content').parentElement.style.display='none'">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
        
        <div class="panel-body">
          <div class="error-state">
            <div class="error-icon">
              <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #EF4444;"></i>
            </div>
            <p class="error-message">${this._escapeHtml(message)}</p>
            <button class="retry-button" id="retry-button">
              <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    `;

    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    // Attach retry button event listener
    const retryButton = document.getElementById('retry-button');
    if (retryButton && retryCallback) {
      retryButton.addEventListener('click', () => {
        console.log('[InformationPanel] Retry button clicked');
        retryCallback();
      });
    }
  }

  /**
   * Hide the information panel
   */
  hide() {
    console.log('[InformationPanel] Hiding panel');
    this.isVisible = false;
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }

  /**
   * Build table rows for results display
   * @private
   * @param {Object} results - Results object
   * @returns {string} HTML string for table rows
   */
  _buildTableRows(results) {
    const locationTypes = [
      { key: 'seaport', label: 'Cảng biển', icon: 'anchor' },
      { key: 'airport', label: 'Sân bay', icon: 'plane' },
      { key: 'city_center', label: 'Trung tâm thành phố', icon: 'building-2' }
    ];

    return locationTypes.map(({ key, label, icon }) => {
      const result = results[key];

      if (!result || !result.available) {
        // No data available (Requirement 5.7)
        return `
          <tr>
            <td>
              <div class="location-type">
                <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
                ${label}
              </div>
            </td>
            <td colspan="4" class="no-data">Không có dữ liệu</td>
          </tr>
        `;
      }

      return `
        <tr>
          <td>
            <div class="location-type">
              <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
              ${label}
            </div>
          </td>
          <td>${this._escapeHtml(result.name)}</td>
          <td>${this._formatDistance(result.straightDistance)}</td>
          <td>${result.routeDistance ? this._formatDistance(result.routeDistance) : '—'}</td>
          <td>${result.travelTime ? this._escapeHtml(result.travelTime) : '—'}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Format distance for display
   * @private
   * @param {number} km - Distance in kilometers
   * @returns {string} Formatted distance string
   */
  _formatDistance(km) {
    if (km === null || km === undefined) {
      return '—';
    }
    return `${km} km`;
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default InformationPanel;
