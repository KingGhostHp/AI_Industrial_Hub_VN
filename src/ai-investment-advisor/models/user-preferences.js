/**
 * User Preferences Model
 * 
 * Stores user investment criteria, weights, and saved profiles.
 * Persists to localStorage for session continuity.
 */
export class UserPreferences {
  constructor() {
    this.industryProfile = 'manufacturing';
    this.criteriaWeights = {
      price: 0.25,
      location: 0.25,
      infrastructure: 0.25,
      logistics: 0.25
    };
    this.budgetRange = { min: 0, max: 1000 };
    this.preferredProvinces = [];
    this.requiredInfrastructure = [];
    this.language = 'vi';
    this.savedProfiles = [];
  }

  /**
   * Save preferences to localStorage
   */
  save() {
    try {
      localStorage.setItem('ai-advisor-prefs', JSON.stringify(this.toJSON()));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Handle quota exceeded or other localStorage errors
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old data...');
        // Could implement cleanup logic here
      }
    }
  }

  /**
   * Load preferences from localStorage
   * @returns {UserPreferences} Loaded preferences or new instance
   */
  static load() {
    try {
      const data = localStorage.getItem('ai-advisor-prefs');
      if (data) {
        return UserPreferences.fromJSON(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    return new UserPreferences();
  }

  /**
   * Serialize preferences to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      industryProfile: this.industryProfile,
      criteriaWeights: this.criteriaWeights,
      budgetRange: this.budgetRange,
      preferredProvinces: this.preferredProvinces,
      requiredInfrastructure: this.requiredInfrastructure,
      language: this.language,
      savedProfiles: this.savedProfiles
    };
  }

  /**
   * Deserialize preferences from JSON
   * @param {Object} json - JSON object
   * @returns {UserPreferences} UserPreferences instance
   */
  static fromJSON(json) {
    const prefs = new UserPreferences();
    prefs.industryProfile = json.industryProfile || 'manufacturing';
    prefs.criteriaWeights = json.criteriaWeights || {
      price: 0.25,
      location: 0.25,
      infrastructure: 0.25,
      logistics: 0.25
    };
    prefs.budgetRange = json.budgetRange || { min: 0, max: 1000 };
    prefs.preferredProvinces = json.preferredProvinces || [];
    prefs.requiredInfrastructure = json.requiredInfrastructure || [];
    prefs.language = json.language || 'vi';
    prefs.savedProfiles = json.savedProfiles || [];
    return prefs;
  }
}
