/*
global
G_SCALE
G_G
G_FRAME_MS
G_Body
G_body_setAcceleration
G_action_spread
G_action_planetCracker
G_action_cluster
G_action_clusterSpawn
G_action_boomerang
G_action_move
G_getEntityFromEntMap
G_applyGravity
G_handleCollision
G_createCollision
G_collidesCir
G_dist
*/

const G_applyAction = (gameData, player, actionObj) => {
  const {
    action,
    speed,
    target: [targetX, targetY],
    auxArgs,
    vec,
    cost,
  } = actionObj;
  const arr = G_createProjectiles(
    {
      type: action,
      speed,
      normalizedVec: vec,
      player,
      ...auxArgs,
    },
    gameData
  );

  arr.forEach(p => {
    gameData.projectiles.push(p.id);
    gameData.entMap[p.id] = p;
  });
  player.target = [targetX, targetY];
  player.funds -= cost;
  player.cost = cost;
  player.actions[action] -= player.actions[action] < 99 ? 1 : 0;
  player.action = action;
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
      len = 2000 * lifetimeMultiplier;
      r = 10 / G_SCALE;
      ret.push(createProjectile(vx, vy));
      break;
    case G_action_clusterSpawn:
      r = 4 / G_SCALE;
      len = 4500;
      for (let i = 0; i < 360; i += 20) {
        let [vx, vy] = rotateVectorDeg(normalizedVec, i);
        ret.push(createProjectile(vx, vy));
        len += 75;
      }
      break;
    case G_action_boomerang:
      accelerationAngle = (parseFloat(accelerationAngle) * Math.PI) / 180;
      const proj = createProjectile(vx, vy);
      const ay = Math.round(Math.cos(accelerationAngle) * 550);
      const ax = Math.round(Math.sin(accelerationAngle) * 550);
      console.log('set accel', ay, ax);
      G_body_setAcceleration(proj, ax, ay);
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
      if (c && other.meta.color !== body.meta.color) {
        const col = G_createCollision(body, other);
        collisions.push(col);
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
        const col = G_createCollision(body, other);
        collisions.push(col);
      }
    }

    body.vx += (totalFx / body.mass) * timeStep + (body.ax * dt) / G_FRAME_MS;
    body.vy += (totalFy / body.mass) * timeStep + (body.ay * dt) / G_FRAME_MS;
    body.px += body.vx * timeStep;
    body.py += body.vy * timeStep;
  }
  return collisions;
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
    const player = G_getEntityFromEntMap(playerId, gameData);
    if (isInBounds(x, y, player.r, player.r, gameData)) {
      player.x = x;
      player.y = y;
    }
  };

  let currentGameData = gameData;
  let { projectiles, planets, players, resources } = currentGameData;
  let collisionCallbacks = [];
  const projectileList = projectiles.map(id =>
    G_getEntityFromEntMap(id, currentGameData)
  );
  const bodyList = projectileList.concat(
    planets.map(id => G_getEntityFromEntMap(id, currentGameData))
  );
  const collidables = players
    .map(id => G_getEntityFromEntMap(id, currentGameData))
    .concat(resources.map(id => G_getEntityFromEntMap(id, currentGameData)));
  let collisions = G_applyGravity(projectileList, bodyList, collidables, nowDt);
  gameData.collisions = gameData.collisions.concat(collisions);
  for (let i = 0; i < collisions.length; i++) {
    const col = collisions[i];
    if (col[2]) {
      continue;
    }
    col[2] = true;
    const { remove, cb } = G_handleCollision(col, gameData);
    if (remove) {
      collisions.splice(i, 1);
      i--;
    }
    if (cb) {
      collisionCallbacks.push(cb);
    }
  }

  for (let i = 0; i < projectiles.length; i++) {
    const p = G_getEntityFromEntMap(projectiles[i], currentGameData);
    if (p.meta.type === G_action_move) {
      const player = G_getEntityFromEntMap(p.meta.player, currentGameData);
      if (player.dead) {
        p.meta.remove = true;
      } else {
        movePlayer(p.meta.player, p.px, p.py, currentGameData);
      }
    }
    if (p.meta.remove) {
      projectiles.splice(i, 1);
      delete gameData.entMap[p.id];
      i--;
      continue;
    }
    if (
      now - startTime >= p.t ||
      !isInBounds(p.px, p.py, p.r, p.r, currentGameData)
    ) {
      const collisionWithNothing = G_createCollision(p, null);
      // handleCollision returns {true} when the collision should be removed
      const { remove, cb } = G_handleCollision(
        collisionWithNothing,
        currentGameData
      );
      if (p.meta.type !== G_action_move && !remove) {
        collisionWithNothing[2] = true;
        currentGameData.collisions.push(collisionWithNothing);
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
    const planet = G_getEntityFromEntMap(planets[i], currentGameData);
    if (planet.meta.remove) {
      planets.splice(i, 1);
      i--;
    }
  }

  for (let i = 0; i < collisionCallbacks.length; i++) {
    collisionCallbacks[i]();
  }
};
