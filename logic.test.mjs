import assert from "node:assert/strict";
import {
  buildZip,
  cleanBague,
  crc32,
  criManquant,
  csvIndex,
  etiquette,
  etatApresSaisie,
  etatControle,
  etatRetourSerie,
  extensionCri,
  incrementBague,
  indexEspeces,
  lireEtiquetteAudio,
  lireEtiquetteJpeg,
  marqueVue,
  photoAcceptable,
  protocole,
  searchEspeces,
  tagAudio,
  tagJpeg,
  target43,
  vuesManquantes,
} from "./logic.js";

assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
assert.equal(cleanBague(" ga-12 3 "), "GA123");
assert.equal(incrementBague("GA000123", 1), "GA000124");
assert.equal(incrementBague("GA41207", 10), "GA41217");
assert.equal(incrementBague("GA41207", 20), "GA41227");
assert.equal(incrementBague("GA000000", -1), "GA000000");
assert.equal(incrementBague("AB", 1), "AB");
assert.deepEqual(etatControle("ga41227", "PHYCOL"), { mode: "controle", serie: "GA41227", bague: "", codeSerie: "PHYCOL" });
assert.deepEqual(etatApresSaisie("controle", "GA41227", "v 44.55 66"), { mode: "controle", serie: "GA41227", bague: "V445566" });
assert.deepEqual(etatRetourSerie("GA41227", "PHYCOL"), { mode: "serie", serie: "GA41227", bague: "GA41227", code: "PHYCOL" });
assert.equal(protocole("PHYCOL").cri, "requis");
assert.equal(protocole("PHYCOLTRI").cri, "requis");
assert.equal(protocole("PHYCOLIBE").cri, "requis");
assert.equal(protocole("MOTFLA").cri, "requis");
assert.equal(protocole("MOTFLA").niveau, "aucune");
assert.equal(protocole("MOTFLAIAE").cri, "requis");
assert.equal(protocole("PHYBON").cri, "conseil");
assert.equal(protocole("PHYLUSACR").cri, "conseil");
assert.equal(protocole("PHYSTR").cri, "non");
assert.equal(protocole("ACRSCI").cri, "non");
assert.equal(criManquant("PHYCOL", false), true);
assert.equal(criManquant("PHYCOL", true), false);
assert.equal(criManquant("ACRSCI", false), false);
assert.equal(extensionCri("audio/webm;codecs=opus"), "webm");
assert.equal(extensionCri("audio/mp4"), "m4a");

const jpeg = new Uint8Array([0xff, 0xd8, 0x11, 0x22, 0xff, 0xd9]);
const tagged = tagJpeg(jpeg, "GA1 AILE_DROITE");
assert.equal(tagged[0], 0xff);
assert.equal(tagged[1], 0xd8);
assert.equal(tagged[2], 0xff);
assert.equal(tagged[3], 0xfe);
assert.equal(tagged.at(-2), 0xff);
assert.equal(tagged.at(-1), 0xd9);
const comment = new TextDecoder().decode(tagged.slice(6, 6 + "GA1 AILE_DROITE".length));
assert.equal(comment, "GA1 AILE_DROITE");
assert.equal(tagged[6 + "GA1 AILE_DROITE".length], 0x11);
assert.equal(etiquette("ga50001", "phycol", marqueVue("tete")), "GA50001 PHYCOL TETE");
assert.equal(etiquette("GA50001", "", marqueVue("aile")), "GA50001 AILE_DROITE");
assert.equal(etiquette("GA50001", "PHYCOL", ""), "GA50001 PHYCOL");
const photo = tagJpeg(jpeg, etiquette("GA50001", "PHYCOL", marqueVue("tete")));
assert.equal(lireEtiquetteJpeg(photo), "GA50001 PHYCOL TETE");
const photo2 = tagJpeg(photo, etiquette("GA50001", "ACRSCI", marqueVue("aile")));
assert.equal(lireEtiquetteJpeg(photo2), "GA50001 ACRSCI AILE_DROITE");
let com = 0;
for (let i = 0; i < photo2.length - 1; i++) if (photo2[i] === 0xff && photo2[i + 1] === 0xfe) com += 1;
assert.equal(com, 1);

function vintFixe(n) {
  return Uint8Array.of(0x40 | ((n >> 8) & 0x3f), n & 0xff);
}
function el(id, payload) {
  const body = typeof payload === "string" ? new TextEncoder().encode(payload) : payload;
  const size = body.length < 0x7f ? Uint8Array.of(0x80 | body.length) : vintFixe(body.length);
  const out = new Uint8Array(id.length + size.length + body.length);
  out.set(id, 0);
  out.set(size, id.length);
  out.set(body, id.length + size.length);
  return out;
}
function coller(...parts) {
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
function trouver(buf, seq) {
  outer: for (let i = 0; i <= buf.length - seq.length; i++) {
    for (let j = 0; j < seq.length; j++) if (buf[i + j] !== seq[j]) continue outer;
    return i;
  }
  return -1;
}
const clusterBody = Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9);
const cluster = el(Uint8Array.of(0x1f, 0x43, 0xb6, 0x75), clusterBody);
const ebml = el(Uint8Array.of(0x1a, 0x45, 0xdf, 0xa3), el(Uint8Array.of(0x42, 0x82), "webm"));
const segmentId = Uint8Array.of(0x18, 0x53, 0x80, 0x67);
const inconnu = Uint8Array.of(0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
const webm = coller(ebml, segmentId, inconnu, cluster);
const son = tagAudio(webm, "audio/webm;codecs=opus", "GA1 PHYCOL");
assert.equal(lireEtiquetteAudio(son), "GA1 PHYCOL");
assert.equal(trouver(son, clusterBody) > trouver(webm, clusterBody), true);
const son2 = tagAudio(son, "audio/webm", "GA1 PHYCOL");
assert.equal(son2.length, son.length);
const son3 = tagAudio(son, "audio/webm", "GA50001 ACRSCH");
assert.equal(lireEtiquetteAudio(son3), "GA50001 ACRSCH");
assert.equal(son3.length - son.length, ("GA50001 ACRSCH".length - "GA1 PHYCOL".length) * 2);
const connu = coller(ebml, segmentId, vintFixe(cluster.length), cluster);
const sonConnu = tagAudio(connu, "audio/webm", "V445566 MOTFLA");
assert.equal(lireEtiquetteAudio(sonConnu), "V445566 MOTFLA");
assert.equal(trouver(sonConnu, clusterBody) > 0, true);
const mp4Body = Uint8Array.of(9, 8, 7, 6, 5);
const mp4 = coller(elBox("ftyp", new TextEncoder().encode("isom")), elBox("mdat", mp4Body));
function elBox(type, payload) {
  const out = new Uint8Array(8 + payload.length);
  const size = out.length;
  out[0] = (size >>> 24) & 255;
  out[1] = (size >>> 16) & 255;
  out[2] = (size >>> 8) & 255;
  out[3] = size & 255;
  out.set(new TextEncoder().encode(type), 4);
  out.set(payload, 8);
  return out;
}
const m4a = tagAudio(mp4, "audio/mp4", "GA50001 PHYCOL");
assert.equal(lireEtiquetteAudio(m4a), "GA50001 PHYCOL");
assert.equal(trouver(m4a, mp4Body), trouver(mp4, mp4Body));
const m4a2 = tagAudio(m4a, "audio/mp4", "GA50001 MOTFLAIAE");
assert.equal(lireEtiquetteAudio(m4a2), "GA50001 MOTFLAIAE");
assert.equal(trouver(m4a2, mp4Body), trouver(mp4, mp4Body));
assert.equal(tagAudio(Uint8Array.of(1, 2, 3, 4), "audio/webm", "GA1").length, 4);

assert.deepEqual(protocole("ACRSCH").vues, ["tete", "dessus", "croupion"]);
assert.deepEqual(protocole("ACROLA").optionnelles, ["queue"]);
assert.deepEqual(protocole("HIPPALOPA").vues, ["profil", "aile", "queue"]);
assert.equal(protocole("HIPPALOPA").note.includes("opaca"), true);
assert.equal(protocole("HIPPOL").niveau, "aucune");
assert.equal(protocole("MOTFLA").niveau, "aucune");
assert.deepEqual(protocole("MOTFLAIAE").vues, ["tete", "face"]);
assert.equal(protocole("LANSEN").niveau, "conseil");
assert.deepEqual(protocole("SYLCANMOL").vues, ["queue", "tete"]);
assert.deepEqual(vuesManquantes("ACRSCI", ["tete"]), ["aile"]);
assert.deepEqual(vuesManquantes("LANSEN", []), []);

const list = indexEspeces([
  { c: "HIPPALOPA", s: "Hippolais pallida opaca", f: "Hypolaïs obscure", a: ["Iduna opaca"] },
  { c: "MOTFLAIAE", s: "Motacilla flava iberiae", f: "Bergeronnette ibérique", a: ["iberiae"] },
  { c: "SYLCAN", s: "Sylvia cantillans", f: "Fauvette passerinette", a: ["Curruca iberiae"] },
  { c: "ACRSCI", s: "Acrocephalus scirpaceus", f: "Rousserolle effarvatte" },
]);
assert.equal(searchEspeces(list, "opaca")[0].c, "HIPPALOPA");
assert.equal(searchEspeces(list, "iberiae")[0].c, "MOTFLAIAE");
assert.equal(searchEspeces(list, "curruca")[0].c, "SYLCAN");
assert.equal(searchEspeces(list, "effarvatte")[0].c, "ACRSCI");
list.push({ c: "SCISCH", s: "A. scirpaceus x a. schoenobaenus", f: "Hybride R. effarvatte x P. des joncs", q: "" });
list[list.length - 1].q = "scisch hybride r effarvatte x p des joncs a scirpaceus x a schoenobaenus";
assert.equal(searchEspeces(list, "effarvatte")[0].c, "ACRSCI");

assert.deepEqual(target43({
  imageWidth: { min: 320, max: 4000, step: 1 },
  imageHeight: { min: 240, max: 3000, step: 1 },
}), { imageWidth: 4000, imageHeight: 3000 });

assert.equal(photoAcceptable(4000, 3000).ok, true);
assert.equal(photoAcceptable(3000, 4000).ok, false);
assert.equal(photoAcceptable(1920, 1080).ok, false);
assert.equal(photoAcceptable(1920, 1440).raison.includes("2400"), true);

const csv = csvIndex([
  {
    bague: "GA1", code: "ACRSCH", nom: "Phragmite des joncs", controle: "", vue: "tete",
    fichier: "GA1/tete.jpg", largeur: 4000, hauteur: 3000, zoom: 1, prise: "2026-11-08T07:00:00",
  },
  {
    bague: "V445566", code: "PHYCOL", nom: "Pouillot véloce", controle: "oui", vue: "cri",
    fichier: "V445566/cri.webm", duree_s: 4, prise: "2026-11-08T07:05:00",
  },
]);
assert.equal(csv.includes("controle"), true);
assert.equal(csv.includes("V445566/cri.webm"), true);
const zip = buildZip([
  { name: "GA1/tete.jpg", data: tagged },
  { name: "index.csv", data: new TextEncoder().encode(csv) },
], new Date(2026, 10, 8, 7, 0, 0));
assert.ok(zip.byteLength > 32);
console.log("ok");
