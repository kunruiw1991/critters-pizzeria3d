import { createPizzeriaScene } from './scene3d.js';
import { PizzeriaAudio } from './audio.js';

const CHEF_POOL = ['catnap', 'dogday', 'craftycorn', 'hoppy', 'picky', 'bubba', 'kickin'];
const RIVAL_SCORES_BY_WAVE = {
  1: [220, 165, 110, 55],
  2: [285, 215, 145, 75],
  3: [315, 240, 165, 85],
};

function getWaveRivalScores(wave = 1) {
  return RIVAL_SCORES_BY_WAVE[wave] || RIVAL_SCORES_BY_WAVE[1];
}

function getRivalCritters(playerCritter = 'catnap') {
  const topRivals = ['dogday', 'catnap', 'craftycorn', 'hoppy', 'picky']
    .filter((c) => c !== playerCritter)
    .slice(0, 3);
  // Keep Baba Chops in the 4th rival slot (lowest rival score) so Baba Chops never steals 1st place
  return [...topRivals, 'baba'];
}

const CRITTER_CROPS = {
  baba: [0.04, 0.02, 0.92, 0.96],
  craftycorn: [0.12, 0.03, 0.76, 0.92],
  dogday: [0.49, 0.11, 0.25, 0.43],
  catnap: [0.51, 0.17, 0.20, 0.51],
  hoppy: [0.25, 0.06, 0.26, 0.58],
  picky: [0.24, 0.20, 0.24, 0.43],
  bubba: [0.22, 0.10, 0.25, 0.56],
  kickin: [0.31, 0.22, 0.18, 0.58],
};

function getCritterCropStyle(critterId) {
  const [ux, uy, uw, uh] = CRITTER_CROPS[critterId] || [0, 0, 1, 1];
  const wPct = (100 / uw).toFixed(2);
  const hPct = (100 / uh).toFixed(2);
  const leftPct = (-(ux / uw) * 100).toFixed(2);
  const topPct = (-(uy / uh) * 100).toFixed(2);
  return `left:${leftPct}%;top:${topPct}%;width:${wPct}%;height:${hPct}%;filter:brightness(1.22) contrast(1.12) saturate(1.32);`;
}

const BASE_COINS = {
  cheese_pizza: 25,
  pepperoni_pizza: 35,
  supreme_pizza: 45,
  mango_juice: 15,
};

const BAKE_DURATION = 3.0;
const BURN_DURATION = 7.5;
const JUICE_REFILL_DURATION = 2.5;
const COMBO_WINDOW = 4.5;

const WAVE_PATIENCE = {
  1: 26.0,
  2: 23.0,
  3: 20.0,
};

// Deterministic 8-customer schedules per wave.
// Wave 1 total base coins = 25 + 35 + 60 + 40 + 35 + 25 + 60 + 35 = 315 coins.
// - Idle Bot (0 serves) -> 0 coins (5th place, 0 stars, Defeat)
// - Casual Kid Bot (~4-5 serves / slow / 1-2 burns) -> 125..210 coins (2nd/3rd place, 1-2 stars)
// - Skilled Chef Bot (7-8 serves + juice + combos) -> 260..405 coins (1st place, 3 stars)
const WAVE_SCHEDULES = {
  1: [
    { friend: 'baba', items: ['cheese_pizza'] },
    { friend: 'dogday', items: ['pepperoni_pizza', 'mango_juice'] },
    { friend: 'picky', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'craftycorn', items: ['cheese_pizza', 'mango_juice'] },
    { friend: 'hoppy', items: ['pepperoni_pizza'] },
    { friend: 'bubba', items: ['cheese_pizza', 'mango_juice'] },
    { friend: 'kickin', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'dogday', items: ['pepperoni_pizza', 'mango_juice'] },
  ],
  2: [
    { friend: 'dogday', items: ['pepperoni_pizza', 'mango_juice'] },
    { friend: 'baba', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'hoppy', items: ['cheese_pizza', 'mango_juice'] },
    { friend: 'picky', items: ['pepperoni_pizza', 'mango_juice'] },
    { friend: 'bubba', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'craftycorn', items: ['cheese_pizza', 'mango_juice'] },
    { friend: 'kickin', items: ['pepperoni_pizza', 'mango_juice'] },
    { friend: 'hoppy', items: ['supreme_pizza', 'mango_juice'] },
  ],
  3: [
    { friend: 'picky', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'baba', items: ['pepperoni_pizza', 'mango_juice'] },
    { friend: 'dogday', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'hoppy', items: ['cheese_pizza', 'mango_juice'] },
    { friend: 'bubba', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'picky', items: ['pepperoni_pizza', 'mango_juice'] },
    { friend: 'craftycorn', items: ['supreme_pizza', 'mango_juice'] },
    { friend: 'kickin', items: ['pepperoni_pizza', 'mango_juice'] },
  ],
};

function createEmptyBoard(index) {
  return {
    index,
    id: `prep_board_${index}`,
    state: 'empty',
    hasDough: false,
    hasSauce: false,
    hasCheese: false,
    hasPepperoni: false,
    hasVeggie: false,
    recipe: null,
    popTimer: 0,
  };
}

function createEmptyOven(index) {
  return {
    index,
    id: `oven_${index}`,
    state: 'empty',
    hasDough: false,
    hasSauce: false,
    hasCheese: false,
    hasPepperoni: false,
    hasVeggie: false,
    recipe: null,
    bakeProgress: 0,
    burnProgress: 0,
    warnedBurn: false,
  };
}

function createJuiceCup(index, initialFill = 1.0) {
  const ready = initialFill >= 1.0;
  return {
    index,
    id: `juice_${index}`,
    state: ready ? 'ready' : 'filling',
    fillProgress: ready ? 1.0 : initialFill,
    ready,
  };
}

function makeOrderItem(type) {
  return {
    type,
    recipe: type,
    item: type,
    isJuice: type === 'mango_juice',
    hasDough: type !== 'mango_juice',
    hasSauce: type !== 'mango_juice',
    hasCheese: type !== 'mango_juice',
    hasPepperoni: type === 'pepperoni_pizza' || type === 'supreme_pizza',
    hasVeggie: type === 'supreme_pizza',
    baseCoins: BASE_COINS[type] || 25,
    done: false,
    satisfied: false,
  };
}

function createCustomerInstance(spec, slotIndex, wave, seqIndex) {
  const maxPatience = WAVE_PATIENCE[wave] || 26.0;
  const order = spec.items.map((t) => makeOrderItem(t));
  return {
    slotIndex,
    seqIndex,
    id: `cust_w${wave}_${seqIndex}`,
    friend: spec.friend,
    critterId: spec.friend,
    portrait: `./assets/${spec.friend}.webp`,
    patience: maxPatience,
    maxPatience,
    patienceRatio: 1.0,
    mood: 'waiting',
    chompTimer: 0,
    enterTimer: 0.45,
    order,
    items: order,
  };
}

const state = {
  playerCritter: 'catnap',
  wave: 1,
  maxWaves: 3,
  coins: 0,
  combo: 0,
  comboTimer: 0,
  customersServed: 0,
  customersMissed: 0,
  customersProcessed: 0,
  totalCustomers: 8,
  customerOutcomes: [],
  waitingQueue: [],
  nextCustomerSeq: 0,
  prepBoards: [createEmptyBoard(0), createEmptyBoard(1)],
  ovens: [createEmptyOven(0), createEmptyOven(1)],
  juices: [createJuiceCup(0, 1.0), createJuiceCup(1, 1.0)],
  customers: [null, null, null],
  slotChompTimers: [0, 0, 0],
  waveDone: false,
  rank: 5,
  stars: 0,
  elapsed: 0,
};

let sceneApi = null;

function safeAudio(methodName, ...args) {
  try {
    const aud = PizzeriaAudio || window.PizzeriaAudio;
    if (aud && typeof aud[methodName] === 'function') {
      aud[methodName](...args);
    }
  } catch (_err) {
    // Ignore audio errors in headless environments
  }
}

function computeBoardRecipe(board) {
  if (!board.hasDough) return null;
  if (board.hasPepperoni && board.hasVeggie) return 'supreme_pizza';
  if (board.hasPepperoni) return 'pepperoni_pizza';
  if (board.hasVeggie) return 'supreme_pizza';
  return 'cheese_pizza';
}

function computeRankAndStars(coins, wave = state.wave) {
  const rivalScores = getWaveRivalScores(wave);
  let rank = 1;
  for (const rivalScore of rivalScores) {
    if (coins < rivalScore) {
      rank += 1;
    }
  }
  let stars = 0;
  if (rank === 1) stars = 3;
  else if (rank === 2) stars = 2;
  else if (rank === 3) stars = 1;
  else stars = 0;
  return { rank, stars };
}

function spawnNextCustomerIntoSlot(slotIndex) {
  if (state.waitingQueue.length === 0) {
    state.customers[slotIndex] = null;
    return null;
  }
  const nextSpec = state.waitingQueue.shift();
  const cust = createCustomerInstance(nextSpec, slotIndex, state.wave, state.nextCustomerSeq++);
  cust.chompTimer = state.slotChompTimers[slotIndex] || 0;
  state.customers[slotIndex] = cust;
  return cust;
}

function checkWaveCompletion() {
  if (state.waveDone) return;
  const anyActiveCustomer = state.customers.some((c) => c !== null);
  if (state.customersProcessed >= state.totalCustomers || (!anyActiveCustomer && state.waitingQueue.length === 0)) {
    state.waveDone = true;
    const { rank, stars } = computeRankAndStars(state.coins);
    state.rank = rank;
    state.stars = stars;
    safeAudio('playWaveResult', stars);
    renderPodiumModal();
  }
}

// Check which unfulfilled pizza recipes are currently wanted by waiting customers
function getWantedPizzaTypes() {
  const wanted = [];
  for (const cust of state.customers) {
    if (!cust || cust.mood !== 'waiting') continue;
    for (const item of cust.order) {
      if (!item.done && !item.isJuice) {
        wanted.push({ slotIndex: cust.slotIndex, type: item.type, patience: cust.patience });
      }
    }
  }
  wanted.sort((a, b) => a.patience - b.patience);
  return wanted;
}

function boardCanMakeRecipe(board, targetRecipe) {
  if (!board || !board.hasDough || !targetRecipe) return false;
  if (targetRecipe === 'cheese_pizza') {
    return !board.hasPepperoni && !board.hasVeggie;
  }
  if (targetRecipe === 'pepperoni_pizza') {
    return !board.hasVeggie;
  }
  if (targetRecipe === 'supreme_pizza') {
    return true;
  }
  return false;
}

function computeRecommendedStationId() {
  if (state.waveDone) return null;

  // 1. Burned oven takes top priority
  const burnedOven = state.ovens.find((o) => o.state === 'burned');
  if (burnedOven) return burnedOven.id;

  const wanted = getWantedPizzaTypes();

  // 2. Baked oven whose recipe matches a waiting customer's pizza order
  const matchingBakedOven = state.ovens.find(
    (o) => o.state === 'baked' && wanted.some((w) => w.type === (o.recipe || 'cheese_pizza'))
  );
  if (matchingBakedOven) return matchingBakedOven.id;

  // 3. Ready Mango Juice for a customer who wants juice
  const wantsJuice = state.customers.some(
    (c) => c && c.mood === 'waiting' && c.order.some((it) => !it.done && it.isJuice)
  );
  if (wantsJuice) {
    const readyCup = state.juices.find((j) => j.fillProgress >= 1.0);
    if (readyCup) return readyCup.id;
  }

  // 4. Determine next needed pizza recipe not already in an oven
  const ovenCounts = {};
  for (const o of state.ovens) {
    if (o.state === 'baking' || o.state === 'baked') {
      ovenCounts[o.recipe] = (ovenCounts[o.recipe] || 0) + 1;
    }
  }
  let targetRecipe = null;
  for (const w of wanted) {
    if ((ovenCounts[w.type] || 0) > 0) {
      ovenCounts[w.type] -= 1;
    } else {
      targetRecipe = w.type;
      break;
    }
  }
  if (!targetRecipe && wanted.length > 0) {
    targetRecipe = wanted[0].type;
  }

  const hasEmptyOven = state.ovens.some((o) => o.state === 'empty');

  // If no oven is empty and there is an unmatched baked pizza blocking the oven, highlight trash_bin
  if (!hasEmptyOven) {
    const unmatchedBaked = state.ovens.find(
      (o) => o.state === 'baked' && !wanted.some((w) => w.type === (o.recipe || 'cheese_pizza'))
    );
    if (unmatchedBaked) return 'trash_bin';
  }

  // Pick a prep board that can build targetRecipe (preferring one that already matches or has dough)
  const compatibleBoard =
    state.prepBoards.find((b) => b.hasDough && b.recipe === targetRecipe) ||
    state.prepBoards.find((b) => boardCanMakeRecipe(b, targetRecipe));

  if (compatibleBoard && targetRecipe) {
    if (targetRecipe === 'supreme_pizza') {
      if (!compatibleBoard.hasPepperoni) return 'topping_pepperoni';
      if (!compatibleBoard.hasVeggie) return 'topping_veggie';
      if (hasEmptyOven) return compatibleBoard.id;
    } else if (targetRecipe === 'pepperoni_pizza') {
      if (!compatibleBoard.hasPepperoni) return 'topping_pepperoni';
      if (hasEmptyOven) return compatibleBoard.id;
    } else if (targetRecipe === 'cheese_pizza') {
      if (hasEmptyOven) return compatibleBoard.id;
    }
  }

  const emptyBoard = state.prepBoards.find((b) => !b.hasDough);
  if (emptyBoard && (hasEmptyOven || !compatibleBoard)) {
    return 'dough_tray';
  }

  // If both prep boards have dough with wrong toppings for all waiting customers, suggest trash_bin
  const anyBoardMatchesAnyWanted = state.prepBoards.some(
    (b) => b.hasDough && wanted.some((w) => boardCanMakeRecipe(b, w.type))
  );
  if (!anyBoardMatchesAnyWanted && state.prepBoards.some((b) => b.hasDough)) {
    return 'trash_bin';
  }

  const activeBoard = compatibleBoard || state.prepBoards.find((b) => b.hasDough);
  return activeBoard ? activeBoard.id : 'dough_tray';
}

function triggerMiniArcFlight(fromStationId, toStationId, spec) {
  if (!sceneApi) return;
  try {
    if (typeof sceneApi.spawnFlyingIngredient === 'function') {
      sceneApi.spawnFlyingIngredient(fromStationId, toStationId, spec);
    } else if (typeof sceneApi.spawnFlyingFood === 'function') {
      sceneApi.spawnFlyingFood(fromStationId, toStationId, spec);
    }
    if (typeof sceneApi.triggerStationBounce === 'function') {
      sceneApi.triggerStationBounce(fromStationId);
      sceneApi.triggerStationBounce(toStationId);
    }
  } catch (_err) {
    // Ignore visual helper errors
  }
}

function handleDoughTrayTap(targetBoardIndex = null) {
  safeAudio('init');
  let board = null;
  if (targetBoardIndex !== null && state.prepBoards[targetBoardIndex] && !state.prepBoards[targetBoardIndex].hasDough) {
    board = state.prepBoards[targetBoardIndex];
  } else {
    board = state.prepBoards.find((b) => !b.hasDough) || null;
  }
  if (!board) return false;

  board.state = 'prepping';
  board.hasDough = true;
  board.hasSauce = true;
  board.hasCheese = true;
  board.hasPepperoni = false;
  board.hasVeggie = false;
  board.recipe = 'cheese_pizza';
  board.popTimer = 0.35;

  triggerMiniArcFlight('dough_tray', board.id, { type: 'dough', ingredient: 'dough' });
  safeAudio('playDoughPlop');
  safeAudio('playSauceSpread');
  return true;
}

function handleToppingPepperoniTap(targetBoardIndex = null) {
  safeAudio('init');
  let board = null;
  if (targetBoardIndex !== null) {
    const candidate = state.prepBoards[targetBoardIndex];
    if (candidate && candidate.hasDough && !candidate.hasPepperoni) {
      board = candidate;
    }
  }

  if (!board) {
    const eligible = state.prepBoards.filter((b) => b.hasDough && !b.hasPepperoni);
    if (eligible.length === 0) return false;
    // Prioritize a board that already has veggie (completing supreme) or plain dough
    board = eligible.find((b) => b.hasVeggie) || eligible[0];
  }

  board.hasPepperoni = true;
  board.recipe = computeBoardRecipe(board);
  board.popTimer = 0.3;
  triggerMiniArcFlight('topping_pepperoni', board.id, { type: 'pepperoni', ingredient: 'pepperoni' });
  safeAudio('playToppingPop', board.hasVeggie ? 2 : 1);
  return true;
}

function handleToppingVeggieTap(targetBoardIndex = null) {
  safeAudio('init');
  let board = null;
  if (targetBoardIndex !== null) {
    const candidate = state.prepBoards[targetBoardIndex];
    if (candidate && candidate.hasDough && !candidate.hasVeggie) {
      board = candidate;
    }
  }

  if (!board) {
    const eligible = state.prepBoards.filter((b) => b.hasDough && !b.hasVeggie);
    if (eligible.length === 0) return false;
    // Prioritize a board that already has pepperoni so it becomes a Supreme Pizza!
    board = eligible.find((b) => b.hasPepperoni) || eligible[0];
  }

  board.hasVeggie = true;
  board.recipe = computeBoardRecipe(board);
  board.popTimer = 0.3;
  triggerMiniArcFlight('topping_veggie', board.id, { type: 'veggie', ingredient: 'veggie' });
  safeAudio('playToppingPop', 3);
  return true;
}

function slideBoardToOven(boardIndex, preferredOvenIndex = null) {
  safeAudio('init');
  const board = state.prepBoards[boardIndex];
  if (!board || !board.hasDough) return false;

  let oven = null;
  if (preferredOvenIndex !== null && state.ovens[preferredOvenIndex] && state.ovens[preferredOvenIndex].state === 'empty') {
    oven = state.ovens[preferredOvenIndex];
  } else {
    oven = state.ovens.find((o) => o.state === 'empty') || null;
  }
  if (!oven) return false;

  oven.state = 'baking';
  oven.hasDough = true;
  oven.hasSauce = true;
  oven.hasCheese = true;
  oven.hasPepperoni = board.hasPepperoni;
  oven.hasVeggie = board.hasVeggie;
  oven.recipe = computeBoardRecipe(board);
  oven.bakeProgress = 0;
  oven.burnProgress = 0;
  oven.warnedBurn = false;

  triggerMiniArcFlight(board.id, oven.id, {
    type: oven.recipe,
    recipe: oven.recipe,
    hasPepperoni: oven.hasPepperoni,
    hasVeggie: oven.hasVeggie,
  });

  // Reset prep board
  board.state = 'empty';
  board.hasDough = false;
  board.hasSauce = false;
  board.hasCheese = false;
  board.hasPepperoni = false;
  board.hasVeggie = false;
  board.recipe = null;
  board.popTimer = 0;

  safeAudio('playOvenSlide');
  return true;
}

function deliverItemToCustomer(fromStationId, slotIndex, orderItem, dishType) {
  const cust = state.customers[slotIndex];
  if (!cust) return false;

  orderItem.done = true;
  orderItem.satisfied = true;

  const itemCoins = BASE_COINS[orderItem.type] || BASE_COINS[dishType] || 25;
  state.coins += itemCoins;

  const dishSpec = {
    type: dishType,
    recipe: dishType,
    item: dishType,
    isJuice: dishType === 'mango_juice',
    hasDough: dishType !== 'mango_juice',
    hasSauce: dishType !== 'mango_juice',
    hasCheese: dishType !== 'mango_juice',
    hasPepperoni: dishType === 'pepperoni_pizza' || dishType === 'supreme_pizza',
    hasVeggie: dishType === 'supreme_pizza',
  };

  if (sceneApi && typeof sceneApi.spawnFlyingFood === 'function') {
    sceneApi.spawnFlyingFood(fromStationId, slotIndex, dishSpec);
  }
  safeAudio('playServeWhoosh');

  const allDone = cust.order.every((it) => it.done);
  if (!allDone) {
    // Partial order fulfilled (e.g. pizza served, still wants juice or vice versa)
    cust.patience = Math.min(cust.maxPatience, cust.patience + 7.5);
    cust.patienceRatio = cust.patience / cust.maxPatience;
    if (sceneApi && typeof sceneApi.spawnCoinBurst === 'function') {
      sceneApi.spawnCoinBurst(slotIndex, 2);
    }
    safeAudio('playCoinJingle', 2);
    pulseCoinEmblem();
    return true;
  }

  // Full customer order satisfied!
  if (state.comboTimer > 0 && state.combo >= 1) {
    state.combo = Math.min(4, state.combo + 1);
  } else {
    state.combo = 1;
  }
  state.comboTimer = COMBO_WINDOW;

  const comboBonus = 5 * (state.combo - 1);
  state.coins += comboBonus;

  state.customersServed += 1;
  state.customersProcessed += 1;
  state.customerOutcomes.push('served');
  state.slotChompTimers[slotIndex] = 0.75;

  if (sceneApi) {
    if (typeof sceneApi.spawnHeartBurst === 'function') {
      sceneApi.spawnHeartBurst(slotIndex);
    }
    if (typeof sceneApi.spawnCoinBurst === 'function') {
      sceneApi.spawnCoinBurst(slotIndex, 2 + state.combo);
    }
  }
  safeAudio('playHappyChomp', state.combo);
  safeAudio('playCoinJingle', 2 + state.combo);
  pulseCoinEmblem();

  spawnNextCustomerIntoSlot(slotIndex);
  checkWaveCompletion();
  return true;
}

function handleOvenTap(ovenIndex, targetSlotIndex = null) {
  safeAudio('init');
  const oven = state.ovens[ovenIndex];
  if (!oven) return false;

  if (oven.state === 'burned') {
    clearOven(oven);
    safeAudio('playBurnPoof');
    return true;
  }

  // Convenience: if oven is empty and a prep board has a pizza, slide it into this oven!
  if (oven.state === 'empty') {
    const readyBoard = state.prepBoards.find((b) => b.hasDough);
    if (readyBoard) {
      return slideBoardToOven(readyBoard.index, ovenIndex);
    }
    return false;
  }

  if (oven.state !== 'baked') {
    return false;
  }

  const bakedRecipe = oven.recipe || 'cheese_pizza';

  // Find matching customer
  let matchedCust = null;
  let matchedItem = null;

  const candidateSlots =
    targetSlotIndex !== null
      ? [state.customers[targetSlotIndex]].filter(Boolean)
      : state.customers.filter((c) => c !== null && c.mood === 'waiting');

  // Strict exact recipe match (prioritize lowest patience)
  const exactMatches = [];
  for (const cust of candidateSlots) {
    const item = cust.order.find((it) => !it.done && !it.isJuice && it.type === bakedRecipe);
    if (item) {
      exactMatches.push({ cust, item });
    }
  }
  if (exactMatches.length > 0) {
    exactMatches.sort((a, b) => a.cust.patience - b.cust.patience);
    matchedCust = exactMatches[0].cust;
    matchedItem = exactMatches[0].item;
  }

  if (!matchedCust || !matchedItem) {
    if (sceneApi && typeof sceneApi.triggerStationBounce === 'function') {
      sceneApi.triggerStationBounce(`oven_${ovenIndex}`);
    }
    return false;
  }

  clearOven(oven);
  return deliverItemToCustomer(`oven_${ovenIndex}`, matchedCust.slotIndex, matchedItem, bakedRecipe);
}

function clearOven(oven) {
  oven.state = 'empty';
  oven.hasDough = false;
  oven.hasSauce = false;
  oven.hasCheese = false;
  oven.hasPepperoni = false;
  oven.hasVeggie = false;
  oven.recipe = null;
  oven.bakeProgress = 0;
  oven.burnProgress = 0;
  oven.warnedBurn = false;
}

function handleTrashBinTap() {
  safeAudio('init');
  // 1. Clear any burned ovens first
  let cleared = false;
  for (const oven of state.ovens) {
    if (oven.state === 'burned') {
      clearOven(oven);
      cleared = true;
    }
  }
  if (cleared) {
    safeAudio('playBurnPoof');
    return true;
  }
  // 2. Clear any baked oven whose recipe is not needed by any waiting customer
  const wanted = getWantedPizzaTypes();
  const unneededBakedOven = state.ovens.find(
    (o) => o.state === 'baked' && !wanted.some((w) => w.type === (o.recipe || 'cheese_pizza'))
  );
  if (unneededBakedOven) {
    clearOven(unneededBakedOven);
    safeAudio('playBurnPoof');
    return true;
  }
  // 3. Otherwise clear a prep board if one has dough (preferring one that doesn't match wanted recipes)
  const mismatchedBoard = state.prepBoards.find(
    (b) => b.hasDough && !wanted.some((w) => boardCanMakeRecipe(b, w.type))
  );
  const occupiedBoard = mismatchedBoard || state.prepBoards.find((b) => b.hasDough);
  if (occupiedBoard) {
    occupiedBoard.state = 'empty';
    occupiedBoard.hasDough = false;
    occupiedBoard.hasSauce = false;
    occupiedBoard.hasCheese = false;
    occupiedBoard.hasPepperoni = false;
    occupiedBoard.hasVeggie = false;
    occupiedBoard.recipe = null;
    safeAudio('playBurnPoof');
    return true;
  }
  return false;
}

function handleJuiceTap(juiceIndex, targetSlotIndex = null) {
  safeAudio('init');
  const cup = state.juices[juiceIndex];
  if (!cup || cup.fillProgress < 1.0) return false;

  const candidateSlots =
    targetSlotIndex !== null
      ? [state.customers[targetSlotIndex]].filter(Boolean)
      : state.customers.filter((c) => c !== null && c.mood === 'waiting');

  const juiceWaiters = [];
  for (const cust of candidateSlots) {
    const item = cust.order.find((it) => !it.done && it.isJuice);
    if (item) {
      juiceWaiters.push({ cust, item });
    }
  }

  if (juiceWaiters.length === 0) {
    // Allow serving a complimentary Mango Juice treat (+10 coins, +5s patience) to any waiting customer
    const treatTargets = candidateSlots
      .filter((c) => c && c.mood === 'waiting' && !c.bonusJuiceGiven)
      .sort((a, b) => a.patience - b.patience);
    if (treatTargets.length === 0) return false;

    const treatCust = treatTargets[0];
    treatCust.bonusJuiceGiven = true;
    treatCust.patience = Math.min(treatCust.maxPatience, treatCust.patience + 5.0);
    treatCust.patienceRatio = treatCust.patience / treatCust.maxPatience;
    state.coins += 10;

    cup.fillProgress = 0;
    cup.ready = false;
    cup.state = 'filling';

    if (sceneApi && typeof sceneApi.spawnFlyingFood === 'function') {
      sceneApi.spawnFlyingFood(`juice_${juiceIndex}`, treatCust.slotIndex, {
        type: 'mango_juice',
        recipe: 'mango_juice',
        item: 'mango_juice',
        isJuice: true,
      });
    }
    if (sceneApi && typeof sceneApi.spawnCoinBurst === 'function') {
      sceneApi.spawnCoinBurst(treatCust.slotIndex, 2);
    }
    safeAudio('playServeWhoosh');
    safeAudio('playCoinJingle', 2);
    pulseCoinEmblem();
    return true;
  }
  juiceWaiters.sort((a, b) => a.cust.patience - b.cust.patience);

  const { cust, item } = juiceWaiters[0];

  // Reset cup to start auto-refilling over 2.5s
  cup.fillProgress = 0;
  cup.ready = false;
  cup.state = 'filling';

  return deliverItemToCustomer(`juice_${juiceIndex}`, cust.slotIndex, item, 'mango_juice');
}

function handleCustomerTap(slotIndex) {
  safeAudio('init');
  const cust = state.customers[slotIndex];
  if (!cust || cust.mood !== 'waiting') return false;

  // Check if any baked oven matches what this customer needs
  const neededPizza = cust.order.find((it) => !it.done && !it.isJuice);
  if (neededPizza) {
    const exactOven = state.ovens.find((o) => o.state === 'baked' && o.recipe === neededPizza.type);
    if (exactOven) {
      return handleOvenTap(exactOven.index, slotIndex);
    }
  }

  // Check if a ready juice cup matches what this customer needs
  const neededJuice = cust.order.find((it) => !it.done && it.isJuice);
  if (neededJuice) {
    const readyCup = state.juices.find((j) => j.fillProgress >= 1.0);
    if (readyCup) {
      return handleJuiceTap(readyCup.index, slotIndex);
    }
  }

  return false;
}

export function tapStation(stationId) {
  if (!stationId || state.waveDone) return false;
  let acted = false;

  switch (stationId) {
    case 'dough_tray':
      acted = handleDoughTrayTap();
      break;
    case 'topping_pepperoni':
      acted = handleToppingPepperoniTap();
      break;
    case 'topping_veggie':
      acted = handleToppingVeggieTap();
      break;
    case 'prep_board_0':
      acted = slideBoardToOven(0);
      break;
    case 'prep_board_1':
      acted = slideBoardToOven(1);
      break;
    case 'oven_0':
      acted = handleOvenTap(0);
      break;
    case 'oven_1':
      acted = handleOvenTap(1);
      break;
    case 'trash_bin':
      acted = handleTrashBinTap();
      break;
    case 'juice_0':
      acted = handleJuiceTap(0);
      break;
    case 'juice_1':
      acted = handleJuiceTap(1);
      break;
    case 'customer_0':
    case 'slot_0':
      acted = handleCustomerTap(0);
      break;
    case 'customer_1':
    case 'slot_1':
      acted = handleCustomerTap(1);
      break;
    case 'customer_2':
    case 'slot_2':
      acted = handleCustomerTap(2);
      break;
    default:
      acted = false;
  }

  syncHud();
  renderSceneFrame(0.016);
  return acted;
}

export function dragStation(fromStationId, toStationId) {
  if (!fromStationId || !toStationId || state.waveDone) return false;
  if (fromStationId === toStationId) {
    return tapStation(fromStationId);
  }

  let acted = false;
  const targetBoardIdx =
    toStationId === 'prep_board_0' ? 0 : toStationId === 'prep_board_1' ? 1 : null;
  const targetOvenIdx =
    toStationId === 'oven_0' ? 0 : toStationId === 'oven_1' ? 1 : null;
  const targetSlotIdx =
    toStationId === 'customer_0' || toStationId === 'slot_0'
      ? 0
      : toStationId === 'customer_1' || toStationId === 'slot_1'
      ? 1
      : toStationId === 'customer_2' || toStationId === 'slot_2'
      ? 2
      : null;

  if (fromStationId === 'dough_tray' && targetBoardIdx !== null) {
    acted = handleDoughTrayTap(targetBoardIdx);
  } else if (fromStationId === 'topping_pepperoni' && targetBoardIdx !== null) {
    acted = handleToppingPepperoniTap(targetBoardIdx);
  } else if (fromStationId === 'topping_veggie' && targetBoardIdx !== null) {
    acted = handleToppingVeggieTap(targetBoardIdx);
  } else if ((fromStationId === 'prep_board_0' || fromStationId === 'prep_board_1') && targetOvenIdx !== null) {
    const bIdx = fromStationId === 'prep_board_0' ? 0 : 1;
    acted = slideBoardToOven(bIdx, targetOvenIdx);
  } else if ((fromStationId === 'oven_0' || fromStationId === 'oven_1') && targetSlotIdx !== null) {
    const oIdx = fromStationId === 'oven_0' ? 0 : 1;
    acted = handleOvenTap(oIdx, targetSlotIdx);
  } else if ((fromStationId === 'juice_0' || fromStationId === 'juice_1') && targetSlotIdx !== null) {
    const jIdx = fromStationId === 'juice_0' ? 0 : 1;
    acted = handleJuiceTap(jIdx, targetSlotIdx);
  } else if (toStationId === 'trash_bin') {
    if (fromStationId === 'oven_0' || fromStationId === 'oven_1') {
      const oIdx = fromStationId === 'oven_0' ? 0 : 1;
      clearOven(state.ovens[oIdx]);
      safeAudio('playBurnPoof');
      acted = true;
    } else if (fromStationId === 'prep_board_0' || fromStationId === 'prep_board_1') {
      const bIdx = fromStationId === 'prep_board_0' ? 0 : 1;
      const b = state.prepBoards[bIdx];
      b.state = 'empty';
      b.hasDough = false;
      b.hasSauce = false;
      b.hasCheese = false;
      b.hasPepperoni = false;
      b.hasVeggie = false;
      b.recipe = null;
      safeAudio('playBurnPoof');
      acted = true;
    }
  } else {
    acted = tapStation(fromStationId);
  }

  syncHud();
  renderSceneFrame(0.016);
  return acted;
}

function advanceSingleStep(dt) {
  if (state.waveDone) return;

  state.elapsed += dt;

  // 1. Update combo timer
  if (state.comboTimer > 0) {
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer === 0) {
      state.combo = 0;
    }
  }

  // 2. Update prep board pop timers
  for (const board of state.prepBoards) {
    if (board.popTimer > 0) {
      board.popTimer = Math.max(0, board.popTimer - dt);
    }
  }

  // 3. Update brick ovens (3.0s bake -> 7.5s burn window)
  for (const oven of state.ovens) {
    if (oven.state === 'baking') {
      oven.bakeProgress += dt / BAKE_DURATION;
      if (oven.bakeProgress >= 1.0) {
        oven.bakeProgress = 1.0;
        oven.state = 'baked';
        oven.burnProgress = 0;
        oven.warnedBurn = false;
        safeAudio('playOvenDing');
      }
    } else if (oven.state === 'baked') {
      oven.burnProgress += dt / BURN_DURATION;
      if (oven.burnProgress >= 0.65 && !oven.warnedBurn) {
        oven.warnedBurn = true;
        safeAudio('playBurnWarning');
      }
      if (oven.burnProgress >= 1.0) {
        oven.burnProgress = 1.0;
        oven.state = 'burned';
        state.combo = 0;
        state.comboTimer = 0;
        state.coins = Math.max(0, state.coins - 15);
        for (const cust of state.customers) {
          if (cust && cust.mood === 'waiting') {
            cust.patience = Math.max(0.2, cust.patience - 3.5);
            cust.patienceRatio = cust.patience / cust.maxPatience;
          }
        }
        safeAudio('playBurnPoof');
      }
    }
  }

  // 4. Update auto-refilling mango juice cups (2.5s refill)
  for (const cup of state.juices) {
    if (cup.fillProgress < 1.0) {
      cup.fillProgress = Math.min(1.0, cup.fillProgress + dt / JUICE_REFILL_DURATION);
      if (cup.fillProgress >= 1.0) {
        cup.fillProgress = 1.0;
        cup.ready = true;
        cup.state = 'ready';
        safeAudio('playJuiceReady');
      }
    }
  }

  // 5. Update slot chomp timers & customer patience
  for (let i = 0; i < 3; i++) {
    if (state.slotChompTimers[i] > 0) {
      state.slotChompTimers[i] = Math.max(0, state.slotChompTimers[i] - dt);
    }
    const cust = state.customers[i];
    if (!cust) continue;

    cust.chompTimer = state.slotChompTimers[i];
    if (cust.enterTimer > 0) {
      cust.enterTimer = Math.max(0, cust.enterTimer - dt);
    }

    if (cust.mood === 'waiting') {
      cust.patience = Math.max(0, cust.patience - dt);
      cust.patienceRatio = cust.patience / cust.maxPatience;

      if (cust.patience <= 0) {
        // Customer timed out!
        state.combo = 0;
        state.comboTimer = 0;
        state.coins = Math.max(0, state.coins - 10);
        state.customersMissed += 1;
        state.customersProcessed += 1;
        state.customerOutcomes.push('missed');
        safeAudio('playCustomerAngry');
        spawnNextCustomerIntoSlot(i);
        checkWaveCompletion();
      }
    }
  }
}

export function stepSimulation(totalDt = 0.016) {
  const clampedTotal = Math.max(0, Math.min(300, Number(totalDt) || 0));
  if (clampedTotal <= 0) {
    syncHud();
    renderSceneFrame(0.016);
    return getState();
  }

  const maxSubStep = 0.05;
  let remaining = clampedTotal;
  while (remaining > 1e-6 && !state.waveDone) {
    const step = Math.min(remaining, maxSubStep);
    advanceSingleStep(step);
    remaining -= step;
  }

  syncHud();
  renderSceneFrame(Math.min(clampedTotal, 0.05));
  return getState();
}

export function resetWave(waveNum = state.wave) {
  const targetWave = Math.max(1, Math.min(state.maxWaves, Number(waveNum) || 1));
  state.wave = targetWave;
  state.coins = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.customersServed = 0;
  state.customersMissed = 0;
  state.customersProcessed = 0;
  state.customerOutcomes = [];
  state.nextCustomerSeq = 0;
  state.waveDone = false;
  state.rank = 5;
  state.stars = 0;
  state.elapsed = 0;
  state.slotChompTimers = [0, 0, 0];

  state.prepBoards = [createEmptyBoard(0), createEmptyBoard(1)];
  state.ovens = [createEmptyOven(0), createEmptyOven(1)];
  state.juices = [createJuiceCup(0, 1.0), createJuiceCup(1, 1.0)];

  const schedule = WAVE_SCHEDULES[targetWave] || WAVE_SCHEDULES[1];
  state.totalCustomers = schedule.length;
  state.waitingQueue = schedule.map((item) => ({
    friend: item.friend,
    items: [...item.items],
  }));

  state.customers = [null, null, null];
  for (let i = 0; i < 3; i++) {
    spawnNextCustomerIntoSlot(i);
  }

  closePodiumModal();
  syncHud();
  renderSceneFrame(0.016);
  return getState();
}

export function startNextWave() {
  // Strictly require at least 1 star (Top-3 podium finish) to unlock the next wave
  if (state.waveDone && state.stars < 1) {
    return getState();
  }
  const nextWave = state.wave < state.maxWaves ? state.wave + 1 : 1;
  return resetWave(nextWave);
}

export function cyclePlayerChef(preferredCritter = null) {
  if (preferredCritter && CHEF_POOL.includes(preferredCritter)) {
    state.playerCritter = preferredCritter;
  } else {
    const idx = CHEF_POOL.indexOf(state.playerCritter);
    state.playerCritter = CHEF_POOL[(idx + 1) % CHEF_POOL.length];
  }
  syncHud();
  if (state.waveDone) {
    renderPodiumModal();
  }
  return state.playerCritter;
}

export function getState() {
  const { rank, stars } = state.waveDone
    ? { rank: state.rank, stars: state.stars }
    : computeRankAndStars(state.coins, state.wave);
  const recommendedStationId = computeRecommendedStationId();
  const rivalScores = getWaveRivalScores(state.wave);
  const rivalCritters = getRivalCritters(state.playerCritter);

  return {
    playerCritter: state.playerCritter,
    rivalCritters,
    wave: state.wave,
    maxWaves: state.maxWaves,
    coins: state.coins,
    combo: state.combo,
    comboTimer: state.comboTimer,
    customersServed: state.customersServed,
    customersMissed: state.customersMissed,
    customersProcessed: state.customersProcessed,
    totalCustomers: state.totalCustomers,
    remainingQueue: state.waitingQueue.length,
    waveDone: state.waveDone,
    rank,
    stars,
    rivalScores: [...rivalScores],
    recommendedStationId,
    recommendedStation: recommendedStationId,
    recommendedStations: recommendedStationId ? [recommendedStationId] : [],
    prepBoards: state.prepBoards,
    boards: state.prepBoards,
    prep_board_0: state.prepBoards[0],
    prep_board_1: state.prepBoards[1],
    ovens: state.ovens,
    oven_0: state.ovens[0],
    oven_1: state.ovens[1],
    juices: state.juices,
    juiceCups: state.juices,
    juiceDispensers: state.juices,
    juice_0: state.juices[0],
    juice_1: state.juices[1],
    customers: state.customers,
    slots: state.customers,
    slot_0: state.customers[0],
    slot_1: state.customers[1],
    slot_2: state.customers[2],
    elapsed: state.elapsed,
  };
}

// Pure-Visual DOM HUD Synchronization (Zero Text)
function pulseCoinEmblem() {
  const el = document.getElementById('coinEmblem');
  if (!el) return;
  el.classList.add('pulse');
  setTimeout(() => el.classList.remove('pulse'), 220);
}

function syncHud() {
  // 0. Player Chef Avatar in Top-Left HUD
  const chefImg = document.getElementById('chefAvatarImg');
  if (chefImg) {
    const expectedSrc = `./assets/${state.playerCritter}.webp`;
    if (chefImg.getAttribute('src') !== expectedSrc) {
      chefImg.setAttribute('src', expectedSrc);
    }
    chefImg.style.cssText = getCritterCropStyle(state.playerCritter);
  }

  // 1. Wave Crowns
  for (let w = 0; w < 3; w++) {
    const crown = document.getElementById(`waveCrown${w}`);
    if (!crown) continue;
    crown.classList.toggle('active', w + 1 === state.wave);
    crown.classList.toggle('done', w + 1 < state.wave);
  }

  // 2. Customer Queue Pips (8 customers)
  for (let i = 0; i < 8; i++) {
    const pip = document.getElementById(`custPip${i}`);
    if (!pip) continue;
    const outcome = state.customerOutcomes[i];
    pip.classList.toggle('served', outcome === 'served');
    pip.classList.toggle('missed', outcome === 'missed');
  }

  // 3. Coin Progress Bar & 3 Star Markers scaled to current wave's rival scores
  const rivalScores = getWaveRivalScores(state.wave);
  const s3Target = rivalScores[0]; // 1st place (3 stars)
  const s2Target = rivalScores[1]; // 2nd place (2 stars)
  const s1Target = rivalScores[2]; // 3rd place (1 star)
  const barMax = Math.round(s3Target / 0.88);

  const coinFill = document.getElementById('coinBarFill');
  if (coinFill) {
    const pct = Math.max(0, Math.min(100, (state.coins / barMax) * 100));
    coinFill.style.width = `${pct.toFixed(1)}%`;
  }

  const star1 = document.getElementById('hudStar1');
  const star2 = document.getElementById('hudStar2');
  const star3 = document.getElementById('hudStar3');
  if (star1) {
    star1.style.left = `${((s1Target / barMax) * 100).toFixed(1)}%`;
    star1.classList.toggle('earned', state.coins >= s1Target);
  }
  if (star2) {
    star2.style.left = `${((s2Target / barMax) * 100).toFixed(1)}%`;
    star2.classList.toggle('earned', state.coins >= s2Target);
  }
  if (star3) {
    star3.style.left = `${((s3Target / barMax) * 100).toFixed(1)}%`;
    star3.classList.toggle('earned', state.coins >= s3Target);
  }

  // 4. Combo Streak Flame Meter
  const flameIcon = document.getElementById('comboFlameIcon');
  if (flameIcon) {
    flameIcon.classList.toggle('hot', state.combo >= 2 && state.comboTimer > 0);
  }
  for (let c = 0; c < 4; c++) {
    const pip = document.getElementById(`comboPip${c}`);
    if (!pip) continue;
    pip.className = 'combo-pip';
    if (state.combo > c && state.comboTimer > 0) {
      pip.classList.add(`lit-${state.combo}`);
    }
  }
  const comboTimerFill = document.getElementById('comboTimerFill');
  if (comboTimerFill) {
    const ratio = state.combo > 0 ? Math.max(0, Math.min(100, (state.comboTimer / COMBO_WINDOW) * 100)) : 0;
    comboTimerFill.style.width = `${ratio.toFixed(1)}%`;
  }
}

function getRankBadgeSvg(rank) {
  if (rank === 1) {
    // Gold Crown Trophy
    return `<svg class="podium-badge" viewBox="0 0 36 36">
      <path d="M6 26L9 11L15 17L18 7L21 17L27 11L30 26Z" fill="#fde047" stroke="#92400e" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="6" y="26" width="24" height="4.5" rx="2" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>
    </svg>`;
  }
  if (rank === 2) {
    // Silver Star Medal
    return `<svg class="podium-badge" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="13" fill="#e2e8f0" stroke="#475569" stroke-width="2.6"/>
      <polygon points="18,8 20.8,14 27.3,14.8 22.5,19.3 23.8,25.8 18,22.6 12.2,25.8 13.5,19.3 8.7,14.8 15.2,14" fill="#94a3b8"/>
    </svg>`;
  }
  if (rank === 3) {
    // Bronze Star Medal
    return `<svg class="podium-badge" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="13" fill="#fed7aa" stroke="#92400e" stroke-width="2.6"/>
      <polygon points="18,8 20.8,14 27.3,14.8 22.5,19.3 23.8,25.8 18,22.6 12.2,25.8 13.5,19.3 8.7,14.8 15.2,14" fill="#d97706"/>
    </svg>`;
  }
  // 4th / 5th Dim Cloud Icon
  return `<svg class="podium-badge" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="10" fill="#d6c7b2" stroke="#78716c" stroke-width="2.2" opacity="0.65"/>
  </svg>`;
}

function renderPodiumModal() {
  const modal = document.getElementById('podiumModal');
  const stage = document.getElementById('podiumStage');
  const nextBtn = document.getElementById('nextWaveBtn');
  if (!modal || !stage) return;

  // Update 3 big top stars
  for (let s = 0; s < 3; s++) {
    const starEl = document.getElementById(`podiumStar${s}`);
    if (starEl) {
      starEl.classList.toggle('earned', s < state.stars);
    }
  }

  // Strictly lock Next Wave button if stars === 0 (rank >= 4 Defeat)
  if (nextBtn) {
    nextBtn.style.display = state.stars >= 1 ? 'flex' : 'none';
  }

  const rivalScores = getWaveRivalScores(state.wave);
  const rivalCritters = getRivalCritters(state.playerCritter);

  // Build 5-Critter competitors list (Player Chef + 4 Rivals)
  const entries = [
    {
      critter: state.playerCritter,
      score: state.coins,
      isPlayer: true,
    },
    ...rivalScores.map((score, idx) => ({
      critter: rivalCritters[idx],
      score,
      isPlayer: false,
    })),
  ];

  // Sort descending by score; player wins ties!
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.isPlayer ? -1 : 1;
  });

  // Assign ranks 1..5
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  // Arrange in Olympic Podium visual order: [4th, 2nd, 1st, 3rd, 5th]
  const podiumOrder = [
    entries[3],
    entries[1],
    entries[0],
    entries[2],
    entries[4],
  ].filter(Boolean);

  const RANK_HEIGHT_PCT = { 1: 60, 2: 47, 3: 36, 4: 26, 5: 17 };
  const RANK_DISC_COUNTS = { 1: 9, 2: 7, 3: 5, 4: 3, 5: 1 };

  const chefHatSvg = `<svg class="podium-chef-hat" viewBox="0 0 36 28">
    <path d="M8 18C5.2 17.5 3.5 15 3.5 12.2C3.5 9 6.2 6.5 9.5 6.8C10.8 3.6 14.1 1.5 18 1.5C21.9 1.5 25.2 3.6 26.5 6.8C29.8 6.5 32.5 9 32.5 12.2C32.5 15 30.8 17.5 28 18L26.5 24.5H9.5L8 18Z" fill="#ffffff" stroke="#5c3d2e" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="9" y="21" width="18" height="4.5" rx="1.8" fill="#fef08a" stroke="#5c3d2e" stroke-width="2"/>
  </svg>`;

  stage.innerHTML = podiumOrder
    .map((entry) => {
      const heightPct = RANK_HEIGHT_PCT[entry.rank] || 17;
      const discCount = entry.score <= 0 ? 0 : (RANK_DISC_COUNTS[entry.rank] || 1);
      const discsHtml = Array.from({ length: discCount })
        .map(() => `<div class="coin-disc"></div>`)
        .join('');

      return `
        <div class="podium-col rank-${entry.rank} ${entry.isPlayer ? 'is-player' : ''}">
          ${getRankBadgeSvg(entry.rank)}
          <div class="podium-avatar-outer">
            ${entry.isPlayer ? chefHatSvg : ''}
            <div class="podium-avatar-wrap">
              <img src="./assets/${entry.critter}.webp" style="${getCritterCropStyle(entry.critter)}" alt="" draggable="false" />
            </div>
          </div>
          <div class="podium-pillar" style="height: ${heightPct}%;">
            <div class="coin-disc-stack">${discsHtml}</div>
          </div>
        </div>
      `;
    })
    .join('');

  modal.classList.add('open');
}

function closePodiumModal() {
  const modal = document.getElementById('podiumModal');
  if (modal) {
    modal.classList.remove('open');
  }
}

let renderScheduled = false;
let pendingRenderDt = 0;

function renderSceneNow(dt = 0.016) {
  if (sceneApi && typeof sceneApi.render === 'function') {
    sceneApi.render(getState(), dt, state.elapsed);
  }
}

function renderSceneFrame(dt = 0.016) {
  pendingRenderDt += Number(dt) || 0.016;
  if (renderScheduled) return;
  renderScheduled = true;
  queueMicrotask(() => {
    renderScheduled = false;
    const totalDt = Math.min(0.1, Math.max(0.016, pendingRenderDt));
    pendingRenderDt = 0;
    renderSceneNow(totalDt);
  });
}

function initDomControls() {
  const chefAvatarWrap = document.getElementById('chefAvatarWrap');
  if (chefAvatarWrap) {
    chefAvatarWrap.addEventListener('click', (e) => {
      e.stopPropagation();
      safeAudio('init');
      safeAudio('playClick');
      cyclePlayerChef();
    });
  }

  const muteBtn = document.getElementById('muteBtn');
  const speakerOn = document.getElementById('speakerOnIcon');
  const speakerOff = document.getElementById('speakerOffIcon');

  if (muteBtn) {
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      safeAudio('init');
      const aud = PizzeriaAudio || window.PizzeriaAudio;
      const muted = aud && typeof aud.toggleMute === 'function' ? aud.toggleMute() : false;
      if (speakerOn && speakerOff) {
        speakerOn.style.display = muted ? 'none' : 'block';
        speakerOff.style.display = muted ? 'block' : 'none';
      }
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      safeAudio('init');
      safeAudio('playClick');
      resetWave(state.wave);
    });
  }

  const retryBtn = document.getElementById('retryWaveBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      safeAudio('init');
      safeAudio('playClick');
      resetWave(state.wave);
    });
  }

  const nextBtn = document.getElementById('nextWaveBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      safeAudio('init');
      safeAudio('playClick');
      startNextWave();
    });
  }

  window.addEventListener('resize', () => {
    if (sceneApi && typeof sceneApi.resize === 'function') {
      sceneApi.resize();
    }
    renderSceneFrame(0.016);
  });
}

function bootstrap() {
  const canvasEl = document.getElementById('gameCanvas');
  initDomControls();

  if (canvasEl && typeof createPizzeriaScene === 'function') {
    sceneApi = createPizzeriaScene(canvasEl, {
      onStationTap: (stationId) => {
        tapStation(stationId);
      },
      onStationDragDrop: (fromStationId, toStationId) => {
        dragStation(fromStationId, toStationId);
      },
    });
  }

  resetWave(1);

  let lastTime = performance.now();
  function frame(now) {
    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    const dt = Math.max(0.001, Math.min(0.1, rawDt));

    if (!state.waveDone) {
      advanceSingleStep(dt);
      syncHud();
    }
    renderSceneFrame(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

window.PizzeriaGame = {
  getState,
  tapStation,
  dragStation,
  stepSimulation,
  resetWave,
  startNextWave,
  cyclePlayerChef,
  getScene: () => sceneApi,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
