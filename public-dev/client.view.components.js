/*
global
G_SPEEDS
G_actions
G_getActionCost
G_getSpeedCost
G_view_none
G_view_block
G_view_innerHTML
G_view_getElementById
G_view_setInnerHTML
G_view_worldToPx
G_view_getColor
G_view_getColorStyles
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
G_model_isSoundEnabled
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

  G_view_setInnerHTML(
    G_view_getElementById('map-select-practice'),
    view_renderMapSelect({ ownerId: G_model_getUserId() }, 'menu-map-select')
  );
};

const G_view_renderLobby = lobbyData => {
  const { players } = lobbyData;
  const playersList = G_view_getElementById('players-lobby');
  G_view_setInnerHTML(playersList, '');
  for (let i = 0; i < players.length; i++) {
    const { id, userName } = players[i];
    let ind = i + 1;
    playersList[G_view_innerHTML] += `<div class="lobby-player">${ind}. ${
      id === G_model_getUserId()
        ? `<a class="lobby-name">${userName}</a>`
        : userName
    }</div>`;
  }

  const isOwner = players[0].id === G_model_getUserId();
  const canStart = players.length > 1 && players.length <= 4;
  const mapSelect = G_view_getElementById('map-select');
  mapSelect.parentElement.style.padding = isOwner ? '' : '0.5rem 0';
  G_view_setInnerHTML(
    mapSelect,
    view_renderMapSelect(lobbyData, 'lobby-map-select')
  );
  G_view_setInnerHTML(
    G_view_getElementById('lobby-title'),
    G_model_getGameName()
  );
  G_view_setInnerHTML(
    G_view_getElementById('player-count'),
    `<a style="color:${canStart ? '#12a012' : 'red'}">${
      players.length
    } of 4</a> joined (at least 2 required to start)`
  );
  const start = G_view_getElementById('start');
  start.style.display = isOwner ? G_view_block : G_view_none;
  start.disabled = canStart ? false : true;
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

const view_renderMapSelect = (lobbyData, id) => {
  const isOwner = G_model_getUserId() === lobbyData.ownerId;
  const currentMapIndex = isOwner ? G_model_getMapIndex() : lobbyData.mapIndex;
  const maps = G_model_getMaps();
  const mapName =
    currentMapIndex > -1 && currentMapIndex < maps.length
      ? maps[currentMapIndex].name
      : 'Custom Map';
  const options = G_model_getMaps().reduce((prev, curr, i) => {
    const selected = currentMapIndex === i ? 'selected' : '';
    return prev + `<option ${selected} value=${i}>${curr.name}</option>`;
  }, '');
  return isOwner
    ? `<select id="${id}" value="${currentMapIndex}" onchange="events.setMapIndex(this.id)">${options}</select>`
    : `<span style="color:lightblue;">${mapName}</span>`;
};

const G_view_renderReplayUI = (replay, gameData) => {
  if (!replay) {
    return;
  }

  const isGameOver = G_model_isGameOver();

  // visibility
  G_view_getElementById('controls').style.display = G_model_isSimulating()
    ? G_view_none
    : 'flex';
  G_view_getElementById('control-panel').style.display = G_view_none;
  G_view_getElementById('center-self').style.display = G_view_none;
  G_view_getElementById('leave-game').style.display = G_view_none;
  G_view_getElementById('view-last-replay').style.display = G_view_none;
  G_view_getElementById('back-practice').style.display = G_view_block;
  G_view_getElementById('confirm-button').style.display = G_view_none;

  // speed buttons
  G_view_setInnerHTML(G_view_getElementById('speed-buttons'), '');

  if (isGameOver) {
    G_view_setInnerHTML(
      G_view_getElementById('action-buttons'),
      `
<button onclick="events.viewLastReplay()">Restart Replay</button>
    `
    );
  } else {
    G_view_setInnerHTML(
      G_view_getElementById('action-buttons'),
      `
  <button onclick="events.replayNextRound()">Simulate Round</button>
    `
    );
  }

  // info
  const currentRoundIndex = G_model_getReplayRoundIndex();
  G_view_setInnerHTML(
    G_view_getElementById('funds'),
    'Current Round: ' +
      Math.min(currentRoundIndex + 1, replay.rounds.length) +
      '/' +
      replay.rounds.length
  );

  // target
  let target = G_view_getElementById('target');
  target.style.display = G_view_none;

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
