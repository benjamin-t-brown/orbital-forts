/*
global
G_getMaps
G_getNumMaps
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
G_S_START
G_S_STOP
G_S_BROADCAST
G_S_LOBBY_LIST_UPDATED
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
        actions: {
          [G_action_shoot]: 99,
          [G_action_move]: 99,
          [G_action_spread]: 0,
          [G_action_planetCracker]: 0,
        },
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
      gameObj.planets.push(
        G_Body({ color, type: 'planet' }, mass, color, r, 0, 0, loc.x, loc.y)
      );
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
      let currentGameData = gameData;
      let { projectiles, planets, players, resources } = currentGameData;
      let collisions = G_applyGravity(
        projectiles,
        projectiles.concat(planets),
        players.filter(p => !p.dead).concat(resources),
        nowDt
      );
      gameData.collisions = collisions;
      let len = collisions.length;
      if (len) {
        for (let i = 0; i < len; i++) {
          // handleCollision returns {true} when the collision should be removed
          if (handleCollision(collisions[i])) {
            collisions.splice(i, 1);
            i--;
            len--;
          }
        }
      }

      for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (p.meta.type === G_action_move) {
          movePlayer(p.meta.player, p.px, p.py);
        }
        if (p.meta.remove) {
          projectiles.splice(i, 1);
          i--;
          continue;
        }
        if (now - startTime >= p.t || isOutOfBounds(p.px, p.py)) {
          collisions.push([p, null]);
          projectiles.splice(i, 1);
          i--;
        }
      }

      for (let i = 0; i < planets.length; i++) {
        const planet = planets[i];
        if (planet.meta.remove) {
          planets.splice(i, 1);
          i--;
        }
      }

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
  const handleCollision = c => {
    const [projectile, other] = c;
    let player = getPlayer(projectile.meta.player, gameData);
    const isPlayer = o => {
      return !!(o.color && other.name);
    };
    const isPlanet = o => {
      return !!o.color;
    };
    const isProjectile = o => {
      return o.meta && o.meta.proj;
    };
    const isCoin = o => {
      return o.type === G_res_coin;
    };
    const isSpray = o => {
      return o.type === G_res_spray;
    };
    const isPlanetCracker = o => {
      return o.type === G_res_planetCracker;
    };

    switch (true) {
      // if a projectile hits a player, that player is dead
      case isPlayer(other):
        console.log('COL with player', projectile, other);
        player = getPlayer(other.id, gameData);
        player.dead = true;
        projectile.meta.remove = true;
        break;
      // if a projectile hits another projectile, check mass and speed speed.  If other's mass/speed is same or less, remove other.
      case isProjectile(other):
        if (other.meta.player === projectile.meta.player) {
          return true;
        }
        console.log('COL with other projectile', projectile, other);
        const s1 = projectile.meta.speed * projectile.meta.mass;
        const s2 = other.meta.speed * other.meta.mass;
        if (s1 >= s2) {
          console.log('This proj is faster or same as other, remove other');
          other.meta.remove = true;
        }
        if (s2 >= s1) {
          console.log('This proj is slower or same as other, remove this');
          projectile.meta.remove = true;
        }
        break;
      // if a projectile hits a coin, add that coin's funds the firing player and remove the coin
      case isCoin(other):
        console.log('COL with coin', projectile, other);
        player.funds += other.value;
        removeResource(other.id, gameData);
        break;
      // if a projectile hits a 'spray' power-up, add that to the players list of available actions and remove the power-up
      case isSpray(other):
        console.log('COL with spray', projectile, other);
        player.actions[G_action_spread] += 2;
        removeResource(other.id, gameData);
        break;
      // if a projectile hits a 'planet-cracker' power-up, add that to the players list of available actions and remove the power-up
      case isPlanetCracker(other):
        console.log('COL with planet cracker', projectile, other);
        player.actions[G_action_planetCracker] += 2;
        removeResource(other.id, gameData);
        break;
      // if a projectile hits a planet, it explodes.  If that projectile was a "Move", then the player is dead
      // if the projectile is a planet cracker, then destroy the planet
      case isPlanet(other):
        console.log('COL with planet', projectile, other);
        projectile.meta.remove = true;
        const type = projectile.meta.type;
        if (type === G_action_move) {
          console.log('Player died by running into planet');
          player.dead = true;
        } else if (type === G_action_planetCracker) {
          console.log('Player removed a planet with a planet cracker!');
          other.meta.remove = true;
        }
        break;
    }
  };
  const isOutOfBounds = (x, y) => {
    const width = gameData.width + G_AU / 2;
    const height = gameData.height + G_AU / 2;
    return x < -width || x > width || y > height || y < -height;
  };

  const startSimulation = () => {
    console.log('START SIMULATION');
    startTime = now = +new Date();
    nowDt = 0;
    game.emitAll(G_S_START_SIMULATION, G_socket_createMessageSocket(gameData));
    timeoutId = setTimeout(stopSimulation, gameData.maxRoundLength);
    intervalId = setInterval(simulate, G_FRAME_MS);
  };
  const stopSimulation = () => {
    console.log('STOP SIMULATION');
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
  const getResourceIndex = (id, gameData) => {
    return gameData.resources.reduce((ret, pl, i) => {
      return pl.id === id ? i : ret;
    }, -1);
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
    const rotateVectorDeg = (vec, ang) => {
      const { round, cos, sin, PI } = Math;
      ang *= PI / 180;
      const cosA = cos(ang);
      const sinA = sin(ang);
      const tenThousand = 10000;
      return [
        round(tenThousand * (vec[0] * cosA - vec[1] * sinA)) / tenThousand,
        round(tenThousand * (vec[0] * sinA + vec[1] * cosA)) / tenThousand,
      ];
    };

    const createProjectile = (vx, vy) => {
      return G_Body(
        {
          proj: true,
          type,
          id: G_socket_randomId(),
          player: player.id,
          speed,
          color: player.color,
        },
        mass,
        color,
        r,
        vx * speed,
        vy * speed,
        x,
        y,
        len
      );
    };

    const ret = [];
    let mass = 1;
    let r = 5 / G_SCALE;
    let len = gameData.maxRoundLength;
    let vx = normalizedVec[0];
    let vy = normalizedVec[1];
    const { color, x, y } = player;
    switch (type) {
      case G_action_spread:
        for (let i = -5; i <= 5; i += 5) {
          let [vx, vy] = rotateVectorDeg(normalizedVec, i);
          ret.push(createProjectile(vx, vy));
        }
        break;
      case G_action_planetCracker:
        r = 20 / G_SCALE;
        mass = 10;
        ret.push(createProjectile(vx, vy));
        break;
      case G_action_move:
        len = 1000;
        r = 15 / G_SCALE;
      default:
        ret.push(createProjectile(vx, vy));
    }

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
      G_S_LOBBY_LIST_UPDATED,
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
    async join(user) {
      if (started || isPractice) {
        console.error('Cannot join');
        return false;
      }

      if (users.length < 4) {
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
    emitAll(ev, obj) {
      users.forEach(user => {
        user[0].emit(ev, obj);
      });
    },
  };
  return game;
};
