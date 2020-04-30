/*
global
G_SCALE
G_AU
G_SPEEDS
G_actions
G_getActionCost
G_getRandomLocInCircle
G_getSpeedCost
G_action_planetCracker
G_action_move
G_res_coin
G_res_spray
G_res_planetCracker
G_model_isResource
G_model_isPlayer
G_model_isSimulating
G_model_isGameOver
G_model_isLoading
G_model_isWaitSelected
G_model_isWaitingForSimToStart
G_model_isSelectingTarget
G_model_isPractice
G_model_getMe
G_model_getPlayer
G_model_getGameName
G_model_getColor
G_model_getUserId
G_model_getTargetLocation
G_model_getSelectedSpeed
G_model_getTargetLocation
G_model_getBroadcastHistory
G_model_getMapIndex
G_model_getMap
G_model_getMaps
*/

let view_nowMs;
let view_nowDt;
let view_started = false;
let view_loopCb = null;
let view_innerHTML = 'innerHTML';
let view_none = 'none';
let view_block = 'block';

let PI = Math.PI;

const view_getCtx = () => {
  return G_view_getElementById('c').getContext('2d');
};

const G_view_setInnerHTML = (elem, html) => {
  elem.innerHTML = html;
};

const view_clearDisplay = () => {
  const ctx = view_getCtx();
  const canvas = ctx.canvas;
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const view_drawCircle = (x, y, r, color) => {
  const ctx = view_getCtx();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * PI, false);
  ctx.fillStyle = color;
  ctx.fill();
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

const view_getHeadingTowards = (myX, myY, x, y) => {
  let lenY = y - myY;
  let lenX = x - myX;
  const { sqrt, asin } = Math;
  let hyp = sqrt(lenX * lenX + lenY * lenY);
  let ret = 0;
  if (y >= myY && x >= myX) {
    ret = (asin(lenY / hyp) * 180) / PI + 90;
  } else if (y >= myY && x < myX) {
    ret = (asin(lenY / -hyp) * 180) / PI - 90;
  } else if (y < myY && x > myX) {
    ret = (asin(lenY / hyp) * 180) / PI + 90;
  } else {
    ret = (asin(-lenY / hyp) * 180) / PI - 90;
  }
  if (ret >= 360) {
    ret = 360 - ret;
  }
  if (ret < 0) {
    ret = 360 + ret;
  }
  return isNaN(ret) ? 0 : ret;
};

const view_getColorStyles = color =>
  `background-color:${G_view_getColor('dark', color)};color:${G_view_getColor(
    'light',
    color
  )};`;

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

const G_view_getScreenDimensions = () => {
  const ctx = view_getCtx();
  const canvas = ctx.canvas;
  const { left, top } = canvas.getBoundingClientRect();
  return { left, top, width: canvas.width, height: canvas.height };
};

const G_view_setScreenDimensions = (width, height) => {
  const c = G_view_getElementById('c');
  c.width = width;
  c.height = height;
};

const G_view_getColor = (colorPrefix, colorName) => {
  return (
    {
      '': {
        blue: '#44F',
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
        yellow: '#B8860B',
      },
    }[colorPrefix][colorName] || colorPrefix + colorName
  );
};

const G_view_pxToWorld = (x, y) => {
  const { width, height } = G_view_getScreenDimensions();
  return {
    x: (x - width / 2) / G_SCALE,
    y: -(y - height / 2) / G_SCALE,
  };
};

const G_view_worldToPx = (x, y) => {
  const { width, height } = G_view_getScreenDimensions();
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
  const history = G_model_getBroadcastHistory();

  view_clearDisplay();

  // render previous server states
  for (let i = 0; i < history.length; i++) {
    const { projectiles } = history[i];
    for (let j = 0; j < projectiles.length; j++) {
      const { px: x, py: y, r, meta } = projectiles[j];
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

  G_view_drawPlayers(players);
  G_view_drawBodies(planets, gameData);
  G_view_drawBodies(projectiles, gameData);

  let collisions = gameData.collisions;
  let len = collisions.length;
  if (len) {
    for (let i = 0; i < len; i++) {
      const [projectile, other] = collisions[i];
      const { x, y } = G_view_worldToPx(projectile.px, projectile.py);
      let otherMeta = (other && other.meta) || {};
      if (otherMeta.player === projectile.meta.player) {
        continue;
      }
      if (projectile.meta.type !== G_action_move) {
        G_view_createExplosion(x, y);
      }
      let ind = gameData.projectiles.indexOf(projectile);
      if (ind > -1) {
        gameData.projectiles.splice(ind, 1);
      }
      if (G_model_isResource(other)) {
        const player = G_model_getPlayer(projectile.meta.player, gameData);
        G_view_getElementById('res-' + other.id).remove();
        let txt = '';
        switch (other.type) {
          case G_res_coin:
            txt = '+$' + other.value;
            break;
          case G_res_spray:
            txt = '+2 Spreadfire';
            break;
          case G_res_planetCracker:
            txt = '+2 PlanetCracker';
        }
        const { x, y } = G_view_worldToPx(other.x, other.y);
        G_view_createTextParticle(
          x,
          y,
          txt,
          G_view_getColor('light', player.color)
        );
      } else if (other && other.meta && other.meta.type === 'planet') {
        if (projectile.meta.type === G_action_planetCracker) {
          view_createLargeExplosion(other.px, other.py, G_AU, 30);
        }
      }
      const hitByProjectile = other && G_model_isPlayer(other, gameData);
      const hitAPlanet =
        other && projectile.meta.type === G_action_move && !!other.color;
      let pl = null;
      if (hitByProjectile) {
        pl = G_model_getPlayer(other.id, gameData);
      } else if (hitAPlanet) {
        pl = G_model_getPlayer(projectile.meta.player, gameData);
      }
      if (pl) {
        pl.dead = true;
        const { x: px, y: py } = G_view_worldToPx(pl.x, pl.y);
        G_view_createTextParticle(
          px,
          py,
          'Eliminated!',
          G_view_getColor('light', pl.color)
        );
        view_createLargeExplosion(pl.x, pl.y, G_AU / 2, 12);
      }
    }
  }
  gameData.collisions = [];
};

const view_createElement = (
  parent,
  childHtml,
  childClassName,
  left,
  top,
  id,
  styles
) => {
  styles = styles || {};
  const style = {
    position: 'absolute',
    left: left + 'px',
    top: top + 'px',
    ...styles,
  };
  const div = document.createElement('div');
  div.className = childClassName;
  if (typeof childHtml === 'string') {
    G_view_setInnerHTML(div, childHtml);
  } else {
    div.appendChild(childHtml);
  }
  div.id = id;
  for (let i in style) {
    div.style[i] = style[i];
  }
  parent.appendChild(div);
  return div;
};

const G_view_createResources = res => {
  const elem = G_view_getElementById('res');
  G_view_setInnerHTML(elem, '');
  for (let i = 0; i < res.length; i++) {
    const { x, y, id, type } = res[i];
    const { x: px, y: py } = G_view_worldToPx(x, y);
    const div = document.createElement('div');
    const types = {
      [G_res_planetCracker]: 'PlanetCracker',
      [G_res_spray]: 'Spreadfire',
      [G_res_coin]: '',
    };
    div.innerHTML = types[type];
    const createdElem = view_createElement(
      div,
      type === G_res_coin ? '$' : '!',
      'resource ' + type,
      px - 25,
      py - 25,
      'res-' + id
    );
    div.style.left = createdElem.style.left;
    div.style.top = createdElem.style.top;
    div.className = 'res2';
    createdElem.style.position = 'unset';
    elem.appendChild(div);
  }
};

const view_createLargeExplosion = (xx, yy, r, amt) => {
  for (let i = 0; i < amt; i++) {
    const { x, y } = G_getRandomLocInCircle(xx, yy, r);
    const { x: px, y: py } = G_view_worldToPx(x, y);
    setTimeout(() => {
      G_view_createExplosion(px, py);
    }, (i / amt) * 2000);
  }
};

const G_view_createExplosion = (x, y) => {
  const id = x + ',' + y;
  if (G_view_getElementById(id)) {
    return;
  }
  view_createElement(
    G_view_getElementById('particles'),
    '',
    'expl',
    x - 50,
    y - 50,
    id
  );
};

const G_view_createTextParticle = (x, y, text, color) => {
  const id = 'text,' + x + ',' + y;
  if (G_view_getElementById(id)) {
    return;
  }
  view_createElement(
    G_view_getElementById('particles'),
    text,
    'text-particle',
    x - 100,
    y,
    id,
    { color }
  );
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
      view_getHeadingTowards(px, py, tPx, tPy)
    );
    view_drawCircle(px, py, sz2 / 1.5, G_view_getColor('light', color));
  }
};

const G_view_drawBodies = (bodies, gameData) => {
  for (let i = 0; i < bodies.length; i++) {
    const { meta, px: x, py: y, r, color } = bodies[i];
    const { x: px, y: py } = G_view_worldToPx(x, y);
    const isPlanet = meta.type === 'planet';
    let pl;
    if (!isPlanet) {
      pl = G_model_getPlayer(meta.player, gameData);
      if (meta.player && meta.type === G_action_move) {
        pl.x = x;
        pl.y = y;
        continue;
      }
    }
    view_drawCircle(px, py, r * G_SCALE, isPlanet ? color : pl.color);
  }
};

const view_renderActionButton = (
  label,
  helperText,
  actionName,
  disabled,
  animated
) => {
  const anim = '2s linear infinite border-color;';
  return `<div class="h-button-list">
<button ${
    disabled ? 'disabled' : ''
  } onclick="events.confirmAction('${actionName}')" style="width:136px;margin:2px;animation:${
    animated ? anim : ''
  }">${label}</button>
<div>${helperText}</div>
</div>`;
};

const G_view_renderGameUI = gameData => {
  if (!gameData) {
    return;
  }

  const player = G_model_getMe(gameData);
  const isLoading = G_model_isLoading();
  const isGameOver = G_model_isGameOver();
  const isDead = player.dead;
  const isWaiting = G_model_isWaitingForSimToStart();

  // visibility
  G_view_getElementById('controls').style.display =
    G_model_isSimulating() || isWaiting || isGameOver || isDead
      ? view_none
      : 'flex';

  G_view_getElementById('leave-game').style.display =
    isGameOver || isDead ? view_block : view_none;

  // control buttons
  let htmlSpeeds = '';
  Object.keys(G_SPEEDS).forEach(speedName => {
    let [, cost] = G_SPEEDS[speedName];
    let selected = speedName === G_model_getSelectedSpeed();
    let style = selected ? view_getColorStyles(G_model_getColor()) : '';
    htmlSpeeds += `<div class="action-label" style="pointer-events:${
      isLoading ? view_none : 'all'
    }">
<div>Cost $${cost}</div>
<div class="action" style="${style}" id="${speedName}" onclick="events.setSpeed('${speedName}')">${speedName}
</div>
</div>`;
  });
  G_view_setInnerHTML(G_view_getElementById('speed-buttons'), htmlSpeeds);
  G_view_getElementById('back-practice').style.display = G_model_isPractice()
    ? view_block
    : view_none;

  // action buttons
  let htmlActions = '';
  G_actions.forEach(([actionName, cost], i) => {
    const amt = player.actions[actionName];
    if (amt) {
      htmlActions =
        view_renderActionButton(
          actionName + (amt < 99 ? ` (${amt})` : ''),
          `$${cost}`,
          actionName,
          G_getSpeedCost(G_model_getSelectedSpeed()) + cost > player.funds,
          i > 1
        ) + htmlActions;
    }
  });
  G_view_setInnerHTML(G_view_getElementById('action-buttons'), htmlActions);

  // info
  G_view_getElementById('funds').innerHTML = `Funds: $${player.funds}`;

  // target
  let target = G_view_getElementById('target');
  const loc = G_model_getTargetLocation();
  const { x, y } = G_view_worldToPx(loc[0], loc[1]);
  target.style.display =
    G_model_isSimulating() || isGameOver || isDead ? view_none : 'flex';
  target.style.left = x - 30 + 'px';
  target.style.top = y - 30 + 'px';
  target.style.stroke = G_view_getColor('', G_model_getColor());
  target.className = 'target';
  const X = G_view_getElementById('x').cloneNode(true);
  X.id = 'x2';
  X.style.display = view_block;
  G_view_setInnerHTML(target, '');
  target.appendChild(X);

  // banner
  const bannerMessage = G_view_getElementById('banner-message');
  const bannerMessage2 = G_view_getElementById('banner-message2');
  if (isWaiting) {
    G_view_setInnerHTML(bannerMessage, 'Waiting for other players...');
  } else if (isGameOver) {
    G_view_setInnerHTML(bannerMessage, 'The Game is Over!');
  } else if (isDead) {
    G_view_setInnerHTML(bannerMessage, 'You have been destroyed!');
  } else {
    G_view_setInnerHTML(
      bannerMessage,
      `You are the <span style="${view_getColorStyles(
        player.color
      )}border:1px solid;padding:2px;">${player.color}</span> player.`
    );
  }
  if (isGameOver) {
    const winner = G_model_getPlayer(gameData.result, gameData);
    if (winner) {
      G_view_setInnerHTML(
        bannerMessage2,
        `The Victor is <span style="${view_getColorStyles(winner.color)}">${
          winner.name
        }</span>!`
      );
    } else {
      G_view_setInnerHTML(bannerMessage2, `The result is a DRAW!`);
    }
  } else if (!isWaiting && !G_model_isSimulating() && !isDead) {
    G_view_setInnerHTML(
      bannerMessage2,
      `<span style="color:${G_view_getColor(
        'light',
        player.color
      )}">[Right Click/Dbl Tap]</span> to set Target.<br /> <span style="color:${G_view_getColor(
        'light',
        player.color
      )}">[Left Click/Tap]</span> to pan.`
    );
  } else {
    G_view_setInnerHTML(bannerMessage2, '');
  }
};

const G_view_renderGameList = games => {
  const gamesList = G_view_getElementById('games');
  G_view_setInnerHTML(gamesList, '');
  for (let i = 0; i < games.length; i++) {
    const { id, name } = games[i];
    let ind = i + 1;
    gamesList[
      view_innerHTML
    ] += `<button style="background-color:#225;" onclick="events.join('${id}')">${ind}. Join Game: ${name}</button>`;
  }
};

const G_view_renderLobby = players => {
  const playersList = G_view_getElementById('players-lobby');
  G_view_setInnerHTML(playersList, '');
  for (let i = 0; i < players.length; i++) {
    const { id, userName } = players[i];
    let ind = i + 1;
    playersList[view_innerHTML] += `<div class="lobby-player">${ind}. ${
      id === G_model_getUserId()
        ? `<span class="lobby-name">${userName}</span>`
        : userName
    }</div>`;
  }

  const map = G_model_getMap();
  const isOwner = players[0].id === G_model_getUserId();
  const canStart = players.length > 1 && players.length <= map.maxPlayers;

  const select = G_view_getElementById('lobby-map-select');
  select[view_innerHTML] = G_model_getMaps().reduce((prev, curr, i) => {
    return prev + `<option value=${i}>${curr.name}</option>`;
  }, '');
  select.value = G_model_getMapIndex();
  select.style.display = isOwner ? view_block : view_none;
  G_view_setInnerHTML(
    G_view_getElementById('lobby-title'),
    G_model_getGameName()
  );
  const start = G_view_getElementById('start');
  start.style.display = isOwner ? view_block : view_none;
  start.disabled = canStart ? false : true;
};
