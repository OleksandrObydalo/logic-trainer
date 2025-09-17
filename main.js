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

/* ...existing code... */
let timerId = null;
let timeLeft = 60;
let score = 0;
let correct = 0;
let wrong = 0;
let currentAnswer = null;
let running = false;
/* ...existing code... */

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randBool() { return Math.random() < 0.5; }

function makeBracket(op) {
  const nArgs = randInt(2, 4);
  const vals = Array.from({ length: nArgs }, () => randBool());
  let value = vals.reduce((acc, v) => (op === 'AND' ? acc && v : acc || v), op === 'AND');
  const opSym = op === 'AND' ? '^' : 'V';
  const opCls = op === 'AND' ? 'and' : 'or';
  const txtInside = vals.map(v => (v ? 'T' : 'F')).join(` <span class="op ${opCls}">${opSym}</span> `);
  let html = `(${txtInside})`;
  if (randBool()) { value = !value; html = `<span class="op not">¬</span>${html}`; }
  return { html, value };
}

function generateExpression() {
  const innerOp = randBool() ? 'AND' : 'OR';
  const joinOp = innerOp === 'AND' ? 'OR' : 'AND';
  const nBrackets = randInt(2, 4);

  const parts = [];
  const values = [];
  for (let i = 0; i < nBrackets; i++) {
    const b = makeBracket(innerOp);
    parts.push(b.html);
    values.push(b.value);
  }
  const joinSym = joinOp === 'AND' ? '^' : 'V';
  const joinCls = joinOp === 'AND' ? 'and' : 'or';
  const html = parts.join(` <span class="op ${joinCls}">${joinSym}</span> `);
  const value = values.reduce((acc, v) => (joinOp === 'AND' ? acc && v : acc || v), joinOp === 'AND');

  return { html, value };
}

function setExpression(expr) {
  exprEl.innerHTML = expr.html || expr.text;
  exprEl.classList.remove('pop');
  // micro-pop
  requestAnimationFrame(() => {
    exprEl.classList.add('pop');
    setTimeout(() => exprEl.classList.remove('pop'), 140);
  });
  currentAnswer = expr.value;
}

function nextRound() {
  const expr = generateExpression();
  setExpression(expr);
  hintEl.textContent = 'Answer T or F';
}

function updateStats() {
  timeEl.textContent = String(timeLeft);
  scoreEl.textContent = String(score);
  correctEl.textContent = String(correct);
  wrongEl.textContent = String(wrong);
}

function setButtons(enabled) {
  btnTrue.disabled = !enabled;
  btnFalse.disabled = !enabled;
}

function startGame() {
  if (running) return;
  running = true;
  timeLeft = 60;
  score = 0; correct = 0; wrong = 0;
  updateStats();
  setButtons(true);
  startBtn.hidden = true;
  restartBtn.hidden = true;
  nextRound();
  timerId = setInterval(() => {
    timeLeft--;
    timeLeft = Math.max(0, timeLeft);
    updateStats();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  if (!running) return;
  running = false;
  clearInterval(timerId);
  setButtons(false);
  hintEl.textContent = `Time's up. Correct: ${correct}, Wrong: ${wrong}, Final score: ${score}`;
  restartBtn.hidden = false;
}

function handleAnswer(ans) {
  if (!running) return;
  const isCorrect = ans === currentAnswer;
  if (isCorrect) { score += 1; correct += 1; hintEl.textContent = 'Correct! +1'; }
  else { score -= 1; wrong += 1; hintEl.textContent = 'Wrong! -1'; }
  updateStats();
  // brief delay before next question
  setTimeout(nextRound, 200);
}

/* ...existing code... */
btnTrue.addEventListener('click', () => handleAnswer(true));
btnFalse.addEventListener('click', () => handleAnswer(false));
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
window.addEventListener('keydown', (e) => {
  if (!running) return;
  if (e.key.toLowerCase() === 't') handleAnswer(true);
  if (e.key.toLowerCase() === 'f') handleAnswer(false);
});
/* ...existing code... */

// Initialize idle state with a fresh expression preview (buttons disabled)
setButtons(false);
setExpression(generateExpression());
hintEl.textContent = 'Press Start to begin. 60 seconds to score as high as you can. Answer T or F.';