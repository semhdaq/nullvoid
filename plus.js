/* NullVoid · plus.js — news.js ve extras.js'e dokunmadan ek özellikler.
   CSP uyumlu: inline script yok, tüm metinler textContent ile yazılır. */
(function () {
'use strict';
var $ = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
var ls = {
  get: function (k, d) { try { var v = localStorage.getItem('nv_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem('nv_' + k, JSON.stringify(v)); } catch (e) {} }
};
var T = {
  tr: { all: 'Tümü', trend: 'Gündemde', src: 'Kaynak', save: '☆ Kaydet', saved: '★ Kaydedildi', read: '✓ Okundu', unread: 'Okunmadı', digest: 'Günün özeti', savedT: 'Kaydedilenler',
    noSaved: 'Henüz kayıt yok. Bir haberin altındaki “Kaydet” düğmesine bas.', clear: 'Tümünü temizle', remove: 'Kaldır', close: 'Kapat ✕', quiz: 'Günün sorusu',
    cmp: 'Araç karşılaştırma', ver: 'Güncel sürümler', ph: 'Haberlerde ara', top: 'Yukarı', pal: 'Komut ara…', rss: 'RSS', sug: 'Kaynak öner',
    lic: '© NullVoid · içerik ve tasarım yalnızca site sahibine aittir.', right: 'Doğru! ', wrong: 'Yanlış. ', empty: 'Özet şu an alınamadı. Biraz sonra tekrar dene.', openQ: 'Soruyu aç',
    cat: { ai: 'AI', kod: 'Kodlama', arac: 'Araçlar' },
    cmds: ['AI sekmesi', 'Kodlama sekmesi', 'Araçlar sekmesi', 'Günün özeti', 'Kaydedilenler', 'Günün sorusu', 'Terminal', 'Yazılar', 'Matrix aç/kapat', 'Görünümü değiştir (sıkı/rahat)', 'Dili değiştir (TR/EN)', 'Filtreleri temizle', 'Yukarı çık'] },
  en: { all: 'All', trend: 'Trending', src: 'Source', save: '☆ Save', saved: '★ Saved', read: '✓ Read', unread: 'Unread', digest: 'Daily digest', savedT: 'Saved',
    noSaved: 'Nothing saved yet. Press “Save” under a story.', clear: 'Clear all', remove: 'Remove', close: 'Close ✕', quiz: 'Question of the day',
    cmp: 'Tool comparison', ver: 'Latest versions', ph: 'Search stories', top: 'Top', pal: 'Search commands…', rss: 'RSS', sug: 'Suggest a source',
    lic: '© NullVoid · content and design belong solely to the site owner.', right: 'Correct! ', wrong: 'Not quite. ', empty: 'Digest unavailable right now. Try again shortly.', openQ: 'Open question',
    cat: { ai: 'AI', kod: 'Coding', arac: 'Tools' },
    cmds: ['AI tab', 'Coding tab', 'Tools tab', 'Daily digest', 'Saved', 'Question of the day', 'Terminal', 'Posts', 'Toggle matrix', 'Toggle density (compact/cozy)', 'Switch language (TR/EN)', 'Clear filters', 'Back to top'] }
};
var lang = ls.get('lang', 'tr'); if (!T[lang]) lang = 'tr';
var t = function (k) { return T[lang][k]; };
var feed = document.getElementById('feed'), qEl = document.getElementById('q');
if (!feed) return;
var saved = ls.get('saved', {}), read = ls.get('read', {}), srcSel = 'all', news = null, data = {};
var reduce = matchMedia('(prefers-reduced-motion: reduce)');

function safeUrl(u) { try { var p = new URL(u, location.href); return /^https?:$/.test(p.protocol) ? p.href : '#'; } catch (e) { return '#'; } }
function plain(s) { return s == null ? '' : (new DOMParser().parseFromString(String(s), 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim(); }
function getJSON(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
function trim(map, n) { var k = Object.keys(map); if (k.length > n) k.slice(0, k.length - n).forEach(function (x) { delete map[x]; }); }

/* ---------- Haber kartlarına Kaydet / Okundu ---------- */
function info(a) {
  var l = a.querySelector('.title a'), s = a.querySelector('.source'), d = a.querySelector('.desc');
  return { u: l ? l.href : '', t: l ? l.firstChild.textContent : '', s: s ? s.firstChild.textContent : '', d: d ? d.textContent : '' };
}
function paint(a, i) {
  a.classList.toggle('pl-read', !!read[i.u]);
  var b = a.querySelectorAll('.pl-b');
  if (b[0]) { b[0].setAttribute('aria-pressed', saved[i.u] ? 'true' : 'false'); b[0].textContent = saved[i.u] ? t('saved') : t('save'); }
  if (b[1]) { b[1].setAttribute('aria-pressed', read[i.u] ? 'true' : 'false'); b[1].textContent = read[i.u] ? t('unread') : t('read'); }
}
function decorate() {
  var arts = feed.querySelectorAll('article.lead, article.story');
  Array.prototype.forEach.call(arts, function (a) {
    if (a.querySelector('.pl-acts')) return;
    var i = info(a); if (!i.u) return;
    var w = a.appendChild($('div', 'pl-acts')), sb = w.appendChild($('button', 'pl-b')), rb = w.appendChild($('button', 'pl-b'));
    sb.type = rb.type = 'button';
    sb.onclick = function () { if (saved[i.u]) delete saved[i.u]; else { saved[i.u] = { t: i.t, s: i.s, u: i.u, d: i.d.slice(0, 200) }; trim(saved, 200); } ls.set('saved', saved); paint(a, i); };
    rb.onclick = function () { if (read[i.u]) delete read[i.u]; else { read[i.u] = 1; trim(read, 600); } ls.set('read', read); paint(a, i); };
    a.querySelector('.title a').addEventListener('click', function () { read[i.u] = 1; trim(read, 600); ls.set('read', read); paint(a, i); });
    paint(a, i);
  });
  buildSources(); applyFilter();
}

/* ---------- Üst çubuk: gündemde + kaynak filtresi ---------- */
var bar = $('div', 'pl-bar'), trendRow = bar.appendChild($('div', 'pl-row')), srcRow = bar.appendChild($('div', 'pl-row'));
feed.parentNode.insertBefore(bar, feed);
var STOP = 'with from that this your will have their about after what which more than into over just says said when they been were also could would these those like most new its how why who for the and are not you but can has had was out one all get use our'.split(' ');
function buildTrend() {
  trendRow.textContent = ''; if (!news) return;
  var c = {}; Object.keys(news.categories || {}).forEach(function (k) { (news.categories[k] || []).forEach(function (it) {
    var seen = {}; (plain(it.title).toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}.+#-]{2,}/gu) || []).forEach(function (w) { if (w.length < 4 || /^[\d.]+$/.test(w) || STOP.indexOf(w) > -1 || seen[w]) return; seen[w] = 1; c[w] = (c[w] || 0) + 1; }); }); });
  var top = Object.keys(c).filter(function (w) { return c[w] > 1; }).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 6);
  if (!top.length) return;
  trendRow.appendChild($('span', 'pl-lab', t('trend')));
  top.forEach(function (w) {
    var b = trendRow.appendChild($('button', 'pl-chip', '#' + w)); b.type = 'button';
    b.setAttribute('aria-pressed', qEl && qEl.value.toLowerCase() === w ? 'true' : 'false');
    b.onclick = function () { if (!qEl) return; qEl.value = qEl.value.toLowerCase() === w ? '' : w; qEl.dispatchEvent(new Event('input')); buildTrend(); };
  });
}
function buildSources() {
  srcRow.textContent = '';
  var set = []; Array.prototype.forEach.call(feed.querySelectorAll('article'), function (a) { var s = info(a).s; if (s && set.indexOf(s) < 0) set.push(s); });
  if (set.length < 2) { srcSel = 'all'; return; }
  if (srcSel !== 'all' && set.indexOf(srcSel) < 0) srcSel = 'all';
  srcRow.appendChild($('span', 'pl-lab', t('src')));
  ['all'].concat(set).forEach(function (s) {
    var b = srcRow.appendChild($('button', 'pl-chip', s === 'all' ? t('all') : s)); b.type = 'button';
    b.setAttribute('aria-pressed', srcSel === s ? 'true' : 'false');
    b.onclick = function () { srcSel = s; Array.prototype.forEach.call(srcRow.querySelectorAll('.pl-chip'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); applyFilter(); };
  });
}
function applyFilter() {
  Array.prototype.forEach.call(feed.querySelectorAll('article'), function (a) { a.classList.toggle('pl-hide', srcSel !== 'all' && info(a).s !== srcSel); });
  Array.prototype.forEach.call(feed.querySelectorAll('.group'), function (g) { g.classList.toggle('pl-hide', !g.querySelector('.story:not(.pl-hide)')); });
}
new MutationObserver(decorate).observe(feed, { childList: true });

/* ---------- Okuma çubuğu + yukarı çık ---------- */
var prog = $('div', 'pl-prog'); prog.setAttribute('aria-hidden', 'true'); document.body.appendChild(prog);
var dock = document.querySelector('.dock') || document.body.appendChild($('div', 'dock'));
var bDig = dock.appendChild($('button')), bSav = dock.appendChild($('button')), bTop = dock.appendChild($('button', 'pl-top'));
[bDig, bSav, bTop].forEach(function (b) { b.type = 'button'; });
bDig.onclick = function () { digest(); }; bSav.onclick = function () { savedPanel(); };
bTop.onclick = function () { scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); };
function onScroll() { var h = document.documentElement, m = h.scrollHeight - h.clientHeight; prog.style.width = (m > 0 ? Math.min(100, h.scrollTop / m * 100) : 0) + '%'; bTop.classList.toggle('on', h.scrollTop > 500); }
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- Paneller ---------- */
var cur = null;
function closePanel() { if (cur) { cur.remove(); cur = null; } }
function panel(title, build) {
  closePanel();
  var v = $('div', 'xv on'), in_ = v.appendChild($('div', 'in')), top = in_.appendChild($('div', 'top'));
  v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', title);
  top.appendChild($('h2', 0, title));
  var c = top.appendChild($('button', 0, t('close'))); c.type = 'button'; c.onclick = closePanel;
  build(in_.appendChild($('div'))); document.body.appendChild(v); cur = v; c.focus();
}
function link(it) {
  var a = $('a', 'p'); a.href = safeUrl(it.url || it.u); a.target = '_blank'; a.rel = 'noopener';
  a.appendChild($('div', 0, plain(it.title || it.t))); a.appendChild($('div', 'pl-sub', (plain(it.source || it.s) + (it.desc || it.d ? ' · ' + plain(it.desc || it.d).slice(0, 140) : ''))));
  return a;
}
function digest() {
  panel(t('digest') + (news && news.generated_at_tr ? ' · ' + news.generated_at_tr : ''), function (b) {
    if (!news) return b.appendChild($('p', 'pl-sub', t('empty')));
    ['ai', 'kod', 'arac'].forEach(function (k) {
      var l = (news.categories && news.categories[k]) || []; if (!l.length) return;
      b.appendChild($('div', 'pl-sub', t('cat')[k])); b.appendChild(link(l[0]));
    });
  });
}
function savedPanel() {
  panel(t('savedT'), function (b) {
    var ks = Object.keys(saved).reverse();
    if (!ks.length) return b.appendChild($('p', 'pl-sub', t('noSaved')));
    var cl = b.appendChild($('button', 0, t('clear'))); cl.type = 'button'; cl.onclick = function () { saved = {}; ls.set('saved', saved); savedPanel(); paintAll(); };
    ks.forEach(function (k) {
      var it = saved[k], row = b.appendChild($('div')); row.appendChild(link(it));
      var rm = row.appendChild($('button', 0, t('remove'))); rm.type = 'button';
      rm.onclick = function () { delete saved[k]; ls.set('saved', saved); savedPanel(); paintAll(); };
    });
  });
}
function paintAll() { Array.prototype.forEach.call(feed.querySelectorAll('article'), function (a) { var i = info(a); if (i.u) paint(a, i); }); }
function quiz() {
  var q = data.quiz; if (!q || !q.length) return;
  var i = Math.floor(Date.now() / 864e5) % q.length, it = q[i];
  panel(t('quiz'), function (b) {
    b.appendChild($('p', 0, it.q));
    var out = $('p', 'pl-sub');
    it.o.forEach(function (o, n) {
      var bt = b.appendChild($('button', 'pl-opt', o)); bt.type = 'button';
      bt.onclick = function () {
        Array.prototype.forEach.call(b.querySelectorAll('.pl-opt'), function (x, m) { x.disabled = true; if (m === it.a) x.classList.add('ok'); else if (x === bt) x.classList.add('no'); });
        out.textContent = (n === it.a ? t('right') : t('wrong')) + (it.e || '');
      };
    });
    b.appendChild(out);
  });
}

/* ---------- Araçlar sekmesi: karşılaştırma + sürümler ---------- */
var tools = $('section', 'pl-tools pl-hide'); feed.parentNode.insertBefore(tools, feed.nextSibling);
function buildTools() {
  tools.textContent = '';
  var c = data.compare, v = data.versions;
  if (c && c.rows && c.rows.length) {
    tools.appendChild($('h2', 0, t('cmp')));
    var w = tools.appendChild($('div', 'pl-sc')), tb = w.appendChild($('table')), hr = tb.appendChild($('tr'));
    (c.cols || []).forEach(function (x) { hr.appendChild($('th', 0, x)); });
    c.rows.forEach(function (r) { var tr = tb.appendChild($('tr')); r.forEach(function (x) { tr.appendChild($('td', 0, x)); }); });
  }
  if (v && v.items && v.items.length) {
    tools.appendChild($('h2', 0, t('ver')));
    var w2 = tools.appendChild($('div', 'pl-sc')), t2 = w2.appendChild($('table'));
    v.items.forEach(function (x) {
      var tr = t2.appendChild($('tr')); tr.appendChild($('td', 0, x.name));
      var td = tr.appendChild($('td')), a = td.appendChild($('a', 0, x.tag)); a.href = safeUrl(x.url); a.target = '_blank'; a.rel = 'noopener';
      tr.appendChild($('td', 0, x.date || ''));
    });
  }
  if (data.quiz && data.quiz.length) { var qb = tools.appendChild($('button', 'pl-q', t('quiz'))); qb.type = 'button'; qb.onclick = quiz; }
}
function syncTools() { tools.classList.toggle('pl-hide', document.body.dataset.cat !== 'arac' || !tools.firstChild); }
new MutationObserver(syncTools).observe(document.body, { attributes: true, attributeFilter: ['data-cat'] });

/* ---------- Ctrl+K komut paleti ---------- */
var pal = null, pSel = 0, pList = [];
function clickDock(name) { var b = Array.prototype.filter.call(document.querySelectorAll('.dock button'), function (x) { return x.textContent === name; })[0]; if (b) b.click(); }
function clickTab(id) { var b = document.getElementById(id); if (b) b.click(); }
function toggleDens() { var on = !document.body.classList.contains('pl-compact'); document.body.classList.toggle('pl-compact', on); ls.set('dens', on ? 1 : 0); }
function clearFilters() { srcSel = 'all'; if (qEl && qEl.value) { qEl.value = ''; qEl.dispatchEvent(new Event('input')); } buildSources(); applyFilter(); buildTrend(); }
var ACT = [function () { clickTab('tab-ai'); }, function () { clickTab('tab-kod'); }, function () { clickTab('tab-arac'); }, digest, savedPanel, quiz,
  function () { clickDock('Terminal'); }, function () { clickDock('Yazılar'); }, function () { clickDock('Matrix'); }, toggleDens, function () { setLang(lang === 'tr' ? 'en' : 'tr'); }, clearFilters,
  function () { scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); }];
function palClose() { if (pal) { pal.remove(); pal = null; } }
function palDraw(ul, inp) {
  var n = inp.value.toLowerCase(); pList = T[lang].cmds.map(function (c, i) { return [c, i]; }).filter(function (x) { return !n || x[0].toLowerCase().indexOf(n) > -1; });
  pSel = Math.min(pSel, Math.max(pList.length - 1, 0)); ul.textContent = '';
  pList.forEach(function (x, i) { var li = ul.appendChild($('li', i === pSel ? 'sel' : '', x[0])); li.onclick = function () { palClose(); ACT[x[1]](); }; });
}
function palOpen() {
  if (pal) return palClose(); closePanel();
  pal = $('div', 'pl-pal'); var box = pal.appendChild($('div')), inp = box.appendChild($('input')), ul = box.appendChild($('ul'));
  inp.placeholder = t('pal'); inp.setAttribute('aria-label', t('pal')); inp.autocomplete = 'off'; pSel = 0;
  inp.oninput = function () { pSel = 0; palDraw(ul, inp); };
  inp.onkeydown = function (e) {
    if (e.key === 'ArrowDown') { pSel = Math.min(pSel + 1, pList.length - 1); palDraw(ul, inp); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { pSel = Math.max(pSel - 1, 0); palDraw(ul, inp); e.preventDefault(); }
    else if (e.key === 'Enter' && pList[pSel]) { var f = ACT[pList[pSel][1]]; palClose(); f(); }
  };
  pal.addEventListener('click', function (e) { if (e.target === pal) palClose(); });
  document.body.appendChild(pal); palDraw(ul, inp); inp.focus();
}
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return palOpen(); }
  if (e.key === 'Escape') { if (pal) palClose(); else closePanel(); }
});

/* ---------- Dil (TR/EN) ve alt bilgi ---------- */
var foot = document.getElementById('footer-note'), fw = null;
function buildFoot() {
  if (!foot) return; if (fw) fw.remove();
  fw = foot.appendChild($('span', 'pl-foot'));
  var r = fw.appendChild($('a', 0, t('rss'))); r.href = 'feed.xml';
  fw.appendChild(document.createTextNode(' · '));
  var s = fw.appendChild($('a', 0, t('sug'))); s.href = 'https://github.com/semhdaq/nullvoid/issues/new'; s.target = '_blank'; s.rel = 'noopener';
  fw.appendChild(document.createTextNode(' · '));
  var l = fw.appendChild($('button', 0, lang === 'tr' ? 'EN' : 'TR')); l.type = 'button'; l.onclick = function () { setLang(lang === 'tr' ? 'en' : 'tr'); };
  fw.appendChild($('br')); fw.appendChild(document.createTextNode(t('lic')));
}
function labels() { bDig.textContent = t('digest'); bSav.textContent = '★'; bSav.setAttribute('aria-label', t('savedT')); bTop.textContent = '↑'; bTop.setAttribute('aria-label', t('top')); if (qEl) { qEl.placeholder = t('ph'); qEl.setAttribute('aria-label', t('ph')); } document.documentElement.lang = lang; }
function setLang(l) { lang = l; ls.set('lang', l); labels(); buildFoot(); buildTrend(); buildSources(); buildTools(); syncTools(); paintAll(); }

/* ---------- Başlat ---------- */
if (ls.get('dens', 0)) document.body.classList.add('pl-compact');
labels(); buildFoot(); decorate();
getJSON('data/news.json').then(function (j) { news = j; buildTrend(); }).catch(function () {});
['compare', 'quiz', 'versions'].forEach(function (k) { getJSON('data/' + k + '.json').then(function (j) { data[k] = j; buildTools(); syncTools(); }).catch(function () {}); });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
})();
