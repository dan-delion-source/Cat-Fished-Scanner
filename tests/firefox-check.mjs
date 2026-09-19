import {writeFile} from 'node:fs/promises';
const ws=new WebSocket('ws://127.0.0.1:9222/session');
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
let id=0;const pending=new Map();ws.onmessage=({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.type==='error'?reject(new Error(JSON.stringify(m))):resolve(m.result);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
await call('session.new',{capabilities:{alwaysMatch:{acceptInsecureCerts:true}}});
const {context}=await call('browsingContext.create',{type:'tab'});
const evaluate=async expression=>{const r=await call('script.evaluate',{expression,target:{context},awaitPromise:true,userActivation:true});if(r.type==='exception')throw new Error(JSON.stringify(r));return r.result.value;};
await call('browsingContext.setViewport',{context,viewport:{width:1440,height:1000},devicePixelRatio:1});
await call('browsingContext.navigate',{context,url:process.env.PREVIEW_URL||'http://localhost:5174',wait:'complete'});await sleep(1500);
await evaluate('window.errors=[];window.addEventListener("error",e=>window.errors.push(e.message));window.addEventListener("unhandledrejection",e=>window.errors.push(String(e.reason)));');
async function shot(name){const {data}=await call('browsingContext.captureScreenshot',{context,origin:'document'});await writeFile(`/tmp/nyae-${name}.png`,Buffer.from(data,'base64'));}
await shot('desktop');
console.log('Desktop overflow:',await evaluate('document.documentElement.scrollWidth>innerWidth'));
await evaluate('document.querySelector("#privacy-button").click()');console.log('Privacy opened:',await evaluate('document.querySelector("dialog").open'));await evaluate('document.querySelector("dialog").close()');
await call('browsingContext.setViewport',{context,viewport:{width:390,height:844},devicePixelRatio:1});await shot('mobile');console.log('Mobile overflow:',await evaluate('document.documentElement.scrollWidth>innerWidth'));
await evaluate('document.querySelector("#demo-button").click()');await sleep(1000);await evaluate('document.querySelector("#demo-button").click()');console.log('Cancel resets:',await evaluate('!document.querySelector("#camera-center").hidden'));
await evaluate('document.querySelector("#demo-button").click()');
await sleep(3400);await shot('fists');
await sleep(3000);await shot('palms');
await sleep(3000);await shot('peace');
await sleep(20500);
console.log('Result:',await evaluate('JSON.stringify({visible:!document.querySelector("#final").hidden,saveEnabled:!document.querySelector("#save").disabled,note:document.querySelector("#final-note").textContent,errors:window.errors,pixel:[...document.querySelector("#result").getContext("2d").getImageData(270,480,1,1).data]})'));
await shot('final');
const exported=await evaluate(`(async()=>{let href;const original=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){href=this.href;};document.querySelector('#save').click();HTMLAnchorElement.prototype.click=original;if(!href)throw new Error('Export was not available');const bytes=new Uint8Array(await(await fetch(href)).arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(raw);})()`);
await writeFile('/tmp/nyae-export.webm',Buffer.from(exported,'base64'));console.log('Export bytes:',Buffer.from(exported,'base64').length);
await evaluate('document.querySelector("#audio-settings").click()');
console.log('Audio offset:',await evaluate('document.querySelector("#audio-start").value'));
await evaluate('document.querySelector("#preview-song").click()');await sleep(350);
console.log('Preview time:',await evaluate('document.querySelector("#song-preview").currentTime'));
await evaluate('document.querySelector("#close-audio").click()');
await evaluate('document.querySelector("#replay").click()');await sleep(1000);console.log('Replay canvas:',await evaluate('document.querySelector("#result").getContext("2d").getImageData(270,480,1,1).data[3]'));
await evaluate('document.querySelector("#again").click()');console.log('Reset:',await evaluate('document.querySelector("#final").hidden && document.querySelector("#counter").textContent.includes("00")'));
console.log('Gesture models:',await evaluate(`(async()=>{const {BiometricTracker}=await import('/src/tracker.js');const tracker=new BiometricTracker();await tracker.init();tracker.close();return 'loaded';})()`));
await call('browsingContext.close',{context});
}finally{await call('session.end').catch(()=>{});ws.close();}
