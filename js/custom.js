// =============================================================================
// BUNNY BACKGROUND VIDEO
// =============================================================================

function initBunnyPlayerBackground() {
  document
    .querySelectorAll("[data-bunny-background-init]")
    .forEach(function (player) {
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
              // Force highest quality index
              hls.startLevel = data.levels.length - 1;
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

// Initialize Bunny HTML HLS Player (Background)
document.addEventListener("DOMContentLoaded", function () {
  initBunnyPlayerBackground();
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

// Initialize Bunny Simple MP4 Player (Background)
document.addEventListener("DOMContentLoaded", function () {
  initBunnyPlayerSimple();
});

// =============================================================================
// DYNAMIC GRID WITH RATIO CONTROL
// =============================================================================
document.addEventListener("DOMContentLoaded", function () {
  const MOBILE_BREAKPOINT = 767;
  const wrappers = document.querySelectorAll('[data-dynamic-grid="true"]');

  function applyGridStyles() {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    wrappers.forEach((wrapper) => {
      const grid = wrapper.querySelector(".cms-project-grid");
      if (!grid) return;

      const items = grid.querySelectorAll(".cms-project-item");
      const imageCount = items.length;

      // Apply grid column class based on image count
      grid.classList.remove("grid-1-col", "grid-2-col", "grid-3-col");
      grid.classList.add(
        imageCount === 1
          ? "grid-1-col"
          : imageCount === 2
          ? "grid-2-col"
          : "grid-3-col"
      );

      const isGrid1 = imageCount === 1;

      // Process each image
      items.forEach((item) => {
        const imageWrapper = item.querySelector(".image-wrapper-cms");
        const image = item.querySelector(".image-cms");

        if (!imageWrapper || !image) return;

        // Extract filename from src
        const filename = image.src.split("/").pop().toLowerCase();
        const altText = (image.alt || "").toLowerCase();

        // Check for suffixes in filename or alt text
        const hasInset =
          filename.includes("_inset") || altText.includes("[inset]");
        const hasCover =
          filename.includes("_cover") || altText.includes("[cover]");

        // Grid-1-col: special ratio handling
        if (isGrid1) {
          if (hasInset) {
            // Inset: 2:1 desktop / 1:1 mobile, cover
            imageWrapper.style.aspectRatio = isMobile ? "1 / 1" : "2 / 1";
            image.style.objectFit = "cover";
            // Mobile: zoom to crop 10% each side (scale to 125% to crop 20% total)
            image.style.transform = isMobile ? "scale(1.25)" : "scale(1)";
          } else if (hasCover) {
            // Cover: 2:1 desktop / 1:1 mobile, cover
            imageWrapper.style.aspectRatio = isMobile ? "1 / 1" : "2 / 1";
            image.style.objectFit = "cover";
          } else {
            // Default: natural ratio, cover
            imageWrapper.style.aspectRatio = "auto";
            image.style.objectFit = "cover";
          }
        } else {
          // Grid-2-col & Grid-3-col: always 1:1, always cover
          imageWrapper.style.aspectRatio = "auto";
          image.style.objectFit = "cover";
        }
      });
    });
  }

  // Initial application
  applyGridStyles();

  // Handle lazy-loaded images
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        applyGridStyles();
      }
    });
  });

  // Observe all CMS images
  document.querySelectorAll(".image-cms").forEach((img) => {
    imageObserver.observe(img);
  });

  // Debounced resize handler
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyGridStyles, 250);
  });
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