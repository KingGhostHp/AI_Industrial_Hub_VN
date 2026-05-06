/**
 * Scoring Formulas
 * 
 * Implements weighted scoring formulas for multi-criteria investment analysis.
 * Provides functions for calculating individual criterion scores and combined
 * recommendation scores with proper normalization and boundary checks.
 * 
 * Requirements: 1.1, 1.3, 2.7
 */

/**
 * Normalize weights to ensure they sum to 1.0
 * Preserves relative proportions between weights
 * 
 * @param {Object} weights - Object with weight values { price, location, infrastructure, logistics }
 * @returns {Object} - Normalized weights that sum to 1.0
 * 
 * @example
 * normalizeWeights({ price: 0.5, location: 0.5, infrastructure: 0.5, logistics: 0.5 })
 * // Returns: { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 }
 */
function normalizeWeights(weights) {
  if (!weights || typeof weights !== 'object') {
    throw new Error('Weights must be an object');
  }

  const keys = ['price', 'location', 'infrastructure', 'logistics'];
  
  // Validate all weights are present and non-negative
  for (const key of keys) {
    if (typeof weights[key] !== 'number' || weights[key] < 0) {
      throw new Error(`Weight '${key}' must be a non-negative number`);
    }
  }

  // Calculate sum
  const sum = keys.reduce((acc, key) => acc + weights[key], 0);

  // Handle zero sum case
  if (sum === 0) {
    // Return equal weights
    return {
      price: 0.25,
      location: 0.25,
      infrastructure: 0.25,
      logistics: 0.25
    };
  }

  // Normalize to sum to 1.0
  const normalized = {};
  for (const key of keys) {
    normalized[key] = weights[key] / sum;
  }

  return normalized;
}

/**
 * Calculate price score (0-100)
 * Lower prices get higher scores
 * 
 * Formula: priceScore = 100 × (1 - (price - minPrice) / (maxPrice - minPrice))
 * 
 * @param {number} price - Zone rental price
 * @param {number} minPrice - Minimum price in dataset
 * @param {number} maxPrice - Maximum price in dataset
 * @returns {number} - Price score in range [0, 100]
 */
function calculatePriceScore(price, minPrice, maxPrice) {
  // Validate inputs
  if (typeof price !== 'number' || price < 0) {
    return 0;
  }
  if (typeof minPrice !== 'number' || typeof maxPrice !== 'number') {
    return 50; // Default middle score if bounds unknown
  }
  if (maxPrice <= minPrice) {
    return 50; // All prices equal, return middle score
  }

  // Calculate normalized score (higher score for lower price)
  const normalized = (price - minPrice) / (maxPrice - minPrice);
  const score = 100 * (1 - normalized);

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate location score (0-100)
 * Based on province development level
 * 
 * Formula: locationScore = provinceDevLevel × 100 / 3
 * where provinceDevLevel: 1=low, 2=medium, 3=high
 * 
 * @param {number} provinceDevLevel - Province development level (1, 2, or 3)
 * @returns {number} - Location score in range [0, 100]
 */
function calculateLocationScore(provinceDevLevel) {
  // Validate input
  if (typeof provinceDevLevel !== 'number' || provinceDevLevel < 1 || provinceDevLevel > 3) {
    return 50; // Default middle score for invalid input
  }

  // Calculate score
  const score = (provinceDevLevel * 100) / 3;

  // Clamp to [0, 100] range (should already be in range, but safety check)
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate infrastructure score (0-100)
 * Weighted combination of acreage score and proximity score
 * 
 * Formula: infrastructureScore = acreageScore × 0.6 + proximityScore × 0.4
 * 
 * @param {number} acreageScore - Score based on zone acreage (0-100)
 * @param {number} proximityScore - Score based on proximity to infrastructure (0-100)
 * @returns {number} - Infrastructure score in range [0, 100]
 */
function calculateInfrastructureScore(acreageScore, proximityScore) {
  // Validate inputs
  if (typeof acreageScore !== 'number' || acreageScore < 0 || acreageScore > 100) {
    acreageScore = 50; // Default middle score
  }
  if (typeof proximityScore !== 'number' || proximityScore < 0 || proximityScore > 100) {
    proximityScore = 50; // Default middle score
  }

  // Calculate weighted combination
  const score = acreageScore * 0.6 + proximityScore * 0.4;

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate acreage score (0-100)
 * Larger acreage gets higher score
 * 
 * @param {number} acreage - Zone acreage in hectares
 * @param {number} minAcreage - Minimum acreage in dataset
 * @param {number} maxAcreage - Maximum acreage in dataset
 * @returns {number} - Acreage score in range [0, 100]
 */
function calculateAcreageScore(acreage, minAcreage, maxAcreage) {
  // Validate inputs
  if (typeof acreage !== 'number' || acreage < 0) {
    return 0;
  }
  if (typeof minAcreage !== 'number' || typeof maxAcreage !== 'number') {
    return 50; // Default middle score if bounds unknown
  }
  if (maxAcreage <= minAcreage) {
    return 50; // All acreages equal, return middle score
  }

  // Calculate normalized score (higher score for larger acreage)
  const normalized = (acreage - minAcreage) / (maxAcreage - minAcreage);
  const score = 100 * normalized;

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate proximity score (0-100)
 * Based on average distance to strategic locations
 * Shorter distances get higher scores
 * 
 * @param {number} avgDistance - Average distance to strategic locations (km)
 * @param {number} maxDistance - Maximum distance in dataset (km)
 * @returns {number} - Proximity score in range [0, 100]
 */
function calculateProximityScore(avgDistance, maxDistance) {
  // Validate inputs
  if (typeof avgDistance !== 'number' || avgDistance < 0) {
    return 0;
  }
  if (typeof maxDistance !== 'number' || maxDistance <= 0) {
    return 50; // Default middle score if max unknown
  }

  // Calculate score (higher score for shorter distance)
  const normalized = avgDistance / maxDistance;
  const score = 100 * (1 - normalized);

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate logistics score (0-100)
 * Based on average distance to strategic locations (ports, airports, city centers)
 * 
 * Formula: logisticsScore = 100 × (1 - avgDistance / maxDistance)
 * 
 * @param {number} avgDistance - Average distance to strategic locations (km)
 * @param {number} maxDistance - Maximum distance in dataset (km)
 * @returns {number} - Logistics score in range [0, 100]
 */
function calculateLogisticsScore(avgDistance, maxDistance) {
  // Validate inputs
  if (typeof avgDistance !== 'number' || avgDistance < 0) {
    return 0;
  }
  if (typeof maxDistance !== 'number' || maxDistance <= 0) {
    return 50; // Default middle score if max unknown
  }

  // Calculate score (higher score for shorter distance)
  const normalized = avgDistance / maxDistance;
  const score = 100 * (1 - normalized);

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate weighted recommendation score
 * Combines all criterion scores using normalized weights
 * 
 * Formula: score = (w1 × priceScore) + (w2 × locationScore) + 
 *                  (w3 × infrastructureScore) + (w4 × logisticsScore)
 * 
 * @param {Object} scores - Individual criterion scores { price, location, infrastructure, logistics }
 * @param {Object} weights - Criterion weights (will be normalized)
 * @returns {number} - Weighted recommendation score in range [0, 100]
 * 
 * @example
 * calculateWeightedScore(
 *   { price: 80, location: 60, infrastructure: 70, logistics: 90 },
 *   { price: 0.25, location: 0.25, infrastructure: 0.25, logistics: 0.25 }
 * )
 * // Returns: 75
 */
function calculateWeightedScore(scores, weights) {
  // Validate scores
  if (!scores || typeof scores !== 'object') {
    throw new Error('Scores must be an object');
  }

  const keys = ['price', 'location', 'infrastructure', 'logistics'];
  
  // Validate all scores are present and in valid range
  for (const key of keys) {
    if (typeof scores[key] !== 'number') {
      throw new Error(`Score '${key}' must be a number`);
    }
    // Clamp scores to [0, 100] range
    scores[key] = Math.max(0, Math.min(100, scores[key]));
  }

  // Normalize weights
  const normalizedWeights = normalizeWeights(weights);

  // Calculate weighted sum
  const weightedScore = 
    scores.price * normalizedWeights.price +
    scores.location * normalizedWeights.location +
    scores.infrastructure * normalizedWeights.infrastructure +
    scores.logistics * normalizedWeights.logistics;

  // Clamp to [0, 100] range (should already be in range, but safety check)
  return Math.max(0, Math.min(100, weightedScore));
}

/**
 * Safe division with default value
 * Prevents division by zero errors
 * 
 * @param {number} numerator - Numerator
 * @param {number} denominator - Denominator
 * @param {number} defaultValue - Value to return if denominator is zero (default: 0)
 * @returns {number} - Result of division or default value
 */
function safeDivide(numerator, denominator, defaultValue = 0) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') {
    return defaultValue;
  }
  if (denominator === 0) {
    return defaultValue;
  }
  return numerator / denominator;
}

/**
 * Clamp value to range [min, max]
 * 
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
function clamp(value, min, max) {
  if (typeof value !== 'number') {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

// CommonJS exports
module.exports = {
  normalizeWeights,
  calculatePriceScore,
  calculateLocationScore,
  calculateInfrastructureScore,
  calculateAcreageScore,
  calculateProximityScore,
  calculateLogisticsScore,
  calculateWeightedScore,
  safeDivide,
  clamp
};
