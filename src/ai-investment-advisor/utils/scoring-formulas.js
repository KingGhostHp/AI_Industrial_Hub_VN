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
 */
export function normalizeWeights(weights) {
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
 */
export function calculatePriceScore(price, minPrice, maxPrice) {
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
 */
export function calculateLocationScore(provinceDevLevel) {
  // Validate input
  if (typeof provinceDevLevel !== 'number' || provinceDevLevel < 1 || provinceDevLevel > 3) {
    return 50; // Default middle score for invalid input
  }

  // Calculate score
  const score = (provinceDevLevel * 100) / 3;

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate infrastructure score (0-100)
 */
export function calculateInfrastructureScore(acreageScore, proximityScore) {
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
 */
export function calculateAcreageScore(acreage, minAcreage, maxAcreage) {
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
 */
export function calculateProximityScore(avgDistance, maxDistance) {
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
 */
export function calculateLogisticsScore(avgDistance, maxDistance) {
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
 */
export function calculateWeightedScore(scores, weights) {
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

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, weightedScore));
}

/**
 * Safe division with default value
 */
export function safeDivide(numerator, denominator, defaultValue = 0) {
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
 */
export function clamp(value, min, max) {
  if (typeof value !== 'number') {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

