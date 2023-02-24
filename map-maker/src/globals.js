export const G = 6.67428e-11;
export const AU = 149.6e6 * 1000;
export const SCALE = 75 / AU;

export const SPEEDS = {
  Normal: [55000, 0],
  Super: [125000, 100],
};

export const RES_COIN = 'coin';
export const RES_SPRAY = 'spread';
export const RES_PLANET_CRACKER = 'planet-cracker';
export const RES_CLUSTER = 'cluster';
export const RES_WORMHOLE = 'wormhole';
export const RES_BOOMERANG = 'boomerang';
export const RES_WAVE_BOMB = 'wave';
export const RES_PROXIMITY_MINE = 'prox';

export const MENU_MAP_SELECT = 'map_select';
export const MENU_MAP = 'map';

export const SUB_MENU_NONE = 'none';
export const SUB_MENU_PLANET = 'planet';
export const SUB_MENU_PLAYER_SPAWN = 'player_spawn';
export const SUB_MENU_RESOURCE = 'resource';
export const SUB_MENU_MAP = 'map';
export const SUB_MENU_CONFIRM = 'confirm';

export const RES = [
  RES_COIN,
  RES_SPRAY,
  RES_PLANET_CRACKER,
  RES_CLUSTER,
  RES_WAVE_BOMB,
  RES_BOOMERANG,
  RES_PROXIMITY_MINE,
];

export const RES_TYPE_TO_NAME = {
  [RES_COIN]: 'Coin',
  [RES_SPRAY]: 'SpreadFire',
  [RES_PLANET_CRACKER]: 'PlanetCracker',
  [RES_CLUSTER]: 'ClusterBomb',
  [RES_WORMHOLE]: 'Wormhole',
  [RES_WAVE_BOMB]: 'WaveBomb',
  [RES_BOOMERANG]: 'Boomerang',
  [RES_PROXIMITY_MINE]: 'ProximityMine',
};

export const RES_TYPE_TO_COLOR = {
  [RES_COIN]: '#808000',
  [RES_SPRAY]: '#8000a0',
  [RES_PLANET_CRACKER]: '#800050',
  [RES_CLUSTER]: '#910000',
  [RES_WORMHOLE]: '#2050a0',
  [RES_WAVE_BOMB]: '#5020b0',
  [RES_BOOMERANG]: '#5020b0',
  [RES_PROXIMITY_MINE]: '#ff0000',
};
