import assert from "node:assert/strict";
import test from "node:test";

import { calculateProductionUsage } from "./production";

test("production consumes the full recipe and permits a negative ingredient stock", () => {
  const [flour] = calculateProductionUsage(
    [{ ingredientId: 1, quantity: 0.1, stock: 5 }],
    75,
  );

  assert.equal(flour.used, 7.5);
  assert.equal(flour.resultingStock, -2.5);
});
