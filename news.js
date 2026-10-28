const CATS = ['ai', 'kod', 'arac'];
  const state = { data: null, failed: false, cat: 'ai', q: '' };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const feedEl = document.getElementById('feed');
  const statusEl = document.getElementById('status');
  const tabsEl = document.getElementById('tabs');
  const indicator = document.getElementById('indicator');
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const searchEl = document.getElementById('q');
  const ghostEl = document.getElementById('ghost');
  const LABELS = { ai: 'AI', kod: 'KODLAMA', arac: 'ARAÇLAR' };

  function esc(str){
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(u){
    try{
      const p = new URL(u, location.href);
      return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : '#';
    }catch(e){ return '#'; }
  }

  function norm(s){ return String(s || '').toLocaleLowerCase('tr'); }

  /* Some feeds ship HTML inside descriptions: show it as plain text */
  function plain(str){
    if (str == null) return '';
    const doc = new DOMParser().parseFromString(String(str), 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  const GO = '<svg class="go" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  function storyHTML(it, isLead){
    it = { ...it, title: plain(it.title), desc: plain(it.desc), source: plain(it.source) };
    const open = isLead ? 'article class="lead"' : 'article class="story"';
    const note = isLead ? '<span class="note">öne çıkan</span>' : '';
    return `
      <${open}>
        <p class="source">${esc(it.source)}${note}${isLead ? '' : GO}</p>
        <h3 class="title"><a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">${esc(it.title)}<span class="sr-only"> (yeni sekmede açılır)</span></a></h3>
        <p class="desc">${esc(it.desc)}</p>
      </article>`;
  }

  function groupByDate(items){
    const groups = [];
    items.forEach(it => {
      const last = groups[groups.length - 1];
      if (last && last.date === it.date) last.items.push(it);
      else groups.push({ date: it.date, items: [it] });
    });
    return groups;
  }

  /* Tab indicator and lantern glow follow the active tab */
  let lastGeom = null;
  function placeIndicator(liquid){
    const t = tabs.find(x => x.dataset.cat === state.cat);
    if (!t) return;
    const inset = 12;
    const g = { l: t.offsetLeft + inset, w: Math.max(t.offsetWidth - inset * 2, 10) };
    const prev = lastGeom; lastGeom = g;
    indicator.style.width = g.w + 'px';
    indicator.style.transform = `translateX(${g.l}px)`;
    const r = t.getBoundingClientRect();
    document.documentElement.style.setProperty('--gx', (r.left + r.width / 2) + 'px');

    /* Liquid move: the line stretches across both tabs, then settles on the new one */
    if (liquid && prev && !reduce.matches){
      const L = Math.min(prev.l, g.l), Rr = Math.max(prev.l + prev.w, g.l + g.w);
      indicator.style.transition = 'none';
      const a = indicator.animate([
        { transform: `translateX(${prev.l}px)`, width: prev.w + 'px' },
        { transform: `translateX(${L}px)`, width: (Rr - L) + 'px', offset: .5, easing: 'cubic-bezier(.3,0,.2,1)' },
        { transform: `translateX(${g.l}px)`, width: g.w + 'px' }
      ], { duration: 640, easing: 'cubic-bezier(.65,0,.2,1)' });
      a.finished.then(() => { indicator.style.transition = ''; }).catch(() => { indicator.style.transition = ''; });
    }
  }

  /* A ripple spreads from the icon of the tab you just opened */
  function rippleAt(cat){
    if (reduce.matches) return;
    const t = document.getElementById('tab-' + cat);
    const ico = t && t.querySelector('.ico');
    if (!ico) return;
    const el = document.createElement('span');
    el.className = 'ripple';
    el.style.left = (t.offsetLeft + ico.offsetLeft + ico.offsetWidth / 2) + 'px';
    el.style.top = (t.offsetTop + ico.offsetTop + ico.offsetHeight / 2) + 'px';
    tabsEl.appendChild(el);
    el.animate([
      { transform: 'scale(1)', opacity: .8 },
      { transform: 'scale(9)', opacity: 0 }
    ], { duration: 800, easing: 'cubic-bezier(.2,.6,.3,1)' }).finished.then(() => el.remove(), () => el.remove());
  }

  /* Big outlined category title that slides in behind the content, like a title card */
  function setGhost(dir){
    ghostEl.getAnimations().forEach(a => a.cancel());
    ghostEl.textContent = LABELS[state.cat];
    if (reduce.matches) return;
    ghostEl.animate([
      { opacity: 0, transform: `translateX(${dir * 90}px)` },
      { opacity: 1, transform: 'translateX(0)' }
    ], { duration: 950, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
  }

  function placeIndicatorInstant(){
    indicator.style.transition = 'none';
    placeIndicator();
    requestAnimationFrame(() => requestAnimationFrame(() => { indicator.style.transition = ''; }));
  }

  function syncTabs(liquid){
    document.body.dataset.cat = state.cat;
    tabs.forEach(t => {
      const on = t.dataset.cat === state.cat;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    feedEl.setAttribute('aria-labelledby', 'tab-' + state.cat);
    placeIndicator(liquid);
  }

  function render(){
    if (state.failed){
      statusEl.textContent = '';
      feedEl.innerHTML = `
        <div class="message">
          <h2>Haberler yüklenemedi</h2>
          <p>Bağlantını kontrol edip tekrar dene.</p>
          <button class="retry" type="button" id="retry">Yeniden dene</button>
        </div>`;
      document.getElementById('retry').addEventListener('click', loadNews);
      return;
    }
    if (!state.data) return;

    const all = state.data.categories?.[state.cat] || [];
    const q = norm(state.q.trim());
    const items = q
      ? all.filter(it => norm(plain(it.title) + ' ' + plain(it.desc) + ' ' + it.source).includes(q))
      : all;

    if (!all.length){
      statusEl.textContent = '';
      feedEl.innerHTML = `
        <div class="message">
          <h2>Henüz haber yok</h2>
          <p>Bu kategoride şu an gösterilecek haber yok. Daha sonra tekrar bak.</p>
        </div>`;
      return;
    }
    if (!items.length){
      statusEl.textContent = '';
      feedEl.innerHTML = `
        <div class="message">
          <h2>Sonuç bulunamadı</h2>
          <p>“${esc(state.q.trim())}” için bu kategoride eşleşme yok. Başka bir kelime dene.</p>
        </div>`;
      return;
    }

    statusEl.textContent = q ? `${items.length} sonuç` : '';

    let html = '';
    let rest = items;
    if (!q){
      html += storyHTML(items[0], true);
      rest = items.slice(1);
    }
    html += groupByDate(rest).map(g => `
      <section class="group">
        <h2 class="group-head"><span>${esc(g.date)}</span></h2>
        <div class="grid">${g.items.map(it => storyHTML(it, false)).join('')}</div>
      </section>`).join('');
    feedEl.innerHTML = html;
  }

  /* Cinematic entrance: content slides in from the tab's direction, one piece at a time */
  function enter(dir){
    if (reduce.matches) return;
    const els = feedEl.querySelectorAll('.lead, .group-head, .story');
    els.forEach((el, i) => {
      el.animate([
        { opacity: 0, transform: `translate3d(${dir * 36}px, 14px, 0) scale(1.015)`, filter: 'blur(5px)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)', filter: 'blur(0)' }
      ], { duration: 650, delay: Math.min(i, 14) * 55, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
    const t = feedEl.querySelector('.lead .title');
    if (t) t.animate([
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0 0 0)' }
    ], { duration: 850, delay: 140, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'backwards' });
  }

  let switchToken = 0;
  async function switchCat(next, focusTab){
    if (!CATS.includes(next) || next === state.cat) return;
    const dir = CATS.indexOf(next) > CATS.indexOf(state.cat) ? 1 : -1;
    state.cat = next;
    if (history.replaceState) history.replaceState(null, '', '#' + next);
    syncTabs(true);
    rippleAt(next);
    if (controlsEl.classList.contains('stuck')) window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    if (focusTab) document.getElementById('tab-' + next).focus();

    const token = ++switchToken;
    feedEl.getAnimations().forEach(a => a.cancel());
    if (reduce.matches || !state.data){ ghostEl.textContent = LABELS[state.cat]; render(); return; }
    ghostEl.animate([{ opacity: 1 }, { opacity: 0, transform: `translateX(${-dir * 60}px)` }], { duration: 230, fill: 'forwards' });

    try{
      await feedEl.animate([
        { opacity: 1, transform: 'translate3d(0,0,0)', filter: 'blur(0)' },
        { opacity: 0, transform: `translate3d(${-dir * 40}px,0,0) scale(.985)`, filter: 'blur(6px)' }
      ], { duration: 230, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).finished;
    }catch(e){ /* cancelled by a faster click */ }
    if (token !== switchToken) return;

    render();
    feedEl.getAnimations().forEach(a => a.cancel());
    setGhost(dir);
    enter(dir);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchCat(tab.dataset.cat));
    tab.addEventListener('keydown', e => {
      const i = CATS.indexOf(tab.dataset.cat);
      if (e.key === 'ArrowRight'){ e.preventDefault(); switchCat(CATS[(i + 1) % CATS.length], true); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); switchCat(CATS[(i + CATS.length - 1) % CATS.length], true); }
    });
  });

  searchEl.addEventListener('input', () => { state.q = searchEl.value; render(); });
  searchEl.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ searchEl.value = ''; state.q = ''; render(); }
  });
  /* Easier switching: swipe on touch screens, 1-2-3 and / on keyboards */
  let tx = 0, ty = 0, tt = 0;
  feedEl.addEventListener('touchstart', e => {
    const t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; tt = Date.now();
  }, { passive: true });
  feedEl.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - tt < 700){
      const n = CATS.indexOf(state.cat) + (dx < 0 ? 1 : -1);
      if (n >= 0 && n < CATS.length) switchCat(CATS[n]);
    }
  }, { passive: true });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key >= '1' && e.key <= String(CATS.length)) switchCat(CATS[Number(e.key) - 1]);
    if (e.key === '/'){ e.preventDefault(); searchEl.focus(); }
  });

  /* Logo: click = back to top with a ping; on mouse devices it tilts toward the cursor */
  const brand = document.querySelector('.brand');
  const logoEl = brand.querySelector('.logo');
  const logoWrap = brand.querySelector('.logo-wrap');
  brand.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    if (reduce.matches) return;
    const ping = document.createElement('span');
    ping.className = 'ripple';
    ping.style.left = '50%'; ping.style.top = '50%';
    ping.style.width = ping.style.height = '72px'; ping.style.margin = '-36px 0 0 -36px';
    logoWrap.appendChild(ping);
    ping.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(2.4)', opacity: 0 }],
      { duration: 900, easing: 'cubic-bezier(.2,.6,.3,1)' }).finished.then(() => ping.remove(), () => ping.remove());
  });
  if (window.matchMedia('(hover:hover)').matches && !reduce.matches){
    const clamp = v => Math.max(-1, Math.min(1, v));
    brand.addEventListener('mousemove', e => {
      const r = logoEl.getBoundingClientRect();
      logoEl.style.setProperty('--ry', (clamp((e.clientX - (r.left + r.width / 2)) / r.width) * 24) + 'deg');
      logoEl.style.setProperty('--rx', (-clamp((e.clientY - (r.top + r.height / 2)) / r.height) * 24) + 'deg');
    });
    brand.addEventListener('mouseleave', () => {
      logoEl.style.setProperty('--rx', '0deg'); logoEl.style.setProperty('--ry', '0deg');
    });
  }

  const controlsEl = document.querySelector('.controls');
  function syncStuck(){ controlsEl.classList.toggle('stuck', controlsEl.getBoundingClientRect().top <= 0.5); }
  window.addEventListener('scroll', syncStuck, { passive: true });
  syncStuck();
  window.addEventListener('resize', placeIndicatorInstant);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicatorInstant);

  async function loadNews(){
    const label = document.getElementById('updated-label');
    try{
      const res = await fetch(`./data/news.json?_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('news.json alınamadı');
      const data = await res.json();
      state.data = data;
      state.failed = false;

      CATS.forEach(c => {
        const el = document.querySelector(`[data-count="${c}"]`);
        const n = (data.categories?.[c] || []).length;
        if (el) el.textContent = n || '';
      });
      if (label) label.textContent = `güncelleme: ${data.generated_at_tr || '—'}`;
    }catch(err){
      state.failed = true;
      if (label) label.textContent = 'güncelleme: alınamadı';
      console.error(err);
    }
    render();
    if (state.data){ enter(0); setGhost(1); }
    placeIndicatorInstant();
  }

  const fromHash = location.hash.replace('#', '');
  if (CATS.includes(fromHash)) state.cat = fromHash;
  ghostEl.textContent = LABELS[state.cat];
  syncTabs();
  placeIndicatorInstant();
  loadNews();
