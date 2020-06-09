/*
global
G_SCALE
G_SPEEDS
G_actions
G_action_shoot
G_getRandomLocInCircle
G_getEntityFromEntMap
G_res_spray
G_res_coin
G_res_planetCracker
G_view_auxControls
*/

let model_userId = null;
let model_gameId = null;
let model_lobbyId = null;
let model_gameName = null;
let model_gameIsPlaying = null;
let model_key = null;
let model_mapIndex = 0;
let model_broadcastHistory = [];
let model_renderHistory = [];
let model_loading = false;
let model_currentMenu = 'menu';
let model_previousMenu = null;
let model_isSimulating = false;
let model_selectedAction = G_action_shoot;
let model_selectedSpeed = 'Normal';
let model_waitingForSimStart = false;
let model_targetLocation = [0, 0];
let model_gameData = null;
let model_gameMetadata = null;
let model_color = 'blue';
let model_selectingTarget = false;
let model_userName = '';
let model_gameOver = false;
let model_maps = null;
let model_replay = null;
let model_lastReplay = null;
let model_isReplayingGame = false;
let model_replayRoundIndex = 0;
let model_soundEnabled = true;
let model_soundMultiplier = 1.0;
let model_auxLifetimeMultiplier = 1;
let model_boomerangAngle = 0;

let model_menuIds = ['dialog', 'game', 'lobby', 'menu'];

const G_model_isPlayer = obj => {
  return !!(obj.color && obj.target);
};

const G_model_getPlayer = (id, gameData) => {
  return G_getEntityFromEntMap(id, gameData);
};

const G_model_getMe = gameData => {
  const { players } = gameData || {};
  for (let i = 0; i < players.length; i++) {
    const p = G_getEntityFromEntMap(players[i], gameData);
    if (p.id === G_model_getUserId()) {
      return p;
    }
  }
  return G_getEntityFromEntMap(players[0], gameData);
};

const G_model_getLocalStorageKey = () => 'js13k2020_orbital_forts';
const G_model_isLoading = () => model_loading;
const G_model_isWaitingForSimToStart = () => model_waitingForSimStart;
const G_model_isSimulating = () => model_isSimulating;
const G_model_isSelectingTarget = () => model_selectingTarget;
const G_model_isGameOver = () => model_gameOver;
const G_model_isGamePlaying = () => model_gameIsPlaying;
const G_model_getKey = () => model_key;
const G_model_getBroadcastHistory = () => model_broadcastHistory;
const G_model_getRenderHistory = () => model_renderHistory;
const G_model_getSelectedSpeed = () => model_selectedSpeed;
const G_model_getSelectedAction = () => model_selectedAction;
const G_model_getColor = () => model_color;
const G_model_getGameId = () => model_gameId;
const G_model_getLobbyId = () => model_lobbyId;
const G_model_getUserId = () => model_userId;
const G_model_getGameName = () => model_gameName;
const G_model_getCurrentMenu = () => model_currentMenu;
const G_model_getPreviousMenu = () => model_previousMenu;
const G_model_getTargetLocation = () => model_targetLocation;
const G_model_getGameData = () => model_gameData;
const G_model_getGameMetadata = () => model_gameMetadata;
const G_model_getMenuIds = () => model_menuIds;
const G_model_getUserName = () => model_userName;
const G_model_getMapIndex = () => model_mapIndex;
const G_model_getMaps = () => model_maps;
const G_model_getMap = () => model_maps[model_mapIndex];
const G_model_isPractice = () => G_model_getGameData().players.length === 1;
const G_model_isReplayingGame = () => model_isReplayingGame;
const G_model_getReplay = () => model_replay;
const G_model_getReplayRoundIndex = () => model_replayRoundIndex;
const G_model_getLastReplay = () =>
  JSON.parse(JSON.stringify(model_lastReplay));
const G_model_isSoundEnabled = () => model_soundEnabled;
const G_model_getSoundMultiplier = () => model_soundMultiplier;
const G_model_getAuxActionArgs = () => {
  const selectedAction = G_model_getSelectedAction();
  const actionObj = G_view_auxControls[selectedAction];
  if (actionObj) {
    return actionObj.getArgs();
  }
  return {};
};
const G_model_getAuxLifetimeMultiplier = () => model_auxLifetimeMultiplier;
const G_model_getBoomerangAngle = () => model_boomerangAngle;

const G_model_setLoading = v => (model_loading = v);
const G_model_setWaitingForSimToStart = v => (model_waitingForSimStart = v);
const G_model_setSimulating = v => (model_isSimulating = v);
const G_model_setGameOver = v => (model_gameOver = v);
const G_model_setGamePlaying = v => (model_gameIsPlaying = v);
const G_model_setKey = v => (model_key = v);
const G_model_setBroadcastHistory = v => (model_broadcastHistory = v);
const G_model_setRenderHistory = v => (model_renderHistory = v);
const G_model_setSelectingTarget = v => (model_selectingTarget = v);
const G_model_setSelectedSpeed = v => (model_selectedSpeed = v);
const G_model_setSelectedAction = v => (model_selectedAction = v);
const G_model_setColor = v => (model_color = v);
const G_model_setGameId = v => (model_gameId = v);
const G_model_setLobbyId = v => (model_lobbyId = v);
const G_model_setUserId = v => (model_userId = v);
const G_model_setGameName = v => (model_gameName = v);
const G_model_setCurrentMenu = v => (model_currentMenu = v);
const G_model_setPreviousMenu = v => (model_previousMenu = v);
const G_model_setTargetLocation = v => (model_targetLocation = v);
const G_model_setGameData = v => (model_gameData = v);
const G_model_setGameMetadata = v => (model_gameMetadata = v);
const G_model_setMenuIds = v => (model_menuIds = v);
const G_model_setUserName = v => (model_userName = v);
const G_model_setMapIndex = v => (model_mapIndex = parseInt(v));
const G_model_setMaps = v => (model_maps = v);
const G_model_setLastReplay = v => {
  model_lastReplay = v;
  const data = JSON.stringify(model_lastReplay);
  try {
    localStorage.setItem(G_model_getLocalStorageKey() + '_replay', data);
  } catch (e) {
    console.warn('Unable to save replay to local storage', data.length);
  }
};
const G_model_setIsReplayingGame = v => (model_isReplayingGame = v);
const G_model_setReplay = v => (model_replay = v);
const G_model_setReplayRoundIndex = v => (model_replayRoundIndex = v);
const G_model_setSoundEnabled = v => {
  model_soundEnabled = v;
  localStorage.setItem(G_model_getLocalStorageKey() + '_sound', v);
};
const G_model_setSoundMultiplier = v => (model_soundMultiplier = v);
const G_model_setAuxLifetimeMultiplier = v => (model_auxLifetimeMultiplier = v);
const G_model_setBoomerangAngle = v => (model_boomerangAngle = v);

const storageReplay = localStorage.getItem(
  G_model_getLocalStorageKey() + '_replay'
);
if (storageReplay) {
  try {
    console.log('loaded previous replay from local storage');
    G_model_setLastReplay(JSON.parse(storageReplay));
  } catch (e) {
    console.warn('could not read replay from local storage');
  }
}

const storageSoundEnabled = localStorage.getItem(
  G_model_getLocalStorageKey() + '_sound'
);
if (storageSoundEnabled !== null) {
  console.log('loaded sound settings from local storage');
  G_model_setSoundEnabled(storageSoundEnabled === 'true');
}
