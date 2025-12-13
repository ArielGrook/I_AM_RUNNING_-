/* assets/app.js */

/* [JS-18] SMOOTH SCROLL — учитываем реальную высоту фикс‑хедера */
/* [FIX] берём высоту из CSS-переменной --headerH, чтобы секции ровно вставали в окно */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if(id === '#advantages') return; // отдельная секция (остается как есть)
    const t = document.querySelector(id);
    if(!t) return;

    e.preventDefault();

    // читаем --headerH из :root; fallback = 100
    const cssH = getComputedStyle(document.documentElement).getPropertyValue('--headerH').trim();
    const headerH = parseInt(cssH || '100', 10);

    const top = t.getBoundingClientRect().top + window.pageYOffset - headerH;
    window.scrollTo({ top, behavior:'smooth' });
  });
});


/* [JS-21] PORTFOLIO CAROUSEL & COMPARE — ПОЛНЫЙ БЛОК */
(function(){
  const viewport = document.querySelector('.pf-viewport');
  const track = viewport?.querySelector('.pf-track');
  if(!viewport || !track) return;

  // ---- DATA: 10 карточек, нечётные — compare (до/после), чётные — обычные
  // Положи файлы в assets/portfolio/ с теми же именами.
  const p = 'assets/portfolio/';
  const data = [
    {type:'compare', title:'Реставрация фронтальной группы', tags:['Миметика','Свет'],
      desc:'Невидимые границы и стабильность блеска.',
      before:`${p}Портфолио_До_1.png`, after:`${p}Портфолио_После_1.png`},
    {type:'single',  title:'Комплексная санация', tags:['Гигиена','Терапия'],
      desc:'Работа с прикусом и формой режущего края.',
      img:`${p}Портфолио_После_1.png`},
    {type:'compare', title:'Терапевтическое восстановление', tags:['До/После','Эстетика'],
      desc:'Реалистичный результат без перегрева тканей.',
      before:`${p}Портфолио_До_2.png`, after:`${p}Портфолио_После_2.png`},
    {type:'single',  title:'Протокол улыбки', tags:['Mock-up','План'],
      desc:'От wax-up до финала. Прозрачная коммуникация.',
      img:`${p}Портфолио_После_2.png`},
    {type:'compare', title:'Полные съёмные', tags:['Съёмные','Функция'],
      desc:'Комфорт и фиксация, индивидуальная постановка зубов.',
      before:`${p}Портфолио_До_3.png`, after:`${p}Портфолио_После_3.png`},
    {type:'single',  title:'Имплантологические кейсы', tags:['Импланты'],
      desc:'Керамика под контрольным шаблоном.',
      img:`${p}Портфолио_После_3.png`},
    {type:'compare', title:'Digital Smile Design', tags:['Цифра','Моделирование'],
      desc:'Планирование цвета/формы и согласование.',
      before:`${p}Портфолио_До_4.png`, after:`${p}Портфолио_После_4.png`},
    {type:'single',  title:'Ортопедия', tags:['Керамика'],
      desc:'Накрытие жевательной группы.',
      img:`${p}Портфолио_После_4.png`},
    {type:'compare', title:'Реабилитация', tags:['Протокол','Mock-up'],
      desc:'От диагностики до финала.',
      before:`${p}Портфолио_До_5.png`, after:`${p}Портфолио_После_5.png`},
    {type:'single',  title:'Фотопротокол', tags:['Документация'],
      desc:'Съёмка и контроль качества.',
      img:`${p}Портфолио_После_5.png`}
  ];

  // ---- RENDER CARDS
  const createEl = (tag, cls) => { const el = document.createElement(tag); if(cls) el.className = cls; return el; };
  data.forEach(item=>{
    const card = createEl('article','pf-card');

    // media
    const media = createEl('div','pf-media');
    if(item.type === 'compare'){
      const cmp = createEl('div','pf-compare');

      const before = createEl('div','pf-before');
      const imgB = createEl('img','pf-img'); imgB.src = item.before; imgB.alt='До'; imgB.loading='eager';
      before.appendChild(imgB);

      const after = createEl('div','pf-after');
      const imgA = createEl('img','pf-img'); imgA.src = item.after; imgA.alt='После'; imgA.loading='lazy';
      after.appendChild(imgA);

      const bar = createEl('div','pf-bar');
      const handle = createEl('button','pf-handle'); handle.type='button'; handle.innerHTML='↔';

      cmp.append(before, after, bar, handle);
      media.appendChild(cmp);
    } else {
      const img = createEl('img','pf-img'); img.src = item.img; img.alt=item.title; img.loading='lazy';
      media.appendChild(img);
    }
    card.appendChild(media);

    // meta
    const meta = createEl('div','pf-meta');
    const ttl = createEl('h3','pf-title'); ttl.textContent = item.title;
    const tags = createEl('div','pf-tags');
    (item.tags||[]).forEach(t=>{ const s=createEl('span'); s.textContent=t; tags.appendChild(s); });
    const desc = createEl('p','pf-desc'); desc.textContent = item.desc || '';
    meta.append(ttl, tags, desc);

    card.appendChild(meta);
    track.appendChild(card);
  });

  // ---- NAV + CENTER LOGIC
  const prevBtn  = viewport.querySelector('.pf-prev');
  const nextBtn  = viewport.querySelector('.pf-next');
  const cards    = Array.from(track.children);
  const GAP = 28;
  const PAD = 24; // должен совпадать с padding-inline у .pf-viewport
  let index = 0;

  const cardWidth  = () => cards[0].getBoundingClientRect().width;
  const vpInnerW   = () => Math.max(0, viewport.clientWidth - PAD*2);
  const totalWidth = () => cards.length * (cardWidth() + GAP) - GAP;

  let targetX = 0, currentX = 0, rafId = 0;
  const lerp = (a,b,t)=>a+(b-a)*t;
  function loop(){
    currentX = lerp(currentX, targetX, 0.18);
    track.style.transform = `translate3d(${-Math.round(currentX)}px,0,0)`;
    if(Math.abs(currentX-targetX) > 0.3) rafId = requestAnimationFrame(loop);
    else { currentX = targetX; track.style.transform = `translate3d(${-Math.round(currentX)}px,0,0)`; rafId=0; }
  }
  function setTarget(x){
    const maxOff = Math.max(totalWidth() - vpInnerW(), 0);
    targetX = Math.max(0, Math.min(x, maxOff));
    if(!rafId) rafId = requestAnimationFrame(loop);
  }
  function centerTo(i){
    index = (i + cards.length) % cards.length;
    const cW = cardWidth(), vpW = vpInnerW();
    const raw = index*(cW+GAP) - (vpW - cW)/2;
    setTarget(raw);
    preloadAround();
    updateSides();
  }
  function preloadAround(){
    [index-1,index,index+1].forEach(k=>{
      const c = cards[(k+cards.length)%cards.length];
      const img = c.querySelector('img.pf-img[loading="lazy"]');
      if(img) img.loading='eager';
    });
  }
  function updateSides(){
    prevBtn.style.opacity = index===0 ? .55 : 1;
    nextBtn.style.opacity = index===cards.length-1 ? .55 : 1;
  }

  // ---- COMPARE drag (не трогаем карусель)
  let compareDrag = false;
  cards.forEach(card=>{
    const cmp = card.querySelector('.pf-compare');
    if(!cmp) return;
    const before = cmp.querySelector('.pf-before');
    const after  = cmp.querySelector('.pf-after');
    const bar    = cmp.querySelector('.pf-bar');
    const handle = cmp.querySelector('.pf-handle');

    const setPos = (clientX)=>{
      const r = cmp.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - r.left, r.width));
      const pct = (x/r.width)*100;
      after.style.clipPath = `inset(0 ${100-pct}% 0 0)`;
      bar.style.left = `${pct}%`;
      handle.style.left = `${pct}%`;
    };
    const start = (e)=>{
      compareDrag = true;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      setPos(x);
      window.addEventListener('pointermove', move, {passive:false});
      window.addEventListener('pointerup', end, {once:true});
      window.addEventListener('touchmove', move, {passive:false});
      window.addEventListener('touchend', end, {once:true});
      e.preventDefault(); e.stopPropagation();
    };
    const move = (e)=>{
      if(!compareDrag) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      setPos(x); e.preventDefault(); e.stopPropagation();
    };
    const end = ()=>{
      compareDrag=false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('touchmove', move);
    };

    handle.addEventListener('pointerdown', start);
    handle.addEventListener('touchstart', start, {passive:false});
    cmp.addEventListener('pointerdown', start);
    cmp.addEventListener('touchstart', start, {passive:false});
  });

  // ---- DRAG / SWIPE CAROUSEL
  let dragging=false, dragStartX=0, dragStartOffset=0;
  const onDown = (e)=>{
    if(compareDrag) return;
    dragging=true;
    dragStartX = (e.touches ? e.touches[0].clientX : e.clientX);
    dragStartOffset = targetX;
    e.preventDefault();
  };
  const onMove = (e)=>{
    if(!dragging || compareDrag) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = dragStartX - x;
    setTarget(dragStartOffset + dx);
    e.preventDefault();
  };
  const onUp = ()=>{
    if(!dragging) return; dragging=false;
    const cW = cardWidth()+GAP;
    const snapIndex = Math.round((targetX + (vpInnerW()-cardWidth())/2)/cW);
    centerTo(snapIndex);
  };
  viewport.addEventListener('pointerdown', onDown);
  viewport.addEventListener('pointermove', onMove, {passive:false});
  window.addEventListener('pointerup', onUp);
  viewport.addEventListener('touchstart', onDown, {passive:false});
  viewport.addEventListener('touchmove', onMove, {passive:false});
  window.addEventListener('touchend', onUp);

  // buttons
  viewport.querySelector('.pf-prev').addEventListener('click', ()=>centerTo(index-1));
  viewport.querySelector('.pf-next').addEventListener('click', ()=>centerTo(index+1));
  window.addEventListener('resize', ()=>centerTo(index));

  // start
  centerTo(0);
})();

/* [JS-35] YANDEX MAP INIT — без оверлеев/кнопок «на карте» */
(function initYandex(){
  function make(){
    if(typeof ymaps==='undefined'){ setTimeout(make, 800); return; }
    ymaps.ready(function(){
      const map = new ymaps.Map("yandex-map",{
        center:[55.809525,37.733171], zoom:17, controls:['zoomControl','fullscreenControl']
      });
      const mark = new ymaps.Placemark([55.809525,37.733171],{
        hintContent:'СЗЛ — Современная Зуботехническая Лаборатория',
        balloonContent:'г. Москва, Открытое шоссе, д. 6, корп. 8'
      },{preset:'islands#yellowMedicalIcon'});
      map.geoObjects.add(mark);
    });
  }
  make();
})();
