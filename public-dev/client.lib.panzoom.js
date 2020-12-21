// original src https://github.com/SpencerWie/Panzoom/blob/master/dist/panzoom.js

let G_isPanning = false;

function G_PanZoom(selector, opts) {
  function AttachPanZoom(ele, minScaleA, maxScaleA, incrementA, linerA) {
    const increment = incrementA;
    const minScale = minScaleA;
    const maxScale = maxScaleA;
    const liner = linerA;
    let panning = false;
    let zooming = false;
    let oldX = 0,
      oldY = 0;
    let touchDist = 0;
    // ele.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
    ele.style.transform = 'transform(0px, 0px) scale(1)';

    const getTransformMatrix = () => {
      const transform = ele.style.transform;
      if (!transform) {
        return {
          scale: 1,
          transX: 0,
          transY: 0,
        };
      }

      const scale = parseFloat(transform.match(/scale\((.*)\)/)[1]);
      const x = parseFloat(
        transform.match(/translate\((.*?)\)/)[1].split(',')[0]
      );
      const y = parseFloat(
        transform.match(/translate\((.*?)\)/)[1].split(',')[1]
      );
      return {
        scale,
        transX: x,
        transY: y,
      };
    };

    const setTransformMatrix = o => {
      const transform = `translate(${o.transX}px, ${o.transY}px) scale(${o.scale})`;
      ele.style.transform = transform;
    };

    const applyTranslate = (dx, dy) => {
      let newTrans = getTransformMatrix();
      newTrans.transX += dx;
      newTrans.transY += dy;
      setTransformMatrix(newTrans);
    };

    const applyScale = (dScale, x, y, mat) => {
      let newTrans = mat || getTransformMatrix();
      let width = ele.width ? ele.width : ele.offsetWidth;
      let height = ele.height ? ele.height : ele.offsetHeight;
      let tranX = x - width / 2;
      let tranY = y - height / 2;
      dScale = liner ? dScale : dScale * newTrans.scale;
      newTrans.scale += dScale;
      let maxOrMinScale =
        newTrans.scale <= minScale || newTrans.scale >= maxScale;
      if (newTrans.scale < minScale) newTrans.scale = minScale;
      if (newTrans.scale > maxScale) newTrans.scale = maxScale;
      if (!maxOrMinScale) {
        setTransformMatrix(newTrans);
        applyTranslate(-(tranX * dScale), -(tranY * dScale));
      }
    };

    const getDistance = (x1, y1, x2, y2) => {
      return Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    };

    const getCenter = (x1, y1, x2, y2) => {
      return {
        x: Math.min(x1, x2) + Math.abs(x2 - x1) / 2,
        y: Math.min(y1, y2) + Math.abs(y2 - y1) / 2,
      };
    };

    const getTouchCenterAndDistance = touches => {
      const { clientX: x1, clientY: y1 } = touches[1];
      const { clientX: x2, clientY: y2 } = touches[0];
      return {
        center: getCenter(x1, y1, x2, y2),
        d: getDistance(x1, y1, x2, y2),
      };
    };

    ele.addEventListener('mousedown', e => {
      if (e.button === 0) {
        e.preventDefault();
        panning = true;
        oldX = e.clientX;
        oldY = e.clientY;
      }
    });

    ele.addEventListener('touchstart', e => {
      e.preventDefault();
      const touches = e.touches;
      const numTouches = touches.length;
      if (numTouches) {
        panning = true;
        if (numTouches >= 2) {
          zooming = true;
          G_isPanning = true;
          const {
            center: { x, y },
            d,
          } = getTouchCenterAndDistance(touches);
          touchDist = d;
          oldX = x;
          oldY = y;
        } else {
          oldX = touches[0].clientX;
          oldY = touches[0].clientY;
        }
      }
    });

    ele.addEventListener('mouseup', e => {
      if (e.button === 0) {
        panning = false;
        zooming = false;
        G_isPanning = false;
      }
    });
    ele.addEventListener('mouseleave', () => {
      zooming = false;
      panning = false;
      G_isPanning = false;
    });

    ele.addEventListener('touchend', ev => {
      if (ev.touches.length === 0) {
        panning = false;
        zooming = false;
        G_isPanning = false;
      }
    });

    ele.addEventListener('mousemove', e => {
      if (panning) {
        let deltaX = e.clientX - oldX;
        let deltaY = e.clientY - oldY;
        applyTranslate(deltaX, deltaY);
        oldX = e.clientX;
        oldY = e.clientY;
      }
    });

    ele.addEventListener('touchmove', e => {
      const touches = e.touches;
      const numTouches = touches.length;
      if (panning || zooming) {
        let deltaX = 0;
        let deltaY = 0;
        if (numTouches >= 2) {
          const {
            center: { x, y },
            d,
          } = getTouchCenterAndDistance(touches);

          deltaX = x - oldX;
          deltaY = y - oldY;
          applyTranslate(deltaX, deltaY);
          oldX = x;
          oldY = y;

          if (Math.abs(d - touchDist) > 2) {
            const m = getTransformMatrix();
            const box = ele.getBoundingClientRect();
            let offsetX = Math.round((x - box.left) / m.scale);
            let offsetY = Math.round((y - box.top) / m.scale);
            if (d > touchDist) {
              applyScale(0.042, offsetX, offsetY);
            } else {
              applyScale(-0.042, offsetX, offsetY);
            }
            touchDist = d;
          }
        } else {
          if (!zooming) {
            const touch = e.touches[0];
            deltaX = touch.clientX - oldX;
            deltaY = touch.clientY - oldY;
            applyTranslate(deltaX, deltaY);
            oldX = touch.clientX;
            oldY = touch.clientY;
          }
        }
      }
    });

    const getScrollDirection = e => {
      let delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
      if (delta < 0) applyScale(-increment, e.offsetX, e.offsetY);
      else applyScale(increment, e.offsetX, e.offsetY);
    };

    ele.addEventListener('DOMMouseScroll', getScrollDirection, false);
    ele.addEventListener('mousewheel', getScrollDirection, false);

    return {
      translateZoom: ({ x, y, scale }) => {
        applyScale(scale - 1, x, y, {
          scale: 1,
          transX: -(x - ele.offsetWidth / 2),
          transY: -(y - ele.offsetWidth / 2),
        });
        oldX = x;
        oldY = y;
      },
      translate: ({ x, y }) => {
        applyTranslate({ transX: x, transY: y, scale: 1 });
      },
      getTransformMatrix,
      setTransformMatrix,
    };
  }

  opts = opts || {};
  let minScale = opts.minScale ? opts.minScale : 0.1;
  let maxScale = opts.maxScale ? opts.maxScale : 1.1;
  let increment = opts.increment ? opts.increment : 0.2;
  let liner = opts.liner ? opts.liner : false;
  return AttachPanZoom(
    document.getElementById(selector),
    minScale,
    maxScale,
    increment,
    liner
  );
}

document.addEventListener(
  'touchmove',
  function(event) {
    event = event.originalEvent || event;
    if (event.scale !== undefined && event.scale !== 1) {
      event.preventDefault();
    }
  },
  false
);
