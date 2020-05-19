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
  {
    name: 'Amalgamation',
    maxRoundLength: 8000,
    maxPlayers: 4,
    width: 2543200000000,
    height: 2543200000000,
    playerLocations: [
      {
        x: -2158229333333.3333,
        y: 1224725333333.3333,
        r: 149600000000,
      },
      {
        x: 1553845333333.3333,
        y: -1035231999999.9999,
        r: 149600000000,
      },
      {
        x: 987359999999.9999,
        y: 2287882666666.6665,
        r: 149600000000,
      },
      {
        x: -965418666666.6666,
        y: -1884959999999.9998,
        r: 149600000000,
      },
    ],
    resourceLocations: [
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: 516992666666.6666,
        y: 1453737999999.9998,
        posR: 187000000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: -641908666666.6666,
        y: 961055333333.3333,
        posR: 187000000000,
      },
      {
        type: 'crack',
        value: 250,
        r: 46750000000,
        x: 499539333333.3333,
        y: 541676666666.6666,
        posR: 149600000000,
      },
      {
        type: 'spray',
        value: 250,
        r: 46750000000,
        x: 2191515333333.3333,
        y: 2202735333333.333,
        posR: 261800000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: 2246659555555.5557,
        y: 821885777777.7776,
        posR: 224400000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: 2051722444444.4438,
        y: 1478214222222.222,
        posR: 261800000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: -2340227492613.372,
        y: -1133181297072.6738,
        posR: 149600000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: -2333335464947.6743,
        y: -62965089175.38759,
        posR: 149600000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: -752113999999.9999,
        y: -356920666666.6666,
        posR: 224400000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: 537045484018.4108,
        y: -9926207897.286407,
        posR: 149600000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: 1875485333333.3333,
        y: 38189555555.555405,
        posR: 261800000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: -2461509643298.449,
        y: 2462540666666.6665,
        posR: 0,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: 623757868385.6588,
        y: -2396501023368.217,
        posR: 74800000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: 2310302005905.0435,
        y: -2312718068759.6924,
        posR: 149600000000,
      },
      {
        type: 'spray',
        value: 250,
        r: 46750000000,
        x: -997457999999.9999,
        y: 1964871333333.3333,
        posR: 523600000000,
      },
      {
        type: 'spray',
        value: 250,
        r: 46750000000,
        x: -2308951333333.333,
        y: -2294739333333.333,
        posR: 149600000000,
      },
      {
        type: 'crack',
        value: 250,
        r: 46750000000,
        x: 308051333333.3333,
        y: -1339294000000,
        posR: 149600000000,
      },
      {
        type: 'crack',
        value: 250,
        r: 46750000000,
        x: -72431333333.33333,
        y: -472112666666.6666,
        posR: 112200000000,
      },
      {
        type: 'coin',
        value: 250,
        r: 46750000000,
        x: -1323586000000,
        y: -381853999999.99994,
        posR: 224400000000,
      },
      {
        type: 'crack',
        value: 250,
        r: 46750000000,
        x: 1327824666666.6665,
        y: -2207472666666.6665,
        posR: 261800000000,
      },
      {
        type: 'crack',
        value: 250,
        r: 46750000000,
        x: -2490466000000,
        y: -593288666666.6666,
        posR: 0,
      },
      {
        type: 'spray',
        value: 250,
        r: 46750000000,
        x: -808961999999.9999,
        y: 368140666666.6666,
        posR: 149600000000,
      },
    ],
    planetLocations: [
      {
        color: '#008B8B',
        mass: 5e30,
        r: 119679999999.99998,
        hp: 5,
        x: -213429333333.3333,
        y: 131647999999.99998,
        posR: 299200000000,
      },
      {
        color: '#008B8B',
        mass: 5e30,
        r: 119679999999.99998,
        hp: 5,
        x: -127658666666.66666,
        y: 1986687999999.9998,
        posR: 149600000000,
      },
      {
        color: '#008B8B',
        mass: 5e30,
        r: 119679999999.99998,
        hp: 5,
        x: 576957333333.3333,
        y: -1873490666666.6665,
        posR: 261800000000,
      },
      {
        color: '#008B8B',
        mass: 5e30,
        r: 119679999999.99998,
        hp: 5,
        x: 95743999999.99998,
        y: -901589333333.3333,
        posR: 149600000000,
      },
      {
        color: '#008B8B',
        mass: 5e30,
        r: 119679999999.99998,
        hp: 5,
        x: 35904000000,
        y: 1105045333333.3333,
        posR: 149600000000,
      },
      {
        color: '#2F4F4F',
        mass: 5e31,
        r: 339093333333.3333,
        hp: 5,
        x: -1991009777777.7778,
        y: -612695111111.1112,
        posR: 74800000000,
      },
      {
        color: '#2F4F4F',
        mass: 5e31,
        r: 339093333333.3333,
        hp: 5,
        x: 1332437333333.3333,
        y: 837759999999.9999,
        posR: 299200000000,
      },
      {
        color: '#008B8B',
        mass: 5e30,
        r: 119679999999.99998,
        hp: 5,
        x: -2213855934192.829,
        y: 2168617108246.1238,
        posR: 187000000000,
      },
      {
        color: '#008B8B',
        mass: 5e30,
        r: 119679999999.99998,
        hp: 5,
        x: 2016607999999.9998,
        y: -1942805333333.3333,
        posR: 149600000000,
      },
    ],
  },
];
