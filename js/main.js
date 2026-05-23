/* ============================================================
   EmoteBros — Main Entry & Game Loop
   ============================================================ */
(function () {
  const S = Game.STATE;

  // Boot: load save if present, else init fresh
  if (!S.load()) S.init();

  Game.RENDER.init();
  Game.UI.init();

  let lastT = performance.now();
  let autosaveAccum = 0;
  const STEP_CAP = 1 / 20;   // cap large frame steps to avoid huge dt after tab-switch

  function loop(now) {
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > STEP_CAP) dt = STEP_CAP;

    Game.UI.applyInput();
    Game.AI.tick(dt);
    Game.SYS.tick(dt);
    Game.RENDER.draw();
    Game.UI.updateHud();

    autosaveAccum += dt;
    if (autosaveAccum > 15) { S.save(); autosaveAccum = 0; }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Save on tab close
  window.addEventListener('beforeunload', () => S.save());

  // Expose for debugging
  window.GameDebug = {
    state: S, sys: Game.SYS, cfg: Game.CFG,
    giveCoins(n = 10000) { S.player().coins += n; },
    giveEb(n = 500) { S.player().emoBucks += n; },
    teleportTo(x, y) { const p = S.player(); p.x = x; p.y = y; },
  };
  console.log('EmoteBros loaded. Try GameDebug.giveCoins() in the console.');
})();
