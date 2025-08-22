#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

// Script to fetch data from website and convert to features.json
// Usage: node scripts/convert-data-to-features.js [local-html-file]
// If local-html-file is provided, it will read from that file instead of fetching from web

const args = process.argv.slice(2);
const localHtmlFile = args[0];

if (localHtmlFile) {
  console.log(`Reading data from local file: ${localHtmlFile}...\n`);
} else {
  console.log('Fetching data from website and converting to features.json...\n');
}

// Function to fetch HTML content from URL
function fetchWebContent(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    };
    
    const request = https.get(url, options, (response) => {
      // Check if we got a Cloudflare challenge page
      if (response.statusCode === 403 || response.statusCode === 503) {
        reject(new Error('Access blocked by Cloudflare protection. The website requires browser verification.'));
        return;
      }
      
      let stream = response;
      
      // Handle gzip/deflate compression
      if (response.headers['content-encoding'] === 'gzip') {
        stream = response.pipe(zlib.createGunzip());
      } else if (response.headers['content-encoding'] === 'deflate') {
        stream = response.pipe(zlib.createInflate());
      }
      
      let data = '';
      
      stream.on('data', (chunk) => {
        data += chunk;
      });
      
      stream.on('end', () => {
        // Check if the response is a Cloudflare challenge page
        if (data.includes('Attention Required!') || data.includes('Cloudflare')) {
          reject(new Error('Access blocked by Cloudflare protection. The website requires browser verification.'));
          return;
        }
        resolve(data);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Function to extract script content from HTML
function extractScriptContent(html) {
  // Find the quiz-element section - make the regex more flexible
  let quizElementMatch = html.match(/<quiz-element[^>]*class=["']quiz-outer-wrapper["'][^>]*>([\s\S]*?)<\/quiz-element>/i);
  
  // Try alternative patterns if the first one doesn't work
  if (!quizElementMatch) {
    quizElementMatch = html.match(/<quiz-element[^>]*>([\s\S]*?)<\/quiz-element>/i);
  }
  
  if (!quizElementMatch) {
    // Debug: show what quiz-elements we can find
    const allQuizElements = html.match(/<quiz-element[^>]*>/gi);
    if (allQuizElements) {
      console.log('🔍 Found quiz-element tags:', allQuizElements);
    } else {
      console.log('🔍 No quiz-element tags found in HTML');
      // Let's check for any script tags with window.yearNameCombos
      const yearNameCombosMatch = html.match(/window\.yearNameCombos\s*=\s*\[[\s\S]*?\]/);
      if (yearNameCombosMatch) {
        console.log('✅ Found window.yearNameCombos in HTML');
        console.log('📄 HTML length:', html.length, 'characters');
        
        // Try to extract just the script content with yearNameCombos
        const scriptWithYearNames = html.match(/<script[^>]*>[\s\S]*?window\.yearNameCombos[\s\S]*?<\/script>/gi);
        if (scriptWithYearNames) {
          console.log('📜 Found script with yearNameCombos, attempting direct extraction');
          return scriptWithYearNames.join('\n').replace(/<\/?script[^>]*>/gi, '');
        }
      } else {
        console.log('❌ No window.yearNameCombos found in HTML either');
        console.log('📄 HTML preview (first 500 chars):', html.substring(0, 500));
      }
    }
    throw new Error('Could not find quiz-element');
  }
  
  const quizContent = quizElementMatch[1];
  
  // Extract script content from within the quiz element
  const scriptMatches = quizContent.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  
  if (!scriptMatches) {
    throw new Error('Could not find script tags within quiz-element');
  }
  
  // Combine all script content
  let combinedScript = '';
  scriptMatches.forEach(scriptMatch => {
    const scriptContent = scriptMatch.replace(/<\/?script[^>]*>/gi, '');
    combinedScript += scriptContent + '\n';
  });
  
  // Check if we actually got meaningful data
  if (!combinedScript.includes('window.yearNameCombos')) {
    throw new Error('Could not find window.yearNameCombos in script content');
  }
  
  // If quizFunctionData appears to be empty, try to find it elsewhere in the HTML
  if (!combinedScript.includes('window.quizFunctionData = {') || 
      combinedScript.match(/window\.quizFunctionData\s*=\s*{\s*}/)) {
    console.log('⚠️  quizFunctionData appears empty in static HTML, checking for external data...');
    
    // Look for any external script files that might contain the data
    const externalScriptMatches = html.match(/<script[^>]*src="([^"]*)"[^>]*><\/script>/gi);
    if (externalScriptMatches) {
      console.log('📄 Found external scripts, but data might be dynamically loaded');
      console.log('   Using available yearNameCombos and creating empty categories structure');
    }
    
    // Create a minimal structure with just yearNameCombos
    combinedScript += '\nwindow.quizFunctionData = {};\n';
  }
  
  return combinedScript;
}

// Fetch and process the web content
async function fetchAndProcessData() {
  try {
    let html;
    
    if (localHtmlFile) {
      // Read from local file
      console.log(`📂 Reading HTML from local file: ${localHtmlFile}...`);
      if (!fs.existsSync(localHtmlFile)) {
        throw new Error(`Local file not found: ${localHtmlFile}`);
      }
      html = fs.readFileSync(localHtmlFile, 'utf8');
    } else {
      // Fetch from web
      console.log('🌐 Fetching data from https://www.enhauto.com/pages/buttons-functions...');
      html = await fetchWebContent('https://www.enhauto.com/pages/buttons-functions');
    }
    
    console.log('📋 Extracting script content...');
    const scriptContent = extractScriptContent(html);
    
    // Create a mock window object
    global.window = {};
    
    // Execute the script content
    console.log('⚙️ Processing JavaScript data...');
    eval(scriptContent);
    
  } catch (error) {
    console.error('❌ Error fetching or parsing web content:', error.message);
    
    if (error.message.includes('Cloudflare')) {
      console.log('\n💡 The website is protected by Cloudflare and blocks automated requests.');
      console.log('   Alternative solutions:');
      console.log('   1. Use a headless browser like Puppeteer or Playwright');
      console.log('   2. Manually save the page HTML and modify this script to read from a local file');
      console.log('   3. Use a proxy service or try from a different IP/location');
      console.log('\n   For now, you can:');
      console.log('   - Visit https://www.enhauto.com/pages/buttons-functions in your browser');
      console.log('   - Right-click and "Save As" to save the HTML file');
      console.log('   - Modify this script to read from the saved file instead');
    }
    
    process.exit(1);
  }
}

// Main execution function
async function main() {
  await fetchAndProcessData();

  // Extract and transform the data
  const quizData = window.quizFunctionData;

  if (!quizData || Object.keys(quizData).length === 0) {
    console.log('⚠️  quizFunctionData is empty or not found');
    console.log('   This might indicate that the data is loaded dynamically via JavaScript');
    console.log('   Creating a minimal structure with available yearNameCombos only');
    
    // Create a minimal result with just yearModels
    const result = {
      yearModels: window.yearNameCombos || [],
      categories: []
    };
    
    // Create _data directory if it doesn't exist
    if (!fs.existsSync('_data')) {
      fs.mkdirSync('_data');
    }

    console.log('💾 Writing minimal features.json file...');
    fs.writeFileSync('_data/features.json', JSON.stringify(result, null, 2));

    console.log('✅ Created features.json with yearModels only');
    console.log(`📊 Statistics:`);
    console.log(`   - 0 categories (data might be dynamically loaded)`);
    console.log(`   - 0 total features`);
    console.log(`   - ${result.yearModels.length} car model/year combinations`);
    console.log('\n🎉 Conversion complete (partial data)!');
    console.log('\n💡 Note: If you expected more data, the website might be using dynamic content loading.');
    console.log('   You might need to use a headless browser approach for full data extraction.');
    
    return;
  }

  console.log('📊 Processing data structure...');

  // Convert the object to an array and sort by categoryOrderNumber and orderNumber
  const sortedData = Object.entries(quizData)
    .map(([id, data]) => ({ id: parseInt(id), ...data }))
    .sort((a, b) => {
      if (a.categoryOrderNumber !== b.categoryOrderNumber) {
        return a.categoryOrderNumber - b.categoryOrderNumber;
      }
      return a.orderNumber - b.orderNumber;
    });

  // Group by category
  const categories = {};
  sortedData.forEach(item => {
    if (!categories[item.categoryName]) {
      categories[item.categoryName] = {
        name: item.categoryName,
        orderNumber: item.categoryOrderNumber,
        scenarios: []
      };
    }
    
    const scenario = {
      id: item.id,
      name: item.name,
      notes: item.notes,
      orderNumber: item.orderNumber,
      supportedDevices: {
        knobs: item.knobAvailability || [],
        buttons: item.buttonsAvailability || [],
        stalks: item.stalksAvailability || []
      }
    };
    
    categories[item.categoryName].scenarios.push(scenario);
  });

  // Convert categories to array and sort
  const result = {
    yearModels: window.yearNameCombos || [],
    categories: Object.values(categories).sort((a, b) => a.orderNumber - b.orderNumber)
  };

  // Create _data directory if it doesn't exist
  if (!fs.existsSync('_data')) {
    fs.mkdirSync('_data');
  }

  console.log('💾 Writing features.json file...');

  // Write the JSON file
  fs.writeFileSync('_data/features.json', JSON.stringify(result, null, 2));

  console.log('✅ Successfully converted web data to _data/features.json');
  console.log(`📊 Statistics:`);
  console.log(`   - ${Object.keys(categories).length} categories`);
  console.log(`   - ${sortedData.length} total features`);
  console.log(`   - ${result.yearModels.length} car model/year combinations`);
  console.log('\n🎉 Conversion complete!');
}

// Execute main function
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
