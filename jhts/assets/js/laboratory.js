/* JHTS 1.3: administrative laboratory workflow, never medical interpretation. */
(function(){
'use strict';
const TYPES={glucose:{en:'Glucose (teaching example)',ja:'グルコース（学習用）',unit:'mg/dL',value:96},hemoglobin:{en:'Hemoglobin (teaching example)',ja:'ヘモグロビン（学習用）',unit:'g/dL',value:13.8},crp:{en:'CRP (teaching example)',ja:'CRP（学習用）',unit:'mg/dL',value:0.4},urine_ph:{en:'Urine pH (teaching example)',ja:'尿pH（学習用）',unit:'pH',value:6.0}};
const db=()=>window.JHTSStore.get();
function label(type,lang){return TYPES[type]?.[lang==='ja'?'ja':'en']||type;}
function unit(type){return TYPES[type]?.unit||'';}
function patient(order){return db().patients.find(p=>p.id===order.patientId);}
function visit(order){return db().visits.find(v=>v.id===order.visitId);}
function appointment(order){const v=visit(order);return db().appointments.find(a=>a.id===v?.appointmentId);}
function event(order,action,details){db().labEvents.unshift({at:new Date().toISOString(),orderId:order.id,action,details});db().labEvents=db().labEvents.slice(0,200);window.JHTSStore.log('lab_'+action,order.id+' '+details);}
function statusText(k,t){return t('lab_'+({ordered:'ordered',received:'received',recorded:'recorded',review:'forwarded',hold:'held'}[k]||k));}
function count(){const counts={total:db().labOrders.length,ordered:0,received:0,recorded:0,review:0,hold:0};db().labOrders.forEach(o=>{counts[o.status]++;});return counts;}
function activeShift(){return !!(window.JHTSDay&&window.JHTSDay.active());}
function create(visitId,testType){
 if(activeShift())throw Error("shift active");
 const v=db().visits.find(x=>x.id===visitId),a=db().appointments.find(x=>x.id===v?.appointmentId);
 if(!v||!a||a.status!=='arrived'||!TYPES[testType])throw Error('invalid visit or test');
 if(db().labOrders.some(o=>o.visitId===visitId&&o.testType===testType&&o.status!=='hold'))throw Error('duplicate');
 const id=window.JHTSStore.uniqueId('L-',db().labOrders);
 let seq=Math.max(5100,...db().labOrders.map(o=>Number(o.specimenId.replace(/\D/g,''))||5100))+1;
 const specimenId='SP-'+seq;
 const o={id,visitId,patientId:v.patientId,testType,specimenId,slipPatientId:v.patientId,slipSpecimenId:specimenId,slipValue:TYPES[testType].value,status:'ordered',resultValue:null,holdReason:''};
 db().labOrders.push(o);event(o,'created','visit='+visitId+' test='+testType);return o;
}
function byId(id){return db().labOrders.find(o=>o.id===id);}
function receive(id,patientId,specimenId){
 if(activeShift())return {ok:false,code:"badstate"};
 const o=byId(id);if(!o||o.status!=='ordered')return {ok:false,code:'badstate'};
 if(o.slipPatientId!==o.patientId||o.slipSpecimenId!==o.specimenId)return {ok:false,code:'mismatch'};
 if(patientId.trim().toUpperCase()!==o.patientId||specimenId.trim().toUpperCase()!==o.specimenId)return {ok:false,code:'typed'};
 o.status='received';event(o,'received','label checked');return {ok:true};
}
function hold(id){if(activeShift())return {ok:false,code:"badstate"};const o=byId(id);if(!o||o.status!=='ordered')return {ok:false,code:'badstate'};if(o.slipPatientId===o.patientId&&o.slipSpecimenId===o.specimenId)return {ok:false,code:'matching'};o.status='hold';o.holdReason='Specimen label and laboratory order do not match';event(o,'held','label mismatch');return {ok:true};}
function record(id,value){if(activeShift())return {ok:false,code:"badstate"};const o=byId(id);if(!o||o.status!=='received')return {ok:false,code:'badstate'};if(String(value).trim()===''||!Number.isFinite(Number(value))||Math.abs(Number(value)-o.slipValue)>1e-6)return {ok:false,code:'wrongvalue'};o.resultValue=Number(value);o.status='recorded';event(o,'recorded',String(o.resultValue)+' '+unit(o.testType));return {ok:true};}
function forward(id,patientId){if(activeShift())return {ok:false,code:"badstate"};const o=byId(id);if(!o||o.status!=='recorded')return {ok:false,code:'badstate'};if(patientId.trim().toUpperCase()!==o.patientId)return {ok:false,code:'typed'};o.status='review';event(o,'forwarded','For qualified staff review (simulation)');return {ok:true};}
window.JHTSLab={TYPES,label,unit,patient,visit,appointment,event,statusText,count,create,byId,receive,hold,record,forward};
})();
