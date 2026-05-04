/**
 * Unit Tests for LayerManager
 * 
 * Tests layer visibility management and localStorage persistence
 * Requirements validated: 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.5, 4.6
 */

const { LayerManager, LAYER_IDS, DEFAULT_LAYER_STATES } = require('./layer-manager.js');

// Mock localStorage for testing
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Setup localStorage mock
global.localStorage = new LocalStorageMock();

describe('LayerManager', () => {
  let layerManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create fresh instance
    layerManager = new LayerManager();
  });

  describe('Constructor', () => {
    test('should initialize with default layer states', () => {
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      expect(layerManager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(true);
    });

    test('should accept custom storage key', () => {
      const customManager = new LayerManager('custom-key');
      expect(customManager.storageKey).toBe('custom-key');
    });

    test('should use default storage key if not provided', () => {
      expect(layerManager.storageKey).toBe('map-layer-states');
    });
  });

  describe('toggleLayer()', () => {
    test('should toggle industrial zones layer from true to false', () => {
      const newState = layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES);
      expect(newState).toBe(false);
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
    });

    test('should toggle strategic locations layer from true to false', () => {
      const newState = layerManager.toggleLayer(LAYER_IDS.STRATEGIC_LOCATIONS);
      expect(newState).toBe(false);
      expect(layerManager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(false);
    });

    test('should toggle layer back to true', () => {
      layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES); // false
      const newState = layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES); // true
      expect(newState).toBe(true);
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
    });

    test('should return false for invalid layer ID', () => {
      const result = layerManager.toggleLayer('invalid-layer');
      expect(result).toBe(false);
    });

    test('should auto-save state after toggle', () => {
      layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES);
      
      const savedData = localStorage.getItem('map-layer-states');
      expect(savedData).toBeTruthy();
      
      const parsed = JSON.parse(savedData);
      expect(parsed.layerStates[LAYER_IDS.INDUSTRIAL_ZONES]).toBe(false);
    });
  });

  describe('setLayerVisibility()', () => {
    test('should set layer visibility to false', () => {
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
    });

    test('should set layer visibility to true', () => {
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, true);
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
    });

    test('should handle invalid layer ID gracefully', () => {
      // Should not throw
      expect(() => {
        layerManager.setLayerVisibility('invalid-layer', false);
      }).not.toThrow();
    });

    test('should handle invalid visibility value gracefully', () => {
      // Should not throw
      expect(() => {
        layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, 'invalid');
      }).not.toThrow();
      
      // State should remain unchanged
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
    });

    test('should auto-save state after setting visibility', () => {
      layerManager.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
      
      const savedData = localStorage.getItem('map-layer-states');
      expect(savedData).toBeTruthy();
      
      const parsed = JSON.parse(savedData);
      expect(parsed.layerStates[LAYER_IDS.STRATEGIC_LOCATIONS]).toBe(false);
    });

    test('should not save if state does not change', () => {
      // Clear any previous saves
      localStorage.clear();
      
      // Set to current value (true)
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, true);
      
      // Should not have saved since state didn't change
      const savedData = localStorage.getItem('map-layer-states');
      expect(savedData).toBeNull();
    });
  });

  describe('isLayerVisible()', () => {
    test('should return true for visible layer', () => {
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
    });

    test('should return false for hidden layer', () => {
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
    });

    test('should return false for invalid layer ID', () => {
      expect(layerManager.isLayerVisible('invalid-layer')).toBe(false);
    });
  });

  describe('getAllLayerStates()', () => {
    test('should return Map with all layer states', () => {
      const states = layerManager.getAllLayerStates();
      
      expect(states).toBeInstanceOf(Map);
      expect(states.size).toBe(2);
      expect(states.get(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      expect(states.get(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(true);
    });

    test('should return a copy (not reference)', () => {
      const states = layerManager.getAllLayerStates();
      
      // Modify the returned map
      states.set(LAYER_IDS.INDUSTRIAL_ZONES, false);
      
      // Original should be unchanged
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
    });

    test('should reflect current state after changes', () => {
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      layerManager.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
      
      const states = layerManager.getAllLayerStates();
      
      expect(states.get(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
      expect(states.get(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(false);
    });
  });

  describe('saveState()', () => {
    test('should save layer states to localStorage', () => {
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      layerManager.saveState();
      
      const savedData = localStorage.getItem('map-layer-states');
      expect(savedData).toBeTruthy();
      
      const parsed = JSON.parse(savedData);
      expect(parsed.layerStates).toBeDefined();
      expect(parsed.layerStates[LAYER_IDS.INDUSTRIAL_ZONES]).toBe(false);
      expect(parsed.layerStates[LAYER_IDS.STRATEGIC_LOCATIONS]).toBe(true);
    });

    test('should include lastUpdated timestamp', () => {
      layerManager.saveState();
      
      const savedData = localStorage.getItem('map-layer-states');
      const parsed = JSON.parse(savedData);
      
      expect(parsed.lastUpdated).toBeDefined();
      expect(typeof parsed.lastUpdated).toBe('number');
      expect(parsed.lastUpdated).toBeLessThanOrEqual(Date.now());
    });

    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };
      
      // Should not throw
      expect(() => {
        layerManager.saveState();
      }).not.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('loadState()', () => {
    test('should load layer states from localStorage', () => {
      // Save a state
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      layerManager.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
      layerManager.saveState();
      
      // Create new instance and load
      const newManager = new LayerManager();
      newManager.loadState();
      
      expect(newManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
      expect(newManager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(false);
    });

    test('should use defaults if no saved state exists', () => {
      localStorage.clear();
      
      const newManager = new LayerManager();
      newManager.loadState();
      
      expect(newManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      expect(newManager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(true);
    });

    test('should handle invalid JSON gracefully', () => {
      localStorage.setItem('map-layer-states', 'invalid json');
      
      const newManager = new LayerManager();
      
      // Should not throw
      expect(() => {
        newManager.loadState();
      }).not.toThrow();
      
      // Should use defaults
      expect(newManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
    });

    test('should handle missing layerStates property', () => {
      localStorage.setItem('map-layer-states', JSON.stringify({ lastUpdated: Date.now() }));
      
      const newManager = new LayerManager();
      newManager.loadState();
      
      // Should use defaults
      expect(newManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
    });

    test('should ignore invalid layer IDs in saved state', () => {
      const invalidState = {
        layerStates: {
          [LAYER_IDS.INDUSTRIAL_ZONES]: false,
          'invalid-layer': false
        },
        lastUpdated: Date.now()
      };
      
      localStorage.setItem('map-layer-states', JSON.stringify(invalidState));
      
      const newManager = new LayerManager();
      newManager.loadState();
      
      expect(newManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
      // Invalid layer should not be in state
      expect(newManager.getAllLayerStates().has('invalid-layer')).toBe(false);
    });

    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => {
        throw new Error('Storage access denied');
      };
      
      const newManager = new LayerManager();
      
      // Should not throw
      expect(() => {
        newManager.loadState();
      }).not.toThrow();
      
      // Should use defaults
      expect(newManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      
      // Restore
      localStorage.getItem = originalGetItem;
    });
  });

  describe('resetToDefault()', () => {
    test('should reset all layers to default visibility', () => {
      // Change states
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      layerManager.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
      
      // Reset
      layerManager.resetToDefault();
      
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      expect(layerManager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(true);
    });

    test('should save default state to localStorage', () => {
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      layerManager.resetToDefault();
      
      const savedData = localStorage.getItem('map-layer-states');
      const parsed = JSON.parse(savedData);
      
      expect(parsed.layerStates[LAYER_IDS.INDUSTRIAL_ZONES]).toBe(true);
      expect(parsed.layerStates[LAYER_IDS.STRATEGIC_LOCATIONS]).toBe(true);
    });
  });

  describe('Helper methods', () => {
    test('getValidLayerIds() should return array of valid layer IDs', () => {
      const ids = layerManager.getValidLayerIds();
      
      expect(Array.isArray(ids)).toBe(true);
      expect(ids).toContain(LAYER_IDS.INDUSTRIAL_ZONES);
      expect(ids).toContain(LAYER_IDS.STRATEGIC_LOCATIONS);
      expect(ids.length).toBe(2);
    });

    test('getStateAsObject() should return plain object', () => {
      layerManager.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      
      const stateObj = layerManager.getStateAsObject();
      
      expect(typeof stateObj).toBe('object');
      expect(stateObj[LAYER_IDS.INDUSTRIAL_ZONES]).toBe(false);
      expect(stateObj[LAYER_IDS.STRATEGIC_LOCATIONS]).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    test('should persist state across page reloads', () => {
      // Simulate user session 1
      const session1 = new LayerManager();
      session1.setLayerVisibility(LAYER_IDS.INDUSTRIAL_ZONES, false);
      session1.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
      session1.saveState();
      
      // Simulate page reload - new instance
      const session2 = new LayerManager();
      session2.loadState();
      
      expect(session2.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
      expect(session2.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(false);
    });

    test('should handle multiple toggles correctly', () => {
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      
      layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES); // false
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
      
      layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES); // true
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      
      layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES); // false
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
    });

    test('should handle mixed operations correctly', () => {
      layerManager.toggleLayer(LAYER_IDS.INDUSTRIAL_ZONES); // false
      layerManager.setLayerVisibility(LAYER_IDS.STRATEGIC_LOCATIONS, false);
      
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(false);
      expect(layerManager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(false);
      
      layerManager.resetToDefault();
      
      expect(layerManager.isLayerVisible(LAYER_IDS.INDUSTRIAL_ZONES)).toBe(true);
      expect(layerManager.isLayerVisible(LAYER_IDS.STRATEGIC_LOCATIONS)).toBe(true);
    });
  });
});
