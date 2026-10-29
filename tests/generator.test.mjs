import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {WORDS_IT} from "../public/data/italiano-v4.js";
import {
  randomInt, alphabeticWords, estimateEntropy, generatePhrase, makeSyllablePool,
  makeTelemacoPools, generateTelemaco, validateTelemaco, TELEMACO_WORD_PATTERNS, SYMBOLS
} from "../public/core.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const alpha = alphabeticWords(WORDS_IT);
const pools = makeTelemacoPools(WORDS_IT);

test("dizionario integrale v4: 7776 voci uniche", () => {
  assert.equal(WORDS_IT.length, 7776);
  assert.equal(new Set(WORDS_IT).size, 7776);
  assert.ok(alpha.length > 6000);
});
test("casualità: intervallo e input invalidi", () => {
  for (let i = 0; i < 10000; i++) {
    const actual = randomInt(7);
    assert.ok(actual >= 0 && actual < 7);
  }
  assert.throws(() => randomInt(0));
  assert.throws(() => randomInt(0x100000001));
});
test("passphrase 6 voci e entropia corretta", () => {
  for (let i = 0; i < 1000; i++) {
    const result = generatePhrase(alpha, {count:6, separator:"-"});
    assert.equal(result.password.split("-").length, 6);
    assert.equal(result.entropy, estimateEntropy(alpha.length, 6));
  }
  assert.equal(generatePhrase(alpha,{count:4, separator:"", appendNumber:true}).password.match(/\d$/)?.length, 1);
});
test("pool inventato resta pronunciabile", () => {
  const known = new Set(WORDS_IT);
  assert.ok(pools.invented.length > 4000);
  assert.ok(pools.invented.every(w => /^[bcdfghlmnpqrstvz][aeiou][bcdfghlmnpqrstvz][aeiou]$/.test(w) && !known.has(w)));
  assert.ok(pools.short.includes("il"));
});
test("Telemaco: parole italiane facili da trascrivere, 5000 generazioni", () => {
  const known = new Set(WORDS_IT);
  const formats = new Set(TELEMACO_WORD_PATTERNS.map(x => x.join(",")));
  for (let i = 0; i < 5000; i++) {
    const result = generateTelemaco(pools,"utente99",true);
    assert.equal(result.password.length,20);
    assert.deepEqual(validateTelemaco(result.password, "utente99"), []);
    assert.match(result.password, /^[A-Z][a-z]+\.[a-z]+\.[a-z]+\.\d{2}$/);
    const parts = result.password.split(".");
    assert.ok(parts.slice(0,3).every(w=>known.has(w.toLowerCase())));
    assert.ok(formats.has(parts.slice(0,3).map(x=>x.length).join(",")));
    assert.ok(Number.isFinite(result.entropyUpperBound));
  }
});
test("Telemaco: gruppi inventati con punto e finale a cifre", () => {
  for (let i=0;i<3000;i++) {
    const result=generateTelemaco(pools,"utente99",true,{style:"inventate"});
    assert.match(result.password, /^[A-Z][a-z]{3}\.[a-z]{4}\.[a-z]{4}\.[a-z]{2}\.\d{2}$/);
    assert.equal(result.password.length,20);
    assert.deepEqual(validateTelemaco(result.password,"utente99"),[]);
  }
});
test("Telemaco: finale cifra e simbolo, in entrambi gli stili", () => {
  for (const style of ["italiane","inventate"]) {
    for (let i=0;i<2000;i++) {
      const value=generateTelemaco(pools,"",false,{style,ending:"symbol"}).password;
      assert.match(value, /^[a-z.]+\.\d[!?*:]$/);
      assert.equal(value.length,20);
      assert.deepEqual(validateTelemaco(value),[]);
      assert.equal(value.replace(/[^A-Z]/g,"").length,0);
    }
  }
});
test("Telemaco: divieto di trattino, controllo user ID e sequenze", () => {
  assert.deepEqual(SYMBOLS,["!","?","*",":","."]);
  assert.ok(validateTelemaco("Pepo-rida-vuza-il-42").length);
  assert.deepEqual(validateTelemaco("Pepo.rida.vuza.il.42"), []);
  assert.ok(validateTelemaco("Abcd5!efgh","abcd5").length);
  assert.ok(validateTelemaco("abcde1234!").length);
  assert.throws(() => generateTelemaco(pools,"",true,{style:"notvalid"}));
});
