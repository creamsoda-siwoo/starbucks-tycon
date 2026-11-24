'use client';

import { useEffect, useReducer, useRef } from 'react';
import Siren from '@/components/Siren';
import { createEngine, won, menuById, ING, MENU, FOOD, UPGRADES, DAY_LEN } from '@/lib/engine';

const FOOD_KEYS = ['Q', 'W', 'E'];

export default function Game() {
  const [, force] = useReducer((x) => x + 1, 0);
  const engRef = useRef(null);
  const sceneRef = useRef(null);
  if (!engRef.current) engRef.current = createEngine(() => force());
  const eng = engRef.current;
  const { g } = eng;
  const { S, D } = g;

  // 손님 위치 (떠오르는 글씨용)
  useEffect(() => {
    eng.setLocator((id) => {
      const scene = sceneRef.current;
      const el = scene && scene.querySelector(`[data-id="${id}"]`);
      if (!el) return null;
      const sr = scene.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left - sr.left + 10, y: r.top - sr.top + 40 };
    });
    eng.refreshSaved();
  }, [eng]);

  // 게임 루프
  useEffect(() => {
    let last = performance.now(), raf = 0;
    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (g.running && !g.paused) { eng.tick(dt); force(); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [eng, g]);

  // 키보드 & 탭 전환 시 일시정지
  useEffect(() => {
    const onKey = (e) => {
      if (!g.running) return;
      if (g.modal) {
        if (e.key === 'Escape' && g.paused) eng.resume();
        return;
      }
      const k = e.key;
      if (/^[1-9]$/.test(k)) { const ing = eng.neededIngs()[+k - 1]; if (ing) eng.addIng(ing); }
      else if (k.length === 1 && 'qwe'.includes(k.toLowerCase())) { const f = g.S.food['qwe'.indexOf(k.toLowerCase())]; if (f) eng.addFood(f); }
      else if (k === ' ' || k === 'Enter') { e.preventDefault(); eng.serve(); }
      else if (k === 'x' || k === 'X' || k === 'Backspace') eng.trash();
      else if (k === 'ArrowLeft') eng.moveSel(-1);
      else if (k === 'ArrowRight') eng.moveSel(1);
      else if (k === 'p' || k === 'P' || k === 'Escape') eng.pause();
      else if (k === 'r' || k === 'R') eng.showRecipes();
    };
    const onVis = () => { if (document.hidden) eng.pause(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); };
  }, [eng, g]);

  // ---------- 화면 조각 ----------
  const t = Math.min((D.time || 0) / DAY_LEN, 1);
  const hour = 7 + Math.floor(t * 14), min = Math.floor(((t * 14) % 1) * 6) * 10;
  const clockLabel = D.closed ? '마감 (남은 손님 응대 중)' : `영업 시간 ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  const sel = eng.selected();
  const ings = eng.neededIngs();
  const cupTotal = g.cup.reduce((s, k) => s + ING[k].h, 0);
  const cupScale = cupTotal > 104 ? 104 / cupTotal : 1;

  return (
    <div id="app">
      <header className="hud">
        <div className="brand">
          <span className="star"><Siren size={40} /></span>
          <div>스타벅스 타이쿤<small>{eng.tierName()}</small></div>
        </div>
        <div className="stat"><span>DAY</span><b className="num">{S.day}</b></div>
        <div className="stat clock">
          <span>{clockLabel}</span>
          <div className="track"><i style={{ width: `${t * 100}%` }} /></div>
        </div>
        <div className="stat"><span>잔고</span><b className="num">{won(S.money)}</b></div>
        <div className="stat"><span>평판</span><b className="num">★{S.rep.toFixed(1)}</b></div>
        <div className="tools">
          <button className="iconbtn" onClick={eng.showRecipes} title="레시피 북 (R)">📖 레시피</button>
          <button className="iconbtn" onClick={eng.toggleMute} title="소리">{g.muted ? '🔇' : '🔊'}</button>
          <button className="iconbtn" onClick={eng.pause} title="일시정지 (P)">⏸</button>
        </div>
      </header>

      <section className="scene" ref={sceneRef}>
        <div className="event">오늘: {D.ev.n}</div>
        <div className="menuboard">
          <b>MENU</b>
          {S.menu.map((id) => { const m = menuById(id); return <div key={id}>{m.n} {(m.p * eng.priceMul() / 1000).toFixed(1)}</div>; })}
        </div>
        <div className="queue">
          {D.queue.length === 0 && (
            <div className="empty">{D.closed ? '🔒 마감했어요. 남은 손님이 없네요.' : '손님을 기다리는 중… ☕'}</div>
          )}
          {D.queue.map((c) => {
            const r = c.p / c.maxP;
            const color = r > 0.66 ? 'var(--apron)' : r > 0.33 ? 'var(--gold)' : 'var(--tomato)';
            const mood = c.mood || (r > 0.66 ? '😊' : r > 0.33 ? '😐' : '😠');
            return (
              <button key={c.id} data-id={c.id} className={`cust ${sel && sel.id === c.id ? 'sel' : ''}`}
                onClick={() => eng.select(c.id)} aria-label={`${c.name} 고객님, ${c.m.n} 주문`}>
                <div className="bubble">
                  <b>{c.m.n}</b>
                  {c.extra && <span className="x">샷 추가</span>}
                  {c.food && <> + {FOOD[c.food].e}</>}
                </div>
                <div className={`face ${c.shake ? 'shaking' : ''}`} key={c.shake}>{c.face}<span className="mood">{mood}</span></div>
                <div className="cname">{c.name} 님</div>
                <div className="pbar"><i style={{ width: `${(r * 100).toFixed(1)}%`, background: color }} /></div>
              </button>
            );
          })}
        </div>
        {g.floats.map((f) => (
          <div key={f.id} className={`float ${f.bad ? 'bad' : ''}`} style={{ left: f.x, top: f.y }}>{f.text}</div>
        ))}
      </section>

      <section className="station">
        <div className="prep">
          <div className="cupwrap">
            <div className="cup">
              {g.cup.map((k, i) => (
                <div key={i} className="layer" title={ING[k].n} style={{ height: ING[k].h * cupScale, background: ING[k].c }} />
              ))}
              <span className="cuplogo"><Siren size={34} /></span>
            </div>
            <div className="tray" aria-label="쟁반">{g.tray ? FOOD[g.tray].e : ''}</div>
          </div>
          <Ticket eng={eng} c={sel} />
        </div>
        <div className="controls">
          <div className="ings">
            {ings.map((k, i) => (
              <button key={k} className="ing" onClick={() => eng.addIng(k)}>
                <span className="e">{ING[k].e}</span>{ING[k].n}<kbd>{i < 9 ? i + 1 : ''}</kbd>
              </button>
            ))}
            {S.food.map((k, j) => (
              <button key={k} className="ing food" onClick={() => eng.addFood(k)}>
                <span className="e">{FOOD[k].e}</span>{FOOD[k].n}<kbd>{FOOD_KEYS[j]}</kbd>
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="btn trash" onClick={eng.trash}>🗑 버리기 <small>(X)</small></button>
            <button className="btn serve" onClick={eng.serve}>☕ 서빙하기 <small>(Space)</small></button>
          </div>
        </div>
      </section>
      <div className="help">손님을 눌러 주문을 고르고, 재료를 담아 서빙하세요 · 키보드: 숫자=재료, ←/→=손님 선택, Space=서빙, X=버리기</div>

      {g.modal && (
        <div className="modal"><div className="card"><Modal eng={eng} /></div></div>
      )}
      {g.toast && <div className="toast" key={g.toast.key}>{g.toast.msg}</div>}
    </div>
  );
}

function Ticket({ eng, c }) {
  const { g } = eng;
  if (!c) return <div className="ticket"><h4>주문서</h4><div className="who">손님이 오면 여기에 주문이 떠요.</div></div>;
  const counts = {};
  g.cup.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
  const chips = Object.entries(c.req).map(([k, n]) => {
    const have = counts[k] || 0;
    const cls = have === n ? 'done' : have > n ? 'over' : '';
    return <span key={k} className={`chip ${cls}`}>{ING[k].e} {ING[k].n} {have}/{n}</span>;
  });
  Object.keys(counts).filter((k) => !c.req[k]).forEach((k) =>
    chips.push(<span key={'x' + k} className="chip over">{ING[k].e} {ING[k].n} ✕</span>));
  if (c.food) chips.push(<span key="food" className={`chip ${g.tray === c.food ? 'done' : ''}`}>{FOOD[c.food].e} {FOOD[c.food].n}</span>);
  else if (g.tray) chips.push(<span key="food" className="chip over">{FOOD[g.tray].e} 주문 안 함 ✕</span>);
  return (
    <div className="ticket">
      <h4>{c.m.n}{c.extra ? ' (샷 추가)' : ''}</h4>
      <div className="who">{c.face} {c.name} 고객님 · {won(eng.orderPrice(c))}</div>
      <div className="chips">{chips}</div>
    </div>
  );
}

function Modal({ eng }) {
  const { g } = eng;
  const { S } = g;
  const type = g.modal.type;

  if (type === 'title') {
    const saved = g.saved;
    return (
      <>
        <div className="title-hero">
          <div className="logo"><Siren size={150} ring /></div>
          <h2>스타벅스 타이쿤</h2>
          <p>작은 동네 매장에서 시작해 글로벌 플래그십 스토어까지 키워 보세요.</p>
        </div>
        <ul className="howto">
          <li>손님을 눌러 주문을 고르면 아래 <b>주문서</b>에 레시피가 떠요.</li>
          <li>재료 버튼으로 컵을 채우고 <b>서빙하기</b>! 빨리 낼수록 팁과 평판이 올라요.</li>
          <li>인내심 막대가 다 닳으면 손님이 떠나고 평판이 깎여요.</li>
          <li>영업이 끝나면 임대료를 내고, 상점에서 메뉴·설비·파트너를 늘리세요.</li>
        </ul>
        <div className="btns">
          {saved && <button className="btn serve" onClick={eng.continueGame}>▶ 이어하기 ({saved.day}일차 · {won(saved.money)})</button>}
          <button className={`btn ${saved ? 'trash' : 'serve'}`} onClick={eng.newGame}>☕ 새 게임</button>
        </div>
      </>
    );
  }

  if (type === 'end') {
    const s = g.summary;
    return (
      <>
        <h2>{s.broke ? '💸 파산했어요…' : `☕ ${s.day}일차 영업 종료`}</h2>
        <p>{s.ev}</p>
        <Row k="서빙한 음료" v={`${s.served}잔${s.baristaServed ? ` (파트너 ${s.baristaServed})` : ''}`} />
        <Row k="놓친 손님" v={`${s.lost}명`} />
        <Row k="잘못 만든 음료" v={`${s.wrong}잔`} />
        <Row k="매출" v={won(s.sales)} />
        <Row k="팁" v={won(s.tips)} />
        <Row k="임대료" v={'-' + won(s.rent)} />
        {s.wages > 0 && <Row k="파트너 일당" v={'-' + won(s.wages)} />}
        <div className="row total"><span>오늘 순이익</span>
          <b className="num" style={{ color: s.net < 0 ? 'var(--tomato)' : 'var(--apron)' }}>{s.net < 0 ? '-' : '+'}{won(Math.abs(s.net))}</b></div>
        <div className="row total"><span>잔고</span><b className="num">{won(s.money)}</b></div>
        {s.broke ? (
          <>
            <p>잔고가 바닥났어요. {s.day}일 동안 총 {won(s.total)}을 벌었습니다.</p>
            <div className="btns"><button className="btn serve" onClick={eng.newGame}>처음부터 다시</button></div>
          </>
        ) : (
          <div className="btns"><button className="btn serve" onClick={() => eng.openShop('up')}>🛒 상점으로</button></div>
        )}
      </>
    );
  }

  if (type === 'shop') {
    const tabs = [['up', '설비'], ['menu', '메뉴 개발'], ['food', '베이커리']];
    let items;
    if (g.shopTab === 'up') {
      items = Object.entries(UPGRADES).map(([k, u]) => {
        const l = S.up[k], maxed = l >= u.max, cost = eng.upCost(k);
        return <ShopItem key={k} e={u.e} name={<>{u.n} <span className="num">Lv.{l}/{u.max}</span></>} desc={u.d(l)}
          label={maxed ? '최대' : won(cost)} disabled={maxed || S.money < cost} onBuy={() => eng.buy('up', k)} />;
      });
    } else if (g.shopTab === 'menu') {
      items = MENU.filter((m) => m.cost).map((m) => {
        const has = S.menu.includes(m.id);
        const rec = Object.entries(m.r).map(([k, n]) => ING[k].e.repeat(n)).join(' ');
        return <ShopItem key={m.id} e={m.iced ? '🥤' : '☕'} name={m.n} desc={`${rec} · 판매가 ${won(m.p)}`}
          label={has ? '출시됨' : won(m.cost)} disabled={has || S.money < m.cost} onBuy={() => eng.buy('menu', m.id)} />;
      });
    } else {
      items = Object.entries(FOOD).map(([k, f]) => {
        const has = S.food.includes(k);
        return <ShopItem key={k} e={f.e} name={f.n} desc={`음료와 함께 주문해요 · 판매가 ${won(f.p)}`}
          label={has ? '입고됨' : won(f.cost)} disabled={has || S.money < f.cost} onBuy={() => eng.buy('food', k)} />;
      });
    }
    return (
      <>
        <div className="shophead"><h2>🛒 상점</h2><b className="num">잔고 {won(S.money)}</b></div>
        <p className="note">내일 임대료 {won(eng.rent(S.day + 1))}{S.up.barista ? ` · 파트너 일당 ${won(eng.wages())}` : ''}가 영업 후 빠져나가요.</p>
        <div className="tabs">
          {tabs.map(([k, n]) => (
            <button key={k} className={`tab ${g.shopTab === k ? 'on' : ''}`} onClick={() => eng.openShop(k)}>{n}</button>
          ))}
        </div>
        {items}
        <div className="btns"><button className="btn serve" onClick={eng.nextDay}>☀️ {S.day + 1}일차 오픈</button></div>
      </>
    );
  }

  if (type === 'pause') {
    return (
      <>
        <h2>⏸ 잠깐 쉬는 중</h2>
        <p>{S.day}일차 · {won(S.money)}</p>
        <div className="btns">
          <button className="btn serve" onClick={eng.resume}>▶ 계속하기</button>
          <button className="btn trash" onClick={eng.quit}>처음 화면</button>
        </div>
      </>
    );
  }

  // recipes
  return (
    <>
      <h2>📖 레시피 북</h2>
      <p className="note">재료를 담는 순서는 상관없어요. 개수만 맞추면 됩니다. &quot;샷 추가&quot;는 에스프레소 한 번 더!</p>
      {S.menu.map((id) => {
        const m = menuById(id);
        return (
          <div className="recipe" key={id}>
            <span><b>{m.n}</b></span>
            <span>{Object.entries(m.r).map(([k, n]) => `${ING[k].e}×${n}`).join(' ')}</span>
          </div>
        );
      })}
      {S.food.length > 0 && (
        <div className="recipe"><span><b>베이커리</b></span><span>{S.food.map((k) => FOOD[k].e + ' ' + FOOD[k].n).join(', ')}</span></div>
      )}
      <div className="btns">
        <button className="btn serve" onClick={g.modal.resume ? eng.resume : eng.closeModal}>닫기</button>
      </div>
    </>
  );
}

function Row({ k, v }) {
  return <div className="row"><span>{k}</span><b className="num">{v}</b></div>;
}

function ShopItem({ e, name, desc, label, disabled, onBuy }) {
  return (
    <div className="shopitem">
      <div className="e">{e}</div>
      <div><b>{name}</b><small>{desc}</small></div>
      <button className="buy num" disabled={disabled} onClick={onBuy}>{label}</button>
    </div>
  );
}
