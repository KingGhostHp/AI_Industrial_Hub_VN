/**
 * Environment Variable Loader
 * 
 * Loads configuration from .env file for browser environment.
 * Note: In production, use a build tool (Vite, Webpack) to inject env vars.
 * For development, this reads from a config object.
 */

class EnvLoader {
  constructor() {
    this.config = {};
    this.loaded = false;
  }

  /**
   * Load environment variables
   * In browser, we'll use a config.js file instead of .env
   */
  async load() {
    if (this.loaded) return this.config;

    try {
      // Try to load from config.js (generated from .env)
      const response = await fetch('./config.js');
      if (response.ok) {
        const configText = await response.text();
        // Parse config.js which exports window.ENV_CONFIG
        eval(configText);
        this.config = window.ENV_CONFIG || {};
      }
    } catch (error) {
      console.warn('Could not load config.js, using defaults:', error);
    }

    // Set defaults if not loaded
    this.config = {
      // Mapbox
      MAPBOX_ACCESS_TOKEN: this.config.MAPBOX_ACCESS_TOKEN || '',
      
      // IIP Vietnam API
      IIP_VIETNAM_API_URL: this.config.IIP_VIETNAM_API_URL || 
        'https://api.iipvietnam.vn/files/filedata/dataIndustrial_2d6e5ca9-40c0-4785-979b-058c76049677.json',
      
      // Google Gemini
      GEMINI_API_KEY: this.config.GEMINI_API_KEY || '',
      GEMINI_MODEL: this.config.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      GEMINI_TEMPERATURE: parseFloat(this.config.GEMINI_TEMPERATURE || '0.7'),
      GEMINI_MAX_TOKENS: parseInt(this.config.GEMINI_MAX_TOKENS || '500'),
      
      // OpenAI
      OPENAI_API_KEY: this.config.OPENAI_API_KEY || '',
      OPENAI_MODEL: this.config.OPENAI_MODEL || 'gpt-4o-mini',
      OPENAI_TEMPERATURE: parseFloat(this.config.OPENAI_TEMPERATURE || '0.7'),
      OPENAI_MAX_TOKENS: parseInt(this.config.OPENAI_MAX_TOKENS || '500'),
      
      // Anthropic
      ANTHROPIC_API_KEY: this.config.ANTHROPIC_API_KEY || '',
      ANTHROPIC_MODEL: this.config.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      ANTHROPIC_TEMPERATURE: parseFloat(this.config.ANTHROPIC_TEMPERATURE || '0.7'),
      ANTHROPIC_MAX_TOKENS: parseInt(this.config.ANTHROPIC_MAX_TOKENS || '500'),
      
      // LLM Settings
      LLM_PROVIDER: this.config.LLM_PROVIDER || 'gemini',
      LLM_MAX_CALLS_PER_HOUR: parseInt(this.config.LLM_MAX_CALLS_PER_HOUR || '100'),
      LLM_CACHE_TTL: parseInt(this.config.LLM_CACHE_TTL || '86400'),
      LLM_ENABLE_FALLBACK: this.config.LLM_ENABLE_FALLBACK !== 'false',
      
      // App Settings
      DEFAULT_LANGUAGE: this.config.DEFAULT_LANGUAGE || 'vi',
      DEBUG_MODE: this.config.DEBUG_MODE === 'true',
      LOCALSTORAGE_MAX_SIZE: parseInt(this.config.LOCALSTORAGE_MAX_SIZE || '5242880'),
    };

    this.loaded = true;
    return this.config;
  }

  /**
   * Get a specific config value
   */
  get(key, defaultValue = null) {
    if (!this.loaded) {
      console.warn('EnvLoader not loaded yet. Call load() first.');
    }
    return this.config[key] ?? defaultValue;
  }

  /**
   * Check if LLM API is configured
   */
  isLLMConfigured() {
    const provider = this.get('LLM_PROVIDER');
    if (provider === 'gemini') {
      return !!this.get('GEMINI_API_KEY');
    } else if (provider === 'openai') {
      return !!this.get('OPENAI_API_KEY');
    } else if (provider === 'anthropic') {
      return !!this.get('ANTHROPIC_API_KEY');
    }
    return false;
  }

  /**
   * Get LLM configuration for current provider
   */
  getLLMConfig() {
    const provider = this.get('LLM_PROVIDER');
    
    if (provider === 'gemini') {
      return {
        provider: 'gemini',
        apiKey: this.get('GEMINI_API_KEY'),
        model: this.get('GEMINI_MODEL'),
        temperature: this.get('GEMINI_TEMPERATURE'),
        maxTokens: this.get('GEMINI_MAX_TOKENS'),
      };
    } else if (provider === 'openai') {
      return {
        provider: 'openai',
        apiKey: this.get('OPENAI_API_KEY'),
        model: this.get('OPENAI_MODEL'),
        temperature: this.get('OPENAI_TEMPERATURE'),
        maxTokens: this.get('OPENAI_MAX_TOKENS'),
      };
    } else if (provider === 'anthropic') {
      return {
        provider: 'anthropic',
        apiKey: this.get('ANTHROPIC_API_KEY'),
        model: this.get('ANTHROPIC_MODEL'),
        temperature: this.get('ANTHROPIC_TEMPERATURE'),
        maxTokens: this.get('ANTHROPIC_MAX_TOKENS'),
      };
    }
    
    return null;
  }
}

// Export singleton instance
export const envLoader = new EnvLoader();
