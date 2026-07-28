
document.addEventListener('DOMContentLoaded',()=>{
  const lang=document.documentElement.lang==='ja'?'ja':'en';
  const T = {
    en:{
      answersOpened:(o,t)=>`Answers opened: ${o} / ${t}`,
      orderOk:'Correct: relay → vacuum tube → transistor → integrated circuit.',
      orderBad:'Not yet. Think about moving contacts first, then electronic tubes, then semiconductor switches, then many devices on one chip.',
      matchOk:'Correct: CPU processes, RAM holds current work, SSD keeps files.',
      matchBad:'Check again: one part processes, one part is volatile working memory, and one part is non-volatile storage.',
      scenarioOk:'All classifications are correct.',
      scenarioBad:'Some cases are still wrong. Physical problems involve power, heat, signals, contacts, or damage. Logical problems involve rules, settings, sequence, or permissions.',
      score:(n,t)=>`Final score: ${n} / ${t}. ${n>=13?'Excellent.':n>=10?'Good. Review the highlighted questions.':'Review the lecture chains, then try again.'}`,
      phys:'PHYSICAL', log:'LOGICAL'
    },
    ja:{
      answersOpened:(o,t)=>`開いた答え: ${o} / ${t}`,
      orderOk:'正解です：リレー → 真空管 → トランジスタ → 集積回路',
      orderBad:'まだ違います。まず動く接点、次に電子的な真空管、その後に半導体スイッチ、最後に1つのチップ上の多数の装置を考えてください。',
      matchOk:'正解です：CPU は処理、RAM は現在の作業、SSD はファイル保存です。',
      matchBad:'もう一度確認してください。1つは処理、1つは揮発性の作業メモリ、1つは不揮発性ストレージです。',
      scenarioOk:'すべて正しく分類できました。',
      scenarioBad:'まだ誤りがあります。物理的問題には電源、熱、信号、接触、損傷が関係します。論理的問題にはルール、設定、順序、権限が関係します。',
      score:(n,t)=>`最終スコア: ${n} / ${t}。${n>=13?'とても良いです。':n>=10?'良いです。色が付いた問題を復習してください。':'講義の流れを復習して、もう一度挑戦してください。'}`,
      phys:'物理', log:'論理'
    }
  }[lang];

  const details=[...document.querySelectorAll('details[data-checkpoint]')];
  const fill=document.getElementById('progress-fill'),label=document.getElementById('progress-label');
  function updateProgress(){
    const opened=details.filter(d=>d.open).length;
    const pct=Math.round(opened/details.length*100);
    if(fill) fill.style.width=pct+'%';
    if(label) label.textContent=T.answersOpened(opened, details.length);
  }
  details.forEach(d=>d.addEventListener('toggle',updateProgress));updateProgress();

  const modal=document.getElementById('slide-modal');
  if(modal){
    const modalImg=modal.querySelector('img');
    document.querySelectorAll('.image-button').forEach(b=>b.addEventListener('click',()=>{
      modalImg.src=b.dataset.full;modal.classList.add('open');document.body.style.overflow='hidden';
    }));
    function closeModal(){modal.classList.remove('open');modalImg.src='';document.body.style.overflow='';}
    modal.querySelector('button').addEventListener('click',closeModal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  }

  const bitButtons=[...document.querySelectorAll('.bit-switch')];
  const binaryText=document.getElementById('binary-text'),decimalText=document.getElementById('decimal-text');
  function updateBinary(){
    if(!binaryText) return;
    const bits=bitButtons.map(b=>b.classList.contains('on')?'1':'0').join('');
    const value=bitButtons.reduce((sum,b)=>sum+(b.classList.contains('on')?Number(b.dataset.value):0),0);
    binaryText.textContent=bits;decimalText.textContent=value;
  }
  bitButtons.forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('on');b.setAttribute('aria-pressed',String(b.classList.contains('on')));updateBinary()}));updateBinary();

  const toggles=[...document.querySelectorAll('.toggle')],gate=document.getElementById('gate-select'),lamp=document.getElementById('gate-lamp');
  function bit(id){return document.getElementById(id).classList.contains('on')?1:0}
  function updateGate(){
    if(!gate||!lamp) return;
    const a=bit('gate-a'),b=bit('gate-b');let out=0;
    if(gate.value==='AND')out=a&&b;if(gate.value==='OR')out=a||b;if(gate.value==='XOR')out=Number(a!==b);if(gate.value==='NAND')out=Number(!(a&&b));if(gate.value==='NOTA')out=Number(!a);
    lamp.textContent=out;lamp.classList.toggle('on',Boolean(out));
  }
  toggles.forEach(t=>t.addEventListener('click',()=>{t.classList.toggle('on');t.textContent=t.classList.contains('on')?'1':'0';updateGate()})); if(gate) gate.addEventListener('change',updateGate); updateGate();

  const orderList=document.getElementById('order-list');
  if(orderList){
    orderList.addEventListener('click',e=>{
      const btn=e.target.closest('button');if(!btn)return;
      const item=btn.closest('.order-item');
      if(btn.dataset.move==='up'&&item.previousElementSibling)orderList.insertBefore(item,item.previousElementSibling);
      if(btn.dataset.move==='down'&&item.nextElementSibling)orderList.insertBefore(item.nextElementSibling,item);
    });
    document.getElementById('check-order').addEventListener('click',()=>{
      const seq=[...orderList.children].map(x=>x.dataset.key).join(',');
      const fb=document.getElementById('order-feedback');fb.className='feedback '+(seq==='relay,tube,transistor,ic'?'ok':'bad');
      fb.textContent=seq==='relay,tube,transistor,ic'?T.orderOk:T.orderBad;
    });
  }

  const matchBtn=document.getElementById('check-match');
  if(matchBtn){
    matchBtn.addEventListener('click',()=>{
      const selects=[...document.querySelectorAll('.role-select')];
      const ok=selects.every(s=>s.value===s.dataset.answer);
      const fb=document.getElementById('match-feedback');fb.className='feedback '+(ok?'ok':'bad');
      fb.textContent=ok?T.matchOk:T.matchBad;
    });
  }

  document.querySelectorAll('.scenario').forEach(card=>card.addEventListener('click',()=>{
    const current=card.dataset.choice||'';
    card.classList.remove('physical','logical');
    const next=current==='physical'?'logical':current==='logical'?'':'physical';
    card.dataset.choice=next;if(next)card.classList.add(next);
    const badge=card.querySelector('strong');badge.textContent=next?(next==='physical'?T.phys:T.log):(lang==='ja'?'クリックして分類':'CLICK TO CLASSIFY');
  }));
  const scBtn=document.getElementById('check-scenarios');
  if(scBtn){
    scBtn.addEventListener('click',()=>{
      const cards=[...document.querySelectorAll('.scenario')];
      const ok=cards.every(c=>c.dataset.choice===c.dataset.answer);
      const fb=document.getElementById('scenario-feedback');fb.className='feedback '+(ok?'ok':'bad');
      fb.textContent=ok?T.scenarioOk:T.scenarioBad;
    });
  }

  const quiz=document.getElementById('final-quiz');
  if(quiz){
    const cards=[...quiz.querySelectorAll('.quiz-card')],score=document.getElementById('quiz-score');
    document.getElementById('check-quiz').addEventListener('click',()=>{
      let n=0;cards.forEach(c=>{c.classList.remove('correct','wrong');const s=c.querySelector('input:checked');if(s&&s.value===c.dataset.answer){n++;c.classList.add('correct')}else c.classList.add('wrong')});
      score.style.display='block';score.textContent=T.score(n,cards.length);
    });
    document.getElementById('reset-quiz').addEventListener('click',()=>{quiz.reset();cards.forEach(c=>c.classList.remove('correct','wrong'));score.style.display='none'});
  }
});
