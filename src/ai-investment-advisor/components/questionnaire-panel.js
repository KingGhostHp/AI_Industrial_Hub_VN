/**
 * Questionnaire Panel Component
 * 
 * Guided 8-question interface to collect user investment criteria.
 * Integrates with UserPreferences model for data persistence.
 * 
 * Requirements: 9.1, 9.2, 9.7, 16.3
 */

import { UserPreferences } from '../models/user-preferences.js';

export class QuestionnairePanel {
  /**
   * Initialize questionnaire panel
   * @param {Function} onComplete - Callback with user criteria when submitted
   */
  constructor(onComplete, onCancel) {
    this.onComplete = onComplete;
    this.onCancel = onCancel;
    this.currentStep = 0;
    this.totalSteps = 8;
    this.preferences = UserPreferences.load();
    this.errors = {};
    
    // Vietnamese translations (default language)
    this.translations = {
      vi: {
        title: 'Tư Vấn Đầu Tư AI',
        subtitle: 'Trả lời 8 câu hỏi để nhận gợi ý khu công nghiệp phù hợp',
        step: 'Bước',
        of: 'của',
        next: 'Tiếp theo',
        previous: 'Quay lại',
        submit: 'Gửi',
        
        // Step 1: Industry Type
        step1_title: 'Loại hình công nghiệp',
        step1_subtitle: 'Chọn ngành nghề kinh doanh của bạn',
        industry_manufacturing: 'Sản xuất chế tạo',
        industry_logistics: 'Logistics & Phân phối',
        industry_technology: 'Công nghệ & Đổi mới',
        industry_food_processing: 'Chế biến thực phẩm',
        industry_textiles: 'Dệt may & May mặc',
        industry_electronics: 'Điện tử & Linh kiện',
        
        // Step 2: Budget Range
        step2_title: 'Ngân sách thuê đất',
        step2_subtitle: 'Nhập khoảng giá thuê mong muốn (USD/m²/kỳ)',
        budget_min: 'Giá tối thiểu',
        budget_max: 'Giá tối đa',
        budget_placeholder: 'Ví dụ: 50',
        
        // Step 3: Preferred Provinces
        step3_title: 'Tỉnh thành ưu tiên',
        step3_subtitle: 'Chọn các tỉnh thành bạn quan tâm (không bắt buộc)',
        select_provinces: 'Chọn tỉnh thành...',
        all_provinces: 'Tất cả các tỉnh',
        
        // Step 4: Required Infrastructure
        step4_title: 'Cơ sở hạ tầng yêu cầu',
        step4_subtitle: 'Chọn các tiện ích cần thiết (không bắt buộc)',
        infra_electricity: 'Điện lực',
        infra_water: 'Cấp nước',
        infra_waste_treatment: 'Xử lý chất thải',
        infra_road_access: 'Đường giao thông',
        infra_highway_access: 'Cao tốc',
        infra_warehouse: 'Kho bãi',
        infra_internet: 'Internet tốc độ cao',
        infra_office: 'Văn phòng',
        infra_cold_storage: 'Kho lạnh',
        infra_clean_room: 'Phòng sạch',
        
        // Step 5: Logistics Priorities
        step5_title: 'Ưu tiên logistics',
        step5_subtitle: 'Xếp hạng tầm quan trọng của các yếu tố',
        logistics_port: 'Cảng biển',
        logistics_airport: 'Sân bay',
        logistics_city: 'Trung tâm thành phố',
        logistics_highway: 'Cao tốc',
        priority_high: 'Cao',
        priority_medium: 'Trung bình',
        priority_low: 'Thấp',
        
        // Step 6: Custom Weights
        step6_title: 'Tùy chỉnh trọng số',
        step6_subtitle: 'Điều chỉnh mức độ quan trọng của từng tiêu chí (không bắt buộc)',
        weight_price: 'Giá thuê',
        weight_location: 'Vị trí',
        weight_infrastructure: 'Cơ sở hạ tầng',
        weight_logistics: 'Logistics',
        weight_note: 'Tổng trọng số sẽ được chuẩn hóa về 1.0',
        
        // Step 7: Additional Requirements
        step7_title: 'Yêu cầu bổ sung',
        step7_subtitle: 'Mô tả các yêu cầu đặc biệt khác (không bắt buộc)',
        additional_placeholder: 'Ví dụ: Gần nguồn nguyên liệu, có chính sách ưu đãi thuế...',
        
        // Step 8: Review & Submit
        step8_title: 'Xem lại & Gửi',
        step8_subtitle: 'Kiểm tra thông tin trước khi gửi',
        review_industry: 'Ngành nghề',
        review_budget: 'Ngân sách',
        review_provinces: 'Tỉnh thành',
        review_infrastructure: 'Cơ sở hạ tầng',
        review_logistics: 'Ưu tiên logistics',
        review_weights: 'Trọng số',
        review_additional: 'Yêu cầu khác',
        
        // Validation errors
        error_required: 'Trường này là bắt buộc',
        error_budget_invalid: 'Giá tối thiểu phải nhỏ hơn giá tối đa',
        error_budget_negative: 'Giá không được âm',
        error_weight_range: 'Trọng số phải từ 0.0 đến 1.0',
      }
    };
    
    this.currentLanguage = this.preferences.language || 'vi';
  }
  
  /**
   * Get translated text
   * @param {String} key - Translation key
   * @returns {String} - Translated text
   */
  t(key) {
    return this.translations[this.currentLanguage][key] || key;
  }
  
  /**
   * Show questionnaire panel
   */
  show() {
    this.render();
    this.attachEventListeners();
  }
  
  /**
   * Hide questionnaire panel
   * @param {Boolean} isCompletion - True if hiding after successful submission
   */
  hide(isCompletion = false) {
    const panel = document.getElementById('ai-questionnaire-panel');
    if (panel) {
      panel.remove();
      
      // If we are cancelling (not completing), show welcome screen again
      if (!isCompletion && typeof this.onCancel === 'function') {
        this.onCancel();
      }
    }
  }
  
  /**
   * Get current step index
   * @returns {Number} - Current step (0-7)
   */
  getCurrentStep() {
    return this.currentStep;
  }
  
  /**
   * Validate current step
   * @returns {Boolean} - True if valid
   */
  validateStep() {
    this.errors = {};
    
    switch (this.currentStep) {
      case 0: // Industry Type
        if (!this.preferences.industryProfile) {
          this.errors.industry = this.t('error_required');
          return false;
        }
        break;
        
      case 1: // Budget Range
        const min = parseFloat(document.getElementById('budget-min')?.value || 0);
        const max = parseFloat(document.getElementById('budget-max')?.value || 1000);
        
        if (min < 0 || max < 0) {
          this.errors.budget = this.t('error_budget_negative');
          return false;
        }
        
        if (min >= max) {
          this.errors.budget = this.t('error_budget_invalid');
          return false;
        }
        
        this.preferences.budgetRange = { min, max };
        break;
        
      case 5: // Custom Weights
        const weights = {
          price: parseFloat(document.getElementById('weight-price')?.value || 0.25),
          location: parseFloat(document.getElementById('weight-location')?.value || 0.25),
          infrastructure: parseFloat(document.getElementById('weight-infrastructure')?.value || 0.25),
          logistics: parseFloat(document.getElementById('weight-logistics')?.value || 0.25)
        };
        
        // Validate range 0.0 to 1.0
        for (const [key, value] of Object.entries(weights)) {
          if (value < 0 || value > 1.0) {
            this.errors.weights = this.t('error_weight_range');
            return false;
          }
        }
        
        this.preferences.criteriaWeights = weights;
        break;
    }
    
    return true;
  }
  
  /**
   * Navigate to next step
   */
  nextStep() {
    if (!this.validateStep()) {
      this.renderErrors();
      return;
    }
    
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.render();
      this.attachEventListeners();
    }
  }
  
  /**
   * Navigate to previous step
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
      this.attachEventListeners();
    } else {
      this.hide();
    }
  }
  
  /**
   * Submit questionnaire
   * @returns {Object} - User criteria
   */
  submit() {
    if (!this.validateStep()) {
      this.renderErrors();
      return null;
    }
    
    // Save preferences
    this.preferences.save();
    
    // Call completion callback
    if (this.onComplete) {
      this.onComplete(this.preferences);
    }
    
    // Hide panel
    this.hide(true);
    
    return this.preferences;
  }
  
  /**
   * Render questionnaire panel
   */
  render() {
    const existingPanel = document.getElementById('ai-questionnaire-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'ai-questionnaire-panel';
    panel.className = 'questionnaire-panel';
    
    panel.innerHTML = `
      <div class="questionnaire-content">
        <div class="questionnaire-header">
          <h2 class="questionnaire-title">${this.t('title')}</h2>
          <p class="questionnaire-subtitle">${this.t('subtitle')}</p>
          <button class="questionnaire-close-btn" id="close-questionnaire" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
        
        <div class="questionnaire-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.currentStep + 1) / this.totalSteps) * 100}%"></div>
          </div>
          <p class="progress-text">${this.t('step')} ${this.currentStep + 1} ${this.t('of')} ${this.totalSteps}</p>
        </div>
        
        <div class="questionnaire-body">
          ${this.renderStep()}
        </div>
        
        <div class="questionnaire-footer">
          <button 
            class="btn btn-secondary" 
            id="prev-step"
          >
            ${this.t('previous')}
          </button>
          
          ${this.currentStep < this.totalSteps - 1 
            ? `<button class="btn btn-primary" id="next-step">${this.t('next')}</button>`
            : `<button class="btn btn-primary" id="submit-questionnaire">${this.t('submit')}</button>`
          }
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
  }
  
  /**
   * Render current step content
   * @returns {String} - HTML for current step
   */
  renderStep() {
    switch (this.currentStep) {
      case 0:
        return this.renderStep1();
      case 1:
        return this.renderStep2();
      case 2:
        return this.renderStep3();
      case 3:
        return this.renderStep4();
      case 4:
        return this.renderStep5();
      case 5:
        return this.renderStep6();
      case 6:
        return this.renderStep7();
      case 7:
        return this.renderStep8();
      default:
        return '';
    }
  }
  
  /**
   * Step 1: Industry Type
   */
  renderStep1() {
    const industries = [
      { value: 'manufacturing', label: this.t('industry_manufacturing') },
      { value: 'logistics', label: this.t('industry_logistics') },
      { value: 'technology', label: this.t('industry_technology') },
      { value: 'food_processing', label: this.t('industry_food_processing') },
      { value: 'textiles', label: this.t('industry_textiles') },
      { value: 'electronics', label: this.t('industry_electronics') }
    ];
    
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step1_title')}</h3>
        <p class="step-subtitle">${this.t('step1_subtitle')}</p>
        
        <div class="industry-grid">
          ${industries.map(industry => `
            <label class="industry-card ${this.preferences.industryProfile === industry.value ? 'selected' : ''}">
              <input 
                type="radio" 
                name="industry" 
                value="${industry.value}"
                ${this.preferences.industryProfile === industry.value ? 'checked' : ''}
              />
              <span class="industry-label">${industry.label}</span>
            </label>
          `).join('')}
        </div>
        
        ${this.errors.industry ? `<p class="error-message">${this.errors.industry}</p>` : ''}
      </div>
    `;
  }
  
  /**
   * Step 2: Budget Range
   */
  renderStep2() {
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step2_title')}</h3>
        <p class="step-subtitle">${this.t('step2_subtitle')}</p>
        
        <div class="budget-inputs">
          <div class="input-group">
            <label for="budget-min">${this.t('budget_min')}</label>
            <input 
              type="number" 
              id="budget-min" 
              min="0" 
              step="10"
              value="${this.preferences.budgetRange.min}"
              placeholder="${this.t('budget_placeholder')}"
            />
          </div>
          
          <div class="input-group">
            <label for="budget-max">${this.t('budget_max')}</label>
            <input 
              type="number" 
              id="budget-max" 
              min="0" 
              step="10"
              value="${this.preferences.budgetRange.max}"
              placeholder="${this.t('budget_placeholder')}"
            />
          </div>
        </div>
        
        ${this.errors.budget ? `<p class="error-message">${this.errors.budget}</p>` : ''}
      </div>
    `;
  }
  
  /**
   * Step 3: Preferred Provinces
   */
  renderStep3() {
    const provinces = [
      'TP Hà Nội', 'TP Huế', 'Quảng Ninh', 'Cao Bằng', 'Lạng Sơn', 'Lai Châu',
      'Điện Biên', 'Sơn La', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Tuyên Quang',
      'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên', 'TP Hải Phòng',
      'Ninh Bình', 'Quảng Trị', 'TP Đà Nẵng', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa',
      'Lâm Đồng', 'Đắk Lắk', 'TPHCM', 'Đồng Nai', 'Tây Ninh', 'TP Cần Thơ',
      'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang'
    ];
    
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step3_title')}</h3>
        <p class="step-subtitle">${this.t('step3_subtitle')}</p>
        
        <div class="province-select">
          <select id="province-select" multiple size="10">
            <option value="" ${this.preferences.preferredProvinces.length === 0 ? 'selected' : ''}>
              ${this.t('all_provinces')}
            </option>
            ${provinces.map(province => `
              <option 
                value="${province}"
                ${this.preferences.preferredProvinces.includes(province) ? 'selected' : ''}
              >
                ${province}
              </option>
            `).join('')}
          </select>
          <p class="help-text">Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều tỉnh</p>
        </div>
      </div>
    `;
  }
  
  /**
   * Step 4: Required Infrastructure
   */
  renderStep4() {
    const infrastructure = [
      { value: 'electricity', label: this.t('infra_electricity') },
      { value: 'water', label: this.t('infra_water') },
      { value: 'waste_treatment', label: this.t('infra_waste_treatment') },
      { value: 'road_access', label: this.t('infra_road_access') },
      { value: 'highway_access', label: this.t('infra_highway_access') },
      { value: 'warehouse_facilities', label: this.t('infra_warehouse') },
      { value: 'high_speed_internet', label: this.t('infra_internet') },
      { value: 'office_facilities', label: this.t('infra_office') },
      { value: 'cold_storage', label: this.t('infra_cold_storage') },
      { value: 'clean_room_facilities', label: this.t('infra_clean_room') }
    ];
    
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step4_title')}</h3>
        <p class="step-subtitle">${this.t('step4_subtitle')}</p>
        
        <div class="infrastructure-grid">
          ${infrastructure.map(infra => `
            <label class="checkbox-card">
              <input 
                type="checkbox" 
                name="infrastructure" 
                value="${infra.value}"
                ${this.preferences.requiredInfrastructure.includes(infra.value) ? 'checked' : ''}
              />
              <span class="checkbox-label">${infra.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Step 5: Logistics Priorities
   */
  renderStep5() {
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step5_title')}</h3>
        <p class="step-subtitle">${this.t('step5_subtitle')}</p>
        
        <div class="logistics-priorities">
          <div class="priority-item">
            <label>${this.t('logistics_port')}</label>
            <select id="priority-port">
              <option value="high">${this.t('priority_high')}</option>
              <option value="medium" selected>${this.t('priority_medium')}</option>
              <option value="low">${this.t('priority_low')}</option>
            </select>
          </div>
          
          <div class="priority-item">
            <label>${this.t('logistics_airport')}</label>
            <select id="priority-airport">
              <option value="high">${this.t('priority_high')}</option>
              <option value="medium" selected>${this.t('priority_medium')}</option>
              <option value="low">${this.t('priority_low')}</option>
            </select>
          </div>
          
          <div class="priority-item">
            <label>${this.t('logistics_city')}</label>
            <select id="priority-city">
              <option value="high">${this.t('priority_high')}</option>
              <option value="medium" selected>${this.t('priority_medium')}</option>
              <option value="low">${this.t('priority_low')}</option>
            </select>
          </div>
          
          <div class="priority-item">
            <label>${this.t('logistics_highway')}</label>
            <select id="priority-highway">
              <option value="high">${this.t('priority_high')}</option>
              <option value="medium" selected>${this.t('priority_medium')}</option>
              <option value="low">${this.t('priority_low')}</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Step 6: Custom Weights
   */
  renderStep6() {
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step6_title')}</h3>
        <p class="step-subtitle">${this.t('step6_subtitle')}</p>
        
        <div class="weight-inputs">
          <div class="weight-item">
            <label for="weight-price">${this.t('weight_price')}</label>
            <input 
              type="number" 
              id="weight-price" 
              min="0" 
              max="1" 
              step="0.05"
              value="${this.preferences.criteriaWeights.price}"
            />
          </div>
          
          <div class="weight-item">
            <label for="weight-location">${this.t('weight_location')}</label>
            <input 
              type="number" 
              id="weight-location" 
              min="0" 
              max="1" 
              step="0.05"
              value="${this.preferences.criteriaWeights.location}"
            />
          </div>
          
          <div class="weight-item">
            <label for="weight-infrastructure">${this.t('weight_infrastructure')}</label>
            <input 
              type="number" 
              id="weight-infrastructure" 
              min="0" 
              max="1" 
              step="0.05"
              value="${this.preferences.criteriaWeights.infrastructure}"
            />
          </div>
          
          <div class="weight-item">
            <label for="weight-logistics">${this.t('weight_logistics')}</label>
            <input 
              type="number" 
              id="weight-logistics" 
              min="0" 
              max="1" 
              step="0.05"
              value="${this.preferences.criteriaWeights.logistics}"
            />
          </div>
        </div>
        
        <p class="help-text">${this.t('weight_note')}</p>
        ${this.errors.weights ? `<p class="error-message">${this.errors.weights}</p>` : ''}
      </div>
    `;
  }
  
  /**
   * Step 7: Additional Requirements
   */
  renderStep7() {
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step7_title')}</h3>
        <p class="step-subtitle">${this.t('step7_subtitle')}</p>
        
        <textarea 
          id="additional-requirements" 
          rows="6"
          placeholder="${this.t('additional_placeholder')}"
        >${this.preferences.additionalRequirements || ''}</textarea>
      </div>
    `;
  }
  
  /**
   * Step 8: Review & Submit
   */
  renderStep8() {
    return `
      <div class="step-content">
        <h3 class="step-title">${this.t('step8_title')}</h3>
        <p class="step-subtitle">${this.t('step8_subtitle')}</p>
        
        <div class="review-summary">
          <div class="review-item">
            <strong>${this.t('review_industry')}:</strong>
            <span>${this.t('industry_' + this.preferences.industryProfile)}</span>
          </div>
          
          <div class="review-item">
            <strong>${this.t('review_budget')}:</strong>
            <span>${this.preferences.budgetRange.min} - ${this.preferences.budgetRange.max} USD/m²</span>
          </div>
          
          <div class="review-item">
            <strong>${this.t('review_provinces')}:</strong>
            <span>${this.preferences.preferredProvinces.length > 0 
              ? this.preferences.preferredProvinces.join(', ') 
              : this.t('all_provinces')}</span>
          </div>
          
          <div class="review-item">
            <strong>${this.t('review_infrastructure')}:</strong>
            <span>${this.preferences.requiredInfrastructure.length > 0 
              ? this.preferences.requiredInfrastructure.join(', ') 
              : 'Không yêu cầu'}</span>
          </div>
          
          <div class="review-item">
            <strong>${this.t('review_weights')}:</strong>
            <span>
              ${this.t('weight_price')}: ${this.preferences.criteriaWeights.price}, 
              ${this.t('weight_location')}: ${this.preferences.criteriaWeights.location}, 
              ${this.t('weight_infrastructure')}: ${this.preferences.criteriaWeights.infrastructure}, 
              ${this.t('weight_logistics')}: ${this.preferences.criteriaWeights.logistics}
            </span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render validation errors
   */
  renderErrors() {
    // Re-render current step with errors
    this.render();
    this.attachEventListeners();
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('close-questionnaire');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // Navigation buttons
    const prevBtn = document.getElementById('prev-step');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }
    
    const nextBtn = document.getElementById('next-step');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    
    const submitBtn = document.getElementById('submit-questionnaire');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submit());
    }
    
    // Step-specific event listeners
    this.attachStepListeners();
  }
  
  /**
   * Attach step-specific event listeners
   */
  attachStepListeners() {
    switch (this.currentStep) {
      case 0: // Industry Type
        const industryInputs = document.querySelectorAll('input[name="industry"]');
        industryInputs.forEach(input => {
          input.addEventListener('change', (e) => {
            this.preferences.industryProfile = e.target.value;
            // Update visual selection
            document.querySelectorAll('.industry-card').forEach(card => {
              card.classList.remove('selected');
            });
            e.target.closest('.industry-card').classList.add('selected');
          });
        });
        break;
        
      case 2: // Preferred Provinces
        const provinceSelect = document.getElementById('province-select');
        if (provinceSelect) {
          provinceSelect.addEventListener('change', (e) => {
            const selected = Array.from(e.target.selectedOptions)
              .map(option => option.value)
              .filter(value => value !== '');
            this.preferences.preferredProvinces = selected;
          });
        }
        break;
        
      case 3: // Required Infrastructure
        const infraInputs = document.querySelectorAll('input[name="infrastructure"]');
        infraInputs.forEach(input => {
          input.addEventListener('change', () => {
            const selected = Array.from(document.querySelectorAll('input[name="infrastructure"]:checked'))
              .map(input => input.value);
            this.preferences.requiredInfrastructure = selected;
          });
        });
        break;
        
      case 6: // Additional Requirements
        const additionalTextarea = document.getElementById('additional-requirements');
        if (additionalTextarea) {
          additionalTextarea.addEventListener('input', (e) => {
            this.preferences.additionalRequirements = e.target.value;
          });
        }
        break;
    }
  }
}
