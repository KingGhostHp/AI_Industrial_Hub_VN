/**
 * RoutePanel Component
 * 
 * UI component for route planning with origin/destination inputs,
 * waypoint management, and travel mode selection.
 */

class RoutePanel {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container element
   * @param {import('../managers/waypoint-manager.js')} options.waypointManager
   * @param {import('../managers/route-manager.js')} options.routeManager
   * @param {Function} options.onRouteCalculated - Callback when route is calculated
   */
  constructor(options) {
    this.container = options.container;
    this.waypointManager = options.waypointManager;
    this.routeManager = options.routeManager;
    this.onRouteCalculated = options.onRouteCalculated;
    
    this.origin = null;
    this.destination = null;
    this.travelMode = 'driving-traffic';
    this.isCalculating = false;
    
    this.render();
    this.attachEventListeners();
    this.setupClickOutsideHandler();
  }

  /**
   * Render the panel HTML
   */
  render() {
    this.container.innerHTML = `
      <div class="route-panel">
        <div class="route-inputs">
          <div class="route-input-group">
            <div class="route-input-icon" style="background: #10B981;">A</div>
            <input 
              type="text" 
              id="routeOriginInput" 
              class="route-input" 
              placeholder="Chọn điểm xuất phát hoặc click trên bản đồ..."
            />
            <button id="clearOriginBtn" class="route-clear-btn" style="display: none;">×</button>
            <div id="originSuggestions" class="route-suggestions" style="display: none;"></div>
          </div>
          
          <div class="route-input-group">
            <div class="route-input-icon" style="background: #EF4444;">B</div>
            <input 
              type="text" 
              id="routeDestinationInput" 
              class="route-input" 
              placeholder="Chọn điểm đến hoặc click trên bản đồ..."
            />
            <button id="clearDestinationBtn" class="route-clear-btn" style="display: none;">×</button>
            <div id="destinationSuggestions" class="route-suggestions" style="display: none;"></div>
          </div>
        </div>

        <div style="
          padding: 12px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
        ">
          💡 <strong>Hướng dẫn:</strong><br>
          • Nhập tên địa điểm hoặc click trên bản đồ<br>
          • Click vào KCN/CCN để thêm vào route<br>
          • Chọn phương tiện di chuyển bên dưới
        </div>

        <div class="waypoints-container" id="waypointsContainer" style="display: none;">
          <div class="waypoints-header">
            <span style="font-size: 12px; color: #9CA3AF;">Điểm dừng</span>
            <button id="clearWaypointsBtn" class="route-btn-small">Xóa tất cả</button>
          </div>
          <div id="waypointsList" class="waypoints-list"></div>
        </div>

        <div class="travel-modes">
          <button class="travel-mode-btn active" data-mode="driving-traffic" title="Ô tô">
            <i data-lucide="car" style="width: 20px; height: 20px;"></i>
            <span>Ô tô</span>
          </button>
          <button class="travel-mode-btn" data-mode="driving" title="Xe máy">
            <span style="font-size: 20px;">🏍️</span>
            <span>Xe máy</span>
          </button>
          <button class="travel-mode-btn" data-mode="cycling" title="Xe đạp">
            <span style="font-size: 20px;">🚴</span>
            <span>Xe đạp</span>
          </button>
          <button class="travel-mode-btn" data-mode="walking" title="Đi bộ">
            <i data-lucide="footprints" style="width: 20px; height: 20px;"></i>
            <span>Đi bộ</span>
          </button>
        </div>

        <div class="route-actions">
          <button id="calculateRouteBtn" class="route-btn-primary" disabled>
            <i data-lucide="navigation" style="width: 16px; height: 16px;"></i>
            Tìm đường
          </button>
          <button id="addWaypointBtn" class="route-btn-secondary" disabled>
            <i data-lucide="map-pin-plus" style="width: 16px; height: 16px;"></i>
            Thêm điểm dừng
          </button>
          <button id="optimizeRouteBtn" class="route-btn-secondary" style="display: none;">
            <i data-lucide="zap" style="width: 16px; height: 16px;"></i>
            Tối ưu hóa
          </button>
          <button id="clearRouteBtn" class="route-btn-secondary">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
            Xóa
          </button>
        </div>

        <div id="routeLoadingIndicator" class="route-loading" style="display: none;">
          <div class="spinner"></div>
          <span>Đang tính toán tuyến đường...</span>
        </div>
      </div>
    `;

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Setup click outside handler to close dropdowns
   */
  setupClickOutsideHandler() {
    document.addEventListener('click', (e) => {
      const originInput = this.container.querySelector('#routeOriginInput');
      const originSuggestions = this.container.querySelector('#originSuggestions');
      const destInput = this.container.querySelector('#routeDestinationInput');
      const destSuggestions = this.container.querySelector('#destinationSuggestions');
      
      // Check if click is outside origin input and suggestions
      if (originInput && originSuggestions) {
        if (!originInput.contains(e.target) && !originSuggestions.contains(e.target)) {
          originSuggestions.style.display = 'none';
          originInput.classList.remove('has-suggestions');
        }
      }
      
      // Check if click is outside destination input and suggestions
      if (destInput && destSuggestions) {
        if (!destInput.contains(e.target) && !destSuggestions.contains(e.target)) {
          destSuggestions.style.display = 'none';
          destInput.classList.remove('has-suggestions');
        }
      }
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Origin input - support both typing and map click
    const originInput = this.container.querySelector('#routeOriginInput');
    const originSuggestions = this.container.querySelector('#originSuggestions');
    
    let originSearchTimer = null;
    originInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(originSearchTimer);
      
      if (query.length < 2) {
        originSuggestions.style.display = 'none';
        return;
      }
      
      originSearchTimer = setTimeout(() => {
        this.showSearchSuggestions(query, 'origin');
      }, 300);
    });
    
    originInput?.addEventListener('focus', () => {
      if (window.routingMapClickHandler) {
        window.routingMapClickHandler('origin');
      }
      if (!originInput.value.trim()) {
        this.showDefaultSuggestions('origin');
      }
    });
    
    // Remove blur handler - we'll use click outside instead

    // Destination input - support both typing and map click
    const destInput = this.container.querySelector('#routeDestinationInput');
    const destSuggestions = this.container.querySelector('#destinationSuggestions');
    
    let destSearchTimer = null;
    destInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(destSearchTimer);
      
      if (query.length < 2) {
        destSuggestions.style.display = 'none';
        return;
      }
      
      destSearchTimer = setTimeout(() => {
        this.showSearchSuggestions(query, 'destination');
      }, 300);
    });
    
    destInput?.addEventListener('focus', () => {
      if (window.routingMapClickHandler) {
        window.routingMapClickHandler('destination');
      }
      if (!destInput.value.trim()) {
        this.showDefaultSuggestions('destination');
      }
    });
    
    // Remove blur handler - we'll use click outside instead

    // Travel mode buttons
    const modeBtns = this.container.querySelectorAll('.travel-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleTravelModeChange(btn));
    });

    // Calculate route button
    const calculateBtn = this.container.querySelector('#calculateRouteBtn');
    calculateBtn?.addEventListener('click', () => this.handleCalculateRoute());

    // Add waypoint button
    const addWaypointBtn = this.container.querySelector('#addWaypointBtn');
    addWaypointBtn?.addEventListener('click', () => this.handleAddWaypoint());

    // Optimize button
    const optimizeBtn = this.container.querySelector('#optimizeRouteBtn');
    optimizeBtn?.addEventListener('click', () => this.handleOptimizeRoute());

    // Clear route button
    const clearBtn = this.container.querySelector('#clearRouteBtn');
    clearBtn?.addEventListener('click', () => this.handleClearRoute());

    // Clear origin/destination buttons
    const clearOriginBtn = this.container.querySelector('#clearOriginBtn');
    clearOriginBtn?.addEventListener('click', () => this.clearOrigin());

    const clearDestBtn = this.container.querySelector('#clearDestinationBtn');
    clearDestBtn?.addEventListener('click', () => this.clearDestination());

    // Clear waypoints button
    const clearWaypointsBtn = this.container.querySelector('#clearWaypointsBtn');
    clearWaypointsBtn?.addEventListener('click', () => this.clearAllWaypoints());
  }

  /**
   * Show search suggestions
   * @param {string} query
   * @param {string} type - 'origin' or 'destination'
   */
  async showSearchSuggestions(query, type) {
    const suggestionsEl = this.container.querySelector(`#${type}Suggestions`);
    if (!suggestionsEl) return;
    
    suggestionsEl.innerHTML = '<div style="padding: 8px; color: rgba(255,255,255,0.6);">Đang tìm...</div>';
    suggestionsEl.style.display = 'block';
    
    try {
      // Search in industrial zones and OSM
      const results = await this.searchLocations(query);
      
      if (results.length === 0) {
        suggestionsEl.innerHTML = '<div style="padding: 8px; color: rgba(255,255,255,0.6);">Không tìm thấy kết quả</div>';
        return;
      }
      
      this.renderSuggestions(results, type);
    } catch (error) {
      console.error('Search error:', error);
      suggestionsEl.style.display = 'none';
    }
  }
  
  /**
   * Show default suggestions (recent/popular locations)
   * @param {string} type - 'origin' or 'destination'
   */
  showDefaultSuggestions(type) {
    const suggestionsEl = this.container.querySelector(`#${type}Suggestions`);
    if (!suggestionsEl) return;
    
    // Get industrial zones from global variable
    if (!window.industrialGeojson || !window.industrialGeojson.features) return;
    
    const features = window.industrialGeojson.features.slice(0, 5);
    const results = features.map(feature => ({
      type: 'industrial',
      name: feature.properties?.name || 'KCN/CCN',
      coordinates: feature.geometry?.coordinates,
      feature: feature
    }));
    
    this.renderSuggestions(results, type);
  }
  
  /**
   * Normalize text for search (remove accents, lowercase)
   * @param {string} text
   * @returns {string}
   */
  normalizeText(text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Search locations (industrial zones + OSM) with smart multi-field fuzzy search
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchLocations(query) {
    console.log('🔍 RoutePanel: Smart search activated with query:', query);
    const results = [];
    
    // Search in industrial zones with smart scoring
    if (window.industrialGeojson && window.industrialGeojson.features) {
      const normQuery = this.normalizeText(query);
      const queryWords = normQuery.split(' ').filter(w => w.length > 0);
      console.log('📝 RoutePanel: Normalized query:', normQuery, 'Words:', queryWords);
      
      const izMatches = window.industrialGeojson.features
        .map((feature) => {
          const props = feature.properties || {};
          const name = this.normalizeText(props.name || '');
          const code = this.normalizeText(props.code || '');
          const address = this.normalizeText(props.address || '');
          const province = this.normalizeText(props.province || '');
          const district = this.normalizeText(props.district || '');
          const commune = this.normalizeText(props.commune || '');
          const kind = this.normalizeText(props.kind || '');
          
          let score = 0;
          let matchedField = '';
          
          // Exact match in name (highest priority)
          if (name === normQuery) {
            score = 100;
            matchedField = 'name-exact';
          }
          // Name starts with query
          else if (name.startsWith(normQuery)) {
            score = 90;
            matchedField = 'name-start';
          }
          // Name contains query
          else if (name.includes(normQuery)) {
            score = 80;
            matchedField = 'name';
          }
          // Fuzzy word matching in name (all query words must be in name)
          else if (queryWords.length > 1 && queryWords.every(word => name.includes(word))) {
            score = 75;
            matchedField = 'name-fuzzy';
          }
          // Code matches
          else if (code.includes(normQuery)) {
            score = 70;
            matchedField = 'code';
          }
          // Province matches
          else if (province.includes(normQuery)) {
            score = 60;
            matchedField = 'province';
          }
          // District matches
          else if (district.includes(normQuery)) {
            score = 50;
            matchedField = 'district';
          }
          // Address matches
          else if (address.includes(normQuery)) {
            score = 40;
            matchedField = 'address';
          }
          // Fuzzy word matching in address
          else if (queryWords.length > 1 && queryWords.every(word => address.includes(word))) {
            score = 35;
            matchedField = 'address-fuzzy';
          }
          // Commune matches
          else if (commune.includes(normQuery)) {
            score = 30;
            matchedField = 'commune';
          }
          // Kind matches
          else if (kind.includes(normQuery)) {
            score = 20;
            matchedField = 'kind';
          }
          
          return { feature, score, matchedField };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => ({
          type: 'industrial',
          name: item.feature.properties?.name || 'KCN/CCN',
          province: item.feature.properties?.province || '',
          acreage: item.feature.properties?.acreage || '',
          coordinates: item.feature.geometry?.coordinates,
          feature: item.feature,
          score: item.score
        }));
      
      console.log('✅ RoutePanel: Found', izMatches.length, 'industrial zone matches');
      if (izMatches.length > 0) {
        console.log('🎯 RoutePanel: Top result:', izMatches[0].name, 'Score:', izMatches[0].score);
      }
      results.push(...izMatches);
    }
    
    // Search in OSM (Nominatim) - only if not enough industrial results
    if (results.length < 5) {
      try {
        const osmResults = await this.searchOSM(query);
        results.push(...osmResults);
      } catch (error) {
        console.error('OSM search error:', error);
      }
    }
    
    return results.slice(0, 8);
  }
  
  /**
   * Search OSM using Nominatim
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchOSM(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Industrial-Zones-Map/1.0'
        }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.map(item => ({
        type: 'osm',
        name: item.display_name,
        coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
      }));
    } catch (error) {
      console.error('Nominatim error:', error);
      return [];
    }
  }
  
  /**
   * Render suggestions list with Google Maps style
   * @param {Array} results
   * @param {string} type - 'origin' or 'destination'
   */
  renderSuggestions(results, type) {
    const suggestionsEl = this.container.querySelector(`#${type}Suggestions`);
    const inputEl = this.container.querySelector(`#route${type.charAt(0).toUpperCase() + type.slice(1)}Input`);
    if (!suggestionsEl) return;
    
    suggestionsEl.innerHTML = results.map((result, index) => {
      // Build sublabel with province and acreage
      const sublabelParts = [];
      if (result.province) sublabelParts.push(result.province);
      if (result.acreage) sublabelParts.push(`${result.acreage} ha`);
      const sublabel = sublabelParts.length > 0 
        ? sublabelParts.join(' • ') 
        : (result.type === 'industrial' ? 'Khu công nghiệp' : 'Địa điểm');
      
      return `
        <div class="route-suggestion-item" data-index="${index}">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i data-lucide="${result.type === 'industrial' ? 'factory' : 'map-pin'}" style="width: 18px; height: 18px; color: #3B82F6; flex-shrink: 0;"></i>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13px; font-weight: 500; color: #fff; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${result.name}
              </div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${sublabel}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    suggestionsEl.style.display = 'block';
    if (inputEl) {
      inputEl.classList.add('has-suggestions');
    }
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Attach click handlers
    suggestionsEl.querySelectorAll('.route-suggestion-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        this.selectSuggestion(results[index], type);
      });
    });
  }
  
  /**
   * Select a suggestion
   * @param {Object} result
   * @param {string} type - 'origin' or 'destination'
   */
  selectSuggestion(result, type) {
    const waypoint = {
      id: Date.now().toString(),
      name: result.name,
      coordinates: result.coordinates,
      type: type
    };
    
    if (type === 'origin') {
      this.setOrigin(waypoint);
    } else {
      this.setDestination(waypoint);
    }
    
    // Hide suggestions
    const suggestionsEl = this.container.querySelector(`#${type}Suggestions`);
    if (suggestionsEl) {
      suggestionsEl.style.display = 'none';
    }
  }

  /**
   * Set origin waypoint
   * @param {import('../types/index.js').Waypoint} waypoint
   */
  setOrigin(waypoint) {
    this.origin = { ...waypoint, type: 'origin' };
    const input = this.container.querySelector('#routeOriginInput');
    const clearBtn = this.container.querySelector('#clearOriginBtn');
    if (input) {
      input.value = waypoint.name;
      clearBtn.style.display = 'block';
    }
    this.updateUI();
    this.autoCalculateIfReady();
  }

  /**
   * Set destination waypoint
   * @param {import('../types/index.js').Waypoint} waypoint
   */
  setDestination(waypoint) {
    this.destination = { ...waypoint, type: 'destination' };
    const input = this.container.querySelector('#routeDestinationInput');
    const clearBtn = this.container.querySelector('#clearDestinationBtn');
    if (input) {
      input.value = waypoint.name;
      clearBtn.style.display = 'block';
    }
    this.updateUI();
    this.autoCalculateIfReady();
  }

  /**
   * Clear origin
   */
  clearOrigin() {
    this.origin = null;
    const input = this.container.querySelector('#routeOriginInput');
    const clearBtn = this.container.querySelector('#clearOriginBtn');
    if (input) {
      input.value = '';
      clearBtn.style.display = 'none';
    }
    this.updateUI();
  }

  /**
   * Clear destination
   */
  clearDestination() {
    this.destination = null;
    const input = this.container.querySelector('#routeDestinationInput');
    const clearBtn = this.container.querySelector('#clearDestinationBtn');
    if (input) {
      input.value = '';
      clearBtn.style.display = 'none';
    }
    this.updateUI();
  }

  /**
   * Handle travel mode change
   * @param {HTMLElement} btn
   */
  handleTravelModeChange(btn) {
    const mode = btn.dataset.mode;
    if (mode === this.travelMode) return;

    // Update UI
    this.container.querySelectorAll('.travel-mode-btn').forEach(b => {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    // Update mode
    this.travelMode = mode;

    // Recalculate if route exists
    if (this.origin && this.destination) {
      this.handleCalculateRoute();
    }
  }

  /**
   * Handle calculate route
   */
  async handleCalculateRoute() {
    if (!this.origin || !this.destination || this.isCalculating) {
      return;
    }

    this.isCalculating = true;
    this.showLoading(true);

    try {
      const waypoints = this.waypointManager.getWaypoints();
      const result = await this.routeManager.calculateRoute(
        this.origin,
        this.destination,
        waypoints,
        {
          travelMode: this.travelMode,
          alternatives: true,
          steps: true,
        }
      );

      if (result.success && result.route) {
        if (this.onRouteCalculated) {
          this.onRouteCalculated(result);
        }
        this.showSuccess('Đã tìm thấy tuyến đường!');
      } else {
        this.showError(result.error || 'Không thể tính toán tuyến đường');
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      this.showError('Lỗi khi tính toán tuyến đường');
    } finally {
      this.isCalculating = false;
      this.showLoading(false);
    }
  }

  /**
   * Handle add waypoint
   */
  handleAddWaypoint() {
    // Trigger map click mode for waypoint selection
    if (window.routingMapClickHandler) {
      window.routingMapClickHandler('waypoint');
    }
  }

  /**
   * Add waypoint
   * @param {import('../types/index.js').Waypoint} waypoint
   */
  addWaypoint(waypoint) {
    try {
      this.waypointManager.addWaypoint({ ...waypoint, type: 'waypoint' });
      this.renderWaypoints();
      this.updateUI();
      
      // Auto-recalculate if route exists
      if (this.origin && this.destination) {
        this.handleCalculateRoute();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Render waypoints list
   */
  renderWaypoints() {
    const waypoints = this.waypointManager.getWaypoints();
    const container = this.container.querySelector('#waypointsContainer');
    const list = this.container.querySelector('#waypointsList');

    if (waypoints.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    list.innerHTML = waypoints.map((wp, index) => `
      <div class="waypoint-item" data-id="${wp.id}">
        <div class="waypoint-number">${index + 1}</div>
        <div class="waypoint-name">${wp.name}</div>
        <button class="waypoint-remove-btn" data-id="${wp.id}">×</button>
      </div>
    `).join('');

    // Attach remove handlers
    list.querySelectorAll('.waypoint-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeWaypoint(btn.dataset.id);
      });
    });

    // Show optimize button if >= 2 waypoints
    const optimizeBtn = this.container.querySelector('#optimizeRouteBtn');
    if (optimizeBtn) {
      optimizeBtn.style.display = waypoints.length >= 2 ? 'block' : 'none';
    }
  }

  /**
   * Remove waypoint
   * @param {string} id
   */
  removeWaypoint(id) {
    this.waypointManager.removeWaypoint(id);
    this.renderWaypoints();
    this.updateUI();
    
    // Recalculate if route exists
    if (this.origin && this.destination) {
      this.handleCalculateRoute();
    }
  }

  /**
   * Clear all waypoints
   */
  clearAllWaypoints() {
    this.waypointManager.clearWaypoints();
    this.renderWaypoints();
    this.updateUI();
    
    // Recalculate if route exists
    if (this.origin && this.destination) {
      this.handleCalculateRoute();
    }
  }

  /**
   * Handle optimize route
   */
  async handleOptimizeRoute() {
    if (!this.origin || !this.destination || this.isCalculating) {
      return;
    }

    const waypoints = this.waypointManager.getWaypoints();
    if (waypoints.length < 2) {
      this.showError('Cần ít nhất 2 điểm dừng để tối ưu hóa');
      return;
    }

    this.isCalculating = true;
    this.showLoading(true, 'Đang tối ưu hóa tuyến đường...');

    try {
      const result = await this.routeManager.optimizeWaypoints(
        this.origin,
        this.destination,
        waypoints,
        this.travelMode
      );

      if (result.success) {
        // Reorder waypoints
        const optimizedWaypoints = result.optimizedOrder.map(i => waypoints[i]);
        this.waypointManager.clearWaypoints();
        optimizedWaypoints.forEach(wp => this.waypointManager.addWaypoint(wp));
        this.renderWaypoints();

        // Show savings
        const savedKm = (result.savedDistance / 1000).toFixed(1);
        const savedMin = Math.round(result.savedDuration / 60);
        this.showSuccess(`Đã tối ưu hóa! Tiết kiệm ${savedKm} km, ${savedMin} phút`);

        // Recalculate route
        await this.handleCalculateRoute();
      } else {
        this.showError(result.error || 'Không thể tối ưu hóa tuyến đường');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      this.showError('Lỗi khi tối ưu hóa tuyến đường');
    } finally {
      this.isCalculating = false;
      this.showLoading(false);
    }
  }

  /**
   * Handle clear route
   */
  handleClearRoute() {
    this.origin = null;
    this.destination = null;
    this.waypointManager.clearWaypoints();
    this.routeManager.clearRoute();
    
    // Clear UI
    const originInput = this.container.querySelector('#routeOriginInput');
    const destInput = this.container.querySelector('#routeDestinationInput');
    if (originInput) originInput.value = '';
    if (destInput) destInput.value = '';
    
    this.container.querySelector('#clearOriginBtn').style.display = 'none';
    this.container.querySelector('#clearDestinationBtn').style.display = 'none';
    
    this.renderWaypoints();
    this.updateUI();

    // Notify to clear map
    if (this.onRouteCalculated) {
      this.onRouteCalculated({ success: false, route: null, alternatives: [] });
    }
  }

  /**
   * Auto-calculate if origin and destination are set
   */
  autoCalculateIfReady() {
    if (this.origin && this.destination && !this.isCalculating) {
      setTimeout(() => this.handleCalculateRoute(), 300);
    }
  }

  /**
   * Update UI state
   */
  updateUI() {
    const calculateBtn = this.container.querySelector('#calculateRouteBtn');
    const addWaypointBtn = this.container.querySelector('#addWaypointBtn');
    
    const hasOriginAndDest = this.origin && this.destination;
    
    if (calculateBtn) {
      calculateBtn.disabled = !hasOriginAndDest;
    }
    
    if (addWaypointBtn) {
      addWaypointBtn.disabled = !hasOriginAndDest;
    }
  }

  /**
   * Show loading indicator
   * @param {boolean} show
   * @param {string} message
   */
  showLoading(show, message = 'Đang tính toán tuyến đường...') {
    const indicator = this.container.querySelector('#routeLoadingIndicator');
    if (indicator) {
      indicator.style.display = show ? 'flex' : 'none';
      const span = indicator.querySelector('span');
      if (span) span.textContent = message;
    }
  }

  /**
   * Show success message
   * @param {string} message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message
   * @param {string} message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   * @param {string} message
   * @param {string} type
   */
  showNotification(message, type = 'info') {
    // Simple notification - can be enhanced
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `route-toast route-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#3B82F6'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Export as default for ES6 modules
export default RoutePanel;
