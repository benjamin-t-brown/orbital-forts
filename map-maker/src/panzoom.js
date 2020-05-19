// original src https://github.com/SpencerWie/Panzoom/blob/master/dist/panzoom.js

let dragEnabled = true;

export const disableDrag = () => {
  dragEnabled = false;
};

export const enableDrag = () => {
  dragEnabled = true;
};

function PanZoom(selector, opts) {
  function AttachPanZoom(ele, minScaleA, maxScaleA, incrementA, linerA) {
    const increment = incrementA;
    const minScale = minScaleA;
    const maxScale = maxScaleA;
    const liner = linerA;
    let panning = false;
    let oldX = 0,
      oldY = 0;
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

    ele.addEventListener('mousedown', e => {
      if (!dragEnabled) {
        return;
      }
      if (e.button === 0) {
        e.preventDefault();
        panning = true;
        oldX = e.clientX;
        oldY = e.clientY;
      }
    });

    ele.addEventListener('mouseup', e => {
      if (e.button === 0) {
        panning = false;
      }
    });
    ele.addEventListener('mouseleave', () => {
      panning = false;
    });

    ele.addEventListener('mousemove', e => {
      if (!dragEnabled) {
        return;
      }
      if (panning) {
        let deltaX = e.clientX - oldX;
        let deltaY = e.clientY - oldY;
        applyTranslate(deltaX, deltaY);
        oldX = e.clientX;
        oldY = e.clientY;
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
  if (panZoomElems.length === 1) return panZoomElems[0];
  return panZoomElems;
}

export default PanZoom;
