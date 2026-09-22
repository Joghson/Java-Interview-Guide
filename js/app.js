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

// ---------- Hero 主题色 ----------
const HERO_THEME_KEY = "java_hero_theme";
function getHeroTheme() {
  return parseInt(localStorage.getItem(HERO_THEME_KEY)) || 0;
}
function setHeroTheme(t) {
  localStorage.setItem(HERO_THEME_KEY, String(t));
  const hero = $(".hero");
  if (hero) hero.setAttribute("data-theme", String(t));
}
function cycleHeroTheme() {
  const next = (getHeroTheme() + 1) % 6; // 0-5 共6个主题
  setHeroTheme(next);
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
  // 未登录时拦截到登录视图
  if (name !== "auth" && !isLoggedIn()) {
    initAuth();
    return;
  }
  $$(".view").forEach(v => v.classList.remove("active"));
  const viewEl = $(`#view-${name}`);
  if (!viewEl) return;
  viewEl.classList.add("active");
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
  // auth 视图隐藏顶部栏和底部导航，其他视图都显示
  $("#topbar").style.display = name === "auth" ? "none" : "flex";
  $(".tabbar").style.display = (name === "quiz" || name === "auth") ? "none" : "flex";
  document.getElementById("app").scrollTop = 0;
}

$$(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const v = tab.dataset.view;
    if (v === "profile") {
      try { renderProfile(); } catch(e) { console.error("renderProfile error:", e); }
    }
    showView(v);
  });
});

// ---------- 渲染：学习路径 ----------
// 时代映射：每个模块对应一个时代（从原始到数字）
const ERAS = [
  "原始时代", "农耕时代", "古代文明", "中世纪", "大航海",
  "工业革命", "蒸汽时代", "电气时代", "信息时代", "数字时代"
];

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

  // 应用 Hero 主题色
  const hero = $(".hero");
  if (hero) hero.setAttribute("data-theme", String(getHeroTheme()));

  // 问候语
  const h = new Date().getHours();
  const greet = h < 6 ? "夜深了，注意休息" : h < 12 ? "早上好，开始刷题吧" : h < 14 ? "午后好，刷几道题醒醒脑" : h < 18 ? "下午好，继续加油" : "晚上好，复盘今日所学";
  $("#hero-greeting").textContent = greet;

  // 路径
  const path = $("#path");
  path.innerHTML = "";

  let currentFound = false;

  QUESTION_BANK.forEach((module, mi) => {
    // 判断该模块是否解锁：第一个模块默认解锁，其他模块需前置模块所有关卡完成
    let moduleLocked = false;
    if (mi > 0) {
      const prevModule = QUESTION_BANK[mi - 1];
      const prevAllDone = prevModule.lessons.every(l => state.completedLessons[l.id]);
      if (!prevAllDone) moduleLocked = true;
    }

    // 单元标题
    const unit = document.createElement("div");
    unit.className = "unit";
    const eraIdx = Math.min(mi, ERAS.length - 1);
    unit.setAttribute("data-era", String(eraIdx));
    const doneInModule = module.lessons.filter(l => state.completedLessons[l.id]).length;
    unit.innerHTML = `
      <div class="unit-header${moduleLocked ? " locked" : ""}">
        <div class="u-icon">${module.icon}</div>
        <div>
          <div class="u-title">${module.module}</div>
          <div class="u-sub">${doneInModule}/${module.lessons.length} 关 · ${ERAS[eraIdx]}</div>
        </div>
        <span class="era-tag">${ERAS[eraIdx]}</span>
        ${moduleLocked ? '<div class="u-lock">🔒</div>' : ""}
      </div>
    `;
    path.appendChild(unit);

    // 每个lesson一个节点，蛇形排列
    module.lessons.forEach((lesson, li) => {
      const row = document.createElement("div");
      row.className = "node-row " + (li % 2 === 0 ? "left" : "right");

      const isDone = !!state.completedLessons[lesson.id];
      // 锁定条件：模块锁定 OR 上一课未完成
      let isLocked = moduleLocked;
      if (!isLocked && !isDone && li > 0) {
        isLocked = !state.completedLessons[module.lessons[li - 1].id];
      }
      const isCurrent = !isDone && !isLocked && !currentFound;
      if (isCurrent) currentFound = true;

      const node = document.createElement("div");
      node.className = "node" + (isDone ? " done" : "") + (isLocked ? " locked" : "") + (isCurrent ? " current" : "");
      node.innerHTML = `
        <div class="n-icon">${isDone ? "⭐" : lesson.icon || module.icon}</div>
        <div class="n-title">${lesson.title}</div>
        ${isLocked ? '<div class="n-lock">🔒</div>' : ""}
      `;
      if (!isLocked) {
        node.addEventListener("click", () => startLesson(lesson, module));
      }
      row.appendChild(node);
      path.appendChild(row);
    });
  });
}

// Hero 主题切换按钮
$(".hero-theme-btn")?.addEventListener("click", cycleHeroTheme);

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
  if (navigator.vibrate) navigator.vibrate(correct ? 20 : [30, 30, 30]);
  if (correct) launchConfetti();
}

// 撒花特效
function launchConfetti() {
  let container = $(".confetti-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);
  }
  const colors = ["#58CC02", "#1CB0F6", "#FF9600", "#FF4B4B", "#8458FC", "#FFC800"];
  const shapes = ["50%", "2px", "0"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)];
    piece.style.animationDelay = Math.random() * 0.5 + "s";
    piece.style.animationDuration = (2 + Math.random() * 1.5) + "s";
    piece.style.width = (6 + Math.random() * 8) + "px";
    piece.style.height = piece.style.width;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

function hideFeedback() {
  $("#feedback").classList.remove("show");
}

function finishQuiz() {
  const total = quiz.questions.length;
  const acc = Math.round(quiz.correct / total * 100);
  const xpGained = quiz.correct * 10 + (acc === 100 ? 20 : 0);
  const oldLevel = getLevel(state.xp).lv;
  state.xp += xpGained;
  const newLevel = getLevel(state.xp).lv;
  if (quiz.type === "lesson" && acc >= 60) {
    state.completedLessons[quiz.lesson.id] = true;
    state.gems += 5;
  }
  saveState();
  if (newLevel > oldLevel) {
    setTimeout(() => showLevelUp(newLevel), 600);
  }

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

  // 用户信息 + 自定义头像/名字/背景
  const session = getSession();
  if (session) {
    const custom = getProfileCustom();
    if (custom.name) {
      $("#profile-name").textContent = custom.name;
    } else {
      $("#profile-name").textContent = session.nickname;
    }
  }
  applyProfileCustom();
}
$("#btn-reset").addEventListener("click", () => {
  if (confirm("确定要重置所有学习进度吗？此操作不可恢复。")) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    saveState();
    renderProfile();
    alert("进度已重置");
  }
});

// ---------- 退出登录 ----------
const logoutBtn = $("#btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("确定退出登录吗？")) {
      logout();
    }
  });
}

// ---------- 个人中心编辑：头像/名字/背景 ----------
const PROFILE_KEY = "java_profile_custom";
const AVATARS = ["👨‍💻","👩‍💻","🧑‍💻","👨‍💼","👩‍💼","🧑‍💼","👨‍🚀","👩‍🚀","🤓","😎","🧙‍♂️","🧙‍♀️","🐉","🦊","🐱","🐯","🚀","☕"];
const BG_THEMES = [
  { name: "翠绿", gradient: "linear-gradient(135deg, #58CC02 0%, #46a302 40%, #2d8e5a 70%, #1a6b42 100%)" },
  { name: "深海", gradient: "linear-gradient(135deg, #1CB0F6 0%, #0996d6 40%, #0568a8 70%, #003d75 100%)" },
  { name: "烈焰", gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF4B4B 40%, #cc2020 70%, #8a0a0a 100%)" },
  { name: "紫梦", gradient: "linear-gradient(135deg, #8458FC 0%, #6a3de0 40%, #4a1eab 70%, #2a0a6e 100%)" },
  { name: "金辉", gradient: "linear-gradient(135deg, #FFC800 0%, #e0a800 40%, #b07a00 70%, #6a4a00 100%)" },
  { name: "咖啡", gradient: "linear-gradient(135deg, #6F4E37 0%, #5a3d2a 40%, #3e2723 70%, #2a1a14 100%)" },
  { name: "暗夜", gradient: "linear-gradient(135deg, #2c3e50 0%, #1a2530 40%, #0d1a25 70%, #050d12 100%)" },
  { name: "樱花", gradient: "linear-gradient(135deg, #FFB3D9 0%, #FF80C0 40%, #e0569f 70%, #9c2a6e 100%)" },
  { name: "森林", gradient: "linear-gradient(135deg, #2d8e5a 0%, #1a6b42 40%, #0d4a2e 70%, #052e1a 100%)" },
];

function getProfileCustom() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; }
  catch { return {}; }
}
function saveProfileCustom(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

function applyProfileCustom() {
  const c = getProfileCustom();
  const name = c.name || "Java 全栈工程师";
  const avatarEl = $("#profile-avatar");
  const bgEl = $("#profile-header-bg");

  // 头像：自定义图片 > emoji
  if (c.customAvatar) {
    avatarEl.innerHTML = `<img src="${c.customAvatar}" style="width:88px;height:88px;border-radius:50%;object-fit:cover">`;
  } else {
    avatarEl.textContent = c.avatar || "👨‍💻";
  }

  $("#profile-name").textContent = name;

  if (c.customBg) {
    bgEl.style.background = `url(${c.customBg}) center/cover no-repeat`;
  } else {
    const bg = c.bg || 0;
    bgEl.style.background = BG_THEMES[bg].gradient;
  }
}

// ---------- 头像裁剪弹窗 ----------
function showCropDialog(imgSrc, cropSize, callback) {
  const overlay = document.createElement("div");
  overlay.className = "crop-overlay";
  overlay.innerHTML = `
    <div class="crop-title">裁剪头像</div>
    <div class="crop-hint">拖动调整位置 · 双指缩放</div>
    <div class="crop-stage" id="crop-stage">
      <img id="crop-img" src="${imgSrc}">
    </div>
    <div class="crop-btns">
      <button class="btn btn-secondary" id="crop-cancel">取消</button>
      <button class="btn btn-primary" id="crop-confirm">完成</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const stage = overlay.querySelector("#crop-stage");
  const img = overlay.querySelector("#crop-img");
  const stageW = cropSize;
  const stageH = cropSize;

  // 等图片加载
  img.onload = () => {
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    // 初始缩放：让图片短边填满裁剪框
    let scale = Math.max(stageW / natW, stageH / natH);
    let minScale = scale; // 不能再缩小
    let maxScale = scale * 4;
    let offsetX = 0; // 相对于居中的偏移
    let offsetY = 0;

    function applyTransform() {
      img.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`;
    }
    applyTransform();

    // ---- 单指拖拽 ----
    let dragStartX = 0, dragStartY = 0;
    let dragOffX = 0, dragOffY = 0;
    let isDragging = false;

    // ---- 双指缩放 ----
    let pinchStartDist = 0;
    let pinchStartScale = 1;

    function getDist(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    }

    function getCenter(t1, t2) {
      return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
    }

    stage.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        dragOffX = offsetX;
        dragOffY = offsetY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        pinchStartDist = getDist(e.touches[0], e.touches[1]);
        pinchStartScale = scale;
      }
    }, { passive: false });

    stage.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - dragStartX;
        const dy = e.touches[0].clientY - dragStartY;
        // 限制拖拽范围，不能拖出裁剪框太多
        const maxOff = (scale * Math.min(natW, natH)) / 2 - stageW / 2 + 60;
        offsetX = Math.max(-maxOff, Math.min(maxOff, dragOffX + dx));
        offsetY = Math.max(-maxOff, Math.min(maxOff, dragOffY + dy));
        applyTransform();
      } else if (e.touches.length === 2) {
        const dist = getDist(e.touches[0], e.touches[1]);
        const ratio = dist / pinchStartDist;
        scale = Math.max(minScale, Math.min(maxScale, pinchStartScale * ratio));
        applyTransform();
      }
    }, { passive: false });

    stage.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) {
        pinchStartDist = 0;
      }
      if (e.touches.length === 0) {
        isDragging = false;
      }
    });

    // 鼠标支持（桌面测试）
    let mouseDown = false;
    stage.addEventListener("mousedown", (e) => {
      mouseDown = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragOffX = offsetX;
      dragOffY = offsetY;
    });
    document.addEventListener("mousemove", (e) => {
      if (!mouseDown) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const maxOff = (scale * Math.min(natW, natH)) / 2 - stageW / 2 + 60;
      offsetX = Math.max(-maxOff, Math.min(maxOff, dragOffX + dx));
      offsetY = Math.max(-maxOff, Math.min(maxOff, dragOffY + dy));
      applyTransform();
    });
    document.addEventListener("mouseup", () => { mouseDown = false; });

    // ---- 确认裁剪 ----
    overlay.querySelector("#crop-confirm").addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // 计算源图片中的裁剪区域
      // stage 中心对应图片中心 + offset
      // 裁剪框在 stage 中央 280x280，圆形
      // 源区域 = stageW / scale 的像素对应原始像素
      const srcCropW = stageW / scale;
      const srcCropH = stageH / scale;
      const srcCenterX = natW / 2 - offsetX / scale;
      const srcCenterY = natH / 2 - offsetY / scale;
      const sx = srcCenterX - srcCropW / 2;
      const sy = srcCenterY - srcCropH / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(128, 128, 128, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, sx, sy, srcCropW, srcCropH, 0, 0, 256, 256);
      ctx.restore();

      const result = canvas.toDataURL("image/jpeg", 0.85);
      overlay.remove();
      callback(result);
    });

    overlay.querySelector("#crop-cancel").addEventListener("click", () => {
      overlay.remove();
    });
  };
}

function showEditCard() {
  const c = getProfileCustom();
  const selectedAvatar = c.avatar || "👨‍💻";
  const selectedName = c.name || "";
  const selectedBg = c.bg || 0;
  const hasCustomBg = !!c.customBg;
  const hasCustomAvatar = !!c.customAvatar;

  const overlay = document.createElement("div");
  overlay.className = "edit-overlay";
  overlay.innerHTML = `
    <div class="edit-card">
      <div class="ec-title">编辑个人资料</div>

      <div class="ec-label">选择头像</div>
      <div class="avatar-grid">
        ${AVATARS.map(a => `
          <div class="avatar-opt ${!hasCustomAvatar && a === selectedAvatar ? "selected" : ""}" data-avatar="${a}">${a}</div>
        `).join("")}
        <div class="avatar-opt avatar-upload ${hasCustomAvatar ? "selected" : ""}" id="avatar-custom" style="flex-direction:column;gap:0;font-size:10px">
          ${hasCustomAvatar ? `<img src="${c.customAvatar}" style="width:100%;height:100%;border-radius:10px;object-fit:cover">` : '<span style="font-size:18px">📷</span><span style="color:#888">自定义</span>'}
        </div>
      </div>

      <div class="ec-label">昵称</div>
      <input type="text" class="ec-input" id="edit-name" placeholder="输入昵称" value="${selectedName}" maxlength="12">

      <div class="ec-label">背景主题</div>
      <div class="bg-grid">
        ${BG_THEMES.map((b, i) => `
          <div class="bg-opt ${!hasCustomBg && i === selectedBg ? "selected" : ""}" data-bg="${i}" style="background:${b.gradient}"></div>
        `).join("")}
        <div class="bg-opt bg-upload ${hasCustomBg ? "selected" : ""}" id="bg-custom" style="background:#f0f0f0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px">
          <span style="font-size:20px">📷</span>
          <span style="font-size:10px;font-weight:700;color:#888">自定义</span>
        </div>
      </div>

      <div class="ec-btns">
        <button class="btn btn-secondary" id="ec-cancel" style="flex:1">取消</button>
        <button class="btn btn-primary" id="ec-save" style="flex:2">保存</button>
      </div>
    </div>
    <input type="file" id="bg-file-input" accept="image/*" style="display:none">
    <input type="file" id="avatar-file-input" accept="image/*" style="display:none">
  `;
  document.body.appendChild(overlay);

  let curAvatar = selectedAvatar;
  let curBg = selectedBg;
  let curCustomBg = hasCustomBg ? c.customBg : null;
  let curCustomAvatar = hasCustomAvatar ? c.customAvatar : null;

  // emoji 头像选择
  overlay.querySelectorAll(".avatar-opt[data-avatar]").forEach(opt => {
    opt.addEventListener("click", () => {
      overlay.querySelectorAll(".avatar-opt").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      curAvatar = opt.dataset.avatar;
      curCustomAvatar = null;
    });
  });

  // 自定义头像上传（带裁剪）
  const avatarFileInput = overlay.querySelector("#avatar-file-input");
  overlay.querySelector("#avatar-custom").addEventListener("click", () => {
    avatarFileInput.click();
  });
  avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("图片不能超过 20MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      showCropDialog(ev.target.result, 280, (cropped) => {
        curCustomAvatar = cropped;
        const el = overlay.querySelector("#avatar-custom");
        overlay.querySelectorAll(".avatar-opt").forEach(o => o.classList.remove("selected"));
        el.classList.add("selected");
        el.innerHTML = `<img src="${cropped}" style="width:100%;height:100%;border-radius:10px;object-fit:cover">`;
      });
    };
    reader.readAsDataURL(file);
  });

  // 预设背景选择
  overlay.querySelectorAll(".bg-opt[data-bg]").forEach(opt => {
    opt.addEventListener("click", () => {
      overlay.querySelectorAll(".bg-opt").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      curBg = parseInt(opt.dataset.bg);
      curCustomBg = null;
    });
  });

  // 自定义背景上传
  const fileInput = overlay.querySelector("#bg-file-input");
  overlay.querySelector("#bg-custom").addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("图片不能超过 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      curCustomBg = ev.target.result;
      overlay.querySelectorAll(".bg-opt").forEach(o => o.classList.remove("selected"));
      overlay.querySelector("#bg-custom").classList.add("selected");
      overlay.querySelector("#bg-custom").style.background = `url(${curCustomBg}) center/cover no-repeat`;
      overlay.querySelector("#bg-custom").innerHTML = "";
    };
    reader.readAsDataURL(file);
  });

  // 取消
  overlay.querySelector("#ec-cancel").addEventListener("click", () => {
    overlay.remove();
  });

  // 保存
  overlay.querySelector("#ec-save").addEventListener("click", () => {
    const name = overlay.querySelector("#edit-name").value.trim() || "Java 全栈工程师";
    const data = { avatar: curAvatar, name: name, bg: curBg };
    if (curCustomBg) data.customBg = curCustomBg;
    if (curCustomAvatar) data.customAvatar = curCustomAvatar;
    saveProfileCustom(data);
    applyProfileCustom();
    const session = getSession();
    if (session) {
      session.nickname = name;
      setSession(session);
    }
    overlay.remove();
    renderProfile();
    launchConfetti();
  });
}

// 点击头像/名字打开编辑
$("#profile-avatar").addEventListener("click", showEditCard);
$("#profile-name").addEventListener("click", showEditCard);

// ---------- 升级弹窗 ----------
function showLevelUp(level) {
  const titles = ["入门菜鸟", "初级开发", "中级工程师", "高级工程师", "架构师", "技术专家", "技术大牛"];
  const title = titles[Math.min(level - 1, titles.length - 1)];
  const overlay = document.createElement("div");
  overlay.className = "levelup-overlay";
  overlay.innerHTML = `
    <div class="levelup-card">
      <div class="lu-icon">🎉</div>
      <div class="lu-title">Lv.${level} ${title}</div>
      <div class="lu-sub">恭喜升级！继续加油 💪</div>
      <button class="lu-btn">太棒了</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector(".lu-btn").addEventListener("click", () => {
    overlay.style.animation = "fadeIn .3s reverse";
    setTimeout(() => overlay.remove(), 300);
  });
  launchConfetti();
  if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 100]);
}

// ---------- 初始化 ----------
(function init() {
  if (isLoggedIn()) {
    updateTopbarUser();
    renderLearn();
  } else {
    initAuth();
  }
})();
