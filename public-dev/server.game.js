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
G_applyGravity
G_actions
G_simulate
G_getActionCost
G_getSpeedCost
G_getRandomLocInCircle
G_getNormalizedVec
G_createProjectiles
G_socket_sendUpdateGameList
G_socket_createMessageSocket
G_socket_randomId
G_S_START
G_S_STOP
G_S_BROADCAST
G_S_LOBBY_DATA
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
*/

const G_Game = (owner, name) => {
  let users = [owner];
  let now;
  let nowDt;
  let startTime = 0;
  let started = false;
  let isPractice = false;
  let intervalId;
  let timeoutId;
  let gameData = null;
  let broadcastCtr = 1;
  let broadcastEvery = 10; // broadcast every this number of frames
  let frame = 0;
  let FORT_SIZE = 25 / G_SCALE;
  let initialFunds = 175;
  let baseFundsPerRound = 25;
  let mapIndex = 0;
  let replay = {
    version: '1.0',
    date: +new Date(),
    name,
    players: [],
    states: [],
    initialGameData: null,
    map: null,
  };
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

  const createGameData = (users, map) => {
    let usersR = randomOrder(users);

    const {
      // width,
      // height,
      playerLocations,
    } = map;
    const gameObj = {
      ...map,
      players: [],
      planets: [],
      resources: [],
      projectiles: [],
      collisions: [],
      result: false,
      baseFundsPerRound,
    };

    for (let i = 0; i < usersR.length; i++) {
      const user = usersR[i];
      const { x, y, r } = playerLocations[i];
      const loc = G_getRandomLocInCircle(x, y, r);
      let actions = {};
      for (let j in G_actions) {
        actions[G_actions[j][0]] = j <= 1 ? 99 : 0;
      }
      gameObj.players.push({
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
      });
    }
    G_createEntities(gameObj, map, {});

    replay.initialGameData = gameObj;
    replay.map = map;

    return gameObj;
  };

  const broadcast = (i, timestamp, gameData) => {
    game.emitAll(
      G_S_BROADCAST,
      G_socket_createMessageSocket({
        i,
        timestamp,
        gameData,
      })
    );
  };
  const simulate = () => {
    try {
      let n = +new Date();
      nowDt = n - now;
      now = n;

      G_simulate(gameData, {
        startTime,
        nowDt,
        now,
      });

      let { projectiles, collisions } = gameData;

      if (projectiles.length === 0) {
        stopSimulation();
        return;
      }

      frame++;
      if (frame >= broadcastEvery || collisions.length) {
        frame = 0;
        broadcast(broadcastCtr++, now, gameData);
      }
    } catch (e) {
      console.error('error running simulation', e);
      stopSimulation();
    }
  };

  const startSimulation = () => {
    console.log('Start Simulation');
    startTime = now = +new Date();
    nowDt = 0;
    game.emitAll(G_S_START_SIMULATION, G_socket_createMessageSocket(gameData));
    timeoutId = setTimeout(stopSimulation, gameData.maxRoundLength);
    intervalId = setInterval(simulate, G_FRAME_MS);
  };
  const stopSimulation = () => {
    console.log('Stop Simulation');
    if (started) {
      game.emitAll(G_S_STOP_SIMULATION, G_socket_createMessageSocket(gameData));
      clearInterval(intervalId);
      intervalId = -1;
      clearTimeout(timeoutId);
      timeoutId = -1;
      gameData.projectiles = [];
      gameData.collisions = [];

      const result = isGameOver();
      if (result) {
        game.finished = true;
        game.finish(result);
      } else {
        gameData.players.forEach(p => {
          p.ready = false;
          p.funds += baseFundsPerRound;
        });
      }
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
  const getPlayer = (user, gameData) => {
    const id = typeof user === 'string' ? user : G_user_getId(user);
    return gameData.players.reduce((ret, pl) => {
      return pl.id === id ? pl : ret;
    }, null);
  };

  const areAllPlayersReady = () =>
    gameData.players.reduce(
      (prev, curr) => prev && (curr.dead ? true : curr.ready),
      true
    );

  const isGameOver = () => {
    if (isPractice) {
      return false;
    }

    let players = [];
    for (let i = 0; i < gameData.players.length; i++) {
      const pl = gameData.players[i];
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

  const checkActionCost = (action, speed, user) => {
    const cost = G_getActionCost(action) + G_getSpeedCost(speed);
    const player = getPlayer(user, gameData);
    return player.funds > cost ? cost : false;
  };

  const updateLobbyData = () => {
    game.emitAll(
      G_S_LOBBY_DATA,
      G_socket_createMessageSocket(game.getLobbyData())
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
    updateLobby: () => {
      updateLobbyData();
    },
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
            const pl = getPlayer(user2, gameData);
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
                  console.log('Error starting', e);
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
      started = true;
      const maps = await G_getMaps();
      gameData = createGameData(users, maps[mapIndex]);

      game.emitAll(
        G_S_START,
        G_socket_createMessageSocket({
          startTime,
          gameData,
        })
      );
    },
    stop() {
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
      gameData.result = result;
      game.emitAll(G_S_FINISHED, G_socket_createMessageSocket(gameData));
      users.forEach(user => {
        G_user_unsetGame(user);
      });
      G_socket_sendUpdateGameList();
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
      const player = getPlayer(user, gameData);
      if (!player || player.dead) {
        console.error('No player exists in game or player is dead.', user);
        return false;
      }
      const [targetX, targetY, speed] = args.split(',');
      const normalizedVec = G_getNormalizedVec([
        targetX - player.x,
        targetY - player.y,
      ]);

      const arr = G_createProjectiles(
        {
          type: action,
          speed: (G_SPEEDS[speed] && G_SPEEDS[speed][0]) || G_SPEEDS.normal[0],
          normalizedVec,
          player,
        },
        gameData
      );
      const cost = checkActionCost(action, speed, user);
      if (cost === false) {
        console.log('Invalid action, it costs too much.', action, speed);
        return false;
      }
      gameData.projectiles = gameData.projectiles.concat(arr);
      player.target = [targetX, targetY];
      player.funds -= cost;
      player.cost = cost;
      player.actions[action] -= player.actions[action] < 99 ? 1 : 0;
      player.action = action;
      player.ready = true;
      if (areAllPlayersReady()) {
        console.log('Starting after a moment...');
        setTimeout(() => {
          try {
            startSimulation();
          } catch (e) {
            console.log('Error starting', e);
          }
        }, 500);
      }
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
        user[0].emit(ev, obj);
      });
    },
  };
  return game;
};
