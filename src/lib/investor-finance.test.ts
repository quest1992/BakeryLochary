import assert from "node:assert/strict";
import test from "node:test";

test("investor cards follow the selected month and investment start date", async () => {
  const agreement = {
    investorName: "Investor", principal: 50000, initialShare: 40,
    startedAt: new Date("2026-09-15T00:00:00+05:00"), note: null, buybacks: [],
  };
  const shipments = [
    {id: 1, total: 1000, deliveredAt: new Date("2026-09-10T12:00:00+05:00")},
    {id: 2, total: 500, deliveredAt: new Date("2026-09-20T12:00:00+05:00")},
    {id: 3, total: 3000, deliveredAt: new Date("2026-10-20T12:00:00+05:00")},
  ].map(row => ({...row, paidAmount: 0, items: [{productId: 1, quantity: 5, costPrice: 10}]}));
  const db = {
    shipment: {findMany: async ({where}: {where:{deliveredAt:{gte:Date;lte:Date}}}) => {
      const {gte, lte} = where.deliveredAt;
      return shipments.filter(row => row.deliveredAt >= gte && row.deliveredAt <= lte);
    }},
    expense: {findMany: async () => []},
    payment: {findMany: async () => []},
    customer: {findMany: async () => []},
    supplierDebt: {findMany: async () => []},
    investmentAgreement: {findUnique: async () => agreement},
    productMovement: {findMany: async () => [
      {productId: 1, shipmentId: 2, type: "RETURN", quantity: 1, createdAt: new Date("2026-10-01T12:00:00+05:00")},
    ]},
    product: {findMany: async () => [{id: 1, costPrice: 10}]},
  };
  const globals = globalThis as {db?:unknown};
  const original = globals.db;
  globals.db = db;
  try {
    const {getInvestorFinance, parseFinancialPeriod} = await import("./investor-finance");
    const septemberPeriod = parseFinancialPeriod("2026-09-01", "2026-09-30", "dushanbe");
    assert.equal(septemberPeriod.from.toISOString(), "2026-08-31T19:00:00.000Z");
    assert.equal(septemberPeriod.to.toISOString(), "2026-09-30T18:59:59.999Z");
    const september = await getInvestorFinance(septemberPeriod);
    const october = await getInvestorFinance({
      from: new Date("2026-10-01T00:00:00+05:00"), to: new Date("2026-10-31T23:59:59.999+05:00"),
    });
    assert.equal(september.selectedPeriod.profit, 1400);
    assert.equal(september.selectedPeriod.investorEarnings, 180);
    assert.equal(october.selectedPeriod.profit, 2950);
    assert.equal(october.selectedPeriod.investorEarnings, 1180);
    assert.deepEqual(september.currentMonth, october.currentMonth);
  } finally {
    globals.db = original;
  }
});
