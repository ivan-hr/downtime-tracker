import {
  BLOCK_DAYS,
  MODULE_ID,
  MONTH_DAYS,
  computeTimeline,
  dayInMonth,
  getData,
  monthStatusLabel,
  runLength
} from "./data.js";
import { CATEGORIES, analyzeLifestyle } from "./lifestyle.js";

const DEFAULT_IMG = "icons/svg/mystery-man.svg";
const esc = value => foundry.utils.escapeHTML(String(value ?? ""));
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));

export const formatNuyen = value => `${Number(value).toLocaleString(game.i18n.lang)} ¥`;
export const formatLp = lp => (lp > 0 ? `+${lp}` : String(lp).replace("-", "−"));

export function formatRunReward(run) {
  const parts = [];
  if (run.nuyen) parts.push(formatNuyen(run.nuyen));
  if (run.karma) parts.push(t("DOWNTIME.Run.KarmaValue", { value: run.karma }));
  if (run.reputation) parts.push(t("DOWNTIME.Run.ReputationValue", { value: run.reputation }));
  return parts.join(" · ");
}

export function lifestyleFacts(analysis) {
  const lock = analysis.lock.mod
    ? t("DOWNTIME.Lifestyle.LockValue", { label: t(`DOWNTIME.Lifestyle.Lock.${analysis.lock.key}`), mod: analysis.lock.mod })
    : t(`DOWNTIME.Lifestyle.Lock.${analysis.lock.key}`);
  return {
    tier: t(`DOWNTIME.Lifestyle.Level.${analysis.tier}`),
    healing: t("DOWNTIME.Lifestyle.HealingValue", { mod: analysis.healing }),
    lock,
    guards: t(`DOWNTIME.Lifestyle.Guards.${analysis.guards}`)
  };
}

export function costBreakdown(analysis) {
  if (!analysis.roommatePercent && !analysis.extraPercent && !analysis.fixed) return "";
  const parts = [t("DOWNTIME.Lifestyle.BaseCost", { cost: formatNuyen(analysis.baseCost) })];
  if (analysis.roommatePercent) parts.push(t("DOWNTIME.Lifestyle.RoommateDiscount", { percent: analysis.roommatePercent }));
  if (analysis.extraPercent) parts.push(t("DOWNTIME.Lifestyle.Surcharge", { percent: analysis.extraPercent }));
  if (analysis.fixed) parts.push(t("DOWNTIME.Lifestyle.Fixed", { cost: formatNuyen(analysis.fixed) }));
  return parts.join(" · ");
}

function lifestyleActor(lifestyle) {
  const actor = game.actors.get(lifestyle.actorId);
  return { name: actor?.name ?? lifestyle.name ?? "?", img: actor?.img || lifestyle.img || DEFAULT_IMG };
}

function renderLifestyle(lifestyle, data) {
  const analysis = analyzeLifestyle(lifestyle, data.qualities);
  const facts = lifestyleFacts(analysis);
  const { name, img } = lifestyleActor(lifestyle);
  const categories = CATEGORIES.map(key => `
    <tr>
      <th>${esc(t(`DOWNTIME.Lifestyle.Category.${key}`))}</th>
      <td>${esc(t(`DOWNTIME.Lifestyle.Level.${lifestyle.categories[key]}`))}</td>
    </tr>`).join("");
  const qualities = analysis.qualities.length
    ? `<ul class="dt-j-qualities">${analysis.qualities.map(q => `
        <li><strong>${esc(q.name)}</strong> <span class="dt-j-lp ${q.lp < 0 ? "neg" : "pos"}">${esc(formatLp(q.lp))} LP</span>${q.effect ? `<br><span>${esc(q.effect)}</span>` : ""}</li>`).join("")}</ul>`
    : `<p class="dt-j-muted">${esc(t("DOWNTIME.Lifestyle.NoQualities"))}</p>`;
  const roommates = lifestyle.roommates
    ? `<p class="dt-j-muted">${esc(t("DOWNTIME.Lifestyle.RoommatesValue", { count: lifestyle.roommates, percent: analysis.roommatePercent }))}</p>`
    : "";
  const breakdown = costBreakdown(analysis);
  const extras = lifestyle.extras.length
    ? `<h4>${esc(t("DOWNTIME.Lifestyle.Extra.Title"))}</h4><ul class="dt-j-qualities">${lifestyle.extras.map(e => {
        const parts = [];
        if (e.fixed) parts.push(`+${formatNuyen(e.fixed)}`);
        if (e.percent) parts.push(`+${e.percent} %`);
        return `<li><strong>${esc(e.name)}</strong> <span>${esc(parts.join(", ") || "–")}</span></li>`;
      }).join("")}</ul>`
    : "";
  return `
    <section class="dt-j-run dt-j-lifestyle">
      <header>
        <h3><img src="${esc(img)}" alt="">${esc(name)}${lifestyle.title ? ` · ${esc(lifestyle.title)}` : ""}</h3>
        <span><strong>${esc(formatNuyen(analysis.cost))}</strong> ${esc(t("DOWNTIME.Lifestyle.PerMonth"))} · ${esc(t("DOWNTIME.Lifestyle.LpTotal", { lp: analysis.totalLp }))}</span>
      </header>
      <div class="dt-j-ls-grid">
        <table class="dt-j-table">${categories}</table>
        <div>
          <p><strong>${esc(t("DOWNTIME.Lifestyle.Tier"))}:</strong> ${esc(facts.tier)}</p>
          <p><strong>${esc(t("DOWNTIME.Lifestyle.Healing"))}:</strong> ${esc(facts.healing)}</p>
          <p><strong>${esc(t("DOWNTIME.Lifestyle.Security"))}:</strong> ${esc(facts.lock)}</p>
          <p><strong>${esc(t("DOWNTIME.Lifestyle.GuardsLabel"))}:</strong> ${esc(facts.guards)}</p>
          ${roommates}
          ${breakdown ? `<p class="dt-j-muted">${esc(breakdown)}</p>` : ""}
        </div>
      </div>
      <h4>${esc(t("DOWNTIME.Lifestyle.Qualities"))}</h4>
      ${qualities}
      ${extras}
      ${lifestyle.notes ? `<p class="dt-j-description">${esc(lifestyle.notes)}</p>` : ""}
    </section>`;
}

function renderLifestyles(data) {
  const total = data.lifestyles.reduce((sum, l) => sum + analyzeLifestyle(l, data.qualities).cost, 0);
  const cards = data.lifestyles.map(l => renderLifestyle(l, data)).join("");
  return `
    <div class="dt-journal">
      <div class="dt-j-stats">
        <div><span>${esc(t("DOWNTIME.Lifestyle.Count"))}</span><strong>${data.lifestyles.length}</strong></div>
        <div><span>${esc(t("DOWNTIME.Lifestyle.TotalCost"))}</span><strong>${esc(formatNuyen(total))}</strong></div>
      </div>
      ${cards || `<p class="dt-j-muted">${esc(t("DOWNTIME.Lifestyle.Empty"))}</p>`}
      <p class="dt-j-muted">${esc(t("DOWNTIME.Journal.Generated", { date: new Date().toLocaleString(game.i18n.lang) }))}</p>
    </div>`;
}

function actorInfo(entry) {
  const actor = game.actors.get(entry.actorId);
  return { name: actor?.name ?? entry.name ?? "?", img: actor?.img || entry.img || DEFAULT_IMG };
}

function badge(month) {
  return `<span class="dt-j-badge ${month.status}">${esc(monthStatusLabel(month))}</span>`;
}

function renderBar(month) {
  const segments = month.segments.map(s => {
    const pos = `c${s.col} s${s.span}`;
    if (s.type === "before") {
      return `<div class="dt-j-seg before ${pos}" title="${esc(t("DOWNTIME.Timeline.Before"))}"></div>`;
    }
    const label = s.type === "run" ? s.run.name : `B${s.block + 1}`;
    const title = s.type === "run"
      ? t("DOWNTIME.Timeline.RunTooltip", { name: s.run.name, days: s.run.runDays })
      : t("DOWNTIME.Timeline.BlockTooltip", { name: s.run.name, block: s.block + 1 });
    return `<div class="dt-j-seg ${s.type} ${pos}" title="${esc(title)}">${esc(label)}</div>`;
  });
  const ticks = Array.from({ length: MONTH_DAYS }, (_, i) => `<span>${(i + 1) % 5 === 0 ? i + 1 : ""}</span>`);
  return `<div class="dt-j-bar">${segments.join("")}</div><div class="dt-j-ticks">${ticks.join("")}</div>`;
}

function range(segment) {
  return `${segment.col}–${segment.col + segment.span - 1}`;
}

function renderBlock(run, segment) {
  const entries = run.assignments[segment.block];
  const first = segment.col;
  const rentDue = segment.continues || first + BLOCK_DAYS - 1 === MONTH_DAYS;
  const lastDay = dayInMonth(first + BLOCK_DAYS - 1);
  const dayLabel = segment.continues
    ? t("DOWNTIME.Journal.BlockDaysNext", { from: first, to: lastDay })
    : t("DOWNTIME.Journal.BlockDays", { from: first, to: first + BLOCK_DAYS - 1 });

  const rows = entries.length
    ? entries.map(entry => {
        const { name, img } = actorInfo(entry);
        const activity = entry.activity ? `<span class="dt-j-activity">${esc(entry.activity)}</span>` : "";
        const plan = entry.plan?.trim()
          ? `<span>${esc(entry.plan)}</span>`
          : activity ? "" : `<span><em class="dt-j-muted">${esc(t("DOWNTIME.Journal.NoPlan"))}</em></span>`;
        return `<li><img src="${esc(img)}" alt=""><div><strong>${esc(name)}</strong>${activity}${plan}</div></li>`;
      }).join("")
    : `<li class="dt-j-empty">${esc(t("DOWNTIME.Journal.NoCharacters"))}</li>`;

  return `
    <div class="dt-j-block">
      <div class="dt-j-block-head">
        <strong>${esc(t("DOWNTIME.Blocks.Block", { number: segment.block + 1 }))}</strong>
        <span>${esc(dayLabel)}</span>
      </div>
      ${rentDue ? `<div class="dt-j-due">${esc(t("DOWNTIME.Month.Due"))}</div>` : ""}
      <ul>${rows}</ul>
    </div>`;
}

function renderRun(month, run) {
  const segments = month.segments.filter(s => s.run === run);
  const runSegment = segments.find(s => s.type === "run");
  const blocks = segments.filter(s => s.type === "block" && s.isStart);
  const carried = segments.some(s => s.type === "block" && !s.isStart);

  const facts = [];
  if (runSegment) {
    const key = runSegment.isStart ? "DOWNTIME.Journal.RunDays" : "DOWNTIME.Journal.RunContinued";
    facts.push(t(key, { range: range(runSegment), days: run.runDays }));
  }
  if (run.blocks) {
    const key = run.blocks === 1 ? "DOWNTIME.Blocks.SummaryOne" : "DOWNTIME.Blocks.Summary";
    facts.push(`${t("DOWNTIME.Blocks.Label")}: ${t(key, { blocks: run.blocks, days: run.blocks * BLOCK_DAYS })}`);
  }
  if (carried) facts.push(t("DOWNTIME.Journal.BlockCarried"));

  const startsHere = segments.some(s =>
    s.isStart && (s.type === "run" || (s.block === 0 && run.runDays === 0))
  );
  if (startsHere) {
    const reward = formatRunReward(run);
    if (reward) facts.push(`${t("DOWNTIME.Run.Reward")}: ${reward}`);
  }
  const description = startsHere && run.description
    ? `<p class="dt-j-description">${esc(run.description)}</p>`
    : "";

  return `
    <section class="dt-j-run">
      <header>
        <h3>${esc(run.name)}</h3>
        <span>${facts.map(esc).join(" · ")}</span>
      </header>
      ${description}
      ${blocks.length ? `<div class="dt-j-blocks">${blocks.map(s => renderBlock(run, s)).join("")}</div>` : ""}
    </section>`;
}

function renderMonth(month) {
  const runs = month.runs.map(run => renderRun(month, run)).join("");
  return `
    <div class="dt-journal">
      <div class="dt-j-head">
        <span class="dt-j-muted">${esc(t("DOWNTIME.Journal.CampaignDays", { from: month.firstDay, to: month.lastDay }))}</span>
        ${badge(month)}
      </div>
      ${renderBar(month)}
      <div class="dt-j-legend">
        <span><i class="run"></i>${esc(t("DOWNTIME.Timeline.LegendRun"))}</span>
        <span><i class="block"></i>${esc(t("DOWNTIME.Timeline.LegendBlock"))}</span>
      </div>
      ${runs || `<p class="dt-j-muted">${esc(t("DOWNTIME.Journal.MonthEmpty"))}</p>`}
    </div>`;
}

function renderOverview(timeline, months, data) {
  const rows = months.map(month => `
    <tr>
      <td><strong>${esc(t("DOWNTIME.Month.Label", { number: month.number }))}</strong></td>
      <td>${esc(t("DOWNTIME.Journal.CampaignDays", { from: month.firstDay, to: month.lastDay }))}</td>
      <td>${month.runs.map(r => esc(r.name)).join(", ") || "–"}</td>
      <td>${badge(month)}</td>
    </tr>`).join("");
  const due = months.filter(m => m.status === "due").map(m => m.number);
  let pos = timeline.offset;
  const runs = data.runs.map((run, i) => {
    const from = pos + 1;
    pos += runLength(run);
    const days = runLength(run)
      ? t("DOWNTIME.Journal.CampaignDays", { from, to: pos })
      : "";
    const description = run.description
      ? `<p class="dt-j-description">${esc(run.description)}</p>`
      : `<p class="dt-j-muted">${esc(t("DOWNTIME.Journal.NoDescription"))}</p>`;
    const reward = formatRunReward(run);
    const rewardLine = reward ? `<p class="dt-j-muted">${esc(`${t("DOWNTIME.Run.Reward")}: ${reward}`)}</p>` : "";
    return `
      <li>
        <div class="dt-j-runlist-head"><strong>${i + 1}. ${esc(run.name)}</strong><span class="dt-j-muted">${esc(days)}</span></div>
        ${description}
        ${rewardLine}
      </li>`;
  }).reverse().join("");
  return `
    <div class="dt-journal">
      <div class="dt-j-stats">
        <div><span>${esc(t("DOWNTIME.Journal.StatDay"))}</span><strong>${timeline.total}</strong></div>
        <div><span>${esc(t("DOWNTIME.Journal.StatRuns"))}</span><strong>${data.runs.length}</strong></div>
        <div><span>${esc(t("DOWNTIME.Journal.StatMonths"))}</span><strong>${months.length}</strong></div>
        <div class="${due.length ? "due" : ""}"><span>${esc(t("DOWNTIME.Journal.StatDue"))}</span><strong>${due.length ? due.join(", ") : "–"}</strong></div>
      </div>
      <table class="dt-j-table">
        <thead><tr>
          <th>${esc(t("DOWNTIME.Journal.ColMonth"))}</th>
          <th>${esc(t("DOWNTIME.Journal.ColDays"))}</th>
          <th>${esc(t("DOWNTIME.Journal.ColRuns"))}</th>
          <th>${esc(t("DOWNTIME.Journal.ColStatus"))}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${runs ? `<h3>${esc(t("DOWNTIME.Journal.AllRuns"))}</h3><ul class="dt-j-runlist">${runs}</ul>` : ""}
      <p class="dt-j-muted">${esc(t("DOWNTIME.Journal.Generated", { date: new Date().toLocaleString(game.i18n.lang) }))}</p>
    </div>`;
}

function pageData(name, content, sort, flags) {
  return {
    name,
    type: "text",
    sort,
    title: { show: true, level: 1 },
    text: { content, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML },
    flags: { [MODULE_ID]: flags }
  };
}

async function getJournal() {
  const name = t("DOWNTIME.Journal.Name");
  const journal = game.journal.find(j => j.getFlag(MODULE_ID, "journal")) ?? game.journal.getName(name);
  if (journal) {
    const update = {};
    if (journal.name !== name) update.name = name;
    if (!journal.getFlag(MODULE_ID, "journal")) update[`flags.${MODULE_ID}.journal`] = true;
    if (!foundry.utils.isEmpty(update)) await journal.update(update);
    return journal;
  }
  return JournalEntry.create({
    name,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
    flags: { [MODULE_ID]: { journal: true } }
  });
}

export async function writeJournal() {
  const data = getData();
  const timeline = computeTimeline(data);
  const months = timeline.months.filter(m => m.segments.length || m.number === 1);
  const journal = await getJournal();

  const wanted = [
    { key: "overview", data: pageData(t("DOWNTIME.Journal.Overview"), renderOverview(timeline, months, data), 0, { page: "overview" }) },
    lifestylePage(data),
    ...months.map(month => ({
      key: `month-${month.number}`,
      data: pageData(t("DOWNTIME.Month.Label", { number: month.number }), renderMonth(month), month.number * 1000, { page: `month-${month.number}` })
    }))
  ];

  const existing = new Map();
  for (const page of journal.pages) {
    const key = page.getFlag(MODULE_ID, "page");
    if (key) existing.set(key, page);
  }

  const toCreate = [];
  const toUpdate = [];
  for (const { key, data: page } of wanted) {
    const current = existing.get(key);
    if (current) {
      toUpdate.push({ _id: current.id, name: page.name, sort: page.sort, "text.content": page.text.content });
      existing.delete(key);
    } else {
      toCreate.push(page);
    }
  }
  const toDelete = [...existing.values()].map(p => p.id);

  if (toUpdate.length) await journal.updateEmbeddedDocuments("JournalEntryPage", toUpdate);
  if (toCreate.length) await journal.createEmbeddedDocuments("JournalEntryPage", toCreate);
  if (toDelete.length) await journal.deleteEmbeddedDocuments("JournalEntryPage", toDelete);
  return journal;
}

function lifestylePage(data) {
  return { key: "lifestyles", data: pageData(t("DOWNTIME.Lifestyle.Tab"), renderLifestyles(data), 500, { page: "lifestyles" }) };
}

export async function writeLifestylePage() {
  if (!game.users.activeGM?.isSelf) return;
  const journal = await getJournal();
  const { data: page } = lifestylePage(getData());
  const current = journal.pages.find(p => p.getFlag(MODULE_ID, "page") === "lifestyles");
  if (current) await current.update({ name: page.name, "text.content": page.text.content });
  else await journal.createEmbeddedDocuments("JournalEntryPage", [page]);
}

export const scheduleLifestylePage = foundry.utils.debounce(
  () => writeLifestylePage().catch(err => console.error(`${MODULE_ID} |`, err)),
  1500
);
