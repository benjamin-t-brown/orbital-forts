/*
global
G_R_CREATE
G_R_JOIN
G_R_LEAVE
G_R_START
G_R_SET_MAP_INDEX
G_R_CONFIRM_ACTION
G_getActionCost
G_isPanning
G_action_spread
G_action_move
G_action_shoot
G_client_sendRequest
G_controller_setUserName
G_controller_setLoading
G_controller_showMenu
G_controller_centerOnPlayer
G_controller_showErrorMessage
G_controller_setTarget
G_view_getElementById
G_view_renderLobby
G_view_renderGameUI
G_view_renderSimulation
G_view_pxToWorld
G_view_worldToPx
G_view_createTextParticle
G_view_getColor
G_model_getMe
G_model_getColor
G_model_getUserId
G_model_getUserName
G_model_getGameId
G_model_getTargetLocation
G_model_getSelectedSpeed
G_model_getSelectedAction
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
G_model_isGamePlaying
G_model_isWaitingForSimToStart
G_model_isSimulating
*/

window.events = {
  async create(isPractice) {
    G_controller_setUserName(G_view_getElementById('player-name-input').value);
    const { result, err } = await G_client_sendRequest(
      G_R_CREATE,
      `${G_model_getUserId()}/${G_model_getUserName() ||
        G_model_getUserId()}/${!!isPractice}`
    );
    if (!err) {
      const { id, name } = result;
      G_model_setGameId(id);
      G_model_setGameName(name || 'Game Name');
      if (!isPractice) {
        G_controller_showMenu('lobby');
        G_view_renderLobby([
          { id: G_model_getUserId(), userName: G_model_getUserName() },
        ]);
      }

      if (isPractice) {
        await window.events.start();
      }
    }
  },
  async join(gameId) {
    G_controller_setUserName(G_view_getElementById('player-name-input').value);
    const { result, err } = await G_client_sendRequest(
      G_R_JOIN,
      `${G_model_getUserId()}/${gameId},${G_model_getUserName() ||
        G_model_getUserId()}`
    );
    if (!err) {
      const { id, name, players } = result;
      G_model_setGameId(id);
      G_model_setGameName(name);
      G_controller_showMenu('lobby');
      G_view_renderLobby(players);
    } else {
      G_controller_showErrorMessage('Could not join game.');
    }
  },
  async leave() {
    const { err } = await G_client_sendRequest(
      G_R_LEAVE,
      `${G_model_getUserId()}`
    );
    if (!err) {
      G_model_setGameId(null);
      G_controller_showMenu('menu');
    }
  },
  async start() {
    await G_client_sendRequest(
      G_R_START,
      `${G_model_getUserId()}/${G_model_getMapIndex()}`
    );
  },
  async setMapIndex(i) {
    if (i === undefined) {
      i = G_view_getElementById('lobby-map-select').value;
    }
    G_model_setMapIndex(i);
  },
  async confirmAction() {
    const action = G_model_getSelectedAction();
    let args = [
      ...G_model_getTargetLocation(),
      G_model_getSelectedSpeed(),
    ].join(',');
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
      G_R_CONFIRM_ACTION,
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
  setTarget(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if (
      G_model_isGamePlaying() &&
      !G_model_isWaitingForSimToStart() &&
      !G_model_isSimulating()
    ) {
      G_controller_setTarget(ev);
    }
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

let canvas = G_view_getElementById('c');
let lastTap = 0;
canvas.addEventListener('touchend', event => {
  if (G_isPanning) {
    return;
  }
  let currentTime = +new Date();
  let tapLength = currentTime - lastTap;
  if (tapLength < 500) {
    window.events.setTarget(event);
    event.preventDefault();
  }
  lastTap = currentTime;
});
canvas.addEventListener('contextmenu', window.events.setTarget);
