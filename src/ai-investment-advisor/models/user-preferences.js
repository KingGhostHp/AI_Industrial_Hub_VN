/**
 * UserPreferences model
 * 
 * Manages user configurations, industry profiles, budget ranges, and preferred provinces.
 * Supports multiple named profiles and query history tracking with localStorage persistence.
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
    this.queryHistory = []; // Last 10 queries
    this.MAX_HISTORY = 10;
  }

  /**
   * Save preferences to localStorage
   */
  save() {
    try {
      localStorage.setItem('ai-advisor-prefs', JSON.stringify(this.toJSON()));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      if (error.name === 'QuotaExceededError') {
        this._handleQuotaExceeded();
      }
    }
  }

  /**
   * Handle localStorage quota exceeded by clearing old history
   * @private
   */
  _handleQuotaExceeded() {
    console.warn('localStorage quota exceeded. Clearing history to free space...');
    this.queryHistory = [];
    this.save();
  }

  /**
   * Add a named profile
   * @param {string} name - Profile name
   */
  saveProfile(name) {
    const profile = {
      id: `profile_${Date.now()}`,
      name,
      industryProfile: this.industryProfile,
      criteriaWeights: { ...this.criteriaWeights },
      budgetRange: { ...this.budgetRange },
      preferredProvinces: [...this.preferredProvinces],
      requiredInfrastructure: [...this.requiredInfrastructure],
      timestamp: new Date().toISOString()
    };
    
    // Replace if exists with same name, or add new
    const index = this.savedProfiles.findIndex(p => p.name === name);
    if (index !== -1) {
      this.savedProfiles[index] = profile;
    } else {
      this.savedProfiles.push(profile);
    }
    
    this.save();
  }

  /**
   * Load a named profile
   * @param {string} profileId - ID of the profile to load
   */
  loadProfile(profileId) {
    const profile = this.savedProfiles.find(p => p.id === profileId);
    if (profile) {
      this.industryProfile = profile.industryProfile;
      this.criteriaWeights = { ...profile.criteriaWeights };
      this.budgetRange = { ...profile.budgetRange };
      this.preferredProvinces = [...profile.preferredProvinces];
      this.requiredInfrastructure = [...profile.requiredInfrastructure];
      return true;
    }
    return false;
  }

  /**
   * Add entry to query history
   * @param {Object} query - Query parameters
   */
  addQueryToHistory(query) {
    const entry = {
      id: `query_${Date.now()}`,
      params: query,
      timestamp: new Date().toISOString()
    };
    
    this.queryHistory.unshift(entry);
    
    // Enforce limit
    if (this.queryHistory.length > this.MAX_HISTORY) {
      this.queryHistory = this.queryHistory.slice(0, this.MAX_HISTORY);
    }
    
    this.save();
  }

  /**
   * Reset preferences to defaults
   */
  reset() {
    const defaultPrefs = new UserPreferences();
    Object.assign(this, defaultPrefs);
    this.save();
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
      savedProfiles: this.savedProfiles,
      queryHistory: this.queryHistory
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
    prefs.queryHistory = json.queryHistory || [];
    return prefs;
  }
}
