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
  onboardingDone: false,
  module01Viewed: false,
  test01Passed: false,
  test01Best: 0,
  module02Unlocked: false,
  module02Viewed: false,
  test02Passed: false,
  test02Best: 0,
  module03Unlocked: false
});

const state = { user: null, progress: defaultProgress() };
let pendingInviteToken = null;

const quiz1 = [
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

const quiz2 = [
  {
    q: "Что лучше всего описывает готового персонажа?",
    a: [
      ["Список из двадцати любимых вещей", false, "Интересы сами по себе не объясняют поведение."],
      ["Набор правил, по которым можно предсказать её реакцию в разных ситуациях", true, "Персонаж становится устойчивым, когда его поведение можно воспроизводить, а не придумывать заново каждый раз."],
      ["Одна яркая черта характера", false, "Одной черты недостаточно для живого поведения."],
      ["Готовый визуальный стиль аккаунта", false, "Визуал относится к образу, но не заменяет характер."]
    ]
  },
  {
    q: "Что относится к голосу персонажа?",
    a: [
      ["Только набор любимых слов", false, "Словарь — лишь часть голоса."],
      ["Темп, длина фраз, юмор, уровень откровенности и типичные реакции", true, "Голос — это способ говорить и реагировать, а не просто список слов."],
      ["Цвет одежды и макияж", false, "Это визуальный уровень."],
      ["Возраст и место рождения", false, "Это биографические данные, а не голос."]
    ]
  },
  {
    q: "Зачем персонажу противоречие?",
    a: [
      ["Чтобы сделать анкету сложнее", false, "Нам не нужна сложность ради сложности."],
      ["Чтобы он выглядел непоследовательным", false, "Хорошее противоречие не разрушает характер, а делает его объёмнее."],
      ["Чтобы создавать живые реакции и новые сюжетные ситуации", true, "Противоречие даёт напряжение и материал для поведения."],
      ["Чтобы менять личность под каждый пост", false, "Наоборот, персонаж должен оставаться узнаваемым."]
    ]
  },
  {
    q: "Что лучше считать сильной привычкой персонажа?",
    a: [
      ["Всегда фотографироваться в одной позе", false, "Это повтор визуала, а не поведения."],
      ["Регулярный маленький ритуал, который может проявляться в разных сценах", true, "Так привычка создаёт узнаваемость без копирования одного кадра."],
      ["Каждую неделю менять стиль общения", false, "Это размывает характер."],
      ["Использовать один и тот же фон", false, "Фон не является привычкой персонажа."]
    ]
  },
  {
    q: "Зачем заранее задавать границы персонажа?",
    a: [
      ["Чтобы ограничить количество контента", false, "Границы не должны обеднять контент."],
      ["Чтобы понимать, что она не скажет и не сделает, и не размывать характер", true, "Границы удерживают персонажа целостным между разными сценами и форматами."],
      ["Чтобы запретить ей менять одежду", false, "Внешность и стиль могут меняться внутри системы."],
      ["Чтобы не использовать новые площадки", false, "Площадки не относятся к характеру."]
    ]
  }
];

const quizzes = {
  1: { data: quiz1, card:"quizCard", meta:"questionMeta", text:"questionText", answers:"answers", feedback:"quizFeedback", next:"nextQuestion", result:"quizResult", resultScore:"resultScore", resultTitle:"resultTitle", resultText:"resultText", resultActions:"resultActions" },
  2: { data: quiz2, card:"quiz2Card", meta:"question2Meta", text:"question2Text", answers:"answers2", feedback:"quiz2Feedback", next:"nextQuestion2", result:"quiz2Result", resultScore:"result2Score", resultTitle:"result2Title", resultText:"result2Text", resultActions:"result2Actions" }
};

const quizState = {
  1: { index:0, score:0, locked:false },
  2: { index:0, score:0, locked:false }
};

const $ = id => document.getElementById(id);

function showBanner(text){ $("setupBanner").textContent = text; $("setupBanner").classList.remove("hidden"); }
function hideBanner(){ $("setupBanner").classList.add("hidden"); }

function setAuthScreen(mode){
  $("authView").classList.remove("hidden");
  $("appView").classList.add("hidden");
  $("authForm").classList.toggle("hidden", mode !== "login");
  $("inviteForm").classList.toggle("hidden", mode !== "invite");
  $("recoveryForm").classList.toggle("hidden", mode !== "recovery");
  $("forgotPassword").classList.toggle("hidden", mode !== "login");
  $("authHint").classList.toggle("hidden", mode !== "login");
  $("authMessage").textContent = "";
  if(mode === "invite") $("authIntro").textContent = "Приглашение подтверждено. Придумай пароль для входа в BIMBO METHOD.";
  else if(mode === "recovery") $("authIntro").textContent = "Придумай новый пароль для своего аккаунта.";
  else $("authIntro").textContent = "Войди в свой курс. Прогресс и результаты тестов сохраняются за твоим аккаунтом.";
}

async function loadProgress(){
  const response = await fetch("/api/progress", { cache:"no-store" });
  if(response.status === 401) throw new Error("Сессия истекла. Войди ещё раз.");
  if(!response.ok) throw new Error("Не удалось загрузить прогресс.");
  state.progress = {...defaultProgress(), ...(await response.json())};
}

async function persistProgress(){
  if(!state.user) return;
  const response = await fetch("/api/progress", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      onboardingDone: !!state.progress.onboardingDone,
      module01Viewed: !!state.progress.module01Viewed,
      test01Best: Number(state.progress.test01Best || 0),
      module02Viewed: !!state.progress.module02Viewed,
      test02Best: Number(state.progress.test02Best || 0)
    })
  });
  if(response.status === 401) throw new Error("Сессия истекла. Войди ещё раз.");
  if(!response.ok) throw new Error("Не удалось сохранить прогресс.");
  state.progress = {...defaultProgress(), ...(await response.json())};
  renderProgress();
}

async function enterApp(user){
  hideBanner();
  state.user = user;
  try{ await loadProgress(); }catch(err){ showBanner(err?.message || "Не удалось загрузить прогресс."); state.progress = defaultProgress(); }
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("userEmail").textContent = user?.email || "";
  renderProgress();
  route(state.progress.onboardingDone ? "dashboard" : "onboarding", false);
}

function renderProgress(){
  const completed = (state.progress.test01Passed ? 1 : 0) + (state.progress.test02Passed ? 1 : 0);
  $("progressCount").textContent = completed;
  $("progressBar").style.width = `${(completed / 13) * 100}%`;

  const m2 = !!state.progress.module02Unlocked;
  const m3 = !!state.progress.module03Unlocked;

  $("module02Nav").classList.toggle("locked", !m2);
  $("test02Nav").classList.toggle("locked", !m2);
  $("module02Row").classList.toggle("locked", !m2);
  $("module02Locked").classList.toggle("hidden", m2);
  $("module02Open").classList.toggle("hidden", !m2);
  $("test02Locked").classList.toggle("hidden", m2);
  $("test02Open").classList.toggle("hidden", !m2);

  if(m2){
    $("module02Nav").innerHTML = "02. ПЕРСОНАЖ <span>OPEN</span>";
    $("test02Nav").innerHTML = "TEST 02 <span>OPEN</span>";
    $("module02State").innerHTML = '<button data-go="module02" type="button">ОТКРЫТЬ →</button>';
  }else{
    $("module02Nav").innerHTML = "02. ПЕРСОНАЖ <span>LOCKED</span>";
    $("test02Nav").innerHTML = "TEST 02 <span>LOCKED</span>";
    $("module02State").textContent = "СНАЧАЛА TEST 01";
  }

  $("module03Nav").classList.toggle("locked", !m3);
  $("module03Row").classList.toggle("locked", !m3);
  $("module03Locked").classList.toggle("hidden", m3);
  $("module03Open").classList.toggle("hidden", !m3);
  if(m3){
    $("module03Nav").innerHTML = "03. ВНЕШНОСТЬ <span>OPEN</span>";
    $("module03State").innerHTML = '<button data-go="module03" type="button">ОТКРЫТЬ →</button>';
  }else{
    $("module03Nav").innerHTML = "03. ВНЕШНОСТЬ <span>LOCKED</span>";
    $("module03State").textContent = "СНАЧАЛА TEST 02";
  }
}

function route(name, saveView = true){
  if((name === "module02" || name === "test02") && !state.progress.module02Unlocked) name = name === "test02" ? "test02" : "module02";
  if(name === "module03" && !state.progress.module03Unlocked) name = "module03";

  document.querySelectorAll(".route").forEach(el => el.classList.remove("active"));
  $(name)?.classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.route === name));

  if(name === "module01" && saveView){ state.progress.module01Viewed = true; persistProgress().catch(err => showBanner(err.message)); }
  if(name === "module02" && state.progress.module02Unlocked && saveView){ state.progress.module02Viewed = true; persistProgress().catch(err => showBanner(err.message)); }
  if(name === "test01") resetQuiz(1);
  if(name === "test02" && state.progress.module02Unlocked) resetQuiz(2);
  window.scrollTo({top:0, behavior:"smooth"});
}

function resetQuiz(which){
  const s = quizState[which];
  s.index = 0; s.score = 0; s.locked = false;
  renderQuiz(which);
}

function renderQuiz(which){
  const cfg = quizzes[which];
  const s = quizState[which];
  const item = cfg.data[s.index];
  s.locked = false;
  $(cfg.meta).textContent = `QUESTION ${String(s.index + 1).padStart(2,"0")} / 05`;
  $(cfg.text).textContent = item.q;
  $(cfg.answers).innerHTML = "";
  $(cfg.feedback).classList.add("hidden");
  $(cfg.next).classList.add("hidden");
  $(cfg.card).classList.remove("hidden");
  $(cfg.result).classList.add("hidden");

  item.a.forEach(([label, correct, feedback], i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = `${String.fromCharCode(65+i)}. ${label}`;
    btn.addEventListener("click", () => chooseAnswer(which, btn, correct, feedback));
    $(cfg.answers).appendChild(btn);
  });
}

function chooseAnswer(which, btn, correct, feedback){
  const cfg = quizzes[which];
  const s = quizState[which];
  if(s.locked) return;
  s.locked = true;
  const buttons = [...$(cfg.answers).querySelectorAll(".answer-btn")];
  buttons.forEach(b => b.disabled = true);
  if(correct){ s.score++; btn.classList.add("correct"); }
  else{
    btn.classList.add("wrong");
    const correctIndex = cfg.data[s.index].a.findIndex(a => a[1]);
    buttons[correctIndex]?.classList.add("correct");
  }
  $(cfg.feedback).textContent = feedback;
  $(cfg.feedback).classList.remove("hidden");
  $(cfg.next).textContent = s.index === cfg.data.length - 1 ? "ПОКАЗАТЬ РЕЗУЛЬТАТ →" : "ДАЛЬШЕ →";
  $(cfg.next).classList.remove("hidden");
}

async function showQuizResult(which){
  const cfg = quizzes[which];
  const s = quizState[which];
  $(cfg.card).classList.add("hidden");
  $(cfg.result).classList.remove("hidden");
  $(cfg.resultScore).textContent = `${s.score}/5`;

  if(which === 1) state.progress.test01Best = Math.max(state.progress.test01Best || 0, s.score);
  else state.progress.test02Best = Math.max(state.progress.test02Best || 0, s.score);

  try{ await persistProgress(); hideBanner(); }catch(err){ showBanner(err?.message || "Не удалось сохранить результат."); }

  const passed = which === 1 ? state.progress.test01Passed : state.progress.test02Passed;
  const best = which === 1 ? state.progress.test01Best : state.progress.test02Best;
  if(passed){
    $(cfg.resultTitle).textContent = best === 5 ? "SHE GETS IT." : "MODULE PASSED.";
    if(which === 1){
      $(cfg.resultText).textContent = "Module 02 открыт. Результат сохранён за твоим аккаунтом.";
      $(cfg.resultActions).innerHTML = '<button class="primary" data-go="module02" type="button">ОТКРЫТЬ MODULE 02 →</button>';
    }else{
      $(cfg.resultText).textContent = "Module 03 / Внешность открыт. Результат сохранён за твоим аккаунтом.";
      $(cfg.resultActions).innerHTML = '<button class="primary" data-go="module03" type="button">ОТКРЫТЬ MODULE 03 →</button>';
    }
  }else{
    $(cfg.resultTitle).textContent = "ЕЩЁ РАЗ.";
    $(cfg.resultText).textContent = "Нужно минимум 4/5. Вернись к логике модуля и попробуй ещё раз.";
    $(cfg.resultActions).innerHTML = `<button class="primary" data-retry="${which}" type="button">ПЕРЕСДАТЬ →</button>`;
  }
  renderProgress();
}

function nextRoute(){
  if(!state.progress.onboardingDone) return "onboarding";
  if(!state.progress.test01Passed) return state.progress.module01Viewed ? "test01" : "module01";
  if(!state.progress.test02Passed) return state.progress.module02Viewed ? "test02" : "module02";
  return "module03";
}

$("finishOnboarding").addEventListener("click", async () => {
  state.progress.onboardingDone = true;
  try{ await persistProgress(); }catch(err){ showBanner(err?.message || "Не удалось сохранить старт."); }
  route("module01");
});

$("continueBtn").addEventListener("click", () => route(nextRoute()));

$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  $("authMessage").textContent = "";
  $("authSubmit").disabled = true;
  try{ await enterApp(await login(email, password)); }
  catch(err){ $("authMessage").textContent = "Не получилось войти: " + (err?.message || "ошибка"); }
  finally{ $("authSubmit").disabled = false; }
});

$("forgotPassword").addEventListener("click", async () => {
  const email = $("email").value.trim();
  if(!email){ $("authMessage").textContent = "Сначала введи email, на который зарегистрирован доступ."; return; }
  try{ await requestPasswordRecovery(email); $("authMessage").textContent = "Письмо для смены пароля отправлено. Проверь почту."; }
  catch(err){ $("authMessage").textContent = "Не получилось отправить письмо: " + (err?.message || "ошибка"); }
});

$("inviteForm").addEventListener("submit", async e => {
  e.preventDefault();
  const p1 = $("invitePassword").value, p2 = $("invitePassword2").value;
  if(p1 !== p2){ $("authMessage").textContent = "Пароли не совпадают."; return; }
  if(!pendingInviteToken){ $("authMessage").textContent = "Ссылка приглашения недействительна или уже использована."; return; }
  try{ const user = await acceptInvite(pendingInviteToken, p1); pendingInviteToken = null; await enterApp(user); }
  catch(err){ $("authMessage").textContent = "Не получилось активировать доступ: " + (err?.message || "ошибка"); }
});

$("recoveryForm").addEventListener("submit", async e => {
  e.preventDefault();
  const p1 = $("recoveryPassword").value, p2 = $("recoveryPassword2").value;
  if(p1 !== p2){ $("authMessage").textContent = "Пароли не совпадают."; return; }
  try{ await updateUser({password:p1}); const user = await getUser(); if(user) await enterApp(user); else setAuthScreen("login"); }
  catch(err){ $("authMessage").textContent = "Не получилось сохранить пароль: " + (err?.message || "ошибка"); }
});

$("logoutBtn").addEventListener("click", async () => {
  try{ await logout(); }catch(e){}
  state.user = null; state.progress = defaultProgress(); setAuthScreen("login");
});

$("nextQuestion").addEventListener("click", async () => {
  const s = quizState[1];
  if(s.index < quiz1.length - 1){ s.index++; renderQuiz(1); } else await showQuizResult(1);
});

$("nextQuestion2").addEventListener("click", async () => {
  const s = quizState[2];
  if(s.index < quiz2.length - 1){ s.index++; renderQuiz(2); } else await showQuizResult(2);
});

document.addEventListener("click", e => {
  const retry = e.target.closest("[data-retry]");
  if(retry){ resetQuiz(Number(retry.dataset.retry)); return; }
  const go = e.target.closest("[data-go]");
  if(go){ route(go.dataset.go); return; }
  const nav = e.target.closest("[data-route]");
  if(nav) route(nav.dataset.route);
});

async function bootstrap(){
  setAuthScreen("login");
  try{
    const callback = await handleAuthCallback();
    if(callback?.type === "invite" && callback.token){ pendingInviteToken = callback.token; setAuthScreen("invite"); return; }
    if(callback?.type === "recovery"){ setAuthScreen("recovery"); return; }
    const user = callback?.user || await getUser();
    if(user) await enterApp(user); else setAuthScreen("login");
  }catch(err){ setAuthScreen("login"); $("authMessage").textContent = "Ошибка авторизации: " + (err?.message || "попробуй ещё раз"); }
}

bootstrap();