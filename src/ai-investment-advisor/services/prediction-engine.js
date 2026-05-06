/**
 * Prediction Engine Service
 * 
 * Generates statistical forecasts for development trends, rental prices, and saturation.
 * Implements caching mechanism with 24-hour TTL to improve performance.
 * 
 * Requirements: 4.1, 4.2, 5.1, 5.2, 5.5, 6.2, 6.3, 7.1, 7.2
 */

const {
  calculateGrowthPotential,
  forecastRentalPrice,
  calculateConfidenceInterval,
  calculateSaturationIndex,
  calculateDensity,
  classifyDevelopmentTrend,
  predictDevelopmentTrend,
  calculateSaturationRisk
} = require('../utils/statistical-methods.js');

const { Prediction } = require('../models/prediction.js');

/**
 * PredictionEngine class
 * 
 * Provides predictive analytics for industrial zones including:
 * - Growth potential scoring
 * - Rental price forecasting
 * - Development trend prediction
 * - Saturation index calculation
 */
class PredictionEngine {
  /**
   * Initialize PredictionEngine with optional cache configuration
   * @param {Object} config - Configuration options
   * @param {number} config.cacheTTL - Cache time-to-live in milliseconds (default: 24 hours)
   * @param {boolean} config.enableCache - Enable/disable caching (default: true)
   */
  constructor(config = {}) {
    this.cacheTTL = config.cacheTTL || 86400000; // 24 hours in milliseconds
    this.enableCache = config.enableCache !== false;
    this.cache = new Map(); // In-memory cache
  }

  /**
   * Calculate growth potential score for a zone
   * 
   * Evaluates growth potential based on:
   * - Province development level (30% weight)
   * - Available capacity (25% weight)
   * - Strategic location proximity (20% weight)
   * - Price competitiveness (15% weight)
   * - Infrastructure quality (10% weight)
   * 
   * @param {Object} zone - Zone GeoJSON feature with properties
   * @param {Object} provinceData - Province-level metrics
   * @param {number} provinceData.developmentLevel - Development level (1=low, 2=medium, 3=high)
   * @param {number} provinceData.saturationIndex - Saturation index (0-100)
   * @param {number} provinceData.averagePrice - Average rental price in province
   * @returns {number} - Growth potential score (0-100)
   * 
   * @example
   * const score = engine.calculateGrowthPotential(zone, {
   *   developmentLevel: 3,
   *   saturationIndex: 40,
   *   averagePrice: 100
   * });
   */
  calculateGrowthPotential(zone, provinceData) {
    try {
      // Extract zone properties
      const zoneProps = zone.properties || {};
      const price = parseFloat(zoneProps.price) || 0;
      const acreage = parseFloat(zoneProps.acreage) || 0;

      // Extract province data with defaults
      const provinceDevLevel = provinceData.developmentLevel || 2;
      const saturationIndex = provinceData.saturationIndex || 50;
      const averagePrice = provinceData.averagePrice || 100;

      // Calculate proximity score (simplified - would use actual distances in production)
      // For now, use a placeholder based on zone properties
      const proximityScore = this._calculateProximityScore(zone);

      // Calculate price competitiveness
      const priceCompetitiveness = this._calculatePriceCompetitiveness(price, averagePrice);

      // Calculate infrastructure score based on acreage (larger zones often have better infrastructure)
      const infrastructureScore = this._calculateInfrastructureScore(acreage);

      // Use statistical method to calculate growth potential
      const growthScore = calculateGrowthPotential({
        provinceDevLevel: provinceDevLevel,
        saturationIndex: saturationIndex,
        proximityScore: proximityScore,
        priceCompetitiveness: priceCompetitiveness,
        infrastructureScore: infrastructureScore
      });

      return growthScore;
    } catch (error) {
      console.error('[PredictionEngine] Error calculating growth potential:', error);
      return 50; // Return neutral score on error
    }
  }

  /**
   * Forecast rental price for a zone
   * 
   * Uses linear growth model based on province development level:
   * - High development (3): 8% annual growth
   * - Medium development (2): 5% annual growth
   * - Low development (1): 3% annual growth
   * 
   * Includes confidence intervals (±15% by default)
   * 
   * @param {Object} zone - Zone GeoJSON feature with properties
   * @param {number} forecastHorizon - Years ahead to forecast (1-2)
   * @param {Object} provinceData - Province-level metrics
   * @param {number} provinceData.developmentLevel - Development level (1-3)
   * @returns {Object} - { forecast, lower, upper, confidence, current, years }
   * 
   * @example
   * const forecast = engine.forecastRentalPrice(zone, 2, { developmentLevel: 3 });
   * // Returns: { forecast: 116.64, lower: 99.14, upper: 134.14, confidence: 0.15, current: 100, years: 2 }
   */
  forecastRentalPrice(zone, forecastHorizon, provinceData = {}) {
    try {
      // Check cache first
      const cacheKey = this._generateCacheKey('price', zone, { forecastHorizon, provinceData });
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Extract current price
      const zoneProps = zone.properties || {};
      const currentPrice = parseFloat(zoneProps.price) || 0;

      if (currentPrice <= 0) {
        throw new Error('Invalid current price');
      }

      // Get province development level
      const provinceDevLevel = provinceData.developmentLevel || 2;

      // Validate forecast horizon
      if (forecastHorizon < 1 || forecastHorizon > 2) {
        throw new Error('Forecast horizon must be 1 or 2 years');
      }

      // Calculate forecast using statistical method
      const forecastResult = forecastRentalPrice(currentPrice, provinceDevLevel, forecastHorizon);

      // Calculate confidence interval (±15%)
      const confidenceInterval = calculateConfidenceInterval(forecastResult.forecast, 15);

      // Prepare result
      const result = {
        forecast: forecastResult.forecast,
        lower: confidenceInterval.lower,
        upper: confidenceInterval.upper,
        confidence: confidenceInterval.confidence,
        current: currentPrice,
        years: forecastHorizon,
        growthRate: forecastResult.growthRate
      };

      // Cache result
      this._saveToCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[PredictionEngine] Error forecasting rental price:', error);
      // Return safe default
      const currentPrice = parseFloat(zone.properties?.price) || 0;
      return {
        forecast: currentPrice,
        lower: currentPrice * 0.85,
        upper: currentPrice * 1.15,
        confidence: 0.15,
        current: currentPrice,
        years: forecastHorizon,
        growthRate: 0
      };
    }
  }

  /**
   * Predict province development trend
   * 
   * Forecasts development trajectory and classifies into categories:
   * - High growth: >15% annual
   * - Moderate growth: 5-15% annual
   * - Low growth: <5% annual
   * 
   * @param {string} provinceCode - Province identifier (e.g., 'HN', 'HCM')
   * @param {number} forecastHorizon - Years ahead to forecast (1-2)
   * @param {Object} provinceData - Province-level metrics
   * @param {number} provinceData.currentZones - Current number of zones
   * @param {number} provinceData.developmentLevel - Development level (1-3)
   * @param {number} provinceData.historicalGrowthRate - Historical growth rate (optional)
   * @returns {Object} - { trend, category, metrics, predictedZones }
   * 
   * @example
   * const trend = engine.predictDevelopmentTrend('HN', 2, {
   *   currentZones: 50,
   *   developmentLevel: 3
   * });
   * // Returns: { trend: 'high', category: 'high', metrics: {...}, predictedZones: 58 }
   */
  predictDevelopmentTrend(provinceCode, forecastHorizon, provinceData = {}) {
    try {
      // Check cache first
      const cacheKey = this._generateCacheKey('trend', { provinceCode }, { forecastHorizon, provinceData });
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Extract province data
      const currentZones = provinceData.currentZones || 0;
      const developmentLevel = provinceData.developmentLevel || 2;
      
      // Determine growth rate based on development level or historical data
      let growthRate;
      if (provinceData.historicalGrowthRate !== undefined) {
        growthRate = provinceData.historicalGrowthRate;
      } else {
        // Use development level to estimate growth rate
        const growthRates = {
          1: 0.03,  // Low development: 3% annual
          2: 0.05,  // Medium development: 5% annual
          3: 0.08   // High development: 8% annual
        };
        growthRate = growthRates[developmentLevel] || 0.05;
      }

      // Validate forecast horizon
      if (forecastHorizon < 1 || forecastHorizon > 2) {
        throw new Error('Forecast horizon must be 1 or 2 years');
      }

      // Predict development trend using statistical method
      const prediction = predictDevelopmentTrend({
        currentZones: currentZones,
        growthRate: growthRate,
        forecastHorizon: forecastHorizon
      });

      // Classify trend category
      const category = classifyDevelopmentTrend(growthRate);

      // Prepare result with detailed metrics
      const result = {
        trend: category,
        category: category,
        metrics: {
          currentZones: currentZones,
          predictedZones: prediction.predictedZones,
          growthRate: growthRate,
          annualGrowthPercent: (growthRate * 100).toFixed(1),
          forecastHorizon: forecastHorizon,
          developmentLevel: developmentLevel
        },
        predictedZones: prediction.predictedZones
      };

      // Cache result
      this._saveToCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[PredictionEngine] Error predicting development trend:', error);
      // Return safe default
      return {
        trend: 'moderate',
        category: 'moderate',
        metrics: {
          currentZones: provinceData.currentZones || 0,
          predictedZones: provinceData.currentZones || 0,
          growthRate: 0.05,
          annualGrowthPercent: '5.0',
          forecastHorizon: forecastHorizon,
          developmentLevel: provinceData.developmentLevel || 2
        },
        predictedZones: provinceData.currentZones || 0
      };
    }
  }

  /**
   * Calculate saturation index for a province
   * 
   * Evaluates how close a province is to maximum industrial zone capacity.
   * Based on:
   * - Zone density (40% weight)
   * - Occupancy rate (35% weight)
   * - Development level (25% weight)
   * 
   * Risk levels:
   * - High risk: saturation >= 80
   * - Medium risk: 60 <= saturation < 80
   * - Low risk: saturation < 60
   * 
   * @param {string} provinceCode - Province identifier
   * @param {Object} provinceData - Province-level metrics
   * @param {number} provinceData.zoneCount - Number of zones in province
   * @param {number} provinceData.provinceArea - Province area in square kilometers
   * @param {number} provinceData.occupancyRate - Average occupancy rate (0-100)
   * @param {number} provinceData.developmentLevel - Development level (1-3)
   * @returns {Object} - { index, density, riskLevel }
   * 
   * @example
   * const saturation = engine.calculateSaturationIndex('HN', {
   *   zoneCount: 50,
   *   provinceArea: 1000,
   *   occupancyRate: 75,
   *   developmentLevel: 3
   * });
   * // Returns: { index: 70.875, density: 50, riskLevel: 'medium' }
   */
  calculateSaturationIndex(provinceCode, provinceData = {}) {
    try {
      // Check cache first
      const cacheKey = this._generateCacheKey('saturation', { provinceCode }, provinceData);
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Extract province data
      const zoneCount = provinceData.zoneCount || 0;
      const provinceArea = provinceData.provinceArea || 1;
      const occupancyRate = provinceData.occupancyRate || 50;
      const developmentLevel = provinceData.developmentLevel || 2;

      // Calculate density
      const density = calculateDensity(zoneCount, provinceArea);

      // Calculate saturation index using statistical method
      const saturationIndex = calculateSaturationIndex({
        zoneCount: zoneCount,
        provinceArea: provinceArea,
        occupancyRate: occupancyRate,
        developmentLevel: developmentLevel
      });

      // Determine risk level
      const riskLevel = calculateSaturationRisk(saturationIndex);

      // Prepare result
      const result = {
        index: saturationIndex,
        density: density,
        riskLevel: riskLevel
      };

      // Cache result
      this._saveToCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[PredictionEngine] Error calculating saturation index:', error);
      // Return safe default
      return {
        index: 50,
        density: 0,
        riskLevel: 'medium'
      };
    }
  }

  /**
   * Clear all cached predictions
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - { size, ttl, enabled }
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
      enabled: this.enableCache
    };
  }

  // Private helper methods

  /**
   * Generate cache key from parameters
   * @private
   */
  _generateCacheKey(type, zone, params) {
    try {
      // Create a stable key from zone identifier and parameters
      const zoneId = zone.properties?.code || zone.properties?.name || zone.provinceCode || 'unknown';
      const paramsStr = JSON.stringify(params);
      return `${type}:${zoneId}:${paramsStr}`;
    } catch (error) {
      console.error('[PredictionEngine] Error generating cache key:', error);
      return `${type}:${Date.now()}`;
    }
  }

  /**
   * Get value from cache if not expired
   * @private
   */
  _getFromCache(key) {
    if (!this.enableCache) {
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Save value to cache with timestamp
   * @private
   */
  _saveToCache(key, value) {
    if (!this.enableCache) {
      return;
    }

    this.cache.set(key, {
      value: value,
      timestamp: Date.now()
    });
  }

  /**
   * Calculate proximity score based on zone location
   * Placeholder implementation - would use actual distance calculations in production
   * @private
   */
  _calculateProximityScore(zone) {
    // In production, this would calculate distances to strategic locations
    // For now, return a default score
    return 50;
  }

  /**
   * Calculate price competitiveness score
   * @private
   */
  _calculatePriceCompetitiveness(price, averagePrice) {
    if (price <= 0 || averagePrice <= 0) {
      return 50;
    }

    const ratio = price / averagePrice;
    
    if (ratio <= 0.5) {
      return 100; // Very competitive
    } else if (ratio >= 1.5) {
      return 0; // Not competitive
    } else {
      // Linear interpolation between 0.5 and 1.5
      return 100 * (1.5 - ratio);
    }
  }

  /**
   * Calculate infrastructure score based on acreage
   * Larger zones often have better infrastructure
   * @private
   */
  _calculateInfrastructureScore(acreage) {
    if (acreage <= 0) {
      return 30; // Low score for missing data
    }

    // Normalize acreage to 0-100 scale
    // Assume 100 hectares is a good size (score 70)
    // Assume 200+ hectares is excellent (score 100)
    if (acreage >= 200) {
      return 100;
    } else if (acreage >= 100) {
      return 70 + (acreage - 100) * 0.3; // Linear from 70 to 100
    } else {
      return 30 + (acreage / 100) * 40; // Linear from 30 to 70
    }
  }
}

// CommonJS exports
module.exports = {
  PredictionEngine
};
