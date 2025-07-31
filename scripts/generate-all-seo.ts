#!/usr/bin/env tsx

/**
 * Script to generate SEO titles and descriptions for all drugs
 * Uses the existing POST /api/drugs/:slug/generate-seo endpoint
 */

const API_BASE_URL = 'http://localhost:3001';

interface Drug {
  slug: string;
  drugName: string;
  labeler?: string;
}

interface DrugListResponse {
  drugs: Drug[];
  total: number;
}

interface SeoGenerationResult {
  slug: string;
  drugName: string;
  success: boolean;
  error?: string;
  title?: string;
  metaDescription?: string;
}

async function fetchAllDrugs(): Promise<Drug[]> {
  console.log('📊 Fetching all drugs from the database...');
  
  const allDrugs: Drug[] = [];
  let offset = 0;
  const limit = 100; // Fetch in batches of 100
  
  while (true) {
    const response = await fetch(`${API_BASE_URL}/api/drugs?limit=${limit}&offset=${offset}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drugs: ${response.status} ${response.statusText}`);
    }
    
    const data: DrugListResponse = await response.json();
    
    if (data.drugs.length === 0) {
      break; // No more drugs to fetch
    }
    
    allDrugs.push(...data.drugs);
    offset += limit;
    
    console.log(`  📦 Fetched ${allDrugs.length} of ${data.total} drugs`);
  }
  
  console.log(`✅ Total drugs found: ${allDrugs.length}`);
  return allDrugs;
}

async function generateSeoForDrug(drug: Drug): Promise<SeoGenerationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/drugs/${drug.slug}/generate-seo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return {
        slug: drug.slug,
        drugName: drug.drugName,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    const seoData = await response.json();
    
    return {
      slug: drug.slug,
      drugName: drug.drugName,
      success: true,
      title: seoData.title,
      metaDescription: seoData.metaDescription,
    };
  } catch (error) {
    return {
      slug: drug.slug,
      drugName: drug.drugName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function generateSeoForAllDrugs(drugs: Drug[], testMode: boolean = false): Promise<void> {
  const drugsToProcess = testMode ? drugs.slice(0, 3) : drugs;
  const results: SeoGenerationResult[] = [];
  
  console.log(`\n🚀 Starting SEO generation for ${drugsToProcess.length} drugs ${testMode ? '(TEST MODE)' : ''}...`);
  console.log('⚠️  This may take a while due to Claude API rate limits.\n');
  
  for (let i = 0; i < drugsToProcess.length; i++) {
    const drug = drugsToProcess[i];
    const progress = `[${i + 1}/${drugsToProcess.length}]`;
    
    console.log(`${progress} Generating SEO for: ${drug.drugName} (${drug.slug})`);
    
    const result = await generateSeoForDrug(drug);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✅ Success: "${result.title?.substring(0, 50)}..."`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
    
    // Add a small delay to be respectful of API rate limits
    if (i < drugsToProcess.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 SEO Generation Summary:`);
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log(`\n❌ Failed Drugs:`);
    results.filter(r => !r.success).forEach(result => {
      console.log(`  • ${result.drugName} (${result.slug}): ${result.error}`);
    });
  }
}

async function main() {
  const testMode = process.argv.includes('--test');
  
  try {
    console.log('🧬 Drug SEO Generation Script');
    console.log('=============================\n');
    
    // Fetch all drugs
    const drugs = await fetchAllDrugs();
    
    if (drugs.length === 0) {
      console.log('⚠️  No drugs found in the database.');
      return;
    }
    
    // Generate SEO for all drugs
    await generateSeoForAllDrugs(drugs, testMode);
    
    console.log('\n🎉 SEO generation complete!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();