import {
  CATEGORIES,
  DEFAULT_QUALITIES,
  EXTRA_PRESETS,
  MAX_EXTRAS,
  MAX_QUALITIES,
  QUALITY_UPDATES,
  levelsFor,
  normalizeExtra,
  normalizeLifestyle,
  normalizeQuality
} from "./lifestyle.js";

export const MODULE_ID = "downtime-tracker";
export const SOCKET = `module.${MODULE_ID}`;
export const BLOCK_DAYS = 5;
export const MONTH_DAYS = 30;
export const MAX_BLOCKS = 6;
export const NUYEN_MIN = 10000;
export const NUYEN_MAX = 100000;
export const REWARD_MAX = 99;
export const ENTRY_FIELDS = ["plan", "activity"];

export const DEFAULT_ACTIVITIES = [
  "Fertigkeit steigern",
  "Attribut steigern",
  "Talent erlernen",
  "Handicap verlieren",
  "Spaß haben"
];

export function registerSettings(onChange) {
  game.settings.register(MODULE_ID, "data", {
    scope: "world",
    config: false,
    type: Object,
    default: emptyData(),
    onChange
  });
  game.settings.register(MODULE_ID, "startOffset", {
    name: "DOWNTIME.Settings.StartOffset.Name",
    hint: "DOWNTIME.Settings.StartOffset.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
    onChange
  });
}

export function emptyData() {
  return {
    version: 1,
    runs: [],
    paidMonths: [],
    announcedMonths: [],
    activities: [...DEFAULT_ACTIVITIES],
    lifestyles: [],
    qualities: DEFAULT_QUALITIES.map(q => ({ ...q }))
  };
}

export function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function normalizeEntry(entry) {
  return {
    actorId: entry.actorId,
    name: entry.name ?? "",
    img: entry.img ?? "",
    activity: String(entry.activity ?? ""),
    plan: String(entry.plan ?? "")
  };
}

export function clampNuyen(value, fallback = 0) {
  if (value === "" || value == null) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.max(n, NUYEN_MIN), NUYEN_MAX);
}

export function normalizeRun(run) {
  run.name = String(run.name ?? "");
  run.description = String(run.description ?? "");
  run.runDays = clampInt(run.runDays, 0, 365, 1);
  run.nuyen = clampNuyen(run.nuyen);
  run.karma = clampInt(run.karma, 0, REWARD_MAX, 0);
  run.reputation = clampInt(run.reputation, 0, REWARD_MAX, 0);
  run.blocks = clampInt(run.blocks, 0, MAX_BLOCKS, 0);
  run.assignments = Array.from({ length: MAX_BLOCKS }, (_, i) =>
    Array.isArray(run.assignments?.[i]) ? run.assignments[i].map(normalizeEntry) : []
  );
  const participants = Array.isArray(run.participants) ? run.participants : [];
  for (const list of run.assignments) {
    for (const entry of list) participants.push(entry.actorId);
  }
  run.participants = [...new Set(participants.filter(Boolean))];
  return run;
}

export function createRun(name) {
  return normalizeRun({ id: foundry.utils.randomID(), name, runDays: 1, blocks: 0 });
}

export function sanitizeData(raw) {
  const data = { ...emptyData(), ...(raw ?? {}) };
  data.runs = Array.isArray(data.runs)
    ? data.runs.filter(r => r && typeof r === "object").map(r => normalizeRun({ ...r, id: r.id || foundry.utils.randomID() }))
    : [];
  const months = list => (Array.isArray(list) ? list.map(Number).filter(n => Number.isInteger(n) && n > 0) : []);
  data.paidMonths = months(data.paidMonths);
  data.announcedMonths = months(data.announcedMonths);
  data.activities = Array.isArray(data.activities)
    ? [...new Set(data.activities.map(a => String(a ?? "").trim()).filter(Boolean))]
    : [...DEFAULT_ACTIVITIES];
  data.qualities = Array.isArray(data.qualities)
    ? [...new Map(data.qualities.filter(q => q && typeof q === "object").map(normalizeQuality).filter(q => q.name).map(q => [q.id, q])).values()]
    : DEFAULT_QUALITIES.map(q => ({ ...q }));
  for (const quality of data.qualities) {
    const update = QUALITY_UPDATES[quality.id];
    if (update && quality.effect === update.old) quality.effect = update.effect;
  }
  data.lifestyles = Array.isArray(data.lifestyles)
    ? data.lifestyles.filter(l => l && typeof l === "object" && l.actorId).map(normalizeLifestyle)
    : [];
  return data;
}

export function getData() {
  return sanitizeData(foundry.utils.deepClone(game.settings.get(MODULE_ID, "data") ?? {}));
}

export function getOffset() {
  return clampInt(game.settings.get(MODULE_ID, "startOffset"), 0, MONTH_DAYS - 1, 0);
}

export function runLength(run) {
  return run.runDays + run.blocks * BLOCK_DAYS;
}

export function totalDays(data) {
  return getOffset() + data.runs.reduce((sum, run) => sum + runLength(run), 0);
}

export function dayInMonth(day) {
  return ((day - 1) % MONTH_DAYS) + 1;
}

export function monthOf(day) {
  return Math.floor((day - 1) / MONTH_DAYS) + 1;
}

export function computeTimeline(data) {
  const offset = getOffset();
  const total = totalDays(data);
  const months = Array.from({ length: Math.floor(total / MONTH_DAYS) + 1 }, (_, i) => ({
    number: i + 1,
    firstDay: i * MONTH_DAYS + 1,
    lastDay: (i + 1) * MONTH_DAYS,
    segments: []
  }));

  const place = (start, length, segment) => {
    let from = start;
    const end = start + length;
    while (from < end) {
      const month = months[Math.floor(from / MONTH_DAYS)];
      if (!month) break;
      const until = Math.min(end, month.lastDay);
      month.segments.push({
        ...segment,
        col: (from % MONTH_DAYS) + 1,
        span: until - from,
        isStart: from === start,
        continues: until < end
      });
      from = until;
    }
  };

  if (offset > 0) place(0, offset, { type: "before" });
  let pos = offset;
  for (const run of data.runs) {
    if (run.runDays > 0) place(pos, run.runDays, { type: "run", run });
    pos += run.runDays;
    for (let b = 0; b < run.blocks; b++) {
      place(pos, BLOCK_DAYS, { type: "block", run, block: b });
      pos += BLOCK_DAYS;
    }
  }

  const paid = new Set(data.paidMonths);
  for (const month of months) {
    month.complete = total >= month.lastDay;
    month.status = !month.complete ? "open" : paid.has(month.number) ? "paid" : "due";
    month.daysLeft = month.lastDay - total;
    month.runs = [...new Set(month.segments.filter(s => s.run).map(s => s.run))];
  }
  return { offset, total, months };
}

export function monthStatusLabel(month) {
  if (month.status === "open") {
    const key = month.daysLeft === 1 ? "DOWNTIME.Month.LeftOne" : "DOWNTIME.Month.Left";
    return game.i18n.format(key, { days: month.daysLeft });
  }
  return game.i18n.localize(month.status === "paid" ? "DOWNTIME.Month.Paid" : "DOWNTIME.Month.Due");
}

let saveQueue = Promise.resolve();

function enqueue(task) {
  saveQueue = saveQueue.then(task).catch(err => console.error(`${MODULE_ID} |`, err));
  return saveQueue;
}

export function saveData(mutator) {
  return enqueue(() => applySave(mutator));
}

export function replaceData(data) {
  return enqueue(() => game.settings.set(MODULE_ID, "data", sanitizeData(data)));
}

async function applySave(mutator) {
  if (!game.user.isGM) return;
  const data = getData();
  const before = totalDays(data);
  if (mutator(data) === false) return;
  const after = totalDays(data);

  const newlyDue = [];
  for (let m = Math.floor(before / MONTH_DAYS) + 1; m <= Math.floor(after / MONTH_DAYS); m++) {
    if (!data.paidMonths.includes(m) && !data.announcedMonths.includes(m)) newlyDue.push(m);
  }
  data.announcedMonths.push(...newlyDue);

  await game.settings.set(MODULE_ID, "data", data);
  for (const number of newlyDue) {
    await ChatMessage.create({
      speaker: { alias: game.i18n.localize("DOWNTIME.Title") },
      content: `<h3>${game.i18n.localize("DOWNTIME.Rent.ChatTitle")}</h3><p>${game.i18n.format("DOWNTIME.Rent.ChatText", { number })}</p>`
    });
  }
}

export function setEntryField(runId, block, actorId, field, value) {
  if (!ENTRY_FIELDS.includes(field)) return;
  return saveData(data => {
    const entry = data.runs.find(r => r.id === runId)?.assignments[block]?.find(e => e.actorId === actorId);
    if (!entry) return false;
    const text = String(value ?? "").slice(0, 500);
    if (field === "activity" && text && !data.activities.includes(text)) return false;
    entry[field] = text;
  });
}

function canEditActor(user, actorId) {
  if (!user) return false;
  if (user.isGM) return true;
  return !!game.actors.get(actorId)?.testUserPermission(user, "OWNER");
}

export function lifestyleOp(userId, op) {
  const user = game.users.get(userId);
  return saveData(data => {
    if (op?.type === "create") {
      const actor = game.actors.get(op.actorId);
      if (!actor || !canEditActor(user, actor.id)) return false;
      data.lifestyles.push(normalizeLifestyle({
        actorId: actor.id,
        name: actor.name,
        img: actor.img,
        title: String(op.title ?? "")
      }));
      return;
    }

    const lifestyle = data.lifestyles.find(l => l.id === op?.lifestyleId);
    if (!lifestyle || !canEditActor(user, lifestyle.actorId)) return false;

    switch (op.type) {
      case "delete":
        data.lifestyles = data.lifestyles.filter(l => l !== lifestyle);
        return;
      case "addQuality": {
        const quality = data.qualities.find(q => q.id === op.qualityId);
        if (!quality || lifestyle.qualities.some(q => q.id === quality.id)) return false;
        if (lifestyle.qualities.length >= MAX_QUALITIES) return false;
        lifestyle.qualities.push({ ...quality });
        return;
      }
      case "removeQuality":
        lifestyle.qualities = lifestyle.qualities.filter(q => q.id !== op.qualityId);
        return;
      case "addExtra": {
        const preset = EXTRA_PRESETS[op.preset];
        if (!preset || lifestyle.extras.length >= MAX_EXTRAS) return false;
        lifestyle.extras.push(normalizeExtra(preset));
        return;
      }
      case "setExtra": {
        const extra = lifestyle.extras.find(e => e.id === op.extraId);
        if (!extra || !["name", "fixed", "percent"].includes(op.field)) return false;
        const updated = normalizeExtra({ ...extra, [op.field]: op.value });
        if (!updated.name) return false;
        Object.assign(extra, updated);
        return;
      }
      case "removeExtra":
        lifestyle.extras = lifestyle.extras.filter(e => e.id !== op.extraId);
        return;
      case "set": {
        const value = op.value;
        if (CATEGORIES.includes(op.field)) {
          if (!levelsFor(op.field).includes(value)) return false;
          lifestyle.categories[op.field] = value;
        } else if (op.field === "title") {
          lifestyle.title = String(value ?? "").trim().slice(0, 80);
        } else if (op.field === "notes") {
          lifestyle.notes = String(value ?? "").trim().slice(0, 2000);
        } else if (op.field === "roommates") {
          lifestyle.roommates = clampInt(value, 0, 20, lifestyle.roommates);
        } else {
          return false;
        }
        return;
      }
      default:
        return false;
    }
  });
}

export function handleSocket(message) {
  if (!game.users.activeGM?.isSelf) return;
  if (message?.action === "lifestyle") return lifestyleOp(message.userId, message.op);
  if (message?.action !== "setEntryField") return;
  const user = game.users.get(message.userId);
  const actor = game.actors.get(message.actorId);
  if (!user || !actor?.testUserPermission(user, "OWNER")) return;
  return setEntryField(message.runId, message.block, message.actorId, message.field, message.value);
}
