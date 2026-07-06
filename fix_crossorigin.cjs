const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('d:/aeprodrama/frontend/src/app/watch');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('crossOrigin="anonymous"')) {
        content = content.replace(/\s*crossOrigin="anonymous"/g, '');
        fs.writeFileSync(file, content, 'utf8');
        count++;
        console.log('Fixed', file);
    }
});
console.log('Total fixed:', count);
