const G_R_CREATE = 'create';
const G_R_JOIN = 'join';
const G_R_LEAVE = 'leave';
const G_R_START = 'start';
const G_R_UPDATE_LOBBY = 'update-lobby';
const G_R_CONFIRM_ACTION = 'confirm';

const G_S_CONNECTED = 's-connected';
const G_S_LIST_UPDATED = 's-game-list';
const G_S_CREATE = 's-create';
const G_S_START = 's-start';
const G_S_LOBBY_DATA = 's-lobby-data';
const G_S_LEAVE = 's-leave';
const G_S_JOIN = 's-join';
const G_S_STOP = 's-stop';
const G_S_BROADCAST = 's-broadcast';
const G_S_START_SIMULATION = 's-simulate-start';
const G_S_STOP_SIMULATION = 's-simulate-stop';
const G_S_FINISHED = 's-finished';

// Gravitational constant
const G_G = 6.67428e-11;

// Assumed scale: 100 pixels = 1AU.
const G_AU = 149.6e6 * 1000; //  149.6 million km, in meters.
const G_SCALE = 75 / G_AU;
const G_FRAME_MS = 13.3333;

let G_SPEEDS = {
  Normal: [55000, 0],
  Super: [125000, 75],
};

const G_action_move = 'Move';
const G_action_shoot = 'Shoot';
const G_action_spread = 'Spreadfire';
const G_action_planetCracker = 'Planet Crkr';
const G_res_coin = 'coin';
const G_res_spray = 'spray';
const G_res_planetCracker = 'crack';

let G_actions = [
  [G_action_move, 50],
  [G_action_shoot, 0],
  [G_action_spread, 100],
  [G_action_planetCracker, 200],
];

const G_randomId = () => (+new Date() * Math.random()).toString(16);

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
  const { planetLocations, resourceLocations } = map;
  if (createPlanets) {
    for (let i = 0; i < planetLocations.length; i++) {
      const p = planetLocations[i];
      const { x, y, mass, color, r, posR } = p;
      const loc = G_getRandomLocInCircle(x, y, posR);
      gameData.planets.push(
        G_Body({ color, type: 'planet' }, mass, color, r, 0, 0, loc.x, loc.y)
      );
    }
  }
  for (let i = 0; i < resourceLocations.length; i++) {
    const r = resourceLocations[i];
    const { x, y, posR } = r;
    gameData.resources.push({
      ...r,
      id: G_randomId(),
      ...G_getRandomLocInCircle(x, y, posR),
    });
  }
};

const G_applyGravity = (bodies, gravityBodies, extraColliders, dt) => {
  const dist = (dx, dy) => Math.sqrt(dx ** 2 + dy ** 2);
  const collides = (dx, dy, r1, r2) => dist(dx, dy) <= r1 + r2;
  const getAttraction = (self, other) => {
    let { px: sx, py: sy, mass: sMass, r: sr } = self;
    let { px: ox, py: oy, mass: oMass, r: or } = other;
    let dx = ox - sx;
    let dy = oy - sy;
    let d = Math.max(dist(dx, dy), 0.001);
    let c = collides(dx, dy, sr, or);
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
      let c = collides(x - body.px, y - body.py, r, body.r);
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

const G_createProjectiles = (
  { type, speed, normalizedVec, player },
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

  const createProjectile = (vx, vy) => {
    return G_Body(
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

const G_handleCollision = (c, gameData) => {
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

  const [projectile, other] = c;
  let player = getPlayerByPlayerId(projectile.meta.player, gameData);

  switch (true) {
    // if a projectile hits a player, that player is dead
    case isPlayer(other):
      console.log('COL with player', projectile, other);
      player = getPlayerByPlayerId(other.id, gameData);
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

const G_simulate = (gameData, { now, nowDt, startTime }) => {
  const movePlayer = (playerId, x, y) => {
    const player = getPlayerByPlayerId(playerId, gameData);
    if (isInBounds(x, y)) {
      player.x = x;
      player.y = y;
    }
  };
  const isInBounds = (x, y) => {
    const { width, height } = gameData;
    return x >= -width && x <= width && y >= -height && y <= height;
  };

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
    console.log('GOT A COLLISION', collisions);
    for (let i = 0; i < len; i++) {
      // handleCollision returns {true} when the collision should be removed
      if (G_handleCollision(collisions[i], gameData)) {
        console.log('remove collision');
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
    if (now - startTime >= p.t || !isInBounds(p.px, p.py)) {
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
};
