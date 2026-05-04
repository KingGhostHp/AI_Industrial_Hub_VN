/**
 * Validate All Strategic Location Data Files
 * 
 * This script validates all GeoJSON data files for strategic locations.
 * Run with: node validate-all-data.js
 */

const validator = require('./geojson-validator.js');
const fs = require('fs');
const path = require('path');

// Location type configurations
const LOCATION_TYPES = [
  {
    id: 'seaport',
    name: 'Cảng biển',
    dataFile: 'data/cangbienexport.geojson'
  },
  {
    id: 'airport',
    name: 'Sân bay',
    dataFile: 'data/export.geojson'
  },
  {
    id: 'highway',
    name: 'Cao tốc',
    dataFile: 'data/caotocexport.geojson'
  },
  {
    id: 'city_center',
    name: 'Trung tâm TP',
    dataFile: 'data/trungtamthanhphoexport.geojson'
  },
  {
    id: 'residential',
    name: 'Khu dân cư',
    dataFile: 'data/khudancu.geojson'
  }
];

console.log('='.repeat(70));
console.log('Validating All Strategic Location Data Files');
console.log('='.repeat(70));

let totalFiles = 0;
let validFiles = 0;
let totalFeatures = 0;
let validFeatures = 0;
let totalErrors = 0;
let totalWarnings = 0;

LOCATION_TYPES.forEach(locationType => {
  console.log(`\n📍 ${locationType.name} (${locationType.id})`);
  console.log('-'.repeat(70));
  
  const dataPath = path.join(__dirname, '../../../', locationType.dataFile);
  
  if (!fs.existsSync(dataPath)) {
    console.log(`  ⚠️  File not found: ${locationType.dataFile}`);
    return;
  }
  
  totalFiles++;
  
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const result = validator.validateGeoJSON(data, locationType.id);
    
    totalFeatures += data.features.length;
    validFeatures += result.validFeatureCount;
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    
    if (result.valid) {
      validFiles++;
      console.log(`  ✓ Valid`);
    } else {
      console.log(`  ✗ Invalid`);
    }
    
    console.log(`  Features: ${data.features.length}`);
    console.log(`  Valid Features: ${result.validFeatureCount}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Warnings: ${result.warnings.length}`);
    
    // Show first few errors if any
    if (result.errors.length > 0) {
      console.log(`\n  Errors:`);
      result.errors.slice(0, 5).forEach(error => {
        console.log(`    - ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`    ... and ${result.errors.length - 5} more errors`);
      }
    }
    
    // Show first few warnings if any
    if (result.warnings.length > 0) {
      console.log(`\n  Warnings:`);
      result.warnings.slice(0, 5).forEach(warning => {
        console.log(`    - ${warning}`);
      });
      if (result.warnings.length > 5) {
        console.log(`    ... and ${result.warnings.length - 5} more warnings`);
      }
    }
    
  } catch (error) {
    console.log(`  ✗ Error reading/parsing file: ${error.message}`);
  }
});

// Print summary
console.log('\n' + '='.repeat(70));
console.log('Summary');
console.log('='.repeat(70));
console.log(`Files Validated: ${totalFiles}`);
console.log(`Valid Files: ${validFiles}`);
console.log(`Total Features: ${totalFeatures}`);
console.log(`Valid Features: ${validFeatures}`);
console.log(`Total Errors: ${totalErrors}`);
console.log(`Total Warnings: ${totalWarnings}`);

if (validFiles === totalFiles && totalErrors === 0) {
  console.log('\n✓ All data files are valid!');
  process.exit(0);
} else if (validFeatures === totalFeatures) {
  console.log('\n⚠️  All features are valid but there are warnings.');
  process.exit(0);
} else {
  console.log('\n✗ Some data files have errors.');
  process.exit(1);
}
