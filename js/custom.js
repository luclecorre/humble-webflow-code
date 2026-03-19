// =============================================================================
// BUNNY BACKGROUND VIDEO
// =============================================================================

function initBunnyPlayerBackground(playerEl) {
  var players = playerEl
    ? [playerEl]
    : Array.from(document.querySelectorAll("[data-bunny-background-init]"));
  players.forEach(function (player) {
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
      if (!player.hasAttribute("data-player-activated")) setActivated(false);

      // Flags
      var lazyMode = player.getAttribute("data-player-lazy"); // "true" | "false" (no meta)
      var isLazyTrue = lazyMode === "true";
      var autoplay = player.getAttribute("data-player-autoplay") === "true";
      var initialMuted = player.getAttribute("data-player-muted") === "true";

      // Used to suppress 'ready' flicker when user just pressed play in lazy modes
      var pendingPlay = false;

      // Autoplay forces muted + loop; IO will drive play/pause
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
      var userInteracted = false;
      var lastPauseBy = ""; // 'io' | 'manual' | ''
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
              // Find 1080p level (height === 1080)
              var level1080 = data.levels.findIndex(function(level) {
                return level.height === 1080;
              });
              // Use 1080p if found, otherwise fallback to highest quality
              hls.startLevel = level1080 !== -1 ? level1080 : data.levels.length - 1;
            }
            readyIfIdle(player, pendingPlay);
          });
          player._hls = hls;
        } else {
          video.src = src;
        }
      }

      // Initialize based on lazy mode
      if (isLazyTrue) {
        video.preload = "none";
      } else {
        attachMediaOnce();
      }

      // Toggle play/pause
      function togglePlay() {
        userInteracted = true;
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

      // In-view auto play/pause (only when autoplay is true)
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

  // Helper: Ready status guard
  function readyIfIdle(player, pendingPlay) {
    if (
      !pendingPlay &&
      player.getAttribute("data-player-activated") !== "true" &&
      player.getAttribute("data-player-status") === "idle"
    ) {
      player.setAttribute("data-player-status", "ready");
    }
  }

  // Helper: safe programmatic play
  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === "function") p.catch(function () {});
  }
}

// Set posters immediately on DOMContentLoaded (no delay) so something is
// visible as soon as the element enters the viewport during scroll
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-bunny-background-init]").forEach(function (player) {
    var src = player.getAttribute("data-player-src");
    if (!src) return;
    var video = player.querySelector("video");
    if (!video || video.getAttribute("poster")) return;
    var thumbnailSrc = src.replace(/playlist\.m3u8([^]*)?$/, "thumbnail.jpg");
    video.setAttribute("poster", thumbnailSrc);
  });
});

// Initialize Bunny HTML HLS Player (Background)
// data-player-init values:
//   "loader"     (default) — init when loader animation completes
//   "immediate"  — init straight away on DOMContentLoaded, ignores loader
//   "visible"    — init only when element first scrolls into view
function initBunnyPlayerBackgroundAll(mode) {
  document.querySelectorAll("[data-bunny-background-init]").forEach(function (player) {
    var initMode = player.getAttribute("data-player-init") || "loader";
    if (mode === "immediate" && initMode === "immediate") {
      initBunnyPlayerBackground(player);
    } else if (mode === "loader" && initMode === "loader") {
      initBunnyPlayerBackground(player);
    } else if (mode === "loader" && initMode === "visible") {
      var visibleIO = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            obs.unobserve(player);
            initBunnyPlayerBackground(player);
          }
        });
      }, { threshold: 0.1 });
      visibleIO.observe(player);
    }
  });
}

// Immediate players init on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  initBunnyPlayerBackgroundAll("immediate");
});

document.addEventListener("loaderComplete", function () {
  initBunnyPlayerBackgroundAll("loader");
});
// Fallback: if loader is absent (e.g. Webflow preview), init after DOM ready
document.addEventListener("DOMContentLoaded", function () {
  var wrap = document.querySelector("[data-load-wrap]");
  if (!wrap) initBunnyPlayerBackgroundAll("loader");
});

// =============================================================================
// BUNNY BACKGROUND VIDEO (SIMPLE MP4)
// =============================================================================

function initBunnyPlayerSimple() {
  document
    .querySelectorAll("[data-bunny-simple-init]")
    .forEach(function (player) {
      var src = player.getAttribute("data-player-src");
      if (!src) return;

      var video = player.querySelector("video");
      if (!video) return;

      // Clean up existing video source
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
      if (!player.hasAttribute("data-player-activated")) setActivated(false);
      if (!player.hasAttribute("data-player-status")) setStatus("idle");

      // Configuration flags
      var lazyMode = player.getAttribute("data-player-lazy");
      var isLazy = lazyMode === "true";
      var autoplay = player.getAttribute("data-player-autoplay") === "true";
      var initialMuted = player.getAttribute("data-player-muted") === "true";

      // Autoplay forces muted + loop
      if (autoplay) {
        video.muted = true;
        video.loop = true;
      } else {
        video.muted = initialMuted;
      }

      // Video attributes
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.playsInline = true;
      if (typeof video.disableRemotePlayback !== "undefined")
        video.disableRemotePlayback = true;
      if (autoplay) video.autoplay = false;

      // Load video source
      var isAttached = false;
      var lastPauseBy = ""; // 'io' | 'manual' | ''

      function attachVideo() {
        if (isAttached) return;
        isAttached = true;
        video.preload = isLazy ? "none" : "auto";
        video.src = src;
      }

      // Initialize based on lazy mode
      if (!isLazy) {
        attachVideo();
      }

      // Toggle play/pause
      function togglePlay() {
        if (video.paused || video.ended) {
          if (isLazy && !isAttached) attachVideo();
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

      // Media event listeners
      video.addEventListener("play", function () {
        setActivated(true);
        setStatus("playing");
      });
      video.addEventListener("playing", function () {
        setStatus("playing");
      });
      video.addEventListener("pause", function () {
        setStatus("paused");
      });
      video.addEventListener("waiting", function () {
        setStatus("loading");
      });
      video.addEventListener("canplay", function () {
        if (player.getAttribute("data-player-activated") !== "true") {
          setStatus("ready");
        }
      });
      video.addEventListener("ended", function () {
        setStatus("paused");
        setActivated(false);
      });

      // IntersectionObserver for autoplay
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
                if (isLazy && !isAttached) attachVideo();
                if (
                  lastPauseBy === "io" ||
                  (video.paused && lastPauseBy !== "manual")
                ) {
                  setStatus("loading");
                  safePlay(video);
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

  // Helper: safe programmatic play
  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === "function") p.catch(function () {});
  }
}

// Initialize Bunny Simple MP4 Player (Background) — after loader finishes
document.addEventListener("loaderComplete", function () {
  initBunnyPlayerSimple();
});
// Fallback: if loader is absent (e.g. Webflow preview), init after DOM ready
document.addEventListener("DOMContentLoaded", function () {
  var wrap = document.querySelector("[data-load-wrap]");
  if (!wrap) initBunnyPlayerSimple();
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