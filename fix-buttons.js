const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src/app/detail', function(filePath) {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        // Target 1: The button class
        const targetClass = 'className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-white transition-all hover:scale-105 shadow-lg"';
        const newClass = 'className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-primary-foreground transition-all hover:scale-105 shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"';
        
        // Target 2: The inline style
        const targetStyle = /\s*style=\{\{\s*background:\s*"var\(--gradient-primary\)"\s*\}\}/g;
        
        if (newContent.includes(targetClass)) {
            newContent = newContent.replace(targetClass, newClass);
            newContent = newContent.replace(targetStyle, '');
        }

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated:', filePath);
        }
    }
});
