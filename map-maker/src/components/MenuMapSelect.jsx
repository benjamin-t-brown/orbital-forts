import React from 'react';
import Button from 'elements/Button';
import NoSelect from 'elements/NoSelect';

const MenuMapSelect = ({ app, maps }) => {
  return (
    <div>
      <NoSelect useDiv={true} className="menu-heading">
        Maps
      </NoSelect>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          flexDirection: 'column',
        }}
      >
        <Button
          style={{
            width: 'calc(100% - 33px)',
          }}
          onClick={async () => {
            const map = {
              name: 'Map' + Number(new Date()),
              maxRoundLength: 8000,
              maxPlayers: 4,
              width: 1795200000000,
              height: 1795200000000,
              playerLocations: [
                {
                  x: 0,
                  y: 598400000000,
                  r: 149600000000,
                },
                {
                  x: 0,
                  y: -598400000000,
                  r: 149600000000,
                },
                {
                  x: 598400000000,
                  y: 0,
                  r: 149600000000,
                },
                {
                  x: -598400000000,
                  y: 0,
                  r: 149600000000,
                },
              ],
              resourceLocations: [],
              planetLocations: [],
            };
            await app.createMap(map);
            app.setMap(map.name);
          }}
        >
          + Create New Map
        </Button>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            flexDirection: 'column',
            height: '600px',
            overflowY: 'auto',
          }}
        >
          {maps.map((map, i) => {
            return (
              <Button
                key={i}
                type="secondary"
                onClick={() => app.setMap(map.name)}
              >
                {map.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MenuMapSelect;
