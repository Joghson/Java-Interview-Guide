// ============================================================
// Java面试通 - App核心逻辑
// ============================================================

const STORAGE_KEY = "java_interview_app_v1";
const DAILY_GOAL = 10; // 每日目标题数

// ---------- 状态管理 ----------
let state = loadState();

function defaultState() {
  return {
    xp: 0,
    gems: 0,
    hearts: 5,
    streak: 0,
    lastActiveDate: null,
    todayAnswered: 0,
    todayDate: todayStr(),
    totalAnswered: 0,
    correctCount: 0,
    completedLessons: {},   // lessonId -> true
    answeredQuestions: {},  // questionKey -> true (用于模块进度)
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      // 跨日重置今日数据
      if (s.todayDate !== todayStr()) {
        // 连续打卡判定
        if (s.lastActiveDate === yesterdayStr()) {
          s.streak = (s.streak || 0) + 1;
        } else if (s.lastActiveDate !== todayStr()) {
          s.streak = s.todayAnswered > 0 ? 1 : 0;
        }
        s.todayDate = todayStr();
        s.todayAnswered = 0;
      }
      return { ...defaultState(), ...s };
    }
  } catch (e) { console.warn(e); }
  return defaultState();
}

function saveState() {
  state.lastActiveDate = todayStr();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

// ---------- 工具 ----------
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLevel(xp) {
  // 每100xp升一级
  const lv = Math.floor(xp / 100) + 1;
  const titles = ["入门菜鸟", "初级开发", "中级工程师", "高级工程师", "架构师", "技术专家", "技术大牛"];
  return { lv, title: titles[Math.min(lv - 1, titles.length - 1)] };
}

// ---------- 视图路由 ----------
function showView(name) {
  $$(".view").forEach(v => v.classList.remove("active"));
  $(`#view-${name}`).classList.add("active");
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
  $("#topbar").style.display = name === "learn" ? "flex" : "none";
  // 答题视图隐藏底部导航（有自己的操作条）
  $(".tabbar").style.display = name === "quiz" ? "none" : "flex";
  document.getElementById("app").scrollTop = 0;
}

$$(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const v = tab.dataset.view;
    if (v === "profile") renderProfile();
    showView(v);
  });
});

// ---------- 渲染：学习路径 ----------
function renderLearn() {
  // 顶部统计
  $("#stat-streak").textContent = state.streak;
  $("#stat-gem").textContent = state.gems;
  $("#stat-heart").textContent = state.hearts;

  // 每日目标环
  const goalPct = Math.min(100, Math.round(state.todayAnswered / DAILY_GOAL * 100));
  $("#goal-done").textContent = state.todayAnswered;
  $("#goal-total").textContent = DAILY_GOAL;
  $("#goal-pct").textContent = goalPct + "%";
  const circumference = 2 * Math.PI * 18;
  $("#goal-ring").setAttribute("stroke-dasharray", circumference);
  $("#goal-ring").setAttribute("stroke-dashoffset", circumference * (1 - goalPct / 100));

  // 问候语
  const h = new Date().getHours();
  const greet = h < 6 ? "夜深了，注意休息" : h < 12 ? "早上好，开始刷题吧" : h < 14 ? "午后好，刷几道题醒醒脑" : h < 18 ? "下午好，继续加油" : "晚上好，复盘今日所学";
  $("#hero-greeting").textContent = greet;

  // 路径
  const path = $("#path");
  path.innerHTML = "";

  // 找到第一个未完成的lesson（当前节点）
  const allLessons = [];
  QUESTION_BANK.forEach(m => m.lessons.forEach(l => allLessons.push({ ...l, module: m.module, icon: m.icon, color: m.color })));
  let currentFound = false;

  QUESTION_BANK.forEach((module, mi) => {
    // 单元标题
    const unit = document.createElement("div");
    unit.className = "unit";
    const doneInModule = module.lessons.filter(l => state.completedLessons[l.id]).length;
    unit.innerHTML = `
      <div class="unit-header">
        <div class="u-icon" style="background:${module.color}">${module.icon}</div>
        <div>
          <div class="u-title">${module.module}</div>
          <div class="u-sub">${doneInModule}/${module.lessons.length} 关已通过</div>
        </div>
      </div>
    `;
    path.appendChild(unit);

    // 每个lesson一个节点，蛇形排列
    module.lessons.forEach((lesson, li) => {
      const row = document.createElement("div");
      row.className = "node-row " + (li % 2 === 0 ? "left" : "right");

      const isDone = !!state.completedLessons[lesson.id];
      // 锁定条件：上一课未完成（同一模块内）
      let isLocked = false;
      if (!isDone) {
        if (li > 0) {
          isLocked = !state.completedLessons[module.lessons[li - 1].id];
        }
        // 第一个模块的第一课不锁
      }
      const isCurrent = !isDone && !isLocked && !currentFound;
      if (isCurrent) currentFound = true;

      const node = document.createElement("div");
      node.className = "node" + (isDone ? " done" : "") + (isLocked ? " locked" : "") + (isCurrent ? " current" : "");
      node.innerHTML = `
        <div class="n-icon">${isDone ? "⭐" : lesson.icon || module.icon}</div>
        <div class="n-title">${lesson.title}</div>
      `;
      if (!isLocked) {
        node.addEventListener("click", () => startLesson(lesson, module));
      } else {
        node.innerHTML += `<div style="position:absolute;font-size:18px;top:-4px;right:-4px;">🔒</div>`;
      }
      row.appendChild(node);
      path.appendChild(row);
    });
  });
}

// ---------- 答题流程 ----------
let quiz = null; // 当前答题会话

function startLesson(lesson, module) {
  const questions = shuffle(lesson.questions);
  quiz = {
    type: "lesson",
    module,
    lesson,
    questions,
    index: 0,
    correct: 0,
    startedAt: Date.now(),
    answeredKeys: [],
  };
  $("#quiz-header").style.display = "flex";
  showView("quiz");
  renderQuestion();
}

function startDailyChallenge() {
  const all = getAllQuestions();
  const pool = shuffle(all).slice(0, 10);
  quiz = {
    type: "daily",
    module: null,
    lesson: { title: "每日挑战" },
    questions: pool,
    index: 0,
    correct: 0,
    startedAt: Date.now(),
    answeredKeys: [],
  };
  $("#quiz-header").style.display = "flex";
  showView("quiz");
  renderQuestion();
}

$("#daily-card").addEventListener("click", startDailyChallenge);

function renderQuestion() {
  const q = quiz.questions[quiz.index];
  const total = quiz.questions.length;
  $("#quiz-progress").style.width = `${(quiz.index / total) * 100}%`;
  $("#q-counter").textContent = `${quiz.index + 1}/${total}`;

  const body = $("#quiz-body");
  hideFeedback();

  if (q.type === "flashcard") {
    body.innerHTML = `
      <div class="quiz-badge">${quiz.module ? quiz.module.module : "🎯 每日挑战"} · 闪卡</div>
      <div class="quiz-question">${q.q}</div>
      <div class="flashcard" id="flashcard">
        <span class="flip-icon">🔄</span>
        <div class="fc-hint">点击卡片查看答案</div>
        <div class="fc-face question" id="fc-face">${q.a.split("\n")[0]}</div>
      </div>
    `;
    let flipped = false;
    const card = $("#flashcard");
    const face = $("#fc-face");
    card.addEventListener("click", () => {
      flipped = !flipped;
      if (flipped) {
        face.classList.add("answer");
        face.innerHTML = q.a.replace(/\n/g, "<br>") +
          (q.tip ? `<div class="fc-tip">💡 ${q.tip}</div>` : "");
        $(".fc-hint", card).textContent = "已显示答案";
      } else {
        face.classList.remove("answer");
        face.innerHTML = q.a.split("\n")[0];
        $(".fc-hint", card).textContent = "点击卡片查看答案";
      }
    });
    // 闪卡：按钮显示"我记住了"
    $("#btn-check").textContent = "记住了";
    $("#btn-check").disabled = false;
  } else if (q.type === "choice") {
    const letters = ["A", "B", "C", "D"];
    body.innerHTML = `
      <div class="quiz-badge">${quiz.module ? quiz.module.module : "🎯 每日挑战"} · 选择题</div>
      <div class="quiz-question">${q.q}</div>
      <div class="options" id="options">
        ${q.options.map((opt, i) => `
          <button class="option" data-i="${i}">
            <span class="opt-letter">${letters[i]}</span>
            <span>${opt}</span>
          </button>
        `).join("")}
      </div>
    `;
    $$(".option").forEach(opt => {
      opt.addEventListener("click", () => selectOption(opt));
    });
    $("#btn-check").textContent = "检查";
    $("#btn-check").disabled = true;
    quiz.selected = null;
  }

  // 重置反馈条和按钮
  $("#quiz-footer").style.display = "flex";
  $("#btn-skip").textContent = "跳过";
  $("#btn-skip").style.display = "block";
  $("#btn-check").onclick = checkHandler;
}

function selectOption(opt) {
  if (quiz.answered) return;
  $$(".option").forEach(o => o.classList.remove("selected"));
  opt.classList.add("selected");
  quiz.selected = parseInt(opt.dataset.i);
  $("#btn-check").disabled = false;
}

function checkHandler() {
  if (quiz.answered) return;
  const q = quiz.questions[quiz.index];
  if (q.type === "flashcard") {
    quiz.correct++;
    state.correctCount++;
    showFeedback(true, "记住啦！", q.tip ? `💡 ${q.tip}` : "继续保持！");
    markAnswered(q);
  } else if (q.type === "choice") {
    if (quiz.selected === q.answer) {
      quiz.correct++;
      state.correctCount++;
      $$(".option")[quiz.selected].classList.add("correct");
      showFeedback(true, "回答正确！", q.tip ? `💡 ${q.tip}` : "太棒了！");
    } else {
      $$(".option")[quiz.selected].classList.add("wrong");
      $$(".option")[q.answer].classList.add("correct");
      const correctText = q.options[q.answer];
      showFeedback(false, "答错了～", `正确答案：${correctText}\n${q.tip ? "💡 " + q.tip : ""}`);
      state.hearts = Math.max(0, state.hearts - 1);
      $("#stat-heart").textContent = state.hearts;
    }
    markAnswered(q);
  }
  quiz.answered = true;
  $("#btn-check").textContent = "继续";
  $("#btn-check").onclick = nextQuestion;
  $("#btn-skip").style.display = "none";
}

function markAnswered(q) {
  state.totalAnswered++;
  state.todayAnswered++;
  const key = `${quiz.module ? quiz.module.module : "daily"}::${q.q}`;
  state.answeredQuestions[key] = true;
  // 经验值
  state.xp += 10;
  if (state.todayAnswered % 5 === 0) state.gems += 1;
  saveState();
}

function nextQuestion() {
  if (quiz.transitioning) return;
  quiz.transitioning = true;
  quiz.index++;
  quiz.answered = false;
  if (quiz.index >= quiz.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
  quiz.transitioning = false;
}

$("#btn-skip").addEventListener("click", () => {
  const q = quiz.questions[quiz.index];
  state.totalAnswered++;
  state.todayAnswered++;
  saveState();
  nextQuestion();
});

$("#quiz-back").addEventListener("click", () => {
  if (confirm("确定要退出本次学习吗？进度将不会保存为通关。")) {
    showView("learn");
    renderLearn();
  }
});

function showFeedback(correct, title, detail) {
  const fb = $("#feedback");
  fb.className = "feedback show " + (correct ? "feedback-correct" : "feedback-wrong");
  $("#fb-title").innerHTML = (correct ? "✅" : "❌") + " " + title;
  $("#fb-detail").textContent = detail;
  // 震动反馈（如支持）
  if (navigator.vibrate) navigator.vibrate(correct ? 20 : [30, 30, 30]);
}

function hideFeedback() {
  $("#feedback").classList.remove("show");
}

function finishQuiz() {
  const total = quiz.questions.length;
  const acc = Math.round(quiz.correct / total * 100);
  const xpGained = quiz.correct * 10 + (acc === 100 ? 20 : 0);
  state.xp += xpGained;
  if (quiz.type === "lesson" && acc >= 60) {
    state.completedLessons[quiz.lesson.id] = true;
    state.gems += 5;
  }
  saveState();

  const body = $("#quiz-body");
  $("#quiz-header").style.display = "none";
  $("#quiz-footer").style.display = "none";
  hideFeedback();

  const emoji = acc === 100 ? "🏆" : acc >= 80 ? "🎉" : acc >= 60 ? "👍" : "💪";
  const title = acc === 100 ? "完美通关！" : acc >= 80 ? "表现优秀！" : acc >= 60 ? "通过！" : "继续加油！";
  const sub = acc >= 60 ? "已解锁下一关" : "未达60%，建议复习后再来";

  body.innerHTML = `
    <div class="result-screen">
      <div class="result-emoji">${emoji}</div>
      <div class="result-title">${title}</div>
      <div class="result-sub">${quiz.lesson.title} · ${sub}</div>
      <div class="result-stats">
        <div class="result-stat xp"><div class="num">+${xpGained}</div><div class="lbl">经验</div></div>
        <div class="result-stat acc"><div class="num">${acc}%</div><div class="lbl">正确率</div></div>
        <div class="result-stat"><div class="num">${quiz.correct}/${total}</div><div class="lbl">答对</div></div>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="btn btn-secondary" id="btn-home">返回首页</button>
        <button class="btn btn-primary" id="btn-retry">再来一次</button>
      </div>
    </div>
  `;

  $("#btn-home").onclick = () => { showView("learn"); renderLearn(); };
  $("#btn-retry").onclick = () => {
    $("#quiz-header").style.display = "flex";
    if (quiz.type === "daily") startDailyChallenge();
    else startLesson(quiz.lesson, quiz.module);
  };
}

// ---------- 个人中心 ----------
function renderProfile() {
  const { lv, title } = getLevel(state.xp);
  $("#profile-title").textContent = `Lv.${lv} ${title}`;
  $("#p-xp").textContent = state.xp;
  $("#p-done").textContent = state.totalAnswered;
  $("#p-acc").textContent = state.totalAnswered ? Math.round(state.correctCount / state.totalAnswered * 100) + "%" : "0%";

  // 成就
  const achs = [
    { icon: "🌱", name: "初出茅庐", cond: state.totalAnswered >= 1 },
    { icon: "🔥", name: "连续7天", cond: state.streak >= 7 },
    { icon: "💯", name: "百分达人", cond: state.totalAnswered >= 100 },
    { icon: "⭐", name: "首个通关", cond: Object.keys(state.completedLessons).length >= 1 },
    { icon: "🏅", name: "通关达人", cond: Object.keys(state.completedLessons).length >= 5 },
    { icon: "👑", name: "全栈大师", cond: Object.keys(state.completedLessons).length >= 10 },
    { icon: "💎", name: "宝石猎人", cond: state.gems >= 10 },
    { icon: "🎯", name: "神射手", cond: state.totalAnswered >= 50 && (state.correctCount / state.totalAnswered) >= 0.9 },
  ];
  $("#achievements").innerHTML = achs.map(a => `
    <div class="ach ${a.cond ? "" : "locked"}">
      <div class="a-icon">${a.icon}</div>
      <div class="a-name">${a.name}</div>
    </div>
  `).join("");

  // 模块进度
  $("#module-progress").innerHTML = QUESTION_BANK.map(m => {
    const totalQ = m.lessons.reduce((s, l) => s + l.questions.length, 0);
    const doneLessons = m.lessons.filter(l => state.completedLessons[l.id]).length;
    const pct = Math.round(doneLessons / m.lessons.length * 100);
    return `
      <div class="mp-row">
        <div class="mp-icon" style="background:${m.color}">${m.icon}</div>
        <div class="mp-info">
          <div class="mp-name">${m.module}</div>
          <div class="mp-bar"><div class="mp-fill" style="width:${pct}%;background:${m.color}"></div></div>
        </div>
        <div class="mp-pct">${pct}%</div>
      </div>
    `;
  }).join("");
}

// ---------- 重置 ----------
$("#btn-reset").addEventListener("click", () => {
  if (confirm("确定要重置所有学习进度吗？此操作不可恢复。")) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    saveState();
    renderProfile();
    alert("进度已重置");
  }
});

// ---------- 初始化 ----------
renderLearn();
