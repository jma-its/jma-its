/* JHTS 1.4 educational medical accounting: synthetic fee points, NOT a real claims engine. */
(function(){
'use strict';
const CATALOG={first_visit:{points:120},followup:{points:80},lab_glucose:{points:70},lab_hemoglobin:{points:90},lab_crp:{points:65},lab_urine_ph:{points:40}};
const db=()=>window.JHTSStore.get();
const getBill=id=>db().bills.find(b=>b.id===id);
const visit=id=>db().visits.find(v=>v.id===id);
const ins=pid=>db().insurance.find(i=>i.patientId===pid);
const dayBusy=()=>Boolean(window.JHTSDay?.active());
const total=b=>b.lines.reduce((s,l)=>s+l.points*10,0);
function sums(b){const gross=total(b),due=Math.round(gross*b.rate/100),paid=b.payments.reduce((sum,p)=>sum+p.amount,0);return {points:gross/10,gross,due,insurer:gross-due,paid,balance:due-paid};}
function state(b){if(b.status==='draft')return 'bill_draft';const n=sums(b);if(n.balance===0)return 'bill_paid';return n.paid>0?'bill_partial':'bill_issued';}
function evt(b,action,details){db().billingEvents.unshift({at:new Date().toISOString(),billId:b.id,action,details});db().billingEvents=db().billingEvents.slice(0,200);window.JHTSStore.log('billing_'+action,b.id+' '+details);}
function allowedVisit(vId){const v=visit(vId);const appt=db().appointments.find(a=>a.id===v?.appointmentId);const insurance=ins(v?.patientId);return !!(v&&appt&&appt.patientId===v.patientId&&appt.status==='arrived'&&insurance&&insurance.status==='verified'&&[10,20,30].includes(insurance.trainingRate));}
function create(vId){if(dayBusy()||!allowedVisit(vId)||db().bills.some(b=>b.visitId===vId))throw Error('not eligible');const v=visit(vId),rate=ins(v.patientId).trainingRate;
 const b={id:window.JHTSStore.uniqueId('B-',db().bills),visitId:vId,patientId:v.patientId,rate,status:'draft',lines:[],payments:[],createdAt:new Date().toISOString(),issuedAt:''};db().bills.push(b);evt(b,'created',vId+' share='+rate+'%');return b;}
function options(b){if(!b||b.status!=='draft')return [];
 const haveBase=b.lines.some(l=>['first_visit','followup'].includes(l.code));const opts=[];
 if(!haveBase)for(const c of ['first_visit','followup'])opts.push({value:c,label:c,points:CATALOG[c].points});
 for(const o of db().labOrders){if(o.visitId===b.visitId&&o.patientId===b.patientId&&o.status==='review'&&!b.lines.some(l=>l.labOrderId===o.id)){
  const code='lab_'+o.testType;if(CATALOG[code])opts.push({value:code+'|'+o.id,label:code+' ('+o.id+')',points:CATALOG[code].points});
 }}return opts;
}
function add(bId,selected){if(dayBusy())throw Error('busy');const b=getBill(bId);if(!b||b.status!=='draft')throw Error('not a draft');const opt=options(b).find(x=>x.value===selected);if(!opt)throw Error('not eligible');const [code,labOrderId]=selected.split('|');b.lines.push({code,points:CATALOG[code].points,labOrderId:labOrderId||''});evt(b,'service_added',selected);return b;}
function remove(bId,index){if(dayBusy())throw Error('busy');const b=getBill(bId);if(!b||b.status!=='draft'||!Number.isInteger(index)||index<0||index>=b.lines.length)throw Error('invalid');const [l]=b.lines.splice(index,1);evt(b,'service_removed',l.code);return b;}
function issue(bId){if(dayBusy())throw Error('busy');const b=getBill(bId);if(!b||b.status!=='draft'||!b.lines.length||!allowedVisit(b.visitId)||ins(b.patientId).trainingRate!==b.rate)throw Error('invoice cannot issue');
 if(!b.lines.some(l=>['first_visit','followup'].includes(l.code)))throw Error('base consultation missing');
 for(const l of b.lines){if(l.labOrderId&&!db().labOrders.some(o=>o.id===l.labOrderId&&o.visitId===b.visitId&&o.patientId===b.patientId&&o.status==='review'))throw Error('lab evidence changed');}
 b.status='issued';b.issuedAt=new Date().toISOString();evt(b,'issued',sums(b).due+' yen patient share');return b;}
function refreshRate(bId){if(dayBusy())throw Error('busy');const b=getBill(bId);const i=ins(b?.patientId);if(!b||b.status!=='draft'||!i||i.status!=='verified'||![10,20,30].includes(i.trainingRate))throw Error('bad rate');b.rate=i.trainingRate;evt(b,'rate_refreshed',String(i.trainingRate)+'%');return b;}
function discard(bId){if(dayBusy())throw Error('busy');const b=getBill(bId);if(!b||b.status!=='draft'||b.payments.length)throw Error('cannot cancel');const index=db().bills.findIndex(x=>x.id===bId);evt(b,'draft_cancelled',b.visitId);db().bills.splice(index,1);return true;}
function pay(bId,amount,method){if(dayBusy())throw Error('busy');const b=getBill(bId);const n=Number(amount);if(!b||b.status!=='issued'||!Number.isSafeInteger(n)||n<=0||n>sums(b).balance||!['cash','card'].includes(method))throw Error('invalid payment');
 b.payments.push({id:window.JHTSStore.uniqueId('PM-',db().bills.flatMap(x=>x.payments)),amount:n,method,at:new Date().toISOString()});evt(b,'payment',String(n)+' yen / '+method);return b;}
function label(code,t){return t('bill_'+code);}
window.JHTSBilling={CATALOG,getBill,visit,ins,allowedVisit,options,create,add,remove,refreshRate,discard,issue,pay,sums,state,label};
})();
