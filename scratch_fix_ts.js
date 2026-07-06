const fs = require('fs');
const file = 'd:/aeprodrama/frontend/src/app/watch/melolo/[bookId]/[videoId]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /function HlsVideoPlayer\(\{\s+src,\s+subtitleSrc,\s+onEnded,\s+className\s+\}: \{\s+src: string;\s+subtitleSrc\?: string;\s+onEnded\?: \(\) => void;\s+className\?: string;\s+\}\) \{/,
  `function HlsVideoPlayer({
  src,
  subtitleSrc,
  onEnded,
  className,
  controlsList
}: {
  src: string;
  subtitleSrc?: string;
  onEnded?: () => void;
  className?: string;
  controlsList?: string;
}) {`
);

content = content.replace(
  /<video\s+ref=\{videoRef\}\s+controls\s+className=\{className\}\s+onEnded=\{onEnded\}\s+autoPlay\s+playsInline\s+>/,
  `<video
      ref={videoRef}
      controls
      className={className}
      onEnded={onEnded}
      autoPlay
      playsInline
      controlsList={controlsList}
    >`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HlsVideoPlayer interface');
