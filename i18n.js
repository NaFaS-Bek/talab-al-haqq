/* Language UI foundation. Never translate religious source text automatically. */
(function () {
  'use strict';
  const KEY = 'nfs_lang';
  const LOCALES = ['ru', 'tg'];
  const translations = Object.freeze({
    'Главная': 'Асосӣ', 'Дуа': 'Дуо', 'Имена': 'Номҳо', 'Знания': 'Дониш',
    'Избранное': 'Дӯстдоштаҳо', 'Источники и проверка': 'Сарчашмаҳо ва санҷиш',
    'Пусть каждый день начинается с доброго': 'Бигзор ҳар рӯз бо некӣ оғоз шавад',
    'Дуа, утренние и вечерние азкары, имена Аллаха и исламские знания — в одном месте.':
      'Дуоҳо, зикрҳои субҳу шом, номҳои Аллоҳ ва донишҳои исломӣ — дар як ҷой.',
    'Открыть молитвы →': 'Дуоҳоро кушодан →',
    'Продолжить чтение': 'Идомаи мутолиа', 'Разделы': 'Бахшҳо',
    'Утренние азкары': 'Зикрҳои субҳ', 'Начать день с поминания': 'Рӯзро бо зикр оғоз кунед',
    'Вечерние азкары': 'Зикрҳои шом', 'Мольбы перед ночью': 'Дуоҳо пеш аз шаб',
    'Дуа по ситуациям': 'Дуоҳо барои ҳолатҳои гуногун', 'Обращения к Аллаху': 'Муроҷиат ба Аллоҳ',
    '99 имён Аллаха': '99 номи Аллоҳ', 'Значения и размышления': 'Маъноҳо ва андешаҳо',
    'Исламские знания': 'Донишҳои исломӣ', 'Вера, пророки, люди и события': 'Имон, паёмбарон, шахсиятҳо ва рӯйдодҳо',
    'История халифов': 'Таърихи халифаҳо', 'Биографии и источники': 'Зиндагиномаҳо ва сарчашмаҳо',
    'Поучительные истории': 'Қиссаҳои ибратомӯз',
    'Восемнадцать рассказов о семье, милосердии и мудрости': '18 аз 18 қисса ба тоҷикӣ: оила, меҳрубонӣ ва хирад',
    'О проекте': 'Дар бораи лоиҳа',
    'Для кого сайт, источники и границы образовательных материалов':
      'Мақсади сомона, сарчашмаҳо ва ҳудуди маводи омӯзишӣ',
    'Муж и жена: права и обязанности': 'Зану шавҳар: ҳуқуқ ва уҳдадориҳо',
    'Коран, хадисы и жизненные примеры': 'Қуръон, ҳадисҳо ва мисолҳои зиндагӣ',
    'С чего начать': 'Аз куҷо оғоз кунем', 'Основы ислама': 'Асосҳои ислом',
    'Вера, поклонение и повседневная практика': 'Имон, ибодат ва амалҳои рӯзмарра',
    'Истории пророков': 'Қиссаҳои паёмбарон', 'Биографии и уроки историй': 'Зиндагиномаҳо ва пандҳои қиссаҳо',
    'Исторические события': 'Рӯйдодҳои таърихӣ',
    'Хронология исламской истории': 'Пайдарҳамии таърихи ислом',
    'Часто ищут': 'Бештар ҷустуҷӯ мекунанд', 'Смотреть всё →': 'Ҳамаро дидан →',
    'Дуа и азкары': 'Дуоҳо ва зикрҳо', 'Суры для чтения': 'Сураҳо барои қироат',
    'Выберите тему. Материалы появятся только внутри выбранного раздела.':
      'Мавзӯъро интихоб кунед. Мавод танҳо дар бахши интихобшуда нишон дода мешавад.',
    'Открыть материалы раздела': 'Маводи бахшро кушоед',
    'Материалов:': 'Шумораи мавод:', 'Назад к разделам': 'Бозгашт ба бахшҳо',
    'Подходящих материалов нет. Попробуйте другой запрос или откройте каталог тем.':
      'Маводи мувофиқ ёфт нашуд. Дархости дигарро санҷед ё феҳристи мавзӯъҳоро кушоед.',
    'Написание, значение и примеры личной мольбы.':
      'Навишт, маъно ва намунаҳои дуои шахсӣ.',
    'Обучение исламу': 'Омӯзиши ислом',
    'Намаз, тахарат, арабский алфавит, чтение и основы':
      'Намоз, таҳорат, алифбои арабӣ, қироат ва асосҳо',
    'Жизнь пророков и уроки их историй':
      'Зиндагии паёмбарон ва пандҳои қиссаҳои онҳо',
    'Семья и отношения': 'Оила ва муносибатҳо',
    'Права, обязанности и уважение': 'Ҳуқуқ, уҳдадориҳо ва эҳтиром',
    'Хронология и важные события': 'Пайдарҳамӣ ва рӯйдодҳои муҳим',
    'Выберите направление. Все учебные материалы собраны в разделе «Обучение исламу».':
      'Самтро интихоб кунед. Ҳамаи маводи дарсӣ дар бахши «Омӯзиши ислом» ҷамъ шудаанд.',
    'Пять столпов ислама': 'Панҷ рукни ислом',
    'Первый шаг: шахада, намаз, закят, пост и хадж':
      'Қадами аввал: шаҳодат, намоз, закот, рӯза ва ҳаҷ',
    'Намаз и омовение (тахарат)': 'Намоз ва таҳорат',
    'Как совершать поклонение и очищение': 'Чӣ гуна ибодат ва покӣ анҷом дода мешавад',
    'Арабский алфавит и огласовки': 'Алифбои арабӣ ва ҳаракатҳо',
    '28 букв, фатха, касра, дамма, тренировка':
      '28 ҳарф, фатҳа, касра, дамма ва машқ',
    'Вера, намерение и нравственность': 'Имон, ният ва ахлоқ',
    'Короткие суры': 'Сураҳои кӯтоҳ',
    'Материалы для изучения и чтения': 'Мавод барои омӯзиш ва қироат',
    'Начните с пяти столпов ислама, затем изучайте намаз, омовение, арабское письмо и чтение.':
      'Аз панҷ рукни ислом оғоз карда, сипас намоз, таҳорат, хатти арабӣ ва қироатро омӯзед.',
    'Найти материал': 'Ҷустуҷӯи мавод', 'Найти материал…': 'Маводро ҷустуҷӯ кунед…',
    'Подготовлен; проверка не завершена': 'Омода шудааст; санҷиш ҳанӯз анҷом наёфтааст',
    'Сверен с указанными источниками': 'Бо сарчашмаҳои овардашуда муқоиса шудааст',
    'Экспертная проверка:': 'Санҷиши коршиносӣ:',
    'не отмечена': 'қайд нашудааст', 'Сведения о материалах': 'Маълумот дар бораи мавод',
    'Сохранённые материалы в этом браузере.': 'Маводи захирашуда дар ин браузер.',
    'Здесь будет избранное': 'Маводи дӯстдошта дар ин ҷо пайдо мешавад',
    'Откройте материал и нажмите «В избранное».':
      'Маводро кушоед ва «Ба дӯстдоштаҳо» -ро пахш кунед.',
    'Нет отдельной отметки': 'Нишонаи ҷудогона вуҷуд надорад'
  });
  const notice = 'Қисме аз маводи динӣ ҳоло ба забони русӣ пешниҳод мешавад. Тарҷумаи тоҷикӣ дар ҳоли омодасозӣ ва санҷиш аст.';
  function language() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); return LOCALES.includes(v) ? v : 'ru'; }
    catch (_) { return 'ru'; }
  }
  function pageKind() {
    const name = location.pathname.split('/').pop();
    if (name === 'about.html' || name === 'about-tg.html') return 'about';
    if (name === 'stories.html' || name === 'stories-tg.html') return 'stories';
    return 'other';
  }
  function setLanguage(lang) {
    if (!LOCALES.includes(lang)) return;
    try { localStorage.setItem(KEY, JSON.stringify(lang)); } catch (_) {}
    if (pageKind() === 'about' || pageKind() === 'stories') {
      const destination = pageKind() === 'about'
        ? (lang === 'tg' ? 'about-tg.html' : 'about.html')
        : (lang === 'tg' ? 'stories-tg.html' : 'stories.html');
      if (location.pathname.split('/').pop() !== destination) {
        location.assign(destination + location.search + location.hash);
        return;
      }
    }
    renderSwitcher();
    document.dispatchEvent(new CustomEvent('talab-language-change', { detail: { lang } }));
    apply();
  }
  function renderSwitcher() {
    const slot = document.getElementById('talab-lang-switch');
    if (!slot) return;
    const lang = pageKind() !== 'other'
      ? (location.pathname.split('/').pop().endsWith('-tg.html') ? 'tg' : 'ru')
      : language();
    slot.querySelectorAll('button[data-language]').forEach(btn => {
      const selected = btn.dataset.language === lang;
      btn.setAttribute('aria-pressed', String(selected));
      btn.classList.toggle('is-selected', selected);
    });
  }
  function mountSwitcher() {
    if (document.getElementById('talab-lang-switch')) return;
    const header = document.querySelector('.header-actions') || document.querySelector('body > header');
    if (!header) return;
    const slot = document.createElement('div');
    slot.id = 'talab-lang-switch';
    slot.className = 'talab-lang-switch';
    slot.setAttribute('role', 'group');
    slot.setAttribute('aria-label', 'Язык сайта / Забони сомона');
    slot.innerHTML = '<button type="button" data-language="ru" lang="ru">Русский</button>' +
      '<button type="button" data-language="tg" lang="tg">Тоҷикӣ</button>';
    header.insertBefore(slot, header.firstChild);
    slot.addEventListener('click', e => {
      const target = e.target.closest('button[data-language]');
      if (target) setLanguage(target.dataset.language);
    });
    renderSwitcher();
  }
  const blocked = '.arabic, [lang="ar"], .verse-translation, .bodycopy, .source-record, .reading-note, .attribution, .source-info';
  function translateNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.parentElement?.closest(blocked)) continue;
      const old = node.nodeValue;
      const key = old.trim();
      if (!Object.prototype.hasOwnProperty.call(translations, key)) continue;
      node.nodeValue = old.replace(key, translations[key]);
    }
    root.querySelectorAll('[placeholder],[aria-label]').forEach(el => {
      for (const attr of ['placeholder','aria-label']) {
        const before = el.getAttribute(attr);
        if (before && Object.prototype.hasOwnProperty.call(translations,before)) {
          el.setAttribute(attr,translations[before]);
        }
      }
    });
  }
  function apply() {
    const lang = pageKind() !== 'other'
      ? (location.pathname.endsWith('-tg.html') ? 'tg' : 'ru')
      : language();
    document.documentElement.setAttribute('lang', lang);
    renderSwitcher();
    if (pageKind() !== 'other') return;
    const screen = document.getElementById('screen');
    let msg = document.getElementById('talab-translation-notice');
    if (lang === 'tg') {
      translateNodes(screen);
      translateNodes(document.getElementById('nav'));
      if (screen && !msg) {
        msg = document.createElement('p');
        msg.id = 'talab-translation-notice';
        msg.className = 'talab-translation-notice';
        msg.setAttribute('role','note');
        screen.prepend(msg);
      }
      if (msg) msg.textContent = notice;
      if (screen) {
        screen.querySelectorAll('a[href="about.html"]').forEach(a => a.href='about-tg.html');
        screen.querySelectorAll('a[href="stories.html"]').forEach(a => a.href='stories-tg.html');
      }
     } else {
      if (msg) msg.remove();
      const nav = document.getElementById('nav');
      if (nav) {
        const reverse = Object.fromEntries(Object.entries(translations).map(([ru,tg])=>[tg,ru]));
        const walker = document.createTreeWalker(nav, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const node of nodes) {
          const value = node.nodeValue.trim();
          if (Object.prototype.hasOwnProperty.call(reverse,value)) node.nodeValue = node.nodeValue.replace(value,reverse[value]);
        }
      }
    }
  }
  const style = document.createElement('style');
  style.textContent = '.talab-lang-switch{display:inline-flex;gap:3px;padding:3px;border:1px solid #63816d;border-radius:12px;align-items:center;max-width:100%;flex-shrink:0}' +
    '.talab-lang-switch button{cursor:pointer;font:600 12px/1.2 system-ui,sans-serif;min-height:34px;min-width:48px;padding:5px 7px;border:0;border-radius:8px;color:inherit;background:transparent}' +
    '.talab-lang-switch button.is-selected{background:#456c59;color:#fff}' +
    '.talab-lang-switch button:focus-visible{outline:3px solid #d9c693;outline-offset:2px}' +
    '.talab-translation-notice{border:1px solid #68836e;border-radius:12px;padding:10px 14px;font-size:.92rem;margin:10px 0 16px;line-height:1.5}' +
    '@media(max-width:600px){.top{flex-wrap:wrap;gap:8px}.top .header-actions{width:100%;display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}.top .brand{max-width:100%}}';
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded', () => {
    if (pageKind() !== 'other') {
      const pageLanguage = location.pathname.endsWith('-tg.html') ? 'tg' : 'ru';
      try { localStorage.setItem(KEY, JSON.stringify(pageLanguage)); } catch (_) {}
    }
    mountSwitcher();
    apply();
  });
  window.TalabI18n = Object.freeze({ language, setLanguage, apply, translations });
})();
