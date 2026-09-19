import {poses} from './poses';

// Local hand coordinates share a palm anchor at (0, 0).
export function handDrawing(index){
 if(index===1)return `<path d="M-23 84 -23 33Q-48 19-44-9L-42-28Q-37-41-25-34-20-49-7-40 2-50 13-40 24-44 30-30L34-8Q49-12 49 1L39 28 22 38 22 84Z"/><path d="M-25-32-24-6M-7-38-6-7M13-37 14-8M-36 5Q-12-8 24 1L36 12M-20 32 17 37M-17 48 17 52"/><path class="bend-arrow" d="M-56 64Q-75 24-58 1m-12 6 12-6 3 14"/>`;
 if(index===2)return `<path d="M-24 88-24 48Q-47 24-45-7L-45-73Q-45-88-32-82L-30-20-29-94Q-28-107-16-99L-14-22-13-107Q-11-120 1-111L3-22 4-96Q6-109 18-98L22-9Q35-39 46-29 50-24 44-10L30 29 23 48 24 88Z"/><path d="M-27 5Q-9-8 20 2M-24 24Q-5 34 14 17M-15 46 18 48M-43-49-33-49M-28-62-17-62M-12-68 0-68M5-60 17-60"/>`;
 return `<path d="M-25 88-25 42Q-43 24-43 2L-49-18Q-51-32-36-33L-29-17-55-100Q-59-116-43-117L-13-36 14-119Q21-134 34-125L11-28Q28-43 35-28L38-5Q51-10 53 4L44 30 25 45 25 88Z"/><path d="M-30-15Q-12-29 11-18L30 5M-38 4-20 17 15 16M-16 42 19 46M-42-77-29-81M4-79 19-75"/>`;
}
export function poseGuide(index,{mini=false}={}){
 const pose=poses[index],cy=pose.faceY*600;
 const face=`<ellipse cx="480" cy="${cy}" rx="88" ry="112"/><path d="M435 ${cy-8}q17-12 33 0m24 0q17-12 33 0M480 ${cy-2}l-9 34h18m-33 29q24 17 48 0"/><path class="face-brackets" d="M374 ${cy-116}h-15v30m227-30h15v30M359 ${cy+86}v30h15m227-30v30h-15"/>`;
 const body=index===0?'':`<path class="body-outline" d="M435 ${cy+99}v39l-112 42q-28 16-43 62m245-143v39l112 42q28 16 43 62M320 ${cy+190}l-14 155m334-155 14 155"/>`;
 const hands=pose.hands.map(([x,y],i)=>{
  const px=x*960,py=y*600,mirror=i===0?1:-1,angle=index===1?i===0?30:-30:i===0?-12:12;
  return `<g class="hand-target" data-hand="${i}"><path class="arm-guide" d="M${i===0?322:638} ${cy+175}Q${i===0?215:745} ${index===1?580:440} ${px} ${py+85}"/><g transform="translate(${px} ${py}) rotate(${angle}) scale(${mirror} 1)">${handDrawing(index)}</g>${mini?'':`<text x="${px}" y="${index===1?py+117:py+130}" text-anchor="middle">${i===0?'R':'L'} / ${index===1?'FLEX':index===2?'PALM':'V'}</text>`}</g>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600" fill="none" aria-label="${pose.instruction}">${face}${body}${hands}</svg>`;
}
