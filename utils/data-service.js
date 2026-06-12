// utils/data-service.js
const STORAGE_KEY_BASE = 'family_db_session';
const EXPORT_SCHEMA = 'jiapu-family-tree';
const EXPORT_VERSION = 2;

const PERSON_TEXT_FIELDS = [
  'surname',
  'firstname',
  'name',
  'hometown',
  'bYear',
  'bDate',
  'bPlace',
  'dYear',
  'dDate',
  'dPlace',
  'age',
  'alias',
  'rank',
  'motherId',
  'workspaceId'
];

const VALID_GENDERS = ['male', 'female', 'unknown'];

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function cleanText(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function cleanYear(value) {
  const text = cleanText(value);
  if (!text) return '';
  const year = parseInt(text, 10);
  return Number.isFinite(year) ? String(year) : '';
}

function cleanYearRangeText(value) {
  const text = cleanText(value);
  if (!text) return null;
  const match = text.match(/^(-?\d{1,4})(?:\s*(?:-|~|\u2013|\u2014|\u81f3|\u5230)\s*(-?\d{1,4}))?$/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : start;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return {
    startYear: String(Math.min(start, end)),
    endYear: String(Math.max(start, end))
  };
}

function cleanYearRangeListText(value) {
  const text = cleanText(value);
  if (!text) return null;
  const parts = text.split(/[,\uFF0C\u3001;\uFF1B]+/).map(part => part.trim()).filter(Boolean);
  if (!parts.length) return null;
  const ranges = [];
  for (let i = 0; i < parts.length; i++) {
    const range = cleanYearRangeText(parts[i]);
    if (!range) return null;
    ranges.push(range);
  }
  return ranges;
}

function formatYearRanges(ranges) {
  return (Array.isArray(ranges) ? ranges : [])
    .map(range => {
      const start = cleanText(range && range.startYear);
      const end = cleanText(range && range.endYear);
      if (!start) return '';
      return end && end !== start ? `${start}-${end}` : start;
    })
    .filter(Boolean)
    .join(', ');
}

function cleanYearRanges(source) {
  const storedRanges = cleanYearRangeListText(source && (source.year || source.yearLabel));
  if (storedRanges && storedRanges.length) return storedRanges;

  const legacyRanges = cleanYearRangeListText(source && (source.years || source.date));
  if (legacyRanges && legacyRanges.length) return legacyRanges;

  const singleRange = cleanYearRange(source);
  return singleRange ? [singleRange] : null;
}

function cleanYearRange(source) {
  const inlineRange = cleanYearRangeText(source && (source.year || source.yearLabel || source.years || source.date));
  const startYear = cleanYear(source && (source.startYear || source.start)) || (inlineRange && inlineRange.startYear);
  if (!startYear) return null;
  const endYear = cleanYear(source && (source.endYear || source.end || source.to)) || (inlineRange && inlineRange.endYear) || startYear;
  const startNum = parseInt(startYear, 10);
  const endNum = parseInt(endYear, 10);
  if (!Number.isFinite(startNum) || !Number.isFinite(endNum)) return null;
  return {
    startYear: String(Math.min(startNum, endNum)),
    endYear: String(Math.max(startNum, endNum))
  };
}

function cleanGender(value) {
  const gender = cleanText(value);
  return VALID_GENDERS.includes(gender) ? gender : 'unknown';
}

function cleanPersonalEventForSchema(source, index) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const name = cleanText(source.name || source.title || source.label || source.type);
  const ranges = cleanYearRanges(source);
  if (!name || !ranges || !ranges.length) return null;
  const cleaned = {
    id: cleanText(source.id) || `personal_event_${index}`,
    name,
    year: formatYearRanges(ranges)
  };
  if (source.hidden === true || source.hidden === 'true' || source.visible === false || source.visible === 'false') {
    cleaned.hidden = true;
  }
  return cleaned;
}

function cleanPersonalEventsForSchema(sourceEvents) {
  if (!Array.isArray(sourceEvents)) return [];
  const used = new Set();
  return sourceEvents
    .map((event, index) => cleanPersonalEventForSchema(event, index))
    .filter(Boolean)
    .map((event, index) => {
      let id = event.id || `personal_event_${index}`;
      while (used.has(id)) id = `${id}_${index}`;
      used.add(id);
      return { ...event, id };
    });
}

function normalizeLivingValue(value) {
  if (value === true || value === 'true' || value === '1' || value === 'living') return true;
  if (value === false || value === 'false' || value === '0' || value === 'deceased') return false;
  return null;
}

function inferLivingValue(source) {
  const explicit = normalizeLivingValue(source && source.isLiving);
  if (explicit !== null) return explicit;

  const birthYear = parseInt(cleanText(source && source.bYear), 10);
  const hasDeathDetails = !!(
    cleanText(source && source.dYear)
    || cleanText(source && source.dDate)
    || cleanText(source && source.dPlace)
    || cleanText(source && source.age)
  );
  const currentYear = new Date().getFullYear();
  return !hasDeathDetails
    && Number.isFinite(birthYear)
    && birthYear >= 1930
    && birthYear <= currentYear;
}

function cleanPersonForSchema(source, id) {
  const gender = cleanGender(source && source.gender);
  const person = {
    id: cleanText(id || (source && source.id)),
    gender,
    isLiving: inferLivingValue(source),
    children: gender === 'male' ? asArray(source && source.children) : [],
    spouses: asArray(source && source.spouses),
    events: cleanPersonalEventsForSchema(
      (source && (source.events || source.personalEvents || source.profileEvents)) || []
    )
  };

  PERSON_TEXT_FIELDS.forEach((field) => {
    const value = cleanText(source && source[field]);
    if (value) person[field] = value;
  });

  if (person.bYear && person.dYear && person.age) {
    delete person.age;
  }

  // Older files used sharedId for what is now workspaceId. Import it as the
  // current field name, but never keep sharedId itself.
  if (!person.workspaceId) {
    const legacyWorkspaceId = cleanText(source && source.sharedId);
    if (legacyWorkspaceId) person.workspaceId = legacyWorkspaceId;
  }

  return person;
}

function cleanTimelineEventForSchema(source, index) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const name = cleanText(source.name || source.title || source.label);
  const ranges = cleanYearRanges(source);
  if (!name || !ranges || !ranges.length) return null;
  const cleaned = {
    id: cleanText(source.id) || `event_${index}`,
    name,
    year: formatYearRanges(ranges)
  };
  if (source.hidden === true || source.hidden === 'true' || source.visible === false || source.visible === 'false') {
    cleaned.hidden = true;
  }
  const key = cleanText(source.key);
  if (key) cleaned.key = key;
  const defaultVersion = cleanText(source.defaultVersion);
  if (defaultVersion) cleaned.defaultVersion = defaultVersion;
  const workspaceId = cleanText(source.workspaceId || source.workspace || source.sharedId);
  if (workspaceId) cleaned.workspaceId = workspaceId;
  return cleaned;
}

function cleanTimelineEventsForSchema(sourceEvents) {
  if (!Array.isArray(sourceEvents)) return [];
  const used = new Set();
  return sourceEvents
    .map((event, index) => cleanTimelineEventForSchema(event, index))
    .filter(Boolean)
    .map((event, index) => {
      let id = event.id || `event_${index}`;
      while (used.has(id)) id = `${id}_${index}`;
      used.add(id);
      return { ...event, id };
    });
}

function cleanBundledSampleVersions(sourceVersions) {
  if (!sourceVersions || typeof sourceVersions !== 'object' || Array.isArray(sourceVersions)) return {};
  return Object.keys(sourceVersions).reduce((versions, key) => {
    const cleanKey = cleanText(key);
    const cleanVersion = cleanText(sourceVersions[key]);
    if (cleanKey && cleanVersion) versions[cleanKey] = cleanVersion;
    return versions;
  }, {});
}

function cleanDbForSchema(db, allowEmpty = true) {
  const source = db && typeof db === 'object' ? db : {};
  if (!source.people || typeof source.people !== 'object' || Array.isArray(source.people)) {
    if (allowEmpty) return { activeRootId: null, people: {} };
    throw new Error('JSON 中没有有效的 people 数据');
  }

  const result = normalizePeopleMap(source.people);
  const activeRootId = result.renameMap[source.activeRootId] || source.activeRootId;
  const cleanDb = {
    activeRootId: activeRootId && result.people[activeRootId]
      ? activeRootId
      : Object.keys(result.people)[0] || null,
    people: result.people,
    timelineEvents: cleanTimelineEventsForSchema(source.timelineEvents)
  };
  const bundledSampleVersions = cleanBundledSampleVersions(source.bundledSampleVersions);
  if (Object.keys(bundledSampleVersions).length) {
    cleanDb.bundledSampleVersions = bundledSampleVersions;
  }
  return cleanDb;
}

function cleanFileName(name) {
  return String(name || 'family_tree')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 48) || 'family_tree';
}

function getDisplayName(person) {
  if (!person) return '家谱';
  return person.name || [person.surname, person.firstname].filter(Boolean).join('') || '未命名';
}

function makeRootId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 9; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${s.slice(0, 3)}_${s.slice(3, 6)}_${s.slice(6, 9)}-`;
}

function makeUniqueRootId(people) {
  let id = makeRootId();
  while (people && people[id]) id = makeRootId();
  return id;
}

function numberToLetters(index) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let n = index;
  let out = '';
  do {
    out = chars[n % 26] + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

function normalizePeopleMap(sourcePeople) {
  if (!sourcePeople || typeof sourcePeople !== 'object' || Array.isArray(sourcePeople)) {
    throw new Error('JSON 中没有有效的 people 数据');
  }

  const people = {};
  const renameMap = {};

  Object.keys(sourcePeople).forEach((key) => {
    const source = sourcePeople[key];
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;

    let id = String(source.id || key || '').trim();
    if (!id) id = makeRootId();
    while (people[id]) id = `${id}_${Object.keys(people).length}`;

    renameMap[key] = id;
    if (source.id) renameMap[String(source.id)] = id;
    people[id] = cleanPersonForSchema(source, id);
  });

  Object.keys(people).forEach((id) => {
    const person = people[id];
    person.children = person.gender === 'male'
      ? asArray(person.children).map(cid => renameMap[cid] || cid).filter(cid => people[cid])
      : [];
    person.spouses = asArray(person.spouses).map(sid => renameMap[sid] || sid).filter(sid => people[sid]);
    if (person.motherId) {
      person.motherId = renameMap[person.motherId] || person.motherId;
      if (!people[person.motherId]) delete person.motherId;
    }
  });

  return { people, renameMap };
}

function resolveNestedMotherId(child, spouseRefs) {
  const explicitMotherId = cleanText(child && child.motherId);
  if (explicitMotherId && spouseRefs.some(ref => ref.id === explicitMotherId)) return explicitMotherId;

  const motherName = cleanText(child && (child.motherName || child.mother || child.motherText || explicitMotherId));
  if (motherName) {
    const matched = spouseRefs.find(ref => {
      const names = [
        ref.person && ref.person.name,
        ref.person && ref.person.alias,
        ref.source && ref.source.name,
        ref.source && ref.source.alias
      ].map(cleanText).filter(Boolean);
      return names.some(name => name === motherName || name.includes(motherName) || motherName.includes(name));
    });
    if (matched) return matched.id;
  }

  const femaleSpouses = spouseRefs.filter(ref => ref.person && ref.person.gender === 'female');
  return femaleSpouses.length === 1 ? femaleSpouses[0].id : '';
}

function convertNestedRoot(root, options = {}) {
  if (!root || typeof root !== 'object') {
    throw new Error('JSON 中没有有效的 root 数据');
  }

  const people = {};
  const rootId = makeUniqueRootId(people);
  const defaultWorkspaceId = cleanText(root.workspaceId || options.workspaceId) || rootId;

  function visit(node, id) {
    const children = Array.isArray(node.children) ? node.children.filter(child => child && typeof child === 'object' && !Array.isArray(child)) : [];
    const spouses = Array.isArray(node.spouses) ? node.spouses.filter(spouse => spouse && typeof spouse === 'object' && !Array.isArray(spouse)) : [];
    const person = cleanPersonForSchema({
      ...node,
      gender: cleanText(node.gender) || (children.length ? 'male' : undefined),
      workspaceId: cleanText(node.workspaceId) || defaultWorkspaceId
    }, id);
    person.children = [];
    person.spouses = [];
    if (!person.workspaceId) person.workspaceId = defaultWorkspaceId;
    people[id] = person;

    const spouseRefs = [];
    spouses.forEach((spouse, index) => {
      const spouseId = makeUniqueRootId(people);
      person.spouses.push(spouseId);
      const spousePerson = cleanPersonForSchema(
        {
          ...spouse,
          children: [],
          spouses: [id],
          gender: cleanText(spouse.gender) || 'female',
          workspaceId: cleanText(spouse.workspaceId) || defaultWorkspaceId
        },
        spouseId
      );
      spousePerson.children = [];
      spousePerson.spouses = [id];
      if (!spousePerson.workspaceId) spousePerson.workspaceId = defaultWorkspaceId;
      people[spouseId] = spousePerson;
      spouseRefs.push({ id: spouseId, person: spousePerson, source: spouse, index });
    });

    if (person.gender === 'male') {
      children.forEach((child, index) => {
        const childId = `${id}${numberToLetters(index)}`;
        const motherId = resolveNestedMotherId(child, spouseRefs);
        person.children.push(childId);
        visit({
          ...child,
          ...(motherId ? { motherId } : {}),
          workspaceId: cleanText(child.workspaceId) || defaultWorkspaceId
        }, childId);
      });
    }
  }

  visit(root, rootId);
  const normalized = {
    activeRootId: rootId,
    people,
    timelineEvents: cleanTimelineEventsForSchema(options.timelineEvents)
  };
  const familyName = cleanText(options.familyName);
  if (familyName) normalized.familyName = familyName;
  return normalized;
}

function pickPayload(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('JSON 内容不是对象');
  if (raw.data && (raw.data.people || raw.data.root)) return raw.data;
  if (raw.content && (raw.content.people || raw.content.root)) return raw.content;
  if (raw.db && (raw.db.people || raw.db.root)) return raw.db;
  return raw;
}

function normalizeImportData(raw) {
  const payload = pickPayload(raw);
  let normalized;

  if (payload.people) {
    normalized = cleanDbForSchema(payload, false);
  } else if (payload.root) {
    normalized = convertNestedRoot(payload.root, payload);
  } else {
    throw new Error('不是可识别的家谱 JSON');
  }

  if (!normalized.people || Object.keys(normalized.people).length === 0) {
    throw new Error('JSON 中没有成员数据');
  }
  return deepClone(normalized);
}

function buildExportPayload(db, options = {}) {
  const cleanDb = cleanDbForSchema(db);
  const root = cleanDb.people && cleanDb.people[cleanDb.activeRootId];
  return {
    schema: EXPORT_SCHEMA,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    familyName: options.familyName || (db && db.familyName) || '',
    activeRootId: cleanDb.activeRootId || null,
    people: cleanDb.people,
    timelineEvents: cleanDb.timelineEvents,
    rootName: getDisplayName(root)
  };
}

module.exports = {
  // Get session from local storage
  getSession: function() {
    try {
      const storageKey = STORAGE_KEY_BASE;
      const raw = wx.getStorageSync(storageKey);
      if (!raw) return null;
      if (typeof raw !== 'object' || raw === null) {
        console.warn('getSession: invalid storage data, clearing');
        wx.removeStorageSync(storageKey);
        return null;
      }
      return cleanDbForSchema(raw);
    } catch (e) {
      console.error('getSession error, clearing storage:', e);
      wx.removeStorageSync(STORAGE_KEY_BASE);
      return null;
    }
  },

  // Save session to local storage
  saveSession: function(db) {
    try {
      wx.setStorageSync(STORAGE_KEY_BASE, cleanDbForSchema(db));
    } catch (e) {
      console.error('saveSession error:', e);
    }
  },

  normalizeImportData,
  buildExportPayload,
  cleanDbForSchema,

  importFromChat: function() {
    return new Promise((resolve, reject) => {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['json'],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          if (!file || !file.path) {
            reject(new Error('没有选择文件'));
            return;
          }

          try {
            const fs = wx.getFileSystemManager();
            const text = fs.readFileSync(file.path, 'utf8').replace(/^\uFEFF/, '');
            const db = normalizeImportData(JSON.parse(text));
            resolve({
              db,
              fileName: file.name || '家谱.json',
              count: Object.keys(db.people || {}).length
            });
          } catch (e) {
            reject(e);
          }
        },
        fail: reject
      });
    });
  },

  exportToChat: function(db, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!db || !db.people || Object.keys(db.people).length === 0) {
          reject(new Error('没有可导出的家谱数据'));
          return;
        }
        if (!wx.shareFileMessage) {
          reject(new Error('当前微信版本不支持文件分享'));
          return;
        }

        const fs = wx.getFileSystemManager();
        const payload = buildExportPayload(db, options);
        const rootName = cleanFileName(options.fileRootName || payload.rootName || options.familyName || '家谱');
        const fileSuffix = cleanFileName(options.fileSuffix || '家谱');
        const now = new Date();
        const dateStr = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') +
          String(now.getMinutes()).padStart(2, '0');
        const fileName = `${rootName}_${fileSuffix}_${dateStr}.json`;
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
        wx.shareFileMessage({
          filePath,
          fileName,
          success: () => resolve({ filePath, fileName }),
          fail: (err) => {
            if (err && err.errMsg && err.errMsg.includes('cancel')) err.cancelled = true;
            reject(err || new Error('分享失败'));
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
};
