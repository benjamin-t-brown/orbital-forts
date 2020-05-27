/*
global
G_SCALE
G_SPEEDS
G_actions
G_action_shoot
G_getRandomLocInCircle
G_res_spray
G_res_coin
G_res_planetCracker
*/

let model_userId = null;
let model_gameId = null;
let model_lobbyId = null;
let model_gameName = null;
let model_gameIsPlaying = null;
let model_key = null;
let model_mapIndex = 0;
let model_broadcastHistory = [];
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

let model_menuIds = ['dialog', 'game', 'lobby', 'menu'];

const G_model_isResource = elem => {
  if (elem) {
    return [G_res_coin, G_res_spray, G_res_planetCracker].includes(elem.type);
  }
  return false;
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
  return players[0];
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

const G_model_setLoading = v => (model_loading = v);
const G_model_setWaitingForSimToStart = v => (model_waitingForSimStart = v);
const G_model_setSimulating = v => (model_isSimulating = v);
const G_model_setGameOver = v => (model_gameOver = v);
const G_model_setGamePlaying = v => (model_gameIsPlaying = v);
const G_model_setKey = v => (model_key = v);
const G_model_setBroadcastHistory = v => (model_broadcastHistory = v);
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
  localStorage.setItem(
    G_model_getLocalStorageKey() + '_replay',
    JSON.stringify(model_lastReplay)
  );
};
const G_model_setIsReplayingGame = v => (model_isReplayingGame = v);
const G_model_setReplay = v => (model_replay = v);
const G_model_setReplayRoundIndex = v => (model_replayRoundIndex = v);
const G_model_setSoundEnabled = v => {
  model_soundEnabled = v;
  localStorage.setItem(G_model_getLocalStorageKey() + '_sound', v);
};
const G_model_setSoundMultiplier = v => (model_soundMultiplier = v);

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

// const G_model_getLastReplay = () => ({
//   version: 1,
//   id: '127117321e2.054',
//   date: 1590390225879,
//   name: "chrome's Game",
//   mapName: 'Cluster Luck',
//   initialGameData: {
//     name: "chrome's Game",
//     mapName: 'Cluster Luck',
//     width: 1795200000000,
//     height: 1795200000000,
//     mapIndex: 3,
//     players: [
//       {
//         id: 'D9qod5RcBN72aIi8AAAP',
//         name: 'benjamin',
//         funds: 175,
//         actions: {
//           Move: 99,
//           Shoot: 99,
//           'Spread Fire': 0,
//           'Planet Crkr.': 0,
//           'Cluster Bomb': 0,
//         },
//         ready: false,
//         dead: false,
//         hp: 1,
//         color: 'blue',
//         r: 49866666666.666664,
//         x: 1494094992968.323,
//         y: 1418632123658.632,
//         target: [1494094992968.323, 1418632123658.632],
//       },
//       {
//         id: 'IyV2T5CJYAJSjSa-AAAO',
//         name: 'chrome',
//         funds: 175,
//         actions: {
//           Move: 99,
//           Shoot: 99,
//           'Spread Fire': 0,
//           'Planet Crkr.': 0,
//           'Cluster Bomb': 0,
//         },
//         ready: false,
//         dead: false,
//         hp: 1,
//         color: 'red',
//         r: 49866666666.666664,
//         x: -1664769617286.0835,
//         y: -1590642739293.4998,
//         target: [-1664769617286.0835, -1590642739293.4998],
//       },
//     ],
//     planets: [
//       {
//         meta: {
//           color: '#008B8B',
//           type: 'planet',
//         },
//         mass: 5e30,
//         color: '#008B8B',
//         r: 119680000000,
//         vx: 0,
//         vy: 0,
//         px: -1142208638404.7417,
//         py: 34510167687.64301,
//       },
//       {
//         meta: {
//           color: '#008B8B',
//           type: 'planet',
//         },
//         mass: 5e30,
//         color: '#008B8B',
//         r: 119680000000,
//         vx: 0,
//         vy: 0,
//         px: 1085544577261.8883,
//         py: -66721055080.04651,
//       },
//       {
//         meta: {
//           color: '#008B8B',
//           type: 'planet',
//         },
//         mass: 5e30,
//         color: '#008B8B',
//         r: 119680000000,
//         vx: 0,
//         vy: 0,
//         px: -127500195735.7102,
//         py: 104755660105.94814,
//       },
//       {
//         meta: {
//           color: '#008B8B',
//           type: 'planet',
//         },
//         mass: 5e30,
//         color: '#008B8B',
//         r: 119680000000,
//         vx: 0,
//         vy: 0,
//         px: -20165327294.888634,
//         py: 1128633214992.6965,
//       },
//       {
//         meta: {
//           color: '#008B8B',
//           type: 'planet',
//         },
//         mass: 5e30,
//         color: '#008B8B',
//         r: 119680000000,
//         vx: 0,
//         vy: 0,
//         px: 123628363680.20113,
//         py: -961326151721.6902,
//       },
//     ],
//     resources: [
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: -127199465002.04785,
//         y: -1496604921079.0244,
//         posR: 149600000000,
//         id: '104bd09409c.dc2',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: -648334679544.7472,
//         y: 95929176937.70021,
//         posR: 149600000000,
//         id: '7ccef93e9d.a1bc',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: -1221034140162.9731,
//         y: 583466377763.9767,
//         posR: 149600000000,
//         id: '10fb183e02.e327',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: 623763861538.3595,
//         y: -914533132967.4175,
//         posR: 149600000000,
//         id: '4b43a3a131.fa84',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: 517254653367.69037,
//         y: 192826432009.95984,
//         posR: 149600000000,
//         id: '14742fc5e52.904',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: -566475292956.8315,
//         y: -1112775065210.205,
//         posR: 149600000000,
//         id: '5755e3cc71.5f94',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: -106451426291.81744,
//         y: -494460724191.6267,
//         posR: 149600000000,
//         id: '13c49e54a4e.1b8',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: 636657049616.2555,
//         y: 1097294100931.5349,
//         posR: 149600000000,
//         id: '27ba992c95.9c24',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: 49884172168.47511,
//         y: 1721345114684.0723,
//         posR: 149600000000,
//         id: '168d2ed91ec.48c',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: 1057075320332.1714,
//         y: -327538006733.0576,
//         posR: 149600000000,
//         id: '12c08efadf5.781',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: 1071795488115.3292,
//         y: 617712030120.3098,
//         posR: 149600000000,
//         id: 'eaca5fc3b5.a06',
//       },
//       {
//         type: 'wormhole',
//         value: 2,
//         r: 69813333333.33333,
//         x: -1146368026743.9482,
//         y: -616912381737.1074,
//         posR: 149600000000,
//         id: '8c87955146.0ba8',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: -1025642221157.399,
//         y: 1617907584230.9883,
//         posR: 149600000000,
//         id: 'c9b9a7869c.455',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: -1504900903180.2834,
//         y: 1013010972382.366,
//         posR: 149600000000,
//         id: 'ee7ec81386.36b8',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: -1637998717484.953,
//         y: -1172441514288.2585,
//         posR: 149600000000,
//         id: '6cef5a81f9.838c',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: -1155970248043.9827,
//         y: -1552809156474.3171,
//         posR: 149600000000,
//         id: 'f023558bfd.1448',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: 1142414169415.0713,
//         y: -1552512361457.1143,
//         posR: 149600000000,
//         id: '17762b478a.72d8',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: 1577148166202.5027,
//         y: -1130237988410.4263,
//         posR: 149600000000,
//         id: '12c70fbcf4e.089',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: 1367536606734.571,
//         y: 1107792153339.6074,
//         posR: 149600000000,
//         id: '642eb33f88.9a6',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: 929218514613.3542,
//         y: 1677122486515.8855,
//         posR: 149600000000,
//         id: 'c684ad63b3.545',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -527999079546.5907,
//         y: 694693328873.5515,
//         posR: 149600000000,
//         id: '14e7b55536f.641',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 359213201648.8806,
//         y: 568594903628.3362,
//         posR: 149600000000,
//         id: 'c533feb5fd.c0c',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 91005834175.75858,
//         y: 576732140297.4846,
//         posR: 149600000000,
//         id: '12f96fcd52.9067',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -490707503494.2279,
//         y: -555523884370.7872,
//         posR: 149600000000,
//         id: '15b2a8129b3.b56',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 547355475192.4029,
//         y: -511286244299.80804,
//         posR: 149600000000,
//         id: '10c8399a27d.7db',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -1461510971437.5422,
//         y: -397425968956.7333,
//         posR: 149600000000,
//         id: '3b63504123.c5e4',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -1621642975557.6377,
//         y: -126527429135.01941,
//         posR: 149600000000,
//         id: '9cb07d20fa.1c28',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -1604633804119.2722,
//         y: 600675335330.0443,
//         posR: 149600000000,
//         id: 'e79478bfd6.5978',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 1387858505969.1377,
//         y: 596676033130.1737,
//         posR: 149600000000,
//         id: '12d1fb74e1d.5d3',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 1601494184093.7158,
//         y: 9577051609.683014,
//         posR: 149600000000,
//         id: '1127a489364.4c2',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 1400335152095.6626,
//         y: -423147798954.5922,
//         posR: 149600000000,
//         id: '55df220269.dd88',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: -1107533685098.976,
//         y: 1074179494561.1986,
//         posR: 149600000000,
//         id: '8c7678a060.3848',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: 929868618759.1355,
//         y: 1164849516386.1357,
//         posR: 149600000000,
//         id: '19511c8ff2.4cca',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: -1100060249194.8406,
//         y: -918403936711.0957,
//         posR: 149600000000,
//         id: '661f6752b8.49a4',
//       },
//       {
//         type: 'cluster',
//         value: 200,
//         r: 46750000000,
//         x: 967340288246.0533,
//         y: -1090595339830.9423,
//         posR: 149600000000,
//         id: '12dc5c33998.bd1',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -613641066639.8589,
//         y: 1128388808406.3813,
//         posR: 149600000000,
//         id: 'e6433f0c0f.f5e',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -430127226731.6979,
//         y: 1615929918883.438,
//         posR: 149600000000,
//         id: '146751a079e.b5',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 393386830655.00134,
//         y: 1663615383436.6042,
//         posR: 149600000000,
//         id: '11df8c013c.2e91',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: -574712925376.7446,
//         y: -1582585136326.8193,
//         posR: 149600000000,
//         id: 'e682515434.667',
//       },
//       {
//         type: 'coin',
//         value: 200,
//         r: 46750000000,
//         x: 488511261913.135,
//         y: -1544637167018.6704,
//         posR: 149600000000,
//         id: 'a58a4583a5.028',
//       },
//     ],
//     projectiles: [],
//     collisions: [],
//     result: false,
//     baseFundsPerRound: 25,
//     maxRoundLength: 8000,
//   },
//   rounds: [
//     {
//       roundNumber: 0,
//       actions: {
//         'IyV2T5CJYAJSjSa-AAAO': {
//           action: 'Shoot',
//           speed: 55000,
//           vec: [0.08499342231194418, 0.9963815123554348],
//           cost: 0,
//           target: ['-1629642666666.6665', '-1178848000000'],
//         },
//         D9qod5RcBN72aIi8AAAP: {
//           action: 'Shoot',
//           speed: 55000,
//           vec: [-0.3315979659457811, -0.9434207910474629],
//           cost: 0,
//           target: ['1366346666666.6665', '1055178666666.6666'],
//         },
//       },
//     },
//   ],
//   result: 'D9qod5RcBN72aIi8AAAP',
// });
