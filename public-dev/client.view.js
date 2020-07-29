/*
global
G_SCALE
G_DEBUG
G_MASS_MIN
G_MASS_MAX
G_normalize
G_getEntityFromEntMap
G_getHeadingTowards
G_action_move
G_res_shockwave
G_model_getPlayer
G_model_getColor
G_model_getTargetLocation
G_model_getRenderHistory
G_view_renderSoundToggle
G_view_wormholeCount
G_view_renderMenuInfo
G_controller_showMenu
*/

let view_nowMs;
let view_nowDt;
let view_started = false;
let view_loopCb = null;
let G_view_innerHTML = 'innerHTML';
let G_view_none = 'none';
let G_view_block = 'block';
let view_frameTime = +new Date();
const FRAME_TIME_MAX = 9000;

let PI = Math.PI;

const G_view_init = () => {
  G_view_renderSoundToggle();
  G_view_getElementById('practice').disabled = false;
  G_view_getElementById('create-game').disabled = false;
  G_view_renderMenuInfo();
  G_controller_showMenu('menu');
};

function view_hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha !== undefined) {
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  } else {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }
}

const view_updateGlobalFrameTime = () => {
  const dt = view_nowMs - view_frameTime;
  if (dt > FRAME_TIME_MAX) {
    view_frameTime = +new Date();
  }
};

const view_getFrameTimePercentage = () => {
  return Math.min(
    Math.max(
      G_normalize(
        view_nowMs,
        view_frameTime,
        view_frameTime + FRAME_TIME_MAX,
        0,
        1
      ),
      0
    ),
    1
  );
};

const view_getCtx = () => {
  return G_view_getElementById('c').getContext('2d');
};

const G_view_setInnerHTML = (elem, html) => {
  elem.innerHTML = html;
};

const view_clearDisplay = () => {
  const ctx = view_getCtx();
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const view_drawCircle = (x, y, r, color) => {
  const ctx = view_getCtx();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * PI, false);
  ctx.fillStyle = color;
  ctx.fill();
};

const view_drawCircleOutline = (x, y, r, color) => {
  const ctx = view_getCtx();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * PI, false);
  ctx.strokeStyle = color;
  ctx.stroke();
};

const view_drawPoly = (pos, points, color) => {
  const ctx = view_getCtx();
  ctx.save();
  ctx.beginPath();
  ctx.translate(pos.x, pos.y);
  ctx.fillStyle = color;
  const firstPoint = points[0];
  ctx.moveTo(firstPoint.x, firstPoint.y);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const view_drawRectangle = (x, y, w, h, color, deg) => {
  const ctx = view_getCtx();
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  if (deg !== undefined) {
    const w2 = w / 2;
    const h2 = h / 2;
    ctx.translate(w2, h2);
    ctx.rotate((deg * PI) / 180);
    ctx.fillRect(-w2, -h / 1.5, w, h);
  } else {
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
};

const G_view_getColor = (colorPrefix, colorName) => {
  return (
    {
      '': {
        blue: '#44F',
        yellow: '#cac200',
      },
      dark: {
        blue: 'darkblue',
        red: 'darkred',
        green: 'darkgreen',
        yellow: '#B8860B',
      },
      light: {
        blue: 'lightblue',
        red: '#F08080',
        green: 'lightgreen',
        yellow: '#FFF60B',
      },
    }[colorPrefix][colorName] || colorPrefix + colorName
  );
};

const G_view_getColorStyles = color =>
  `background-color:${G_view_getColor('dark', color)};color:${G_view_getColor(
    'light',
    color
  )};`;

const gradients = {};
const view_getGradient = (x, y, n, x2, y2, scale, colorStart, colorStop) => {
  const key = `${x},${y},${n},${x2},${y2},${scale},${colorStart},${colorStop}`;
  if (!gradients[key]) {
    const ctx = view_getCtx();
    const grd = ctx.createRadialGradient(x, y, n, x2, y2, scale);
    grd.addColorStop(0, colorStart);
    grd.addColorStop(1, colorStop);
    gradients[key] = grd;
  }
  return gradients[key];
};

const G_view_hideElement = id => {
  (typeof id === 'string'
    ? G_view_getElementById(id)
    : id
  ).style.display = G_view_none;
};

const G_view_showElement = id => {
  (typeof id === 'string'
    ? G_view_getElementById(id)
    : id
  ).style.display = null;
};

const G_view_getNowDt = () => view_nowDt;

const G_view_loop = cb => {
  view_nowMs = +new Date();
  view_nowDt = 0;
  view_loopCb = cb;

  const _loop = () => {
    let now = +new Date();
    view_nowDt = now - view_nowMs;
    view_nowMs = now;
    view_loopCb();
    requestAnimationFrame(_loop);
  };
  if (!view_started) {
    requestAnimationFrame(_loop);
  }
  view_started = true;
};

const G_view_getScreenDimensions = omitPosition => {
  const ctx = view_getCtx();
  const canvas = ctx.canvas;
  if (omitPosition) {
    const { left, top } = canvas.getBoundingClientRect();
    return { left, top, width: canvas.width, height: canvas.height };
  } else {
    return { left: 0, top: 0, width: canvas.width, height: canvas.height };
  }
};

const G_view_setScreenDimensions = (width, height) => {
  const c = G_view_getElementById('c');
  c.width = width;
  c.height = height;
  const cc = G_view_getElementById('cc');
  cc.style.width = width + 'px';
  cc.style.height = height + 'px';
};

const G_view_pxToWorld = (x, y) => {
  const { width, height } = G_view_getScreenDimensions(true);
  return {
    x: (x - width / 2) / G_SCALE,
    y: -(y - height / 2) / G_SCALE,
  };
};

const G_view_worldToPx = (x, y) => {
  const { width, height } = G_view_getScreenDimensions(true);
  return {
    x: Math.round(x * G_SCALE + width / 2),
    y: Math.round(-y * G_SCALE + height / 2),
  };
};

const G_view_clientToWorld = (x, y) => {
  const { left, top, width, height } = G_view_getScreenDimensions();
  return {
    x: (x - left - width / 2) / G_SCALE,
    y: -(y - top - height / 2) / G_SCALE,
  };
};

const G_view_getElementById = id => {
  return document.getElementById(id);
};

const G_view_renderSimulation = gameData => {
  const { players, planets, projectiles } = gameData;
  const history = G_model_getRenderHistory();

  view_clearDisplay();
  view_updateGlobalFrameTime();

  G_view_drawPlanets(planets.map(id => G_getEntityFromEntMap(id, gameData)));

  // render previous server states
  for (let i = 0; i < history.length; i++) {
    const historyGameData = history[i];
    const { projectiles } = history[i];
    for (let j = 0; j < projectiles.length; j++) {
      const projectileId = projectiles[j];
      const projectile = G_getEntityFromEntMap(projectileId, historyGameData);

      if (projectile.meta.type === G_action_move) {
        continue;
      }

      const { px: x, py: y, r, meta } = projectile;
      const { x: px, y: py } = G_view_worldToPx(x, y);
      const player = G_model_getPlayer(meta.player, gameData);
      view_drawCircle(
        px,
        py,
        r * G_SCALE,
        G_view_getColor('light', player.color)
      );
    }
  }

  G_view_drawProjectiles(
    projectiles
      .map(id => G_getEntityFromEntMap(id, gameData))
      .filter(p => p.type !== G_action_move),
    gameData
  );
  G_view_drawPlayers(players.map(id => G_getEntityFromEntMap(id, gameData)));

  // DEBUG: Draw shockwaves
  if (G_DEBUG) {
    for (let i in gameData.entMap) {
      const entity = gameData.entMap[i];
      if (entity.type === G_res_shockwave) {
        const { x, y, r } = entity;
        const { x: px, y: py } = G_view_worldToPx(x, y);
        view_drawCircle(px, py, r * G_SCALE, 'orange');
      }
    }
  }

  // DEBUG: Draw resource hit-circles
  if (G_DEBUG) {
    for (let i = 0; i < gameData.resources.length; i++) {
      const resourceId = gameData.resources[i];
      const res = G_getEntityFromEntMap(resourceId, gameData);
      const { x, y, r } = res;
      const { x: px, y: py } = G_view_worldToPx(x, y);
      view_drawCircle(px, py, r * G_SCALE, 'white');
    }
  }
};

const G_view_renderStoppedSimulation = gameData => {
  if (!gameData) {
    return;
  }
  const { planets, players } = gameData;
  view_clearDisplay();
  view_updateGlobalFrameTime();
  G_view_drawPlayers(players.map(id => G_getEntityFromEntMap(id, gameData)));
  G_view_drawPlanets(
    planets.map(id => G_getEntityFromEntMap(id, gameData)),
    false
  );

  for (let i in gameData.entMap) {
    const entity = gameData.entMap[i];
    if (entity.type === G_res_shockwave) {
      view_drawCircle(entity.x, entity.y, entity.r * G_SCALE, 'orange');
    }
  }

  // DEBUG: Draw resource hit-circles
  if (G_DEBUG) {
    for (let i = 0; i < gameData.resources.length; i++) {
      const resourceId = gameData.resources[i];
      const res = G_getEntityFromEntMap(resourceId, gameData);
      const { x, y, r } = res;
      const { x: px, y: py } = G_view_worldToPx(x, y);
      view_drawCircle(px, py, r * G_SCALE, 'white');
    }
  }
};

const G_view_drawPlayers = players => {
  for (let i = 0; i < players.length; i++) {
    const { x, y, r, color, target, dead } = players[i];

    const { x: px, y: py } = G_view_worldToPx(x, y);
    const sz = r * 2 * G_SCALE - 10;
    const sz2 = sz / 2;
    const [tx, ty] =
      color === G_model_getColor() ? G_model_getTargetLocation() : target;
    const { x: tPx, y: tPy } = G_view_worldToPx(tx, ty);

    const div = G_view_getElementById('pl-' + color);
    div.style.left = px - 100 + 'px';
    div.style.top = py - 75 + 'px';

    if (dead) {
      div.style.opacity = 0;
      continue;
    }

    view_drawCircle(px, py, r * G_SCALE, G_view_getColor('dark', color));
    view_drawRectangle(px - sz2, py - sz2, sz, sz, G_view_getColor('', color));
    view_drawRectangle(
      px - 5,
      py - 30,
      10,
      60,
      'white',
      G_getHeadingTowards(px, py, tPx, tPy)
    );
    view_drawCircle(px, py, sz2 / 1.5, G_view_getColor('light', color));
  }
};

const G_view_drawPlanets = bodies => {
  const G_R_MIN = 120 / G_SCALE;
  const G_R_MAX = 840 / G_SCALE;
  for (let i = 0; i < bodies.length; i++) {
    const { px: x, py: y, mass } = bodies[i];
    const { x: px, y: py } = G_view_worldToPx(x, y);
    const massGradientR = G_normalize(
      mass,
      G_MASS_MIN,
      G_MASS_MAX,
      G_R_MIN,
      G_R_MAX
    );
    const grd = view_getGradient(
      px,
      py,
      20,
      px,
      py,
      massGradientR * G_SCALE,
      '#0d0d0d',
      'transparent'
    );
    view_drawCircle(px, py, 800, grd);
  }
  for (let i = 0; i < bodies.length; i++) {
    const { px: x, py: y, r, color } = bodies[i];
    const { x: px, y: py } = G_view_worldToPx(x, y);
    view_drawCircle(px, py, r * G_SCALE, view_hexToRGBA(color, '0.9'));
  }
};

const G_view_drawProjectiles = (bodies, gameData) => {
  for (let i = 0; i < bodies.length; i++) {
    const { meta, px: x, py: y, r } = bodies[i];
    const { x: px, y: py } = G_view_worldToPx(x, y);
    if (meta.type !== G_action_move) {
      view_drawCircle(
        px,
        py,
        r * G_SCALE,
        G_model_getPlayer(meta.player, gameData).color
      );
      view_drawCircleOutline(
        px,
        py,
        r * G_SCALE,
        G_view_getColor('light', G_model_getPlayer(meta.player, gameData).color)
      );
    }
  }
};
