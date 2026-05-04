/**
 * Nearest Strategic Locations Feature
 * 
 * Main entry point for the nearest strategic locations feature.
 * This module orchestrates the discovery and display of nearest seaports,
 * airports, and city centers for industrial zones.
 * 
 * Requirements: 1.1, 1.2, 1.3, 7.1
 */

import DistanceCalculator from './utils/DistanceCalculator.js';
import RouteCalculator from './utils/RouteCalculator.js';
import NearestLocationFinder from './utils/NearestLocationFinder.js';
import RouteVisualizer from './components/RouteVisualizer.js';
import InformationPanel from './components/InformationPanel.js';

/**
 * Main orchestrator class for nearest strategic locations feature
 * Handles the complete workflow from user click to displaying results
 */
class NearestLocationsOrchestrator {
  /**
   * @param {mapboxgl.Map} map - Mapbox GL JS map instance
   * @param {Object} locationManager - LocationManager instance for data access
   * @param {string} mapboxToken - Mapbox API access token
   * @param {string} infoPanelContainerId - ID of the information panel container element
   */
  constructor(map, locationManager, mapboxToken, infoPanelContainerId) {
    if (!map) {
      throw new Error('Map instance is required');
    }
    if (!locationManager) {
      throw new Error('LocationManager instance is required');
    }
    if (!mapboxToken) {
      throw new Error('Mapbox token is required');
    }

    this.map = map;
    this.locationManager = locationManager;
    
    // Initialize utility classes
    this.distanceCalculator = new DistanceCalculator();
    this.routeCalculator = new RouteCalculator(mapboxToken);
    this.nearestLocationFinder = new NearestLocationFinder(locationManager, this.distanceCalculator);
    
    // Initialize UI components
    this.routeVisualizer = new RouteVisualizer(map);
    this.informationPanel = new InformationPanel(infoPanelContainerId);
    
    // Debouncing state (Requirement 7.1: 300ms window)
    this.debounceTimer = null;
    this.DEBOUNCE_DELAY = 300; // milliseconds
    
    // Current processing state
    this.isProcessing = false;
    this.currentIndustrialZone = null;
  }

  /**
   * Handle industrial zone marker click with debouncing
   * Requirement 7.1: Debounce rapid clicks within 300ms window
   * 
   * @param {Object} industrialZone - GeoJSON Feature of the clicked industrial zone
   */
  handleIndustrialZoneClick(industrialZone) {
    if (!industrialZone || !industrialZone.geometry || !industrialZone.geometry.coordinates) {
      console.error('[NearestLocationsOrchestrator] Invalid industrial zone feature:', industrialZone);
      this.informationPanel.showError(
        'Lỗi: Dữ liệu khu công nghiệp không hợp lệ',
        null
      );
      return;
    }

    console.log('[NearestLocationsOrchestrator] Industrial zone clicked:', 
      industrialZone.properties?.name || 'Unknown');

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      console.debug('[NearestLocationsOrchestrator] Debouncing: cleared previous timer');
    }

    // Set new debounce timer - only process the most recent click
    this.debounceTimer = setTimeout(() => {
      this._processIndustrialZoneClick(industrialZone);
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Process industrial zone click after debouncing
   * Implements complete data flow: click → find → calculate → visualize → display
   * 
   * @private
   * @param {Object} industrialZone - GeoJSON Feature of the industrial zone
   */
  async _processIndustrialZoneClick(industrialZone) {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[NearestLocationsOrchestrator] Already processing a request, skipping...');
      return;
    }

    this.isProcessing = true;
    this.currentIndustrialZone = industrialZone;

    const industrialZoneName = industrialZone.properties?.name || 'Khu công nghiệp';
    console.log(`[NearestLocationsOrchestrator] Processing: ${industrialZoneName}`);

    try {
      // Step 1: Show loading state (Requirement 6.1)
      this.informationPanel.showLoading(industrialZoneName);
      console.log(`[NearestLocationsOrchestrator] 🔍 Finding nearest locations for: ${industrialZoneName}`);

      // Step 2: Find nearest strategic locations (Requirements 1.1, 1.2, 1.3)
      const nearestLocations = await this.nearestLocationFinder.findNearestLocations(industrialZone);
      console.log('[NearestLocationsOrchestrator] 📍 Nearest locations found:', {
        seaport: nearestLocations.seaport?.name || 'None',
        airport: nearestLocations.airport?.name || 'None',
        city_center: nearestLocations.city_center?.name || 'None'
      });

      // Check if any locations were found
      const hasAnyLocation = nearestLocations.seaport || nearestLocations.airport || nearestLocations.city_center;
      if (!hasAnyLocation) {
        console.warn('[NearestLocationsOrchestrator] No strategic locations found');
        this.informationPanel.showError(
          'Không tìm thấy địa điểm chiến lược nào. Vui lòng kiểm tra dữ liệu.',
          () => this._processIndustrialZoneClick(industrialZone)
        );
        return;
      }

      // Step 3: Calculate routes for each location (Requirement 3.1)
      const routeResults = await this._calculateRoutes(industrialZone, nearestLocations);
      console.log('[NearestLocationsOrchestrator] 🛣️ Routes calculated');

      // Step 4: Visualize routes on map (Requirement 4.1)
      this._visualizeRoutes(routeResults);
      console.log('[NearestLocationsOrchestrator] 🗺️ Routes visualized on map');

      // Step 5: Display information in panel (Requirement 5.1)
      this._displayResults(industrialZoneName, nearestLocations, routeResults);
      console.log('[NearestLocationsOrchestrator] ✅ Results displayed in information panel');

    } catch (error) {
      console.error('[NearestLocationsOrchestrator] Error processing industrial zone click:', {
        error: error.message,
        stack: error.stack,
        industrialZone: industrialZoneName
      });
      
      // Show error state with user-friendly Vietnamese message (Requirement 6.4)
      this.informationPanel.showError(
        'Không thể tính toán tuyến đường. Vui lòng thử lại.',
        () => this._processIndustrialZoneClick(industrialZone)
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calculate routes for all nearest locations
   * @private
   * @param {Object} industrialZone - GeoJSON Feature of the industrial zone
   * @param {Object} nearestLocations - Object with seaport, airport, city_center
   * @returns {Promise<Object>} Route results for each location type
   */
  async _calculateRoutes(industrialZone, nearestLocations) {
    const origin = industrialZone.geometry.coordinates;
    const routeResults = {};

    console.log('[NearestLocationsOrchestrator] Calculating routes...');

    // Calculate routes in parallel for better performance
    const routePromises = [];
    const locationTypes = ['seaport', 'airport', 'city_center'];

    for (const type of locationTypes) {
      const location = nearestLocations[type];
      
      if (location && location.feature) {
        const destination = location.feature.geometry.coordinates;
        
        routePromises.push(
          this.routeCalculator.calculateRoute(origin, destination)
            .then(routeData => {
              routeResults[type] = {
                ...location,
                routeData
              };
              console.debug(`[NearestLocationsOrchestrator] Route calculated for ${type}:`, 
                routeData.success ? 'Success' : 'Failed');
            })
            .catch(error => {
              console.error(`[NearestLocationsOrchestrator] Error calculating route for ${type}:`, {
                error: error.message,
                location: location.name
              });
              // Graceful degradation: store error but continue (Requirement 3.6)
              routeResults[type] = {
                ...location,
                routeData: { success: false, error: error.message }
              };
            })
        );
      } else {
        // No location found for this type
        console.debug(`[NearestLocationsOrchestrator] No ${type} location to calculate route for`);
        routeResults[type] = null;
      }
    }

    // Wait for all route calculations to complete
    await Promise.all(routePromises);

    // Log summary
    const successCount = Object.values(routeResults).filter(r => r?.routeData?.success).length;
    const totalCount = Object.values(routeResults).filter(r => r !== null).length;
    console.log(`[NearestLocationsOrchestrator] Route calculation complete: ${successCount}/${totalCount} successful`);

    return routeResults;
  }

  /**
   * Visualize routes on the map
   * Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   * 
   * @private
   * @param {Object} routeResults - Route results for each location type
   */
  _visualizeRoutes(routeResults) {
    console.log('[NearestLocationsOrchestrator] Visualizing routes...');
    
    const routes = [];

    // Prepare route data for visualization
    for (const [type, result] of Object.entries(routeResults)) {
      if (result && result.routeData && result.routeData.success) {
        routes.push({
          type: type,
          geometry: result.routeData.geometry,
          destination: {
            name: result.name,
            coordinates: result.feature.geometry.coordinates
          }
        });
      } else if (result && result.routeData && !result.routeData.success) {
        console.warn(`[NearestLocationsOrchestrator] Skipping visualization for ${type} due to route calculation failure`);
      }
    }

    if (routes.length === 0) {
      console.warn('[NearestLocationsOrchestrator] No successful routes to visualize');
      return;
    }

    // Render routes on map (clears previous routes automatically)
    try {
      this.routeVisualizer.renderRoutes(routes);
      console.log(`[NearestLocationsOrchestrator] Successfully visualized ${routes.length} routes`);
    } catch (error) {
      console.error('[NearestLocationsOrchestrator] Error visualizing routes:', error);
      // Don't throw - gracefully continue to display information panel
    }
  }

  /**
   * Display results in information panel
   * Requirements 5.1, 5.2, 5.3, 5.4, 5.5
   * 
   * @private
   * @param {string} industrialZoneName - Name of the industrial zone
   * @param {Object} nearestLocations - Nearest locations found
   * @param {Object} routeResults - Route calculation results
   */
  _displayResults(industrialZoneName, nearestLocations, routeResults) {
    console.log('[NearestLocationsOrchestrator] Displaying results...');
    
    const results = {};

    // Format results for each location type
    const locationTypes = ['seaport', 'airport', 'city_center'];
    
    for (const type of locationTypes) {
      const result = routeResults[type];
      
      if (result && result.feature) {
        const routeData = result.routeData;
        
        results[type] = {
          name: result.name,
          straightDistance: result.distance, // Already formatted to 1 decimal by DistanceCalculator
          routeDistance: routeData.success ? (routeData.distance / 1000).toFixed(1) : null, // Convert meters to km
          travelTime: routeData.success ? this.routeCalculator.formatTravelTime(routeData.duration) : null,
          available: true
        };

        // Log warning if route calculation failed but location was found (Requirement 3.6)
        if (!routeData.success) {
          console.warn(`[NearestLocationsOrchestrator] Route calculation failed for ${type}, showing straight-line distance only`);
        }
      } else {
        // No location found for this type (Requirement 1.5)
        console.debug(`[NearestLocationsOrchestrator] No ${type} available`);
        results[type] = {
          name: null,
          straightDistance: null,
          routeDistance: null,
          travelTime: null,
          available: false
        };
      }
    }

    // Display results in information panel
    try {
      this.informationPanel.displayResults(industrialZoneName, results);
      console.log('[NearestLocationsOrchestrator] Results displayed successfully');
    } catch (error) {
      console.error('[NearestLocationsOrchestrator] Error displaying results:', error);
      throw error; // Re-throw to be caught by main error handler
    }
  }

  /**
   * Clear all routes and hide information panel
   */
  clear() {
    console.log('[NearestLocationsOrchestrator] Clearing routes and panel');
    try {
      this.routeVisualizer.clearRoutes();
      this.informationPanel.hide();
      this.currentIndustrialZone = null;
    } catch (error) {
      console.error('[NearestLocationsOrchestrator] Error clearing:', error);
    }
  }

  /**
   * Get current industrial zone being displayed
   * @returns {Object|null} Current industrial zone feature
   */
  getCurrentIndustrialZone() {
    return this.currentIndustrialZone;
  }
}

/**
 * Initialize the nearest strategic locations feature
 * @param {mapboxgl.Map} map - Mapbox GL JS map instance
 * @param {Object} locationManager - LocationManager instance for data access
 * @param {string} mapboxToken - Mapbox API access token
 * @param {string} infoPanelContainerId - ID of the information panel container element
 * @returns {NearestLocationsOrchestrator} Orchestrator instance
 */
function initializeNearestLocations(map, locationManager, mapboxToken, infoPanelContainerId = 'nearest-locations-panel') {
  console.log('[initializeNearestLocations] 🚀 Initializing Nearest Strategic Locations feature...');
  
  try {
    // Validate required parameters
    if (!map) {
      throw new Error('Map instance is required');
    }
    if (!locationManager) {
      throw new Error('LocationManager instance is required');
    }
    if (!mapboxToken) {
      throw new Error('Mapbox token is required');
    }

    const orchestrator = new NearestLocationsOrchestrator(
      map,
      locationManager,
      mapboxToken,
      infoPanelContainerId
    );
    
    console.log('[initializeNearestLocations] ✅ Nearest Strategic Locations feature initialized successfully');
    return orchestrator;
  } catch (error) {
    console.error('[initializeNearestLocations] ❌ Failed to initialize Nearest Strategic Locations feature:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// ES module exports
export { NearestLocationsOrchestrator, initializeNearestLocations };
export default { NearestLocationsOrchestrator, initializeNearestLocations };
