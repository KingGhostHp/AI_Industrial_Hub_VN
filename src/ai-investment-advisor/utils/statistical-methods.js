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
 */
export function calculateGrowthPotential(params) {
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
 */
export function forecastRentalPrice(currentPrice, provinceDevLevel, forecastHorizon) {
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
 */
export function calculateConfidenceInterval(forecastValue, confidencePercent = 15) {
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
 */
export function calculateSaturationIndex(params) {
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
 */
export function calculateDensity(zoneCount, area) {
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
 */
export function classifyDevelopmentTrend(growthRate) {
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
 */
export function calculatePriceCompetitiveness(price, averagePrice) {
  // Validate inputs
  if (typeof price !== 'number' || price < 0) {
    return 50; // Default middle score
  }
  if (typeof averagePrice !== 'number' || averagePrice <= 0) {
    return 50; // Default middle score
  }

  // Calculate competitiveness (lower price = higher score)
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
 */
export function predictDevelopmentTrend(params) {
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
 */
export function calculateMovingAverage(values, windowSize) {
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
 */
export function validateRange(value, min, max, defaultValue) {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate risk level based on saturation index
 */
export function calculateSaturationRisk(saturationIndex) {
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

