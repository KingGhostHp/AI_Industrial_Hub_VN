/**
 * AI Investment Advisor Module
 * 
 * Main entry point for the AI-powered investment advisory and predictive analytics system.
 * Provides intelligent investment recommendations, predictive analytics, and visual insights
 * for industrial zone investments in Vietnam.
 * 
 * @module ai-investment-advisor
 */

// Export data models
export { Recommendation } from './models/recommendation.js';
export { Prediction } from './models/prediction.js';
export { UserPreferences } from './models/user-preferences.js';
export { IndustryProfile } from './models/industry-profile.js';

// Services
export { default as MultiCriteriaAnalyzer } from './services/multi-criteria-analyzer.js';
export { default as PredictionEngine } from './services/prediction-engine.js';
export { default as LLMAPIService } from './services/llm-api-service.js';
export { default as LogisticsCalculator } from './services/logistics-calculator.js';
export { default as DataManager, dataManager } from './services/data-manager.js';

// Components will be exported as they are implemented
// export { QuestionnairePanel } from './components/questionnaire-panel.js';
// export { RecommendationCard } from './components/recommendation-card.js';
// export { ComparisonPanel } from './components/comparison-panel.js';
// export { AnalyticsDashboard } from './components/analytics-dashboard.js';
// export { HeatmapController } from './components/heatmap-controller.js';
// export { ExplanationPanel } from './components/explanation-panel.js';

/**
 * Initialize the AI Investment Advisor module
 * @param {Object} config - Configuration options
 * @param {Object} config.mapInstance - Mapbox GL JS map instance
 * @param {Object} config.llmConfig - LLM API configuration (provider, apiKey, model)
 * @returns {Object} Module API
 */
export function initializeAIAdvisor(config) {
  console.log('Initializing AI Investment Advisor module...');
  
  // Validate configuration
  if (!config || !config.mapInstance) {
    throw new Error('Map instance is required for AI Investment Advisor initialization');
  }

  // Module will be fully implemented in subsequent tasks
  return {
    version: '1.0.0',
    initialized: true,
    config: config
  };
}
