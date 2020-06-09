/*
global
SAT
G_SCALE
G_G
G_FRAME_MS
G_Body
G_entity
G_res_proximityMine
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
G_createProjectiles
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

const G_applyGravity = (bodies, gravityBodies, extraColliders, dt) => {
  const getAttraction = (self, other) => {
    let { px: sx, py: sy, mass: sMass, r: sr } = self;
    let { px: ox, py: oy, mass: oMass, r: or } = other;
    let dx = ox - sx;
    let dy = oy - sy;
    let d = Math.max(G_dist(dx, dy), 0.001);
    let c = extraColliders ? G_collidesCir(dx, dy, sr, or) : false;
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

    if (extraColliders) {
      for (let j = 0; j < extraColliders.length; j++) {
        let other = extraColliders[j];
        let { x, y, r } = other;
        let c = G_collidesCir(x - body.px, y - body.py, r, body.r);
        if (c && body.meta.player !== other.id) {
          const col = G_createCollision(body, other);
          collisions.push(col);
        }
      }
    }

    body.vx += (totalFx / body.mass) * timeStep + (body.ax * dt) / G_FRAME_MS;
    body.vy += (totalFy / body.mass) * timeStep + (body.ay * dt) / G_FRAME_MS;
    body.px += body.vx * timeStep;
    body.py += body.vy * timeStep;
  }
  return collisions;
};

const G_applyFields = (bodies, gameData) => {
  const response = new SAT.Response();
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    for (let j = 0; j < gameData.fields.length; j++) {
      response.clear();
      const field = G_getEntityFromEntMap(gameData.fields[j]);
      if (SAT.testCirclePolygon(body.satCircle, field.satBox, response)) {
        const col = G_createCollision(body, field, response);
        gameData.collisions.push(col);
      }
    }
  }
};

const G_applyShockwaves = (entities, gameData) => {
  const shockwaves = gameData.shockwaves.map(id =>
    G_getEntityFromEntMap(id, gameData)
  );
  for (let j = 0; j < shockwaves.length; j++) {
    const shockwave = shockwaves[j];
    if (gameData.tss - shockwave.tStart > shockwave.t) {
      console.log('APPLY SHOCKWAVE!', shockwave);
      gameData.shockwaves.splice(j, 1);
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const x = entity.px === undefined ? entity.x : entity.px;
        const y = entity.py === undefined ? entity.y : entity.py;
        const r = entity.r;
        const dx = shockwave.x - x;
        const dy = shockwave.y - y;
        if (G_collidesCir(dx, dy, r, shockwave.r)) {
          gameData.collisions.push(G_createCollision(shockwave, entity));
        }
      }
    }
  }
};

const G_simulate = (gameData, { nowDt }) => {
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
  let { projectiles, planets, players, resources, fields } = currentGameData;
  let collisionCallbacks = [];
  const projectileList = projectiles.map(id =>
    G_getEntityFromEntMap(id, currentGameData)
  );
  const shockwaveList = projectileList
    .concat(players.map(id => G_getEntityFromEntMap(id, currentGameData)))
    .concat(
      resources
        .filter(
          id =>
            G_getEntityFromEntMap(id, currentGameData).type ===
            G_res_proximityMine
        )
        .map(id => G_getEntityFromEntMap(id, currentGameData))
    );
  const bodyList = projectileList.concat(
    planets.map(id => G_getEntityFromEntMap(id, currentGameData))
  );
  const gravityCollidables = players
    .map(id => G_getEntityFromEntMap(id, currentGameData))
    .filter(p => !p.dead)
    .concat(resources.map(id => G_getEntityFromEntMap(id, currentGameData)));
  let collisions = G_applyGravity(
    projectileList,
    bodyList,
    gravityCollidables,
    nowDt
  );
  gameData.collisions = gameData.collisions.concat(collisions);
  G_applyFields(projectileList, gameData);
  G_applyShockwaves(shockwaveList, gameData);
  for (let i = 0; i < gameData.collisions.length; i++) {
    const col = gameData.collisions[i];
    if (col[2]) {
      continue;
    }
    console.log('got a col', col);
    col[2] = true;
    const { remove, cb } = G_handleCollision(col, gameData);
    if (remove) {
      gameData.collisions.splice(i, 1);
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
    if (p.update) {
      p.update(p);
    }
    if (p.meta.remove) {
      projectiles.splice(i, 1);
      delete gameData.entMap[p.id];
      i--;
      continue;
    }
    if (
      gameData.tss - p.tStart >= p.t ||
      !isInBounds(p.px, p.py, p.r, p.r, currentGameData)
    ) {
      const collisionWithNothing = G_createCollision(p, null);
      // handleCollision returns { remove: true } when the collision should be removed
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

  for (let i = 0; i < fields.length; i++) {
    const field = G_getEntityFromEntMap(fields[i], currentGameData);
    if (field.meta.remove) {
      fields.splice(i, 1);
      i--;
    }
  }

  for (let i = 0; i < collisionCallbacks.length; i++) {
    collisionCallbacks[i]();
  }
};
