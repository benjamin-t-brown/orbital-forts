/*
global
G_SCALE
G_SPEEDS
G_Body
G_action_spread
G_action_planetCracker
G_action_cluster
G_action_clusterSpawn
G_action_waveBomb
G_action_move
G_action_boomerang
G_entity
G_getEntityType
G_getEntityFromEntMap
G_applyGravity
G_handleCollision
G_res_proximityMine
G_randomId
G_createProjectiles
G_getNormalizedVec
G_getCorrespondingWormhole
G_Shockwave
G_res_shockwave
*/

const removeResource = (id, gameData) => {
  const ind = gameData.resources.indexOf(id);
  if (ind > -1) {
    gameData.resources.splice(ind, 1);
  }
};

// Used for both WaveBomb and Proximity shockwaves
const createShockwaveCb = (x, y, player, gameData) => {
  return () => {
    const shockwave = G_Shockwave(
      G_res_shockwave,
      x,
      y,
      125 / G_SCALE,
      250,
      gameData.tss
    );
    shockwave.meta = {
      player: player && player.id,
      type: G_entity.shockwave,
    };
    gameData.entMap[shockwave.id] = shockwave;
    gameData.shockwaves.push(shockwave.id);
  };
};

const createClusterSpawnCb = (projectile, player, gameData) => {
  return () => {
    const newProjectiles = G_createProjectiles(
      {
        type: G_action_clusterSpawn,
        speed: G_SPEEDS.Normal[0],
        normalizedVec: [0, 1],
        player,
        pos: { x: projectile.px, y: projectile.py },
      },
      gameData
    );
    newProjectiles.forEach(p => {
      gameData.projectiles.push(p.id);
      gameData.entMap[p.id] = p;
    });
  };
};

const G_handleCollision = (c, gameData) => {
  const [entityId, otherId] = c;
  const projectile = G_getEntityFromEntMap(entityId, gameData);
  if (!projectile) {
    console.warn('no projectile or shockwave exists with id', entityId);
    return;
  }
  const other = G_getEntityFromEntMap(otherId, gameData);
  if (!projectile) {
    console.warn('no other entity exists with id', otherId);
    return;
  }
  let player;
  let type;
  if (projectile.meta) {
    type = projectile.meta.type;
    if (projectile.meta.player) {
      player = G_getEntityFromEntMap(projectile.meta.player, gameData);
    }
  }

  return G_handleCollisionStandard({
    projectile,
    other,
    player,
    type,
    gameData,
  });
};

const G_handleCollisionStandard = ({
  projectile,
  other,
  player,
  type,
  gameData,
}) => {
  const projectileEntityType = G_getEntityType(projectile);
  const otherEntityType = G_getEntityType(other);
  if (projectileEntityType === G_entity.shockwave && !player) {
    switch (otherEntityType) {
      case G_entity.player: {
        console.log('COL NEUTRAL shockwave with player', projectile, other);
        const player2 = G_getEntityFromEntMap(other.id, gameData);
        console.log('player died from a shockwave');
        player2.dead = true;
        break;
      }
      case G_entity.proximityMine: {
        console.log(
          'COL NEUTRAL shockwave with proximity mine',
          projectile,
          other
        );
        removeResource(other.id, gameData);
        return {
          cb: createShockwaveCb(other.x, other.y, null, gameData),
        };
      }
    }
    return {};
  }

  switch (otherEntityType) {
    // if a projectile hits a player, that player is dead
    case G_entity.player:
      console.log('COL with player', projectile, other);
      const player2 = G_getEntityFromEntMap(other.id, gameData);
      player2.dead = true;
      projectile.meta.remove = true;
      if (type === G_action_cluster) {
        return {
          cb: createClusterSpawnCb(projectile, player, gameData),
        };
      }
      break;
    // if a projectile hits another projectile, check mass and speed.  If other's mass/speed is same or less, remove other.
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
          cb: createClusterSpawnCb(projectile, player, gameData),
        };
      }
      if (type === G_action_waveBomb) {
        return {
          cb: createShockwaveCb(other.x, other.y, player, gameData),
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
    case G_entity.boomerang:
      console.log('COL with boomerang', projectile, other);
      player.actions[G_action_boomerang] += 2;
      removeResource(other.id, gameData);
      break;
    case G_entity.wave:
      console.log('COL with wave bomb', projectile, other);
      player.actions[G_action_waveBomb] += 2;
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
          cb: createClusterSpawnCb(projectile, player, gameData),
        };
      } else if (type === G_action_waveBomb) {
        return {
          cb: createShockwaveCb(other.x, other.y, player, gameData),
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
    case G_entity.proximityMine:
      console.log('COL with proximity mine', projectile, other);
      removeResource(other.id, gameData);
      projectile.meta.remove = true;
      if (type === G_action_move) {
        console.log('Player died by running into a proximity mine');
        player.dead = true;
      }
      return {
        cb: createShockwaveCb(other.x, other.y, null, gameData),
      };
    case G_entity.nothing:
      if (type === G_action_cluster) {
        return {
          cb: createClusterSpawnCb(projectile, player, gameData),
        };
      } else if (type === G_action_waveBomb) {
        return {
          cb: createShockwaveCb(projectile.px, projectile.py, player, gameData),
        };
      }
  }
  return {};
};
