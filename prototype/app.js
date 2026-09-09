import {
  login,
  logout,
  getUser,
  handleAuthCallback,
  acceptInvite,
  requestPasswordRecovery,
  updateUser
} from "https://esm.sh/@netlify/identity@2.0.0";

const defaultProgress = () => ({
  module01Viewed: false,
  test01Passed: false,
  test01Best: 0,
  module02Unlocked: false
});

const state = {
  user: null,
  progress: defaultProgress()
};

const quiz = [
  {
    q: "Какой вариант уже является концепцией AI-модели, а не просто описанием внешности или ниши?",
    a: [
      ["23-летняя брюнетка с зелёными глазами", false, "Здесь описана только внешность. Мы пока не понимаем её мир, роль и источники контента."],
      ["Gamer girl с красивым игровым сетапом", false, "Это направление и визуальная среда, но пока неясно, чем именно персонаж отличается."],
      ["Домашняя gamer girl, которая ощущается как весёлая интернет-подруга и живёт между ночными играми, мемами и бытовым хаосом", true, "Здесь понятны ниша, эмоциональная роль, мир персонажа и повторяемые источники контента."],
      ["Девушка в Y2K-одежде, которая любит кофе и путешествия", false, "Эстетика и общие интересы ещё не дают полноценную контентную логику."]
    ]
  },
  {
    q: "Какой признак сильнее всего показывает, что ниша подходит для долгого ведения контента?",
    a: [
      ["Для неё легко подобрать красивую одежду", false, "Одежда помогает визуалу, но не создаёт десятки новых сюжетов."],
      ["С ней легко придумать десятки разных ситуаций и событий", true, "Большое количество естественных ситуаций превращает нишу в устойчивый контентный двигатель."],
      ["У неё очень узнаваемый визуальный образ", false, "Узнаваемость полезна, но сама по себе не защищает контент от повторов."],
      ["Она выглядит дорого и эстетично", false, "Эстетика не определяет, хватит ли персонажу жизни на десятки публикаций."]
    ]
  },
  {
    q: "Что в BIMBO METHOD означает эмоциональная роль персонажа?",
    a: [
      ["Главная эмоция на её фотографиях", false, "Выражение лица относится к одному кадру, а эмоциональная роль — к устойчивому восприятию персонажа."],
      ["Полный список черт её характера", false, "Характер поддерживает роль, но сама роль — это не анкета качеств."],
      ["Основное ощущение и тип отношений, которые получает аудитория рядом с ней", true, "Именно поэтому похожие внешне девушки могут ощущаться как bestie, luxury baby или crush."],
      ["Цвета и эстетика её аккаунта", false, "Визуальная эстетика помогает передать роль, но не является самой ролью."]
    ]
  },
  {
    q: "Вся идея модели строится вокруг того, что она всегда носит каблуки. Почему этого недостаточно?",
    a: [
      ["Один визуальный элемент не объясняет её мир, жизнь и откуда регулярно брать новые ситуации", true, "Каблуки могут быть частью узнаваемого контента, но вокруг них всё равно нужен персонаж и более широкий мир."],
      ["В AI-контенте нельзя строить нишу вокруг одежды", false, "Можно. Проблема не в одежде, а в том, что одна деталь не создаёт полноценную концепцию."],
      ["Каблуки подходят только luxury-персонажам", false, "Один и тот же элемент может существовать в разных концепциях."],
      ["Для концепции обязательно нужно несколько разных фетишей", false, "Количество фетишей не делает концепцию сильнее. Нужны мир, роль, аудитория и сценарии."]
    ]
  },
  {
    q: "Что должно быть понятно к концу первого модуля до детальной разработки внешности?",
    a: [
      ["Точный цвет глаз, форма носа, длина волос и гардероб", false, "Это относится к следующим этапам. Сначала собираем смысловую основу модели."],
      ["Только ниша и название аккаунта", false, "Одной ниши недостаточно. Нужны аудитория, роль, мир и контентная логика."],
      ["Кто она, для кого она, какое ощущение даёт, в каком мире живёт и откуда брать контент", true, "Это и есть основа, на которой дальше строятся персонаж, внешность и вся система."],
      ["Полный контент-план на месяц и полностью готовый платный продукт", false, "На первом этапе мы проверяем жизнеспособность самой концепции, а не собираем всю монетизацию."]
    ]
  }
];

let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;
let pendingInviteToken = null;

const $ = (id) => document.getElementById(id);

function showBanner(text){
  $("setupBanner").textContent = text;
  $("setupBanner").classList.remove("hidden");
}

function hideBanner(){
  $("setupBanner").classList.add("hidden");
}

function setAuthScreen(mode){
  $("authView").classList.remove("hidden");
  $("appView").classList.add("hidden");
  $("authForm").classList.toggle("hidden", mode !== "login");
  $("inviteForm").classList.toggle("hidden", mode !== "invite");
  $("recoveryForm").classList.toggle("hidden", mode !== "recovery");
  $("forgotPassword").classList.toggle("hidden", mode !== "login");
  $("authHint").classList.toggle("hidden", mode !== "login");
  $("authMessage").textContent = "";

  if(mode === "invite"){
    $("authIntro").textContent = "Приглашение подтверждено. Придумай пароль для входа в BIMBO METHOD.";
  }else if(mode === "recovery"){
    $("authIntro").textContent = "Придумай новый пароль для своего аккаунта.";
  }else{
    $("authIntro").textContent = "Войди в свой курс. Прогресс и результаты тестов сохраняются за твоим аккаунтом.";
  }
}

async function loadProgress(){
  const response = await fetch("/api/progress", { cache: "no-store" });
  if(response.status === 401) throw new Error("Сессия истекла. Войди ещё раз.");
  if(!response.ok) throw new Error("Не удалось загрузить прогресс.");
  const data = await response.json();
  state.progress = {...defaultProgress(), ...data};
}

async function persistProgress(){
  if(!state.user) return;
  const response = await fetch("/api/progress", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      module01Viewed: !!state.progress.module01Viewed,
      test01Best: Number(state.progress.test01Best || 0)
    })
  });
  if(response.status === 401) throw new Error("Сессия истекла. Войди ещё раз.");
  if(!response.ok) throw new Error("Не удалось сохранить прогресс.");
  const saved = await response.json();
  state.progress = {...defaultProgress(), ...saved};
}

async function enterApp(user){
  hideBanner();
  state.user = user;
  try{
    await loadProgress();
  }catch(err){
    showBanner(err?.message || "Не удалось загрузить прогресс.");
    state.progress = defaultProgress();
  }
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("userEmail").textContent = user?.email || "";
  renderProgress();
  route("dashboard", false);
}

function renderProgress(){
  const completed = state.progress.test01Passed ? 1 : 0;
  $("progressCount").textContent = completed;
  $("progressBar").style.width = `${(completed / 13) * 100}%`;

  const unlocked = !!state.progress.module02Unlocked;
  $("module02Nav").classList.toggle("locked", !unlocked);
  $("module02Row").classList.toggle("locked", !unlocked);

  if(unlocked){
    $("module02Nav").innerHTML = "02. ПЕРСОНАЖ <span>OPEN</span>";
    $("module02State").innerHTML = '<button data-go="module02" type="button">ОТКРЫТЬ →</button>';
    $("module02Locked").classList.add("hidden");
    $("module02Open").classList.remove("hidden");
  }else{
    $("module02Nav").innerHTML = "02. ПЕРСОНАЖ <span>LOCKED</span>";
    $("module02State").textContent = "СНАЧАЛА TEST 01";
    $("module02Locked").classList.remove("hidden");
    $("module02Open").classList.add("hidden");
  }
}

function route(name, saveView = true){
  document.querySelectorAll(".route").forEach(el => el.classList.remove("active"));
  const target = $(name);
  if(target) target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === name);
  });

  if(name === "module01" && saveView){
    state.progress.module01Viewed = true;
    persistProgress().catch(err => showBanner(err.message));
  }

  if(name === "test01") resetQuiz();
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderQuiz(){
  const item = quiz[quizIndex];
  quizLocked = false;
  $("questionMeta").textContent = `QUESTION ${String(quizIndex+1).padStart(2,"0")} / 05`;
  $("questionText").textContent = item.q;
  $("answers").innerHTML = "";
  $("quizFeedback").classList.add("hidden");
  $("nextQuestion").classList.add("hidden");
  $("quizCard").classList.remove("hidden");
  $("quizResult").classList.add("hidden");

  item.a.forEach(([label, correct, feedback], i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = `${String.fromCharCode(65+i)}. ${label}`;
    btn.addEventListener("click", () => chooseAnswer(btn, correct, feedback));
    $("answers").appendChild(btn);
  });
}

function chooseAnswer(btn, correct, feedback){
  if(quizLocked) return;
  quizLocked = true;
  const buttons = [...document.querySelectorAll(".answer-btn")];
  buttons.forEach(b => b.disabled = true);

  if(correct){
    quizScore++;
    btn.classList.add("correct");
  }else{
    btn.classList.add("wrong");
    const correctIndex = quiz[quizIndex].a.findIndex(a => a[1]);
    if(buttons[correctIndex]) buttons[correctIndex].classList.add("correct");
  }

  $("quizFeedback").textContent = feedback;
  $("quizFeedback").classList.remove("hidden");
  $("nextQuestion").textContent = quizIndex === quiz.length-1 ? "ПОКАЗАТЬ РЕЗУЛЬТАТ →" : "ДАЛЬШЕ →";
  $("nextQuestion").classList.remove("hidden");
}

function resetQuiz(){
  quizIndex = 0;
  quizScore = 0;
  renderQuiz();
}

async function showQuizResult(){
  $("quizCard").classList.add("hidden");
  $("quizResult").classList.remove("hidden");
  $("resultScore").textContent = `${quizScore}/5`;

  state.progress.test01Best = Math.max(state.progress.test01Best || 0, quizScore);

  try{
    await persistProgress();
    hideBanner();
  }catch(err){
    showBanner(err?.message || "Не удалось сохранить результат.");
  }

  const passed = state.progress.test01Passed;
  if(passed){
    $("resultTitle").textContent = state.progress.test01Best === 5 ? "SHE GETS IT." : "MODULE PASSED.";
    $("resultText").textContent = "Module 02 открыт. Результат сохранён за твоим аккаунтом и останется после входа с другого устройства.";
    $("resultActions").innerHTML = '<button id="openM02" class="primary" type="button">ОТКРЫТЬ MODULE 02 →</button>';
    $("openM02").addEventListener("click", () => route("module02"));
  }else{
    $("resultTitle").textContent = "ЕЩЁ РАЗ.";
    $("resultText").textContent = "Нужно минимум 4/5. Пересмотри логику модуля и попробуй ещё раз.";
    $("resultActions").innerHTML = '<button id="retryQuiz" class="primary" type="button">ПЕРЕСДАТЬ →</button>';
    $("retryQuiz").addEventListener("click", resetQuiz);
  }
  renderProgress();
}

$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  $("authMessage").textContent = "";
  $("authSubmit").disabled = true;

  try{
    const user = await login(email, password);
    await enterApp(user);
  }catch(err){
    $("authMessage").textContent = "Не получилось войти: " + (err?.message || "ошибка");
  }finally{
    $("authSubmit").disabled = false;
  }
});

$("forgotPassword").addEventListener("click", async () => {
  const email = $("email").value.trim();
  if(!email){
    $("authMessage").textContent = "Сначала введи email, на который зарегистрирован доступ.";
    return;
  }
  try{
    await requestPasswordRecovery(email);
    $("authMessage").textContent = "Письмо для смены пароля отправлено. Проверь почту.";
  }catch(err){
    $("authMessage").textContent = "Не получилось отправить письмо: " + (err?.message || "ошибка");
  }
});

$("inviteForm").addEventListener("submit", async e => {
  e.preventDefault();
  const p1 = $("invitePassword").value;
  const p2 = $("invitePassword2").value;
  if(p1 !== p2){
    $("authMessage").textContent = "Пароли не совпадают.";
    return;
  }
  if(!pendingInviteToken){
    $("authMessage").textContent = "Ссылка приглашения недействительна или уже использована.";
    return;
  }
  try{
    const user = await acceptInvite(pendingInviteToken, p1);
    pendingInviteToken = null;
    await enterApp(user);
  }catch(err){
    $("authMessage").textContent = "Не получилось активировать доступ: " + (err?.message || "ошибка");
  }
});

$("recoveryForm").addEventListener("submit", async e => {
  e.preventDefault();
  const p1 = $("recoveryPassword").value;
  const p2 = $("recoveryPassword2").value;
  if(p1 !== p2){
    $("authMessage").textContent = "Пароли не совпадают.";
    return;
  }
  try{
    await updateUser({password:p1});
    const user = await getUser();
    if(user) await enterApp(user);
    else setAuthScreen("login");
  }catch(err){
    $("authMessage").textContent = "Не получилось сохранить пароль: " + (err?.message || "ошибка");
  }
});

$("logoutBtn").addEventListener("click", async () => {
  try{ await logout(); }catch(e){}
  state.user = null;
  state.progress = defaultProgress();
  setAuthScreen("login");
});

$("nextQuestion").addEventListener("click", async () => {
  if(quizIndex < quiz.length-1){
    quizIndex++;
    renderQuiz();
  }else{
    await showQuizResult();
  }
});

document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if(go) route(go.dataset.go);

  const nav = e.target.closest("[data-route]");
  if(nav) route(nav.dataset.route);
});

async function bootstrap(){
  setAuthScreen("login");
  try{
    const callback = await handleAuthCallback();

    if(callback?.type === "invite" && callback.token){
      pendingInviteToken = callback.token;
      setAuthScreen("invite");
      return;
    }

    if(callback?.type === "recovery"){
      setAuthScreen("recovery");
      return;
    }

    const user = callback?.user || await getUser();
    if(user){
      await enterApp(user);
    }else{
      setAuthScreen("login");
    }
  }catch(err){
    setAuthScreen("login");
    $("authMessage").textContent = "Ошибка авторизации: " + (err?.message || "попробуй ещё раз");
  }
}

bootstrap();