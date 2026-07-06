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

    content = content.replace(/\s*\}\"\)\);\s*\}\);/g, '');
    content = content.replace(/\s*\}\`\)\);\s*\}\);/g, '');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed syntax in: ${file}`);
    }
}
console.log("Done");
