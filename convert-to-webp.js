const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function findImages(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!file.name.includes('node_modules') && !file.name.startsWith('.')) {
        await findImages(filePath, fileList);
      }
    } else if (/\.(jpg|jpeg|png)$/i.test(file.name)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function convertToWebP(imagePath) {
  const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  try {
    await sharp(imagePath)
      .rotate() // corrige a orientação EXIF
      .webp({ 
        quality: 90,
        effort: 6,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        reductionEffort: 6
      })
      .toFile(webpPath);
    
    const originalStats = await fs.stat(imagePath);
    const webpStats = await fs.stat(webpPath);
    const reduction = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);
    
    console.log(`✓ ${path.basename(imagePath)} → ${path.basename(webpPath)} (${reduction}% menor)`);
    return { success: true, reduction };
  } catch (error) {
    console.error(`✗ Falha ao converter ${imagePath}: ${error.message}`);
    return { success: false };
  }
}

async function main() {
  console.log('🔍 Procurando imagens...');
  const images = await findImages('./src');
  
  console.log(`📂 Encontradas ${images.length} imagens para converter\n`);
  
  let converted = 0;
  let totalReduction = 0;
  
  for (const imagePath of images) {
    const result = await convertToWebP(imagePath);
    if (result.success) {
      converted++;
      totalReduction += parseFloat(result.reduction);
    }
  }
  
  console.log(`\n✅ Convertidas ${converted}/${images.length} imagens`);
  if (converted > 0) {
    console.log(`📉 Redução média: ${(totalReduction / converted).toFixed(1)}%`);
  }
}

main().catch(err => {
  console.error("Erro inesperado:", err.message);
});
