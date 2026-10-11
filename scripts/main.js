import { MODULE_ID, SOCKET, handleSocket, registerSettings } from "./data.js";
import { scheduleLifestylePage } from "./journal.js";
import { DowntimeTracker } from "./tracker.js";

function openFromControl(event, active) {
  if (active === false) return;
  if (event && !["click", "pointerup", "pointerdown", "mousedown"].includes(event.type)) return;
  if (!event) return;
  DowntimeTracker.open();
}

Hooks.once("init", () => {
  registerSettings(() => {
    const app = DowntimeTracker.instance;
    if (app?.rendered) app.render();
  });
  game.modules.get(MODULE_ID).api = { open: () => DowntimeTracker.open() };
});

Hooks.once("ready", () => {
  game.socket.on(SOCKET, async message => {
    await handleSocket(message);
    if (message?.action === "lifestyle" && game.users.activeGM?.isSelf) scheduleLifestylePage();
  });
});

Hooks.on("getSceneControlButtons", controls => {
  const tool = {
    name: MODULE_ID,
    title: "DOWNTIME.Title",
    icon: "fa-solid fa-hourglass-half",
    button: true,
    visible: true,
    order: 100,
    onChange: openFromControl
  };
  const tokens = Array.isArray(controls) ? controls.find(c => c.name === "token") : controls.tokens;
  if (!tokens?.tools) return;
  if (Array.isArray(tokens.tools)) tokens.tools.push({ ...tool, onClick: openFromControl });
  else tokens.tools[MODULE_ID] = tool;
});

Hooks.on("renderActorDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".dt-open-tracker")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("dt-open-tracker");
  button.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> ${game.i18n.localize("DOWNTIME.Title")}`;
  button.addEventListener("click", () => DowntimeTracker.open());
  const container = root.querySelector(".header-actions") ?? root.querySelector(".directory-header");
  container?.append(button);
});
