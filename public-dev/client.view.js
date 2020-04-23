/*
global
G_SCALE
G_AU
G_SPEEDS
G_actions
G_getActionCost
G_getRandomLocInCircle
G_getSpeedCost
G_model_isResource
G_model_isPlayer
G_model_isSimulating
G_model_isGameOver
G_model_isLoading
G_model_isWaitSelected
G_model_isWaitingForSimToStart
G_model_isSelectingTarget
G_model_getMe
G_model_getPlayer
G_model_getGameName
G_model_getColor
G_model_getUserId
G_model_getTargetLocation
G_model_getSelectedAction
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

let PI = Math.PI;

const view_getCtx = () => {
  return G_view_getElementById('c').getContext('2d');
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
  let hyp = Math.sqrt(lenX * lenX + lenY * lenY);
  let ret = 0;
  if (y >= myY && x >= myX) {
    ret = (Math.asin(lenY / hyp) * 180) / PI + 90;
  } else if (y >= myY && x < myX) {
    ret = (Math.asin(lenY / -hyp) * 180) / PI - 90;
  } else if (y < myY && x > myX) {
    ret = (Math.asin(lenY / hyp) * 180) / PI + 90;
  } else {
    ret = (Math.asin(-lenY / hyp) * 180) / PI - 90;
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
        // pink: 'orchid',
        // cyan: 'darkcyan',
        // purple: 'indigo',
        // orange: 'darkorange',
      },
      light: {
        blue: 'lightblue',
        red: '#F08080',
        green: 'lightgreen',
        yellow: '#B8860B',
        // pink: '#C71585',
        // cyan: 'darkcyan',
        // purple: '#9370DB',
        // orange: 'bisque',
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
  // G_view_drawAreas(
  //   gameData.playerLocations.concat(
  //     gameData.resourceLocations.concat(gameData.planetLocations)
  //   )
  // );

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
      G_view_createExplosion(
        x,
        y,
        projectile.meta.type === 'Move' ? 'mv' : undefined
      );
      let ind = gameData.projectiles.indexOf(projectile);
      if (ind > -1) {
        gameData.projectiles.splice(ind, 1);
      }
      if (G_model_isResource(other)) {
        const player = G_model_getPlayer(projectile.meta.player, gameData);
        G_view_getElementById('res-' + other.id).remove();
        const { x, y } = G_view_worldToPx(other.x, other.y);
        G_view_createTextParticle(
          x,
          y,
          '+$' + other.value,
          G_view_getColor('light', player.color)
        );
      }
      if (other && G_model_isPlayer(other, gameData)) {
        const pl = G_model_getPlayer(other.id, gameData);
        pl.dead = true;
        for (let i = 0; i < 15; i++) {
          const { x, y } = G_getRandomLocInCircle(other.x, other.y, G_AU / 2);
          const { x: px, y: py } = G_view_worldToPx(x, y);
          setTimeout(() => {
            G_view_createExplosion(px, py);
          }, (i / 12) * 2000);
        }
      }
    }
  }
  gameData.collisions = [];
};

const G_view_createResources = res => {
  const elem = G_view_getElementById('res');
  elem[view_innerHTML] = '';
  for (let i = 0; i < res.length; i++) {
    const { x, y, id } = res[i];
    const { x: px, y: py } = G_view_worldToPx(x, y);
    const style = {
      position: 'absolute',
      left: px - 25 + 'px',
      top: py - 25 + 'px',
    };
    const div = document.createElement('div');
    div.className = 'coin';
    div[view_innerHTML] = '$';
    div.id = 'res-' + id;
    for (let i in style) {
      div.style[i] = style[i];
    }
    elem.appendChild(div);
  }
};

const G_view_createExplosion = (x, y, type) => {
  const id = x + ',' + y;
  if (G_view_getElementById(id)) {
    return;
  }
  const div = document.createElement('div');
  div.id = id;
  const style = {
    position: 'absolute',
    left: x - 50 + 'px',
    top: y - 50 + 'px',
  };
  for (let i in style) {
    div.style[i] = style[i];
  }
  div.className = 'expl' + (type ? ` expl-${type}` : '');
  div[view_innerHTML] = `<div class="expl2 ${type ? ` expl2-${type}` : ''}" />`;
  G_view_getElementById('particles').appendChild(div);
};

const G_view_createTextParticle = (x, y, text, color) => {
  const id = 'text,' + x + ',' + y;
  if (G_view_getElementById(id)) {
    return;
  }
  const div = document.createElement('div');
  div.id = id;
  const style = {
    position: 'absolute',
    left: x - 200 / 2 + 'px',
    top: y + 'px',
    color,
  };
  for (let i in style) {
    div.style[i] = style[i];
  }
  div.className = 'text-particle';
  div[view_innerHTML] = text;
  G_view_getElementById('particles').appendChild(div);
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

    const div = G_view_getElementById('player-name-' + color);
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
    if (typeof meta === 'object') {
      const pl = G_model_getPlayer(meta.player, gameData);
      if (meta.player && meta.type === 'Move') {
        pl.x = x;
        pl.y = y;
        continue;
      }
    }
    view_drawCircle(
      px,
      py,
      r * G_SCALE,
      typeof meta === 'object'
        ? G_model_getPlayer(meta.player, gameData).color
        : color
    );
  }
};

// const G_view_drawAreas = areas => {
//   for (let i = 0; i < areas.length; i++) {
//     const { x, y, r, posR } = areas[i];
//     const { x: px, y: py } = G_view_worldToPx(x, y);
//     view_drawCircle(px, py, (posR || r) * G_SCALE, 'rgba(1, 1, 1, 0.1)');
//   }
// };

const G_view_renderGameUI = gameData => {
  if (!gameData) {
    return;
  }

  const player = G_model_getMe(gameData);
  const isLoading = G_model_isLoading();
  const isGameOver = G_model_isGameOver();
  const isDead = player.dead;

  // visibility
  G_view_getElementById('controls').style.display =
    G_model_isSimulating() || isGameOver || isDead ? 'none' : 'flex';

  G_view_getElementById('leave-game').style.display =
    isGameOver || isDead ? 'block' : 'none';

  // control buttons
  let htmlActions = '';
  G_actions.forEach(([id, cost]) => {
    let selected = id === G_model_getSelectedAction();
    let style = selected ? `${view_getColorStyles(G_model_getColor())}` : '';
    htmlActions += `<div class="action-label" style="pointer-events:${
      isLoading ? 'none' : 'all'
    }">
<div>Cost +$${cost}</div>
<div class="action" style="${style}" id="${id}" onclick="events.setAction('${id}')">${id}
</div>
</div>`;
  });
  G_view_getElementById('control-buttons')[view_innerHTML] = htmlActions;
  let htmlSpeeds = '';
  Object.keys(G_SPEEDS).forEach(speedName => {
    let [, cost] = G_SPEEDS[speedName];
    let selected = speedName === G_model_getSelectedSpeed();
    let disabled = G_model_isWaitSelected();
    let style = disabled
      ? 'color: grey'
      : selected
      ? view_getColorStyles(G_model_getColor())
      : '';
    htmlSpeeds += `<div class="action-label" style="pointer-events:${
      isLoading ? 'none' : 'all'
    }">
<div>Cost +$${cost}</div>
<div class="action" style="${style}" id="${speedName}" onclick="events.setSpeed('${speedName}')">${speedName}
</div>
</div>`;
  });
  let selectedActionCost =
    G_getActionCost(G_model_getSelectedAction()) +
    (G_model_isWaitSelected() ? 0 : G_getSpeedCost(G_model_getSelectedSpeed()));
  G_view_getElementById('speed-buttons')[view_innerHTML] = htmlSpeeds;
  G_view_getElementById('set-target').disabled =
    isLoading ||
    G_model_isWaitingForSimToStart() ||
    G_model_isSelectingTarget();
  G_view_getElementById('confirm').disabled =
    isLoading ||
    G_model_isWaitingForSimToStart() ||
    selectedActionCost > player.funds;
  let cost = G_view_getElementById('cost');
  G_view_getElementById('funds')[view_innerHTML] =
    'Funds: $' +
    player.funds +
    (G_model_isWaitingForSimToStart()
      ? `<span style="color:pink"> - $${selectedActionCost}</span>`
      : '');
  cost[view_innerHTML] = 'Current Cost: $' + selectedActionCost;
  cost.style.color = selectedActionCost > player.funds ? 'red' : 'white';

  // target
  let target = G_view_getElementById('target');
  const loc = G_model_getTargetLocation();
  const { x, y } = G_view_worldToPx(loc[0], loc[1]);

  target.style.display =
    G_model_isWaitSelected() || G_model_isSimulating() || isGameOver || isDead
      ? 'none'
      : 'flex';
  target.style.left = x - 30 + 'px';
  target.style.top = y - 30 + 'px';
  target.style.stroke = G_view_getColor('', G_model_getColor());
  target.className = 'target';
  const X = G_view_getElementById('x').cloneNode(true);
  X.id = 'x2';
  X.style.display = 'block';
  target[view_innerHTML] = '';
  target.appendChild(X);
  if (G_model_getSelectedAction() === 'Move') {
    target.className = 'target-m';
  }

  // banner
  const bannerMessage = G_view_getElementById('banner-message');
  const bannerMessage2 = G_view_getElementById('banner-message2');
  if (G_model_isWaitingForSimToStart()) {
    bannerMessage[view_innerHTML] = 'Waiting for other players...';
  } else if (isGameOver) {
    bannerMessage[view_innerHTML] = 'The Game is Over!';
  } else if (isDead) {
    bannerMessage[view_innerHTML] = 'You have been destroyed!';
  } else {
    bannerMessage[
      view_innerHTML
    ] = `You are the <span style="${view_getColorStyles(
      player.color
    )}border:1px solid;padding:2px;">${player.color}</span> player.`;
  }
  if (G_model_isSelectingTarget()) {
    bannerMessage2[view_innerHTML] = 'Select location to place target.';
  } else if (isGameOver) {
    const winner = G_model_getPlayer(gameData.result, gameData);
    if (winner) {
      bannerMessage2[
        view_innerHTML
      ] = `The Victor is <span style="${view_getColorStyles(winner.color)}">${
        winner.name
      }</span>!`;
    } else {
      bannerMessage2[view_innerHTML] = `The result is a DRAW!`;
    }
  } else {
    bannerMessage2[view_innerHTML] = '';
  }
};

const G_view_renderGameList = games => {
  const gamesList = G_view_getElementById('games');
  gamesList[view_innerHTML] = '';
  for (let i = 0; i < games.length; i++) {
    const { id, name } = games[i];
    let ind = i + 1;
    gamesList[
      view_innerHTML
    ] += `<button style="background-color:#225;box-shadow:none" onclick="events.join('${id}')">${ind}. Join Game: ${name}</button>`;
  }
};

const G_view_renderLobby = players => {
  const playersList = G_view_getElementById('players-lobby');
  playersList[view_innerHTML] = '';
  for (let i = 0; i < players.length; i++) {
    const { id, userName } = players[i];
    let ind = i + 1;
    playersList[view_innerHTML] += `<div class="player">${ind}. ${
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
  select.style.display = isOwner ? 'block' : 'none';
  G_view_getElementById('lobby-title')[view_innerHTML] = G_model_getGameName();
  const start = G_view_getElementById('start');
  start.style.display = isOwner ? 'block' : 'none';
  start.disabled = canStart ? false : true;
};
