/**
 * Industry Profile Model
 * 
 * Represents industry-specific investment criteria and priorities.
 * Loads configurations from industry-profiles.json.
 */
export class IndustryProfile {
  /**
   * Create a new IndustryProfile
   * @param {String} type - Industry type identifier
   * @param {Object} weights - Criteria weights
   * @param {String} description - Human-readable description
   */
  constructor(type, weights, description) {
    this.type = type;                    // 'manufacturing', 'logistics', etc.
    this.weights = weights;              // Criteria weights
    this.description = description;      // Human-readable description
    this.requiredInfrastructure = [];   // Typical requirements
    this.logisticsPriority = 'medium';  // 'low', 'medium', 'high'
  }

  /**
   * Get industry profile by type
   * @param {String} type - Industry type
   * @returns {Promise<IndustryProfile>} Industry profile instance
   */
  static async getProfile(type) {
    try {
      // Load from industry-profiles.json
      const response = await fetch('data/industry-profiles.json');
      if (!response.ok) {
        throw new Error(`Failed to load industry profiles: ${response.status}`);
      }
      const profiles = await response.json();
      
      const profileData = profiles[type];
      if (!profileData) {
        console.warn(`Industry profile '${type}' not found, using default`);
        return IndustryProfile.getDefaultProfile();
      }

      const profile = new IndustryProfile(
        type,
        profileData.weights,
        profileData.description
      );
      profile.requiredInfrastructure = profileData.requiredInfrastructure || [];
      profile.logisticsPriority = profileData.logisticsPriority || 'medium';
      
      return profile;
    } catch (error) {
      console.error('Error loading industry profile:', error);
      return IndustryProfile.getDefaultProfile();
    }
  }

  /**
   * Get default industry profile (manufacturing)
   * @returns {IndustryProfile} Default profile
   */
  static getDefaultProfile() {
    return new IndustryProfile(
      'manufacturing',
      {
        price: 0.25,
        location: 0.20,
        infrastructure: 0.35,
        logistics: 0.20
      },
      'General manufacturing industry'
    );
  }

  /**
   * Serialize profile to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      type: this.type,
      weights: this.weights,
      description: this.description,
      requiredInfrastructure: this.requiredInfrastructure,
      logisticsPriority: this.logisticsPriority
    };
  }

  /**
   * Deserialize profile from JSON
   * @param {Object} json - JSON object
   * @returns {IndustryProfile} IndustryProfile instance
   */
  static fromJSON(json) {
    const profile = new IndustryProfile(
      json.type,
      json.weights,
      json.description
    );
    profile.requiredInfrastructure = json.requiredInfrastructure || [];
    profile.logisticsPriority = json.logisticsPriority || 'medium';
    return profile;
  }
}
