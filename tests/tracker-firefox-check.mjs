import {readFile} from 'node:fs/promises';
const fixture=(await readFile('/tmp/nyae-pose-fixture.jpg')).toString('base64');
const ws=new WebSocket('ws://127.0.0.1:9222/session');
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let next=0;const pending=new Map();
ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){pending.delete(m.id);m.type==='error'?p.reject(new Error(JSON.stringify(m))):p.resolve(m.result);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));});
try{
 await call('session.new',{capabilities:{alwaysMatch:{acceptInsecureCerts:true}}});
 const {context}=await call('browsingContext.create',{type:'tab'});
 await call('browsingContext.navigate',{context,url:process.env.PREVIEW_URL||'http://localhost:5174',wait:'complete'});
 const result=await call('script.evaluate',{target:{context},awaitPromise:true,expression:`(async()=>{
 const {BiometricTracker}=await import('/src/tracker.js');
 const tracker=new BiometricTracker();await tracker.init();
 const image=new Image();image.src='data:image/jpeg;base64,${fixture}';await image.decode();
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;canvas.getContext('2d').drawImage(image,0,0,960,600);
 const frames=[];
 try{for(const [time,capture] of [[1000,false],[1000.1,true],[2000,false],[2100,false],[2100,true],[3100,false],[3200,true],[4100,false],[4200,true],[5100,false]]){
 try{const r=tracker.detect(canvas,time,capture);frames.push({time,capture,points:r.points?.length,hands:r.hands.length,cutout:!!r.cutout});}catch(e){frames.push({time,error:String(e),stack:e.stack});break;}
 }}finally{tracker.close();}
 return JSON.stringify(frames);
 })()`});
 if(result.type==='exception')throw new Error(JSON.stringify(result));
 const frames=JSON.parse(result.result.value);
 console.log(JSON.stringify(frames));
 if(frames.some(f=>f.error)||frames.filter(f=>f.cutout).length!==4||frames.at(-1).points!==33)throw new Error('Real capture regression failed');
 const recovery=await call('script.evaluate',{target:{context},awaitPromise:true,userActivation:true,expression:`(async()=>{
 const {BiometricTracker}=await import('/src/tracker.js');
 const {poses}=await import('/src/poses.js');
 const init=BiometricTracker.prototype.init,detect=BiometricTracker.prototype.detect;
 const getUserMedia=navigator.mediaDevices.getUserMedia;
 const camera=document.createElement('canvas');camera.width=960;camera.height=600;
 let draw=0;const paint=setInterval(()=>{const c=camera.getContext('2d');c.fillStyle='rgb('+(draw++%255)+',50,80)';c.fillRect(0,0,960,600);},40);
 let interrupted=false,calls=0;
 BiometricTracker.prototype.init=async function(){};
 BiometricTracker.prototype.detect=function(_,time,capture){
 calls++;
 const index=[...document.querySelectorAll('.pose-row')].findIndex(el=>el.classList.contains('active'));
 if(index===1&&!interrupted){interrupted=true;throw new Error('Test sensor interruption');}
 const points=Array.from({length:33},(_,i)=>({x:i===7?.42:i===8?.58:.5,y:poses[index].faceY,visibility:1}));
 return {points,hands:[],gestures:[],cutout:capture?camera:null};
 };
 navigator.mediaDevices.getUserMedia=async()=>camera.captureStream(30);
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 try{
 document.querySelector('#sound').click();document.querySelector('#start').click();
 for(let i=0;i<100&&document.querySelector('#demo-button').textContent!=='Resume scan';i++)await sleep(100);
 const before=document.querySelector('#counter').textContent;
 if(document.querySelector('#demo-button').textContent!=='Resume scan')throw new Error('Recovery action not shown: '+JSON.stringify({calls,before,status:document.querySelector('#status').textContent,button:document.querySelector('#start').textContent,videoTime:document.querySelector('#camera').currentTime,videoPaused:document.querySelector('#camera').paused}));
 document.querySelector('#demo-button').click();await sleep(800);
 const after=document.querySelector('#counter').textContent;
 const active=document.querySelector('.pose-row.active h3').textContent;
 if(!before.includes('01')||before!==after||active!=='Wrist calibration'||document.querySelector('#demo-button').textContent!=='Cancel scan')throw new Error('Resume did not preserve the current scan');
 document.querySelector('#demo-button').click();return 'First photo retained; wrist calibration resumed';
 }finally{clearInterval(paint);BiometricTracker.prototype.init=init;BiometricTracker.prototype.detect=detect;navigator.mediaDevices.getUserMedia=getUserMedia;}
 })()`});
 if(recovery.type==='exception')throw new Error(JSON.stringify(recovery));
 console.log(recovery.result.value);
 await call('browsingContext.close',{context});
}finally{await call('session.end').catch(()=>{});ws.close();}
