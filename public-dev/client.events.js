/*
global
G_REST_CREATE_GAME
G_REST_JOIN_GAME
G_REST_LEAVE_GAME
G_REST_START_GAME
G_REST_SET_MAP_INDEX
G_REST_GAME_CONFIRM_ACTION
G_getActionCost
G_client_sendRequest
G_controller_setUserName
G_controller_setLoading
G_controller_showMenu
G_controller_centerOnPlayer
G_controller_showErrorMessage
G_view_getElementById
G_view_renderLobby
G_view_renderGameUI
G_view_renderSimulation
G_view_pxToWorld
G_view_worldToPx
G_view_createTextParticle
G_view_getColor
G_model_getColor
G_model_getUserId
G_model_getUserName
G_model_getGameId
G_model_getSelectedAction
G_model_getTargetLocation
G_model_getSelectedSpeed
G_model_getGameData
G_model_getPreviousMenu
G_model_getMapIndex
G_model_setGameId
G_model_setGameName
G_model_setWaitingForSimToStart
G_model_setSelectedAction
G_model_setSelectedSpeed
G_model_setSelectingTarget
G_model_setTargetLocation
G_model_setGameData
G_model_setMapIndex
G_model_getMe
*/

window.events = {
  async create(isPractice) {
    G_controller_setLoading(true);
    G_controller_setUserName(G_view_getElementById('player-name-input').value);
    const { result, err } = await G_client_sendRequest(
      G_REST_CREATE_GAME,
      `${G_model_getUserId()}/${G_model_getUserName() ||
        G_model_getUserId()}/${!!isPractice}`
    );
    if (!err) {
      const { id, name } = result;
      G_model_setGameId(id);
      G_model_setGameName(name || 'Game Name');
      G_controller_showMenu('lobby');
      G_view_renderLobby([
        { id: G_model_getUserId(), userName: G_model_getUserName() },
      ]);

      if (isPractice) {
        await window.events.start();
      }
    }
    G_controller_setLoading(false);
  },
  async join(gameId) {
    G_controller_setLoading(true);
    G_controller_setUserName(G_view_getElementById('player-name-input').value);
    const { result, err } = await G_client_sendRequest(
      G_REST_JOIN_GAME,
      `${G_model_getUserId()}/${gameId},${G_model_getUserName() ||
        G_model_getUserId()}`
    );
    if (!err) {
      const { id, name, players } = result;
      console.log('ON JOIN', result);
      G_model_setGameId(id);
      G_model_setGameName(name);
      G_controller_showMenu('lobby');
      G_view_renderLobby(players);
    } else {
      G_controller_showErrorMessage('Could not join game.');
    }
    G_controller_setLoading(false);
  },
  async leave() {
    G_controller_setLoading(true);
    const { err } = await G_client_sendRequest(
      G_REST_LEAVE_GAME,
      `${G_model_getUserId()}`
    );
    if (!err) {
      G_model_setGameId(null);
      G_controller_showMenu('menu');
    }
    G_controller_setLoading(false);
  },
  async start() {
    G_controller_setLoading(true);
    await G_client_sendRequest(
      G_REST_START_GAME,
      `${G_model_getUserId()}/${G_model_getMapIndex()}`
    );
    G_controller_setLoading(false);
  },
  async setMapIndex(i) {
    if (i === undefined) {
      i = G_view_getElementById('lobby-map-select').value;
    }
    G_model_setMapIndex(i);
    // G_controller_setLoading(true);
    // const { err } = await G_client_sendRequest(
    //   G_REST_SET_MAP_INDEX,
    //   `${G_model_getUserId()}/${i}`
    // );
    // if (!err) {
    //   G_model_setMapIndex(i === -1 ? 0 : i);
    // }
    // G_controller_showMenu('lobby');
    // G_controller_setLoading(false);
  },
  async confirmAction() {
    let args;
    const action = G_model_getSelectedAction();
    switch (action) {
      case 'Shoot':
      case 'Move':
        const [x, y] = G_model_getTargetLocation();
        args = [x, y, G_model_getSelectedSpeed()].join(',');
        break;
      default:
        args = null;
    }
    const cost = G_getActionCost(action);
    const player = G_model_getMe(G_model_getGameData());
    const { x, y } = G_view_worldToPx(player.x, player.y);
    G_view_createTextParticle(
      x,
      y - 30,
      '-$' + cost,
      G_view_getColor('light', G_model_getColor())
    );
    G_controller_setLoading(true);
    G_model_setWaitingForSimToStart(true);
    const { err } = await G_client_sendRequest(
      G_REST_GAME_CONFIRM_ACTION,
      `${G_model_getUserId()}/${action}/${args}`
    );
    if (err) {
      G_model_setWaitingForSimToStart(false);
    }
    G_controller_setLoading(false);
  },
  setAction(action) {
    G_model_setSelectedAction(action);
    G_view_renderGameUI(G_model_getGameData());
  },
  setSpeed(speed) {
    G_model_setSelectedSpeed(speed);
    G_view_renderGameUI(G_model_getGameData());
  },
  setTarget() {
    G_model_setSelectingTarget(true);
    G_view_renderGameUI(G_model_getGameData());
    let canvas = G_view_getElementById('c');
    let cb = ev => {
      if (ev.touches) {
        const touch = ev.touches[0];
        const transform = canvas.parentElement.style.transform;
        const { left, top } = canvas.getBoundingClientRect();
        const scale = parseFloat(transform.slice(7, transform.indexOf(',')));
        let { x, y } = G_view_pxToWorld(
          (touch.clientX - left) / scale,
          (touch.clientY - top) / scale
        );
        G_model_setTargetLocation([x, y]);
      } else {
        const { offsetX, offsetY } = ev;
        let { x, y } = G_view_pxToWorld(offsetX, offsetY);
        G_model_setTargetLocation([x, y]);
      }
      G_model_setSelectingTarget(false);
      G_view_renderGameUI(G_model_getGameData());
      G_view_renderSimulation(G_model_getGameData());
      canvas.removeEventListener('click', cb);
      canvas.removeEventListener('touchstart', cb);
    };
    canvas.addEventListener('click', cb);
    canvas.addEventListener('touchstart', cb);
  },
  centerCam() {
    G_controller_centerOnPlayer();
  },
  async returnToMenu() {
    if (G_model_getGameId()) {
      await window.events.leave();
    }
    G_model_setGameData(null);
    G_model_setGameId(null);
    G_controller_showMenu('menu');
  },
  hideDialog() {
    G_controller_showMenu(G_model_getPreviousMenu());
  },
};
