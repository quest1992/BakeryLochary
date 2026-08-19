import test from "node:test";
import assert from "node:assert/strict";
import {apiAreaStatus,assertBusinessWrite,canAccessTab,canReadFinancials,hasRestrictedFinancialFields} from "./access-control";

test("INVESTOR can read only the financial cabinet tabs",()=>{
  for(const tab of ["finance","customers","reports"])assert.equal(canAccessTab("INVESTOR",tab),true);
  for(const tab of ["recipes","production","ingredients","stock","procurement","suppliers","team","settings"])assert.equal(canAccessTab("INVESTOR",tab),false);
  assert.equal(canReadFinancials("INVESTOR"),true);
});

test("INVESTOR receives a forbidden result for every business write",()=>{
  assert.throws(()=>assertBusinessWrite("INVESTOR"),/FORBIDDEN/);
  assert.doesNotThrow(()=>assertBusinessWrite("OWNER"));
  assert.doesNotThrow(()=>assertBusinessWrite("WORKER"));
});

test("OWNER retains full access",()=>{
  for(const tab of ["finance","recipes","production","ingredients","stock","procurement","suppliers","team","settings"])assert.equal(canAccessTab("OWNER",tab),true);
});

test("restricted direct API areas return 403 to INVESTOR but not OWNER",()=>{
  for(const area of ["recipes","production","ingredients","raw-materials","warehouse","stock","settings","users"]){
    assert.equal(apiAreaStatus("INVESTOR",area),403);
    assert.equal(apiAreaStatus("OWNER",area),404);
  }
});

test("financial responses reject recipe and ingredient-shaped fields",()=>{
  assert.equal(hasRestrictedFinancialFields({summary:{income:10},customers:[{name:"A",debt:2}]}),false);
  assert.equal(hasRestrictedFinancialFields({summary:{income:10},recipes:[]}),true);
  assert.equal(hasRestrictedFinancialFields({payments:[{ingredient:{name:"Мука"}}]}),true);
});
