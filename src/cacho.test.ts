import assert from "node:assert";
import { scoreAll } from "./cacho.js";
assert.equal(scoreAll([6,6,6,6,6])[0].category, "grande");
assert.equal(scoreAll([3,3,3,3,1])[0].category, "poker");
assert.equal(scoreAll([5,5,5,2,2])[0].category, "full");
assert.equal(scoreAll([1,2,3,4,5])[0].category, "escalera");
assert.equal(scoreAll([3,4,5,6,1])[0].category, "escalera");
assert.equal(scoreAll([6,6,2,3,1])[0].category, "seis");
console.log("cacho scoring ok");
