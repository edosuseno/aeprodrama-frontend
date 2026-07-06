const fs = require('fs');
const file = 'd:/aeprodrama/frontend/src/app/watch/melolo/[bookId]/[videoId]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('const { processedVideoUrl, processedSubtitleUrl, qualities } = useMemo(() => {');
const endIdx = content.indexOf('const [selectedQuality, setSelectedQuality] = useState');

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `const { processedVideoUrl, processedSubtitleUrl, qualities } = useMemo(() => {
    const streamObj = streamData as any;
    if (!streamObj) return { processedVideoUrl: "", processedSubtitleUrl: "", qualities: [] };

    const rawUrl = streamObj?.url ||
                   streamObj?.data?.url ||
                   streamObj?.data?.main_url ||
                   streamObj?.data?.play_url ||
                   streamObj?.data?.playUrl ||
                   streamObj?.data?.videoUrl ||
                   streamObj?.data?.video_url ||
                   streamObj?.main_url ||
                   streamObj?.play_url ||
                   streamObj?.playUrl ||
                   streamObj?.videoUrl ||
                   streamObj?.video_url || "";

    const rawSubtitle = streamObj?.subtitle ||
                        streamObj?.data?.subtitle || "";

    const rawQualities = streamObj?.qualities || streamObj?.data?.video_model || [];
    let extractedQualities: { name: string, url: string }[] = [];
    
    if (Array.isArray(rawQualities)) {
      extractedQualities = rawQualities.map(q => ({
        name: q.label || q.definition || q.name || "Unknown",
        url: q.url
      })).filter(q => q.url);
    }

    if (!rawUrl && extractedQualities.length === 0) return { processedVideoUrl: "", processedSubtitleUrl: "", qualities: [] };

    const addProxyIfNeeded = (url: string) => {
      if (!url) return url;
      if (url.includes("inicdn.net")) return url;
      if (url.startsWith("http") && !url.includes("vidrama.asia/api/video-proxy")) {
        const proxyPath = '/api/proxy';
        return \`\${proxyPath}?url=\${encodeURIComponent(url)}&referer=\${encodeURIComponent('https://vidrama.asia/')}&is_mp4=1\`;
      }
      return url;
    };

    let pUrl = addProxyIfNeeded(rawUrl || (extractedQualities.length > 0 ? extractedQualities[0].url : ""));
    
    let pSub = rawSubtitle;
    if (pSub && pSub.startsWith("http")) {
      if (!pSub.startsWith("/api/proxy") && !pSub.includes("vercel.app")) {
        pSub = \`/api/proxy?url=\${encodeURIComponent(pSub)}&referer=\${encodeURIComponent('https://vidrama.asia/')}\`;
      }
    }

    const processedQualities = extractedQualities.map(q => ({
      name: q.name,
      url: addProxyIfNeeded(q.url)
    }));

    return { processedVideoUrl: pUrl, processedSubtitleUrl: pSub, qualities: processedQualities };
  }, [streamData]);

  `;

  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed page.tsx');
} else {
  console.log('Could not find boundaries');
}
