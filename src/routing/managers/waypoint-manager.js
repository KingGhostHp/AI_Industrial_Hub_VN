/**
 * WaypointManager
 * 
 * Manages waypoints for route planning including add, remove, reorder operations.
 * Enforces the 25 waypoint limit.
 */

class WaypointManager {
  constructor() {
    /** @type {import('../types/index.js').Waypoint[]} */
    this.waypoints = [];
    this.maxWaypoints = 25;
  }

  /**
   * Add a waypoint
   * @param {import('../types/index.js').Waypoint} waypoint
   * @throws {Error} If waypoint limit exceeded
   */
  addWaypoint(waypoint) {
    if (this.waypoints.length >= this.maxWaypoints) {
      throw new Error('Tối đa 25 điểm dừng');
    }

    if (!waypoint || !waypoint.coordinates || waypoint.coordinates.length !== 2) {
      throw new Error('Invalid waypoint: coordinates required');
    }

    // Ensure waypoint has required fields
    const normalizedWaypoint = {
      id: waypoint.id || this.generateWaypointId(),
      name: waypoint.name || 'Waypoint',
      coordinates: waypoint.coordinates,
      type: waypoint.type || 'waypoint',
      address: waypoint.address,
      placeType: waypoint.placeType,
    };

    this.waypoints.push(normalizedWaypoint);
  }

  /**
   * Remove a waypoint by ID
   * @param {string} id - Waypoint ID
   * @returns {boolean} True if removed, false if not found
   */
  removeWaypoint(id) {
    const index = this.waypoints.findIndex(wp => wp.id === id);
    if (index === -1) {
      return false;
    }
    this.waypoints.splice(index, 1);
    return true;
  }

  /**
   * Reorder waypoints
   * @param {number[]} newOrder - Array of indices representing new order
   * @throws {Error} If newOrder is invalid
   */
  reorderWaypoints(newOrder) {
    if (!Array.isArray(newOrder) || newOrder.length !== this.waypoints.length) {
      throw new Error('Invalid reorder array');
    }

    // Validate indices
    const sortedIndices = [...newOrder].sort((a, b) => a - b);
    for (let i = 0; i < sortedIndices.length; i++) {
      if (sortedIndices[i] !== i) {
        throw new Error('Invalid reorder indices');
      }
    }

    // Reorder waypoints
    const reordered = newOrder.map(index => this.waypoints[index]);
    this.waypoints = reordered;
  }

  /**
   * Validate waypoints
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validateWaypoints() {
    if (this.waypoints.length > this.maxWaypoints) {
      throw new Error(`Tối đa ${this.maxWaypoints} điểm dừng`);
    }

    for (const waypoint of this.waypoints) {
      if (!waypoint.coordinates || waypoint.coordinates.length !== 2) {
        throw new Error(`Invalid waypoint: ${waypoint.id}`);
      }

      const [lng, lat] = waypoint.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error(`Invalid coordinates for waypoint: ${waypoint.id}`);
      }

      // Validate Vietnam bounds (approximate)
      if (lng < 102 || lng > 110 || lat < 8 || lat < 24) {
        console.warn(`Waypoint ${waypoint.id} may be outside Vietnam`);
      }
    }

    return true;
  }

  /**
   * Get all waypoints
   * @returns {import('../types/index.js').Waypoint[]}
   */
  getWaypoints() {
    return [...this.waypoints];
  }

  /**
   * Get waypoint by ID
   * @param {string} id - Waypoint ID
   * @returns {import('../types/index.js').Waypoint | null}
   */
  getWaypoint(id) {
    return this.waypoints.find(wp => wp.id === id) || null;
  }

  /**
   * Clear all waypoints
   */
  clearWaypoints() {
    this.waypoints = [];
  }

  /**
   * Get waypoint count
   * @returns {number}
   */
  getCount() {
    return this.waypoints.length;
  }

  /**
   * Generate unique waypoint ID
   * @returns {string}
   */
  generateWaypointId() {
    return `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export as default for ES6 modules
export default WaypointManager;
