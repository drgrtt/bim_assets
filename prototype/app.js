// =========================================================
// BIMBO METHOD prototype
// Replace firebaseConfig below after creating a Firebase web app.
// Until then the prototype works in DEMO mode with localStorage.
// =========================================================

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const firebaseReady = Object.values(firebaseConfig).every(Boolean);

const state = {
  user: null,
  progress: {
    module01Viewed: false,
    test01Passed: false,
    test01Best: 0,
    module02Unlocked: false
  },
  authMode: "login"
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

const $ = (id) => document.getElementById(id);

function loadDemoState(){
  try{
    const saved = JSON.parse(localStorage.getItem("bimbo-method-demo-progress") || "null");
    if(saved) state.progress = {...state.progress, ...saved};
  }catch(e){}
}

function saveDemoState(){
  localStorage.setItem("bimbo-method-demo-progress", JSON.stringify(state.progress));
}

function setAuthMode(mode){
  state.authMode = mode;
  $("tabLogin").classList.toggle("active", mode === "login");
  $("tabSignup").classList.toggle("active", mode === "signup");
  $("authSubmit").textContent = mode === "login" ? "ВОЙТИ →" : "СОЗДАТЬ АККАУНТ →";
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("authMessage").textContent = "";
}

function showApp(email){
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("userEmail").textContent = email || "demo@bimbomethod.local";
  renderProgress();
  route("dashboard");
}

function showAuth(){
  $("appView").classList.add("hidden");
  $("authView").classList.remove("hidden");
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
    const b = $("module02State").querySelector("button");
    if(b) b.addEventListener("click", () => route("module02"));
    $("module02Locked").classList.add("hidden");
    $("module02Open").classList.remove("hidden");
  }else{
    $("module02Nav").innerHTML = "02. ПЕРСОНАЖ <span>LOCKED</span>";
    $("module02State").textContent = "СНАЧАЛА TEST 01";
    $("module02Locked").classList.remove("hidden");
    $("module02Open").classList.add("hidden");
  }
}

function route(name){
  if(name === "module02" && !state.progress.module02Unlocked){
    name = "module02";
  }

  document.querySelectorAll(".route").forEach(el => el.classList.remove("active"));
  const target = $(name);
  if(target) target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === name);
  });

  if(name === "module01"){
    state.progress.module01Viewed = true;
    persistProgress();
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

function showQuizResult(){
  $("quizCard").classList.add("hidden");
  $("quizResult").classList.remove("hidden");
  $("resultScore").textContent = `${quizScore}/5`;

  const passed = quizScore >= 4;
  if(passed){
    state.progress.test01Passed = true;
    state.progress.test01Best = Math.max(state.progress.test01Best || 0, quizScore);
    state.progress.module02Unlocked = true;
    persistProgress();
    $("resultTitle").textContent = quizScore === 5 ? "SHE GETS IT." : "MODULE PASSED.";
    $("resultText").textContent = "Module 02 открыт. Теперь можно перейти дальше, а результат останется в твоём прогрессе.";
    $("resultActions").innerHTML = '<button id="openM02" class="primary" type="button">ОТКРЫТЬ MODULE 02 →</button>';
    $("openM02").addEventListener("click", () => route("module02"));
  }else{
    state.progress.test01Best = Math.max(state.progress.test01Best || 0, quizScore);
    persistProgress();
    $("resultTitle").textContent = "ЕЩЁ РАЗ.";
    $("resultText").textContent = "Нужно минимум 4/5. Пересмотри логику модуля и попробуй ещё раз.";
    $("resultActions").innerHTML = '<button id="retryQuiz" class="primary" type="button">ПЕРЕСДАТЬ →</button>';
    $("retryQuiz").addEventListener("click", resetQuiz);
  }
  renderProgress();
}

async function persistProgress(){
  if(!firebaseReady){
    saveDemoState();
    return;
  }
  if(window.__bimboSaveProgress) await window.__bimboSaveProgress(state.progress);
}

async function startFirebase(){
  if(!firebaseReady){
    loadDemoState();
    $("setupBanner").classList.remove("hidden");
    return;
  }

  const [{initializeApp}, authMod, firestoreMod] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js")
  ]);

  const app = initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  const db = firestoreMod.getFirestore(app);

  window.__bimboAuth = auth;

  window.__bimboLoadProgress = async function(uid){
    const ref = firestoreMod.doc(db, "users", uid);
    const snap = await firestoreMod.getDoc(ref);
    if(snap.exists()) state.progress = {...state.progress, ...snap.data().progress};
  };

  window.__bimboSaveProgress = async function(progress){
    const user = auth.currentUser;
    if(!user) return;
    const ref = firestoreMod.doc(db, "users", user.uid);
    await firestoreMod.setDoc(ref, {
      email: user.email,
      progress,
      updatedAt: firestoreMod.serverTimestamp()
    }, {merge:true});
  };

  window.__bimboLogin = (email,password) => authMod.signInWithEmailAndPassword(auth,email,password);
  window.__bimboSignup = (email,password) => authMod.createUserWithEmailAndPassword(auth,email,password);
  window.__bimboLogout = () => authMod.signOut(auth);

  authMod.onAuthStateChanged(auth, async user => {
    state.user = user;
    if(user){
      await window.__bimboLoadProgress(user.uid);
      showApp(user.email);
    }else{
      showAuth();
    }
  });
}

$("tabLogin").addEventListener("click", () => setAuthMode("login"));
$("tabSignup").addEventListener("click", () => setAuthMode("signup"));

$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  $("authMessage").textContent = "";

  if(!firebaseReady){
    $("authMessage").textContent = "Firebase пока не подключён. Нажми «Войти в демо».";
    return;
  }

  try{
    if(state.authMode === "login") await window.__bimboLogin(email,password);
    else await window.__bimboSignup(email,password);
  }catch(err){
    $("authMessage").textContent = "Не получилось войти: " + (err?.message || "ошибка");
  }
});

$("demoLogin").addEventListener("click", () => {
  loadDemoState();
  showApp("demo@bimbomethod.local");
});

$("logoutBtn").addEventListener("click", async () => {
  if(firebaseReady && window.__bimboLogout) await window.__bimboLogout();
  else showAuth();
});

$("nextQuestion").addEventListener("click", () => {
  if(quizIndex < quiz.length-1){
    quizIndex++;
    renderQuiz();
  }else showQuizResult();
});

document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if(go) route(go.dataset.go);

  const nav = e.target.closest("[data-route]");
  if(nav){
    const name = nav.dataset.route;
    if(name === "module02" && !state.progress.module02Unlocked){
      route("module02");
    }else route(name);
  }
});

startFirebase();
