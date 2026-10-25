/**
 * Critter Pizzeria 3D — Pillar 2: Friendly Sous-Chef Helper Buddy,
 * VIP Golden Pizza Party Fever Events & Non-IBL Material Hygiene
 */

import { PizzeriaAudio } from './audio.js';

function safePlayAudio(methodName, ...args) {
  try {
    const aud = PizzeriaAudio || (typeof window !== 'undefined' ? window.PizzeriaAudio : null);
    if (aud && typeof aud[methodName] === 'function') {
      aud[methodName](...args);
    }
  } catch (_err) {
    // Ignore audio errors in headless environments
  }
}

/**
 * Traverses a Three.js scene/group and clamps all material metalness <= 0.22
 * when scene.environment === null (Requirement R3 Non-IBL Material Hygiene).
 */
export function enforceNonIblMaterialHygiene(root) {
  if (!root || typeof root.traverse !== 'function') return;
  // If root is a Scene with an active IBL environment texture, no clamp is needed
  if (root.isScene && root.environment !== null && root.environment !== undefined) {
    return;
  }
  root.traverse((node) => {
    if (!node || !node.material) return;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) {
      if (mat && typeof mat.metalness === 'number' && mat.metalness > 0.22) {
        mat.metalness = 0.22;
        mat.needsUpdate = true;
      }
    }
  });
}

/**
 * Creates the initial Pillar 2 Helper Buddy & VIP Party Fever state fields.
 */
export function createHelperAndEventsState() {
  return {
    helperCooldown: 0,
    helperAssists: 0,
    helperWaveTimer: 0,
    partyFeverTimer: 0,
    partyFeverActive: false,
    partyFeverCount: 0,
  };
}

/**
 * Advances Pillar 2 state each simulation step:
 * 1. Sous-Chef Helper Buddy Burn-Prevention Shield (resets oven.burnProgress >= 0.65 to 0).
 * 2. VIP Golden Pizza Party Fever countdown & 2x oven bake boost + zero burn.
 */
export function stepHelperAndEvents(state, dt, callbacks = {}) {
  if (!state || state.waveDone) return;
  const safeDt = Math.max(0, Number(dt) || 0);

  if (typeof state.helperCooldown === 'number' && state.helperCooldown > 0) {
    state.helperCooldown = Math.max(0, state.helperCooldown - safeDt);
  }
  if (typeof state.helperWaveTimer === 'number' && state.helperWaveTimer > 0) {
    state.helperWaveTimer = Math.max(0, state.helperWaveTimer - safeDt);
  }

  // 1. Update VIP Golden Pizza Party Fever Timer
  if (typeof state.partyFeverTimer === 'number' && state.partyFeverTimer > 0) {
    state.partyFeverTimer = Math.max(0, state.partyFeverTimer - safeDt);
    state.partyFeverActive = state.partyFeverTimer > 0;
  } else {
    state.partyFeverTimer = 0;
    state.partyFeverActive = false;
  }

  // 2.Sous-Chef Burn Prevention Shield & Party Fever Oven Boost
  if (Array.isArray(state.ovens)) {
    for (const oven of state.ovens) {
      if (!oven) continue;

      // During Party Fever, baking ovens get an extra bake speed boost and baked ovens never burn
      if (state.partyFeverActive) {
        if (oven.state === 'baking') {
          oven.bakeProgress = Math.min(1.0, (oven.bakeProgress || 0) + safeDt / 3.0);
        } else if (oven.state === 'baked') {
          oven.burnProgress = 0;
          oven.warnedBurn = false;
        }
      }

      // Automatic Burn-Prevention Shield: if any baked pizza reaches burnProgress >= 0.65,
      // the Sous-Chef Buddy waves their magic peel and resets burnProgress to 0!
      if (oven.state === 'baked' && oven.burnProgress >= 0.65) {
        oven.burnProgress = 0;
        oven.warnedBurn = false;
        state.helperAssists = (state.helperAssists || 0) + 1;
        state.helperWaveTimer = 1.1;
        safePlayAudio('playHelperRescue');
        if (callbacks && typeof callbacks.onHelperRescue === 'function') {
          try {
            callbacks.onHelperRescue(oven);
          } catch (_e) {}
        }
      }
    }
  }
}

/**
 * Interactive tap handler for the 3D Sous-Chef Helper Buddy ('helper_buddy').
 * Grants +15 bonus coins, restores +4.0s patience to all waiting customers,
 * auto-advances a prep/oven step via callbacks, increments helperAssists, and plays a marimba cheer.
 */
export function triggerHelperBuddyTap(state, callbacks = {}) {
  if (!state || state.waveDone) return false;

  state.coins = (state.coins || 0) + 15;
  state.helperAssists = (state.helperAssists || 0) + 1;
  state.helperCooldown = 1.5;
  state.helperWaveTimer = 1.25;

  // Restore +4.0s patience to all waiting customers
  if (Array.isArray(state.customers)) {
    for (const cust of state.customers) {
      if (cust && cust.mood === 'waiting') {
        const maxP = cust.maxPatience || 26.0;
        cust.patience = Math.min(maxP, (cust.patience || 0) + 4.0);
        cust.patienceRatio = cust.patience / maxP;
      }
    }
  }

  // Keep combo streak alive and warm
  if (typeof state.combo === 'number') {
    state.combo = Math.min(4, Math.max(1, state.combo));
    state.comboTimer = Math.max(state.comboTimer || 0, 4.5);
  }

  if (callbacks && typeof callbacks.onHelperAutoStep === 'function') {
    try {
      callbacks.onHelperAutoStep();
    } catch (_e) {}
  }

  safePlayAudio('playHelperCheer');
  safePlayAudio('playCoinJingle', 3);
  return true;
}

/**
 * Activates the 8.0s VIP Golden Pizza Party Fever Event:
 * Sets partyFeverTimer = 8.0, partyFeverActive = true, increments partyFeverCount,
 * awards +20 bonus coins, boosts waiting customer patience by +3.0s, and plays fanfare.
 */
export function triggerPartyFeverEvent(state, callbacks = {}) {
  if (!state || state.waveDone) return false;

  state.partyFeverTimer = 8.0;
  state.partyFeverActive = true;
  state.partyFeverCount = (state.partyFeverCount || 0) + 1;
  state.coins = (state.coins || 0) + 20;
  state.helperWaveTimer = 1.5;

  if (Array.isArray(state.customers)) {
    for (const cust of state.customers) {
      if (cust && cust.mood === 'waiting') {
        const maxP = cust.maxPatience || 26.0;
        cust.patience = Math.min(maxP, (cust.patience || 0) + 3.0);
        cust.patienceRatio = cust.patience / maxP;
      }
    }
  }

  if (callbacks && typeof callbacks.onPartyFeverStart === 'function') {
    try {
      callbacks.onPartyFeverStart();
    } catch (_e) {}
  }

  safePlayAudio('playPartyFeverFanfare');
  safePlayAudio('playCoinJingle', 4);
  return true;
}

/**
 * Builds the 3D Sous-Chef Helper Buddy ('helper_buddy' at (-2.65, 0.25, -0.55))
 * and the 3D VIP Golden Pizza Party Fever Lights & Star Confetti Halo ('feverGroup').
 */
export function createPizzeriaHelperAndEvents(THREE, scene, rootGroup = null) {
  const parent = rootGroup || scene;

  // All materials strictly adhere to metalness <= 0.22 for non-IBL scenes
  const plushGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.72,
    metalness: 0.06,
  });
  const plushCreamMat = new THREE.MeshStandardMaterial({
    color: 0xfff7ed,
    roughness: 0.78,
    metalness: 0.04,
  });
  const toqueWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.04,
  });
  const scarfCoralMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.58,
    metalness: 0.06,
  });
  const woodPeelMat = new THREE.MeshStandardMaterial({
    color: 0xd99b52,
    roughness: 0.56,
    metalness: 0.08,
  });
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x7c4a2d,
    roughness: 0.60,
    metalness: 0.12,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.28,
    roughness: 0.34,
    metalness: 0.20,
  });
  const eyeDarkMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
  const eyeSparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // ==========================================================================
  // 1. 3D SOUS-CHEF HELPER BUDDY (`helperGroup` at (-2.65, 0.25, -0.55))
  // ==========================================================================
  const helperGroup = new THREE.Group();
  helperGroup.name = 'SousChef_Helper_Buddy';
  helperGroup.position.set(-2.65, 0.0, -0.55);
  helperGroup.userData.stationId = 'helper_buddy';

  // Wooden coaster pedestal + brass trim ring
  const basePedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.10, 24),
    pedestalMat
  );
  basePedestal.position.y = 0.05;
  basePedestal.castShadow = true;
  basePedestal.receiveShadow = true;
  helperGroup.add(basePedestal);

  const haloRing = new THREE.Mesh(
    new THREE.RingGeometry(0.44, 0.54, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      toneMapped: false,
    })
  );
  haloRing.rotation.x = -Math.PI * 0.5;
  haloRing.position.y = 0.02;
  helperGroup.add(haloRing);

  // Animated body pivot for joyful bounce & dance
  const buddyPivot = new THREE.Group();
  buddyPivot.position.y = 0.10;
  helperGroup.add(buddyPivot);

  // Plump Critter torso
  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 24, 20),
    plushGoldMat
  );
  torso.scale.set(1.0, 1.12, 0.92);
  torso.position.y = 0.26;
  torso.castShadow = true;
  buddyPivot.add(torso);

  // Cream belly patch
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 20, 16),
    plushCreamMat
  );
  belly.scale.set(0.95, 1.05, 0.55);
  belly.position.set(0, 0.25, 0.16);
  buddyPivot.add(belly);

  // Red chef neckerchief collar
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.042, 12, 24),
    scarfCoralMat
  );
  scarf.rotation.x = Math.PI * 0.5;
  scarf.position.y = 0.44;
  buddyPivot.add(scarf);

  // Cheerful Critter head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.64;
  buddyPivot.add(headGroup);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 20),
    plushGoldMat
  );
  head.scale.set(1.06, 0.98, 0.96);
  head.castShadow = true;
  headGroup.add(head);

  // Floppy ears
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 12),
      plushGoldMat
    );
    ear.scale.set(0.75, 1.35, 0.55);
    ear.position.set(side * 0.22, 0.08, -0.02);
    ear.rotation.z = side * 0.35;
    headGroup.add(ear);

    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 14, 12),
      eyeDarkMat
    );
    eye.position.set(side * 0.085, 0.04, 0.21);
    headGroup.add(eye);

    const catchlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.013, 10, 8),
      eyeSparkleMat
    );
    catchlight.position.set(side * 0.085 - 0.01, 0.052, 0.24);
    headGroup.add(catchlight);
  });

  // Cream snout + happy nose
  const snout = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 16, 12),
    plushCreamMat
  );
  snout.scale.set(1.2, 0.85, 0.85);
  snout.position.set(0, -0.03, 0.20);
  headGroup.add(snout);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 12, 10),
    eyeDarkMat
  );
  nose.position.set(0, -0.005, 0.27);
  headGroup.add(nose);

  // White Chef Toque Hat with Golden Star Badge
  const toqueGroup = new THREE.Group();
  toqueGroup.position.set(0, 0.20, 0);
  headGroup.add(toqueGroup);

  const toqueBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.16, 0.09, 20),
    toqueWhiteMat
  );
  toqueBand.position.y = 0.04;
  toqueGroup.add(toqueBand);

  const toqueGoldRibbon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.174, 0.166, 0.03, 20),
    goldTrimMat
  );
  toqueGoldRibbon.position.y = 0.02;
  toqueGroup.add(toqueGoldRibbon);

  const toquePuff = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 20, 16),
    toqueWhiteMat
  );
  toquePuff.scale.set(1.08, 0.92, 1.04);
  toquePuff.position.y = 0.16;
  toquePuff.castShadow = true;
  toqueGroup.add(toquePuff);

  // Right Arm + Miniature Magic Wooden Pizza Peel
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.24, 0.36, 0.05);
  buddyPivot.add(rightArmPivot);

  const rightArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.22, 14),
    plushGoldMat
  );
  rightArm.rotation.z = -0.65;
  rightArm.position.set(0.08, 0.04, 0);
  rightArmPivot.add(rightArm);

  const peelGroup = new THREE.Group();
  peelGroup.position.set(0.18, 0.10, 0.06);
  rightArmPivot.add(peelGroup);

  const peelHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.24, 10),
    woodPeelMat
  );
  peelHandle.position.y = 0.08;
  peelGroup.add(peelHandle);

  const peelBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.02, 18),
    woodPeelMat
  );
  peelBlade.rotation.x = Math.PI * 0.5;
  peelBlade.position.y = 0.24;
  peelGroup.add(peelBlade);

  const peelStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.065, 0),
    goldTrimMat
  );
  peelStar.position.set(0, 0.24, 0.025);
  peelGroup.add(peelStar);

  // Left Arm cheering
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.24, 0.36, 0.05);
  buddyPivot.add(leftArmPivot);

  const leftArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.22, 14),
    plushGoldMat
  );
  leftArm.rotation.z = 0.65;
  leftArm.position.set(-0.08, 0.04, 0);
  leftArmPivot.add(leftArm);

  // Floating Helper Star Halo above the Chef Toque
  const helperCrownStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    goldTrimMat
  );
  helperCrownStar.position.set(0, 1.16, 0);
  buddyPivot.add(helperCrownStar);

  // Tag all meshes in helperGroup with stationId = 'helper_buddy'
  helperGroup.traverse((child) => {
    if (child.isMesh) {
      child.userData.stationId = 'helper_buddy';
    }
  });

  if (parent && typeof parent.add === 'function') {
    parent.add(helperGroup);
  }

  // ==========================================================================
  // 2. 3D VIP GOLDEN PIZZA PARTY FEVER LIGHTS & STAR CONFETTI HALO (`feverGroup`)
  // ==========================================================================
  const feverGroup = new THREE.Group();
  feverGroup.name = 'VIP_Party_Fever_Group';
  feverGroup.visible = false;

  // Overhead Golden Party Halo Ring above the counter
  const feverBannerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.85, 0.055, 14, 48),
    goldTrimMat
  );
  feverBannerRing.rotation.x = Math.PI * 0.5;
  feverBannerRing.position.set(0, 2.85, 0.15);
  feverGroup.add(feverBannerRing);

  // Counter-level Golden Party Glow Rim
  const counterFeverRim = new THREE.Mesh(
    new THREE.RingGeometry(4.1, 4.45, 48),
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42,
      toneMapped: false,
    })
  );
  counterFeverRim.rotation.x = -Math.PI * 0.5;
  counterFeverRim.position.set(0, 0.015, 0.55);
  feverGroup.add(counterFeverRim);

  // 10 Orbiting 3D Golden Stars & Confetti Gems
  const confettiColors = [0xfde047, 0xf97316, 0xec4899, 0x38bdf8, 0x4ade80];
  const confettiNodes = [];
  for (let i = 0; i < 10; i++) {
    const cMat = new THREE.MeshStandardMaterial({
      color: confettiColors[i % confettiColors.length],
      emissive: confettiColors[i % confettiColors.length],
      emissiveIntensity: 0.35,
      roughness: 0.30,
      metalness: 0.18,
    });
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(i % 2 === 0 ? 0.14 : 0.10, 0),
      cMat
    );
    const angle = (i / 10) * Math.PI * 2;
    gem.userData = {
      baseAngle: angle,
      radius: 2.65 + (i % 3) * 0.35,
      baseY: 2.35 + (i % 2) * 0.35,
      phase: i * 0.7,
    };
    confettiNodes.push(gem);
    feverGroup.add(gem);
  }

  if (parent && typeof parent.add === 'function') {
    parent.add(feverGroup);
  }

  /**
   * Per-frame animation synchronizer for Sous-Chef Helper Buddy & Party Fever visuals.
   */
  function syncHelperAndEvents(state, dt = 0.016, elapsed = 0) {
    const t = Number(elapsed) || 0;
    const waveBoost = state && (state.helperWaveTimer > 0 || state.partyFeverActive) ? 2.2 : 1.0;

    // Animate Sous-Chef Helper Buddy cheerful bounce & peel wave
    buddyPivot.position.y = 0.10 + Math.abs(Math.sin(t * 3.8 * waveBoost)) * (0.045 * waveBoost);
    buddyPivot.rotation.y = Math.sin(t * 2.4 * waveBoost) * (0.18 * waveBoost);
    headGroup.rotation.z = Math.sin(t * 3.2 * waveBoost) * 0.09;
    rightArmPivot.rotation.z = Math.sin(t * 6.0 * waveBoost) * (0.28 * waveBoost);
    leftArmPivot.rotation.z = -Math.sin(t * 5.2 * waveBoost) * (0.22 * waveBoost);
    helperCrownStar.rotation.y = t * 2.8;
    helperCrownStar.position.y = 1.16 + Math.sin(t * 4.5) * 0.04;

    const haloPulse = 1.0 + Math.sin(t * 5.0) * 0.08;
    haloRing.scale.set(haloPulse, haloPulse, 1);
    haloRing.material.opacity = state && state.partyFeverActive ? 0.90 : 0.62 + Math.sin(t * 4.0) * 0.18;

    // Sync VIP Golden Pizza Party Fever visibility & orbiting star confetti
    const feverActive = Boolean(state && state.partyFeverActive);
    feverGroup.visible = feverActive;
    if (feverActive) {
      feverBannerRing.rotation.z = t * 1.4;
      const rimScale = 1.0 + Math.sin(t * 6.5) * 0.04;
      counterFeverRim.scale.set(rimScale, rimScale, 1);
      for (const gem of confettiNodes) {
        const u = gem.userData;
        const ang = u.baseAngle + t * 1.85;
        gem.position.set(
          Math.cos(ang) * u.radius,
          u.baseY + Math.sin(t * 4.2 + u.phase) * 0.18,
          0.15 + Math.sin(ang) * (u.radius * 0.55)
        );
        gem.rotation.y = t * 3.2 + u.phase;
        gem.rotation.x = t * 2.1;
      }
    }

    if (scene) {
      enforceNonIblMaterialHygiene(scene);
    }
  }

  return {
    helperGroup,
    feverGroup,
    syncHelperAndEvents,
  };
}
