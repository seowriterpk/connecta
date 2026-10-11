import { computeDisplayedMembers } from "../src/lib/members";
import { readFileSync } from "fs";
const lines = readFileSync("/tmp/live_groups.tsv", "utf-8").split("\n").filter(Boolean).slice(1);
let sum = 0;
for (const line of lines) {
  const [id, clicks, joins] = line.split("\t");
  const v = computeDisplayedMembers(Number(clicks), Number(joins), id);
  sum += v;
}
console.log("MEMBERS_SUM=" + sum);
