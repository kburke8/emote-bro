/* ============================================================
   EmoteBros — Gameplay Systems
   Every game rule lives here. Pure(-ish) functions that mutate
   state via Game.STATE.  No DOM, no rendering.
   ============================================================ */
window.Game = window.Game || {};
Game.SYS = (() => {
  const CFG = Game.CFG;
  const T = CFG.TUNE;
  const S = Game.STATE;

  /* ============== GEOMETRY HELPERS ============== */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function pointInRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
  function rectCenter(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
  function pointInBase(p, base) { return pointInRect(p, base); }

  function weightedPick(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [k, w] of Object.entries(weights)) { r -= w; if (r <= 0) return k; }
    return Object.keys(weights)[0];
  }
  function rollChances(chances) { return weightedPick(chances); }

  function broDef(id) { return CFG.BROS_BY_ID[id]; }
  function petDef(id) { return CFG.PETS.find(p => p.id === id); }
  function mountDef(id) { return CFG.MOUNTS.find(m => m.id === id); }

  function playerSpeed(p) {
    const m = p.mountId ? mountDef(p.mountId) : null;
    return T.PLAYER_SPEED * (1 + (m ? m.speed : 0));
  }
  function playerIncomeMult(p) {
    const pet = p.petId ? petDef(p.petId) : null;
    const vipMul = p.isVip ? 2 : 1;
    return (1 + (pet ? pet.bonus : 0)) * vipMul;
  }

  /* ============== PLAYER MOVEMENT ============== */
  function movePlayer(p, dt) {
    if (p.stunnedUntil > S.get().time) {
      // Apply residual knockback
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.85; p.vy *= 0.85;
      return;
    }
    const sp = playerSpeed(p) * 60 * dt;            // dt = seconds, speed in px/tick(60Hz)
    const len = Math.hypot(p.dx, p.dy) || 1;
    const nx = p.dx / len, ny = p.dy / len;
    if (p.dx || p.dy) {
      p.x += nx * sp;
      p.y += ny * sp;
      p.facing = { x: nx, y: ny };
    }
    // Bounds
    p.x = clamp(p.x, 16, CFG.W - 16);
    p.y = clamp(p.y, 16, CFG.H - 16);

    // Prevent walking through walls of other bases that are locked
    enforceLockedBaseWalls(p);

    // Step-on triggers
    triggerSlabs(p);
  }

  function enforceLockedBaseWalls(p) {
    // If a base is locked and the entrant is not the owner, block them.
    // Simple approach: if their previous tick was outside and they entered, push them back to the door edge.
    for (const base of CFG.BASES) {
      const bs = S.baseById(base.id);
      if (bs.lockedUntil <= S.get().time) continue;
      if (p.baseId === base.id) continue;            // own base, allowed
      if (!pointInRect(p, base)) continue;
      // Lock-level 2: teleport intruder to their own base
      const owner = S.playerById(`p${base.ownerId}`);
      if (owner && owner.lockLevel === 2) {
        const mb = CFG.BASES[p.baseId];
        p.x = mb.door.x;
        p.y = mb.door.y + 40;
        if (!p.isAI) S.notice('You touched a Teleport Lock! 🌀', 'rare');
        else S.notice(`${p.name} got teleported by a trap lock! 🌀`, 'info');
        // Owner gets a private notice
        if (owner.id === 'p0') S.notice(`Your teleport lock zapped ${p.name}!`, 'success');
        continue;
      }
      // Otherwise push back through nearest edge
      const cx = base.x + base.w / 2, cy = base.y + base.h / 2;
      const ang = Math.atan2(p.y - cy, p.x - cx);
      // Push outward to base perimeter + a bit
      const px = cx + Math.cos(ang) * (base.w / 2 + 18);
      const py = cy + Math.sin(ang) * (base.h / 2 + 18);
      p.x = clamp(px, 16, CFG.W - 16);
      p.y = clamp(py, 16, CFG.H - 16);
      if (!p.isAI) S.notice('🔒 That base is locked!', 'danger');
    }
  }

  function triggerSlabs(p) {
    const base = CFG.BASES[p.baseId];
    if (pointInRect(p, base.moneySlab)) collectMoney(p);
    // Lock slab requires E press, handled by interact()
  }

  function collectMoney(p) {
    const bs = S.baseById(p.baseId);
    if (bs.bankCoins <= 0) return;
    const amt = Math.floor(bs.bankCoins);
    p.coins += amt;
    bs.bankCoins = 0;
    if (!p.isAI) {
      S.notice(`💰 Collected ${amt.toLocaleString()} coins!`, 'gold');
      S.effect('coinBurst', { x: p.x, y: p.y, amount: amt });
    }
  }

  /* ============== CARPET & SPAWNING ============== */
  function tickCarpet(dt) {
    const st = S.get();
    st.lastSpawnAt += dt;
    if (st.lastSpawnAt < T.CARPET_SPAWN_INTERVAL) return;
    st.lastSpawnAt = 0;
    const onCarpet = st.bros.filter(b => b.state === 'carpet').length;
    if (onCarpet >= T.CARPET_MAX_BROS) return;
    spawnCarpetBro();
  }

  function spawnCarpetBro() {
    const st = S.get();
    const dir = st.carpetDirection;
    const defId = weightedPick(CFG.SPAWN_WEIGHTS);
    const cy = CFG.CARPET.y + CFG.CARPET.h / 2;
    const startX = dir === 1 ? CFG.CARPET.x + 10 : CFG.CARPET.x + CFG.CARPET.w - 10;
    S.addBro(defId, { x: startX, y: cy, state: 'carpet' });

    // Event-specific drops
    if (st.currentEvent === 'secret_egg' && Math.random() < 0.15) {
      S.addBro('secret', { x: startX, y: cy, state: 'carpet' });
    } else if (st.currentEvent === 'mega_appear' && Math.random() < 0.3) {
      S.addBro('mega', { x: startX, y: cy, state: 'carpet' });
    } else if (st.currentEvent === 'ready_evolve' && Math.random() < 0.25) {
      S.addBro('mega_cool', { x: startX, y: cy, state: 'carpet' });
    }
  }

  function tickBros(dt) {
    const st = S.get();
    const dir = st.carpetDirection;
    for (let i = st.bros.length - 1; i >= 0; i--) {
      const b = st.bros[i];
      switch (b.state) {
        case 'carpet': {
          const speed = T.BRO_CARPET_SPEED * 60 * dt;
          b.x += dir * speed;
          // If left the carpet bounds, despawn
          if (b.x < CFG.CARPET.x - 5 || b.x > CFG.CARPET.x + CFG.CARPET.w + 5) {
            S.removeBro(b.instanceId);
          }
          break;
        }
        case 'walking': {
          // walking to its slot in owner's base
          const sp = T.BRO_WALK_SPEED * 60 * dt;
          const dx = b.targetX - b.x, dy = b.targetY - b.y;
          const d = Math.hypot(dx, dy);
          if (d < sp) {
            b.x = b.targetX; b.y = b.targetY;
            b.state = 'in_slot';
          } else {
            b.x += dx / d * sp; b.y += dy / d * sp;
          }
          break;
        }
        case 'in_slot': {
          // money accrual handled in tickIncome
          break;
        }
        case 'carried': {
          const carrier = st.players.find(p => p.carryingBroId === b.instanceId);
          if (!carrier) { b.state = 'dropped'; b.targetX = b.x; b.targetY = b.y; break; }
          // follow carrier
          const dx = carrier.x - b.x, dy = carrier.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > T.CARRIED_FOLLOW_DIST) {
            const sp = (T.BRO_WALK_SPEED + 0.4) * 60 * dt;
            b.x += dx / d * Math.min(sp, d - T.CARRIED_FOLLOW_DIST);
            b.y += dy / d * Math.min(sp, d - T.CARRIED_FOLLOW_DIST);
          }
          // arrival into thief's base = complete the steal
          const thiefBase = CFG.BASES[carrier.baseId];
          if (pointInRect(carrier, thiefBase)) {
            const slot = S.emptySlot(carrier.baseId);
            if (slot !== -1) {
              completeSteal(b, carrier, slot);
            } else {
              // base full, drop it at door
              dropBro(b, carrier);
              if (!carrier.isAI) S.notice('Your base is full — bro dropped!', 'danger');
            }
          }
          break;
        }
        case 'dropped': {
          // Sit still until owner picks it up or someone else nabs it
          break;
        }
        case 'returning': {
          // returning to original owner's slot after a failed steal
          const sp = T.BRO_WALK_SPEED * 60 * dt;
          const dx = b.targetX - b.x, dy = b.targetY - b.y;
          const d = Math.hypot(dx, dy);
          if (d < sp) {
            b.x = b.targetX; b.y = b.targetY;
            b.state = 'in_slot';
          } else {
            b.x += dx / d * sp; b.y += dy / d * sp;
          }
          break;
        }
      }
    }
  }

  /* ============== BUY / SELL / OWNERSHIP ============== */
  function buyBro(playerId, broInstanceId) {
    const p = S.playerById(playerId);
    const b = S.broById(broInstanceId);
    if (!p || !b || b.state !== 'carpet') return { ok: false, reason: 'unavailable' };
    const def = broDef(b.defId);
    if (p.coins < def.cost) {
      if (!p.isAI) S.notice('Not enough coins!', 'danger');
      return { ok: false, reason: 'broke' };
    }
    const slot = S.emptySlot(p.baseId);
    if (slot === -1) {
      if (!p.isAI) S.notice('Your base is full!', 'danger');
      return { ok: false, reason: 'full' };
    }
    p.coins -= def.cost;
    assignBroToSlot(b, p.baseId, slot, p.id);
    const ebReward = rarityEbReward(def.rarity);
    if (ebReward > 0) {
      p.emoBucks += ebReward;
      if (!p.isAI) S.notice(`Rare catch! +${ebReward} 💎`, 'rare');
    }
    if (!p.isAI) {
      S.notice(`Bought ${def.name}!`, 'success');
      S.effect('sparkle', { x: b.x, y: b.y });
    }
    return { ok: true };
  }

  // Diamonds awarded when you acquire a rare-or-better bro (buy or lucky-roll).
  function rarityEbReward(rarity) {
    switch (rarity) {
      case 'Rare':    return 2;
      case 'Epic':    return 5;
      case 'Secret':  return 15;
      default:        return 0;
    }
  }

  // Diamonds + coins refund when selling a bro out of your base.
  function sellBro(playerId, broInstanceId) {
    const p = S.playerById(playerId);
    const b = S.broById(broInstanceId);
    if (!p || !b) return { ok: false };
    if (b.ownerId !== p.id) return { ok: false, reason: 'not-yours' };
    if (b.state !== 'in_slot') return { ok: false, reason: 'busy' };
    if (b.isGuard) return { ok: false, reason: 'is-guard' };
    const def = broDef(b.defId);
    // 10% of cost rounded, or a small floor for evolved bros (cost=0)
    const coinRefund = Math.max(10, Math.floor((def.cost || 100) * 0.1));
    const ebRefund = sellEbAmount(def.rarity);
    p.coins += coinRefund;
    p.emoBucks += ebRefund;
    // free the slot
    S.baseById(p.baseId).slots[b.slotIndex] = null;
    S.removeBro(b.instanceId);
    if (!p.isAI) {
      const ebPart = ebRefund > 0 ? ` and +${ebRefund} 💎` : '';
      S.notice(`Sold ${def.name} for +${coinRefund} 💰${ebPart}`, 'gold');
    }
    return { ok: true, coinRefund, ebRefund };
  }

  function sellEbAmount(rarity) {
    switch (rarity) {
      case 'Rare':    return 1;
      case 'Epic':    return 3;
      case 'Secret':  return 10;
      default:        return 0;
    }
  }

  function assignBroToSlot(b, baseId, slotIndex, ownerId) {
    const slot = CFG.BASES[baseId].slots[slotIndex];
    b.ownerId = ownerId;
    b.state = 'walking';
    b.targetX = slot.x;
    b.targetY = slot.y;
    b.slotIndex = slotIndex;
    S.baseById(baseId).slots[slotIndex] = b.instanceId;
  }

  /* ============== INCOME ============== */
  function tickIncome(dt) {
    const st = S.get();
    st.lastIncomeAt += dt;
    if (st.lastIncomeAt < 1) return;        // tick once per second
    const beats = Math.floor(st.lastIncomeAt);
    st.lastIncomeAt -= beats;
    for (const b of st.bros) {
      if (b.state !== 'in_slot') continue;
      const def = broDef(b.defId);
      const owner = S.playerById(b.ownerId);
      if (!owner) continue;
      const mult = playerIncomeMult(owner);
      const earned = def.mps * mult * beats;
      S.baseById(owner.baseId).bankCoins += earned;
    }
  }

  /* ============== LOCK SLAB ============== */
  function toggleBaseLock(playerId) {
    const p = S.playerById(playerId);
    const base = CFG.BASES[p.baseId];
    const onSlab = pointInRect(p, base.lockSlab);
    if (!onSlab) {
      if (!p.isAI) S.notice('Stand on your lock slab.', 'info');
      return false;
    }
    const bs = S.baseById(p.baseId);
    if (bs.lockedUntil > S.get().time) {
      // already locked — refresh? noop.
      if (!p.isAI) S.notice('Already locked.', 'info');
      return false;
    }
    bs.lockedUntil = S.get().time + T.BASE_LOCK_SECONDS;
    if (!p.isAI) S.notice('🔒 Base locked!', 'success');
    return true;
  }

  /* ============== STEAL & CARRY ============== */
  function attemptSteal(playerId, broInstanceId) {
    const p = S.playerById(playerId);
    const b = S.broById(broInstanceId);
    if (!p || !b) return { ok: false };
    if (b.ownerId === p.id) return { ok: false, reason: 'own' };
    if (b.state !== 'in_slot' && b.state !== 'dropped') return { ok: false };
    if (b.isGuard) {
      if (!p.isAI) S.notice("Guards can't be stolen!", 'danger');
      return { ok: false };
    }
    // free the slot
    if (b.state === 'in_slot') {
      const owner = S.playerById(b.ownerId);
      if (owner) {
        const ob = S.baseById(owner.baseId);
        if (ob.lockedUntil > S.get().time) {
          if (!p.isAI) S.notice('Base is locked!', 'danger');
          return { ok: false };
        }
        ob.slots[b.slotIndex] = null;
        // Notify owner that someone's stealing
        if (owner.id === 'p0') S.notice(`🚨 ${p.name} is stealing your ${broDef(b.defId).name}!`, 'danger');
      }
    }
    p.carryingBroId = b.instanceId;
    b.state = 'carried';
    if (!p.isAI) S.notice(`Carrying ${broDef(b.defId).name}…`, 'rare');
    return { ok: true };
  }

  function completeSteal(b, thief, slotIndex) {
    const originalOwnerId = b.ownerId;
    b.ownerId = thief.id;
    b.slotIndex = slotIndex;
    const slot = CFG.BASES[thief.baseId].slots[slotIndex];
    b.x = slot.x; b.y = slot.y;
    b.targetX = slot.x; b.targetY = slot.y;
    b.state = 'in_slot';
    S.baseById(thief.baseId).slots[slotIndex] = b.instanceId;
    thief.carryingBroId = null;
    if (!thief.isAI) S.notice(`🦹 You stole the ${broDef(b.defId).name}!`, 'rare');
    const orig = S.playerById(originalOwnerId);
    if (orig && orig.id === 'p0') S.notice(`💢 ${thief.name} got away with your ${broDef(b.defId).name}!`, 'danger');
  }

  function dropBro(b, carrier) {
    carrier.carryingBroId = null;
    b.state = 'dropped';
    b.targetX = b.x; b.targetY = b.y;
  }

  function dropAllCarriedForStunned(p) {
    if (!p.carryingBroId) return;
    const b = S.broById(p.carryingBroId);
    if (b) dropBro(b, p);
  }

  // Return dropped bro to original owner if they touch it
  function tickDroppedRecovery() {
    const st = S.get();
    for (const b of st.bros) {
      if (b.state !== 'dropped') continue;
      // Search for any player to pick up — owner gets priority via attemptPickup
      // No-op here; pickup handled via interact()
      // Auto-return if idle for too long? For prototype: if 12s pass, route home
      b._dropTime = (b._dropTime ?? 0) + 0;     // not used; reserved
    }
  }

  function attemptPickupDropped(p) {
    // Pick up the nearest dropped bro within 40px. If it's our own, slot it; if it's an enemy's, carry it.
    const st = S.get();
    const candidates = st.bros.filter(b => b.state === 'dropped' && dist(b, p) < 40);
    if (!candidates.length) return false;
    candidates.sort((a, b) => dist(a, p) - dist(b, p));
    const b = candidates[0];
    if (b.ownerId === p.id) {
      // Restore to our slot if free, else any free
      const ourBase = S.baseById(p.baseId);
      let slot = b.slotIndex >= 0 && !ourBase.slots[b.slotIndex] ? b.slotIndex : S.emptySlot(p.baseId);
      if (slot === -1) {
        if (!p.isAI) S.notice('Base is full.', 'danger');
        return false;
      }
      assignBroToSlot(b, p.baseId, slot, p.id);
      if (!p.isAI) S.notice('Recovered!', 'success');
      return true;
    }
    // Otherwise treat as a fresh carry
    p.carryingBroId = b.instanceId;
    b.state = 'carried';
    if (!p.isAI) S.notice(`Carrying ${broDef(b.defId).name}…`, 'rare');
    return true;
  }

  /* ============== MACE / TELEPORT-TO-BASE ============== */
  function swingMace(p) {
    if (!p.ownsMace) {
      if (!p.isAI) S.notice("You don't have a mace.", 'danger');
      return;
    }
    const now = S.get().time;
    if (p.maceCooldownUntil > now) return;
    p.maceCooldownUntil = now + T.MACE_COOLDOWN;
    S.effect('maceSwing', { x: p.x, y: p.y, dir: p.facing, life: 0.3 });
    const fx = p.facing.x, fy = p.facing.y;
    for (const o of S.get().players) {
      if (o.id === p.id) continue;
      const d = dist(o, p);
      if (d > T.MACE_RANGE) continue;
      // simple facing-cone gate
      const dxn = (o.x - p.x) / (d || 1), dyn = (o.y - p.y) / (d || 1);
      if (fx * dxn + fy * dyn < 0.2) continue;
      hitPlayer(o, fx, fy, T.MACE_KNOCKBACK, T.MACE_STUN_SECONDS);
      if (!p.isAI) S.notice(`🔨 You bonked ${o.name}!`, 'rare');
      if (o.id === 'p0') S.notice(`💢 ${p.name} hit you with a mace!`, 'danger');
    }
  }

  function hitPlayer(p, fx, fy, knock, stun) {
    p.vx = fx * knock; p.vy = fy * knock;
    p.stunnedUntil = Math.max(p.stunnedUntil, S.get().time + stun);
    dropAllCarriedForStunned(p);
    S.effect('stun', { x: p.x, y: p.y, life: stun, target: p.id });
  }

  function teleportHome(p) {
    if (!p.ownsTp) {
      if (!p.isAI) S.notice("You don't have a teleporter.", 'danger');
      return;
    }
    if (p.stunnedUntil > S.get().time) return;
    const now = S.get().time;
    if (p.tpCooldownUntil > now) return;
    p.tpCooldownUntil = now + T.TP_COOLDOWN;
    const door = CFG.BASES[p.baseId].door;
    S.effect('tpOut', { x: p.x, y: p.y });
    p.x = door.x; p.y = door.y + 40;
    S.effect('tpIn', { x: p.x, y: p.y });
    if (!p.isAI) S.notice('Teleported home!', 'rare');
  }

  /* ============== GUARDS ============== */
  function tickGuards(dt) {
    const st = S.get();
    for (const b of st.bros) {
      if (!b.isGuard || b.state !== 'in_slot') continue;
      const ownerBaseId = S.playerById(b.ownerId)?.baseId;
      if (ownerBaseId == null) continue;
      const range = b.guardItem === 'bow' ? T.GUARD_BOW_RANGE : T.GUARD_RANGE;
      if (b.guardCooldownUntil > st.time) continue;
      // Find any non-owner player in range
      for (const p of st.players) {
        if (p.id === b.ownerId) continue;
        if (p.stunnedUntil > st.time) continue;
        const d = dist(p, b);
        if (d > range) continue;
        // Different items
        if (b.guardItem === 'bow') {
          hitPlayer(p, (p.x - b.x) / (d || 1), (p.y - b.y) / (d || 1), 30, T.GUARD_STUN);
          S.effect('arrow', { x: b.x, y: b.y, tx: p.x, ty: p.y, life: 0.4 });
          if (p.id === 'p0') S.notice(`🏹 ${S.playerById(b.ownerId).name}'s bow guard zinged you!`, 'danger');
        } else if (b.guardItem === 'tp_wand') {
          const myBase = CFG.BASES[p.baseId];
          dropAllCarriedForStunned(p);
          p.x = myBase.door.x; p.y = myBase.door.y + 40;
          S.effect('tpIn', { x: p.x, y: p.y });
          if (p.id === 'p0') S.notice(`🪄 A guard teleported you home!`, 'danger');
        } else {
          // Basic guard: mace-like knockback
          hitPlayer(p, (p.x - b.x) / (d || 1), (p.y - b.y) / (d || 1), T.MACE_KNOCKBACK, T.GUARD_MACE_STUN);
          if (p.id === 'p0') S.notice(`🛡️ A guard whacked you!`, 'danger');
        }
        b.guardCooldownUntil = st.time + T.GUARD_COOLDOWN;
        break;
      }
    }
  }

  function makeGuard(playerId, broInstanceId, item = null) {
    const p = S.playerById(playerId);
    const b = S.broById(broInstanceId);
    if (!p || !b || b.ownerId !== p.id) return false;
    if (b.state !== 'in_slot') return false;
    if (!p.ownsGuardSuit) {
      if (!p.isAI) S.notice("You don't own a guard suit.", 'danger');
      return false;
    }
    p.ownsGuardSuit -= 1;
    b.isGuard = true;
    b.guardItem = item;
    if (!p.isAI) S.notice(`🛡️ ${broDef(b.defId).name} is now a guard!`, 'success');
    return true;
  }

  /* ============== LUCKY BLOCKS ============== */
  function buyLuckyBlock(playerId, luckyId) {
    const p = S.playerById(playerId);
    const def = CFG.LUCKY.find(l => l.id === luckyId);
    if (!p || !def) return null;
    const cost = def.cost;
    if (def.currency === 'eb') {
      if (p.emoBucks < cost) { if (!p.isAI) S.notice('Not enough Emo Bucks!', 'danger'); return null; }
      p.emoBucks -= cost;
    } else {
      if (p.coins < cost) { if (!p.isAI) S.notice('Not enough coins!', 'danger'); return null; }
      p.coins -= cost;
    }
    return rollLuckyBlock(p, def);
  }

  function rollLuckyBlock(p, def) {
    const rarity = rollChances(def.chances);
    // pick a random bro of that rarity (spawnable, not evolved)
    const pool = CFG.BROS.filter(b => b.rarity === rarity && !b.evolved);
    const pick = pool[Math.floor(Math.random() * pool.length)] || CFG.BROS[0];
    // EB reward for high-rarity rolls
    const ebReward = rarityEbReward(rarity);
    if (ebReward > 0) {
      p.emoBucks += ebReward;
      if (!p.isAI) S.notice(`Lucky! +${ebReward} 💎`, 'rare');
    }
    // Add to base if room
    const slot = S.emptySlot(p.baseId);
    if (slot === -1) {
      // Drop it at the entrance as a recoverable dropped bro
      const base = CFG.BASES[p.baseId];
      const inst = S.addBro(pick.id, {
        x: base.door.x, y: base.door.y + 30, state: 'dropped', ownerId: p.id,
      });
      if (!p.isAI) S.notice(`Base full — ${pick.name} dropped at door.`, 'danger');
      return { rarity, pick, dropped: true };
    } else {
      const slotInfo = CFG.BASES[p.baseId].slots[slot];
      const inst = S.addBro(pick.id, {
        x: CFG.BASES[p.baseId].door.x, y: CFG.BASES[p.baseId].door.y + 30,
        state: 'walking', ownerId: p.id, slotIndex: slot,
        targetX: slotInfo.x, targetY: slotInfo.y,
      });
      S.baseById(p.baseId).slots[slot] = inst.instanceId;
      return { rarity, pick, dropped: false };
    }
  }

  /* ============== EVOLUTION ============== */
  function attemptEvolve(playerId, defId) {
    const p = S.playerById(playerId);
    const recipe = CFG.EVOLUTIONS.find(e => e.input === defId);
    if (!recipe) return { ok: false, reason: 'no-recipe' };
    const owned = S.get().bros.filter(b => b.ownerId === p.id && b.defId === defId && b.state === 'in_slot' && !b.isGuard);
    if (owned.length < 3) return { ok: false, reason: 'not-enough' };
    if (p.coins < recipe.cost) return { ok: false, reason: 'broke' };
    p.coins -= recipe.cost;
    // Remove 3 inputs, free their slots
    const baseSlots = S.baseById(p.baseId).slots;
    for (let i = 0; i < 3; i++) {
      const b = owned[i];
      baseSlots[b.slotIndex] = null;
      S.removeBro(b.instanceId);
    }
    // Add output to first slot now free
    const slot = S.emptySlot(p.baseId);
    if (slot !== -1) {
      const slotInfo = CFG.BASES[p.baseId].slots[slot];
      const inst = S.addBro(recipe.output, {
        x: slotInfo.x, y: slotInfo.y, state: 'in_slot', ownerId: p.id, slotIndex: slot,
        targetX: slotInfo.x, targetY: slotInfo.y,
      });
      baseSlots[slot] = inst.instanceId;
    }
    return { ok: true, result: broDef(recipe.output) };
  }

  /* ============== DAILY SPIN ============== */
  function canSpin(p) { return S.get().time - (p.lastSpinAt || -9999) >= T.SPIN_COOLDOWN_SECONDS || !p.lastSpinAt; }
  function doSpin(p) {
    if (!canSpin(p)) return null;
    p.lastSpinAt = S.get().time;
    const idx = Math.floor(Math.random() * CFG.SPIN_SLICES.length);
    const slice = CFG.SPIN_SLICES[idx];
    applyPayout(p, slice.payout);
    return { idx, slice };
  }

  function applyPayout(p, payout) {
    if (payout.coins) p.coins += payout.coins;
    if (payout.eb) p.emoBucks += payout.eb;
    if (payout.pet) p.petId = payout.pet;
    if (payout.lucky) {
      const def = CFG.LUCKY.find(l => l.id === payout.lucky);
      rollLuckyBlock(p, def);
    }
    if (payout.item) {
      if (payout.item === 'tp') p.ownsTp = true;
      if (payout.item === 'mace') p.ownsMace = true;
    }
  }

  /* ============== EVENTS ============== */
  function tickEvents(dt) {
    const st = S.get();
    st.nextEventAt -= dt;
    if (st.currentEvent && st.time > st.currentEventUntil) {
      // Award 2 💎 to every player as a participation bonus
      const endedId = st.currentEvent;
      st.currentEvent = null;
      for (const pl of st.players) pl.emoBucks += 2;
      S.notice(`Event ended — +2 💎 for everyone!`, 'gold');
    }
    if (st.nextEventAt <= 0 && !st.currentEvent) {
      const ev = CFG.EVENTS[Math.floor(Math.random() * CFG.EVENTS.length)];
      st.currentEvent = ev.id;
      st.currentEventUntil = st.time + ev.duration;
      st.nextEventAt = T.EVENT_INTERVAL_SECONDS;
      S.notice(`${ev.emoji} Event: ${ev.name}!`, 'rare');
      if (ev.id === 'lucky_storm') {
        // Spawn a few free lucky-block effects — for prototype, drop coins
        const p = S.playerById('p0');
        if (p) p.coins += 100;
      }
    }
  }

  function speedUpNextEvent(p) {
    if (p.emoBucks < 5) return false;
    p.emoBucks -= 5;
    S.get().nextEventAt = Math.min(S.get().nextEventAt, 5);
    if (!p.isAI) S.notice('Event sped up!', 'rare');
    return true;
  }

  /* ============== LEVER ============== */
  function pullLever(p) {
    const st = S.get();
    if (st.leverCooldownUntil > st.time) {
      if (!p.isAI) S.notice('Lever is cooling down.', 'info');
      return false;
    }
    st.carpetDirection *= -1;
    st.leverCooldownUntil = st.time + T.LEVER_COOLDOWN_SECONDS;
    S.notice('🎚️ The EmoteBro path has changed!', 'rare');
    return true;
  }

  /* ============== SHOP PURCHASES ============== */
  function buyShopItem(p, itemId) {
    const item = CFG.SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (item.currency === 'eb') {
      if (p.emoBucks < item.cost) { S.notice('Not enough Emo Bucks!', 'danger'); return false; }
      p.emoBucks -= item.cost;
    } else {
      if (p.coins < item.cost) { S.notice('Not enough coins!', 'danger'); return false; }
      p.coins -= item.cost;
    }
    if (item.id === 'mace') p.ownsMace = true;
    if (item.id === 'tp') p.ownsTp = true;
    if (item.id === 'guard_suit') p.ownsGuardSuit += 1;
    if (item.id === 'bow') p.ownsBow = true;
    if (item.id === 'tp_wand') p.ownsTpWand = true;
    if (item.id === 'lock_tp') p.lockLevel = 2;
    S.notice(`Bought ${item.name}!`, 'success');
    return true;
  }

  function buyPet(p, petId) {
    const pet = petDef(petId);
    if (!pet) return false;
    if (pet.currency === 'eb') {
      if (p.emoBucks < pet.cost) { S.notice('Not enough Emo Bucks!', 'danger'); return false; }
      p.emoBucks -= pet.cost;
    } else {
      if (p.coins < pet.cost) { S.notice('Not enough coins!', 'danger'); return false; }
      p.coins -= pet.cost;
    }
    p.petId = pet.id;
    S.notice(`${pet.emoji} Equipped ${pet.name}!`, 'success');
    return true;
  }

  function buyMount(p, mountId) {
    const m = mountDef(mountId);
    if (!m) return false;
    if (p.emoBucks < m.cost) { S.notice('Not enough Emo Bucks!', 'danger'); return false; }
    p.emoBucks -= m.cost;
    p.mountId = m.id;
    S.notice(`${m.emoji} Mounted ${m.name}!`, 'success');
    return true;
  }

  /* ============== INTERACTION ENTRY POINT ============== */
  // Called when the player presses E. Resolves the most relevant action by proximity.
  function interact(p) {
    const st = S.get();
    // 1) Carrying a bro & inside own base → drop into a slot (handled by tickBros completeSteal)
    // 2) On lock slab → toggle lock
    const myBase = CFG.BASES[p.baseId];
    if (pointInRect(p, myBase.lockSlab)) { toggleBaseLock(p.id); return; }
    // 3) Near lever
    if (dist(p, CFG.LEVER) < 36) { pullLever(p); return; }
    // 4) Near shop
    for (const shop of CFG.SHOPS) {
      const sc = rectCenter(shop);
      if (dist(p, sc) < 70) {
        // Emit UI hook — handled in UI layer
        if (!p.isAI) Game.UI && Game.UI.openShop(shop.id);
        return;
      }
    }
    // 5) Near a carpet bro to buy
    let nearest = null, nd = 40;
    for (const b of st.bros) {
      if (b.state !== 'carpet') continue;
      const d = dist(b, p);
      if (d < nd) { nd = d; nearest = b; }
    }
    if (nearest) { buyBro(p.id, nearest.instanceId); return; }
    // 6) Pickup a dropped bro
    if (attemptPickupDropped(p)) return;
    // 7) Near an enemy slotted bro → attempt steal
    let stealCand = null, sd = 36;
    for (const b of st.bros) {
      if (b.state !== 'in_slot') continue;
      if (b.ownerId === p.id) continue;
      const d = dist(b, p);
      if (d < sd) { sd = d; stealCand = b; }
    }
    if (stealCand) { attemptSteal(p.id, stealCand.instanceId); return; }
  }

  /* ============== TOP-LEVEL TICK ============== */
  function tick(dt) {
    const st = S.get();
    st.tick++;
    st.time += dt;
    // Players (movement handled here, AI fills dx/dy)
    for (const p of st.players) movePlayer(p, dt);
    tickCarpet(dt);
    tickBros(dt);
    tickIncome(dt);
    tickGuards(dt);
    tickEvents(dt);
    tickDroppedRecovery();
    tickEffects(dt);
  }

  function tickEffects(dt) {
    const st = S.get();
    for (let i = st.effects.length - 1; i >= 0; i--) {
      st.effects[i].t += dt;
      if (st.effects[i].t >= st.effects[i].life) st.effects.splice(i, 1);
    }
  }

  return {
    // utils
    dist, pointInRect, broDef, petDef, mountDef,
    playerSpeed, playerIncomeMult,
    // tick
    tick,
    // actions
    interact, swingMace, teleportHome, toggleBaseLock,
    buyBro, sellBro, attemptSteal, makeGuard, attemptEvolve,
    buyLuckyBlock, rollLuckyBlock,
    buyShopItem, buyPet, buyMount, speedUpNextEvent,
    canSpin, doSpin, applyPayout,
    pullLever, attemptPickupDropped,
  };
})();
