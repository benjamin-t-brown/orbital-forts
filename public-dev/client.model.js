/*
global
G_SCALE
G_SPEEDS
G_actions
G_getRandomLocInCircle
*/

let model_userId = null;
let model_gameId = null;
let model_gameName = null;
let model_gameIsPlaying = null;
let model_key = null;
let model_mapIndex = 0;
let model_broadcastHistory = [];
let model_loading = false;
let model_currentMenu = 'menu';
let model_previousMenu = null;
let model_selectedAction = 'Wait';
let model_isSimulating = false;
let model_selectedSpeed = 'Normal';
let model_waitingForSimStart = false;
let model_targetLocation = [0, 0];
let model_gameData = null;
let model_color = 'blue';
let model_selectingTarget = false;
let model_userName = '';
let model_gameOver = false;
let model_maps = null;

let model_menuIds = ['dialog', 'game', 'lobby', 'menu'];

const G_model_isResource = elem => {
  return elem && elem.type === 'coin';
};

const G_model_isPlayer = obj => {
  return !!(obj.color && obj.target);
};

const G_model_getPlayer = (id, gameData) => {
  return gameData.players.reduce((ret, pl) => {
    return pl.id === id ? pl : ret;
  }, null);
};

const G_model_getMe = gameData => {
  const { players } = gameData || {};
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (p.id === G_model_getUserId()) {
      return p;
    }
  }
  return null;
};

const G_model_isWaitSelected = () => model_selectedAction === 'Wait';

const G_model_isLoading = () => model_loading;
const G_model_isWaitingForSimToStart = () => model_waitingForSimStart;
const G_model_isSimulating = () => model_isSimulating;
const G_model_isSelectingTarget = () => model_selectingTarget;
const G_model_isGameOver = () => model_gameOver;
const G_model_isGamePlaying = () => model_gameIsPlaying;
const G_model_getKey = () => model_key;
const G_model_getBroadcastHistory = () => model_broadcastHistory;
const G_model_getSelectedSpeed = () => model_selectedSpeed;
const G_model_getColor = () => model_color;
const G_model_getGameId = () => model_gameId;
const G_model_getUserId = () => model_userId;
const G_model_getGameName = () => model_gameName;
const G_model_getCurrentMenu = () => model_currentMenu;
const G_model_getPreviousMenu = () => model_previousMenu;
const G_model_getTargetLocation = () => model_targetLocation;
const G_model_getGameData = () => model_gameData;
const G_model_getMenuIds = () => model_menuIds;
const G_model_getUserName = () => model_userName;
const G_model_getMapIndex = () => model_mapIndex;
const G_model_getMaps = () => model_maps;
const G_model_getMap = () => model_maps[model_mapIndex];

const G_model_setLoading = v => (model_loading = v);
const G_model_setWaitingForSimToStart = v => (model_waitingForSimStart = v);
const G_model_setSimulating = v => (model_isSimulating = v);
const G_model_setGameOver = v => (model_gameOver = v);
const G_model_setGamePlaying = v => (model_gameIsPlaying = v);
const G_model_setKey = v => (model_key = v);
const G_model_setBroadcastHistory = v => (model_broadcastHistory = v);
const G_model_setSelectingTarget = v => (model_selectingTarget = v);
const G_model_setSelectedSpeed = v => (model_selectedSpeed = v);
const G_model_setColor = v => (model_color = v);
const G_model_setGameId = v => (model_gameId = v);
const G_model_setUserId = v => (model_userId = v);
const G_model_setGameName = v => (model_gameName = v);
const G_model_setCurrentMenu = v => (model_currentMenu = v);
const G_model_setPreviousMenu = v => (model_previousMenu = v);
const G_model_setTargetLocation = v => (model_targetLocation = v);
const G_model_setGameData = v => (model_gameData = v);
const G_model_setMenuIds = v => (model_menuIds = v);
const G_model_setUserName = v => (model_userName = v);
const G_model_setMapIndex = v => (model_mapIndex = v);
const G_model_setMaps = v => (model_maps = v);
