import React from 'react';
import NoSelect from 'elements/NoSelect';
import Button from 'elements/Button';
import { getColorStyles } from 'theme';
import { SUB_MENU_MAP } from 'globals';

const SubMenuConfirm = ({ app, map }) => {
  return (
    <div>
      <NoSelect useDiv={true} className="menu-heading">
        Are you sure?
      </NoSelect>
      <div className="menu-item">Are you sure you wish to delete this map?</div>
      <Button
        style={getColorStyles('red')}
        onClick={() => {
          app.unsetSelectedItem();
          app.unsetMap();
          app.deleteMap(map.name);
        }}
      >
        Delete Map
      </Button>
      <Button
        onClick={() => {
          app.setSubMenu(SUB_MENU_MAP);
        }}
      >
        Cancel
      </Button>
    </div>
  );
};

export default SubMenuConfirm;
