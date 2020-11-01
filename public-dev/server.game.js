/*
global
G_getMaps
G_getNumMaps
G_createEntities
G_SCALE
G_AU
G_SPEEDS
G_FRAME_MS
G_Body
G_MODES
G_applyGravity
G_applyAction
G_actions
G_simulate
G_getActionCost
G_getSpeedCost
G_getRandomLocInCircle
G_getNormalizedVec
G_createProjectiles
G_getEntityFromEntMap
G_socket_sendUpdateGameList
G_socket_createMessageSocket
G_socket_randomId
G_S_START
G_S_STOP
G_S_BROADCAST
G_S_LOBBY_DATA
G_S_GAME_METADATA
G_S_START_SIMULATION
G_S_STOP_SIMULATION
G_S_FINISHED
G_user_unsetGame
G_user_getId
G_user_getName
G_res_coin
G_res_spray
G_res_planetCracker
G_action_move
G_action_shoot
G_action_spread
G_action_planetCracker
G_replay_createReplay
G_replay_saveReplay
G_replay_addRound
G_replay_addConfirmActionForPlayer
G_replay_addSnapshotToRound
G_replay_addGameDataToRound
G_replay_createDynamicGameData
G_replay_copyGameData
*/

const G_Game = (owner, name) => {
  let users = [owner];
  let now;
  let nowDt;
  let startTime = 0;
  let timeSinceStart = 0;
  let started = false;
  let isPractice = false;
  let intervalId;
  let timeoutId;
  let gameData = null;
  let broadcastCtr = 0;
  let broadcastEvery = Math.round(50 / G_FRAME_MS); // broadcast every this number of frames, where each frame lasts for G_FRAME_MS milliseconds
  let saveReplayEvery = Math.round(50 / G_FRAME_MS);
  let frame = 0;
  let frameReplay = 0;
  let FORT_SIZE = 25 / G_SCALE;
  let initialFunds = 175;
  // let initialFunds = 1075;
  let baseFundsPerRound = 10;
  let mapIndex = 0;
  // let roundNumber = 0;
  // let itemRespawnRate = 15;
  let replay = null;
  let map = null;
  const colors = [
    'blue',
    'red',
    'green',
    'yellow',
    // 'pink',
    // 'cyan',
    // 'purple',
    // 'orange',
  ];

  const createGameData = (users, selectedMap) => {
    let usersR = randomOrder(users);
    map = selectedMap;
    const { width, height, playerLocations } = map;
    const gameObj = {
      name,
      mode: G_MODES.standard,
      mapName: map.name,
      width,
      height,
      mapIndex,
      entMap: {},
      collisions: [],
      players: [],
      planets: [],
      resources: [],
      projectiles: [],
      fields: [],
      shockwaves: [],
      result: false,
      baseFundsPerRound,
      maxRoundLength: 10000,
    };

    for (let i = 0; i < usersR.length; i++) {
      const user = usersR[i];
      const { x, y, r } = playerLocations[i];
      const loc = G_getRandomLocInCircle(x, y, r);
      let actions = {};
      if (gameObj.mode === G_MODES.standard) {
        for (let j in G_actions) {
          actions[G_actions[j][0]] = j <= 1 ? 99 : 0;
        }
      }
      const player = {
        id: G_user_getId(user),
        name: G_user_getName(user),
        funds: initialFunds,
        actions,
        ready: false,
        dead: false,
        hp: 1,
        color: colors[i],
        r: FORT_SIZE,
        ...loc,
        target: [loc.x, loc.y],
      };
      gameObj.entMap[player.id] = player;
      gameObj.players.push(player.id);
    }
    G_createEntities(gameObj, map, {});

    return gameObj;
  };

  const broadcast = (i, gameData) => {
    const dynamicGameData = G_replay_createDynamicGameData(gameData);
    dynamicGameData.i = i;
    game.emitAll(
      G_S_BROADCAST,
      G_socket_createMessageSocket({
        i,
        timestamp: timeSinceStart,
        dynamicGameData,
      })
    );
  };
  const simulate = () => {
    try {
      let n = +new Date();
      nowDt = n - now;
      now = n;
      timeSinceStart = now - startTime;
      gameData.tss = timeSinceStart;

      G_simulate(gameData, {
        startTime,
        nowDt,
        now,
        timeSinceStart: timeSinceStart,
      });

      let { projectiles, shockwaves } = gameData;

      if (projectiles.length === 0 && shockwaves.length === 0) {
        console.log('no more projectiles or shockwaves');
        stopSimulation();
        return;
      }

      frame++;
      if (frame >= broadcastEvery) {
        broadcast(broadcastCtr++, gameData);
        frame = 0;
      }
      frameReplay++;
      if (frameReplay >= saveReplayEvery) {
        frameReplay = 0;
        G_replay_addSnapshotToRound(replay, now - startTime, gameData);
      }
    } catch (e) {
      console.error('error running simulation', e);
      stopSimulation();
    }
  };

  const startSimulation = () => {
    console.log('Start Simulation', broadcastEvery);
    startTime = now = +new Date();
    nowDt = 0;
    broadcastCtr = 0;
    game.emitAll(
      G_S_START_SIMULATION,
      G_socket_createMessageSocket(G_replay_copyGameData(gameData))
    );
    timeoutId = setTimeout(stopSimulation, 20000);
    intervalId = setInterval(simulate, G_FRAME_MS);
  };
  const stopSimulation = () => {
    console.log('Stop Simulation');
    try {
      if (started) {
        const dynamicGameData = G_replay_createDynamicGameData(gameData);
        game.emitAll(
          G_S_STOP_SIMULATION,
          G_socket_createMessageSocket({
            i: -1,
            timestamp: now - startTime,
            dynamicGameData,
          })
        );
        G_replay_addSnapshotToRound(replay, now - startTime, gameData);

        clearInterval(intervalId);
        intervalId = -1;
        clearTimeout(timeoutId);
        timeoutId = -1;
        gameData.projectiles.forEach(projectileId => {
          delete gameData.entMap[projectileId];
        });
        gameData.shockwaves.forEach(shockwaveId => {
          delete gameData.entMap[shockwaveId];
        });
        gameData.shockwaves = [];
        gameData.projectiles = [];
        gameData.collisions = [];

        const result = isGameOver();
        if (result) {
          game.finished = true;
          game.finish(result);
        } else {
          gameData.players.forEach(playerId => {
            const p = G_getEntityFromEntMap(playerId, gameData);
            p.ready = false;
            p.funds += baseFundsPerRound;
          });
          updateGameMetadata();
          G_replay_addRound(replay, gameData);
          // roundNumber++;
        }
      }
    } catch (e) {
      console.error('Error stopping game', e.stack);
    }
  };
  const randomOrder = arr => {
    let len = arr.length;
    arr = [...arr];
    const ret = [];
    for (let i = 0; i < len; i++) {
      const ind = Math.floor(Math.random() * arr.length);
      ret.push(arr[ind]);
      arr.splice(ind, 1);
    }
    return ret;
  };

  const areAllPlayersReady = () =>
    gameData.players.reduce((prev, curr) => {
      const player = G_getEntityFromEntMap(curr, gameData);
      return prev && (player.dead ? true : player.ready);
    }, true);

  const isGameOver = () => {
    if (isPractice) {
      return false;
    }

    let players = [];
    for (let i = 0; i < gameData.players.length; i++) {
      const pl = G_getEntityFromEntMap(gameData.players[i], gameData);
      if (!pl.dead) {
        players.push(pl);
      }
    }
    if (players.length === 0) {
      return 'draw';
    }
    if (players.length === 1) {
      return players[0].id;
    }
    return false;
  };

  const checkActionCost = (action, speed, playerId) => {
    const cost = G_getActionCost(action) + G_getSpeedCost(speed);
    const player = G_getEntityFromEntMap(playerId, gameData);
    return player.funds > cost ? cost : false;
  };

  const updateLobbyData = () => {
    game.emitAll(
      G_S_LOBBY_DATA,
      G_socket_createMessageSocket(game.getLobbyData())
    );
  };

  const updateGameMetadata = () => {
    game.emitAll(
      G_S_GAME_METADATA,
      G_socket_createMessageSocket(game.getGameMetadata())
    );
  };

  const game = {
    id: G_user_getId(owner),
    name,

    getPlayers() {
      return users.map(user => ({
        id: G_user_getId(user),
        userName: G_user_getName(user),
      }));
    },
    getLobbyData: () => {
      return {
        mapIndex,
        ownerId: G_user_getId(owner),
        players: game.getPlayers(),
      };
    },
    getGameMetadata: () => {
      const playersNotReady = gameData.players
        .map(playerId => G_getEntityFromEntMap(playerId, gameData))
        .filter(player => {
          return player.dead ? false : !player.ready;
        })
        .map(player => {
          return { playerName: player.name, color: player.color };
        });

      return {
        playersNotReady,
        timer: 30,
      };
    },
    updateLobbyData,
    updateGameMetadata,

    async join(user) {
      if (started || isPractice) {
        console.error('Cannot join');
        return false;
      }

      if (users.length < 4) {
        users.push(user);
        updateLobbyData();
        return true;
      } else {
        return false;
      }
    },
    leave(user) {
      for (let i = 0; i < users.length; i++) {
        const user2 = users[i];
        if (user2 === user) {
          users.splice(i, 1);
          G_user_unsetGame(user2);

          if (started) {
            const pl = G_getEntityFromEntMap(G_user_getId(user2), gameData);
            if (users.length === 0) {
              game.stop();
            } else if (!pl.dead) {
              pl.dead = true;
            }
            if (isGameOver()) {
              game.stop();
            } else if (areAllPlayersReady()) {
              console.log('Starting after a moment...');
              setTimeout(() => {
                try {
                  startSimulation();
                } catch (e) {
                  console.error('Error starting', e.stack);
                }
              }, 500);
            }
            return true;
          }

          // is owner
          if (i === 0) {
            game.stop();
          } else {
            updateLobbyData();
          }
          return true;
        }
      }
      return false;
    },
    async start() {
      console.log('Start game');
      started = true;
      const maps = await G_getMaps();
      gameData = createGameData(users, maps[mapIndex]);
      gameData.isPractice = isPractice;
      replay = G_replay_createReplay(gameData);
      G_replay_addRound(replay, gameData);

      game.emitAll(
        G_S_START,
        G_socket_createMessageSocket({
          startTime,
          gameData: G_replay_copyGameData(gameData),
        })
      );

      updateGameMetadata();
    },
    stop() {
      console.log('Stop game');
      stopSimulation();
      game.emitAll(
        G_S_STOP,
        G_socket_createMessageSocket('The game was stopped.')
      );
      users.forEach(user => {
        G_user_unsetGame(user);
      });
      G_socket_sendUpdateGameList();
    },
    finish(result) {
      console.log('Finish game', result);
      gameData.result = result;
      replay.result = result;
      game.emitAll(
        G_S_FINISHED,
        G_socket_createMessageSocket({
          gameData,
          replay,
        })
      );
      users.forEach(user => {
        G_user_unsetGame(user);
      });
      G_socket_sendUpdateGameList();
      if (!isPractice) {
        G_replay_saveReplay(replay);
      }
    },
    setPractice() {
      isPractice = true;
      initialFunds = 100000;
    },
    async setMapIndex(i) {
      const numMaps = await G_getNumMaps();
      if (i >= 0 && i < numMaps) {
        mapIndex = i;
      }
    },
    confirmAction(action, args, user) {
      const player = G_getEntityFromEntMap(G_user_getId(user), gameData);
      if (!player || player.dead) {
        console.error(
          'No player exists in game or player is dead.',
          G_user_getId(user)
        );
        return false;
      }
      if (player.ready) {
        console.error(
          'Player has already confirmed an action.',
          G_user_getId(user)
        );
        return false;
      }
      const [targetX, targetY, speed, auxArgsJson] = args.split(',');
      const normalizedVec = G_getNormalizedVec([
        targetX - player.x,
        targetY - player.y,
      ]);

      const speedNumber =
        (G_SPEEDS[speed] && G_SPEEDS[speed][0]) || G_SPEEDS.normal[0];
      const cost = checkActionCost(action, speed, G_user_getId(user));
      if (cost === false) {
        console.warn('Action costs too much.', action, speed);
        return false;
      }

      let auxArgs = null;
      try {
        auxArgs = JSON.parse(auxArgsJson);
      } catch (e) {
        console.warn('Could not parse aux args', action, speed);
        return false;
      }

      const actionObj = {
        action,
        speed: speedNumber,
        vec: normalizedVec,
        target: [targetX, targetY],
        auxArgs,
        cost,
      };
      G_replay_addConfirmActionForPlayer(replay, player, actionObj);
      gameData.tss = 0; // without this, tStart is undefined
      G_applyAction(gameData, player, actionObj);
      player.ready = true;
      if (areAllPlayersReady()) {
        console.log('Starting after a moment...');
        setTimeout(() => {
          try {
            startSimulation();
          } catch (e) {
            console.error('Error starting', e.stack);
          }
        }, 500);
      }
      updateGameMetadata();
      return true;
    },
    canStart() {
      return isPractice
        ? true
        : users.length > 1 && users.length <= 4 && !started;
    },
    isPractice() {
      return isPractice;
    },
    isStarted() {
      return started;
    },
    getReplay() {
      return replay;
    },
    emitAll(ev, obj) {
      users.forEach(user => {
        const [socket] = user;
        socket.emit(ev, obj);
      });
    },
  };
  return game;
};
