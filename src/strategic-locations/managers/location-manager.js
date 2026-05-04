/**
 * LocationManager Class
 * 
 * Manages loading, caching, and providing access to strategic location data.
 * Handles GeoJSON data for 5 location types: seaport, airport, highway, city_center, residential.
 * 
 * Requirements validated: 1.1, 1.2
 */

/**
 * Location type configuration
 * Defines the 5 strategic location types with their display properties and data sources
 */
const LOCATION_TYPES = [
  {
    id: 'seaport',
    name: 'Cảng biển',
    icon: 'anchor',
    color: '#0EA5E9', // Sky blue
    dataFile: 'data/cangbienexport.geojson',
    geometryType: 'Point'
  },
  {
    id: 'airport',
    name: 'Sân bay',
    icon: 'plane',
    color: '#8B5CF6', // Purple
    dataFile: 'data/export.geojson',
    geometryType: 'Point'
  },
  {
    id: 'highway',
    name: 'Cao tốc',
    icon: 'highway',
    color: '#F59E0B', // Amber
    dataFile: 'data/caotocexport.geojson',
    geometryType: 'LineString'
  },
  {
    id: 'city_center',
    name: 'Trung tâm tỉnh/TP',
    icon: 'building-2',
    color: '#EF4444', // Red
    dataFile: 'data/34-tinh-thanh-trung-tam.geojson',
    geometryType: 'Point'
  },
  {
    id: 'residential',
    name: 'Khu dân cư',
    icon: 'home',
    color: '#10B981', // Green
    dataFile: 'data/khudancu.geojson',
    geometryType: 'Polygon'
  }
];

/**
 * LocationManager class
 * Manages strategic location data loading, caching, and retrieval
 */
class LocationManager {
  /**
   * Constructor
   * Initializes the location manager with empty cache
   */
  constructor() {
    /**
     * Cache for loaded location data
     * Map<locationTypeId, FeatureCollection>
     * @private
     */
    this.locations = new Map();

    /**
     * Location types configuration
     * @private
     */
    this.locationTypes = LOCATION_TYPES;

    /**
     * Loading state tracker
     * Map<locationTypeId, Promise>
     * @private
     */
    this.loadingPromises = new Map();
  }

  /**
   * Load all location types
   * Loads data for all 5 location types in parallel
   * 
   * @returns {Promise<void>}
   * @throws {Error} If any location type fails to load (logs error but doesn't throw)
   */
  async loadAllLocations() {
    console.log('Loading all strategic locations...');
    
    const loadPromises = this.locationTypes.map(type => 
      this.loadLocationType(type.id)
    );

    try {
      await Promise.all(loadPromises);
      console.log('✓ All strategic locations loaded successfully');
    } catch (error) {
      console.error('Error loading some location types:', error);
      // Don't throw - allow partial loading
    }
  }

  /**
   * Load a specific location type
   * Fetches GeoJSON data from file and caches it
   * Includes error handling for missing files and invalid data
   * 
   * @param {string} typeId - The location type ID (e.g., 'seaport', 'airport')
   * @returns {Promise<Object>} The loaded GeoJSON FeatureCollection
   * @throws {Error} If typeId is invalid (logs error but returns empty FeatureCollection)
   */
  async loadLocationType(typeId) {
    // Check if already loaded
    if (this.locations.has(typeId)) {
      console.log(`Location type "${typeId}" already loaded from cache`);
      return this.locations.get(typeId);
    }

    // Check if currently loading (prevent duplicate requests)
    if (this.loadingPromises.has(typeId)) {
      console.log(`Location type "${typeId}" is already being loaded, waiting...`);
      return this.loadingPromises.get(typeId);
    }

    // Find location type configuration
    const locationType = this.locationTypes.find(t => t.id === typeId);
    if (!locationType) {
      console.error(`Invalid location type ID: "${typeId}"`);
      const emptyCollection = { type: 'FeatureCollection', features: [] };
      this.locations.set(typeId, emptyCollection);
      return emptyCollection;
    }

    // Create loading promise
    const loadingPromise = this._loadLocationTypeData(locationType);
    this.loadingPromises.set(typeId, loadingPromise);

    try {
      const data = await loadingPromise;
      return data;
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(typeId);
    }
  }

  /**
   * Internal method to load location type data
   * Handles file fetching, validation, and caching
   * 
   * @private
   * @param {Object} locationType - The location type configuration
   * @returns {Promise<Object>} The loaded GeoJSON FeatureCollection
   */
  async _loadLocationTypeData(locationType) {
    const { id, name, dataFile } = locationType;
    
    console.log(`Loading ${name} (${id}) from ${dataFile}...`);

    try {
      // Fetch GeoJSON file
      const response = await fetch(dataFile);
      
      // Check if file exists
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`File not found: ${dataFile}`);
        } else {
          console.warn(`Failed to load ${dataFile}: ${response.status} ${response.statusText}`);
        }
        const emptyCollection = { type: 'FeatureCollection', features: [] };
        this.locations.set(id, emptyCollection);
        return emptyCollection;
      }

      // Parse JSON
      const data = await response.json();

      // Validate GeoJSON structure
      if (!this._validateGeoJSON(data, id)) {
        console.error(`Invalid GeoJSON data in ${dataFile}`);
        const emptyCollection = { type: 'FeatureCollection', features: [] };
        this.locations.set(id, emptyCollection);
        return emptyCollection;
      }

      // Filter data to reduce excessive features
      const filteredData = this._filterLocationData(data, id);

      // Cache the filtered data
      this.locations.set(id, filteredData);
      
      const originalCount = data.features ? data.features.length : 0;
      const filteredCount = filteredData.features ? filteredData.features.length : 0;
      console.log(`✓ Loaded ${name}: ${originalCount} features → ${filteredCount} features (filtered)`);

      return filteredData;

    } catch (error) {
      console.error(`Error loading ${name} from ${dataFile}:`, error);
      const emptyCollection = { type: 'FeatureCollection', features: [] };
      this.locations.set(id, emptyCollection);
      return emptyCollection;
    }
  }

  /**
   * Filter location data to reduce excessive features
   * Applies different filtering strategies based on location type
   * 
   * @private
   * @param {Object} data - The GeoJSON FeatureCollection to filter
   * @param {string} typeId - The location type ID
   * @returns {Object} Filtered GeoJSON FeatureCollection
   */
  _filterLocationData(data, typeId) {
    if (!data || !data.features || !Array.isArray(data.features)) {
      return data;
    }

    let filteredFeatures = [...data.features];

    switch (typeId) {
      case 'highway':
        // Cao tốc: BỎ HOÀN TOÀN - quá nhiều data (8,383 features) và không cần thiết
        filteredFeatures = [];
        console.log(`  Highway filter: ${data.features.length} → 0 (disabled - too many features)`);
        break;

      case 'residential':
        // Khu dân cư: BỎ HOÀN TOÀN - quá nhiều và không cần thiết cho KCN/CCN
        filteredFeatures = [];
        console.log(`  Residential filter: ${data.features.length} → 0 (disabled - too many features)`);
        break;

      case 'seaport':
      case 'airport':
      case 'city_center':
        // Các loại này: giữ nguyên (số lượng hợp lý)
        // city_center giờ chỉ có 63 features (5 TP trực thuộc TW + 58 tỉnh)
        break;

      default:
        console.warn(`  Unknown location type "${typeId}" - no filtering applied`);
    }

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
  }

  /**
   * Validate GeoJSON data structure
   * Basic validation to ensure data is a valid FeatureCollection
   * 
   * @private
   * @param {Object} data - The GeoJSON data to validate
   * @param {string} typeId - The location type ID for logging
   * @returns {boolean} True if valid, false otherwise
   */
  _validateGeoJSON(data, typeId) {
    if (!data) {
      console.error(`${typeId}: GeoJSON data is null or undefined`);
      return false;
    }

    if (typeof data !== 'object') {
      console.error(`${typeId}: GeoJSON data must be an object`);
      return false;
    }

    if (data.type !== 'FeatureCollection') {
      console.error(`${typeId}: Invalid GeoJSON type: expected "FeatureCollection", got "${data.type}"`);
      return false;
    }

    if (!Array.isArray(data.features)) {
      console.error(`${typeId}: GeoJSON FeatureCollection must have a "features" array`);
      return false;
    }

    if (data.features.length === 0) {
      console.warn(`${typeId}: GeoJSON FeatureCollection has no features`);
    }

    return true;
  }

  /**
   * Get locations by type
   * Returns cached location data for a specific type
   * 
   * @param {string} typeId - The location type ID
   * @returns {Object} GeoJSON FeatureCollection (empty if not loaded or invalid)
   */
  getLocationsByType(typeId) {
    if (!this.locations.has(typeId)) {
      console.warn(`Location type "${typeId}" not loaded yet. Call loadLocationType() first.`);
      return { type: 'FeatureCollection', features: [] };
    }

    return this.locations.get(typeId);
  }

  /**
   * Get all locations
   * Returns a combined FeatureCollection with all loaded locations
   * Each feature is augmented with a 'locationType' property
   * 
   * @returns {Object} Combined GeoJSON FeatureCollection
   */
  getAllLocations() {
    const allFeatures = [];

    // Combine features from all loaded location types
    for (const [typeId, featureCollection] of this.locations.entries()) {
      if (featureCollection && featureCollection.features) {
        // Add location type information to each feature
        const featuresWithType = featureCollection.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            locationType: typeId
          }
        }));
        
        allFeatures.push(...featuresWithType);
      }
    }

    return {
      type: 'FeatureCollection',
      features: allFeatures
    };
  }

  /**
   * Search locations by name or type
   * Searches across all loaded location types
   * Supports Vietnamese and English names
   * 
   * Requirements validated: 7.1, 7.2
   * 
   * @param {string} query - The search query (name or type)
   * @returns {Array<Object>} Array of search results with location and type info
   */
  searchLocations(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery.length === 0) {
      return [];
    }

    const results = [];

    // Search through all loaded location types
    for (const [typeId, featureCollection] of this.locations.entries()) {
      if (!featureCollection || !featureCollection.features) {
        continue;
      }

      const locationType = this.getLocationType(typeId);
      if (!locationType) {
        continue;
      }

      // Check if query matches location type name
      const typeNameMatch = locationType.name.toLowerCase().includes(normalizedQuery);

      // Search through features
      for (const feature of featureCollection.features) {
        const properties = feature.properties || {};
        
        // Extract possible name fields
        const name = properties.name || '';
        const nameEn = properties['name:en'] || '';
        const nameVi = properties['name:vi'] || '';
        const industrial = properties.industrial || '';
        const landuse = properties.landuse || '';
        const amenity = properties.amenity || '';

        // Check if any name field matches the query
        const nameMatch = 
          name.toLowerCase().includes(normalizedQuery) ||
          nameEn.toLowerCase().includes(normalizedQuery) ||
          nameVi.toLowerCase().includes(normalizedQuery) ||
          industrial.toLowerCase().includes(normalizedQuery) ||
          landuse.toLowerCase().includes(normalizedQuery) ||
          amenity.toLowerCase().includes(normalizedQuery);

        // Include result if name matches OR type matches
        if (nameMatch || typeNameMatch) {
          results.push({
            feature: feature,
            locationType: locationType,
            displayName: this._getDisplayName(properties),
            typeId: typeId
          });
        }
      }
    }

    return results;
  }

  /**
   * Get display name for a location
   * Prioritizes Vietnamese name, then English, then other fields
   * 
   * @private
   * @param {Object} properties - Feature properties
   * @returns {string} Display name
   */
  _getDisplayName(properties) {
    // Priority: name:vi > name > name:en > industrial > landuse > amenity > "Unnamed"
    return properties['name:vi'] || 
           properties.name || 
           properties['name:en'] || 
           properties.industrial || 
           properties.landuse || 
           properties.amenity || 
           'Unnamed location';
  }

  /**
   * Get location types configuration
   * Returns the array of location type definitions
   * 
   * @returns {Array<Object>} Array of location type configurations
   */
  getLocationTypes() {
    return [...this.locationTypes]; // Return a copy to prevent modification
  }

  /**
   * Get location type by ID
   * Returns the configuration for a specific location type
   * 
   * @param {string} typeId - The location type ID
   * @returns {Object|null} Location type configuration or null if not found
   */
  getLocationType(typeId) {
    return this.locationTypes.find(t => t.id === typeId) || null;
  }

  /**
   * Check if a location type is loaded
   * 
   * @param {string} typeId - The location type ID
   * @returns {boolean} True if loaded, false otherwise
   */
  isLoaded(typeId) {
    return this.locations.has(typeId);
  }

  /**
   * Check if all location types are loaded
   * 
   * @returns {boolean} True if all types are loaded, false otherwise
   */
  areAllLoaded() {
    return this.locationTypes.every(type => this.locations.has(type.id));
  }

  /**
   * Get total count of locations across all types
   * 
   * @returns {number} Total number of features
   */
  getTotalCount() {
    let total = 0;
    for (const featureCollection of this.locations.values()) {
      if (featureCollection && featureCollection.features) {
        total += featureCollection.features.length;
      }
    }
    return total;
  }

  /**
   * Get count of locations for a specific type
   * 
   * @param {string} typeId - The location type ID
   * @returns {number} Number of features for this type
   */
  getCountByType(typeId) {
    const featureCollection = this.locations.get(typeId);
    if (!featureCollection || !featureCollection.features) {
      return 0;
    }
    return featureCollection.features.length;
  }

  /**
   * Clear all cached location data
   * Useful for forcing a reload
   */
  clearCache() {
    console.log('Clearing location cache...');
    this.locations.clear();
    this.loadingPromises.clear();
  }

  /**
   * Clear cache for a specific location type
   * 
   * @param {string} typeId - The location type ID
   */
  clearCacheForType(typeId) {
    console.log(`Clearing cache for location type: ${typeId}`);
    this.locations.delete(typeId);
    this.loadingPromises.delete(typeId);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { LocationManager, LOCATION_TYPES };
}

// ES6 module export for browser
export default LocationManager;
export { LOCATION_TYPES };
