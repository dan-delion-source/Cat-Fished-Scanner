export const poses = [
 {name:'Facial mapping',label:'Face scan',instruction:'Face forward. Keep your full head inside the oval.',gesture:null,faceY:.38,hands:[]},
 {name:'Wrist calibration',label:'Wrist calibration',instruction:'Raise both fists beside your chin. Fold fingers in and gently bend wrists inward.',gesture:'Closed_Fist',faceY:.4,hands:[[.32,.56],[.68,.56]]},
 {name:'Palmar mapping',label:'Palmar mapping',instruction:'Both palms above your head, facing the camera. Keep all four fingers straight and together.',gesture:'Open_Palm',faceY:.56,hands:[[.35,.27],[.65,.27]]},
 {name:'Digit separation',label:'Digit separation',instruction:'Keep both hands above your head. Extend index and middle fingers into a V; fold the others.',gesture:'Victory',faceY:.56,hands:[[.35,.27],[.65,.27]]},
];
const distance=(a,b)=>Math.hypot((a.x-b.x)*1.6,a.y-b.y);
export function checkHandShape(hand,gesture,index,side){
 if(hand.length!==21||hand.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return 'SHOW YOUR WHOLE HAND';
 if(hand.some(p=>p.x<.025||p.x>.975||p.y<.035||p.y>.97))return 'KEEP FINGERTIPS IN FRAME';
 if(!gesture||gesture.categoryName!==poses[index].gesture||gesture.score<.55){
  return index===1?'CLOSE ALL FINGERS INTO A FIST':index===2?'OPEN PALM / STRAIGHTEN FINGERS':'EXTEND INDEX + MIDDLE FINGERS';
 }
 const palmWidth=distance(hand[5],hand[17]);
 if(palmWidth<.015)return 'TURN HAND TOWARD CAMERA';
 if(index===2&&distance(hand[8],hand[20])/palmWidth>1.38)return 'BRING FINGERS TOGETHER';
 if(index===1){
  const dx=(hand[9].x-hand[0].x)*1.6,dy=hand[9].y-hand[0].y;
  const inward=side===0?-dx:dx;
  if(inward/Math.max(.001,Math.hypot(dx,dy))<.16)return 'BEND WRIST SLIGHTLY INWARD';
 }
 return null;
}
export function evaluatePose(points,hands,index,gestures=[]){
 const fail=(message,score=0,handStates=[])=>({ok:false,message,score,handStates});
 if(!points?.length)return fail('SUBJECT NOT DETECTED');
 const nose=points[0],pose=poses[index];
 if(nose.visibility<.6)return fail('FACE NOT VISIBLE',15);
 if(Math.abs(nose.x-.5)>.12||Math.abs(nose.y-pose.faceY)>.12)return fail(index>1?'LOWER YOUR FACE INTO THE OVAL':'FACE NOT CENTERED',30);
 const faceWidth=distance(points[7],points[8]);
 if(faceWidth<.18)return fail('MOVE CLOSER',40);
 if(faceWidth>.55)return fail('MOVE BACK / KEEP FULL HEAD VISIBLE',40);
 if(index===0)return {ok:true,message:'REMAIN STILL',score:100,handStates:[]};
 const centers=hands.map(h=>({x:1-h[9].x,y:h[9].y}));
 const used=new Set(),handStates=[];
 for(let side=0;side<2;side++){
  const [x,y]=pose.hands[side];
  let nearest=-1,best=Infinity;
  centers.forEach((h,i)=>{const d=Math.hypot((h.x-x)*1.6,h.y-y);if(!used.has(i)&&d<best){nearest=i;best=d;}});
  if(nearest===-1||best>.23){handStates.push({ok:false,message:'ALIGN HAND WITH OUTLINE'});continue;}
  used.add(nearest);
  const message=checkHandShape(hands[nearest],gestures[nearest]?.[0],index,side);
  handStates.push({ok:!message,message:message||'HAND VERIFIED'});
 }
 const missing=handStates.findIndex(h=>!h.ok);
 if(missing!==-1)return fail(`${missing===0?'RIGHT':'LEFT'}: ${handStates[missing].message}`,handStates.some(h=>h.ok)?80:60,handStates);
 return {ok:true,message:'REMAIN STILL',score:100,handStates};
}
