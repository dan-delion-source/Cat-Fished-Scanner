import {FilesetResolver,PoseLandmarker,GestureRecognizer} from '@mediapipe/tasks-vision';
export class BiometricTracker {
 constructor(){this.lastTimestamp=-1;}
 async init(){
  const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
  this.pose=await PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1,outputSegmentationMasks:true});
  this.hand=await GestureRecognizer.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'},runningMode:'VIDEO',numHands:2});
 }
 detect(canvas,time,capture=false){
  // MediaPipe's mask cleanup uses integer milliseconds, including capture passes.
  time=Math.max(Math.floor(time),this.lastTimestamp+1);
  this.lastTimestamp=time;
  let output;
  this.pose.detectForVideo(canvas,time,result=>{
   output={points:result.landmarks[0],cutout:null};
   if(capture&&result.segmentationMasks?.[0]){
    const mask=result.segmentationMasks[0],data=mask.getAsFloat32Array();
    const alpha=document.createElement('canvas');alpha.width=mask.width;alpha.height=mask.height;
    const ac=alpha.getContext('2d'),pixels=ac.createImageData(mask.width,mask.height);
    for(let i=0;i<data.length;i++){pixels.data[i*4+3]=Math.max(0,Math.min(255,(data[i]-.25)*510));}
    ac.putImageData(pixels,0,0);
    const cutout=document.createElement('canvas');cutout.width=canvas.width;cutout.height=canvas.height;
    const c=cutout.getContext('2d');c.drawImage(canvas,0,0);c.globalCompositeOperation='destination-in';c.drawImage(alpha,0,0,canvas.width,canvas.height);
    output.cutout=cutout;
   }
  });
  const hands=this.hand.recognizeForVideo(canvas,time);
  output.hands=hands.landmarks;
  output.gestures=hands.gestures;
  return output;
 }
 close(){this.pose?.close();this.hand?.close();}
}
export function drawCamera(video,canvas){
 const c=canvas.getContext('2d'),w=video.videoWidth,h=video.videoHeight;
 if(!w||!h)return;
 const ratio=canvas.width/canvas.height;let sw=h*ratio,sh=h;
 if(sw>w){sw=w;sh=w/ratio;}
 c.drawImage(video,(w-sw)/2,(h-sh)/2,sw,sh,0,0,canvas.width,canvas.height);
}
