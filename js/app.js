/**
 * التحكم الرئيسي في اللعبة: الشاشات، كلام الساحر، تأثيرات الخلفية،
 * وربط منطق التخمين (engine.js) بواجهة المستخدم.
 */

(() => {
  "use strict";

  const els = {
    stars: document.getElementById("stars"),
    speechText: document.getElementById("speechText"),
    speechBubble: document.getElementById("speechBubble"),
    progressWrap: document.getElementById("progressWrap"),
    progressFill: document.getElementById("progressFill"),
    panels: {
      welcome: document.getElementById("panelWelcome"),
      category: document.getElementById("panelCategory"),
      question: document.getElementById("panelQuestion"),
      guess: document.getElementById("panelGuess"),
      win: document.getElementById("panelWin"),
      lose: document.getElementById("panelLose"),
    },
    answers: document.getElementById("answers"),
    guessEmoji: document.getElementById("guessEmoji"),
    guessName: document.getElementById("guessName"),
    revealList: document.getElementById("revealList"),
    btnStart: document.getElementById("btnStart"),
    btnCorrect: document.getElementById("btnCorrect"),
    btnWrong: document.getElementById("btnWrong"),
    btnPlayAgainWin: document.getElementById("btnPlayAgainWin"),
    btnPlayAgainLose: document.getElementById("btnPlayAgainLose"),
    confetti: document.getElementById("confetti"),
  };

  /* ---------------- خلفية النجوم ---------------- */

  function buildStars(count = 70) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "star";
      const size = Math.random() * 2.4 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.animationDuration = `${2 + Math.random() * 3.5}s`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      frag.appendChild(star);
    }
    els.stars.appendChild(frag);
  }

  /* ---------------- كلام الساحر (تأثير الكتابة) ---------------- */

  let typeTimer = null;

  function say(text, { speed = 26 } = {}) {
    clearTimeout(typeTimer);
    els.speechText.textContent = "";
    els.speechText.classList.add("cursor");
    let i = 0;
    const step = () => {
      els.speechText.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        typeTimer = setTimeout(step, speed);
      } else {
        els.speechText.classList.remove("cursor");
      }
    };
    step();
  }

  /* ---------------- إدارة الشاشات ---------------- */

  function showPanel(name) {
    Object.entries(els.panels).forEach(([key, el]) => {
      const isActive = key === name;
      el.hidden = !isActive;
      if (isActive) {
        el.classList.remove("active");
        void el.offsetWidth;
        el.classList.add("active");
      }
    });
  }

  function setProgress(percent, visible) {
    els.progressWrap.hidden = !visible;
    if (visible) els.progressFill.style.width = `${percent}%`;
  }

  /* ---------------- حالة اللعبة ---------------- */

  const state = {
    mode: null,
    engine: null,
    numberRange: { min: 1, max: 100 },
  };

  function resetToCategory() {
    state.mode = null;
    state.engine = null;
    setProgress(0, false);
    say("اختار حاجة يا صاحبي، وأنا هخمّنها بالسحر! 🔮");
    showPanel("category");
  }

  /* ---------------- بدء اللعبة حسب الفئة ---------------- */

  function startMode(mode) {
    state.mode = mode;

    if (mode === "number") {
      state.engine = new NumberEngine(1, 100);
      say("فكّر في رقم من 1 لحد 100... وقولّي لمّا تكون جاهز! 🔢");
      setProgress(0, false);
      renderReadyButton(askNumberQuestion);
      return;
    }

    const data = GAME_DATA[mode];
    state.engine = new GuessEngine(data.questions, data.entities);
    say(`فكّر في ${data.noun}، وأنا هبدأ أسألك أسئلة! 🧠`);
    setProgress(4, true);
    renderReadyButton(askNextQuestion);
  }

  function renderReadyButton(onReady) {
    els.answers.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "جاهز! يلا اسأل 🎯";
    btn.addEventListener("click", onReady);
    els.answers.appendChild(btn);
    showPanel("question");
  }

  /* ---------------- وضع الرقم ---------------- */

  function askNumberQuestion() {
    const engine = state.engine;
    if (engine.isSolved()) {
      revealNumberGuess();
      return;
    }
    const mid = engine.currentGuess();
    const total = 100;
    const remaining = engine.high - engine.low + 1;
    const percent = Math.round(100 - (Math.log2(remaining) / Math.log2(total)) * 100);
    setProgress(Math.max(6, percent), true);

    say(`هل الرقم اللي في دماغك أكبر من ${mid}؟`);
    els.answers.innerHTML = "";

    const options = [
      { label: "أكبر 🔼", dir: "higher" },
      { label: "أصغر 🔽", dir: "lower" },
      { label: "ده هو بالظبط! 🎯", dir: "exact" },
    ];

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = opt.dir === "exact" ? "btn btn-yes" : "btn btn-primary";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        engine.answer(opt.dir);
        if (engine.isSolved()) {
          revealNumberGuess();
        } else {
          askNumberQuestion();
        }
      });
      els.answers.appendChild(btn);
    });
  }

  function revealNumberGuess() {
    setProgress(100, true);
    els.answers.innerHTML = "";
    const guess = state.engine.finalAnswer();
    say("قفلت عيني وشُفت الرقم... 🔮✨");
    setTimeout(() => {
      els.guessEmoji.textContent = "🔢";
      els.guessName.textContent = guess;
      showPanel("guess");
      setGuessButtonsEnabled(true);
      say(`رقمك هو ${guess}! صح ولا لأ؟`);
    }, 900);
  }

  /* ---------------- وضع الفاكهة / الشخصيات ---------------- */

  function askNextQuestion() {
    const engine = state.engine;

    if (engine.readyToGuess() || !engine.nextQuestion()) {
      revealEntityGuess();
      return;
    }

    const q = engine.nextQuestion();
    setProgress(engine.confidencePercent(), true);
    say(q.text);

    els.answers.innerHTML = "";
    const options = [
      { label: "أيوة 👍", value: 1, cls: "btn-yes" },
      { label: "لأ 👎", value: 0, cls: "btn-no" },
      { label: "مش متأكد 🤔", value: 0.5, cls: "btn-neutral" },
    ];

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = `btn ${opt.cls}`;
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        engine.answer(q.key, opt.value);
        askNextQuestion();
      });
      els.answers.appendChild(btn);
    });
  }

  function revealEntityGuess() {
    const guess = state.engine.currentGuess();
    setProgress(state.engine.confidencePercent(), true);

    if (!guess) {
      showLose();
      return;
    }

    els.answers.innerHTML = "";
    say("قفلت عيني وشُفت اللي في دماغك... 🔮✨");
    setTimeout(() => {
      els.guessEmoji.textContent = guess.emoji;
      els.guessName.textContent = guess.name;
      showPanel("guess");
      setGuessButtonsEnabled(true);
      say(`أعتقد إنها... ${guess.name}! صح ولا لأ؟`);
    }, 900);
  }

  /* ---------------- الفوز ---------------- */

  function showWin() {
    say("يا سلااام! عرفتها بالسحر! 🎉🧙‍♂️");
    showPanel("win");
    launchConfetti();
  }

  /* ---------------- الخسارة (للفاكهة/الشخصيات فقط) ---------------- */

  function showLose() {
    say("قلبتها عليّ! بس المرة الجاية هعرفها أكيد 😄");
    const data = GAME_DATA[state.mode];
    els.revealList.innerHTML = "";
    data.entities.forEach((e) => {
      const chip = document.createElement("span");
      chip.className = "reveal-chip";
      chip.textContent = `${e.emoji} ${e.name}`;
      els.revealList.appendChild(chip);
    });
    showPanel("lose");
  }

  function setGuessButtonsEnabled(enabled) {
    els.btnCorrect.disabled = !enabled;
    els.btnWrong.disabled = !enabled;
  }

  function tryAgainAfterWrongGuess() {
    setGuessButtonsEnabled(false);
    if (state.mode === "number") {
      showLose();
      return;
    }
    const engine = state.engine;
    engine.rejectCurrentGuess();
    if (engine.canTryAgain()) {
      say("هممم، خليني أفكر تاني... 🤔");
      setTimeout(() => askNextQuestion(), 500);
    } else {
      showLose();
    }
  }

  /* ---------------- الاحتفال بالكونفيتي ---------------- */

  function launchConfetti() {
    const canvas = els.confetti;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight || 320;
    const ctx = canvas.getContext("2d");
    const colors = ["#ffcf5c", "#ff6fb7", "#6fe3ff", "#a78bfa", "#52e0a1"];

    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      size: 5 + Math.random() * 6,
      speed: 2 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 2,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let frame = 0;
    const maxFrames = 220;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.y += p.speed;
        p.x += p.drift;
        p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  }

  /* ---------------- ربط الأحداث ---------------- */

  els.btnStart.addEventListener("click", () => {
    resetToCategory();
  });

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => startMode(card.dataset.mode));
  });

  els.btnCorrect.addEventListener("click", showWin);
  els.btnWrong.addEventListener("click", tryAgainAfterWrongGuess);

  els.btnPlayAgainWin.addEventListener("click", resetToCategory);
  els.btnPlayAgainLose.addEventListener("click", resetToCategory);

  /* ---------------- البداية ---------------- */

  buildStars();
  say("مرحبًا يا صديقي الصغير! أنا الساحر مرلين 🧙‍♂️✨ جاهز تلعب معايا؟");
})();
