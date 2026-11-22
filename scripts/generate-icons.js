const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const iconsDir = path.join(process.cwd(), "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Crisp SVG of BukuKAS Wallet Logo with Dark Slate background & Emerald accent
const createSvg = (size, paddingPercent = 0.18) => {
  const pad = size * paddingPercent;
  const contentSize = size - pad * 2;
  const cornerRadius = size * 0.22;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background Card -->
    <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#0f172a"/>
    
    <!-- Subtle Inner Border -->
    <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${cornerRadius - 2}" fill="none" stroke="#1e293b" stroke-width="4"/>

    <!-- Centered Wallet Icon Group -->
    <g transform="translate(${pad}, ${pad}) scale(${contentSize / 24})">
      <!-- Wallet Body Outline -->
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" 
            fill="none" 
            stroke="#ffffff" 
            stroke-width="1.8" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" 
            fill="none" 
            stroke="#ffffff" 
            stroke-width="1.8" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      
      <!-- Wallet Clasp in Vibrant Emerald -->
      <path d="M16 12h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5a2 2 0 0 1-2-2 2 2 0 0 1 2-2z" 
            fill="#10b981" 
            stroke="#059669" 
            stroke-width="0.8"/>
      
      <!-- Clasp Pin / Dot -->
      <circle cx="18" cy="14" r="1" fill="#ffffff"/>
    </g>
  </svg>`;
};

async function generate() {
  const targets = [
    { name: "apple-touch-icon.png", size: 180, pad: 0.15 },
    { name: "icon-192.png", size: 192, pad: 0.16 },
    { name: "icon-512.png", size: 512, pad: 0.18 },
    { name: "icon-maskable-512.png", size: 512, pad: 0.22 }, // Maskable requires safe zone padding
    { name: "favicon-32x32.png", size: 32, pad: 0.1 },
    { name: "favicon-16x16.png", size: 16, pad: 0.1 },
  ];

  for (const t of targets) {
    const svg = Buffer.from(createSvg(t.size, t.pad));
    const outputPath = path.join(iconsDir, t.name);
    await sharp(svg).png().toFile(outputPath);
    console.log(`Generated: ${t.name} (${t.size}x${t.size})`);
  }
}

generate().catch(console.error);
