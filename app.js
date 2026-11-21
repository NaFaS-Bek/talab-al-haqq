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
let knowledgeGroup = null, duaGroup = null;
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
function setTab(t) { tab = t; query = ''; filter = 'all'; knowledgeGroup = null; duaGroup = null; render(); window.scrollTo(0, 0); }
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
function footer() { return `<footer class="footer"><button class="action" data-tab="review">Источники и проверка</button></footer>`; }
function home() {
  const last = reading.last && findRecord(reading.last);
  return `<section class="hero"><span class="eyebrow" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span><h1>Пусть каждый день начинается с доброго</h1><p>Дуа, утренние и вечерние азкары, имена Аллаха и исламские знания — в одном месте.</p><button data-tab="dua">Открыть молитвы →</button></section>${last ? section('Продолжить чтение') + item(last.data,last.kind) : ''}${section('Разделы')}<div class="grid"><button class="tile" data-tab="dua" data-filter="morning"><span class="emoji" aria-hidden="true">${uiIcon('sun')}</span><strong>Утренние азкары</strong><small>Начать день с поминания</small></button><button class="tile" data-tab="dua" data-filter="evening"><span class="emoji" aria-hidden="true">${uiIcon('moon')}</span><strong>Вечерние азкары</strong><small>Мольбы перед ночью</small></button><button class="tile" data-tab="dua"><span class="emoji" aria-hidden="true">${uiIcon('dua')}</span><strong>Дуа по ситуациям</strong><small>Обращения к Аллаху</small></button><button class="tile" data-tab="names"><span class="emoji" aria-hidden="true">${uiIcon('names')}</span><strong>99 имён Аллаха</strong><small>Значения и размышления</small></button><button class="tile" data-tab="library"><span class="emoji" aria-hidden="true">${uiIcon('library')}</span><strong>Исламские знания</strong><small>Вера, пророки, люди и события</small></button><button class="tile" data-tab="caliphs"><span class="emoji" aria-hidden="true">${uiIcon('library')}</span><strong>История халифов</strong><small>Биографии и источники</small></button></div>${section('С чего начать')}<div class="quicklinks">${groupButton('Основы ислама','Вера, поклонение и повседневная практика','data-home-knowledge','basics')}${groupButton('Истории пророков','Биографии и уроки историй','data-home-knowledge','prophet')}${groupButton('Исторические события','Хронология исламской истории','data-home-knowledge','events')}</div>${section('Часто ищут','dua')}${entries.slice(0,3).map(x => item(x,'dua')).join('')}${footer()}`;
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
    {id:'basics',title:'Основы ислама',desc:'Вера, намерение и нравственность'},
    {id:'prayer',title:'Намаз и омовение',desc:'Порядок поклонения и различия школ'},
    {id:'surah',title:'Короткие суры',desc:'Тексты и пояснения'},
    {id:'prophet',title:'Истории пророков',desc:'Жизнь пророков и уроки их историй'},
    {id:'family',title:'Семья и отношения',desc:'Права, обязанности и уважение'},
    {id:'events',title:'Исторические события',desc:'Хронология и важные события'},
    {id:'caliphs',title:'История халифов',desc:'Биографии и источники'}
  ];
  const records = [...library.map(x=>({...x,_kind:'lib'})),...history.map(x=>({...x,_kind:'history'}))];
  if (!knowledgeGroup) return `${section('Исламские знания')}<p class="lead">Выберите направление. Материалы распределены по разделам каталога.</p>${search()}${query ? records.filter(textSearch).map(x=>item(x,x._kind)).join('') || empty() : groups.map(g=>groupButton(g.title,g.desc,'data-knowledge-group',g.id,g.id==='caliphs' ? (caliphs?.profiles?.length ?? 0) : records.filter(x=>(x._kind==='history'?'events':x.kind)===g.id).length)).join('')}${footer()}`;
  if (knowledgeGroup === 'caliphs') return `${backButton('library')}${caliphPage()}`;
  const g = groups.find(g=>g.id===knowledgeGroup);
  const arr = records.filter(x=>(x._kind === 'history' ? 'events' : x.kind)===knowledgeGroup && textSearch(x));
  return `${backButton('library')}${section(g?.title || 'Исламские знания')}${search()}<p class="lead">Материалов: ${arr.length}</p>${arr.map(x=>item(x,x._kind)).join('') || empty()}${footer()}`;
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
  return `${section('Источники и проверка')}<section class="review-card"><h3>Как читать сведения о проверке</h3><p>Сверка с указанным источником и экспертная проверка — разные этапы. Сведения об арабском тексте, транскрипции, переводе и содержании показываются отдельно, если они есть в исходном каталоге. Отсутствие записи о проверке не означает одобрение.</p><p>Подготовленные материалы могут требовать проверки специалистом. Для религиозно-правовых вопросов учитывайте указанную традицию и обращайтесь к компетентному специалисту. Спорные детали и ограничения конкретного сообщения остаются рядом с ним.</p></section><details class="source-info"><summary>О проекте</summary><p class="bodycopy" lang="ar" dir="rtl">طلب الحق</p><p class="bodycopy">Talab al-Haqq · Поиск истины</p><p class="bodycopy">Талаб аль-Хакк — исламский образовательный проект для изучения Корана, дуа, азкаров и исламских знаний с уважением к различным традициям и стремлением к достоверности</p><p class="bodycopy">Изучай с открытым сердцем. Ищи истину. Уважай различия</p><p class="attribution">Название обозначает стремление к познанию, а не притязание на исключительную истину.</p></details><details class="source-info"><summary>Офлайн и сохранения</summary><p class="bodycopy">На iPhone: Safari → «Поделиться» → «На экран “Домой”». Затем откройте приложение с новой иконки при подключении к интернету и дождитесь статуса «Доступно офлайн». Только после этого пользуйтесь им без сети.</p><p class="attribution">Safari и приложение на главном экране могут хранить данные отдельно. Сохранения остаются в выбранном браузере или приложении; удаление его данных удаляет локальные записи. Частный режим и очистка хранилища могут ограничивать сохранения.</p></details><details class="source-info"><summary>Лицензия текста Корана</summary><p class="bodycopy">Текст Корана: Tanzil Project, CC BY 3.0. Арабский текст сохранён без изменений.</p><a class="action" href="TANZIL-LICENSE.txt">Полный текст лицензии</a></details>${section('Сведения о материалах')}${search()}${records().filter(r => textSearch(r.data)).map(r => item(r.data,r.kind,true)).join('') || empty()}`;
}
function render() {
  document.body.classList.toggle('light',theme === 'light'); $('#themeBtn').innerHTML = uiIcon(theme === 'light' ? 'sun' : 'moon');
  $('#screen').innerHTML = ({home,dua,names,library:knowledge,favorites,review,caliphs:caliphPage}[tab] || home)();
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
  if (!surahNumber || !x.segments.every(s => /_a\\d+$/.test(s.id || '') && s.arabicText && s.translationRu)) return '';
  const rows = x.segments.map(s => {
    const verseNumber = Number(s.id.match(/_a(\\d+)$/)[1]);
    return `<section class="verse-card" aria-label="Аят ${surahNumber}:${verseNumber}"><div class="verse-heading">Аят ${surahNumber}:${verseNumber}</div><div class="arabic verse-arabic" lang="ar" dir="rtl">${clean(s.arabicText)}</div><p class="verse-translation">${clean(s.translationRu)}</p></section>`;
  }).join('');
  return `<div class="verse-reader" aria-label="Чтение по аятам"><p class="verse-intro">Текст разделён по аятам для удобного чтения. Перевод передаёт смысл.</p>${rows}</div>`;
}
function details(r) {
  const x = r.data, kind = r.kind, key = `${kind}:${x.id}`;
  let html = `<h2 class="detailtitle">${clean(title(x,kind))}</h2><div class="meta material-type">${clean(kind === 'dua' ? materialType(x) : kindTitle[kind])}</div>`;
  if (kind === 'dua') {
    if (narrativeQuranEntries.has(x.id)) html += `<p class="reading-note">Этот аят или отрывок включает повествование, которое не является словами самой мольбы. Полный текст сохранён без сокращений.</p>`;
    if (x.excerptKind === 'dhikr_instruction') html += `<p class="reading-note">Это наставление из хадиса для изучения, а не установленная формула для дословного повторения.</p>`;
    const verses = verseReading(x);
    html += verses || arabic(x.arabicText);
    if(x.transliterationRu) html += `<details class="source-inline" open><summary>Транскрипция</summary>${para('',x.transliterationRu)}</details>`;
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
  if(b.dataset.tab) { while(active) close(); setTab(b.dataset.tab); if(b.dataset.filter) { duaGroup=b.dataset.filter; render(); } return; }
  if(b.dataset.close) { close(); return; }
  if(b.id === 'themeBtn') { const next = theme === 'light' ? 'dark' : 'light'; if(save('theme',next)) { theme=next; render(); } return; }
  if(b.dataset.back) { if(b.dataset.back==='dua') duaGroup=null; else knowledgeGroup=null; query=''; render(); return; }
  if(b.dataset.homeKnowledge) { setTab('library'); knowledgeGroup=b.dataset.homeKnowledge; render(); return; }
  if(b.dataset.duaGroup) { duaGroup=b.dataset.duaGroup; query=''; render(); window.scrollTo(0,0); return; }
  if(b.dataset.knowledgeGroup) { knowledgeGroup=b.dataset.knowledgeGroup; query=''; render(); window.scrollTo(0,0); return; }
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
