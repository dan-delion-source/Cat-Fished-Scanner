const wrap = body => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><g stroke="#754963" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`)}`;
import backgroundUrl from '../assets/background.jpeg?url';
import heartUrl from '../assets/big heart.jpeg?url';
import catEarsUrl from '../assets/cat ears.jpeg?url';
export const stickers={
 cat:wrap('<path fill="#fffafc" d="M30 72 22 20 64 44Q80 37 96 44L138 20 130 72Q149 136 80 140 11 136 30 72Z"/><path fill="#f8a9c8" stroke="none" d="m31 36 7 30 18-17m73-13-7 30-18-17"/><path d="M51 91v5m58-5v5m-39 14q10 13 20 0m-55-7-17-4m18 14-17 5m105-15 17-4m-18 14 17 5" fill="none"/><path fill="#f1a1be" d="m75 104 5 5 5-5Z"/>'),
 bow:wrap('<path fill="#f49ec4" d="M70 72Q10 8 15 72T67 96L49 147 82 127 113 147 96 95Q153 135 146 70T91 72Z"/><ellipse fill="#ffc8dd" cx="80" cy="82" rx="17" ry="22"/>'),
 heart:wrap('<path fill="#ffa8c7" d="M80 137 21 80C-12 35 49 0 80 43 112 0 172 35 139 80Z"/>'),
 star:wrap('<path fill="#fff0a4" d="m80 12 20 43 48 7-35 35 9 49-42-24-42 24 9-49-35-35 48-7Z"/>'),
 flower:wrap('<path fill="#cadffb" d="M80 42C30-15 2 53 44 77-17 112 47 164 78 119 113 166 174 112 119 80 166 40 107-9 80 42Z"/><circle fill="#fff0ac" cx="81" cy="81" r="22"/>'),
 ears:wrap('<path fill="#fffafc" d="M11 133 20 18 75 97 88 97 143 18 151 133Z"/><path fill="#f4a7c7" d="m24 107 5-60 30 52m77 8-5-60-30 52"/>'),
 cloud:wrap('<path fill="#fff" d="M32 117C-8 110 3 63 38 65 31 11 98 10 107 55 146 29 177 107 129 117Z"/>'),
 strawberry:wrap('<path fill="#f894ae" d="M30 55Q80 28 130 55 139 105 80 148 21 105 30 55Z"/><path fill="#b5dec9" d="m80 53-43-27 33 3 10-23 12 23 31-3Z"/><path d="m53 76 2 5m43-4 2 5m-24 18 2 5m-30-4 2 5m47-1 2 5m-27 17 2 5"/>'),
 paw:wrap('<ellipse fill="#f5b7d1" cx="80" cy="103" rx="41" ry="32"/><ellipse fill="#f5b7d1" cx="30" cy="65" rx="15" ry="22"/><ellipse fill="#f5b7d1" cx="62" cy="39" rx="15" ry="22"/><ellipse fill="#f5b7d1" cx="98" cy="39" rx="15" ry="22"/><ellipse fill="#f5b7d1" cx="131" cy="65" rx="15" ry="22"/>')
};
async function loadRaster(src,{keyWhite=false,crop=null}={}){const image=new Image();image.src=src;await image.decode();const sx=crop?.sx||0,sy=crop?.sy||0,sw=crop?.sw||image.naturalWidth,sh=crop?.sh||image.naturalHeight;const canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;const ctx=canvas.getContext('2d');ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);if(keyWhite){const pixels=ctx.getImageData(0,0,sw,sh);for(let i=0;i<pixels.data.length;i+=4){if(pixels.data[i]>238&&pixels.data[i+1]>238&&pixels.data[i+2]>238)pixels.data[i+3]=0;}ctx.putImageData(pixels,0,0);}return canvas;}
export async function loadStickers(){const base=Object.fromEntries(await Promise.all(Object.entries(stickers).map(async([key,src])=>{const im=new Image();im.src=src;await im.decode();return [key,im]})));const extra=await Promise.all([loadRaster(backgroundUrl).then(value=>['background',value]),loadRaster(heartUrl,{keyWhite:true}).then(value=>['bigHeart',value]),loadRaster(catEarsUrl,{keyWhite:true,crop:{sx:0,sy:0,sw:420,sh:230}}).then(value=>['catEars',value])]);return {...base,...Object.fromEntries(extra)};}
