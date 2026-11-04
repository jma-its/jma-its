(function(){
'use strict';
const H=window.JHTS_HELPERS,L=window.JHTSLab;
const {db,t,E,button,field,save,notify,title,modal}=H;
function getLang(){return document.documentElement.lang;}
function option(o){return `<option value="${E(o)}">${E(L.label(o,getLang()))}</option>`;}
function render(){
const s=db(),c=L.count();
let html=title('lab_orders','lab_orders_sub')+`<div class="band">${E(t('lab_privacy'))}</div><div class="section card"><h2>${E(t('lab_workflow'))}</h2><p>${E(t('lab_new_order_help'))}</p><p class="small muted">${E(t('lab_no_visit'))}</p><button class="btn primary" id="new-lab">＋ ${E(t('lab_new_order'))}</button></div><section class="section"><div class="lab-kpis"><div><strong>${c.total}</strong><small>${E(t('lab_order'))}</small></div><div><strong>${c.ordered}</strong><small>${E(t('lab_ordered'))}</small></div><div><strong>${c.review}</strong><small>${E(t('lab_forwarded'))}</small></div><div><strong>${c.hold}</strong><small>${E(t('lab_held'))}</small></div></div></section><section class="section"><div class="toolbar"><h2>${E(t('lab_worklist'))}</h2><input class="input" style="max-width:280px" id="lab-filter" placeholder="${E(t('find'))}"></div><div id="lab-table"></div></section><p class="footer-note">${E(t('do_not_use_real'))}</p>`;
document.getElementById('content').innerHTML=html;
document.getElementById('new-lab').addEventListener('click',newOrder);
document.getElementById('lab-filter').addEventListener('input',e=>draw(e.target.value));draw('');
}
function draw(q){const list=db().labOrders.filter(o=>([o.id,o.patientId,o.specimenId,o.visitId,L.label(o.testType,getLang())].join(' ').toLowerCase()).includes(q.trim().toLowerCase()));
document.getElementById('lab-table').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr>${['lab_order','patient_id','name','lab_visit','lab_test','lab_specimen','lab_status','actions'].map(k=>'<th>'+E(t(k))+'</th>').join('')}</tr></thead><tbody>${list.map(o=>`<tr><td class="mono">${E(o.id)}</td><td class="mono">${E(o.patientId)}</td><td>${E(L.patient(o)?.name||'—')}</td><td class="mono">${E(o.visitId)}</td><td>${E(L.label(o.testType,getLang()))}</td><td class="mono">${E(o.specimenId)}</td><td>${E(L.statusText(o.status,t))}</td><td><a class="btn mini secondary" href="lab-results.html#${encodeURIComponent(o.id)}">${E(t('lab_next_step'))}</a></td></tr>`).join('')||`<tr><td colspan="8">${E(t('no_records'))}</td></tr>`}</tbody></table></div>`;}
function newOrder(){
const visits=db().visits.filter(v=>db().appointments.find(a=>a.id===v.appointmentId)?.status==='arrived');
if(!visits.length){notify(t('lab_no_visit'));return;}
const options=visits.map(v=>`<option value="${E(v.id)}">${E(v.id)} · ${E(v.patientId)} · ${E(db().patients.find(p=>p.id===v.patientId)?.name||'')} · ${E(v.date)}</option>`).join('');
const html=field(t('lab_choose_visit'),`<select name="visitId" class="select">${options}</select>`)+field(t('lab_test'),`<select name="testType" class="select">${Object.keys(L.TYPES).map(option).join('')}</select>`);
modal(t('lab_new_order'),html,(v,shade)=>{try{const o=L.create(v.visitId,v.testType);shade.remove();render();notify(t('lab_order_saved'));}catch(e){notify(e.message==='duplicate'?t('lab_duplicate'):t('lab_bad_link'));}});
}
window.JHTSPages.lab_orders=render;
})();
