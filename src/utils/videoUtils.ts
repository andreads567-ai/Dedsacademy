/**
 * Comprehensive Video & YouTube Embed Helper
 * Handles YouTube URLs in all formats (watch?v=, youtu.be, shorts, embed, query params like &feature, &t, ?si),
 * Vimeo URLs, and direct video files (MP4, WebM, MOV, blob).
 */

export interface VideoEmbedResult {
  isEmbeddable: boolean;
  isIframe: boolean;
  embedUrl: string;
  originalUrl: string;
  platform: 'youtube' | 'vimeo' | 'direct' | 'unknown';
}

export function getVideoEmbedInfo(rawUrl: string | undefined | null): VideoEmbedResult {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      isEmbeddable: false,
      isIframe: false,
      embedUrl: '',
      originalUrl: '',
      platform: 'unknown',
    };
  }

  const url = rawUrl.trim();

  // 1. YouTube Handler
  // Matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  const isYouTube = /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i.test(url);
  if (isYouTube) {
    const ytRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
    const match = url.match(ytRegex);

    if (match && match[1]) {
      const videoId = match[1];

      // Extract optional start time (e.g. t=120, t=2m10s, start=120)
      let startSeconds: string | null = null;
      const timeMatch = url.match(/[?&](?:t|start)=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?(?:(\d+))?/i);
      if (timeMatch) {
        if (timeMatch[4]) {
          startSeconds = timeMatch[4];
        } else {
          const hours = parseInt(timeMatch[1] || '0', 10);
          const mins = parseInt(timeMatch[2] || '0', 10);
          const secs = parseInt(timeMatch[3] || '0', 10);
          const total = hours * 3600 + mins * 60 + secs;
          if (total > 0) startSeconds = total.toString();
        }
      }

      const params = new URLSearchParams({
        rel: '0',
        enablejsapi: '1',
      });

      if (startSeconds) {
        params.set('start', startSeconds);
      }

      const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

      return {
        isEmbeddable: true,
        isIframe: true,
        embedUrl,
        originalUrl: url,
        platform: 'youtube',
      };
    }
  }

  // 2. Vimeo Handler
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isEmbeddable: true,
      isIframe: true,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
      originalUrl: url,
      platform: 'vimeo',
    };
  }

  // 3. Direct Video Files (MP4, WebM, OGG, MOV, blob, or data video)
  const isDirect =
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ||
    url.startsWith('blob:') ||
    url.startsWith('data:video/');

  if (isDirect) {
    return {
      isEmbeddable: true,
      isIframe: false,
      embedUrl: url,
      originalUrl: url,
      platform: 'direct',
    };
  }

  // 4. Fallback: If it's a web link, assume iframe embed or direct
  const isWebUrl = url.startsWith('http://') || url.startsWith('https://');
  return {
    isEmbeddable: isWebUrl,
    isIframe: isWebUrl,
    embedUrl: url,
    originalUrl: url,
    platform: 'unknown',
  };
}
