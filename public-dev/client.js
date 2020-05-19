/*
global
G_R_CREATE
G_R_JOIN
G_R_LEAVE
G_R_START
G_S_CONNECTED
G_S_LIST_UPDATED
G_S_LOBBY_LIST_UPDATED
G_S_START
G_S_STOP
G_S_START_SIMULATION
G_S_STOP_SIMULATION
G_S_FINISHED
G_S_BROADCAST
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
G_model_setLoading
G_view_renderGameList
G_view_renderLobby
G_view_init
*/

const G_client_sendRequest = async (type, arg, arg2) => {
  G_model_setLoading(true);
  const headers = new Headers();
  headers.key = G_model_getKey();
  const result = await fetch(`/${type}/${arg}${arg2 ? '/' + arg2 : ''}`, {
    headers,
  });
  const json = await result.json();
  if (json[1]) {
    console.error('[FETCH-ERROR]', json[1]);
  }
  G_model_setLoading(false);
  console.log('fetch', type, arg, json);
  return { result: json[0], err: json[1] };
};

(() => {
  let socket;

  const bind = () => {
    // emitted by server on page load
    socket.on(G_S_CONNECTED, ([{ games, maps, id }]) => {
      console.log('connected load', { games, maps, id });
      G_model_setUserId(id);
      G_model_setMaps(maps);
      G_view_renderGameList(games);
    });
    socket.on(G_S_LIST_UPDATED, ([games]) => {
      console.log('game list updated', games);
      G_view_renderGameList(games);
    });
    socket.on(G_S_LOBBY_LIST_UPDATED, ([games]) => {
      console.log('lobby list updated', games);
      G_view_renderLobby(games);
    });
    socket.on(G_S_START, ([{ startTime, gameData }]) => {
      console.log('start', startTime, gameData);
      G_controller_startGame(gameData);
    });
    socket.on(G_S_STOP, ([message]) => {
      console.log('stop', message);
      G_controller_showMenu('menu');
      G_controller_showDialog(message);
      G_model_setGameData(null);
    });
    socket.on(G_S_START_SIMULATION, ([gameData]) => {
      console.log('begin simulation', gameData);
      G_model_setBroadcastHistory([gameData]);
      G_controller_beginSimulation(gameData);
    });
    socket.on(G_S_STOP_SIMULATION, ([gameData]) => {
      console.log('stop simulation');
      G_model_setBroadcastHistory([]);
      G_controller_endSimulation(gameData);
    });
    socket.on(G_S_BROADCAST, ([{ gameData }]) => {
      G_model_setGameData(gameData);
      const history = G_model_getBroadcastHistory();
      history.push(gameData);
      if (history.length > 500) {
        history.shift();
      }
    });
    socket.on(G_S_FINISHED, ([gameData]) => {
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
    G_view_init();
  };

  window.addEventListener('load', init, false);
})();
