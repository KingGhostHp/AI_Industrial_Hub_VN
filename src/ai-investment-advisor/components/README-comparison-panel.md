# Comparison Panel Component

## Overview

The `ComparisonPanel` component provides a side-by-side comparison interface for up to 5 industrial zones. It displays comprehensive information including criteria scores, logistics costs, growth potential, and rental price forecasts, with visual highlighting of the best zone for each criterion.

## Requirements

This component implements the following requirements:
- **10.1**: Allow users to select up to 5 zones for side-by-side comparison
- **10.2**: Generate comparison report within 3 seconds
- **10.3**: Include all criteria scores, logistics cost breakdown, growth potential, and rental price forecasts
- **10.4**: Highlight the best zone for each criterion using visual indicators
- **17.2**: Stack panels vertically on mobile devices (below 768px)
- **17.6**: Display in scrollable single-column layout on mobile devices

## Features

### Core Functionality
- **Multi-zone comparison**: Compare up to 5 zones simultaneously
- **Comprehensive metrics**: Display all scoring criteria, logistics information, and forecasts
- **Best value highlighting**: Automatically identify and highlight the best zone for each criterion
- **Responsive design**: Adapts to mobile, tablet, and desktop screens
- **Export functionality**: Export comparison data to CSV format
- **Bilingual support**: Vietnamese (default) and English languages

### Display Sections
1. **Basic Information**: Zone name, location, price, acreage, overall score
2. **Criteria Scores**: Price, location, infrastructure, logistics with visual bars
3. **Logistics Information**: Nearest port, airport, and city with distances
4. **Growth & Forecast**: Growth potential and 1-2 year rental price forecasts

### Visual Features
- Color-coded score bars (green/orange/red based on score)
- Best value badges for top performers in each category
- Growth potential indicators (high/medium/low)
- Sticky header and first column for easy navigation
- Hover effects for better interactivity

## Usage

### Basic Usage

```javascript
import { ComparisonPanel } from './comparison-panel.js';

// Create array of recommendations (max 5)
const recommendations = [
  recommendation1,
  recommendation2,
  recommendation3
];

// Initialize and show panel
const panel = new ComparisonPanel(recommendations, {
  language: 'vi',
  onClose: () => {
    console.log('Panel closed');
  }
});

panel.show();
```

### With Options

```javascript
const panel = new ComparisonPanel(recommendations, {
  language: 'en',  // 'vi' or 'en'
  onClose: () => {
    // Callback when panel is closed
    console.log('Comparison panel closed');
  }
});

panel.show();
```

### Programmatic Control

```javascript
// Show panel
panel.show();

// Hide panel
panel.hide();

// Change language
panel.setLanguage('en');

// Export to CSV
const csvData = panel.exportToCSV();
```

## Data Structure

### Input: Recommendation Object

Each recommendation should follow this structure:

```javascript
{
  zone: {
    type: 'Feature',
    properties: {
      code: 'KCN001',
      name: 'KCN Tân Thuận',
      province: 'Hồ Chí Minh',
      district: 'Quận 7',
      price: 120,        // USD/m²/term
      acreage: 500,      // hectares
      kind: 'KCN'
    },
    geometry: {
      type: 'Point',
      coordinates: [106.7, 10.8]
    }
  },
  score: 85.5,           // Overall score (0-100)
  breakdown: {
    price: { score: 75, weight: 0.25 },
    location: { score: 90, weight: 0.25 },
    infrastructure: { score: 88, weight: 0.25 },
    logistics: { score: 88, weight: 0.25 }
  },
  rank: 1,
  explanation: 'AI-generated explanation',
  growthPotential: 82,   // 0-100
  logisticsCosts: {
    nearestPort: {
      name: 'Cảng Sài Gòn',
      distance: 15,      // km
      cost: 225000       // VND
    },
    nearestAirport: {
      name: 'Sân bay Tân Sơn Nhất',
      distance: 20,
      cost: 300000
    },
    nearestCity: {
      name: 'TP. Hồ Chí Minh',
      distance: 10,
      cost: 150000
    }
  }
}
```

## Styling

The component uses CSS variables defined in `ai-investment-advisor.css`:

```css
--primary-color: #3B82F6;
--success-color: #10B981;
--warning-color: #F59E0B;
--error-color: #EF4444;
--bg-dark: rgba(0, 0, 0, 0.85);
--bg-light: rgba(255, 255, 255, 0.05);
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.85);
--text-muted: rgba(255, 255, 255, 0.6);
```

### Custom Styling

You can override styles by targeting these classes:

```css
.comparison-panel { }           /* Main container */
.comparison-content { }         /* Content wrapper */
.comparison-header { }          /* Header section */
.comparison-table { }           /* Comparison table */
.comparison-table td.best-value { }  /* Best value cells */
.best-badge { }                 /* Best indicator badge */
.growth-badge { }               /* Growth indicator */
.score-bar { }                  /* Score visualization bar */
```

## Responsive Behavior

### Desktop (>1024px)
- Full table layout with all columns visible
- Horizontal scrolling if needed for 5 zones
- Sticky header and first column

### Tablet (769px - 1024px)
- Slightly reduced column widths
- Maintained table structure
- Horizontal scrolling enabled

### Mobile (≤768px)
- Vertical stacking of content
- Simplified table layout
- Reduced font sizes
- Full-width buttons in footer
- Minimum tap target size: 44x44px

### Small Mobile (≤480px)
- Further simplified layout
- Hidden non-essential columns
- Optimized for portrait orientation
- Single-column button layout

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Escape key to close panel
- Focus indicators on all controls

### Screen Readers
- Semantic HTML structure
- ARIA labels on buttons
- Descriptive table headers
- Alt text for visual indicators

### High Contrast Mode
- Increased border widths
- Enhanced color contrast
- Visible focus indicators

### Reduced Motion
- Disabled animations when preferred
- Instant transitions
- No parallax effects

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Renders comparison table in <100ms for 5 zones
- Smooth scrolling with hardware acceleration
- Optimized CSS with minimal repaints
- Lazy rendering of non-visible content

## Testing

### Manual Testing

Open `test-comparison-panel.html` in a browser to test:

1. **2 Zones Comparison**: Basic comparison with minimal data
2. **3 Zones Comparison**: Standard use case
3. **5 Zones Comparison**: Maximum capacity test
4. **English Language**: Bilingual support test

### Test Scenarios

- [ ] Display 2-5 zones correctly
- [ ] Highlight best values accurately
- [ ] Show all criteria scores with bars
- [ ] Display logistics information
- [ ] Show growth potential badges
- [ ] Calculate rental forecasts
- [ ] Export to CSV successfully
- [ ] Responsive layout on mobile
- [ ] Close on Escape key
- [ ] Close on backdrop click
- [ ] Language switching works
- [ ] Sticky header/column scrolling

## Integration Example

```javascript
// In your recommendation results handler
function handleCompareZones(selectedRecommendations) {
  // Validate selection
  if (selectedRecommendations.length < 2) {
    alert('Please select at least 2 zones to compare');
    return;
  }
  
  if (selectedRecommendations.length > 5) {
    alert('Maximum 5 zones can be compared');
    return;
  }
  
  // Create and show comparison panel
  const panel = new ComparisonPanel(selectedRecommendations, {
    language: getUserLanguagePreference(),
    onClose: () => {
      // Clear selection or update UI
      clearZoneSelection();
    }
  });
  
  panel.show();
}
```

## CSV Export Format

The exported CSV includes:

```csv
Zone,Zone 1,Zone 2,Zone 3
Zone Name,"KCN Tân Thuận","KCN Biên Hòa 2","KCN Vsip Bắc Ninh"
Province,"Hồ Chí Minh","Đồng Nai","Bắc Ninh"
Rental Price,120,95,110
Overall Score,85.5,82.3,79.8
Price Score,75.0,88.0,80.0
Location Score,90.0,78.0,75.0
Infrastructure Score,88.0,82.0,85.0
Logistics Score,88.0,81.0,79.0
Growth Potential,82,75,88
```

## Known Limitations

1. **Maximum 5 zones**: Component is optimized for up to 5 zones. More zones would require horizontal scrolling on all devices.
2. **Static forecasts**: Rental price forecasts use simplified growth rates. For production, integrate with PredictionEngine.
3. **No PDF export**: Currently only CSV export is implemented. PDF export requires additional library.
4. **Print optimization**: Print styles are basic. Consider using dedicated print library for better results.

## Future Enhancements

- [ ] PDF export with charts and graphs
- [ ] Customizable column visibility
- [ ] Sort by any criterion
- [ ] Save comparison as template
- [ ] Share comparison via URL
- [ ] Print-optimized layout
- [ ] Chart visualizations for trends
- [ ] Historical comparison data

## Related Components

- **RecommendationCard**: Displays individual zone recommendations
- **ExplanationPanel**: Shows detailed AI explanations
- **AnalyticsDashboard**: Provides predictive analytics visualizations

## Support

For issues or questions:
1. Check the test file for usage examples
2. Review the requirements document
3. Inspect browser console for errors
4. Verify data structure matches expected format
