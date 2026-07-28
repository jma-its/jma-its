
document.addEventListener('DOMContentLoaded',()=>{
  const lang=document.documentElement.lang==='ja'?'ja':'en';
  const T={
    en:{
      answersOpened:(o,t)=>`Answers opened: ${o} / ${t}`,
      component:{
        motherboard:['Motherboard','The main circuit board. It connects components and carries power and signals.'],
        cpu:['CPU','Processes instructions and controls work. Billions of tiny transistors switch electrical states.'],
        ram:['RAM','Fast temporary working memory. Its normal contents disappear when power is removed.'],
        storage:['HDD / SSD','Long-term storage for Windows, programs, and files. HDD is mechanical; SSD uses flash memory.'],
        cooling:['Cooling system','The fan, heat pipe, heat sink, and airflow remove heat from the CPU and other parts.'],
        wifi:['Wi-Fi card','Sends and receives radio signals so the computer can join a wireless network.']
      },
      orderOk:'Correct. Safe sequence: shut down → unplug → remove battery if possible → prepare the workspace → record screws → open slowly → identify parts → reassemble and test.',
      orderBad:'Not yet. Remove power before opening, prepare the workspace, work slowly, and test only after reassembly.',
      matchOk:'All component roles are correct.',
      matchBad:'Check again: processing, working memory, long-term storage, connection, cooling, and wireless communication are different jobs.',
      scenarioOk:'Correct. You selected all safe and useful first actions.',
      scenarioBad:'Some selections are unsafe or unnecessary. Start with simple evidence and never use force on damaged hardware.',
      score:(n,t)=>`Final score: ${n} / ${t}. ${n>=13?'Excellent.':n>=10?'Good. Review the highlighted questions.':'Review the component roles and safety sequence, then try again.'}`
    },
    ja:{
      answersOpened:(o,t)=>`開いた答え: ${o} / ${t}`,
      component:{
        motherboard:['マザーボード','主回路基板です。部品を接続し、電力と信号を運びます。'],
        cpu:['CPU','命令を処理し、作業を制御します。内部では多数のトランジスタが電気状態を切り替えます。'],
        ram:['RAM','高速な一時作業メモリです。通常の内容は電源を切ると失われます。'],
        storage:['HDD / SSD','Windows、プログラム、ファイルを長期保存します。HDDは機械式、SSDはフラッシュメモリです。'],
        cooling:['冷却システム','ファン、ヒートパイプ、ヒートシンク、空気の流れで熱を外へ出します。'],
        wifi:['Wi-Fiカード','無線信号を送受信し、コンピュータをワイヤレスネットワークへ接続します。']
      },
      orderOk:'正解です。安全な順序：シャットダウン → 接続を外す → 可能ならバッテリーを外す → 作業場所を準備 → ネジを記録 → ゆっくり開く → 部品を識別 → 再組立てとテスト。',
      orderBad:'まだ違います。開く前に電源を外し、作業場所を準備し、力を使わず、再組立て後にテストしてください。',
      matchOk:'すべての部品と役割が正しく対応しています。',
      matchBad:'もう一度確認してください。処理、作業メモリ、長期保存、接続、冷却、無線通信は別の役割です。',
      scenarioOk:'正解です。安全で役立つ最初の行動をすべて選べました。',
      scenarioBad:'危険または不要な選択があります。簡単な証拠から確認し、損傷した機器に力を加えないでください。',
      score:(n,t)=>`最終スコア: ${n} / ${t}。${n>=13?'とても良いです。':n>=10?'良いです。色が付いた問題を復習してください。':'部品の役割と安全手順を復習して、もう一度挑戦してください。'}`
    }
  }[lang];

  const details=[...document.querySelectorAll('details[data-checkpoint]')];
  const fill=document.getElementById('progress-fill');
  const label=document.getElementById('progress-label');
  function updateProgress(){
    const opened=details.filter(d=>d.open).length;
    const pct=details.length?Math.round(opened/details.length*100):0;
    if(fill)fill.style.width=pct+'%';
    if(label)label.textContent=T.answersOpened(opened,details.length);
  }
  details.forEach(d=>d.addEventListener('toggle',updateProgress));
  updateProgress();

  const modal=document.getElementById('slide-modal');
  if(modal){
    const modalImg=modal.querySelector('img');
    document.querySelectorAll('.image-button').forEach(button=>button.addEventListener('click',()=>{
      modalImg.src=button.dataset.full;
      modal.classList.add('open');
      document.body.style.overflow='hidden';
    }));
    function closeModal(){
      modal.classList.remove('open');
      modalImg.src='';
      document.body.style.overflow='';
    }
    modal.querySelector('button')?.addEventListener('click',closeModal);
    modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
  }

  const info=document.getElementById('component-info');
  document.querySelectorAll('.component').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('.component').forEach(x=>x.classList.remove('active'));
    button.classList.add('active');
    const data=T.component[button.dataset.part];
    if(info&&data)info.innerHTML=`<h4>${data[0]}</h4><p>${data[1]}</p>`;
  }));
  document.querySelector('.component')?.click();

  const orderList=document.getElementById('order-list');
  if(orderList){
    orderList.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button)return;
      const item=button.closest('.order-item');
      if(button.dataset.move==='up'&&item.previousElementSibling)orderList.insertBefore(item,item.previousElementSibling);
      if(button.dataset.move==='down'&&item.nextElementSibling)orderList.insertBefore(item.nextElementSibling,item);
    });
    document.getElementById('check-order')?.addEventListener('click',()=>{
      const sequence=[...orderList.children].map(x=>x.dataset.key).join(',');
      const correct='shutdown,unplug,battery,prepare,screws,open,identify,reassemble';
      const feedback=document.getElementById('order-feedback');
      const ok=sequence===correct;
      feedback.className='feedback '+(ok?'ok':'bad');
      feedback.textContent=ok?T.orderOk:T.orderBad;
    });
  }

  document.getElementById('check-match')?.addEventListener('click',()=>{
    const selects=[...document.querySelectorAll('.role-select')];
    const ok=selects.every(select=>select.value===select.dataset.answer);
    const feedback=document.getElementById('match-feedback');
    feedback.className='feedback '+(ok?'ok':'bad');
    feedback.textContent=ok?T.matchOk:T.matchBad;
  });

  const scenarios=[...document.querySelectorAll('.scenario')];
  scenarios.forEach(card=>card.addEventListener('click',()=>{
    card.classList.toggle('selected');
    card.classList.remove('good','bad');
  }));
  document.getElementById('check-scenarios')?.addEventListener('click',()=>{
    let allCorrect=true;
    scenarios.forEach(card=>{
      card.classList.remove('good','bad');
      const selected=card.classList.contains('selected');
      const shouldSelect=card.dataset.correct==='1';
      const correct=selected===shouldSelect;
      card.classList.add(correct?'good':'bad');
      if(!correct)allCorrect=false;
    });
    const feedback=document.getElementById('scenario-feedback');
    feedback.className='feedback '+(allCorrect?'ok':'bad');
    feedback.textContent=allCorrect?T.scenarioOk:T.scenarioBad;
  });

  document.querySelectorAll('.checkitem').forEach(item=>item.addEventListener('click',()=>{
    item.classList.toggle('done');
  }));

  const quiz=document.getElementById('final-quiz');
  if(quiz){
    const cards=[...quiz.querySelectorAll('.quiz-card')];
    const score=document.getElementById('quiz-score');
    document.getElementById('check-quiz')?.addEventListener('click',()=>{
      let correct=0;
      cards.forEach(card=>{
        card.classList.remove('correct','wrong');
        const selected=card.querySelector('input:checked');
        if(selected&&selected.value===card.dataset.answer){
          correct++;
          card.classList.add('correct');
        }else{
          card.classList.add('wrong');
        }
      });
      score.style.display='block';
      score.textContent=T.score(correct,cards.length);
    });
    document.getElementById('reset-quiz')?.addEventListener('click',()=>{
      quiz.reset();
      cards.forEach(card=>card.classList.remove('correct','wrong'));
      score.style.display='none';
    });
  }
});
