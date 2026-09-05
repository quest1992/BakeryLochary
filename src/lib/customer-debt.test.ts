import assert from"node:assert/strict";import test from"node:test";import{splitCustomerDebt}from"./customer-debt";

test("splits real outstanding debt at 01.09.2026 and keeps the total",()=>{
 const result=splitCustomerDebt([
  {date:new Date(2026,7,20,10),amount:1000,paidAmount:400},
  {date:new Date(2026,8,1,9),amount:300,paidAmount:50},
  {date:new Date(2026,8,12,9),amount:200,paidAmount:0},
 ],new Date(2026,8,1));
 assert.deepEqual(result,{before:600,after:450,total:1050});
});

test("includes opening debts and never reports overpaid rows as negative debt",()=>{
 const result=splitCustomerDebt([
  {date:new Date(2026,7,1),amount:500,paidAmount:700},
  {date:new Date(2026,7,31,23,59),amount:120.25,paidAmount:20.1},
  {date:new Date(2026,8,1),amount:80,paidAmount:30},
 ],new Date(2026,8,1));
 assert.deepEqual(result,{before:100.15,after:50,total:150.15});
});
