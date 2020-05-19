import React from 'react';
import MapArea from 'components/MapArea';
import MenuMapSelect from 'components/MenuMapSelect';
import MenuMap from 'components/MenuMap';
import SubMenuPlanet from 'components/SubMenuPlanet';
import SubMenuPlayerSpawn from 'components/SubMenuPlayerSpawn';
import SubMenuResource from 'components/SubMenuResource';
import SubMenuMap from 'components/SubMenuMap';
import SubMenuConfirm from 'components/SubMenuConfirm';

import { useFetch } from 'hooks';
import {
  SCALE,
  MENU_MAP_SELECT,
  MENU_MAP,
  SUB_MENU_NONE,
  SUB_MENU_MAP,
  SUB_MENU_PLANET,
  SUB_MENU_PLAYER_SPAWN,
  SUB_MENU_RESOURCE,
  SUB_MENU_CONFIRM,
} from 'globals';

export const LOCAL_STORAGE_KEY = 'orbital-forts-map-maker-map';

let lastMap = null;
export default ({ defaultMapName }) => {
  const [data, loading, error] = useFetch('GET', '/maps');
  const [localMaps, setLocalMaps] = React.useState([]);
  const [deletedMaps, setDeletedMaps] = React.useState([]);
  const [menu, setMenu] = React.useState(
    defaultMapName ? MENU_MAP : MENU_MAP_SELECT
  );
  const [mapName, setMapName] = React.useState(defaultMapName);
  const [subMenu, setSubMenu] = React.useState(
    defaultMapName ? SUB_MENU_MAP : SUB_MENU_NONE
  );
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [render, setRender] = React.useState(1);
  const [targetLoc, setTargetLoc] = React.useState({ x: 0, y: 0 });

  const app = {
    render: () => {
      setRender(!render);
    },
    saveMap: async map => {
      const type = 'POST';
      const url = '/map';
      const opts = {
        method: type,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          map,
        }),
      };
      console.log('[fetch]', type, url, opts.body);
      const data = await fetch(url, opts)
        .then(async function(response) {
          const json = await response.json();
          console.log('[fetch]', 'result', type, url, json);
          return json;
        })
        .catch(err => {
          throw err;
        });
      if (data.err) {
        console.error(data.err);
      } else {
        console.log('Map saved', map.name);
      }
    },
    deleteMap: async mapName => {
      const type = 'DELETE';
      const url = '/map/' + mapName;
      const opts = {
        method: type,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      console.log('[fetch]', type, url, opts.body);
      const data = await fetch(url, opts)
        .then(async function(response) {
          const json = await response.json();
          console.log('[fetch]', 'result', type, url, json);
          return json;
        })
        .catch(err => {
          throw err;
        });
      if (data.err) {
        console.error(data.err);
      } else {
        console.log('Map deleted', mapName);
        setDeletedMaps([...deletedMaps, mapName]);
      }
    },
    createMap: async mapObj => {
      await app.saveMap(mapObj);
      setLocalMaps([...localMaps, mapObj]);
    },
    unsetSelectedItem: () => {
      setSelectedItem(null);
      setSubMenu(SUB_MENU_MAP);
    },
    setSelectedItem: (item, subMenu) => {
      setSelectedItem(item);
      if (subMenu) {
        setSubMenu(subMenu);
      }
    },
    setSubMenu(subMenu) {
      setSubMenu(subMenu);
    },
    getSelectedItem: () => {
      return selectedItem;
    },
    removeItem: item => {
      if (map) {
        const { resourceLocations, playerLocations, planetLocations } = map;
        for (let i = 0; i < resourceLocations.length; i++) {
          const item2 = resourceLocations[i];
          if (item === item2) {
            resourceLocations.splice(i, 1);
            console.log('resource removed');
            app.render();
            return;
          }
        }
        for (let i = 0; i < playerLocations.length; i++) {
          const item2 = playerLocations[i];
          if (item === item2) {
            playerLocations.splice(i, 1);
            console.log('player location removed');
            app.render();
            return;
          }
        }
        for (let i = 0; i < planetLocations.length; i++) {
          const item2 = planetLocations[i];
          if (item === item2) {
            planetLocations.splice(i, 1);
            console.log('planet location removed');
            app.render();
            return;
          }
        }
      } else {
        console.warn('no map to remove from');
      }
    },
    unsetMap: () => {
      setSubMenu(SUB_MENU_NONE);
      setSelectedItem(null);
      setMenu(MENU_MAP_SELECT);
      setMapName('');
      localStorage.setItem(LOCAL_STORAGE_KEY, '');
    },
    setMap: mapName => {
      const map = maps.find(e => e.name === mapName);
      if (map) {
        setMapName(mapName);
        setMenu(MENU_MAP);
        setSubMenu(SUB_MENU_MAP);
        const target = document.getElementById('target');
        if (target) {
          setTargetLoc(map.width, map.height);
          // target.left = map.width + 'px';
          // target.top = map.height + 'px';
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, mapName);
      } else {
        console.warn('Could not find map with name', mapName);
        app.unsetMap();
      }
    },
    setTargetLoc: (x, y) => {
      setTargetLoc({ x, y });
    },
    getTargetLoc: () => {
      return targetLoc;
    },
    worldToPx: (x, y, map) => {
      const { width, height } = map;
      const widthInPixels = SCALE * width * 2;
      const heightInPixels = SCALE * height * 2;
      return {
        x: Math.round(x * SCALE + widthInPixels / 2),
        y: Math.round(-y * SCALE + heightInPixels / 2),
      };
    },
    pxToWorld: (x, y, map) => {
      const { width, height } = map;
      const widthInPixels = SCALE * width * 2;
      const heightInPixels = SCALE * height * 2;
      return {
        x: (x - widthInPixels / 2) / SCALE,
        y: -(y - heightInPixels / 2) / SCALE,
      };
    },
    getTargetWorldLocation: map => {
      const target = document.getElementById('target');
      const x = parseInt(target.style.left) + 25;
      const y = parseInt(target.style.top) + 25;
      return app.pxToWorld(x, y, map);
    },
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error {error}</div>;
  }

  const maps = data.files
    .concat(localMaps)
    .filter(m => !deletedMaps.find(m2 => m2.name === m.name));
  const map = maps.find(m => m.name === mapName);

  if (!map && mapName) {
    // hack: NEVER DO THIS, EVER AGAIN, I MEAN IT, NEVER
    setTimeout(() => {
      app.unsetMap();
    }, 1);
    return <div></div>;
  }

  if (map && map !== lastMap) {
    setTimeout(() => {
      const target = document.getElementById('target');
      target.style.left = map.width * SCALE - 15 + 'px';
      target.style.top = map.height * SCALE - 15 + 'px';
    }, 100);
  }
  lastMap = map;

  return (
    <div>
      <MapArea app={app} map={map} />
      <div
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '400px',
          height: '600px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: subMenu === SUB_MENU_NONE ? 0 : '400px',
            border: '1px solid white',
            boxSizing: 'border-box',
            background: 'rgba(25,25,25,0.7)',
            opacity: subMenu === SUB_MENU_NONE ? 0 : 1,
            pointerEvents: subMenu === SUB_MENU_NONE ? 'none' : 'all',
          }}
        >
          {subMenu === SUB_MENU_MAP ? (
            <SubMenuMap app={app} map={map} maps={maps} />
          ) : null}
          {subMenu === SUB_MENU_CONFIRM ? (
            <SubMenuConfirm app={app} map={map} />
          ) : null}
          {subMenu === SUB_MENU_RESOURCE ? (
            <SubMenuResource app={app} map={map} res={selectedItem} />
          ) : null}
          {subMenu === SUB_MENU_PLANET ? (
            <SubMenuPlanet app={app} map={map} planetLocation={selectedItem} />
          ) : null}
          {subMenu === SUB_MENU_PLAYER_SPAWN ? (
            <SubMenuPlayerSpawn
              app={app}
              map={map}
              playerLocation={selectedItem}
            />
          ) : null}
        </div>
        <div
          style={{
            height: subMenu === SUB_MENU_NONE ? '600px' : '200px',
            border: '1px solid white',
            background: 'rgba(25,25,25,0.7)',
            pointerEvents: 'all',
          }}
        >
          {menu === MENU_MAP_SELECT ? (
            <MenuMapSelect app={app} maps={maps} />
          ) : null}
          {menu === MENU_MAP ? <MenuMap app={app} map={map} /> : null}
        </div>
      </div>
    </div>
  );
};
