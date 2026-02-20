#!/usr/bin/env node
/**
 * Generate PNG assets from SVG using Sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

async function generateFavicons() {
  const iconSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'));
  
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' },
  ];

  for (const { size, name } of sizes) {
    try {
      await sharp(iconSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (e) {
      console.log(`✗ Failed ${name}: ${e.message}`);
    }
  }

  // Generate favicon.ico (just use 32x32 as .ico)
  try {
    await sharp(iconSvg)
      .resize(32, 32)
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Generated favicon.ico');
  } catch (e) {
    console.log(`✗ Failed favicon.ico: ${e.message}`);
  }
}

generateFavicons().then(() => {
  console.log('\n✅ Favicon generation complete!');
}).catch(console.error);
