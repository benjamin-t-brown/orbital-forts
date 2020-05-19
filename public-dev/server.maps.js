/*
global
storage
*/

const G_getMaps = async () => {
  const maps = await storage.get('maps');
  return maps;
};

let numMaps = 0;
const G_getNumMaps = async () => {
  if (numMaps === 0) {
    const maps = await G_getMaps();
    numMaps = maps.length;
  }
  return numMaps;
};
