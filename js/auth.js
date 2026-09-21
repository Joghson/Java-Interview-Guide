// ============================================================
// Java面试通 - 登录/注册模块
// 手机号注册 + 验证码验证 + 会话管理
// 验证码前端模拟生成（开发模式），生产环境可接真实短信API
// ============================================================

const AUTH_KEY = "java_auth_users";
const SESSION_KEY = "java_auth_session";

// ---------- 用户存储 ----------
function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || {}; }
  catch { return {}; }
}
function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

// ---------- 会话管理 ----------
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    phone: user.phone,
    nickname: user.nickname,
    loginAt: Date.now()
  }));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function isLoggedIn() {
  return !!getSession();
}

// ---------- 验证码 ----------
let smsCode = null;
let smsCodeTimer = null;
let smsCodeExpire = 0;

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function sendCode(phone) {
  smsCode = generateCode();
  smsCodeExpire = Date.now() + 5 * 60 * 1000; // 5分钟有效
  // 开发模式：显示验证码（生产环境替换为真实短信API）
  console.log(`[开发模式] 验证码: ${smsCode}`);
  return smsCode;
}

function verifyCode(input) {
  if (!smsCode || Date.now() > smsCodeExpire) return false;
  return input === smsCode;
}

// ---------- 倒计时 ----------
let countdownTimer = null;
function startCountdown(btn, seconds) {
  let remain = seconds;
  btn.disabled = true;
  btn.textContent = `${remain}s 后重发`;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remain--;
    if (remain <= 0) {
      clearInterval(countdownTimer);
      btn.disabled = false;
      btn.textContent = "获取验证码";
    } else {
      btn.textContent = `${remain}s 后重发`;
    }
  }, 1000);
}

// ---------- 手机号校验 ----------
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// ---------- 登录/注册流程 ----------
function handleAuth(phone, code, isRegister) {
  const users = getUsers();
  if (isRegister) {
    if (users[phone]) return { ok: false, msg: "该手机号已注册，请直接登录" };
    const nickname = `用户${phone.slice(-4)}`;
    users[phone] = { phone, nickname, createdAt: Date.now() };
    saveUsers(users);
    setSession(users[phone]);
    return { ok: true, msg: "注册成功" };
  } else {
    if (!users[phone]) return { ok: false, msg: "该手机号未注册" };
    setSession(users[phone]);
    return { ok: true, msg: "登录成功" };
  }
}

// ---------- 渲染登录视图 ----------
function renderAuthView(mode = "login") {
  const isRegister = mode === "register";
  return `
    <div class="auth-screen">
      <div class="auth-logo">☕</div>
      <h2 class="auth-title">${isRegister ? "注册账号" : "欢迎回来"}</h2>
      <p class="auth-sub">${isRegister ? "手机号注册，开启刷题之旅" : "登录继续你的面试备考"}</p>

      <div class="auth-form">
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input type="tel" id="auth-phone" class="form-input" placeholder="请输入手机号" maxlength="11" inputmode="numeric">
        </div>

        <div class="form-group">
          <label class="form-label">验证码</label>
          <div class="code-row">
            <input type="text" id="auth-code" class="form-input" placeholder="4位验证码" maxlength="4" inputmode="numeric">
            <button class="btn-code" id="btn-send-code">获取验证码</button>
          </div>
        </div>

        <div class="auth-error" id="auth-error"></div>

        <button class="btn btn-primary auth-submit" id="btn-auth-submit">${isRegister ? "注册" : "登录"}</button>

        <div class="auth-switch" id="auth-switch">
          ${isRegister ? "已有账号？<span>去登录</span>" : "没有账号？<span>去注册</span>"}
        </div>
      </div>

      <div class="auth-dev-tip">开发模式：验证码将显示在页面上</div>
    </div>
  `;
}

// ---------- 绑定登录视图事件 ----------
function bindAuthEvents(currentMode) {
  let mode = currentMode;
  const phoneInput = $("#auth-phone");
  const codeInput = $("#auth-code");
  const sendBtn = $("#btn-send-code");
  const submitBtn = $("#btn-auth-submit");
  const switchBtn = $("#auth-switch");
  const errorEl = $("#auth-error");

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = msg ? "block" : "none";
  }

  // 手机号输入只允许数字
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "");
    showError("");
  });
  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/\D/g, "");
    showError("");
  });

  // 发送验证码
  sendBtn.addEventListener("click", () => {
    const phone = phoneInput.value.trim();
    if (!isValidPhone(phone)) {
      showError("请输入正确的手机号");
      return;
    }
    const code = sendCode(phone);
    startCountdown(sendBtn, 60);
    // 开发模式：弹出验证码提示
    showToast(`验证码：${code}`, 5000);
  });

  // 提交
  submitBtn.addEventListener("click", () => {
    const phone = phoneInput.value.trim();
    const code = codeInput.value.trim();
    if (!isValidPhone(phone)) { showError("请输入正确的手机号"); return; }
    if (!code) { showError("请输入验证码"); return; }
    if (!verifyCode(code)) { showError("验证码错误或已过期"); return; }

    const result = handleAuth(phone, code, mode === "register");
    if (!result.ok) { showError(result.msg); return; }

    // 登录成功
    clearToast();
    showAuthSuccess(result.msg, mode === "register");
  });

  // 切换登录/注册
  switchBtn.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    $("#view-auth").innerHTML = renderAuthView(mode);
    bindAuthEvents(mode);
  });
}

// ---------- Toast ----------
function showToast(msg, duration = 3000) {
  let toast = $(".auth-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "auth-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = "block";
  toast.style.animation = "none";
  requestAnimationFrame(() => {
    toast.style.animation = "slideUp .3s ease";
  });
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = "none"; }, duration);
}
function clearToast() {
  const toast = $(".auth-toast");
  if (toast) toast.style.display = "none";
}

// ---------- 登录成功动画 ----------
function showAuthSuccess(msg, isRegister) {
  const overlay = document.createElement("div");
  overlay.className = "levelup-overlay";
  overlay.innerHTML = `
    <div class="levelup-card">
      <div class="lu-icon">${isRegister ? "🎉" : "👋"}</div>
      <div class="lu-title">${msg}</div>
      <div class="lu-sub">开始你的面试备考之旅</div>
      <button class="lu-btn">进入学习</button>
    </div>
  `;
  document.body.appendChild(overlay);
  launchConfetti();
  overlay.querySelector(".lu-btn").addEventListener("click", () => {
    overlay.remove();
    $("#view-auth").style.display = "none";
    showView("learn");
    renderLearn();
    updateTopbarUser();
  });
}

// ---------- 顶部栏用户信息 ----------
function updateTopbarUser() {
  // 不在顶部栏显示用户信息，仅在个人中心页显示
  // 空函数，保留调用兼容性
}

// ---------- 退出登录 ----------
function logout() {
  clearSession();
  const userTag = $("#stat-user");
  if (userTag) userTag.remove();
  $("#view-auth").innerHTML = renderAuthView("login");
  bindAuthEvents("login");
  showView("auth");
}

// ---------- 初始化登录视图 ----------
function initAuth() {
  if (isLoggedIn()) {
    updateTopbarUser();
    return false; // 已登录
  }
  $("#view-auth").innerHTML = renderAuthView("login");
  bindAuthEvents("login");
  showView("auth");
  $("#topbar").style.display = "none";
  $(".tabbar").style.display = "none";
  return true; // 需要登录
}
