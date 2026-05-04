/**
 * DirectionsAPI Service
 * 
 * Handles communication with Mapbox Directions API for route calculation.
 * Supports multiple travel modes and handles errors gracefully.
 */

class DirectionsAPI {
  /**
   * @param {string} apiKey - Mapbox API access token
   */
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.mapbox.com/directions/v5/mapbox';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Fetch directions from Mapbox API
   * @param {[number, number][]} coordinates - Array of [lng, lat] coordinates
   * @param {string} profile - Mapbox profile (driving-traffic, driving, cycling, walking)
   * @param {import('../types/index.js').DirectionsOptions} options - Request options
   * @returns {Promise<import('../types/index.js').DirectionsResponse>}
   */
  async fetchDirections(coordinates, profile, options = {}) {
    if (!coordinates || coordinates.length < 2) {
      throw new Error('At least 2 coordinates required');
    }

    if (coordinates.length > 25) {
      throw new Error('Maximum 25 waypoints allowed');
    }

    const url = this.buildRequestURL(coordinates, profile, options);
    
    // Retry logic with exponential backoff
    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit - wait and retry
            await this.sleep(this.retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return this.parseResponse(data);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries - 1) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Failed to fetch directions');
  }

  /**
   * Build Mapbox Directions API request URL
   * @param {[number, number][]} coordinates - Array of [lng, lat]
   * @param {string} profile - Mapbox profile
   * @param {import('../types/index.js').DirectionsOptions} options - Request options
   * @returns {string} Complete API URL
   */
  buildRequestURL(coordinates, profile, options) {
    // Format coordinates as "lng,lat;lng,lat;..."
    const coordsStr = coordinates
      .map(coord => `${coord[0]},${coord[1]}`)
      .join(';');

    // Build query parameters
    const params = new URLSearchParams({
      access_token: this.apiKey,
      alternatives: options.alternatives !== false ? 'true' : 'false',
      steps: options.steps !== false ? 'true' : 'false',
      geometries: options.geometries || 'geojson',
      overview: options.overview || 'full',
      continue_straight: options.continue_straight !== false ? 'true' : 'false',
    });

    // Add optional waypoint parameters
    if (options.waypoints && options.waypoints.length > 0) {
      params.append('waypoints', options.waypoints.join(';'));
    }

    if (options.waypoint_names && options.waypoint_names.length > 0) {
      params.append('waypoint_names', options.waypoint_names.join(';'));
    }

    return `${this.baseURL}/${profile}/${coordsStr}?${params.toString()}`;
  }

  /**
   * Parse Mapbox API response
   * @param {Object} response - Raw API response
   * @returns {import('../types/index.js').DirectionsResponse}
   */
  parseResponse(response) {
    if (response.code !== 'Ok') {
      throw new Error(response.message || 'Route calculation failed');
    }

    if (!response.routes || response.routes.length === 0) {
      throw new Error('No routes found');
    }

    return {
      routes: response.routes.map(route => ({
        id: this.generateRouteId(),
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        steps: route.legs?.[0]?.steps || [],
        waypoints: response.waypoints || [],
        travelMode: this.extractTravelMode(response),
        createdAt: Date.now(),
      })),
      waypoints: response.waypoints || [],
      code: response.code,
      message: response.message,
    };
  }

  /**
   * Generate unique route ID
   * @returns {string}
   */
  generateRouteId() {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract travel mode from response
   * @param {Object} response - API response
   * @returns {import('../types/index.js').TravelMode}
   */
  extractTravelMode(response) {
    // Default to driving if not specified
    return 'driving';
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export as default for ES6 modules
export default DirectionsAPI;
