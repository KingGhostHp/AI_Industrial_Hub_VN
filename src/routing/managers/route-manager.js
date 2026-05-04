/**
 * RouteManager
 * 
 * Manages route calculation, optimization, and selection.
 * Integrates with DirectionsAPI to fetch routes from Mapbox.
 */

class RouteManager {
  /**
   * @param {import('../services/directions-api.js')} directionsAPI
   */
  constructor(directionsAPI) {
    this.directionsAPI = directionsAPI;
    /** @type {import('../types/index.js').Route | null} */
    this.currentRoute = null;
    /** @type {import('../types/index.js').Route[]} */
    this.alternativeRoutes = [];
  }

  /**
   * Calculate route
   * @param {import('../types/index.js').Waypoint} origin
   * @param {import('../types/index.js').Waypoint} destination
   * @param {import('../types/index.js').Waypoint[]} waypoints
   * @param {import('../types/index.js').RouteOptions} options
   * @returns {Promise<import('../types/index.js').RouteResult>}
   */
  async calculateRoute(origin, destination, waypoints, options) {
    try {
      // Validate inputs
      if (!origin || !destination) {
        throw new Error('Origin and destination required');
      }

      // Build coordinates array: origin -> waypoints -> destination
      const coordinates = [
        origin.coordinates,
        ...waypoints.map(wp => wp.coordinates),
        destination.coordinates,
      ];

      // Map travel mode to Mapbox profile
      const profile = this.travelModeToProfile(options.travelMode);

      // Fetch directions
      const response = await this.directionsAPI.fetchDirections(
        coordinates,
        profile,
        {
          alternatives: options.alternatives !== false,
          steps: options.steps !== false,
          geometries: options.geometries || 'geojson',
          overview: options.overview || 'full',
        }
      );

      // Store routes
      if (response.routes.length > 0) {
        this.currentRoute = {
          ...response.routes[0],
          travelMode: options.travelMode,
          waypoints: [origin, ...waypoints, destination],
        };
        
        this.alternativeRoutes = response.routes.slice(1).map(route => ({
          ...route,
          travelMode: options.travelMode,
          waypoints: [origin, ...waypoints, destination],
        }));

        // Sort alternatives by duration
        this.alternativeRoutes.sort((a, b) => a.duration - b.duration);
      }

      return {
        success: true,
        route: this.currentRoute,
        alternatives: this.alternativeRoutes,
      };
    } catch (error) {
      console.error('Route calculation failed:', error);
      return {
        success: false,
        route: null,
        alternatives: [],
        error: this.formatError(error),
      };
    }
  }

  /**
   * Optimize waypoint order
   * @param {import('../types/index.js').Waypoint} origin
   * @param {import('../types/index.js').Waypoint} destination
   * @param {import('../types/index.js').Waypoint[]} waypoints
   * @param {import('../types/index.js').TravelMode} travelMode
   * @returns {Promise<import('../types/index.js').OptimizedResult>}
   */
  async optimizeWaypoints(origin, destination, waypoints, travelMode) {
    try {
      if (waypoints.length < 2) {
        return {
          success: false,
          optimizedOrder: [],
          savedDistance: 0,
          savedDuration: 0,
          error: 'At least 2 waypoints required for optimization',
        };
      }

      // Calculate current route
      const currentResult = await this.calculateRoute(
        origin,
        destination,
        waypoints,
        { travelMode, alternatives: false }
      );

      if (!currentResult.success || !currentResult.route) {
        throw new Error('Failed to calculate current route');
      }

      const currentDistance = currentResult.route.distance;
      const currentDuration = currentResult.route.duration;

      // Try different permutations (simplified - in production use proper TSP algorithm)
      // For now, just try a few random permutations
      let bestOrder = waypoints.map((_, i) => i);
      let bestDistance = currentDistance;
      let bestDuration = currentDuration;

      const maxAttempts = Math.min(10, this.factorial(waypoints.length));
      for (let i = 0; i < maxAttempts; i++) {
        const shuffled = this.shuffleArray([...waypoints]);
        const result = await this.calculateRoute(
          origin,
          destination,
          shuffled,
          { travelMode, alternatives: false }
        );

        if (result.success && result.route) {
          if (result.route.duration < bestDuration) {
            bestDuration = result.route.duration;
            bestDistance = result.route.distance;
            bestOrder = shuffled.map(wp => 
              waypoints.findIndex(w => w.id === wp.id)
            );
          }
        }
      }

      return {
        success: true,
        optimizedOrder: bestOrder,
        savedDistance: currentDistance - bestDistance,
        savedDuration: currentDuration - bestDuration,
      };
    } catch (error) {
      console.error('Optimization failed:', error);
      return {
        success: false,
        optimizedOrder: [],
        savedDistance: 0,
        savedDuration: 0,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get current route
   * @returns {import('../types/index.js').Route | null}
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Get alternative routes
   * @returns {import('../types/index.js').Route[]}
   */
  getAlternativeRoutes() {
    return this.alternativeRoutes;
  }

  /**
   * Select an alternative route
   * @param {number} routeIndex - Index in alternatives array
   */
  selectRoute(routeIndex) {
    if (routeIndex < 0 || routeIndex >= this.alternativeRoutes.length) {
      throw new Error('Invalid route index');
    }

    // Swap current with selected alternative
    const selected = this.alternativeRoutes[routeIndex];
    this.alternativeRoutes[routeIndex] = this.currentRoute;
    this.currentRoute = selected;

    // Re-sort alternatives
    this.alternativeRoutes.sort((a, b) => a.duration - b.duration);
  }

  /**
   * Clear current route
   */
  clearRoute() {
    this.currentRoute = null;
    this.alternativeRoutes = [];
  }

  /**
   * Map travel mode to Mapbox profile
   * @param {import('../types/index.js').TravelMode} travelMode
   * @returns {string}
   */
  travelModeToProfile(travelMode) {
    const profileMap = {
      'driving-traffic': 'driving-traffic',
      'driving': 'driving',
      'cycling': 'cycling',
      'walking': 'walking',
    };
    return profileMap[travelMode] || 'driving';
  }

  /**
   * Format error message
   * @param {Error} error
   * @returns {string}
   */
  formatError(error) {
    if (error.message.includes('No routes found')) {
      return 'Không tìm thấy tuyến đường giữa các điểm này';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Lỗi kết nối. Vui lòng thử lại';
    }
    if (error.message.includes('25 waypoints')) {
      return 'Tối đa 25 điểm dừng';
    }
    return error.message || 'Lỗi hệ thống. Vui lòng thử lại sau';
  }

  /**
   * Shuffle array (Fisher-Yates)
   * @param {Array} array
   * @returns {Array}
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Calculate factorial
   * @param {number} n
   * @returns {number}
   */
  factorial(n) {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
}

// Export as default for ES6 modules
export default RouteManager;
