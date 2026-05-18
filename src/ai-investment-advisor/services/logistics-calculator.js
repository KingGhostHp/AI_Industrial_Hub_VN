/**
 * LogisticsCalculator - Calculates logistics costs and scores for industrial zones
 * 
 * This service calculates transportation costs from industrial zones to strategic
 * locations (ports, airports, city centers) and computes overall logistics scores.
 * 
 * @module ai-investment-advisor/services/logistics-calculator
 */

import DistanceCalculator from '../../nearest-locations/utils/DistanceCalculator.js';

/**
 * Cost rate for truck transportation in VND per kilometer
 * Based on Requirement 3.3
 */
const COST_PER_KM = 15000; // VND per km

/**
 * LogisticsCalculator class
 * 
 * Provides methods to calculate logistics costs, find nearest strategic locations,
 * and compute logistics scores for industrial zones.
 */
class LogisticsCalculator {
  /**
   * Initialize LogisticsCalculator
   * 
   * @param {Object} strategicLocations - Strategic locations data
   * @param {Object} strategicLocations.ports - GeoJSON FeatureCollection of ports
   * @param {Object} strategicLocations.airports - GeoJSON FeatureCollection of airports
   * @param {Object} strategicLocations.cityCenters - GeoJSON FeatureCollection of city centers
   */
  constructor(strategicLocations = {}) {
    this.distanceCalculator = new DistanceCalculator();
    this.strategicLocations = {
      ports: strategicLocations.ports || { type: 'FeatureCollection', features: [] },
      airports: strategicLocations.airports || { type: 'FeatureCollection', features: [] },
      cityCenters: strategicLocations.cityCenters || { type: 'FeatureCollection', features: [] }
    };
    
    console.log('[LogisticsCalculator] Initialized with strategic locations:', {
      ports: this.strategicLocations.ports.features?.length || 0,
      airports: this.strategicLocations.airports.features?.length || 0,
      cityCenters: this.strategicLocations.cityCenters.features?.length || 0
    });
  }

  /**
   * Calculate logistics cost from zone to a specific location
   * 
   * Uses the formula: cost = distance × COST_PER_KM
   * 
   * @param {Object} zone - Zone with coordinates (GeoJSON Feature or coordinates array)
   * @param {Object} location - Strategic location (GeoJSON Feature or coordinates array)
   * @param {String} transportMode - Transport mode ('truck', 'rail', 'sea') - currently only 'truck' is implemented
   * @returns {Object} - { distance: number, cost: number, time: number|null }
   * @throws {Error} If coordinates are invalid
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  calculateCost(zone, location, transportMode = 'truck') {
    // Extract coordinates from zone and location
    const zoneCoords = this._extractCoordinates(zone);
    const locationCoords = this._extractCoordinates(location);

    // Validate coordinates
    if (!this.distanceCalculator.validateCoordinates(zoneCoords)) {
      const errorMsg = `Invalid zone coordinates: ${JSON.stringify(zoneCoords)}`;
      console.error('[LogisticsCalculator]', errorMsg);
      throw new Error(errorMsg);
    }

    if (!this.distanceCalculator.validateCoordinates(locationCoords)) {
      const errorMsg = `Invalid location coordinates: ${JSON.stringify(locationCoords)}`;
      console.error('[LogisticsCalculator]', errorMsg);
      throw new Error(errorMsg);
    }

    // Calculate distance using DistanceCalculator
    const distance = this.distanceCalculator.calculateDistance(zoneCoords, locationCoords);

    // Calculate cost based on transport mode
    let cost;
    let time = null; // Time estimation not implemented yet

    switch (transportMode) {
      case 'truck':
        cost = distance * COST_PER_KM;
        break;
      case 'rail':
        // Rail transport not implemented yet, use truck rate as fallback
        console.warn('[LogisticsCalculator] Rail transport mode not implemented, using truck rate');
        cost = distance * COST_PER_KM;
        break;
      case 'sea':
        // Sea transport not implemented yet, use truck rate as fallback
        console.warn('[LogisticsCalculator] Sea transport mode not implemented, using truck rate');
        cost = distance * COST_PER_KM;
        break;
      default:
        console.warn(`[LogisticsCalculator] Unknown transport mode: ${transportMode}, using truck`);
        cost = distance * COST_PER_KM;
    }

    console.debug('[LogisticsCalculator] Cost calculated:', {
      distance,
      cost,
      transportMode,
      time
    });

    return {
      distance,
      cost,
      time
    };
  }

  /**
   * Find nearest strategic locations of a specific type
   * 
   * Returns up to `limit` nearest locations sorted by distance in ascending order.
   * 
   * @param {Object} zone - Zone with coordinates (GeoJSON Feature or coordinates array)
   * @param {String} locationType - Type of location ('port', 'airport', 'city_center')
   * @param {Number} limit - Maximum number of results (default 3)
   * @returns {Array} - Array of { feature, distance, cost, name } sorted by distance
   * @throws {Error} If zone coordinates are invalid
   * 
   * **Validates: Requirements 3.4, 3.6**
   */
  findNearestLocations(zone, locationType, limit = 3) {
    // Extract zone coordinates
    const zoneCoords = this._extractCoordinates(zone);

    // Validate zone coordinates
    if (!this.distanceCalculator.validateCoordinates(zoneCoords)) {
      const errorMsg = `Invalid zone coordinates: ${JSON.stringify(zoneCoords)}`;
      console.error('[LogisticsCalculator]', errorMsg);
      throw new Error(errorMsg);
    }

    // Get locations of the specified type
    const locations = this._getLocationsByType(locationType);

    if (!locations || locations.length === 0) {
      // Return empty without spamming warning for each province enrichment
      return [];
    }

    console.debug(`[LogisticsCalculator] Finding nearest ${locationType} from ${locations.length} locations`);

    // Calculate distance and cost for each location
    const results = [];
    let invalidCount = 0;

    for (const location of locations) {
      const locationCoords = this._extractCoordinates(location);

      // Skip locations with invalid coordinates
      if (!this.distanceCalculator.validateCoordinates(locationCoords)) {
        console.warn('[LogisticsCalculator] Skipping location with invalid coordinates:', {
          name: location.properties?.name || 'Unknown',
          coordinates: locationCoords
        });
        invalidCount++;
        continue;
      }

      try {
        const distance = this.distanceCalculator.calculateDistance(zoneCoords, locationCoords);
        const cost = distance * COST_PER_KM;
        const name = this._extractDisplayName(location);

        results.push({
          feature: location,
          distance,
          cost,
          name
        });
      } catch (error) {
        console.error('[LogisticsCalculator] Error calculating distance:', {
          error: error.message,
          location: location.properties?.name || 'Unknown'
        });
        invalidCount++;
      }
    }

    // Log data quality issues
    if (invalidCount > 0) {
      console.warn(`[LogisticsCalculator] Skipped ${invalidCount} locations with invalid data`);
    }

    // Sort by distance (ascending)
    results.sort((a, b) => a.distance - b.distance);

    // Return top N results
    const topResults = results.slice(0, limit);

    console.log(`[LogisticsCalculator] Found ${topResults.length} nearest ${locationType}:`, 
      topResults.map(r => ({ name: r.name, distance: r.distance, cost: r.cost }))
    );

    return topResults;
  }

  /**
   * Calculate total logistics score for a zone
   * 
   * The logistics score is calculated based on average distance to strategic locations:
   * - Find nearest port, airport, and city center
   * - Calculate average distance
   * - Score = 100 × (1 - avgDistance / maxDistance)
   * 
   * Score ranges from 0 (worst) to 100 (best).
   * 
   * @param {Object} zone - Zone with coordinates (GeoJSON Feature or coordinates array)
   * @returns {Number} - Logistics score (0-100)
   * @throws {Error} If zone coordinates are invalid
   * 
   * **Validates: Requirements 3.1, 3.2, 3.4**
   */
  calculateLogisticsScore(zone) {
    // Extract zone coordinates
    const zoneCoords = this._extractCoordinates(zone);

    // Validate zone coordinates
    if (!this.distanceCalculator.validateCoordinates(zoneCoords)) {
      const errorMsg = `Invalid zone coordinates: ${JSON.stringify(zoneCoords)}`;
      console.error('[LogisticsCalculator]', errorMsg);
      throw new Error(errorMsg);
    }

    // Find nearest locations for each type
    const nearestPort = this.findNearestLocations(zone, 'port', 1)[0];
    const nearestAirport = this.findNearestLocations(zone, 'airport', 1)[0];
    const nearestCityCenter = this.findNearestLocations(zone, 'city_center', 1)[0];

    // Collect distances (use 0 if location not found)
    const distances = [];
    if (nearestPort) distances.push(nearestPort.distance);
    if (nearestAirport) distances.push(nearestAirport.distance);
    if (nearestCityCenter) distances.push(nearestCityCenter.distance);

    // If no strategic locations found, return 0 score
    if (distances.length === 0) {
      return 0;
    }

    // Calculate average distance
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;

    // Define maximum distance for normalization (300 km increases contrast for Vietnam)
    const maxDistance = 300;

    // Calculate score: 100 × (1 - avgDistance / maxDistance)
    // console.log(`[LogisticsCalculator] ${zone.properties?.name || 'Zone'} - Avg Distance: ${avgDistance.toFixed(1)}km`);
    // Clamp to [0, 100] range
    let score = 100 * (1 - avgDistance / maxDistance);
    score = Math.max(0, Math.min(100, score));

    console.log('[LogisticsCalculator] Logistics score calculated:', {
      avgDistance,
      score,
      nearestPort: nearestPort?.name || 'N/A',
      nearestAirport: nearestAirport?.name || 'N/A',
      nearestCityCenter: nearestCityCenter?.name || 'N/A'
    });

    return score;
  }

  /**
   * Extract coordinates from a zone or location object
   * 
   * Handles both GeoJSON Feature objects and raw coordinate arrays.
   * 
   * @private
   * @param {Object|Array} obj - GeoJSON Feature or coordinates array [lng, lat]
   * @returns {Array} - Coordinates array [lng, lat]
   */
  _extractCoordinates(obj) {
    // If it's already a coordinate array
    if (Array.isArray(obj) && obj.length === 2) {
      return obj;
    }

    // If it's a GeoJSON Feature
    if (obj && obj.geometry && obj.geometry.coordinates) {
      return obj.geometry.coordinates;
    }

    // If it has coordinates property directly
    if (obj && obj.coordinates) {
      return obj.coordinates;
    }

    // Invalid format
    console.error('[LogisticsCalculator] Cannot extract coordinates from object:', obj);
    return [NaN, NaN];
  }

  /**
   * Extract display name from a location feature
   * 
   * @private
   * @param {Object} feature - GeoJSON Feature
   * @returns {String} - Display name
   */
  _extractDisplayName(feature) {
    const props = feature.properties || {};
    
    // Prefer Vietnamese name, fallback to English name, then to generic label
    return props.name || props['name:en'] || props.Name || 'Unknown Location';
  }

  /**
   * Get locations by type from strategic locations data
   * 
   * @private
   * @param {String} locationType - 'port', 'airport', or 'city_center'
   * @returns {Array} - Array of GeoJSON Features
   */
  _getLocationsByType(locationType) {
    switch (locationType) {
      case 'port':
        return this.strategicLocations.ports.features || [];
      case 'airport':
        return this.strategicLocations.airports.features || [];
      case 'city_center':
        return this.strategicLocations.cityCenters.features || [];
      default:
        console.warn(`[LogisticsCalculator] Unknown location type: ${locationType}`);
        return [];
    }
  }
}

export default LogisticsCalculator;
