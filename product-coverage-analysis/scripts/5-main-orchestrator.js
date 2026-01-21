import { readProductsFromCSV } from './1-csv-reader.js';
import { generateRepresentativeProfiles } from './2-profile-generator.js';
import { testRecommendations } from './3-recommendation-tester.js';
import { generateReport } from './4-report-generator.js';

/**
 * Main orchestrator for product coverage analysis
 */
async function main() {
  console.log('🚀 Starting Product Coverage Analysis\n');
  
  try {
    // Step 1: Read products from CSV
    console.log('Step 1: Reading products from CSV...');
    const products = readProductsFromCSV();
    console.log(`   ✅ Loaded ${products.length} products\n`);
    
    // Step 2: Generate user profiles
    console.log('Step 2: Generating user profiles...');
    const profiles = generateRepresentativeProfiles();
    console.log(`   ✅ Generated ${profiles.length} profiles\n`);
    
    // Step 3: Test recommendations
    console.log('Step 3: Testing recommendations...');
    const testResults = await testRecommendations(products, profiles);
    console.log(`   ✅ Testing complete\n`);
    
    // Step 4: Generate report
    console.log('Step 4: Generating report...');
    const reportPath = generateReport(products, testResults);
    console.log(`   ✅ Report generated\n`);
    
    // Summary
    console.log('📊 Analysis Complete!\n');
    console.log('Summary:');
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Profiles Tested: ${testResults.totalProfiles}`);
    console.log(`  - Profiles with Recommendations: ${testResults.profilesWithRecommendations} (${((testResults.profilesWithRecommendations / testResults.totalProfiles) * 100).toFixed(1)}%)`);
    console.log(`  - Profiles without Recommendations: ${testResults.profilesWithoutRecommendations} (${((testResults.profilesWithoutRecommendations / testResults.totalProfiles) * 100).toFixed(1)}%)`);
    console.log(`\n📄 Full report: ${reportPath}\n`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run main function
main();

