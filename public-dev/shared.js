/*
global
SAT
G_getEntityType
G_createCollision
*/

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

const G_GAME_TIME_BUFFER_MS = 500;

let G_DEBUG = false;

const G_MODES = {
  standard: 'standard',
  golf: 'golf',
};

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
  Super: [125000, 50],
};

// Constants for each action that a player may make in a round
// NOTE: this text is shown in the game ui in the action buttons
const G_action_move = 'Move';
const G_action_shoot = 'Shoot';
const G_action_spread = 'Spread Fire';
const G_action_planetCracker = 'Planet Crkr.';
const G_action_cluster = 'Cluster Bomb';
const G_action_clusterSpawn = 'Cluster Spawn'; // missile spawned when a cluster bomb explodes
const G_action_boomerang = 'Boomerang';

// Constants representing the resources that can be on the game board
// NOTE: these correspond to css class names that describe what they look like on the game board
// (css defined in entity.style.css)
const G_res_coin = 'coin';
const G_res_spray = 'spread';
const G_res_planetCracker = 'planet-cracker';
const G_res_cluster = 'cluster';
const G_res_wormhole = 'wormhole';
const G_res_boomerang = 'boomerang';
const G_res_proximityMine = 'prox';
const G_res_shockwave = 'shockwave';

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
    content: 'S',
  },
  [G_res_planetCracker]: {
    elem: 'div',
    label: 'Planet Crkr.',
    offsetTop: 45,
    content: 'P',
  },
  [G_res_cluster]: {
    elem: 'div',
    label: 'Cluster Bomb',
    offsetTop: 45,
    content: 'C',
  },
  [G_res_wormhole]: {
    elem: 'div',
    label: '',
    // offsetTop: 50,
    offsetTop: 32,
    content: '<div></div>', // wormholes have css that affect this div
  },
  [G_res_boomerang]: {
    elem: 'div',
    label: 'Boomerang',
    offsetTop: 45,
    content: 'B',
  },
  [G_res_proximityMine]: {
    elem: 'div',
    label: '',
    offsetTop: 25,
    content: `
<div class="prox2">!</div>
<div class="prox1-o">
  <div class="prox1">
  </div>   
</div>
<div class="prox2-o">
  <div class="prox1">
  </div>   
</div>`,
  },
};
// This maps all available actions with their costs
let G_actions = [
  [G_action_move, 50],
  [G_action_shoot, 0],
  [G_action_spread, 100],
  [G_action_planetCracker, 150],
  [G_action_cluster, 200],
  [G_action_boomerang, 25],
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
  boomerang: 'ent_res_boomerang',
  proximityMine: 'ent_res_prox',
  shockwave: 'ent_shockwave',
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
  const isBoomerang = o => {
    return o.type === G_res_boomerang;
  };
  const isProximityMine = o => {
    return o.type === G_res_proximityMine;
  };
  const isShockwave = o => {
    return o.type === G_res_shockwave;
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
    case isBoomerang(object):
      return G_entity.boomerang;
    case isProximityMine(object):
      return G_entity.proximityMine;
    case isShockwave(object):
      return G_entity.shockwave;
    default:
      console.log('Unknown entity', object);
      return G_entity.nothing;
  }
};

const G_createCollision = (self, other, satResponse) => {
  return [self.id, (other && other.id) || 0, false, G_randomId(), satResponse];
};

const G_randomId = () => (+new Date() * Math.random()).toString(16);
const G_normalize = (x, A, B, C, D) => {
  return C + ((x - A) * (D - C)) / (B - A);
};
const G_dist = (dx, dy) => Math.sqrt(dx ** 2 + dy ** 2);
const G_collidesCir = (dx, dy, r1, r2) => G_dist(dx, dy) <= r1 + r2;

const G_getActionCost = actionName =>
  G_actions.reduce(
    (cost, [name, cost2]) => (name === actionName ? cost2 : cost),
    0
  );
const G_getSpeedCost = speedName => G_SPEEDS[speedName][1];

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

const G_toRadians = deg => (deg * Math.PI) / 180;

const G_getEntityFromEntMap = (entityId, gameData) => {
  const entity = gameData.entMap[entityId];
  return entity;
};

const G_forEachEntityType = (cb, entityType, gameData) => {
  for (let i in gameData.entMap) {
    const entity = gameData.entMap[i];
    if (G_getEntityType(entity) === entityType) {
      cb(entity, i);
    }
  }
};

const G_getHeadingTowards = (myX, myY, x, y) => {
  let lenY = y - myY;
  let lenX = x - myX;
  const { sqrt, asin } = Math;
  let hyp = sqrt(lenX * lenX + lenY * lenY);
  let ret = 0;
  if (y >= myY && x >= myX) {
    ret = (asin(lenY / hyp) * 180) / Math.PI + 90;
  } else if (y >= myY && x < myX) {
    ret = (asin(lenY / -hyp) * 180) / Math.PI - 90;
  } else if (y < myY && x > myX) {
    ret = (asin(lenY / hyp) * 180) / Math.PI + 90;
  } else {
    ret = (asin(-lenY / hyp) * 180) / Math.PI - 90;
  }
  if (ret >= 360) {
    ret = 360 - ret;
  }
  if (ret < 0) {
    ret = 360 + ret;
  }
  return isNaN(ret) ? 0 : ret;
};

const G_rotateVectorDeg = (vec, ang) => {
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

const G_Body = (meta, mass, color, r, vx, vy, px, py, t) => {
  const satCircle = new SAT.Circle(new SAT.Vector(px, py), r);
  return {
    id: G_randomId(),
    meta,
    mass,
    color,
    r,
    vx,
    vy,
    ax: 0,
    ay: 0,
    px,
    py,
    t,
    update: function() {},
    satCircle,
  };
};

const G_body_setAcceleration = (body, ax, ay) => {
  body.ax = ax;
  body.ay = ay;
};

const G_body_setUpdateFunction = (body, cb) => {
  body.update = cb;
};

const G_Field = (x, y, w, h, angle, type) => {
  const box = new SAT.Box(new SAT.Vector(x, y), w, h).toPolygon();
  box.translate(-w / 2, -h / 2);
  box.rotate(G_toRadians(angle));

  return {
    id: G_randomId(),
    type,
    angle,
    x,
    y,
    w,
    h,
    satBox: box,
  };
};

const G_Shockwave = (type, x, y, r, t, tStart) => {
  const satCircle = new SAT.Circle(new SAT.Vector(x, y), r);
  return {
    id: G_randomId(),
    x,
    y,
    r,
    t,
    tStart,
    type,
    sent: false,
    update: function() {},
    satCircle,
  };
};

const G_createProjectiles = (
  {
    type,
    speed,
    normalizedVec,
    player,
    pos,
    lifetimeMultiplier,
    accelerationAngle,
  },
  gameData
) => {
  const ret = [];
  let mass = 1;
  let r = 5 / G_SCALE;
  let len = 8000;
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
    b.tStart = gameData.tss;
    return b;
  };

  switch (type) {
    case G_action_spread:
      for (let i = -5; i <= 5; i += 5) {
        let [vx, vy] = G_rotateVectorDeg(normalizedVec, i);
        ret.push(createProjectile(vx, vy));
      }
      break;
    case G_action_planetCracker:
      r = 20 / G_SCALE;
      mass = 10;
      ret.push(createProjectile(vx, vy));
      break;
    case G_action_cluster:
      len = 2000 * lifetimeMultiplier;
      r = 10 / G_SCALE;
      ret.push(createProjectile(vx, vy));
      break;
    case G_action_clusterSpawn:
      r = 4 / G_SCALE;
      len = 1750;
      for (let i = 0; i < 360; i += 20) {
        let [vx, vy] = G_rotateVectorDeg(normalizedVec, i);
        ret.push(createProjectile(vx, vy));
        len += 30;
      }
      break;
    case G_action_boomerang:
      const proj = createProjectile(vx, vy);
      G_body_setUpdateFunction(proj, p => {
        const hedRad = G_toRadians(
          G_getHeadingTowards(p.px, p.py, player.x, player.y)
        );
        const ay = -Math.round(Math.cos(hedRad) * 350);
        const ax = Math.round(Math.sin(hedRad) * 350);
        G_body_setAcceleration(p, ax, ay);
      });
      ret.push(proj);
      break;
    case G_action_move:
      len = 1000;
      r = 15 / G_SCALE;
    default:
      ret.push(createProjectile(vx, vy));
  }
  return ret;
};

const G_createEntities = (gameData, map) => {
  const collidesWithOther = (self, otherId) => {
    const other = G_getEntityFromEntMap(otherId, gameData);
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
      const id = newPlanet.id;
      gameData.planets.push(id);
      gameData.entMap[id] = newPlanet;
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
    if (ctr <= 10) {
      const id = G_randomId();
      newResource.id = id;
      gameData.resources.push(id);
      gameData.entMap[id] = newResource;
    }
  }
};

const G_getCorrespondingWormhole = (wormhole, gameData) => {
  const wormholes = gameData.resources
    .map(resId => G_getEntityFromEntMap(resId, gameData))
    .filter(res => res.type === G_res_wormhole);
  const resIndex = wormholes.indexOf(wormhole);
  if (resIndex % 2 === 0) {
    return wormholes[resIndex + 1];
  } else {
    return wormholes[resIndex - 1];
  }
};
