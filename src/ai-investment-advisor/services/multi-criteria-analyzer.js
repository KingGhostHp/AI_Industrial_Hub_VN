/**
 * Multi-Criteria Analyzer Service
 * 
 * Evaluates and ranks industrial zones based on weighted criteria.
 * Implements scoring formulas, tiebreaker logic, and threshold filtering.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5, 4.6
 */

const { Recommendation } = require('../models/recommendation.js');
const {
  normalizeWeights,
  calculatePriceScore,
  calculateLocationScore,
  calculateInfrastructureScore,
  calculateAcreageScore,
  calculateProximityScore,
  calculateLogisticsScore,
  calculateWeightedScore
} = require('../utils/scoring-formulas.js');

/**
 * Multi-Criteria Analyzer
 * Evaluates zones based on price, location, infrastructure, and logistics
 */
class MultiCriteriaAnalyzer {
  /**
   * Create a new MultiCriteriaAnalyzer
   * @param {Object} options - Configuration options
   * @param {Object} options.strategicLocations - Strategic locations data (ports, airports, city centers)
   * @param {Function} options.distanceCalculator - Function to calculate distance between coordinates
   */
  constructor(options = {}) {
    this.strategicLocations = options.strategicLocations || {
      ports: [],
      airports: [],
      cityCenters: []
    };
    this.distanceCalculator = options.distanceCalculator || this._defaultDistanceCalculator;
  }

  /**
   * Default distance calculator using Haversine formula
   * @private
   * @param {Array} coord1 - [lng, lat]
   * @param {Array} coord2 - [lng, lat]
   * @returns {number} Distance in kilometers
   */
  _defaultDistanceCalculator(coord1, coord2) {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    
    const R = 6371; // Earth's radius in km
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Calculate recommendation score for a zone
   * 
   * @param {Object} zone - Zone GeoJSON feature
   * @param {Object} criteria - User criteria and weights
   * @param {Object} criteria.weights - Criteria weights { price, location, infrastructure, logistics }
   * @param {Object} criteria.budgetRange - Budget range { min, max }
   * @param {Array} criteria.preferredProvinces - Optional list of preferred provinces
   * @param {Object} industryProfile - Industry-specific configuration
   * @param {Object} datasetBounds - Dataset min/max values for normalization
   * @param {Object} datasetBounds.price - { min, max }
   * @param {Object} datasetBounds.acreage - { min, max }
   * @param {Object} datasetBounds.distance - { max }
   * @returns {Object} - { score, breakdown, rank }
   * 
   * @example
   * const result = analyzer.calculateScore(zone, criteria, industryProfile, datasetBounds);
   * // Returns: { score: 75.5, breakdown: { price: {...}, location: {...}, ... }, rank: 0 }
   */
  calculateScore(zone, criteria, industryProfile, datasetBounds) {
    try {
      // Validate inputs
      if (!zone || !zone.properties) {
        throw new Error('Invalid zone: must be a GeoJSON feature with properties');
      }
      if (!criteria || !criteria.weights) {
        throw new Error('Invalid criteria: must include weights');
      }
      if (!industryProfile || !industryProfile.weights) {
        throw new Error('Invalid industryProfile: must include weights');
      }
      if (!datasetBounds) {
        throw new Error('Invalid datasetBounds: required for score normalization');
      }

      const props = zone.properties;
      const coords = zone.geometry?.coordinates;

      // Use industry profile weights if no custom weights provided
      const weights = criteria.weights || industryProfile.weights;

      // Calculate individual criterion scores
      const scores = {};

      // 1. Price Score (Requirement 1.1)
      const price = this._parsePrice(props.price);
      scores.price = calculatePriceScore(
        price,
        datasetBounds.price?.min || 0,
        datasetBounds.price?.max || 1000
      );

      // 2. Location Score (Requirement 1.1)
      const provinceDevLevel = this._getProvinceDevLevel(props.province);
      scores.location = calculateLocationScore(provinceDevLevel);

      // 3. Infrastructure Score (Requirement 1.1)
      const acreage = parseFloat(props.acreage) || 0;
      const acreageScore = calculateAcreageScore(
        acreage,
        datasetBounds.acreage?.min || 0,
        datasetBounds.acreage?.max || 1000
      );

      // Calculate proximity score based on distance to strategic locations
      let proximityScore = 50; // Default middle score
      if (coords && Array.isArray(coords) && coords.length === 2) {
        const avgDistance = this._calculateAverageDistance(coords);
        proximityScore = calculateProximityScore(
          avgDistance,
          datasetBounds.distance?.max || 500
        );
      }

      scores.infrastructure = calculateInfrastructureScore(acreageScore, proximityScore);

      // 4. Logistics Score (Requirement 1.1)
      let logisticsScore = 50; // Default middle score
      if (coords && Array.isArray(coords) && coords.length === 2) {
        const avgDistance = this._calculateAverageDistance(coords);
        logisticsScore = calculateLogisticsScore(
          avgDistance,
          datasetBounds.distance?.max || 500
        );
      }
      scores.logistics = logisticsScore;

      // Calculate weighted score (Requirement 1.3)
      const totalScore = calculateWeightedScore(scores, weights);

      // Normalize weights for breakdown
      const normalizedWeights = normalizeWeights(weights);

      // Create breakdown object
      const breakdown = {
        price: { score: scores.price, weight: normalizedWeights.price },
        location: { score: scores.location, weight: normalizedWeights.location },
        infrastructure: { score: scores.infrastructure, weight: normalizedWeights.infrastructure },
        logistics: { score: scores.logistics, weight: normalizedWeights.logistics }
      };

      return {
        score: totalScore,
        breakdown: breakdown,
        rank: 0 // Will be set during ranking
      };

    } catch (error) {
      console.error('[MultiCriteriaAnalyzer] Error calculating score:', error);
      // Return default score on error
      return {
        score: 0,
        breakdown: {
          price: { score: 0, weight: 0.25 },
          location: { score: 0, weight: 0.25 },
          infrastructure: { score: 0, weight: 0.25 },
          logistics: { score: 0, weight: 0.25 }
        },
        rank: 0
      };
    }
  }

  /**
   * Rank all zones by recommendation score
   * 
   * @param {Array} zones - Array of zone GeoJSON features
   * @param {Object} criteria - User criteria
   * @param {Object} industryProfile - Industry-specific configuration
   * @returns {Array} - Sorted array of { zone, score, breakdown }
   * 
   * @example
   * const ranked = analyzer.rankZones(zones, criteria, industryProfile);
   * // Returns: [{ zone: {...}, score: 85, breakdown: {...} }, ...]
   */
  rankZones(zones, criteria, industryProfile) {
    try {
      // Validate inputs
      if (!Array.isArray(zones)) {
        throw new Error('zones must be an array');
      }
      if (zones.length === 0) {
        return [];
      }

      // Calculate dataset bounds for normalization
      const datasetBounds = this._calculateDatasetBounds(zones);

      // Calculate scores for all zones
      const scoredZones = zones.map(zone => {
        const result = this.calculateScore(zone, criteria, industryProfile, datasetBounds);
        return {
          zone: zone,
          score: result.score,
          breakdown: result.breakdown
        };
      });

      // Sort by score descending (Requirement 1.4)
      scoredZones.sort((a, b) => {
        // Primary sort: by score (descending)
        if (Math.abs(a.score - b.score) > 0.001) { // Use small epsilon for floating point comparison
          return b.score - a.score;
        }

        // Tiebreaker: by distance to nearest strategic location (ascending) (Requirement 1.5)
        const distanceA = this._getMinDistanceToStrategicLocation(a.zone);
        const distanceB = this._getMinDistanceToStrategicLocation(b.zone);
        return distanceA - distanceB;
      });

      // Assign ranks
      scoredZones.forEach((item, index) => {
        item.rank = index + 1;
      });

      return scoredZones;

    } catch (error) {
      console.error('[MultiCriteriaAnalyzer] Error ranking zones:', error);
      return [];
    }
  }

  /**
   * Get top N recommendations
   * 
   * @param {Array} rankedZones - Sorted zones from rankZones()
   * @param {Number} limit - Number of results (default 20)
   * @param {Number} minScore - Optional minimum score threshold (Requirement 4.6)
   * @returns {Array} - Top N zones
   * 
   * @example
   * const top20 = analyzer.getTopRecommendations(rankedZones, 20);
   * const topFiltered = analyzer.getTopRecommendations(rankedZones, 20, 70);
   */
  getTopRecommendations(rankedZones, limit = 20, minScore = null) {
    try {
      // Validate inputs
      if (!Array.isArray(rankedZones)) {
        throw new Error('rankedZones must be an array');
      }

      let filtered = rankedZones;

      // Apply threshold filtering if minScore provided (Requirement 4.6)
      if (minScore !== null && typeof minScore === 'number') {
        filtered = rankedZones.filter(item => item.score >= minScore);
      }

      // Return top N results
      return filtered.slice(0, limit);

    } catch (error) {
      console.error('[MultiCriteriaAnalyzer] Error getting top recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate dataset bounds for normalization
   * @private
   * @param {Array} zones - Array of zone features
   * @returns {Object} - { price: { min, max }, acreage: { min, max }, distance: { max } }
   */
  _calculateDatasetBounds(zones) {
    const bounds = {
      price: { min: Infinity, max: -Infinity },
      acreage: { min: Infinity, max: -Infinity },
      distance: { max: 0 }
    };

    zones.forEach(zone => {
      const props = zone.properties;

      // Price bounds
      const price = this._parsePrice(props.price);
      if (price > 0) {
        bounds.price.min = Math.min(bounds.price.min, price);
        bounds.price.max = Math.max(bounds.price.max, price);
      }

      // Acreage bounds
      const acreage = parseFloat(props.acreage) || 0;
      if (acreage > 0) {
        bounds.acreage.min = Math.min(bounds.acreage.min, acreage);
        bounds.acreage.max = Math.max(bounds.acreage.max, acreage);
      }

      // Distance bounds
      const coords = zone.geometry?.coordinates;
      if (coords && Array.isArray(coords) && coords.length === 2) {
        const avgDistance = this._calculateAverageDistance(coords);
        bounds.distance.max = Math.max(bounds.distance.max, avgDistance);
      }
    });

    // Handle edge cases where no valid data found
    if (bounds.price.min === Infinity) {
      bounds.price.min = 0;
      bounds.price.max = 1000;
    }
    if (bounds.acreage.min === Infinity) {
      bounds.acreage.min = 0;
      bounds.acreage.max = 1000;
    }
    if (bounds.distance.max === 0) {
      bounds.distance.max = 500;
    }

    return bounds;
  }

  /**
   * Parse price from string or number
   * @private
   * @param {string|number} price - Price value
   * @returns {number} - Parsed price
   */
  _parsePrice(price) {
    if (typeof price === 'number') {
      return price;
    }
    if (typeof price === 'string') {
      // Remove non-numeric characters except decimal point
      const cleaned = price.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Get province development level
   * @private
   * @param {string} province - Province name
   * @returns {number} - Development level (1=low, 2=medium, 3=high)
   */
  _getProvinceDevLevel(province) {
    // High development provinces (major cities)
    const highDev = [
      'Hà Nội', 'Thành phố Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'
    ];

    // Medium development provinces (industrial hubs)
    const mediumDev = [
      'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Hải Dương', 'Hưng Yên',
      'Bắc Ninh', 'Vĩnh Phúc', 'Quảng Ninh', 'Thanh Hóa', 'Nghệ An',
      'Thừa Thiên Huế', 'Quảng Nam', 'Bình Định', 'Khánh Hòa', 'Lâm Đồng',
      'Bình Phước', 'Tây Ninh', 'Long An', 'Tiền Giang', 'Bến Tre',
      'Vĩnh Long', 'An Giang', 'Kiên Giang'
    ];

    if (highDev.includes(province)) {
      return 3;
    } else if (mediumDev.includes(province)) {
      return 2;
    } else {
      return 1;
    }
  }

  /**
   * Calculate average distance to strategic locations
   * @private
   * @param {Array} coords - Zone coordinates [lng, lat]
   * @returns {number} - Average distance in km
   */
  _calculateAverageDistance(coords) {
    const distances = [];

    // Calculate distance to nearest port
    if (this.strategicLocations.ports && this.strategicLocations.ports.length > 0) {
      const portDistances = this.strategicLocations.ports.map(port => {
        const portCoords = port.geometry?.coordinates || port.coordinates;
        if (portCoords && Array.isArray(portCoords) && portCoords.length === 2) {
          try {
            return this.distanceCalculator(coords, portCoords);
          } catch (error) {
            return Infinity;
          }
        }
        return Infinity;
      });
      const minPortDistance = Math.min(...portDistances);
      if (isFinite(minPortDistance)) {
        distances.push(minPortDistance);
      }
    }

    // Calculate distance to nearest airport
    if (this.strategicLocations.airports && this.strategicLocations.airports.length > 0) {
      const airportDistances = this.strategicLocations.airports.map(airport => {
        const airportCoords = airport.geometry?.coordinates || airport.coordinates;
        if (airportCoords && Array.isArray(airportCoords) && airportCoords.length === 2) {
          try {
            return this.distanceCalculator(coords, airportCoords);
          } catch (error) {
            return Infinity;
          }
        }
        return Infinity;
      });
      const minAirportDistance = Math.min(...airportDistances);
      if (isFinite(minAirportDistance)) {
        distances.push(minAirportDistance);
      }
    }

    // Calculate distance to nearest city center
    if (this.strategicLocations.cityCenters && this.strategicLocations.cityCenters.length > 0) {
      const cityDistances = this.strategicLocations.cityCenters.map(city => {
        const cityCoords = city.geometry?.coordinates || city.coordinates;
        if (cityCoords && Array.isArray(cityCoords) && cityCoords.length === 2) {
          try {
            return this.distanceCalculator(coords, cityCoords);
          } catch (error) {
            return Infinity;
          }
        }
        return Infinity;
      });
      const minCityDistance = Math.min(...cityDistances);
      if (isFinite(minCityDistance)) {
        distances.push(minCityDistance);
      }
    }

    // Return average distance, or default if no valid distances
    if (distances.length === 0) {
      return 100; // Default distance if no strategic locations available
    }

    return distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }

  /**
   * Get minimum distance to any strategic location (for tiebreaker)
   * @private
   * @param {Object} zone - Zone GeoJSON feature
   * @returns {number} - Minimum distance in km
   */
  _getMinDistanceToStrategicLocation(zone) {
    const coords = zone.geometry?.coordinates;
    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      return Infinity; // Invalid coordinates, sort to end
    }

    const allDistances = [];

    // Collect all distances to strategic locations
    const locationTypes = ['ports', 'airports', 'cityCenters'];
    locationTypes.forEach(type => {
      if (this.strategicLocations[type] && Array.isArray(this.strategicLocations[type])) {
        this.strategicLocations[type].forEach(location => {
          const locationCoords = location.geometry?.coordinates || location.coordinates;
          if (locationCoords && Array.isArray(locationCoords) && locationCoords.length === 2) {
            try {
              const distance = this.distanceCalculator(coords, locationCoords);
              if (isFinite(distance)) {
                allDistances.push(distance);
              }
            } catch (error) {
              // Skip invalid distance calculations
            }
          }
        });
      }
    });

    // Return minimum distance, or Infinity if no valid distances
    return allDistances.length > 0 ? Math.min(...allDistances) : Infinity;
  }
}

// CommonJS export
module.exports = { MultiCriteriaAnalyzer };
