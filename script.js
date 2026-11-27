(() => {
  const DAYS = window.ADVENT_DAYS;
  const STORAGE_KEY = "adviento-abiertos";
  const params = new URLSearchParams(location.search);
  // Ponlo a true para que cada día solo se abra cuando llegue su fecha de diciembre
  const BLOQUEO_ACTIVO = false;

  // ?preview muestra todo desbloqueado; ?dia=N simula que hoy es N de diciembre (para revisar)
  function unlockedUpTo() {
    if (!BLOQUEO_ACTIVO || params.has("preview")) return 25;
    if (params.has("dia")) return Math.max(0, Math.min(25, parseInt(params.get("dia"), 10) || 0));
    const now = new Date();
    const month = now.getMonth();
    const date = now.getDate();
    if (month === 11) return Math.min(date, 25);
    if (month === 0 && date <= 6) return 25; // hasta Reyes se puede seguir viendo todo
    return 0;
  }

  function daysUntilChristmas() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let xmas = new Date(now.getFullYear(), 11, 25);
    if (today > xmas) xmas = new Date(now.getFullYear() + 1, 11, 25);
    return Math.round((xmas - today) / 86400000);
  }

  function daysUntilDecemberDay(day) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let target = new Date(now.getFullYear(), 11, day);
    if (today > target) target = new Date(now.getFullYear() + 1, 11, day);
    return Math.round((target - today) / 86400000);
  }

  const opened = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  const saveOpened = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...opened]));

  const grid = document.getElementById("grid");
  const modal = document.getElementById("modal");
  const toast = document.getElementById("toast");
  const unlocked = unlockedUpTo();

  // Luces de la cabecera
  const lights = document.querySelector(".lights");
  const lightCount = Math.max(10, Math.floor(window.innerWidth / 34));
  for (let i = 0; i < lightCount; i++) lights.appendChild(document.createElement("span"));

  // Nieve
  const snow = document.querySelector(".snow");
  const flakes = ["❄", "❅", "❆", "•"];
  const flakeCount = window.innerWidth < 600 ? 28 : 50;
  for (let i = 0; i < flakeCount; i++) {
    const f = document.createElement("span");
    f.className = "flake";
    f.textContent = flakes[i % flakes.length];
    f.style.left = Math.random() * 100 + "vw";
    f.style.fontSize = 8 + Math.random() * 14 + "px";
    f.style.animationDuration = 7 + Math.random() * 10 + "s";
    f.style.animationDelay = -Math.random() * 15 + "s";
    f.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
    f.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
    snow.appendChild(f);
  }

  // Cuenta atrás
  const countdown = document.getElementById("countdown");
  const left = daysUntilChristmas();
  if (left === 0) countdown.innerHTML = "🎄 <strong>¡Hoy es Navidad!</strong> 🎁";
  else if (left === 1) countdown.innerHTML = "🎅 ¡Mañana es Navidad! <strong>1</strong> día";
  else countdown.innerHTML = `🎁 Faltan <strong>${left}</strong> días para Navidad`;

  function render() {
    grid.innerHTML = "";
    DAYS.forEach((d, i) => {
      const day = i + 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      btn.dataset.day = day;
      if (day >= 24) btn.classList.add("day--special");

      if (day > unlocked) {
        btn.classList.add("day--locked");
        btn.setAttribute("aria-label", `Día ${day}, bloqueado`);
        btn.innerHTML = `<span class="day__num">${day}</span><span class="day__lock">🔒</span>`;
      } else if (opened.has(day)) {
        btn.classList.add("day--open");
        btn.setAttribute("aria-label", `Día ${day}: ${d.title}`);
        btn.innerHTML = `<span class="day__emoji">${d.emoji}</span><span class="day__num">Día ${day}</span>`;
      } else {
        btn.classList.add("day--gift");
        if (day === unlocked) btn.classList.add("is-today");
        btn.setAttribute("aria-label", `Día ${day}, ¡regalo por abrir!`);
        btn.innerHTML = `<span class="day__bow">🎀</span><span class="day__num"><span>${day}</span></span>`;
      }
      grid.appendChild(btn);
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function burst(x, y) {
    const items = ["❤️", "💖", "✨", "⭐", "🎁", "💕"];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.className = "burst";
      s.textContent = items[i % items.length];
      s.style.left = x + "px";
      s.style.top = y + "px";
      const angle = (Math.PI * 2 * i) / 16;
      const dist = 70 + Math.random() * 70;
      s.style.setProperty("--x", Math.cos(angle) * dist + "px");
      s.style.setProperty("--y", Math.sin(angle) * dist + "px");
      s.style.setProperty("--r", (Math.random() * 360 - 180) + "deg");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }
  }

  let lastFocus = null;
  function openModal(day) {
    const d = DAYS[day - 1];
    document.getElementById("modal-day").textContent = `${day} de diciembre`;
    document.getElementById("modal-emoji").textContent = d.emoji;
    document.getElementById("modal-title").textContent = d.title;
    document.getElementById("modal-text").textContent = d.text;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal__close").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".day");
    if (!btn) return;
    const day = Number(btn.dataset.day);

    if (day > unlocked) {
      btn.classList.remove("shake");
      void btn.offsetWidth;
      btn.classList.add("shake");
      const n = params.has("dia") ? day - unlocked : daysUntilDecemberDay(day);
      showToast(n === 1 ? "🤫 ¡Paciencia! Se abre mañana" : `🤫 ¡Paciencia! Faltan ${n} días para abrirlo`);
      return;
    }

    if (!opened.has(day)) {
      const r = btn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      opened.add(day);
      saveOpened();
      render();
      setTimeout(() => openModal(day), 350);
    } else {
      openModal(day);
    }
  });

  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  render();
})();
