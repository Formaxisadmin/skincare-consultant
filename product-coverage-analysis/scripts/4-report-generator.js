import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate coverage analysis report
 */
export function generateReport(products, testResults) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportsDir = path.join(__dirname, 'reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, `coverage-report-${timestamp}.md`);
  
  // Calculate statistics
  const totalProducts = products.length;
  const coveragePercentage = (testResults.profilesWithRecommendations / testResults.totalProfiles) * 100;
  
  // Category statistics
  const categoryStats = Object.entries(testResults.categoryCoverage).map(([cat, stats]) => ({
    category: cat,
    coverage: stats.total > 0 ? (stats.covered / stats.total * 100).toFixed(1) : 0,
    total: stats.total,
    covered: stats.covered,
  })).sort((a, b) => parseFloat(b.coverage) - parseFloat(a.coverage));
  
  // Concern statistics
  const concernStats = Object.entries(testResults.concernCoverage).map(([concern, stats]) => ({
    concern,
    coverage: stats.total > 0 ? (stats.covered / stats.total * 100).toFixed(1) : 0,
    total: stats.total,
    covered: stats.covered,
  })).sort((a, b) => parseFloat(b.coverage) - parseFloat(a.coverage));
  
  // Skin type statistics
  const skinTypeStats = Object.entries(testResults.skinTypeCoverage).map(([st, stats]) => ({
    skinType: st,
    coverage: stats.total > 0 ? (stats.covered / stats.total * 100).toFixed(1) : 0,
    total: stats.total,
    covered: stats.covered,
  })).sort((a, b) => parseFloat(b.coverage) - parseFloat(a.coverage));
  
  // Product distribution by category
  const productsByCategory = {};
  products.forEach(p => {
    if (!productsByCategory[p.category]) {
      productsByCategory[p.category] = 0;
    }
    productsByCategory[p.category]++;
  });
  
  // Product distribution by concern
  const productsByConcern = {};
  products.forEach(p => {
    if (Array.isArray(p.concernsAddressed)) {
      p.concernsAddressed.forEach(c => {
        if (!productsByConcern[c]) {
          productsByConcern[c] = 0;
        }
        productsByConcern[c]++;
      });
    }
  });
  
  // Product distribution by skin type
  const productsBySkinType = {};
  products.forEach(p => {
    if (Array.isArray(p.skinTypes)) {
      if (p.skinTypes.length === 0 || p.skinTypes.includes('all')) {
        // Count as all skin types
        ['oily', 'dry', 'combination', 'normal', 'sensitive'].forEach(st => {
          if (!productsBySkinType[st]) {
            productsBySkinType[st] = 0;
          }
          productsBySkinType[st]++;
        });
      } else {
        p.skinTypes.forEach(st => {
          if (!productsBySkinType[st]) {
            productsBySkinType[st] = 0;
          }
          productsBySkinType[st]++;
        });
      }
    }
  });
  
  // Generate report
  let report = `# Product Coverage Analysis Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  report += `---\n\n`;
  
  // Executive Summary
  report += `## Executive Summary\n\n`;
  report += `- **Total Products:** ${totalProducts}\n`;
  report += `- **Total Profiles Tested:** ${testResults.totalProfiles}\n`;
  report += `- **Profiles with Recommendations:** ${testResults.profilesWithRecommendations} (${coveragePercentage.toFixed(1)}%)\n`;
  report += `- **Profiles without Recommendations:** ${testResults.profilesWithoutRecommendations} (${(100 - coveragePercentage).toFixed(1)}%)\n\n`;
  
  // Product Distribution
  report += `## Product Distribution\n\n`;
  report += `### By Category\n\n`;
  report += `| Category | Count |\n`;
  report += `|----------|-------|\n`;
  Object.entries(productsByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      report += `| ${cat} | ${count} |\n`;
    });
  report += `\n`;
  
  report += `### By Concern\n\n`;
  report += `| Concern | Product Count |\n`;
  report += `|---------|---------------|\n`;
  Object.entries(productsByConcern)
    .sort((a, b) => b[1] - a[1])
    .forEach(([concern, count]) => {
      report += `| ${concern} | ${count} |\n`;
    });
  report += `\n`;
  
  report += `### By Skin Type\n\n`;
  report += `| Skin Type | Product Count |\n`;
  report += `|----------|---------------|\n`;
  Object.entries(productsBySkinType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([st, count]) => {
      report += `| ${st} | ${count} |\n`;
    });
  report += `\n`;
  
  // Coverage Analysis
  report += `## Coverage Analysis\n\n`;
  
  report += `### Category Coverage\n\n`;
  report += `| Category | Coverage % | Profiles Tested | Profiles Covered |\n`;
  report += `|----------|------------|----------------|------------------|\n`;
  categoryStats.forEach(stat => {
    const status = parseFloat(stat.coverage) >= 90 ? '✅' : parseFloat(stat.coverage) >= 70 ? '⚠️' : '❌';
    report += `| ${stat.category} | ${stat.coverage}% ${status} | ${stat.total} | ${stat.covered} |\n`;
  });
  report += `\n`;
  
  report += `### Concern Coverage\n\n`;
  report += `| Concern | Coverage % | Profiles Tested | Profiles Covered |\n`;
  report += `|--------|------------|----------------|------------------|\n`;
  concernStats.forEach(stat => {
    const status = parseFloat(stat.coverage) >= 90 ? '✅' : parseFloat(stat.coverage) >= 70 ? '⚠️' : '❌';
    report += `| ${stat.concern} | ${stat.coverage}% ${status} | ${stat.total} | ${stat.covered} |\n`;
  });
  report += `\n`;
  
  report += `### Skin Type Coverage\n\n`;
  report += `| Skin Type | Coverage % | Profiles Tested | Profiles Covered |\n`;
  report += `|-----------|------------|----------------|------------------|\n`;
  skinTypeStats.forEach(stat => {
    const status = parseFloat(stat.coverage) >= 90 ? '✅' : parseFloat(stat.coverage) >= 70 ? '⚠️' : '❌';
    report += `| ${stat.skinType} | ${stat.coverage}% ${status} | ${stat.total} | ${stat.covered} |\n`;
  });
  report += `\n`;
  
  // Missing Products Analysis
  if (testResults.profilesNeedingProducts.length > 0) {
    report += `## Missing Products Analysis\n\n`;
    report += `### Profiles Without Recommendations\n\n`;
    report += `**Total:** ${testResults.profilesNeedingProducts.length} profiles\n\n`;
    
    // Group by missing categories
    const missingByCategory = {};
    testResults.profilesNeedingProducts.forEach(item => {
      item.missingCategories.forEach(cat => {
        if (!missingByCategory[cat]) {
          missingByCategory[cat] = [];
        }
        missingByCategory[cat].push(item);
      });
    });
    
    report += `### Missing Categories\n\n`;
    Object.entries(missingByCategory)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([cat, profiles]) => {
        report += `#### ${cat}\n\n`;
        report += `**Affected Profiles:** ${profiles.length}\n\n`;
        
        // Show sample profiles
        const sampleProfiles = profiles.slice(0, 5);
        report += `**Sample Profiles:**\n\n`;
        sampleProfiles.forEach((item, idx) => {
          report += `${idx + 1}. Skin Type: ${item.profile.skinType}, Concerns: ${item.profile.primaryConcerns.join(', ')}, Age: ${item.profile.ageRange}\n`;
        });
        if (profiles.length > 5) {
          report += `\n*... and ${profiles.length - 5} more profiles*\n`;
        }
        report += `\n`;
      });
    
    // Group by missing concerns
    const missingByConcern = {};
    testResults.profilesNeedingProducts.forEach(item => {
      item.concerns.forEach(concern => {
        if (!missingByConcern[concern]) {
          missingByConcern[concern] = [];
        }
        missingByConcern[concern].push(item);
      });
    });
    
    report += `### Missing Concerns\n\n`;
    Object.entries(missingByConcern)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([concern, profiles]) => {
        report += `- **${concern}**: ${profiles.length} profiles affected\n`;
      });
    report += `\n`;
  }
  
  // Pricing Analysis
  report += `## Pricing Analysis\n\n`;
  
  const pricingData = testResults.pricingData || { allRecommendedProducts: [], byCategory: {} };
  const allRecommendedPrices = pricingData.allRecommendedProducts.map(p => p.price).filter(p => p > 0);
  
  if (allRecommendedPrices.length > 0) {
    // Overall statistics
    const overallAvg = allRecommendedPrices.reduce((a, b) => a + b, 0) / allRecommendedPrices.length;
    const overallMin = Math.min(...allRecommendedPrices);
    const overallMax = Math.max(...allRecommendedPrices);
    const sortedPrices = [...allRecommendedPrices].sort((a, b) => a - b);
    const overallMedian = sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    report += `### Overall Pricing Statistics\n\n`;
    report += `- **Total Recommended Products (with prices):** ${allRecommendedPrices.length}\n`;
    report += `- **Average Price:** ₹${overallAvg.toFixed(2)}\n`;
    report += `- **Median Price:** ₹${overallMedian.toFixed(2)}\n`;
    report += `- **Lowest Price:** ₹${overallMin.toFixed(2)}\n`;
    report += `- **Highest Price:** ₹${overallMax.toFixed(2)}\n`;
    report += `- **Price Range:** ₹${overallMin.toFixed(2)} - ₹${overallMax.toFixed(2)}\n\n`;
    
    // Category-wise pricing
    report += `### Category-Wise Pricing Breakdown\n\n`;
    report += `| Category | Count | Average | Median | Lowest | Highest |\n`;
    report += `|----------|-------|---------|--------|--------|---------|\n`;
    
    const categoryPricingStats = [];
    
    Object.entries(pricingData.byCategory).forEach(([category, data]) => {
      const prices = data.prices.filter(p => p > 0);
      if (prices.length > 0) {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const sorted = [...prices].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        
        categoryPricingStats.push({
          category,
          count: prices.length,
          average: avg,
          median,
          min,
          max,
        });
      }
    });
    
    // Sort by average price (descending)
    categoryPricingStats.sort((a, b) => b.average - a.average);
    
    categoryPricingStats.forEach(stat => {
      report += `| ${stat.category} | ${stat.count} | ₹${stat.average.toFixed(2)} | ₹${stat.median.toFixed(2)} | ₹${stat.min.toFixed(2)} | ₹${stat.max.toFixed(2)} |\n`;
    });
    
    report += `\n`;
    
    // Detailed category breakdown
    report += `### Detailed Category Pricing\n\n`;
    
    categoryPricingStats.forEach(stat => {
      const categoryData = pricingData.byCategory[stat.category];
      const prices = categoryData.prices.filter(p => p > 0);
      
      report += `#### ${stat.category}\n\n`;
      report += `- **Product Count:** ${stat.count}\n`;
      report += `- **Average Price:** ₹${stat.average.toFixed(2)}\n`;
      report += `- **Median Price:** ₹${stat.median.toFixed(2)}\n`;
      report += `- **Lowest Price:** ₹${stat.min.toFixed(2)}\n`;
      report += `- **Highest Price:** ₹${stat.max.toFixed(2)}\n`;
      report += `- **Price Range:** ₹${stat.min.toFixed(2)} - ₹${stat.max.toFixed(2)}\n`;
      
      // Price distribution
      const priceRanges = [
        { label: 'Budget (₹0-500)', count: 0 },
        { label: 'Mid-range (₹500-1500)', count: 0 },
        { label: 'Premium (₹1500-3000)', count: 0 },
        { label: 'Luxury (₹3000+)', count: 0 },
      ];
      
      prices.forEach(price => {
        if (price < 500) priceRanges[0].count++;
        else if (price < 1500) priceRanges[1].count++;
        else if (price < 3000) priceRanges[2].count++;
        else priceRanges[3].count++;
      });
      
      report += `\n**Price Distribution:**\n`;
      priceRanges.forEach(range => {
        if (range.count > 0) {
          const percentage = ((range.count / prices.length) * 100).toFixed(1);
          report += `- ${range.label}: ${range.count} products (${percentage}%)\n`;
        }
      });
      
      // Top 5 most expensive products in this category
      const topProducts = [...categoryData.products]
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);
      
      if (topProducts.length > 0) {
        report += `\n**Top 5 Most Expensive Products:**\n`;
        topProducts.forEach((product, idx) => {
          report += `${idx + 1}. ${product.name}: ₹${product.price.toFixed(2)}\n`;
        });
      }
      
      // Top 5 most affordable products in this category
      const affordableProducts = [...categoryData.products]
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);
      
      if (affordableProducts.length > 0) {
        report += `\n**Top 5 Most Affordable Products:**\n`;
        affordableProducts.forEach((product, idx) => {
          report += `${idx + 1}. ${product.name}: ₹${product.price.toFixed(2)}\n`;
        });
      }
      
      report += `\n`;
    });
    
    // Price insights
    report += `### Pricing Insights\n\n`;
    
    const mostExpensiveCategory = categoryPricingStats[0];
    const mostAffordableCategory = categoryPricingStats[categoryPricingStats.length - 1];
    
    report += `- **Most Expensive Category:** ${mostExpensiveCategory.category} (Average: ₹${mostExpensiveCategory.average.toFixed(2)})\n`;
    report += `- **Most Affordable Category:** ${mostAffordableCategory.category} (Average: ₹${mostAffordableCategory.average.toFixed(2)})\n`;
    report += `- **Price Difference:** ₹${(mostExpensiveCategory.average - mostAffordableCategory.average).toFixed(2)}\n\n`;
    
    // Price consistency (coefficient of variation)
    categoryPricingStats.forEach(stat => {
      const categoryData = pricingData.byCategory[stat.category];
      const prices = categoryData.prices.filter(p => p > 0);
      if (prices.length > 1) {
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - stat.average, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = (stdDev / stat.average) * 100;
        
        if (coefficientOfVariation > 50) {
          report += `- **${stat.category}** shows high price variation (CV: ${coefficientOfVariation.toFixed(1)}%), indicating a wide range of price points.\n`;
        }
      }
    });
    
    report += `\n`;
  } else {
    report += `⚠️ **No pricing data available** - Products may not have price information.\n\n`;
  }
  
  // NEW: Inventory vs Recommendation Analysis (Supply vs Demand)
  const inventoryStats = testResults.inventoryStats || { byPriceTier: {}, total: 0 };
  const recommendationStats = testResults.recommendationStats || { byPriceTier: {}, uniqueProductIds: new Set(), productFrequency: {}, categoryUniqueIds: {} };
  
  if (inventoryStats.total > 0) {
    report += `## Inventory vs Recommendation Analysis (Supply vs Demand)\n\n`;
    
    // 1. Inventory Distribution Table
    report += `### 1. Price Tier Distribution: Supply vs Demand\n\n`;
    report += `| Tier | Inventory Count | Inventory % | Recommendation Count | Recommendation % | Status |\n`;
    report += `|------|----------------|------------|---------------------|------------------|--------|\n`;
    
    const tiers = [
      { name: 'Budget', key: 'budget', range: '₹0-500' },
      { name: 'Mid-range', key: 'mid', range: '₹500-1500' },
      { name: 'Premium', key: 'premium', range: '₹1500-3000' },
      { name: 'Luxury', key: 'luxury', range: '₹3000+' },
    ];
    
    const allRecommendedPrices = pricingData.allRecommendedProducts.map(p => p.price).filter(p => p > 0);
    const totalRecs = allRecommendedPrices.length;
    
    tiers.forEach(tier => {
      const inventoryCount = inventoryStats.byPriceTier[tier.key]?.count || 0;
      const inventoryPercent = ((inventoryCount / inventoryStats.total) * 100).toFixed(1);
      
      const recCount = recommendationStats.byPriceTier[tier.key]?.count || 0;
      const recPercent = totalRecs > 0 ? ((recCount / totalRecs) * 100).toFixed(1) : '0.0';
      
      // Determine status
      let status = '✅';
      if (parseFloat(inventoryPercent) > 0 && parseFloat(recPercent) < parseFloat(inventoryPercent) * 0.5) {
        status = '❌'; // Under-recommended
      } else if (parseFloat(recPercent) > parseFloat(inventoryPercent) * 1.5) {
        status = '⚠️'; // Over-recommended
      }
      
      report += `| **${tier.name}** (${tier.range}) | ${inventoryCount} | ${inventoryPercent}% | ${recCount} | ${recPercent}% | ${status} |\n`;
    });
    
    report += `\n`;
    
    // 2. Unique Product Utilization
    const uniqueRecommendedCount = recommendationStats.uniqueProductIds?.size || 0;
    const utilizationRate = ((uniqueRecommendedCount / inventoryStats.total) * 100).toFixed(1);
    
    report += `### 2. Product Utilization Analysis\n\n`;
    report += `- **Total Inventory:** ${inventoryStats.total} products\n`;
    report += `- **Unique Products Recommended:** ${uniqueRecommendedCount} products\n`;
    report += `- **Inventory Utilization:** **${utilizationRate}%**\n`;
    
    if (parseFloat(utilizationRate) < 50) {
      report += `\n⚠️ **Warning:** ${(100 - parseFloat(utilizationRate)).toFixed(1)}% of your inventory is never being recommended. This indicates the algorithm may be biased toward specific products.\n`;
    }
    
    report += `\n`;
    
    // Category-wise utilization
    if (recommendationStats.categoryUniqueIds && Object.keys(recommendationStats.categoryUniqueIds).length > 0) {
      report += `#### Category-Wise Utilization\n\n`;
      report += `| Category | Inventory | Unique Recommended | Utilization % |\n`;
      report += `|----------|-----------|-------------------|---------------|\n`;
      
      const categoryUtilization = [];
      Object.keys(recommendationStats.categoryUniqueIds).forEach(cat => {
        const uniqueCount = recommendationStats.categoryUniqueIds[cat]?.size || 0;
        const categoryProducts = products.filter(p => p.category === cat && p.inStock === true);
        const categoryInventory = categoryProducts.length;
        const catUtilization = categoryInventory > 0 ? ((uniqueCount / categoryInventory) * 100).toFixed(1) : '0.0';
        
        categoryUtilization.push({
          category: cat,
          inventory: categoryInventory,
          unique: uniqueCount,
          utilization: parseFloat(catUtilization),
        });
      });
      
      categoryUtilization
        .sort((a, b) => b.utilization - a.utilization)
        .forEach(stat => {
          report += `| ${stat.category} | ${stat.inventory} | ${stat.unique} | ${stat.utilization.toFixed(1)}% |\n`;
        });
      
      report += `\n`;
    }
    
    // 3. Product Frequency Leaderboard (Monopoly Score)
    const productFrequency = recommendationStats.productFrequency || {};
    const frequencyArray = Object.entries(productFrequency)
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20
    
    if (frequencyArray.length > 0) {
      report += `### 3. Most Frequently Recommended Products (Monopoly Score)\n\n`;
      report += `**Top 20 Dominant Products:**\n\n`;
      report += `| Rank | Product | Brand | Price | Recommendations | % of Profiles |\n`;
      report += `|------|---------|-------|-------|-----------------|---------------|\n`;
      
      frequencyArray.forEach((product, index) => {
        const percentOfProfiles = ((product.count / testResults.totalProfiles) * 100).toFixed(1);
        report += `| ${index + 1} | ${product.name} | ${product.brand} | ₹${product.price.toFixed(2)} | ${product.count} | ${percentOfProfiles}% |\n`;
      });
      
      report += `\n`;
      
      // Calculate concentration
      const top10Count = frequencyArray.slice(0, 10).reduce((sum, p) => sum + p.count, 0);
      const top10Percent = totalRecs > 0 ? ((top10Count / totalRecs) * 100).toFixed(1) : '0.0';
      
      report += `**Concentration Analysis:**\n`;
      report += `- Top 10 products account for **${top10Percent}%** of all recommendations\n`;
      
      if (parseFloat(top10Percent) > 50) {
        report += `- ⚠️ **High concentration detected:** The algorithm is heavily biased toward a small set of products.\n`;
      }
      
      report += `\n`;
    }
  }
  
  // Recommendations
  report += `## Recommendations\n\n`;
  
  const lowCoverageCategories = categoryStats.filter(s => parseFloat(s.coverage) < 90);
  const lowCoverageConcerns = concernStats.filter(s => parseFloat(s.coverage) < 90);
  const lowCoverageSkinTypes = skinTypeStats.filter(s => parseFloat(s.coverage) < 90);
  
  if (lowCoverageCategories.length > 0) {
    report += `### Category Gaps\n\n`;
    report += `Consider adding more products in the following categories:\n\n`;
    lowCoverageCategories.forEach(stat => {
      report += `- **${stat.category}**: ${stat.coverage}% coverage (${stat.covered}/${stat.total} profiles)\n`;
    });
    report += `\n`;
  }
  
  if (lowCoverageConcerns.length > 0) {
    report += `### Concern Gaps\n\n`;
    report += `Consider adding more products that address:\n\n`;
    lowCoverageConcerns.forEach(stat => {
      report += `- **${stat.concern}**: ${stat.coverage}% coverage (${stat.covered}/${stat.total} profiles)\n`;
    });
    report += `\n`;
  }
  
  if (lowCoverageSkinTypes.length > 0) {
    report += `### Skin Type Gaps\n\n`;
    report += `Consider adding more products suitable for:\n\n`;
    lowCoverageSkinTypes.forEach(stat => {
      report += `- **${stat.skinType}**: ${stat.coverage}% coverage (${stat.covered}/${stat.total} profiles)\n`;
    });
    report += `\n`;
  }
  
  if (lowCoverageCategories.length === 0 && lowCoverageConcerns.length === 0 && lowCoverageSkinTypes.length === 0) {
    report += `✅ **Excellent coverage!** All categories, concerns, and skin types have ≥90% coverage.\n\n`;
  }
  
  report += `---\n\n`;
  report += `*Report generated by Product Coverage Analysis Tool*\n`;
  
  // Write report
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`📄 Report generated: ${reportPath}`);
  
  return reportPath;
}

