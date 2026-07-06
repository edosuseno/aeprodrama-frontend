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

    // 1. Expose rawVideoUrl from useMemo if it exists
    if (content.includes('const { processedVideoUrl, processedSubtitleUrl } = useMemo(() => {')) {
        content = content.replace(
            'const { processedVideoUrl, processedSubtitleUrl } = useMemo(() => {',
            'const { processedVideoUrl, processedSubtitleUrl, rawVideoUrl } = useMemo(() => {'
        );
        content = content.replace(
            'return { processedVideoUrl: pUrl, processedSubtitleUrl: pSub };',
            'return { processedVideoUrl: pUrl, processedSubtitleUrl: pSub, rawVideoUrl: url };'
        );
        content = content.replace(
            'return { processedVideoUrl: "", processedSubtitleUrl: "" };',
            'return { processedVideoUrl: "", processedSubtitleUrl: "", rawVideoUrl: "" };'
        );
    } else if (content.includes('const { processedVideoUrl } = useMemo(() => {')) {
        content = content.replace(
            'const { processedVideoUrl } = useMemo(() => {',
            'const { processedVideoUrl, rawVideoUrl } = useMemo(() => {'
        );
        content = content.replace(
            'return { processedVideoUrl: pUrl };',
            'return { processedVideoUrl: pUrl, rawVideoUrl: url };'
        );
        content = content.replace(
            'return { processedVideoUrl: "" };',
            'return { processedVideoUrl: "", rawVideoUrl: "" };'
        );
    }

    // 2. Fix iOS fallback block
    // Find the HLS logic blocks
    // Usually it looks like:
    /*
        if (isHlsUrl && Hls.isSupported()) {
            ...
        } else {
            video.src = processedVideoUrl;
    */
    // We want to change the fallback to:
    /*
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = typeof rawVideoUrl !== 'undefined' ? rawVideoUrl : (typeof videoUrl !== 'undefined' ? videoUrl : processedVideoUrl);
            video.addEventListener('loadedmetadata', () => { video.play().catch(() => {}) });
        } else {
            video.src = typeof rawVideoUrl !== 'undefined' ? rawVideoUrl : processedVideoUrl;
            video.play().catch(() => {});
        }
    */
    
    // Actually, writing regex for this is hard because it varies.
    // What if we just do:
    content = content.replace(
        /else if \(video\.canPlayType\('application\/vnd\.apple\.mpegurl'\)(?: && isHlsUrl)?\) \{\s+video\.src = [a-zA-Z]+;[^}]+}/g,
        "else if (video.canPlayType('application/vnd.apple.mpegurl')) {\n                // iOS Native HLS: Must use raw URL because proxy breaks m3u8 relative chunks!\n                video.src = typeof rawVideoUrl !== 'undefined' && rawVideoUrl ? rawVideoUrl : (typeof videoUrl !== 'undefined' && videoUrl ? videoUrl : '');\n                video.addEventListener('loadedmetadata', () => { video.play().catch(() => {}) });\n            }"
    );

    // Some files don't even have canPlayType, they just have `} else { video.src = processedVideoUrl; video.play().catch(...) }`
    if (!content.includes('canPlayType')) {
        content = content.replace(
            /} else \{\s+video\.src = (processedVideoUrl|proxyUrl|proxiedUrl|finalUrlToPlay|videoUrl|src);\s+video\.play\(\)\.catch\(\(\) => \{\}\);\s+}/g,
            `} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // iOS Native HLS: Use raw URL!
                video.src = typeof rawVideoUrl !== 'undefined' && rawVideoUrl ? rawVideoUrl : (typeof videoUrl !== 'undefined' && videoUrl ? videoUrl : $1);
                video.addEventListener('loadedmetadata', () => { video.play().catch(() => {}) });
            } else {
                video.src = $1;
                video.play().catch(() => {});
            }`
        );
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
}
console.log("Done");
