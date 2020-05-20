import React from 'react';
import NoSelect from 'elements/NoSelect';
import Select from 'elements/Select';
import Slider from 'elements/Slider';
import Button from 'elements/Button';
import { AU, SCALE, SUB_MENU_PLANET } from 'globals';
import { getColorStyles } from 'theme';

const SubMenuPlanet = ({ planetLocation, map, app }) => {
  const { posR, r, color, mass } = planetLocation;
  const scaleSize = Math.round((posR * 100) / AU) / 100;
  const scaleMass = mass / 10 ** 30;
  const scaleR = Math.round(r * 100 * SCALE) / 100;
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
          label="Planet Color"
          value={color}
          items={[
            {
              name: 'Aquamarine',
              value: '#008B8B',
            },
            {
              name: 'MediumTurquoise',
              value: '#2F4F4F',
            },
          ]}
          onChange={ev => {
            planetLocation.color = ev.target.value;
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
            planetLocation.posR = AU * ev.target.value;
            app.render();
          }}
          onMouseUp={ev => {
            app.saveMap(map);
          }}
        />
        <Slider
          label={`Mass ${scaleMass.toFixed(2)} * 10 ** 30`}
          min={5}
          max={100}
          step={1}
          value={scaleMass}
          onChange={ev => {
            planetLocation.mass = ev.target.value * 10 ** 30;
            app.render();
          }}
          onMouseUp={ev => {
            app.saveMap(map);
          }}
        />
        <Slider
          label={`Size ${scaleR} / SCALE`}
          min={40}
          max={800}
          step={5}
          value={scaleR}
          onChange={ev => {
            planetLocation.r = ev.target.value / SCALE;
            app.render();
          }}
          onMouseUp={ev => {
            app.saveMap(map);
          }}
        />
        <Button
          style={getColorStyles('green')}
          onClick={() => {
            const newPlanetLoc = { ...planetLocation };
            const { x: wx, y: wy } = app.getTargetWorldLocation(map);
            newPlanetLoc.x = wx;
            newPlanetLoc.y = wy;
            map.planetLocations.push(newPlanetLoc);
            app.setSelectedItem(newPlanetLoc, SUB_MENU_PLANET);
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
            app.removeItem(planetLocation);
            app.saveMap(map);
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default SubMenuPlanet;
