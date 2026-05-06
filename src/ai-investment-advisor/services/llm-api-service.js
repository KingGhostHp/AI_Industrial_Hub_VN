/**
 * LLM API Service
 * 
 * Integrates with external LLM APIs (OpenAI, Anthropic, Google Gemini) to generate
 * natural language explanations for investment recommendations and growth analysis.
 * 
 * Features:
 * - Multi-provider support (OpenAI, Anthropic, Gemini)
 * - Response caching with 24-hour TTL
 * - Rate limiting (configurable, default 100 calls/hour)
 * - Fallback to rule-based explanations on API errors
 * - Cost tracking (total calls, cached hits, estimated cost)
 * 
 * Requirements: 4.5, 4.7, 11.3, 11.5, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 19.1, 19.3, 19.5, 19.7
 */

/**
 * Prompt template for recommendation explanations
 */
const EXPLANATION_PROMPT = `You are an investment advisor for industrial zones in Vietnam.

Zone Information:
- Name: {zoneName}
- Province: {province}
- Rental Price: {price} USD/m²/lease term
- Acreage: {acreage} hectares
- Distance to nearest port: {portDistance} km
- Distance to nearest airport: {airportDistance} km

Score Breakdown:
- Price Score: {priceScore}/100 (weight: {priceWeight})
- Location Score: {locationScore}/100 (weight: {locationWeight})
- Infrastructure Score: {infraScore}/100 (weight: {infraWeight})
- Logistics Score: {logisticsScore}/100 (weight: {logisticsWeight})
- Total Score: {totalScore}/100

Industry Profile: {industryType}

Generate a concise explanation (3-4 sentences) in {language} explaining:
1. Why this zone received this score
2. Top 2 strengths
3. Top 2 weaknesses
4. Suitability for the industry type

Keep the tone professional and data-driven.`;

/**
 * Prompt template for growth analysis
 */
const GROWTH_ANALYSIS_PROMPT = `You are an investment advisor analyzing growth potential for industrial zones in Vietnam.

Zone Information:
- Name: {zoneName}
- Province: {province}
- Current Rental Price: {price} USD/m²/lease term
- Acreage: {acreage} hectares
- Province Development Level: {devLevel}

Growth Potential Score: {growthScore}/100

Growth Factors:
- Province Development: {devLevel}/3
- Saturation Index: {saturation}/100
- Proximity Score: {proximity}/100
- Price Competitiveness: {priceComp}/100
- Infrastructure Quality: {infraQuality}/100

Generate a concise growth analysis (3-4 sentences) in {language} explaining:
1. Why this zone has this growth potential
2. Key growth drivers
3. Potential risks or limitations
4. Investment outlook for the next 1-2 years

Keep the tone professional and data-driven.`;

/**
 * LLM API Service class
 */
class LLMAPIService {
  /**
   * Initialize LLM API Service
   * @param {Object} config - Configuration object
   * @param {string} config.provider - API provider ('openai', 'anthropic', 'gemini')
   * @param {string} config.apiKey - API key for the provider
   * @param {string} config.model - Model name (e.g., 'gpt-4', 'claude-3-opus', 'gemini-pro')
   * @param {number} config.temperature - Temperature parameter (0.0-1.0)
   * @param {number} config.maxTokens - Maximum tokens in response
   * @param {number} [config.maxCallsPerHour=100] - Rate limit
   * @param {number} [config.cacheTTL=86400] - Cache TTL in seconds (default 24 hours)
   * @param {boolean} [config.enableFallback=true] - Enable fallback to rule-based explanations
   */
  constructor(config) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 500;
    this.maxCallsPerHour = config.maxCallsPerHour || 100;
    this.cacheTTL = config.cacheTTL || 86400; // 24 hours
    this.enableFallback = config.enableFallback !== false;
    
    // Cost tracking
    this.costTracking = this._loadCostTracking();
    
    // Rate limiting
    this.rateLimitWindow = 3600000; // 1 hour in milliseconds
    this.callTimestamps = this._loadCallTimestamps();
  }

  /**
   * Generate recommendation explanation
   * @param {Object} zone - Zone data
   * @param {Object} scoreBreakdown - Criteria scores
   * @param {string} language - 'vi' or 'en'
   * @returns {Promise<string>} - Natural language explanation
   */
  async generateExplanation(zone, scoreBreakdown, language = 'vi') {
    // Generate cache key
    const cacheKey = this._generateCacheKey('explanation', zone, scoreBreakdown, language);
    
    // Check cache first
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      this._incrementCachedHits();
      return cached;
    }
    
    // Check rate limit
    if (!this._checkRateLimit()) {
      console.warn('Rate limit exceeded, using fallback explanation');
      if (this.enableFallback) {
        return this._generateFallbackExplanation(zone, scoreBreakdown, language);
      }
      throw new Error('Rate limit exceeded and fallback is disabled');
    }
    
    try {
      // Build prompt
      const prompt = this._buildExplanationPrompt(zone, scoreBreakdown, language);
      
      // Call LLM API
      const response = await this._callLLMAPI(prompt);
      
      // Cache response
      this.cacheResponse(cacheKey, response, this.cacheTTL);
      
      // Update cost tracking
      this._incrementAPICall();
      
      return response;
    } catch (error) {
      console.error('LLM API error:', error);
      
      if (this.enableFallback) {
        return this._generateFallbackExplanation(zone, scoreBreakdown, language);
      }
      
      throw error;
    }
  }

  /**
   * Generate growth potential analysis
   * @param {Object} zone - Zone data
   * @param {number} growthScore - Calculated growth score (0-100)
   * @param {Object} growthFactors - Growth calculation factors
   * @param {string} language - 'vi' or 'en'
   * @returns {Promise<string>} - Growth analysis
   */
  async generateGrowthAnalysis(zone, growthScore, growthFactors, language = 'vi') {
    // Generate cache key
    const cacheKey = this._generateCacheKey('growth', zone, { growthScore, ...growthFactors }, language);
    
    // Check cache first
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      this._incrementCachedHits();
      return cached;
    }
    
    // Check rate limit
    if (!this._checkRateLimit()) {
      console.warn('Rate limit exceeded, using fallback growth analysis');
      if (this.enableFallback) {
        return this._generateFallbackGrowthAnalysis(zone, growthScore, growthFactors, language);
      }
      throw new Error('Rate limit exceeded and fallback is disabled');
    }
    
    try {
      // Build prompt
      const prompt = this._buildGrowthAnalysisPrompt(zone, growthScore, growthFactors, language);
      
      // Call LLM API
      const response = await this._callLLMAPI(prompt);
      
      // Cache response
      this.cacheResponse(cacheKey, response, this.cacheTTL);
      
      // Update cost tracking
      this._incrementAPICall();
      
      return response;
    } catch (error) {
      console.error('LLM API error:', error);
      
      if (this.enableFallback) {
        return this._generateFallbackGrowthAnalysis(zone, growthScore, growthFactors, language);
      }
      
      throw error;
    }
  }

  /**
   * Get cached response
   * @param {string} cacheKey - Unique cache key
   * @returns {string|null} - Cached response or null
   */
  getCachedResponse(cacheKey) {
    try {
      const cached = localStorage.getItem(`llm_cache_${cacheKey}`);
      if (!cached) return null;
      
      const { response, timestamp, ttl } = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() - timestamp > ttl * 1000) {
        localStorage.removeItem(`llm_cache_${cacheKey}`);
        return null;
      }
      
      return response;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache response
   * @param {string} cacheKey - Unique cache key
   * @param {string} response - LLM response
   * @param {number} ttl - Time to live in seconds (default 86400 = 24 hours)
   */
  cacheResponse(cacheKey, response, ttl = 86400) {
    try {
      const cacheData = {
        response,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(`llm_cache_${cacheKey}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing cache:', error);
      // If localStorage is full, try to clear old cache entries
      if (error.name === 'QuotaExceededError') {
        this._clearOldCacheEntries();
        try {
          localStorage.setItem(`llm_cache_${cacheKey}`, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error('Failed to cache after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Get cost tracking statistics
   * @returns {Object} - Cost tracking data
   */
  getCostTracking() {
    return { ...this.costTracking };
  }

  /**
   * Reset cost tracking
   */
  resetCostTracking() {
    this.costTracking = {
      totalCalls: 0,
      cachedHits: 0,
      apiCalls: 0,
      estimatedCost: 0.00,
      lastReset: Date.now()
    };
    this._saveCostTracking();
  }

  /**
   * Build explanation prompt
   * @private
   */
  _buildExplanationPrompt(zone, scoreBreakdown, language) {
    const props = zone.properties || zone;
    
    return EXPLANATION_PROMPT
      .replace('{zoneName}', props.name || 'Unknown')
      .replace('{province}', props.province || 'Unknown')
      .replace('{price}', props.price || 'N/A')
      .replace('{acreage}', props.acreage || 'N/A')
      .replace('{portDistance}', scoreBreakdown.nearestPort?.distance?.toFixed(1) || 'N/A')
      .replace('{airportDistance}', scoreBreakdown.nearestAirport?.distance?.toFixed(1) || 'N/A')
      .replace('{priceScore}', scoreBreakdown.price?.score?.toFixed(1) || '0')
      .replace('{priceWeight}', (scoreBreakdown.price?.weight * 100)?.toFixed(0) || '0')
      .replace('{locationScore}', scoreBreakdown.location?.score?.toFixed(1) || '0')
      .replace('{locationWeight}', (scoreBreakdown.location?.weight * 100)?.toFixed(0) || '0')
      .replace('{infraScore}', scoreBreakdown.infrastructure?.score?.toFixed(1) || '0')
      .replace('{infraWeight}', (scoreBreakdown.infrastructure?.weight * 100)?.toFixed(0) || '0')
      .replace('{logisticsScore}', scoreBreakdown.logistics?.score?.toFixed(1) || '0')
      .replace('{logisticsWeight}', (scoreBreakdown.logistics?.weight * 100)?.toFixed(0) || '0')
      .replace('{totalScore}', scoreBreakdown.totalScore?.toFixed(1) || '0')
      .replace('{industryType}', scoreBreakdown.industryType || 'General')
      .replace('{language}', language === 'vi' ? 'Vietnamese' : 'English');
  }

  /**
   * Build growth analysis prompt
   * @private
   */
  _buildGrowthAnalysisPrompt(zone, growthScore, growthFactors, language) {
    const props = zone.properties || zone;
    
    return GROWTH_ANALYSIS_PROMPT
      .replace('{zoneName}', props.name || 'Unknown')
      .replace('{province}', props.province || 'Unknown')
      .replace('{price}', props.price || 'N/A')
      .replace('{acreage}', props.acreage || 'N/A')
      .replace('{devLevel}', growthFactors.devLevel || 'N/A')
      .replace('{growthScore}', growthScore.toFixed(1))
      .replace('{saturation}', (growthFactors.saturation || 0).toFixed(1))
      .replace('{proximity}', (growthFactors.proximity || 0).toFixed(1))
      .replace('{priceComp}', (growthFactors.priceCompetitiveness || 0).toFixed(1))
      .replace('{infraQuality}', (growthFactors.infrastructureScore || 0).toFixed(1))
      .replace('{language}', language === 'vi' ? 'Vietnamese' : 'English');
  }

  /**
   * Call LLM API based on provider
   * @private
   */
  async _callLLMAPI(prompt) {
    this._recordCallTimestamp();
    
    switch (this.provider) {
      case 'openai':
        return await this._callOpenAI(prompt);
      case 'anthropic':
        return await this._callAnthropic(prompt);
      case 'gemini':
        return await this._callGemini(prompt);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Call OpenAI API
   * @private
   */
  async _callOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a professional investment advisor.' },
          { role: 'user', content: prompt }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Update estimated cost (rough estimate: $0.01 per 1K tokens for GPT-4)
    const tokensUsed = data.usage?.total_tokens || 0;
    const costPerToken = this.model.includes('gpt-4') ? 0.00001 : 0.000001;
    this.costTracking.estimatedCost += tokensUsed * costPerToken;
    this._saveCostTracking();
    
    return data.choices[0].message.content.trim();
  }

  /**
   * Call Anthropic API
   * @private
   */
  async _callAnthropic(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Update estimated cost (rough estimate: $0.008 per 1K tokens for Claude)
    const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;
    this.costTracking.estimatedCost += tokensUsed * 0.000008;
    this._saveCostTracking();
    
    return data.content[0].text.trim();
  }

  /**
   * Call Google Gemini API
   * @private
   */
  async _callGemini(prompt) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Update estimated cost (Gemini is generally cheaper, estimate $0.0005 per 1K tokens)
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;
    this.costTracking.estimatedCost += tokensUsed * 0.0000005;
    this._saveCostTracking();
    
    return data.candidates[0].content.parts[0].text.trim();
  }

  /**
   * Generate fallback explanation (rule-based)
   * @private
   */
  _generateFallbackExplanation(zone, scoreBreakdown, language) {
    const props = zone.properties || zone;
    const totalScore = scoreBreakdown.totalScore || 0;
    
    // Identify strengths and weaknesses
    const scores = [
      { name: 'price', score: scoreBreakdown.price?.score || 0, weight: scoreBreakdown.price?.weight || 0 },
      { name: 'location', score: scoreBreakdown.location?.score || 0, weight: scoreBreakdown.location?.weight || 0 },
      { name: 'infrastructure', score: scoreBreakdown.infrastructure?.score || 0, weight: scoreBreakdown.infrastructure?.weight || 0 },
      { name: 'logistics', score: scoreBreakdown.logistics?.score || 0, weight: scoreBreakdown.logistics?.weight || 0 }
    ];
    
    scores.sort((a, b) => b.score - a.score);
    const strengths = scores.slice(0, 2);
    const weaknesses = scores.slice(-2).reverse();
    
    if (language === 'vi') {
      return `Khu công nghiệp ${props.name} đạt điểm ${totalScore.toFixed(1)}/100. ` +
        `Điểm mạnh: ${this._translateCriterion(strengths[0].name, 'vi')} (${strengths[0].score.toFixed(1)}) và ${this._translateCriterion(strengths[1].name, 'vi')} (${strengths[1].score.toFixed(1)}). ` +
        `Điểm yếu: ${this._translateCriterion(weaknesses[0].name, 'vi')} (${weaknesses[0].score.toFixed(1)}) và ${this._translateCriterion(weaknesses[1].name, 'vi')} (${weaknesses[1].score.toFixed(1)}). ` +
        `Khu vực này ${totalScore >= 70 ? 'rất phù hợp' : totalScore >= 50 ? 'phù hợp' : 'cần xem xét thêm'} cho ngành ${scoreBreakdown.industryType || 'công nghiệp'}.`;
    } else {
      return `Industrial zone ${props.name} scores ${totalScore.toFixed(1)}/100. ` +
        `Strengths: ${strengths[0].name} (${strengths[0].score.toFixed(1)}) and ${strengths[1].name} (${strengths[1].score.toFixed(1)}). ` +
        `Weaknesses: ${weaknesses[0].name} (${weaknesses[0].score.toFixed(1)}) and ${weaknesses[1].name} (${weaknesses[1].score.toFixed(1)}). ` +
        `This zone is ${totalScore >= 70 ? 'highly suitable' : totalScore >= 50 ? 'suitable' : 'worth considering'} for ${scoreBreakdown.industryType || 'industrial'} operations.`;
    }
  }

  /**
   * Generate fallback growth analysis (rule-based)
   * @private
   */
  _generateFallbackGrowthAnalysis(zone, growthScore, growthFactors, language) {
    const props = zone.properties || zone;
    
    const category = growthScore >= 70 ? 'high' : growthScore >= 40 ? 'moderate' : 'low';
    
    if (language === 'vi') {
      return `Khu công nghiệp ${props.name} có tiềm năng tăng trưởng ${category === 'high' ? 'cao' : category === 'moderate' ? 'trung bình' : 'thấp'} với điểm ${growthScore.toFixed(1)}/100. ` +
        `Yếu tố chính: mức độ phát triển tỉnh (${growthFactors.devLevel || 'N/A'}), chỉ số bão hòa (${(growthFactors.saturation || 0).toFixed(1)}). ` +
        `Rủi ro: ${growthFactors.saturation > 70 ? 'thị trường có thể bão hòa' : 'cạnh tranh từ các khu vực lân cận'}. ` +
        `Triển vọng 1-2 năm tới: ${category === 'high' ? 'tích cực' : category === 'moderate' ? 'ổn định' : 'cần theo dõi'}.`;
    } else {
      return `Industrial zone ${props.name} has ${category} growth potential with a score of ${growthScore.toFixed(1)}/100. ` +
        `Key factors: province development level (${growthFactors.devLevel || 'N/A'}), saturation index (${(growthFactors.saturation || 0).toFixed(1)}). ` +
        `Risks: ${growthFactors.saturation > 70 ? 'market may be saturated' : 'competition from nearby zones'}. ` +
        `Outlook for 1-2 years: ${category === 'high' ? 'positive' : category === 'moderate' ? 'stable' : 'requires monitoring'}.`;
    }
  }

  /**
   * Translate criterion name
   * @private
   */
  _translateCriterion(criterion, language) {
    const translations = {
      vi: {
        price: 'giá thuê',
        location: 'vị trí',
        infrastructure: 'hạ tầng',
        logistics: 'logistics'
      },
      en: {
        price: 'rental price',
        location: 'location',
        infrastructure: 'infrastructure',
        logistics: 'logistics'
      }
    };
    
    return translations[language]?.[criterion] || criterion;
  }

  /**
   * Generate cache key
   * @private
   */
  _generateCacheKey(type, zone, data, language) {
    const props = zone.properties || zone;
    const zoneId = props.code || props.name || 'unknown';
    const dataHash = JSON.stringify(data).substring(0, 50);
    return `${type}_${zoneId}_${dataHash}_${language}`;
  }

  /**
   * Check rate limit
   * @private
   */
  _checkRateLimit() {
    const now = Date.now();
    
    // Remove timestamps older than 1 hour
    this.callTimestamps = this.callTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );
    
    // Check if under limit
    return this.callTimestamps.length < this.maxCallsPerHour;
  }

  /**
   * Record call timestamp
   * @private
   */
  _recordCallTimestamp() {
    this.callTimestamps.push(Date.now());
    this._saveCallTimestamps();
  }

  /**
   * Increment cached hits
   * @private
   */
  _incrementCachedHits() {
    this.costTracking.totalCalls++;
    this.costTracking.cachedHits++;
    this._saveCostTracking();
  }

  /**
   * Increment API call
   * @private
   */
  _incrementAPICall() {
    this.costTracking.totalCalls++;
    this.costTracking.apiCalls++;
    this._saveCostTracking();
  }

  /**
   * Load cost tracking from localStorage
   * @private
   */
  _loadCostTracking() {
    try {
      const data = localStorage.getItem('llm_cost_tracking');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading cost tracking:', error);
    }
    
    return {
      totalCalls: 0,
      cachedHits: 0,
      apiCalls: 0,
      estimatedCost: 0.00,
      lastReset: Date.now()
    };
  }

  /**
   * Save cost tracking to localStorage
   * @private
   */
  _saveCostTracking() {
    try {
      localStorage.setItem('llm_cost_tracking', JSON.stringify(this.costTracking));
    } catch (error) {
      console.error('Error saving cost tracking:', error);
    }
  }

  /**
   * Load call timestamps from localStorage
   * @private
   */
  _loadCallTimestamps() {
    try {
      const data = localStorage.getItem('llm_call_timestamps');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading call timestamps:', error);
    }
    
    return [];
  }

  /**
   * Save call timestamps to localStorage
   * @private
   */
  _saveCallTimestamps() {
    try {
      localStorage.setItem('llm_call_timestamps', JSON.stringify(this.callTimestamps));
    } catch (error) {
      console.error('Error saving call timestamps:', error);
    }
  }

  /**
   * Clear old cache entries to free up space
   * @private
   */
  _clearOldCacheEntries() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('llm_cache_'));
      
      // Sort by timestamp (oldest first)
      const entries = cacheKeys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          return { key, timestamp: data.timestamp };
        } catch {
          return { key, timestamp: 0 };
        }
      }).sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 25% of entries
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
      
      console.log(`Cleared ${toRemove} old cache entries`);
    } catch (error) {
      console.error('Error clearing old cache entries:', error);
    }
  }
}

export default LLMAPIService;
