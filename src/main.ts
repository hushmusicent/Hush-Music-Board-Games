import './index.css';
import { SCRABBLE_WEBSTER_SET, isWebsterScrabbleWord, WEBSTER_EDITION_INFO } from './scrabbleDictionary';
import { PICTIONARY_LEVELS, getPictionaryLevel, PICTIONARY_WORDS, pickSessionWord, pickPictionaryOptions } from './pictionaryData';
import { getDeck, DeckEdition, GuessWhoChar, CLASSIC_DECK, MODERN_DECK } from './guessWhoData';

declare const firebase: any;

declare global {
  interface Window {
    _C: any;
    webkitAudioContext: any;
    AudioContext: any;
    firebase: any;
  }
}

/* ================= CONFIG =================
   Firebase keys are baked in below, so online PvP works for every player
   with no setup. A manually pasted config (Profile → Setup) overrides them.
   Voice talk is pure WebRTC over the same Firebase database (the hand-game
   recipe): no LiveKit, no token server, no API keys — it works for every
   player in a room automatically. Demo mode (this device only) works
   without keys. */
const CONFIG = {
  firebase: { apiKey: "AIzaSyAhT_oPTtMTlUvHaSOf7zWvnUwTGyJf4sk", authDomain: "project-556676b3-bbce-4e02-8ce.firebaseapp.com", databaseURL: "https://project-556676b3-bbce-4e02-8ce-default-rtdb.firebaseio.com", projectId: "project-556676b3-bbce-4e02-8ce", appId: "1:1043689485585:web:a96258740de6856c5f88b0" }
};
try {
  const saved = JSON.parse(localStorage.getItem('bgh_fbcfg') || 'null');
  if (saved) CONFIG.firebase = saved;
} catch (e) {}

const START_POINTS = 1000, DAILY_BONUS = 500;
const PAYOUTS: Record<string, number> = {
  monopoly: 120,
  scrabble: 100,
  battleship: 80,
  candyland: 30,
  chutes: 30,
  clue: 120,
  mancala: 60,
  payday: 80,
  pictionary: 60,
  sorry: 60,
  life: 80,
  trouble: 50,
  jumanji: 60,
  connect4: 50,
  guesswho: 70
};

/* ================= utils ================= */
const $ = (s: string) => document.querySelector(s) as HTMLElement | any;
const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
const rnd = (n: number) => Math.floor(Math.random() * n);
const ri = (a: number, b: number) => a + rnd(b - a + 1);
const shuffle = (a: any[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function toast(t: string) {
  const v = $('#view');
  if (!v) return;
  const d = document.createElement('div');
  d.className = 'msg';
  d.innerHTML = esc(t);
  v.prepend(d);
  setTimeout(() => d.remove(), 3500);
}
// Lenient config parsing: accepts pure JSON or the JS snippet Firebase shows
// (e.g. `const firebaseConfig = { apiKey: "...", ... };`).
function parseLooseJson(s: string): any {
  let t = s.trim();
  t = t.replace(/^(?:const|var|let)?\s*(?:[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*)?/, '');
  t = t.replace(/;\s*$/, '').trim();
  try { return JSON.parse(t); } catch (_) { /* fall through to JS-object fixup */ }
  const q = t
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3')
    .replace(/'([^']*)'/g, '"$1"');
  return JSON.parse(q);
}
function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector('script[src="' + src + '"]')) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    s.onerror = rej;
    document.head.appendChild(s);
  });
}
function modal(html: string) {
  const r = $('#modalRoot');
  r.innerHTML = '<div class="modal"><div class="card">' + html + '</div></div>';
  return r.firstChild as HTMLElement;
}
function closeModal() {
  $('#modalRoot').innerHTML = '';
}
(window as any).closeModal = closeModal;
(window as any).modal = modal;

/* ================= sound ================= */
const Sound = {
  ctx: null as AudioContext | null,
  muted: localStorage.getItem('bgh_muted') === '1',
  ensure() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {}
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  beep(f: number, d: number, type?: OscillatorType) {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(.12, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + d);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + d);
  },
  click() { this.beep(600, .07, 'square'); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, .15), i * 120)); },
  lose() { [400, 300, 220].forEach((f, i) => setTimeout(() => this.beep(f, .2, 'sawtooth'), i * 140)); },
  dice() { this.beep(220, .08, 'square'); setTimeout(() => this.beep(330, .08, 'square'), 90); },
  bean() {
    this.beep(850, .03, 'sine');
    setTimeout(() => this.beep(1100, .03, 'sine'), 40);
    setTimeout(() => this.beep(720, .04, 'sine'), 85);
  },
  ladder() {
    [330, 440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.beep(f, .12, 'sine'), i * 65));
  },
  chute() {
    [780, 660, 540, 430, 320, 220].forEach((f, i) => setTimeout(() => this.beep(f, .13, 'sawtooth'), i * 75));
  },
  spin() {
    [0, 60, 120, 180, 240, 310, 390, 480, 580, 700].forEach(ms => setTimeout(() => this.beep(750, .02, 'square'), ms));
  },
  card() {
    this.beep(520, .05, 'triangle');
    setTimeout(() => this.beep(780, .07, 'sine'), 60);
  },
  candy() {
    [587, 740, 880, 1175].forEach((f, i) => setTimeout(() => this.beep(f, .1, 'sine'), i * 60));
  },
  drums() {
    [0, 150, 300, 420, 560, 700].forEach((ms, i) => {
      setTimeout(() => this.beep(i % 2 === 0 ? 95 : 135, .14, 'triangle'), ms);
    });
  },
  jumanji() {
    [0, 140, 280, 420, 560].forEach((ms, i) => {
      setTimeout(() => this.beep(90 + i * 20, .12, 'triangle'), ms);
    });
    setTimeout(() => {
      [440, 554, 659, 880, 1108].forEach((f, i) => setTimeout(() => this.beep(f, .22, 'sine'), i * 110));
    }, 700);
  },
  roar() {
    [200, 170, 140, 100].forEach((f, i) => setTimeout(() => this.beep(f, .18, 'sawtooth'), i * 80));
  }
};

const soundBtn = $('#soundBtn');
if (soundBtn) {
  soundBtn.textContent = Sound.muted ? '🔇' : '🔊';
  soundBtn.onclick = () => {
    Sound.muted = !Sound.muted;
    localStorage.setItem('bgh_muted', Sound.muted ? '1' : '0');
    soundBtn.textContent = Sound.muted ? '🔇' : '🔊';
  };
}

const micBtn = $('#micBtn');
if (micBtn) {
  micBtn.onclick = () => Voice.toggleMic();
}

// In-game voice join button (header) — created lazily inside
// updateVoiceHdrBtn() because the <header> element doesn't exist yet when
// this script first runs. Visible only during an online game when voice
// isn't already active. The #micBtn handles mute once voice is on.
function ensureVoiceHdrBtn(): HTMLElement | null {
  let b = document.getElementById('voiceHdrBtn') as HTMLElement;
  if (b) return b;
  const hdr = document.querySelector('header');
  if (!hdr) return null;
  b = document.createElement('button');
  b.className = 'iconbtn hidden';
  b.id = 'voiceHdrBtn';
  b.title = 'Join voice chat';
  b.textContent = '🎤';
  b.onclick = async () => {
    if (Net.room && Net.room.code) await Voice.join();
  };
  const mic = document.getElementById('micBtn');
  if (mic) hdr.insertBefore(b, mic);
  else hdr.appendChild(b);
  return b;
}
function updateVoiceHdrBtn() {
  const b = ensureVoiceHdrBtn();
  if (!b) return;
  const C = (window as any)._C;
  const show = !!(C && C.isNet && Net.room && Net.room.code && !Voice.active);
  b.classList.toggle('hidden', !show);
}

window.addEventListener('beforeunload', () => { try { Friends.setOnline(false); } catch (e) {} });

/* ================= backend / auth / points ================= */
const Backend = {
  mode: 'demo',
  fb: null as any,
  auth: null as any,
  db: null as any,
  configured() {
    const f = CONFIG.firebase;
    return !!(f.apiKey && f.databaseURL && f.projectId);
  },
  async init() {
    if (!this.configured()) return false;
    try {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
      this.fb = firebase.initializeApp(CONFIG.firebase);
      this.auth = firebase.auth();
      this.db = firebase.database();
      this.mode = 'firebase';
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  },
  onUser(cb: (u: any) => void) {
    if (this.mode === 'firebase' && this.auth) this.auth.onAuthStateChanged(cb);
  }
};

const Auth = {
  user: null as any,
  init() {
    const name = localStorage.getItem('bgh_name') || 'Player' + rnd(9000);
    if (Backend.mode === 'firebase') {
      Backend.onUser(u => {
        this.user = u ? { uid: u.uid, username: u.displayName || name, email: u.email, photo: '' } : null;
        if (u) { this._pull(); Friends.setOnline(true); Friends.watchRequests(); Friends.watchFriends(); }
        else { Friends.unwatchRequests(); Friends.unwatchFriends(); }
        UI.refresh();
        if (Backend.mode === 'firebase' && !this.user && UI.view !== 'auth') UI.go('auth');
      });
    } else {
      this.user = { uid: 'local', username: name };
      this._pullLocal();
    }
  },
  async _pull() {
    try {
      const s = await Backend.db.ref('bgh_users/' + this.user.uid).get();
      const d = s.val() || {};
      Points.balance = d.points != null ? d.points : START_POINTS;
      Points.wins = d.wins || 0;
      Points.lastDaily = d.lastDaily || 0;
      Points.perGame = d.perGame || {};
      if (d.username) this.user.username = d.username;
      else await Backend.db.ref('bgh_users/' + this.user.uid).update({ username: this.user.username });
      if (d.photo) this.user.photo = d.photo;
    } catch (e) {}
  },
  _pullLocal() {
    Points.balance = parseInt(localStorage.getItem('bgh_points') || String(START_POINTS));
    Points.wins = parseInt(localStorage.getItem('bgh_wins') || '0');
    Points.lastDaily = parseInt(localStorage.getItem('bgh_daily') || '0');
    try { Points.perGame = JSON.parse(localStorage.getItem('bgh_pergame') || '{}'); } catch (e) { Points.perGame = {}; }
  },
  async signup(email: string, pw: string, name: string) {
    name = name.trim();
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(name)) throw new Error('Username: 3-16 letters, numbers or _');
    if (pw.length < 6) throw new Error('Password must be 6+ characters');
    const taken = await Backend.db.ref('bgh_usernames/' + name.toLowerCase()).get();
    if (taken.exists()) throw new Error('Username taken');
    await Backend.auth.createUserWithEmailAndPassword(email, pw);
    await Backend.auth.currentUser.updateProfile({ displayName: name });
    this.user = { uid: Backend.auth.currentUser.uid, username: name, email, photo: '' };
    const m: any = {};
    m['bgh_users/' + this.user.uid] = { username: name, email: email.toLowerCase(), points: START_POINTS, wins: 0, created: Date.now(), lastDaily: 0 };
    m['bgh_usernames/' + name.toLowerCase()] = this.user.uid;
    m['bgh_codes/' + String(this.user.uid).slice(-4).toUpperCase()] = this.user.uid;
    await Backend.db.ref().update(m);
    Points.balance = START_POINTS;
    Points.perGame = {};
  },
  async login(email: string, pw: string) {
    await Backend.auth.signInWithEmailAndPassword(email, pw);
  },
  async reset(email: string) {
    await Backend.auth.sendPasswordResetEmail(email.trim().toLowerCase());
  },
  async uploadPhoto(dataUrl: string) {
    if (!this.user || Backend.mode !== 'firebase') return;
    await Backend.db.ref('bgh_users/' + this.user.uid + '/photo').set(dataUrl);
    this.user.photo = dataUrl;
  },
  async eraseAccount() {
    if (!this.user || Backend.mode !== 'firebase') return;
    const uid = this.user.uid;
    const uname = (this.user.username || '').toLowerCase();
    // Remove from friends' lists
    try {
      const fl = await Backend.db.ref('bgh_friends/' + uid).get();
      const ids = Object.keys(fl.val() || {});
      const m: any = {};
      for (const fid of ids) m['bgh_friends/' + fid + '/' + uid] = null;
      if (ids.length) await Backend.db.ref().update(m);
    } catch (e) {}
    const m: any = {};
    m['bgh_users/' + uid] = null;
    m['bgh_friends/' + uid] = null;
    m['bgh_requests/' + uid] = null;
    m['bgh_presence/' + uid] = null;
    if (uname) m['bgh_usernames/' + uname] = null;
    m['bgh_codes/' + String(uid).slice(-4).toUpperCase()] = null;
    await Backend.db.ref().update(m);
    try { await Backend.auth.currentUser.delete(); } catch (e) { throw e; }
    await this.logout();
  },
  async logout() {
    try { await Friends.setOnline(false); } catch (e) {}
    Friends.unwatchRequests(); Friends.unwatchFriends();
    Voice.leave();
    if (Backend.mode === 'firebase') {
      try { await Backend.auth.signOut(); } catch (e) {}
    }
    localStorage.removeItem('bgh_name');
    location.reload();
  }
};

const Points = {
  balance: START_POINTS,
  wins: 0,
  lastDaily: 0,
  perGame: {} as Record<string, { w: number; l: number; t: number }>,
  checkDaily() {
    const day = Math.floor(Date.now() / 864e5);
    if (this.lastDaily !== day) {
      this.lastDaily = day;
      this.add(DAILY_BONUS, true);
      toast('Daily bonus +' + DAILY_BONUS + ' ⭐');
    }
  },
  add(n: number, silent?: boolean) {
    this.balance += n;
    this.save();
    if (!silent) UI.refresh();
  },
  save() {
    if (Backend.mode === 'firebase' && Auth.user) {
      Backend.db.ref('bgh_users/' + Auth.user.uid).update({ points: this.balance, wins: this.wins, lastDaily: this.lastDaily, perGame: this.perGame }).catch(() => {});
    } else {
      localStorage.setItem('bgh_points', String(this.balance));
      localStorage.setItem('bgh_wins', String(this.wins));
      localStorage.setItem('bgh_daily', String(this.lastDaily));
      localStorage.setItem('bgh_pergame', JSON.stringify(this.perGame));
    }
    UI.refresh();
  }
};

/* ================= online rooms ================= */
const Net = {
  room: null as any,
  _off: [] as Array<() => void>,
  _inboxOff: null as (() => void) | null,
  _onUpdate: null as ((r: any) => void) | null,
  _onInbox: null as ((m: any) => void) | null,
  needNet() {
    if (Backend.mode !== 'firebase') {
      toast('Online PvP needs Firebase: Profile → Setup, paste keys.');
      return false;
    }
    return true;
  },
  async create(game: string, seats: number) {
    if (!this.needNet()) return null;
    if (Auth.user && Auth.user.uid === 'local') { toast('Online rooms need a real account — guest play is demo only. Sign up or log in first.'); return null; }
    await this.leave(true);
    const code = String(ri(1000, 9999));
    const room = {
      code,
      game,
      seatsNeeded: seats,
      seats: [Auth.user.uid],
      names: { [Auth.user.uid]: Auth.user.username },
      state: null,
      turn: 0,
      status: 'waiting',
      host: Auth.user.uid,
      created: Date.now()
    };
    await Backend.db.ref('bgh_rooms/' + code).set(room);
    this.room = room;
    try { localStorage.setItem('bgh_lastroom', code); } catch (e) {}
    this._listen(code);
    return code;
  },
  async join(code: string) {
    if (!this.needNet()) return null;
    if (Auth.user && Auth.user.uid === 'local') { toast('Online rooms need a real account — guest play is demo only. Sign up or log in first.'); return null; }
    code = String(code).trim();
    const s = await Backend.db.ref('bgh_rooms/' + code).get();
    if (!s.exists()) {
      toast('Room not found');
      return null;
    }
    const room = s.val();
    if (room.status !== 'waiting') {
      toast('Game already started');
      return null;
    }
    await this.leave(true);
    if (room.seats.includes(Auth.user.uid)) {
      // Same account on two phones: the account already holds a seat, so
      // joining again adds nobody and the room sits at 1/2 forever. Say so
      // instead of silently waiting.
      toast('This account is already in that room — the second phone needs a different account.');
    }
    if (!room.seats.includes(Auth.user.uid)) {
      if (room.seats.length >= room.seatsNeeded) {
        toast('Room is full');
        return null;
      }
      room.seats.push(Auth.user.uid);
      room.names[Auth.user.uid] = Auth.user.username;
      await Backend.db.ref('bgh_rooms/' + code + '/seats').set(room.seats);
      await Backend.db.ref('bgh_rooms/' + code + '/names').set(room.names);
    }
    this.room = room;
    try { localStorage.setItem('bgh_lastroom', code); } catch (e) {}
    this._listen(code);
    return code;
  },
  // Rejoin a room the player was booted from (works even if status is
  // 'playing' — unlike join(), which only allows 'waiting' rooms).
  async rejoin(code: string) {
    if (!this.needNet()) return null;
    code = String(code).trim();
    const s = await Backend.db.ref('bgh_rooms/' + code).get();
    if (!s.exists()) {
      toast('Room not found');
      return null;
    }
    const room = s.val();
    if (!room.seats || !room.seats.includes(Auth.user.uid)) {
      toast('You are not in this room');
      return null;
    }
    await this.leave(true);
    this.room = room;
    try { localStorage.setItem('bgh_lastroom', code); } catch (e) {}
    this._listen(code);
    return code;
  },
  mySeat() {
    return this.room ? this.room.seats.indexOf(Auth.user.uid) : -1;
  },
  isHost() {
    return this.room && this.room.host === Auth.user.uid;
  },
  seatName(i: number) {
    if (!this.room) return '?';
    const u = this.room.seats[i];
    return (this.room.names && this.room.names[u]) || 'Player ' + (i + 1);
  },
  _cleanListeners() {
    this._off.forEach(f => { try { f(); } catch (e) {} });
    this._off = [];
    if (this._inboxOff) { try { this._inboxOff(); } catch (e) {} this._inboxOff = null; }
  },
  _listen(code: string) {
    this._cleanListeners();
    const ref = Backend.db.ref('bgh_rooms/' + code);
    const h = (snap: any) => {
      const r = snap.val();
      if (!r) return;
      const a = JSON.stringify(r.state), b = JSON.stringify(this.room ? this.room.state : null);
      const changed = a !== b || r.turn !== (this.room ? this.room.turn : -99) || r.status !== (this.room ? this.room.status : '') || (r.seats || []).length !== ((this.room && this.room.seats) || []).length;
      this.room = r;
      if (changed && this._onUpdate) this._onUpdate(r);
    };
    ref.on('value', h);
    this._off.push(() => ref.off('value', h));
    const ib = Backend.db.ref('bgh_rooms/' + code + '/inbox');
    const ih = (snap: any) => {
      const m = snap.val();
      if (m && this._onInbox) this._onInbox(m);
    };
    ib.on('child_added', ih);
    this._inboxOff = () => ib.off('child_added', ih);
  },
  onUpdate(cb: (r: any) => void) { this._onUpdate = cb; },
  onInbox(cb: (m: any) => void) { this._onInbox = cb; },
  async push(patch: any) {
    if (!this.room) return;
    // Deep-clone the state so Net.room.state never shares a reference with
    // the live game object C.S. Otherwise mutating C.S for the next move
    // silently mutates Net.room.state too, and the _listen changed-check
    // (JSON compare) sees no difference — the opponent never gets the update.
    const safe: any = { ...patch };
    if (safe.state !== undefined && safe.state !== null) {
      safe.state = JSON.parse(JSON.stringify(safe.state));
    }
    Object.assign(this.room, safe);
    await Backend.db.ref('bgh_rooms/' + this.room.code).update(safe);
  },
  async inboxSend(msg: any) {
    if (!this.room) return;
    msg.from = this.mySeat();
    msg.t = Date.now();
    await Backend.db.ref('bgh_rooms/' + this.room.code + '/inbox').push(msg);
  },
  async leave(silent?: boolean) {
    this._cleanListeners();
    if (!silent && this.room && Backend.mode === 'firebase') {
      try {
        if (this.isHost()) await Backend.db.ref('bgh_rooms/' + this.room.code).remove();
      } catch (e) {}
    }
    this.room = null;
    this._onUpdate = null;
    this._onInbox = null;
    try { Voice.leave(); } catch (e) {}
  }
};

/* ================= VOICE (pure WebRTC over Firebase RTDB — the hand-game recipe) =================
   No LiveKit, no token server, no API keys. Audio-only mesh between the
   humans in a room; signaling lives under the room itself:
     bgh_rooms/<code>/voice_presence/<uid> = { name, session, muted, ts }
     bgh_rooms/<code>/voice_signals/<pair> = { offer, answer, cands/<push> }
   pair = the two uids sorted + '_'. Each join stamps a session id and
   signals from other sessions are ignored; offer/answer docs are
   overwritten (set), never merged; every setRemoteDescription is guarded
   by signalingState, so a rejoin can never throw InvalidStateError.
   Only the lower uid offers (deterministic), so two players can never
   both offer and deadlock. Failures show the real error name + message. */
const Voice = {
  active: false,
  micMuted: false,
  stream: null as any,
  session: '',
  code: '',
  myUid: '',
  peers: {} as Record<string, any>,
  present: {} as Record<string, boolean>,
  presenceInfo: {} as Record<string, any>,
  ctx: null as any,
  localAnalyser: null as any,
  _localSrc: null as any,
  speakTimer: null as any,
  _off: [] as Array<() => void>,
  configured() {
    // Voice needs exactly what online PvP needs: Firebase. No keys to paste.
    return Backend.mode === 'firebase';
  },
  _pairId(a: string, b: string) {
    return [a, b].sort().join('_');
  },
  _sigRef(pair: string) {
    return Backend.db.ref('bgh_rooms/' + this.code + '/voice_signals/' + pair);
  },
  _presRef(uid?: string) {
    return Backend.db.ref('bgh_rooms/' + this.code + '/voice_presence/' + (uid || this.myUid));
  },
  async join() {
    if (this.active) return true;
    if (!this.configured()) { toast('Voice talk needs Firebase (Profile → Setup).'); return false; }
    if (!Net.room || !Net.room.code) { toast('Join a room first.'); return false; }
    if (!Auth.user || !Auth.user.uid) { toast('Not signed in.'); return false; }
    try {
      this.code = String(Net.room.code);
      this.myUid = String(Auth.user.uid);
      this.session = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      // Capture ONCE and share that one stream with every peer connection.
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // AudioContext, created inside the tap gesture: remote call audio is
      // played through it (media/speaker path) instead of an <audio>
      // element, which Android Chrome routes to the earpiece like a phone
      // call — the "connected but no sound" symptom. The same context feeds
      // the speaking analyser (local stream only; never looped to output).
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AC();
        if (this.ctx.resume) { const r = this.ctx.resume(); if (r && r.catch) r.catch(() => {}); }
        this._localSrc = this.ctx.createMediaStreamSource(this.stream);
        this.localAnalyser = this.ctx.createAnalyser();
        this.localAnalyser.fftSize = 2048;
        this._localSrc.connect(this.localAnalyser);
      } catch (e) { console.warn(e); }
      const pres = this._presRef();
      await pres.set({ name: Auth.user.username || 'Player', session: this.session, muted: false, ts: Date.now() });
      try { pres.onDisconnect().remove(); } catch (e) {}
      const pr = Backend.db.ref('bgh_rooms/' + this.code + '/voice_presence');
      const addH = (snap: any) => {
        const uid = String(snap.key);
        const v = snap.val() || {};
        this.present[uid] = true;
        this.presenceInfo[uid] = { name: v.name || 'Player', muted: !!v.muted };
        if (uid !== this.myUid) this._onPeerSeen(uid, v.session);
        this._updateCount();
        this._renderPanelRows();
      };
      const chgH = (snap: any) => {
        const uid = String(snap.key);
        const v = snap.val() || {};
        if (uid === this.myUid) return;
        this.presenceInfo[uid] = { name: v.name || 'Player', muted: !!v.muted };
        // Session changed = that player rejoined: drop the old peer, start clean.
        const old = this.peers[uid];
        if (old && old.session !== v.session) this._dropPeer(uid);
        this._onPeerSeen(uid, v.session);
        this._renderPanelRows();
      };
      const remH = (snap: any) => {
        const uid = String(snap.key);
        delete this.present[uid];
        delete this.presenceInfo[uid];
        if (uid !== this.myUid) this._dropPeer(uid);
        this._updateCount();
        this._renderPanelRows();
      };
      pr.on('child_added', addH);
      pr.on('child_changed', chgH);
      pr.on('child_removed', remH);
      this._off.push(() => pr.off('child_added', addH));
      this._off.push(() => pr.off('child_changed', chgH));
      this._off.push(() => pr.off('child_removed', remH));
      this.active = true;
      this.micMuted = false;
      const mb = $('#micBtn');
      if (mb) mb.classList.remove('hidden');
      this._micIcon();
      this._updateCount();
      this._setPanelVisible(true);
      this._startSpeakPoll();
      updateVoiceHdrBtn();
      toast('Voice connected — talk to your opponents');
      return true;
    } catch (e: any) {
      console.warn(e);
      // Raw error first, always. NotAllowedError gets one actionable line
      // after it: the browser blocked the mic, so the fix is in site settings.
      const hint = (e && e.name === 'NotAllowedError') ? ' — allow the microphone for this site in your browser settings, reload, then try again.' : '';
      toast('Voice error: ' + (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : e) + hint);
      this.leave();
      return false;
    }
  },
  _onPeerSeen(uid: string, session: string) {
    if (!session) return; // presence without a session stamp is stale — wait for its change event
    const old = this.peers[uid];
    if (old) {
      if (old.session === session) return;
      this._dropPeer(uid);
    }
    this._createPeer(uid, session);
  },
  _createPeer(uid: string, session: string) {
    const pair = this._pairId(this.myUid, uid);
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const peer: any = { pc, session, pending: [] as any[] };
    this.peers[uid] = peer;
    try { this.stream.getTracks().forEach((t: any) => pc.addTrack(t, this.stream)); } catch (e) {}
    pc.onicecandidate = (ev: any) => {
      if (ev.candidate) {
        try { this._sigRef(pair).child('cands').push({ from: this.myUid, session: this.session, cand: ev.candidate.toJSON() }); } catch (e) {}
      }
    };
    // Remote audio plays through the AudioContext (speaker path), not an
    // <audio> element — Android Chrome routes <audio> call audio to the
    // earpiece, which reads as "connected but no sound". The same source
    // feeds a speaking analyser for the voice panel.
    pc.ontrack = (ev: any) => {
      try {
        const rs = (ev.streams && ev.streams[0]) || (() => { const st = new MediaStream(); st.addTrack(ev.track); return st; })();
        peer.remoteStream = rs;
        if (this.ctx) {
          const rsrc = this.ctx.createMediaStreamSource(rs);
          rsrc.connect(this.ctx.destination);
          const ran = this.ctx.createAnalyser();
          ran.fftSize = 2048;
          rsrc.connect(ran);
          peer.audioNodes = { src: rsrc, analyser: ran };
        }
        this._renderPanelRows();
      } catch (e) { console.warn(e); }
    };
    const sig = this._sigRef(pair);
    const valH = async (snap: any) => {
      const v = snap.val() || {};
      try {
        if (v.offer && v.offer.from !== this.myUid && v.offer.session === peer.session && pc.signalingState === 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(v.offer.sdp));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          await sig.child('answer').set({ from: this.myUid, session: this.session, sdp: pc.localDescription });
          this._flushPending(peer);
        } else if (v.answer && v.answer.from !== this.myUid && v.answer.session === peer.session && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(v.answer.sdp));
          this._flushPending(peer);
        }
      } catch (e) { console.warn(e); }
    };
    sig.on('value', valH);
    const candH = (snap: any) => {
      const c = snap.val() || {};
      if (c.from === this.myUid) return;
      if (c.session && c.session !== peer.session) return;
      if (!c.cand) return;
      if (pc.remoteDescription) pc.addIceCandidate(new RTCIceCandidate(c.cand)).catch(() => {});
      else peer.pending.push(c.cand);
    };
    sig.child('cands').on('child_added', candH);
    peer._off = () => {
      try { sig.off('value', valH); } catch (e) {}
      try { sig.child('cands').off('child_added', candH); } catch (e) {}
    };
    // Only the lower uid offers — the other side answers. Deterministic,
    // so a race can never leave both sides in have-local-offer.
    if (this.myUid < uid) {
      (async () => {
        try {
          const off = await pc.createOffer();
          await pc.setLocalDescription(off);
          await sig.child('offer').set({ from: this.myUid, session: this.session, sdp: pc.localDescription });
        } catch (e) { console.warn(e); }
      })();
    }
    this._updateCount();
  },
  _flushPending(peer: any) {
    const list = peer.pending || [];
    peer.pending = [];
    list.forEach((c: any) => {
      try { peer.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}); } catch (e) {}
    });
  },
  _dropPeer(uid: string) {
    const peer = this.peers[uid];
    if (!peer) return;
    try { if (peer._off) peer._off(); } catch (e) {}
    try { peer.pc.close(); } catch (e) {}
    try { if (peer.audioNodes) peer.audioNodes.src.disconnect(); } catch (e) {}
    delete this.peers[uid];
    this._updateCount();
    this._renderPanelRows();
  },
  _micIcon() {
    const mb = $('#micBtn');
    if (mb) { mb.textContent = this.micMuted ? '🚫' : '🎤'; mb.classList.toggle('off', this.micMuted); }
    const pm = document.getElementById('voicePanelMic');
    if (pm) { pm.textContent = this.micMuted ? '🚫' : '🎤'; pm.classList.toggle('off', this.micMuted); }
  },
  _updateCount() {
    let c = document.getElementById('voiceCount');
    if (!c) {
      const hdr = document.querySelector('header');
      if (!hdr) return;
      c = document.createElement('span');
      c.id = 'voiceCount';
      c.className = 'pill gold hidden';
      const mic = document.getElementById('micBtn');
      if (mic) hdr.insertBefore(c, mic);
      else hdr.appendChild(c);
    }
    const n = Object.keys(this.present).length;
    c.textContent = n + ' in call';
    c.classList.toggle('hidden', !this.active || n === 0);
    const pc2 = document.getElementById('voicePanelCount');
    if (pc2) pc2.textContent = n + ' in call';
  },
  toggleMic() {
    if (!this.active || !this.stream) return;
    this.micMuted = !this.micMuted;
    try { this.stream.getAudioTracks().forEach((t: any) => { t.enabled = !this.micMuted; }); } catch (e) {}
    try { this._presRef().update({ muted: this.micMuted }); } catch (e) {}
    this._micIcon();
    this._renderPanelRows();
  },
  // Hand-game-style voice panel: fixed above the bottom nav (so game
  // re-renders never wipe it), with a row per player and a live Speaking
  // indicator driven by the analysers. If a remote row lights up while you
  // hear nothing, audio is arriving and the problem is playout, not the call.
  _ensurePanel() {
    let p = document.getElementById('voicePanel');
    if (p) return p;
    p = document.createElement('div');
    p.id = 'voicePanel';
    p.className = 'hidden';
    const nav = document.getElementById('bottomNav');
    p.style.cssText = 'position:fixed;left:10px;right:10px;bottom:' + ((nav ? nav.offsetHeight : 60) + 8) + 'px;z-index:90;';
    p.innerHTML = '<div class="card" style="margin:0">'
      + '<div class="row" style="align-items:center;gap:8px">'
      + '<span style="font-weight:800">🎤 Voice Connected</span>'
      + '<span class="pill gold" id="voicePanelCount">1 in call</span>'
      + '<span style="flex:1"></span>'
      + '<button class="iconbtn" id="voicePanelMic" title="Mute microphone">🎤</button>'
      + '<button class="iconbtn" id="voicePanelLeave" title="Leave voice chat">✕</button>'
      + '<button class="iconbtn" id="voicePanelCollapse" title="Collapse">⌄</button>'
      + '</div><div id="voicePanelBody" style="margin-top:6px"></div></div>';
    document.body.appendChild(p);
    const mic = p.querySelector('#voicePanelMic');
    if (mic) mic.addEventListener('click', () => this.toggleMic());
    const lv = p.querySelector('#voicePanelLeave');
    if (lv) lv.addEventListener('click', () => this.leave());
    const col = p.querySelector('#voicePanelCollapse');
    if (col) col.addEventListener('click', () => {
      const b = p.querySelector('#voicePanelBody') as HTMLElement;
      if (!b) return;
      const hid = b.classList.toggle('hidden');
      col.textContent = hid ? '⌃' : '⌄';
    });
    return p;
  },
  _setPanelVisible(show: boolean) {
    const p = this._ensurePanel();
    p.classList.toggle('hidden', !show);
    if (show) this._renderPanelRows();
  },
  _panelRow(uid: string, name: string, muted: boolean) {
    return '<div class="row" style="align-items:center;gap:8px;padding:3px 0"><span>🎧</span><span style="flex:1">' + esc(name) + '</span><span class="vp-speak" data-vp-speak="' + esc(uid) + '"><span class="vp-bars"><i></i><i></i><i></i></span><span class="vp-label">' + (muted ? '🚫 Muted' : '') + '</span></span></div>';
  },
  _renderPanelRows() {
    const body = document.getElementById('voicePanelBody');
    if (!body) return;
    const rows: string[] = [];
    const me = this.presenceInfo[this.myUid];
    if (me) rows.push(this._panelRow(this.myUid, me.name + ' (You)', !!me.muted));
    Object.keys(this.presenceInfo).forEach(uid => {
      if (uid === this.myUid) return;
      const p = this.presenceInfo[uid];
      rows.push(this._panelRow(uid, p.name || 'Player', !!p.muted));
    });
    body.innerHTML = rows.join('') || '<div class="muted">Waiting for others to join voice…</div>';
  },
  _speakLevel(an: any) {
    if (!an) return 0;
    try {
      const buf = new Uint8Array(an.fftSize);
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      return Math.sqrt(sum / buf.length);
    } catch (e) { return 0; }
  },
  _startSpeakPoll() {
    this._stopSpeakPoll();
    this.speakTimer = setInterval(() => {
      if (!this.active) return;
      const setRow = (uid: string, speaking: boolean, hasAudio: boolean, muted: boolean) => {
        const el = document.querySelector('[data-vp-speak="' + uid + '"]');
        if (!el) return;
        const lab = el.querySelector('.vp-label');
        if (muted) { el.classList.remove('on'); if (lab) lab.textContent = '🚫 Muted'; }
        else if (!hasAudio) { el.classList.remove('on'); if (lab) lab.textContent = ''; }
        else { el.classList.toggle('on', speaking); if (lab) lab.textContent = speaking ? 'Speaking' : ''; }
      };
      setRow(this.myUid, !this.micMuted && this._speakLevel(this.localAnalyser) > 0.02, !!this.localAnalyser, this.micMuted);
      Object.keys(this.peers).forEach(uid => {
        const p = this.peers[uid];
        const an = p.audioNodes ? p.audioNodes.analyser : null;
        const muted = !!(this.presenceInfo[uid] && this.presenceInfo[uid].muted);
        setRow(uid, !muted && this._speakLevel(an) > 0.02, !!an, muted);
      });
    }, 150);
  },
  _stopSpeakPoll() {
    if (this.speakTimer) { try { clearInterval(this.speakTimer); } catch (e) {} }
    this.speakTimer = null;
  },
  leave() {
    this._off.forEach(f => { try { f(); } catch (e) {} });
    this._off = [];
    const uids = Object.keys(this.peers);
    uids.forEach(u => this._dropPeer(u));
    this.peers = {};
    this.present = {};
    this.presenceInfo = {};
    this._stopSpeakPoll();
    try { if (this._localSrc) this._localSrc.disconnect(); } catch (e) {}
    try { if (this.ctx && this.ctx.close) this.ctx.close(); } catch (e) {}
    this.ctx = null; this.localAnalyser = null; this._localSrc = null;
    const vp = document.getElementById('voicePanel');
    if (vp) vp.classList.add('hidden');
    if (this.stream) { try { this.stream.getTracks().forEach((t: any) => t.stop()); } catch (e) {} }
    this.stream = null;
    // Best effort: remove my presence + the signal docs I took part in, so
    // nothing stale survives into the next session.
    if (Backend.db && this.code && this.myUid) {
      const code = this.code, me = this.myUid;
      try { Backend.db.ref('bgh_rooms/' + code + '/voice_presence/' + me).remove(); } catch (e) {}
      uids.forEach(u => {
        try { Backend.db.ref('bgh_rooms/' + code + '/voice_signals/' + this._pairId(me, u)).remove(); } catch (e) {}
      });
    }
    this.active = false;
    this.micMuted = false;
    this.code = '';
    this.session = '';
    const mb = $('#micBtn');
    if (mb) mb.classList.add('hidden');
    const vc = document.getElementById('voiceCount');
    if (vc) vc.classList.add('hidden');
    updateVoiceHdrBtn();
  }
};

/* ================= FRIENDS (needs Firebase) ================= */
const Friends = {
  needNet() {
    if (Backend.mode !== 'firebase') { toast('Friends need Firebase (Profile → Setup).'); return false; }
    return true;
  },
  async list() {
    if (!this.needNet()) return [];
    const s = await Backend.db.ref('bgh_friends/' + Auth.user.uid).get();
    const ids = s.val() || {};
    const out = [];
    for (const fid of Object.keys(ids)) {
      const p = await Backend.db.ref('bgh_users/' + fid).get();
      const d = p.val() || {};
      const pr = await Backend.db.ref('bgh_presence/' + fid).get();
      out.push({ uid: fid, username: d.username || ('…' + String(fid).slice(-4).toUpperCase()), photo: d.photo || '', online: !!(pr.val() && pr.val().online) });
    }
    return out;
  },
  async findUser(name: string) {
    if (!this.needNet()) return null;
    const s = await Backend.db.ref('bgh_usernames/' + name.trim().toLowerCase()).get();
    if (!s.exists()) return null;
    const p = await Backend.db.ref('bgh_users/' + s.val()).get();
    return { uid: s.val(), ...((p.val() || {}) as any) };
  },
  async sendRequest(toUid: string) {
    if (!this.needNet()) return;
    await Backend.db.ref('bgh_requests/' + toUid + '/' + Auth.user.uid).set({ from: Auth.user.username, at: Date.now() });
    toast('Friend request sent');
  },
  async requests() {
    if (Backend.mode !== 'firebase') return [];
    const s = await Backend.db.ref('bgh_requests/' + Auth.user.uid).get();
    const r = s.val() || {};
    return Object.keys(r).map(k => ({ uid: k, ...(r[k] as any) }));
  },
  async accept(uid: string) {
    const m: any = {};
    m['bgh_friends/' + Auth.user.uid + '/' + uid] = true;
    m['bgh_friends/' + uid + '/' + Auth.user.uid] = true;
    m['bgh_requests/' + Auth.user.uid + '/' + uid] = null;
    await Backend.db.ref().update(m);
    toast('Friend added');
  },
  async decline(uid: string) {
    await Backend.db.ref('bgh_requests/' + Auth.user.uid + '/' + uid).remove();
  },
  async remove(uid: string) {
    const m: any = {};
    m['bgh_friends/' + Auth.user.uid + '/' + uid] = null;
    m['bgh_friends/' + uid + '/' + Auth.user.uid] = null;
    await Backend.db.ref().update(m);
    toast('Friend removed');
  },
  async setOnline(on: boolean) {
    if (Backend.mode !== 'firebase' || !Auth.user) return;
    const r = Backend.db.ref('bgh_presence/' + Auth.user.uid);
    if (on) { r.set({ online: true, at: Date.now() }); r.onDisconnect().set({ online: false, at: Date.now() }); }
    else r.set({ online: false, at: Date.now() });
  },
  _reqRef: null as any,
  _reqCount: 0,
  _reqInit: false,
  _updateBadge() {
    const b = document.getElementById('friendsBadge');
    if (!b) return;
    if (this._reqCount > 0) { b.textContent = String(this._reqCount); b.classList.remove('hidden'); }
    else { b.textContent = ''; b.classList.add('hidden'); }
  },
  watchRequests() {
    this.unwatchRequests();
    if (Backend.mode !== 'firebase' || !Auth.user || Auth.user.uid === 'local') return;
    this._reqRef = Backend.db.ref('bgh_requests/' + Auth.user.uid);
    this._reqInit = false;
    this._reqRef.on('value', (s: any) => {
      const r = s.val() || {};
      const n = Object.keys(r).length;
      if (this._reqInit && n > this._reqCount) toast('New friend request!');
      this._reqCount = n;
      this._reqInit = true;
      this._updateBadge();
      if (UI.view === 'friends') UI.render();
    });
  },
  unwatchRequests() {
    if (this._reqRef) { try { this._reqRef.off('value'); } catch (e) {} }
    this._reqRef = null;
    this._reqCount = 0;
    this._reqInit = false;
    this._updateBadge();
  },
  _friendsRef: null as any,
  _friendsInit: false,
  watchFriends() {
    this.unwatchFriends();
    if (Backend.mode !== 'firebase' || !Auth.user || Auth.user.uid === 'local') return;
    this._friendsRef = Backend.db.ref('bgh_friends/' + Auth.user.uid);
    this._friendsInit = false;
    this._friendsRef.on('value', (s: any) => {
      if (this._friendsInit && UI.view === 'friends') UI.render();
      this._friendsInit = true;
    });
  },
  unwatchFriends() {
    if (this._friendsRef) { try { this._friendsRef.off('value'); } catch (e) {} }
    this._friendsRef = null;
    this._friendsInit = false;
  },
};

/* ================= UI shell ================= */
const GAMES: Record<string, any> = {};

const UI = {
  view: 'home',
  curGame: null as string | null,
  go(v: string) {
    this.view = v;
    document.querySelectorAll('#bottomNav button').forEach((b: any) => b.classList.toggle('active', b.dataset.v === v));
    const hqb = $('#headerQuitBtn');
    if (hqb) hqb.classList.toggle('hidden', v !== 'play');
    this.render();
  },
  render() {
    const v = $('#view');
    if (!v) return;
    const hqb = $('#headerQuitBtn');
    if (hqb) hqb.classList.toggle('hidden', this.view !== 'play');
    if (this.view === 'home') return this.home(v);
    if (this.view === 'profile') return this.profile(v);
    if (this.view === 'leaderboard') return this.leaderboard(v);
    if (this.view === 'chat') return this.chat(v);
    if (this.view === 'friends') return this.friends(v);
    if (this.view === 'auth') return this.authView(v);
    if (this.view === 'game') return this.gameMode(v);
    if (this.view === 'lobby') return this.lobby(v);
  },
  refresh() {
    const p = $('#pointsPill');
    if (p) p.textContent = '⭐ ' + Points.balance;
    const hqb = $('#headerQuitBtn');
    if (hqb) hqb.classList.toggle('hidden', this.view !== 'play');
  },
  homeCat: 'all',
  home(v: HTMLElement) {
    const cats: Array<[string, string]> = [['all', 'All'], ['classics', 'Classics'], ['strategy', 'Strategy'], ['family', 'Family'], ['party', 'Party']];
    const catIds: Record<string, string[]> = {
      classics: ['connect4', 'mancala', 'battleship', 'chutes', 'candyland'],
      strategy: ['monopoly', 'payday', 'life', 'clue', 'scrabble', 'guesswho'],
      family: ['trouble', 'sorry', 'jumanji'],
      party: ['pictionary']
    };
    const ids = UI.homeCat === 'all' ? Object.keys(GAMES) : (catIds[UI.homeCat] || []).filter(id => GAMES[id]);
    let cards = '';
    for (const id of ids) {
      const g = GAMES[id];
      cards += '<div class="hg-gamecard">'
        + '<div class="hg-icon">' + g.icon + '</div>'
        + '<div class="hg-name">' + esc(g.name) + '</div>'
        + '<div class="hg-desc">' + esc(g.desc) + '</div>'
        + '<div class="hg-row"><button class="hg-howto" data-howto="' + id + '">How to Play</button>'
        + '<button class="hg-play" data-play="' + id + '">PLAY &rarr;</button></div></div>';
    }
    v.innerHTML = '<div class="hero-card">'
      + '<div class="hero-label">HUSH MUSIC ENTERTAINMENT</div>'
      + '<h1 class="hero-title">Hush Music Board Games</h1>'
      + '<p class="hero-desc">Play 15 timeless board game classics. Outsmart bots or create private rooms to battle friends.</p>'
      + '<button class="btn btn-silver" id="dailyBtn">&#127873; Claim Daily Bonus: +500 &#11088;</button>'
      + '<button class="btn btn-outline" id="homeLobbyBtn">&#128101; Multiplayer Lobby / Join Code</button></div>'
      + '<div class="cat-tabs">' + cats.map(c => '<button class="cat-tab' + (UI.homeCat === c[0] ? ' active' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>'
      + '<div class="hg-grid">' + cards + '</div>';
    const claimDaily = () => {
      const day = Math.floor(Date.now() / 864e5);
      if (Points.lastDaily === day) { toast('Daily bonus already claimed — come back tomorrow!'); return; }
      Points.checkDaily();
    };
    (v.querySelector('#dailyBtn') as HTMLElement).onclick = () => { Sound.click(); claimDaily(); };
    (v.querySelector('#homeLobbyBtn') as HTMLElement).onclick = () => { Sound.click(); openLobbyModal(); };
    v.querySelectorAll('.cat-tab').forEach((t: any) => t.onclick = () => { Sound.click(); UI.homeCat = t.dataset.cat; UI.home(v); });
    v.querySelectorAll('[data-howto]').forEach((b: any) => b.onclick = (e: Event) => { e.stopPropagation(); showGameInstructions(b.dataset.howto); });
    v.querySelectorAll('[data-play]').forEach((b: any) => b.onclick = () => {
      Sound.click();
      UI.curGame = b.dataset.play;
      UI.go('game');
    });
  },
  gameMode(v: HTMLElement) {
    if (!this.curGame) return;
    const g = GAMES[this.curGame];
    const [pmin, pmax] = g.p;
    const inst = GAME_INSTRUCTIONS[this.curGame];
    const goalText = (inst && inst.goal) || g.rules || '';

    let scrabbleChampCard = '';
    if (this.curGame === 'scrabble') {
      const curChamp = getSelectedScrabbleChamp();
      scrabbleChampCard = `
        <div class="card" style="border: 2px solid #854d0e; background: linear-gradient(180deg, #2a1506 0%, #170b03 100%); margin-bottom: 12px; padding: 12px; box-sizing: border-box; width: 100%; overflow: hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:8px;">
            <div style="font-weight:900; color:#fbbf24; font-size:12.5px; display:flex; align-items:center; gap:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              🏆 BOT LEVEL (1 – 10)
            </div>
            <button class="btn small secondary" id="changeChampBtn" style="font-size:11px; padding:3px 8px; border-color:#d97706; color:#fde68a; white-space:nowrap; flex-shrink:0;">All Bios ➔</button>
          </div>
          <div class="muted" style="font-size:11px; margin-bottom:6px;">Select opponent level 1 to 10 (World Champions):</div>
          
          <div class="scrabble-bot-level-grid">
            ${SCRABBLE_CHAMPIONS.map(c => `
              <div class="scrabble-level-btn ${c.level === curChamp.level ? 'active' : ''}" data-pick-champ-lv="${c.level}" title="Level ${c.level}: ${c.name} (${c.title})">
                <span class="slb-num">Lv.${c.level}${c.level === 10 ? ' 👑' : ''}</span>
                <span class="slb-name">${c.flag} ${c.gridName}</span>
              </div>
            `).join('')}
          </div>

          <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.38); padding:9px 10px; border-radius:8px; border:1px solid #78350f; box-sizing:border-box; width:100%; overflow:hidden;">
            <div class="scrabble-champ-level-badge ${curChamp.level === 10 ? 'lv-goat' : ''}" style="flex-shrink:0;">
              <span class="lv-num">Lv.${curChamp.level}</span>
              <span class="lv-lbl">${curChamp.level === 10 ? 'GOAT' : 'BOT'}</span>
            </div>
            <div style="flex:1; min-width:0; overflow:hidden;">
              <div style="font-weight:900; font-size:14px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${curChamp.flag} ${esc(curChamp.name)} ${curChamp.level === 10 ? '👑' : ''}</div>
              <div style="font-size:11.5px; color:#fbbf24; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(curChamp.title)} · ⭐ Rating: ${curChamp.rating}</div>
              <div style="font-size:11px; color:#a8a29e; margin-top:2px; line-height:1.3;">${esc(curChamp.desc)}</div>
              <div style="font-size:10.5px; color:#cbd5e1; margin-top:2px; line-height:1.3;">🎯 <b>Style:</b> ${esc(curChamp.style)}</div>
            </div>
          </div>
        </div>
      `;
    }

    let pictionaryLevelCard = '';
    if (this.curGame === 'pictionary') {
      const curPicLvl = Math.max(1, Math.min(20, +(localStorage.getItem('pictionary_level') || '1')));
      const curPicData = getPictionaryLevel(curPicLvl);
      pictionaryLevelCard = `
        <div class="pictionary-level-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:8px;">
            <div style="font-weight:900; color:#38bdf8; font-size:12.5px; display:flex; align-items:center; gap:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              🎨 DIFFICULTY LEVEL (1 – 20)
            </div>
            <button class="btn small secondary" id="viewPicWordsBtn" style="font-size:11px; padding:3px 8px; border-color:#0284c7; color:#7dd3fc; white-space:nowrap; flex-shrink:0;">Browse 1,000 Words ➔</button>
          </div>
          <div class="muted" style="font-size:11px; margin-bottom:6px;">Select drawing difficulty (1 to 20):</div>

          <div class="pictionary-level-grid">
            ${PICTIONARY_LEVELS.map(l => `
              <div class="pictionary-level-btn ${l.level === curPicLvl ? 'active' : ''}" data-pick-pic-lv="${l.level}" title="Level ${l.level}: ${l.title} (${l.timeSec}s timer)">
                <span class="plb-num">Lv.${l.level}${l.level === 20 ? ' 👑' : ''}</span>
                <span class="plb-icon">${l.icon}</span>
              </div>
            `).join('')}
          </div>

          <div class="pictionary-active-banner">
            <div style="width:40px; height:40px; border-radius:8px; background:linear-gradient(135deg, #0284c7, #0369a1); display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; border:1px solid #38bdf8;">
              <span style="font-size:13px; font-weight:900; color:#fff; line-height:1;">Lv.${curPicData.level}</span>
              <span style="font-size:9px; color:#bae6fd; font-weight:700; text-transform:uppercase;">${curPicData.level === 20 ? 'PEAK' : 'TIER'}</span>
            </div>
            <div style="flex:1; min-width:0; overflow:hidden;">
              <div style="font-weight:900; font-size:13.5px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${curPicData.icon} ${esc(curPicData.title)} ${curPicData.level === 20 ? '👑' : ''}
              </div>
              <div style="font-size:11.5px; color:#38bdf8; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ⏱️ ${curPicData.timeSec}s Guess Timer · ⚡ ${curPicData.revealSpeedMs}ms Speed · ${curPicData.wordComplexity}
              </div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px; line-height:1.3;">
                ${esc(curPicData.subtitle)} · <b>1,000 Pictures</b> including Celebrities &amp; Pop Icons!
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const pvcLabel = this.curGame === 'scrabble'
      ? '🏆 Play vs ' + esc(getSelectedScrabbleChamp().name) + ' (Lv.' + getSelectedScrabbleChamp().level + ')'
      : (this.curGame === 'pictionary'
          ? '🎨 Play vs Computer (' + getPictionaryLevel(Math.max(1, Math.min(20, +(localStorage.getItem('pictionary_level') || '1')))).icon + ' Level ' + Math.max(1, Math.min(20, +(localStorage.getItem('pictionary_level') || '1'))) + ' · ' + esc(getPictionaryLevel(Math.max(1, Math.min(20, +(localStorage.getItem('pictionary_level') || '1')))).title) + ')'
          : '🤖 Vs Computer');

    v.innerHTML = '<button class="btn secondary small" id="backBtn">← All games</button><h2>' + g.icon + ' ' + esc(g.name) + '</h2>'
      + '<div class="card" style="border-left:3px solid var(--gold);">'
      + '  <div style="font-weight:800; color:var(--gold2); font-size:13px; margin-bottom:4px;">🎯 HOW TO PLAY</div>'
      + '  <div class="muted" style="margin-bottom:10px; line-height:1.4;">' + esc(goalText) + '</div>'
      + '  <button class="btn secondary small rules-btn" type="button" data-gid="' + this.curGame + '" style="margin:0;">📖 View Full Instructions &amp; Tips</button>'
      + '</div>'
      + scrabbleChampCard
      + pictionaryLevelCard
      + '<div class="card"><h3>How do you want to play?</h3>'
      + '<button class="btn" data-m="pvc">' + pvcLabel + '</button>'
      + '<button class="btn secondary" data-m="hotseat">👥 Pass &amp; Play (' + pmin + '–' + pmax + ' players, one phone)</button>'
      + '<button class="btn secondary" data-m="online">🌐 Online PvP (room code)</button></div>';
    $('#backBtn').onclick = () => this.go('home');
    const changeChampBtn = $('#changeChampBtn');
    if (changeChampBtn) {
      changeChampBtn.onclick = () => {
        showScrabbleChampionSelector(() => {
          this.gameMode(v);
        });
      };
    }
    const viewPicWordsBtn = $('#viewPicWordsBtn');
    if (viewPicWordsBtn) {
      viewPicWordsBtn.onclick = () => {
        showPictionaryWordsModal();
      };
    }
    v.querySelectorAll('[data-pick-champ-lv]').forEach((btn: any) => {
      btn.onclick = () => {
        Sound.click();
        const lv = +btn.dataset.pickChampLv;
        localStorage.setItem('scrabble_bot_level', String(lv));
        this.gameMode(v);
      };
    });
    v.querySelectorAll('[data-pick-pic-lv]').forEach((btn: any) => {
      btn.onclick = () => {
        Sound.click();
        const lv = +btn.dataset.pickPicLv;
        localStorage.setItem('pictionary_level', String(lv));
        this.gameMode(v);
      };
    });
    v.querySelectorAll('[data-m]').forEach((b: any) => b.onclick = () => {
      Sound.click();
      startGame(this.curGame!, b.dataset.m);
    });
  },

  lobby(v: HTMLElement) {
    if (!this.curGame) return;
    const g = GAMES[this.curGame];
    const [pmin, pmax] = g.p;
    v.innerHTML = '<button class="btn secondary small" id="backBtn">&larr; Back</button>'
      + '<div class="hero-card" style="margin-top:10px"><div class="hero-label">ONLINE MULTIPLAYER</div>'
      + '<h1 class="hero-title" style="font-size:24px">&#127760; Online: ' + esc(g.name) + '</h1>'
      + '<p class="hero-desc">Create a private room and share the 4-digit code, or join a friend&rsquo;s room.</p></div>'
      + '<div class="card"><h3>Create a room</h3><label>Players</label><select id="seatN">' + Array.from({ length: pmax - pmin + 1 }, (_, i) => '<option value="' + (pmin + i) + '">' + (pmin + i) + ' players</option>').join('') + '</select>'
      + '<button class="btn btn-silver" id="mkRoom">&#65291; Create ' + esc(g.name) + ' Room</button><div id="roomInfo"></div></div>'
      + '<div class="card"><h3>Join a room</h3><label>Room code</label><input id="joinCode" inputmode="numeric" placeholder="4-digit code"><button class="btn btn-outline" id="jnRoom">Join Room</button></div>'
      + '<div class="card hidden" id="rejoinCard"><h3>&#8617; Rejoin your room</h3><div class="muted" id="rejoinInfo">Checking…</div><button class="btn btn-silver" id="rejoinBtn" style="margin-top:8px">&#9654; Rejoin Room</button></div>';
    $('#backBtn').onclick = () => this.go('game');
    $('#mkRoom').onclick = async () => {
      const seats = parseInt(($('#seatN') as any).value);
      const code = await Net.create(UI.curGame!, seats);
      if (code && Net.room) watchRoom(UI.curGame!);
    };
    $('#jnRoom').onclick = async () => {
      const code = ($('#joinCode') as any).value;
      const c = await Net.join(code);
      if (c && Net.room) watchRoom(this.curGame || Net.room.game);
    };
    // Rejoin your last room (hand-game style): if the saved last-room code
    // still exists and still seats this player, show a one-tap way back in
    // — even mid-game — instead of making them dig through the rooms list.
    (async () => {
      const card = $('#rejoinCard');
      if (!card || Backend.mode !== 'firebase' || !Auth.user || !Auth.user.uid) return;
      try {
        const lastCode = localStorage.getItem('bgh_lastroom');
        if (!lastCode) return;
        const s = await Backend.db.ref('bgh_rooms/' + lastCode).get();
        if (!s.exists()) { try { localStorage.removeItem('bgh_lastroom'); } catch (e) {} return; }
        const r = s.val();
        if (!r || !r.seats || !r.seats.includes(Auth.user.uid)) return;
        const g = GAMES[r.game];
        const info = $('#rejoinInfo');
        if (info) info.textContent = (g ? g.name : 'Game') + ' · Room #' + r.code + ' · ' + r.seats.length + '/' + r.seatsNeeded + ' players' + (r.status === 'playing' ? ' · in game' : ' · waiting');
        const rb = $('#rejoinBtn');
        if (rb) rb.onclick = async () => {
          Sound.click();
          const c = await Net.rejoin(lastCode);
          if (c && Net.room) { UI.curGame = Net.room.game; watchRoom(Net.room.game); }
        };
        card.classList.remove('hidden');
      } catch (e) {}
    })();
  },
  profile(v: HTMLElement) {
    const fb = Backend.mode === 'firebase';
    const loggedIn = fb && Auth.user && Auth.user.uid !== 'local';
    const photo = Auth.user && Auth.user.photo
      ? '<img src="' + Auth.user.photo + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)">'
      : '<div style="width:80px;height:80px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:36px;border:2px solid var(--line)">👤</div>';
    const pgOf = (id: string) => Points.perGame[id] || { w: 0, l: 0, t: 0 };
    const breakdown = Object.keys(GAMES).map(id => { const s = pgOf(id); return '<div class="bd-cell"><div class="bd-icon">' + GAMES[id].icon + '</div><div class="bd-name">' + esc(GAMES[id].name) + '</div><div class="bd-stats">W:' + s.w + ' L:' + s.l + ' T:' + s.t + '</div></div>'; }).join('');
    let tw = 0, tl = 0, tt = 0;
    Object.keys(Points.perGame).forEach(id => { const s = Points.perGame[id]; tw += s.w || 0; tl += s.l || 0; tt += s.t || 0; });
    const tgames = tw + tl + tt;
    const winRate = tgames ? Math.round(tw / tgames * 100) : 0;
    const bdTotals = '<div class="bd-totals"><span>TOTAL&nbsp;W:' + tw + '</span><span>L:' + tl + '</span><span>T:' + tt + '</span><span>WIN&nbsp;RATE:' + winRate + '%</span></div>';
    v.innerHTML = '<h2>&#128100; Profile</h2>'
      + '<div class="card"><div class="row" style="align-items:center;gap:12px">' + photo
      + '<div style="flex:1"><h2 style="margin:0 0 2px">' + esc(Auth.user ? Auth.user.username : '…') + '</h2>'
      + '<div class="muted">' + esc(Auth.user && Auth.user.email ? Auth.user.email : '') + '</div>'
      + (loggedIn ? '<button class="btn small secondary" id="photoBtn" style="margin-top:8px">&#128247; Change Avatar</button><input type="file" id="photoIn" accept="image/*" style="display:none">' : '')
      + '</div></div></div>'
      + (loggedIn ? '<div class="card"><h3>&#9998; Change Username</h3><input id="unIn" maxlength="16" value="' + esc(Auth.user ? Auth.user.username : '') + '"><button class="btn secondary" id="unBtn">Save username</button></div>' : '')
      + '<div class="row" style="gap:10px"><div class="stat-box grow"><div class="stat-label">WALLET POINTS</div><div class="stat-val">&#11088; ' + Points.balance + '</div></div>'
      + '<div class="stat-box grow"><div class="stat-label">VICTORIES RECORDED</div><div class="stat-val">' + Points.wins + ' Wins</div></div></div>'
      + '<button class="btn btn-silver" id="profDaily">&#127873; CLAIM DAILY BONUS (+500 &#11088;)</button>'
      + '<div class="card"><h3>&#127941; GAME VICTORIES BREAKDOWN</h3><div class="breakdown-grid">' + breakdown + '</div>' + bdTotals + '</div>'
      + '<div class="card"><h3>&#9888; System &amp; Cloud Integration</h3>'
      + '<div class="sys-row"><span>Firebase Database</span><span class="' + (fb ? 'pill-connected' : 'pill-off') + '">' + (fb ? 'Connected' : 'Not connected') + '</span></div>'
      + '<div class="sys-row"><span>In-Game Voice Talk</span><span class="' + (Voice.configured() ? 'pill-connected' : 'pill-off') + '">' + (Voice.configured() ? 'Ready' : 'Needs online') + '</span></div></div>'
      + '<div class="card"><h3>&#127908; Voice Talk</h3>'
      + '<div class="muted">Built in — no server, no keys. Join a room or an online game and tap &#127908; Join voice chat. Tap &#127908; in the header to mute. Works automatically for every player in the room.</div></div>'
      + (!fb ? '<div class="card"><h3>&#128273; Setup &mdash; free online PvP</h3><div class="muted">Same Firebase project as your other hub works here.<br>1. console.firebase.google.com &rarr; project &rarr; &#9881; &rarr; <i>Your apps</i> &rarr; Web &rarr; copy <b>firebaseConfig</b>.<br>2. Paste it below &rarr; Save &rarr; reload.</div><textarea id="fbCfg" rows="6" placeholder=\'Paste firebaseConfig as JSON or JS (const firebaseConfig = {...});\'></textarea><button class="btn btn-silver" id="saveFb">Save keys &amp; reload</button>'
        + '<label style="margin-top:12px">Display name (demo mode)</label><input id="nmIn" value="' + esc(Auth.user ? Auth.user.username : '') + '"><button class="btn secondary" id="nmBtn">Save name</button></div>' : '')
      + '<button class="btn secondary" id="loBtn">Log out</button>'
      + '<div class="card" style="border-color:#e74c3c"><h3 style="color:#e74c3c">&#128465; Erase Account</h3><div class="muted" style="margin-bottom:8px">Permanently delete your profile, points, stats and friends. This cannot be undone.</div><button class="btn secondary" id="eraseBtn" style="border-color:#e74c3c;color:#e74c3c">&#128465; Erase my account</button></div>';
    const pd = $('#profDaily');
    if (pd) pd.onclick = () => {
      Sound.click();
      const day = Math.floor(Date.now() / 864e5);
      if (Points.lastDaily === day) { toast('Daily bonus already claimed — come back tomorrow!'); return; }
      Points.checkDaily();
    };
    const s = $('#saveFb');
    if (s) s.onclick = () => {
      try {
        const j = parseLooseJson((($('#fbCfg') as any).value || '') as string);
        localStorage.setItem('bgh_fbcfg', JSON.stringify(j));
        location.reload();
      } catch (e) {
        toast('That is not valid JSON or JS config');
      }
    };
    const nb = $('#nmBtn');
    if (nb) nb.onclick = () => {
      localStorage.setItem('bgh_name', ($('#nmIn') as any).value || 'Player');
      location.reload();
    };
    const ub = $('#unBtn');
    if (ub) ub.onclick = async () => {
      const newName = ((($('#unIn') as any).value) || '').trim();
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(newName)) { toast('Username: 3-16 letters, numbers or _'); return; }
      if (!Auth.user || !Auth.user.uid) { toast('Not signed in'); return; }
      if (newName === Auth.user.username) { toast('That is already your username'); return; }
      const oldLower = Auth.user.username.toLowerCase();
      const newLower = newName.toLowerCase();
      try {
        const taken = await Backend.db.ref('bgh_usernames/' + newLower).get();
        if (taken.exists() && taken.val() !== Auth.user.uid) { toast('Username taken'); return; }
        const m: any = {};
        m['bgh_users/' + Auth.user.uid + '/username'] = newName;
        m['bgh_usernames/' + oldLower] = null;
        m['bgh_usernames/' + newLower] = Auth.user.uid;
        await Backend.db.ref().update(m);
        if (Backend.auth.currentUser && Backend.auth.currentUser.updateProfile) {
          await Backend.auth.currentUser.updateProfile({ displayName: newName });
        }
        Auth.user.username = newName;
        toast('Username changed to ' + newName);
        UI.go('profile');
      } catch (e: any) {
        toast('Could not change username: ' + (e && e.message ? e.message : e));
      }
    };
    const lo = $('#loBtn');
    if (lo) lo.onclick = () => {
      if (loggedIn) { Auth.logout(); return; }
      ['bgh_points', 'bgh_wins', 'bgh_daily', 'bgh_pergame', 'bgh_guest', 'bgh_name'].forEach(k => localStorage.removeItem(k));
      location.reload();
    };
    const pb = $('#photoBtn');
    const pi = $('#photoIn') as any;
    if (pb && pi) {
      pb.onclick = () => pi.click();
      pi.onchange = () => {
        const file = pi.files && pi.files[0];
        if (!file) return;
        const rd = new FileReader();
        rd.onload = () => {
          const img = new Image();
          img.onload = async () => {
            const cv = document.createElement('canvas');
            const sz = 256;
            const sc = Math.min(1, sz / Math.max(img.width, img.height));
            cv.width = Math.round(img.width * sc);
            cv.height = Math.round(img.height * sc);
            cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
            const dataUrl = cv.toDataURL('image/jpeg', 0.8);
            try {
              await Auth.uploadPhoto(dataUrl);
              toast('Photo updated');
              UI.go('profile');
            } catch (e) { toast('Upload failed'); }
          };
          img.src = rd.result as string;
        };
        rd.readAsDataURL(file);
      };
    }
    const eb = $('#eraseBtn');
    if (eb) eb.onclick = () => {
      const m = modal('<div class="center" style="padding:12px 6px">'
        + '<div style="font-size:46px;margin-bottom:10px">⚠️</div>'
        + '<h3>Permanently erase your account?</h3>'
        + '<div class="muted" style="margin-bottom:18px">This deletes your profile, photo, points, friends and login. This cannot be undone.</div>'
        + '<div class="row" style="gap:10px"><button class="btn secondary grow" id="eNo">Cancel</button>'
        + '<button class="btn danger grow" id="eYes">Erase everything</button></div></div>');
      (m.querySelector('#eNo') as HTMLElement).onclick = () => closeModal();
      (m.querySelector('#eYes') as HTMLElement).onclick = async () => {
        if (!loggedIn) {
          ['bgh_points', 'bgh_wins', 'bgh_daily', 'bgh_pergame', 'bgh_guest', 'bgh_name'].forEach(k => localStorage.removeItem(k));
          closeModal();
          location.reload();
          return;
        }
        try {
          await Auth.eraseAccount();
        } catch (e: any) {
          closeModal();
          toast(e.message || 'Erase failed — try logging out and back in first');
        }
      };
    };
  },
  async leaderboard(v: HTMLElement) {
    v.innerHTML = '<h2>&#127942; Top 50 Leaderboard</h2><div class="card" id="lbBox"><div class="muted">Loading…</div></div>';
    const box = $('#lbBox') as HTMLElement;
    const rankPill = (n: string) => '<div style="text-align:center;margin-bottom:10px"><span class="lb-rank">Your Rank: #' + n + '</span></div>';
    const medal = (i: number) => i === 0 ? '&#129351;' : i === 1 ? '&#129352;' : i === 2 ? '&#129353;' : String(i + 1);
    const rowHtml = (r: any, i: number) => {
      const me = r.me || (Auth.user && (r.uid === Auth.user.uid || r.username === Auth.user.username));
      const name = r.username || (Auth.user && r.uid === Auth.user.uid ? Auth.user.username : null) || '?';
      const av = r.photo ? '<img src="' + r.photo + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px">' : '';
      const botTag = r.bot ? ' <span class="muted" style="font-size:10px">🤖</span>' : '';
      return '<tr class="' + (me ? 'me' : '') + '"><td>' + medal(i) + '</td><td>' + av + esc(name) + botTag + '</td><td>&#11088; ' + r.points + '</td><td>' + (r.wins || 0) + '</td></tr>';
    };
    const tableHead = '<table class="lb"><tr><th>#</th><th>Player</th><th>&#11088; Points</th><th>Total Wins</th></tr>';
    if (Backend.mode !== 'firebase') {
      const bots = [
        { username: 'Bot_Master', points: 8420, wins: 41, bot: true },
        { username: 'DiceKing', points: 7310, wins: 36, bot: true },
        { username: 'CardShark', points: 6950, wins: 33, bot: true },
        { username: 'BoardBoss', points: 6120, wins: 29, bot: true },
        { username: 'LuckyRoller', points: 5480, wins: 25, bot: true },
        { username: 'PawnStar', points: 4930, wins: 22, bot: true },
        { username: 'TileTitan', points: 4410, wins: 19, bot: true },
        { username: 'MeeplePro', points: 3870, wins: 16, bot: true },
        { username: 'Checkmate99', points: 3350, wins: 14, bot: true },
        { username: 'DominoDan', points: 2890, wins: 12, bot: true },
        { username: 'RummyQueen', points: 2460, wins: 10, bot: true },
        { username: 'SpadeAce', points: 1980, wins: 8, bot: true },
        { username: 'ClueHunter', points: 1540, wins: 6, bot: true },
        { username: 'MancalaMia', points: 1120, wins: 4, bot: true },
        { username: 'NewbieBot', points: 620, wins: 2, bot: true },
      ];
      const demoRows: any[] = (bots as any[]).concat([{ username: Auth.user.username, points: Points.balance, wins: Points.wins, me: true }]);
      demoRows.sort((a, b) => b.points - a.points);
      const myRank = demoRows.findIndex(r => r.me);
      box.innerHTML = rankPill(String(myRank + 1)) + tableHead + demoRows.map((r, i) => rowHtml(r, i)).join('') + '</table><div class="muted">Demo mode — connect Firebase in Profile → Setup for the shared board.</div>';
      return;
    }
    try {
      // Fire-and-forget: keep this user's record fresh before reading the board.
      try {
        Backend.db.ref('bgh_users/' + Auth.user.uid).update({ username: Auth.user.username, points: Points.balance, wins: Points.wins });
      } catch (e) {}
      const s = await Backend.db.ref('bgh_users').orderByChild('points').limitToLast(50).get();
      const rows: any[] = [];
      s.forEach((c: any) => rows.push(Object.assign({ uid: c.key }, c.val())));
      rows.sort((a, b) => b.points - a.points);
      const myRank = rows.findIndex(r => r.uid === Auth.user.uid);
      box.innerHTML = rankPill(myRank >= 0 ? String(myRank + 1) : '&ndash;')
        + tableHead + rows.map((r, i) => rowHtml(r, i)).join('') + '</table>';
    } catch (e) {
      box.innerHTML = '<div class="err">Could not load.</div>';
    }
  },
  chat(v: HTMLElement) {
    v.innerHTML = '<h2>💬 Hub chat</h2><div class="card"><div class="chatbox" id="chatLog"><div class="muted">Loading…</div></div><div class="row"><input id="chatIn" class="grow" placeholder="Say hi…" maxlength="200"><button class="btn small" id="chatSend">Send</button></div></div>';
    const log = $('#chatLog');
    if (Backend.mode !== 'firebase') {
      log.innerHTML = '<div class="muted">Chat needs Firebase (Profile → Setup).</div>';
      return;
    }
    const ref = Backend.db.ref('bgh_chat').limitToLast(30);
    if ((window as any)._chatOff) { try { (window as any)._chatOff(); } catch (e) {} }
    const h = (s: any) => {
      const m = s.val();
      const d = document.createElement('div');
      d.className = 'msg';
      d.innerHTML = (m.p ? '<img src="' + m.p + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:4px">' : '')
        + '<span class="who">' + esc(m.w) + '</span> ' + esc(m.t);
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    };
    ref.on('child_added', h);
    (window as any)._chatOff = () => ref.off('child_added', h);
    const send = () => {
      const t = ($('#chatIn') as any).value.trim();
      if (!t) return;
      Backend.db.ref('bgh_chat').push({ w: Auth.user.username, t, p: Auth.user.photo || '' });
      ($('#chatIn') as any).value = '';
    };
    ($('#chatSend') as HTMLElement).onclick = send;
    $('#chatIn').addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') send();
    });
  },
  authView(v: HTMLElement) {
    let tab = 'login';
    let pendingPhoto: string | null = null;
    const emojiAvatar = (emoji: string) => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      const cx = cv.getContext('2d')!;
      cx.fillStyle = '#223052';
      cx.fillRect(0, 0, 256, 256);
      cx.font = '180px serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(emoji, 128, 140);
      return cv.toDataURL('image/png');
    };
    const avatarPreview = () => pendingPhoto
      ? '<img src="' + pendingPhoto + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)">'
      : '<div style="width:64px;height:64px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:30px;border:2px solid var(--line)">👤</div>';
    const draw = () => {
      v.innerHTML = '<div class="auth-card">'
        + '<img class="auth-logo" src="/src/assets/images/hush-music-games-silver-logo.webp" alt="Hush Music">'
        + '<h1>Hush Music Board Games</h1>'
        + '<p class="muted" style="margin-top:0">15 Classic Board Games with Points</p>'
        + '<div class="auth-tabs">'
        + '<button class="auth-tab' + (tab === 'login' ? ' active' : '') + '" data-at="login">Log In</button>'
        + '<button class="auth-tab' + (tab === 'signup' ? ' active' : '') + '" data-at="signup">Sign Up (1,000 &#11088; Free)</button></div>'
        + '<div id="authForm"></div><div id="authMsg" class="muted" style="margin-top:8px"></div>'
        + '<div class="auth-footer">Ready for mobile and desktop. No credit card or installation required.</div></div>'
        + (Backend.configured() ? '' : '<div class="card"><div class="muted">Demo mode: connect Firebase in Profile &rarr; Setup for real accounts.</div></div>');
      v.querySelectorAll('[data-at]').forEach((b: any) => b.onclick = () => { Sound.click(); tab = b.dataset.at; draw(); });
      const f = $('#authForm') as HTMLElement;
      const msg = (t: string, ok?: boolean) => {
        const m = $('#authMsg') as HTMLElement;
        m.innerHTML = t;
        m.className = ok ? 'ok' : 'err';
      };
      if (tab === 'login') {
        f.innerHTML = '<label>Email or Username</label><input id="aId" placeholder="you@email.com or PlayerOne" autocomplete="username">'
          + '<label>Password</label><input id="aPw" type="password" placeholder="••••••" autocomplete="current-password">'
          + '<div style="text-align:right;margin:2px 0 4px"><a href="#" id="aForgot" class="linklike">Forgot Password?</a></div>'
          + '<button class="btn btn-silver" id="aGo">&#128274; LOG IN</button>'
          + '<div class="or-divider"><span>OR</span></div>'
          + '<button class="btn btn-outline" id="aGoogle">&#10024; Continue with Google Account</button>'
          + '<button class="btn secondary" id="aGuest">&#128100; Quick Guest Demo Play (Instant Access)</button>';
        (f.querySelector('#aForgot') as HTMLElement).onclick = async (e: Event) => {
          e.preventDefault();
          const id = ((f.querySelector('#aId') as any).value || '').trim();
          if (!id.includes('@')) { toast('Enter your email above first'); return; }
          try { await Auth.reset(id); toast('Reset email sent — check your inbox.'); }
          catch (er: any) { toast(er.message || 'Failed to send reset email'); }
        };
        (f.querySelector('#aGo') as HTMLElement).onclick = async () => {
          const id = ((f.querySelector('#aId') as any).value || '').trim();
          const pw = (f.querySelector('#aPw') as any).value;
          if (!Backend.configured()) { msg('Demo mode &mdash; use Quick Guest Demo, or connect Firebase in Profile &rarr; Setup.'); return; }
          try {
            let email = id;
            if (!id.includes('@')) {
              const u = await Friends.findUser(id);
              if (!u || !u.email) { msg('Username not found'); return; }
              email = u.email;
            }
            await Auth.login(email, pw);
            localStorage.removeItem('bgh_guest');
            await Friends.setOnline(true);
            UI.go('home');
          } catch (e: any) { msg(esc(e.message || 'Login failed')); }
        };
        (f.querySelector('#aGoogle') as HTMLElement).onclick = () => {
          Sound.click();
          if (!Backend.configured()) toast('Demo mode — connect Firebase in Profile → Setup for real accounts.');
          else toast('Google sign-in coming soon.');
        };
        (f.querySelector('#aGuest') as HTMLElement).onclick = () => {
          Sound.click();
          localStorage.setItem('bgh_guest', '1');
          Auth.user = { uid: 'local', username: 'Guest' + ri(100, 999) };
          Auth._pullLocal();
          UI.refresh();
          UI.go('home');
        };
      } else {
        const icons = ['🎧', '♠', '👑', '🎲', '💎', '🎤', '🎷', '🔥', '⭐', '🎮'];
        f.innerHTML = '<label>Profile Picture</label>'
          + '<div class="row" style="align-items:center;gap:12px"><div id="aAvPrev">' + avatarPreview() + '</div>'
          + '<button class="btn small secondary" id="aUpPhoto">Upload Photo</button>'
          + '<input type="file" id="aPhotoIn" accept="image/*" style="display:none"></div>'
          + '<div class="muted" style="font-size:11px;font-weight:800;letter-spacing:1px;margin:10px 0 6px">OR SELECT GAME ICON</div>'
          + '<div class="icon-pick">' + icons.map(e => '<button class="icon-pick-btn" data-emoji="' + e + '">' + e + '</button>').join('') + '</div>'
          + '<label>Username (3-16 letters, numbers, _)</label><input id="aName" maxlength="16" placeholder="PlayerOne" autocomplete="username">'
          + '<label>Email</label><input id="aEmail" type="email" placeholder="you@email.com" autocomplete="email">'
          + '<label>Password (6+ characters)</label><input id="aPw" type="password" placeholder="••••••" autocomplete="new-password">'
          + '<label>Confirm Password</label><input id="aPw2" type="password" placeholder="••••••" autocomplete="new-password">'
          + '<button class="btn btn-silver" id="aGo">&#128274; CREATE ACCOUNT (+1,000 &#11088; FREE)</button>';
        const prev = f.querySelector('#aAvPrev') as HTMLElement;
        const refreshPrev = () => { prev.innerHTML = avatarPreview(); };
        const upBtn = f.querySelector('#aUpPhoto') as HTMLElement;
        const upIn = f.querySelector('#aPhotoIn') as any;
        upBtn.onclick = () => upIn.click();
        upIn.onchange = () => {
          const file = upIn.files && upIn.files[0];
          if (!file) return;
          const rd = new FileReader();
          rd.onload = () => {
            const img = new Image();
            img.onload = () => {
              const cv = document.createElement('canvas');
              const sz = 256;
              const sc = Math.min(1, sz / Math.max(img.width, img.height));
              cv.width = Math.round(img.width * sc);
              cv.height = Math.round(img.height * sc);
              cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
              pendingPhoto = cv.toDataURL('image/jpeg', 0.8);
              refreshPrev();
              toast('Photo ready — it uploads when you create your account.');
            };
            img.src = rd.result as string;
          };
          rd.readAsDataURL(file);
        };
        f.querySelectorAll('.icon-pick-btn').forEach((b: any) => b.onclick = () => {
          Sound.click();
          pendingPhoto = emojiAvatar(b.dataset.emoji);
          f.querySelectorAll('.icon-pick-btn').forEach((x: any) => x.classList.remove('sel'));
          b.classList.add('sel');
          refreshPrev();
        });
        (f.querySelector('#aGo') as HTMLElement).onclick = async () => {
          const name = (f.querySelector('#aName') as any).value;
          const email = (f.querySelector('#aEmail') as any).value;
          const pw = (f.querySelector('#aPw') as any).value;
          const pw2 = (f.querySelector('#aPw2') as any).value;
          if (!Backend.configured()) { msg('Demo mode &mdash; connect Firebase in Profile &rarr; Setup to create a real account.'); return; }
          if (pw !== pw2) { msg('Passwords do not match'); return; }
          try {
            await Auth.signup(email, pw, name);
            if (pendingPhoto) { try { await Auth.uploadPhoto(pendingPhoto); } catch (e) {} }
            localStorage.removeItem('bgh_guest');
            await Friends.setOnline(true);
            UI.go('home');
          } catch (e: any) { msg(esc(e.message || 'Signup failed')); }
        };
      }
    };
    draw();
  },
  async friends(v: HTMLElement) {
    const uid = Auth.user ? Auth.user.uid : 'local';
    const playerCode = '#HUSHPLAYER_' + String(uid).slice(-4).toUpperCase();
    v.innerHTML = '<h2>&#128101; Friends &amp; Challenges</h2>'
      + '<button class="btn btn-silver" id="frLobby">&#127918; Multiplayer Rooms</button>'
      + '<div class="card pc-card"><div style="font-size:20px;font-weight:800;margin-bottom:8px">' + esc(Auth.user ? Auth.user.username : '…') + '</div><div class="pc-label">YOUR PLAYER CODE</div><div class="pc-code">' + esc(playerCode) + '</div>'
      + '<button class="btn small secondary" id="pcCopy">Copy</button></div>'
      + '<div class="card" id="frBox"><div class="muted">Loading…</div></div>';
    (v.querySelector('#frLobby') as HTMLElement).onclick = () => { Sound.click(); openLobbyModal(); };
    (v.querySelector('#pcCopy') as HTMLElement).onclick = async () => {
      Sound.click();
      try { await navigator.clipboard.writeText(playerCode); toast('Player code copied'); }
      catch (e) { toast('Copy failed — long-press to copy'); }
    };
    const box = $('#frBox') as HTMLElement;
    if (Backend.mode !== 'firebase' || !Auth.user || Auth.user.uid === 'local') {
      box.innerHTML = '<div class="muted">Friends need a Firebase account.<br><br>Go to <b>Profile &rarr; Setup</b>, paste your Firebase keys, then log in.</div>';
      return;
    }
    // Migration: ensure this user's player-code entry exists (older signups lack bgh_codes)
    try {
      const myCode = String(Auth.user.uid).slice(-4).toUpperCase();
      const chk = await Backend.db.ref('bgh_codes/' + myCode).get();
      if (!chk.exists()) await Backend.db.ref('bgh_codes/' + myCode).set(Auth.user.uid);
    } catch (e) {}
    const reqs = await Friends.requests();
    const list = await Friends.list();
    let h = '<div class="pc-label" style="margin-bottom:6px">ADD FRIEND BY USERNAME OR PLAYER CODE</div><div class="row"><input id="fq" class="grow" placeholder="Username or #HUSHPLAYER_xxxx" maxlength="24"><button class="btn small btn-silver" id="fadd">Send Request</button></div>';
    if (reqs.length) {
      h += '<h3>Requests (' + reqs.length + ')</h3>';
      for (const r of reqs) {
        // Look up the sender's CURRENT username at render time (not the stale `from` field).
        let senderName = r.from;
        try {
          const sp = await Backend.db.ref('bgh_users/' + r.uid + '/username').get();
          if (sp.exists() && sp.val()) senderName = sp.val();
        } catch (e) {}
        if (!senderName) senderName = '…' + String(r.uid).slice(-4).toUpperCase();
        h += '<div class="row" style="align-items:center"><span class="grow"><b>' + esc(senderName) + '</b></span>'
          + '<button class="btn small" data-acc="' + r.uid + '">Accept</button>'
          + '<button class="btn small secondary" data-dec="' + r.uid + '">Decline</button></div>';
      }
    }
    h += '<h3>YOUR FRIENDS (' + list.length + ')</h3>';
    if (!list.length) h += '<div class="muted">No friends yet — add someone above.</div>';
    for (const f of list) {
      h += '<div class="row" style="align-items:center">'
        + (f.photo ? '<img src="' + f.photo + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover">' : '<span style="font-size:24px">👤</span>')
        + '<span class="grow">' + (f.online ? '🟢' : '⚪') + ' <b>' + esc(f.username) + '</b></span>'
        + '<button class="btn small secondary" data-rm="' + f.uid + '">Remove</button></div>';
    }
    box.innerHTML = h;
    (box.querySelector('#fadd') as HTMLElement).onclick = async () => {
      try {
        let q = (box.querySelector('#fq') as any).value.trim().replace(/^#/, '').replace(/^HUSHPLAYER_/i, '');
        let u: any = null;
        if (q.length === 4) {
          // Player code lookup: bgh_codes/<4-char suffix> -> uid
          const cs = await Backend.db.ref('bgh_codes/' + q.toUpperCase()).get();
          if (cs.exists()) {
            const p = await Backend.db.ref('bgh_users/' + cs.val()).get();
            if (p.exists()) u = { uid: cs.val(), ...((p.val() || {}) as any) };
          }
        } else {
          u = await Friends.findUser(q);
        }
        if (!u) { toast('User not found'); return; }
        if (u.uid === Auth.user.uid) { toast("That's you!"); return; }
        await Friends.sendRequest(u.uid);
        UI.go('friends');
      } catch (e: any) {
        toast('Request failed: ' + (e && e.message ? e.message : 'network error'));
      }
    };
    box.querySelectorAll('[data-acc]').forEach((b: any) => b.onclick = async () => { await Friends.accept(b.dataset.acc); UI.go('friends'); });
    box.querySelectorAll('[data-dec]').forEach((b: any) => b.onclick = async () => { await Friends.decline(b.dataset.dec); UI.go('friends'); });
    box.querySelectorAll('[data-rm]').forEach((b: any) => b.onclick = async () => {
      try { await Friends.remove(b.dataset.rm); toast('Friend removed'); UI.go('friends'); }
      catch (e: any) { toast('Remove failed: ' + (e && e.message ? e.message : 'unknown error')); }
    });
  },
};

/* ================= online multiplayer lobby modal ================= */
async function openLobbyModal() {
  Sound.click();
  const gameIds = Object.keys(GAMES);
  let selGame = (UI.curGame && GAMES[UI.curGame]) ? UI.curGame : gameIds[0];
  const seatsOpts = (id: string) => {
    const [pmin, pmax] = GAMES[id].p;
    return Array.from({ length: pmax - pmin + 1 }, (_, i) => '<option value="' + (pmin + i) + '">' + (pmin + i) + ' players</option>').join('');
  };
  const m = modal('<div class="lobby-modal">'
    + '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:4px"><h3 style="margin:0">&#128101; Online Multiplayer Lobby</h3>'
    + '<button class="iconbtn" id="lmClose" style="padding:4px 8px;font-size:16px" title="Close">✕</button></div>'
    + (!Backend.configured() ? '<div class="card" style="background:var(--bg2);margin-top:8px"><div class="muted">Online rooms need Firebase: go to <b>Profile &rarr; Setup</b>, paste your keys, then log in.</div></div>' : '')
    + '<div class="muted" style="font-size:11px;font-weight:800;letter-spacing:1px;margin:10px 0 6px">SELECT GAME</div>'
    + '<div class="game-pills">' + gameIds.map(id => '<button class="game-pill' + (id === selGame ? ' active' : '') + '" data-gp="' + id + '" title="' + esc(GAMES[id].name) + '">' + GAMES[id].icon + '</button>').join('') + '</div>'
    + '<div id="lmGameName" style="text-align:center;font-weight:800;color:var(--gold2);margin:6px 0">' + esc(GAMES[selGame].name) + '</div>'
    + '<label>Players</label><select id="lmSeats">' + seatsOpts(selGame) + '</select>'
    + '<button class="btn btn-silver" id="lmCreate">&#65291; Create ' + esc(GAMES[selGame].name) + ' Room</button>'
    + '<div class="or-divider"><span>OR</span></div>'
    + '<div class="pc-label" style="margin-bottom:6px">JOIN WITH 4-DIGIT ROOM CODE</div>'
    + '<div class="row"><input id="lmCode" class="grow" inputmode="numeric" maxlength="4" placeholder="1234"><button class="btn small btn-silver" id="lmJoin">Join Room</button></div>'
    + '<div class="muted" style="font-size:11px;font-weight:800;letter-spacing:1px;margin:12px 0 6px">LIVE OPEN ROOMS</div>'
    + '<div id="lmRooms"><div class="muted">Loading…</div></div>'
    + '<button class="btn small secondary" id="lmRefresh" style="margin-top:6px">&#8635; Refresh</button>'
    + '</div>');
  const lmClose = m.querySelector('#lmClose') as HTMLElement;
  if (lmClose) lmClose.onclick = () => { Sound.click(); closeModal(); };
  const refreshSel = () => {
    (m.querySelector('#lmGameName') as HTMLElement).textContent = GAMES[selGame].name;
    (m.querySelector('#lmSeats') as HTMLElement).innerHTML = seatsOpts(selGame);
    (m.querySelector('#lmCreate') as HTMLElement).innerHTML = '＋ Create ' + esc(GAMES[selGame].name) + ' Room';
  };
  m.querySelectorAll('[data-gp]').forEach((b: any) => b.onclick = () => {
    Sound.click();
    selGame = b.dataset.gp;
    m.querySelectorAll('[data-gp]').forEach((x: any) => x.classList.toggle('active', x === b));
    refreshSel();
  });
  (m.querySelector('#lmCreate') as HTMLElement).onclick = async () => {
    const seats = parseInt((m.querySelector('#lmSeats') as any).value);
    const code = await Net.create(selGame, seats);
    if (code && Net.room) { closeModal(); UI.curGame = selGame; watchRoom(selGame); }
  };
  (m.querySelector('#lmJoin') as HTMLElement).onclick = async () => {
    const code = (m.querySelector('#lmCode') as any).value;
    const c = await Net.join(code);
    if (c && Net.room) { closeModal(); UI.curGame = Net.room.game; watchRoom(Net.room.game); }
  };
  const loadRooms = async () => {
    const box = m.querySelector('#lmRooms') as HTMLElement;
    if (!box) return;
    if (Backend.mode !== 'firebase') { box.innerHTML = '<div class="muted">No live rooms in demo mode.</div>'; return; }
    try {
      // Waiting rooms via indexed query (needs .indexOn: 'status' on bgh_rooms).
      const s = await Backend.db.ref('bgh_rooms').orderByChild('status').equalTo('waiting').get();
      const rooms: any[] = [];
      s.forEach((c: any) => { const r = c.val(); if (r) rooms.push(r); });
      // "Your Room": the player may have been booted from a room that's now
      // 'playing' — look it up directly via the last-room code so they can rejoin.
      let myRoom: any = null;
      try {
        const lastCode = localStorage.getItem('bgh_lastroom');
        if (lastCode) {
          const ms = await Backend.db.ref('bgh_rooms/' + lastCode).get();
          const mr = ms.val();
          if (mr && mr.seats && mr.seats.includes(Auth.user.uid)) myRoom = mr;
        }
      } catch (e) {}
      const others = myRoom ? rooms.filter(r => r.code !== myRoom.code) : rooms;
      if (!others.length && !myRoom) { box.innerHTML = '<div class="muted">No open rooms right now — create one!</div>'; return; }
      const rowHtml = (r: any, isMine: boolean) => {
        const g = GAMES[r.game];
        const hostName = (r.names && r.names[r.host]) || 'Host';
        const badge = isMine ? ' <span class="pill" style="background:var(--gold);color:#111;font-size:10px;padding:2px 8px;border-radius:99px;font-weight:800">YOUR ROOM</span>' : '';
        const btn = isMine
          ? '<button class="btn small btn-silver" data-rejoin="' + esc(r.code) + '">▶ Rejoin</button>'
          : '<button class="btn small btn-silver" data-join="' + esc(r.code) + '">Join</button>';
        return '<div class="room-row"><div class="room-ic">' + (g ? g.icon : '🎲') + '</div>'
          + '<div class="grow"><div class="room-name">' + esc(g ? g.name : 'Game') + ' <span class="room-code">#' + esc(r.code) + '</span>' + badge + '</div>'
          + '<div class="muted" style="font-size:12px">Host: ' + esc(hostName) + ' · ' + r.seats.length + '/' + r.seatsNeeded + ' players'
          + (r.status === 'playing' ? ' · <span style="color:var(--gold2)">in game</span>' : '') + '</div></div>'
          + btn + '</div>';
      };
      box.innerHTML = (myRoom ? rowHtml(myRoom, true) : '') + others.map(r => rowHtml(r, false)).join('');
      box.querySelectorAll('[data-join]').forEach((b: any) => b.onclick = async () => {
        Sound.click();
        const c = await Net.join(b.dataset.join);
        if (c && Net.room) { closeModal(); UI.curGame = Net.room.game; watchRoom(Net.room.game); }
      });
      box.querySelectorAll('[data-rejoin]').forEach((b: any) => b.onclick = async () => {
        Sound.click();
        const c = await Net.rejoin(b.dataset.rejoin);
        if (c && Net.room) { closeModal(); UI.curGame = Net.room.game; watchRoom(Net.room.game); }
      });
    } catch (e) {
      box.innerHTML = '<div class="err">Could not load rooms.</div>';
    }
  };
  (m.querySelector('#lmRefresh') as HTMLElement).onclick = () => { Sound.click(); loadRooms(); };
  loadRooms();
}

function navGo(v: string) {
  Sound.click();
  const guest = localStorage.getItem('bgh_guest') === '1';
  // Gate: firebase mode requires login before using the hub (local guests exempt)
  if (Backend.mode === 'firebase' && (!Auth.user || (Auth.user.uid === 'local' && !guest)) && v !== 'auth' && v !== 'profile') {
    UI.go('auth');
    return;
  }
  if (UI.view === 'play') {
    promptQuitGame(() => UI.go(v));
    return;
  }
  UI.go(v);
}

document.querySelectorAll('#bottomNav button').forEach((b: any) => b.onclick = () => navGo(b.dataset.v));

const lobbyBtn = $('#lobbyBtn');
if (lobbyBtn) lobbyBtn.onclick = () => {
  if (UI.view === 'play') promptQuitGame(() => openLobbyModal());
  else openLobbyModal();
};
const friendsHdrBtn = $('#friendsHdrBtn');
if (friendsHdrBtn) friendsHdrBtn.onclick = () => navGo('friends');

/* ================= game context ================= */
function makeCtx(gameId: string, mode: string, names: string[], extra?: any) {
  const C: any = {
    gameId,
    mode,
    names,
    champ: extra?.champ,
    botLevel: extra?.botLevel,
    S: null,
    isNet: mode === 'online',
    seatName(i: number) {
      return this.isNet ? Net.seatName(i) : (this.names[i] || ('Player ' + (i + 1)));
    },
    cur() {
      return this.S ? this.S.turn % this.names.length : 0;
    },
    mine() {
      if (!this.S || this.S.over) return false;
      if (this.isNet) return this.cur() === Net.mySeat();
      if (this.mode === 'pvc') return this.cur() === 0;
      return true;
    },
    myRack() {
      const g = GAMES[this.gameId];
      if (g && typeof g.myRack === 'function') return g.myRack(this);
      return (this.priv && this.priv.rack) ? (this.isNet ? this.priv.rack : (this.priv.rack[this.cur()] || [])) : [];
    },
    update(fn: (s: any) => void, quiet?: boolean) {
      fn(this.S);
      Sound.click();
      if (this.isNet) {
        Net.push({ state: this.S, turn: this.S.turn, status: this.S.over ? 'over' : 'playing' });
        if (!quiet) this.rerender();
      }
      else if (!quiet) this.rerender();
    },
    onRemote(fn: (r: any) => void) {
      this._remote = fn;
    },
    rerender() {
      if ((window as any)._C !== this) return;
      GAMES[this.gameId].render($('#view'), this);
    },
    finish(winner: number, msg?: string) {
      if ((window as any)._C !== this) return;
      this.S.over = true;
      const g = GAMES[this.gameId];
      let pts = 0;
      const pg = (Points.perGame[this.gameId] = Points.perGame[this.gameId] || { w: 0, l: 0, t: 0 });
      if (this.mode === 'pvc') {
        if (winner === 0) {
          pts = g.payout || 50;
          Points.add(pts);
          Points.wins++;
          pg.w++;
          Sound.win();
        } else if (winner === -1) {
          pg.t++;
          Sound.lose();
        } else {
          pg.l++;
          Sound.lose();
        }
      } else if (this.isNet) {
        if (winner === Net.mySeat()) {
          pts = 100;
          Points.add(pts);
          Points.wins++;
          pg.w++;
          Sound.win();
        } else if (winner === -1) {
          pg.t++;
          Sound.lose();
        } else {
          pg.l++;
          Sound.lose();
        }
      } else {
        if (winner >= 0) Sound.win();
      }
      Points.save();
      const R = $('#view');
      R.innerHTML = '<div class="card center"><div style="font-size:56px">' + (winner < 0 ? '🤝' : (this.mode === 'pvc' && winner === 0) || (this.isNet && winner === Net.mySeat()) || (!this.isNet && this.mode !== 'pvc') ? '🏆' : '😞') + '</div>'
        + '<h2>' + (winner < 0 ? 'Draw!' : esc(this.seatName(winner)) + ' wins!') + '</h2>'
        + '<div class="msg">' + esc(msg || '') + '</div>'
        + (pts ? '<div class="ok">+' + pts + ' ⭐ points</div>' : '')
        + '<button class="btn" id="againBtn">Play again</button>'
        + '<button class="btn secondary" id="roomBtn">← Game room</button>'
        + '<button class="btn secondary small" id="hubBtn" style="margin-top:6px;">All games</button></div>';
      $('#againBtn').onclick = () => {
        if (this.isNet) Net.leave();
        if (this.gameId === 'scrabble' && this.mode === 'pvc' && this.champ) {
          startGame(this.gameId, this.mode, { champ: this.champ, botLevel: this.botLevel });
        } else {
          startGame(this.gameId, this.mode);
        }
      };
      $('#roomBtn').onclick = () => {
        if (this.isNet) Net.leave(true);
        UI.curGame = this.gameId;
        UI.go('game');
      };
      $('#hubBtn').onclick = () => {
        if (this.isNet) Net.leave(true);
        UI.view = 'home';
        UI.go('home');
      };
    }
  };
  return C;
}

function promptQuitGame(onConfirm?: () => void) {
  const m = modal(
    '<div class="center" style="padding:12px 6px">' +
    '<div style="font-size:46px; margin-bottom:10px">🚪</div>' +
    '<h3 style="font-size:18px; margin-bottom:8px">Are you sure you want to quit?</h3>' +
    '<div class="muted" style="margin-bottom:18px">Your progress in this game will be lost.</div>' +
    '<div class="row" style="gap:10px">' +
    '<button class="btn secondary grow" id="quitNoBtn" style="margin:0">No</button>' +
    '<button class="btn danger grow" id="quitYesBtn" style="margin:0">Yes</button>' +
    '</div>' +
    '</div>'
  );

  const noBtn = m.querySelector('#quitNoBtn') as HTMLElement;
  if (noBtn) {
    noBtn.onclick = () => {
      Sound.click();
      closeModal();
    };
  }

  const yesBtn = m.querySelector('#quitYesBtn') as HTMLElement;
  if (yesBtn) {
    yesBtn.onclick = () => {
      Sound.click();
      if (window._C) {
        const C = window._C;
        if (C._pvTimer) { clearInterval(C._pvTimer); C._pvTimer = null; }
        if (C._gTimer) { clearInterval(C._gTimer); C._gTimer = null; }
        if (C._timer) { clearInterval(C._timer); C._timer = null; }
        if ((C as any)._stepTimer) { clearInterval((C as any)._stepTimer); (C as any)._stepTimer = null; }
        if (C.isNet) Net.leave(true);
        C._cover = false;
      }
      watchRoomCleanup();
      window._C = null;
      try { Voice.leave(); } catch (e) {}
      closeModal();
      if (onConfirm) {
        onConfirm();
      } else {
        UI.go('home');
      }
    };
  }
}

/* ================= game instructions & rules ================= */
const GAME_INSTRUCTIONS: Record<string, { title: string; icon: string; goal: string; steps: string[]; tips: string[] }> = {
  connect4: {
    title: 'Plus 4',
    icon: '🔴',
    goal: 'Connect 4 of your discs in a row horizontally, vertically, or diagonally before your opponent does.',
    steps: [
      'Take turns tapping any column (0–6) to drop a disc into the grid.',
      'Discs fall by gravity to the lowest unoccupied space in that column.',
      'Plan your moves to create lines of 4 while blocking your opponent from completing theirs.'
    ],
    tips: [
      'Controlling the center column gives you the most winning opportunities.',
      'Watch out for diagonal traps where your opponent threatens two wins at once!'
    ]
  },
  mancala: {
    title: 'Mancala',
    icon: '🫘',
    goal: 'Collect the most glass beans in your Store (the large oval cup on your right).',
    steps: [
      'On your turn, tap any of your 6 circular pits that contains beans.',
      'All beans from that pit are scooped up and sown counter-clockwise, dropping one bean into each pit (including your Store, skipping your opponent\'s Store).',
      '⭐ Free Turn: If your last bean drops directly into your Store, you get another turn immediately!',
      '🎯 Capture: If your last bean lands in an empty pit on YOUR side, and the opposite pit has beans, you capture your bean plus all beans from the opposite pit directly into your Store!'
    ],
    tips: [
      'Plan your moves to chain multiple free turns in a row by landing beans in your Store.',
      'Defend empty pits on your side so your opponent cannot capture your large stacks!'
    ]
  },
  battleship: {
    title: 'Water Wars',
    icon: '🌊',
    goal: 'Locate and sink all 4 enemy warships before your fleet is destroyed.',
    steps: [
      'Setup: Tap "🔀 Shuffle" to arrange your secret fleet (Flagship of 4, Cruiser of 3, Destroyer of 3, Submarine of 2), then tap "⚓ Start battle".',
      'Firing: On your turn, tap any unexplored coordinates in the enemy waters grid.',
      '🔥 Hit: If you strike an enemy ship, you immediately get a bonus shot! When all squares of a ship are hit, that ship is sunk.',
      '～ Miss: If you strike open water, your turn ends and your opponent fires.'
    ],
    tips: [
      'When you score a hit, fire on adjacent neighboring squares (up, down, left, right) to trace the ship\'s heading.',
      'Use a checkerboard firing pattern to cover the grid efficiently.'
    ]
  },
  chutes: {
    title: 'Ups and Downs',
    icon: '🪜',
    goal: 'Be the first player to navigate from START all the way to Square 100 by exact count.',
    steps: [
      '1. Start: All players begin off the board at the START area (Square 0).',
      '2. Spin: On your turn, tap the official 1–6 Arrow Spinner (or "SPIN" button) to spin.',
      '3. Move: Advance your standee pawn that exact number of squares along the track (zigzagging upward to row 10).',
      '4. 🪜 Ups (Ladders): If you land on a square at the foot of a ladder, climb immediately up to the square at the top of the ladder!',
      '5. 🛝 Downs (Chutes): If you land on a square at the top of a chute, slide all the way down to the square at the bottom of the chute!',
      '6. Shared Spaces: Two or more players can occupy the same square at the same time.',
      '7. 🏁 Exact Count to Win: You must reach Square 100 by exact spin count. If your spin is higher than the number needed, your pawn does not move and you must wait until your next turn to try again!'
    ],
    tips: [
      'Square 80 has a ladder that takes you directly to the Square 100 Winner ribbon for an instant victory!',
      'Watch out for the chute on Square 87 (drops down 63 spaces to 24) and Square 98 (drops to 78).'
    ]
  },
  candyland: {
    title: 'Sugar Trail',
    icon: '🍬',
    goal: 'Race your Gingerbread Pawn along the colorful rainbow path across the sweet candy wonderland to the Candy Castle 🏰!',
    steps: [
      '1. 🏁 START Line: All gingerbread pawns start at the START line (Square 1).',
      '2. 🃏 Draw a Card: On your turn, tap "Draw Card" to reveal a card from the deck.',
      '3. 🎨 Single Color: Advance your pawn forward to the next space of that matching color along the board path.',
      '4. 🚀 Double Color (✕2): Leap forward to the SECOND next space of that matching color ahead!',
      '5. ⭐ Sweet Landmarks: Draw landmark cards (Peppermint Forest, Gingerbread Tree, Peanut Brittle, Lollipop Woods, Ice Cream Slopes, Molasses Swamp) to fly directly to that sweet landmark space!',
      '6. 🌈 Secret Shortcuts: Land on Square 4 to take the Rainbow Trail shortcut to Square 28, or Square 16 to take Gumdrop Pass to Square 34!',
      '7. 🏰 Candy Castle: First gingerbread pawn to reach the Candy Castle at the end of the board wins the game!'
    ],
    tips: [
      'Watch for the glowing square — it shows exactly where your pawn will land!',
      'Landmark and double color cards can trigger exciting comebacks!'
    ]
  },
  trouble: {
    title: 'Get Home',
    icon: '🎲',
    goal: 'Pop the Pop-O-Matic die and race all 4 of your peg pawns around the board into your Home column first!',
    steps: [
      '1. 🎲 Pop-O-Matic: Tap the center Pop-O-Matic bubble or "POP DIE" button to roll the die (1–6).',
      '2. 🚀 Roll a 6: Move a pawn from Home Base onto your colored Start space (or advance an active pawn 6 spaces). Plus, earn a BONUS POP!',
      '3. 📍 Track Race: Advance your peg pawns clockwise around the 28-space track according to the die roll.',
      '4. 💥 Bumping (Get Home!): Land by exact count on a rival pawn to send them all the way back to their corner Home Base!',
      '5. 🏁 Home Column: After circling the track, turn into your color-coded 4-space Home path leading toward the center.',
      '6. 🏆 Exact Roll to Finish: The first player to bring all 4 peg pawns safely into their Home column wins the game!'
    ],
    tips: [
      'Rolling a 6 grants a free Bonus Pop — use consecutive 6s to launch multiple pawns onto the track quickly!',
      'Pawns in your Home column are 100% safe from being bumped by opponents.'
    ]
  },
  sorry: {
    title: 'My Bad',
    icon: '😈',
    goal: 'Guide all 4 of your colored pawns around the board into your Home safe zone 🏁.',
    steps: [
      'Tap "🃏 Draw" to reveal a card from the official My Bad deck.',
      'Card 1 or 2: Leaves Start or moves forward 1 or 2 spaces. Card 2 lets you draw again!',
      'Card 4: Moves BACKWARDS 4 spaces!',
      'Card 7: Moves 7 spaces forward, OR splits 7 spaces between two of your pawns.',
      'Card 10: Moves 10 spaces forward, OR moves 1 space backward.',
      'Card 11: Moves 11 spaces forward, OR switches places with ANY opponent pawn on the open track!',
      'Cards 3, 5, 8, 12: Move forward that exact number of spaces.',
      '😈 MY BAD! Card: Take a pawn from your Start and swap with ANY opponent pawn on the track, bumping them to Start!',
      '🛝 Slides: Land on a triangle slide not your own color to glide all the way to the end, bumping everyone along the slide!'
    ],
    tips: [
      'Moving 4 backward from your Start entry space puts you right behind your Safety Zone turn space for a huge shortcut!',
      'Save MY BAD! cards to bump whichever opponent is closest to their finish line.'
    ]
  },
  monopoly: {
    title: 'Enterprise',
    icon: '🌐',
    goal: 'Acquire sovereign nations across the globe, collect enterprise revenues from rivals, manage strategic Risks, tap into World Riches, and build the premier commercial empire without going bankrupt.',
    steps: [
      'Tap "🎲 Roll Dice" on your turn to travel clockwise around the 40-space global board with two dice.',
      'Sovereign Acquisitions: Land on unowned countries (United States, Japan, Germany, Brazil, etc.) to buy their commercial deeds.',
      'Enterprise Revenue: When rivals land on your territory, they pay you mandatory revenue!',
      'Pass GO: Complete a circuit around the globe to collect your +$200 enterprise capital.',
      '⚡ Risks & 💎 World Riches: Draw dynamic event cards for market surges, trade grants, bailouts, or supply chain penalties.',
      'Regional Monopolies: Own all countries in a color region to double their revenue and construct Enterprise HQs (🏢)!',
      'Win: Bankrupt all rival enterprises or finish with the highest global net worth after 25 rounds.'
    ],
    tips: [
      'High-tier nations like the United States, UAE, and Switzerland yield massive revenues.',
      'World transit routes (Airways, Rail, Maritime, Orbit) yield escalating returns as you control more of them.',
      'Maintain a cash reserve to survive unexpected tariffs, taxes, and high-rent territories.'
    ]
  },
  payday: {
    title: 'BILLS!!!',
    icon: '💵',
    goal: 'Navigate 31 calendar days of Mail, Deals, Buyers, and unexpected monthly expenses to amass the largest net savings upon reaching Day 31 BILLS!!!',
    steps: [
      'Roll & Move: On your turn, roll the 6-sided die to advance across the authentic 31-day calendar.',
      '📬 Mail Cards (Days 1, 3, 5, 11, 16, 19, 24): Draw bills (held until BILLS!!!), charity requests, insurance, or cash rewards/postcards from friends.',
      '🤝 Deal Cards (Days 4, 12, 15, 25): Invest in lucrative opportunities (e.g. Antique Car, Hot Tub, Popcorn Machine, Ski Chalet). Keep them until you find a Buyer!',
      '👩‍💼 Buyer (Days 9, 17, 20, 30): Sell any Deal in your portfolio to the Buyer for full retail value and collect immediate profit!',
      '🗳️ Town Election (Day 26): All players contribute $50 to the central Pot.',
      '🎰 Lottery Draw (Day 29): Buy a ticket to gamble against the bank for big returns!',
      '💰 The Pot (Center): Whenever ANY player rolls a 6 on their regular move, they win the entire accumulated Pot!',
      '🏁 Day 31 BILLS!!!: Collect your $1,500 salary, pay all unpaid bills accumulated in your mail pile, service loans with 10% interest, and bank your remaining profits!'
    ],
    tips: [
      'Buy Deals early whenever your balance allows—turning a $800 deal into a $2,500 buyer sale generates massive wealth.',
      'Always aim to roll a 6 to scoop up the Town Election and Sweepstakes money sitting in the Pot.'
    ]
  },
  life: {
    title: 'The Game of Choices',
    icon: '🚗',
    goal: 'Navigate the official winding Life board from Start (College or Career) through Marriage, Houses, Children, and Careers to retire at Millionaire Estates with the largest total fortune!',
    steps: [
      'Choose Path: At start, choose COLLEGE (borrow $100K tuition for higher salaries) or CAREER (start earning immediately).',
      'Spin the Wheel: On your turn, spin the 1–10 Rainbow Spinner to advance your official colored station wagon car along the track.',
      'Pegs in Car: Fill your car with your peg (🔵/🌸), your spouse upon marriage, and pink and blue children as your family grows!',
      '🛑 STOP Spaces: Everyone must stop at College Graduation (Career Choice), Get Married, Buy a House, and Mid-Life Crisis before proceeding.',
      'Pay Days: Passing or landing on green PAY DAY spaces deposits your career salary and increases your bankroll.',
      'LIFE Tiles: Land on Life spaces to draw bonus rewards, promotions, or community honors.',
      'Retire: Choose Countryside Acres or Millionaire Estates. First retiree earns a $400K cash bonus, plus $50K per child/LIFE tile!'
    ],
    tips: [
      'College degrees open high-tier professions like Doctor and Lawyer that pay huge dividends every Pay Day.',
      'Houses appreciate in value and protect your wealth from market crashes.'
    ]
  },
  jumanji: {
    title: 'Safari',
    icon: '🦁',
    goal: 'Be the first player to reach the center of the board and call out "SAFARI!" But beware: if the 10-slot Doomsday Grid fills with danger cards, all players lose to the jungle!',
    steps: [
      'Roll & Move: On your turn, roll the number die to advance your carved animal pawn (Monkey, Rhino, Crocodile, or Elephant) along your 28-square bone stepping stone track from Space 1 to the Center (Space 28).',
      'Blank Spaces: Draw a Danger Card into the center red decoder lens! The secret rhyme, rescue symbol (Saber, Rope, Raft, Axe, Racquet, or Door), and movement number are revealed. The 8-second timer flips!',
      'Rescue Dice & Hourglass: Fellow players roll rescue dice simultaneously to match the card\'s symbol or roll the wild Hourglass ⏳. If successful, fellow players advance by the card\'s number! If anyone fails, the card goes to the Doomsday Grid and the active player moves backward!',
      'Wait for 5 or 8 Spaces: "In the jungle you must wait, until the dice read 5 or 8!" You are trapped until any player rolls a 5 or an 8. Any other roll moves you backward 1 space!',
      'Rhino Spaces: Place the stone Rhinoceros in front of any player to block their progress. Blocked players must roll an even number (2, 4, 6) to pass!',
      'Jungle Spaces: All players are trapped! Everyone rolls rescue dice. If all succeed, everyone moves forward 1 space. If anyone fails, the card goes to the Doomsday Grid!',
      'Winning Safari: The first player to reach the central wooden circle (Space 28) by exact count and call out "SAFARI!" wins the game!'
    ],
    tips: [
      'Cooperate on rescue rolls—helping fellow players succeed keeps dangerous cards off the Doomsday Grid.',
      'Watch out for the Rhino blocker; roll an even number to push past it.'
    ]
  },
  clue: {
    title: 'Clue',
    icon: '🔍',
    goal: 'Explore Tudor Mansion, deduce the secret Suspect, Weapon, and Room hidden in the Confidential Case File envelope, and solve the murder!',
    steps: [
      'Official Game Board: Navigate through the 9 authentic mansion rooms (Study, Hall, Lounge, Library, Dining Room, Billiard Room, Conservatory, Ballroom, and Kitchen).',
      'Roll & Move: On your turn, roll the die to move across hallways into adjacent rooms, or take Secret Passages between corner rooms (Study ↔ Kitchen, Lounge ↔ Conservatory)!',
      'Suggest in Room: When you enter a room, make a suggestion using that room, a suspect, and a weapon. The suspect pawn and weapon token are moved to that room on the official board!',
      'Disprove with Picture Cards: Other players clockwise check their secret hands. The first player with a matching card secretly reveals it to you.',
      'Detective Notebook: Track your clues! Tap any entry to cycle: ? (Unknown) → ✓ (Confirmed in hand/seen) → ✗ (Ruled out) → ! (Culprit!).',
      'Accuse: When you know all 3 cards, switch to Accuse and name the culprit, murder weapon, and murder room. Correct accusation wins immediately! Wrong accusation eliminates you from turns.'
    ],
    tips: [
      'Use the corner Secret Passages to travel instantly across the mansion without needing a high die roll.',
      'Suggest cards you already hold to mislead rivals and pinpoint their missing evidence.'
    ]
  },
  scrabble: {
    title: 'WordPlay',
    icon: '🔤',
    goal: 'Official 15×15 WordPlay. Spell high-scoring words on the official board using wooden letter tiles and premium multiplier squares.',
    steps: [
      'Official 15×15 Board: Play on the authentic 225-square board with coordinate labels A–O and 1–15.',
      'Newest Webster Dictionary: Word allowances validated against the Official WordPlay Players Dictionary (8th Edition, 83,000+ words including newest additions like BOBA, KAYFABE, SPOX, YAS, ZOOMIES, VAX, GUAC, WELP, BAE, RIZZ, and all 107 official 2-letter words).',
      '1. Tap any empty square on the board to set your starting anchor (shown with a pulsing gold ring).',
      '2. Tap "↔ Across" or "↕ Down" to choose spelling direction.',
      '3. Tap wooden tiles on your rack to place them into the squares. Tap any placed tile to recall it back to your rack.',
      '4. Tap "▶ Play Word" to submit and score!',
      '★ Center Star (H8 / 7,7): The first word of the game must cover the center star for Double Word score.',
      'Connecting Words: All subsequent plays must connect with tiles already on the board.',
      'Points Match the Squares: Double Letter (DL = 2× letter), Triple Letter (TL = 3× letter), Double Word (DW = 2× word), Triple Word (TW = 3× word). Using all 7 tiles in one turn awards the +50 Bingo bonus!',
      'Champion Levels 1–10: Play against the 10 greatest World Champions (Level 1 Peter Morris through Level 10 GOAT Nigel Richards). Each level elevates tactical vocabulary, board positioning, and bingo hunting!',
      'Rack Tools: Use "🔀 Shuffle" to discover new anagrams, "↺ Recall All" to reset placed tiles, or "🔄 Exchange" / "⏭ Pass".'
    ],
    tips: [
      'Level Selection: Select your opponent level (1–10) in the game setup lobby before starting your match against any of the 10 World Champions.',
      'Word Allowance: You can play modern words like BOBA, ZOOMIES, VAX, GUAC, RIZZ, or classic high-value two-letter words like QI, ZA, XI, and XU.',
      'Target DW and TW bonus squares with high-value letters like Q (10), Z (10), J (8), and X (8).',
      'Look for parallel plays that hook into existing words to score points for multiple words simultaneously.'
    ]
  },
  pictionary: {
    title: 'Pictionary',
    icon: '✏️',
    goal: 'Draw and guess sketches under time pressure across 20 difficulty levels and 1,000 pictures!',
    steps: [
      '🎨 20 Difficulty Levels: Choose your tier from Level 1 (Novice Doodler, 35s timer, relaxed pace) all the way to Level 20 (Grandmaster Da Vinci, 16s speedrun)!',
      '✨ 1,000 Pictures & Celebrities: Massive catalog including world-famous pop stars, athletes, scientists, historical figures, superheroes, animals, vehicles, food, instruments, and landmarks.',
      '🤖 Vs Computer: The AI sketches stroke-by-stroke in real time. Pick the correct item from 4 choices before the clock runs out! Score 3+ out of 5 rounds to win.',
      '🔄 Zero Duplicates: Non-repeating random picture generator ensures pictures are never repeated back-to-back or in the same session.',
      '👥 Duel (With a Friend): Take turns drawing with your finger on the canvas (60s timer). The guesser types their answer in the guess box.',
      'Drawing Tools: Draw with your finger/mouse. Use "Clear" to wipe the canvas, and tap "Done" when finished.'
    ],
    tips: [
      'Level Selection: Pick your preferred challenge level (1–20) on the game setup lobby screen before launching.',
      'Look for signature celebrity traits: Michael Jackson\'s fedora & glove, Einstein\'s bushy hair, Elvis\'s pompadour, Spider-Man\'s eyes!',
      'In Vs Computer, watch the preliminary stroke outlines early to lock in your guess before time runs out.'
    ]
  },
  guesswho: {
    title: 'Guess?',
    icon: '🕵️',
    goal: 'Deduce which of the 24 characters your opponent secretly picked before they guess yours.',
    steps: [
      'Secret Pick: Each player secretly selects one character.',
      'Ask Questions: On your turn, tap one of the trait questions ("Girl?", "Wearing a hat?", "Glasses?", "Facial hair?", "Bald?", "Earrings?").',
      'Flip Down: Opponents answer Yes or No. All non-matching suspect faces are automatically flipped down and eliminated!',
      '👆 Guess Mode: When you have narrowed it down, tap "👆 Guess mode", then tap the suspect\'s portrait to make your guess.',
      '⚠️ Warning: Correct guess wins the game! Wrong guess loses immediately!'
    ],
    tips: [
      'Ask questions that eliminate roughly half the remaining suspects (e.g., gender or facial hair) early in the game.',
      'Never guess until you have narrowed it down to 1 or 2 suspects, unless you are trailing!'
    ]
  }
};

function shortInstruction(gameId: string): string {
  const map: Record<string, string> = {
    connect4: 'Tap any column to drop a disc. Connect 4 in a row to win in Plus 4!',
    mancala: 'Tap your pits to sow beans counter-clockwise. Land in your Store for a free turn!',
    battleship: 'Tap enemy coordinates to fire. 🔥 = Hit & bonus shot! Sink all 4 warships in Water Wars.',
    chutes: 'Spin 1–6 to advance. Climb up ladders 🪜, avoid sliding down 🛝. Exact spin to reach 100 in Ups and Downs!',
    candyland: 'Draw cards to race along the rainbow Sugar Trail. Themed boards & gingerbread pawns!',
    trouble: 'Pop 6 to leave home. Race the track and bump rival pawns back home!',
    sorry: 'Official My Bad: Draw cards to race the 60-space track. 4 goes back, 11 swaps places, slides bump rivals, and MY BAD! steals spots!',
    monopoly: 'Roll dice to buy world nations, collect revenue, draw ⚡ Risks & 💎 World Riches, and bankrupt rival enterprises!',
    payday: 'Roll the 31-day calendar! Draw Mail 📬 & Deals 🤝, sell to Buyers 👩‍💼, roll 6 for the Pot 💰, and survive BILLS!!!',
    life: 'Spin the 1–10 Rainbow Wheel! Choose College or Career, marry, buy houses, add pegs to your car, and retire rich!',
    jumanji: 'Official Safari: Roll along bone stepping stone paths, decode danger cards in the center dome, roll rescue dice before the timer runs out, and avoid filling the 10-slot Doomsday Grid!',
    clue: 'Suggest suspect/weapon/room combos to gather clues. Narrow down your notes and Accuse!',
    scrabble: 'Tap a start square, choose Across or Down, and spell valid words from your rack.',
    pictionary: 'Guess the sketch before the timer runs out, or draw with your finger for friends!',
    guesswho: 'Ask Yes/No trait questions to eliminate suspects. Tap Guess mode to accuse!'
  };
  return map[gameId] || 'Follow the on-screen turn prompts to play.';
}

function showGameInstructions(gameId: string) {
  const g = GAME_INSTRUCTIONS[gameId] || {
    title: (GAMES[gameId] && GAMES[gameId].name) || 'Game Rules',
    icon: (GAMES[gameId] && GAMES[gameId].icon) || '🎲',
    goal: (GAMES[gameId] && GAMES[gameId].rules) || 'Follow the in-game prompts to play.',
    steps: [],
    tips: []
  };

  Sound.click();
  modal(
    '<div style="max-height:75vh; overflow-y:auto; padding:4px;">' +
    '<div class="row" style="justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--line); padding-bottom:8px;">' +
    '  <h2 style="margin:0; font-size:20px;">' + g.icon + ' ' + esc(g.title) + ' — How to Play</h2>' +
    '  <button class="iconbtn" id="closeRulesBtn" style="padding:4px 8px; font-size:16px;" title="Close">✕</button>' +
    '</div>' +
    '<div class="card" style="background:var(--bg2); border-left:3px solid var(--gold); margin-bottom:12px; padding:12px;">' +
    '  <div style="font-weight:800; color:var(--gold2); font-size:13px; margin-bottom:4px;">🎯 OBJECTIVE</div>' +
    '  <div style="font-size:14px; line-height:1.4;">' + esc(g.goal) + '</div>' +
    '</div>' +
    (g.steps.length ? 
      '<div class="card" style="background:var(--bg2); margin-bottom:12px; padding:12px;">' +
      '  <div style="font-weight:800; color:var(--gold2); font-size:13px; margin-bottom:6px;">🕹️ HOW TO PLAY & RULES</div>' +
      '  <ol style="margin:0; padding-left:18px; font-size:14px; line-height:1.5;">' +
           g.steps.map(s => '<li style="margin-bottom:6px;">' + esc(s) + '</li>').join('') +
      '  </ol>' +
      '</div>' : '') +
    (g.tips.length ? 
      '<div class="card" style="background:var(--bg2); border-left:3px solid var(--green); margin-bottom:12px; padding:12px;">' +
      '  <div style="font-weight:800; color:var(--green); font-size:13px; margin-bottom:6px;">💡 STRATEGY TIPS</div>' +
      '  <ul style="margin:0; padding-left:18px; font-size:13px; line-height:1.4;">' +
           g.tips.map(t => '<li style="margin-bottom:4px;">' + esc(t) + '</li>').join('') +
      '  </ul>' +
      '</div>' : '') +
    '<button class="btn" id="okRulesBtn" style="margin-top:8px;">Got it!</button>' +
    '</div>'
  );

  const closeBtn = $('#closeRulesBtn');
  if (closeBtn) closeBtn.onclick = () => { Sound.click(); closeModal(); };
  const okBtn = $('#okRulesBtn');
  if (okBtn) okBtn.onclick = () => { Sound.click(); closeModal(); };
}

document.addEventListener('click', (e: MouseEvent) => {
  const quitTarget = (e.target as HTMLElement)?.closest('.quit-game-btn, #quitGameBtn, #headerQuitBtn');
  if (quitTarget) {
    e.preventDefault();
    promptQuitGame();
    return;
  }
  const rulesTarget = (e.target as HTMLElement)?.closest('.rules-btn, [data-open-rules], [data-gid]');
  if (rulesTarget) {
    e.preventDefault();
    const el = rulesTarget as HTMLElement;
    const gid = el.dataset.gid || el.dataset.openRules || (window._C && window._C.gameId) || UI.curGame;
    if (gid) showGameInstructions(gid);
  }
});

function turnBanner(C: any) {
  const modeLabel = C.mode === 'pvc' ? '🤖 vs Computer' : (C.mode === 'online' ? '🌐 Online Room' : '👥 Pass & Play');
  const t = C.S && !C.S.over ? (C.mine() ? '🟢 Your move — ' + esc(C.seatName(C.cur())) : '⏳ ' + esc(C.seatName(C.cur())) + ' to move') : '';
  const shortText = shortInstruction(C.gameId);
  return '<div class="game-control-bar">'
    + '<button class="btn secondary small quit-game-btn" type="button" title="Quit this game">← Quit</button>'
    + '<span class="pill" style="font-size:12px; padding:4px 10px;">' + modeLabel + '</span>'
    + '<button class="btn secondary small rules-btn" type="button" data-gid="' + C.gameId + '" title="How to play">📖 Instructions</button>'
    + '</div>'
    + (shortText ? '<div class="game-instructions-strip" data-open-rules="' + C.gameId + '"><span class="inst-icon">💡</span><span class="inst-text">' + esc(shortText) + '</span><span class="inst-more">Full Rules ➔</span></div>' : '')
    + (t ? '<div class="turn-banner">' + t + '</div>' : '');
}
function cpuDelay(fn: () => void, ms?: number) {
  setTimeout(fn, ms || 700);
}

function startGame(gameId: string, mode: string, extra?: any) {
  const g = GAMES[gameId];
  if (mode === 'online') {
    UI.view = 'lobby';
    UI.go('lobby');
    watchRoomCleanup();
    return;
  }
  if (gameId === 'scrabble' && mode === 'pvc') {
    const champ = (extra && extra.champ) ? extra.champ : getSelectedScrabbleChamp();
    launch('scrabble', 'pvc', [Auth.user.username, `${champ.name} (${champ.flag} Lv.${champ.level})`], { champ, botLevel: champ.level });
    return;
  }
  let names: string[];
  if (mode === 'pvc') names = [Auth.user.username, 'Computer 🤖'];
  else names = ['Player 1', 'Player 2'];
  if (g.p[1] > 2 && mode === 'hotseat') {
    const m = modal('<h3>👥 How many players?</h3>' + Array.from({ length: g.p[1] - g.p[0] + 1 }, (_, i) => '<button class="btn secondary" data-n="' + (g.p[0] + i) + '">' + (g.p[0] + i) + ' players</button>').join(''));
    m.querySelectorAll('[data-n]').forEach((b: any) => b.onclick = () => {
      closeModal();
      launch(gameId, mode, Array.from({ length: +b.dataset.n }, (_, i) => 'Player ' + (i + 1)));
    });
    return;
  }
  launch(gameId, mode, names, extra);
}

function launch(gameId: string, mode: string, names: string[], extra?: any) {
  const C = makeCtx(gameId, mode, names, extra);
  UI.view = 'play';
  GAMES[gameId].init(C);
}

let _roomWatching = false;
function watchRoomCleanup() {
  if (_roomWatching) {
    Net.leave(true);
    _roomWatching = false;
  }
}

function watchRoom(gameId: string) {
  if (!Net.room) {
    toast('No active room found.');
    UI.go('game');
    return;
  }
  _roomWatching = true;
  UI.view = 'play';
  const v = $('#view');
  const code = Net.room.code || '';
  const seats = Net.room.seats || [];
  const needed = Net.room.seatsNeeded || 2;
  v.innerHTML = '<div class="card center"><h2>🌐 Room ' + code + '</h2><div class="muted" id="wMsg">Waiting for players… ' + seats.length + '/' + needed + '</div><button class="btn secondary" id="lvBtn">Leave</button><button class="btn secondary" id="voiceBtn" style="margin-top:8px">🎤 Join voice chat</button></div>';
  $('#lvBtn').onclick = () => {
    watchRoomCleanup();
    UI.go('game');
  };
  $('#voiceBtn').onclick = async () => {
    if (!Net.room || !Net.room.code) return;
    const ok = await Voice.join();
    if (ok) {
      const vb = $('#voiceBtn') as HTMLElement;
      if (vb) { vb.textContent = '🎤 Voice on — tap 🎤 in header to mute'; vb.setAttribute('disabled', 'true'); }
    }
  };
  const handleRoomUpdate = (room: any) => {
    const wm = $('#wMsg');
    if (wm) wm.textContent = 'Waiting for players… ' + room.seats.length + '/' + room.seatsNeeded;
    if (room.status === 'waiting' && room.seats.length >= room.seatsNeeded && Net.isHost()) {
      const names = room.seats.map((u: string, i: number) => (room.names && room.names[u]) || ('Player ' + (i + 1)));
      const C = makeCtx(gameId, 'online', names);
      GAMES[gameId].init(C);
      return;
    }
    if (room.status === 'playing') {
      if (!window._C || window._C.gameId !== gameId || window._C.mode !== 'online') {
        const names = room.seats.map((u: string, i: number) => (room.names && room.names[u]) || ('Player ' + (i + 1)));
        const C = makeCtx(gameId, 'online', names);
        C.S = JSON.parse(JSON.stringify(room.state));
        GAMES[gameId].onJoin(C);
        return;
      }
      const C = window._C;
      if (JSON.stringify(C.S) !== JSON.stringify(room.state)) {
        C.S = JSON.parse(JSON.stringify(room.state));
        if (C._remote) C._remote(room);
        else C.rerender();
      }
    }
  };
  Net.onUpdate(handleRoomUpdate);
  // Rejoining a room that's already 'playing' changes nothing in the room
  // doc, so the listener's change-check never fires and the player would
  // sit on the waiting card until someone moves. Evaluate the current room
  // once right now so a rejoin jumps straight into the game.
  if (Net.room) handleRoomUpdate(Net.room);
}

/* ================= game helpers ================= */
function stdInit(id: string, def: any) {
  def.init = function(C: any) {
    C.S = def.newState(C);
    window._C = C;
    if (def.inbox) Net.onInbox((msg: any) => { if (window._C === C) def.inbox(C, msg); });
    if (C.isNet) Net.push({ state: C.S, turn: C.S.turn, status: 'playing' });
    def.render($('#view'), C);
    if (C.isNet) updateVoiceHdrBtn();
  };
  def.onJoin = function(C: any) {
    window._C = C;
    if (def.inbox) Net.onInbox((msg: any) => { if (window._C === C) def.inbox(C, msg); });
    def.render($('#view'), C);
    updateVoiceHdrBtn();
  };
  GAMES[id] = Object.assign({ id }, def);
}
function maybeCpu(C: any) {
  if (C.mode === 'pvc' && !C.isNet && C.S && !C.S.over && C.cur() === 1) {
    cpuDelay(() => {
      if (window._C === C && !C.S.over && GAMES[C.gameId].cpu) GAMES[C.gameId].cpu(C);
    });
  }
}
function diceFace(n: number) {
  return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][n - 1] || '🎲';
}
function passCover(C: any, next: number) {
  C._cover = true;
  const R = $('#view');
  R.innerHTML = '<div class="card center" style="margin-top:60px">'
    + '<div style="font-size:56px">🙈</div>'
    + '<h2>Pass to ' + esc(C.seatName(next)) + '</h2>'
    + '<div class="muted">Look away, ' + esc(C.seatName(1 - next)) + '!</div>'
    + '<button class="btn" id="readyBtn">I\'m ' + esc(C.seatName(next)) + ' — ready</button>'
    + '<button class="btn secondary small quit-game-btn" type="button" style="margin-top:12px;">← Quit Game</button>'
    + '</div>';
  $('#readyBtn').onclick = () => {
    C._cover = false;
    C.rerender();
  };
}

/* ================= PLUS 4 ================= */
stdInit('connect4', {
  name: 'Plus 4',
  icon: '🔴',
  desc: 'Drop discs, connect 4 in a row',
  p: [2, 2],
  payout: PAYOUTS.connect4,
  rules: 'Drop your discs into the grid. First to connect 4 in a row (any direction) wins.',
  newState() { return { turn: 0, board: Array(42).fill(0), over: false }; },
  win(b: number[]) {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const p = b[r * 7 + c];
        if (!p) continue;
        if (c <= 3 && p === b[r * 7 + c + 1] && p === b[r * 7 + c + 2] && p === b[r * 7 + c + 3]) return p;
        if (r <= 2 && p === b[(r + 1) * 7 + c] && p === b[(r + 2) * 7 + c] && p === b[(r + 3) * 7 + c]) return p;
        if (r <= 2 && c <= 3 && p === b[(r + 1) * 7 + c + 1] && p === b[(r + 2) * 7 + c + 2] && p === b[(r + 3) * 7 + c + 3]) return p;
        if (r <= 2 && c >= 3 && p === b[(r + 1) * 7 + c - 1] && p === b[(r + 2) * 7 + c - 2] && p === b[(r + 3) * 7 + c - 3]) return p;
      }
    }
    return 0;
  },
  drop(S: any, col: number, piece: number) {
    for (let r = 5; r >= 0; r--) {
      if (!S.board[r * 7 + col]) {
        S.board[r * 7 + col] = piece;
        return r;
      }
    }
    return -1;
  },
  legal(S: any) {
    const L = [];
    for (let c = 0; c < 7; c++) if (!S.board[c]) L.push(c);
    return L;
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    if (C._cover) return;
    let h = turnBanner(C) + '<h2>🔴 Plus 4</h2><div class="board" style="grid-template-columns:repeat(7,1fr);max-width:420px">';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const p = S.board[r * 7 + c];
        h += '<div class="cell" data-c="' + c + '" style="background:#1c2b4a;border-radius:50%">' + (p ? (p === 1 ? '🔴' : '🟡') : '') + '</div>';
      }
    }
    h += '</div>';
    if (S.over) h += '<div class="msg">' + esc(S.msg) + '</div>';
    R.innerHTML = h;
    if (!S.over && C.mine()) {
      R.querySelectorAll('.cell').forEach((el: any) => el.onclick = () => {
        g.drop(S, +el.dataset.c, C.cur() + 1);
        Sound.dice();
        const w = g.win(S.board);
        if (w) {
          S.over = true;
          S.msg = '4 in a row!';
          C.update(() => {});
          C.finish(w - 1);
          return;
        }
        if (!S.board.includes(0)) {
          S.over = true;
          C.update(() => {});
          C.finish(-1, 'Board full');
          return;
        }
        S.turn = (S.turn + 1) % C.names.length;
        C.update(() => {});
        maybeCpu(C);
      });
    }
  },
  cpu(C: any) {
    const S = C.S, g = this;
    const order = [3, 2, 4, 1, 5, 0, 6];
    function evalB(b: number[]) {
      let s = 0;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          if (b[r * 7 + c] === 2) s += 3 + (c === 3 ? 2 : 0);
        }
      }
      return s;
    }
    function mm(b: number[], depth: number, max: boolean): number {
      const w = g.win(b);
      if (w === 2) return 1000 + depth;
      if (w === 1) return -1000 - depth;
      if (depth === 0 || !b.includes(0)) return evalB(b);
      let best = max ? -1e9 : 1e9;
      for (const c of order) {
        if (b[c]) continue;
        let r = 5;
        while (r >= 0 && b[r * 7 + c]) r--;
        if (r < 0) continue;
        b[r * 7 + c] = max ? 2 : 1;
        const v = mm(b, depth - 1, !max);
        b[r * 7 + c] = 0;
        best = max ? Math.max(best, v) : Math.min(best, v);
      }
      return best;
    }
    let bestC = order[0], bestV = -1e9;
    for (const c of order) {
      if (S.board[c]) continue;
      const b = S.board.slice();
      let r = 5;
      while (b[r * 7 + c]) r--;
      b[r * 7 + c] = 2;
      let v = mm(b, 4, false);
      const wb = g.win(b);
      if (wb === 2) v = 10000;
      if (v > bestV) {
        bestV = v;
        bestC = c;
      }
    }
    g.drop(S, bestC, 2);
    const w = g.win(S.board);
    if (w) {
      S.over = true;
      C.update(() => {});
      C.finish(1);
      return;
    }
    if (!S.board.includes(0)) {
      S.over = true;
      C.update(() => {});
      C.finish(-1, 'Board full');
      return;
    }
    S.turn = 0;
    C.update(() => {});
  }
});

/* ================= MANCALA ================= */
stdInit('mancala', {
  name: 'Mancala',
  icon: '🫘',
  desc: 'Sow stones, capture',
  p: [2, 2],
  payout: PAYOUTS.mancala,
  rules: 'Tap one of YOUR 6 pits to sow stones. Last stone in your store = free turn. Last stone in an empty pit of yours captures that pit + the opposite pit. Most stones in store wins.',
  newState() { return { turn: 0, pits: [[4, 4, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4]], store: [0, 0], over: false }; },
  sow(S: any, side: number, pit: number) {
    const stones = S.pits[side][pit];
    S.pits[side][pit] = 0;
    let s = side, p = pit + 1, free = false, cap = 0;
    while (stones > 0) {
      let n = stones;
      while (n > 0) {
        if (p > 5) {
          if (s === side) {
            S.store[s]++;
            n--;
            if (n === 0) free = true;
          }
          s = 1 - s;
          p = 0;
          continue;
        }
        S.pits[s][p]++;
        n--;
        p++;
      }
      break;
    }
    let ls = s, lp = p - 1;
    if (lp < 0) { ls = 1 - ls; lp = 5; }
    if (!free && ls === side && S.pits[ls][lp] === 1) {
      const opp = S.pits[1 - side][5 - lp];
      if (opp > 0) {
        cap = opp + 1;
        S.store[side] += cap;
        S.pits[ls][lp] = 0;
        S.pits[1 - side][5 - lp] = 0;
      }
    }
    return { free, cap };
  },
  moves(S: any, side: number) {
    const M = [];
    for (let i = 0; i < 6; i++) if (S.pits[side][i] > 0) M.push(i);
    return M;
  },
  gameOver(S: any) {
    return S.pits[0].every((x: number) => !x) || S.pits[1].every((x: number) => !x);
  },
  collect(S: any) {
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 6; i++) {
        S.store[s] += S.pits[s][i];
        S.pits[s][i] = 0;
      }
    }
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;

    function renderMancalaBeans(count: number, isStore: boolean, seedKey: number): string {
      if (count <= 0) return '';
      const colors = ['bean-aqua', 'bean-amber', 'bean-blue', 'bean-red', 'bean-green', 'bean-pearl'];
      let html = '<div class="mancala-beans-cluster">';
      
      if (isStore) {
        const visibleCount = Math.min(count, 32);
        for (let k = 0; k < visibleCount; k++) {
          const colIdx = k % 2;
          const rowIdx = Math.floor(k / 2);
          const baseX = colIdx === 0 ? 32 : 68;
          const jx = ((k * 17 + seedKey * 11) % 15) - 7;
          const x = Math.max(18, Math.min(82, baseX + jx));
          
          const baseY = 82 - rowIdx * 5.3;
          const jy = ((k * 23 + seedKey * 7) % 9) - 4;
          const y = Math.max(14, Math.min(88, baseY + jy));
          
          const rot = (k * 47 + seedKey * 29) % 360;
          const color = colors[(k + seedKey * 2) % colors.length];
          html += `<span class="mancala-bean ${color}" style="left:${x}%; top:${y}%; transform: translate(-50%, -50%) rotate(${rot}deg);" aria-hidden="true"></span>`;
        }
      } else {
        const visibleCount = Math.min(count, 18);
        for (let k = 0; k < visibleCount; k++) {
          let x = 50, y = 50;
          if (visibleCount === 1) {
            x = 50; y = 50;
          } else if (visibleCount === 2) {
            x = k === 0 ? 36 : 64;
            y = 50 + (k === 0 ? -3 : 3);
          } else if (visibleCount === 3) {
            const angle = (k * 120 + 30) * Math.PI / 180;
            x = 50 + 17 * Math.cos(angle);
            y = 50 + 17 * Math.sin(angle);
          } else if (visibleCount === 4) {
            const angle = (k * 90 + 45) * Math.PI / 180;
            x = 50 + 18 * Math.cos(angle);
            y = 50 + 18 * Math.sin(angle);
          } else {
            if (k === 0) {
              x = 50; y = 50;
            } else if (k <= 6) {
              const r = 18;
              const angle = ((k - 1) * 60 + seedKey * 15) * Math.PI / 180;
              x = 50 + r * Math.cos(angle);
              y = 50 + r * Math.sin(angle);
            } else {
              const r = 30;
              const angle = ((k - 7) * 36 + seedKey * 25) * Math.PI / 180;
              x = 50 + r * Math.cos(angle);
              y = 50 + r * Math.sin(angle);
            }
          }
          
          const jx = ((k * 13 + seedKey * 7) % 7) - 3;
          const jy = ((k * 19 + seedKey * 11) % 7) - 3;
          const finalX = Math.max(18, Math.min(82, x + jx));
          const finalY = Math.max(18, Math.min(82, y + jy));
          const rot = (k * 59 + seedKey * 31) % 360;
          const color = colors[(k + seedKey * 3) % colors.length];
          html += `<span class="mancala-bean ${color}" style="left:${finalX}%; top:${finalY}%; transform: translate(-50%, -50%) rotate(${rot}deg);" aria-hidden="true"></span>`;
        }
      }
      
      html += '</div>';
      return html;
    }

    const renderPit = (s: number, i: number) => {
      const count = S.pits[s][i];
      const isMyRow = C.cur() === s && C.mine();
      const isInteractive = isMyRow && count > 0 && !S.over;
      const pitSeed = s * 6 + i;
      
      return `
        <div class="mancala-pit ${isInteractive ? 'interactive' : ''} ${isMyRow ? 'active-row' : ''}" 
             data-s="${s}" data-i="${i}"
             title="${esc(C.seatName(s))} - Pit ${i + 1} (${count} beans)"
             style="${isInteractive ? 'cursor:pointer;' : ''}">
          ${renderMancalaBeans(count, false, pitSeed)}
          ${count > 0 ? `<span class="mancala-count">${count}</span>` : ''}
        </div>
      `;
    };

    const renderStore = (s: number) => {
      const count = S.store[s];
      const isStore1 = s === 1;
      const label = isStore1 
        ? `${C.mode === 'pvc' ? '🤖 ' : ''}${esc(C.seatName(1))}` 
        : `${C.mode === 'pvc' ? '⭐ ' : ''}${esc(C.seatName(0))}`;
      
      return `
        <div class="mancala-store" 
             title="${label} Store (${count} beans)"
             style="grid-column: ${isStore1 ? '1' : '8'}; grid-row: 1 / span 2;">
          <span class="mancala-store-label">Store</span>
          ${renderMancalaBeans(count, true, s * 13 + 5)}
          <span class="mancala-store-count">${count}</span>
        </div>
      `;
    };

    let h = turnBanner(C) + '<h2>🫘 Mancala</h2>'
      + '<div class="mancala-table">'
      + '  <div class="mancala-player-row">'
      + '    <div class="mancala-player-badge ' + (C.cur() === 1 ? 'active' : '') + '">'
      + '      <span>' + (C.mode === 'pvc' ? '🤖' : '👤') + '</span>'
      + '      <span>' + esc(C.seatName(1)) + '</span>'
      + '      <span class="mancala-score">Store: <b>' + S.store[1] + '</b></span>'
      + '    </div>'
      + '    <div class="mancala-arrow-guide">← moves left to store</div>'
      + '  </div>'
      + '  <div class="mancala-board">'
      + '    <div class="mancala-grid">'
      +        renderStore(1)
      +        [5, 4, 3, 2, 1, 0].map(i => renderPit(1, i)).join('')
      +        [0, 1, 2, 3, 4, 5].map(i => renderPit(0, i)).join('')
      +        renderStore(0)
      + '    </div>'
      + '  </div>'
      + '  <div class="mancala-player-row">'
      + '    <div class="mancala-arrow-guide">moves right to store →</div>'
      + '    <div class="mancala-player-badge ' + (C.cur() === 0 ? 'active' : '') + '">'
      + '      <span>' + (C.mode === 'pvc' ? '⭐' : '👤') + '</span>'
      + '      <span>' + esc(C.seatName(0)) + (C.mode === 'pvc' ? ' (you)' : '') + '</span>'
      + '      <span class="mancala-score">Store: <b>' + S.store[0] + '</b></span>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    R.innerHTML = h;

    if (!S.over && C.mine()) {
      R.querySelectorAll('.mancala-pit[data-s]').forEach((el: any) => {
        const s = +el.dataset.s, i = +el.dataset.i;
        if (s === C.cur() && S.pits[s][i]) {
          el.onclick = () => {
            const r = g.sow(S, s, i);
            Sound.bean();
            if (r.cap > 0) {
              toast('🎯 Captured ' + r.cap + ' beans!');
            } else if (r.free) {
              toast('⭐ Free turn! Landed in store.');
            }
            if (g.gameOver(S)) {
              g.collect(S);
              S.over = true;
              C.update(() => {});
              const w = S.store[0] === S.store[1] ? -1 : (S.store[0] > S.store[1] ? 0 : 1);
              C.finish(w, S.store[0] + ' – ' + S.store[1]);
              return;
            }
            if (!r.free) S.turn = 1 - S.turn;
            C.update(() => {});
            maybeCpu(C);
          };
        }
      });
    }
  },
  cpu(C: any) {
    const S = C.S, g = this;

    function cloneMancala(s: any) {
      return {
        pits: [s.pits[0].slice(), s.pits[1].slice()],
        store: [s.store[0], s.store[1]],
        turn: s.turn,
        over: s.over
      };
    }

    function evaluate(s: any): number {
      const storeDiff = (s.store[1] - s.store[0]) * 12;
      const pitsDiff = (s.pits[1].reduce((a: number, b: number) => a + b, 0) - s.pits[0].reduce((a: number, b: number) => a + b, 0));
      return storeDiff + pitsDiff;
    }

    function mm(s: any, depth: number, alpha: number, beta: number, max: boolean, side: number): number {
      if (g.gameOver(s)) {
        const c = cloneMancala(s);
        g.collect(c);
        return (c.store[1] - c.store[0]) * 100;
      }
      if (depth === 0) {
        return evaluate(s);
      }

      const moves = g.moves(s, side);
      if (!moves.length) {
        return evaluate(s);
      }

      // Prioritize moves with free turns and captures for maximum alpha-beta pruning
      moves.sort((a: number, b: number) => {
        const ca = cloneMancala(s);
        const ra = g.sow(ca, side, a);
        const scoreA = (ra.free ? 25 : 0) + ra.cap * 6;

        const cb = cloneMancala(s);
        const rb = g.sow(cb, side, b);
        const scoreB = (rb.free ? 25 : 0) + rb.cap * 6;

        return scoreB - scoreA;
      });

      if (max) {
        let best = -1e9;
        for (const m of moves) {
          const c = cloneMancala(s);
          const r = g.sow(c, side, m);
          let v: number;
          if (g.gameOver(c)) {
            g.collect(c);
            v = (c.store[1] - c.store[0]) * 100;
          } else if (r.free) {
            v = mm(c, depth - 1, alpha, beta, true, side) + 14;
          } else {
            v = mm(c, depth - 1, alpha, beta, false, 1 - side);
          }
          best = Math.max(best, v);
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
        return best;
      } else {
        let best = 1e9;
        for (const m of moves) {
          const c = cloneMancala(s);
          const r = g.sow(c, side, m);
          let v: number;
          if (g.gameOver(c)) {
            g.collect(c);
            v = (c.store[1] - c.store[0]) * 100;
          } else if (r.free) {
            v = mm(c, depth - 1, alpha, beta, false, side) - 14;
          } else {
            v = mm(c, depth - 1, alpha, beta, true, 1 - side);
          }
          best = Math.min(best, v);
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
        return best;
      }
    }

    const availableMoves = g.moves(S, 1);
    if (!availableMoves.length) {
      if (g.gameOver(S)) {
        g.collect(S);
        S.over = true;
        C.update(() => {});
        const w = S.store[0] === S.store[1] ? -1 : (S.store[0] > S.store[1] ? 0 : 1);
        C.finish(w, S.store[0] + ' – ' + S.store[1]);
      } else {
        S.turn = 0;
        C.update(() => {});
      }
      return;
    }

    let bm = availableMoves[0], bv = -1e9;
    let alpha = -1e9;
    const beta = 1e9;

    for (const m of availableMoves) {
      const c = cloneMancala(S);
      const r = g.sow(c, 1, m);
      let v: number;
      if (g.gameOver(c)) {
        g.collect(c);
        v = (c.store[1] - c.store[0]) * 100;
      } else if (r.free) {
        v = mm(c, 4, alpha, beta, true, 1) + 14;
      } else {
        v = mm(c, 4, alpha, beta, false, 0);
      }
      if (v > bv) {
        bv = v;
        bm = m;
      }
      alpha = Math.max(alpha, bv);
    }

    if (bm < 0) return;
    const r = g.sow(S, 1, bm);
    Sound.bean();
    if (r.cap > 0) {
      toast('🤖 Computer captured ' + r.cap + ' beans!');
    } else if (r.free) {
      toast('🤖 Computer gets a free turn!');
    }
    if (g.gameOver(S)) {
      g.collect(S);
      S.over = true;
      C.update(() => {});
      const w = S.store[0] === S.store[1] ? -1 : (S.store[0] > S.store[1] ? 0 : 1);
      C.finish(w, S.store[0] + ' – ' + S.store[1]);
      return;
    }
    if (!r.free) {
      S.turn = 0;
      C.update(() => {});
    } else {
      // Re-render and trigger computer's extra free turn
      C.update(() => {});
      maybeCpu(C);
    }
  }
});

/* ================= WATER WARS ================= */
stdInit('battleship', {
  name: 'Water Wars',
  icon: '🌊',
  desc: 'Sink the enemy fleet',
  p: [2, 2],
  payout: PAYOUTS.battleship,
  rules: 'Ships are placed for you — tap Shuffle for a new layout, then Start. Tap enemy waters to fire. 🔥 = hit, ～ = miss. Sink all 4 warships to win. (8×8 board, ships of 4-3-3-2.)',
  SHIPS: [4, 3, 3, 2],
  N: 8,
  newState() { return { turn: 0, phase: 'place', shots: [[], []], sunk: [0, 0], over: false, msg: '' }; },
  randShips() {
    const N = this.N, ships: any[] = [];
    const grid = Array.from({ length: N }, () => Array(N).fill(0));
    for (const len of this.SHIPS) {
      let placed = false, tries = 0;
      while (!placed && tries++ < 200) {
        const horiz = Math.random() < .5, x = ri(0, N - (horiz ? len : 1)), y = ri(0, N - (horiz ? 1 : len));
        let ok = true;
        for (let i = 0; i < len; i++) {
          const cx = x + (horiz ? i : 0), cy = y + (horiz ? 0 : i);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && ny >= 0 && nx < N && ny < N && grid[ny][nx]) ok = false;
            }
          }
          if (grid[cy][cx]) ok = false;
        }
        if (ok) {
          const cells = [];
          for (let i = 0; i < len; i++) {
            const cx = x + (horiz ? i : 0), cy = y + (horiz ? 0 : i);
            grid[cy][cx] = 1;
            cells.push([cx, cy]);
          }
          ships.push({ cells, hits: 0 });
          placed = true;
        }
      }
    }
    return ships;
  },
  shotAt(shots: any[], x: number, y: number) { return shots.find(s => s.x === x && s.y === y); },
  resolve(ships: any[], x: number, y: number) {
    for (const sh of ships) {
      const idx = sh.cells.findIndex((c: number[]) => c[0] === x && c[1] === y);
      if (idx >= 0) {
        sh.hits++;
        return { hit: true, sunk: sh.hits >= sh.cells.length, all: ships.every(s => s.hits >= s.cells.length) };
      }
    }
    return { hit: false, sunk: false, all: false };
  },
  initPriv(C: any) {
    if (C.isNet) { C.priv = this.randShips(); }
    else { C.priv = [this.randShips(), this.randShips()]; }
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    if (C._cover) return;
    if (!C.priv) this.initPriv(C);
    if (S.phase === 'place') {
      let h = turnBanner(C) + '<h2>🌊 Water Wars</h2><div class="card"><h3>' + esc(C.seatName(C.isNet ? Net.mySeat() : 0)) + ' — your fleet</h3><div class="board" style="grid-template-columns:repeat(8,1fr);max-width:380px">';
      const me = C.isNet ? C.priv : (C.priv[0]);
      const occ: Record<string, number> = {};
      me.forEach((sh: any) => sh.cells.forEach((c: number[]) => occ[c[0] + ',' + c[1]] = 1));
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          h += '<div class="cell" style="background:' + (occ[x + ',' + y] ? '#2c4a6b' : '#123') + '">' + (occ[x + ',' + y] ? '🚢' : '🌊') + '</div>';
        }
      }
      h += '</div><div class="row"><button class="btn secondary grow" id="shufBtn">🔀 Shuffle</button><button class="btn grow" id="startBtn">⚓ Start battle</button></div></div>';
      if (C.isNet) h += '<div class="muted">Waiting for opponent to place… the battle starts when both are ready. (Host: tap Start when ready.)</div>';
      R.innerHTML = h;
      $('#shufBtn').onclick = () => { this.initPriv(C); C.rerender(); };
      $('#startBtn').onclick = () => {
        C.update((s: any) => {
          s.phase = 'battle';
          if (C.isNet) {
            s['ready' + Net.mySeat()] = true;
            if (!(s.ready0 && s.ready1)) s.phase = 'place';
          }
        });
      };
      return;
    }
    const me = C.isNet ? Net.mySeat() : C.cur();
    if (C.mode === 'hotseat' && C._needPass !== false && !C._passDone) {
      passCover(C, C.cur());
      C._passDone = true;
      return;
    }
    const enemy = 1 - me;
    const myShots = S.shots[me] || [];
    let h = turnBanner(C) + '<h2>🌊 Water Wars</h2>';
    h += '<div class="card"><h3>🎯 Enemy waters — ' + esc(C.seatName(enemy)) + '</h3><div class="board" style="grid-template-columns:repeat(8,1fr);max-width:380px">';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const s = g.shotAt(myShots, x, y);
        h += '<div class="cell" data-x="' + x + '" data-y="' + y + '" style="background:#0e2a4a;' + (s || !C.mine() ? '' : 'cursor:pointer') + '">' + (s ? (s.hit ? '🔥' : '～') : '🌊') + '</div>';
      }
    }
    h += '</div><div class="muted">Ships sunk: ' + (S.sunk[me] || 0) + '/4</div></div>';
    const mine = C.isNet ? C.priv : C.priv[me];
    const occ: Record<string, string> = {};
    mine.forEach((sh: any) => sh.cells.forEach((c: number[]) => occ[c[0] + ',' + c[1]] = sh.hits >= sh.cells.length ? 'sunk' : 'ship'));
    const es = S.shots[enemy] || [];
    h += '<div class="card"><h3>🛡️ Your waters</h3><div class="board" style="grid-template-columns:repeat(8,1fr);max-width:380px">';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const s = g.shotAt(es, x, y);
        const o = occ[x + ',' + y];
        h += '<div class="cell" style="background:' + (s ? (s.hit ? '#5a1a1a' : '#123') : '#0e2a4a') + ';font-size:14px">' + (s ? (s.hit ? '🔥' : '～') : (o === 'ship' ? '🚢' : (o === 'sunk' ? '💀' : '🌊'))) + '</div>';
      }
    }
    h += '</div></div>';
    R.innerHTML = h;
    if (!S.over && C.mine()) {
      R.querySelectorAll('.cell[data-x]').forEach((el: any) => {
        const x = +el.dataset.x, y = +el.dataset.y;
        if (g.shotAt(myShots, x, y)) return;
        el.onclick = () => g.fire(C, x, y);
      });
    }
  },
  fire(C: any, x: number, y: number) {
    const S = C.S, g = this;
    const me = C.isNet ? Net.mySeat() : C.cur();
    const enemy = 1 - me;
    Sound.dice();
    if (C.isNet) {
      C._pendingShot = { x, y };
      Net.inboxSend({ to: enemy, type: 'shot', x, y });
      toast('Shot fired… waiting for result');
      return;
    }
    const ships = C.priv[enemy];
    const r = g.resolve(ships, x, y);
    C.update((s: any) => {
      s.shots[me].push({ x, y, hit: r.hit });
      if (r.sunk) s.sunk[me]++;
      if (r.all) { s.over = true; } else s.turn = enemy;
    });
    if (r.all) { C.finish(me, 'Fleet destroyed!'); return; }
    if (r.hit) toast('🔥 HIT!' + (r.sunk ? ' You sunk a ship!' : '') + ' Fire again!');
    else toast('～ Miss.');
    if (r.hit) { C.update((s: any) => { s.turn = me; }); }
    C._passDone = false;
    maybeCpu(C);
  },
  inbox(C: any, msg: any) {
    const g = GAMES.battleship;
    const my = C.isNet ? Net.mySeat() : -1;
    if (msg.to !== my) return;
    if (msg.type === 'shot') {
      const r = g.resolve(C.priv, msg.x, msg.y);
      C.update((s: any) => {
        s.shots[msg.from].push({ x: msg.x, y: msg.y, hit: r.hit });
        if (r.sunk) s.sunk[msg.from]++;
      });
      Net.inboxSend({ to: msg.from, type: 'shotResult', x: msg.x, y: msg.y, hit: r.hit, sunk: r.sunk, all: r.all });
      if (r.all) { C.S.over = true; Net.push({ state: C.S, status: 'over' }); }
      C.rerender();
    }
    if (msg.type === 'shotResult') {
      const me = Net.mySeat();
      C.update((s: any) => {
        if (msg.all) s.over = true;
        else s.turn = msg.hit ? me : 1 - me;
      });
      if (msg.hit) toast('🔥 HIT!' + (msg.sunk ? ' Ship sunk!' : '') + (msg.all ? '' : ' Fire again!'));
      else toast('～ Miss.');
      if (msg.all) C.finish(me, 'Fleet destroyed!');
    }
  },
  cpu(C: any) {
    const S = C.S, g = this;
    const ai = C._ai || (C._ai = { targets: [], tried: {} });
    const myShots = S.shots[1];
    const cand = ai.targets.length ? ai.targets.shift() : null;
    let x: number, y: number, tries = 0;
    if (cand && !g.shotAt(myShots, cand[0], cand[1])) {
      [x, y] = cand;
    } else {
      do {
        x = ri(0, 7);
        y = ri(0, 7);
        tries++;
      } while (g.shotAt(myShots, x, y) && tries < 200);
    }
    ai.tried[x + ',' + y] = 1;
    const r = g.resolve(C.priv[0], x, y);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
      const nx = x + d[0], ny = y + d[1];
      if (nx >= 0 && ny >= 0 && nx < 8 && ny < 8 && !ai.tried[nx + ',' + ny] && !g.shotAt(myShots, nx, ny)) ai.targets.push([nx, ny]);
    });
    if (r.sunk) ai.targets = [];
    C.update((s: any) => {
      s.shots[1].push({ x, y, hit: r.hit });
      if (r.sunk) s.sunk[1]++;
      if (!r.all && !r.hit) s.turn = 0;
      else if (r.all) s.over = true;
    });
    if (r.all) { C.finish(1, 'Your fleet was destroyed!'); return; }
    if (r.hit && !r.all) {
      toast('🤖 Computer hits one of your ships!');
      cpuDelay(() => this.cpu(C), 900);
    }
  }
});

/* ================= UPS AND DOWNS (CHUTES & LADDERS) ================= */
stdInit('chutes', {
  name: 'Ups and Downs',
  icon: '🪜',
  desc: 'Climb up, slide down to 100',
  p: [2, 4],
  payout: PAYOUTS.chutes,
  rules: 'Spin the 1–6 arrow spinner to move your standee pawn along the 100-square track. Land at the foot of a ladder to climb straight up to the top! Land at the top of a chute to slide down to the bottom. Must land on Square 100 by exact count to win!',
  LADDERS: { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 } as Record<number, number>,
  CHUTES: { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 } as Record<number, number>,
  DEEDS: {
    1: { icon: '🌻', title: 'Plant flowers ➔ Prize garden' },
    38: { icon: '💐', title: 'Prize garden' },
    4: { icon: '🥣', title: 'Feed baby ➔ Play drums' },
    14: { icon: '🥁', title: 'Play drums' },
    9: { icon: '🚜', title: 'Mow lawn ➔ Circus trip' },
    31: { icon: '🎪', title: 'Circus trip!' },
    21: { icon: '🐕', title: 'Rescue pet ➔ Happy pet' },
    42: { icon: '💖', title: 'Happy pet' },
    28: { icon: '🧹', title: "Chores ➔ Mom's hug" },
    84: { icon: '🤗', title: "Mom's hug" },
    36: { icon: '🥗', title: 'Eat veggies ➔ Big & strong' },
    44: { icon: '💪', title: 'Big & strong' },
    51: { icon: '🧼', title: 'Wash dishes ➔ Fresh pie' },
    67: { icon: '🥧', title: 'Fresh pie' },
    71: { icon: '☔', title: 'Share umbrella ➔ Fun party' },
    91: { icon: '🥳', title: 'Fun party' },
    80: { icon: '🐕', title: 'Bath dog ➔ WINNER 100' },
    16: { icon: '🍫', title: 'Candy overload ➔ Sick in chair' },
    6: { icon: '🪑', title: 'Sick in chair' },
    47: { icon: '⛸️', title: 'Thin ice ➔ Fall in water' },
    26: { icon: '🧊', title: 'Fall in water' },
    49: { icon: '📚', title: 'Late comics ➔ Late for school' },
    11: { icon: '🥱', title: 'Late for school' },
    56: { icon: '🌧️', title: 'Mud puddle ➔ Catch a cold' },
    53: { icon: '🛏️', title: 'Catch a cold' },
    62: { icon: '🍽️', title: 'Dish tower ➔ Broken plates' },
    19: { icon: '💥', title: 'Broken plates' },
    64: { icon: '🚲', title: 'No-hands bike ➔ Scraped knee' },
    60: { icon: '🩹', title: 'Scraped knee' },
    87: { icon: '🐠', title: 'Pull fishbowl ➔ Broken bowl' },
    24: { icon: '💧', title: 'Broken bowl' },
    93: { icon: '🖍️', title: 'Wall scribbles ➔ Scrub walls' },
    73: { icon: '🧽', title: 'Scrub walls' },
    95: { icon: '⚾', title: 'Indoor baseball ➔ Break bank' },
    75: { icon: '🐖', title: 'Broken piggy bank' },
    98: { icon: '😾', title: 'Pull cat tail ➔ Scratched hand' },
    78: { icon: '🤕', title: 'Scratched hand' }
  } as Record<number, { icon: string; title: string }>,
  PAWNS: [
    { cls: 'pawn-red', char: '👧', name: 'Ruby Red', bg: '#ef4444' },
    { cls: 'pawn-blue', char: '👧', name: 'Sapphire Blue', bg: '#3b82f6' },
    { cls: 'pawn-yellow', char: '👦', name: 'Golden Yellow', bg: '#eab308' },
    { cls: 'pawn-green', char: '👦', name: 'Emerald Green', bg: '#22c55e' }
  ],
  newState(C: any) {
    return {
      turn: 0,
      pos: C.names.map(() => 0),
      over: false,
      last: 0,
      needleRot: 30,
      spinning: false,
      log: 'Spin the arrow to begin!'
    };
  },
  getCenter(sq: number): { x: number; y: number } {
    const row = Math.floor((sq - 1) / 10);
    const colInRow = (sq - 1) % 10;
    const col = (row % 2 === 0) ? colInRow : (9 - colInRow);
    const x = col * 100 + 50;
    const y = (9 - row) * 100 + 50;
    return { x, y };
  },
  renderLadderSvg(baseSq: number, topSq: number): string {
    const p1 = this.getCenter(baseSq);
    const p2 = this.getCenter(topSq);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const halfW = 13;

    const r1x1 = p1.x - px * halfW, r1y1 = p1.y - py * halfW;
    const r1x2 = p2.x - px * halfW, r1y2 = p2.y - py * halfW;
    const r2x1 = p1.x + px * halfW, r2y1 = p1.y + py * halfW;
    const r2x2 = p2.x + px * halfW, r2y2 = p2.y + py * halfW;

    const numRungs = Math.max(3, Math.floor(len / 26));
    let rungs = '';
    for (let i = 1; i < numRungs; i++) {
      const t = i / numRungs;
      const rx1 = r1x1 + (r1x2 - r1x1) * t;
      const ry1 = r1y1 + (r1y2 - r1y1) * t;
      const rx2 = r2x1 + (r2x2 - r2x1) * t;
      const ry2 = r2y1 + (r2y2 - r2y1) * t;
      rungs += `<line x1="${rx1.toFixed(1)}" y1="${ry1.toFixed(1)}" x2="${rx2.toFixed(1)}" y2="${ry2.toFixed(1)}" stroke="#b45309" stroke-width="5" stroke-linecap="round" />
                <line x1="${rx1.toFixed(1)}" y1="${ry1.toFixed(1)}" x2="${rx2.toFixed(1)}" y2="${ry2.toFixed(1)}" stroke="#fde047" stroke-width="2.8" stroke-linecap="round" />`;
    }

    return `
      <g class="svg-ladder" filter="url(#ladderGlow)">
        <!-- Rail shadows -->
        <line x1="${(r1x1 + 2).toFixed(1)}" y1="${(r1y1 + 4).toFixed(1)}" x2="${(r1x2 + 2).toFixed(1)}" y2="${(r1y2 + 4).toFixed(1)}" stroke="rgba(0,0,0,0.4)" stroke-width="6.5" stroke-linecap="round" />
        <line x1="${(r2x1 + 2).toFixed(1)}" y1="${(r2y1 + 4).toFixed(1)}" x2="${(r2x2 + 2).toFixed(1)}" y2="${(r2y2 + 4).toFixed(1)}" stroke="rgba(0,0,0,0.4)" stroke-width="6.5" stroke-linecap="round" />
        <!-- Rail wood body -->
        <line x1="${r1x1.toFixed(1)}" y1="${r1y1.toFixed(1)}" x2="${r1x2.toFixed(1)}" y2="${r1y2.toFixed(1)}" stroke="#78350f" stroke-width="7" stroke-linecap="round" />
        <line x1="${r1x1.toFixed(1)}" y1="${r1y1.toFixed(1)}" x2="${r1x2.toFixed(1)}" y2="${r1y2.toFixed(1)}" stroke="#facc15" stroke-width="4" stroke-linecap="round" />
        <line x1="${r2x1.toFixed(1)}" y1="${r2y1.toFixed(1)}" x2="${r2x2.toFixed(1)}" y2="${r2y2.toFixed(1)}" stroke="#78350f" stroke-width="7" stroke-linecap="round" />
        <line x1="${r2x1.toFixed(1)}" y1="${r2y1.toFixed(1)}" x2="${r2x2.toFixed(1)}" y2="${r2y2.toFixed(1)}" stroke="#facc15" stroke-width="4" stroke-linecap="round" />
        ${rungs}
      </g>
    `;
  },
  renderChuteSvg(topSq: number, bottomSq: number): string {
    const p1 = this.getCenter(topSq);
    const p2 = this.getCenter(bottomSq);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
    if (Math.abs(dx) < 30) {
      const wave = (topSq % 2 === 0 ? 55 : -55);
      cp1x = p1.x + wave;
      cp1y = p1.y + dy * 0.35;
      cp2x = p2.x - wave;
      cp2y = p1.y + dy * 0.70;
    } else {
      const curve = (dx > 0 ? -45 : 45);
      cp1x = p1.x + curve;
      cp1y = p1.y + dy * 0.40;
      cp2x = p2.x - curve;
      cp2y = p1.y + dy * 0.75;
    }

    const d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;

    return `
      <g class="svg-chute">
        <!-- Slide Drop shadow -->
        <path d="${d}" stroke="rgba(0,0,0,0.35)" stroke-width="26" fill="none" stroke-linecap="round" transform="translate(3, 5)" />
        <!-- Slide Outer Dark Rails -->
        <path d="${d}" stroke="#991b1b" stroke-width="22" fill="none" stroke-linecap="round" />
        <!-- Slide Glossy Red Trough -->
        <path d="${d}" stroke="#ef4444" stroke-width="16" fill="none" stroke-linecap="round" />
        <!-- Specular Highlight Curve -->
        <path d="${d}" stroke="#fca5a5" stroke-width="4.5" fill="none" stroke-linecap="round" />
        <!-- Slide entry top collar -->
        <circle cx="${p1.x}" cy="${p1.y}" r="13" fill="#b91c1c" stroke="#fca5a5" stroke-width="2.5" />
        <!-- Slide exit ramp pad -->
        <circle cx="${p2.x}" cy="${p2.y}" r="11" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
      </g>
    `;
  },
  renderPawn(playerIdx: number, isActive: boolean, titleText: string): string {
    const pCfg = this.PAWNS[playerIdx % 4];
    return `
      <div class="chutes-pawn ${pCfg.cls} ${isActive ? 'active' : ''}" title="${esc(titleText)}">
        <div class="pawn-standee">${pCfg.char}</div>
        <div class="pawn-base"></div>
      </div>
    `;
  },
  renderSpinnerSvg(needleRot: number): string {
    const sectors = [
      { num: 1, color: '#ef4444', textCol: '#b91c1c', d: 'M 100 100 L 100 8 A 92 92 0 0 1 179.7 54 Z', bx: 130, by: 48 },
      { num: 2, color: '#3b82f6', textCol: '#1d4ed8', d: 'M 100 100 L 179.7 54 A 92 92 0 0 1 179.7 146 Z', bx: 160, by: 100 },
      { num: 3, color: '#eab308', textCol: '#a16207', d: 'M 100 100 L 179.7 146 A 92 92 0 0 1 100 192 Z', bx: 130, by: 152 },
      { num: 4, color: '#22c55e', textCol: '#15803d', d: 'M 100 100 L 100 192 A 92 92 0 0 1 20.3 146 Z', bx: 70, by: 152 },
      { num: 5, color: '#f97316', textCol: '#c2410c', d: 'M 100 100 L 20.3 146 A 92 92 0 0 1 20.3 54 Z', bx: 40, by: 100 },
      { num: 6, color: '#8b5cf6', textCol: '#6d28d9', d: 'M 100 100 L 20.3 54 A 92 92 0 0 1 100 8 Z', bx: 70, by: 48 }
    ];

    let wedgesHtml = '';
    for (const s of sectors) {
      wedgesHtml += `
        <!-- Color Sector ${s.num} -->
        <path d="${s.d}" fill="${s.color}" />
        <!-- Number printed directly ON its color -->
        <text x="${s.bx}" y="${s.by}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="rgba(0,0,0,0.55)" stroke-width="2.5" paint-order="stroke fill" font-size="26" font-weight="950" font-family="'Impact', 'Arial Black', system-ui, sans-serif" filter="url(#numShadow)">${s.num}</text>
      `;
    }

    return `
      <svg class="chutes-spinner-svg" viewBox="0 0 200 200" width="100%" height="100%" style="overflow:visible;">
        <defs>
          <radialGradient id="brassGrad" cx="35%" cy="30%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#eab308" />
            <stop offset="100%" stop-color="#854d0e" />
          </radialGradient>
          <filter id="numShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.6)" />
          </filter>
          <filter id="arrowShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.5)" />
          </filter>
          <filter id="pivotShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.6)" />
          </filter>
        </defs>

        <!-- Outer Beveled Golden Rim -->
        <circle cx="100" cy="100" r="97" fill="#78350f" />
        <circle cx="100" cy="100" r="95" fill="#f59e0b" />
        <circle cx="100" cy="100" r="93" fill="#b45309" />

        <!-- Wedges with their Numbers on their Colors -->
        <g id="spinnerSlices">
          ${wedgesHtml}
        </g>

        <!-- White radial divider spokes -->
        <line x1="100" y1="100" x2="100" y2="8" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
        <line x1="100" y1="100" x2="179.7" y2="54" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
        <line x1="100" y1="100" x2="179.7" y2="146" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
        <line x1="100" y1="100" x2="100" y2="192" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
        <line x1="100" y1="100" x2="20.3" y2="146" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
        <line x1="100" y1="100" x2="20.3" y2="54" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />

        <!-- 3D Rotating Arrow Needle pointing directly at numbers -->
        <g id="spinArrow" style="transform-origin: 100px 100px; transform: rotate(${needleRot}deg); transition: transform 0.85s cubic-bezier(0.15, 0.85, 0.35, 1.05);">
          <!-- Arrow Head & Body -->
          <path d="M 100 14 L 110 44 L 104 44 L 104 116 L 96 116 L 96 44 L 90 44 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1.5" filter="url(#arrowShadow)" />
          <line x1="100" y1="18" x2="100" y2="114" stroke="#fca5a5" stroke-width="2" stroke-linecap="round" />
          <!-- Center Brass Pivot -->
          <circle cx="100" cy="100" r="14" fill="url(#brassGrad)" stroke="#ffffff" stroke-width="2" filter="url(#pivotShadow)" />
          <circle cx="100" cy="100" r="5" fill="#78350f" />
        </g>
      </svg>
    `;
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;

    // Build 10x10 grid cells
    let gridHtml = '';
    for (let r = 9; r >= 0; r--) {
      for (let c = 0; c < 10; c++) {
        const sqNum = (r % 2 === 1) ? (r * 10 + 10 - c) : (r * 10 + c + 1);
        const isCream = (r + c) % 2 === 0;
        const isLadderBase = !!g.LADDERS[sqNum];
        const isChuteTop = !!g.CHUTES[sqNum];
        const deed = g.DEEDS[sqNum];

        // Find pawns currently on this square
        let pawnsHere = '';
        S.pos.forEach((pPos: number, pIdx: number) => {
          if (pPos === sqNum) {
            pawnsHere += g.renderPawn(pIdx, S.turn === pIdx && !S.over, `${C.seatName(pIdx)}: Square ${sqNum}`);
          }
        });

        if (sqNum === 100) {
          gridHtml += `
            <div class="chutes-sq ${isCream ? 'cream' : 'white'}" data-sq="100">
              <div class="winner-rosette">
                <div class="rosette-ribbon">WINNER</div>
                <div class="rosette-num">100</div>
              </div>
              <div class="chutes-sq-pawns">${pawnsHere}</div>
            </div>
          `;
        } else {
          gridHtml += `
            <div class="chutes-sq ${isCream ? 'cream' : 'white'} ${isLadderBase ? 'ladder-base-sq' : ''} ${isChuteTop ? 'chute-top-sq' : ''}" data-sq="${sqNum}" title="Square ${sqNum}${deed ? ': ' + esc(deed.title) : ''}">
              <div class="chutes-sq-header">
                <span class="chutes-sq-num">${sqNum}</span>
                ${deed ? `<span class="chutes-sq-deed-icon" title="${esc(deed.title)}">${deed.icon}</span>` : ''}
              </div>
              <div class="chutes-sq-pawns">${pawnsHere}</div>
            </div>
          `;
        }
      }
    }

    // Build SVG layer for 9 Ladders and 10 Chutes
    let svgContent = `
      <defs>
        <filter id="ladderGlow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.45)" />
        </filter>
      </defs>
    `;
    // Add all 10 chutes
    for (const topSq in g.CHUTES) {
      svgContent += g.renderChuteSvg(+topSq, g.CHUTES[+topSq]);
    }
    // Add all 9 ladders
    for (const baseSq in g.LADDERS) {
      svgContent += g.renderLadderSvg(+baseSq, g.LADDERS[+baseSq]);
    }

    // Start Bench Pawns (pos === 0)
    let startPawns = '';
    S.pos.forEach((pPos: number, pIdx: number) => {
      if (pPos === 0) {
        startPawns += g.renderPawn(pIdx, S.turn === pIdx && !S.over, `${C.seatName(pIdx)}: At Start (Square 0)`);
      }
    });

    // Players bar
    let playersBar = '<div class="chutes-players-bar">';
    C.names.forEach((name: string, pIdx: number) => {
      const pCfg = g.PAWNS[pIdx % 4];
      const isActive = S.turn === pIdx && !S.over;
      const curSq = S.pos[pIdx];
      playersBar += `
        <div class="chutes-player-card ${isActive ? 'active' : ''}">
          <span>${pCfg.char}</span>
          <b style="color:${pCfg.bg}">${esc(name)}</b>
          <span class="player-sq-badge">${curSq === 0 ? 'START' : 'Sq ' + curSq}</span>
        </div>
      `;
    });
    playersBar += '</div>';

    // Spinner action
    const canSpin = C.mine() && !S.over && !S.spinning;
    const activeName = C.seatName(S.turn);

    let h = turnBanner(C) + '<h2>🪜 Ups and Downs</h2>'
      + '<div class="chutes-table">'
      +   playersBar
      + '  <div class="chutes-board-frame">'
      + '    <div class="chutes-grid">' + gridHtml + '</div>'
      + '    <svg class="chutes-svg-layer" viewBox="0 0 1000 1000" preserveAspectRatio="none">' + svgContent + '</svg>'
      + '  </div>'
      + '  <div class="chutes-start-bar">'
      + '    <span class="chutes-start-label">🏁 <b>START</b> (Square 0)</span>'
      + '    <div class="chutes-start-pawns">' + (startPawns || '<span class="muted" style="font-size:11px;">All players on the board</span>') + '</div>'
      + '  </div>'
      + '  <div class="chutes-spinner-card">'
      + '    <div class="chutes-spinner-row">'
      + '      <div class="chutes-spinner-dial" id="spinDial" title="Tap to spin!">'
      +          g.renderSpinnerSvg(S.needleRot || 30)
      + '      </div>'
      + '      <div class="chutes-action-panel">'
      + '        <button class="chutes-spin-btn" id="spinBtn" ' + (canSpin ? '' : 'disabled') + '>'
      +            (S.spinning ? '🎡 Spinning…' : ('🎡 SPIN (' + esc(activeName) + ')'))
      + '        </button>'
      + '        <div class="chutes-last-spin-badge">' + esc(S.log || 'Spin to race to 100!') + '</div>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    R.innerHTML = h;

    // Attach Spinner trigger
    const triggerSpin = () => {
      if (!canSpin || S.spinning || S.over) return;
      g.spin(C);
    };

    const sBtn = $('#spinBtn');
    if (sBtn) sBtn.onclick = triggerSpin;
    const sDial = $('#spinDial');
    if (sDial && canSpin) sDial.onclick = triggerSpin;
  },
  spin(C: any) {
    const S = C.S, g = this;
    if (S.spinning || S.over) return;
    S.spinning = true;

    const d = ri(1, 6);
    Sound.spin();
    S.last = d;

    // Sector angles: 1 -> 30deg, 2 -> 90deg, 3 -> 150deg, 4 -> 210deg, 5 -> 270deg, 6 -> 330deg
    const targetAngle = (d - 1) * 60 + 30;
    const currentRot = S.needleRot || 30;
    const baseRot = currentRot - (currentRot % 360);
    S.needleRot = baseRot + 1440 + targetAngle;

    const arrowEl = $('#spinArrow');
    if (arrowEl) arrowEl.style.transform = `rotate(${S.needleRot}deg)`;

    const sBtn = $('#spinBtn') as HTMLButtonElement;
    if (sBtn) {
      sBtn.disabled = true;
      sBtn.innerHTML = '🎡 Spinning…';
    }

    setTimeout(() => {
      S.spinning = false;
      const curPlayer = S.turn;
      const pName = C.seatName(curPlayer);
      const startPos = S.pos[curPlayer];
      const nextPos = startPos + d;

      if (nextPos <= 100) {
        S.pos[curPlayer] = nextPos;
        if (g.LADDERS[nextPos]) {
          Sound.ladder();
          const topPos = g.LADDERS[nextPos];
          S.pos[curPlayer] = topPos;
          const deed = g.DEEDS[nextPos];
          S.log = `${pName} spun ${d}! Climbed ladder 🪜 to ${topPos}!`;
          toast(`🪜 Climbed ladder from ${nextPos} to ${topPos}! (${deed ? deed.title : ''})`);
        } else if (g.CHUTES[nextPos]) {
          Sound.chute();
          const bottomPos = g.CHUTES[nextPos];
          S.pos[curPlayer] = bottomPos;
          const deed = g.DEEDS[nextPos];
          S.log = `${pName} spun ${d}! Slid down chute 🛝 to ${bottomPos}!`;
          toast(`🛝 Slid down chute from ${nextPos} to ${bottomPos}! (${deed ? deed.title : ''})`);
        } else {
          Sound.click();
          S.log = `${pName} spun ${d} and moved to square ${nextPos}.`;
        }
      } else {
        // Official rule: Must reach square 100 by exact count
        S.log = `${pName} spun ${d} (needed ${100 - startPos}) — stayed at ${startPos}.`;
        toast(`Must reach 100 by exact spin! Stayed on square ${startPos}.`);
      }

      if (S.pos[curPlayer] === 100) {
        S.over = true;
        C.update(() => {});
        C.finish(curPlayer, `${esc(pName)} reached Square 100! 🏆 WINNER!`);
        return;
      }

      S.turn = (S.turn + 1) % C.names.length;
      C.update(() => {});
      maybeCpu(C);
    }, 900);
  },
  cpu(C: any) {
    const g = this;
    if (!C.S.spinning && !C.S.over) {
      g.spin(C);
    }
  }
});

/* ================= SUGAR TRAIL ================= */
const CANDYLAND_COLORS = [
  { id: 'red', name: 'RED', hex: '#e74c3c' },
  { id: 'purple', name: 'PURPLE', hex: '#9b59b6' },
  { id: 'yellow', name: 'YELLOW', hex: '#f1c40f' },
  { id: 'blue', name: 'BLUE', hex: '#3498db' },
  { id: 'orange', name: 'ORANGE', hex: '#e67e22' },
  { id: 'green', name: 'GREEN', hex: '#2ecc71' }
];

const CANDYLAND_LANDMARKS = [
  { id: 'tree', name: 'Gingerbread Tree', icon: '🍪', sq: 10, hex: '#e67e22', desc: 'Sweet gingerbread canopy' },
  { id: 'mint', name: 'Peppermint Forest', icon: '🍬', sq: 18, hex: '#e74c3c', desc: 'Striped candy cane grove' },
  { id: 'peanut', name: 'Peanut Brittle', icon: '🥜', sq: 26, hex: '#f1c40f', desc: 'Crunchy sweet brittle hill' },
  { id: 'lolly', name: 'Lollipop Woods', icon: '🍭', sq: 37, hex: '#9b59b6', desc: 'Rainbow spiral lollipops' },
  { id: 'frost', name: 'Ice Cream Slopes', icon: '🍦', sq: 45, hex: '#3498db', desc: 'Frosty sugar snowdrift peaks' },
  { id: 'molasses', name: 'Molasses Swamp', icon: '🍮', sq: 58, hex: '#e67e22', desc: 'Warm gooey sweet syrup pool' }
];

stdInit('candyland', {
  name: 'Sugar Trail',
  icon: '🍬',
  desc: 'Sweet rainbow color race',
  p: [2, 4],
  payout: PAYOUTS.candyland,
  rules: 'Sugar Trail rules: All gingerbread pawns start at the START line. Draw single or double color cards to advance to matching color spaces ahead! Special cards fly you directly to sweet landmarks. Take shortcuts across Rainbow Trail and Gumdrop Pass. First player to reach Candy Castle wins!',
  COLORS: CANDYLAND_COLORS,
  LANDMARKS: CANDYLAND_LANDMARKS,
  PLAYER_PIECES: [
    { name: 'Red Pawn', color: '#ef4444', border: '#b91c1c' },
    { name: 'Blue Pawn', color: '#3b82f6', border: '#1d4ed8' },
    { name: 'Yellow Pawn', color: '#eab308', border: '#a16207' },
    { name: 'Green Pawn', color: '#22c55e', border: '#15803d' }
  ],
  buildTrack() {
    // ONE continuous path of 66 squares (11 full cycles of the 6 colors) in a winding snake layout
    // 6 rows of 11 columns: every square touches the next one with no gaps or breaks anywhere
    const track: any[] = [];
    const cols = 11, rows = 6;
    const minX = 3.5, widthTotal = 93;
    const minY = 20, heightTotal = 75;
    const colW = widthTotal / cols;
    const rowH = heightTotal / rows;

    for (let rIdx = 0; rIdx < rows; rIdx++) {
      const rowGridY = rows - 1 - rIdx; // Bottom row (rIdx = 0) is at bottom
      const isLeftToRight = (rIdx % 2 === 0);
      for (let c = 0; c < cols; c++) {
        const colGridX = isLeftToRight ? c : (cols - 1 - c);
        const sq = track.length;
        const color = CANDYLAND_COLORS[sq % 6];
        const landmark = CANDYLAND_LANDMARKS.find(l => l.sq === sq);
        track.push({
          sq,
          num: sq + 1,
          col: colGridX,
          row: rowGridY,
          x: Math.round((minX + colGridX * colW) * 100) / 100,
          y: Math.round((minY + rowGridY * rowH) * 100) / 100,
          w: Math.round(colW * 100) / 100,
          h: Math.round(rowH * 100) / 100,
          color: color.id,
          colorName: color.name,
          hex: color.hex,
          landmark: landmark ? landmark.name : null,
          landmarkIcon: landmark ? landmark.icon : null,
          isStart: sq === 0,
          isEnd: sq === 65,
          isShortcutStart: sq === 3 || sq === 15,
          shortcutTarget: sq === 3 ? 27 : (sq === 15 ? 33 : null),
          shortcutName: sq === 3 ? 'Rainbow Trail' : (sq === 15 ? 'Gumdrop Pass' : null)
        });
      }
    }
    return track;
  },
  buildDeck() {
    const deck: any[] = [];
    // 36 single color cards (6 of each color)
    CANDYLAND_COLORS.forEach(c => {
      for (let i = 0; i < 6; i++) {
        deck.push({
          type: 'single',
          color: c.id,
          colorName: c.name,
          hex: c.hex,
          d: 1,
          desc: `Advance to next ${c.name} space`
        });
      }
    });
    // 12 double color cards (2 of each color)
    CANDYLAND_COLORS.forEach(c => {
      for (let i = 0; i < 2; i++) {
        deck.push({
          type: 'double',
          color: c.id,
          colorName: c.name,
          hex: c.hex,
          d: 2,
          desc: `Advance to 2nd ${c.name} space ahead`
        });
      }
    });
    // 6 Sweet Landmark cards
    CANDYLAND_LANDMARKS.forEach(l => {
      deck.push({
        type: 'landmark',
        name: l.name,
        icon: l.icon,
        targetSq: l.sq,
        hex: l.hex,
        desc: `Fly straight to ${l.name}!`
      });
    });
    shuffle(deck);
    return deck;
  },
  newState(C: any) {
    return {
      turn: 0,
      pos: C.names.map(() => 0), // All players start at Square 0 (Square 1 / START line)
      track: this.buildTrack(),
      deck: this.buildDeck(),
      over: false,
      last: null as any,
      drawing: false,
      animating: false,
      targetSq: null as number | null,
      shortcutActive: false,
      log: '🏁 All gingerbread pawns start at the START line! Draw a card to begin the race to Candy Castle!'
    };
  },
  renderTokenSvg(playerIdx: number, isActive: boolean): string {
    const p = this.PLAYER_PIECES[playerIdx % 4];
    return `
      <svg class="candyland-pawn-svg ${isActive ? 'active' : ''}" viewBox="0 0 32 36" style="width:100%; height:100%; display:block;">
        <defs>
          <radialGradient id="clPawnGrad_${playerIdx}" cx="35%" cy="30%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="60%" stop-color="#b45309" />
            <stop offset="100%" stop-color="#78350f" />
          </radialGradient>
          <filter id="clPawnShadow_${playerIdx}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" flood-color="rgba(0,0,0,0.6)" />
          </filter>
        </defs>
        <g filter="url(#clPawnShadow_${playerIdx})">
          <!-- Head -->
          <circle cx="16" cy="8.5" r="7" fill="url(#clPawnGrad_${playerIdx})" stroke="#78350f" stroke-width="1.2" />
          <!-- Body -->
          <path d="M 10 15 C 10 15, 8 22, 7 28 C 7 28, 10 29, 16 29 C 22 29, 25 28, 25 28 C 24 22, 22 15, 22 15 Z" fill="url(#clPawnGrad_${playerIdx})" stroke="#78350f" stroke-width="1.2" />
          <!-- Arms -->
          <circle cx="6.5" cy="19" r="2.8" fill="url(#clPawnGrad_${playerIdx})" stroke="#78350f" stroke-width="0.8" />
          <circle cx="25.5" cy="19" r="2.8" fill="url(#clPawnGrad_${playerIdx})" stroke="#78350f" stroke-width="0.8" />
          <!-- Base stand in player seat color -->
          <ellipse cx="16" cy="33" rx="9" ry="3.5" fill="${p.color}" stroke="#ffffff" stroke-width="1.2" />
        </g>
        <!-- Royal Icing details -->
        <circle cx="13.5" cy="7.5" r="1.1" fill="#ffffff" />
        <circle cx="18.5" cy="7.5" r="1.1" fill="#ffffff" />
        <path d="M 13.5 10.5 Q 16 12.5 18.5 10.5" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" />
        <!-- Bow-tie in player seat color -->
        <polygon points="13.5,15 18.5,15 16,16.8" fill="${p.color}" stroke="#ffffff" stroke-width="0.5" />
        <polygon points="13.5,18.5 18.5,18.5 16,16.8" fill="${p.color}" stroke="#ffffff" stroke-width="0.5" />
        <circle cx="16" cy="16.8" r="0.9" fill="#ffffff" />
        <!-- Buttons in player seat color -->
        <circle cx="16" cy="21.5" r="1.5" fill="${p.color}" stroke="#ffffff" stroke-width="0.5" />
        <circle cx="16" cy="25.5" r="1.5" fill="${p.color}" stroke="#ffffff" stroke-width="0.5" />
      </svg>
    `;
  },
  buildTokensHtml(playersOnSq: number[], C: any, curPlayer: number, isOver: boolean): string {
    const g = this;
    if (!playersOnSq || !playersOnSq.length) return '';
    if (playersOnSq.length === 1) {
      const pIdx = playersOnSq[0];
      return `
        <div class="candyland-token-single">
          ${g.renderTokenSvg(pIdx, curPlayer === pIdx && !isOver)}
        </div>
      `;
    }
    return `
      <div class="candyland-token-cluster cluster-${playersOnSq.length}">
        ${playersOnSq.map(pIdx => `
          <div class="candyland-token-cluster-item" title="${esc(C.seatName(pIdx))}">
            ${g.renderTokenSvg(pIdx, curPlayer === pIdx && !isOver)}
          </div>
        `).join('')}
      </div>
    `;
  },
  renderPawnsOnly(R: HTMLElement, C: any) {
    if (!R) return;
    const S = C.S, g = this;
    const sqPlayerMap: Record<number, number[]> = {};
    S.pos.forEach((pos: number, pIdx: number) => {
      if (!sqPlayerMap[pos]) sqPlayerMap[pos] = [];
      sqPlayerMap[pos].push(pIdx);
    });

    // Update tokens inside all square slots directly in the DOM
    R.querySelectorAll('.candyland-square-slot').forEach((slotEl: any) => {
      const sqIdx = parseInt(slotEl.dataset.sq);
      const playersOnSq = sqPlayerMap[sqIdx] || [];
      const tokenWrap = slotEl.querySelector('.candyland-tokens-wrap');
      if (tokenWrap) {
        tokenWrap.innerHTML = g.buildTokensHtml(playersOnSq, C, S.turn, S.over);
      }
    });

    // Update player positions in players status bar
    C.names.forEach((_: string, pIdx: number) => {
      const pCard = R.querySelector(`.candyland-player-card[data-pidx="${pIdx}"]`);
      if (pCard) {
        const curSq = S.pos[pIdx];
        const locText = curSq === 0 ? '🏁 START (Sq 1)' : (curSq >= S.track.length - 1 ? '🏰 WINNER!' : `Square ${curSq + 1}`);
        const posEl = pCard.querySelector('.candyland-player-pos');
        if (posEl) posEl.textContent = locText;
      }
    });
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    const curPlayer = S.turn;
    const activeName = C.seatName(curPlayer);
    const canDraw = C.mine() && !S.over && !S.drawing && !S.animating;

    // 1. Players Status Bar
    let playersBar = '<div class="candyland-players-bar">';
    C.names.forEach((name: string, pIdx: number) => {
      const pCfg = g.PLAYER_PIECES[pIdx % 4];
      const isActive = curPlayer === pIdx && !S.over;
      const curSq = S.pos[pIdx];
      const locText = curSq === 0 ? '🏁 START (Sq 1)' : (curSq >= S.track.length - 1 ? '🏰 WINNER!' : `Square ${curSq + 1}`);

      playersBar += `
        <div class="candyland-player-card ${isActive ? 'active' : ''}" data-pidx="${pIdx}">
          <div class="candyland-player-avatar" style="width:20px; height:24px;">${g.renderTokenSvg(pIdx, isActive)}</div>
          <div class="candyland-player-info">
            <span class="candyland-player-name" style="color:${pCfg.color}">${esc(name)}</span>
            <span class="candyland-player-pos">${locText}</span>
          </div>
        </div>
      `;
    });
    playersBar += '</div>';

    // 2. Generate square slots with centered player tokens
    const sqPlayerMap: Record<number, number[]> = {};
    S.pos.forEach((pos: number, pIdx: number) => {
      if (!sqPlayerMap[pos]) sqPlayerMap[pos] = [];
      sqPlayerMap[pos].push(pIdx);
    });

    let squaresHtml = '';
    S.track.forEach((t: any) => {
      const playersOnSq = sqPlayerMap[t.sq] || [];
      const isTarget = S.targetSq === t.sq;
      const tokensHtml = g.buildTokensHtml(playersOnSq, C, curPlayer, S.over);

      let slotDecor = '';
      if (t.isStart) {
        slotDecor = '<span class="candyland-slot-badge start" title="START line">🏁 START</span>';
      } else if (t.isEnd) {
        slotDecor = '<span class="candyland-slot-badge end" title="Candy Castle Finish!">🏰 CASTLE</span>';
      } else if (t.landmarkIcon) {
        slotDecor = `<span class="candyland-slot-icon" title="${esc(t.landmark)}">${t.landmarkIcon}</span>`;
      } else if (t.isShortcutStart) {
        slotDecor = `<span class="candyland-shortcut-dot" title="${esc(t.shortcutName)} Shortcut ➔ Sq ${t.shortcutTarget + 1}">⚡</span>`;
      }

      if (isTarget) {
        slotDecor += `<div class="candyland-target-pulse"></div><div class="candyland-target-num-badge">Sq #${t.num}</div>`;
      }

      squaresHtml += `
        <div class="candyland-square-slot ${isTarget ? 'target-glow' : ''} ${t.isStart ? 'slot-start' : ''} ${t.isEnd ? 'slot-end' : ''}"
             data-sq="${t.sq}"
             style="left:${t.x}%; top:${t.y}%; width:${t.w}%; height:${t.h}%; background:${t.hex};"
             title="Square ${t.num}: ${t.landmark ? esc(t.landmark) : esc(t.colorName)}">
          <span class="candyland-square-num">${t.num}</span>
          ${slotDecor}
          <div class="candyland-tokens-wrap">
            ${tokensHtml}
          </div>
        </div>
      `;
    });

    // 3. Drawn Card Display Area
    let cardContent = '';
    if (S.last) {
      const last = S.last;
      const targetSqNum = last.targetSqNum || (last.targetSq != null ? last.targetSq + 1 : '');
      if (last.type === 'double') {
        cardContent = `
          <div class="candyland-drawn-card double" title="Double Color Card — Matches Square #${targetSqNum}">
            <div class="candyland-card-header">
              <span class="candyland-card-badge double">DOUBLE ✕2</span>
              <span class="candyland-card-sq-num" style="background:${last.hex};">Sq #${targetSqNum}</span>
            </div>
            <div class="candyland-card-swatches">
              <div class="candyland-card-swatch" style="background:${last.hex};"></div>
              <div class="candyland-card-swatch" style="background:${last.hex};"></div>
            </div>
            <div class="candyland-card-title" style="color:${last.hex};">${esc(last.colorName)} ✕2</div>
            <div class="candyland-card-desc">Leap forward to <b>Square #${targetSqNum}</b> (2nd ${esc(last.colorName)} ahead)</div>
          </div>
        `;
      } else if (last.type === 'landmark') {
        cardContent = `
          <div class="candyland-drawn-card landmark" title="Sweet Landmark Picture Card — Matches Square #${targetSqNum}">
            <div class="candyland-card-header">
              <span class="candyland-card-badge landmark">PICTURE CARD</span>
              <span class="candyland-card-sq-num gold">Sq #${targetSqNum}</span>
            </div>
            <div class="candyland-landmark-icon">${last.icon}</div>
            <div class="candyland-card-title" style="color:${last.hex};">${esc(last.name)}</div>
            <div class="candyland-card-desc">Fly directly to <b>Square #${targetSqNum}</b> (${esc(last.name)})</div>
          </div>
        `;
      } else {
        cardContent = `
          <div class="candyland-drawn-card single" title="Single Color Card — Matches Square #${targetSqNum}">
            <div class="candyland-card-header">
              <span class="candyland-card-badge single">SINGLE COLOR</span>
              <span class="candyland-card-sq-num" style="background:${last.hex};">Sq #${targetSqNum}</span>
            </div>
            <div class="candyland-card-swatches">
              <div class="candyland-card-swatch single" style="background:${last.hex};"></div>
            </div>
            <div class="candyland-card-title" style="color:${last.hex};">${esc(last.colorName)}</div>
            <div class="candyland-card-desc">Advance to <b>Square #${targetSqNum}</b> (Very next ${esc(last.colorName)})</div>
          </div>
        `;
      }
    } else {
      cardContent = `
        <div class="candyland-drawn-card deck-back" title="Card Deck">
          <span style="font-size:32px;">🍬</span>
          <div class="candyland-card-title" style="color:#ffffff;">SUGAR TRAIL</div>
          <div class="candyland-card-desc" style="color:#f472b6;">Tap Draw Card to play</div>
        </div>
      `;
    }

    // Assemble Full Table View
    let h = turnBanner(C) + '<h2>🍬 Sugar Trail</h2>'
      + '<div class="candyland-game-table">'
      +   playersBar
      + '  <div class="candyland-board-container">'
      + '    <div class="candyland-board-aspect">'
      +        squaresHtml
      + '    </div>'
      + '  </div>'
      + '  <div class="candyland-action-area">'
      +      cardContent
      + '    <button class="candyland-draw-btn" id="drawBtn" ' + (canDraw ? '' : 'disabled') + '>'
      +        '🃏 ' + (S.animating ? 'Hopping along path…' : (S.drawing ? 'Drawing…' : ('DRAW CARD (' + esc(activeName) + ')')))
      + '    </button>'
      + '    <div class="candyland-log-badge">' + esc(S.log) + '</div>'
      + '  </div>'
      + '</div>';

    R.innerHTML = h;

    // Attach Draw Card listener
    const db = $('#drawBtn');
    if (db) {
      db.onclick = () => {
        if (!canDraw || S.drawing || S.animating || S.over) return;
        g.drawCard(C);
      };
    }
  },
  drawCard(C: any) {
    const S = C.S, g = this;
    if (S.drawing || S.animating || S.over) return;
    const curPlayer = S.turn;
    const pName = C.seatName(curPlayer);

    // 1. Draw card from deck (reshuffle discard if empty)
    if (!S.deck || !S.deck.length) {
      S.deck = g.buildDeck();
    }
    const card = S.deck.pop();
    Sound.card();

    const startPos = S.pos[curPlayer];
    let nextPos = startPos;

    // 2. Color Movement Rules:
    if (card.type === 'landmark') {
      nextPos = card.targetSq;
      card.targetSqNum = nextPos + 1;
      S.last = card;
      S.log = `⭐ LANDMARK! ${pName} drew ${card.name} (${card.icon}) — flying directly to Square ${nextPos + 1}!`;
      toast(`⭐ LANDMARK! ${card.name} (${card.icon}) ➔ Square ${nextPos + 1}`);
    } else {
      // Find matching color ahead
      let found = 0;
      for (let i = startPos + 1; i < S.track.length; i++) {
        if (S.track[i].color === card.color) {
          found++;
          if (found === card.d) {
            nextPos = i;
            break;
          }
        }
      }
      // If not enough matching spaces remain ahead, advance to Candy Castle
      if (found < card.d) {
        nextPos = S.track.length - 1;
      }

      card.targetSq = nextPos;
      card.targetSqNum = nextPos + 1;
      S.last = card;

      if (card.d === 2) {
        S.log = `🚀 DOUBLE ${card.colorName}! ${pName} leaps forward to the 2nd ${card.colorName} square ahead ➔ Square ${nextPos + 1}!`;
        toast(`🚀 DOUBLE ${card.colorName} (✕2) ➔ Square ${nextPos + 1}`);
      } else {
        S.log = `🎨 ${pName} drew ${card.colorName} — advancing to the very next ${card.colorName} square ➔ Square ${nextPos + 1}.`;
      }
    }

    S.targetSq = nextPos;
    S.drawing = true;
    S.animating = true;
    C.update(() => {});

    // 3. Step-by-step movement animation along the board color squares:
    const stepCount = Math.abs(nextPos - startPos);
    const stepDirection = nextPos >= startPos ? 1 : -1;
    let currentStep = startPos;

    if (stepCount === 0) {
      S.animating = false;
      S.drawing = false;
      S.targetSq = null;
      g.finishStep(C, curPlayer, pName);
      return;
    }

    const stepDelay = Math.min(220, Math.max(90, 750 / Math.max(1, stepCount)));
    if (C._stepTimer) clearInterval(C._stepTimer);
    const stepInterval = C._stepTimer = setInterval(() => {
      if (currentStep !== nextPos) {
        currentStep += stepDirection;
        S.pos[curPlayer] = currentStep;
        Sound.beep(420 + (currentStep % 6) * 55, 0.04, 'triangle');
        g.renderPawnsOnly($('#view'), C);
      } else {
        clearInterval(stepInterval);
        C._stepTimer = null;
        S.animating = false;
        S.drawing = false;
        S.targetSq = null;
        Sound.candy();

        // 4. Check for secret shortcuts (Square 4: Rainbow Trail, Square 16: Gumdrop Pass)
        if (nextPos === 3) {
          setTimeout(() => {
            Sound.win();
            toast('🌈 Rainbow Trail! Taking secret shortcut to Square 28!');
            S.log = `🌈 RAINBOW TRAIL! ${pName} soared across the rainbow shortcut straight to Square 28!`;
            S.pos[curPlayer] = 27;
            C.update(() => {});
            g.finishStep(C, curPlayer, pName);
          }, 450);
          return;
        } else if (nextPos === 15) {
          setTimeout(() => {
            Sound.candy();
            toast('🍬 Gumdrop Pass! Taking mountain shortcut to Square 34!');
            S.log = `🍬 GUMDROP PASS! ${pName} climbed through Gumdrop Pass straight to Square 34!`;
            S.pos[curPlayer] = 33;
            C.update(() => {});
            g.finishStep(C, curPlayer, pName);
          }, 450);
          return;
        }

        g.finishStep(C, curPlayer, pName);
      }
    }, stepDelay);
  },
  finishStep(C: any, curPlayer: number, pName: string) {
    const S = C.S;
    // 5. Check win condition (Final square: Square 66 / Candy Castle)
    if (S.pos[curPlayer] >= S.track.length - 1) {
      S.pos[curPlayer] = S.track.length - 1;
      S.over = true;
      Sound.win();
      S.log = `🏆 VICTORY! ${pName} reached the Candy Castle and won the game! 🏰`;
      C.update(() => {});
      C.finish(curPlayer, `${esc(pName)} reached the Candy Castle! 🏰 WINNER!`);
      return;
    }

    // Next player's turn
    S.turn = (S.turn + 1) % C.names.length;
    C.update(() => {});
    setTimeout(() => maybeCpu(C), 500);
  },
  cpu(C: any) {
    const g = this, S = C.S;
    if (!S.drawing && !S.animating && !S.over) {
      setTimeout(() => {
        if (!S.drawing && !S.animating && !S.over) g.drawCard(C);
      }, 700);
    }
  }
});

/* ================= GET HOME (OFFICIAL TROUBLE BOARD) ================= */
const GETHOME_COLORS = [
  { id: 'yellow', name: 'Yellow', hex: '#eab308', dark: '#a16207', light: '#fef08a' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', dark: '#1d4ed8', light: '#bfdbfe' },
  { id: 'red', name: 'Red', hex: '#ef4444', dark: '#b91c1c', light: '#fecaca' },
  { id: 'green', name: 'Green', hex: '#22c55e', dark: '#15803d', light: '#bbf7d0' }
];

// Exact coordinates from official Trouble Board SVG (400x400 viewBox)
// 28 Track Holes ordered clockwise starting from Yellow Start:
const GETHOME_TRACK_HOLES = [
  { x: 83.84, y: 57.21, isStart: true, player: 0 },
  { x: 119.25, y: 40.74 },
  { x: 156.29, y: 40.00 },
  { x: 200.00, y: 40.00 },
  { x: 243.71, y: 40.00 },
  { x: 281.61, y: 42.12 },
  { x: 316.16, y: 57.21 },
  { x: 342.79, y: 83.84, isStart: true, player: 1 },
  { x: 357.88, y: 118.39 },
  { x: 360.00, y: 156.29 },
  { x: 360.00, y: 200.00 },
  { x: 360.00, y: 243.71 },
  { x: 357.88, y: 281.61 },
  { x: 342.79, y: 316.16 },
  { x: 316.16, y: 342.79, isStart: true, player: 2 },
  { x: 281.61, y: 357.88 },
  { x: 243.71, y: 360.00 },
  { x: 200.00, y: 360.00 },
  { x: 156.29, y: 360.00 },
  { x: 118.39, y: 357.88 },
  { x: 83.84, y: 342.79 },
  { x: 57.21, y: 316.16, isStart: true, player: 3 },
  { x: 42.12, y: 281.61 },
  { x: 40.00, y: 243.71 },
  { x: 40.00, y: 200.00 },
  { x: 40.00, y: 156.29 },
  { x: 42.12, y: 118.39 },
  { x: 57.21, y: 83.84 }
];

// Home Base Holes (4 waiting slots per corner):
const GETHOME_BASE_HOLES = [
  // Yellow (0)
  [{ x: 63.03, y: 21.50 }, { x: 46.19, y: 35.78 }, { x: 30.84, y: 51.65 }, { x: 17.11, y: 68.94 }],
  // Blue (1)
  [{ x: 336.97, y: 21.50 }, { x: 353.81, y: 35.78 }, { x: 369.16, y: 51.65 }, { x: 382.89, y: 68.94 }],
  // Red (2)
  [{ x: 382.89, y: 331.06 }, { x: 369.16, y: 348.35 }, { x: 353.81, y: 364.22 }, { x: 336.97, y: 378.50 }],
  // Green (3)
  [{ x: 17.11, y: 331.06 }, { x: 30.84, y: 348.35 }, { x: 46.19, y: 364.22 }, { x: 63.03, y: 378.50 }]
];

// Home Column Holes (4 spaces per color leading inward to Pop-O-Matic):
const GETHOME_HOME_HOLES = [
  // Yellow (0)
  [{ x: 93.93, y: 93.93 }, { x: 115.15, y: 115.15 }, { x: 136.36, y: 136.36 }, { x: 157.57, y: 157.57 }],
  // Blue (1)
  [{ x: 306.07, y: 93.93 }, { x: 284.85, y: 115.15 }, { x: 263.64, y: 136.36 }, { x: 242.43, y: 157.57 }],
  // Red (2)
  [{ x: 306.07, y: 306.07 }, { x: 284.85, y: 284.85 }, { x: 263.64, y: 263.64 }, { x: 242.43, y: 242.43 }],
  // Green (3)
  [{ x: 93.93, y: 306.07 }, { x: 115.15, y: 284.85 }, { x: 136.36, y: 263.64 }, { x: 157.57, y: 242.43 }]
];

stdInit('trouble', {
  name: 'Get Home',
  icon: '🎲',
  desc: 'Official Pop-O-Matic Race',
  p: [2, 4],
  payout: PAYOUTS.trouble,
  rules: 'Pop the die — roll 6 to leave home and earn a bonus pop! Race around the 28-space track. Land on a rival to bump them back to start! Move all 4 peg pawns into your Home column to win!',
  COLORS: GETHOME_COLORS,
  TRACK_HOLES: GETHOME_TRACK_HOLES,
  BASE_HOLES: GETHOME_BASE_HOLES,
  HOME_HOLES: GETHOME_HOME_HOLES,
  playerColor(pi: number, totalPlayers: number): number {
    // 2-player games use opposite corners (Yellow 0 and Red 2, classic Trouble layout!)
    if (totalPlayers === 2) return pi === 0 ? 0 : 2;
    return pi % 4;
  },
  startSq(colorIdx: number): number {
    return (colorIdx * 7) % 28;
  },
  newState(C: any) {
    return {
      turn: 0,
      pawns: C.names.map(() => [-1, -1, -1, -1]), // -1 = base, 0..27 = track, 28..31 = home
      rolled: false,
      last: 0,
      popping: false,
      bonusPop: false,
      mustPass: false,
      sel: -1,
      over: false,
      log: '🎲 Tap the Pop-O-Matic or button to pop the die!'
    };
  },
  canMovePawn(pawns: number[][], pi: number, k: number, roll: number, totalPlayers: number): boolean {
    const p = pawns[pi][k];
    const colorIdx = this.playerColor(pi, totalPlayers);
    if (p >= 31) return false; // Already at end of Home column
    if (p === -1) {
      if (roll !== 6) return false;
      // Can leave base on 6 if start space is not blocked by own pawn
      return !pawns[pi].some(op => op === 0);
    }
    const nextP = p + roll;
    if (nextP > 31) return false; // Must reach home by exact count

    if (nextP < 28) {
      // Check if destination track space is blocked by player's own pawn
      const targetAbs = (this.startSq(colorIdx) + nextP) % 28;
      for (let j = 0; j < 4; j++) {
        if (j !== k && pawns[pi][j] >= 0 && pawns[pi][j] < 28) {
          if ((this.startSq(colorIdx) + pawns[pi][j]) % 28 === targetAbs) return false;
        }
      }
      return true;
    } else {
      // Entering or advancing in Home (28..31)
      if (pawns[pi].some(op => op === nextP)) return false;
      // Cannot jump over own pawn inside home column
      for (let step = Math.max(28, p + 1); step < nextP; step++) {
        if (pawns[pi].some(op => op === step)) return false;
      }
      return true;
    }
  },
  movesFor(S: any, pi: number, roll: number, totalPlayers: number): number[] {
    const valid: number[] = [];
    for (let k = 0; k < 4; k++) {
      if (this.canMovePawn(S.pawns, pi, k, roll, totalPlayers)) valid.push(k);
    }
    return valid;
  },
  getPawnCoords(pi: number, k: number, p: number, totalPlayers: number): { x: number; y: number } {
    const colorIdx = this.playerColor(pi, totalPlayers);
    if (p === -1) {
      return this.BASE_HOLES[colorIdx][k];
    }
    if (p >= 0 && p < 28) {
      const trackIdx = (this.startSq(colorIdx) + p) % 28;
      return this.TRACK_HOLES[trackIdx];
    }
    const homeIdx = Math.min(3, Math.max(0, p - 28));
    return this.HOME_HOLES[colorIdx][homeIdx];
  },
  renderDiePips(roll: number): string {
    if (!roll || roll < 1 || roll > 6) {
      return '<text x="200" y="206" font-size="14" font-weight="900" text-anchor="middle" fill="#64748b">🎲</text>';
    }
    const pip = (cx: number, cy: number, color = '#1e293b', r = 2) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" />`;
    let out = '';
    if (roll === 1) out += pip(200, 200, '#dc2626', 2.8);
    if (roll === 2) out += pip(193.5, 193.5) + pip(206.5, 206.5);
    if (roll === 3) out += pip(193.5, 193.5) + pip(200, 200, '#dc2626', 2.5) + pip(206.5, 206.5);
    if (roll === 4) out += pip(193.5, 193.5) + pip(206.5, 193.5) + pip(193.5, 206.5) + pip(206.5, 206.5);
    if (roll === 5) out += pip(193.5, 193.5) + pip(206.5, 193.5) + pip(200, 200, '#dc2626', 2.5) + pip(193.5, 206.5) + pip(206.5, 206.5);
    if (roll === 6) out += pip(193.5, 193.5) + pip(193.5, 200) + pip(193.5, 206.5) + pip(206.5, 193.5) + pip(206.5, 200) + pip(206.5, 206.5);
    return out;
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    const curPlayer = S.turn;
    const activeName = C.seatName(curPlayer);
    const canPop = C.mine() && !S.over && !S.rolled && !S.popping;
    const totalPlayers = C.names.length;
    const curColorIdx = g.playerColor(curPlayer, totalPlayers);
    const validMoves = (S.rolled && !S.over) ? g.movesFor(S, curPlayer, S.last, totalPlayers) : [];

    // 1. Players Bar
    let playersBar = '<div class="gethome-players-bar">';
    C.names.forEach((name: string, pi: number) => {
      const colorIdx = g.playerColor(pi, totalPlayers);
      const cfg = g.COLORS[colorIdx];
      const isActive = curPlayer === pi && !S.over;
      const pw = S.pawns[pi] || [-1, -1, -1, -1];
      const atBase = pw.filter((p: number) => p === -1).length;
      const atHome = pw.filter((p: number) => p >= 28).length;
      const onTrack = 4 - atBase - atHome;

      playersBar += `
        <div class="gethome-player-card ${isActive ? 'active' : ''}">
          <div style="width:14px; height:14px; border-radius:50%; background:${cfg.hex}; border:2px solid #ffffff; box-shadow:0 0 6px ${cfg.hex}; flex-shrink:0;"></div>
          <div class="gethome-player-info">
            <span class="gethome-player-name" style="color:${cfg.hex}">${esc(name)}</span>
            <span class="gethome-player-stats">${atHome === 4 ? '🏆 4 HOME!' : `🏠${atBase} 📍${onTrack} 🏁${atHome}`}</span>
          </div>
        </div>
      `;
    });
    playersBar += '</div>';

    // 2. Render Board SVG
    // Build pawns SVG
    let pawnsSvg = '';
    S.pawns.forEach((pw: number[], pi: number) => {
      const colorIdx = g.playerColor(pi, totalPlayers);
      const cfg = g.COLORS[colorIdx];
      pw.forEach((p: number, k: number) => {
        const pt = g.getPawnCoords(pi, k, p, totalPlayers);
        const isMovable = curPlayer === pi && C.mine() && S.rolled && !S.over && validMoves.includes(k);
        pawnsSvg += `
          <g class="gethome-pawn-group ${isMovable ? 'movable' : ''}" data-pi="${pi}" data-k="${k}" style="cursor:${isMovable ? 'pointer' : 'default'};">
            <!-- Pawn shadow in socket -->
            <ellipse cx="${pt.x + 0.5}" cy="${pt.y + 4}" rx="8" ry="4" fill="rgba(0,0,0,0.5)" />
            <!-- Plastic base collar -->
            <ellipse cx="${pt.x}" cy="${pt.y + 3}" rx="6.5" ry="3.2" fill="${cfg.dark}" />
            <ellipse cx="${pt.x}" cy="${pt.y + 1.8}" rx="5.5" ry="2.4" fill="${cfg.hex}" />
            <!-- Peg body stem -->
            <path d="M ${pt.x - 3} ${pt.y + 1.5} C ${pt.x - 3} ${pt.y - 3}, ${pt.x - 2.2} ${pt.y - 6}, ${pt.x - 3.8} ${pt.y - 7.5} C ${pt.x - 3.8} ${pt.y - 7.5}, ${pt.x} ${pt.y - 8.2}, ${pt.x + 3.8} ${pt.y - 7.5} C ${pt.x + 2.2} ${pt.y - 6}, ${pt.x + 3} ${pt.y - 3}, ${pt.x + 3} ${pt.y + 1.5} Z" fill="url(#pawnGrad_${colorIdx})" stroke="${cfg.dark}" stroke-width="0.7" />
            <!-- Ball head -->
            <circle cx="${pt.x}" cy="${pt.y - 8.5}" r="7.5" fill="url(#pawnGrad_${colorIdx})" stroke="${cfg.dark}" stroke-width="0.9" />
            <!-- Specular shine -->
            <circle cx="${pt.x - 2.5}" cy="${pt.y - 10.8}" r="2.2" fill="#ffffff" opacity="0.85" />
          </g>
        `;
      });
    });

    // Highlight target hole if a pawn is selected or hovered
    let targetHighlightSvg = '';
    if (S.sel >= 0 && validMoves.includes(S.sel)) {
      const p = S.pawns[curPlayer][S.sel];
      const nextP = p === -1 ? 0 : p + S.last;
      const targetPt = g.getPawnCoords(curPlayer, S.sel, nextP, totalPlayers);
      targetHighlightSvg = `
        <circle cx="${targetPt.x}" cy="${targetPt.y}" r="17" fill="none" stroke="#22c55e" stroke-width="3.5" class="highlight-target" />
      `;
    }

    const boardSvg = `
      <svg class="gethome-board-svg" viewBox="0 0 400 400" width="100%" height="100%">
        <defs>
          <filter id="boardDropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.5)" />
          </filter>
          <radialGradient id="popDomeGrad" cx="35%" cy="30%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
            <stop offset="35%" stop-color="#e2e8f0" stop-opacity="0.65" />
            <stop offset="75%" stop-color="#94a3b8" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#334155" stop-opacity="0.7" />
          </radialGradient>
          <linearGradient id="metalDiamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#cbd5e1" />
            <stop offset="50%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <radialGradient id="springPlateGrad" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="55%" stop-color="#e2e8f0" />
            <stop offset="100%" stop-color="#94a3b8" />
          </radialGradient>
          <!-- Gradients for Pawns -->
          ${g.COLORS.map((c: any, i: number) => `
            <radialGradient id="pawnGrad_${i}" cx="35%" cy="25%">
              <stop offset="0%" stop-color="${c.light}" />
              <stop offset="45%" stop-color="${c.hex}" />
              <stop offset="100%" stop-color="${c.dark}" />
            </radialGradient>
          `).join('')}
        </defs>

        <!-- Plastic Board Base -->
        <rect x="3" y="3" width="394" height="394" rx="14" ry="14" fill="#e5e7eb" stroke="#111827" stroke-width="5" />
        <rect x="7" y="7" width="386" height="386" rx="11" ry="11" fill="none" stroke="#f3f4f6" stroke-width="2" />

        <!-- 4 Colored Track Arcs (Clockwise) -->
        <g fill="none" stroke-width="40" stroke-linecap="round">
          <!-- Red arc (Bottom-Right) -->
          <path d="m 360 200 v 66.274 s 0 35.147 -29.289 64.436 -64.437 29.289 -64.437 29.289 l -66.274 -1e-5" stroke="#ef4444" />
          <!-- Green arc (Bottom-Left) -->
          <path d="m 200 360 h -66.274 s -35.147 0 -64.436 -29.289 -29.289 -64.437 -29.289 -64.437 v -66.274" stroke="#22c55e" />
          <!-- Yellow arc (Top-Left) -->
          <path d="m 40 200 v -66.274 s 0 -35.147 29.289 -64.436 64.437 -29.289 64.437 -29.289 h 66.274" stroke="#eab308" />
          <!-- Blue arc (Top-Right) -->
          <path d="m 200 40 h 66.274 s 35.147 0 64.436 29.289 29.289 64.437 29.289 64.437 v 66.274" stroke="#3b82f6" />

          <!-- 4 Home Colored Spokes leading into center -->
          <path d="M 180,180 60,60" stroke="#eab308" />
          <path d="m 220 220 120 120" stroke="#ef4444" />
          <path d="m 220 180 120 -120" stroke="#3b82f6" />
          <path d="m 180 220 -120 120" stroke="#22c55e" />
        </g>

        <!-- 4 Start Space Concentric Double Rings -->
        <g stroke="#111827" stroke-width="3" fill="none">
          <circle cx="83.844" cy="57.214" r="18" />
          <circle cx="342.79" cy="83.844" r="18" />
          <circle cx="316.16" cy="342.79" r="18" />
          <circle cx="57.214" cy="316.16" r="18" />
        </g>

        <!-- 16 Corner Base Waiting Sockets -->
        <!-- Yellow Base -->
        <g fill="#eab308" stroke="#111827" stroke-width="4">
          <circle cx="63.029" cy="21.495" r="9.5" />
          <circle cx="46.192" cy="35.781" r="9.5" />
          <circle cx="30.836" cy="51.647" r="9.5" />
          <circle cx="17.11" cy="68.942" r="9.5" />
        </g>
        <!-- Blue Base -->
        <g fill="#3b82f6" stroke="#111827" stroke-width="4">
          <circle cx="382.89" cy="68.942" r="9.5" />
          <circle cx="369.16" cy="51.647" r="9.5" />
          <circle cx="353.81" cy="35.781" r="9.5" />
          <circle cx="336.97" cy="21.495" r="9.5" />
        </g>
        <!-- Red Base -->
        <g fill="#ef4444" stroke="#111827" stroke-width="4">
          <circle cx="336.97" cy="378.5" r="9.5" />
          <circle cx="353.81" cy="364.22" r="9.5" />
          <circle cx="369.16" cy="348.35" r="9.5" />
          <circle cx="382.89" cy="331.06" r="9.5" />
        </g>
        <!-- Green Base -->
        <g fill="#22c55e" stroke="#111827" stroke-width="4">
          <circle cx="17.11" cy="331.06" r="9.5" />
          <circle cx="30.836" cy="348.35" r="9.5" />
          <circle cx="46.192" cy="364.22" r="9.5" />
          <circle cx="63.029" cy="378.5" r="9.5" />
        </g>

        <!-- 28 Main Track Socket Holes -->
        <g fill="#f3f4f6" stroke="#111827" stroke-width="4">
          ${g.TRACK_HOLES.map((h: any, i: number) => `
            <circle cx="${h.x}" cy="${h.y}" r="9.5" class="gethome-hole track-hole" data-track-idx="${i}" />
          `).join('')}
        </g>

        <!-- 16 Home Column Holes (Leading to Center) -->
        <!-- Yellow Home -->
        <g fill="#fef08a" stroke="#111827" stroke-width="4">
          <circle cx="93.934" cy="93.934" r="9.5" />
          <circle cx="115.15" cy="115.15" r="9.5" />
          <circle cx="136.36" cy="136.36" r="9.5" />
          <circle cx="157.57" cy="157.57" r="9.5" />
        </g>
        <!-- Blue Home -->
        <g fill="#bfdbfe" stroke="#111827" stroke-width="4">
          <circle cx="306.07" cy="93.934" r="9.5" />
          <circle cx="284.85" cy="115.15" r="9.5" />
          <circle cx="263.64" cy="136.36" r="9.5" />
          <circle cx="242.43" cy="157.57" r="9.5" />
        </g>
        <!-- Red Home -->
        <g fill="#fecaca" stroke="#111827" stroke-width="4">
          <circle cx="306.07" cy="306.07" r="9.5" />
          <circle cx="284.85" cy="284.85" r="9.5" />
          <circle cx="263.64" cy="263.64" r="9.5" />
          <circle cx="242.43" cy="242.43" r="9.5" />
        </g>
        <!-- Green Home -->
        <g fill="#bbf7d0" stroke="#111827" stroke-width="4">
          <circle cx="93.934" cy="306.07" r="9.5" />
          <circle cx="115.15" cy="284.85" r="9.5" />
          <circle cx="136.36" cy="263.64" r="9.5" />
          <circle cx="157.57" cy="242.43" r="9.5" />
        </g>

        <!-- Center Pop-O-Matic Diamond Bezel -->
        <g id="popomaticBezel" class="gethome-popomatic ${S.popping ? 'popping' : ''}">
          <!-- Rotated metallic diamond housing -->
          <rect x="150" y="150" width="100" height="100" rx="14" ry="14" transform="rotate(45 200 200)" fill="url(#metalDiamondGrad)" stroke="#111827" stroke-width="4.5" />
          <!-- Metallic inner spring plate -->
          <circle cx="200" cy="200" r="32" fill="url(#springPlateGrad)" stroke="#475569" stroke-width="2" />
          <circle cx="200" cy="200" r="28" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 2" />

          <!-- 3D Pop Die inside dome -->
          <g id="popDieGroup" class="gethome-die-g ${S.popping ? 'tumble' : ''}">
            <!-- Die shadow -->
            <rect x="190" y="190" width="24" height="24" rx="4" ry="4" fill="rgba(0,0,0,0.3)" />
            <!-- Die white cube -->
            <rect x="188" y="188" width="24" height="24" rx="4" ry="4" fill="#ffffff" stroke="#334155" stroke-width="1.5" />
            <!-- Die pips -->
            ${g.renderDiePips(S.last)}
          </g>

          <!-- Clear Acrylic Pop-O-Matic Dome -->
          <circle cx="200" cy="200" r="32" fill="url(#popDomeGrad)" stroke="#64748b" stroke-width="1.8" />
          <!-- Acrylic light crescent reflection -->
          <path d="M 180 184 C 187 173, 213 173, 220 184 C 213 180, 187 180, 180 184 Z" fill="#ffffff" opacity="0.75" />
        </g>

        <!-- Highlight target circle if moving -->
        ${targetHighlightSvg}

        <!-- 3D Peg Pawns -->
        ${pawnsSvg}
      </svg>
    `;

    // 3. Action / Status Panel
    let bonusBadge = '';
    if (S.bonusPop && !S.over) {
      bonusBadge = '<span class="gethome-bonus-badge">🎲 BONUS POP EARNED!</span>';
    }

    let actionBtnHtml = '';
    if (C.mine() && !S.over) {
      if (!S.rolled) {
        actionBtnHtml = `
          <button class="gethome-pop-btn" id="popBtn" ${canPop ? '' : 'disabled'}>
            🎲 ${S.popping ? 'POPPING…' : `POP DIE (${esc(activeName)})`}
          </button>
        `;
      } else if (S.mustPass) {
        actionBtnHtml = `
          <button class="btn secondary" id="passBtn">Pass Turn</button>
        `;
      }
    }

    let h = turnBanner(C) + '<h2>🎲 Get Home</h2>'
      + '<div class="gethome-table">'
      +   playersBar
      + '  <div class="gethome-board-container" id="boardBox" title="Tap the Pop-O-Matic or button to pop!">'
      +      boardSvg
      + '  </div>'
      + '  <div class="gethome-action-card">'
      +        bonusBadge
      + '    <div class="gethome-status-msg" id="statusMsg">' + esc(S.log) + '</div>'
      +      actionBtnHtml
      + '  </div>'
      + '</div>';

    R.innerHTML = h;

    // Attach Pop-O-Matic Click Triggers
    const triggerPop = () => {
      if (!canPop || S.popping || S.rolled || S.over) return;
      g.popDie(C);
    };

    const pBtn = $('#popBtn');
    if (pBtn) pBtn.onclick = triggerPop;

    const popDome = $('#popomaticBezel');
    if (popDome && canPop) popDome.onclick = triggerPop;

    const passBtn = $('#passBtn');
    if (passBtn) passBtn.onclick = () => g.endTurn(C);

    // Attach Pawn Click Handlers
    R.querySelectorAll('.gethome-pawn-group.movable').forEach((el: any) => {
      const pi = +el.dataset.pi;
      const k = +el.dataset.k;
      el.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        if (pi === curPlayer && C.mine() && S.rolled && !S.over) {
          g.movePawn(C, k);
        }
      };
      // Hover highlight target
      el.onmouseenter = () => {
        S.sel = k;
        C.update(() => {}, true);
      };
      el.onmouseleave = () => {
        if (S.sel === k) {
          S.sel = -1;
          C.update(() => {}, true);
        }
      };
    });

    // Clicking highlighted target hole
    const targetHoleEl = R.querySelector('.highlight-target');
    if (targetHoleEl && S.sel >= 0) {
      targetHoleEl.addEventListener('click', (e: any) => {
        e.stopPropagation();
        g.movePawn(C, S.sel);
      });
    }
  },
  popDie(C: any) {
    const S = C.S, g = this;
    if (S.popping || S.rolled || S.over) return;

    S.popping = true;
    Sound.dice();
    C.update(() => {});

    setTimeout(() => {
      const roll = ri(1, 6);
      S.last = roll;
      S.popping = false;
      S.rolled = true;
      S.sel = -1;

      const totalPlayers = C.names.length;
      const curPlayer = S.turn;
      const pName = C.seatName(curPlayer);
      const valid = g.movesFor(S, curPlayer, roll, totalPlayers);

      if (!valid.length) {
        S.mustPass = true;
        S.bonusPop = false;
        S.log = `🎲 ${pName} popped a ${roll} — no valid moves! Turn passes.`;
        toast(`Popped a ${roll} — no valid moves!`);
        C.update(() => {});
        // Auto pass after short pause
        setTimeout(() => {
          if (S.mustPass && !S.over) g.endTurn(C);
        }, 900);
      } else {
        S.mustPass = false;
        if (roll === 6) {
          S.bonusPop = true;
          S.log = `🎉 POPPED A 6! ${pName} gets to move + BONUS POP EARNED!`;
          toast(`🎲 ROLLED A 6! Move a pawn + BONUS POP!`);
        } else {
          S.bonusPop = false;
          S.log = `🎲 ${pName} popped a ${roll}! Tap a highlighted pawn to advance.`;
        }
        // If only 1 valid move exists in single-player or CPU, can select it
        if (valid.length === 1) {
          S.sel = valid[0];
        }
        C.update(() => {});
        maybeCpu(C);
      }
    }, 480);
  },
  movePawn(C: any, k: number) {
    const S = C.S, g = this;
    const curPlayer = S.turn;
    const pName = C.seatName(curPlayer);
    const totalPlayers = C.names.length;
    const colorIdx = g.playerColor(curPlayer, totalPlayers);
    const roll = S.last;
    const p = S.pawns[curPlayer][k];

    let nextP = p === -1 ? 0 : p + roll;
    S.pawns[curPlayer][k] = nextP;
    Sound.click();

    // Check for Bumping Opponent (Trouble! / Get Home!)
    if (nextP < 28) {
      const targetAbs = (g.startSq(colorIdx) + nextP) % 28;
      for (let oi = 0; oi < totalPlayers; oi++) {
        if (oi !== curPlayer) {
          const oppColorIdx = g.playerColor(oi, totalPlayers);
          for (let ok = 0; ok < 4; ok++) {
            const oppP = S.pawns[oi][ok];
            if (oppP >= 0 && oppP < 28) {
              const oppAbs = (g.startSq(oppColorIdx) + oppP) % 28;
              if (oppAbs === targetAbs) {
                // BUMP! Send back to Home Base
                S.pawns[oi][ok] = -1;
                Sound.lose();
                const oppName = C.seatName(oi);
                S.log = `💥 BUMP! ${pName} sent ${oppName}'s pawn back to Home Base!`;
                toast(`💥 BUMP! ${pName} sent ${oppName} home!`);
                break;
              }
            }
          }
        }
      }
    } else {
      Sound.candy();
      toast(`🏁 Pawn safely in Home!`);
    }

    // Check Win Condition: all 4 pawns in Home column (p >= 28)
    if (S.pawns[curPlayer].every((val: number) => val >= 28)) {
      S.over = true;
      Sound.win();
      S.log = `🏆 VICTORY! ${pName} got all 4 peg pawns Home and won Get Home! 🎉`;
      C.update(() => {});
      C.finish(curPlayer, `${esc(pName)} got all 4 pawns Home! 🏆 WINNER!`);
      return;
    }

    // Check Bonus Pop on 6
    if (roll === 6) {
      S.rolled = false;
      S.bonusPop = true;
      S.sel = -1;
      S.log = `🎉 BONUS POP! ${pName} rolled a 6 — pop the die again!`;
      C.update(() => {});
      maybeCpu(C);
    } else {
      g.endTurn(C);
    }
  },
  endTurn(C: any) {
    const S = C.S;
    if (S.over) return;
    S.turn = (S.turn + 1) % C.names.length;
    S.rolled = false;
    S.bonusPop = false;
    S.mustPass = false;
    S.sel = -1;
    S.popping = false;
    const nextName = C.seatName(S.turn);
    S.log = `🎲 ${nextName}'s turn — tap Pop-O-Matic to roll!`;
    C.update(() => {});
    setTimeout(() => maybeCpu(C), 450);
  },
  cpu(C: any) {
    const g = this, S = C.S;
    if (S.over) return;
    const curPlayer = S.turn;
    const totalPlayers = C.names.length;

    // 1. If not rolled yet, pop the die
    if (!S.rolled && !S.popping) {
      setTimeout(() => {
        if (!S.rolled && !S.popping && !S.over && S.turn === curPlayer) {
          g.popDie(C);
        }
      }, 650);
      return;
    }

    // 2. If rolled, pick the smartest move
    if (S.rolled && !S.mustPass && !S.over) {
      const valid = g.movesFor(S, curPlayer, S.last, totalPlayers);
      if (!valid.length) {
        g.endTurn(C);
        return;
      }

      const colorIdx = g.playerColor(curPlayer, totalPlayers);
      let bestMove = valid[0];
      let bestScore = -999;

      valid.forEach((k: number) => {
        const p = S.pawns[curPlayer][k];
        const nextP = p === -1 ? 0 : p + S.last;
        let score = nextP;

        // Massive bonus for bumping an opponent!
        if (nextP < 28) {
          const targetAbs = (g.startSq(colorIdx) + nextP) % 28;
          for (let oi = 0; oi < totalPlayers; oi++) {
            if (oi !== curPlayer) {
              const oppColorIdx = g.playerColor(oi, totalPlayers);
              for (let ok = 0; ok < 4; ok++) {
                const oppP = S.pawns[oi][ok];
                if (oppP >= 0 && oppP < 28) {
                  const oppAbs = (g.startSq(oppColorIdx) + oppP) % 28;
                  if (oppAbs === targetAbs) score += 60;
                }
              }
            }
          }
        }

        // Bonus for entering or advancing in Home
        if (nextP >= 28) score += 40;

        // Bonus for launching a pawn from Base onto track on a 6
        if (p === -1) score += 30;

        if (score > bestScore) {
          bestScore = score;
          bestMove = k;
        }
      });

      setTimeout(() => {
        if (S.rolled && !S.over && S.turn === curPlayer) {
          g.movePawn(C, bestMove);
        }
      }, 700);
    }
  }
});

/* ================= MY BAD (Official Board Game) ================= */
const MYBAD_COLORS = [
  { name: 'Red', hex: '#e11d48', bg: '#ffe4e6', dark: '#9f1239', glow: 'rgba(225,29,72,0.6)' },
  { name: 'Blue', hex: '#2563eb', bg: '#dbeafe', dark: '#1e40af', glow: 'rgba(37,99,235,0.6)' },
  { name: 'Yellow', hex: '#eab308', bg: '#fef9c3', dark: '#854d0e', glow: 'rgba(234,179,8,0.6)' },
  { name: 'Green', hex: '#16a34a', bg: '#dcfce7', dark: '#14532d', glow: 'rgba(22,163,74,0.6)' }
];

const MYBAD_GRID_MARGIN = 20;
const MYBAD_CELL_SIZE = 37.5; // 600px board / 16 grid cells

function mybadCellCenter(c: number, r: number) {
  return {
    x: +(MYBAD_GRID_MARGIN + (c + 0.5) * MYBAD_CELL_SIZE).toFixed(2),
    y: +(MYBAD_GRID_MARGIN + (r + 0.5) * MYBAD_CELL_SIZE).toFixed(2)
  };
}

// 60 Perimeter Track spaces (0..59)
const MYBAD_TRACK_COORDS: { x: number; y: number }[] = [];
for (let c = 0; c < 15; c++) MYBAD_TRACK_COORDS.push(mybadCellCenter(c, 0));   // 0..14 (Top)
for (let r = 0; r < 15; r++) MYBAD_TRACK_COORDS.push(mybadCellCenter(15, r));  // 15..29 (Right)
for (let c = 15; c > 0; c--) MYBAD_TRACK_COORDS.push(mybadCellCenter(c, 15)); // 30..44 (Bottom)
for (let r = 15; r > 0; r--) MYBAD_TRACK_COORDS.push(mybadCellCenter(0, r));  // 45..59 (Left)

// 8 Official Slides
const MYBAD_SLIDES = [
  { owner: 0, start: 1, end: 4, spaces: [1, 2, 3, 4] },
  { owner: 0, start: 9, end: 13, spaces: [9, 10, 11, 12, 13] },
  { owner: 1, start: 16, end: 19, spaces: [16, 17, 18, 19] },
  { owner: 1, start: 24, end: 28, spaces: [24, 25, 26, 27, 28] },
  { owner: 2, start: 31, end: 34, spaces: [31, 32, 33, 34] },
  { owner: 2, start: 39, end: 43, spaces: [39, 40, 41, 42, 43] },
  { owner: 3, start: 46, end: 49, spaces: [46, 47, 48, 49] },
  { owner: 3, start: 54, end: 58, spaces: [54, 55, 56, 57, 58] }
];

// Safety Zone coords (5 spaces per color, indices 0..4, leading toward Home)
const MYBAD_SAFETY_COORDS: { x: number; y: number }[][] = [
  // Red (0): col 2, rows 1..5
  [mybadCellCenter(2, 1), mybadCellCenter(2, 2), mybadCellCenter(2, 3), mybadCellCenter(2, 4), mybadCellCenter(2, 5)],
  // Blue (1): cols 14..10, row 2
  [mybadCellCenter(14, 2), mybadCellCenter(13, 2), mybadCellCenter(12, 2), mybadCellCenter(11, 2), mybadCellCenter(10, 2)],
  // Yellow (2): col 13, rows 14..10
  [mybadCellCenter(13, 14), mybadCellCenter(13, 13), mybadCellCenter(13, 12), mybadCellCenter(13, 11), mybadCellCenter(13, 10)],
  // Green (3): cols 1..5, row 13
  [mybadCellCenter(1, 13), mybadCellCenter(2, 13), mybadCellCenter(3, 13), mybadCellCenter(4, 13), mybadCellCenter(5, 13)]
];

// Home center & Start center positions
const MYBAD_HOME_CENTERS = [
  { x: 113.75, y: 263.75 }, // Red
  { x: 376.25, y: 113.75 }, // Blue
  { x: 526.25, y: 376.25 }, // Yellow
  { x: 263.75, y: 526.25 }  // Green
];

const MYBAD_START_CENTERS = [
  { x: 188.75, y: 113.75 }, // Red
  { x: 526.25, y: 188.75 }, // Blue
  { x: 451.25, y: 526.25 }, // Yellow
  { x: 113.75, y: 451.25 }  // Green
];

const MYBAD_START_ENTRY = [4, 19, 34, 49]; // Start exit spaces on track
const MYBAD_TURN_SPACES = [2, 17, 32, 47]; // Entry into Safety Zone

// 45 Official Sorry! / My Bad cards
const MYBAD_DECK_PRESET = [
  1, 1, 1, 1, 1,
  2, 2, 2, 2,
  3, 3, 3, 3,
  4, 4, 4, 4,
  5, 5, 5, 5,
  7, 7, 7, 7,
  8, 8, 8, 8,
  10, 10, 10, 10,
  11, 11, 11, 11,
  12, 12, 12, 12,
  'MYBAD', 'MYBAD', 'MYBAD', 'MYBAD'
];

const MYBAD_CARD_META: Record<string, { title: string; desc: string; sub?: string }> = {
  '1': { title: '1', desc: 'Move 1 pawn from START or move 1 space forward.' },
  '2': { title: '2', desc: 'Move from START or move 2 spaces forward. DRAW AGAIN!', sub: 'Draw Again! ⭐' },
  '3': { title: '3', desc: 'Move 1 pawn 3 spaces forward.' },
  '4': { title: '4', desc: 'Must move 1 pawn 4 spaces BACKWARD!', sub: 'Reverse 4! ↺' },
  '5': { title: '5', desc: 'Move 1 pawn 5 spaces forward.' },
  '7': { title: '7', desc: 'Move 1 pawn 7 spaces forward, OR split 7 spaces between two pawns.', sub: 'Split Move' },
  '8': { title: '8', desc: 'Move 1 pawn 8 spaces forward.' },
  '10': { title: '10', desc: 'Move 1 pawn 10 spaces forward, OR move 1 space BACKWARD.', sub: 'Forward 10 / Back 1' },
  '11': { title: '11', desc: 'Move 1 pawn 11 forward, OR switch places with any opponent on track!', sub: 'Swap Places' },
  '12': { title: '12', desc: 'Move 1 pawn 12 spaces forward.' },
  'MYBAD': { title: 'MY BAD!', desc: 'Take 1 pawn from START to replace an opponent on the track, sending them to START!', sub: 'Sweet Revenge! 💥' }
};

stdInit('sorry', {
  name: 'My Bad',
  icon: '😈',
  desc: 'Official Revenge Race',
  p: [2, 4],
  payout: PAYOUTS.sorry,
  rules: 'Official My Bad: Draw cards to race the 60-space track into your Safety Zone. Card 2 draws again! Card 4 moves backwards! Slides bump rivals, and MY BAD! cards steal spots from Start!',
  playerColor(pi: number, totalPlayers: number): number {
    if (totalPlayers === 2) return pi === 0 ? 0 : 2; // Red and Yellow for 2 players
    return pi % 4;
  },
  getPawnCoord(colorIdx: number, k: number, p: number): { x: number; y: number } {
    const offs = [
      { dx: -11, dy: -11 },
      { dx: 11, dy: -11 },
      { dx: -11, dy: 11 },
      { dx: 11, dy: 11 }
    ];
    if (p === -1) {
      const c = MYBAD_START_CENTERS[colorIdx];
      return { x: c.x + offs[k].dx, y: c.y + offs[k].dy };
    }
    if (p >= 0 && p < 60) {
      return MYBAD_TRACK_COORDS[p];
    }
    if (p >= 100 && p <= 104) {
      return MYBAD_SAFETY_COORDS[colorIdx][p - 100];
    }
    if (p === 105) {
      const c = MYBAD_HOME_CENTERS[colorIdx];
      return { x: c.x + offs[k].dx, y: c.y + offs[k].dy };
    }
    return { x: 0, y: 0 };
  },
  newState(C: any) {
    const d: any[] = [];
    MYBAD_DECK_PRESET.forEach((v: any) => d.push(v));
    shuffle(d);
    return {
      turn: 0,
      pawns: C.names.map(() => [-1, -1, -1, -1]), // 4 pawns per player: -1=Start, 0..59=Track, 100..104=Safety, 105=Home
      deck: d,
      discard: [] as any[],
      card: null,
      cardMode: 'default', // for cards with options: 'default' | 'start' | 'forward' | 'back' | 'swap' | 'split'
      selPawn: -1,
      over: false,
      log: '🃏 Tap "Draw Card" to reveal your card!'
    };
  },
  calcForward(p: number, dist: number, turnSpace: number): number | null {
    if (p < 0 || p === 105) return null;
    if (p >= 100 && p <= 104) {
      const rem = 5 - (p - 100);
      if (dist === rem) return 105;
      if (dist < rem) return p + dist;
      return null; // overshoot
    }
    if (p < 60) {
      const dToTurn = (turnSpace - p + 60) % 60;
      if (dist > dToTurn) {
        const step = dist - dToTurn;
        if (step <= 5) return 100 + (step - 1);
        if (step === 6) return 105;
        return null; // overshoot
      }
      return (p + dist) % 60;
    }
    return null;
  },
  calcBack(p: number, dist: number, turnSpace: number): number | null {
    if (p < 0 || p === 105) return null;
    if (p < 60) {
      return (p - dist + 60) % 60;
    }
    if (p >= 100 && p <= 104) {
      const sIdx = p - 100;
      if (dist <= sIdx) return 100 + (sIdx - dist);
      const stepsOnTrack = dist - (sIdx + 1);
      return (turnSpace - stepsOnTrack + 60) % 60;
    }
    return null;
  },
  legalMoves(C: any) {
    const S = C.S, g = this, pi = S.turn, card = S.card;
    if (card == null) return [];
    const totalPlayers = C.names.length;
    const colorIdx = g.playerColor(pi, totalPlayers);
    const turnSpace = MYBAD_TURN_SPACES[colorIdx];
    const startEntry = MYBAD_START_ENTRY[colorIdx];
    const myPawns = S.pawns[pi];
    const moves: any[] = [];

    // Helper: can own pawn land on dest?
    const canLand = (k: number, dest: number) => {
      if (dest === 105) return true; // All pawns can be in Home
      for (let j = 0; j < 4; j++) {
        if (j !== k && myPawns[j] === dest) return false;
      }
      // Check if dest is a slide start of another color that ends where own pawn is
      if (dest < 60) {
        const slide = MYBAD_SLIDES.find(s => s.start === dest);
        if (slide && slide.owner !== colorIdx) {
          for (let j = 0; j < 4; j++) {
            if (j !== k && myPawns[j] === slide.end) return false;
          }
        }
      }
      return true;
    };

    if (card === 'MYBAD') {
      // Must have at least 1 pawn in Start, and at least 1 opponent pawn on track
      const startPawns: number[] = [];
      myPawns.forEach((p: number, k: number) => { if (p === -1) startPawns.push(k); });
      if (startPawns.length > 0) {
        for (let oi = 0; oi < totalPlayers; oi++) {
          if (oi === pi) continue;
          S.pawns[oi].forEach((op: number, ok: number) => {
            if (op >= 0 && op < 60) {
              startPawns.forEach(k => {
                moves.push({
                  type: 'mybad',
                  k,
                  dest: op,
                  targetPi: oi,
                  targetK: ok,
                  label: `Take ${esc(C.seatName(oi))}'s spot`
                });
              });
            }
          });
        }
      }
      return moves;
    }

    if (card === 1 || card === 2) {
      // Option A: Exit Start
      myPawns.forEach((p: number, k: number) => {
        if (p === -1 && canLand(k, startEntry)) {
          moves.push({ type: 'start', k, dest: startEntry, label: 'Exit Start' });
        }
      });
      // Option B: Move forward 1 or 2
      myPawns.forEach((p: number, k: number) => {
        if (p >= 0 && p <= 104) {
          const dest = g.calcForward(p, card, turnSpace);
          if (dest != null && canLand(k, dest)) {
            moves.push({ type: 'forward', k, dest, dist: card, label: `Move ${card}` });
          }
        }
      });
      return moves;
    }

    if (card === 4) {
      myPawns.forEach((p: number, k: number) => {
        if (p >= 0 && p <= 104) {
          const dest = g.calcBack(p, 4, turnSpace);
          if (dest != null && canLand(k, dest)) {
            moves.push({ type: 'back', k, dest, dist: 4, label: 'Move 4 Back' });
          }
        }
      });
      return moves;
    }

    if (card === 10) {
      // Forward 10
      myPawns.forEach((p: number, k: number) => {
        if (p >= 0 && p <= 104) {
          const dest = g.calcForward(p, 10, turnSpace);
          if (dest != null && canLand(k, dest)) {
            moves.push({ type: 'forward', k, dest, dist: 10, label: 'Forward 10' });
          }
        }
      });
      // OR Back 1
      myPawns.forEach((p: number, k: number) => {
        if (p >= 0 && p <= 104) {
          const dest = g.calcBack(p, 1, turnSpace);
          if (dest != null && canLand(k, dest)) {
            moves.push({ type: 'back', k, dest, dist: 1, label: 'Back 1' });
          }
        }
      });
      return moves;
    }

    if (card === 11) {
      // Forward 11
      myPawns.forEach((p: number, k: number) => {
        if (p >= 0 && p <= 104) {
          const dest = g.calcForward(p, 11, turnSpace);
          if (dest != null && canLand(k, dest)) {
            moves.push({ type: 'forward', k, dest, dist: 11, label: 'Forward 11' });
          }
        }
      });
      // Swap places with any opponent pawn on track
      myPawns.forEach((p: number, k: number) => {
        if (p >= 0 && p < 60) {
          for (let oi = 0; oi < totalPlayers; oi++) {
            if (oi === pi) continue;
            S.pawns[oi].forEach((op: number, ok: number) => {
              if (op >= 0 && op < 60) {
                moves.push({
                  type: 'swap',
                  k,
                  dest: op,
                  targetPi: oi,
                  targetK: ok,
                  label: `Swap with ${esc(C.seatName(oi))}`
                });
              }
            });
          }
        }
      });
      return moves;
    }

    if (card === 7) {
      // Move 7 forward on 1 pawn
      myPawns.forEach((p: number, k: number) => {
        if (p >= 0 && p <= 104) {
          const dest = g.calcForward(p, 7, turnSpace);
          if (dest != null && canLand(k, dest)) {
            moves.push({ type: 'forward', k, dest, dist: 7, label: 'Move 7' });
          }
        }
      });
      // Split 7 between two pawns (1&6, 2&5, 3&4, 4&3, 5&2, 6&1)
      const splits = [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]];
      splits.forEach(([d1, d2]) => {
        for (let k1 = 0; k1 < 4; k1++) {
          const p1 = myPawns[k1];
          if (p1 < 0 || p1 === 105) continue;
          const dest1 = g.calcForward(p1, d1, turnSpace);
          if (dest1 == null) continue;
          for (let k2 = 0; k2 < 4; k2++) {
            if (k1 === k2) continue;
            const p2 = myPawns[k2];
            if (p2 < 0 || p2 === 105) continue;
            const dest2 = g.calcForward(p2, d2, turnSpace);
            if (dest2 == null) continue;
            // Ensure no own-pawn collisions between dest1 and dest2 or other pawns
            let ok = true;
            if (dest1 !== 105 && dest2 !== 105 && dest1 === dest2) ok = false;
            for (let j = 0; j < 4; j++) {
              if (j !== k1 && j !== k2) {
                if (dest1 !== 105 && myPawns[j] === dest1) ok = false;
                if (dest2 !== 105 && myPawns[j] === dest2) ok = false;
              }
            }
            if (ok) {
              moves.push({
                type: 'split',
                k: k1,
                dest: dest1,
                dist: d1,
                k2,
                dest2,
                dist2: d2,
                label: `Split: #${k1 + 1} (${d1}) & #${k2 + 1} (${d2})`
              });
            }
          }
        }
      });
      return moves;
    }

    // Normal cards: 3, 5, 8, 12
    myPawns.forEach((p: number, k: number) => {
      if (p >= 0 && p <= 104) {
        const dest = g.calcForward(p, card, turnSpace);
        if (dest != null && canLand(k, dest)) {
          moves.push({ type: 'forward', k, dest, dist: card, label: `Move ${card}` });
        }
      }
    });

    return moves;
  },
  executeMove(C: any, move: any) {
    const S = C.S, g = this, pi = S.turn;
    const totalPlayers = C.names.length;
    const colorIdx = g.playerColor(pi, totalPlayers);
    const k = move.k;
    let finalDest = move.dest;
    let bumpedNames: string[] = [];

    if (move.type === 'swap') {
      // Swap places
      const oi = move.targetPi;
      const ok = move.targetK;
      const myOldPos = S.pawns[pi][k];
      const opOldPos = S.pawns[oi][ok];
      S.pawns[pi][k] = opOldPos;
      S.pawns[oi][ok] = myOldPos;
      Sound.bean();
      toast(`🔄 SWAPPED! ${esc(C.seatName(pi))} switched places with ${esc(C.seatName(oi))}!`);
    } else if (move.type === 'mybad') {
      // MY BAD: Take opponent spot, send them to start
      const oi = move.targetPi;
      const ok = move.targetK;
      S.pawns[oi][ok] = -1;
      S.pawns[pi][k] = move.dest;
      Sound.chute();
      toast(`😈 MY BAD! ${esc(C.seatName(pi))} stole ${esc(C.seatName(oi))}'s spot and sent them to START!`);
    } else if (move.type === 'split') {
      // Split move for Card 7
      S.pawns[pi][k] = move.dest;
      S.pawns[pi][move.k2] = move.dest2;
      Sound.bean();
      toast(`✨ ${esc(C.seatName(pi))} split 7 spaces between pawn #${k + 1} and #${move.k2 + 1}!`);
    } else {
      // Normal / start / back move
      // Check Slide trigger on final destination
      if (finalDest < 60) {
        const slide = MYBAD_SLIDES.find(s => s.start === finalDest);
        if (slide && slide.owner !== colorIdx) {
          // Slide all the way to slide.end!
          finalDest = slide.end;
          Sound.ladder();
          // Bump anyone on slide
          for (let oi = 0; oi < totalPlayers; oi++) {
            S.pawns[oi].forEach((op: number, ok: number) => {
              if (oi === pi && ok === k) return; // not the moving pawn
              if (slide.spaces.includes(op)) {
                S.pawns[oi][ok] = -1;
                bumpedNames.push(C.seatName(oi));
              }
            });
          }
          toast(`🛝 SLIDE! ${esc(C.seatName(pi))} glided to space ${finalDest}!`);
        } else {
          // Normal landing: bump opponent if on space
          for (let oi = 0; oi < totalPlayers; oi++) {
            if (oi !== pi) {
              S.pawns[oi].forEach((op: number, ok: number) => {
                if (op === finalDest) {
                  S.pawns[oi][ok] = -1;
                  bumpedNames.push(C.seatName(oi));
                }
              });
            }
          }
          Sound.bean();
        }
      } else {
        Sound.bean();
      }

      S.pawns[pi][k] = finalDest;
      if (finalDest === 105) {
        toast(`🏁 Pawn #${k + 1} reached HOME safe!`);
      }
      if (bumpedNames.length > 0) {
        Sound.chute();
        toast(`💥 BUMPED! ${bumpedNames.map(n => esc(n)).join(', ')} sent back to START!`);
      }
    }

    const cardPlayed = S.card;
    S.discard.push(cardPlayed);
    S.card = null;
    S.selPawn = -1;
    S.cardMode = 'default';

    // Check Win condition: all 4 pawns at 105
    if (S.pawns[pi].every((p: number) => p === 105)) {
      S.over = true;
      Sound.win();
      toast(`🏆 ${esc(C.seatName(pi))} got ALL 4 pawns HOME and won the game!`);
      C.update(() => {});
      C.finish(pi);
      return;
    }

    // Card 2 Bonus: Draw Again!
    if (cardPlayed === 2) {
      toast(`⭐ Card 2 bonus: ${esc(C.seatName(pi))} draws again!`);
      S.log = `⭐ Card 2: ${esc(C.seatName(pi))} draws again!`;
      C.update(() => {});
      maybeCpu(C);
      return;
    }

    g.endTurn(C);
  },
  endTurn(C: any) {
    const S = C.S;
    S.turn = (S.turn + 1) % C.names.length;
    S.card = null;
    S.selPawn = -1;
    S.cardMode = 'default';
    S.log = `👉 ${esc(C.seatName(S.turn))}'s turn!`;
    C.update(() => {});
    maybeCpu(C);
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    const curPlayer = S.turn;
    const totalPlayers = C.names.length;
    const curColorIdx = g.playerColor(curPlayer, totalPlayers);
    const isMyTurn = C.mine() && !S.over;
    const allMoves = S.card != null ? g.legalMoves(C) : [];

    // Filter moves by current selection or card mode if applicable
    let filteredMoves = allMoves;
    if (S.cardMode === 'start') {
      filteredMoves = allMoves.filter((m: any) => m.type === 'start');
    } else if (S.cardMode === 'forward') {
      filteredMoves = allMoves.filter((m: any) => m.type === 'forward');
    } else if (S.cardMode === 'back') {
      filteredMoves = allMoves.filter((m: any) => m.type === 'back');
    } else if (S.cardMode === 'swap') {
      filteredMoves = allMoves.filter((m: any) => m.type === 'swap');
    }

    // Identify movable pawns
    const movablePawnIndices = Array.from(new Set(filteredMoves.map((m: any) => m.k)));
    const targetOpponents = filteredMoves
      .filter((m: any) => m.targetPi != null)
      .map((m: any) => `${m.targetPi}_${m.targetK}`);

    // Build Players Dashboard Bar
    let playersHtml = '<div class="mybad-players-bar">';
    C.names.forEach((name: string, pi: number) => {
      const colorIdx = g.playerColor(pi, totalPlayers);
      const cfg = MYBAD_COLORS[colorIdx];
      const isActive = curPlayer === pi && !S.over;
      const pw = S.pawns[pi] || [-1, -1, -1, -1];
      const atStart = pw.filter((p: number) => p === -1).length;
      const atHome = pw.filter((p: number) => p === 105).length;
      const inSafety = pw.filter((p: number) => p >= 100 && p <= 104).length;
      const onTrack = 4 - atStart - atHome - inSafety;

      playersHtml += `
        <div class="mybad-player-card ${isActive ? 'active' : ''}">
          <div class="mybad-player-dot" style="background:${cfg.hex}; color:${cfg.hex};"></div>
          <div class="mybad-player-info">
            <span class="mybad-player-name" style="color:${cfg.hex};">${esc(name)}</span>
            <span class="mybad-player-stats">${atHome === 4 ? '🏆 WINNER!' : `🏠${atStart} 📍${onTrack} 🛡️${inSafety} 🏁${atHome}`}</span>
          </div>
        </div>
      `;
    });
    playersHtml += '</div>';

    // Build SVG Board
    let svg = '<svg viewBox="0 0 640 640" class="mybad-svg">';
    // Gradients & Filters
    svg += '<defs>';
    // Pawn Gradients
    MYBAD_COLORS.forEach((cfg, ci) => {
      svg += `
        <radialGradient id="pawnGrad_${ci}" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
          <stop offset="35%" stop-color="${cfg.hex}" />
          <stop offset="100%" stop-color="${cfg.dark}" />
        </radialGradient>
      `;
    });
    svg += `
      <radialGradient id="boardBgGrad" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="65%" stop-color="#fdfbf7" />
        <stop offset="100%" stop-color="#f3ede2" />
      </radialGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>`;

    // 1. Board base surface & borders
    svg += `
      <!-- Outer Board Frame -->
      <rect x="2" y="2" width="636" height="636" rx="20" fill="#0f172a" stroke="#d97706" stroke-width="3" />
      <!-- Inner Board Surface -->
      <rect x="14" y="14" width="612" height="612" rx="14" fill="url(#boardBgGrad)" stroke="#1e293b" stroke-width="2" />
    `;

    // 2. Corner Player Color Quadrant Accents
    svg += `
      <rect x="14" y="14" width="160" height="160" fill="${MYBAD_COLORS[0].hex}" opacity="0.08" rx="14" />
      <rect x="466" y="14" width="160" height="160" fill="${MYBAD_COLORS[1].hex}" opacity="0.08" rx="14" />
      <rect x="466" y="466" width="160" height="160" fill="${MYBAD_COLORS[2].hex}" opacity="0.08" rx="14" />
      <rect x="14" y="466" width="160" height="160" fill="${MYBAD_COLORS[3].hex}" opacity="0.08" rx="14" />
    `;

    // 3. Central "MY BAD!" Medallion Logo
    svg += `
      <g transform="translate(320, 320)">
        <!-- Outer Diamond -->
        <rect x="-95" y="-95" width="190" height="190" rx="24" transform="rotate(45)" fill="#ffffff" stroke="#e11d48" stroke-width="4" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))" />
        <rect x="-85" y="-85" width="170" height="170" rx="18" transform="rotate(45)" fill="#fff1f2" stroke="#fb7185" stroke-width="1.5" />
        <!-- Badge Text -->
        <text x="0" y="-12" font-size="34" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" fill="#e11d48" letter-spacing="-1">MY BAD!</text>
        <text x="0" y="14" font-size="9.5" font-weight="800" font-family="system-ui, sans-serif" text-anchor="middle" fill="#475569" letter-spacing="1">SWEET REVENGE</text>
        <!-- Decorative flourish icons -->
        <text x="-48" y="-9" font-size="14" text-anchor="middle">😈</text>
        <text x="48" y="-9" font-size="14" text-anchor="middle">😈</text>
      </g>
    `;

    // 4. Perimeter Track Spaces (60 spaces)
    MYBAD_TRACK_COORDS.forEach((pt, idx) => {
      const isStartEntry = MYBAD_START_ENTRY.includes(idx);
      const isTurnSpace = MYBAD_TURN_SPACES.includes(idx);
      const startColorIdx = MYBAD_START_ENTRY.indexOf(idx);
      const turnColorIdx = MYBAD_TURN_SPACES.indexOf(idx);

      let fill = '#ffffff';
      let stroke = '#cbd5e1';
      let strokeW = 1.2;

      if (isStartEntry) {
        fill = MYBAD_COLORS[startColorIdx].bg;
        stroke = MYBAD_COLORS[startColorIdx].hex;
        strokeW = 2;
      } else if (isTurnSpace) {
        fill = MYBAD_COLORS[turnColorIdx].bg;
        stroke = MYBAD_COLORS[turnColorIdx].hex;
        strokeW = 2;
      }

      svg += `
        <rect x="${pt.x - 16}" y="${pt.y - 16}" width="32" height="32" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />
      `;

      if (isStartEntry) {
        svg += `<text x="${pt.x}" y="${pt.y + 4}" font-size="10" font-weight="900" text-anchor="middle" fill="${MYBAD_COLORS[startColorIdx].hex}">▶</text>`;
      } else if (isTurnSpace) {
        svg += `<text x="${pt.x}" y="${pt.y + 4}" font-size="11" font-weight="900" text-anchor="middle" fill="${MYBAD_COLORS[turnColorIdx].hex}">★</text>`;
      } else {
        svg += `<text x="${pt.x}" y="${pt.y + 3.5}" font-size="8" font-weight="700" text-anchor="middle" fill="#94a3b8">${idx}</text>`;
      }
    });

    // 5. Official Slides graphics
    MYBAD_SLIDES.forEach(slide => {
      const cfg = MYBAD_COLORS[slide.owner];
      const startPt = MYBAD_TRACK_COORDS[slide.start];
      const endPt = MYBAD_TRACK_COORDS[slide.end];

      // Draw slide track connector
      svg += `
        <line x1="${startPt.x}" y1="${startPt.y}" x2="${endPt.x}" y2="${endPt.y}" stroke="${cfg.hex}" stroke-width="7" stroke-linecap="round" opacity="0.85" />
        <!-- Start Triangle -->
        <circle cx="${startPt.x}" cy="${startPt.y}" r="9" fill="${cfg.hex}" stroke="#ffffff" stroke-width="1.5" />
        <!-- End Target Circle -->
        <circle cx="${endPt.x}" cy="${endPt.y}" r="11" fill="#ffffff" stroke="${cfg.hex}" stroke-width="3" />
        <circle cx="${endPt.x}" cy="${endPt.y}" r="4" fill="${cfg.hex}" />
      `;
    });

    // 6. Safety Zones (5 spaces each) & HOME & START bases
    MYBAD_COLORS.forEach((cfg, ci) => {
      // Connect Turn Space to Safety Zone to Home with glowing line
      const turnPt = MYBAD_TRACK_COORDS[MYBAD_TURN_SPACES[ci]];
      const homeCenter = MYBAD_HOME_CENTERS[ci];
      svg += `
        <line x1="${turnPt.x}" y1="${turnPt.y}" x2="${homeCenter.x}" y2="${homeCenter.y}" stroke="${cfg.hex}" stroke-width="5" stroke-linecap="round" opacity="0.3" stroke-dasharray="4 4" />
      `;

      // 5 Safety Zone Spaces
      MYBAD_SAFETY_COORDS[ci].forEach((pt, sIdx) => {
        svg += `
          <rect x="${pt.x - 15}" y="${pt.y - 15}" width="30" height="30" rx="7" fill="${cfg.hex}" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
          <text x="${pt.x}" y="${pt.y + 4}" font-size="10" font-weight="900" text-anchor="middle" fill="#ffffff">${sIdx + 1}</text>
        `;
      });

      // START Base Circle
      const startCenter = MYBAD_START_CENTERS[ci];
      svg += `
        <g transform="translate(${startCenter.x}, ${startCenter.y})">
          <circle cx="0" cy="0" r="38" fill="#ffffff" stroke="${cfg.hex}" stroke-width="3.5" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))" />
          <circle cx="0" cy="0" r="34" fill="${cfg.bg}" stroke="${cfg.hex}" stroke-width="1" stroke-dasharray="3 3" />
          <text x="0" y="-2" font-size="11" font-weight="900" text-anchor="middle" fill="${cfg.hex}" letter-spacing="1">START</text>
          <!-- 4 Rest Sockets -->
          <circle cx="-11" cy="-11" r="5" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1" />
          <circle cx="11" cy="-11" r="5" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1" />
          <circle cx="-11" cy="11" r="5" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1" />
          <circle cx="11" cy="11" r="5" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1" />
        </g>
      `;

      // HOME Base Circle
      svg += `
        <g transform="translate(${homeCenter.x}, ${homeCenter.y})">
          <circle cx="0" cy="0" r="42" fill="#ffffff" stroke="${cfg.hex}" stroke-width="4" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.12))" />
          <circle cx="0" cy="0" r="37" fill="${cfg.bg}" stroke="${cfg.hex}" stroke-width="1.5" />
          <text x="0" y="-1" font-size="13" font-weight="900" text-anchor="middle" fill="${cfg.hex}" letter-spacing="1">HOME</text>
          <!-- 4 Victory Sockets -->
          <circle cx="-11" cy="-11" r="6" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1.2" />
          <circle cx="11" cy="-11" r="6" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1.2" />
          <circle cx="-11" cy="11" r="6" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1.2" />
          <circle cx="11" cy="11" r="6" fill="#ffffff" stroke="${cfg.hex}" stroke-width="1.2" />
        </g>
      `;
    });

    // 7. Render Pawns
    S.pawns.forEach((pw: number[], pi: number) => {
      const colorIdx = g.playerColor(pi, totalPlayers);
      const cfg = MYBAD_COLORS[colorIdx];
      pw.forEach((p: number, k: number) => {
        const pt = g.getPawnCoord(colorIdx, k, p);
        const isCurrentPlayer = curPlayer === pi;
        const isMovable = isCurrentPlayer && isMyTurn && movablePawnIndices.includes(k);
        const isTarget = targetOpponents.includes(`${pi}_${k}`);
        const isSelected = S.selPawn === k && isCurrentPlayer;

        svg += `
          <g class="mybad-pawn-group ${isMovable ? 'movable' : ''} ${isTarget ? 'target' : ''}" data-pi="${pi}" data-k="${k}">
            <!-- Contact shadow -->
            <ellipse cx="${pt.x + 0.8}" cy="${pt.y + 6.5}" rx="8.5" ry="4" fill="rgba(0,0,0,0.3)" />
            <!-- Flared conical base with lip -->
            <ellipse cx="${pt.x}" cy="${pt.y + 5.5}" rx="7.5" ry="3.2" fill="${cfg.dark}" />
            <ellipse cx="${pt.x}" cy="${pt.y + 4.2}" rx="6.8" ry="2.6" fill="${cfg.hex}" />
            <!-- Tapered stem path -->
            <path d="M ${pt.x - 3.8} ${pt.y + 4} C ${pt.x - 3.2} ${pt.y - 1}, ${pt.x - 2.2} ${pt.y - 5.5}, ${pt.x - 4} ${pt.y - 7.5} L ${pt.x + 4} ${pt.y - 7.5} C ${pt.x + 2.2} ${pt.y - 5.5}, ${pt.x + 3.2} ${pt.y - 1}, ${pt.x + 3.8} ${pt.y + 4} Z" fill="url(#pawnGrad_${colorIdx})" stroke="${cfg.dark}" stroke-width="0.8" />
            <!-- Neck collar ring -->
            <ellipse cx="${pt.x}" cy="${pt.y - 7.5}" rx="4.2" ry="1.6" fill="${cfg.dark}" />
            <ellipse cx="${pt.x}" cy="${pt.y - 8}" rx="3.5" ry="1.2" fill="#ffffff" opacity="0.4" />
            <!-- Spherical head -->
            <circle cx="${pt.x}" cy="${pt.y - 11.5}" r="6.5" fill="url(#pawnGrad_${colorIdx})" stroke="${cfg.dark}" stroke-width="0.8" />
            <!-- Shiny specular highlight on head -->
            <ellipse cx="${pt.x - 2}" cy="${pt.y - 13.5}" rx="2.2" ry="1.4" fill="#ffffff" opacity="0.75" />
            <!-- Movable pulse ring -->
            ${isMovable ? `<circle cx="${pt.x}" cy="${pt.y - 4}" r="15" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-dasharray="4 2" class="mybad-pulse-ring" />` : ''}
            <!-- Selected halo -->
            ${isSelected ? `<circle cx="${pt.x}" cy="${pt.y - 4}" r="17" fill="none" stroke="#10b981" stroke-width="2.5" />` : ''}
            <!-- Target crosshair -->
            ${isTarget ? `<circle cx="${pt.x}" cy="${pt.y - 4}" r="16" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" stroke-width="2.2" stroke-dasharray="3 2" class="mybad-pulse-ring" />` : ''}
          </g>
        `;
      });
    });

    svg += '</svg>';

    // Build Card Play & Draw Section
    const curCard = S.card;
    const meta = curCard != null ? (MYBAD_CARD_META[String(curCard)] || { title: String(curCard), desc: '' }) : null;
    const isSpecialCard = curCard === 'MYBAD';

    let cardHtml = '';
    if (curCard != null && meta) {
      cardHtml = `
        <div class="mybad-card-box mybad-drawn-card ${isSpecialCard ? 'mybad-special' : ''}">
          <div class="mybad-card-index top-left">
            <span>${meta.title === 'MY BAD!' ? '😈' : meta.title}</span>
          </div>
          <div class="mybad-card-center">
            ${isSpecialCard ? `
              <div class="mybad-card-special-badge">MY BAD!</div>
            ` : `
              <div class="mybad-card-number">${meta.title}</div>
            `}
            ${meta.sub ? `<div class="mybad-card-sub">${meta.sub}</div>` : ''}
            <div class="mybad-card-desc">${meta.desc}</div>
          </div>
          <div class="mybad-card-index bottom-right">
            <span>${meta.title === 'MY BAD!' ? '😈' : meta.title}</span>
          </div>
        </div>
      `;
    } else {
      // Show top of discard pile if any
      const topDiscard = S.discard.length > 0 ? S.discard[S.discard.length - 1] : null;
      const dMeta = topDiscard != null ? MYBAD_CARD_META[String(topDiscard)] : null;
      if (dMeta) {
        cardHtml = `
          <div class="mybad-card-box mybad-drawn-card" style="opacity:0.55; transform:scale(0.95);">
            <div class="mybad-card-center">
              <div style="font-size:10px; color:#64748b; font-weight:800; text-transform:uppercase;">Last Played</div>
              <div style="font-size:28px; font-weight:900; color:#475569;">${dMeta.title}</div>
            </div>
          </div>
        `;
      } else {
        cardHtml = `
          <div class="mybad-card-box" style="border:2px dashed rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; text-align:center; padding:10px; color:#64748b; font-size:11px; font-weight:700;">
            Drawn card will appear here
          </div>
        `;
      }
    }

    // Choice Pills for Multi-Action cards (10, 11, 7, etc.)
    let choicePillsHtml = '';
    if (isMyTurn && curCard != null) {
      if (curCard === 10) {
        const hasFwd = allMoves.some((m: any) => m.type === 'forward');
        const hasBack = allMoves.some((m: any) => m.type === 'back');
        if (hasFwd && hasBack) {
          choicePillsHtml = `
            <div class="mybad-choice-pills">
              <button class="mybad-choice-btn ${S.cardMode !== 'back' ? 'active' : ''}" data-mode="forward">▶ Move 10 Forward</button>
              <button class="mybad-choice-btn ${S.cardMode === 'back' ? 'active' : ''}" data-mode="back">◀ Move 1 BACKWARD</button>
            </div>
          `;
        }
      } else if (curCard === 11) {
        const hasFwd = allMoves.some((m: any) => m.type === 'forward');
        const hasSwap = allMoves.some((m: any) => m.type === 'swap');
        if (hasFwd && hasSwap) {
          choicePillsHtml = `
            <div class="mybad-choice-pills">
              <button class="mybad-choice-btn ${S.cardMode !== 'swap' ? 'active' : ''}" data-mode="forward">▶ Move 11 Forward</button>
              <button class="mybad-choice-btn ${S.cardMode === 'swap' ? 'active' : ''}" data-mode="swap">🔄 Swap with Rival</button>
            </div>
          `;
        }
      } else if (curCard === 1 || curCard === 2) {
        const hasStart = allMoves.some((m: any) => m.type === 'start');
        const hasFwd = allMoves.some((m: any) => m.type === 'forward');
        if (hasStart && hasFwd) {
          choicePillsHtml = `
            <div class="mybad-choice-pills">
              <button class="mybad-choice-btn ${S.cardMode !== 'forward' ? 'active' : ''}" data-mode="start">🏠 Exit START</button>
              <button class="mybad-choice-btn ${S.cardMode === 'forward' ? 'active' : ''}" data-mode="forward">▶ Move ${curCard} Forward</button>
            </div>
          `;
        }
      }
    }

    // Action controls (Draw button vs Prompt vs Pass)
    let actionControls = '';
    if (isMyTurn) {
      if (curCard == null) {
        actionControls = `
          <button class="mybad-draw-btn" id="mybadDrawBtn">
            🃏 Draw Card (${esc(C.seatName(curPlayer))})
          </button>
        `;
      } else if (allMoves.length === 0) {
        actionControls = `
          <div class="mybad-prompt-text" style="color:#ef4444;">No legal moves with this card!</div>
          <button class="mybad-pass-btn" id="mybadPassBtn">Pass Turn</button>
        `;
      } else {
        const promptText = curCard === 'MYBAD'
          ? '😈 Tap any glowing opponent pawn on track to bump them!'
          : (S.cardMode === 'swap'
            ? '🔄 Tap a rival on track to swap places!'
            : '✨ Tap any pulsing golden pawn on board to move!');
        actionControls = `
          <div class="mybad-prompt-text">${promptText}</div>
        `;
      }
    } else if (!S.over) {
      actionControls = `
        <div class="mybad-prompt-text" style="color:#94a3b8;">
          Waiting for ${esc(C.seatName(curPlayer))}...
        </div>
      `;
    }

    // Assemble Full HTML
    const html = `
      <div class="mybad-container">
        ${turnBanner(C)}
        ${playersHtml}
        <div class="mybad-game-body">
          <div class="mybad-board-wrap">
            ${svg}
          </div>
          <div class="mybad-side-panel">
            <div class="mybad-deck-section">
              <!-- Draw Pile Deck -->
              <div class="mybad-card-box mybad-card-draw-pile" id="mybadDrawPile" title="Tap to draw a card">
                <div style="font-size:26px;">🃏</div>
                <div style="font-size:13px; font-weight:900; color:#fef3c7; margin-top:4px;">MY BAD!</div>
                <div style="font-size:10px; color:#fcd34d; font-weight:700;">${S.deck.length} cards left</div>
              </div>
              <!-- Drawn Card Display -->
              ${cardHtml}
            </div>

            <div class="mybad-action-box">
              ${choicePillsHtml}
              ${actionControls}
              <div class="mybad-log-text">${esc(S.log || '')}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    R.innerHTML = html;

    // Attach Click Handlers
    // 1. Draw Card button
    const drawBtn = $('#mybadDrawBtn');
    const drawPile = $('#mybadDrawPile');
    const doDraw = () => {
      if (!isMyTurn || S.card != null) return;
      if (!S.deck.length) {
        const d: any[] = [];
        MYBAD_DECK_PRESET.forEach((v: any) => d.push(v));
        shuffle(d);
        S.deck = d;
        S.discard = [];
      }
      S.card = S.deck.pop();
      S.cardMode = 'default';
      S.selPawn = -1;
      Sound.card();
      const cardName = S.card === 'MYBAD' ? 'MY BAD!' : `Card ${S.card}`;
      S.log = `🃏 Drawn: ${cardName}!`;
      C.update(() => {});
      maybeCpu(C);
    };

    if (drawBtn) drawBtn.onclick = doDraw;
    if (drawPile && isMyTurn && S.card == null) drawPile.onclick = doDraw;

    // 2. Pass button
    const passBtn = $('#mybadPassBtn');
    if (passBtn) {
      passBtn.onclick = () => {
        toast(`${esc(C.seatName(curPlayer))} had no legal moves and passed.`);
        g.endTurn(C);
      };
    }

    // 3. Mode Switcher Pills (Card 10, 11, etc.)
    R.querySelectorAll('.mybad-choice-btn[data-mode]').forEach((btn: any) => {
      btn.onclick = () => {
        S.cardMode = btn.dataset.mode;
        C.update(() => {});
      };
    });

    // 4. Pawn clicks on SVG
    R.querySelectorAll('.mybad-pawn-group').forEach((el: any) => {
      const pi = +el.dataset.pi;
      const k = +el.dataset.k;

      if (!isMyTurn || S.card == null) return;

      // Case A: Clicking own movable pawn
      if (pi === curPlayer && movablePawnIndices.includes(k)) {
        el.onclick = () => {
          // If this card is Card 11 swap or MYBAD, we need target opponent!
          // Find matching moves for pawn k
          const pawnMoves = filteredMoves.filter((m: any) => m.k === k);
          if (pawnMoves.length === 0) return;

          if (pawnMoves.length === 1 && !pawnMoves[0].targetPi) {
            // Unambiguous direct move!
            g.executeMove(C, pawnMoves[0]);
          } else if (pawnMoves.some((m: any) => m.type === 'swap' || m.type === 'mybad')) {
            // Select pawn k and prompt to click target opponent
            S.selPawn = k;
            toast('Now tap the opponent pawn you want to target!');
            C.update(() => {});
          } else {
            // First valid move
            g.executeMove(C, pawnMoves[0]);
          }
        };
      }

      // Case B: Clicking opponent target pawn (for MY BAD or Card 11 swap)
      if (pi !== curPlayer && targetOpponents.includes(`${pi}_${k}`)) {
        el.onclick = () => {
          // Find the matching move
          let matchingMove: any = null;
          if (S.selPawn !== -1) {
            matchingMove = filteredMoves.find((m: any) => m.k === S.selPawn && m.targetPi === pi && m.targetK === k);
          }
          if (!matchingMove) {
            matchingMove = filteredMoves.find((m: any) => m.targetPi === pi && m.targetK === k);
          }
          if (matchingMove) {
            g.executeMove(C, matchingMove);
          }
        };
      }
    });
  },
  cpu(C: any) {
    const g = this, S = C.S, curPlayer = S.turn;
    const totalPlayers = C.names.length;
    const colorIdx = g.playerColor(curPlayer, totalPlayers);

    // Step 1: Draw Card if not yet drawn
    if (S.card == null) {
      setTimeout(() => {
        if (!S.deck.length) {
          const d: any[] = [];
          MYBAD_DECK_PRESET.forEach((v: any) => d.push(v));
          shuffle(d);
          S.deck = d;
          S.discard = [];
        }
        S.card = S.deck.pop();
        S.cardMode = 'default';
        S.selPawn = -1;
        Sound.card();
        const cardName = S.card === 'MYBAD' ? 'MY BAD!' : `Card ${S.card}`;
        S.log = `🤖 ${esc(C.seatName(curPlayer))} drew ${cardName}!`;
        C.update(() => {});
        maybeCpu(C);
      }, 500);
      return;
    }

    // Step 2: Evaluate legal moves and pick the best strategic action
    setTimeout(() => {
      const moves = g.legalMoves(C);
      if (moves.length === 0) {
        toast(`${esc(C.seatName(curPlayer))} had no legal moves and passed.`);
        g.endTurn(C);
        return;
      }

      // Evaluate heuristic scores for each move
      let bestMove = moves[0];
      let bestScore = -9999;

      moves.forEach((m: any) => {
        let score = Math.random() * 3; // slight variance
        const myPawns = S.pawns[curPlayer];
        const curPos = myPawns[m.k];
        const dest = m.dest;

        // Winning move (all 4 pawns home)
        const willBeHomeCount = myPawns.filter((p: number, idx: number) => (idx === m.k ? dest : p) === 105).length;
        if (willBeHomeCount === 4) score += 1000;

        // Pawn reaches Home
        if (dest === 105) score += 120;

        // Pawn enters Safety Zone
        if (dest >= 100 && dest <= 104) score += 50 + (dest - 100) * 8;

        // MY BAD! card bump
        if (m.type === 'mybad') {
          score += 90;
          // Bonus if bumped target was close to their home
          const targetColor = g.playerColor(m.targetPi, totalPlayers);
          const targetTurn = MYBAD_TURN_SPACES[targetColor];
          const distToFinish = (targetTurn - dest + 60) % 60;
          if (distToFinish < 15) score += 40; // bump rival near their home stretch!
        }

        // Card 11 swap
        if (m.type === 'swap') {
          score += 45;
          // Swap is great if rival is ahead and we are behind
          const targetColor = g.playerColor(m.targetPi, totalPlayers);
          const targetTurn = MYBAD_TURN_SPACES[targetColor];
          const myTurn = MYBAD_TURN_SPACES[colorIdx];
          const myDist = (myTurn - curPos + 60) % 60;
          const myNewDist = (myTurn - dest + 60) % 60;
          if (myNewDist < myDist) score += (myDist - myNewDist) * 2;
        }

        // Slide leap
        if (dest < 60) {
          const slide = MYBAD_SLIDES.find(s => s.start === dest);
          if (slide && slide.owner !== colorIdx) {
            score += 70; // Big bonus for taking a slide!
          }
        }

        // Bump opponent on track
        if (dest < 60) {
          for (let oi = 0; oi < totalPlayers; oi++) {
            if (oi !== curPlayer && S.pawns[oi].includes(dest)) {
              score += 65;
            }
          }
        }

        // Leave Start on 1 or 2
        if (m.type === 'start') {
          score += 40;
        }

        // Card 4 backward from Start entry space (space 4) -> space 0 (right behind Turn Space 2!)
        if (m.type === 'back' && m.dist === 4) {
          const dToTurn = (MYBAD_TURN_SPACES[colorIdx] - dest + 60) % 60;
          if (dToTurn <= 3) score += 80; // Classic Sorry back-4 strategy shortcut!
        }

        // General forward progress
        if (m.type === 'forward') {
          score += m.dist * 2.5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
      });

      g.executeMove(C, bestMove);
    }, 700);
  }
});

/* ================= ENTERPRISE (GLOBAL MONOPOLY) ================= */
const ENTERPRISE_COLORS: Record<string, string> = {
  brown: '#8B5A2B',
  lightblue: '#38bdf8',
  pink: '#ec4899',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  darkblue: '#3b82f6',
  transit: '#64748b',
  util: '#a855f7'
};

const ENTERPRISE_SPACES = [
  // Bottom row: Col 11 down to 1
  { id: 0, r: 11, c: 11, t: 'go', n: 'GO', short: 'GO', icon: '🏁' },
  { id: 1, r: 11, c: 10, t: 'prop', n: 'Greece', short: 'Greece', flag: '🇬🇷', color: ENTERPRISE_COLORS.brown, group: 'brown', price: 60, rent: 12 },
  { id: 2, r: 11, c: 9, t: 'riches', n: 'World Riches', short: 'Riches', icon: '💎' },
  { id: 3, r: 11, c: 8, t: 'prop', n: 'Egypt', short: 'Egypt', flag: '🇪🇬', color: ENTERPRISE_COLORS.brown, group: 'brown', price: 60, rent: 12 },
  { id: 4, r: 11, c: 7, t: 'tax', n: 'World Trade Tariff', short: 'Tariff', icon: '📉', amt: 200 },
  { id: 5, r: 11, c: 6, t: 'transit', n: 'Trans-Atlantic Port', short: 'Port', icon: '✈️', color: ENTERPRISE_COLORS.transit, group: 'transit', price: 200, rent: 50 },
  { id: 6, r: 11, c: 5, t: 'prop', n: 'Thailand', short: 'Thailand', flag: '🇹🇭', color: ENTERPRISE_COLORS.lightblue, group: 'lightblue', price: 100, rent: 20 },
  { id: 7, r: 11, c: 4, t: 'risks', n: 'Risks', short: 'Risks', icon: '⚡' },
  { id: 8, r: 11, c: 3, t: 'prop', n: 'Vietnam', short: 'Vietnam', flag: '🇻🇳', color: ENTERPRISE_COLORS.lightblue, group: 'lightblue', price: 100, rent: 20 },
  { id: 9, r: 11, c: 2, t: 'prop', n: 'Philippines', short: 'Philippines', flag: '🇵🇭', color: ENTERPRISE_COLORS.lightblue, group: 'lightblue', price: 120, rent: 24 },
  { id: 10, r: 11, c: 1, t: 'jail', n: 'In Custody / Visiting', short: 'Custody', icon: '🚔' },

  // Left col: Row 10 up to 2
  { id: 11, r: 10, c: 1, t: 'prop', n: 'Mexico', short: 'Mexico', flag: '🇲🇽', color: ENTERPRISE_COLORS.pink, group: 'pink', price: 140, rent: 28 },
  { id: 12, r: 9, c: 1, t: 'util', n: 'Global Power Grid', short: 'Power', icon: '⚡', color: ENTERPRISE_COLORS.util, group: 'util', price: 150, rent: 35 },
  { id: 13, r: 8, c: 1, t: 'prop', n: 'Argentina', short: 'Argentina', flag: '🇦🇷', color: ENTERPRISE_COLORS.pink, group: 'pink', price: 140, rent: 28 },
  { id: 14, r: 7, c: 1, t: 'prop', n: 'Brazil', short: 'Brazil', flag: '🇧🇷', color: ENTERPRISE_COLORS.pink, group: 'pink', price: 160, rent: 32 },
  { id: 15, r: 6, c: 1, t: 'transit', n: 'Euro-Asia Express', short: 'Express', icon: '🚄', color: ENTERPRISE_COLORS.transit, group: 'transit', price: 200, rent: 50 },
  { id: 16, r: 5, c: 1, t: 'prop', n: 'Spain', short: 'Spain', flag: '🇪🇸', color: ENTERPRISE_COLORS.orange, group: 'orange', price: 180, rent: 36 },
  { id: 17, r: 4, c: 1, t: 'riches', n: 'World Riches', short: 'Riches', icon: '💎' },
  { id: 18, r: 3, c: 1, t: 'prop', n: 'Italy', short: 'Italy', flag: '🇮🇹', color: ENTERPRISE_COLORS.orange, group: 'orange', price: 180, rent: 36 },
  { id: 19, r: 2, c: 1, t: 'prop', n: 'France', short: 'France', flag: '🇫🇷', color: ENTERPRISE_COLORS.orange, group: 'orange', price: 200, rent: 40 },
  { id: 20, r: 1, c: 1, t: 'parking', n: 'Global Summit', short: 'Summit', icon: '🅿️' },

  // Top row: Col 2 right to 10
  { id: 21, r: 1, c: 2, t: 'prop', n: 'Australia', short: 'Australia', flag: '🇦🇺', color: ENTERPRISE_COLORS.red, group: 'red', price: 220, rent: 44 },
  { id: 22, r: 1, c: 3, t: 'risks', n: 'Risks', short: 'Risks', icon: '⚡' },
  { id: 23, r: 1, c: 4, t: 'prop', n: 'South Korea', short: 'S. Korea', flag: '🇰🇷', color: ENTERPRISE_COLORS.red, group: 'red', price: 220, rent: 44 },
  { id: 24, r: 1, c: 5, t: 'prop', n: 'Canada', short: 'Canada', flag: '🇨🇦', color: ENTERPRISE_COLORS.red, group: 'red', price: 240, rent: 48 },
  { id: 25, r: 1, c: 6, t: 'transit', n: 'Pacific Shipping', short: 'Shipping', icon: '🚢', color: ENTERPRISE_COLORS.transit, group: 'transit', price: 200, rent: 50 },
  { id: 26, r: 1, c: 7, t: 'prop', n: 'Germany', short: 'Germany', flag: '🇩🇪', color: ENTERPRISE_COLORS.yellow, group: 'yellow', price: 260, rent: 52 },
  { id: 27, r: 1, c: 8, t: 'prop', n: 'United Kingdom', short: 'UK', flag: '🇬🇧', color: ENTERPRISE_COLORS.yellow, group: 'yellow', price: 260, rent: 52 },
  { id: 28, r: 1, c: 9, t: 'util', n: 'Satellite Telecom', short: 'Telecom', icon: '🛰️', color: ENTERPRISE_COLORS.util, group: 'util', price: 150, rent: 35 },
  { id: 29, r: 1, c: 10, t: 'prop', n: 'Sweden', short: 'Sweden', flag: '🇸🇪', color: ENTERPRISE_COLORS.yellow, group: 'yellow', price: 280, rent: 56 },
  { id: 30, r: 1, c: 11, t: 'gotojail', n: 'Go to Custody', short: 'Extradition', icon: '🚨' },

  // Right col: Row 2 down to 10
  { id: 31, r: 2, c: 11, t: 'prop', n: 'China', short: 'China', flag: '🇨🇳', color: ENTERPRISE_COLORS.green, group: 'green', price: 300, rent: 60 },
  { id: 32, r: 3, c: 11, t: 'prop', n: 'Japan', short: 'Japan', flag: '🇯🇵', color: ENTERPRISE_COLORS.green, group: 'green', price: 300, rent: 60 },
  { id: 33, r: 4, c: 11, t: 'riches', n: 'World Riches', short: 'Riches', icon: '💎' },
  { id: 34, r: 5, c: 11, t: 'prop', n: 'Switzerland', short: 'Switzerland', flag: '🇨🇭', color: ENTERPRISE_COLORS.green, group: 'green', price: 320, rent: 64 },
  { id: 35, r: 6, c: 11, t: 'transit', n: 'Global Orbit', short: 'Orbit', icon: '🚀', color: ENTERPRISE_COLORS.transit, group: 'transit', price: 200, rent: 50 },
  { id: 36, r: 7, c: 11, t: 'risks', n: 'Risks', short: 'Risks', icon: '⚡' },
  { id: 37, r: 8, c: 11, t: 'prop', n: 'United Arab Emirates', short: 'UAE', flag: '🇦🇪', color: ENTERPRISE_COLORS.darkblue, group: 'darkblue', price: 350, rent: 70 },
  { id: 38, r: 9, c: 11, t: 'tax', n: 'Luxury Wealth Tax', short: 'Wealth Tax', icon: '🏛️', amt: 100 },
  { id: 39, r: 10, c: 11, t: 'prop', n: 'United States', short: 'USA', flag: '🇺🇸', color: ENTERPRISE_COLORS.darkblue, group: 'darkblue', price: 400, rent: 80 }
];

const ENTERPRISE_GROUPS: Record<string, number[]> = {
  brown: [1, 3],
  lightblue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  darkblue: [37, 39],
  transit: [5, 15, 25, 35],
  util: [12, 28]
};

const ENTERPRISE_RISKS = [
  { title: 'Diplomatic Envoy', desc: 'Sovereign treaty signed! Advance straight to GO (+ $200).', go: 0 },
  { title: 'Superpower Summit', desc: 'Direct trade mission! Advance to United States (Space 39).', to: 39 },
  { title: 'Trade Route Expansion', desc: 'Global logistics expansion! Advance to Trans-Atlantic Port (Space 5).', to: 5 },
  { title: 'Market Volatility Surge', desc: 'Bull Market equity rally! Collect $150 dividend.', amt: 150 },
  { title: 'Supply Chain Bottleneck', desc: 'Freight tariffs and delays. Pay $50 in surcharges.', amt: -50 },
  { title: 'Extradition Warrant', desc: 'Interpol inquiry! Go directly to Custody. Do not pass GO, do not collect $200.', jail: true },
  { title: 'Forex Arbitrage Dip', desc: 'Currency market dip: Retreat 3 spaces.', back: 3 },
  { title: 'Sovereign Bond Maturity', desc: 'Treasury reserve yields returns. Collect $100.', amt: 100 },
  { title: 'Infrastructure Upgrade', desc: 'Modernize global branches: Pay $25 per owned country.', perProp: 25 },
  { title: 'Tech Innovation Grant', desc: 'Global patent licensing surge! Collect $120.', amt: 120 }
];

const ENTERPRISE_RICHES = [
  { title: 'Sovereign Wealth Fund', desc: 'National treasury surplus distribution: Collect $200!', amt: 200 },
  { title: 'Clean Energy Grant', desc: 'International sustainability subsidy: Collect $100.', amt: 100 },
  { title: 'Free Trade Agreement', desc: 'Export tax exemption bonus: Collect $50 rebate.', amt: 50 },
  { title: 'World Economic Keynote', desc: 'Global industry honor! Every rival pays you $25.', fromEach: 25 },
  { title: 'Central Bank Dividend', desc: 'High-yield reserve matures: Collect $120.', amt: 120 },
  { title: 'Heritage Gala Donation', desc: 'Philanthropic global pledge: Donate $50.', amt: -50 },
  { title: 'Customs Clearance Bonus', desc: 'Audited trade clearance dividend: Collect $80.', amt: 80 },
  { title: 'Global Tourism Surge', desc: 'Record travel across your assets: Collect $100.', amt: 100 },
  { title: 'Offshore Arbitrage Rebate', desc: 'Favorable treaty settlement: Collect $60.', amt: 60 },
  { title: 'Pioneer Commercial Charter', desc: 'Sovereign charter granted: Advance to GO (+ $200)!', go: 0 }
];

const ENTERPRISE_TOKENS = ['🎩', '✈️', '🚢', '🏎️'];
const ENTERPRISE_COLORS_PLAYERS = ['#e74c3c', '#3498db', '#2ecc71', '#f5b942'];
const ENTERPRISE_PURCHASABLE_IDS = [
  1, 3, 5, 6, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 21, 23, 24, 25, 26, 27, 28, 29, 31, 32, 34, 35, 37, 39
];

stdInit('monopoly', {
  name: 'Enterprise',
  icon: '🌐',
  desc: 'Global empire & country trading',
  p: [2, 4],
  payout: PAYOUTS.monopoly,
  rules: 'Enterprise: Roll 2 dice to travel the 40-space world board. Acquire sovereign nations, ports, and energy grids. Draw ⚡ Risks & 💎 World Riches cards only when landed on their squares. Complete regional sets to double revenue & build HQs (🏢). Bankrupt rival tycoons or finish richest after 25 rounds!',
  SPACES: ENTERPRISE_SPACES,
  GROUPS: ENTERPRISE_GROUPS,
  RISKS: ENTERPRISE_RISKS,
  RICHES: ENTERPRISE_RICHES,
  PURCHASABLE: ENTERPRISE_PURCHASABLE_IDS,
  newState(C: any) {
    return {
      turn: 0,
      pos: C.names.map(() => 0),
      cash: C.names.map(() => 1500),
      owner: {} as Record<number, number>,
      hq: {} as Record<number, boolean>,
      alive: C.names.map(() => true),
      inJail: C.names.map(() => false),
      jailTurns: C.names.map(() => 0),
      round: 1,
      over: false,
      d1: 0,
      d2: 0,
      isDouble: false,
      doublesStreak: 0,
      pendingBuy: -1,
      inspectingSq: -1,
      pendingCardPick: null as 'risks' | 'riches' | null,
      cardPicked: false,
      activeCard: null as { deck: 'risks' | 'riches'; title: string; desc: string } | null,
      msg: 'Welcome to Enterprise! Tap "Roll Dice" to invest in global nations.'
    };
  },
  netWorth(S: any, i: number) {
    let w = S.cash[i];
    for (const k in S.owner) {
      if (S.owner[k] === i) {
        w += this.SPACES[+k].price || 0;
        if (S.hq[k]) w += 100;
      }
    }
    return w;
  },
  hasMonopoly(S: any, groupKey: string, ownerIdx: number): boolean {
    const list = this.GROUPS[groupKey];
    if (!list || list.length === 0) return false;
    return list.every((spaceId: number) => S.owner[spaceId] === ownerIdx);
  },
  calcRent(S: any, spaceId: number): number {
    const sp = this.SPACES[spaceId];
    const owner = S.owner[spaceId];
    if (owner == null) return 0;
    if (sp.t === 'prop') {
      let r = sp.rent || 0;
      if (sp.group && this.hasMonopoly(S, sp.group, owner)) {
        r *= 2;
        if (S.hq[spaceId]) r *= 2;
      }
      return r;
    }
    if (sp.t === 'transit') {
      const ownedCount = this.GROUPS.transit.filter((id: number) => S.owner[id] === owner).length;
      return [0, 50, 100, 150, 200][ownedCount] || 50;
    }
    if (sp.t === 'util') {
      const ownedCount = this.GROUPS.util.filter((id: number) => S.owner[id] === owner).length;
      return ownedCount >= 2 ? 90 : 40;
    }
    return 0;
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    const isHumanTurn = C.mine() && !S.over && S.alive[S.turn];

    let h = '<div class="enterprise-wrap">';
    h += turnBanner(C);
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">';
    h += '<h2 style="margin:0">🌐 Enterprise <span class="muted" style="font-size:13px">round ' + S.round + '/25</span></h2>';
    h += '<button class="btn secondary small" id="viewAllDeedsBtn" style="font-size:11px;padding:4px 10px">📋 Property Deeds (' + g.PURCHASABLE.length + ')</button>';
    h += '</div>';

    // The 11x11 Grid Board
    h += '<div class="enterprise-board">';

    // Render 40 perimeter spaces
    g.SPACES.forEach((sp: any) => {
      const isCorner = sp.t === 'go' || sp.t === 'jail' || sp.t === 'parking' || sp.t === 'gotojail';
      const o = S.owner[sp.id];
      const hasHq = S.hq[sp.id];
      const isCurSpace = S.pos[S.turn] === sp.id;
      const isInspect = S.inspectingSq === sp.id;

      // Pawns on this space
      let tokensHtml = '';
      S.pos.forEach((pos: number, pi: number) => {
        if (pos === sp.id && S.alive[pi]) {
          const tok = ENTERPRISE_TOKENS[pi % 4];
          const col = ENTERPRISE_COLORS_PLAYERS[pi % 4];
          tokensHtml += '<span class="ent-token" style="background:' + col + '" title="' + esc(C.seatName(pi)) + '">' + tok + '</span>';
        }
      });

      let sqClass = 'ent-sq';
      if (isCorner) sqClass += ' corner';
      if (isCurSpace) sqClass += ' active-sq';
      if (isInspect) sqClass += ' inspect-sq';

      let style = 'grid-row:' + sp.r + ';grid-column:' + sp.c + ';';
      if (o != null) {
        style += 'border-bottom: 3px solid ' + ENTERPRISE_COLORS_PLAYERS[o % 4] + ';';
      }

      h += '<div class="' + sqClass + '" data-id="' + sp.id + '" style="' + style + '" title="Tap to view Title Deed">';

      if (sp.t === 'prop') {
        h += '<div class="ent-color-band" style="background:' + sp.color + '"></div>';
        h += '<div class="ent-sq-flag">' + (sp.flag || '🏠') + (hasHq ? '🏢' : '') + '</div>';
        h += '<div class="ent-sq-name">' + esc(sp.short) + '</div>';
        h += '<div class="ent-sq-price">$' + sp.price + '</div>';
      } else if (sp.t === 'transit') {
        h += '<div class="ent-color-band" style="background:' + ENTERPRISE_COLORS.transit + '"></div>';
        h += '<div class="ent-sq-flag">' + sp.icon + '</div>';
        h += '<div class="ent-sq-name">' + esc(sp.short) + '</div>';
        h += '<div class="ent-sq-price">$' + sp.price + '</div>';
      } else if (sp.t === 'util') {
        h += '<div class="ent-color-band" style="background:' + ENTERPRISE_COLORS.util + '"></div>';
        h += '<div class="ent-sq-flag">' + sp.icon + '</div>';
        h += '<div class="ent-sq-name">' + esc(sp.short) + '</div>';
        h += '<div class="ent-sq-price">$' + sp.price + '</div>';
      } else if (sp.t === 'risks') {
        h += '<div class="ent-sq-flag">⚡</div><div class="ent-sq-name" style="color:#fb923c">RISKS</div><div style="font-size:6px;color:#9ca3af">CARD</div>';
      } else if (sp.t === 'riches') {
        h += '<div class="ent-sq-flag">💎</div><div class="ent-sq-name" style="color:#34d399">RICHES</div><div style="font-size:6px;color:#9ca3af">CARD</div>';
      } else if (sp.t === 'tax') {
        h += '<div class="ent-sq-flag">' + sp.icon + '</div><div class="ent-sq-name" style="color:#f87171">' + esc(sp.short) + '</div><div class="ent-sq-price">$' + sp.amt + '</div>';
      } else if (sp.t === 'go') {
        h += '<div class="ent-sq-flag">🏁</div><div class="ent-sq-name" style="color:#f59e0b;font-size:10px">GO</div><div class="ent-sq-price">+$200</div>';
      } else if (sp.t === 'jail') {
        h += '<div class="ent-sq-flag">🚔</div><div class="ent-sq-name" style="font-size:7px">CUSTODY</div><div style="font-size:6px;color:#9ca3af">VISITING</div>';
      } else if (sp.t === 'parking') {
        h += '<div class="ent-sq-flag">🅿️</div><div class="ent-sq-name" style="font-size:7px">SUMMIT</div><div style="font-size:6px;color:#9ca3af">REST</div>';
      } else if (sp.t === 'gotojail') {
        h += '<div class="ent-sq-flag">🚨</div><div class="ent-sq-name" style="color:#ef4444;font-size:7px">EXTRADITE</div><div style="font-size:6px;color:#ef4444">TO JAIL</div>';
      }

      if (tokensHtml) {
        h += '<div class="ent-tokens-dock">' + tokensHtml + '</div>';
      }

      h += '</div>';
    });

    // Center Board Hub (Grid Rows 2-10, Cols 2-10)
    h += '<div class="ent-center">';

    // Logo & Header
    h += '<div class="ent-logo-box">';
    h += '<div class="ent-logo-text">ENTERPRISE</div>';
    h += '<div class="ent-logo-sub">Global Sovereignty & Commerce</div>';
    h += '</div>';

    // Board Decks (Non-interactive unless landed on square)
    const isRiskPickPending = S.pendingCardPick === 'risks';
    const isRichesPickPending = S.pendingCardPick === 'riches';
    h += '<div class="ent-decks">';
    h += '<div class="ent-deck-card ent-deck-risks ' + (isRiskPickPending ? 'deck-glow' : 'non-interactive') + '" id="centerDeckRisks">';
    h += '⚡ <b>RISKS</b><div style="font-size:7.5px;opacity:.8">' + (isRiskPickPending ? '👉 Tap to Pick!' : 'Land to draw') + '</div></div>';
    h += '<div class="ent-deck-card ent-deck-riches ' + (isRichesPickPending ? 'deck-glow' : 'non-interactive') + '" id="centerDeckRiches">';
    h += '💎 <b>WORLD RICHES</b><div style="font-size:7.5px;opacity:.8">' + (isRichesPickPending ? '👉 Tap to Pick!' : 'Land to draw') + '</div></div>';
    h += '</div>';

    // Interactive Pick Prompt when landed on square (Only 1 card can be picked)
    if (S.pendingCardPick && !S.activeCard) {
      const isRiches = S.pendingCardPick === 'riches';
      h += '<div class="ent-card-pick-box" style="border: 2px solid ' + (isRiches ? '#10b981' : '#f97316') + '">';
      h += '<div style="font-weight:800;font-size:11.5px;color:' + (isRiches ? '#6ee7b7' : '#fdba74') + '">' + (isRiches ? '💎 LANDED ON WORLD RICHES' : '⚡ LANDED ON RISKS') + '</div>';
      if (isHumanTurn) {
        h += '<div style="font-size:10px;color:#e5e7eb;margin:4px 0">Pick your 1 sovereign event card:</div>';
        h += '<button class="btn small" id="pickCardBtn" style="background:' + (isRiches ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#ea580c,#c2410c)') + ';padding:5px 14px;font-size:11px;font-weight:700">🎴 Draw 1 Card</button>';
      } else {
        h += '<div style="font-size:10px;color:#9ca3af;margin-top:4px">' + esc(C.seatName(S.turn)) + ' is drawing 1 card...</div>';
      }
      h += '</div>';
    }

    // Active Card Drawn Display (Only 1 card shown with continue)
    if (S.activeCard) {
      const isRiches = S.activeCard.deck === 'riches';
      h += '<div class="ent-active-card-modal" style="border: 2px solid ' + (isRiches ? '#10b981' : '#f97316') + '">';
      h += '<div style="font-weight:800;font-size:12px;color:' + (isRiches ? '#6ee7b7' : '#fdba74') + '">' + (isRiches ? '💎 WORLD RICHES (1 Card)' : '⚡ RISKS (1 Card)') + '</div>';
      h += '<div style="font-weight:700;font-size:11px;margin:3px 0;color:#fff">' + esc(S.activeCard.title) + '</div>';
      h += '<div style="font-size:9.5px;color:#d1d5db;margin-bottom:6px;line-height:1.3">' + esc(S.activeCard.desc) + '</div>';
      if (isHumanTurn || S.over) {
        h += '<button class="btn small" id="dismissCardBtn" style="padding:4px 14px;font-size:10.5px">Continue</button>';
      } else {
        h += '<div class="muted" style="font-size:9px">Advancing...</div>';
      }
      h += '</div>';
    }

    // Dice & Action Controls (when not drawing card or reviewing pending buy)
    if (!S.over && S.pendingBuy < 0 && !S.activeCard && !S.pendingCardPick) {
      if (S.d1 > 0 && S.d2 > 0) {
        h += '<div class="ent-dice-display">';
        h += '<span>' + diceFace(S.d1) + '</span><span>' + diceFace(S.d2) + '</span>';
        h += '<span style="font-size:13px;font-weight:800;color:#fbbf24;margin-left:4px">(' + (S.d1 + S.d2) + ')' + (S.isDouble ? ' Doubles! 🎲' : '') + '</span>';
        h += '</div>';
      }

      if (isHumanTurn) {
        if (S.inJail[S.turn]) {
          h += '<div style="display:flex;gap:6px;margin-top:4px">';
          h += '<button class="btn small" id="rollBtn" style="font-size:10.5px">🎲 Roll for Doubles</button>';
          if (S.cash[S.turn] >= 50) {
            h += '<button class="btn secondary small" id="payBailBtn" style="font-size:10.5px">💵 Pay $50 Bail</button>';
          }
          h += '</div>';
        } else {
          h += '<button class="btn" id="rollBtn" style="font-size:12px;padding:6px 16px;margin-top:4px">🎲 Roll Dice (' + esc(C.seatName(S.turn)) + ')</button>';
        }
      } else if (!S.over) {
        h += '<div class="muted" style="font-size:10px;margin-top:4px">Waiting for ' + esc(C.seatName(S.turn)) + '...</div>';
      }
    }

    // Status Message Log
    if (S.msg) {
      h += '<div style="font-size:9.5px;color:#e5e7eb;margin-top:5px;font-weight:600;line-height:1.2;max-width:260px">' + esc(S.msg) + '</div>';
    }

    h += '</div>'; // End ent-center
    h += '</div>'; // End enterprise-board

    // Dedicated Title Deed Modal Backdrop (Opens whenever inspecting any space or deciding buy)
    const deedId = S.pendingBuy >= 0 ? S.pendingBuy : S.inspectingSq;
    if (deedId >= 0 && deedId < g.SPACES.length) {
      const sp = g.SPACES[deedId];
      const ownerIdx = S.owner[deedId];
      const hasHq = S.hq[deedId];
      const isMono = sp.group && ownerIdx != null ? g.hasMonopoly(S, sp.group, ownerIdx) : false;
      const curRent = g.calcRent(S, deedId);
      const isPurchasable = sp.t === 'prop' || sp.t === 'transit' || sp.t === 'util';
      const pIdx = g.PURCHASABLE.indexOf(deedId);

      h += '<div class="ent-deed-backdrop" id="deedBackdrop">';
      h += '<div class="ent-deed-card" id="deedCardContainer">';

      // Header with space color
      const hdrBg = sp.color || (sp.t === 'transit' ? ENTERPRISE_COLORS.transit : (sp.t === 'util' ? ENTERPRISE_COLORS.util : '#334155'));
      h += '<div class="ent-deed-header" style="background:' + hdrBg + '">';
      h += '<div class="ent-deed-suptitle">TITLE DEED</div>';
      h += '<div class="ent-deed-title">' + (sp.flag || sp.icon || '🏛️') + ' ' + esc(sp.n) + '</div>';
      h += '<div class="ent-deed-subtitle">' + (sp.group ? esc(sp.group.toUpperCase()) + ' REGIONAL SECTOR' : (sp.t === 'transit' ? 'GLOBAL TRANSIT PORT' : (sp.t === 'util' ? 'GLOBAL ENERGY UTILITY' : 'SPECIAL BOARD SPACE'))) + '</div>';
      h += '</div>';

      // Body
      h += '<div class="ent-deed-body">';

      if (sp.t === 'prop') {
        h += '<div class="ent-deed-rent-box">';
        h += '<div class="ent-deed-rent-highlight">RENT: $' + (ownerIdx != null ? curRent : sp.rent) + '</div>';
        h += '<div style="font-size:9.5px;color:#6b7280">Base Rate: $' + sp.rent + '</div>';
        h += '</div>';

        h += '<table class="ent-deed-rent-table">';
        h += '<tr><td>With Regional Monopoly Set (2×)</td><td>$' + (sp.rent * 2) + '</td></tr>';
        h += '<tr><td>With Enterprise HQ 🏢 (4×)</td><td>$' + (sp.rent * 4) + '</td></tr>';
        h += '<tr><td>Enterprise HQ Construction</td><td>$100 each</td></tr>';
        h += '<tr><td>Mortgage Value</td><td>$' + Math.round(sp.price / 2) + '</td></tr>';
        h += '<tr><td>Sovereignty Acquisition Price</td><td>$' + sp.price + '</td></tr>';
        h += '</table>';
      } else if (sp.t === 'transit') {
        h += '<div class="ent-deed-rent-box">';
        h += '<div class="ent-deed-rent-highlight">TARIFF: $' + (ownerIdx != null ? curRent : 50) + '</div>';
        h += '<div style="font-size:9.5px;color:#6b7280">Transit Port Network</div>';
        h += '</div>';

        h += '<table class="ent-deed-rent-table">';
        h += '<tr><td>Rent with 1 Transit Port</td><td>$50</td></tr>';
        h += '<tr><td>Rent with 2 Transit Ports</td><td>$100</td></tr>';
        h += '<tr><td>Rent with 3 Transit Ports</td><td>$150</td></tr>';
        h += '<tr><td>Rent with all 4 Ports</td><td>$200</td></tr>';
        h += '<tr><td>Sovereignty Acquisition Price</td><td>$' + sp.price + '</td></tr>';
        h += '</table>';
      } else if (sp.t === 'util') {
        h += '<div class="ent-deed-rent-box">';
        h += '<div class="ent-deed-rent-highlight">USAGE FEE: $' + (ownerIdx != null ? curRent : 40) + '</div>';
        h += '<div style="font-size:9.5px;color:#6b7280">Global Infrastructure Utility</div>';
        h += '</div>';

        h += '<table class="ent-deed-rent-table">';
        h += '<tr><td>Usage Fee if 1 Utility is Owned</td><td>$40</td></tr>';
        h += '<tr><td>Usage Fee if Both Utilities Owned</td><td>$90</td></tr>';
        h += '<tr><td>Sovereignty Acquisition Price</td><td>$' + sp.price + '</td></tr>';
        h += '</table>';
      } else {
        // Special space info
        h += '<div class="ent-deed-rent-box">';
        h += '<div class="ent-deed-rent-highlight">' + esc(sp.n) + '</div>';
        h += '<div style="font-size:10px;color:#4b5563;margin-top:4px">';
        if (sp.t === 'go') h += 'Collect $200 enterprise capital each time you complete a circuit or land on GO.';
        else if (sp.t === 'jail') h += 'Custody facility: Just visiting when passing, or held for bail/doubles if arrested.';
        else if (sp.t === 'parking') h += 'Global Summit: Neutral sovereign territory for strategic diplomacy and rest.';
        else if (sp.t === 'gotojail') h += 'Extradition order! Send directly to Custody. Do not pass GO, do not collect $200.';
        else if (sp.t === 'tax') h += 'Mandatory sovereign tax / tariff. Must pay $' + sp.amt + ' to the global treasury.';
        else if (sp.t === 'risks') h += '⚡ Risks Deck: Draw 1 card only when landing directly on this square.';
        else if (sp.t === 'riches') h += '💎 World Riches Deck: Draw 1 card only when landing directly on this square.';
        h += '</div></div>';
      }

      // Ownership Status Banner
      if (isPurchasable) {
        if (ownerIdx != null) {
          const oCol = ENTERPRISE_COLORS_PLAYERS[ownerIdx % 4];
          const oTok = ENTERPRISE_TOKENS[ownerIdx % 4];
          h += '<div class="ent-deed-status-bar" style="background:' + oCol + '20;border:1.5px solid ' + oCol + ';color:' + oCol + '">';
          h += '👑 Sovereign Control: ' + oTok + ' <b>' + esc(C.seatName(ownerIdx)) + '</b>';
          if (hasHq) h += ' · 🏢 Enterprise HQ';
          else if (isMono) h += ' · ⭐ Regional Monopoly (2× Rent)';
          h += '</div>';
        } else {
          h += '<div class="ent-deed-status-bar" style="background:#ecfdf5;border:1.5px solid #10b981;color:#047857">';
          h += '🟢 Unowned Sovereign Territory · Cost: <b>$' + sp.price + '</b>';
          h += '</div>';
        }
      }

      // Actions
      h += '<div class="ent-deed-actions">';
      if (S.pendingBuy === deedId && isHumanTurn) {
        h += '<button class="btn" id="buyBtn" style="font-size:11px;padding:6px 12px;background:linear-gradient(135deg,#059669,#047857)">💰 Acquire Territory ($' + sp.price + ')</button>';
        h += '<button class="btn secondary" id="passBtn" style="font-size:11px;padding:5px 12px">Pass Acquisition</button>';
      } else {
        if (isHumanTurn && ownerIdx === S.turn && isMono && !hasHq && sp.t === 'prop' && S.cash[S.turn] >= 100) {
          h += '<button class="btn" id="upgradeHqBtn" style="font-size:11px;padding:6px 12px;background:linear-gradient(135deg,#d97706,#b45309)">🏢 Construct Enterprise HQ ($100)</button>';
        }
        h += '<div class="ent-deed-nav-row">';
        if (pIdx >= 0) {
          const prevId = g.PURCHASABLE[(pIdx - 1 + g.PURCHASABLE.length) % g.PURCHASABLE.length];
          h += '<button class="btn secondary small" id="prevDeedBtn" data-target="' + prevId + '" style="font-size:10px;padding:4px 8px">◀ Prev</button>';
        } else {
          h += '<div></div>';
        }
        h += '<button class="btn small" id="closeDeedBtn" style="font-size:10.5px;padding:4px 14px">✖ Close Deed</button>';
        if (pIdx >= 0) {
          const nextId = g.PURCHASABLE[(pIdx + 1) % g.PURCHASABLE.length];
          h += '<button class="btn secondary small" id="nextDeedBtn" data-target="' + nextId + '" style="font-size:10px;padding:4px 8px">Next ▶</button>';
        } else {
          h += '<div></div>';
        }
        h += '</div>';
      }
      h += '</div>'; // End ent-deed-actions

      h += '</div>'; // End ent-deed-body
      h += '</div>'; // End ent-deed-card
      h += '</div>'; // End ent-deed-backdrop
    }

    // Players Ledger at the Bottom of the Board
    h += '<div class="ent-players-ledger">';
    S.cash.forEach((cash: number, i: number) => {
      if (!S.alive[i]) {
        h += '<div class="ent-player-card" style="opacity:0.45">';
        h += '<div class="ent-player-header">';
        h += '<span class="ent-token" style="background:#555">💸</span>';
        h += '<div><b>' + esc(C.seatName(i)) + '</b><div style="font-size:11px;color:#ef4444;font-weight:700">Bankrupt</div></div>';
        h += '</div>';
        h += '</div>';
        return;
      }
      const isCur = S.turn === i;
      const tok = ENTERPRISE_TOKENS[i % 4];
      const col = ENTERPRISE_COLORS_PLAYERS[i % 4];
      const ownedSpaces = g.SPACES.filter((sp: any) => S.owner[sp.id] === i);
      const hasAnySet = Object.keys(g.GROUPS).some((grpKey: string) => g.hasMonopoly(S, grpKey, i));

      h += '<div class="ent-player-card ' + (isCur ? 'active' : '') + '">';

      // Player Tag Header
      h += '<div class="ent-player-header">';
      h += '<span class="ent-token" style="background:' + col + '">' + tok + '</span>';
      h += '<div style="flex:1">';
      h += '<div style="font-weight:800;font-size:13px;color:' + col + '">' + esc(C.seatName(i)) + (isCur ? ' ⭐' : '') + '</div>';
      h += '<div style="font-size:11px">💵 <b>$' + cash + '</b> · Net <b>$' + g.netWorth(S, i) + '</b>' + (S.inJail[i] ? ' · 🚔 Custody' : '') + '</div>';
      h += '</div>';
      h += '</div>';

      // Owned Properties Display directly under Player Tag
      h += '<div class="ent-player-props-section">';
      h += '<div class="ent-player-props-title">';
      h += '<span>🏛️ Owned Territories (' + ownedSpaces.length + ')</span>';
      if (hasAnySet) {
        h += '<span style="color:#fbbf24;font-size:9.5px;font-weight:800">⭐ Regional Set Active (2×)</span>';
      }
      h += '</div>';

      if (ownedSpaces.length === 0) {
        h += '<div class="ent-no-props">No properties acquired yet</div>';
      } else {
        h += '<div class="ent-player-props-grid">';
        ownedSpaces.forEach((sp: any) => {
          const hasHq = S.hq[sp.id];
          const isMono = sp.group ? g.hasMonopoly(S, sp.group, i) : false;
          const curRent = g.calcRent(S, sp.id);
          const pColor = sp.color || (sp.t === 'transit' ? ENTERPRISE_COLORS.transit : ENTERPRISE_COLORS.util);
          h += '<div class="ent-owned-prop-card" data-id="' + sp.id + '" title="Tap to view Title Deed">';
          h += '<div class="ent-owned-prop-top">';
          h += '<span class="ent-owned-prop-color" style="background:' + pColor + '"></span>';
          h += '<span class="ent-owned-prop-flag">' + (sp.flag || sp.icon || '🏛️') + '</span>';
          h += '<span class="ent-owned-prop-name">' + esc(sp.short || sp.n) + '</span>';
          h += '</div>';
          h += '<div class="ent-owned-prop-meta">';
          h += '<span class="ent-owned-prop-rent">Rent $' + curRent + '</span>';
          if (hasHq) {
            h += '<span class="ent-owned-prop-badge" style="background:rgba(59,130,246,0.3);color:#93c5fd;border-color:#3b82f6">🏢 HQ</span>';
          } else if (isMono) {
            h += '<span class="ent-owned-prop-badge">⭐ 2×</span>';
          }
          h += '</div>';
          h += '</div>';
        });
        h += '</div>';
      }
      h += '</div>'; // End ent-player-props-section

      h += '</div>'; // End ent-player-card
    });
    h += '</div>'; // End ent-players-ledger

    h += '</div>'; // End enterprise-wrap

    R.innerHTML = h;

    // Attach click events
    const rb = $('#rollBtn'); if (rb) rb.onclick = () => g.doRoll(C);
    const pbb = $('#payBailBtn'); if (pbb) pbb.onclick = () => g.doPayBail(C);

    const buyBtn = $('#buyBtn'); if (buyBtn) buyBtn.onclick = () => g.doBuy(C);
    const passBtn = $('#passBtn'); if (passBtn) passBtn.onclick = () => g.doPass(C);

    const closeDeed = $('#closeDeedBtn'); if (closeDeed) closeDeed.onclick = () => { S.inspectingSq = -1; C.rerender(); };
    const prevDeed = $('#prevDeedBtn'); if (prevDeed) prevDeed.onclick = () => {
      const tid = +(prevDeed as HTMLElement).dataset.target!;
      if (!isNaN(tid)) { S.inspectingSq = tid; Sound.click(); C.rerender(); }
    };
    const nextDeed = $('#nextDeedBtn'); if (nextDeed) nextDeed.onclick = () => {
      const tid = +(nextDeed as HTMLElement).dataset.target!;
      if (!isNaN(tid)) { S.inspectingSq = tid; Sound.click(); C.rerender(); }
    };

    const deedBackdrop = $('#deedBackdrop'); if (deedBackdrop) deedBackdrop.onclick = (e: MouseEvent) => {
      if (e.target === deedBackdrop && S.pendingBuy < 0) {
        S.inspectingSq = -1;
        C.rerender();
      }
    };

    const upgradeHq = $('#upgradeHqBtn'); if (upgradeHq) upgradeHq.onclick = () => g.doUpgradeHq(C, deedId);

    // Pick 1 Card handler when landed on Risks / World Riches
    const pickCardBtn = $('#pickCardBtn'); if (pickCardBtn) pickCardBtn.onclick = () => {
      if (S.pendingCardPick) g.doPickCard(C, S.pendingCardPick);
    };
    const centerDeckRisks = $('#centerDeckRisks'); if (centerDeckRisks && isRiskPickPending) {
      centerDeckRisks.onclick = () => g.doPickCard(C, 'risks');
    }
    const centerDeckRiches = $('#centerDeckRiches'); if (centerDeckRiches && isRichesPickPending) {
      centerDeckRiches.onclick = () => g.doPickCard(C, 'riches');
    }

    // Dismiss active card handler
    const dismissCard = $('#dismissCardBtn'); if (dismissCard) dismissCard.onclick = () => g.doDismissCard(C);

    // View All Deeds Button
    const viewAllDeeds = $('#viewAllDeedsBtn'); if (viewAllDeeds) viewAllDeeds.onclick = () => {
      S.inspectingSq = g.PURCHASABLE[0];
      Sound.click();
      C.rerender();
    };

    // Clicking any space on the board opens its title deed card
    R.querySelectorAll('.ent-sq').forEach((sq: any) => {
      sq.onclick = () => {
        const id = +sq.dataset.id;
        if (!isNaN(id)) {
          S.inspectingSq = id;
          Sound.click();
          C.rerender();
        }
      };
    });

    // Clicking any owned property card under player tag opens its title deed card
    R.querySelectorAll('.ent-owned-prop-card').forEach((sq: any) => {
      sq.onclick = () => {
        const id = +sq.dataset.id;
        if (!isNaN(id)) {
          S.inspectingSq = id;
          Sound.click();
          C.rerender();
        }
      };
    });
  },
  doPayBail(C: any) {
    const S = C.S, g = this;
    if (!S.inJail[S.turn] || S.cash[S.turn] < 50) return;
    S.cash[S.turn] -= 50;
    S.inJail[S.turn] = false;
    S.jailTurns[S.turn] = 0;
    S.msg = esc(C.seatName(S.turn)) + ' paid $50 bail to exit custody!';
    Sound.win();
    C.update(() => {});
    g.doRoll(C);
  },
  doRoll(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;

    // Reset modals
    S.activeCard = null;
    S.pendingCardPick = null;
    S.cardPicked = false;
    S.inspectingSq = -1;

    const d1 = ri(1, 6);
    const d2 = ri(1, 6);
    const sum = d1 + d2;
    const isDouble = d1 === d2;

    Sound.dice();
    S.d1 = d1;
    S.d2 = d2;
    S.isDouble = isDouble;

    // Handle Jail
    if (S.inJail[cur]) {
      if (isDouble) {
        S.inJail[cur] = false;
        S.jailTurns[cur] = 0;
        S.doublesStreak = 0;
        S.msg = '🎲 Rolled doubles (' + d1 + '-' + d2 + ')! Released free from custody!';
        Sound.win();
      } else {
        S.jailTurns[cur]++;
        if (S.jailTurns[cur] >= 3) {
          S.cash[cur] -= 50;
          S.inJail[cur] = false;
          S.jailTurns[cur] = 0;
          S.msg = 'Served 3 turns in custody. Paid $50 release fee.';
        } else {
          S.msg = esc(C.seatName(cur)) + ' rolled ' + sum + ' (no doubles) — stays in custody (' + S.jailTurns[cur] + '/3).';
          C.update(() => {});
          g.nextTurn(C);
          maybeCpu(C);
          return;
        }
      }
    }

    if (isDouble && !S.inJail[cur]) {
      S.doublesStreak++;
      if (S.doublesStreak >= 3) {
        // 3 consecutive doubles = speeding to jail!
        S.pos[cur] = 10;
        S.inJail[cur] = true;
        S.doublesStreak = 0;
        S.isDouble = false;
        S.msg = '🚨 Speeding! 3 doubles in a row sends ' + esc(C.seatName(cur)) + ' directly to custody!';
        Sound.lose();
        C.update(() => {});
        g.nextTurn(C);
        maybeCpu(C);
        return;
      }
    } else {
      S.doublesStreak = 0;
    }

    // Move forward
    let np = S.pos[cur] + sum;
    if (np >= g.SPACES.length) {
      S.cash[cur] += 200;
      S.msg = esc(C.seatName(cur)) + ' completed global circuit! Passed GO +$200 enterprise capital.';
    }
    np %= g.SPACES.length;
    S.pos[cur] = np;

    const sp = g.SPACES[np];

    // Landed space interactions
    if (sp.t === 'prop' || sp.t === 'transit' || sp.t === 'util') {
      const o = S.owner[np];
      if (o == null) {
        if (cur === 0 ? C.mine() : true) {
          S.pendingBuy = np;
          S.msg = (cur === 0 ? 'Landed on unowned ' : esc(C.seatName(cur)) + ' landed on unowned ') + sp.n + ' ($' + sp.price + ')';
          C.update(() => {});
          maybeCpu(C);
          return;
        } else {
          S.msg = 'Nobody acquired ' + sp.n;
        }
      } else if (o !== cur) {
        const rent = g.calcRent(S, np);
        S.cash[cur] -= rent;
        S.cash[o] += rent;
        S.msg = esc(C.seatName(cur)) + ' paid $' + rent + ' revenue to ' + esc(C.seatName(o)) + ' for ' + sp.n;
        Sound.click();
      } else {
        S.msg = 'Visited your territory: ' + sp.n;
      }
    } else if (sp.t === 'tax') {
      S.cash[cur] -= sp.amt;
      S.msg = 'Paid $' + sp.amt + ' for ' + sp.n;
      Sound.lose();
    } else if (sp.t === 'risks') {
      // Landed on Risks: Player gets to pick 1 card
      S.pendingCardPick = 'risks';
      S.cardPicked = false;
      S.msg = '⚡ Landed on RISKS! Pick 1 card from the deck.';
      Sound.card();
      C.update(() => {});
      maybeCpu(C);
      return;
    } else if (sp.t === 'riches') {
      // Landed on World Riches: Player gets to pick 1 card
      S.pendingCardPick = 'riches';
      S.cardPicked = false;
      S.msg = '💎 Landed on WORLD RICHES! Pick 1 card from the deck.';
      Sound.card();
      C.update(() => {});
      maybeCpu(C);
      return;
    } else if (sp.t === 'gotojail') {
      S.pos[cur] = 10;
      S.inJail[cur] = true;
      S.isDouble = false;
      S.msg = '🚨 Extradited to Custody! Miss upcoming turns or pay bail.';
      Sound.lose();
    } else if (sp.t === 'parking') {
      S.msg = '🌐 Global Summit safe haven: Take a strategic rest.';
    } else if (sp.t === 'jail') {
      S.msg = 'Visiting Custody facilities.';
    } else if (sp.t === 'go') {
      S.msg = '🏁 Landed directly on GO! +$200 enterprise capital.';
    }

    // Check bankruptcy
    if (S.cash[cur] < 0) {
      S.alive[cur] = false;
      for (const k in S.owner) if (S.owner[k] === cur) delete S.owner[k];
      for (const k in S.hq) if (S.owner[k] === cur) delete S.hq[k];
      S.msg = '💸 ' + esc(C.seatName(cur)) + ' went BANKRUPT!';
      Sound.lose();
    }

    C.update(() => {});
    g.checkEnd(C);

    if (!S.over) {
      if (S.pendingBuy < 0) {
        if (!S.isDouble || S.inJail[cur] || !S.alive[cur]) {
          g.nextTurn(C);
        } else {
          S.msg = (S.msg ? S.msg + ' · ' : '') + '🎲 Doubles! Roll again!';
          C.update(() => {});
        }
      }
    }
    maybeCpu(C);
  },
  doPickCard(C: any, type: 'risks' | 'riches') {
    const S = C.S, g = this;
    const cur = S.turn;
    if (S.pendingCardPick !== type || S.cardPicked) return;

    S.cardPicked = true;
    S.pendingCardPick = null;

    const list = type === 'risks' ? g.RISKS : g.RICHES;
    const card = list[ri(0, list.length - 1)];
    S.activeCard = { deck: type, title: card.title, desc: card.desc };
    S.msg = (type === 'risks' ? '⚡ RISKS: ' : '💎 WORLD RICHES: ') + card.title;
    Sound.card();

    if (card.amt) S.cash[cur] += card.amt;
    if (card.go != null) { S.pos[cur] = 0; S.cash[cur] += 200; }
    if (card.to != null) {
      S.pos[cur] = card.to;
      if (S.owner[card.to] == null && C.mine()) {
        S.pendingBuy = card.to;
      }
    }
    if (card.back) S.pos[cur] = (S.pos[cur] - card.back + g.SPACES.length) % g.SPACES.length;
    if (card.jail) {
      S.pos[cur] = 10;
      S.inJail[cur] = true;
      S.isDouble = false;
    }
    if (card.perProp) {
      const owned = Object.keys(S.owner).filter(k => S.owner[+k] === cur).length;
      S.cash[cur] -= owned * card.perProp;
    }
    if (card.fromEach) {
      S.alive.forEach((a: boolean, pi: number) => {
        if (a && pi !== cur) {
          S.cash[pi] -= card.fromEach;
          S.cash[cur] += card.fromEach;
        }
      });
    }

    // Check bankruptcy
    if (S.cash[cur] < 0) {
      S.alive[cur] = false;
      for (const k in S.owner) if (S.owner[k] === cur) delete S.owner[k];
      for (const k in S.hq) if (S.owner[k] === cur) delete S.hq[k];
      S.msg = '💸 ' + esc(C.seatName(cur)) + ' went BANKRUPT!';
      Sound.lose();
    }

    C.update(() => {});
    g.checkEnd(C);
    maybeCpu(C);
  },
  doDismissCard(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    S.activeCard = null;
    S.pendingCardPick = null;

    if (!S.over) {
      if (S.pendingBuy >= 0) {
        // Will be resolved by buy or pass
      } else {
        if (!S.isDouble || S.inJail[cur] || !S.alive[cur]) {
          g.nextTurn(C);
        } else {
          S.msg = (S.msg ? S.msg + ' · ' : '') + '🎲 Doubles! Roll again!';
        }
      }
    }
    C.update(() => {});
    maybeCpu(C);
  },
  doBuy(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    const i = S.pendingBuy;
    if (i < 0) return;
    const sp = g.SPACES[i];
    if (S.cash[cur] >= sp.price) {
      S.cash[cur] -= sp.price;
      S.owner[i] = cur;
      S.pendingBuy = -1;
      S.msg = esc(C.seatName(cur)) + ' acquired ' + sp.n + ' for $' + sp.price + '!';
      Sound.win();
    } else {
      S.pendingBuy = -1;
      S.msg = 'Insufficient enterprise capital to acquire ' + sp.n;
    }
    if (!S.isDouble || S.inJail[cur]) {
      g.nextTurn(C);
    }
    C.update(() => {});
    maybeCpu(C);
  },
  doPass(C: any) {
    const S = C.S, g = this;
    const i = S.pendingBuy;
    const nm = i >= 0 ? g.SPACES[i].n : 'territory';
    S.pendingBuy = -1;
    S.msg = 'Passed on acquiring ' + nm;
    if (!S.isDouble || S.inJail[S.turn]) {
      g.nextTurn(C);
    }
    C.update(() => {});
    maybeCpu(C);
  },
  doUpgradeHq(C: any, spaceId: number) {
    const S = C.S, g = this;
    const cur = S.turn;
    const sp = g.SPACES[spaceId];
    if (!sp || S.owner[spaceId] !== cur || S.hq[spaceId] || S.cash[cur] < 100) return;
    S.cash[cur] -= 100;
    S.hq[spaceId] = true;
    S.msg = esc(C.seatName(cur)) + ' constructed an Enterprise HQ (🏢) in ' + sp.n + '! Rent doubled!';
    Sound.win();
    C.rerender();
  },
  nextTurn(C: any) {
    const S = C.S;
    let n = S.turn;
    for (let i = 0; i < C.names.length; i++) {
      n = (n + 1) % C.names.length;
      if (S.alive[n]) break;
    }
    if (n <= S.turn) S.round++;
    S.turn = n;
    S.isDouble = false;
    S.doublesStreak = 0;
    C.update(() => {});
  },
  checkEnd(C: any) {
    const S = C.S, g = this;
    const alive = S.alive.map((a: boolean, i: number) => a ? i : -1).filter((i: number) => i >= 0);
    if (alive.length === 1) {
      S.over = true;
      C.update(() => {});
      C.finish(alive[0], 'Won Enterprise! Global Net Worth $' + g.netWorth(S, alive[0]));
      return;
    }
    if (S.round > 25) {
      S.over = true;
      let w = 0, bw = -1;
      alive.forEach((i: number) => {
        const wv = g.netWorth(S, i);
        if (wv > bw) { bw = wv; w = i; }
      });
      C.update(() => {});
      C.finish(w, 'Richest Tycoon after 25 rounds: $' + bw);
    }
  },
  cpu(C: any) {
    const S = C.S, g = this;

    // If CPU landed on a card space and has to pick 1 card
    if (S.pendingCardPick) {
      g.doPickCard(C, S.pendingCardPick);
      return;
    }

    // If CPU drew a card and it is displayed
    if (S.activeCard) {
      g.doDismissCard(C);
      return;
    }

    if (S.pendingBuy >= 0) {
      const sp = g.SPACES[S.pendingBuy];
      if (S.cash[1] >= sp.price + 120) {
        S.cash[1] -= sp.price;
        S.owner[S.pendingBuy] = 1;
        S.msg = 'Computer acquired ' + sp.n + '!';
        Sound.win();
      } else {
        S.msg = 'Computer passed on acquiring ' + sp.n;
      }
      S.pendingBuy = -1;
      if (!S.isDouble || S.inJail[1]) {
        g.nextTurn(C);
      }
      C.update(() => {});
      maybeCpu(C);
      return;
    }

    if (S.inJail[1]) {
      if (S.cash[1] > 250) {
        S.cash[1] -= 50;
        S.inJail[1] = false;
        S.jailTurns[1] = 0;
        S.msg = 'Computer paid $50 bail to exit custody';
        g.doRoll(C);
        return;
      }
    }

    // Try upgrading any owned monopoly
    for (const k in S.owner) {
      if (S.owner[k] === 1 && !S.hq[k]) {
        const sp = g.SPACES[+k];
        if (sp && sp.t === 'prop' && sp.group && g.hasMonopoly(S, sp.group, 1) && S.cash[1] > 350) {
          S.cash[1] -= 100;
          S.hq[+k] = true;
          S.msg = 'Computer built an Enterprise HQ (🏢) in ' + sp.n + '!';
          break;
        }
      }
    }

    g.doRoll(C);
  }
});

/* ================= PAYDAY (Official Board Game Edition) ================= */
const PAYDAY_PAWNS = ['🔴', '🔵', '🟢', '🟡'];
const PAYDAY_PAWN_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

// 31 Authentic Calendar Board Spaces as shown on official game board:
const PAYDAY_CALENDAR = [
  { day: 0, dow: 'SUN', t: 'start', title: 'START HERE', icon: '👉', sub: 'Take off!' },
  { day: 1, dow: 'MON', t: 'mail', count: 1, title: 'Mail', icon: '📬', sub: '1 Letter' },
  { day: 2, dow: 'TUE', t: 'cash', amt: 500, title: 'Inheritance', icon: '👵', sub: 'Collect $500' },
  { day: 3, dow: 'WED', t: 'mail', count: 3, title: 'Mail', icon: '📬', sub: '3 Letters' },
  { day: 4, dow: 'THU', t: 'deal', title: 'Deal', icon: '🤝', sub: 'Take Deal' },
  { day: 5, dow: 'FRI', t: 'mail', count: 2, title: 'Mail', icon: '📬', sub: '2 Letters' },
  { day: 6, dow: 'SAT', t: 'pay', amt: 50, title: 'Weekend Company', icon: '🏸', sub: 'You Pay $50' },
  { day: 7, dow: 'SUN', t: 'rest', title: 'Sweet Sunday', icon: '🐦', sub: 'Day of Rest' },
  { day: 8, dow: 'MON', t: 'cash', amt: 100, title: 'Surprise Bonus', icon: '🎁', sub: 'Collect $100' },
  { day: 9, dow: 'TUE', t: 'buyer', title: 'Buyer', icon: '👩‍💼', sub: 'Sell 1 Deal' },
  { day: 10, dow: 'WED', t: 'poker', title: 'Poker Game', icon: '🃏', sub: '$100 Entry' },
  { day: 11, dow: 'THU', t: 'mail', count: 1, title: 'Mail', icon: '📬', sub: '1 Letter' },
  { day: 12, dow: 'FRI', t: 'deal', title: 'Deal', icon: '🤝', sub: 'Take Deal' },
  { day: 13, dow: 'SAT', t: 'pay', amt: 40, title: 'High School Dance', icon: '💃', sub: 'You Pay $40' },
  { day: 14, dow: 'SUN', t: 'rest', title: 'Sweet Sunday', icon: '🐦', sub: 'Day of Rest' },
  { day: 15, dow: 'MON', t: 'deal', title: 'Deal', icon: '🤝', sub: 'Take Deal' },
  { day: 16, dow: 'TUE', t: 'mail', count: 3, title: 'Mail', icon: '📬', sub: '3 Letters' },
  { day: 17, dow: 'WED', t: 'buyer', title: 'Buyer', icon: '👩‍💼', sub: 'Sell 1 Deal' },
  { day: 18, dow: 'THU', t: 'pay', amt: 75, title: 'Groceries', icon: '🥦', sub: 'You Pay $75' },
  { day: 19, dow: 'FRI', t: 'mail', count: 1, title: 'Mail', icon: '📬', sub: '1 Letter' },
  { day: 20, dow: 'SAT', t: 'buyer', title: 'Buyer', icon: '👩‍💼', sub: 'Sell 1 Deal' },
  { day: 21, dow: 'SUN', t: 'rest', title: 'Sweet Sunday', icon: '🐦', sub: 'Day of Rest' },
  { day: 22, dow: 'MON', t: 'mail', count: 1, title: 'Mail', icon: '📬', sub: '1 Letter' },
  { day: 23, dow: 'TUE', t: 'pay', amt: 50, title: 'Home Repairs', icon: '🔨', sub: 'You Pay $50' },
  { day: 24, dow: 'WED', t: 'mail', count: 2, title: 'Mail', icon: '📬', sub: '2 Letters' },
  { day: 25, dow: 'THU', t: 'deal', title: 'Deal', icon: '🤝', sub: 'Take Deal' },
  { day: 26, dow: 'FRI', t: 'election', amt: 50, title: 'Town Election', icon: '🗳️', sub: '$50 to Pot' },
  { day: 27, dow: 'SAT', t: 'daylight', title: 'Daylight Savings', icon: '🌻', sub: 'Back 1 Space' },
  { day: 28, dow: 'SUN', t: 'rest', title: 'Sweet Sunday', icon: '🐦', sub: 'Day of Rest' },
  { day: 29, dow: 'MON', t: 'lottery', title: 'Lottery Draw', icon: '🎰', sub: '$100 Ticket' },
  { day: 30, dow: 'TUE', t: 'buyer', title: 'Buyer', icon: '👩‍💼', sub: 'Sell 1 Deal' },
  { day: 31, dow: 'WED', t: 'payday', title: 'BILLS!!!', icon: '💰', sub: 'Collect Salary' }
];

// Official Mail Deck items:
const PAYDAY_MAIL_DECK = [
  { t: 'bill', title: 'Doctor\'s Bill', desc: 'Routine health checkup.', amt: 120 },
  { t: 'bill', title: 'Electric & Heating Bill', desc: 'Heavy winter energy usage.', amt: 90 },
  { t: 'bill', title: 'Car Tune-Up & Tires', desc: 'Brake pads and oil change.', amt: 210 },
  { t: 'bill', title: 'Plumbing Emergency', desc: 'Leaky faucet repairs.', amt: 150 },
  { t: 'bill', title: 'Credit Card Statement', desc: 'Online shopping balance due.', amt: 180 },
  { t: 'bill', title: 'Homeowner Insurance', desc: 'Annual coverage premium.', amt: 240 },
  { t: 'bill', title: 'Dental Cleaning', desc: 'Cavity filling and checkup.', amt: 130 },
  { t: 'paynow', title: 'Charity Walkathon', desc: 'Sponsor neighborhood kids. Pay immediately.', amt: 40 },
  { t: 'paynow', title: 'School Band Fundraiser', desc: 'Buy band raffle tickets.', amt: 30 },
  { t: 'reward', title: 'Tax Refund Check', desc: 'Federal surplus reimbursement!', amt: 300 },
  { t: 'reward', title: 'Sweepstakes Prize!', desc: 'Lucky cereal box winner!', amt: 250 },
  { t: 'postcard', title: 'Postcard From A Friend', desc: '"Wish you were here at the beach!" No cost.', amt: 0 },
  { t: 'reward', title: 'Cash Gift From Grandma', desc: 'Birthday card with crisp bills!', amt: 150 }
];

// Official Deal Cards:
const PAYDAY_DEAL_DECK = [
  { title: 'Classic Vintage Corvette', cost: 1200, val: 2800, icon: '🏎️' },
  { title: 'Lakeside Ski Chalet', cost: 1800, val: 4000, icon: '🏡' },
  { title: 'Commercial Popcorn Machine', cost: 400, val: 1100, icon: '🍿' },
  { title: 'Luxury Backyard Hot Tub', cost: 900, val: 2300, icon: '🛁' },
  { title: 'Rare Antique Grandfather Clock', cost: 600, val: 1600, icon: '🕰️' },
  { title: 'Coin-Op Arcade Game', cost: 500, val: 1400, icon: '🕹️' },
  { title: 'High-Tech Diamond Necklace', cost: 1000, val: 2500, icon: '💎' },
  { title: 'Speedboat & Trailer', cost: 1500, val: 3600, icon: '🚤' }
];

stdInit('payday', {
  name: 'BILLS!!!',
  icon: '💵',
  desc: 'Official 31-Day Calendar Board Game',
  p: [2, 4],
  payout: PAYOUTS.payday,
  rules: 'Official BILLS!!!: Play 1 full month across the 31-day calendar. Draw Mail (unpaid bills stack up until BILLS!!!), buy high-profit Deals and sell them to Buyers. Roll 6 to scoop up the central Pot! On Day 31 BILLS!!!, collect your $1,500 salary, pay off your bills and 10% loan interest. Richest tycoon at the end wins!',
  newState(C: any) {
    return {
      turn: 0,
      month: 1,
      totalMonths: 1, // Standard game is 1 full month
      pos: C.names.map(() => 0), // Day 0 = Start Here
      cash: C.names.map(() => 1000), // Starting capital
      loan: C.names.map(() => 0), // Bank loans
      bills: C.names.map(() => [] as any[]), // Unpaid bills due on BILLS!!!
      deals: C.names.map(() => [] as any[]), // Owned deal portfolio
      finishedMonth: C.names.map(() => false),
      pot: 0, // Central Jackpot Pot (Town election & swellfare)
      lastRoll: 0,
      activeModal: null as any, // Active prompt (Mail, Deal, Buyer, Lottery, Poker)
      over: false,
      msg: 'Welcome to BILLS!!! Roll the die to advance across the calendar.'
    };
  },
  ensureCash(S: any, playerIdx: number, neededAmt: number, C: any) {
    if (S.cash[playerIdx] < neededAmt) {
      const deficit = neededAmt - S.cash[playerIdx];
      const loanNeeded = Math.ceil(deficit / 1000) * 1000;
      S.loan[playerIdx] += loanNeeded;
      S.cash[playerIdx] += loanNeeded;
      S.msg = (S.msg ? S.msg + ' · ' : '') + esc(C.seatName(playerIdx)) + ' took an emergency bank loan of $' + loanNeeded + '!';
    }
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    const isHuman = C.mine() && !S.over && !S.finishedMonth[cur];

    let h = '<div class="payday-wrap">';
    h += turnBanner(C);

    // Official Retro Header Banner
    h += '<div class="payday-header-banner">';
    h += '<div class="payday-logo-title">BILLS!!!</div>';
    h += '<div class="payday-logo-sub">Official 31-Day Calendar Board</div>';
    h += '<div class="payday-pot-banner">';
    h += '<span>💰 THE POT: <b>$' + S.pot + '</b></span>';
    h += '<span style="font-size:10px;opacity:.9">(Roll a 6 to Win!)</span>';
    h += '</div>';
    h += '</div>';

    // Days of Week Header (SUN to SAT)
    const DOWS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    h += '<div class="payday-dow-grid">';
    DOWS.forEach(d => {
      h += '<div class="payday-dow-cell">' + d + '</div>';
    });
    h += '</div>';

    // The 35 Calendar Squares Grid (Week 1 to Week 5)
    // Board Layout: 
    // Row 1: Day 0 (Start Here) | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6
    // Row 2: Day 7 | Day 8 | Day 9 | Day 10 | Day 11 | Day 12 | Day 13
    // Row 3: Day 14 | Day 15 | Day 16 | Day 17 | Day 18 | Day 19 | Day 20
    // Row 4: Day 21 | Day 22 | Day 23 | Day 24 | Day 25 | Day 26 | Day 27
    // Row 5: Day 28 | Day 29 | Day 30 | Day 31 (Pay Day) | (Empty Pot Zone 3 squares)
    h += '<div class="payday-calendar-grid">';
    for (let i = 0; i < 35; i++) {
      if (i < 32) {
        const sq = PAYDAY_CALENDAR[i];
        let cellClass = 'payday-day-cell';
        if (sq.t === 'start') cellClass += ' start-cell';
        else if (sq.t === 'mail') cellClass += ' mail-cell';
        else if (sq.t === 'deal') cellClass += ' deal-cell';
        else if (sq.t === 'buyer') cellClass += ' buyer-cell';
        else if (sq.t === 'rest') cellClass += ' sweet-sunday';
        else if (sq.t === 'payday') cellClass += ' payday-final-cell';

        // Pawns located on this square
        let pawnsHtml = '';
        S.pos.forEach((pDay: number, pi: number) => {
          if (pDay === sq.day) {
            const col = PAYDAY_PAWN_COLORS[pi % 4];
            pawnsHtml += '<span class="payday-pawn-piece" style="background:' + col + '" title="' + esc(C.seatName(pi)) + '">' + (pi + 1) + '</span>';
          }
        });

        h += '<div class="' + cellClass + '" data-day="' + sq.day + '">';
        h += '<div class="payday-cell-top">';
        h += '<span class="payday-day-num">' + (sq.day > 0 ? sq.day : '★') + '</span>';
        if (sq.t === 'mail') h += '<span class="payday-cell-badge">Mail ' + sq.count + '</span>';
        else if (sq.t === 'deal') h += '<span class="payday-cell-badge" style="background:#fef08a;color:#854d0e">Deal</span>';
        else if (sq.t === 'buyer') h += '<span class="payday-cell-badge" style="background:#bbf7d0;color:#14532d">Buyer</span>';
        else if (sq.t === 'payday') h += '<span class="payday-cell-badge" style="background:#15803d;color:#fff">$1,500</span>';
        h += '</div>';

        h += '<div class="payday-cell-content">';
        h += '<span class="payday-cell-icon">' + sq.icon + '</span>';
        h += '<span class="payday-cell-label">' + esc(sq.title) + '</span>';
        if (sq.sub) {
          const isNeg = sq.t === 'pay' || sq.t === 'election';
          h += '<span class="payday-cell-sub ' + (isNeg ? 'neg' : '') + '">' + esc(sq.sub) + '</span>';
        }
        h += '</div>';

        h += '<div class="payday-pawns-dock">' + pawnsHtml + '</div>';
        h += '</div>';
      } else {
        // Squares 32, 33, 34 span the Central Pot / Swellfare announcement box
        if (i === 32) {
          h += '<div class="payday-day-cell" style="grid-column: span 3; background:#f8fafc; padding:8px 10px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">';
          h += '<div style="font-size:11px;font-weight:900;color:#1e293b;text-transform:uppercase">Town Election & Swellfare Pot</div>';
          h += '<div style="font-size:9.5px;color:#64748b;margin:2px 0">First player to roll a 6 on their regular turn wins the entire Pot!</div>';
          h += '<div style="font-size:13px;font-weight:900;color:#15803d;margin-top:2px">Current Pot: $' + S.pot + '</div>';
          h += '</div>';
        }
      }
    }
    h += '</div>'; // End payday-calendar-grid

    // Event & Action Modal Overlay (When drawing Mail, Deal, or Selling to Buyer)
    if (S.activeModal) {
      const m = S.activeModal;
      h += '<div class="payday-event-card-modal ' + m.type + '">';
      if (m.type === 'mail') {
        h += '<div style="font-size:24px">📬</div>';
        h += '<h3 style="margin:4px 0">' + esc(m.title) + '</h3>';
        h += '<div style="font-size:12px;color:#475569;margin-bottom:8px">' + esc(m.desc) + '</div>';
        if (m.subtype === 'bill') {
          h += '<div style="font-size:16px;font-weight:800;color:#b91c1c;margin:6px 0">BILL: $' + m.amt + '</div>';
          h += '<div class="muted" style="font-size:10px;margin-bottom:8px">Added to your unpaid bill stack. Pay on Day 31 BILLS!!!</div>';
        } else if (m.subtype === 'paynow') {
          h += '<div style="font-size:16px;font-weight:800;color:#b91c1c;margin:6px 0">COST: $' + m.amt + '</div>';
        } else if (m.subtype === 'reward') {
          h += '<div style="font-size:16px;font-weight:800;color:#15803d;margin:6px 0">COLLECT: +$' + m.amt + '</div>';
        }
        if (isHuman) {
          h += '<button class="btn small" id="mailAckBtn">Continue</button>';
        } else {
          h += '<div class="muted" style="font-size:11px">Computer reviewing mail...</div>';
        }
      } else if (m.type === 'deal') {
        h += '<div style="font-size:28px">' + m.deal.icon + '</div>';
        h += '<h3 style="margin:4px 0">' + esc(m.deal.title) + '</h3>';
        h += '<div style="display:flex;justify-content:space-around;margin:10px 0;font-size:12px">';
        h += '<div>Cost Now: <b style="color:#b91c1c">$' + m.deal.cost + '</b></div>';
        h += '<div>Buyer Value: <b style="color:#15803d">$' + m.deal.val + '</b></div>';
        h += '</div>';
        h += '<div style="font-size:11px;color:#15803d;font-weight:700;margin-bottom:10px">Potential Profit: +$' + (m.deal.val - m.deal.cost) + '</div>';
        if (isHuman) {
          h += '<div style="display:flex;gap:8px;justify-content:center">';
          h += '<button class="btn secondary small" id="passDealBtn">Pass Deal</button>';
          h += '<button class="btn small" id="buyDealBtn" style="background:#15803d;color:#fff">Buy Deal ($' + m.deal.cost + ')</button>';
          h += '</div>';
        } else {
          h += '<div class="muted" style="font-size:11px">Computer evaluating investment...</div>';
        }
      } else if (m.type === 'buyer') {
        h += '<div style="font-size:28px">👩‍💼</div>';
        h += '<h3 style="margin:4px 0">Buyer Available!</h3>';
        h += '<div style="font-size:11px;color:#475569;margin-bottom:8px">A buyer is waiting to purchase 1 Deal card from your portfolio at full retail value:</div>';
        if (S.deals[cur].length === 0) {
          h += '<div class="muted" style="font-size:12px;margin:8px 0">You currently hold no Deal cards to sell.</div>';
          if (isHuman) h += '<button class="btn small" id="buyerSkipBtn">Continue</button>';
        } else {
          h += '<div style="display:flex;flex-direction:column;gap:6px;margin:8px 0">';
          S.deals[cur].forEach((dl: any, di: number) => {
            if (isHuman) {
              h += '<button class="btn secondary small" data-deal-idx="' + di + '" style="font-size:11px;padding:6px;text-align:left;display:flex;justify-content:space-between">';
              h += '<span>' + dl.icon + ' ' + esc(dl.title) + '</span>';
              h += '<span style="color:#15803d;font-weight:800">Sell for $' + dl.val + '</span>';
              h += '</button>';
            } else {
              h += '<div style="font-size:11px">' + dl.icon + ' ' + esc(dl.title) + ' (Sell for $' + dl.val + ')</div>';
            }
          });
          h += '</div>';
          if (isHuman) h += '<button class="btn secondary small" id="buyerSkipBtn" style="font-size:10px">Hold Deals</button>';
        }
      } else if (m.type === 'lottery') {
        h += '<div style="font-size:28px">🎰</div>';
        h += '<h3 style="margin:4px 0">Lottery Drawing!</h3>';
        h += '<div style="font-size:11px;color:#475569;margin-bottom:8px">Buy a ticket for $100 for a chance to win $1,000!</div>';
        if (isHuman) {
          h += '<div style="display:flex;gap:8px;justify-content:center">';
          h += '<button class="btn secondary small" id="passLottoBtn">Pass</button>';
          h += '<button class="btn small" id="buyLottoBtn" style="background:#eab308;color:#000">Buy Ticket ($100)</button>';
          h += '</div>';
        } else {
          h += '<div class="muted" style="font-size:11px">Computer deciding on lottery ticket...</div>';
        }
      } else if (m.type === 'poker') {
        h += '<div style="font-size:28px">🃏</div>';
        h += '<h3 style="margin:4px 0">Neighborhood Poker Game</h3>';
        h += '<div style="font-size:11px;color:#475569;margin-bottom:8px">Each player antes $100 into the pot. Highest single roll wins all!</div>';
        if (isHuman) {
          h += '<button class="btn small" id="playPokerBtn">Play Poker ($100 ante)</button>';
        } else {
          h += '<div class="muted" style="font-size:11px">Rolling poker dice...</div>';
        }
      }
      h += '</div>'; // End modal
    }

    // Dashboard Controls & Player Status
    h += '<div class="payday-dashboard">';
    
    // Status message & dice preview
    if (S.lastRoll > 0) {
      h += '<div style="display:flex;align-items:center;justify-content:center;gap:8px">';
      h += '<span style="font-size:28px">' + diceFace(S.lastRoll) + '</span>';
      h += '<span style="font-weight:800;color:#facc15">Rolled a ' + S.lastRoll + (S.lastRoll === 6 ? ' 💥 WON THE POT!' : '') + '</span>';
      h += '</div>';
    }

    if (S.msg) {
      h += '<div class="msg" style="margin:0;font-size:12px;font-weight:600">' + esc(S.msg) + '</div>';
    }

    // Interactive Action Buttons
    if (!S.over && !S.activeModal) {
      if (isHuman) {
        h += '<button class="btn" id="rollBtn" style="font-size:15px;padding:12px;margin:4px 0">🎲 Roll Die (' + esc(C.seatName(cur)) + ' — Day ' + S.pos[cur] + ')</button>';
      } else {
        h += '<div class="muted center" style="padding:6px 0;font-size:12px">Waiting for ' + esc(C.seatName(cur)) + '...</div>';
      }
    }

    // Players Ledger (Cash, Loans, Bills Pile, Owned Deals)
    h += '<div class="payday-players-ledger">';
    S.pos.forEach((pDay: number, i: number) => {
      const isCur = i === cur && !S.over;
      const col = PAYDAY_PAWN_COLORS[i % 4];
      const tok = PAYDAY_PAWNS[i % 4];
      const billTotal = S.bills[i].reduce((sum: number, b: any) => sum + b.amt, 0);
      const dealCount = S.deals[i].length;

      h += '<div class="payday-player-card ' + (isCur ? 'active' : '') + '">';
      h += '<div style="display:flex;align-items:center;justify-content:space-between">';
      h += '<div style="display:flex;align-items:center;gap:6px">';
      h += '<span style="font-size:16px">' + tok + '</span>';
      h += '<span style="font-weight:800;font-size:13px;color:' + col + '">' + esc(C.seatName(i)) + (isCur ? ' ⭐' : '') + '</span>';
      h += '</div>';
      h += '<span style="font-size:11px;font-weight:700;color:#94a3b8">Day ' + pDay + '/31' + (S.finishedMonth[i] ? ' 🏁' : '') + '</span>';
      h += '</div>';

      h += '<div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px">';
      h += '<span>💵 Cash: <b style="color:#4ade80">$' + S.cash[i] + '</b></span>';
      h += '<span>🏦 Loan: <b style="color:#f87171">$' + S.loan[i] + '</b></span>';
      h += '</div>';

      h += '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.06);padding-top:4px;margin-top:2px">';
      h += '<span>📬 Bills Due: <b style="color:#fca5a5">$' + billTotal + '</b> (' + S.bills[i].length + ')</span>';
      h += '<span>🤝 Deals: <b style="color:#fef08a">' + dealCount + '</b></span>';
      h += '</div>';

      h += '</div>'; // End payday-player-card
    });
    h += '</div>'; // End payday-players-ledger

    h += '</div>'; // End payday-dashboard
    h += '</div>'; // End payday-wrap

    R.innerHTML = h;

    // Attach Click Event Handlers
    const rb = $('#rollBtn');
    if (rb) rb.onclick = () => g.doRoll(C);

    const mailAck = $('#mailAckBtn');
    if (mailAck) mailAck.onclick = () => g.doDismissModal(C);

    const buyDeal = $('#buyDealBtn');
    if (buyDeal) buyDeal.onclick = () => g.doBuyDeal(C);

    const passDeal = $('#passDealBtn');
    if (passDeal) passDeal.onclick = () => g.doPassDeal(C);

    const buyerSkip = $('#buyerSkipBtn');
    if (buyerSkip) buyerSkip.onclick = () => g.doDismissModal(C);

    const buyLotto = $('#buyLottoBtn');
    if (buyLotto) buyLotto.onclick = () => g.doPlayLottery(C, true);

    const passLotto = $('#passLottoBtn');
    if (passLotto) passLotto.onclick = () => g.doPlayLottery(C, false);

    const playPoker = $('#playPokerBtn');
    if (playPoker) playPoker.onclick = () => g.doPlayPoker(C);

    // Selling Deal to Buyer
    R.querySelectorAll('[data-deal-idx]').forEach((b: any) => {
      b.onclick = () => {
        const dIdx = +b.dataset.dealIdx;
        g.doSellDeal(C, dIdx);
      };
    });
  },
  doRoll(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    if (S.over || S.finishedMonth[cur] || S.activeModal) return;

    const roll = ri(1, 6);
    Sound.dice();
    S.lastRoll = roll;

    // Rule: Rolling a 6 on your turn immediately wins the central Pot!
    if (roll === 6 && S.pot > 0) {
      S.cash[cur] += S.pot;
      S.msg = '💥 ' + esc(C.seatName(cur)) + ' rolled a 6 and won the $' + S.pot + ' POT!';
      S.pot = 0;
      Sound.win();
    } else {
      S.msg = esc(C.seatName(cur)) + ' rolled a ' + roll + '.';
    }

    let nextDay = S.pos[cur] + roll;
    if (nextDay >= 31) {
      nextDay = 31; // Reached PAY DAY!
    }
    S.pos[cur] = nextDay;

    // Trigger Square Event on landed space
    g.handleSpaceEvent(C, nextDay);
  },
  handleSpaceEvent(C: any, day: number) {
    const S = C.S, g = this;
    const cur = S.turn;
    const sq = PAYDAY_CALENDAR[day];

    if (sq.t === 'mail') {
      const count = sq.count || 1;
      // Draw mail item
      const item = PAYDAY_MAIL_DECK[ri(0, PAYDAY_MAIL_DECK.length - 1)];
      if (item.t === 'bill') {
        S.bills[cur].push({ title: item.title, amt: item.amt });
        S.activeModal = { type: 'mail', subtype: 'bill', title: item.title, desc: item.desc, amt: item.amt };
        S.msg = esc(C.seatName(cur)) + ' received mail: ' + item.title + ' ($' + item.amt + ')';
      } else if (item.t === 'paynow') {
        g.ensureCash(S, cur, item.amt, C);
        S.cash[cur] -= item.amt;
        S.activeModal = { type: 'mail', subtype: 'paynow', title: item.title, desc: item.desc, amt: item.amt };
        S.msg = esc(C.seatName(cur)) + ' paid ' + item.title + ' ($' + item.amt + ')';
        Sound.click();
      } else if (item.t === 'reward') {
        S.cash[cur] += item.amt;
        S.activeModal = { type: 'mail', subtype: 'reward', title: item.title, desc: item.desc, amt: item.amt };
        S.msg = esc(C.seatName(cur)) + ' received cash reward: ' + item.title + ' (+$' + item.amt + ')';
        Sound.win();
      } else {
        S.activeModal = { type: 'mail', subtype: 'postcard', title: item.title, desc: item.desc, amt: 0 };
        S.msg = esc(C.seatName(cur)) + ' received a friendly postcard.';
        Sound.click();
      }
      C.update(() => {});
      maybeCpu(C);
      return;
    }

    if (sq.t === 'deal') {
      const dl = PAYDAY_DEAL_DECK[ri(0, PAYDAY_DEAL_DECK.length - 1)];
      S.activeModal = { type: 'deal', deal: dl };
      S.msg = esc(C.seatName(cur)) + ' found a Deal: ' + dl.title;
      C.update(() => {});
      maybeCpu(C);
      return;
    }

    if (sq.t === 'buyer') {
      S.activeModal = { type: 'buyer' };
      S.msg = esc(C.seatName(cur)) + ' landed on Buyer!';
      C.update(() => {});
      maybeCpu(C);
      return;
    }

    if (sq.t === 'cash') {
      const amt = sq.amt || 0;
      S.cash[cur] += amt;
      S.msg = esc(C.seatName(cur)) + ' landed on ' + sq.title + '! Collected +$' + amt + '.';
      Sound.win();
    } else if (sq.t === 'pay') {
      const amt = sq.amt || 0;
      g.ensureCash(S, cur, amt, C);
      S.cash[cur] -= amt;
      S.msg = esc(C.seatName(cur)) + ' paid $' + amt + ' for ' + sq.title + '.';
      Sound.click();
    } else if (sq.t === 'election') {
      // All players contribute $50 to central Pot
      const amt = sq.amt || 50;
      C.names.forEach((_: any, pi: number) => {
        g.ensureCash(S, pi, amt, C);
        S.cash[pi] -= amt;
        S.pot += amt;
      });
      S.msg = '🗳️ Town Election! Every player contributed $50 to the Pot.';
      Sound.click();
    } else if (sq.t === 'daylight') {
      // Move back 1 space
      const prev = Math.max(0, day - 1);
      S.pos[cur] = prev;
      S.msg = '🌻 Daylight Savings: All clocks back! ' + esc(C.seatName(cur)) + ' moved back 1 space.';
      Sound.click();
    } else if (sq.t === 'lottery') {
      S.activeModal = { type: 'lottery' };
      S.msg = esc(C.seatName(cur)) + ' reached the Lottery Draw!';
      C.update(() => {});
      maybeCpu(C);
      return;
    } else if (sq.t === 'poker') {
      S.activeModal = { type: 'poker' };
      S.msg = 'Neighborhood Poker Game! Ante $100 to roll.';
      C.update(() => {});
      maybeCpu(C);
      return;
    } else if (sq.t === 'rest') {
      S.msg = '🐦 Sweet Sunday: A peaceful day of rest.';
    } else if (sq.t === 'payday') {
      g.handlePayDaySettlement(C, cur);
      return;
    }

    g.nextTurn(C);
  },
  handlePayDaySettlement(C: any, playerIdx: number) {
    const S = C.S, g = this;
    // Salary deposited
    const salary = 1500;
    S.cash[playerIdx] += salary;

    // Total unpaid bills
    const totalBills = S.bills[playerIdx].reduce((sum: number, b: any) => sum + b.amt, 0);
    g.ensureCash(S, playerIdx, totalBills, C);
    S.cash[playerIdx] -= totalBills;
    S.bills[playerIdx] = [];

    // Service loan interest (10%)
    if (S.loan[playerIdx] > 0) {
      const interest = Math.round(S.loan[playerIdx] * 0.1);
      g.ensureCash(S, playerIdx, interest, C);
      S.cash[playerIdx] -= interest;

      // Pay off principal if excess cash allows
      if (S.cash[playerIdx] >= S.loan[playerIdx] + 200) {
        S.cash[playerIdx] -= S.loan[playerIdx];
        S.msg = '💰 BILLS!!! ' + esc(C.seatName(playerIdx)) + ' collected $' + salary + ' salary, paid all bills, and paid off their $' + S.loan[playerIdx] + ' bank loan!';
        S.loan[playerIdx] = 0;
      } else {
        S.msg = '💰 BILLS!!! ' + esc(C.seatName(playerIdx)) + ' collected $' + salary + ' salary, paid $' + totalBills + ' in bills, and paid 10% loan interest ($' + interest + ').';
      }
    } else {
      S.msg = '💰 BILLS!!! ' + esc(C.seatName(playerIdx)) + ' collected $' + salary + ' salary and paid all bills!';
    }
    Sound.win();

    S.finishedMonth[playerIdx] = true;

    // Check if all players completed the month
    if (S.finishedMonth.every((f: boolean) => f)) {
      g.finishGame(C);
      return;
    }

    g.nextTurn(C);
  },
  doBuyDeal(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    const dl = S.activeModal.deal;
    g.ensureCash(S, cur, dl.cost, C);
    S.cash[cur] -= dl.cost;
    S.deals[cur].push(dl);
    S.activeModal = null;
    S.msg = esc(C.seatName(cur)) + ' purchased Deal: ' + dl.title + ' for $' + dl.cost + '!';
    Sound.win();
    g.nextTurn(C);
  },
  doPassDeal(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    S.activeModal = null;
    S.msg = esc(C.seatName(cur)) + ' passed on the Deal.';
    g.nextTurn(C);
  },
  doSellDeal(C: any, dealIdx: number) {
    const S = C.S, g = this;
    const cur = S.turn;
    const dl = S.deals[cur][dealIdx];
    if (!dl) return;

    S.cash[cur] += dl.val;
    S.deals[cur].splice(dealIdx, 1);
    S.activeModal = null;
    S.msg = '💵 ' + esc(C.seatName(cur)) + ' sold ' + dl.title + ' to the Buyer for $' + dl.val + ' (Profit: +$' + (dl.val - dl.cost) + ')!';
    Sound.win();
    g.nextTurn(C);
  },
  doPlayLottery(C: any, play: boolean) {
    const S = C.S, g = this;
    const cur = S.turn;
    S.activeModal = null;
    if (play) {
      g.ensureCash(S, cur, 100, C);
      S.cash[cur] -= 100;
      const win = Math.random() < 0.33;
      if (win) {
        S.cash[cur] += 1000;
        S.msg = '🎉 ' + esc(C.seatName(cur)) + ' hit the Lottery for $1,000!';
        Sound.win();
      } else {
        S.msg = esc(C.seatName(cur)) + ' played the lottery but did not win.';
        Sound.lose();
      }
    } else {
      S.msg = esc(C.seatName(cur)) + ' passed on the lottery.';
    }
    g.nextTurn(C);
  },
  doPlayPoker(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    S.activeModal = null;

    // Both players ante $100
    const pokerPot = C.names.length * 100;
    C.names.forEach((_: any, pi: number) => {
      g.ensureCash(S, pi, 100, C);
      S.cash[pi] -= 100;
    });

    // Roll high dice
    const rHuman = ri(1, 6);
    const rCpu = ri(1, 6);
    let winner = cur;
    if (rHuman > rCpu) winner = 0;
    else if (rCpu > rHuman) winner = 1;
    else winner = cur; // Tie goes to roller

    S.cash[winner] += pokerPot;
    S.msg = '🃏 Poker results: ' + esc(C.seatName(0)) + ' (' + rHuman + ') vs ' + esc(C.seatName(1)) + ' (' + rCpu + '). ' + esc(C.seatName(winner)) + ' won $' + pokerPot + '!';
    Sound.win();
    g.nextTurn(C);
  },
  doDismissModal(C: any) {
    const S = C.S, g = this;
    S.activeModal = null;
    g.nextTurn(C);
  },
  nextTurn(C: any) {
    const S = C.S, g = this;
    let n = S.turn;
    for (let i = 0; i < C.names.length; i++) {
      n = (n + 1) % C.names.length;
      if (!S.finishedMonth[n]) break;
    }
    S.turn = n;
    C.update(() => {});
    maybeCpu(C);
  },
  finishGame(C: any) {
    const S = C.S;
    S.over = true;

    // Calculate final Net Worth: Cash + Remaining Deals at cost - Outstanding Loans
    let bestNet = -1e9;
    let winner = 0;
    const summary = C.names.map((_: any, pi: number) => {
      const dealsVal = S.deals[pi].reduce((sum: number, d: any) => sum + d.val, 0);
      const net = S.cash[pi] + dealsVal - S.loan[pi];
      if (net > bestNet) {
        bestNet = net;
        winner = pi;
      }
      return esc(C.seatName(pi)) + ': $' + net;
    }).join(' · ');

    C.update(() => {});
    C.finish(winner, 'End of Month Final Net Worth: ' + summary);
  },
  cpu(C: any) {
    const S = C.S, g = this;
    if (S.over || S.turn !== 1) return;

    // Handle Active Modal for CPU
    if (S.activeModal) {
      const m = S.activeModal;
      if (m.type === 'mail') {
        g.doDismissModal(C);
        return;
      }
      if (m.type === 'deal') {
        // Buy if cash or loan allows and profit margin is positive
        if (S.cash[1] >= m.deal.cost || S.loan[1] <= 1000) {
          g.doBuyDeal(C);
        } else {
          g.doPassDeal(C);
        }
        return;
      }
      if (m.type === 'buyer') {
        if (S.deals[1].length > 0) {
          g.doSellDeal(C, 0); // Sell highest or first available deal
        } else {
          g.doDismissModal(C);
        }
        return;
      }
      if (m.type === 'lottery') {
        if (S.cash[1] > 400) {
          g.doPlayLottery(C, true);
        } else {
          g.doPlayLottery(C, false);
        }
        return;
      }
      if (m.type === 'poker') {
        g.doPlayPoker(C);
        return;
      }
    }

    // Regular Roll Turn
    g.doRoll(C);
  }
});

/* ================= THE GAME OF CHOICES ================= */
const LIFE_CAR_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706']; // Cherry Red, Royal Blue, Forest Green, Sunburst Yellow
const LIFE_CAR_NAMES = ['Red Wagon', 'Blue Cruiser', 'Green Van', 'Yellow Sedan'];

// Official Careers
const LIFE_CAREERS = [
  { title: 'Artist', salary: 30000, taxes: 5000, collegeReq: false, icon: '🎨' },
  { title: 'Athlete', salary: 60000, taxes: 10000, collegeReq: false, icon: '⚽' },
  { title: 'Police Officer', salary: 40000, taxes: 7000, collegeReq: false, icon: '👮' },
  { title: 'Salesperson', salary: 35000, taxes: 5000, collegeReq: false, icon: '💼' },
  { title: 'Mechanic', salary: 45000, taxes: 8000, collegeReq: false, icon: '🔧' },
  { title: 'Accountant', salary: 70000, taxes: 15000, collegeReq: true, icon: '📊' },
  { title: 'Computer Pro', salary: 80000, taxes: 20000, collegeReq: true, icon: '💻' },
  { title: 'Doctor', salary: 100000, taxes: 30000, collegeReq: true, icon: '🩺' },
  { title: 'Lawyer', salary: 90000, taxes: 25000, collegeReq: true, icon: '⚖️' },
  { title: 'Teacher', salary: 50000, taxes: 10000, collegeReq: true, icon: '📚' }
];

// Official House Deeds
const LIFE_HOUSES = [
  { title: 'Cozy Mobile Home', cost: 60000, resale: 80000, icon: '🚐' },
  { title: 'Suburban Split-Level', cost: 120000, resale: 160000, icon: '🏡' },
  { title: 'Historic Tudor Manor', cost: 180000, resale: 250000, icon: '🏰' },
  { title: 'Beachfront Villa', cost: 240000, resale: 340000, icon: '🏖️' }
];

// Official Life Tile Rewards
const LIFE_TILES_DECK = [
  { title: 'Adopt a Rescue Puppy', amt: 30000, icon: '🐶' },
  { title: 'Invent New App', amt: 50000, icon: '📱' },
  { title: 'Write Best-Seller Novel', amt: 80000, icon: '📖' },
  { title: 'Win Nobel Peace Prize', amt: 100000, icon: '🏅' },
  { title: 'Plant a Community Forest', amt: 40000, icon: '🌲' },
  { title: 'Climb Mt. Everest', amt: 60000, icon: '🧗' },
  { title: 'Found Local Charity', amt: 50000, icon: '🤝' },
  { title: 'Patent Solar Panel Device', amt: 70000, icon: '☀️' }
];

// Official Starting College Branch (Spaces 1–5 leading to Graduation Stop)
const LIFE_COLLEGE_SPACES = [
  { id: 1, title: 'College Tuition', type: 'tuition', cost: 100000, desc: 'Borrow tuition debt', icon: '🎓' },
  { id: 2, title: 'Spring Break!', type: 'action', cost: 5000, desc: 'Trip with college friends', icon: '🏖️' },
  { id: 3, title: 'Dean\'s Scholarship', type: 'action', amt: 20000, desc: 'Honor roll scholarship', icon: '📜' },
  { id: 4, title: 'Study Abroad', type: 'life', desc: 'Semester in Florence (Draw LIFE)', icon: '✈️' },
  { id: 5, title: 'GRADUATION', type: 'stop', stopType: 'career_choice', desc: 'STOP: Pick College Career', icon: '🛑' }
];

// Official Starting Career Branch (Spaces 1–5 leading to Promotion)
const LIFE_CAREER_SPACES = [
  { id: 1, title: 'Job Search', type: 'action', desc: 'Accepted entry-level job', icon: '💼' },
  { id: 2, title: 'Furnish Studio', type: 'action', cost: 5000, desc: 'First apartment setup', icon: '🛋️' },
  { id: 3, title: 'Sign-On Bonus', type: 'action', amt: 10000, desc: 'Welcome bonus check', icon: '💰' },
  { id: 4, title: 'Buy Used Car', type: 'action', cost: 5000, desc: 'Commuter car down payment', icon: '🚗' },
  { id: 5, title: 'First Promotion', type: 'action', amt: 10000, desc: 'Merit pay increase', icon: '📈' }
];

// Official Main Highway Track (Spaces 6–33)
const LIFE_MAIN_SPACES = [
  { id: 6, title: 'PAY DAY', type: 'payday', desc: 'Collect Salary', icon: '💵' },
  { id: 7, title: 'Ski Weekend', type: 'action', cost: 5000, desc: 'Mountain lodge holiday', icon: '⛷️' },
  { id: 8, title: 'Family Inheritance', type: 'action', amt: 10000, desc: 'Great Uncle\'s gift', icon: '🎁' },
  { id: 9, title: 'GET MARRIED', type: 'stop', stopType: 'marriage', desc: 'STOP: Add Spouse Peg & Gifts', icon: '💍' },
  { id: 10, title: 'Honeymoon Cruise', type: 'action', cost: 10000, desc: 'Tropical getaway', icon: '🚢' },
  { id: 11, title: 'PAY DAY', type: 'payday', desc: 'Collect Salary', icon: '💵' },
  { id: 12, title: 'Land Investment', type: 'action', amt: 15000, desc: 'Zoning development profit', icon: '🏞️' },
  { id: 13, title: 'Fender Bender', type: 'action', cost: 10000, desc: 'Auto body repair bill', icon: '💥' },
  { id: 14, title: 'BUY A HOUSE', type: 'stop', stopType: 'house', desc: 'STOP: Choose House Deed', icon: '🏠' },
  { id: 15, title: 'Baby Boy!', type: 'baby', count: 1, gender: 'blue', desc: 'Add baby peg to car (+gifts)', icon: '👶' },
  { id: 16, title: 'PAY DAY', type: 'payday', desc: 'Collect Salary', icon: '💵' },
  { id: 17, title: 'Family Road Trip', type: 'action', cost: 15000, desc: 'National parks road trip', icon: '🏕️' },
  { id: 18, title: 'Baby Girl!', type: 'baby', count: 1, gender: 'pink', desc: 'Add baby peg to car (+gifts)', icon: '🎀' },
  { id: 19, title: 'Community Honor', type: 'life', desc: 'Draw a LIFE Tile', icon: '🏆' },
  { id: 20, title: 'PAY DAY', type: 'payday', desc: 'Collect Salary', icon: '💵' },
  { id: 21, title: 'Adopt Twins!', type: 'baby', count: 2, gender: 'both', desc: 'Add 2 pegs to car (+gifts)', icon: '👶' },
  { id: 22, title: 'Tax Refund', type: 'action', amt: 25000, desc: 'IRS tax return check', icon: '📑' },
  { id: 23, title: 'MID-LIFE CRISIS', type: 'stop', stopType: 'crisis', desc: 'STOP: Night School or Sabbatical', icon: '🛑' },
  { id: 24, title: 'PAY DAY', type: 'payday', desc: 'Collect Salary', icon: '💵' },
  { id: 25, title: 'Stock Market Surge', type: 'action', amt: 50000, desc: 'Wall street portfolio gains', icon: '📈' },
  { id: 26, title: 'Home Remodeling', type: 'action', cost: 25000, desc: 'New kitchen & patio deck', icon: '🔨' },
  { id: 27, title: 'Publish Memoir', type: 'life', desc: 'Draw a LIFE Tile', icon: '📚' },
  { id: 28, title: 'PAY DAY', type: 'payday', desc: 'Collect Salary', icon: '💵' },
  { id: 29, title: 'Tuition for Kids', type: 'kids_expense', costPerChild: 20000, desc: '$20K per child peg in car', icon: '🎓' },
  { id: 30, title: 'Grandchildren!', type: 'action', amt: 40000, desc: 'Family celebration gifts', icon: '🎉' },
  { id: 31, title: 'PAY DAY', type: 'payday', desc: 'Collect Salary', icon: '💵' },
  { id: 32, title: 'Philanthropy Hero', type: 'life', desc: 'Draw a LIFE Tile', icon: '🌟' },
  { id: 33, title: 'RETIREMENT', type: 'stop', stopType: 'retire', desc: 'RETIRE: Countryside or Millionaire', icon: '🌴' }
];

// Helper to look up space object for player based on their branch
function getLifeSpace(S: any, playerIdx: number, spaceId: number) {
  if (spaceId === 0) {
    return { id: 0, title: 'START', type: 'start', desc: 'Choose College or Career Path', icon: '🏁' };
  }
  if (spaceId >= 1 && spaceId <= 5) {
    const isCol = S.pathType && S.pathType[playerIdx] === 'college';
    return isCol ? LIFE_COLLEGE_SPACES[spaceId - 1] : LIFE_CAREER_SPACES[spaceId - 1];
  }
  return LIFE_MAIN_SPACES[spaceId - 6] || LIFE_MAIN_SPACES[LIFE_MAIN_SPACES.length - 1];
}

// Authentic SVG Station Wagon Piece with 6 Molded Seats and 3D Pegs
function renderLifeCarSvg(playerIdx: number, pegs: string[], options?: { width?: number, height?: number, isCurrent?: boolean, title?: string }): string {
  const w = options?.width || 56;
  const h = options?.height || 28;
  const isCur = !!options?.isCurrent;
  const colIdx = playerIdx % 4;

  const bodyColors = [
    { base: '#dc2626', top: '#ef4444', dark: '#991b1b' }, // Red
    { base: '#2563eb', top: '#38bdf8', dark: '#1e40af' }, // Blue
    { base: '#16a34a', top: '#4ade80', dark: '#14532d' }, // Green
    { base: '#d97706', top: '#facc15', dark: '#92400e' }  // Yellow
  ];
  const c = bodyColors[colIdx];
  const gid = 'car_' + playerIdx + '_' + (options?.width || 0);

  // Seat coordinates inside cockpit (viewBox 0 0 64 32)
  const seats = [
    { x: 26, y: 11, label: 'Driver' },
    { x: 26, y: 19, label: 'Spouse' },
    { x: 37, y: 11, label: 'Kid 1' },
    { x: 37, y: 19, label: 'Kid 2' },
    { x: 48, y: 11, label: 'Kid 3' },
    { x: 48, y: 19, label: 'Kid 4' }
  ];

  let svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;' + (isCur ? 'filter:drop-shadow(0 0 6px #facc15);' : '') + '">';
  svg += '<defs>';
  svg += '<linearGradient id="' + gid + '_body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + c.top + '"/><stop offset="100%" stop-color="' + c.base + '"/></linearGradient>';
  svg += '<radialGradient id="' + gid + '_bluePeg" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#bae6fd"/><stop offset="50%" stop-color="#0284c7"/><stop offset="100%" stop-color="#075985"/></radialGradient>';
  svg += '<radialGradient id="' + gid + '_pinkPeg" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#fbcfe8"/><stop offset="50%" stop-color="#db2777"/><stop offset="100%" stop-color="#831843"/></radialGradient>';
  svg += '</defs>';

  // Ground shadow
  svg += '<ellipse cx="32" cy="28" rx="27" ry="3.5" fill="rgba(0,0,0,0.4)"/>';

  // Tires
  svg += '<rect x="6" y="21" width="11" height="6.5" rx="3" fill="#18181b" stroke="#3f3f46" stroke-width="0.8"/>';
  svg += '<circle cx="11.5" cy="24.2" r="2.2" fill="#cbd5e1"/>';
  svg += '<rect x="44" y="21" width="11" height="6.5" rx="3" fill="#18181b" stroke="#3f3f46" stroke-width="0.8"/>';
  svg += '<circle cx="49.5" cy="24.2" r="2.2" fill="#cbd5e1"/>';

  // Molded Station Wagon Body
  svg += '<path d="M 6 22 C 5 19 6 14 9 11 C 12 8 18 7.5 23 7.5 L 26 7.5 L 30 3 C 32 1.8 35 1.8 38 1.8 L 52 1.8 C 56 1.8 59 4 60 8 L 61 16 C 62 20 60 23 56 23 Z" fill="url(#' + gid + '_body)" stroke="#ffffff" stroke-width="0.9"/>';

  // Windshield & Glare
  svg += '<path d="M 26 7.5 L 30 3 L 31 7.5 Z" fill="#38bdf8" fill-opacity="0.75" stroke="#bae6fd" stroke-width="0.5"/>';
  svg += '<path d="M 12 9.5 L 22 8 L 30 3.5 L 40 2.5 L 52 2.5" stroke="rgba(255,255,255,0.7)" stroke-width="0.9" stroke-linecap="round" fill="none"/>';

  // Front bumper and crystal headlight
  svg += '<rect x="4.5" y="18" width="3" height="4.5" rx="1.2" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.5"/>';
  svg += '<circle cx="7.5" cy="15" r="1.8" fill="#fef08a" stroke="#eab308" stroke-width="0.5"/>';

  // Molded Cockpit Bucket
  svg += '<rect x="20" y="7.5" width="35" height="15" rx="4" fill="#090d16" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>';

  // 6 Peg Seats
  seats.forEach((st, idx) => {
    const hasPeg = idx < pegs.length;
    if (hasPeg) {
      const pColor = pegs[idx];
      const grad = pColor === 'pink' ? gid + '_pinkPeg' : gid + '_bluePeg';
      // 3D molded peg head
      svg += '<circle cx="' + st.x + '" cy="' + st.y + '" r="3.4" fill="url(#' + grad + ')" stroke="#ffffff" stroke-width="0.6"/>';
      // Specular highlight glint
      svg += '<circle cx="' + (st.x - 1) + '" cy="' + (st.y - 1) + '" r="0.9" fill="#ffffff" opacity="0.9"/>';
    } else {
      // Empty peg well socket
      svg += '<circle cx="' + st.x + '" cy="' + st.y + '" r="2.8" fill="#020617" stroke="#334155" stroke-width="0.6"/>';
      svg += '<circle cx="' + st.x + '" cy="' + st.y + '" r="1.4" fill="#000000"/>';
    }
  });

  svg += '</svg>';
  return svg;
}

// Authentic SVG 1–10 Rainbow Wheel Component
function renderLifeSpinnerSvg(currentNum: number, spinning: boolean): string {
  const wheelSlices = [
    { n: 1, c: '#ef4444' }, // Red
    { n: 2, c: '#f97316' }, // Orange
    { n: 3, c: '#facc15' }, // Yellow
    { n: 4, c: '#84cc16' }, // Lime
    { n: 5, c: '#10b981' }, // Green
    { n: 6, c: '#06b6d4' }, // Teal
    { n: 7, c: '#3b82f6' }, // Blue
    { n: 8, c: '#6366f1' }, // Indigo
    { n: 9, c: '#a855f7' }, // Purple
    { n: 10, c: '#ec4899' } // Pink
  ];

  let s = '<svg width="90" height="90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block">';
  // Outer notched ring
  s += '<circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))"/>';

  // Rotating dial group
  s += '<g class="spinner-dial" style="transform-origin:50px 50px;">';
  wheelSlices.forEach((sl, i) => {
    const a1 = (i * 36 - 90) * (Math.PI / 180);
    const a2 = ((i + 1) * 36 - 90) * (Math.PI / 180);
    const x1 = 50 + 44 * Math.cos(a1);
    const y1 = 50 + 44 * Math.sin(a1);
    const x2 = 50 + 44 * Math.cos(a2);
    const y2 = 50 + 44 * Math.sin(a2);
    s += '<path d="M 50 50 L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A 44 44 0 0 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z" fill="' + sl.c + '" stroke="#ffffff" stroke-width="1.2"/>';

    // Wedge Number Text
    const midA = ((i + 0.5) * 36 - 90) * (Math.PI / 180);
    const tx = 50 + 30 * Math.cos(midA);
    const ty = 50 + 30 * Math.sin(midA) + 3;
    s += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.8))">' + sl.n + '</text>';
  });
  s += '</g>';

  // Center gold hub
  s += '<circle cx="50" cy="50" r="16" fill="url(#hubGrad)" stroke="#0f172a" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"/>';
  s += '<circle cx="50" cy="50" r="12" fill="#0f172a"/>';
  s += '<text x="50" y="55" font-family="Impact, sans-serif" font-size="14" font-weight="900" fill="#facc15" text-anchor="middle">' + (currentNum > 0 ? currentNum : '10') + '</text>';

  // Pointer indicator needle pointing at top wedge
  s += '<path d="M 50 6 L 44 0 L 56 0 Z" fill="#ffffff" stroke="#b91c1c" stroke-width="1.5" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.7))"/>';

  // Definitions
  s += '<defs><radialGradient id="hubGrad" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#fef08a"/><stop offset="60%" stop-color="#eab308"/><stop offset="100%" stop-color="#854d0e"/></radialGradient></defs>';
  s += '</svg>';
  return s;
}

// Fisher-Yates shuffle for Game of Choices card decks
function shuffleLifeDeck<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// Render official face-down card back
function renderLifeCardBackHtml(deckType: 'career' | 'college' | 'house' | 'life', title?: string, hint?: string): string {
  let badge = '💼';
  let deckName = title || 'CAREER CARD';
  let borderGrad = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)';
  let accent = '#f59e0b';

  if (deckType === 'college') {
    badge = '🎓';
    deckName = title || 'DEGREE CAREER';
    borderGrad = 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #172554 100%)';
    accent = '#93c5fd';
  } else if (deckType === 'house') {
    badge = '🏡';
    deckName = title || 'HOUSE DEED';
    borderGrad = 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #022c22 100%)';
    accent = '#6ee7b7';
  } else if (deckType === 'life') {
    badge = '⭐';
    deckName = title || 'SECRET LIFE TILE';
    borderGrad = 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #3b0764 100%)';
    accent = '#facc15';
  }

  let h = '<div class="life-flip-card-face life-card-back" style="background:' + borderGrad + ';border-color:' + accent + '">';
  h += '<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8))">' + badge + '</div>';
  h += '<div class="life-card-back-title">' + deckName + '</div>';
  h += '<div style="font-size:8px;color:#fef08a;font-weight:800;letter-spacing:1px;margin-top:2px">THE GAME OF CHOICES</div>';
  h += '<div class="life-card-back-hint">' + (hint || '👆 TAP TO FLIP') + '</div>';
  h += '</div>';
  return h;
}

// Render face-down decks tray on board
function renderLifeDeckPilesHtml(S: any): string {
  let h = '<div class="life-board-decks-strip">';

  // 1. Career Pile
  const careerCnt = S.careerDeck ? S.careerDeck.length : 0;
  h += '<div class="life-deck-pile" title="Face-down Career Cards (Non-College Trades)">';
  h += '<div class="life-deck-stack" style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-color:#f59e0b">';
  h += '<span style="font-size:18px">💼</span>';
  h += '<span style="font-size:7px;color:#fef08a;font-weight:900">CAREER</span>';
  h += '</div>';
  h += '<div class="life-deck-label">Career Pile</div>';
  h += '<div class="life-deck-count">' + careerCnt + ' Cards</div>';
  h += '</div>';

  // 2. College Degree Pile
  const collegeCnt = S.collegeDeck ? S.collegeDeck.length : 0;
  h += '<div class="life-deck-pile" title="Face-down Degree Career Cards">';
  h += '<div class="life-deck-stack" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);border-color:#93c5fd">';
  h += '<span style="font-size:18px">🎓</span>';
  h += '<span style="font-size:7px;color:#bfdbfe;font-weight:900">COLLEGE</span>';
  h += '</div>';
  h += '<div class="life-deck-label">Degree Pile</div>';
  h += '<div class="life-deck-count">' + collegeCnt + ' Cards</div>';
  h += '</div>';

  // 3. House Deeds Pile
  const houseCnt = S.houseDeck ? S.houseDeck.length : 0;
  h += '<div class="life-deck-pile" title="Face-down House Deeds">';
  h += '<div class="life-deck-stack" style="background:linear-gradient(135deg,#064e3b,#059669);border-color:#6ee7b7">';
  h += '<span style="font-size:18px">🏡</span>';
  h += '<span style="font-size:7px;color:#a7f3d0;font-weight:900">DEEDS</span>';
  h += '</div>';
  h += '<div class="life-deck-label">House Deeds</div>';
  h += '<div class="life-deck-count">' + houseCnt + ' Deeds</div>';
  h += '</div>';

  // 4. LIFE Tiles Pile
  const lifeCnt = S.lifeDeck ? S.lifeDeck.length : 0;
  h += '<div class="life-deck-pile" title="Face-down Secret LIFE Tiles Pile">';
  h += '<div class="life-deck-stack" style="background:linear-gradient(135deg,#581c87,#7c3aed);border-color:#facc15">';
  h += '<span style="font-size:18px">⭐</span>';
  h += '<span style="font-size:7px;color:#fef08a;font-weight:900">LIFE</span>';
  h += '</div>';
  h += '<div class="life-deck-label">LIFE Pile</div>';
  h += '<div class="life-deck-count">' + lifeCnt + ' Tiles</div>';
  h += '</div>';

  h += '</div>';
  return h;
}

stdInit('life', {
  name: 'The Game of Choices',
  icon: '🚗',
  desc: 'Official Board Edition',
  p: [2, 4],
  payout: PAYOUTS.life,
  rules: 'Official The Game of Choices: Choose College or Career path, spin the 1–10 Rainbow Wheel, advance your station wagon loaded with blue and pink pegs for your family, buy homes, stop for milestones (Graduation, Marriage, Houses), collect Pay Days, and retire at Millionaire Estates with the largest total fortune!',
  newState(C: any) {
    return {
      turn: 0,
      pos: C.names.map(() => 0), // Board Space ID
      cash: C.names.map(() => 10000), // Starting money
      debt: C.names.map(() => 0), // Bank promissory notes
      pegs: C.names.map(() => ['blue']), // Blue/Pink pegs in car (starts with driver)
      married: C.names.map(() => false),
      kids: C.names.map(() => 0),
      career: C.names.map(() => null as any),
      house: C.names.map(() => null as any),
      lifeTiles: C.names.map(() => [] as any[]),
      retired: C.names.map(() => false),
      retireEstate: C.names.map(() => null as string | null),
      pathChosen: C.names.map(() => false),
      pathType: C.names.map(() => '' as 'college' | 'career' | ''),
      // Official Shuffled Face-Down Decks for this new game
      careerDeck: shuffleLifeDeck(LIFE_CAREERS.filter(c => !c.collegeReq)),
      collegeDeck: shuffleLifeDeck(LIFE_CAREERS.filter(c => c.collegeReq)),
      houseDeck: shuffleLifeDeck(LIFE_HOUSES),
      lifeDeck: shuffleLifeDeck(LIFE_TILES_DECK),
      lastSpin: 0,
      activeModal: null as any,
      spinning: false,
      over: false,
      msg: 'Welcome to The Game of Choices! Choose your starting path.'
    };
  },
  ensureCash(S: any, playerIdx: number, neededAmt: number, C: any) {
    if (S.cash[playerIdx] < neededAmt) {
      const deficit = neededAmt - S.cash[playerIdx];
      const loanNeeded = Math.ceil(deficit / 20000) * 20000;
      S.debt[playerIdx] += loanNeeded;
      S.cash[playerIdx] += loanNeeded;
      S.msg = (S.msg ? S.msg + ' · ' : '') + esc(C.seatName(playerIdx)) + ' borrowed $' + loanNeeded + ' from the bank!';
    }
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    const isHuman = C.mine() && !S.over && !S.retired[cur];

    let h = '<div class="life-wrap">';
    h += turnBanner(C);

    // Official 3D Header Banner
    h += '<div class="life-header-banner">';
    h += '<div class="life-mb-badge"><span>🎲</span> OFFICIAL 3D EDITION</div>';
    h += '<div class="life-logo-title">THE GAME OF CHOICES</div>';
    h += '<div class="life-logo-sub">Classic Serpentine Highway · Official Station Wagons &amp; Pegs</div>';
    h += '</div>';

    // 1–10 Rainbow Spinner Station
    h += '<div class="life-spinner-station">';
    h += '<div class="life-spinner-wheel-wrap">';
    h += '<div class="life-spinner-interactive ' + (S.spinning ? 'spinning' : '') + '" id="lifeSpinWheel" title="Tap Wheel to Spin!">';
    h += renderLifeSpinnerSvg(S.lastSpin, S.spinning);
    h += '</div>';
    h += '<div class="life-spinner-info">';
    h += '<div class="life-spinner-badge">Rainbow Wheel</div>';
    h += '<div class="life-spinner-sub">Spin 1 to 10 to Drive Your Car</div>';
    if (S.lastSpin > 0) {
      h += '<div class="life-spinner-last"><span>🎡 Result:</span> <b>' + S.lastSpin + '</b></div>';
    }
    h += '</div>';
    h += '</div>';

    // Interactive Action Controls
    if (!S.over && !S.activeModal) {
      if (!S.pathChosen[cur]) {
        if (isHuman) {
          h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
          h += '<button class="btn small grow" id="chooseCareerPathBtn" style="background:#15803d;color:#fff;font-size:12px">💼 Career Path (Start Working)</button>';
          h += '<button class="btn small grow" id="chooseCollegePathBtn" style="background:#2563eb;color:#fff;font-size:12px">🎓 College Path (-$100K Tuition)</button>';
          h += '</div>';
        } else {
          h += '<div class="muted center" style="font-size:11.5px">' + esc(C.seatName(cur)) + ' selecting starting path...</div>';
        }
      } else {
        if (isHuman) {
          h += '<button class="btn" id="spinBtn" style="font-size:14px;padding:10px 20px;margin:0;background:linear-gradient(135deg,#eab308,#ca8a04);color:#000;font-weight:900;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.5)">🎡 Spin Wheel (' + esc(C.seatName(cur)) + ')</button>';
        } else {
          h += '<div class="muted center" style="font-size:11.5px">Waiting for ' + esc(C.seatName(cur)) + ' to spin...</div>';
        }
      }
    }
    h += '</div>'; // End spinner station

    // Official Face-Down Card Decks Tray on Game Board
    h += renderLifeDeckPilesHtml(S);

    // Status Message Strip
    if (S.msg) {
      h += '<div class="msg" style="margin:6px 0;font-size:12px;font-weight:700">' + esc(S.msg) + '</div>';
    }

    // Modal Overlays for Face-Down Cards (Career, College, Houses, Life Tiles)
    if (S.activeModal) {
      const m = S.activeModal;
      h += '<div class="life-choice-modal">';

      // STARTER CAREER (Face-Down Cards Drawn from Deck)
      if (m.type === 'starter_career') {
        const anyUnflipped = m.flipped && m.flipped.some((f: boolean) => !f);
        h += '<div style="font-size:32px">💼</div>';
        h += '<h3 style="margin:4px 0">Starting Career Draw</h3>';
        h += '<div style="font-size:12px;color:#475569">Cards dealt face down from the shuffled Career Deck. Tap a card to flip and choose:</div>';
        if (isHuman && anyUnflipped) {
          h += '<button class="btn small" id="flipAllCardsBtn" style="margin:8px auto;background:#4338ca;color:#fff;font-size:11px">🎴 Flip All Cards Face Up</button>';
        }
        h += '<div class="life-choice-card-grid">';
        m.options.forEach((cr: any, ci: number) => {
          const isFlipped = m.flipped && m.flipped[ci];
          if (!isFlipped) {
            // Face Down Card Back
            h += '<div class="life-flip-container" data-flip-card="' + ci + '">';
            h += '<div class="life-flip-card-inner">';
            h += renderLifeCardBackHtml('career', 'CAREER CARD', isHuman ? '👆 TAP TO FLIP' : 'Dealing...');
            h += '</div></div>';
          } else {
            // Face Up Revealed Card
            h += '<div class="life-choice-card' + (isHuman ? ' active' : '') + '">';
            h += '<div style="font-size:24px">' + cr.icon + '</div>';
            h += '<div style="font-weight:900;font-size:12.5px;color:#1e293b">' + esc(cr.title) + '</div>';
            h += '<div style="font-size:12px;font-weight:900;color:#15803d;margin-top:2px">Salary: $' + cr.salary + '</div>';
            h += '<div style="font-size:9.5px;color:#64748b">Taxes: $' + cr.taxes + '</div>';
            if (isHuman) {
              h += '<button class="btn small" data-career-choice="' + ci + '" style="margin-top:6px;background:#15803d;color:#fff;font-size:11px;width:100%">Accept Job</button>';
            }
            h += '</div>';
          }
        });
        h += '</div>';
      }

      // COLLEGE DEGREE CAREER (Face-Down Cards Drawn from College Deck)
      else if (m.type === 'career_choice') {
        const anyUnflipped = m.flipped && m.flipped.some((f: boolean) => !f);
        h += '<div style="font-size:32px">🎓</div>';
        h += '<h3 style="margin:4px 0">College Graduation!</h3>';
        h += '<div style="font-size:12px;color:#475569">Diploma cards dealt face down from the Degree Deck. Tap to reveal your career:</div>';
        if (isHuman && anyUnflipped) {
          h += '<button class="btn small" id="flipAllCardsBtn" style="margin:8px auto;background:#2563eb;color:#fff;font-size:11px">🎴 Flip All Diplomas</button>';
        }
        h += '<div class="life-choice-card-grid">';
        m.options.forEach((cr: any, ci: number) => {
          const isFlipped = m.flipped && m.flipped[ci];
          if (!isFlipped) {
            h += '<div class="life-flip-container" data-flip-card="' + ci + '">';
            h += '<div class="life-flip-card-inner">';
            h += renderLifeCardBackHtml('college', 'DEGREE CAREER', isHuman ? '👆 TAP TO FLIP' : 'Dealing...');
            h += '</div></div>';
          } else {
            h += '<div class="life-choice-card' + (isHuman ? ' active' : '') + '">';
            h += '<div style="font-size:24px">' + cr.icon + '</div>';
            h += '<div style="font-weight:900;font-size:12.5px;color:#1e293b">' + esc(cr.title) + '</div>';
            h += '<div style="font-size:12px;font-weight:900;color:#15803d;margin-top:2px">Salary: $' + cr.salary + '</div>';
            h += '<div style="font-size:9.5px;color:#64748b">Taxes: $' + cr.taxes + '</div>';
            if (isHuman) {
              h += '<button class="btn small" data-career-choice="' + ci + '" style="margin-top:6px;background:#2563eb;color:#fff;font-size:11px;width:100%">Select Degree</button>';
            }
            h += '</div>';
          }
        });
        h += '</div>';
      }

      // HOUSE DEED CHOICE (Face-Down Cards Drawn from House Deck)
      else if (m.type === 'house_choice') {
        const anyUnflipped = m.flipped && m.flipped.some((f: boolean) => !f);
        h += '<div style="font-size:32px">🏡</div>';
        h += '<h3 style="margin:4px 0">Purchase Your Family Home</h3>';
        h += '<div style="font-size:12px;color:#475569">House deeds dealt face down from the Deeds Deck. Tap to inspect listings:</div>';
        if (isHuman && anyUnflipped) {
          h += '<button class="btn small" id="flipAllCardsBtn" style="margin:8px auto;background:#059669;color:#fff;font-size:11px">🎴 Flip All Deeds</button>';
        }
        h += '<div class="life-choice-card-grid">';
        m.options.forEach((hs: any, hi: number) => {
          const isFlipped = m.flipped && m.flipped[hi];
          if (!isFlipped) {
            h += '<div class="life-flip-container" data-flip-card="' + hi + '">';
            h += '<div class="life-flip-card-inner">';
            h += renderLifeCardBackHtml('house', 'HOUSE DEED', isHuman ? '👆 TAP TO FLIP' : 'Inspecting...');
            h += '</div></div>';
          } else {
            h += '<div class="life-choice-card' + (isHuman ? ' active' : '') + '">';
            h += '<div style="font-size:24px">' + hs.icon + '</div>';
            h += '<div style="font-weight:900;font-size:12px;color:#1e293b">' + esc(hs.title) + '</div>';
            h += '<div style="font-size:11px;color:#b91c1c;font-weight:900">Cost: $' + hs.cost + '</div>';
            h += '<div style="font-size:10px;color:#15803d;font-weight:800">Resale: $' + hs.resale + '</div>';
            if (isHuman) {
              h += '<button class="btn small" data-house-choice="' + hi + '" style="margin-top:6px;background:#059669;color:#fff;font-size:11px;width:100%">Buy House</button>';
            }
            h += '</div>';
          }
        });
        h += '</div>';
      }

      // MID-LIFE CRISIS CHOICE
      else if (m.type === 'crisis_choice') {
        h += '<div style="font-size:32px">🛑</div>';
        h += '<h3 style="margin:4px 0">Mid-Life Reflection!</h3>';
        h += '<div style="font-size:12px;color:#475569;margin-bottom:10px">Choose your path forward:</div>';
        if (isHuman) {
          h += '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">';
          h += '<button class="btn small grow" data-crisis-choice="sabbatical" style="background:#7c3aed;color:#fff">🏖️ Family Sabbatical (+2 LIFE Tiles)</button>';
          h += '<button class="btn small grow" data-crisis-choice="school" style="background:#2563eb;color:#fff">🎓 Night School (Upgrade Career)</button>';
          h += '</div>';
        }
      }

      // LIFE TILE DRAWN (Face-Down Secret Tile from LIFE Pile)
      else if (m.type === 'life_card') {
        const isFlipped = !!m.flipped;
        h += '<div style="font-size:32px">⭐</div>';
        h += '<h3 style="margin:4px 0">Secret LIFE Tile!</h3>';
        if (!isFlipped) {
          h += '<div style="font-size:12px;color:#475569;margin-bottom:8px">Drawn face down from the shuffled LIFE Pile. Tap to reveal your secret bonus:</div>';
          h += '<div style="max-width:180px;margin:0 auto">';
          h += '<div class="life-flip-container" id="flipLifeTileContainer">';
          h += '<div class="life-flip-card-inner">';
          h += renderLifeCardBackHtml('life', 'SECRET LIFE TILE', isHuman ? '👆 TAP TO REVEAL' : 'Revealing...');
          h += '</div></div></div>';
          if (isHuman) {
            h += '<button class="btn small" id="revealLifeTileBtn" style="margin-top:10px;background:#7c3aed;color:#fff">Reveal Secret Tile</button>';
          }
        } else {
          h += '<div style="font-size:36px;margin:6px 0">' + m.tile.icon + '</div>';
          h += '<div style="font-weight:900;font-size:15px;color:#7e22ce;margin:4px 0">' + esc(m.tile.title) + '</div>';
          h += '<div style="font-size:16px;font-weight:900;color:#15803d;margin-bottom:8px">Value at Retirement: +$' + m.tile.amt + '</div>';
          if (isHuman) {
            h += '<button class="btn small" id="ackLifeTileBtn" style="background:#7c3aed;color:#fff;font-weight:900">Collect &amp; Keep Tile</button>';
          } else {
            h += '<div class="muted" style="font-size:11px">Computer keeping LIFE tile...</div>';
          }
        }
      }

      // RETIREMENT ESTATE CHOICE
      else if (m.type === 'retire_choice') {
        h += '<div style="font-size:32px">🌴</div>';
        h += '<h3 style="margin:4px 0">Choose Retirement Haven</h3>';
        h += '<div style="font-size:12px;color:#475569;margin-bottom:10px">Where will you spend your golden retirement?</div>';
        if (isHuman) {
          h += '<div style="display:flex;gap:10px;justify-content:center">';
          h += '<button class="btn small grow" data-retire-estate="countryside" style="background:#15803d;color:#fff">🌾 Countryside Acres</button>';
          h += '<button class="btn small grow" data-retire-estate="millionaire" style="background:#eab308;color:#000;font-weight:900">🌴 Millionaire Estates</button>';
          h += '</div>';
        }
      }

      h += '</div>';
    }

    // Authentic Board Container
    h += '<div class="life-board-container">';

    // SECTION 1: START FORK & UNIVERSITY
    h += '<div class="life-landmark-banner">';
    h += '<div class="life-landmark-left"><span class="life-landmark-icon">🏛️</span><div><div class="life-landmark-title">Milton University &amp; Career Fork</div><div class="life-landmark-desc">College Branch (Tuition Debt &amp; Degree Careers) vs. Career Branch (Direct Trade)</div></div></div>';
    h += '<span class="life-landmark-tag">Spaces 0–5</span>';
    h += '</div>';

    // Starting track highway (College on top, Career on bottom)
    h += '<div style="font-size:10.5px;font-weight:900;color:#93c5fd;margin:4px 0 2px 4px;text-transform:uppercase">🎓 College Track (Leading to Graduation STOP)</div>';
    h += '<div class="life-track-highway">';
    // Start space
    const startCars = S.pos.map((p: number, i: number) => p === 0 ? i : -1).filter((i: number) => i >= 0);
    h += '<div class="life-tile ' + (startCars.includes(cur) ? 'current-tile' : '') + '">';
    h += '<div class="life-tile-top"><span>#0</span><span class="life-tile-badge">START</span></div>';
    h += '<div class="life-tile-body"><span class="life-tile-icon">🏁</span><span class="life-tile-title">START</span><span style="font-size:7px;color:#64748b">Choose Path</span></div>';
    h += '<div class="life-car-dock">';
    startCars.forEach((pi: number) => {
      h += '<div class="life-car-mini-wrap" title="' + esc(C.seatName(pi)) + '">' + renderLifeCarSvg(pi, S.pegs[pi], { width: 50, height: 25, isCurrent: pi === cur }) + '</div>';
    });
    h += '</div></div>';

    LIFE_COLLEGE_SPACES.forEach((sq) => {
      const isHere = S.pos.map((p: number, i: number) => (p === sq.id && S.pathType[i] === 'college') ? i : -1).filter((i: number) => i >= 0);
      let cls = 'life-tile';
      if (sq.type === 'stop') cls += ' stop-tile';
      else if (sq.type === 'life') cls += ' life-tile-draw';
      else cls += ' orange-action';
      if (isHere.includes(cur)) cls += ' current-tile';

      h += '<div class="' + cls + '">';
      h += '<div class="life-tile-top"><span>#' + sq.id + 'C</span><span class="life-tile-badge ' + (sq.type === 'stop' ? 'stop' : (sq.type === 'life' ? 'life' : 'action')) + '">' + (sq.type === 'stop' ? 'STOP' : 'COLLEGE') + '</span></div>';
      h += '<div class="life-tile-body"><span class="life-tile-icon">' + sq.icon + '</span><span class="life-tile-title">' + esc(sq.title) + '</span>';
      if (sq.amt) h += '<span class="life-tile-amt">+$' + sq.amt + '</span>';
      if (sq.cost) h += '<span class="life-tile-amt cost">-$' + sq.cost + '</span>';
      h += '</div>';
      h += '<div class="life-car-dock">';
      isHere.forEach((pi: number) => {
        h += '<div class="life-car-mini-wrap" title="' + esc(C.seatName(pi)) + '">' + renderLifeCarSvg(pi, S.pegs[pi], { width: 50, height: 25, isCurrent: pi === cur }) + '</div>';
      });
      h += '</div></div>';
    });
    h += '</div>'; // End college track

    h += '<div style="font-size:10.5px;font-weight:900;color:#86efac;margin:6px 0 2px 4px;text-transform:uppercase">💼 Career Track (Workforce &amp; Trade Jobs)</div>';
    h += '<div class="life-track-highway">';
    LIFE_CAREER_SPACES.forEach((sq) => {
      const isHere = S.pos.map((p: number, i: number) => (p === sq.id && S.pathType[i] === 'career') ? i : -1).filter((i: number) => i >= 0);
      let cls = 'life-tile orange-action';
      if (isHere.includes(cur)) cls += ' current-tile';

      h += '<div class="' + cls + '">';
      h += '<div class="life-tile-top"><span>#' + sq.id + 'K</span><span class="life-tile-badge action">CAREER</span></div>';
      h += '<div class="life-tile-body"><span class="life-tile-icon">' + sq.icon + '</span><span class="life-tile-title">' + esc(sq.title) + '</span>';
      if (sq.amt) h += '<span class="life-tile-amt">+$' + sq.amt + '</span>';
      if (sq.cost) h += '<span class="life-tile-amt cost">-$' + sq.cost + '</span>';
      h += '</div>';
      h += '<div class="life-car-dock">';
      isHere.forEach((pi: number) => {
        h += '<div class="life-car-mini-wrap" title="' + esc(C.seatName(pi)) + '">' + renderLifeCarSvg(pi, S.pegs[pi], { width: 50, height: 25, isCurrent: pi === cur }) + '</div>';
      });
      h += '</div></div>';
    });
    h += '</div>'; // End career track

    // Serpentine Road Switchback Turn into Valley
    h += '<div class="life-switchback-turn"><span>↶</span><span>SERPENTINE ROAD CURVES AHEAD · PATHS MERGE AT SPACE 6 PAY DAY</span><span>↷</span></div>';

    // SECTION 2: EARLY CAREER & MARRIAGE CHAPEL
    h += '<div class="life-landmark-banner">';
    h += '<div class="life-landmark-left"><span class="life-landmark-icon">⛪</span><div><div class="life-landmark-title">The Wedding Chapel &amp; First Pay Days</div><div class="life-landmark-desc">Both paths merge at Space 6 Pay Day. Stop at the Chapel to marry &amp; add spouse peg!</div></div></div>';
    h += '<span class="life-landmark-tag">Spaces 6–14</span>';
    h += '</div>';

    h += '<div class="life-track-highway">';
    LIFE_MAIN_SPACES.slice(0, 9).forEach((sq) => {
      const isHere = S.pos.map((p: number, i: number) => p === sq.id ? i : -1).filter((i: number) => i >= 0);
      let cls = 'life-tile';
      if (sq.type === 'payday') cls += ' payday-tile';
      else if (sq.type === 'stop') cls += ' stop-tile';
      else if (sq.type === 'life') cls += ' life-tile-draw';
      else cls += ' orange-action';
      if (isHere.includes(cur)) cls += ' current-tile';

      h += '<div class="' + cls + '">';
      h += '<div class="life-tile-top"><span>#' + sq.id + '</span><span class="life-tile-badge ' + (sq.type === 'payday' ? 'payday' : (sq.type === 'stop' ? 'stop' : (sq.type === 'life' ? 'life' : 'action'))) + '">' + (sq.type === 'payday' ? 'PAY DAY' : (sq.type === 'stop' ? 'STOP' : (sq.type === 'life' ? 'LIFE' : 'ACTION'))) + '</span></div>';
      h += '<div class="life-tile-body"><span class="life-tile-icon">' + sq.icon + '</span><span class="life-tile-title">' + esc(sq.title) + '</span>';
      if (sq.amt) h += '<span class="life-tile-amt">+$' + sq.amt + '</span>';
      if (sq.cost) h += '<span class="life-tile-amt cost">-$' + sq.cost + '</span>';
      h += '</div>';
      h += '<div class="life-car-dock">';
      isHere.forEach((pi: number) => {
        h += '<div class="life-car-mini-wrap" title="' + esc(C.seatName(pi)) + '">' + renderLifeCarSvg(pi, S.pegs[pi], { width: 50, height: 25, isCurrent: pi === cur }) + '</div>';
      });
      h += '</div></div>';
    });
    h += '</div>'; // End section 2

    // River Barrier & Stone Arched Bridge
    h += '<div class="life-river-barrier"><div style="font-size:16px">🌊</div><div class="life-river-title">🌉 STONE ARCHED BRIDGE OVER CRYSTAL RIVER 🌉</div><div style="font-size:16px">🌊</div></div>';

    // SECTION 3: FAMILY LIFE, SUBURBAN HOUSES & MID-LIFE CRISIS
    h += '<div class="life-landmark-banner">';
    h += '<div class="life-landmark-left"><span class="life-landmark-icon">🏡</span><div><div class="life-landmark-title">Family Living &amp; Mid-Life Crisis</div><div class="life-landmark-desc">Add baby pegs (blue &amp; pink) to your wagon back seats. Cross to Mid-Life Crisis!</div></div></div>';
    h += '<span class="life-landmark-tag">Spaces 15–23</span>';
    h += '</div>';

    h += '<div class="life-track-highway">';
    LIFE_MAIN_SPACES.slice(9, 18).forEach((sq) => {
      const isHere = S.pos.map((p: number, i: number) => p === sq.id ? i : -1).filter((i: number) => i >= 0);
      let cls = 'life-tile';
      if (sq.type === 'payday') cls += ' payday-tile';
      else if (sq.type === 'stop') cls += ' stop-tile';
      else if (sq.type === 'baby') cls += ' baby-tile';
      else if (sq.type === 'life') cls += ' life-tile-draw';
      else cls += ' orange-action';
      if (isHere.includes(cur)) cls += ' current-tile';

      h += '<div class="' + cls + '">';
      h += '<div class="life-tile-top"><span>#' + sq.id + '</span><span class="life-tile-badge ' + (sq.type === 'payday' ? 'payday' : (sq.type === 'stop' ? 'stop' : (sq.type === 'baby' ? 'baby' : (sq.type === 'life' ? 'life' : 'action')))) + '">' + (sq.type === 'payday' ? 'PAY DAY' : (sq.type === 'stop' ? 'STOP' : (sq.type === 'baby' ? 'BABY' : (sq.type === 'life' ? 'LIFE' : 'ACTION')))) + '</span></div>';
      h += '<div class="life-tile-body"><span class="life-tile-icon">' + sq.icon + '</span><span class="life-tile-title">' + esc(sq.title) + '</span>';
      if (sq.amt) h += '<span class="life-tile-amt">+$' + sq.amt + '</span>';
      if (sq.cost) h += '<span class="life-tile-amt cost">-$' + sq.cost + '</span>';
      h += '</div>';
      h += '<div class="life-car-dock">';
      isHere.forEach((pi: number) => {
        h += '<div class="life-car-mini-wrap" title="' + esc(C.seatName(pi)) + '">' + renderLifeCarSvg(pi, S.pegs[pi], { width: 50, height: 25, isCurrent: pi === cur }) + '</div>';
      });
      h += '</div></div>';
    });
    h += '</div>'; // End section 3

    // Serpentine Road Switchback Turn to Corporate Coast
    h += '<div class="life-switchback-turn"><span>↶</span><span>GOLDEN HIGHWAY EXPRESSWAY · WINDS TOWARD RETIREMENT RESORTS</span><span>↷</span></div>';

    // SECTION 4: CORPORATE WEALTH & RETIREMENT ESTATES
    h += '<div class="life-landmark-banner">';
    h += '<div class="life-landmark-left"><span class="life-landmark-icon">🌴</span><div><div class="life-landmark-title">Late Career Wealth &amp; Retirement Resorts</div><div class="life-landmark-desc">Collect late-career Pay Days and retire at Millionaire Estates or Countryside Acres!</div></div></div>';
    h += '<span class="life-landmark-tag">Spaces 24–33</span>';
    h += '</div>';

    h += '<div class="life-track-highway">';
    LIFE_MAIN_SPACES.slice(18).forEach((sq) => {
      const isHere = S.pos.map((p: number, i: number) => p === sq.id ? i : -1).filter((i: number) => i >= 0);
      let cls = 'life-tile';
      if (sq.type === 'payday') cls += ' payday-tile';
      else if (sq.type === 'stop') cls += sq.stopType === 'retire' ? ' retire-tile' : ' stop-tile';
      else if (sq.type === 'life') cls += ' life-tile-draw';
      else cls += ' orange-action';
      if (isHere.includes(cur)) cls += ' current-tile';

      h += '<div class="' + cls + '">';
      h += '<div class="life-tile-top"><span>#' + sq.id + '</span><span class="life-tile-badge ' + (sq.type === 'payday' ? 'payday' : (sq.type === 'stop' ? (sq.stopType === 'retire' ? 'retire' : 'stop') : (sq.type === 'life' ? 'life' : 'action'))) + '">' + (sq.type === 'payday' ? 'PAY DAY' : (sq.stopType === 'retire' ? 'RETIRE' : 'STOP')) + '</span></div>';
      h += '<div class="life-tile-body"><span class="life-tile-icon">' + sq.icon + '</span><span class="life-tile-title">' + esc(sq.title) + '</span>';
      if (sq.amt) h += '<span class="life-tile-amt">+$' + sq.amt + '</span>';
      if (sq.cost) h += '<span class="life-tile-amt cost">-$' + sq.cost + '</span>';
      h += '</div>';
      h += '<div class="life-car-dock">';
      isHere.forEach((pi: number) => {
        h += '<div class="life-car-mini-wrap" title="' + esc(C.seatName(pi)) + '">' + renderLifeCarSvg(pi, S.pegs[pi], { width: 50, height: 25, isCurrent: pi === cur }) + '</div>';
      });
      h += '</div></div>';
    });
    h += '</div>'; // End section 4

    h += '</div>'; // End life-board-container

    // Official Station Wagon Blueprint Player Dashboard
    h += '<div class="life-players-ledger">';
    S.pos.forEach((pId: number, i: number) => {
      const isCur = i === cur && !S.over;
      const carCol = LIFE_CAR_COLORS[i % 4];
      const carNm = LIFE_CAR_NAMES[i % 4];
      const cr = S.career[i];
      const hs = S.house[i];
      const tileTotal = S.lifeTiles[i].reduce((sum: number, t: any) => sum + t.amt, 0);

      h += '<div class="life-player-card ' + (isCur ? 'active' : '') + '">';
      h += '<div style="display:flex;align-items:center;justify-content:space-between">';
      h += '<div style="display:flex;align-items:center;gap:6px">';
      h += '<span style="font-weight:900;font-size:13.5px;color:' + carCol + '">' + esc(C.seatName(i)) + (isCur ? ' ⭐' : '') + '</span>';
      h += '<span style="font-size:10px;color:#94a3b8;font-weight:700">(' + carNm + ')</span>';
      h += '</div>';
      h += '<span style="font-size:11px;color:#facc15;font-weight:800">' + (S.retired[i] ? '🌴 ' + (S.retireEstate[i] || 'Retired') : 'Space #' + pId) + '</span>';
      h += '</div>';

      // Enlarged SVG Blueprint of Car Piece with Passengers
      h += '<div class="life-car-blueprint-strip">';
      h += renderLifeCarSvg(i, S.pegs[i], { width: 96, height: 48, isCurrent: isCur });
      h += '<div class="life-car-seats-legend">';
      h += '<div class="life-seat-tag"><span class="life-peg-dot blue"></span> Driver: <b>' + esc(C.seatName(i)) + '</b></div>';
      h += '<div class="life-seat-tag"><span class="life-peg-dot pink"></span> Spouse: <b>' + (S.married[i] ? 'Married' : 'Single') + '</b></div>';
      h += '<div class="life-seat-tag">👶 Children: <b>' + S.kids[i] + ' Peg(s)</b></div>';
      h += '</div>';
      h += '</div>';

      h += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-top:2px">';
      h += '<span>💵 Cash: <b style="color:#4ade80">$' + S.cash[i] + '</b></span>';
      if (S.debt[i] > 0) {
        h += '<span>Debt: <b style="color:#f87171">$' + S.debt[i] + '</b></span>';
      }
      h += '</div>';

      h += '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#cbd5e1;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;margin-top:2px">';
      h += '<span>Job: <b>' + (cr ? cr.icon + ' ' + cr.title + ' ($' + cr.salary + ')' : (S.pathType[i] === 'college' ? 'Student' : 'Undecided')) + '</b></span>';
      h += '<span>Home: <b>' + (hs ? hs.icon + ' ' + hs.title : 'None') + '</b></span>';
      h += '</div>';

      h += '<div style="display:flex;align-items:center;justify-content:space-between;font-size:10.5px;color:#c084fc;margin-top:2px">';
      h += '<span>🏆 ' + S.lifeTiles[i].length + ' LIFE Tiles (Value: $' + tileTotal + ')</span>';
      h += '</div>';

      h += '</div>'; // End life-player-card
    });
    h += '</div>'; // End life-players-ledger

    h += '</div>'; // End life-wrap

    R.innerHTML = h;

    // Attach Click Event Handlers
    const spinWheel = $('#lifeSpinWheel');
    if (spinWheel) spinWheel.onclick = () => g.doSpin(C);

    const spinBtn = $('#spinBtn');
    if (spinBtn) spinBtn.onclick = () => g.doSpin(C);

    const careerPathBtn = $('#chooseCareerPathBtn');
    if (careerPathBtn) careerPathBtn.onclick = () => g.doChoosePath(C, 'career');

    const collegePathBtn = $('#chooseCollegePathBtn');
    if (collegePathBtn) collegePathBtn.onclick = () => g.doChoosePath(C, 'college');

    const ackLifeBtn = $('#ackLifeTileBtn');
    if (ackLifeBtn) ackLifeBtn.onclick = () => g.doDismissModal(C);

    const revealLifeBtn = $('#revealLifeTileBtn');
    if (revealLifeBtn) revealLifeBtn.onclick = () => g.doFlipLifeTile(C);

    const flipLifeTileContainer = $('#flipLifeTileContainer');
    if (flipLifeTileContainer) flipLifeTileContainer.onclick = () => g.doFlipLifeTile(C);

    const flipAllBtn = $('#flipAllCardsBtn');
    if (flipAllBtn) flipAllBtn.onclick = () => g.doFlipAllCards(C);

    // Face-down card flip clicks
    R.querySelectorAll('[data-flip-card]').forEach((b: any) => {
      b.onclick = () => {
        const cIdx = +b.dataset.flipCard;
        g.doFlipCard(C, cIdx);
      };
    });

    // Career Selection clicks
    R.querySelectorAll('[data-career-choice]').forEach((b: any) => {
      b.onclick = () => {
        const cIdx = +b.dataset.careerChoice;
        g.doSelectCareer(C, cIdx);
      };
    });

    // House Deed clicks
    R.querySelectorAll('[data-house-choice]').forEach((b: any) => {
      b.onclick = () => {
        const hIdx = +b.dataset.houseChoice;
        g.doSelectHouse(C, hIdx);
      };
    });

    // Mid-Life Crisis clicks
    R.querySelectorAll('[data-crisis-choice]').forEach((b: any) => {
      b.onclick = () => {
        const choice = b.dataset.crisisChoice;
        g.doSelectCrisis(C, choice);
      };
    });

    // Retirement Estate clicks
    R.querySelectorAll('[data-retire-estate]').forEach((b: any) => {
      b.onclick = () => {
        const est = b.dataset.retireEstate;
        g.doSelectRetirement(C, est);
      };
    });
  },
  doFlipCard(C: any, cardIdx: number) {
    const S = C.S;
    if (!S.activeModal || !S.activeModal.flipped) return;
    S.activeModal.flipped[cardIdx] = true;
    Sound.click();
    C.update(() => {});
  },
  doFlipAllCards(C: any) {
    const S = C.S;
    if (!S.activeModal) return;
    if (S.activeModal.flipped) {
      if (Array.isArray(S.activeModal.flipped)) {
        S.activeModal.flipped = S.activeModal.flipped.map(() => true);
      } else {
        S.activeModal.flipped = true;
      }
    }
    Sound.win();
    C.update(() => {});
  },
  doFlipLifeTile(C: any) {
    const S = C.S;
    if (!S.activeModal || S.activeModal.type !== 'life_card') return;
    S.activeModal.flipped = true;
    Sound.win();
    C.update(() => {});
  },
  doChoosePath(C: any, path: 'college' | 'career') {
    const S = C.S, g = this;
    const cur = S.turn;
    S.pathChosen[cur] = true;
    S.pathType[cur] = path;

    if (path === 'college') {
      // College borrows $100K tuition debt and starts at college entrance
      S.debt[cur] += 100000;
      S.pos[cur] = 0;
      S.msg = esc(C.seatName(cur)) + ' enrolled in COLLEGE! Borrowed $100K tuition. Spin the wheel to begin!';
      Sound.win();
      C.update(() => {});
      maybeCpu(C);
    } else {
      // Draw 3 cards face down from shuffled Career Deck
      if (!S.careerDeck || S.careerDeck.length < 3) {
        S.careerDeck = shuffleLifeDeck(LIFE_CAREERS.filter(c => !c.collegeReq));
      }
      const drawn = S.careerDeck.splice(0, 3);
      S.pos[cur] = 0;
      S.activeModal = {
        type: 'starter_career',
        options: drawn,
        flipped: [false, false, false]
      };
      S.msg = esc(C.seatName(cur)) + ' entered the CAREER track! 3 cards dealt face down from the Career Deck.';
      Sound.click();
      C.update(() => {});
      maybeCpu(C);
    }
  },
  doSpin(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    if (S.over || S.retired[cur] || S.activeModal || S.spinning) return;

    S.spinning = true;
    const spin = ri(1, 10);
    Sound.spin();
    S.lastSpin = spin;
    C.update(() => {});

    setTimeout(() => {
      S.spinning = false;
      const curPos = S.pos[cur];
      const isCol = S.pathType[cur] === 'college';
      let targetPos = curPos + spin;

      // Check branch limits
      if (curPos < 5) {
        if (isCol && targetPos >= 5) {
          // Must STOP at College Graduation
          targetPos = 5;
        } else if (!isCol && targetPos > 5) {
          // Career moves onto main highway from space 5
        }
      } else {
        // Main Highway: Check mandatory STOP spaces:
        // Space 9: Marriage STOP
        // Space 14: Buy House STOP
        // Space 23: Mid-Life Crisis STOP
        // Space 33: Retirement STOP
        const stops = [9, 14, 23, 33];
        for (const st of stops) {
          if (curPos < st && targetPos >= st) {
            targetPos = st;
            break;
          }
        }
        if (targetPos > 33) targetPos = 33;

        // Check passed green PAY DAY spaces:
        const paydays = [6, 11, 16, 20, 24, 28, 31];
        for (const pd of paydays) {
          if (curPos < pd && targetPos > pd) {
            if (S.career[cur]) {
              S.cash[cur] += S.career[cur].salary;
              S.msg = '💵 Passed PAY DAY! Collected $' + S.career[cur].salary + ' salary.';
              Sound.win();
            }
          }
        }
      }

      S.pos[cur] = targetPos;
      g.handleLandedSpace(C, targetPos);
    }, 800);
  },
  handleLandedSpace(C: any, spaceId: number) {
    const S = C.S, g = this;
    const cur = S.turn;
    const sq: any = getLifeSpace(S, cur, spaceId);

    // STOP SPACES
    if (sq.type === 'stop') {
      if (sq.stopType === 'career_choice') {
        // Draw 3 cards face down from Degree Deck
        if (!S.collegeDeck || S.collegeDeck.length < 3) {
          S.collegeDeck = shuffleLifeDeck(LIFE_CAREERS.filter(c => c.collegeReq));
        }
        const drawn = S.collegeDeck.splice(0, 3);
        S.activeModal = {
          type: 'career_choice',
          options: drawn,
          flipped: [false, false, false]
        };
        S.msg = '🎓 STOP: College Graduation! 3 diploma cards dealt face down from the Degree Deck.';
        Sound.win();
        C.update(() => {});
        maybeCpu(C);
        return;
      }
      if (sq.stopType === 'marriage') {
        S.married[cur] = true;
        // Add pink or blue spouse peg
        const spousePeg = S.pegs[cur][0] === 'blue' ? 'pink' : 'blue';
        S.pegs[cur].push(spousePeg);
        // Draw 1 LIFE Tile from shuffled LIFE pile
        if (!S.lifeDeck || S.lifeDeck.length === 0) {
          S.lifeDeck = shuffleLifeDeck(LIFE_TILES_DECK);
        }
        const tile = S.lifeDeck.pop();
        if (tile) S.lifeTiles[cur].push(tile);
        // Collect wedding gifts from each player
        const giftTotal = (C.names.length - 1) * 10000;
        C.names.forEach((_: any, pi: number) => {
          if (pi !== cur) {
            g.ensureCash(S, pi, 10000, C);
            S.cash[pi] -= 10000;
          }
        });
        S.cash[cur] += giftTotal;
        S.msg = '💍 STOP: Just Married! Added spouse peg to station wagon. Collected $' + giftTotal + ' gifts & 1 LIFE Tile!';
        Sound.win();
        g.nextTurn(C);
        return;
      }
      if (sq.stopType === 'house') {
        // Draw 3 house deeds face down from shuffled House Deeds deck
        if (!S.houseDeck || S.houseDeck.length < 3) {
          S.houseDeck = shuffleLifeDeck(LIFE_HOUSES);
        }
        const drawn = S.houseDeck.splice(0, 3);
        S.activeModal = {
          type: 'house_choice',
          options: drawn,
          flipped: [false, false, false]
        };
        S.msg = '🏡 STOP: House Hunting! 3 deed cards dealt face down from House Deeds Deck.';
        Sound.click();
        C.update(() => {});
        maybeCpu(C);
        return;
      }
      if (sq.stopType === 'crisis') {
        S.activeModal = { type: 'crisis_choice' };
        S.msg = '🛑 STOP: Mid-Life Reflection! Choose Night School or Sabbatical.';
        Sound.click();
        C.update(() => {});
        maybeCpu(C);
        return;
      }
      if (sq.stopType === 'retire') {
        S.activeModal = { type: 'retire_choice' };
        S.msg = '🌴 STOP: Welcome to Retirement! Choose Millionaire Estates or Countryside Acres.';
        Sound.win();
        C.update(() => {});
        maybeCpu(C);
        return;
      }
    }

    // PAY DAY LANDED
    if (sq.type === 'payday') {
      if (S.career[cur]) {
        S.cash[cur] += S.career[cur].salary;
        S.msg = '💵 Landed on PAY DAY! Deposited $' + S.career[cur].salary + ' salary!';
        Sound.win();
      } else {
        S.msg = 'Landed on Pay Day with no active job.';
      }
      g.nextTurn(C);
      return;
    }

    // LIFE TILE DRAW (Dealt Face Down from LIFE Pile)
    if (sq.type === 'life') {
      if (!S.lifeDeck || S.lifeDeck.length === 0) {
        S.lifeDeck = shuffleLifeDeck(LIFE_TILES_DECK);
      }
      const tile = S.lifeDeck.pop();
      if (tile) {
        S.lifeTiles[cur].push(tile);
        S.activeModal = { type: 'life_card', tile, flipped: false };
        S.msg = esc(C.seatName(cur)) + ' drew a face-down LIFE Tile from the pile!';
        Sound.click();
        C.update(() => {});
        maybeCpu(C);
      } else {
        g.nextTurn(C);
      }
      return;
    }

    // BABY SPACES
    if (sq.type === 'baby') {
      const count = sq.count || 1;
      S.kids[cur] += count;
      for (let k = 0; k < count; k++) {
        const pCol = sq.gender === 'pink' ? 'pink' : (sq.gender === 'blue' ? 'blue' : (k === 0 ? 'blue' : 'pink'));
        S.pegs[cur].push(pCol);
      }
      // Baby shower gift bonuses from players
      const babyGift = count * 5000;
      S.cash[cur] += babyGift;
      S.msg = '👶 ' + (count > 1 ? 'Adopted Twins!' : 'New baby!') + ' Added ' + count + ' peg(s) to wagon! Collected $' + babyGift + ' shower gifts!';
      Sound.win();
      g.nextTurn(C);
      return;
    }

    // ACTION SPACES
    if (sq.type === 'action') {
      if (sq.amt) {
        S.cash[cur] += sq.amt;
        S.msg = esc(C.seatName(cur)) + ' landed on ' + sq.title + ': Collected +$' + sq.amt + '!';
        Sound.win();
      } else if (sq.cost) {
        g.ensureCash(S, cur, sq.cost, C);
        S.cash[cur] -= sq.cost;
        S.msg = esc(C.seatName(cur)) + ' paid $' + sq.cost + ' for ' + sq.title + '.';
        Sound.click();
      }
    } else if (sq.type === 'kids_expense') {
      const totalCost = (sq.costPerChild || 20000) * S.kids[cur];
      if (totalCost > 0) {
        g.ensureCash(S, cur, totalCost, C);
        S.cash[cur] -= totalCost;
        S.msg = esc(C.seatName(cur)) + ' paid $' + totalCost + ' tuition for ' + S.kids[cur] + ' child(ren).';
      } else {
        S.msg = 'No children tuition required!';
      }
      Sound.click();
    }

    g.nextTurn(C);
  },
  doSelectCareer(C: any, careerIdx: number) {
    const S = C.S, g = this;
    const cur = S.turn;
    if (!S.activeModal || !S.activeModal.options) return;
    const options = S.activeModal.options;
    const chosen = options[careerIdx] || options[0];
    S.career[cur] = chosen;
    const isStarter = S.activeModal.type === 'starter_career';
    S.activeModal = null;
    S.msg = esc(C.seatName(cur)) + ' accepted position: ' + chosen.icon + ' ' + chosen.title + ' (Salary: $' + chosen.salary + ')!';
    Sound.win();

    if (isStarter) {
      // Starter choice keeps current turn so player can immediately spin wheel!
      C.update(() => {});
      if (!C.mine()) {
        cpuDelay(() => {
          if (window._C === C && !S.over && S.turn === cur && !S.activeModal) {
            g.doSpin(C);
          }
        }, 600);
      }
    } else {
      g.nextTurn(C);
    }
  },
  doSelectHouse(C: any, houseIdx: number) {
    const S = C.S, g = this;
    const cur = S.turn;
    const options = (S.activeModal && S.activeModal.options) || LIFE_HOUSES;
    const hs = options[houseIdx] || options[0] || LIFE_HOUSES[0];
    g.ensureCash(S, cur, hs.cost, C);
    S.cash[cur] -= hs.cost;
    S.house[cur] = hs;
    S.activeModal = null;
    S.msg = esc(C.seatName(cur)) + ' bought a ' + hs.icon + ' ' + hs.title + ' for $' + hs.cost + '!';
    Sound.win();
    g.nextTurn(C);
  },
  doSelectCrisis(C: any, choice: string) {
    const S = C.S, g = this;
    const cur = S.turn;
    S.activeModal = null;

    if (choice === 'school') {
      // Switch to higher degree career
      const degreeJobs = LIFE_CAREERS.filter(c => c.collegeReq);
      const chosen = degreeJobs[ri(0, degreeJobs.length - 1)];
      S.career[cur] = chosen;
      S.msg = esc(C.seatName(cur)) + ' completed Night School! Promoted to ' + chosen.icon + ' ' + chosen.title + ' ($' + chosen.salary + ')!';
    } else {
      // Sabbatical: draw 2 bonus LIFE tiles
      if (!S.lifeDeck || S.lifeDeck.length < 2) {
        S.lifeDeck = shuffleLifeDeck(LIFE_TILES_DECK);
      }
      const t1 = S.lifeDeck.pop();
      const t2 = S.lifeDeck.pop();
      if (t1) S.lifeTiles[cur].push(t1);
      if (t2) S.lifeTiles[cur].push(t2);
      S.msg = esc(C.seatName(cur)) + ' took a Family Sabbatical and collected 2 bonus LIFE Tiles!';
    }
    Sound.win();
    g.nextTurn(C);
  },
  doSelectRetirement(C: any, estate: string) {
    const S = C.S, g = this;
    const cur = S.turn;
    S.retired[cur] = true;
    S.retireEstate[cur] = estate === 'millionaire' ? 'Millionaire Estates' : 'Countryside Acres';
    S.activeModal = null;

    // Bonus for first retiree
    const alreadyRetired = S.retired.filter((r: boolean) => r).length;
    if (alreadyRetired === 1) {
      S.cash[cur] += 400000;
      S.msg = '🏆 ' + esc(C.seatName(cur)) + ' was 1st to retire! Collected $400,000 retirement bonus!';
    } else if (alreadyRetired === 2) {
      S.cash[cur] += 200000;
      S.msg = '🥈 ' + esc(C.seatName(cur)) + ' was 2nd to retire! Collected $200,000 retirement bonus!';
    } else {
      S.msg = '🌴 ' + esc(C.seatName(cur)) + ' retired to ' + S.retireEstate[cur] + '!';
    }
    Sound.win();

    // Check if everyone has retired
    if (S.retired.every((r: boolean) => r)) {
      g.finishRetirementGame(C);
      return;
    }

    g.nextTurn(C);
  },
  doDismissModal(C: any) {
    const S = C.S, g = this;
    S.activeModal = null;
    g.nextTurn(C);
  },
  nextTurn(C: any) {
    const S = C.S;
    let n = S.turn;
    for (let i = 0; i < C.names.length; i++) {
      n = (n + 1) % C.names.length;
      if (!S.retired[n]) break;
    }
    S.turn = n;
    C.update(() => {});
    maybeCpu(C);
  },
  finishRetirementGame(C: any) {
    const S = C.S;
    S.over = true;

    // Total Retirement Fortune Calculation:
    // Cash + House Resale Value + $50K per child/spouse peg + LIFE Tiles values - Bank Debt
    let bestNet = -1e9;
    let winner = 0;

    const summary = C.names.map((_: any, pi: number) => {
      const houseVal = S.house[pi] ? S.house[pi].resale : 0;
      const tilesVal = S.lifeTiles[pi].reduce((sum: number, t: any) => sum + t.amt, 0);
      const familyBonus = S.pegs[pi].length * 50000;
      const totalFortune = S.cash[pi] + houseVal + tilesVal + familyBonus - S.debt[pi];

      if (totalFortune > bestNet) {
        bestNet = totalFortune;
        winner = pi;
      }
      return esc(C.seatName(pi)) + ': $' + totalFortune;
    }).join(' · ');

    C.update(() => {});
    C.finish(winner, 'Final Retirement Net Fortune: ' + summary);
  },
  cpu(C: any) {
    const S = C.S, g = this;
    const cur = S.turn;
    if (S.over || C.mine() || C.isNet) return;

    // 1. Initial Route Choice
    if (!S.pathChosen[cur]) {
      const choice = Math.random() < 0.5 ? 'college' : 'career';
      g.doChoosePath(C, choice);
      if (S.activeModal && S.activeModal.type === 'starter_career') {
        g.doSelectCareer(C, 0); // Pick first trade career
      }
      cpuDelay(() => {
        if (window._C === C && !S.over && S.turn === cur && !S.activeModal) {
          g.doSpin(C);
        }
      }, 600);
      return;
    }

    // 2. Active Modal Dialog Decisions
    if (S.activeModal) {
      const m = S.activeModal;
      if (m.type === 'starter_career' || m.type === 'career_choice') {
        let bestIdx = 0;
        let maxSal = 0;
        m.options.forEach((cr: any, idx: number) => {
          if (cr.salary > maxSal) {
            maxSal = cr.salary;
            bestIdx = idx;
          }
        });
        g.doSelectCareer(C, bestIdx);
        return;
      }
      if (m.type === 'house_choice') {
        g.doSelectHouse(C, 0);
        return;
      }
      if (m.type === 'crisis_choice') {
        g.doSelectCrisis(C, 'school');
        return;
      }
      if (m.type === 'retire_choice') {
        g.doSelectRetirement(C, 'millionaire');
        return;
      }
      if (m.type === 'life_card') {
        g.doDismissModal(C);
        return;
      }
    }

    // 3. Regular Spin
    if (!S.spinning) {
      g.doSpin(C);
    }
  }
});

/* ================= 1995 OFFICIAL SAFARI BOARD GAME ================= */

// SVG vector renderer for the 4 authentic movie animal pawns and Rhino blocker
function renderMoviePawnSvg(pawnIdx: number | 'rhino_blocker', size = 26): string {
  if (pawnIdx === 'rhino_blocker') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 36 36" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
      <defs>
        <radialGradient id="rhinoBlockG_${size}" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#94a3b8" />
          <stop offset="50%" stop-color="#475569" />
          <stop offset="100%" stop-color="#1e293b" />
        </radialGradient>
      </defs>
      <path d="M4 31 L32 31 L29 35 L7 35 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.2" />
      <path d="M8 22 C8 15, 14 12, 23 13 C28 14, 32 18, 31 25 C30 30, 26 31, 12 31 C9 31, 8 28, 8 22 Z" fill="url(#rhinoBlockG_${size})" stroke="#0f172a" stroke-width="1.5" />
      <path d="M20 15 C22 10, 29 9, 33 14 C35 16, 34 20, 29 21 C24 22, 21 19, 20 15 Z" fill="url(#rhinoBlockG_${size})" stroke="#0f172a" stroke-width="1.2" />
      <path d="M32 12 C34 8, 36 5, 35 2 C32 5, 30 8, 29 11 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1" />
      <path d="M28 9 C29 7, 30 6, 30 4 C28 6, 27 7, 26 9 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="0.8" />
      <circle cx="26" cy="14" r="1.2" fill="#fff" /><circle cx="26.3" cy="14" r="0.6" fill="#000" />
    </svg>`;
  }

  // 0: Monkey (Yellow), 1: Rhinoceros (Green), 2: Crocodile (Red), 3: Elephant (Blue)
  const configs: Record<string, { f1: string; f2: string; stroke: string; icon: string; name: string }> = {
    '0': { f1: '#fef08a', f2: '#ca8a04', stroke: '#713f12', icon: '🐒', name: 'Monkey' },
    '1': { f1: '#86efac', f2: '#16a34a', stroke: '#14532d', icon: '🦏', name: 'Rhinoceros' },
    '2': { f1: '#fca5a5', f2: '#dc2626', stroke: '#7f1d1d', icon: '🐊', name: 'Crocodile' },
    '3': { f1: '#93c5fd', f2: '#2563eb', stroke: '#1e3a8a', icon: '🐘', name: 'Elephant' }
  };
  const c = configs[String(pawnIdx)] || configs['0'];

  return `<svg width="${size}" height="${size}" viewBox="0 0 36 36" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 3px 4px rgba(0,0,0,0.85));">
    <defs>
      <radialGradient id="pawnG_${pawnIdx}_${size}" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${c.f1}" />
        <stop offset="70%" stop-color="${c.f2}" />
        <stop offset="100%" stop-color="${c.stroke}" />
      </radialGradient>
    </defs>
    <!-- Carved Base Stand -->
    <ellipse cx="18" cy="30" rx="14" ry="4.5" fill="#1f140a" stroke="#4a280d" stroke-width="1.2" />
    <path d="M7 30 L29 30 L26 23 L10 23 Z" fill="url(#pawnG_${pawnIdx}_${size})" stroke="${c.stroke}" stroke-width="1.2" />
    <!-- Animal Totem Head Disk -->
    <circle cx="18" cy="14" r="11" fill="url(#pawnG_${pawnIdx}_${size})" stroke="${c.stroke}" stroke-width="1.5" />
    <!-- Inner Rim -->
    <circle cx="18" cy="14" r="8.5" fill="none" stroke="${c.f1}" stroke-width="1" opacity="0.6" stroke-dasharray="2 1.5" />
    <text x="18" y="19" font-size="12" text-anchor="middle" dominant-baseline="central">${c.icon}</text>
  </svg>`;
}

// 30 Authentic 1995 Danger Cards
const MB_1995_DANGER_CARDS = [
  { id: 'bats', danger: 'Giant Bats', icon: '🦇', rhyme: "At night they fly; you better run. These winged things are not much fun.", symbol: 'raft', symName: 'Raft 🛶', symIcon: '🛶', spaces: 3 },
  { id: 'elephants', danger: 'Stampeding Elephants', icon: '🐘', rhyme: "Huge beasts on the move, driving through like a truck. You can't outrun them, watch out for their tusks.", symbol: 'rope', symName: 'Rope 🪢', symIcon: '🪢', spaces: 4 },
  { id: 'monkeys', danger: 'Mischievous Monkeys', icon: '🐒', rhyme: "This will not be an easy mission, monkeys slow the expedition.", symbol: 'racquet', symName: 'Racquet 🎾', symIcon: '🎾', spaces: 2 },
  { id: 'quicksand', danger: 'Quicksand Floor', icon: '⏳', rhyme: "Beware the ground on which you stand, the floor is quicker than the sand.", symbol: 'rope', symName: 'Rope 🪢', symIcon: '🪢', spaces: 3 },
  { id: 'spiders', danger: 'Giant Spiders', icon: '🕷️', rhyme: "Need a hand? Why, you just wait. We'll help you out, we each have eight.", symbol: 'saber', symName: 'Saber ⚔️', symIcon: '⚔️', spaces: 4 },
  { id: 'crocodile', danger: '25-Foot Crocodile', icon: '🐊', rhyme: "Like a great white shark down the Nile; Beware the 25-foot crocodile.", symbol: 'raft', symName: 'Raft 🛶', symIcon: '🛶', spaces: 4 },
  { id: 'rafters', danger: 'Collapsing Building', icon: '🏚️', rhyme: "Collapsing building, splintered rafters all around; Duck them or they'll pin you down.", symbol: 'axe', symName: 'Axe 🪓', symIcon: '🪓', spaces: 3 },
  { id: 'van_pelt', danger: 'Hunter Van Pelt', icon: '🤠', rhyme: "A hunter from the dark safari, makes you feel not quite so starry.", symbol: 'door', symName: 'Open Door 🚪', symIcon: '🚪', spaces: 5 },
  { id: 'monsoon', danger: 'Torrential Monsoon', icon: '🌧️', rhyme: "There is a lesson you will learn, sometimes you must go back a turn.", symbol: 'raft', symName: 'Raft 🛶', symIcon: '🛶', spaces: 3 },
  { id: 'lion', danger: 'The Great Lion', icon: '🦁', rhyme: "His fangs are sharp, his claws are keen, the fiercest king you've ever seen.", symbol: 'saber', symName: 'Saber ⚔️', symIcon: '⚔️', spaces: 4 },
  { id: 'mosquitoes', danger: 'Poison Mosquitoes', icon: '🦟', rhyme: "A tiny bite can make you itch, make you sneeze, make you twitch.", symbol: 'racquet', symName: 'Racquet 🎾', symIcon: '🎾', spaces: 2 },
  { id: 'vines', danger: 'Creeping Vines', icon: '🌿', rhyme: "They grow much faster than bamboo, take care or they will strangle you.", symbol: 'axe', symName: 'Axe 🪓', symIcon: '🪓', spaces: 3 },
  { id: 'rhino', danger: 'Charging Rhino', icon: '🦏', rhyme: "A horn of stone and armored hide, there is no place for you to hide.", symbol: 'rope', symName: 'Rope 🪢', symIcon: '🪢', spaces: 4 },
  { id: 'piranhas', danger: 'Piranha Stream', icon: '🐟', rhyme: "Beneath the water sharp teeth gleam, stay clear of this piranha stream.", symbol: 'raft', symName: 'Raft 🛶', symIcon: '🛶', spaces: 3 },
  { id: 'leopard', danger: 'Stalking Leopard', icon: '🐆', rhyme: "Quiet paws upon the limb, in shadows where the light grows dim.", symbol: 'saber', symName: 'Saber ⚔️', symIcon: '⚔️', spaces: 4 },
  { id: 'lightning', danger: 'Thunder Tempest', icon: '⚡', rhyme: "Thunder rattles through the trees, a sudden tempest on the breeze.", symbol: 'door', symName: 'Open Door 🚪', symIcon: '🚪', spaces: 3 },
  { id: 'ants', danger: 'Army Ants', icon: '🐜', rhyme: "A marching swarm across the floor, you'd better head right for the door.", symbol: 'door', symName: 'Open Door 🚪', symIcon: '🚪', spaces: 4 },
  { id: 'chasm', danger: 'Yawning Chasm', icon: '🕳️', rhyme: "The earth gives way beneath your stride, a yawning chasm opening wide.", symbol: 'rope', symName: 'Rope 🪢', symIcon: '🪢', spaces: 3 },
  { id: 'flower', danger: 'Sleeping Blossom', icon: '🌺', rhyme: "Sweet perfume upon the air, beware the petals blooming there.", symbol: 'axe', symName: 'Axe 🪓', symIcon: '🪓', spaces: 2 },
  { id: 'hippo', danger: 'Yawning Hippo', icon: '🦛', rhyme: "A yawning mouth of giant size, beneath the river surface lies.", symbol: 'raft', symName: 'Raft 🛶', symIcon: '🛶', spaces: 3 },
  { id: 'python', danger: 'Deadly Python', icon: '🐍', rhyme: "A deadly coil upon the bough, you'll need a weapon here and now.", symbol: 'saber', symName: 'Saber ⚔️', symIcon: '⚔️', spaces: 4 },
  { id: 'hyenas', danger: 'Pack of Hyenas', icon: '🐕', rhyme: "A cackling laugh in dusk and gloom, their hungry eyes foretell your doom.", symbol: 'saber', symName: 'Saber ⚔️', symIcon: '⚔️', spaces: 3 },
  { id: 'darts', danger: 'Poison Darts', icon: '💀', rhyme: "A whisper through the leafy shade, a deadly trap in shadows laid.", symbol: 'door', symName: 'Open Door 🚪', symIcon: '🚪', spaces: 4 },
  { id: 'flood', danger: 'Raging Flood', icon: '🌊', rhyme: "The river rises past its banks, floating chairs and drifting planks.", symbol: 'raft', symName: 'Raft 🛶', symIcon: '🛶', spaces: 4 },
  { id: 'earthquake', danger: 'Temple Tremor', icon: '🪨', rhyme: "Tremors shake the temple stone, you must not face this beast alone.", symbol: 'axe', symName: 'Axe 🪓', symIcon: '🪓', spaces: 3 },
  { id: 'zebras', danger: 'Zebra Stampede', icon: '🦓', rhyme: "Hooves that hammer in the dust, in fleet-foot speed you place your trust.", symbol: 'rope', symName: 'Rope 🪢', symIcon: '🪢', spaces: 3 },
  { id: 'mud', danger: 'Sinking Mud', icon: '🪵', rhyme: "Deep into mud you slowly slide, reach for a rope or step aside.", symbol: 'rope', symName: 'Rope 🪢', symIcon: '🪢', spaces: 4 },
  { id: 'pelican', danger: 'Thieving Pelican', icon: '🦅', rhyme: "A swooping thief from out the blue, snatching tokens from your crew.", symbol: 'racquet', symName: 'Racquet 🎾', symIcon: '🎾', spaces: 2 },
  { id: 'leeches', danger: 'Jungle Leeches', icon: '🩸', rhyme: "Creeping pests upon your skin, the stinging bites of pain begin.", symbol: 'saber', symName: 'Saber ⚔️', symIcon: '⚔️', spaces: 2 },
  { id: 'volcano', danger: 'Molten Rock', icon: '🌋', rhyme: "The molten rock begins to spew, find higher ground or it gets you.", symbol: 'axe', symName: 'Axe 🪓', symIcon: '🪓', spaces: 4 }
];

const MB_RESCUE_DICE_SYMBOLS = [
  { sym: 'saber', name: 'Saber ⚔️', icon: '⚔️' },
  { sym: 'rope', name: 'Rope 🪢', icon: '🪢' },
  { sym: 'raft', name: 'Raft 🛶', icon: '🛶' },
  { sym: 'axe', name: 'Axe 🪓', icon: '🪓' },
  { sym: 'racquet', name: 'Racquet 🎾', icon: '🎾' },
  { sym: 'door', name: 'Door 🚪', icon: '🚪' },
  { sym: 'hourglass', name: 'Hourglass ⏳ (WILD)', icon: '⏳' }
];

const MB_TRACK_LEN = 28;

// Space definitions for the authentic 28-square board
function getMbSpaceMeta(s: number): { type: 'start' | 'blank' | 'wait58' | 'rhino' | 'jungle' | 'goal'; label: string; icon: string } {
  if (s <= 1) return { type: 'start', label: 'START', icon: '★' };
  if (s >= MB_TRACK_LEN) return { type: 'goal', label: 'SAFARI', icon: '🌟' };
  if (s === 5 || s === 12 || s === 19) return { type: 'wait58', label: 'WAIT 5/8', icon: '⏳' };
  if (s === 8 || s === 15 || s === 22) return { type: 'rhino', label: 'RHINO', icon: '🦏' };
  if (s === 10 || s === 17 || s === 24) return { type: 'jungle', label: 'JUNGLE', icon: '🌿' };
  return { type: 'blank', label: 'BLANK', icon: '📜' };
}

stdInit('jumanji', {
  name: 'Safari',
  icon: '🦁',
  desc: 'Official Edition',
  p: [2, 4],
  payout: PAYOUTS.jumanji,
  rules: 'Official Safari: Advance your carved animal pawn (Monkey, Rhino, Crocodile, Elephant) along your 28-square ivory stepping stone path. On Blank Spaces, draw a Danger Card into the center red decoder lens! Fellow players roll Rescue Dice before the 8-second sand timer expires (Hourglass ⏳ is Wild!). If saved, fellow players advance by the card\'s number. If anyone fails, the card goes to the Doomsday Grid and the active player moves backward. On "Wait for 5 or 8" spaces, you are trapped until someone rolls a 5 or an 8! If all 10 Doomsday Grid slots fill up, the jungle wins and everyone loses. The first player to reach the center (Space 28) by exact count calls out "SAFARI!" and wins!',

  newState(C: any) {
    const deck = shuffleLifeDeck([...MB_1995_DANGER_CARDS]);
    return {
      turn: 0,
      pos: C.names.map(() => 1), // 1 = start, 28 = center
      trapped58: C.names.map(() => false), // Trapped in Wait for 5 or 8
      blockerTrack: -1, // Track where stone rhino blocker is located
      blockerPos: -1, // Step where stone rhino blocker is placed
      doomsday: [] as typeof MB_1995_DANGER_CARDS, // Up to 10 failed danger cards
      deck,
      activeDanger: null as null | {
        card: typeof MB_1995_DANGER_CARDS[0];
        type: 'blank' | 'jungle';
        timeLeft: number;
        rolls: Record<number, { sym: string; icon: string; success: boolean }>;
        done: boolean;
      },
      lastDie: 0,
      pendingContinue: false,
      msg: 'Welcome to SAFARI. In the jungle you must wait... Roll the die to begin!',
      over: false,
      winner: -1
    };
  },

  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    const curSeat = C.cur();
    const isMyTurn = C.mine() && !S.over;

    let h = turnBanner(C);

    h += '<div class="mb-jumanji-wrap">';

    // The Authentic 1995 Board Frame
    h += '<div class="mb-jumanji-board">';
    h += '<div class="mb-jumanji-leaves-layer"></div>';

    // Top Carved Header: "IN THE JUNGLE YOU MUST WAIT..."
    h += '<div class="mb-jumanji-verse-header">IN THE JUNGLE YOU MUST WAIT...</div>';

    // Main Board Layout: Left Tracks - Center Decoder & Doomsday Grid - Right Tracks
    h += '<div class="mb-jumanji-main-layout">';

    // Left Column: Player 0 (Monkey) & Player 2 (Crocodile)
    h += '<div class="mb-jumanji-track-col">';
    [0, 2].forEach(pi => {
      if (pi >= C.names.length) return;
      const active = pi === curSeat && !S.over;
      const isTrapped = S.trapped58[pi];
      h += `<div class="mb-jumanji-shrine-card ${active ? 'active-turn' : ''}">`;
      h += '<div class="mb-jumanji-shrine-header">';
      h += `<span class="mb-jumanji-pawn-badge">${renderMoviePawnSvg(pi, 22)} ${esc(C.seatName(pi))} ${active ? '👈' : ''}</span>`;
      h += `<span style="font-size:10px; color:#cbd5e1;">${S.pos[pi]}/${MB_TRACK_LEN} ${isTrapped ? '⚠️ Trapped (5/8)' : ''}</span>`;
      h += '</div>';

      // Stepping Stone Path (28 Squares: Spaces 1 to 28)
      h += '<div class="mb-jumanji-stepping-path">';
      for (let s = 1; s <= MB_TRACK_LEN; s++) {
        const meta = getMbSpaceMeta(s);
        let cls = 'mb-jumanji-step-stone';
        if (meta.type === 'start') cls += ' is-start';
        else if (meta.type === 'blank') cls += ' is-blank';
        else if (meta.type === 'wait58') cls += ' is-wait58';
        else if (meta.type === 'rhino') cls += ' is-rhino-space';
        else if (meta.type === 'jungle') cls += ' is-jungle';
        else if (meta.type === 'goal') cls += ' is-center-gate';

        const isPawnHere = S.pos[pi] === s || (s === 1 && S.pos[pi] <= 1);
        const isBlockerHere = S.blockerTrack === pi && S.blockerPos === s;

        h += `<div class="${cls}" title="Space ${s}: ${meta.label}">`;
        if (isPawnHere) {
          h += renderMoviePawnSvg(pi, 20);
        } else if (isBlockerHere) {
          h += renderMoviePawnSvg('rhino_blocker', 20);
        } else {
          if (meta.type === 'start') {
            h += `<span style="font-size:7px; font-weight:900; line-height:1;">START</span><span style="font-size:9px; line-height:1;">★</span>`;
          } else if (meta.type === 'goal') {
            h += `<span style="font-size:7px; font-weight:900; line-height:1;">SAFARI</span><span style="font-size:9px; line-height:1;">🌟</span>`;
          } else {
            h += `<span style="font-size:8px; line-height:1; opacity:0.85; font-weight:800;">${s}</span>`;
            if (meta.icon) h += `<span style="font-size:9.5px; line-height:1;">${meta.icon}</span>`;
          }
        }
        h += '</div>';
      }
      h += '</div>'; // end stepping path
      h += '</div>'; // end shrine card
    });
    h += '</div>'; // end left track col

    // Center Column: Center Aztec Carved Decoder & The 10-Slot Doomsday Grid
    h += '<div class="mb-jumanji-center-column">';

    // Center Aztec Wooden Ring & Dark Green Mist Decoder Dome
    const dangerPulse = S.activeDanger ? 'pulsing' : '';
    h += `<div class="mb-jumanji-center-bezel ${dangerPulse}" id="mbCenterEyeBtn" title="Safari Center Decoder Dome">`;
    h += '<div class="mb-jumanji-center-lens">';
    h += '<div class="mb-jumanji-center-logo">SAFARI</div>';
    h += '<div class="mb-jumanji-center-sub">DECODER DOME</div>';
    h += '</div>';
    h += '</div>';

    // The 10-Slot Doomsday Grid (Official Game Loss Condition)
    h += '<div class="mb-jumanji-doomsday-box">';
    h += '<div class="mb-jumanji-doomsday-header">';
    h += `<span>☠️ DOOMSDAY GRID</span><span>${S.doomsday.length}/10 FILLED</span>`;
    h += '</div>';
    h += '<div class="mb-jumanji-doomsday-grid">';
    for (let slot = 0; slot < 10; slot++) {
      const card = S.doomsday[slot];
      h += `<div class="mb-jumanji-doomsday-slot ${card ? 'filled' : ''}" title="${card ? card.danger : 'Empty Slot'}">`;
      if (card) {
        h += `<span style="font-size:14px;">${card.icon}</span>`;
        h += `<span style="font-size:7.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:90%;">${card.danger}</span>`;
      } else {
        h += `<span>${slot + 1}</span>`;
      }
      h += '</div>';
    }
    h += '</div>';
    h += '</div>';

    h += '</div>'; // end center column

    // Right Column: Player 1 (Rhino) & Player 3 (Elephant)
    h += '<div class="mb-jumanji-track-col">';
    [1, 3].forEach(pi => {
      if (pi >= C.names.length) return;
      const active = pi === curSeat && !S.over;
      const isTrapped = S.trapped58[pi];
      h += `<div class="mb-jumanji-shrine-card ${active ? 'active-turn' : ''}">`;
      h += '<div class="mb-jumanji-shrine-header">';
      h += `<span class="mb-jumanji-pawn-badge">${renderMoviePawnSvg(pi, 22)} ${esc(C.seatName(pi))} ${active ? '👈' : ''}</span>`;
      h += `<span style="font-size:10px; color:#cbd5e1;">${S.pos[pi]}/${MB_TRACK_LEN} ${isTrapped ? '⚠️ Trapped (5/8)' : ''}</span>`;
      h += '</div>';

      // Stepping Stone Path (28 Squares: Spaces 1 to 28)
      h += '<div class="mb-jumanji-stepping-path">';
      for (let s = 1; s <= MB_TRACK_LEN; s++) {
        const meta = getMbSpaceMeta(s);
        let cls = 'mb-jumanji-step-stone';
        if (meta.type === 'start') cls += ' is-start';
        else if (meta.type === 'blank') cls += ' is-blank';
        else if (meta.type === 'wait58') cls += ' is-wait58';
        else if (meta.type === 'rhino') cls += ' is-rhino-space';
        else if (meta.type === 'jungle') cls += ' is-jungle';
        else if (meta.type === 'goal') cls += ' is-center-gate';

        const isPawnHere = S.pos[pi] === s || (s === 1 && S.pos[pi] <= 1);
        const isBlockerHere = S.blockerTrack === pi && S.blockerPos === s;

        h += `<div class="${cls}" title="Space ${s}: ${meta.label}">`;
        if (isPawnHere) {
          h += renderMoviePawnSvg(pi, 20);
        } else if (isBlockerHere) {
          h += renderMoviePawnSvg('rhino_blocker', 20);
        } else {
          if (meta.type === 'start') {
            h += `<span style="font-size:7px; font-weight:900; line-height:1;">START</span><span style="font-size:9px; line-height:1;">★</span>`;
          } else if (meta.type === 'goal') {
            h += `<span style="font-size:7px; font-weight:900; line-height:1;">SAFARI</span><span style="font-size:9px; line-height:1;">🌟</span>`;
          } else {
            h += `<span style="font-size:8px; line-height:1; opacity:0.85; font-weight:800;">${s}</span>`;
            if (meta.icon) h += `<span style="font-size:9.5px; line-height:1;">${meta.icon}</span>`;
          }
        }
        h += '</div>';
      }
      h += '</div>'; // end stepping path
      h += '</div>'; // end shrine card
    });
    h += '</div>'; // end right track col

    h += '</div>'; // end main layout

    // Bottom Carved Footer: "UNTIL THE DICE READ FIVE OR EIGHT"
    h += '<div class="mb-jumanji-verse-footer">UNTIL THE DICE READ FIVE OR EIGHT</div>';

    h += '</div>'; // end mb-jumanji-board

    // Message Log Banner
    if (S.msg) {
      h += `<div class="msg" style="text-align:center; font-size:13.5px; font-weight:700; background:#1c1006; border:1px solid #78350f; color:#fef08a;">${esc(S.msg)}</div>`;
    }

    // Active Danger Card Modal (Red Cipher Box + Vintage Illustration Artwork)
    if (!S.over && S.activeDanger) {
      const d = S.activeDanger;
      const card = d.card;
      h += '<div class="mb-jumanji-card-modal">';
      h += '<div style="font-size:11px; font-weight:800; letter-spacing:1px; color:#991b1b; text-transform:uppercase;">';
      h += d.type === 'jungle' ? '🚨 SPECIAL JUNGLE SPACE — ALL PLAYERS TRAPPED!' : `📜 DANGER CARD DRAWN BY ${esc(C.seatName(curSeat))}`;
      h += '</div>';

      // Red Cipher Decoder Box (Reveals the Secret Rhyme & Symbol)
      h += '<div class="mb-jumanji-cipher-box">';
      h += '<div class="mb-jumanji-decoder-glass">';
      h += `<div class="mb-jumanji-card-rhyme">“${card.rhyme}”</div>`;
      h += `<div class="mb-jumanji-card-requirement">RESCUE SYMBOL: ${card.symName} (or ⏳ Hourglass) · MOVE ${card.spaces} SPACES</div>`;
      h += '</div>';
      h += '</div>';

      // Vintage Artwork Box (Matching User Image s-l1200.jpg)
      h += '<div class="mb-jumanji-card-artwork">';
      h += `<div class="mb-jumanji-art-icon">${card.icon}</div>`;
      h += `<div class="mb-jumanji-art-title">${card.danger}</div>`;
      h += '</div>';

      // 8-Second Sand Timer
      h += '<div class="mb-jumanji-sand-timer">';
      h += '<span style="font-size:22px;">⏳</span>';
      const pct = Math.max(0, Math.min(100, (d.timeLeft / 8) * 100));
      h += `<div class="mb-jumanji-timer-track"><div class="mb-jumanji-timer-bar" style="width:${pct}%"></div></div>`;
      h += `<span style="font-size:12px; font-weight:800; color:#fef08a;">${d.timeLeft}s</span>`;
      h += '</div>';

      // Status of Rescue Rolls
      const requiredSeats = d.type === 'jungle'
        ? C.names.map((_: any, i: number) => i)
        : C.names.map((_: any, i: number) => i).filter((i: number) => i !== curSeat);

      h += '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:6px 0;">';
      requiredSeats.forEach((seat: number) => {
        const rollInfo = d.rolls[seat];
        h += `<div style="background:rgba(0,0,0,0.4); border:1px solid #78350f; border-radius:6px; padding:4px 8px; font-size:11px;">`;
        h += `${renderMoviePawnSvg(seat, 14)} <b>${esc(C.seatName(seat))}</b>: `;
        if (rollInfo) {
          h += rollInfo.success ? `✅ ${rollInfo.icon}` : `❌ ${rollInfo.icon}`;
        } else {
          h += '⏳ Rolling...';
        }
        h += '</div>';
      });
      h += '</div>';

      // Roll Rescue Dice Button or Continue Button
      const canRollRescue = requiredSeats.some((s: number) => !d.rolls[s] && (C.isNet ? s === Net.mySeat() : (C.mode === 'pvc' ? s === 0 : true)));
      if (!d.done && canRollRescue) {
        h += '<div class="row" style="justify-content:center;">';
        h += `<button class="btn grow" id="mbRollRescueBtn" style="background:linear-gradient(135deg,#16a34a,#14532d); font-size:15px; font-weight:800;">`;
        h += '🎲 Roll Rescue Dice!';
        h += '</button>';
        h += '</div>';
      } else if (d.done) {
        const allSucceeded = requiredSeats.every((s: number) => d.rolls[s] && d.rolls[s].success);
        h += `<div style="text-align:center; padding:10px; margin-top:8px; border-radius:8px; font-weight:800; font-size:13px; ${allSucceeded ? 'background:rgba(22,101,52,0.85); border:1.5px solid #22c55e; color:#bbf7d0;' : 'background:rgba(153,27,27,0.85); border:1.5px solid #ef4444; color:#fecaca;'}">`;
        if (allSucceeded) {
          h += `🎉 RESCUED! All fellow players matched ${card.symName}! Active player safe, fellow players advance ${card.spaces} spaces!`;
        } else {
          h += `💀 RESCUE FAILED! ${card.danger} struck! Danger card placed on Doomsday Grid (${S.doomsday.length}/10). ${esc(C.seatName(curSeat))} moves back ${card.spaces} spaces.`;
        }
        h += '</div>';
        h += '<div class="row" style="justify-content:center; margin-top:10px;">';
        h += `<button class="btn grow" id="mbDangerContinueBtn" style="font-size:16px; font-weight:800; padding:12px 24px; background:linear-gradient(135deg,#eab308,#ca8a04); color:#451a03; box-shadow:0 4px 14px rgba(234,179,8,0.5);">`;
        h += '👉 Continue to Next Turn ➔';
        h += '</button>';
        h += '</div>';
      }
      h += '</div>'; // end card modal
    }

    // Action Controls: Roll Number Die, Continue, or Shout SAFARI
    if (!S.over && !S.activeDanger) {
      const reachedGoal = S.pos.some((p: number) => p >= MB_TRACK_LEN);
      if (reachedGoal) {
        h += '<div class="card center" style="background:radial-gradient(circle,#b45309,#78350f); border:4px solid #fef08a; padding:18px;">';
        h += '<h2>🌟 REACHED THE SAFARI CENTER! 🌟</h2>';
        h += '<p style="font-size:14px; margin-bottom:12px;">Call out the name to lift the consequences and win!</p>';
        h += '<button class="jumanji-shout-btn" id="mbShoutJumanjiBtn">📣 CALL OUT "SAFARI!"</button>';
        h += '</div>';
      } else if (S.pendingContinue) {
        h += '<div class="row" style="justify-content:center; align-items:center; gap:12px; margin-top:8px;">';
        if (S.lastDie > 0) {
          h += `<div class="mb-jumanji-custom-die mb-jumanji-wood-die">${diceFace(S.lastDie)}</div>`;
        }
        h += `<button class="btn grow" id="mbContinueBtn" style="font-size:16px; font-weight:800; padding:12px 24px; background:linear-gradient(135deg,#eab308,#ca8a04); color:#451a03; box-shadow:0 4px 14px rgba(234,179,8,0.5);">`;
        h += '👉 Continue to Next Turn ➔';
        h += '</button>';
        h += '</div>';
      } else if (isMyTurn) {
        h += '<div class="row" style="justify-content:center; align-items:center; gap:12px; margin-top:8px;">';
        h += `<button class="btn grow" id="mbRollDieBtn" style="font-size:16px; font-weight:800; padding:12px 20px; background:linear-gradient(135deg,#eab308,#ca8a04); color:#451a03;">`;
        const trappedText = S.trapped58[curSeat] ? ' (Roll for 5 or 8!)' : '';
        h += `🎲 Roll the Number Die (${esc(C.seatName(curSeat))})${trappedText}`;
        h += `</button>`;
        if (S.lastDie > 0) {
          h += `<div class="mb-jumanji-custom-die mb-jumanji-wood-die">${diceFace(S.lastDie)}</div>`;
        }
        h += '</div>';
      } else {
        h += `<div class="muted center">⏳ Waiting for ${esc(C.seatName(curSeat))} to roll...</div>`;
      }
    }

    // Game Over Results
    if (S.over) {
      if (S.winner >= 0) {
        h += '<div class="card center" style="background:#064e3b; border:3px solid #10b981; color:#fff; padding:20px;">';
        h += '<h2>🏆 SAFARI HAS BEEN WON! 🏆</h2>';
        h += `<p style="font-size:16px; margin:8px 0;"><b>${esc(C.seatName(S.winner))}</b> reached the center and called out SAFARI!</p>`;
        h += '<p style="font-size:13px; color:#a7f3d0;">The jungle vanished and all adventurers escaped!</p>';
        h += '</div>';
      } else {
        h += '<div class="card center" style="background:#450a0a; border:3px solid #ef4444; color:#fff; padding:20px;">';
        h += '<h2>💀 THE DOOMSDAY GRID IS FULL! 💀</h2>';
        h += '<p style="font-size:16px; margin:8px 0;">All 10 spaces of the Doomsday Grid were filled with danger cards.</p>';
        h += '<p style="font-size:13px; color:#fca5a5;">The jungle claimed your party. All players lose!</p>';
        h += '</div>';
      }
    }

    h += '</div>'; // end mb-jumanji-wrap
    R.innerHTML = h;

    // Attach Event Listeners
    const rollDieBtn = $('#mbRollDieBtn');
    if (rollDieBtn) rollDieBtn.onclick = () => g.doRollNumberDie(C);

    const rollRescueBtn = $('#mbRollRescueBtn');
    if (rollRescueBtn) rollRescueBtn.onclick = () => g.doPlayerRescueRoll(C);

    const continueBtn = $('#mbContinueBtn');
    if (continueBtn) continueBtn.onclick = () => {
      Sound.click();
      g.advanceTurn(C);
    };

    const dangerContinueBtn = $('#mbDangerContinueBtn');
    if (dangerContinueBtn) dangerContinueBtn.onclick = () => {
      Sound.click();
      S.activeDanger = null;
      g.advanceTurn(C);
    };

    const shoutBtn = $('#mbShoutJumanjiBtn');
    if (shoutBtn) shoutBtn.onclick = () => g.doShoutJumanji(C);

    const centerEye = $('#mbCenterEyeBtn');
    if (centerEye) centerEye.onclick = () => {
      Sound.drums();
      toast('🥁 The jungle drums beat in the distance...');
    };
  },

  doRollNumberDie(C: any) {
    const S = C.S, g = this;
    if (S.over || S.activeDanger) return;

    const cur = S.turn;
    const isTrapped = S.trapped58[cur];
    const roll = ri(1, 6);
    Sound.dice();
    S.lastDie = roll;

    // If trapped in Wait for 5 or 8
    if (isTrapped) {
      // In the rules, players must roll a 5 or an 8 to free the trapped player
      // With a single 6-sided die, rolling a 5 frees them. Or if 2 dice are rolled, a sum of 5 or 8.
      const freed = roll === 5;
      if (freed) {
        Sound.win();
        S.trapped58[cur] = false;
        S.msg = `🎉 FREE AT LAST! ${esc(C.seatName(cur))} rolled a 5 and escaped the Wait 5/8 trap!`;
      } else {
        Sound.lose();
        S.pos[cur] = Math.max(1, S.pos[cur] - 1);
        S.msg = `⏳ Rolled ${roll}. Not a 5! ${esc(C.seatName(cur))} moves backward 1 space (now at space ${S.pos[cur]})!`;
      }
      S.pendingContinue = true;
      C.update(() => {});
      return;
    }

    // Check if blocked by Rhino
    const curPos = S.pos[cur];
    const targetPos = curPos + roll;

    if (S.blockerTrack === cur && S.blockerPos > curPos && S.blockerPos <= targetPos) {
      if (roll % 2 !== 0) {
        // Blocked! Cannot move past rhino without even roll
        Sound.roar();
        S.pos[cur] = S.blockerPos - 1;
        S.msg = `🦏 Blocked by the stone Rhino at space ${S.blockerPos}! Rolled ${roll} (odd). You need an even number to push past!`;
        S.pendingContinue = true;
        C.update(() => {});
        return;
      } else {
        Sound.win();
        S.msg = `🦏 Pushed past the stone Rhino with an even roll of ${roll}!`;
      }
    }

    // Exact count to center check
    if (targetPos > MB_TRACK_LEN) {
      S.msg = `Rolled ${roll}. Overshot the center (${curPos} + ${roll} > ${MB_TRACK_LEN})! Exact count required, stay put.`;
      S.pendingContinue = true;
      C.update(() => {});
      return;
    }

    S.pos[cur] = targetPos;
    S.msg = `${esc(C.seatName(cur))} rolled ${roll}. Advanced to space ${targetPos}/${MB_TRACK_LEN}!`;

    if (targetPos === MB_TRACK_LEN) {
      Sound.jumanji();
      S.msg = `🌟 ${esc(C.seatName(cur))} reached the center! Tap CALL OUT "SAFARI!" to win!`;
      S.pendingContinue = false;
      C.update(() => {});
      maybeCpu(C);
      return;
    }

    // Check space landed on
    const meta = getMbSpaceMeta(targetPos);
    if (meta.type === 'blank') {
      g.triggerDangerCard(C, 'blank');
      return;
    } else if (meta.type === 'jungle') {
      g.triggerDangerCard(C, 'jungle');
      return;
    } else if (meta.type === 'wait58') {
      Sound.lose();
      S.trapped58[cur] = true;
      S.msg += ' ⏳ LANDED ON WAIT FOR 5 OR 8! In the jungle you must wait until the dice read 5 or 8!';
    } else if (meta.type === 'rhino') {
      Sound.roar();
      // Place Rhino in front of closest opponent ahead
      let rival = (cur + 1) % C.names.length;
      let maxP = -1;
      C.names.forEach((_: any, i: number) => {
        if (i !== cur && S.pos[i] > maxP) {
          maxP = S.pos[i];
          rival = i;
        }
      });
      S.blockerTrack = rival;
      S.blockerPos = Math.min(MB_TRACK_LEN - 1, S.pos[rival] + 2);
      S.msg += ` 🦏 Placed the stone Rhino in front of ${esc(C.seatName(rival))} at space ${S.blockerPos}!`;
    }

    S.pendingContinue = true;
    C.update(() => {});
  },

  triggerDangerCard(C: any, type: 'blank' | 'jungle') {
    const S = C.S, g = this;
    if (!S.deck.length) {
      S.deck = shuffleLifeDeck([...MB_1995_DANGER_CARDS]);
    }
    const card = S.deck.pop();
    Sound.drums();

    S.activeDanger = {
      card,
      type,
      timeLeft: 8,
      rolls: {},
      done: false
    };

    S.msg = `📜 DANGER! “${card.rhyme}” — Roll ${card.symName} before the sand timer runs out!`;
    C.update(() => {});

    // Start 8-second sand timer
    if (C._timer) clearInterval(C._timer);
    C._timer = setInterval(() => {
      if (!S.activeDanger || S.activeDanger.done || S.over) {
        clearInterval(C._timer);
        return;
      }
      S.activeDanger.timeLeft--;
      if (S.activeDanger.timeLeft <= 0) {
        clearInterval(C._timer);
        g.resolveDangerOutcome(C);
      } else {
        C.update(() => {}, true);
        C.rerender();
      }
    }, 1000);

    // Trigger AI fellow player rolls
    g.maybeRollCpuFellows(C);
  },

  doPlayerRescueRoll(C: any) {
    const S = C.S, g = this;
    if (!S.activeDanger || S.activeDanger.done) return;

    const cur = S.turn;
    const d = S.activeDanger;
    const requiredSeats = d.type === 'jungle'
      ? C.names.map((_: any, i: number) => i)
      : C.names.map((_: any, i: number) => i).filter((i: number) => i !== cur);

    // Roll for the human player (or current seat)
    const rollerSeat = C.isNet ? Net.mySeat() : (C.mode === 'pvc' ? 0 : requiredSeats.find((s: number) => !d.rolls[s]));
    if (rollerSeat === undefined) return;

    const symObj = MB_RESCUE_DICE_SYMBOLS[ri(0, MB_RESCUE_DICE_SYMBOLS.length - 1)];
    const isSuccess = symObj.sym === d.card.symbol || symObj.sym === 'hourglass';

    Sound.dice();
    d.rolls[rollerSeat] = {
      sym: symObj.sym,
      icon: symObj.icon,
      success: isSuccess
    };

    C.update(() => {});
    g.checkDangerResolution(C);
  },

  maybeRollCpuFellows(C: any) {
    const S = C.S, g = this;
    if (!S.activeDanger || S.activeDanger.done) return;

    const cur = S.turn;
    const d = S.activeDanger;
    const requiredSeats = d.type === 'jungle'
      ? C.names.map((_: any, i: number) => i)
      : C.names.map((_: any, i: number) => i).filter((i: number) => i !== cur);

    requiredSeats.forEach((seat: number) => {
      const isCpu = C.mode === 'pvc' ? seat !== 0 : false;
      if (isCpu && !d.rolls[seat]) {
        setTimeout(() => {
          if (!S.activeDanger || S.activeDanger.done) return;
          const symObj = MB_RESCUE_DICE_SYMBOLS[ri(0, MB_RESCUE_DICE_SYMBOLS.length - 1)];
          const isSuccess = symObj.sym === d.card.symbol || symObj.sym === 'hourglass';
          d.rolls[seat] = {
            sym: symObj.sym,
            icon: symObj.icon,
            success: isSuccess
          };
          C.update(() => {});
          g.checkDangerResolution(C);
        }, ri(600, 1400));
      }
    });
  },

  checkDangerResolution(C: any) {
    const S = C.S, g = this;
    if (!S.activeDanger || S.activeDanger.done) return;

    const cur = S.turn;
    const d = S.activeDanger;
    const requiredSeats = d.type === 'jungle'
      ? C.names.map((_: any, i: number) => i)
      : C.names.map((_: any, i: number) => i).filter((i: number) => i !== cur);

    // If everyone rolled
    const allRolled = requiredSeats.every((s: number) => !!d.rolls[s]);
    if (allRolled) {
      if (C._timer) clearInterval(C._timer);
      g.resolveDangerOutcome(C);
    }
  },

  resolveDangerOutcome(C: any) {
    const S = C.S, g = this;
    if (!S.activeDanger || S.activeDanger.done) return;

    const cur = S.turn;
    const d = S.activeDanger;
    const card = d.card;
    d.done = true;

    const requiredSeats = d.type === 'jungle'
      ? C.names.map((_: any, i: number) => i)
      : C.names.map((_: any, i: number) => i).filter((i: number) => i !== cur);

    // Check if ALL required players rolled a success
    const allSucceeded = requiredSeats.every((s: number) => d.rolls[s] && d.rolls[s].success);

    if (allSucceeded) {
      // RESCUE SUCCESSFUL!
      Sound.win();
      if (d.type === 'blank') {
        // Fellow players move forward by card.spaces
        requiredSeats.forEach((s: number) => {
          S.pos[s] = Math.min(MB_TRACK_LEN, S.pos[s] + card.spaces);
        });
        S.msg = `🎉 RESCUED! All fellow players rolled ${card.symName}! Active player safe, fellow players move forward ${card.spaces} spaces!`;
      } else {
        // Jungle space: Everyone advances 1 space
        C.names.forEach((_: any, i: number) => {
          S.pos[i] = Math.min(MB_TRACK_LEN, S.pos[i] + 1);
        });
        S.msg = `🎉 JUNGLE CLEARED! All players rolled successfully! Everyone moves forward 1 space!`;
      }
    } else {
      // RESCUE FAILED!
      Sound.roar();
      Sound.lose();
      // Card goes to Doomsday Grid
      S.doomsday.push(card);
      // Active player moves back by card.spaces
      S.pos[cur] = Math.max(1, S.pos[cur] - card.spaces);
      S.msg = `💀 RESCUE FAILED! ${card.danger} strikes! Card placed on Doomsday Grid (${S.doomsday.length}/10). ${esc(C.seatName(cur))} moves back ${card.spaces} spaces (now at space ${S.pos[cur]})!`;

      // Check if Doomsday Grid is full (10 cards = ALL PLAYERS LOSE)
      if (S.doomsday.length >= 10) {
        S.over = true;
        S.winner = -1;
        S.activeDanger = null;
        C.update(() => {});
        C.finish(-1, 'The Doomsday Grid filled with 10 cards! The jungle wins. Everyone lost.');
        return;
      }
    }

    C.update(() => {});
    C.rerender();
  },

  advanceTurn(C: any) {
    const S = C.S;
    if (S.over) return;
    S.pendingContinue = false;
    S.turn = (S.turn + 1) % C.names.length;
    C.update(() => {});
    maybeCpu(C);
  },

  doShoutJumanji(C: any) {
    const S = C.S;
    if (S.over) return;

    Sound.jumanji();
    S.over = true;
    S.winner = S.turn;
    S.msg = `🏆 SAFARI! ${esc(C.seatName(S.winner))} called out the name! The game has vanished!`;
    C.update(() => {});
    C.finish(S.winner, 'Called out SAFARI and won the game! 🏆');
  },

  cpu(C: any) {
    const S = C.S, g = this;
    if (S.over || S.pendingContinue) return;

    if (S.pos.some((p: number) => p >= MB_TRACK_LEN)) {
      setTimeout(() => g.doShoutJumanji(C), 900);
      return;
    }

    if (S.activeDanger) {
      if (!S.activeDanger.done) {
        g.maybeRollCpuFellows(C);
      }
      return;
    }

    setTimeout(() => g.doRollNumberDie(C), 1000);
  }
});

/* ================= OFFICIAL CLUE (Tudor Mansion & Picture Cards) ================= */

const CLUE_BOARD_IMG = '/src/assets/images/clue_mansion_board_1792045386606.jpg';
const CLUE_SUSPECTS_IMG = '/src/assets/images/clue_suspects_art_1792045387596.jpg';
const CLUE_WEAPONS_IMG = '/src/assets/images/clue_weapons_art_1792045387798.jpg';
const CLUE_ROOMS_IMG = '/src/assets/images/clue_rooms_art_1792045387232.jpg';
const CLUE_ENVELOPE_IMG = '/src/assets/images/clue_case_envelope_1792045387836.jpg';

const CLUE_SUSPECT_META: Record<string, { color: string; initials: string; avatar: string; bgPos: string }> = {
  'Miss Scarlet': { color: '#ef4444', initials: 'SC', avatar: '💃', bgPos: '8% 8% / 325% 215%' },
  'Colonel Mustard': { color: '#eab308', initials: 'MU', avatar: '🎖️', bgPos: '50% 8% / 325% 215%' },
  'Mrs. White': { color: '#f8fafc', initials: 'WH', avatar: '🧹', bgPos: '92% 8% / 325% 215%' },
  'Mr. Green': { color: '#16a34a', initials: 'GR', avatar: '🎩', bgPos: '8% 92% / 325% 215%' },
  'Mrs. Peacock': { color: '#3b82f6', initials: 'PE', avatar: '🦚', bgPos: '50% 92% / 325% 215%' },
  'Professor Plum': { color: '#9333ea', initials: 'PL', avatar: '👓', bgPos: '92% 92% / 325% 215%' }
};

const CLUE_WEAPON_META: Record<string, { icon: string; bgPos: string }> = {
  'Candlestick': { icon: '🕯️', bgPos: '11% 55% / 640% 170%' },
  'Dagger': { icon: '🗡️', bgPos: '27% 55% / 640% 170%' },
  'Lead Pipe': { icon: '🔩', bgPos: '43% 55% / 640% 170%' },
  'Revolver': { icon: '🔫', bgPos: '59% 55% / 640% 170%' },
  'Rope': { icon: '🪢', bgPos: '75% 55% / 640% 170%' },
  'Wrench': { icon: '🔧', bgPos: '91% 55% / 640% 170%' }
};

const CLUE_ROOM_ZONES: Record<string, { top: number; left: number; width: number; height: number; secretPassage?: string; connects: string[]; bgPos: string; bgImg: string }> = {
  'Study': {
    top: 5, left: 5, width: 25, height: 24,
    secretPassage: 'Kitchen',
    connects: ['Hall', 'Library'],
    bgPos: '18% 18% / 380% 380%',
    bgImg: CLUE_BOARD_IMG
  },
  'Hall': {
    top: 4, left: 38, width: 24, height: 26,
    connects: ['Study', 'Lounge', 'Ballroom'],
    bgPos: '50% 18% / 380% 380%',
    bgImg: CLUE_BOARD_IMG
  },
  'Lounge': {
    top: 5, left: 69, width: 26, height: 24,
    secretPassage: 'Conservatory',
    connects: ['Hall', 'Dining Room'],
    bgPos: '50% 85% / 320% 220%',
    bgImg: CLUE_ROOMS_IMG
  },
  'Library': {
    top: 36, left: 5, width: 28, height: 24,
    connects: ['Study', 'Billiard Room'],
    bgPos: '10% 20% / 320% 220%',
    bgImg: CLUE_ROOMS_IMG
  },
  'Dining Room': {
    top: 33, left: 69, width: 26, height: 22,
    connects: ['Lounge', 'Kitchen'],
    bgPos: '83% 45% / 380% 380%',
    bgImg: CLUE_BOARD_IMG
  },
  'Billiard Room': {
    top: 68, left: 5, width: 27, height: 24,
    connects: ['Library', 'Ballroom'],
    bgPos: '90% 85% / 320% 220%',
    bgImg: CLUE_ROOMS_IMG
  },
  'Ballroom': {
    top: 67, left: 37, width: 26, height: 26,
    connects: ['Billiard Room', 'Conservatory', 'Hall'],
    bgPos: '50% 20% / 320% 220%',
    bgImg: CLUE_ROOMS_IMG
  },
  'Conservatory': {
    top: 55, left: 72, width: 23, height: 18,
    secretPassage: 'Lounge',
    connects: ['Ballroom', 'Billiard Room'],
    bgPos: '90% 20% / 320% 220%',
    bgImg: CLUE_ROOMS_IMG
  },
  'Kitchen': {
    top: 74, left: 72, width: 23, height: 19,
    secretPassage: 'Study',
    connects: ['Dining Room', 'Ballroom'],
    bgPos: '10% 85% / 320% 220%',
    bgImg: CLUE_ROOMS_IMG
  }
};

function renderClueCardHtml(cardKey: string, opts?: { large?: boolean; selectable?: boolean; selected?: boolean; onclickAttr?: string }): string {
  const type = cardKey[0];
  const name = cardKey.slice(2);
  const large = !!opts?.large;
  const selectable = !!opts?.selectable;
  const selected = !!opts?.selected;
  const onclick = opts?.onclickAttr ? ` onclick="${opts.onclickAttr}"` : '';

  let headerClass = 'room';
  let headerText = 'ROOM';
  let photoStyle = '';

  if (type === 'S') {
    headerClass = 'suspect';
    headerText = 'SUSPECT';
    const meta = CLUE_SUSPECT_META[name] || CLUE_SUSPECT_META['Miss Scarlet'];
    photoStyle = `background-image: url('${CLUE_SUSPECTS_IMG}'); background-position: ${meta.bgPos};`;
  } else if (type === 'W') {
    headerClass = 'weapon';
    headerText = 'WEAPON';
    const meta = CLUE_WEAPON_META[name] || CLUE_WEAPON_META['Candlestick'];
    photoStyle = `background-image: url('${CLUE_WEAPONS_IMG}'); background-position: ${meta.bgPos};`;
  } else {
    headerClass = 'room';
    headerText = 'ROOM';
    const zone = CLUE_ROOM_ZONES[name];
    if (zone) {
      photoStyle = `background-image: url('${zone.bgImg}'); background-position: ${zone.bgPos};`;
    } else {
      photoStyle = `background-image: url('${CLUE_BOARD_IMG}'); background-position: 50% 50% / cover;`;
    }
  }

  const baseClass = large ? 'clue-picture-card clue-large-card' : 'clue-picture-card';
  const selClass = selectable ? ' selectable' : '';
  const activeClass = selected ? ' selected' : '';

  return `<div class="${baseClass}${selClass}${activeClass}" data-card="${cardKey}"${onclick}>
    <div class="clue-card-header ${headerClass}">${headerText}</div>
    <div class="clue-card-photo" style="${photoStyle}"></div>
    <div class="clue-card-title">${name}</div>
  </div>`;
}

stdInit('clue', {
  name: 'Clue',
  icon: '🔍',
  desc: 'Solve the murder at Tudor Mansion',
  p: [2, 4],
  payout: PAYOUTS.clue,
  rules: 'Official Clue game rules: Explore Tudor Mansion rooms, roll dice or take Secret Passages, and make suggestions. Other players must disprove your theory by secretly showing one card. Use your detective notebook to eliminate suspects, weapons, and rooms, then make your final accusation!',
  SUSPECTS: ['Miss Scarlet', 'Colonel Mustard', 'Mrs. White', 'Mr. Green', 'Mrs. Peacock', 'Professor Plum'],
  WEAPONS: ['Candlestick', 'Dagger', 'Lead Pipe', 'Revolver', 'Rope', 'Wrench'],
  ROOMS: ['Study', 'Hall', 'Lounge', 'Library', 'Dining Room', 'Billiard Room', 'Conservatory', 'Ballroom', 'Kitchen'],

  newState(C: any) {
    const defaultSuspectRooms: Record<string, string> = {
      'Miss Scarlet': 'Lounge',
      'Colonel Mustard': 'Dining Room',
      'Mrs. White': 'Kitchen',
      'Mr. Green': 'Ballroom',
      'Mrs. Peacock': 'Conservatory',
      'Professor Plum': 'Study'
    };
    const defaultWeaponRooms: Record<string, string> = {
      'Candlestick': 'Ballroom',
      'Dagger': 'Lounge',
      'Lead Pipe': 'Conservatory',
      'Revolver': 'Study',
      'Rope': 'Dining Room',
      'Wrench': 'Kitchen'
    };

    return {
      turn: 0,
      rolled: false,
      lastDie: 0,
      playerRooms: C.names.map((_: any, i: number) => {
        const suspects = ['Lounge', 'Dining Room', 'Kitchen', 'Ballroom', 'Conservatory', 'Study'];
        return suspects[i % suspects.length];
      }),
      suspectRooms: defaultSuspectRooms,
      weaponRooms: defaultWeaponRooms,
      log: [],
      eliminated: C.names.map(() => false),
      over: false,
      lastSuggestion: null,
      pendingContinue: false
    };
  },

  deal(C: any) {
    const g = this;
    const s = g.SUSPECTS[ri(0, g.SUSPECTS.length - 1)];
    const w = g.WEAPONS[ri(0, g.WEAPONS.length - 1)];
    const r = g.ROOMS[ri(0, g.ROOMS.length - 1)];

    const rest: string[] = [];
    g.SUSPECTS.forEach((x: string) => { if (x !== s) rest.push('S:' + x); });
    g.WEAPONS.forEach((x: string) => { if (x !== w) rest.push('W:' + x); });
    g.ROOMS.forEach((x: string) => { if (x !== r) rest.push('R:' + x); });
    shuffle(rest);

    const hands: string[][] = C.names.map(() => []);
    rest.forEach((c, i) => hands[i % C.names.length].push(c));

    return { env: { s, w, r }, hands };
  },

  cardName(c: string) { return c.slice(2); },

  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;

    // Deal cards if not yet dealt
    if (!C.priv) {
      if (C.isNet) {
        C.priv = { hands: {} };
        if (Net.isHost()) {
          const d = g.deal(C);
          C.priv = d;
          C.names.forEach((n: string, i: number) => {
            if (i !== Net.mySeat()) Net.inboxSend({ to: i, type: 'hand', cards: d.hands[i] });
          });
          toast('Cards dealt');
        } else {
          R.innerHTML = turnBanner(C) + '<div class="card center"><h2>🔍 Clue</h2><div class="muted">Waiting for the host to deal…</div></div>';
          return;
        }
      } else {
        C.priv = g.deal(C);
      }
    }

    const me = C.isNet ? Net.mySeat() : C.cur();
    const myHand: string[] = (C.priv.hands[me] || []).slice().sort();

    // Auto-mark player's own dealt cards in their notebook on first turn
    if (!C.notes) {
      C.notes = {};
      myHand.forEach((c: string) => { C.notes[c] = 'Y'; });
    }

    const curSeat = C.cur();
    const myTurn = C.mine() && !S.over && !S.eliminated[curSeat];
    const currentRoom = S.playerRooms[curSeat] || 'Hall';
    const roomZone = CLUE_ROOM_ZONES[currentRoom];

    // Compute reachable rooms for active player
    const reachableRooms = new Set<string>();
    if (myTurn) {
      if (S.rolled) {
        // Can move to connected rooms or any room on roll >= 4
        (roomZone?.connects || []).forEach(r => reachableRooms.add(r));
        if (S.lastDie >= 4) {
          g.ROOMS.forEach((r: string) => reachableRooms.add(r));
        }
      }
      // Secret passage is always accessible if present!
      if (roomZone?.secretPassage) {
        reachableRooms.add(roomZone.secretPassage);
      }
    }

    let h = turnBanner(C);

    // ==========================================
    // OFFICIAL CLUE GAME BOARD (TUDOR MANSION)
    // ==========================================
    h += `<div class="clue-mansion-frame">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h3 style="margin:0; color:#fef08a; font-size:16px;">🏰 Tudor Mansion Official Board</h3>
        <span style="font-size:12px; color:#fed7aa; background:rgba(0,0,0,0.5); padding:2px 8px; border-radius:12px;">
          ${esc(C.seatName(curSeat))}'s Token: <b style="color:${CLUE_SUSPECT_META[g.SUSPECTS[curSeat % 6]]?.color || '#fff'}">${g.SUSPECTS[curSeat % 6]}</b> in <b>${currentRoom}</b>
        </span>
      </div>

      <div class="clue-board-container" id="clueBoard">
        <img class="clue-board-bg" src="${CLUE_BOARD_IMG}" alt="Clue Mansion Board" referrerpolicy="no-referrer" />`;

    // Render interactive room hotspots
    for (const rName of g.ROOMS) {
      const z = CLUE_ROOM_ZONES[rName];
      if (!z) continue;

      const isCurrent = rName === currentRoom;
      const isReachable = reachableRooms.has(rName);
      let zoneClasses = 'clue-room-zone';
      if (isCurrent) zoneClasses += ' current-room';
      if (isReachable) zoneClasses += ' reachable';

      // Find suspects and weapons inside this room
      const suspectsInRoom: number[] = [];
      C.names.forEach((_: any, pIdx: number) => {
        if (S.playerRooms[pIdx] === rName) suspectsInRoom.push(pIdx);
      });

      const weaponsInRoom: string[] = [];
      for (const wName in S.weaponRooms) {
        if (S.weaponRooms[wName] === rName) weaponsInRoom.push(wName);
      }

      h += `<div class="${zoneClasses}" style="top:${z.top}%; left:${z.left}%; width:${z.width}%; height:${z.height}%;" data-room="${rName}">
        <div class="clue-room-label-tag">${rName}</div>
        <div class="clue-occupants-tray">`;

      // Render suspect pawns in room
      suspectsInRoom.forEach(pIdx => {
        const sName = g.SUSPECTS[pIdx % 6];
        const meta = CLUE_SUSPECT_META[sName];
        const isActive = pIdx === curSeat;
        h += `<div class="clue-suspect-token${isActive ? ' active-turn' : ''}" style="background:${meta.color}; color:${pIdx === 2 ? '#000' : '#fff'};" title="${sName} (${esc(C.seatName(pIdx))})">
          ${meta.initials}
        </div>`;
      });

      // Render weapons in room
      weaponsInRoom.forEach(wName => {
        const meta = CLUE_WEAPON_META[wName];
        h += `<div class="clue-weapon-badge" title="${wName}">${meta?.icon || '🗡️'} ${wName.slice(0, 3)}</div>`;
      });

      h += `</div></div>`;
    }

    // Center Confidential Case File Hotspot
    h += `<div class="clue-room-zone" style="top:37%; left:40%; width:20%; height:25%; cursor:pointer;" id="clueCenterCaseFile" title="Case File Confidential">
      <div class="clue-room-label-tag" style="background:#7f1d1d; color:#fef08a;">CASE FILE</div>
    </div>`;

    h += `</div></div>`;

    // Secret passage quick button if available
    if (roomZone?.secretPassage) {
      h += `<div class="clue-secret-passage-banner">
        <div>
          <b>🚪 Secret Passage Discovered!</b>
          <div style="font-size:12px; opacity:0.9;">Secret tunnel connects <b>${currentRoom}</b> directly to the <b>${roomZone.secretPassage}</b>!</div>
        </div>
        ${myTurn && !S.pendingContinue ? `<button class="btn small" style="background:#d97706;" id="clueTakePassage">Travel to ${roomZone.secretPassage} ➔</button>` : ''}
      </div>`;
    }

    // ==========================================
    // ACTION CONTROLS / TURN PHASE
    // ==========================================
    if (myTurn) {
      h += '<div class="card" style="border: 2px solid #78350f;">';

      if (S.pendingContinue) {
        // Player completed an action and needs to continue
        h += `<h3>✅ Evidence Reviewed</h3>
          <div class="msg" style="margin-bottom:12px;">You've made your move! Take a moment to update your Detective Notebook below, then tap Continue.</div>
          <button class="btn" id="clueNextTurn">Continue to Next Player ➔</button>`;
      } else if (!S.rolled) {
        // Step 1: Roll Movement Die or Accuse
        h += `<h3>🎲 Move Through the Mansion</h3>
          <div class="muted" style="margin-bottom:12px;">You are currently in the <b>${currentRoom}</b>. Roll the die to advance down the corridors to another room, or use a secret passage.</div>
          <div class="row" style="gap:8px; align-items:center;">
            <button class="btn" id="clueRollDie">🎲 Roll Movement Die</button>
            <button class="btn secondary" id="clueToggleAccuse">${C._accuse ? 'Switch to Suggest' : '⚖️ Switch to Accuse'}</button>
          </div>`;
      } else {
        // Step 2: In a Room -> Make a Suggestion or Accuse
        if (C._accuse) {
          h += `<h3>⚖️ Make Your Official ACCUSATION</h3>
            <div class="msg" style="background:#fef2f2; border-color:#ef4444; color:#991b1b; margin-bottom:10px;">
              ⚠️ <b>Final Verdict:</b> If all 3 cards match the secret Confidential Case File, you <b>WIN</b> immediately! If even one card is wrong, you are eliminated from taking turns!
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:12px;">
              <div><label>Suspect</label><select id="clS" style="width:100%">${g.SUSPECTS.map((x: string) => `<option>${x}</option>`).join('')}</select></div>
              <div><label>Weapon</label><select id="clW" style="width:100%">${g.WEAPONS.map((x: string) => `<option>${x}</option>`).join('')}</select></div>
              <div><label>Room</label><select id="clR" style="width:100%">${g.ROOMS.map((x: string) => `<option>${x}</option>`).join('')}</select></div>
            </div>
            <div class="row" style="gap:8px;">
              <button class="btn" style="background:#b91c1c;" id="clGo">⚖️ SUBMIT ACCUSATION!</button>
              <button class="btn secondary small" id="clueToggleAccuse">Back to Suggestion</button>
            </div>`;
        } else {
          // Official suggestion must be in the current room
          h += `<h3>💡 Make a Suggestion in the ${currentRoom}</h3>
            <div class="muted" style="margin-bottom:10px;">
              🎲 Rolled a <b>${S.lastDie}</b>. Select the suspect and weapon to bring into the <b>${currentRoom}</b> for questioning.
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
              <div>
                <label>Suspect to Question</label>
                <select id="clS" style="width:100%">${g.SUSPECTS.map((x: string) => `<option>${x}</option>`).join('')}</select>
              </div>
              <div>
                <label>Murder Weapon</label>
                <select id="clW" style="width:100%">${g.WEAPONS.map((x: string) => `<option>${x}</option>`).join('')}</select>
              </div>
            </div>
            <div class="row" style="gap:8px; align-items:center;">
              <button class="btn" id="clGo">💡 Suggest in ${currentRoom}</button>
              <button class="btn secondary small" id="clueToggleAccuse">⚖️ Accuse Instead</button>
            </div>`;
        }
      }

      h += '</div>';
    } else if (S.eliminated[curSeat] && C.mine()) {
      h += '<div class="msg">⚖️ You made an incorrect accusation and are out of guessing — but you still disprove other players\' suggestions with your cards!</div>';
    }

    // ==========================================
    // YOUR OFFICIAL PICTURE CARDS HAND
    // ==========================================
    h += `<div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <h3 style="margin:0;">🃏 Your Secret Evidence Cards (${myHand.length})</h3>
        <span class="muted" style="font-size:12px;">Keep these hidden from opponents</span>
      </div>
      <div class="clue-cards-fan">
        ${myHand.map(c => renderClueCardHtml(c)).join('')}
      </div>
    </div>`;

    // ==========================================
    // DETECTIVE NOTEBOOK
    // ==========================================
    h += `<div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <h3 style="margin:0;">📓 Official Detective Notebook</h3>
        <span class="muted" style="font-size:11px;">Tap to cycle: <b>?</b> (Unknown) → <b style="color:#16a34a;">✓</b> (Seen/Held) → <b style="color:#dc2626;">✗</b> (Ruled Out) → <b style="color:#ca8a04;">!</b> (Culprit)</span>
      </div>
      <div class="clue-notebook-wrap">`;

    const renderNotebookGroup = (title: string, prefix: string, items: string[]) => {
      let gh = `<div class="clue-notebook-group-title">${title}</div><div class="clue-notebook-grid">`;
      items.forEach(item => {
        const k = prefix + ':' + item;
        const v = C.notes[k] || '?';
        let statusClass = '';
        let icon = '?';
        if (v === 'Y') { statusClass = ' status-yes'; icon = '✓'; }
        else if (v === 'N') { statusClass = ' status-no'; icon = '✗'; }
        else if (v === '!') { statusClass = ' status-suspect'; icon = '⚠️'; }

        gh += `<button class="clue-notebook-btn${statusClass}" data-note-key="${k}">
          <span>${item}</span>
          <b style="font-size:12px;">${icon}</b>
        </button>`;
      });
      gh += '</div>';
      return gh;
    };

    h += renderNotebookGroup('Suspects', 'S', g.SUSPECTS);
    h += renderNotebookGroup('Weapons', 'W', g.WEAPONS);
    h += renderNotebookGroup('Rooms', 'R', g.ROOMS);

    h += `</div></div>`;

    // ==========================================
    // INVESTIGATION LOG
    // ==========================================
    h += `<div class="card">
      <h3>📜 Case Log</h3>
      <div class="chatbox" style="max-height:140px;">
        ${S.log.length ? S.log.slice(-10).map((l: string) => `<div class="msg">${esc(l)}</div>`).join('') : '<div class="muted">No suggestions made yet. The investigation has begun…</div>'}
      </div>
    </div>`;

    R.innerHTML = h;

    // Attach Event Listeners
    // Notebook clicks
    R.querySelectorAll('[data-note-key]').forEach((b: any) => {
      b.onclick = () => {
        const k = b.dataset.noteKey;
        const v = C.notes[k] || '?';
        // Cycle: ? -> Y -> N -> ! -> ?
        if (v === '?') C.notes[k] = 'Y';
        else if (v === 'Y') C.notes[k] = 'N';
        else if (v === 'N') C.notes[k] = '!';
        else C.notes[k] = '?';
        C.rerender();
      };
    });

    // Room Zone clicks on Board
    R.querySelectorAll('.clue-room-zone[data-room]').forEach((el: any) => {
      el.onclick = () => {
        const rName = el.dataset.room;
        if (myTurn && reachableRooms.has(rName)) {
          g.moveToRoom(C, curSeat, rName);
        } else if (rName) {
          toast(`Selected: ${rName}`);
        }
      };
    });

    // Roll Die button
    const rollBtn = $('#clueRollDie');
    if (rollBtn) {
      rollBtn.onclick = () => {
        const roll = ri(1, 6);
        S.rolled = true;
        S.lastDie = roll;
        S.log.push(`🎲 ${esc(C.seatName(curSeat))} rolled a ${roll}!`);
        toast(`🎲 Rolled a ${roll}!`);
        C.update(() => {});
        C.rerender();
      };
    }

    // Secret passage button
    const passageBtn = $('#clueTakePassage');
    if (passageBtn && roomZone?.secretPassage) {
      passageBtn.onclick = () => {
        g.moveToRoom(C, curSeat, roomZone.secretPassage!);
      };
    }

    // Toggle Accuse
    const togBtn = $('#clueToggleAccuse');
    if (togBtn) {
      togBtn.onclick = () => {
        C._accuse = !C._accuse;
        C.rerender();
      };
    }

    // Submit Suggestion or Accusation
    const goBtn = $('#clGo');
    if (goBtn) {
      goBtn.onclick = () => {
        const s = ($('#clS') as HTMLSelectElement).value;
        const w = ($('#clW') as HTMLSelectElement).value;
        const r = C._accuse ? ($('#clR') as HTMLSelectElement).value : currentRoom;
        if (C._accuse) {
          g.accuse(C, s, w, r);
        } else {
          g.suggest(C, s, w, r);
        }
      };
    }

    // Continue to next player
    const nextBtn = $('#clueNextTurn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        S.pendingContinue = false;
        S.rolled = false;
        g.advance(C);
      };
    }

    // Center Case File click
    const caseFileEl = $('#clueCenterCaseFile');
    if (caseFileEl) {
      caseFileEl.onclick = () => {
        const m = modal(`<h3>📁 Confidential Case File</h3>
          <div class="clue-envelope-card">
            <img src="${CLUE_ENVELOPE_IMG}" alt="Confidential Case File" referrerpolicy="no-referrer" />
          </div>
          <div class="muted center" style="margin-top:8px;">
            The secret identity of the murderer, the weapon used, and the room where the crime was committed are sealed inside this envelope.
          </div>
          <button class="btn" style="margin-top:12px;" id="clueCloseEnvelopeBtn">Close</button>`);
        const b = m.querySelector('#clueCloseEnvelopeBtn') as HTMLElement;
        if (b) b.onclick = () => closeModal();
      };
    }
  },

  moveToRoom(C: any, seat: number, targetRoom: string) {
    const S = C.S;
    S.playerRooms[seat] = targetRoom;
    S.log.push(`🚶 ${esc(C.seatName(seat))} entered the ${targetRoom}.`);
    toast(`Entered the ${targetRoom}`);
    C.update(() => {});
    C.rerender();
  },

  orderAfter(C: any, from: number) {
    const o: number[] = [];
    for (let i = 1; i < C.names.length; i++) o.push((from + i) % C.names.length);
    return o;
  },

  suggest(C: any, s: string, w: string, r: string) {
    const S = C.S, g = this;
    const me = C.cur();

    // Bring suggested suspect and weapon into the room on the official board
    S.suspectRooms[s] = r;
    S.weaponRooms[w] = r;
    S.lastSuggestion = { s, w, r, suggester: me };

    if (C.isNet) {
      const to = g.orderAfter(C, me)[0];
      Net.inboxSend({ to, type: 'suggest', from: me, s, w, r });
      toast('Suggestion broadcast across the mansion…');
      return;
    }

    g.resolveLocal(C, me, s, w, r, g.orderAfter(C, me));
  },

  resolveLocal(C: any, me: number, s: string, w: string, r: string, order: number[]) {
    const S = C.S, g = this;
    const match = (hand: string[]) => hand.find(c => (c === 'S:' + s || c === 'W:' + w || c === 'R:' + r));

    const step = (i: number) => {
      if (i >= order.length) {
        S.log.push(`💡 ${esc(C.seatName(me))} suggested ${s} with the ${w} in the ${r} — NOBODY could disprove it!`);
        S.pendingContinue = true;
        C.update(() => {});
        C.rerender();
        return;
      }

      const seat = order[i];
      const matchingCards = (C.priv.hands[seat] || []).filter((c: string) => c === 'S:' + s || c === 'W:' + w || c === 'R:' + r);

      if (!matchingCards.length) {
        step(i + 1);
        return;
      }

      // Computer player secretly disproves
      if (C.mode === 'pvc' && seat === 1) {
        const cardToReveal = matchingCards[0];
        if (!C._aiSeen) C._aiSeen = new Set();
        C._aiSeen.add(cardToReveal);
        C.notes[cardToReveal] = 'Y';
        S.log.push(`🤖 Computer disproved ${esc(C.seatName(me))}'s suggestion by secretly revealing evidence.`);
        g.showRevealedCardModal(C, me, cardToReveal, () => {
          S.pendingContinue = true;
          C.update(() => {});
          C.rerender();
        });
        return;
      }

      // Human player disproves by picking which picture card to reveal
      const cardsHtml = matchingCards.map((c: string) => `
        <div style="cursor:pointer;" data-disprove-card="${c}">
          ${renderClueCardHtml(c, { selectable: true })}
        </div>
      `).join('');

      const m = modal(`<h3>🔍 Disprove Evidence — ${esc(C.seatName(seat))}</h3>
        <div class="muted" style="margin-bottom:12px;">Everyone else look away! Tap one matching picture card to secretly reveal to <b>${esc(C.seatName(me))}</b>:</div>
        <div class="clue-cards-fan">${cardsHtml}</div>`);

      m.querySelectorAll('[data-disprove-card]').forEach((el: any) => {
        el.onclick = () => {
          const card = el.dataset.disproveCard;
          closeModal();
          S.log.push(`🔍 ${esc(C.seatName(seat))} disproved ${esc(C.seatName(me))}'s suggestion.`);
          g.revealToSuggester(C, me, card, () => {
            S.pendingContinue = true;
            C.update(() => {});
            C.rerender();
          });
        };
      });
    };

    step(0);
  },

  showRevealedCardModal(C: any, me: number, card: string, done: () => void) {
    const g = this;
    const cardName = g.cardName(card);
    const m = modal(`<h3>🤫 Secret Evidence Revealed</h3>
      <div class="muted center" style="margin-bottom:12px;">For <b>${esc(C.seatName(me))}</b>'s eyes only:</div>
      ${renderClueCardHtml(card, { large: true })}
      <div class="center" style="margin-top:14px;">
        <button class="btn" id="clueMarkNoteBtn">✓ Record in Notebook & Continue</button>
      </div>`);

    const markBtn = m.querySelector('#clueMarkNoteBtn') as HTMLElement;
    if (markBtn) {
      markBtn.onclick = () => {
        C.notes[card] = 'Y';
        closeModal();
        done();
      };
    }
  },

  revealToSuggester(C: any, me: number, card: string, done: () => void) {
    if (C.mode === 'pvc' && me === 1) {
      if (!C._aiSeen) C._aiSeen = new Set();
      C._aiSeen.add(card);
      done();
      return;
    }
    this.showRevealedCardModal(C, me, card, done);
  },

  advance(C: any) {
    const S = C.S;
    if (S.over) return;
    S.rolled = false;
    S.pendingContinue = false;

    let n = (S.turn + 1) % C.names.length;
    let guard = 0;
    while (S.eliminated[n] && guard++ < 10) {
      n = (n + 1) % C.names.length;
    }

    S.turn = n;
    C.update(() => {});
    maybeCpu(C);
  },

  accuse(C: any, s: string, w: string, r: string) {
    const S = C.S, g = this;
    const me = C.cur();

    if (C.isNet && !Net.isHost()) {
      const hostSeat = (Net.room && Net.room.seats) ? Net.room.seats.indexOf(Net.room.host) : 0;
      Net.inboxSend({ to: hostSeat, type: 'accuse', from: me, s, w, r });
      toast('Accusation sent to host…');
      return;
    }

    const env = C.priv.env;
    const correct = env.s === s && env.w === w && env.r === r;

    if (correct) {
      S.over = true;
      S.log.push(`⚖️ ${esc(C.seatName(me))} accused ${s} with the ${w} in the ${r} — CORRECT! 🎉`);
      C.update(() => {});

      const m = modal(`<h3>🎉 CASE SOLVED!</h3>
        <div class="center" style="margin-bottom:12px;">
          <b>${esc(C.seatName(me))}</b> cracked the case! It was <b>${s}</b> with the <b>${w}</b> in the <b>${r}</b>!
        </div>
        <div class="clue-cards-fan">
          ${renderClueCardHtml('S:' + s, { large: true })}
          ${renderClueCardHtml('W:' + w, { large: true })}
          ${renderClueCardHtml('R:' + r, { large: true })}
        </div>
        <div class="center" style="margin-top:16px;">
          <button class="btn" id="clueCloseSolvedBtn">View Finished Board</button>
        </div>`);
      const b = m.querySelector('#clueCloseSolvedBtn') as HTMLElement;
      if (b) b.onclick = () => closeModal();

      C.finish(me, `Solved it: ${s} with the ${w} in the ${r}!`);
    } else {
      S.eliminated[me] = true;
      S.log.push(`⚖️ ${esc(C.seatName(me))} accused ${s} with the ${w} in the ${r} — WRONG ACCUSATION! ❌`);
      toast('Wrong accusation! You are eliminated from further guesses.');
      C.update(() => {});
      g.advance(C);
    }
  },

  inbox(C: any, msg: any) {
    const g = GAMES.clue;
    const my = Net.mySeat();
    if (msg.to !== my) return;

    if (msg.type === 'hand') {
      C.priv.hands = C.priv.hands || {};
      C.priv.hands[my] = msg.cards;
      if (!C.notes) C.notes = {};
      msg.cards.forEach((c: string) => { C.notes[c] = 'Y'; });
      C.rerender();
      toast('Your evidence cards dealt!');
    }

    if (msg.type === 'suggest') {
      const hand = C.priv.hands[my] || [];
      const card = hand.find((c: string) => c === 'S:' + msg.s || c === 'W:' + msg.w || c === 'R:' + msg.r);
      if (card) {
        Net.inboxSend({ to: msg.from, type: 'disprove', card, suggester: msg.from });
      } else {
        const seq = [];
        for (let i = 1; i < C.names.length; i++) seq.push((msg.from + i) % C.names.length);
        const idx = seq.indexOf(my);
        const nxt = seq[idx + 1];
        if (nxt == null) Net.inboxSend({ to: msg.from, type: 'disprove', card: null });
        else Net.inboxSend({ to: nxt, type: 'suggest', from: msg.from, s: msg.s, w: msg.w, r: msg.r });
      }
    }

    if (msg.type === 'disprove') {
      if (msg.card) {
        C.notes = C.notes || {};
        C.notes[msg.card] = 'Y';
        g.showRevealedCardModal(C, my, msg.card, () => {
          C.update((st: any) => { st.log.push('Suggestion disproved (secret card shown).'); });
          g.advance(C);
        });
      } else {
        C.update((st: any) => { st.log.push('Nobody could disprove the suggestion.'); });
        g.advance(C);
      }
    }

    if (msg.type === 'accuse') {
      const env = C.priv.env;
      const correct = env.s === msg.s && env.w === msg.w && env.r === msg.r;
      C.update((st: any) => {
        st.log.push(`⚖️ ${esc(C.seatName(msg.from))} accused ${msg.s} / ${msg.w} / ${msg.r} — ${correct ? 'CORRECT! 🎉' : 'WRONG! ❌'}`);
        if (correct) st.over = true; else st.eliminated[msg.from] = true;
      });
      Net.inboxSend({ to: msg.from, type: 'accuseResult', correct, s: msg.s, w: msg.w, r: msg.r });
      if (correct) C.finish(msg.from, 'Solved it!'); else C.rerender();
    }

    if (msg.type === 'accuseResult') {
      if (msg.correct) {
        C.finish(my, `You solved it: ${msg.s} / ${msg.w} / ${msg.r}!`);
      } else {
        toast("Wrong accusation! You're eliminated from taking turns.");
        C.rerender();
      }
    }
  },

  cpu(C: any) {
    const S = C.S, g = this;
    if (S.eliminated[1]) { g.advance(C); return; }

    if (!C._aiSeen) C._aiSeen = new Set();
    (C.priv.hands[1] || []).forEach((c: string) => C._aiSeen.add(c));

    const uS = g.SUSPECTS.filter((x: string) => !C._aiSeen.has('S:' + x));
    const uW = g.WEAPONS.filter((x: string) => !C._aiSeen.has('W:' + x));
    const uR = g.ROOMS.filter((x: string) => !C._aiSeen.has('R:' + x));

    cpuDelay(() => {
      // If AI knows all 3, accuse!
      if (uS.length === 1 && uW.length === 1 && uR.length === 1) {
        g.accuse(C, uS[0], uW[0], uR[0]);
        return;
      }

      // Roll and move AI suspect
      const roll = ri(1, 6);
      S.lastDie = roll;
      const curRoom = S.playerRooms[1] || 'Hall';
      const zone = CLUE_ROOM_ZONES[curRoom];

      // Prefer moving to an unvisited room or secret passage
      let nextRoom = uR[0] || g.ROOMS[ri(0, g.ROOMS.length - 1)];
      if (zone?.secretPassage && uR.includes(zone.secretPassage)) {
        nextRoom = zone.secretPassage;
      } else if (zone?.connects?.length) {
        const unvisitedConnect = zone.connects.find(c => uR.includes(c));
        if (unvisitedConnect) nextRoom = unvisitedConnect;
      }

      S.playerRooms[1] = nextRoom;

      const s = uS[ri(0, uS.length - 1)] || g.SUSPECTS[0];
      const w = uW[ri(0, uW.length - 1)] || g.WEAPONS[0];
      const r = nextRoom;

      toast(`🤖 Computer moved to ${nextRoom} and suggests ${s} / ${w} / ${r}`);
      g.suggest(C, s, w, r);
    }, 1000);
  }
});

/* ================= WORDPLAY (Official 15x15 Board & Wooden Tiles) ================= */

const SCR_2LETTER_WORDS = [
  'AA', 'AB', 'AD', 'AE', 'AG', 'AH', 'AI', 'AL', 'AM', 'AN', 'AR', 'AS', 'AT', 'AW', 'AX', 'AY',
  'BA', 'BE', 'BI', 'BO', 'BY', 'DA', 'DE', 'DO', 'ED', 'EF', 'EH', 'EL', 'EM', 'EN', 'ER', 'ES',
  'ET', 'EW', 'EX', 'FA', 'FE', 'GI', 'GO', 'HA', 'HE', 'HI', 'HM', 'HO', 'ID', 'IF', 'IN', 'IS',
  'IT', 'JO', 'KA', 'KI', 'LA', 'LI', 'LO', 'MA', 'ME', 'MI', 'MM', 'MO', 'MU', 'MY', 'NA', 'NE',
  'NO', 'NU', 'OD', 'OE', 'OF', 'OH', 'OI', 'OK', 'OM', 'ON', 'OP', 'OR', 'OS', 'OW', 'OX', 'OY',
  'PA', 'PE', 'PI', 'PO', 'QI', 'RE', 'SH', 'SI', 'SO', 'TA', 'TE', 'TI', 'TO', 'UH', 'UM', 'UN',
  'UP', 'US', 'UT', 'WE', 'WO', 'XI', 'XU', 'YA', 'YE', 'YO', 'ZA'
];

const SCR_COMMON_WORDS = [
  'ACE', 'ACT', 'ADD', 'AGE', 'AGO', 'AID', 'AIM', 'AIR', 'ALE', 'ALL', 'AND', 'ANT', 'APE', 'APT', 'ARC', 'ARE',
  'ARM', 'ART', 'ASH', 'ASK', 'ATE', 'AWE', 'AXE', 'BAD', 'BAG', 'BAN', 'BAR', 'BAT', 'BAY', 'BED', 'BEE', 'BEG',
  'BET', 'BID', 'BIG', 'BIN', 'BIT', 'BOA', 'BOG', 'BOT', 'BOW', 'BOX', 'BOY', 'BUD', 'BUG', 'BUM', 'BUN', 'BUS',
  'BUT', 'BUY', 'BYE', 'CAB', 'CAM', 'CAN', 'CAP', 'CAR', 'CAT', 'COD', 'COG', 'CON', 'COP', 'COT', 'COW', 'COY',
  'CRY', 'CUB', 'CUE', 'CUP', 'CUT', 'DAB', 'DAD', 'DAM', 'DAY', 'DEN', 'DEW', 'DID', 'DIE', 'DIG', 'DIM', 'DIN',
  'DIP', 'DOG', 'DOT', 'DRY', 'DUB', 'DUE', 'DUG', 'DYE', 'EAR', 'EAT', 'EEL', 'EGG', 'EGO', 'ELF', 'ELK', 'ELM',
  'END', 'ERA', 'EVE', 'EYE', 'FAN', 'FAR', 'FAT', 'FED', 'FEE', 'FEW', 'FIG', 'FIN', 'FIR', 'FIT', 'FIX', 'FLY',
  'FOG', 'FOR', 'FOX', 'FRY', 'FUN', 'FUR', 'GAG', 'GAP', 'GAS', 'GAY', 'GEL', 'GEM', 'GET', 'GIG', 'GIN', 'GLAD',
  'GNU', 'GOB', 'GOD', 'GOO', 'GOT', 'GUM', 'GUN', 'GUT', 'GUY', 'GYM', 'HAD', 'HAM', 'HAS', 'HAT', 'HAY', 'HEM',
  'HEN', 'HEX', 'HID', 'HIM', 'HIP', 'HIS', 'HIT', 'HOG', 'HOP', 'HOT', 'HOW', 'HUB', 'HUE', 'HUG', 'HUM', 'HUT',
  'ICE', 'ICY', 'ILL', 'IMP', 'INK', 'INN', 'ION', 'IRE', 'IVY', 'JAB', 'JAM', 'JAR', 'JAW', 'JAY', 'JET', 'JIG',
  'JOB', 'JOG', 'JOY', 'JUG', 'JUT', 'KEG', 'KEY', 'KID', 'KIN', 'KIT', 'LAB', 'LAD', 'LAG', 'LAP', 'LAW', 'LAY',
  'LED', 'LEG', 'LET', 'LID', 'LIE', 'LIP', 'LIT', 'LOG', 'LOT', 'LOW', 'MAD', 'MAN', 'MAP', 'MAT', 'MAY', 'MEN',
  'MET', 'MUD', 'MUG', 'MUM', 'NAB', 'NAG', 'NAP', 'NET', 'NEW', 'NIL', 'NIP', 'NOD', 'NOT', 'NOW', 'NUT', 'OAF',
  'OAK', 'OAR', 'OAT', 'ODD', 'OFF', 'OFT', 'OIL', 'OLD', 'ONE', 'OPT', 'ORB', 'ORE', 'OUR', 'OUT', 'OWL', 'OWN',
  'PAD', 'PAL', 'PAN', 'PAR', 'PAT', 'PAW', 'PAY', 'PEA', 'PEG', 'PEN', 'PET', 'PEW', 'PIE', 'PIG', 'PIN', 'PIP',
  'PIT', 'PLY', 'POD', 'POP', 'POT', 'PRO', 'PRY', 'PUB', 'PUG', 'PUN', 'PUP', 'PUS', 'PUT', 'RAG', 'RAM', 'RAN',
  'RAP', 'RAT', 'RAW', 'RAY', 'RED', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD', 'ROT', 'ROW', 'RUB', 'RUG',
  'RUN', 'RUT', 'RYE', 'SAD', 'SAG', 'SAP', 'SAT', 'SAW', 'SAY', 'SEA', 'SET', 'SEW', 'SHE', 'SHY', 'SIN', 'SIP',
  'SIR', 'SIT', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB', 'SOD', 'SON', 'SOW', 'SOX', 'SOY', 'SPA', 'SPY', 'SUB', 'SUE',
  'SUM', 'SUN', 'TAB', 'TAG', 'TAN', 'TAP', 'TAR', 'TAX', 'TEA', 'TEE', 'TEN', 'THE', 'THY', 'TIE', 'TIN', 'TIP',
  'TOE', 'TON', 'TOP', 'TOW', 'TOY', 'TUB', 'TUG', 'TWO', 'URN', 'USE', 'VAN', 'VAT', 'VET', 'VIA', 'VIE', 'VOW',
  'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WED', 'WEE', 'WET', 'WHO', 'WHY', 'WIG', 'WIN', 'WIT', 'WOE', 'WOK', 'WON',
  'WOO', 'WOW', 'YAK', 'YAM', 'YAP', 'YAW', 'YEA', 'YES', 'YET', 'YEW', 'YIP', 'YOU', 'ZEN', 'ZIP', 'ZOO',
  // 4-letter words
  'ABLE', 'ACHE', 'ACID', 'ACRE', 'AGED', 'AIDE', 'AIMS', 'ALLY', 'ALTO', 'AMEN', 'ARCH', 'AREA', 'ARMY', 'ATOM',
  'AUNT', 'AUTO', 'BABY', 'BACK', 'BAKE', 'BALD', 'BALL', 'BAND', 'BANK', 'BARE', 'BARK', 'BARN', 'BASE', 'BATH',
  'BEAK', 'BEAM', 'BEAN', 'BEAR', 'BEAT', 'BEEN', 'BEER', 'BELL', 'BELT', 'BEND', 'BEST', 'BIKE', 'BILL', 'BIND',
  'BIRD', 'BITE', 'BLOW', 'BLUE', 'BOAT', 'BODY', 'BOIL', 'BOLD', 'BOMB', 'BOND', 'BONE', 'BOOK', 'BOOM', 'BORN',
  'BOSS', 'BOTH', 'BOWL', 'BOYS', 'BURN', 'BUSH', 'BUSY', 'CAFE', 'CAGE', 'CAKE', 'CALL', 'CALM', 'CAMP', 'CARD',
  'CARE', 'CART', 'CASE', 'CASH', 'CAST', 'CATS', 'CELL', 'CHAT', 'CHEF', 'CHIN', 'CHIP', 'CITY', 'CLAP', 'CLAW',
  'CLAY', 'CLIP', 'CLUB', 'CLUE', 'COAL', 'COAT', 'CODE', 'COIN', 'COLD', 'COME', 'COOK', 'COOL', 'COPE', 'COPY',
  'CORD', 'CORE', 'CORN', 'COST', 'CRAB', 'CREW', 'CROP', 'CROW', 'CURE', 'DALE', 'DARE', 'DARK', 'DART', 'DATA',
  'DATE', 'DAWN', 'DAYS', 'DEAD', 'DEAF', 'DEAL', 'DEAN', 'DEAR', 'DEBT', 'DECK', 'DEED', 'DEEP', 'DEER', 'DESK',
  'DIAL', 'DICE', 'DIET', 'DIRT', 'DISC', 'DISH', 'DISK', 'DIVE', 'DOCK', 'DOLL', 'DOME', 'DOOM', 'DOOR', 'DOSE',
  'DOWN', 'DRAG', 'DRAW', 'DROP', 'DRUG', 'DRUM', 'DUAL', 'DUCK', 'DUST', 'DUTY', 'EACH', 'EARL', 'EARN', 'EASE',
  'EAST', 'EASY', 'EDGE', 'EGGS', 'ELSE', 'EVEN', 'EVER', 'EVIL', 'EXAM', 'EXIT', 'FACE', 'FACT', 'FADE', 'FAIR',
  'FALL', 'FAME', 'FARM', 'FAST', 'FATE', 'FEAR', 'FEAT', 'FEED', 'FEEL', 'FEET', 'FELL', 'FELT', 'FILE', 'FILL',
  'FILM', 'FIND', 'FINE', 'FIRE', 'FIRM', 'FISH', 'FIST', 'FLAG', 'FLAT', 'FLEE', 'FLEW', 'FLIP', 'FLOW', 'FOAM',
  'FOIL', 'FOLD', 'FOLK', 'FOND', 'FOOD', 'FOOL', 'FOOT', 'FORD', 'FORK', 'FORM', 'FORT', 'FOUL', 'FOUR', 'FREE',
  'FROG', 'FROM', 'FUEL', 'FULL', 'FUND', 'GAIN', 'GAME', 'GANG', 'GATE', 'GEAR', 'GIFT', 'GIRL', 'GIVE', 'GLAD',
  'GLOW', 'GOAL', 'GOAT', 'GOLD', 'GOLF', 'GONE', 'GOOD', 'GRAB', 'GRAY', 'GREW', 'GRID', 'GRIN', 'GRIP', 'GROW',
  'GULF', 'HAIR', 'HALF', 'HALL', 'HALT', 'HAND', 'HANG', 'HARD', 'HARM', 'HATE', 'HAVE', 'HAWK', 'HEAD', 'HEAL',
  'HEAP', 'HEAR', 'HEAT', 'HELD', 'HELL', 'HELP', 'HERB', 'HERD', 'HERE', 'HERO', 'HIDE', 'HIGH', 'HIKE', 'HILL',
  'HINT', 'HIRE', 'HOLD', 'HOLE', 'HOLY', 'HOME', 'HOOD', 'HOOK', 'HOPE', 'HORN', 'HOSE', 'HOST', 'HOUR', 'HUGE',
  'HUNG', 'HUNT', 'HURT', 'ICON', 'IDEA', 'IDLE', 'INCH', 'INTO', 'IRON', 'ITEM', 'JAIL', 'JOIN', 'JOKE', 'JUMP',
  'JUNE', 'JURY', 'JUST', 'KEEN', 'KEEP', 'KEPT', 'KICK', 'KILL', 'KIND', 'KING', 'KISS', 'KITE', 'KNEE', 'KNEW',
  'KNIT', 'KNOT', 'KNOW', 'LACK', 'LADY', 'LAID', 'LAKE', 'LAMB', 'LAMP', 'LAND', 'LANE', 'LAST', 'LATE', 'LEAD',
  'LEAF', 'LEAN', 'LEAP', 'LEFT', 'LEND', 'LENS', 'LESS', 'LIFE', 'LIFT', 'LIKE', 'LIME', 'LINE', 'LINK', 'LION',
  'LIPS', 'LIST', 'LIVE', 'LOAD', 'LOAF', 'LOAN', 'LOCK', 'LONG', 'LOOK', 'LORD', 'LOSE', 'LOSS', 'LOST', 'LOUD',
  'LOVE', 'LUCK', 'LUNG', 'MADE', 'MAIL', 'MAIN', 'MAKE', 'MALE', 'MALL', 'MANY', 'MARK', 'MASK', 'MASS', 'MATE',
  'MAZE', 'MEAL', 'MEAN', 'MEAT', 'MEET', 'MELT', 'MENU', 'MESS', 'MILD', 'MILE', 'MILK', 'MILL', 'MIND', 'MINE',
  'MINT', 'MISS', 'MIST', 'MOOD', 'MOON', 'MORE', 'MOST', 'MOVE', 'MUCH', 'NAME', 'NAVY', 'NEAR', 'NEAT', 'NECK',
  'NEED', 'NEST', 'NEWS', 'NEXT', 'NICE', 'NINE', 'NODE', 'NONE', 'NOON', 'NOSE', 'NOTE', 'OATH', 'OBEY', 'ODDS',
  'ONCE', 'ONLY', 'ONTO', 'OPEN', 'ORAL', 'OVER', 'PACE', 'PACK', 'PAGE', 'PAID', 'PAIN', 'PAIR', 'PALE', 'PALM',
  'PARK', 'PART', 'PASS', 'PAST', 'PATH', 'PEAK', 'PEAR', 'PEEK', 'PEEL', 'PEER', 'PENN', 'PINT', 'PIPE', 'PLAN',
  'PLAY', 'PLEA', 'PLOT', 'PLUG', 'POEM', 'POET', 'POLE', 'POLL', 'POND', 'POOL', 'POOR', 'POPE', 'PORK', 'PORT',
  'POST', 'POUR', 'PRAY', 'PULL', 'PUMP', 'PURE', 'PUSH', 'QUIZ', 'RACE', 'RAIL', 'RAIN', 'RANK', 'RARE', 'RATE',
  'READ', 'REAL', 'REAP', 'REAR', 'REED', 'REEL', 'RELY', 'REST', 'RICE', 'RICH', 'RIDE', 'RING', 'RIOT', 'RIPE',
  'RISE', 'RISK', 'ROAD', 'ROAR', 'ROBE', 'ROCK', 'RODE', 'ROLE', 'ROLL', 'ROOF', 'ROOM', 'ROOT', 'ROPE', 'ROSE',
  'RUSH', 'RUST', 'SAFE', 'SAID', 'SAIL', 'SALE', 'SALT', 'SAME', 'SAND', 'SANG', 'SANK', 'SAVE', 'SCAN', 'SEAL',
  'SEAM', 'SEAT', 'SEED', 'SEEK', 'SEEM', 'SEEN', 'SELF', 'SELL', 'SEND', 'SENT', 'SHED', 'SHIP', 'SHOE', 'SHOP',
  'SHOT', 'SHOW', 'SHUT', 'SICK', 'SIDE', 'SIGH', 'SIGN', 'SILK', 'SING', 'SINK', 'SITE', 'SIZE', 'SKIN', 'SKIP',
  'SLAP', 'SLID', 'SLIM', 'SLIP', 'SLOT', 'SLOW', 'SNAP', 'SNOW', 'SOAP', 'SOAR', 'SOCK', 'SOIL', 'SOLD', 'SOLE',
  'SOME', 'SONG', 'SOON', 'SORE', 'SOUL', 'SOUP', 'SOUR', 'SPAN', 'SPIN', 'SPOT', 'STAR', 'STAY', 'STEM', 'STEP',
  'STOP', 'SUCH', 'SUIT', 'SURE', 'SURF', 'SWAM', 'SWAN', 'SWIM', 'TALE', 'TALK', 'TALL', 'TANK', 'TAPE', 'TASK',
  'TEAM', 'TEAR', 'TELL', 'TEND', 'TENT', 'TERM', 'TEST', 'TEXT', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY', 'THIN',
  'THIS', 'TIDE', 'TIDY', 'TIED', 'TILE', 'TIME', 'TINY', 'TIRE', 'TOAD', 'TOLL', 'TONE', 'TOOK', 'TOOL', 'TOPS',
  'TORE', 'TORN', 'TOSS', 'TOUR', 'TOWN', 'TRAP', 'TRAY', 'TREE', 'TRIP', 'TRUE', 'TUBE', 'TUNE', 'TURN', 'TWIN',
  'TYPE', 'UNIT', 'UPON', 'URGE', 'USED', 'USER', 'VARY', 'VAST', 'VEIL', 'VEIN', 'VERY', 'VEST', 'VIEW', 'VINE',
  'VOID', 'VOTE', 'WAGE', 'WAIT', 'WAKE', 'WALK', 'WALL', 'WANT', 'WARD', 'WARM', 'WARN', 'WASH', 'WAVE', 'WEAK',
  'WEAR', 'WEEK', 'WELL', 'WENT', 'WERE', 'WEST', 'WHAT', 'WHEN', 'WHOM', 'WIDE', 'WIFE', 'WILD', 'WILL', 'WIND',
  'WINE', 'WING', 'WIPE', 'WIRE', 'WISE', 'WISH', 'WITH', 'WOLF', 'WOOD', 'WOOL', 'WORD', 'WORE', 'WORK', 'WORM',
  'WORN', 'WRAP', 'YARD', 'YARN', 'YEAR', 'YOGA', 'ZERO', 'ZONE',
  // Common 5, 6, 7-letter words
  'ABOUT', 'ABOVE', 'ACTOR', 'ADAPT', 'ADMIT', 'ADOPT', 'AFTER', 'AGAIN', 'AGENT', 'AGREE', 'AHEAD', 'ALARM',
  'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'AMONG', 'ANGEL',
  'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ARROW', 'ASIDE',
  'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWARD', 'AWARE', 'BADGE', 'BAKER', 'BASIC', 'BASIS', 'BEACH', 'BEGAN',
  'BEGIN', 'BEGUN', 'BEING', 'BELOW', 'BENCH', 'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLAZE',
  'BLEED', 'BLEND', 'BLESS', 'BLIND', 'BLOCK', 'BLOOD', 'BLOOM', 'BLOWN', 'BOARD', 'BOAST', 'BOOST', 'BOOTH',
  'BOUND', 'BRAIN', 'BRAND', 'BRASS', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING',
  'BROAD', 'BROKE', 'BROWN', 'BRUSH', 'BUILD', 'BUILT', 'BUNCH', 'BURST', 'BUYER', 'CABIN', 'CABLE', 'CAMEL',
  'CANAL', 'CANDY', 'CARGO', 'CARRY', 'CARVE', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHALK', 'CHAMP', 'CHANCE',
  'CHAOS', 'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEEK', 'CHEER', 'CHEST', 'CHIEF', 'CHILD', 'CHOIR',
  'CHOSE', 'CIVIC', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLERK', 'CLICK', 'CLIFF', 'CLIMB', 'CLOAK',
  'CLOCK', 'CLOSE', 'CLOTH', 'CLOUD', 'COACH', 'COAST', 'COLOR', 'COMIC', 'CORAL', 'COUCH', 'COUNT', 'COURT',
  'COVER', 'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRAWL', 'CRAZY', 'CREAM', 'CREEK', 'CREST', 'CRIME', 'CRISP',
  'CROSS', 'CROWD', 'CROWN', 'CRUSH', 'CURLY', 'CURSE', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DEATH', 'DEBUT',
  'DELAY', 'DELTA', 'DENSE', 'DEPTH', 'DEVIL', 'DIARY', 'DIRTY', 'DISCO', 'DITCH', 'DOUBT', 'DRAFT', 'DRAIN',
  'DRAMA', 'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRIFT', 'DRILL', 'DRINK', 'DRIVE', 'DROWN', 'DRUNK', 'EAGER',
  'EARLY', 'EARTH', 'ELDER', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'ESSAY', 'EVENT',
  'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FAVOR', 'FEAST', 'FENCE', 'FEVER', 'FIBER',
  'FIELD', 'FIERY', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FLAME', 'FLASH', 'FLEET', 'FLESH', 'FLOAT',
  'FLOCK', 'FLOOD', 'FLOOR', 'FLOUR', 'FLUID', 'FLUTE', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND',
  'FRAME', 'FRESH', 'FRIED', 'FRONT', 'FROST', 'FRUIT', 'FUNNY', 'GHOST', 'GIANT', 'GIVEN', 'GLASS', 'GLEAM',
  'GLIDE', 'GLOBE', 'GLORY', 'GLOVE', 'GRACE', 'GRADE', 'GRAIN', 'GRAND', 'GRANT', 'GRAPE', 'GRAPH', 'GRASP',
  'GRASS', 'GRAVE', 'GREAT', 'GREET', 'GRIEF', 'GRILL', 'GRIND', 'GROSS', 'GROUP', 'GROVE', 'GROWN', 'GUARD',
  'GUESS', 'GUEST', 'GUIDE', 'HABIT', 'HAPPY', 'HARSH', 'HAVEN', 'HEART', 'HEAVY', 'HEDGE', 'HELLO', 'HONEY',
  'HONOR', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'HUMOR', 'HURRY', 'IDEAL', 'IMAGE', 'INDEX', 'INNER', 'INPUT',
  'IRONY', 'ISSUE', 'IVORY', 'JEANS', 'JELLY', 'JEWEL', 'JOINT', 'JUDGE', 'JUICE', 'KNIFE', 'KNOCK', 'LABEL',
  'LABOR', 'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL', 'LEMON',
  'LEVEL', 'LEVER', 'LIGHT', 'LIMIT', 'LINEN', 'LIVER', 'LOCAL', 'LODGE', 'LOGIC', 'LOOSE', 'LOVER', 'LOWER',
  'LOYAL', 'LUCKY', 'LUNCH', 'MAGIC', 'MAJOR', 'MAKER', 'MANGO', 'MARCH', 'MATCH', 'MAYBE', 'MAYOR', 'MEDAL',
  'MEDIA', 'METAL', 'METER', 'MIDST', 'MIGHT', 'MINOR', 'MINUS', 'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR',
  'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NAIVE', 'NERVE', 'NIGHT', 'NOBLE', 'NOISE', 'NORTH', 'NOTCH',
  'NOVEL', 'NURSE', 'OCEAN', 'OFFER', 'OFTEN', 'OLIVE', 'ONION', 'OPERA', 'ORBIT', 'ORDER', 'OTHER', 'OUGHT',
  'OUTER', 'OWNER', 'OXIDE', 'PAINT', 'PANEL', 'PAPER', 'PARTY', 'PASTA', 'PATCH', 'PAUSE', 'PEACE', 'PEACH',
  'PEARL', 'PENNY', 'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PIZZA', 'PLACE', 'PLAIN',
  'PLANE', 'PLANT', 'PLATE', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIZE',
  'PROOF', 'PROUD', 'PROVE', 'PUPIL', 'QUEEN', 'QUICK', 'QUIET', 'QUILT', 'QUITE', 'RADIO', 'RAISE', 'RANCH',
  'RANGE', 'RAPID', 'RATIO', 'REACH', 'READY', 'REALM', 'REBEL', 'REFER', 'RELAX', 'RENEW', 'REPLY', 'RIDER',
  'RIDGE', 'RIGHT', 'RIVAL', 'RIVER', 'ROBIN', 'ROBOT', 'ROCKY', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RULER',
  'RURAL', 'SADLY', 'SAINT', 'SALAD', 'SALON', 'SAUCE', 'SCALE', 'SCENE', 'SCENT', 'SCOPE', 'SCORE', 'SCOUT',
  'SCRAP', 'SCREW', 'SENSE', 'SERVE', 'SETUP', 'SEVEN', 'SHADE', 'SHAKE', 'SHALL', 'SHAME', 'SHAPE', 'SHARE',
  'SHARP', 'SHEEP', 'SHEER', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORE',
  'SHORT', 'SHOUT', 'SHOWN', 'SIGHT', 'SILLY', 'SINCE', 'SIXTH', 'SIXTY', 'SKILL', 'SKIRT', 'SLEEP', 'SLICE',
  'SLIDE', 'SLOPE', 'SMALL', 'SMART', 'SMELL', 'SMILE', 'SMOKE', 'SNAKE', 'SOLAR', 'SOLID', 'SOLVE', 'SORRY',
  'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPARK', 'SPEAK', 'SPEED', 'SPELL', 'SPEND', 'SPICE', 'SPILL', 'SPINE',
  'SPITE', 'SPLIT', 'SPOKE', 'SPOON', 'SPORT', 'SPRAY', 'SQUAD', 'STAFF', 'STAGE', 'STAIR', 'STAKE', 'STAMP',
  'STAND', 'STARE', 'START', 'STATE', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STICK', 'STIFF', 'STILL', 'STOCK',
  'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE',
  'SUNNY', 'SUPER', 'SWEET', 'SWIFT', 'SWING', 'SWORD', 'TABLE', 'TAKEN', 'TASTE', 'TEACH', 'TEETH', 'THANK',
  'THEME', 'THERE', 'THESE', 'THICK', 'THIEF', 'THING', 'THINK', 'THIRD', 'THORN', 'THOSE', 'THREE', 'THREW',
  'THROW', 'THUMB', 'TIGER', 'TIGHT', 'TIMER', 'TIRED', 'TITLE', 'TODAY', 'TOKEN', 'TOOTH', 'TOPIC', 'TOTAL',
  'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIL', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK',
  'TROOP', 'TRUCK', 'TRULY', 'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'TWIST', 'UNCLE', 'UNDER', 'UNION', 'UNITE',
  'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT',
  'VITAL', 'VIVID', 'VOCAL', 'VOICE', 'VOWEL', 'WAGON', 'WASTE', 'WATCH', 'WATER', 'WEARY', 'WEAVE', 'WHEAT',
  'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WIDEN', 'WIDTH', 'WINDOW', 'WINTER', 'WISDOM',
  'WITCH', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORTH', 'WOULD', 'WOUND', 'WRIST', 'WRITE', 'WRONG',
  'YACHT', 'YEARN', 'YEAST', 'YIELD', 'YOUNG', 'YOUTH', 'ZEBRA',
  // 6 & 7-letter hits
  'ACTION', 'ADVICE', 'AFRAID', 'ALMOST', 'ALWAYS', 'ANIMAL', 'ANSWER', 'ANYONE', 'APPEAR', 'AROUND', 'ARRIVE',
  'ARTIST', 'ATTACK', 'AUTHOR', 'AVENUE', 'BASKET', 'BATTLE', 'BEAUTY', 'BECOME', 'BEFORE', 'BEHIND', 'BELIEF',
  'BELONG', 'BEYOND', 'BISHOP', 'BORDER', 'BOTTLE', 'BOTTOM', 'BRANCH', 'BREATH', 'BRIDGE', 'BRIGHT', 'BROKEN',
  'BUDGET', 'BURDEN', 'BUREAU', 'BUTTER', 'CAMERA', 'CANCER', 'CANDLE', 'CANNOT', 'CARBON', 'CAREER', 'CARPET',
  'CASTLE', 'CASUAL', 'CAUGHT', 'CENTER', 'CHANCE', 'CHANGE', 'CHARGE', 'CHOICE', 'CHURCH', 'CIRCLE', 'CLIENT',
  'CLIMATE', 'CLOSED', 'CLOTHES', 'COFFEE', 'COLUMN', 'COMMON', 'CORNER', 'COTTON', 'COUNTY', 'COUPLE', 'COURSE',
  'COUSIN', 'CREDIT', 'DAMAGE', 'DANGER', 'DEGREE', 'DESIGN', 'DESIRE', 'DETAIL', 'DEVICE', 'DINNER', 'DIRECT',
  'DOCTOR', 'DOLLAR', 'DOMAIN', 'DOUBLE', 'DRIVEN', 'DRIVER', 'DURING', 'EASILY', 'EFFECT', 'EFFORT', 'EITHER',
  'ENERGY', 'ENGINE', 'ENOUGH', 'ESCAPE', 'ESTATE', 'EXCEPT', 'EXCUSE', 'EXPECT', 'EXPERT', 'FACTOR', 'FAMILY',
  'FAMOUS', 'FARMER', 'FATHER', 'FELLOW', 'FEMALE', 'FINGER', 'FINISH', 'FLIGHT', 'FLOWER', 'FLYING', 'FOREST',
  'FORGET', 'FORMER', 'FORTUNE', 'FORWARD', 'FOSTER', 'FOURTH', 'FRIEND', 'FUTURE', 'GARDEN', 'GATHER', 'GENTLE',
  'GLOBAL', 'GOLDEN', 'GROUND', 'GROWTH', 'GUILTY', 'HANDLE', 'HAPPEN', 'HARDLY', 'HEALTH', 'HEIGHT', 'HIDDEN',
  'HOLDER', 'HONEST', 'HUNGRY', 'HUNTER', 'IMPACT', 'IMPORT', 'INCOME', 'INCREASE', 'INDEED', 'INSIDE', 'INTEND',
  'ISLAND', 'JACKET', 'JUNIOR', 'KILLED', 'KILLER', 'LADDER', 'LAPTOP', 'LATTER', 'LAWYER', 'LEADER', 'LEAGUE',
  'LENGTH', 'LESSON', 'LETTER', 'LIGHTS', 'LIKELY', 'LISTEN', 'LITTLE', 'LIVING', 'LONELY', 'LOVELY', 'LUXURY',
  'MAINLY', 'MAKING', 'MANAGE', 'MANNER', 'MANUAL', 'MARGIN', 'MARKET', 'MASTER', 'MATTER', 'MEDIUM', 'MEMBER',
  'MEMORY', 'MENTAL', 'MERELY', 'METHOD', 'MIDDLE', 'MINUTE', 'MIRROR', 'MOBILE', 'MODERN', 'MODEST', 'MOMENT',
  'MONKEY', 'MOTHER', 'MOTION', 'MUSEUM', 'MUTUAL', 'MYSELF', 'NATION', 'NATIVE', 'NATURE', 'NEARBY', 'NEEDLE',
  'NOBODY', 'NORMAL', 'NOTICE', 'NUMBER', 'OBJECT', 'OFFICE', 'ONLINE', 'ORANGE', 'PALACE', 'PARENT', 'PARKER',
  'PATENT', 'PEOPLE', 'PEPPER', 'PERIOD', 'PERMIT', 'PERSON', 'PHRASE', 'PLANET', 'PLAYER', 'PLENTY', 'POCKET',
  'POETRY', 'POLICE', 'POLICY', 'POSTER', 'POTATO', 'POWDER', 'PRETTY', 'PRINCE', 'PRISON', 'PROFIT', 'PROPER',
  'PROVE', 'PUBLIC', 'PUPPY', 'PURSUE', 'RABBIT', 'RANDOM', 'RARELY', 'RATHER', 'REASON', 'RECORD', 'REDUCE',
  'REFORM', 'REFUSE', 'REGARD', 'REGION', 'RELATE', 'RELIEF', 'REMAIN', 'REMOTE', 'REMOVE', 'REPEAT', 'REPORT',
  'RESCUE', 'RESIGN', 'RESORT', 'RESULT', 'RETAIL', 'RETIRE', 'RETURN', 'REVEAL', 'REVIEW', 'REWARD', 'RIDING',
  'RISING', 'ROCKET', 'ROLLER', 'RUBBER', 'RUNNER', 'SAFETY', 'SALARY', 'SAMPLE', 'SAVING', 'SCHEME', 'SCHOOL',
  'SCREEN', 'SCRIP', 'SEARCH', 'SEASON', 'SECRET', 'SECTOR', 'SECURE', 'SEEKER', 'SELDOM', 'SELECT', 'SELLER',
  'SENIOR', 'SERIES', 'SETTLE', 'SEVERE', 'SHADOW', 'SHIELD', 'SIGNAL', 'SILENT', 'SILVER', 'SIMPLE', 'SISTER',
  'SKETCH', 'SLIGHT', 'SMOOTH', 'SOCIAL', 'SOCKET', 'SOFTLY', 'SOURCE', 'SPEECH', 'SPIRIT', 'SPREAD', 'SPRING',
  'SQUARE', 'STABLE', 'STATUS', 'STEADY', 'STOLEN', 'STREET', 'STRIKE', 'STRING', 'STROKE', 'STRONG', 'STUDIO',
  'SUBMIT', 'SUDDEN', 'SUMMER', 'SUMMIT', 'SUPPER', 'SUPPLY', 'SURELY', 'SURVEY', 'SWITCH', 'SYMBOL', 'SYSTEM',
  'TACKLE', 'TALENT', 'TARGET', 'TARIFF', 'TAXPAY', 'TEMPLE', 'TENNIS', 'THANKS', 'THEORY', 'THIRTY', 'THREAT',
  'TICKET', 'TIMBER', 'TIMELY', 'TISSUE', 'TONGUE', 'TOWARD', 'TRAVEL', 'TREATY', 'TUNNEL', 'TWELVE', 'TWENTY',
  'UNABLE', 'UNIQUE', 'UNITED', 'UNLESS', 'UNLIKE', 'UPDATE', 'USEFUL', 'VALLEY', 'VARIED', 'VICTOR', 'VIOLIN',
  'VISION', 'VISUAL', 'VOLUME', 'WALKER', 'WALLET', 'WARMER', 'WEAPON', 'WEEKLY', 'WEIGHT', 'WINDOW', 'WINNER',
  'WINTER', 'WISDOM', 'WONDER', 'WORKER', 'WORTHY', 'WRITER', 'YELLOW'
];

// SCR_DICT is powered by the newest Merriam-Webster Official WordPlay Players Dictionary (83,760+ allowable words)
const SCR_DICT: Set<string> = (SCRABBLE_WEBSTER_SET && SCRABBLE_WEBSTER_SET.size > 0)
  ? SCRABBLE_WEBSTER_SET
  : new Set([...SCR_2LETTER_WORDS, ...SCR_COMMON_WORDS]);

// Official WordPlay Premium Squares on 15x15 board
const SCRABBLE_PREM_15: Record<string, string> = {
  // Triple Word (TW) - 8 squares (Crimson Red)
  '0,0': 'TW', '7,0': 'TW', '14,0': 'TW',
  '0,7': 'TW',               '14,7': 'TW',
  '0,14': 'TW', '7,14': 'TW', '14,14': 'TW',

  // Double Word (DW) - 17 squares (Coral Pink, including 7,7 Center Star)
  '1,1': 'DW', '2,2': 'DW', '3,3': 'DW', '4,4': 'DW',
  '1,13': 'DW', '2,12': 'DW', '3,11': 'DW', '4,10': 'DW',
  '13,1': 'DW', '12,2': 'DW', '11,3': 'DW', '10,4': 'DW',
  '13,13': 'DW', '12,12': 'DW', '11,11': 'DW', '10,10': 'DW',
  '7,7': 'DW', // Center Star ★ functions as Double Word

  // Triple Letter (TL) - 12 squares (Cobalt Deep Blue)
  '5,1': 'TL', '9,1': 'TL',
  '1,5': 'TL', '5,5': 'TL', '9,5': 'TL', '13,5': 'TL',
  '1,9': 'TL', '5,9': 'TL', '9,9': 'TL', '13,9': 'TL',
  '5,13': 'TL', '9,13': 'TL',

  // Double Letter (DL) - 24 squares (Sky Blue)
  '3,0': 'DL', '11,0': 'DL',
  '6,2': 'DL', '8,2': 'DL',
  '0,3': 'DL', '7,3': 'DL', '14,3': 'DL',
  '2,6': 'DL', '6,6': 'DL', '8,6': 'DL', '12,6': 'DL',
  '3,7': 'DL', '11,7': 'DL',
  '2,8': 'DL', '6,8': 'DL', '8,8': 'DL', '12,8': 'DL',
  '0,11': 'DL', '7,11': 'DL', '14,11': 'DL',
  '6,12': 'DL', '8,12': 'DL',
  '3,14': 'DL', '11,14': 'DL'
};

/* ================= TOP 10 WORDPLAY CHAMPIONS (BOT LEVELS 1 - 10) ================= */

interface ScrabbleChampion {
  level: number;
  name: string;
  shortName: string;
  gridName: string;
  title: string;
  country: string;
  flag: string;
  rating: number;
  desc: string;
  style: string;
}

const SCRABBLE_CHAMPIONS: ScrabbleChampion[] = [
  {
    level: 1,
    name: 'Peter Morris',
    shortName: 'P. Morris',
    gridName: 'Morris',
    title: '1991 World Champion',
    country: 'USA / Canada',
    flag: '🇺🇸',
    rating: 1550,
    desc: 'Winner of the historic inaugural 1991 World Championship in London.',
    style: 'Beginner-friendly · Plays common 3–5 letter words'
  },
  {
    level: 2,
    name: 'Mark Nyman',
    shortName: 'M. Nyman',
    gridName: 'Nyman',
    title: '1993 World Champion',
    country: 'United Kingdom',
    flag: '🇬🇧',
    rating: 1650,
    desc: 'First British World Champion and 4-time National Champion.',
    style: 'Steady tactical play · Solid fundamentals'
  },
  {
    level: 3,
    name: 'Brian Cappelletto',
    shortName: 'B. Cappelletto',
    gridName: 'Brian C.',
    title: '2001 World Champion',
    country: 'USA',
    flag: '🇺🇸',
    rating: 1750,
    desc: 'Famous for lightning calculations and legendary Chicago Open masteries.',
    style: 'Board control & Double Letter focus'
  },
  {
    level: 4,
    name: 'Wellington Jighere',
    shortName: 'W. Jighere',
    gridName: 'Jighere',
    title: '2015 World Champion',
    country: 'Nigeria',
    flag: '🇳🇬',
    rating: 1850,
    desc: 'First African World Champion and 2-time African Champion.',
    style: 'Defensive blocking · Hooks & 4–6 letter combos'
  },
  {
    level: 5,
    name: 'Craig Beevers',
    shortName: 'C. Beevers',
    gridName: 'Beevers',
    title: '2014 World Champion',
    country: 'United Kingdom',
    flag: '🇬🇧',
    rating: 1950,
    desc: 'Author of "Word Freak" tactics, master of defensive board-locking.',
    style: 'Aggressive board control & 4–6 letter combinations'
  },
  {
    level: 6,
    name: 'Panupol Sujjaboriboon',
    shortName: 'P. Sujjaboriboon',
    gridName: 'Panupol',
    title: 'King\'s Cup & World Finalist',
    country: 'Thailand',
    flag: '🇹🇭',
    rating: 2020,
    desc: 'Thai word prodigy who won the King\'s Cup at age 16 and reached 2 World Finals.',
    style: 'Rapid anagramming & Triple Letter bonuses'
  },
  {
    level: 7,
    name: 'Adam Logan',
    shortName: 'A. Logan',
    gridName: 'Logan',
    title: '2005 World Champion',
    country: 'Canada',
    flag: '🇨🇦',
    rating: 2080,
    desc: 'Math professor, 5-time North American Champion and word authority.',
    style: 'Rack balancing & high-probability stems'
  },
  {
    level: 8,
    name: 'Joel Wapnick',
    shortName: 'J. Wapnick',
    gridName: 'Wapnick',
    title: '1999 World Champion',
    country: 'Canada',
    flag: '🇨🇦',
    rating: 2140,
    desc: 'Author of "The Board Man", 20+ major international titles.',
    style: 'High-value hooks · Aggressive Double Word targeting'
  },
  {
    level: 9,
    name: 'Pakorn Nemitrmansuk',
    shortName: 'P. Nemitrmansuk',
    gridName: 'Pakorn',
    title: '2009 World Champion',
    country: 'Thailand',
    flag: '🇹🇭',
    rating: 2200,
    desc: 'Renowned Bangkok architect and 4-time World Championship Finalist.',
    style: 'Complex cross-words · Triple Word lane attacks'
  },
  {
    level: 10,
    name: 'Nigel Richards',
    shortName: 'N. Richards',
    gridName: 'Richards',
    title: '5x World Champion (GOAT)',
    country: 'New Zealand',
    flag: '🇳🇿',
    rating: 2300,
    desc: 'The undisputed Greatest of All Time. 5-time World Champion, also won French & Spanish championships.',
    style: 'Ultimate Champion AI · 7-Tile Bingos & Maximum Scores'
  }
];

function getSelectedScrabbleChamp(): ScrabbleChampion {
  const savedLv = parseInt(localStorage.getItem('scrabble_bot_level') || '10');
  const found = SCRABBLE_CHAMPIONS.find(c => c.level === savedLv);
  return found || SCRABBLE_CHAMPIONS[9];
}

function showPictionaryWordsModal() {
  Sound.click();
  let activeLvl: number | 'all' | 'celebs' = 'all';
  let searchTerm = '';

  const buildHtml = () => {
    let filtered = PICTIONARY_WORDS;
    if (activeLvl === 'celebs') {
      filtered = filtered.filter(item => !!item.trait);
    } else if (activeLvl !== 'all') {
      filtered = filtered.filter(item => item.level === activeLvl);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.w.toLowerCase().includes(q) ||
        (item.trait && item.trait.toLowerCase().includes(q)) ||
        item.cat.toLowerCase().includes(q)
      );
    }

    return `
      <div style="max-height:85vh; display:flex; flex-direction:column; overflow:hidden; padding:2px;">
        <div class="row" style="justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid var(--line); padding-bottom:8px;">
          <div>
            <h2 style="margin:0; font-size:17px; display:flex; align-items:center; gap:6px;">
              🎨 Official Pictionary Catalog (1,000 Pictures)
            </h2>
            <div class="muted" style="font-size:11.5px;">20 progressive levels · 50 pictures per level · Celebrities &amp; traits included:</div>
          </div>
          <button class="iconbtn" id="closePicWordsModalBtn" style="padding:4px 8px; font-size:16px;" title="Close">✕</button>
        </div>

        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input id="picWordsSearchInput" value="${esc(searchTerm)}" placeholder="🔍 Search any word, celebrity, or clue (e.g. Einstein, fedora, pizza)..." style="flex:1; padding:7px 10px; font-size:13px; border-radius:6px; border:1px solid #0284c7; background:rgba(0,0,0,0.35); color:#fff;" autocomplete="off" />
        </div>

        <div style="display:flex; gap:5px; overflow-x:auto; padding-bottom:6px; margin-bottom:8px; flex-shrink:0;">
          <button class="btn small ${activeLvl === 'all' ? '' : 'secondary'}" data-lvl-filter="all" style="font-size:11px; padding:3px 9px; white-space:nowrap; border-radius:999px;">
            All (1,000)
          </button>
          <button class="btn small ${activeLvl === 'celebs' ? '' : 'secondary'}" data-lvl-filter="celebs" style="font-size:11px; padding:3px 9px; white-space:nowrap; border-radius:999px; border-color:#f59e0b; color:#fde68a;">
            ⭐ All Celebrities (${PICTIONARY_WORDS.filter(w => !!w.trait).length})
          </button>
          ${PICTIONARY_LEVELS.map(l => {
            const isAct = activeLvl === l.level;
            return `<button class="btn small ${isAct ? '' : 'secondary'}" data-lvl-filter="${l.level}" style="font-size:11px; padding:3px 8px; white-space:nowrap; border-radius:999px;">${l.icon} Lv.${l.level} ${esc(l.title)} (50)</button>`;
          }).join('')}
        </div>

        <div class="muted" style="font-size:11.5px; margin-bottom:6px;">
          Showing <b>${filtered.length}</b> pictures:
        </div>

        <div style="flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:6px; padding-right:4px; max-height:50vh;">
          ${filtered.map(item => `
            <div style="background:rgba(255,255,255,0.05); border:1px solid ${item.trait ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.1)'}; border-radius:6px; padding:7px 9px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="font-weight:700; font-size:13px; color:#fff; word-break:break-word;">
                  ${item.trait ? '⭐ ' : ''}${esc(item.w)}
                </div>
                ${item.trait ? `<div style="font-size:10.5px; color:#fde047; margin-top:2px; font-weight:600;">✨ (${esc(item.trait)})</div>` : ''}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; margin-top:6px;">
                <span style="color:#7dd3fc; background:rgba(14,165,233,0.15); padding:1px 5px; border-radius:4px; font-size:10px;">${item.icon} Lv.${item.level}</span>
                <span style="color:#94a3b8; font-size:10px;">#${item.id}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  modal(buildHtml());

  const attachEvents = () => {
    const close = $('#closePicWordsModalBtn');
    if (close) close.onclick = () => { Sound.click(); closeModal(); };

    const searchIn = $('#picWordsSearchInput') as HTMLInputElement;
    if (searchIn) {
      searchIn.oninput = () => {
        searchTerm = searchIn.value;
        const card = $('#modalRoot .card');
        if (card) {
          card.innerHTML = buildHtml();
          attachEvents();
          const newIn = $('#picWordsSearchInput') as HTMLInputElement;
          if (newIn) {
            newIn.focus();
            newIn.setSelectionRange(searchTerm.length, searchTerm.length);
          }
        }
      };
    }

    const mRoot = $('#modalRoot');
    if (mRoot) {
      mRoot.querySelectorAll('[data-lvl-filter]').forEach((b: any) => {
        b.onclick = () => {
          Sound.click();
          const val = b.dataset.lvlFilter;
          activeLvl = val === 'all' ? 'all' : (val === 'celebs' ? 'celebs' : +val);
          const card = $('#modalRoot .card');
          if (card) {
            card.innerHTML = buildHtml();
            attachEvents();
          }
        };
      });
    }
  };

  attachEvents();
}

function showScrabbleChampionSelector(onSelect: (champ: ScrabbleChampion) => void) {
  Sound.click();
  const current = getSelectedScrabbleChamp();
  const content = `
    <div style="max-height:80vh; overflow-y:auto; padding:4px;">
      <div class="row" style="justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid var(--line); padding-bottom:8px;">
        <div>
          <h2 style="margin:0; font-size:18px;">🏆 WordPlay Champions (Levels 1 – 10)</h2>
          <div class="muted" style="font-size:12px;">Choose your opponent from history's 10 greatest World Champions:</div>
        </div>
        <button class="iconbtn" id="closeChampModalBtn" style="padding:4px 8px; font-size:16px;" title="Close">✕</button>
      </div>
      <div class="scrabble-champ-list">
        ${SCRABBLE_CHAMPIONS.map(c => `
          <div class="scrabble-champ-row ${c.level === current.level ? 'active' : ''}" data-champ-lv="${c.level}">
            <div class="scrabble-champ-level-badge ${c.level === 10 ? 'lv-goat' : ''}">
              <span class="lv-num">Lv.${c.level}</span>
              <span class="lv-lbl">${c.level === 10 ? 'GOAT' : 'BOT'}</span>
            </div>
            <div class="scrabble-champ-info">
              <div class="scrabble-champ-name">${c.flag} ${esc(c.name)} ${c.level === 10 ? '👑' : ''}</div>
              <div class="scrabble-champ-title">${esc(c.title)} · ${esc(c.country)}</div>
              <div class="scrabble-champ-desc">${esc(c.desc)}</div>
              <div class="scrabble-champ-style">🎯 ${esc(c.style)}</div>
            </div>
            <div class="scrabble-champ-rating-badge">
              <div class="scrabble-champ-rating-val">⭐ ${c.rating}</div>
              <button class="btn small ${c.level === current.level ? '' : 'secondary'}" style="margin-top:6px; font-size:11px; padding:3px 10px;">
                ${c.level === current.level ? 'Selected ✓' : 'Play'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  const m = modal(content);
  const close = $('#closeChampModalBtn');
  if (close) close.onclick = () => { Sound.click(); closeModal(); };

  m.querySelectorAll('.scrabble-champ-row[data-champ-lv]').forEach((el: any) => {
    el.onclick = () => {
      Sound.click();
      const lv = +el.dataset.champLv;
      const champ = SCRABBLE_CHAMPIONS.find(c => c.level === lv) || SCRABBLE_CHAMPIONS[9];
      localStorage.setItem('scrabble_bot_level', String(champ.level));
      closeModal();
      onSelect(champ);
    };
  });
}

stdInit('scrabble', {
  name: 'WordPlay',
  icon: '🔤',
  desc: 'Classic Word Showdown',
  p: [2, 2],
  payout: PAYOUTS.scrabble,
  rules: 'Official 15×15 WordPlay. Tap any square to place your anchor cursor, select direction (↔ Across or ↕ Down), then tap your wooden rack tiles to lay them onto the board. Tiles must connect with existing board letters (first word must cover the ★ center square). Multipliers apply to newly placed tiles: DL (2× letter), TL (3× letter), DW (2× word), TW (3× word). 7 tiles at once awards the +50 Bingo bonus!',
  N: 15,
  DIST: {
    A: [9, 1], B: [2, 3], C: [2, 3], D: [4, 2], E: [12, 1], F: [2, 4],
    G: [3, 2], H: [2, 4], I: [9, 1], J: [1, 8], K: [1, 5], L: [4, 1],
    M: [2, 3], N: [6, 1], O: [8, 1], P: [2, 3], Q: [1, 10], R: [6, 1],
    S: [4, 1], T: [6, 1], U: [4, 1], V: [2, 4], W: [2, 4], X: [1, 8],
    Y: [2, 4], Z: [1, 10]
  } as Record<string, [number, number]>,
  PREM: SCRABBLE_PREM_15,

  newState(C: any) {
    const bag: string[] = [];
    for (const L in this.DIST) {
      for (let i = 0; i < this.DIST[L][0]; i++) bag.push(L);
    }
    shuffle(bag);
    const board = Array.from({ length: 15 }, () => Array(15).fill(null));
    return { turn: 0, board, bag, scores: C.names.map(() => 0), passes: 0, over: false, first: true };
  },

  drawTiles(S: any, n: number) {
    const t: string[] = [];
    while (n-- > 0 && S.bag.length) t.push(S.bag.pop());
    return t;
  },

  dealPriv(C: any) {
    const S = C.S;
    if (C.isNet) {
      C.priv = { rack: [] };
      if (Net.isHost()) {
        const racks = C.names.map(() => this.drawTiles(S, 7));
        C.priv.rack = racks[Net.mySeat()];
        racks.forEach((r: string[], i: number) => {
          if (i !== Net.mySeat()) Net.inboxSend({ to: i, type: 'rack', tiles: r });
        });
        Net.push({ state: S, turn: S.turn, status: 'playing' });
      }
    } else {
      C.priv = { rack: [this.drawTiles(S, 7), this.drawTiles(S, 7)] };
    }
    C.myRack = (ctx?: any) => this.myRack(ctx || C);
  },

  myRack(C: any) {
    if (!C.priv || !C.priv.rack) this.dealPriv(C);
    if (C.isNet) return C.priv.rack || [];
    const idx = typeof C.cur === 'function' ? C.cur() : 0;
    if (!Array.isArray(C.priv.rack)) C.priv.rack = [[], []];
    if (!C.priv.rack[idx]) C.priv.rack[idx] = [];
    return C.priv.rack[idx];
  },

  refill(C: any, rack: string[]) {
    const S = C.S;
    const need = 7 - rack.length;
    const t = this.drawTiles(S, need);
    rack.push(...t);
  },

  validate(S: any, place: any) {
    const g = this, N = g.N;
    const seq: Array<{ x: number; y: number; ch: string; rackIdx: number }> = place.seq || [];
    if (!seq.length) return { ok: false, reason: 'Place at least one tile from your rack' };

    // Map newly placed tiles by coordinate
    const placedMap = new Map<string, string>();
    for (const t of seq) {
      if (t.x < 0 || t.x >= N || t.y < 0 || t.y >= N) {
        return { ok: false, reason: 'Tile is outside board boundaries' };
      }
      const key = t.x + ',' + t.y;
      if (placedMap.has(key)) {
        return { ok: false, reason: 'Cannot place multiple tiles on the same square' };
      }
      if (S.board[t.y][t.x]) {
        return { ok: false, reason: 'Square is already occupied on the board' };
      }
      placedMap.set(key, t.ch);
    }

    // Helper to query tile at (x, y): placed tile or permanent board tile
    const getTile = (x: number, y: number): { ch: string; isNew: boolean; prem?: string } | null => {
      if (x < 0 || x >= N || y < 0 || y >= N) return null;
      const key = x + ',' + y;
      if (placedMap.has(key)) {
        return { ch: placedMap.get(key)!, isNew: true, prem: g.PREM[key] };
      }
      if (S.board[y][x]) {
        return { ch: S.board[y][x], isNew: false };
      }
      return null;
    };

    // Placed tiles must lie in a single straight line (all in same row or column)
    const xs = seq.map(t => t.x);
    const ys = seq.map(t => t.y);
    const sameRow = ys.every(y => y === ys[0]);
    const sameCol = xs.every(x => x === xs[0]);

    if (!sameRow && !sameCol) {
      return { ok: false, reason: 'Placed tiles must be in a single straight line (all in the same row or column)' };
    }

    // Determine primary alignment
    let primaryDir: 'H' | 'V' = 'H';
    if (seq.length > 1) {
      primaryDir = sameRow ? 'H' : 'V';
    } else {
      // Single tile: check which direction connects with adjacent tiles
      const t = seq[0];
      const hasH = getTile(t.x - 1, t.y) || getTile(t.x + 1, t.y);
      const hasV = getTile(t.x, t.y - 1) || getTile(t.x, t.y + 1);
      if (hasV && !hasH) primaryDir = 'V';
      else primaryDir = 'H';
    }

    // Ensure no empty gaps exist between the outermost placed tiles along the primary line
    if (primaryDir === 'H') {
      const row = ys[0];
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      for (let curX = minX; curX <= maxX; curX++) {
        if (!getTile(curX, row)) {
          return { ok: false, reason: 'Placed tiles cannot have empty spaces between them' };
        }
      }
    } else {
      const col = xs[0];
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      for (let curY = minY; curY <= maxY; curY++) {
        if (!getTile(col, curY)) {
          return { ok: false, reason: 'Placed tiles cannot have empty spaces between them' };
        }
      }
    }

    // Helper to extract full contiguous word in given direction containing (startX, startY)
    const extractWord = (startX: number, startY: number, dir: 'H' | 'V') => {
      const dx = dir === 'H' ? 1 : 0;
      const dy = dir === 'V' ? 1 : 0;
      let x = startX, y = startY;
      while (getTile(x - dx, y - dy)) {
        x -= dx;
        y -= dy;
      }
      const cells: Array<{ x: number; y: number; ch: string; isNew: boolean; prem?: string }> = [];
      while (true) {
        const t = getTile(x, y);
        if (!t) break;
        cells.push({ x, y, ...t });
        x += dx;
        y += dy;
      }
      return { w: cells.map(c => c.ch).join(''), cells };
    };

    const wordsFormed: Array<{ w: string; cells: Array<{ x: number; y: number; ch: string; isNew: boolean; prem?: string }> }> = [];

    // Extract primary contiguous word
    const primaryWord = extractWord(seq[0].x, seq[0].y, primaryDir);
    if (primaryWord.cells.length > 1) {
      wordsFormed.push(primaryWord);
    }

    // Extract cross-words in the perpendicular direction
    if (seq.length === 1) {
      const perpDir = primaryDir === 'H' ? 'V' : 'H';
      const perpWord = extractWord(seq[0].x, seq[0].y, perpDir);
      if (perpWord.cells.length > 1) {
        wordsFormed.push(perpWord);
      }
    } else {
      const perpDir = primaryDir === 'H' ? 'V' : 'H';
      for (const t of seq) {
        const crossWord = extractWord(t.x, t.y, perpDir);
        if (crossWord.cells.length > 1) {
          wordsFormed.push(crossWord);
        }
      }
    }

    if (!wordsFormed.length) {
      return { ok: false, reason: 'Word is too short (must connect to form a word of at least 2 letters)' };
    }

    // First turn rule: must cover center star (7, 7)
    if (S.first) {
      const coversCenter = seq.some(t => t.x === 7 && t.y === 7);
      if (!coversCenter) {
        return { ok: false, reason: 'Opening word must cover the ★ Center Star (H8 / 7,7)' };
      }
    } else {
      // Subsequent turns: must connect to existing tiles on the board
      const touchesExisting = wordsFormed.some(wf => wf.cells.some(c => !c.isNew)) ||
        seq.some(t => {
          for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = t.x + ddx, ny = t.y + ddy;
            if (nx >= 0 && ny >= 0 && nx < N && ny < N && S.board[ny][nx]) return true;
          }
          return false;
        });

      if (!touchesExisting) {
        return { ok: false, reason: 'Word must connect with existing tiles on the board' };
      }
    }

    // Validate all formed words against the Merriam-Webster Official WordPlay Dictionary
    for (const item of wordsFormed) {
      if (!SCR_DICT.has(item.w)) {
        return { ok: false, reason: '"' + item.w + '" is not recognized in the Webster WordPlay dictionary' };
      }
    }

    // Calculate WordPlay point scoring matching the squares
    const lv = (ch: string) => g.DIST[ch] ? g.DIST[ch][1] : 1;
    let totalScore = 0;
    const wordBreakdowns: string[] = [];

    for (const { w: wdStr, cells: wd } of wordsFormed) {
      let ws = 0, wm = 1;
      for (const c of wd) {
        let v = lv(c.ch);
        if (c.isNew) {
          if (c.prem === 'DL') v *= 2;
          else if (c.prem === 'TL') v *= 3;
          if (c.prem === 'DW') wm *= 2;
          else if (c.prem === 'TW') wm *= 3;
        }
        ws += v;
      }
      const wordScore = ws * wm;
      totalScore += wordScore;
      let bd = `<b>${wdStr}</b>: ${ws} pts`;
      if (wm > 1) {
        bd += ` × ${wm} (${wm === 2 ? 'Double Word' : wm === 3 ? 'Triple Word' : wm + '× Word'}) = <b>${wordScore} pts</b>`;
      }
      wordBreakdowns.push(bd);
    }

    let bingo = false;
    if (seq.length === 7) {
      totalScore += 50;
      bingo = true;
      wordBreakdowns.push('🌟 <b>7-Tile Bingo Bonus</b>: +50 pts!');
    }

    return {
      ok: true,
      score: totalScore,
      words: wordsFormed.map(w => w.w),
      tiles: seq,
      breakdown: wordBreakdowns,
      bingo,
      dir: primaryDir
    };
  },

  render(R: HTMLElement, C: any) {
    const S = C.S, g = this, N = g.N;
    C.myRack = (ctx?: any) => g.myRack(ctx || C);
    if (!C.priv) this.dealPriv(C);

    if (C.isNet && !C.priv.rack.length) {
      R.innerHTML = turnBanner(C) + '<div class="card center"><h2>🔤 WordPlay</h2><div class="muted">Waiting for tiles from host…</div></div>';
      return;
    }

    if (!C.place) C.place = { ax: -1, ay: -1, dir: 'H', seq: [], selRack: -1 };
    const P = C.place;
    if (P.selRack === undefined) P.selRack = -1;

    const champ = C.champ || getSelectedScrabbleChamp();
    if (!C.champ && C.mode === 'pvc') {
      C.champ = champ;
      C.botLevel = champ.level;
    }

    let h = turnBanner(C) + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">';
    h += '  <div>';
    h += '    <h2 style="margin:0;display:inline-flex;align-items:center;gap:6px;">🔤 Official WordPlay</h2>';
    h += '    <span style="display:inline-block; margin-left:8px; font-size:11px; padding:2px 8px; border-radius:999px; background:rgba(34,197,94,0.15); border:1px solid #22c55e; color:#86efac; font-weight:600;" title="' + WEBSTER_EDITION_INFO.notes + '">';
    h += '      📖 ' + WEBSTER_EDITION_INFO.version + ' (' + WEBSTER_EDITION_INFO.wordCount.toLocaleString() + ' Official Words)';
    h += '    </span>';
    h += '  </div>';
    h += '  <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:14px;">';
    S.scores.forEach((s: number, i: number) => {
      const isCur = S.turn === i;
      h += '<span style="padding:3px 8px; border-radius:6px; background:' + (isCur ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)') + '; border:1px solid ' + (isCur ? '#eab308' : '#333') + ';">';
      h += esc(C.seatName(i)) + ': <b style="color:' + (isCur ? '#facc15' : '#fff') + ';">' + s + '</b> pts</span>';
    });
    h += '  <button class="btn small secondary" id="websterLookupBtn" style="font-size:11px;padding:3px 8px;" title="Verify words against the newest Webster Dictionary">🔍 Check Word</button>';
    h += '  </div>';
    h += '</div>';

    // Map current pending tiles to coordinate keys
    const seqPos: Record<string, { ch: string; rackIdx: number; seqIdx: number }> = {};
    P.seq.forEach((t: any, idx: number) => {
      seqPos[t.x + ',' + t.y] = { ch: t.ch, rackIdx: t.rackIdx, seqIdx: idx };
    });

    // Check validity and live score calculation if tiles have been placed
    let liveVal: any = null;
    if (P.seq.length > 0) {
      liveVal = g.validate(S, P);
      if (liveVal && liveVal.ok && liveVal.dir) {
        P.dir = liveVal.dir;
      }
    }

    // Coordinates letters A-O and numbers 1-15
    const COORD_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

    // Official WordPlay Board Layout
    h += '<div class="scrabble-outer-wrap">';
    h += '  <div class="scrabble-board-frame">';

    // Top coordinate row
    h += '    <div class="scrabble-board-coord-row">';
    h += '      <span></span>';
    for (let c = 0; c < 15; c++) h += '<span>' + COORD_LETTERS[c] + '</span>';
    h += '      <span></span>';
    h += '    </div>';

    // Grid row wrap with left & right numbers
    h += '    <div class="scrabble-board-row-wrap">';
    h += '      <div class="scrabble-board-coord-col">';
    for (let r = 1; r <= 15; r++) h += '<span>' + r + '</span>';
    h += '      </div>';

    // 15x15 Board Grid
    h += '      <div class="scrabble-grid-container" id="scrabbleGrid">';
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const b = S.board[y][x];
        const scInfo = seqPos[x + ',' + y];
        const sc = scInfo ? scInfo.ch : null;
        const prem = g.PREM[x + ',' + y];
        const isAnchor = P.ax === x && P.ay === y;
        const isCenter = x === 7 && y === 7;

        // Determine square styling class matching official WordPlay board
        let sqClass = 'scrabble-square';
        if (isCenter) sqClass += ' sq-center';
        else if (prem === 'TW') sqClass += ' sq-tw';
        else if (prem === 'DW') sqClass += ' sq-dw';
        else if (prem === 'TL') sqClass += ' sq-tl';
        else if (prem === 'DL') sqClass += ' sq-dl';
        else sqClass += ' sq-norm';

        if (isAnchor) sqClass += ' is-anchor';

        h += '<div class="' + sqClass + '" data-x="' + x + '" data-y="' + y + '">';

        if (b || sc) {
          // Render authentic wooden tile fitting squarely into the cell
          const tileChar = b || sc;
          const tileScore = g.DIST[tileChar] ? g.DIST[tileChar][1] : 1;
          const isPending = !!sc;
          h += '<div class="scrabble-wood-tile' + (isPending ? ' tile-pending' : '') + '" data-pending-x="' + x + '" data-pending-y="' + y + '" title="' + tileChar + ' (' + tileScore + ' pts)' + (isPending ? ' · Tap to recall' : '') + '">';
          h += '  <span class="tile-letter">' + tileChar + '</span>';
          h += '  <span class="tile-subscript">' + tileScore + '</span>';
          h += '</div>';
        } else {
          // Render official square label
          if (isCenter) {
            h += '<div class="scrabble-star-icon">★</div>';
            h += '<div class="scrabble-square-label" style="font-size:clamp(5px,1vw,6.5px);">DOUBLE<br>WORD</div>';
          } else if (prem === 'TW') {
            h += '<div class="scrabble-square-label">TRIPLE<br>WORD<br>SCORE</div>';
          } else if (prem === 'DW') {
            h += '<div class="scrabble-square-label">DOUBLE<br>WORD<br>SCORE</div>';
          } else if (prem === 'TL') {
            h += '<div class="scrabble-square-label">TRIPLE<br>LETTER<br>SCORE</div>';
          } else if (prem === 'DL') {
            h += '<div class="scrabble-square-label">DOUBLE<br>LETTER<br>SCORE</div>';
          }
        }

        h += '</div>';
      }
    }
    h += '      </div>'; // End scrabble-grid-container

    // Right coordinate col
    h += '      <div class="scrabble-board-coord-col">';
    for (let r = 1; r <= 15; r++) h += '<span>' + r + '</span>';
    h += '      </div>';
    h += '    </div>'; // End scrabble-board-row-wrap

    // Bottom coordinate row
    h += '    <div class="scrabble-board-coord-row">';
    h += '      <span></span>';
    for (let c = 0; c < 15; c++) h += '<span>' + COORD_LETTERS[c] + '</span>';
    h += '      <span></span>';
    h += '    </div>';
    h += '  </div>'; // End scrabble-board-frame
    h += '</div>'; // End scrabble-outer-wrap

    // Controls & Rack Area
    if (C.mine() && !S.over) {
      // Live Score Breakdown Bar
      if (P.seq.length > 0 && liveVal) {
        h += '<div class="scrabble-score-preview">';
        if (liveVal.ok) {
          h += '<div style="display:flex; justify-content:space-between; align-items:center;">';
          h += '  <span><b style="color:#22c55e;">✓ Valid Play:</b> <span style="font-size:16px;font-weight:900;color:#facc15;letter-spacing:1px;">"' + liveVal.words[0] + '"</span>';
          if (liveVal.words.length > 1) {
            h += ' <span class="muted" style="font-size:11px;">(+ cross-words: ' + liveVal.words.slice(1).map((w: string) => '"' + w + '"').join(', ') + ')</span>';
          }
          h += '  </span>';
          h += '  <span style="font-size:17px;font-weight:900;color:#fbbf24;">+' + liveVal.score + ' pts</span>';
          h += '</div>';
          h += '<div class="scrabble-score-breakdown">';
          liveVal.breakdown.forEach((bd: string) => {
            h += '<span style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;">' + bd + '</span>';
          });
          h += '</div>';
        } else {
          h += '<div style="color:#f87171;font-size:12px;font-weight:600;">⚠️ ' + liveVal.reason + '</div>';
        }
        h += '</div>';
      }

      // Toolbar: Direction, Undo, Recall All, Shuffle Rack
      h += '<div class="row" style="justify-content:center; gap:8px; margin:8px 0 4px 0;">';
      h += '  <button class="btn small secondary" id="dirBtn" title="Change spelling direction">Spelling: <b>' + (P.dir === 'H' ? '↔ Across' : '↕ Down') + '</b></button>';
      if (P.seq.length > 0) {
        h += '  <button class="btn small secondary" id="undoBtn" title="Take back last tile">⌫ Undo Tile</button>';
        h += '  <button class="btn small secondary" id="recallAllBtn" title="Recall all placed tiles to rack">↺ Recall All</button>';
      }
      h += '  <button class="btn small secondary" id="shuffleRackBtn" title="Rearrange tiles on rack">🔀 Shuffle</button>';
      h += '</div>';

      // Player's Wooden Tile Rack Tray
      const rack = g.myRack(C);
      h += '<div style="display:flex; justify-content:center; width:100%;">';
      h += '  <div class="scrabble-rack-tray">';
      rack.forEach((t: string, i: number) => {
        const pts = g.DIST[t] ? g.DIST[t][1] : 1;
        const isSel = P.selRack === i;
        h += '<div class="scrabble-rack-slot' + (isSel ? ' selected' : '') + '" data-rack-i="' + i + '" title="' + t + ' (' + pts + ' pts) - Tap to select/place">';
        h += '  <span class="tile-letter">' + t + '</span>';
        h += '  <span class="tile-subscript">' + pts + '</span>';
        h += '</div>';
      });
      h += '  </div>';
      h += '</div>';

      // Action row: Play Word, Exchange, Pass
      h += '<div class="row" style="margin-top:4px;">';
      const playDisabled = !liveVal || !liveVal.ok;
      h += '  <button class="btn grow' + (playDisabled ? ' secondary' : '') + '" id="playBtn"' + (playDisabled ? '' : ' style="background:linear-gradient(135deg,#059669,#047857);font-weight:800;"') + '>';
      h += '    ▶ Play Word' + (liveVal && liveVal.ok ? ' (+' + liveVal.score + ' pts)' : '');
      h += '  </button>';
      h += '  <button class="btn secondary" id="exBtn">🔄 Exchange</button>';
      h += '  <button class="btn secondary" id="passBtn">⏭ Pass</button>';
      h += '</div>';

      // Guide text
      h += '<div class="muted center" style="font-size:12px; margin-top:4px;">';
      if (P.selRack >= 0 && rack[P.selRack]) {
        h += '<span style="color:#facc15;font-weight:700;">Tile [' + rack[P.selRack] + '] selected:</span> Tap any empty square on the board to place it.';
      } else if (P.seq.length > 0) {
        h += 'Words connect automatically with existing board tiles. Tap "▶ Play Word" to score!';
      } else if (P.ax < 0) {
        h += 'Tap any square on the board to set your anchor, or tap a rack tile to select it.';
      } else {
        const coordName = COORD_LETTERS[P.ax] + (P.ay + 1);
        h += 'Anchor set at <b>' + coordName + '</b> (' + (P.dir === 'H' ? 'Across ➔' : 'Down ⬇') + '). Tap rack tiles to spell, or tap anchor again to toggle direction!';
      }
      h += '</div>';
    } else {
      h += '<div class="muted center" style="margin-top:12px;">Tiles left in bag: <b>' + S.bag.length + '</b></div>';
    }

    R.innerHTML = h;

    // Word Checker / Webster WordPlay Dictionary lookup tool
    const lookupBtn = $('#websterLookupBtn');
    if (lookupBtn) {
      lookupBtn.onclick = () => {
        const wordToCheck = prompt('Enter a word to check against the Official Merriam-Webster WordPlay Dictionary:') || '';
        const trimmed = wordToCheck.trim().toUpperCase();
        if (!trimmed) return;
        const valid = isWebsterScrabbleWord(trimmed);
        if (valid) {
          toast(`✅ "${trimmed}" is a VALID word in the Official Webster WordPlay Dictionary!`);
        } else {
          toast(`❌ "${trimmed}" is NOT in the Official Webster WordPlay Dictionary.`);
        }
      };
    }

    if (!C.mine() || S.over) return;

    // Board Square Selection / Anchor Setting / Direct Tile Placement
    R.querySelectorAll('.scrabble-square[data-x]').forEach((el: any) => {
      el.onclick = () => {
        const x = +el.dataset.x, y = +el.dataset.y;
        if (S.board[y][x]) return; // Cannot place on permanent tile

        // If clicking a square with a pending tile, recall it to rack
        const pending = seqPos[x + ',' + y];
        if (pending) {
          const removed = P.seq.splice(pending.seqIdx, 1)[0];
          if (removed) {
            g.myRack(C).splice(removed.rackIdx, 0, removed.ch);
            P.selRack = -1;
            C.rerender();
          }
          return;
        }

        const rack = g.myRack(C);
        // If a rack tile is currently selected, drop it directly onto this square!
        if (P.selRack >= 0 && P.selRack < rack.length) {
          const ch = rack[P.selRack];
          P.seq.push({ x, y, ch, rackIdx: P.selRack });
          rack.splice(P.selRack, 1);
          P.selRack = -1;
          const dx = P.dir === 'H' ? 1 : 0, dy = P.dir === 'V' ? 1 : 0;
          P.ax = x + dx;
          P.ay = y + dy;
          if (P.seq.length >= 2) {
            if (P.seq.every((t: any) => t.x === P.seq[0].x)) P.dir = 'V';
            else if (P.seq.every((t: any) => t.y === P.seq[0].y)) P.dir = 'H';
          }
          C.rerender();
          return;
        }

        // Otherwise set anchor or toggle direction if tapping the same anchor
        if (P.ax === x && P.ay === y) {
          P.dir = P.dir === 'H' ? 'V' : 'H';
        } else {
          P.ax = x;
          P.ay = y;
        }
        C.rerender();
      };
    });

    // Recall pending tile by tapping directly on it
    R.querySelectorAll('.tile-pending').forEach((el: any) => {
      el.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        const px = +el.dataset.pendingX, py = +el.dataset.pendingY;
        const pending = seqPos[px + ',' + py];
        if (pending) {
          const removed = P.seq.splice(pending.seqIdx, 1)[0];
          if (removed) {
            g.myRack(C).splice(removed.rackIdx, 0, removed.ch);
            P.selRack = -1;
            C.rerender();
          }
        }
      };
    });

    // Direction Toggle
    const dirBtn = $('#dirBtn');
    if (dirBtn) {
      dirBtn.onclick = () => {
        P.dir = P.dir === 'H' ? 'V' : 'H';
        C.rerender();
      };
    }

    // Undo Last Placed Tile
    const undoBtn = $('#undoBtn');
    if (undoBtn) {
      undoBtn.onclick = () => {
        const t = P.seq.pop();
        if (t) {
          g.myRack(C).splice(t.rackIdx, 0, t.ch);
          P.selRack = -1;
          C.rerender();
        }
      };
    }

    // Recall All Placed Tiles back to rack
    const recallAllBtn = $('#recallAllBtn');
    if (recallAllBtn) {
      recallAllBtn.onclick = () => {
        const rack = g.myRack(C);
        P.seq.forEach((t: any) => rack.splice(t.rackIdx, 0, t.ch));
        P.seq = [];
        P.selRack = -1;
        C.rerender();
      };
    }

    // Shuffle Rack Tiles
    const shuffleRackBtn = $('#shuffleRackBtn');
    if (shuffleRackBtn) {
      shuffleRackBtn.onclick = () => {
        const rack = g.myRack(C);
        shuffle(rack);
        P.selRack = -1;
        C.rerender();
      };
    }

    // Rack Tile Click: Place onto anchor line OR select tile
    R.querySelectorAll('.scrabble-rack-slot[data-rack-i]').forEach((el: any) => {
      el.onclick = () => {
        const i = +el.dataset.rackI;
        const rack = g.myRack(C);

        if (P.ax >= 0) {
          const ch = rack[i];
          const dx = P.dir === 'H' ? 1 : 0, dy = P.dir === 'V' ? 1 : 0;
          let x = P.ax, y = P.ay;
          const used = new Set(P.seq.map((t: any) => t.x + ',' + t.y));
          while (x >= 0 && y >= 0 && x < N && y < N && (S.board[y][x] || used.has(x + ',' + y))) {
            x += dx;
            y += dy;
          }
          if (x < 0 || y < 0 || x >= N || y >= N) {
            toast('Word runs off the edge of the board in that direction');
            return;
          }
          P.seq.push({ x, y, ch, rackIdx: i });
          rack.splice(i, 1);
          P.selRack = -1;
          if (P.seq.length >= 2) {
            if (P.seq.every((t: any) => t.x === P.seq[0].x)) P.dir = 'V';
            else if (P.seq.every((t: any) => t.y === P.seq[0].y)) P.dir = 'H';
          }
          C.rerender();
        } else {
          P.selRack = P.selRack === i ? -1 : i;
          C.rerender();
        }
      };
    });

    // Play Word Button
    const playBtn = $('#playBtn');
    if (playBtn) {
      playBtn.onclick = () => {
        const v = g.validate(S, P);
        if (!v.ok) {
          toast('❌ ' + v.reason);
          return;
        }
        C.update((st: any) => {
          v.tiles.forEach((t: any) => st.board[t.y][t.x] = t.ch);
          st.scores[st.turn] += v.score;
          st.passes = 0;
          st.first = false;
          const rack = g.myRack(C);
          g.refill(C, rack);
        });
        Sound.win();
        toast('+"' + v.words.join('", "') + '" +' + v.score + (v.bingo ? ' (🌟 BINGO +50!)' : ''));
        P.ax = -1;
        P.ay = -1;
        P.seq = [];
        P.selRack = -1;
        g.checkEnd(C);
        if (!S.over) {
          S.turn = (S.turn + 1) % C.names.length;
          C.update(() => {});
        }
        maybeCpu(C);
      };
    }

    // Exchange Tiles
    const exBtn = $('#exBtn');
    if (exBtn) {
      exBtn.onclick = () => {
        if (S.bag.length < 1) {
          toast('Bag is empty, cannot exchange');
          return;
        }
        const rack = g.myRack(C);
        P.seq.forEach((t: any) => rack.splice(t.rackIdx, 0, t.ch));
        P.ax = -1; P.ay = -1; P.seq = []; P.selRack = -1;
        C.update((st: any) => {
          const myR = g.myRack(C);
          st.bag.push(...myR);
          shuffle(st.bag);
          myR.length = 0;
          g.refill(C, myR);
          st.passes = 0;
        });
        toast('Exchanged tiles with bag');
        S.turn = (S.turn + 1) % C.names.length;
        C.update(() => {});
        maybeCpu(C);
      };
    }

    // Pass Turn
    const passBtn = $('#passBtn');
    if (passBtn) {
      passBtn.onclick = () => {
        S.passes++;
        const rack = g.myRack(C);
        P.seq.forEach((t: any) => rack.splice(t.rackIdx, 0, t.ch));
        P.ax = -1; P.ay = -1; P.seq = []; P.selRack = -1;
        toast('Turn passed');
        g.checkEnd(C);
        if (!S.over) {
          S.turn = (S.turn + 1) % C.names.length;
          C.update(() => {});
        }
        maybeCpu(C);
      };
    }
  },

  checkEnd(C: any) {
    const S = C.S, g = this;
    const rackEmpty = C.names.some((n: string, i: number) => {
      const r = C.isNet ? (i === Net.mySeat() ? C.priv.rack : []) : C.priv.rack[i];
      return r && r.length === 0;
    });
    if ((!S.bag.length && rackEmpty) || S.passes >= C.names.length * 2) {
      const lv = (ch: string) => g.DIST[ch] ? g.DIST[ch][1] : 1;
      const final = S.scores.map((s: number, i: number) => {
        const r = C.isNet ? (i === Net.mySeat() ? C.priv.rack : []) : C.priv.rack[i];
        const left = (r || []).reduce((a: number, ch: string) => a + lv(ch), 0);
        return s - left;
      });
      S.over = true;
      C.update(() => {});
      let w = 0, b = -1e9;
      final.forEach((f: number, i: number) => { if (f > b) { b = f; w = i; } });
      C.finish(w, 'Scores: ' + final.map((f: number, i: number) => esc(C.seatName(i)) + ' ' + f).join(' · '));
    }
  },

  inbox(C: any, msg: any) {
    const my = Net.mySeat();
    if (msg.to !== my) return;
    if (msg.type === 'rack') {
      C.priv = C.priv || {};
      C.priv.rack = msg.tiles;
      C.rerender();
    }
  },

  cpu(C: any) {
    const S = C.S, g = this, N = g.N;
    const rack = (C.priv.rack && C.priv.rack[1] ? C.priv.rack[1] : []).slice();
    if (!rack.length) return;

    const level = C.botLevel || (C.champ && C.champ.level) || 10;
    const champ = C.champ || SCRABBLE_CHAMPIONS.find((c: any) => c.level === level) || SCRABBLE_CHAMPIONS[9];

    // Difficulty scaling across Levels 1 - 10
    const levelConfigs: Record<number, { maxLen: number; maxCandidates: number; minScoreBreak: number; maxAnchors: number }> = {
      1:  { maxLen: 4, maxCandidates: 35,  minScoreBreak: 12, maxAnchors: 15 },
      2:  { maxLen: 5, maxCandidates: 60,  minScoreBreak: 15, maxAnchors: 20 },
      3:  { maxLen: 5, maxCandidates: 90,  minScoreBreak: 18, maxAnchors: 25 },
      4:  { maxLen: 6, maxCandidates: 130, minScoreBreak: 22, maxAnchors: 30 },
      5:  { maxLen: 6, maxCandidates: 180, minScoreBreak: 26, maxAnchors: 35 },
      6:  { maxLen: 7, maxCandidates: 240, minScoreBreak: 30, maxAnchors: 40 },
      7:  { maxLen: 7, maxCandidates: 300, minScoreBreak: 36, maxAnchors: 45 },
      8:  { maxLen: 7, maxCandidates: 380, minScoreBreak: 42, maxAnchors: 50 },
      9:  { maxLen: 7, maxCandidates: 460, minScoreBreak: 50, maxAnchors: 60 },
      10: { maxLen: 7, maxCandidates: 550, minScoreBreak: 65, maxAnchors: 75 }
    };
    const cfg = levelConfigs[level] || levelConfigs[10];

    const words = [...SCR_DICT].filter(w => w.length >= 2 && w.length <= cfg.maxLen);
    shuffle(words);
    let best: any = null;
    const anchors: any[] = [];
    if (S.first) {
      anchors.push({ x: 7, y: 7, ch: null });
    } else {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          if (S.board[y][x]) anchors.push({ x, y, ch: S.board[y][x] });
        }
      }
      shuffle(anchors);
    }

    outer:
    for (const w of words.slice(0, cfg.maxCandidates)) {
      for (const a of anchors.slice(0, cfg.maxAnchors)) {
        for (const dir of ['H', 'V']) {
          for (let i = 0; i < w.length; i++) {
            if (a.ch && w[i] !== a.ch) continue;
            const dx = dir === 'H' ? 1 : 0, dy = dir === 'V' ? 1 : 0;
            const ax = a.x - dx * i, ay = a.y - dy * i;
            const need: any[] = [];
            let ok = true, x = ax, y = ay;
            for (let k = 0; k < w.length; k++, x += dx, y += dy) {
              if (x < 0 || y < 0 || x >= N || y >= N) { ok = false; break; }
              const b = S.board[y][x];
              if (b) { if (b !== w[k]) { ok = false; break; } }
              else need.push({ x, y, ch: w[k], rackIdx: -1 });
            }
            if (!ok || !need.length) continue;
            const rackCount: Record<string, number> = {};
            rack.forEach((ch: string) => rackCount[ch] = (rackCount[ch] || 0) + 1);
            const ri2: Record<string, number> = {};
            let can = true;
            need.forEach((t: any) => {
              ri2[t.ch] = (ri2[t.ch] || 0) + 1;
              if ((ri2[t.ch] || 0) > (rackCount[t.ch] || 0)) can = false;
            });
            if (!can) continue;
            const used: Record<number, number> = {};
            need.forEach((t: any) => {
              const idx = rack.findIndex((ch: string, j: number) => ch === t.ch && !used[j]);
              used[idx] = 1;
              t.rackIdx = idx;
            });
            const v = g.validate(S, { ax, ay, dir, seq: need });
            if (v.ok && (!best || v.score > best.score)) {
              best = { v, need, ax, ay, dir };
              if (v.score >= cfg.minScoreBreak) break outer;
            }
          }
        }
      }
    }

    cpuDelay(() => {
      if (best) {
        const rackArr = C.priv.rack[1];
        const idxs = best.need.map((t: any) => t.rackIdx).sort((a: number, b: number) => b - a);
        idxs.forEach((i: number) => rackArr.splice(i, 1));
        C.update((st: any) => {
          best.v.tiles.forEach((t: any) => st.board[t.y][t.x] = t.ch);
          st.scores[1] += best.v.score;
          st.passes = 0;
          st.first = false;
          g.refill(C, rackArr);
        });
        toast('🏆 ' + champ.name + ' (Lv.' + champ.level + ') played "' + best.v.words[0] + '" +' + best.v.score + (best.v.bingo ? ' (🌟 BINGO +50!)' : ''));
        g.checkEnd(C);
        if (!S.over) {
          S.turn = 0;
          C.update(() => {});
        }
      } else {
        if (S.bag.length >= 7) {
          C.update((st: any) => {
            const r = C.priv.rack[1];
            st.bag.push(...r);
            shuffle(st.bag);
            r.length = 0;
            g.refill(C, r);
            st.passes = 0;
          });
          toast('🏆 ' + champ.name + ' exchanged tiles with bag');
        } else {
          S.passes++;
          toast('🏆 ' + champ.name + ' passed turn');
        }
        g.checkEnd(C);
        if (!S.over) {
          S.turn = 0;
          C.update(() => {});
        }
      }
    }, 800);
  }
});

/* ================= PICTIONARY ================= */
const PIC_WORDS = PICTIONARY_WORDS;

function drawStrokes(cv: HTMLCanvasElement, strokes: any[], n?: number) {
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const W = cv.width, H = cv.height;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0f172a';
  const count = n == null ? strokes.length : Math.max(0, Math.min(n, strokes.length));
  strokes.slice(0, count).forEach(st => {
    ctx.beginPath();
    st.forEach((p: number[], i: number) => {
      const x = p[0] / 100 * W, y = p[1] / 100 * H;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
  });
}

stdInit('pictionary', {
  name: 'Pictionary',
  icon: '✏️',
  desc: 'Draw & guess',
  p: [2, 2],
  payout: PAYOUTS.pictionary,
  rules: 'Pictionary! 20 Difficulty Levels & 1,000 Pictures including Celebrities! Vs Computer: AI sketches in real-time and you guess from 4 choices (5 rounds — get 3+ to win). With a friend: take turns drawing with your finger while they guess!',
  newState() {
    return {
      turn: 0,
      round: 1,
      score: 0,
      scores: [0, 0],
      over: false,
      phase: 'draw',
      word: '',
      drawer: 0,
      level: Math.max(1, Math.min(20, +(localStorage.getItem('pictionary_level') || '1')))
    };
  },
  render(R: HTMLElement, C: any) {
    const g = this;
    if (C._timer) { clearInterval(C._timer); C._timer = null; }
    if (C._gTimer) { clearInterval(C._gTimer); C._gTimer = null; C._gt = null; }
    if (C.mode === 'pvc') return g.renderPVC(R, C);
    return g.renderDuel(R, C);
  },
  renderPVC(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    if (S.round > 5) { if (!S.over) { S.over = true; C.finish((S.score || 0) >= 3 ? 0 : 1, 'You guessed ' + (S.score || 0) + '/5'); } return; }

    const curLvlNum = S.level || Math.max(1, Math.min(20, +(localStorage.getItem('pictionary_level') || '1')));
    if (!S.level) S.level = curLvlNum;
    const lvlInfo = getPictionaryLevel(curLvlNum);

    // Initialize session words to guarantee no repeats during the same session and never back-to-back
    if (!C._sessionWords) C._sessionWords = new Set<string>();

    if (!C._pv || C._pv.round !== S.round) {
      if (C._pvTimer) clearInterval(C._pvTimer);
      const w = pickSessionWord(curLvlNum, C._sessionWords, C._lastWord);
      C._lastWord = w.w;
      const opts = pickPictionaryOptions(w);
      const initShown = Math.max(1, Math.min(2, w.s.length));
      C._pv = {
        round: S.round,
        word: w,
        opts,
        shown: initShown,
        tleft: lvlInfo.timeSec,
        maxTime: lvlInfo.timeSec,
        done: false
      };
      C._pvTimer = setInterval(() => {
        const pv = C._pv;
        if (!pv || pv.done) return;
        if (pv.shown < pv.word.s.length) {
          pv.shown++;
          const cv = $('#picCv') as HTMLCanvasElement;
          if (cv) drawStrokes(cv, pv.word.s, pv.shown);
        }
        pv.tleft--;
        const te = $('#pvTime');
        if (te) te.textContent = pv.tleft + 's';
        if (pv.tleft <= 0) {
          pv.done = true;
          clearInterval(C._pvTimer);
          g.pvNext(C, false);
        }
      }, Math.min(lvlInfo.revealSpeedMs, 750));
    }
    const pv = C._pv;

    R.innerHTML = turnBanner(C)
      + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">'
      + '  <h2 style="margin:0;display:inline-flex;align-items:center;gap:6px;">✏️ Pictionary</h2>'
      + '  <span style="font-size:11px; padding:3px 9px; border-radius:999px; background:rgba(14,165,233,0.18); border:1px solid #0284c7; color:#7dd3fc; font-weight:700;">'
      + '    ' + lvlInfo.icon + ' Level ' + curLvlNum + ' · ' + esc(lvlInfo.title)
      + '  </span>'
      + '</div>'
      + '<div class="turn-banner" style="display:flex; justify-content:space-between; align-items:center; font-weight:700;">'
      + '  <span>Round ' + S.round + '/5 · Score ' + (S.score || 0) + '</span>'
      + '  <span style="font-size:11.5px; color:#7dd3fc; font-weight:700;">🏷️ ' + esc(pv.word.cat) + '</span>'
      + '  <span id="pvTime" style="color:#fde047; font-weight:900; font-size:15px;">' + pv.tleft + 's</span>'
      + '</div>'
      + '<canvas id="picCv" class="draw" width="400" height="320"></canvas>'
      + '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; margin-bottom:4px;">'
      + '  <h3 style="margin:0;">What is it?</h3>'
      + '  <span style="font-size:11px; color:#94a3b8;">✨ 1,000 Pictures Pool · No Repeats</span>'
      + '</div>'
      + '<div class="grid">' + pv.opts.map((o: string) => '<button class="btn secondary" data-o="' + esc(o) + '" style="font-weight:700; font-size:13.5px; padding:10px 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(o) + '</button>').join('') + '</div>';

    drawStrokes($('#picCv') as HTMLCanvasElement, pv.word.s, pv.shown);

    R.querySelectorAll('[data-o]').forEach((b: any) => b.onclick = () => {
      if (pv.done) return;
      pv.done = true;
      clearInterval(C._pvTimer);
      const ok = b.dataset.o === pv.word.w;
      R.querySelectorAll('[data-o]').forEach((btn: any) => {
        if (btn.dataset.o === pv.word.w) {
          btn.style.background = '#15803d';
          btn.style.borderColor = '#4ade80';
          btn.style.color = '#fff';
        } else if (btn === b && !ok) {
          btn.style.background = '#b91c1c';
          btn.style.borderColor = '#f87171';
          btn.style.color = '#fff';
        }
      });
      drawStrokes($('#picCv') as HTMLCanvasElement, pv.word.s);
      g.pvNext(C, ok);
    });
  },
  pvNext(C: any, ok: boolean) {
    const S = C.S;
    if (ok) {
      S.score = (S.score || 0) + 1;
      Sound.win();
      toast('✅ Correct! It was ' + C._pv.word.w);
    } else {
      Sound.lose();
      toast('❌ It was ' + C._pv.word.w);
    }
    cpuDelay(() => {
      S.round++;
      C._pv = null;
      if (S.round > 5) {
        S.over = true;
        C.update(() => {});
        C.finish((S.score || 0) >= 3 ? 0 : 1, 'You guessed ' + (S.score || 0) + '/5');
      } else {
        C.update(() => {});
      }
    }, 1200);
  },
  renderDuel(R: HTMLElement, C: any) {
    const S = C.S, g = this;
    if (S.round > 4) { if (!S.over) { S.over = true; const w = S.scores[0] === S.scores[1] ? -1 : (S.scores[0] > S.scores[1] ? 0 : 1); C.finish(w, 'Scores: ' + C.seatName(0) + ' ' + S.scores[0] + ' · ' + C.seatName(1) + ' ' + S.scores[1]); } return; }
    const me = C.isNet ? Net.mySeat() : 0;
    const drawer = S.drawer;
    const iAmDrawer = C.isNet ? me === drawer : true;
    if (S.phase === 'draw') {
      if (C.mode === 'hotseat' && !C._drawCover) {
        C._drawCover = true;
        passCover(C, drawer);
        return;
      }
      C._drawCover = false;
      if (!C.strokes) C.strokes = [];
      R.innerHTML = turnBanner(C)
        + '<h2>✏️ Pictionary</h2><div class="turn-banner">Round ' + S.round + '/4 · ' + esc(C.seatName(drawer)) + ' is drawing</div>'
        + '<div class="card"><h3>' + (iAmDrawer ? 'Your word: <span class="big">' + esc(S.word || '(pick)') + '</span>' : 'Draw in progress…') + '</h3>'
        + '<canvas id="picCv" class="draw" width="400" height="320"></canvas>'
        + (iAmDrawer ? '<div class="row"><button class="btn secondary grow" id="clrBtn">Clear</button><button class="btn grow" id="doneBtn">Done — guesser\'s turn</button></div>' : '<div class="muted">Waiting for the drawing…</div>') + '</div>';
      const cv = $('#picCv') as HTMLCanvasElement;
      drawStrokes(cv, C.strokes);
      if (iAmDrawer) {
        if (!S.word) {
          if (!C._sessionWords) C._sessionWords = new Set<string>();
          const pick = pickSessionWord(10, C._sessionWords, C._lastWord);
          C._lastWord = pick.w;
          S.word = pick.w;
          C.update(() => {}, true);
        }
        let cur: any = null;
        const pos = (e: any) => {
          const r = cv.getBoundingClientRect();
          const t = e.touches ? e.touches[0] : e;
          return [((t.clientX - r.left) / r.width * 100), ((t.clientY - r.top) / r.height * 100)];
        };
        cv.onpointerdown = (e: any) => {
          e.preventDefault();
          cur = [pos(e)];
          C.strokes.push(cur);
          cv.setPointerCapture(e.pointerId);
        };
        cv.onpointermove = (e: any) => {
          if (cur) {
            cur.push(pos(e));
            drawStrokes(cv, C.strokes);
          }
        };
        cv.onpointerup = () => {
          cur = null;
          if (C.isNet) Net.inboxSend({ to: 1 - me, type: 'strokes', strokes: C.strokes, round: S.round });
        };
        cv.onpointercancel = () => { cur = null; };
        $('#clrBtn').onclick = () => { C.strokes = []; drawStrokes(cv, []); };
        $('#doneBtn').onclick = () => {
          if (C.isNet) Net.inboxSend({ to: 1 - me, type: 'strokes', strokes: C.strokes, round: S.round, final: true });
          C.update((s: any) => { s.phase = 'guess'; s.tleft = 60; });
        };
      }
      return;
    }
    if (C.mode === 'hotseat' && !C._guessCover) {
      C._guessCover = true;
      C._drawCover = false;
      passCover(C, 1 - drawer);
      return;
    }
    C._guessCover = false;
    const guesser = 1 - drawer;
    const iAmGuesser = C.isNet ? me === guesser : true;
    if (!C._gt) {
      C._gt = 60;
      C._gTimer = setInterval(() => {
        C._gt--;
        const e = $('#gTime');
        if (e) e.textContent = C._gt + 's';
        if (C._gt <= 0) {
          clearInterval(C._gTimer);
          C._gTimer = null;
          g.duelNext(C, false);
        }
      }, 1000);
    }
    R.innerHTML = turnBanner(C)
      + '<h2>✏️ Pictionary</h2><div class="turn-banner">Round ' + S.round + '/4 · <span id="gTime">60s</span> · ' + esc(C.seatName(guesser)) + ' guessing</div>'
      + '<canvas id="picCv" class="draw" width="400" height="320"></canvas>'
      + (iAmGuesser ? '<div class="row"><input id="gIn" class="grow" placeholder="Type your guess…" autocomplete="off"><button class="btn small" id="gBtn">Guess</button></div>' : '<div class="muted">Waiting for ' + esc(C.seatName(guesser)) + ' to guess…</div>');
    drawStrokes($('#picCv') as HTMLCanvasElement, C.strokes);
    if (iAmGuesser) {
      const sub = () => {
        const w = $('#gIn').value.trim().toLowerCase();
        if (!w) return;
        if (C.isNet) Net.inboxSend({ to: drawer, type: 'guess', word: w, round: S.round });
        else g.duelJudge(C, w);
      };
      $('#gBtn').onclick = sub;
      $('#gIn').addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') sub(); });
    }
  },
  duelJudge(C: any, w: string) {
    const S = C.S, g = this;
    const target = (S.word || '').trim().toLowerCase();
    const guess = w.trim().toLowerCase();
    const ok = guess === target || (guess.length >= 4 && target.includes(guess));
    if (ok) g.duelNext(C, true);
    else toast('❌ Nope!');
  },
  duelNext(C: any, ok: boolean) {
    const S = C.S;
    if (S.phase !== 'guess') return;
    const drawer = S.drawer, guesser = 1 - drawer;
    if (C._gTimer) { clearInterval(C._gTimer); C._gTimer = null; }
    C._gt = null;
    if (ok) {
      S.scores[drawer]++;
      S.scores[guesser]++;
      Sound.win();
      toast('✅ "' + S.word + '"! Both score!');
    } else {
      Sound.lose();
      toast('⏰ Time! It was "' + S.word + '"');
    }
    cpuDelay(() => {
      S.round++;
      S.drawer = 1 - S.drawer;
      S.phase = 'draw';
      S.word = '';
      C.strokes = [];
      C._pv = null;
      C._drawCover = false;
      C._guessCover = false;
      if (S.round > 4) {
        S.over = true;
        C.update(() => {});
        const w = S.scores[0] === S.scores[1] ? -1 : (S.scores[0] > S.scores[1] ? 0 : 1);
        C.finish(w, 'Scores: ' + C.seatName(0) + ' ' + S.scores[0] + ' · ' + C.seatName(1) + ' ' + S.scores[1]);
      } else C.update(() => {});
    }, 1400);
  },
  inbox(C: any, msg: any) {
    const g = GAMES.pictionary;
    const my = Net.mySeat();
    if (msg.to !== my) return;
    const S = C.S;
    if (msg.type === 'strokes') {
      C.strokes = msg.strokes;
      if (msg.final) {
        C.update((s: any) => { s.phase = 'guess'; });
      } else C.rerender();
    }
    if (msg.type === 'guess') {
      const ok = msg.word === S.word;
      Net.inboxSend({ to: msg.from, type: 'verdict', ok });
      if (ok) g.duelNext(C, true);
    }
    if (msg.type === 'verdict') {
      if (!msg.ok) toast('❌ Nope!');
    }
  }
});

/* ================= GUESS? ================= */
interface GwAttr {
  id: string;
  category: 'features' | 'hair' | 'gender';
  label: string;
  icon: string;
  test: (c: GuessWhoChar) => boolean;
}

const GW_ATTRS: GwAttr[] = [
  // Features & Accessories
  { id: 'glasses', category: 'features', label: 'Wearing glasses?', icon: '👓', test: (c) => !!c.glasses },
  { id: 'hat', category: 'features', label: 'Wearing a hat or cap?', icon: '🎩', test: (c) => !!c.hat },
  { id: 'facial', category: 'features', label: 'Facial hair (beard/stache)?', icon: '🧔', test: (c) => !!c.facial },
  { id: 'bald', category: 'features', label: 'Bald or balding on top?', icon: '🧑‍🦲', test: (c) => !!c.bald },
  { id: 'earrings', category: 'features', label: 'Wearing earrings?', icon: '💎', test: (c) => !!c.earrings },
  // Hair Color
  { id: 'blonde', category: 'hair', label: 'Blonde hair?', icon: '👱', test: (c) => c.hairColor === 'blonde' },
  { id: 'red', category: 'hair', label: 'Red / Ginger hair?', icon: '🧑‍🦰', test: (c) => c.hairColor === 'red' },
  { id: 'white', category: 'hair', label: 'White / Gray hair?', icon: '🧑‍🦳', test: (c) => c.hairColor === 'white' },
  { id: 'dark', category: 'hair', label: 'Dark (brown/black) hair?', icon: '🧑‍🦱', test: (c) => c.hairColor === 'black' || c.hairColor === 'brown' },
  // Gender
  { id: 'female', category: 'gender', label: 'Girl / Woman?', icon: '👩', test: (c) => !!c.female },
  { id: 'male', category: 'gender', label: 'Boy / Man?', icon: '👨', test: (c) => !c.female },
];

function getGwDeck(C: any, S: any): { deck: GuessWhoChar[]; edition: DeckEdition } {
  let ed: DeckEdition = 'classic';
  if (S && S.deck) ed = S.deck;
  else if (C && C.deckEdition) ed = C.deckEdition;
  else {
    try {
      const saved = localStorage.getItem('gw_edition') as DeckEdition;
      if (saved === 'modern' || saved === 'classic') ed = saved;
    } catch (e) {}
  }
  return { deck: getDeck(ed), edition: ed };
}

stdInit('guesswho', {
  name: 'Guess?',
  icon: '🕵️',
  desc: '20 questions face-off with authentic cards & guessing',
  p: [2, 2],
  payout: PAYOUTS.guesswho,
  rules: 'Choose Classic 1980s or Modern Friend Cards. Each player is randomly dealt a secret character. Ask trait questions to deduce your opponent\'s identity, then make your final guess!',
  newState() { 
    return { turn: 0, over: false, picked: [true, true], deck: null, history: [] }; 
  },
  render(R: HTMLElement, C: any) {
    const S = C.S, g = this;

    // --- GAME SELECTION SCREEN (Modern vs Classic) ---
    if (!S.deck) {
      let selHtml = turnBanner(C)
        + '<div class="gw-container gw-select-screen">'
        + '<div class="card center" style="padding:24px 16px;">'
        + '<div style="font-size:46px; margin-bottom:4px;">🕵️</div>'
        + '<h2 style="font-size:26px; margin:4px 0 6px;">Guess?</h2>'
        + '<div class="muted" style="max-width:540px; margin:0 auto 16px; font-size:14px; line-height:1.4;">'
        + 'Select which card edition you want to play! Each match will <b>randomly deal you a secret character</b> from the deck.'
        + '</div>'
        + '<div class="gw-select-grid">'
        + '  <!-- Card 1: Classic 1980s Retro Edition -->'
        + '  <div class="gw-select-card classic-theme" id="chooseClassicCard">'
        + '    <div>'
        + '      <span class="pill" style="color:#ef4444; border-color:#ef4444; font-size:11px; padding:3px 10px;">VINTAGE 1980s</span>'
        + '      <h3 style="margin:8px 0 4px; font-size:18px; color:#f87171;">Classic 1980s Edition</h3>'
        + '      <div class="muted" style="font-size:12px;">24 iconic red cards: Alex, Alfred, Anita, Bernard, Bill, Charles, Claire, David, Eric, Frans, George, Herman, Joe, Maria, Max, Paul, Peter, Philip, Richard, Robert, Sam, Susan, and Tom.</div>'
        + '    </div>'
        + '    <div class="gw-select-previews">'
        + '      <div class="gw-preview-thumb">' + CLASSIC_DECK[0].renderSvg(false) + '</div>'
        + '      <div class="gw-preview-thumb">' + CLASSIC_DECK[2].renderSvg(false) + '</div>'
        + '      <div class="gw-preview-thumb">' + CLASSIC_DECK[6].renderSvg(false) + '</div>'
        + '    </div>'
        + '    <button class="gw-select-play-btn classic-btn" id="btnPlayClassic">'
        + '      ▶ Play Classic 1980s'
        + '    </button>'
        + '  </div>'
        + '  <!-- Card 2: Modern Friend Cards Edition -->'
        + '  <div class="gw-select-card modern-theme" id="chooseModernCard">'
        + '    <div>'
        + '      <span class="pill" style="color:#eab308; border-color:#eab308; font-size:11px; padding:3px 10px;">FRIEND CARDS</span>'
        + '      <h3 style="margin:8px 0 4px; font-size:18px; color:#facc15;">Modern Friend Cards</h3>'
        + '      <div class="muted" style="font-size:12px;">24 modern illustrated cards with hobby badges: Amy, David, Leo, Gabe, Katie, Olivia, Jordan, Carmen, Laura, Joe, Mike, Al, Daniel, Sophia, Nick, Lily, Liz, Mia, Emma, Rachel, Ben, Eric, Farah, and Sam.</div>'
        + '    </div>'
        + '    <div class="gw-select-previews">'
        + '      <div class="gw-preview-thumb">' + MODERN_DECK[0].renderSvg(false) + '</div>'
        + '      <div class="gw-preview-thumb">' + MODERN_DECK[1].renderSvg(false) + '</div>'
        + '      <div class="gw-preview-thumb">' + MODERN_DECK[4].renderSvg(false) + '</div>'
        + '    </div>'
        + '    <button class="gw-select-play-btn modern-btn" id="btnPlayModern">'
        + '      ▶ Play Modern Friend Cards'
        + '    </button>'
        + '  </div>'
        + '</div>'
        + '</div>'
        + '</div>';

      R.innerHTML = selHtml;

      const startWithEdition = (ed: DeckEdition) => {
        S.deck = ed;
        C.deckEdition = ed;
        try { localStorage.setItem('gw_edition', ed); } catch (e) {}
        // Pick player face and opponent face RANDOMLY at the start of every game
        C.priv = C.priv || {};
        C.priv.secrets = [ri(0, 23), ri(0, 23)];
        C.priv.cpuSecret = C.priv.secrets[1];
        C.elim = Array(24).fill(false);
        C._cpuElim = Array(24).fill(false);
        S.history = [];
        S.turn = 0;
        S.over = false;
        Sound.click();
        C.update(() => {});
        C.rerender();
      };

      const btnClassic = $('#btnPlayClassic');
      const cardClassic = $('#chooseClassicCard');
      if (btnClassic) btnClassic.onclick = (e: MouseEvent) => { e.stopPropagation(); startWithEdition('classic'); };
      if (cardClassic) cardClassic.onclick = () => startWithEdition('classic');

      const btnModern = $('#btnPlayModern');
      const cardModern = $('#chooseModernCard');
      if (btnModern) btnModern.onclick = (e: MouseEvent) => { e.stopPropagation(); startWithEdition('modern'); };
      if (cardModern) cardModern.onclick = () => startWithEdition('modern');
      return;
    }

    // --- ACTIVE GAMEPLAY SCREEN ---
    const { deck, edition } = getGwDeck(C, S);
    const me = C.isNet ? Net.mySeat() : (C.mode === 'pvc' ? 0 : C.cur());
    if (!C.priv) C.priv = {};
    if (!C.priv.secrets || C.priv.secrets[0] == null) {
      C.priv.secrets = [ri(0, 23), ri(0, 23)];
      C.priv.cpuSecret = C.priv.secrets[1];
    }
    if (!C.elim) C.elim = Array(24).fill(false);
    if (!C._cpuElim) C._cpuElim = Array(24).fill(false);
    if (!S.history) S.history = [];

    const remain = C.elim.filter((e: boolean) => !e).length;
    const mySecretIdx = C.priv.secrets[me] != null ? C.priv.secrets[me] : 0;
    const myChar = deck[mySecretIdx] || deck[0];
    const isMyTurn = C.mine() && !S.over;

    let h = turnBanner(C) + '<div class="gw-container">';

    // 1. Play Screen Header Badge (No edition choice on play screen)
    h += '<div style="display:flex; align-items:center; margin-bottom:10px;">'
      + '<span class="pill" style="font-size:12px; font-weight:800; color:' + (edition === 'classic' ? '#f87171' : '#facc15') + '; border-color:' + (edition === 'classic' ? '#ef4444' : '#eab308') + ';">'
      + (edition === 'classic' ? '🎴 Classic 1980s Edition' : '🌟 Modern Friend Cards')
      + '</span>'
      + '</div>';

    // 2. Secret Character Showcase (Locked / Randomly Chosen - Change Face Button OFF)
    h += '<div class="gw-secret-box">'
      + '<div class="gw-secret-thumb">' + myChar.renderSvg(false) + '</div>'
      + '<div style="flex:1;">'
      + '<div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:var(--gold); font-weight:800;">Your Secret Character</div>'
      + '<div style="font-size:20px; font-weight:900;">' + myChar.name + (myChar.badgeIcon ? ' ' + myChar.badgeIcon : '') + '</div>'
      + '<div class="muted" style="font-size:12px; margin-top:2px;">'
      + (myChar.female ? 'Female' : 'Male') + ' · ' + myChar.hairColor + ' hair · '
      + (myChar.hat ? 'Hat ' : '') + (myChar.glasses ? 'Glasses ' : '') + (myChar.facial ? 'Beard/Stache ' : '') + (myChar.bald ? 'Bald ' : '') + (myChar.earrings ? 'Earrings ' : '')
      + '</div>'
      + '<div style="font-size:11px; color:#94a3b8; margin-top:3px;">🔒 Randomly dealt secret identity</div>'
      + '</div>'
      + '<div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">'
      + '<span class="pill gold" style="font-size:12px;">' + remain + '/24 Suspects</span>'
      + '<button class="btn small secondary" id="gwNewRoundBtn" style="margin:0; font-size:11px; padding:4px 8px;" title="Deal new random secret faces">🔄 New Match</button>'
      + '</div>'
      + '</div>';

    // 3. Suspect Board Header & Reset Tools
    h += '<div class="row" style="justify-content:space-between; align-items:center; margin:10px 0 6px;">'
      + '<h3 style="margin:0; font-size:16px;">🎴 Suspect Faces Board</h3>'
      + '<div style="display:flex; gap:6px;">'
      + '<button class="btn small secondary" id="gwResetDoorsBtn" style="margin:0; font-size:11px; padding:4px 8px;" title="Reset all flipped doors to standing up">🔄 Flip All Up</button>'
      + '</div>'
      + '</div>';

    // 4. Board of 24 Face Cards
    h += '<div class="gw-board-grid">';
    deck.forEach((c, i) => {
      const isElim = !!C.elim[i];
      h += '<div class="gw-door ' + (isElim ? 'eliminated' : '') + ' ' + (C._gmode ? 'guess-armed' : '') + '" data-f="' + i + '" title="' + c.name + ' (tap to ' + (C._gmode ? 'ACCUSE / GUESS' : 'flip door') + ')">'
        + c.renderSvg(isElim)
        + '</div>';
    });
    h += '</div>';

    // 5. GUESS & ACCUSE ACTION BAR (Prominent, Always Visible!)
    h += '<div class="card" style="margin-top:14px; background:linear-gradient(180deg,#1e293b,#111827); border:2px solid var(--gold);">'
      + '<div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">'
      + '<div>'
      + '<h3 style="margin:0; font-size:18px; color:var(--gold);">🎯 MAKE A GUESS / ACCUSE</h3>'
      + '<div class="muted" style="font-size:12px;">Ready to solve the mystery? Guess your opponent\'s secret character to win!</div>'
      + '</div>'
      + '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">'
      + '<button class="gw-guess-btn" id="gwMainGuessBtn" ' + (isMyTurn ? '' : 'disabled') + ' style="' + (isMyTurn ? '' : 'opacity:0.5; cursor:not-allowed;') + '">'
      + '🎯 GUESS SUSPECT NOW'
      + '</button>'
      + '<button class="btn small ' + (C._gmode ? 'danger' : 'secondary') + '" id="gModeBtn" style="margin:0; padding:10px 14px;" ' + (isMyTurn ? '' : 'disabled') + '>'
      + (C._gmode ? '🎯 Tap-to-Guess: ON' : '👆 Tap-to-Guess: OFF')
      + '</button>'
      + '</div>'
      + '</div>';

    if (C._gmode && isMyTurn) {
      h += '<div class="msg ok" style="border-color:var(--red); font-weight:800; background:rgba(239,68,68,0.15); color:#fca5a5; margin:8px 0;">🎯 TAP-TO-GUESS IS ON: Tap any face card on the board above to accuse them! (Or tap "Tap-to-Guess: ON" to cancel)</div>';
    }
    h += '</div>';

    // 6. QUESTION ASKING CENTER (Categorized!)
    h += '<div class="card" style="margin-top:12px;">'
      + '<div class="row" style="justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">'
      + '<div>'
      + '<h3 style="margin:0; font-size:17px;">❓ Ask a Yes/No Question</h3>'
      + '<div class="muted" style="font-size:12px;">Your opponent answers Yes or No, and non-matching suspects flip down automatically.</div>'
      + '</div>'
      + (isMyTurn ? '<span class="pill gold">👉 Your Turn</span>' : '<span class="pill" style="color:var(--gold); border-color:var(--gold);">🤖 Opponent\'s Turn…</span>')
      + '</div>';

    // Category: Features & Accessories
    h += '<div class="gw-category-header">👓 Features & Accessories</div>'
      + '<div class="gw-qgrid">';
    GW_ATTRS.filter(a => a.category === 'features').forEach((a) => {
      const idx = GW_ATTRS.indexOf(a);
      const matchCount = deck.filter((c, ci) => !C.elim[ci] && a.test(c)).length;
      h += '<button class="gw-qbtn" data-q="' + idx + '" ' + (isMyTurn ? '' : 'disabled') + ' style="' + (isMyTurn ? '' : 'opacity:0.6; cursor:not-allowed;') + '">'
        + '<span class="qicon">' + a.icon + '</span>'
        + '<div style="flex:1;">'
        + '<div>' + a.label + '</div>'
        + '<div class="muted" style="font-size:10px; font-weight:normal;">' + matchCount + ' active suspects match</div>'
        + '</div>'
        + '</button>';
    });
    h += '</div>';

    // Category: Hair Color
    h += '<div class="gw-category-header">🎨 Hair Color</div>'
      + '<div class="gw-qgrid">';
    GW_ATTRS.filter(a => a.category === 'hair').forEach((a) => {
      const idx = GW_ATTRS.indexOf(a);
      const matchCount = deck.filter((c, ci) => !C.elim[ci] && a.test(c)).length;
      h += '<button class="gw-qbtn" data-q="' + idx + '" ' + (isMyTurn ? '' : 'disabled') + ' style="' + (isMyTurn ? '' : 'opacity:0.6; cursor:not-allowed;') + '">'
        + '<span class="qicon">' + a.icon + '</span>'
        + '<div style="flex:1;">'
        + '<div>' + a.label + '</div>'
        + '<div class="muted" style="font-size:10px; font-weight:normal;">' + matchCount + ' active suspects match</div>'
        + '</div>'
        + '</button>';
    });
    h += '</div>';

    // Category: Gender
    h += '<div class="gw-category-header">👤 Gender</div>'
      + '<div class="gw-qgrid">';
    GW_ATTRS.filter(a => a.category === 'gender').forEach((a) => {
      const idx = GW_ATTRS.indexOf(a);
      const matchCount = deck.filter((c, ci) => !C.elim[ci] && a.test(c)).length;
      h += '<button class="gw-qbtn" data-q="' + idx + '" ' + (isMyTurn ? '' : 'disabled') + ' style="' + (isMyTurn ? '' : 'opacity:0.6; cursor:not-allowed;') + '">'
        + '<span class="qicon">' + a.icon + '</span>'
        + '<div style="flex:1;">'
        + '<div>' + a.label + '</div>'
        + '<div class="muted" style="font-size:10px; font-weight:normal;">' + matchCount + ' active suspects match</div>'
        + '</div>'
        + '</button>';
    });
    h += '</div></div>';

    // 7. DEDUCTION LOG & GUESSES HISTORY
    h += '<div class="card" style="margin-top:12px;">'
      + '<div class="row" style="justify-content:space-between; align-items:center;">'
      + '<h3 style="margin:0; font-size:16px;">📜 Questions & Guesses History</h3>'
      + '<span class="muted" style="font-size:12px;">' + S.history.length + ' events</span>'
      + '</div>'
      + '<div class="gw-history-box">';

    if (S.history.length === 0) {
      h += '<div class="muted center" style="padding:14px 0;">No questions or guesses yet. Pick a question above or tap "GUESS SUSPECT NOW"!</div>';
    } else {
      S.history.slice().reverse().forEach((item: any, revIdx: number) => {
        const itemNum = S.history.length - revIdx;
        h += '<div class="gw-history-entry">'
          + '<span class="gw-history-turn">#' + itemNum + ' ' + esc(item.who) + ':</span>'
          + '<div style="flex:1;">';
        if (item.type === 'guess') {
          h += '<b>🎯 GUESSED: "' + esc(item.target) + '"</b> → '
            + (item.correct 
                ? '<span style="color:#22c55e; font-weight:800;">🎉 CORRECT DEDUCTION!</span>' 
                : '<span style="color:#ef4444; font-weight:800;">❌ WRONG GUESS!</span>');
        } else {
          h += 'Asked <b>"' + esc(item.text) + '"</b> → '
            + (item.answer 
                ? '<span style="color:#22c55e; font-weight:800;">✅ YES</span>' 
                : '<span style="color:#ef4444; font-weight:800;">❌ NO</span>')
            + ' <span class="muted" style="font-size:11px;">(' + item.elimCount + ' suspects eliminated)</span>';
        }
        h += '</div></div>';
      });
    }
    h += '</div></div>';

    h += '</div>';
    R.innerHTML = h;

    // --- EVENT LISTENERS ---


    // New Match button (deals new random secret faces)
    const newRoundBtn = $('#gwNewRoundBtn');
    if (newRoundBtn) newRoundBtn.onclick = () => {
      C.priv = C.priv || {};
      C.priv.secrets = [ri(0, 23), ri(0, 23)];
      C.priv.cpuSecret = C.priv.secrets[1];
      C.elim = Array(24).fill(false);
      C._cpuElim = Array(24).fill(false);
      S.history = [];
      S.turn = 0;
      S.over = false;
      Sound.click();
      toast('🎲 New match! Fresh secret characters dealt randomly.');
      C.update(() => {});
      C.rerender();
    };

    // Reset / Flip All Up Button
    const rstBtn = $('#gwResetDoorsBtn');
    if (rstBtn) rstBtn.onclick = () => {
      C.elim = Array(24).fill(false);
      Sound.click();
      toast('All 24 suspect doors flipped back up!');
      C.rerender();
    };

    // Main Guess Button (Opens Suspect Picker Modal)
    const mainGuessBtn = $('#gwMainGuessBtn');
    if (mainGuessBtn) mainGuessBtn.onclick = () => {
      if (!isMyTurn) return;
      const m = modal('<h3>🎯 Make Your Final Accusation!</h3>'
        + '<div class="muted center" style="margin-bottom:10px;">Tap the character you think your opponent secretly has.<br><b style="color:#ef4444;">Warning:</b> A wrong guess loses immediately!</div>'
        + '<div class="gw-board-grid" style="max-height:55vh; overflow-y:auto; padding:4px;">'
        + deck.map((c, i) => `
          <div class="gw-door ${C.elim[i] ? 'eliminated' : ''}" data-accuse="${i}" title="${c.name}">
            ${c.renderSvg(C.elim[i])}
          </div>
        `).join('')
        + '</div>');

      m.querySelectorAll('[data-accuse]').forEach((b: any) => b.onclick = () => {
        const accusedIdx = +b.dataset.accuse;
        const target = deck[accusedIdx];
        closeModal();

        // Confirmation Modal
        const confModal = modal('<h3>🎯 Confirm Accusation: ' + target.name + '?</h3>'
          + '<div style="margin:12px auto; max-width:120px;">' + target.renderSvg(false) + '</div>'
          + '<div class="center" style="font-size:15px; margin-bottom:12px;">'
          + 'Are you confident the secret character is <b>' + target.name + '</b>?<br>'
          + '<span style="color:#22c55e;">If correct: YOU WIN!</span> · <span style="color:#ef4444;">If wrong: YOU LOSE!</span>'
          + '</div>'
          + '<div class="row"><button class="btn grow" id="doAccuseBtn">🎯 Yes, Accuse ' + target.name + '!</button><button class="btn secondary grow" id="cancelAccuseBtn">Cancel</button></div>');

        const doAccuse = $('#doAccuseBtn');
        const cancelAccuse = $('#cancelAccuseBtn');
        if (doAccuse) doAccuse.onclick = () => {
          closeModal();
          g.guess(C, accusedIdx);
        };
        if (cancelAccuse) cancelAccuse.onclick = () => closeModal();
      });
    };

    // Tap-to-Guess Toggle
    const gm = $('#gModeBtn'); 
    if (gm) gm.onclick = () => { 
      if (!isMyTurn) return;
      C._gmode = !C._gmode; 
      Sound.click();
      C.rerender(); 
    };

    // Board Card Clicks: Manual Flip Door OR Final Guess
    R.querySelectorAll('[data-f]').forEach((el: any) => el.onclick = () => {
      const idx = +el.dataset.f;
      if (C._gmode && isMyTurn) {
        const target = deck[idx];
        const m = modal('<h3>🎯 Final Guess: ' + target.name + '?</h3>'
          + '<div style="margin:12px auto; max-width:120px;">' + target.renderSvg(false) + '</div>'
          + '<div class="muted center">Are you sure you want to guess <b>' + target.name + '</b>?<br>If correct, you win! If wrong, you lose immediately!</div>'
          + '<div class="row" style="margin-top:14px;"><button class="btn grow" id="confGuess">🎯 Yes, Accuse ' + target.name + '!</button><button class="btn secondary grow" id="canGuess">Cancel</button></div>');
        const conf = $('#confGuess');
        const can = $('#canGuess');
        if (conf) conf.onclick = () => {
          closeModal();
          g.guess(C, idx);
        };
        if (can) can.onclick = () => closeModal();
        return;
      }

      // Manual Flip Door Toggle
      C.elim[idx] = !C.elim[idx];
      Sound.click();
      C.rerender();
    });

    // Question button clicks
    R.querySelectorAll('[data-q]').forEach((b: any) => b.onclick = () => {
      if (!isMyTurn) return;
      g.ask(C, +b.dataset.q);
    });
  },

  ask(C: any, ai: number) {
    const S = C.S, g = this;
    const { deck } = getGwDeck(C, S);
    const me = C.isNet ? Net.mySeat() : C.cur();
    const other = 1 - me;
    const qInfo = GW_ATTRS[ai];

    const answer = () => {
      if (C.mode === 'pvc') {
        const secretChar = deck[C.priv.cpuSecret];
        const v = qInfo.test(secretChar);
        g.afterAnswer(C, ai, v);
        return;
      }
      if (C.isNet) {
        Net.inboxSend({ to: other, type: 'q', attr: ai, round: S.turn });
        toast('Question sent…');
        return;
      }
      const otherChar = deck[C.priv.secrets[other]];
      const m = modal('<h3>🙈 ' + esc(C.seatName(other)) + '</h3>'
        + '<div class="muted">Does YOUR secret character (' + esc(otherChar.name) + ') match: <b>' + qInfo.label + '</b>?</div>'
        + '<div class="row" style="margin-top:12px;"><button class="btn grow" data-a="1">✅ Yes</button><button class="btn secondary grow" data-a="0">❌ No</button></div>');
      m.querySelectorAll('[data-a]').forEach((b: any) => b.onclick = () => {
        closeModal();
        g.afterAnswer(C, ai, b.dataset.a === '1');
      });
    };
    answer();
  },

  afterAnswer(C: any, ai: number, yes: boolean) {
    const S = C.S;
    const { deck } = getGwDeck(C, S);
    const qInfo = GW_ATTRS[ai];
    const me = C.isNet ? Net.mySeat() : C.cur();

    let flippedCount = 0;
    deck.forEach((c, i) => {
      const match = qInfo.test(c);
      if (match !== yes) {
        if (!C.elim[i]) flippedCount++;
        C.elim[i] = true;
      }
    });

    if (!S.history) S.history = [];
    S.history.push({
      turn: S.turn,
      who: C.seatName(me),
      type: 'question',
      text: qInfo.label,
      answer: yes,
      elimCount: flippedCount
    });

    Sound.click();
    toast((yes ? '✅ Yes!' : '❌ No!') + ' — ' + qInfo.label + ' (' + flippedCount + ' faces flipped down)');
    S.turn = 1 - S.turn;
    C.update(() => {});
    maybeCpu(C);
  },

  guess(C: any, i: number) {
    const S = C.S;
    const { deck } = getGwDeck(C, S);
    const me = C.isNet ? Net.mySeat() : C.cur();
    const target = deck[i];

    if (C.isNet) {
      Net.inboxSend({ to: 1 - me, type: 'guess', idx: i });
      toast('Guess sent…');
      return;
    }
    const secret = C.mode === 'pvc' ? C.priv.cpuSecret : C.priv.secrets[1 - me];
    const correct = i === secret;

    if (!S.history) S.history = [];
    S.history.push({
      turn: S.turn,
      who: C.seatName(me),
      type: 'guess',
      target: target.name,
      correct
    });

    if (correct) {
      S.over = true;
      Sound.win();
      C.update(() => {});
      C.finish(me, '🎉 You correctly deduced ' + target.name + '! You WIN!');
    } else {
      S.over = true;
      Sound.lose();
      C.update(() => {});
      C.finish(1 - me, '❌ Wrong guess (' + target.name + ')! The secret character was ' + deck[secret].name + '.');
    }
  },

  inbox(C: any, msg: any) {
    const g = GAMES.guesswho;
    const my = Net.mySeat();
    if (msg.to !== my) return;
    const S = C.S;
    const { deck } = getGwDeck(C, S);

    if (msg.type === 'q') {
      const myChar = deck[C.priv.secrets[my]];
      const yes = GW_ATTRS[msg.attr].test(myChar);
      Net.inboxSend({ to: msg.from, type: 'a', attr: msg.attr, yes });
    }
    if (msg.type === 'a') {
      g.afterAnswer(C, msg.attr, msg.yes);
    }
    if (msg.type === 'guess') {
      const correct = msg.idx === C.priv.secrets[my];
      Net.inboxSend({ to: msg.from, type: 'guessResult', correct, idx: msg.idx });
      if (!S.history) S.history = [];
      S.history.push({
        turn: S.turn,
        who: C.seatName(1 - my),
        type: 'guess',
        target: deck[msg.idx].name,
        correct
      });
      if (correct) {
        S.over = true;
        Net.push({ state: S, status: 'over' });
        C.finish(1 - my, 'They guessed your secret ' + deck[msg.idx].name + '!');
      }
    }
    if (msg.type === 'guessResult') {
      const me = my;
      const target = deck[msg.idx];
      if (!S.history) S.history = [];
      S.history.push({
        turn: S.turn,
        who: C.seatName(me),
        type: 'guess',
        target: target.name,
        correct: msg.correct
      });
      if (msg.correct) {
        S.over = true;
        C.update(() => {});
        C.finish(me, 'You found ' + target.name + '! 🎉');
      } else {
        S.over = true;
        C.update(() => {});
        C.finish(1 - me, 'Wrong guess! Their character stays secret.');
      }
    }
  },

  cpu(C: any) {
    const S = C.S;
    const { deck } = getGwDeck(C, S);
    if (!C._cpuElim) C._cpuElim = Array(24).fill(false);

    cpuDelay(() => {
      const rem = deck.map((c, i) => i).filter(i => !C._cpuElim[i]);
      if (rem.length === 1) {
        const i = rem[0];
        const secret = C.priv.secrets[0];
        const correct = i === secret;
        if (!S.history) S.history = [];
        S.history.push({
          turn: S.turn,
          who: 'Computer',
          type: 'guess',
          target: deck[i].name,
          correct
        });

        if (correct) {
          S.over = true;
          C.update(() => {});
          C.finish(1, deck[i].name + ' — computer correctly guessed you!');
        } else {
          S.over = true;
          C.update(() => {});
          C.finish(0, 'Computer guessed ' + deck[i].name + ' — wrong! You win!');
        }
        return;
      }

      // Computer picks question that best splits remaining candidates
      let ba = 0, bs = -1;
      GW_ATTRS.forEach((a, ai) => {
        const y = rem.filter(i => a.test(deck[i])).length;
        const sc = Math.min(y, rem.length - y);
        if (sc > bs) { bs = sc; ba = ai; }
      });

      const chosenQ = GW_ATTRS[ba];
      const m = modal('<h3>🤖 Computer asks:</h3>'
        + '<div class="muted">' + chosenQ.label + '<br>Answer about YOUR secret character:</div>'
        + '<div class="row" style="margin-top:12px;"><button class="btn grow" data-a="1">✅ Yes</button><button class="btn secondary grow" data-a="0">❌ No</button></div>');
      m.querySelectorAll('[data-a]').forEach((b: any) => b.onclick = () => {
        closeModal();
        const yes = b.dataset.a === '1';
        let cpuFlipped = 0;
        rem.forEach(i => {
          if (chosenQ.test(deck[i]) !== yes) {
            C._cpuElim[i] = true;
            cpuFlipped++;
          }
        });
        if (!S.history) S.history = [];
        S.history.push({
          turn: S.turn,
          who: 'Computer',
          type: 'question',
          text: chosenQ.label,
          answer: yes,
          elimCount: cpuFlipped
        });
        toast('Computer eliminated ' + cpuFlipped + ' suspects.');
        S.turn = 0;
        C.update(() => {});
      });
    }, 900);
  }
});

/* ================= boot ================= */
window._C = null;
async function boot() {
  await Backend.init();
  Auth.init();
  UI.refresh();
  // In firebase mode, wait briefly for auth state before choosing the landing view
  if (Backend.mode === 'firebase') {
    let settled = false;
    await new Promise<void>(res => {
      const t = setTimeout(() => { if (!settled) { settled = true; res(); } }, 1500);
      Backend.onUser(() => { if (!settled) { settled = true; clearTimeout(t); res(); } });
    });
    UI.go(Auth.user ? 'home' : 'auth');
  } else {
    UI.go('home');
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
