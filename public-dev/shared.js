const G_R_CREATE = 'create';
const G_R_JOIN = 'join';
const G_R_LEAVE = 'leave';
const G_R_START = 'start';
const G_R_SET_MAP_INDEX = 'map';
const G_R_CONFIRM_ACTION = 'confirm';

const G_S_CONNECTED = 's-connected';
const G_S_LIST_UPDATED = 's-game-list';
const G_S_CREATE = 's-create';
const G_S_START = 's-start';
const G_S_LOBBY_LIST_UPDATED = 's-lobby-list';
const G_S_LEAVE = 's-leave';
const G_S_JOIN = 's-join';
const G_S_STOP = 's-stop';
const G_S_BROADCAST = 's-broadcast';
const G_S_START_SIMULATION = 's-simulate-start';
const G_S_STOP_SIMULATION = 's-simulate-stop';
const G_S_FINISHED = 's-finished';

// Gravitational constant
const G_G = 6.67428e-11;

// Assumed scale: 100 pixels = 1AU.
const G_AU = 149.6e6 * 1000; //  149.6 million km, in meters.
const G_SCALE = 75 / G_AU;
const G_FRAME_MS = 13.3333;

let G_SPEEDS = {
  Normal: [55000, 0],
  Super: [125000, 100],
};

const G_action_move = 'Move';
const G_action_shoot = 'Shoot';
const G_action_spread = 'Spreadfire';
const G_action_planetCracker = 'Planet Crkr';
const G_res_coin = 'coin';
const G_res_spray = 'spray';
const G_res_planetCracker = 'crack';

let G_actions = [
  [G_action_move, 75],
  [G_action_shoot, 0],
  [G_action_spread, 50],
  [G_action_planetCracker, 200],
];

let G_getActionCost = actionName =>
  G_actions.reduce(
    (cost, [name, cost2]) => (name === actionName ? cost2 : cost),
    0
  );
let G_getSpeedCost = speedName => G_SPEEDS[speedName][1];

const G_getRandomLocInCircle = (x, y, r) => {
  let th = 2 * Math.PI * Math.random();
  let rr = Math.sqrt(Math.random()) * r;
  return {
    x: x + rr * Math.cos(th),
    y: y + rr * Math.sin(th),
  };
};

const G_Body = (meta, mass, color, r, vx, vy, px, py, t) => {
  return {
    meta,
    mass,
    color,
    r,
    vx,
    vy,
    px,
    py,
    t,
  };
};

const G_applyGravity = (bodies, gravityBodies, extraColliders, dt) => {
  const _dist = (dx, dy) => Math.sqrt(dx ** 2 + dy ** 2);
  const _collides = (dx, dy, r1, r2) => _dist(dx, dy) <= r1 + r2;
  const _getAttraction = (self, other) => {
    let { px: sx, py: sy, mass: sMass, r: sr } = self;
    let { px: ox, py: oy, mass: oMass, r: or } = other;
    let dx = ox - sx;
    let dy = oy - sy;
    let d = Math.max(_dist(dx, dy), 0.001);
    let c = _collides(dx, dy, sr, or);
    let f = (G_G * sMass * oMass) / d ** 2;
    let theta = Math.atan2(dy, dx);
    let fx = Math.cos(theta) * f;
    let fy = Math.sin(theta) * f;
    return { fx, fy, c };
  };

  let collisions = [];
  let timeStep = (24 * 3600 * 2 * dt) / G_FRAME_MS; // two days / G_FRAME_MS
  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];
    let totalFx = 0,
      totalFy = 0;
    for (let j = 0; j < gravityBodies.length; j++) {
      let other = gravityBodies[j];
      if (body === other) {
        continue;
      }
      let { fx, fy, c } = _getAttraction(body, other);
      if (c) {
        collisions.push([body, other]);
        continue;
      }
      totalFx += fx;
      totalFy += fy;
    }

    for (let j = 0; j < extraColliders.length; j++) {
      let other = extraColliders[j];
      let { x, y, r } = other;
      let c = _collides(x - body.px, y - body.py, r, body.r);
      if (c && body.meta.player !== other.id) {
        collisions.push([body, other]);
      }
    }

    body.vx += (totalFx / body.mass) * timeStep;
    body.vy += (totalFy / body.mass) * timeStep;
    body.px += body.vx * timeStep;
    body.py += body.vy * timeStep;
  }
  return collisions;
};
