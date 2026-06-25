// utils/family-logic.js
const { formatLifeRange } = require('./life-format');
const EventColors = require('./event-colors');

const STANDARD_ROW_H = 56;
const STANDARD_ROW_STEP = 56;
const TIMELINE_ROW_H = 48;
const TIMELINE_ROW_STEP = STANDARD_ROW_STEP;
const INDENT_W = 80; 
const PX_PER_YEAR = 6; 
const CURRENT_YEAR = 2026;
const TIMELINE_LEAD_YEARS = 80;
const TIMELINE_TRAIL_YEARS = 80;
const TIMELINE_EDGE_PAD = 48;
const TIMELINE_CHILD_TRUNK_LEAD_YEARS = 4.5;
const TIMELINE_YEAR_EDGE_W = 2;
const TIMELINE_YEAR_EDGE_INSET = (PX_PER_YEAR - TIMELINE_YEAR_EDGE_W) / 2;
const TIMELINE_CONNECTOR_EVENT_CLEARANCE = 2;
const SONG_JURISDICTION_START_YEAR = 960;
const SONG_JURISDICTION_END_YEAR = 1279;
const NODE_BORDER_W = 2;
const PERSONAL_EVENT_MARK_GAP = 2;
const PERSONAL_EVENT_BAND_TEXT_H = 34;
const TRUNK_OFFSET = 40; 
const STANDARD_NODE_MIN_W = 260;
const FIRST_CHILD_GENERATION_GAP = 25;
const SIBLING_GAP = 2;
const EVENT_LABEL_LANES = 2;
const EVENT_LABEL_GAP = 10;
const EVENT_LABEL_SHORT_GAP = 4;
const EVENT_LABEL_MIN_W = 44;
const EVENT_LABEL_PAD_X = 10;
const EVENT_LABEL_ASCII_W = 10;
const EVENT_LABEL_CJK_W = 18;
const EVENT_LABEL_NUDGE_X = 22;
const EVENT_LABEL_MAX_SHIFT_X = 84;
const CURRENT_YEAR_LABEL_GAP = 2;
const EVENT_LABEL_COLORS = ['#c2892b', '#508980', '#846f97'];
const EVENT_LABEL_IMPERIAL_COLOR = '#e6aa00';
const EVENT_LABEL_CROWN_PRINCE_COLOR = '#00796b';
const EVENT_LABEL_EMPRESS_COLOR = '#b56f14';
const EVENT_LABEL_NOBLE_CONSORT_COLOR = '#a26e18';
const EVENT_LABEL_CURRENT_COLOR = '#e65100';

function getTimelineYearStartX(year, startYear) {
  return (year - startYear) * PX_PER_YEAR;
}

function getTimelineYearMarkLeftX(year, startYear) {
  return getTimelineYearStartX(year, startYear) + TIMELINE_YEAR_EDGE_INSET;
}

function getTimelineYearMarkRightX(year, startYear) {
  return getTimelineYearMarkLeftX(year, startYear) + TIMELINE_YEAR_EDGE_W;
}

function getTimelineRangeRect(start, end, startYear) {
  const first = Math.min(start, end);
  const last = Math.max(start, end);
  const x = getTimelineYearMarkLeftX(first, startYear);
  const right = getTimelineYearMarkRightX(last, startYear);
  return {
    x,
    w: Math.max(TIMELINE_YEAR_EDGE_W, right - x)
  };
}

const HOMETOWN_PREFIXES = [
  "黑龙江",
  "黑龍江",
  "内蒙古",
  "內蒙古",
  "南直隶",
  "南直隸",
  "直隶",
  "直隸",
  "山东",
  "山東",
  "山西",
  "河南",
  "河北",
  "陕西",
  "陝西",
  "甘肃",
  "甘肅",
  "青海",
  "四川",
  "云南",
  "雲南",
  "贵州",
  "貴州",
  "湖南",
  "湖北",
  "浙江",
  "江西",
  "江苏",
  "江蘇",
  "安徽",
  "福建",
  "广东",
  "廣東",
  "广西",
  "廣西",
  "海南",
  "辽宁",
  "遼寧",
  "吉林",
  "台湾",
  "臺灣",
  "台灣",
  "新疆",
  "西藏",
  "宁夏",
  "寧夏",
  "湖广",
  "湖廣",
  "江南",
  "顺天府",
  "順天府",
  "顺天",
  "順天",
  "应天府",
  "應天府",
  "应天",
  "應天",
  "奉天府",
  "奉天"
].sort((a, b) => b.length - a.length);

const PRE_TANG_HOMETOWN_PREFIXES = Array.from(new Set([
  "琅琊",
  "瑯琊",
  "琅邪",
  "河南",
  "河东",
  "河東",
  "河内",
  "河內",
  "弘农",
  "弘農",
  "京兆",
  "冯翊",
  "馮翊",
  "扶风",
  "扶風",
  "陇西",
  "隴西",
  "天水",
  "安定",
  "北地",
  "武威",
  "敦煌",
  "酒泉",
  "金城",
  "陈郡",
  "陳郡",
  "陈留",
  "陳留",
  "颍川",
  "潁川",
  "汝南",
  "南阳",
  "南陽",
  "荥阳",
  "滎陽",
  "谯郡",
  "譙郡",
  "谯国",
  "譙國",
  "沛国",
  "沛國",
  "彭城",
  "下邳",
  "东海",
  "東海",
  "鲁郡",
  "魯郡",
  "泰山",
  "济南",
  "濟南",
  "济阴",
  "濟陰",
  "平原",
  "北海",
  "乐安",
  "樂安",
  "东平",
  "東平",
  "山阳",
  "山陽",
  "魏郡",
  "太原",
  "清河",
  "博陵",
  "范阳",
  "范陽",
  "赵郡",
  "趙郡",
  "广平",
  "廣平",
  "高阳",
  "高陽",
  "河间",
  "河間",
  "中山",
  "常山",
  "上党",
  "上黨",
  "西河",
  "雁门",
  "雁門",
  "代郡",
  "渔阳",
  "漁陽",
  "上谷",
  "辽东",
  "遼東",
  "昌黎",
  "乐浪",
  "樂浪",
  "兰陵",
  "蘭陵",
  "东莞",
  "東莞",
  "吴郡",
  "吳郡",
  "会稽",
  "會稽",
  "吴兴",
  "吳興",
  "义兴",
  "義興",
  "丹阳",
  "丹陽",
  "庐江",
  "廬江",
  "豫章",
  "南郡",
  "江夏",
  "武陵",
  "长沙",
  "長沙",
  "零陵",
  "巴郡",
  "蜀郡",
  "广汉",
  "廣漢",
  "犍为",
  "犍為",
  "巴西",
  "梓潼"
])).sort((a, b) => b.length - a.length);


const POST_TANG_ADMIN_MARKERS = '省市府州郡国國路道厅廳军軍监監';

function stripCountySuffixRest(raw) {
  const countyIndex = Math.max(raw.lastIndexOf('县'), raw.lastIndexOf('縣'));
  if (countyIndex < 0) return '';
  const beforeCounty = raw.slice(0, countyIndex);
  let markerIndex = -1;
  for (let i = beforeCounty.length - 1; i >= 0; i -= 1) {
    if (POST_TANG_ADMIN_MARKERS.includes(beforeCounty[i])) {
      markerIndex = i;
      break;
    }
  }
  let start = markerIndex >= 0 ? markerIndex + 1 : 0;
  if (start === 0) {
    for (let prefix of HOMETOWN_PREFIXES) {
      if (raw.startsWith(prefix) && raw.length > prefix.length) {
        start = prefix.length;
        break;
      }
    }
  }
  const county = raw.slice(start, countyIndex + 1).replace(/^(省|市|行省|布政使司)/, '');
  return /^[\u4e00-\u9fff]{1,6}(县|縣)$/.test(county) ? county : '';
}

function getHistoricalCommanderyFromAnywhere(raw, options = {}) {
  const allowLongRest = !!options.allowLongRest;
  let best = '';
  let bestIndex = Infinity;
  for (let prefix of PRE_TANG_HOMETOWN_PREFIXES) {
    const index = raw.indexOf(prefix);
    if (index < 0) continue;
    const rest = raw.slice(index + prefix.length);
    if (hasModernHometownMarker(rest)) continue;
    const valid = !rest
      || /^(郡|国|國)/.test(rest)
      || /^[\u4e00-\u9fff]{1,4}(县|縣)?$/.test(rest)
      || allowLongRest;
    if (!valid) continue;
    if (index < bestIndex || (index === bestIndex && prefix.length > best.length)) {
      best = prefix;
      bestIndex = index;
    }
  }
  return best;
}

function stripLeadingModernJurisdiction(raw) {
  for (let prefix of HOMETOWN_PREFIXES) {
    if (!raw.startsWith(prefix)) continue;
    const rest = raw.slice(prefix.length).replace(/^(省|市|行省|布政使司|自治区|自治區|特别行政区|特別行政區)/, '');
    return rest || prefix;
  }
  return raw;
}

function parseFirstYear(value) {
  const match = String(value || '').match(/-?\d{1,4}/);
  if (!match) return null;
  const year = parseInt(match[0], 10);
  return Number.isFinite(year) ? year : null;
}

function collectPersonYears(person) {
  if (!person) return [];
  const years = [];
  [
    person.bYear,
    person.bDate,
    person.dYear,
    person.dDate,
    person.age
  ].forEach(value => {
    const year = parseFirstYear(value);
    if (year !== null) years.push(year);
  });
  (Array.isArray(person.events) ? person.events : []).forEach(event => {
    if (!event) return;
    [
      event.year
    ].forEach(value => {
      const year = parseFirstYear(value);
      if (year !== null) years.push(year);
    });
  });
  return years;
}

function prefersHistoricalCommandery(...people) {
  const years = [];
  people.forEach(person => {
    years.push(...collectPersonYears(person));
  });
  if (!years.length) return false;
  return Math.min(...years) < 907;
}

function prefersSongJurisdiction(...people) {
  const years = [];
  people.forEach(person => {
    years.push(...collectPersonYears(person));
  });
  if (!years.length) return false;
  return Math.min(...years) <= SONG_JURISDICTION_END_YEAR
    && Math.max(...years) >= SONG_JURISDICTION_START_YEAR;
}

function hasModernHometownMarker(rest) {
  return /^(省|市|行省|布政使司|自治区|自治區|特别行政区|特別行政區)/.test(rest)
    || /[省市区區]$/.test(rest);
}

function getHistoricalCommanderyPrefix(raw, options = {}) {
  const allowLongRest = !!options.allowLongRest;
  for (let prefix of PRE_TANG_HOMETOWN_PREFIXES) {
    if (!raw.startsWith(prefix)) continue;
    const rest = raw.slice(prefix.length);
    if (!rest || /^(郡|国|國)/.test(rest)) return prefix;
    if (hasModernHometownMarker(rest)) continue;
    if (allowLongRest) return prefix;
    if (/^[\u4e00-\u9fff]{1,4}(县|縣)?$/.test(rest)) return prefix;
  }
  return '';
}

function getSongJurisdictionRest(raw) {
  const cleanRest = (rest) => String(rest || '').replace(/^(府|军|軍)/, '');
  const isUsefulRest = (rest) => /^[\u4e00-\u9fff]{1,6}(县|縣)?$/.test(rest);
  if (raw.length > 2 && raw[1] === '州') {
    const rest = cleanRest(raw.slice(2));
    if (isUsefulRest(rest)) return rest;
  }

  for (let prefix of ['应天府', '應天府', '应天', '應天']) {
    if (!raw.startsWith(prefix)) continue;
    const rest = cleanRest(raw.slice(prefix.length));
    if (isUsefulRest(rest)) return rest;
  }

  const militaryMatch = raw.match(/^[\u4e00-\u9fff]{2,4}[军軍]([\u4e00-\u9fff]{1,6}(县|縣)?)$/);
  return militaryMatch && isUsefulRest(militaryMatch[1]) ? militaryMatch[1] : '';
}

// Compute display name: surname+firstname / surname氏 / 无名
// Special case: if name == surname (no firstname stored), show surname氏 not bare surname
function getDisplayName(p) {
  if (!p) return '无名';
  const s = (p.surname || '').trim();
  const f = (p.firstname || '').trim();
  if (p.name && p.name.trim()) {
    const n = p.name.trim();
    // If name is only the surname (no firstname), display as "surname氏"
    // This covers old data where _saveNewPerson incorrectly stored just the surname
    if (s && !f && n === s) return s + '氏';
    return n;
  }
  if (s && f) return s + f;
  if (s) return s + '氏';
  return '无名';
}

function hasManualFullName(p) {
  if (!p) return false;
  const name = String(p.name || '').trim();
  if (!name) return false;
  const surname = String(p.surname || '').trim();
  const firstname = String(p.firstname || '').trim();
  const automaticName = surname && firstname
    ? `${surname}${firstname}`
    : (surname ? `${surname}氏` : '');
  return name !== automaticName && name !== surname;
}

function formatHometown(hometown, options = {}) {
  const raw = String(hometown || '').trim().replace(/\s+/g, '');
  if (!raw) return '';

  const contextPeople = [
    options.person,
    options.contextPerson,
    ...(Array.isArray(options.contextPeople) ? options.contextPeople : [])
  ].filter(Boolean);
  const hasTemporalContext = contextPeople.some(person => collectPersonYears(person).length > 0);
  const useHistoricalCommandery = !!options.useHistoricalCommandery
    || prefersHistoricalCommandery(...contextPeople);
  const useSongJurisdiction = !!options.useSongJurisdiction
    || prefersSongJurisdiction(...contextPeople);

  if (useHistoricalCommandery) {
    const commandery = getHistoricalCommanderyFromAnywhere(raw, { allowLongRest: true });
    if (commandery) return commandery;
  }

  const commanderyPrefix = !hasTemporalContext ? getHistoricalCommanderyPrefix(raw) : '';
  if (commanderyPrefix) return commanderyPrefix;

  const songJurisdictionRest = useSongJurisdiction ? getSongJurisdictionRest(raw) : '';
  if (songJurisdictionRest) return songJurisdictionRest;

  const county = stripCountySuffixRest(raw);
  if (county) return county;

  return stripLeadingModernJurisdiction(raw);
}

function normalizeRankText(rank) {
  let text = String(rank || '').trim();
  if ((text.startsWith('(') && text.endsWith(')')) || (text.startsWith('\uff08') && text.endsWith('\uff09'))) {
    text = text.slice(1, -1).trim();
  }
  return text;
}

function addRankToName(name, p) {
  const rank = normalizeRankText(p && p.rank);
  return rank ? `${name} (${rank})` : name;
}

function getTreeDisplayName(p, showHometown, visibleFatherHometown, options = {}) {
  return getTreeDisplayParts(p, showHometown, visibleFatherHometown, options).fullName;
}

function getTreeDisplayParts(p, showHometown, visibleFatherHometown, options = {}) {
  const rawName = getDisplayName(p);
  const rank = normalizeRankText(p && p.rank);
  if (!showHometown || hasManualFullName(p)) {
    const fullName = rank ? `${rawName} (${rank})` : rawName;
    return { name: rawName, nameText: rawName, hometownPrefix: '', nameSeparator: '', rank, fullName };
  }
  const hometownOptions = {
    person: p,
    contextPerson: options.contextPerson,
    contextPeople: options.contextPeople
  };
  const hometown = formatHometown(p && p.hometown, hometownOptions);
  const fatherHometown = formatHometown(visibleFatherHometown, hometownOptions);
  const hometownPrefix = hometown && hometown !== fatherHometown ? `〔${hometown}〕` : '';
  const nameSeparator = '';
  const name = hometownPrefix ? `${hometownPrefix}${nameSeparator}${rawName}` : rawName;
  const fullName = rank ? `${name} (${rank})` : name;
  return { name, nameText: rawName, hometownPrefix, nameSeparator, rank, fullName };
}

function extractProgenitorId(id) {
  if (!id || typeof id !== 'string') return '';
  if (id.length > 12) {
    const prefix = id.slice(0, 12);
    const suffix = id.slice(12);
    if (prefix.endsWith('-') && /^[A-Z]+$/.test(suffix)) return prefix;
  }
  return id;
}

function getFatherId(id) {
  const rootId = extractProgenitorId(id);
  if (!rootId || id === rootId || !id.startsWith(rootId)) return '';
  const suffix = id.slice(rootId.length);
  if (!suffix) return '';
  return rootId + suffix.slice(0, -1);
}

function parseYearValue(value) {
  const year = parseInt(String(value || '').trim(), 10);
  return Number.isFinite(year) ? year : null;
}

function parseBirthYear(person) {
  const bYear = parseYearValue(person && person.bYear);
  if (bYear !== null) return bYear;
  const match = String(person && person.bDate || '').match(/-?\d{3,4}/);
  if (!match) return null;
  const year = parseInt(match[0], 10);
  return Number.isFinite(year) ? year : null;
}

function parseYearRangeText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const match = raw.match(/^(-?\d{1,4})(?:\s*(?:-|~|\u2013|\u2014|\u81f3|\u5230)\s*(-?\d{1,4}))?$/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : start;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return {
    startYear: Math.min(start, end),
    endYear: Math.max(start, end)
  };
}

function parseYearRangeListText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const parts = raw.split(/[,\uFF0C\u3001;\uFF1B]+/).map(part => part.trim()).filter(Boolean);
  if (!parts.length) return null;
  const ranges = [];
  for (let i = 0; i < parts.length; i++) {
    const range = parseYearRangeText(parts[i]);
    if (!range) return null;
    ranges.push(range);
  }
  return ranges;
}

function parseEventYearRanges(event) {
  if (!event || typeof event !== 'object') return null;
  const inlineRanges = parseYearRangeListText(event.year || '');
  return inlineRanges && inlineRanges.length ? inlineRanges : null;
}

function parsePersonalEventYearRange(event) {
  const ranges = parseEventYearRanges(event);
  return ranges && ranges.length ? ranges[0] : null;
}

function normalizeLivingValue(value) {
  return value === true || value === 'true' || value === '1' || value === 'living';
}

function hasExplicitLivingValue(person) {
  const value = person && person.isLiving;
  return value !== undefined && value !== null && value !== '';
}

function hasDeathDetails(person) {
  const p = person || {};
  return !!(
    String(p.dYear || '').trim()
    || String(p.dDate || '').trim()
    || String(p.dPlace || '').trim()
    || String(p.age || '').trim()
  );
}

function isLivingPerson(person) {
  if (hasExplicitLivingValue(person)) {
    return normalizeLivingValue(person && person.isLiving);
  }
  const birthYear = parseYearValue(person && person.bYear);
  return !hasDeathDetails(person)
    && birthYear !== null
    && birthYear >= 1930
    && birthYear <= CURRENT_YEAR;
}

function getVisiblePersonalEvents(person) {
  return (Array.isArray(person && person.events) ? person.events : [])
    .reduce((list, event, index) => {
      if (!event || typeof event !== 'object') return list;
      if (event.hidden === true || event.hidden === 'true' || event.checked === false) return list;
      const name = String(event.name || event.title || event.label || '').trim();
      const ranges = parseEventYearRanges(event);
      if (!name || !ranges || !ranges.length) return list;
      const baseId = event.id || `personal-event-${index}`;
      ranges.forEach((years, rangeIndex) => {
        list.push({
          id: ranges.length > 1 ? `${baseId}-${rangeIndex}` : baseId,
          name,
          year: years.startYear,
          startYear: years.startYear,
          endYear: years.endYear
        });
      });
      return list;
    }, [])
    .sort((a, b) => (
      a.startYear - b.startYear
      || a.endYear - b.endYear
      || String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN')
    ));
}

function getBYear(db, id) {
  const year = db.people[id] && db.people[id]._estBYear;
  // Layout-only fallback for unanchored components; never feeds back into estimation.
  return Number.isFinite(year) ? year : 1900;
}

function runEstimation(db, rootId) {
  if (!db || !db.people) return;
  const people = db.people;
  const childrenByFather = {};
  const parentOf = {};

  Object.entries(people).forEach(([id, person]) => {
    const realYear = parseBirthYear(person);
    person._estBYear = realYear;
  });

  Object.entries(people).forEach(([id, person]) => {
    const kids = person && person.gender === 'male' && Array.isArray(person.children)
      ? person.children.filter(cid => people[cid])
      : [];
    childrenByFather[id] = kids;
    kids.forEach((cid, index) => {
      if (!parentOf[cid]) parentOf[cid] = { id, index };
    });
  });

  const fatherChildGap = (fatherId, childId) => {
    const kids = childrenByFather[fatherId] || [];
    const index = Math.max(0, kids.indexOf(childId));
    return FIRST_CHILD_GENERATION_GAP + index * SIBLING_GAP;
  };

  const hasEstimate = (id) => Number.isFinite(people[id] && people[id]._estBYear);
  const getEstimate = (id) => hasEstimate(id) ? people[id]._estBYear : null;

  const setBlankEstimate = (id, year) => {
    if (!people[id] || hasEstimate(id) || !Number.isFinite(year)) return false;
    people[id]._estBYear = Math.round(year);
    return true;
  };

  const addProposal = (bucket, id, year) => {
    if (!people[id] || hasEstimate(id) || !Number.isFinite(year)) return;
    if (!bucket.has(id)) bucket.set(id, []);
    bucket.get(id).push(year);
  };

  const applyProposals = (bucket) => {
    let changed = false;
    bucket.forEach((items, id) => {
      if (!people[id] || !items.length) return;
      const year = items.reduce((sum, item) => sum + item, 0) / items.length;
      if (setBlankEstimate(id, year)) changed = true;
    });
    return changed;
  };

  const applySiblingPass = () => {
    const siblingProposals = new Map();
    Object.values(childrenByFather).forEach(kids => {
      const anchors = kids
        .map((id, index) => ({ id, index, year: getEstimate(id) }))
        .filter(item => item.year !== null);
      if (!anchors.length) return;

      for (let i = 0; i < anchors.length - 1; i++) {
        const left = anchors[i];
        const right = anchors[i + 1];
        const span = right.index - left.index;
        if (span <= 1) continue;
        for (let index = left.index + 1; index < right.index; index++) {
          addProposal(
            siblingProposals,
            kids[index],
            left.year + (right.year - left.year) * (index - left.index) / span
          );
        }
      }

      const firstAnchor = anchors[0];
      const lastAnchor = anchors[anchors.length - 1];
      for (let index = 0; index < firstAnchor.index; index++) {
        addProposal(siblingProposals, kids[index], firstAnchor.year - (firstAnchor.index - index) * SIBLING_GAP);
      }
      for (let index = lastAnchor.index + 1; index < kids.length; index++) {
        addProposal(siblingProposals, kids[index], lastAnchor.year + (index - lastAnchor.index) * SIBLING_GAP);
      }
    });
    return applyProposals(siblingProposals);
  };

  const applySpousePass = () => {
    const spouseProposals = new Map();
    Object.entries(people).forEach(([id, person]) => {
      const personYear = getEstimate(id);
      (person.spouses || []).forEach(sid => {
        if (!people[sid]) return;
        const spouseYear = getEstimate(sid);
        if (personYear !== null) addProposal(spouseProposals, sid, personYear);
        if (spouseYear !== null) addProposal(spouseProposals, id, spouseYear);
      });
    });
    return applyProposals(spouseProposals);
  };

  const getFatherRelation = (childId) => {
    if (parentOf[childId]) return parentOf[childId];
    const fatherId = getFatherId(childId);
    return fatherId && people[fatherId] ? { id: fatherId, index: 0 } : null;
  };

  const applyGenerationPass = () => {
    const interpolationProposals = new Map();
    const extrapolationProposals = new Map();

    Object.keys(people).filter(hasEstimate).forEach(descendantId => {
      const descendantYear = getEstimate(descendantId);
      const path = [];
      const seen = new Set([descendantId]);
      let currentId = descendantId;
      let foundAssignedAncestor = false;

      while (true) {
        const relation = getFatherRelation(currentId);
        if (!relation || !people[relation.id] || seen.has(relation.id)) break;
        path.push({ fatherId: relation.id, childId: currentId });
        const ancestorYear = getEstimate(relation.id);
        if (ancestorYear !== null) {
          foundAssignedAncestor = true;
          if (path.length > 1) {
            const edgeCount = path.length;
            path.slice().reverse().forEach((edge, index) => {
              addProposal(
                interpolationProposals,
                edge.childId,
                ancestorYear + (descendantYear - ancestorYear) * (index + 1) / edgeCount
              );
            });
          }
          break;
        }
        seen.add(relation.id);
        currentId = relation.id;
      }

      if (!foundAssignedAncestor) {
        let childYear = descendantYear;
        path.forEach(edge => {
          const year = childYear - fatherChildGap(edge.fatherId, edge.childId);
          addProposal(extrapolationProposals, edge.fatherId, year);
          childYear = year;
        });
      }
    });

    Object.entries(childrenByFather).forEach(([fatherId, kids]) => {
      const fatherYear = getEstimate(fatherId);
      if (fatherYear === null) return;
      kids.forEach(childId => {
        addProposal(extrapolationProposals, childId, fatherYear + fatherChildGap(fatherId, childId));
      });
    });

    const changedByInterpolation = applyProposals(interpolationProposals);
    const changedByExtrapolation = applyProposals(extrapolationProposals);
    return changedByInterpolation || changedByExtrapolation;
  };

  const maxPasses = Math.max(1, Object.keys(people).length * 2);
  for (let pass = 0; pass < maxPasses; pass++) {
    let changedThisPass = false;
    let changedSiblingOrSpouse = false;
    do {
      changedSiblingOrSpouse = false;
      if (applySiblingPass()) changedSiblingOrSpouse = true;
      if (applySpousePass()) changedSiblingOrSpouse = true;
      if (changedSiblingOrSpouse) changedThisPass = true;
    } while (changedSiblingOrSpouse);

    if (applyGenerationPass()) changedThisPass = true;
    if (!changedThisPass) break;
  }
}

function estimateTimelineEventLabelWidth(label) {
  const chars = Array.from(String(label || ''));
  const textW = chars.reduce((sum, ch) => (
    sum + (/^[\x00-\x7F]$/.test(ch) ? EVENT_LABEL_ASCII_W : EVENT_LABEL_CJK_W)
  ), 0);
  return Math.max(EVENT_LABEL_MIN_W, textW + EVENT_LABEL_PAD_X * 2);
}

function getTimelineEventLabelGap(labelW) {
  return labelW <= 60 ? EVENT_LABEL_SHORT_GAP : EVENT_LABEL_GAP;
}

function getTimelineEventLabelColor(event) {
  if (event && event.isCurrentYear) return EVENT_LABEL_CURRENT_COLOR;
  if (event && event.tone === 'imperial') return EVENT_LABEL_IMPERIAL_COLOR;
  if (event && event.tone === 'crown-prince') return EVENT_LABEL_CROWN_PRINCE_COLOR;
  if (event && event.tone === 'empress') return EVENT_LABEL_EMPRESS_COLOR;
  if (event && event.tone === 'noble-consort') return EVENT_LABEL_NOBLE_CONSORT_COLOR;
  const tone = Number(event && event.tone);
  const index = Number.isFinite(tone) ? Math.abs(tone) % EVENT_LABEL_COLORS.length : 0;
  return EVENT_LABEL_COLORS[index];
}

function fitTimelineEventLabelCenters(items) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.centerX - b.centerX || a.index - b.index);
  const cumulativeSeparation = [0];
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    const gap = Math.max(previous.labelGap || EVENT_LABEL_GAP, current.labelGap || EVENT_LABEL_GAP);
    cumulativeSeparation[i] = cumulativeSeparation[i - 1] + previous.labelW / 2 + current.labelW / 2 + gap;
  }

  const blocks = [];
  sorted.forEach((item, index) => {
    const adjustedDesired = item.desiredCenter - cumulativeSeparation[index];
    blocks.push({
      start: index,
      end: index,
      weight: 1,
      value: adjustedDesired
    });
    while (blocks.length > 1) {
      const right = blocks[blocks.length - 1];
      const left = blocks[blocks.length - 2];
      if (left.value <= right.value) break;
      const weight = left.weight + right.weight;
      blocks.splice(blocks.length - 2, 2, {
        start: left.start,
        end: right.end,
        weight,
        value: (left.value * left.weight + right.value * right.weight) / weight
      });
    }
  });

  const fittedAdjusted = Array(sorted.length).fill(0);
  blocks.forEach(block => {
    for (let i = block.start; i <= block.end; i++) fittedAdjusted[i] = block.value;
  });

  return sorted.map((item, index) => ({
    ...item,
    fittedCenter: fittedAdjusted[index] + cumulativeSeparation[index]
  }));
}

function getTimelineEventLabelCell(centerX, allCenters) {
  let lower = -Infinity;
  let upper = Infinity;
  allCenters.forEach(otherCenter => {
    if (otherCenter < centerX) lower = Math.max(lower, (otherCenter + centerX) / 2);
    if (otherCenter > centerX) upper = Math.min(upper, (otherCenter + centerX) / 2);
  });
  return { lower, upper };
}

function fittedLabelLaneCandidate(items, allCenters) {
  const fitted = fitTimelineEventLabelCenters(items);
  let totalDrift = 0;
  let violation = 0;
  fitted.forEach(item => {
    const drift = Math.abs(item.fittedCenter - item.centerX);
    totalDrift += drift;
    if (item.event && item.event.isCurrentYear) return;
    const cell = getTimelineEventLabelCell(item.centerX, allCenters);
    if (item.fittedCenter < cell.lower) violation += cell.lower - item.fittedCenter;
    if (item.fittedCenter > cell.upper) violation += item.fittedCenter - cell.upper;
  });
  return { fitted, totalDrift, violation };
}

function assignTimelineEventLabelLanes(events, startYear) {
  const allCenters = events.map(event => {
    const rect = getTimelineRangeRect(event.startYear, event.endYear, startYear);
    return rect.x + rect.w / 2;
  });
  const laneItems = Array.from({ length: EVENT_LABEL_LANES }, () => []);
  const makeLaneItem = (event, index, lane) => {
    const rect = getTimelineRangeRect(event.startYear, event.endYear, startYear);
    const centerX = rect.x + rect.w / 2;
    const labelW = estimateTimelineEventLabelWidth(event.label);
    const labelGap = getTimelineEventLabelGap(labelW);
    const desiredCenter = event.isCurrentYear
      ? rect.x + rect.w + CURRENT_YEAR_LABEL_GAP + labelW / 2
      : centerX + (lane > 0 ? EVENT_LABEL_NUDGE_X : 0);
    return { event, index, lane, rect, centerX, desiredCenter, labelW, labelGap };
  };

  events.forEach((event, index) => {
    const candidates = laneItems.map((items, lane) => {
      const candidate = fittedLabelLaneCandidate([...items, makeLaneItem(event, index, lane)], allCenters);
      return { ...candidate, lane };
    }).sort((a, b) => (
      a.violation - b.violation
      || a.totalDrift - b.totalDrift
      || a.lane - b.lane
    ));
    const chosen = candidates[0];
    laneItems[chosen.lane] = chosen.fitted.map(({ fittedCenter, ...item }) => item);
  });

  const placedEvents = [...events];
  laneItems.forEach(items => {
    fittedLabelLaneCandidate(items, allCenters).fitted.forEach(item => {
      placedEvents[item.index] = {
        ...item.event,
        labelLane: item.lane,
        labelOffsetX: Math.round(item.fittedCenter - item.centerX),
        labelColor: getTimelineEventLabelColor(item.event)
      };
    });
  });
  return placedEvents.map(event => ({
      ...event,
      labelLane: event.labelLane || 0,
      labelOffsetX: event.labelOffsetX || 0,
      labelColor: getTimelineEventLabelColor(event)
    }));
}

function calculateLayout(db, config) {
  const { rootId, showTimeline, showSpouses, showMaternal, collapsedNodes } = config;
  const duplicateExpandedKeys = new Set(config.duplicateExpandedKeys || []);
  const hiddenRelationKeys = new Set(Array.isArray(config.hiddenRelationKeys) ? config.hiddenRelationKeys : []);
  // Global hiddenTreeIds are legacy state from the pre-instance visibility model.
  // Relation visibility is now keyed per rendered parent instance, so stale global ids
  // must not suppress whole branches in one view while profile cards still look visible.
  const isHiddenInTree = () => false;
  const getRelationKey = (parentKey, relationId) => `${parentKey || ''}>${relationId || ''}`;
  const isRelationHidden = (parentKey, relationId) => hiddenRelationKeys.has(getRelationKey(parentKey, relationId));
  const timelineEvents = Array.isArray(config.timelineEvents) ? config.timelineEvents : [];
  const nodes = [], lines = [], rulerTicks = [], timelineEventBands = [];
  let maxR = 0, minY = 2026, maxD = 1, maxRow = 0;

  if (!db || !db.people || !rootId || !db.people[rootId]) {
    return { nodes: [], lines: [], rulerTicks: [], timelineEventBands: [], maxR: 750, maxH: 1000, timelineYearWidth: PX_PER_YEAR };
  }

  runEstimation(db, rootId);
  const rowH = showTimeline ? TIMELINE_ROW_H : STANDARD_ROW_H;
  const rowStep = showTimeline ? TIMELINE_ROW_STEP : STANDARD_ROW_STEP;
  const personalEventsByPerson = {};
  const personalEventNameStats = {};
  const hasWorkspaceIds = Object.values(db.people).some(person => person && person.workspaceId);
  const rootWorkspaceId = (db.people[rootId] && db.people[rootId].workspaceId) || extractProgenitorId(rootId) || rootId;
  const isCurrentWorkspacePerson = (id, person) => {
    const workspaceId = (person && person.workspaceId) || extractProgenitorId(id) || id;
    return !hasWorkspaceIds || !rootWorkspaceId || workspaceId === rootWorkspaceId;
  };
  const shouldShowCurrentYear = !!(showTimeline
    && Object.entries(db.people).some(([id, person]) => isCurrentWorkspacePerson(id, person) && isLivingPerson(person)));
  if (showTimeline) {
    Object.entries(db.people).forEach(([id, person]) => {
      if (!isCurrentWorkspacePerson(id, person)) return;
      const events = getVisiblePersonalEvents(person);
      if (!events.length) return;
      personalEventsByPerson[id] = events;
      events.forEach(event => {
        if (!personalEventNameStats[event.name]) {
          personalEventNameStats[event.name] = { name: event.name, startYear: Number.MAX_SAFE_INTEGER, endYear: Number.MAX_SAFE_INTEGER };
        }
        if (
          event.startYear < personalEventNameStats[event.name].startYear
          || (event.startYear === personalEventNameStats[event.name].startYear && event.endYear < personalEventNameStats[event.name].endYear)
        ) {
          personalEventNameStats[event.name].startYear = event.startYear;
          personalEventNameStats[event.name].endYear = event.endYear;
        }
      });
    });
  }
  const personalEventToneByName = {};
  const sortedPersonalEventStats = Object.values(personalEventNameStats)
    .sort((a, b) => (
      a.startYear - b.startYear
      || a.endYear - b.endYear
      || String(a.name).localeCompare(String(b.name), 'zh-Hans-CN')
    ));
  const pickPersonalEventTone = EventColors.makeEventTonePicker(
    sortedPersonalEventStats.map(item => item.name),
    EVENT_LABEL_COLORS.length
  );
  sortedPersonalEventStats
    .forEach(item => {
      personalEventToneByName[item.name] = pickPersonalEventTone(item.name);
    });
  const visibleTimelineEvents = showTimeline
    ? timelineEvents.filter(event => event && !event.hidden && event.checked !== false)
    : [];
  const parsedTimelineEvents = showTimeline
    ? visibleTimelineEvents.reduce((list, event, index) => {
      const ranges = parseEventYearRanges(event);
      const label = event.name || event.title || '';
      if (!ranges || !ranges.length || !label) return list;
      const baseId = event.id || `event-${index}`;
      const tone = EventColors.resolveEventTone({ ...event, name: label }, EVENT_LABEL_COLORS.length);
      ranges.forEach((years, rangeIndex) => {
        list.push({
          id: ranges.length > 1 ? `${baseId}-${rangeIndex}` : baseId,
          label,
          startYear: years.startYear,
          endYear: years.endYear,
          tone
        });
      });
      return list;
    }, [])
    : [];
  if (shouldShowCurrentYear) {
    parsedTimelineEvents.push({
      id: 'current-year',
      label: String(CURRENT_YEAR),
      startYear: CURRENT_YEAR,
      endYear: CURRENT_YEAR,
      tone: 'current',
      isCurrentYear: true
    });
    parsedTimelineEvents.sort((a, b) => (
      a.startYear - b.startYear
      || a.endYear - b.endYear
      || String(a.label || '').localeCompare(String(b.label || ''), 'zh-Hans-CN')
    ));
  }
  Object.entries(db.people).forEach(([id, p]) => {
    if (isCurrentWorkspacePerson(id, p) && p._estBYear) minY = Math.min(minY, p._estBYear);
  });
  let maxEventYear = shouldShowCurrentYear ? CURRENT_YEAR : -Infinity;
  parsedTimelineEvents.forEach(event => {
    minY = Math.min(minY, event.startYear);
    maxEventYear = Math.max(maxEventYear, event.endYear);
  });
  Object.values(personalEventsByPerson).forEach(events => {
    events.forEach(event => {
      minY = Math.min(minY, event.startYear);
      maxEventYear = Math.max(maxEventYear, event.endYear);
    });
  });
  const startYear = Math.floor((minY - TIMELINE_LEAD_YEARS) / 20) * 20;
  const timelineEventsWithLabelLanes = showTimeline
    ? assignTimelineEventLabelLanes(parsedTimelineEvents, startYear)
    : [];
  const hasTimelineEventStartingAt = (year, exceptId = '') => timelineEventsWithLabelLanes.some(event => (
    event
    && event.id !== exceptId
    && event.startYear === year
  ));
  const shouldHideTimelineEventRightEdge = (event) => !!(
    event
    && event.startYear !== event.endYear
    && hasTimelineEventStartingAt(event.endYear, event.id)
  );
  const timelineEventEdgeRanges = showTimeline
    ? timelineEventsWithLabelLanes.reduce((ranges, event) => {
      const rect = getTimelineRangeRect(event.startYear, event.endYear, startYear);
      ranges.push({ left: rect.x, right: rect.x + TIMELINE_YEAR_EDGE_W });
      const rightEdgeLeft = rect.x + rect.w - TIMELINE_YEAR_EDGE_W;
      if (rightEdgeLeft !== rect.x && !shouldHideTimelineEventRightEdge(event)) {
        ranges.push({ left: rightEdgeLeft, right: rightEdgeLeft + TIMELINE_YEAR_EDGE_W });
      }
      return ranges;
    }, [])
    : [];

  const hasKnownTimelineDate = (p) => !!(
    String(p && p.bYear || '').trim()
    || String(p && p.dYear || '').trim()
    || String(p && p.bDate || '').trim()
    || String(p && p.dDate || '').trim()
  );

  const getKnownAge = (p) => {
    const age = parseYearValue(p && p.age);
    return age !== null && age > 0 ? age : null;
  };

  const hasEstimatedBirthOnlyWithAge = (p) => !hasKnownTimelineDate(p) && getKnownAge(p) !== null;

  // Timeline lifespan behavior:
  // - Explicitly living people extend to current year with no fade.
  // - Profiles with no known dates but a known age use an exact age-long box
  //   from the estimated birth year, with no faded tail.
  // - Missing death year without living status still uses the inferred/faded tail.
  const getTimelineBoxEndYear = (p, rawBirthYear) => {
    if (isLivingPerson(p)) return CURRENT_YEAR;
    const deathYear = parseYearValue(p && p.dYear);
    if (deathYear !== null) return Math.min(deathYear, CURRENT_YEAR);
    const knownAge = getKnownAge(p);
    if (hasEstimatedBirthOnlyWithAge(p) && knownAge !== null) return rawBirthYear + knownAge;
    return Math.min(rawBirthYear + 80, CURRENT_YEAR);
  };


  function endsAtCurrentYearDeath(p) {
    return !isLivingPerson(p) && parseYearValue(p && p.dYear) === CURRENT_YEAR;
  }

  const getFadeStartPercent = (p, bYear) => {
    if (!showTimeline || isLivingPerson(p) || (p && p.dYear) || hasEstimatedBirthOnlyWithAge(p)) return null;
    // No fade if person would be younger than 70
    if (bYear + 70 > CURRENT_YEAR) return null;
    const boxEnd = getTimelineBoxEndYear(p, bYear);
    const boxStart = bYear;
    if (boxEnd <= boxStart) return null;
    // Fade starts at bYear+70 (age 70), not at boxEnd-10
    const fadeStartYear = bYear + 70;
    // Calculate fade start as percentage of total box width
    return ((fadeStartYear - boxStart) / (boxEnd - boxStart)) * 100;
  };

  const getMask = (p, bYear) => {
    const fadeStartPercent = getFadeStartPercent(p, bYear);
    if (fadeStartPercent === null) return "";
    const gradient = `linear-gradient(to right, black ${fadeStartPercent}%, transparent 100%)`;
    // Apply gradient: fade from fadeStartYear to boxEnd
    return `-webkit-mask-image: ${gradient}; mask-image: ${gradient};`;
  };

  const getLifeText = (p) => formatLifeRange(p && p.bYear, p && p.dYear, {
    birthFallback: '?',
    deathFallback: ''
  });

  const getCompactNodeWidth = (p, displayName) => {
    const nameWidth = (displayName || getDisplayName(p)).length * 30;
    const lifeWidth = getLifeText(p) ? 120 : 0;
    return Math.max(240, nameWidth + lifeWidth + 96);
  };
  const estimateTimelineTextWidth = (text, cjkWidth, asciiWidth) => (
    Array.from(String(text || '')).reduce((sum, char) => (
      sum + (/[\x00-\x7F]/.test(char) ? asciiWidth : cjkWidth)
    ), 0)
  );
  const getTimelineLabelOccupancyWidth = (displayParts, person) => {
    const parts = displayParts || {};
    const labelText = `${parts.hometownPrefix || ''}${parts.nameSeparator || ''}${parts.nameText || parts.name || getDisplayName(person)}`;
    const rankText = parts.rank ? ` (${parts.rank})` : '';
    const lifeText = getLifeText(person);
    return 54
      + estimateTimelineTextWidth(labelText, 28, 14)
      + estimateTimelineTextWidth(rankText, 18, 9)
      + (lifeText ? 14 + estimateTimelineTextWidth(lifeText, 20, 10) : 0)
      + 18;
  };
  const getTimelineOccupancyWidth = (id, person, displayParts) => {
    if (!showTimeline) return STANDARD_NODE_MIN_W;
    const parts = displayParts || getTreeDisplayParts(person, true, '');
    return Math.max(getTimelineNodeWidth(id, person), getTimelineLabelOccupancyWidth(parts, person));
  };

  const currentYearLineX = shouldShowCurrentYear ? getTimelineYearMarkLeftX(CURRENT_YEAR, startYear) : -1;
  const getTimelineYear = (id) => Math.min(getBYear(db, id), CURRENT_YEAR);
  const getTimelineX = (id) => (getTimelineYear(id) - startYear) * PX_PER_YEAR;
  const avoidTimelineEventEdges = (x) => {
    if (!showTimeline || timelineEventEdgeRanges.length === 0) return x;
    const halfConnectorW = TIMELINE_YEAR_EDGE_W / 2;
    const minClearance = TIMELINE_CONNECTOR_EVENT_CLEARANCE;
    const maxNudge = PX_PER_YEAR / 2;
    const candidateXs = [x];
    timelineEventEdgeRanges.forEach(edge => {
      candidateXs.push(edge.left - minClearance - halfConnectorW);
      candidateXs.push(edge.right + minClearance + halfConnectorW);
    });
    const clearanceFor = (candidateX, edge) => {
      const left = candidateX - halfConnectorW;
      const right = candidateX + halfConnectorW;
      if (right <= edge.left) return edge.left - right;
      if (left >= edge.right) return left - edge.right;
      return -Math.min(right - edge.left, edge.right - left);
    };
    return candidateXs
      .filter(candidateX => Math.abs(candidateX - x) <= maxNudge)
      .map(candidateX => ({
        x: candidateX,
        clearance: Math.min(...timelineEventEdgeRanges.map(edge => clearanceFor(candidateX, edge))),
        nudge: Math.abs(candidateX - x)
      }))
      .sort((a, b) => (b.clearance - a.clearance) || (a.nudge - b.nudge))[0].x;
  };
  const getChildTrunkX = (childIds, fallbackX) => {
    if (!showTimeline) return fallbackX;
    const firstChildYear = Math.min(...childIds.map(c => getTimelineYear(c)));
    // Year/event marks are centered within each year cell, so center the 4.5-year lead too.
    return avoidTimelineEventEdges(
      (firstChildYear - TIMELINE_CHILD_TRUNK_LEAD_YEARS - startYear) * PX_PER_YEAR + PX_PER_YEAR / 2
    );
  };
  const getChildBranchTargetX = (childX) => showTimeline
    ? childX + TIMELINE_YEAR_EDGE_INSET + NODE_BORDER_W / 2
    : childX + TRUNK_OFFSET;
  const getTimelineNodeWidth = (id, p) => {
    const birthYear = getTimelineYear(id);
    const rawBirthYear = getBYear(db, id);
    const boxEndYear = getTimelineBoxEndYear(p, rawBirthYear);
    const livingYearEdgeOverlap = isLivingPerson(p) ? TIMELINE_YEAR_EDGE_W : 0;
    const currentYearDeathOffset = !isLivingPerson(p) && parseYearValue(p && p.dYear) === CURRENT_YEAR ? -TIMELINE_YEAR_EDGE_W : 0;
    return Math.max(0, (boxEndYear - birthYear) * PX_PER_YEAR + livingYearEdgeOverlap + currentYearDeathOffset);
  };
  const timelineRowOccupancy = new Map();
  const TIMELINE_ROW_NODE_GAP = 36;
  const getTimelineNodeRange = (x, w) => ({
    left: x - TIMELINE_ROW_NODE_GAP,
    right: x + Math.max(w || 0, TIMELINE_YEAR_EDGE_W) + TIMELINE_ROW_NODE_GAP
  });
  const rangeOverlaps = (a, b) => a.left < b.right && b.left < a.right;
  const reserveTimelineRowRange = (rowIdx, x, w) => {
    if (!showTimeline) return;
    const range = getTimelineNodeRange(x, w);
    const row = Math.max(0, Math.round(rowIdx));
    const ranges = timelineRowOccupancy.get(row) || [];
    ranges.push(range);
    timelineRowOccupancy.set(row, ranges);
  };
  const findTimelineRowForRange = (minRow, x, w) => {
    if (!showTimeline) return minRow;
    const range = getTimelineNodeRange(x, w);
    let row = Math.max(0, Math.round(minRow));
    while ((timelineRowOccupancy.get(row) || []).some(occupied => rangeOverlaps(range, occupied))) {
      row += 1;
    }
    return row;
  };
  const compactTimelineBranchesBottomUp = () => {
    if (!showTimeline || nodes.length < 2) return;
    const nodeRows = nodes.map(node => Math.round((node.y || 0) / rowStep));
    const nodeRanges = nodes.map(node => getTimelineNodeRange(node.x || 0, node.timelineOccupancyW || node.w || 0));
    const sortedIndexes = nodes
      .map((node, index) => ({ node, index, row: nodeRows[index] }))
      .sort((a, b) => a.row - b.row || (a.node.x || 0) - (b.node.x || 0));
    const blocks = [];

    sortedIndexes.forEach((item, order) => {
      const root = item.node;
      if (root.isSpouse) return;
      const rootX = root.x || 0;
      const indexes = [item.index];
      for (let next = order + 1; next < sortedIndexes.length; next += 1) {
        const candidate = sortedIndexes[next].node;
        if (!candidate.isSpouse && (candidate.x || 0) <= rootX) break;
        indexes.push(sortedIndexes[next].index);
      }
      const parent = [...sortedIndexes]
        .slice(0, order)
        .reverse()
        .find(candidate => !candidate.node.isSpouse && (candidate.node.x || 0) < rootX);
      blocks.push({
        rootIndex: item.index,
        indexes,
        parentIndex: parent ? parent.index : -1,
        maxX: Math.max(...indexes.map(index => nodes[index].x || 0)),
        startRow: nodeRows[item.index]
      });
    });

    const blockContains = new Set();
    const canShift = (block, delta) => {
      const parentRow = block.parentIndex >= 0 ? nodeRows[block.parentIndex] : -1;
      for (const index of block.indexes) {
        const targetRow = nodeRows[index] + delta;
        if (targetRow <= parentRow || targetRow < 0) return false;
      }
      blockContains.clear();
      block.indexes.forEach(index => blockContains.add(index));
      for (const index of block.indexes) {
        const targetRow = nodeRows[index] + delta;
        const range = nodeRanges[index];
        for (let other = 0; other < nodes.length; other += 1) {
          if (blockContains.has(other)) continue;
          if (nodeRows[other] !== targetRow) continue;
          if (rangeOverlaps(range, nodeRanges[other])) return false;
        }
      }
      return true;
    };

    const lockedIndexes = new Set();
    blocks
      .sort((a, b) => b.maxX - a.maxX || b.startRow - a.startRow || b.indexes.length - a.indexes.length)
      .forEach(block => {
        if (block.indexes.some(index => lockedIndexes.has(index))) return;
        let delta = 0;
        while (canShift(block, delta - 1)) delta -= 1;
        if (delta === 0) return;
        block.indexes.forEach(index => { nodeRows[index] += delta; });
        block.indexes.forEach(index => lockedIndexes.add(index));
      });

    const rowMap = new Map();
    nodes.forEach((node, index) => {
      const oldRow = Math.round((node.y || 0) / rowStep);
      const newRow = nodeRows[index];
      rowMap.set(oldRow, rowMap.has(oldRow) ? Math.min(rowMap.get(oldRow), newRow) : newRow);
      node.y = newRow * rowStep;
    });
    const remapCenterY = (centerY) => {
      const oldRow = Math.round((centerY - rowH / 2) / rowStep);
      const newRow = rowMap.has(oldRow) ? rowMap.get(oldRow) : oldRow;
      return newRow * rowStep + rowH / 2;
    };
    lines.forEach(line => {
      const oldStart = line.y || 0;
      const newStart = remapCenterY(oldStart);
      if (line.type === 'stem') {
        const newEnd = remapCenterY(oldStart + (line.h || 0));
        line.y = Math.min(newStart, newEnd);
        line.h = Math.abs(newEnd - newStart);
      } else {
        line.y = newStart;
      }
    });
  };
  const getPersonalEventMarks = (id, nodeWidth, person) => {
    if (!showTimeline) return [];
    const events = personalEventsByPerson[id] || [];
    const birthYear = getTimelineYear(id);
    const pointWidth = TIMELINE_YEAR_EDGE_W;
    const drawableStart = 0;
    const drawableEnd = Math.max(pointWidth, nodeWidth + TIMELINE_YEAR_EDGE_W);
    const markTop = NODE_BORDER_W;
    const markH = Math.max(1, rowH - NODE_BORDER_W * 2);
    const nodeHasRightEdge = !isLivingPerson(person) && getFadeStartPercent(person, birthYear) === null && nodeWidth > 0;
    const nodeRightEdgeLeft = nodeWidth;
    const startsByYear = events.reduce((bucket, event) => {
      if (event && Number.isFinite(event.startYear)) {
        bucket[String(event.startYear)] = (bucket[String(event.startYear)] || 0) + 1;
      }
      return bucket;
    }, {});
    const marks = events.map((event, index) => {
      const rawStartX = (event.startYear - birthYear) * PX_PER_YEAR;
      const isRange = event.startYear !== event.endYear;
      const rawEndX = isRange
        ? (event.endYear - birthYear) * PX_PER_YEAR + TIMELINE_YEAR_EDGE_W
        : rawStartX + pointWidth;
      if (rawEndX < drawableStart || rawStartX > drawableEnd) return null;
      const x = isRange
        ? Math.max(drawableStart, rawStartX)
        : Math.max(drawableStart, Math.min(drawableEnd - pointWidth, rawStartX));
      const endX = isRange ? Math.min(drawableEnd, rawEndX) : x + pointWidth;
      return {
        id: event.id || `${id}-personal-event-${index}`,
        name: event.name,
        year: event.startYear,
        startYear: event.startYear,
        endYear: event.endYear,
        x: Math.round(x),
        w: Math.max(pointWidth, Math.round(endX - x)),
        isRange,
        isStacked: false,
        lane: 0,
        top: markTop,
        h: markH,
        splitLeftCap: false,
        splitRightCap: false,
        splitPoint: false,
        hideRightCap: isRange && event.startYear !== event.endYear && (
          !!startsByYear[String(event.endYear)]
          || (nodeHasRightEdge && endX >= nodeRightEdgeLeft)
        ),
        tone: personalEventToneByName[event.name] !== undefined ? personalEventToneByName[event.name] : 0
      };
    }).filter(Boolean);
    const underlays = [];
    [...marks]
      .sort((a, b) => a.x - b.x || (a.x + a.w) - (b.x + b.w))
      .forEach((mark, index) => {
        const left = mark.x;
        const right = mark.x + mark.w;
        const last = underlays[underlays.length - 1];
        if (last && left <= last.x + last.w) {
          last.w = Math.max(last.w, right - last.x);
        } else {
          underlays.push({
            id: `${id}-personal-event-underlay-${index}`,
            x: left,
            w: mark.w,
            top: markTop,
            h: markH,
            isUnderlay: true
          });
        }
      });
    return underlays.concat(marks);
  };

  const isBirthMotherOf = (motherId, childId) => {
    const child = db.people[childId];
    return !!(child && motherId && String(child.motherId || '') === String(motherId));
  };

  const cousinMarriageAnchors = new Map();
  const primaryNodeCenters = new Map();
  const cousinMarriageMergeLineKeys = new Set();
  const descendantTreePersonIds = new Set();
  const collectDescendantTreePersonIds = (id) => {
    if (!id || !db.people[id] || descendantTreePersonIds.has(id)) return;
    descendantTreePersonIds.add(id);
    const person = db.people[id];
    if (person.gender === 'male') {
      (person.children || []).forEach(cid => collectDescendantTreePersonIds(cid));
    } else if (person.gender === 'female' && showMaternal) {
      (person.spouses || []).forEach(sid => {
        const spouse = db.people[sid];
        if (spouse && Array.isArray(spouse.children)) {
          spouse.children.forEach(cid => collectDescendantTreePersonIds(cid));
        }
      });
    }
  };
  collectDescendantTreePersonIds(rootId);
  const isRootDescendant = (id) => descendantTreePersonIds.has(id);
  const isCousinMarriagePair = (id, spouseId) => {
    if (!showTimeline) return false;
    const person = db.people[id];
    const spouse = db.people[spouseId];
    if (!person || !spouse) return false;
    const isRootSidePerson = (personId) => isRootDescendant(personId);
    const hasSharedChild = (fatherId, motherId) => (
      Array.isArray(db.people[fatherId] && db.people[fatherId].children)
      && db.people[fatherId].children.some(cid => String((db.people[cid] && db.people[cid].motherId) || '') === String(motherId))
    );
    if (person.gender === 'male' && spouse.gender === 'female') {
      return isRootSidePerson(id) && isRootSidePerson(spouseId) && hasSharedChild(id, spouseId);
    }
    if (person.gender === 'female' && spouse.gender === 'male') {
      return isRootSidePerson(id) && isRootSidePerson(spouseId) && hasSharedChild(spouseId, id);
    }
    return false;
  };
  const shouldRenderCousinSpouseAsAuxiliary = (id, spouseId) => {
    const person = db.people[id];
    const spouse = db.people[spouseId];
    return !!(person && spouse && person.gender === 'male' && spouse.gender === 'female' && isCousinMarriagePair(id, spouseId));
  };
  const shouldSuppressCousinHusbandOnFemaleSide = (id, spouseId) => {
    const person = db.people[id];
    const spouse = db.people[spouseId];
    return !!(person && spouse && person.gender === 'female' && spouse.gender === 'male' && isCousinMarriagePair(id, spouseId));
  };
  const addCousinMarriageMergeLines = (spouseId) => {
    const anchor = cousinMarriageAnchors.get(spouseId);
    const nodeCenter = primaryNodeCenters.get(spouseId);
    const mergeKey = `${spouseId}>${anchor && anchor.husbandId || ''}`;
    if (!anchor || !nodeCenter || cousinMarriageMergeLineKeys.has(mergeKey) || anchor.y === nodeCenter.y) return;
    cousinMarriageMergeLineKeys.add(mergeKey);
    const mergeX = anchor.x || nodeCenter.x;
    lines.push({
      type: 'stem',
      lineage: 'affinal',
      isMarriageMerge: true,
      x: mergeX,
      y: Math.min(anchor.y, nodeCenter.y),
      h: Math.abs(nodeCenter.y - anchor.y)
    });
    const ownBranchTargetX = getChildBranchTargetX(nodeCenter.nodeX);
    if (mergeX !== ownBranchTargetX) {
      lines.push({
        type: 'branch',
        lineage: 'affinal',
        isMarriageMerge: true,
        x: Math.min(mergeX, ownBranchTargetX),
        y: nodeCenter.y,
        w: Math.abs(ownBranchTargetX - mergeX)
      });
    }
  };

  const getRenderableKidEntries = (id, lineage = 'patrilineal', parentRenderKey = id) => {
    const p = db.people[id];
    if (!p) return [];

    const entries = [];
    const seen = new Set();
    const addKid = (cid, childLineage, viaMaternal = false) => {
      if (!db.people[cid] || seen.has(cid)) return;
      seen.add(cid);
      entries.push({ id: cid, lineage: childLineage, viaMaternal });
    };

    if (p.gender === 'male') {
      const childLineage = lineage === 'affinal' ? 'affinal' : 'patrilineal';
      (p.children || []).forEach(cid => { if (!isHiddenInTree(cid) && !isRelationHidden(parentRenderKey, cid)) addKid(cid, childLineage, false); });
    } else if (p.gender === 'female' && showMaternal && p.spouses && p.spouses.length > 0) {
      p.spouses.forEach(sid => {
        if (shouldSuppressCousinHusbandOnFemaleSide(id, sid)) return;
        if (isHiddenInTree(sid) || isRelationHidden(parentRenderKey, sid)) return;
        const spouse = db.people[sid];
        if (spouse && spouse.children && spouse.children.length > 0) {
          spouse.children.forEach(cid => {
            if (isHiddenInTree(cid) || isRelationHidden(parentRenderKey, cid)) return;
            const childLineage = lineage === 'affinal' || !isBirthMotherOf(id, cid) ? 'affinal' : 'patrilineal';
            addKid(cid, childLineage, true);
          });
        }
      });
    }

    return entries;
  };

  const getMaternalSpouseKidGroups = (id, lineage = 'patrilineal', parentRenderKey = id) => {
    const p = db.people[id];
    if (!p || p.gender !== 'female' || !showMaternal || !showSpouses || !p.spouses || p.spouses.length === 0) return [];

    const seen = new Set();
    return p.spouses
      .filter(sid => !shouldSuppressCousinHusbandOnFemaleSide(id, sid) && !isHiddenInTree(sid) && !isRelationHidden(parentRenderKey, sid))
      .map(sid => {
        const spouse = db.people[sid];
        const kidEntries = [];
        if (spouse && Array.isArray(spouse.children)) {
          spouse.children.forEach(cid => {
            if (!db.people[cid] || seen.has(cid) || isHiddenInTree(cid) || isRelationHidden(parentRenderKey, cid)) return;
            seen.add(cid);
            kidEntries.push({
              id: cid,
              lineage: lineage === 'affinal' || !isBirthMotherOf(id, cid) ? 'affinal' : 'patrilineal',
              viaMaternal: true
            });
          });
        }
        return { spouseId: sid, kidEntries };
      });
  };

  const getRenderableKids = (id, lineage = 'patrilineal', parentRenderKey = id) => getRenderableKidEntries(id, lineage, parentRenderKey).map(entry => entry.id);
  const findMaxRight = (id, depth, visitedFmr) => {
    if (visitedFmr.has(id)) return;
    visitedFmr.add(id);
    const p = db.people[id]; if (!p) return;
    maxD = Math.max(maxD, depth + 1);
    const startX = showTimeline ? getTimelineX(id) : depth * INDENT_W;
    const father = db.people[getFatherId(id)];
    const displayName = getTreeDisplayName(p, true, father && father.hometown);
    maxR = Math.max(maxR, startX + (displayName.length * 30) + 350);
    const isCollapsedForLayout = (collapsedNodes || []).includes(id);
    if (!isCollapsedForLayout) {
      const sIds = (showSpouses && p.spouses)
        ? p.spouses.filter(sid => !shouldSuppressCousinHusbandOnFemaleSide(id, sid) && !isHiddenInTree(sid) && !isRelationHidden(id, sid))
        : [];
      if (sIds.length) {
        sIds.forEach(sid => {
          const s = db.people[sid]; if (s) {
            const spouseName = getTreeDisplayName(s, true);
            maxR = Math.max(maxR, (showTimeline ? getTimelineX(sid) : startX) + (spouseName.length * 30) + 350);
          }
        });
      }
      const kids = getRenderableKids(id);
      kids.forEach(cid => findMaxRight(cid, depth + 1, visitedFmr));
    }
  };
  findMaxRight(rootId, 0, new Set());

  const visitedTraverse = new Set();
  const renderedInstanceIds = new Set();
  const duplicateBranchCounts = {};
  const getDuplicateInstanceKey = (parentKey, id) => `${parentKey || 'root'}>${id}`;
  const addDuplicateBranchNode = (id, depth, rowIdx, lineage = 'patrilineal', options = {}) => {
    const person = db.people[id];
    if (!person) return rowIdx;
    const duplicateIndex = duplicateBranchCounts[id] || 0;
    duplicateBranchCounts[id] = duplicateIndex + 1;
    const fatherId = getFatherId(id);
    const fatherPerson = fatherId ? db.people[fatherId] : null;
    const rootPerson = rootId ? db.people[rootId] : null;
    const displayParts = getTreeDisplayParts(person, true, getVisibleFatherHometown(id, options.parentId), {
      contextPeople: [fatherPerson, rootPerson]
    });
    const nodeWidth = showTimeline
      ? getTimelineNodeWidth(id, person)
      : getCompactNodeWidth(person, displayParts.fullName);
    const timelineOccupancyW = showTimeline ? getTimelineOccupancyWidth(id, person, displayParts) : nodeWidth;
    const instanceKey = options.instanceKey || getDuplicateInstanceKey(options.parentRenderKey, id);
    const duplicateKidEntries = getRenderableKidEntries(id, lineage, instanceKey);
    const duplicateSpouseIds = (showSpouses && person.spouses) ? person.spouses.filter(sid => !isRelationHidden(instanceKey, sid)) : [];
    const duplicateHasExpandableItems = duplicateKidEntries.length > 0 || duplicateSpouseIds.length > 0;
    const duplicateIsExpanded = duplicateExpandedKeys.has(instanceKey);
    renderedInstanceIds.add(id);
    nodes.push({
      id,
      renderKey: instanceKey || `${id}__duplicate_${duplicateIndex}`,
      name: displayParts.name,
      rank: displayParts.rank,
      gender: person.gender || 'unknown',
      lineage,
      isLiving: isLivingPerson(person),
      nameText: displayParts.nameText,
      hometownPrefix: displayParts.hometownPrefix,
      nameSeparator: displayParts.nameSeparator,
      life: getLifeText(person),
      x: showTimeline ? getTimelineX(id) : depth * INDENT_W,
      y: rowIdx * rowStep,
      h: rowH,
      iconType: duplicateHasExpandableItems ? (duplicateIsExpanded ? 'minus' : 'plus') : 'leaf',
      maskStyle: getMask(person, getBYear(db, id)),
      fadeStartPercent: getFadeStartPercent(person, getBYear(db, id)),
      personalEventMarks: getPersonalEventMarks(id, nodeWidth, person),
      w: nodeWidth,
      timelineOccupancyW,
      isDuplicateBranch: true,
      duplicateBranchTargetId: id,
      duplicateInstanceKey: instanceKey,
      duplicateParentRenderKey: options.parentRenderKey || '',
      duplicateHaloGroup: options.duplicateHaloGroup || ''
    });
    reserveTimelineRowRange(rowIdx, showTimeline ? getTimelineX(id) : depth * INDENT_W, timelineOccupancyW);
    maxRow = Math.max(maxRow, rowIdx);
    let nextRow = rowIdx + 1;
    if (!duplicateHasExpandableItems || !duplicateIsExpanded) return nextRow;

    const childEntries = duplicateKidEntries;
    const childIds = childEntries.map(entry => entry.id);
    if (childIds.length > 0) {
      const parentIconX = (showTimeline ? getTimelineX(id) : depth * INDENT_W) + TRUNK_OFFSET;
      const childXBase = getChildTrunkX(childIds, parentIconX);
      const stemStartMidY = rowIdx * rowStep + rowH / 2;
      const connectorLineage = childEntries.every(entry => entry.lineage === 'patrilineal') ? 'patrilineal' : 'affinal';
      if (showTimeline) {
        lines.push({ type: 'branch', lineage: connectorLineage, x: Math.min(parentIconX, childXBase), y: stemStartMidY, w: Math.abs(childXBase - parentIconX) });
      }
      let lastChildMidY = stemStartMidY;
      childIds.forEach(cid => {
        const childEntry = childEntries.find(entry => entry.id === cid);
        const childLineage = (childEntry && childEntry.lineage) || connectorLineage;
        const childX = showTimeline ? getTimelineX(cid) : (depth + 1) * INDENT_W;
        const childWidth = showTimeline ? getTimelineOccupancyWidth(cid, db.people[cid]) : STANDARD_NODE_MIN_W;
        const childRow = findTimelineRowForRange(nextRow, childX, childWidth);
        const targetX = getChildBranchTargetX(childX);
        const childMidY = childRow * rowStep + rowH / 2;
        lines.push({ type: 'branch', lineage: childLineage, x: childXBase, y: childMidY, w: Math.max(targetX - childXBase, 0) });
        nextRow = addDuplicateBranchNode(cid, depth + 1, childRow, childLineage, {
          parentRenderKey: instanceKey,
          parentId: id
        });
        if (nextRow > childRow) lastChildMidY = childMidY;
      });
      lines.push({ type: 'stem', lineage: connectorLineage, x: childXBase, y: stemStartMidY, h: lastChildMidY - stemStartMidY });
    }
    return nextRow;
  };
  const getVisibleFatherHometown = (id, directParentId) => {
    const fatherId = getFatherId(id);
    if (!fatherId || fatherId !== directParentId || !db.people[fatherId]) return '';
    return db.people[fatherId].hometown || '';
  };

  const traverse = (id, depth, rowIdx, lineage = 'patrilineal', renderKey = id, directParentId = '') => {
    if (visitedTraverse.has(id)) return rowIdx;
    visitedTraverse.add(id);
    const p = db.people[id]; 
    if (!p) return rowIdx;
    maxRow = Math.max(maxRow, rowIdx);
    const isCollapsed = (collapsedNodes || []).includes(id);
    const myX = showTimeline ? getTimelineX(id) : depth * INDENT_W;
    const myY = rowIdx * rowStep;
    const midY = myY + rowH / 2;
    
    const kidEntries = getRenderableKidEntries(id, lineage, renderKey);
    const kids = kidEntries.map(entry => entry.id);
    const sIds = (showSpouses && p.spouses)
      ? p.spouses.filter(sid => !shouldSuppressCousinHusbandOnFemaleSide(id, sid) && !isHiddenInTree(sid) && !isRelationHidden(renderKey, sid))
      : [];
    const maternalSpouseKidGroups = getMaternalSpouseKidGroups(id, lineage, renderKey);
    const groupMaternalKidsBySpouse = maternalSpouseKidGroups.length > 0;
    const hasExpandableItems = kids.length > 0 || sIds.length > 0;

    const isOutsider = !!(rootId && extractProgenitorId(id) !== extractProgenitorId(rootId));
    const fatherId = getFatherId(id);
    const fatherPerson = fatherId ? db.people[fatherId] : null;
    const rootPerson = rootId ? db.people[rootId] : null;
    const displayParts = getTreeDisplayParts(p, true, getVisibleFatherHometown(id, directParentId), {
      contextPeople: [fatherPerson, rootPerson]
    });
    
    // In timeline view: box ends at current year line, no right border line needed
    let nodeWidth;
    if (showTimeline) {
      nodeWidth = getTimelineNodeWidth(id, p);
    } else {
      nodeWidth = getCompactNodeWidth(p, displayParts.fullName);
    }
    const timelineOccupancyW = showTimeline ? getTimelineOccupancyWidth(id, p, displayParts) : nodeWidth;
    // CRITICAL: Use the 'id' parameter (db key) instead of p.id to ensure consistency
    // p.id might not match the db key if there was a data inconsistency
    renderedInstanceIds.add(id);
    nodes.push({
      id: id, renderKey: renderKey || id, name: displayParts.name, rank: displayParts.rank, gender: p.gender || 'unknown',
      lineage,
      isLiving: isLivingPerson(p),
      nameText: displayParts.nameText,
      hometownPrefix: displayParts.hometownPrefix,
      nameSeparator: displayParts.nameSeparator,
      life: getLifeText(p),
      x: myX, y: myY, h: rowH, iconType: hasExpandableItems ? (isCollapsed ? 'plus' : 'minus') : 'leaf',
      maskStyle: getMask(p, getBYear(db, id)),
      fadeStartPercent: getFadeStartPercent(p, getBYear(db, id)),
      personalEventMarks: getPersonalEventMarks(id, nodeWidth, p),
      w: nodeWidth,
      timelineOccupancyW,
      isOutsider: isOutsider
    });
    reserveTimelineRowRange(rowIdx, myX, timelineOccupancyW);
    primaryNodeCenters.set(id, { nodeX: myX, x: myX + TRUNK_OFFSET, y: midY });

    addCousinMarriageMergeLines(id);

    let nextAvailableRow = rowIdx + 1;
    const parentIconX = myX + TRUNK_OFFSET;

    if (!isCollapsed) {
      sIds.forEach(sid => {
        const s = db.people[sid]; if (!s) return;
        const spouseWasVisited = renderedInstanceIds.has(sid);
        const renderAsCousinAuxiliary = shouldRenderCousinSpouseAsAuxiliary(id, sid);
        const sX = showTimeline ? getTimelineX(sid) : myX;
        const sY = nextAvailableRow * rowStep;
        const spouseParts = getTreeDisplayParts(s, true, '', {
          contextPeople: [p, rootId ? db.people[rootId] : null]
        });
        const spouseKidEntries = groupMaternalKidsBySpouse
          ? (maternalSpouseKidGroups.find(group => group.spouseId === sid) || {}).kidEntries || []
          : [];
        const spouseKids = spouseKidEntries.map(entry => entry.id);
        const spouseCollapsed = (collapsedNodes || []).includes(sid);
        const spouseHasExpandableItems = spouseKids.length > 0;
        // In timeline view: box ends at current year line
        let spouseWidth;
        if (showTimeline) {
          spouseWidth = getTimelineNodeWidth(sid, s);
        } else {
          spouseWidth = getCompactNodeWidth(s, spouseParts.fullName);
        }
        const spouseOccupancyW = showTimeline ? getTimelineOccupancyWidth(sid, s, spouseParts) : spouseWidth;
        if (spouseWasVisited && !renderAsCousinAuxiliary) {
          nextAvailableRow = addDuplicateBranchNode(sid, depth, nextAvailableRow, lineage, { parentRenderKey: id });
        } else {
          // Spouse rows are auxiliary instances. Do not mark them as traversed, because the
          // same person may still need to appear later as the root of their own birth branch.
          renderedInstanceIds.add(sid);
          nodes.push({
            id: sid, renderKey: renderAsCousinAuxiliary ? `${renderKey || id}>spouse>${sid}` : sid, name: spouseParts.name, rank: spouseParts.rank, gender: s.gender || 'female', isSpouse: true,
            lineage,
            isLiving: isLivingPerson(s),
            nameText: spouseParts.nameText,
            hometownPrefix: spouseParts.hometownPrefix,
            nameSeparator: spouseParts.nameSeparator,
            life: getLifeText(s),
            x: sX, y: sY, h: rowH, iconType: spouseHasExpandableItems && spouseCollapsed ? 'marriageCollapsed' : 'marriage',
            maskStyle: getMask(s, getBYear(db, sid)),
            fadeStartPercent: getFadeStartPercent(s, getBYear(db, sid)),
            personalEventMarks: getPersonalEventMarks(sid, spouseWidth, s),
            w: spouseWidth,
            timelineOccupancyW: spouseOccupancyW
          });
          reserveTimelineRowRange(nextAvailableRow, sX, spouseOccupancyW);
          if (renderAsCousinAuxiliary) {
            cousinMarriageAnchors.set(sid, {
              spouseId: sid,
              husbandId: id,
              x: sX + TRUNK_OFFSET,
              y: sY + rowH / 2
            });
          }
          nextAvailableRow++;
        }

        if (!groupMaternalKidsBySpouse) return;
        if (!spouseHasExpandableItems || (!spouseWasVisited && spouseCollapsed)) return;

        const childXBase = getChildTrunkX(spouseKids, parentIconX);
        const stemStartMidY = midY;
        const connectorLineage = spouseKidEntries.every(entry => entry.lineage === 'patrilineal') ? 'patrilineal' : 'affinal';
        if (showTimeline) {
          lines.push({ type: 'branch', lineage: connectorLineage, x: Math.min(parentIconX, childXBase), y: stemStartMidY, w: Math.abs(childXBase - parentIconX) });
        }

        let lastChildMidY = stemStartMidY;
        const patrilinealStemEndYs = [];
        spouseKids.forEach(cid => {
          const childX = showTimeline ? getTimelineX(cid) : (depth + 1) * INDENT_W;
          const childWidth = showTimeline ? getTimelineOccupancyWidth(cid, db.people[cid]) : STANDARD_NODE_MIN_W;
          const childEntry = spouseKidEntries.find(entry => entry.id === cid);
          const childLineage = (childEntry && childEntry.lineage) || connectorLineage;
          const isBirthMotherChild = isBirthMotherOf(id, cid);
          const shouldRenderAsDuplicateBranch = !isBirthMotherChild || visitedTraverse.has(cid);
          const childRow = findTimelineRowForRange(nextAvailableRow, childX, childWidth);
          const childY = childRow * rowStep;
          const targetX = getChildBranchTargetX(childX);
          const childMidY = childY + rowH / 2;
          if (childLineage === 'patrilineal') patrilinealStemEndYs.push(childMidY);

          lines.push({ type: 'branch', lineage: childLineage, x: childXBase, y: childMidY, w: Math.max(targetX - childXBase, 0) });

          const beforeTraverseRow = nextAvailableRow;
          const directChildParentId = getFatherId(cid) === sid ? sid : id;
          const childEndRow = shouldRenderAsDuplicateBranch
            ? addDuplicateBranchNode(cid, depth + 1, childRow, childLineage, { parentRenderKey: id, parentId: directChildParentId })
            : traverse(cid, depth + 1, childRow, childLineage, cid, directChildParentId);
          nextAvailableRow = Math.max(nextAvailableRow, childEndRow);
          if (nextAvailableRow > beforeTraverseRow || childEndRow > childRow) {
            lastChildMidY = childMidY;
          }
        });

        lines.push({ type: 'stem', lineage: connectorLineage, x: childXBase, y: stemStartMidY, h: (lastChildMidY - stemStartMidY) });
        if (connectorLineage === 'affinal' && patrilinealStemEndYs.length > 0) {
          patrilinealStemEndYs.forEach(stemEndMidY => {
            const overlayH = stemEndMidY - stemStartMidY;
            if (overlayH > 0) {
              lines.push({ type: 'stem', lineage: 'patrilineal', isLineageOverlay: true, x: childXBase, y: stemStartMidY, h: overlayH });
            }
          });
        }
      });
      if (!groupMaternalKidsBySpouse && kids.length > 0) {
        const childXBase = getChildTrunkX(kids, parentIconX);
        if (p.gender === 'male') {
          sIds.forEach(sid => {
            if (!shouldRenderCousinSpouseAsAuxiliary(id, sid) || !cousinMarriageAnchors.has(sid)) return;
            cousinMarriageAnchors.set(sid, {
              ...cousinMarriageAnchors.get(sid),
              x: childXBase
            });
            addCousinMarriageMergeLines(sid);
          });
        }
        const stemStartMidY = midY;
        const connectorLineage = kidEntries.every(entry => entry.lineage === 'patrilineal') ? 'patrilineal' : 'affinal';
        if (showTimeline) {
          const branchLine = { type: 'branch', lineage: connectorLineage, x: Math.min(parentIconX, childXBase), y: stemStartMidY, w: Math.abs(childXBase - parentIconX) };
          lines.push(branchLine);
        }
        let lastChildMidY = stemStartMidY;
        const patrilinealStemEndYs = [];
        let actualChildCount = 0;
        kids.forEach((cid) => {
          const childEntry = kidEntries.find(entry => entry.id === cid);
          const isDuplicateChild = visitedTraverse.has(cid);
          actualChildCount++;

          // IMPORTANT: Record child row BEFORE traverse to use for branch line
          const childX = showTimeline ? getTimelineX(cid) : (depth + 1) * INDENT_W;
          const childWidth = showTimeline ? getTimelineOccupancyWidth(cid, db.people[cid]) : STANDARD_NODE_MIN_W;
          const childLineage = (childEntry && childEntry.lineage) || connectorLineage;
          const childRow = findTimelineRowForRange(nextAvailableRow, childX, childWidth);
          const childY = childRow * rowStep;
          const targetX = getChildBranchTargetX(childX);
          const childMidY = childY + rowH / 2;
          if (childLineage === 'patrilineal') patrilinealStemEndYs.push(childMidY);
          const branchLine = { type: 'branch', lineage: childLineage, x: childXBase, y: childMidY, w: Math.max(targetX - childXBase, 0) };
          lines.push(branchLine);

          // Save nextAvailableRow before traverse to detect if any descendants were actually rendered
          const beforeTraverseRow = nextAvailableRow;
          // traverse returns the total rows consumed by this child and all its descendants
          const childEndRow = isDuplicateChild
            ? addDuplicateBranchNode(cid, depth + 1, childRow, childLineage, { parentRenderKey: id, parentId: id })
            : traverse(cid, depth + 1, childRow, childLineage, cid, id);
          nextAvailableRow = Math.max(nextAvailableRow, childEndRow);

          // Only update lastChildMidY if this child or its descendants actually consumed rows
          // (i.e., nextAvailableRow increased after the traverse)
          if (nextAvailableRow > beforeTraverseRow || childEndRow > childRow) {
            // Last node is at row (nextAvailableRow - 1)
            // Use the actual child row that was recorded before traverse
            lastChildMidY = childRow * rowStep + rowH / 2;
          }
        });
        const stemLine = { type: 'stem', lineage: connectorLineage, x: childXBase, y: stemStartMidY, h: (lastChildMidY - stemStartMidY) };
        lines.push(stemLine);
        if (connectorLineage === 'affinal' && patrilinealStemEndYs.length > 0) {
          patrilinealStemEndYs.forEach(stemEndMidY => {
            const overlayH = stemEndMidY - stemStartMidY;
            if (overlayH > 0) {
              lines.push({ type: 'stem', lineage: 'patrilineal', isLineageOverlay: true, x: childXBase, y: stemStartMidY, h: overlayH });
            }
          });
        }

      }
    }
    return nextAvailableRow;
  };

  traverse(rootId, 0, 0);
  compactTimelineBranchesBottomUp();
  maxRow = compactRowsForNoGap(nodes, lines, rowH, rowStep);

  if (!showTimeline && nodes.length > 0) {
    const uniformNodeW = Math.max(
      STANDARD_NODE_MIN_W,
      ...nodes.map(node => node.w || STANDARD_NODE_MIN_W)
    );
    nodes.forEach(node => { node.w = uniformNodeW; });
    const nodesRight = Math.max(...nodes.map(node => (node.x || 0) + uniformNodeW));
    maxR = Math.max(maxR, nodesRight + 150);
  }

  const timelineContentEndYear = showTimeline
    ? startYear + Math.ceil(Math.max(
      maxR,
      Number.isFinite(maxEventYear) ? (maxEventYear - startYear) * PX_PER_YEAR : 0
    ) / PX_PER_YEAR)
    : startYear;
  const timelineRulerEndYear = shouldShowCurrentYear
    ? CURRENT_YEAR + TIMELINE_TRAIL_YEARS
    : timelineContentEndYear + 20;
  const currentYearLineMinHeight = shouldShowCurrentYear
    ? (CURRENT_YEAR - startYear + 20) * PX_PER_YEAR + 200
    : 0;
  const minHeight = Math.max((maxRow * rowStep) + rowH + 400, currentYearLineMinHeight);

  if (showTimeline) {
    // 时间轴视图：每10年一个小刻度，每20年一个大刻度（带标签），每100年一个更大的刻度
    for (let y = startYear; y <= timelineRulerEndYear; y += 10) {
      const isCentennial = y % 100 === 0;
      const isTwentyYear = y % 20 === 0;
      const isCurrent = shouldShowCurrentYear && y === CURRENT_YEAR;

      rulerTicks.push({
        x: (y - startYear) * PX_PER_YEAR,
        label: isTwentyYear || isCurrent ? y : '',
        type: isCentennial ? 'major' : (isTwentyYear ? 'medium' : 'minor'),
        isCurrentYear: isCurrent
      });
    }
  } else {
    // Standard ruler blocks: left boundary aligns with node left edge;
    // the block midpoint aligns with the expand/collapse trunk line.
    const generationsToShow = Math.max(maxD, 3);
    for (let i = 0; i < generationsToShow; i++) {
      rulerTicks.push({
        x: 40 + i * INDENT_W,
        label: (i + 1) + '世',
        type: 'standard',
        isLast: i === generationsToShow - 1
      });
    }
  }
  if (showTimeline) {
    timelineEventsWithLabelLanes.forEach(event => {
      const rect = getTimelineRangeRect(event.startYear, event.endYear, startYear);
      timelineEventBands.push({
        id: event.id,
        label: event.label,
        x: rect.x,
        w: rect.w,
        edgeInset: 0,
        edgeMarkWidth: TIMELINE_YEAR_EDGE_W,
        hideRightEdge: shouldHideTimelineEventRightEdge(event),
        startYear: event.startYear,
        endYear: event.endYear,
        tone: event.tone,
        isCurrentYear: !!event.isCurrentYear,
        labelLane: event.labelLane || 0,
        labelOffsetX: event.labelOffsetX || 0,
        labelColor: event.labelColor || getTimelineEventLabelColor(event)
      });
    });
  }
  const finalMaxR = showTimeline
    ? Math.max(
      maxR,
      shouldShowCurrentYear ? currentYearLineX + (TIMELINE_TRAIL_YEARS * PX_PER_YEAR) + TIMELINE_EDGE_PAD : 0,
      getTimelineYearMarkRightX(maxEventYear, startYear) + TIMELINE_EDGE_PAD
    )
    : maxR + 150;
  
  return { 
    nodes, 
    lines, 
    rulerTicks, 
    timelineEventBands,
    maxR: finalMaxR, 
    maxH: minHeight,
    currentYearLineX,
    currentYear: CURRENT_YEAR,
    timelineYearWidth: PX_PER_YEAR
  };
}

function compactRowsForNoGap(nodes, lines, rowH = STANDARD_ROW_H, rowStep = STANDARD_ROW_STEP) {
  if (!Array.isArray(nodes) || nodes.length === 0) return 0;
  const rows = Array.from(new Set(nodes.map(node => Math.round((node.y || 0) / rowStep)))).sort((a, b) => a - b);
  const rowMap = new Map();
  rows.forEach((row, index) => rowMap.set(row, index));
  const remapCenterY = (centerY) => {
    const row = Math.round((centerY - rowH / 2) / rowStep);
    const mapped = rowMap.has(row) ? rowMap.get(row) : row;
    return mapped * rowStep + rowH / 2;
  };

  nodes.forEach(node => {
    const row = Math.round((node.y || 0) / rowStep);
    if (rowMap.has(row)) node.y = rowMap.get(row) * rowStep;
  });

  (lines || []).forEach(line => {
    const startCenter = line.y || 0;
    const newStart = remapCenterY(startCenter);
    if (line.type === 'stem') {
      const endCenter = startCenter + (line.h || 0);
      const newEnd = remapCenterY(endCenter);
      line.y = newStart;
      line.h = Math.max(0, newEnd - newStart);
    } else {
      line.y = newStart;
    }
  });

  return Math.max(0, rows.length - 1);
}

module.exports = { calculateLayout, formatHometown, getTreeDisplayName, getTreeDisplayParts };
