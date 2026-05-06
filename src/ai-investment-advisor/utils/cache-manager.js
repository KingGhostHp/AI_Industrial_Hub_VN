/**
 * Cache Manager
 * 
 * Manages caching of LLM API responses and other data with TTL-based expiration
 * and size management to stay within localStorage limits (5MB).
 * 
 * Features:
 * - Cache key generation based on zone data and parameters
 * - TTL-based cache expiration
 * - Cache size management (max 5MB as per localStorage limit)
 * - Automatic cleanup of expired entries
 * - LRU (Least Recently Used) eviction when size limit is reached
 * 
 * Requirements: 11.5, 14.6
 */

/**
 * Cache Manager class
 */
class CacheManager {
  /**
   * Initialize Cache Manager
   * @param {Object} options - Configuration options
   * @param {number} [options.maxSize=5242880] - Maximum cache size in bytes (default 5MB)
   * @param {number} [options.defaultTTL=86400] - Default TTL in seconds (default 24 hours)
   * @param {string} [options.prefix='cache'] - Cache key prefix
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 5242880; // 5MB default
    this.defaultTTL = options.defaultTTL || 86400; // 24 hours default
    this.prefix = options.prefix || 'cache';
  }

  /**
   * Generate cache key based on zone data and parameters
   * @param {string} namespace - Cache namespace (e.g., 'llm', 'prediction', 'recommendation')
   * @param {Object} zone - Zone data
   * @param {Object} params - Additional parameters
   * @returns {string} - Generated cache key
   */
  generateKey(namespace, zone, params = {}) {
    // Extract zone identifier
    const zoneId = this._extractZoneId(zone);
    
    // Create parameter hash
    const paramHash = this._hashParams(params);
    
    // Combine into cache key
    return `${this.prefix}_${namespace}_${zoneId}_${paramHash}`;
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    try {
      const fullKey = this._getFullKey(key);
      const cached = localStorage.getItem(fullKey);
      
      if (!cached) {
        return null;
      }
      
      const entry = JSON.parse(cached);
      
      // Check if expired
      if (this._isExpired(entry)) {
        this.delete(key);
        return null;
      }
      
      // Update last accessed time
      entry.lastAccessed = Date.now();
      localStorage.setItem(fullKey, JSON.stringify(entry));
      
      return entry.value;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl] - Time to live in seconds (uses defaultTTL if not specified)
   * @returns {boolean} - True if successfully cached
   */
  set(key, value, ttl) {
    try {
      const fullKey = this._getFullKey(key);
      const entry = {
        value,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        ttl: (ttl || this.defaultTTL) * 1000, // Convert to milliseconds
        size: 0 // Will be calculated
      };
      
      const serialized = JSON.stringify(entry);
      entry.size = this._getByteSize(serialized);
      
      // Check if this single entry exceeds max size
      if (entry.size > this.maxSize) {
        console.warn(`Cache entry too large: ${entry.size} bytes (max: ${this.maxSize})`);
        return false;
      }
      
      // Ensure we have space
      this._ensureSpace(entry.size);
      
      // Store in localStorage
      localStorage.setItem(fullKey, serialized);
      
      return true;
    } catch (error) {
      console.error('Error writing to cache:', error);
      
      // If quota exceeded, try cleanup and retry
      if (error.name === 'QuotaExceededError') {
        this._evictLRU(entry.size);
        try {
          localStorage.setItem(fullKey, JSON.stringify(entry));
          return true;
        } catch (retryError) {
          console.error('Failed to cache after cleanup:', retryError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   * @returns {boolean} - True if deleted
   */
  delete(key) {
    try {
      const fullKey = this._getFullKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Error deleting from cache:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} - True if exists and not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries with this prefix
   * @param {string} [namespace] - Optional namespace to clear (clears all if not specified)
   * @returns {number} - Number of entries cleared
   */
  clear(namespace) {
    try {
      const keys = this._getCacheKeys(namespace);
      keys.forEach(key => localStorage.removeItem(key));
      return keys.length;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    try {
      const keys = this._getCacheKeys();
      let totalSize = 0;
      let expiredCount = 0;
      let validCount = 0;
      
      keys.forEach(key => {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          const size = this._getByteSize(localStorage.getItem(key));
          totalSize += size;
          
          if (this._isExpired(entry)) {
            expiredCount++;
          } else {
            validCount++;
          }
        } catch (error) {
          // Skip invalid entries
        }
      });
      
      return {
        totalEntries: keys.length,
        validEntries: validCount,
        expiredEntries: expiredCount,
        totalSize,
        maxSize: this.maxSize,
        usagePercent: (totalSize / this.maxSize * 100).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalSize: 0,
        maxSize: this.maxSize,
        usagePercent: 0
      };
    }
  }

  /**
   * Clean up expired entries
   * @returns {number} - Number of entries removed
   */
  cleanup() {
    try {
      const keys = this._getCacheKeys();
      let removed = 0;
      
      keys.forEach(key => {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          if (this._isExpired(entry)) {
            localStorage.removeItem(key);
            removed++;
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key);
          removed++;
        }
      });
      
      return removed;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Extract zone identifier from zone data
   * @private
   */
  _extractZoneId(zone) {
    if (!zone) return 'unknown';
    
    const props = zone.properties || zone;
    
    // Try multiple identifier fields
    return props.code || 
           props.id || 
           props.name || 
           props.zoneName ||
           'unknown';
  }

  /**
   * Hash parameters into a short string
   * @private
   */
  _hashParams(params) {
    if (!params || Object.keys(params).length === 0) {
      return 'default';
    }
    
    // Create a stable string representation
    const str = JSON.stringify(params, Object.keys(params).sort());
    
    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    
    // Convert to base36 for shorter string
    return Math.abs(hash).toString(36);
  }

  /**
   * Get full cache key with prefix
   * @private
   */
  _getFullKey(key) {
    // If key already has prefix, return as-is
    if (key.startsWith(this.prefix + '_')) {
      return key;
    }
    return `${this.prefix}_${key}`;
  }

  /**
   * Check if cache entry is expired
   * @private
   */
  _isExpired(entry) {
    if (!entry || !entry.timestamp || !entry.ttl) {
      return true;
    }
    
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get all cache keys with optional namespace filter
   * @private
   */
  _getCacheKeys(namespace) {
    const allKeys = Object.keys(localStorage);
    const prefix = namespace ? `${this.prefix}_${namespace}_` : `${this.prefix}_`;
    return allKeys.filter(key => key.startsWith(prefix));
  }

  /**
   * Get byte size of string
   * @private
   */
  _getByteSize(str) {
    // UTF-8 encoding: 1-4 bytes per character
    // This is an approximation
    return new Blob([str]).size;
  }

  /**
   * Get current cache size
   * @private
   */
  _getCurrentSize() {
    const keys = this._getCacheKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        totalSize += this._getByteSize(value);
      } catch (error) {
        // Skip
      }
    });
    
    return totalSize;
  }

  /**
   * Ensure we have enough space for new entry
   * @private
   */
  _ensureSpace(requiredSize) {
    const currentSize = this._getCurrentSize();
    const availableSize = this.maxSize - currentSize;
    
    if (availableSize >= requiredSize) {
      return; // Enough space
    }
    
    // Need to free up space
    const sizeToFree = requiredSize - availableSize;
    
    // First, remove expired entries
    this.cleanup();
    
    // Check if we have enough space now
    const newSize = this._getCurrentSize();
    if (this.maxSize - newSize >= requiredSize) {
      return;
    }
    
    // Still not enough, evict LRU entries
    this._evictLRU(sizeToFree);
  }

  /**
   * Evict least recently used entries
   * @private
   */
  _evictLRU(sizeToFree) {
    try {
      const keys = this._getCacheKeys();
      
      // Get all entries with their last accessed time and size
      const entries = keys.map(key => {
        try {
          const value = localStorage.getItem(key);
          const entry = JSON.parse(value);
          const size = this._getByteSize(value);
          
          return {
            key,
            lastAccessed: entry.lastAccessed || entry.timestamp || 0,
            size
          };
        } catch (error) {
          return null;
        }
      }).filter(e => e !== null);
      
      // Sort by last accessed (oldest first)
      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      // Remove entries until we've freed enough space
      let freedSize = 0;
      let removed = 0;
      
      for (const entry of entries) {
        if (freedSize >= sizeToFree) {
          break;
        }
        
        localStorage.removeItem(entry.key);
        freedSize += entry.size;
        removed++;
      }
      
      console.log(`Evicted ${removed} LRU entries, freed ${freedSize} bytes`);
    } catch (error) {
      console.error('Error during LRU eviction:', error);
    }
  }
}

/**
 * Create a singleton instance for LLM cache
 */
export const llmCache = new CacheManager({
  prefix: 'llm_cache',
  maxSize: 5242880, // 5MB
  defaultTTL: 86400 // 24 hours
});

/**
 * Create a singleton instance for prediction cache
 */
export const predictionCache = new CacheManager({
  prefix: 'prediction_cache',
  maxSize: 2097152, // 2MB
  defaultTTL: 86400 // 24 hours
});

export default CacheManager;
