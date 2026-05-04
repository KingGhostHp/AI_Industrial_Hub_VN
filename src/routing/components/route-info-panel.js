/**
 * RouteInfoPanel Component
 * 
 * Displays route information including summary, turn-by-turn directions,
 * and alternative routes.
 */

class RouteInfoPanel {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container element
   * @param {Function} options.onAlternativeSelected - Callback when alternative route selected
   * @param {Function} options.onStepClick - Callback when step is clicked
   */
  constructor(options) {
    this.container = options.container;
    this.onAlternativeSelected = options.onAlternativeSelected;
    this.onStepClick = options.onStepClick;
    
    this.currentRoute = null;
    this.alternatives = [];
    
    this.render();
  }

  /**
   * Render the panel HTML
   */
  render() {
    this.container.innerHTML = `
      <div class="route-info-panel">
        <div id="routeSummary" class="route-summary" style="display: none;"></div>
        <div id="routeSteps" class="route-steps" style="display: none;"></div>
        <div id="routeAlternatives" class="route-alternatives" style="display: none;"></div>
      </div>
    `;
  }

  /**
   * Display route information
   * @param {import('../types/index.js').Route} route
   * @param {import('../types/index.js').Route[]} alternatives
   */
  displayRoute(route, alternatives = []) {
    this.currentRoute = route;
    this.alternatives = alternatives;

    if (!route) {
      this.clear();
      return;
    }

    this.displaySummary(route);
    this.displaySteps(route.steps || []);
    this.displayAlternatives(alternatives);
  }

  /**
   * Display route summary
   * @param {import('../types/index.js').Route} route
   */
  displaySummary(route) {
    const summaryEl = this.container.querySelector('#routeSummary');
    if (!summaryEl) return;

    const distance = this.formatDistance(route.distance);
    const duration = this.formatDuration(route.duration);
    const travelModeIcon = this.getTravelModeIcon(route.travelMode);

    summaryEl.innerHTML = `
      <div class="route-summary-header">
        <h3 style="margin: 0; color: #fff; font-size: 16px;">
          <span style="font-size: 18px; vertical-align: middle; margin-right: 6px;">${travelModeIcon}</span>
          Thông tin tuyến đường
        </h3>
      </div>
      <div class="route-summary-stats">
        <div class="route-stat">
          <i data-lucide="map-pin" style="width: 16px; height: 16px;"></i>
          <span class="route-stat-value">${distance}</span>
          <span class="route-stat-label">Khoảng cách</span>
        </div>
        <div class="route-stat">
          <i data-lucide="clock" style="width: 16px; height: 16px;"></i>
          <span class="route-stat-value">${duration}</span>
          <span class="route-stat-label">Thời gian</span>
        </div>
      </div>
    `;

    summaryEl.style.display = 'block';

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Display turn-by-turn directions
   * @param {import('../types/index.js').RouteStep[]} steps
   */
  displaySteps(steps) {
    const stepsEl = this.container.querySelector('#routeSteps');
    if (!stepsEl) return;

    if (!steps || steps.length === 0) {
      stepsEl.style.display = 'none';
      return;
    }

    stepsEl.innerHTML = `
      <div class="route-steps-header">
        <h4 style="margin: 0; color: #fff; font-size: 14px;">
          <i data-lucide="list" style="width: 16px; height: 16px; vertical-align: middle;"></i>
          Chỉ dẫn từng bước
        </h4>
        <button id="toggleStepsBtn" class="route-toggle-btn">
          <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
      <div id="stepsContent" class="route-steps-content">
        ${steps.map((step, index) => this.renderStep(step, index)).join('')}
      </div>
    `;

    stepsEl.style.display = 'block';

    // Attach event listeners
    const toggleBtn = stepsEl.querySelector('#toggleStepsBtn');
    const content = stepsEl.querySelector('#stepsContent');
    
    toggleBtn?.addEventListener('click', () => {
      const isExpanded = content.style.display !== 'none';
      content.style.display = isExpanded ? 'none' : 'block';
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', isExpanded ? 'chevron-down' : 'chevron-up');
        lucide.createIcons();
      }
    });

    // Attach step click handlers
    stepsEl.querySelectorAll('.route-step-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        if (this.onStepClick) {
          this.onStepClick(steps[index], index);
        }
      });
    });

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Render a single step
   * @param {import('../types/index.js').RouteStep} step
   * @param {number} index
   * @returns {string}
   */
  renderStep(step, index) {
    const distance = this.formatDistance(step.distance);
    const duration = this.formatDuration(step.duration);
    const icon = this.getManeuverIcon(step.maneuver?.type);

    return `
      <div class="route-step-item" data-index="${index}">
        <div class="route-step-icon">
          <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
        </div>
        <div class="route-step-content">
          <div class="route-step-instruction">${step.instruction || 'Tiếp tục'}</div>
          <div class="route-step-meta">${distance} • ${duration}</div>
        </div>
      </div>
    `;
  }

  /**
   * Display alternative routes
   * @param {import('../types/index.js').Route[]} alternatives
   */
  displayAlternatives(alternatives) {
    const altEl = this.container.querySelector('#routeAlternatives');
    if (!altEl) return;

    if (!alternatives || alternatives.length === 0) {
      altEl.style.display = 'none';
      return;
    }

    altEl.innerHTML = `
      <div class="route-alternatives-header">
        <h4 style="margin: 0; color: #fff; font-size: 14px;">
          <i data-lucide="git-branch" style="width: 16px; height: 16px; vertical-align: middle;"></i>
          Tuyến đường thay thế (${alternatives.length})
        </h4>
      </div>
      <div class="route-alternatives-list">
        ${alternatives.map((route, index) => this.renderAlternative(route, index)).join('')}
      </div>
    `;

    altEl.style.display = 'block';

    // Attach event listeners
    altEl.querySelectorAll('.route-alternative-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        if (this.onAlternativeSelected) {
          this.onAlternativeSelected(alternatives[index], index);
        }
      });
    });

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Render alternative route
   * @param {import('../types/index.js').Route} route
   * @param {number} index
   * @returns {string}
   */
  renderAlternative(route, index) {
    const distance = this.formatDistance(route.distance);
    const duration = this.formatDuration(route.duration);
    
    // Calculate difference from main route
    let diffText = '';
    if (this.currentRoute) {
      const distDiff = route.distance - this.currentRoute.distance;
      const durDiff = route.duration - this.currentRoute.duration;
      
      if (distDiff > 0) {
        diffText = `+${this.formatDistance(distDiff)}`;
      } else if (distDiff < 0) {
        diffText = `-${this.formatDistance(Math.abs(distDiff))}`;
      }
    }

    return `
      <div class="route-alternative-item" data-index="${index}">
        <div class="route-alternative-label">Tuyến ${index + 1}</div>
        <div class="route-alternative-info">
          <div class="route-alternative-main">
            <span class="route-alternative-distance">${distance}</span>
            <span class="route-alternative-duration">${duration}</span>
          </div>
          ${diffText ? `<div class="route-alternative-diff">${diffText}</div>` : ''}
        </div>
        <i data-lucide="chevron-right" style="width: 16px; height: 16px; color: #9CA3AF;"></i>
      </div>
    `;
  }

  /**
   * Format distance
   * @param {number} meters
   * @returns {string}
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration
   * @param {number} seconds
   * @returns {string}
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  }

  /**
   * Get travel mode icon
   * @param {string} mode
   * @returns {string}
   */
  getTravelModeIcon(mode) {
    const icons = {
      'driving-traffic': '🚗',
      'driving': '🏍️',
      'cycling': '🚴',
      'walking': '🚶',
    };
    return icons[mode] || '🧭';
  }

  /**
   * Get maneuver icon
   * @param {string} type
   * @returns {string}
   */
  getManeuverIcon(type) {
    const icons = {
      'turn': 'corner-up-right',
      'merge': 'merge',
      'roundabout': 'circle',
      'arrive': 'map-pin',
      'depart': 'map-pin',
      'fork': 'git-branch',
    };
    return icons[type] || 'arrow-right';
  }

  /**
   * Highlight a specific step
   * @param {number} stepIndex
   */
  highlightStep(stepIndex) {
    const steps = this.container.querySelectorAll('.route-step-item');
    steps.forEach((el, index) => {
      if (index === stepIndex) {
        el.classList.add('highlighted');
      } else {
        el.classList.remove('highlighted');
      }
    });
  }

  /**
   * Clear all content
   */
  clear() {
    const summaryEl = this.container.querySelector('#routeSummary');
    const stepsEl = this.container.querySelector('#routeSteps');
    const altEl = this.container.querySelector('#routeAlternatives');

    if (summaryEl) summaryEl.style.display = 'none';
    if (stepsEl) stepsEl.style.display = 'none';
    if (altEl) altEl.style.display = 'none';

    this.currentRoute = null;
    this.alternatives = [];
  }
}

// Export as default for ES6 modules
export default RouteInfoPanel;
