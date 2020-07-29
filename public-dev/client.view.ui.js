/*
global
G_SPEEDS
G_actions
G_action_cluster
G_action_waveBomb
G_action_boomerang
G_getActionCost
G_getSpeedCost
G_res_coin
G_res_spray
G_res_cluster
G_res_waveBomb
G_res_planetCracker
G_res_wormhole
G_res_proximityMine
G_view_none
G_view_block
G_view_innerHTML
G_view_getElementById
G_view_setInnerHTML
G_view_worldToPx
G_view_getColor
G_view_getColorStyles
G_view_showElement
G_view_hideElement
G_view_createResource
G_view_wormholeCount
G_model_getMe
G_model_isLoading
G_model_isGameOver
G_model_isWaitingForSimToStart
G_model_isSimulating
G_model_getSelectedSpeed
G_model_getColor
G_model_isPractice
G_model_getSelectedAction
G_model_getTargetLocation
G_model_getPlayer
G_model_getUserId
G_model_getGameName
G_model_getGameMetadata
G_model_getMapIndex
G_model_getMaps
G_model_getReplayRoundIndex
G_model_getAuxLifetimeMultiplier
G_model_setAuxLifetimeMultiplier
G_model_getBoomerangAngle
G_model_setBoomerangAngle
G_model_isSoundEnabled
G_superfine_h
G_superfine_text
G_superfine_patch
events
*/

const G_view_renderGameUI = gameData => {
  if (!gameData) {
    return;
  }

  const player = G_model_getMe(gameData);
  const isLoading = G_model_isLoading();
  const isGameOver = G_model_isGameOver();
  const isDead = player.dead;
  const isWaiting = G_model_isWaitingForSimToStart();

  // visibility
  G_view_getElementById('controls').style.display =
    G_model_isSimulating() || isWaiting || isGameOver || isDead
      ? G_view_none
      : 'flex';
  G_view_getElementById('center-self').style.display = G_view_block;
  G_view_getElementById('confirm-button').style.display = G_view_block;
  G_view_getElementById('control-panel').style.display = 'flex';
  G_view_hideElement('controls-replay');

  G_view_getElementById('leave-game').style.display =
    isGameOver || isDead ? G_view_block : G_view_none;
  G_view_getElementById('view-last-replay').style.display = isGameOver
    ? G_view_block
    : G_view_none;

  // control buttons
  let htmlSpeeds = '';
  Object.keys(G_SPEEDS).forEach(speedName => {
    let [, cost] = G_SPEEDS[speedName];
    let selected = speedName === G_model_getSelectedSpeed();
    let style = selected ? G_view_getColorStyles(G_model_getColor()) : '';
    htmlSpeeds += `<div class="action-label" style="pointer-events:${
      isLoading ? G_view_none : 'all'
    }">
<div>Cost $${cost}</div>
<div class="action" style="${style}" id="${speedName}" onclick="events.setSpeed('${speedName}')" onmousedown="events.setSpeed('${speedName}')">${speedName}
</div>
</div>`;
  });
  G_view_setInnerHTML(G_view_getElementById('speed-buttons'), htmlSpeeds);
  G_view_getElementById('back-practice').style.display = G_model_isPractice()
    ? G_view_block
    : G_view_none;

  // action buttons
  let htmlActions = '';
  G_actions.forEach(([actionName, cost], i) => {
    const amt = player.actions[actionName];
    if (amt) {
      htmlActions =
        view_renderActionButton(
          actionName + (amt < 99 ? ` (${amt})` : ''),
          `$${cost}`,
          actionName,
          i > 1
        ) + htmlActions;
    }
  });
  G_view_setInnerHTML(G_view_getElementById('action-buttons'), htmlActions);

  const totalCost =
    G_getActionCost(G_model_getSelectedAction()) +
    G_getSpeedCost(G_model_getSelectedSpeed());

  G_view_getElementById('confirm-button').disabled = totalCost > player.funds;

  // info
  G_view_setInnerHTML(
    G_view_getElementById('funds'),
    `Funds: $${player.funds}`
  );

  // target
  let target = G_view_getElementById('target');
  const loc = G_model_getTargetLocation();
  const { x, y } = G_view_worldToPx(loc[0], loc[1]);
  target.style.display =
    G_model_isSimulating() || isGameOver || isDead ? G_view_none : 'flex';
  target.style.left = x - 30 + 'px';
  target.style.top = y - 30 + 'px';
  target.style.stroke = G_view_getColor('', G_model_getColor());
  target.className = 'target';
  const X = G_view_getElementById('x').cloneNode(true);
  X.id = 'x2';
  X.style.display = G_view_block;
  G_view_setInnerHTML(target, '');
  target.appendChild(X);

  G_view_renderGameBanners(gameData);
  G_view_renderAuxControls();
};

const G_view_renderGameBanners = (gameData, gameMetadata, replay) => {
  const player = G_model_getMe(gameData);
  const isGameOver = G_model_isGameOver();
  const isDead = player.dead;
  const isWaiting = G_model_isWaitingForSimToStart();

  const bannerMessage = G_view_getElementById('banner-message');
  const bannerMessage2 = G_view_getElementById('banner-message2');

  G_view_setInnerHTML(bannerMessage, '');
  G_view_setInnerHTML(bannerMessage2, '');

  if (isGameOver) {
    const winner = G_model_getPlayer(gameData.result, gameData);
    G_view_setInnerHTML(bannerMessage, 'The Game is Over!');
    if (winner) {
      G_view_setInnerHTML(
        bannerMessage2,
        `The Victor is <span style="${G_view_getColorStyles(winner.color)}">${
          winner.name
        }</span>!`
      );
    } else {
      G_view_setInnerHTML(bannerMessage2, `The result is a DRAW!`);
    }
    return;
  }

  if (replay) {
    G_view_setInnerHTML(bannerMessage, `Viewing replay: ${replay.name}`);
    return;
  }

  if (isDead) {
    G_view_setInnerHTML(bannerMessage, 'You have been eliminated!');
    return;
  }

  if (G_model_isSimulating()) {
    return;
  }

  if (isWaiting) {
    gameMetadata = gameMetadata || G_model_getGameMetadata();
    const playersNotReady = gameMetadata.playersNotReady || [];
    if (playersNotReady.length === 0) {
      return;
    }
    G_view_setInnerHTML(
      bannerMessage,
      'Waiting for other players: ' +
        playersNotReady
          .map(({ playerName, color }) => {
            return `<span style="${G_view_getColorStyles(
              color
            )}">${playerName}</span>`;
          })
          .join(', ')
    );
    return;
  }

  G_view_setInnerHTML(
    bannerMessage,
    `You are the <span style="${G_view_getColorStyles(
      player.color
    )}border:1px solid;padding:2px;">${player.color}</span> player.`
  );
  G_view_setInnerHTML(
    bannerMessage2,
    `<span style="color:${G_view_getColor(
      'light',
      player.color
    )}">[Right Click/Dbl Tap]</span> to set Target.<br /> <span style="color:${G_view_getColor(
      'light',
      player.color
    )}">[Left Click/Tap]</span> to pan.`
  );
};

const G_view_renderGameList = games => {
  const gamesList = G_view_getElementById('games');
  G_view_setInnerHTML(gamesList, '');
  for (let i = 0; i < games.length; i++) {
    const { id, name } = games[i];
    let ind = i + 1;
    gamesList[
      G_view_innerHTML
    ] += `<button class="join-button" onclick="events.join('${id}')">${ind}. Join Game: ${name}</button>`;
  }

  if (!games.length) {
    G_view_setInnerHTML(
      gamesList,
      '<span style="color:lightblue"> There are no joinable games at the moment.</span>'
    );
  }

  const mapSelectPractice = G_view_getElementById('map-select-practice');
  if (mapSelectPractice && mapSelectPractice.parentElement) {
    G_superfine_patch(
      mapSelectPractice,
      view_createMapSelect({ ownerId: G_model_getUserId() }, 'menu-map-select')
    );
  }
};

const G_view_renderLobby = lobbyData => {
  const { players } = lobbyData;
  const canStart = players.length > 1 && players.length <= 4;
  const isOwner = players[0].id === G_model_getUserId();

  G_superfine_patch(
    G_view_getElementById('lobby'),
    G_superfine_h('div', {}, [
      G_superfine_h(
        'button',
        {
          className: 'back',
          onclick: events.leave,
        },
        G_superfine_text('Back')
      ),
      G_superfine_h(
        'div',
        {
          id: 'lobby-title',
        },
        G_superfine_text(G_model_getGameName())
      ),
      G_superfine_h(
        'span',
        {
          className: 'menu-section',
        },
        [
          G_superfine_h('span', {}, G_superfine_text('Map: ')),
          G_superfine_h(
            'span',
            { id: 'map-select' },
            view_createMapSelect(lobbyData, 'lobby-map-select')
          ),
        ]
      ),
      G_superfine_h('span', { id: 'player-count', style: 'margin:.5rem' }, [
        G_superfine_h(
          'a',
          {
            style: `color:${canStart ? '#12a012' : 'red'}`,
          },
          G_superfine_text(players.length + ' of 4')
        ),
        G_superfine_text(
          ` joined${canStart ? '.' : ' (at least 2 required to start).'}`
        ),
      ]),
      G_superfine_h(
        'button',
        {
          id: 'start',
          onclick: events.start,
          disabled: !canStart,
          style: isOwner ? '' : 'display: none',
        },
        G_superfine_text('Start Game!')
      ),
      G_superfine_h(
        'div',
        {
          id: 'players-lobby',
          className: 'menu-section',
        },
        players.map(({ id, userName }, i) => {
          return G_superfine_h(
            'div',
            {
              className: 'lobby-player',
            },
            id === G_model_getUserId()
              ? G_superfine_h(
                  'a',
                  { className: 'lobby-name' },
                  G_superfine_text(i + 1 + '. ' + userName)
                )
              : G_superfine_text(i + 1 + '. ' + userName)
          );
        })
      ),
    ])
  );
};

const view_renderActionButton = (label, helperText, actionName, animated) => {
  const anim = '2s linear infinite border-color;';
  let selected = G_model_getSelectedAction() === actionName;
  let style = selected ? G_view_getColorStyles(G_model_getColor()) : '';
  return `<div class="h-button-list">
<button class="action" onclick="events.setAction('${actionName}')" onmousedown="events.setAction('${actionName}')"
style="${style};width:80%;margin:2px;animation:${
    animated ? anim : ''
  }">${label}</button>
<div>${helperText}</div>
</div>`;
};

const view_createMapSelect = (lobbyData, id) => {
  const isOwner = G_model_getUserId() === lobbyData.ownerId;
  const currentMapIndex = isOwner ? G_model_getMapIndex() : lobbyData.mapIndex;
  const maps = G_model_getMaps();
  const currentMapName =
    currentMapIndex > -1 && currentMapIndex < maps.length
      ? maps[currentMapIndex].name
      : 'Custom Map';

  if (isOwner) {
    return G_superfine_h(
      'select',
      {
        id,
        value: currentMapIndex,
        onchange: function(ev) {
          events.setMapIndex(ev.target.id);
        },
      },
      G_model_getMaps().map((map, i) => {
        const selected = currentMapIndex === i ? 'selected' : '';
        return G_superfine_h(
          'option',
          {
            value: i,
            selected,
          },
          G_superfine_text(map.name)
        );
      })
    );
  } else {
    return G_superfine_h(
      'span',
      {
        style: 'color: lightblue',
      },
      G_superfine_text(currentMapName)
    );
  }
};

const G_view_renderReplayUI = (replay, gameData) => {
  if (!replay) {
    return;
  }

  const isGameOver = G_model_isGameOver();

  // visibility
  G_view_hideElement('controls');
  G_view_hideElement('center-self');
  G_view_hideElement('leave-game');
  G_view_hideElement('view-last-replay');
  G_view_hideElement('confirm-button');
  G_view_hideElement('controls-additional');

  G_view_showElement('back-practice');
  if (G_model_isSimulating()) {
    G_view_hideElement('controls-replay');
  } else {
    G_view_showElement('controls-replay');
  }

  if (isGameOver) {
    G_view_showElement('replay-restart');
    G_view_hideElement('replay-next-round');
  } else {
    G_view_showElement('replay-next-round');
    G_view_hideElement('replay-restart');
  }

  // info
  const currentRoundIndex = G_model_getReplayRoundIndex();
  G_view_setInnerHTML(
    G_view_getElementById('replay-round-label'),
    'Current Round: ' +
      Math.min(currentRoundIndex + 1, replay.rounds.length) +
      '/' +
      replay.rounds.length
  );

  // target
  G_view_hideElement('target');

  G_view_renderGameBanners(gameData, null, replay);
};

const G_view_renderSoundToggle = () => {
  const soundEnabled = G_model_isSoundEnabled();
  const elem = G_view_getElementById('sound');
  elem.style.background = 'white';
  if (soundEnabled) {
    elem.src = 'sound.svg';
  } else {
    elem.src = 'no-sound.svg';
  }
};

const G_view_auxControls = {
  [G_action_cluster]: {
    render: () => {
      const value = G_model_getAuxLifetimeMultiplier();
      const input = G_view_getElementById('controls-slider-input');
      input.value = value;
      input.min = 0.25;
      input.max = 2;
      input.step = 0.25;
      const renderLabel = value => {
        G_view_setInnerHTML(
          G_view_getElementById('controls-slider-input-label'),
          `Lifetime: ${value * 2}s`
        );
      };
      input.onchange = ev => {
        G_model_setAuxLifetimeMultiplier(ev.target.value);
        G_view_auxControls[G_action_cluster].render();
      };
      input.oninput = ev => {
        renderLabel(ev.target.value);
      };
      G_view_getElementById('controls-slider').style.display = G_view_block;
      renderLabel(value);
    },
    getArgs: () => {
      return {
        lifetimeMultiplier: G_model_getAuxLifetimeMultiplier(),
      };
    },
  },
  [G_action_waveBomb]: {
    render: () => {
      const value = G_model_getAuxLifetimeMultiplier();
      const input = G_view_getElementById('controls-slider-input');
      input.value = value;
      input.min = 0.25;
      input.max = 2;
      input.step = 0.25;
      const renderLabel = value => {
        G_view_setInnerHTML(
          G_view_getElementById('controls-slider-input-label'),
          `Lifetime: ${value * 2}s`
        );
      };
      input.onchange = ev => {
        G_model_setAuxLifetimeMultiplier(ev.target.value);
        G_view_auxControls[G_action_waveBomb].render();
      };
      input.oninput = ev => {
        renderLabel(ev.target.value);
      };
      G_view_getElementById('controls-slider').style.display = G_view_block;
      renderLabel(value);
    },
    getArgs: () => {
      return {
        lifetimeMultiplier: G_model_getAuxLifetimeMultiplier(),
      };
    },
  },
  // [G_action_boomerang]: {
  //   render: () => {
  //     const value = G_model_getBoomerangAngle();
  //     const input = G_view_getElementById('controls-slider-input');
  //     input.value = value;
  //     input.min = 0;
  //     input.max = 360;
  //     input.step = 1;
  //     const renderLabel = value => {
  //       let deg = -135 + Number(value);
  //       G_view_setInnerHTML(
  //         G_view_getElementById('controls-slider-input-label'),
  //         `<div style="margin:0.5rem; text-align:center"><div class="arrow" style="transform: rotate(${deg}deg)"></div></div>
  //         <div>Accel. Angle: ${value} deg</div>`
  //       );
  //     };
  //     input.onchange = ev => {
  //       G_model_setBoomerangAngle(ev.target.value);
  //       G_view_auxControls[G_action_boomerang].render();
  //     };
  //     input.oninput = ev => {
  //       renderLabel(ev.target.value);
  //     };
  //     G_view_getElementById('controls-slider').style.display = G_view_block;
  //     renderLabel(value);
  //   },
  //   getArgs: () => {
  //     return {
  //       accelerationAngle: G_model_getBoomerangAngle(),
  //     };
  //   },
  // },
};

const G_view_renderAuxControls = () => {
  const controlsAdditional = G_view_getElementById('controls-additional');
  controlsAdditional.style.display = null;
  Array.prototype.forEach.call(controlsAdditional.children, elem => {
    if (elem.id !== 'confirm-button') {
      elem.style.display = G_view_none;
    }
  });

  const selectedAction = G_model_getSelectedAction();
  const auxObj = G_view_auxControls[selectedAction];

  if (auxObj) {
    auxObj.render();
  } else {
    // G_view_auxControls[G_action_cluster].render();
  }
};

const G_view_createInfoElem = (elemType, description) => {
  const parent = document.createElement('div');
  parent.className = 'menu-info-item';
  const coin = G_view_createResource(
    {
      id: 'info-' + elemType,
      x: 0,
      y: 0,
      type: elemType,
    },
    parent
  );
  coin.style.left = -45;
  coin.style.top = 20;
  coin.style['font-size'] = 0;
  const descriptionDiv = document.createElement('div');
  descriptionDiv.className = 'menu-info-text';
  G_view_setInnerHTML(descriptionDiv, description);
  parent.appendChild(descriptionDiv);
  return parent;
};

const G_view_renderMenuInfo = () => {
  const elem = G_view_getElementById('menu-info');
  G_view_wormholeCount = 0; // eslint-disable-line
  G_view_setInnerHTML(elem, '');
  elem.appendChild(
    G_view_createInfoElem(
      G_res_coin,
      'Shoot coins to gain funds for more powerful weapons.'
    )
  );
  elem.appendChild(
    G_view_createInfoElem(
      G_res_spray,
      'The Spread Fire missile shoots three projectiles at a slight angle.'
    )
  );
  elem.appendChild(
    G_view_createInfoElem(
      G_res_cluster,
      'The Cluster Bomb explodes into a flower of missiles.'
    )
  );
  elem.appendChild(
    G_view_createInfoElem(
      G_res_waveBomb,
      'The Wave Bomb explodes in a shockwave.'
    )
  );
  elem.appendChild(
    G_view_createInfoElem(
      G_res_planetCracker,
      'The Planet Cracker can destroy a planet.'
    )
  );
  elem.appendChild(
    G_view_createInfoElem(
      G_res_wormhole,
      'Wormholes teleport projectiles to the other wormhole of corresponding color.'
    )
  );
  elem.appendChild(
    G_view_createInfoElem(
      G_res_proximityMine,
      'Proximity mines explode with a shockwave that can damage players or detonate other mines.'
    )
  );
};
