import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultPrinter} from './default-printer';
test('reuse a previously selected sole printer, but require selection for missing or ambiguous devices',()=>{
 const printer={};assert.equal(defaultPrinter([printer],true),printer);
 assert.equal(defaultPrinter([printer],false),undefined);
 assert.equal(defaultPrinter([],true),undefined);
 assert.equal(defaultPrinter([printer,{}],true),undefined);
});
