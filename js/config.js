/* ============================================================
   EmoteBros — Game Config (data-driven)
   All tunables, definitions, and world geometry live here.
   ============================================================ */
window.Game = window.Game || {};
Game.CFG = (() => {

  /* ============== WORLD GEOMETRY ============== */
  const W = 1600, H = 900;
  const CARPET = { x: 60, y: 80, w: 1480, h: 80 };
  const LEVER  = { x: W / 2, y: CARPET.y + CARPET.h + 20, r: 18 };

  // Shop tiles cluster between carpet and bases
  const SHOPS = [
    { id: 'main',  name: 'Main Shop',        x: 200, y: 250, w: 110, h: 100, icon: '🏪' },
    { id: 'pet',   name: 'Pet Shop',         x: 360, y: 250, w: 110, h: 100, icon: '🐾' },
    { id: 'lucky', name: 'Lucky Blocks',     x: 520, y: 250, w: 110, h: 100, icon: '🎁' },
    { id: 'mount', name: 'Mount Shop',       x: 680, y: 250, w: 110, h: 100, icon: '🐉' },
    { id: 'spin',  name: 'Daily Spin',       x: 840, y: 250, w: 110, h: 100, icon: '🎡' },
    { id: 'evolve',name: 'Evolution Altar',  x: 1000, y: 250, w: 110, h: 100, icon: '⚗️' },
    { id: 'vip',   name: 'VIP Entrance',     x: 1160, y: 250, w: 110, h: 100, icon: '👑' },
    { id: 'info',  name: 'Instructions',     x: 1320, y: 250, w: 110, h: 100, icon: 'ℹ️' },
  ];

  // 4 bases in a row across the bottom
  const BASE_SIZE = { w: 360, h: 380 };
  const BASE_Y = 460;
  const BASE_GAP = 16;
  const BASES = [
    { id: 0, color: '#7c3aed', name: 'Violet Base' },
    { id: 1, color: '#ec4899', name: 'Pink Base'   },
    { id: 2, color: '#06b6d4', name: 'Cyan Base'   },
    { id: 3, color: '#10b981', name: 'Mint Base'   },
  ].map((b, i) => {
    const x = 60 + i * (BASE_SIZE.w + BASE_GAP);
    return {
      ...b,
      x, y: BASE_Y, w: BASE_SIZE.w, h: BASE_SIZE.h,
      // Doorway at top-center (8 px gap)
      door: { x: x + BASE_SIZE.w / 2, y: BASE_Y, w: 64 },
      // Lock slab + Money slab inside the base, near the top
      lockSlab:  { x: x + 30, y: BASE_Y + 30, w: 70, h: 50 },
      moneySlab: { x: x + BASE_SIZE.w - 100, y: BASE_Y + 30, w: 70, h: 50 },
      // 12 EmoteBro slots in a 4x3 grid
      slots: (function() {
        const arr = [];
        const cols = 4, rows = 3;
        const padX = 40, padY = 110;
        const spaceX = (BASE_SIZE.w - padX * 2) / (cols - 1);
        const spaceY = (BASE_SIZE.h - padY - 40) / (rows - 1);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            arr.push({
              index: r * cols + c,
              x: x + padX + c * spaceX,
              y: BASE_Y + padY + r * spaceY,
            });
          }
        }
        return arr;
      })(),
    };
  });

  /* ============== EMOTEBRO DEFS ============== */
  // Sorted by cost - spawn distribution favors cheaper bros early
  const BROS = [
    { id: 'basic',   name: 'Basic Bro',  rarity: 'Common',   cost: 25,    mps: 1,   emoji: '🙂', color: '#9ca3af' },
    { id: 'silly',   name: 'Silly Bro',  rarity: 'Common',   cost: 75,    mps: 3,   emoji: '🤪', color: '#a78bfa' },
    { id: 'cool',    name: 'Cool Bro',   rarity: 'Uncommon', cost: 250,   mps: 10,  emoji: '😎', color: '#10b981' },
    { id: 'happy',   name: 'Happy Bro',  rarity: 'Uncommon', cost: 400,   mps: 16,  emoji: '😄', color: '#34d399' },
    { id: 'rich',    name: 'Rich Bro',   rarity: 'Rare',     cost: 750,   mps: 30,  emoji: '🤑', color: '#3b82f6' },
    { id: 'mega',    name: 'Mega Bro',   rarity: 'Rare',     cost: 1000,  mps: 40,  emoji: '🦸', color: '#3b82f6' },
    { id: 'wizard',  name: 'Wizard Bro', rarity: 'Epic',     cost: 3000,  mps: 100, emoji: '🧙', color: '#a855f7' },
    { id: 'ninja',   name: 'Ninja Bro',  rarity: 'Epic',     cost: 5000,  mps: 160, emoji: '🥷', color: '#7c3aed' },
    { id: 'secret',  name: 'Secret Bro', rarity: 'Secret',   cost: 25000, mps: 500, emoji: '👽', color: '#ec4899' },
    // Evolved tiers (not spawned, only via evolution / lucky)
    { id: 'super_basic',  name: 'Super Basic Bro',  rarity: 'Uncommon', cost: 0, mps: 6,    emoji: '😇', color: '#10b981', evolved: true },
    { id: 'super_silly',  name: 'Super Silly Bro',  rarity: 'Uncommon', cost: 0, mps: 12,   emoji: '🤡', color: '#34d399', evolved: true },
    { id: 'mega_cool',    name: 'Mega Cool Bro',    rarity: 'Rare',     cost: 0, mps: 32,   emoji: '🤩', color: '#3b82f6', evolved: true },
    { id: 'super_happy',  name: 'Super Happy Bro',  rarity: 'Rare',     cost: 0, mps: 50,   emoji: '🥳', color: '#3b82f6', evolved: true },
    { id: 'super_rich',   name: 'Super Rich Bro',   rarity: 'Epic',     cost: 0, mps: 100,  emoji: '🤴', color: '#a855f7', evolved: true },
    { id: 'ultra_mega',   name: 'Ultra Mega Bro',   rarity: 'Epic',     cost: 0, mps: 140,  emoji: '👨‍🚀',color: '#a855f7', evolved: true },
    { id: 'arch_wizard',  name: 'Archwizard Bro',   rarity: 'Epic',     cost: 0, mps: 320,  emoji: '🧝', color: '#7c3aed', evolved: true },
    { id: 'shadow_ninja', name: 'Shadow Ninja Bro', rarity: 'Secret',   cost: 0, mps: 520,  emoji: '🦹', color: '#ec4899', evolved: true },
    { id: 'ultra_secret', name: 'Ultra Secret Bro', rarity: 'Secret',   cost: 0, mps: 1700, emoji: '👾', color: '#f59e0b', evolved: true },
  ];
  const BROS_BY_ID = Object.fromEntries(BROS.map(b => [b.id, b]));

  // Carpet spawn distribution (by id). Sums to 100.
  const SPAWN_WEIGHTS = {
    basic: 38, silly: 28, cool: 16, happy: 8, rich: 5, mega: 3, wizard: 1.5, ninja: 0.4, secret: 0.1,
  };

  /* ============== EVOLUTION RECIPES ============== */
  // 3 of input bro id -> output bro id (costs coins). Cost scales with rarity.
  const EVOLUTIONS = [
    { input: 'basic',  output: 'super_basic',  cost: 100 },
    { input: 'silly',  output: 'super_silly',  cost: 300 },
    { input: 'cool',   output: 'mega_cool',    cost: 1000 },
    { input: 'happy',  output: 'super_happy',  cost: 1600 },
    { input: 'rich',   output: 'super_rich',   cost: 3000 },
    { input: 'mega',   output: 'ultra_mega',   cost: 5000 },
    { input: 'wizard', output: 'arch_wizard',  cost: 15000 },
    { input: 'ninja',  output: 'shadow_ninja', cost: 25000 },
    { input: 'secret', output: 'ultra_secret', cost: 100000 },
  ];

  /* ============== PETS ============== */
  const PETS = [
    { id: 'tiny',   name: 'Tiny Pet',   cost: 100,   bonus: 0.05, emoji: '🐭', currency: 'coins' },
    { id: 'happy',  name: 'Happy Pet',  cost: 500,   bonus: 0.10, emoji: '🐶', currency: 'coins' },
    { id: 'golden', name: 'Golden Pet', cost: 2500,  bonus: 0.25, emoji: '🐱', currency: 'coins' },
    { id: 'mega',   name: 'Mega Pet',   cost: 25,    bonus: 0.50, emoji: '🦄', currency: 'eb' },
  ];

  /* ============== MOUNTS ============== */
  const MOUNTS = [
    { id: 'scooter',    name: 'Scooter',    cost: 5,   speed: 0.10, emoji: '🛴' },
    { id: 'hoverboard', name: 'Hoverboard', cost: 15,  speed: 0.20, emoji: '🛹' },
    { id: 'wolf',       name: 'Wolf',       cost: 40,  speed: 0.35, emoji: '🐺' },
    { id: 'dragon',     name: 'Dragon',     cost: 100, speed: 0.50, emoji: '🐉' },
  ];

  /* ============== LUCKY BLOCKS ============== */
  const LUCKY = [
    {
      id: 'normal', name: 'Normal Lucky Block', cost: 200, currency: 'coins', emoji: '🎁',
      chances: { Common: 60, Uncommon: 25, Rare: 10, Epic: 4, Secret: 1 }
    },
    {
      id: 'mega', name: 'Mega Lucky Block', cost: 1500, currency: 'coins', emoji: '📦',
      chances: { Common: 30, Uncommon: 30, Rare: 25, Epic: 12, Secret: 3 }
    },
    {
      id: 'secret', name: 'Secret Lucky Block', cost: 50, currency: 'eb', emoji: '🪅',
      chances: { Common: 0, Uncommon: 10, Rare: 30, Epic: 40, Secret: 20 }
    },
  ];

  /* ============== SHOP ITEMS (main shop) ============== */
  const SHOP_ITEMS = [
    { id: 'mace',        name: 'Mace',           cost: 300,  currency: 'coins', emoji: '🔨', desc: 'Knockback + 4s stun. 15s cooldown.' },
    { id: 'tp',          name: 'Teleport Home',  cost: 600,  currency: 'coins', emoji: '📍', desc: 'TP to your base. 60s cooldown.' },
    { id: 'guard_suit',  name: 'Guard Suit',     cost: 500,  currency: 'coins', emoji: '🛡️', desc: 'Turn an EmoteBro into a basic guard.' },
    { id: 'bow',         name: 'Guard Bow',      cost: 1200, currency: 'coins', emoji: '🏹', desc: 'Equip on guard: ranged 2s stun.' },
    { id: 'tp_wand',     name: 'Teleport Wand',  cost: 1500, currency: 'coins', emoji: '🪄', desc: 'Equip on guard: TP intruder away.' },
    { id: 'lock_tp',     name: 'Teleport Lock',  cost: 2000, currency: 'coins', emoji: '🌀', desc: 'Lock upgrade: kicks intruders home.' },
  ];

  /* ============== GAMEPLAY TUNING ============== */
  const TUNE = {
    // Movement
    PLAYER_SPEED: 3.2,          // px / tick (60 fps)
    BRO_CARPET_SPEED: 1.0,
    BRO_WALK_SPEED: 2.4,
    CARRIED_FOLLOW_DIST: 28,
    // Spawning
    CARPET_SPAWN_INTERVAL: 1.6, // seconds
    CARPET_MAX_BROS: 12,
    // Locks & timers (compressed for prototype)
    BASE_LOCK_SECONDS: 30,      // spec: 120
    EVENT_INTERVAL_SECONDS: 60, // spec: 3600
    SPIN_COOLDOWN_SECONDS: 120, // spec: 86400
    LEVER_COOLDOWN_SECONDS: 5,
    // Combat
    MACE_RANGE: 80,
    MACE_STUN_SECONDS: 4,
    MACE_KNOCKBACK: 90,
    MACE_COOLDOWN: 15,
    TP_COOLDOWN: 60,
    // Guards
    GUARD_RANGE: 110,
    GUARD_COOLDOWN: 3,
    GUARD_STUN: 2,
    GUARD_BOW_RANGE: 180,
    GUARD_MACE_STUN: 4,
    // Income tick
    INCOME_TICK_HZ: 1,          // collect 1×/sec from each bro
    // Starting coins
    START_COINS: 100,
    START_EB: 0,
  };

  /* ============== EVENT TYPES ============== */
  const EVENTS = [
    { id: 'secret_egg',    name: 'Secret Egg',         duration: 30, emoji: '🥚' },
    { id: 'mega_appear',   name: 'Mega EmoteBro!',     duration: 30, emoji: '💪' },
    { id: 'ready_evolve',  name: 'Ready-to-Evolve!',   duration: 30, emoji: '⚗️' },
    { id: 'lucky_storm',   name: 'Lucky Block Storm',  duration: 30, emoji: '🌧️' },
  ];

  /* ============== DAILY SPIN SLICES ============== */
  // 8 wedges
  const SPIN_SLICES = [
    { label: '+200 💰', color: '#7c3aed', payout: { coins: 200 } },
    { label: '+10 💎',  color: '#ec4899', payout: { eb: 10 } },
    { label: 'Pet 🐶',  color: '#10b981', payout: { pet: 'happy' } },
    { label: '+500 💰', color: '#3b82f6', payout: { coins: 500 } },
    { label: 'Lucky 🎁',color: '#f59e0b', payout: { lucky: 'normal' } },
    { label: '+50 💰',  color: '#6b7280', payout: { coins: 50 } },
    { label: 'TP 📍',   color: '#06b6d4', payout: { item: 'tp' } },
    { label: '+25 💎',  color: '#a855f7', payout: { eb: 25 } },
  ];

  return {
    W, H, CARPET, LEVER, SHOPS, BASES,
    BROS, BROS_BY_ID, SPAWN_WEIGHTS, EVOLUTIONS,
    PETS, MOUNTS, LUCKY, SHOP_ITEMS,
    TUNE, EVENTS, SPIN_SLICES,
  };
})();
