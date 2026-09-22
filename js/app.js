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
// 每个时代有：名称、副标题、天空渐变色、标志性建筑 SVG
const ERAS = [
  {
    name: "原始时代",
    desc: "钻木取火 · 洞穴壁画",
    sky: "linear-gradient(180deg, #3d2817 0%, #6b4a2a 60%, #8a5a2a 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <path d="M0 90 L0 50 Q40 30 80 50 L120 50 Q160 30 200 50 L200 90 Z" fill="#2a1810"/>
      <circle cx="80" cy="40" r="14" fill="#1a0e08"/>
      <circle cx="80" cy="40" r="10" fill="#3a2410"/>
      <path d="M50 90 Q55 60 60 90 M140 90 Q145 65 150 90" stroke="#ff6b20" stroke-width="3" fill="none"/>
      <circle cx="55" cy="58" r="2" fill="#ff9500"/><circle cx="145" cy="63" r="2" fill="#ff9500"/>
    </svg>`
  },
  {
    name: "农耕时代",
    desc: "刀耕火种 · 麦浪茅屋",
    sky: "linear-gradient(180deg, #d4a040 0%, #c89030 60%, #a07020 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <path d="M0 90 L0 70 Q100 60 200 70 L200 90 Z" fill="#8a6020"/>
      <path d="M40 90 L40 55 L60 40 L80 55 L80 90 Z" fill="#6b4a1a"/>
      <path d="M30 55 L70 55 L50 35 Z" fill="#a07030"/>
      <rect x="48" y="65" width="8" height="10" fill="#3a2410"/>
      <path d="M100 90 L100 60 L120 45 L140 60 L140 90 Z" fill="#5a4015"/>
      <path d="M90 60 L150 60 L120 40 Z" fill="#8a6020"/>
      <path d="M0 75 Q50 73 100 75 Q150 77 200 75" stroke="#c8a040" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: "古代文明",
    desc: "四大文明 · 金字塔神庙",
    sky: "linear-gradient(180deg, #e8c870 0%, #d4a040 60%, #a87020 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <path d="M20 90 L60 35 L100 90 Z" fill="#c89030"/>
      <path d="M60 90 L60 35 L100 90 Z" fill="#a87020"/>
      <path d="M0 90 L0 75 Q30 72 60 75 L60 90 Z" fill="#8a6020"/>
      <path d="M110 90 L130 50 L150 90 Z" fill="#c89030"/>
      <rect x="125" y="60" width="10" height="30" fill="#3a2410"/>
      <rect x="160" y="70" width="30" height="20" fill="#a87020"/>
      <rect x="170" y="55" width="10" height="35" fill="#8a6020"/>
      <circle cx="175" cy="50" r="6" fill="#e8c870"/>
    </svg>`
  },
  {
    name: "中世纪",
    desc: "骑士城堡 · 哥特尖塔",
    sky: "linear-gradient(180deg, #5a4030 0%, #4a3020 60%, #2a1810 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <rect x="30" y="50" width="100" height="40" fill="#6a5040"/>
      <rect x="20" y="40" width="15" height="50" fill="#5a4030"/>
      <rect x="125" y="40" width="15" height="50" fill="#5a4030"/>
      <path d="M20 40 L20 30 L35 30 L35 40 M125 40 L125 30 L140 30 L140 40" fill="#3a2820"/>
      <path d="M60 50 L60 20 L70 10 L80 20 L80 50 Z" fill="#8a6850"/>
      <path d="M65 25 L75 25 L70 15 Z" fill="#c8a060"/>
      <rect x="68" y="30" width="4" height="20" fill="#3a2820"/>
      <rect x="50" y="65" width="10" height="15" fill="#2a1810"/>
      <rect x="90" y="65" width="10" height="15" fill="#2a1810"/>
      <path d="M150 90 L150 55 L170 45 L190 55 L190 90 Z" fill="#6a5040"/>
      <rect x="165" y="65" width="10" height="25" fill="#2a1810"/>
    </svg>`
  },
  {
    name: "大航海",
    desc: "地理大发现 · 帆船罗盘",
    sky: "linear-gradient(180deg, #4a90c8 0%, #2a6a9a 60%, #1a4570 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <path d="M0 90 Q50 85 100 90 Q150 95 200 90 L200 75 Q100 70 0 75 Z" fill="#1a4570" opacity="0.5"/>
      <path d="M40 90 L30 70 L150 70 L160 90 Z" fill="#6b4a2a"/>
      <line x1="90" y1="70" x2="90" y2="15" stroke="#3a2810" stroke-width="2"/>
      <path d="M90 25 L90 55 L60 55 Z" fill="#f5f0e0"/>
      <path d="M90 25 L90 55 L120 55 Z" fill="#e8e0c8"/>
      <path d="M90 35 L90 60 L65 60 Z" fill="#f5f0e0"/>
      <path d="M90 35 L90 60 L115 60 Z" fill="#e8e0c8"/>
      <path d="M0 80 Q30 78 60 80 Q90 82 120 80 Q150 78 180 80" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M0 85 Q40 83 80 85 Q120 87 160 85" stroke="#fff" stroke-width="1" fill="none" opacity="0.4"/>
    </svg>`
  },
  {
    name: "工业革命",
    desc: "机器轰鸣 · 工厂烟囱",
    sky: "linear-gradient(180deg, #8a8580 0%, #6a6560 60%, #3a3835 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <rect x="20" y="50" width="120" height="40" fill="#4a4540"/>
      <rect x="40" y="20" width="12" height="70" fill="#5a5550"/>
      <rect x="70" y="15" width="14" height="75" fill="#5a5550"/>
      <rect x="100" y="25" width="10" height="65" fill="#5a5550"/>
      <ellipse cx="46" cy="18" rx="10" ry="6" fill="#3a3530" opacity="0.7"/>
      <ellipse cx="77" cy="12" rx="12" ry="7" fill="#3a3530" opacity="0.6"/>
      <ellipse cx="105" cy="22" rx="8" ry="5" fill="#3a3530" opacity="0.7"/>
      <rect x="30" y="65" width="20" height="15" fill="#2a2520"/>
      <rect x="60" y="60" width="25" height="20" fill="#2a2520"/>
      <circle cx="90" cy="70" r="8" fill="#1a1815"/>
      <circle cx="90" cy="70" r="5" fill="#4a4540"/>
      <path d="M85 70 L95 70 M90 65 L90 75" stroke="#2a2520" stroke-width="2"/>
    </svg>`
  },
  {
    name: "蒸汽时代",
    desc: "钢铁巨兽 · 蒸汽火车",
    sky: "linear-gradient(180deg, #7a8590 0%, #5a6570 60%, #3a4550 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <rect x="0" y="75" width="200" height="15" fill="#3a3530"/>
      <rect x="20" y="55" width="80" height="25" fill="#2a2520"/>
      <rect x="100" y="45" width="30" height="35" fill="#3a3530"/>
      <circle cx="35" cy="80" r="10" fill="#1a1815"/>
      <circle cx="60" cy="80" r="10" fill="#1a1815"/>
      <circle cx="115" cy="80" r="8" fill="#1a1815"/>
      <circle cx="35" cy="80" r="4" fill="#5a5550"/>
      <circle cx="60" cy="80" r="4" fill="#5a5550"/>
      <rect x="30" y="50" width="15" height="8" fill="#c83030"/>
      <rect x="110" y="35" width="10" height="12" fill="#2a2520"/>
      <path d="M115 35 Q110 25 120 20 Q115 15 125 10" stroke="#fff" stroke-width="3" fill="none" opacity="0.7"/>
      <ellipse cx="118" cy="8" rx="8" ry="4" fill="#fff" opacity="0.5"/>
      <rect x="140" y="60" width="50" height="20" fill="#4a4540"/>
      <rect x="145" y="65" width="8" height="10" fill="#c8a060"/>
      <rect x="160" y="65" width="8" height="10" fill="#c8a060"/>
    </svg>`
  },
  {
    name: "电气时代",
    desc: "光明降临 · 电塔灯泡",
    sky: "linear-gradient(180deg, #d4a050 0%, #b08030 60%, #7a5010 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <path d="M30 90 L50 30 L70 90 Z" fill="#5a4530"/>
      <path d="M50 30 L50 90 M40 50 L60 50 M35 70 L65 70" stroke="#3a2810" stroke-width="2"/>
      <path d="M120 90 L140 35 L160 90 Z" fill="#5a4530"/>
      <path d="M140 35 L140 90 M130 55 L150 55 M125 75 L155 75" stroke="#3a2810" stroke-width="2"/>
      <path d="M50 30 Q50 80 140 35" stroke="#2a1810" stroke-width="1.5" fill="none"/>
      <ellipse cx="95" cy="55" rx="20" ry="22" fill="#fff8d0" opacity="0.9"/>
      <ellipse cx="95" cy="55" rx="14" ry="16" fill="#fff" opacity="0.7"/>
      <rect x="88" y="73" width="14" height="10" fill="#5a4530"/>
      <path d="M95 40 L92 52 L98 52 L95 64" stroke="#d4a050" stroke-width="2.5" fill="none"/>
    </svg>`
  },
  {
    name: "信息时代",
    desc: "字节跳动 · 服务器机房",
    sky: "linear-gradient(180deg, #2a8a5a 0%, #1a6a3a 60%, #0d4a20 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <rect x="20" y="20" width="50" height="70" fill="#2a2a2a"/>
      <rect x="25" y="28" width="40" height="8" fill="#1a8a3a"/>
      <rect x="25" y="40" width="40" height="8" fill="#1a8a3a"/>
      <rect x="25" y="52" width="40" height="8" fill="#1a8a3a"/>
      <rect x="25" y="64" width="40" height="8" fill="#1a8a3a"/>
      <rect x="25" y="76" width="40" height="8" fill="#1a8a3a"/>
      <circle cx="30" cy="32" r="1.5" fill="#5eff90"/>
      <circle cx="30" cy="44" r="1.5" fill="#5eff90"/>
      <circle cx="30" cy="56" r="1.5" fill="#ff5050"/>
      <circle cx="30" cy="68" r="1.5" fill="#5eff90"/>
      <rect x="80" y="35" width="50" height="55" fill="#1a1a1a"/>
      <rect x="85" y="42" width="40" height="6" fill="#0d8a3a"/>
      <rect x="85" y="52" width="40" height="6" fill="#0d8a3a"/>
      <rect x="85" y="62" width="40" height="6" fill="#0d8a3a"/>
      <rect x="85" y="72" width="40" height="6" fill="#0d8a3a"/>
      <rect x="140" y="25" width="45" height="65" fill="#2a2a2a"/>
      <rect x="145" y="32" width="35" height="7" fill="#1a8a3a"/>
      <rect x="145" y="43" width="35" height="7" fill="#1a8a3a"/>
      <rect x="145" y="54" width="35" height="7" fill="#1a8a3a"/>
      <rect x="145" y="65" width="35" height="7" fill="#1a8a3a"/>
      <rect x="145" y="76" width="35" height="7" fill="#1a8a3a"/>
    </svg>`
  },
  {
    name: "数字时代",
    desc: "云端互联 · 摩天大楼",
    sky: "linear-gradient(180deg, #2a5aaa 0%, #1a4588 60%, #0d3070 100%)",
    building: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
      <rect x="10" y="40" width="25" height="50" fill="#1a3a6a"/>
      <rect x="13" y="45" width="3" height="3" fill="#5aaaff"/><rect x="19" y="45" width="3" height="3" fill="#5aaaff"/><rect x="25" y="45" width="3" height="3" fill="#5aaaff"/>
      <rect x="13" y="52" width="3" height="3" fill="#5aaaff"/><rect x="19" y="52" width="3" height="3" fill="#5aaaff"/><rect x="25" y="52" width="3" height="3" fill="#5aaaff"/>
      <rect x="13" y="59" width="3" height="3" fill="#5aaaff"/><rect x="19" y="59" width="3" height="3" fill="#5aaaff"/><rect x="25" y="59" width="3" height="3" fill="#5aaaff"/>
      <rect x="40" y="25" width="30" height="65" fill="#2a4a8a"/>
      <rect x="44" y="30" width="3" height="3" fill="#7abfff"/><rect x="50" y="30" width="3" height="3" fill="#7abfff"/><rect x="56" y="30" width="3" height="3" fill="#7abfff"/><rect x="62" y="30" width="3" height="3" fill="#7abfff"/>
      <rect x="44" y="38" width="3" height="3" fill="#7abfff"/><rect x="50" y="38" width="3" height="3" fill="#5aaaff"/><rect x="56" y="38" width="3" height="3" fill="#7abfff"/><rect x="62" y="38" width="3" height="3" fill="#7abfff"/>
      <rect x="44" y="46" width="3" height="3" fill="#7abfff"/><rect x="50" y="46" width="3" height="3" fill="#7abfff"/><rect x="56" y="46" width="3" height="3" fill="#5aaaff"/><rect x="62" y="46" width="3" height="3" fill="#7abfff"/>
      <rect x="75" y="15" width="35" height="75" fill="#1a3a6a"/>
      <rect x="79" y="20" width="3" height="3" fill="#5aaaff"/><rect x="85" y="20" width="3" height="3" fill="#aaddff"/><rect x="91" y="20" width="3" height="3" fill="#5aaaff"/><rect x="97" y="20" width="3" height="3" fill="#5aaaff"/><rect x="103" y="20" width="3" height="3" fill="#5aaaff"/>
      <rect x="79" y="28" width="3" height="3" fill="#aaddff"/><rect x="85" y="28" width="3" height="3" fill="#5aaaff"/><rect x="91" y="28" width="3" height="3" fill="#5aaaff"/><rect x="97" y="28" width="3" height="3" fill="#aaddff"/><rect x="103" y="28" width="3" height="3" fill="#5aaaff"/>
      <rect x="79" y="36" width="3" height="3" fill="#5aaaff"/><rect x="85" y="36" width="3" height="3" fill="#5aaaff"/><rect x="91" y="36" width="3" height="3" fill="#5aaaff"/><rect x="97" y="36" width="3" height="3" fill="#5aaaff"/><rect x="103" y="36" width="3" height="3" fill="#aaddff"/>
      <rect x="79" y="44" width="3" height="3" fill="#5aaaff"/><rect x="85" y="44" width="3" height="3" fill="#aaddff"/><rect x="91" y="44" width="3" height="3" fill="#5aaaff"/><rect x="97" y="44" width="3" height="3" fill="#5aaaff"/><rect x="103" y="44" width="3" height="3" fill="#5aaaff"/>
      <rect x="79" y="52" width="3" height="3" fill="#5aaaff"/><rect x="85" y="52" width="3" height="3" fill="#5aaaff"/><rect x="91" y="52" width="3" height="3" fill="#aaddff"/><rect x="97" y="52" width="3" height="3" fill="#5aaaff"/><rect x="103" y="52" width="3" height="3" fill="#5aaaff"/>
      <rect x="115" y="30" width="25" height="60" fill="#2a4a8a"/>
      <rect x="119" y="35" width="3" height="3" fill="#7abfff"/><rect x="125" y="35" width="3" height="3" fill="#7abfff"/><rect x="131" y="35" width="3" height="3" fill="#7abfff"/>
      <rect x="119" y="43" width="3" height="3" fill="#7abfff"/><rect x="125" y="43" width="3" height="3" fill="#5aaaff"/><rect x="131" y="43" width="3" height="3" fill="#7abfff"/>
      <rect x="145" y="20" width="40" height="70" fill="#1a3a6a"/>
      <rect x="149" y="25" width="3" height="3" fill="#5aaaff"/><rect x="155" y="25" width="3" height="3" fill="#aaddff"/><rect x="161" y="25" width="3" height="3" fill="#5aaaff"/><rect x="167" y="25" width="3" height="3" fill="#5aaaff"/><rect x="173" y="25" width="3" height="3" fill="#5aaaff"/><rect x="179" y="25" width="3" height="3" fill="#5aaaff"/>
      <rect x="149" y="33" width="3" height="3" fill="#aaddff"/><rect x="155" y="33" width="3" height="3" fill="#5aaaff"/><rect x="161" y="33" width="3" height="3" fill="#5aaaff"/><rect x="167" y="33" width="3" height="3" fill="#aaddff"/><rect x="173" y="33" width="3" height="3" fill="#5aaaff"/><rect x="179" y="33" width="3" height="3" fill="#5aaaff"/>
      <rect x="149" y="41" width="3" height="3" fill="#5aaaff"/><rect x="155" y="41" width="3" height="3" fill="#5aaaff"/><rect x="161" y="41" width="3" height="3" fill="#5aaaff"/><rect x="167" y="41" width="3" height="3" fill="#5aaaff"/><rect x="173" y="41" width="3" height="3" fill="#aaddff"/><rect x="179" y="41" width="3" height="3" fill="#5aaaff"/>
      <rect x="149" y="49" width="3" height="3" fill="#5aaaff"/><rect x="155" y="49" width="3" height="3" fill="#aaddff"/><rect x="161" y="49" width="3" height="3" fill="#5aaaff"/><rect x="167" y="49" width="3" height="3" fill="#5aaaff"/><rect x="173" y="49" width="3" height="3" fill="#5aaaff"/><rect x="179" y="49" width="3" height="3" fill="#5aaaff"/>
    </svg>`
  }
];

// 每个时代的彩蛋文案（点击建筑随机弹出一条）
const EGG_EMOJI = "🥚";
const ERA_EGGS = [
  [ // 0 原始时代
    "原始人最早发明了 fire，程序员最早发明了 bug。",
    "钻木取火需要耐心，等代码编译也一样。",
    "那时人类已经会保存火种，比保存代码备份还认真。",
    "山洞壁画是史上最早的 README，但没人看。"
  ],
  [ // 1 农耕时代
    "种地要看节气，发版要看黄历。",
    "麦浪起伏像极了线上 CPU 曲线。",
    "农人施肥增产，程序员加注释减负。",
    "春耕秋收 = 早高峰 debug，晚高峰 deploy。"
  ],
  [ // 2 古代文明
    "金字塔造了 20 年，重构也写了 20 年。",
    "象形文字难，正则表达式更难。",
    "古代历法 = 最早的时间戳处理。",
    "莎草纸是远古的版本控制，只可惜不能 diff。"
  ],
  [ // 3 中世纪
    "骑士守誓约，接口守契约。",
    "城堡防御要厚，防火墙要厚。",
    "炼金术士是第一批「全栈」工程师。",
    "中世纪的瘟疫 = 生产环境的内存泄漏。"
  ],
  [ // 4 大航海
    "罗盘指向磁北，代码指向 main 函数。",
    "航海日志 = git log，每条都重要。",
    "船长怕风暴，运维怕高峰。",
    "环游世界很难，但比环回依赖简单。"
  ],
  [ // 5 工业革命
    "蒸汽机提高效率，IDE 自动补全也一样。",
    "工厂流水线 = CI/CD 最早雏形。",
    "机器换齿轮，重构换框架，都疼。",
    "工业污染 = 代码屎山，都在悄悄积累。"
  ],
  [ // 6 蒸汽时代
    "蒸汽火车跑得快，热加载也一样。",
    "锅炉要烧水，容器要 docker。",
    "汽笛一响干活，铃铛一响下班。",
    "煤炭是燃料，咖啡是程序员的燃料。"
  ],
  [ // 7 电气时代
    "灯泡亮起 = 控制台打印 console.log('hello')。",
    "电网覆盖全球，互联网覆盖生活。",
    "电费按度算，云费按算力算。",
    "闪电是自然界的瞬间高并发。"
  ],
  [ // 8 信息时代
    "服务器机房是数字时代的工厂。",
    "网线一拔，恩断义绝。",
    "蓝屏是程序员的工业革命。",
    "机房空调比办公室空调重要。"
  ],
  [ // 9 数字时代
    "云上什么都存，包括 bug。",
    "AI 写代码：调试到 AI 自己都崩溃。",
    "5G 很快，debug 很慢。",
    "元宇宙里没人写注释，反正都是浮云。"
  ]
];

// 通用彩蛋（不绑定时代，随机补充）
const GENERAL_EGGS = [
  "世界上第一个 bug，真的是一只虫子。",
  "Java 的咖啡杯 logo，源自爪哇岛咖啡。",
  "程序员的三大美德：懒惰、急躁、傲慢。",
  "代码不会自己跑，但 bug 会自己长。",
  "「在我电脑上能跑」是程序员的免责声明。",
  "愿你余生，无需再写 try-catch。",
  "没有什么是加一层中间件解决不了的，如果有，就加两层。"
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

    // 单元容器
    const unit = document.createElement("div");
    unit.className = "unit";
    const eraIdx = Math.min(mi, ERAS.length - 1);
    const era = ERAS[eraIdx];
    unit.setAttribute("data-era", String(eraIdx));
    const doneInModule = module.lessons.filter(l => state.completedLessons[l.id]).length;

    // 单元头
    const unitHeader = document.createElement("div");
    unitHeader.className = "unit-header" + (moduleLocked ? " locked" : "");
    unitHeader.innerHTML = `
      <div class="u-icon" style="background:${module.color}">${module.icon}</div>
      <div>
        <div class="u-title">${module.module}</div>
        <div class="u-sub">${doneInModule}/${module.lessons.length} 关 · ${era.name}</div>
      </div>
      ${moduleLocked ? '<div class="u-lock">🔒</div>' : '<span class="era-tag">' + era.name + '</span>'}
    `;
    unit.appendChild(unitHeader);
    path.appendChild(unit);

    // 每个lesson一个节点，蛇形排列；收集所有 row 用于在空白侧插装饰
    const rows = [];
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
      rows.push({ el: row, isLeft: li % 2 === 0 });
    });

    // 在该 module 关卡节点的空白侧（节点对面）插入 1-2 个时代建筑装饰
    // 装饰直接放入对应 node-row，绝对定位到空白侧，避免与节点重叠
    const seed = mi * 7;
    const decoCount = Math.min(rows.length, 1 + (mi % 2)); // 1 或 2 个，不超过行数
    for (let k = 0; k < decoCount; k++) {
      // 挑选行：均匀分布 + 伪随机偏移
      const rowIdx = Math.floor((k + 0.5) * rows.length / decoCount) % rows.length;
      const target = rows[rowIdx];
      const deco = document.createElement("div");
      deco.className = "era-decoration";
      deco.innerHTML = era.building;
      // 伪随机
      const rnd1 = ((seed + k * 13) % 100) / 100;
      const rnd2 = ((seed + k * 17 + 5) % 100) / 100;
      const rnd3 = ((seed + k * 19 + 9) % 100) / 100;
      // 尺寸：节点是 76px，装饰比节点略小 56-70px
      const w = 56 + Math.round(rnd1 * 14);
      const h = 56 + Math.round(rnd2 * 14);
      // 垂直居中到行（行内节点是 76px 高，行有上下 padding/margin 约 90px 总高）
      // 使用 top: 50% + translateY(-50%) 居中
      deco.style.width = w + "px";
      deco.style.height = h + "px";
      deco.style.top = "50%";
      deco.style.transform = `translateY(-50%) rotate(${(rnd3 - 0.5) * 8}deg)${rnd2 > 0.5 ? " scaleX(-1)" : ""}`;
      // 横向：放在节点对侧空白区域
      // node-row.left: 节点在左（padding-left:14%），空白在右侧 → right: 8%
      // node-row.right: 节点在右（padding-right:14%），空白在左侧 → left: 8%
      if (target.isLeft) {
        const offset = 4 + rnd2 * 10; // 4~14%
        deco.style.right = offset + "%";
      } else {
        const offset = 4 + rnd2 * 10;
        deco.style.left = offset + "%";
      }
      // 点击彩蛋
      deco.addEventListener("click", (e) => {
        e.stopPropagation();
        showEggPopup(eraIdx);
      });
      target.el.appendChild(deco);
    }
  });
}

// ---------- 时代建筑点击彩蛋 ----------
function showEggPopup(eraIdx) {
  // 70% 该时代彩蛋，30% 通用彩蛋
  let pool;
  if (eraIdx >= 0 && eraIdx < ERA_EGGS.length && Math.random() < 0.7) {
    pool = ERA_EGGS[eraIdx];
  } else {
    pool = GENERAL_EGGS;
  }
  const text = pool[Math.floor(Math.random() * pool.length)];
  const eraName = (ERAS[eraIdx] && ERAS[eraIdx].name) || "Java面试通";

  // 移除已有弹窗
  document.querySelectorAll(".egg-popup, .egg-overlay").forEach(el => el.remove());

  const overlay = document.createElement("div");
  overlay.className = "egg-overlay";
  const popup = document.createElement("div");
  popup.className = "egg-popup";
  popup.innerHTML = `
    <div class="egg-emoji">${EGG_EMOJI}</div>
    <div class="egg-title">${eraName} · 彩蛋</div>
    <div class="egg-text">${text}</div>
    <button class="egg-close">收下彩蛋</button>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  // 触发动画
  requestAnimationFrame(() => {
    overlay.classList.add("show");
    popup.classList.add("show");
  });
  const close = () => {
    overlay.classList.remove("show");
    popup.classList.remove("show");
    setTimeout(() => { overlay.remove(); popup.remove(); }, 250);
  };
  popup.querySelector(".egg-close").addEventListener("click", close);
  overlay.addEventListener("click", close);
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
/* rebuild trigger */
/* pages rebuild */
/* pages rebuild */
