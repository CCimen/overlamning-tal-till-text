// Kontrast enligt WCAG 2.2 (1.4.3 och 1.4.11), mätt på de färger som faktiskt ritas, med alla utfällningar öppna.
// Kör i webbläsaren på en byggd sida, i ljust och i mörkt läge; svaret har "fel" (ska vara tomt) och de lägsta kvoterna.
// Grafik (3:1): streck och pilar i figurernas SVG mot det som ligger under dem, staplar mot sitt spår (också spåren på
// startsidan) och länkarna i figurerna i hovringsläge. Underkänt står i "grafikFel" (ska vara 0), med detaljer i "grafik".
// Mäts inte: fokusramar och pilspetsar i <marker> (de tar svg:ns currentColor, samma färg som strecket de sitter på).
async () => {
  // WCAG 2.2: 1.4.3 (text 4.5:1, large 3:1) and 1.4.11 (graphics 3:1), measured on rendered colours.
  document.querySelectorAll('details').forEach(d => (d.open = true));
  await new Promise(r => setTimeout(r, 150));
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = s => {
    if (!s || s === 'none' || s === 'transparent') return null;
    cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = s; cv.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = cv.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255];
  };
  const parse = s => {
    const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return rgba(s);
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1];
  };
  const blend = (top, bot) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const opac = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const stuck = e => { for (; e && e.nodeType === 1; e = e.parentElement) if (/^(fixed|sticky)$/.test(getComputedStyle(e).position)) return true; return false; };
  const clipped = (el, x) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { if (getComputedStyle(e).overflowX !== 'visible') { const r = e.getBoundingClientRect(); if (x < r.left || x > r.right) return true; } } return false; };
  const SHAPE = /^(rect|circle|ellipse|polygon|path)$/i;
  const fillOf = e => { const cs = getComputedStyle(e); return e instanceof SVGElement && SHAPE.test(e.tagName) ? parse(cs.fill) : parse(cs.backgroundColor); };
  const page = parse(getComputedStyle(document.body).backgroundColor);
  // background under a point: stack of painted boxes/shapes, top first
  const bgAt = (x, y, self, graphic = false) => {
    let layers = [];
    for (const e of document.elementsFromPoint(x, y)) {
      if (graphic ? self.contains(e) : (e !== self && self.contains(e))) continue; // the text's own element paints behind it; a stroke or bar does not
      if (e instanceof SVGTextElement || e instanceof SVGTSpanElement) continue;
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !(e instanceof SVGElement)) return { unknown: 'bild/gradient' };
      const f = fillOf(e);
      if (f && f[3] > 0) { layers.push([f[0], f[1], f[2], f[3] * (+cs.fillOpacity || 1) * opac(e)]); if (layers.at(-1)[3] >= 0.999) break; }
    }
    let c = page; for (const l of layers.reverse()) c = blend(l, c); return { c };
  };
  const label = e => (e.id ? '#' + e.id : '') + (e.getAttribute('class') ? '.' + String(e.getAttribute('class')).trim().split(/\s+/).slice(0, 2).join('.') : '');
  const fails = [], seen = new Set(), low = []; let n = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const todo = []; for (let t; (t = walker.nextNode());) todo.push(t);
  const done = new Set(), H = innerHeight;
  for (let sy = 0; sy < document.documentElement.scrollHeight; sy += H - 120) {
  scrollTo(0, sy); await new Promise(r => requestAnimationFrame(() => r()));
  for (const t of todo) {
    if (done.has(t)) continue;
    const el = t.parentElement; if (!el || !t.textContent.trim()) { done.add(t); continue; }
    if (el.closest('script,style,noscript,[hidden],.sr-only')) { done.add(t); continue; }
    const r = document.createRange(); r.selectNodeContents(t); const box = [...r.getClientRects()].find(b => b.width > 1 && b.height > 1);
    if (!box) { done.add(t); continue; }
    const cy = box.top + box.height / 2, inHeader = !!el.closest('header');
    if (inHeader ? sy > 0 : (cy < 80 || cy > H - 5)) continue;
    if (box.left + box.width / 2 > innerWidth || box.left + box.width / 2 < 0 || clipped(el, box.left + box.width / 2)) { done.add(t); continue; } // scrolled sideways inside a figure frame or a table
    // Under a sticky or fixed bar (the mobile table of contents) the text is hidden; measure it at another scroll position.
    const hit = document.elementFromPoint(box.left + box.width / 2, cy);
    if (hit && !el.contains(hit) && !hit.contains(el) && stuck(hit) && !stuck(el)) continue;
    done.add(t);
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
    const svg = el instanceof SVGElement;
    let fg = svg ? parse(cs.fill) : parse(cs.color); if (!fg) continue;
    const o = opac(el); fg = [fg[0], fg[1], fg[2], fg[3] * o];
    const x = box.left + box.width / 2, y = cy;
    const bg = bgAt(x, y, el); n++;
    if (bg.unknown) continue;
    const col = blend(fg, bg.c);
    const px = parseFloat(cs.fontSize) * (svg ? (el.getScreenCTM()?.a || 1) : 1), w = +cs.fontWeight || 400;
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const need = large ? 3 : 4.5, rt = ratio(col, bg.c);
    low.push({ t: t.textContent.trim().slice(0, 30), r: +rt.toFixed(2), need, fg: svg ? cs.fill : cs.color, bg: 'rgb(' + bg.c.slice(0, 3).map(Math.round).join(',') + ')' });
    if (rt < need - 0.005) {
      const k = label(el) + '|' + cs.color + '|' + rt.toFixed(2);
      if (seen.has(k)) continue; seen.add(k);
      fails.push({ text: t.textContent.trim().slice(0, 50), el: el.tagName.toLowerCase() + label(el), ratio: +rt.toFixed(2), need, px: +px.toFixed(1), fg: svg ? cs.fill : cs.color, bg: 'rgb(' + bg.c.slice(0, 3).map(Math.round).join(',') + ')', opacity: +o.toFixed(2) });
    }
  }
  }
  scrollTo(0, 0);
  // 1.4.11 (3:1). Varje mätpunkt rullas fram först, också i sidled i en figurram.
  const g = [], gAlla = [], gSeen = new Set();
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  const syns = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const notera = (what, el, rt, need = 3) => {
    const fig = el.closest('figure'); const x = { what, el: el.tagName.toLowerCase() + label(el), figur: fig && (fig.querySelector('figcaption')?.textContent.trim().slice(0, 40) || label(fig)), ratio: +rt.toFixed(2), need };
    gAlla.push(x);
    const k = what + x.el + x.figur + x.ratio; if (rt < need - 0.005 && !gSeen.has(k)) { gSeen.add(k); g.push(x); }
  };
  // Streck och pilar: line, path och polyline med stroke (eller en ifylld pil) i figurernas SVG, mot det som ligger under
  // mitten. Starlights ikoner (rubrikernas ankare) står utanför figurerna och mäts inte här.
  for (const el of document.querySelectorAll('.sl-markdown-content figure svg :is(line, path, polyline)')) {
    if (el.closest('marker, defs') || !syns(el)) continue;
    const cs = getComputedStyle(el);
    const streck = cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0;
    let fg = parse(streck ? cs.stroke : cs.fill); if (!fg || fg[3] === 0) continue;
    fg = [fg[0], fg[1], fg[2], fg[3] * (+(streck ? cs.strokeOpacity : cs.fillOpacity) || 1) * opac(el)];
    const len = el.getTotalLength(); const ctm = el.getScreenCTM(); if (!ctm || !len) continue;
    el.scrollIntoView({ block: 'center', inline: 'center' }); await frame();
    // Tre punkter längs strecket; en punkt som något annat ritas ovanpå (en siffra i en cirkel) räknas inte.
    let rt = Infinity;
    for (const del of [0.25, 0.5, 0.75]) {
      const local = el.getPointAtLength(len * del);
      const pt = new DOMPoint(local.x, local.y).matrixTransform(el.getScreenCTM());
      if (document.elementFromPoint(pt.x, pt.y) !== el) continue;
      const bg = bgAt(pt.x, pt.y, el, true); if (bg.unknown) continue;
      rt = Math.min(rt, ratio(blend(fg, bg.c), bg.c));
    }
    if (rt < Infinity) notera(streck ? 'streck' : 'pil', el, rt);
  }
  // Staplar: fyllningen mot spåret, och spåret blandat med det som ligger under det.
  for (const b of document.querySelectorAll('.bar-fill, .kedja-stapel > span')) {
    const tr = b.parentElement; if (!syns(tr)) continue;
    tr.scrollIntoView({ block: 'center' }); await frame();
    const r = tr.getBoundingClientRect(); const under = bgAt(r.left + r.width / 2, r.top + r.height / 2, tr, true); if (under.unknown) continue;
    const f = parse(getComputedStyle(b).backgroundColor), t = parse(getComputedStyle(tr).backgroundColor); if (!f || !t) continue;
    const tb = blend(t, under.c); notera('stapel mot spår', b, ratio(blend(f, tb), tb));
  }
  // Länkarna i figurerna i hovringsläge: sidans :hover-regler kopieras med en klass i stället, i samma lager och media,
  // och läggs på en länk i taget. Texten ska nå 4.5:1 och understrykningen 3:1 mot det som ligger under.
  const hover = [];
  const kopiera = (rules, wrap) => { for (const r of rules) {
    if (r instanceof CSSStyleRule && r.selectorText.includes(':hover')) hover.push(wrap(r.cssText.replaceAll(':hover', '.kontrast-hovrar')));
    else if (r instanceof CSSStyleRule && r.cssRules?.length) kopiera(r.cssRules, t => wrap(`${r.selectorText} { ${t} }`)); // nästlad &:hover
    else if (r instanceof CSSLayerBlockRule) kopiera(r.cssRules, t => wrap(`@layer ${r.name} { ${t} }`));
    else if (r instanceof CSSMediaRule) kopiera(r.cssRules, t => wrap(`@media ${r.conditionText} { ${t} }`));
    else if (r.cssRules) kopiera(r.cssRules, wrap);
  } };
  for (const sh of document.styleSheets) { try { kopiera(sh.cssRules, t => t); } catch {} }
  const hs = document.createElement('style'); hs.textContent = hover.join('\n'); document.head.append(hs);
  for (const a of document.querySelectorAll('.sl-markdown-content :is(figure, .kedjor) a')) {
    if (!syns(a)) continue;
    a.scrollIntoView({ block: 'center', inline: 'center' }); await frame();
    a.classList.add('kontrast-hovrar');
    const r = [...a.getClientRects()].find(b => b.width > 1); const cs = getComputedStyle(a);
    const svgText = a.querySelector('text'); const tcs = svgText ? getComputedStyle(svgText) : cs;
    const bg = r && bgAt(r.left + r.width / 2, r.top + r.height / 2, a);
    if (bg && !bg.unknown) {
      const fg = parse(svgText ? tcs.fill : cs.color);
      if (fg) notera('länktext vid hovring', a, ratio(blend(fg, bg.c), bg.c), 4.5);
      const ul = parse(cs.textDecorationColor);
      if (!svgText && cs.textDecorationLine.includes('underline') && ul) notera('understrykning vid hovring', a, ratio(blend(ul, bg.c), bg.c));
    }
    a.classList.remove('kontrast-hovrar');
  }
  hs.remove(); scrollTo(0, 0);
  const lag = []; const ks = new Set(); for (const x of low.sort((a, b) => a.r / a.need - b.r / b.need)) { const k = x.fg + x.bg; if (!ks.has(k)) { ks.add(k); lag.push(x); } if (lag.length >= 6) break; }
  const grafikLagst = gAlla.sort((a, b) => a.ratio / a.need - b.ratio / b.need).slice(0, 4);
  const grafikPerSlag = {}; for (const x of gAlla) if (!(x.what in grafikPerSlag) || x.ratio < grafikPerSlag[x.what]) grafikPerSlag[x.what] = x.ratio;
  return { theme: document.documentElement.dataset.theme, texter: n, lagst: lag, fel: fails, grafik: g.slice(0, 8), grafikFel: g.length, grafikMatt: gAlla.length, grafikLagst, grafikPerSlag };
}
