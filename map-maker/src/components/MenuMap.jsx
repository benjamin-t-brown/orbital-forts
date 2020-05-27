import React from 'react';
import NoSelect from 'elements/NoSelect';
import Button from 'elements/Button';
import { getColorStyles } from 'theme';
import { SCALE, AU, RES_COIN, RES_WORMHOLE } from 'globals';
import { SUB_MENU_RESOURCE, SUB_MENU_PLANET } from '../globals';

const SUN_MASS = 5.0 * 10 ** 30;
const SUN_R = 60 / SCALE;

const MenuMap = ({ app, map }) => {
  return (
    <div>
      <Button
        style={{
          float: 'left',
          position: 'absolute',
          top: '398px',
        }}
        onClick={() => app.unsetMap()}
      >
        Back
      </Button>
      <NoSelect useDiv={true} className="menu-heading">
        {map.name}
      </NoSelect>
      <div
        style={{
          display: 'flex',
          justifyContent: 'left',
          flexDirection: 'column',
        }}
      >
        <Button
          onClick={() => {
            const { x: wx, y: wy } = app.getTargetWorldLocation(map);
            const planetLoc = {
              color: '#008B8B',
              mass: SUN_MASS,
              r: SUN_R,
              hp: 5,
              x: wx,
              y: wy,
              posR: AU,
            };
            map.planetLocations.push(planetLoc);
            app.setSelectedItem(planetLoc, SUB_MENU_PLANET);
            app.saveMap(map);
          }}
        >
          + Planet
        </Button>
        <Button
          onClick={() => {
            const { x: wx, y: wy } = app.getTargetWorldLocation(map);
            const res = {
              type: RES_COIN,
              value: 200,
              r: 46750000000,
              x: wx,
              y: wy,
              posR: AU,
            };
            map.resourceLocations.push(res);
            app.setSelectedItem(res, SUB_MENU_RESOURCE);
            app.saveMap(map);
          }}
        >
          + Resource
        </Button>
        <Button
          disabled={app.getWormholeCount(map) >= 12}
          onClick={() => {
            const { x: wx, y: wy } = app.getTargetWorldLocation(map);
            const res = {
              type: RES_WORMHOLE,
              value: 2,
              r: 35 / SCALE,
              x: wx,
              y: wy,
              posR: AU,
            };
            const res2 = {
              ...res,
              x: wx + AU * 3,
            };
            map.resourceLocations.push(res);
            map.resourceLocations.push(res2);
            app.setSelectedItem(res, SUB_MENU_RESOURCE);
            app.saveMap(map);
          }}
        >
          + Wormhole
        </Button>
      </div>
    </div>
  );
};

export default MenuMap;
