/* ============================================================
   EmoteBros — AI Player Behavior
   Each AI picks a mode every ~1.5s and pursues a target.
   ============================================================ */
window.Game = window.Game || {};
Game.AI = (() => {
  const CFG = Game.CFG, S = Game.STATE, SYS = Game.SYS;
  const T = CFG.TUNE;

  // Modes:
  // 'idle', 'goto_carpet', 'goto_base', 'goto_slab', 'lock_base', 'steal', 'goto_lever', 'wander'
  function tick(dt) {
    const st = S.get();
    for (const p of st.players) {
      if (!p.isAI) continue;
      driveAI(p, dt);
    }
  }

  function driveAI(p, dt) {
    const st = S.get();
    if (p.stunnedUntil > st.time) { p.dx = 0; p.dy = 0; return; }
    // Periodic re-plan
    if (st.time >= (p.ai.nextDecisionAt || 0)) plan(p);

    // Pursue target
    if (p.ai.target) {
      const t = p.ai.target;
      const dx = t.x - p.x, dy = t.y - p.y;
      const d = Math.hypot(dx, dy);
      const arrive = t.arriveDist ?? 18;
      if (d < arrive) {
        onArrive(p);
      } else {
        p.dx = dx / d;
        p.dy = dy / d;
      }
    } else {
      p.dx = 0; p.dy = 0;
    }

    // Reactive: swing mace if a player is right next to us with stolen goods (rare)
    if (p.ownsMace && p.maceCooldownUntil <= st.time) {
      for (const o of st.players) {
        if (o.id === p.id) continue;
        if (o.carryingBroId == null) continue;
        const b = S.broById(o.carryingBroId);
        if (!b) continue;
        const orig = S.playerById(b.ownerId);
        if (!orig || orig.id !== p.id) continue;
        if (SYS.dist(o, p) < T.MACE_RANGE - 10) {
          // face them and swing
          const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy) || 1;
          p.facing = { x: dx / d, y: dy / d };
          SYS.swingMace(p);
        }
      }
    }
  }

  function onArrive(p) {
    const st = S.get();
    const a = p.ai;
    p.dx = 0; p.dy = 0;
    switch (a.mode) {
      case 'goto_carpet': {
        // Try to buy whatever we approached
        const b = a.targetBroId && S.broById(a.targetBroId);
        if (b && b.state === 'carpet') SYS.buyBro(p.id, b.instanceId);
        a.target = null;
        a.nextDecisionAt = st.time + 0.4;
        break;
      }
      case 'goto_base': {
        // Walked into base — try lock if we want to lock
        if (a.intent === 'lock') {
          // need to be on the lock slab; walk to it
          const myBase = CFG.BASES[p.baseId];
          a.target = { ...rectCenter(myBase.lockSlab), arriveDist: 12 };
          a.mode = 'lock_base';
          return;
        }
        // Otherwise go to money slab to collect
        const myBase = CFG.BASES[p.baseId];
        a.target = { ...rectCenter(myBase.moneySlab), arriveDist: 12 };
        a.mode = 'goto_slab';
        break;
      }
      case 'goto_slab': {
        // Auto-collect happens on touch. We may want to go to lock slab next.
        a.target = null;
        a.nextDecisionAt = st.time + 0.5;
        break;
      }
      case 'lock_base': {
        SYS.toggleBaseLock(p.id);
        a.target = null;
        a.nextDecisionAt = st.time + 2;
        break;
      }
      case 'steal': {
        const b = a.targetBroId && S.broById(a.targetBroId);
        if (b && (b.state === 'in_slot' || b.state === 'dropped') && b.ownerId !== p.id) {
          SYS.attemptSteal(p.id, b.instanceId);
        }
        a.target = null;
        a.nextDecisionAt = st.time + 0.5;
        break;
      }
      case 'carry_home': {
        // Reaching base auto-completes steal in tickBros
        a.target = null;
        a.nextDecisionAt = st.time + 0.3;
        break;
      }
      case 'goto_lever': {
        SYS.pullLever(p);
        a.target = null;
        a.nextDecisionAt = st.time + 2;
        break;
      }
      case 'wander':
      default:
        a.target = null;
        a.nextDecisionAt = st.time + 0.6;
    }
  }

  function plan(p) {
    const st = S.get();
    const a = p.ai;
    a.nextDecisionAt = st.time + 1.2 + Math.random() * 1.0;

    // If carrying a bro: go home
    if (p.carryingBroId) {
      const myBase = CFG.BASES[p.baseId];
      a.mode = 'carry_home';
      a.target = { x: myBase.door.x, y: myBase.door.y + 60, arriveDist: 10 };
      return;
    }

    const myBase = CFG.BASES[p.baseId];
    const myBs = S.baseById(p.baseId);

    // Periodic chores
    // 1) If a lot of money on slab and we're not locked, collect
    if (myBs.bankCoins > 200 && myBs.lockedUntil < st.time + 5) {
      a.mode = 'goto_slab';
      a.target = { ...rectCenter(myBase.moneySlab), arriveDist: 12 };
      return;
    }
    // 2) Random chance to lock the base if we have valuables and unlocked
    if (myBs.lockedUntil < st.time && S.broCountInBase(p.baseId) >= 4 && Math.random() < 0.25) {
      a.mode = 'lock_base';
      a.intent = 'lock';
      a.target = { ...rectCenter(myBase.lockSlab), arriveDist: 12 };
      return;
    }
    // 3) Affordable bro on carpet?
    const candidates = st.bros
      .filter(b => b.state === 'carpet')
      .map(b => ({ b, def: SYS.broDef(b.defId) }))
      .filter(({ def }) => def.cost <= p.coins)
      .sort((a, b) => b.def.mps - a.def.mps);
    if (candidates.length && S.broCountInBase(p.baseId) < 12 && Math.random() < 0.7) {
      const pick = candidates[0];
      a.mode = 'goto_carpet';
      a.targetBroId = pick.b.instanceId;
      a.target = { x: pick.b.x, y: pick.b.y + 30, arriveDist: 28 };
      return;
    }
    // 4) Steal: scan for a juicy unlocked enemy slot
    if (Math.random() < 0.35) {
      const targets = [];
      for (const o of st.players) {
        if (o.id === p.id) continue;
        const ob = S.baseById(o.baseId);
        if (ob.lockedUntil > st.time) continue;
        for (const broId of ob.slots) {
          if (!broId) continue;
          const b = S.broById(broId);
          if (!b || b.isGuard) continue;
          targets.push({ b, mps: SYS.broDef(b.defId).mps });
        }
      }
      if (targets.length) {
        targets.sort((x, y) => y.mps - x.mps);
        const t = targets[0].b;
        a.mode = 'steal';
        a.targetBroId = t.instanceId;
        a.target = { x: t.x, y: t.y, arriveDist: 16 };
        return;
      }
    }
    // 5) Wander near base
    a.mode = 'wander';
    const cx = myBase.x + myBase.w / 2;
    const cy = myBase.y + myBase.h / 2;
    a.target = {
      x: cx + (Math.random() - 0.5) * 200,
      y: cy + (Math.random() - 0.5) * 100,
      arriveDist: 12,
    };
  }

  function rectCenter(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

  return { tick };
})();
