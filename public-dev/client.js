/*
global
G_R_CREATE
G_R_JOIN
G_R_LEAVE
G_R_START
G_S_CONNECTED
G_S_LIST_UPDATED
G_S_LOBBY_DATA
G_S_GAME_METADATA
G_S_START
G_S_STOP
G_S_START_SIMULATION
G_S_STOP_SIMULATION
G_S_FINISHED
G_S_BROADCAST
G_Body
G_SCALE
G_AU
G_GAME_TIME_BUFFER_MS
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
G_controller_leaveGame
G_model_getKey
G_model_getBroadcastHistory
G_model_getGameData
G_model_setUserId
G_model_setKey
G_model_setGameData
G_model_setGameMetadata
G_model_setBroadcastHistory
G_model_setMaps
G_model_setLoading
G_model_setLastReplay
G_view_renderGameList
G_view_renderLobby
G_view_renderGameBanners
G_view_init
G_view_playSound
G_view_renderGameUI
*/

const G_client_sendRequest = async (type, arg, arg2) => {
  G_model_setLoading(true);
  const result = await fetch(`/${type}/${arg}${arg2 ? '/' + arg2 : ''}`, {
    headers: {
      key: G_model_getKey(),
    },
  });
  G_model_setLoading(false);
  const json = await result.json();
  if (json[1]) {
    throw new Error('[FETCH-ERROR] ' + json[1]);
  }
  console.log('fetch', type, arg, json);
  return { result: json[0], err: json[1] };
};

(() => {
  let socket;

  const bind = () => {
    // emitted by server on page load
    socket.on(G_S_CONNECTED, ([{ games, maps, id, key }]) => {
      console.log('connected load', { games, maps, id });
      G_model_setUserId(id);
      G_model_setMaps(maps);
      G_model_setKey(key);
      G_view_renderGameList(games);
      G_view_init();
    });
    socket.on(G_S_LIST_UPDATED, ([games]) => {
      console.log('game list updated', games);
      G_view_renderGameList(games);
    });
    socket.on(G_S_LOBBY_DATA, ([lobbyData]) => {
      console.log('lobby data updated', lobbyData);
      G_view_renderLobby(lobbyData);
    });
    socket.on(G_S_GAME_METADATA, ([gameMetadata]) => {
      console.log('game metadata updated', gameMetadata);
      G_model_setGameMetadata(gameMetadata);
      G_view_renderGameBanners(G_model_getGameData(), gameMetadata);
    });
    socket.on(G_S_START, ([{ startTime, gameData }]) => {
      console.log('start', startTime, gameData);
      G_controller_startGame(gameData);
      if (!gameData.isPractice) {
        G_view_playSound('start');
      }
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
      G_view_renderGameUI(gameData);
    });
    socket.on(G_S_STOP_SIMULATION, ([{ dynamicGameData, timestamp }]) => {
      const history = G_model_getBroadcastHistory();
      history.push({ timestamp, dynamicGameData, last: true });
      if (history.length > 500) {
        history.shift();
      }
    });
    socket.on(G_S_BROADCAST, ([{ dynamicGameData, timestamp }]) => {
      const history = G_model_getBroadcastHistory();
      history.push({ timestamp, dynamicGameData });
      if (history.length > 500) {
        history.shift();
      }
    });
    socket.on(G_S_FINISHED, ([{ gameData, replay }]) => {
      setTimeout(() => {
        console.log('game over', gameData, replay);
        G_controller_finishGame(gameData);
        G_model_setLastReplay(replay);
      }, G_GAME_TIME_BUFFER_MS);
    });

    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('disconnect', async e => {
      console.warn('disconnect', e);
      await G_controller_leaveGame();
      G_controller_showErrorMessage('You disconnected from the game server!');
    });
    socket.on('error', async e => {
      console.error('socket-error', e);
      await G_controller_leaveGame();
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
