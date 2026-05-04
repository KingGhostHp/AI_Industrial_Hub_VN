/**
 * RouteHistoryManager
 * 
 * Manages route history using localStorage.
 * Enforces 20-item limit and provides save/load functionality.
 */

class RouteHistoryManager {
  constructor() {
    this.storageKey = 'route_history';
    this.maxHistorySize = 20;
  }

  /**
   * Save route to history
   * @param {import('../types/index.js').Route} route
   * @param {import('../types/index.js').Waypoint[]} waypoints
   */
  saveRoute(route, waypoints) {
    if (!route || !waypoints || waypoints.length < 2) {
      console.warn('Invalid route or waypoints for history');
      return;
    }

    const historyItem = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      origin: waypoints[0],
      destination: waypoints[waypoints.length - 1],
      waypoints: waypoints.slice(1, -1), // Intermediate waypoints only
      travelMode: route.travelMode,
      distance: route.distance,
      duration: route.duration,
    };

    const history = this.getHistory();
    
    // Add new item at the beginning
    history.unshift(historyItem);

    // Enforce size limit
    if (history.length > this.maxHistorySize) {
      history.splice(this.maxHistorySize);
    }

    this.saveToStorage(history);
  }

  /**
   * Get history
   * @returns {import('../types/index.js').RouteHistoryItem[]}
   */
  getHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      const history = JSON.parse(data);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  /**
   * Load route from history
   * @param {string} historyId
   * @returns {import('../types/index.js').RouteHistoryItem | null}
   */
  loadRoute(historyId) {
    const history = this.getHistory();
    return history.find(item => item.id === historyId) || null;
  }

  /**
   * Clear all history
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  /**
   * Remove a specific history item
   * @param {string} historyId
   * @returns {boolean} True if removed
   */
  removeHistoryItem(historyId) {
    const history = this.getHistory();
    const index = history.findIndex(item => item.id === historyId);
    
    if (index === -1) {
      return false;
    }

    history.splice(index, 1);
    this.saveToStorage(history);
    return true;
  }

  /**
   * Save history to localStorage
   * @param {import('../types/index.js').RouteHistoryItem[]} history
   */
  saveToStorage(history) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Get history count
   * @returns {number}
   */
  getCount() {
    return this.getHistory().length;
  }
}

// Export as default for ES6 modules
export default RouteHistoryManager;
