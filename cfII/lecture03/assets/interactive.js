
document.addEventListener('DOMContentLoaded',()=>{
  const lang=document.documentElement.lang==='ja'?'ja':'en';
  const cards=[...document.querySelectorAll('.slide-card')];
  const fill=document.getElementById('progress-fill'),label=document.getElementById('progress-label');
  function progress(){
    if(!cards.length)return;
    let seen=0;
    cards.forEach(c=>{if(c.getBoundingClientRect().top < window.innerHeight*.72)seen++;});
    if(fill)fill.style.width=(seen/cards.length*100)+'%';
    if(label)label.textContent=lang==='ja'?`${seen} / ${cards.length} スライド`:`${seen} / ${cards.length} slides`;
  }
  document.addEventListener('scroll',progress,{passive:true});progress();

  const modal=document.getElementById('image-modal'),modalImg=document.getElementById('modal-image');
  document.querySelectorAll('.image-button').forEach(btn=>btn.addEventListener('click',()=>{
    modalImg.src=btn.dataset.full;modal.classList.add('open');document.body.style.overflow='hidden';
  }));
  function closeModal(){modal.classList.remove('open');modalImg.src='';document.body.style.overflow='';}
  document.getElementById('modal-close')?.addEventListener('click',closeModal);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

  const volts=document.getElementById('volts'),amps=document.getElementById('amps'),power=document.getElementById('power-result');
  function calc(){const v=parseFloat(volts?.value||0),a=parseFloat(amps?.value||0);if(power)power.textContent=`${v.toFixed(1)} V × ${a.toFixed(2)} A = ${(v*a).toFixed(1)} W`;}
  volts?.addEventListener('input',calc);amps?.addEventListener('input',calc);calc();

  const stages=[...document.querySelectorAll('.stage')];let stageIndex=0;
  function showStage(){stages.forEach((s,i)=>s.classList.toggle('active',i===stageIndex));}
  document.getElementById('stage-button')?.addEventListener('click',()=>{stageIndex=(stageIndex+1)%stages.length;showStage();});showStage();

  const deviceV=document.getElementById('device-v'),deviceA=document.getElementById('device-a'),adapterV=document.getElementById('adapter-v'),adapterA=document.getElementById('adapter-a'),status=document.getElementById('adapter-status');
  function checkAdapter(){
    if(!status)return;
    const dv=parseFloat(deviceV.value),da=parseFloat(deviceA.value),av=parseFloat(adapterV.value),aa=parseFloat(adapterA.value);
    status.className='adapter-status';
    if(Math.abs(av-dv)>0.5){status.classList.add('bad');status.textContent=lang==='ja'?'危険：電圧が一致しません。使用しないでください。':'Danger: voltage does not match. Do not use this adapter.';}
    else if(aa<da){status.classList.add('warn');status.textContent=lang==='ja'?'注意：電流容量が不足しています。過熱や停止の可能性があります。':'Warning: current capacity is too low. The adapter may overheat or the laptop may stop.';}
    else{status.classList.add('ok');status.textContent=lang==='ja'?'基本条件は適合しています。端子と極性も確認してください。':'Basic electrical match. Also check connector and polarity.';}
  }
  [deviceV,deviceA,adapterV,adapterA].forEach(el=>el?.addEventListener('input',checkAdapter));checkAdapter();

  const age=document.getElementById('battery-age'),battery=document.querySelector('.battery'),bfill=document.querySelector('.battery-fill'),msg=document.getElementById('battery-message');
  function updateBattery(){
    if(!age||!battery||!bfill||!msg)return;
    const n=Number(age.value),capacity=Math.max(30,100-n*7);
    bfill.style.width=capacity+'%';battery.classList.toggle('swollen',n>=9);
    msg.textContent=lang==='ja'
      ?`推定容量：${capacity}%。${n>=9?'膨張は安全問題です。使用を止めて報告してください。':n>=6?'使用時間が短くなり、突然停止する可能性があります。':'比較的良好ですが、熱を避けてください。'}`
      :`Estimated capacity: ${capacity}%. ${n>=9?'Swelling is a safety problem. Stop use and report.':n>=6?'Shorter run time and sudden shutdown may occur.':'Condition is relatively good; avoid excessive heat.'}`;
  }
  age?.addEventListener('input',updateBattery);updateBattery();

  const wall=document.getElementById('wall'),computer=document.getElementById('computer'),network=document.getElementById('network'),ups=document.getElementById('ups'),timer=document.getElementById('ups-timer');
  let countdown=null,time=60;
  document.getElementById('power-fail')?.addEventListener('click',()=>{
    wall.className='ups-item off';computer.className='ups-item on';network.className='ups-item on';ups.className='ups-item on';
    clearInterval(countdown);time=60;timer.textContent=time+' s';
    countdown=setInterval(()=>{time--;timer.textContent=Math.max(0,time)+' s';if(time<=0){clearInterval(countdown);computer.className='ups-item off';network.className='ups-item off';timer.textContent=lang==='ja'?'時間切れ':'Time finished';}},1000);
  });
  document.getElementById('safe-shutdown')?.addEventListener('click',()=>{clearInterval(countdown);computer.className='ups-item off';network.className='ups-item on';timer.textContent=lang==='ja'?'安全に停止':'Safe shutdown';});
  document.getElementById('reset-ups')?.addEventListener('click',()=>{clearInterval(countdown);time=60;[wall,computer,network].forEach(x=>x.className='ups-item on');ups.className='ups-item';timer.textContent='60 s';});

  document.querySelectorAll('.safety-card').forEach(card=>card.addEventListener('click',()=>{
    const good=card.dataset.safe==='1';card.classList.remove('safe','danger');card.classList.add(good?'safe':'danger');
  }));

  const quiz=document.getElementById('quiz-form');
  if(quiz){
    const qcards=[...quiz.querySelectorAll('.quiz-card')],result=document.getElementById('quiz-result');
    quiz.querySelector('[data-action="check"]')?.addEventListener('click',()=>{
      let score=0;qcards.forEach(card=>{card.classList.remove('correct','wrong');const selected=card.querySelector('input:checked');if(selected&&Number(selected.value)===Number(card.dataset.answer)){score++;card.classList.add('correct')}else card.classList.add('wrong')});
      result.style.display='block';result.textContent=`${result.dataset.label}: ${score} / ${qcards.length}. ${result.dataset.review}`;
    });
    quiz.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{quiz.reset();qcards.forEach(c=>c.classList.remove('correct','wrong'));result.style.display='none'});
  }
});
