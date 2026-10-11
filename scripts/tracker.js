import {
  BLOCK_DAYS,
  MAX_BLOCKS,
  MODULE_ID,
  MONTH_DAYS,
  SOCKET,
  clampInt,
  clampNuyen,
  computeTimeline,
  REWARD_MAX,
  createRun,
  dayInMonth,
  getData,
  getOffset,
  lifestyleOp,
  monthOf,
  monthStatusLabel,
  replaceData,
  runLength,
  saveData,
  setEntryField,
  totalDays
} from "./data.js";
import { costBreakdown, formatLp, formatNuyen, formatRunReward, lifestyleFacts, scheduleLifestylePage, writeJournal } from "./journal.js";
import { CATEGORIES, EXTRA_PRESETS, LEVELS, ZONE_HELP_GROUPS, analyzeLifestyle, levelsFor, normalizeQuality } from "./lifestyle.js";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const DEFAULT_IMG = "icons/svg/mystery-man.svg";

export class DowntimeTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  static #instance = null;

  static get instance() {
    return this.#instance;
  }

  static open() {
    this.#instance ??= new this();
    this.#instance.render({ force: true });
    return this.#instance;
  }

  async close(options) {
    if (this.constructor.#instance === this) this.constructor.#instance = null;
    return super.close(options);
  }

  static DEFAULT_OPTIONS = {
    id: "downtime-tracker",
    classes: ["downtime-tracker"],
    window: {
      title: "DOWNTIME.Title",
      icon: "fa-solid fa-hourglass-half",
      resizable: true
    },
    position: { width: 800, height: 780 },
    actions: {
      newRun: DowntimeTracker._onNewRun,
      deleteRun: DowntimeTracker._onDeleteRun,
      setBlocks: DowntimeTracker._onSetBlocks,
      removeEntry: DowntimeTracker._onRemoveEntry,
      removeParticipant: DowntimeTracker._onRemoveParticipant,
      selectRun: DowntimeTracker._onSelectRun,
      togglePaid: DowntimeTracker._onTogglePaid,
      toggleMonths: DowntimeTracker._onToggleMonths,
      writeJournal: DowntimeTracker._onWriteJournal,
      exportData: DowntimeTracker._onExportData,
      importData: DowntimeTracker._onImportData,
      toggleSettings: DowntimeTracker._onToggleSettings,
      addActivity: DowntimeTracker._onAddActivity,
      removeActivity: DowntimeTracker._onRemoveActivity,
      moveActivity: DowntimeTracker._onMoveActivity,
      setTab: DowntimeTracker._onSetTab,
      toggleHelp: DowntimeTracker._onToggleHelp,
      deleteLifestyle: DowntimeTracker._onDeleteLifestyle,
      removeLifestyleQuality: DowntimeTracker._onRemoveLifestyleQuality,
      removeExtra: DowntimeTracker._onRemoveExtra,
      addQuality: DowntimeTracker._onAddQuality,
      removeQuality: DowntimeTracker._onRemoveQuality
    }
  };

  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    if (game.user.isGM) {
      const label = game.i18n.localize("DOWNTIME.Settings.Open");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "header-control icon fa-solid fa-gear";
      button.dataset.action = "toggleSettings";
      button.dataset.tooltip = label;
      button.setAttribute("aria-label", label);
      const close = this.window.close ?? frame.querySelector(".window-header [data-action='close']");
      if (close) close.before(button);
      else frame.querySelector(".window-header")?.append(button);
    }
    return frame;
  }

  _getHeaderControls() {
    const controls = super._getHeaderControls();
    if (!game.user.isGM) return controls;
    return [
      ...controls,
      { icon: "fa-solid fa-book-open", label: "DOWNTIME.Journal.Write", action: "writeJournal" },
      { icon: "fa-solid fa-file-export", label: "DOWNTIME.Data.Export", action: "exportData" },
      { icon: "fa-solid fa-file-import", label: "DOWNTIME.Data.Import", action: "importData" }
    ];
  }

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/tracker.hbs`,
      scrollable: [".dt-body"]
    }
  };

  selectedRunId = null;
  showAllMonths = false;
  showSettings = false;
  tab = "log";
  showHelp = false;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const data = getData();
    const isGM = game.user.isGM;
    const run = data.runs.find(r => r.id === this.selectedRunId) ?? data.runs.at(-1) ?? null;
    this.selectedRunId = run?.id ?? null;

    const offset = getOffset();
    const total = totalDays(data);
    const starts = new Map();
    let pos = offset;
    for (const r of data.runs) {
      starts.set(r.id, pos);
      pos += runLength(r);
    }

    const months = this.#buildMonths(data, run);
    const hiddenMonths = months.filter(m => m.collapsed).length;

    return Object.assign(context, {
      isGM,
      run: run && { ...run, rewardLabel: formatRunReward(run) },
      runOptions: data.runs
        .map((r, i) => ({ id: r.id, label: `${i + 1}. ${r.name}`, selected: r.id === run?.id }))
        .reverse(),
      checks: run ? this.#buildChecks(run) : [],
      blockSummary: run ? this.#blockSummary(run.blocks) : "",
      blocks: run ? this.#buildBlocks(run, starts.get(run.id), data.activities) : [],
      status: this.#buildStatus(total, months),
      months: months.filter(m => !m.collapsed),
      hiddenMonths,
      showAllMonths: this.showAllMonths,
      canToggleMonths: this.showAllMonths ? months.some(m => m.status === "paid") : hiddenMonths > 0,
      ticks: Array.from({ length: MONTH_DAYS }, (_, i) => ((i + 1) % 5 === 0 ? i + 1 : "")),
      participants: run ? run.participants.map(id => this.#actorInfo(id, run)) : [],
      showSettings: isGM && this.showSettings,
      activities: data.activities.map((name, index) => ({
        name,
        index,
        first: index === 0,
        last: index === data.activities.length - 1
      })),
      tabLog: this.tab === "log",
      tabLifestyles: this.tab === "lifestyles",
      lifestyles: this.#buildLifestyles(data),
      showHelp: this.showHelp,
      helpCategories: this.showHelp ? this.#buildHelp() : [],
      qualityDefs: [...data.qualities].sort((a, b) => b.lp - a.lp || a.name.localeCompare(b.name))
    });
  }

  #buildHelp() {
    const i18n = game.i18n;
    return CATEGORIES.map(key => {
      const zones = key === "neighborhood";
      return {
        label: i18n.localize(`DOWNTIME.Lifestyle.Category.${key}`),
        detail: i18n.localize(`DOWNTIME.Lifestyle.Help.Detail.${key}`),
        zones,
        terms: zones ? i18n.localize("DOWNTIME.Lifestyle.Help.ZoneTerms") : "",
        levels: (zones ? ZONE_HELP_GROUPS : levelsFor(key).map(level => [level])).map(group => {
          const id = group.join("");
          const sameLp = group.every(level => LEVELS[level].lp === LEVELS[group[0]].lp);
          return {
            label: i18n.localize(`DOWNTIME.Lifestyle.Level.${group.length > 1 ? id : group[0]}`),
            lp: LEVELS[group[0]].lp,
            lpLabel: sameLp
              ? `${LEVELS[group[0]].lp} LP`
              : group.map(level => `${level.toUpperCase()} ${LEVELS[level].lp} LP`).join(" · "),
            text: i18n.localize(`DOWNTIME.Lifestyle.Help.Levels.${key}.${group.length > 1 ? id : group[0]}`)
          };
        })
      };
    });
  }

  #buildLifestyles(data) {
    const isGM = game.user.isGM;
    const sorted = [...data.qualities].sort((a, b) => a.name.localeCompare(b.name));
    return data.lifestyles
      .map(lifestyle => {
        const actor = game.actors.get(lifestyle.actorId);
        const analysis = analyzeLifestyle(lifestyle, data.qualities);
        const chosen = new Set(lifestyle.qualities.map(q => q.id));
        const available = sorted.filter(q => !chosen.has(q.id));
        const option = q => ({ id: q.id, label: `${q.name} (${formatLp(q.lp)} LP)` });
        return {
          id: lifestyle.id,
          name: actor?.name ?? lifestyle.name ?? "?",
          img: actor?.img || lifestyle.img || DEFAULT_IMG,
          title: lifestyle.title,
          roommates: lifestyle.roommates,
          notes: lifestyle.notes,
          canEdit: isGM || !!actor?.isOwner,
          categories: CATEGORIES.map(key => ({
            key,
            label: game.i18n.localize(`DOWNTIME.Lifestyle.Category.${key}`),
            tooltip: `DOWNTIME.Lifestyle.Help.Tooltip.${key}`,
            lp: LEVELS[lifestyle.categories[key]].lp,
            options: levelsFor(key).map(level => {
              const name = game.i18n.localize(`DOWNTIME.Lifestyle.Level.${level}`);
              const lp = LEVELS[level].lp;
              return {
                value: level,
                label: key === "neighborhood" ? `${name} · ${lp} LP` : `${name} (${lp})`,
                selected: level === lifestyle.categories[key]
              };
            })
          })),
          qualities: analysis.qualities.map(q => ({
            ...q,
            lpLabel: formatLp(q.lp),
            negative: q.lp < 0
          })),
          positive: available.filter(q => q.lp >= 0).map(option),
          negative: available.filter(q => q.lp < 0).map(option),
          analysis,
          costLabel: formatNuyen(analysis.cost),
          lpShort: game.i18n.format("DOWNTIME.Lifestyle.LpTotal", { lp: analysis.totalLp }),
          lpLabel: game.i18n.format("DOWNTIME.Lifestyle.LpBreakdown", {
            total: analysis.totalLp,
            categories: analysis.categoryLp,
            qualities: formatLp(analysis.qualityLp)
          }),
          extras: lifestyle.extras,
          extraPresets: Object.keys(EXTRA_PRESETS).map(key => ({
            key,
            label: game.i18n.localize(`DOWNTIME.Lifestyle.Extra.Preset.${key}`)
          })),
          breakdown: costBreakdown(analysis),
          facts: lifestyleFacts(analysis),
          warnings: analysis.warnings.map(key => game.i18n.localize(`DOWNTIME.Lifestyle.Warn.${key}`))
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  #lifestyle(op) {
    if (game.user.isGM) return lifestyleOp(game.user.id, op).then(() => scheduleLifestylePage());
    if (!game.users.activeGM) {
      ui.notifications.warn("DOWNTIME.Notify.NoGM", { localize: true });
      return;
    }
    game.socket.emit(SOCKET, { action: "lifestyle", userId: game.user.id, op });
  }

  #saveQualities(mutator) {
    return saveData(mutator).then(() => scheduleLifestylePage());
  }

  #addQuality() {
    const nameInput = this.element.querySelector("input[name='newQualityName']");
    const lpInput = this.element.querySelector("input[name='newQualityLp']");
    const effectInput = this.element.querySelector("input[name='newQualityEffect']");
    const quality = normalizeQuality({ name: nameInput?.value, lp: lpInput?.value, effect: effectInput?.value });
    if (!quality.name) return;
    nameInput.value = "";
    effectInput.value = "";
    return this.#saveQualities(data => {
      if (data.qualities.some(q => q.name === quality.name)) {
        ui.notifications.info(game.i18n.format("DOWNTIME.Activities.Exists", { name: quality.name }));
        return false;
      }
      data.qualities.push(quality);
    });
  }

  #buildStatus(total, months) {
    const passed = total % MONTH_DAYS;
    const left = MONTH_DAYS - passed;
    return {
      campaignDay: total,
      month: Math.floor(total / MONTH_DAYS) + 1,
      fill: Math.round((passed / MONTH_DAYS) * 1000) / 1000,
      leftLabel: game.i18n.format(left === 1 ? "DOWNTIME.Status.NextRentOne" : "DOWNTIME.Status.NextRent", { days: left }),
      dueMonths: months.filter(m => m.status === "due").map(m => m.number).join(", ")
    };
  }

  #buildChecks(run) {
    return Array.from({ length: MAX_BLOCKS }, (_, i) => ({
      count: i + 1,
      days: (i + 1) * BLOCK_DAYS,
      checked: i < run.blocks
    }));
  }

  #blockSummary(blocks) {
    if (!blocks) return game.i18n.localize("DOWNTIME.Blocks.None");
    const key = blocks === 1 ? "DOWNTIME.Blocks.SummaryOne" : "DOWNTIME.Blocks.Summary";
    return game.i18n.format(key, { blocks, days: blocks * BLOCK_DAYS });
  }

  #actorInfo(actorId, run) {
    const actor = game.actors.get(actorId);
    const stored = run.assignments.flat().find(e => e.actorId === actorId);
    return {
      id: actorId,
      name: actor?.name ?? stored?.name ?? "?",
      img: actor?.img || stored?.img || DEFAULT_IMG
    };
  }

  #activityOptions(current, activities) {
    const options = activities.map(name => ({ value: name, label: name, selected: name === current }));
    if (current && !activities.includes(current)) {
      options.unshift({
        value: current,
        label: game.i18n.format("DOWNTIME.Activities.Removed", { name: current }),
        selected: true,
        disabled: true
      });
    }
    return options;
  }

  #buildBlocks(run, runStart, activities) {
    const isGM = game.user.isGM;
    const downtimeStart = runStart + run.runDays;
    return Array.from({ length: run.blocks }, (_, b) => {
      const first = downtimeStart + b * BLOCK_DAYS + 1;
      const last = first + BLOCK_DAYS - 1;
      return {
        index: b,
        number: b + 1,
        month: monthOf(first),
        from: dayInMonth(first),
        to: dayInMonth(last),
        rentDue: Math.floor(last / MONTH_DAYS) > Math.floor((first - 1) / MONTH_DAYS),
        entries: run.assignments[b].map((entry, i) => {
          const actor = game.actors.get(entry.actorId);
          return {
            index: i,
            block: b,
            actorId: entry.actorId,
            name: actor?.name ?? entry.name ?? "?",
            img: actor?.img || entry.img || DEFAULT_IMG,
            plan: entry.plan,
            activity: entry.activity,
            options: this.#activityOptions(entry.activity, activities),
            canEdit: isGM || !!actor?.isOwner
          };
        })
      };
    });
  }

  #buildMonths(data, selectedRun) {
    return computeTimeline(data).months.map(month => {
      const segments = month.segments.map(s => {
        if (s.type === "before") {
          return { type: "before", col: s.col, span: s.span, tooltip: game.i18n.localize("DOWNTIME.Timeline.Before") };
        }
        const isRun = s.type === "run";
        return {
          type: s.type,
          col: s.col,
          span: s.span,
          runId: s.run.id,
          selected: s.run.id === selectedRun?.id,
          label: isRun ? s.run.name : `B${s.block + 1}`,
          tooltip: isRun
            ? game.i18n.format("DOWNTIME.Timeline.RunTooltip", { name: s.run.name, days: s.run.runDays })
            : game.i18n.format("DOWNTIME.Timeline.BlockTooltip", { name: s.run.name, block: s.block + 1 })
        };
      });
      const containsSelected = month.runs.some(r => r.id === selectedRun?.id);
      return {
        number: month.number,
        segments,
        status: month.status,
        statusLabel: monthStatusLabel(month),
        complete: month.complete,
        collapsed: !this.showAllMonths && month.status === "paid" && !containsSelected,
        ariaLabel: `${game.i18n.format("DOWNTIME.Month.Label", { number: month.number })}: ${month.runs.map(r => r.name).join(", ")}`
      };
    });
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this.element.addEventListener("change", this.#onChange.bind(this));
    this.element.addEventListener("keydown", this.#onKeyDown.bind(this));
    this.element.addEventListener("dragstart", this.#onDragStart.bind(this));
    this.element.addEventListener("dragover", this.#onDragOver.bind(this));
    this.element.addEventListener("dragleave", this.#onDragLeave.bind(this));
    this.element.addEventListener("drop", this.#onDrop.bind(this));
  }

  #updateRun(fn) {
    const runId = this.selectedRunId;
    return saveData(data => {
      const run = data.runs.find(r => r.id === runId);
      if (!run) return false;
      return fn(run);
    });
  }

  #onKeyDown(event) {
    if (event.key !== "Enter" || !event.target.matches?.("input[type=text], input[type=number]")) return;
    event.preventDefault();
    if (event.target.name === "newActivity") this.#addActivity();
    else if (event.target.name?.startsWith("newQuality")) this.#addQuality();
    else event.target.blur();
  }

  #addActivity() {
    const input = this.element.querySelector("input[name='newActivity']");
    const name = input?.value.trim();
    if (!name) return;
    input.value = "";
    return saveData(data => {
      if (data.activities.includes(name)) {
        ui.notifications.info(game.i18n.format("DOWNTIME.Activities.Exists", { name }));
        return false;
      }
      data.activities.push(name);
    });
  }

  #onChange(event) {
    const el = event.target;
    if (el.name === "selectRun") {
      this.selectedRunId = el.value;
      this.render();
      return;
    }

    if (el.name?.startsWith("ls.")) {
      const lifestyleId = el.closest("[data-lifestyle-id]")?.dataset.lifestyleId;
      const field = el.name.slice(3);
      if (!lifestyleId) return;
      if (field === "addQuality") {
        if (el.value) this.#lifestyle({ type: "addQuality", lifestyleId, qualityId: el.value });
        return;
      }
      if (field === "addExtra") {
        if (el.value) this.#lifestyle({ type: "addExtra", lifestyleId, preset: el.value });
        return;
      }
      if (field.startsWith("extra.")) {
        const extraId = el.closest("[data-extra-id]")?.dataset.extraId;
        this.#lifestyle({ type: "setExtra", lifestyleId, extraId, field: field.slice(6), value: el.value });
        return;
      }
      this.#lifestyle({ type: "set", lifestyleId, field, value: el.value });
      return;
    }

    if (el.name?.startsWith("q.") && game.user.isGM) {
      const qualityId = el.closest("[data-quality-id]")?.dataset.qualityId;
      const field = el.name.slice(2);
      this.#saveQualities(data => {
        const quality = data.qualities.find(q => q.id === qualityId);
        if (!quality || !["name", "lp", "effect"].includes(field)) return false;
        const updated = normalizeQuality({ ...quality, [field]: el.value });
        if (!updated.name) return false;
        Object.assign(quality, updated);
      });
      return;
    }

    if (el.name === "plan" || el.name === "activity") {
      const entryEl = el.closest("[data-entry]");
      const block = Number(entryEl.dataset.block);
      const actorId = entryEl.dataset.actorId;
      if (game.user.isGM) return setEntryField(this.selectedRunId, block, actorId, el.name, el.value);
      if (!game.users.activeGM) {
        ui.notifications.warn("DOWNTIME.Notify.NoGM", { localize: true });
        return;
      }
      game.socket.emit(SOCKET, {
        action: "setEntryField",
        userId: game.user.id,
        runId: this.selectedRunId,
        block,
        actorId,
        field: el.name,
        value: el.value
      });
      return;
    }

    if (!game.user.isGM) return;
    if (el.name === "runName") {
      const name = el.value.trim();
      if (name) this.#updateRun(run => void (run.name = name));
    } else if (el.name === "runDescription") {
      const description = el.value.trim().slice(0, 2000);
      this.#updateRun(run => void (run.description = description));
    } else if (el.name === "runDays") {
      this.#updateRun(run => void (run.runDays = clampInt(el.value, 0, 365, run.runDays)));
    } else if (el.name === "runNuyen") {
      this.#updateRun(run => void (run.nuyen = clampNuyen(el.value)));
    } else if (el.name === "runKarma") {
      this.#updateRun(run => void (run.karma = clampInt(el.value, 0, REWARD_MAX, 0)));
    } else if (el.name === "runReputation") {
      this.#updateRun(run => void (run.reputation = clampInt(el.value, 0, REWARD_MAX, 0)));
    }
  }

  #onDragStart(event) {
    if (!game.user.isGM) return;
    const chip = event.target.closest?.("[data-drag-actor]");
    if (chip) {
      event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Actor", uuid: `Actor.${chip.dataset.dragActor}` }));
      return;
    }
    const entryEl = event.target.closest?.("[data-drag-entry]")?.closest("[data-entry]");
    if (entryEl) {
      event.dataTransfer.setData("text/plain", JSON.stringify({
        type: "DowntimeEntry",
        block: Number(entryEl.dataset.block),
        index: Number(entryEl.dataset.index)
      }));
    }
  }

  #onDragOver(event) {
    const zone = event.target.closest?.("[data-drop]");
    if (!zone || (!game.user.isGM && zone.dataset.drop !== "lifestyle")) return;
    event.preventDefault();
    zone.classList.add("over");
  }

  #onDragLeave(event) {
    const zone = event.target.closest?.("[data-drop]");
    if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove("over");
  }

  #onDrop(event) {
    const zone = event.target.closest?.("[data-drop]");
    if (!zone) return;
    const isLifestyle = zone.dataset.drop === "lifestyle";
    if (!game.user.isGM && !isLifestyle) return;
    event.preventDefault();
    zone.classList.remove("over");

    let payload;
    try {
      payload = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }

    if (isLifestyle) {
      if (payload?.type !== "Actor") return;
      const actor = fromUuidSync(payload.uuid);
      if (actor?.documentName !== "Actor" || actor.pack) return;
      if (!game.user.isGM && !actor.isOwner) {
        ui.notifications.warn("DOWNTIME.Lifestyle.NotOwner", { localize: true });
        return;
      }
      this.#lifestyle({ type: "create", actorId: actor.id, title: game.i18n.localize("DOWNTIME.Lifestyle.DefaultTitle") });
      return;
    }

    const isPool = zone.dataset.drop === "pool";
    const target = Number(zone.dataset.block);

    if (payload?.type === "Actor") {
      const actor = fromUuidSync(payload.uuid);
      if (actor?.documentName !== "Actor" || actor.pack) return;
      this.#updateRun(run => {
        if (!run.participants.includes(actor.id)) run.participants.push(actor.id);
        if (isPool) return;
        const list = run.assignments[target];
        if (list.some(e => e.actorId === actor.id)) {
          ui.notifications.info(game.i18n.format("DOWNTIME.Notify.AlreadyInBlock", { name: actor.name }));
          return false;
        }
        list.push({ actorId: actor.id, name: actor.name, img: actor.img, plan: "" });
      });
      return;
    }

    if (payload?.type === "DowntimeEntry" && !isPool && payload.block !== target) {
      this.#updateRun(run => {
        const source = run.assignments[payload.block];
        const entry = source?.[payload.index];
        if (!entry) return false;
        if (run.assignments[target].some(e => e.actorId === entry.actorId)) {
          ui.notifications.info(game.i18n.format("DOWNTIME.Notify.AlreadyInBlock", { name: entry.name }));
          return false;
        }
        source.splice(payload.index, 1);
        run.assignments[target].push(entry);
      });
    }
  }

  static async _onNewRun() {
    const run = createRun(game.i18n.localize("DOWNTIME.Run.NewName"));
    this.selectedRunId = run.id;
    await saveData(data => void data.runs.push(run));
  }

  static async _onDeleteRun() {
    const run = getData().runs.find(r => r.id === this.selectedRunId);
    if (!run) return;
    const confirmed = await DialogV2.confirm({
      window: { title: "DOWNTIME.Run.DeleteTitle" },
      content: `<p>${game.i18n.format("DOWNTIME.Run.DeleteText", { name: foundry.utils.escapeHTML(run.name) })}</p>`
    });
    if (!confirmed) return;
    this.selectedRunId = null;
    await saveData(data => void (data.runs = data.runs.filter(r => r.id !== run.id)));
  }

  static async _onSetBlocks(event, target) {
    const count = Number(target.dataset.count);
    await this.#updateRun(run => void (run.blocks = run.blocks === count ? count - 1 : count));
  }

  static async _onRemoveEntry(event, target) {
    const entryEl = target.closest("[data-entry]");
    const block = Number(entryEl.dataset.block);
    const index = Number(entryEl.dataset.index);
    await this.#updateRun(run => void run.assignments[block]?.splice(index, 1));
  }

  static async _onRemoveParticipant(event, target) {
    const actorId = target.closest("[data-drag-actor]").dataset.dragActor;
    await this.#updateRun(run => {
      run.participants = run.participants.filter(id => id !== actorId);
      run.assignments = run.assignments.map(list => list.filter(e => e.actorId !== actorId));
    });
  }

  static _onSelectRun(event, target) {
    this.selectedRunId = target.dataset.runId;
    this.render();
  }

  static async _onTogglePaid(event, target) {
    const number = Number(target.dataset.month);
    await saveData(data => {
      data.paidMonths = data.paidMonths.includes(number)
        ? data.paidMonths.filter(m => m !== number)
        : [...data.paidMonths, number];
    });
  }

  static _onToggleMonths() {
    this.showAllMonths = !this.showAllMonths;
    this.render();
  }

  static _onToggleSettings() {
    if (!game.user.isGM) return;
    this.showSettings = !this.showSettings;
    this.render();
  }

  static _onAddActivity() {
    return this.#addActivity();
  }

  static async _onRemoveActivity(event, target) {
    const index = Number(target.dataset.index);
    await saveData(data => void data.activities.splice(index, 1));
  }

  static async _onMoveActivity(event, target) {
    const index = Number(target.dataset.index);
    const to = index + Number(target.dataset.dir);
    await saveData(data => {
      if (to < 0 || to >= data.activities.length) return false;
      [data.activities[index], data.activities[to]] = [data.activities[to], data.activities[index]];
    });
  }

  static _onSetTab(event, target) {
    this.tab = target.dataset.tab === "lifestyles" ? "lifestyles" : "log";
    this.render();
  }

  static _onToggleHelp() {
    this.showHelp = !this.showHelp;
    this.render();
  }

  static async _onDeleteLifestyle(event, target) {
    const lifestyleId = target.closest("[data-lifestyle-id]").dataset.lifestyleId;
    const lifestyle = getData().lifestyles.find(l => l.id === lifestyleId);
    if (!lifestyle) return;
    const name = game.actors.get(lifestyle.actorId)?.name ?? lifestyle.name;
    const confirmed = await DialogV2.confirm({
      window: { title: "DOWNTIME.Lifestyle.Delete" },
      content: `<p>${game.i18n.format("DOWNTIME.Lifestyle.DeleteText", {
        name: foundry.utils.escapeHTML(name),
        title: foundry.utils.escapeHTML(lifestyle.title || game.i18n.localize("DOWNTIME.Lifestyle.DefaultTitle"))
      })}</p>`
    });
    if (confirmed) this.#lifestyle({ type: "delete", lifestyleId });
  }

  static _onRemoveLifestyleQuality(event, target) {
    const lifestyleId = target.closest("[data-lifestyle-id]").dataset.lifestyleId;
    this.#lifestyle({ type: "removeQuality", lifestyleId, qualityId: target.dataset.qualityId });
  }

  static _onRemoveExtra(event, target) {
    const lifestyleId = target.closest("[data-lifestyle-id]").dataset.lifestyleId;
    const extraId = target.closest("[data-extra-id]").dataset.extraId;
    this.#lifestyle({ type: "removeExtra", lifestyleId, extraId });
  }

  static _onAddQuality() {
    if (game.user.isGM) return this.#addQuality();
  }

  static async _onRemoveQuality(event, target) {
    if (!game.user.isGM) return;
    const qualityId = target.closest("[data-quality-id]").dataset.qualityId;
    await this.#saveQualities(data => void (data.qualities = data.qualities.filter(q => q.id !== qualityId)));
  }

  static async _onWriteJournal() {
    if (!game.user.isGM) return;
    const journal = await writeJournal();
    ui.notifications.info(game.i18n.format("DOWNTIME.Journal.Written", { name: journal.name }));
    journal.sheet.render({ force: true });
  }

  static _onExportData() {
    if (!game.user.isGM) return;
    const payload = {
      module: MODULE_ID,
      version: game.modules.get(MODULE_ID).version,
      world: game.world.id,
      exportedAt: new Date().toISOString(),
      startOffset: getOffset(),
      data: getData()
    };
    const stamp = new Date().toISOString().slice(0, 10);
    foundry.utils.saveDataToFile(JSON.stringify(payload, null, 2), "application/json", `abenteuerlog-${game.world.id}-${stamp}.json`);
  }

  static async _onImportData() {
    if (!game.user.isGM) return;
    const file = await DialogV2.prompt({
      window: { title: "DOWNTIME.Data.Import" },
      content: `<p>${game.i18n.localize("DOWNTIME.Data.ImportHint")}</p><input type="file" name="file" accept=".json,application/json">`,
      ok: {
        label: "DOWNTIME.Data.ImportButton",
        icon: "fa-solid fa-file-import",
        callback: (event, button) => button.form.elements.file.files[0] ?? null
      },
      rejectClose: false
    });
    if (!file) return;

    let payload;
    try {
      payload = JSON.parse(await foundry.utils.readTextFromFile(file));
    } catch {
      ui.notifications.error("DOWNTIME.Data.ImportInvalid", { localize: true });
      return;
    }
    const raw = payload?.data ?? payload;
    if (!Array.isArray(raw?.runs)) {
      ui.notifications.error("DOWNTIME.Data.ImportInvalid", { localize: true });
      return;
    }

    const confirmed = await DialogV2.confirm({
      window: { title: "DOWNTIME.Data.Import" },
      content: `<p>${game.i18n.format("DOWNTIME.Data.ImportConfirm", { runs: raw.runs.length })}</p>`
    });
    if (!confirmed) return;

    if (Number.isInteger(payload?.startOffset)) {
      await game.settings.set(MODULE_ID, "startOffset", clampInt(payload.startOffset, 0, MONTH_DAYS - 1, 0));
    }
    this.selectedRunId = null;
    await replaceData(raw);
    ui.notifications.info("DOWNTIME.Data.Imported", { localize: true });
  }
}
