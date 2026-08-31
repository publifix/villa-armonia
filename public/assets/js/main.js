/**
 * Villa Armonía — site behavior: header scroll state, accessible mobile
 * drawer, and GSAP/ScrollTrigger storytelling. Progressively enhances
 * markup that is fully readable with CSS/HTML alone.
 */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggleBtn = document.querySelector('.nav-toggle');
  var closeBtn = document.querySelector('.nav-drawer__close');
  var drawer = document.querySelector('.nav-drawer');
  var drawerLinks = drawer ? drawer.querySelectorAll('a') : [];
  var progressBar = document.querySelector('.scroll-progress');
  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------------
   * Header: transparent -> solid, hide on scroll down / show on scroll up
   * ------------------------------------------------------------------- */
  (function headerScroll() {
    if (!header) return;
    var lastY = window.scrollY;
    var solidThreshold = 60;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      header.classList.toggle('is-solid', y > solidThreshold);

      var drawerOpen = drawer && drawer.classList.contains('is-open');
      if (!drawerOpen) {
        var scrollingDown = y > lastY && y > header.offsetHeight;
        header.classList.toggle('is-hidden', scrollingDown);
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  })();

  /* ---------------------------------------------------------------------
   * Mobile / tablet full-screen drawer — always fully opaque overlay.
   * Closes on: close button, backdrop tap, link selection, Escape.
   * Traps focus while open; restores focus to the toggle on close.
   * ------------------------------------------------------------------- */
  (function mobileDrawer() {
    if (!toggleBtn || !drawer) return;
    var lastFocused = null;

    function focusableEls() {
      return drawer.querySelectorAll('a[href], button:not([disabled])');
    }

    function openDrawer() {
      lastFocused = document.activeElement;
      drawer.classList.add('is-open');
      document.body.classList.add('nav-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      drawer.removeAttribute('inert');
      var els = focusableEls();
      if (els.length) els[0].focus();
      document.addEventListener('keydown', onKeydown);
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        toggleBtn.focus();
      }
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key === 'Tab') {
        var els = Array.prototype.slice.call(focusableEls());
        if (!els.length) return;
        var first = els[0];
        var last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    toggleBtn.addEventListener('click', function () {
      var isOpen = drawer.classList.contains('is-open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // Backdrop tap: any click on the drawer surface that is not a link/button
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer || e.target.classList.contains('nav-drawer__body')) {
        closeDrawer();
      }
    });

    drawerLinks.forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });

    // Safety net: never let the drawer stay expanded after a route/anchor
    // change or a resize into desktop layout.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  })();

  /* ---------------------------------------------------------------------
   * GSAP + ScrollTrigger storytelling (loaded from CDN in the page).
   * Fully skipped when GSAP fails to load — markup stays visible via CSS.
   * ------------------------------------------------------------------- */
  function initMotion() {
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
      return;
    }
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    // Thin scroll-progress indicator in the nav (Azul Termal)
    if (progressBar) {
      gsap.to(progressBar, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.2 }
      });
    }

    var mm = gsap.matchMedia();

    // Full motion tier — only when the visitor has not requested reduced motion
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      // Subtle hero parallax (~18% speed differential — never disorienting)
      var heroMedia = document.querySelector('.hero__media');
      if (heroMedia) {
        gsap.to(heroMedia, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      // Standard reveal: fade + translateY on section headers and free text
      gsap.utils.toArray('.reveal').forEach(function (el) {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });
      });

      // Stagger reveal for card grids (Habitaciones / Jardines / Galería)
      gsap.utils.toArray('.stagger-grid').forEach(function (grid) {
        var items = grid.querySelectorAll('.stagger-item');
        if (!items.length) return;
        gsap.from(items, {
          opacity: 0,
          y: 32,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: grid,
            start: 'top 82%',
            toggleActions: 'play none none reverse'
          }
        });
      });

      // Spa & Bienestar — the "fixed water while text scrolls" hold is pure
      // CSS (position: sticky, see styles.css); here GSAP only adds a subtle
      // decorative drift on the image itself so the backdrop never looks
      // perfectly static. Purely cosmetic — the section reads correctly
      // with zero JS if this never runs.
      var spaImg = document.querySelector('.spa-pin__media img');
      if (spaImg) {
        gsap.to(spaImg, {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: '.spa-pin',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true
          }
        });
      }

      return function cleanup() {
        // matchMedia handles teardown automatically on breakpoint change
      };
    });

    // Recalculate after web fonts / images settle to keep trigger offsets accurate
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMotion();
  } else {
    document.addEventListener('DOMContentLoaded', initMotion);
  }
}());
