// Codice MIT: generazione in locale, nessuna dipendenza o richiesta di rete.
export const SYMBOLS = Object.freeze(["!", "?", "*", ":", "."]);
const CONSONANTS = "bcdfghlmnpqrstvz";
const VOWELS = "aeiou";
const RANDOM_RANGE = 0x100000000;

export function randomInt(max) {
  if (!Number.isSafeInteger(max) || max < 1 || max > RANDOM_RANGE) {
    throw new RangeError("Limite casuale non valido.");
  }
  // Rejection sampling evita il bias del modulo.
  const acceptedBelow = Math.floor(RANDOM_RANGE / max) * max;
  const data = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(data);
  } while (data[0] >= acceptedBelow);
  return data[0] % max;
}

export function alphabeticWords(words) {
  return words.filter(w => /^[a-z]{3,6}$/.test(w));
}

export function estimateEntropy(poolSize, count, extraDigit = false) {
  if (poolSize <= 1 || count < 1) throw new RangeError("Parametri entropia non validi.");
  return count * Math.log2(poolSize) + (extraDigit ? Math.log2(10) : 0);
}

export function generatePhrase(pool, options = {}) {
  const count = options.count ?? 6;
  const separator = options.separator ?? "-";
  if (!Array.isArray(pool) || pool.length < 2 || !Number.isInteger(count) || count < 4 || count > 10) {
    throw new RangeError("Parametri passphrase non validi.");
  }
  if (!["-", ".", " ", ""].includes(separator)) throw new RangeError("Separatore non valido.");
  const picked = Array.from({length: count}, () => {
    const word = pool[randomInt(pool.length)];
    return options.uppercase ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  });
  let password = picked.join(separator);
  if (options.appendNumber) password += String(randomInt(10));
  return {password, entropy: estimateEntropy(pool.length, count, Boolean(options.appendNumber)), poolSize:pool.length};
}

export function makeSyllablePool(fullWordlist) {
  const known = new Set(fullWordlist.map(w => w.toLowerCase()));
  const pool = [];
  for (const first of CONSONANTS) {
    for (const firstVowel of VOWELS) {
      for (const second of CONSONANTS) {
        for (const secondVowel of VOWELS) {
          const group = first + firstVowel + second + secondVowel;
          if (!known.has(group)) pool.push(group);
        }
      }
    }
  }
  return pool;
}

// Valori alfabetici disponibili nei formati Telemaco.
// Niente nomi propri nella piccola lista delle particelle; la lista generale
// non permette di riconoscere automaticamente tutti i nomi propri.
const SHORT_PARTICLES = Object.freeze([
  "al", "ai", "ci", "da", "di", "ed", "fa", "fu", "ha", "ho", "il",
  "in", "io", "la", "le", "lo", "ma", "me", "mi", "ne", "no", "re",
  "sa", "se", "si", "so", "su", "te", "ti", "tu", "un", "va", "vi"
]);

// Tre parole naturali (lunghezza complessiva 15) + 3 punti + 2 cifre.
// Gli ordinamenti sono equiprobabili; nessun termine è scelto a mano.
export const TELEMACO_WORD_PATTERNS = Object.freeze([
  Object.freeze([5, 5, 5]),
  Object.freeze([4, 5, 6]),
  Object.freeze([4, 6, 5]),
  Object.freeze([5, 4, 6]),
  Object.freeze([5, 6, 4]),
  Object.freeze([6, 4, 5]),
  Object.freeze([6, 5, 4])
]);

const EXCLUDED = new Set([
  "roma", "mario", "maria", "marco", "paolo", "luigi", "giulia",
  "milano", "napoli", "torino", "parigi", "italia", "admin",
  "qwert", "infocam", "password", "telemaco"
]);

export function makeTelemacoPools(fullWordlist) {
  if (!Array.isArray(fullWordlist) || fullWordlist.length < 2) {
    throw new RangeError("Dizionario non disponibile.");
  }
  const italiane = {4: [], 5: [], 6: []};
  for (const entry of fullWordlist) {
    if (/^[a-z]{4,6}$/.test(entry) &&
        !EXCLUDED.has(entry) &&
        !/(.)\1\1/.test(entry) &&
        /[aeiou]/.test(entry)) {
      italiane[entry.length].push(entry);
    }
  }
  for (const length of [4, 5, 6]) {
    if (italiane[length].length < 10) throw new Error("Dizionario di parole troppo ridotto.");
  }
  const invented = makeSyllablePool(fullWordlist);
  const short = [...new Set([
    ...SHORT_PARTICLES,
    ...Array.from("bcdfghlmnpqrstvz").flatMap(consonant =>
      Array.from("aeiou").map(vowel => consonant + vowel))
  ])];
  return {italiane, invented, short};
}

export function validateTelemaco(value, username = "") {
  const errors = [];
  if (value.length < 8 || value.length > 20) errors.push("La lunghezza deve essere fra 8 e 20 caratteri.");
  if (!/^[a-zA-Z0-9!?*:.]+$/.test(value)) errors.push("Sono stati usati caratteri non previsti.");
  if (!/[a-zA-Z]/.test(value)) errors.push("Manca una lettera.");
  if (!/[0-9]/.test(value)) errors.push("Manca una cifra.");
  if (!/[!?*:.]/.test(value)) errors.push("Manca un simbolo consentito.");
  if (/(.)\1\1/.test(value)) errors.push("Tre caratteri consecutivi uguali.");
  const lower = value.toLowerCase();
  const user = username.trim().toLowerCase();
  if (user && lower.includes(user)) errors.push("Contiene lo user ID.");
  if (/(qwert|asdfg|zxcvb|infocam|telemaco|password)/.test(lower)) errors.push("Contiene una sequenza o espressione banale.");
  for (let i = 0; i + 4 <= lower.length; i++) {
    const part = lower.slice(i, i + 4);
    if (/^\d{4}$/.test(part)) {
      const digits = "01234567890123456789";
      const reversed = "98765432109876543210";
      if (digits.includes(part) || reversed.includes(part)) errors.push("Contiene una sequenza numerica banale.");
    }
    if (/^[a-z]{4}$/.test(part)) {
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      if (alphabet.includes(part) || [...alphabet].reverse().join("").includes(part)) errors.push("Contiene una sequenza alfabetica banale.");
    }
  }
  return [...new Set(errors)];
}

export function generateTelemaco(pools, username = "", uppercase = true, options = {}) {
  const style = options.style ?? "italiane";
  const ending = options.ending ?? "digits";
  if (!pools?.italiane || !Array.isArray(pools.invented) || !Array.isArray(pools.short) ||
      !["italiane", "inventate"].includes(style) ||
      !["digits", "symbol"].includes(ending)) {
    throw new RangeError("Parametri Telemaco non validi.");
  }
  const lastSymbols = ["!", "?", "*", ":"];
  for (let attempt = 0; attempt < 2000; attempt++) {
    let parts;
    let entropyUpperBound;
    if (style === "italiane") {
      const template = TELEMACO_WORD_PATTERNS[randomInt(TELEMACO_WORD_PATTERNS.length)];
      const selectedPools = template.map(length => pools.italiane[length]);
      parts = selectedPools.map(pool => pool[randomInt(pool.length)]);
      // Limite superiore riferito al template selezionato e alla sua scelta.
      entropyUpperBound = Math.log2(TELEMACO_WORD_PATTERNS.length)
        + selectedPools.reduce((value, pool) => value + Math.log2(pool.length), 0);
    } else {
      parts = Array.from({length: 3}, () => pools.invented[randomInt(pools.invented.length)]);
      parts.push(pools.short[randomInt(pools.short.length)]);
      entropyUpperBound = 3 * Math.log2(pools.invented.length) + Math.log2(pools.short.length);
    }
    if (new Set(parts).size !== parts.length) continue;
    if (uppercase) parts[0] = parts[0][0].toUpperCase() + parts[0].slice(1);
    const suffix = ending === "digits"
      ? String(randomInt(10)) + String(randomInt(10))
      : String(randomInt(10)) + lastSymbols[randomInt(lastSymbols.length)];
    const candidate = parts.join(".") + "." + suffix;
    if (validateTelemaco(candidate, username).length === 0) {
      entropyUpperBound += ending === "digits" ? Math.log2(100) : Math.log2(40);
      return {password: candidate, entropyUpperBound, style, ending};
    }
  }
  throw new Error("Impossibile generare una password compatibile. Verifica lo user ID o riprova.");
}
