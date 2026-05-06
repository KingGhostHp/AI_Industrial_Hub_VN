/**
 * Export Generator Tests
 * 
 * Tests for PDF and CSV export functionality.
 */

const { ExportGenerator } = require('./export-generator.js');

// Create a shared mock instance
const mockDocInstance = {
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297
    },
    getNumberOfPages: () => 3
  },
  setFontSize: jest.fn(),
  setFont: jest.fn(),
  setDrawColor: jest.fn(),
  text: jest.fn(),
  addPage: jest.fn(),
  addImage: jest.fn(),
  line: jest.fn(),
  setPage: jest.fn(),
  save: jest.fn(),
  getTextWidth: jest.fn((text) => text.length * 2)
};

// Mock jsPDF
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => mockDocInstance)
  };
});

// Mock DOM for CSV export
global.document = {
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    click: jest.fn(),
    style: {}
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.Blob = jest.fn((content, options) => ({
  content,
  options
}));

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Helper function to create mock recommendations
function createMockRecommendations(count = 3) {
  const recommendations = [];
  
  for (let i = 0; i < count; i++) {
    recommendations.push({
      zone: {
        properties: {
          name: `Test Zone ${i + 1}`,
          province: `Province ${i + 1}`,
          district: `District ${i + 1}`,
          price: 100 + (i * 10),
          acreage: 50 + (i * 10),
          code: `TZ${i + 1}`
        }
      },
      score: 80 - (i * 5),
      breakdown: {
        price: { score: 75 - (i * 5), weight: 0.25 },
        location: { score: 80 - (i * 5), weight: 0.25 },
        infrastructure: { score: 85 - (i * 5), weight: 0.25 },
        logistics: { score: 70 - (i * 5), weight: 0.25 }
      },
      rank: i + 1,
      explanation: `This is a test explanation for zone ${i + 1}`,
      growthPotential: 70 - (i * 10),
      logisticsCosts: {
        nearestPort: { name: `Port ${i + 1}`, distance: 20 + (i * 5), cost: 300000 + (i * 75000) },
        nearestAirport: { name: `Airport ${i + 1}`, distance: 15 + (i * 3), cost: 225000 + (i * 45000) },
        nearestCity: { name: `City ${i + 1}`, distance: 10 + (i * 2), cost: 150000 + (i * 30000) }
      }
    });
  }
  
  return recommendations;
}

describe('ExportGenerator', () => {
  let generator;
  let mockRecommendations;
  
  beforeEach(() => {
    generator = new ExportGenerator({ language: 'vi' });
    mockRecommendations = createMockRecommendations(3);
    
    // Reset mock instance methods
    mockDocInstance.setFontSize.mockClear();
    mockDocInstance.setFont.mockClear();
    mockDocInstance.setDrawColor.mockClear();
    mockDocInstance.text.mockClear();
    mockDocInstance.addPage.mockClear();
    mockDocInstance.addImage.mockClear();
    mockDocInstance.line.mockClear();
    mockDocInstance.setPage.mockClear();
    mockDocInstance.save.mockClear();
    mockDocInstance.getTextWidth.mockClear();
    
    jest.clearAllMocks();
  });
  
  describe('Constructor', () => {
    test('initializes with default language', () => {
      const gen = new ExportGenerator();
      expect(gen.language).toBe('vi');
    });
    
    test('initializes with custom language', () => {
      const gen = new ExportGenerator({ language: 'en' });
      expect(gen.language).toBe('en');
    });
    
    test('initializes with map instance', () => {
      const mockMap = { getCanvas: jest.fn() };
      const gen = new ExportGenerator({ mapInstance: mockMap });
      expect(gen.mapInstance).toBe(mockMap);
    });
  });
  
  describe('Translation', () => {
    test('translates Vietnamese text', () => {
      const text = generator.t('title');
      expect(text).toBe('Báo Cáo So Sánh Khu Công Nghiệp');
    });
    
    test('translates English text', () => {
      generator.setLanguage('en');
      const text = generator.t('title');
      expect(text).toBe('Industrial Zone Comparison Report');
    });
    
    test('interpolates parameters', () => {
      const text = generator.t('zone_comparison', { count: 5 });
      expect(text).toContain('5');
    });
    
    test('returns key if translation not found', () => {
      const text = generator.t('nonexistent_key');
      expect(text).toBe('nonexistent_key');
    });
  });
  
  describe('CSV Export', () => {
    test('generates CSV with correct headers', () => {
      generator.exportRecommendationsToCSV(mockRecommendations);
      
      expect(global.Blob).toHaveBeenCalled();
      const blobContent = global.Blob.mock.calls[0][0][0];
      
      // Check for Vietnamese headers
      expect(blobContent).toContain('Xếp hạng');
      expect(blobContent).toContain('Tên khu');
      expect(blobContent).toContain('Điểm tổng');
    });
    
    test('includes all recommendation data', () => {
      generator.exportRecommendationsToCSV(mockRecommendations);
      
      const blobContent = global.Blob.mock.calls[0][0][0];
      
      // Check for zone names
      expect(blobContent).toContain('Test Zone 1');
      expect(blobContent).toContain('Test Zone 2');
      expect(blobContent).toContain('Test Zone 3');
      
      // Check for provinces
      expect(blobContent).toContain('Province 1');
      expect(blobContent).toContain('Province 2');
    });
    
    test('escapes CSV special characters', () => {
      const recommendations = [{
        zone: {
          properties: {
            name: 'Zone with, comma',
            province: 'Province "with quotes"',
            district: 'District\nwith newline',
            price: 100,
            acreage: 50
          }
        },
        score: 80,
        breakdown: {
          price: { score: 75, weight: 0.25 },
          location: { score: 80, weight: 0.25 },
          infrastructure: { score: 85, weight: 0.25 },
          logistics: { score: 70, weight: 0.25 }
        },
        rank: 1,
        growthPotential: 70,
        logisticsCosts: {
          nearestPort: { name: 'Port', distance: 20, cost: 300000 },
          nearestAirport: { name: 'Airport', distance: 15, cost: 225000 },
          nearestCity: { name: 'City', distance: 10, cost: 150000 }
        }
      }];
      
      generator.exportRecommendationsToCSV(recommendations);
      
      const blobContent = global.Blob.mock.calls[0][0][0];
      
      // Check for proper escaping
      expect(blobContent).toContain('"Zone with, comma"');
      expect(blobContent).toContain('"Province ""with quotes"""');
    });
    
    test('handles missing data gracefully', () => {
      const recommendations = [{
        zone: {
          properties: {
            name: null,
            province: undefined,
            price: null,
            acreage: undefined
          }
        },
        score: 0,
        breakdown: {},
        rank: 1,
        growthPotential: 0,
        logisticsCosts: {}
      }];
      
      expect(() => {
        generator.exportRecommendationsToCSV(recommendations);
      }).not.toThrow();
      
      const blobContent = global.Blob.mock.calls[0][0][0];
      expect(blobContent).toContain('N/A');
    });
    
    test('creates download link', () => {
      generator.exportRecommendationsToCSV(mockRecommendations);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
    
    test('uses custom filename if provided', () => {
      const customFilename = 'custom-export.csv';
      generator.exportRecommendationsToCSV(mockRecommendations, { filename: customFilename });
      
      const link = document.createElement.mock.results[0].value;
      expect(link.setAttribute).toHaveBeenCalledWith('download', customFilename);
    });
  });
  
  describe('PDF Export', () => {
    test('creates PDF document', async () => {
      const { jsPDF } = require('jspdf');
      
      await generator.exportComparisonToPDF(mockRecommendations);
      
      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    });
    
    test('adds multiple pages', async () => {
      await generator.exportComparisonToPDF(mockRecommendations);
      
      // Should add pages for: map (if available), details, summary
      expect(mockDocInstance.addPage).toHaveBeenCalled();
    });
    
    test('includes zone information', async () => {
      await generator.exportComparisonToPDF(mockRecommendations);
      
      // Check that text method was called with zone names
      const textCalls = mockDocInstance.text.mock.calls;
      const hasZoneName = textCalls.some(call => 
        call[0] && call[0].includes('Test Zone')
      );
      
      expect(hasZoneName).toBe(true);
    });
    
    test('saves PDF with correct filename', async () => {
      await generator.exportComparisonToPDF(mockRecommendations);
      
      expect(mockDocInstance.save).toHaveBeenCalled();
      const filename = mockDocInstance.save.mock.calls[0][0];
      expect(filename).toMatch(/zone-comparison-\d+\.pdf/);
    });
    
    test('uses custom filename if provided', async () => {
      const customFilename = 'custom-report.pdf';
      
      await generator.exportComparisonToPDF(mockRecommendations, { filename: customFilename });
      
      expect(mockDocInstance.save).toHaveBeenCalledWith(customFilename);
    });
    
    test('handles map snapshot when map instance provided', async () => {
      const mockCanvas = {
        toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
        width: 800,
        height: 600
      };
      
      const mockMap = {
        getCanvas: jest.fn(() => mockCanvas)
      };
      
      generator.setMapInstance(mockMap);
      
      await generator.exportComparisonToPDF(mockRecommendations, { includeMap: true });
      
      expect(mockMap.getCanvas).toHaveBeenCalled();
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
      expect(mockDocInstance.addImage).toHaveBeenCalled();
    });
    
    test('skips map snapshot when includeMap is false', async () => {
      const mockMap = {
        getCanvas: jest.fn()
      };
      
      generator.setMapInstance(mockMap);
      
      await generator.exportComparisonToPDF(mockRecommendations, { includeMap: false });
      
      expect(mockMap.getCanvas).not.toHaveBeenCalled();
    });
    
    test('handles map snapshot error gracefully', async () => {
      const mockMap = {
        getCanvas: jest.fn(() => {
          throw new Error('Canvas error');
        })
      };
      
      generator.setMapInstance(mockMap);
      
      // Should not throw
      await expect(
        generator.exportComparisonToPDF(mockRecommendations, { includeMap: true })
      ).resolves.not.toThrow();
    });
    
    test('adds page numbers', async () => {
      await generator.exportComparisonToPDF(mockRecommendations);
      
      expect(mockDocInstance.setPage).toHaveBeenCalled();
    });
  });
  
  describe('Helper Methods', () => {
    test('formats price correctly', () => {
      const formatted = generator._formatPrice(1234.56);
      expect(formatted).toBe('1.234,56');
    });
    
    test('formats price as N/A for invalid values', () => {
      expect(generator._formatPrice(null)).toBe('N/A');
      expect(generator._formatPrice(undefined)).toBe('N/A');
      expect(generator._formatPrice(NaN)).toBe('N/A');
    });
    
    test('formats number correctly', () => {
      const formatted = generator._formatNumber(1234.5);
      expect(formatted).toBe('1.234,5');
    });
    
    test('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const truncated = generator._truncateText(longText, 20);
      expect(truncated.length).toBeLessThanOrEqual(20);
      expect(truncated).toContain('...');
    });
    
    test('does not truncate short text', () => {
      const shortText = 'Short';
      const result = generator._truncateText(shortText, 20);
      expect(result).toBe(shortText);
    });
    
    test('finds best zone by overall score', () => {
      const best = generator._findBestByScore(mockRecommendations, 'score');
      expect(best.score).toBe(80); // First recommendation has highest score
    });
    
    test('finds best zone by growth potential', () => {
      const best = generator._findBestByScore(mockRecommendations, 'growth');
      expect(best.growthPotential).toBe(70); // First recommendation has highest growth
    });
    
    test('finds best zone by price (lowest)', () => {
      const best = generator._findBestByPrice(mockRecommendations);
      expect(best.zone.properties.price).toBe(100); // First recommendation has lowest price
    });
    
    test('returns null for empty recommendations', () => {
      const best = generator._findBestByScore([], 'score');
      expect(best).toBeNull();
    });
  });
  
  describe('Language Management', () => {
    test('sets language to Vietnamese', () => {
      generator.setLanguage('vi');
      expect(generator.language).toBe('vi');
    });
    
    test('sets language to English', () => {
      generator.setLanguage('en');
      expect(generator.language).toBe('en');
    });
    
    test('ignores invalid language', () => {
      const originalLanguage = generator.language;
      generator.setLanguage('fr');
      expect(generator.language).toBe(originalLanguage);
    });
  });
  
  describe('Map Instance Management', () => {
    test('sets map instance', () => {
      const mockMap = { getCanvas: jest.fn() };
      generator.setMapInstance(mockMap);
      expect(generator.mapInstance).toBe(mockMap);
    });
  });
  
  describe('Error Handling', () => {
    test('throws error on PDF generation failure', async () => {
      const { jsPDF } = require('jspdf');
      jsPDF.mockImplementationOnce(() => {
        throw new Error('PDF error');
      });
      
      await expect(
        generator.exportComparisonToPDF(mockRecommendations)
      ).rejects.toThrow('Failed to generate PDF');
    });
    
    test('throws error on CSV generation failure', () => {
      // Mock Blob to throw error
      global.Blob = jest.fn(() => {
        throw new Error('Blob error');
      });
      
      expect(() => {
        generator.exportRecommendationsToCSV(mockRecommendations);
      }).toThrow('Failed to generate CSV');
      
      // Restore Blob mock
      global.Blob = jest.fn((content, options) => ({
        content,
        options
      }));
    });
  });
  
  describe('Edge Cases', () => {
    test('handles empty recommendations array', () => {
      expect(() => {
        generator.exportRecommendationsToCSV([]);
      }).not.toThrow();
    });
    
    test('handles single recommendation', async () => {
      const singleRec = [mockRecommendations[0]];
      
      await expect(
        generator.exportComparisonToPDF(singleRec)
      ).resolves.not.toThrow();
      
      expect(() => {
        generator.exportRecommendationsToCSV(singleRec);
      }).not.toThrow();
    });
    
    test('handles maximum 5 recommendations', async () => {
      const fiveRecs = createMockRecommendations(5);
      
      await expect(
        generator.exportComparisonToPDF(fiveRecs)
      ).resolves.not.toThrow();
      
      expect(() => {
        generator.exportRecommendationsToCSV(fiveRecs);
      }).not.toThrow();
    });
  });
});
