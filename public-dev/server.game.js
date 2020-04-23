/*
global
G_SCALE
G_AU
G_SPEEDS
G_FRAME_MS
G_Body
G_applyGravity
G_actions
G_getActionCost
G_getSpeedCost
G_getRandomLocInCircle
G_socket_sendUpdateGameList
G_socket_createMessageSocket
G_socket_randomId
G_SOCKET_START_GAME
G_SOCKET_STOP_GAME
G_SOCKET_BROADCAST_GAME
G_SOCKET_LOBBY_LIST_UPDATED
G_SOCKET_START_SIMULATION
G_SOCKET_STOP_SIMULATION
G_SOCKET_GAME_FINISHED
G_user_unsetGame
G_user_getId
G_user_getName
G_maps
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
  let initialFunds = 100;
  let baseFundsPerRound = 25;
  let mapIndex = 0;
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

  const createGameData = users => {
    let usersR = randomOrder(users);

    const map = G_maps[mapIndex];
    const {
      // width,
      // height,
      resourceLocations,
      planetLocations,
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
      gameObj.players.push({
        id: G_user_getId(user),
        name: G_user_getName(user),
        funds: initialFunds,
        ready: false,
        dead: false,
        hp: 1,
        color: colors[i],
        r: FORT_SIZE,
        ...loc,
        target: [loc.x, loc.y],
      });
    }
    for (let i = 0; i < planetLocations.length; i++) {
      const p = planetLocations[i];
      const { x, y, mass, color, r, posR } = p;
      const loc = G_getRandomLocInCircle(x, y, posR);
      gameObj.planets.push(G_Body(color, mass, color, r, 0, 0, loc.x, loc.y));
    }
    for (let i = 0; i < resourceLocations.length; i++) {
      const r = resourceLocations[i];
      const { x, y, posR } = r;
      gameObj.resources.push({
        ...r,
        id: G_socket_randomId(),
        ...G_getRandomLocInCircle(x, y, posR),
      });
    }

    return gameObj;
  };

  const broadcast = (i, timestamp, gameData) => {
    game.emitAll(
      G_SOCKET_BROADCAST_GAME,
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
      let currentGameData = gameData;
      let collisions = G_applyGravity(
        currentGameData.projectiles,
        currentGameData.projectiles.concat(currentGameData.planets),
        currentGameData.players
          .filter(p => !p.dead)
          .concat(currentGameData.resources),
        nowDt
      );
      gameData.collisions = collisions;
      let len = collisions.length;
      if (len) {
        console.log('GOT A COLL', JSON.stringify(collisions));
        for (let i = 0; i < len; i++) {
          const [projectile, other] = collisions[i];
          let remove = true;
          if (other) {
            if (other.type === 'coin') {
              const player = getPlayer(projectile.meta.player, gameData);
              player.funds += other.value;
              removeResource(other.id, gameData);
              remove = false;
            } else if (other.meta) {
              // is projectile
              if (projectile.meta.speed > other.meta.speed) {
                removeProjectile(other.meta.id, gameData);
              } else if (projectile.meta.speed < other.meta.speed) {
                removeProjectile(projectile.meta.id, gameData);
              } else {
                removeProjectile(other.meta.id, gameData);
                removeProjectile(projectile.meta.id, gameData);
              }
              const ind = collisions.reduce(
                (prev, curr, i) =>
                  curr.meta && curr.meta.id === other.id ? i : prev,
                -1
              );
              if (ind > -1) {
                collisions.splice(i, 1);
                len--;
              }
              continue;
            } else if (other.color) {
              // is player
              removeProjectile(other.color, gameData, true);
              const player = getPlayer(other.id, gameData);
              player.hp--;
              if (player.hp <= 0) {
                player.dead = true;
              }
            }
          }
          let ind = currentGameData.projectiles.indexOf(projectile);
          if (ind > -1 && remove) {
            currentGameData.projectiles.splice(ind, 1);
          }
        }
      }

      for (let i = 0; i < gameData.projectiles.length; i++) {
        const p = gameData.projectiles[i];
        if (p.meta.type === 'Move') {
          movePlayer(p.meta.player, p.px, p.py);
        }
        if (now - startTime >= p.t) {
          collisions.push([p, null]);
          gameData.projectiles.splice(i, 1);
          i--;
          if (p.meta.type === 'Move') {
            movePlayer(p.meta.player, p.px, p.py);
          }
        }
      }

      if (gameData.projectiles.length === 0) {
        stopSimulation();
        return;
      }

      frame++;
      if (frame >= broadcastEvery || len) {
        frame = 0;
        broadcast(broadcastCtr++, now, gameData);
      }
    } catch (e) {
      console.error('error running simulation', e);
      stopSimulation();
    }
  };
  const startSimulation = () => {
    console.log('START SIMULATION');
    startTime = now = +new Date();
    nowDt = 0;
    game.emitAll(
      G_SOCKET_START_SIMULATION,
      G_socket_createMessageSocket(gameData)
    );
    timeoutId = setTimeout(stopSimulation, gameData.maxRoundLength);
    intervalId = setInterval(simulate, G_FRAME_MS);
  };
  const stopSimulation = () => {
    console.log('STOP SIMULATION');
    if (started) {
      game.emitAll(
        G_SOCKET_STOP_SIMULATION,
        G_socket_createMessageSocket(gameData)
      );
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
  const getProjectileIndex = (id, gameData) => {
    return gameData.projectiles.reduce((ret, pl, i) => {
      return pl.meta.id === id ? i : ret;
    }, -1);
  };
  const getProjectileIndexWithColor = (color, gameData) => {
    return gameData.projectiles.reduce((ret, pl, i) => {
      return pl.color === color ? i : ret;
    }, -1);
  };
  const getResourceIndex = (id, gameData) => {
    return gameData.resources.reduce((ret, pl, i) => {
      return pl.id === id ? i : ret;
    }, -1);
  };
  const removeProjectile = (id, gameData, isColor) => {
    const ind = isColor
      ? getProjectileIndexWithColor(id, gameData)
      : getProjectileIndex(id, gameData);
    if (ind > -1) {
      gameData.projectiles.splice(ind, 1);
    } else {
      console.log('NO PROJ FOUND?', id, isColor);
    }
  };
  const removeResource = (id, gameData) => {
    const ind = getResourceIndex(id, gameData);
    if (ind > -1) {
      gameData.resources.splice(ind, 1);
    }
  };
  const movePlayer = (playerId, x, y) => {
    const player = getPlayer(playerId, gameData);
    if (isInBounds(x, y)) {
      player.x = x;
      player.y = y;
    }
  };
  const isInBounds = (x, y) => {
    const { width, height } = gameData;
    return x >= -width && x <= width && y >= -height && y <= height;
  };

  const createProjectiles = (type, speed, normalizedVec, player) => {
    let mass = 1;
    let r = 5 / G_SCALE;
    let len = gameData.maxRoundLength;
    if (type === 'Move') {
      r = 15 / G_SCALE;
      len = 1000;
    }
    const { color, x, y } = player;
    const ret = [
      G_Body(
        {
          type,
          id: G_socket_randomId(),
          player: player.id,
          speed,
          color: player.color,
        },
        mass,
        color,
        r,
        normalizedVec[0] * speed,
        normalizedVec[1] * speed,
        x,
        y,
        len
      ),
    ];
    return ret;
  };

  const getNormalizedVec = ([x, y]) => {
    const d = Math.sqrt(x * x + y * y);
    return [x / d, y / d];
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

  const updateUsers = () => {
    const playersList = game.getPlayers();
    game.emitAll(
      G_SOCKET_LOBBY_LIST_UPDATED,
      G_socket_createMessageSocket(playersList)
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
    join(user) {
      if (started || isPractice) {
        console.error('Cannot join');
        return false;
      }

      if (users.length < G_maps[mapIndex].maxPlayers) {
        users.push(user);
        updateUsers();
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
            updateUsers();
          }
          return true;
        }
      }
      return false;
    },
    start() {
      started = true;
      gameData = createGameData(users);

      game.emitAll(
        G_SOCKET_START_GAME,
        G_socket_createMessageSocket({
          startTime,
          gameData,
        })
      );
    },
    stop() {
      stopSimulation();
      game.emitAll(
        G_SOCKET_STOP_GAME,
        G_socket_createMessageSocket('The game was stopped.')
      );
      users.forEach(user => {
        G_user_unsetGame(user);
      });
      G_socket_sendUpdateGameList();
    },
    finish(result) {
      console.log('Finish game.');
      gameData.result = result;
      game.emitAll(
        G_SOCKET_GAME_FINISHED,
        G_socket_createMessageSocket(gameData)
      );
      users.forEach(user => {
        G_user_unsetGame(user);
      });
      G_socket_sendUpdateGameList();
    },
    setMapIndex(i) {
      if (i >= 0 && i < G_maps.length) {
        mapIndex = i;
      }
      if (i === -1) {
        mapIndex = 0;
        isPractice = true;
        initialFunds = 10000;
      }
    },
    confirmAction(action, args, user) {
      const player = getPlayer(user, gameData);
      if (!player) {
        console.error('No player exists in game', user);
        return false;
      }
      if (player.dead) {
        console.error('Player is dead', user);
        return false;
      }
      switch (action) {
        case 'Shoot':
        case 'Move':
          const [targetX, targetY, speed] = args.split(',');
          const normalizedVec = getNormalizedVec([
            targetX - player.x,
            targetY - player.y,
          ]);
          const arr = createProjectiles(
            action,
            (G_SPEEDS[speed] && G_SPEEDS[speed][0]) || G_SPEEDS.normal[0],
            normalizedVec,
            player
          );
          const cost = checkActionCost(action, speed, user);
          if (cost === false) {
            console.log('Invalid action, it costs too much!', action, speed);
            return false;
          }
          gameData.projectiles = gameData.projectiles.concat(arr);
          player.target = [targetX, targetY];
          player.funds -= cost;
          player.cost = cost;
          break;
        default:
          args = null;
      }
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
        : users.length > 1 &&
            users.length <= G_maps[mapIndex].maxPlayers &&
            !started;
    },
    isPractice() {
      return isPractice;
    },
    isStarted() {
      return started;
    },
    emitAll(ev, obj) {
      users.forEach(user => {
        user[0].emit(ev, obj);
      });
    },
  };
  return game;
};
