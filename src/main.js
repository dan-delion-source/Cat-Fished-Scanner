import './style.css';
import {createIcons,ScanFace,ArrowUpRight,ArrowRight,ShieldCheck,AudioLines,VolumeX,Maximize,Camera,Check,RotateCcw,Download,Play,X,ChevronRight,Fingerprint,Activity,Focus,Hand,Lock} from 'lucide';
import {poses,evaluatePose} from './poses';
import {poseGuide,handDrawing} from './pose-guide';
import soundtrackUrl from '../assets/Nyae inchi.mp3?url';
import {BiometricTracker,drawCamera} from './tracker';
import {VideoComposer,primeAudio} from './composer';
const $=s=>document.querySelector(s);
const icon=name=>`<i data-lucide="${name}"></i>`;
const icons=()=>createIcons({icons:{ScanFace,ArrowUpRight,ArrowRight,ShieldCheck,AudioLines,VolumeX,Maximize,Camera,Check,RotateCcw,Download,Play,X,ChevronRight,Fingerprint,Activity,Focus,Hand,Lock}});
let audioStart=9.18;
let state='idle',index=0,photos=[],stream,tracker,loop,stable=0,last=0,frameTime=-1,demo=false,sound=true,composer,runId=0;
const mobileDevice=matchMedia('(max-width: 700px)').matches||((navigator.hardwareConcurrency||8)<=4);
const detectInterval=mobileDevice?170:120;
const source=document.createElement('canvas');source.width=960;source.height=600;
document.querySelector('#app').innerHTML=`
<header class="topbar"><a class="brand" href="/" aria-label="NYAE home"><span class="brand-icon">${icon('scan-face')}</span>nyæ<span class="brand-divider"></span><span class="brand-sub">HUMAN INTERFACE LAB</span></a><div class="header-right"><span class="online-dot"></span><span>SYSTEM OPERATIONAL</span><span class="version">V.02.16</span><button class="icon-button" id="sound" aria-label="Mute sound" title="Mute sound">${icon('audio-lines')}</button></div></header>
<main><section class="title-row"><div><div class="eyebrow"><span class="tiny-cross">+</span> EXPERIMENT 004 / HUMAN SIGNAL</div><h1>A little more human.</h1><p>Four scans. One biometric signature. Let’s see what makes you, you.</p></div><div class="session-id">SESSION <span>NY–00842</span><small>SECURE LOCAL ENVIRONMENT ${icon('lock')}</small></div></section>
<section class="workspace"><aside class="left-panel"><div class="section-label">SCAN PROTOCOL <span>01—04</span></div><div id="pose-list"></div><div class="spec-block"><span class="micro">CAPTURE PARAMETERS</span><div>Framing <b>Head to mid-chest</b></div><div>Sequence <b>4 still frames</b></div><div>Processing <b>On-device</b></div></div><div class="little-note"><span class="note-cross">+</span><p>Every human is a little<br>unexpected.</p><span class="secret-pixel"></span></div></aside>
<div class="camera-column"><div class="camera-shell" id="camera-shell"><div class="viewport" id="viewport"><video id="camera" autoplay muted playsinline></video><canvas id="demo-canvas" width="960" height="600"></canvas><div class="grid"></div><div class="camera-top"><span><span class="online-dot"></span> <span id="feed-label">OPTICAL SENSOR / STANDBY</span></span><span>CAM_01</span></div><div class="side-coordinate">Y 0.500<br>X 0.500</div><div class="guide" id="guide"></div><canvas id="landmarks" width="960" height="600"></canvas><div class="scan-line"></div><div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div><div class="camera-center" id="camera-center"><span class="sensor-icon">${icon('scan-face')}</span><h2>Ready when you are.</h2><p>Step into the frame.<br>We’ll take it from here.</p><button class="primary" id="start">${icon('camera')} Enable camera ${icon('arrow-right')}</button><span class="permission-note">CAMERA ACCESS REQUIRED</span></div><div id="countdown"></div><div id="flash"></div><div class="camera-bottom"><span id="alignment">AWAITING SUBJECT</span><button class="icon-button" id="fullscreen" title="Expand camera" aria-label="Expand camera">${icon('maximize')}</button></div></div><div class="camera-status"><span><span class="status-square"></span><span id="status">Camera is offline</span></span><span id="resolution">LANDSCAPE · 8:5</span></div></div><div class="pose-instruction" id="pose-instruction"></div><div class="hand-feedback" id="hand-feedback" hidden></div><div class="capture-caption"><span>${icon('camera')} 4 photos captured automatically. No continuous recording.</span><button id="demo-button">Try demo ${icon('arrow-up-right')}</button></div><div class="sequence-bar"><span id="sequence-label">SEQUENCE PROGRESS</span><div id="segments">${poses.map(()=>'<span></span>').join('')}</div><b id="counter">00 <span>/ 04</span></b></div></div>
<aside class="right-panel"><div class="section-label">LIVE DIAGNOSTICS ${icon('activity')}</div><div class="diagnostic-main"><div class="radar"><div class="radar-orbit"></div>${icon('fingerprint')}</div><span id="diag-title">Awaiting input</span><small id="diag-sub">SENSORS READY</small></div><div class="metrics"><div><span>Face recognition</span><b id="face-metric">—</b></div><div><span>Body alignment</span><b id="body-metric">—</b></div><div><span>Hand landmarks</span><b id="hand-metric">—</b></div></div><div class="confidence"><div><span>SIGNAL CONFIDENCE</span><b id="confidence">0%</b></div><div class="confidence-track"><span id="confidence-fill"></span></div></div><div class="system-log"><span class="micro">SYSTEM LOG</span><div id="log"><p><time>00:00</time> Interface initialized</p><p><time>00:00</time> Local engine ready</p><p class="muted"><time>00:00</time> Waiting for camera access<span class="cursor">_</span></p></div></div><div class="privacy">${icon('shield-check')}<div><b>Your face. Your device.</b><p>Photos stay in your browser.<br>Nothing is uploaded or stored.</p><button id="privacy-button">Privacy protocol ${icon('arrow-up-right')}</button></div></div></aside></section>
<footer><span>NYÆ RESEARCH SYSTEMS <span class="footer-slash">/</span> BUILT FOR THE UNEXPECTED</span><span><span class="online-dot"></span> ALL SYSTEMS NOMINAL <span class="footer-spark">✳</span></span></footer></main>
<dialog id="privacy-dialog"><button class="icon-button close-dialog" aria-label="Close">${icon('x')}</button>${icon('shield-check')}<h2>Your photos stay here.</h2><p>Camera access is used for live pose guidance. Only four still frames are kept in browser memory. Detection and background removal run on your device.</p><p>Detection models download from Google and jsDelivr. Camera images are never sent to those services. Your downloadable video records only the finished animation, with your selected soundtrack.</p><p>Create Again clears your captured frames. Closing this page clears the session.</p><button class="primary close-dialog">Understood ${icon('check')}</button></dialog>
<div id="reveal" hidden></div><section id="final" hidden><div class="final-eyebrow">EXPERIMENT 004 / UNEXPECTED RESULT</div><h1>NYAA TRANSFORMATION COMPLETE ♡</h1><p>Turns out your biometric signature is ridiculously cute.</p><div class="result-frame"><canvas id="result" width="540" height="960"></canvas></div><div class="final-actions"><button id="replay">${icon('play')} Replay</button><button id="again">${icon('rotate-ccw')} Create again</button><button id="audio-settings" title="Preview soundtrack and adjust timing">${icon('audio-lines')} Audio</button><button class="primary" id="save" disabled>${icon('download')} Rendering…</button></div><small id="final-note">COMPOSED ON YOUR DEVICE. CERTIFIED 100% YOU.</small></section>`;
function renderPoses(){ $('#pose-list').innerHTML=poses.map((p,i)=>`<div class="pose-row ${i===index?'active':''} ${i<photos.length?'complete':''}"><div class="pose-number">${i<photos.length?icon('check'):String(i+1).padStart(2,'0')}</div><div><span class="micro">POSE ${String(i+1).padStart(2,'0')}</span><h3>${p.name}</h3><span class="pose-mini">${poseGuide(i,{mini:true})}</span><small>${i<photos.length?'Frame acquired':i===index?'Awaiting capture':'Pending'}</small></div>${i===index?icon('chevron-right'):''}</div>`).join('');icons();drawGuide();}
function drawGuide(){
 $('#pose-instruction').removeAttribute('title');
 prepareDemo();
 $('#guide').innerHTML=poseGuide(index);
 $('#pose-instruction').textContent=poses[index].instruction;
 $('#hand-feedback').hidden=index===0;
 $('#hand-feedback').innerHTML='<span data-feedback="0">RIGHT / SEARCHING</span><span data-feedback="1">LEFT / SEARCHING</span>';
}
function log(message){const p=document.createElement('p');p.innerHTML=`<time>${String(photos.length).padStart(2,'0')}:00</time> ${message}`;$('#log').append(p);while($('#log').children.length>4)$('#log').firstChild.remove();}
function setStatus(message){$('#alignment').textContent=message;$('#status').textContent=message.toLowerCase().replaceAll('_',' ');}
async function start(isDemo=false){
 if(sound){try{primeAudio();}catch{}}
 const token=++runId;demo=isDemo;state='loading';$('#start').disabled=true;$('#start').textContent=isDemo?'Initializing demo…':'Initializing sensors…';$('#demo-button').disabled=true;
 try{
 if(!demo){if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera requires localhost or HTTPS.');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:800},aspectRatio:{ideal:1.6}},audio:false});$('#camera').srcObject=stream;await $('#camera').play();setStatus('LOADING LOCAL DETECTION MODELS');tracker=new BiometricTracker();await tracker.init();}
 if(token!==runId)return;state='scanning';$('#camera-center').hidden=true;$('#viewport').classList.add('running');$('#demo-canvas').style.display=demo?'block':'none';$('#feed-label').textContent=demo?'DEMO SIMULATION / NO CAMERA':'OPTICAL SENSOR / LIVE';$('#diag-title').textContent='Acquiring subject';$('#diag-sub').textContent=demo?'SIMULATED TELEMETRY':'LOCAL INFERENCE ACTIVE';$('#demo-button').textContent='Cancel scan';$('#demo-button').disabled=false;log(demo?'Demo sequence started':'Camera connection established');stable=0;last=0;loop=requestAnimationFrame(tick);
 }catch(e){stream?.getTracks().forEach(t=>t.stop());tracker?.close();tracker=null;state='idle';$('#start').disabled=false;$('#start').innerHTML=`${icon('camera')} Retry camera ${icon('arrow-right')}`;$('#demo-button').disabled=false;setStatus(e.name==='NotAllowedError'?'CAMERA ACCESS DENIED': 'SENSOR INITIALIZATION FAILED');$('#camera-center p').textContent=e.name==='NotAllowedError'?'Allow camera access in your browser, or try the demo.':`${e.message} You can still try the demo.`;icons();}
}
let demoIllustration;
function prepareDemo(){
 const cy=poses[index].faceY*600;
 const body=`<path fill="#a5bbab" d="M290 600Q290 ${cy+130} 480 ${cy+130} 670 ${cy+130} 670 600Z"/><path fill="#efd0bb" d="M444 ${cy+85}h72v85h-72Z"/><ellipse fill="#efd0bb" cx="480" cy="${cy}" rx="88" ry="112"/><path fill="#343d38" d="M390 ${cy+18}v-87q0-70 90-70t90 70v87h-20v-83q-88 27-140-4v87Z"/><path stroke="#6b554f" stroke-width="5" fill="none" d="M440 ${cy+2}h16m48 0h16M459 ${cy+47}q21 15 42 0"/>`;
 const hands=poses[index].hands.map(([x,y],i)=>`<path stroke="#a5bbab" stroke-width="53" fill="none" stroke-linecap="round" d="M${i?638:322} ${cy+175}Q${i?745:215} ${index===1?580:440} ${x*960} ${y*600+60}"/><g fill="#efd0bb" stroke="#8d7061" stroke-width="3" stroke-linejoin="round" transform="translate(${x*960} ${y*600}) rotate(${index===1?i? -30:30:i?12:-12}) scale(${i?-1:1} 1)">${handDrawing(index)}</g>`).join('');
 demoIllustration=new Image();demoIllustration.src='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600">${body}${hands}</svg>`);
}
function demoSubject(){
 if(!demoIllustration?.complete||!demoIllustration.naturalWidth)return;
 const c=source.getContext('2d');c.clearRect(0,0,960,600);c.save();c.translate(960,0);c.scale(-1,1);c.drawImage(demoIllustration,0,0,960,600);c.restore();
 const preview=$('#demo-canvas').getContext('2d');preview.clearRect(0,0,960,600);preview.drawImage(source,0,0);
}
function tick(now){if(state!=='scanning'||document.hidden)return;loop=requestAnimationFrame(tick);if(now-last<detectInterval)return;last=now;let result;
 try{if(demo){demoSubject();result={points:null,hands:[]};}else{if($('#camera').currentTime===frameTime)return;frameTime=$('#camera').currentTime;drawCamera($('#camera'),source);result=tracker.detect(source,now);}
 const check=demo?{ok:true,message:'REMAIN STILL',score:100}:evaluatePose(result.points,result.hands,index,result.gestures);
 (check.handStates?.length?check.handStates:poses[index].hands.map(()=>({ok:demo,message:demo?'SIMULATED':'SEARCHING'}))).forEach((hand,i)=>{
 const target=$(`[data-hand="${i}"]`),label=$(`[data-feedback="${i}"]`);
 target?.classList.toggle('hand-locked',hand.ok);if(label){label.classList.toggle('verified',hand.ok);label.textContent=`${i===0?'RIGHT':'LEFT'} / ${hand.message}`;}
 });
 $('#guide').classList.toggle('locked',check.ok);$('#confidence').textContent=check.score+'%';$('#confidence-fill').style.width=check.score+'%';$('#face-metric').textContent=demo?'DEMO':result.points?'ACQUIRED':'SEARCHING';$('#body-metric').textContent=check.score>=55?'ALIGNED':'SEARCHING';$('#hand-metric').textContent=demo?'SIMULATED':`${result.hands.length} / 2`;
 const c=$('#landmarks').getContext('2d');c.clearRect(0,0,960,600);c.strokeStyle='#b9ffd5';c.lineWidth=1.5;for(const hand of result.hands){for(const chain of [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[17,0]]){c.beginPath();chain.forEach((j,k)=>{const p=hand[j];k?c.lineTo((1-p.x)*960,p.y*600):c.moveTo((1-p.x)*960,p.y*600);});c.stroke();}}c.fillStyle='#b9ffd5';[...(result.points?.slice(0,13)||[]),...result.hands.flat()].forEach(p=>{c.beginPath();c.arc((1-p.x)*960,p.y*600,2.2,0,7);c.fill();});
 if(check.ok){if(!stable)stable=now;const remaining=2-Math.floor((now-stable)/1000);$('#countdown').textContent=remaining>0?remaining:'';setStatus(`${poses[index].name.toUpperCase()} / REMAIN STILL`);$('#diag-title').textContent='Subject aligned';if(now-stable>=2000)capture(now,result);}else{stable=0;$('#countdown').textContent='';setStatus(check.message);$('#diag-title').textContent='Adjust alignment';}
 }catch(e){pauseTracking(e);}}
function pauseTracking(error){
 cancelAnimationFrame(loop);state='error';stable=0;$('#countdown').textContent='';
 $('#guide').classList.remove('locked');document.querySelectorAll('.hand-locked').forEach(el=>el.classList.remove('hand-locked'));
 const timing=/timestamp/i.test(error.message||'');
 setStatus(timing?'SENSOR TIMING CONFLICT / RESUME SCAN':'TRACKING PAUSED / RESUME SCAN');
 $('#pose-instruction').textContent=timing?'Sensor timing was interrupted. Resume scan to continue from this pose.':'Tracking paused. Resume scan to continue from this pose; completed photos are kept.';
 $('#pose-instruction').title=error.message||String(error);
 $('#demo-button').textContent='Resume scan';$('#demo-button').disabled=false;
 console.error('Biometric tracking failed:',error);log(timing?'Sensor timing conflict':'Tracking paused');
}
async function resumeTracking(){
 const token=runId;state='recovering';$('#demo-button').disabled=true;setStatus('RECONNECTING LOCAL SENSORS');
 let replacement;
 try{
 tracker?.close();tracker=null;replacement=new BiometricTracker();await replacement.init();
 if(token!==runId){replacement.close();return;}
 tracker=replacement;frameTime=-1;last=0;stable=0;drawGuide();$('#pose-instruction').removeAttribute('title');
 $('#demo-button').textContent='Cancel scan';$('#demo-button').disabled=false;state='scanning';log('Scan resumed / frames retained');loop=requestAnimationFrame(tick);
 }catch(error){replacement?.close();if(token===runId)pauseTracking(error);}
}
function capture(now,result){
 let image;if(demo){image=document.createElement('canvas');image.width=960;image.height=600;image.getContext('2d').drawImage(source,0,0);}else{const shot=tracker.detect(source,now,true);image=shot.cutout;if(!image){stable=0;setStatus('SUBJECT ISOLATION PENDING');return;}}
 photos.push({image,nose:result.points?.[0]||{x:.5,y:poses[index].faceY}});state='transition';$('#countdown').textContent='';$('#flash').classList.add('fire');setStatus('POSE VERIFIED / FRAME ACQUIRED');log(`Biometric frame 0${photos.length} acquired`);$('#counter').innerHTML=`0${photos.length} <span>/ 04</span>`;[...$('#segments').children].forEach((el,i)=>el.classList.toggle('done',i<photos.length));const token=runId;
 setTimeout(()=>{if(token!==runId)return;$('#flash').classList.remove('fire');if(photos.length===poses.length){reveal();return;}index++;renderPoses();$('#status').textContent=poses[index].instruction;stable=0;state='scanning';loop=requestAnimationFrame(tick);},900);
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function reveal(){state='reveal';cancelAnimationFrame(loop);stream?.getTracks().forEach(t=>t.stop());tracker?.close();tracker=null;const token=runId;$('#reveal').hidden=false;$('#reveal').innerHTML='<span class="micro">ALL FRAMES ACQUIRED</span><h2>BIOMETRIC SEQUENCE<br>COMPLETE</h2><div class="reveal-loader"></div>';await delay(1600);if(token!==runId)return;$('#reveal').classList.add('malfunction');$('#reveal').innerHTML='<span class="micro">ERROR CODE: TOO_CUTE</span><h2>UNAUTHORIZED<br>NYAA PROTOCOL<br>DETECTED</h2><p>Wait. That’s not in the protocol.</p>';await delay(2100);if(token!==runId)return;$('#reveal').hidden=true;document.body.classList.add('final-mode');$('#final').hidden=false;$('#final-note').textContent=demo?'DEMO RESULT / ILLUSTRATED SUBJECT / NO PHOTOS CAPTURED':'COMPOSED ON YOUR DEVICE. CERTIFIED 100% YOU.';composer=new VideoComposer($('#result'),photos,url=>{state='finished';$('#save').disabled=!url;$('#save').innerHTML=`${icon('download')} ${url?'Save video':'Export unavailable'}`;icons();},{audioStart});try{await composer.prepare();if(token!==runId)return;state='playing';await composer.play(true,sound);}catch(e){state='finished';$('#final-note').textContent='Audio could not start. Use Replay to retry.';$('#save').textContent='Export unavailable';}icons();}
function reset(){runId++;cancelAnimationFrame(loop);stream?.getTracks().forEach(t=>t.stop());tracker?.close();tracker=null;composer?.destroy();composer=null;photos=[];index=0;stable=0;frameTime=-1;state='idle';document.body.classList.remove('final-mode');$('#final').hidden=true;$('#reveal').hidden=true;$('#reveal').classList.remove('malfunction');$('#camera-center').hidden=false;$('#viewport').classList.remove('running');$('#demo-canvas').style.display='none';$('#camera').srcObject=null;$('#landmarks').getContext('2d').clearRect(0,0,960,600);$('#countdown').textContent='';$('#flash').classList.remove('fire');$('#start').disabled=false;$('#start').innerHTML=`${icon('camera')} Enable camera ${icon('arrow-right')}`;$('#camera-center p').innerHTML='Step into the frame.<br>We’ll take it from here.';$('#demo-button').innerHTML=`Try demo ${icon('arrow-up-right')}`;$('#demo-button').disabled=false;$('#counter').innerHTML='00 <span>/ 04</span>';[...$('#segments').children].forEach(el=>el.classList.remove('done'));$('#save').disabled=true;$('#save').innerHTML=`${icon('download')} Rendering…`;$('#confidence').textContent='0%';$('#confidence-fill').style.width='0%';['face-metric','body-metric','hand-metric'].forEach(id=>$('#'+id).textContent='—');$('#diag-title').textContent='Awaiting input';$('#diag-sub').textContent='SENSORS READY';$('#feed-label').textContent='OPTICAL SENSOR / STANDBY';setStatus('AWAITING SUBJECT');renderPoses();}
$('#start').onclick=()=>start();$('#demo-button').onclick=()=>state==='idle'?start(true):state==='error'?resumeTracking():reset();$('#again').onclick=reset;$('#replay').onclick=()=>{if(state==='finished'){state='playing';composer.play(false,sound).catch(()=>{state='finished';$('#final-note').textContent='Audio could not start. Try Replay again.';});}};$('#save').onclick=()=>{if(composer?.url){const a=document.createElement('a');a.href=composer.url;a.download=`nyae-transformation.${composer.blob.type.includes('mp4')?'mp4':'webm'}`;a.click();}};
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){cancelAnimationFrame(loop);return;}
 if(state==='scanning'){last=0;loop=requestAnimationFrame(tick);}
});
$('#sound').onclick=()=>{sound=!sound;$('#sound').innerHTML=icon(sound?'audio-lines':'volume-x');$('#sound').title=sound?'Mute sound':'Enable sound';$('#sound').setAttribute('aria-label',$('#sound').title);composer?.setMuted(!sound);icons();};$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#camera-shell').requestFullscreen();}catch{setStatus('FULLSCREEN UNAVAILABLE');}};$('#privacy-button').onclick=()=>$('#privacy-dialog').showModal();document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>$('#privacy-dialog').close());window.addEventListener('pagehide',()=>{stream?.getTracks().forEach(t=>t.stop());tracker?.close();composer?.destroy();photos=[];});renderPoses();

const audioDialog=document.createElement('dialog');audioDialog.id='audio-dialog';
audioDialog.innerHTML=`<button class="icon-button" id="close-audio" aria-label="Close audio settings">${icon('x')}</button><span class="micro">AUDIO CALIBRATION</span><h2>Nyae inchi</h2><audio id="song-preview" controls preload="metadata" src="${soundtrackUrl}"></audio><label class="audio-offset" for="audio-start">Edit start <span><input id="audio-start" type="number" min="0" max="19" step="0.1" value="9.18"> sec</span></label><div class="audio-actions"><button id="preview-song">${icon('play')} Preview from start</button><button class="primary" id="apply-audio">${icon('check')} Apply & render</button></div>`;
document.body.append(audioDialog);
const previewAudio=$('#song-preview');
$('#audio-settings').onclick=()=>audioDialog.showModal();
$('#close-audio').onclick=()=>audioDialog.close();
audioDialog.addEventListener('close',()=>previewAudio.pause());
$('#preview-song').onclick=()=>{const value=Number($('#audio-start').value);if(!Number.isFinite(value)||value<0||value>19)return;previewAudio.currentTime=value;previewAudio.play().catch(()=>{});};
previewAudio.addEventListener('timeupdate',()=>{if(previewAudio.currentTime>=Number($('#audio-start').value)+12)previewAudio.pause();});
$('#apply-audio').onclick=async()=>{
 const value=Number($('#audio-start').value);if(!Number.isFinite(value)||value<0||value>19){$('#audio-start').reportValidity();return;}
 audioStart=value;audioDialog.close();if(!composer)return;
 composer.audioStart=value;state='playing';$('#save').disabled=true;$('#save').innerHTML=`${icon('download')} Rendering…`;icons();
 try{await composer.play(true,sound);}catch{state='finished';$('#final-note').textContent='Audio could not start. Try Replay again.';}
};
icons();
