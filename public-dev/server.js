/*
global
G_REST_CREATE_GAME
G_REST_JOIN_GAME
G_REST_LEAVE_GAME
G_REST_START_GAME
G_REST_SET_MAP_INDEX
G_REST_GAME_CONFIRM_ACTION
G_SOCKET_CONNECTED
G_SOCKET_GAME_LIST_UPDATED
G_SOCKET_START_GAME
G_SOCKET_CREATE_GAME
G_SOCKET_LEAVE_GAME
G_SOCKET_LOBBY_LIST_UPDATED
G_SOCKET_JOIN_GAME
G_SOCKET_STOP_GAME
G_SOCKET_BROADCAST_GAME
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

const G_socket_createMessageSocket = (payload, err) => {
  return [payload, err];
};

const G_socket_createMessageRest = (payload, err) => {
  return JSON.stringify([payload, err]);
};

const G_socket_randomId = () => (+new Date() * Math.random()).toString(16);

const G_socket_wrapTryCatch = cb => {
  return (req, res) => {
    try {
      cb(req, res);
    } catch (e) {
      console.error('ERROR', e.stack);
      res.send(G_socket_createMessageRest(null, 'Internal server error.'));
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
    return !game.isStarted() && !game.isPractice();
  });
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
    G_SOCKET_GAME_LIST_UPDATED,
    G_socket_createMessageSocket(G_socket_getAllLobbies())
  );
};

const G_socket_assertUser = (id, res) => {
  const user = G_socket_getUserById(id);
  if (!user) {
    res.send(G_socket_createMessageRest(null, `No user exists: ${id}`));
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
  [G_REST_CREATE_GAME + '/:id/:userName/:isPractice']: G_socket_wrapTryCatch(
    (req, res) => {
      const { id, userName, isPractice } = req.params;
      const user = G_socket_assertUser(id, res);
      if (!user) {
        return;
      }
      if (!userName) {
        res.send(G_socket_createMessageRest(null, 'No user name specified'));
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
        res.send(G_socket_createMessageRest({ id: g.id, name: gameName }));
        G_socket_sendUpdateGameList();
      } else {
        res.send(
          G_socket_createMessageRest(
            null,
            `A game already exists for that user: ${G_user_getName(user)}`
          )
        );
      }
    }
  ),
  [G_REST_JOIN_GAME + '/:id/:args']: G_socket_wrapTryCatch((req, res) => {
    const { id, args } = req.params;
    const i = args.indexOf(',');
    const gameId = args.slice(0, i);
    const userName = args.slice(i + 1);
    const user = G_socket_assertUser(id, res);
    if (!user) {
      return;
    }
    const game = G_socket_getGameById(gameId);
    if (game) {
      G_user_setGame(user, game);
      G_user_setName(user, userName);
      console.log('Join game', G_user_getName(user), game.name);
      if (game.join(user)) {
        res.send(
          G_socket_createMessageRest({
            id: game.id,
            name: game.name,
            players: game.getPlayers(),
          })
        );
        G_socket_sendUpdateGameList();
      } else {
        res.send(G_socket_createMessageRest(null, `Could not join game.`));
      }
    } else {
      res.send(
        G_socket_createMessageRest(null, `A game exists for that user: ${id}`)
      );
    }
  }),
  [G_REST_LEAVE_GAME + '/:id']: G_socket_wrapTryCatch((req, res) => {
    const { id } = req.params;
    const user = G_socket_assertUser(id, res);
    if (!user) {
      return;
    }
    const game = G_user_getGame(user);
    if (game) {
      console.log('Leave game', G_user_getName(user), game.name);
      G_user_unsetGame(user, game);
      game.leave(user);
      res.send(G_socket_createMessageRest(game.id));
      G_socket_sendUpdateGameList();
    } else {
      res.send(
        G_socket_createMessageRest(null, `A game exists for that user: ${id}`)
      );
    }
  }),
  [G_REST_START_GAME + '/:id/:mapIndex']: G_socket_wrapTryCatch((req, res) => {
    const { id, mapIndex } = req.params;
    const user = G_socket_assertUser(id, res);
    if (!user) {
      return;
    }
    const game = G_user_getGame(user);
    if (game) {
      if (game.canStart()) {
        console.log('Start game', game.name);
        res.send(G_socket_createMessageRest(true));
        game.setMapIndex(Number(mapIndex));
        game.start();
        G_socket_sendUpdateGameList();
      } else {
        res.send(G_socket_createMessageRest(null, 'Cannot start game.'));
      }
    } else {
      console.log('error', G_socket_getAllLobbies());
      res.send(
        G_socket_createMessageRest(null, `No game exists for that user: ${id}`)
      );
    }
  }),
  // [G_REST_SET_MAP_INDEX + '/:id/:mapIndex']: G_socket_wrapTryCatch(
  //   (req, res) => {
  //     const { id, mapIndex } = req.params;
  //     const user = G_socket_assertUser(id, res);
  //     if (!user) {
  //       return;
  //     }
  //     const game = G_user_getGame(user);
  //     if (game) {
  //       res.send(G_socket_createMessageRest(true));
  //       game.setMapIndex(Number(mapIndex));
  //       G_socket_sendUpdateGameList();
  //     } else {
  //       console.log('error', G_socket_getAllLobbies());
  //       res.send(G_socket_createMessageRest(null, `Cannot set map index.`));
  //     }
  //   }
  // ),
  [G_REST_GAME_CONFIRM_ACTION + '/:id/:action/:args']: G_socket_wrapTryCatch(
    (req, res) => {
      const { id, action, args } = req.params;
      const user = G_socket_assertUser(id, res);
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
            res.send(G_socket_createMessageRest(true));
          } else {
            res.send(
              G_socket_createMessageRest(null, 'Cannot confirm action.')
            );
          }
        } else {
          res.send(
            G_socket_createMessageRest(
              null,
              'Cannot send actions to a game that has not been started!'
            )
          );
        }
      } else {
        res.send(
          G_socket_createMessageRest(
            null,
            `No game exists for that user: ${id}`
          )
        );
      }
    }
  ),
  io: socket => {
    const user = User(socket);
    G_users[socket.id] = user;

    socket.on(
      'disconnect',
      G_socket_wrapTryCatch(() => {
        console.log('Disconnected: ' + socket.id);
        G_socket_removeUser(user);
      })
    );
    const key = G_socket_randomId();

    socket.emit(
      G_SOCKET_CONNECTED,
      G_socket_createMessageSocket({
        games: G_socket_getAllLobbies(),
        maps: G_maps,
        id: socket.id,
        key,
      })
    );

    console.log('Connected: ' + socket.id, key);
  },
};

module.exports = server;
