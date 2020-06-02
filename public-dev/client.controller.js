/*
global
G_SCALE
G_AU
G_FRAME_MS
G_GAME_TIME_BUFFER_MS
G_PanZoom
G_applyGravity
G_applyAction
G_simulate
G_action_shoot
G_action_move
G_action_planetCracker
G_res_coin
G_res_spray
G_res_planetCracker
G_entity
G_getEntityType
G_getEntityFromEntMap
G_getEntityByEntityIdAndType
G_client_sendRequest
G_controller_handleCollisions
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
G_view_renderStoppedSimulation
G_view_createResources
G_view_createExplosion
G_view_loop
G_view_createTextParticle
G_view_setInnerHTML
G_view_createLargeExplosion
G_view_createWormholeParticle
G_view_createResource
G_view_renderReplayUI
G_view_playSound
G_model_getLocalStorageKey
G_model_isGamePlaying
G_model_isResource
G_model_isPlayer
G_model_getGameData
G_model_getMe
G_model_getUserId
G_model_getMenuIds
G_model_getUserName
G_model_getPlayer
G_model_getSelectedAction
G_model_getSelectedSpeed
G_model_getTargetLocation
G_model_getPreviousMenu
G_model_getCurrentMenu
G_model_getColor
G_model_getBroadcastHistory
G_model_getRenderHistory
G_model_getReplay
G_model_getReplayRoundIndex
G_model_setGameData
G_model_setGameMetadata
G_model_setGameId
G_model_setGameName
G_model_setUserName
G_model_setSelectedAction
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
G_model_setBroadcastHistory
G_model_setRenderHistory
G_model_setReplay
G_model_setReplayRoundIndex
G_model_setIsReplayingGame
G_model_setLobbyId
G_model_isReplayingGame
*/

let G_panZoomObj = {};
let G_controller_collisionMap = {};
let controller_replay_intervalId = -1;
let controller_game_intervalId = -1;

const G_controller_init = () => {
  let ms = G_view_getElementById('main').style;
  let cb = () => {
    const { innerHeight } = window;
    ms.height = innerHeight + 'px';
  };
  addEventListener('resize', cb);
  G_controller_setUserName(G_controller_getUserName());
  cb();
  G_panZoomObj = G_PanZoom('cc', [
    { minScale: 0.2, maxScale: 1, increment: 0.1, linear: true },
  ]);
};

const G_controller_setupGame = gameData => {
  G_model_setGameData(gameData);
  G_model_setGameMetadata({});
  G_model_setBroadcastHistory([]);
  G_model_setRenderHistory([]);
  G_controller_showMenu('game');
  G_model_setLobbyId(null);
  const { players, width, height } = gameData;
  G_view_setScreenDimensions(width * 2 * G_SCALE, height * 2 * G_SCALE);
  const p = G_model_getMe(gameData);
  G_model_setSelectedSpeed('Normal');
  G_model_setSelectedAction(G_action_shoot);
  G_model_setColor(p.color);
  G_controller_collisionMap = {};

  const playersDiv = G_view_getElementById('players');
  G_view_setInnerHTML(playersDiv, '');
  for (let i = 0; i < players.length; i++) {
    const playerId = players[i];
    const player = G_getEntityFromEntMap(playerId, gameData);
    const { x, y, name, color } = player;
    const div = document.createElement('div');
    G_view_setInnerHTML(div, name);
    div.className = 'player-name';
    div.id = 'pl-' + color;
    const { x: px, y: py } = G_view_worldToPx(x, y);
    div.style.left = px - 100 + 'px';
    div.style.top = py - 75 + 'px';
    div.style.color = G_view_getColor('light', color);
    playersDiv.appendChild(div);
  }

  G_model_setWaitingForSimToStart(false);
  G_model_setSimulating(false);
  G_model_setGameOver(false);

  G_view_createResources(
    gameData.resources.map(id => G_getEntityFromEntMap(id, gameData))
  );
  G_view_loop(() => {
    G_view_renderStoppedSimulation(gameData);
  });
};

const G_controller_applyGameDataToUI = gameData => {
  const { resources } = gameData;

  // add resources that were mistakenly removed
  for (let i = 0; i < resources; i++) {
    const resourceId = resources[i];
    const res = G_getEntityFromEntMap(resourceId, gameData);
    const elem = G_view_getElementById('res-' + res.id);
    if (!elem) {
      G_view_createResource(res);
    }
  }

  // remove resources that were not correctly removed
  [...G_view_getElementById('res').children]
    .map(child => {
      const children = child.children;
      return {
        resourceId: children[children.length - 1].id.slice('res-'.length),
        child,
      };
    })
    .forEach(({ resourceId, child }) => {
      const r = resources.find(id => id === resourceId);
      if (!r) {
        child.remove();
      }
    });
};

const G_controller_startGame = gameData => {
  G_model_setGamePlaying(true);
  G_model_setIsReplayingGame(false);
  G_controller_setupGame(gameData);
  const p = G_model_getMe(gameData);
  G_view_getElementById('particles').innerHTML = '';
  G_model_setTargetLocation([p.x, p.y + 100]);
  G_controller_centerOnPlayer();
  G_view_renderGameUI(gameData);
};

const G_controller_stopGame = () => {
  G_controller_endSimulation(G_model_getGameData());
  G_controller_showMenu('menu');
  G_model_setGameId(null);
  G_model_setGameData(null);
  G_model_setGamePlaying(false);
};

const G_controller_beginSimulation = (gameData, cb) => {
  G_model_setGameData(gameData);
  G_model_setWaitingForSimToStart(false);
  G_model_setSimulating(true);
  G_view_getElementById('particles').innerHTML = '';
  G_view_renderSimulation(gameData);
  G_model_setRenderHistory([]);

  setTimeout(() => {
    G_view_playSound('shootNorm');
  }, G_GAME_TIME_BUFFER_MS);

  let now;
  let startTime = +new Date();
  let frame = 0;
  let broadcastIndex = 0;
  setTimeout(() => {
    G_view_loop(() => {
      now = +new Date();
      let timeSinceStart = now - G_GAME_TIME_BUFFER_MS - startTime;
      const broadcastHistory = G_model_getBroadcastHistory();

      if (broadcastHistory.length) {
        let gotNewUpdate = false;
        let broadcastObj = broadcastHistory[broadcastIndex];
        let nextBroadcastObj = broadcastHistory[broadcastIndex + 1];
        while (
          nextBroadcastObj &&
          nextBroadcastObj.timestamp <= timeSinceStart
        ) {
          broadcastObj = nextBroadcastObj;
          broadcastIndex = broadcastIndex + 1;
          nextBroadcastObj = broadcastHistory[broadcastIndex + 1];
          gotNewUpdate = true;
        }
        if (gotNewUpdate) {
          const newEntMap = gameData.entMap;
          for (let i in broadcastObj.dynamicGameData.partialEntMap) {
            newEntMap[i] = broadcastObj.dynamicGameData.partialEntMap[i];
          }
          G_model_setGameData({
            ...G_model_getGameData(),
            ...broadcastObj.dynamicGameData,
            entMap: newEntMap,
          });
          if (broadcastObj.last) {
            console.log(
              'got last update',
              controller_copyGameData(broadcastObj.dynamicGameData)
            );
            const currentGameData = G_model_getGameData();
            if (cb) {
              cb(currentGameData);
            } else {
              G_controller_endSimulation(currentGameData);
            }
            return;
          } else {
            console.log(
              'Got new update',
              controller_copyGameData(broadcastObj.dynamicGameData)
            );
          }
        }
      }

      let currentGameData = G_model_getGameData();
      // console.log('current game data', currentGameData);
      let { projectiles, planets, players, resources } = currentGameData;

      const projectileList = projectiles.map(id =>
        G_getEntityFromEntMap(id, currentGameData)
      );
      const bodyList = projectileList.concat(
        planets.map(id => G_getEntityFromEntMap(id, currentGameData))
      );
      const collidables = players
        .map(id => G_getEntityFromEntMap(id, currentGameData))
        .concat(
          resources.map(id => G_getEntityFromEntMap(id, currentGameData))
        );
      G_applyGravity(projectileList, bodyList, collidables, G_view_getNowDt());
      G_view_renderSimulation(currentGameData);
      G_controller_handleCollisions(currentGameData);
      G_controller_updatePlayerPositions(currentGameData, timeSinceStart);

      frame++;
      if (frame % 10 === 0) {
        G_controller_saveHistory(currentGameData);
      }
    });
  }, G_GAME_TIME_BUFFER_MS);
};

const G_controller_endSimulation = gameData => {
  clearInterval(controller_game_intervalId);
  G_view_loop(() => {
    const gameData = G_model_getGameData();
    G_view_renderStoppedSimulation(gameData);
  });
  G_model_setSimulating(false);
  G_model_setSelectedSpeed('Normal');
  G_model_setSelectedAction(G_action_shoot);
  G_model_setBroadcastHistory([]);
  if (gameData) {
    G_model_setGameData(gameData);
    G_controller_handleCollisions(gameData);
    G_controller_applyGameDataToUI(gameData);
    const player = G_model_getMe(gameData);
    const amt = player.actions[G_model_getSelectedAction()];
    if (!amt) {
      G_model_setSelectedAction(G_action_shoot);
    }
    G_view_renderGameUI(gameData);
    for (let i = 0; i < gameData.projectiles.length; i++) {
      const projectileId = gameData.projectiles[i];
      const projectile = G_getEntityFromEntMap(projectileId, gameData);
      const { x, y, meta } = G_view_worldToPx(projectile.px, projectile.py);
      G_view_createExplosion(x, y, meta && meta.type === 'Move' ? 'mv' : 'sm');
      G_view_playSound('expl');
    }
    gameData.projectiles = [];
    G_view_renderSimulation(gameData);
    G_controller_handleCollisions(gameData);
    const { x, y } = G_view_worldToPx(player.x, player.y);
    if (!player.dead) {
      const fundsGained = gameData.baseFundsPerRound;
      G_view_setInnerHTML(
        G_view_getElementById('banner-message3'),
        `All players granted $${fundsGained}.`
      );
      setTimeout(() => {
        G_view_createTextParticle(
          x,
          y - 30,
          '+$' + fundsGained,
          G_view_getColor('light', G_model_getColor())
        );
      }, 500);
      setTimeout(() => {
        G_view_setInnerHTML(G_view_getElementById('banner-message3'), '');
      }, 3000);
    }
  }
};

const G_controller_updatePlayerPositions = (gameData, timeSinceStart) => {
  const projectiles = gameData.projectiles;
  for (let i = 0; i < projectiles.length; i++) {
    const projectileId = projectiles[i];
    const projectile = G_getEntityFromEntMap(projectileId, gameData);
    const { meta, px: x, py: y } = projectile;
    if (
      meta.player &&
      meta.type === G_action_move &&
      timeSinceStart <= projectile.t
    ) {
      const pl = G_model_getPlayer(meta.player, gameData);
      pl.x = x;
      pl.y = y;
    }
  }
};

const G_controller_setLoading = v => {
  G_model_setLoading(v);
};

let transitionTimeoutId = -1;
const G_controller_centerOnPlayer = () => {
  const player = G_model_getMe(G_model_getGameData());
  const { x, y } = G_view_worldToPx(player.x, player.y);
  const style = G_view_getElementById('cc').style;
  style.transition = 'transform 0.5s';
  G_panZoomObj.translateZoom({ x, y, scale: 0.65 });
  clearTimeout(transitionTimeoutId);
  transitionTimeoutId = setTimeout(() => {
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
    const winner = G_getEntityFromEntMap(gameData.result, gameData);
    if (winner) {
      if (winner === G_model_getMe(gameData)) {
        G_view_playSound('win');
      } else {
        G_view_playSound('lose');
      }
    } else {
      G_view_playSound('tie');
    }

    G_model_setGamePlaying(false);
    G_model_setGameOver(true);
    G_model_setGameData(gameData);
    G_view_renderGameUI(gameData);
    G_view_renderSimulation(gameData);
  }
};

const G_controller_setUserName = userName => {
  G_view_getElementById('player-name-input').value = userName;
  G_model_setUserName(userName);
  localStorage.setItem(G_model_getLocalStorageKey() + '_u', userName);
};
const G_controller_getUserName = () => {
  return (
    G_model_getUserName() ||
    localStorage.getItem(G_model_getLocalStorageKey() + '_u') ||
    'Player'
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
  if (G_model_isReplayingGame()) {
    G_view_renderReplayUI(G_model_getGameData());
    G_view_renderSimulation(G_model_getGameData());
  } else {
    G_view_renderGameUI(G_model_getGameData());
    G_view_renderSimulation(G_model_getGameData());
  }
};

const G_controller_startReplay = replay => {
  if (!replay) {
    throw new Error('no replay provided to start');
  }
  console.log('start replay', replay);
  const { initialGameData } = replay;
  G_model_setIsReplayingGame(true);
  G_model_setGameOver(false);
  G_model_setReplayRoundIndex(0);
  G_model_setReplay(replay);
  G_view_renderReplayUI(replay, initialGameData);
  G_controller_setupGame(initialGameData);
  const p = G_model_getMe(initialGameData);
  G_model_setTargetLocation([p.x, p.y + 100]);
  G_controller_centerOnPlayer();
};

const G_controller_endReplay = () => {
  const replay = G_model_getReplay();
  const gameData = G_model_getGameData();
  if (replay && gameData) {
    G_model_setGameOver(true);
    G_view_renderReplayUI(replay, gameData);
  }
};

const G_controller_replayStartSimulatingRound = (round, replay) => {
  console.log('Simulate round', round);
  let gameData = G_model_getGameData();
  if (round.dynamicGameData) {
    G_model_setGameData({
      ...gameData,
      ...round.dynamicGameData,
    });
    gameData = G_model_getGameData();
  }
  G_model_setWaitingForSimToStart(false);
  G_model_setSimulating(true);
  G_view_getElementById('particles').innerHTML = '';
  G_view_renderReplayUI(replay, gameData);
  G_view_renderSimulation(gameData);
  G_model_setBroadcastHistory([gameData]);

  setTimeout(() => {
    G_view_playSound('shootNorm');
  }, G_GAME_TIME_BUFFER_MS);

  const me = G_model_getMe(gameData);
  if (me && round.actions[me.id]) {
    G_model_setTargetLocation(round.actions[me.id].target);
  }

  for (let i in round.actions) {
    const actionObject = round.actions[i];
    const player = G_model_getPlayer(i, gameData);
    G_applyAction(gameData, player, actionObject);
  }

  G_model_setBroadcastHistory(
    round.snapshots.map((obj, i) => {
      return {
        timestamp: obj.timestamp,
        dynamicGameData: obj.dynamicGameData,
        last: i === round.snapshots.length - 1,
      };
    })
  );

  G_controller_beginSimulation(
    gameData,
    G_controller_replayStopSimulatingRound
  );
};

const G_controller_replayStopSimulatingRound = () => {
  const replay = G_model_getReplay();
  const gameData = G_model_getGameData();
  clearInterval(controller_replay_intervalId);
  G_view_loop(() => {
    const gameData = G_model_getGameData();
    G_view_renderStoppedSimulation(gameData);
  });
  G_model_setSimulating(false);
  if (gameData) {
    G_view_renderReplayUI(replay, gameData);
    for (let i = 0; i < gameData.projectiles.length; i++) {
      const projectile = gameData.projectiles[i];
      const { x, y, meta } = G_view_worldToPx(projectile.px, projectile.py);
      G_view_createExplosion(x, y, meta && meta.type === 'Move' ? 'mv' : 'sm');
      G_view_playSound('expl');
    }
    gameData.projectiles = [];
    G_view_renderSimulation(gameData);
    G_controller_handleCollisions(gameData);

    const roundIndex = G_model_getReplayRoundIndex();
    const isGameOver = roundIndex + 1 > replay.rounds.length;
    if (isGameOver) {
      gameData.result = replay.result;
      G_controller_endReplay();
    } else {
      const round = replay.rounds[roundIndex];
      if (round.dynamicGameData) {
        const nextRoundGameData = {
          ...gameData,
          ...round.dynamicGameData,
        };
        G_model_setGameData(nextRoundGameData);
        G_controller_applyGameDataToUI(nextRoundGameData);
      }
    }
  }
};

const G_controller_replayNextRound = () => {
  if (!G_model_isReplayingGame()) {
    return;
  }
  const replay = G_model_getReplay();
  const roundIndex = G_model_getReplayRoundIndex();
  const round = replay.rounds[roundIndex];
  if (round) {
    G_controller_replayStartSimulatingRound(round, replay);
    G_model_setReplayRoundIndex(roundIndex + 1);
  } else {
    console.log('no round', roundIndex, replay);
  }
};

const G_controller_replayPreviousRound = () => {
  if (!G_model_isReplayingGame()) {
    return;
  }
};

const controller_copyGameData = gameData => {
  return JSON.parse(JSON.stringify(gameData));
};

const G_controller_saveHistory = gameData => {
  const history = G_model_getRenderHistory();
  history.push(controller_copyGameData(gameData));
  if (history.length > 500) {
    history.shift();
  }
};
