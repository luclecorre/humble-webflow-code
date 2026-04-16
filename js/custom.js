// =============================================================================
// BUNNY BACKGROUND VIDEO
// =============================================================================

function initBunnyPlayerBackground() {
  document.querySelectorAll("[data-bunny-background-init]").forEach(function (player) {
      var src = player.getAttribute("data-player-src");

      if (!src) return;

      var video = player.querySelector("video");
      if (!video) return;

      try {
        video.pause();
      } catch (_) {}
      try {
        video.removeAttribute("src");
        video.load();
      } catch (_) {}

      // Attribute helpers
      function setStatus(s) {
        if (player.getAttribute("data-player-status") !== s) {
          player.setAttribute("data-player-status", s);
        }
      }
      function setActivated(v) {
        player.setAttribute("data-player-activated", v ? "true" : "false");
      }
      setActivated(false);
      setStatus("idle");

      // Flags
      var lazyMode = player.getAttribute("data-player-lazy");
      var isLazyTrue = lazyMode === "true";
      var autoplay = player.getAttribute("data-player-autoplay") === "true";
      var initialMuted = player.getAttribute("data-player-muted") === "true";
      var pendingPlay = false;
      if (autoplay) {
        video.muted = true;
        video.loop = true;
      } else {
        video.muted = initialMuted;
      }

      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.playsInline = true;
      if (typeof video.disableRemotePlayback !== "undefined")
        video.disableRemotePlayback = true;
      if (autoplay) video.autoplay = false;

      var isSafariNative = !!video.canPlayType("application/vnd.apple.mpegurl");
      var canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

      // Attach media only once (for actual playback)
      var isAttached = false;
      var lastPauseBy = "";
      function attachMediaOnce() {
        if (isAttached) return;
        isAttached = true;

        if (player._hls) {
          try {
            player._hls.destroy();
          } catch (_) {}
          player._hls = null;
        }

        if (isSafariNative) {
          video.preload = isLazyTrue ? "none" : "auto";
          video.src = src;
          video.addEventListener(
            "loadedmetadata",
            function () {
              readyIfIdle(player, pendingPlay);
            },
            { once: true }
          );
        } else if (canUseHlsJs) {
          var hls = new Hls({ maxBufferLength: 10 });
          hls.attachMedia(video);
          hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            hls.loadSource(src);
          });
          hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            if (data && data.levels && data.levels.length) {
              var level1080 = data.levels.findIndex(function(level) {
                return level.height === 1080;
              });
              hls.startLevel = level1080 !== -1 ? level1080 : data.levels.length - 1;
            }
            readyIfIdle(player, pendingPlay);
          });
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

      // Toggle play/pause
      function togglePlay() {
        if (video.paused || video.ended) {
          if (isLazyTrue && !isAttached) attachMediaOnce();
          pendingPlay = true;
          lastPauseBy = "";
          setStatus("loading");
          safePlay(video);
        } else {
          lastPauseBy = "manual";
          video.pause();
        }
      }

      // Toggle mute
      function toggleMute() {
        video.muted = !video.muted;
        player.setAttribute(
          "data-player-muted",
          video.muted ? "true" : "false"
        );
      }

      // Controls (delegated)
      player.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-player-control]");
        if (!btn || !player.contains(btn)) return;
        var type = btn.getAttribute("data-player-control");
        if (type === "play" || type === "pause" || type === "playpause")
          togglePlay();
        else if (type === "mute") toggleMute();
      });

      // Media event wiring
      video.addEventListener("play", function () {
        setActivated(true);
        setStatus("playing");
      });
      video.addEventListener("playing", function () {
        pendingPlay = false;
        setStatus("playing");
      });
      video.addEventListener("pause", function () {
        pendingPlay = false;
        setStatus("paused");
      });
      video.addEventListener("waiting", function () {
        setStatus("loading");
      });
      video.addEventListener("canplay", function () {
        readyIfIdle(player, pendingPlay);
      });
      video.addEventListener("ended", function () {
        pendingPlay = false;
        setStatus("paused");
        setActivated(false);
      });

      // In-view auto play/pause
      if (autoplay) {
        if (player._io) {
          try {
            player._io.disconnect();
          } catch (_) {}
        }
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              var inView = entry.isIntersecting && entry.intersectionRatio > 0;
              if (inView) {
                if (isLazyTrue && !isAttached) attachMediaOnce();
                if (
                  lastPauseBy === "io" ||
                  (video.paused && lastPauseBy !== "manual")
                ) {
                  setStatus("loading");
                  if (video.paused) togglePlay();
                  lastPauseBy = "";
                }
              } else {
                if (!video.paused && !video.ended) {
                  lastPauseBy = "io";
                  video.pause();
                }
              }
            });
          },
          { threshold: 0.1 }
        );
        io.observe(player);
        player._io = io;
      }
    });

  function readyIfIdle(player, pendingPlay) {
    if (
      !pendingPlay &&
      player.getAttribute("data-player-activated") !== "true" &&
      player.getAttribute("data-player-status") === "idle"
    ) {
      player.setAttribute("data-player-status", "ready");
    }
  }

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
  }

  var BUNNY_LIBRARY_ID = "543476";
  var BUNNY_READONLY_KEY = "0f09a733-fe45-44a2-ac7195856aca-a7b9-4d8a";

  var players = Array.from(document.querySelectorAll("[data-bunny-background-init]")).filter(function (player) {
    var src = player.getAttribute("data-player-src");
    var video = player.querySelector("video");
    return src && video && !video.getAttribute("poster");
  });

  if (players.length) {
    fetch("https://video.bunnycdn.com/library/" + BUNNY_LIBRARY_ID + "/videos?itemsPerPage=100", {
      headers: { AccessKey: BUNNY_READONLY_KEY }
    }).then(function (res) { return res.json(); }).then(function (data) {
      var map = {};
      (data.items || []).forEach(function (item) { map[item.guid] = item.thumbnailFileName; });
      players.forEach(function (player) {
        var src = player.getAttribute("data-player-src");
        var video = player.querySelector("video");
        var match = src.match(/b-cdn\.net\/([a-f0-9\-]+)\/playlist/);
        var baseUrl = src.replace(/playlist\.m3u8([^]*)?$/, "");
        var fileName = (match && map[match[1]]) || "thumbnail.jpg";
        video.setAttribute("poster", baseUrl + fileName);
      });
    }).catch(function () {
      players.forEach(function (player) {
        var src = player.getAttribute("data-player-src");
        var video = player.querySelector("video");
        video.setAttribute("poster", src.replace(/playlist\.m3u8([^]*)?$/, "thumbnail.jpg"));
      });
    });
  }

  var wrap = document.querySelector("[data-load-wrap]");
  if (!wrap) {
    _initPlayers();
  } else {
    // Watch for the loader being hidden (set by GSAP at end of preloader animation).
    // This is a fallback for when the loaderComplete event is never dispatched
    // (e.g. stale gsap-animations.js on CDN missing the .call() dispatch).
    var mo = new MutationObserver(function () {
      if (wrap.style.display === "none") {
        mo.disconnect();
        document.body.style.overflow = "";
        _initPlayers();
      }
    });
    mo.observe(wrap, { attributes: true, attributeFilter: ["style"] });
  }
});

document.addEventListener("loaderComplete", function () {
  document.body.style.overflow = "";
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