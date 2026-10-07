import {
  buildZip,
  cleanBague,
  codeApresOuverture,
  criManquant,
  csvIndex,
  etatApresSaisie,
  etatControle,
  etatRetourSerie,
  etiquette,
  extensionCri,
  incrementBague,
  indexEspeces,
  ligneArchive,
  marqueVue,
  noteCri,
  photoAcceptable,
  protocole,
  searchEspeces,
  tagAudio,
  tagJpeg,
  target43,
  VUES,
  vuesManquantes,
  zoomArchive,
} from "./logic.js";

const $ = (id) => document.getElementById(id);

const state = {
  list: [],
  byCode: new Map(),
  bague: "",
  code: "",
  mode: "serie",
  serie: "",
  codeSerie: "",
  libres: false,
  criEtat: "repos",
  criDebut: 0,
  criUrl: "",
  criCle: "",
  oiseaux: new Map(),
  cam: null,
  attente: null,
  vueEnCours: "",
  apercuUrl: "",
};

const BAGUE_KEY = "bagues-bague";
const CODE_KEY = "bagues-code";
const MODE_KEY = "bagues-mode";
const SERIE_KEY = "bagues-serie";
const CODE_SERIE_KEY = "bagues-code-serie";
const CRI_MAX_MS = 30000;

function dire(texte) {
  $("msg").textContent = texte || "";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function ouvrirBase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("bagues", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("oiseaux", { keyPath: "bague" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function lireTous(base) {
  return new Promise((resolve, reject) => {
    const req = base.transaction("oiseaux").objectStore("oiseaux").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function ecrire(base, record) {
  return new Promise((resolve, reject) => {
    const tx = base.transaction("oiseaux", "readwrite");
    tx.objectStore("oiseaux").put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function supprimer(base, bague) {
  return new Promise((resolve, reject) => {
    const tx = base.transaction("oiseaux", "readwrite");
    tx.objectStore("oiseaux").delete(bague);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function vider(base) {
  return new Promise((resolve, reject) => {
    const tx = base.transaction("oiseaux", "readwrite");
    tx.objectStore("oiseaux").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function decompteFiches() {
  const oiseaux = [...state.oiseaux.values()];
  let photos = 0;
  let audios = 0;
  for (const oiseau of oiseaux) {
    photos += Object.keys(oiseau.vues || {}).length;
    if (oiseau.cri?.blob) audios += 1;
  }
  const morceaux = [`${oiseaux.length} ${oiseaux.length > 1 ? "bagues" : "bague"}`];
  if (photos) morceaux.push(`${photos} ${photos > 1 ? "photos" : "photo"}`);
  if (audios) morceaux.push(`${audios} ${audios > 1 ? "audios" : "audio"}`);
  return morceaux.join(", ");
}

function calerDanger(panneau) {
  const vv = window.visualViewport;
  const sonde = document.createElement("div");
  sonde.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;margin:0;padding:0;pointer-events:none;";
  document.body.appendChild(sonde);
  const rect = sonde.getBoundingClientRect();
  sonde.remove();
  panneau.style.setProperty("--danger-haut", `${Math.max(0, -rect.top)}px`);
  panneau.style.setProperty("--danger-gauche", `${Math.max(0, -rect.left)}px`);
  panneau.style.setProperty("--danger-largeur", `${vv ? vv.width : window.innerWidth}px`);
  panneau.style.setProperty("--danger-hauteur", `${vv ? vv.height : window.innerHeight}px`);
}

function lacherDanger(panneau) {
  for (const nom of ["--danger-haut", "--danger-gauche", "--danger-largeur", "--danger-hauteur"]) {
    panneau.style.removeProperty(nom);
  }
}

function demanderEffacementTotal() {
  const panneau = $("danger");
  if (!panneau.hidden) return Promise.resolve(false);
  const detail = decompteFiches();
  const verbe = state.oiseaux.size > 1 || detail.includes(",") ? "vont quitter" : "va quitter";
  return new Promise((resolve) => {
    const oui = $("danger-oui");
    const non = $("danger-non");
    const vv = window.visualViewport;
    const suivre = () => calerDanger(panneau);
    let etape = 1;
    const fermer = (ok) => {
      panneau.hidden = true;
      lacherDanger(panneau);
      window.removeEventListener("scroll", suivre, true);
      window.removeEventListener("resize", suivre);
      if (vv) {
        vv.removeEventListener("resize", suivre);
        vv.removeEventListener("scroll", suivre);
      }
      oui.removeEventListener("click", surOui);
      non.removeEventListener("click", surNon);
      resolve(ok);
    };
    const montrer = () => {
      if (etape === 1) {
        $("danger-titre").textContent = "Effacer ces fiches ?";
        $("danger-detail").textContent = `${detail} ${verbe} le téléphone.`;
        oui.textContent = "Effacer";
        panneau.dataset.place = "haut";
      } else {
        $("danger-titre").textContent = "Effacement définitif";
        $("danger-detail").textContent = "Les photos et les audios partent du téléphone. Un ZIP déjà téléchargé reste.";
        oui.textContent = "Effacer définitivement";
        panneau.dataset.place = "bas";
      }
      panneau.hidden = false;
      calerDanger(panneau);
      panneau.scrollTop = 0;
      non.focus({ preventScroll: true });
    };
    window.addEventListener("scroll", suivre, true);
    window.addEventListener("resize", suivre);
    if (vv) {
      vv.addEventListener("resize", suivre);
      vv.addEventListener("scroll", suivre);
    }
    const surOui = () => {
      if (etape === 1) {
        etape = 2;
        montrer();
        return;
      }
      fermer(true);
    };
    const surNon = () => fermer(false);
    oui.addEventListener("click", surOui);
    non.addEventListener("click", surNon);
    montrer();
  });
}

function nomDuCode(code) {
  return state.byCode.get(code)?.f || "";
}

function latinDuCode(code) {
  return state.byCode.get(code)?.s || "";
}

function recordCourant() {
  if (!state.bague) return null;
  return state.oiseaux.get(state.bague) || null;
}

function assurerRecord() {
  let record = state.oiseaux.get(state.bague);
  if (!record) {
    record = {
      bague: state.bague,
      code: state.code,
      nom: nomDuCode(state.code),
      latin: latinDuCode(state.code),
      controle: state.mode === "controle",
      vues: {},
    };
    state.oiseaux.set(state.bague, record);
  }
  record.code = state.code;
  record.nom = nomDuCode(state.code);
  record.latin = latinDuCode(state.code);
  record.controle = state.mode === "controle";
  return record;
}

function sauverSession() {
  localStorage.setItem(BAGUE_KEY, state.bague);
  localStorage.setItem(CODE_KEY, state.code);
  localStorage.setItem(MODE_KEY, state.mode);
  localStorage.setItem(SERIE_KEY, state.serie);
  localStorage.setItem(CODE_SERIE_KEY, state.codeSerie);
}

function renderBague() {
  $("bague").value = state.bague;
  const proto = protocole(state.code);
  const rappel = [proto.note, noteCri(state.code)].filter(Boolean).join(" ");
  $("note").textContent = rappel;
  const record = recordCourant();
  const prises = new Set(Object.keys(record?.vues || {}));
  const sansCode = !state.code;
  const sansSerie = !sansCode && proto.vues.length === 0 && !state.libres;
  const controle = state.mode === "controle";
  $("stepper").classList.toggle("controle", controle);
  $("sauts").classList.toggle("controle", controle);
  $("bague").placeholder = controle ? "Numéro étranger" : "";
  $("suivante").textContent = controle ? "Retour à la série" : "Bague suivante";
  $("suivante").classList.toggle("primaire", controle || !!state.bague);
  $("serie-info").textContent = controle
    ? `Contrôle. La série reste ${state.serie || "vide"}.`
    : "";
  const bloque = state.criEtat === "recording";
  for (const id of ["moins", "plus", "moins10", "plus10", "controle", "suivante"]) {
    $(id).disabled = bloque;
  }
  $("libres").hidden = !sansSerie;
  const aDuContenu = !!record && (Object.keys(record.vues || {}).length > 0 || !!record.cri);
  $("effacer-une").hidden = !aDuContenu;
  $("retirer-espece").disabled = bloque;
  renderEspeceFiche();
  renderCri(proto, record);
  if (!state.bague) {
    $("vues").innerHTML = "";
    return;
  }
  const ids = !state.code || state.libres
    ? Object.keys(VUES)
    : [...proto.vues, ...proto.optionnelles];
  for (const id of prises) {
    if (VUES[id] && !ids.includes(id)) ids.push(id);
  }
  if (!ids.length) {
    $("vues").innerHTML = "";
    return;
  }
  const vus = new Set();
  const ordre = ids.filter((id) => (vus.has(id) ? false : vus.add(id)));
  $("vues").innerHTML = ordre.map((id) => {
    const vue = VUES[id];
    const fait = prises.has(id);
    const option = proto.optionnelles.includes(id);
    const classe = `vue${fait ? " fait" : ""}${option ? " option" : ""}`;
    const statut = fait ? "fait" : option ? "si doute" : proto.niveau === "requis" ? "à faire" : "";
    return `<button type="button" class="${classe}" data-vue="${id}">${esc(vue.label)}${statut ? `<br><small>${esc(statut)}</small>` : ""}</button>`;
  }).join("");
}

function detailEspece(e) {
  return `<b>${esc(e.c)}</b> ${esc(e.f || "")}<small class="latin">${esc(e.s || "")}</small>`;
}

function renderEspeceFiche() {
  const espece = state.byCode.get(state.code);
  const choisi = !!state.code;
  $("espece-saisie").hidden = choisi;
  $("espece-recherche").disabled = choisi;
  if (choisi) {
    $("espece-ligne").innerHTML = `<b>${esc(state.code)}</b><span class="nom-espece">${esc(nomDuCode(state.code))}</span><small class="latin">${esc(espece?.s || "")}</small>`;
    $("retirer-espece").hidden = false;
    $("espece-recherche").value = "";
    $("espece-resultats").innerHTML = "";
    return;
  }
  $("espece-ligne").textContent = "";
  $("retirer-espece").hidden = true;
  const q = $("espece-recherche").value;
  const lignes = normalizeQuery(q) ? searchEspeces(state.list, q, 8) : [];
  $("espece-resultats").innerHTML = lignes.map((e) => (
    `<button type="button" class="resultat" data-espece="${esc(e.c)}">${detailEspece(e)}</button>`
  )).join("");
}

function renderCri(proto, record) {
  const demande = proto.cri === "requis" || proto.cri === "conseil";
  const audio = $("cri-audio");
  $("cri").hidden = !state.bague;
  if (state.criEtat === "recording") {
    $("cri").textContent = "Stop";
    $("cri").classList.add("enregistrement");
    $("cri-etat").textContent = "Relâche, puis stop.";
    audio.hidden = true;
    return;
  }
  $("cri").classList.remove("enregistrement");
  if (record?.cri?.blob) {
    $("cri").textContent = "Refaire l'audio";
    if (state.criCle !== `${state.bague}:${record.cri.ts}`) {
      if (state.criUrl) URL.revokeObjectURL(state.criUrl);
      state.criUrl = URL.createObjectURL(record.cri.blob);
      state.criCle = `${state.bague}:${record.cri.ts}`;
      audio.src = state.criUrl;
    }
    audio.hidden = false;
    const secondes = Math.max(1, Math.round((record.cri.duree || 0) / 1000));
    $("cri-etat").textContent = `${secondes} s gardées sur ${state.bague}.`;
    return;
  }
  $("cri").textContent = demande ? "Cri au relâché" : "Ajouter audio";
  audio.hidden = true;
  $("cri-etat").textContent = state.bague && proto.cri === "requis" ? "À prendre au relâché." : "";
}

function renderCode() {
  const q = $("recherche").value;
  const lignes = normalizeQuery(q) ? searchEspeces(state.list, q, 20) : [];
  $("resultats").innerHTML = lignes.map((e) => `<p class="resultat">${detailEspece(e)}</p>`).join("");
}

function normalizeQuery(value) {
  return String(value || "").trim();
}

function renderExport() {
  const oiseaux = [...state.oiseaux.values()].sort((a, b) => a.bague.localeCompare(b.bague));
  let photos = 0;
  let cris = 0;
  let octets = 0;
  let incomplets = 0;
  let crisAbsents = 0;
  for (const oiseau of oiseaux) {
    const vues = Object.values(oiseau.vues || {});
    photos += vues.length;
    for (const vue of vues) octets += vue.blob?.size || 0;
    if (oiseau.cri?.blob) {
      cris += 1;
      octets += oiseau.cri.blob.size || 0;
    }
    if (vuesManquantes(oiseau.code, Object.keys(oiseau.vues || {})).length) incomplets += 1;
    if (criManquant(oiseau.code, !!oiseau.cri?.blob)) crisAbsents += 1;
  }
  const mo = (octets / 1e6).toFixed(0);
  const alertes = [
    incomplets ? `${incomplets} avec une vue requise manquante` : "",
    crisAbsents ? `${crisAbsents} sans le cri` : "",
  ].filter(Boolean).join(", ");
  const morceauxBilan = [
    `${oiseaux.length} ${oiseaux.length > 1 ? "bagues" : "bague"}`,
    `${photos} ${photos > 1 ? "photos" : "photo"}`,
  ];
  if (cris === 1) morceauxBilan.push("1 cri");
  if (cris > 1) morceauxBilan.push(`${cris} cris`);
  morceauxBilan.push(`${mo} Mo`);
  $("bilan").textContent = oiseaux.length
    ? `${morceauxBilan.join(", ")}.${alertes ? ` ${alertes}.` : ""}`
    : "Rien enregistré pour l'instant.";
  $("liste").innerHTML = oiseaux.map((oiseau) => {
    const faites = Object.keys(oiseau.vues || {});
    const manque = vuesManquantes(oiseau.code, faites);
    const morceaux = [];
    if (oiseau.controle) morceaux.push("contrôle");
    if (manque.length) morceaux.push(`<span class="manque">manque ${esc(manque.map((id) => VUES[id].label).join(", "))}</span>`);
    else if (faites.length) morceaux.push(esc(faites.map((id) => VUES[id]?.label || id).join(", ")));
    if (oiseau.cri?.blob) morceaux.push("cri");
    else if (criManquant(oiseau.code, false)) morceaux.push(`<span class="manque">cri manquant</span>`);
    return `<button type="button" class="oiseau" data-ouvrir="${esc(oiseau.bague)}"><b>${esc(oiseau.bague)}</b> ${esc(oiseau.code || "")}<br>${morceaux.join(", ")}</button>`;
  }).join("");
}

function onglet(nom) {
  for (const id of ["bague", "code", "export"]) {
    $(`tab-${id}`).hidden = id !== nom;
    document.querySelector(`[data-tab="${id}"]`).setAttribute("aria-selected", id === nom ? "true" : "false");
  }
  if (nom === "code") renderCode();
  if (nom === "export") renderExport();
  if (nom === "bague") renderBague();
}

function choisirCode(code) {
  if (state.criEtat === "recording") return;
  state.code = code || "";
  state.libres = false;
  localStorage.setItem(CODE_KEY, state.code);
  const existant = state.bague && state.oiseaux.get(state.bague);
  if (existant) {
    existant.code = state.code;
    existant.nom = nomDuCode(state.code);
    existant.latin = latinDuCode(state.code);
    existant.controle = state.mode === "controle";
    if (state.base) ecrire(state.base, existant).catch(() => dire("Code pas enregistré."));
  }
  $("espece-recherche").value = "";
  sauverSession();
  renderBague();
}

function chargerBague(valeur) {
  if (state.criEtat === "recording") return;
  const etat = etatApresSaisie(state.mode, state.serie, valeur);
  state.mode = etat.mode;
  state.serie = etat.serie;
  state.bague = etat.bague;
  state.libres = false;
  const record = state.oiseaux.get(state.bague);
  state.code = codeApresOuverture(state.code, record);
  sauverSession();
  renderBague();
}

function sauter(delta) {
  if (state.mode !== "serie" || state.criEtat === "recording") return;
  const base = $("bague").value || state.bague;
  if (!/\d/.test(cleanBague(base))) {
    dire("Écris d'abord le numéro de la série.");
    return;
  }
  chargerBague(incrementBague(base, delta));
}

function ouvrirControle() {
  if (state.criEtat === "recording" || state.mode === "controle") return;
  const etat = etatControle($("bague").value || state.bague || state.serie, state.code);
  state.mode = etat.mode;
  state.serie = etat.serie;
  state.codeSerie = etat.codeSerie;
  state.bague = "";
  state.code = "";
  state.libres = false;
  sauverSession();
  renderBague();
  dire("");
  $("bague").focus();
}

function retourSerie() {
  if (state.criEtat === "recording") return;
  const etat = etatRetourSerie(state.serie, state.codeSerie);
  state.mode = etat.mode;
  state.serie = etat.serie;
  state.bague = etat.bague;
  state.libres = false;
  const record = state.oiseaux.get(state.bague);
  state.code = codeApresOuverture(etat.code, record);
  sauverSession();
  renderBague();
  dire("");
}

function paysage() {
  return window.matchMedia("(orientation: landscape)").matches;
}

function majOrientation() {
  const horizontal = paysage();
  $("cam-bloque").hidden = horizontal;
  $("declencheur").disabled = !horizontal || !state.cam;
}

async function verrouillerZoom(track) {
  const caps = track.getCapabilities ? track.getCapabilities() : {};
  if (!caps.zoom) return { zoom: null, ok: true };
  try {
    await track.applyConstraints({ advanced: [{ zoom: 1 }] });
  } catch {
    try { await track.applyConstraints({ zoom: 1 }); } catch { /* le réglage peut être refusé */ }
  }
  const zoom = track.getSettings().zoom;
  if (zoom == null) return { zoom: null, ok: true };
  return { zoom, ok: Math.abs(zoom - 1) < 0.02 };
}

async function ouvrirCamera(vueId) {
  const saisi = cleanBague($("bague").value);
  if (saisi && saisi !== state.bague) chargerBague(saisi);
  if (!state.bague) {
    dire("Écris d'abord le numéro de bague.");
    return;
  }
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    dire("Caméra indisponible. Ouvre l'app depuis http://127.0.0.1:8080");
    return;
  }
  if (typeof ImageCapture === "undefined") {
    dire("Ce Chrome n'a pas ImageCapture. Mets-le à jour avant le départ.");
    return;
  }
  await fermerCamera();
  state.vueEnCours = vueId;
  const vue = VUES[vueId];
  $("cam-titre").textContent = `${state.bague}  ${vue.label}`;
  $("cam-hint").textContent = "";
  $("cam").hidden = false;
  $("apercu").hidden = true;
  $("declencheur").hidden = false;
  document.querySelector("nav").hidden = true;
  let stream;
  const videoBase = { facingMode: { exact: "environment" }, aspectRatio: { exact: 4 / 3 } };
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: videoBase });
  } catch {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, aspectRatio: { ideal: 4 / 3 } },
      });
    } catch {
      dire("Caméra refusée. Autorise l'appareil photo pour ce site.");
      $("cam").hidden = true;
      document.querySelector("nav").hidden = false;
      return;
    }
  }
  const track = stream.getVideoTracks()[0];
  const zoom = await verrouillerZoom(track);
  $("cam-zoom").textContent = zoom.zoom == null ? "zoom non lu" : `zoom ${zoom.zoom}`;
  if (!zoom.ok) {
    stream.getTracks().forEach((item) => item.stop());
    dire("Le zoom n'est pas à 1. Photo refusée.");
    $("cam").hidden = true;
    document.querySelector("nav").hidden = false;
    return;
  }
  $("video").srcObject = stream;
  state.cam = { stream, track, ic: new ImageCapture(track), zoom: zoom.zoom };
  majOrientation();
}

async function fermerCamera() {
  if (state.apercuUrl) URL.revokeObjectURL(state.apercuUrl);
  state.apercuUrl = "";
  state.attente = null;
  if (state.cam) {
    state.cam.stream.getTracks().forEach((track) => track.stop());
    state.cam = null;
  }
  $("video").srcObject = null;
  $("cam").hidden = true;
  $("apercu").hidden = true;
  document.querySelector("nav").hidden = false;
}

async function declencher() {
  if (!state.cam || !paysage()) return;
  $("declencheur").disabled = true;
  try {
    const zoom = await verrouillerZoom(state.cam.track);
    $("cam-zoom").textContent = zoom.zoom == null ? "zoom non lu" : `zoom ${zoom.zoom}`;
    if (!zoom.ok) {
      const raison = "Le zoom n'est pas à 1. Photo non gardée.";
      $("cam-hint").textContent = raison;
      dire(raison);
      return;
    }
    const caps = await state.cam.ic.getPhotoCapabilities();
    const options = target43(caps) || {};
    if (Array.isArray(caps.fillLightMode) && caps.fillLightMode.includes("off")) {
      options.fillLightMode = "off";
    }
    const blob = await state.cam.ic.takePhoto(options);
    const bitmap = await createImageBitmap(blob);
    const width = bitmap.width;
    const height = bitmap.height;
    bitmap.close();
    const verdict = photoAcceptable(width, height);
    if (!verdict.ok) {
      $("cam-hint").textContent = verdict.raison;
      dire(verdict.raison);
      return;
    }
    const tagged = tagJpeg(
      new Uint8Array(await blob.arrayBuffer()),
      etiquette(state.bague, state.code, marqueVue(state.vueEnCours)),
    );
    const finalBlob = new Blob([tagged], { type: "image/jpeg" });
    state.attente = {
      vue: state.vueEnCours,
      blob: finalBlob,
      w: width,
      h: height,
      zoom: zoom.zoom,
      ts: new Date().toISOString(),
    };
    if (state.apercuUrl) URL.revokeObjectURL(state.apercuUrl);
    state.apercuUrl = URL.createObjectURL(finalBlob);
    $("apercu-img").src = state.apercuUrl;
    $("apercu-info").textContent = `${width} x ${height}${zoom.zoom == null ? "" : `, zoom ${zoom.zoom}`}${verdict.raison ? `. ${verdict.raison}` : ""}`;
    $("apercu").hidden = false;
    $("declencheur").hidden = true;
    if (verdict.raison) dire(verdict.raison);
  } catch (error) {
    const raison = error?.message || "La photo a échoué.";
    $("cam-hint").textContent = raison;
    dire(raison);
  } finally {
    majOrientation();
  }
}

async function garder() {
  if (!state.attente || !state.bague) return;
  const record = assurerRecord();
  record.vues[state.attente.vue] = {
    blob: state.attente.blob,
    w: state.attente.w,
    h: state.attente.h,
    zoom: state.attente.zoom,
    ts: state.attente.ts,
  };
  await ecrire(state.base, record);
  dire(`${state.bague}, ${VUES[state.attente.vue].label} gardée.`);
  await fermerCamera();
  renderBague();
}

function libelleArchive(oiseau) {
  return { nom: nomDuCode(oiseau.code), latin: latinDuCode(oiseau.code) };
}

async function exporter() {
  const oiseaux = [...state.oiseaux.values()].sort((a, b) => a.bague.localeCompare(b.bague));
  const files = [];
  const rows = [];
  for (const oiseau of oiseaux) {
    for (const [vue, photo] of Object.entries(oiseau.vues || {})) {
      const chemin = `${oiseau.bague}/${vue}.jpg`;
      const pixels = new Uint8Array(await photo.blob.arrayBuffer());
      files.push({
        name: chemin,
        data: tagJpeg(pixels, etiquette(oiseau.bague, oiseau.code, marqueVue(vue))),
      });
      rows.push(ligneArchive(oiseau, {
        vue,
        fichier: chemin,
        largeur: photo.w ?? "",
        hauteur: photo.h ?? "",
        zoom: zoomArchive(photo.zoom),
        prise: photo.ts || "",
      }, libelleArchive(oiseau)));
    }
    if (oiseau.cri?.blob) {
      const ext = extensionCri(oiseau.cri.mime);
      const chemin = `${oiseau.bague}/cri.${ext}`;
      const son = new Uint8Array(await oiseau.cri.blob.arrayBuffer());
      files.push({
        name: chemin,
        data: tagAudio(son, oiseau.cri.mime, etiquette(oiseau.bague, oiseau.code)),
      });
      rows.push(ligneArchive(oiseau, {
        vue: "cri",
        fichier: chemin,
        largeur: "",
        hauteur: "",
        zoom: "",
        prise: oiseau.cri.ts || "",
        duree_s: Math.max(1, Math.round((oiseau.cri.duree || 0) / 1000)),
      }, libelleArchive(oiseau)));
    }
  }
  if (!files.length) {
    dire("Rien à exporter.");
    return;
  }
  files.push({ name: "index.csv", data: new TextEncoder().encode(csvIndex(rows)) });
  const zip = buildZip(files, new Date());
  const blob = new Blob([zip], { type: "application/zip" });
  const lien = document.createElement("a");
  const maintenant = new Date();
  const horodatage = [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
    "_",
    String(maintenant.getHours()).padStart(2, "0"),
    String(maintenant.getMinutes()).padStart(2, "0"),
  ].join("");
  lien.href = URL.createObjectURL(blob);
  lien.download = `bagues_${horodatage}.zip`;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 4000);
  dire("ZIP téléchargé. Copie-le hors du téléphone ce soir.");
}

function brancher() {
  document.querySelector("nav").addEventListener("click", (event) => {
    const bouton = event.target.closest("[data-tab]");
    if (bouton) onglet(bouton.dataset.tab);
  });
  $("bague").addEventListener("change", () => chargerBague($("bague").value));
  $("bague").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      chargerBague($("bague").value);
      $("bague").blur();
    }
  });
  $("moins").addEventListener("click", () => sauter(-1));
  $("plus").addEventListener("click", () => sauter(1));
  $("moins10").addEventListener("click", () => sauter(-10));
  $("plus10").addEventListener("click", () => sauter(10));
  $("controle").addEventListener("click", ouvrirControle);
  $("suivante").addEventListener("click", () => {
    if (state.mode === "controle") retourSerie();
    else sauter(1);
  });
  $("cri").addEventListener("click", basculerCri);
  $("espece-recherche").addEventListener("input", renderEspeceFiche);
  $("espece-resultats").addEventListener("click", (event) => {
    const bouton = event.target.closest("[data-espece]");
    if (bouton) choisirCode(bouton.dataset.espece);
  });
  $("retirer-espece").addEventListener("click", () => {
    choisirCode("");
    $("espece-recherche").focus();
  });
  $("libres").addEventListener("click", () => {
    state.libres = true;
    renderBague();
  });
  $("effacer-une").addEventListener("click", async () => {
    if (!state.bague || !state.oiseaux.has(state.bague)) return;
    if (!confirm(`Effacer ${state.bague} ?`)) return;
    await supprimer(state.base, state.bague);
    state.oiseaux.delete(state.bague);
    renderBague();
    dire(`${state.bague} effacée.`);
  });
  $("vues").addEventListener("click", (event) => {
    const bouton = event.target.closest("[data-vue]");
    if (bouton) ouvrirCamera(bouton.dataset.vue);
  });
  $("recherche").addEventListener("input", renderCode);
  $("liste").addEventListener("click", (event) => {
    const bouton = event.target.closest("[data-ouvrir]");
    if (!bouton) return;
    const bague = bouton.dataset.ouvrir;
    const record = state.oiseaux.get(bague);
    if (state.criEtat === "recording") return;
    state.code = codeApresOuverture(state.code, record);
    if (record?.controle) {
      state.mode = "controle";
      state.bague = bague;
    } else {
      state.mode = "serie";
      state.bague = bague;
      state.serie = bague;
    }
    sauverSession();
    onglet("bague");
  });
  $("zip").addEventListener("click", exporter);
  $("effacer").addEventListener("click", async () => {
    if (!state.oiseaux.size) return;
    if (!await demanderEffacementTotal()) return;
    try {
      await vider(state.base);
    } catch {
      dire("Effacement pas fait. Les fiches sont encore là.");
      return;
    }
    state.oiseaux.clear();
    renderExport();
    renderBague();
    dire("Fiches effacées du téléphone.");
  });
  $("cam-fermer").addEventListener("click", fermerCamera);
  $("declencheur").addEventListener("click", declencher);
  $("refaire").addEventListener("click", () => {
    state.attente = null;
    $("apercu").hidden = true;
    $("declencheur").hidden = false;
    $("cam-hint").textContent = "";
    majOrientation();
  });
  $("garder").addEventListener("click", garder);
  window.addEventListener("resize", () => {
    if (!state.cam) return;
    majOrientation();
  });
  window.addEventListener("pagehide", () => {
    fermerCamera();
    if (state.criEtat === "recording") arreterCri();
  });
}

function mimeCri() {
  if (!window.MediaRecorder) return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

async function basculerCri() {
  if (state.criEtat === "recording") {
    arreterCri();
    return;
  }
  const saisi = cleanBague($("bague").value);
  if (saisi && saisi !== state.bague) chargerBague(saisi);
  if (!state.bague) {
    dire("Écris d'abord le numéro de bague.");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    dire("Enregistreur indisponible. Ouvre l'app depuis http://127.0.0.1:8080");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
      video: false,
    });
    const piste = stream.getAudioTracks()[0];
    if (piste?.applyConstraints) {
      await piste.applyConstraints({
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }).catch(() => {});
    }
    const mime = mimeCri();
    const options = { audioBitsPerSecond: 64000 };
    if (mime) options.mimeType = mime;
    const recorder = new MediaRecorder(stream, options);
    const chunks = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) chunks.push(event.data);
    });
    recorder.addEventListener("stop", async () => {
      stream.getTracks().forEach((track) => track.stop());
      const duree = Date.now() - state.criDebut;
      state.criEtat = "repos";
      clearInterval(state.criTicker);
      const brut = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
      if (duree < 400 || brut.size < 200) {
        dire("Cri trop court, refais-le au relâché.");
        renderBague();
        return;
      }
      let garde = brut;
      try {
        const tagged = tagAudio(
          new Uint8Array(await brut.arrayBuffer()),
          brut.type,
          etiquette(state.bague, state.code),
        );
        garde = new Blob([tagged], { type: brut.type || "audio/webm" });
      } catch {
        garde = brut;
      }
      const record = assurerRecord();
      record.cri = { blob: garde, mime: brut.type, duree, ts: new Date().toISOString() };
      state.criCle = "";
      const ecriture = state.base ? ecrire(state.base, record) : Promise.resolve();
      ecriture.then(() => {
        dire(`${state.bague}, cri gardé.`);
        renderBague();
      }).catch(() => dire("Cri pas enregistré."));
    });
    state.criFlux = recorder;
    state.criEtat = "recording";
    state.criDebut = Date.now();
    recorder.start(200);
    state.criTicker = setInterval(() => {
      if (state.criEtat !== "recording") return;
      const secondes = Math.floor((Date.now() - state.criDebut) / 1000);
      $("cri").textContent = `Stop ${secondes} s`;
      if (Date.now() - state.criDebut >= CRI_MAX_MS) arreterCri();
    }, 200);
    renderBague();
  } catch {
    dire("Micro refusé. Autorise le microphone pour ce site.");
  }
}

function arreterCri() {
  const recorder = state.criFlux;
  if (recorder && recorder.state !== "inactive") recorder.stop();
}

async function demarrer() {
  brancher();
  if (!window.isSecureContext) {
    dire("Ouvre l'app depuis http://127.0.0.1:8080, pas depuis un fichier.");
  }
  state.bague = localStorage.getItem(BAGUE_KEY) || "";
  state.code = localStorage.getItem(CODE_KEY) || "";
  state.mode = localStorage.getItem(MODE_KEY) === "controle" ? "controle" : "serie";
  state.serie = localStorage.getItem(SERIE_KEY) || "";
  state.codeSerie = localStorage.getItem(CODE_SERIE_KEY) || "";
  if (state.mode === "serie") state.serie = state.bague || state.serie;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  try {
    const reponse = await fetch("./especes.json");
    state.list = indexEspeces(await reponse.json());
    state.byCode = new Map(state.list.map((espece) => [espece.c, espece]));
  } catch {
    dire("Liste des codes pas chargée.");
  }
  try {
    state.base = await ouvrirBase();
    for (const oiseau of await lireTous(state.base)) state.oiseaux.set(oiseau.bague, oiseau);
    const ouvert = state.oiseaux.get(state.bague);
    if (ouvert) {
      const code = codeApresOuverture(state.code, ouvert);
      if (code !== state.code) {
        state.code = code;
        sauverSession();
      }
    }
  } catch {
    dire("Mémoire locale indisponible.");
  }
  renderBague();
}

demarrer();
