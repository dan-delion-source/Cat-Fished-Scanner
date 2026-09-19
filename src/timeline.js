export const EDIT_DURATION=12;
// The supplied edit starts at 00:09.18 in the source track. These cue points
// follow the repeated vocal syllables instead of cutting on a fixed timer.
export const editCues=[
 {at:0,pose:0,label:'NYAA!',zoom:1.1},
 {at:1.05,pose:1,label:'ICHI!',zoom:1.04},
 {at:1.75,pose:2,label:'NI!',zoom:1.07},
 {at:2.45,pose:3,label:'SAN!',zoom:1.08},
 {at:3.25,pose:1,label:'NYAA!',zoom:1.12},
 {at:4.65,pose:3,label:'ARIGATOU!',zoom:1.05},
 {at:6.05,pose:0,label:'NYAA!',zoom:1.1},
 {at:7.1,pose:1,label:'ICHI!',zoom:1.04},
 {at:7.8,pose:2,label:'NI!',zoom:1.07},
 {at:8.5,pose:3,label:'SAN!',zoom:1.08},
 {at:9.3,pose:1,label:'NYAA!',zoom:1.14},
 {at:10.65,pose:3,label:'ARIGATOU!',zoom:1.06},
];
export function cueAt(seconds){return editCues.findLast(c=>seconds>=c.at)||editCues[0];}
