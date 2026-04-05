/* ═══════════════════════════════════════════════════════════
   SHARED NAVIGATION — nav.js
   Injects a consistent <nav> and mobile menu into every page.
   Auto-detects active page, adjusts paths for subdirectories.
   ═══════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // Detect if we're in a subdirectory (projects/, writing/)
  const path = window.location.pathname;
  const inSubdir = /\/(projects|writing)\//.test(path);
  const prefix = inSubdir ? '../' : '';

  // Detect current page for active state
  const page = path.split('/').pop().replace('.html', '') || 'index';
  const activeMap = {
    'index': '',
    'works': 'works',
    'writing': 'writing',
    'atlas': 'atlas',
    'atlas-3d': 'atlas'
  };

  // If we're on a project subpage, "works" is active
  // If we're on a writing subpage, "writing" is active
  let activePage = activeMap[page] || '';
  if (inSubdir && path.includes('/projects/')) activePage = 'works';
  if (inSubdir && path.includes('/writing/')) activePage = 'writing';

  const links = [
    { label: 'Works',   href: prefix + 'works.html',          key: 'works' },
    { label: 'Writing', href: prefix + 'writing.html',        key: 'writing' },
    { label: 'Atlas',   href: prefix + 'atlas-3d.html',        key: 'atlas' },
    { label: 'About',   href: prefix + 'index.html#contact',  key: 'about' }
  ];

  // Build desktop nav links
  const desktopLinks = links.map(l => {
    const cls = l.key === activePage ? ' class="active"' : '';
    return `<li><a href="${l.href}"${cls}>${l.label}</a></li>`;
  }).join('\n      ');

  // Build mobile menu links
  const mobileLinks = links.map(l => {
    const cls = l.key === activePage ? ' class="active"' : '';
    return `<a href="${l.href}"${cls}>${l.label}</a>`;
  }).join('\n  ');

  // Is this the index page? Start with transparent nav
  const isIndex = page === 'index' || page === '';
  const navClass = isIndex ? ' class="transparent"' : '';

  const navHTML = `
<nav id="nav"${navClass}>
  <a href="${prefix}index.html" class="nav-logo">PAPAZIAN</a>
  <ul class="nav-links">
      ${desktopLinks}
  </ul>
  <button class="nav-hamburger" id="hamburger" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>

<div id="mobile-menu">
  <span class="mobile-close" id="mobile-close">× Close</span>
  ${mobileLinks}
</div>
`;

  // Find target: look for a placeholder div or insert at start of body
  const placeholder = document.getElementById('nav-placeholder');
  if (placeholder) {
    placeholder.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  // ── Mobile menu toggle ──────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      document.body.classList.add('no-scroll');
    });
  }
  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('no-scroll');
    });
  }

  // ── Transparent nav → scrolled (index page only) ──
  if (isIndex) {
    const nav = document.getElementById('nav');
    if (nav) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }, { passive: true });
    }
  }

  // ── Hover cursor class for nav links ──────────────
  const cursor = document.getElementById('cursor');
  if (cursor) {
    document.querySelectorAll('#nav a, #nav button, #mobile-menu a, #mobile-menu .mobile-close').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // ── Scramble Text Effect (Hover) ──────────────────
  function scramble(el, finalText, duration = 600) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz2026';
    let iterations = 0;
    const step = 1/2; // Speed of resolving characters
    
    // Store original text so we don't accidentally scramble scrambled text
    if (!el.hasAttribute('data-original-text')) {
      el.setAttribute('data-original-text', finalText);
    }
    const targetText = el.getAttribute('data-original-text');

    if (el._scrambleInterval) clearInterval(el._scrambleInterval);

    el._scrambleInterval = setInterval(() => {
      el.textContent = targetText.split('').map((c, i) => {
        if (i < iterations) return c;
        if (c === ' ') return ' ';
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      
      if (iterations >= targetText.length) {
        clearInterval(el._scrambleInterval);
        el.textContent = targetText; 
      }
      iterations += step;
    }, duration / (targetText.length / step));
  }

  // Apply scramble only to desktop nav links and logo
  const scrambleLinks = document.querySelectorAll('#nav .nav-links a, #nav .nav-logo');
  scrambleLinks.forEach(link => {
    // Avoid scrambling when already active
    if (!link.classList.contains('active')) {
      link.addEventListener('mouseenter', function() {
        scramble(this, this.textContent.trim());
      });
    }
  });

  // ── Magnetic Button Effect ──────────────────────────
  class MagneticButton {
    constructor(el, strength = 20) {
      this.el = el;
      this.strength = strength;
      this.bindEvents();
    }
    bindEvents() {
      this.el.addEventListener('mousemove', (e) => {
        const rect = this.el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(this.el, { x: x * this.strength / 100, y: y * this.strength / 100, duration: 0.3, ease: 'power2.out' });
      });
      this.el.addEventListener('mouseleave', () => {
        gsap.to(this.el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
      });
    }
  }

  // Apply magnetic effect to key interactive elements
  document.querySelectorAll('#nav a, #hamburger').forEach(el => {
    new MagneticButton(el, 25);
  });

  // ── Inject Ambient Shader Background ───────────────
  if (!document.querySelector('script[src*="bg-shader.js"]')) {
    const bgScript = document.createElement('script');
    bgScript.src = prefix + 'bg-shader.js';
    document.body.appendChild(bgScript);
  }

  // ── Global Page Transitions ────────────────────────
  const transitionOverlay = document.createElement('div');
  transitionOverlay.id = 'global-transition-overlay';
  Object.assign(transitionOverlay.style, {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: '#050508',
    zIndex: 9999, // above everything
    pointerEvents: 'none',
    opacity: '1',
    transition: 'opacity 0.8s cubic-bezier(0.7, 0, 0.3, 1)'
  });
  document.body.appendChild(transitionOverlay);

  // Fade in on load (or right away since DOM is ready)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      transitionOverlay.style.opacity = '0';
    });
  });

  // Handle BF cache
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      transitionOverlay.style.opacity = '0';
    }
  });

  // Intercept internal links for fade out
  document.querySelectorAll('a').forEach(link => {
    // only if it's an internal link and not a hash link
    if (link.hostname === window.location.hostname && 
        !link.getAttribute('href')?.startsWith('#') && 
        link.target !== '_blank') {
      
      // If it's a sub-hash like "/index.html#contact", we shouldn't intercept if we're on the same path
      const path1 = link.pathname.replace(/\/$/, "");
      const path2 = window.location.pathname.replace(/\/$/, "");
      if (path1 === path2 && link.hash) return; // let smooth scrolling or hash jump happen

      link.addEventListener('click', e => {
        // Allow ctrl/cmd clicks to open in new tab
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        
        e.preventDefault();
        const dest = link.href;
        transitionOverlay.style.opacity = '1';
        setTimeout(() => {
          window.location = dest;
        }, 800);
      });
    }
  });
})();
