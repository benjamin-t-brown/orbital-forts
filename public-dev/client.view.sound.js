/*
global
zzfx
zzfxV
G_model_isSoundEnabled
*/

const G_view_setVolume = v => (zzfxV = v); //eslint-disable-line no-global-assign
const view_sounds = {
  button: [, , 204, , , 0.06, , 1.39, 64, -17, , , , , -17, 0.2, 0.26],
  button2: [, , 1107, 0.01, , 0.01, 1, 0.14, , , , , , 0.5, 31, 0.1, 0.44],
  button3: [, , 313, , , 0.08, 1, 1.74, , , 322, 0.66, , 0.1, -20, 0.1, 0.44],
  expl: [, , 366, , 0.06, 0.28, 3, 2.51, -4.7, -0.5, , , , 0.1, 0.1, 0.3, 0.06],
  explC: [, , 366, , 0.06, 0.28, 3, 2.5, -4.7, -0.5, , , , 0.1, 0.1, 0.3, 0.06],
  explProjEat: [, , 438, , 0.08, 0.1, 1, 2.4, 0.7, -0.1, , , , 1.1, , 0.1, 0.1],
  getSpreadFire: [, , 252, , , 0.23, 2, 0.65, , , , , , 1.6, -7.5, , 0.04],
  getCluster: [, , 80, , , 0.41, 2, 2.53, 1.3, -0.8, , , , 0.7, 0.4, 0.1, 0.17],
  getWave: [, , 615, 0.03, , 0.08, 4, 2.92, , 38, , , 0.19, , -2.1, , , , 0.03],
  getBoom: [, , 892, 0.03, , 0.2, 2, 1.24, , 51, , , , 0.8, , 0.1],
  getPC: [, , 1343, , 0.02, 0.23, 1, 0.98, , , 928, 0.06, 0.01],
  hitProx: [, , 96, , 0.1, 0.32, 2, 2.97, 6.3, 8.9, , , , 1.3, , 0.2],
  lobby: [, , 531, 0.05, , 0.05, 3, , , -0.1, 783, 1.22, , 1.4, , , 0.12],
  wormhole: [, , 192, 0.01, 0.26, 0.01, , 0.56, , 28, , , , 0.7, , , 0.16],
  // wormhole: [, , 1136, 0.26, 0.01, 0.01, 1, 1.35, , , , , , , -1.9, 0.3],
  playerDead: [, , 385, , 0.1, 0.45, 4, 1.32, , , , , , 0.9, , 0.1, 0.11],
  playerDead2: [, , 378, , 0.06, 0.97, 1, 3.63, 0.4, , , , , 0.5, -0.4, 0.6],
  shootNorm: [, , 528, 0.02, , 0.25, 3, 1.62, , -0.6, , , , 3.6, , 0.1, 0.01],
  shootNorm2: [, , 223, , 0.07, 0.16, 3, 0.92, , , , , , 1.6, -0.9, 0.3, 0.07],
  shootPC: [, , 254, , , 0.48, 3, 0.13, -1.1, , , , , 2, , 0.1, 0.07],
  explWave: [
    ,
    ,
    153,
    ,
    ,
    0.34,
    4,
    0.01,
    ,
    4.2,
    ,
    ,
    ,
    1.5,
    -1,
    0.1,
    0.18,
    0.99,
    0.02,
  ],
  explPlanet: [, , 814, 0.04, 0.23, 1.86, 4, 1.78, , 0.3, , , , 0.9, -0.9, 0.4],
  explLarge2: [, , 997, 0.04, 0.06, 0.87, 3, 1.23, , 100, , , , 1.8, 1, 0.8],
  explCluster: [, , 273, , , 0.36, 3, 0.01, , , , , , 0.2, 0.6, 0.3, 0.04],
  coin: [, , 1250, , 0.04, 0.21, , 1.56, , , 706, 0.04, , , , , 0.05],
  respawn: [, , 47, 0.06, 0.04, 0.32, , 0.44, -0.1, , , , , 2.5, -3.8, 0.3],
  start: [
    ,
    ,
    427,
    0.01,
    0.37,
    1.55,
    1,
    3.3,
    0.4,
    0.5,
    ,
    ,
    ,
    0.2,
    0.2,
    0.1,
    0.36,
  ],
  win: [, , 10, 0.22, 0.18, 0.93, 2, 0.9, , -0.9, 150, 0.06, 0.09],
  lose: [, , 31, 0.03, 0.24, 0.95, 3, 2.76, 0.1, , , , , 0.7, , 0.7],
  tie: [, , 393, 0.03, 0.57, 0.11, 1, 1.65, , , 4, 0.58, , 0.5, , 0.6],
  idk: [, , 35, 0.5, 0.42, 0.34, , 0.49, , , 258, 0.05, 0.25, , , , 0.13],
};
const view_volumes = {
  explC: 0.1,
};
const G_view_playSound = soundName => {
  if (!G_model_isSoundEnabled()) {
    return;
  }

  const soundArray = view_sounds[soundName] || view_sounds.idk;
  const soundVolume = view_volumes[soundName] || 0.3;

  if (soundArray === view_sounds.idk) {
    console.warn('no sound found with name:', soundName);
  }

  G_view_setVolume(soundVolume);
  zzfx(...soundArray);
};
