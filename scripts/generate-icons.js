const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG with gradient background and sparkles icon
const createIconSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#gradient)"/>

  <!-- Sparkles/Auto-awesome icon (centered and scaled) -->
  <g transform="translate(${size * 0.22}, ${size * 0.22}) scale(${size * 0.024})">
    <path fill="white" d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9z"/>
    <path fill="white" d="M19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
    <path fill="white" d="M11.5 9.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5z"/>
  </g>
</svg>
`;

// Android adaptive icon background (just gradient)
const createBackgroundSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#gradient)"/>
</svg>
`;

// Android adaptive icon foreground (just the sparkles on transparent)
const createForegroundSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Sparkles/Auto-awesome icon (centered with safe zone padding) -->
  <g transform="translate(${size * 0.3}, ${size * 0.3}) scale(${size * 0.018})">
    <path fill="white" d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9z"/>
    <path fill="white" d="M19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
    <path fill="white" d="M11.5 9.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5z"/>
  </g>
</svg>
`;

// Monochrome icon for Android (black on transparent)
const createMonochromeSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${size * 0.3}, ${size * 0.3}) scale(${size * 0.018})">
    <path fill="black" d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9z"/>
    <path fill="black" d="M19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
    <path fill="black" d="M11.5 9.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5z"/>
  </g>
</svg>
`;

async function generateIcons() {
  const assetsDir = path.join(__dirname, '..', 'assets', 'images');

  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('Generating app icons...');

  // Main icon (1024x1024)
  const iconSvg = createIconSvg(1024);
  await sharp(Buffer.from(iconSvg))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // Android adaptive icon background (1024x1024)
  const backgroundSvg = createBackgroundSvg(1024);
  await sharp(Buffer.from(backgroundSvg))
    .png()
    .toFile(path.join(assetsDir, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png (1024x1024)');

  // Android adaptive icon foreground (1024x1024)
  const foregroundSvg = createForegroundSvg(1024);
  await sharp(Buffer.from(foregroundSvg))
    .png()
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));
  console.log('✓ android-icon-foreground.png (1024x1024)');

  // Android monochrome icon (1024x1024)
  const monochromeSvg = createMonochromeSvg(1024);
  await sharp(Buffer.from(monochromeSvg))
    .png()
    .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png (1024x1024)');

  // Favicon (48x48)
  const faviconSvg = createIconSvg(48);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // Splash icon (512x512)
  const splashSvg = createIconSvg(512);
  await sharp(Buffer.from(splashSvg))
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ splash-icon.png (512x512)');

  console.log('\nAll icons generated successfully!');
  console.log('\nMake sure your app.json uses:');
  console.log('  - icon: "./assets/images/icon.png"');
  console.log('  - android.adaptiveIcon.foregroundImage: "./assets/images/android-icon-foreground.png"');
  console.log('  - android.adaptiveIcon.backgroundImage: "./assets/images/android-icon-background.png"');
  console.log('  - android.adaptiveIcon.monochromeImage: "./assets/images/android-icon-monochrome.png"');
}

generateIcons().catch(console.error);
