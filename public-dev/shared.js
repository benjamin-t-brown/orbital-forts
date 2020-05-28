const G_R_CREATE = 'create';
const G_R_JOIN = 'join';
const G_R_LEAVE = 'leave';
const G_R_START = 'start';
const G_R_UPDATE_LOBBY = 'update-lobby';
const G_R_CONFIRM_ACTION = 'confirm';
const G_R_GET_REPLAYS_LIST = 'replays';
const G_R_GET_REPLAY = 'replay';

const G_S_CONNECTED = 's-connected';
const G_S_LIST_UPDATED = 's-game-list';
const G_S_CREATE = 's-create';
const G_S_START = 's-start';
const G_S_LOBBY_DATA = 's-lobby-data';
const G_S_GAME_METADATA = 's-game-meta';
const G_S_LEAVE = 's-leave';
const G_S_JOIN = 's-join';
const G_S_STOP = 's-stop';
const G_S_BROADCAST = 's-broadcast';
const G_S_START_SIMULATION = 's-simulate-start';
const G_S_STOP_SIMULATION = 's-simulate-stop';
const G_S_FINISHED = 's-finished';

let G_DEBUG = false;

// Gravitational constant
const G_G = 6.67428e-11;

// Assumed scale: 100 pixels = 1AU.
const G_AU = 149.6e6 * 1000; //  149.6 million km, in meters.
const G_SCALE = 75 / G_AU;
const G_FRAME_MS = 13.333;
const G_MASS_MIN = 5.0 * 10 ** 30;
const G_MASS_MAX = 100.0 * 10 ** 30;

// Constants for the different speeds a player can fire a projectile at associated with the cost
// Speeds are specified in meters per 2 days (or meters per simulation step)
let G_SPEEDS = {
  Normal: [55000, 0],
  Super: [125000, 75],
};

// Constants for each action that a player may make in a round
// NOTE: this text is shown in the game ui in the action buttons
const G_action_move = 'Move';
const G_action_shoot = 'Shoot';
const G_action_spread = 'Spread Fire';
const G_action_planetCracker = 'Planet Crkr.';
const G_action_cluster = 'Cluster Bomb';
const G_action_clusterSpawn = 'Cluster Spawn'; // missile spawned when a cluster bomb explodes

// Constants representing the resources that can be on the game board
// NOTE: these correspond to css class names that describe what they look like on the game board
// (css defined in entity.style.css)
const G_res_coin = 'coin';
const G_res_spray = 'spread';
const G_res_planetCracker = 'planet-cracker';
const G_res_cluster = 'cluster';
const G_res_wormhole = 'wormhole';

const G_res_sprites = {
  [G_res_coin]: {
    elem: 'div',
    label: '',
    offsetTop: 25,
    content: '$',
  },
  [G_res_spray]: {
    elem: 'div',
    label: 'Spread Fire',
    offsetTop: 45,
    content: '!',
  },
  [G_res_planetCracker]: {
    elem: 'div',
    label: 'Planet Crkr.',
    offsetTop: 45,
    content: '!',
  },
  [G_res_cluster]: {
    elem: 'div',
    label: 'Cluster Bomb',
    offsetTop: 45,
    content: '!',
  },
  [G_res_wormhole]: {
    elem: 'div',
    label: '',
    // offsetTop: 50,
    offsetTop: 32,
    content: '<div></div>', // wormholes have css that affect this div
  },
};

// This maps all available actions with their costs
let G_actions = [
  [G_action_move, 50],
  [G_action_shoot, 0],
  [G_action_spread, 100],
  [G_action_planetCracker, 150],
  [G_action_cluster, 200],
];

// entities are all "things" on the game board (used to identify objects during a collision)
const G_entity = {
  nothing: 'ent_nothing',
  player: 'ent_player',
  planet: 'ent_planet',
  projectile: 'ent_projectile',
  coin: 'ent_res_coin',
  planetCracker: 'ent_res_planet_cracker',
  spray: 'ent_res_spread',
  cluster: 'ent_res_cluster',
  wormhole: 'ent_res_wormhole',
};

const G_randomId = () => (+new Date() * Math.random()).toString(16);
const G_normalize = (x, A, B, C, D) => {
  return C + ((x - A) * (D - C)) / (B - A);
};
const G_dist = (dx, dy) => Math.sqrt(dx ** 2 + dy ** 2);
const G_collidesCir = (dx, dy, r1, r2) => G_dist(dx, dy) <= r1 + r2;

let G_getActionCost = actionName =>
  G_actions.reduce(
    (cost, [name, cost2]) => (name === actionName ? cost2 : cost),
    0
  );
let G_getSpeedCost = speedName => G_SPEEDS[speedName][1];

const G_getRandomLocInCircle = (x, y, r) => {
  let th = 2 * Math.PI * Math.random();
  let rr = Math.sqrt(Math.random()) * r;
  return {
    x: x + rr * Math.cos(th),
    y: y + rr * Math.sin(th),
  };
};

const G_getNormalizedVec = ([x, y]) => {
  const d = Math.sqrt(x * x + y * y);
  return [x / d, y / d];
};

const getPlayerByPlayerId = (playerId, gameData) => {
  const id = playerId;
  return gameData.players.reduce((ret, pl) => {
    return pl.id === id ? pl : ret;
  }, null);
};

const G_Body = (meta, mass, color, r, vx, vy, px, py, t) => {
  return {
    meta,
    mass,
    color,
    r,
    vx,
    vy,
    px,
    py,
    t,
  };
};

const G_createEntities = (gameData, map, { createPlanets = true } = {}) => {
  const collidesWithOther = (self, other) => {
    let { px: sx, py: sy, x: sxx, y: syy, r: sr } = self;
    let { px: ox, py: oy, x: oxx, y: oyy, r: or } = other;

    let selfX = sxx || sx;
    let selfY = syy || sy;
    let otherX = oxx || ox;
    let otherY = oyy || oy;
    let dx = otherX - selfX;
    let dy = otherY - selfY;
    return G_collidesCir(dx, dy, sr, or);
  };

  const collidesWithAnything = (self, arr) => {
    for (let i = 0; i < arr.length; i++) {
      const other = arr[i];
      if (collidesWithOther(self, other)) {
        return true;
      }
    }
    return false;
  };

  const { planetLocations, resourceLocations } = map;
  if (createPlanets) {
    for (let i = 0; i < planetLocations.length; i++) {
      const p = planetLocations[i];
      const { x, y, mass, color, r, posR } = p;
      let ctr = 0;
      let newPlanet;
      do {
        const loc = G_getRandomLocInCircle(x, y, posR);
        newPlanet = G_Body(
          { color, type: 'planet' },
          mass,
          color,
          r,
          0,
          0,
          loc.x,
          loc.y
        );
        ctr++;
      } while (ctr <= 10 && collidesWithAnything(newPlanet, gameData.planets));
      if (ctr <= 10) {
        gameData.planets.push(newPlanet);
      }
    }
  }
  for (let i = 0; i < resourceLocations.length; i++) {
    const r = resourceLocations[i];
    const { x, y, posR } = r;

    let ctr = 0;
    let newResource;
    do {
      newResource = {
        ...r,
        id: G_randomId(),
        ...G_getRandomLocInCircle(x, y, posR),
      };
      ctr++;
    } while (
      ctr <= 10 &&
      collidesWithAnything(
        newResource,
        gameData.planets.concat(gameData.resources)
      )
    );

    gameData.resources.push({
      ...r,
      id: G_randomId(),
      ...G_getRandomLocInCircle(x, y, posR),
    });
  }
};

const G_getEntityType = object => {
  const isPlayer = o => {
    return !!(o.color && object.name);
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
  const isCluster = o => {
    return o.type === G_res_cluster;
  };
  const isWormhole = o => {
    return o.type === G_res_wormhole;
  };
  switch (true) {
    case !object:
      return G_entity.nothing;
    case isPlayer(object):
      return G_entity.player;
    case isProjectile(object):
      return G_entity.projectile;
    case isCoin(object):
      return G_entity.coin;
    case isSpray(object):
      return G_entity.spray;
    case isPlanetCracker(object):
      return G_entity.planetCracker;
    case isPlanet(object):
      return G_entity.planet;
    case isCluster(object):
      return G_entity.cluster;
    case isWormhole(object):
      return G_entity.wormhole;
    default:
      console.log('Unknown entity', object);
      return G_entity.nothing;
  }
};

const G_applyGravity = (bodies, gravityBodies, extraColliders, dt) => {
  const getAttraction = (self, other) => {
    let { px: sx, py: sy, mass: sMass, r: sr } = self;
    let { px: ox, py: oy, mass: oMass, r: or } = other;
    let dx = ox - sx;
    let dy = oy - sy;
    let d = Math.max(G_dist(dx, dy), 0.001);
    let c = G_collidesCir(dx, dy, sr, or);
    let f = (G_G * sMass * oMass) / d ** 2;
    let theta = Math.atan2(dy, dx);
    let fx = Math.cos(theta) * f;
    let fy = Math.sin(theta) * f;
    return { fx, fy, c };
  };

  let collisions = [];
  let timeStep = (24 * 3600 * 2 * dt) / G_FRAME_MS; // two days / G_FRAME_MS
  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];
    let totalFx = 0,
      totalFy = 0;
    for (let j = 0; j < gravityBodies.length; j++) {
      let other = gravityBodies[j];
      if (body === other) {
        continue;
      }
      let { fx, fy, c } = getAttraction(body, other);
      if (c) {
        collisions.push([body, other]);
        continue;
      }
      totalFx += fx;
      totalFy += fy;
    }

    for (let j = 0; j < extraColliders.length; j++) {
      let other = extraColliders[j];
      let { x, y, r } = other;
      let c = G_collidesCir(x - body.px, y - body.py, r, body.r);
      if (c && body.meta.player !== other.id) {
        collisions.push([body, other]);
      }
    }

    body.vx += (totalFx / body.mass) * timeStep;
    body.vy += (totalFy / body.mass) * timeStep;
    body.px += body.vx * timeStep;
    body.py += body.vy * timeStep;
  }
  return collisions;
};

const G_applyAction = (gameData, player, actionObj) => {
  const {
    action,
    speed,
    target: [targetX, targetY],
    vec,
    cost,
  } = actionObj;
  const arr = G_createProjectiles(
    {
      type: action,
      speed,
      normalizedVec: vec,
      player,
    },
    gameData
  );
  gameData.projectiles = gameData.projectiles.concat(arr);
  player.target = [targetX, targetY];
  player.funds -= cost;
  player.cost = cost;
  player.actions[action] -= player.actions[action] < 99 ? 1 : 0;
  player.action = action;
};

const G_createProjectiles = (
  { type, speed, normalizedVec, player, pos },
  gameData
) => {
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

  const ret = [];
  let mass = 1;
  let r = 5 / G_SCALE;
  let len = gameData.maxRoundLength;
  let vx = normalizedVec[0];
  let vy = normalizedVec[1];
  let { color, x, y } = player;
  if (pos) {
    x = pos.x;
    y = pos.y;
  }

  const createProjectile = (vx, vy) => {
    let b = G_Body(
      {
        proj: true,
        type,
        id: G_randomId(),
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
    return b;
  };

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
    case G_action_cluster:
      len = 2000;
      r = 10 / G_SCALE;
      ret.push(createProjectile(vx, vy));
      break;
    case G_action_clusterSpawn:
      r = 4 / G_SCALE;
      len = 4500;
      for (let i = 0; i < 360; i += 10) {
        let [vx, vy] = rotateVectorDeg(normalizedVec, i);
        ret.push(createProjectile(vx, vy));
        len += 50;
      }
      break;
    case G_action_move:
      len = 1000;
      r = 15 / G_SCALE;
    default:
      ret.push(createProjectile(vx, vy));
  }
  return ret;
};

const G_handleCollision = (c, gameData) => {
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
  const createClusterSpawnFunc = (projectile, player, gameData) => {
    return () => {
      gameData.projectiles = [
        ...gameData.projectiles,
        ...G_createProjectiles(
          {
            type: G_action_clusterSpawn,
            speed: G_SPEEDS.Normal[0],
            normalizedVec: [0, 1],
            player,
            pos: { x: projectile.px, y: projectile.py },
          },
          gameData
        ),
      ];
    };
  };

  const [projectile, other] = c;
  let player = getPlayerByPlayerId(projectile.meta.player, gameData);
  let type = projectile.meta.type;

  switch (G_getEntityType(other)) {
    // if a projectile hits a player, that player is dead
    case G_entity.player:
      console.log('COL with player', projectile, other);
      player = getPlayerByPlayerId(other.id, gameData);
      player.dead = true;
      projectile.meta.remove = true;
      if (type === G_action_cluster) {
        return {
          cb: createClusterSpawnFunc(projectile, player, gameData),
        };
      }
      break;
    // if a projectile hits another projectile, check mass and speed speed.  If other's mass/speed is same or less, remove other.
    case G_entity.projectile:
      if (other.meta.player === projectile.meta.player) {
        return {
          remove: true,
        };
      }
      const s1 = projectile.meta.speed * projectile.mass;
      const s2 = other.meta.speed * other.mass;
      console.log('COL with other projectile', projectile, other, s1, s2);
      if (s1 >= s2) {
        console.log('This proj is faster or same as other, remove other');
        other.meta.remove = true;
      }
      if (s2 >= s1) {
        console.log('This proj is slower or same as other, remove this');
        projectile.meta.remove = true;
      }
      if (type === G_action_cluster) {
        return {
          cb: createClusterSpawnFunc(projectile, player, gameData),
        };
      }
      break;
    // if a projectile hits a coin, add that coin's funds the firing player and remove the coin
    case G_entity.coin:
      console.log('COL with coin', projectile, other);
      player.funds += other.value;
      removeResource(other.id, gameData);
      break;
    // if a projectile hits a 'spray' power-up, add that to the players list of available actions and remove the power-up
    case G_entity.spray:
      console.log('COL with spray', projectile, other);
      player.actions[G_action_spread] += 2;
      removeResource(other.id, gameData);
      break;
    // if a projectile hits a 'planet-cracker' power-up, add that to the players list of available actions and remove the power-up
    case G_entity.planetCracker:
      console.log('COL with planet cracker', projectile, other);
      player.actions[G_action_planetCracker] += 2;
      removeResource(other.id, gameData);
      break;
    // if a projectile hits a 'cluster' power-up, add that to the players list of available actions and remove the power-up
    case G_entity.cluster:
      console.log('COL with cluster', projectile, other);
      player.actions[G_action_cluster] += 2;
      removeResource(other.id, gameData);
      break;
    // if a projectile hits a planet, it explodes.  If that projectile was a "Move", then the player is dead
    // if the projectile is a planet cracker, then destroy the planet
    case G_entity.planet:
      console.log('COL with planet', projectile, other);
      projectile.meta.remove = true;
      if (type === G_action_move) {
        console.log('Player died by running into planet');
        player.dead = true;
      } else if (type === G_action_planetCracker) {
        console.log('Player removed a planet with a planet cracker!');
        other.meta.remove = true;
      } else if (type === G_action_cluster) {
        return {
          cb: createClusterSpawnFunc(projectile, player, gameData),
        };
      }
      break;
    // if a projectile hits a wormhole, move that projectile to the opposite side of the corresponding wormhole
    // store the previous coordinate so the UI can display stuff there
    case G_entity.wormhole:
      console.log('COL with wormhole', projectile, other);
      const { px: myX, py: myY, r: myR } = projectile;
      const { x, y, r } = other;
      const dx = x - myX;
      const dy = y - myY;
      const [normX, normY] = G_getNormalizedVec([dx, dy]);
      const otherWormhole = G_getCorrespondingWormhole(other, gameData);
      const newX = normX * (r + myR + 1) + otherWormhole.x;
      const newY = normY * (r + myR + 1) + otherWormhole.y;
      projectile.meta.prevX = projectile.px;
      projectile.meta.prevY = projectile.py;
      projectile.px = newX;
      projectile.py = newY;
      break;
    case G_entity.nothing:
      if (type === G_action_cluster) {
        return {
          cb: createClusterSpawnFunc(projectile, player, gameData),
        };
      }
  }
  return {};
};

const G_simulate = (gameData, { now, nowDt, startTime }) => {
  const isInBounds = (x, y, width, height, gameData) => {
    const { width: worldWidth, height: worldHeight } = gameData;
    return (
      x - width >= -worldWidth &&
      x + width <= worldWidth &&
      y - height >= -worldHeight &&
      y + height <= worldHeight
    );
  };

  const movePlayer = (playerId, x, y, gameData) => {
    const player = getPlayerByPlayerId(playerId, gameData);
    if (isInBounds(x, y, player.r, player.r, gameData)) {
      player.x = x;
      player.y = y;
    }
  };

  let currentGameData = gameData;
  let { projectiles, planets, players, resources } = currentGameData;
  let collisionCallbacks = [];
  let collisions = G_applyGravity(
    projectiles,
    projectiles.concat(planets),
    players.filter(p => !p.dead).concat(resources),
    nowDt
  );
  gameData.collisions = collisions;
  for (let i = 0; i < collisions.length; i++) {
    const { remove, cb } = G_handleCollision(collisions[i], gameData);
    if (remove) {
      collisions.splice(i, 1);
      i--;
    }
    if (cb) {
      collisionCallbacks.push(cb);
    }
  }

  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i];
    if (p.meta.type === G_action_move) {
      const player = getPlayerByPlayerId(p.meta.player, gameData);
      if (player.dead) {
        p.meta.remove = true;
      } else {
        movePlayer(p.meta.player, p.px, p.py, gameData);
      }
    }
    if (p.meta.remove) {
      projectiles.splice(i, 1);
      i--;
      continue;
    }
    if (now - startTime >= p.t || !isInBounds(p.px, p.py, p.r, p.r, gameData)) {
      const collisionWithNothing = [p, null];
      // handleCollision returns {true} when the collision should be removed
      console.log(
        'Projectile timed out',
        now - startTime >= p.t,
        !isInBounds(p.px, p.py, p.r, p.r, gameData),
        p.px,
        p.py,
        p.meta.type
      );
      const { remove, cb } = G_handleCollision(collisionWithNothing, gameData);
      if (p.meta.type !== G_action_move && !remove) {
        collisions.push(collisionWithNothing);
      }
      if (cb) {
        collisionCallbacks.push(cb);
      }
      projectiles.splice(i, 1);
      i--;
      continue;
    }
  }

  for (let i = 0; i < planets.length; i++) {
    const planet = planets[i];
    if (planet.meta.remove) {
      planets.splice(i, 1);
      i--;
    }
  }

  for (let i = 0; i < collisionCallbacks.length; i++) {
    collisionCallbacks[i]();
  }
};

const G_getCorrespondingWormhole = (wormhole, gameData) => {
  const wormholes = gameData.resources.filter(
    res => res.type === G_res_wormhole
  );
  const resIndex = wormholes.indexOf(wormhole);
  if (resIndex % 2 === 0) {
    return wormholes[resIndex + 1];
  } else {
    return wormholes[resIndex - 1];
  }
};
