/* ============================================================
   EmoteBros — Canvas Renderer
   ============================================================ */
window.Game = window.Game || {};
Game.RENDER = (() => {
  const CFG = Game.CFG, S = Game.STATE, SYS = Game.SYS;

  let canvas, ctx;
  function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
  }

  function draw() {
    const st = S.get();
    ctx.clearRect(0, 0, CFG.W, CFG.H);
    drawBackground();
    drawCarpet();
    drawLever();
    drawShops();
    drawBases();
    drawDroppedBrosOnGround();
    drawBros();
    drawPlayers();
    drawEffects();
    drawWorldOverlays();
  }

  /* ============== BACKGROUND ============== */
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, CFG.H);
    g.addColorStop(0, '#0a0617');
    g.addColorStop(1, '#1a1233');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CFG.W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CFG.H); ctx.stroke();
    }
    for (let y = 0; y <= CFG.H; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CFG.W, y); ctx.stroke();
    }
  }

  /* ============== CARPET ============== */
  function drawCarpet() {
    const c = CFG.CARPET;
    const dir = S.get().carpetDirection;
    const g = ctx.createLinearGradient(c.x, 0, c.x + c.w, 0);
    if (dir === 1) {
      g.addColorStop(0, '#6366f1');
      g.addColorStop(0.5, '#a855f7');
      g.addColorStop(1, '#ec4899');
    } else {
      g.addColorStop(0, '#ec4899');
      g.addColorStop(0.5, '#a855f7');
      g.addColorStop(1, '#6366f1');
    }
    roundRect(c.x, c.y, c.w, c.h, 18, g, null);
    // Direction arrows
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 28px Fredoka';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cy = c.y + c.h / 2;
    const dashTime = (S.get().time * 60) % 80;
    for (let x = c.x + 40 - dashTime; x < c.x + c.w; x += 80) {
      ctx.fillText(dir === 1 ? '▶' : '◀', x, cy);
    }
  }

  /* ============== LEVER ============== */
  function drawLever() {
    const l = CFG.LEVER;
    const st = S.get();
    const cd = Math.max(0, st.leverCooldownUntil - st.time);
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.fillStyle = cd > 0 ? '#4b3d75' : '#fbbf24';
    ctx.beginPath(); ctx.arc(0, 0, l.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d1539'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#1d1539';
    ctx.font = 'bold 18px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚙', 0, 1);
    ctx.restore();
    drawLabel('Lever', l.x, l.y + l.r + 14, '#fbbf24');
  }

  /* ============== SHOPS ============== */
  function drawShops() {
    for (const s of CFG.SHOPS) {
      roundRect(s.x, s.y, s.w, s.h, 14, '#251947', '#3d2c6b');
      // icon
      ctx.fillStyle = '#fff';
      ctx.font = '40px Fredoka';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.icon, s.x + s.w / 2, s.y + s.h / 2 - 6);
      // name
      drawLabel(s.name, s.x + s.w / 2, s.y + s.h + 12, '#c5b8e8', 11);
    }
  }

  /* ============== BASES ============== */
  function drawBases() {
    const st = S.get();
    for (const base of CFG.BASES) {
      const bs = S.baseById(base.id);
      const locked = bs.lockedUntil > st.time;
      const owner = S.playerById(`p${bs.ownerId}`);
      // Body
      ctx.fillStyle = 'rgba(26, 18, 51, 0.6)';
      roundRect(base.x, base.y, base.w, base.h, 14, ctx.fillStyle, base.color);
      // Owner banner at top, with door cut-out visual via two segments
      const bannerY = base.y - 26;
      ctx.fillStyle = base.color;
      roundRect(base.x + 8, bannerY, base.w - 16, 22, 8, base.color, null);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${owner ? owner.name : 'Empty'} · ${base.name}`, base.x + base.w / 2, bannerY + 11);

      // Door notch
      ctx.fillStyle = '#0a0617';
      ctx.fillRect(base.door.x - base.door.w / 2, base.y - 2, base.door.w, 6);

      // Lock state aura
      if (locked) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 6]);
        ctx.strokeRect(base.x + 2, base.y + 2, base.w - 4, base.h - 4);
        ctx.setLineDash([]);
      }

      // Lock slab
      drawSlab(base.lockSlab, locked ? '#f59e0b' : '#7c3aed', locked ? '🔒' : 'LOCK');
      // Money slab
      const bank = Math.floor(bs.bankCoins);
      drawSlab(base.moneySlab, '#10b981', bank > 0 ? `+${bank}` : '💰');

      // Slot markers (empty circles)
      for (const slot of base.slots) {
        const id = bs.slots[slot.index];
        if (!id) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(slot.x, slot.y, 16, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      }

      // Lock timer floats above
      if (locked) {
        const remaining = Math.ceil(bs.lockedUntil - st.time);
        drawLabel(`🔒 ${remaining}s`, base.x + base.w / 2, base.y - 42, '#f59e0b', 13);
      }
    }
  }

  function drawSlab(r, color, text) {
    roundRect(r.x, r.y, r.w, r.h, 8, hexAlpha(color, 0.25), color);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2);
  }

  /* ============== EMOTEBROS ============== */
  function drawDroppedBrosOnGround() {
    // Render dropped bros under players, with a small floor shadow
    for (const b of S.get().bros) {
      if (b.state !== 'dropped') continue;
      drawBro(b, true);
    }
  }
  function drawBros() {
    for (const b of S.get().bros) {
      if (b.state === 'dropped') continue;
      drawBro(b, false);
    }
  }
  function drawBro(b, isDropped) {
    const def = SYS.broDef(b.defId);
    if (!def) return;
    // Guard glow
    if (b.isGuard) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.beginPath();
      const range = b.guardItem === 'bow' ? CFG.TUNE.GUARD_BOW_RANGE : CFG.TUNE.GUARD_RANGE;
      ctx.arc(b.x, b.y, range, 0, Math.PI * 2);
      ctx.fill();
    }
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = def.color;
    ctx.strokeStyle = '#1d1539'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Emoji face
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, b.x, b.y + 1);
    if (b.isGuard) {
      ctx.font = '11px sans-serif';
      ctx.fillText(b.guardItem === 'bow' ? '🏹' : b.guardItem === 'tp_wand' ? '🪄' : '🛡️', b.x + 10, b.y - 10);
    }
    if (isDropped) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = 'bold 10px Fredoka';
      ctx.fillText('!', b.x + 12, b.y - 12);
    }
    // Carpet price label
    if (b.state === 'carpet') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(b.x - 22, b.y + 18, 44, 14);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px Fredoka';
      ctx.fillText(`${def.cost}💰`, b.x, b.y + 26);
    }
  }

  /* ============== PLAYERS ============== */
  function drawPlayers() {
    const st = S.get();
    for (const p of st.players) {
      // Mount underneath
      if (p.mountId) {
        const m = SYS.mountDef(p.mountId);
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.emoji, p.x, p.y + 18);
      }
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 18, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
      // Stun ring
      if (p.stunnedUntil > st.time) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y - 22, 8 + Math.sin(st.time * 12) * 2, 0, Math.PI * 2); ctx.stroke();
      }
      // Body
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x - 6 + p.facing.x * 2, p.y - 3 + p.facing.y * 2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 6 + p.facing.x * 2, p.y - 3 + p.facing.y * 2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1539';
      ctx.beginPath(); ctx.arc(p.x - 6 + p.facing.x * 3, p.y - 3 + p.facing.y * 3, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 6 + p.facing.x * 3, p.y - 3 + p.facing.y * 3, 1.5, 0, Math.PI * 2); ctx.fill();
      // Name above
      drawLabel(p.name + (p.isVip ? ' 👑' : ''), p.x, p.y - 30, p.color, 12);
      // Pet beside
      if (p.petId) {
        const pet = SYS.petDef(p.petId);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pet.emoji, p.x + 22, p.y + 4);
      }
      // Carrying indicator
      if (p.carryingBroId) {
        const b = S.broById(p.carryingBroId);
        if (b) {
          ctx.fillStyle = 'rgba(236, 72, 153, 0.85)';
          ctx.fillRect(p.x - 22, p.y - 48, 44, 14);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px Fredoka';
          ctx.textAlign = 'center';
          ctx.fillText('STEAL', p.x, p.y - 41);
        }
      }
    }
  }

  /* ============== EFFECTS ============== */
  function drawEffects() {
    const st = S.get();
    for (const e of st.effects) {
      const a = 1 - (e.t / e.life);
      switch (e.kind) {
        case 'coinBurst':
          ctx.fillStyle = `rgba(251, 191, 36, ${a})`;
          ctx.font = 'bold 22px Fredoka';
          ctx.textAlign = 'center';
          ctx.fillText(`+${e.amount}💰`, e.x, e.y - 40 - e.t * 40);
          break;
        case 'sparkle': {
          ctx.strokeStyle = `rgba(168, 85, 247, ${a})`;
          ctx.lineWidth = 2;
          const r = 6 + e.t * 30;
          ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.stroke();
          break;
        }
        case 'maceSwing': {
          ctx.strokeStyle = `rgba(255, 200, 100, ${a})`;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(e.x, e.y, 40, Math.atan2(e.dir.y, e.dir.x) - 1, Math.atan2(e.dir.y, e.dir.x) + 1);
          ctx.stroke();
          break;
        }
        case 'arrow': {
          const t = clamp01(e.t / e.life);
          const x = lerp(e.x, e.tx, t), y = lerp(e.y, e.ty, t);
          ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = `rgba(245, 158, 11, ${a})`;
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'stun':
          // drawn above player; nothing extra
          break;
        case 'tpOut':
        case 'tpIn': {
          ctx.fillStyle = `rgba(168, 85, 247, ${a * 0.6})`;
          ctx.beginPath(); ctx.arc(e.x, e.y, 30 - e.t * 40, 0, Math.PI * 2); ctx.fill();
          break;
        }
      }
    }
  }

  /* ============== INTERACT HINT (drawn in DOM via UI) ============== */
  function drawWorldOverlays() {
    // Event tag floating in the world (above carpet)
    const st = S.get();
    if (st.currentEvent) {
      const ev = CFG.EVENTS.find(e => e.id === st.currentEvent);
      if (ev) {
        const x = CFG.W / 2;
        const y = CFG.CARPET.y - 22;
        ctx.fillStyle = 'rgba(236, 72, 153, 0.9)';
        const text = `${ev.emoji} ${ev.name}!`;
        ctx.font = 'bold 16px Fredoka';
        const tw = ctx.measureText(text).width;
        roundRect(x - tw / 2 - 10, y - 14, tw + 20, 24, 12, 'rgba(236, 72, 153, 0.9)', null);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
      }
    }
  }

  /* ============== UTILS ============== */
  function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function hexAlpha(hex, a) {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function drawLabel(text, x, y, color = '#fff', size = 12) {
    ctx.font = `bold ${size}px Fredoka`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const w = ctx.measureText(text).width + 10;
    roundRect(x - w / 2, y - size / 2 - 3, w, size + 6, 6, 'rgba(0,0,0,0.5)', null);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  return { init, draw };
})();
