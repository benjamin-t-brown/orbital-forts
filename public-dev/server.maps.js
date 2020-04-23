/*
global
G_AU
G_SCALE
*/

const SUN_MASS = 5.0 * 10 ** 30;
const SUN_R = 60 / G_SCALE;
const MAP_SIZE_SMALL = 12 * G_AU;
const MAP_SIZE_MEDIUM = 20 * G_AU;

const createPlanetLocation = obj => {
  return {
    color: 'aquamarine',
    mass: SUN_MASS,
    r: SUN_R,
    hp: 5,
    ...obj,
  };
};

const createPlayerLocation = (x, y, r) => {
  return { x, y, r };
};

const createCoin = (x, y, posR) => {
  return {
    type: 'coin',
    value: 250,
    r: G_AU / 4,
    x,
    y,
    posR,
  };
};

const G_maps = [
  {
    name: 'Small Map',
    maxRoundLength: 5000,
    maxPlayers: 4,
    width: MAP_SIZE_SMALL,
    height: MAP_SIZE_SMALL,
    playerLocations: [
      createPlayerLocation(0, -MAP_SIZE_SMALL / 3, G_AU),
      createPlayerLocation(0, MAP_SIZE_SMALL / 3, G_AU),
      createPlayerLocation(-MAP_SIZE_SMALL / 3, 0, G_AU),
      createPlayerLocation(MAP_SIZE_SMALL / 3, 0, G_AU),
    ],
    resourceLocations: [
      createCoin(-MAP_SIZE_SMALL / 1.8, -MAP_SIZE_SMALL / 1.8, G_AU),
      createCoin(MAP_SIZE_SMALL / 1.8, -MAP_SIZE_SMALL / 1.8, G_AU),
      createCoin(-MAP_SIZE_SMALL / 1.8, MAP_SIZE_SMALL / 1.8, G_AU),
      createCoin(MAP_SIZE_SMALL / 1.8, MAP_SIZE_SMALL / 1.8, G_AU),
      createCoin(0, MAP_SIZE_SMALL / 1.5, G_AU),
      createCoin(0, -MAP_SIZE_SMALL / 1.5, G_AU),
      createCoin(MAP_SIZE_SMALL / 1.5, 0, G_AU),
      createCoin(-MAP_SIZE_SMALL / 1.5, 0, G_AU),
    ],
    planetLocations: [
      createPlanetLocation({ x: 0, y: 0, posR: 0 }),
      createPlanetLocation({
        x: -MAP_SIZE_SMALL / 3,
        y: -MAP_SIZE_SMALL / 3,
        posR: G_AU,
      }),
      createPlanetLocation({
        x: MAP_SIZE_SMALL / 3,
        y: -MAP_SIZE_SMALL / 3,
        posR: G_AU,
      }),
      createPlanetLocation({
        x: -MAP_SIZE_SMALL / 3,
        y: MAP_SIZE_SMALL / 3,
        posR: G_AU,
      }),
      createPlanetLocation({
        x: MAP_SIZE_SMALL / 3,
        y: MAP_SIZE_SMALL / 3,
        posR: G_AU,
      }),
    ],
  },
  {
    name: 'Large Map',
    maxRoundLength: 8000,
    maxPlayers: 4,
    width: MAP_SIZE_MEDIUM,
    height: MAP_SIZE_MEDIUM,
    playerLocations: [
      createPlayerLocation(0, -MAP_SIZE_MEDIUM / 1.5, G_AU),
      createPlayerLocation(0, MAP_SIZE_MEDIUM / 1.5, G_AU),
      createPlayerLocation(-MAP_SIZE_MEDIUM / 1.5, 0, G_AU),
      createPlayerLocation(MAP_SIZE_MEDIUM / 1.5, 0, G_AU),
    ],
    resourceLocations: [
      createCoin(0, -MAP_SIZE_MEDIUM / 2.2, G_AU),
      createCoin(0, MAP_SIZE_MEDIUM / 2.2, G_AU),
      createCoin(-MAP_SIZE_MEDIUM / 2.2, 0, G_AU),
      createCoin(MAP_SIZE_MEDIUM / 2.2, 0, G_AU),
      createCoin(-MAP_SIZE_MEDIUM / 1.5, -MAP_SIZE_MEDIUM / 1.5, G_AU),
      createCoin(MAP_SIZE_MEDIUM / 1.5, -MAP_SIZE_MEDIUM / 1.5, G_AU),
      createCoin(-MAP_SIZE_MEDIUM / 1.5, MAP_SIZE_MEDIUM / 1.5, G_AU),
      createCoin(MAP_SIZE_MEDIUM / 1.5, MAP_SIZE_MEDIUM / 1.5, G_AU),
    ],
    planetLocations: [
      createPlanetLocation({
        x: G_AU,
        y: G_AU,
        posR: 0,
      }),
      createPlanetLocation({
        x: -G_AU,
        y: -G_AU,
        posR: 0,
      }),
      createPlanetLocation({
        x: -G_AU,
        y: G_AU,
        posR: 0,
      }),
      createPlanetLocation({
        x: G_AU,
        y: -G_AU,
        posR: 0,
      }),
      createPlanetLocation({
        x: MAP_SIZE_MEDIUM / 1.1,
        y: MAP_SIZE_MEDIUM / 1.1,
        posR: G_AU,
      }),
      createPlanetLocation({
        x: -MAP_SIZE_MEDIUM / 1.1,
        y: MAP_SIZE_MEDIUM / 1.1,
        posR: G_AU,
      }),
      createPlanetLocation({
        x: MAP_SIZE_MEDIUM / 1.1,
        y: -MAP_SIZE_MEDIUM / 1.1,
        posR: G_AU,
      }),
      createPlanetLocation({
        x: -MAP_SIZE_MEDIUM / 1.1,
        y: -MAP_SIZE_MEDIUM / 1.1,
        posR: G_AU,
      }),
      createPlanetLocation({
        x: -MAP_SIZE_MEDIUM / 2.5,
        y: -MAP_SIZE_MEDIUM / 2.5,
        posR: G_AU * 2,
      }),
      createPlanetLocation({
        x: MAP_SIZE_MEDIUM / 2.5,
        y: -MAP_SIZE_MEDIUM / 2.5,
        posR: G_AU * 2,
      }),
      createPlanetLocation({
        x: -MAP_SIZE_MEDIUM / 2.5,
        y: MAP_SIZE_MEDIUM / 2.5,
        posR: G_AU * 2,
      }),
      createPlanetLocation({
        x: MAP_SIZE_MEDIUM / 2.5,
        y: MAP_SIZE_MEDIUM / 2.5,
        posR: G_AU * 2,
      }),
    ],
  },
];
