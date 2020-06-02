/*
global
G_SCALE
G_SPEEDS
G_Body
G_action_spread
G_action_planetCracker
G_action_cluster
G_action_clusterSpawn
G_action_move
G_action_boomerang
G_entity
G_getEntityFromEntMap
G_applyGravity
G_handleCollision
G_createCollision
G_res_coin
G_res_spray
G_res_planetCracker
G_res_cluster
G_res_wormhole
G_res_boomerang
G_randomId
G_createProjectiles
G_getNormalizedVec
G_getCorrespondingWormhole
*/

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
    default:
      console.log('Unknown entity', object);
      return G_entity.nothing;
  }
};

const G_createCollision = (self, other) => {
  return [self.id, (other && other.id) || 0, false, G_randomId()];
};

const G_handleCollision = (c, gameData) => {
  const removeResource = (id, gameData) => {
    const ind = gameData.resources.indexOf(id);
    if (ind > -1) {
      gameData.resources.splice(ind, 1);
    }
  };
  const createClusterSpawnFunc = (projectile, player, gameData) => {
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

  const [projectileId, otherId] = c;
  const projectile = G_getEntityFromEntMap(projectileId, gameData);
  if (!projectile) {
    console.warn('no projectile exists with id', projectileId);
    return;
  }
  const other = G_getEntityFromEntMap(otherId, gameData);
  if (!projectile) {
    console.warn('no other entity exists with id', otherId);
    return;
  }
  let player = G_getEntityFromEntMap(projectile.meta.player, gameData);
  let type = projectile.meta.type;

  switch (G_getEntityType(other)) {
    // if a projectile hits a player, that player is dead
    case G_entity.player:
      console.log('COL with player', projectile, other);
      const player2 = G_getEntityFromEntMap(other.id, gameData);
      player2.dead = true;
      projectile.meta.remove = true;
      if (type === G_action_cluster) {
        return {
          cb: createClusterSpawnFunc(projectile, player, gameData),
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
    case G_entity.boomerang:
      console.log('COL with boomerang', projectile, other);
      player.actions[G_action_boomerang] += 2;
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
