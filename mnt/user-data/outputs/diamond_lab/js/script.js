/* ============================================================
   DIAMOND LAB — Main JavaScript
   Refactored:
   - Single DOMContentLoaded entry point
   - Named, modular functions
   - Guard clauses (no TypeError on pages without elements)
   - setInterval cleanup to prevent stacking
   - Dynamic active nav link (no manual class per page)
   - Video pause button + prefers-reduced-motion support
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  setActiveNavLink();
  initVideoPauseButtons();
  initPublicationsMenu();
  initTeamCarousel();
  initNewsCarousels();
});

/* ----------------------------------------------------------------
   1. ACTIVE NAV LINK
   Reads the current filename from window.location and marks the
   matching <a> in .nav-links as active — no manual class needed.
---------------------------------------------------------------- */
function setActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-links > li > a[href]');
  if (!navLinks.length) return;

  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(function (link) {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentFile) {
      link.classList.add('active');
    }
  });

  // Keep Research parent highlighted when on a research sub-page
  const researchPages = [
    'community_editing.html',
    'cyanobacterial_communities.html',
    'human_microbiome.html',
    'gut_micr_int.html',
    'plasmidonics.html',
    'rumen_microbiome.html'
  ];
  if (researchPages.includes(currentFile)) {
    const researchParent = document.querySelector('.nav-links .dropdown > a');
    if (researchParent) researchParent.classList.add('active');
  }
}

/* ----------------------------------------------------------------
   2. VIDEO PAUSE BUTTON
   Injects an accessible pause/play button into every autoplay
   video wrapper. Also respects prefers-reduced-motion by pausing
   background videos immediately for users who prefer no motion.
---------------------------------------------------------------- */
function initVideoPauseButtons() {
  const wrappers = document.querySelectorAll('.videobg-index, .video-background');
  if (!wrappers.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  wrappers.forEach(function (wrapper) {
    const video = wrapper.querySelector('video');
    if (!video) return;

    // Respect reduced-motion preference
    if (prefersReduced) {
      video.pause();
    }

    // Create accessible pause/play button
    const btn = document.createElement('button');
    btn.className = 'video-pause-btn';
    btn.setAttribute('aria-label', 'Pause background video');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i> Pause';

    btn.addEventListener('click', function () {
      if (video.paused) {
        video.play();
        btn.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i> Pause';
        btn.setAttribute('aria-label', 'Pause background video');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        video.pause();
        btn.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i> Play';
        btn.setAttribute('aria-label', 'Play background video');
        btn.setAttribute('aria-pressed', 'true');
      }
    });

    wrapper.appendChild(btn);
  });
}

/* ----------------------------------------------------------------
   3. PUBLICATIONS MENU HIGHLIGHT
   Highlights the correct year in the fixed aside nav as the user
   scrolls through the publications sections.
---------------------------------------------------------------- */
function initPublicationsMenu() {
  const sections  = document.querySelectorAll('.publications');
  const menuLinks = document.querySelectorAll('.years-menu a');
  if (!sections.length || !menuLinks.length) return;

  const HEADER_OFFSET = 140;

  function highlightCurrentSection() {
    let currentSection = '';

    sections.forEach(function (section) {
      const sectionTop    = section.offsetTop - HEADER_OFFSET;
      const sectionBottom = sectionTop + section.clientHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
        currentSection = section.getAttribute('id');
      }
    });

    menuLinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === currentSection) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', highlightCurrentSection);
  highlightCurrentSection();

  menuLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId      = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      const offsetPosition =
        targetElement.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setTimeout(highlightCurrentSection, 200);
    });
  });
}

/* ----------------------------------------------------------------
   4. TEAM CAROUSEL (drag-to-scroll + scale effect)
---------------------------------------------------------------- */
function initTeamCarousel() {
  const sectionTeam = document.querySelector('.section_team');
  if (!sectionTeam) return;

  const cards = sectionTeam.querySelectorAll('.card');
  let isMouseDown = false;
  let startX, scrollLeft;

  function updateCardScale() {
    const sectionRect = sectionTeam.getBoundingClientRect();
    const centerX     = sectionRect.left + sectionRect.width / 2;

    cards.forEach(function (card) {
      const cardRect     = card.getBoundingClientRect();
      const cardCenterX  = cardRect.left + cardRect.width / 2;
      const distance     = Math.abs(centerX - cardCenterX);
      const maxDistance  = sectionRect.width / 4;

      card.style.transform = distance < maxDistance
        ? `scale(${1.4 - (distance / maxDistance) * 0.2})`
        : 'scale(1)';
    });
  }

  sectionTeam.addEventListener('scroll', updateCardScale);

  sectionTeam.addEventListener('mousedown', function (e) {
    isMouseDown = true;
    startX      = e.pageX - sectionTeam.offsetLeft;
    scrollLeft  = sectionTeam.scrollLeft;
    sectionTeam.style.cursor = 'grabbing';
    e.preventDefault();
  });

  sectionTeam.addEventListener('mouseleave', function () {
    isMouseDown = false;
    sectionTeam.style.cursor = 'grab';
  });

  sectionTeam.addEventListener('mouseup', function () {
    isMouseDown = false;
    sectionTeam.style.cursor = 'grab';
  });

  sectionTeam.addEventListener('mousemove', function (e) {
    if (!isMouseDown) return;
    e.preventDefault();
    const x    = e.pageX - sectionTeam.offsetLeft;
    const walk = (x - startX) * 3;
    sectionTeam.scrollLeft = scrollLeft - walk;
    updateCardScale();
  });

  updateCardScale();
  window.addEventListener('resize', updateCardScale);
}

/* ----------------------------------------------------------------
   5. NEWS CARD CAROUSELS
   Each .projcard with multiple images auto-cycles on hover.
   Fixed: clearInterval before starting a new one to prevent
   interval stacking when user hovers in/out rapidly.
---------------------------------------------------------------- */
function initNewsCarousels() {
  const projcards = document.querySelectorAll('.projcard');
  if (!projcards.length) return;

  projcards.forEach(function (projcard) {
    const carousel    = projcard.querySelector('.carousel_card_img');
    if (!carousel) return;

    const images      = carousel.querySelectorAll('img');
    const indicators  = carousel.querySelectorAll('.indicator');
    if (images.length <= 1) return; // no need to cycle a single image

    let index    = 0;
    let interval = null;

    function updateIndicators() {
      indicators.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function advance() {
      images[index].classList.remove('active');
      index = (index + 1) % images.length;
      images[index].classList.add('active');
      updateIndicators();
    }

    function startCarousel() {
      clearInterval(interval); // prevent stacking
      interval = setInterval(advance, 3500);
    }

    function stopCarousel() {
      clearInterval(interval);
      interval = null;
    }

    projcard.addEventListener('mouseenter', startCarousel);
    projcard.addEventListener('mouseleave', stopCarousel);

    updateIndicators();
  });
}
