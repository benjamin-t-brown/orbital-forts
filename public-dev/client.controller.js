/*
global
G_SCALE
G_PanZoom
G_applyGravity
G_client_sendRequest
G_view_getElementById
G_view_getNowDt
G_view_getColor
G_view_getScreenDimensions
G_view_setScreenDimensions
G_view_worldToPx
G_view_pxToWorld
G_view_renderGameUI
G_view_renderLobby
G_view_renderGameList
G_view_renderSimulation
G_view_createResources
G_view_createExplosion
G_view_loop
G_view_createTextParticle
G_view_setInnerHTML
G_model_isGamePlaying
G_model_getGameData
G_model_getMe
G_model_getUserId
G_model_getMenuIds
G_model_getUserName
G_model_getSelectedAction
G_model_getSelectedSpeed
G_model_getTargetLocation
G_model_getPreviousMenu
G_model_getCurrentMenu
G_model_getColor
G_model_setGameData
G_model_setGameId
G_model_setGameName
G_model_setUserName
G_model_setGamePlaying
G_model_setSelectedSpeed
G_model_setColor
G_model_setTargetLocation
G_model_setWaitingForSimToStart
G_model_setSimulating
G_model_setGameOver
G_model_setLoading
G_model_setPreviousMenu
G_model_setCurrentMenu
*/

const G_controller_init = () => {
  let ms = G_view_getElementById('main').style;
  let cb = () => {
    const { innerHeight } = window;
    ms.height = innerHeight + 'px';
  };
  addEventListener('resize', cb);
  G_controller_setUserName(G_controller_getUserName());
  cb();
  G_PanZoom('#cc', [
    { minScale: 0.2, maxScale: 1, increment: 0.1, linear: true },
  ]);
};

const G_controller_startGame = gameData => {
  G_model_setGamePlaying(true);
  G_model_setGameData(gameData);
  G_controller_showMenu('game');
  const { players, width, height } = gameData;
  G_view_setScreenDimensions(width * 2 * G_SCALE, height * 2 * G_SCALE);
  const p = G_model_getMe(gameData);
  G_model_setSelectedSpeed('Normal');
  G_model_setColor(p.color);

  const playersDiv = G_view_getElementById('players');
  G_view_setInnerHTML(playersDiv, '');
  for (let i = 0; i < players.length; i++) {
    const { x, y, name, color } = players[i];
    const div = document.createElement('div');
    G_view_setInnerHTML(div, name);
    div.className = 'player-name';
    div.id = 'player-name-' + color;
    const { x: px, y: py } = G_view_worldToPx(x, y);
    div.style.left = px - 100 + 'px';
    div.style.top = py - 75 + 'px';
    div.style.color = G_view_getColor('light', color);
    playersDiv.appendChild(div);
  }

  G_model_setTargetLocation([p.x, p.y + 100]);
  G_controller_centerOnPlayer();

  G_model_setWaitingForSimToStart(false);
  G_model_setSimulating(false);
  G_model_setGameOver(false);

  G_view_getElementById('particles').innerHTML = '';
  G_controller_showMenu('game');
  G_view_renderGameUI(gameData);
  G_view_createResources(gameData.resources);
  G_view_renderSimulation(gameData);
};

const G_controller_stopGame = () => {
  G_controller_endSimulation(G_model_getGameData());
  G_controller_showMenu('menu');
  G_model_setGameId(null);
  G_model_setGameData(null);
  G_model_setGamePlaying(false);
};

const G_controller_beginSimulation = gameData => {
  G_model_setGameData(gameData);
  G_model_setWaitingForSimToStart(false);
  G_model_setSimulating(true);
  G_view_getElementById('particles').innerHTML = '';
  G_view_renderGameUI(gameData);
  G_view_renderSimulation(gameData);

  console.log('BEGIN SIMULATION');
  G_view_loop(() => {
    let currentGameData = G_model_getGameData();
    G_applyGravity(
      currentGameData.projectiles,
      currentGameData.planets,
      currentGameData.players.concat(currentGameData.resources),
      G_view_getNowDt()
    );
    G_view_renderSimulation(currentGameData);
  });
};

const G_controller_endSimulation = gameData => {
  G_view_loop(function() {});
  G_model_setSimulating(false);
  if (gameData) {
    G_model_setGameData(gameData);
    G_view_renderGameUI(gameData);
    for (let i = 0; i < gameData.projectiles.length; i++) {
      const projectile = gameData.projectiles[i];
      const { x, y, meta } = G_view_worldToPx(projectile.px, projectile.py);
      G_view_createExplosion(x, y, meta && meta.type === 'Move' ? 'mv' : 'sm');
    }
    gameData.projectiles = [];
    G_view_renderSimulation(gameData);
    const player = G_model_getMe(gameData);
    const { x, y } = G_view_worldToPx(player.x, player.y);
    if (!player.dead) {
      setTimeout(
        () =>
          G_view_createTextParticle(
            x,
            y - 30,
            '+$' + gameData.baseFundsPerRound,
            G_view_getColor('light', G_model_getColor())
          ),
        500
      );
    }
  }
};

const G_controller_setLoading = v => {
  G_model_setLoading(v);
  G_view_renderGameUI(G_model_getGameData());
};

const G_controller_centerOnPlayer = () => {
  const player = G_model_getMe(G_model_getGameData());
  const { width, height } = G_view_getScreenDimensions();
  const { x, y } = G_view_worldToPx(player.x, player.y);
  const style = G_view_getElementById('cc').style;
  style.transition = 'transform 0.5s';
  style.transform = `matrix(1, 0, 0, 1, ${-(x - width / 2)}, ${-(
    y -
    height / 2 -
    2
  )})`;
  setTimeout(() => {
    style.transition = '';
  }, 500);
};
const G_controller_getPlayer = id => {
  return G_model_getGameData().players.reduce((ret, pl) => {
    return pl.id === id ? pl : ret;
  }, null);
};

const G_controller_showMenu = (menuId, cb) => {
  G_model_setCurrentMenu(menuId);
  G_model_getMenuIds().forEach(id => {
    const elem = G_view_getElementById(id);
    let s = 'none';
    if (menuId === id) {
      s = 'flex';
      if (cb) {
        cb();
      }
    }
    elem.style.display = s;
  });
};

const G_controller_showDialog = text => {
  G_model_setPreviousMenu(G_model_getCurrentMenu());
  G_controller_showMenu('dialog');
  const elem = G_view_getElementById('dialog-text');
  elem.innerHTML = text;
};

const G_controller_finishGame = gameData => {
  if (G_model_getGameData() && gameData.result) {
    G_model_setGamePlaying(false);
    G_model_setGameOver(true);
    G_model_setGameData(gameData);
    G_view_renderGameUI(gameData);
    G_view_renderSimulation(gameData);
  }
};

const LOCAL_STORAGE_KEY = 'js13k2020_orbital_forts_u';
const G_controller_setUserName = userName => {
  G_view_getElementById('player-name-input').value = userName;
  G_model_setUserName(userName);
  localStorage.setItem(LOCAL_STORAGE_KEY, userName);
};
const G_controller_getUserName = () => {
  return (
    G_model_getUserName() || localStorage.getItem(LOCAL_STORAGE_KEY) || 'Player'
  );
};

const G_controller_showErrorMessage = msg => {
  G_controller_stopGame();
  G_view_renderGameList([]);
  G_controller_showMenu('menu');
  G_controller_showDialog(msg);
};

const G_controller_setTarget = ev => {
  let canvas = G_view_getElementById('c');
  if (ev.changedTouches) {
    const touch = ev.changedTouches[0];
    const transform = canvas.parentElement.style.transform;
    const { left, top } = canvas.getBoundingClientRect();
    const scale = parseFloat(transform.slice(7, transform.indexOf(',')));
    let { x, y } = G_view_pxToWorld(
      (touch.clientX - left) / scale,
      (touch.clientY - top) / scale
    );
    G_model_setTargetLocation([x, y]);
  } else {
    const { offsetX, offsetY } = ev;
    let { x, y } = G_view_pxToWorld(offsetX, offsetY);
    G_model_setTargetLocation([x, y]);
  }
  G_view_renderGameUI(G_model_getGameData());
  G_view_renderSimulation(G_model_getGameData());
};
