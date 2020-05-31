import React from 'react';
import PanZoom, { getTransformMatrix } from 'panzoom';
import {
  AU,
  SCALE,
  RES_WORMHOLE,
  RES_TYPE_TO_NAME,
  RES_TYPE_TO_COLOR,
  SUB_MENU_RESOURCE,
  SUB_MENU_PLAYER_SPAWN,
  SUB_MENU_PLANET,
} from 'globals';
import MapItem from 'components/MapItem';

let clickTimeoutId = -1;
let isShortClick = true;

const MapArea = ({ app, map }) => {
  const mapRef = React.useRef(null);
  const canvRef = React.useRef(null);
  React.useEffect(() => {
    if (map && mapRef.current && canvRef.current) {
      PanZoom('#map');
      const width = map.width * 2 * SCALE;
      const height = map.height * 2 * SCALE;
      const zoom = 0.5;
      const x = width / 2;
      const y = height / 2;
      mapRef.current.style.transform = `matrix(${zoom}, 0, 0, ${zoom}, ${-(
        x -
        window.innerWidth / 2
      )}, ${-(y - window.innerHeight / 2)})`;
    }
  }, [map, mapRef]);
  React.useEffect(() => {
    if (map) {
      const width = map.width * 2;
      const height = map.height * 2;
      const ctx = canvRef.current.getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = '#333';
      for (let i = -height; i < height; i += AU) {
        for (let j = -width; j <= width; j += AU) {
          ctx.beginPath();
          ctx.moveTo(j * SCALE, 0);
          ctx.lineTo(j * SCALE, heightPx);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * SCALE);
          ctx.lineTo(widthPx, i * SCALE);
          ctx.stroke();
        }
      }
    }
  });

  const handleResourceClick = res => {
    app.setSelectedItem(res, SUB_MENU_RESOURCE);
  };

  const handlePlayerLocClick = playerLoc => {
    app.setSelectedItem(playerLoc, SUB_MENU_PLAYER_SPAWN);
  };

  const handlePlanetLocClick = planetLoc => {
    app.setSelectedItem(planetLoc, SUB_MENU_PLANET);
  };

  if (!map) {
    return (
      <div
        style={{
          width: '100%',
          margin: '50px',
          textAlign: 'center',
        }}
      >
        Select a map from the menu in the bottom left.
      </div>
    );
  }

  const {
    width,
    height,
    resourceLocations,
    playerLocations,
    planetLocations,
  } = map;
  const { x: targetX, y: targetY } = app.getTargetLoc();

  let wormholeCount = 0;

  const widthPx = map.width * 2 * SCALE;
  const heightPx = map.height * 2 * SCALE;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        left: '0px',
        top: '0px',
      }}
    >
      <div
        id="map"
        ref={mapRef}
        onMouseDown={() => {
          clearTimeout(clickTimeoutId);
          isShortClick = true;
          clickTimeoutId = setTimeout(() => {
            isShortClick = false;
          }, 100);
        }}
        onContextMenu={ev => {
          ev.preventDefault();

          const box = mapRef.current.getBoundingClientRect();
          const m = getTransformMatrix(mapRef.current);
          let offsetX = Math.round(
            (ev.nativeEvent.clientX - box.left) / m.scale
          );
          let offsetY = Math.round(
            (ev.nativeEvent.clientY - box.top) / m.scale
          );
          app.setTargetLoc(offsetX, offsetY);
        }}
        onClick={() => {
          clearTimeout(clickTimeoutId);
          if (isShortClick) {
            app.unsetSelectedItem();
          }
          isShortClick = true;
        }}
        style={{
          position: 'relative',
          width: width * 2 * SCALE,
          height: height * 2 * SCALE,
          background: '#222',
          boxSizing: 'border-box',
        }}
      >
        <canvas
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          width={widthPx}
          height={heightPx}
          ref={canvRef}
        />
        {planetLocations.map((planetLoc, i) => {
          return (
            <MapItem
              key={'planetLoc' + i}
              label={'Planet'}
              color={planetLoc.color}
              app={app}
              item={planetLoc}
              map={map}
              onClick={handlePlanetLocClick}
            />
          );
        })}
        {resourceLocations.map((res, i) => {
          if (res.type === RES_WORMHOLE) {
            wormholeCount++;
          }
          return (
            <MapItem
              key={'res' + i}
              label={RES_TYPE_TO_NAME[res.type]}
              color={RES_TYPE_TO_COLOR[res.type]}
              app={app}
              item={res}
              map={map}
              wormholeCount={wormholeCount - 1}
              onClick={handleResourceClick}
            />
          );
        })}
        {playerLocations.map((playerLoc, i) => {
          return (
            <MapItem
              key={'playerLoc' + i}
              label={'Player' + (i + 1)}
              color={'#4682B4'}
              app={app}
              item={playerLoc}
              map={map}
              onClick={handlePlayerLocClick}
            />
          );
        })}
        <div
          id="target"
          className="target"
          style={{
            left: targetX - 30 + 'px',
            top: targetY - 30 + 'px',
            stroke: 'blue',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" id="x" width="50" height="50">
            <line x1="0" y1="0" x2="50" y2="50" strokeWidth="5" />
            <line x1="50" y1="0" x2="0" y2="50" strokeWidth="5" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MapArea;
