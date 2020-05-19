import React from 'react';
import NoSelect from 'elements/NoSelect';
import Slider from 'elements/Slider';
import { AU } from 'globals';

const SubMenuPlayerSpawn = ({ playerLocation, app, map }) => {
  const { r: posR } = playerLocation;
  const scaleSize = Math.round((posR * 100) / AU) / 100;
  return (
    <div>
      <NoSelect useDiv={true} className="menu-heading">
        Edit Player Spawn
      </NoSelect>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          flexDirection: 'column',
        }}
      >
        <Slider
          label={`Spawn Size ${scaleSize} * AU`}
          min={0}
          max={20}
          value={scaleSize}
          onChange={ev => {
            playerLocation.r = AU * ev.target.value;
            app.render();
          }}
          onMouseUp={ev => {
            app.saveMap(map);
          }}
        />
      </div>
    </div>
  );
};

export default SubMenuPlayerSpawn;
