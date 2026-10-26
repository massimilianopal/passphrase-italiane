import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {WORDS_IT} from "../public/data/italiano-v4.js";
import {randomInt, alphabeticWords, estimateEntropy, generatePhrase, makeSyllablePool, generateTelemaco, validateTelemaco, SYMBOLS} from "../public/core.js";
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const alpha = alphabeticWords(WORDS_IT);
const pool = makeSyllablePool(WORDS_IT);
test("dizionario integrale v4: 7776 voci uniche", () => {
  assert.equal(WORDS_IT.length, 7776);
  assert.equal(new Set(WORDS_IT).size, 7776);
  assert.ok(alpha.length > 6000);
});
test("casualità: intervallo e input invalidi", () => {
  for (let i = 0; i < 10000; i++) assert.ok(randomInt(7) >= 0 && randomInt(7) < 7);
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
test("pool pronunciabile esclude voci complete del dizionario", () => {
  const set = new Set(WORDS_IT);
  assert.ok(pool.length > 4000);
  assert.ok(pool.every(w => /^[bcdfghlmnpqrstvz][aeiou][bcdfghlmnpqrstvz][aeiou]$/.test(w) && !set.has(w)));
});
test("Telemaco: 5000 generazioni, nessuna regola locale violata", () => {
  for (let i = 0; i < 5000; i++) {
    const result = generateTelemaco(pool, "utente99", true);
    assert.equal(result.password.length,20);
    assert.deepEqual(validateTelemaco(result.password, "utente99"), []);
    assert.equal(result.password.replace(/[^!?*:.]/g, "").length, 2);
    assert.equal(result.password.replace(/[^0-9]/g, "").length, 2);
    assert.equal(result.password.replace(/[^A-Z]/g, "").length, 1);
  }
});
test("Telemaco: simboli previsti e controlli", () => {
  assert.deepEqual(SYMBOLS,["!","?","*",":","."]);
  assert.ok(validateTelemaco("abcde1234!").length);
  assert.ok(validateTelemaco("QwERTx1!Ab").length);
  assert.ok(validateTelemaco("Abcd5!efgh", "abcd5").length);
  assert.equal(generateTelemaco(pool, "", false).password.replace(/[^A-Z]/g, "").length,0);
});
