/*
global
G_AU
G_SCALE
G_res_coin
G_res_spray
G_res_planetCracker
*/

const SUN_MASS = 5.0 * 10 ** 30;
const SMALL_MASS = 1 * 10 ** 30;
const SUN_R = 60 / G_SCALE;
const MAP_SIZE_SMALL = 12 * G_AU;
// const MAP_SIZE_MEDIUM = 20 * G_AU;

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

const createResource = (x, y, posR, type) => {
  return {
    type,
    value: 250,
    r: G_AU / 3.2,
    x,
    y,
    posR,
  };
};

const createCoin = (x, y, posR) => {
  const r = createResource(x, y, posR, G_res_coin);
  r.value = 250;
  return r;
};

const fourCorners = (cb, x, y) => {
  return [cb(x, y, 0), cb(-x, y, 1), cb(x, -y, 2), cb(-x, -y, 3)];
};

const cross = (cb, x, y) => {
  return [cb(0, y, 0), cb(0, -y, 1), cb(x, 0, 2), cb(-x, 0, 3)];
};

const G_maps = [
  {
    name: 'Deep Space',
    maxRoundLength: 8000,
    maxPlayers: 4,
    width: MAP_SIZE_SMALL,
    height: MAP_SIZE_SMALL,
    playerLocations: [
      ...cross(
        (x, y) => createPlayerLocation(x, y, G_AU),
        MAP_SIZE_SMALL / 3,
        MAP_SIZE_SMALL / 3
      ),
    ],
    resourceLocations: [
      ...fourCorners(
        (x, y) => createCoin(x, y, G_AU),
        MAP_SIZE_SMALL / 1.8,
        MAP_SIZE_SMALL / 1.8
      ),
      ...cross(
        (x, y, i) =>
          createResource(x, y, G_AU, i < 2 ? G_res_spray : G_res_planetCracker),
        MAP_SIZE_SMALL / 1.5,
        MAP_SIZE_SMALL / 1.5
      ),
      ...fourCorners(
        (x, y) => createCoin(x, y, G_AU / 4),
        MAP_SIZE_SMALL / 1.2,
        MAP_SIZE_SMALL / 1.2
      ),
    ],
    planetLocations: [
      createPlanetLocation({ x: 0, y: 0, posR: 0 }),
      ...fourCorners(
        (x, y) => createPlanetLocation({ x, y, posR: G_AU }),
        MAP_SIZE_SMALL / 3,
        MAP_SIZE_SMALL / 3
      ),
    ],
  },
  {
    name: 'Solar Winds',
    maxRoundLength: 8000,
    maxPlayers: 4,
    width: MAP_SIZE_SMALL,
    height: MAP_SIZE_SMALL,
    playerLocations: [
      createPlayerLocation(-G_AU * 10, -G_AU * 10, G_AU),
      createPlayerLocation(G_AU * 10, -G_AU * 10, G_AU),
      createPlayerLocation(-G_AU * 4, -G_AU * 4, G_AU),
      createPlayerLocation(G_AU * 4, G_AU * 4, G_AU),
    ],
    resourceLocations: [
      createResource(0, G_AU * 10, 0, G_res_planetCracker),
      createResource(0, G_AU * 8.5, 0, G_res_planetCracker),
      createResource(0, G_AU * 7.0, 0, G_res_planetCracker),
      createResource(-G_AU * 6.5, 0, G_AU / 4, G_res_spray),
      createResource(-G_AU * 6.5, G_AU * 1.5, G_AU / 4, G_res_spray),
      createResource(G_AU * 6.5, 0, G_AU / 4, G_res_spray),
      createResource(G_AU * 6.5, G_AU * 1.5, G_AU / 4, G_res_spray),
      createCoin(-G_AU * 10, -G_AU * 5, G_AU / 2),
      createCoin(G_AU * 10, -G_AU * 5, G_AU / 2),
      createCoin(-G_AU * 4, -G_AU * 5, G_AU / 2),
      createCoin(-G_AU * 4, -G_AU * 3, G_AU / 2),
      createCoin(G_AU * 4, -G_AU * 5, G_AU / 2),
      createCoin(G_AU * 4, -G_AU * 3, G_AU / 2),
      createCoin(-G_AU * 10, G_AU * 10, 0),
      createCoin(-G_AU * 10, G_AU * 8.5, G_AU / 2),
      createCoin(-G_AU * 10, G_AU * 7.0, G_AU / 2),
      createCoin(G_AU * 10, G_AU * 10, 0),
      createCoin(G_AU * 10, G_AU * 8.5, G_AU / 2),
      createCoin(G_AU * 10, G_AU * 7.0, G_AU / 2),
    ],
    planetLocations: [
      createPlanetLocation({
        x: 0,
        y: 2 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: 1 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: 0 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: -1 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: -2 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: -3 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: -4 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: -5 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: 0,
        y: -6 * G_AU * 2,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      // createPlanetLocation({ x: 0, y: -6 * G_AU * 2, posR: G_AU / 2 }),
      createPlanetLocation({
        x: -G_AU * 6.5,
        y: -G_AU * 12,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: -G_AU * 6.5,
        y: -G_AU * 10,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: -G_AU * 6.5,
        y: -G_AU * 8,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: -G_AU * 6.5,
        y: -G_AU * 6,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: -G_AU * 6.5,
        y: -G_AU * 4,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: G_AU * 6.5,
        y: -G_AU * 12,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: G_AU * 6.5,
        y: -G_AU * 10,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: G_AU * 6.5,
        y: -G_AU * 8,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: G_AU * 6.5,
        y: -G_AU * 6,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
      createPlanetLocation({
        x: G_AU * 6.5,
        y: -G_AU * 4,
        posR: G_AU / 2,
        mass: SMALL_MASS,
      }),
    ],
  },
  {
    name: 'Planetary Fortress',
    maxRoundLength: 8000,
    maxPlayers: 4,
    width: MAP_SIZE_SMALL,
    height: MAP_SIZE_SMALL,
    playerLocations: [
      ...fourCorners(
        (x, y) => createPlayerLocation(x, y, G_AU),
        MAP_SIZE_SMALL / 2,
        MAP_SIZE_SMALL / 2
      ),
    ],
    resourceLocations: [
      createCoin(0, 0, 0),
      ...fourCorners(
        (x, y) => createResource(x, y, G_AU / 4, G_res_planetCracker),
        G_AU,
        G_AU
      ),
      ...fourCorners(
        (x, y) => createCoin(x, y, G_AU / 2),
        MAP_SIZE_SMALL / 1.1,
        MAP_SIZE_SMALL / 1.1
      ),
      ...cross(
        (x, y) => createCoin(x, y, 0),
        MAP_SIZE_SMALL - G_AU / 2,
        MAP_SIZE_SMALL - G_AU / 2
      ),
      ...fourCorners(
        (x, y) => createResource(x, y, G_AU / 4, G_res_spray),
        G_AU * 5,
        G_AU * 10
      ),
      ...fourCorners((x, y) => createCoin(x, y, G_AU / 2), G_AU * 10, G_AU * 5),
    ],
    planetLocations: [
      ...fourCorners(
        (x, y) => createPlanetLocation({ x, y, posR: G_AU / 2 }),
        MAP_SIZE_SMALL - 3 * G_AU * 3,
        MAP_SIZE_SMALL - 3 * G_AU * 3
      ),
      ...cross(
        (x, y) => createPlanetLocation({ x, y, posR: G_AU / 2 }),
        MAP_SIZE_SMALL - 1 * G_AU * 3,
        MAP_SIZE_SMALL - 1 * G_AU * 3
      ),
      ...cross(
        (x, y) => createPlanetLocation({ x, y, posR: G_AU / 2 }),
        MAP_SIZE_SMALL - 2 * G_AU * 3,
        MAP_SIZE_SMALL - 2 * G_AU * 3
      ),
      ...cross(
        (x, y) => createPlanetLocation({ x, y, posR: G_AU / 2 }),
        MAP_SIZE_SMALL - 3 * G_AU * 3,
        MAP_SIZE_SMALL - 3 * G_AU * 3
      ),
    ],
  },
  {
    name: 'Firing Range',
    maxRoundLength: 8000,
    maxPlayers: 4,
    width: MAP_SIZE_SMALL,
    height: MAP_SIZE_SMALL,
    playerLocations: [
      createPlayerLocation(-2 * 4 * G_AU, -MAP_SIZE_SMALL + G_AU, 0),
      createPlayerLocation(-1 * 4 * G_AU, -MAP_SIZE_SMALL + G_AU, 0),
      createPlayerLocation(1 * 4 * G_AU, -MAP_SIZE_SMALL + G_AU, 0),
      createPlayerLocation(2 * 4 * G_AU, -MAP_SIZE_SMALL + G_AU, 0),
    ],
    resourceLocations: [
      ...fourCorners(
        (x, y) => createCoin(x, y, G_AU),
        MAP_SIZE_SMALL / 1.8,
        MAP_SIZE_SMALL / 1.8
      ),
      ...cross(
        (x, y, i) =>
          createResource(x, y, G_AU, i < 2 ? G_res_spray : G_res_planetCracker),
        MAP_SIZE_SMALL / 1.5,
        MAP_SIZE_SMALL / 1.5
      ),
      ...fourCorners(
        (x, y) => createCoin(x, y, G_AU / 4),
        MAP_SIZE_SMALL / 1.2,
        MAP_SIZE_SMALL / 1.2
      ),
    ],
    planetLocations: [
      // createPlanetLocation({ x: 0, y: 0, posR: 0 }),
      // ...fourCorners(
      //   (x, y) => createPlanetLocation({ x, y, posR: G_AU }),
      //   MAP_SIZE_SMALL / 3,
      //   MAP_SIZE_SMALL / 3
      // ),
    ],
  },
];
