import {WORDS_IT} from "./data/italiano-v4.js";
import {alphabeticWords, generatePhrase, generateTelemaco, makeTelemacoPools} from "./core.js";

const byId = id => document.getElementById(id);
const alpha = alphabeticWords(WORDS_IT);
const telemacoPools = makeTelemacoPools(WORDS_IT);
const tabs = [byId("tab-italiano"), byId("tab-telemaco")];
let mode = "italiano";
let currentPassword = "";
let isHidden = false;

const setStatus = (message, error = false) => {
  byId("status").textContent = message;
  byId("status").classList.toggle("error", error);
};

function clearOutput() {
  currentPassword = "";
  isHidden = false;
  byId("result").textContent = "Premi “Genera passphrase”";
  byId("result").classList.remove("masked");
  byId("copy").disabled = true;
  byId("hide").disabled = true;
  byId("hide").textContent = "Nascondi";
  byId("entropy").textContent = "—";
  setStatus("Il risultato non viene salvato e scompare chiudendo o ricaricando la pagina.");
}

function setMode(nextMode) {
  mode = nextMode;
  const isItalian = mode === "italiano";
  byId("panel-italiano").hidden = !isItalian;
  byId("panel-telemaco").hidden = isItalian;
  tabs.forEach((tab, index) => {
    const selected = index === (isItalian ? 0 : 1);
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  byId("generate").firstChild.textContent = isItalian ? "Genera passphrase " : "Genera per Telemaco ";
  clearOutput();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => setMode(index === 0 ? "italiano" : "telemaco"));
  tab.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setMode(nextIndex === 0 ? "italiano" : "telemaco");
    tabs[nextIndex].focus();
  });
});

byId("word-count").addEventListener("input", () => {
  byId("word-count-value").textContent = byId("word-count").value;
});

byId("generate").addEventListener("click", () => {
  try {
    if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
      throw new Error("Questo browser non dispone di un generatore casuale crittografico.");
    }
    if (mode === "italiano") {
      const pool = byId("vocabulary").value === "all" ? WORDS_IT : alpha;
      const generated = generatePhrase(pool, {
        count: Number(byId("word-count").value),
        separator: byId("separator").value,
        uppercase: byId("uppercase-words").checked,
        appendNumber: byId("append-number").checked
      });
      currentPassword = generated.password;
      byId("entropy").textContent = "Entropia teorica: " + generated.entropy.toFixed(1) + " bit";
      setStatus("Estratta da " + generated.poolSize.toLocaleString("it-IT") + " voci. Nessuna frase salvata.");
    } else {
      const generated = generateTelemaco(telemacoPools, byId("username").value, byId("telemaco-uppercase").checked, {
        style: byId("telemaco-style").value,
        ending: byId("telemaco-ending").value
      });
      currentPassword = generated.password;
      byId("entropy").textContent = "Limite teorico (prima dei filtri): " + generated.entropyUpperBound.toFixed(1) + " bit";
      setStatus("Controlli locali superati. Le parole comuni e i nomi propri potrebbero essere rifiutati da Telemaco.");
    }
    isHidden = false;
    byId("result").classList.remove("masked");
    byId("result").textContent = currentPassword;
    byId("copy").disabled = false;
    byId("hide").disabled = false;
    byId("hide").textContent = "Nascondi";
  } catch (error) {
    clearOutput();
    setStatus(error instanceof Error ? error.message : "Errore durante la generazione.", true);
  }
});

byId("copy").addEventListener("click", async () => {
  if (!currentPassword) return;
  try {
    await navigator.clipboard.writeText(currentPassword);
    setStatus("Copiata negli appunti. Incollala in Bitwarden ed evita di condividerla.");
  } catch {
    setStatus("Copia automatica non disponibile: seleziona la passphrase e copiala manualmente.", true);
  }
});

byId("hide").addEventListener("click", () => {
  if (!currentPassword) return;
  isHidden = !isHidden;
  byId("result").classList.toggle("masked", isHidden);
  byId("hide").textContent = isHidden ? "Mostra" : "Nascondi";
});
