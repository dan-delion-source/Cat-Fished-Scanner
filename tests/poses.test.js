import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePose,poses,checkHandShape} from '../src/poses.js';
import {cueAt,EDIT_DURATION} from '../src/timeline.js';
const points=(index=0)=>Array.from({length:33},(_,i)=>({x:i===7?.42:i===8?.58:.5,y:poses[index].faceY,visibility:1}));
function hand(side,index){
 const [screenX,y]=poses[index].hands[side],x=1-screenX;
 const h=Array.from({length:21},()=>({x,y,z:0}));
 h[0]={x:x+(side===0?.025:-.025),y:y+.09};
 h[5]={x:x-.025,y};h[17]={x:x+.025,y};
 h[8]={x:x-.025,y:y-.12};h[20]={x:x+.025,y:y-.12};
 return h;
}
const classes=index=>Array.from({length:2},()=>[{categoryName:poses[index].gesture,score:.9}]);
test('face scan checks face framing without requiring shoulders or hands',()=>{
 assert.equal(evaluatePose(null,[],0).ok,false);
 const p=points();assert.equal(evaluatePose(p,[],0).ok,true);
 p[0].x=.8;assert.equal(evaluatePose(p,[],0).message,'FACE NOT CENTERED');
 p[0].x=.5;p[7].x=.48;p[8].x=.52;assert.equal(evaluatePose(p,[],0).message,'MOVE CLOSER');
});
test('each scan requires its own gesture on both distinct hands',()=>{
 for(const index of [1,2,3]){
 const h=[hand(0,index),hand(1,index)];
 assert.equal(evaluatePose(points(index),h,index,classes(index)).ok,true);
 assert.equal(evaluatePose(points(index),h.slice(0,1),index,classes(index)).ok,false);
 assert.equal(evaluatePose(points(index),h,index,classes(index===1?2:1)).ok,false);
 assert.equal(evaluatePose(points(index),h,index,[]).ok,false);
 }
});
test('palms require fingers together; all fingertips must remain in view',()=>{
 const h=hand(0,2),g=classes(2)[0][0];h[8].x-=.08;
 assert.equal(checkHandShape(h,g,2,0),'BRING FINGERS TOGETHER');
 h[8].y=.01;assert.equal(checkHandShape(h,g,2,0),'KEEP FINGERTIPS IN FRAME');
});
test('a closed fist still needs inward wrist tilt',()=>{
 const h=hand(0,1);h[0].x=h[9].x;
 assert.equal(checkHandShape(h,classes(1)[0][0],1,0),'BEND WRIST SLIGHTLY INWARD');
});
test('overhead poses require lower head framing',()=>{
 assert.equal(evaluatePose(points(0),[hand(0,2),hand(1,2)],2,classes(2)).ok,false);
});
test('four captures supply every video cue including final freeze',()=>{
 for(let t=0;t<=EDIT_DURATION;t+=.1)assert.ok(cueAt(t).pose>=0&&cueAt(t).pose<4);
 assert.equal(cueAt(0).pose,0);assert.equal(cueAt(12).pose,3);
});
