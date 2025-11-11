// =============================================================================
// CONTACT BUTTON ANIMATION
// =============================================================================
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".contact-button");
    if (!btn) {
      console.warn(
        "Contact button not found - check .contact-button class exists"
      );
      return;
    }

    var inner = btn.querySelector(".contact-inner");
    var emailEl = btn.querySelector(".email");
    var textEl = btn.querySelector(".contact-text");

    // Read email from data-email attribute
    var email = btn.getAttribute("data-email");
    if (!email) {
      console.error("No email found in data-email attribute");
      return;
    }

    // GSAP animation sizes
    var compactWidth = 90;
    var expandedWidth = 290;

    // Track button state
    var isExpanded = false;
    var copyTimeout = null;
    var isDisabled = false;

    // Ensure initial email hidden
    gsap.set(emailEl, { autoAlpha: 0 });

    // Build timeline - faster animation with stronger easing
    var tl = gsap.timeline({
      paused: true,
      onStart: function () {
        // Show email immediately when animation starts
        gsap.set(emailEl, { autoAlpha: 1 });
      },
      onReverseComplete: function () {
        // Hide email immediately when reversed
        gsap.set(emailEl, { autoAlpha: 0 });
      },
    });
    tl.to(inner, { width: expandedWidth, duration: 0.18, ease: "power3.out" });

    // Copy function
    function copyToClipboard() {
      // Modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(email)
          .then(function () {
            showCopiedState();
          })
          .catch(function (err) {
            console.error("Failed to copy:", err);
            fallbackCopy();
          });
      } else {
        fallbackCopy();
      }
    }

    // Fallback copy method for older browsers
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        var successful = document.execCommand("copy");
        if (successful) {
          showCopiedState();
        } else {
          console.error("Copy command failed");
        }
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }

      document.body.removeChild(textarea);
    }

    // Show "COPIED!" state
    function showCopiedState() {
      isDisabled = true;

      if (textEl) {
        textEl.textContent = "COPIED";
        textEl.style.color = "var(--brand)";
      }
      btn.classList.add("copied");
      btn.setAttribute("aria-label", "Email copied to clipboard");

      // Reset after 2.5 seconds
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(function () {
        if (textEl) {
          textEl.textContent = "CONTACT";
          textEl.style.color = "";
        }
        btn.classList.remove("copied");
        btn.setAttribute("aria-label", "Copy email");
        tl.reverse();
        isExpanded = false;
        isDisabled = false;
        copyTimeout = null;
      }, 2500);
    }

    // Reset button to initial state
    function resetButton() {
      if (isExpanded) {
        tl.reverse();
        if (textEl) textEl.textContent = "CONTACT";
        btn.classList.remove("copied");
        btn.setAttribute("aria-label", "Copy email");
        isExpanded = false;
        if (copyTimeout) {
          clearTimeout(copyTimeout);
          copyTimeout = null;
        }
      }
    }

    // DESKTOP BEHAVIOR (hover)
    // Hover to expand/collapse
    btn.addEventListener("mouseenter", function () {
      // Only expand if not in copied state
      if (!btn.classList.contains("copied")) {
        tl.play();
        if (textEl) {
          textEl.textContent = "COPY";
          textEl.style.color = "var(--brand)";
        }
        isExpanded = true;
      }
    });

    btn.addEventListener("mouseleave", function () {
      // Don't collapse if in copied state
      if (!btn.classList.contains("copied")) {
        tl.reverse();
        if (textEl) {
          textEl.textContent = "CONTACT";
          textEl.style.color = "";
        }
        isExpanded = false;
      }
    });

    // Click to copy (when already expanded by hover)
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (isExpanded && !isDisabled && !btn.classList.contains("copied")) {
        copyToClipboard();
      }
    });

    // Accessibility: keyboard Enter/Space
    btn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });
})();

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
      yPercent: 30,
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
