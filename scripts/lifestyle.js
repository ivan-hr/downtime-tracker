export const CATEGORIES = ["comforts", "entertainment", "necessities", "neighborhood", "security"];

const BASE_LEVELS = ["street", "low", "middle", "high", "luxury"];
const ZONE_LEVELS = ["z", "e", "d", "c", "b", "a", "aa", "aaa"];
export const ZONE_HELP_GROUPS = [["z"], ["e"], ["d", "c"], ["b"], ["a"], ["aa"], ["aaa"]];

const NEIGHBORHOOD_MIGRATE = {
  zzone: "z",
  street: "e",
  squatter: "e",
  low: "c",
  middle: "a",
  high: "aa",
  luxury: "aaa"
};

export const LEVELS = {
  zzone: { lp: 0, rank: 0 },
  street: { lp: 0, rank: 0 },
  squatter: { lp: 1, rank: 1 },
  z: { lp: 0, rank: 0 },
  e: { lp: 0, rank: 0 },
  d: { lp: 1, rank: 2 },
  c: { lp: 2, rank: 2 },
  low: { lp: 2, rank: 2 },
  b: { lp: 2.5, rank: 3 },
  a: { lp: 3, rank: 3 },
  middle: { lp: 3, rank: 3 },
  aa: { lp: 4, rank: 4 },
  high: { lp: 4, rank: 4 },
  luxury: { lp: 5, rank: 5 },
  aaa: { lp: 5, rank: 5 }
};

export const DEFAULT_LEVEL = "low";
export const MAX_QUALITIES = 30;
export const MAX_EXTRAS = 10;
const ROOMMATE_PERCENT = 10;
const ROOMMATE_DISCOUNT_CAP = 50;

const TIERS = [
  { key: "luxury", min: 50000 },
  { key: "high", min: 10000 },
  { key: "middle", min: 5000 },
  { key: "low", min: 2000 },
  { key: "street", min: 0 }
];

const HEALING = {
  street: "−2",
  squatter: "−2",
  low: "−1",
  middle: "±0",
  high: "+1",
  luxury: "+2"
};

export const EXTRA_PRESETS = {
  addictionMinor: { name: "Abhängigkeit (Leicht)", fixed: 500, percent: 5 },
  addictionMajor: { name: "Abhängigkeit (Schwer)", fixed: 2000, percent: 10 },
  symbiont: { name: "Symbiont", fixed: 0, percent: 15 },
  custom: { name: "Zusatzkosten", fixed: 0, percent: 0 }
};

export const QUALITY_UPDATES = {
  "easygoing-landlord": {
    old: "Bei Zahlungsrückstand würfelt der Vermieter 2 Würfel weniger.",
    effect: "Bei Zahlungsrückstand gewährt der Vermieter einen Monat Aufschub, bevor der Lebensstil sinkt."
  },
  "trigger-happy-landlord": {
    old: "Bei Zahlungsrückstand würfelt der Vermieter 2 Würfel mehr.",
    effect: "Bei Zahlungsrückstand gibt es keine Gnade: sofortige Räumung, notfalls mit Gewalt."
  }
};

const LOCKS = {
  street: { key: "None", mod: "" },
  squatter: { key: "None", mod: "" },
  low: { key: "Easy", mod: "+0" },
  middle: { key: "Standard", mod: "−2" },
  high: { key: "Hard", mod: "−4" },
  luxury: { key: "Extreme", mod: "−6" }
};

export const DEFAULT_QUALITIES = [
  ["aspected-domain", "Aspektierte Domäne", 5, "Die Hintergrundstrahlung begünstigt eine Tradition: +1 auf Zauberwürfe dieser Tradition in der Wohnung."],
  ["astral-repellant", "Astrale Abschirmung", 5, "Geister und astrale Späher meiden den Ort: Sie erhalten −1 auf alle Würfe in der Wohnung."],
  ["commercial-zone", "Einkaufsviertel", 1, "Läden direkt vor der Tür: +1 auf Würfe, um Alltagsausrüstung zu beschaffen."],
  ["concerned-neighbors", "Wachsame Nachbarn", 2, "Die Nachbarn melden Verdächtiges: Eindringlinge erhalten −1 auf Heimlichkeit, du wirst vorgewarnt."],
  ["easygoing-landlord", "Gelassener Vermieter", 1, QUALITY_UPDATES["easygoing-landlord"].effect],
  ["escape-tunnel", "Fluchttunnel", 3, "Geheimer Ausgang: Solange er unentdeckt ist, gelingt die Flucht ohne Verfolgungsjagd."],
  ["feng-shui", "Feng Shui", 5, "Harmonische Einrichtung: +1 auf Reparieren und künstlerische Würfe in der Wohnung."],
  ["free-access", "Freier Netzzugang", 1, "Anonymer Matrixzugang: Wer die Verbindung aufspüren will, erhält −1."],
  ["friendly-neighbors", "Freundliche Nachbarn", 1, "Die Nachbarn helfen aus und halten Fremden gegenüber dicht."],
  ["hasty-exit", "Schneller Ausgang", 2, "Aus der Wohnung kommt man in einer Runde ins Freie."],
  ["homegrown-farming", "Eigener Anbau", 1, "Frische Lebensmittel aus Garten oder Hydrokultur."],
  ["in-tune", "Im Einklang", 5, "Technomancer erhalten +1 auf Resonanzwürfe in der Wohnung."],
  ["inconspicuous", "Unauffällige Wohnung", 2, "Wer die Wohnung sucht, erhält −1."],
  ["no-neighbors", "Keine Nachbarn", 1, "Niemand bekommt mit, was hier passiert."],
  ["perfect-roommate", "Perfekter Mitbewohner", 2, "Ein zuverlässiger Mitbewohner hütet die Wohnung und nimmt Nachrichten an."],
  ["privacy-screen-1", "Sichtschutz (Stufe 1)", 1, "Beobachtung und Abhören von außen −1."],
  ["privacy-screen-2", "Sichtschutz (Stufe 2)", 2, "Beobachtung und Abhören von außen −2."],
  ["privacy-screen-3", "Sichtschutz (Stufe 3)", 3, "Beobachtung und Abhören von außen −3."],
  ["quiet-neighborhood", "Ruhige Gegend", 1, "Wenig Lärm, wenig Ärger, man schläft gut."],
  ["rad-pad", "Protzbude", 1, "+1 auf Einschüchtern gegenüber Besuchern, aber die Wohnung fällt auf."],
  ["resonance-well", "Resonanzbrunnen", 5, "Technomancer erhalten +1 auf Kompilieren und Threading in der Wohnung."],
  ["security-conscious", "Sicherheitsbewusster Grundriss", 2, "Verteidiger haben in der Wohnung immer mindestens leichte Deckung (−2)."],
  ["well-made", "Solide gebaut", 1, "Wände und Türen sind robuster: Härte +2."],
  ["workplace", "Arbeitsplatz", 1, "Ein eigener Arbeitsbereich in der Wohnung."],
  ["ai-in-residence", "KI im Haus", -3, "Eine KI nistet im Hausnetz und hat eigene Pläne."],
  ["ambushers-delight", "Paradies für Angreifer", -3, "Verteidiger finden kaum Deckung, Angreifer erhalten +1 auf ihren Überraschungswurf."],
  ["black-hole-1", "Schwarzes Loch (leicht)", -2, "Dinge verschwinden: Jeden Monat W6, bei einer 1 ist ein Gegenstand weg."],
  ["black-hole-2", "Schwarzes Loch (schwer)", -4, "Dinge verschwinden: Jeden Monat W6, bei 1–2 ist ein Gegenstand weg."],
  ["corporate-owned", "Konzernwohnung", -3, "Der Konzern ist Vermieter: Hausregeln, Überwachung und Gefälligkeiten."],
  ["crash-pad", "Absteige", -1, "Freunde und Bekannte übernachten ständig hier."],
  ["defective-chn", "Defekte Heimzentrale", -1, "Die Hauselektronik spinnt regelmäßig."],
  ["green-plan", "Unzuverlässige Versorgung", -1, "Strom und Wasser fallen immer wieder aus."],
  ["haunted", "Spukhaus", -4, "Ein Geist oder eine astrale Präsenz sucht die Wohnung heim."],
  ["gremlins-1", "Haushaltsgremlins (leicht)", -1, "Geräte versagen: Jeden Monat W6, bei einer 1 fällt ein Gerät aus."],
  ["gremlins-2", "Haushaltsgremlins (schwer)", -3, "Geräte versagen: Jeden Monat W6, bei 1–2 fällt ein Gerät aus."],
  ["lax-security", "Nachlässige Sicherheit", -2, "Das Magschloss gilt als eine Schwierigkeitsstufe leichter, die Wachen erhalten −1 auf Wahrnehmung."],
  ["living-by-committee", "Hausgemeinschaft", -2, "Entscheidungen fällt die Hausversammlung."],
  ["living-with-parents", "Wohnen bei den Eltern", -2, "Die Eltern wollen wissen, was du treibst."],
  ["network-bottleneck", "Netz-Engpass", -1, "Langsame Leitung: −1 auf Hacking von zuhause."],
  ["no-forwarding-address", "Altlasten des Vormieters", -1, "Post, Besucher und Ärger, die dem Vormieter gelten."],
  ["nosy-neighbors", "Neugierige Nachbarn", -2, "Wer Informationen über dich sammelt, erhält +1."],
  ["no-privacy-1", "Keine Privatsphäre (Stufe 1)", -1, "Beobachtung und Abhören von außen +1."],
  ["no-privacy-2", "Keine Privatsphäre (Stufe 2)", -2, "Beobachtung und Abhören von außen +2."],
  ["no-privacy-3", "Keine Privatsphäre (Stufe 3)", -3, "Beobachtung und Abhören von außen +3."],
  ["pest-magnet-1", "Ungeziefermagnet (leicht)", -1, "Ratten, Kakerlaken und Schlimmeres."],
  ["pest-magnet-2", "Ungeziefermagnet (schwer)", -3, "Erwachtes Ungeziefer: gelegentlich eine echte Begegnung."],
  ["poor-condition", "Schlechter Zustand", -1, "Feuchte Wände, kaputte Fenster, ständige Reparaturen."],
  ["rough-neighborhood", "Raue Gegend", -1, "Mehr Gangs, mehr Ärger, weniger Polizei."],
  ["sprite-magnet-1", "Sprite-Magnet (leicht)", -1, "Wilde Sprites: Jeden Monat W6, bei einer 1 gibt es eine Störung."],
  ["sprite-magnet-2", "Sprite-Magnet (schwer)", -3, "Wilde Sprites: Jeden Monat W6, bei 1–2 gibt es eine Störung."],
  ["big-bobs", "Falsche Adresse", -1, "Ständig klingeln Leute, die das frühere Geschäft suchen."],
  ["trigger-happy-landlord", "Schießwütiger Vermieter", -1, QUALITY_UPDATES["trigger-happy-landlord"].effect],
  ["unsound", "Baufällig", -2, "Das Gebäude ist marode, Einsturzgefahr bei schweren Treffern."],
  ["unsafe", "Einsturzgefährdet", -3, "Akute Einsturzgefahr, Explosionen und Feuer haben verheerende Folgen."],
  ["worse-neighbors", "Schlimmere Nachbarn", -1, "Die Nachbarn machen dir das Leben schwer."]
].map(([id, name, lp, effect]) => ({ id, name, lp, effect }));

export function levelsFor(category) {
  return category === "neighborhood" ? ZONE_LEVELS : BASE_LEVELS;
}

function int(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export function normalizeQuality(quality) {
  return {
    id: String(quality.id || foundry.utils.randomID()),
    name: String(quality.name ?? "").trim().slice(0, 80),
    lp: int(quality.lp, -10, 10, 0),
    effect: String(quality.effect ?? "").trim().slice(0, 300)
  };
}

export function normalizeExtra(extra) {
  return {
    id: String(extra.id || foundry.utils.randomID()),
    name: String(extra.name ?? "").trim().slice(0, 80),
    fixed: int(extra.fixed, 0, 1000000, 0),
    percent: int(extra.percent, 0, 100, 0)
  };
}

export function normalizeLifestyle(lifestyle) {
  const categories = {};
  for (const key of CATEGORIES) {
    let level = lifestyle.categories?.[key];
    if (key === "neighborhood") level = NEIGHBORHOOD_MIGRATE[level] ?? level;
    else if (level === "squatter") level = "street";
    categories[key] = levelsFor(key).includes(level) ? level : (key === "neighborhood" ? "c" : DEFAULT_LEVEL);
  }
  const qualities = Array.isArray(lifestyle.qualities)
    ? lifestyle.qualities.filter(q => q?.id).map(normalizeQuality).slice(0, MAX_QUALITIES)
    : [];
  return {
    id: String(lifestyle.id || foundry.utils.randomID()),
    actorId: String(lifestyle.actorId ?? ""),
    name: String(lifestyle.name ?? ""),
    img: String(lifestyle.img ?? ""),
    title: String(lifestyle.title ?? "").slice(0, 80),
    categories,
    qualities: [...new Map(qualities.map(q => [q.id, q])).values()],
    roommates: int(lifestyle.roommates, 0, 20, 0),
    extras: Array.isArray(lifestyle.extras)
      ? lifestyle.extras.filter(e => e && typeof e === "object").map(normalizeExtra).slice(0, MAX_EXTRAS)
      : [],
    notes: String(lifestyle.notes ?? "").slice(0, 2000)
  };
}

export function lpCost(lp) {
  if (lp <= 0) return 0;
  if (lp <= 5) return lp * 100;
  if (lp <= 10) return 500 + (lp - 5) * 300;
  if (lp <= 15) return 2000 + (lp - 10) * 600;
  if (lp <= 20) return 5000 + (lp - 15) * 1000;
  if (lp <= 21) return 10000 + (lp - 20) * 5000;
  if (lp <= 22) return 15000 + (lp - 21) * 5000;
  if (lp <= 23) return 20000 + (lp - 22) * 10000;
  if (lp <= 30) return 30000 + (lp - 23) * 10000;
  return 100000 + (lp - 30) * 25000;
}

export function resolveQualities(lifestyle, qualities) {
  const list = new Map(qualities.map(q => [q.id, q]));
  return lifestyle.qualities.map(stored => {
    const current = list.get(stored.id);
    return current ? { ...current, removed: false } : { ...stored, removed: true };
  });
}

function warnings(categories) {
  const rank = key => LEVELS[categories[key]].rank;
  const hood = categories.neighborhood;
  const list = [];
  if (rank("entertainment") > rank("necessities") + 1) list.push("Entertainment");
  if (hood === "z" && CATEGORIES.some(k => k !== "neighborhood" && rank(k) > 0)) list.push("ZZone");
  if (hood === "e" && rank("comforts") > LEVELS.low.rank) list.push("ZoneE");
  if (hood === "aa" && (rank("security") < LEVELS.middle.rank || rank("necessities") < LEVELS.middle.rank)) list.push("ZoneAA");
  if (hood === "aaa" && CATEGORIES.some(k => k !== "neighborhood" && rank(k) < LEVELS.high.rank)) list.push("ZoneAAA");
  if (rank("comforts") > rank("security") || rank("comforts") > rank("neighborhood")) list.push("Thieves");
  return list;
}

export function analyzeLifestyle(lifestyle, qualities) {
  const resolved = resolveQualities(lifestyle, qualities);
  const categoryLp = Math.round(CATEGORIES.reduce((sum, key) => sum + LEVELS[lifestyle.categories[key]].lp, 0) * 10) / 10;
  const qualityLp = resolved.reduce((sum, q) => sum + q.lp, 0);
  const totalLp = Math.max(Math.round((categoryLp + qualityLp) * 10) / 10, 0);
  const baseCost = lpCost(totalLp);
  const extraPercent = lifestyle.extras.reduce((sum, e) => sum + e.percent, 0);
  const roommatePercent = Math.min(lifestyle.roommates * ROOMMATE_PERCENT, ROOMMATE_DISCOUNT_CAP);
  const percent = extraPercent - roommatePercent;
  const fixed = lifestyle.extras.reduce((sum, e) => sum + e.fixed, 0);
  const cost = Math.max(0, Math.round(baseCost * (1 + percent / 100)) + fixed);
  const tier = TIERS.find(t => baseCost >= t.min);
  return {
    qualities: resolved,
    categoryLp,
    qualityLp,
    totalLp,
    baseCost,
    extraPercent,
    roommatePercent,
    percent,
    fixed,
    cost,
    tier: tier.key,
    healing: HEALING[lifestyle.categories.necessities] ?? HEALING.street,
    lock: LOCKS[lifestyle.categories.security],
    guards: lifestyle.categories.security,
    warnings: warnings(lifestyle.categories)
  };
}
