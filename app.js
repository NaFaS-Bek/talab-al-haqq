"use strict";
// Restore the exact pre-migration address after the one-time full document load.
const migratedAddress = location.href.replace(/[?&]__nfs_legacy_migration=[a-f0-9]{64}(?=#|$)/, '');
if (migratedAddress !== location.href) window.history.replaceState(window.history.state, '', migratedAddress);
const $ = s => document.querySelector(s);
const clean = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function uiIcon(name) {
  const paths = {sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',moon:'<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>',dua:'<path d="M5 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H3V4h2Zm9 3a3 3 0 0 1 3-3h4v14h-3a4 4 0 0 0-4 3"/>',names:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',library:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h8M8 17h5"/>',heart:'<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 1 10 8 15 7-5 13-10 8-15Z"/>',home:'<path d="m3 11 9-8 9 8M5 10v11h14V10"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'};
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.library}</svg>`;
}
const brandMetadata = s => String(s ?? '').replaceAll('NFS Dua', 'Талаб аль-Хакк');
const get = (key, fallback) => { try { return JSON.parse(localStorage.getItem('nfs_' + key)) ?? fallback; } catch { return fallback; } };
function save(key, value) {
  try { localStorage.setItem('nfs_' + key, JSON.stringify(value)); return true; }
  catch { $('#storageMessage').hidden = false; return false; }
}
let db = {}, caliphs = null, tab = 'home', filter = 'all', query = '', entries = [], library = [], history = [], active = null;
let favs = get('favs', []), counts = get('counts', {}), theme = get('theme', 'dark'), reading = get('reading', {});
let modalStack = [], lastFocus = null;
let reviewReturnState = null;
let knowledgeGroup = null, educationTopic = null, duaGroup = null;
const groupButton = (label, description, attr, value, count = null) => `<button class="item category-item" ${attr}="${clean(value)}"><span class="itembody"><strong>${clean(label)}</strong><small>${clean(description)}</small></span>${count === null ? '' : `<span class="category-count" aria-label="Материалов: ${count}">${count}</span>`}<span class="arrow" aria-hidden="true">›</span></button>`;
const backButton = (target) => `<button class="action" data-back="${target}">← Назад к разделам</button>`;

$('#reviewBtn').innerHTML = uiIcon('info');
const navIcons = {home:'home',dua:'dua',names:'names',library:'library',favorites:'heart'};
document.querySelectorAll('.bottom button').forEach(b => b.querySelector('i').innerHTML = uiIcon(navIcons[b.dataset.tab]));
const kindTitle = {dua:'Дуа и азкары',name:'Имя Аллаха',lib:'Исламские знания',history:'История ислама',caliph:'История халифов'};
const title = (x, kind) => kind === 'name' ? x.transliterationRu : x.titleRu;
function initData(d, c) {
  db = d; caliphs = c;
  entries = [...new Map([...d.catalog.entries, ...d.catalog_additions.entries].map(x => [x.id, x])).values()];
  library = d.library.items; history = d.history.events; render();
}
function setTab(t) { tab = t; query = ''; filter = 'all'; knowledgeGroup = null; educationTopic = null; duaGroup = null; render(); window.scrollTo(0, 0); }
function toggleReview() {
  if (tab !== 'review') {
    reviewReturnState = {tab, filter, query, knowledgeGroup, educationTopic, duaGroup, scrollY: window.scrollY};
    setTab('review');
    return;
  }
  if (!reviewReturnState) { setTab('home'); return; }
  const previous = reviewReturnState;
  reviewReturnState = null;
  ({tab, filter, query, knowledgeGroup, educationTopic, duaGroup} = previous);
  render();
  requestAnimationFrame(() => window.scrollTo(0, previous.scrollY));
}
function textSearch(x) {
  const words = [x.titleRu,x.transliterationRu,x.translationRu,x.meaningRu,x.summaryRu,x.arabicText,x.arabicName,...(x.tagsRu || []),...(x.aliasesRu || []),...(x.searchTerms || []),...(x.sections || []).map(s => s.textRu)];
  return words.join(' ').toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'));
}
function item(x, kind, about = false) {
  const subtitle = about
    ? `${statusName(x.reviewStatus || x.status)} · Экспертная проверка: ${x.expertReview ? 'см. сведения' : 'не отмечена'}`
    : kind === 'name' ? x.meaningRu : kind === 'dua' ? x.translationRu : x.summaryRu;
  return `<button class="item" ${about ? 'data-about' : 'data-open'}="${kind}:${clean(x.id)}">${kind === 'name' ? `<span class="number">${x.number}</span>` : ''}<span class="itembody"><strong>${clean(title(x, kind))}</strong><small>${clean((subtitle || '').slice(0, 140))}${(subtitle || '').length > 140 ? '…' : ''}</small></span>${kind === 'name' ? `<span class="arabicMini" lang="ar" dir="rtl">${clean(x.arabic)}</span>` : '<span class="arrow" aria-hidden="true">›</span>'}</button>`;
}
function search() { return `<label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" aria-label="Найти материал" placeholder="Найти материал…" value="${clean(query)}" autocomplete="off"></label>`; }
function section(t, more) { return `<div class="sectionhead"><h2>${clean(t)}</h2>${more ? `<button data-tab="${clean(more)}">Смотреть всё →</button>` : ''}</div>`; }
function footer() { return ''; }
function home() {
  const last = reading.last && findRecord(reading.last);
  return `<section class="hero"><span class="eyebrow" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span><h1>Пусть каждый день начинается с доброго</h1><p>Дуа, утренние и вечерние азкары, имена Аллаха и исламские знания — в одном месте.</p><button data-tab="dua">Открыть молитвы →</button></section>${last ? section('Продолжить чтение') + item(last.data,last.kind) : ''}${section('Разделы')}<div class="grid"><button class="tile" data-tab="dua" data-filter="morning"><span class="emoji" aria-hidden="true">${uiIcon('sun')}</span><strong>Утренние азкары</strong><small>Начать день с поминания</small></button><button class="tile" data-tab="dua" data-filter="evening"><span class="emoji" aria-hidden="true">${uiIcon('moon')}</span><strong>Вечерние азкары</strong><small>Мольбы перед ночью</small></button><button class="tile" data-tab="dua"><span class="emoji" aria-hidden="true">${uiIcon('dua')}</span><strong>Дуа по ситуациям</strong><small>Обращения к Аллаху</small></button><button class="tile" data-tab="names"><span class="emoji" aria-hidden="true">${uiIcon('names')}</span><strong>99 имён Аллаха</strong><small>Значения и размышления</small></button><button class="tile" data-tab="library"><span class="emoji" aria-hidden="true">${uiIcon('library')}</span><strong>Исламские знания</strong><small>Вера, пророки, люди и события</small></button><button class="tile" data-tab="caliphs"><span class="emoji" aria-hidden="true">${uiIcon('library')}</span><strong>История халифов</strong><small>Биографии и источники</small></button><a class="tile tile-link" href="family-rights.html"><span class="emoji" aria-hidden="true">${uiIcon('heart')}</span><strong>Муж и жена: права и обязанности</strong><small>Коран, хадисы и жизненные примеры</small></a></div>${section('С чего начать')}<div class="quicklinks">${groupButton('Основы ислама','Вера, поклонение и повседневная практика','data-home-knowledge','basics')}${groupButton('Истории пророков','Биографии и уроки историй','data-home-knowledge','prophet')}${groupButton('Исторические события','Хронология исламской истории','data-home-knowledge','events')}</div>${section('Часто ищут','dua')}${entries.slice(0,3).map(x => item(x,'dua')).join('')}${footer()}`;
}
function dua() {
  let cats = [{id:'morning',title:'Утренние азкары'},{id:'evening',title:'Вечерние азкары'},...db.catalog.categories,...db.catalog_additions.categories];
  cats = [...new Map(cats.map(c => [c.id,c])).values()];
  if (!duaGroup) return `${section('Дуа и азкары')}<p class="lead">Выберите тему. Материалы появятся только внутри выбранного раздела.</p>${search()}${query ? entries.filter(textSearch).map(x=>item(x,'dua')).join('') || empty() : cats.map(c => groupButton(c.id === 'surahs' ? 'Суры для чтения' : (c.titleRu || c.title),'Открыть материалы раздела','data-dua-group',c.id,entries.filter(x=>(x.categoryIds || []).includes(c.id)).length)).join('')}${footer()}`;
  const category = cats.find(c=>c.id===duaGroup);
  const a = entries.filter(x => (x.categoryIds || []).includes(duaGroup) && textSearch(x));
  return `${backButton('dua')}${section(duaGroup === 'surahs' ? 'Суры для чтения' : (category?.titleRu || category?.title || 'Дуа'))}${search()}<p class="lead">Материалов: ${a.length}</p>${a.map(x => item(x,'dua')).join('') || empty()}${footer()}`;
}
function empty() { return '<p class="empty">Подходящих материалов нет. Попробуйте другой запрос или откройте каталог тем.</p>'; }
function names() { return `${section('99 имён Аллаха')}<p class="lead">Написание, значение и примеры личной мольбы.</p>${search()}${db.names.names.filter(textSearch).map(x => item(x,'name')).join('') || empty()}${footer()}`; }
function knowledge() {
  const groups = [
    {id:'education',title:'Обучение исламу',desc:'Намаз, тахарат, арабский алфавит, чтение и основы'},
    {id:'prophet',title:'Истории пророков',desc:'Жизнь пророков и уроки их историй'},
    {id:'family',title:'Семья и отношения',desc:'Права, обязанности и уважение'},
    {id:'events',title:'Исторические события',desc:'Хронология и важные события'},
    {id:'caliphs',title:'История халифов',desc:'Биографии и источники'}
  ];
  const studyTopics = [
    {id:'pillars',title:'Пять столпов ислама',desc:'Первый шаг: шахада, намаз, закят, пост и хадж'},
    {id:'prayer',title:'Намаз и омовение (тахарат)',desc:'Как совершать поклонение и очищение'},
    {id:'alphabet',title:'Арабский алфавит и огласовки',desc:'28 букв, фатха, касра, дамма, тренировка'},
    {id:'basics',title:'Основы ислама',desc:'Вера, намерение и нравственность'},
    {id:'surah',title:'Короткие суры',desc:'Материалы для изучения и чтения'}
  ];
  const records = [...library.map(x=>({...x,_kind:'lib'})),...history.map(x=>({...x,_kind:'history'}))];
  if (!knowledgeGroup) return `${section('Исламские знания')}<p class="lead">Выберите направление. Все учебные материалы собраны в разделе «Обучение исламу».</p>${search()}${query ? records.filter(textSearch).map(x=>item(x,x._kind)).join('') || empty() : groups.map(g=>groupButton(g.title,g.desc,'data-knowledge-group',g.id,g.id==='caliphs' ? (caliphs?.profiles?.length ?? 0) : g.id==='education' ? null : records.filter(x=>(x._kind==='history'?'events':x.kind)===g.id).length)).join('')}${footer()}`;
  if (knowledgeGroup === 'caliphs') return `${backButton('library')}${caliphPage()}`;
  if (knowledgeGroup === 'education') {
    const header = `${backButton('library')}${section('Обучение исламу')}<p class="lead">Начните с пяти столпов ислама, затем изучайте намаз, омовение, арабское письмо и чтение.</p>`;
    if (!educationTopic) return header + studyTopics.map(t=>groupButton(t.title,t.desc,'data-education-topic',t.id,['alphabet','pillars'].includes(t.id)?null:library.filter(x=>x.kind===t.id).length)).join('') + footer();
    if (educationTopic === 'pillars') return header + `<button class="action" data-education-back="1">← К урокам</button><a class="item category-item" href="five-pillars.html"><span class="itembody"><strong>Открыть урок: пять столпов ислама</strong><small>Простое введение, источники и проверка знаний</small></span><span class="arrow" aria-hidden="true">›</span></a>` + footer();
    if (educationTopic === 'alphabet') return header + `<button class="action" data-education-back="1">← К урокам</button><a class="item category-item" href="arabic-reading-signs.html"><span class="itembody"><strong>Открыть урок: алфавит и огласовки</strong><small>Буквы и огласовки в одном контейнере, интерактивные задания</small></span><span class="arrow" aria-hidden="true">›</span></a>` + footer();
    const chosen = studyTopics.find(t=>t.id===educationTopic);
    const found = library.filter(x=>x.kind===educationTopic && textSearch(x));
    const practiceLinks = educationTopic === 'prayer' ? `<section class="review-card" aria-label="Пошаговые уроки намаза"><h3>Начните с практических уроков</h3><p>Омовение и молитва разобраны отдельно, с источниками и пояснениями различий школ.</p><a class="item category-item" href="wudu-steps.html"><span class="itembody"><strong>1. Омовение (тахарат): по шагам</strong><small>Суннитский и джафаритский примеры без смешения правил</small></span><span class="arrow" aria-hidden="true">›</span></a><a class="item category-item" href="salah-steps.html"><span class="itembody"><strong>2. Намаз: два ракаата по шагам</strong><small>Начало молитвы, руку‘, суджуд, ташаххуд, салям</small></span><span class="arrow" aria-hidden="true">›</span></a></section>` : '';

    return header + `<button class="action" data-education-back="1">← К урокам</button>${section(chosen?.title || 'Учебные материалы')}${practiceLinks}${search()}<p class="lead">Материалов: ${found.length}</p>${found.map(x=>item(x,'lib')).join('') || empty()}${footer()}`;
  }
  const familyOverview = knowledgeGroup === 'family' ? '<a class="item category-item" href="family-rights.html"><span class="itembody"><strong>Муж и жена: права и обязанности</strong><small>Взаимные права и примеры</small></span><span class="arrow" aria-hidden="true">›</span></a><a class="item category-item" href="family-nikah.html"><span class="itembody"><strong>Никах: заключение брака</strong><small>Согласие и договор</small></span><span class="arrow" aria-hidden="true">›</span></a><a class="item category-item" href="family-mahr.html"><span class="itembody"><strong>Махр: брачный дар жене</strong><small>Что принадлежит жене</small></span><span class="arrow" aria-hidden="true">›</span></a><a class="item category-item" href="family-children.html"><span class="itembody"><strong>Воспитание детей</strong><small>Забота, милосердие и ответственность</small></span><span class="arrow" aria-hidden="true">›</span></a><a class="item category-item" href="family-prophetic-example.html"><span class="itembody"><strong>Семья по примеру Пророка ﷺ</strong><small>Помощь и доброе обращение</small></span><span class="arrow" aria-hidden="true">›</span></a>' : '';
  const g = groups.find(g=>g.id===knowledgeGroup);
  const arr = records.filter(x=>(x._kind==='history'?'events':x.kind)===knowledgeGroup && textSearch(x));
  return `${backButton('library')}${section(g?.title || 'Исламские знания')}${familyOverview}${search()}<p class="lead">Материалов: ${arr.length}</p>${arr.map(x=>item(x,x._kind)).join('') || empty()}${footer()}`;
}
function caliphPage() {
  if (!caliphs) return `${section('История халифов')}<p class="lead">Материалы ещё не загружены. Подготовьте полную версию сайта.</p>${footer()}`;
  const i = caliphs.introduction;
  const introSource = sourceInfo(i).replace('id="materialSource"','id="caliphIntroductionSource"');
  return `${section(i.titleRu || 'История халифов')}${para('',i.textRu)}${introSource}${(i.terms || []).map(t => `<section class="review-card"><h3>${clean(t.termRu)}</h3>${para('',t.textRu)}${inlineSources(t.sourceIds)}</section>`).join('')}${search()}${caliphs.profiles.filter(textSearch).map(x => item(x,'caliph')).join('') || empty()}${footer()}`;
}
function favorites() {
  const a = favs.map(findRecord).filter(Boolean);
  return `${section('Избранное')}<p class="lead">Сохранённые материалы в этом браузере.</p>${a.map(x => item(x.data,x.kind)).join('') || '<div class="empty"><span aria-hidden="true">♡</span><h3>Здесь будет избранное</h3><p>Откройте материал и нажмите «В избранное».</p></div>'}${footer()}`;
}
function records() { return [...entries.map(data => ({kind:'dua',data})),...db.names.names.map(data => ({kind:'name',data})),...library.map(data => ({kind:'lib',data})),...history.map(data => ({kind:'history',data})),...(caliphs?.profiles || []).map(data => ({kind:'caliph',data}))]; }
function review() {
  return `${section('Источники и проверка')}<section class="review-card"><h3>Как читать сведения о проверке</h3><p>Сверка с указанным источником и экспертная проверка — разные этапы. Сведения об арабском тексте, транскрипции, переводе и содержании показываются отдельно, если они есть в исходном каталоге. Отсутствие записи о проверке не означает одобрение.</p><p>Подготовленные материалы могут требовать дополнительной проверки. Для религиозно-правовых вопросов учитывайте указанную традицию и контекст конкретных текстов.</p></section><section class="review-card" id="family-review-status"><h3>Семейные уроки: редакционный статус</h3><p>Материалы о правах супругов, никахе, махре, воспитании детей и семейной жизни по примеру Пророка ﷺ подготовлены и технически проверены. Независимая содержательная проверка этих пяти уроков пока не проводилась; экспертное одобрение не заявляется.</p><p>Основа уроков — ссылки на Коран и хадисы. Пересказы смысла, педагогические примеры и различия правовых школ требуют внимательной сверки. Редакционные замечания и история последующих исправлений ведутся централизованно, а не внизу учебных страниц.</p><p>Внутренний документ контроля: <a href="https://github.com/NaFaS-Bek/talab-al-haqq/blob/feature/arabic-reading-signs-lesson/docs/family-curriculum-source-review-2026-11-22.md" target="_blank" rel="noopener noreferrer">Сверка первоисточников семейного раздела</a>.</p></section><details class="source-info"><summary>О проекте</summary><p class="bodycopy" lang="ar" dir="rtl">طلب الحق</p><p class="bodycopy">Talab al-Haqq · Поиск истины</p><p class="bodycopy">Талаб аль-Хакк — исламский образовательный проект для изучения Корана, дуа, азкаров и исламских знаний с уважением к различным традициям и стремлением к достоверности</p><p class="bodycopy">Изучай с открытым сердцем. Ищи истину. Уважай различия</p><p class="attribution">Название обозначает стремление к познанию, а не притязание на исключительную истину.</p></details><details class="source-info"><summary>Офлайн и сохранения</summary><p class="bodycopy">На iPhone: Safari → «Поделиться» → «На экран “Домой”». Затем откройте приложение с новой иконки при подключении к интернету и дождитесь статуса «Доступно офлайн». Только после этого пользуйтесь им без сети.</p><p class="attribution">Safari и приложение на главном экране могут хранить данные отдельно. Сохранения остаются в выбранном браузере или приложении; удаление его данных удаляет локальные записи. Частный режим и очистка хранилища могут ограничивать сохранения.</p></details><details class="source-info" id="quran-display-policy"><summary>Коран: знаки остановки и достоверность отображения</summary><p class="bodycopy">Вакф — остановка, васл — продолжение чтения. Существуют разные настройки экспорта цифрового мусхафа. Отсутствие знака в каталоге само по себе не доказывает ошибку арабского текста.</p><p class="bodycopy">Система знаков по Tanzil: <span lang="ar" dir="rtl">ۘ</span> (م) — обязательная остановка; <span lang="ar" dir="rtl">ۙ</span> (لا) — недопустимая остановка; <span lang="ar" dir="rtl">ۚ</span> (ج) — можно остановиться или продолжить; <span lang="ar" dir="rtl">ۗ</span> (قلى) — предпочтительнее остановиться; <span lang="ar" dir="rtl">ۖ</span> (صلى) — предпочтительнее продолжить; пара <span lang="ar" dir="rtl">ۛ</span> (∴) — выбрать один из двух знаков для остановки, но не оба.</p><p class="bodycopy">У пяти дуа в закреплённом стороннем снимке Tanzil 1.1 найдены 10 знаков ۚ/ۖ, которые отсутствуют на сайте. Их позиции показываются только в раскрывающихся справочных блоках, не внутри арабских аятов. Независимое совпадение с официальной загрузкой Tanzil и экспертная проверка остановок пока не подтверждены.</p><p class="bodycopy">Основной арабский текст, огласовки и транскрипции не следует автоматически исправлять или дополнять по сторонней копии. Для практики чтения пользуйтесь полноценным мусхафом и преподавателем.</p><p class="attribution"><a href="https://tanzil.net/docs/pause_marks" target="_blank" rel="noopener noreferrer">Официальная таблица знаков Tanzil</a> · <a href="https://github.com/NaFaS-Bek/talab-al-haqq/blob/main/docs/quran-source-export-and-rendering-policy-2026-11-22.md" target="_blank" rel="noopener noreferrer">Редакционная политика проекта</a></p></details><details class="source-info"><summary>Лицензия текста Корана</summary><p class="bodycopy">Основа арабского текста: Tanzil Project, CC BY 3.0. В каталоге зафиксированы отличия служебных знаков по сравнению с одним сторонним снимком Uthmani 1.1; точные параметры экспорта ещё требуют независимого подтверждения.</p><a class="action" href="TANZIL-LICENSE.txt">Полный текст лицензии</a></details>${section('Сведения о материалах')}${search()}${records().filter(r => textSearch(r.data)).map(r => item(r.data,r.kind,true)).join('') || empty()}`;
}
function render() {
  document.body.classList.toggle('light',theme === 'light'); $('#themeBtn').innerHTML = uiIcon(theme === 'light' ? 'sun' : 'moon');
  $('#screen').innerHTML = ({home,dua,names,library:knowledge,favorites,review,caliphs:caliphPage}[tab] || home)();
  $('#reviewBtn').setAttribute('aria-pressed', String(tab === 'review'));
  $('#reviewBtn').setAttribute('aria-label', tab === 'review' ? 'Закрыть «Источники и проверка»' : 'Открыть «Источники и проверка»');
  document.querySelectorAll('.bottom button').forEach(b => b.classList.toggle('active',b.dataset.tab === (tab === 'caliphs' ? 'library' : tab)));
}
function findRecord(key) {
  if (typeof key !== 'string') return null;
  const separator = key.indexOf(':'); const kind = key.slice(0,separator), id = key.slice(separator+1);
  const data = (kind === 'dua' ? entries : kind === 'name' ? db.names?.names || [] : kind === 'lib' ? library : kind === 'history' ? history : kind === 'caliph' ? caliphs?.profiles || [] : []).find(x => x.id === id);
  return data ? {kind,data} : null;
}
function para(t,v) { return v ? `${t ? `<h3 class="subheading">${clean(t)}</h3>` : ''}<p class="bodycopy">${clean(v)}</p>` : ''; }
function warning(v) { return v ? `<p class="warning">${clean(v)}</p>` : ''; }
function arabic(v) { return v ? `<div class="arabic" lang="ar" dir="rtl">${clean(v)}</div>` : ''; }
function sourceById(id) { return [...(caliphs?.sources || []),...(db.history?.sources || [])].find(s => s.id === id); }
function sourceCard(r) {
  if (typeof r === 'string') r = {reference:r};
  const labels = {reference:'Издание',collection:'Сборник',location:'Место в источнике',number:'Номер',exactVariant:'Передача',kind:'Вид источника',tradition:'Традиция',note:'Примечание',noteRu:'Примечание',basisNote:'Основание',excerptRu:'Подготовленный отрывок / пояснение',translator:'Атрибуция',textKind:'Вид текста',reviewStatus:'Статус в каталоге',referenceEn:'Название издания',grade:'Оценка',gradeSource:'Источник оценки'};
  return `<div class="source-record">${Object.entries(r).filter(([k,v]) => !['id','url','arabicText'].includes(k) && v != null && v !== '').map(([k,v]) => `<p><strong>${clean(labels[k] || k)}:</strong> ${clean(brandMetadata(typeof v === 'object' ? JSON.stringify(v,null,2) : v))}</p>`).join('')}${r.arabicText ? arabic(r.arabicText) : ''}${r.url && /^https:\/\//.test(r.url) ? `<a class="action" href="${clean(r.url)}" target="_blank" rel="noopener noreferrer">Оригинал на сайте источника ↗</a><p class="attribution">Внешняя страница требует интернета. Подготовленная справка выше доступна офлайн.</p>` : ''}</div>`;
}
function inlineSources(ids) {
  const a = [...new Set(ids || [])].map(sourceById).filter(Boolean);
  return a.length ? `<details class="source-inline"><summary>Источники этого фрагмента</summary>${a.map(sourceCard).join('')}</details>` : '';
}
function refsFor(x) {
  const direct = [...(x.sourceRefs || []),...(x.explanationSources || []),...(x.nameSource ? [x.nameSource] : []),...(x.sections || []).flatMap(s => s.sourceRefs || [])];
  const ids = [...(x.sourceIds || []),...(x.hasanStatusSourceIds || []),...(x.sections || []).flatMap(s => [...(s.sourceIds || []),...(s.views || []).flatMap(v => v.sourceIds || [])]),...(x.paragraphs || []).flatMap(p => p.sourceIds || [])];
  return [...new Map([...direct,...ids.map(sourceById).filter(Boolean)].map(r => [JSON.stringify(r),r])).values()];
}
function statusName(s) { return ({draft:'Подготовлен; проверка не завершена',source_checked:'Сверен с указанными источниками',reviewed:'Отмечен как проверенный в каталоге',published:'Допущен к показу в исходном каталоге'})[s] || s || 'Нет отдельной отметки'; }
function sourceInfo(x) {
  const checks = x.checks || {}; const refs = refsFor(x);
  return `<details class="source-info" id="materialSource"><summary>Об источнике</summary><h3 class="subheading">Проверка материала</h3><p class="bodycopy">${clean(statusName(x.reviewStatus || x.status))}</p>${x.sourceCheckStatus ? para('Сверка источников',statusName(x.sourceCheckStatus)) : ''}${Object.keys(checks).length ? para('Отдельные проверки',Object.entries(checks).map(([k,v]) => `${({arabic:'Арабский текст',transliteration:'Транскрипция',translation:'Перевод'})[k] || k}: ${statusName(v)}`).join('\n')) : ''}${para('Экспертная проверка',x.expertReview ? JSON.stringify(x.expertReview,null,2) : 'Не отмечена как выполненная')}${x.translationAttribution ? para('Атрибуция перевода',brandMetadata(x.translationAttribution)) : ''}${x.transliterationScheme ? para('Транскрипция',brandMetadata(x.transliterationScheme)) : ''}${x.supplication ? para('Источник личной мольбы',x.supplication.source) : ''}${(x.reviewRecords || []).map(r => sourceCard(r)).join('')}${refs.map(sourceCard).join('') || '<p class="attribution">Полная библиографическая справка в этой записи отсутствует.</p>'}<p class="attribution">Редакционная сверка источника сама по себе не подтверждает экспертную проверку содержания.</p><button class="action" data-tab="review" data-close="1">Источники и проверка</button></details>`;
}
function related(ids,kind) { const a = (ids || []).map(id => findRecord(`${kind}:${id}`)).filter(Boolean); return a.length ? `<div class="related">${section('Связанные материалы')}${a.map(r => item(r.data,r.kind)).join('')}</div>` : ''; }
// A reader label comes from verified record metadata, not the surrounding navigation category.
const narrativeQuranEntries = new Set(['q_17_24','q_2_250','q_27_19','q_7_23','q_2_127_128','q_21_83','q_7_89','q_20_25_28','q_21_87','q_21_89','q_5_114']);
function materialType(x) {
  if (x.excerptKind === 'full_surah') return 'Сура для чтения';
  if (x.excerptKind === 'dhikr_instruction') return 'Наставление из хадиса';
  if (x.originKind === 'quran') return 'Кораническое обращение';
  return 'Дуа и азкары';
}
// Display only the source's explicitly stored verse segments. Never auto-cut a sacred quote.
function verseReading(x) {
  if (!['full_surah','verse_range','full_verses'].includes(x.excerptKind) || !Array.isArray(x.segments) || x.segments.length < 2) return '';
  const sourceNumber = x.sourceRefs?.find(r => r.collection === 'Коран')?.number || '';
  const surahNumber = x.surahNumber || Number(sourceNumber.split(':')[0]);
  if (!surahNumber || !x.segments.every(s => /_a\d+$/.test(s.id || '') && s.arabicText && s.translationRu)) return '';
  const rows = x.segments.map(s => {
    const verseNumber = Number(s.id.match(/_a(\d+)$/)[1]);
    return `<section class="verse-card" aria-label="Аят ${surahNumber}:${verseNumber}"><div class="verse-heading">Аят ${surahNumber}:${verseNumber}</div><div class="arabic verse-arabic" lang="ar" dir="rtl">${clean(s.arabicText)}</div><p class="verse-translation">${clean(s.translationRu)}</p></section>`;
  }).join('');
  return `<div class="verse-reader" aria-label="Чтение по аятам"><p class="verse-intro">Текст разделён по аятам для удобного чтения. Перевод передаёт смысл.</p>${rows}</div>`;
}
// Two source-linked timing rules absent from the large catalog are displayed as
// read-only guidance until their metadata can be migrated into data/content.json.
// Each is guarded by its exact narration link and its recorded repetition count.
const sourceLinkedTimingSupplements = Object.freeze({
  h_muslim_2692: {periods:['morning','evening'],sourceUrl:'https://sunnah.com/muslim:2692',count:100},
  h_abudawud_5088: {periods:['morning','evening'],sourceUrl:'https://sunnah.com/abudawud:5088',count:3},
});
function readingTimingNote(x) {
  if (x.excerptKind === 'dhikr_instruction') return '';
  const supplement = sourceLinkedTimingSupplements[x.id];
  const rule = x.timingRule?.periods?.length ? x.timingRule : supplement;
  if (!rule || !Array.isArray(rule.periods) || !rule.periods.length) return '';
  if (!rule.sourceUrl || !x.sourceRefs?.some(ref => ref.url === rule.sourceUrl)) return '';
  const names = {morning:'утром',evening:'вечером'};
  if (!rule.periods.every(p => Object.hasOwn(names,p))) return '';
  const stages = x.repetitionRule?.stages || [];
  if (supplement && !(stages.length === 1 && stages[0].count === supplement.count)) return '';
  const count = stages.length === 1 && Number.isSafeInteger(stages[0].count) && stages[0].count > 0
    && (stages[0].sourceUrl === rule.sourceUrl || supplement?.count === stages[0].count)
    ? stages[0].count : null;
  const periods = [...new Set(rule.periods)].map(p => names[p]).join(' и ');
  return `<p class="reading-note" data-reading-timing="1"><strong>Когда читать по указанному источнику:</strong> ${clean(periods)}${count ? ` · ${count} ${count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'раза' : 'раз'} в каждый период` : ''}. Это не фиксированное время по часам.</p>`;
}
// Short educational explanations for *specific* source-linked hadith cards.
// The canonical catalog remains unchanged. Prefer a note supplied by the
// catalog itself; display these supplements only while source + exact endings
// match the reviewed snapshots (see docs/adhkar-pronunciation-notes-2026-11-22.md).
const sourceLinkedPronunciationSupplements = Object.freeze({
  h_abudawud_5088: {
    sourceUrl:'https://sunnah.com/abudawud:5088',
    arabicEnding:'وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliterationEnding:'ва хува-с-сами‘у-ль-‘алим.',
    note:'Основная транскрипция оканчивается на «…ль-‘алим» — это чтение с остановкой. При чтении без остановки конечная дамма слова «الْعَلِيمُ» звучит как краткое «у»: «…ль-‘алиму». Русская запись приблизительна и не передаёт точно арабские звуки.',
  },
  h_tirmidhi_3391_morning: {
    sourceUrl:'https://sunnah.com/tirmidhi:3391',
    arabicEnding:'وَإِلَيْكَ الْمَصِيرُ',
    transliterationEnding:'ва иляйка-ль-масыр.',
    note:'В конце утренней формулы — «…ва иляйка-ль-масыр». При остановке конечное краткое «у» слова «الْمَصِيرُ» не произносится; при продолжении оно звучит: «…ль-масыру». Не заменяйте утреннее окончание вечерним «ан-нушур»: в этой передаче они различаются.',
  },
  h_tirmidhi_3391_evening: {
    sourceUrl:'https://sunnah.com/tirmidhi:3391',
    arabicEnding:'وَإِلَيْكَ النُّشُورُ',
    transliterationEnding:'ва иляйка-н-нушур.',
    note:'В конце вечерней формулы — «…ва иляйка-н-нушур». При остановке конечное краткое «у» слова «النُّشُورُ» не произносится; при продолжении оно звучит: «…н-нушуру». «Н-н» передаёт удвоенную букву ن в слове «النُّشُورُ». Утреннее окончание в этой передаче другое — «аль-масыр».',
  },
});
// Three Quranic narrative verb forms that look deceptively alike in Russian.
// Notes are NOT an audio or tajwid certification. Every supplement is guarded
// by verse source, exact Arabic word, corresponding Russian substring and segment.
// The verified morphology sources are from the Quranic Arabic Corpus.
const sourceLinkedQuranReadingNotes = Object.freeze({
  q_7_23: {
    sourceNumber:'7:23',
    sourceUrl:'https://quran.com/7/23',
    arabicWord:'قَالَا',
    russianWord:'Каля',
    referenceUrl:'https://corpus.quran.com/wordmorphology.jsp?location=%287%3A23%3A1%29',
    note:'В начале аята قَالَا — qālā («они оба сказали», двойственное число). Здесь два долгих ā, которые приблизительная запись «Каля» не показывает. Это слова повествования перед самой мольбой. Для произношения опирайтесь на арабский текст и проверенное чтение, а не только на кириллицу.',
  },
  q_2_250: {
    sourceNumber:'2:250',
    sourceUrl:'https://quran.com/2/250',
    arabicWord:'قَالُوا۟',
    russianWord:'калю',
    referenceUrl:'https://corpus.quran.com/wordmorphology.jsp?location=%282%3A250%3A5%29',
    note:'В слове قَالُوا — qālū («они сказали», множественное число). Здесь долгие ā и ū: русское «калю» не передаёт их долготу и может вводить в заблуждение. Это повествовательное введение перед словами мольбы. Сверяйте чтение с арабской строкой и записью квалифицированного чтеца.',
  },
  q_20_25_28: {
    sourceNumber:'20:25–28',
    sourceUrl:'https://quran.com/20/25',
    arabicWord:'قَالَ',
    russianWord:'Каля',
    referenceUrl:'https://corpus.quran.com/wordmorphology.jsp?location=%2820%3A25%3A1%29',
    note:'Первое слово قَالَ — qāla («он сказал», единственное число): первый гласный ā долгий, последний a — краткий. Хотя русское «Каля» похоже на запись قَالَا (qālā, «они оба сказали») в другом аяте, это разные формы. Первое слово здесь — повествование о Мусе, а сама мольба начинается со следующего «Рабби».',
  },
  q_21_83: {
    sourceNumber:'21:83',
    sourceUrl:'https://quran.com/21/83',
    arabicWord:'ٱلضُّرُّ',
    russianWord:'д-дурру',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначения звуков: Quranic Arabic Corpus',
    note:'В слове ٱلضُّرُّ есть буква ض (ḍād); в схеме Quranic Arabic Corpus её обозначают ḍ, отдельно от обычной د (d). Русское «д» не передаёт это различие. Здесь также отмечено удвоение رّ. Это объяснение написания, а не проверка произношения на слух.',
  },
  q_21_87: {
    sourceNumber:'21:87',
    sourceUrl:'https://quran.com/21/87',
    arabicWord:'ٱلظُّلُمَٰتِ',
    russianWord:'з-зулюмати',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначения звуков: Quranic Arabic Corpus',
    note:'В слове ٱلظُّلُمَٰتِ буква ظ (ẓā) обозначается ẓ, а не обычной z; «з» в русской подсказке лишь приблизительно. В этом же слове есть долгий гласный ā. Не определяйте точный звук по одной кириллице.',
  },
  q_27_19: {
    sourceNumber:'27:19',
    sourceUrl:'https://quran.com/27/19',
    arabicWord:'أَوْزِعْنِىٓ',
    russianWord:'аузи‘ни',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначения звуков: Quranic Arabic Corpus',
    note:'В أَوْزِعْنِىٓ есть буква ع (ʿayn), которую корпус обозначает знаком ʿ. Знак «‘» в русской подсказке — условное напоминание о звуке, а не знак ударения. Для точного произношения нужен пример чтения, поскольку кириллица не передаёт ʿayn полностью.',
  },
  q_71_28: {
    sourceNumber:'71:28',
    sourceUrl:'https://quran.com/71/28',
    arabicWord:'ٱغْفِرْ',
    russianWord:'гфир',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначения звуков: Quranic Arabic Corpus',
    note:'В ٱغْفِرْ буква غ (ghayn) в схеме транскрипции передаётся gh. Русская «г» в «гфир» не воспроизводит этот звук точно. Не путайте غ (gh) с ع (ʿ): это разные буквы; произношение лучше изучать с преподавателем.',
  },
  q_12_101: {
    sourceNumber:'12:101',
    sourceUrl:'https://quran.com/12/101',
    arabicWord:'ٱلْأَحَادِيثِ',
    russianWord:'ахадис',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначения звуков: Quranic Arabic Corpus',
    note:'В ٱلْأَحَادِيثِ встречаются ح (ḥā) и ث (thā): в схеме корпуса это ḥ и th. Русское «ахадис» не различает их так же, как арабская запись, и не обозначает долгие гласные. Используйте кириллицу только как вспомогательную подсказку.',
  },
  q_5_114: {
    sourceNumber:'5:114',
    sourceUrl:'https://quran.com/5/114',
    arabicWord:'ٱرْزُقْنَا',
    russianWord:'варзукна',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначения звуков: Quranic Arabic Corpus',
    note:'В ٱرْزُقْنَا буква ق (qāf) в схеме корпуса обозначается q, отдельно от ك (kāf, k). Поэтому русское «к» в «варзукна» — упрощение, а не точное описание места образования звука. Арабская строка здесь остаётся основным ориентиром.',
  },
  q_26_169: {
    sourceNumber:'26:169',
    sourceUrl:'https://quran.com/26/169',
    arabicWord:'نَجِّنِى',
    russianWord:'наджжини',
    additionalArabicWord:'مِمَّا',
    additionalRussianWord:'мимма',
    endArabic:'يَعْمَلُونَ',
    endRussian:'йа‘малюн.',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Долгие гласные и шадда: Quranic Arabic Corpus',
    pauseGuideUrl:'https://abouttajweed.com/tajweed-basics/common-tajweed-errors',
    note:'В نَجِّنِى буква جّ удвоена шаддой; в مِمَّا шадда стоит над مّ. В последнем слове يَعْمَلُونَ есть долгое ū. Русская запись «йа‘малюн» передаёт чтение при остановке в конце аята: краткое конечное «а» тогда не читается. При продолжении без остановки окончание отличается. Не выбирайте место остановки только по кириллице.',
  },
  q_21_89: {
    sourceNumber:'21:89',
    sourceUrl:'https://quran.com/21/89',
    arabicWord:'ٱلْوَٰرِثِينَ',
    russianWord:'варисин',
    endArabic:'ٱلْوَٰرِثِينَ',
    endRussian:'варисин.',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Долгие гласные: Quranic Arabic Corpus',
    pauseGuideUrl:'https://abouttajweed.com/tajweed-basics/common-tajweed-errors',
    note:'В конце аята написано ٱلْوَٰرِثِينَ: здесь есть долгие гласные, а у конечной نَ стоит краткая фатха. Русская запись «варисин» приблизительно передаёт остановку в конце аята: краткое конечное «а» не произносится. При чтении слитно, без остановки, форма окончания иная. Это общая учебная подсказка о вакфе, а не указание делать паузу в любом месте.',
  },
  q_14_40_41: {
    sourceNumber:'14:40–41',
    sourceUrl:'https://quran.com/14/40',
    arabicWord:'ذُرِّيَّتِى',
    russianWord:'зурриййати',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначение шадды и долготы: Quranic Arabic Corpus',
    note:'В ذُرِّيَّتِى знаки шадды над رّ и يّ указывают на удвоение соответствующих согласных. В конце слова есть долгая гласная ī. Кириллическое «зурриййати» — лишь приближение: удвоения и долготу нужно различать при чтении арабского текста, а не выводить их из числа русских букв.',
  },
  q_2_127_128: {
    sourceNumber:'2:127–128',
    sourceUrl:'https://quran.com/2/127',
    arabicWord:'مِنَّآ',
    russianWord:'минна',
    referenceUrl:'https://corpus.quran.com/documentation/phonetic.jsp',
    referenceLabel:'Обозначение шадды и долготы: Quranic Arabic Corpus',
    note:'В مِنَّآ над نّ стоит шадда — согласная удваивается; далее следует долгая гласная ā. Русская запись «минна» не показывает долготу. Точное время протяжения и связное чтение зависят от контекста и правил таджвида, поэтому одной кириллицы для обучения произношению недостаточно.',
  }
});
function linkedQuranReadingNote(x) {
  const note = sourceLinkedQuranReadingNotes[x.id];
  if (!note || x.originKind !== 'quran' || x.contentKind !== 'dua') return null;
  if (!x.sourceRefs?.some(ref =>
      ref.collection === 'Коран' && ref.number === note.sourceNumber && ref.url === note.sourceUrl)) return null;
  if (!x.arabicText?.includes(note.arabicWord) ||
      !x.transliterationRu?.includes(note.russianWord)) return null;
  if (!x.segments?.some(s =>
      s.arabicText?.includes(note.arabicWord) &&
      s.transliterationRu?.includes(note.russianWord))) return null;
  // Additional anchors ensure a note about a second word or the final pause
  // disappears if the reviewed text changes in either the source or hint.
  if (note.additionalArabicWord && !x.segments?.some(s =>
      s.arabicText?.includes(note.additionalArabicWord) &&
      s.transliterationRu?.includes(note.additionalRussianWord))) return null;
  if (note.endArabic &&
      (!x.arabicText.endsWith(note.endArabic) ||
       !x.transliterationRu.endsWith(note.endRussian))) return null;
  return note;
}
function pronunciationExplanation(x) {
  if (x.transliterationNoteRu) return x.transliterationNoteRu;
  const quranNote = linkedQuranReadingNote(x);
  if (quranNote) return quranNote.note;
  const supplement = sourceLinkedPronunciationSupplements[x.id];
  if (!supplement || x.originKind !== 'hadith') return '';
  if (!x.sourceRefs?.some(ref => ref.url === supplement.sourceUrl)) return '';
  if (!x.arabicText?.endsWith(supplement.arabicEnding) ||
      !x.transliterationRu?.endsWith(supplement.transliterationEnding)) return '';
  return supplement.note;
}

// A source-comparison layer, NOT permission to change the Quranic text.
// The reviewed snapshot was copied from a *third-party* Tanzil Uthmani 1.1 mirror,
// not an independently authenticated export of Tanzil's current settings.
// These marks are displayed ONLY in a collapsed explanatory panel, never
// interpolated into the Arabic scripture or presented as mandatory pauses.
// Every after-word anchor/position is independently regression-checked against
// tests/fixtures/tanzil-uthmani-1.1-remaining-duas.txt.
const quranPauseSourceComparison = Object.freeze({
  q_14_40_41: {
    sourceNumber:'14:40–41', sourceUrl:'https://quran.com/14/40',
    marks:[{verse:'14:40',after:'ذُرِّيَّتِى',symbol:'ۚ'}],
  },
  q_2_127_128: {
    sourceNumber:'2:127–128', sourceUrl:'https://quran.com/2/127',
    marks:[
      {verse:'2:127',after:'مِنَّآ',symbol:'ۖ'},
      {verse:'2:128',after:'عَلَيْنَآ',symbol:'ۖ'},
    ],
  },
  q_12_101: {
    sourceNumber:'12:101', sourceUrl:'https://quran.com/12/101',
    marks:[
      {verse:'12:101',after:'ٱلْأَحَادِيثِ',symbol:'ۚ'},
      {verse:'12:101',after:'ٱلْـَٔاخِرَةِ',symbol:'ۖ'},
    ],
  },
  q_7_89: {
    sourceNumber:'7:89', sourceUrl:'https://quran.com/7/89',
    marks:[
      {verse:'7:89',after:'مِنْهَا',symbol:'ۚ'},
      {verse:'7:89',after:'ٱللَّهُ رَبُّنَا',symbol:'ۚ'},
      {verse:'7:89',after:'عِلْمًا',symbol:'ۚ'},
      {verse:'7:89',after:'تَوَكَّلْنَا',symbol:'ۚ'},
    ],
  },
  q_5_114: {
    sourceNumber:'5:114', sourceUrl:'https://quran.com/5/114',
    marks:[{verse:'5:114',after:'مِّنكَ',symbol:'ۖ'}],
  },
});
const quranPauseMarkMeaning = Object.freeze({
  'ۚ':'джим (ج): можно сделать паузу или продолжить',
  'ۖ':'сали (صلى): предпочтительнее продолжить чтение',
});
function quranPauseComparison(x) {
  const record = quranPauseSourceComparison[x.id];
  if (!record || x.originKind !== 'quran' || x.contentKind !== 'dua') return '';
  if (!x.sourceRefs?.some(ref =>
      ref.collection === 'Коран' &&
      ref.number === record.sourceNumber &&
      ref.url === record.sourceUrl)) return '';
  // If editorial Quranic text gains pause signs, this "not displayed"
  // warning is no longer true and must be replaced by an audited policy.
  if (/[ۖۚ]/u.test(x.arabicText || '')) return '';
  if (!record.marks.every(mark => {
    const segmentId = x.id + '_a' + mark.verse.split(':')[1];
    const seg = x.segments?.find(s => s.id === segmentId);
    return Boolean(seg?.arabicText?.includes(mark.after)) &&
      x.arabicText.split(mark.after).length === 2 &&
      Object.hasOwn(quranPauseMarkMeaning, mark.symbol);
  })) return '';
  const rows = record.marks.map(mark =>
    '<p class="bodycopy" data-pause-mark="' + clean(mark.symbol.codePointAt(0).toString(16).toUpperCase()) +
    '"><strong>' + clean(mark.verse) + '</strong>: после <span lang="ar" dir="rtl">' +
    clean(mark.after) + '</span> — <span lang="ar" dir="rtl">' + clean(mark.symbol) +
    '</span> (' + clean(quranPauseMarkMeaning[mark.symbol]) + ')</p>'
  ).join('');
  return '<details class="source-inline" data-quran-pause-guide="1"><summary>Знаки остановки: сравнение редакций</summary>' +
    '<p class="bodycopy">В закреплённом стороннем снимке Tanzil Uthmani 1.1 после перечисленных слов есть знаки остановки, которые в текущем тексте сайта не показаны. ' +
    'Причина различий в параметрах выгрузки независимо не установлена. Это редакционная сверка, а не указание обязательно останавливаться в этих местах.</p>' +
    rows +
    '<p class="bodycopy">Вакф — остановка, васл — продолжение чтения. Отсутствие знака в этой записи не означает, что читать нужно без пауз. ' +
    'Для правильного чтения и выбора места остановки сверяйтесь с полным мусхафом и преподавателем.</p>' +
    '<p class="attribution"><a href="https://tanzil.net/docs/pause_marks" target="_blank" rel="noopener noreferrer">Обозначения знаков — Tanzil</a></p>' +
    '</details>';
}

function details(r) {
  const x = r.data, kind = r.kind, key = `${kind}:${x.id}`;
  let html = `<h2 class="detailtitle">${clean(title(x,kind))}</h2><div class="meta material-type">${clean(kind === 'dua' ? materialType(x) : kindTitle[kind])}</div>`;
  if (kind === 'dua') {
    if (narrativeQuranEntries.has(x.id)) html += `<p class="reading-note">Этот аят или отрывок включает повествование, которое не является словами самой мольбы. Полный текст сохранён без сокращений.</p>`;
    if (x.excerptKind === 'dhikr_instruction') html += `<p class="reading-note">Это наставление из хадиса для изучения, а не установленная формула для дословного повторения.</p>`;
    html += readingTimingNote(x);
    const verses = verseReading(x);
    html += verses || arabic(x.arabicText);
    html += quranPauseComparison(x);
    if(x.transliterationRu) { const note = pronunciationExplanation(x); const quranReading = x.transliterationNoteRu ? null : linkedQuranReadingNote(x); html += `<details class="source-inline" open><summary>Транскрипция</summary>${para('',x.transliterationRu)}${note ? `<p class="bodycopy" data-pronunciation-note><strong>Как читать:</strong> ${clean(note)}</p>` : ''}${quranReading ? `<p class="attribution" data-pronunciation-source><a href="${clean(quranReading.referenceUrl)}" target="_blank" rel="noopener noreferrer">${clean(quranReading.referenceLabel || 'Разбор слова: Quranic Arabic Corpus')}</a></p>` : ''}${quranReading?.pauseGuideUrl ? `<p class="attribution" data-pause-source><a href="${clean(quranReading.pauseGuideUrl)}" target="_blank" rel="noopener noreferrer">Общие правила остановки: About Tajweed</a></p>` : ''}</details>`; }
    if (!verses) html += para('Перевод смысла',x.translationRu);
    if (x.translationAttribution) html += `<p class="attribution">${clean(brandMetadata(x.translationAttribution).split(' · ')[0])}</p>`;
    html += para('Контекст',x.contextRu) + para('Пояснение',x.explanationRu);
    const stages = x.repetitionRule?.stages; const goal = stages?.length === 1 ? stages[0].count : null;
    if (x.excerptKind !== 'dhikr_instruction') html += `<div class="counter"><button data-count="minus" aria-label="Уменьшить">−</button><strong id="countValue">${counts[key] || 0}</strong><button data-count="plus" aria-label="Увеличить">+</button></div><p class="lead" style="text-align:center">${goal ? `Счётчик повторений · ${goal} по указанному источнику` : 'Учебный счётчик: число повторений здесь не предписано'}</p><button class="action" data-count="reset">Сбросить счётчик</button>`;
    if(stages?.length > 1) html += para('Порядок повторений',stages.map(s => `${s.labelRu}: ${s.count} раз`).join('\n'));
  }
  if (kind === 'name') {
    html += arabic(x.arabic) + para('Значение',x.meaningRu) + para('Пояснение',x.explanationRu);
    if(x.supplication) html += `<h3 class="subheading">${clean(x.supplication.label || 'Пример личной мольбы')}</h3>` + arabic(x.supplication.arabic) + para('Транскрипция',x.supplication.transliterationRu) + para('Перевод смысла',x.supplication.meaningRu);
  }
  if (kind === 'lib') {
    html += para('Кратко',x.summaryRu);
    for(const s of x.sections || []) html += para(s.titleRu,s.textRu) + arabic(s.arabicText) + para(s.transliterationRu ? 'Транскрипция' : '',s.transliterationRu) + warning(s.disputeRu || s.uncertaintyRu);
    html += related(x.duaEntryIds,'dua');
  }
  if (kind === 'history') {
    html += para('Событие',x.summaryRu) + para('Время',x.dateRu) + para('Место',x.placeRu);
    for(const p of x.paragraphs || []) html += `<section id="paragraph-${clean(p.id)}">${para(p.headingRu,p.textRu)}${warning(p.disputeRu)}${inlineSources(p.sourceIds)}</section>`;
    html += related(x.relatedEventIds,'history');
  }
  if (kind === 'caliph') {
    html += arabic(x.arabicName) + para('Период правления',x.reignRu) + para('Кратко',x.summaryRu) + warning(x.hasanStatusNoteRu) + inlineSources(x.hasanStatusSourceIds);
    for(const s of x.sections || []) html += `<section id="paragraph-${clean(s.id)}">${para(s.titleRu,s.textRu)}${warning(s.uncertaintyRu)}${(s.views || []).map(v => `<section class="review-card"><h3>${clean(v.titleRu || v.tradition)}</h3><p class="badge">${clean(v.tradition)}</p>${para('',v.textRu)}${inlineSources(v.sourceIds)}</section>`).join('')}${inlineSources(s.sourceIds)}</section>`;
    html += related(x.relatedEventIds,'history');
  }
  html += sourceInfo(x) + `<div class="actions"><button class="action highlight" data-fav="${clean(key)}">${favs.includes(key) ? '♥ Убрать из избранного' : '♡ В избранное'}</button><button class="action" data-copy="1">Скопировать текст</button></div>`;
  return html;
}
function persistReading() {
  if (!active) return;
  reading[active.key] = $('.sheet').scrollTop; reading.last = active.key; save('reading',reading);
}
function show(key, about = false, restoredScroll = null) {
  const r = findRecord(key); if(!r) return;
  if(active) { persistReading(); modalStack.push({key:active.key,scroll:$('.sheet').scrollTop}); }
  else lastFocus = document.activeElement;
  active = {key,...r}; $('#detail').innerHTML = details(r); $('#modal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  $('.sheet').scrollTop = restoredScroll ?? reading[key] ?? 0;
  if(about) { $('#materialSource').open = true; $('#materialSource').scrollIntoView(); }
  $('.close').focus({preventScroll:true});
}
function close() {
  persistReading();
  const previous = modalStack.pop();
  if(previous) { active = null; show(previous.key,false,previous.scroll); return; }
  active = null; $('#modal').classList.add('hidden'); document.body.style.overflow = ''; lastFocus?.focus({preventScroll:true});
}
function refreshDetail() { if(!active) return; const y = $('.sheet').scrollTop; const expanded = $('#materialSource')?.open; $('#detail').innerHTML = details(active); if(expanded) $('#materialSource').open = true; $('.sheet').scrollTop = y; }
document.addEventListener('click',async e => {
  const b = e.target.closest('button,[data-close]'); if(!b) return;
  if(b.dataset.tab) { while(active) close(); if(b.dataset.tab === 'review') { toggleReview(); } else { reviewReturnState = null; setTab(b.dataset.tab); if(b.dataset.filter) { duaGroup=b.dataset.filter; render(); } } return; }
  if(b.dataset.close) { close(); return; }
  if(b.id === 'themeBtn') { const next = theme === 'light' ? 'dark' : 'light'; if(save('theme',next)) { theme=next; render(); } return; }
  if(b.dataset.back) { if(b.dataset.back==='dua') duaGroup=null; else {knowledgeGroup=null;educationTopic=null;} query=''; render(); return; }
  if(b.dataset.educationBack) { educationTopic=null; query=''; render(); return; }
  if(b.dataset.educationTopic) { educationTopic=b.dataset.educationTopic; query=''; render(); window.scrollTo(0,0); return; }
  if(b.dataset.homeKnowledge) { setTab('library'); knowledgeGroup=['prayer','basics','surah'].includes(b.dataset.homeKnowledge)?'education':b.dataset.homeKnowledge; educationTopic=['prayer','basics','surah'].includes(b.dataset.homeKnowledge)?b.dataset.homeKnowledge:null; render(); return; }
  if(b.dataset.duaGroup) { duaGroup=b.dataset.duaGroup; query=''; render(); window.scrollTo(0,0); return; }
  if(b.dataset.knowledgeGroup) { knowledgeGroup=b.dataset.knowledgeGroup; educationTopic=null; query=''; render(); window.scrollTo(0,0); return; }
  if(b.dataset.filter) { filter = b.dataset.filter; render(); return; }
  if(b.dataset.open || b.dataset.about) { show(b.dataset.open || b.dataset.about,!!b.dataset.about); return; }
  if(b.dataset.fav) { const k = b.dataset.fav, next = favs.includes(k) ? favs.filter(v=>v!==k) : [...favs,k]; if(save('favs',next)) { favs=next; refreshDetail(); if(tab==='favorites') render(); } return; }
  if(b.dataset.count && active) { const k=active.key; const next={...counts,[k]:b.dataset.count==='reset'?0:Math.max(0,(counts[k]||0)+(b.dataset.count==='plus'?1:-1))}; if(save('counts',next)) {counts=next;$('#countValue').textContent=counts[k];} return; }
  if(b.dataset.copy && active) { const x=active.data;const text=[title(x,active.kind),x.arabicText||x.arabic,x.transliterationRu,x.translationRu||x.meaningRu,x.summaryRu,...(x.sections||[]).map(s=>[s.titleRu,s.textRu].filter(Boolean).join('\n'))].filter(Boolean).join('\n\n');try{await navigator.clipboard.writeText(text);b.textContent='✓ Скопировано';}catch{b.textContent='Копирование недоступно';} }
});
document.addEventListener('input',e => { if(e.target.id==='search') { const start=e.target.selectionStart, end=e.target.selectionEnd; query=e.target.value; render(); const el=$('#search'); el.focus({preventScroll:true}); if(start!==null && end!==null) el.setSelectionRange(start,end); } });
document.addEventListener('keydown',e => {
  if(!active) return;
  if(e.key==='Escape') {close();return;}
  if(e.key==='Tab') {const f=[...$('.sheet').querySelectorAll('button,a,input,summary')].filter(el=>el.getClientRects().length);const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
$('.sheet').addEventListener('scroll',() => { if(active) { reading[active.key]=$('.sheet').scrollTop;reading.last=active.key; } },{passive:true});
window.addEventListener('pagehide',persistReading);
new ResizeObserver(() => document.documentElement.style.setProperty('--nav-height',`${$('#nav').getBoundingClientRect().height}px`)).observe($('#nav'));
Promise.all([fetch('data/content.json').then(r=>{if(!r.ok)throw Error('Не удалось получить содержимое');return r.json();}),fetch('data/caliph_history.json').then(r=>r.ok?r.json():null).catch(()=>null)]).then(([d,c])=>initData(d,c)).catch(err=>{$('#screen').innerHTML=`<p class="warning">Не удалось загрузить материалы. Откройте подготовленный сайт через веб-сервер. ${clean(err.message)}</p>`;});

/* Same-origin static offline release; the storage keys above remain unchanged. */
if('serviceWorker' in navigator && location.protocol!=='file:') {
  const controlledAtLoad=!!navigator.serviceWorker.controller; let reloadRequested=false;
  const status=$('#offlineStatus');
  navigator.serviceWorker.addEventListener('message',e=>{const m=e.data||{};if(m.type==='NFS_PWA_PROGRESS')status.textContent=`Сохраняем для офлайн: ${m.completed} из ${m.total}`;if(m.type==='NFS_PWA_INSTALL_ERROR')status.textContent='Офлайн-загрузка не завершена. Освободите место и обновите страницу при подключении к интернету.';});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadRequested||!controlledAtLoad){persistReading();location.reload();}});
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(async registration=>{
    const offer=()=>{if(registration.waiting)$('#updateBanner').hidden=false;};offer();
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offer();});});
    $('#reloadUpdate').onclick=()=>{persistReading();reloadRequested=true;registration.waiting?.postMessage({type:'NFS_PWA_ACTIVATE'});};
    $('#dismissUpdate').onclick=()=>{$('#updateBanner').hidden=true;};
    await navigator.serviceWorker.ready;
    const worker=navigator.serviceWorker.controller||registration.active;
    if(worker){const channel=new MessageChannel();channel.port1.onmessage=e=>{status.textContent=e.data.state==='ready'?'Доступно офлайн':'Офлайн-копия не готова. Обновите страницу при подключении к интернету.';channel.port1.close();};worker.postMessage({type:'NFS_PWA_STATUS'},[channel.port2]);}
  }).catch(()=>{status.textContent='Офлайн-копия пока недоступна. Откройте сайт по HTTPS и обновите страницу.';});
}
