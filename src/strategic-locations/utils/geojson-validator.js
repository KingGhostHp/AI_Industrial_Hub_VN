/**
 * GeoJSON Validator Utility
 * 
 * Validates GeoJSON data structure and geometry types for strategic locations.
 * Logs warnings for invalid data but doesn't throw errors to allow graceful degradation.
 */

/**
 * Valid GeoJSON geometry types
 */
const VALID_GEOMETRY_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection'
];

/**
 * Expected geometry types for each location type
 */
const EXPECTED_GEOMETRY_TYPES = {
  seaport: ['Point'],
  airport: ['Point'],
  highway: ['LineString', 'MultiLineString'],
  city_center: ['Point'],
  residential: ['Polygon', 'MultiPolygon']
};

/**
 * Validates a GeoJSON FeatureCollection
 * 
 * @param {Object} data - The GeoJSON data to validate
 * @param {string} locationTypeId - Optional location type ID for specific validation
 * @returns {Object} Validation result with { valid: boolean, errors: string[], warnings: string[] }
 */
function validateGeoJSON(data, locationTypeId = null) {
  const errors = [];
  const warnings = [];

  // Check if data exists
  if (!data) {
    errors.push('GeoJSON data is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Check if data is an object
  if (typeof data !== 'object') {
    errors.push('GeoJSON data must be an object');
    return { valid: false, errors, warnings };
  }

  // Validate FeatureCollection structure
  if (data.type !== 'FeatureCollection') {
    errors.push(`Invalid GeoJSON type: expected "FeatureCollection", got "${data.type}"`);
    return { valid: false, errors, warnings };
  }

  // Check for features array
  if (!Array.isArray(data.features)) {
    errors.push('GeoJSON FeatureCollection must have a "features" array');
    return { valid: false, errors, warnings };
  }

  // Warn if features array is empty
  if (data.features.length === 0) {
    warnings.push('GeoJSON FeatureCollection has no features');
  }

  // Validate each feature
  let validFeatureCount = 0;
  data.features.forEach((feature, index) => {
    const featureValidation = validateFeature(feature, index, locationTypeId);
    
    if (featureValidation.valid) {
      validFeatureCount++;
    } else {
      errors.push(...featureValidation.errors);
    }
    
    warnings.push(...featureValidation.warnings);
  });

  // Log summary
  if (warnings.length > 0) {
    console.warn(`GeoJSON validation warnings (${warnings.length}):`, warnings);
  }

  if (errors.length > 0) {
    console.error(`GeoJSON validation errors (${errors.length}):`, errors);
  }

  const valid = errors.length === 0;
  
  if (valid) {
    console.log(`✓ GeoJSON validation passed: ${validFeatureCount} valid features`);
  }

  return { valid, errors, warnings, validFeatureCount };
}

/**
 * Validates a single GeoJSON Feature
 * 
 * @param {Object} feature - The feature to validate
 * @param {number} index - The feature index in the collection
 * @param {string} locationTypeId - Optional location type ID for specific validation
 * @returns {Object} Validation result with { valid: boolean, errors: string[], warnings: string[] }
 */
function validateFeature(feature, index, locationTypeId = null) {
  const errors = [];
  const warnings = [];

  // Check feature type
  if (feature.type !== 'Feature') {
    errors.push(`Feature ${index}: Invalid type "${feature.type}", expected "Feature"`);
    return { valid: false, errors, warnings };
  }

  // Check for geometry
  if (!feature.geometry) {
    errors.push(`Feature ${index}: Missing geometry`);
    return { valid: false, errors, warnings };
  }

  // Validate geometry
  const geometryValidation = validateGeometry(feature.geometry, index);
  errors.push(...geometryValidation.errors);
  warnings.push(...geometryValidation.warnings);

  // Check if geometry type matches expected type for location
  if (locationTypeId && geometryValidation.valid) {
    const expectedTypes = EXPECTED_GEOMETRY_TYPES[locationTypeId];
    if (expectedTypes && !expectedTypes.includes(feature.geometry.type)) {
      warnings.push(
        `Feature ${index}: Geometry type "${feature.geometry.type}" is unexpected for location type "${locationTypeId}". ` +
        `Expected: ${expectedTypes.join(' or ')}`
      );
    }
  }

  // Check for properties
  if (!feature.properties) {
    warnings.push(`Feature ${index}: Missing properties object`);
  } else if (typeof feature.properties !== 'object') {
    warnings.push(`Feature ${index}: Properties must be an object`);
  }

  // Warn if feature has no name
  if (feature.properties && !feature.properties.name && !feature.properties['name:vi'] && !feature.properties['name:en']) {
    warnings.push(`Feature ${index}: No name property found (name, name:vi, or name:en)`);
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

/**
 * Validates a GeoJSON Geometry object
 * 
 * @param {Object} geometry - The geometry to validate
 * @param {number} featureIndex - The feature index for error messages
 * @returns {Object} Validation result with { valid: boolean, errors: string[], warnings: string[] }
 */
function validateGeometry(geometry, featureIndex) {
  const errors = [];
  const warnings = [];

  // Check geometry type
  if (!geometry.type) {
    errors.push(`Feature ${featureIndex}: Geometry missing type`);
    return { valid: false, errors, warnings };
  }

  if (!VALID_GEOMETRY_TYPES.includes(geometry.type)) {
    errors.push(`Feature ${featureIndex}: Invalid geometry type "${geometry.type}"`);
    return { valid: false, errors, warnings };
  }

  // Check for coordinates (except GeometryCollection)
  if (geometry.type !== 'GeometryCollection') {
    if (!geometry.coordinates) {
      errors.push(`Feature ${featureIndex}: Geometry missing coordinates`);
      return { valid: false, errors, warnings };
    }

    if (!Array.isArray(geometry.coordinates)) {
      errors.push(`Feature ${featureIndex}: Geometry coordinates must be an array`);
      return { valid: false, errors, warnings };
    }

    // Validate coordinates based on geometry type
    const coordValidation = validateCoordinates(geometry.type, geometry.coordinates, featureIndex);
    errors.push(...coordValidation.errors);
    warnings.push(...coordValidation.warnings);
  } else {
    // Validate GeometryCollection
    if (!Array.isArray(geometry.geometries)) {
      errors.push(`Feature ${featureIndex}: GeometryCollection missing geometries array`);
      return { valid: false, errors, warnings };
    }

    geometry.geometries.forEach((geom, geomIndex) => {
      const geomValidation = validateGeometry(geom, `${featureIndex}.${geomIndex}`);
      errors.push(...geomValidation.errors);
      warnings.push(...geomValidation.warnings);
    });
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

/**
 * Validates coordinates based on geometry type
 * 
 * @param {string} geometryType - The geometry type
 * @param {Array} coordinates - The coordinates array
 * @param {number} featureIndex - The feature index for error messages
 * @returns {Object} Validation result with { valid: boolean, errors: string[], warnings: string[] }
 */
function validateCoordinates(geometryType, coordinates, featureIndex) {
  const errors = [];
  const warnings = [];

  switch (geometryType) {
    case 'Point':
      if (!validatePosition(coordinates)) {
        errors.push(`Feature ${featureIndex}: Invalid Point coordinates`);
      }
      break;

    case 'LineString':
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        errors.push(`Feature ${featureIndex}: LineString must have at least 2 positions`);
      } else {
        coordinates.forEach((pos, i) => {
          if (!validatePosition(pos)) {
            errors.push(`Feature ${featureIndex}: Invalid position at index ${i} in LineString`);
          }
        });
      }
      break;

    case 'Polygon':
      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        errors.push(`Feature ${featureIndex}: Polygon must have at least one ring`);
      } else {
        coordinates.forEach((ring, ringIndex) => {
          if (!Array.isArray(ring) || ring.length < 4) {
            errors.push(`Feature ${featureIndex}: Polygon ring ${ringIndex} must have at least 4 positions`);
          } else {
            // Check if ring is closed
            const first = ring[0];
            const last = ring[ring.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              warnings.push(`Feature ${featureIndex}: Polygon ring ${ringIndex} is not closed`);
            }

            ring.forEach((pos, i) => {
              if (!validatePosition(pos)) {
                errors.push(`Feature ${featureIndex}: Invalid position at index ${i} in Polygon ring ${ringIndex}`);
              }
            });
          }
        });
      }
      break;

    case 'MultiPoint':
      if (!Array.isArray(coordinates)) {
        errors.push(`Feature ${featureIndex}: MultiPoint coordinates must be an array`);
      } else {
        coordinates.forEach((pos, i) => {
          if (!validatePosition(pos)) {
            errors.push(`Feature ${featureIndex}: Invalid position at index ${i} in MultiPoint`);
          }
        });
      }
      break;

    case 'MultiLineString':
      if (!Array.isArray(coordinates)) {
        errors.push(`Feature ${featureIndex}: MultiLineString coordinates must be an array`);
      } else {
        coordinates.forEach((lineString, lineIndex) => {
          if (!Array.isArray(lineString) || lineString.length < 2) {
            errors.push(`Feature ${featureIndex}: LineString ${lineIndex} in MultiLineString must have at least 2 positions`);
          } else {
            lineString.forEach((pos, i) => {
              if (!validatePosition(pos)) {
                errors.push(`Feature ${featureIndex}: Invalid position at index ${i} in MultiLineString line ${lineIndex}`);
              }
            });
          }
        });
      }
      break;

    case 'MultiPolygon':
      if (!Array.isArray(coordinates)) {
        errors.push(`Feature ${featureIndex}: MultiPolygon coordinates must be an array`);
      } else {
        coordinates.forEach((polygon, polyIndex) => {
          if (!Array.isArray(polygon) || polygon.length === 0) {
            errors.push(`Feature ${featureIndex}: Polygon ${polyIndex} in MultiPolygon must have at least one ring`);
          } else {
            polygon.forEach((ring, ringIndex) => {
              if (!Array.isArray(ring) || ring.length < 4) {
                errors.push(`Feature ${featureIndex}: Polygon ${polyIndex} ring ${ringIndex} in MultiPolygon must have at least 4 positions`);
              } else {
                ring.forEach((pos, i) => {
                  if (!validatePosition(pos)) {
                    errors.push(`Feature ${featureIndex}: Invalid position at index ${i} in MultiPolygon polygon ${polyIndex} ring ${ringIndex}`);
                  }
                });
              }
            });
          }
        });
      }
      break;
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

/**
 * Validates a position (coordinate pair/triple)
 * 
 * @param {Array} position - The position to validate [longitude, latitude, altitude?]
 * @returns {boolean} True if valid
 */
function validatePosition(position) {
  if (!Array.isArray(position)) {
    return false;
  }

  if (position.length < 2) {
    return false;
  }

  const [lon, lat] = position;

  // Check if coordinates are numbers
  if (typeof lon !== 'number' || typeof lat !== 'number') {
    return false;
  }

  // Check if coordinates are finite
  if (!isFinite(lon) || !isFinite(lat)) {
    return false;
  }

  // Check longitude range (-180 to 180)
  if (lon < -180 || lon > 180) {
    return false;
  }

  // Check latitude range (-90 to 90)
  if (lat < -90 || lat > 90) {
    return false;
  }

  return true;
}

/**
 * Filters out invalid features from a GeoJSON FeatureCollection
 * Returns a new FeatureCollection with only valid features
 * 
 * @param {Object} data - The GeoJSON FeatureCollection
 * @param {string} locationTypeId - Optional location type ID for specific validation
 * @returns {Object} New FeatureCollection with only valid features
 */
function filterValidFeatures(data, locationTypeId = null) {
  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    console.error('Invalid GeoJSON data provided to filterValidFeatures');
    return { type: 'FeatureCollection', features: [] };
  }

  const validFeatures = data.features.filter((feature, index) => {
    const validation = validateFeature(feature, index, locationTypeId);
    return validation.valid;
  });

  console.log(`Filtered ${validFeatures.length} valid features out of ${data.features.length} total features`);

  return {
    type: 'FeatureCollection',
    features: validFeatures,
    // Preserve other properties if they exist
    ...(data.generator && { generator: data.generator }),
    ...(data.copyright && { copyright: data.copyright }),
    ...(data.timestamp && { timestamp: data.timestamp })
  };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    validateGeoJSON,
    validateFeature,
    validateGeometry,
    validateCoordinates,
    validatePosition,
    filterValidFeatures,
    VALID_GEOMETRY_TYPES,
    EXPECTED_GEOMETRY_TYPES
  };
}
