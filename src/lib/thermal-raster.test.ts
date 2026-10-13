import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodeRaster} from './thermal-raster';
test('ESC/POS raster header and bit order, including white padding and transparency',()=>{
 const p=new Uint8ClampedArray(9*4);for(let x=0;x<9;x++)p[x*4+3]=255;
 p.set([255,255,255,255],4);p.set([0,0,0,0],8);
 const data=encodeRaster(p,9,1);assert.deepEqual([...data.slice(0,8)],[29,118,48,0,2,0,1,0]);assert.deepEqual([...data.slice(8)],[159,128]);
});
test('rejects invalid raster size',()=>{assert.throws(()=>encodeRaster(new Uint8ClampedArray(4),577,1));});
