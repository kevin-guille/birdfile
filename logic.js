// Fonctions pures: codes, bague, JPEG, audio, ZIP. Pas de DOM.

export const VUES = {
  tete: { label: "Tête" },
  dessus: { label: "Dessus" },
  croupion: { label: "Croupion" },
  aile: { label: "Aile droite" },
  queue: { label: "Queue" },
  profil: { label: "Profil" },
  face: { label: "Face" },
};

const REQUIS = {
  HIPPALREI: ["profil", "aile", "queue"],
  HIPPALOPA: ["profil", "aile", "queue"],
  HIPPAL: ["profil", "aile", "queue"],
  ACRSCH: ["tete", "dessus", "croupion"],
  ACROLA: ["tete", "dessus", "croupion"],
  ACRSCI: ["tete", "aile"],
  ACRBAE: ["tete", "aile"],
};

const NOTES = {
  ACRSCI: "Même série qu'ACRBAE. La couleur ne sépare pas. LP et encoche restent sur le bordereau.",
  ACRBAE: "Même série qu'ACRSCI. La couleur ne sépare pas. LP et encoche restent sur le bordereau.",
  ACRSCH: "Jeune souvent à raie sommitale. Croupion uni et roux. Queue seulement si le croupion n'est pas franc.",
  ACROLA: "Croupion strié, bretelles au manteau. Queue seulement si le croupion n'est pas franc.",
  HIPPAL: "Bec, projection, formule, blanc des rectrices. LP, queue et bec au crâne sur le bordereau.",
  HIPPALOPA: "Iduna opaca. Même vues que HIPPAL.",
  HIPPALREI: "Même vues que HIPPAL.",
  HIPPOL: "Polyglotte évidente: pas de photo.",
  SYLCAN: "Seulement si le taxon fin est noté, ou en doute avec SYLCON.",
  SYLCON: "Seulement en doute avec une passerinette.",
  MOTFLA: "Sans sous-espèce notée: pas de photo.",
  LAN: "Seulement si doute. Un senator net ou un élégant net: pas de photo.",
  MOTSSP: "Sous-espèce notée: tête de profil, puis face.",
};

const CONSEIL_PREFIX = [
  { prefix: "SYLCAN", vues: ["queue", "tete"], note: NOTES.SYLCAN },
  { prefix: "SYLCON", vues: ["queue", "tete"], note: NOTES.SYLCON },
  { prefix: "LAITOR", vues: ["aile", "queue", "tete"], note: NOTES.LAN },
  { prefix: "LANISA", vues: ["aile", "queue", "tete"], note: NOTES.LAN },
  { prefix: "LANMER", vues: ["aile", "queue", "tete"], note: NOTES.LAN },
  { prefix: "LANNUB", vues: ["aile", "queue", "tete"], note: NOTES.LAN },
  { prefix: "LANRIO", vues: ["aile", "queue", "tete"], note: NOTES.LAN },
  { prefix: "LANSEN", vues: ["aile", "queue", "tete"], note: NOTES.LAN },
  { prefix: "LANMIN", vues: ["aile", "queue", "tete"], note: NOTES.LAN },
];

const REQUIS_KEYS = Object.keys(REQUIS).sort((a, b) => b.length - a.length);

export function cleanBague(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export function incrementBague(value, delta) {
  const s = cleanBague(value);
  const m = s.match(/^(.*?)(\d+)$/);
  if (!m) return s;
  const width = m[2].length;
  const next = Number(m[2]) + delta;
  if (!Number.isSafeInteger(next) || next < 0) return s;
  return m[1] + String(next).padStart(width, "0");
}

export function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function indexEspeces(list) {
  return list.map((e) => ({
    ...e,
    q: normalize([e.c, e.f, e.s, ...(e.a || [])].join(" ")),
  }));
}

function rankEspece(e, q) {
  const c = e.c.toLowerCase();
  const compact = q.replace(/ /g, "");
  const f = normalize(e.f);
  if (c === compact) return 0;
  if (f === q || f.startsWith(q) || f.endsWith(` ${q}`)) return 1;
  if (c.startsWith(compact)) return 2;
  if ((e.a || []).some((alias) => {
    const nom = normalize(alias);
    return nom === q || nom.startsWith(q);
  })) return 3;
  return 4;
}

export function searchEspeces(list, query, limit = 40) {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean);
  const hits = [];
  for (const e of list) {
    if (tokens.every((t) => e.q.includes(t))) hits.push(e);
  }
  hits.sort((a, b) => rankEspece(a, q) - rankEspece(b, q) || a.c.localeCompare(b.c));
  return hits.slice(0, limit);
}

export function protocole(code) {
  const resultat = protocoleVues(code);
  return { ...resultat, cri: niveauCri(code) };
}

function protocoleVues(code) {
  const c = cleanBague(code);
  if (!c) {
    return { niveau: "aucune", vues: [], optionnelles: [], note: "" };
  }
  const requis = REQUIS_KEYS.find((k) => c === k || c.startsWith(k));
  if (requis) {
    const optionnelles = requis === "ACRSCH" || requis === "ACROLA" ? ["queue"] : [];
    return {
      niveau: "requis",
      vues: REQUIS[requis],
      optionnelles,
      note: NOTES[requis] || "",
    };
  }
  if (c === "MOTFLA") {
    return { niveau: "aucune", vues: [], optionnelles: [], note: NOTES.MOTFLA };
  }
  if (c === "HIPPOL") {
    return { niveau: "aucune", vues: [], optionnelles: [], note: NOTES.HIPPOL };
  }
  if (c.startsWith("MOTFLA")) {
    return { niveau: "conseil", vues: ["tete", "face"], optionnelles: [], note: NOTES.MOTSSP };
  }
  const conseil = CONSEIL_PREFIX
    .slice()
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((item) => c.startsWith(item.prefix));
  if (conseil) {
    return { niveau: "conseil", vues: conseil.vues, optionnelles: [], note: conseil.note };
  }
  return { niveau: "aucune", vues: [], optionnelles: [], note: "" };
}

const CRI_CONSEIL = ["PHYLUS", "PHYBON", "PHYORI", "PHYSIB", "PHYHUM", "PHYINO", "PHYFUS", "PHYDES", "PHYSCH", "PHYBOR"];

export function niveauCri(code) {
  const c = cleanBague(code);
  if (!c) return "non";
  if (c.startsWith("PHYCOL") || c.startsWith("MOTFLA")) return "requis";
  if (CRI_CONSEIL.some((prefix) => c === prefix || c.startsWith(prefix))) return "conseil";
  return "non";
}

export function noteCri(code) {
  const c = cleanBague(code);
  if (c.startsWith("PHYCOL")) {
    return "Cri au relâché. Montant : collybita ou abietinus. Plat et sifflé : tristis. Descendant : ibérique.";
  }
  if (c.startsWith("MOTFLA")) {
    return "Cri au relâché. feldegg est plus rauque. La bague et le code sont écrits dans le fichier.";
  }
  if (c.startsWith("PHYLUS")) return "Cri au relâché si le doute reste avec un véloce.";
  if (c.startsWith("PHYHUM") || c.startsWith("PHYINO")) {
    return "Cri au relâché : il sépare Hume et à grands sourcils.";
  }
  if (niveauCri(c) === "conseil") return "Cri au relâché si le cri lève un doute.";
  return "";
}

export function criManquant(code, aUnCri) {
  return niveauCri(code) === "requis" && !aUnCri;
}

export function etatApresSaisie(mode, serie, valeur) {
  const bague = cleanBague(valeur);
  if (mode === "controle") return { mode: "controle", serie: cleanBague(serie), bague };
  return { mode: "serie", serie: bague, bague };
}

export function etatControle(serie, code) {
  return { mode: "controle", serie: cleanBague(serie), bague: "", codeSerie: code || "" };
}

export function etatRetourSerie(serie, codeSerie) {
  const bague = cleanBague(serie);
  return { mode: "serie", serie: bague, bague, code: codeSerie || "" };
}

// Une fiche déjà écrite impose son espèce, même vide. Sans fiche, l'espèce de la série reste.
export function codeApresOuverture(codeSession, record) {
  if (!record) return codeSession || "";
  return record.code || "";
}

export function extensionCri(mime) {
  const m = String(mime || "").toLowerCase();
  if (m.includes("mp4") || m.includes("aac") || m.includes("m4a")) return "m4a";
  return "webm";
}

export function marqueVue(vue) {
  if (vue === "aile") return "AILE_DROITE";
  return String(vue || "").trim().toUpperCase();
}

export function etiquette(bague, code, marque) {
  const vue = String(marque || "").trim();
  return [cleanBague(bague), cleanBague(code), vue].filter(Boolean).join(" ").slice(0, 200);
}

export function vuesManquantes(code, prises) {
  const p = protocole(code);
  if (p.niveau !== "requis") return [];
  const done = new Set(prises || []);
  return p.vues.filter((id) => !done.has(id));
}

function toU8(buffer) {
  return new Uint8Array(buffer);
}

export function tagJpeg(buffer, comment) {
  const bytes = toU8(buffer);
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  let rest = bytes.subarray(2);
  if (rest.length >= 4 && rest[0] === 0xff && rest[1] === 0xfe) {
    const comLen = (rest[2] << 8) | rest[3];
    if (comLen >= 2 && 2 + comLen <= rest.length) rest = rest.subarray(2 + comLen);
  }
  const text = new TextEncoder().encode(String(comment || "").slice(0, 200));
  const len = text.length + 2;
  const out = new Uint8Array(6 + text.length + rest.length);
  out[0] = 0xff;
  out[1] = 0xd8;
  out[2] = 0xff;
  out[3] = 0xfe;
  out[4] = (len >> 8) & 255;
  out[5] = len & 255;
  out.set(text, 6);
  out.set(rest, 6 + text.length);
  return out;
}

export function lireEtiquetteJpeg(buffer) {
  const bytes = toU8(buffer);
  if (bytes.length < 6 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return "";
  if (bytes[2] !== 0xff || bytes[3] !== 0xfe) return "";
  const len = (bytes[4] << 8) | bytes[5];
  if (len < 2 || 4 + len > bytes.length) return "";
  return new TextDecoder().decode(bytes.subarray(6, 4 + len));
}

const ID_SEGMENT = Uint8Array.of(0x18, 0x53, 0x80, 0x67);
const ID_TAGS = Uint8Array.of(0x12, 0x54, 0xc3, 0x67);
const ID_TAG = Uint8Array.of(0x73, 0x73);
const ID_SIMPLETAG = Uint8Array.of(0x67, 0xc8);
const ID_TAGNAME = Uint8Array.of(0x45, 0xa3);
const ID_TAGSTRING = Uint8Array.of(0x44, 0x87);
const ID_TARGETS = Uint8Array.of(0x63, 0xc0);
const ID_CLUSTER = Uint8Array.of(0x1f, 0x43, 0xb6, 0x75);
const ID_VOID = Uint8Array.of(0xec);
const ID_SEEKHEAD = Uint8Array.of(0x11, 0x4d, 0x9b, 0x74);
const ID_SEEK = Uint8Array.of(0x4d, 0xbb);
const ID_SEEKPOS = Uint8Array.of(0x53, 0xac);
const ID_CUES = Uint8Array.of(0x1c, 0x53, 0xbb, 0x6b);
const ID_CUEPOINT = Uint8Array.of(0xbb);
const ID_CUETRACKPOS = Uint8Array.of(0xb7);
const ID_CUECLUSTER = Uint8Array.of(0xf1);
const MP4_UUID = Uint8Array.of(
  0xb5, 0xa6, 0xe3, 0xc1, 0x7d, 0x24, 0x4e, 0x1a,
  0x9c, 0x83, 0x0f, 0x6d, 0x2a, 0x91, 0xc4, 0xe8,
);

function idEq(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function vintWidth(first) {
  let marker = 0x80;
  for (let width = 1; width <= 8; width++) {
    if (first & marker) return width;
    marker >>= 1;
  }
  return 0;
}

function maxVint(width) {
  const bits = 7 * width;
  return bits >= 31 ? Number.MAX_SAFE_INTEGER : 2 ** bits - 2;
}

function readVint(data, pos) {
  if (pos >= data.length) return null;
  const width = vintWidth(data[pos]);
  if (!width || pos + width > data.length) return null;
  let value = 0;
  let unknown = true;
  if (width === 8) {
    for (let i = 1; i < 8; i++) {
      value = value * 256 + data[pos + i];
      if (data[pos + i] !== 0xff) unknown = false;
    }
  } else {
    const mask = (1 << (8 - width)) - 1;
    value = data[pos] & mask;
    if (value !== mask) unknown = false;
    for (let i = 1; i < width; i++) {
      value = value * 256 + data[pos + i];
      if (data[pos + i] !== 0xff) unknown = false;
    }
  }
  return { width, value, unknown, next: pos + width };
}

function vintSize(n, minWidth = 1) {
  let width = Math.max(1, minWidth);
  while (width < 8 && n > maxVint(width)) width += 1;
  const out = new Uint8Array(width);
  let v = n;
  for (let i = width - 1; i >= 1; i--) {
    out[i] = v & 255;
    v = Math.floor(v / 256);
  }
  if (width === 8) out[0] = 0x01;
  else {
    const marker = 1 << (8 - width);
    out[0] = marker | (v & (marker - 1));
  }
  return out;
}

function ebmlEl(id, payload) {
  const body = typeof payload === "string" ? new TextEncoder().encode(payload) : payload;
  return concatBytes([id, vintSize(body.length), body]);
}

function readId(data, pos) {
  const size = readVint(data, pos);
  if (!size) return null;
  return { bytes: data.subarray(pos, size.next), next: size.next };
}

function niveau1(data, start, end) {
  const liste = [];
  let pos = start;
  while (pos + 2 <= end) {
    const id = readId(data, pos);
    if (!id) return { liste, complet: false };
    const size = readVint(data, id.next);
    if (!size) return { liste, complet: false };
    if (size.unknown) {
      liste.push({ id: id.bytes, start: pos, contentStart: size.next, contentEnd: end, unknown: true });
      return { liste, complet: true };
    }
    const contentEnd = size.next + size.value;
    if (contentEnd < size.next || contentEnd > end) return { liste, complet: false };
    liste.push({ id: id.bytes, start: pos, contentStart: size.next, contentEnd, unknown: false });
    pos = contentEnd;
  }
  return { liste, complet: true };
}

function texteElement(data, start, end, idVoulu) {
  const parcours = niveau1(data, start, end);
  for (const el of parcours.liste) {
    if (idEq(el.id, idVoulu)) return new TextDecoder().decode(data.subarray(el.contentStart, el.contentEnd));
  }
  return "";
}

function blocTags(comment) {
  const simple = (nom) => ebmlEl(ID_SIMPLETAG, concatBytes([
    ebmlEl(ID_TAGNAME, nom),
    ebmlEl(ID_TAGSTRING, comment),
  ]));
  const cible = ebmlEl(ID_TARGETS, new Uint8Array(0));
  return ebmlEl(ID_TAGS, ebmlEl(ID_TAG, concatBytes([cible, simple("TITLE"), simple("COMMENT")])));
}

function detailTags(data, el) {
  const noms = [];
  let comment = "";
  for (const tag of niveau1(data, el.contentStart, el.contentEnd).liste) {
    if (!idEq(tag.id, ID_TAG)) continue;
    for (const simple of niveau1(data, tag.contentStart, tag.contentEnd).liste) {
      if (!idEq(simple.id, ID_SIMPLETAG)) continue;
      const nom = texteElement(data, simple.contentStart, simple.contentEnd, ID_TAGNAME);
      const valeur = texteElement(data, simple.contentStart, simple.contentEnd, ID_TAGSTRING);
      if (nom) noms.push(nom);
      if (nom === "COMMENT" && valeur) comment = valeur;
    }
  }
  const notre = noms.length > 0 && noms.every((nom) => nom === "TITLE" || nom === "COMMENT");
  return { comment, notre };
}

function elementVide(rest) {
  if (rest === 0) return new Uint8Array(0);
  for (let sizeWidth = 1; sizeWidth <= 8; sizeWidth++) {
    const payloadLen = rest - 1 - sizeWidth;
    if (payloadLen < 0) continue;
    const size = vintSize(payloadLen, sizeWidth);
    if (size.length !== sizeWidth) continue;
    return concatBytes([ID_VOID, size, new Uint8Array(payloadLen)]);
  }
  return null;
}

function poserDansSpan(bytes, debut, fin, tags) {
  const rest = fin - debut - tags.length;
  if (rest < 0 || rest === 1) return null;
  const vide = elementVide(rest);
  if (!vide || vide.length !== rest) return null;
  const out = bytes.slice();
  out.set(tags, debut);
  if (rest) out.set(vide, debut + tags.length);
  return out;
}

function lireUint(data, start, end) {
  let value = 0;
  for (let i = start; i < end; i++) value = value * 256 + data[i];
  return value;
}

function ecrireUint(data, start, end, value) {
  const largeur = end - start;
  let reste = value;
  for (let i = end - 1; i >= start; i--) {
    data[i] = reste & 255;
    reste = Math.floor(reste / 256);
  }
  return reste === 0 && value < 256 ** largeur;
}

function estConteneur(id) {
  return idEq(id, ID_SEEKHEAD) || idEq(id, ID_SEEK) || idEq(id, ID_CUES)
    || idEq(id, ID_CUEPOINT) || idEq(id, ID_CUETRACKPOS) || idEq(id, ID_TAGS) || idEq(id, ID_TAG);
}

function patchPositions(data, start, end, seuil, delta) {
  let pos = start;
  while (pos + 2 <= end) {
    const id = readId(data, pos);
    if (!id) return false;
    const size = readVint(data, id.next);
    if (!size) return false;
    if (size.unknown) return true;
    const contentEnd = size.next + size.value;
    if (contentEnd > end) return false;
    if (idEq(id.bytes, ID_SEEKPOS) || idEq(id.bytes, ID_CUECLUSTER)) {
      const value = lireUint(data, size.next, contentEnd);
      if (value >= seuil && !ecrireUint(data, size.next, contentEnd, value + delta)) return false;
    } else if (estConteneur(id.bytes)) {
      if (!patchPositions(data, size.next, contentEnd, seuil, delta)) return false;
    }
    pos = contentEnd;
  }
  return true;
}

function insererEtDecaler(bytes, segment, insertAt, ancienFin, tags) {
  const ancien = ancienFin - insertAt;
  const delta = tags.length - ancien;
  const seuil = insertAt - segment.contentStart + ancien;
  const out = concatBytes([bytes.subarray(0, insertAt), tags, bytes.subarray(ancienFin)]);
  if (!segment.unknown) {
    const taillePos = segment.start + segment.id.length;
    const largeur = segment.contentStart - taillePos;
    const taille = vintSize(segment.contentEnd - segment.contentStart + delta, largeur);
    if (taille.length !== largeur) return null;
    out.set(taille, taillePos);
  }
  const nouveauFin = (segment.unknown ? bytes.length : segment.contentEnd) + delta;
  if (!patchPositions(out, segment.contentStart, nouveauFin, seuil, delta)) return null;
  return out;
}

function sniffWebm(data) {
  return data.length >= 4 && data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3;
}

function trouverSegment(data) {
  for (const el of niveau1(data, 0, data.length).liste) {
    if (idEq(el.id, ID_SEGMENT)) return el;
  }
  return null;
}

function lireCommentaireWebm(data) {
  const segment = trouverSegment(data);
  if (!segment) return "";
  let trouve = "";
  for (const el of niveau1(data, segment.contentStart, segment.contentEnd).liste) {
    if (!idEq(el.id, ID_TAGS)) continue;
    for (const tag of niveau1(data, el.contentStart, el.contentEnd).liste) {
      if (!idEq(tag.id, ID_TAG)) continue;
      let titre = "";
      for (const simple of niveau1(data, tag.contentStart, tag.contentEnd).liste) {
        if (!idEq(simple.id, ID_SIMPLETAG)) continue;
        const nom = texteElement(data, simple.contentStart, simple.contentEnd, ID_TAGNAME);
        const valeur = texteElement(data, simple.contentStart, simple.contentEnd, ID_TAGSTRING);
        if (nom === "COMMENT" && valeur) trouve = valeur;
        if (nom === "TITLE" && valeur && !titre) titre = valeur;
      }
      if (!trouve && titre) trouve = titre;
    }
  }
  return trouve;
}

// Le commentaire est écrit avant le premier cluster, pour que les lecteurs le voient.
function tagWebm(bytes, comment) {
  if (!sniffWebm(bytes)) return bytes;
  const segment = trouverSegment(bytes);
  if (!segment) return bytes;
  const enfants = niveau1(bytes, segment.contentStart, segment.contentEnd);
  if (!enfants.complet) return bytes;
  const tags = blocTags(comment);
  let cluster = null;
  for (const el of enfants.liste) {
    if (el.unknown || idEq(el.id, ID_CLUSTER)) {
      cluster = el;
      break;
    }
  }
  const avant = (el) => !cluster || el.start < cluster.start;
  for (const el of enfants.liste) {
    if (avant(el) && idEq(el.id, ID_TAGS) && detailTags(bytes, el).comment === comment) return bytes;
  }
  const notre = enfants.liste.find((el) => avant(el) && idEq(el.id, ID_TAGS) && detailTags(bytes, el).notre);
  if (notre) {
    const suivant = enfants.liste.find((el) => el.start === notre.contentEnd);
    const fin = suivant && idEq(suivant.id, ID_VOID) ? suivant.contentEnd : notre.contentEnd;
    const pose = poserDansSpan(bytes, notre.start, fin, tags);
    if (pose) return pose;
    const bloque = enfants.liste.some((el) => cluster && el.start >= fin && el.start < cluster.start);
    if (bloque) {
      const largeur = fin - notre.start;
      const efface = elementVide(largeur);
      if (efface && efface.length === largeur) {
        const sans = new Uint8Array(bytes);
        sans.set(efface, notre.start);
        return insererEtDecaler(sans, segment, cluster.start, cluster.start, tags) || bytes;
      }
    }
    return insererEtDecaler(bytes, segment, notre.start, fin, tags) || bytes;
  }
  const trou = [...enfants.liste].reverse().find((el) => avant(el) && idEq(el.id, ID_VOID)
    && el.contentEnd - el.start >= tags.length
    && el.contentEnd - el.start - tags.length !== 1);
  if (trou) {
    const pose = poserDansSpan(bytes, trou.start, trou.contentEnd, tags);
    if (pose) return pose;
  }
  const insertAt = cluster ? cluster.start : segment.contentEnd;
  return insererEtDecaler(bytes, segment, insertAt, insertAt, tags) || bytes;
}

function readU32(data, pos) {
  return data[pos] * 16777216 + (data[pos + 1] << 16) + (data[pos + 2] << 8) + data[pos + 3];
}

function u32be(n) {
  return Uint8Array.of((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
}

function sniffMp4(data) {
  return data.length >= 12
    && data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70;
}

function boites(data, start, end) {
  const liste = [];
  let pos = start;
  while (pos + 8 <= end) {
    let size = readU32(data, pos);
    const type = String.fromCharCode(data[pos + 4], data[pos + 5], data[pos + 6], data[pos + 7]);
    let header = 8;
    if (size === 1) {
      if (pos + 16 > end) return { liste, complet: false };
      const hi = readU32(data, pos + 8);
      const lo = readU32(data, pos + 12);
      if (hi !== 0) return { liste, complet: false };
      size = lo;
      header = 16;
    } else if (size === 0) size = end - pos;
    if (size < header || pos + size > end) return { liste, complet: false };
    liste.push({ start: pos, size, type, contentStart: pos + header, contentEnd: pos + size });
    pos += size;
  }
  return { liste, complet: pos === end };
}

function estUuidANous(data, box) {
  if (box.type !== "uuid" || box.contentEnd - box.contentStart < MP4_UUID.length) return false;
  for (let i = 0; i < MP4_UUID.length; i++) {
    if (data[box.contentStart + i] !== MP4_UUID[i]) return false;
  }
  return true;
}

function tagMp4(bytes, comment) {
  if (!sniffMp4(bytes)) return bytes;
  const parcours = boites(bytes, 0, bytes.length);
  if (!parcours.complet || !parcours.liste.length) return bytes;
  const dernier = parcours.liste[parcours.liste.length - 1];
  const fin = estUuidANous(bytes, dernier) ? dernier.start : bytes.length;
  const charge = concatBytes([MP4_UUID, new TextEncoder().encode(comment)]);
  const boite = concatBytes([u32be(8 + charge.length), new TextEncoder().encode("uuid"), charge]);
  return concatBytes([bytes.subarray(0, fin), boite]);
}

function lireCommentaireMp4(data) {
  if (!sniffMp4(data)) return "";
  let trouve = "";
  for (const box of boites(data, 0, data.length).liste) {
    if (!estUuidANous(data, box)) continue;
    trouve = new TextDecoder().decode(data.subarray(box.contentStart + MP4_UUID.length, box.contentEnd));
  }
  return trouve;
}

export function tagAudio(buffer, mime, comment) {
  const bytes = toU8(buffer);
  const text = String(comment || "").slice(0, 200);
  if (!text) return bytes;
  const indice = String(mime || "").toLowerCase();
  if (sniffWebm(bytes) && !indice.includes("mp4")) return tagWebm(bytes, text);
  if (sniffMp4(bytes)) return tagMp4(bytes, text);
  if (sniffWebm(bytes)) return tagWebm(bytes, text);
  return bytes;
}

export function lireEtiquetteAudio(buffer) {
  const bytes = toU8(buffer);
  if (sniffWebm(bytes)) return lireCommentaireWebm(bytes);
  if (sniffMp4(bytes)) return lireCommentaireMp4(bytes);
  return "";
}

export function crc32(data) {
  let c = -1;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function u16(n) {
  return new Uint8Array([n & 255, (n >> 8) & 255]);
}

function u32(n) {
  return new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]);
}

function dosStamp(date) {
  const d = date instanceof Date ? date : new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const day = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return [time, day];
}

export function buildZip(files, date) {
  const [time, day] = dosStamp(date);
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(time),
      u16(day),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    const central = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(time),
      u16(day),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    offset += local.length;
    locals.push(local);
    centrals.push(central);
  }
  const centralBytes = concatBytes(centrals);
  const end = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralBytes.length),
    u32(offset),
    u16(0),
  ]);
  return concatBytes([...locals, centralBytes, end]);
}

function concatBytes(parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function zoomArchive(zoom) {
  return zoom == null ? "non lu" : zoom;
}

export function ligneArchive(oiseau, extra, libelle) {
  const code = oiseau?.code || "";
  const nom = code ? (libelle?.nom || oiseau?.nom || "") : "";
  const latin = code ? (libelle?.latin || oiseau?.latin || "") : "";
  return {
    bague: oiseau?.bague || "",
    code,
    nom,
    latin,
    controle: oiseau?.controle ? "oui" : "",
    vue: "",
    fichier: "",
    largeur: "",
    hauteur: "",
    zoom: "",
    prise: "",
    duree_s: "",
    ...extra,
  };
}

export function csvIndex(rows) {
  const header = ["bague", "code", "nom", "latin", "controle", "vue", "fichier", "largeur", "hauteur", "zoom", "prise", "duree_s"];
  const lines = [header.join(";")];
  for (const row of rows) {
    lines.push(header.map((key) => csvField(row[key])).join(";"));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

function csvField(value) {
  const text = String(value ?? "");
  if (/[;"\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function target43(caps) {
  if (!caps || !caps.imageWidth || !caps.imageHeight) return null;
  const wR = caps.imageWidth;
  const hR = caps.imageHeight;
  let w = wR.max;
  let h = Math.round(w * 3 / 4);
  if (h > hR.max) {
    h = hR.max;
    w = Math.round(h * 4 / 3);
  }
  if (w > wR.max) w = wR.max;
  return { imageWidth: snapRange(w, wR), imageHeight: snapRange(h, hR) };
}

function snapRange(value, range) {
  const step = range.step || 1;
  let v = Math.min(range.max, Math.max(range.min, value));
  v = range.min + Math.round((v - range.min) / step) * step;
  if (v > range.max) v = range.max;
  if (v < range.min) v = range.min;
  return v;
}

export function photoAcceptable(width, height) {
  if (!width || !height) return { ok: false, raison: "Photo illisible." };
  if (height > width) return { ok: false, raison: "Photo verticale refusée. Téléphone à l'horizontale." };
  const ratio = width / height;
  if (Math.abs(ratio - 4 / 3) > 0.06) {
    return { ok: false, raison: "Pas au format 4:3. Photo non gardée." };
  }
  if (width < 1000) return { ok: false, raison: "Photo trop petite. Réessaie." };
  return { ok: true, raison: width < 2400 ? "Largeur sous 2400 px. Vérifie à la maison que ce n'est pas la vidéo." : "" };
}
