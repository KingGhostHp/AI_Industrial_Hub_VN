/**
 * Data Manager Service
 * 
 * Manages access to GeoJSON data, IIP Vietnam API, and user preferences.
 * Provides centralized data access layer for the AI Investment Advisor system.
 * 
 * Features:
 * - Load and cache zone data from GeoJSON files
 * - Load strategic locations (ports, airports, city centers)
 * - Fetch updates from IIP Vietnam API (24-hour update cycle)
 * - Manage user preferences (save/load)
 * - Handle data loading errors gracefully
 * - Log all data operations with timestamps
 * 
 * Requirements: 11.1, 11.2, 11.4, 11.6, 11.7, 16.2
 */

import { UserPreferences } from '../models/user-preferences.js';
import { envLoader } from '../utils/env-loader.js';

/**
 * Strategic location type configuration
 */
const STRATEGIC_LOCATION_TYPES = {
  seaport: {
    id: 'seaport',
    name: 'Cảng biển',
    dataFile: 'data/cangbienexport.geojson'
  },
  airport: {
    id: 'airport',
    name: 'Sân bay',
    dataFile: 'data/export.geojson'
  },
  city_center: {
    id: 'city_center',
    name: 'Trung tâm tỉnh/TP',
    dataFile: 'data/34-tinh-thanh-trung-tam.geojson'
  }
};

/**
 * Data Manager class
 * Centralized data access layer for the AI Investment Advisor
 */
export class DataManager {
  /**
   * Initialize Data Manager
   * @param {Object} options - Configuration options
   * @param {string} [options.zonesDataFile='data/industrial_zones.geojson'] - Path to zones GeoJSON
   * @param {number} [options.updateInterval=86400000] - Update interval in ms (default 24 hours)
   * @param {boolean} [options.enableLogging=true] - Enable operation logging
   */
  constructor(options = {}) {
    this.zonesDataFile = options.zonesDataFile || 'data/industrial_zones.geojson';
    this.updateInterval = options.updateInterval || 86400000; // 24 hours
    this.enableLogging = options.enableLogging !== false;
    
    // Data caches
    this.zonesData = null;
    this.strategicLocations = new Map();
    this.provinceStatistics = null;
    
    // Update tracking
    this.lastUpdate = {
      zones: null,
      strategicLocations: null,
      iipApi: null
    };
    
    // Loading state
    this.loadingPromises = new Map();
    
    // User preferences
    this.userPreferences = null;
    
    // Initialize logging
    this.logs = [];
  }

  /**
   * Initialize the data manager
   * Loads environment configuration and initial data
   * @returns {Promise<void>}
   */
  async initialize() {
    this._log('Initializing Data Manager');
    
    try {
      // Load environment configuration
      await envLoader.load();
      
      // Load user preferences
      this.userPreferences = UserPreferences.load();
      
      this._log('Data Manager initialized successfully');
    } catch (error) {
      this._logError('Failed to initialize Data Manager', error);
      throw error;
    }
  }

  /**
   * Load zone data from GeoJSON file
   * @param {boolean} [forceReload=false] - Force reload even if cached
   * @returns {Promise<Object>} - GeoJSON FeatureCollection
   */
  async loadZoneData(forceReload = false) {
    // Return cached data if available and not forcing reload
    if (this.zonesData && !forceReload) {
      this._log('Returning cached zone data');
      return this.zonesData;
    }
    
    // Check if already loading
    if (this.loadingPromises.has('zones')) {
      this._log('Zone data already loading, waiting for existing promise');
      return this.loadingPromises.get('zones');
    }
    
    // Create loading promise
    const loadPromise = this._loadZoneDataInternal();
    this.loadingPromises.set('zones', loadPromise);
    
    try {
      const data = await loadPromise;
      this.loadingPromises.delete('zones');
      return data;
    } catch (error) {
      this.loadingPromises.delete('zones');
      throw error;
    }
  }

  /**
   * Internal method to load zone data
   * @private
   */
  async _loadZoneDataInternal() {
    this._log(`Loading zone data from ${this.zonesDataFile}`);
    
    try {
      const response = await fetch(this.zonesDataFile);
      
      if (!response.ok) {
        throw new Error(`Failed to load zone data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate GeoJSON structure
      if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format: missing FeatureCollection or features array');
      }
      
      // Cache the data
      this.zonesData = data;
      this.lastUpdate.zones = Date.now();
      
      this._log(`Successfully loaded ${data.features.length} zones`);
      
      return data;
    } catch (error) {
      this._logError('Failed to load zone data', error);
      
      // If we have cached data, return it with a warning
      if (this.zonesData) {
        this._log('Returning stale cached zone data due to load failure');
        return this.zonesData;
      }
      
      throw error;
    }
  }

  /**
   * Load strategic locations by type
   * @param {string} locationType - Type of location ('seaport', 'airport', 'city_center')
   * @param {boolean} [forceReload=false] - Force reload even if cached
   * @returns {Promise<Object>} - GeoJSON FeatureCollection
   */
  async loadStrategicLocations(locationType, forceReload = false) {
    // Validate location type
    if (!STRATEGIC_LOCATION_TYPES[locationType]) {
      throw new Error(`Invalid location type: ${locationType}. Valid types: ${Object.keys(STRATEGIC_LOCATION_TYPES).join(', ')}`);
    }
    
    // Return cached data if available and not forcing reload
    if (this.strategicLocations.has(locationType) && !forceReload) {
      this._log(`Returning cached ${locationType} data`);
      return this.strategicLocations.get(locationType);
    }
    
    // Check if already loading
    const loadKey = `strategic_${locationType}`;
    if (this.loadingPromises.has(loadKey)) {
      this._log(`${locationType} data already loading, waiting for existing promise`);
      return this.loadingPromises.get(loadKey);
    }
    
    // Create loading promise
    const loadPromise = this._loadStrategicLocationsInternal(locationType);
    this.loadingPromises.set(loadKey, loadPromise);
    
    try {
      const data = await loadPromise;
      this.loadingPromises.delete(loadKey);
      return data;
    } catch (error) {
      this.loadingPromises.delete(loadKey);
      throw error;
    }
  }

  /**
   * Internal method to load strategic locations
   * @private
   */
  async _loadStrategicLocationsInternal(locationType) {
    const config = STRATEGIC_LOCATION_TYPES[locationType];
    this._log(`Loading ${config.name} data from ${config.dataFile}`);
    
    try {
      const response = await fetch(config.dataFile);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${config.name}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate GeoJSON structure
      if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error(`Invalid GeoJSON format for ${config.name}: missing FeatureCollection or features array`);
      }
      
      // Cache the data
      this.strategicLocations.set(locationType, data);
      this.lastUpdate.strategicLocations = Date.now();
      
      this._log(`Successfully loaded ${data.features.length} ${config.name} locations`);
      
      return data;
    } catch (error) {
      this._logError(`Failed to load ${config.name}`, error);
      
      // If we have cached data, return it with a warning
      if (this.strategicLocations.has(locationType)) {
        this._log(`Returning stale cached ${config.name} data due to load failure`);
        return this.strategicLocations.get(locationType);
      }
      
      throw error;
    }
  }

  /**
   * Load all strategic locations
   * @param {boolean} [forceReload=false] - Force reload even if cached
   * @returns {Promise<Map>} - Map of location type to GeoJSON data
   */
  async loadAllStrategicLocations(forceReload = false) {
    this._log('Loading all strategic locations');
    
    const loadPromises = Object.keys(STRATEGIC_LOCATION_TYPES).map(type =>
      this.loadStrategicLocations(type, forceReload)
    );
    
    try {
      await Promise.all(loadPromises);
      this._log('Successfully loaded all strategic locations');
      return this.strategicLocations;
    } catch (error) {
      this._logError('Failed to load some strategic locations', error);
      // Return partial data if available
      return this.strategicLocations;
    }
  }

  /**
   * Fetch updates from IIP Vietnam API
   * @returns {Promise<Object>} - Updated zone data
   */
  async fetchIIPUpdates() {
    this._log('Fetching updates from IIP Vietnam API');
    
    try {
      const apiUrl = envLoader.get('IIP_VIETNAM_API_URL');
      
      if (!apiUrl) {
        throw new Error('IIP Vietnam API URL not configured');
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`IIP API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      this.lastUpdate.iipApi = Date.now();
      this._log(`Successfully fetched IIP API updates: ${data.length || 0} zones`);
      
      return data;
    } catch (error) {
      this._logError('Failed to fetch IIP API updates', error);
      
      // Return cached zone data if available
      if (this.zonesData) {
        this._log('Returning cached zone data due to IIP API failure');
        return this.zonesData;
      }
      
      throw error;
    }
  }

  /**
   * Check if data needs update based on update interval
   * @param {string} dataType - Type of data ('zones', 'strategicLocations', 'iipApi')
   * @returns {boolean} - True if update is needed
   */
  needsUpdate(dataType) {
    const lastUpdate = this.lastUpdate[dataType];
    
    if (!lastUpdate) {
      return true; // Never updated
    }
    
    const timeSinceUpdate = Date.now() - lastUpdate;
    return timeSinceUpdate >= this.updateInterval;
  }

  /**
   * Auto-update data if needed
   * Checks update interval and fetches new data if necessary
   * @returns {Promise<void>}
   */
  async autoUpdate() {
    this._log('Checking for auto-updates');
    
    try {
      // Check if IIP API update is needed
      if (this.needsUpdate('iipApi')) {
        this._log('IIP API update needed (24-hour cycle)');
        await this.fetchIIPUpdates();
      }
      
      // Check if zone data reload is needed
      if (this.needsUpdate('zones')) {
        this._log('Zone data reload needed');
        await this.loadZoneData(true);
      }
      
      this._log('Auto-update check completed');
    } catch (error) {
      this._logError('Auto-update failed', error);
      // Don't throw - auto-update failures should not break the app
    }
  }

  /**
   * Get zone by code
   * @param {string} code - Zone code
   * @returns {Object|null} - Zone feature or null if not found
   */
  getZoneByCode(code) {
    if (!this.zonesData) {
      this._log('Zone data not loaded, cannot get zone by code');
      return null;
    }
    
    return this.zonesData.features.find(
      feature => feature.properties.code === code
    ) || null;
  }

  /**
   * Get zones by province
   * @param {string} province - Province name
   * @returns {Array} - Array of zone features
   */
  getZonesByProvince(province) {
    if (!this.zonesData) {
      this._log('Zone data not loaded, cannot get zones by province');
      return [];
    }
    
    return this.zonesData.features.filter(
      feature => feature.properties.province === province
    );
  }

  /**
   * Get all zones
   * @returns {Array} - Array of all zone features
   */
  getAllZones() {
    if (!this.zonesData) {
      this._log('Zone data not loaded, cannot get all zones');
      return [];
    }
    
    return this.zonesData.features;
  }

  /**
   * Get strategic locations by type
   * @param {string} locationType - Type of location
   * @returns {Array} - Array of location features
   */
  getStrategicLocationsByType(locationType) {
    const data = this.strategicLocations.get(locationType);
    
    if (!data) {
      this._log(`${locationType} data not loaded`);
      return [];
    }
    
    return data.features;
  }

  /**
   * Save user preferences
   * @param {UserPreferences} preferences - User preferences to save
   */
  saveUserPreferences(preferences) {
    try {
      preferences.save();
      this.userPreferences = preferences;
      this._log('User preferences saved successfully');
    } catch (error) {
      this._logError('Failed to save user preferences', error);
      throw error;
    }
  }

  /**
   * Load user preferences
   * @returns {UserPreferences} - Loaded user preferences
   */
  loadUserPreferences() {
    try {
      this.userPreferences = UserPreferences.load();
      this._log('User preferences loaded successfully');
      return this.userPreferences;
    } catch (error) {
      this._logError('Failed to load user preferences', error);
      // Return default preferences on error
      this.userPreferences = new UserPreferences();
      return this.userPreferences;
    }
  }

  /**
   * Get current user preferences
   * @returns {UserPreferences} - Current user preferences
   */
  getUserPreferences() {
    if (!this.userPreferences) {
      this.userPreferences = this.loadUserPreferences();
    }
    return this.userPreferences;
  }

  /**
   * Get data update status
   * @returns {Object} - Update status for all data types
   */
  getUpdateStatus() {
    return {
      zones: {
        lastUpdate: this.lastUpdate.zones,
        needsUpdate: this.needsUpdate('zones'),
        dataAge: this.lastUpdate.zones ? Date.now() - this.lastUpdate.zones : null
      },
      strategicLocations: {
        lastUpdate: this.lastUpdate.strategicLocations,
        needsUpdate: this.needsUpdate('strategicLocations'),
        dataAge: this.lastUpdate.strategicLocations ? Date.now() - this.lastUpdate.strategicLocations : null
      },
      iipApi: {
        lastUpdate: this.lastUpdate.iipApi,
        needsUpdate: this.needsUpdate('iipApi'),
        dataAge: this.lastUpdate.iipApi ? Date.now() - this.lastUpdate.iipApi : null
      }
    };
  }

  /**
   * Get operation logs
   * @param {number} [limit=50] - Maximum number of logs to return
   * @returns {Array} - Array of log entries
   */
  getLogs(limit = 50) {
    return this.logs.slice(-limit);
  }

  /**
   * Clear operation logs
   */
  clearLogs() {
    this.logs = [];
    this._log('Logs cleared');
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this._log('Clearing all cached data');
    
    this.zonesData = null;
    this.strategicLocations.clear();
    this.provinceStatistics = null;
    
    this.lastUpdate = {
      zones: null,
      strategicLocations: null,
      iipApi: null
    };
    
    this._log('Cache cleared successfully');
  }

  /**
   * Log operation with timestamp
   * @private
   */
  _log(message) {
    if (!this.enableLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message
    };
    
    this.logs.push(logEntry);
    console.log(`[DataManager] ${logEntry.timestamp} - ${message}`);
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  /**
   * Log error with timestamp
   * @private
   */
  _logError(message, error) {
    if (!this.enableLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error.message,
      stack: error.stack
    };
    
    this.logs.push(logEntry);
    console.error(`[DataManager] ${logEntry.timestamp} - ${message}`, error);
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }
}

/**
 * Create and export singleton instance
 */
export const dataManager = new DataManager();

export default DataManager;
