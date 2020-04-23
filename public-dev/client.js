/*
global
G_REST_CREATE_GAME
G_REST_JOIN_GAME
G_REST_LEAVE_GAME
G_REST_START_GAME
G_SOCKET_CONNECTED
G_SOCKET_GAME_LIST_UPDATED
G_SOCKET_LOBBY_LIST_UPDATED
G_SOCKET_START_GAME
G_SOCKET_STOP_GAME
G_SOCKET_START_SIMULATION
G_SOCKET_STOP_SIMULATION
G_SOCKET_GAME_FINISHED
G_SOCKET_BROADCAST_GAME
G_Body
G_SCALE
G_AU
G_controller_gameData
G_controller_renderGameList
G_controller_renderLobby
G_controller_showMenu
G_controller_showDialog
G_controller_startGame
G_controller_stopGame
G_controller_beginSimulation
G_controller_endSimulation
G_controller_finishGame
G_controller_init
G_controller_showErrorMessage
G_model_getKey
G_model_getBroadcastHistory
G_model_setUserId
G_model_setGameData
G_model_setBroadcastHistory
G_model_setMaps
G_view_renderGameList
G_view_renderLobby
*/

const G_client_sendRequest = async (type, arg, arg2) => {
  const headers = new Headers();
  headers.key = G_model_getKey();
  const result = await fetch(`/${type}/${arg}${arg2 ? '/' + arg2 : ''}`, {
    headers,
  });
  const json = await result.json();
  if (json[1]) {
    console.error('[FETCH-ERROR]', json[1]);
  }
  console.log('fetch', type, arg, json);
  return { result: json[0], err: json[1] };
};

(() => {
  let socket;

  const bind = () => {
    // emitted by server on page load
    socket.on(G_SOCKET_CONNECTED, ([{ games, maps, id }]) => {
      console.log('connected load', games, id);
      G_model_setUserId(id);
      G_model_setMaps(maps);
      G_view_renderGameList(games);
    });
    socket.on(G_SOCKET_GAME_LIST_UPDATED, ([games]) => {
      console.log('game list updated', games);
      G_view_renderGameList(games);
    });
    socket.on(G_SOCKET_LOBBY_LIST_UPDATED, ([games]) => {
      console.log('lobby list updated', games);
      G_view_renderLobby(games);
    });
    socket.on(G_SOCKET_START_GAME, ([{ startTime, gameData }]) => {
      console.log('start', startTime, gameData);
      G_controller_startGame(gameData);
    });
    socket.on(G_SOCKET_STOP_GAME, ([message]) => {
      console.log('stop', message);
      G_controller_showMenu('menu');
      G_controller_showDialog(message);
      G_model_setGameData(null);
    });
    socket.on(G_SOCKET_START_SIMULATION, ([gameData]) => {
      console.log('begin simulation', gameData);
      G_model_setBroadcastHistory([gameData]);
      G_controller_beginSimulation(gameData);
    });
    socket.on(G_SOCKET_STOP_SIMULATION, ([gameData]) => {
      console.log('stop simulation');
      G_model_setBroadcastHistory([]);
      G_controller_endSimulation(gameData);
    });
    socket.on(G_SOCKET_BROADCAST_GAME, ([{ gameData }]) => {
      G_model_setGameData(gameData);
      const history = G_model_getBroadcastHistory();
      history.push(gameData);
      if (history.length > 200) {
        history.shift();
      }
    });
    socket.on(G_SOCKET_GAME_FINISHED, ([gameData]) => {
      console.log('GAME OVER', gameData);
      G_controller_finishGame(gameData);
    });

    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('disconnect', e => {
      console.warn('disconnect', e);
      G_controller_showErrorMessage('You disconnected from the game server!');
    });
    socket.on('error', e => {
      console.error('socket-error', e);
      G_controller_showErrorMessage(
        'An error occurred with the connection to the game server!'
      );
    });
  };

  const init = () => {
    socket = io({ upgrade: false, transports: ['websocket'] });
    bind();
    G_controller_init();
  };

  window.addEventListener('load', init, false);
})();
