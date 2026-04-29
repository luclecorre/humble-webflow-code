// =============================================================================
// BUNNY BACKGROUND VIDEO
// =============================================================================

function initBunnyPlayerBackground() {
  document.querySelectorAll("[data-bunny-background-init]").forEach(function (player) {
    var src = player.getAttribute("data-player-src");
    if (!src) return;

    var video = player.querySelector("video");
    if (!video) return;

    try { video.pause(); } catch (_) {}
    try { video.removeAttribute("src"); video.load(); } catch (_) {}

    function setStatus(s) {
      if (player.getAttribute("data-player-status") !== s)
        player.setAttribute("data-player-status", s);
    }
    setStatus("idle");

    var autoplay = player.getAttribute("data-player-autoplay") === "true";
    var isLazyTrue = player.getAttribute("data-player-lazy") === "true";

    // Background videos are always muted; loop only when autoplay is on.
    video.muted = true;
    if (autoplay) {
      video.loop = true;
      video.autoplay = false;
    }
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== "undefined")
      video.disableRemotePlayback = true;

    var isSafariNative = !!video.canPlayType("application/vnd.apple.mpegurl");
    var canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    var isAttached = false;
    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) {
        try { player._hls.destroy(); } catch (_) {}
        player._hls = null;
      }

      if (isSafariNative) {
        video.preload = isLazyTrue ? "none" : "auto";
        video.src = src;
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function () { hls.loadSource(src); });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    if (isLazyTrue) {
      video.preload = "none";
    } else {
      attachMediaOnce();
    }

    // Set status on "playing" (not "play") so the thumbnail overlay only fades
    // out once the first frame is decoded and on screen — avoids the Safari
    // black flash where "play" fires 300–500ms before the first frame renders.
    video.addEventListener("playing", function () { setStatus("playing"); });
    video.addEventListener("pause",   function () { setStatus("paused"); });
    video.addEventListener("waiting", function () { setStatus("loading"); });

    if (autoplay) {
      if (player._io) {
        try { player._io.disconnect(); } catch (_) {}
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if (video.paused) {
              setStatus("loading");
              safePlay(video);
            }
          } else {
            if (!video.paused && !video.ended) {
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
      player._io = io;
    }
  });

  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === "function") p.catch(function () {});
  }
}

var _playersInitialized = false;
function _initPlayers() {
  if (_playersInitialized) return;
  _playersInitialized = true;
  initBunnyPlayerBackground();
}

document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector("[data-load-wrap]")) {
    document.body.style.overflow = "hidden";
    // Stop Lenis smooth scroll during preloader (overflow:hidden doesn't affect it)
    if (window.lenis) window.lenis.stop();
  }

  // Thumbnail/placeholder is handled by .bunny-bg__placeholder in Webflow — no JS poster fetch needed.

  // Init players immediately so the video starts buffering during the preloader.
  // By the time the loader clears, the video is already playing underneath it.
  // The _playersInitialized guard prevents double-init from loaderComplete.
  _initPlayers();

  var wrap = document.querySelector("[data-load-wrap]");
  if (wrap) {
    // Still watch for the loader being hidden to re-enable scroll.
    var mo = new MutationObserver(function () {
      if (wrap.style.display === "none") {
        mo.disconnect();
        document.body.style.overflow = "";
        if (window.lenis) window.lenis.start();
      }
    });
    mo.observe(wrap, { attributes: true, attributeFilter: ["style"] });
  }
});

document.addEventListener("loaderComplete", function () {
  document.body.style.overflow = "";
  if (window.lenis) window.lenis.start();
  _initPlayers();
});

// =============================================================================
// SERVICE LABEL TAGS
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.portfolio-tag-item').forEach(item => {
    const label = item.querySelector('.service-label');
    if (!label) return;
    
    const text = label.textContent.trim().toUpperCase();
    
    switch(text) {
      case 'CREATIVE':
        item.style.borderRadius = '0.2em';
        break;
      case 'MARKETING':
        item.style.padding = '0 0.2em';
        item.style.borderRadius = '2em';
        break;
      case 'STRATEGY':
        item.style.borderRadius = '0';
        break;
      case 'WEBSITE':
        item.style.borderRadius = '0.4em';
        break;
    }
  });
});

// =============================================================================
// Hide loader in Preview mode
// =============================================================================

if (window.location.hostname.includes('canvas.webflow.com')) {
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

// =============================================================================
// WEBP ANIMATION FIX
// Webflow's responsive image treatment adds srcset/sizes to all <img> elements,
// which causes browsers to select a static resized variant instead of playing
// the original animated WebP. This removes those attributes when the src ends
// in .webp so the browser always loads the original file.
// =============================================================================

(function initWebpAnimationFix() {
  function fixWebpImages() {
    document.querySelectorAll('img[srcset], img[sizes]').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (src.toLowerCase().endsWith('.webp')) {
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', fixWebpImages);
}());