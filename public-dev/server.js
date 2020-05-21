/*
global
G_R_CREATE
G_R_JOIN
G_R_LEAVE
G_R_START
G_R_UPDATE_LOBBY
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
G_randomId
G_getMaps
*/

const G_MAX_GAMES = 10;
const G_MAX_PLAYERS_PER_GAME = 4;

const G_users = {};

const User = (socket, key) => {
  // [socket, game, userName, key]
  return [socket, '', '', key];
};

const G_user_getId = user => user[0].id;
const G_user_getKey = user => user[3];
const G_user_getName = user => user[2];
const G_user_setName = (user, name) => (user[2] = name);
const G_user_getGame = user => user[1];
const G_user_setGame = (user, game) => (user[1] = game);
const G_user_unsetGame = user => (user[1] = null);
const G_user_errorGameExists = user =>
  `User in another game: ${G_user_getName(user)}`;
const G_user_errorGameDoesNotExist = user =>
  `No game for user: ${G_user_getName(user)}`;
const G_user_errorMaxGamesExceeded = user =>
  `Max games supported exceeded: ${G_user_getName(user)}`;

const G_socket_createMessageSocket = (payload, err) => {
  return [payload, err];
};

const G_socket_createMessageRest = (payload, err) => {
  return JSON.stringify([payload, err]);
};

const G_socket_randomId = () => (+new Date() * Math.random()).toString(16);

const G_socket_wrapTryCatch = cb => {
  return async (req, res) => {
    try {
      await cb(req, res);
    } catch (e) {
      console.error('ERROR', e.stack);
      res.send(G_socket_createMessageRest(null, 'Error.'));
    }
  };
};

const G_socket_getUserById = id => {
  return G_users[id];
};

const G_socket_getGameById = gameId =>
  G_socket_getAllGames().reduce(
    (game, currGame) => (currGame.id === gameId ? currGame : game),
    null
  );

const G_socket_getAllGames = () => {
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
const G_socket_getAllLobbies = () => {
  return G_socket_getAllGames().filter(game => {
    return (
      !game.isStarted() &&
      !game.isPractice() &&
      game.getPlayers().length < G_MAX_PLAYERS_PER_GAME
    );
  });
};
const G_socket_getNumberOfGames = () => {
  return G_socket_getAllGames().length;
};

const G_socket_emitAllUsers = (type, obj, userIdIgnore) => {
  for (const i in G_users) {
    if (i === userIdIgnore) {
      continue;
    }
    const [socket] = G_users[i];
    socket.emit(type, obj);
  }
};

const G_socket_sendUpdateGameList = () => {
  G_socket_emitAllUsers(
    G_S_LIST_UPDATED,
    G_socket_createMessageSocket(G_socket_getAllLobbies())
  );
};

const G_socket_assertUser = (id, req, res) => {
  const user = G_socket_getUserById(id);
  if (!user) {
    res.send(G_socket_createMessageRest(null, `No user: id=${id}`));
    return false;
  }
  const userKey = G_user_getKey(user);
  const headerKey = req.headers.key;
  if (userKey !== headerKey) {
    res.send(
      G_socket_createMessageRest(null, `Unauthorized (invalid key): id=${id}`)
    );
    return false;
  }
  return user;
};

const G_socket_removeUser = user => {
  const [id, game] = user;
  if (game) {
    game.leave(user);
  }
  delete G_users[id];
};

const server = {
  [G_R_CREATE + '/:id/:userName/:isPractice']: G_socket_wrapTryCatch(
    async (req, res) => {
      const { id, userName, isPractice } = req.params;
      const user = G_socket_assertUser(id, req, res);
      if (!user) {
        return;
      }
      if (!userName) {
        res.send(G_socket_createMessageRest(null, 'No given userName.'));
        return;
      }
      const game = G_user_getGame(user);
      if (game) {
        res.send(
          G_socket_createMessageRest(null, G_user_errorGameExists(user))
        );
        return;
      }
      if (G_socket_getNumberOfGames() >= G_MAX_GAMES) {
        res.send(
          G_socket_createMessageRest(null, G_user_errorMaxGamesExceeded(user))
        );
        return;
      }
      G_user_setName(user, userName);
      const gameName = `${userName}'s Game`;
      console.log('Create game', gameName, 'isPractice=' + isPractice);
      const g = G_Game(user, gameName);
      G_user_setGame(user, g);
      if (isPractice === 'true') {
        await g.setPractice();
      }
      res.send(
        G_socket_createMessageRest({
          id: g.id,
          name: gameName,
          lobbyData: g.getLobbyData(),
        })
      );
      G_socket_sendUpdateGameList();
    }
  ),
  [G_R_UPDATE_LOBBY + '/:id/:args']: G_socket_wrapTryCatch(async (req, res) => {
    const { id, args } = req.params;
    const [mapIndex] = args.split(',');
    const user = G_socket_assertUser(id, req, res);
    if (!user) {
      return;
    }

    const game = G_user_getGame(user);
    if (!game) {
      res.send(
        G_socket_createMessageRest(null, G_user_errorGameDoesNotExist(user))
      );
      return;
    }
    await game.setMapIndex(mapIndex);
    game.updateLobby();
    res.send(
      G_socket_createMessageRest({
        id: game.id,
        name: game.name,
        lobbyData: game.getLobbyData(),
      })
    );
  }),
  [G_R_JOIN + '/:id/:args']: G_socket_wrapTryCatch(async (req, res) => {
    const { id, args } = req.params;
    const i = args.indexOf(',');
    const gameId = args.slice(0, i);
    const userName = args.slice(i + 1);
    const user = G_socket_assertUser(id, req, res);
    if (!user) {
      return;
    }
    console.log('JOIN', id, args);
    const game = G_socket_getGameById(gameId);
    if (!game) {
      console.log('no game found');
      res.send(
        G_socket_createMessageRest(null, G_user_errorGameDoesNotExist(user))
      );
      return;
    }

    G_user_setGame(user, game);
    G_user_setName(user, userName);
    console.log('Join game', G_user_getName(user), game.name);
    const joinSuccessful = await game.join(user);
    if (!joinSuccessful) {
      res.send(G_socket_createMessageRest(null, `Cannot join.`));
      return;
    }

    res.send(
      G_socket_createMessageRest({
        id: game.id,
        name: game.name,
        lobbyData: game.getLobbyData(),
      })
    );
    G_socket_sendUpdateGameList();
  }),
  [G_R_LEAVE + '/:id']: G_socket_wrapTryCatch((req, res) => {
    const { id } = req.params;
    const user = G_socket_assertUser(id, req, res);
    if (!user) {
      return;
    }
    const game = G_user_getGame(user);
    if (!game) {
      res.send(
        G_socket_createMessageRest(null, G_user_errorGameDoesNotExist(user))
      );
      return;
    }
    console.log('Leave game', G_user_getName(user), game.name);
    G_user_unsetGame(user, game);
    game.leave(user);
    res.send(G_socket_createMessageRest(game.id));
    G_socket_sendUpdateGameList();
  }),
  [G_R_START + '/:id/:mapIndex']: G_socket_wrapTryCatch(async (req, res) => {
    const { id, mapIndex } = req.params;
    const user = G_socket_assertUser(id, req, res);
    if (!user) {
      return;
    }
    const game = G_user_getGame(user);
    if (!game) {
      res.send(
        G_socket_createMessageRest(null, G_user_errorGameDoesNotExist(user))
      );
      return;
    }
    if (!game.canStart()) {
      res.send(G_socket_createMessageRest(null, 'Cannot start yet.'));
      return;
    }

    console.log(
      'Start game',
      G_user_getName(user),
      'name=' + game.name,
      'mapIndex=' + mapIndex
    );
    res.send(G_socket_createMessageRest(true));
    await game.setMapIndex(Number(mapIndex));
    await game.start();
    G_socket_sendUpdateGameList();
  }),
  [G_R_CONFIRM_ACTION + '/:id/:action/:args']: G_socket_wrapTryCatch(
    (req, res) => {
      const { id, action, args } = req.params;
      const user = G_socket_assertUser(id, req, res);
      if (!user) {
        return;
      }

      const game = G_user_getGame(user);
      if (!game) {
        res.send(
          G_socket_createMessageRest(null, G_user_errorGameDoesNotExist(user))
        );
        return;
      }

      if (!game.isStarted()) {
        res.send(G_socket_createMessageRest(null, 'Game not started.'));
        return;
      }

      const actionWasConfirmed = game.confirmAction(action, args, user);
      if (!actionWasConfirmed) {
        res.send(G_socket_createMessageRest(null, 'Cannot confirm.'));
        return;
      }

      console.log(
        'Confirm action',
        game.name,
        G_user_getName(user),
        action,
        args
      );

      res.send(G_socket_createMessageRest(true));
    }
  ),
  io: async socket => {
    const key = G_randomId();
    const user = User(socket, key);
    G_users[socket.id] = user;

    socket.on(
      'disconnect',
      G_socket_wrapTryCatch(() => {
        console.log('Disconnected: ' + socket.id);
        G_socket_removeUser(user);
      })
    );

    const maps = await G_getMaps();

    socket.emit(
      G_S_CONNECTED,
      G_socket_createMessageSocket({
        games: G_socket_getAllLobbies(),
        maps: maps.map(map => ({
          name: map.name,
        })),
        id: socket.id,
        key,
      })
    );

    console.log('Connected: ' + socket.id, key);
  },
};

module.exports = server;
