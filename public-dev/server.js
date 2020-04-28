/*
global
G_R_CREATE
G_R_JOIN
G_R_LEAVE
G_R_START
G_R_SET_MAP_INDEX
G_R_CONFIRM_ACTION
G_S_CONNECTED
G_S_LIST_UPDATED
G_S_START
G_S_CREATE
G_S_LEAVE
G_S_LOBBY_LIST_UPDATED
G_S_JOIN
G_S_STOP
G_S_BROADCAST
G_SCALE
G_AU
G_FRAME_MS
G_Body
G_Game
G_applyGravity
G_maps
*/

const G_users = {};

const User = socket => {
  // [socket, game, userName]
  return [socket, '', ''];
};

const G_user_getId = user => user[0].id;
const G_user_getName = user => user[2] || G_user_getId(user);
const G_user_setName = (user, name) => (user[2] = name);
const G_user_getGame = user => user[1];
const G_user_setGame = (user, game) => (user[1] = game);
const G_user_unsetGame = user => (user[1] = null);
const G_user_errorGameExists = user => `Game exists: ${G_user_getName(user)}`;
const G_user_errorGameDoesNotExist = user => `No game: ${G_user_getName(user)}`;

const G_S_createMessageSocket = (payload, err) => {
  return [payload, err];
};

const G_S_createMessageRest = (payload, err) => {
  return JSON.stringify([payload, err]);
};

const G_S_randomId = () => (+new Date() * Math.random()).toString(16);

const G_S_wrapTryCatch = cb => {
  return (req, res) => {
    try {
      cb(req, res);
    } catch (e) {
      console.error('ERROR', e.stack);
      res.send(G_S_createMessageRest(null, 'Error.'));
    }
  };
};

const G_S_getUserById = id => {
  return G_users[id];
};

const G_S_getGameById = gameId =>
  G_S_getAllGames().reduce(
    (game, currGame) => (currGame.id === gameId ? currGame : game),
    null
  );

const G_S_getAllGames = () => {
  const games = [];
  const _hasGame = id => {
    for (let i = 0; i < games.length; i++) {
      let g = games[i];
      if (g.id === id) {
        return true;
      }
    }
  };
  for (const i in G_users) {
    const game = G_user_getGame(G_users[i]);
    if (!game) {
      continue;
    }
    if (!_hasGame(game.id)) {
      games.push(game);
    }
  }
  return games;
};
const G_S_getAllLobbies = () => {
  return G_S_getAllGames().filter(game => {
    return !game.isStarted() && !game.isPractice();
  });
};

const G_S_emitAllUsers = (type, obj, userIdIgnore) => {
  for (const i in G_users) {
    if (i === userIdIgnore) {
      continue;
    }
    const [socket] = G_users[i];
    socket.emit(type, obj);
  }
};

const G_S_sendUpdateGameList = () => {
  G_S_emitAllUsers(
    G_S_LIST_UPDATED,
    G_S_createMessageSocket(G_S_getAllLobbies())
  );
};

const G_S_assertUser = (id, res) => {
  const user = G_S_getUserById(id);
  if (!user) {
    res.send(G_S_createMessageRest(null, `No user: ${id}`));
    return false;
  }
  return user;
};

const G_S_removeUser = user => {
  const [id, game] = user;
  if (game) {
    game.leave(user);
  }
  delete G_users[id];
};

const server = {
  [G_R_CREATE + '/:id/:userName/:isPractice']: G_S_wrapTryCatch((req, res) => {
    const { id, userName, isPractice } = req.params;
    const user = G_S_assertUser(id, res);
    if (!user) {
      return;
    }
    if (!userName) {
      res.send(G_S_createMessageRest(null, 'No given userName.'));
      return;
    }
    const game = G_user_getGame(user);
    if (!game) {
      G_user_setName(user, userName);
      const gameName = `${userName}'s Game`;
      console.log('Create game', gameName, isPractice);
      const g = G_Game(user, gameName);
      G_user_setGame(user, g);
      if (isPractice === 'true') {
        g.setMapIndex(-1);
      }
      res.send(G_S_createMessageRest({ id: g.id, name: gameName }));
      G_S_sendUpdateGameList();
    } else {
      res.send(G_S_createMessageRest(null, G_user_errorGameExists(user)));
    }
  }),
  [G_R_JOIN + '/:id/:args']: G_S_wrapTryCatch((req, res) => {
    const { id, args } = req.params;
    const i = args.indexOf(',');
    const gameId = args.slice(0, i);
    const userName = args.slice(i + 1);
    const user = G_S_assertUser(id, res);
    if (!user) {
      return;
    }
    const game = G_S_getGameById(gameId);
    if (game) {
      G_user_setGame(user, game);
      G_user_setName(user, userName);
      console.log('Join game', G_user_getName(user), game.name);
      if (game.join(user)) {
        res.send(
          G_S_createMessageRest({
            id: game.id,
            name: game.name,
            players: game.getPlayers(),
          })
        );
        G_S_sendUpdateGameList();
      } else {
        res.send(G_S_createMessageRest(null, `Cannot join.`));
      }
    } else {
      res.send(G_S_createMessageRest(null, G_user_errorGameExists(user)));
    }
  }),
  [G_R_LEAVE + '/:id']: G_S_wrapTryCatch((req, res) => {
    const { id } = req.params;
    const user = G_S_assertUser(id, res);
    if (!user) {
      return;
    }
    const game = G_user_getGame(user);
    if (game) {
      console.log('Leave game', G_user_getName(user), game.name);
      G_user_unsetGame(user, game);
      game.leave(user);
      res.send(G_S_createMessageRest(game.id));
      G_S_sendUpdateGameList();
    } else {
      res.send(G_S_createMessageRest(null, G_user_errorGameExists(user)));
    }
  }),
  [G_R_START + '/:id/:mapIndex']: G_S_wrapTryCatch((req, res) => {
    const { id, mapIndex } = req.params;
    const user = G_S_assertUser(id, res);
    if (!user) {
      return;
    }
    const game = G_user_getGame(user);
    if (game) {
      if (game.canStart()) {
        console.log('Start game', game.name);
        res.send(G_S_createMessageRest(true));
        game.setMapIndex(Number(mapIndex));
        game.start();
        G_S_sendUpdateGameList();
      } else {
        res.send(G_S_createMessageRest(null, 'Cannot start yet.'));
      }
    } else {
      console.log('error', G_S_getAllLobbies());
      res.send(G_S_createMessageRest(null, G_user_errorGameDoesNotExist(user)));
    }
  }),
  [G_R_CONFIRM_ACTION + '/:id/:action/:args']: G_S_wrapTryCatch((req, res) => {
    const { id, action, args } = req.params;
    const user = G_S_assertUser(id, res);
    if (!user) {
      return;
    }

    const game = G_user_getGame(user);
    if (game) {
      if (game.isStarted()) {
        console.log(
          'Confirm action',
          game.name,
          G_user_getName(user),
          action,
          args
        );
        if (game.confirmAction(action, args, user)) {
          res.send(G_S_createMessageRest(true));
        } else {
          res.send(G_S_createMessageRest(null, 'Cannot confirm.'));
        }
      } else {
        res.send(G_S_createMessageRest(null, 'Game not started.'));
      }
    } else {
      res.send(G_S_createMessageRest(null, G_user_errorGameDoesNotExist(user)));
    }
  }),
  io: socket => {
    const user = User(socket);
    G_users[socket.id] = user;

    socket.on(
      'disconnect',
      G_S_wrapTryCatch(() => {
        console.log('Disconnected: ' + socket.id);
        G_S_removeUser(user);
      })
    );
    const key = G_S_randomId();

    socket.emit(
      G_S_CONNECTED,
      G_S_createMessageSocket({
        games: G_S_getAllLobbies(),
        maps: G_maps,
        id: socket.id,
        key,
      })
    );

    console.log('Connected: ' + socket.id, key);
  },
};

module.exports = server;
