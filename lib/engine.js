// 게임 엔진: 상태는 하나의 가변 객체(g)에 두고, 바뀔 때마다 notify()로 React에 알린다.
import {
  ING, ING_ORDER, MENU, FOOD, UPGRADES, EVENTS, TIERS, FACES, NAMES,
  DAY_LEN, CLOSE_GRACE, SAVE_KEY,
} from './data';
import { sfx, setMuted } from './sound';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const won = (n) => '₩' + Math.round(n).toLocaleString('ko-KR');
export const menuById = (id) => MENU.find((m) => m.id === id);

export const freshSave = () => ({
  day: 1, money: 30000, rep: 3, total: 0, bestDay: 0,
  up: { beans: 0, chairs: 0, marketing: 0, expand: 0, barista: 0 },
  menu: ['americano', 'iced', 'latte'], food: [],
});
const idleDay = () => ({ time: 0, ev: EVENTS[0], queue: [], closed: false });

export function loadSave() {
  try { const t = localStorage.getItem(SAVE_KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; }
}
function writeSave(S) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

export function createEngine(notify) {
  const g = {
    S: freshSave(), D: idleDay(),
    cup: [], tray: null, selId: null, nextId: 1,
    running: false, paused: false, muted: false,
    modal: { type: 'title' }, shopTab: 'up', summary: null,
    floats: [], toast: null, saved: null,
  };
  let floatId = 1, toastTimer = 0;
  let locate = () => null; // 컴포넌트가 손님 위치 계산 함수를 넣어줌

  // ---------- 계산 값 ----------
  const cap = () => 4 + g.S.up.expand;
  const priceMul = () => (1 + 0.1 * g.S.up.beans) * (g.D.ev.price || 1);
  const spawnInterval = () => 6.2 * Math.pow(0.87, g.S.up.marketing) * (1.3 - g.S.rep * 0.1)
    * Math.max(0.7, 1 - 0.03 * (g.S.day - 1)) * (g.D.ev.spawn || 1);
  const basePatience = () => 30 * (1 + 0.15 * g.S.up.chairs) * Math.max(0.65, 1 - 0.035 * (g.S.day - 1)) * (g.D.ev.pat || 1);
  const baristaInterval = () => 16 - 3 * (g.S.up.barista - 1);
  const rent = (day = g.S.day) => 15000 + 5000 * (day - 1);
  const wages = () => 15000 * g.S.up.barista;
  const tierName = () => TIERS.filter((t) => g.S.total >= t[0]).pop()[1];
  const upCost = (k) => UPGRADES[k].base * (g.S.up[k] + 1);
  const neededIngs = () => ING_ORDER.filter((k) => g.S.menu.some((id) => menuById(id).r[k]));
  const orderPrice = (c) => (c.m.p + (c.extra ? 500 : 0) + (c.food ? FOOD[c.food].p : 0)) * priceMul();
  const selected = () => g.D.queue.find((x) => x.id === g.selId) || g.D.queue[0] || null;

  // ---------- 연출 ----------
  function toast(msg) {
    g.toast = { msg, key: Date.now() };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { g.toast = null; notify(); }, 1700);
    notify();
  }
  function floatText(c, text, bad) {
    const pos = locate(c.id) || { x: 120, y: 80 };
    const f = { id: floatId++, text, bad, ...pos };
    g.floats.push(f);
    setTimeout(() => { g.floats = g.floats.filter((x) => x !== f); notify(); }, 1250);
  }
  const addRep = (d) => { if (d > 0) d *= g.D.ev.repMul || 1; g.S.rep = clamp(g.S.rep + d, 0, 5); };

  // ---------- 하루 진행 ----------
  function startDay() {
    const evs = g.S.day === 1 ? [EVENTS[0]] : EVENTS;
    let r = Math.random() * evs.reduce((s, e) => s + e.w, 0), ev = evs[0];
    for (const e of evs) { r -= e.w; if (r <= 0) { ev = e; break; } }
    g.D = { time: 0, ev, spawnT: 1.2, baristaT: 0, served: 0, lost: 0, wrong: 0, sales: 0, tips: 0, baristaServed: 0, queue: [], closed: false };
    g.D.baristaT = g.S.up.barista ? baristaInterval() : 0;
    g.cup = []; g.tray = null; g.selId = null;
    g.modal = null; g.running = true; g.paused = false;
    sfx.bell(); notify();
  }

  function spawn() {
    const opts = g.S.menu.map(menuById);
    const weights = opts.map((m) => (m.iced && g.D.ev.icedW ? g.D.ev.icedW : 1));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), m = opts[0];
    for (let i = 0; i < opts.length; i++) { r -= weights[i]; if (r <= 0) { m = opts[i]; break; } }
    const req = { ...m.r };
    let extra = false;
    if (m.r.shot && g.S.day >= 2 && Math.random() < 0.2) { req.shot += 1; extra = true; }
    const food = g.S.food.length && Math.random() < 0.35 ? pick(g.S.food) : null;
    const nIng = Object.values(req).reduce((a, b) => a + b, 0) + (food ? 1 : 0);
    const maxP = basePatience() + nIng * 2.2;
    const c = { id: g.nextId++, m, req, extra, food, p: maxP, maxP, face: pick(FACES), name: pick(NAMES), mood: null, shake: 0 };
    g.D.queue.push(c);
    if (g.selId == null) g.selId = c.id;
    sfx.ding();
  }

  function removeCust(c) {
    g.D.queue = g.D.queue.filter((x) => x !== c);
    if (g.selId === c.id) g.selId = g.D.queue.length ? g.D.queue[0].id : null;
    notify();
  }

  function serve() {
    if (!g.running || g.paused) return;
    const c = selected();
    if (!c) return toast('주문한 손님이 없어요');
    if (!g.cup.length && !g.tray) { sfx.bad(); return toast('컵이 비어 있어요. 재료를 먼저 담으세요'); }
    const counts = {};
    g.cup.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
    const keys = new Set([...Object.keys(counts), ...Object.keys(c.req)]);
    let ok = true;
    for (const k of keys) if ((counts[k] || 0) !== (c.req[k] || 0)) ok = false;
    if ((g.tray || null) !== (c.food || null)) ok = false;

    if (ok) {
      const ratio = c.p / c.maxP, price = orderPrice(c);
      const tipRate = ratio > 0.66 ? 0.2 : ratio > 0.33 ? 0.1 : 0;
      const tip = Math.round((price * tipRate * (0.5 + g.S.rep / 6)) / 100) * 100;
      g.S.money += price + tip; g.S.total += price + tip;
      g.D.sales += price; g.D.tips += tip; g.D.served++;
      addRep(ratio > 0.66 ? 0.06 : ratio > 0.33 ? 0.03 : 0.005);
      floatText(c, '+' + won(price + tip) + (tip ? ' 💝' : ''));
      c.mood = '😍';
      sfx.ok();
      toast(`${c.name} 고객님, 주문하신 ${c.m.n} 나왔습니다!`);
      setTimeout(() => removeCust(c), 180);
    } else {
      c.p = Math.max(1, c.p - c.maxP * 0.25);
      c.shake++;
      g.D.wrong++; addRep(-0.08);
      floatText(c, '주문이랑 달라요!', true);
      sfx.bad();
    }
    g.cup = []; g.tray = null;
    notify();
  }

  function baristaServe() {
    if (!g.D.queue.length) return;
    // 플레이어가 고른 손님은 빼고, 가장 급한 손님부터
    const pool = g.D.queue.length > 1 ? g.D.queue.filter((c) => c.id !== g.selId) : g.D.queue;
    const c = pool.reduce((a, b) => (a.p < b.p ? a : b));
    const price = orderPrice(c);
    g.S.money += price; g.S.total += price; g.D.sales += price; g.D.served++; g.D.baristaServed++;
    addRep(0.02);
    floatText(c, '🧑‍🍳 +' + won(price));
    sfx.partner();
    removeCust(c);
  }

  function custLeaves(c) {
    g.D.lost++; addRep(-0.2);
    floatText(c, '😤 가버렸어요', true);
    sfx.leave();
    removeCust(c);
  }

  function endDay() {
    g.running = false;
    g.D.queue = []; g.selId = null; g.cup = []; g.tray = null;
    const r = rent(), w = wages(), exp = r + w;
    g.S.money -= exp;
    const D = g.D;
    g.S.bestDay = Math.max(g.S.bestDay || 0, D.sales + D.tips);
    const broke = g.S.money < 0;
    g.summary = { day: g.S.day, ev: D.ev.n, served: D.served, baristaServed: D.baristaServed, lost: D.lost, wrong: D.wrong,
      sales: D.sales, tips: D.tips, rent: r, wages: w, net: D.sales + D.tips - exp, money: g.S.money, total: g.S.total, broke };
    if (broke) clearSave();
    g.modal = { type: 'end' };
    notify();
  }

  function tick(dt) {
    if (!g.running || g.paused) return;
    const D = g.D;
    D.time += dt;
    if (D.time < DAY_LEN) {
      D.spawnT -= dt;
      if (D.spawnT <= 0) {
        if (D.queue.length < cap()) spawn();
        D.spawnT = spawnInterval() * rand(0.6, 1.4);
      }
    } else if (!D.closed) {
      D.closed = true; sfx.bell(); toast('🔒 마감 시간! 남은 손님만 응대하세요');
    }
    for (const c of [...D.queue]) { c.p -= dt; if (c.p <= 0) custLeaves(c); }
    if (g.S.up.barista && D.queue.length) {
      D.baristaT -= dt;
      if (D.baristaT <= 0) { baristaServe(); D.baristaT = baristaInterval(); }
    }
    if (D.closed && (!D.queue.length || D.time >= DAY_LEN + CLOSE_GRACE)) endDay();
  }

  // ---------- 플레이어 조작 ----------
  function addIng(k) {
    if (!g.running || g.paused) return;
    if (g.cup.length >= 8) { sfx.bad(); return toast('컵이 가득 찼어요'); }
    g.cup.push(k); sfx.add(); notify();
  }
  function addFood(k) {
    if (!g.running || g.paused) return;
    g.tray = g.tray === k ? null : k; sfx.add(); notify();
  }
  function trash() { if (!g.running) return; g.cup = []; g.tray = null; notify(); }
  function select(id) { g.selId = id; notify(); }
  function moveSel(d) {
    const q = g.D.queue; if (!q.length) return;
    let i = q.findIndex((c) => c.id === g.selId);
    i = (i + d + q.length) % q.length;
    select(q[i].id);
  }

  function buy(type, k) {
    const S = g.S;
    let cost = 0;
    if (type === 'up') { cost = upCost(k); if (S.up[k] >= UPGRADES[k].max || S.money < cost) return; S.up[k]++; }
    if (type === 'menu') { cost = menuById(k).cost; if (S.menu.includes(k) || S.money < cost) return; S.menu.push(k); }
    if (type === 'food') { cost = FOOD[k].cost; if (S.food.includes(k) || S.money < cost) return; S.food.push(k); }
    S.money -= cost; sfx.ok(); notify();
  }

  const api = {
    g,
    setLocator(fn) { locate = fn; },
    tick, serve, trash, addIng, addFood, select, moveSel, buy,
    newGame() { g.S = freshSave(); writeSave(g.S); startDay(); },
    continueGame() { g.S = Object.assign(freshSave(), loadSave()); startDay(); },
    nextDay() { g.S.day++; writeSave(g.S); startDay(); },
    openShop(tab = 'up') { g.shopTab = tab; g.modal = { type: 'shop' }; notify(); },
    pause() { if (g.running && !g.paused) { g.paused = true; g.modal = { type: 'pause' }; notify(); } },
    resume() { g.paused = false; g.modal = null; notify(); },
    showRecipes() {
      if (!g.running) return;
      const wasPaused = g.paused;
      if (g.running) g.paused = true;
      g.modal = { type: 'recipes', resume: g.running && !wasPaused };
      notify();
    },
    closeModal() { g.modal = null; notify(); },
    quit() { g.running = false; g.paused = false; g.saved = loadSave(); g.modal = { type: 'title' }; notify(); },
    refreshSaved() { g.saved = loadSave(); notify(); },
    toggleMute() { g.muted = !g.muted; setMuted(g.muted); notify(); },
    // 계산 값
    cap, priceMul, rent, wages, tierName, upCost, neededIngs, orderPrice, selected,
  };
  return api;
}

export { ING, MENU, FOOD, UPGRADES, DAY_LEN };
