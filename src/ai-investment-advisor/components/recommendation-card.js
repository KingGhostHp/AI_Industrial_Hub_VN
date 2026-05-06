/**
 * Recommendation Card Component
 * 
 * Displays individual zone recommendations with scoring breakdown,
 * key highlights, and selection functionality for comparison.
 * 
 * Requirements: 1.6, 1.7, 9.4, 9.5, 10.1, 19.2
 */

export class RecommendationCard {
  /**
   * Initialize recommendation card
   * @param {Object} recommendation - Recommendation instance
   * @param {Object} mapInstance - Mapbox GL JS map instance
   * @param {Function} onSelect - Callback when card is selected for comparison
   * @param {Function} onClick - Callback when card is clicked
   */
  constructor(recommendation, mapInstance, onSelect, onClick) {
    this.recommendation = recommendation;
    this.map = mapInstance;
    this.onSelect = onSelect;
    this.onClick = onClick;
    this.isSelected = false;
    
    // Vietnamese translations (default language)
    this.translations = {
      vi: {
        rank: 'Hạng',
        score: 'Điểm',
        zone_name: 'Tên khu',
        location: 'Vị trí',
        price: 'Giá thuê',
        acreage: 'Diện tích',
        score_breakdown: 'Chi tiết điểm',
        price_score: 'Điểm giá',
        location_score: 'Điểm vị trí',
        infrastructure_score: 'Điểm hạ tầng',
        logistics_score: 'Điểm logistics',
        growth_potential: 'Tiềm năng tăng trưởng',
        nearest_port: 'Cảng gần nhất',
        nearest_airport: 'Sân bay gần nhất',
        nearest_city: 'Thành phố gần nhất',
        distance: 'Khoảng cách',
        cost: 'Chi phí',
        select_for_comparison: 'Chọn để so sánh',
        view_details: 'Xem chi tiết',
        usd_per_sqm: 'USD/m²/kỳ',
        hectares: 'ha',
        km: 'km',
        vnd: 'VND',
        high: 'Cao',
        medium: 'Trung bình',
        low: 'Thấp'
      }
    };
    
    this.currentLanguage = 'vi';
  }
  
  /**
   * Get translated text
   * @param {String} key - Translation key
   * @returns {String} - Translated text
   */
  t(key) {
    return this.translations[this.currentLanguage][key] || key;
  }
  
  /**
   * Render recommendation card
   * @returns {HTMLElement} - Card element
   */
  render() {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.dataset.zoneId = this.recommendation.zone.properties.code || this.recommendation.zone.properties.name;
    
    // Add selected class if card is selected
    if (this.isSelected) {
      card.classList.add('selected');
    }
    
    const zone = this.recommendation.zone.properties;
    const breakdown = this.recommendation.breakdown;
    
    card.innerHTML = `
      <div class="card-header">
        <div class="card-rank">
          <span class="rank-label">${this.t('rank')}</span>
          <span class="rank-value">#${this.recommendation.rank}</span>
        </div>
        <div class="card-score">
          <span class="score-value">${this.recommendation.score.toFixed(1)}</span>
          <span class="score-label">/${this.t('score')}</span>
        </div>
        <div class="card-select">
          <label class="checkbox-container">
            <input 
              type="checkbox" 
              class="select-checkbox"
              ${this.isSelected ? 'checked' : ''}
              aria-label="${this.t('select_for_comparison')}"
            />
            <span class="checkmark"></span>
          </label>
        </div>
      </div>
      
      <div class="card-body">
        <h3 class="zone-name">${zone.name || 'N/A'}</h3>
        <p class="zone-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="location-icon">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          ${zone.province || 'N/A'}${zone.district ? ', ' + zone.district : ''}
        </p>
        
        <div class="zone-highlights">
          <div class="highlight-item">
            <span class="highlight-label">${this.t('price')}:</span>
            <span class="highlight-value">${this.formatPrice(zone.price)} ${this.t('usd_per_sqm')}</span>
          </div>
          <div class="highlight-item">
            <span class="highlight-label">${this.t('acreage')}:</span>
            <span class="highlight-value">${this.formatNumber(zone.acreage)} ${this.t('hectares')}</span>
          </div>
        </div>
        
        <div class="score-breakdown">
          <h4 class="breakdown-title">${this.t('score_breakdown')}</h4>
          <div class="breakdown-items">
            ${this.renderBreakdownItem('price', breakdown.price)}
            ${this.renderBreakdownItem('location', breakdown.location)}
            ${this.renderBreakdownItem('infrastructure', breakdown.infrastructure)}
            ${this.renderBreakdownItem('logistics', breakdown.logistics)}
          </div>
        </div>
        
        ${this.recommendation.growthPotential > 0 ? `
          <div class="growth-indicator">
            <span class="growth-label">${this.t('growth_potential')}:</span>
            <span class="growth-value ${this.getGrowthClass(this.recommendation.growthPotential)}">
              ${this.recommendation.growthPotential.toFixed(0)}/100
            </span>
          </div>
        ` : ''}
        
        ${this.renderLogistics()}
      </div>
      
      <div class="card-footer">
        <button class="btn-view-details" aria-label="${this.t('view_details')}">
          ${this.t('view_details')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    `;
    
    // Attach event listeners
    this.attachEventListeners(card);
    
    return card;
  }
  
  /**
   * Render score breakdown item
   * @param {String} criterion - Criterion name
   * @param {Object} data - Score and weight data
   * @returns {String} - HTML for breakdown item
   */
  renderBreakdownItem(criterion, data) {
    const score = data.score || 0;
    const weight = data.weight || 0;
    const contribution = (score * weight).toFixed(1);
    const percentage = (weight * 100).toFixed(0);
    
    return `
      <div class="breakdown-item">
        <div class="breakdown-header">
          <span class="breakdown-label">${this.t(criterion + '_score')}</span>
          <span class="breakdown-value">${score.toFixed(1)}/100</span>
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-fill" style="width: ${score}%"></div>
        </div>
        <div class="breakdown-contribution">
          <span class="contribution-text">Đóng góp: ${contribution} điểm (${percentage}%)</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Render logistics information
   * @returns {String} - HTML for logistics section
   */
  renderLogistics() {
    const logistics = this.recommendation.logisticsCosts;
    
    if (!logistics || (!logistics.nearestPort && !logistics.nearestAirport && !logistics.nearestCity)) {
      return '';
    }
    
    return `
      <div class="logistics-info">
        ${logistics.nearestPort && logistics.nearestPort.name ? `
          <div class="logistics-item">
            <span class="logistics-icon">🚢</span>
            <div class="logistics-details">
              <span class="logistics-label">${this.t('nearest_port')}:</span>
              <span class="logistics-value">${logistics.nearestPort.name}</span>
              <span class="logistics-distance">${this.formatNumber(logistics.nearestPort.distance)} ${this.t('km')}</span>
            </div>
          </div>
        ` : ''}
        
        ${logistics.nearestAirport && logistics.nearestAirport.name ? `
          <div class="logistics-item">
            <span class="logistics-icon">✈️</span>
            <div class="logistics-details">
              <span class="logistics-label">${this.t('nearest_airport')}:</span>
              <span class="logistics-value">${logistics.nearestAirport.name}</span>
              <span class="logistics-distance">${this.formatNumber(logistics.nearestAirport.distance)} ${this.t('km')}</span>
            </div>
          </div>
        ` : ''}
        
        ${logistics.nearestCity && logistics.nearestCity.name ? `
          <div class="logistics-item">
            <span class="logistics-icon">🏙️</span>
            <div class="logistics-details">
              <span class="logistics-label">${this.t('nearest_city')}:</span>
              <span class="logistics-value">${logistics.nearestCity.name}</span>
              <span class="logistics-distance">${this.formatNumber(logistics.nearestCity.distance)} ${this.t('km')}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Attach event listeners to card
   * @param {HTMLElement} card - Card element
   */
  attachEventListeners(card) {
    // Checkbox selection
    const checkbox = card.querySelector('.select-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.isSelected = e.target.checked;
        
        if (this.isSelected) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
        
        if (this.onSelect) {
          this.onSelect(this.recommendation, this.isSelected);
        }
      });
    }
    
    // View details button
    const viewDetailsBtn = card.querySelector('.btn-view-details');
    if (viewDetailsBtn) {
      viewDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleClick();
      });
    }
    
    // Card click (entire card)
    card.addEventListener('click', () => {
      this.handleClick();
    });
  }
  
  /**
   * Handle card click - center map and show details
   */
  handleClick() {
    // Center map on zone
    if (this.map && this.recommendation.zone.geometry) {
      const coordinates = this.getZoneCenter(this.recommendation.zone.geometry);
      
      if (coordinates) {
        this.map.flyTo({
          center: coordinates,
          zoom: 12,
          duration: 1500
        });
        
        // Highlight zone on map (if layer exists)
        this.highlightZone();
      }
    }
    
    // Call onClick callback
    if (this.onClick) {
      this.onClick(this.recommendation);
    }
  }
  
  /**
   * Get center coordinates of zone
   * @param {Object} geometry - GeoJSON geometry
   * @returns {Array|null} - [lng, lat] or null
   */
  getZoneCenter(geometry) {
    if (!geometry) return null;
    
    if (geometry.type === 'Point') {
      return geometry.coordinates;
    } else if (geometry.type === 'Polygon' && geometry.coordinates.length > 0) {
      // Calculate centroid of polygon
      const coords = geometry.coordinates[0];
      let sumLng = 0;
      let sumLat = 0;
      
      for (const coord of coords) {
        sumLng += coord[0];
        sumLat += coord[1];
      }
      
      return [sumLng / coords.length, sumLat / coords.length];
    } else if (geometry.type === 'MultiPolygon' && geometry.coordinates.length > 0) {
      // Use first polygon's centroid
      const coords = geometry.coordinates[0][0];
      let sumLng = 0;
      let sumLat = 0;
      
      for (const coord of coords) {
        sumLng += coord[0];
        sumLat += coord[1];
      }
      
      return [sumLng / coords.length, sumLat / coords.length];
    }
    
    return null;
  }
  
  /**
   * Highlight zone on map
   */
  highlightZone() {
    // This would integrate with existing map layers
    // Implementation depends on how zones are rendered on the map
    
    // Example: Set filter on existing zone layer
    if (this.map.getLayer('industrial-zones-highlight')) {
      const zoneId = this.recommendation.zone.properties.code || this.recommendation.zone.properties.name;
      this.map.setFilter('industrial-zones-highlight', ['==', ['get', 'code'], zoneId]);
    }
  }
  
  /**
   * Format price with thousand separators
   * @param {Number} price - Price value
   * @returns {String} - Formatted price
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
   * @param {Number} value - Numeric value
   * @returns {String} - Formatted number
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
   * Get CSS class for growth potential
   * @param {Number} growth - Growth potential score
   * @returns {String} - CSS class name
   */
  getGrowthClass(growth) {
    if (growth >= 70) return 'growth-high';
    if (growth >= 40) return 'growth-medium';
    return 'growth-low';
  }
  
  /**
   * Set selected state
   * @param {Boolean} selected - Selected state
   */
  setSelected(selected) {
    this.isSelected = selected;
  }
  
  /**
   * Get selected state
   * @returns {Boolean} - Selected state
   */
  getSelected() {
    return this.isSelected;
  }
  
  /**
   * Update recommendation data
   * @param {Object} recommendation - New recommendation data
   */
  update(recommendation) {
    this.recommendation = recommendation;
  }
}
