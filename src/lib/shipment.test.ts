import assert from"node:assert/strict";
import test from"node:test";
import{isValidShipmentItems}from"./shipment";

test("accepts positive numeric shipment quantities",()=>{
 assert.equal(isValidShipmentItems([{productId:1,quantity:15}]),true);
});

test("rejects empty, non-numeric and non-positive shipment quantities",()=>{
 for(const quantity of[0,-1,null,"", "1",Number.NaN]){
  assert.equal(isValidShipmentItems([{productId:1,quantity}]),false);
 }
});
