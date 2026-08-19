import test from"node:test";import assert from"node:assert/strict";import{calculateInvestment}from"./investment";
test("variable buybacks reduce the investor share proportionally",()=>{assert.deepEqual(calculateInvestment(50000,40,[5000,12000,3000]),{repaid:20000,remaining:30000,currentShare:24})});
test("buybacks cannot reduce the balance or share below zero",()=>{assert.deepEqual(calculateInvestment(50000,40,[60000]),{repaid:50000,remaining:0,currentShare:0})});
