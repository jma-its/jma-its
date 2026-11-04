(function(){
'use strict';
const {db,t,E,button,title,notify,log}=window.JHTS_HELPERS;
let session=null;
function question(i){const catalog=Object.entries(window.JHTSBilling.CATALOG);const seed=(Math.random()*10000000)|0;const pts=catalog[(seed+i)%catalog.length][1].points+catalog[(seed+i+2)%catalog.length][1].points;return {points:pts,rate:[10,20,30][(seed+i)%3]};}
function render(){const q=session&&session.tasks[session.idx];
 document.getElementById('content').innerHTML=title('bp_title','bp_desc')+`<div class="band warning">${E(t('bp_rule'))}</div><div class="section card"><h2>${E(t('bp_title'))}</h2>${!session?`${button(t('bp_start'),'primary','id="start-bp"')}`:session.idx<5?`<p class="lead">${session.idx+1} / 5</p><div class="bill-kpis"><div><strong>${q.points}</strong><small>${E(t('bill_points'))}</small></div><div><strong>¥10</strong><small>1 point</small></div><div><strong>${q.rate}%</strong><small>${E(t('billing_rate'))}</small></div><div><strong>${session.correct}/5</strong><small>${E(t('bp_score'))}</small></div></div><form id="answer" class="form section" style="max-width:520px"><div class="field"><label>${E(t('bp_patient_due'))}</label><input class="input" type="number" name="patient" min="0" step="1" required></div><div class="field"><label>${E(t('bp_insurer_due'))}</label><input class="input" type="number" name="insurer" min="0" step="1" required></div><button type="submit" class="btn primary">${E(t('bp_check'))}</button></form>`:`<h2>${E(t('bp_finish'))}</h2><p class="lead">${E(t('bp_score'))}: ${session.correct} / 5</p>${button(t('bp_reset'),'primary','id="start-bp"')}`}</div>`;
 document.getElementById('start-bp')?.addEventListener('click',()=>{session={tasks:Array.from({length:5},(_,i)=>question(i)),idx:0,correct:0};render();});
 document.getElementById('answer')?.addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const due=Math.round(q.points*10*q.rate/100),insurer=q.points*10-due;const ok=Number(form.get('patient'))===due&&Number(form.get('insurer'))===insurer;
 session.correct+=ok?1:0;session.idx++;
 if(session.idx===5){db().billingRuns.unshift({type:'billing-practice',total:5,correct:session.correct,finishedAt:new Date().toISOString()});db().billingRuns=db().billingRuns.slice(0,100);log('billing_practice_completed',session.correct+'/5');}
 notify(t(ok?'bp_correct':'bp_wrong'));render();});
}
window.JHTSPages.billing_practice=render;
})();
