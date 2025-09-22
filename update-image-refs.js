const fs = require('fs').promises;
const path = require('path');

async function findFiles(dir, extensions, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!file.name.includes('node_modules') && !file.name.startsWith('.')) {
        await findFiles(filePath, extensions, fileList);
      }
    } else if (extensions.some(ext => file.name.endsWith(ext))) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function updateImageReferences(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Replace .png, .jpg, .jpeg with .webp
    content = content.replace(/\.png(?=["'\s\)])/gi, '.webp');
    content = content.replace(/\.jpg(?=["'\s\)])/gi, '.webp');
    content = content.replace(/\.jpeg(?=["'\s\)])/gi, '.webp');
    
    // Special case for JPG uppercase
    content = content.replace(/\.JPG(?=["'\s\)])/g, '.webp');
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✓ Updated: ${path.relative('.', filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Finding files to update...\n');
  
  const extensions = ['.njk', '.html', '.css', '.scss', '.js', '.jsx', '.ts', '.tsx'];
  const files = await findFiles('./src', extensions);
  
  console.log(`Found ${files.length} files to check\n`);
  
  let updated = 0;
  for (const file of files) {
    if (await updateImageReferences(file)) {
      updated++;
    }
  }
  
  console.log(`\n✓ Updated ${updated} files with WebP references`);
}

main().catch(console.error);