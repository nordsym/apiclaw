#!/usr/bin/env node
/**
 * Generate PNG assets from SVG for APIClaw
 * - Favicons (16x16, 32x32, 180x180)
 * - OG Image (1200x630)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Create OG image HTML template
const ogImageHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #0a0a0a 0%, #171717 100%);
      font-family: 'Inter', system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px;
      position: relative;
      overflow: hidden;
    }
    
    /* Background pattern */
    .pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 40%);
      pointer-events: none;
    }
    
    /* Grid lines */
    .grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
    }
    
    .content {
      position: relative;
      z-index: 1;
    }
    
    .logo-row {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 40px;
    }
    
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    
    .brand {
      font-size: 48px;
      font-weight: 800;
      color: #fafafa;
      letter-spacing: -0.02em;
    }
    
    .tagline {
      font-size: 56px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin-bottom: 32px;
    }
    
    .tagline .gradient {
      background: linear-gradient(135deg, #f87171 0%, #ef4444 50%, #fca5a5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .tagline .white {
      color: #fafafa;
    }
    
    .subtitle {
      font-size: 24px;
      color: #a3a3a3;
      max-width: 700px;
      line-height: 1.5;
    }
    
    .footer {
      position: absolute;
      bottom: 60px;
      left: 80px;
      right: 80px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .stats {
      display: flex;
      gap: 48px;
    }
    
    .stat {
      text-align: left;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 800;
      color: #ef4444;
    }
    
    .stat-label {
      font-size: 14px;
      color: #737373;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .url {
      font-size: 20px;
      color: #525252;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="pattern"></div>
  <div class="grid"></div>
  
  <div class="content">
    <div class="logo-row">
      <div class="logo">🦞</div>
      <div class="brand">APIClaw</div>
    </div>
    
    <h1 class="tagline">
      <span class="gradient">The API layer</span><br>
      <span class="white">for AI agents</span>
    </h1>
    
    <p class="subtitle">
      Agents discover and evaluate APIs via MCP. Structured data. Ranked results. No more googling.
    </p>
  </div>
  
  <div class="footer">
    <div class="stats">
      <div class="stat">
        <div class="stat-value">1,400+</div>
        <div class="stat-label">APIs</div>
      </div>
      <div class="stat">
        <div class="stat-value">52</div>
        <div class="stat-label">Categories</div>
      </div>
      <div class="stat">
        <div class="stat-value">MCP</div>
        <div class="stat-label">Native</div>
      </div>
    </div>
    <div class="url">apiclaw.com</div>
  </div>
</body>
</html>
`;

// Write OG image HTML
fs.writeFileSync(path.join(publicDir, 'og-template.html'), ogImageHtml);
console.log('✓ Created OG image template');

// Try to generate PNGs using various methods
async function generateAssets() {
  // Check for available tools
  const hasRsvgConvert = (() => {
    try {
      execSync('which rsvg-convert', { stdio: 'pipe' });
      return true;
    } catch { return false; }
  })();

  const hasConvert = (() => {
    try {
      execSync('which convert', { stdio: 'pipe' });
      return true;
    } catch { return false; }
  })();

  const hasSips = (() => {
    try {
      execSync('which sips', { stdio: 'pipe' });
      return true;
    } catch { return false; }
  })();

  console.log(`Available tools: rsvg-convert=${hasRsvgConvert}, convert=${hasConvert}, sips=${hasSips}`);

  // Generate favicons from icon.svg
  const iconSvg = path.join(publicDir, 'icon.svg');
  
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' },
  ];

  for (const { size, name } of sizes) {
    const output = path.join(publicDir, name);
    
    if (hasRsvgConvert) {
      try {
        execSync(`rsvg-convert -w ${size} -h ${size} "${iconSvg}" -o "${output}"`, { stdio: 'pipe' });
        console.log(`✓ Generated ${name} (${size}x${size})`);
      } catch (e) {
        console.log(`✗ Failed to generate ${name}: ${e.message}`);
      }
    } else if (hasConvert) {
      try {
        execSync(`convert -background none -resize ${size}x${size} "${iconSvg}" "${output}"`, { stdio: 'pipe' });
        console.log(`✓ Generated ${name} (${size}x${size})`);
      } catch (e) {
        console.log(`✗ Failed to generate ${name}: ${e.message}`);
      }
    } else {
      console.log(`⚠ Cannot generate ${name} - no SVG converter available`);
    }
  }

  // Generate favicon.ico (multi-size ICO)
  if (hasConvert) {
    try {
      const ico16 = path.join(publicDir, 'favicon-16x16.png');
      const ico32 = path.join(publicDir, 'favicon-32x32.png');
      const icoOut = path.join(publicDir, 'favicon.ico');
      
      if (fs.existsSync(ico16) && fs.existsSync(ico32)) {
        execSync(`convert "${ico16}" "${ico32}" "${icoOut}"`, { stdio: 'pipe' });
        console.log('✓ Generated favicon.ico');
      }
    } catch (e) {
      console.log(`⚠ Could not generate favicon.ico: ${e.message}`);
    }
  }

  console.log('\\n📝 Note: For OG image, open og-template.html in browser and screenshot at 1200x630');
  console.log('   Or use: npx playwright screenshot --viewport-size=1200,630 public/og-template.html public/og-image.png');
}

generateAssets().catch(console.error);
