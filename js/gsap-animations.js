// =============================================================================
// Preloader Logo Reveal Animation
// =============================================================================
function initLogoRevealLoader(){
  gsap.registerPlugin(CustomEase);
  CustomEase.create("loader", "0.65, 0.01, 0.05, 0.99");

  const wrap = document.querySelector("[data-load-wrap]");
  if (!wrap) return;

  const container = wrap.querySelector("[data-load-container]");
  const bg = wrap.querySelector("[data-load-bg]");
  const progressBar = wrap.querySelector("[data-load-progress]");
  const logo = wrap.querySelector("[data-load-logo]");

  // Reset targets to prevent FOUC
  const resetTargets = Array.from(wrap.querySelectorAll('[data-load-reset]'));

  // Main loader timeline
  const loadTimeline = gsap.timeline({
    defaults: {
      ease: "loader",
      duration: 1
    }
  })
  .set(wrap, { display: "block" })
  .to(progressBar, { scaleX: 1 })
  .to(logo, { clipPath: "inset(0% 0% 0% 0%)" }, "<")
  .to(container, { autoAlpha: 0, duration: 0.3 })
  .set(progressBar, { autoAlpha: 0 })
  .add("hideContent")
  .to(bg, { yPercent: -101, duration: 0.6 }, "hideContent")
  .set(wrap, { display: "none" })
  .call(function () { document.dispatchEvent(new CustomEvent("loaderComplete")); });

  // If there are items to hide FOUC for, reset them at the start
  if (resetTargets.length) {
    loadTimeline.set(resetTargets, { autoAlpha: 1 }, 0);
  }
}

// Initialize Logo Reveal Loader
document.addEventListener("DOMContentLoaded", () => {
  initLogoRevealLoader();
});


// =============================================================================
// SHOW/HIDE NAVBAR ON SCROLL
// =============================================================================
function isDesktopView() {
  return window.innerWidth >= 992;
}

gsap.registerPlugin(ScrollTrigger);
let navbarScrollTrigger;

function initNavbarScrollAnimation() {
  const navbar = document.querySelector(".navbar-links");
  if (!navbar) return;

  if (navbarScrollTrigger) {
    navbarScrollTrigger.kill();
  }

  const isDesktop = isDesktopView();
  const navbarHeight = navbar.offsetHeight;

  if (isDesktop) {
    // Desktop: hide upwards by full height + padding
    const navbarShowAnim = gsap
      .from(".navbar-links", {
        y: -navbarHeight - 16, // 16px for your 1rem padding
        paused: true,
        duration: 0.2,
      })
      .progress(1);

    navbarScrollTrigger = ScrollTrigger.create({
      start: "top top",
      end: 99999,
      onUpdate: (self) => {
        self.direction === -1
          ? navbarShowAnim.play()
          : navbarShowAnim.reverse();
      },
    });
  } else {
    // Mobile: hide downwards by full height + gap
    const navbarShowAnim = gsap
      .from(".navbar-links", {
        y: navbarHeight + 48, // 48px for your 3rem gap
        paused: true,
        duration: 0.2,
      })
      .progress(1);

    navbarScrollTrigger = ScrollTrigger.create({
      start: "top top",
      end: 99999,
      onUpdate: (self) => {
        self.direction === -1
          ? navbarShowAnim.play()
          : navbarShowAnim.reverse();
      },
    });
  }
}

function destroyNavbarScrollAnimation() {
  if (navbarScrollTrigger) {
    navbarScrollTrigger.kill();
    navbarScrollTrigger = null;
  }
}

window.addEventListener("resize", () => {
  ScrollTrigger.getAll().forEach((trigger) => trigger.refresh());
});

initNavbarScrollAnimation();

// =============================================================================
// GLOBAL SCROLL REVEAL ANIMATION
// =============================================================================
gsap.registerPlugin(ScrollTrigger);

function initContentRevealScroll() {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const ctx = gsap.context(() => {
    document.querySelectorAll("[data-reveal-group]").forEach((groupEl) => {
      // Config from attributes or defaults (group-level)
      const groupStaggerSec =
        (parseFloat(groupEl.getAttribute("data-stagger")) || 100) / 1000; // ms � sec
      const groupDistance = groupEl.getAttribute("data-distance") || "2em";
      const triggerStart = groupEl.getAttribute("data-start") || "top 80%";

      const animDuration = 0.6;
      const animEase = "power4.inOut";

      // Reduced motion: show immediately
      if (prefersReduced) {
        gsap.set(groupEl, { clearProps: "all", y: 0, autoAlpha: 1 });
        return;
      }

      // If no direct children, animate the group element itself
      const directChildren = Array.from(groupEl.children).filter(
        (el) => el.nodeType === 1
      );
      if (!directChildren.length) {
        gsap.set(groupEl, { y: groupDistance, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: groupEl,
          start: triggerStart,
          once: true,
          onEnter: () =>
            gsap.to(groupEl, {
              y: 0,
              autoAlpha: 1,
              duration: animDuration,
              ease: animEase,
            }),
        });
        return;
      }

      // Build animation slots: item or nested (deep layers allowed)
      const slots = [];
      directChildren.forEach((child) => {
        const nestedGroup = child.matches("[data-reveal-group-nested]")
          ? child
          : child.querySelector(":scope [data-reveal-group-nested]");

        if (nestedGroup) {
          const includeParent =
            child.getAttribute("data-ignore") === "false" ||
            nestedGroup.getAttribute("data-ignore") === "false";
          slots.push({
            type: "nested",
            parentEl: child,
            nestedEl: nestedGroup,
            includeParent,
          });
        } else {
          slots.push({ type: "item", el: child });
        }
      });

      // Initial hidden state
      slots.forEach((slot) => {
        if (slot.type === "item") {
          // If the element itself is a nested group, force group distance (prevents it from using its own data-distance)
          const isNestedSelf = slot.el.matches("[data-reveal-group-nested]");
          const d = isNestedSelf
            ? groupDistance
            : slot.el.getAttribute("data-distance") || groupDistance;
          gsap.set(slot.el, { y: d, autoAlpha: 0 });
        } else {
          // Parent follows the group's distance when included, regardless of nested's data-distance
          if (slot.includeParent)
            gsap.set(slot.parentEl, { y: groupDistance, autoAlpha: 0 });
          // Children use nested group's own distance (fallback to group distance)
          const nestedD =
            slot.nestedEl.getAttribute("data-distance") || groupDistance;
          Array.from(slot.nestedEl.children).forEach((target) =>
            gsap.set(target, { y: nestedD, autoAlpha: 0 })
          );
        }
      });

      // Extra safety: if a nested parent is included, re-assert its distance to the group's value
      slots.forEach((slot) => {
        if (slot.type === "nested" && slot.includeParent) {
          gsap.set(slot.parentEl, { y: groupDistance });
        }
      });

      // Reveal sequence
      ScrollTrigger.create({
        trigger: groupEl,
        start: triggerStart,
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();

          slots.forEach((slot, slotIndex) => {
            const slotTime = slotIndex * groupStaggerSec;

            if (slot.type === "item") {
              tl.to(
                slot.el,
                {
                  y: 0,
                  autoAlpha: 1,
                  duration: animDuration,
                  ease: animEase,
                },
                slotTime
              );
            } else {
              // Optionally include the parent at the same slot time (parent uses group distance)
              if (slot.includeParent) {
                tl.to(
                  slot.parentEl,
                  {
                    y: 0,
                    autoAlpha: 1,
                    duration: animDuration,
                    ease: animEase,
                  },
                  slotTime
                );
              }
              // Nested children use nested stagger (ms � sec); fallback to group stagger
              const nestedMs = parseFloat(
                slot.nestedEl.getAttribute("data-stagger")
              );
              const nestedStaggerSec = isNaN(nestedMs)
                ? groupStaggerSec
                : nestedMs / 1000;
              Array.from(slot.nestedEl.children).forEach(
                (nestedChild, nestedIndex) => {
                  tl.to(
                    nestedChild,
                    {
                      y: 0,
                      autoAlpha: 1,
                      duration: animDuration,
                      ease: animEase,
                    },
                    slotTime + nestedIndex * nestedStaggerSec
                  );
                }
              );
            }
          });
        },
      });
    });
  });

  return () => ctx.revert();
}

// Initialize Content Reveal on Scroll
let contentRevealCleanup;
document.addEventListener("DOMContentLoaded", () => {
  contentRevealCleanup = initContentRevealScroll();
});

// =============================================================================
// HERO PARALLAX EFFECT
// =============================================================================
gsap.registerPlugin(ScrollTrigger);

function initHeroParallax() {
  const hero = document.querySelector("[data-hero-parallax]");

  if (!hero) return;

  const heroImage = hero.querySelector("[data-hero-parallax-image]");

  if (heroImage) {
    gsap.to(heroImage, {
      yPercent: 15,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
}

// =============================================================================
// FOOTER PARALLAX EFFECT
// =============================================================================
function initFooterParallax() {
  document.querySelectorAll("[data-footer-parallax]").forEach((el) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "clamp(top bottom)",
        end: "clamp(top top)",
        scrub: true,
      },
    });

    const inner = el.querySelector("[data-footer-parallax-inner]");

    if (inner) {
      tl.from(inner, {
        yPercent: -25,
        ease: "linear",
      });
    }
  });
}

// Initialize Parallax Effects
document.addEventListener("DOMContentLoaded", () => {
  initHeroParallax();
  initFooterParallax();
});

// =============================================================================
// DYNAMIC YEAR
// =============================================================================
function initDynamicCurrentYear() {
  const currentYear = new Date().getFullYear();
  const currentYearElements = document.querySelectorAll("[data-current-year]");
  currentYearElements.forEach((currentYearElement) => {
    currentYearElement.textContent = currentYear;
  });
}

// Initialize Dynamic Current Year
document.addEventListener("DOMContentLoaded", () => {
  initDynamicCurrentYear();
});

// =============================================================================
// BUTTON CHARACTER STAGGER ANIMATION
// =============================================================================
function initButtonCharacterStagger() {
  const offsetIncrement = 0.01; // Transition offset increment in seconds
  const buttons = document.querySelectorAll("[data-button-animate-chars]");

  buttons.forEach((button) => {
    const text = button.textContent; // Get the button's text content
    button.innerHTML = ""; // Clear the original content

    [...text].forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.transitionDelay = `${index * offsetIncrement}s`;

      // Handle spaces explicitly
      if (char === " ") {
        span.style.whiteSpace = "pre"; // Preserve space width
      }

      button.appendChild(span);
    });
  });
}

// Initialize Button Character Stagger Animation
document.addEventListener("DOMContentLoaded", () => {
  initButtonCharacterStagger();
});

// =============================================================================
// Homepage Nav Logo Scroll Show/Hide
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const logoUp = document.querySelector('.logo-scroll-up');
  const logoDown = document.querySelector('.logo-scroll-down');
  const navLinks = document.querySelector('.nav-links');

  if (!logoUp || !logoDown || !navLinks) return;

  // Guard: GSAP must be loaded before this file runs
  if (typeof gsap === 'undefined') return;

  // CustomEase is already registered at the top of this file; just create the ease
  if (typeof CustomEase !== 'undefined') {
    CustomEase.create("osmo", "M0,0 C0.625,0.05 0,1 1,1");
  }
  var EASE     = typeof CustomEase !== 'undefined' ? "osmo" : "power2.inOut";
  var DURATION = 0.2;

  // swapY is resolved lazily on first scroll so offsetHeight is never 0
  // (elements may be hidden/zero-height at DOMContentLoaded in Webflow)
  var swapY = null;
  function getSwapY() {
    if (!swapY) swapY = logoUp.offsetHeight * 0.75 || 12;
    return swapY;
  }

  // Initial state — logoDown hidden + offset below, others visible
  gsap.set(logoDown, { opacity: 0, y: getSwapY(), pointerEvents: 'none' });
  gsap.set(logoUp,   { opacity: 1, y: 0,           pointerEvents: 'auto' });
  gsap.set(navLinks, { opacity: 1, pointerEvents: 'auto' });

  var lastScrollY = window.scrollY;
  var ticking = false;
  var isDown = false; // tracks current visual state, not scroll direction

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var currentScrollY = window.scrollY;
      var dy = getSwapY();
      var down = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;
      ticking = false;

      // Only animate when state actually changes
      if (down === isDown) return;
      isDown = down;

      gsap.killTweensOf(logoUp);
      gsap.killTweensOf(logoDown);
      gsap.killTweensOf(navLinks);

      gsap.to(logoUp, {
        opacity: down ? 0 : 1,
        y: down ? -dy : 0,
        pointerEvents: down ? 'none' : 'auto',
        duration: DURATION,
        ease: EASE
      });
      gsap.to(logoDown, {
        opacity: down ? 1 : 0,
        y: down ? 0 : dy,
        pointerEvents: down ? 'auto' : 'none',
        duration: DURATION,
        ease: EASE
      });
      gsap.to(navLinks, {
        opacity: down ? 0 : 1,
        pointerEvents: down ? 'none' : 'auto',
        duration: DURATION,
        ease: EASE
      });
    });
  });
});

// =============================================================================
// Homepage Logo Wall Cycle
// =============================================================================
function initLogoWallCycle() {
  const loopDelay = 2;
  const duration  = 0.9;
  const stagger   = 0.2;

  document.querySelectorAll('[data-logo-wall-cycle-init]').forEach(root => {
    const list  = root.querySelector('[data-logo-wall-list]');
    const items = Array.from(list.querySelectorAll('[data-logo-wall-item]'));

    const originalTargets = items
      .map(item => item.querySelector('[data-logo-wall-target]'))
      .filter(Boolean);

    let visibleItems = [];
    let visibleCount = 0;
    let logoSequence = [];
    let sequenceIndex = 0;
    let tl;

    function isVisible(el) {
      return window.getComputedStyle(el).display !== 'none';
    }

    function setup() {
      if (tl) tl.kill();

      visibleItems = items.filter(isVisible);
      visibleCount = visibleItems.length;

      items.forEach(item => {
        item.querySelectorAll('[data-logo-wall-target]').forEach(el => el.remove());
      });

      const pool = originalTargets.map(n => n.cloneNode(true));

      logoSequence = pool.slice();
      sequenceIndex = 0;

      for (let i = 0; i < visibleCount; i++) {
        const parent = visibleItems[i].querySelector('[data-logo-wall-target-parent]') || visibleItems[i];
        const logo = logoSequence[sequenceIndex % logoSequence.length];
        sequenceIndex++;
        parent.appendChild(logo.cloneNode(true));
      }

      scheduleWave();
    }

    function scheduleWave() {
      tl = gsap.timeline({ onComplete: () => {
        gsap.delayedCall(loopDelay, scheduleWave);
      }});

      visibleItems.forEach((container, i) => {
        tl.call(() => swapSlot(container), null, i * stagger);
      });
    }

    function swapSlot(container) {
      const parent = container.querySelector('[data-logo-wall-target-parent]') || container;
      const existing = parent.querySelectorAll('[data-logo-wall-target]');
      if (existing.length > 1) return;

      const current  = parent.querySelector('[data-logo-wall-target]');
      const incoming = logoSequence[sequenceIndex % logoSequence.length].cloneNode(true);
      sequenceIndex++;

      gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
      parent.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          yPercent: -50,
          autoAlpha: 0,
          duration,
          ease: 'expo.inOut',
          onComplete: () => current.remove()
        });
      }

      gsap.to(incoming, {
        yPercent: 0,
        autoAlpha: 1,
        duration,
        delay: 0.1,
        ease: 'expo.inOut'
      });
    }

    setup();

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter:     () => tl && tl.play(),
      onLeave:     () => tl && tl.pause(),
      onEnterBack: () => tl && tl.play(),
      onLeaveBack: () => tl && tl.pause()
    });

    document.addEventListener('visibilitychange', () =>
      document.hidden ? tl && tl.pause() : tl && tl.play()
    );
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLogoWallCycle();
});

// =============================================================================
// CONTACT MODAL
// =============================================================================
function initContactModal() {
  const btn   = document.querySelector('.contact_modal-button');
  const modal = document.querySelector('.contact_modal');
  if (!btn || !modal) return;

  // Backdrop: always composited (visibility not display) so backdrop-filter is instant
  const backdrop = document.createElement('div');
  Object.assign(backdrop.style, {
    position: 'fixed', inset: '0', background: 'transparent',
    backdropFilter: 'blur(8px)', webkitBackdropFilter: 'blur(8px)',
    zIndex: '998', visibility: 'hidden', pointerEvents: 'none'
  });
  document.body.appendChild(backdrop);

  // Use opacity only (never visibility/display) so backdrop-filter stays composited
  modal.style.willChange = 'opacity';
  modal.style.visibility = 'hidden';
  modal.style.opacity = '0';
  modal.style.pointerEvents = 'none';
  modal.style.transition = 'none';

  let isOpen = false;

  function openModal() {
    if (isOpen) return;
    isOpen = true;

    if (window.lenis) window.lenis.stop();
    document.body.style.overflow = 'hidden';

    gsap.set(btn, { pointerEvents: 'none', autoAlpha: 0 });
    gsap.set(backdrop, { visibility: 'visible', pointerEvents: 'auto' });

    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power2.out' });
  }

  function closeModal() {
    if (!isOpen) return;
    isOpen = false;

    gsap.set(backdrop, { pointerEvents: 'none' });
    gsap.to(modal, { opacity: 0, duration: 0.1, ease: 'power2.in', onComplete: () => {
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
      gsap.set(backdrop, { visibility: 'hidden', pointerEvents: 'none' });
      gsap.set(btn, { pointerEvents: 'auto', autoAlpha: 1 });
      if (window.lenis) window.lenis.start();
      document.body.style.overflow = '';
    }});
  }

  document.querySelectorAll('.contact_modal-button, .contact_modal-open').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOpen ? closeModal() : openModal();
    });
  });

  backdrop.addEventListener('click', closeModal);

  const closeBtn = modal.querySelector('.contact_modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initContactModal();
});
