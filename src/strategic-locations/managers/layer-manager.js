/**
 * LayerManager Class
 * 
 * Manages visibility state of map layers (KCN/CCN and Strategic Locations).
 * Handles localStorage persistence for layer states.
 * 
 * Requirements validated: 3.1, 3.2, 4.1, 4.2
 */

/**
 * Layer IDs used in the system
 */
const LAYER_IDS = {
  INDUSTRIAL_ZONES: 'industrial-zones',
  STRATEGIC_LOCATIONS: 'strategic-locations'
};

/**
 * Default layer visibility states
 */
const DEFAULT_LAYER_STATES = {
  [LAYER_IDS.INDUSTRIAL_ZONES]: false,
  [LAYER_IDS.STRATEGIC_LOCATIONS]: false
};

/**
 * LayerManager class
 * Manages layer visibility states and localStorage persistence
 */
class LayerManager {
  /**
   * Constructor
   * Initializes layer manager with default states
   * 
   * @param {string} storageKey - Optional custom localStorage key (default: 'map-layer-states')
   */
  constructor(storageKey = 'map-layer-states') {
    /**
     * Storage key for localStorage
     * @private
     */
    this.storageKey = storageKey;

    /**
     * Layer visibility states
     * Map<layerId, boolean>
     * @private
     */
    this.layerStates = new Map();

    // Initialize with default states
    this._initializeDefaultStates();
  }

  /**
   * Initialize layer states with default values
   * @private
   */
  _initializeDefaultStates() {
    for (const [layerId, visible] of Object.entries(DEFAULT_LAYER_STATES)) {
      this.layerStates.set(layerId, visible);
    }
  }

  /**
   * Toggle layer visibility
   * Switches the visibility state of a layer and returns the new state
   * 
   * @param {string} layerId - The layer ID to toggle
   * @returns {boolean} The new visibility state (true = visible, false = hidden)
   * @throws {Error} If layerId is invalid (logs error but doesn't throw)
   */
  toggleLayer(layerId) {
    if (!this._isValidLayerId(layerId)) {
      console.error(`Invalid layer ID: "${layerId}"`);
      return false;
    }

    const currentState = this.layerStates.get(layerId);
    const newState = !currentState;
    
    this.layerStates.set(layerId, newState);
    
    console.log(`Layer "${layerId}" toggled: ${currentState} → ${newState}`);
    
    // Auto-save to localStorage
    this.saveState();
    
    return newState;
  }

  /**
   * Set layer visibility explicitly
   * Sets the visibility state of a layer to a specific value
   * 
   * @param {string} layerId - The layer ID
   * @param {boolean} visible - The visibility state to set
   * @throws {Error} If layerId is invalid (logs error but doesn't throw)
   */
  setLayerVisibility(layerId, visible) {
    if (!this._isValidLayerId(layerId)) {
      console.error(`Invalid layer ID: "${layerId}"`);
      return;
    }

    if (typeof visible !== 'boolean') {
      console.error(`Invalid visibility value: expected boolean, got ${typeof visible}`);
      return;
    }

    const currentState = this.layerStates.get(layerId);
    
    if (currentState !== visible) {
      this.layerStates.set(layerId, visible);
      console.log(`Layer "${layerId}" visibility set to: ${visible}`);
      
      // Auto-save to localStorage
      this.saveState();
    }
  }

  /**
   * Check if a layer is visible
   * Returns the current visibility state of a layer
   * 
   * @param {string} layerId - The layer ID
   * @returns {boolean} True if visible, false if hidden or invalid
   */
  isLayerVisible(layerId) {
    if (!this._isValidLayerId(layerId)) {
      console.warn(`Invalid layer ID: "${layerId}"`);
      return false;
    }

    return this.layerStates.get(layerId) || false;
  }

  /**
   * Get all layer states
   * Returns a copy of all layer visibility states
   * 
   * @returns {Map<string, boolean>} Map of layer IDs to visibility states
   */
  getAllLayerStates() {
    // Return a copy to prevent external modification
    return new Map(this.layerStates);
  }

  /**
   * Save current state to localStorage
   * Persists layer visibility states for restoration on page reload
   * 
   * Requirements validated: 3.4, 4.5
   */
  saveState() {
    try {
      const stateObject = {
        layerStates: Object.fromEntries(this.layerStates),
        lastUpdated: Date.now()
      };

      const stateJSON = JSON.stringify(stateObject);
      localStorage.setItem(this.storageKey, stateJSON);
      
      console.log('Layer states saved to localStorage');
    } catch (error) {
      console.error('Failed to save layer states to localStorage:', error);
      // Don't throw - allow app to continue without persistence
    }
  }

  /**
   * Load state from localStorage
   * Restores layer visibility states from previous session
   * Falls back to default states if loading fails
   * 
   * Requirements validated: 3.5, 4.6
   */
  loadState() {
    try {
      const stateJSON = localStorage.getItem(this.storageKey);
      
      if (!stateJSON) {
        console.log('No saved layer states found, using defaults');
        return;
      }

      const stateObject = JSON.parse(stateJSON);
      
      if (!stateObject || typeof stateObject !== 'object') {
        console.warn('Invalid layer state data in localStorage, using defaults');
        return;
      }

      if (!stateObject.layerStates || typeof stateObject.layerStates !== 'object') {
        console.warn('Invalid layerStates in localStorage, using defaults');
        return;
      }

      // Restore layer states
      for (const [layerId, visible] of Object.entries(stateObject.layerStates)) {
        if (this._isValidLayerId(layerId) && typeof visible === 'boolean') {
          this.layerStates.set(layerId, visible);
        }
      }

      const lastUpdated = stateObject.lastUpdated 
        ? new Date(stateObject.lastUpdated).toLocaleString() 
        : 'unknown';
      
      console.log(`Layer states loaded from localStorage (last updated: ${lastUpdated})`);
    } catch (error) {
      console.error('Failed to load layer states from localStorage:', error);
      console.log('Using default layer states');
      // Don't throw - fall back to default states
    }
  }

  /**
   * Reset to default layer states
   * Restores all layers to their default visibility states
   */
  resetToDefault() {
    console.log('Resetting layer states to defaults...');
    
    this._initializeDefaultStates();
    this.saveState();
    
    console.log('Layer states reset to defaults');
  }

  /**
   * Validate layer ID
   * Checks if a layer ID is valid
   * 
   * @private
   * @param {string} layerId - The layer ID to validate
   * @returns {boolean} True if valid, false otherwise
   */
  _isValidLayerId(layerId) {
    return Object.values(LAYER_IDS).includes(layerId);
  }

  /**
   * Get all valid layer IDs
   * Returns an array of all valid layer IDs
   * 
   * @returns {Array<string>} Array of layer IDs
   */
  getValidLayerIds() {
    return Object.values(LAYER_IDS);
  }

  /**
   * Get layer state as object
   * Returns layer states as a plain object (useful for debugging)
   * 
   * @returns {Object} Plain object with layer states
   */
  getStateAsObject() {
    return Object.fromEntries(this.layerStates);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { LayerManager, LAYER_IDS, DEFAULT_LAYER_STATES };
}

// ES6 module export for browser
export default LayerManager;
export { LAYER_IDS, DEFAULT_LAYER_STATES };
