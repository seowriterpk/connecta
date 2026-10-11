import { computeDisplayedMembers } from "../src/lib/members";
import { readFileSync } from "fs";
const lines = readFileSync("/tmp/live_clean.tsv", "utf-8").split("\n").filter(Boolean).slice(1);
let sum = 0;
for (const line of lines) {
  const [id, clicks, joins] = line.split("\t");
  sum += computeDisplayedMembers(Number(clicks), Number(joins), id);
}
console.log("CLEAN_MEMBERS_SUM=" + sum);
