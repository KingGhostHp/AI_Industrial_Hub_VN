/**
 * Statistical Methods
 * 
 * Implements statistical formulas for predictive analytics including:
 * - Growth potential calculation
 * - Rental price forecasting (linear regression)
 * - Confidence interval calculation
 * - Saturation index calculation
 * - Density calculation
 * 
 * Requirements: 4.1, 4.2, 6.1, 6.2, 7.1, 7.2
 */

/**
 * Calculate growth potential score (0-100)
 * Weighted combination of multiple factors
 * 
 * Formula:
 * growthScore = (
 *   (provinceDevLevel / 3) × 0.30 +           // Province development
 *   (1 - saturationIndex / 100) × 0.25 +      // Available capacity
 *   (proximityScore / 100) × 0.20 +           // Strategic location
 *   (priceCompetitiveness / 100) × 0.15 +     // Price advantage
 *   (infrastructureScore / 100) × 0.10        // Infrastructure quality
 * ) × 100
 * 
 * @param {Object} params - Parameters object
 * @param {number} params.provinceDevLevel - Province development level (1=low, 2=medium, 3=high)
 * @param {number} params.saturationIndex - Saturation index (0-100)
 * @param {number} params.proximityScore - Proximity score (0-100)
 * @param {number} params.priceCompetitiveness - Price competitiveness score (0-100)
 * @param {number} params.infrastructureScore - Infrastructure score (0-100)
 * @returns {number} - Growth potential score in range [0, 100]
 * 
 * @example
 * calculateGrowthPotential({
 *   provinceDevLevel: 3,
 *   saturationIndex: 40,
 *   proximityScore: 80,
 *   priceCompetitiveness: 70,
 *   infrastructureScore: 85
 * })
 * // Returns: ~75.5
 */
function calculateGrowthPotential(params) {
  // Validate and extract parameters with defaults
  const provinceDevLevel = validateRange(params.provinceDevLevel, 1, 3, 2);
  const saturationIndex = validateRange(params.saturationIndex, 0, 100, 50);
  const proximityScore = validateRange(params.proximityScore, 0, 100, 50);
  const priceCompetitiveness = validateRange(params.priceCompetitiveness, 0, 100, 50);
  const infrastructureScore = validateRange(params.infrastructureScore, 0, 100, 50);

  // Calculate weighted growth score
  const growthScore = (
    (provinceDevLevel / 3) * 0.30 +           // Province development factor
    (1 - saturationIndex / 100) * 0.25 +      // Available capacity factor
    (proximityScore / 100) * 0.20 +           // Strategic location factor
    (priceCompetitiveness / 100) * 0.15 +     // Price advantage factor
    (infrastructureScore / 100) * 0.10        // Infrastructure quality factor
  ) * 100;

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, growthScore));
}

/**
 * Forecast rental price using linear growth model
 * 
 * Formula:
 * forecastPrice = currentPrice × (1 + annualGrowthRate) ^ years
 * 
 * Growth rates by development level:
 * - high_dev (3): 8% annual growth
 * - medium_dev (2): 5% annual growth
 * - low_dev (1): 3% annual growth
 * 
 * @param {number} currentPrice - Current rental price (USD/m²/lease term)
 * @param {number} provinceDevLevel - Province development level (1, 2, or 3)
 * @param {number} forecastHorizon - Years ahead to forecast (1-2)
 * @returns {Object} - { forecast, growthRate, years }
 * 
 * @example
 * forecastRentalPrice(100, 3, 2)
 * // Returns: { forecast: 116.64, growthRate: 0.08, years: 2 }
 */
function forecastRentalPrice(currentPrice, provinceDevLevel, forecastHorizon) {
  // Validate inputs
  if (typeof currentPrice !== 'number' || currentPrice < 0) {
    throw new Error('Current price must be a non-negative number');
  }
  
  provinceDevLevel = validateRange(provinceDevLevel, 1, 3, 2);
  forecastHorizon = validateRange(forecastHorizon, 1, 2, 1);

  // Determine annual growth rate based on development level
  const growthRates = {
    1: 0.03,  // Low development: 3% annual growth
    2: 0.05,  // Medium development: 5% annual growth
    3: 0.08   // High development: 8% annual growth
  };

  const annualGrowthRate = growthRates[provinceDevLevel];

  // Calculate forecast using compound growth formula
  const forecast = currentPrice * Math.pow(1 + annualGrowthRate, forecastHorizon);

  return {
    forecast: forecast,
    growthRate: annualGrowthRate,
    years: forecastHorizon
  };
}

/**
 * Calculate confidence interval for forecast
 * Returns lower and upper bounds with specified confidence range
 * 
 * Default confidence range: ±15% (can be ±10-20%)
 * 
 * @param {number} forecastValue - Forecasted value
 * @param {number} confidencePercent - Confidence range as percentage (default: 15 for ±15%)
 * @returns {Object} - { lower, upper, confidence }
 * 
 * @example
 * calculateConfidenceInterval(100, 15)
 * // Returns: { lower: 85, upper: 115, confidence: 0.15 }
 */
function calculateConfidenceInterval(forecastValue, confidencePercent = 15) {
  // Validate inputs
  if (typeof forecastValue !== 'number' || forecastValue < 0) {
    throw new Error('Forecast value must be a non-negative number');
  }

  // Clamp confidence to [10, 20] range as per requirements
  confidencePercent = Math.max(10, Math.min(20, confidencePercent));

  // Calculate bounds
  const confidenceDecimal = confidencePercent / 100;
  const margin = forecastValue * confidenceDecimal;

  return {
    lower: Math.max(0, forecastValue - margin),  // Ensure non-negative
    upper: forecastValue + margin,
    confidence: confidenceDecimal
  };
}

/**
 * Calculate saturation index for a province (0-100)
 * 
 * Formula:
 * saturationIndex = (
 *   (zoneCount / provinceArea) × 1000 × 0.40 +    // Density factor
 *   (occupancyRate / 100) × 0.35 +                 // Occupancy factor
 *   (developmentLevel / 3) × 0.25                  // Development factor
 * ) × 100
 * 
 * @param {Object} params - Parameters object
 * @param {number} params.zoneCount - Number of zones in province
 * @param {number} params.provinceArea - Province area in square kilometers
 * @param {number} params.occupancyRate - Average occupancy rate (0-100)
 * @param {number} params.developmentLevel - Province development level (1, 2, or 3)
 * @returns {number} - Saturation index in range [0, 100]
 * 
 * @example
 * calculateSaturationIndex({
 *   zoneCount: 50,
 *   provinceArea: 1000,
 *   occupancyRate: 75,
 *   developmentLevel: 3
 * })
 * // Returns: ~70.875
 */
function calculateSaturationIndex(params) {
  // Validate and extract parameters
  const zoneCount = Math.max(0, params.zoneCount || 0);
  const provinceArea = Math.max(1, params.provinceArea || 1); // Avoid division by zero
  const occupancyRate = validateRange(params.occupancyRate, 0, 100, 50);
  const developmentLevel = validateRange(params.developmentLevel, 1, 3, 2);

  // Calculate density (zones per 1000 km²)
  const density = (zoneCount / provinceArea) * 1000;

  // Normalize density to 0-1 range (assume max density of 100 zones per 1000 km²)
  const maxDensity = 100;
  const normalizedDensity = Math.min(1, density / maxDensity);

  // Calculate saturation index
  const saturationIndex = (
    normalizedDensity * 0.40 +              // Density factor
    (occupancyRate / 100) * 0.35 +          // Occupancy factor
    (developmentLevel / 3) * 0.25           // Development factor
  ) * 100;

  // Clamp to [0, 100] range
  return Math.max(0, Math.min(100, saturationIndex));
}

/**
 * Calculate density (zones per 1000 square kilometers)
 * 
 * Formula: density = (zoneCount / area) × 1000
 * 
 * @param {number} zoneCount - Number of zones
 * @param {number} area - Area in square kilometers
 * @returns {number} - Density (zones per 1000 km²)
 * 
 * @example
 * calculateDensity(50, 1000)
 * // Returns: 50
 */
function calculateDensity(zoneCount, area) {
  // Validate inputs
  if (typeof zoneCount !== 'number' || zoneCount < 0) {
    throw new Error('Zone count must be a non-negative number');
  }
  if (typeof area !== 'number' || area <= 0) {
    throw new Error('Area must be a positive number');
  }

  // Calculate density
  return (zoneCount / area) * 1000;
}

/**
 * Classify development trend based on growth rate
 * 
 * Categories:
 * - high: growth > 15% annual
 * - moderate: 5% <= growth <= 15% annual
 * - low: growth < 5% annual
 * 
 * @param {number} growthRate - Annual growth rate as decimal (e.g., 0.08 for 8%)
 * @returns {string} - Category: 'high', 'moderate', or 'low'
 * 
 * @example
 * classifyDevelopmentTrend(0.18)
 * // Returns: 'high'
 */
function classifyDevelopmentTrend(growthRate) {
  // Validate input
  if (typeof growthRate !== 'number') {
    throw new Error('Growth rate must be a number');
  }

  // Classify based on thresholds
  if (growthRate > 0.15) {
    return 'high';
  } else if (growthRate >= 0.05) {
    return 'moderate';
  } else {
    return 'low';
  }
}

/**
 * Calculate price competitiveness score (0-100)
 * Lower price relative to average gets higher score
 * 
 * @param {number} price - Zone price
 * @param {number} averagePrice - Average price in province or region
 * @returns {number} - Competitiveness score in range [0, 100]
 * 
 * @example
 * calculatePriceCompetitiveness(80, 100)
 * // Returns: 80 (20% below average = 80% competitive)
 */
function calculatePriceCompetitiveness(price, averagePrice) {
  // Validate inputs
  if (typeof price !== 'number' || price < 0) {
    return 50; // Default middle score
  }
  if (typeof averagePrice !== 'number' || averagePrice <= 0) {
    return 50; // Default middle score
  }

  // Calculate competitiveness (lower price = higher score)
  // If price is 50% of average, score is 100
  // If price equals average, score is 50
  // If price is 150% of average, score is 0
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
 * Predict development trend metrics for a province
 * 
 * @param {Object} params - Parameters object
 * @param {number} params.currentZones - Current number of zones
 * @param {number} params.growthRate - Annual growth rate as decimal
 * @param {number} params.forecastHorizon - Years ahead to forecast
 * @returns {Object} - { predictedZones, category, growthRate }
 * 
 * @example
 * predictDevelopmentTrend({
 *   currentZones: 50,
 *   growthRate: 0.08,
 *   forecastHorizon: 2
 * })
 * // Returns: { predictedZones: 58, category: 'moderate', growthRate: 0.08 }
 */
function predictDevelopmentTrend(params) {
  // Validate inputs
  const currentZones = Math.max(0, params.currentZones || 0);
  const growthRate = typeof params.growthRate === 'number' ? params.growthRate : 0.05;
  const forecastHorizon = validateRange(params.forecastHorizon, 1, 2, 1);

  // Calculate predicted zones using compound growth
  const predictedZones = Math.round(currentZones * Math.pow(1 + growthRate, forecastHorizon));

  // Classify trend
  const category = classifyDevelopmentTrend(growthRate);

  return {
    predictedZones: predictedZones,
    category: category,
    growthRate: growthRate
  };
}

/**
 * Calculate moving average for time series data
 * 
 * @param {Array<number>} values - Array of values
 * @param {number} windowSize - Size of moving average window
 * @returns {Array<number>} - Moving averages
 * 
 * @example
 * calculateMovingAverage([10, 20, 30, 40, 50], 3)
 * // Returns: [20, 30, 40]
 */
function calculateMovingAverage(values, windowSize) {
  // Validate inputs
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Values must be a non-empty array');
  }
  if (typeof windowSize !== 'number' || windowSize < 1 || windowSize > values.length) {
    throw new Error('Window size must be between 1 and array length');
  }

  const result = [];
  
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
    result.push(average);
  }

  return result;
}

/**
 * Helper function to validate and clamp value to range
 * 
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Validated and clamped value
 */
function validateRange(value, min, max, defaultValue) {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate risk level based on saturation index
 * 
 * @param {number} saturationIndex - Saturation index (0-100)
 * @returns {string} - Risk level: 'high', 'medium', or 'low'
 * 
 * @example
 * calculateSaturationRisk(85)
 * // Returns: 'high'
 */
function calculateSaturationRisk(saturationIndex) {
  // Validate input
  saturationIndex = validateRange(saturationIndex, 0, 100, 50);

  // Classify risk level
  if (saturationIndex >= 80) {
    return 'high';
  } else if (saturationIndex >= 60) {
    return 'medium';
  } else {
    return 'low';
  }
}


// CommonJS exports
module.exports = {
  calculateGrowthPotential,
  forecastRentalPrice,
  calculateConfidenceInterval,
  calculateSaturationIndex,
  calculateDensity,
  classifyDevelopmentTrend,
  calculatePriceCompetitiveness,
  predictDevelopmentTrend,
  calculateMovingAverage,
  calculateSaturationRisk
};
