(function(){
'use strict';
const H=window.JHTS_HELPERS,L=window.JHTSLab;
const {db,t,E,button,field,input,notify,title,modal}=H;
let current='';
const lin=(k,v)=>`<div><span class="small muted">${E(t(k))}</span><div class="mono">${E(v)}</div></div>`;
function lang(){return document.documentElement.lang;}
function render(){
const first=decodeURIComponent((location.hash||'').slice(1));if(L.byId(first))current=first;if(!L.byId(current))current=db().labOrders[0]?.id||'';
let html=title('lab_results','lab_results_sub')+`<div class="band">${E(t('lab_privacy'))} ${E(t('lab_specimen_warning'))}</div><div class="section card"><h2>${E(t('lab_workflow'))}</h2><div class="toolbar"><div class="field"><label>${E(t('lab_order'))}</label><select id="lab-select" class="select">${db().labOrders.map(o=>`<option value="${E(o.id)}" ${o.id===current?'selected':''}>${E(o.id)} · ${E(o.patientId)} · ${E(L.label(o.testType,lang()))}</option>`).join('')}</select></div><div class="buttons"><a href="lab-orders.html" class="btn secondary">${E(t('lab_new_order'))}</a></div></div><div id="lab-detail"></div></div><section class="section card"><h2>${E(t('lab_event_title'))}</h2><div class="report-list">${db().labEvents.slice(0,8).map(ev=>`<div class="report-row"><span>${E(ev.orderId)} · ${E(ev.action)} · ${E(ev.details)}</span><span class="small muted">${E(ev.at.slice(0,16).replace('T',' '))}</span></div>`).join('')||`<p class="muted">${E(t('empty_activity'))}</p>`}</div></section>`;
document.getElementById('content').innerHTML=html;
document.getElementById('lab-select').addEventListener('change',e=>{current=e.target.value;location.hash=current;draw();});
draw();
}
function draw(){const o=L.byId(current),box=document.getElementById('lab-detail');if(!o){box.innerHTML=`<p>${E(t('no_records'))}</p>`;return;}
const visit=L.visit(o),a=L.appointment(o);
const record=`<div class="lab-record"><h3>${E(t('lab_order_record'))}</h3>${lin('lab_order',o.id)}${lin('patient_id',o.patientId)}${lin('name',L.patient(o)?.name||'—')}${lin('lab_visit',o.visitId)}${lin('appointment_id',a?.id||'—')}${lin('lab_test',L.label(o.testType,lang()))}${lin('lab_specimen',o.specimenId)}</div>`;
const slip=`<div class="lab-label"><h3>${E(t('lab_label'))}</h3>${lin('lab_order',o.id)}${lin('patient_id',o.slipPatientId)}${lin('lab_specimen',o.slipSpecimenId)}${lin('lab_value',String(o.slipValue)+' '+L.unit(o.testType))}</div>`;
let controls='';
if(o.status==='ordered')controls=`<div class="buttons"><button id="lab-receive" class="btn primary">${E(t('lab_receive'))}</button><button id="lab-hold" class="btn danger">${E(t('lab_hold'))}</button></div><p class="small muted">${E(t('lab_check_before'))}</p>`;
else if(o.status==='received')controls=`<p>${E(t('lab_enter_from_slip'))}</p><div class="form"><div class="field"><label>${E(t('lab_result'))} (${E(L.unit(o.testType))})</label><input id="lab-number" class="input" type="number" step="any" placeholder="${E(t('lab_value'))}"></div><button id="lab-record" class="btn primary">${E(t('lab_record'))}</button></div>`;
else if(o.status==='recorded')controls=`<p>${E(t('lab_forward_explain'))}</p><div class="form"><div class="field"><label>${E(t('lab_enter_pid'))}</label><input id="lab-confirm-patient" class="input" autocomplete="off"></div><button id="lab-forward" class="btn primary">${E(t('lab_forward'))}</button></div>`;
else if(o.status==='review')controls=`<div class="band">${E(t('lab_forwarded'))}: ${E(o.resultValue)} ${E(L.unit(o.testType))}. ${E(t('lab_forward_explain'))}</div>`;
else controls=`<div class="band warning">${E(t('lab_held'))}: ${E(t('lab_mismatch'))}</div>`;
box.innerHTML=`<div class="row-between section"><h2>${E(t('lab_order'))}: ${E(o.id)}</h2><span class="lab-status">${E(L.statusText(o.status,t))}</span></div><div class="lab-sides">${record}${slip}</div><div class="lab-action-panel">${controls}</div>`;
box.querySelector('#lab-receive')?.addEventListener('click',()=>{
 const html=field(t('lab_enter_pid'),input('patientId','','text','required autocomplete="off"'))+field(t('lab_enter_specimen'),input('specimenId','','text','required autocomplete="off"'));
 modal(t('lab_specimen_check'),html,(v,shade)=>{const r=L.receive(o.id,v.patientId,v.specimenId);if(!r.ok){notify(t(r.code==='mismatch'?'lab_cannot_receive':'lab_confirm_correct'));return;}shade.remove();render();notify(t('lab_receive_ok'));});
});
box.querySelector('#lab-hold')?.addEventListener('click',()=>{if(confirm(t('lab_mismatch'))){const r=L.hold(o.id);if(!r.ok){notify(t('lab_confirm_correct'));return;}render();notify(t('lab_hold_ok'));}});
box.querySelector('#lab-record')?.addEventListener('click',()=>{const r=L.record(o.id,box.querySelector('#lab-number').value);if(!r.ok){notify(t('lab_wrong_value'));return;}render();notify(t('lab_result_ok'));});
box.querySelector('#lab-forward')?.addEventListener('click',()=>{const r=L.forward(o.id,box.querySelector('#lab-confirm-patient').value);if(!r.ok){notify(t('lab_wrong_person'));return;}render();notify(t('lab_forward_ok'));});
}
window.JHTSPages.lab_results=render;
})();
