/**
 * YouTube IFrame API Singleton Loader (DEPRECATED)
 * 
 * This utility is no longer actively used. The Learning Hub now uses
 * simple iframe embeds which are more reliable. This file is kept for
 * potential future use with advanced features.
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

export const loadYouTubeAPI = (): Promise<void> => {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve();
    };

    if (!document.getElementById('yt-api-script')) {
      const script = document.createElement('script');
      script.id = 'yt-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiPromise;
};
