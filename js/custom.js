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

function initBunnyPlayerBackground() {
  document.querySelectorAll('[data-bunny-background-init]').forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    // Attribute helpers
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    // Flags
    var lazyMode   = player.getAttribute('data-player-lazy'); // "true" | "false" (no meta)
    var isLazyTrue = lazyMode === 'true';
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';

    // Used to suppress 'ready' flicker when user just pressed play in lazy modes
    var pendingPlay = false;

    // Autoplay forces muted + loop; IO will drive play/pause
    if (autoplay) { video.muted = true; video.loop = true; }
    else { video.muted = initialMuted; }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    // Attach media only once (for actual playback)
    var isAttached = false;
    var userInteracted = false;
    var lastPauseBy = ''; // 'io' | 'manual' | ''
    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = isLazyTrue ? 'none' : 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
        });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    // Initialize based on lazy mode
    if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    // Toggle play/pause
    function togglePlay() {
      userInteracted = true;
      if (video.paused || video.ended) {
        if (isLazyTrue && !isAttached) attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }

    // Toggle mute
    function toggleMute() {
      video.muted = !video.muted;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }

    // Controls (delegated)
    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    });

    // Media event wiring
    video.addEventListener('play', function() { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause', function() { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended', function() { pendingPlay = false; setStatus('paused'); setActivated(false); });

    // In-view auto play/pause (only when autoplay is true)
    if (autoplay) {
      if (player._io) { try { player._io.disconnect(); } catch(_) {} }
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
      player._io = io;
    }
  });

  // Helper: Ready status guard
  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  // Helper: safe programmatic play
  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function(){});
  }
}

// Initialize Bunny HTML HLS Player (Background)
document.addEventListener('DOMContentLoaded', function() {
  initBunnyPlayerBackground();
});


function initBunnyPlayerBasic() {
  document.querySelectorAll('[data-bunny-player-init]').forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    // Attribute helpers
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    // Flags
    var updateSize = player.getAttribute('data-player-update-size'); // "true" | "cover" | null
    var lazyMode   = player.getAttribute('data-player-lazy');        // "true" | "meta" | null
    var isLazyTrue = lazyMode === 'true';
    var isLazyMeta = lazyMode === 'meta';
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true';

    // Used to suppress 'ready' flicker when user just pressed play in lazy modes
    var pendingPlay = false;

    // Autoplay forces muted + loop; IO will drive play/pause
    video.muted = !!autoplay;
    if (autoplay) video.loop = true;

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    // Minimal ratio fetch when requested (and not already handled by lazy meta)
    if (updateSize === 'true' && !isLazyMeta) {
      if (isLazyTrue) {
        // Do nothing: no fetch, no <video> touch when lazy=true
      } else {
        var prev = video.preload;
        video.preload = 'metadata';
        var onMeta2 = function() {
          setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
          video.removeEventListener('loadedmetadata', onMeta2);
          video.preload = prev || '';
        };
        video.addEventListener('loadedmetadata', onMeta2, { once: true });
        video.src = src;
      }
    }

    //  Lazy meta fetch (duration + aspect) without attaching playback
    function fetchMetaOnce() {
      getSourceMeta(src, canUseHlsJs).then(function(meta){
        if (meta.width && meta.height) setBeforeRatio(player, updateSize, meta.width, meta.height);
        readyIfIdle(player, pendingPlay);
      });
    }

    // Attach media only once (for actual playback)
    var isAttached = false;
    var userInteracted = false;
    var lastPauseBy = ''; // 'io' | 'manual' | ''
    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = (isLazyTrue || isLazyMeta) ? 'auto' : video.preload;
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
          if (updateSize === 'true') setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
          if (updateSize === 'true') {
            var lvls = hls.levels || [];
            var best = bestLevel(lvls);
            if (best && best.width && best.height) setBeforeRatio(player, updateSize, best.width, best.height);
          }
        });
        player._hls = hls;
      } else {
        // Fallback if not HLS
        video.src = src;
      }
    }

    // Initialize based on lazy mode
    if (isLazyMeta) {
      if (updateSize === 'true') fetchMetaOnce();
      video.preload = 'none';
    } else if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    // Toggle play/pause
    function togglePlay() {
      userInteracted = true;
      if (video.paused || video.ended) {
        if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }
    
    // Toggle mute
    function toggleMute() {
      video.muted = !video.muted;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }

    // Controls (delegated)
    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    });

    // Media event wiring
    video.addEventListener('play', function() { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause', function() { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended', function() { pendingPlay = false; setStatus('paused'); setActivated(false); });

    // Ensure aspect ratio updates as soon as real dimensions exist (lazy=true path included)
    var ratioSet = false;
    function maybeSetRatioOnce() {
      if (ratioSet || updateSize !== 'true') return;
      var before = player.querySelector('[data-player-before]');
      if (!before) return;
      if (video.videoWidth && video.videoHeight) {
        before.style.paddingTop = (video.videoHeight / video.videoWidth * 100) + '%';
        ratioSet = true;
      }
    }
    video.addEventListener('loadedmetadata', function(){ maybeSetRatioOnce(); });
    video.addEventListener('loadeddata',    function(){ maybeSetRatioOnce(); });
    video.addEventListener('playing',       function(){ maybeSetRatioOnce(); });

    // Hover (basic: active on enter, idle on leave)
    function setHover(state) {
      if (player.getAttribute('data-player-hover') !== state) {
        player.setAttribute('data-player-hover', state);
      }
    }
    player.addEventListener('pointerenter', function(){ setHover('active'); });
    player.addEventListener('pointerleave', function(){ setHover('idle'); });

    // In-view auto play/pause (only when autoplay is true)
    if (autoplay) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
    }
  });

  // Helper: Ready status guard
  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  // Helper: Ratio setter
  function setBeforeRatio(player, updateSize, w, h) {
    if (updateSize !== 'true' || !w || !h) return;
    var before = player.querySelector('[data-player-before]');
    if (!before) return;
    before.style.paddingTop = (h / w * 100) + '%';
  }
  function maybeSetRatioFromVideo(player, updateSize, video) {
    if (updateSize !== 'true') return;
    var before = player.querySelector('[data-player-before]');
    if (!before) return;
    var hasPad = before.style.paddingTop && before.style.paddingTop !== '0%';
    if (!hasPad && video.videoWidth && video.videoHeight) {
      setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
    }
  }

  // Helper: best HLS level by resolution
  function bestLevel(levels) {
    if (!levels || !levels.length) return null;
    return levels.reduce(function(a, b) { return ((b.width||0) > (a.width||0)) ? b : a; }, levels[0]);
  }

  // Helper: safe programmatic play
  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function(){});
  }

  // Helper: simple URL resolver
  function resolveUrl(base, rel) { try { return new URL(rel, base).toString(); } catch(_) { return rel; } }

  // Helper: unified meta fetch (hls.js or native fetch)
  function getSourceMeta(src, useHlsJs) {
    return new Promise(function(resolve) {
      if (useHlsJs && window.Hls && Hls.isSupported()) {
        try {
          var tmp = new Hls();
          var out = { width: 0, height: 0, duration: NaN };

          tmp.on(Hls.Events.MANIFEST_PARSED, function(e, data) {
            var lvls = (data && data.levels) || tmp.levels || [];
            var best = bestLevel(lvls);
            if (best && best.width && best.height) { out.width = best.width; out.height = best.height; }
          });
          tmp.on(Hls.Events.LEVEL_LOADED, function(e, data) {
            if (data && data.details && isFinite(data.details.totalduration)) { out.duration = data.details.totalduration; }
          });
          tmp.on(Hls.Events.ERROR, function(){ try { tmp.destroy(); } catch(_) {} resolve(out); });
          tmp.on(Hls.Events.LEVEL_LOADED, function(){ try { tmp.destroy(); } catch(_) {} resolve(out); });

          tmp.loadSource(src);
          return;
        } catch(_) { resolve({ width:0, height:0, duration:NaN }); return; }
      }

      function parseMaster(masterText) {
        var lines = masterText.split(/\r?\n/);
        var bestW = 0, bestH = 0, firstMedia = null, lastInf = null;
        for (var i=0;i<lines.length;i++) {
          var line = lines[i];
          if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
            lastInf = line;
          } else if (lastInf && line && line[0] !== '#') {
            if (!firstMedia) firstMedia = line.trim();
            var m = /RESOLUTION=(\d+)x(\d+)/.exec(lastInf);
            if (m) {
              var w = parseInt(m[1],10), h = parseInt(m[2],10);
              if (w > bestW) { bestW = w; bestH = h; }
            }
            lastInf = null;
          }
        }
        return { bestW: bestW, bestH: bestH, media: firstMedia };
      }
      function sumDuration(mediaText) {
        var dur = 0, re = /#EXTINF:([\d.]+)/g, m;
        while ((m = re.exec(mediaText))) dur += parseFloat(m[1]);
        return dur;
      }

      fetch(src, { credentials: 'omit', cache: 'no-store' }).then(function(r){
        if (!r.ok) throw new Error('master');
        return r.text();
      }).then(function(master){
        var info = parseMaster(master);
        if (!info.media) { resolve({ width: info.bestW||0, height: info.bestH||0, duration: NaN }); return; }
        var mediaUrl = resolveUrl(src, info.media);
        return fetch(mediaUrl, { credentials: 'omit', cache: 'no-store' }).then(function(r){
          if (!r.ok) throw new Error('media');
          return r.text();
        }).then(function(mediaText){
          resolve({ width: info.bestW||0, height: info.bestH||0, duration: sumDuration(mediaText) });
        });
      }).catch(function(){ resolve({ width:0, height:0, duration:NaN }); });
    });
  }
}

// Initialize Bunny HTML HLS Player (Basic)
document.addEventListener('DOMContentLoaded', function() {
  initBunnyPlayerBasic();
});