/*
global
G_AU
G_controller_collisionMap
G_getEntityFromEntMap
G_getEntityType
G_entity
G_action_planetCracker
G_action_move
G_action_clusterSpawn
G_action_waveBomb
G_view_getElementById
G_view_worldToPx
G_view_getColor
G_view_playSound
G_view_createTextParticle
G_view_createLargeExplosion
G_view_createExplosion
G_view_createShockwave
G_view_createWormholeParticle
*/

const G_controller_handleCollisions = gameData => {
  let collisions = gameData.collisions;
  let len = collisions.length;

  const removeResourceFromDOM = resourceId => {
    const parent = (G_view_getElementById('res-' + resourceId) || {})
      .parentElement;
    if (parent) {
      parent.remove();
      return true;
    } else {
      return false;
    }
  };

  if (len) {
    for (let i = 0; i < len; i++) {
      const [projectileId, otherId, , collisionId] = collisions[i];
      if (G_controller_collisionMap[collisionId]) {
        continue;
      }
      G_controller_collisionMap[collisionId] = true;

      const projectile = G_getEntityFromEntMap(projectileId, gameData);
      if (!projectile) {
        console.warn('no projectile with id', projectileId);
        continue;
      }
      const other = G_getEntityFromEntMap(otherId, gameData);
      if (!projectile) {
        console.warn('no other entity exists with id', otherId);
        return;
      }
      const { x, y } = G_view_worldToPx(
        projectile.px || projectile.x,
        projectile.py || projectile.y
      );
      const player =
        G_getEntityFromEntMap(
          projectile.meta && projectile.meta.player,
          gameData
        ) || {};
      const textColor = G_view_getColor('light', player.color);

      // collision with a neutral shockwave
      const projectileEntityType = G_getEntityType(projectile);
      if (
        projectileEntityType === G_entity.shockwave &&
        Object.keys(player).length === 0
      ) {
        switch (G_getEntityType(other)) {
          case G_entity.player: {
            // ignore collisions with self
            if (projectile.meta && projectile.meta.player === other.id) {
              continue;
            }
            G_view_playSound('playerDead');
            const otherPlayer = G_getEntityFromEntMap(other.id, gameData);
            const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
            otherPlayer.dead = true;
            G_view_createTextParticle(otherX, otherY, 'Eliminated!', textColor);
            G_view_createLargeExplosion(
              otherPlayer.x,
              otherPlayer.y,
              G_AU / 2,
              7
            );
            if (projectile.meta.type === G_action_waveBomb) {
              const { x, y } = G_view_worldToPx(projectile.px, projectile.py);
              G_view_playSound('explWave');
              G_view_createShockwave(x, y, player.color);
              return;
            }
            break;
          }
          case G_entity.proximityMine: {
            G_view_playSound('hitProx');
            const { x: px, y: py } = G_view_worldToPx(other.x, other.y);
            G_view_createShockwave(px, py);
            removeResourceFromDOM(other.id);
            break;
          }
        }
        continue;
      }

      switch (G_getEntityType(other)) {
        case G_entity.player: {
          // ignore collisions with self
          if (projectile.meta && projectile.meta.player === other.id) {
            continue;
          }
          G_view_playSound('playerDead');
          const otherPlayer = G_getEntityFromEntMap(other.id, gameData);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          otherPlayer.dead = true;
          G_view_createTextParticle(otherX, otherY, 'Eliminated!', textColor);
          G_view_createLargeExplosion(
            otherPlayer.x,
            otherPlayer.y,
            G_AU / 2,
            7
          );
          if (projectile.meta.type === G_action_waveBomb) {
            const { x, y } = G_view_worldToPx(projectile.px, projectile.py);
            G_view_playSound('explWave');
            G_view_createShockwave(x, y, player.color);
            return;
          }
          break;
        }
        case G_entity.projectile: {
          if (gameData.projectiles.includes(projectile.id)) {
            G_view_playSound('expl');
          } else if (projectile.meta.type === G_action_waveBomb) {
            const { x, y } = G_view_worldToPx(projectile.px, projectile.py);
            G_view_createShockwave(x, y);
            return;
          } else {
            G_view_playSound('explProjEat');
          }
          G_view_createExplosion(x, y);
          break;
        }
        case G_entity.coin: {
          G_view_playSound('coin');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(
            otherX,
            otherY,
            '+$' + other.value,
            textColor
          );
          break;
        }
        case G_entity.spray: {
          G_view_playSound('getSpreadFire');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(otherX, otherY, '+2 SpreadFire', textColor);
          break;
        }
        case G_entity.planetCracker: {
          G_view_playSound('getPC');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(
            otherX,
            otherY,
            '+2 PlanetCracker',
            textColor
          );
          break;
        }
        case G_entity.cluster: {
          G_view_playSound('getCluster');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(
            otherX,
            otherY,
            '+2 ClusterBomb',
            textColor
          );
          break;
        }
        case G_entity.wave: {
          G_view_playSound('getWave');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(otherX, otherY, '+2 Wave Bomb', textColor);
          break;
        }
        case G_entity.boomerang: {
          G_view_playSound('getBoom');
          G_view_createExplosion(x, y);
          removeResourceFromDOM(other.id);
          const { x: otherX, y: otherY } = G_view_worldToPx(other.x, other.y);
          G_view_createTextParticle(otherX, otherY, '+2 Boomerang', textColor);
          break;
        }
        case G_entity.planet: {
          if (projectile.meta.type === G_action_planetCracker) {
            G_view_playSound('explLarge2');
            G_view_createLargeExplosion(other.px, other.py, G_AU, 30);
          } else if (projectile.meta.type === G_action_move) {
            G_view_playSound('playerDead2');
            player.dead = true;
            G_view_createTextParticle(x, y, 'Eliminated!', textColor);
            G_view_createLargeExplosion(player.x, player.y, G_AU / 2, 10);
          } else if (projectile.meta.type === G_action_waveBomb) {
            const { x, y } = G_view_worldToPx(projectile.px, projectile.py);
            G_view_playSound('explWave');
            G_view_createShockwave(x, y, player.color);
          } else {
            G_view_playSound('expl');
            G_view_createExplosion(x, y);
          }
          break;
        }
        case G_entity.wormhole: {
          G_view_playSound('wormhole');
          const { x: prevX, y: prevY } = G_view_worldToPx(
            projectile.meta.prevX,
            projectile.meta.prevY
          );
          G_view_createWormholeParticle(x, y);
          G_view_createWormholeParticle(prevX, prevY);
          break;
        }
        case G_entity.proximityMine: {
          G_view_playSound('hitProx');
          const { x: px, y: py } = G_view_worldToPx(other.x, other.y);
          G_view_createShockwave(px, py);
          removeResourceFromDOM(other.id);
          break;
        }
        case G_entity.nothing:
        default: {
          if (projectile.meta.type === G_action_clusterSpawn) {
            G_view_playSound('explC');
          } else if (projectile.meta.type === G_action_waveBomb) {
            const { x, y } = G_view_worldToPx(projectile.px, projectile.py);
            G_view_playSound('explWave');
            G_view_createShockwave(x, y, player.color);
            return;
          } else {
            G_view_playSound('expl');
          }
          G_view_createExplosion(x, y);
        }
      }
    }
  }
};
