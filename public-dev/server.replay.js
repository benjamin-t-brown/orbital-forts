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
  replay.version = 2.0;
  replay.id = G_randomId();
  replay.date = +new Date();
  replay.name = gameData.name;
  replay.mapName = gameData.mapName;
  replay.initialGameData = JSON.parse(JSON.stringify(gameData));
  replay.rounds = [];
  replay.result = null;
  return replay;
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
  return {
    ...f,
  };
};

const copyBody = b => {
  return {
    ...b,
    meta: {
      ...b.meta,
    },
  };
};

const copyEntity = entity => {
  const entityType = G_getEntityType(entity);
  switch (entityType) {
    case G_entity.player:
      return copyPlayer(entity);
    case G_entity.projectile:
    case G_entity.planet:
      return copyBody(entity);
    default:
      return copyRes(entity);
  }
};

const copyCollision = col => {
  const [bodyId, otherId, srv, id] = col || [];
  return [bodyId, otherId, srv, id];
};
