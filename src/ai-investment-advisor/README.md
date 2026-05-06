# AI Investment Advisor Module

AI-powered investment advisory and predictive analytics system for industrial zones in Vietnam.

## Overview

This module provides intelligent investment recommendations, predictive analytics, and visual insights to help businesses, consultants, government planners, and logistics companies make data-driven decisions about industrial zone investments.

## Project Structure

```
src/ai-investment-advisor/
├── components/          # UI components (to be implemented)
├── services/           # Business logic services (to be implemented)
├── models/             # Data models
│   ├── recommendation.js      # Investment recommendation model
│   ├── prediction.js          # Predictive analytics model
│   ├── user-preferences.js    # User settings and preferences
│   └── industry-profile.js    # Industry-specific configurations
├── utils/              # Utility functions (to be implemented)
├── styles/             # CSS styles (to be implemented)
└── index.js            # Module entry point
```

## Data Models

### Recommendation

Represents an investment recommendation for an industrial zone.

**Properties:**
- `zone` (Object): GeoJSON feature representing the zone
- `score` (Number): Overall recommendation score (0-100)
- `breakdown` (Object): Detailed score breakdown by criteria (price, location, infrastructure, logistics)
- `rank` (Number): Position in results
- `explanation` (String): LLM-generated natural language explanation
- `growthPotential` (Number): Growth potential score (0-100)
- `logisticsCosts` (Object): Transportation costs to strategic locations

**Methods:**
- `toJSON()`: Serialize to JSON
- `fromJSON(json)`: Deserialize from JSON

### Prediction

Represents a predictive analytics result for a province or zone.

**Properties:**
- `provinceCode` (String): Province identifier
- `metric` (String): Metric type ('price', 'trend', 'saturation')
- `forecastHorizon` (Number): Years ahead (1-2)
- `current` (Number): Current value
- `forecast` (Number): Forecasted value
- `confidence` (Object): Confidence interval { lower, upper }
- `category` (String): Category ('high', 'moderate', 'low')
- `timestamp` (Number): Creation timestamp

**Methods:**
- `isExpired(ttl)`: Check if prediction has expired (default 24 hours)
- `toJSON()`: Serialize to JSON
- `fromJSON(json)`: Deserialize from JSON

### UserPreferences

Stores user investment criteria, weights, and saved profiles.

**Properties:**
- `industryProfile` (String): Selected industry type
- `criteriaWeights` (Object): Weights for price, location, infrastructure, logistics
- `budgetRange` (Object): Min/max rental price range
- `preferredProvinces` (Array): List of preferred province codes
- `requiredInfrastructure` (Array): Required infrastructure types
- `language` (String): UI language ('vi' or 'en')
- `savedProfiles` (Array): Saved preference profiles

**Methods:**
- `save()`: Save to localStorage
- `load()`: Load from localStorage (static)
- `toJSON()`: Serialize to JSON
- `fromJSON(json)`: Deserialize from JSON

### IndustryProfile

Represents industry-specific investment criteria and priorities.

**Properties:**
- `type` (String): Industry type identifier
- `weights` (Object): Criteria weights
- `description` (String): Human-readable description
- `requiredInfrastructure` (Array): Typical infrastructure requirements
- `logisticsPriority` (String): Logistics priority level ('low', 'medium', 'high')

**Methods:**
- `getProfile(type)`: Load profile from industry-profiles.json (static, async)
- `getDefaultProfile()`: Get default manufacturing profile (static)
- `toJSON()`: Serialize to JSON
- `fromJSON(json)`: Deserialize from JSON

## Industry Profiles Configuration

The system supports 6 industry profiles defined in `data/industry-profiles.json`:

1. **Manufacturing** (infrastructure-focused)
   - Price: 0.25, Location: 0.20, Infrastructure: 0.35, Logistics: 0.20

2. **Logistics** (transportation-focused)
   - Price: 0.20, Location: 0.15, Infrastructure: 0.25, Logistics: 0.40

3. **Technology** (location-focused)
   - Price: 0.20, Location: 0.35, Infrastructure: 0.30, Logistics: 0.15

4. **Food Processing** (infrastructure and cost-focused)
   - Price: 0.30, Location: 0.20, Infrastructure: 0.35, Logistics: 0.15

5. **Textiles** (cost-focused)
   - Price: 0.35, Location: 0.15, Infrastructure: 0.30, Logistics: 0.20

6. **Electronics** (infrastructure and export-focused)
   - Price: 0.20, Location: 0.25, Infrastructure: 0.35, Logistics: 0.20

All weight configurations sum to 1.0 and meet the requirements specified in the design document.

## Usage

```javascript
import { 
  Recommendation, 
  Prediction, 
  UserPreferences, 
  IndustryProfile,
  initializeAIAdvisor 
} from './src/ai-investment-advisor/index.js';

// Initialize the module
const advisor = initializeAIAdvisor({
  mapInstance: mapboxMap,
  llmConfig: {
    provider: 'openai',
    apiKey: 'your-api-key',
    model: 'gpt-4'
  }
});

// Load user preferences
const prefs = UserPreferences.load();

// Load industry profile
const profile = await IndustryProfile.getProfile('manufacturing');

// Create a recommendation
const recommendation = new Recommendation(zoneFeature, 85.5);
```

## Testing

Run validation and tests:

```bash
# Validate industry profiles configuration
node scripts/validate-industry-profiles.js

# Test data model serialization
node scripts/test-data-models.js
```

## Requirements Implemented

This implementation satisfies the following requirements from the specification:

- **Requirement 1.1**: Multi-criteria evaluation foundation (data models)
- **Requirement 2.1**: Industry profile support (6 profiles)
- **Requirement 2.2**: Industry-specific weight application
- **Requirement 14.1**: User preference persistence
- **Requirement 14.2**: Automatic preference loading

## Next Steps

The following components will be implemented in subsequent tasks:

1. Scoring formulas and statistical utilities
2. Multi-Criteria Analyzer service
3. Logistics Calculator service
4. Prediction Engine service
5. LLM API Service
6. UI components (questionnaire, recommendation cards, analytics dashboard)
7. Integration with existing map infrastructure

## License

Part of the Vietnam Industrial Zones interactive map application.
