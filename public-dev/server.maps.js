/*
global
G_AU
G_SCALE
G_res_coin
G_res_spray
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

const createResource = (x, y, posR, type) => {
  return {
    type,
    value: 250,
    r: G_AU / 3.5,
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
  return [cb(x, y), cb(-x, y), cb(x, -y), cb(-x, -y)];
};

const cross = (cb, x, y) => {
  return [cb(0, y), cb(0, -y), cb(x, 0), cb(-x, 0)];
};

const G_maps = [
  {
    name: 'Small Map',
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
        (x, y) => createResource(x, y, G_AU, G_res_spray),
        MAP_SIZE_SMALL / 1.5,
        MAP_SIZE_SMALL / 1.5
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
    name: 'Large Map',
    maxRoundLength: 8000,
    maxPlayers: 4,
    width: MAP_SIZE_MEDIUM,
    height: MAP_SIZE_MEDIUM,
    playerLocations: [
      ...cross(
        (x, y) => createPlayerLocation(x, y, G_AU),
        MAP_SIZE_MEDIUM / 1.5,
        MAP_SIZE_MEDIUM / 1.5
      ),
    ],
    resourceLocations: [
      ...fourCorners(
        (x, y) => createCoin(x, y, G_AU),
        MAP_SIZE_MEDIUM / 1.5,
        MAP_SIZE_MEDIUM / 1.5
      ),
      ...cross(
        (x, y) => createCoin(x, y, G_AU),
        MAP_SIZE_MEDIUM / 2.2,
        MAP_SIZE_MEDIUM / 2.2
      ),
    ],
    planetLocations: [
      ...fourCorners(
        (x, y) => createPlanetLocation({ x, y, posR: 0 }),
        G_AU,
        G_AU
      ),
      ...fourCorners(
        (x, y) => createPlanetLocation({ x, y, posR: G_AU }),
        MAP_SIZE_MEDIUM / 1.1,
        MAP_SIZE_MEDIUM / 1.1
      ),
      ...fourCorners(
        (x, y) => createPlanetLocation({ x, y, posR: G_AU * 2 }),
        MAP_SIZE_MEDIUM / 2.5,
        MAP_SIZE_MEDIUM / 2.5
      ),
    ],
  },
];
