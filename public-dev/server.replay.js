/*
global
storage
G_randomId
*/

const G_replay_createReplay = gameData => {
  const replay = {};
  replay.version = 1.2;
  replay.id = G_randomId();
  replay.date = +new Date();
  replay.name = gameData.name;
  replay.mapName = gameData.mapName;
  replay.initialGameData = JSON.parse(JSON.stringify(gameData));
  replay.rounds = [];
  replay.result = null;
  return replay;
};

const G_replay_createPartialGameData = gameData => {
  return {
    fields: gameData.fields.map(copyField),
    planets: gameData.planets.map(copyBody),
    players: gameData.players.map(copyPlayer),
    resources: gameData.resources.map(copyRes),
  };
};

const G_replay_addRound = (replay, gameData) => {
  replay.rounds.push({
    roundNumber: replay.rounds.length,
    partialGameData: G_replay_createPartialGameData(gameData),
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
    snapshot: {
      timestamp,
      projectiles: gameData.projectiles.map(copyBody),
      collisions: gameData.collisions.map(copyCollision),
      fields: gameData.fields.map(copyField),
    },
  });
};

const G_replay_saveReplay = async replay => {
  try {
    let replays = await storage.get('replays');
    if (!replays) {
      replays = [];
    }
    if (replays.length > 25) {
      replays.shift();
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

const copyCollision = ([body, other]) => {
  return [
    {
      ...body,
      meta: {
        ...body.meta,
      },
    },
    other ? { ...other } : null,
  ];
};
