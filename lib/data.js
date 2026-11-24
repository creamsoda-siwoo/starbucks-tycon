// 게임 데이터: 재료, 메뉴, 베이커리, 업그레이드, 이벤트

export const ING = {
  shot:    { n: '에스프레소', e: '☕', c: '#3b2314', h: 16 },
  water:   { n: '물',         e: '💧', c: '#bfe1f7', h: 26 },
  milk:    { n: '우유',       e: '🥛', c: '#f6f0e2', h: 26 },
  ice:     { n: '얼음',       e: '🧊', c: '#e2f4ff', h: 18 },
  vanilla: { n: '바닐라',     e: '🌼', c: '#f3dc95', h: 10 },
  caramel: { n: '카라멜',     e: '🍯', c: '#c7833a', h: 10 },
  dolce:   { n: '돌체 소스',  e: '🥫', c: '#e8c27d', h: 10 },
  choco:   { n: '모카 소스',  e: '🍫', c: '#5b3522', h: 12 },
  matcha:  { n: '말차',       e: '🍵', c: '#86b15d', h: 16 },
  whip:    { n: '휘핑',       e: '🍦', c: '#fffdf6', h: 16 },
};
export const ING_ORDER = Object.keys(ING);

export const MENU = [
  { id: 'americano', n: '카페 아메리카노',      r: { shot: 1, water: 1 },                     p: 4700 },
  { id: 'iced',      n: '아이스 카페 아메리카노', r: { shot: 1, water: 1, ice: 1 },            p: 4700, iced: true },
  { id: 'latte',     n: '카페 라떼',            r: { shot: 1, milk: 1 },                      p: 5200 },
  { id: 'vlatte',    n: '바닐라 라떼',          r: { shot: 1, milk: 1, vanilla: 1 },          p: 5700, cost: 30000 },
  { id: 'macchiato', n: '카라멜 마키아또',      r: { vanilla: 1, milk: 1, shot: 1, caramel: 1 }, p: 6100, cost: 60000 },
  { id: 'dolce',     n: '돌체 라떼',            r: { shot: 1, dolce: 1, milk: 1 },            p: 6100, cost: 80000 },
  { id: 'mocha',     n: '카페 모카',            r: { shot: 1, choco: 1, milk: 1, whip: 1 },   p: 5700, cost: 100000 },
  { id: 'matcha',    n: '제주 말차 라떼',       r: { matcha: 1, milk: 1, whip: 1 },           p: 6300, cost: 130000 },
  { id: 'frappe',    n: '자바 칩 프라푸치노',   r: { choco: 2, milk: 1, ice: 1, whip: 1 },    p: 6300, cost: 180000, iced: true },
];

export const FOOD = {
  croissant: { n: '버터 크루아상',     e: '🥐', p: 3900, cost: 25000 },
  cake:      { n: '뉴욕 치즈 케이크',  e: '🍰', p: 6500, cost: 70000 },
  sandwich:  { n: '햄 & 치즈 샌드위치', e: '🥪', p: 5900, cost: 110000 },
};

export const UPGRADES = {
  beans:     { n: '리저브 원두',     e: '🫘', max: 5, base: 40000,  d: (l) => `메뉴 가격 +10% (현재 +${l * 10}%)` },
  chairs:    { n: '푹신한 소파',     e: '🛋', max: 5, base: 30000,  d: (l) => `손님 인내심 +15% (현재 +${l * 15}%)` },
  marketing: { n: '사이렌 오더 홍보', e: '📱', max: 5, base: 35000,  d: (l) => `손님이 더 자주 와요 (Lv.${l})` },
  expand:    { n: '매장 확장',       e: '🏗', max: 3, base: 80000,  d: (l) => `대기 줄 최대 ${4 + l}명 → ${5 + l}명` },
  barista:   { n: '파트너 고용',     e: '🧑‍🍳', max: 3, base: 100000, d: (l) => `자동으로 음료를 만들어요. 일당 ₩15,000씩 (현재 ${l}명)` },
};

export const EVENTS = [
  { n: '평범한 하루 ☀️', w: 4 },
  { n: '출근 러시 🏃 손님 많음', w: 2, spawn: 0.7 },
  { n: '비 오는 날 🌧 손님 적지만 느긋함', w: 2, spawn: 1.25, pat: 1.25 },
  { n: '폭염 🔥 아이스 음료 인기, 가격 +10%', w: 2, icedW: 3, price: 1.1 },
  { n: '시즌 프로모션 🎄 평판 2배', w: 1, repMul: 2 },
];

export const TIERS = [
  [0, '동네 매장'],
  [300000, '인기 매장'],
  [1000000, 'DT 매장'],
  [3000000, '리저브 매장'],
  [10000000, '글로벌 플래그십'],
];

export const FACES = ['🧑', '👩', '👨', '👵', '👴', '🧑‍💼', '👩‍🎓', '🧔', '👱‍♀️', '🧑‍🎨', '👨‍🔧', '👩‍💻', '🧑‍🚀', '👸', '🤵'];
export const NAMES = ['민지', '서준', '하은', '도윤', '지우', '예준', '수아', '시우', '지민', '하준', '유나', '건우', '채원', '현우', '다은'];

export const DAY_LEN = 100;
export const CLOSE_GRACE = 20;
export const SAVE_KEY = 'starbucks-tycoon-v1';
