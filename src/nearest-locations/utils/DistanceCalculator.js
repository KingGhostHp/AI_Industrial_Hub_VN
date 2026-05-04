/**
 * DistanceCalculator - Calculates straight-line distances between coordinates
 * using the Haversine formula
 */
class DistanceCalculator {
  /**
   * Validate coordinate ranges
   * @param {Array<number>} coord - [lng, lat]
   * @returns {boolean} True if valid
   */
  validateCoordinates(coord) {
    if (!Array.isArray(coord) || coord.length !== 2) {
      return false;
    }
    
    const [lng, lat] = coord;
    
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return false;
    }
    
    if (isNaN(lng) || isNaN(lat)) {
      return false;
    }
    
    // Latitude must be in range [-90, 90]
    if (lat < -90 || lat > 90) {
      return false;
    }
    
    // Longitude must be in range [-180, 180]
    if (lng < -180 || lng > 180) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate straight-line distance between two points
   * Uses Haversine formula for great-circle distance
   * @param {Array<number>} coord1 - [lng, lat]
   * @param {Array<number>} coord2 - [lng, lat]
   * @returns {number} Distance in kilometers (1 decimal precision)
   * @throws {Error} If coordinates are invalid
   */
  calculateDistance(coord1, coord2) {
    // Validate both coordinates (Requirement 8.1)
    if (!this.validateCoordinates(coord1)) {
      const errorMsg = `Invalid coordinates for coord1: lat must be in [-90, 90], lng in [-180, 180]. Got: ${JSON.stringify(coord1)}`;
      console.error('[DistanceCalculator] Coordinate validation failed:', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!this.validateCoordinates(coord2)) {
      const errorMsg = `Invalid coordinates for coord2: lat must be in [-90, 90], lng in [-180, 180]. Got: ${JSON.stringify(coord2)}`;
      console.error('[DistanceCalculator] Coordinate validation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    try {
      // Calculate distance using Haversine formula
      const distance = this._haversine(lat1, lng1, lat2, lng2);
      
      // Validate result is a valid number
      if (!isFinite(distance) || distance < 0) {
        console.warn('[DistanceCalculator] Calculated distance is invalid:', distance);
        throw new Error(`Invalid distance calculation result: ${distance}`);
      }
      
      // Return distance with 1 decimal precision
      const roundedDistance = Math.round(distance * 10) / 10;
      console.debug('[DistanceCalculator] Distance calculated:', {
        from: coord1,
        to: coord2,
        distance: roundedDistance
      });
      
      return roundedDistance;
    } catch (error) {
      console.error('[DistanceCalculator] Error during distance calculation:', error);
      throw error;
    }
  }

  /**
   * Haversine formula implementation
   * Calculates the great-circle distance between two points on a sphere
   * @private
   * @param {number} lat1 - Latitude of first point in degrees
   * @param {number} lon1 - Longitude of first point in degrees
   * @param {number} lat2 - Latitude of second point in degrees
   * @param {number} lon2 - Longitude of second point in degrees
   * @returns {number} Distance in kilometers
   */
  _haversine(lat1, lon1, lat2, lon2) {
    // Earth's radius in kilometers
    const R = 6371;

    // Convert degrees to radians
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    // Haversine formula
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c;

    return distance;
  }
}

export default DistanceCalculator;
