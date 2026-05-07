/**
 * Recommendation Model
 * 
 * Represents an investment recommendation for an industrial zone.
 * Contains zone data, scoring information, and logistics details.
 */
export class Recommendation {
  /**
   * Create a new Recommendation
   * @param {Object} zone - GeoJSON feature representing the zone
   * @param {Number} score - Overall recommendation score (0-100)
   * @param {Object} breakdown - Detailed score breakdown by criteria
   */
  constructor(zone, score = 0, breakdown = null) {
    this.zone = zone;                    // GeoJSON feature
    this.score = score;                  // 0-100
    this.breakdown = breakdown || {
      price: { score: 0, weight: 0 },
      location: { score: 0, weight: 0 },
      infrastructure: { score: 0, weight: 0 },
      logistics: { score: 0, weight: 0 }
    };
    this.rank = 0;                       // Position in results
    this.explanation = '';               // LLM-generated text
    this.growthPotential = 0;           // 0-100
    this.logisticsCosts = {
      nearestPort: { name: '', distance: 0, cost: 0 },
      nearestAirport: { name: '', distance: 0, cost: 0 },
      nearestCity: { name: '', distance: 0, cost: 0 }
    };
  }

  /**
   * Serialize recommendation to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      zone: this.zone,
      score: this.score,
      breakdown: this.breakdown,
      rank: this.rank,
      explanation: this.explanation,
      growthPotential: this.growthPotential,
      logisticsCosts: this.logisticsCosts
    };
  }

  /**
   * Deserialize recommendation from JSON
   * @param {Object} json - JSON object
   * @returns {Recommendation} Recommendation instance
   */
  static fromJSON(json) {
    const recommendation = new Recommendation(json.zone, json.score, json.breakdown);
    recommendation.rank = json.rank || 0;
    recommendation.explanation = json.explanation || '';
    recommendation.growthPotential = json.growthPotential || 0;
    recommendation.logisticsCosts = json.logisticsCosts || {
      nearestPort: { name: '', distance: 0, cost: 0 },
      nearestAirport: { name: '', distance: 0, cost: 0 },
      nearestCity: { name: '', distance: 0, cost: 0 }
    };
    return recommendation;
  }
}

