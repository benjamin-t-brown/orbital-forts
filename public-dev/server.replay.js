/*
global
storage
G_randomId
G_getEntityType
G_entity
G_getEntityFromEntMap
*/

const G_replay_createReplay = gameData => {
  const replay = {};
  replay.version = 2.1;
  replay.id = G_randomId();
  replay.date = +new Date();
  replay.name = gameData.name;
  replay.mapName = gameData.mapName;
  replay.mode = gameData.mode;
  replay.initialGameData = G_replay_copyGameData(gameData);
  replay.rounds = [];
  replay.result = null;
  return replay;
};

const G_replay_copyGameData = gameData => {
  const entMap = {};

  for (let i in gameData.entMap) {
    entMap[i] = copyEntity(gameData.entMap[i]);
  }
  return {
    ...gameData,
    entMap,
    collisions: gameData.collisions.map(copyCollision),
    fields: gameData.fields.slice(),
    planets: gameData.planets.slice(),
    players: gameData.players.slice(),
    resources: gameData.resources.slice(),
    projectiles: gameData.projectiles.slice(),
  };
};

const G_replay_createDynamicGameData = gameData => {
  const partialEntMap = {};

  gameData.players.forEach(playerId => {
    partialEntMap[playerId] = copyEntity(
      G_getEntityFromEntMap(playerId, gameData)
    );
  });

  gameData.projectiles.forEach(projectileId => {
    partialEntMap[projectileId] = copyEntity(
      G_getEntityFromEntMap(projectileId, gameData)
    );
  });

  // this might break...
  gameData.shockwaves.forEach(shockwaveId => {
    const shockwave = G_getEntityFromEntMap(shockwaveId, gameData);
    if (!shockwave.sent) {
      shockwaveId.sent = true;
      partialEntMap[shockwaveId] = copyEntity(
        G_getEntityFromEntMap(shockwaveId, gameData)
      );
    }
  });

  return {
    partialEntMap,
    collisions: gameData.collisions.map(copyCollision),
    fields: gameData.fields.slice(),
    planets: gameData.planets.slice(),
    players: gameData.players.slice(),
    resources: gameData.resources.slice(),
    projectiles: gameData.projectiles.slice(),
  };
};

const G_replay_createSnapShotGameData = (timestamp, gameData) => {
  return {
    timestamp,
    projectiles: gameData.projectiles.map(copyBody),
    collisions: gameData.collisions.map(copyCollision),
  };
};

const G_replay_addRound = (replay, gameData) => {
  replay.rounds.push({
    roundNumber: replay.rounds.length,
    dynamicGameData: G_replay_createDynamicGameData(gameData),
    actions: {},
    snapshots: [],
  });
};

const G_replay_addConfirmActionForPlayer = (
  replay,
  player,
  { action, speed, vec, cost, target }
) => {
  const round = replay.rounds[replay.rounds.length - 1];
  round.actions[player.id] = {
    action,
    speed,
    vec,
    cost,
    target,
  };
};

const G_replay_addSnapshotToRound = (replay, timestamp, gameData) => {
  const round = replay.rounds[replay.rounds.length - 1];
  round.snapshots.push({
    timestamp,
    dynamicGameData: G_replay_createDynamicGameData(gameData),
  });
};

const G_replay_saveReplay = async replay => {
  try {
    let replays = await storage.get('replays');
    if (!replays) {
      replays = [];
    }
    if (replays.length > 10) {
      replays = replays.slice(-9);
    }
    replays.push(replay);
    await storage.set('replays', replays);
    console.log('replay saved', replay.name, replays.length);
  } catch (e) {
    console.error('error saving replay', e.stack);
  }
};

const G_replay_getReplay = async id => {
  try {
    let replays = await storage.get('replays');
    if (!replays) {
      replays = [];
    }
    return replays.find(r => r.id === id);
  } catch (e) {
    console.error('error getting replay', e.stack);
  }
};

const G_replay_getReplaysList = async () => {
  try {
    let replays = await storage.get('replays');
    if (!replays) {
      replays = [];
    }
    return replays.map(r => ({
      name: r.name,
      date: r.date,
      mapName: r.mapName,
    }));
  } catch (e) {
    console.error('error getting replay list', e.stack);
  }
};

const copyPlayer = p => {
  return {
    ...p,
    actions: {
      ...p.actions,
    },
  };
};

const copyRes = r => {
  return {
    ...r,
  };
};

const copyField = f => {
  const obj = {
    ...f,
  };
  delete obj.satBox;
  return obj;
};

const copyShockwave = s => {
  const obj = {
    ...s,
  };
  delete obj.satCircle;
  delete obj.sent;
  return obj;
};

const copyBody = b => {
  const obj = {
    ...b,
    meta: {
      ...b.meta,
    },
  };
  delete obj.satCircle;
  delete obj.update;
  return obj;
};

const copyCollision = col => {
  const [bodyId, otherId, srv, id] = col || [];
  return [bodyId, otherId, srv, id];
};

const copyEntity = entity => {
  const isField = entity => {
    return [G_entity.wall].includes(entity.type);
  };
  const isShockwave = entity => {
    return [G_entity.proximityShockwave].includes(entity.type);
  };

  const entityType = G_getEntityType(entity);
  switch (entityType) {
    case G_entity.player:
      return copyPlayer(entity);
    case G_entity.projectile:
    case G_entity.planet:
      return copyBody(entity);
    default:
      if (isField(entity)) {
        return copyField(entity);
      } else if (isShockwave(entity)) {
        return copyShockwave(entity);
      }
      return copyRes(entity);
  }
};
