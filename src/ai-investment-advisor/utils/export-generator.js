/**
 * Export Generator Utility
 * 
 * Provides PDF and CSV export functionality for comparison reports.
 * Includes map snapshots in PDF exports and proper formatting.
 * 
 * Requirements: 10.5, 10.6, 10.7
 */

import { jsPDF } from 'jspdf';

/**
 * ExportGenerator class
 * 
 * Handles export of comparison reports to PDF and CSV formats.
 * Supports Vietnamese and English languages.
 */
export class ExportGenerator {
  /**
   * Initialize ExportGenerator
   * @param {Object} options - Configuration options
   * @param {string} [options.language='vi'] - Display language ('vi' or 'en')
   * @param {Object} [options.mapInstance=null] - Mapbox GL JS map instance for snapshots
   */
  constructor(options = {}) {
    this.language = options.language || 'vi';
    this.mapInstance = options.mapInstance || null;
    
    // Translations
    this.translations = {
      vi: {
        title: 'Báo Cáo So Sánh Khu Công Nghiệp',
        generated_date: 'Ngày tạo',
        page: 'Trang',
        zone_comparison: 'So Sánh {count} Khu Công Nghiệp',
        
        // Basic info
        zone_name: 'Tên khu',
        location: 'Vị trí',
        province: 'Tỉnh/Thành',
        district: 'Quận/Huyện',
        price: 'Giá thuê',
        acreage: 'Diện tích',
        overall_score: 'Điểm tổng',
        rank: 'Xếp hạng',
        
        // Criteria scores
        criteria_scores: 'Điểm Tiêu Chí',
        price_score: 'Điểm giá',
        location_score: 'Điểm vị trí',
        infrastructure_score: 'Điểm hạ tầng',
        logistics_score: 'Điểm logistics',
        weight: 'Trọng số',
        
        // Logistics
        logistics_info: 'Thông Tin Logistics',
        nearest_port: 'Cảng gần nhất',
        nearest_airport: 'Sân bay gần nhất',
        nearest_city: 'Thành phố gần nhất',
        distance: 'Khoảng cách',
        cost: 'Chi phí',
        
        // Growth & Forecast
        growth_potential: 'Tiềm năng tăng trưởng',
        rental_forecast: 'Dự báo giá thuê',
        current_price: 'Giá hiện tại',
        forecast_1yr: 'Dự báo 1 năm',
        forecast_2yr: 'Dự báo 2 năm',
        
        // Units
        usd_per_sqm: 'USD/m²/kỳ',
        hectares: 'ha',
        km: 'km',
        vnd: 'VND',
        points: 'điểm',
        
        // Best indicators
        best: 'Tốt nhất',
        
        // Map
        map_overview: 'Bản Đồ Tổng Quan',
        zone_locations: 'Vị trí các khu công nghiệp',
        
        // Summary
        summary: 'Tóm Tắt',
        recommendation: 'Khuyến Nghị',
        best_overall: 'Tốt nhất tổng thể',
        best_price: 'Giá tốt nhất',
        best_location: 'Vị trí tốt nhất',
        best_logistics: 'Logistics tốt nhất',
        highest_growth: 'Tăng trưởng cao nhất'
      },
      en: {
        title: 'Industrial Zone Comparison Report',
        generated_date: 'Generated',
        page: 'Page',
        zone_comparison: 'Comparison of {count} Industrial Zones',
        
        // Basic info
        zone_name: 'Zone Name',
        location: 'Location',
        province: 'Province/City',
        district: 'District',
        price: 'Rental Price',
        acreage: 'Acreage',
        overall_score: 'Overall Score',
        rank: 'Rank',
        
        // Criteria scores
        criteria_scores: 'Criteria Scores',
        price_score: 'Price Score',
        location_score: 'Location Score',
        infrastructure_score: 'Infrastructure Score',
        logistics_score: 'Logistics Score',
        weight: 'Weight',
        
        // Logistics
        logistics_info: 'Logistics Information',
        nearest_port: 'Nearest Port',
        nearest_airport: 'Nearest Airport',
        nearest_city: 'Nearest City',
        distance: 'Distance',
        cost: 'Cost',
        
        // Growth & Forecast
        growth_potential: 'Growth Potential',
        rental_forecast: 'Rental Forecast',
        current_price: 'Current Price',
        forecast_1yr: '1-Year Forecast',
        forecast_2yr: '2-Year Forecast',
        
        // Units
        usd_per_sqm: 'USD/m²/term',
        hectares: 'ha',
        km: 'km',
        vnd: 'VND',
        points: 'points',
        
        // Best indicators
        best: 'Best',
        
        // Map
        map_overview: 'Map Overview',
        zone_locations: 'Zone Locations',
        
        // Summary
        summary: 'Summary',
        recommendation: 'Recommendation',
        best_overall: 'Best Overall',
        best_price: 'Best Price',
        best_location: 'Best Location',
        best_logistics: 'Best Logistics',
        highest_growth: 'Highest Growth'
      }
    };
  }
  
  /**
   * Get translated text
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} - Translated text
   */
  t(key, params = {}) {
    let text = this.translations[this.language][key] || key;
    
    // Simple interpolation
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }
  
  /**
   * Export comparison report to PDF
   * 
   * Generates a formatted PDF report with:
   * - Cover page with title and date
   * - Map snapshot (if map instance provided)
   * - Detailed comparison table
   * - Summary and recommendations
   * 
   * @param {Array<Object>} recommendations - Array of Recommendation instances (max 5)
   * @param {Object} options - Export options
   * @param {boolean} [options.includeMap=true] - Include map snapshot
   * @param {string} [options.filename] - Custom filename (default: auto-generated)
   * @returns {Promise<void>} - Resolves when PDF is generated and downloaded
   * 
   * @example
   * const generator = new ExportGenerator({ language: 'vi', mapInstance: map });
   * await generator.exportComparisonToPDF(recommendations, { includeMap: true });
   */
  async exportComparisonToPDF(recommendations, options = {}) {
    try {
      const includeMap = options.includeMap !== false;
      const filename = options.filename || `zone-comparison-${Date.now()}.pdf`;
      
      // Create PDF document (A4 size)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      
      let yPosition = margin;
      
      // === COVER PAGE ===
      this._addCoverPage(doc, recommendations, margin, pageWidth, pageHeight);
      
      // === MAP SNAPSHOT PAGE ===
      if (includeMap && this.mapInstance) {
        doc.addPage();
        yPosition = margin;
        await this._addMapSnapshot(doc, recommendations, margin, contentWidth, yPosition);
      }
      
      // === COMPARISON DETAILS ===
      doc.addPage();
      yPosition = margin;
      yPosition = this._addComparisonDetails(doc, recommendations, margin, contentWidth, yPosition, pageHeight);
      
      // === SUMMARY PAGE ===
      doc.addPage();
      yPosition = margin;
      this._addSummaryPage(doc, recommendations, margin, contentWidth, yPosition);
      
      // Add page numbers
      this._addPageNumbers(doc);
      
      // Save PDF
      doc.save(filename);
      
      return Promise.resolve();
    } catch (error) {
      console.error('[ExportGenerator] Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
  
  /**
   * Add cover page to PDF
   * @private
   */
  _addCoverPage(doc, recommendations, margin, pageWidth, pageHeight) {
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const title = this.t('title');
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, pageHeight / 3);
    
    // Subtitle
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    const subtitle = this.t('zone_comparison', { count: recommendations.length });
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, pageHeight / 3 + 15);
    
    // Date
    doc.setFontSize(12);
    const dateStr = `${this.t('generated_date')}: ${new Date().toLocaleDateString(this.language === 'vi' ? 'vi-VN' : 'en-US')}`;
    const dateWidth = doc.getTextWidth(dateStr);
    doc.text(dateStr, (pageWidth - dateWidth) / 2, pageHeight / 3 + 30);
    
    // Zone list
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let listY = pageHeight / 2;
    
    recommendations.forEach((rec, index) => {
      const zoneName = rec.zone.properties.name || 'N/A';
      const zoneText = `${index + 1}. ${this._truncateText(zoneName, 60)}`;
      doc.text(zoneText, margin, listY);
      listY += 7;
    });
  }
  
  /**
   * Add map snapshot to PDF
   * @private
   */
  async _addMapSnapshot(doc, recommendations, margin, contentWidth, yPosition) {
    try {
      // Section title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(this.t('map_overview'), margin, yPosition);
      yPosition += 10;
      
      // Get map canvas
      const mapCanvas = this.mapInstance.getCanvas();
      
      // Convert canvas to image data
      const imgData = mapCanvas.toDataURL('image/png');
      
      // Calculate dimensions to fit page
      const imgWidth = contentWidth;
      const imgHeight = (mapCanvas.height / mapCanvas.width) * imgWidth;
      
      // Add image to PDF
      doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, 180));
      
      // Add caption
      yPosition += Math.min(imgHeight, 180) + 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(this.t('zone_locations'), margin, yPosition);
      
    } catch (error) {
      console.error('[ExportGenerator] Error adding map snapshot:', error);
      // Continue without map snapshot
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Map snapshot unavailable', margin, yPosition);
    }
  }
  
  /**
   * Add comparison details to PDF
   * @private
   */
  _addComparisonDetails(doc, recommendations, margin, contentWidth, yPosition, pageHeight) {
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.t('zone_comparison', { count: recommendations.length }), margin, yPosition);
    yPosition += 10;
    
    // For each zone, add detailed information
    recommendations.forEach((rec, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Zone header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const zoneHeader = `${this.t('rank')} #${rec.rank || index + 1}: ${this._truncateText(rec.zone.properties.name || 'N/A', 50)}`;
      doc.text(zoneHeader, margin, yPosition);
      yPosition += 8;
      
      // Basic information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const basicInfo = [
        `${this.t('province')}: ${rec.zone.properties.province || 'N/A'}`,
        `${this.t('district')}: ${rec.zone.properties.district || 'N/A'}`,
        `${this.t('price')}: ${this._formatPrice(rec.zone.properties.price)} ${this.t('usd_per_sqm')}`,
        `${this.t('acreage')}: ${this._formatNumber(rec.zone.properties.acreage)} ${this.t('hectares')}`,
        `${this.t('overall_score')}: ${rec.score.toFixed(1)} ${this.t('points')}`
      ];
      
      basicInfo.forEach(info => {
        doc.text(info, margin + 5, yPosition);
        yPosition += 5;
      });
      
      yPosition += 3;
      
      // Criteria scores
      doc.setFont('helvetica', 'bold');
      doc.text(this.t('criteria_scores'), margin + 5, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      
      const criteriaInfo = [
        `${this.t('price_score')}: ${(rec.breakdown.price?.score || 0).toFixed(1)} (${this.t('weight')}: ${(rec.breakdown.price?.weight || 0).toFixed(2)})`,
        `${this.t('location_score')}: ${(rec.breakdown.location?.score || 0).toFixed(1)} (${this.t('weight')}: ${(rec.breakdown.location?.weight || 0).toFixed(2)})`,
        `${this.t('infrastructure_score')}: ${(rec.breakdown.infrastructure?.score || 0).toFixed(1)} (${this.t('weight')}: ${(rec.breakdown.infrastructure?.weight || 0).toFixed(2)})`,
        `${this.t('logistics_score')}: ${(rec.breakdown.logistics?.score || 0).toFixed(1)} (${this.t('weight')}: ${(rec.breakdown.logistics?.weight || 0).toFixed(2)})`
      ];
      
      criteriaInfo.forEach(info => {
        doc.text(info, margin + 10, yPosition);
        yPosition += 5;
      });
      
      yPosition += 3;
      
      // Logistics information
      doc.setFont('helvetica', 'bold');
      doc.text(this.t('logistics_info'), margin + 5, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      
      const logisticsInfo = [
        `${this.t('nearest_port')}: ${rec.logisticsCosts.nearestPort?.name || 'N/A'} (${this._formatNumber(rec.logisticsCosts.nearestPort?.distance || 0)} ${this.t('km')})`,
        `${this.t('nearest_airport')}: ${rec.logisticsCosts.nearestAirport?.name || 'N/A'} (${this._formatNumber(rec.logisticsCosts.nearestAirport?.distance || 0)} ${this.t('km')})`,
        `${this.t('nearest_city')}: ${rec.logisticsCosts.nearestCity?.name || 'N/A'} (${this._formatNumber(rec.logisticsCosts.nearestCity?.distance || 0)} ${this.t('km')})`
      ];
      
      logisticsInfo.forEach(info => {
        doc.text(info, margin + 10, yPosition);
        yPosition += 5;
      });
      
      yPosition += 3;
      
      // Growth potential
      doc.setFont('helvetica', 'bold');
      doc.text(`${this.t('growth_potential')}: ${(rec.growthPotential || 0).toFixed(0)}/100`, margin + 5, yPosition);
      yPosition += 8;
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, margin + contentWidth, yPosition);
      yPosition += 8;
    });
    
    return yPosition;
  }
  
  /**
   * Add summary page to PDF
   * @private
   */
  _addSummaryPage(doc, recommendations, margin, contentWidth, yPosition) {
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.t('summary'), margin, yPosition);
    yPosition += 10;
    
    // Find best zones for each criterion
    const bestOverall = this._findBestByScore(recommendations, 'score');
    const bestPrice = this._findBestByPrice(recommendations);
    const bestLocation = this._findBestByScore(recommendations, 'location');
    const bestLogistics = this._findBestByScore(recommendations, 'logistics');
    const bestGrowth = this._findBestByScore(recommendations, 'growth');
    
    // Summary items
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(this.t('recommendation'), margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryItems = [
      { label: this.t('best_overall'), zone: bestOverall },
      { label: this.t('best_price'), zone: bestPrice },
      { label: this.t('best_location'), zone: bestLocation },
      { label: this.t('best_logistics'), zone: bestLogistics },
      { label: this.t('highest_growth'), zone: bestGrowth }
    ];
    
    summaryItems.forEach(item => {
      if (item.zone) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.label}:`, margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(this._truncateText(item.zone.zone.properties.name || 'N/A', 50), margin + 50, yPosition);
        yPosition += 7;
      }
    });
  }
  
  /**
   * Add page numbers to all pages
   * @private
   */
  _addPageNumbers(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageText = `${this.t('page')} ${i} / ${pageCount}`;
      const textWidth = doc.getTextWidth(pageText);
      doc.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 10);
    }
  }
  
  /**
   * Export recommendations to CSV
   * 
   * Generates a CSV file with all recommendation data including:
   * - Basic zone information
   * - Criteria scores and weights
   * - Logistics costs
   * - Growth potential
   * 
   * @param {Array<Object>} recommendations - Array of Recommendation instances
   * @param {Object} options - Export options
   * @param {string} [options.filename] - Custom filename (default: auto-generated)
   * @returns {void}
   * 
   * @example
   * const generator = new ExportGenerator({ language: 'vi' });
   * generator.exportRecommendationsToCSV(recommendations);
   */
  exportRecommendationsToCSV(recommendations, options = {}) {
    try {
      const filename = options.filename || `zone-recommendations-${Date.now()}.csv`;
      
      const rows = [];
      
      // Header row
      const headers = [
        this.t('rank'),
        this.t('zone_name'),
        this.t('province'),
        this.t('district'),
        this.t('price') + ' (' + this.t('usd_per_sqm') + ')',
        this.t('acreage') + ' (' + this.t('hectares') + ')',
        this.t('overall_score'),
        this.t('price_score'),
        this.t('location_score'),
        this.t('infrastructure_score'),
        this.t('logistics_score'),
        this.t('growth_potential'),
        this.t('nearest_port'),
        this.t('distance') + ' ' + this.t('nearest_port') + ' (' + this.t('km') + ')',
        this.t('nearest_airport'),
        this.t('distance') + ' ' + this.t('nearest_airport') + ' (' + this.t('km') + ')',
        this.t('nearest_city'),
        this.t('distance') + ' ' + this.t('nearest_city') + ' (' + this.t('km') + ')'
      ];
      
      rows.push(headers.map(h => this._escapeCSV(h)).join(','));
      
      // Data rows
      recommendations.forEach((rec, index) => {
        const row = [
          rec.rank || index + 1,
          this._escapeCSV(rec.zone.properties.name || 'N/A'),
          this._escapeCSV(rec.zone.properties.province || 'N/A'),
          this._escapeCSV(rec.zone.properties.district || 'N/A'),
          this._formatPrice(rec.zone.properties.price),
          this._formatNumber(rec.zone.properties.acreage),
          rec.score.toFixed(1),
          (rec.breakdown.price?.score || 0).toFixed(1),
          (rec.breakdown.location?.score || 0).toFixed(1),
          (rec.breakdown.infrastructure?.score || 0).toFixed(1),
          (rec.breakdown.logistics?.score || 0).toFixed(1),
          (rec.growthPotential || 0).toFixed(0),
          this._escapeCSV(rec.logisticsCosts.nearestPort?.name || 'N/A'),
          this._formatNumber(rec.logisticsCosts.nearestPort?.distance || 0),
          this._escapeCSV(rec.logisticsCosts.nearestAirport?.name || 'N/A'),
          this._formatNumber(rec.logisticsCosts.nearestAirport?.distance || 0),
          this._escapeCSV(rec.logisticsCosts.nearestCity?.name || 'N/A'),
          this._formatNumber(rec.logisticsCosts.nearestCity?.distance || 0)
        ];
        
        rows.push(row.join(','));
      });
      
      // Create CSV content
      const csv = rows.join('\n');
      
      // Create blob and download
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[ExportGenerator] Error generating CSV:', error);
      throw new Error(`Failed to generate CSV: ${error.message}`);
    }
  }
  
  /**
   * Set language for exports
   * @param {string} language - Language code ('vi' or 'en')
   */
  setLanguage(language) {
    if (language === 'vi' || language === 'en') {
      this.language = language;
    }
  }
  
  /**
   * Set map instance for snapshots
   * @param {Object} mapInstance - Mapbox GL JS map instance
   */
  setMapInstance(mapInstance) {
    this.mapInstance = mapInstance;
  }
  
  // Private helper methods
  
  /**
   * Format price with thousand separators
   * @private
   */
  _formatPrice(price) {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    
    return price.toLocaleString(this.language === 'vi' ? 'vi-VN' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
  
  /**
   * Format number with thousand separators
   * @private
   */
  _formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    return value.toLocaleString(this.language === 'vi' ? 'vi-VN' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
  }
  
  /**
   * Truncate text to maximum length
   * @private
   */
  _truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Escape CSV field
   * @private
   */
  _escapeCSV(field) {
    if (field === null || field === undefined) {
      return '';
    }
    
    const str = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }
  
  /**
   * Find best zone by overall score
   * @private
   */
  _findBestByScore(recommendations, criterion) {
    if (recommendations.length === 0) return null;
    
    if (criterion === 'score') {
      return recommendations.reduce((best, rec) => 
        rec.score > best.score ? rec : best
      );
    } else if (criterion === 'growth') {
      return recommendations.reduce((best, rec) => 
        (rec.growthPotential || 0) > (best.growthPotential || 0) ? rec : best
      );
    } else {
      // For criteria scores
      return recommendations.reduce((best, rec) => {
        const recScore = rec.breakdown[criterion]?.score || 0;
        const bestScore = best.breakdown[criterion]?.score || 0;
        return recScore > bestScore ? rec : best;
      });
    }
  }
  
  /**
   * Find best zone by price (lowest)
   * @private
   */
  _findBestByPrice(recommendations) {
    if (recommendations.length === 0) return null;
    
    return recommendations.reduce((best, rec) => {
      const recPrice = rec.zone.properties.price || Infinity;
      const bestPrice = best.zone.properties.price || Infinity;
      return recPrice < bestPrice ? rec : best;
    });
  }
}

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExportGenerator };
}
