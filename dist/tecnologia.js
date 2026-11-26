'use strict';

const tecnologia = (() => {
  const host = document.getElementById('canva-show');
  const screen = host.querySelector('.canva-screen');
  const stage = host.querySelector('.canva-stage');
  const actions = host.querySelector('.canva-actions');
  const reveal = actions.querySelector('.canva-reveal');
  const tools = document.getElementById('canva-tools');
  const returnBar = document.getElementById('tech-return');
  const content = document.getElementById('route-content');
  let frame;
  let demonstrating = false;
  let inactivity;
  let lastPoint;

  function hideTools() {
    clearTimeout(inactivity);
    actions.classList.remove('is-visible');
    reveal.setAttribute('aria-expanded', 'false');
    tools.inert = true;
  }
  function showTools() {
    clearTimeout(inactivity);
    actions.classList.add('is-visible');
    reveal.setAttribute('aria-expanded', 'true');
    tools.inert = false;
    inactivity = setTimeout(() => {
      if (!actions.querySelector(':focus-visible')) hideTools();
    }, 3000);
  }
  function loadPlayer() {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.title = 'Apresentação de Tecnologia e Inovação da VARION Airlines, por Tiago Souza Andrade';
    frame.allow = 'fullscreen';
    frame.allowFullscreen = true;
    frame.src = 'https://www.canva.com/design/DAHbwG4uaaA/Con643UnKq09c1_P31aFBg/view?embed';
    screen.append(frame);
  }
  // The external document owns all slide input. The parent listens only on its
  // own surface and small corner target, never over the full iframe.
  stage.addEventListener('pointermove', event => {
    if (actions.hidden || event.pointerType === 'touch') return;
    const point = [event.clientX, event.clientY];
    const moved = lastPoint && Math.hypot(point[0]-lastPoint[0], point[1]-lastPoint[1]) >= 3;
    if (!lastPoint || moved) lastPoint = point;
    if (moved) showTools();
  }, {passive:true});
  stage.addEventListener('pointerdown', () => { if (!actions.hidden) showTools(); }, {passive:true});
  reveal.addEventListener('pointerenter', showTools);
  reveal.addEventListener('click', showTools);
  actions.addEventListener('focusin', showTools);
  actions.addEventListener('focusout', event => {
    if (!actions.contains(event.relatedTarget)) hideTools();
  });
  tools.querySelector('[data-demo]').addEventListener('click', () => { demonstrating = true; });
  document.addEventListener('keydown', event => {
    if (!actions.hidden && event.key === 'Escape' && !document.fullscreenElement) {
      location.hash = 'companhia/quem-somos';
    }
  });
  function route(page, part) {
    const presenting = page === 'companhia' && part === 'apresentar';
    const reading = page === 'companhia' && part === 'quem-somos';
    const show = presenting || reading;
    document.body.classList.toggle('canva-presenting', presenting);
    if (presenting) demonstrating = false;
    if (show) loadPlayer();
    host.hidden = !show;
    content.hidden = show;
    actions.hidden = !presenting;
    returnBar.hidden = !demonstrating;
    hideTools();
    lastPoint = undefined;
    if (show) {
      document.title = 'Tecnologia e Inovação | VARION Airlines';
      window.scrollTo(0,0);
      if (presenting) frame.focus({preventScroll:true});
      else host.querySelector('.canva-intro .primary').focus({preventScroll:true});
    }
    return show;
  }
  return {route};
})();
