#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '..', 'resources');

// Ensure resources directory exists
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

// Brand color
const brandColor = { r: 99, g: 102, b: 241 };

// Create app icon (1024x1024)
sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: brandColor
  }
})
  .png()
  .toFile(path.join(resourcesDir, 'icon.png'))
  .then(() => console.log('✓ Created icon.png (1024x1024)'))
  .catch(err => console.error('Error creating icon:', err));

// Create splash screen (2732x2732)
sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: brandColor
  }
})
  .png()
  .toFile(path.join(resourcesDir, 'splash.png'))
  .then(() => console.log('✓ Created splash.png (2732x2732)'))
  .catch(err => console.error('Error creating splash:', err));

console.log('\nPlaceholder assets created successfully!');
console.log('\nNOTE: These are simple colored squares with the brand color (#6366f1).');
console.log('For production, replace these files with professional designs that include:');
console.log('- icon.png: CreatorX logo on brand color background');
console.log('- splash.png: CreatorX logo with tagline');
console.log('\nAfter replacing, run: npx @capacitor/assets generate');
