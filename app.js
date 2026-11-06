const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name) => `<i data-lucide="${name}"></i>`;
const STORAGE_KEY = "leishemOS.v1";

const apps = [
  { id: "about", name: "About Me", icon: "user-round", description: "The person behind the pixels", single: true },
  { id: "projects", name: "Project Explorer", icon: "folder-kanban", description: "Things I am building", single: true },
  { id: "developer", name: "Developer Center", icon: "blocks", description: "Tools, skills and interests", single: true },
  { id: "terminal", name: "Terminal", icon: "terminal-square", description: "A safe simulated shell", single: false },
  { id: "studio", name: "Code Studio", icon: "code-2", description: "HTML, CSS and JavaScript playground", single: true },
  { id: "hardware", name: "Hardware Lab", icon: "cpu", description: "Embedded systems and experiments", single: true },
  { id: "github", name: "GitHub", icon: "github", description: "Public repositories from GitHub", single: true },
  { id: "files", name: "File Manager", icon: "files", description: "Browse the virtual filesystem", single: true },
  { id: "notes", name: "Notes", icon: "notebook-pen", description: "Local scratchpad", single: true },
  { id: "calculator", name: "Calculator", icon: "calculator", description: "A pocket calculator", single: true },
  { id: "settings", name: "Settings", icon: "settings-2", description: "Make the desktop yours", single: true },
];
const projects = [
  { title: "DailyMed", category: "Hardware", status: "Featured experiment", description: "A smart medicine reminder kit exploring ESP32 control, schedules and accessible hardware interactions.", tech: ["ESP32", "Servo", "IoT"] },
  { title: "CartFetch", category: "Web", status: "In progress", description: "A focused shopping workflow experiment with a clean interface and practical utility.", tech: ["HTML", "CSS", "JavaScript"] },
  { title: "CodeQuill", category: "Software", status: "In progress", description: "A place for small programming experiments, notes and reusable ideas.", tech: ["Python", "JavaScript"] },
  { title: "Utility Hub", category: "Web", status: "Prototype", description: "A collection of tiny tools designed to remove friction from everyday tasks.", tech: ["Web APIs", "CSS"] },
  { title: "AI Study Companion", category: "AI", status: "Exploration", description: "An exploration of AI-assisted learning workflows and thoughtful human-computer interaction.", tech: ["AI", "Web"] },
  { title: "ESP32 experiments", category: "Embedded", status: "Ongoing", description: "Sensors, displays, BLE and microcontroller experiments documented as I learn.", tech: ["C", "ESP32", "Electronics"] },
  { title: "Website experiments", category: "Web", status: "Ongoing", description: "Small websites and interfaces made to practice visual systems and frontend craft.", tech: ["HTML", "CSS", "JavaScript"] },
];
const profile = {
  name: "Leishem", role: "Independent junior developer & technology enthusiast",
  bio: "I like turning curious ideas into useful things — from web interfaces to tiny systems with wires, sensors and a little patience.",
  interests: ["Web development", "Software development", "Embedded systems", "Electronics", "IoT", "Automation", "AI-assisted development"],
  stack: ["Python", "C", "HTML", "CSS", "JavaScript", "ESP32", "Microcontrollers"],
};
const defaultState = { theme: "dark", accent: "#63a8ff", wallpaper: "aurora", clock24: true, animations: true, sound: false, notes: "", lastClosed: null };
let state = loadState();
let zIndex = 20;
let windows = new Map();
let windowCounter = 0;
let terminalHistory = [];
let historyPosition = 0;

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const next = { ...defaultState, ...(stored && typeof stored === "object" ? stored : {}) };
    if (!["dark", "light"].includes(next.theme)) next.theme = defaultState.theme;
    if (typeof next.accent !== "string" || !/^#[0-9a-f]{6}$/i.test(next.accent)) next.accent = defaultState.accent;
    ["clock24", "animations", "sound"].forEach((key) => { if (typeof next[key] !== "boolean") next[key] = defaultState[key]; });
    if (typeof next.notes !== "string") next.notes = defaultState.notes;
    return next;
  } catch { return { ...defaultState }; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function refreshIcons() { window.lucide?.createIcons(); }
function appById(id) { return apps.find((app) => app.id === id); }
function todayString() { return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()); }
function showToast(message) {
  const toast = document.createElement("div"); toast.className = "toast"; toast.textContent = message;
  $("#toasts").append(toast); setTimeout(() => toast.remove(), 3200);
}
function setTheme() {
  document.documentElement.style.setProperty("--accent", state.accent);
  if (state.theme === "light") {
    document.documentElement.style.setProperty("--bg", "#eef2fa"); document.documentElement.style.setProperty("--text", "#152039");
    document.documentElement.style.setProperty("--surface", "rgba(255,255,255,.92)"); document.documentElement.style.setProperty("--surface-strong", "#fff");
    document.documentElement.style.setProperty("--surface-soft", "rgba(30,52,92,.09)"); document.documentElement.style.setProperty("--muted", "#66718a");
    document.documentElement.style.setProperty("--line", "rgba(30,52,92,.14)");
  } else {
    document.documentElement.style.setProperty("--bg", "#080b14"); document.documentElement.style.setProperty("--text", "#f0f3ff");
    document.documentElement.style.setProperty("--surface", "rgba(17,22,38,.92)"); document.documentElement.style.setProperty("--surface-strong", "#151b2d");
    document.documentElement.style.setProperty("--surface-soft", "rgba(28,36,59,.76)"); document.documentElement.style.setProperty("--muted", "#8d98b5");
    document.documentElement.style.setProperty("--line", "rgba(166,183,226,.15)");
  }
  document.documentElement.style.setProperty("--wallpaper", state.wallpaper);
}
function renderDesktopIcons() {
  const ids = ["about", "projects", "terminal", "studio", "hardware", "github", "files", "settings"];
  $("#desktop-icons").innerHTML = ids.map((id) => {
    const app = appById(id); return `<button class="desktop-icon" data-launch="${id}"><span class="icon-wrap">${icon(app.icon)}</span><small>${app.name}</small></button>`;
  }).join(""); refreshIcons();
}
function renderDock() {
  const pinned = ["about", "projects", "terminal", "studio", "hardware", "github", "settings"];
  $("#dock").innerHTML = pinned.map((id) => {
    const app = appById(id); const running = [...windows.values()].some((win) => win.appId === id);
    return `<button class="dock-item ${running ? "running" : ""}" data-launch="${id}" title="${app.name}">${icon(app.icon)}</button>`;
  }).join("") + `<span class="dock-divider"></span><button class="dock-item" data-launch="calculator" title="Calculator">${icon("calculator")}</button>`;
  refreshIcons();
}
function updateDockState() {
  $$("#dock .dock-item[data-launch]").forEach((item) => {
    const running = [...windows.values()].some((win) => win.appId === item.dataset.launch);
    item.classList.toggle("running", running);
  });
}
function renderLauncher(filter = "") {
  const visible = apps.filter((app) => `${app.name} ${app.description}`.toLowerCase().includes(filter.toLowerCase()));
  $("#launcher").innerHTML = `<div class="launcher-search">${icon("search")}<input id="launcher-search" placeholder="Search applications..." value="${escapeHtml(filter)}" /></div><div class="launcher-list">${visible.map((app) => `<button class="app-entry" data-launch="${app.id}"><span class="entry-icon">${icon(app.icon)}</span><span><b>${app.name}</b><small>${app.description}</small></span></button>`).join("") || `<div class="empty">No applications found.</div>`}</div>`;
  refreshIcons();
}
function openPopover(id) {
  ["launcher", "quick-panel", "notification-panel", "calendar-panel"].forEach((item) => { if (item !== id) $(`#${item}`).classList.add("hidden"); });
  $(`#${id}`).classList.toggle("hidden");
}
function renderQuickPanel() {
  $("#quick-panel").innerHTML = `<h3>Quick settings</h3><div class="quick-grid">
    <button class="quick-tile ${state.theme === "dark" ? "active" : ""}" data-setting="theme">${icon("moon")}Dark theme</button>
    <button class="quick-tile ${state.theme === "light" ? "active" : ""}" data-setting="theme">${icon("sun")}Light theme</button>
    <button class="quick-tile ${state.animations ? "active" : ""}" data-setting="animations">${icon("sparkles")}Animations</button>
    <button class="quick-tile ${state.clock24 ? "active" : ""}" data-setting="clock">${icon("clock-3")}24-hour clock</button>
  </div><button class="link-button" data-launch="settings" style="margin-top:14px">Open all settings →</button>`;
  refreshIcons();
}
function renderNotifications() {
  $("#notification-panel").innerHTML = `<h3>Notification center</h3><div class="notification">${icon("sparkles")}<p><b>Welcome to LeishemOS</b><small>Explore the desktop and open an app to begin.</small></p></div><div class="notification">${icon("github")}<p><b>Guest session</b><small>No account or personal data is required.</small></p></div>`;
  refreshIcons();
}
function renderCalendar() {
  const date = new Date(), month = date.toLocaleString(undefined, { month: "long", year: "numeric" });
  const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay(), days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  $("#calendar-panel").innerHTML = `<div class="calendar-head"><b>${month}</b>${icon("calendar-days")}</div><div class="calendar-grid">${["S","M","T","W","T","F","S"].map((x) => `<span>${x}</span>`).join("")}${Array(first).fill("<span></span>").join("")}${Array.from({ length: days }, (_, i) => `<span class="${i + 1 === date.getDate() ? "today" : ""}">${i + 1}</span>`).join("")}</div>`;
  refreshIcons();
}
function createWindow(appId) {
  const app = appById(appId);
  if (app.single) { const existing = [...windows.values()].find((win) => win.appId === appId); if (existing) { focusWindow(existing.id); existing.element.classList.remove("minimized"); return; } }
  const id = `${appId}-${++windowCounter}`, win = { id, appId, element: null };
  const element = document.createElement("article"); element.className = "window"; element.dataset.windowId = id; element.style.zIndex = ++zIndex;
  element.style.left = `${Math.max(20, 120 + (windows.size % 4) * 28)}px`; element.style.top = `${Math.max(25, 70 + (windows.size % 4) * 24)}px`;
  element.innerHTML = `<header class="window-header"><div class="window-title">${icon(app.icon)}<span>${app.name}</span></div><div class="window-controls"><button data-window-action="minimize" aria-label="Minimize">${icon("minus")}</button><button data-window-action="maximize" aria-label="Maximize">${icon("square")}</button><button class="close" data-window-action="close" aria-label="Close">${icon("x")}</button></div></header><div class="window-body">${appContent(appId)}</div><div class="resize-handle"></div>`;
  win.element = element; windows.set(id, win); $("#windows").append(element); bindWindow(win); focusWindow(id); renderDock(); refreshIcons();
  if (appId === "github") loadGithub(element);
  if (appId === "terminal") setTimeout(() => $(".terminal-input", element)?.focus(), 0);
}
function appContent(id) {
  if (id === "about") return `<div class="app-content"><div class="profile-hero"><div class="avatar">L</div><div><p class="app-kicker">About the creator</p><h2>${profile.name}</h2><p class="muted" style="margin:4px 0 0">${profile.role}</p></div></div><p class="muted">${profile.bio}</p><h3>What I am curious about</h3><div class="tag-list">${profile.interests.map((x) => `<span class="tag">${x}</span>`).join("")}</div><div class="info-grid"><div class="info-card"><strong>Currently learning</strong><span>Building practical projects, improving frontend craft and exploring embedded systems.</span></div><div class="info-card"><strong>Find me online</strong><span><a class="link-button" href="https://github.com/S-Leishem" target="_blank" rel="noreferrer">github.com/S-Leishem</a><br /><a class="link-button" href="https://leishem.me" target="_blank" rel="noreferrer">leishem.me</a></span></div></div></div>`;
  if (id === "projects") return `<div class="app-content"><p class="app-kicker">Portfolio / projects</p><h2>Things I am building.</h2><p class="muted">A growing collection of experiments, tools and useful ideas.</p><div class="app-toolbar"><input class="input project-search" placeholder="Search projects..." /><select class="input project-filter"><option>All categories</option><option>Web</option><option>Hardware</option><option>Software</option><option>Embedded</option><option>AI</option></select></div><div class="project-grid">${projectCards(projects)}</div></div>`;
  if (id === "developer") return `<div class="app-content"><p class="app-kicker">Developer center</p><h2>Tools for thinking.</h2><p class="muted">Technologies I use to turn ideas into experiments. No percentages — just a direction of travel.</p><h3>Areas of interest</h3><div class="project-grid">${[["globe-2","Web development","Interfaces, responsive layouts and small web tools."],["braces","Software development","Learning by making practical programs and utilities."],["microchip","Embedded systems","Microcontrollers, sensors and the physical world."],["bot","AI-assisted development","Using AI thoughtfully to learn and move faster."],["wrench","Automation scripting","Removing repetitive steps with useful scripts."],["shield-check","Cybersecurity","A future learning and career goal."]].map(([i,t,d]) => `<div class="info-card">${icon(i)}<strong>${t}</strong><span>${d}</span></div>`).join("")}</div><h3>Current toolkit</h3><div class="tag-list">${profile.stack.map((x) => `<span class="tag">${x}</span>`).join("")}</div></div>`;
  if (id === "terminal") return `<div class="terminal"><div class="terminal-output"><span class="accent">LeishemOS terminal</span> · safe guest shell<br />Type <span class="accent">help</span> to see available commands.<br /><br /></div><form class="terminal-input-row"><span>guest@leishem:~$</span><input class="terminal-input" autocomplete="off" spellcheck="false" aria-label="Terminal command" /></form></div>`;
  if (id === "studio") return `<div class="editor-layout"><div class="editors"><div class="editor-block"><label>index.html</label><textarea class="code-editor" data-code="html"><main><h1>Hello, LeishemOS</h1><p>Edit the code and run it.</p><button>Try me</button></main></textarea></div><div class="editor-block"><label>style.css</label><textarea class="code-editor" data-code="css">body { font-family: system-ui; padding: 2rem; color: #17213a; } h1 { color: #467bd6; }</textarea></div><div class="editor-block"><label>script.js</label><textarea class="code-editor" data-code="js">document.querySelector('button').onclick = () => alert('Hello from the sandbox!');</textarea></div></div><div class="preview-wrap"><div class="preview-label">LIVE PREVIEW <button class="link-button" id="run-preview">Run ↗</button><button class="link-button" id="reset-preview" style="float:right">Reset</button></div><iframe class="preview-frame" sandbox="allow-scripts"></iframe></div></div>`;
  if (id === "hardware") return `<div class="app-content"><div class="lab-banner"><p class="app-kicker">Hardware lab / featured</p><h2>DailyMed</h2><p class="muted">A smart medicine reminder kit — a hardware-first project exploring gentle, useful automation.</p><span class="status">● Documentation in progress</span></div><h3>Architecture notes</h3><div class="component-list">${[["cpu","ESP32 DevKit V1","Main controller and connectivity"],["rotate-cw","Servo motors","Physical reminder mechanism"],["radio","BLE communication","Local device control experiments"],["clock-3","RTC module","Reliable schedule keeping"],["activity","Sensors","Input and environment experiments"],["monitor","Display experiments","Making state visible"]].map(([i,t,d]) => `<div class="component">${icon(i)}<strong>${t}</strong>${d}</div>`).join("")}</div><h3>Other lab notes</h3><p class="muted">This space is for circuit diagrams, component documentation, photographs and technical notes as the projects grow. Hardware images will be added when the builds are ready to share.</p></div>`;
  if (id === "github") return `<div class="app-content"><p class="app-kicker">Live public data</p><h2>GitHub repositories.</h2><p class="muted">Fetched from the public GitHub API. No token is stored in this app.</p><div id="github-results"><div class="empty">Loading repositories...</div></div></div>`;
  if (id === "files") return `<div class="app-content"><p class="app-kicker">Virtual filesystem</p><h2>Home / guest</h2><div class="app-toolbar"><input class="input file-search" placeholder="Search files..." /><span class="muted" style="font-size:11px">Read-only portfolio files</span></div><div class="file-list">${[["folder","Projects","7 items"],["cpu","Hardware","6 notes"],["file-text","Documents","README.md"],["image","Images","Placeholders"],["download","Downloads","Empty"]].map(([i,n,s]) => `<button class="file-row"><span>${icon(i)}</span><b>${n}</b><small>${s}</small></button>`).join("")}</div></div>`;
  if (id === "notes") return `<div class="app-content"><p class="app-kicker">Local utility</p><h2>Scratchpad.</h2><p class="muted">Saved only in this browser.</p><textarea class="notes-area" placeholder="Capture an idea...">${escapeHtml(state.notes)}</textarea><div style="text-align:right;margin-top:10px"><span class="muted" style="font-size:10px" id="note-status">Saved locally</span></div></div>`;
  if (id === "calculator") return `<div class="app-content"><div class="calc"><input class="calc-display" value="0" readonly /><div class="calc-grid">${["C","⌫","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",".","="].map((x) => `<button data-calc="${x}">${x}</button>`).join("")}</div></div></div>`;
  if (id === "settings") return `<div class="app-content"><p class="app-kicker">System preferences</p><h2>Make it yours.</h2><div class="settings-row"><div><b>Theme</b><small>Switch between dark and light surfaces.</small></div><select class="input" id="theme-setting"><option value="dark" ${state.theme === "dark" ? "selected" : ""}>Dark</option><option value="light" ${state.theme === "light" ? "selected" : ""}>Light</option></select></div><div class="settings-row"><div><b>Accent color</b><small>Choose the system highlight.</small></div><input type="color" id="accent-setting" value="${state.accent}" /></div><div class="settings-row"><div><b>Animations</b><small>Use motion throughout the interface.</small></div><button class="switch ${state.animations ? "on" : ""}" id="animation-setting" aria-label="Toggle animations"></button></div><div class="settings-row"><div><b>24-hour clock</b><small>Use a 24-hour time format.</small></div><button class="switch ${state.clock24 ? "on" : ""}" id="clock-setting" aria-label="Toggle clock"></button></div><div class="settings-row"><div><b>Reset preferences</b><small>Restore the original LeishemOS experience.</small></div><button class="link-button" id="reset-settings">Reset</button></div></div>`;
  return `<div class="app-content empty">This application is not available.</div>`;
}
function projectCards(items) { return items.map((project) => `<article class="project-card"><span class="status">${project.status}</span><h3>${project.title}</h3><p>${project.description}</p><div class="tag-list">${project.tech.map((x) => `<span class="tag">${x}</span>`).join("")}</div></article>`).join(""); }
function escapeHtml(value) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
function focusWindow(id) {
  const win = windows.get(id); if (!win) return; zIndex += 1; win.element.style.zIndex = zIndex;
  $$(".window").forEach((el) => el.classList.remove("focused")); win.element.classList.add("focused");
  $("#active-app-label").textContent = appById(win.appId).name; updateDockState();
}
function closeWindow(id) {
  const win = windows.get(id); if (!win) return;
  state.lastClosed = win.appId; saveState();
  windows.delete(id);
  win.element.remove();
  updateDockState();
  $("#active-app-label").textContent = "Desktop";
}
function bindWindow(win) {
  const { element } = win;
  element.addEventListener("pointerdown", () => focusWindow(win.id));
  element.querySelector(".window-controls").addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.windowAction; if (!action) return;
    if (action === "close") closeWindow(win.id);
    if (action === "minimize") { element.classList.add("minimized"); updateDockState(); }
    if (action === "maximize") element.classList.toggle("maximized");
  });
  const header = $(".window-header", element); header.addEventListener("dblclick", () => element.classList.toggle("maximized"));
  header.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button") || element.classList.contains("maximized")) return;
    const startX = event.clientX, startY = event.clientY, left = element.offsetLeft, top = element.offsetTop;
    const move = (moveEvent) => { element.style.left = `${Math.max(8, Math.min(window.innerWidth - 80, left + moveEvent.clientX - startX))}px`; element.style.top = `${Math.max(45, Math.min(window.innerHeight - 80, top + moveEvent.clientY - startY))}px`; };
    const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop);
  });
  bindAppEvents(win);
}
function bindAppEvents(win) {
  const { element } = win;
  if (win.appId === "projects") {
    const filter = () => { const search = $(".project-search", element).value.toLowerCase(), category = $(".project-filter", element).value; $(".project-grid", element).innerHTML = projectCards(projects.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(search) && (category === "All categories" || p.category === category))); };
    $(".project-search", element).addEventListener("input", filter); $(".project-filter", element).addEventListener("change", filter);
  }
  if (win.appId === "notes") $(".notes-area", element).addEventListener("input", (event) => { state.notes = event.target.value; saveState(); $("#note-status", element).textContent = "Saved locally · " + new Date().toLocaleTimeString(); });
  if (win.appId === "studio") {
    const run = () => { const html = $('[data-code="html"]', element).value, css = $('[data-code="css"]', element).value, js = $('[data-code="js"]', element).value; $(".preview-frame", element).srcdoc = `<style>${css}</style>${html}<script>${js.replace(/<\/script>/gi, "<\\/script>")}<\/script>`; };
    $("#run-preview", element).addEventListener("click", run); $("#reset-preview", element).addEventListener("click", () => { closeWindow(win.id); createWindow("studio"); }); run();
  }
  if (win.appId === "terminal") $(".terminal-input", element).addEventListener("keydown", (event) => handleTerminal(event, element));
  if (win.appId === "calculator") bindCalculator(element);
  if (win.appId === "settings") bindSettings(element);
}
function bindCalculator(element) {
  let value = ""; const display = $(".calc-display", element);
  $$(".calc-grid button", element).forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.calc;
    if (key === "C") value = ""; else if (key === "⌫") value = value.slice(0, -1); else if (key === "=") { try { value = String(Function(`"use strict"; return (${value.replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-")})`)()); } catch { value = "Error"; } } else value += key;
    display.value = value || "0";
  }));
}
function bindSettings(element) {
  $("#theme-setting", element).addEventListener("change", (event) => { state.theme = event.target.value; saveState(); setTheme(); renderQuickPanel(); });
  $("#accent-setting", element).addEventListener("input", (event) => { state.accent = event.target.value; saveState(); setTheme(); });
  $("#animation-setting", element).addEventListener("click", () => { state.animations = !state.animations; saveState(); bindSettingsState(element); });
  $("#clock-setting", element).addEventListener("click", () => { state.clock24 = !state.clock24; saveState(); bindSettingsState(element); updateClock(); });
  $("#reset-settings", element).addEventListener("click", () => { state = { ...defaultState }; saveState(); setTheme(); closeWindow(element.closest(".window").dataset.windowId); showToast("Preferences reset"); });
}
function bindSettingsState(element) { $("#animation-setting", element).classList.toggle("on", state.animations); $("#clock-setting", element).classList.toggle("on", state.clock24); }
function handleTerminal(event, element) {
  if (event.key === "ArrowUp") { event.preventDefault(); historyPosition = Math.max(0, historyPosition - 1); event.target.value = terminalHistory[historyPosition] || ""; return; }
  if (event.key !== "Enter") return; event.preventDefault();
  const input = event.target, commandLine = input.value.trim(), output = $(".terminal-output", element); if (!commandLine) return;
  terminalHistory.push(commandLine); historyPosition = terminalHistory.length; output.insertAdjacentHTML("beforeend", `<span class="accent">guest@leishem:~$</span> ${escapeHtml(commandLine)}\n${terminalCommand(commandLine)}\n`); input.value = ""; output.scrollTop = output.scrollHeight;
}
function terminalCommand(commandLine) {
  const [command, ...args] = commandLine.split(" "), argument = args.join(" ");
  if (command === "clear") { $(".terminal-output").innerHTML = ""; return ""; }
  if (command === "help") return "Available: help, clear, whoami, about, projects, skills, github, contact, neofetch, date, uptime, history, echo, ls, pwd";
  if (command === "whoami") return "guest — exploring LeishemOS";
  if (command === "about") return profile.bio;
  if (command === "projects") return projects.map((project) => `• ${project.title} — ${project.status}`).join("\n");
  if (command === "skills") return profile.stack.join(" · ");
  if (command === "github") return "https://github.com/S-Leishem";
  if (command === "contact") return "GitHub: S-Leishem\nWeb: leishem.me";
  if (command === "neofetch") return "  _       LeishemOS\n | |      guest session\n | |__    web desktop 1.0.0\n |____|   kernel: browser";
  if (command === "date") return new Date().toString();
  if (command === "uptime") return "up since this tab was opened";
  if (command === "history") return terminalHistory.map((x, i) => `${i + 1}  ${x}`).join("\n");
  if (command === "echo") return argument;
  if (command === "ls") return "Projects  Hardware  Documents  Images  Downloads";
  if (command === "pwd") return "/home/guest";
  return `<span class="error">command not found: ${escapeHtml(command)}. Type help for available commands.</span>`;
}
async function loadGithub(element) {
  try {
    const response = await fetch("https://api.github.com/users/S-Leishem/repos?sort=updated&per_page=12");
    if (!response.ok) throw new Error("GitHub API unavailable");
    const repos = await response.json();
    $("#github-results", element).innerHTML = repos.length ? `<div class="project-grid">${repos.map((repo) => `<article class="project-card github-card"><div><span class="status">${repo.language || "Repository"}</span><h3>${escapeHtml(repo.name)}</h3><p>${escapeHtml(repo.description || "No description provided.")}</p><span class="muted">★ ${repo.stargazers_count} · fork ${repo.forks_count}</span></div><a class="link-button" href="${repo.html_url}" target="_blank" rel="noreferrer" aria-label="Open repository">${icon("arrow-up-right")}</a></article>`).join("")}</div>` : `<div class="empty">No public repositories found.</div>`;
  } catch (error) { $("#github-results", element).innerHTML = `<div class="empty">Could not load GitHub right now.<br /><button class="link-button" onclick="location.reload()">Try again</button></div>`; }
  refreshIcons();
}
function updateClock() {
  const now = new Date(); $("#clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: !state.clock24 }); $("#date").textContent = now.toLocaleDateString([], { month: "short", day: "numeric" });
}
function boot() {
  setTheme(); $("#welcome-date").textContent = todayString(); renderDesktopIcons(); renderDock(); renderLauncher(); renderQuickPanel(); renderNotifications(); renderCalendar(); updateClock(); setInterval(updateClock, 1000);
  const bootScreen = $("#boot-screen"), status = $("#boot-status"), reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ready = false; const finish = () => { if (ready) return; ready = true; bootScreen.classList.add("fade"); setTimeout(() => { bootScreen.remove(); $("#welcome").classList.remove("hidden"); }, reduceMotion ? 0 : 550); };
  $("#skip-boot").addEventListener("click", finish); setTimeout(() => { status.textContent = "Workspace ready."; setTimeout(finish, reduceMotion ? 0 : 500); }, reduceMotion ? 100 : 2100);
  $("#enter-desktop").addEventListener("click", () => { $("#welcome").classList.add("hidden"); $("#desktop").classList.remove("hidden"); showToast("Welcome, guest. Your session is local."); });
  document.addEventListener("click", (event) => {
    const launch = event.target.closest("[data-launch]"); if (launch) { createWindow(launch.dataset.launch); $("#launcher").classList.add("hidden"); }
    if (event.target.closest(".launcher-trigger")) { renderLauncher(); openPopover("launcher"); setTimeout(() => $("#launcher-search")?.focus(), 0); }
    if (event.target.closest("#quick-toggle")) { renderQuickPanel(); openPopover("quick-panel"); }
    if (event.target.closest("#notifications-toggle")) { renderNotifications(); openPopover("notification-panel"); }
    if (event.target.closest("#clock-toggle")) { renderCalendar(); openPopover("calendar-panel"); }
    const setting = event.target.closest("[data-setting]"); if (setting) { if (setting.dataset.setting === "theme") state.theme = state.theme === "dark" ? "light" : "dark"; if (setting.dataset.setting === "animations") state.animations = !state.animations; if (setting.dataset.setting === "clock") state.clock24 = !state.clock24; saveState(); setTheme(); renderQuickPanel(); updateClock(); }
    if (!event.target.closest(".popover") && !event.target.closest(".panel-button") && !event.target.closest(".clock-button")) ["launcher","quick-panel","notification-panel","calendar-panel"].forEach((id) => $(`#${id}`).classList.add("hidden"));
  });
  $("#desktop-surface").addEventListener("contextmenu", (event) => { event.preventDefault(); const menu = $("#context-menu"); menu.innerHTML = `<button data-context="refresh">${icon("refresh-cw")} Refresh desktop</button><button data-context="settings">${icon("settings-2")} Desktop settings</button><button data-context="terminal">${icon("terminal-square")} Open terminal</button>`; menu.style.left = `${Math.min(event.clientX, innerWidth - 180)}px`; menu.style.top = `${Math.min(event.clientY, innerHeight - 130)}px`; menu.classList.remove("hidden"); refreshIcons(); });
  document.addEventListener("click", (event) => { const action = event.target.closest("[data-context]")?.dataset.context; if (action === "settings") createWindow("settings"); if (action === "terminal") createWindow("terminal"); if (action === "refresh") showToast("Desktop refreshed"); $("#context-menu").classList.add("hidden"); });
  document.addEventListener("keydown", (event) => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); renderLauncher(); openPopover("launcher"); setTimeout(() => $("#launcher-search")?.focus(), 0); }
    if (event.key === "Escape") { ["launcher","quick-panel","notification-panel","calendar-panel","context-menu"].forEach((id) => $(`#${id}`).classList.add("hidden")); }
    if (event.altKey && event.key === "Tab" && !typing) { event.preventDefault(); const all = [...windows.values()]; if (all.length) focusWindow(all[(all.findIndex((w) => w.element.classList.contains("focused")) + 1) % all.length].id); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "w" && !typing) { const active = [...windows.values()].find((w) => w.element.classList.contains("focused")); if (active) closeWindow(active.id); }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "t" && !typing && state.lastClosed) { createWindow(state.lastClosed); state.lastClosed = null; saveState(); }
  });
  $("#launcher").addEventListener("input", (event) => {
    if (event.target.id === "launcher-search") {
      const value = event.target.value; renderLauncher(value);
      const input = $("#launcher-search"); input?.focus(); input?.setSelectionRange(value.length, value.length);
    }
  });
}
boot();
