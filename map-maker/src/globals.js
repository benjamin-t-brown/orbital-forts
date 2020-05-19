export const G = 6.67428e-11;
export const AU = 149.6e6 * 1000;
export const SCALE = 75 / AU;

export const SPEEDS = {
  Normal: [55000, 0],
  Super: [125000, 100],
};

export const RES_COIN = 'coin';
export const RES_SPRAY = 'spray';
export const RES_PLANET_CRACKER = 'crack';

export const MENU_MAP_SELECT = 'map_select';
export const MENU_MAP = 'map';

export const SUB_MENU_NONE = 'none';
export const SUB_MENU_PLANET = 'planet';
export const SUB_MENU_PLAYER_SPAWN = 'player_spawn';
export const SUB_MENU_RESOURCE = 'resource';
export const SUB_MENU_MAP = 'map';
export const SUB_MENU_CONFIRM = 'confirm';

export const RES = [RES_COIN, RES_SPRAY, RES_PLANET_CRACKER];

export const RES_TYPE_TO_NAME = {
  [RES_COIN]: 'Coin',
  [RES_SPRAY]: 'SpreadFire',
  [RES_PLANET_CRACKER]: 'PlanetCracker',
};

export const RES_TYPE_TO_COLOR = {
  [RES_COIN]: '#808000',
  [RES_SPRAY]: '#800080',
  [RES_PLANET_CRACKER]: '#800000',
};
