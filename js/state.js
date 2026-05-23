/* ============================================================
   EmoteBros — Game State
   Single source of truth. Save/load via localStorage.
   ============================================================ */
window.Game = window.Game || {};
Game.STATE = (() => {
  const CFG = Game.CFG;
  const SAVE_KEY = 'emoteBros-save-v1';

  /* ============== STATE SHAPE ============== */
  // We keep state as a plain object so it serialises trivially.
  let state = null;
  let _idCounter = 1;

  function uid(prefix = 'i') { return prefix + (_idCounter++) + '_' + Math.random().toString(36).slice(2, 6); }

  function freshPlayer({ id, name, color, baseId, isAI }) {
    const base = CFG.BASES[baseId];
    // Spawn player at base entrance
    const x = base.door.x;
    const y = base.door.y + 40;
    return {
      id, name, color, baseId, isAI: !!isAI,
      x, y, dx: 0, dy: 0,
      vx: 0, vy: 0,                       // momentum hint (for knockback)
      coins: CFG.TUNE.START_COINS,
      emoBucks: CFG.TUNE.START_EB,
      petId: null,
      mountId: null,
      isVip: false,
      lockLevel: 1,                       // 1 = normal, 2 = teleport
      ownsMace: false,
      ownsTp: false,
      ownsBow: false,
      ownsTpWand: false,
      ownsGuardSuit: 0,                   // count of unused suits
      maceCooldownUntil: 0,
      tpCooldownUntil: 0,
      stunnedUntil: 0,
      carryingBroId: null,                // instanceId of bro being stolen
      facing: { x: 0, y: 1 },             // last movement direction
      ai: isAI ? { mode: 'idle', target: null, nextDecisionAt: 0 } : null,
      lastSpinAt: 0,
    };
  }

  function freshBase(baseId) {
    return {
      id: baseId,
      ownerId: baseId,                    // 1:1 mapping for v1
      bankCoins: 0,                       // money waiting on slab
      slots: Array(12).fill(null),        // each entry: bro instanceId or null
      lockedUntil: 0,
    };
  }

  function init() {
    state = {
      tick: 0,
      time: 0,                            // seconds since game start
      carpetDirection: 1,                 // 1 = left→right, -1 = right→left
      leverCooldownUntil: 0,
      lastSpawnAt: -999,
      lastIncomeAt: 0,
      // event
      nextEventAt: CFG.TUNE.EVENT_INTERVAL_SECONDS,
      currentEvent: null,
      currentEventUntil: 0,
      // entities
      players: [
        freshPlayer({ id: 'p0', name: 'You',     color: CFG.BASES[0].color, baseId: 0, isAI: false }),
        freshPlayer({ id: 'p1', name: 'Pixel',   color: CFG.BASES[1].color, baseId: 1, isAI: true  }),
        freshPlayer({ id: 'p2', name: 'Bandit',  color: CFG.BASES[2].color, baseId: 2, isAI: true  }),
        freshPlayer({ id: 'p3', name: 'Sparkle', color: CFG.BASES[3].color, baseId: 3, isAI: true  }),
      ],
      bases: CFG.BASES.map((_, i) => freshBase(i)),
      bros: [],                           // all EmoteBro instances
      effects: [],                        // transient visual effects
      // misc
      noticeQueue: [],                    // toasts to surface (pulled by UI)
      idCounter: 1,
    };
    return state;
  }

  /* ============== ACCESSORS ============== */
  function get() { return state; }
  function player() { return state.players[0]; }
  function playerById(id) { return state.players.find(p => p.id === id); }
  function broById(id) { return state.bros.find(b => b.instanceId === id); }
  function baseById(id) { return state.bases[id]; }

  /* ============== HELPERS ============== */
  function addBro(defId, opts = {}) {
    const def = CFG.BROS_BY_ID[defId];
    if (!def) return null;
    const id = uid('b');
    const inst = {
      instanceId: id,
      defId,
      ownerId: null,
      state: 'carpet',                    // carpet | walking | in_slot | carried | dropped | returning
      x: opts.x ?? 0,
      y: opts.y ?? 0,
      targetX: opts.targetX ?? null,
      targetY: opts.targetY ?? null,
      slotIndex: -1,
      isGuard: false,
      guardItem: null,                    // 'mace' | 'bow' | 'tp_wand' | null
      guardCooldownUntil: 0,
      pendingMoney: 0,
      ...opts,
    };
    state.bros.push(inst);
    return inst;
  }

  function removeBro(instanceId) {
    const idx = state.bros.findIndex(b => b.instanceId === instanceId);
    if (idx !== -1) state.bros.splice(idx, 1);
  }

  function broCountInBase(baseId) {
    return state.bases[baseId].slots.filter(Boolean).length;
  }

  function emptySlot(baseId) {
    const slots = state.bases[baseId].slots;
    for (let i = 0; i < slots.length; i++) if (!slots[i]) return i;
    return -1;
  }

  function notice(text, kind = 'info', forPlayerId = 'p0') {
    state.noticeQueue.push({ text, kind, forPlayerId, at: state.time });
  }

  function effect(kind, opts) {
    state.effects.push({ kind, t: 0, life: opts.life ?? 0.6, ...opts });
  }

  /* ============== SAVE / LOAD ============== */
  function save() {
    if (!state) return;
    try {
      const json = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, json);
      return true;
    } catch (e) {
      console.warn('Save failed', e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      state = JSON.parse(raw);
      // ensure backfill for any fields added later
      if (!state.effects) state.effects = [];
      if (!state.noticeQueue) state.noticeQueue = [];
      return true;
    } catch (e) {
      console.warn('Load failed', e);
      return false;
    }
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  return {
    init, get, player, playerById, broById, baseById,
    addBro, removeBro, broCountInBase, emptySlot,
    notice, effect, uid,
    save, load, clearSave,
  };
})();
