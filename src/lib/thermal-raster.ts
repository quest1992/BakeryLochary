export function encodeRaster(pixels:Uint8ClampedArray,width:number,height:number):Uint8Array {
 if(!Number.isInteger(width)||width<1||width>576||!Number.isInteger(height)||height<1||pixels.length!==width*height*4)throw new Error('Invalid raster');
 const stride=Math.ceil(width/8),out=new Uint8Array(8+stride*height);
 out.set([29,118,48,0,stride&255,stride>>8,height&255,height>>8]);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const i=(y*width+x)*4,alpha=pixels[i+3]/255;
 const gray=(pixels[i]*.299+pixels[i+1]*.587+pixels[i+2]*.114)*alpha+255*(1-alpha);
 if(gray<180)out[8+y*stride+(x>>3)]|=128>>(x%8);
 }
 return out;
}
