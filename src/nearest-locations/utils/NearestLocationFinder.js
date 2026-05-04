/**
 * NearestLocationFinder - Finds nearest strategic locations for industrial zones
 * Uses linear search algorithm for spatial queries
 */
class NearestLocationFinder {
  /**
   * @param {Object} locationManager - LocationManager instance for data access
   * @param {DistanceCalculator} distanceCalculator - DistanceCalculator instance
   */
  constructor(locationManager, distanceCalculator) {
    this.locationManager = locationManager;
    this.distanceCalculator = distanceCalculator;
  }

  /**
   * Find nearest strategic locations for an industrial zone
   * @param {Object} industrialZone - GeoJSON Feature of the industrial zone
   * @returns {Promise<Object>} Results object with nearest locations
   * {
   *   seaport: { feature: GeoJSON, distance: number, name: string } | null,
   *   airport: { feature: GeoJSON, distance: number, name: string } | null,
   *   city_center: { feature: GeoJSON, distance: number, name: string } | null
   * }
   */
  async findNearestLocations(industrialZone) {
    console.log('[NearestLocationFinder] Finding nearest locations for industrial zone:', 
      industrialZone.properties?.name || 'Unknown');
    
    const origin = industrialZone.geometry.coordinates;

    // Validate origin coordinates
    if (!this.distanceCalculator.validateCoordinates(origin)) {
      const errorMsg = `Invalid coordinates for industrial zone: ${JSON.stringify(origin)}`;
      console.error('[NearestLocationFinder]', errorMsg);
      throw new Error(errorMsg);
    }

    const startTime = performance.now();

    // Find nearest location for each type in parallel
    const [seaport, airport, cityCenter] = await Promise.all([
      this.findNearestByType(origin, 'seaport'),
      this.findNearestByType(origin, 'airport'),
      this.findNearestByType(origin, 'city_center')
    ]);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[NearestLocationFinder] Search completed in ${duration.toFixed(2)}ms`);

    // Log warning if search took too long (Requirement 1.4: should complete within 500ms)
    if (duration > 500) {
      console.warn(`[NearestLocationFinder] Performance warning: Search took ${duration.toFixed(2)}ms (expected < 500ms)`);
    }

    return {
      seaport,
      airport,
      city_center: cityCenter
    };
  }

  /**
   * Find nearest location of a specific type
   * @param {Array<number>} origin - [lng, lat] coordinates
   * @param {string} locationType - 'seaport' | 'airport' | 'city_center'
   * @returns {Promise<Object|null>} Nearest location with distance
   */
  async findNearestByType(origin, locationType) {
    console.log(`[NearestLocationFinder] Finding nearest ${locationType}...`);
    
    // Get locations of the specified type from LocationManager
    // Note: getLocationsByType is synchronous, but we keep this method async for consistency
    const locationsData = this.locationManager.getLocationsByType(locationType);
    
    // Handle empty or missing data (Requirement 8.2)
    if (!locationsData || !locationsData.features || locationsData.features.length === 0) {
      console.warn(`[NearestLocationFinder] No ${locationType} data available`);
      return null;
    }

    const locations = locationsData.features;
    console.debug(`[NearestLocationFinder] Found ${locations.length} ${locationType} locations`);

    // Linear search for nearest location
    let minDistance = Infinity;
    let nearestLocation = null;
    let validLocationCount = 0;
    let invalidLocationCount = 0;

    for (const location of locations) {
      const coordinates = location.geometry.coordinates;

      // Validate coordinates before calculating distance (Requirement 8.1)
      if (!this.distanceCalculator.validateCoordinates(coordinates)) {
        console.warn(`[NearestLocationFinder] Invalid coordinates for location:`, {
          name: location.properties?.name || 'Unknown',
          coordinates,
          locationType
        });
        invalidLocationCount++;
        continue;
      }

      try {
        const distance = this.distanceCalculator.calculateDistance(origin, coordinates);
        validLocationCount++;

        if (distance < minDistance) {
          minDistance = distance;
          nearestLocation = location;
        }
      } catch (error) {
        console.error(`[NearestLocationFinder] Error calculating distance for location:`, {
          error: error.message,
          location: location.properties?.name || 'Unknown',
          locationType
        });
        invalidLocationCount++;
        continue;
      }
    }

    // Log data quality issues (Requirement 8.2)
    if (invalidLocationCount > 0) {
      console.warn(`[NearestLocationFinder] Data quality issue: ${invalidLocationCount} out of ${locations.length} ${locationType} locations had invalid coordinates`);
    }

    // Return null if no valid location was found
    if (nearestLocation === null) {
      console.warn(`[NearestLocationFinder] No valid ${locationType} found`);
      return null;
    }

    // Extract display name
    const name = this._extractDisplayName(nearestLocation);

    console.log(`[NearestLocationFinder] Nearest ${locationType} found:`, {
      name,
      distance: minDistance,
      validLocations: validLocationCount,
      invalidLocations: invalidLocationCount
    });

    return {
      feature: nearestLocation,
      distance: minDistance,
      name
    };
  }

  /**
   * Extract display name from location feature
   * @private
   * @param {Object} feature - GeoJSON Feature
   * @returns {string} Display name
   */
  _extractDisplayName(feature) {
    const props = feature.properties;
    
    // Prefer Vietnamese name, fallback to English name, then to generic label
    return props.name || props['name:en'] || 'Unknown Location';
  }
}

export default NearestLocationFinder;
