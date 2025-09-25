const timeEl = document.getElementById('time');
const scoreEl = document.getElementById('score');
const correctEl = document.getElementById('correct');
const wrongEl = document.getElementById('wrong');
const exprEl = document.getElementById('expression');
const hintEl = document.getElementById('hint');
const btnTrue = document.getElementById('btnTrue');
const btnFalse = document.getElementById('btnFalse');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const maxOperandsInput = document.getElementById('maxOperands');
const maxBracketsInput = document.getElementById('maxBrackets');
const ptsPerAnswerEl = document.getElementById('ptsPerAnswer');
const totalScoreEl = document.getElementById('totalScore');
const stopBtn = document.getElementById('stopBtn');
const pauseBtn = document.getElementById('pauseBtn');
const homeView = document.getElementById('homeView');
const gameView = document.getElementById('gameView');
const homeStartBtn = document.getElementById('homeStartBtn');
const homeTotalEl = document.getElementById('homeTotal');
const buyImpBtn = document.getElementById('buyImpBtn');
const impLegend = document.getElementById('impLegend');
const impLegendText = document.getElementById('impLegendText');
const opImpCard = document.getElementById('opImpCard');
const openLoginBtn = document.getElementById('openLoginBtn');
const openSignupBtn = document.getElementById('openSignupBtn');
const acctLoginView = document.getElementById('acctLoginView');
const acctCreateView = document.getElementById('acctCreateView');
const loginViewLogin = document.getElementById('loginViewLogin');
const loginViewPass = document.getElementById('loginViewPass');
const loginViewBtn = document.getElementById('loginViewBtn');
const loginBackBtn = document.getElementById('loginBackBtn');
const createLoginInput = document.getElementById('createLogin');
const createPassInput = document.getElementById('createPass');
const createBtn = document.getElementById('createBtn');
const createBackBtn = document.getElementById('createBackBtn');
const acctLogoutBtn = document.getElementById('acctLogoutBtn');
const acctLoggedIn = document.getElementById('acctLoggedIn');
const acctLoggedOut = document.getElementById('acctLoggedOut');
const acctNameEl = document.getElementById('acctName');

let timerId = null;
let timeLeft = 60;
let score = 0;
let correct = 0;
let wrong = 0;
let currentAnswer = null;
let running = false;
let totalScore = Number(localStorage.getItem('logicTrainerTotalScore') || '0');
let pointValue = 0;
let paused = false;
let owned = JSON.parse(localStorage.getItem('logicTrainerOwnedOps') || '{"IMP":false}');
let enabled = JSON.parse(localStorage.getItem('logicTrainerEnabledOps') || '{"IMP":false}');

// extend defaults for new ops
owned = Object.assign({ LE: false, EQ: false }, owned);
enabled = Object.assign({ LE: false, EQ: false }, enabled);

// Accounts and current user loaded from localStorage
let accounts = JSON.parse(localStorage.getItem('logicTrainerAccounts') || '{}');
let currentUser = localStorage.getItem('logicTrainerCurrentUser') || null;

function saveOwnership() { localStorage.setItem('logicTrainerOwnedOps', JSON.stringify(owned)); }
function saveEnabled() { localStorage.setItem('logicTrainerEnabledOps', JSON.stringify(enabled)); }
function saveAllAccounts() { localStorage.setItem('logicTrainerAccounts', JSON.stringify(accounts)); }
function setCurrentUser(name) { currentUser = name; if (name) localStorage.setItem('logicTrainerCurrentUser', name); else localStorage.removeItem('logicTrainerCurrentUser'); }

function showLoginForm() {
  acctLoggedOut.hidden = true; acctLoggedIn.hidden = true;
  acctCreateView.hidden = true; acctLoginView.hidden = false;
}
function showSignupForm() {
  acctLoggedOut.hidden = true; acctLoggedIn.hidden = true;
  acctLoginView.hidden = true; acctCreateView.hidden = false;
}
function hideAuthForms() {
  acctCreateView.hidden = true; acctLoginView.hidden = true;
  acctLoggedOut.hidden = false;
}

function showHome() {
  homeView.hidden = false; homeView.setAttribute('aria-hidden','false');
  gameView.hidden = true; gameView.setAttribute('aria-hidden','true');
  // show account UI
  if (currentUser && accounts[currentUser]) {
    acctLoggedOut.hidden = true; acctLoggedIn.hidden = false;
    acctNameEl.textContent = currentUser;
  } else {
    hideAuthForms();
    acctLoggedIn.hidden = true;
  }
  homeTotalEl.textContent = String(totalScore);
  buyImpBtn.hidden = owned.IMP; document.getElementById('impOwnedTag').hidden = !owned.IMP;
  opImpCard.hidden = !owned.IMP;
  opImpCard.classList.toggle('selected', !!enabled.IMP);
  opImpCard.setAttribute('aria-pressed', enabled.IMP ? 'true' : 'false');
  impLegend.hidden = !owned.IMP; impLegendText.hidden = !owned.IMP;
  
  // LE
  const buyLeBtnEl = document.getElementById('buyLeBtn');
  const leOwnedTag = document.getElementById('leOwnedTag');
  buyLeBtnEl.hidden = owned.LE; leOwnedTag.hidden = !owned.LE;
  opLeCard.hidden = !owned.LE;
  opLeCard.classList.toggle('selected', !!enabled.LE);
  opLeCard.setAttribute('aria-pressed', enabled.LE ? 'true' : 'false');
  
  // EQ
  const buyEqBtnEl = document.getElementById('buyEqBtn');
  const eqOwnedTag = document.getElementById('eqOwnedTag');
  buyEqBtnEl.hidden = owned.EQ; eqOwnedTag.hidden = !owned.EQ;
  opEqCard.hidden = !owned.EQ;
  opEqCard.classList.toggle('selected', !!enabled.EQ);
  opEqCard.setAttribute('aria-pressed', enabled.EQ ? 'true' : 'false');
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randBool() { return Math.random() < 0.5; }

function evalBin(op, a, b) {
  if (op === 'AND') return a && b;
  if (op === 'OR') return a || b;
  if (op === 'IMP') return (!a) || b;
  if (op === 'LE') return (!b) || a; // X <= Y defined as Y => X
  if (op === 'EQ') return (a && b) || (!a && !b); // equivalence (biconditional)
  return false;
}

function makeBracket(op, maxOperands) {
  const forceBinary = (op === 'IMP' || op === 'LE' || op === 'EQ');
  const nArgs = forceBinary ? 2 : randInt(2, Math.max(2, maxOperands));
  const vals = Array.from({ length: nArgs }, () => randBool());
  let value = vals.reduce((acc, v) => evalBin(op, acc, v), (op === 'AND'));
  const map = { AND: { sym: '∧', cls: 'and' }, OR: { sym: '∨', cls: 'or' }, IMP: { sym: '→', cls: 'imp' } };
  map.LE = { sym: '←', cls: 'le' };
  map.EQ = { sym: '↔', cls: 'eq' };
  const info = map[op];
  const txtInside = vals.map(v => (v ? 'T' : 'F')).join(` <span class="op ${info.cls}">${info.sym}</span> `);
  let html = `(${txtInside})`, notUsed = false;
  if (randBool()) { value = !value; html = `<span class="op not">¬</span>${html}`; notUsed = true; }
  return { html, value, operatorCount: (nArgs - 1) + (notUsed ? 1 : 0) };
}

function generateExpression(maxOperands = 4, maxBrackets = 2) {
  const canUseImp = owned.IMP && enabled.IMP;
  const canUseLe = owned.LE && enabled.LE;
  const canUseEq = owned.EQ && enabled.EQ;
  const innerOps = ['AND','OR'].concat(canUseImp ? ['IMP'] : []);
  if (canUseLe) innerOps.push('LE');
  if (canUseEq) innerOps.push('EQ');
  const joinOps = ['AND','OR'].concat(canUseImp ? ['IMP'] : []);
  if (canUseLe) joinOps.push('LE');
  if (canUseEq) joinOps.push('EQ');
  const innerOp = innerOps[randInt(0, innerOps.length - 1)];
  let joinOp = joinOps[randInt(0, joinOps.length - 1)];
  let nBrackets = (joinOp === 'IMP' || joinOp === 'LE' || joinOp === 'EQ') ? 2 : randInt(1, Math.max(1, maxBrackets));
  if (nBrackets === 1 && joinOp === 'IMP') nBrackets = 2;
  const parts = [], values = []; let opCount = 0;
  for (let i = 0; i < nBrackets; i++) {
    const b = makeBracket(innerOp, maxOperands);
    parts.push(b.html); values.push(b.value); opCount += b.operatorCount;
  }
  const map = { AND: { sym: '∧', cls: 'and' }, OR: { sym: '∨', cls: 'or' }, IMP: { sym: '→', cls: 'imp' } };
  map.LE = { sym: '←', cls: 'le' };
  map.EQ = { sym: '↔', cls: 'eq' };
  const joinHtml = ` <span class="op ${map[joinOp].cls}">${map[joinOp].sym}</span> `;
  const html = parts.join(joinHtml);
  const value = values.reduce((acc, v) => evalBin(joinOp, acc, v));
  opCount += Math.max(0, nBrackets - 1);
  return { html, value, operatorCount: opCount };
}

let currPointValue = 0;
function baseFactor() { return Math.max(0, (getMaxOperands() - 1) * getMaxBrackets()); }
function setExpression(expr) {
  exprEl.innerHTML = expr.html || expr.text;
  exprEl.classList.remove('pop');
  requestAnimationFrame(() => { exprEl.classList.add('pop'); setTimeout(() => exprEl.classList.remove('pop'), 140); });
  currentAnswer = expr.value;
  currPointValue = expr.operatorCount * baseFactor();
  ptsPerAnswerEl.textContent = String(currPointValue);
}

function nextRound() {
  const expr = generateExpression(getMaxOperands(), getMaxBrackets());
  setExpression(expr);
  hintEl.textContent = 'Answer T or F';
}

function updateStats() {
  timeEl.textContent = String(timeLeft);
  scoreEl.textContent = String(score);
  correctEl.textContent = String(correct);
  wrongEl.textContent = String(wrong);
  totalScoreEl.textContent = String(totalScore);
  ptsPerAnswerEl.textContent = String(currPointValue);
}

function setButtons(enabled) {
  btnTrue.disabled = !enabled;
  btnFalse.disabled = !enabled;
  maxOperandsInput.disabled = running;
  maxBracketsInput.disabled = running;
}

function getMaxOperands() {
  return Math.max(2, parseInt(maxOperandsInput.value || '4', 10));
}
function getMaxBrackets() {
  return Math.max(1, parseInt(maxBracketsInput.value || '2', 10));
}

function startGame() {
  if (running) return;
  running = true;
  timeLeft = 60; score = 0; correct = 0; wrong = 0;
  updateStats(); setButtons(true);
  startBtn.hidden = true; restartBtn.hidden = true; stopBtn.hidden = false;
  paused = false; pauseBtn.hidden = false; pauseBtn.textContent = 'Pause';
  homeView.hidden = true; homeView.setAttribute('aria-hidden','true');
  gameView.hidden = false; gameView.setAttribute('aria-hidden','false');
  nextRound();
  timerId = setInterval(() => { if (paused) return; timeLeft--; timeLeft = Math.max(0, timeLeft); updateStats(); if (timeLeft <= 0) endGame(); }, 1000);
}

function endGame() {
  if (!running) return;
  running = false; paused = false; pauseBtn.hidden = true;
  clearInterval(timerId); setButtons(false);
  hintEl.textContent = `Time's up. Correct: ${correct}, Wrong: ${wrong}, Final score: ${score}`;
  restartBtn.hidden = false; stopBtn.hidden = true;
  setTimeout(() => showHome(), 400);
}

function handleAnswer(ans) {
  if (!running) return;
  const isCorrect = ans === currentAnswer;
  if (isCorrect) { score += currPointValue; correct += 1; totalScore += currPointValue; hintEl.textContent = `Correct! +${currPointValue}`; }
  else { score -= currPointValue; wrong += 1; totalScore -= currPointValue; hintEl.textContent = `Wrong! -${currPointValue}`; }
  localStorage.setItem('logicTrainerTotalScore', String(totalScore));
  // persist to current user's account if logged in
  if (currentUser && accounts[currentUser]) {
    accounts[currentUser].total = Number(totalScore);
    accounts[currentUser].owned = owned;
    accounts[currentUser].enabled = enabled;
    saveAllAccounts();
  }
  updateStats();
  setTimeout(nextRound, 200);
}

btnTrue.addEventListener('click', () => handleAnswer(true));
btnFalse.addEventListener('click', () => handleAnswer(false));
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', endGame);
pauseBtn.addEventListener('click', () => {
  if (!running) return;
  if (!paused) {
    paused = true; setButtons(false); pauseBtn.textContent = 'Resume';
    hintEl.textContent = 'Paused. Press Resume to continue.';
  } else {
    paused = false; pauseBtn.textContent = 'Pause'; nextRound();
  }
});
window.addEventListener('keydown', (e) => {
  if (!running) return;
  if (e.key.toLowerCase() === 't') handleAnswer(true);
  if (e.key.toLowerCase() === 'f') handleAnswer(false);
});

[maxOperandsInput, maxBracketsInput].forEach(el => {
  el.addEventListener('input', () => {
    if (running) return;
    const maxOps = getMaxOperands(), maxBr = getMaxBrackets();
    pointValue = Math.max(0, (maxOps - 1) * maxBr);
    updateStats();
    setExpression(generateExpression(maxOps, maxBr));
    hintEl.textContent = `Press Start. 60s. Points per correct: ${pointValue}. Answer T or F.`;
  });
});

homeStartBtn.addEventListener('click', startGame);
openLoginBtn.addEventListener('click', showLoginForm);
openSignupBtn.addEventListener('click', showSignupForm);
loginBackBtn.addEventListener('click', hideAuthForms);
createBackBtn.addEventListener('click', hideAuthForms);
loginViewBtn.addEventListener('click', () => {
  const login = (loginViewLogin.value || '').trim();
  const pass = (loginViewPass.value || '').trim();
  if (!login || !pass) { alert('Enter login and password'); return; }
  if (!accounts[login] || accounts[login].password !== pass) { alert('Invalid credentials'); return; }
  setCurrentUser(login);
  loadAccount(login);
});
createBtn.addEventListener('click', () => {
  const login = (createLoginInput.value || '').trim();
  const pass = (createPassInput.value || '').trim();
  if (!login || !pass) { alert('Enter login and password'); return; }
  if (accounts[login]) { alert('Login already exists'); return; }
  accounts[login] = { password: pass, total: 0, owned: { IMP:false, LE:false, EQ:false }, enabled: { IMP:false, LE:false, EQ:false } };
  saveAllAccounts();
  setCurrentUser(login);
  loadAccount(login);
});
buyImpBtn.addEventListener('click', () => {
  if (owned.IMP) return;
  const cost = 120;
  if (totalScore >= cost) {
    totalScore -= cost;
    owned.IMP = true; saveOwnership();
    localStorage.setItem('logicTrainerTotalScore', String(totalScore));
    saveAccountState();
    updateStats(); showHome();
  }
});

const buyLeBtn = document.getElementById('buyLeBtn');
const buyEqBtn = document.getElementById('buyEqBtn');
const opLeCard = document.getElementById('opLeCard');
const opEqCard = document.getElementById('opEqCard');

buyLeBtn.addEventListener('click', () => {
  if (owned.LE) return;
  const cost = 120;
  if (totalScore >= cost) {
    totalScore -= cost; owned.LE = true; saveOwnership();
    localStorage.setItem('logicTrainerTotalScore', String(totalScore)); updateStats(); showHome();
    saveAccountState();
  }
});

buyEqBtn.addEventListener('click', () => {
  if (owned.EQ) return;
  const cost = 120;
  if (totalScore >= cost) {
    totalScore -= cost; owned.EQ = true; saveOwnership();
    localStorage.setItem('logicTrainerTotalScore', String(totalScore)); updateStats(); showHome();
    saveAccountState();
  }
});

opLeCard.addEventListener('click', () => {
  if (!owned.LE) return;
  enabled.LE = !enabled.LE; saveEnabled();
  opLeCard.classList.toggle('selected', enabled.LE);
  opLeCard.setAttribute('aria-pressed', enabled.LE ? 'true' : 'false');
});

opEqCard.addEventListener('click', () => {
  if (!owned.EQ) return;
  enabled.EQ = !enabled.EQ; saveEnabled();
  opEqCard.classList.toggle('selected', enabled.EQ);
  opEqCard.setAttribute('aria-pressed', enabled.EQ ? 'true' : 'false');
});

/* Added: allow toggling IMP card when owned */
opImpCard.addEventListener('click', () => {
  if (!owned.IMP) return;
  enabled.IMP = !enabled.IMP; saveEnabled();
  opImpCard.classList.toggle('selected', enabled.IMP);
  opImpCard.setAttribute('aria-pressed', enabled.IMP ? 'true' : 'false');
});

function loadAccount(name) {
  const acc = accounts[name];
  if (!acc) return;
  totalScore = Number(acc.total || 0);
  owned = Object.assign({ IMP:false, LE:false, EQ:false }, acc.owned || {});
  enabled = Object.assign({ IMP:false, LE:false, EQ:false }, acc.enabled || {});
  saveOwnership(); saveEnabled(); localStorage.setItem('logicTrainerTotalScore', String(totalScore));
  setCurrentUser(name);
  updateStats(); showHome();
}

function saveAccountState() {
  if (!currentUser) return;
  accounts[currentUser] = accounts[currentUser] || {};
  accounts[currentUser].password = accounts[currentUser].password || accounts[currentUser].password; // keep existing
  accounts[currentUser].total = Number(totalScore);
  accounts[currentUser].owned = owned;
  accounts[currentUser].enabled = enabled;
  saveAllAccounts();
}

acctSignupBtn.addEventListener('click', () => {
  // removed: replaced by separate create form
});

// removed: login is handled by loginViewBtn

// Initialize
setButtons(false);
pointValue = Math.max(0, (getMaxOperands() - 1) * getMaxBrackets()); // kept for backward display, currPointValue overrides per question
setExpression(generateExpression(getMaxOperands(), getMaxBrackets()));
hintEl.textContent = `Press Start to begin. 60 seconds to score high.`;
updateStats();
// load current user if present
if (currentUser && accounts[currentUser]) { loadAccount(currentUser); } else { showHome(); }