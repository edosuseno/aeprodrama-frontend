const fs = require('fs');
const path = require('path');

const watchDir = path.join(__dirname, 'src', 'app', 'watch');

function findPageFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findPageFiles(fullPath));
        } else if (file === 'page.tsx') {
            results.push(fullPath);
        }
    }
    return results;
}

const files = findPageFiles(watchDir);

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // If the file DOES NOT contain the declaration of rawVideoUrl
    if (!content.includes('rawVideoUrl } = useMemo') && !content.includes('rawVideoUrl = ')) {
        // Then we should not use rawVideoUrl in the fallback!
        // Replace: video.src = typeof rawVideoUrl !== 'undefined' && rawVideoUrl ? rawVideoUrl : (typeof videoUrl !== 'undefined' && videoUrl ? videoUrl : processedVideoUrl);
        // with: video.src = videoUrl;
        
        content = content.replace(
            /video\.src = typeof rawVideoUrl !== 'undefined' && rawVideoUrl \? rawVideoUrl : \(typeof videoUrl !== 'undefined' && videoUrl \? videoUrl : [a-zA-Z0-9_''""]+\);/g,
            "video.src = typeof videoUrl !== 'undefined' && videoUrl ? videoUrl : '';"
        );
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed TS in: ${file}`);
    }
}
console.log("Done");
