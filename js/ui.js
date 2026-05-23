/* ============================================================
   EmoteBros — UI Layer
   Input handling, HUD updates, modals, toasts.
   ============================================================ */
window.Game = window.Game || {};
Game.UI = (() => {
  const CFG = Game.CFG, S = Game.STATE, SYS = Game.SYS;

  const keys = {};
  let canvasEl;
  let canvasRect = { left: 0, top: 0, width: 1, height: 1 };

  /* ============== INPUT ============== */
  function init() {
    canvasEl = document.getElementById('canvas');
    window.addEventListener('keydown', onKey, false);
    window.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('resize', updateCanvasRect, false);
    canvasEl.addEventListener('click', onCanvasClick, false);
    updateCanvasRect();

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => {
      if (e.target.id === 'modal') closeModal();
    });
    document.getElementById('helpBtn').addEventListener('click', () => toggleHelp(true));
    document.getElementById('helpClose').addEventListener('click', () => toggleHelp(false));
    document.getElementById('helpModal').addEventListener('click', e => {
      if (e.target.id === 'helpModal') toggleHelp(false);
    });
    document.getElementById('saveBtn').addEventListener('click', () => {
      if (S.save()) toast('Saved.', 'success');
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Reset save and restart?')) {
        S.clearSave();
        location.reload();
      }
    });
  }

  function updateCanvasRect() {
    canvasRect = canvasEl.getBoundingClientRect();
  }

  function onKey(e) {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key;
    keys[k.toLowerCase()] = true;
    // Help toggle
    if (k === '?' || k === '/') { toggleHelp(); e.preventDefault(); return; }
    if (k === 'Escape') {
      const m = document.getElementById('modal');
      const h = document.getElementById('helpModal');
      if (!m.hidden) closeModal();
      else if (!h.hidden) toggleHelp(false);
      return;
    }
    const p = S.player();
    if (!p) return;
    if (k === 'e' || k === 'E') { SYS.interact(p); e.preventDefault(); }
    if (k === ' ' || k === 'Spacebar') { SYS.swingMace(p); e.preventDefault(); }
    if (k === 't' || k === 'T') { SYS.teleportHome(p); e.preventDefault(); }
    if (k === 'g' || k === 'G') {
      if (SYS.canSpin(p)) openShop('spin'); else toast('Spin not ready yet.', 'info');
      e.preventDefault();
    }
    if (k === 'l' || k === 'L') { SYS.toggleBaseLock(p.id); e.preventDefault(); }
  }
  function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }

  function onCanvasClick(e) {
    const p = S.player();
    if (!p) return;
    const world = screenToWorld(e.clientX, e.clientY);
    // Click on a carpet bro within proximity = buy; on a shop = open
    const st = S.get();
    // Shops first
    for (const shop of CFG.SHOPS) {
      if (world.x >= shop.x && world.x <= shop.x + shop.w && world.y >= shop.y && world.y <= shop.y + shop.h) {
        // Only if player is reasonably close
        if (Math.hypot(p.x - (shop.x + shop.w / 2), p.y - (shop.y + shop.h / 2)) < 140) {
          openShop(shop.id);
          return;
        } else {
          toast('Walk closer to that shop first.', 'info');
          return;
        }
      }
    }
    // Click a carpet bro near you
    let best = null, bd = 30;
    for (const b of st.bros) {
      if (b.state !== 'carpet') continue;
      const d = Math.hypot(b.x - world.x, b.y - world.y);
      if (d < bd && Math.hypot(p.x - b.x, p.y - b.y) < 60) { bd = d; best = b; }
    }
    if (best) { SYS.buyBro(p.id, best.instanceId); return; }
  }

  function screenToWorld(sx, sy) {
    updateCanvasRect();
    const x = (sx - canvasRect.left) * (CFG.W / canvasRect.width);
    const y = (sy - canvasRect.top) * (CFG.H / canvasRect.height);
    return { x, y };
  }

  function applyInput() {
    const p = S.player();
    if (!p) return;
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup'])    dy -= 1;
    if (keys['s'] || keys['arrowdown'])  dy += 1;
    if (keys['a'] || keys['arrowleft'])  dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    p.dx = dx; p.dy = dy;
  }

  /* ============== HUD ============== */
  function updateHud() {
    const p = S.player();
    if (!p) return;
    const st = S.get();
    setText('coinAmt', Math.floor(p.coins).toLocaleString());
    setText('ebAmt', Math.floor(p.emoBucks).toLocaleString());
    if (p.petId) {
      const pet = SYS.petDef(p.petId);
      setText('petInfo', `${pet.emoji} +${Math.round(pet.bonus * 100)}%`);
    } else setText('petInfo', 'No pet');
    if (p.mountId) {
      const m = SYS.mountDef(p.mountId);
      setText('mountInfo', `${m.emoji} +${Math.round(m.speed * 100)}%`);
    } else setText('mountInfo', 'On foot');
    document.getElementById('vipPill').style.display = p.isVip ? 'flex' : 'none';

    // Event timer
    setText('eventTimer', formatTime(Math.max(0, st.nextEventAt)));
    if (st.currentEvent) {
      const ev = CFG.EVENTS.find(e => e.id === st.currentEvent);
      setText('eventName', ev ? `${ev.emoji} ${ev.name}` : '');
    } else setText('eventName', '');

    // Lock card
    const bs = S.baseById(p.baseId);
    const lockCard = document.getElementById('lockCard');
    if (bs.lockedUntil > st.time) {
      lockCard.style.display = 'block';
      setText('lockTimer', formatTime(bs.lockedUntil - st.time));
    } else {
      lockCard.style.display = 'none';
    }

    // Spin status
    if (SYS.canSpin(p)) setText('spinStatus', 'Ready! Press G');
    else {
      const wait = CFG.TUNE.SPIN_COOLDOWN_SECONDS - (st.time - p.lastSpinAt);
      setText('spinStatus', `Next: ${formatTime(Math.max(0, wait))}`);
    }

    // Inventory cooldowns
    const maceEl = document.getElementById('invMace');
    if (p.ownsMace) {
      const cd = Math.ceil(Math.max(0, p.maceCooldownUntil - st.time));
      maceEl.classList.toggle('cooldown', cd > 0);
      maceEl.setAttribute('data-cd', cd > 0 ? cd : '');
      maceEl.style.opacity = 1;
    } else { maceEl.style.opacity = 0.35; }
    const tpEl = document.getElementById('invTp');
    if (p.ownsTp) {
      const cd = Math.ceil(Math.max(0, p.tpCooldownUntil - st.time));
      tpEl.classList.toggle('cooldown', cd > 0);
      tpEl.setAttribute('data-cd', cd > 0 ? cd : '');
      tpEl.style.opacity = 1;
    } else { tpEl.style.opacity = 0.35; }

    drainNotices();
    updateInteractHint(p, st);
  }

  function updateInteractHint(p, st) {
    const hint = document.getElementById('interactHint');
    let text = null;
    // Carpet bro?
    let nearest = null, nd = 40;
    for (const b of st.bros) {
      if (b.state !== 'carpet') continue;
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < nd) { nd = d; nearest = b; }
    }
    if (nearest) {
      const def = SYS.broDef(nearest.defId);
      const ok = p.coins >= def.cost;
      text = `<kbd>E</kbd> Buy ${def.name} (${def.cost}💰)${ok ? '' : ' — broke'}`;
    } else {
      // Shop?
      for (const s of CFG.SHOPS) {
        const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
        if (Math.hypot(p.x - cx, p.y - cy) < 70) {
          text = `<kbd>E</kbd> ${s.name}`;
          break;
        }
      }
      if (!text) {
        // Lever
        if (Math.hypot(p.x - CFG.LEVER.x, p.y - CFG.LEVER.y) < 36) text = `<kbd>E</kbd> Pull lever`;
      }
      if (!text) {
        // Lock slab
        const myBase = CFG.BASES[p.baseId];
        if (SYS.pointInRect(p, myBase.lockSlab)) {
          const bs = S.baseById(p.baseId);
          const locked = bs.lockedUntil > st.time;
          text = locked ? '🔒 Already locked' : `<kbd>E</kbd> Lock base (${CFG.TUNE.BASE_LOCK_SECONDS}s)`;
        }
      }
      if (!text) {
        // Steal candidate
        let cand = null, sd = 36;
        for (const b of st.bros) {
          if (b.state !== 'in_slot') continue;
          if (b.ownerId === p.id) continue;
          const d = Math.hypot(b.x - p.x, b.y - p.y);
          if (d < sd) { sd = d; cand = b; }
        }
        if (cand) {
          const def = SYS.broDef(cand.defId);
          text = `<kbd>E</kbd> Steal ${def.name}`;
        }
      }
      if (!text) {
        let dropped = null, dd = 40;
        for (const b of st.bros) {
          if (b.state !== 'dropped') continue;
          const d = Math.hypot(b.x - p.x, b.y - p.y);
          if (d < dd) { dd = d; dropped = b; }
        }
        if (dropped) {
          const def = SYS.broDef(dropped.defId);
          text = `<kbd>E</kbd> Pick up ${def.name}`;
        }
      }
    }
    if (text) { hint.innerHTML = text; hint.classList.add('show'); }
    else hint.classList.remove('show');
  }

  /* ============== NOTICES → TOASTS ============== */
  function drainNotices() {
    const st = S.get();
    while (st.noticeQueue.length) {
      const n = st.noticeQueue.shift();
      if (n.forPlayerId && n.forPlayerId !== 'p0') continue;
      toast(n.text, n.kind);
    }
  }
  function toast(text, kind = 'info') {
    const wrap = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = text;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  /* ============== MODALS / SHOPS ============== */
  function openShop(shopId) {
    const p = S.player();
    if (!p) return;
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const shop = CFG.SHOPS.find(s => s.id === shopId);
    title.textContent = shop ? `${shop.icon} ${shop.name}` : 'Shop';
    body.innerHTML = '';
    if (shopId === 'main') renderMainShop(body, p);
    else if (shopId === 'pet') renderPetShop(body, p);
    else if (shopId === 'lucky') renderLuckyShop(body, p);
    else if (shopId === 'mount') renderMountShop(body, p);
    else if (shopId === 'spin') renderSpin(body, p);
    else if (shopId === 'evolve') renderEvolve(body, p);
    else if (shopId === 'vip') renderVip(body, p);
    else if (shopId === 'info') renderInfo(body);
    modal.hidden = false;
  }
  function closeModal() { document.getElementById('modal').hidden = true; }

  function shopItemEl(item, owned, action) {
    const div = document.createElement('div');
    div.className = 'shop-item' + (owned ? ' owned' : '');
    div.innerHTML = `
      <div class="ico">${item.emoji ?? item.icon ?? '📦'}</div>
      <div class="name">${item.name}</div>
      <div class="desc">${item.desc ?? ''}</div>
      <div class="price ${item.currency === 'eb' ? 'eb' : ''}">${item.cost} ${item.currency === 'eb' ? '💎' : '💰'}</div>
      <button>${owned ? 'Owned' : 'Buy'}</button>
    `;
    const btn = div.querySelector('button');
    if (owned) btn.disabled = true;
    else btn.onclick = () => { action(); refreshOpenShop(); };
    return div;
  }

  function refreshOpenShop() {
    const t = document.getElementById('modalTitle').textContent;
    // re-open the same shop
    const shop = CFG.SHOPS.find(s => t.includes(s.name));
    if (shop) openShop(shop.id);
  }

  function renderMainShop(body, p) {
    body.innerHTML = '<p>Defense gear, lock upgrades, and guard kit.</p>';
    const grid = document.createElement('div'); grid.className = 'shop-grid';
    for (const item of CFG.SHOP_ITEMS) {
      let owned = false;
      if (item.id === 'mace') owned = p.ownsMace;
      if (item.id === 'tp') owned = p.ownsTp;
      if (item.id === 'lock_tp') owned = p.lockLevel >= 2;
      if (item.id === 'bow') owned = p.ownsBow;
      if (item.id === 'tp_wand') owned = p.ownsTpWand;
      const desc = item.id === 'guard_suit' ? `${item.desc} (Owned: ${p.ownsGuardSuit})` : item.desc;
      grid.appendChild(shopItemEl({ ...item, desc }, owned, () => SYS.buyShopItem(p, item.id)));
    }
    body.appendChild(grid);

    // Guard assignment helper
    const ownedBros = S.get().bros.filter(b => b.ownerId === p.id && b.state === 'in_slot' && !b.isGuard);
    if (p.ownsGuardSuit && ownedBros.length) {
      const sec = document.createElement('div');
      sec.innerHTML = '<h3>Assign Guard Suit</h3><p>Pick an EmoteBro in your base to become a guard.</p>';
      const list = document.createElement('div'); list.className = 'shop-grid';
      for (const b of ownedBros.slice(0, 12)) {
        const def = SYS.broDef(b.defId);
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
          <div class="ico">${def.emoji}</div>
          <div class="name">${def.name}</div>
          <div class="desc">Slot ${b.slotIndex + 1}</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap">
            <button data-i="basic">Basic</button>
            ${p.ownsBow ? '<button data-i="bow">Bow</button>' : ''}
            ${p.ownsTpWand ? '<button data-i="tp_wand">Wand</button>' : ''}
          </div>
        `;
        item.querySelectorAll('button').forEach(b2 => {
          b2.onclick = () => {
            const item2 = b2.dataset.i === 'basic' ? null : b2.dataset.i;
            SYS.makeGuard(p.id, b.instanceId, item2);
            refreshOpenShop();
          };
        });
        list.appendChild(item);
      }
      sec.appendChild(list);
      body.appendChild(sec);
    }

    // Sell EmoteBros — partial coin refund + diamonds for rare+ rarities
    const sellable = S.get().bros.filter(b => b.ownerId === p.id && b.state === 'in_slot' && !b.isGuard);
    if (sellable.length) {
      const sec2 = document.createElement('div');
      sec2.innerHTML = '<h3>Sell EmoteBros</h3><p>Refund 10% of cost. Rare+ bros also pay 💎.</p>';
      const list2 = document.createElement('div'); list2.className = 'shop-grid';
      for (const b of sellable) {
        const def = SYS.broDef(b.defId);
        const coinRefund = Math.max(10, Math.floor((def.cost || 100) * 0.1));
        const ebRefund = ({ Rare: 1, Epic: 3, Secret: 10 })[def.rarity] || 0;
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
          <div class="ico">${def.emoji}</div>
          <div class="name">${def.name}</div>
          <div class="desc">Slot ${b.slotIndex + 1} · ${def.rarity}</div>
          <div class="price">+${coinRefund} 💰${ebRefund ? ` · +${ebRefund} 💎` : ''}</div>
          <button>Sell</button>
        `;
        item.querySelector('button').onclick = () => {
          SYS.sellBro(p.id, b.instanceId);
          refreshOpenShop();
        };
        list2.appendChild(item);
      }
      sec2.appendChild(list2);
      body.appendChild(sec2);
    }
  }

  function renderPetShop(body, p) {
    body.innerHTML = '<p>Equip a pet to boost your income.</p>';
    const grid = document.createElement('div'); grid.className = 'shop-grid';
    for (const pet of CFG.PETS) {
      const owned = p.petId === pet.id;
      const desc = `+${Math.round(pet.bonus * 100)}% money`;
      grid.appendChild(shopItemEl({ ...pet, desc }, owned, () => SYS.buyPet(p, pet.id)));
    }
    body.appendChild(grid);
  }

  function renderLuckyShop(body, p) {
    body.innerHTML = '<p>Lucky blocks hatch random EmoteBros. Roll the dice!</p>';
    const grid = document.createElement('div'); grid.className = 'shop-grid';
    for (const def of CFG.LUCKY) {
      const div = document.createElement('div');
      div.className = 'shop-item';
      const chanceLines = Object.entries(def.chances).filter(([_, v]) => v > 0).map(([k, v]) => `${k}: ${v}%`).join(' · ');
      div.innerHTML = `
        <div class="ico">${def.emoji}</div>
        <div class="name">${def.name}</div>
        <div class="desc">${chanceLines}</div>
        <div class="price ${def.currency === 'eb' ? 'eb' : ''}">${def.cost} ${def.currency === 'eb' ? '💎' : '💰'}</div>
        <button>Open</button>
      `;
      div.querySelector('button').onclick = () => {
        const result = SYS.buyLuckyBlock(p.id, def.id);
        if (result) showLuckyReveal(result);
      };
      grid.appendChild(div);
    }
    body.appendChild(grid);
  }

  function showLuckyReveal({ rarity, pick, dropped }) {
    const body = document.getElementById('modalBody');
    const card = document.createElement('div');
    card.className = 'lucky-reveal';
    card.innerHTML = `
      <span class="ico">${pick.emoji}</span>
      <div class="name">${pick.name}</div>
      <div class="rar ${rarity}">${rarity}</div>
      <p style="margin-top:10px">${dropped ? 'Base was full — dropped at door.' : 'Walking to your base!'}</p>
    `;
    body.innerHTML = '';
    body.appendChild(card);
  }

  function renderMountShop(body, p) {
    body.innerHTML = '<p>Mounts cost Emo Bucks 💎 and make you faster.</p>';
    const grid = document.createElement('div'); grid.className = 'shop-grid';
    for (const m of CFG.MOUNTS) {
      const owned = p.mountId === m.id;
      const desc = `+${Math.round(m.speed * 100)}% speed`;
      grid.appendChild(shopItemEl({ ...m, desc, currency: 'eb' }, owned, () => SYS.buyMount(p, m.id)));
    }
    body.appendChild(grid);
  }

  function renderSpin(body, p) {
    body.innerHTML = '';
    const ready = SYS.canSpin(p);
    const slices = CFG.SPIN_SLICES;
    const wheel = document.createElement('div'); wheel.className = 'spin-wheel';
    const r = 130; const cx = 140, cy = 140;
    let svg = `<svg viewBox="0 0 280 280"><g transform="translate(${cx} ${cy})" id="wheelGroup">`;
    const n = slices.length;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const x0 = Math.cos(a0) * r, y0 = Math.sin(a0) * r;
      const x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r;
      svg += `<path d="M0 0 L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${slices[i].color}" stroke="#1d1539" stroke-width="2"/>`;
      const am = (a0 + a1) / 2;
      const tx = Math.cos(am) * (r * 0.65), ty = Math.sin(am) * (r * 0.65);
      svg += `<text x="${tx}" y="${ty}" fill="white" font-family="Fredoka" font-size="13" font-weight="600" text-anchor="middle" dominant-baseline="middle" transform="rotate(${(am * 180 / Math.PI) + 90} ${tx} ${ty})">${slices[i].label}</text>`;
    }
    svg += `</g><polygon points="140,8 130,30 150,30" fill="#fbbf24" stroke="#1d1539" stroke-width="2"/></svg>`;
    wheel.innerHTML = svg;
    body.appendChild(wheel);

    const result = document.createElement('div'); result.className = 'spin-result';
    body.appendChild(result);

    const btn = document.createElement('button'); btn.className = 'spin-btn';
    btn.textContent = ready ? 'SPIN!' : `Cooling down…`;
    btn.disabled = !ready;
    btn.onclick = () => {
      const r = SYS.doSpin(p);
      if (!r) return;
      btn.disabled = true;
      const g = wheel.querySelector('#wheelGroup');
      const sliceAngle = 360 / slices.length;
      const stopAngle = -(r.idx * sliceAngle + sliceAngle / 2);
      const spins = 5;
      const finalRot = spins * 360 + stopAngle;
      g.style.transition = 'transform 2.4s cubic-bezier(.2,.8,.2,1)';
      g.style.transform = `translate(140px, 140px) rotate(${finalRot}deg)`;
      setTimeout(() => {
        result.textContent = `🎉 ${r.slice.label}`;
        toast(`Spin: ${r.slice.label}`, 'gold');
      }, 2500);
    };
    body.appendChild(btn);
  }

  function renderEvolve(body, p) {
    body.innerHTML = '<p>Combine <strong>3</strong> of the same EmoteBro for an upgrade.</p>';
    const grid = document.createElement('div'); grid.className = 'shop-grid';
    for (const recipe of CFG.EVOLUTIONS) {
      const inDef = SYS.broDef(recipe.input);
      const outDef = SYS.broDef(recipe.output);
      const have = S.get().bros.filter(b => b.ownerId === p.id && b.defId === recipe.input && b.state === 'in_slot' && !b.isGuard).length;
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <div class="ico">${inDef.emoji} → ${outDef.emoji}</div>
        <div class="name">${outDef.name}</div>
        <div class="desc">3× ${inDef.name} (you have ${have})</div>
        <div class="price">${recipe.cost} 💰</div>
        <button>Evolve</button>
      `;
      const btn = div.querySelector('button');
      btn.disabled = have < 3 || p.coins < recipe.cost;
      btn.onclick = () => {
        const r = SYS.attemptEvolve(p.id, recipe.input);
        if (r.ok) toast(`✨ Evolved to ${r.result.name}!`, 'rare');
        else if (r.reason === 'broke') toast('Not enough coins!', 'danger');
        else if (r.reason === 'not-enough') toast('Need 3 of the same.', 'danger');
        refreshOpenShop();
      };
      grid.appendChild(div);
    }
    body.appendChild(grid);
  }

  function renderVip(body, p) {
    body.innerHTML = `<p>VIP doubles EmoteBro income and unlocks better gear (in v2 of the spec).</p>`;
    if (p.isVip) {
      body.innerHTML += '<p>👑 You are VIP. Enjoy the 2× money.</p>';
      return;
    }
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="ico">👑</div>
      <div class="name">VIP Membership</div>
      <div class="desc">2× income from all EmoteBros.</div>
      <div class="price eb">100 💎</div>
      <button>Buy</button>
    `;
    div.querySelector('button').onclick = () => {
      if (p.emoBucks < 100) { toast('Not enough Emo Bucks!', 'danger'); return; }
      p.emoBucks -= 100;
      p.isVip = true;
      toast('👑 VIP activated!', 'gold');
      refreshOpenShop();
    };
    body.appendChild(div);
  }

  function renderInfo(body) {
    body.innerHTML = `
      <h3>The basics</h3>
      <ul>
        <li><kbd>E</kbd> near anything to interact — buy a bro, open a shop, pull the lever, steal.</li>
        <li>Walk onto your money slab to collect; onto your lock slab and press <kbd>E</kbd> to lock for ${CFG.TUNE.BASE_LOCK_SECONDS}s.</li>
        <li>3 AI players will buy bros and try to steal from you.</li>
        <li>Stealing: walk into an enemy base while it's unlocked, press <kbd>E</kbd> next to a bro, carry it home.</li>
        <li>Drop a stolen bro? It can be picked back up by anyone — including the original owner.</li>
      </ul>
      <h3>Currencies</h3>
      <ul>
        <li>💰 Coins — main currency, earned from EmoteBros</li>
        <li>💎 Emo Bucks — premium currency, earned from events and spins</li>
      </ul>
    `;
  }

  /* ============== HELP MODAL ============== */
  function toggleHelp(force) {
    const m = document.getElementById('helpModal');
    if (force === undefined) m.hidden = !m.hidden;
    else m.hidden = !force;
  }

  /* ============== UTILS ============== */
  function setText(id, t) { const el = document.getElementById(id); if (el && el.textContent !== t) el.textContent = t; }
  function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return { init, applyInput, updateHud, openShop, toast };
})();
