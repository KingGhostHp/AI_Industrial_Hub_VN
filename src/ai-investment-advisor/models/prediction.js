/**
 * Prediction Model
 * 
 * Represents a predictive analytics result for a province or zone.
 * Includes forecast values, confidence intervals, and expiration tracking.
 */
export class Prediction {
  /**
   * Create a new Prediction
   * @param {String} provinceCode - Province identifier
   * @param {String} metric - Metric type: 'price', 'trend', 'saturation'
   * @param {Number} forecastHorizon - Years ahead (1-2)
   */
  constructor(provinceCode, metric, forecastHorizon) {
    this.provinceCode = provinceCode;
    this.metric = metric;                // 'price', 'trend', 'saturation'
    this.forecastHorizon = forecastHorizon;
    this.current = 0;
    this.forecast = 0;
    this.confidence = { lower: 0, upper: 0 };
    this.category = '';                  // 'high', 'moderate', 'low'
    this.timestamp = Date.now();
  }

  /**
   * Check if prediction has expired
   * @param {Number} ttl - Time to live in milliseconds (default 24 hours)
   * @returns {Boolean} True if expired
   */
  isExpired(ttl = 86400000) {           // 24 hours default
    return Date.now() - this.timestamp > ttl;
  }

  /**
   * Serialize prediction to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      provinceCode: this.provinceCode,
      metric: this.metric,
      forecastHorizon: this.forecastHorizon,
      current: this.current,
      forecast: this.forecast,
      confidence: this.confidence,
      category: this.category,
      timestamp: this.timestamp
    };
  }

  /**
   * Deserialize prediction from JSON
   * @param {Object} json - JSON object
   * @returns {Prediction} Prediction instance
   */
  static fromJSON(json) {
    const prediction = new Prediction(
      json.provinceCode,
      json.metric,
      json.forecastHorizon
    );
    prediction.current = json.current || 0;
    prediction.forecast = json.forecast || 0;
    prediction.confidence = json.confidence || { lower: 0, upper: 0 };
    prediction.category = json.category || '';
    prediction.timestamp = json.timestamp || Date.now();
    return prediction;
  }
}
