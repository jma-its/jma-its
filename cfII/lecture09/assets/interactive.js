
document.addEventListener('DOMContentLoaded',()=>{
 const lang=document.documentElement.lang==='ja'?'ja':'en';
 const T={
 en:{opened:(o,t)=>`Answers opened: ${o} / ${t}`,good:'GOOD',bad:'WEAK',safe:'SAFE',risky:'RISKY',
 tools:{about:'Use Settings → System → About for device name, CPU, RAM, system type, Windows edition and version.',thispc:'Use This PC for drive letters, total capacity, and free space.',task:'Use Task Manager → Performance for CPU, memory, disk, network, and GPU names/status.',device:'Use Device Manager for hardware categories, device names, warning icons, and status messages.',network:'Use Network Settings for Wi‑Fi/Ethernet status, adapter names, IP information, and connection clues.',update:'Use Windows Update History only as evidence of timing. It is a clue, not proof.'},
 evidenceOk:'Good: specific, checkable evidence.',evidenceBad:'Some items are still weak. Good evidence is exact and checkable.',
 safetyOk:'All safety classifications are correct.',safetyBad:'Some actions are misclassified. Reading and reporting are safe; deleting/changing/sharing private data is risky.',
 cases:{wifi:'Report: PC‑04, Windows version, adapter name/status, Wi‑Fi symptom, one PC or many PCs, screenshot.',storage:'Report: drive letter, total capacity, free space, warning message, screenshot. Do not delete system files.',projector:'Report: computer name, display adapter, cable checked, Display settings screenshot, exact symptom.',private:'Do not send the screenshot as-is. Hide private/patient information or take a better screenshot.'},
 score:(n,t)=>`Final score: ${n} / ${t}. ${n>=13?'Excellent.':n>=10?'Good. Review highlighted questions.':'Review the reporting and safety rules, then try again.'}`},
 ja:{opened:(o,t)=>`開いた答え: ${o} / ${t}`,good:'良い',bad:'弱い',safe:'安全',risky:'危険',
 tools:{about:'Settings → System → Aboutでdevice name、CPU、RAM、system type、Windows edition/versionを確認します。',thispc:'This PCでドライブ文字、総容量、空き容量を確認します。',task:'Task Manager → PerformanceでCPU、メモリ、ディスク、ネットワーク、GPU名や状態を確認します。',device:'Device Managerでカテゴリ、デバイス名、警告アイコン、状態メッセージを確認します。',network:'Network SettingsでWi‑Fi/Ethernet状態、アダプタ名、IP情報、接続の手掛かりを確認します。',update:'Windows Update Historyは時期の証拠です。原因の証明ではなく手掛かりです。'},
 evidenceOk:'良い：具体的で確認できる証拠です。',evidenceBad:'まだ弱い項目があります。良い証拠は正確で確認できます。',
 safetyOk:'すべて正しく分類できました。',safetyBad:'誤りがあります。読む・報告は安全、削除・変更・個人情報共有は危険です。',
 cases:{wifi:'報告：PC‑04、Windows、アダプタ名／状態、Wi‑Fi症状、1台か多数か、スクリーンショット。',storage:'報告：ドライブ文字、総容量、空き容量、警告、スクリーンショット。システムファイルは削除しません。',projector:'報告：PC名、表示アダプタ、ケーブル確認、Display設定スクリーンショット、正確な症状。',private:'そのまま送信しません。個人・患者情報を隠すか、別のスクリーンショットを取ります。'},
 score:(n,t)=>`最終スコア: ${n} / ${t}。${n>=13?'とても良いです。':n>=10?'良いです。色付き問題を復習してください。':'報告と安全ルールを復習して再挑戦してください。'}`}
 }[lang];

 const details=[...document.querySelectorAll('details[data-checkpoint]')],fill=document.getElementById('progress-fill'),label=document.getElementById('progress-label');
 function progress(){const o=details.filter(d=>d.open).length;if(fill)fill.style.width=(o/details.length*100)+'%';if(label)label.textContent=T.opened(o,details.length)}
 details.forEach(d=>d.addEventListener('toggle',progress));progress();

 const modal=document.getElementById('slide-modal');if(modal){const img=modal.querySelector('img');document.querySelectorAll('.image-button').forEach(b=>b.onclick=()=>{img.src=b.dataset.full;modal.classList.add('open');document.body.style.overflow='hidden'});const close=()=>{modal.classList.remove('open');img.src='';document.body.style.overflow=''};modal.querySelector('button').onclick=close;modal.onclick=e=>{if(e.target===modal)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}

 const toolInfo=document.getElementById('tool-info');document.querySelectorAll('.tool-card').forEach(c=>c.onclick=()=>{document.querySelectorAll('.tool-card').forEach(x=>x.classList.remove('active'));c.classList.add('active');toolInfo.textContent=T.tools[c.dataset.tool]});document.querySelector('.tool-card')?.click();

 function cycle(card, classes, labels){let cur=card.dataset.choice||'';let next=cur===classes[0]?classes[1]:cur===classes[1]?'':classes[0];card.dataset.choice=next;card.classList.remove(...classes);if(next)card.classList.add(next);card.querySelector('strong').textContent=next?labels[next]:'';}
 document.querySelectorAll('.evidence-card').forEach(c=>c.onclick=()=>cycle(c,['good','bad'],{good:T.good,bad:T.bad}));
 document.getElementById('check-evidence')?.addEventListener('click',()=>{const ok=[...document.querySelectorAll('.evidence-card')].every(c=>c.dataset.choice===c.dataset.answer),f=document.getElementById('evidence-feedback');f.className='feedback '+(ok?'ok':'bad');f.textContent=ok?T.evidenceOk:T.evidenceBad});
 document.querySelectorAll('.safety-card').forEach(c=>c.onclick=()=>cycle(c,['safe','risky'],{safe:T.safe,risky:T.risky}));
 document.getElementById('check-safety')?.addEventListener('click',()=>{const ok=[...document.querySelectorAll('.safety-card')].every(c=>c.dataset.choice===c.dataset.answer),f=document.getElementById('safety-feedback');f.className='feedback '+(ok?'ok':'bad');f.textContent=ok?T.safetyOk:T.safetyBad});

 document.getElementById('build-report')?.addEventListener('click',()=>{const pc=document.getElementById('rep-computer').value,win=document.getElementById('rep-windows').value,prob=document.getElementById('rep-problem').value,e=document.getElementById('rep-evidence').value;document.getElementById('report-output').textContent=`Computer: ${pc}\nSystem: ${win}\nProblem: ${prob}\nEvidence: ${e}\nChecked: system information read from screen\nNeed help: please check the problem safely`});
 document.querySelectorAll('.checkitem').forEach(c=>c.onclick=()=>c.classList.toggle('done'));
 const caseInfo=document.getElementById('case-info');document.querySelectorAll('.case-card').forEach(c=>c.onclick=()=>{document.querySelectorAll('.case-card').forEach(x=>x.classList.remove('active'));c.classList.add('active');caseInfo.textContent=T.cases[c.dataset.case]});document.querySelector('.case-card')?.click();

 const quiz=document.getElementById('final-quiz');if(quiz){const cards=[...quiz.querySelectorAll('.quiz-card')],score=document.getElementById('quiz-score');document.getElementById('check-quiz').onclick=()=>{let n=0;cards.forEach(c=>{c.classList.remove('correct','wrong');const s=c.querySelector('input:checked');if(s&&s.value===c.dataset.answer){n++;c.classList.add('correct')}else c.classList.add('wrong')});score.style.display='block';score.textContent=T.score(n,cards.length)};document.getElementById('reset-quiz').onclick=()=>{quiz.reset();cards.forEach(c=>c.classList.remove('correct','wrong'));score.style.display='none'}}
});
