import React from 'react';
import NoSelect from 'elements/NoSelect';
import Slider from 'elements/Slider';
import TextInput from 'elements/TextInput';
import Button from 'elements/Button';
import { getColorStyles } from 'theme';
import { AU, SCALE, RES, RES_TYPE_TO_NAME, SUB_MENU_CONFIRM } from 'globals';

const SubMenuMap = ({ map, maps, app }) => {
  const [mapName, setMapName] = React.useState(map.name);
  const [isError, setIsError] = React.useState(false);
  const [mapIsSquare, setMapIsSquare] = React.useState(true);

  const getMap = mapName => {
    return maps.find(m => m.name === mapName);
  };

  const isChangeNameDisabled = isError || mapName === map.name;
  const scaledWidth = Math.round((map.width * 100) / AU) / 100;
  const scaledHeight = Math.round((map.height * 100) / AU) / 100;

  return (
    <div>
      <NoSelect useDiv={true} className="menu-heading">
        Map Properties
      </NoSelect>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          flexDirection: 'column',
        }}
      ></div>
      <div>
        {isError ? (
          <div
            style={{
              color: 'red',
              margin: '0.5rem',
              // display: 'none',
            }}
          >
            A map with that name already exists.
          </div>
        ) : (
          <div
            style={{
              margin: '0.5rem',
              // display: 'none',
            }}
          >
            Click 'Change Name' to change the map's name.
          </div>
        )}
        <TextInput
          label="Map Name"
          value={mapName}
          onChange={ev => {
            const newMapName = ev.target.value;
            setMapName(newMapName);
            if (newMapName === map.name) {
              setIsError(false);
            } else {
              if (getMap(newMapName)) {
                setIsError(true);
              } else {
                setIsError(false);
              }
            }
          }}
        />
        <Button
          style={isChangeNameDisabled ? undefined : getColorStyles('blue')}
          disabled={isChangeNameDisabled}
          onClick={async () => {
            await app.deleteMap(map.name);
            map.name = mapName;
            app.setMap(mapName);
            await app.saveMap(map);
          }}
        >
          Change Name
        </Button>
        <Slider
          label={`Map Width ${scaledWidth} * AU`}
          min={10}
          max={50}
          value={scaledWidth}
          onChange={ev => {
            map.width = AU * ev.target.value;
            if (mapIsSquare) {
              map.height = map.width;
            }
            app.render();
          }}
          onMouseUp={ev => {
            app.saveMap(map);
          }}
        />
        <Slider
          label={`Map Height ${scaledHeight} * AU`}
          min={10}
          max={50}
          value={scaledHeight}
          onChange={ev => {
            map.height = AU * ev.target.value;
            if (mapIsSquare) {
              map.width = map.height;
            }
            app.render();
          }}
          onMouseUp={ev => {
            app.saveMap(map);
          }}
        />
        <Button
          style={getColorStyles('orange')}
          onClick={() => {
            app.setSubMenu(SUB_MENU_CONFIRM);
          }}
        >
          Delete Map
        </Button>
      </div>
    </div>
  );
};

export default SubMenuMap;
