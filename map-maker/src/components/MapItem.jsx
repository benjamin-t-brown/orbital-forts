import React from 'react';
import NoSelect from 'elements/NoSelect';
import { disableDrag, enableDrag } from 'panzoom';
import { SCALE } from 'globals';
import { hexToRGBA } from '../theme';

const FORT_SIZE = 25 / SCALE;

const MapItem = ({ app, label, color, onClick, item, map }) => {
  const ref = React.createRef(null);
  const { x, y, posR: r1, r: r2 } = item;
  const { x: px, y: py } = app.worldToPx(x, y, map);
  const posR = r1 === undefined ? r2 : r1;
  const sizeR = r1 !== undefined && r2 !== undefined ? r2 : FORT_SIZE;
  const size = posR * 2 * SCALE;
  const sizeObjPlusLoc = (posR + sizeR) * 2 * SCALE;
  const sizeOfItem = sizeR * 2 * SCALE;
  const isSelected = app.getSelectedItem() === item;
  return (
    <div
      ref={ref}
      className={isSelected ? 'item-selected' : 'item-unselected'}
      style={{
        position: 'absolute',
        width: sizeObjPlusLoc,
        height: sizeObjPlusLoc,
        left: px - sizeObjPlusLoc / 2 + 'px',
        top: py - sizeObjPlusLoc / 2 + 'px',
      }}
    >
      <div
        className="highlight-hover"
        onClick={ev => {
          onClick(item);
          ev.preventDefault();
          ev.stopPropagation();
        }}
        onContextMenu={ev => {
          ev.stopPropagation();
        }}
        style={{
          background: hexToRGBA(color, 0.3),
          width: sizeObjPlusLoc,
          height: sizeObjPlusLoc,
          borderRadius: sizeObjPlusLoc,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: color || 'brown',
            width: sizeOfItem,
            height: sizeOfItem,
            borderRadius: sizeOfItem,
            fontSize: '20px',
            lineHeight: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <NoSelect>{label}</NoSelect>
          <img
            src="drag-icon.png"
            alt="drag"
            onClick={ev => ev.stopPropagation()}
            onMouseDown={ev => {
              disableDrag();
              const downX = ev.clientX;
              const downY = ev.clientY;
              const x = parseInt(ref.current.style.left);
              const y = parseInt(ref.current.style.top);
              const scale = parseFloat(
                document.getElementById('map').style.transform.slice(7)
              );
              ev.preventDefault();
              ev.stopPropagation();
              const onMove = ev => {
                const newX = x + (ev.clientX - downX) / scale;
                const newY = y + (ev.clientY - downY) / scale;
                if (ref.current) {
                  ref.current.style.left = newX;
                  ref.current.style.top = newY;
                }
                ev.preventDefault();
                ev.stopPropagation();
                return { x: newX, y: newY };
              };
              const mouseUp = ev => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', mouseUp);
                const { x, y } = onMove(ev);
                const { x: wx, y: wy } = app.pxToWorld(
                  x + sizeObjPlusLoc / 2,
                  y + sizeObjPlusLoc / 2,
                  map
                );
                item.x = wx;
                item.y = wy;
                app.saveMap(map);
                ev.preventDefault();
                ev.stopPropagation();
                onClick(item);
                enableDrag();
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', mouseUp);
            }}
            onContextMenu={ev => {
              ev.stopPropagation();
            }}
            style={{
              width: '35px',
              // height: '35px',
              // position: 'absolute',
              // right: '-35px',
              // top: '-35px',
              cursor: 'pointer',
            }}
          ></img>
        </div>
      </div>
    </div>
  );
};

export default MapItem;
