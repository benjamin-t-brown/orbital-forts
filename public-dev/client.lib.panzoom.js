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
    ele.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';

    const getTransformMatrix = () => {
      let trans = ele.style.transform;
      let start = trans.indexOf('(') + 1;
      let end = trans.indexOf(')');
      let matrix = trans.slice(start, end).split(',');
      return {
        scale: +matrix[0],
        transX: +matrix[4],
        transY: +matrix[5],
      };
    };

    const setTransformMatrix = o => {
      ele.style.transform =
        'matrix(' +
        o.scale +
        ', 0, 0, ' +
        o.scale +
        ', ' +
        o.transX +
        ', ' +
        o.transY +
        ')';
    };

    const applyTranslate = (dx, dy) => {
      let newTrans = getTransformMatrix();
      newTrans.transX += dx;
      newTrans.transY += dy;
      setTransformMatrix(newTrans);
    };

    const applyScale = (dScale, x, y) => {
      let newTrans = getTransformMatrix();
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
        applyTranslate(tranX, tranY);
        setTransformMatrix(newTrans);
        applyTranslate(-(tranX * dScale), -(tranY * dScale));
      }
    };

    const getDistance = (x1, y1, x2, y2) => {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    const getCenter = (x1, y1, x2, y2) => {
      return {
        x: Math.min(x1, x2) + Math.abs(x2 - x1) / 2,
        y: Math.min(y1, y2) + Math.abs(y2 - y1) / 2,
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
          const { clientX: x1, clientY: y1 } = touches[1];
          const { clientX: x2, clientY: y2 } = touches[0];
          touchDist = getDistance(x1, y1, x2, y2);
          zooming = true;
          G_isPanning = true;
          const { x, y } = getCenter(x1, y1, x2, y2);
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
        G_isPanning = false;
      }
    });
    ele.addEventListener('mouseleave', () => {
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
          const { clientX: x1, clientY: y1 } = touches[1];
          const { clientX: x2, clientY: y2 } = touches[0];
          const d = getDistance(x1, y1, x2, y2);
          const { x, y } = getCenter(x1, y1, x2, y2);

          deltaX = x - oldX;
          deltaY = y - oldY;
          applyTranslate(deltaX, deltaY);
          oldX = x;
          oldY = y;

          const m = getTransformMatrix();
          if (d > touchDist) {
            applyScale(0.018, m.tranX, m.transY);
          } else {
            applyScale(-0.018, m.tranX, m.transY);
          }
          touchDist = d;
        } else {
          const touch = e.touches[0];
          deltaX = touch.clientX - oldX;
          deltaY = touch.clientY - oldY;
          applyTranslate(deltaX, deltaY);
          oldX = touch.clientX;
          oldY = touch.clientY;
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
  }

  let panZoomElems = [];
  opts = opts || {};
  let minScale = opts.minScale ? opts.minScale : 0.1;
  let maxScale = opts.maxScale ? opts.maxScale : 1;
  let increment = opts.increment ? opts.increment : 0.2;
  let liner = opts.liner ? opts.liner : false;
  document.querySelectorAll(selector).forEach(function(ele) {
    panZoomElems.push(
      new AttachPanZoom(ele, minScale, maxScale, increment, liner)
    );
  });
  if (panZoomElems.length == 1) return panZoomElems[0];
  return panZoomElems;
}
