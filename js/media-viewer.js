(() => {
  if (!window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'figure-viewer';
  dialog.setAttribute('aria-labelledby', 'figure-viewer-title');
  dialog.innerHTML = `
    <div class="figure-viewer-bar">
      <h2 id="figure-viewer-title">Image</h2>
      <div class="figure-viewer-actions">
        <button type="button" data-action="out" aria-label="Zoom out" title="Zoom out">−</button>
        <button type="button" data-action="in" aria-label="Zoom in" title="Zoom in">+</button>
        <button type="button" data-action="close" aria-label="Close image" title="Close image" autofocus>×</button>
      </div>
    </div>
    <div class="figure-viewer-stage"><img draggable="false" alt=""></div>`;
  document.body.append(dialog);

  const stage = dialog.querySelector('.figure-viewer-stage');
  const picture = stage.querySelector('img');
  const heading = dialog.querySelector('h2');
  const zoomIn = dialog.querySelector('[data-action="in"]');
  const zoomOut = dialog.querySelector('[data-action="out"]');
  const points = new Map();
  let opener;
  let pagePosition;
  let scale = 1, x = 0, y = 0;
  let fitWidth = 0, fitHeight = 0;
  let blankStart = null;
  let maxScale = 6;
  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

  function draw() {
    const edgeX = Math.max(0, (fitWidth * scale - stage.clientWidth) / 2);
    const edgeY = Math.max(0, (fitHeight * scale - stage.clientHeight) / 2);
    x = clamp(x, -edgeX, edgeX);
    y = clamp(y, -edgeY, edgeY);
    picture.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    stage.classList.toggle('can-pan', scale > 1);
    zoomOut.disabled = scale <= 1 || !fitWidth;
    zoomIn.disabled = scale >= maxScale || !fitWidth;
  }

  function fit() {
    if (!dialog.open || !picture.naturalWidth) return;
    const ratio = Math.min(stage.clientWidth / picture.naturalWidth, stage.clientHeight / picture.naturalHeight);
    fitWidth = picture.naturalWidth * ratio;
    fitHeight = picture.naturalHeight * ratio;
    maxScale = Math.max(6, Math.ceil(1 / ratio));
    picture.style.width = fitWidth + 'px';
    picture.style.height = fitHeight + 'px';
    draw();
  }

  // Keep the point between the fingers in place as their distance changes.
  function zoom(nextScale, from = { x: 0, y: 0 }, to = from) {
    const next = clamp(nextScale, 1, maxScale);
    const factor = next / scale;
    x = to.x - (from.x - x) * factor;
    y = to.y - (from.y - y) * factor;
    scale = next;
    draw();
  }

  function position(event) {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
  }

  // Chromium sends trackpad pinches as Ctrl+wheel; Safari exposes gesture events.
  let safariGesture = null;
  let lastSafariGesture = -Infinity;
  stage.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    if (points.size > 1 || safariGesture || performance.now() - lastSafariGesture < 100) return;
    blankStart = null;
    const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
    zoom(scale * Math.exp(-event.deltaY * units / 100), position(event));
  }, { passive: false });

  stage.addEventListener('gesturestart', event => {
    event.preventDefault();
    blankStart = null;
    if (points.size < 2) safariGesture = { scale, center: position(event) };
  }, { passive: false });
  stage.addEventListener('gesturechange', event => {
    event.preventDefault();
    if (!safariGesture || points.size > 1) return;
    zoom(safariGesture.scale * event.scale, safariGesture.center, position(event));
    safariGesture.center = position(event);
  }, { passive: false });
  stage.addEventListener('gestureend', event => {
    event.preventDefault();
    safariGesture = null;
    lastSafariGesture = performance.now();
  }, { passive: false });

  function gesture() {
    const [a, b] = points.values();
    if (!b) return { center: a, span: 0 };
    return { center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, span: Math.hypot(a.x - b.x, a.y - b.y) };
  }

  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const point = position(event);
    blankStart = points.size === 0 && event.target === stage ? point : null;
    points.set(event.pointerId, point);
    if (points.size > 1) safariGesture = null;
    event.target.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', event => {
    if (!points.has(event.pointerId)) return;
    const before = gesture();
    const point = position(event);
    if (blankStart && Math.hypot(point.x - blankStart.x, point.y - blankStart.y) > 6) blankStart = null;
    points.set(event.pointerId, point);
    const after = gesture();
    zoom(before.span ? scale * after.span / before.span : scale, before.center, after.center);
  });

  stage.addEventListener('pointerup', event => {
    if (!points.delete(event.pointerId)) return;
    if (blankStart) dialog.close();
    blankStart = null;
  });
  stage.addEventListener('lostpointercapture', event => {
    points.delete(event.pointerId);
    blankStart = null;
  });
  stage.addEventListener('dblclick', event => {
    if (dialog.open && event.target === picture) zoom(scale > 1 ? 1 : 2, position(event));
  });

  zoomOut.addEventListener('click', () => zoom(scale / 1.6));
  zoomIn.addEventListener('click', () => zoom(scale * 1.6));
  dialog.querySelector('[data-action="close"]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (scale <= 1) return;
    const step = 80;
    const movement = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[event.key];
    if (!movement) return;
    event.preventDefault();
    x += movement[0];
    y += movement[1];
    draw();
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  picture.addEventListener('load', fit);
  window.addEventListener('resize', fit);

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a.figure-link');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    opener = link;
    pagePosition = { left: window.scrollX, top: window.scrollY, viewportWidth: window.innerWidth };
    const alt = link.querySelector('img')?.alt || '';
    heading.textContent = link.dataset.caption || alt || 'Image';
    picture.alt = alt;
    scale = 1;
    x = y = fitWidth = fitHeight = 0;
    picture.style.width = picture.style.height = '';
    picture.src = link.href;
    document.documentElement.classList.add('figure-viewing');
    dialog.showModal();
    draw();
    if (picture.complete) fit();
  });

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('figure-viewing');
    points.clear();
    safariGesture = null;
    blankStart = null;
    picture.removeAttribute('src');
    opener?.focus({ preventScroll: true });
    if (!pagePosition) return;
    if (window.innerWidth !== pagePosition.viewportWidth && opener?.isConnected) {
      opener.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    } else {
      window.scrollTo({ left: pagePosition.left, top: pagePosition.top, behavior: 'instant' });
    }
  });
})();
