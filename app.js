'use strict';
/* Little Finds — swipe-to-shop prototype for local independent shops.
   All data is sample data kept in localStorage; swap the seed()/save() layer for the team backend. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MIN = 60e3, HOUR = 60 * MIN, DAY_LIMIT = 15, KEY = 'littlefinds:v2';
const CATS = [['Food', '🥕'], ['Home', '🏡'], ['Gifts', '🎁'], ['DIY', '🧵'], ['Bundles', '🧺']];
const EMOJIS = ['🫒', '🥣', '🌼', '🍪', '🎀', '🌿', '📓', '☕', '🍯', '🪡', '🎨', '🥐', '🪴', '✏️', '🕯️', '🧴', '🧦', '🧀', '🌶️', '🧶', '🏺', '📚', '🧸', '💐'];
const SHOPS = [
  { id: 'grocer', name: 'The Little Grocer', distance: 0.3, x: 62, y: 38 },
  { id: 'mallow', name: 'Mallow Bakery', distance: 0.4, x: 40, y: 62 },
  { id: 'clay', name: 'Clay & Kind', distance: 0.7, x: 28, y: 30 },
  { id: 'paper', name: 'Paper Lantern', distance: 0.9, x: 84, y: 22 },
  { id: 'green', name: 'Green Corner', distance: 1.1, x: 78, y: 74 },
  { id: 'thread', name: 'Thread & Thistle', distance: 1.4, x: 16, y: 80 },
];
const LEVELS = [[0, 'Newcomer'], [100, 'Regular'], [250, 'Local hero'], [500, 'Neighbourhood legend']];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '€' + (Number.isInteger(+n) ? String(+n) : (+n).toFixed(2));
const today = () => new Date().toISOString().slice(0, 10);
const shop = id => SHOPS.find(s => s.id === id) || SHOPS[0];
const prod = id => S.products.find(p => p.id === id);
const isDeal = p => p.was && p.dealUntil && p.dealUntil > Date.now();
const pct = p => Math.round((1 - p.price / p.was) * 100);
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
function fmtLeft(ms) {
  if (ms <= 0) return 'ended';
  if (ms < 10 * MIN) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  const m = Math.ceil(ms / MIN); if (m < 60) return m + ' min';
  const h = Math.floor(m / 60); return h < 24 ? `${h}h ${m % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}
function ago(ts) { const m = Math.round((Date.now() - ts) / MIN); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + ' h ago'; }
function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; }

/* ---------- seed data ---------- */
function P(id, shopId, name, cat, emoji, price, stock, why, o = {}) {
  return {
    id, shop: shopId, name, cat, emoji, price, stock, why,
    badge: o.badge || '', story: o.story || '', was: o.was ?? null,
    dealUntil: o.deal ? Date.now() + o.deal * MIN : null, bestBefore: o.bb || null,
    visibility: o.vis || 'public', bundle: o.bundle || null, value: o.value || null,
    stats: { views: o.v ?? 30, likes: o.l ?? 4, maybes: o.m ?? 2, passes: o.p ?? 10, reservations: o.r ?? 1, sales: o.s ?? 1 },
  };
}
function seed() {
  return {
    version: 2, role: 'shopper', ownerShop: 'green', nextId: 100, points: 40,
    prefs: { interests: [], budget: 40, radius: 1.5 },
    swipes: {}, history: [], boost: {}, reservations: [], stamps: [], votes: {}, notes: [],
    drop: { date: today(), seen: 0, unlimited: false },
    products: [
      P(1, 'grocer', 'Smoky paprika oil', 'Food', '🫒', 8.5, 6, 'A drizzle turns roasted veg or hummus into something special.', { badge: 'Supplier sample', story: 'Our supplier sent one trial case. When these six go, they go.', v: 140, l: 9, p: 70, r: 1, s: 0 }),
      P(2, 'clay', 'Speckled breakfast bowl', 'Home', '🥣', 22, 4, 'Hand-thrown locally; lovely for porridge, snacks or keys by the door.', { badge: 'Small batch', v: 96, l: 22, r: 6, s: 5 }),
      P(3, 'green', 'Wildflower seed kit', 'DIY', '🌼', 10.5, 9, 'A tiny windowsill project that brings pollinators to your patch.', { was: 15, deal: 150, badge: 'End of season', v: 80, l: 6, p: 50, r: 0, s: 1 }),
      P(4, 'mallow', 'Cocoa & orange shortbread', 'Food', '🍪', 3, 8, 'Made this morning. Half price before we close so nothing goes to waste.', { was: 6, deal: 50, badge: 'Baked today', bb: 'today', v: 40, l: 12, r: 2, s: 4 }),
      P(5, 'thread', 'Linen knot headband', 'Gifts', '🎀', 16, 3, 'Made from reclaimed fabric, so every pattern is a little different.', { badge: 'One of a kind', v: 55, l: 14, r: 4, s: 3 }),
      P(6, 'green', 'Tiny herb trio', 'Food', '🌿', 14, 5, 'Basil, chives and parsley for a windowsill that earns its keep.', { badge: 'Grow at home', v: 62, l: 15, r: 2, s: 2 }),
      P(7, 'paper', 'Letterpress notebook', 'Gifts', '📓', 9, 12, 'Printed on a 1950s press two streets away. Last year’s cover colours.', { was: 13, deal: 300, badge: 'Clearance', story: 'We over-ordered the sage green. Help us make shelf space!', v: 120, l: 7, p: 80, r: 0, s: 1 }),
      P(8, 'clay', 'Seconds mug — tiny glaze flaw', 'Home', '☕', 11, 7, 'A small glaze drip you’ll stop noticing after the first coffee.', { was: 18, badge: 'Imperfect & cheaper', v: 44, l: 10, r: 1, s: 2 }),
      P(9, 'grocer', 'Fermented chilli honey', 'Food', '🍯', 10, 4, 'Sweet heat for pizza, cheese boards and fried chicken.', { badge: 'New in', v: 18, l: 6, m: 3, r: 0, s: 0 }),
      P(10, 'thread', 'Pocket mending kit', 'DIY', '🪡', 7, 10, 'Needles, six thread colours and patches. Save your favourite jeans.', { v: 70, l: 4, p: 52, r: 0, s: 1 }),
      P(11, 'paper', 'Watercolour postcard set', 'Gifts', '🎨', 8, 15, 'Ten local scenes painted by a Dublin artist. Lovely to frame or send.', { v: 90, l: 6, p: 60, r: 1, s: 0, vis: 'quiet' }),
      P(12, 'mallow', 'Surprise bakery bag', 'Bundles', '🥐', 5, 4, 'Whatever is left at 5pm, bagged up. Always more than you paid for.', { value: 14, deal: 180, was: 7, badge: 'Surprise bag', bundle: ['2 pastries', 'half sourdough', 'a cookie or two'], v: 50, l: 18, r: 5, s: 9 }),
      P(13, 'green', 'Windowsill starter bundle', 'Bundles', '🪴', 24, 3, 'Everything you need to start growing on a small ledge.', { value: 33, badge: 'Bundle', bundle: ['terracotta pot', 'herb seeds', 'compost', 'mister'], v: 35, l: 7, r: 1, s: 1 }),
      P(14, 'paper', 'Members-only desk kit', 'Bundles', '✏️', 15, 5, 'Notebook, pencils and washi tape at a quiet price for regulars.', { value: 23, badge: 'Members price', bundle: ['A5 notebook', '3 pencils', 'washi tape'], vis: 'members', v: 20, l: 3, r: 0, s: 0 }),
    ],
    campaigns: [
      { id: 'c1', shop: 'grocer', name: 'Korean gochujang (500g)', emoji: '🌶️', price: 7.5, target: 30, votes: 29, days: 3, status: 'open' },
      { id: 'c2', shop: 'thread', name: 'Japanese sashiko thread', emoji: '🧶', price: 9, target: 20, votes: 14, days: 6, status: 'open' },
      { id: 'c3', shop: 'clay', name: 'Pottery taster evening (ticket)', emoji: '🏺', price: 25, target: 12, votes: 5, days: 10, status: 'open' },
    ],
  };
}

/* ---------- state ---------- */
let S = load();
const ui = { view: 'discover', filter: 'All', lastViewed: null, busy: false, hold: 30, pendingRender: false, toastT: 0 };
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.version === 2) return s; } } catch (e) { /* storage unavailable */ }
  return seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
function rollover() {
  if (S.drop.date === today()) return;
  S.drop = { date: today(), seen: 0, unlimited: false };
  for (const id in S.swipes) if (S.swipes[id] === 'pass') delete S.swipes[id]; // passed items may come back tomorrow
  S.history = [];
}
const level = () => { let l = LEVELS[0]; for (const x of LEVELS) if (S.points >= x[0]) l = x; return l; };
const isMember = () => S.points >= 100;
function note(text) { S.notes.unshift({ text, ts: Date.now(), read: false }); S.notes = S.notes.slice(0, 30); }

/* ---------- smart feed ---------- */
function reasons(p) {
  const s = shop(p.shop), out = []; let sc = 0;
  const b = S.boost[p.cat] || 0;
  if (isDeal(p)) { const left = p.dealUntil - Date.now(); sc += 2 + (left < HOUR ? 1.5 : 0); out.push(`${pct(p)}% off for ${fmtLeft(left)}`); }
  if (S.prefs.interests.includes(p.cat)) { sc += 3; out.push(`You’re into ${p.cat.toLowerCase()}`); }
  if (b > 0) { sc += b * 1.4; out.push('Similar to things you wanted'); } else sc += b;
  if (p.stock <= 3) { sc += 1; out.push(`Only ${p.stock} left`); }
  if (health(p)[0] === 'slow') { sc += 1.2; out.push('Under-the-radar find'); }
  if (p.visibility === 'members') out.push('Members price for regulars');
  if (p.bestBefore) out.push('Rescue it before it’s wasted');
  sc -= s.distance * 1.2;
  sc += hash(p.id + S.drop.date) * 1.5; // a little daily shuffle so it still feels like discovery
  return { sc, why: [...out.slice(0, 2), `${s.distance} km away`] };
}
function feed() {
  return S.products.filter(p => {
    if (p.stock <= 0 || S.swipes[p.id]) return false;
    if (p.price > S.prefs.budget || shop(p.shop).distance > S.prefs.radius) return false;
    if (p.visibility === 'members' && !isMember()) return false;
    if (p.visibility === 'quiet' && !(S.prefs.interests.includes(p.cat) || (S.boost[p.cat] || 0) > 0 || ui.filter === 'Deals')) return false;
    if (ui.filter === 'Deals') return isDeal(p) || !!p.was;
    return ui.filter === 'All' || p.cat === ui.filter;
  }).map(p => ({ p, ...reasons(p) })).sort((a, b) => b.sc - a.sc);
}

/* ---------- shop analytics ---------- */
function health(p) {
  const st = p.stats, lr = st.views ? st.likes / st.views : 0, cr = st.likes ? st.reservations / st.likes : 0;
  if (p.stock <= 3 && st.reservations >= 3) return ['hot', 'Selling fast', 'Wants are outpacing stock — restock soon.'];
  if (st.views < 20) return ['new', 'New', 'Just listed — give it a day of swipes.'];
  if (lr < 0.1) return ['slow', 'Slow mover', 'Seen often, rarely wanted. Try a flash deal, bundle it, or retake the photo.'];
  if (st.likes >= 8 && cr < 0.25) return ['warm', 'Warm', 'Lots of wants, few holds — a short flash deal could convert them.'];
  return ['ok', 'Steady', 'Performing well.'];
}

/* ---------- rendering ---------- */
function render() {
  rollover();
  $('#radius-label').textContent = `${S.prefs.radius} km`;
  $$('.role').forEach(b => b.classList.toggle('active', b.dataset.role === S.role));
  const unread = S.notes.filter(n => !n.read).length;
  $('#bellcount').textContent = unread || '';
  $('#view').innerHTML = S.role === 'owner' ? ownerView() : shopperView();
  const top = $('#topcard');
  if (top) {
    bindDrag(top);
    const id = +top.dataset.id;
    if (ui.lastViewed !== id) { ui.lastViewed = id; prod(id).stats.views++; save(); }
  }
}

function shopperView() {
  const wanted = Object.values(S.swipes).filter(v => v === 'like' || v === 'maybe').length;
  const active = S.reservations.filter(r => r.status === 'active').length;
  const tabs = [['discover', 'Discover'], ['saved', `Saved${wanted ? ` (${wanted})` : ''}`], ['pickups', `Pickups${active ? ` (${active})` : ''}`], ['bringin', 'Bring it in']];
  const heads = {
    discover: ['Your local discovery feed', 'Find your next little love.', 'Swipe through curious things from shops around your corner.'],
    saved: ['Wanted & maybe', 'Things that caught your eye.', 'Reserve before they go — we’ll tell you if a price drops.'],
    pickups: ['Reserve & collect', 'Your pickup route.', 'Held for you at the shop. Pay when you collect.'],
    bringin: ['Bring it in', 'Vote for what shops stock next.', 'If enough neighbours want it, the shop orders it — and you get first access.'],
  }[ui.view];
  const body = { discover: discoverView, saved: savedView, pickups: pickupsView, bringin: bringInView }[ui.view]();
  return `<section class="head"><div><div class="kicker">${heads[0]}</div><h1>${heads[1]}</h1><p class="sub">${heads[2]}</p></div>
    <nav class="tabs">${tabs.map(([k, l]) => `<button class="tab ${ui.view === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${l}</button>`).join('')}</nav></section>
    <div class="layout"><section class="col">${body}</section><aside class="col">${sidebar()}</aside></div>`;
}

function cardHTML(p, top, why) {
  const s = shop(p.shop);
  return `<article class="card ${top ? 'top' : 'behind'}" ${top ? `id="topcard" data-id="${p.id}"` : ''} aria-label="${esc(p.name)}">
    <div class="photo">
      <span class="badges">${isDeal(p) ? `<span class="deal">−${pct(p)}% · <span data-until="${p.dealUntil}">${fmtLeft(p.dealUntil - Date.now())}</span></span>` : ''}${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}</span>
      ${p.stock <= 3 ? `<span class="low">Only ${p.stock} left</span>` : ''}
      <span class="art">${esc(p.emoji)}</span>
      <span class="stamp s-like">WANT</span><span class="stamp s-pass">PASS</span><span class="stamp s-maybe">MAYBE</span>
    </div>
    <div class="details">
      <div class="row"><h2>${esc(p.name)}</h2><span class="price">${p.was ? `<s>${money(p.was)}</s>` : ''}${money(p.price)}</span></div>
      ${why ? `<div class="why-seen" title="Why am I seeing this?">💡 ${why.map(esc).join(' · ')}</div>` : ''}
      <p class="why">${esc(p.why)}</p>
      ${p.bundle ? `<div class="bundle">Inside: ${p.bundle.map(esc).join(', ')}${p.value ? ` · <b>worth ${money(p.value)}</b>` : ''}</div>` : ''}
      ${p.story ? `<blockquote class="story">“${esc(p.story)}” <cite>— ${esc(s.name)}</cite></blockquote>` : ''}
      <div class="shop"><span><strong>${esc(s.name)}</strong> · ${s.distance} km</span>${p.bestBefore ? `<span class="bb">Best before ${esc(p.bestBefore)}</span>` : `<span class="fresh">● Stock checked ${(p.id * 7) % 50 + 5} min ago</span>`}</div>
    </div></article>`;
}

function discoverView() {
  const f = feed(), left = S.drop.unlimited ? null : Math.max(0, DAY_LIMIT - S.drop.seen);
  const chips = [['All', '✨ For you'], ['Deals', '⏱ Deals'], ...CATS.map(([c, e]) => [c, `${e} ${c}`])];
  let deck;
  if (left === 0) {
    deck = `<div class="empty"><div class="big">☀️</div><h2>That’s today’s local drop.</h2><p>You’ve seen ${DAY_LIMIT} finds today. A fresh batch lands tomorrow — or keep exploring now.</p>
      <div class="btns"><button class="btn" data-act="tab" data-tab="saved">Review saved</button><button class="btn ghost" data-act="unlimited">Keep exploring</button></div></div>`;
  } else if (!f.length) {
    deck = `<div class="empty"><div class="big">🧭</div><h2>You’ve seen everything nearby.</h2><p>Widen your radius or budget, try another category, or bring back things you passed on.</p>
      <div class="btns"><button class="btn" data-act="widen">Widen to 3 km & €100</button><button class="btn ghost" data-act="clearpasses">Show passed items</button></div></div>`;
  } else {
    deck = `<div class="deck">${f[1] ? cardHTML(f[1].p, false) : ''}${cardHTML(f[0].p, true, f[0].why)}</div>`;
  }
  const can = left !== 0 && f.length;
  return `<div class="discover">
    <div class="filters">${chips.map(([k, l]) => `<button class="filter ${ui.filter === k ? 'active' : ''}" data-act="filter" data-filter="${k}">${l}</button>`).join('')}</div>
    <div class="dropbar"><span>☀️ Today’s local drop</span>${left === null ? '<b>Explorer mode</b>' : `<span class="meter"><i style="width:${(left / DAY_LIMIT) * 100}%"></i></span><b>${left} of ${DAY_LIMIT} left</b>`}</div>
    ${deck}
    <div class="actions">
      <button class="act small" data-act="undo" aria-label="Undo last swipe" title="Undo (Z)" ${S.history.length ? '' : 'disabled'}>↺</button>
      <button class="act pass" data-act="swipe" data-kind="pass" aria-label="Pass" title="Pass (←)" ${can ? '' : 'disabled'}>✕</button>
      <button class="act like" data-act="swipe" data-kind="like" aria-label="Want" title="Want (→)" ${can ? '' : 'disabled'}>♥</button>
      <button class="act maybe" data-act="swipe" data-kind="maybe" aria-label="Maybe" title="Maybe (↑)" ${can ? '' : 'disabled'}>★</button>
      <button class="act small" data-act="share" aria-label="Share with a friend" title="Share" ${can ? '' : 'disabled'}>↗</button>
    </div>
    <div class="hint">Drag right to <b>want</b> · left to <b>pass</b> · up for <b>maybe</b><br>Keyboard: ← → ↑ · Z to undo</div></div>`;
}

function itemRow(p, extra = '') {
  const s = shop(p.shop);
  return `<div class="item"><div class="thumb">${esc(p.emoji)}</div><div class="iteminfo"><div class="itemname">${esc(p.name)}</div>
    <div class="itemmeta">${esc(s.name)} · ${s.distance} km${p.stock <= 0 ? ' · <b>sold out</b>' : p.stock <= 3 ? ` · only ${p.stock} left` : ''}</div>${extra}</div>`;
}
function savedView() {
  const list = kind => S.products.filter(p => S.swipes[p.id] === kind);
  const row = p => itemRow(p, `${isDeal(p) || p.was ? `<span class="pill drop">PRICE DROP</span> ` : ''}`) +
    `<div class="itemright"><div class="itemprice">${p.was ? `<span class="was"><s>${money(p.was)}</s></span>` : ''}${money(p.price)}</div>
     <div class="btns">${S.swipes[p.id] === 'maybe' ? `<button class="btn tiny ghost" data-act="promote" data-id="${p.id}">♥ Want</button>` : ''}
     <button class="btn tiny" data-act="reserve" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>Reserve</button>
     <button class="btn tiny line" data-act="remove" data-id="${p.id}" aria-label="Remove">✕</button></div></div></div>`;
  const w = list('like'), m = list('maybe');
  if (!w.length && !m.length) return `<div class="empty"><div class="big">♡</div><h2>Nothing saved yet.</h2><p>Swipe right on anything that catches your eye, or up for a maybe.</p><button class="btn" data-act="tab" data-tab="discover">Start discovering</button></div>`;
  return `<div class="panel"><div class="panelhead"><h3>Wanted</h3><button class="btn tiny ghost" data-act="sharelist">Share list with a friend</button></div>
      ${w.length ? w.map(row).join('') : '<p class="mutetext">Nothing wanted yet.</p>'}</div>
    <div class="panel"><div class="panelhead"><h3>Maybe later</h3><span class="mutetext">We’ll ping you if these get cheaper.</span></div>
      ${m.length ? m.map(row).join('') : '<p class="mutetext">Swipe up on a card to keep it here.</p>'}</div>`;
}

function routeOrder(shopIds) {
  const left = shopIds.map(shop); const out = []; let at = { x: 50, y: 50 };
  while (left.length) {
    left.sort((a, b) => Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y));
    at = left.shift(); out.push(at);
  }
  return out;
}
function routeMap(stops) {
  const pts = [{ x: 50, y: 50 }, ...stops];
  const streets = [20, 40, 60, 80].map(v => `<line class="street" x1="${v}" y1="0" x2="${v}" y2="100"/><line class="street" x1="0" y1="${v}" x2="100" y2="${v}"/>`).join('');
  return `<svg class="map" viewBox="0 0 100 100" role="img" aria-label="Pickup route map">${streets}
    <polyline class="route" points="${pts.map(p => `${p.x},${p.y}`).join(' ')}"/>
    <circle class="me" cx="50" cy="50" r="3"/><text x="50" y="57.5" text-anchor="middle" class="lbl">You</text>
    ${stops.map((s, i) => `<circle class="stop" cx="${s.x}" cy="${s.y}" r="3.6"/><text x="${s.x}" y="${s.y + 1.4}" text-anchor="middle">${i + 1}</text><text x="${s.x}" y="${s.y + 8}" text-anchor="middle" class="lbl">${esc(s.name)}</text>`).join('')}</svg>`;
}
function pickupsView() {
  const act = S.reservations.filter(r => r.status === 'active');
  const past = S.reservations.filter(r => r.status !== 'active').slice(-6).reverse();
  let html;
  if (!act.length) html = `<div class="empty"><div class="big">🛍️</div><h2>No pickups yet.</h2><p>Reserve something you wanted and the shop holds it for you for up to an hour.</p><button class="btn" data-act="tab" data-tab="saved">Go to saved</button></div>`;
  else {
    const stops = routeOrder([...new Set(act.map(r => prod(r.pid).shop))]);
    const walk = Math.round(stops.reduce((t, s, i) => t + Math.hypot(s.x - (i ? stops[i - 1].x : 50), s.y - (i ? stops[i - 1].y : 50)), 0) * 0.25);
    html = `<div class="panel"><div class="panelhead"><h3>One trip, ${stops.length} shop${stops.length > 1 ? 's' : ''}</h3><span class="mutetext">~${Math.max(walk, 4)} min walk</span></div>
      ${routeMap(stops)}
      ${stops.map((s, i) => `<div class="sectionlabel">${i + 1}. ${esc(s.name)} · ${s.distance} km</div>` +
        act.filter(r => prod(r.pid).shop === s.id).map(r => { const p = prod(r.pid); return itemRow(p, `<div class="itemmeta">Held for <span class="timer" data-until="${r.until}">${fmtLeft(r.until - Date.now())}</span> · pay ${money(p.price)} in store</div>`) +
          `<div class="itemright"><div class="btns"><button class="btn tiny" data-act="collect" data-id="${r.id}" title="Simulates the shop confirming pickup">Collected</button><button class="btn tiny line" data-act="cancelres" data-id="${r.id}">Cancel</button></div></div></div>`; }).join('')).join('')}
    </div>`;
  }
  if (past.length) html += `<div class="panel"><h3>History</h3>${past.map(r => { const p = prod(r.pid); return itemRow(p) + `<div class="itemright"><span class="pill ${r.status === 'collected' ? 'done' : ''}">${r.status.toUpperCase()}</span></div></div>`; }).join('')}</div>`;
  return html;
}

function bringInView() {
  return `<div class="panel"><p class="lead">Shops post things they don’t normally stock. Tap <b>I’d buy this</b> — no payment, no commitment. When a campaign hits its target the shop orders it and everyone who voted gets first access.</p>
    ${S.campaigns.map(c => {
      const voted = S.votes[c.id], done = c.status === 'ordering', s = shop(c.shop);
      return `<div class="campaign"><div class="thumb">${esc(c.emoji)}</div><div class="iteminfo">
        <div class="row"><div><div class="itemname">${esc(c.name)}</div><div class="itemmeta">${esc(s.name)} · ${s.distance} km · about ${money(c.price)}</div></div>${done ? '<span class="pill done">ORDERING</span>' : `<span class="pill">${c.days} days left</span>`}</div>
        <div class="progress"><i style="width:${clamp(c.votes / c.target) * 100}%"></i></div>
        <div class="row"><span class="mutetext"><b>${c.votes}</b> of ${c.target} neighbours</span>
        ${done ? `<span class="mutetext">${voted ? '🎉 You’re first in line' : 'Target reached'}</span>` : voted ? `<button class="btn tiny ghost" data-act="unvote" data-id="${c.id}">✓ Voted · undo</button>` : `<button class="btn tiny" data-act="vote" data-id="${c.id}">I’d buy this</button>`}</div>
      </div></div>`;
    }).join('')}</div>`;
}

function sidebar() {
  const [min, name] = level(), nxt = LEVELS.find(l => l[0] > S.points);
  const active = S.reservations.filter(r => r.status === 'active').sort((a, b) => a.until - b.until)[0];
  return `${active ? `<section class="panel"><div class="kicker">Next pickup</div><h3 style="margin-top:6px">${esc(prod(active.pid).name)}</h3>
      <p class="lead">${esc(shop(prod(active.pid).shop).name)} · held for <span class="timer" data-until="${active.until}">${fmtLeft(active.until - Date.now())}</span></p>
      <button class="btn" data-act="tab" data-tab="pickups">See route</button></section>` : ''}
    <section class="panel"><h3>Tune your feed</h3><p class="lead">We learn from your swipes too — these just give us a head start.</p>
      <div class="chips">${CATS.map(([c, e]) => `<button class="chip ${S.prefs.interests.includes(c) ? 'on' : ''}" data-act="interest" data-cat="${c}">${e} ${c}</button>`).join('')}</div>
      <label class="range">Budget up to <b id="budgetv">${money(S.prefs.budget)}</b><input type="range" min="5" max="100" step="5" value="${S.prefs.budget}" data-pref="budget"></label>
      <label class="range">Within <b id="radiusv">${S.prefs.radius} km</b><input type="range" min="0.5" max="3" step="0.25" value="${S.prefs.radius}" data-pref="radius"></label>
    </section>
    <section class="panel rewards"><div class="kicker">Neighbourhood trail</div>
      <div class="points">${S.points} <small>pts · ${name}</small></div>
      <div class="bar"><i style="width:${nxt ? ((S.points - min) / (nxt[0] - min)) * 100 : 100}%"></i></div>
      <div class="mutetext">${nxt ? `${nxt[0] - S.points} pts to ${nxt[1]}${nxt[0] === 100 ? ' — unlocks members-only prices' : ''}` : 'Top level reached!'}</div>
      <div class="stamps">${SHOPS.map(s => `<span class="stampdot ${S.stamps.includes(s.id) ? 'got' : ''}" title="${esc(s.name)}">${esc(s.name.replace(/^The /, '').slice(0, 2))}</span>`).join('')}</div>
      <div class="mutetext">${S.stamps.length >= 3 ? '🎟️ €5 voucher unlocked — show this at any shop.' : `Collect from ${3 - S.stamps.length} more shop${3 - S.stamps.length === 1 ? '' : 's'} to unlock a €5 voucher.`}<br>+10 reserve · +25 collect · +5 vote</div>
    </section>`;
}

/* ---------- owner dashboard ---------- */
function ownerView() {
  const sid = S.ownerShop, s = shop(sid), mine = S.products.filter(p => p.shop === sid);
  const sum = k => mine.reduce((t, p) => t + p.stats[k], 0);
  const views = sum('views'), likes = sum('likes'), res = sum('reservations'), sales = sum('sales'), maybes = sum('maybes');
  const revenue = mine.reduce((t, p) => t + p.stats.sales * p.price, 0);
  const kpis = [[views, 'Card views'], [likes, 'Wants'], [maybes, 'Maybes'], [res, 'Reservations'], [sales, 'Collected'], [views ? Math.round((res / views) * 1000) / 10 + '%' : '—', 'View → hold']];
  const slow = mine.filter(p => health(p)[0] === 'slow' && !p.bundle).length;

  // area-wide demand insight (anonymous, aggregated)
  const byCat = CATS.map(([c]) => [c, S.products.filter(p => p.cat === c).reduce((t, p) => t + p.stats.likes, 0)]);
  const maxCat = Math.max(...byCat.map(x => x[1]), 1);
  const topCat = [...byCat].sort((a, b) => b[1] - a[1])[0];
  const wAvg = k => { const w = S.products.reduce((t, p) => t + p.stats[k], 0); return w ? S.products.reduce((t, p) => t + p.stats[k] * p.price, 0) / w : 0; };
  const myCamps = S.campaigns.filter(c => c.shop === sid);

  return `<section class="head"><div><div class="kicker">Shop dashboard</div><h1>${esc(s.name)}</h1><p class="sub">Turn slow, seasonal and one-off stock into sales — and test demand before you order.</p></div>
    <select class="select" data-act="ownershop" aria-label="Choose shop">${SHOPS.map(x => `<option value="${x.id}" ${x.id === sid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></section>
  <div class="layout" style="grid-template-columns:1fr"><div>
    <div class="kpis">${kpis.map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="ownergrid"><div>
      <section class="panel"><div class="panelhead"><h3>Your stock on Little Finds</h3><button class="btn tiny warn" data-act="autobundle" ${slow >= 2 ? '' : 'disabled'} title="Combine slow movers into a discounted bundle">🧺 Bundle ${slow} slow movers</button></div>
        <p class="lead">Est. revenue from collected pickups: <b>${money(Math.round(revenue))}</b>. Health is based on how often a card is seen vs. wanted vs. reserved.</p>
        <div class="tablewrap"><table><thead><tr><th>Item</th><th class="num">Stock</th><th class="num">Views</th><th class="num">Wants</th><th class="num">Holds</th><th class="num">Sold</th><th>Health</th><th></th></tr></thead><tbody>
        ${mine.length ? mine.map(p => { const [k, l, tip] = health(p); return `<tr><td><b>${esc(p.emoji)} ${esc(p.name)}</b><div class="tip">${money(p.price)}${p.was ? ` <s>${money(p.was)}</s>` : ''}${isDeal(p) ? ` · deal ends in <span data-until="${p.dealUntil}">${fmtLeft(p.dealUntil - Date.now())}</span>` : ''}${p.visibility !== 'public' ? ` · ${p.visibility}` : ''}</div></td>
          <td class="num">${p.stock}</td><td class="num">${p.stats.views}</td><td class="num">${p.stats.likes}</td><td class="num">${p.stats.reservations}</td><td class="num">${p.stats.sales}</td>
          <td><span class="pill ${k}">${l.toUpperCase()}</span><div class="tip">${tip}</div></td>
          <td><div class="btns" style="justify-content:flex-start">${isDeal(p) ? `<button class="btn tiny line" data-act="enddeal" data-id="${p.id}">End deal</button>` : `<button class="btn tiny" data-act="flash" data-id="${p.id}">⚡ 20% off 3h</button>`}<button class="btn tiny ghost" data-act="restock" data-id="${p.id}">+5</button></div></td></tr>`; }).join('') : '<tr><td colspan="8" class="mutetext">No stock listed yet — add your first item.</td></tr>'}
        </tbody></table></div></section>

      <section class="panel"><h3>Add stock in 30 seconds</h3><p class="lead">Perfect for end-of-line, near-expiry, supplier samples and over-orders you’d like to clear quietly.</p>
        <form class="form" id="addform">
          <label class="full">Product name<input name="name" required maxlength="60" placeholder="e.g. Lavender soap ends"></label>
          <label>Category<select name="cat">${CATS.map(([c]) => `<option>${c}</option>`).join('')}</select></label>
          <label>Picture<select name="emoji">${EMOJIS.map(e => `<option>${e}</option>`).join('')}</select></label>
          <label>Price (€)<input name="price" type="number" min="0.5" step="0.5" required value="10"></label>
          <label>Quantity<input name="stock" type="number" min="1" step="1" required value="5"></label>
          <label class="full">Description <span class="hintline">— or let us write one</span><textarea name="why" maxlength="160" placeholder="What makes it worth a look?"></textarea><button type="button" class="btn tiny ghost" data-act="autodesc" style="justify-self:start">✨ Write it for me</button></label>
          <label>Clearance discount<select name="discount"><option value="0">None</option><option value="10">10% off</option><option value="20">20% off</option><option value="30">30% off</option><option value="50">50% off</option></select></label>
          <label>Deal runs for<select name="hours"><option value="1">1 hour</option><option value="3" selected>3 hours</option><option value="6">6 hours</option><option value="24">1 day</option></select></label>
          <label>Best before <span class="hintline">(optional)</span><input name="bb" type="date"></label>
          <label>Who sees it<select name="vis"><option value="public">Everyone nearby</option><option value="members">Members only (regulars)</option><option value="quiet">Quiet clearance (interested shoppers)</option></select></label>
          <label class="full">Shopkeeper note <span class="hintline">(optional)</span><input name="story" maxlength="100" placeholder="e.g. Only three left from our summer range"></label>
          <button class="btn full" type="submit">List it on the feed</button>
        </form></section>
    </div><div>
      <section class="panel"><h3>What shoppers nearby want</h3><p class="lead">Anonymous, aggregated swipes within 1.5 km.</p>
        ${byCat.map(([c, n]) => `<div class="hbar"><span>${c}</span><div><i style="width:${(n / maxCat) * 100}%"></i></div><b class="num">${n}</b></div>`).join('')}
        <div class="insight">🔥 <b>${topCat[0]}</b> gets the most right-swipes in your area.</div>
        <div class="insight">💶 Wanted items average <b>${money(Math.round(wAvg('likes') * 2) / 2)}</b>; passed items average <b>${money(Math.round(wAvg('passes') * 2) / 2)}</b>.</div>
        <div class="insight">🧺 Bundles convert ${(() => { const b = S.products.filter(p => p.bundle), o = S.products.filter(p => !p.bundle); const r = a => a.reduce((t, p) => t + p.stats.reservations, 0) / Math.max(1, a.reduce((t, p) => t + p.stats.views, 0)); return (r(b) / Math.max(r(o), 0.0001)).toFixed(1); })()}× better than single items.</div>
      </section>
      <section class="panel"><h3>Bring it in</h3><p class="lead">Test something you don’t normally stock. Order only once enough neighbours commit.</p>
        ${myCamps.length ? myCamps.map(c => `<div class="item"><div class="thumb">${esc(c.emoji)}</div><div class="iteminfo"><div class="itemname">${esc(c.name)}</div><div class="progress"><i style="width:${clamp(c.votes / c.target) * 100}%"></i></div><div class="itemmeta">${c.votes}/${c.target} votes · ${c.status === 'ordering' ? '<b>Target hit — place your order</b>' : c.days + ' days left'}</div></div></div>`).join('') : '<p class="mutetext">No campaigns yet.</p>'}
        <form class="form" id="campform" style="margin-top:12px">
          <label class="full">Idea<input name="name" required maxlength="60" placeholder="e.g. Oat milk in glass bottles"></label>
          <label>Picture<select name="emoji">${EMOJIS.map(e => `<option>${e}</option>`).join('')}</select></label>
          <label>Likely price (€)<input name="price" type="number" min="1" step="0.5" value="8" required></label>
          <label class="full">Votes needed<input name="target" type="number" min="3" max="500" value="20" required></label>
          <button class="btn full" type="submit">Start campaign</button>
        </form></section>
      <section class="panel"><h3>Fair, low-risk pricing</h3><p class="lead">No upfront fee. Pay 5% only on collected pickups, capped at €29/month — or a flat €19/month once you’re busy.</p></section>
    </div></div></div></div>`;
}

/* ---------- actions ---------- */
function swipe(kind) {
  const top = feed()[0]; if (!top) return;
  const p = top.p, statKey = { like: 'likes', pass: 'passes', maybe: 'maybes' }[kind], dBoost = { like: 1, maybe: 0.5, pass: -0.4 }[kind];
  S.swipes[p.id] = kind; p.stats[statKey]++; S.boost[p.cat] = (S.boost[p.cat] || 0) + dBoost; S.drop.seen++;
  S.history.push({ id: p.id, kind, cat: p.cat, d: dBoost }); S.history = S.history.slice(-20);
  save(); render();
  if (kind === 'like') toast(`♥ ${p.name} added to Wanted`, { label: 'Reserve', act: 'reserve', id: p.id });
  else if (kind === 'maybe') toast('★ Saved for later — we’ll tell you if it gets cheaper');
}
function fly(kind) {
  if (ui.busy) return;
  const el = $('#topcard'); if (!el) return;
  ui.busy = true;
  const tx = kind === 'like' ? 650 : kind === 'pass' ? -650 : 0, ty = kind === 'maybe' ? -800 : 40;
  const stamp = el.querySelector(`.s-${kind}`); if (stamp) stamp.style.opacity = 1;
  el.style.transition = 'transform .32s ease-in, opacity .32s';
  el.style.transform = `translate(${tx}px,${ty}px) rotate(${tx / 22}deg)`;
  el.style.opacity = 0;
  setTimeout(() => { ui.busy = false; swipe(kind); }, 260);
}
function bindDrag(el) {
  let sx = 0, sy = 0, dx = 0, dy = 0, down = false;
  const st = k => el.querySelector(`.s-${k}`);
  el.addEventListener('pointerdown', e => { if (ui.busy) return; down = true; sx = e.clientX; sy = e.clientY; dx = dy = 0; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; });
  el.addEventListener('pointermove', e => {
    if (!down) return; dx = e.clientX - sx; dy = e.clientY - sy;
    el.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 18}deg)`;
    st('like').style.opacity = clamp(dx / 100); st('pass').style.opacity = clamp(-dx / 100);
    st('maybe').style.opacity = Math.abs(dx) < 60 ? clamp(-dy / 110) : 0;
  });
  const end = () => {
    if (!down) return; down = false; el.style.transition = '';
    if (dx > 100) fly('like'); else if (dx < -100) fly('pass'); else if (dy < -110 && Math.abs(dx) < 80) fly('maybe');
    else { el.style.transform = ''; ['like', 'pass', 'maybe'].forEach(k => st(k).style.opacity = 0); }
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
function undo() {
  const h = S.history.pop(); if (!h) return;
  const p = prod(h.id);
  if (p && S.swipes[h.id] === h.kind) { delete S.swipes[h.id]; p.stats[{ like: 'likes', pass: 'passes', maybe: 'maybes' }[h.kind]]--; }
  S.boost[h.cat] = (S.boost[h.cat] || 0) - h.d; S.drop.seen = Math.max(0, S.drop.seen - 1);
  ui.lastViewed = h.id; save(); render(); toast('Brought it back');
}
function openReserve(id) {
  const p = prod(id); if (!p || p.stock <= 0) return toast('Sorry — that one just sold out');
  if (S.reservations.some(r => r.pid === id && r.status === 'active')) { ui.view = 'pickups'; render(); return toast('Already on hold for you'); }
  ui.hold = 30;
  const s = shop(p.shop);
  modal(`<h2>Reserve & collect</h2><p>${esc(s.name)} will hold it behind the counter. Pay in store when you pick it up — no card needed now.</p>
    <div class="modalrow"><div class="thumb">${esc(p.emoji)}</div><div class="iteminfo"><b style="font:17px var(--serif)">${esc(p.name)}</b><small style="display:block;color:var(--muted);margin-top:4px">${esc(s.name)} · ${s.distance} km · ${p.stock} in stock</small></div><strong>${money(p.price)}</strong></div>
    <div class="sectionlabel">Hold it for</div><div class="holds">${[30, 60].map(m => `<button data-act="hold" data-min="${m}" class="${m === 30 ? 'on' : ''}">${m} min</button>`).join('')}</div>
    <button class="confirm" data-act="confirmres" data-id="${p.id}">Reserve · +10 pts</button><button class="cancel" data-act="closemodal">Keep browsing</button>`);
}
function share(p) {
  const text = `Found this at ${shop(p.shop).name}: ${p.name} for ${money(p.price)} on Little Finds`;
  if (navigator.share) navigator.share({ title: 'Little Finds', text }).catch(() => {});
  else copy(text, 'Copied — send it to a friend');
}
function copy(text, msg) {
  try { navigator.clipboard.writeText(text).then(() => toast(msg), () => toast(msg)); } catch (e) { toast(msg); }
}
function autodesc() {
  const f = $('#addform'); const name = f.name.value.trim() || 'This find', cat = f.cat.value;
  const t = { Food: `${name} — small-batch and full of flavour. Grab it while it’s fresh.`, Home: `${name} adds a little character to any shelf or table. Limited stock.`, Gifts: `${name} makes a thoughtful, local gift — not something you’ll find on the high street.`, DIY: `${name}: an easy weekend project with everything you need to get started.`, Bundles: `${name}: a handful of our favourites bundled together for less.` };
  f.why.value = t[cat];
}
function modal(html) { $('#modal').innerHTML = html; $('#overlay').classList.add('show'); }
function closeModal() { $('#overlay').classList.remove('show'); }
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="${action.act}" data-id="${action.id}">${esc(action.label)}</button>` : ''}`;
  t.classList.add('show'); clearTimeout(ui.toastT); ui.toastT = setTimeout(() => t.classList.remove('show'), action ? 3800 : 2000);
}
function applyDeal(p, off, hours) {
  if (!p.was) p.was = p.price;
  p.price = Math.max(0.5, Math.round(p.was * (1 - off / 100) * 2) / 2);
  p.dealUntil = Date.now() + hours * HOUR;
  if (S.swipes[p.id] === 'like' || S.swipes[p.id] === 'maybe') note(`📉 Price drop: ${p.name} is now ${money(p.price)} at ${shop(p.shop).name}`);
}

const A = {
  role: d => { S.role = d.role; save(); render(); window.scrollTo(0, 0); },
  tab: d => { ui.view = d.tab; closeModal(); render(); },
  filter: d => { ui.filter = d.filter; render(); },
  swipe: d => fly(d.kind),
  undo,
  share: () => { const t = feed()[0]; if (t) share(t.p); },
  sharelist: () => copy('My Little Finds wishlist:\n' + S.products.filter(p => S.swipes[p.id] === 'like').map(p => `• ${p.name} — ${money(p.price)} at ${shop(p.shop).name}`).join('\n'), 'Wishlist copied — paste it to a friend'),
  unlimited: () => { S.drop.unlimited = true; save(); render(); },
  widen: () => { S.prefs.radius = 3; S.prefs.budget = 100; ui.filter = 'All'; save(); render(); },
  clearpasses: () => { for (const id in S.swipes) if (S.swipes[id] === 'pass') delete S.swipes[id]; save(); render(); },
  interest: d => { const i = S.prefs.interests; i.includes(d.cat) ? i.splice(i.indexOf(d.cat), 1) : i.push(d.cat); save(); render(); },
  promote: d => { S.swipes[d.id] = 'like'; prod(+d.id).stats.likes++; save(); render(); toast('Moved to Wanted'); },
  remove: d => { delete S.swipes[d.id]; save(); render(); },
  reserve: d => openReserve(+d.id),
  hold: (d, b) => { ui.hold = +d.min; $$('.holds button').forEach(x => x.classList.toggle('on', x === b)); },
  confirmres: d => {
    const p = prod(+d.id); if (!p || p.stock <= 0) return;
    p.stock--; p.stats.reservations++; S.points += 10;
    S.reservations.push({ id: 'r' + S.nextId++, pid: p.id, until: Date.now() + ui.hold * MIN, status: 'active', warned: false });
    if (!S.swipes[p.id]) S.swipes[p.id] = 'like';
    save(); closeModal(); render(); toast(`Held at ${shop(p.shop).name} for ${ui.hold} min`, { label: 'Route', act: 'tab', id: '' });
    $('#toast button')?.setAttribute('data-tab', 'pickups');
  },
  collect: d => {
    const r = S.reservations.find(x => x.id === d.id); if (!r) return;
    const p = prod(r.pid); r.status = 'collected'; p.stats.sales++; S.points += 25;
    const newStamp = !S.stamps.includes(p.shop); if (newStamp) S.stamps.push(p.shop);
    delete S.swipes[p.id]; save(); render();
    toast(newStamp ? `+25 pts and a new stamp from ${shop(p.shop).name}!` : '+25 pts — enjoy your find');
  },
  cancelres: d => { const r = S.reservations.find(x => x.id === d.id); if (!r) return; r.status = 'cancelled'; prod(r.pid).stock++; save(); render(); toast('Hold released'); },
  vote: d => {
    const c = S.campaigns.find(x => x.id === d.id); if (!c || S.votes[c.id]) return;
    S.votes[c.id] = true; c.votes++; S.points += 5;
    if (c.votes >= c.target && c.status === 'open') { c.status = 'ordering'; note(`🎉 ${shop(c.shop).name} is ordering ${c.name} — you’ll get first access`); }
    save(); render(); toast(c.status === 'ordering' ? 'Target reached! The shop is ordering it 🎉' : 'Vote counted — we’ll tell you if it happens');
  },
  unvote: d => { const c = S.campaigns.find(x => x.id === d.id); if (!c || !S.votes[c.id]) return; delete S.votes[c.id]; c.votes--; S.points -= 5; save(); render(); },
  notes: () => {
    const el = $('#notes'); el.hidden = !el.hidden;
    el.innerHTML = `<div class="sectionlabel">Notifications</div>` + (S.notes.length ? S.notes.map(n => `<div class="note ${n.read ? '' : 'unread'}">${esc(n.text)}<small>${ago(n.ts)}</small></div>`).join('') : '<p class="mutetext">Price drops, expiring holds and Bring-it-in news will show up here.</p>');
    if (!el.hidden) { S.notes.forEach(n => n.read = true); save(); $('#bellcount').textContent = ''; }
  },
  closemodal: closeModal,
  reset: () => { if (confirm('Reset the demo? This clears your swipes, pickups and shop changes.')) { S = seed(); ui.view = 'discover'; ui.filter = 'All'; save(); render(); toast('Demo reset'); } },
  flash: d => { const p = prod(+d.id); applyDeal(p, 20, 3); save(); render(); toast(`⚡ Flash deal live — ${p.stats.likes + p.stats.maybes} interested shoppers notified`); },
  enddeal: d => { const p = prod(+d.id); p.price = p.was; p.was = null; p.dealUntil = null; save(); render(); },
  restock: d => { prod(+d.id).stock += 5; save(); render(); },
  autodesc,
  autobundle: () => {
    const slow = S.products.filter(p => p.shop === S.ownerShop && health(p)[0] === 'slow' && !p.bundle && p.stock > 0).slice(0, 3);
    if (slow.length < 2) return;
    const value = slow.reduce((t, p) => t + (p.was || p.price), 0);
    S.products.push({ ...P(S.nextId++, S.ownerShop, `${shop(S.ownerShop).name.replace(/^The /, '')} discovery bundle`, 'Bundles', '🧺', Math.round(value * 0.7 * 2) / 2, Math.min(...slow.map(p => p.stock)), 'A little of everything we love, bundled for less than buying them separately.', { value, badge: 'New bundle', bundle: slow.map(p => p.name), v: 0, l: 0, m: 0, p: 0, r: 0, s: 0 }) });
    save(); render(); toast(`Bundle created from ${slow.length} slow movers — now live on the feed`);
  },
};

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) { if (!e.target.closest('#notes')) $('#notes').hidden = true; return; }
  if (b.tagName === 'SELECT') return;
  if (b.dataset.act !== 'notes') $('#notes').hidden = true;
  A[b.dataset.act]?.(b.dataset, b, e);
});
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeModal(); });
document.addEventListener('change', e => {
  if (e.target.dataset.act === 'ownershop') { S.ownerShop = e.target.value; save(); render(); }
  if (e.target.dataset.pref) { save(); render(); }
});
document.addEventListener('input', e => {
  const k = e.target.dataset.pref; if (!k) return;
  S.prefs[k] = +e.target.value;
  if (k === 'budget') $('#budgetv').textContent = money(S.prefs.budget);
  else { $('#radiusv').textContent = S.prefs.radius + ' km'; $('#radius-label').textContent = S.prefs.radius + ' km'; }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, v = Object.fromEntries(new FormData(f));
  if (f.id === 'addform') {
    const p = P(S.nextId++, S.ownerShop, v.name.trim(), v.cat, v.emoji, +v.price, Math.max(1, Math.round(+v.stock)), v.why.trim() || 'A new find, just listed by the shop.', { badge: 'Just listed', story: v.story.trim(), bb: v.bb || null, vis: v.vis, v: 0, l: 0, m: 0, p: 0, r: 0, s: 0 });
    if (+v.discount) applyDeal(p, +v.discount, +v.hours);
    S.products.push(p); save(); render(); toast(`“${p.name}” is live on the feed`);
  }
  if (f.id === 'campform') {
    S.campaigns.push({ id: 'c' + S.nextId++, shop: S.ownerShop, name: v.name.trim(), emoji: v.emoji, price: +v.price, target: Math.round(+v.target), votes: 0, days: 14, status: 'open' });
    save(); render(); toast('Campaign live — shoppers can vote in “Bring it in”');
  }
});
document.addEventListener('keydown', e => {
  if (e.target.closest?.('input,textarea,select') || $('#overlay').classList.contains('show')) { if (e.key === 'Escape') closeModal(); return; }
  if (S.role !== 'shopper' || ui.view !== 'discover') return;
  const k = { ArrowRight: 'like', ArrowLeft: 'pass', ArrowUp: 'maybe' }[e.key];
  if (k && $('#topcard')) { e.preventDefault(); fly(k); }
  if (e.key === 'z' || e.key === 'Z') undo();
});

/* ---------- clock: countdowns, expiring holds & deals ---------- */
setInterval(() => {
  const now = Date.now(); let changed = false;
  for (const r of S.reservations) {
    if (r.status !== 'active') continue;
    const p = prod(r.pid);
    if (r.until <= now) { r.status = 'expired'; p.stock++; note(`⌛ Your hold on ${p.name} expired`); changed = true; }
    else if (!r.warned && r.until - now < 10 * MIN) { r.warned = true; note(`⏰ 10 minutes left to collect ${p.name} at ${shop(p.shop).name}`); changed = true; }
  }
  for (const p of S.products) if (p.dealUntil && p.dealUntil <= now) { p.price = p.was || p.price; p.was = null; p.dealUntil = null; changed = true; }
  if (changed || ui.pendingRender) {
    save();
    const typing = document.activeElement?.closest('form,input[type=range]');
    if (typing || ui.busy) ui.pendingRender = true; else { ui.pendingRender = false; render(); }
    return;
  }
  $$('[data-until]').forEach(el => { el.textContent = fmtLeft(+el.dataset.until - now); });
}, 1000);

render();
