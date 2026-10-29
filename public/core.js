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

function capitalizeOneLetter(value) {
  const target = randomInt(16);
  let seen = 0;
  return [...value].map(ch => {
    if (!/[a-z]/.test(ch)) return ch;
    const result = seen === target ? ch.toUpperCase() : ch;
    seen++;
    return result;
  }).join("");
}

export function generateTelemaco(pool, username = "", uppercase = true) {
  if (!Array.isArray(pool) || pool.length < 2) throw new RangeError("Dizionario gruppi non disponibile.");
  // 16 lettere in 4 gruppi CVCV, 2 simboli ammessi e 2 cifre = esattamente 20 caratteri.
  for (let attempt = 0; attempt < 2000; attempt++) {
    const parts = Array.from({length: 4}, () => pool[randomInt(pool.length)]);
    let candidate = parts[0] + SYMBOLS[randomInt(SYMBOLS.length)] + parts[1]
      + randomInt(10) + parts[2] + SYMBOLS[randomInt(SYMBOLS.length)]
      + parts[3] + randomInt(10);
    if (uppercase) candidate = capitalizeOneLetter(candidate);
    if (validateTelemaco(candidate, username).length === 0) {
      // Massimo teorico prima dei filtri sullo user ID e sulle sequenze vietate.
      const entropyUpperBound = 4 * Math.log2(pool.length) + 2 * Math.log2(5) + 2 * Math.log2(10) + (uppercase ? Math.log2(16) : 0);
      return {password: candidate, entropyUpperBound, poolSize:pool.length};
    }
  }
  throw new Error("Impossibile rispettare i vincoli con questo user ID. Verifica il valore inserito.");
}
