/**
 * Icon Registry for Strategic Locations
 * 
 * Maps location types to Lucide icon names and provides helper functions
 * to retrieve icon information by location type.
 * 
 * Requirements validated: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.5
 */

/**
 * Icon mapping for strategic location types
 * Maps location type IDs to Lucide icon names
 * 
 * @type {Object.<string, string>}
 */
const ICON_MAPPING = {
  seaport: 'anchor',
  airport: 'plane',
  highway: 'highway',
  city_center: 'building-2',
  residential: 'home'
};

/**
 * Get the Lucide icon name for a given location type
 * 
 * @param {string} locationType - The location type ID (e.g., 'seaport', 'airport')
 * @returns {string} The Lucide icon name, or 'map-pin' as default if type not found
 * 
 * @example
 * getIconByType('seaport') // returns 'anchor'
 * getIconByType('airport') // returns 'plane'
 * getIconByType('unknown') // returns 'map-pin' (default)
 */
function getIconByType(locationType) {
  return ICON_MAPPING[locationType] || 'map-pin';
}

/**
 * Get all available location types with their icon mappings
 * 
 * @returns {Object.<string, string>} Object mapping location types to icon names
 * 
 * @example
 * getAllIconMappings() 
 * // returns { seaport: 'anchor', airport: 'plane', ... }
 */
function getAllIconMappings() {
  return { ...ICON_MAPPING };
}

/**
 * Check if a location type has a registered icon
 * 
 * @param {string} locationType - The location type ID to check
 * @returns {boolean} True if the location type has a registered icon
 * 
 * @example
 * hasIcon('seaport') // returns true
 * hasIcon('unknown') // returns false
 */
function hasIcon(locationType) {
  return locationType in ICON_MAPPING;
}

/**
 * Get a list of all registered location types
 * 
 * @returns {string[]} Array of location type IDs
 * 
 * @example
 * getRegisteredTypes() 
 * // returns ['seaport', 'airport', 'highway', 'city_center', 'residential']
 */
function getRegisteredTypes() {
  return Object.keys(ICON_MAPPING);
}

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getIconByType,
    getAllIconMappings,
    hasIcon,
    getRegisteredTypes,
    ICON_MAPPING
  };
}
