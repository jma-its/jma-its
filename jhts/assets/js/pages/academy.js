(function(){
'use strict';
const A=window.JHTSAcademy;
function render(){
 const el=document.getElementById('content');const {t,esc,loc}=A;
 const res=A.getResources();if(!res){el.innerHTML='<p>Loading Academy…</p>';A.fetchAll().then(render).catch(()=>el.innerHTML='<div class="band danger">'+esc(t('aca_nodata'))+'</div>');return;}
 const state=A.ensure(),r=A.active();
 const levels=res.levels.map(l=>{
   if(!res.cfg.visibleLevels.includes(l.id))return '';
   const isOpen=A.available(l.id),old=state.passed[l.id],currently=r?.level===l.id;
   const status=old?`<span class="aca-status success">${esc(t('aca_pass'))} · ${old.score}%</span>`:isOpen?`<span class="aca-status">${esc(t('aca_progress'))}</span>`:`<span class="aca-status locked">${esc(t('aca_locked'))}</span>`;
   return `<div class="card aca-level"><div class="row-between"><h2>Level ${l.id} — ${esc(loc(l.title))}</h2>${status}</div><p>${esc(loc(l.summary))}</p><p class="aca-small">${l.phases.map((phase,i)=>esc(t(['aca_phaselearn','aca_phaseguided','aca_phaseindependent','aca_phasecheck'][i]))+': '+phase.length).join(' · ')}</p><div class="buttons">${isOpen?`<button type="button" class="btn ${currently?'secondary':'primary'}" data-start="${l.id}">${esc(currently?t('aca_resume'):old?t('aca_retry'):t('aca_start'))}</button>`:`<span class="muted">${esc(t('aca_locked'))}</span>`}</div></div>`;
 }).join('');
 let task='';
 if(r){const info=A.stepInfo();task=`<section class="card aca-main-card"><div class="row-between"><strong>Level ${r.level} · ${esc(loc(A.level(r.level).title))}</strong><span class="aca-status">${esc(t('aca_errors'))}: ${r.mistakes}</span></div><div class="aca-progress"><span style="width:${(r.phase*25+r.step/A.level(r.level).phases[r.phase].length*25)}%"></span></div>${A.panelHTML(info,false)}</section>`;}
 const previous=state.history.slice(0,6).map(x=>`<div class="report-row"><span>Level ${x.level} · ${esc(x.finishedAt?.slice(0,10)||'')}</span><strong>${x.score}% · ${esc(t(x.passed?'aca_pass':'aca_fail'))} · ${esc(t('aca_critical'))}: ${x.critical}</strong></div>`).join('');
 el.innerHTML=`<div class="eyebrow">JHTS 1.6</div><h1 class="h1">${esc(t('academy'))}</h1><p class="lead">${esc(t('academy_sub'))}</p><div class="band">${esc(t('aca_intro'))} ${esc(t('aca_savereport'))}</div>${task}<h2 class="aca-heading">${esc(t('aca_levels'))}</h2><div class="aca-level-grid">${levels}</div><section class="card section"><h2>${esc(t('aca_activity'))}</h2>${previous||`<p class="muted">${esc(t('aca_no_attempts'))}</p>`}<p class="aca-small">${esc(t('aca_mastery').replace('{n}',res.cfg.masteryPercent))}</p><p class="aca-small">${esc(t('aca_teacher_rule'))}</p></section>`;
 el.querySelector('#aca-ack')?.addEventListener('click',()=>A.ack());
 el.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{
   const n=Number(b.dataset.start);const ongoing=A.active();if(ongoing?.level===n)return; // current mission remains
   if(ongoing&&!confirm(t('aca_restartwarn')))return;
   A.start(n);render();
 }));
}
window.JHTSPages.academy=render;
})();
