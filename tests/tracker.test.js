import test from 'node:test';
import assert from 'node:assert/strict';
import {BiometricTracker} from '../src/tracker.js';

test('capture and adjacent frames receive distinct integer timestamps in both models',()=>{
 const tracker=new BiometricTracker(),poseTimes=[],handTimes=[];
 tracker.pose={detectForVideo(_,time,callback){poseTimes.push(time);callback({landmarks:[]});}};
 tracker.hand={recognizeForVideo(_,time){handTimes.push(time);return {landmarks:[],gestures:[]};}};
 for(const time of [1000,1000.1,1000.1,999.9,2000.9])tracker.detect({},time);
 assert.deepEqual(poseTimes,[1000,1001,1002,1003,2000]);
 assert.deepEqual(handTimes,poseTimes);
});
