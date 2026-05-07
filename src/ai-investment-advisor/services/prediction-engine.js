/**
 * Prediction Engine Service
 * 
 * Generates statistical forecasts for development trends, rental prices, and saturation.
 * Implements caching mechanism with 24-hour TTL to improve performance.
 * 
 * Requirements: 4.1, 4.2, 5.1, 5.2, 5.5, 6.2, 6.3, 7.1, 7.2
 */

import {
  calculateGrowthPotential,
  forecastRentalPrice,
  calculateConfidenceInterval,
  calculateSaturationIndex,
  calculateDensity,
  classifyDevelopmentTrend,
  predictDevelopmentTrend,
  calculateSaturationRisk
} from '../utils/statistical-methods.js';

import { Prediction } from '../models/prediction.js';

/**
 * PredictionEngine class
 * 
 * Provides predictive analytics for industrial zones including:
 * - Growth potential scoring
 * - Rental price forecasting
 * - Development trend prediction
 * - Saturation index calculation
 */
export class PredictionEngine {
  /**
   * Initialize PredictionEngine with optional cache configuration
   * @param {Object} config - Configuration options
   * @param {number} config.cacheTTL - Cache time-to-live in milliseconds (default: 24 hours)
   * @param {boolean} config.enableCache - Enable/disable caching (default: true)
   */
  constructor(config = {}) {
    this.cacheTTL = config.cacheTTL || 86400000; // 24 hours in milliseconds
    this.enableCache = config.enableCache !== false;
    this.cacheKeyName = 'ai-prediction-cache';
    this._loadCache();
  }

  /**
   * Load cache from localStorage
   * @private
   */
  _loadCache() {
    this.cache = new Map();
    if (!this.enableCache) return;
    
    try {
      const stored = localStorage.getItem(this.cacheKeyName);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Only load non-expired entries
        Object.entries(data).forEach(([key, entry]) => {
          if (now - entry.timestamp <= this.cacheTTL) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('[PredictionEngine] Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Save cache to localStorage
   * @private
   */
  _persistCache() {
    if (!this.enableCache) return;
    
    try {
      const data = {};
      this.cache.forEach((entry, key) => {
        data[key] = entry;
      });
      localStorage.setItem(this.cacheKeyName, JSON.stringify(data));
    } catch (error) {
      console.warn('[PredictionEngine] Failed to persist cache to localStorage:', error);
    }
  }

  /**
   * Calculate growth potential score for a zone
   */
  calculateGrowthPotential(zone, provinceData) {
    try {
      const cacheKey = this._generateCacheKey('growth', zone, provinceData);
      const cached = this._getFromCache(cacheKey);
      if (cached !== null) return cached;

      const zoneProps = zone.properties || {};
      const price = parseFloat(zoneProps.price) || 0;
      const acreage = parseFloat(zoneProps.acreage) || 0;

      const provinceDevLevel = provinceData.developmentLevel || 2;
      const saturationIndex = provinceData.saturationIndex || 50;
      const averagePrice = provinceData.averagePrice || 100;

      const proximityScore = this._calculateProximityScore(zone);
      const priceCompetitiveness = this._calculatePriceCompetitiveness(price, averagePrice);
      const infrastructureScore = this._calculateInfrastructureScore(acreage);

      const growthScore = calculateGrowthPotential({
        provinceDevLevel,
        saturationIndex,
        proximityScore,
        priceCompetitiveness,
        infrastructureScore
      });

      this._saveToCache(cacheKey, growthScore);
      return growthScore;
    } catch (error) {
      console.error('[PredictionEngine] Error calculating growth potential:', error);
      return 50;
    }
  }

  /**
   * Forecast rental price for a zone
   */
  forecastRentalPrice(zone, forecastHorizon, provinceData = {}) {
    try {
      const cacheKey = this._generateCacheKey('price', zone, { forecastHorizon, provinceData });
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;

      const zoneProps = zone.properties || {};
      const currentPrice = parseFloat(zoneProps.price) || 0;

      if (currentPrice <= 0) {
        throw new Error('Invalid current price');
      }

      const provinceDevLevel = provinceData.developmentLevel || 2;
      const forecastResult = forecastRentalPrice(currentPrice, provinceDevLevel, forecastHorizon);
      const confidenceInterval = calculateConfidenceInterval(forecastResult.forecast, 15);

      const result = {
        forecast: forecastResult.forecast,
        lower: confidenceInterval.lower,
        upper: confidenceInterval.upper,
        confidence: confidenceInterval.confidence,
        current: currentPrice,
        years: forecastHorizon,
        growthRate: forecastResult.growthRate
      };

      this._saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[PredictionEngine] Error forecasting rental price:', error);
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
   */
  predictDevelopmentTrend(provinceCode, forecastHorizon, provinceData = {}) {
    try {
      const cacheKey = this._generateCacheKey('trend', { provinceCode }, { forecastHorizon, provinceData });
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;

      const currentZones = provinceData.currentZones || 0;
      const developmentLevel = provinceData.developmentLevel || 2;
      
      let growthRate;
      if (provinceData.historicalGrowthRate !== undefined) {
        growthRate = provinceData.historicalGrowthRate;
      } else {
        const growthRates = { 1: 0.03, 2: 0.05, 3: 0.08 };
        growthRate = growthRates[developmentLevel] || 0.05;
      }

      const prediction = predictDevelopmentTrend({
        currentZones,
        growthRate,
        forecastHorizon
      });

      const category = classifyDevelopmentTrend(growthRate);

      const result = {
        trend: category,
        category: category,
        metrics: {
          currentZones,
          predictedZones: prediction.predictedZones,
          growthRate,
          annualGrowthPercent: (growthRate * 100).toFixed(1),
          forecastHorizon,
          developmentLevel
        },
        predictedZones: prediction.predictedZones
      };

      this._saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[PredictionEngine] Error predicting development trend:', error);
      return null;
    }
  }

  /**
   * Calculate saturation index for a province
   */
  calculateSaturationIndex(provinceCode, provinceData = {}) {
    try {
      const cacheKey = this._generateCacheKey('saturation', { provinceCode }, provinceData);
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;

      const zoneCount = provinceData.zoneCount || 0;
      const provinceArea = provinceData.provinceArea || 1;
      const occupancyRate = provinceData.occupancyRate || 50;
      const developmentLevel = provinceData.developmentLevel || 2;

      const density = calculateDensity(zoneCount, provinceArea);
      const saturationIndex = calculateSaturationIndex({
        zoneCount,
        provinceArea,
        occupancyRate,
        developmentLevel
      });

      const riskLevel = calculateSaturationRisk(saturationIndex);

      const result = {
        index: saturationIndex,
        density: density,
        riskLevel: riskLevel
      };

      this._saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[PredictionEngine] Error calculating saturation index:', error);
      return null;
    }
  }

  /**
   * Clear all cached predictions
   */
  clearCache() {
    this.cache.clear();
    localStorage.removeItem(this.cacheKeyName);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    let changed = false;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.cache.delete(key);
        changed = true;
      }
    }
    if (changed) this._persistCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
      enabled: this.enableCache
    };
  }

  // Private helper methods

  _generateCacheKey(type, zone, params) {
    try {
      const zoneId = zone.properties?.code || zone.properties?.name || zone.provinceCode || 'unknown';
      const paramsStr = JSON.stringify(params);
      return `${type}:${zoneId}:${paramsStr}`;
    } catch (error) {
      return `${type}:${Date.now()}`;
    }
  }

  _getFromCache(key) {
    if (!this.enableCache) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      this._persistCache();
      return null;
    }
    return entry.value;
  }

  _saveToCache(key, value) {
    if (!this.enableCache) return;
    this.cache.set(key, { value: value, timestamp: Date.now() });
    if (this._persistTimeout) clearTimeout(this._persistTimeout);
    this._persistTimeout = setTimeout(() => this._persistCache(), 2000);
  }

  _calculateProximityScore(zone) {
    return 50; // Placeholder
  }

  _calculatePriceCompetitiveness(price, averagePrice) {
    if (price <= 0 || averagePrice <= 0) return 50;
    const ratio = price / averagePrice;
    if (ratio <= 0.5) return 100;
    if (ratio >= 1.5) return 0;
    return 100 * (1.5 - ratio);
  }

  _calculateInfrastructureScore(acreage) {
    if (acreage <= 0) return 30;
    if (acreage >= 200) return 100;
    if (acreage >= 100) return 70 + (acreage - 100) * 0.3;
    return 30 + (acreage / 100) * 40;
  }
}

export default PredictionEngine;
