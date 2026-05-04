/**
 * RouteCalculator - Calculates optimal driving routes using Mapbox Directions API
 * Implements retry logic and 24-hour caching
 */
class RouteCalculator {
  /**
   * @param {string} mapboxToken - Mapbox API access token
   */
  constructor(mapboxToken) {
    this.mapboxToken = mapboxToken;
    this.baseUrl = 'https://api.mapbox.com/directions/v5/mapbox/driving';
  }

  /**
   * Calculate optimal driving route
   * @param {Array<number>} origin - [lng, lat]
   * @param {Array<number>} destination - [lng, lat]
   * @returns {Promise<Object>} Route data
   * {
   *   distance: number,      // meters
   *   duration: number,      // seconds
   *   geometry: Object,      // GeoJSON LineString
   *   success: boolean
   * }
   */
  async calculateRoute(origin, destination) {
    console.log('[RouteCalculator] Calculating route:', { origin, destination });
    
    // Check cache first (Requirement 3.7)
    const cachedRoute = this._getCachedRoute(origin, destination);
    if (cachedRoute) {
      console.log('[RouteCalculator] Using cached route');
      return cachedRoute;
    }

    // Try API request (Requirement 3.1)
    try {
      console.log('[RouteCalculator] Making initial API request...');
      const routeData = await this._makeApiRequest(origin, destination);
      if (routeData.success) {
        console.log('[RouteCalculator] Route calculated successfully:', {
          distance: routeData.distance,
          duration: routeData.duration
        });
        this._cacheRoute(origin, destination, routeData);
        return routeData;
      }
    } catch (error) {
      console.error('[RouteCalculator] Initial route calculation failed:', {
        error: error.message,
        origin,
        destination
      });
    }

    // Retry after 1 second (Requirement 3.5)
    try {
      console.log('[RouteCalculator] Retrying after 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const routeData = await this._makeApiRequest(origin, destination);
      if (routeData.success) {
        console.log('[RouteCalculator] Route calculated successfully on retry');
        this._cacheRoute(origin, destination, routeData);
        return routeData;
      }
    } catch (error) {
      console.error('[RouteCalculator] Retry route calculation failed:', {
        error: error.message,
        origin,
        destination
      });
    }

    // Both attempts failed - graceful degradation (Requirement 3.6)
    console.warn('[RouteCalculator] All route calculation attempts failed, returning error state');
    return {
      success: false,
      error: 'Không thể tính toán tuyến đường'
    };
  }

  /**
   * Make API request to Mapbox Directions API
   * @private
   * @param {Array<number>} origin - [lng, lat]
   * @param {Array<number>} destination - [lng, lat]
   * @returns {Promise<Object>} Route data
   */
  async _makeApiRequest(origin, destination) {
    const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
    const url = `${this.baseUrl}/${coordinates}?geometries=geojson&access_token=${this.mapboxToken}`;

    console.debug('[RouteCalculator] API request URL:', url.replace(this.mapboxToken, 'TOKEN_HIDDEN'));

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorMsg = `API request failed with status ${response.status}`;
        console.error('[RouteCalculator] API error:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Validate response (Requirement 8.3)
      const validation = this._validateApiResponse(data);
      if (!validation.valid) {
        console.error('[RouteCalculator] Invalid API response:', validation.error);
        throw new Error(validation.error);
      }

      const route = data.routes[0];
      console.debug('[RouteCalculator] Valid route received:', {
        distance: route.distance,
        duration: route.duration,
        coordinateCount: route.geometry.coordinates.length
      });

      return {
        success: true,
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry
      };
    } catch (error) {
      console.error('[RouteCalculator] API request error:', error);
      throw error;
    }
  }

  /**
   * Validate API response contains required fields
   * @private
   * @param {Object} response - API response
   * @returns {Object} Validation result { valid: boolean, error?: string }
   */
  _validateApiResponse(response) {
    if (!response || !response.routes || response.routes.length === 0) {
      return { valid: false, error: 'No routes in response' };
    }

    const route = response.routes[0];

    if (typeof route.distance !== 'number') {
      return { valid: false, error: 'Missing distance field' };
    }

    if (typeof route.duration !== 'number') {
      return { valid: false, error: 'Missing duration field' };
    }

    if (!route.geometry || !route.geometry.coordinates) {
      return { valid: false, error: 'Missing geometry field' };
    }

    return { valid: true };
  }

  /**
   * Format travel time as "X giờ Y phút"
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted time string
   */
  formatTravelTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0 || !isFinite(seconds)) {
      return '0 phút';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes} phút`;
    }

    if (minutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours} giờ ${minutes} phút`;
  }

  /**
   * Check cache for existing route
   * @private
   * @param {Array<number>} origin - [lng, lat]
   * @param {Array<number>} destination - [lng, lat]
   * @returns {Object|null} Cached route data or null
   */
  _getCachedRoute(origin, destination) {
    const key = this._generateCacheKey(origin, destination);
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        console.debug('[RouteCalculator] No cached route found');
        return null;
      }

      const entry = JSON.parse(cached);
      const now = Date.now();

      // Check if cache has expired (24 hours)
      if (now > entry.expiresAt) {
        console.debug('[RouteCalculator] Cached route expired, removing from cache');
        localStorage.removeItem(key);
        return null;
      }

      console.debug('[RouteCalculator] Found valid cached route');
      return entry.data;
    } catch (error) {
      console.error('[RouteCalculator] Error reading from cache:', error);
      // Gracefully handle cache errors by returning null
      return null;
    }
  }

  /**
   * Save route to cache with 24-hour expiry
   * @private
   * @param {Array<number>} origin - [lng, lat]
   * @param {Array<number>} destination - [lng, lat]
   * @param {Object} routeData - Route data to cache
   */
  _cacheRoute(origin, destination, routeData) {
    const key = this._generateCacheKey(origin, destination);
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours in milliseconds

    const entry = {
      data: routeData,
      timestamp: now,
      expiresAt: expiresAt
    };

    try {
      localStorage.setItem(key, JSON.stringify(entry));
      console.debug('[RouteCalculator] Route cached successfully:', {
        key,
        expiresAt: new Date(expiresAt).toISOString()
      });
    } catch (error) {
      console.error('[RouteCalculator] Error writing to cache:', error);
      // Gracefully handle cache errors - don't throw, just log
      if (error.name === 'QuotaExceededError') {
        console.warn('[RouteCalculator] LocalStorage quota exceeded, cache not saved');
      }
    }
  }

  /**
   * Generate cache key from coordinates
   * @private
   * @param {Array<number>} origin - [lng, lat]
   * @param {Array<number>} destination - [lng, lat]
   * @returns {string} Cache key
   */
  _generateCacheKey(origin, destination) {
    return `route_${origin[0]},${origin[1]}_${destination[0]},${destination[1]}`;
  }
}

export default RouteCalculator;
