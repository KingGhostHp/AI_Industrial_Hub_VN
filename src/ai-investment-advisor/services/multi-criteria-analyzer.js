/**
 * Multi-Criteria Analyzer Service
 * 
 * Evaluates and ranks industrial zones based on weighted criteria.
 * Implements scoring formulas, tiebreaker logic, and threshold filtering.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5, 4.6
 */

import { Recommendation } from '../models/recommendation.js';
import {
  normalizeWeights,
  calculatePriceScore,
  calculateLocationScore,
  calculateInfrastructureScore,
  calculateAcreageScore,
  calculateProximityScore,
  calculateLogisticsScore,
  calculateWeightedScore
} from '../utils/scoring-formulas.js';

/**
 * Multi-Criteria Analyzer
 * Evaluates zones based on price, location, infrastructure, and logistics
 */
export class MultiCriteriaAnalyzer {
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
   */
  _defaultDistanceCalculator(coord1, coord2) {
    if (!coord1 || !coord2) return Infinity;
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    
    const R = 6371; // Earth's radius in km
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Calculate recommendation score for a zone
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

      // 1. Price Score
      const price = this._parsePrice(props.price);
      scores.price = calculatePriceScore(
        price,
        datasetBounds.price?.min || 0,
        datasetBounds.price?.max || 1000
      );

      // 2. Location Score
      const provinceDevLevel = this._getProvinceDevLevel(props.province);
      scores.location = calculateLocationScore(provinceDevLevel);

      // 3. Infrastructure Score
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

      // 4. Logistics Score
      let logisticsScore = 50; // Default middle score
      if (coords && Array.isArray(coords) && coords.length === 2) {
        const avgDistance = this._calculateAverageDistance(coords);
        logisticsScore = calculateLogisticsScore(
          avgDistance,
          datasetBounds.distance?.max || 500
        );
      }
      scores.logistics = logisticsScore;

      // Calculate weighted score
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
        rank: 0
      };

    } catch (error) {
      console.error('[MultiCriteriaAnalyzer] Error calculating score:', error);
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

      // Sort by score descending
      scoredZones.sort((a, b) => {
        if (Math.abs(a.score - b.score) > 0.001) {
          return b.score - a.score;
        }

        // Tiebreaker: by distance to nearest strategic location (ascending)
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
   */
  getTopRecommendations(rankedZones, limit = 20, minScore = null) {
    try {
      if (!Array.isArray(rankedZones)) {
        throw new Error('rankedZones must be an array');
      }

      let filtered = rankedZones;

      if (minScore !== null && typeof minScore === 'number') {
        filtered = rankedZones.filter(item => item.score >= minScore);
      }

      return filtered.slice(0, limit);

    } catch (error) {
      console.error('[MultiCriteriaAnalyzer] Error getting top recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate dataset bounds for normalization
   * @private
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
   */
  _parsePrice(price) {
    if (typeof price === 'number') {
      return price;
    }
    if (typeof price === 'string') {
      const cleaned = price.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Get province development level
   * @private
   */
  _getProvinceDevLevel(province) {
    const highDev = ['Hà Nội', 'Thành phố Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
    const mediumDev = [
      'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Hải Dương', 'Hưng Yên',
      'Bắc Ninh', 'Vĩnh Phúc', 'Quảng Ninh', 'Thanh Hóa', 'Nghệ An',
      'Thừa Thiên Huế', 'Quảng Nam', 'Bình Định', 'Khánh Hòa', 'Lâm Đồng',
      'Bình Phước', 'Tây Ninh', 'Long An', 'Tiền Giang', 'Bến Tre',
      'Vĩnh Long', 'An Giang', 'Kiên Giang'
    ];

    if (highDev.includes(province)) return 3;
    if (mediumDev.includes(province)) return 2;
    return 1;
  }

  /**
   * Calculate average distance to strategic locations
   * @private
   */
  _calculateAverageDistance(coords) {
    const distances = [];

    const locationTypes = ['ports', 'airports', 'cityCenters'];
    locationTypes.forEach(type => {
      if (this.strategicLocations[type] && this.strategicLocations[type].length > 0) {
        const typeDistances = this.strategicLocations[type].map(loc => {
          const locCoords = loc.geometry?.coordinates || loc.coordinates;
          if (locCoords && Array.isArray(locCoords) && locCoords.length === 2) {
            return this.distanceCalculator(coords, locCoords);
          }
          return Infinity;
        });
        const minDist = Math.min(...typeDistances);
        if (isFinite(minDist)) distances.push(minDist);
      }
    });

    if (distances.length === 0) return 100;
    return distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }

  /**
   * Get minimum distance to any strategic location
   * @private
   */
  _getMinDistanceToStrategicLocation(zone) {
    const coords = zone.geometry?.coordinates;
    if (!coords || !Array.isArray(coords) || coords.length !== 2) return Infinity;

    const allDistances = [];
    const locationTypes = ['ports', 'airports', 'cityCenters'];
    locationTypes.forEach(type => {
      if (this.strategicLocations[type] && Array.isArray(this.strategicLocations[type])) {
        this.strategicLocations[type].forEach(location => {
          const locationCoords = location.geometry?.coordinates || location.coordinates;
          if (locationCoords && Array.isArray(locationCoords) && locationCoords.length === 2) {
            const distance = this.distanceCalculator(coords, locationCoords);
            if (isFinite(distance)) allDistances.push(distance);
          }
        });
      }
    });

    return allDistances.length > 0 ? Math.min(...allDistances) : Infinity;
  }
}

export default MultiCriteriaAnalyzer;

