import React from 'react';
import NoSelect from 'elements/NoSelect';
import Select from 'elements/Select';
import Slider from 'elements/Slider';
import Button from 'elements/Button';
import { AU, RES, RES_TYPE_TO_NAME, SUB_MENU_RESOURCE } from 'globals';
import { getColorStyles } from 'theme';

const SubMenuResource = ({ res, map, app }) => {
  const scaleSize = Math.round((res.posR * 100) / AU) / 100;
  return (
    <div>
      <NoSelect useDiv={true} className="menu-heading">
        Edit Resource
      </NoSelect>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          flexDirection: 'column',
        }}
      ></div>
      <div>
        <Select
          label="Resource Type"
          value={res.type}
          items={RES.map(resType => {
            return {
              name: RES_TYPE_TO_NAME[resType],
              value: resType,
            };
          })}
          onChange={ev => {
            res.type = ev.target.value;
            app.saveMap(map);
            app.render();
          }}
        />
        <Slider
          label={`Spawn Size ${scaleSize} * AU`}
          min={0}
          max={20}
          value={scaleSize}
          onChange={ev => {
            res.posR = AU * ev.target.value;
            app.render();
          }}
          onMouseUp={ev => {
            app.saveMap(map);
          }}
        />
        <Button
          style={getColorStyles('green')}
          onClick={() => {
            const newRes = { ...res };
            const { x: wx, y: wy } = app.getTargetWorldLocation(map);
            newRes.x = wx;
            newRes.y = wy;
            map.resourceLocations.push(newRes);
            app.setSelectedItem(newRes, SUB_MENU_RESOURCE);
            app.saveMap(map);
            app.render();
          }}
        >
          Duplicate
        </Button>
        <Button
          style={getColorStyles('red')}
          onClick={() => {
            app.unsetSelectedItem();
            app.removeItem(res);
            app.saveMap(map);
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default SubMenuResource;
