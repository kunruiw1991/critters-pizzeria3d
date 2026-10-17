import * as THREE from '../models/three.module.min.js';
import { buildBabaChopsPlushModel } from '../models/baba_chops_model.js';

export const STATION_IDS = [
  'dough_tray',
  'topping_pepperoni',
  'topping_veggie',
  'prep_board_0',
  'prep_board_1',
  'oven_0',
  'oven_1',
  'trash_bin',
  'juice_0',
  'juice_1',
  'customer_0',
  'customer_1',
  'customer_2',
];

const STATION_COORDS = {
  dough_tray: new THREE.Vector3(-3.60, 0.20, 1.60),
  topping_pepperoni: new THREE.Vector3(-1.65, 0.20, 1.80),
  topping_veggie: new THREE.Vector3(-1.65, 0.20, 0.25),
  prep_board_0: new THREE.Vector3(-0.10, 0.12, 1.75),
  prep_board_1: new THREE.Vector3(-0.10, 0.12, 0.15),
  oven_0: new THREE.Vector3(1.62, 0.25, 1.82),
  oven_1: new THREE.Vector3(1.98, 0.25, 0.42),
  trash_bin: new THREE.Vector3(3.10, 0.25, 2.15),
  juice_0: new THREE.Vector3(3.65, 0.25, 0.90),
  juice_1: new THREE.Vector3(3.65, 0.25, -0.35),
  customer_0: new THREE.Vector3(-2.75, 0.78, -1.90),
  customer_1: new THREE.Vector3(-0.05, 0.78, -1.90),
  customer_2: new THREE.Vector3(2.65, 0.78, -1.90),
};

const CRITTER_IDS = ['baba', 'catnap', 'dogday', 'hoppy', 'craftycorn', 'picky', 'bubba', 'kickin'];

const CRITTER_PAW_COLORS = {
  baba: 0x9ca0aa,
  catnap: 0x8a5cf5,
  dogday: 0xf78c2a,
  hoppy: 0x4cc970,
  craftycorn: 0x72efdd,
  picky: 0xff8fab,
  bubba: 0x4ea8de,
  kickin: 0xffd166,
};

export const CRITTER_CROP_BOXES = {
  baba: [0.04, 0.02, 0.92, 0.96],
  craftycorn: [0.12, 0.03, 0.76, 0.92],
  dogday: [0.49, 0.11, 0.25, 0.43],
  catnap: [0.51, 0.17, 0.20, 0.51],
  hoppy: [0.25, 0.06, 0.26, 0.58],
  picky: [0.24, 0.20, 0.24, 0.43],
  bubba: [0.22, 0.10, 0.25, 0.56],
  kickin: [0.31, 0.22, 0.18, 0.58],
};

function seededUnit(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createCritterStandeeTexture(critterId) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  function drawFrame(img) {
    ctx.clearRect(0, 0, 256, 256);

    ctx.save();
    drawRoundedRectPath(ctx, 12, 10, 232, 236, 56);
    ctx.fillStyle = '#5c3d2e';
    ctx.fill();

    drawRoundedRectPath(ctx, 18, 16, 220, 224, 50);
    ctx.fillStyle = '#f2cc8f';
    ctx.fill();

    drawRoundedRectPath(ctx, 25, 23, 206, 210, 44);
    ctx.fillStyle = '#faf3eb';
    ctx.fill();
    ctx.clip();

    const grad = ctx.createRadialGradient(128, 122, 16, 128, 128, 110);
    grad.addColorStop(0, '#fffdf9');
    grad.addColorStop(1, '#f4e1c6');
    ctx.fillStyle = grad;
    ctx.fillRect(25, 23, 206, 210);

    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const [ux, uy, uw, uh] = CRITTER_CROP_BOXES[critterId] || [0.1, 0.05, 0.8, 0.85];
      const sx = Math.max(0, Math.floor(ux * img.naturalWidth));
      const sy = Math.max(0, Math.floor(uy * img.naturalHeight));
      const sw = Math.max(1, Math.floor(uw * img.naturalWidth));
      const sh = Math.max(1, Math.floor(uh * img.naturalHeight));

      ctx.save();
      ctx.filter = 'brightness(1.22) contrast(1.12) saturate(1.32)';
      ctx.drawImage(img, sx, sy, sw, sh, 25, 23, 206, 210);
      ctx.restore();
    } else {
      const hex = CRITTER_PAW_COLORS[critterId] || 0xf78c2a;
      const r = (hex >> 16) & 255;
      const g = (hex >> 8) & 255;
      const b = hex & 255;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(128, 118, 56, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.save();
    drawRoundedRectPath(ctx, 25, 23, 206, 210, 44);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#5c3d2e';
    ctx.stroke();
    ctx.restore();

    tex.needsUpdate = true;
  }

  drawFrame(null);
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawFrame(img);
    img.src = `./assets/${critterId}.webp`;
  }

  return tex;
}

function createWoodGrainTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d69760';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 2) {
    const wave = Math.sin(y * 0.08) * 8 + Math.cos(y * 0.03) * 5;
    const tone = Math.floor(195 + Math.sin(y * 0.19 + wave * 0.2) * 18);
    ctx.fillStyle = `rgb(${tone}, ${Math.floor(tone * 0.69)}, ${Math.floor(tone * 0.42)})`;
    ctx.fillRect(0, y, 256, 2);
  }
  ctx.strokeStyle = 'rgba(92, 61, 46, 0.22)';
  ctx.lineWidth = 2;
  for (let x = 32; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

function createBrickTexture(baseHex = '#E07A5F', mortarHex = '#FAF3EB') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = mortarHex;
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const rowH = 256 / rows;
  const colW = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * colW + offset + 3;
      const by = r * rowH + 3;
      const bw = colW - 6;
      const bh = rowH - 6;
      ctx.fillStyle = baseHex;
      drawRoundedRectPath(ctx, bx, by, bw, bh, 4);
      ctx.fill();

      const shade = seededUnit(r * 19 + c * 7);
      ctx.fillStyle = shade > 0.5 ? 'rgba(255,245,230,0.12)' : 'rgba(92,61,46,0.12)';
      drawRoundedRectPath(ctx, bx + 2, by + 2, bw - 4, bh - 4, 3);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function createCheckeredTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const size = 64;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#FAF3EB' : '#E07A5F';
      ctx.fillRect(c * size, r * size, size, size);
      ctx.strokeStyle = 'rgba(92, 61, 46, 0.16)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c * size + 1, r * size + 1, size - 2, size - 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

function build3DPizzaAssembly(radius = 0.50) {
  const root = new THREE.Group();

  const crustMat = new THREE.MeshStandardMaterial({
    color: 0xf3c677,
    roughness: 0.65,
    metalness: 0.02,
  });
  const sauceMat = new THREE.MeshStandardMaterial({
    color: 0xd62828,
    roughness: 0.45,
    metalness: 0.04,
  });
  const cheeseMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    roughness: 0.38,
    metalness: 0.05,
  });

  const doughDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.94, radius * 0.96, 0.055, 28),
    crustMat
  );
  doughDisc.position.y = 0.028;
  doughDisc.castShadow = true;
  doughDisc.receiveShadow = true;
  root.add(doughDisc);

  const crustRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.88, radius * 0.14, 14, 32),
    crustMat
  );
  crustRing.rotation.x = Math.PI * 0.5;
  crustRing.scale.set(1, 1, 0.72);
  crustRing.position.y = 0.058;
  crustRing.castShadow = true;
  crustRing.receiveShadow = true;
  root.add(crustRing);

  const sauceDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.79, radius * 0.79, 0.02, 26),
    sauceMat
  );
  sauceDisc.position.y = 0.058;
  root.add(sauceDisc);

  const cheeseDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.73, radius * 0.74, 0.024, 26),
    cheeseMat
  );
  cheeseDisc.position.y = 0.073;
  root.add(cheeseDisc);

  const blisterMat = new THREE.MeshStandardMaterial({
    color: 0xf4a261,
    roughness: 0.5,
  });
  for (let i = 0; i < 5; i++) {
    const ang = i * ((Math.PI * 2) / 5) + 0.4;
    const dist = radius * 0.42;
    const blister = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.07, 10, 8), blisterMat);
    blister.scale.set(1.2, 0.35, 1.0);
    blister.position.set(Math.cos(ang) * dist, 0.088, Math.sin(ang) * dist);
    root.add(blister);
  }

  const pepperoniGroup = new THREE.Group();
  const pepMat = new THREE.MeshStandardMaterial({
    color: 0xc1121f,
    roughness: 0.42,
    metalness: 0.05,
  });
  const fatDotMat = new THREE.MeshStandardMaterial({
    color: 0xffccd5,
    roughness: 0.4,
  });

  const pepPositions = [[0, 0]];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    pepPositions.push([Math.cos(a) * radius * 0.44, Math.sin(a) * radius * 0.44]);
  }
  pepPositions.forEach(([px, pz], idx) => {
    const slice = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.145, radius * 0.145, 0.022, 16),
      pepMat
    );
    disc.castShadow = true;
    slice.add(disc);
    for (let d = 0; d < 3; d++) {
      const da = d * 2.1 + idx;
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.026, 8), fatDotMat);
      dot.position.set(Math.cos(da) * radius * 0.06, 0.004, Math.sin(da) * radius * 0.06);
      slice.add(dot);
    }
    slice.position.set(px, 0.096, pz);
    pepperoniGroup.add(slice);
  });
  root.add(pepperoniGroup);

  const veggieGroup = new THREE.Group();
  const pepperMat = new THREE.MeshStandardMaterial({
    color: 0x2b9348,
    roughness: 0.38,
  });
  const basilMat = new THREE.MeshStandardMaterial({
    color: 0x52b788,
    roughness: 0.42,
  });

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6 + 0.52;
    const pr = radius * 0.46;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.105, radius * 0.028, 8, 16),
      pepperMat
    );
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(Math.cos(a) * pr, 0.11, Math.sin(a) * pr);
    veggieGroup.add(ring);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI * 2) / 4 + 0.25;
    const br = radius * 0.24;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.085, 10, 8), basilMat);
    leaf.scale.set(1.45, 0.28, 0.82);
    leaf.rotation.y = a;
    leaf.position.set(Math.cos(a) * br, 0.114, Math.sin(a) * br);
    veggieGroup.add(leaf);
  }
  root.add(veggieGroup);

  function setPizzaLook({ hasPepperoni = false, hasVeggie = false, cookState = 'raw', bakeProgress = 0 } = {}) {
    pepperoniGroup.visible = Boolean(hasPepperoni);
    veggieGroup.visible = Boolean(hasVeggie);

    if (cookState === 'burned') {
      crustMat.color.setHex(0x2b2523);
      sauceMat.color.setHex(0x1f1918);
      cheeseMat.color.setHex(0x3a302c);
    } else if (cookState === 'baked') {
      crustMat.color.setHex(0xd9822b);
      sauceMat.color.setHex(0xc1121f);
      cheeseMat.color.setHex(0xffbe0b);
    } else if (cookState === 'baking') {
      const k = Math.max(0, Math.min(1, bakeProgress));
      crustMat.color.setHex(0xf3c677).lerp(new THREE.Color(0xd9822b), k);
      cheeseMat.color.setHex(0xffd166).lerp(new THREE.Color(0xffbe0b), k);
      sauceMat.color.setHex(0xd62828);
    } else {
      crustMat.color.setHex(0xf6d592);
      sauceMat.color.setHex(0xd62828);
      cheeseMat.color.setHex(0xffe082);
    }
  }

  return {
    root,
    pepperoniGroup,
    veggieGroup,
    setPizzaLook,
  };
}

function build3DJuiceCupAssembly() {
  const root = new THREE.Group();

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.45,
  });
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xffa600,
    emissive: 0xff7b00,
    emissiveIntensity: 0.18,
    roughness: 0.25,
  });
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    roughness: 0.4,
  });

  const glassWalls = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.19, 0.56, 20, 1, true),
    glassMat
  );
  glassWalls.position.y = 0.29;
  root.add(glassWalls);

  const glassBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.04, 20),
    glassMat
  );
  glassBase.position.y = 0.02;
  root.add(glassBase);

  const liquidGroup = new THREE.Group();
  const liquidMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.215, 0.175, 0.46, 18),
    liquidMat
  );
  liquidMesh.position.y = 0.23;
  liquidGroup.add(liquidMesh);

  const foamTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.216, 0.216, 0.026, 18),
    foamMat
  );
  foamTop.position.y = 0.46;
  liquidGroup.add(foamTop);
  liquidGroup.position.y = 0.03;
  root.add(liquidGroup);

  const garnishGroup = new THREE.Group();
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.35 });
  const strawLower = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.52, 10), strawMat);
  strawLower.position.set(-0.07, 0.42, 0.0);
  strawLower.rotation.z = 0.22;
  garnishGroup.add(strawLower);

  const strawTip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 10), strawMat);
  strawTip.position.set(-0.17, 0.67, 0.0);
  strawTip.rotation.z = 0.85;
  garnishGroup.add(strawTip);

  const rindMat = new THREE.MeshStandardMaterial({ color: 0xf77f00, roughness: 0.4 });
  const fleshMat = new THREE.MeshStandardMaterial({ color: 0xffbe0b, roughness: 0.35 });
  const orangeWheel = new THREE.Group();
  const rind = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.035, 16), rindMat);
  rind.rotation.x = Math.PI * 0.5;
  orangeWheel.add(rind);
  const flesh = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.04, 16), fleshMat);
  flesh.rotation.x = Math.PI * 0.5;
  orangeWheel.add(flesh);
  orangeWheel.position.set(0.21, 0.56, 0.04);
  orangeWheel.rotation.z = -0.35;
  garnishGroup.add(orangeWheel);

  root.add(garnishGroup);

  function setFillProgress(progress = 1.0, isReady = true) {
    const p = Math.max(0.02, Math.min(1, progress));
    liquidGroup.scale.set(1, p, 1);
    garnishGroup.visible = Boolean(isReady || p >= 0.98);
  }

  return {
    root,
    liquidGroup,
    garnishGroup,
    setFillProgress,
  };
}

function drawPizzaIcon2D(ctx, cx, cy, r, recipe, hasPep, hasVeg) {
  const isPep = hasPep || recipe === 'pepperoni_pizza' || recipe === 'supreme_pizza';
  const isVeg = hasVeg || recipe === 'supreme_pizza';

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#e08e36';
  ctx.fill();
  ctx.lineWidth = Math.max(3, r * 0.09);
  ctx.strokeStyle = '#6f3818';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.81, 0, Math.PI * 2);
  ctx.fillStyle = '#d62828';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();

  ctx.strokeStyle = 'rgba(180, 105, 25, 0.32)';
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72);
    ctx.lineTo(cx - Math.cos(a) * r * 0.72, cy - Math.sin(a) * r * 0.72);
    ctx.stroke();
  }

  if (!isPep && !isVeg) {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.3;
      const bx = cx + Math.cos(a) * r * 0.36;
      const by = cy + Math.sin(a) * r * 0.36;
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.11, 0, Math.PI * 2);
      ctx.fillStyle = '#f4a261';
      ctx.fill();
    }
  }

  if (isPep) {
    const pepPts = [[0, 0]];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      pepPts.push([Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42]);
    }
    for (const [dx, dy] of pepPts) {
      const px = cx + dx;
      const py = cy + dy;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#c1121f';
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.04);
      ctx.strokeStyle = '#660708';
      ctx.stroke();

      ctx.fillStyle = '#ffccd5';
      ctx.beginPath();
      ctx.arc(px - r * 0.04, py - r * 0.03, r * 0.03, 0, Math.PI * 2);
      ctx.arc(px + r * 0.045, py + r * 0.035, r * 0.026, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (isVeg) {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.55;
      const vx = cx + Math.cos(a) * r * 0.44;
      const vy = cy + Math.sin(a) * r * 0.44;
      ctx.beginPath();
      ctx.arc(vx, vy, r * 0.14, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(3, r * 0.085);
      ctx.strokeStyle = '#1b4332';
      ctx.stroke();
      ctx.lineWidth = Math.max(2, r * 0.055);
      ctx.strokeStyle = '#40916c';
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + 0.2;
      const lx = cx + Math.cos(a) * r * 0.22;
      const ly = cy + Math.sin(a) * r * 0.22;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.12, r * 0.065, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#52b788';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1b4332';
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawJuiceIcon2D(ctx, cx, cy, r) {
  ctx.save();
  const topW = r * 0.92;
  const botW = r * 0.68;
  const cupH = r * 1.32;
  const topY = cy - cupH * 0.42;
  const botY = cy + cupH * 0.58;

  ctx.strokeStyle = '#e63946';
  ctx.lineWidth = Math.max(4, r * 0.14);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - topW * 0.15, topY + cupH * 0.35);
  ctx.lineTo(cx - topW * 0.38, topY - r * 0.36);
  ctx.lineTo(cx - topW * 0.68, topY - r * 0.24);
  ctx.stroke();

  const ox = cx + topW * 0.48;
  const oy = topY + r * 0.02;
  ctx.beginPath();
  ctx.arc(ox, oy, r * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = '#f77f00';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#6f3818';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ox, oy, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - topW * 0.45, topY + cupH * 0.14);
  ctx.lineTo(cx + topW * 0.45, topY + cupH * 0.14);
  ctx.lineTo(cx + botW * 0.46, botY - 4);
  ctx.lineTo(cx - botW * 0.46, botY - 4);
  ctx.closePath();
  ctx.fillStyle = '#ffb703';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, topY + cupH * 0.14, topW * 0.45, r * 0.11, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fff3b0';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - topW * 0.5, topY);
  ctx.lineTo(cx + topW * 0.5, topY);
  ctx.lineTo(cx + botW * 0.5, botY);
  ctx.lineTo(cx - botW * 0.5, botY);
  ctx.closePath();
  ctx.lineWidth = Math.max(3, r * 0.1);
  ctx.strokeStyle = '#4a2e1b';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(2.5, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(cx - topW * 0.32, topY + cupH * 0.22);
  ctx.lineTo(cx - botW * 0.28, botY - cupH * 0.16);
  ctx.stroke();

  ctx.restore();
}

function drawCheckBadge2D(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#2ec4b6';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.02);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.34);
  ctx.lineWidth = Math.max(3.5, r * 0.26);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}

function renderOrderBubbleCanvas(canvas, customer) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!customer) return;

  ctx.save();
  ctx.fillStyle = 'rgba(74, 46, 27, 0.22)';
  drawRoundedRectPath(ctx, 22, 18, 224, 226, 30);
  ctx.fill();

  ctx.fillStyle = '#fffdf9';
  ctx.strokeStyle = '#4a2e1b';
  ctx.lineWidth = 7;

  drawRoundedRectPath(ctx, 18, 12, 224, 226, 30);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(22, 148);
  ctx.lineTo(3, 168);
  ctx.lineTo(24, 182);
  ctx.closePath();
  ctx.fillStyle = '#fffdf9';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(21, 148);
  ctx.lineTo(3, 168);
  ctx.lineTo(23, 182);
  ctx.strokeStyle = '#4a2e1b';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.stroke();

  let pRatio = 1.0;
  if (typeof customer.patienceRatio === 'number') {
    pRatio = customer.patienceRatio;
  } else if (typeof customer.patience === 'number' && typeof customer.maxPatience === 'number' && customer.maxPatience > 0) {
    pRatio = customer.patience / customer.maxPatience;
  }
  pRatio = Math.max(0, Math.min(1, pRatio));

  const barX = 206;
  const barY = 30;
  const barW = 20;
  const barH = 190;

  ctx.fillStyle = '#e9ecef';
  drawRoundedRectPath(ctx, barX, barY, barW, barH, 10);
  ctx.fill();

  const fillH = Math.max(10, barH * pRatio);
  const fillY = barY + (barH - fillH);
  let barColor = '#38b000';
  if (pRatio <= 0.28) {
    barColor = '#e63946';
  } else if (pRatio <= 0.58) {
    barColor = '#ffb703';
  }
  ctx.fillStyle = barColor;
  drawRoundedRectPath(ctx, barX + 2, fillY, barW - 4, fillH, 8);
  ctx.fill();

  ctx.strokeStyle = '#4a2e1b';
  ctx.lineWidth = 3.5;
  drawRoundedRectPath(ctx, barX, barY, barW, barH, 10);
  ctx.stroke();

  const rawOrder = Array.isArray(customer.order) && customer.order.length > 0
    ? customer.order
    : [{ type: customer.recipe || 'cheese_pizza', done: false }];

  if (rawOrder.length === 1) {
    const item = rawOrder[0];
    const type = item.type || item.recipe || 'cheese_pizza';
    const isJuice = type === 'mango_juice' || Boolean(item.isJuice);
    if (isJuice) {
      drawJuiceIcon2D(ctx, 112, 125, 62);
    } else {
      drawPizzaIcon2D(ctx, 112, 125, 68, type, item.hasPepperoni, item.hasVeggie);
    }
    if (item.done || item.satisfied) {
      drawCheckBadge2D(ctx, 162, 175, 22);
    }
  } else {
    ctx.strokeStyle = 'rgba(74, 46, 27, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(36, 126);
    ctx.lineTo(192, 126);
    ctx.stroke();

    const slots = [
      { cx: 110, cy: 72, r: 44 },
      { cx: 112, cy: 178, r: 42 },
    ];
    for (let i = 0; i < Math.min(2, rawOrder.length); i++) {
      const item = rawOrder[i];
      const type = item.type || item.recipe || 'cheese_pizza';
      const isJuice = type === 'mango_juice' || Boolean(item.isJuice);
      const { cx, cy, r } = slots[i];
      if (isJuice) {
        drawJuiceIcon2D(ctx, cx, cy, r * 0.9);
      } else {
        drawPizzaIcon2D(ctx, cx, cy, r, type, item.hasPepperoni, item.hasVeggie);
      }
      if (item.done || item.satisfied) {
        drawCheckBadge2D(ctx, cx + r * 0.72, cy + r * 0.55, 16);
      }
    }
  }

  ctx.restore();
}

function renderOvenRingCanvas(canvas, state, progress, pulsePhase) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!state || state === 'empty') return;

  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = w * 0.37;

  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(42, 26, 18, 0.85)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#faf3eb';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 11;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.stroke();

  if (state === 'baking') {
    const p = Math.max(0.03, Math.min(1, progress));
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.5, -Math.PI * 0.5 + p * Math.PI * 2);
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#38b000';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.quadraticCurveTo(cx + 16, cy - 4, cx + 11, cy + 12);
    ctx.quadraticCurveTo(cx, cy + 20, cx - 11, cy + 12);
    ctx.quadraticCurveTo(cx - 16, cy - 4, cx, cy - 18);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
  } else if (state === 'baked') {
    const rem = Math.max(0.05, Math.min(1, 1.0 - progress));
    const urgent = progress > 0.55;
    const arcColor = urgent ? '#e63946' : '#ffb703';

    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.5, -Math.PI * 0.5 + rem * Math.PI * 2);
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.strokeStyle = arcColor;
    ctx.stroke();

    drawCheckBadge2D(ctx, cx, cy, 19 + Math.sin(pulsePhase * 6) * 2);
  } else if (state === 'burned') {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 11;
    ctx.strokeStyle = '#e63946';
    ctx.stroke();

    ctx.fillStyle = '#adb5bd';
    ctx.beginPath();
    ctx.arc(cx - 8, cy + 3, 10, 0, Math.PI * 2);
    ctx.arc(cx + 8, cy + 3, 10, 0, Math.PI * 2);
    ctx.arc(cx, cy - 6, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function computeAutoGuideStationId(state) {
  if (!state || state.waveDone) return null;
  if (state.recommendedStationId || state.recommendedStation || state.hintStationId) {
    return state.recommendedStationId || state.recommendedStation || state.hintStationId;
  }
  if (Array.isArray(state.recommendedStations) && state.recommendedStations.length > 0) {
    return state.recommendedStations[0];
  }

  const ovens = state.ovens || [];
  const boards = state.prepBoards || state.boards || [];
  const juices = state.juices || state.juiceCups || [];
  const customers = state.customers || state.slots || [];

  // 1. Any burned oven needs immediate clearing
  for (let i = 0; i < ovens.length; i++) {
    if (ovens[i] && ovens[i].state === 'burned') return `oven_${i}`;
  }

  // Gather active customer needs sorted by lowest patience
  const activeCustomers = customers
    .filter((c) => c && c.mood === 'waiting')
    .slice()
    .sort((a, b) => (a.patience || 99) - (b.patience || 99));

  const wantedPizzas = [];
  let wantsJuice = false;
  for (const cust of activeCustomers) {
    const order = Array.isArray(cust.order) ? cust.order : [];
    for (const item of order) {
      if (item.done || item.satisfied) continue;
      if (item.type === 'mango_juice' || item.isJuice) {
        wantsJuice = true;
      } else {
        wantedPizzas.push(item.type || item.recipe || 'cheese_pizza');
      }
    }
  }

  // 2. Any baked oven ready to serve
  for (let i = 0; i < ovens.length; i++) {
    if (ovens[i] && ovens[i].state === 'baked') return `oven_${i}`;
  }

  // 3. Any ready mango juice cup when a waiting customer wants juice
  if (wantsJuice) {
    for (let i = 0; i < juices.length; i++) {
      const j = juices[i];
      if (j && (j.state === 'ready' || j.ready || (j.fillProgress ?? 1) >= 0.99)) {
        return `juice_${i}`;
      }
    }
  }

  // 4. Check prep boards against wantedPizzas
  const targetRecipe = wantedPizzas[0] || null;
  const hasEmptyOven = ovens.some((o) => !o || o.state === 'empty');

  for (let i = 0; i < boards.length; i++) {
    const b = boards[i];
    if (!b || !b.hasDough) continue;
    const needPep = targetRecipe === 'pepperoni_pizza' || targetRecipe === 'supreme_pizza';
    const needVeg = targetRecipe === 'supreme_pizza';
    if (needPep && !b.hasPepperoni) return 'topping_pepperoni';
    if (needVeg && !b.hasVeggie) return 'topping_veggie';
    if (hasEmptyOven) return `prep_board_${i}`;
  }

  // 5. If any prep board is empty and we have customers waiting, highlight dough_tray
  if (wantedPizzas.length > 0 && boards.some((b) => !b || !b.hasDough)) {
    return 'dough_tray';
  }

  return null;
}

export function createPizzeriaScene(canvasEl, callbacks = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf3eb);

  const camera = new THREE.PerspectiveCamera(40, 1.6, 0.1, 60);
  const baseCameraPos = new THREE.Vector3(0, 6.0, 7.6);
  const baseLookAt = new THREE.Vector3(0, 0.25, -0.15);
  let trauma = 0;

  const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0xd9a773, 1.25);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfff2d6, 1.45);
  dirLight.position.set(4.2, 9.2, 6.4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1.0;
  dirLight.shadow.camera.far = 25.0;
  dirLight.shadow.camera.left = -6.2;
  dirLight.shadow.camera.right = 6.2;
  dirLight.shadow.camera.top = 6.2;
  dirLight.shadow.camera.bottom = -6.2;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffe5c4, 0.65);
  fillLight.position.set(-4.5, 5.5, -2.5);
  scene.add(fillLight);

  const woodTex = createWoodGrainTexture();
  const brickTex = createBrickTexture('#E07A5F', '#FAF3EB');
  const mintBrickTex = createBrickTexture('#52B788', '#FAF3EB');
  const wallBrickTex = createBrickTexture('#E07A5F', '#FAF3EB');
  wallBrickTex.repeat.set(6, 5);
  const tileTex = createCheckeredTileTexture();

  const counterWoodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.58,
    metalness: 0.04,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3d2e,
    roughness: 0.65,
    metalness: 0.05,
  });
  const creamLinenMat = new THREE.MeshStandardMaterial({
    color: 0xfaf3eb,
    roughness: 0.72,
    metalness: 0.02,
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    map: brickTex,
    roughness: 0.75,
    metalness: 0.02,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf2cc8f,
    roughness: 0.32,
    metalness: 0.65,
  });

  // Environment & Counter Architecture
  const envGroup = new THREE.Group();
  scene.add(envGroup);

  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 42),
    new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.65 })
  );
  floorMesh.rotation.x = -Math.PI * 0.5;
  floorMesh.position.set(0, -1.35, 5.0);
  floorMesh.receiveShadow = true;
  envGroup.add(floorMesh);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(28, 16, 0.4),
    creamLinenMat
  );
  backWall.position.set(0, 5.2, -3.7);
  backWall.receiveShadow = true;
  envGroup.add(backWall);

  const brickWainscot = new THREE.Mesh(
    new THREE.BoxGeometry(28, 8.2, 0.48),
    new THREE.MeshStandardMaterial({ map: wallBrickTex, roughness: 0.75 })
  );
  brickWainscot.position.set(0, 2.2, -3.65);
  brickWainscot.receiveShadow = true;
  envGroup.add(brickWainscot);

  const backShelf = new THREE.Mesh(
    new THREE.BoxGeometry(16.0, 0.18, 0.55),
    darkWoodMat
  );
  backShelf.position.set(0, 2.65, -3.35);
  envGroup.add(backShelf);

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.34, 3.95),
    counterWoodMat
  );
  counterTop.position.set(0, -0.17, 0.72);
  counterTop.receiveShadow = true;
  counterTop.castShadow = true;
  envGroup.add(counterTop);

  const frontRail = new THREE.Mesh(
    new THREE.BoxGeometry(9.75, 0.38, 0.22),
    darkWoodMat
  );
  frontRail.position.set(0, -0.16, 2.68);
  envGroup.add(frontRail);

  const customerServeLedge = new THREE.Mesh(
    new THREE.BoxGeometry(9.75, 0.12, 0.48),
    creamLinenMat
  );
  customerServeLedge.position.set(0, 0.02, -1.02);
  customerServeLedge.receiveShadow = true;
  envGroup.add(customerServeLedge);

  const counterApron = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 6.2, 3.7),
    terracottaMat
  );
  counterApron.position.set(0, -3.42, 0.72);
  counterApron.receiveShadow = true;
  envGroup.add(counterApron);

  for (let i = -1; i <= 1; i++) {
    const panelFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.55, 2.2, 0.12),
      darkWoodMat
    );
    panelFrame.position.set(i * 2.95, -1.65, 2.58);
    envGroup.add(panelFrame);

    const panelInset = new THREE.Mesh(
      new THREE.BoxGeometry(2.25, 1.9, 0.15),
      creamLinenMat
    );
    panelInset.position.set(i * 2.95, -1.65, 2.59);
    envGroup.add(panelInset);
  }

  // Guided Next-Step Highlight Ring & Bobbing Golden Pointer (`genre_3d_tycoon` §3.1)
  const guideHighlightGroup = new THREE.Group();
  guideHighlightGroup.visible = false;
  scene.add(guideHighlightGroup);

  const guideOuterRing = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.74, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffbe0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      toneMapped: false,
    })
  );
  guideOuterRing.rotation.x = -Math.PI * 0.5;
  guideOuterRing.position.y = 0.018;
  guideHighlightGroup.add(guideOuterRing);

  const guidePointerCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.28, 4),
    new THREE.MeshStandardMaterial({
      color: 0xffbe0b,
      emissive: 0xf77f00,
      emissiveIntensity: 0.45,
      roughness: 0.25,
    })
  );
  guidePointerCone.rotation.x = Math.PI;
  guidePointerCone.position.y = 0.95;
  guideHighlightGroup.add(guidePointerCone);

  const stationGroups = {};
  const interactableMeshes = [];

  function registerStationGroup(stationId, group, hitRadius = 0.56, hitHeight = 0.28) {
    group.userData.stationId = stationId;
    const hitCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(hitRadius, hitRadius, hitHeight, 20),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitCyl.position.y = hitHeight * 0.5;
    hitCyl.userData.stationId = stationId;
    group.add(hitCyl);
    interactableMeshes.push(hitCyl);

    group.traverse((child) => {
      if (child.isMesh) {
        child.userData.stationId = stationId;
      }
    });
    stationGroups[stationId] = group;
    scene.add(group);
  }

  // 1. DOUGH, SAUCE & CHEESE TRAY ('dough_tray' at x: -3.60, z: 1.60)
  const doughTrayGroup = new THREE.Group();
  doughTrayGroup.position.set(-3.60, 0.0, 1.60);
  {
    const trayBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.12, 1.26),
      new THREE.MeshStandardMaterial({ color: 0xe8b87d, roughness: 0.55 })
    );
    trayBase.position.y = 0.06;
    trayBase.castShadow = true;
    trayBase.receiveShadow = true;
    doughTrayGroup.add(trayBase);

    const rimF = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.22, 0.09), darkWoodMat);
    rimF.position.set(0, 0.11, 0.60);
    const rimB = rimF.clone();
    rimB.position.set(0, 0.11, -0.60);
    const rimL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 1.26), darkWoodMat);
    rimL.position.set(-0.69, 0.11, 0);
    const rimR = rimL.clone();
    rimR.position.set(0.69, 0.11, 0);
    doughTrayGroup.add(rimF, rimB, rimL, rimR);

    const doughBallMat = new THREE.MeshStandardMaterial({ color: 0xfff5e1, roughness: 0.62 });
    const ballCoords = [
      [-0.34, 0.22, 0.26],
      [0.08, 0.22, 0.28],
      [-0.36, 0.22, -0.18],
    ];
    ballCoords.forEach(([bx, by, bz]) => {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), doughBallMat);
      ball.scale.set(1.12, 0.72, 1.08);
      ball.position.set(bx, by, bz);
      ball.castShadow = true;
      doughTrayGroup.add(ball);
    });

    const potGroup = new THREE.Group();
    potGroup.position.set(0.32, 0.12, -0.22);
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.22, 0.30, 18),
      new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.38 })
    );
    potBody.position.y = 0.15;
    potBody.castShadow = true;
    potGroup.add(potBody);
    const sauceTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.3 })
    );
    sauceTop.position.y = 0.29;
    potGroup.add(sauceTop);
    const ladleHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8),
      new THREE.MeshStandardMaterial({ color: 0xdee2e6, metalness: 0.6, roughness: 0.25 })
    );
    ladleHandle.position.set(0.08, 0.38, 0.04);
    ladleHandle.rotation.z = -0.45;
    potGroup.add(ladleHandle);
    doughTrayGroup.add(potGroup);

    const cheeseBlock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.22, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.42 })
    );
    cheeseBlock.position.set(0.38, 0.19, 0.28);
    cheeseBlock.castShadow = true;
    doughTrayGroup.add(cheeseBlock);
  }
  registerStationGroup('dough_tray', doughTrayGroup, 0.66, 0.28);

  // 2. PEPPERONI TOPPING BOWL ('topping_pepperoni' at x: -1.65, z: 1.80)
  const pepBowlGroup = new THREE.Group();
  pepBowlGroup.position.set(-1.65, 0.0, 1.80);
  {
    const bowlOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.50, 0.36, 0.25, 24),
      creamLinenMat
    );
    bowlOuter.position.y = 0.125;
    bowlOuter.castShadow = true;
    bowlOuter.receiveShadow = true;
    pepBowlGroup.add(bowlOuter);

    const bowlStripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.47, 0.032, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xc1121f, roughness: 0.4 })
    );
    bowlStripe.rotation.x = Math.PI * 0.5;
    bowlStripe.position.y = 0.21;
    pepBowlGroup.add(bowlStripe);

    const pepBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.43, 0.40, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0x9b0d18, roughness: 0.5 })
    );
    pepBed.position.y = 0.265;
    pepBowlGroup.add(pepBed);

    const pepSliceMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.38 });
    const dotMat = new THREE.MeshStandardMaterial({ color: 0xffccd5, roughness: 0.4 });
    for (let i = 0; i < 9; i++) {
      const a = i * 1.35;
      const r = i === 0 ? 0 : (i < 5 ? 0.17 : 0.28);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.028, 14), pepSliceMat);
      disc.position.set(Math.cos(a) * r, 0.32 + (i % 3) * 0.018, Math.sin(a) * r);
      disc.rotation.set(Math.sin(i) * 0.12, a, Math.cos(i) * 0.12);
      pepBowlGroup.add(disc);

      const speck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), dotMat);
      speck.position.copy(disc.position);
      speck.position.y += 0.006;
      pepBowlGroup.add(speck);
    }
  }
  registerStationGroup('topping_pepperoni', pepBowlGroup, 0.54, 0.28);

  // 3. VEGGIE TOPPING BOWL ('topping_veggie' at x: -1.65, z: 0.25)
  const vegBowlGroup = new THREE.Group();
  vegBowlGroup.position.set(-1.65, 0.0, 0.25);
  {
    const bowlOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.50, 0.36, 0.25, 24),
      creamLinenMat
    );
    bowlOuter.position.y = 0.125;
    bowlOuter.castShadow = true;
    bowlOuter.receiveShadow = true;
    vegBowlGroup.add(bowlOuter);

    const bowlStripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.47, 0.032, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0x2b9348, roughness: 0.4 })
    );
    bowlStripe.rotation.x = Math.PI * 0.5;
    bowlStripe.position.y = 0.21;
    vegBowlGroup.add(bowlStripe);

    const vegBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.43, 0.40, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.55 })
    );
    vegBed.position.y = 0.265;
    vegBowlGroup.add(vegBed);

    const ringMat = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.36 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.4 });
    for (let i = 0; i < 8; i++) {
      const a = i * 1.15;
      const r = i === 0 ? 0.03 : (i < 5 ? 0.16 : 0.27);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.025, 8, 16), ringMat);
      ring.rotation.x = Math.PI * 0.5 + Math.sin(i) * 0.22;
      ring.rotation.y = Math.cos(i) * 0.22;
      ring.position.set(Math.cos(a) * r, 0.33 + (i % 3) * 0.02, Math.sin(a) * r);
      vegBowlGroup.add(ring);
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25 + 0.4;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), leafMat);
      leaf.scale.set(1.5, 0.3, 0.85);
      leaf.rotation.y = a;
      leaf.position.set(Math.cos(a) * 0.2, 0.36, Math.sin(a) * 0.2);
      vegBowlGroup.add(leaf);
    }
  }
  registerStationGroup('topping_veggie', vegBowlGroup, 0.54, 0.28);

  // 4. TWO WOODEN PREP BOARDS ('prep_board_0' at z: 1.75, 'prep_board_1' at z: 0.15)
  const prepBoardControllers = [0, 1].map((idx) => {
    const id = `prep_board_${idx}`;
    const zPos = idx === 0 ? 1.75 : 0.15;
    const group = new THREE.Group();
    group.position.set(-0.10, 0.0, zPos);

    const peelMat = new THREE.MeshStandardMaterial({
      color: 0xe3b278,
      roughness: 0.52,
    });
    const boardDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.64, 0.07, 32),
      peelMat
    );
    boardDisc.position.y = 0.035;
    boardDisc.castShadow = true;
    boardDisc.receiveShadow = true;
    group.add(boardDisc);

    const boardRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.61, 0.022, 10, 32),
      darkWoodMat
    );
    boardRim.rotation.x = Math.PI * 0.5;
    boardRim.position.y = 0.068;
    group.add(boardRim);

    const peelHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.055, 0.36),
      peelMat
    );
    peelHandle.position.set(0, 0.035, 0.72);
    peelHandle.castShadow = true;
    group.add(peelHandle);

    const readyHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.64, 0.71, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffd166,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
        toneMapped: false,
      })
    );
    readyHalo.rotation.x = -Math.PI * 0.5;
    readyHalo.position.y = 0.015;
    group.add(readyHalo);

    const pizzaAssembly = build3DPizzaAssembly(0.52);
    pizzaAssembly.root.position.y = 0.07;
    pizzaAssembly.root.visible = false;
    group.add(pizzaAssembly.root);

    registerStationGroup(id, group, 0.62, 0.28);

    return {
      id,
      group,
      pizzaAssembly,
      readyHalo,
      lastSignature: 'empty',
      prevDough: false,
      prevPep: false,
      prevVeg: false,
      springPop: 0,
    };
  });

  // 5. TWO DOMED BRICK PIZZA OVENS ('oven_0' at (1.62, 1.82), 'oven_1' at (1.98, 0.42))
  const ovenControllers = [0, 1].map((idx) => {
    const id = `oven_${idx}`;
    const coord = STATION_COORDS[id];
    const group = new THREE.Group();
    group.position.set(coord.x, 0.0, coord.z);

    const visualGroup = new THREE.Group();
    visualGroup.rotation.y = -0.28;
    group.add(visualGroup);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.64, 0.68, 0.14, 28),
      new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.7 })
    );
    plinth.position.y = 0.07;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    visualGroup.add(plinth);

    const hearthStone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.60, 0.60, 0.05, 26),
      new THREE.MeshStandardMaterial({ color: 0xd8c3a5, roughness: 0.8 })
    );
    hearthStone.position.y = 0.16;
    hearthStone.receiveShadow = true;
    visualGroup.add(hearthStone);

    const domeMat = new THREE.MeshStandardMaterial({
      map: idx === 0 ? brickTex : mintBrickTex,
      roughness: 0.68,
    });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.60, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.45),
      domeMat
    );
    dome.position.set(0, 0.19, -0.05);
    dome.rotation.x = -0.36;
    dome.scale.set(0.96, 0.78, 0.96);
    dome.castShadow = true;
    dome.receiveShadow = true;
    visualGroup.add(dome);

    const portalArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.075, 12, 20, Math.PI),
      terracottaMat
    );
    portalArch.position.set(0, 0.18, 0.48);
    portalArch.castShadow = true;
    visualGroup.add(portalArch);

    const emberMat = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      toneMapped: false,
    });
    const emberBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.40, 0.42, 0.04, 18),
      emberMat
    );
    emberBed.position.set(0, 0.18, -0.08);
    visualGroup.add(emberBed);

    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.105, 0.22, 16),
      brassMat
    );
    chimney.position.set(0.0, 0.66, -0.16);
    chimney.castShadow = true;
    visualGroup.add(chimney);

    const chimneyCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.135, 0.08, 16),
      darkWoodMat
    );
    chimneyCap.position.set(0.0, 0.81, -0.16);
    visualGroup.add(chimneyCap);

    const ovenLight = new THREE.PointLight(0xff7b29, 1.6, 3.8);
    ovenLight.position.set(0.0, 0.38, 0.35);
    visualGroup.add(ovenLight);

    const pizzaAssembly = build3DPizzaAssembly(0.35);
    pizzaAssembly.root.position.set(0, 0.20, 0.32);
    pizzaAssembly.root.rotation.x = 0.14;
    pizzaAssembly.root.visible = false;
    visualGroup.add(pizzaAssembly.root);

    const puffs = [];
    const puffGeo = new THREE.SphereGeometry(0.075, 10, 8);
    for (let p = 0; p < 5; p++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xfff3b0,
        transparent: true,
        opacity: 0.0,
        toneMapped: false,
      });
      const puff = new THREE.Mesh(puffGeo, pMat);
      visualGroup.add(puff);
      puffs.push(puff);
    }

    // Billboard Circular Timer Ring lowered (y=0.82, z=0.48) so oven_1 never touches slot_2 paws
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 128;
    ringCanvas.height = 128;
    const ringTex = new THREE.CanvasTexture(ringCanvas);
    ringTex.colorSpace = THREE.SRGBColorSpace;
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const ringPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), ringMat);
    ringPlane.position.set(-0.14, 0.82, 0.48);
    ringPlane.visible = false;
    group.add(ringPlane);

    registerStationGroup(id, group, 0.60, 0.28);

    return {
      id,
      group,
      visualGroup,
      ovenLight,
      emberMat,
      pizzaAssembly,
      puffs,
      ringCanvas,
      ringTex,
      ringPlane,
      lastRingKey: '',
      prevState: 'empty',
    };
  });

  // 6. CUTE COPPER TRASH BIN ('trash_bin' at x: 3.10, z: 2.15)
  const trashBinGroup = new THREE.Group();
  trashBinGroup.position.set(STATION_COORDS.trash_bin.x, 0.0, STATION_COORDS.trash_bin.z);
  let trashLidMesh = null;
  let trashPopTimer = 0;
  {
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc86d51,
      roughness: 0.36,
      metalness: 0.48,
    });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.25, 0.52, 20),
      copperMat
    );
    body.position.y = 0.26;
    body.castShadow = true;
    body.receiveShadow = true;
    trashBinGroup.add(body);

    for (let r = 0; r < 2; r++) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.29 + r * 0.02, 0.018, 8, 20),
        brassMat
      );
      band.rotation.x = Math.PI * 0.5;
      band.position.y = 0.18 + r * 0.20;
      trashBinGroup.add(band);
    }

    trashLidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.055, 20),
      copperMat
    );
    trashLidMesh.position.set(0, 0.54, 0);
    trashLidMesh.rotation.z = 0.12;
    trashBinGroup.add(trashLidMesh);

    const lidHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.018, 8, 14, Math.PI),
      brassMat
    );
    lidHandle.position.y = 0.03;
    trashLidMesh.add(lidHandle);
  }
  registerStationGroup('trash_bin', trashBinGroup, 0.46, 0.28);

  // 7. TWO GOLDEN MANGO JUICE DISPENSERS ('juice_0' at (3.65, 0.90), 'juice_1' at (3.65, -0.35))
  const juiceControllers = [0, 1].map((idx) => {
    const id = `juice_${idx}`;
    const coord = STATION_COORDS[id];
    const group = new THREE.Group();
    group.position.set(coord.x, 0.0, coord.z);

    const coaster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.37, 0.05, 22),
      brassMat
    );
    coaster.position.y = 0.025;
    coaster.receiveShadow = true;
    group.add(coaster);

    const dispenserTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.54, 18),
      new THREE.MeshStandardMaterial({
        color: 0xffb703,
        transparent: true,
        opacity: 0.78,
        roughness: 0.22,
      })
    );
    dispenserTank.position.set(0.26, 0.48, -0.20);
    dispenserTank.castShadow = true;
    group.add(dispenserTank);

    const tankCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.23, 0.07, 18),
      darkWoodMat
    );
    tankCap.position.set(0.26, 0.78, -0.20);
    group.add(tankCap);

    const tankPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.24, 0.22, 18),
      darkWoodMat
    );
    tankPedestal.position.set(0.26, 0.11, -0.20);
    group.add(tankPedestal);

    const spout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.24, 10),
      brassMat
    );
    spout.rotation.z = Math.PI * 0.5;
    spout.rotation.y = -0.65;
    spout.position.set(0.13, 0.54, -0.09);
    group.add(spout);

    const streamMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.030, 0.40, 10),
      new THREE.MeshBasicMaterial({ color: 0xffb703, toneMapped: false })
    );
    streamMesh.position.set(0.0, 0.36, 0.0);
    streamMesh.visible = false;
    group.add(streamMesh);

    const cupAssembly = build3DJuiceCupAssembly();
    cupAssembly.root.position.set(0, 0.04, 0.02);
    group.add(cupAssembly.root);

    const readyHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.43, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffbe0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
        toneMapped: false,
      })
    );
    readyHalo.rotation.x = -Math.PI * 0.5;
    readyHalo.position.y = 0.015;
    group.add(readyHalo);

    registerStationGroup(id, group, 0.48, 0.28);

    return {
      id,
      group,
      cupAssembly,
      streamMesh,
      readyHalo,
    };
  });

  // 8. THREE SMILING CRITTER CUSTOMER SLOTS ('customer_0', 'customer_1', 'customer_2')
  const critterStandeeTextures = {};
  CRITTER_IDS.forEach((cid) => {
    critterStandeeTextures[cid] = createCritterStandeeTexture(cid);
  });

  const customerSlotX = [-2.75, -0.05, 2.65];
  const customerControllers = [0, 1, 2].map((slotIdx) => {
    const id = `customer_${slotIdx}`;
    const xPos = customerSlotX[slotIdx];
    const group = new THREE.Group();
    group.position.set(xPos, 0.0, -1.90);

    const characterRig = new THREE.Group();
    group.add(characterRig);

    const portraitMat = new THREE.MeshBasicMaterial({
      map: critterStandeeTextures.dogday,
      transparent: true,
      alphaTest: 0.04,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide,
    });
    const portraitMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 1.34), portraitMat);
    portraitMesh.position.set(-0.30, 0.78, 0.15);
    characterRig.add(portraitMesh);

    const babaPlush = buildBabaChopsPlushModel(THREE);
    babaPlush.root.scale.setScalar(0.94);
    babaPlush.root.position.set(-0.30, -0.14, 0.30);
    babaPlush.root.visible = false;
    characterRig.add(babaPlush.root);

    const pawMat = new THREE.MeshStandardMaterial({
      color: CRITTER_PAW_COLORS.dogday,
      roughness: 0.65,
    });
    const leftPaw = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), pawMat);
    leftPaw.scale.set(1.1, 0.68, 1.3);
    leftPaw.position.set(-0.56, 0.10, 0.78);
    leftPaw.castShadow = true;
    group.add(leftPaw);

    const rightPaw = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), pawMat);
    rightPaw.scale.set(1.1, 0.68, 1.3);
    rightPaw.position.set(-0.04, 0.10, 0.78);
    rightPaw.castShadow = true;
    group.add(rightPaw);

    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = 256;
    bubbleCanvas.height = 256;
    const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
    bubbleTex.colorSpace = THREE.SRGBColorSpace;
    const bubbleMat = new THREE.MeshBasicMaterial({
      map: bubbleTex,
      transparent: true,
      alphaTest: 0.02,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide,
    });
    const bubbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 1.06), bubbleMat);
    bubbleMesh.position.set(0.64, 1.12, 0.32);
    bubbleMesh.rotation.x = -0.28;
    group.add(bubbleMesh);

    registerStationGroup(id, group, 0.72, 0.55);

    return {
      id,
      slotIdx,
      group,
      characterRig,
      portraitMesh,
      portraitMat,
      babaPlush,
      pawMat,
      leftPaw,
      rightPaw,
      bubbleCanvas,
      bubbleTex,
      bubbleMesh,
      lastBubbleSignature: '',
      serveBounce: 0,
    };
  });

  // 9. FLYING FOOD, MINI-ARC INGREDIENTS, GOLD COINS & HEART PARTICLES
  const activeFlyingFoods = [];
  const activeParticles = [];
  let lastIngredientArc = { time: -999, from: '', to: '' };

  const coinGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.042, 18);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xff9f1c,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.78,
  });

  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.12);
  heartShape.bezierCurveTo(0, -0.12, -0.16, 0.02, -0.16, 0.11);
  heartShape.bezierCurveTo(-0.16, 0.20, -0.04, 0.22, 0, 0.13);
  heartShape.bezierCurveTo(0.04, 0.22, 0.16, 0.20, 0.16, 0.11);
  heartShape.bezierCurveTo(0.16, 0.02, 0, -0.12, 0, -0.12);
  const heartGeo = new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  heartGeo.center();
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0xff4d6d,
    emissive: 0xc9184a,
    emissiveIntensity: 0.28,
    roughness: 0.3,
  });

  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const stationBounceMap = {};

  function triggerStationBounce(stationId) {
    if (!stationId) return;
    stationBounceMap[stationId] = 1.0;
    if (stationId === 'trash_bin') {
      trashPopTimer = 1.0;
    }
  }

  function resolveStationWorldPos(stationId) {
    if (!stationId) return STATION_COORDS.oven_0.clone();
    if (STATION_COORDS[stationId]) return STATION_COORDS[stationId].clone();
    if (stationId.startsWith('slot_')) {
      const idx = Number(stationId.split('_')[1]) || 0;
      return (STATION_COORDS[`customer_${idx}`] || STATION_COORDS.customer_0).clone();
    }
    return STATION_COORDS.oven_0.clone();
  }

  function buildIngredientMiniCluster(kind = 'dough', dishSpec = {}) {
    const grp = new THREE.Group();
    if (kind === 'pepperoni') {
      const pepMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.35 });
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 14), pepMat);
        disc.position.set(Math.cos(a) * 0.12, i * 0.02, Math.sin(a) * 0.12);
        grp.add(disc);
      }
    } else if (kind === 'veggie') {
      const vegMat = new THREE.MeshStandardMaterial({ color: 0x2b9348, roughness: 0.35 });
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.025, 8, 14), vegMat);
        ring.rotation.x = Math.PI * 0.5;
        ring.position.set(Math.cos(a) * 0.12, i * 0.02, Math.sin(a) * 0.12);
        grp.add(ring);
      }
    } else if (kind === 'oven_slide') {
      const pizza = build3DPizzaAssembly(0.42);
      pizza.setPizzaLook({
        hasPepperoni: Boolean(dishSpec?.hasPepperoni),
        hasVeggie: Boolean(dishSpec?.hasVeggie),
        cookState: 'raw',
        bakeProgress: 0,
      });
      grp.add(pizza.root);
    } else {
      const doughBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xfff5e1, roughness: 0.55 })
      );
      doughBall.scale.set(1.15, 0.72, 1.15);
      grp.add(doughBall);
    }
    return grp;
  }

  function spawnFlyingIngredient(fromStationId, toStationId, kindOrSpec = 'dough', dishSpec = {}) {
    const nowMs = typeof performance !== 'undefined' ? performance.now() : 0;
    if (
      nowMs - lastIngredientArc.time < 45 &&
      lastIngredientArc.from === fromStationId &&
      lastIngredientArc.to === toStationId
    ) {
      return;
    }
    lastIngredientArc = { time: nowMs, from: fromStationId, to: toStationId };

    let kind = 'dough';
    let spec = dishSpec || {};
    if (typeof kindOrSpec === 'string') {
      kind = kindOrSpec;
    } else if (kindOrSpec && typeof kindOrSpec === 'object') {
      spec = kindOrSpec;
      if (spec.kind || spec.type) {
        const k = String(spec.kind || spec.type);
        if (k.includes('pep')) kind = 'pepperoni';
        else if (k.includes('veg')) kind = 'veggie';
        else if (k.includes('oven') || k.includes('pizza')) kind = 'oven_slide';
        else kind = 'dough';
      } else if (fromStationId === 'topping_pepperoni') {
        kind = 'pepperoni';
      } else if (fromStationId === 'topping_veggie') {
        kind = 'veggie';
      } else if (String(toStationId || '').startsWith('oven')) {
        kind = 'oven_slide';
      }
    }

    const startPos = resolveStationWorldPos(fromStationId);
    const endPos = resolveStationWorldPos(toStationId);
    triggerStationBounce(fromStationId);
    triggerStationBounce(toStationId);

    const meshRoot = buildIngredientMiniCluster(kind, spec);
    meshRoot.position.copy(startPos);
    scene.add(meshRoot);

    activeFlyingFoods.push({
      mesh: meshRoot,
      startPos,
      endPos,
      elapsed: 0,
      duration: 0.25,
      arcHeight: 0.85,
      toStationId,
      toSlotIndex: null,
    });
  }

  function spawnFlyingFood(fromStationId, toSlotIndex = 0, dishSpec = {}) {
    if (typeof toSlotIndex === 'string' && !toSlotIndex.startsWith('customer_') && !toSlotIndex.startsWith('slot_')) {
      const kind = fromStationId === 'topping_pepperoni'
        ? 'pepperoni'
        : (fromStationId === 'topping_veggie' ? 'veggie' : (String(toSlotIndex).startsWith('oven') ? 'oven_slide' : 'dough'));
      spawnFlyingIngredient(fromStationId, toSlotIndex, kind, dishSpec);
      return;
    }

    const startPos = resolveStationWorldPos(fromStationId);
    const parsedSlot = typeof toSlotIndex === 'string'
      ? (Number(toSlotIndex.split('_')[1]) || 0)
      : (Number(toSlotIndex) || 0);
    const clampedSlot = Math.max(0, Math.min(2, parsedSlot));
    const slotKey = `customer_${clampedSlot}`;
    const endPos = resolveStationWorldPos(slotKey);
    endPos.x -= 0.28;
    endPos.y = 0.68;
    endPos.z = -1.25;

    triggerStationBounce(fromStationId);

    const isJuice =
      dishSpec?.type === 'mango_juice' ||
      dishSpec?.recipe === 'mango_juice' ||
      Boolean(dishSpec?.isJuice) ||
      String(fromStationId || '').startsWith('juice');

    let meshRoot;
    if (isJuice) {
      const cup = build3DJuiceCupAssembly();
      cup.setFillProgress(1.0, true);
      meshRoot = cup.root;
    } else {
      const pizza = build3DPizzaAssembly(0.46);
      const recipe = dishSpec?.recipe || dishSpec?.type || 'cheese_pizza';
      pizza.setPizzaLook({
        hasPepperoni: Boolean(dishSpec?.hasPepperoni || recipe === 'pepperoni_pizza' || recipe === 'supreme_pizza'),
        hasVeggie: Boolean(dishSpec?.hasVeggie || recipe === 'supreme_pizza'),
        cookState: 'baked',
        bakeProgress: 1.0,
      });
      meshRoot = pizza.root;
    }

    meshRoot.scale.setScalar(1.22);
    meshRoot.rotation.x = 0.35;
    meshRoot.position.copy(startPos);
    scene.add(meshRoot);

    activeFlyingFoods.push({
      mesh: meshRoot,
      startPos,
      endPos,
      elapsed: 0,
      duration: 0.55,
      arcHeight: 1.45,
      toStationId: slotKey,
      toSlotIndex: clampedSlot,
    });
  }

  function spawnCoinBurst(slotIndex = 0, count = 5) {
    const idx = Math.max(0, Math.min(2, Number(slotIndex) || 0));
    const origin = resolveStationWorldPos(`customer_${idx}`);
    origin.x -= 0.25;
    origin.y = 0.85;
    origin.z = -1.22;

    const n = Math.max(1, Math.min(10, Number(count) || 5));
    for (let i = 0; i < n; i++) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.copy(origin);
      coin.rotation.x = Math.PI * 0.5;
      scene.add(coin);

      const angle = ((i - (n - 1) * 0.5) / Math.max(1, n)) * 1.25;
      activeParticles.push({
        kind: 'coin',
        mesh: coin,
        vel: new THREE.Vector3(Math.sin(angle) * 1.7, 2.3 + (i % 3) * 0.28, 0.7),
        elapsed: 0,
        duration: 0.72,
      });
    }
  }

  function spawnHeartBurst(slotIndex = 0) {
    const idx = Math.max(0, Math.min(2, Number(slotIndex) || 0));
    const origin = resolveStationWorldPos(`customer_${idx}`);
    origin.x -= 0.28;
    origin.y = 1.02;
    origin.z = -1.25;

    for (let i = 0; i < 4; i++) {
      const heart = new THREE.Mesh(heartGeo, heartMat);
      heart.position.copy(origin);
      heart.position.x += (i - 1.5) * 0.24;
      heart.scale.setScalar(1.5);
      scene.add(heart);

      activeParticles.push({
        kind: 'heart',
        mesh: heart,
        vel: new THREE.Vector3((i - 1.5) * 0.42, 1.15 + i * 0.14, 0.28),
        elapsed: 0,
        duration: 0.85,
      });
    }
    if (customerControllers[idx]) {
      customerControllers[idx].serveBounce = 1.0;
    }
  }

  function addTrauma(amount = 0.25) {
    trauma = Math.min(1.0, trauma + amount);
  }

  function resize() {
    const w = canvasEl.clientWidth || window.innerWidth || 1280;
    const h = canvasEl.clientHeight || window.innerHeight || 800;
    renderer.setSize(w, h, false);

    const aspect = w / Math.max(1, h);
    camera.aspect = aspect;

    if (aspect >= 1.25) {
      camera.fov = aspect <= 1.85 ? 40.0 : 37.0;
      baseCameraPos.set(0.0, 6.05, 7.65);
      baseLookAt.set(0.0, 0.26, -0.18);
    } else {
      camera.fov = 58.0;
      const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const tanH = tanV * aspect;
      const reqCzFront = 4.85 / Math.max(0.18, tanH);
      const dist = reqCzFront + 1.85;
      const pitch = THREE.MathUtils.degToRad(37.5);
      baseLookAt.set(0.0, -0.10, 0.05);
      baseCameraPos.set(
        0.0,
        baseLookAt.y + dist * Math.sin(pitch),
        baseLookAt.z + dist * Math.cos(pitch)
      );
    }

    camera.position.copy(baseCameraPos);
    camera.lookAt(baseLookAt);
    camera.rotation.z = 0;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function getStationScreenCoords() {
    const rect = canvasEl.getBoundingClientRect();
    const w = rect.width || canvasEl.clientWidth || window.innerWidth || 1280;
    const h = rect.height || canvasEl.clientHeight || window.innerHeight || 800;
    const left = rect.left || 0;
    const top = rect.top || 0;

    camera.updateMatrixWorld();
    const out = {};
    for (const [id, worldVec] of Object.entries(STATION_COORDS)) {
      const p = worldVec.clone().project(camera);
      out[id] = {
        x: left + (p.x * 0.5 + 0.5) * w,
        y: top + (-p.y * 0.5 + 0.5) * h,
        ndcX: p.x,
        ndcY: p.y,
      };
    }
    out.slot_0 = out.customer_0;
    out.slot_1 = out.customer_1;
    out.slot_2 = out.customer_2;
    return out;
  }

  function raycastStation(clientX, clientY) {
    const coords = getStationScreenCoords();
    const rect = canvasEl.getBoundingClientRect();
    const w = rect.width || canvasEl.clientWidth || 1280;
    const directRadius = Math.max(26, Math.min(54, w * 0.042));

    let closestId = null;
    let closestDist = Infinity;
    for (const id of STATION_IDS) {
      const pt = coords[id];
      if (!pt) continue;
      const d = Math.hypot(clientX - pt.x, clientY - pt.y);
      if (d < closestDist) {
        closestDist = d;
        closestId = id;
      }
    }
    if (closestId && closestDist <= directRadius) {
      return closestId;
    }

    const h = rect.height || canvasEl.clientHeight || 800;
    pointerNdc.x = ((clientX - rect.left) / w) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / h) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactableMeshes, false);
    if (hits.length > 0 && hits[0].object?.userData?.stationId) {
      return hits[0].object.userData.stationId;
    }

    if (closestId && closestDist <= 68) {
      return closestId;
    }
    return null;
  }

  let downStationId = null;
  let downClientX = 0;
  let downClientY = 0;
  let activePointerId = null;

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    activePointerId = e.pointerId;
    downClientX = e.clientX;
    downClientY = e.clientY;
    downStationId = raycastStation(e.clientX, e.clientY);
    if (downStationId) {
      triggerStationBounce(downStationId);
    }
  }

  function onPointerUp(e) {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    activePointerId = null;
    const upStationId = raycastStation(e.clientX, e.clientY);
    const moveDist = Math.hypot(e.clientX - downClientX, e.clientY - downClientY);

    if (downStationId && upStationId && downStationId !== upStationId && moveDist > 24) {
      triggerStationBounce(upStationId);
      if (typeof callbacks.onStationDragDrop === 'function') {
        callbacks.onStationDragDrop(downStationId, upStationId);
      } else if (typeof callbacks.onStationTap === 'function') {
        callbacks.onStationTap(downStationId);
      }
    } else {
      const targetStation = upStationId || downStationId;
      if (targetStation && typeof callbacks.onStationTap === 'function') {
        triggerStationBounce(targetStation);
        callbacks.onStationTap(targetStation);
      }
    }
    downStationId = null;
  }

  canvasEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', resize);
  resize();

  function render(state = {}, dt = 0.016, t = 0) {
    const safeDt = Math.max(0.001, Math.min(0.1, Number(dt) || 0.016));
    const safeT = Number(t) || 0;

    if (trauma > 0) {
      trauma = Math.max(0, trauma - safeDt * 3.5);
      const offsetMag = Math.min(0.05, trauma * trauma * 0.05);
      camera.position.set(
        baseCameraPos.x + Math.sin(safeT * 43.0) * offsetMag,
        baseCameraPos.y + Math.cos(safeT * 37.0) * offsetMag,
        baseCameraPos.z
      );
    } else {
      camera.position.copy(baseCameraPos);
    }
    camera.lookAt(baseLookAt);
    camera.rotation.z = 0;

    // 60fps squash-and-stretch spring pop (scale 1.22 -> 1.0) on station interactions
    for (const id of STATION_IDS) {
      const grp = stationGroups[id];
      if (!grp) continue;
      const b = stationBounceMap[id] || 0;
      if (b > 0) {
        stationBounceMap[id] = Math.max(0, b - safeDt * 4.8);
        const s = 1.0 + Math.sin(b * Math.PI) * 0.22;
        grp.scale.set(s, 1.0 - Math.sin(b * Math.PI) * 0.12, s);
      } else {
        grp.scale.set(1, 1, 1);
      }
    }

    if (trashLidMesh) {
      if (trashPopTimer > 0) {
        trashPopTimer = Math.max(0, trashPopTimer - safeDt * 3.8);
        trashLidMesh.position.y = 0.54 + Math.sin(trashPopTimer * Math.PI) * 0.16;
        trashLidMesh.rotation.z = 0.12 + Math.sin(trashPopTimer * Math.PI) * 0.55;
      } else {
        trashLidMesh.position.y = 0.54;
        trashLidMesh.rotation.z = 0.12;
      }
    }

    // Guided Next-Step Highlight Ring & Bobbing Pointer
    const guideId = computeAutoGuideStationId(state);
    if (guideId && STATION_COORDS[guideId]) {
      guideHighlightGroup.visible = true;
      const c = STATION_COORDS[guideId];
      guideHighlightGroup.position.set(c.x, 0.0, c.z);
      const ringScale = 1.0 + Math.sin(safeT * 7.5) * 0.09;
      guideOuterRing.scale.setScalar(ringScale);
      guideOuterRing.material.opacity = 0.55 + Math.sin(safeT * 7.5) * 0.25;
      guidePointerCone.position.y = 0.92 + Math.sin(safeT * 8.5) * 0.12;
      guidePointerCone.rotation.y = safeT * 2.5;
    } else {
      guideHighlightGroup.visible = false;
    }

    // Prep Boards & Automatic Mini-Arc Ingredient Flights
    const boards = state.prepBoards || state.boards || [];
    prepBoardControllers.forEach((ctrl, idx) => {
      const bState = boards[idx] || {};
      const hasPizza =
        bState.state === 'prepping' ||
        Boolean(bState.hasDough) ||
        Boolean(bState.recipe);

      const hasPep = Boolean(
        bState.hasPepperoni ||
        bState.recipe === 'pepperoni_pizza' ||
        bState.recipe === 'supreme_pizza'
      );
      const hasVeg = Boolean(
        bState.hasVeggie ||
        bState.recipe === 'supreme_pizza'
      );

      // Detect ingredient additions to auto-spawn 0.25s mini-arc flights
      if (hasPizza && !ctrl.prevDough) {
        spawnFlyingIngredient('dough_tray', ctrl.id, 'dough');
      } else if (hasPizza && hasPep && !ctrl.prevPep) {
        spawnFlyingIngredient('topping_pepperoni', ctrl.id, 'pepperoni');
      } else if (hasPizza && hasVeg && !ctrl.prevVeg) {
        spawnFlyingIngredient('topping_veggie', ctrl.id, 'veggie');
      }
      ctrl.prevDough = hasPizza;
      ctrl.prevPep = hasPizza && hasPep;
      ctrl.prevVeg = hasPizza && hasVeg;

      const sig = hasPizza ? `1:${hasPep ? 1 : 0}:${hasVeg ? 1 : 0}` : 'empty';
      if (sig !== ctrl.lastSignature) {
        if (hasPizza) {
          ctrl.springPop = 1.0;
        }
        ctrl.lastSignature = sig;
      }

      ctrl.pizzaAssembly.root.visible = hasPizza;
      if (hasPizza) {
        ctrl.pizzaAssembly.setPizzaLook({
          hasPepperoni: hasPep,
          hasVeggie: hasVeg,
          cookState: 'raw',
          bakeProgress: 0,
        });
        if (ctrl.springPop > 0) {
          ctrl.springPop = Math.max(0, ctrl.springPop - safeDt * 4.8);
          const wave = Math.sin(ctrl.springPop * Math.PI * 2) * ctrl.springPop;
          ctrl.pizzaAssembly.root.scale.set(1 + wave * 0.22, 1 - wave * 0.18, 1 + wave * 0.22);
        } else {
          ctrl.pizzaAssembly.root.scale.set(1, 1, 1);
        }
        ctrl.readyHalo.material.opacity = 0.35 + 0.2 * Math.sin(safeT * 5.0 + idx);
      } else {
        ctrl.readyHalo.material.opacity = 0.0;
      }
    });

    // Ovens & Circular Timer Rings
    const ovens = state.ovens || [];
    ovenControllers.forEach((ctrl, idx) => {
      const oState = ovens[idx] || { state: 'empty', bakeProgress: 0, burnProgress: 0 };
      const st = oState.state || 'empty';
      const bakeP = Number(oState.bakeProgress) || 0;
      const burnP = Number(oState.burnProgress) || 0;

      const hasPep = Boolean(
        oState.hasPepperoni ||
        oState.recipe === 'pepperoni_pizza' ||
        oState.recipe === 'supreme_pizza'
      );
      const hasVeg = Boolean(
        oState.hasVeggie ||
        oState.recipe === 'supreme_pizza'
      );

      if (st === 'baking' && ctrl.prevState === 'empty') {
        spawnFlyingIngredient(`prep_board_${idx}`, ctrl.id, 'oven_slide', {
          hasPepperoni: hasPep,
          hasVeggie: hasVeg,
        });
      }
      ctrl.prevState = st;

      const hasPizza = st === 'baking' || st === 'baked' || st === 'burned';
      ctrl.pizzaAssembly.root.visible = hasPizza;

      if (hasPizza) {
        ctrl.pizzaAssembly.setPizzaLook({
          hasPepperoni: hasPep,
          hasVeggie: hasVeg,
          cookState: st,
          bakeProgress: bakeP,
        });

        if (st === 'baked') {
          const pulse = 1.0 + 0.07 * Math.sin(safeT * 7.5 + idx);
          ctrl.pizzaAssembly.root.scale.set(pulse, 1.0, pulse);
        } else {
          ctrl.pizzaAssembly.root.scale.set(1, 1, 1);
        }
      }

      if (st === 'baking') {
        ctrl.ovenLight.color.setHex(0xff7b29);
        ctrl.ovenLight.intensity = 2.4 + 0.4 * Math.sin(safeT * 8.0 + idx);
        ctrl.emberMat.color.setHex(0xff7b29);
      } else if (st === 'baked') {
        ctrl.ovenLight.color.setHex(0xffbe0b);
        ctrl.ovenLight.intensity = 3.1 + 0.6 * Math.sin(safeT * 10.0 + idx);
        ctrl.emberMat.color.setHex(0xffbe0b);
      } else if (st === 'burned') {
        ctrl.ovenLight.color.setHex(0xd62828);
        ctrl.ovenLight.intensity = 1.0;
        ctrl.emberMat.color.setHex(0x660708);
      } else {
        ctrl.ovenLight.color.setHex(0xff7b29);
        ctrl.ovenLight.intensity = 1.1;
        ctrl.emberMat.color.setHex(0xc85a17);
      }

      ctrl.puffs.forEach((puff, pIdx) => {
        if (st === 'baked' || st === 'burned') {
          const cycle = (safeT * 1.4 + pIdx * 0.2) % 1.0;
          puff.visible = true;
          puff.position.set(
            Math.sin(safeT * 2.5 + pIdx * 1.7) * 0.12,
            0.32 + cycle * 0.65,
            0.38 - cycle * 0.20
          );
          const sc = 0.55 + cycle * 0.85;
          puff.scale.setScalar(sc);
          puff.material.color.setHex(st === 'burned' ? 0x495057 : 0xfff8e7);
          puff.material.opacity = (1.0 - cycle) * (st === 'burned' ? 0.72 : 0.55);
        } else {
          puff.visible = false;
        }
      });

      ctrl.ringPlane.visible = hasPizza;
      if (hasPizza) {
        ctrl.ringPlane.lookAt(camera.position);
        const prog = st === 'baking' ? bakeP : burnP;
        const qProg = Math.round(prog * 45);
        const qPulse = st === 'baked' ? Math.round(Math.sin(safeT * 6) * 4) : 0;
        const ringKey = `${st}:${qProg}:${qPulse}`;
        if (ringKey !== ctrl.lastRingKey) {
          renderOvenRingCanvas(ctrl.ringCanvas, st, prog, safeT);
          ctrl.ringTex.needsUpdate = true;
          ctrl.lastRingKey = ringKey;
        }
      }
    });

    // Juice Dispensers
    const juices = state.juices || state.juiceCups || [];
    juiceControllers.forEach((ctrl, idx) => {
      const jState = juices[idx] || { fillProgress: 1.0, state: 'ready', ready: true };
      const fillP = typeof jState.fillProgress === 'number' ? jState.fillProgress : 1.0;
      const isReady = jState.state === 'ready' || Boolean(jState.ready) || fillP >= 0.99;

      ctrl.cupAssembly.setFillProgress(fillP, isReady);
      ctrl.streamMesh.visible = !isReady && fillP < 0.99;
      if (ctrl.streamMesh.visible) {
        const sPulse = 0.85 + 0.2 * Math.sin(safeT * 18.0 + idx);
        ctrl.streamMesh.scale.set(sPulse, 1.0, sPulse);
      }

      if (isReady) {
        const bounce = 1.0 + 0.04 * Math.sin(safeT * 6.0 + idx);
        ctrl.cupAssembly.root.scale.set(bounce, 1.0, bounce);
        ctrl.readyHalo.material.opacity = 0.45 + 0.25 * Math.sin(safeT * 6.0 + idx);
      } else {
        ctrl.cupAssembly.root.scale.set(1, 1, 1);
        ctrl.readyHalo.material.opacity = 0.0;
      }
    });

    // Customers & Order Bubbles
    const customers = state.customers || state.slots || [];
    customerControllers.forEach((ctrl, slotIdx) => {
      const cust = customers[slotIdx];
      if (!cust) {
        ctrl.group.visible = false;
        return;
      }
      ctrl.group.visible = true;

      const friendId = CRITTER_IDS.includes(cust.friend || cust.id)
        ? (cust.friend || cust.id)
        : CRITTER_IDS[slotIdx % CRITTER_IDS.length];

      const isBaba = friendId === 'baba';
      ctrl.babaPlush.root.visible = isBaba;
      ctrl.portraitMesh.visible = !isBaba;
      ctrl.leftPaw.visible = !isBaba;
      ctrl.rightPaw.visible = !isBaba;

      if (!isBaba && critterStandeeTextures[friendId]) {
        if (ctrl.portraitMat.map !== critterStandeeTextures[friendId]) {
          ctrl.portraitMat.map = critterStandeeTextures[friendId];
          ctrl.portraitMat.needsUpdate = true;
        }
      }
      ctrl.pawMat.color.setHex(CRITTER_PAW_COLORS[friendId] || 0xf78c2a);

      const chompActive = cust.mood === 'happy' || (Number(cust.chompTimer) || 0) > 0 || ctrl.serveBounce > 0;
      if (ctrl.serveBounce > 0) {
        ctrl.serveBounce = Math.max(0, ctrl.serveBounce - safeDt * 2.8);
      }

      const idleBob = Math.sin(safeT * 3.2 + slotIdx * 1.9) * 0.038;
      const chompWave = chompActive ? Math.abs(Math.sin(safeT * 14.0)) * 0.14 : 0;
      ctrl.characterRig.position.y = idleBob + chompWave;

      const scaleSquash = chompActive ? 1.0 + Math.sin(safeT * 14.0) * 0.07 : 1.0;
      ctrl.characterRig.scale.set(scaleSquash, 2.0 - scaleSquash, scaleSquash);

      let pRatio = 1.0;
      if (typeof cust.patienceRatio === 'number') {
        pRatio = cust.patienceRatio;
      } else if (typeof cust.patience === 'number' && typeof cust.maxPatience === 'number' && cust.maxPatience > 0) {
        pRatio = cust.patience / cust.maxPatience;
      }
      const qPatience = Math.round(Math.max(0, Math.min(1, pRatio)) * 40);
      const orderSig = Array.isArray(cust.order)
        ? cust.order.map((it) => `${it.type || it.recipe}:${it.hasPepperoni ? 1 : 0}:${it.hasVeggie ? 1 : 0}:${it.done || it.satisfied ? 1 : 0}`).join('|')
        : String(cust.recipe || 'cheese_pizza');
      const fullBubbleSig = `${friendId}#${orderSig}#${qPatience}`;

      if (fullBubbleSig !== ctrl.lastBubbleSignature) {
        renderOrderBubbleCanvas(ctrl.bubbleCanvas, cust);
        ctrl.bubbleTex.needsUpdate = true;
        ctrl.lastBubbleSignature = fullBubbleSig;
      }
    });

    // Flying Food & Mini-Arc Ingredient Flights
    for (let i = activeFlyingFoods.length - 1; i >= 0; i--) {
      const item = activeFlyingFoods[i];
      item.elapsed += safeDt;
      const u = Math.min(1.0, item.elapsed / item.duration);
      const pos = new THREE.Vector3().lerpVectors(item.startPos, item.endPos, u);
      pos.y += Math.sin(u * Math.PI) * (item.arcHeight || 1.45);
      item.mesh.position.copy(pos);
      item.mesh.rotation.y = u * Math.PI * 1.6;
      item.mesh.rotation.x = 0.35 * (1.0 - u * 0.4);

      if (u >= 1.0) {
        scene.remove(item.mesh);
        if (item.toSlotIndex !== null && customerControllers[item.toSlotIndex]) {
          customerControllers[item.toSlotIndex].serveBounce = 1.0;
        }
        if (item.toStationId) {
          triggerStationBounce(item.toStationId);
        }
        activeFlyingFoods.splice(i, 1);
      }
    }

    // Coin & Heart Bursts
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.elapsed += safeDt;
      const u = p.elapsed / p.duration;
      if (u >= 1.0) {
        scene.remove(p.mesh);
        activeParticles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, safeDt);
      if (p.kind === 'coin') {
        p.vel.y -= 5.8 * safeDt;
        p.mesh.rotation.z += safeDt * 11.0;
      } else {
        p.mesh.rotation.y = Math.sin(safeT * 6.0 + i) * 0.35;
        const s = Math.sin(Math.min(1, u * 1.35) * Math.PI);
        p.mesh.scale.setScalar(Math.max(0.15, s * 1.5));
      }
    }

    renderer.render(scene, camera);
  }

  const api = {
    render,
    spawnFlyingFood,
    spawnFlyingIngredient,
    spawnCoinBurst,
    spawnHeartBurst,
    triggerStationBounce,
    addTrauma,
    getStationScreenCoords,
    raycastStation,
    resize,
    scene,
    camera,
    renderer,
    STATION_IDS,
    CRITTER_CROP_BOXES,
  };

  if (typeof window !== 'undefined') {
    window.createPizzeriaScene = createPizzeriaScene;
  }

  return api;
}

export default createPizzeriaScene;
