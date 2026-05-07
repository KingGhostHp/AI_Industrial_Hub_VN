/**
 * Explanation Panel Component
 * 
 * Displays AI-generated explanations for investment recommendations.
 * Shows LLM-generated natural language explanations, criterion contributions,
 * negative impact highlights, province comparisons, and strengths/weaknesses.
 * 
 * Requirements: 9.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
 */

export class ExplanationPanel {
  /**
   * Initialize explanation panel
   * @param {string} containerId - ID of the container element
   * @param {Object} options - Services and configuration
   * @param {Object} options.dataManager - Data manager service
   * @param {Object} options.predictionEngine - Prediction engine service
   */
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.dataManager = options.dataManager;
    this.predictionEngine = options.predictionEngine;
    this.language = options.language || 'vi';
    
    this.recommendation = null;
    this.explanation = null;
    this.provinceAverage = null;
    this.strengths = [];
    this.weaknesses = [];
    
    // Vietnamese translations (default language)
    this.translations = {
      vi: {
        title: 'Giải Thích Chi Tiết',
        explanation: 'Phân Tích AI',
        score_breakdown: 'Đóng Góp Điểm Số',
        criterion: 'Tiêu Chí',
        score: 'Điểm',
        weight: 'Trọng Số',
        contribution: 'Đóng Góp',
        province_comparison: 'So Sánh Với Trung Bình Tỉnh',
        this_zone: 'Khu này',
        province_avg: 'TB Tỉnh',
        strengths: 'Điểm Mạnh',
        weaknesses: 'Điểm Yêu',
        negative_impact: 'Tác Động Tiêu Cực',
        positive_impact: 'Tác Động Tích Cực',
        close: 'Đóng',
        
        // Criterion names
        price: 'Giá Thuê',
        location: 'Vị Trí',
        infrastructure: 'Hạ Tầng',
        logistics: 'Logistics',
        
        // Impact descriptions
        price_high: 'Giá thuê cao hơn trung bình',
        price_low: 'Giá thuê cạnh tranh',
        location_good: 'Vị trí thuận lợi',
        location_poor: 'Vị trí xa trung tâm',
        infrastructure_good: 'Hạ tầng đầy đủ',
        infrastructure_poor: 'Hạ tầng hạn chế',
        logistics_good: 'Giao thông thuận tiện',
        logistics_poor: 'Khoảng cách vận chuyển xa',
        
        // Units
        points: 'điểm',
        percent: '%',
        higher: 'cao hơn',
        lower: 'thấp hơn',
        similar: 'tương đương'
      },
      en: {
        title: 'Detailed Explanation',
        explanation: 'AI Analysis',
        score_breakdown: 'Score Contributions',
        criterion: 'Criterion',
        score: 'Score',
        weight: 'Weight',
        contribution: 'Contribution',
        province_comparison: 'Comparison to Province Average',
        this_zone: 'This Zone',
        province_avg: 'Province Avg',
        strengths: 'Strengths',
        weaknesses: 'Weaknesses',
        negative_impact: 'Negative Impact',
        positive_impact: 'Positive Impact',
        close: 'Close',
        
        // Criterion names
        price: 'Rental Price',
        location: 'Location',
        infrastructure: 'Infrastructure',
        logistics: 'Logistics',
        
        // Impact descriptions
        price_high: 'Higher than average rental price',
        price_low: 'Competitive rental price',
        location_good: 'Favorable location',
        location_poor: 'Remote location',
        infrastructure_good: 'Complete infrastructure',
        infrastructure_poor: 'Limited infrastructure',
        logistics_good: 'Convenient transportation',
        logistics_poor: 'Long transportation distance',
        
        // Units
        points: 'points',
        percent: '%',
        higher: 'higher',
        lower: 'lower',
        similar: 'similar'
      }
    };
  }
  
  /**
   * Analyze an industrial zone on-demand
   * @param {Object} feature - GeoJSON feature of the industrial zone
   */
  async analyzeIndustrialZone(feature) {
    try {
      console.log('🔍 Analyzing industrial zone:', feature.properties.name);
      
      // 1. Calculate Score using MultiCriteriaAnalyzer
      const { MultiCriteriaAnalyzer } = await import('../services/multi-criteria-analyzer.js');
      const analyzer = new MultiCriteriaAnalyzer(this.dataManager);
      const recommendation = await analyzer.calculateScore(feature);
      
      // 2. Generate Explanation using LLMAPIService
      const { LLMAPIService } = await import('../services/llm-api-service.js');
      const llmService = new LLMAPIService(this.dataManager);
      const explanation = await llmService.generateExplanation(recommendation);
      
      // 3. Update state
      this.recommendation = recommendation;
      this.explanation = explanation;
      this.strengths = this._identifyStrengths();
      this.weaknesses = this._identifyWeaknesses();
      
      // 4. Show the panel
      this.show();
    } catch (error) {
      console.error('❌ Error analyzing industrial zone:', error);
      alert('Không thể phân tích KCN này. Vui lòng thử lại sau.');
    }
  }
  
  /**
   * Get translated text
   * @param {string} key - Translation key
   * @returns {string} - Translated text
   */
  t(key) {
    return this.translations[this.language][key] || key;
  }
  
  /**
   * Render explanation panel
   * @returns {HTMLElement} - Panel element
   */
  render() {
    const panel = document.createElement('div');
    panel.className = 'explanation-panel';
    panel.id = 'explanation-panel';
    
    const zone = this.recommendation.zone.properties;
    
    panel.innerHTML = `
      <div class="explanation-content">
        <div class="explanation-header">
          <h2 class="explanation-title">${this.t('title')}</h2>
          <button class="explanation-close-btn" id="close-explanation" aria-label="${this.t('close')}">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
        
        <div class="explanation-body">
          <!-- Zone Name -->
          <div class="zone-header">
            <h3 class="zone-name">${zone.name || 'N/A'}</h3>
            <p class="zone-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="location-icon">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ${zone.province || 'N/A'}
            </p>
            <div class="zone-score">
              <span class="score-label">${this.t('score')}:</span>
              <span class="score-value">${this.recommendation.score.toFixed(1)}/100</span>
            </div>
          </div>
          
          <!-- AI Explanation -->
          <div class="explanation-section">
            <h4 class="section-title">${this.t('explanation')}</h4>
            <div class="explanation-text">
              ${this.explanation}
            </div>
          </div>
          
          <!-- Score Breakdown with Contributions -->
          <div class="explanation-section">
            <h4 class="section-title">${this.t('score_breakdown')}</h4>
            <div class="breakdown-table">
              ${this.renderBreakdownTable()}
            </div>
          </div>
          
          <!-- Province Comparison -->
          ${this.provinceAverage ? this.renderProvinceComparison() : ''}
          
          <!-- Strengths -->
          <div class="explanation-section">
            <h4 class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="section-icon">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              ${this.t('strengths')}
            </h4>
            <ul class="strengths-list">
              ${this.strengths.map(strength => `
                <li class="strength-item">
                  <span class="strength-icon">✓</span>
                  <span class="strength-text">${strength}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          
          <!-- Weaknesses -->
          <div class="explanation-section">
            <h4 class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="section-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              ${this.t('weaknesses')}
            </h4>
            <ul class="weaknesses-list">
              ${this.weaknesses.map(weakness => `
                <li class="weakness-item">
                  <span class="weakness-icon">!</span>
                  <span class="weakness-text">${weakness}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        
        <div class="explanation-footer">
          <button class="btn btn-primary" id="close-explanation-btn">
            ${this.t('close')}
          </button>
        </div>
      </div>
    `;
    
    return panel;
  }
  
  /**
   * Render score breakdown table with contributions
   * @returns {string} - HTML for breakdown table
   */
  renderBreakdownTable() {
    const breakdown = this.recommendation.breakdown;
    const criteria = ['price', 'location', 'infrastructure', 'logistics'];
    
    return `
      <table class="breakdown-table-content">
        <thead>
          <tr>
            <th>${this.t('criterion')}</th>
            <th>${this.t('score')}</th>
            <th>${this.t('weight')}</th>
            <th>${this.t('contribution')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${criteria.map(criterion => {
            const data = breakdown[criterion] || { score: 0, weight: 0 };
            const score = data.score || 0;
            const weight = data.weight || 0;
            const contribution = score * weight;
            const contributionPercent = (weight * 100).toFixed(0);
            const isNegative = score < 50; // Consider scores below 50 as negative impact
            
            return `
              <tr class="${isNegative ? 'negative-impact' : ''}">
                <td class="criterion-name">
                  ${this.t(criterion)}
                  ${isNegative ? `<span class="impact-badge negative">${this.t('negative_impact')}</span>` : ''}
                </td>
                <td class="criterion-score">
                  <div class="score-bar-container">
                    <div class="score-bar" style="width: ${score}%; background-color: ${this._getScoreColor(score)}"></div>
                  </div>
                  <span class="score-text">${score.toFixed(1)}</span>
                </td>
                <td class="criterion-weight">${contributionPercent}${this.t('percent')}</td>
                <td class="criterion-contribution">
                  <strong>${contribution.toFixed(1)}</strong> ${this.t('points')}
                </td>
                <td class="criterion-icon">
                  ${isNegative 
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/></svg>'
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
                  }
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3"><strong>${this.t('score')} Total</strong></td>
            <td colspan="2"><strong>${this.recommendation.score.toFixed(1)}</strong> ${this.t('points')}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }
  
  /**
   * Render province comparison section
   * @returns {string} - HTML for province comparison
   */
  renderProvinceComparison() {
    const breakdown = this.recommendation.breakdown;
    const criteria = ['price', 'location', 'infrastructure', 'logistics'];
    
    return `
      <div class="explanation-section">
        <h4 class="section-title">${this.t('province_comparison')}</h4>
        <div class="comparison-chart">
          ${criteria.map(criterion => {
            const zoneScore = breakdown[criterion]?.score || 0;
            const avgScore = this.provinceAverage[criterion] || 50;
            const difference = zoneScore - avgScore;
            const percentDiff = avgScore > 0 ? ((difference / avgScore) * 100).toFixed(0) : 0;
            
            return `
              <div class="comparison-item">
                <div class="comparison-label">${this.t(criterion)}</div>
                <div class="comparison-bars">
                  <div class="comparison-bar-row">
                    <span class="bar-label">${this.t('this_zone')}</span>
                    <div class="bar-container">
                      <div class="bar zone-bar" style="width: ${zoneScore}%; background-color: ${this._getScoreColor(zoneScore)}"></div>
                    </div>
                    <span class="bar-value">${zoneScore.toFixed(1)}</span>
                  </div>
                  <div class="comparison-bar-row">
                    <span class="bar-label">${this.t('province_avg')}</span>
                    <div class="bar-container">
                      <div class="bar avg-bar" style="width: ${avgScore}%"></div>
                    </div>
                    <span class="bar-value">${avgScore.toFixed(1)}</span>
                  </div>
                </div>
                <div class="comparison-difference ${difference >= 0 ? 'positive' : 'negative'}">
                  ${difference >= 0 ? '▲' : '▼'} 
                  ${Math.abs(difference).toFixed(1)} ${this.t('points')} 
                  (${Math.abs(percentDiff)}${this.t('percent')} ${difference >= 0 ? this.t('higher') : this.t('lower')})
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Identify top 3 strengths from score breakdown
   * @returns {Array<string>} - Array of strength descriptions
   */
  _identifyStrengths() {
    const breakdown = this.recommendation.breakdown;
    const zone = this.recommendation.zone.properties;
    
    const scores = [
      { criterion: 'price', score: breakdown.price?.score || 0, weight: breakdown.price?.weight || 0 },
      { criterion: 'location', score: breakdown.location?.score || 0, weight: breakdown.location?.weight || 0 },
      { criterion: 'infrastructure', score: breakdown.infrastructure?.score || 0, weight: breakdown.infrastructure?.weight || 0 },
      { criterion: 'logistics', score: breakdown.logistics?.score || 0, weight: breakdown.logistics?.weight || 0 }
    ];
    
    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    
    // Take top 3
    const topScores = scores.slice(0, 3);
    
    // Generate descriptions
    return topScores.map(item => {
      const score = item.score.toFixed(1);
      const criterion = this.t(item.criterion);
      
      if (item.criterion === 'price') {
        if (item.score >= 70) {
          return this.language === 'vi' 
            ? `${criterion} cạnh tranh (${score}/100) - Giá thuê ${zone.price || 'N/A'} USD/m² thấp hơn trung bình khu vực`
            : `Competitive ${criterion} (${score}/100) - Rental price ${zone.price || 'N/A'} USD/m² below regional average`;
        }
      } else if (item.criterion === 'location') {
        if (item.score >= 70) {
          return this.language === 'vi'
            ? `${criterion} thuận lợi (${score}/100) - Nằm tại ${zone.province}, khu vực phát triển cao`
            : `Favorable ${criterion} (${score}/100) - Located in ${zone.province}, high development area`;
        }
      } else if (item.criterion === 'infrastructure') {
        if (item.score >= 70) {
          return this.language === 'vi'
            ? `${criterion} đầy đủ (${score}/100) - Diện tích ${zone.acreage || 'N/A'} ha với cơ sở hạ tầng hoàn chỉnh`
            : `Complete ${criterion} (${score}/100) - ${zone.acreage || 'N/A'} ha with full infrastructure`;
        }
      } else if (item.criterion === 'logistics') {
        if (item.score >= 70) {
          const logistics = this.recommendation.logisticsCosts;
          const nearestPort = logistics?.nearestPort?.distance?.toFixed(1) || 'N/A';
          return this.language === 'vi'
            ? `${criterion} thuận tiện (${score}/100) - Cách cảng gần nhất ${nearestPort} km`
            : `Convenient ${criterion} (${score}/100) - ${nearestPort} km to nearest port`;
        }
      }
      
      // Default description
      return this.language === 'vi'
        ? `${criterion} đạt ${score}/100 điểm`
        : `${criterion} scores ${score}/100`;
    });
  }
  
  /**
   * Identify top 3 weaknesses from score breakdown
   * @returns {Array<string>} - Array of weakness descriptions
   */
  _identifyWeaknesses() {
    const breakdown = this.recommendation.breakdown;
    const zone = this.recommendation.zone.properties;
    
    const scores = [
      { criterion: 'price', score: breakdown.price?.score || 0, weight: breakdown.price?.weight || 0 },
      { criterion: 'location', score: breakdown.location?.score || 0, weight: breakdown.location?.weight || 0 },
      { criterion: 'infrastructure', score: breakdown.infrastructure?.score || 0, weight: breakdown.infrastructure?.weight || 0 },
      { criterion: 'logistics', score: breakdown.logistics?.score || 0, weight: breakdown.logistics?.weight || 0 }
    ];
    
    // Sort by score (lowest first)
    scores.sort((a, b) => a.score - b.score);
    
    // Take bottom 3
    const bottomScores = scores.slice(0, 3);
    
    // Generate descriptions
    return bottomScores.map(item => {
      const score = item.score.toFixed(1);
      const criterion = this.t(item.criterion);
      
      if (item.criterion === 'price') {
        if (item.score < 50) {
          return this.language === 'vi'
            ? `${criterion} cao (${score}/100) - Giá thuê ${zone.price || 'N/A'} USD/m² cao hơn trung bình`
            : `High ${criterion} (${score}/100) - Rental price ${zone.price || 'N/A'} USD/m² above average`;
        }
      } else if (item.criterion === 'location') {
        if (item.score < 50) {
          return this.language === 'vi'
            ? `${criterion} xa trung tâm (${score}/100) - Cần xem xét chi phí di chuyển`
            : `Remote ${criterion} (${score}/100) - Consider transportation costs`;
        }
      } else if (item.criterion === 'infrastructure') {
        if (item.score < 50) {
          return this.language === 'vi'
            ? `${criterion} hạn chế (${score}/100) - Có thể cần đầu tư bổ sung`
            : `Limited ${criterion} (${score}/100) - May require additional investment`;
        }
      } else if (item.criterion === 'logistics') {
        if (item.score < 50) {
          const logistics = this.recommendation.logisticsCosts;
          const nearestPort = logistics?.nearestPort?.distance?.toFixed(1) || 'N/A';
          return this.language === 'vi'
            ? `${criterion} xa (${score}/100) - Cách cảng ${nearestPort} km, chi phí vận chuyển cao`
            : `Distant ${criterion} (${score}/100) - ${nearestPort} km to port, high transport costs`;
        }
      }
      
      // Default description
      return this.language === 'vi'
        ? `${criterion} đạt ${score}/100 điểm - Cần cải thiện`
        : `${criterion} scores ${score}/100 - Needs improvement`;
    });
  }
  
  /**
   * Get color for score value
   * @param {number} score - Score value (0-100)
   * @returns {string} - CSS color
   */
  _getScoreColor(score) {
    if (score >= 70) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  }
  
  /**
   * Show explanation panel
   */
  show() {
    // Remove existing panel if any
    const existing = document.getElementById('explanation-panel');
    if (existing) {
      existing.remove();
    }
    
    // Render and append to body
    const panel = this.render();
    document.body.appendChild(panel);
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Animate in
    requestAnimationFrame(() => {
      panel.classList.add('show');
    });
  }
  
  /**
   * Hide explanation panel
   */
  hide() {
    const panel = document.getElementById('explanation-panel');
    if (panel) {
      panel.classList.remove('show');
      setTimeout(() => panel.remove(), 300);
    }
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button in header
    const closeBtn = document.getElementById('close-explanation');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // Close button in footer
    const closeFooterBtn = document.getElementById('close-explanation-btn');
    if (closeFooterBtn) {
      closeFooterBtn.addEventListener('click', () => this.hide());
    }
    
    // Close on backdrop click
    const panel = document.getElementById('explanation-panel');
    if (panel) {
      panel.addEventListener('click', (e) => {
        if (e.target === panel) {
          this.hide();
        }
      });
    }
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
  
  /**
   * Update language
   * @param {string} language - Language code ('vi' or 'en')
   */
  setLanguage(language) {
    this.language = language;
    
    // Re-render if panel is visible
    const panel = document.getElementById('explanation-panel');
    if (panel) {
      this.show();
    }
  }
}
