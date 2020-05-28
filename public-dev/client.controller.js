/*
global
G_SCALE
G_AU
G_FRAME_MS
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
G_model_setReplay
G_model_setReplayRoundIndex
G_model_setIsReplayingGame
G_model_setLobbyId
G_model_isReplayingGame
*/

let G_panZoomObj = {};
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
  G_controller_showMenu('game');
  G_model_setLobbyId(null);
  const { players, width, height } = gameData;
  G_view_setScreenDimensions(width * 2 * G_SCALE, height * 2 * G_SCALE);
  const p = G_model_getMe(gameData);
  G_model_setSelectedSpeed('Normal');
  G_model_setSelectedAction(G_action_shoot);
  G_model_setColor(p.color);

  const playersDiv = G_view_getElementById('players');
  G_view_setInnerHTML(playersDiv, '');
  for (let i = 0; i < players.length; i++) {
    const { x, y, name, color } = players[i];
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

  G_view_createResources(gameData.resources);
  G_view_loop(() => {
    G_view_renderStoppedSimulation(gameData);
  });
};

const G_controller_applyGameDataToUI = gameData => {
  const { resources } = gameData;

  // add resources that were mistakenly removed
  for (let i = 0; i < resources; i++) {
    const res = resources[i];
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
      const r = resources.find(r => r.id === resourceId);
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

const G_controller_beginSimulation = gameData => {
  G_model_setGameData(gameData);
  G_model_setWaitingForSimToStart(false);
  G_model_setSimulating(true);
  G_view_getElementById('particles').innerHTML = '';
  G_view_renderGameUI(gameData);
  G_view_renderSimulation(gameData);

  G_view_playSound('shootNorm');

  G_view_loop(() => {
    let currentGameData = G_model_getGameData();
    G_applyGravity(
      currentGameData.projectiles,
      currentGameData.planets,
      currentGameData.players.concat(currentGameData.resources),
      G_view_getNowDt()
    );
    G_view_renderSimulation(currentGameData);
    G_controller_handleCollisions(currentGameData);
    G_controller_updatePlayerPositions(currentGameData);
  });
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
  if (gameData) {
    G_model_setGameData(gameData);
    G_controller_applyGameDataToUI(gameData);
    const player = G_model_getMe(gameData);
    const amt = player.actions[G_model_getSelectedAction()];
    if (!amt) {
      G_model_setSelectedAction(G_action_shoot);
    }
    G_view_renderGameUI(gameData);
    for (let i = 0; i < gameData.projectiles.length; i++) {
      const projectile = gameData.projectiles[i];
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
        `All players granted $${fundsGained} at completion of the round.`
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

const G_controller_handleCollisions = gameData => {
  let collisions = gameData.collisions;
  let len = collisions.length;

  const removeResourceFromDOM = resourceId => {
    const parent = (G_view_getElementById('res-' + resourceId) || {})
      .parentElement;
    if (parent) {
      parent.remove();
      return true;
    } else {
      return false;
    }
  };

  if (len) {
    for (let i = 0; i < len; i++) {
      const [projectile, other] = collisions[i];
      const { x, y } = G_view_worldToPx(projectile.px, projectile.py);
      const player = G_model_getPlayer(projectile.meta.player, gameData);
      const textColor = G_view_getColor('light', player.color);

      switch (G_getEntityType(other)) {
        case G_entity.player: {
          // ignore collisions with self
          if (projectile.meta.player === other.id) {
            continue;
          }
          G_view_playSound('playerDead');
          const otherPlayer = G_model_getPlayer(other.id, gameData);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          otherPlayer.dead = true;
          G_view_createTextParticle(otherX, otherY, 'Eliminated!', textColor);
          G_view_createLargeExplosion(
            otherPlayer.x,
            otherPlayer.y,
            G_AU / 2,
            7
          );
          break;
        }
        case G_entity.projectile: {
          G_view_playSound('expl');
          G_view_createExplosion(x, y);
          break;
        }
        case G_entity.coin: {
          G_view_playSound('coin');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(
            otherX,
            otherY,
            '+$' + other.value,
            textColor
          );
          break;
        }
        case G_entity.spray: {
          G_view_playSound('getSpreadFire');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(otherX, otherY, '+2 SpreadFire', textColor);
          break;
        }
        case G_entity.planetCracker: {
          G_view_playSound('getPC');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(
            otherX,
            otherY,
            '+2 PlanetCracker',
            textColor
          );
          break;
        }
        case G_entity.cluster: {
          G_view_playSound('getCluster');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(
            otherX,
            otherY,
            '+2 ClusterBomb',
            textColor
          );
          break;
        }
        case G_entity.planet: {
          if (projectile.meta.type === G_action_planetCracker) {
            G_view_playSound('explLarge2');
            G_view_createLargeExplosion(other.px, other.py, G_AU, 30);
          } else if (projectile.meta.type === G_action_move) {
            G_view_playSound('playerDead2');
            player.dead = true;
            G_view_createTextParticle(x, y, 'Eliminated!', textColor);
            G_view_createLargeExplosion(player.x, player.y, G_AU / 2, 10);
          } else {
            G_view_playSound('expl');
            G_view_createExplosion(x, y);
          }
          break;
        }
        case G_entity.wormhole: {
          G_view_playSound('wormhole');
          const { x: prevX, y: prevY } = G_view_worldToPx(
            projectile.meta.prevX,
            projectile.meta.prevY
          );
          G_view_createWormholeParticle(x, y);
          G_view_createWormholeParticle(prevX, prevY);
          break;
        }
        case G_entity.nothing:
        default: {
          G_view_playSound('expl');
          G_view_createExplosion(x, y);
        }
      }
    }
  }
  gameData.collisions = [];
};

const G_controller_updatePlayerPositions = gameData => {
  const projectiles = gameData.projectiles;
  for (let i = 0; i < projectiles.length; i++) {
    const { meta, px: x, py: y } = projectiles[i];
    if (meta.player && meta.type === G_action_move) {
      const pl = G_model_getPlayer(meta.player, gameData);
      pl.x = x;
      pl.y = y;
    }
  }
};

const G_controller_setLoading = v => {
  G_model_setLoading(v);
  G_view_renderGameUI(G_model_getGameData());
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
    const winner = G_model_getPlayer(gameData.result, gameData);
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
  if (round.partialGameData) {
    G_model_setGameData({
      ...gameData,
      ...round.partialGameData,
    });
    gameData = G_model_getGameData();
  }
  G_model_setWaitingForSimToStart(false);
  G_model_setSimulating(true);
  G_view_getElementById('particles').innerHTML = '';
  G_view_renderReplayUI(replay, gameData);
  G_view_renderSimulation(gameData);
  G_model_setBroadcastHistory([gameData]);

  G_view_playSound('shootNorm');

  const me = G_model_getMe(gameData);
  if (me && round.actions[me.id]) {
    G_model_setTargetLocation(round.actions[me.id].target);
  }

  for (let i in round.actions) {
    const actionObject = round.actions[i];
    const player = G_model_getPlayer(i, gameData);
    G_applyAction(gameData, player, actionObject);
  }

  let nowDt;
  let now = +new Date();
  let startTime = +new Date();
  let frame = 0;
  let broadcastEvery = 10;
  let snapshotIndex = 0;

  controller_replay_intervalId = setInterval(() => {
    let currentGameData = G_model_getGameData();
    let n = +new Date();
    nowDt = n - now;
    now = n;

    G_simulate(currentGameData, {
      startTime,
      nowDt,
      now,
    });
    G_model_setGameData(currentGameData);

    let timeSinceStart = now - startTime;
    let snapshot;
    if (round.snapshots) {
      let gotNewSnapshot = false;
      snapshot = round.snapshots[snapshotIndex];
      let nextSnapshot = round.snapshots[snapshotIndex + 1];
      while (nextSnapshot && nextSnapshot.timestamp <= timeSinceStart) {
        snapshot = nextSnapshot;
        nextSnapshot = round.snapshots[snapshotIndex + 1];
        snapshotIndex = snapshotIndex + 1;
        gotNewSnapshot = true;
      }
      if (gotNewSnapshot) {
        currentGameData.projectiles = snapshot.snapshot.projectiles;
        currentGameData.collisions = snapshot.snapshot.collisions;
      }
    }
    let { collisions } = currentGameData;

    frame++;
    if (frame >= broadcastEvery || collisions.length) {
      frame = 0;

      const history = G_model_getBroadcastHistory();
      history.push(controller_copyGameData(currentGameData));
      if (history.length > 500) {
        history.shift();
      }
    }
  }, G_FRAME_MS);

  G_view_loop(() => {
    let currentGameData = G_model_getGameData();

    G_view_renderSimulation(currentGameData);
    G_controller_handleCollisions(currentGameData);
    G_controller_updatePlayerPositions(currentGameData);

    let { projectiles } = currentGameData;

    if (projectiles.length === 0) {
      console.log('no more projectiles');
      G_controller_replayStopSimulatingRound();
    }
  });
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
    }
    gameData.projectiles = [];

    const roundIndex = G_model_getReplayRoundIndex();
    const isGameOver = roundIndex + 1 > replay.rounds.length;
    if (isGameOver) {
      gameData.result = replay.result;
      G_controller_endReplay();
    } else {
      const round = replay.rounds[roundIndex];
      if (round.partialGameData) {
        const nextRoundGameData = {
          ...gameData,
          ...round.partialGameData,
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
