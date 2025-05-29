const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Icon sizes to generate
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

// Brand colors
const colors = {
  background: '#0f0f0f',
  accent: '#F2C46D',
  border: '#333333',
  text: '#ffffff'
};

function drawTicketIcon(ctx, size) {
  const padding = size * 0.1;
  const ticketWidth = size - (padding * 2);
  const ticketHeight = size * 0.7;
  const ticketX = padding;
  const ticketY = (size - ticketHeight) / 2;
  const cornerRadius = size * 0.05;
  
  // Clear background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, size, size);
  
  // Draw ticket background
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.roundRect(ticketX, ticketY, ticketWidth, ticketHeight, cornerRadius);
  ctx.fill();
  
  // Draw ticket border
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.roundRect(ticketX, ticketY, ticketWidth, ticketHeight, cornerRadius);
  ctx.stroke();
  
  // Draw perforated edge (dashed line down the middle)
  const perfX = ticketX + ticketWidth * 0.65;
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = size * 0.015;
  ctx.setLineDash([size * 0.05, size * 0.03]);
  ctx.beginPath();
  ctx.moveTo(perfX, ticketY + cornerRadius);
  ctx.lineTo(perfX, ticketY + ticketHeight - cornerRadius);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw "P" for Phish
  if (size >= 32) {
    ctx.fillStyle = colors.background;
    ctx.font = `bold ${size * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', ticketX + ticketWidth * 0.3, ticketY + ticketHeight * 0.5);
  }
  
  // Draw small dots for texture (only on larger sizes)
  if (size >= 64) {
    ctx.fillStyle = colors.background;
    const dotSize = size * 0.008;
    for (let i = 0; i < 8; i++) {
      const x = ticketX + ticketWidth * 0.75 + (i % 2) * size * 0.08;
      const y = ticketY + ticketHeight * 0.3 + Math.floor(i / 2) * size * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Generate all icon sizes
console.log('Generating favicon files...');

sizes.forEach(({ name, size }) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  drawTicketIcon(ctx, size);
  
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(publicDir, name);
  
  fs.writeFileSync(filePath, buffer);
  console.log(`✓ Generated ${name} (${size}x${size})`);
});

// Generate favicon.ico (requires special handling)
console.log('✓ Using existing favicon.ico or create manually from favicon-32x32.png');

console.log('\nFavicon generation complete!');
console.log('Files generated:');
sizes.forEach(({ name }) => {
  console.log(`  - ${name}`);
}); 