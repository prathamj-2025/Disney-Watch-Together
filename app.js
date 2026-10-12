/*
  Watch Together prototype (Team 10)
  A clickable concept for a synced co-watching feature with chat, voice and video.
  Plain JavaScript, no build step. All partner activity is simulated.
*/
(function () {
  'use strict';

  // ---------- Config ----------
  // Put your logo image at assets/logo.png. If it is missing, a text placeholder shows.
  var LOGO_SRC = 'assets/logo.png';
  var LOGO_TEXT = '[App logo]';
  var DURATION = 2580; // 43:00 in seconds
  var JOIN_CODE = 'K7Q4MZ';

  var TITLES = [
    { name: 'Starfall Academy', meta: 'Series · S1 E3 · Adventure · 2026', bg: 'linear-gradient(160deg, #4a5fd0 0%, #22307a 60%, #141c4a 100%)' },
    { name: 'The Lantern Keepers', meta: 'Movie · 1h 52m · Family · 2026', bg: 'linear-gradient(160deg, #b2508f 0%, #6e2a58 60%, #3a1530 100%)' },
    { name: 'Ocean Rangers', meta: 'Documentary · 43m · Nature · 2025', bg: 'linear-gradient(160deg, #2f9aa4 0%, #1b5e66 60%, #0d3338 100%)' },
    { name: 'Comet Kids', meta: 'Series · S2 E1 · Animation · 2026', bg: 'linear-gradient(160deg, #d48a3c 0%, #8a5422 60%, #4a2c10 100%)' }
  ];

  var POSTERS = [
    { i: 0, area: 'grid-column: 1; grid-row: 1 / span 2', h: 260, glow: false, size: 18 },
    { i: 1, area: 'grid-column: 2; grid-row: 1 / span 3', h: 440, glow: true, size: 30 },
    { i: 3, area: 'grid-column: 3; grid-row: 1 / span 2', h: 250, glow: false, size: 18 },
    { i: 2, area: 'grid-column: 1; grid-row: 3 / span 2', h: 280, glow: true, size: 18 },
    { i: 0, area: 'grid-column: 3; grid-row: 3 / span 2', h: 290, glow: false, size: 18 }
  ];

  var WALL_COLORS = ['#5c7f8f', '#7a5a6e', '#3f6f7a', '#8a7a52', '#4d5f8a', '#6e8a5c', '#8a4d4d', '#5a7a8a', '#3f5a6e',
    '#7a6e8a', '#5c8a7a', '#6e5a3f', '#4f6a80', '#80604f', '#5a806a', '#6a5a80', '#807a4f', '#4f8080'];

  var VIDEO_COLORS = ['#1d2a5c', '#3a2a5c', '#5c3a2a', '#2a5c4a'];

  var REACTIONS = ['Love it', 'Haha', 'Wow', 'Rewind!'];

  var MODES = [
    { id: 'couple', name: 'Couple mode', desc: 'A private session for two. Watch in sync and talk the whole time.', tags: ['2 people', 'Text, voice, video', 'Shared "Our list"'] },
    { id: 'family', name: 'Family mode', desc: 'A group session for up to 6. Kids profiles join safely with a parent hosting.', tags: ['Up to 6 people', 'Kid-safe', 'Parent controls'] }
  ];

  var PIP_SPOTS = [
    { name: 'bottom right', css: 'right: 28px; bottom: 130px' },
    { name: 'top right', css: 'right: 28px; top: 88px' },
    { name: 'top left', css: 'left: 28px; top: 88px' },
    { name: 'bottom left', css: 'left: 28px; bottom: 130px' }
  ];

  // ---------- State ----------
  var state = {
    screen: 'home',   // home | detail | watch
    setup: null,      // null | 'mode' | 'code'
    mode: 'couple',
    title: 1,
    joined: 0,
    copied: false,
    playing: true,
    t: 754,
    msgs: [],
    draft: '',
    mic: true,
    cam: false,
    banner: '',
    full: false,
    pip: 0,
    pipMin: false,
    logoOk: true
  };
  var timers = [];

  // ---------- Helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(t) {
    var m = Math.floor(t / 60), s = t % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function set(patch) { Object.assign(state, patch); render(); }

  function roster() {
    if (state.mode === 'couple') {
      return [
        { name: 'You', role: 'Host', initial: 'Y', color: '#0063e5' },
        { name: 'Priya', role: 'Partner · Chicago', initial: 'P', color: '#c45ab3' }
      ];
    }
    return [
      { name: 'You', role: 'Host', initial: 'Y', color: '#0063e5' },
      { name: 'Mom', role: 'Family · Mumbai', initial: 'M', color: '#c45ab3' },
      { name: 'Dad', role: 'Family · Mumbai', initial: 'D', color: '#d9822b' },
      { name: 'Aarav', role: 'Kids profile', initial: 'A', color: '#2fa07a', kid: true }
    ];
  }
  function joinedAll() { return state.joined >= roster().length - 1; }

  function addMsg(who, text, mine) {
    state.msgs = state.msgs.concat([{ who: who, text: text, mine: mine, at: fmt(state.t) }]).slice(-40);
    render();
  }
  function autoReply() {
    var couple = state.mode === 'couple';
    var lines = couple
      ? ['Haha same', 'Wait, rewind that part!', 'Missing you. Same time next week?', 'This scene is my favorite']
      : ['Aarav loves this part', 'Can you hear us okay?', 'Next week another movie?', 'So nice watching together'];
    var who = couple ? 'Priya' : (Math.random() < 0.5 ? 'Mom' : 'Dad');
    var line = lines[Math.floor(Math.random() * lines.length)];
    later(function () { addMsg(who, line, false); }, 1400);
  }

  // ---------- Icons ----------
  var I = {
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    trailer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9v6l5-3z"/></svg>',
    group: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M15 14.2c2.9 0 6 1.6 6 4.8"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    rewind: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    forward: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
    mic: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>',
    cam: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
    expand: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    shrink: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    move: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
    minus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>'
  };
  function icon(name, size) {
    return size ? I[name].replace(/width="\d+" height="\d+"/, 'width="' + size + '" height="' + size + '"') : I[name];
  }

  // ---------- Pieces ----------
  function logo(cls) {
    if (state.logoOk) {
      return '<img class="logo-img ' + (cls || '') + '" src="' + LOGO_SRC + '" alt="App logo" data-logo>';
    }
    return '<span class="' + (cls || '') + '">' + esc(LOGO_TEXT) + '</span>';
  }

  function header() {
    return '' +
      '<header class="topbar">' +
        '<button type="button" class="logo" data-action="home" aria-label="Home">' + logo('logo-sm') + '</button>' +
        '<nav class="nav" aria-label="Main">' +
          '<button type="button" data-action="home">HOME</button>' +
          '<button type="button" data-action="noop">SEARCH</button>' +
          '<button type="button" data-action="noop">WATCHLIST</button>' +
          '<button type="button" data-action="noop">MOVIES</button>' +
          '<button type="button" data-action="noop">SERIES</button>' +
          '<button type="button" class="accent" data-action="open-setup">WATCH TOGETHER</button>' +
        '</nav>' +
        '<div class="profile">Profile <div class="avatar-lg">Y</div></div>' +
      '</header>';
  }

  function tile(t, i, progress) {
    return '<button type="button" class="tile" style="background:' + t.bg + '" data-action="pick" data-i="' + i + '" aria-label="' + esc(t.name) + '">' +
      '<span class="tile-name">' + esc(t.name) + '</span>' +
      (progress ? '<span class="tile-progress"><div></div></span>' : '<span></span>') +
    '</button>';
  }

  function homeView() {
    var posters = POSTERS.map(function (p) {
      var t = TITLES[p.i];
      return '<button type="button" class="poster' + (p.glow ? ' glow' : '') + '" style="' + p.area + '; height:' + p.h + 'px; background:' + t.bg + '" data-action="pick" data-i="' + p.i + '" aria-label="' + esc(t.name) + '">' +
        '<span style="font-size:' + p.size + 'px">' + esc(t.name) + '</span></button>';
    }).join('');
    var cats = ['MOVIES', 'SERIES', 'ORIGINALS', 'FAMILY', 'DOCUMENTARY'].map(function (c) {
      return '<div class="category">' + c + '</div>';
    }).join('');
    var cont = TITLES.map(function (t, i) { return tile(t, i, true); }).join('');
    var rec = TITLES.map(function (t, i) { return { t: t, i: i }; }).reverse().map(function (o) { return tile(o.t, o.i, false); }).join('');
    return '' +
      '<main class="page">' +
        '<section class="hero">' +
          '<div class="hero-copy">' +
            '<div class="hero-logo">' + logo('logo-lg') + '</div>' +
            '<h1>Watch together, wherever you are.</h1>' +
            '<p>Start a Watch Together session with your partner or family. Stay in sync, and chat, talk, or video call while you watch.</p>' +
            '<div class="hero-actions">' +
              '<button type="button" class="btn-pill" data-action="open-setup">Start Watch Together</button>' +
              '<button type="button" class="btn-ghost" data-action="detail">Browse titles</button>' +
            '</div>' +
          '</div>' +
          '<div class="poster-collage">' + posters + '</div>' +
        '</section>' +
        '<div class="categories">' + cats + '</div>' +
        '<h2 class="row-title">Continue Watching</h2>' +
        '<div class="tiles">' + cont + '</div>' +
        '<h2 class="row-title">Recommended For You</h2>' +
        '<div class="tiles">' + rec + '</div>' +
      '</main>';
  }

  function detailView() {
    var t = TITLES[state.title];
    return '' +
      '<main class="page">' +
        '<section class="detail">' +
          '<div class="detail-copy">' +
            '<h1 class="detail-title">' + esc(t.name) + '</h1>' +
            '<div class="detail-meta">' + esc(t.meta) + '</div>' +
            '<div class="detail-actions">' +
              '<button type="button" class="btn-play" data-action="noop">' + I.play + 'Play</button>' +
              '<button type="button" class="btn-round" data-action="noop" aria-label="Add to watchlist">' + I.plus + '</button>' +
              '<button type="button" class="btn-round" data-action="noop" aria-label="Watch trailer">' + I.trailer + '</button>' +
              '<button type="button" class="btn-wt" data-action="open-setup">' + I.group + 'Watch Together</button>' +
            '</div>' +
            '<p class="detail-desc">Watch in sync with your partner or family, wherever they are. Chat, talk, or video call without leaving the app.</p>' +
          '</div>' +
          '<div class="detail-art"><div class="detail-poster" style="background:' + t.bg + '">' + esc(t.name) + '</div></div>' +
        '</section>' +
      '</main>';
  }

  function peopleList() {
    return roster().map(function (p, i) {
      var here = i === 0 || i <= state.joined;
      return '<div class="person">' +
        '<div class="av' + (here ? '' : ' waiting') + '" style="background:' + p.color + '">' + p.initial + '</div>' +
        '<div class="person-info"><div class="person-name">' + esc(p.name) + '</div><div class="person-role">' + esc(p.role) + '</div></div>' +
        '<div class="status' + (here ? ' ok' : '') + '">' + (here ? (i === 0 ? 'Ready' : 'Joined') : 'Waiting...') + '</div>' +
      '</div>';
    }).join('');
  }

  function setupDialog() {
    if (!state.setup) return '';
    var t = TITLES[state.title];
    var body;
    if (state.setup === 'mode') {
      var modes = MODES.map(function (m) {
        return '<button type="button" class="mode' + (state.mode === m.id ? ' on' : '') + '" data-action="mode" data-mode="' + m.id + '" aria-pressed="' + (state.mode === m.id) + '">' +
          '<span class="mode-head"><span class="mode-name">' + m.name + '</span><span class="radio"></span></span>' +
          '<span class="mode-desc">' + m.desc + '</span>' +
          '<span class="tags">' + m.tags.map(function (g) { return '<span class="tag">' + esc(g) + '</span>'; }).join('') + '</span>' +
        '</button>';
      }).join('');
      body = '' +
        '<p class="muted">Watching <strong style="color:#f9f9f9">' + esc(t.name) + '</strong>. Who are you watching with?</p>' +
        '<div class="modes">' + modes + '</div>' +
        '<button type="button" class="btn-wide" data-action="create">Create session</button>';
    } else {
      var all = joinedAll();
      body = '' +
        '<div><div class="kicker">' + (state.mode === 'couple' ? 'COUPLE MODE' : 'FAMILY MODE') + '</div>' +
        '<p class="muted" style="margin-top:6px">Share this code. Others enter it in Watch Together on their own account. It expires in 24 hours.</p></div>' +
        '<div class="code-box"><div class="code">' + JOIN_CODE + '</div>' +
          '<button type="button" class="chip-btn" data-action="copy">' + (state.copied ? 'Copied' : 'Copy code') + '</button>' +
          '<button type="button" class="chip-btn" data-action="copy">Share link</button></div>' +
        '<div class="people">' + peopleList() + '</div>' +
        '<div class="row-actions">' +
          '<button type="button" class="btn-outline" data-action="setup-back">Back</button>' +
          '<button type="button" class="btn-wide" data-action="start"' + (all ? '' : ' disabled') + '>' + (all ? 'Start watching together' : 'Waiting for others to join...') + '</button>' +
        '</div>';
    }
    return '' +
      '<div class="overlay" data-action="overlay">' +
        '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="setup-title">' +
          '<div class="dialog-head"><h2 id="setup-title">Watch Together</h2>' +
          '<button type="button" class="icon-btn" data-action="close-setup" aria-label="Close">' + I.close + '</button></div>' +
          body +
        '</div>' +
      '</div>';
  }

  function playerControls() {
    return '' +
      '<div class="controls">' +
        '<div class="bar"><div data-progress style="width:' + (state.t / DURATION * 100).toFixed(2) + '%"></div></div>' +
        '<div class="control-row">' +
          '<div class="time" data-time>' + fmt(state.t) + '</div>' +
          '<div class="control-btns">' +
            '<button type="button" class="ctl" data-action="rewind" aria-label="Rewind 10 seconds for everyone">' + I.rewind + '</button>' +
            '<button type="button" class="ctl main" data-action="toggle-play" aria-label="' + (state.playing ? 'Pause for everyone' : 'Play for everyone') + '">' + (state.playing ? I.pause : I.play) + '</button>' +
            '<button type="button" class="ctl" data-action="forward" aria-label="Skip 10 seconds for everyone">' + I.forward + '</button>' +
          '</div>' +
          '<div class="time end">' + fmt(DURATION) + '</div>' +
        '</div>' +
      '</div>';
  }

  function videoTiles(cls) {
    return roster().filter(function (p) { return !p.kid; }).map(function (p, i) {
      var off = i === 0 && !state.cam;
      return '<div class="video ' + (cls || '') + '" style="background:' + (off ? '#1a1d29' : VIDEO_COLORS[i % 4]) + '">' +
        (off ? '' : '<span class="face"></span>') +
        '<span class="label">' + (off ? 'You · camera off' : esc(p.name)) + '</span></div>';
    }).join('');
  }

  function reactionButtons() {
    return REACTIONS.map(function (r) {
      return '<button type="button" class="react" data-action="react" data-r="' + esc(r) + '">' + esc(r) + '</button>';
    }).join('');
  }

  function watchView() {
    var t = TITLES[state.title];
    var couple = state.mode === 'couple';
    var avs = roster().map(function (p) {
      return '<div class="av av-sm" style="background:' + p.color + '" title="' + esc(p.name) + '">' + p.initial + '</div>';
    }).join('');
    var msgs = state.msgs.map(function (m) {
      return '<div class="msg' + (m.mine ? ' mine' : '') + '"><div class="msg-meta">' + esc(m.who) + ' · ' + esc(m.at) + '</div><div class="bubble">' + esc(m.text) + '</div></div>';
    }).join('');
    return '' +
      '<main class="page">' +
        '<section class="watch">' +
          '<div class="player-col">' +
            '<div class="player" style="background:' + t.bg + '">' +
              '<div class="player-top">' +
                '<div class="player-top-left">' +
                  '<button type="button" class="glass-btn" data-action="leave">Leave session</button>' +
                  '<button type="button" class="glass-btn" data-action="full-on">' + I.expand + 'Full screen</button>' +
                '</div>' +
                '<div class="sync-pill"><span class="dot"></span>In sync · ' + roster().length + ' watching</div>' +
              '</div>' +
              '<div class="player-title">' + esc(t.name) + '</div>' +
              playerControls() +
            '</div>' +
            (state.banner ? '<div class="banner" role="status">' + esc(state.banner) + '</div>' : '') +
          '</div>' +
          '<aside class="side" aria-label="Session">' +
            '<div class="side-head">' +
              '<div class="side-title"><strong>' + (couple ? 'Couple mode' : 'Family mode') + '</strong><span>Code ' + JOIN_CODE + '</span></div>' +
              '<div class="side-people"><div class="avs">' + avs + '</div>' +
                '<button type="button" class="toggle' + (state.mic ? ' on' : '') + '" data-action="mic" aria-label="' + (state.mic ? 'Mute microphone' : 'Unmute microphone') + '" aria-pressed="' + state.mic + '">' + I.mic + '</button>' +
                '<button type="button" class="toggle' + (state.cam ? ' on' : '') + '" data-action="cam" aria-label="' + (state.cam ? 'Turn camera off' : 'Turn camera on') + '" aria-pressed="' + state.cam + '">' + I.cam + '</button>' +
              '</div>' +
              (state.cam ? '<div class="video-grid">' + videoTiles() + '</div>' : '') +
            '</div>' +
            '<div class="msgs" data-msgs>' + msgs + '</div>' +
            (couple ? '' : '<div class="kid-note">Aarav is on a kids profile: preset reactions only, no video.</div>') +
            '<div class="reactions">' + reactionButtons() + '</div>' +
            '<form class="composer" data-composer>' +
              '<label class="sr-only" for="chat">Message</label>' +
              '<input id="chat" type="text" autocomplete="off" placeholder="Message ' + (couple ? 'Priya' : 'family') + '..." value="' + esc(state.draft) + '">' +
              '<button type="submit" class="send">Send</button>' +
            '</form>' +
          '</aside>' +
        '</section>' +
      '</main>';
  }

  function fullView() {
    var t = TITLES[state.title];
    var couple = state.mode === 'couple';
    var spot = PIP_SPOTS[state.pip];
    var next = PIP_SPOTS[(state.pip + 1) % 4].name;
    var last = state.msgs[state.msgs.length - 1];
    var pipBody = state.pipMin ? '' :
      '<div class="pip-grid" style="grid-template-columns: repeat(' + (couple ? 2 : 3) + ', minmax(0, 1fr))">' + videoTiles() + '</div>' +
      (last ? '<div class="pip-msg"><strong>' + esc(last.who) + ':</strong> ' + esc(last.text) + '</div>' : '') +
      '<div class="pip-reacts">' + reactionButtons() + '</div>';
    return '' +
      '<div class="full" style="background:' + t.bg + '">' +
        '<div class="player-top">' +
          '<div class="sync-pill"><span class="dot"></span>In sync · ' + roster().length + ' watching</div>' +
          '<button type="button" class="glass-btn" data-action="full-off">' + I.shrink + 'Exit full screen</button>' +
        '</div>' +
        '<div class="full-title">' + esc(t.name) + '</div>' +
        playerControls() +
        '<div class="pip" style="' + spot.css + '; width:' + (couple ? 300 : 360) + 'px" aria-label="Live video window">' +
          '<div class="pip-bar">' +
            '<span class="live"></span><strong>Live · ' + (couple ? 'Couple mode' : 'Family mode') + '</strong>' +
            '<button type="button" class="pip-btn ' + (state.mic ? 'on' : 'off') + '" data-action="mic" aria-label="' + (state.mic ? 'Mute microphone' : 'Unmute microphone') + '">' + icon('mic', 14) + '</button>' +
            '<button type="button" class="pip-btn ' + (state.cam ? 'on' : 'off') + '" data-action="cam" aria-label="' + (state.cam ? 'Turn camera off' : 'Turn camera on') + '">' + icon('cam', 14) + '</button>' +
            '<button type="button" class="pip-btn" data-action="pip-move" aria-label="Move window to ' + next + '" title="Move to ' + next + '">' + I.move + '</button>' +
            '<button type="button" class="pip-btn" data-action="pip-min" aria-label="' + (state.pipMin ? 'Expand video window' : 'Minimize video window') + '">' + I.minus + '</button>' +
          '</div>' +
          pipBody +
        '</div>' +
      '</div>';
  }

  // ---------- Render ----------
  var app = document.getElementById('app');

  function render() {
    var active = document.activeElement;
    var chatFocused = active && active.id === 'chat';
    var caret = chatFocused ? active.selectionStart : null;

    var body = '';
    if (state.screen === 'home') body = homeView();
    else if (state.screen === 'detail') body = detailView();
    else if (state.screen === 'watch') body = watchView();

    app.innerHTML = header() + body + setupDialog() +
      (state.screen === 'watch' && state.full ? fullView() : '') +
      '<p class="footer-note">Concept prototype by Team 10 for a class case study. Not affiliated with or endorsed by any streaming service. Titles and people are placeholders.</p>';

    // Hide the logo image if the file is missing
    Array.prototype.forEach.call(app.querySelectorAll('[data-logo]'), function (img) {
      img.addEventListener('error', function () { if (state.logoOk) { state.logoOk = false; render(); } });
    });

    var list = app.querySelector('[data-msgs]');
    if (list) list.scrollTop = list.scrollHeight;

    if (chatFocused) {
      var input = document.getElementById('chat');
      if (input) { input.focus(); try { input.setSelectionRange(caret, caret); } catch (e) { /* ignore */ } }
    }
  }

  // Update only the clock and progress bar each second, so typing is never interrupted
  function tick() {
    if (state.screen !== 'watch' || !state.playing) return;
    state.t = Math.min(state.t + 1, DURATION);
    Array.prototype.forEach.call(app.querySelectorAll('[data-time]'), function (el) { el.textContent = fmt(state.t); });
    Array.prototype.forEach.call(app.querySelectorAll('[data-progress]'), function (el) { el.style.width = (state.t / DURATION * 100).toFixed(2) + '%'; });
  }

  // ---------- Actions ----------
  function openSetup() {
    if (state.screen === 'home' || state.screen === 'watch') state.screen = 'detail';
    set({ setup: 'mode', full: false });
  }

  function createSession() {
    clearTimers();
    set({ setup: 'code', joined: 0, copied: false });
    var n = roster().length - 1;
    for (var i = 1; i <= n; i++) {
      (function (k) { later(function () { if (state.setup === 'code') set({ joined: k }); }, 1200 * k); })(i);
    }
  }

  function startWatching() {
    if (!joinedAll()) return;
    var couple = state.mode === 'couple';
    set({
      screen: 'watch', setup: null, playing: true, t: 754, cam: false, full: false, pipMin: false,
      banner: 'Everyone is synced at 12:34',
      msgs: [{ who: couple ? 'Priya' : 'Mom', text: couple ? 'Ready! Popcorn in hand' : 'We can see it! Hi Aarav', mine: false, at: '12:34' }]
    });
  }

  function enterFull() {
    set({ full: true });
    var el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(function () { /* stay in the in-page full view */ });
  }

  function exitFull() {
    set({ full: false });
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
  }

  function sendDraft() {
    var text = (state.draft || '').trim();
    if (!text) return;
    state.draft = '';
    addMsg('You', text, true);
    autoReply();
  }

  var actions = {
    noop: function () {},
    home: function () { set({ screen: 'home', setup: null, full: false }); },
    detail: function () { set({ screen: 'detail' }); },
    pick: function (el) { set({ title: Number(el.getAttribute('data-i')), screen: 'detail', setup: null }); window.scrollTo(0, 0); },
    'open-setup': openSetup,
    'close-setup': function () { clearTimers(); set({ setup: null }); },
    overlay: function (el, ev) { if (ev.target === el) actions['close-setup'](); },
    'setup-back': function () { clearTimers(); set({ setup: 'mode' }); },
    mode: function (el) { set({ mode: el.getAttribute('data-mode') }); },
    create: createSession,
    copy: function () {
      if (navigator.clipboard) navigator.clipboard.writeText(JOIN_CODE).catch(function () {});
      set({ copied: true });
    },
    start: startWatching,
    leave: function () { exitFull(); set({ screen: 'detail' }); },
    'toggle-play': function () {
      var p = !state.playing;
      set({ playing: p, banner: 'You ' + (p ? 'resumed' : 'paused') + ' for everyone at ' + fmt(state.t) });
    },
    rewind: function () { set({ t: Math.max(0, state.t - 10), banner: 'You rewound 10s for everyone' }); },
    forward: function () { set({ t: Math.min(DURATION, state.t + 10), banner: 'You skipped ahead 10s for everyone' }); },
    mic: function () { set({ mic: !state.mic, banner: state.mic ? 'Your mic is muted' : 'Voice chat on' }); },
    cam: function () { set({ cam: !state.cam, banner: state.cam ? 'Video off' : 'Video chat on' }); },
    react: function (el) { addMsg('You', el.getAttribute('data-r'), true); },
    'full-on': enterFull,
    'full-off': exitFull,
    'pip-move': function () { set({ pip: (state.pip + 1) % 4 }); },
    'pip-min': function () { set({ pipMin: !state.pipMin }); }
  };

  app.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-action]');
    if (!el || !app.contains(el)) return;
    var fn = actions[el.getAttribute('data-action')];
    if (fn) fn(el, ev);
  });

  app.addEventListener('input', function (ev) {
    if (ev.target.id === 'chat') state.draft = ev.target.value;
  });

  app.addEventListener('submit', function (ev) {
    if (ev.target.hasAttribute('data-composer')) { ev.preventDefault(); sendDraft(); }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (state.setup) actions['close-setup']();
    else if (state.full) exitFull();
  });

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && state.full) set({ full: false });
  });

  // ---------- Boot ----------
  var wall = document.querySelector('.poster-wall');
  if (wall) wall.innerHTML = WALL_COLORS.map(function (c) { return '<div style="background:' + c + '"></div>'; }).join('');

  render();
  setInterval(tick, 1000);
})();
