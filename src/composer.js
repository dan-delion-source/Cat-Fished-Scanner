import {loadStickers} from './assets';
import soundtrackUrl from '../assets/Nyae inchi.mp3?url';
import {EDIT_DURATION,cueAt} from './timeline';
let unlockedAudio;
export function primeAudio(){
 if(!unlockedAudio||unlockedAudio.state==='closed')unlockedAudio=new AudioContext();
 unlockedAudio.resume().catch(()=>{});
}
export class VideoComposer {
 constructor(canvas,photos,onFinish,{audioStart=9.18}={}){
 this.canvas=canvas;this.photos=photos;this.onFinish=onFinish;this.initialAudio=unlockedAudio;unlockedAudio=null;this.duration=EDIT_DURATION*1000;this.audioStart=audioStart;this.url=null;this.generation=0;
 }
 async prepare(){
 this.art=await loadStickers();
 const response=await fetch(soundtrackUrl);if(!response.ok)throw new Error('Soundtrack unavailable');
 const decodeContext=new AudioContext();
 this.music=await decodeContext.decodeAudioData(await response.arrayBuffer());
 await decodeContext.close().catch(()=>{});
 if(!this.initialAudio||this.initialAudio.state==='closed')this.initialAudio=new AudioContext();
 }
 setMuted(muted){if(this.monitor)this.monitor.gain.value=muted?0:1;}
 async play(record=false,sound=true){
  try{return await this.playWithAudio(record,sound);}catch(error){
   console.error('Audio graph failed; continuing with visual render:',error);
   this.audio?.close().catch(()=>{});this.audio=null;this.initialAudio?.close().catch(()=>{});this.initialAudio=null;
   return this.playVisualOnly(record);
  }
 }
 async playVisualOnly(record=false){
  const generation=++this.generation;cancelAnimationFrame(this.frame);
  let stream,recorder,chunks=[];
  if(record&&typeof MediaRecorder!=='undefined'&&this.canvas.captureStream){stream=this.canvas.captureStream(30);const mime=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});this.recorder=recorder;recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(this.url)URL.revokeObjectURL(this.url);this.blob=new Blob(chunks,{type:recorder.mimeType});this.url=URL.createObjectURL(this.blob);this.onFinish(this.url);};recorder.start();}
  const start=performance.now();const tick=now=>{if(generation!==this.generation)return;const elapsed=Math.min(now-start,this.duration);this.draw(elapsed);if(elapsed<this.duration)this.frame=requestAnimationFrame(tick);else if(recorder?.state==='recording')recorder.stop();else this.onFinish(this.url);};this.frame=requestAnimationFrame(tick);
 }
 async playWithAudio(record=false,sound=true){
 const generation=++this.generation;
 cancelAnimationFrame(this.frame);
 if(this.recorder?.state==='recording'){this.recorder.onstop=null;this.recorder.stop();}
 this.stream?.getTracks().forEach(t=>t.stop());
 this.audio?.close().catch(()=>{});
 this.audio=this.initialAudio||new AudioContext();this.initialAudio=null;
 await this.audio.resume();
 if(generation!==this.generation)return;
 if(this.audioStart+EDIT_DURATION>this.music.duration)throw new Error('Audio start is too late');
 this.destination=this.audio.createMediaStreamDestination();
 this.monitor=this.audio.createGain();this.monitor.gain.value=sound?1:0;this.monitor.connect(this.audio.destination);
 const track=this.audio.createBufferSource();track.buffer=this.music;
 const envelope=this.audio.createGain();track.connect(envelope);envelope.connect(this.monitor);envelope.connect(this.destination);
 this.draw(0);
 if(record&&typeof MediaRecorder!=='undefined'&&this.canvas.captureStream){
 const stream=this.canvas.captureStream(30);this.stream=stream;stream.addTrack(this.destination.stream.getAudioTracks()[0]);
 const mime=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus'].find(t=>MediaRecorder.isTypeSupported(t));
 const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});this.recorder=recorder;const chunks=[];
 recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 recorder.onstop=()=>{
 stream.getTracks().forEach(t=>t.stop());if(generation!==this.generation)return;
 if(this.url)URL.revokeObjectURL(this.url);this.blob=new Blob(chunks,{type:recorder.mimeType});this.url=URL.createObjectURL(this.blob);this.onFinish(this.url);
 };
 recorder.start();
 }else this.recorder=null;
 const start=this.audio.currentTime+.06;
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(1,start+.02);
 envelope.gain.setValueAtTime(1,start+EDIT_DURATION-.18);envelope.gain.linearRampToValueAtTime(0,start+EDIT_DURATION);
 track.start(start,this.audioStart,EDIT_DURATION);
 const tick=()=>{
 if(generation!==this.generation)return;
 const elapsed=Math.max(0,(this.audio.currentTime-start)*1000);this.draw(Math.min(elapsed,this.duration));
 if(elapsed<this.duration)this.frame=requestAnimationFrame(tick);
 else{if(this.recorder?.state==='recording')this.recorder.stop();else this.onFinish(this.url);this.audio.close().catch(()=>{});this.audio=null;}
 };
 this.frame=requestAnimationFrame(tick);
 }
 draw(ms){
  const c=this.canvas.getContext('2d'),w=this.canvas.width,h=this.canvas.height,t=Math.min(ms,10800)/1000,beat=Math.floor(ms/400),phase=(ms%400)/400;
  if(!this.art?.background||!this.art?.catEars||!this.art?.bigHeart)return;
  const bg=this.art.background;const bgScale=Math.max(w/bg.width,h/bg.height),bgW=bg.width*bgScale,bgH=bg.height*bgScale;c.drawImage(bg,(w-bgW)/2,(h-bgH)/2,bgW,bgH);
  c.strokeStyle='#ffffff88';c.lineWidth=2;for(let x=0;x<w;x+=36){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=36){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  const image=(key,x,y,size,rotation=0)=>{c.save();c.translate(x,y);c.rotate(rotation);c.drawImage(this.art[key],-size/2,-size/2,size,size);c.restore();};
  for(let i=0;i<16;i++){const x=(i*137+40)%w,y=(i*193+Math.sin(t*2+i)*20)%h;image(['star','heart','bow','cloud','flower','strawberry'][i%6],x,y,55+12*Math.sin(i+t),Math.sin(t+i)*.25);}
  const cue=cueAt(ms/1000),photo=this.photos[cue.pose],freeze=ms>=10800;
  const bounce=freeze?0:Math.sin(phase*Math.PI)*22,scale=cue.zoom+(freeze?0:Math.sin(phase*Math.PI)*.06);
  const subjectW=w*1.5,subjectH=subjectW*photo.image.height/photo.image.width,subjectX=(w-subjectW)/2,subjectY=(h-subjectH)/2;
  c.save();c.translate(w/2,h*.53-bounce);c.scale(scale,scale*(freeze?1:1+Math.sin(phase*Math.PI)*.04));c.rotate(Math.sin(t*6)*.035);c.translate(-w/2,-h*.53);
  c.save();c.translate(w,0);c.scale(-1,1);c.shadowColor='#ef8fbb';c.shadowBlur=16;c.drawImage(photo.image,subjectX,subjectY,subjectW,subjectH);c.restore();
  if(beat>=2){const nose=photo.nose||{x:.5,y:.3};const headX=subjectX+(1-nose.x)*subjectW,headY=subjectY+nose.y*subjectH;const earSize=Math.min(210,w*.48);c.globalAlpha=.96;c.drawImage(this.art.catEars,headX-earSize/2,headY-earSize*.9,earSize,earSize*.55);c.globalAlpha=1;}c.restore();
  if(!freeze&&phase<.3){c.strokeStyle='#fff9';c.lineWidth=3;for(let i=0;i<14;i++){const angle=i*Math.PI/7;c.beginPath();c.moveTo(w/2+Math.cos(angle)*260,h/2+Math.sin(angle)*320);c.lineTo(w/2+Math.cos(angle)*410,h/2+Math.sin(angle)*540);c.stroke();}}
  c.fillStyle='#fff';for(let y=8;y<h;y+=25){c.beginPath();c.arc(8,y,12,0,7);c.arc(w-8,y,12,0,7);c.fill();}
  image('bow',w/2,49,99);image('cat',63,h-75,110,-.13);image('paw',w-55,h-65,95,.16);
  c.textAlign='center';c.font='900 57px sans-serif';c.lineWidth=9;c.strokeStyle='#fff';c.fillStyle='#d74783';const label=cue.label;c.strokeText(label,w/2,h-130);c.fillText(label,w/2,h-130);
  c.font='bold 12px monospace';c.fillStyle='#8e5776';c.fillText('NYAE / VERY SERIOUS SCIENCE',w/2,h-25);
 }
 destroy(){this.generation++;cancelAnimationFrame(this.frame);this.onFinish=()=>{};if(this.recorder?.state==='recording')this.recorder.stop();this.stream?.getTracks().forEach(t=>t.stop());this.audio?.close().catch(()=>{});this.initialAudio?.close().catch(()=>{});if(this.url)URL.revokeObjectURL(this.url);}
}
