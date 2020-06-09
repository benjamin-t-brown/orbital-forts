/*
global
G_getRandomLocInCircle
G_normalize
G_res_sprites
G_res_wormhole
G_view_worldToPx
G_view_setInnerHTML
G_view_getElementById
*/

const view_wormholeColors = {
  0: '#00f',
  1: '#00f',
  2: 'red',
  3: 'red',
  4: 'yellow',
  5: 'yellow',
  6: 'cyan',
  7: 'cyan',
  8: 'orange',
  9: 'orange',
  10: 'green',
  11: 'green',
};
let view_wormholeCount = 0;

const view_createElement = (
  parent,
  childHtml,
  childClassName,
  left,
  top,
  id,
  styles
) => {
  styles = styles || {};
  const style = {
    position: 'absolute',
    left: left + 'px',
    top: top + 'px',
    ...styles,
  };
  const div = document.createElement('div');
  div.className = childClassName;
  if (typeof childHtml === 'string') {
    G_view_setInnerHTML(div, childHtml);
  } else {
    div.appendChild(childHtml);
  }
  div.id = id;
  for (let i in style) {
    div.style[i] = style[i];
  }
  parent.appendChild(div);
  return div;
};

const G_view_createResource = res => {
  const element = G_view_getElementById('res');
  const { x, y, id, type } = res;
  let { label, content, offsetTop, elem } = G_res_sprites[type] || {};
  const isWormhole = type === G_res_wormhole;
  let borderColor = '';
  let backgroundColor = '';
  const { x: px, y: py } = G_view_worldToPx(x, y);
  const parent = document.createElement(elem);
  parent.innerHTML = label || '';
  const resourceElem = view_createElement(
    parent,
    content || '',
    'resource ' + type,
    px - 100,
    py - offsetTop,
    'res-' + id
  );
  if (isWormhole) {
    const c = view_wormholeColors[view_wormholeCount];
    borderColor = c;
    backgroundColor = `radial-gradient(circle at 50% 120%, ${c}, ${c} 10%, rgb(75, 26, 63) 80%, #062745 100%)`;
    resourceElem.children[0].style.background = `radial-gradient(circle at 50% 0px, ${c}, rgba(255, 255, 255, 0) 58%)`;
    view_wormholeCount++;
  }
  if (borderColor) {
    resourceElem.style.color = borderColor;
  }
  if (backgroundColor) {
    resourceElem.style.background = backgroundColor;
  }
  parent.style.left = resourceElem.style.left;
  parent.style.top = resourceElem.style.top;
  parent.className = 'res2 centered';
  resourceElem.style.position = 'unset';
  element.appendChild(parent);
};

const G_view_createResources = res => {
  const element = G_view_getElementById('res');
  G_view_setInnerHTML(element, '');

  view_wormholeCount = 0;
  for (let i = 0; i < res.length; i++) {
    G_view_createResource(res[i]);
  }
};

const G_view_createLargeExplosion = (wx, wy, r, amt) => {
  for (let i = 0; i < amt; i++) {
    const { x, y } = G_getRandomLocInCircle(wx, wy, r);
    const { x: px, y: py } = G_view_worldToPx(x, y);
    setTimeout(() => {
      G_view_createExplosion(px, py);
    }, (i / amt) * 800);
  }
};

const G_view_createExplosion = (x, y) => {
  const id = x + ',' + y;
  if (G_view_getElementById(id)) {
    return;
  }
  view_createElement(
    G_view_getElementById('particles'),
    '',
    'expl',
    x - 50,
    y - 50,
    id
  );
};

const G_view_createTextParticle = (x, y, text, color) => {
  const id = 'text,' + x + ',' + y;
  if (G_view_getElementById(id)) {
    return;
  }
  view_createElement(
    G_view_getElementById('particles'),
    text,
    'text-particle',
    x - 100,
    y,
    id,
    { color }
  );
};

const G_view_createWormholeParticle = (x, y) => {
  for (let i = 0; i < 10; i++) {
    const angle = G_normalize(i, 0, 10, 0, 360);
    const id = `worm${i},${x},${y}`;
    if (G_view_getElementById(id)) {
      return;
    }

    view_createElement(
      G_view_getElementById('particles'),
      '<div class="worm"></div>',
      '',
      x,
      y,
      id,
      { transform: `rotateZ(${angle}deg)` }
    );
  }
};

const G_view_createShockwave = (x, y) => {
  const id = x + ',' + y;
  if (G_view_getElementById(id)) {
    return;
  }
  view_createElement(
    G_view_getElementById('particles'),
    `<div class="shockwave2"><div class="shockwave3"></div></div>`,
    'shockwave',
    x - 50 - 3,
    y - 50 - 3,
    id
  );
};
