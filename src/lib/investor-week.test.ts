import assert from "node:assert/strict";
import test from "node:test";
import {investorWeeks, paidInvoiceCost, weeklyInvestorTotals} from "./investor-week";

test("November 1 stands alone and subsequent weeks end on Sunday in Dushanbe", () => {
  const weeks = investorWeeks(new Date("2026-11-09T00:30:00+05:00"));
  assert.deepEqual(weeks.map(week => week.value), ["2026-11-09", "2026-11-02", "2026-11-01"]);
  assert.equal(weeks[1].end.toISOString(), "2026-11-08T18:59:59.999Z");
  assert.equal(weeks[2].end.toISOString(), "2026-11-01T18:59:59.999Z");
  assert.equal(weeks[0].period.to.toISOString(), "2026-11-08T19:30:00.000Z");
});

test("an old invoice enters the weekly calculation in proportion to its payments", () => {
  const invoice = {
    items: [{productId:1, quantity:10, price:10, costPrice:6}],
    payments: [
      {amount:25, paidAt:new Date("2026-11-03T12:00:00+05:00")},
      {amount:75, paidAt:new Date("2026-11-10T12:00:00+05:00")},
    ],
  };
  const end = investorWeeks(new Date("2026-11-16T10:00:00+05:00")).map(week => week.end);
  const before = paidInvoiceCost(invoice, [], end[3]);
  const partial = paidInvoiceCost(invoice, [], end[2]);
  const full = paidInvoiceCost(invoice, [], end[1]);
  assert.equal(before, 0);
  assert.equal(partial - before, 15);
  assert.equal(full - partial, 45);
  assert.deepEqual(weeklyInvestorTotals(75, 45, 10, 5), {
    receipts:75, cost:45, profit:15, investorEarnings:6, ownerEarnings:9,
  });
  assert.equal(weeklyInvestorTotals(25, 15, 10, 5).investorEarnings, 0);
  assert.equal(weeklyInvestorTotals(0, -5, 0, 0).investorEarnings, 0);
});
