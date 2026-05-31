/* ============================================================
   DIAMOND LAB — script.js
   Capa 2: refactor de estructura
   - Un único DOMContentLoaded
   - Guard clauses en cada función (sin crashes entre páginas)
   - clearInterval antes de startCarousel (sin intervalos apilados)
   - Lógica 100% idéntica al original
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initPublicationsMenu();
  initTeamCarousel();
  initNewsCarousels();
});

/* ----------------------------------------------------------------
   1. PUBLICATIONS — menú lateral con highlight de sección activa
   Solo se activa si existen .publications y .years-menu en la página.
---------------------------------------------------------------- */
function initPublicationsMenu() {
  const sections  = document.querySelectorAll('.publications');
  const menuLinks = document.querySelectorAll('.years-menu a');

  // Guard: si no estamos en publications.html, salimos sin error
  if (!sections.length || !menuLinks.length) return;

  const headerOffset = 140;

  function highlightCurrentSection() {
    let currentSection = '';

    sections.forEach(function (section) {
      const sectionTop    = section.offsetTop - headerOffset;
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

      if (targetElement) {
        const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        const offsetPosition  = elementPosition - headerOffset;

        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        setTimeout(highlightCurrentSection, 200);
      }
    });
  });
}

/* ----------------------------------------------------------------
   2. TEAM — drag-to-scroll + scale por distancia al centro
   Solo se activa si existe .section_team en la página.
---------------------------------------------------------------- */
function initTeamCarousel() {
  const sectionTeam = document.querySelector('.section_team');

  // Guard: si no estamos en team.html, salimos sin error
  if (!sectionTeam) return;

  const cards = sectionTeam.querySelectorAll('.card');
  let isMouseDown = false;
  let startX;
  let scrollLeft;

  function updateCardScale() {
    const sectionRect = sectionTeam.getBoundingClientRect();
    const centerX     = sectionRect.left + sectionRect.width / 2;

    cards.forEach(function (card) {
      const cardRect      = card.getBoundingClientRect();
      const cardCenterX   = cardRect.left + cardRect.width / 2;
      const distanceFromCenter = Math.abs(centerX - cardCenterX);
      const maxDistance   = sectionRect.width / 4;

      if (distanceFromCenter < maxDistance) {
        card.style.transform = 'scale(' + (1.4 - (distanceFromCenter / maxDistance) * 0.2) + ')';
      } else {
        card.style.transform = 'scale(1)';
      }
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

    sectionTeam.scrollLeft          = scrollLeft - walk;
    sectionTeam.style.scrollBehavior = 'smooth';

    updateCardScale();
  });

  updateCardScale();
  window.addEventListener('resize', updateCardScale);
}

/* ----------------------------------------------------------------
   3. NEWS CAROUSELS — auto-ciclo de imágenes al hacer hover
   Solo se activa si existen .projcard en la página.
   Fix: clearInterval antes de crear uno nuevo para evitar apilado.
---------------------------------------------------------------- */
function initNewsCarousels() {
  const carousels = document.querySelectorAll('.projcard');

  // Guard: si no estamos en news.html, salimos sin error
  if (!carousels.length) return;

  carousels.forEach(function (projcard) {
    const carousel = projcard.querySelector('.carousel_card_img');

    // Guard: si esta card no tiene carousel de imágenes, la saltamos
    if (!carousel) return;

    const images     = carousel.querySelectorAll('img');
    const indicators = carousel.querySelectorAll('.indicator');
    let index        = 0;
    let interval     = null;

    function updateIndicators() {
      indicators.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function startCarousel() {
      clearInterval(interval); // Fix: limpia el anterior antes de crear uno nuevo
      interval = setInterval(function () {
        images[index].classList.remove('active');
        index = (index + 1) % images.length;
        images[index].classList.add('active');
        updateIndicators();
      }, 3500);
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
