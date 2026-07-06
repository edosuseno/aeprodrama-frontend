const fs = require('fs');
const path = require('path');

const filesToFix = [
    'dramanova/[id]/page.tsx',
    'dramawave/[id]/page.tsx',
    'freereels/[bookId]/[episodeId]/page.tsx',
    'idrama2/[id]/page.tsx',
    'netshort/[shortPlayId]/page.tsx',
    'shortmax/[shortPlayId]/page.tsx',
    'stardusttv/[id]/page.tsx',
    'vigloo/[id]/page.tsx'
];

const watchDir = path.join(__dirname, 'src', 'app', 'watch');

for (const relPath of filesToFix) {
    const file = path.join(watchDir, relPath);
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf8');
    
    // Fix the broken addLog syntax
    // It looks like:
    // video.play().catch((e) => addLog(`Autoplay diblokir: ${e.message\n                hls.on
    // OR something similar.
    content = content.replace(
        /video\.play\(\)\.catch\(\(e\) => addLog\(\`Autoplay diblokir: \$\{e\.message\s+hls\.on/g,
        "video.play().catch((e) => addLog(`Autoplay diblokir: ${e.message}`));\n                });\n                hls.on"
    );

    content = content.replace(
        /video\.play\(\)\.catch\(\(e\) => addLog\(\`Autoplay Safari diblokir: \$\{e\.message\s+hls\.on/g,
        "video.play().catch((e) => addLog(`Autoplay Safari diblokir: ${e.message}`));\n                });\n                hls.on"
    );

    // Some might have different strings like "Gagal putar: "
    content = content.replace(
        /video\.play\(\)\.catch\(\(e\) => console\.log\(\`Autoplay diblokir: \$\{e\.message\s+hls\.on/g,
        "video.play().catch((e) => console.log(`Autoplay diblokir: ${e.message}`));\n                });\n                hls.on"
    );
    
    // Catch-all for any broken template string before hls.on
    content = content.replace(
        /(\$\{e\.message)\s+(hls\.on\(Hls\.Events\.ERROR)/g,
        "$1}\`));\n                });\n                $2"
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Restored syntax in: ${file}`);
}
console.log("Done");
