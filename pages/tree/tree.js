const Logic = require('../../utils/family-logic.js');
const Data = require('../../utils/data-service.js');
const { formatLifeRange } = require('../../utils/life-format');
const Samples = require('../../utils/sample-data.js');
const EventColors = require('../../utils/event-colors.js');

const TIMELINE_YEAR_WIDTH = 6;
const TIMELINE_EDGE_MARK_WIDTH = 2;
const TIMELINE_EDGE_INSET = (TIMELINE_YEAR_WIDTH - TIMELINE_EDGE_MARK_WIDTH) / 2;
const TREE_ICON_SRC = {
  plus: '/assets/tree-icon-plus.png',
  minus: '/assets/tree-icon-minus.png',
  leaf: '/assets/tree-icon-leaf.png',
  marriage: '/assets/tree-icon-link.png',
  marriageCollapsed: '/assets/tree-icon-link-filled.png'
};
const TREE_ICON_IMAGE_SOURCES = Object.values(TREE_ICON_SRC);

function getTreeIconSrc(iconType) {
  if (!iconType) return '';
  return TREE_ICON_SRC[iconType] || '';
}

const TREE_STYLE = {
  nameColor: '#05070a',
  lifeColor: '#666666',
  lineColor: '#2f3a45',
  patrilinealLineColor: '#2f3a45',
  affinalLineColor: '#b5c2bf',
  lineWidth: 2,
  patrilinealLineWidth: 2,
  affinalLineWidth: 2,
  marriageLineWidth: 2,
  nodeBorderColor: 'rgba(0,0,0,0.12)',
  nodeBorderWidth: 2,
  iconBorderColor: '#55616d',
  iconSize: 18,
  marriageIconSize: 26,
  iconStrokeWidth: 2,
  leafBorderColor: '#55616d',
  leafIconSize: 18,
  leafIconRadius: 4,
  marriageIconColor: '#55616d',
  marriageLineColor: '#b5c2bf',
  maleFill: '#bbdefb',
  femaleFill: '#fce4ec',
  unknownFill: '#dcedc8',
  maleBorder: '#7fb2d7',
  femaleBorder: '#dfa8bb',
  unknownBorder: '#a7c77e',
  currentYearColor: '#e65100',
  timelineScreenshotSideMargin: 24,
  screenshotSideMargin: 24,
  screenshotVerticalMargin: 36,
  timelineYearWidth: TIMELINE_YEAR_WIDTH,
  timelineEdgeMarkWidth: TIMELINE_EDGE_MARK_WIDTH,
  timelineEdgeInset: TIMELINE_EDGE_INSET,
  timelineIconBoxSize: 48,
  openingBracketTextNudge: -8,
  rulerHeight: 64,
  eventLabelTop: 72,
  eventLabelRowGap: 26,
  eventLabelHeight: 24,
  eventLabelColor: '#c2892b',
  eventLabelColors: ['#c2892b', '#508980', '#846f97'],
  eventLabelNodeClearance: 8,
  eventLabelRulerClearance: 10,
  timelineBaseTopGap: 44,
  treeContentBottomPadding: 220,
  timelineScreenshotBandTail: 80,
  screenshotQrPath: '/assets/miniprogram-qr.png',
  screenshotQrSize: 132,
  screenshotQrPad: 8,
  screenshotQrClearance: 14,
  screenshotQrLabel: '长按进入小程序',
  rulerBaseLineColor: '#7c858e',
  rulerTickColor: '#545e68',
  rulerMajorTickColor: '#242a31'
};

const DEFAULT_TIMELINE_EVENTS = [
  { key: 'taiping', name: '太平天国', year: '1851-1864' },
  { key: 'boxer', name: '庚子', year: '1900' },
  { key: 'xinhai', name: '辛亥', year: '1911' },
  { key: 'japanese-invasion', name: '日军侵华', year: '1937-1945' }
];
const DEFAULT_TIMELINE_EVENT_PROXIMITY_YEARS = 80;

Page({
  data: {
    db: { activeRootId: null, people: {} },
    treeStyle: TREE_STYLE,
    nodes: [], lines: [], rulerTicks: [], timelineEventBands: [], timelineNodeYearEdges: [],
    timelineYearWidth: TREE_STYLE.timelineYearWidth,
    timelineYearCenterOffset: TREE_STYLE.timelineYearWidth / 2,
    timelineEdgeMarkWidth: TREE_STYLE.timelineEdgeMarkWidth,
    timelineEdgeInset: TREE_STYLE.timelineEdgeInset,
    treeTopGap: TREE_STYLE.timelineBaseTopGap,
    treeContentBottomPadding: TREE_STYLE.treeContentBottomPadding,
    showTimeline: false, showSpouses: true, showMaternal: false,
    collapsedNodes: [], duplicateExpandedKeys: [], hiddenTreeIds: [], showDrawer: false,
    canToggleRelationVisibility: false,
    showEmptyTree: false,
    showTreeArea: false,
    editingId: '',
    draftPerson: {},
    _editingPerson: {},
    _pendingEdits: {},
    _pendingMotherSelected: false,
    _displaySpouses: [], _displayChildren: [], _displayFather: null, _displayMother: null, _displayPaternalRows: [],
    motherRange: [], currentMotherName: '',
    _personalEventSuggestions: [],
    maxR: 750, maxH: 1000, memberCount: 0, familyName: '',
    treeScrollLeft: 0, treeScrollTop: 0,
    creatingProfile: false,
    canAddChild: false, canAddFather: false, showJumpBtn: false,
    _hometownHint: '',
    // Progenitor list modal
    showProgenitorList: false,
    progenitorList: [],
    // Progenitor dropdown menu
    showProgenitorDropdown: false,
    progenitorWorkspaces: [], // array of workspace objects
    workspaceDeleteOpenId: '',
    // AI-assisted JSON import
    showAiImportPanel: false,
    aiPromptTarget: '',
    aiPromptText: '',
    aiJsonText: '',
    aiUseTraditionalChinese: false,
    showJsonImportPanel: false,
    jsonImportText: '',
    // Existing-person spouse picker
    showSpousePicker: false,
    spousePickerQuery: '',
    spousePickerResults: [],
    spousePickerCurrentIndex: 0,
    spousePickerTargetId: '',
    spousePickerTargetName: '',
    spousePickerMode: '',
    spousePickerMatchKey: '',
    spousePickerRelationType: 'spouse',
    spousePickerTitle: '可能已存在',
    spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
    spousePickerNewLabel: '继续新建',
    showTimelineEventPanel: false,
    timelineEventRows: [],
    timelineEventEditingId: '',
    timelineEventEditingField: '',
    showTimelineEventEditor: false,
    showTimelineEventDraft: false,
    timelineEventDraftName: '',
    timelineEventDraftYears: '',
    timelineEventDraftNameWidth: '84rpx',
    timelineEventDraftYearWidth: '110rpx',
    timelinePersonalEventRows: [],
    showScreenshotPreview: false,
    screenshotPreviewImagePath: '',
    screenshotPreviewImageWidth: 0,
    screenshotPreviewImageHeight: 0,
    screenshotPreviewDrawerY: 0,
  },

  // Non-reactive state cached here (not in this.data to avoid setData overhead)
  _layoutCache: null,  // Changed to null, initialized in onLoad
  _refreshingTree: false,  // Guard flag to prevent recursive refreshTree calls
  _refreshingDrawer: false,  // Guard flag to prevent recursive drawer operations
  _windowWidth: 375,
  _windowHeight: 667,
  _scrollLeftPx: 0,
  _scrollTopPx: 0,

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  onLoad(options) {
    if (this._loadedFromOnLoad) return;
    try {
      this._loadedFromOnLoad = true;
      this._refreshingTree = false;
      this._refreshingDrawer = false;
      this._layoutCache = { standard: null, timeline: null };
      const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      this._windowWidth = sys.windowWidth || 375;
      this._windowHeight = sys.windowHeight || 667;

      let db = Data.getSession();
      if (!db) {
        db = { activeRootId: null, people: {} };
        this._saveData(db);
      }
      if (!db || typeof db !== 'object') db = { activeRootId: null, people: {} };
      if (!db.people) db.people = {};

      db = this._migrateIdFormat(db);
      db = this._normalizeDbIdsForSchema(db);
      db = this._migrateWorkspaceId(db);
      db = this._migrateRemoveDerivedIds(db);
      db = this._ensureTimelineEvents(db);
      db = this._refreshBundledSamples(db);
      this._saveData(db);

      const isEmpty = !db.activeRootId || !db.people || Object.keys(db.people).length === 0 || !db.people[db.activeRootId];

      this.setData({ db }, () => {
        this.refreshTree();
        if (isEmpty) {
          setTimeout(() => {
            if (!this.data.showDrawer) this._showAddAncestorDialog();
          }, 100);
        }
      });
    } catch (e) {
      console.error('onLoad error:', e);
      this._loadedFromOnLoad = true;
      this.setData({ db: { activeRootId: null, people: {} }, nodes: [], lines: [], familyName: '新建家谱' }, () => {
        setTimeout(() => this._showAddAncestorDialog(), 100);
      });
    }
  },

  // ─────────────────────────────────────────────
  // ID format migration
  // Converts old dash-based IDs (xxx-xxx-xxx or xxx-xxx-xxx-) to new format (xxx_xxx_xxx-).
  // Also converts old underscore-terminated IDs.
  // This runs once on load so all subsequent operations use the new format.
  // ─────────────────────────────────────────────
  _migrateIdFormat(db, persist = true) {
    let changed = false;
    const migrated = [];

    // Helper: convert an old-style progenitor base (xxx-xxx-xxx with optional trailing - or _)
    // to new format xxx_xxx_xxx-
    const convertProgenitorId = (oldId) => {
      if (!oldId) return oldId;
      // Already new format: 12 chars, underscores, ends with '-'
      if (oldId.length === 12 && /^[a-z0-9]{3}_[a-z0-9]{3}_[a-z0-9]{3}-$/.test(oldId)) {
        return oldId;
      }
      // Old format: xxx-xxx-xxx (11 chars, hyphens, no trailing hyphen)
      if (/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/.test(oldId)) {
        return oldId.replace(/-/g, '_') + '-';
      }
      // Old format with trailing hyphen: xxx-xxx-xxx- (12 chars)
      if (/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}-$/.test(oldId)) {
        return oldId.replace(/-/g, '_').slice(0, -1) + '-';
        // e.g. abc-def-ghi- → abc_def_ghi_ → abc_def_ghi-
      }
      // Old format with trailing underscore: xxx-xxx-xxx_
      if (/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}_$/.test(oldId)) {
        return oldId.slice(0, -1).replace(/-/g, '_') + '-';
      }
      return oldId; // unknown, leave as-is
    };

    // Helper: convert a full person ID (progenitor or descendant) to new format
    const convertPersonId = (oldId) => {
      if (!oldId) return oldId;
      // New format already: xxx_xxx_xxx- or xxx_xxx_xxx-A etc.
      if (/^[a-z0-9]{3}_[a-z0-9]{3}_[a-z0-9]{3}-/.test(oldId)) return oldId;
      // Old descendant: xxx-xxx-xxx-A, xxx-xxx-xxx-AB, etc.
      const descendantMatch = oldId.match(/^([a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3})-([A-Z]+)$/);
      if (descendantMatch) {
        return convertProgenitorId(descendantMatch[1]) + descendantMatch[2];
      }
      // Old progenitor (no suffix): xxx-xxx-xxx
      const progenitorMatch = oldId.match(/^([a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3})(-?)(_?)$/);
      if (progenitorMatch) {
        return convertProgenitorId(progenitorMatch[1]);
      }
      return oldId;
    };

    // Build full ID rename map across all people
    const idRenameMap = {};
    Object.keys(db.people).forEach(oldKey => {
      const newKey = convertPersonId(oldKey);
      if (newKey !== oldKey) {
        idRenameMap[oldKey] = newKey;
        changed = true;
        migrated.push({ old: oldKey, new: newKey });
      }
    });

    if (changed) {
      // Rebuild people with new keys and update all references
      const newPeople = {};
      Object.entries(db.people).forEach(([oldKey, person]) => {
        const newKey = idRenameMap[oldKey] || oldKey;
        const p = { ...person, id: newKey };
        if (p.motherId)       p.motherId       = idRenameMap[p.motherId]       || p.motherId;
        delete p.paternalRootId;
        delete p.progenitorId_;
        if (p.children)  p.children  = p.children.map(c  => idRenameMap[c]  || c);
        if (p.spouses)   p.spouses   = p.spouses.map(s   => idRenameMap[s]  || s);
        newPeople[newKey] = p;
      });
      db = {
        ...db,
        activeRootId: idRenameMap[db.activeRootId] || db.activeRootId,
        people: newPeople
      };
      if (persist) Data.saveSession(db);
    } else {
      // No key migration needed; remove derived fields from older saves.
      let fieldChanged = false;
      Object.values(db.people).forEach(person => {
        if (person.paternalRootId) {
          delete person.paternalRootId;
          fieldChanged = true;
        }
        if (person.progenitorId_) {
          delete person.progenitorId_;
          fieldChanged = true;
        }
      });
      if (fieldChanged) {
        if (persist) this._saveData(db);
      }
    }
    return db;
  },

  // ─────────────────────────────────────────────
  // WorkspaceId migration
  // Old data has no workspaceId. Assign each progenitor tree its own workspaceId
  // (= the progenitor's own ID) and propagate to all connected nodes.
  // ─────────────────────────────────────────────
  _migrateWorkspaceId(db, persist = true) {
    const people = db.people;
    if (!people) return db;

    let changed = false;
    Object.values(people).forEach(person => {
      if (person.sharedId) {
        if (!person.workspaceId) person.workspaceId = person.sharedId;
        delete person.sharedId;
        changed = true;
      }
    });

    // Check if any person is missing workspaceId
    const needsMigration = Object.values(people).some(
      p => !p.workspaceId
    );
    if (!needsMigration) {
      if (changed && persist) this._saveData(db);
      return db;
    }

    // Collect all progenitors (root IDs)
    const localProgenitors = Object.keys(people).filter(
      id => this._isProgenitor(id)
    );

    // For each progenitor, BFS/DFS to assign workspaceId to entire connected tree
    localProgenitors.forEach(progenitorId => {
      const wsId = (people[progenitorId] && people[progenitorId].workspaceId) || progenitorId;

      const assign = (id, visited = new Set()) => {
        if (visited.has(id) || !people[id]) return;
        visited.add(id);

        if (!people[id].workspaceId) {
          people[id].workspaceId = wsId;
        }

        // Traverse children
        (people[id].children || []).forEach(cid => assign(cid, visited));
        // Traverse spouses (they may be independent progenitors but same workspace)
        (people[id].spouses || []).forEach(sid => {
          if (people[sid] && !people[sid].workspaceId) {
            people[sid].workspaceId = wsId;
          }
        });
      };

      assign(progenitorId);
    });

    if (persist) this._saveData(db);
    return db;
  },

  // ─────────────────────────────────────────────
  // Cleanup migration for fields that are now derived from ID.
  // fatherId, paternalRootId, and progenitorId_ are no longer stored.
  // ─────────────────────────────────────────────
  _migrateRemoveDerivedIds(db, persist = true) {
    if (!db.people) return db;
    let changed = false;
    Object.values(db.people).forEach(p => {
      if (p.fatherId) {
        delete p.fatherId;
        changed = true;
      }
      if (p.paternalRootId) {
        delete p.paternalRootId;
        changed = true;
      }
      if (p.progenitorId_) {
        delete p.progenitorId_;
        changed = true;
      }
    });
    if (changed && persist) {
      this._saveData(db);
    }
    return db;
  },

  // 显示添加祖先的对话框（用于空树状态）
  _showAddAncestorDialog() {
    // Guard: prevent recursive calls
    if (this._refreshingDrawer) {
      return;
    }
    this._refreshingDrawer = true;

    try {

      // Create fresh data for new ancestor
      const draftPerson = {
        id: '', // 空ID，等待保存时生成
        surname: '',
        firstname: '',
        name: '',
        gender: 'male',
        hometown: '',
        bYear: '',
        bDate: '',
        bPlace: '',
        dYear: '',
        dDate: '',
        dPlace: '',
        age: '',
        isLiving: '',
        alias: '',
        rank: '',
        children: [],
        spouses: [],
        _isNewAncestor: true // 标记是新增的祖先
      };

      this._spouseMatchSkippedKey = '';
      this._lastLiveMatchKey = '';
      this.setData({
        editingId: '', // 空ID表示新建
        draftPerson: draftPerson,
        _editingPerson: { ...draftPerson },
        showDrawer: true,
        ...this._emptyProfileContext(),
        creatingProfile: true,
        _hometownHint: ''
      });

    } catch (e) {
      console.error('_showAddAncestorDialog error:', e);
    } finally {
      // Clear guard flag after all operations complete
      setTimeout(() => {
        this._refreshingDrawer = false;
      }, 0);
    }
  },

  // Reload data when page becomes visible
  onShow() {
    // Guard: don't process if onLoad hasn't completed yet
    if (!this._loadedFromOnLoad) {
      return;
    }

    const db = Data.getSession();
    if (!db) return;

    const isEmpty = !db.activeRootId
      || !db.people
      || Object.keys(db.people).length === 0
      || !db.people[db.activeRootId];

    // If drawer is already open (e.g. onLoad just opened it), don't disturb it
    if (this.data.showDrawer) {
      return;
    }

    this.setData({ db }, () => {
      this.refreshTree();
      // Only auto-open dialog on onShow if onLoad already ran AND drawer is not open
      // (avoids double-open race; onLoad handles its own empty-state with setTimeout)
      if (isEmpty && !this.data.showDrawer) {
        this._showAddAncestorDialog();
      }
    });
  },

  // Manual trigger: "＋ 添加始祖" button on empty state screen
  onAddAncestorBtnTap() {
    try {

      this._showAddAncestorDialog();
    } catch (e) {
      console.error('onAddAncestorBtnTap error:', e);
    }
  },

  // ─────────────────────────────────────────────
  // Inline Drawer handlers (for simplified add/edit)
  // ─────────────────────────────────────────────

  // ─────────────────────────────────────────────
  // Drawer helpers
  // ─────────────────────────────────────────────

  _computeSuiAge(bYear, dYear) {
    const b = parseInt(String(bYear || '').trim(), 10);
    const d = parseInt(String(dYear || '').trim(), 10);
    if (!Number.isFinite(b) || !Number.isFinite(d) || b === 0 || d === 0 || d < b) return '';
    const skipYearZero = b < 0 && d > 0 ? 1 : 0;
    return String(d - b + 1 - skipYearZero);
  },

  _deriveDYearFromAge(bYear, age) {
    const b = parseInt(String(bYear || '').trim(), 10);
    const a = parseInt(String(age || '').trim(), 10);
    if (!Number.isFinite(b) || !Number.isFinite(a) || b === 0 || a <= 0) return '';
    let d = b + a - 1;
    if (b < 0 && d >= 0) d += 1;
    return d === 0 ? '' : String(d);
  },

  _deriveBYearFromAge(dYear, age) {
    const d = parseInt(String(dYear || '').trim(), 10);
    const a = parseInt(String(age || '').trim(), 10);
    if (!Number.isFinite(d) || !Number.isFinite(a) || d === 0 || a <= 0) return '';
    let b = d - a + 1;
    if (d > 0 && b <= 0) b -= 1;
    return b === 0 ? '' : String(b);
  },

  _computeLivingSuiAge(bYear) {
    const b = parseInt(String(bYear || '').trim(), 10);
    const currentYear = new Date().getFullYear();
    if (!Number.isFinite(b) || b === 0 || b > currentYear) return '';
    return this._computeSuiAge(b, currentYear);
  },

  _deriveBYearFromLivingAge(age) {
    return this._deriveBYearFromAge(new Date().getFullYear(), age);
  },

  _parseLifeNumber(value) {
    const n = parseInt(String(value || '').trim(), 10);
    return Number.isFinite(n) && n !== 0 ? n : null;
  },

  _inferLifeAutoField(person) {
    const p = person || {};
    const b = this._parseLifeNumber(p.bYear);
    const d = this._parseLifeNumber(p.dYear);
    const a = this._parseLifeNumber(p.age);
    if (this._normalizeLivingValue(p.isLiving)) {
      if (b !== null && a !== null && a === Number(this._computeLivingSuiAge(b))) return 'age';
      return '';
    }
    if (b !== null && d !== null && a !== null && d >= b && a === Number(this._computeSuiAge(b, d))) return 'age';
    return '';
  },

  _computeLifeAutoFields(person, changedField = '') {
    const p = { ...(person || {}) };
    const previousAutoField = String(p._lifeAutoField || this._inferLifeAutoField(p) || '');
    const changedValue = changedField ? String(p[changedField] || '').trim() : '';

    if (changedField && !changedValue) {
      if (previousAutoField && previousAutoField !== changedField) {
        p[previousAutoField] = '';
      } else if (changedField === 'bYear' || changedField === 'dYear') {
        p.age = '';
      }
      p._lifeAutoField = '';
      return p;
    }

    const b = this._parseLifeNumber(p.bYear);
    const d = this._parseLifeNumber(p.dYear);
    const a = this._parseLifeNumber(p.age);
    let autoField = '';

    if (changedField && previousAutoField && previousAutoField !== changedField) {
      p[previousAutoField] = '';
    }

    if (this._normalizeLivingValue(p.isLiving)) {
      if (changedField === '' && previousAutoField === 'age' && b !== null) {
        const computedAge = this._computeLivingSuiAge(b);
        if (computedAge) {
          p.age = computedAge;
          autoField = 'age';
        }
      } else if (changedField === '' && previousAutoField === 'bYear' && a !== null && a > 0) {
        const derived = this._deriveBYearFromLivingAge(a);
        if (derived) {
          p.bYear = derived;
          autoField = 'bYear';
        }
      } else if (changedField === 'age') {
        if (a !== null && a > 0) {
          const derived = this._deriveBYearFromLivingAge(a);
          if (derived) {
            p.bYear = derived;
            autoField = 'bYear';
          }
        }
      } else if (changedField === 'bYear') {
        if (b !== null) {
          const computedAge = this._computeLivingSuiAge(b);
          if (computedAge) {
            p.age = computedAge;
            autoField = 'age';
          }
        }
      } else if (changedField === '' || changedField === 'isLiving') {
        if (!String(p.age || '').trim() && b !== null) {
          const computedAge = this._computeLivingSuiAge(b);
          if (computedAge) {
            p.age = computedAge;
            autoField = 'age';
          }
        } else if (!String(p.bYear || '').trim() && a !== null && a > 0) {
          const derived = this._deriveBYearFromLivingAge(a);
          if (derived) {
            p.bYear = derived;
            autoField = 'bYear';
          }
        } else if (String(p.age || '').trim() && b !== null && a === Number(this._computeLivingSuiAge(b))) {
          autoField = 'age';
        }
      }

      p._lifeAutoField = autoField;
      return p;
    }

    if (changedField === '' && previousAutoField === 'age' && b !== null && d !== null && d >= b) {
      const computedAge = this._computeSuiAge(b, d);
      if (computedAge) {
        p.age = computedAge;
        autoField = 'age';
      }
    } else if (changedField === '' && previousAutoField === 'dYear' && b !== null && a !== null && a > 0) {
      const derived = this._deriveDYearFromAge(b, a);
      if (derived) {
        p.dYear = derived;
        autoField = 'dYear';
      }
    } else if (changedField === '' && previousAutoField === 'bYear' && d !== null && a !== null && a > 0) {
      const derived = this._deriveBYearFromAge(d, a);
      if (derived) {
        p.bYear = derived;
        autoField = 'bYear';
      }
    } else if (changedField === 'age') {
      if (a !== null && b !== null && a > 0) {
        const derived = this._deriveDYearFromAge(b, a);
        if (derived) {
          p.dYear = derived;
          autoField = 'dYear';
        }
      } else if (a !== null && d !== null && a > 0) {
        const derived = this._deriveBYearFromAge(d, a);
        if (derived) {
          p.bYear = derived;
          autoField = 'bYear';
        }
      }
    } else if (changedField === 'bYear') {
      if (previousAutoField === 'dYear' && b !== null && a !== null && a > 0) {
        const derived = this._deriveDYearFromAge(b, a);
        if (derived) {
          p.dYear = derived;
          autoField = 'dYear';
        }
      } else if (b !== null && d !== null && d >= b) {
        const computedAge = this._computeSuiAge(b, d);
        if (computedAge) {
          p.age = computedAge;
          autoField = 'age';
        }
      } else if (b !== null && a !== null && a > 0) {
        const derived = this._deriveDYearFromAge(b, a);
        if (derived) {
          p.dYear = derived;
          autoField = 'dYear';
        }
      }
    } else if (changedField === 'dYear') {
      if (previousAutoField === 'bYear' && d !== null && a !== null && a > 0) {
        const derived = this._deriveBYearFromAge(d, a);
        if (derived) {
          p.bYear = derived;
          autoField = 'bYear';
        }
      } else if (b !== null && d !== null && d >= b) {
        const computedAge = this._computeSuiAge(b, d);
        if (computedAge) {
          p.age = computedAge;
          autoField = 'age';
        }
      } else if (d !== null && a !== null && a > 0) {
        const derived = this._deriveBYearFromAge(d, a);
        if (derived) {
          p.bYear = derived;
          autoField = 'bYear';
        }
      }
    } else if (changedField === '') {
      if (!String(p.age || '').trim() && b !== null && d !== null && d >= b) {
        const computedAge = this._computeSuiAge(b, d);
        if (computedAge) {
          p.age = computedAge;
          autoField = 'age';
        }
      } else if (String(p.age || '').trim() && b !== null && d !== null && a === Number(this._computeSuiAge(b, d))) {
        autoField = 'age';
      } else if (!String(p.dYear || '').trim() && b !== null && a !== null && a > 0) {
        const derived = this._deriveDYearFromAge(b, a);
        if (derived) {
          p.dYear = derived;
          autoField = 'dYear';
        }
      } else if (!String(p.bYear || '').trim() && d !== null && a !== null && a > 0) {
        const derived = this._deriveBYearFromAge(d, a);
        if (derived) {
          p.bYear = derived;
          autoField = 'bYear';
        }
      }
    }

    p._lifeAutoField = autoField;
    return p;
  },

  _normalizeLivingValue(value) {
    return value === true || value === 'true' || value === '1' || value === 'living';
  },

  _isLivingPerson(person) {
    return this._normalizeLivingValue(person && person.isLiving);
  },

  _fillAutoAge(person) {
    if (!person) return person;
    const computed = this._computeLifeAutoFields(person, '');
    Object.assign(person, computed);
    const autoField = String(computed._lifeAutoField || '');
    if (autoField) person[autoField] = '';
    delete person._lifeAutoField;
    return person;
  },

  _updateDrawerField(field, value) {
    if (field === 'isLiving') value = this._normalizeLivingValue(value);
    const lifeFields = ['bYear', 'bDate', 'bPlace', 'dYear', 'dDate', 'dPlace', 'age', 'isLiving'];
    const lifeNumberFields = ['bYear', 'dYear', 'age'];
    if (this.data.creatingProfile) {
      const draft = { ...this.data.draftPerson, [field]: value };
      if (lifeFields.includes(field)) {
        Object.assign(draft, this._computeLifeAutoFields(draft, lifeNumberFields.includes(field) ? field : ''));
      }
      const editingPerson = { ...(this.data._editingPerson || {}), ...draft };
      this.setData({
        draftPerson: draft,
        _editingPerson: editingPerson
      });
    } else {
      const original = (this.data.db.people && this.data.db.people[this.data.editingId]) || {};
      const previousPending = this.data._pendingEdits || {};
      const pending = { ...previousPending, [field]: value };
      let editingPerson = { ...(this.data._editingPerson || {}), [field]: value };
      if (lifeFields.includes(field)) {
        const previousLifePerson = { ...original, ...previousPending };
        const previousAutoField = editingPerson._lifeAutoField
          || previousPending._lifeAutoField
          || this._inferLifeAutoField(previousLifePerson);
        const computed = this._computeLifeAutoFields({
          ...previousLifePerson,
          [field]: value,
          _lifeAutoField: previousAutoField
        }, lifeNumberFields.includes(field) ? field : '');
        const autoField = String(computed._lifeAutoField || '');
        ['bYear', 'dYear', 'age', 'isLiving'].forEach((name) => {
          const nextValue = autoField === name ? '' : computed[name];
          const originalValue = original[name];
          if (String(nextValue ?? '') !== String(originalValue ?? '')) {
            pending[name] = nextValue;
          } else if (pending[name] !== undefined) {
            delete pending[name];
          }
        });
        editingPerson = { ...editingPerson, ...computed };
      }
      const patch = { _pendingEdits: pending, _editingPerson: editingPerson };
      if (field === 'gender') patch.canAddChild = value === 'male';
      this.setData(patch);
    }
  },

  _emptyProfileContext() {
    return {
      _displaySpouses: [],
      _displayChildren: [],
      _displayFather: null,
      _displayMother: null,
      _displayPaternalRows: [],
      motherRange: [],
      currentMotherName: '',
      _personalEventSuggestions: [],
      showJumpBtn: false,
      canAddFather: false,
      canAddChild: false
    };
  },

  _formatFamilyName(rootPerson) {
    if (!rootPerson) return '新建家谱';
    const displayParts = Logic.getTreeDisplayParts(rootPerson, true);
    return `${displayParts.name || '始祖'} 世系`;
  },


  // ─────────────────────────────────────────────
  // Layout helpers
  // ─────────────────────────────────────────────

  refreshTree(done) {
    const db = this._ensureTimelineEvents(this.data.db || { activeRootId: null, people: {} });
    if (!this._layoutCache) this._layoutCache = { standard: null, timeline: null };
    const { showSpouses, showMaternal } = this.data;
    const people = db.people || {};
    let collapsedNodes = this.data.collapsedNodes || [];
    let rootId = this._resolvePersonKey(db.activeRootId, people);
    if (!rootId && db.activeRootId) {
      rootId = this._resolveRootKeyForPerson(db.activeRootId, people);
    }
    if (!rootId) {
      rootId = this._findFallbackActiveRoot(db);
    }
    if (rootId !== db.activeRootId) {
      db.activeRootId = rootId;
    }


    // 处理空树状态
    if (!rootId || !people[rootId]) {
      this._layoutCache.standard = { nodes: [], lines: [], rulerTicks: [], timelineEventBands: [], maxR: 750, maxH: 1000 };
      this._layoutCache.timeline = { nodes: [], lines: [], rulerTicks: [], timelineEventBands: [], maxR: 750, maxH: 1000 };
      this._applyCurrentLayout(done);
      return;
    }
    const makeLayouts = (nextCollapsedNodes) => {
      const common = {
        rootId: db.activeRootId,
        showSpouses,
        showMaternal,
        collapsedNodes: nextCollapsedNodes,
        duplicateExpandedKeys: this.data.duplicateExpandedKeys || [],
        hiddenTreeIds: db.hiddenTreeIds || []
      };
      const standard = Logic.calculateLayout(db, { ...common, showTimeline: false });
      const visibleProfileRange = this._getProfileYearRangeFromNodes(db, standard.nodes || []);
      const timeline = Logic.calculateLayout(db, {
        ...common,
        showTimeline: true,
        timelineEvents: this._getTimelineEventsForLayout(db, visibleProfileRange)
      });
      return { standard, timeline, visibleProfileRange };
    };
    let layouts = makeLayouts(collapsedNodes);
    if (
      collapsedNodes.length > 0
      && (
        !layouts.standard.nodes || layouts.standard.nodes.length === 0
        || !layouts.timeline.nodes || layouts.timeline.nodes.length === 0
      )
    ) {
      collapsedNodes = [];
      layouts = makeLayouts(collapsedNodes);
    }
    this._layoutCache.standard = layouts.standard;
    this._layoutCache.timeline = layouts.timeline;
    this._applyCurrentLayout(done);
  },

  _applyCurrentLayout(done) {
    const layout = this.data.showTimeline
      ? this._layoutCache.timeline
      : this._layoutCache.standard;
    const treeTopGap = this._getTreeTopGap((this._layoutCache.timeline && this._layoutCache.timeline.timelineEventBands) || []);
    const { db } = this.data;
    const nodes = this._decorateTreeNodes(layout.nodes || []);
    const lines = this._decorateConnectorLines(layout.lines || []);
    const duplicateHaloBoxes = this._buildDuplicateHaloBoxes(nodes);
    const timelineNodeYearEdges = this.data.showTimeline ? this._buildTimelineNodeYearEdges(nodes) : [];
    const maxH = layout.maxH + treeTopGap;
    const treeContentBottomPadding = this._getTreeContentBottomPadding(nodes, maxH, treeTopGap);


    // 处理空树状态时的标题
    let familyName = '新建家谱';
    if (db.activeRootId && db.people[db.activeRootId]) {
      const rootPerson = db.people[db.activeRootId];
      familyName = this._formatFamilyName({ ...rootPerson, id: db.activeRootId });
    }

    this.setData({
      'db.activeRootId': db.activeRootId,  // 更新activeRootId以触发正确的空状态显示
      nodes,
      lines,
      duplicateHaloBoxes,
      rulerTicks: layout.rulerTicks,
      timelineEventBands: this.data.showTimeline ? (layout.timelineEventBands || []) : [],
      timelineNodeYearEdges,
      timelineEventRows: this._buildTimelineEventRows(db, this._getProfileYearRangeFromNodes(db, nodes)),
      timelinePersonalEventRows: this._buildPersonalEventRows(db),
      _personalEventSuggestions: this._buildPersonalEventSuggestions(db),
      maxR: layout.maxR,
      maxH,
      treeTopGap,
      treeContentBottomPadding,
      timelineYearWidth: layout.timelineYearWidth || TREE_STYLE.timelineYearWidth,
      timelineYearCenterOffset: (layout.timelineYearWidth || TREE_STYLE.timelineYearWidth) / 2,
      timelineEdgeMarkWidth: TREE_STYLE.timelineEdgeMarkWidth,
      timelineEdgeInset: TREE_STYLE.timelineEdgeInset,
      currentYearLineX: layout.currentYearLineX || -1,
      currentYear: layout.currentYear || 2026,
      memberCount: Object.keys(db.people).length,
      familyName: familyName,
      showEmptyTree: !db.activeRootId || !layout.nodes || layout.nodes.length === 0,
      showTreeArea: !!db.activeRootId && !!layout.nodes && layout.nodes.length > 0
    }, () => {
      if (typeof done === 'function') done();
    });
  },

  _decorateConnectorLines(lines) {
    return (lines || []).map((line) => {
      const x = Number(line.x || 0);
      const y = Number(line.y || 0);
      const lineColor = this._getConnectorLineColor(line);
      const lineWidth = this._getConnectorLineWidth(line);
      const half = lineWidth / 2;
      if (line.type === 'branch') {
        const w = Math.max(Number(line.w || 0), 0);
        return {
          ...line,
          lineColor,
          drawX: x - half,
          drawY: y - half,
          drawW: w + lineWidth,
          drawH: lineWidth
        };
      }
      const strokeW = lineWidth;
      const h = Math.max(Number(line.h || 0), 0);
      return {
        ...line,
        lineColor,
        drawX: x - strokeW / 2,
        drawY: y - half,
        drawW: strokeW,
        drawH: h + lineWidth
      };
    });
  },

  _getLineageToneColor(lineage) {
    return lineage === 'affinal'
      ? TREE_STYLE.affinalLineColor
      : (TREE_STYLE.patrilinealLineColor || TREE_STYLE.lineColor);
  },

  _buildDuplicateHaloBoxes(nodes) {
    const groups = {};
    (nodes || []).forEach(node => {
      if (!node || !node.duplicateHaloGroup) return;
      if (!groups[node.duplicateHaloGroup]) groups[node.duplicateHaloGroup] = [];
      groups[node.duplicateHaloGroup].push(node);
    });
    return Object.keys(groups).map(groupId => {
      const groupNodes = groups[groupId];
      const left = Math.min(...groupNodes.map(node => Number(node.x || 0)));
      const top = Math.min(...groupNodes.map(node => Number(node.y || 0)));
      const right = Math.max(...groupNodes.map(node => Number(node.x || 0) + Number(this.data.showTimeline ? node.timelineRenderW : node.w || 0)));
      const bottom = Math.max(...groupNodes.map(node => Number(node.y || 0) + Number(node.h || 56)));
      const pad = 8;
      return {
        id: groupId,
        x: left - pad,
        y: top - pad,
        w: Math.max(0, right - left + pad * 2),
        h: Math.max(0, bottom - top + pad * 2)
      };
    });
  },

  _decorateTreeNodes(nodes) {
    const idCounts = (nodes || []).reduce((counts, node) => {
      if (node && node.id) counts[node.id] = (counts[node.id] || 0) + 1;
      return counts;
    }, {});
    return (nodes || []).map(node => {
      const displayIconType = node.iconType;
      const nodeFillColor = node.gender === 'male'
        ? TREE_STYLE.maleFill
        : node.gender === 'female'
          ? TREE_STYLE.femaleFill
          : TREE_STYLE.unknownFill;
      const nodeBorderColor = node.gender === 'male'
        ? TREE_STYLE.maleBorder
        : node.gender === 'female'
          ? TREE_STYLE.femaleBorder
          : TREE_STYLE.unknownBorder;
      const rawTimelineNodeW = Number(node.w);
      const baseTimelineNodeW = Number.isFinite(rawTimelineNodeW) ? rawTimelineNodeW : 0;
      const fadePercent = Number(node.fadeStartPercent);
      const hasFadeTail = Number.isFinite(fadePercent) && fadePercent > 0 && fadePercent < 100;
      const timelineEndExtra = node.isLiving || hasFadeTail ? 0 : (TREE_STYLE.timelineEdgeMarkWidth || 0);
      const timelineNodeW = Math.max(0, baseTimelineNodeW + timelineEndExtra);
      const timelineIconBoxSize = TREE_STYLE.timelineIconBoxSize || 48;
      const timelineRenderW = Math.max(timelineNodeW, TREE_STYLE.timelineEdgeMarkWidth || 1);
      const timelineIconBoxLeft = timelineRenderW < timelineIconBoxSize
        ? (timelineRenderW - timelineIconBoxSize) / 2
        : 0;
      const labelStart = node.hometownPrefix || node.nameText || node.name || '';
      const labelNudgeX = String(labelStart).startsWith('〔')
        ? (TREE_STYLE.openingBracketTextNudge || 0)
        : 0;
      const labelMarginLeft = (this.data.showTimeline ? timelineIconBoxLeft + timelineIconBoxSize + 2 : 64) + labelNudgeX;
      return {
        ...node,
        iconType: displayIconType,
        originalIconType: node.iconType,
        iconColor: node.iconType === 'marriage' ? this._getLineageToneColor(node.lineage) : TREE_STYLE.iconBorderColor,
        iconSrc: getTreeIconSrc(displayIconType, node.lineage),
        isDuplicateInstance: !!(node.id && idCounts[node.id] > 1),
        nodeFillColor,
        nodeBorderColor,
        labelNudgeX,
        labelMarginLeft,
        timelineRenderW,
        timelineIconBoxLeft,
        timelineHasEndEdge: timelineEndExtra > 0 && baseTimelineNodeW > 0,
        timelineEndEdgeLeft: baseTimelineNodeW,
        timelineEndEdgeW: timelineEndExtra,
        timelineIconFillW: Math.min(timelineIconBoxSize, timelineNodeW),
        timelineIconHasExtra: false
      };
    });
  },

  _buildTimelineNodeYearEdges(nodes) {
    const edgeInset = TREE_STYLE.timelineEdgeInset || 0;
    const edgeW = TREE_STYLE.timelineEdgeMarkWidth || 2;
    return (nodes || []).reduce((edges, node) => {
      const baseW = Number(node && node.w);
      if (!Number.isFinite(baseW) || baseW <= 0) return edges;
      if (node && node.isLiving) return edges;
      const fadePercent = Number(node && node.fadeStartPercent);
      if (Number.isFinite(fadePercent) && fadePercent > 0 && fadePercent < 100) return edges;
      const x = Number(node.x || 0) + edgeInset + baseW;
      edges.push({
        id: `${node.id || edges.length}-end`,
        x,
        y: Number(node.y || 0),
        w: edgeW,
        h: Math.max(1, Number(node.h || 48)),
        color: node.nodeBorderColor || TREE_STYLE.nodeBorderColor
      });
      return edges;
    }, []);
  },

  _getTimelineEventMaxLabelLane(bands = []) {
    return (bands || []).reduce((maxLane, band) => {
      const lane = Number(band && band.labelLane);
      return Number.isFinite(lane) ? Math.max(maxLane, lane) : maxLane;
    }, 0);
  },

  _getTimelineEventLabelBlockHeight(bands = []) {
    const maxLane = this._getTimelineEventMaxLabelLane(bands);
    return (TREE_STYLE.eventLabelHeight || 24) + maxLane * (TREE_STYLE.eventLabelRowGap || 26);
  },

  _getTreeTopGap(bands = []) {
    if (!bands || !bands.length) return TREE_STYLE.timelineBaseTopGap || 44;
    const labelTopWithinCanvas = Math.max(0, (TREE_STYLE.eventLabelTop || 72) - (TREE_STYLE.rulerHeight || 64));
    return Math.max(
      TREE_STYLE.timelineBaseTopGap || 44,
      labelTopWithinCanvas
        + this._getTimelineEventLabelBlockHeight(bands)
        + (TREE_STYLE.eventLabelNodeClearance || 8)
    );
  },

  _getTimelineScreenshotBottomTail(bands = []) {
    if (!bands || !bands.length) return 0;
    return Math.max(
      TREE_STYLE.timelineScreenshotBandTail || 0,
      32
        + this._getTimelineEventLabelBlockHeight(bands)
        + (TREE_STYLE.eventLabelNodeClearance || 8)
        + (TREE_STYLE.eventLabelRulerClearance || 10)
    );
  },

  _getTimelineEventsForLayout(db = this.data.db, profileRange = null) {
    return this._buildTimelineEventRows(db, profileRange)
      .filter(event => event.checked)
      .map(event => {
        const layoutEvent = { ...event };
        delete layoutEvent.checked;
        delete layoutEvent.yearLabel;
        delete layoutEvent.isDefault;
        delete layoutEvent.autoHiddenByProfileRange;
        return layoutEvent;
      });
  },

  _getConnectorLineColor(line) {
    if (line && line.type === 'marriage') return TREE_STYLE.marriageLineColor;
    return this._getLineageToneColor(line && line.lineage);
  },

  _getConnectorLineWidth(line) {
    return TREE_STYLE.lineWidth;
  },

  _rpxToPx(value) {
    return Number(value || 0) * (this._windowWidth || 375) / 750;
  },

  _pxToRpx(value) {
    return Number(value || 0) * 750 / (this._windowWidth || 375);
  },

  _treeViewportWidthRpx() {
    return this._pxToRpx(this._windowWidth || 375);
  },

  _treeViewportHeightRpx() {
    const totalHeightRpx = this._pxToRpx(this._windowHeight || 667);
    return Math.max(260, totalHeightRpx - 128);
  },

  _getTreeContentBottomPadding(nodes = [], maxH = 0, treeTopGap = 0) {
    const basePadding = TREE_STYLE.treeContentBottomPadding || 220;
    if (!Array.isArray(nodes) || nodes.length === 0) return basePadding;
    const lastNodeTop = nodes.reduce((maxTop, node) => {
      const top = Number(node && node.y || 0) + treeTopGap;
      return Math.max(maxTop, Number.isFinite(top) ? top : 0);
    }, 0);
    const remainingAfterLastTop = Math.max(0, Number(maxH || 0) - lastNodeTop);
    const viewportHeight = this._treeViewportHeightRpx();
    const rulerHeight = TREE_STYLE.rulerHeight || 64;
    const neededPadding = Math.ceil(viewportHeight - rulerHeight - remainingAfterLastTop + 8);
    return Math.max(basePadding, neededPadding);
  },

  onTreeScroll(e) {
    const detail = (e && e.detail) || {};
    this._scrollLeftPx = Number(detail.scrollLeft || 0);
    this._scrollTopPx = Number(detail.scrollTop || 0);
  },

  _getScrollAnchor() {
    const nodes = this.data.nodes || [];
    if (!nodes.length) return null;

    const scrollLeftRpx = this._pxToRpx(this._scrollLeftPx || this.data.treeScrollLeft || 0);
    const viewportRpx = this._treeViewportWidthRpx();
    const viewportRightRpx = scrollLeftRpx + viewportRpx;
    let bestNode = nodes[0];
    let bestScore = Infinity;

    nodes.forEach(node => {
      const nodeLeft = (node.x || 0) + 40;
      const nodeRight = nodeLeft + Math.max(node.w || 80, 80);
      if (nodeRight < scrollLeftRpx || nodeLeft > viewportRightRpx) return;

      const startsInView = nodeLeft >= scrollLeftRpx - 4;
      const spousePenalty = node.isSpouse ? 20 : 0;
      const score = startsInView
        ? (nodeLeft - scrollLeftRpx) + spousePenalty
        : viewportRpx + Math.abs(nodeLeft - scrollLeftRpx) + spousePenalty;
      if (score < bestScore) {
        bestScore = score;
        bestNode = node;
      }
    });

    if (!bestNode || !bestNode.id) return null;
    const nodeLeftRpx = (bestNode.x || 0) + 40;
    return {
      id: bestNode.id,
      screenLeftRpx: nodeLeftRpx - scrollLeftRpx
    };
  },

  _collectFocusedDescendantIds(people, focusId) {
    const descendants = new Set();
    const visit = (id) => {
      if (!id || descendants.has(id) || !people[id]) return;
      descendants.add(id);

      const person = people[id];
      const childIds = [];
      if (Array.isArray(person.children)) {
        person.children.forEach(childId => {
          if (people[childId]) childIds.push(childId);
        });
      }
      if (person.gender === 'female' && this.data.showMaternal && Array.isArray(person.spouses)) {
        person.spouses.forEach(spouseId => {
          const spouse = people[spouseId];
          if (!spouse || !Array.isArray(spouse.children)) return;
          childIds.push(spouseId);
        });
      }

      childIds.forEach(visit);
    };

    visit(focusId);
    return descendants;
  },

  _buildFocusedCollapsedNodes(db, focusId) {
    const people = (db && db.people) || {};
    if (!focusId || !people[focusId]) return [];

    const focusAncestors = new Set();
    let currentId = focusId;
    const seen = new Set();
    while (currentId && people[currentId] && !seen.has(currentId)) {
      focusAncestors.add(currentId);
      seen.add(currentId);
      currentId = this._getFatherId(currentId);
    }
    const focusDescendants = this._collectFocusedDescendantIds(people, focusId);
    const spouseIds = new Set();
    Object.values(people).forEach(person => {
      (Array.isArray(person && person.spouses) ? person.spouses : []).forEach(spouseId => {
        if (people[spouseId]) spouseIds.add(spouseId);
      });
    });

    const hasFocusedExpandableBranch = (id) => {
      const person = people[id];
      if (!person) return false;
      if (Array.isArray(person.children) && person.children.some(childId => people[childId])) return true;
      return !!(person.gender === 'female'
        && this.data.showMaternal
        && Array.isArray(person.spouses)
        && person.spouses.some(spouseId => {
          const spouse = people[spouseId];
          return spouse && Array.isArray(spouse.children) && spouse.children.some(childId => people[childId]);
        }));
    };

    return Object.keys(people).filter(id => {
      if (!hasFocusedExpandableBranch(id)) return false;
      if (spouseIds.has(id)) return false;
      if (focusAncestors.has(id)) return false;
      if (focusDescendants.has(id)) return false;
      return true;
    });
  },

  _scrollToTreeNode(id, options = {}) {
    const nodes = this.data.nodes || [];
    if (!nodes.length) return;

    let node = options.renderKey
      ? nodes.find(item => item.renderKey === options.renderKey)
      : (id ? nodes.find(item => item.id === id) : null);
    if (!node && options.fallbackFirst) {
      node = nodes.find(item => !item.isSpouse) || nodes[0];
    }
    if (!node) return;

    const viewportRpx = this._treeViewportWidthRpx();
    const nodeLeftRpx = (node.x || 0) + 40;
    const nodeCenterRpx = (node.x || 0) + 40 + Math.min(node.w || 80, 260) / 2;
    const horizontalAnchorNode = options.horizontalAnchorId
      ? nodes.find(item => item.id === options.horizontalAnchorId)
      : null;
    const horizontalNode = horizontalAnchorNode || node;
    const horizontalLeftRpx = (horizontalNode.x || 0) + 40;
    const horizontalCenterRpx = horizontalLeftRpx + Math.min(horizontalNode.w || 80, 260) / 2;
    const maxScrollRpx = Math.max(0, (this.data.maxR || 750) - viewportRpx);
    const rawTargetRpx = Number.isFinite(options.screenLeftRpx)
      ? horizontalLeftRpx - options.screenLeftRpx
      : horizontalCenterRpx - (Number.isFinite(options.screenCenterRpx) ? options.screenCenterRpx : viewportRpx / 2);
    const targetRpx = Math.max(0, Math.min(maxScrollRpx, rawTargetRpx));
    const targetPx = Math.round(this._rpxToPx(targetRpx));

    let targetTopPx = null;
    if (options.vertical) {
      const nodeTopRpx = (node.y || 0) + (this.data.treeTopGap || 0);
      const nodeCenterYRpx = nodeTopRpx + Math.min(node.h || 56, 80) / 2;
      const rawTargetTopRpx = Number.isFinite(options.screenCenterYRpx)
        ? nodeCenterYRpx - options.screenCenterYRpx
        : (Number.isFinite(options.screenTopRpx) ? nodeTopRpx - options.screenTopRpx : nodeTopRpx - 80);
      const bottomPadding = this.data.treeContentBottomPadding || TREE_STYLE.treeContentBottomPadding || 0;
      const maxScrollTopRpx = Math.max(0, ((this.data.maxH || 1000) + bottomPadding) - this._treeViewportHeightRpx());
      targetTopPx = Math.round(this._rpxToPx(Math.max(0, Math.min(maxScrollTopRpx, rawTargetTopRpx))));
    }

    this._setTreeScrollPosition(targetPx, targetTopPx);
  },

  _scheduleScrollToTreeNode(id, options = {}) {
    const run = () => this._scrollToTreeNode(id, options);
    if (typeof wx !== 'undefined' && wx.nextTick) {
      wx.nextTick(run);
    } else {
      setTimeout(run, 0);
    }
  },

  _getTreeNodeParentIds(id) {
    const people = (this.data.db && this.data.db.people) || {};
    const person = id ? people[id] : null;
    if (!person) return [];
    const parentIds = [];
    const fatherId = this._getFatherId(id);
    if (fatherId && people[fatherId]) parentIds.push(fatherId);
    if (person.motherId && people[person.motherId]) parentIds.push(person.motherId);
    return parentIds;
  },

  _getTreeJumpHorizontalAnchorId(id) {
    const people = (this.data.db && this.data.db.people) || {};
    const fatherId = this._getFatherId(id);
    if (fatherId && people[fatherId]) return fatherId;
    const parentIds = this._getTreeNodeParentIds(id);
    return parentIds[0] || id;
  },

  _rootSwitchScrollPatch() {
    this._scrollLeftPx = 0;
    this._scrollTopPx = 0;
    return {
      treeScrollLeft: 0,
      treeScrollTop: 0
    };
  },

  _setTreeScrollPosition(leftPx, topPx) {
    const finalPatch = {};
    const nudgePatch = {};

    if (Number.isFinite(leftPx)) {
      const left = Math.max(0, Math.round(leftPx));
      this._scrollLeftPx = left;
      finalPatch.treeScrollLeft = left;
      if (this.data.treeScrollLeft === left) nudgePatch.treeScrollLeft = left === 0 ? 1 : left - 1;
    }

    if (Number.isFinite(topPx)) {
      const top = Math.max(0, Math.round(topPx));
      this._scrollTopPx = top;
      finalPatch.treeScrollTop = top;
      if (this.data.treeScrollTop === top) nudgePatch.treeScrollTop = top === 0 ? 1 : top - 1;
    }

    const hasFinal = Object.keys(finalPatch).length > 0;
    if (!hasFinal) return;
    if (Object.keys(nudgePatch).length > 0) {
      this.setData(nudgePatch, () => this.setData(finalPatch));
      return;
    }
    this.setData(finalPatch);
  },

  // ─────────────────────────────────────────────
  // Node interaction
  // ─────────────────────────────────────────────

  // Helper function to compute display name from surname, firstname, and custom name
  _computeDisplayName(person) {
    const surname = (person.surname || '').trim();
    const firstname = (person.firstname || '').trim();
    const manualName = (person.name || '').trim();

    if (manualName) {
      // User has custom name, use it
      return manualName;
    } else if (surname && firstname) {
      return surname + firstname;
    } else if (surname) {
      return surname + '氏';
    } else {
      return '无名';
    }
  },

  _getPersonRootId(person) {
    if (!person) return '';
    return this._extractProgenitorId(person.id || '');
  },

  _resolvePersonKey(id, people = (this.data.db && this.data.db.people) || {}) {
    const targetId = String(id || '').trim();
    if (!targetId || !people) return '';
    if (people[targetId]) return targetId;
    const entry = Object.entries(people).find(([, person]) => (
      person && String(person.id || '').trim() === targetId
    ));
    return entry ? entry[0] : '';
  },

  _resolveRootKeyForPerson(id, people = (this.data.db && this.data.db.people) || {}) {
    const personKey = this._resolvePersonKey(id, people);
    if (!personKey || !people[personKey]) return '';

    const directRoot = this._extractProgenitorId(personKey);
    if (directRoot && people[directRoot]) return directRoot;

    const storedRoot = this._extractProgenitorId(people[personKey].id || '');
    const storedRootKey = this._resolvePersonKey(storedRoot, people);
    if (storedRootKey) return storedRootKey;

    let currentId = personKey;
    const seen = new Set();
    while (currentId && people[currentId] && !seen.has(currentId)) {
      if (this._isProgenitor(currentId)) return currentId;
      seen.add(currentId);
      const fatherId = this._getFatherId(currentId);
      currentId = this._resolvePersonKey(fatherId, people);
    }

    return this._isProgenitor(personKey) ? personKey : '';
  },

  _isOutsideCurrentProgenitor(person) {
    const currentRootId = this.data.db && this.data.db.activeRootId;
    const currentRootPrefix = this._extractProgenitorId(currentRootId || '');
    const personRootId = this._getPersonRootId(person);
    return !!(currentRootPrefix && personRootId && personRootId !== currentRootPrefix);
  },

  _withEditableNameParts(person) {
    const p = { ...person };
    if ((p.surname || '').trim() || (p.firstname || '').trim()) return p;

    const name = String(p.name || '').trim();
    if (!name) return p;
    if (name.endsWith('氏')) {
      p.surname = name.slice(0, -1);
      p.firstname = '';
      return p;
    }

    const compoundSurnames = ['欧阳', '歐陽', '司马', '司馬', '上官', '诸葛', '諸葛', '夏侯', '皇甫', '尉迟', '尉遲', '公孙', '公孫', '慕容', '司徒', '司空', '端木', '东方', '東方', '南宫', '南宮'];
    const compound = compoundSurnames.find(item => name.startsWith(item));
    if (compound && name.length > compound.length) {
      p.surname = compound;
      p.firstname = name.slice(compound.length);
    } else if (name.length > 1) {
      p.surname = name.slice(0, 1);
      p.firstname = name.slice(1);
    } else {
      p.surname = name;
      p.firstname = '';
    }
    return p;
  },

  _decorateProfilePerson(person) {
    if (!person) return null;
    const p = this._withEditableNameParts(person);
    p._displayName = this._computeDisplayName(p);
    p._displayYear = p.bYear || '';
    p._treeHidden = this._isTreeIdHidden(p.id);
    p._otherTree = this._isOutsideCurrentProgenitor(p);
    return p;
  },

  _isTreeIdHidden(id) {
    if (!id) return false;
    const dbHidden = this.data.db && Array.isArray(this.data.db.hiddenTreeIds) ? this.data.db.hiddenTreeIds : null;
    const hidden = dbHidden || this.data.hiddenTreeIds || [];
    return hidden.includes(id);
  },

  _profileRelationDisplayPatch(id = this.data.editingId) {
    const people = (this.data.db && this.data.db.people) || {};
    const p = id && people[id];
    if (!p) return {};
    const spouseObjects = (p.spouses || []).map(sid => people[sid] ? { ...people[sid], id: people[sid].id || sid } : null).filter(Boolean);
    return {
      _displaySpouses: spouseObjects.map(s => this._decorateProfilePerson(s)).filter(Boolean),
      _displayChildren: this._buildProfileChildren(id, p)
    };
  },

  _canToggleProfileRelationVisibility(id) {
    if (!id) return false;
    return (this.data.nodes || []).some(node => (
      node && node.id === id && !node.isSpouse && !node.isDuplicatePlaceholder
    ));
  },

  onRelationVisibilityToggle(e) {
    const detail = (e && e.detail) || {};
    const id = detail.id;
    if (!id || !this.data.canToggleRelationVisibility) return;
    const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    const hidden = Array.isArray(db.hiddenTreeIds) ? [...db.hiddenTreeIds] : [...(this.data.hiddenTreeIds || [])];
    const index = hidden.indexOf(id);
    if (index >= 0) hidden.splice(index, 1);
    else hidden.push(id);
    db.hiddenTreeIds = hidden.filter(hiddenId => db.people && db.people[hiddenId]);
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    this.setData({
      db,
      hiddenTreeIds: db.hiddenTreeIds
    }, () => {
      this.setData(this._profileRelationDisplayPatch(this.data.editingId), () => this.refreshTree());
    });
  },

  _sameProgenitorHometownHint(personId, db) {
    const people = (db && db.people) || {};
    const person = people[personId];
    if (!personId || !person) return '';

    const rootId = this._extractProgenitorId(personId);
    const seen = new Set([personId]);
    const candidates = [];
    const add = (id) => {
      if (!id || seen.has(id) || !people[id]) return;
      seen.add(id);
      if (this._extractProgenitorId(id) === rootId) candidates.push(id);
    };

    let currentId = personId;
    while (currentId) {
      const fatherId = this._getFatherId(currentId);
      if (!fatherId || !people[fatherId]) break;
      add(fatherId);
      currentId = fatherId;
    }

    const father = this._getFather(personId, db);
    if (father) {
      (father.children || []).forEach(add);
    }

    if (person.gender === 'male') {
      (person.children || []).forEach(add);
    }

    Object.keys(people).forEach(add);

    for (let id of candidates) {
      const hometown = String((people[id] && people[id].hometown) || '').trim();
      if (hometown) return hometown;
    }
    return '';
  },

  _buildPaternalRows(personId) {
    const rows = [];
    const father = this._getFather(personId, this.data.db);
    const grandfather = father ? this._getFather(father.id, this.data.db) : null;
    const greatGrandfather = grandfather ? this._getFather(grandfather.id, this.data.db) : null;

    if (greatGrandfather) rows.push({ label: '曾祖', level: 3, ...this._decorateProfilePerson(greatGrandfather) });
    if (grandfather) rows.push({ label: '祖', level: 2, ...this._decorateProfilePerson(grandfather) });
    if (father) rows.push({ label: '父', level: 1, ...this._decorateProfilePerson(father) });
    return rows;
  },

  _buildProfileChildren(personId, person) {
    const db = this.data.db || {};
    const people = db.people || {};
    const p = person || people[personId];
    const childIds = [];
    const addChild = (childId) => {
      if (!childId || !people[childId] || childIds.includes(childId)) return;
      childIds.push(childId);
    };

    if (p.gender === 'male') {
      (p.children || []).forEach(addChild);
    }

    if (p.gender === 'female') {
      Object.keys(people).forEach(childId => {
        const child = people[childId];
        if (child && child.motherId === personId) addChild(childId);
      });
    }

    return childIds
      .map(childId => {
        const child = this._decorateProfilePerson({ ...people[childId], id: people[childId].id || childId });
        return child && p.gender === 'female'
          ? { ...child, _disableReorder: true }
          : child;
      })
      .filter(Boolean);
  },

  onNodeTap(e) {
    const dataset = (e && e.currentTarget && e.currentTarget.dataset) || {};
    const id = e.id || dataset.id;
    const p = this.data.db.people[id];
    if (!p) return;

    const motherNode = this.data.db.people[p.motherId];
    let currentMotherName = '';
    if (motherNode) {
      const displayName = this._computeDisplayName(motherNode);
      currentMotherName = displayName;
    }

    const showJumpBtn = this._isOutsideCurrentProgenitor({ ...p, id: p.id || id });

    // Detect if we are creating a new profile (not viewing an existing one)
    // This is true when adding a new person (ancestor, child, father, spouse)
    // When viewing an existing person, this is false regardless of whether they have a name
    const creatingProfile = !p.id || p.id.startsWith('P_') || p.id.startsWith('S_') || p.id.startsWith('spouse_');

    

    // Get spouse objects
    const spouseObjects = (p.spouses || []).map(sid => this.data.db.people[sid] ? { ...this.data.db.people[sid], id: this.data.db.people[sid].id || sid } : null).filter(Boolean);
    const displayFather = (() => {
      const father = this._getFather(id, this.data.db);
      return father ? this._decorateProfilePerson(father) : null;
    })();

    // Any progenitor (ID is 12 chars ending with '-') can have a father added.
    // The father's relationship is deduced from ID at runtime (remove last char).
    const canAddFather = this._isProgenitor(id);

    const hometownHint = this._sameProgenitorHometownHint(id, this.data.db);

    this.setData({
      editingId: id,
      draftPerson: {},
      _editingPerson: this._decorateProfilePerson({ ...p, id: p.id || id }),
      _pendingEdits: {},
      _pendingMotherSelected: false,
      showDrawer: true,
      canAddChild: p.gender === 'male',
      canToggleRelationVisibility: this._canToggleProfileRelationVisibility(id),
      _displaySpouses: spouseObjects.map(s => this._decorateProfilePerson(s)).filter(Boolean),
      _displayChildren: this._buildProfileChildren(id, p),
      _displayFather: displayFather,
      _displayMother: motherNode ? this._decorateProfilePerson(motherNode) : null,
      _displayPaternalRows: this._buildPaternalRows(id),
      motherRange: this._buildMotherRange(id),
      currentMotherName,
      _personalEventSuggestions: this._buildPersonalEventSuggestions(this.data.db),
      showJumpBtn,
      canAddFather,
      creatingProfile,
      _hometownHint: hometownHint
    });
  },

  // ─────────────────────────────────────────────
  // Jump to his/her tree (from profile-editor) - to paternal ancestor
  // ─────────────────────────────────────────────
  onJumpToHisTree(e) {
    const rawId = e.detail?.id || e.currentTarget?.dataset?.id;
    const people = (this.data.db && this.data.db.people) || {};
    const id = this._resolvePersonKey(rawId, people);
    if (!id) {
      wx.showToast({ title: '无法跳转', icon: 'none' });
      return;
    }
    const targetPerson = people[id];
    if (!targetPerson) {
      wx.showToast({ title: '找不到该人物', icon: 'none' });
      return;
    }
    
    // Find the paternal ancestor from the ID prefix. The prefix is the single
    // source of truth for the male-line root.
    let progenitorId = this._resolveRootKeyForPerson(id, people);
    
    const progenitor = people[progenitorId];
    if (!progenitor) {
      wx.showToast({ title: '找不到始祖', icon: 'none' });
      return;
    }
    
    // Set the progenitor as the new root
    // Deep copy people to isolate this tree's data
    const newDb = {
      ...JSON.parse(JSON.stringify(this.data.db || {})),
      activeRootId: progenitorId,
      people: JSON.parse(JSON.stringify(this.data.db.people))
    };
    const collapsedNodes = this._buildFocusedCollapsedNodes(newDb, id);
    this._layoutCache = { standard: null, timeline: null };
    
    this.setData({
      db: newDb,
      collapsedNodes,
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      ...this._rootSwitchScrollPatch(),
      ...this._emptyProfileContext()
    }, () => {
      this.refreshTree(() => {
        this._scheduleScrollToTreeNode(id, {
          fallbackFirst: true,
          vertical: true,
          includeParents: true,
          horizontalAnchorId: this._getTreeJumpHorizontalAnchorId(id),
          screenLeftRpx: 96,
          screenCenterYRpx: this._treeViewportHeightRpx() / 2
        });
      });
      this._saveData(newDb);
      wx.showToast({ title: `查看 ${progenitor.name} 的家谱`, icon: 'none' });
    });
  },

  _buildMotherRange(id) {
    const people = this.data.db.people;
    const person = people[id];
    const range = [{ id: '', label: '未知' }];


    if (!person) return range;

    // Try to find possible mothers from the father/spouse relation plus
    // the person's existing motherId. Female-owned children are not lineage data.

    // Find father by deducing from person's ID (remove last char)
    let father = this._getFather(id, { people });

    // If father exists, add his female spouses as options
    if (father) {
      if (father.spouses && father.spouses.length > 0) {
        father.spouses.forEach(sid => {
          const s = people[sid];
          if (s && s.gender === 'female' && !range.find(r => r.id === sid)) {
            const displayName = this._computeDisplayName(s);
            const label = `${displayName} ${s.bYear || ''}`.trim();
            range.push({ id: sid, label: label });
          }
        });
      }
    }

    // If person already has a motherId and it's not in the list, add it
    if (person.motherId) {
      const mother = people[person.motherId];
      if (mother && mother.gender === 'female' && !range.find(r => r.id === person.motherId)) {
        const displayName = this._computeDisplayName(mother);
        const label = `${displayName} ${mother.bYear || ''}`.trim();
        range.push({ id: person.motherId, label: label });
      }
    }

    return range;
  },

  // ─────────────────────────────────────────────
  // Progenitor management
  // ─────────────────────────────────────────────

  _getBundledSampleDefinitions() {
    return Array.isArray(Samples.BUNDLED_SAMPLES) ? Samples.BUNDLED_SAMPLES : [];
  },

  _getBundledSampleByRootId(rootId) {
    return this._getBundledSampleDefinitions().find(sample => sample.rootId === rootId) || null;
  },

  _getBundledSampleByWorkspaceId(workspaceId) {
    return this._getBundledSampleDefinitions().find(sample => sample.workspaceId === workspaceId) || null;
  },

  _createBundledSampleWorkspace(sampleDef) {
    if (!sampleDef || typeof sampleDef.createWorkspace !== 'function') return null;
    return sampleDef.createWorkspace();
  },

  _isBundledSamplePerson(person, id, sampleDef) {
    return !!(
      person
      && sampleDef
      && (
        person.workspaceId === sampleDef.workspaceId
        || id === sampleDef.rootId
      )
    );
  },

  _isTangSamplePerson(person, id) {
    return this._isBundledSamplePerson(person, id, this._getBundledSampleByWorkspaceId(Samples.TANG_IMPERIAL_WORKSPACE_ID));
  },

  _getBundledSampleStoredVersion(db, sampleDef) {
    if (!db || !sampleDef || !db.bundledSampleVersions) return '';
    return String(db.bundledSampleVersions[sampleDef.workspaceId] || '').trim();
  },

  _markBundledSampleVersion(db, sampleDef) {
    if (!db || !sampleDef || !sampleDef.workspaceId || !sampleDef.version) return;
    db.bundledSampleVersions = {
      ...(db.bundledSampleVersions || {}),
      [sampleDef.workspaceId]: String(sampleDef.version)
    };
  },

  _clearBundledSampleVersion(db, workspaceId) {
    if (!db || !db.bundledSampleVersions || !workspaceId) return;
    delete db.bundledSampleVersions[workspaceId];
    if (Object.keys(db.bundledSampleVersions).length === 0) {
      delete db.bundledSampleVersions;
    }
  },

  _isBundledSampleCurrent(db, sampleDef, sample = this._createBundledSampleWorkspace(sampleDef)) {
    const people = (db && db.people) || {};
    const samplePeople = (sample && sample.people) || {};
    const sampleIds = Object.keys(samplePeople);
    const actualIds = Object.keys(people).filter(id => this._isBundledSamplePerson(people[id], id, sampleDef));
    if (actualIds.length === 0) return true;

    const storedVersion = this._getBundledSampleStoredVersion(db, sampleDef);
    if (storedVersion && sampleDef && storedVersion === String(sampleDef.version || '').trim()) {
      return true;
    }

    if (actualIds.length !== sampleIds.length) return false;

    const countEvents = (sourcePeople, eventName) => Object.values(sourcePeople)
      .reduce((count, person) => count + ((person.events || []).filter(event => event && event.name === eventName).length), 0);
    const actualPeople = {};
    actualIds.forEach(id => { actualPeople[id] = people[id]; });
    if (countEvents(actualPeople, '太子') !== countEvents(samplePeople, '太子')) {
      return false;
    }
    if (countEvents(actualPeople, '皇后') !== countEvents(samplePeople, '皇后')) {
      return false;
    }

    const rankSignature = (sourcePeople, ids) => ids
      .map(id => `${id}:${((sourcePeople[id] || {}).rank) || ''}`)
      .sort()
      .join('|');
    if (rankSignature(actualPeople, sampleIds) !== rankSignature(samplePeople, sampleIds)) {
      return false;
    }

    const personSignature = (sourcePeople, ids) => ids
      .map(id => {
        const person = sourcePeople[id] || {};
        const eventSignature = (person.events || [])
          .map(event => [
            event && event.id || '',
            event && event.name || '',
            event && event.year || '',
            event && event.hidden ? 'hidden' : ''
          ].join(','))
          .sort()
          .join(';');
        return [
          id,
          person.name || '',
          person.surname || '',
          person.firstname || '',
          person.rank || '',
          person.bYear || '',
          person.dYear || '',
          person.motherId || '',
          (person.children || []).join(','),
          (person.spouses || []).join(','),
          eventSignature
        ].join(':');
      })
      .sort()
      .join('|');
    if (personSignature(actualPeople, sampleIds) !== personSignature(samplePeople, sampleIds)) {
      return false;
    }

    const names = events => (events || [])
      .filter(event => event && this._getTimelineEventWorkspaceId(event, db) === sampleDef.workspaceId)
      .map(event => event.name)
      .sort()
      .join('|');
    return names(db.timelineEvents) === names(sample.timelineEvents);
  },

  _isTangSampleCurrent(db, sample = Samples.createTangImperialWorkspace()) {
    return this._isBundledSampleCurrent(db, this._getBundledSampleByWorkspaceId(Samples.TANG_IMPERIAL_WORKSPACE_ID), sample);
  },

  _replaceBundledSampleWorkspace(db, sampleDef, sample = this._createBundledSampleWorkspace(sampleDef), options = {}) {
    if (!db || typeof db !== 'object') db = { activeRootId: null, people: {} };
    if (!db.people) db.people = {};
    if (!Array.isArray(db.timelineEvents)) db.timelineEvents = [];
    const previousActiveRootId = db.activeRootId;

    Object.keys(db.people).forEach(id => {
      if (this._isBundledSamplePerson(db.people[id], id, sampleDef)) delete db.people[id];
    });
    db.people = {
      ...db.people,
      ...(sample.people || {})
    };
    db.timelineEvents = (db.timelineEvents || [])
      .filter(event => this._getTimelineEventWorkspaceId(event, db) !== sampleDef.workspaceId);
    db.timelineEvents.push(...((sample.timelineEvents || []).map(event => ({ ...event }))));
    this._markBundledSampleVersion(db, sampleDef);
    if (options.makeActive || !previousActiveRootId || !db.people[previousActiveRootId]) {
      db.activeRootId = sample.activeRootId || sampleDef.rootId;
    } else {
      db.activeRootId = previousActiveRootId;
    }
    return db;
  },

  _replaceTangSampleWorkspace(db, sample = Samples.createTangImperialWorkspace(), options = {}) {
    return this._replaceBundledSampleWorkspace(
      db,
      this._getBundledSampleByWorkspaceId(Samples.TANG_IMPERIAL_WORKSPACE_ID),
      sample,
      options
    );
  },

  _refreshBundledSamples(db) {
    this._getBundledSampleDefinitions().forEach(sampleDef => {
      const sample = this._createBundledSampleWorkspace(sampleDef);
      const hasSample = Object.entries((db && db.people) || {})
        .some(([id, person]) => this._isBundledSamplePerson(person, id, sampleDef));
      if (hasSample && !this._isBundledSampleCurrent(db, sampleDef, sample)) {
        db = this._replaceBundledSampleWorkspace(db, sampleDef, sample);
      }
    });
    return db;
  },

  _addBundledSampleWorkspaces(workspaceArray, workspaceObj) {
    this._getBundledSampleDefinitions().forEach(sampleDef => {
      if (workspaceObj && workspaceObj[sampleDef.workspaceId]) return;
      const sample = this._createBundledSampleWorkspace(sampleDef);
      const root = sample && sample.people && sample.people[sample.activeRootId];
      if (!root) return;
      const stats = this._calculateProgenitorStats(sample.activeRootId, sample.people);
      workspaceArray.push({
        id: sampleDef.workspaceId,
        isBundledSample: true,
        hasLocalCopy: false,
        canDelete: false,
        label: sampleDef.label,
        personCount: Object.keys(sample.people || {}).length,
        progenitors: [{
          id: sample.activeRootId,
          name: Logic.getTreeDisplayName({ ...root, id: sample.activeRootId }, true),
          bYear: root.bYear,
          maleDescendants: stats.maleDescendants,
          femaleDescendants: stats.femaleDescendants,
          marriageCount: stats.marriageCount,
          totalDescendants: stats.totalDescendants,
          _isBundledSample: true
        }]
      });
    });
    return workspaceArray;
  },

  // Get all progenitors grouped by workspace
  _getProgenitorsByWorkspace() {
    const db = this.data.db || { activeRootId: null, people: {} };
    const people = db.people || {};
    const workspaces = {}; // workspaceId -> {id, progenitors[]}

    const ensureWorkspace = (workspaceId) => {
      if (!workspaceId) return null;
      if (!workspaces[workspaceId]) {
        workspaces[workspaceId] = {
          id: workspaceId,
          label: '',
          isBundledSample: !!this._getBundledSampleByWorkspaceId(workspaceId),
          hasLocalCopy: true,
          canDelete: true,
          personCount: 0,
          progenitors: []
        };
      }
      return workspaces[workspaceId];
    };

    Object.keys(people).forEach(id => {
      const person = people[id];
      const workspaceId = this._personWorkspaceId(person, id, db);
      const workspace = ensureWorkspace(workspaceId);
      if (!workspace) return;
      workspace.personCount += 1;
      if (id === db.activeRootId) workspace.isCurrent = true;
    });

    // Build a set of IDs that appear in someone else's spouses array (pure spouse nodes)
    const spouseOfSet = new Set();
    Object.values(people).forEach(p => {
      (p.spouses || []).forEach(sid => spouseOfSet.add(sid));
    });

    Object.keys(people).forEach(id => {
      const person = people[id];
      // A progenitor is a person whose ID is a root (no father deducible from ID)
      if (this._isProgenitor(id)) {
        const stats = this._calculateProgenitorStats(id, people);

        // Show progenitor if:
        // 1. They have at least one descendant (real progenitor with family), OR
        // 2. They have at least one child (even if those children are pure spouse nodes)
        const hasChildren = (person.children || []).length > 0;
        const isPureSpouseNode = spouseOfSet.has(id) && !hasChildren;

        if (stats.totalDescendants > 0 || !isPureSpouseNode) {
          // Defensive: skip entries without valid id
          if (!id) {
            return;
          }

          const workspaceId = this._personWorkspaceId(person, id, db);

          if (!workspaceId) {
            return;
          }

          const workspace = ensureWorkspace(workspaceId);
          if (!workspace) return;

          workspace.progenitors.push({
            id: id,
            name: Logic.getTreeDisplayName({ ...person, id }, true),
            bYear: person.bYear,
            maleDescendants: stats.maleDescendants,
            femaleDescendants: stats.femaleDescendants,
            marriageCount: stats.marriageCount,
            totalDescendants: stats.totalDescendants
          });
        }
      }
    });

    // Sort progenitors within each workspace
    Object.keys(workspaces).forEach(workspaceId => {
      const workspace = workspaces[workspaceId];
      workspace.progenitors.sort((a, b) => {
        const totalA = a.totalDescendants || 0;
        const totalB = b.totalDescendants || 0;
        if (totalA !== totalB) return totalB - totalA;
        if (a.bYear && b.bYear && a.bYear !== b.bYear) return a.bYear - b.bYear;
        if (a.name && b.name) return a.name.localeCompare(b.name);
        return 0;
      });
      const primary = workspace.progenitors[0];
      const bundledSample = this._getBundledSampleByWorkspaceId(workspaceId);
      workspace.label = bundledSample
        ? bundledSample.label
        : ((primary && primary.name) || '未命名家谱');
    });

    return workspaces;
  },

  // Calculate statistics for a progenitor
  _calculateProgenitorStats(progenitorId, people) {
    const progenitor = people[progenitorId];
    if (!progenitor) return { maleDescendants: 0, femaleDescendants: 0, marriageCount: 0, totalDescendants: 0 };
    
    // Get progenitor's 9-digit ID (without suffix)
    const progenitorPrefix = this._extractProgenitorId(progenitorId);
    
    let maleDescendants = 0;
    let femaleDescendants = 0;
    let marriageCount = 0;
    let totalDescendants = 0;
    
    // Track processed nodes to avoid double counting in marriage statistics
    const processedMarriages = new Set();
    
    // Count all people with the same progenitor prefix
    Object.keys(people).forEach(id => {
      const person = people[id];
      if (!person) return;
      
      // Extract progenitor ID from person's ID
      const personProgenitorId = this._extractProgenitorId(id);
      
      // Check if this person belongs to the same progenitor tree
      if (personProgenitorId === progenitorPrefix) {
        // Count descendant (including the progenitor itself)
        if (person.gender === 'male') {
          maleDescendants++;
        } else if (person.gender === 'female') {
          femaleDescendants++;
        }
        
        // Count marriages/spouses within this tree
        if (person.spouses && person.spouses.length > 0) {
          person.spouses.forEach(spouseId => {
            const spouse = people[spouseId];
            if (!spouse) return;
            
            // Check if spouse is also in the same tree
            const spouseProgenitorId = this._extractProgenitorId(spouseId);
            if (spouseProgenitorId !== progenitorPrefix) {
              // This is a marriage with someone from outside this tree
              // Create unique marriage key (sorted IDs to avoid double counting)
              const key = [id, spouseId].sort().join('-');
              if (!processedMarriages.has(key)) {
                marriageCount++;
                processedMarriages.add(key);
              }
            }
          });
        }
      }
    });
    
    // Include the progenitor itself in male count, exclude from female count
    // Since progenitors are only male, we keep the male count as-is (including progenitor)
    // and only subtract 1 from female count if the progenitor was female (which shouldn't happen)
    const progenitorPerson = people[progenitorId];
    const progenitorGender = progenitorPerson ? (progenitorPerson.gender || 'male') : 'male';
    const adjMale = maleDescendants; // Keep progenitor in male count
    const adjFemale = progenitorGender === 'female' ? Math.max(femaleDescendants - 1, 0) : femaleDescendants;
    totalDescendants = adjMale + adjFemale;

    return {
      maleDescendants: adjMale,
      femaleDescendants: adjFemale,
      marriageCount,
      totalDescendants: totalDescendants
    };
  },

  // ─────────────────────────────────────────────
  // Progenitor Dropdown Menu
  // ─────────────────────────────────────────────

  // Toggle progenitor dropdown menu
  toggleProgenitorDropdown() {
    if (this.data.showProgenitorDropdown) {
      this.closeProgenitorDropdown();
    } else {
      this.openProgenitorDropdown();
    }
  },

  // Open progenitor dropdown menu
  openProgenitorDropdown() {
    try {
      // Get all progenitors grouped by workspace (each progenitor = one workspace)
      const workspaceObj = this._getProgenitorsByWorkspace();

      // Convert object to array for reliable wx:for iteration
      let workspaceArray = Object.keys(workspaceObj).map(wsId => workspaceObj[wsId]);
      workspaceArray = this._addBundledSampleWorkspaces(workspaceArray, workspaceObj);

      // Sort: current workspace first
      const currentWsId = this._getCurrentWorkspaceId();
      if (currentWsId) {
        workspaceArray.sort((a, b) => {
          if (a.id === currentWsId) return -1;
          if (b.id === currentWsId) return 1;
          return 0;
        });
      }


    // Add isLast flag to each progenitor for template styling
    workspaceArray.forEach(ws => {
      const count = ws.progenitors.length;
      ws.deleteOpen = !!(ws.canDelete && ws.id === this.data.workspaceDeleteOpenId);
      ws.progenitors.forEach((p, idx) => {
        p._isLast = (idx === count - 1);
      });
    });

    this.setData({
        showProgenitorDropdown: true,
        progenitorWorkspaces: workspaceArray
      });
    } catch (e) {
      console.error('[openProgenitorDropdown] error:', e);
    }
  },

  // Close progenitor dropdown menu
  closeProgenitorDropdown() {
    this.setData({ showProgenitorDropdown: false, workspaceDeleteOpenId: '' });
  },

  _setWorkspaceDeleteOpenId(workspaceId) {
    const openId = String(workspaceId || '').trim();
    const canOpen = !!(openId && (this.data.progenitorWorkspaces || []).some(workspace => (
      workspace.canDelete && workspace.id === openId
    )));
    const nextOpenId = canOpen ? openId : '';
    const progenitorWorkspaces = (this.data.progenitorWorkspaces || []).map(workspace => ({
      ...workspace,
      deleteOpen: !!(nextOpenId && workspace.canDelete && workspace.id === nextOpenId)
    }));
    this.setData({
      workspaceDeleteOpenId: nextOpenId,
      progenitorWorkspaces
    });
  },

  _touchPoint(e) {
    const touch = (e && e.changedTouches && e.changedTouches[0])
      || (e && e.touches && e.touches[0])
      || {};
    return {
      x: Number(touch.clientX || 0),
      y: Number(touch.clientY || 0)
    };
  },

  onWorkspaceTouchStart(e) {
    const workspaceId = String((e.currentTarget.dataset && e.currentTarget.dataset.workspaceId) || '').trim();
    const workspace = (this.data.progenitorWorkspaces || []).find(item => item.id === workspaceId);
    if (!workspace || !workspace.canDelete) {
      this._workspaceSwipe = null;
      return;
    }
    const point = this._touchPoint(e);
    this._workspaceSwipe = {
      workspaceId,
      startX: point.x,
      startY: point.y,
      didSwipe: false
    };
  },

  onWorkspaceTouchMove(e) {
    const swipe = this._workspaceSwipe;
    if (!swipe) return;
    const point = this._touchPoint(e);
    const dx = point.x - swipe.startX;
    const dy = point.y - swipe.startY;
    if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swipe.didSwipe = true;
    }
  },

  onWorkspaceTouchEnd(e) {
    const swipe = this._workspaceSwipe;
    if (!swipe) return;
    const point = this._touchPoint(e);
    const dx = point.x - swipe.startX;
    const dy = point.y - swipe.startY;
    this._workspaceSwipe = null;
    if (Math.abs(dx) <= 40 || Math.abs(dx) <= Math.abs(dy)) return;

    this._suppressProgenitorTap = true;
    setTimeout(() => { this._suppressProgenitorTap = false; }, 250);
    if (dx < 0) {
      this._setWorkspaceDeleteOpenId(swipe.workspaceId);
    } else if (this.data.workspaceDeleteOpenId === swipe.workspaceId) {
      this._setWorkspaceDeleteOpenId('');
    }
  },

  onWorkspaceDeleteRailTap(e) {
    const workspaceId = String((e.currentTarget.dataset && e.currentTarget.dataset.workspaceId) || '').trim();
    if (!workspaceId) return;
    this._suppressProgenitorTap = true;
    setTimeout(() => { this._suppressProgenitorTap = false; }, 250);
    this._setWorkspaceDeleteOpenId(workspaceId);
  },

  // Sentinel: stops tap event from bubbling through dropdown-content to overlay
  catchTap() {},

  _buildAiPromptScopeLine(subject, useTraditional) {
    const text = String(subject || '').trim();
    const isFamily = /(家族|皇族|宗室|王室|世家|氏族|一族|家谱|家譜|family|clan|house)/i.test(text);
    const hasListSeparator = /[、,，;；/／&+＋]/.test(text);
    const hasWhitespaceSeparator = /\S+\s+\S+/.test(text);
    const hasConjunction = /^.+(?:和|与|與|及|以及|and).+$/i.test(text);
    const isMultipleNames = !isFamily && (hasWhitespaceSeparator || hasListSeparator || hasConjunction);

    if (useTraditional) {
      if (isMultipleNames) {
        return '2. 整理範圍：輸入包含多個姓名（通常以空格分隔），請優先尋找他們之間的血緣或婚姻連接；圍繞這些連接補足必要親屬，不確定的連接直接省略。';
      }
      if (isFamily) {
        return '2. 整理範圍：輸入是家族，請在可靠來源支持下盡可能多地收集後代，重點寫血緣主線和重要婚姻連接；資料不足的旁支可省略。';
      }
      return '2. 整理範圍：輸入是單一人物，請包括其核心近親（父母、配偶、兄弟姊妹、子女），上溯三代、下延兩代，並盡量包括其生前見到或生卒年重疊、很可能見到的親屬。';
    }

    if (isMultipleNames) {
      return '2. 整理范围：输入包含多个姓名（通常以空格分隔），请优先寻找他们之间的血缘或婚姻连接；围绕这些连接补足必要亲属，不确定的连接直接省略。';
    }
    if (isFamily) {
      return '2. 整理范围：输入是家族，请在可靠来源支持下尽可能多地收集后代，重点写血缘主线和重要婚姻连接；资料不足的旁支可省略。';
    }
    return '2. 整理范围：输入是单一人物，请包括其核心近亲（父母、配偶、兄弟姐妹、子女），上溯三代、下延两代，并尽量包括其生前见到或生卒年重叠、很可能见到的亲属。';
  },

  _buildAiPrompt(target) {
    const useTraditional = !!(this.data && this.data.aiUseTraditionalChinese);
    const subject = String(target || '').trim()
      || (useTraditional ? '你感興趣的名門家族或歷史人物家族' : '你感兴趣的名门家族或历史人物家族');
    const scopeLine = this._buildAiPromptScopeLine(subject, useTraditional);
    const example = useTraditional ? {
      schema: 'jiapu-family-tree',
      version: 2,
      familyName: '宋氏家族（宋嘉樹一支）',
      root: {
        name: '宋嘉樹（耀如）',
        alias: '耀如',
        gender: 'male',
        hometown: '海南文昌',
        bYear: '1864',
        dYear: '1918',
        events: [
          { name: '赴美求學', year: '1878' },
          { name: '支持孫中山革命', year: '1894-1918' }
        ],
        spouses: [
          {
            name: '倪桂珍',
            alias: '珪貞',
            gender: 'female',
            bYear: '1869',
            dYear: '1931'
          }
        ],
        children: [
          {
            name: '宋靄齡',
            gender: 'female',
            bYear: '1889',
            dYear: '1973',
            events: [{ name: '婚嫁', year: '1914' }],
            spouses: [{ name: '孔祥熙', gender: 'male', bYear: '1880', dYear: '1967' }]
          },
          {
            name: '宋慶齡',
            gender: 'female',
            bYear: '1893',
            dYear: '1981',
            events: [
              { name: '婚嫁', year: '1915' },
              { name: '中華人民共和國名譽主席', year: '1981' }
            ],
            spouses: [{ name: '孫中山', alias: '逸仙', gender: 'male', bYear: '1866', dYear: '1925' }]
          },
          {
            name: '宋子文',
            gender: 'male',
            bYear: '1894',
            dYear: '1971',
            events: [{ name: '財政部長、外交部長', year: '1928-1945' }]
          },
          {
            name: '宋美齡',
            gender: 'female',
            bYear: '1898',
            dYear: '2003',
            events: [{ name: '婚嫁', year: '1927' }],
            spouses: [{ name: '蔣介石', gender: 'male', bYear: '1887', dYear: '1975' }]
          },
          {
            name: '宋子良',
            gender: 'male',
            bYear: '1899',
            dYear: '1987'
          },
          {
            name: '宋子安',
            gender: 'male',
            bYear: '1906',
            dYear: '1969'
          }
        ]
      }
    } : {
      schema: 'jiapu-family-tree',
      version: 2,
      familyName: '宋氏家族（宋嘉树一支）',
      root: {
        name: '宋嘉树（耀如）',
        alias: '耀如',
        gender: 'male',
        hometown: '海南文昌',
        bYear: '1864',
        dYear: '1918',
        events: [
          { name: '赴美求学', year: '1878' },
          { name: '支持孙中山革命', year: '1894-1918' }
        ],
        spouses: [
          {
            name: '倪桂珍',
            alias: '珪贞',
            gender: 'female',
            bYear: '1869',
            dYear: '1931'
          }
        ],
        children: [
          {
            name: '宋霭龄',
            gender: 'female',
            bYear: '1889',
            dYear: '1973',
            events: [{ name: '婚嫁', year: '1914' }],
            spouses: [{ name: '孔祥熙', gender: 'male', bYear: '1880', dYear: '1967' }]
          },
          {
            name: '宋庆龄',
            gender: 'female',
            bYear: '1893',
            dYear: '1981',
            events: [
              { name: '婚嫁', year: '1915' },
              { name: '中华人民共和国名誉主席', year: '1981' }
            ],
            spouses: [{ name: '孙中山', alias: '逸仙', gender: 'male', bYear: '1866', dYear: '1925' }]
          },
          {
            name: '宋子文',
            gender: 'male',
            bYear: '1894',
            dYear: '1971',
            events: [{ name: '财政部长、外交部长', year: '1928-1945' }]
          },
          {
            name: '宋美龄',
            gender: 'female',
            bYear: '1898',
            dYear: '2003',
            events: [{ name: '婚嫁', year: '1927' }],
            spouses: [{ name: '蒋介石', gender: 'male', bYear: '1887', dYear: '1975' }]
          },
          {
            name: '宋子良',
            gender: 'male',
            bYear: '1899',
            dYear: '1987'
          },
          {
            name: '宋子安',
            gender: 'male',
            bYear: '1906',
            dYear: '1969'
          }
        ]
      }
    };

    const lines = useTraditional ? [
      `請為「${subject}」整理一個可匯入家譜小程式的名人家譜 JSON。`,
      '請只輸出一個 JSON 物件，不要 Markdown 程式碼區塊，不要解釋文字。',
      '',
      '要求：',
      '1. 使用公開資料中較可靠的人物關係；不確定的年份、地點、配偶或子女直接省略，不要硬編。',
      scopeLine,
      '3. 中文內容請使用繁體中文：人名、地名、事件名、爵位、官職等都用繁體；JSON 欄位名保持英文。',
      '4. 使用稀疏 JSON：空字串、null、空 children、空 spouses、空 events 都可以省略。',
      '5. 優先使用頂層 schema、version、familyName、root。root 是巢狀人物物件；children 和 spouses 是人物物件陣列。',
      '6. 不要生成 id、activeRootId、people、workspaceId、paternalRootId 或 progenitorId。小程式匯入時會自動生成完整 people、人物 ID、始祖 ID、workspaceId、空陣列和事件 ID。',
      '7. 每個人儘量給 name 和 gender；gender 只用 male、female、unknown。',
      '8. 可用人物欄位：name、surname、firstname、alias、rank、gender、hometown、bYear、bDate、bPlace、dYear、dDate、dPlace、age、isLiving、children、spouses、events。',
      '9. hometown 必填時按傳統「籍貫」寫法，不用現代籍貫改寫；採用史傳開頭常見的形式，如「某某，某地人」中的地名。若可靠資料有完整歷史籍貫，請在 JSON 中寫完整形式，例如郡+縣、府+縣、省+縣、州、郡、旗等；小程式樹圖會在需要時自動顯示匹配到的郡望/郡名。',
      '10. 唐代處於過渡期：正史列傳常用當時郡縣里貫，但墓誌銘和家族身份常重郡望；唐人 hometown 請優先嘗試提供帶郡望/郡名的完整歷史籍貫（如郡+縣）。若只能可靠確定郡望，就只寫郡望；若郡望不可靠，再用史傳最常見里貫。',
      '11. 明清人物 hometown 請盡量包含省級來源；明代若史料只見府+縣，請在可靠時補入十八行省或兩直隸（如南直隸、北直隸/順天、浙江、江西等）再寫府縣；清代按當時省、府、縣或旗籍寫。',
      '12. 清代旗人若史料以滿洲姓氏或滿文/滿洲名字標識，hometown 可用作其滿洲姓氏或滿洲名；漢軍旗人若本名是漢姓、沒有可填的滿洲姓氏，hometown 只寫「漢軍」。',
      '13. events 寫代表性個人事件，不要堆太多：多數人物 1-3 條，極特殊人物才更多。',
      '14. 常用事件名建議：科舉用「進士」「舉人」；官職用「大學士」或具體宰相職銜；女性婚年可寫「婚嫁」；帝王家族可寫「皇帝」「太子」「皇后」，或最高身份如「貴妃」；爵位用「肅親王」「秦王」或「公/侯/伯/子/男」等實際封爵。',
      '15. events 格式為 [{"name":"皇帝","year":"626-649"}]；year 可以是 "626"、"626-649" 或 "684, 705-710"；不要寫 years、startYear、endYear 或 date。',
      '16. 多配偶家庭中，如果某個子女的母親明確，可在該子女上寫 motherName；不要寫 motherId。',
      '17. 控制規模：選 3-12 位有代表性人物；配偶只寫有助於理解關係的人，避免把資料不足的旁支鋪得過滿。',
      '',
      '示例（真實名人家譜片段，空欄位已省略）：'
    ] : [
      `请为“${subject}”整理一个可导入家谱小程序的名人家谱 JSON。`,
      '请只输出一个 JSON 对象，不要 Markdown 代码块，不要解释文字。',
      '',
      '要求：',
      '1. 使用公开资料中较可靠的人物关系；不确定的年份、地点、配偶或子女直接省略，不要硬编。',
      scopeLine,
      '3. 中文内容请使用简体中文：人名、地名、事件名、爵位、官职等都用简体；JSON 字段名保持英文。',
      '4. 使用稀疏 JSON：空字符串、null、空 children、空 spouses、空 events 都可以省略。',
      '5. 优先使用顶层 schema、version、familyName、root。root 是嵌套人物对象；children 和 spouses 是人物对象数组。',
      '6. 不要生成 id、activeRootId、people、workspaceId、paternalRootId 或 progenitorId。小程序导入时会自动生成完整 people、人物 ID、始祖 ID、workspaceId、空数组和事件 ID。',
      '7. 每个人尽量给 name 和 gender；gender 只用 male、female、unknown。',
      '8. 可用人物字段：name、surname、firstname、alias、rank、gender、hometown、bYear、bDate、bPlace、dYear、dDate、dPlace、age、isLiving、children、spouses、events。',
      '9. hometown 必填时按传统“籍贯”写法，不用现代籍贯改写；采用史传开头常见的形式，如“某某，某地人”中的地名。若可靠资料有完整历史籍贯，请在 JSON 中写完整形式，例如郡+县、府+县、省+县、州、郡、旗等；小程序树图会在需要时自动显示匹配到的郡望/郡名。',
      '10. 唐代处于过渡期：正史列传常用当时郡县里贯，但墓志铭和家族身份常重郡望；唐人 hometown 请优先尝试提供带郡望/郡名的完整历史籍贯（如郡+县）。若只能可靠确定郡望，就只写郡望；若郡望不可靠，再用史传最常见里贯。',
      '11. 明清人物 hometown 请尽量包含省级来源；明代若史料只见府+县，请在可靠时补入十八行省或两直隶（如南直隶、北直隶/顺天、浙江、江西等）再写府县；清代按当时省、府、县或旗籍写。',
      '12. 清代旗人若史料以满洲姓氏或满文/满洲名字标识，hometown 可用作其满洲姓氏或满洲名；汉军旗人若本名是汉姓、没有可填的满洲姓氏，hometown 只写“汉军”。',
      '13. events 写代表性个人事件，不要堆太多：多数人物 1-3 条，极特殊人物才更多。',
      '14. 常用事件名建议：科举用“进士”“举人”；官职用“大学士”或具体宰相职衔；女性婚年可写“婚嫁”；帝王家族可写“皇帝”“太子”“皇后”，或最高身份如“贵妃”；爵位用“肃亲王”“秦王”或“公/侯/伯/子/男”等实际封爵。',
      '15. events 格式为 [{"name":"皇帝","year":"626-649"}]；year 可以是 "626"、"626-649" 或 "684, 705-710"；不要写 years、startYear、endYear 或 date。',
      '16. 多配偶家庭中，如果某个子女的母亲明确，可在该子女上写 motherName；不要写 motherId。',
      '17. 控制规模：选 3-12 位有代表性人物；配偶只写有助于理解关系的人，避免把资料不足的旁支铺得过满。',
      '',
      '示例（真实名人家谱片段，空字段已省略）：'
    ];

    return [
      ...lines,
      JSON.stringify(example, null, 2)
    ].join('\n');
  },

  openAiImportPanel() {
    const aiPromptTarget = this.data.aiPromptTarget || '';
    this.setData({
      showProgenitorDropdown: false,
      showAiImportPanel: true,
      aiPromptText: this._buildAiPrompt(aiPromptTarget),
      aiJsonText: ''
    });
  },

  closeAiImportPanel() {
    this.setData({ showAiImportPanel: false });
  },

  onAiPromptTargetInput(e) {
    const aiPromptTarget = String((e.detail && e.detail.value) || '');
    this.setData({
      aiPromptTarget,
      aiPromptText: this._buildAiPrompt(aiPromptTarget)
    });
  },

  onAiPromptTextInput(e) {
    this.setData({ aiPromptText: String((e.detail && e.detail.value) || '') });
  },

  onAiChineseVariantTap(e) {
    const variant = String((e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.variant) || '');
    const aiUseTraditionalChinese = variant === 'traditional';
    if (aiUseTraditionalChinese === this.data.aiUseTraditionalChinese) return;
    this.setData({ aiUseTraditionalChinese }, () => {
      this.setData({
        aiPromptText: this._buildAiPrompt(this.data.aiPromptTarget)
      });
    });
  },

  onAiJsonTextInput(e) {
    this.setData({ aiJsonText: String((e.detail && e.detail.value) || '') });
  },

  copyAiPrompt() {
    const data = this.data.aiPromptText || this._buildAiPrompt(this.data.aiPromptTarget);
    wx.setClipboardData({
      data,
      success: () => wx.showToast({ title: '提示词已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    });
  },

  pasteAiJsonFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        this.setData({ aiJsonText: String((res && res.data) || '') });
        wx.showToast({ title: '已粘贴', icon: 'success' });
      },
      fail: () => wx.showToast({ title: '无法读取剪贴板', icon: 'none' })
    });
  },

  _extractJsonFromText(text) {
    const raw = String(text || '').replace(/^\uFEFF/, '').trim();
    if (!raw) return '';
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) return fenced[1].trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return raw.slice(start, end + 1);
    return raw;
  },

  onImportAiJson() {
    const text = this._extractJsonFromText(this.data.aiJsonText);
    if (!text) {
      wx.showToast({ title: '请先粘贴 JSON', icon: 'none' });
      return;
    }
    try {
      const importedDb = Data.normalizeImportData(JSON.parse(text));
      this.setData({ showAiImportPanel: false }, () => {
        this._showImportModeSheet(importedDb);
      });
    } catch (err) {
      console.error('[ai import] failed:', err);
      wx.showModal({
        title: 'JSON 无法导入',
        content: err && err.message ? err.message : '请确认粘贴的是完整 JSON。',
        showCancel: false
      });
    }
  },

  // Select a progenitor from dropdown menu
  onSelectProgenitor(e) {
    if (this._suppressProgenitorTap) return;
    if (this.data.workspaceDeleteOpenId) {
      this._setWorkspaceDeleteOpenId('');
      return;
    }
    let id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    // Defensive: if id is empty/undefined, try to get it from progenitorList using index
    if (!id && index !== undefined) {
      const item = this.data.progenitorList[index];
      if (item && item.id) {
        id = item.id;
      }
    }
    
    // Defensive: if id is still empty/undefined, don't proceed
    if (!id) {
      return;
    }

    const bundledSample = this._getBundledSampleByRootId(id);
    if (bundledSample && !(this.data.db.people || {})[id]) {
      this.onAddBundledSampleWorkspace(bundledSample);
      return;
    }
    
    // Look up by the db key (which may differ from person.id in legacy data)
    const people = this.data.db.people || {};
    const actualKey = this._resolvePersonKey(id, people);
    const person = actualKey ? people[actualKey] : null;
    
    if (!person) {
      wx.showToast({ title: '找不到该人物', icon: 'none' });
      return;
    }

    // Update to new progenitor view
    const rootKey = this._resolveRootKeyForPerson(actualKey, people) || actualKey;
    if (!rootKey || !people[rootKey]) {
      wx.showToast({ title: '找不到该家谱', icon: 'none' });
      return;
    }

    const newDb = {
      ...JSON.parse(JSON.stringify(this.data.db || {})),
      activeRootId: rootKey,      // use the real db key, not person.id
      people: JSON.parse(JSON.stringify(this.data.db.people))
    };
    this._layoutCache = { standard: null, timeline: null };
    
    this.setData({
      db: newDb,
      collapsedNodes: [],
      showProgenitorDropdown: false,
      ...this._rootSwitchScrollPatch()
    }, () => {
      this._saveData(newDb);
      this.refreshTree(() => {
        this._scheduleScrollToTreeNode(rootKey, { fallbackFirst: true, vertical: true, screenTopRpx: 96 });
      });
      wx.showToast({ title: `已切换到 ${person.name} 的家谱`, icon: 'none' });
    });
  },

  _getWorkspaceDeleteInfo(db, workspaceId) {
    const targetWorkspaceId = String(workspaceId || '').trim();
    const people = (db && db.people) || {};
    const personIds = Object.keys(people).filter(id => {
      return this._personWorkspaceId(people[id], id, db) === targetWorkspaceId;
    });
    const spouseOfSet = new Set();
    Object.values(people).forEach(person => {
      (person && person.spouses || []).forEach(spouseId => spouseOfSet.add(spouseId));
    });
    const progenitorIds = personIds
      .filter(id => {
        const person = people[id];
        if (!this._isProgenitor(id)) return false;
        const stats = this._calculateProgenitorStats(id, people);
        const hasChildren = (person.children || []).length > 0;
        const isPureSpouseNode = spouseOfSet.has(id) && !hasChildren;
        return stats.totalDescendants > 0 || !isPureSpouseNode;
      })
      .sort((a, b) => {
        const personA = people[a] || {};
        const personB = people[b] || {};
        const yearA = Number(personA.bYear || 9999);
        const yearB = Number(personB.bYear || 9999);
        if (yearA !== yearB) return yearA - yearB;
        return this._computeDisplayName({ ...personA, id: a })
          .localeCompare(this._computeDisplayName({ ...personB, id: b }), 'zh-Hans-CN');
      });
    const progenitors = progenitorIds.map(id => ({
      id,
      name: Logic.getTreeDisplayName({ ...people[id], id }, true)
    }));
    const primaryId = progenitorIds[0] || personIds[0] || '';
    const primaryPerson = primaryId ? people[primaryId] : null;
    const bundledSample = this._getBundledSampleByWorkspaceId(targetWorkspaceId);
    const name = bundledSample
      ? bundledSample.label
      : (primaryPerson ? this._formatFamilyName({ ...primaryPerson, id: primaryId }) : '这份家谱');
    const timelineEventIndexes = [];
    (db.timelineEvents || []).forEach((event, index) => {
      if (
        this._getTimelineEventWorkspaceId(event, db) === targetWorkspaceId
        && !this._isDefaultTimelineEvent(event)
      ) {
        timelineEventIndexes.push(index);
      }
    });

    return {
      workspaceId: targetWorkspaceId,
      name,
      progenitors,
      personIds,
      timelineEventIndexes,
      isActive: !!(db && db.activeRootId && personIds.includes(db.activeRootId))
    };
  },

  _findFallbackActiveRoot(db) {
    const people = (db && db.people) || {};
    const progenitorIds = Object.keys(people)
      .filter(id => this._isProgenitor(id))
      .sort((a, b) => {
        const personA = people[a] || {};
        const personB = people[b] || {};
        const yearA = Number(personA.bYear || 9999);
        const yearB = Number(personB.bYear || 9999);
        if (yearA !== yearB) return yearA - yearB;
        return this._computeDisplayName({ ...personA, id: a })
          .localeCompare(this._computeDisplayName({ ...personB, id: b }), 'zh-Hans-CN');
      });
    return progenitorIds[0] || Object.keys(people)[0] || null;
  },

  _deleteWorkspace(workspaceId) {
    let db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    const info = this._getWorkspaceDeleteInfo(db, workspaceId);
    if (!info.workspaceId || info.personIds.length === 0) {
      wx.showToast({ title: '这份家谱还未载入', icon: 'none' });
      return;
    }

    const deletedSet = new Set(info.personIds);
    info.personIds.forEach(id => {
      delete db.people[id];
    });

    Object.values(db.people || {}).forEach(person => {
      if (Array.isArray(person.children)) {
        person.children = person.children.filter(id => !deletedSet.has(id));
      }
      if (Array.isArray(person.spouses)) {
        person.spouses = person.spouses.filter(id => !deletedSet.has(id));
      }
      if (person.motherId && deletedSet.has(person.motherId)) {
        person.motherId = '';
      }
    });

    const eventIndexes = new Set(info.timelineEventIndexes);
    db.timelineEvents = (db.timelineEvents || []).filter((event, index) => !eventIndexes.has(index));
    this._clearBundledSampleVersion(db, info.workspaceId);

    if (!db.activeRootId || !db.people[db.activeRootId]) {
      db.activeRootId = this._findFallbackActiveRoot(db);
    }

    db.timelineEvents = Array.isArray(db.timelineEvents) ? db.timelineEvents : [];
    db = this._ensureTimelineEvents(db);
    this._layoutCache = { standard: null, timeline: null };

    const nextCollapsed = (this.data.collapsedNodes || []).filter(id => !deletedSet.has(id));
    this._saveData(db);
    this.setData({
      db,
      collapsedNodes: nextCollapsed,
      showProgenitorDropdown: false,
      workspaceDeleteOpenId: '',
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      ...this._emptyProfileContext()
    }, () => {
      this.refreshTree(() => {
        if (db.activeRootId) {
          this._scrollToTreeNode(db.activeRootId, { fallbackFirst: true, vertical: true, screenTopRpx: 96 });
        }
      });
      wx.showToast({ title: '已删除家谱', icon: 'success' });
    });
  },

  onDeleteWorkspace(e) {
    const workspaceId = String((e.currentTarget.dataset && e.currentTarget.dataset.workspaceId) || '').trim();
    if (!workspaceId) return;

    const db = this.data.db || { activeRootId: null, people: {} };
    const info = this._getWorkspaceDeleteInfo(db, workspaceId);
    if (info.personIds.length === 0) {
      wx.showToast({ title: '这份家谱还未载入', icon: 'none' });
      return;
    }

    const eventCount = info.timelineEventIndexes.length;
    const progenitorNames = (info.progenitors || []).map(item => item.name).filter(Boolean);
    const progenitorText = progenitorNames.length > 5
      ? `${progenitorNames.slice(0, 5).join('、')} 等 ${progenitorNames.length} 位始祖`
      : (progenitorNames.join('、') || info.name);
    const activeText = info.isActive ? '\n当前正在查看的家谱会关闭。' : '';
    const eventText = eventCount > 0 ? `，以及 ${eventCount} 个时间轴事件` : '';
    wx.showModal({
      title: '确认删除家谱',
      content: `以下始祖及其后代都会被永久删除：\n${progenitorText}\n\n共 ${info.personIds.length} 位人物${eventText}。${activeText}\n此操作不可撤销。`,
      confirmText: '删除',
      confirmColor: '#c62828',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) this._deleteWorkspace(workspaceId);
      }
    });
  },

  // ─────────────────────────────────────────────
  // Jump to a different tree using the ID-derived progenitor prefix.
  // ─────────────────────────────────────────────
  
  onJumpToTree(e) {
    const rawId = e.currentTarget.dataset.id;
    const people = (this.data.db && this.data.db.people) || {};
    const id = this._resolvePersonKey(rawId, people);
    const targetPerson = id ? people[id] : null;
    if (!targetPerson) {
      wx.showToast({ title: '无法跳转', icon: 'none' });
      return;
    }

    const newRootId = this._resolveRootKeyForPerson(id, people);
    const newRootPerson = newRootId ? people[newRootId] : null;

    if (!newRootPerson) {
      wx.showToast({ title: '找不到对应的家族', icon: 'none' });
      return;
    }

    // Update to new tree
    // Deep copy people to isolate this tree's data
    const newDb = {
      ...JSON.parse(JSON.stringify(this.data.db || {})),
      activeRootId: newRootId,
      people: JSON.parse(JSON.stringify(this.data.db.people))
    };
    const collapsedNodes = this._buildFocusedCollapsedNodes(newDb, id);
    this._layoutCache = { standard: null, timeline: null };

    this.setData({
      db: newDb,
      collapsedNodes,
      ...this._rootSwitchScrollPatch()
    }, () => {
      this._saveData(newDb);
      this.refreshTree(() => {
        this._scheduleScrollToTreeNode(id, {
          fallbackFirst: true,
          vertical: true,
          includeParents: true,
          horizontalAnchorId: this._getTreeJumpHorizontalAnchorId(id),
          screenLeftRpx: 96,
          screenCenterYRpx: this._treeViewportHeightRpx() / 2
        });
      });
      wx.showToast({ title: `已跳转到 ${newRootPerson.name} 的家谱`, icon: 'none' });
    });
  },

  // ─────────────────────────────────────────────
  // Drawer events from profile-editor component
  // ─────────────────────────────────────────────

  onUpdateField(e) {
    const field = e.detail.field;
    const value = e.detail.value;
    this._updateDrawerField(field, value);
  },

  onProfileFieldBlur(e) {
    if (!this.data.creatingProfile || this.data.showSpousePicker) return;
    const field = String((e && e.detail && e.detail.field) || '').trim();
    if (!['surname', 'firstname', 'name', 'gender'].includes(field)) return;
    this._maybeShowLiveExistingProfileMatches(this.data.draftPerson);
  },

  onMotherChange(e) {
    const m = this.data.motherRange[e.detail.value];
    const editingId = this.data.editingId;
    const mother = m && m.id ? this._decorateProfilePerson(this.data.db.people[m.id]) : null;
    
    if (!editingId) {
      // 新建人物：更新 draftPerson
      const draftPerson = { ...this.data.draftPerson, motherId: m ? m.id : '' };
      this.setData({
        draftPerson,
        currentMotherName: mother ? mother._displayName : '',
        _displayMother: mother
      });
    } else {
      // 现有人物：写入 _pendingEdits，并标记母亲已选（用于高亮显示）
      const pending = { ...(this.data._pendingEdits || {}), motherId: m ? m.id : '' };
      this.setData({
        _pendingEdits: pending,
        currentMotherName: mother ? mother._displayName : '',
        _displayMother: mother,
        _pendingMotherSelected: true
      });
    }
  },

  onPersonalEventVisibilityChange(e) {
    const detail = e.detail || {};
    const events = Array.isArray(detail.value) ? detail.value : [];
    const targetName = String(detail.name || '').trim();
    const nextHidden = detail.hidden === true;
    const editingId = this.data.editingId;
    if (!editingId) {
      this._updateDrawerField('events', events);
      return;
    }
    if (!targetName) return;

    const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    if (!db.people || !db.people[editingId]) return;
    const currentWorkspaceId = this._getCurrentWorkspaceIdFromDb(db);
    Object.entries(db.people).forEach(([personId, person]) => {
      if (currentWorkspaceId && this._personWorkspaceId(person, personId, db) !== currentWorkspaceId) return;
      if (!Array.isArray(person.events)) return;
      person.events = person.events.map((event, index) => {
        const normalized = this._normalizePersonalEvent(event, index);
        const eventName = (normalized && normalized.name) || String(event && (event.name || event.title || event.label) || '').trim();
        if (eventName !== targetName) return event;
        const updated = { ...event };
        if (nextHidden) {
          updated.hidden = true;
        } else {
          delete updated.hidden;
          delete updated.checked;
        }
        return updated;
      });
    });
    db.people[editingId] = {
      ...db.people[editingId],
      events
    };
    const pending = { ...(this.data._pendingEdits || {}) };
    delete pending.events;
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    this.setData({
      db,
      _editingPerson: this._decorateProfilePerson({ ...db.people[editingId], ...pending, id: editingId }),
      _pendingEdits: pending
    }, () => this.refreshTree());
  },

  _commitPendingEditsToDb() {
    const editingId = this.data.editingId;
    const pending = this.data._pendingEdits || {};
    if (!editingId || Object.keys(pending).length === 0) {
      return { db: this.data.db, changed: false };
    }

    const db = JSON.parse(JSON.stringify(this.data.db));
    if (!db.people[editingId]) {
      return { db: this.data.db, changed: false };
    }

    db.people[editingId] = this._fillAutoAge({ ...db.people[editingId], ...pending });
    if (db.people[editingId].gender !== 'male') {
      db.people[editingId].children = [];
    }
    let familyName = this.data.familyName;
    if (
      editingId === db.activeRootId &&
      (
        pending.surname !== undefined ||
        pending.firstname !== undefined ||
        pending.name !== undefined ||
        pending.hometown !== undefined
      )
    ) {
      const rootPerson = db.people[editingId];
      familyName = this._formatFamilyName({ ...rootPerson, id: editingId });
    }

    this.setData({
      db,
      familyName,
      _editingPerson: this._decorateProfilePerson({ ...db.people[editingId], id: editingId }),
      _pendingEdits: {},
      _pendingMotherSelected: false
    });
    this._saveData(db);
    return { db, changed: true };
  },

  onCommit() {
    const editingId = this.data.editingId;
    
    if (!editingId) {
      // 新建人物：保存 draftPerson 到数据库
      this._doCommitNewPerson();
    } else {
      // 现有人物：把 _pendingEdits 合并入数据库再保存
      const result = this._commitPendingEditsToDb();
      if (result.changed) {
        this.refreshTree();
      }
      this.setData({
        showDrawer: false,
        editingId: '',
        creatingProfile: false,
        _pendingEdits: {},
        _pendingMotherSelected: false,
        ...this._emptyProfileContext()
      });
    }
  },
  
  // 保存新建的人物（draftPerson）
  _doCommitNewPerson() {
    const draftPerson = this.data.draftPerson;
    const db = JSON.parse(JSON.stringify(this.data.db));

    if (draftPerson && draftPerson._isNewSpouse) {
      const matchKey = this._spouseMatchKey(draftPerson);
      if (matchKey && matchKey !== this._spouseMatchSkippedKey) {
        const matches = this._buildSpouseMatchResults(db, draftPerson._mainPersonId, draftPerson);
        if (matches.length > 0) {
          this._showSpouseMatchPrompt(draftPerson._mainPersonId, matches, 'commit', matchKey);
          return;
        }
      }
    }

    if (draftPerson && (draftPerson._isNewChild || draftPerson._isNewFather)) {
      const matchKey = this._relationMatchKey(draftPerson);
      if (matchKey && matchKey !== this._spouseMatchSkippedKey) {
        const matches = this._buildRelationMatchResults(db, draftPerson);
        if (matches.length > 0) {
          this._showRelationMatchPrompt(draftPerson, matches, 'commit', matchKey);
          return;
        }
      }
    }
    
    // Simple safety check: warn if birth year is in the future
    const currentYear = new Date().getFullYear();
    if (draftPerson.bYear && draftPerson.bYear > currentYear) {
      wx.showModal({
        title: '出生年份错误',
        content: `出生年份 ${draftPerson.bYear} 晚于当前年份 ${currentYear}，是否继续保存？`,
        confirmText: '继续保存',
        cancelText: '修改',
        success: (res) => {
          if (res.confirm) {
            this._saveNewPerson(db, draftPerson);
          }
        }
      });
      return;
    }
    
    this._saveNewPerson(db, draftPerson);
  },
  
  // 保存新建的人物到数据库
  _saveNewPerson(db, draftPerson) {
    // 检查是哪种类型的添加
    const isNewChild = draftPerson._isNewChild;
    const isNewFather = draftPerson._isNewFather;
    const isNewSpouse = draftPerson._isNewSpouse;
    const isNewAncestor = draftPerson._isNewAncestor;

    const existingIds = this._getAllExistingIds();

    // 生成永久ID
    let newId;
    if (isNewSpouse) {
      // Spouse gets an independent root ID (not part of the descent chain)
      let candidate = this._generateRootId();
      while (existingIds.has(candidate)) candidate = this._generateRootId();
      newId = candidate;
    } else if (isNewChild) {
      // Child ID = parent ID + next available letter suffix
      // Example: if parent is abc_def_ghi-A, children are abc_def_ghi-AA, abc_def_ghi-AB, etc.
      const parentId = draftPerson._parentId;
      newId = this._generateChildId(parentId, existingIds);
    } else if (isNewAncestor) {
      // New ancestor (empty tree): gets a fresh root ID
      let candidate = this._generateRootId();
      while (existingIds.has(candidate)) candidate = this._generateRootId();
      newId = candidate;
    } else if (isNewFather) {
      // New father: shift existing tree down, father takes the old progenitor ID
      // We don't need to generate a new ID here - father will reuse the old progenitor ID
      // The old progenitor ID will be determined below in the isNewFather branch
      newId = ''; // Placeholder, will be set below
    } else {
      // Fallback
      let candidate = this._generateRootId();
      while (existingIds.has(candidate)) candidate = this._generateRootId();
      newId = candidate;
    }
    
    
    // 清理临时标记
    const personData = { ...draftPerson };
    delete personData._isNewChild;
    delete personData._isNewFather;
    delete personData._isNewSpouse;
    delete personData._isNewAncestor;
    delete personData._parentId;
    delete personData._childId;
    delete personData._mainPersonId;
    delete personData.fatherId;
    delete personData.paternalRootId;
    delete personData.progenitorId_;
    
    // ID 将在所有分支完成后设置（第 928 行）
    
    // Auto-compute name only when BOTH surname and firstname are available.
    // Do NOT set name to just surname or just firstname — display logic already
    // handles the fallback display. The 'name' field is only for custom display names.
    if (!personData.name || !personData.name.trim()) {
      const s = (personData.surname || '').trim();
      const f = (personData.firstname || '').trim();
      if (s && f) {
        personData.name = s + f;
      }
      // else: leave name empty → display logic will render "surname氏" or "无名"
    }
    
    // 处理祖先的情况（空树时添加第一个祖先 / 新建家谱）
    if (isNewAncestor) {
      // 始祖：newId 是 12 字符始祖ID（格式 xxx_xxx_xxx-）
      const existingWorkspaceIds = this._getWorkspaceIds(db);
      personData.workspaceId = this._generateWorkspaceId(existingWorkspaceIds);
      db.activeRootId = newId;
    }

    if (!isNewAncestor && !isNewFather && !isNewChild && !isNewSpouse && !personData.workspaceId) {
      const existingWorkspaceIds = this._getWorkspaceIds(db);
      personData.workspaceId = this._generateWorkspaceId(existingWorkspaceIds);
      db.activeRootId = newId;
    }

    // 处理父亲的情况
    if (isNewFather) {
      const childId = draftPerson._childId;
      const child = db.people[childId];

      // Get the progenitor ID from the child's ID (first 12 chars)
      let oldProgenitorId_ = this._extractProgenitorId(childId);
      if (!oldProgenitorId_ || !oldProgenitorId_.endsWith('-')) {
        // Fallback: try from activeRootId
        const rid = db.activeRootId || '';
        oldProgenitorId_ = this._extractProgenitorId(rid);
      }

      // The father reuses the progenitor ID after shifting the tree down
      newId = oldProgenitorId_;

      // Shift the entire tree under the progenitor down one generation
      db = this._shiftTreeDown(db, oldProgenitorId_);

      // After shift, the old progenitor (now with oldProgenitorId_ + 'A') becomes a child of the new father
      // No fatherId to set — deduced from ID at runtime
      
      // Set the father's children list
      const childToConnectId = oldProgenitorId_ + 'A';
      personData.children = [childToConnectId];
      // Inherit workspaceId from child (stay in the same workspace)
      if (!personData.workspaceId) {
        personData.workspaceId = child?.workspaceId || oldProgenitorId_;
      }
      db.activeRootId = newId;
    }

    // Set ID here (after all branches have determined newId, including isNewFather)
    personData.id = newId;
    if (personData.gender !== 'male') {
      personData.children = [];
    }


    // 处理子女的情况
    if (isNewChild) {
      const parentId = draftPerson._parentId;
      const parent = db.people[parentId];
      if (parent) {
        if (parent.gender !== 'male') {
          wx.showToast({ title: '女性节点不设子女支线', icon: 'none' });
          return;
        }
        if (!parent.children) parent.children = [];
        if (!parent.children.includes(newId)) {
          parent.children.push(newId);
        }
      // No fatherId stored — deduced from ID at runtime
      // Inherit workspaceId from parent
      if (!personData.workspaceId) {
        personData.workspaceId = parent.workspaceId;
      }
    } else {
      console.error('[SaveChild] Parent not found! parentId:', parentId);
      }
    }
    
    // 处理配偶的情况
    if (isNewSpouse) {
      const mainPersonId = draftPerson._mainPersonId;
      const mainPerson = db.people[mainPersonId];
      if (mainPerson) {
        if (!mainPerson.spouses) mainPerson.spouses = [];
        if (!mainPerson.spouses.includes(newId)) {
          mainPerson.spouses.push(newId);
        }
        personData.spouses = [mainPersonId];
      }
      // Inherit workspaceId from main person
      if (!personData.workspaceId) {
        personData.workspaceId = mainPerson?.workspaceId;
      }
    }

    this._fillAutoAge(personData);
    db.people[newId] = personData;

    // Save to local storage first
    this._saveData(db);
    const nextCollapsedNodes = (this.data.collapsedNodes || []).filter(id => db.people && db.people[id]);

    // Then update UI state - first close drawer
    this.setData({
      db,
      collapsedNodes: nextCollapsedNodes,
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      draftPerson: {},
      _editingPerson: {},
      _pendingEdits: {},
      _pendingMotherSelected: false,
      showSpousePicker: false,
      spousePickerTargetId: '',
      spousePickerTargetName: '',
      spousePickerResults: [],
      spousePickerCurrentIndex: 0,
      spousePickerMode: '',
      spousePickerMatchKey: '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建',
      ...this._emptyProfileContext()
    }, () => {
      this.refreshTree();
    });
  },

  onCloseDrawer() {
    this._spouseMatchSkippedKey = '';
    this._lastLiveMatchKey = '';
    this.setData({
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      draftPerson: {},
      _editingPerson: {},
      _pendingEdits: {},
      _pendingMotherSelected: false,
      showSpousePicker: false,
      spousePickerTargetId: '',
      spousePickerTargetName: '',
      spousePickerResults: [],
      spousePickerCurrentIndex: 0,
      spousePickerMode: '',
      spousePickerMatchKey: '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建',
      ...this._emptyProfileContext()
    });
  },

  // ─────────────────────────────────────────────
  // Collapse / expand
  // ─────────────────────────────────────────────

  onToggleCollapse(e) {
    const dataset = (e && e.currentTarget && e.currentTarget.dataset) || {};
    const id = dataset.id;
    const renderKey = dataset.renderKey || '';
    const isDuplicateInstance = Number(dataset.duplicate || 0) === 1;
    if (isDuplicateInstance) {
      const current = this.data.duplicateExpandedKeys || [];
      const key = dataset.instanceKey || renderKey || id;
      const next = current.includes(key)
        ? current.filter(x => x !== key)
        : [...current, key];
      this.setData({ duplicateExpandedKeys: next }, () => this.refreshTree());
      return;
    }
    const current = this.data.collapsedNodes;
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];                 // immutable: create new array
    this.setData({ collapsedNodes: next }, () => this.refreshTree());
  },

  // ─────────────────────────────────────────────
  // Add / delete members
  // ─────────────────────────────────────────────

  onNewTree(e) {
    // Only proceed if this is explicitly the new-tree action or has no id
    // (prevents triggering when a progenitor item is clicked due to event issues)
    const dataset = e && e.currentTarget && e.currentTarget.dataset;
    if (dataset && dataset.id) {
      return;
    }

    // Close dropdown menu first
    this.setData({ showProgenitorDropdown: false });

    // New tree = create a new independent workspace (new progenitor)
    this._showAddAncestorDialog();
  },

  onAddBundledSampleWorkspace(sampleDef) {
    const sample = this._createBundledSampleWorkspace(sampleDef);
    if (!sampleDef || !sample) return;
    let db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    db = this._replaceBundledSampleWorkspace(db, sampleDef, sample, { makeActive: true });
    db = this._migrateIdFormat(db, false);
    db = this._migrateWorkspaceId(db, false);
    db = this._migrateRemoveDerivedIds(db, false);
    db = this._ensureTimelineEvents(db);
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    this.setData({
      db,
      showProgenitorDropdown: false,
      workspaceDeleteOpenId: '',
      collapsedNodes: [],
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      ...((sampleDef && sampleDef.viewOptions) || {}),
      ...this._emptyProfileContext()
    }, () => {
      this.refreshTree(() => {
        this._scrollToTreeNode(db.activeRootId, { fallbackFirst: true, vertical: true, screenTopRpx: 96 });
      });
      wx.showToast({ title: `已打开${sampleDef.label}`, icon: 'success' });
    });
  },

  onAddTangSampleWorkspace() {
    this.onAddBundledSampleWorkspace(this._getBundledSampleByWorkspaceId(Samples.TANG_IMPERIAL_WORKSPACE_ID));
  },

  onAddChild() {
    if (this._addingChild) return;
    this._addingChild = true;
    setTimeout(() => { this._addingChild = false; }, 500);

    const parentId = this.data.editingId;
    const { db } = this._commitPendingEditsToDb();
    const parent = db.people[parentId];
    if (!parent) {
      wx.showToast({ title: '找不到父节点', icon: 'none' });
      return;
    }
    if (parent.gender !== 'male') {
      wx.showToast({ title: '女性节点不设子女支线', icon: 'none' });
      return;
    }
    // 自动继承父亲的姓氏和籍贯
    const surname = parent.surname || (parent.name ? parent.name.charAt(0) : '') || '未';
    const hometown = parent.hometown || this._sameProgenitorHometownHint(parentId, db) || '';

    const draftPerson = {
      id: '', // 空ID，等待保存时生成
      surname: surname,
      firstname: '',
      name: '',
      gender: 'male',
      hometown: hometown,
      bYear: '',
      bDate: '',
      bPlace: '',
      dYear: '',
      dDate: '',
      dPlace: '',
      age: '',
      isLiving: '',
      alias: '',
      rank: '',
      children: [],
      spouses: [],
      _isNewChild: true, // 标记是新增的子女
      _parentId: parentId // 记录父节点ID
    };

    this._spouseMatchSkippedKey = '';
    this._lastLiveMatchKey = '';
    this.setData({
      editingId: '', // 空ID表示新建
      draftPerson: draftPerson,
      _editingPerson: { ...draftPerson },  // 创建副本避免引用问题
      showDrawer: true,
      ...this._emptyProfileContext(),
      creatingProfile: true,
      _hometownHint: hometown
    });
  },

  // Add father to current person
  onAddFather() {
    if (this._addingFather) return;
    this._addingFather = true;
    setTimeout(() => { this._addingFather = false; }, 500);

    const childId = this.data.editingId;
    const { db } = this._commitPendingEditsToDb();
    const child = db.people[childId];
    if (!child) {
      wx.showToast({ title: '找不到当前成员', icon: 'none' });
      return;
    }
    // 自动继承子女的姓氏和籍贯
    const surname = child.surname || (child.name ? child.name.charAt(0) : '') || '未';
    const hometown = child.hometown || this._sameProgenitorHometownHint(childId, db) || '';

    const draftPerson = {
      id: '', // 空ID，等待保存时生成
      surname: surname,
      firstname: '',
      name: '',
      gender: 'male',
      hometown: hometown,
      bYear: '',
      bDate: '',
      bPlace: '',
      dYear: '',
      dDate: '',
      dPlace: '',
      age: '',
      isLiving: '',
      alias: '',
      rank: '',
      children: [childId], // 把当前节点加为子女
      spouses: [],
      _isNewFather: true, // 标记是新增的父亲
      _childId: childId // 记录子节点ID
    };

    this._spouseMatchSkippedKey = '';
    this._lastLiveMatchKey = '';
    this.setData({
      editingId: '', // 空ID表示新建
      draftPerson: draftPerson,
      _editingPerson: { ...draftPerson },  // 创建副本避免引用问题
      showDrawer: true,
      ...this._emptyProfileContext(),
      creatingProfile: true,
      _hometownHint: hometown
    });
  },

  // ─────────────────────────────────────────────
  // ID generation system
  //
  // Progenitor:  random 9-char alphanumeric, formatted as xxx_xxx_xxx-
  //              12 characters total; underscore separators, trailing hyphen = root marker.
  // Descendant:  progenitorId (12 chars, ends with '-') + letter(s)
  //              e.g. abc_def_ghi-A  = 1st child   (13 chars)
  //                   abc_def_ghi-B  = 2nd child
  //                   abc_def_ghi-AA = 1st child's 1st child
  // Spouse:      independent random 12-char progenitor ID (own root)
  //
  // Add father:  shift entire tree; father reuses the progenitor ID:
  //              abc_def_ghi-     → abc_def_ghi-A    (old root becomes 1st child)
  //              abc_def_ghi-A    → abc_def_ghi-AA   (old 1st child becomes grandchild)
  //              abc_def_ghi-B    → abc_def_ghi-AB   (old 2nd child shifts)
  //              New father takes abc_def_ghi-
  // ─────────────────────────────────────────────

  // Extract progenitor ID (12-char, ends with '-') from any ID.
  // e.g. "abc_def_ghi-"   → "abc_def_ghi-"  (already a progenitor ID)
  //      "abc_def_ghi-A"  → "abc_def_ghi-"
  //      "abc_def_ghi-AA" → "abc_def_ghi-"
  _extractProgenitorId(id) {
    if (!id || typeof id !== 'string') return id;

    // New format: xxx_xxx_xxx- (12 chars) optionally followed by letter suffix
    // Progenitor ID itself ends with '-' and is exactly 12 chars.
    // Descendant IDs are > 12 chars and the trailing chars after position 12 are all uppercase letters.
    if (id.length > 12) {
      const prefix = id.slice(0, 12);   // xxx_xxx_xxx-
      const suffix = id.slice(12);      // A, B, AA, AB ...
      if (prefix.endsWith('-') && /^[A-Z]+$/.test(suffix)) {
        return prefix;
      }
    }
    // Could be exactly 12 chars (progenitor itself), or old-format — return as-is
    return id;
  },

  // ── Father deduction (replaces stored fatherId) ─────────────
  // A person's father can be deduced by removing the last character from their ID.
  // E.g. abc_def_ghi-A  → father is abc_def_ghi-
  //      abc_def_ghi-AA → father is abc_def_ghi-A
  // A progenitor (ID ends with '-', 12 chars) has no father.
  // Note: spouse nodes have independent progenitor IDs and cannot have fathers.

  _getFatherId(personId) {
    if (!personId || typeof personId !== 'string') return null;
    // Progenitor (xxx_xxx_xxx-) has no father
    if (personId.length <= 12) return null;
    const prefix = personId.slice(0, 12);
    const suffix = personId.slice(12);
    if (prefix.endsWith('-') && /^[A-Z]+$/.test(suffix)) {
      return personId.slice(0, -1); // remove last character
    }
    return null;
  },

  // Get father person object from db, or null if not found / is progenitor
  _getFather(personId, db) {
    const dbPeople = (db || this.data.db).people;
    const fatherId = this._getFatherId(personId);
    if (!fatherId) return null;
    return dbPeople[fatherId] || null;
  },

  // Check if a person is a progenitor (root of a tree, no father)
  _isProgenitor(personId) {
    if (!personId || typeof personId !== 'string') return false;
    if (personId.length === 12 && personId.endsWith('-')) return true;
    return false;
  },

  // Generate random 9-char alphanumeric formatted as xxx_xxx_xxx- (12 chars, trailing hyphen)
  _generateRootId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 9; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Progenitor ID: xxx_xxx_xxx- (12 characters, trailing hyphen)
    return s.slice(0, 3) + '_' + s.slice(3, 6) + '_' + s.slice(6, 9) + '-';
  },

  _generateWorkspaceId(existingWorkspaceIds) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const existing = existingWorkspaceIds instanceof Set
      ? existingWorkspaceIds
      : new Set(existingWorkspaceIds || []);
    let id = '';
    do {
      id = '';
      for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (existing.has(id));
    existing.add(id);
    return id;
  },

  _numberToLetters(index) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let n = Math.max(0, Number(index) || 0);
    let out = '';
    do {
      out = chars[n % 26] + out;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return out;
  },

  _isSchemaPersonId(id) {
    return typeof id === 'string'
      && /^[a-z0-9]{3}_[a-z0-9]{3}_[a-z0-9]{3}-(?:[A-Z]+)?$/.test(id);
  },

  _needsIdNormalization(db) {
    const people = (db && db.people) || {};
    const ids = Object.keys(people);
    if (!ids.length) return false;
    const parentByChild = {};

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const person = people[id] || {};
      if (!this._isSchemaPersonId(id) || (person.id && person.id !== id)) return true;
      const children = Array.isArray(person.children) ? person.children : [];
      const spouses = Array.isArray(person.spouses) ? person.spouses : [];
      for (let c = 0; c < children.length; c++) {
        const childId = children[c];
        if (!people[childId] || this._getFatherId(childId) !== id) return true;
        if (!parentByChild[childId]) parentByChild[childId] = id;
      }
      for (let s = 0; s < spouses.length; s++) {
        if (!people[spouses[s]]) return true;
      }
      if (person.motherId && !people[person.motherId]) return true;
    }

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!parentByChild[id] && !this._isProgenitor(id)) return true;
    }
    return !!(db && db.activeRootId && !people[db.activeRootId]);
  },

  _normalizeDbIdsForSchema(db) {
    if (!db || !db.people || !this._needsIdNormalization(db)) return db;

    const people = db.people || {};
    const oldIds = Object.keys(people);
    const parentByChild = {};
    oldIds.forEach(parentId => {
      const parent = people[parentId] || {};
      if (parent.gender && parent.gender !== 'male') return;
      (Array.isArray(parent.children) ? parent.children : []).forEach(childId => {
        if (people[childId] && !parentByChild[childId]) parentByChild[childId] = parentId;
      });
    });

    const renameMap = {};
    const usedNewIds = new Set();
    const makeUniqueRootId = (preferred) => {
      let id = this._isProgenitor(preferred) && !usedNewIds.has(preferred)
        ? preferred
        : this._generateRootId();
      while (usedNewIds.has(id)) id = this._generateRootId();
      return id;
    };
    const childListFor = (oldId) => {
      const person = people[oldId] || {};
      if (person.gender && person.gender !== 'male') return [];
      return (Array.isArray(person.children) ? person.children : [])
        .filter(childId => people[childId]);
    };
    const assignSubtree = (oldId, newId) => {
      if (!oldId || !people[oldId] || renameMap[oldId]) return;
      let uniqueNewId = newId;
      while (!uniqueNewId || usedNewIds.has(uniqueNewId)) uniqueNewId = this._generateRootId();
      renameMap[oldId] = uniqueNewId;
      usedNewIds.add(uniqueNewId);
      childListFor(oldId).forEach((childId, index) => {
        assignSubtree(childId, uniqueNewId + this._numberToLetters(index));
      });
    };

    const rootCandidates = [];
    const addRootCandidate = (id) => {
      if (id && people[id] && !rootCandidates.includes(id)) rootCandidates.push(id);
    };
    addRootCandidate(db.activeRootId);
    oldIds.forEach(id => {
      if (!parentByChild[id]) addRootCandidate(id);
    });
    oldIds.forEach(addRootCandidate);

    rootCandidates.forEach(oldId => {
      if (!renameMap[oldId]) assignSubtree(oldId, makeUniqueRootId(oldId));
    });

    const newPeople = {};
    oldIds.forEach(oldId => {
      const person = people[oldId] || {};
      const newId = renameMap[oldId];
      if (!newId) return;
      const p = { ...person, id: newId };
      p.children = (p.gender === 'male' ? (Array.isArray(person.children) ? person.children : []) : [])
        .filter(id => parentByChild[id] === oldId)
        .map(id => renameMap[id])
        .filter(Boolean);
      p.spouses = (Array.isArray(person.spouses) ? person.spouses : [])
        .map(id => renameMap[id])
        .filter(Boolean);
      if (p.motherId) {
        p.motherId = renameMap[p.motherId] || '';
        if (!p.motherId) delete p.motherId;
      }
      delete p.fatherId;
      delete p.paternalRootId;
      delete p.progenitorId_;
      newPeople[newId] = p;
    });

    const activeRootId = renameMap[db.activeRootId]
      || Object.keys(newPeople).find(id => this._isProgenitor(id))
      || Object.keys(newPeople)[0]
      || null;
    return {
      ...db,
      activeRootId,
      people: newPeople
    };
  },

  // Given a parent ID (e.g., abc_def_ghi- or abc_def_ghi-A), return next available child ID.
  // If parent is root (ends with '-'), children get single-letter suffix: -A, -B, -C...
  // If parent has suffix (e.g., -A), children get double-letter suffix: -AA, -AB, -AC...
  _generateChildId(parentId, existingIds) {
    const suffixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // Check if parent is root (ends with '-')
    const isRoot = parentId.endsWith('-');

    if (isRoot) {
      // Root's children: single letter suffix -A through -Z
      for (let i = 0; i < suffixChars.length; i++) {
        const candidate = parentId + suffixChars[i];
        if (!existingIds.has(candidate)) {
          return candidate;
        }
      }
    } else {
      // Non-root (has suffix): children get double-letter suffix
      for (let j = 0; j < suffixChars.length; j++) {
        const candidate = parentId + suffixChars[j];
        if (!existingIds.has(candidate)) {
          return candidate;
        }
      }
    }
    return parentId + Date.now(); // last resort
  },

  // Get all existing IDs from current db
  _getAllExistingIds() {
    const ids = new Set();
    if (this.data.db && this.data.db.people) {
      Object.keys(this.data.db.people).forEach(id => ids.add(id));
    }
    return ids;
  },

  // Shift all IDs in a tree down one generation by prepending 'A' to the letter suffix.
  // This frees the progenitor ID for a new father.
  //
  // E.g. progenitorId = "abc_def_ghi-"   (12 chars, ends with '-')
  //   abc_def_ghi-     → abc_def_ghi-A    (old root becomes 1st child)
  //   abc_def_ghi-A    → abc_def_ghi-AA   (old 1st child becomes grandchild)
  //   abc_def_ghi-B    → abc_def_ghi-AB   (old 2nd child shifts)
  //   abc_def_ghi-AA   → abc_def_ghi-AAA  (grandchild shifts)
  // After this, "abc_def_ghi-" is freed for the new father.
  _shiftTreeDown(db, progenitorId) {

    const renameMap = this._buildShiftTreeDownMap(db, progenitorId, 'A');

    if (Object.keys(renameMap).length === 0) {
      return db;
    }

    return this._applyIdRenameMap(db, renameMap);
  },

  _isSubtreeId(id, rootId) {
    if (!id || !rootId) return false;
    if (id === rootId) return true;
    if (!id.startsWith(rootId)) return false;
    const suffix = id.slice(rootId.length);
    return /^[A-Z]+$/.test(suffix);
  },

  _buildSubtreeRenameMap(db, oldRootId, newRootId) {
    const people = (db && db.people) || {};
    const renameMap = {};
    if (!oldRootId || !newRootId || oldRootId === newRootId) return renameMap;
    Object.keys(people).forEach(id => {
      if (this._isSubtreeId(id, oldRootId)) {
        renameMap[id] = newRootId + id.slice(oldRootId.length);
      }
    });
    return renameMap;
  },

  _buildShiftTreeDownMap(db, progenitorId, insertedSuffix = 'A') {
    const people = (db && db.people) || {};
    const renameMap = {};
    if (!progenitorId || !/^[A-Z]$/.test(insertedSuffix)) return renameMap;
    Object.keys(people).forEach(id => {
      const person = people[id];
      if (person && person.id !== id) person.id = id;
      if (this._isSubtreeId(id, progenitorId)) {
        const suffix = id.slice(progenitorId.length);
        renameMap[id] = progenitorId + insertedSuffix + suffix;
      }
    });
    return renameMap;
  },

  _renameMapHasCollision(db, renameMap) {
    const people = (db && db.people) || {};
    const seenTargets = new Set();
    return Object.entries(renameMap).some(([oldId, newId]) => {
      if (!newId) return true;
      if (seenTargets.has(newId)) return true;
      seenTargets.add(newId);
      return !!(people[newId] && !renameMap[newId] && newId !== oldId);
    });
  },

  _applyIdRenameMap(db, renameMap) {
    if (!db || !db.people || !renameMap || Object.keys(renameMap).length === 0) return db;

    const newPeople = {};
    Object.entries(db.people).forEach(([oldId, person]) => {
      const pid = renameMap[oldId] || oldId;
      const p = { ...person, id: pid };

      if (p.motherId)        p.motherId        = renameMap[p.motherId]        || p.motherId;
      delete p.fatherId;
      delete p.paternalRootId;
      delete p.progenitorId_;
      if (p.children)  p.children  = p.children.map(c  => renameMap[c]  || c);
      if (p.spouses)   p.spouses   = p.spouses.map(s   => renameMap[s] || s);

      newPeople[pid] = p;
    });

    const newActiveRootId = renameMap[db.activeRootId] || db.activeRootId;
    return { ...db, activeRootId: newActiveRootId, people: newPeople };
  },

  _renameSubtreeRoot(db, oldRootId, newRootId) {
    if (!oldRootId || !newRootId || oldRootId === newRootId) {
      return { db, ok: true, renameMap: {} };
    }
    const renameMap = this._buildSubtreeRenameMap(db, oldRootId, newRootId);
    if (Object.keys(renameMap).length === 0) {
      return { db, ok: false, message: '找不到可移动的支线' };
    }
    if (this._renameMapHasCollision(db, renameMap)) {
      return { db, ok: false, message: '目标位置已有同编号支线' };
    }
    return {
      db: this._applyIdRenameMap(db, renameMap),
      ok: true,
      renameMap
    };
  },

  _generateAvailableChildIdForSubtree(parentId, oldRootId, db) {
    const suffixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let ch of suffixChars) {
      const candidate = parentId + ch;
      const renameMap = this._buildSubtreeRenameMap(db, oldRootId, candidate);
      if (Object.keys(renameMap).length === 0) {
        if (!db.people || !db.people[candidate] || candidate === oldRootId) return candidate;
        continue;
      }
      if (!this._renameMapHasCollision(db, renameMap)) return candidate;
    }
    return '';
  },

  _pickFatherInsertionSuffix(db, oldRootId, existingFatherId) {
    const fatherMap = this._buildSubtreeRenameMap(db, existingFatherId, oldRootId);
    const suffixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let ch of suffixChars) {
      const shiftMap = this._buildShiftTreeDownMap(db, oldRootId, ch);
      const combined = { ...shiftMap, ...fatherMap };
      if (!this._renameMapHasCollision(db, combined)) return ch;
    }
    return '';
  },

  _lexicographicRootId(...ids) {
    return ids
      .map(id => this._extractProgenitorId(id || ''))
      .filter(Boolean)
      .sort((a, b) => a < b ? -1 : (a > b ? 1 : 0))[0] || '';
  },

  _generateAvailableChildIdWithMap(parentId, movingRootId, baseMap, db) {
    const suffixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let ch of suffixChars) {
      const candidate = parentId + ch;
      const moveMap = this._buildSubtreeRenameMap(db, movingRootId, candidate);
      const combinedMap = { ...(baseMap || {}), ...moveMap };
      if (Object.keys(moveMap).length === 0) {
        if (!db.people || !db.people[candidate] || candidate === movingRootId) return { candidate, renameMap: combinedMap };
        continue;
      }
      if (!this._renameMapHasCollision(db, combinedMap)) return { candidate, renameMap: combinedMap };
    }
    return { candidate: '', renameMap: {} };
  },

  _removeChildReferenceEverywhere(db, childId) {
    Object.values((db && db.people) || {}).forEach(person => {
      if (person.children) person.children = person.children.filter(id => id !== childId);
    });
  },

  _connectExistingChildWithLexRoot(db, parentId, existingId) {
    const parentRootId = this._extractProgenitorId(parentId);
    const existingRootId = this._extractProgenitorId(existingId);
    const targetRootId = this._lexicographicRootId(parentRootId, existingRootId) || parentRootId;
    const parentWorkspaceId = this._ensurePersonWorkspaceId(db, parentId);
    const existingWorkspaceId = this._ensurePersonWorkspaceId(db, existingId);
    let newChildId = '';

    if (targetRootId === existingRootId && existingId === existingRootId && parentRootId !== existingRootId) {
      const parentMap = this._buildSubtreeRenameMap(db, parentRootId, existingRootId);
      const mappedParentId = existingRootId + parentId.slice(parentRootId.length);
      const generated = this._generateAvailableChildIdWithMap(mappedParentId, existingId, parentMap, db);
      newChildId = generated.candidate;
      if (!newChildId) {
        return { ok: false, message: '该位置没有可用编号' };
      }
      db = this._applyIdRenameMap(db, generated.renameMap);
      this._removeChildReferenceEverywhere(db, newChildId);
      const parent = db.people[mappedParentId];
      if (!parent.children) parent.children = [];
      if (!parent.children.includes(newChildId)) parent.children.push(newChildId);
      const targetWorkspaceId = existingWorkspaceId || parentWorkspaceId;
      if (targetWorkspaceId) {
        db.people[mappedParentId].workspaceId = targetWorkspaceId;
        this._assignWorkspaceToSubtree(db, existingRootId, targetWorkspaceId);
      }
      if (parentWorkspaceId && targetWorkspaceId && parentWorkspaceId !== targetWorkspaceId) {
        this._mergeWorkspaceInto(db, parentWorkspaceId, targetWorkspaceId);
      }
      db.activeRootId = existingRootId;
      return { ok: true, db, newChildId, focusId: mappedParentId, targetWorkspaceId, renameMap: generated.renameMap };
    }

    const generated = this._generateAvailableChildIdWithMap(parentId, existingId, {}, db);
    newChildId = generated.candidate;
    if (!newChildId) {
      return { ok: false, message: '该位置没有可用编号' };
    }
    if (this._renameMapHasCollision(db, generated.renameMap)) {
      return { ok: false, message: '无法重排编号' };
    }
    db = this._applyIdRenameMap(db, generated.renameMap);
    this._removeChildReferenceEverywhere(db, newChildId);
    const parent = db.people[parentId];
    if (!parent.children) parent.children = [];
    if (!parent.children.includes(newChildId)) parent.children.push(newChildId);
    db.people[newChildId].workspaceId = parentWorkspaceId || db.people[newChildId].workspaceId;
    this._assignWorkspaceToSubtree(db, newChildId, parentWorkspaceId);
    if (existingWorkspaceId && parentWorkspaceId && existingWorkspaceId !== parentWorkspaceId) {
      this._mergeWorkspaceInto(db, existingWorkspaceId, parentWorkspaceId);
    }
    return { ok: true, db, newChildId, focusId: parentId, targetWorkspaceId: parentWorkspaceId, renameMap: generated.renameMap };
  },

  _connectExistingFatherWithLexRoot(db, childId, existingId) {
    const childRootId = this._extractProgenitorId(childId);
    const existingRootId = this._extractProgenitorId(existingId);
    const targetRootId = this._lexicographicRootId(childRootId, existingRootId) || childRootId;
    const childWorkspaceId = this._ensurePersonWorkspaceId(db, childId);
    const existingWorkspaceId = this._ensurePersonWorkspaceId(db, existingId);

    if (targetRootId === existingRootId && childRootId !== existingRootId) {
      const generated = this._generateAvailableChildIdWithMap(existingId, childRootId, {}, db);
      const shiftedChildId = generated.candidate;
      if (!shiftedChildId) {
        return { ok: false, message: '父亲名下没有可用编号' };
      }
      db = this._applyIdRenameMap(db, generated.renameMap);
      this._removeChildReferenceEverywhere(db, shiftedChildId);
      const father = db.people[existingId];
      if (!father.children) father.children = [];
      if (!father.children.includes(shiftedChildId)) father.children.push(shiftedChildId);
      const targetWorkspaceId = existingWorkspaceId || childWorkspaceId;
      if (targetWorkspaceId) {
        father.workspaceId = targetWorkspaceId;
        this._assignWorkspaceToSubtree(db, existingRootId, targetWorkspaceId);
      }
      if (childWorkspaceId && targetWorkspaceId && childWorkspaceId !== targetWorkspaceId) {
        this._mergeWorkspaceInto(db, childWorkspaceId, targetWorkspaceId);
      }
      db.activeRootId = existingRootId;
      return { ok: true, db, focusId: existingId, targetWorkspaceId, shiftedChildId, renameMap: generated.renameMap };
    }

    const fatherMap = this._buildSubtreeRenameMap(db, existingRootId, childRootId);
    const mappedExistingId = childRootId + existingId.slice(existingRootId.length);
    const generated = this._generateAvailableChildIdWithMap(mappedExistingId, childRootId, fatherMap, db);
    const shiftedChildId = generated.candidate;
    if (!shiftedChildId) {
      return { ok: false, message: '父亲名下没有可用编号' };
    }
    if (this._renameMapHasCollision(db, generated.renameMap)) {
      return { ok: false, message: '无法重排编号' };
    }
    db = this._applyIdRenameMap(db, generated.renameMap);
    this._removeChildReferenceEverywhere(db, shiftedChildId);
    const father = db.people[mappedExistingId];
    if (!father.children) father.children = [];
    if (!father.children.includes(shiftedChildId)) father.children.push(shiftedChildId);
    const targetWorkspaceId = childWorkspaceId || existingWorkspaceId;
    if (targetWorkspaceId) {
      father.workspaceId = targetWorkspaceId;
      this._assignWorkspaceToSubtree(db, childRootId, targetWorkspaceId);
    }
    if (existingWorkspaceId && targetWorkspaceId && existingWorkspaceId !== targetWorkspaceId) {
      this._mergeWorkspaceInto(db, existingWorkspaceId, targetWorkspaceId);
    }
    db.activeRootId = childRootId;
    return { ok: true, db, focusId: mappedExistingId, targetWorkspaceId, shiftedChildId, renameMap: generated.renameMap };
  },

  onAddSpouse() {
    // Guard against double-fire (touch + tap)
    if (this._addingSpouse) return;
    this._addingSpouse = true;
    setTimeout(() => { this._addingSpouse = false; }, 500);

    const mainPersonId = this.data.editingId;
    const { db } = this._commitPendingEditsToDb();
    const currentPerson = db.people[mainPersonId];
    if (!currentPerson) {
      wx.showToast({ title: '找不到当前成员', icon: 'none' });
      return;
    }
    this._startNewSpouse(mainPersonId, currentPerson);
    return;

    const isMale = currentPerson?.gender === 'male';
    const gender = isMale ? 'female' : 'male';

    const draftPerson = {
      id: '', // 空ID，保存时生成
      surname: '',
      firstname: '',
      name: '',
      gender: gender,
      hometown: '',
      bYear: '',
      bDate: '',
      bPlace: '',
      dYear: '',
      dDate: '',
      dPlace: '',
      age: '',
      isLiving: '',
      alias: '',
      rank: '',
      spouses: [], // 将在保存时设置
      children: [],
      _isNewSpouse: true, // 标记是新增的配偶
      _mainPersonId: mainPersonId // 记录主人物ID
    };

    this.setData({
      editingId: '', // 空ID表示新建
      draftPerson: draftPerson,
      _editingPerson: { ...draftPerson },  // 创建副本避免引用问题
      showDrawer: true,
      ...this._emptyProfileContext(),
      creatingProfile: true,
      _hometownHint: ''
    });
  },

  _startNewSpouse(mainPersonId, currentPerson) {
    this._spouseMatchSkippedKey = '';
    this._lastLiveMatchKey = '';
    const isMale = currentPerson && currentPerson.gender === 'male';
    const gender = isMale ? 'female' : 'male';

    const draftPerson = {
      id: '',
      surname: '',
      firstname: '',
      name: '',
      gender,
      hometown: '',
      bYear: '',
      bDate: '',
      bPlace: '',
      dYear: '',
      dDate: '',
      dPlace: '',
      age: '',
      isLiving: '',
      alias: '',
      rank: '',
      spouses: [],
      children: [],
      _isNewSpouse: true,
      _mainPersonId: mainPersonId
    };

    this.setData({
      editingId: '',
      draftPerson,
      _editingPerson: { ...draftPerson },
      showDrawer: true,
      showSpousePicker: false,
      spousePickerQuery: '',
      spousePickerResults: [],
      spousePickerCurrentIndex: 0,
      spousePickerTargetId: mainPersonId,
      spousePickerTargetName: '',
      spousePickerMode: '',
      spousePickerMatchKey: '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建',
      ...this._emptyProfileContext(),
      creatingProfile: true,
      _hometownHint: ''
    });
  },

  _openSpousePicker(db, mainPersonId) {
    const currentPerson = db.people[mainPersonId];
    const targetName = this._computeDisplayName({ ...currentPerson, id: mainPersonId });
    this.setData({
      db,
      showSpousePicker: true,
      spousePickerQuery: '',
      spousePickerTargetId: mainPersonId,
      spousePickerTargetName: targetName,
      spousePickerResults: this._buildSpousePickerResults(db, mainPersonId, ''),
      spousePickerCurrentIndex: 0,
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建'
    });
  },

  closeSpousePicker() {
    this.setData({
      showSpousePicker: false,
      spousePickerQuery: '',
      spousePickerResults: [],
      spousePickerCurrentIndex: 0,
      spousePickerTargetId: '',
      spousePickerTargetName: '',
      spousePickerMode: '',
      spousePickerMatchKey: '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建'
    });
  },

  onSpousePickerInput(e) {
    const query = (e.detail && e.detail.value) || '';
    const db = this.data.db || { people: {} };
    const mainPersonId = this.data.spousePickerTargetId;
    this.setData({
      spousePickerQuery: query,
      spousePickerResults: this._buildSpousePickerResults(db, mainPersonId, query),
      spousePickerCurrentIndex: 0
    });
  },

  onCreateNewSpouseFromPicker() {
    const mainPersonId = this.data.spousePickerTargetId || this.data.editingId;
    const db = this.data.db || { people: {} };
    const currentPerson = db.people[mainPersonId];
    if (!currentPerson) {
      wx.showToast({ title: '找不到当前成员', icon: 'none' });
      this.closeSpousePicker();
      return;
    }
    this._startNewSpouse(mainPersonId, currentPerson);
  },

  onContinueNewSpouse() {
    const key = this.data.spousePickerMatchKey || '';
    const mode = this.data.spousePickerMode || '';
    if (key) this._spouseMatchSkippedKey = key;
    this.setData({
      showSpousePicker: false,
      spousePickerQuery: '',
      spousePickerResults: [],
      spousePickerCurrentIndex: 0,
      spousePickerMode: '',
      spousePickerMatchKey: '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建'
    }, () => {
      if (mode === 'commit') this._doCommitNewPerson();
    });
  },

  _maybeShowLiveExistingProfileMatches(draftPerson) {
    if (!this.data.creatingProfile || !draftPerson || this.data.showSpousePicker) return;

    const isSpouse = !!draftPerson._isNewSpouse;
    const isRelation = !!(draftPerson._isNewChild || draftPerson._isNewFather);
    if (!isSpouse && !isRelation) return;

    const matchKey = isSpouse
      ? this._spouseMatchKey(draftPerson)
      : this._relationMatchKey(draftPerson);

    if (!matchKey || matchKey === this._spouseMatchSkippedKey || matchKey === this._lastLiveMatchKey) {
      return;
    }

    const db = this.data.db || { activeRootId: null, people: {} };
    const matches = isSpouse
      ? this._buildSpouseMatchResults(db, draftPerson._mainPersonId, draftPerson)
      : this._buildRelationMatchResults(db, draftPerson);

    this._lastLiveMatchKey = matchKey;
    if (!matches.length) return;

    if (isSpouse) {
      this._showSpouseMatchPrompt(draftPerson._mainPersonId, matches, 'live', matchKey);
    } else {
      this._showRelationMatchPrompt(draftPerson, matches, 'live', matchKey);
    }
  },

  _draftHasGivenName(draftPerson) {
    if (!draftPerson) return false;
    const firstname = String(draftPerson.firstname || '').trim();
    const fullName = String(draftPerson.name || '').trim();
    const surname = String(draftPerson.surname || '').trim();
    if (firstname) return true;
    if (!fullName) return false;
    if (surname && (fullName === surname || fullName === `${surname}氏`)) return false;
    if (!firstname && fullName.endsWith('氏')) return false;
    return true;
  },

  _relationMatchKey(draftPerson) {
    if (!draftPerson || !this._draftHasGivenName(draftPerson)) return '';
    const type = draftPerson._isNewFather ? 'father' : (draftPerson._isNewChild ? 'child' : '');
    if (!type) return '';
    const targetId = draftPerson._childId || draftPerson._parentId || '';
    const parts = [
      type,
      targetId,
      draftPerson.gender || '',
      draftPerson.surname || '',
      draftPerson.firstname || '',
      draftPerson.name || ''
    ].map(v => String(v || '').trim().toLowerCase());
    return parts.join('|');
  },

  _normalizeProfileMatchText(value) {
    return String(value || '').trim().replace(/\s+/g, '').toLowerCase();
  },

  _profileExactNameKeys(person) {
    if (!person) return [];
    const keys = new Set();
    [
      person.name,
      this._computeDisplayName(person),
      `${String(person.surname || '').trim()}${String(person.firstname || '').trim()}`
    ].forEach(value => {
      const key = this._normalizeProfileMatchText(value);
      if (key) keys.add(key);
    });
    return Array.from(keys);
  },

  _draftExactNameKeys(draftPerson) {
    if (!draftPerson) return [];
    const keys = new Set();
    const fullName = this._normalizeProfileMatchText(draftPerson.name);
    const surname = this._normalizeProfileMatchText(draftPerson.surname);
    const firstname = this._normalizeProfileMatchText(draftPerson.firstname);
    if (fullName) keys.add(fullName);
    if (surname && firstname) keys.add(`${surname}${firstname}`);
    return Array.from(keys);
  },

  _matchesProfileDraftName(person, draftPerson) {
    const draftKeys = this._draftExactNameKeys(draftPerson);
    if (!draftKeys.length) return false;
    const personKeys = new Set(this._profileExactNameKeys(person));
    return draftKeys.some(key => personKeys.has(key));
  },

  _isPortableProfileCandidate(person) {
    if (!person) return false;
    return person.gender === 'male' || !person.children || person.children.length === 0;
  },

  _buildRelationMatchResults(db, draftPerson) {
    const people = (db && db.people) || {};
    const type = draftPerson._isNewFather ? 'father' : 'child';
    const expectedGender = type === 'father' ? 'male' : (draftPerson.gender || '');
    const targetId = type === 'father' ? draftPerson._childId : draftPerson._parentId;
    const targetRoot = this._extractProgenitorId(targetId || '');
    const targetPerson = people[targetId];
    const targetWorkspaceId = this._personWorkspaceId(targetPerson, targetId, db);

    return Object.entries(people)
      .filter(([id, person]) => {
        if (!person || id === targetId) return false;
        if (expectedGender && person.gender !== expectedGender) return false;
        if (!this._isPortableProfileCandidate(person)) return false;
        if (type === 'father' && this._extractProgenitorId(id) === targetRoot) return false;
        if (type === 'child' && this._isAncestorOf(id, targetId)) return false;
        return this._matchesProfileDraftName(person, draftPerson);
      })
      .map(([id, person]) => this._decorateSpouseCandidate(person, id, db, targetWorkspaceId))
      .sort((a, b) => {
        const aSameFamily = targetRoot && this._extractProgenitorId(a.id) === targetRoot ? 1 : 0;
        const bSameFamily = targetRoot && this._extractProgenitorId(b.id) === targetRoot ? 1 : 0;
        if (aSameFamily !== bSameFamily) return aSameFamily - bSameFamily;
        if (a._workspaceRank !== b._workspaceRank) return a._workspaceRank - b._workspaceRank;
        const ay = Number(a.bYear || 9999);
        const by = Number(b.bYear || 9999);
        if (ay !== by) return ay - by;
        return (a._displayName || '').localeCompare(b._displayName || '');
      })
      .slice(0, 12);
  },

  _isAncestorOf(ancestorId, personId) {
    let current = personId;
    while (current) {
      const fatherId = this._getFatherId(current);
      if (!fatherId) return false;
      if (fatherId === ancestorId) return true;
      current = fatherId;
    }
    return false;
  },

  _showRelationMatchPrompt(draftPerson, matches, mode, matchKey) {
    const isFather = !!draftPerson._isNewFather;
    const targetId = draftPerson._childId || draftPerson._parentId || '';
    const targetPerson = this.data.db && this.data.db.people ? this.data.db.people[targetId] : null;
    const targetName = targetPerson ? this._computeDisplayName({ ...targetPerson, id: targetId }) : '';
    this.setData({
      showSpousePicker: true,
      spousePickerQuery: '',
      spousePickerTargetId: targetId,
      spousePickerTargetName: targetName,
      spousePickerResults: matches,
      spousePickerCurrentIndex: 0,
      spousePickerMode: mode || '',
      spousePickerMatchKey: matchKey || '',
      spousePickerRelationType: isFather ? 'father' : 'child',
      spousePickerTitle: isFather ? '父亲可能已存在' : '子女可能已存在',
      spousePickerHint: '按姓名和性别匹配；选用后会按当前位置重排编号，并保留其原有支线。',
      spousePickerNewLabel: isFather ? '继续新建父亲' : '继续新建子女'
    });
  },

  _showSpouseMatchPrompt(mainPersonId, matches, mode, matchKey) {
    const mainPerson = this.data.db && this.data.db.people
      ? this.data.db.people[mainPersonId]
      : null;
    const targetName = mainPerson ? this._computeDisplayName({ ...mainPerson, id: mainPersonId }) : '';
    this.setData({
      showSpousePicker: true,
      spousePickerQuery: '',
      spousePickerTargetId: mainPersonId,
      spousePickerTargetName: targetName,
      spousePickerResults: matches,
      spousePickerCurrentIndex: 0,
      spousePickerMode: mode || '',
      spousePickerMatchKey: matchKey || '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建'
    });
  },

  _spouseMatchKey(draftPerson) {
    if (!draftPerson || !draftPerson._isNewSpouse || !this._draftHasGivenName(draftPerson)) return '';
    const parts = [
      draftPerson._mainPersonId || '',
      draftPerson.gender || '',
      draftPerson.surname || '',
      draftPerson.firstname || '',
      draftPerson.name || ''
    ].map(v => String(v || '').trim().toLowerCase());
    if (!parts[2] && !parts[3] && !parts[4]) return '';
    return parts.join('|');
  },

  _buildSpouseMatchResults(db, mainPersonId, draftPerson) {
    const people = (db && db.people) || {};
    const mainPerson = people[mainPersonId];
    if (!mainPerson || !draftPerson) return [];

    const linked = new Set(mainPerson.spouses || []);
    Object.entries(people).forEach(([id, person]) => {
      if ((person.spouses || []).includes(mainPersonId)) linked.add(id);
    });

    const expectedGender = draftPerson.gender || (
      mainPerson.gender === 'male'
        ? 'female'
        : (mainPerson.gender === 'female' ? 'male' : '')
    );
    const mainWorkspaceId = this._personWorkspaceId(mainPerson, mainPersonId, db);

    return Object.entries(people)
      .filter(([id, person]) => {
        if (id === mainPersonId || linked.has(id)) return false;
        if (expectedGender && person.gender !== expectedGender) return false;
        return this._matchesSpouseDraftName(person, draftPerson);
      })
      .map(([id, person]) => this._decorateSpouseCandidate(person, id, db, mainWorkspaceId))
      .sort((a, b) => {
        const aSameFamily = this._isSamePaternalFamily(mainPersonId, a.id) ? 1 : 0;
        const bSameFamily = this._isSamePaternalFamily(mainPersonId, b.id) ? 1 : 0;
        if (aSameFamily !== bSameFamily) return aSameFamily - bSameFamily;
        const ay = Number(a.bYear || 9999);
        const by = Number(b.bYear || 9999);
        if (ay !== by) return ay - by;
        return (a._displayName || '').localeCompare(b._displayName || '');
      })
      .slice(0, 12);
  },

  _isSamePaternalFamily(aId, bId) {
    const aRoot = this._extractProgenitorId(aId || '');
    const bRoot = this._extractProgenitorId(bId || '');
    return !!(aRoot && bRoot && aRoot === bRoot);
  },

  _matchesSpouseDraftName(person, draftPerson) {
    const draftKeys = this._draftExactNameKeys(draftPerson);
    if (!draftKeys.length) return false;
    const personKeys = new Set(this._profileExactNameKeys(person));
    return draftKeys.some(key => personKeys.has(key));
  },

  _buildSpousePickerResults(db, mainPersonId, query) {
    const people = (db && db.people) || {};
    const mainPerson = people[mainPersonId];
    if (!mainPerson) return [];

    const mainWorkspaceId = this._personWorkspaceId(mainPerson, mainPersonId, db);
    const linked = new Set(mainPerson.spouses || []);
    Object.entries(people).forEach(([id, person]) => {
      if ((person.spouses || []).includes(mainPersonId)) linked.add(id);
    });

    const keywords = String(query || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const oppositeGender = mainPerson.gender === 'male'
      ? 'female'
      : (mainPerson.gender === 'female' ? 'male' : '');

    return Object.entries(people)
      .filter(([id, person]) => {
        if (id === mainPersonId || linked.has(id)) return false;
        if (oppositeGender && person.gender !== oppositeGender) return false;
        return true;
      })
      .map(([id, person]) => this._decorateSpouseCandidate(person, id, db, mainWorkspaceId))
      .filter(item => {
        if (keywords.length === 0) return true;
        return keywords.some(word => item._searchText.includes(word));
      })
      .sort((a, b) => {
        const aOpp = oppositeGender && a.gender === oppositeGender ? 0 : 1;
        const bOpp = oppositeGender && b.gender === oppositeGender ? 0 : 1;
        if (aOpp !== bOpp) return aOpp - bOpp;
        const aSameFamily = this._isSamePaternalFamily(mainPersonId, a.id) ? 1 : 0;
        const bSameFamily = this._isSamePaternalFamily(mainPersonId, b.id) ? 1 : 0;
        if (aSameFamily !== bSameFamily) return aSameFamily - bSameFamily;
        if (a._workspaceRank !== b._workspaceRank) return a._workspaceRank - b._workspaceRank;
        const ay = Number(a.bYear || 9999);
        const by = Number(b.bYear || 9999);
        if (ay !== by) return ay - by;
        return (a._displayName || '').localeCompare(b._displayName || '');
      })
      .slice(0, 40);
  },

  _decorateSpouseCandidate(person, id, db, mainWorkspaceId) {
    const p = this._decorateProfilePerson({ ...person, id });
    const workspaceId = this._personWorkspaceId(person, id, db);
    const sameWorkspace = workspaceId === mainWorkspaceId;
    const rootId = this._extractProgenitorId(id);
    const root = rootId && db.people ? db.people[rootId] : null;
    const rootName = root ? this._computeDisplayName({ ...root, id: rootId }) : '';
    const fields = [
      id,
      p._displayName,
      person.name,
      person.surname,
      person.firstname,
      person.alias,
      person.hometown,
      person.bYear,
      person.dYear,
      person.bDate,
      person.dDate,
      person.bPlace,
      person.dPlace,
      rootName
    ];

    return {
      ...p,
      id,
      _lifeLabel: this._formatCandidateLife(person),
      _workspaceId: workspaceId,
      _workspaceRank: sameWorkspace ? 0 : 1,
      _workspaceLabel: sameWorkspace ? '本家谱' : '其他家谱',
      _progenitorName: rootName,
      _searchText: fields.map(v => String(v || '').toLowerCase()).join(' '),
      _preview: this._buildCandidatePreview(id, db)
    };
  },

  _formatCandidateLife(person) {
    const b = person && person.bYear ? String(person.bYear) : '';
    const d = person && person.dYear ? String(person.dYear) : '';
    return formatLifeRange(b, d, {
      birthFallback: '',
      deathFallback: ''
    });
  },

  _buildCandidatePaternalRows(id, db) {
    const rows = [];
    const father = this._getFather(id, db);
    const grandfather = father ? this._getFather(father.id, db) : null;
    const greatGrandfather = grandfather ? this._getFather(grandfather.id, db) : null;
    if (greatGrandfather) rows.push({ label: '曾祖', ...this._decorateProfilePerson(greatGrandfather) });
    if (grandfather) rows.push({ label: '祖', ...this._decorateProfilePerson(grandfather) });
    if (father) rows.push({ label: '父', ...this._decorateProfilePerson(father) });
    return rows;
  },

  _buildCandidateSpouses(id, db) {
    const people = (db && db.people) || {};
    const person = people[id] || {};
    const spouseIds = new Set(person.spouses || []);
    Object.entries(people).forEach(([otherId, other]) => {
      if (other && (other.spouses || []).includes(id)) spouseIds.add(otherId);
    });
    return Array.from(spouseIds)
      .map(spouseId => people[spouseId] ? this._decorateProfilePerson({ ...people[spouseId], id: spouseId }) : null)
      .filter(Boolean);
  },

  _buildCandidateChildren(id, db) {
    const people = (db && db.people) || {};
    const person = people[id] || {};
    const childIds = [];
    const addChild = childId => {
      if (!childId || !people[childId] || childIds.includes(childId)) return;
      childIds.push(childId);
    };
    if (person.gender === 'male') (person.children || []).forEach(addChild);
    if (person.gender === 'female') {
      Object.entries(people).forEach(([childId, child]) => {
        if (child && child.motherId === id) addChild(childId);
      });
    }
    return childIds
      .map(childId => this._decorateProfilePerson({ ...people[childId], id: childId }))
      .filter(Boolean);
  },

  _buildCandidatePreview(id, db) {
    return {
      paternalRows: this._buildCandidatePaternalRows(id, db),
      spouses: this._buildCandidateSpouses(id, db),
      children: this._buildCandidateChildren(id, db)
    };
  },

  onSpousePickerSwipe(e) {
    const current = Number(e && e.detail && e.detail.current);
    if (!Number.isFinite(current)) return;
    this.setData({ spousePickerCurrentIndex: current });
  },

  onConfirmCurrentExistingSpouse() {
    const current = (this.data.spousePickerResults || [])[this.data.spousePickerCurrentIndex || 0];
    if (!current || !current.id) return;
    this.onSelectExistingSpouse({ currentTarget: { dataset: { id: current.id } } });
  },

  onSelectExistingSpouse(e) {
    const spouseId = e.currentTarget.dataset.id;
    const relationType = this.data.spousePickerRelationType || 'spouse';
    if (relationType === 'child' || relationType === 'father') {
      this._selectExistingForNewRelation(spouseId, relationType);
      return;
    }

    const mainPersonId = this.data.spousePickerTargetId
      || (this.data.draftPerson && this.data.draftPerson._mainPersonId)
      || this.data.editingId;
    if (!spouseId || !mainPersonId || spouseId === mainPersonId) return;

    let db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    const mainPerson = db.people[mainPersonId];
    const spouse = db.people[spouseId];
    if (!mainPerson || !spouse) {
      wx.showToast({ title: '找不到成员', icon: 'none' });
      return;
    }

    if (!mainPerson.spouses) mainPerson.spouses = [];
    if (!spouse.spouses) spouse.spouses = [];
    if (!mainPerson.spouses.includes(spouseId)) mainPerson.spouses.push(spouseId);
    if (!spouse.spouses.includes(mainPersonId)) spouse.spouses.push(mainPersonId);

    const mainWorkspaceId = this._ensurePersonWorkspaceId(db, mainPersonId);
    const spouseWorkspaceId = this._ensurePersonWorkspaceId(db, spouseId);
    const merged = !!(mainWorkspaceId && spouseWorkspaceId && mainWorkspaceId !== spouseWorkspaceId);
    if (merged) this._mergeWorkspaceInto(db, spouseWorkspaceId, mainWorkspaceId);

    db = this._migrateRemoveDerivedIds(db, false);
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    this.setData({
      db,
      showSpousePicker: false,
      spousePickerQuery: '',
      spousePickerResults: [],
      spousePickerCurrentIndex: 0,
      spousePickerTargetId: '',
      spousePickerTargetName: '',
      spousePickerMode: '',
      spousePickerMatchKey: '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建'
    }, () => {
      this.refreshTree();
      this.onNodeTap({ id: mainPersonId });
      wx.showToast({
        title: merged ? '已关联并合并家谱' : '已关联配偶',
        icon: 'success'
      });
    });
  },

  _selectExistingForNewRelation(existingId, relationType) {
    const draftPerson = this.data.draftPerson || {};
    let db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    const existing = db.people && db.people[existingId];
    if (!existing || !this._isPortableProfileCandidate(existing)) {
      wx.showToast({ title: '该成员不能移入当前位置', icon: 'none' });
      return;
    }

    let focusId = existingId;
    let renameMap = {};
    let toastTitle = '已选择 existing profile';

    if (relationType === 'child') {
      const parentId = draftPerson._parentId;
      const parent = db.people[parentId];
      if (!parent || parent.gender !== 'male') {
        wx.showToast({ title: '找不到父节点', icon: 'none' });
        return;
      }

      const result = this._connectExistingChildWithLexRoot(db, parentId, existingId);
      if (!result.ok) {
        wx.showToast({ title: result.message || '无法重排编号', icon: 'none' });
        return;
      }
      db = result.db;
      focusId = result.focusId || parentId;
      renameMap = result.renameMap || {};
      toastTitle = '已移入为子女';
    } else if (relationType === 'father') {
      const childId = draftPerson._childId;
      const child = db.people[childId];
      if (!child || !this._isProgenitor(childId)) {
        wx.showToast({ title: '只能给始祖添加父亲', icon: 'none' });
        return;
      }
      if (this._extractProgenitorId(existingId) === this._extractProgenitorId(childId)) {
        wx.showToast({ title: '同一父系内不能选作父亲', icon: 'none' });
        return;
      }

      const result = this._connectExistingFatherWithLexRoot(db, childId, existingId);
      if (!result.ok) {
        wx.showToast({ title: result.message || '无法重排编号', icon: 'none' });
        return;
      }
      db = result.db;
      focusId = result.focusId || db.activeRootId;
      renameMap = result.renameMap || {};
      toastTitle = '已移入为父亲';
    } else {
      return;
    }

    db = this._migrateRemoveDerivedIds(db, false);
    const collapsedNodes = (this.data.collapsedNodes || []).reduce((list, id) => {
      const nextId = renameMap[id] || id;
      if (db.people[nextId] && !list.includes(nextId)) list.push(nextId);
      return list;
    }, []);
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    this.setData({
      db,
      collapsedNodes,
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      draftPerson: {},
      _editingPerson: {},
      _pendingEdits: {},
      _pendingMotherSelected: false,
      showSpousePicker: false,
      spousePickerQuery: '',
      spousePickerResults: [],
      spousePickerCurrentIndex: 0,
      spousePickerTargetId: '',
      spousePickerTargetName: '',
      spousePickerMode: '',
      spousePickerMatchKey: '',
      spousePickerRelationType: 'spouse',
      spousePickerTitle: '可能已存在',
      spousePickerHint: '按姓名和性别匹配，其他父系优先；同一父系的可能人选列在后面。',
      spousePickerNewLabel: '继续新建',
      ...this._emptyProfileContext()
    }, () => {
      this.refreshTree();
      this.onNodeTap({ id: focusId });
      wx.showToast({ title: toastTitle, icon: 'success' });
    });
  },

  _ensurePersonWorkspaceId(db, personId) {
    const person = db && db.people && db.people[personId];
    if (!person) return '';
    const wsId = this._personWorkspaceId(person, personId, db);
    if (wsId && person.workspaceId !== wsId) person.workspaceId = wsId;
    return wsId;
  },

  _assignWorkspaceToSubtree(db, rootId, workspaceId) {
    if (!db || !db.people || !rootId || !workspaceId) return 0;
    let changed = 0;
    Object.entries(db.people).forEach(([id, person]) => {
      if (this._isSubtreeId(id, rootId) && person.workspaceId !== workspaceId) {
        person.workspaceId = workspaceId;
        changed++;
      }
    });
    return changed;
  },

  _mergeWorkspaceInto(db, fromWorkspaceId, toWorkspaceId) {
    if (!db || !db.people || !fromWorkspaceId || !toWorkspaceId || fromWorkspaceId === toWorkspaceId) {
      return 0;
    }
    let changed = 0;
    Object.entries(db.people).forEach(([id, person]) => {
      if (this._personWorkspaceId(person, id, db) === fromWorkspaceId) {
        person.workspaceId = toWorkspaceId;
        changed++;
      }
    });
    (db.timelineEvents || []).forEach(event => {
      if (event && this._getTimelineEventWorkspaceId(event, db) === fromWorkspaceId) {
        event.workspaceId = toWorkspaceId;
        changed++;
      }
    });
    return changed;
  },

  _deleteInfo(db, personId) {
    const people = (db && db.people) || {};
    const person = people[personId];
    if (!person) {
      return { ok: false, message: '找不到要删除的成员' };
    }

    const realChildren = (person.children || []).filter(id => people[id]);
    const spouses = (person.spouses || []).filter(id => people[id]);
    const fatherId = this._getFatherId(personId);
    const hasFather = !!(fatherId && people[fatherId]);

    if (realChildren.length === 0 && spouses.length + (hasFather ? 1 : 0) <= 1) {
      return { ok: true, mode: 'leaf' };
    }

    if (
      this._isProgenitor(personId)
      && person.gender === 'male'
      && realChildren.length === 1
      && spouses.length === 0
      && this._getFatherId(realChildren[0]) === personId
    ) {
      return { ok: true, mode: 'promoteOnlyChild', childId: realChildren[0] };
    }

    return { ok: false, message: '只能删除无子女且只连接一位父系亲属或配偶的成员，或只有一个子女且无配偶的始祖' };
  },

  _removePersonReferences(db, deletedId) {
    Object.values((db && db.people) || {}).forEach(person => {
      if (person.children) {
        person.children = person.children.filter(id => id !== deletedId);
      }
      if (person.spouses) {
        person.spouses = person.spouses.filter(id => id !== deletedId);
      }
      if (person.motherId === deletedId) {
        person.motherId = '';
      }
    });
  },

  _deleteLeafPerson(db, deletedId) {
    delete db.people[deletedId];
    this._removePersonReferences(db, deletedId);
    if (db.activeRootId === deletedId) {
      db.activeRootId = Object.keys(db.people).find(id => this._isProgenitor(id)) || null;
    }
    return { db, renameMap: {} };
  },

  _deleteProgenitorAndPromoteOnlyChild(db, deletedId, childId) {
    const deletedPerson = db.people[deletedId];
    const workspaceId = (deletedPerson && deletedPerson.workspaceId)
      || (db.people[childId] && db.people[childId].workspaceId)
      || '';
    const renameMap = this._buildSubtreeRenameMap(db, childId, deletedId);

    delete db.people[deletedId];
    this._removePersonReferences(db, deletedId);

    if (this._renameMapHasCollision(db, renameMap)) {
      return { db, ok: false, message: '无法提升子女，目标编号已有成员' };
    }

    db = this._applyIdRenameMap(db, renameMap);
    if (db.people[deletedId]) {
      db.people[deletedId].motherId = '';
      if (workspaceId) {
        db.people[deletedId].workspaceId = workspaceId;
        this._assignWorkspaceToSubtree(db, deletedId, workspaceId);
      }
    }
    db.activeRootId = deletedId;
    return { db, ok: true, renameMap };
  },

  onDelete() {
    const deletingId = this.data.editingId;
    const info = this._deleteInfo(this.data.db, deletingId);
    if (!info.ok) {
      wx.showToast({ title: info.message || '当前成员不能删除', icon: 'none' });
      return;
    }

    const content = info.mode === 'promoteOnlyChild'
      ? '将删除该始祖，并把唯一子女提升为新的始祖，相关编号会自动上移。此操作不可撤销。'
      : '将永久删除该成员，此操作不可撤销。';

    wx.showModal({
      title: '确认删除',
      content,
      confirmColor: '#c62828',
      success: (res) => {
        if (!res.confirm) return;
        let db = JSON.parse(JSON.stringify(this.data.db));
        const deletedId = this.data.editingId;
        const deleteInfo = this._deleteInfo(db, deletedId);
        if (!deleteInfo.ok) {
          wx.showToast({ title: deleteInfo.message || '当前成员不能删除', icon: 'none' });
          return;
        }

        let renameMap = {};
        if (deleteInfo.mode === 'promoteOnlyChild') {
          const result = this._deleteProgenitorAndPromoteOnlyChild(db, deletedId, deleteInfo.childId);
          if (!result.ok) {
            wx.showToast({ title: result.message || '删除失败', icon: 'none' });
            return;
          }
          db = result.db;
          renameMap = result.renameMap || {};
        } else {
          const result = this._deleteLeafPerson(db, deletedId);
          db = result.db;
        }

        db = this._migrateRemoveDerivedIds(db, false);
        const collapsedNodes = (this.data.collapsedNodes || []).reduce((list, id) => {
          if (id === deletedId) return list;
          const nextId = renameMap[id] || id;
          if (db.people[nextId] && !list.includes(nextId)) list.push(nextId);
          return list;
        }, []);

        this._layoutCache = { standard: null, timeline: null };
        this.setData({
          db,
          collapsedNodes,
          showDrawer: false,
          editingId: '',
          creatingProfile: false,
          _editingPerson: {},
          _pendingEdits: {},
          _pendingMotherSelected: false,
          ...this._emptyProfileContext()
        }, () => this.refreshTree());
        this._saveData(db);
      }
    });
  },

  // Import / export / reset
  // ─────────────────────────────────────────────

  onImport() {
    wx.showActionSheet({
      itemList: ['粘贴 JSON 文本', '从微信聊天选择 JSON 文件'],
      success: (sheet) => {
        if (sheet.tapIndex === 0) {
          this.openJsonImportPanel();
        } else if (sheet.tapIndex === 1) {
          this._importFromChatFile();
        }
      }
    });
  },

  _importFromChatFile() {
    Data.importFromChat()
      .then(result => {
        this._showImportModeSheet(result.db);
      })
      .catch(err => {
        if (err && err.errMsg && err.errMsg.includes('cancel')) return;
        console.error('[import] failed:', err);
        wx.showModal({
          title: '导入失败',
          content: err && err.message ? err.message : '请选择有效的家谱 JSON 文件。',
          showCancel: false
        });
      });
  },

  openJsonImportPanel() {
    this.setData({
      showJsonImportPanel: true,
      showAiImportPanel: false,
      showProgenitorDropdown: false,
      jsonImportText: ''
    });
  },

  closeJsonImportPanel() {
    this.setData({ showJsonImportPanel: false });
  },

  onJsonImportTextInput(e) {
    this.setData({ jsonImportText: String((e.detail && e.detail.value) || '') });
  },

  pasteJsonImportFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        this.setData({ jsonImportText: String((res && res.data) || '') });
        wx.showToast({ title: '已粘贴', icon: 'success' });
      },
      fail: () => wx.showToast({ title: '无法读取剪贴板', icon: 'none' })
    });
  },

  onChooseImportFile() {
    this.setData({ showJsonImportPanel: false }, () => {
      this._importFromChatFile();
    });
  },

  onImportJsonText() {
    const text = this._extractJsonFromText(this.data.jsonImportText);
    if (!text) {
      wx.showToast({ title: '请先粘贴 JSON', icon: 'none' });
      return;
    }
    try {
      const importedDb = Data.normalizeImportData(JSON.parse(text));
      this.setData({ showJsonImportPanel: false }, () => {
        this._showImportModeSheet(importedDb);
      });
    } catch (err) {
      console.error('[text import] failed:', err);
      wx.showModal({
        title: 'JSON 无法导入',
        content: err && err.message ? err.message : '请确认粘贴的是完整 JSON，或改为选择文件。',
        showCancel: false
      });
    }
  },

  _showImportModeSheet(importedDb) {
    const preparedDb = this._prepareImportedDb(importedDb);
    const conflicts = this._getWorkspaceConflictIds(preparedDb, this.data.db);
    const count = Object.keys(preparedDb.people || {}).length;
    const itemList = conflicts.length
      ? [`覆盖本机同一家谱（${count}人）`, `作为新家谱导入（${count}人）`]
      : [`导入为新家谱（${count}人）`, '替换本机全部数据'];

    wx.showActionSheet({
      itemList,
      success: (sheet) => {
        const mode = conflicts.length
          ? (sheet.tapIndex === 0 ? 'replaceWorkspace' : 'newWorkspace')
          : (sheet.tapIndex === 0 ? 'merge' : 'replaceAll');
        this._applyImportedDb(preparedDb, mode, conflicts);
      }
    });
  },

  _prepareImportedDb(importedDb) {
    let db = JSON.parse(JSON.stringify(importedDb || { activeRootId: null, people: {} }));
    db = this._migrateIdFormat(db, false);
    db = this._normalizeDbIdsForSchema(db);
    db = this._migrateWorkspaceId(db, false);
    db = this._migrateRemoveDerivedIds(db, false);
    db = this._ensureTimelineEvents(db);
    return db;
  },

  _personWorkspaceId(person, id, db) {
    return String(
      (person && person.workspaceId)
      || this._extractProgenitorId(id)
      || (db && db.activeRootId)
      || ''
    );
  },

  _getWorkspaceIds(db) {
    const ids = new Set();
    Object.entries((db && db.people) || {}).forEach(([id, person]) => {
      const wsId = this._personWorkspaceId(person, id, db);
      if (wsId) ids.add(wsId);
    });
    return ids;
  },

  _getTimelineEventWorkspaceId(event, db) {
    const explicit = String(event && (event.workspaceId || event.workspace || event.sharedId) || '').trim();
    if (explicit) return explicit;
    const workspaces = Array.from(this._getWorkspaceIds(db));
    if (workspaces.length === 1) return workspaces[0];
    return '';
  },

  _makeTimelineEventId(db, scope, key) {
    const used = new Set(((db && db.timelineEvents) || []).map(event => event.id).filter(Boolean));
    const safeScope = String(scope || 'global').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeKey = String(key || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
    let id = `evt_${safeScope}_${safeKey}`;
    let index = 1;
    while (used.has(id)) {
      id = `evt_${safeScope}_${safeKey}_${index++}`;
    }
    used.add(id);
    return id;
  },

  _dedupeTimelineEventIds(events) {
    const used = new Set();
    return (Array.isArray(events) ? events : []).map((event, index) => {
      if (!event) return event;
      let id = event.id || `event_${index}`;
      while (used.has(id)) id = `${id}_${index}`;
      used.add(id);
      return { ...event, id };
    }).filter(Boolean);
  },

  _isCurrentYearTimelineEvent(event) {
    if (!event) return false;
    const id = String(event.id || '');
    const key = String(event.key || '');
    return !!event.isCurrentYear || key === 'current-year' || id === 'current-year' || id.includes('_current-year');
  },

  _isDefaultTimelineEvent(event) {
    if (!event) return false;
    const key = String(event.key || '');
    const id = String(event.id || '');
    return DEFAULT_TIMELINE_EVENTS.some(item => (
      key === item.key || id.includes(`_${item.key}`)
    ));
  },

  _getTimelineEventDefault(event) {
    if (!event) return null;
    const key = String(event.key || '');
    const id = String(event.id || '');
    const name = String(event.name || event.title || event.label || '').trim();
    return DEFAULT_TIMELINE_EVENTS.find(item => (
      key === item.key
      || id.includes(`_${item.key}`)
      || (item.key === 'boxer' && ['\u4e49\u548c\u56e2', '\u5e9a\u5b50 1900', '\u5e9a\u5b50'].includes(name))
      || (item.key === 'xinhai' && ['\u8f9b\u4ea5 1911', '\u8f9b\u4ea5'].includes(name))
    )) || null;
  },

  _profileYearValue(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    const match = text.match(/^-?\d{1,4}/);
    if (!match) return null;
    const year = parseInt(match[0], 10);
    return Number.isFinite(year) ? year : null;
  },

  _getProfileYearRangeForIds(db = this.data.db, ids = []) {
    const people = (db && db.people) || {};
    let minYear = Infinity;
    let maxYear = -Infinity;
    const addYear = (year) => {
      if (!Number.isFinite(year)) return;
      minYear = Math.min(minYear, year);
      maxYear = Math.max(maxYear, year);
    };

    (ids || []).forEach(id => {
      const person = people[id];
      if (!person) return;
      addYear(this._profileYearValue(person.bYear || person.bDate));
      addYear(this._profileYearValue(person.dYear || person.dDate));
      (Array.isArray(person.events) ? person.events : []).forEach(event => {
        (this._timelineEventYearRangesFromEvent(event || {}) || []).forEach(range => {
          addYear(parseInt(range.startYear, 10));
          addYear(parseInt(range.endYear, 10));
        });
      });
    });

    if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) return null;
    return { minYear, maxYear };
  },

  _getProfileYearRangeFromNodes(db = this.data.db, nodes = this.data.nodes) {
    const ids = Array.from(new Set((nodes || []).map(node => node && node.id).filter(Boolean)));
    return this._getProfileYearRangeForIds(db, ids);
  },

  _getWorkspaceProfileYearRange(db = this.data.db) {
    const currentWorkspaceId = this._getCurrentWorkspaceIdFromDb(db);
    const ids = Object.entries((db && db.people) || {})
      .filter(([id, person]) => !currentWorkspaceId || this._personWorkspaceId(person, id, db) === currentWorkspaceId)
      .map(([id]) => id);
    return this._getProfileYearRangeForIds(db, ids);
  },

  _defaultTimelineEventNearProfileDates(event, db = this.data.db, profileRange = null) {
    const ranges = this._timelineEventYearRangesFromEvent(event || {});
    profileRange = profileRange || this._getWorkspaceProfileYearRange(db);
    if (!ranges || !ranges.length || !profileRange) return false;
    const minYear = profileRange.minYear - DEFAULT_TIMELINE_EVENT_PROXIMITY_YEARS;
    const maxYear = profileRange.maxYear + DEFAULT_TIMELINE_EVENT_PROXIMITY_YEARS;
    return ranges.some(range => {
      const start = parseInt(range.startYear, 10);
      const end = parseInt(range.endYear, 10);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
      return end >= minYear && start <= maxYear;
    });
  },

  _shouldDisplayTimelineEventInLayout(event, db = this.data.db, profileRange = null) {
    if (!this._isDefaultTimelineEvent(event)) return true;
    if (this._timelineEventChangedFromDefault(event)) return true;
    return this._defaultTimelineEventNearProfileDates(event, db, profileRange);
  },

  _timelineEventChangedFromDefault(event) {
    const def = this._getTimelineEventDefault(event);
    if (!def || !event) return false;
    const years = this._formatTimelineEventYears(event);
    const defYears = this._formatTimelineEventYears(def);
    return String(event.name || event.title || event.label || '').trim() !== String(def.name)
      || years !== defYears;
  },

  _normalizeGlobalTimelineEvent(event, fallbackWorkspaceId = '') {
    if (!event || typeof event !== 'object') return null;
    const normalized = { ...event };
    const workspaceId = String(
      normalized.workspaceId
      || normalized.workspace
      || normalized.sharedId
      || fallbackWorkspaceId
      || ''
    ).trim();
    delete normalized.workspace;
    delete normalized.sharedId;
    if (workspaceId) normalized.workspaceId = workspaceId;
    else delete normalized.workspaceId;
    const def = this._getTimelineEventDefault(normalized);
    if (def) {
      const previousDefaultVersion = Number(normalized.defaultVersion || 0);
      normalized.key = def.key;
      normalized.defaultVersion = '4';
      const name = String(normalized.name || normalized.title || normalized.label || '').trim();
      if (!name || name === '\u4e49\u548c\u56e2' || name === '\u5e9a\u5b50 1900') normalized.name = def.key === 'boxer' ? def.name : normalized.name;
      if (def.key === 'xinhai' && name === '\u8f9b\u4ea5 1911') normalized.name = def.name;
      if (!normalized.name) normalized.name = def.name;
      if (!normalized.year) normalized.year = def.year;
    }
    normalized.name = String(normalized.name || normalized.title || normalized.label || '').trim();
    const ranges = this._timelineEventYearRangesFromEvent(normalized);
    if (!normalized.name || !ranges || !ranges.length) return null;
    const yearLabel = this._formatTimelineEventYearRanges(ranges);
    normalized.year = yearLabel;
    delete normalized.startYear;
    delete normalized.endYear;
    delete normalized.years;
    delete normalized.date;
    delete normalized.yearLabel;
    delete normalized.yearRanges;
    return normalized;
  },

  _mergeGlobalTimelineEvent(existing, incoming) {
    if (!existing) return incoming;
    if (!incoming) return existing;
    const keepIncoming = this._timelineEventChangedFromDefault(incoming)
      && !this._timelineEventChangedFromDefault(existing);
    const merged = keepIncoming ? { ...incoming } : { ...existing };
    if (existing.hidden || incoming.hidden) {
      merged.hidden = true;
    } else {
      delete merged.hidden;
    }
    return merged;
  },

  _timelineEventSortValue(event, field) {
    const ranges = this._timelineEventYearRangesFromEvent(event || {});
    const first = ranges && ranges.length ? ranges[0] : null;
    const value = parseInt((first && (first[field] || first.startYear)) || (event && (event[field] || event.year)) || '', 10);
    return Number.isFinite(value) ? value : 999999;
  },

  _sortTimelineEvents(events) {
    return [...(Array.isArray(events) ? events : [])].sort((a, b) => (
      this._timelineEventSortValue(a, 'startYear') - this._timelineEventSortValue(b, 'startYear')
      || this._timelineEventSortValue(a, 'endYear') - this._timelineEventSortValue(b, 'endYear')
      || String((a && a.name) || '').localeCompare(String((b && b.name) || ''), 'zh-Hans-CN')
    ));
  },

  _ensureTimelineEvents(db) {
    if (!db || !db.people) return db;
    if (!Array.isArray(db.timelineEvents)) db.timelineEvents = [];
    const defaultEvents = {};
    const customEvents = {};
    const workspaceIds = Array.from(this._getWorkspaceIds(db)).filter(Boolean);
    const workspaceHasAnyEvent = {};
    const workspaceHasDefaultEvent = {};
    const addGlobalDefault = (event, workspaceId) => ({
      id: this._makeTimelineEventId(db, `global_${workspaceId || 'workspace'}`, event.key),
      key: event.key,
      defaultVersion: '4',
      name: event.name,
      year: event.year,
      ...(workspaceId ? { workspaceId } : {})
    });

    db.timelineEvents.forEach(rawEvent => {
      if (!rawEvent || this._isCurrentYearTimelineEvent(rawEvent)) return;
      const explicitWorkspaceId = String(rawEvent.workspaceId || rawEvent.workspace || rawEvent.sharedId || '').trim();
      const targetWorkspaceIds = explicitWorkspaceId
        ? [explicitWorkspaceId]
        : (workspaceIds.length ? workspaceIds : ['']);

      targetWorkspaceIds.forEach(workspaceId => {
        const event = this._normalizeGlobalTimelineEvent({
          ...rawEvent,
          ...(workspaceId ? { workspaceId } : {})
        }, workspaceId);
        if (!event) return;
        const eventWorkspaceId = String(event.workspaceId || workspaceId || '').trim();
        if (eventWorkspaceId) workspaceHasAnyEvent[eventWorkspaceId] = true;
        const def = this._getTimelineEventDefault(event);
        if (def) {
          const defaultKey = `${eventWorkspaceId}|${def.key}`;
          workspaceHasDefaultEvent[eventWorkspaceId] = true;
          defaultEvents[defaultKey] = this._mergeGlobalTimelineEvent(defaultEvents[defaultKey], event);
          return;
        }
        const customKey = [
          eventWorkspaceId,
          String(event.name || '').trim(),
          this._formatTimelineEventYears(event)
        ].join('|');
        customEvents[customKey] = this._mergeGlobalTimelineEvent(customEvents[customKey], event);
      });
    });

    workspaceIds.forEach(workspaceId => {
      if (workspaceHasAnyEvent[workspaceId] && !workspaceHasDefaultEvent[workspaceId]) return;
      DEFAULT_TIMELINE_EVENTS.forEach(event => {
        const defaultKey = `${workspaceId}|${event.key}`;
        if (!defaultEvents[defaultKey]) defaultEvents[defaultKey] = addGlobalDefault(event, workspaceId);
        defaultEvents[defaultKey] = {
          ...defaultEvents[defaultKey],
          workspaceId,
          key: event.key,
          defaultVersion: '4'
        };
      });
    });

    db.timelineEvents = this._sortTimelineEvents(this._dedupeTimelineEventIds([
      ...Object.values(defaultEvents),
      ...Object.values(customEvents)
    ]));
    delete db.timelineEventWorkspaces;
    return db;
  },

  _getGlobalTimelineEvents(db = this.data.db) {
    const currentWorkspaceId = this._getCurrentWorkspaceIdFromDb(db);
    return this._sortTimelineEvents(((db && db.timelineEvents) || [])
      .map(event => this._normalizeGlobalTimelineEvent(event))
      .filter(event => {
        if (!event || this._isCurrentYearTimelineEvent(event)) return false;
        const workspaceId = this._getTimelineEventWorkspaceId(event, db);
        return !currentWorkspaceId || workspaceId === currentWorkspaceId;
      }));
  },

  _formatTimelineEventYears(event) {
    return String(event && event.year || '').trim();
  },

  _parseTimelineEventYearRange(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const match = raw.match(/^(-?\d{1,4})(?:\s*(?:-|~|\u2013|\u2014|\u81f3|\u5230)\s*(-?\d{1,4}))?$/);
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return {
      startYear: String(Math.min(start, end)),
      endYear: String(Math.max(start, end))
    };
  },

  _parseTimelineEventYearRanges(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const parts = raw.split(/[,\uFF0C\u3001;\uFF1B]+/).map(part => part.trim()).filter(Boolean);
    if (!parts.length) return null;
    const ranges = [];
    for (let i = 0; i < parts.length; i++) {
      const range = this._parseTimelineEventYearRange(parts[i]);
      if (!range) return null;
      ranges.push(range);
    }
    return ranges;
  },

  _parseTimelineEventYears(text) {
    const ranges = this._parseTimelineEventYearRanges(text);
    return ranges && ranges.length ? ranges[0] : null;
  },

  _timelineEventYearRangesFromEvent(event = {}) {
    return this._parseTimelineEventYearRanges(event.yearLabel || event.year || '');
  },

  _timelineEventYearRangeFromEvent(event = {}) {
    const ranges = this._timelineEventYearRangesFromEvent(event);
    return ranges && ranges.length ? ranges[0] : null;
  },

  _formatTimelineEventYearRanges(ranges = []) {
    return (Array.isArray(ranges) ? ranges : [])
      .map(range => {
        const start = String(range && range.startYear || '').trim();
        const end = String(range && (range.endYear || range.startYear) || '').trim();
        if (!start) return '';
        return end && end !== start ? `${start}-${end}` : start;
      })
      .filter(Boolean)
      .join(', ');
  },

  _formatTimelineEventYears(event) {
    const parsedRanges = this._timelineEventYearRangesFromEvent(event || {});
    if (parsedRanges && parsedRanges.length) return this._formatTimelineEventYearRanges(parsedRanges);
    return String(event && event.year || '').trim();
  },

  _buildTimelineEventRows(db = this.data.db, profileRange = null) {
    const events = this._getGlobalTimelineEvents(db);
    const rows = events.map(event => {
      const inVisibleRange = this._shouldDisplayTimelineEventInLayout(event, db, profileRange);
      return {
        ...event,
        yearLabel: this._formatTimelineEventYears(event),
        checked: !event.hidden && inVisibleRange,
        autoHiddenByProfileRange: !event.hidden && !inVisibleRange,
        isDefault: this._isDefaultTimelineEvent(event),
        tone: EventColors.resolveEventTone(event, 3)
      };
    });
    return this._withTimelineEventNameChipWidths(rows);
  },

  _timelineEventTextWidth(text, options = {}) {
    const raw = String(text || '').trim();
    const min = options.min || 80;
    const max = options.max || 230;
    const ascii = options.ascii || 13;
    const cjk = options.cjk || 24;
    const padding = options.padding || 24;
    const contentWidth = Array.from(raw).reduce((sum, char) => (
      sum + (/[\x00-\x7F]/.test(char) ? ascii : cjk)
    ), 0);
    return `${Math.min(max, Math.max(min, Math.ceil(contentWidth + padding)))}rpx`;
  },

  _timelineEventInputWidths(name = '', yearLabel = '') {
    return {
      nameInputWidth: this._timelineEventTextWidth(name, { min: 84, max: 360, ascii: 12, cjk: 23, padding: 22 }),
      yearInputWidth: this._timelineEventTextWidth(yearLabel, { min: 76, max: 520, ascii: 12, cjk: 20, padding: 20 })
    };
  },

  _timelineEventDraftWidthPatch(name = this.data.timelineEventDraftName, years = this.data.timelineEventDraftYears) {
    const widths = this._timelineEventInputWidths(name, years);
    return {
      timelineEventDraftNameWidth: widths.nameInputWidth,
      timelineEventDraftYearWidth: widths.yearInputWidth
    };
  },

  _estimateTimelineEventNameChipWidth(name) {
    const text = String(name || '').trim();
    let width = 0;
    Array.from(text).forEach(ch => {
      width += /[\x00-\xff]/.test(ch) ? 14 : 26;
    });
    return width + 36;
  },

  _withTimelineEventNameChipWidths(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const maxNameWidth = list.reduce((max, row) => (
      Math.max(max, this._estimateTimelineEventNameChipWidth(row && row.name))
    ), 0);
    const width = Math.max(128, Math.min(320, maxNameWidth || 128));
    return list.map(row => ({
      ...row,
      ...this._timelineEventInputWidths(row && row.name, row && row.yearLabel),
      nameChipWidth: width
    }));
  },

  _normalizePersonalEvent(event, index = 0) {
    if (!event || typeof event !== 'object') return null;
    const name = String(event.name || event.title || event.label || '').trim();
    const ranges = this._timelineEventYearRangesFromEvent(event);
    if (!name || !ranges || !ranges.length) return null;
    const yearLabel = this._formatTimelineEventYearRanges(ranges);
    return {
      ...event,
      id: event.id || `personal_event_${index}`,
      name,
      year: yearLabel,
      yearRanges: ranges,
      hidden: event.hidden === true || event.hidden === 'true' || event.checked === false
    };
  },

  _buildPersonalEventRows(db = this.data.db) {
    const groups = {};
    const currentWorkspaceId = this._getCurrentWorkspaceIdFromDb(db);
    Object.entries((db && db.people) || {}).forEach(([id, person]) => {
      if (currentWorkspaceId && this._personWorkspaceId(person, id, db) !== currentWorkspaceId) return;
      (Array.isArray(person && person.events) ? person.events : []).forEach((rawEvent, index) => {
        const event = this._normalizePersonalEvent(rawEvent, index);
        if (!event) return;
        if (!groups[event.name]) {
          groups[event.name] = {
            name: event.name,
            count: 0,
            visibleCount: 0,
            years: []
          };
        }
        groups[event.name].count += 1;
        if (!event.hidden) groups[event.name].visibleCount += 1;
        (event.yearRanges || [event]).forEach(range => {
          groups[event.name].years.push(parseInt(range.startYear, 10));
          groups[event.name].years.push(parseInt(range.endYear, 10));
        });
      });
    });

    const rows = Object.values(groups)
      .sort((a, b) => (
        Math.min(...a.years) - Math.min(...b.years)
        || String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN')
      ));
    const pickPersonalEventTone = EventColors.makeEventTonePicker(rows.map(row => row.name), 3);
    return rows
      .map((row, index) => {
        const years = row.years.filter(year => Number.isFinite(year)).sort((a, b) => a - b);
        const firstYear = years[0];
        const lastYear = years[years.length - 1];
        const yearLabel = firstYear === lastYear ? String(firstYear || '') : `${firstYear}-${lastYear}`;
        return {
          ...row,
          id: `personal-event-type-${index}`,
          checked: row.visibleCount > 0,
          countLabel: `${row.count}人`,
          yearLabel,
          tone: pickPersonalEventTone(row.name)
        };
      });
  },

  _buildPersonalEventSuggestions(db = this.data.db) {
    const groups = {};
    const currentWorkspaceId = this._getCurrentWorkspaceIdFromDb(db);
    Object.entries((db && db.people) || {}).forEach(([id, person]) => {
      if (currentWorkspaceId && this._personWorkspaceId(person, id, db) !== currentWorkspaceId) return;
      (Array.isArray(person && person.events) ? person.events : []).forEach((rawEvent, index) => {
        const event = this._normalizePersonalEvent(rawEvent, index);
        if (!event || !event.name) return;
        if (!groups[event.name]) groups[event.name] = { name: event.name, count: 0, visibleCount: 0 };
        groups[event.name].count += 1;
        if (!event.hidden) groups[event.name].visibleCount += 1;
      });
    });
    return Object.values(groups)
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hans-CN'))
      .map(group => ({ name: group.name, hidden: group.visibleCount === 0 }));
  },

  _getCurrentWorkspaceIdFromDb(db) {
    const rootId = db && db.activeRootId;
    const root = rootId && db.people ? db.people[rootId] : null;
    return (root && root.workspaceId) || this._extractProgenitorId(rootId) || rootId || '';
  },

  openTimelineEventPanel() {
    const db = this._ensureTimelineEvents(JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} })));
    this._saveData(db);
    this.setData({
      db,
      showTimelineEventPanel: true,
      timelineEventRows: this._buildTimelineEventRows(db, this._getProfileYearRangeFromNodes(db, this.data.nodes)),
      timelinePersonalEventRows: this._buildPersonalEventRows(db),
      timelineEventEditingId: '',
      timelineEventEditingField: '',
      showTimelineEventEditor: false,
      showTimelineEventDraft: false,
      timelineEventDraftName: '',
      timelineEventDraftYears: '',
      ...this._timelineEventDraftWidthPatch('', '')
    });
  },

  closeTimelineEventPanel() {
    this.setData({
      showTimelineEventPanel: false,
      timelineEventEditingId: '',
      timelineEventEditingField: '',
      showTimelineEventEditor: false,
      showTimelineEventDraft: false
    });
  },

  onShowTimelineEventDraft() {
    this.setData({
      showTimelineEventDraft: true,
      showTimelineEventEditor: false,
      timelineEventEditingId: '',
      timelineEventEditingField: ''
    });
  },

  onCancelTimelineEventDraft() {
    this.setData({
      showTimelineEventDraft: false,
      timelineEventDraftName: '',
      timelineEventDraftYears: '',
      ...this._timelineEventDraftWidthPatch('', '')
    });
  },

  onTimelineEventDraftInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = (e.detail && e.detail.value) || '';
    if (!field) return;
    const next = { [field]: value };
    const name = field === 'timelineEventDraftName' ? value : this.data.timelineEventDraftName;
    const years = field === 'timelineEventDraftYears' ? value : this.data.timelineEventDraftYears;
    this.setData({ ...next, ...this._timelineEventDraftWidthPatch(name, years) });
  },

  _saveTimelineEventsDb(db) {
    db = this._ensureTimelineEvents(db);
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    this.setData({
      db,
      timelineEventRows: this._buildTimelineEventRows(db, this._getProfileYearRangeFromNodes(db, this.data.nodes)),
      timelinePersonalEventRows: this._buildPersonalEventRows(db)
    }, () => this.refreshTree());
  },

  onEditTimelineEvents() {
    this.setData({
      showTimelineEventEditor: true,
      showTimelineEventDraft: false,
      timelineEventEditingId: '',
      timelineEventEditingField: ''
    });
  },

  onFinishTimelineEventEditing() {
    this.setData({
      showTimelineEventEditor: false,
      timelineEventEditingId: '',
      timelineEventEditingField: ''
    });
  },

  onEditTimelineEventField(e) {
    const id = e.currentTarget.dataset.id;
    const field = e.currentTarget.dataset.field;
    if (!id || !field) return;
    this.setData({
      timelineEventEditingId: id,
      timelineEventEditingField: field
    });
  },

  onToggleTimelineEvent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const checked = !!(e.detail && e.detail.value && e.detail.value.length);
    const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    db.timelineEvents = (db.timelineEvents || []).map(event => (
      event && event.id === id ? { ...event, hidden: !checked } : event
    ));
    this.setData({
      timelineEventEditingId: '',
      timelineEventEditingField: ''
    }, () => this._saveTimelineEventsDb(db));
  },

  onToggleTimelineEventChip(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || this.data.showTimelineEventEditor || this.data.showTimelineEventDraft) return;
    const row = (this.data.timelineEventRows || []).find(item => item.id === id);
    const nextHidden = row ? !!row.checked : false;
    const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    db.timelineEvents = (db.timelineEvents || []).map(event => (
      event && event.id === id ? { ...event, hidden: nextHidden } : event
    ));
    this.setData({
      timelineEventEditingId: '',
      timelineEventEditingField: ''
    }, () => this._saveTimelineEventsDb(db));
  },

  onToggleTimelinePersonalEvent(e) {
    const index = Number(e.currentTarget.dataset.index);
    const row = (this.data.timelinePersonalEventRows || [])[index];
    const targetName = String(row && row.name || '').trim();
    if (!targetName) return;
    const nextHidden = !!row.checked;
    const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    const currentWorkspaceId = this._getCurrentWorkspaceIdFromDb(db);
    let changed = false;
    Object.entries((db && db.people) || {}).forEach(([personId, person]) => {
      if (currentWorkspaceId && this._personWorkspaceId(person, personId, db) !== currentWorkspaceId) return;
      if (!Array.isArray(person.events)) return;
      person.events = person.events.map((event, eventIndex) => {
        const normalized = this._normalizePersonalEvent(event, eventIndex);
        const eventName = (normalized && normalized.name) || String(event && (event.name || event.title || event.label) || '').trim();
        if (eventName !== targetName) return event;
        const updated = { ...event };
        if (nextHidden) {
          updated.hidden = true;
        } else {
          delete updated.hidden;
          delete updated.checked;
        }
        changed = true;
        return updated;
      });
    });
    if (!changed) return;
    const editingId = this.data.editingId;
    const pending = { ...(this.data._pendingEdits || {}) };
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    const patch = {
      db,
      timelinePersonalEventRows: this._buildPersonalEventRows(db),
      _personalEventSuggestions: this._buildPersonalEventSuggestions(db)
    };
    if (editingId && db.people && db.people[editingId]) {
      patch._editingPerson = this._decorateProfilePerson({ ...db.people[editingId], ...pending, id: editingId });
    }
    this.setData(patch, () => this.refreshTree());
  },

  onDeleteTimelineEvent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const row = (this.data.timelineEventRows || []).find(item => item.id === id);
    if (!row) return;
    if (row.isDefault || this._isDefaultTimelineEvent(row)) {
      wx.showToast({ title: '\u9ed8\u8ba4\u4e8b\u4ef6\u4e0d\u80fd\u5220\u9664', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '\u5220\u9664\u4e8b\u4ef6',
      content: `\u786e\u5b9a\u5220\u9664\u201c${row.name || '\u672a\u547d\u540d'}\u201d\uff1f`,
      confirmText: '\u5220\u9664',
      confirmColor: '#c62828',
      cancelText: '\u53d6\u6d88',
      success: (res) => {
        if (!res.confirm) return;
        const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
        db.timelineEvents = (db.timelineEvents || []).filter(event => event && event.id !== id);
        this.setData({
          timelineEventEditingId: '',
          timelineEventEditingField: ''
        }, () => this._saveTimelineEventsDb(db));
      }
    });
  },

  onTimelineEventRowInput(e) {
    const id = e.currentTarget.dataset.id;
    const field = e.currentTarget.dataset.field;
    const value = (e.detail && e.detail.value) || '';
    if (!id || !field) return;
    const rows = (this.data.timelineEventRows || []).map(row => (
      row.id === id
        ? (field === 'year'
          ? { ...row, yearLabel: value }
          : { ...row, [field]: value, yearLabel: this._formatTimelineEventYears({ ...row, [field]: value }) })
        : row
    ));
    this.setData({ timelineEventRows: this._withTimelineEventNameChipWidths(rows) });
  },

  onTimelineEventRowBlur(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const row = (this.data.timelineEventRows || []).find(item => item.id === id);
    if (!row) return;
    const name = String(row.name || '').trim();
    const ranges = this._parseTimelineEventYearRanges(row.yearLabel);
    if (!name || !ranges || !ranges.length) {
      this.setData({
        timelineEventRows: this._buildTimelineEventRows(this.data.db),
        timelineEventEditingId: '',
        timelineEventEditingField: ''
      });
      return;
    }
    const yearLabel = this._formatTimelineEventYearRanges(ranges);
    const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    db.timelineEvents = (db.timelineEvents || []).map(event => (
      event && event.id === id
        ? (() => {
          const { startYear, endYear, year, years, date, yearLabel: _yearLabel, yearRanges, ...rest } = event;
          return {
            ...rest,
            name,
            year: yearLabel
          };
        })()
        : event
    ));
    this.setData({
      timelineEventEditingId: '',
      timelineEventEditingField: ''
    }, () => this._saveTimelineEventsDb(db));
  },

  onAddTimelineEvent() {
    const name = String(this.data.timelineEventDraftName || '').trim();
    const ranges = this._parseTimelineEventYearRanges(this.data.timelineEventDraftYears);
    if (!name) {
      wx.showToast({ title: '请填写事件名', icon: 'none' });
      return;
    }
    if (!ranges || !ranges.length) {
      wx.showToast({ title: '请填写年份', icon: 'none' });
      return;
    }
    const yearLabel = this._formatTimelineEventYearRanges(ranges);
    const db = JSON.parse(JSON.stringify(this.data.db || { activeRootId: null, people: {} }));
    const workspaceId = this._getCurrentWorkspaceIdFromDb(db);
    if (!Array.isArray(db.timelineEvents)) db.timelineEvents = [];
    db.timelineEvents.push({
      id: this._makeTimelineEventId(db, `global_${workspaceId || 'workspace'}`, name),
      name,
      year: yearLabel,
      ...(workspaceId ? { workspaceId } : {}),
    });
    this.setData({
      showTimelineEventDraft: false,
      timelineEventDraftName: '',
      timelineEventDraftYears: '',
      ...this._timelineEventDraftWidthPatch('', '')
    }, () => this._saveTimelineEventsDb(db));
  },

  _getWorkspaceConflictIds(importedDb, currentDb) {
    const currentWorkspaceIds = this._getWorkspaceIds(currentDb);
    return Array.from(this._getWorkspaceIds(importedDb)).filter(id => currentWorkspaceIds.has(id));
  },

  _cloneImportedAsNewWorkspaces(importedDb, currentDb) {
    const importedPeople = (importedDb && importedDb.people) || {};
    const currentPeople = (currentDb && currentDb.people) || {};
    const existingPersonIds = new Set(Object.keys(currentPeople));
    const reservedRootIds = new Set(existingPersonIds);
    const existingWorkspaceIds = this._getWorkspaceIds(currentDb);
    const workspaceMap = {};
    const rootMap = {};

    Object.entries(importedPeople).forEach(([id, person]) => {
      const oldWsId = this._personWorkspaceId(person, id, importedDb);
      if (oldWsId && !workspaceMap[oldWsId]) {
        workspaceMap[oldWsId] = this._generateWorkspaceId(existingWorkspaceIds);
      }

      const oldRootId = this._extractProgenitorId(id);
      if (oldRootId && !rootMap[oldRootId]) {
        let candidate = this._generateRootId();
        while (reservedRootIds.has(candidate)) candidate = this._generateRootId();
        rootMap[oldRootId] = candidate;
        reservedRootIds.add(candidate);
      }
    });

    const renameMap = {};
    const usedNewIds = new Set();
    Object.keys(importedPeople).forEach(id => {
      const oldRootId = this._extractProgenitorId(id);
      let newId = rootMap[oldRootId]
        ? rootMap[oldRootId] + (id.startsWith(oldRootId) ? id.slice(oldRootId.length) : '')
        : '';

      while (!newId || existingPersonIds.has(newId) || usedNewIds.has(newId)) {
        newId = this._generateRootId();
      }

      renameMap[id] = newId;
      usedNewIds.add(newId);
    });

    const people = {};
    Object.entries(importedPeople).forEach(([oldId, person]) => {
      const p = { ...person, id: renameMap[oldId] };
      const oldWsId = this._personWorkspaceId(person, oldId, importedDb);
      p.workspaceId = workspaceMap[oldWsId] || this._generateWorkspaceId(existingWorkspaceIds);
      if (p.motherId) p.motherId = renameMap[p.motherId] || '';
      if (p.children) p.children = p.children.map(id => renameMap[id]).filter(Boolean);
      if (p.spouses) p.spouses = p.spouses.map(id => renameMap[id]).filter(Boolean);
      delete p.fatherId;
      delete p.paternalRootId;
      delete p.progenitorId_;
      people[p.id] = p;
    });

    const eventIdDb = { timelineEvents: [...((currentDb && currentDb.timelineEvents) || [])] };
    const timelineEvents = ((importedDb.timelineEvents || []).map(event => {
      if (!event) return null;
      const oldEventWorkspaceId = this._getTimelineEventWorkspaceId(event, importedDb);
      const newEventWorkspaceId = workspaceMap[oldEventWorkspaceId] || oldEventWorkspaceId || '';
      const cloned = {
        ...event,
        id: this._makeTimelineEventId(eventIdDb, `global_${newEventWorkspaceId || 'workspace'}`, event.id || event.name),
        ...(newEventWorkspaceId ? { workspaceId: newEventWorkspaceId } : {})
      };
      eventIdDb.timelineEvents.push(cloned);
      return cloned;
    }).filter(Boolean));

    return {
      ...importedDb,
      activeRootId: renameMap[importedDb.activeRootId] || Object.keys(people)[0] || null,
      people,
      timelineEvents
    };
  },

  _applyImportedDb(importedDb, mode, conflictWorkspaceIds = []) {
    const currentDb = this.data.db || { activeRootId: null, people: {} };
    const preparedImportedDb = this._prepareImportedDb(importedDb);
    let db;
    let toastTitle = '已导入';

    if (mode === 'replaceAll') {
      db = preparedImportedDb;
      toastTitle = '已替换导入';
    } else if (mode === 'replaceWorkspace') {
      const conflicts = new Set(conflictWorkspaceIds.length ? conflictWorkspaceIds : this._getWorkspaceIds(preparedImportedDb));
      const people = {};
      Object.entries(currentDb.people || {}).forEach(([id, person]) => {
        if (!conflicts.has(this._personWorkspaceId(person, id, currentDb))) people[id] = person;
      });
      const timelineEvents = (currentDb.timelineEvents || [])
        .filter(event => !conflicts.has(this._getTimelineEventWorkspaceId(event, currentDb)));
      db = {
        ...currentDb,
        ...preparedImportedDb,
        people: {
          ...people,
          ...(preparedImportedDb.people || {})
        },
        timelineEvents: [
          ...timelineEvents,
          ...(preparedImportedDb.timelineEvents || [])
        ],
        activeRootId: preparedImportedDb.activeRootId || currentDb.activeRootId
      };
      toastTitle = '已覆盖同一家谱';
    } else {
      const importedToMerge = mode === 'newWorkspace'
        || Object.keys(preparedImportedDb.people || {}).some(id => currentDb.people && currentDb.people[id])
        ? this._cloneImportedAsNewWorkspaces(preparedImportedDb, currentDb)
        : preparedImportedDb;
      db = {
        ...currentDb,
        ...importedToMerge,
        people: {
          ...(currentDb.people || {}),
          ...(importedToMerge.people || {})
        },
        timelineEvents: [
          ...(currentDb.timelineEvents || []),
          ...(importedToMerge.timelineEvents || [])
        ],
        activeRootId: importedToMerge.activeRootId || currentDb.activeRootId
      };
      toastTitle = mode === 'newWorkspace' ? '已作为新家谱导入' : '已导入新家谱';
    }

    db = this._migrateIdFormat(db);
    db = this._normalizeDbIdsForSchema(db);
    db = this._migrateWorkspaceId(db);
    db = this._migrateRemoveDerivedIds(db);
    this._layoutCache = { standard: null, timeline: null };
    this._saveData(db);
    this.setData({
      db,
      collapsedNodes: [],
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      _editingPerson: {},
      _pendingEdits: {},
      _pendingMotherSelected: false,
      ...this._emptyProfileContext()
    }, () => {
      this.refreshTree(() => {
        this._scrollToTreeNode(db.activeRootId, { fallbackFirst: true, vertical: true, screenTopRpx: 96 });
      });
      wx.showToast({ title: toastTitle, icon: 'success' });
    });
  },

  onExport() {
    const exportDb = this._buildVisibleExportDb();
    this._shareVisibleExportDb(exportDb);
  },

  _shareVisibleExportDb(exportDb, options = {}) {
    Data.exportToChat(exportDb || this._buildVisibleExportDb(), {
      familyName: this.data.familyName,
      fileSuffix: options.fileSuffix || '当前视图'
    })
      .then(() => {
        wx.showToast({ title: options.successTitle || '已打开分享', icon: 'success' });
      })
      .catch(err => {
        if (err && err.cancelled) {
          wx.showToast({ title: options.cancelTitle || '已取消分享', icon: 'none' });
          return;
        }
        console.error(options.logLabel || '[export] failed:', err);
        wx.showModal({
          title: options.errorTitle || '导出失败',
          content: err && err.message ? err.message : (options.errorContent || '无法生成或分享 JSON 文件。'),
          showCancel: false
        });
      });
  },

  onBackup() {
    const db = this.data.db || { activeRootId: null, people: {} };
    wx.showModal({
      title: '备份全部数据',
      content: '将导出本机保存的全部家谱数据，可在以后重新导入恢复。',
      confirmText: '备份',
      success: (res) => {
        if (!res.confirm) return;
        Data.exportToChat(db, {
          familyName: this.data.familyName,
          fileSuffix: '完整备份'
        })
          .then(() => {
            wx.showToast({ title: '已打开备份', icon: 'success' });
          })
          .catch(err => {
            if (err && err.cancelled) {
              wx.showToast({ title: '已取消备份', icon: 'none' });
              return;
            }
            console.error('[backup] failed:', err);
            wx.showModal({
              title: '备份失败',
              content: err && err.message ? err.message : '无法生成或分享备份 JSON 文件。',
              showCancel: false
            });
          });
      }
    });
  },

  _buildVisibleExportDb() {
    const db = this.data.db || { activeRootId: null, people: {} };
    const people = db.people || {};
    const renderedIds = new Set(
      (this.data.nodes || [])
        .map(node => node && node.id)
        .filter(id => id && people[id])
    );

    if (renderedIds.size === 0 && db.activeRootId && people[db.activeRootId]) {
      renderedIds.add(db.activeRootId);
    }

    const exportIds = new Set(renderedIds);
    const addExportId = (id, queue) => {
      if (!id || !people[id] || exportIds.has(id)) return false;
      exportIds.add(id);
      if (queue) queue.push(id);
      return true;
    };
    const addSpousesFor = (seedIds) => {
      const spouseQueue = Array.from(seedIds || []);
      for (let i = 0; i < spouseQueue.length; i += 1) {
        const person = people[spouseQueue[i]] || {};
        (person.spouses || []).forEach(spouseId => {
          addExportId(spouseId, spouseQueue);
        });
      }
    };
    addSpousesFor(exportIds);

    const sourceWorkspaceId = this._getCurrentWorkspaceId();
    const exportWorkspaceId = this._generateWorkspaceId(this._getWorkspaceIds(db));
    const exportPeople = {};
    exportIds.forEach(id => {
      const source = people[id];
      if (!source) return;
      const person = JSON.parse(JSON.stringify(source));
      person.id = id;
      delete person.fatherId;
      delete person.paternalRootId;
      delete person.progenitorId_;
      person.workspaceId = exportWorkspaceId;
      person.children = person.gender === 'male'
        ? (Array.isArray(source.children) ? source.children : []).filter(childId => renderedIds.has(childId))
        : [];
      person.spouses = (Array.isArray(source.spouses) ? source.spouses : []).filter(spouseId => exportIds.has(spouseId));
      if (person.motherId && !exportIds.has(person.motherId)) {
        person.motherId = '';
      }
      exportPeople[id] = person;
    });

    Object.values(exportPeople).forEach(person => {
      person.children = (person.children || []).filter(childId => !!exportPeople[childId]);
      person.spouses = (person.spouses || []).filter(spouseId => !!exportPeople[spouseId]);
      if (person.motherId && !exportPeople[person.motherId]) {
        person.motherId = '';
      }
    });
    Object.entries(exportPeople).forEach(([id, person]) => {
      (person.spouses || []).forEach(spouseId => {
        const spouse = exportPeople[spouseId];
        if (!spouse) return;
        const spouseList = Array.isArray(spouse.spouses) ? spouse.spouses : [];
        if (!spouseList.includes(id)) {
          spouse.spouses = spouseList.concat(id);
        }
      });
    });

    const activeRootId = renderedIds.has(db.activeRootId)
      ? db.activeRootId
      : (Array.from(renderedIds).find(id => this._isProgenitor(id)) || Array.from(exportIds)[0] || null);
    const exportDb = {
      activeRootId,
      people: exportPeople,
      timelineEvents: (db.timelineEvents || [])
        .filter(event => {
          if (this._isCurrentYearTimelineEvent(event)) return false;
          const eventWorkspaceId = this._getTimelineEventWorkspaceId(event, db);
          return !sourceWorkspaceId || eventWorkspaceId === sourceWorkspaceId;
        })
        .map(event => {
          const exportedEvent = { ...event, workspaceId: exportWorkspaceId };
          delete exportedEvent.workspace;
          delete exportedEvent.sharedId;
          return exportedEvent;
        })
    };

    return this._normalizeDbIdsForSchema(exportDb);
  },

  onReset() {
    wx.showModal({
      title: '确认清空',
      content: '将清除所有数据，此操作不可撤销。',
      confirmColor: '#c62828',
      success: (res) => {
        if (res.confirm) { 
          wx.clearStorageSync(); 
          this.onLoad(); 
        }
      }
    });
  },

  // ─────────────────────────────────────────────
  // View toggles
  // ─────────────────────────────────────────────

  // switch bindchange gives e.detail.value === true/false (reliable)
  toggleTimeline(e) {
    const nextShowTimeline = !!(e && e.detail && e.detail.value);
    const anchor = this._getScrollAnchor();

    this.setData({
      showTimeline: nextShowTimeline,
      showTimelineEventPanel: nextShowTimeline ? this.data.showTimelineEventPanel : false
    }, () => {
      this.refreshTree(() => {
        this._scrollToTreeNode(anchor && anchor.id, {
          fallbackFirst: true,
          screenLeftRpx: anchor && anchor.screenLeftRpx
        });
      });
    });
  },
  toggleSpouses(e)  { this.setData({ showSpouses:  e.detail.value }, () => this.refreshTree()); },
  toggleMaternal(e) { this.setData({ showMaternal: e.detail.value }, () => this.refreshTree()); },

  // ─────────────────────────────────────────────
  // Full screenshot export
  // ─────────────────────────────────────────────

  onExportScreenshot() {
    if (!this.data.nodes || this.data.nodes.length === 0) {
      wx.showToast({ title: '暂无可截图内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成截图中...', mask: true });
    const query = wx.createSelectorQuery().in(this);
    query.select('#screenshotCanvas').fields({ node: true, size: true }).exec((res) => {
      const item = res && res[0];
      if (!item || !item.node) {
        wx.hideLoading();
        wx.showToast({ title: '画布初始化失败', icon: 'error' });
        return;
      }

      try {
        this._renderScreenshot(item.node);
      } catch (err) {
        console.error('[screenshot] render failed:', err);
        wx.hideLoading();
        wx.showToast({ title: '截图失败', icon: 'error' });
      }
    });
  },

  _getScreenshotMetrics(options = {}) {
    const PAD = TREE_STYLE.screenshotSideMargin || 24;
    const V_PAD = TREE_STYLE.screenshotVerticalMargin || PAD;
    const TITLE_H = 0;
    const RULER_H = 64;
    const CANVAS_TOP = TITLE_H + RULER_H;
    const TREE_TOP = CANVAS_TOP + (this.data.treeTopGap || 0);
    const NODE_OFFSET_X = 40;
    const NODE_H = 56;
    const NODE_BOX_H = 56;
    const NODE_BOX_Y_OFFSET = 0;

    let right = this.data.showTimeline ? 0 : 750;
    let contentLeft = Infinity;
    let contentRight = 0;
    let bottom = TREE_TOP + 120;
    const drawnElementRects = [];
    const estimateNodeContentWidth = (node) => {
      const nameWidth = String(node.name || '未命名').length * 30;
      const rankWidth = node.rank ? String(node.rank).length * 22 + 18 : 0;
      const lifeWidth = node.life ? String(node.life).length * 12 + 14 : 0;
      const leadingWidth = this.data.showTimeline ? 50 : 64;
      return leadingWidth + nameWidth + rankWidth + lifeWidth + 24;
    };

    (this.data.nodes || []).forEach(node => {
      const timelineNodeInset = this.data.showTimeline ? (this.data.timelineEdgeInset || TREE_STYLE.timelineEdgeInset) : 0;
      const timelineNodeExtra = this.data.showTimeline ? (this.data.timelineEdgeMarkWidth || TREE_STYLE.timelineEdgeMarkWidth) : 0;
      const nodeLeft = PAD + NODE_OFFSET_X + (node.x || 0) + timelineNodeInset;
      const rawNodeW = Number(node.w);
      const baseNodeW = Number.isFinite(rawNodeW) ? rawNodeW : 80;
      const fadePercent = Number(node.fadeStartPercent);
      const hasFadeTail = Number.isFinite(fadePercent) && fadePercent > 0 && fadePercent < 100;
      const timelineEndExtra = node.isLiving || hasFadeTail ? 0 : timelineNodeExtra;
      const nodeBoxW = this.data.showTimeline
        ? Math.max(baseNodeW + timelineEndExtra, timelineNodeExtra || 1)
        : Math.max(baseNodeW, 80);
      const nodeBoxRight = nodeLeft + nodeBoxW;
      const nodeTextRight = nodeLeft + Math.max(nodeBoxW, estimateNodeContentWidth(node));
      contentLeft = Math.min(contentLeft, nodeLeft);
      right = Math.max(right, this.data.showTimeline ? nodeTextRight : nodeBoxRight);
      contentRight = Math.max(contentRight, this.data.showTimeline ? nodeTextRight : nodeBoxRight);
      const nodeH = Math.max(node.h || NODE_BOX_H, 1);
      const nodeTop = TREE_TOP + (node.y || 0) + NODE_BOX_Y_OFFSET;
      const nodeBottom = nodeTop + nodeH;
      drawnElementRects.push({
        left: nodeLeft,
        top: nodeTop,
        right: nodeBoxRight,
        bottom: nodeBottom
      });
      bottom = Math.max(bottom, nodeBottom);
    });

    (this.data.lines || []).forEach(line => {
      const lineDrawX = line.drawX !== undefined ? line.drawX : (line.x || 0);
      const lineDrawY = line.drawY !== undefined ? line.drawY : (line.y || 0);
      const lineLeft = PAD + NODE_OFFSET_X + lineDrawX;
      const lineRight = lineLeft + (line.drawW || line.w || 2);
      contentLeft = Math.min(contentLeft, lineLeft);
      right = Math.max(right, lineRight);
      contentRight = Math.max(contentRight, lineRight);
      const lineTop = TREE_TOP + lineDrawY;
      const lineBottom = lineTop + (line.drawH || line.h || 2);
      drawnElementRects.push({
        left: lineLeft,
        top: lineTop,
        right: lineRight,
        bottom: lineBottom
      });
      bottom = Math.max(bottom, lineBottom);
    });

    if (this.data.showTimeline) {
      (this.data.timelineEventBands || []).forEach(band => {
        const bandLeft = PAD + NODE_OFFSET_X + (band.x || 0);
        const rawBandW = Number(band.w);
        const bandRight = bandLeft + (Number.isFinite(rawBandW) ? Math.max(rawBandW, 1) : 8);
        contentLeft = Math.min(contentLeft, bandLeft);
        right = Math.max(right, bandRight);
        contentRight = Math.max(contentRight, bandRight);
      });
    }

    const timelineEventBands = this.data.showTimeline ? (this.data.timelineEventBands || []) : [];
    const eventLabelBlockHeight = this.data.showTimeline
      ? this._getTimelineEventLabelBlockHeight(timelineEventBands)
      : 0;
    const eventLabelTopWithinCanvas = Math.max(0, (TREE_STYLE.eventLabelTop || 72) - RULER_H);
    const eventLabelBottomTail = this.data.showTimeline
      ? this._getTimelineScreenshotBottomTail(timelineEventBands)
      : 0;

    if (this.data.showTimeline) {
      bottom += eventLabelBottomTail;
    }

    let screenshotXShift = 0;
    let width = right + PAD;

    if (this.data.showTimeline && contentLeft < Infinity) {
      const sideMargin = TREE_STYLE.timelineScreenshotSideMargin;
      screenshotXShift = contentLeft - sideMargin;
      right = contentRight - screenshotXShift;
      width = right + sideMargin;
    } else {
      (this.data.rulerTicks || []).forEach(tick => {
        const x = tick.x || NODE_OFFSET_X;
        right = Math.max(right, PAD + x + 140);
      });
      width = right + PAD;
    }

    let height = bottom + V_PAD;
    const bottomTimelineRulerY = this.data.showTimeline
      ? Math.max(RULER_H + 24, bottom + 48)
      : null;
    if (this.data.showTimeline && bottomTimelineRulerY) {
      const bottomRulerTail = 64;
      height = Math.max(height, bottomTimelineRulerY + bottomRulerTail + V_PAD);
    }
    let qr = null;
    if (options.includeQr) {
      const qrSize = TREE_STYLE.screenshotQrSize || 132;
      const qrPad = TREE_STYLE.screenshotQrPad || 24;
      const label = TREE_STYLE.screenshotQrLabel || '';
      const labelH = label ? 42 : 0;
      const qrClearance = TREE_STYLE.screenshotQrClearance || 12;
      const qrBottomAnchor = bottomTimelineRulerY || (height - V_PAD);
      const qrY = Math.max(RULER_H + qrPad, qrBottomAnchor - qrPad - qrSize - labelH);
      const qrRect = {
        left: qrPad,
        top: qrY,
        right: qrPad + qrSize,
        bottom: qrY + qrSize + labelH
      };
      let leftGutter = 0;
      drawnElementRects.forEach(rect => {
        const shiftedLeft = rect.left - screenshotXShift;
        const shiftedRight = rect.right - screenshotXShift;
        const overlapsX = shiftedLeft < qrRect.right + qrClearance && shiftedRight > qrRect.left - qrClearance;
        const overlapsY = rect.top < qrRect.bottom + qrClearance && rect.bottom > qrRect.top - qrClearance;
        if (overlapsX && overlapsY) {
          leftGutter = Math.max(leftGutter, qrRect.right + qrClearance - shiftedLeft);
        }
      });
      if (leftGutter > 0) {
        screenshotXShift -= leftGutter;
        width += leftGutter;
      }
      qr = {
        x: qrPad,
        y: qrY,
        size: qrSize,
        label
      };
    }

    return {
      pad: PAD,
      verticalPad: V_PAD,
      titleH: TITLE_H,
      rulerH: RULER_H,
      canvasTop: CANVAS_TOP,
      treeTop: TREE_TOP,
      nodeOffsetX: NODE_OFFSET_X,
      nodeH: NODE_H,
      nodeInnerH: NODE_BOX_H,
      nodeInnerYOffset: NODE_BOX_Y_OFFSET,
      timelineYearWidth: this.data.timelineYearWidth || TREE_STYLE.timelineYearWidth,
      timelineEdgeMarkWidth: TREE_STYLE.timelineEdgeMarkWidth,
      timelineEdgeInset: TREE_STYLE.timelineEdgeInset,
      eventLabelTopWithinCanvas,
      eventLabelBlockHeight,
      bottomTimelineRulerY,
      screenshotXShift,
      qr,
      width: Math.ceil(width),
      height: Math.ceil(height)
    };
  },

  _getScreenshotScale(width, height) {
    const TARGET_SCALE = 2;
    const MAX_SIDE = 8192;
    const MAX_PIXELS = 24000000;
    const bySide = Math.min(MAX_SIDE / width, MAX_SIDE / height);
    const byArea = Math.sqrt(MAX_PIXELS / (width * height));
    return Math.max(0.1, Math.min(TARGET_SCALE, bySide, byArea));
  },

  _loadScreenshotQrImage(canvas, done) {
    const path = TREE_STYLE.screenshotQrPath;
    if (!path || !canvas || !canvas.createImage) {
      done(null);
      return;
    }
    const candidates = Array.from(new Set([
      path,
      path.replace(/^\//, ''),
      '../../assets/miniprogram-qr.png'
    ].filter(Boolean)));
    let finished = false;
    let cursor = 0;
    const finish = (image) => {
      if (finished) return;
      finished = true;
      done(image || null);
    };
    const loadImage = (src, onFail) => {
      const img = canvas.createImage();
      let settled = false;
      const fail = () => {
        if (settled) return;
        settled = true;
        onFail();
      };
      const timer = setTimeout(fail, 3000);
      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        finish(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        fail();
      };
      img.src = src;
    };
    const tryNext = () => {
      if (finished) return;
      const src = candidates[cursor++];
      if (!src) {
        finish(null);
        return;
      }
      loadImage(src, () => {
        if (!wx.getImageInfo) {
          tryNext();
          return;
        }
        wx.getImageInfo({
          src,
          success: (info) => {
            const localPath = info && (info.path || info.localPath);
            if (localPath && localPath !== src) {
              loadImage(localPath, tryNext);
            } else {
              tryNext();
            }
          },
          fail: tryNext
        });
      });
    };
    tryNext();
  },

  _loadScreenshotTreeIconImages(canvas, done) {
    if (!canvas || !canvas.createImage) {
      done({});
      return;
    }
    const images = {};
    const loadOne = (source, onDone) => {
      const candidates = Array.from(new Set([
        source,
        source.replace(/^\//, ''),
        `../../${source.replace(/^\//, '')}`
      ].filter(Boolean)));
      let cursor = 0;
      const tryNext = () => {
        const src = candidates[cursor++];
        if (!src) {
          onDone();
          return;
        }
        const img = canvas.createImage();
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          tryNext();
        }, 3000);
        img.onload = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          images[source] = img;
          onDone();
        };
        img.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          tryNext();
        };
        img.src = src;
      };
      tryNext();
    };
    let index = 0;
    const next = () => {
      const source = TREE_ICON_IMAGE_SOURCES[index++];
      if (!source) {
        done(images);
        return;
      }
      loadOne(source, next);
    };
    next();
  },

  _renderScreenshot(canvas) {
    this._loadScreenshotQrImage(canvas, (qrImage) => {
      return this._loadScreenshotTreeIconImages(canvas, (iconImages) => {
        try {
          this._screenshotTreeIconImages = iconImages || {};
          this._renderScreenshotWithQr(canvas, qrImage);
        } catch (err) {
          console.error('[screenshot] render failed:', err);
          wx.hideLoading();
          wx.showToast({ title: '鎴浘澶辫触', icon: 'error' });
        }
      });
    });
  },

  _renderScreenshotWithQr(canvas, qrImage) {
    const metrics = this._getScreenshotMetrics({ includeQr: !!qrImage });
    metrics.qrImage = qrImage || null;
    const scale = this._getScreenshotScale(metrics.width, metrics.height);
    const outW = Math.max(1, Math.ceil(metrics.width * scale));
    const outH = Math.max(1, Math.ceil(metrics.height * scale));
    const ctx = canvas.getContext('2d');

    canvas.width = outW;
    canvas.height = outH;
    if (ctx.setTransform) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    } else {
      ctx.scale(scale, scale);
    }
    this._drawScreenshotScene(ctx, metrics);

    wx.canvasToTempFilePath({
      canvas,
      fileType: 'png',
      destWidth: outW,
      destHeight: outH,
      success: (result) => {
        wx.hideLoading();
        this._openScreenshotPreview(result.tempFilePath);
      },
      fail: (err) => {
        console.error('[screenshot] canvasToTempFilePath failed:', err);
        wx.hideLoading();
        wx.showToast({ title: '图片生成失败', icon: 'error' });
      }
    });
  },

  _openScreenshotPreview(filePath) {
    const finish = (width, height) => {
      this.setData({
        showScreenshotPreview: true,
        screenshotPreviewImagePath: filePath,
        screenshotPreviewImageWidth: width || 1,
        screenshotPreviewImageHeight: height || 1,
        screenshotPreviewDrawerY: 0
      });
    };

    if (wx.getImageInfo) {
      wx.getImageInfo({
        src: filePath,
        success: info => finish(info.width, info.height),
        fail: () => finish(1, 1)
      });
    } else {
      finish(1, 1);
    }
  },

  closeScreenshotPreview() {
    this.setData({ screenshotPreviewDrawerY: this._windowHeight || 667 });
    setTimeout(() => {
      if (!this.data.showScreenshotPreview) return;
      this.setData({
        showScreenshotPreview: false,
        screenshotPreviewImagePath: '',
        screenshotPreviewImageWidth: 0,
        screenshotPreviewImageHeight: 0,
        screenshotPreviewDrawerY: 0
      });
    }, 120);
  },

  onScreenshotPreviewTouchStart(e) {
    this._screenshotPreviewDragStartY = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
    this._screenshotPreviewDragStartDrawerY = Number(this.data.screenshotPreviewDrawerY || 0);
  },

  onScreenshotPreviewTouchMove(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const deltaY = touch.clientY - (this._screenshotPreviewDragStartY || touch.clientY);
    this.setData({ screenshotPreviewDrawerY: Math.max(0, (this._screenshotPreviewDragStartDrawerY || 0) + deltaY) });
  },

  onScreenshotPreviewTouchEnd() {
    const y = Number(this.data.screenshotPreviewDrawerY || 0);
    if (y > Math.max(120, (this._windowHeight || 667) * 0.18)) {
      this.closeScreenshotPreview();
    } else {
      this.setData({ screenshotPreviewDrawerY: 0 });
    }
  },

  onPreviewScreenshotImage() {
    const filePath = this.data.screenshotPreviewImagePath;
    if (!filePath) return;
    wx.previewImage({ current: filePath, urls: [filePath] });
  },

  onSaveScreenshotPreview() {
    const filePath = this.data.screenshotPreviewImagePath;
    if (!filePath) return;
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    });
  },

  onShareScreenshotPreview() {
    const filePath = this.data.screenshotPreviewImagePath;
    if (!filePath) return;
    const exportDb = this._buildVisibleExportDb();
    if (wx.shareFileMessage) {
      wx.shareFileMessage({
        filePath,
        fileName: `${this.data.familyName || '家谱'}_截图.png`,
        success: () => this._promptShareScreenshotJson(exportDb),
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消分享', icon: 'none' });
            return;
          }
          wx.previewImage({ current: filePath, urls: [filePath] });
        }
      });
    } else {
      wx.previewImage({ current: filePath, urls: [filePath] });
    }
  },

  _promptShareScreenshotJson(exportDb) {
    wx.showModal({
      title: '分享 JSON',
      content: '截图已发送。接下来请选择同一个聊天，发送当前页面 JSON。',
      cancelText: '跳过',
      confirmText: '分享',
      success: (res) => {
        if (!res.confirm) return;
        this._shareVisibleExportDb(exportDb, {
          successTitle: '已打开 JSON',
          cancelTitle: '已取消 JSON',
          errorTitle: 'JSON 分享失败',
          errorContent: '无法生成或分享当前页面 JSON 文件。',
          logLabel: '[screenshot json export] failed:'
        });
      }
    });
  },

  _openScreenshotEditor(filePath) {
    const finish = (width, height) => {
      this._screenshotEditorImage = null;
      this._screenshotEditorImagePath = '';
      this._screenshotEditorImageCanvas = null;
      this._screenshotEditorPreview = null;
      this.setData({
        showScreenshotEditor: true,
        screenshotEditorImagePath: filePath,
        screenshotEditorImageWidth: width || 1,
        screenshotEditorImageHeight: height || 1,
        screenshotEditorTool: 'crop',
        screenshotCropLeft: 0,
        screenshotCropRight: 0,
        screenshotCropTop: 0,
        screenshotCropBottom: 0,
        screenshotEditorText: '',
        screenshotEditorAnnotations: [],
        screenshotArrowStart: null
      }, () => {
        setTimeout(() => this._drawScreenshotEditorPreview(), 60);
      });
    };

    if (wx.getImageInfo) {
      wx.getImageInfo({
        src: filePath,
        success: info => finish(info.width, info.height),
        fail: () => finish(1, 1)
      });
    } else {
      finish(1, 1);
    }
  },

  closeScreenshotEditor() {
    if (this._screenshotEditorDrawTimer) {
      clearTimeout(this._screenshotEditorDrawTimer);
      this._screenshotEditorDrawTimer = null;
    }
    this._screenshotEditorImage = null;
    this._screenshotEditorImagePath = '';
    this._screenshotEditorImageCanvas = null;
    this._screenshotEditorPreview = null;
    this.setData({
      showScreenshotEditor: false,
      screenshotEditorImagePath: '',
      screenshotEditorAnnotations: [],
      screenshotArrowStart: null
    });
  },

  setScreenshotEditorTool(e) {
    const tool = String((e.currentTarget.dataset && e.currentTarget.dataset.tool) || 'crop');
    this.setData({
      screenshotEditorTool: tool,
      screenshotArrowStart: tool === 'arrow' ? this.data.screenshotArrowStart : null
    }, () => this._drawScreenshotEditorPreviewSoon());
  },

  resetScreenshotEditor() {
    this.setData({
      screenshotCropLeft: 0,
      screenshotCropRight: 0,
      screenshotCropTop: 0,
      screenshotCropBottom: 0,
      screenshotEditorAnnotations: [],
      screenshotArrowStart: null
    }, () => this._drawScreenshotEditorPreview());
  },

  onScreenshotEditorTextInput(e) {
    this.setData({ screenshotEditorText: e.detail.value || '' });
  },

  onScreenshotCropChanging(e) {
    const field = String((e.currentTarget.dataset && e.currentTarget.dataset.field) || '');
    if (!field) return;
    const value = Math.max(0, Math.min(45, Number(e.detail.value || 0)));
    this.setData({ [field]: value }, () => this._drawScreenshotEditorPreviewSoon());
  },

  undoScreenshotAnnotation() {
    const annotations = [...(this.data.screenshotEditorAnnotations || [])];
    annotations.pop();
    this.setData({ screenshotEditorAnnotations: annotations, screenshotArrowStart: null }, () => {
      this._drawScreenshotEditorPreview();
    });
  },

  _drawScreenshotEditorPreviewSoon() {
    if (this._screenshotEditorDrawTimer) clearTimeout(this._screenshotEditorDrawTimer);
    this._screenshotEditorDrawTimer = setTimeout(() => {
      this._screenshotEditorDrawTimer = null;
      this._drawScreenshotEditorPreview();
    }, 40);
  },

  _getScreenshotEditorCropRect() {
    const w = Math.max(1, Number(this.data.screenshotEditorImageWidth || 1));
    const h = Math.max(1, Number(this.data.screenshotEditorImageHeight || 1));
    let left = w * Math.max(0, Number(this.data.screenshotCropLeft || 0)) / 100;
    let right = w * Math.max(0, Number(this.data.screenshotCropRight || 0)) / 100;
    let top = h * Math.max(0, Number(this.data.screenshotCropTop || 0)) / 100;
    let bottom = h * Math.max(0, Number(this.data.screenshotCropBottom || 0)) / 100;
    const minW = Math.max(80, w * 0.08);
    const minH = Math.max(80, h * 0.08);
    if (left + right > w - minW) {
      const scale = (w - minW) / Math.max(1, left + right);
      left *= scale;
      right *= scale;
    }
    if (top + bottom > h - minH) {
      const scale = (h - minH) / Math.max(1, top + bottom);
      top *= scale;
      bottom *= scale;
    }
    return {
      x: left,
      y: top,
      w: Math.max(minW, w - left - right),
      h: Math.max(minH, h - top - bottom)
    };
  },

  _getScreenshotEditorGeometry(canvasWidth, canvasHeight) {
    const crop = this._getScreenshotEditorCropRect();
    const scale = Math.min(canvasWidth / crop.w, canvasHeight / crop.h);
    const fitW = crop.w * scale;
    const fitH = crop.h * scale;
    return {
      crop,
      fit: {
        x: (canvasWidth - fitW) / 2,
        y: (canvasHeight - fitH) / 2,
        w: fitW,
        h: fitH,
        scale
      }
    };
  },

  _loadScreenshotEditorImage(canvas, callback) {
    const path = this.data.screenshotEditorImagePath;
    if (!path || !canvas || !canvas.createImage) {
      callback(null);
      return;
    }
    if (this._screenshotEditorImage && this._screenshotEditorImagePath === path && this._screenshotEditorImageCanvas === canvas) {
      callback(this._screenshotEditorImage);
      return;
    }
    const image = canvas.createImage();
    image.onload = () => {
      this._screenshotEditorImage = image;
      this._screenshotEditorImagePath = path;
      this._screenshotEditorImageCanvas = canvas;
      callback(image);
    };
    image.onerror = () => callback(null);
    image.src = path;
  },

  _drawScreenshotEditorPreview() {
    if (!this.data.showScreenshotEditor) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('#screenshotEditCanvas').fields({ node: true, size: true }).exec((res) => {
      const item = res && res[0];
      const canvas = item && item.node;
      if (!canvas) return;
      const width = Math.max(1, item.width || this._windowWidth || 320);
      const height = Math.max(1, item.height || Math.round(width * 0.78));
      const dpr = (wx.getSystemInfoSync && wx.getSystemInfoSync().pixelRatio) || 1;
      const ctx = canvas.getContext('2d');
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      if (ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      else ctx.scale(dpr, dpr);
      this._screenshotEditorPreview = { canvas, width, height };

      this._loadScreenshotEditorImage(canvas, (image) => {
        this._drawScreenshotEditorScene(ctx, image, width, height);
      });
    });
  },

  _drawScreenshotEditorScene(ctx, image, canvasWidth, canvasHeight) {
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const { crop, fit } = this._getScreenshotEditorGeometry(canvasWidth, canvasHeight);
    if (image) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(fit.x, fit.y, fit.w, fit.h);
      ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, fit.x, fit.y, fit.w, fit.h);
    }
    this._drawScreenshotEditorAnnotations(ctx, crop, fit, false);
    ctx.strokeStyle = '#c62828';
    ctx.lineWidth = 2;
    ctx.strokeRect(fit.x, fit.y, fit.w, fit.h);
  },

  _imagePointToPreview(point, crop, fit) {
    const x = fit.x + (point.x - crop.x) * fit.scale;
    const y = fit.y + (point.y - crop.y) * fit.scale;
    return { x, y };
  },

  _pointInCrop(point, crop) {
    return point.x >= crop.x && point.x <= crop.x + crop.w && point.y >= crop.y && point.y <= crop.y + crop.h;
  },

  _drawArrow(ctx, x1, y1, x2, y2, color, lineWidth) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = Math.max(12, lineWidth * 5);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  },

  _drawScreenshotEditorAnnotations(ctx, crop, fit, outputMode) {
    const annotations = this.data.screenshotEditorAnnotations || [];
    annotations.forEach(annotation => {
      if (annotation.type === 'text') {
        if (!this._pointInCrop(annotation, crop)) return;
        const point = outputMode
          ? { x: annotation.x - crop.x, y: annotation.y - crop.y }
          : this._imagePointToPreview(annotation, crop, fit);
        const fontSize = outputMode
          ? annotation.fontSize
          : Math.max(18, annotation.fontSize * fit.scale);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(4, fontSize * 0.16);
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = annotation.color || '#c62828';
        ctx.strokeText(annotation.text, point.x, point.y);
        ctx.fillText(annotation.text, point.x, point.y);
      } else if (annotation.type === 'arrow') {
        const startInside = this._pointInCrop({ x: annotation.x1, y: annotation.y1 }, crop);
        const endInside = this._pointInCrop({ x: annotation.x2, y: annotation.y2 }, crop);
        if (!startInside && !endInside) return;
        const p1 = outputMode
          ? { x: annotation.x1 - crop.x, y: annotation.y1 - crop.y }
          : this._imagePointToPreview({ x: annotation.x1, y: annotation.y1 }, crop, fit);
        const p2 = outputMode
          ? { x: annotation.x2 - crop.x, y: annotation.y2 - crop.y }
          : this._imagePointToPreview({ x: annotation.x2, y: annotation.y2 }, crop, fit);
        const lineWidth = outputMode
          ? annotation.lineWidth
          : Math.max(3, annotation.lineWidth * fit.scale);
        this._drawArrow(ctx, p1.x, p1.y, p2.x, p2.y, annotation.color || '#c62828', lineWidth);
      }
    });
  },

  onScreenshotEditorCanvasTap(e) {
    const preview = this._screenshotEditorPreview;
    if (!preview) return;
    const { crop, fit } = this._getScreenshotEditorGeometry(preview.width, preview.height);
    const tapX = Number(e.detail && e.detail.x);
    const tapY = Number(e.detail && e.detail.y);
    if (!Number.isFinite(tapX) || !Number.isFinite(tapY)) return;
    if (tapX < fit.x || tapX > fit.x + fit.w || tapY < fit.y || tapY > fit.y + fit.h) return;
    const point = {
      x: crop.x + (tapX - fit.x) / fit.scale,
      y: crop.y + (tapY - fit.y) / fit.scale
    };
    const tool = this.data.screenshotEditorTool;
    if (tool === 'text') {
      const text = String(this.data.screenshotEditorText || '').trim();
      if (!text) {
        wx.showToast({ title: '先输入文字', icon: 'none' });
        return;
      }
      const annotations = [...(this.data.screenshotEditorAnnotations || []), {
        type: 'text',
        text,
        x: point.x,
        y: point.y,
        fontSize: Math.max(34, Math.round(crop.w * 0.035)),
        color: '#c62828'
      }];
      this.setData({ screenshotEditorAnnotations: annotations }, () => this._drawScreenshotEditorPreview());
      return;
    }
    if (tool === 'arrow') {
      const start = this.data.screenshotArrowStart;
      if (!start) {
        this.setData({ screenshotArrowStart: point });
        wx.showToast({ title: '再点终点', icon: 'none' });
        return;
      }
      const annotations = [...(this.data.screenshotEditorAnnotations || []), {
        type: 'arrow',
        x1: start.x,
        y1: start.y,
        x2: point.x,
        y2: point.y,
        lineWidth: Math.max(6, Math.round(crop.w * 0.006)),
        color: '#c62828'
      }];
      this.setData({ screenshotEditorAnnotations: annotations, screenshotArrowStart: null }, () => this._drawScreenshotEditorPreview());
    }
  },

  onSaveEditedScreenshot() {
    if (!this.data.screenshotEditorImagePath) return;
    wx.showLoading({ title: '保存截图中...', mask: true });
    const query = wx.createSelectorQuery().in(this);
    query.select('#screenshotCanvas').fields({ node: true, size: true }).exec((res) => {
      const item = res && res[0];
      if (!item || !item.node) {
        wx.hideLoading();
        wx.showToast({ title: '画布初始化失败', icon: 'error' });
        return;
      }
      this._renderEditedScreenshot(item.node);
    });
  },

  _getScreenshotEditOutputScale(width, height) {
    const MAX_SIDE = 8192;
    const MAX_PIXELS = 24000000;
    const bySide = Math.min(MAX_SIDE / width, MAX_SIDE / height);
    const byArea = Math.sqrt(MAX_PIXELS / (width * height));
    return Math.max(0.1, Math.min(1, bySide, byArea));
  },

  _renderEditedScreenshot(canvas) {
    const crop = this._getScreenshotEditorCropRect();
    const scale = this._getScreenshotEditOutputScale(crop.w, crop.h);
    const outW = Math.max(1, Math.ceil(crop.w * scale));
    const outH = Math.max(1, Math.ceil(crop.h * scale));
    const ctx = canvas.getContext('2d');
    canvas.width = outW;
    canvas.height = outH;
    if (ctx.setTransform) ctx.setTransform(scale, 0, 0, scale, 0, 0);
    else ctx.scale(scale, scale);

    this._loadScreenshotEditorImage(canvas, (image) => {
      if (!image) {
        wx.hideLoading();
        wx.showToast({ title: '图片读取失败', icon: 'error' });
        return;
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, crop.w, crop.h);
      ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      this._drawScreenshotEditorAnnotations(ctx, crop, { x: 0, y: 0, w: crop.w, h: crop.h, scale: 1 }, true);
      wx.canvasToTempFilePath({
        canvas,
        fileType: 'png',
        destWidth: outW,
        destHeight: outH,
        success: (result) => {
          wx.hideLoading();
          this.closeScreenshotEditor();
          this._saveScreenshotFile(result.tempFilePath);
        },
        fail: (err) => {
          console.error('[screenshot] edited canvasToTempFilePath failed:', err);
          wx.hideLoading();
          wx.showToast({ title: '图片生成失败', icon: 'error' });
        }
      });
    });
  },

  _saveScreenshotFile(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: () => {
        if (wx.shareFileMessage) {
          wx.shareFileMessage({
            filePath,
            fileName: `${this.data.familyName || '家谱'}_截图.png`,
            fail: () => wx.previewImage({ urls: [filePath] })
          });
        } else {
          wx.previewImage({ urls: [filePath] });
        }
      }
    });
  },

  _drawScreenshotScene(ctx, m) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, m.width, m.height);
    this._drawScreenshotEventBands(ctx, m);
    this._drawScreenshotRuler(ctx, m);
    this._drawScreenshotLines(ctx, m);
    this._drawScreenshotNodes(ctx, m);
    this._drawScreenshotQr(ctx, m);
  },

  _drawScreenshotQr(ctx, m) {
    if (!m.qr || !m.qrImage) return;
    const { x, y, size, label } = m.qr;
    ctx.drawImage(m.qrImage, x, y, size, size);
    if (label) {
      ctx.fillStyle = '#555';
      ctx.font = '18px SimSun, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(label), x + size / 2, y + size + 12);
    }
  },

  _drawScreenshotEventBands(ctx, m) {
    if (!this.data.showTimeline) return;
    const top = m.canvasTop || (m.titleH + m.rulerH);
    const bottom = m.bottomTimelineRulerY || (m.height - m.pad);
    const height = Math.max(0, bottom - top);
    const fills = [
      'rgba(194,137,43,0.24)',
      'rgba(80,137,128,0.22)',
      'rgba(132,111,151,0.22)'
    ];
    const edgeFills = [
      'rgba(194,137,43,0.24)',
      'rgba(80,137,128,0.22)',
      'rgba(132,111,151,0.22)'
    ];
    const labelColors = TREE_STYLE.eventLabelColors || ['#c2892b', '#508980', '#846f97'];
    const namedToneColors = {
      imperial: {
        fill: 'rgba(255,212,0,0.24)',
        edge: 'rgba(255,212,0,0.42)',
        label: '#e6aa00'
      },
      'crown-prince': {
        fill: 'rgba(0,141,122,0.22)',
        edge: 'rgba(0,141,122,0.38)',
        label: '#00796b'
      },
      empress: {
        fill: 'rgba(217,144,39,0.22)',
        edge: 'rgba(217,144,39,0.38)',
        label: '#b56f14'
      },
      'noble-consort': {
        fill: 'rgba(243,201,120,0.20)',
        edge: 'rgba(243,201,120,0.38)',
        label: '#a26e18'
      }
    };
    const drawEventLabel = (label, centerX, labelY, color) => {
      if (!label) return;
      const textY = labelY + 12;
      ctx.font = '18px SimSun, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      if (ctx.strokeText) {
        ctx.strokeText(label, centerX, textY);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
          ctx.fillText(label, centerX + dx, textY + dy);
        });
      }
      ctx.fillStyle = color || TREE_STYLE.eventLabelColor || '#c2892b';
      ctx.fillText(label, centerX, textY);
      ctx.restore();
    };
    const labelRowGap = TREE_STYLE.eventLabelRowGap || 26;
    const topLabelY = top + (m.eventLabelTopWithinCanvas || 8);
    const bottomLabelY = Math.max(
      topLabelY,
      (m.bottomTimelineRulerY || (m.height - m.pad))
        - (m.eventLabelBlockHeight || TREE_STYLE.eventLabelHeight || 24)
        - (TREE_STYLE.eventLabelRulerClearance || 10)
    );
    (this.data.timelineEventBands || []).forEach(band => {
      const x = m.pad + m.nodeOffsetX + (band.x || 0) - (m.screenshotXShift || 0);
      const yearW = Math.max(1, m.timelineYearWidth || TREE_STYLE.timelineYearWidth);
      const configuredMarkW = Number(band.edgeMarkWidth || m.timelineEdgeMarkWidth || TREE_STYLE.timelineEdgeMarkWidth);
      const markW = Math.max(1, Math.min(Number.isFinite(configuredMarkW) ? configuredMarkW : TREE_STYLE.timelineEdgeMarkWidth, yearW));
      const rawW = Number(band.w);
      const w = Number.isFinite(rawW) ? Math.max(rawW, markW) : yearW;
      const configuredInset = Number(band.edgeInset);
      const defaultInset = Math.max(0, Math.min(m.timelineEdgeInset || 0, Math.max(0, yearW - markW)));
      const markInset = Number.isFinite(configuredInset)
        ? Math.max(0, Math.min(configuredInset, Math.max(0, w - markW)))
        : defaultInset;
      if (x > m.width || x + w < 0) return;
      const isCurrentYear = !!band.isCurrentYear;
      const namedTone = namedToneColors[String(band.tone || '')] || null;
      const toneIndex = Number.isFinite(Number(band.tone)) ? Math.abs(Number(band.tone)) % labelColors.length : 0;
      ctx.fillStyle = isCurrentYear
        ? 'rgba(230,81,0,0.14)'
        : (namedTone ? namedTone.fill : fills[toneIndex % fills.length]);
      ctx.fillRect(x, top, w, height);
      ctx.fillStyle = isCurrentYear
        ? 'rgba(230,81,0,0.14)'
        : (namedTone ? namedTone.edge : edgeFills[toneIndex % edgeFills.length]);
      ctx.fillRect(x + markInset, top, Math.min(markW, w), height);
      if (!band.hideRightEdge) {
        ctx.fillRect(x + Math.max(markInset, w - markW - markInset), top, Math.min(markW, w), height);
      }
      const label = String(band.label || '');
      const labelOffsetX = Number(band.labelOffsetX || 0);
      const centerX = x + w / 2 + (Number.isFinite(labelOffsetX) ? labelOffsetX : 0);
      const labelLane = Math.max(0, Number(band.labelLane || 0));
      const labelColor = band.labelColor || (isCurrentYear ? TREE_STYLE.currentYearColor : (namedTone ? namedTone.label : labelColors[toneIndex]));
      drawEventLabel(label, centerX, topLabelY + labelLane * labelRowGap, labelColor);
      drawEventLabel(label, centerX, bottomLabelY + labelLane * labelRowGap, labelColor);
    });
  },

  _drawScreenshotRuler(ctx, m) {
    const style = TREE_STYLE;
    const y0 = m.titleH;
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, y0, m.width, m.rulerH);
    ctx.fillStyle = style.rulerBaseLineColor;
    ctx.fillRect(0, y0 + m.rulerH - 3, m.width, 3);

    if (this.data.showTimeline) {
      (this.data.rulerTicks || []).forEach(tick => {
        const tickW = tick.isCurrentYear ? 2 : 1;
        const centerX = m.pad + m.nodeOffsetX + (tick.x || 0) + (m.timelineYearWidth || style.timelineYearWidth) / 2 - (m.screenshotXShift || 0);
        const x = centerX - tickW / 2;
        if (x < 0 || x > m.width - 4) return;
        const tickH = tick.isCurrentYear ? 20 : 8;
        ctx.fillStyle = tick.isCurrentYear
          ? style.currentYearColor
          : (tick.type === 'major' ? style.rulerMajorTickColor : style.rulerTickColor);
        ctx.fillRect(x, y0 + m.rulerH - tickH - 3, tickW, tickH);
        if (tick.label) {
          ctx.fillStyle = tick.isCurrentYear ? style.currentYearColor : '#000';
          ctx.font = tick.isCurrentYear ? 'bold 24px Consolas, monospace' : '24px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(String(tick.label), centerX, y0 + m.rulerH - 14);
        }
      });

      this._drawScreenshotBottomTimelineRuler(ctx, m);
    } else {
      (this.data.rulerTicks || []).forEach(tick => {
        const blockLeft = m.pad + (tick.x || 0) - (m.screenshotXShift || 0);
        const x = blockLeft + 40;
        ctx.fillStyle = '#8f969e';
        ctx.fillRect(blockLeft, y0, 2, m.rulerH);
        if (tick.isLast) {
          ctx.fillRect(blockLeft + 80, y0, 2, m.rulerH);
        }
        if (tick.label) {
          ctx.fillStyle = '#888';
          ctx.font = '20px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(tick.label), x, y0 + m.rulerH / 2);
        }
      });
    }
  },

  _drawScreenshotBottomTimelineRuler(ctx, m) {
    if (!this.data.showTimeline || !m.bottomTimelineRulerY) return;
    const style = TREE_STYLE;
    const axisY = m.bottomTimelineRulerY;
    ctx.fillStyle = style.rulerBaseLineColor;
    ctx.fillRect(0, axisY, m.width, 3);
    (this.data.rulerTicks || []).forEach(tick => {
      const tickW = tick.isCurrentYear ? 2 : 1;
      const centerX = m.pad + m.nodeOffsetX + (tick.x || 0) + (m.timelineYearWidth || style.timelineYearWidth) / 2 - (m.screenshotXShift || 0);
      const x = centerX - tickW / 2;
      if (x < 0 || x > m.width - 4) return;
      const tickH = tick.isCurrentYear ? 20 : 8;
      ctx.fillStyle = tick.isCurrentYear
        ? style.currentYearColor
        : (tick.type === 'major' ? style.rulerMajorTickColor : style.rulerTickColor);
      ctx.fillRect(x, axisY + 3, tickW, tickH);
      if (tick.label) {
        ctx.fillStyle = tick.isCurrentYear ? style.currentYearColor : '#000';
        ctx.font = tick.isCurrentYear ? 'bold 24px Consolas, monospace' : '24px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(tick.label), centerX, axisY + tickH + 10);
      }
    });
  },

  _drawScreenshotLines(ctx, m) {
    const style = TREE_STYLE;
    (this.data.lines || []).forEach(line => {
      const lineDrawX = line.drawX !== undefined ? line.drawX : (line.x || 0);
      const lineDrawY = line.drawY !== undefined ? line.drawY : (line.y || 0);
      const x = m.pad + m.nodeOffsetX + lineDrawX - (m.screenshotXShift || 0);
      const y = m.treeTop + lineDrawY;
      const w = line.drawW || line.w || style.lineWidth;
      const h = line.drawH || line.h || style.lineWidth;
      ctx.fillStyle = line.lineColor || this._getConnectorLineColor(line);
      ctx.fillRect(x, y, w, h);
    });
  },

  _drawScreenshotNodes(ctx, m) {
    const style = TREE_STYLE;
    (this.data.nodes || []).forEach(node => {
      const timelineX = this.data.showTimeline;
      const x = m.pad + m.nodeOffsetX + (node.x || 0) + (timelineX ? (m.timelineEdgeInset || style.timelineEdgeInset) : 0) - (m.screenshotXShift || 0);
      const y = m.treeTop + (node.y || 0);
      const rawNodeW = Number(node.w);
      const baseNodeW = Number.isFinite(rawNodeW) ? rawNodeW : 80;
      const timelineExtra = timelineX ? (m.timelineEdgeMarkWidth || style.timelineEdgeMarkWidth) : 0;
      const timelineIconBoxSize = style.timelineIconBoxSize || 48;
      const fadePercent = Number(node.fadeStartPercent);
      const hasFadeTail = Number.isFinite(fadePercent) && fadePercent > 0 && fadePercent < 100;
      const timelineEndExtra = node.isLiving || hasFadeTail ? 0 : timelineExtra;
      const actualTimelineW = Math.max(baseNodeW + timelineEndExtra, timelineExtra || 1);
      const w = timelineX
        ? actualTimelineW
        : Math.max(baseNodeW, 80);
      const nodeH = Math.max(node.h || m.nodeInnerH || 56, 1);
      const chipY = y + (m.nodeInnerYOffset || 0);

      const fill = node.gender === 'male'
        ? style.maleFill
        : node.gender === 'female'
          ? style.femaleFill
          : style.unknownFill;
      const border = node.gender === 'male'
        ? style.maleBorder
        : node.gender === 'female'
          ? style.femaleBorder
          : style.unknownBorder;

      const iconColor = node.iconColor || this._getLineageToneColor(node.lineage);
      const fadeFill = this._makeScreenshotFadeStyle(ctx, x, w, fill, fadePercent);
      const fadeBorder = this._makeScreenshotFadeStyle(ctx, x, w, border, fadePercent);
      const fadeIcon = this._makeScreenshotFadeStyle(ctx, x, w, iconColor, fadePercent);
      const fadeName = this._makeScreenshotFadeStyle(ctx, x, w, style.nameColor, fadePercent);
      const fadeLife = this._makeScreenshotFadeStyle(ctx, x, w, style.lifeColor, fadePercent);

      if (timelineX) {
        const strokeW = style.nodeBorderWidth || 2;
        ctx.fillStyle = fadeFill;
        ctx.fillRect(x, chipY, w, nodeH);
        ctx.fillStyle = fadeBorder;
        ctx.fillRect(x, chipY, Math.min(strokeW, w), nodeH);
        ctx.fillRect(x, chipY, w, Math.min(strokeW, nodeH));
        ctx.fillRect(x, chipY + Math.max(0, nodeH - strokeW), w, Math.min(strokeW, nodeH));
      } else {
        this._drawRoundRect(ctx, x, chipY, w, nodeH, 0, fadeFill, fadeBorder, style.nodeBorderWidth);
      }
      this._drawScreenshotPersonalEventMarks(ctx, node, x, chipY, nodeH);
      if (timelineX) {
        const strokeW = style.nodeBorderWidth || 2;
        ctx.fillStyle = fadeBorder;
        ctx.fillRect(x, chipY, Math.min(strokeW, w), nodeH);
        ctx.fillRect(x, chipY, w, Math.min(strokeW, nodeH));
        ctx.fillRect(x, chipY + Math.max(0, nodeH - strokeW), w, Math.min(strokeW, nodeH));
        if (!node.isLiving && baseNodeW > 0 && !(Number.isFinite(fadePercent) && fadePercent > 0 && fadePercent < 100)) {
          const endEdgeW = Math.max(1, timelineExtra || style.nodeBorderWidth || 2);
          ctx.fillRect(x + baseNodeW, chipY, endEdgeW, nodeH);
        }
      } else {
        this._drawRoundRect(ctx, x, chipY, w, nodeH, 0, 'rgba(0,0,0,0)', fadeBorder, style.nodeBorderWidth);
      }
      const timelineIconBoxLeft = timelineX ? Number(node.timelineIconBoxLeft || 0) : 0;
      const drawIconSize = (node.iconType === 'marriage' || node.iconType === 'marriageCollapsed')
        ? (style.marriageIconSize || style.iconSize)
        : style.iconSize;
      const iconCenterX = timelineX ? timelineIconBoxLeft + timelineIconBoxSize / 2 : 40;
      const iconOffsetX = Math.max(0, iconCenterX - drawIconSize / 2);
      const labelNudgeX = Number(node.labelNudgeX || 0);
      const textOffsetX = (timelineX ? timelineIconBoxLeft + timelineIconBoxSize + 2 : 64) + labelNudgeX;
      this._drawScreenshotIcon(ctx, node, x + iconOffsetX, chipY + Math.max(0, (nodeH - drawIconSize) / 2), fadeIcon);

      ctx.fillStyle = fadeName;
      const normalNameFont = '28px SimSun, serif';
      const normalRankFont = '18px SimSun, serif';
      const nameFont = node.isSpouse
        ? '28px "KaiTi", "Kaiti SC", "STKaiti", "AR PL UKai CN", "FangSong", "STFangsong", "FangSong_GB2312", "Songti SC", "STSong", "SimSun", serif'
        : normalNameFont;
      const rankFont = node.isSpouse
        ? '18px "KaiTi", "Kaiti SC", "STKaiti", "AR PL UKai CN", "FangSong", "STFangsong", "FangSong_GB2312", "Songti SC", "STSong", "SimSun", serif'
        : normalRankFont;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const textX = x + textOffsetX;
      const textY = chipY + nodeH / 2;
      let labelWidth = 0;
      const hometownPrefix = node.hometownPrefix || '';
      const nameSeparator = node.nameSeparator || '';
      const name = node.nameText || node.name || '未命名';
      const drawText = (text, drawX, drawY, fillStyle) => {
        if (!text) return;
        ctx.fillStyle = fillStyle;
        ctx.fillText(String(text), drawX, drawY);
      };

      if (hometownPrefix) {
        ctx.font = node.isSpouse ? nameFont : normalNameFont;
        const hometownText = hometownPrefix + nameSeparator;
        drawText(hometownText, textX, textY, fadeName);
        labelWidth += ctx.measureText(hometownText).width;
      }

      ctx.font = nameFont;
      drawText(name, textX + labelWidth, textY, fadeName);
      labelWidth += ctx.measureText(name).width;

      if (node.rank) {
        const rankText = ` (${node.rank})`;
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.font = rankFont;
        drawText(rankText, textX + labelWidth, textY, fadeName);
        labelWidth += ctx.measureText(rankText).width;
        ctx.restore();
      }

      if (node.life) {
        ctx.font = '20px Consolas, monospace';
        drawText(node.life, textX + labelWidth + 14, textY, fadeLife);
      }
    });
  },

  _drawScreenshotPersonalEventMarks(ctx, node, nodeX, nodeY, nodeH) {
    if (!this.data.showTimeline || !node || !Array.isArray(node.personalEventMarks)) return;
    const lineColors = [
      'rgba(95,168,211,0.78)',
      'rgba(142,138,232,0.78)',
      'rgba(227,138,111,0.78)'
    ];
    const rangeColors = [
      'rgba(185,216,236,0.72)',
      'rgba(208,202,250,0.72)',
      'rgba(244,195,180,0.72)'
    ];
    const namedToneColors = {
      imperial: { line: 'rgba(255,212,0,0.78)', range: 'rgba(255,228,119,0.72)' },
      'crown-prince': { line: 'rgba(42,215,195,0.78)', range: 'rgba(159,240,230,0.72)' },
      empress: { line: 'rgba(217,144,39,0.78)', range: 'rgba(244,197,111,0.72)' },
      'noble-consort': { line: 'rgba(243,201,120,0.78)', range: 'rgba(249,223,173,0.72)' }
    };
    node.personalEventMarks.forEach(mark => {
      if (!mark) return;
      const namedTone = namedToneColors[String(mark.tone || '')] || null;
      const tone = Number.isFinite(Number(mark.tone)) ? Math.abs(Number(mark.tone)) % lineColors.length : 0;
      const lineColor = namedTone ? namedTone.line : lineColors[tone];
      const rangeColor = namedTone ? namedTone.range : rangeColors[tone];
      const toCanvasUnit = value => Number(value || 0);
      const markTop = toCanvasUnit(mark.top === undefined ? 2 : mark.top);
      const markBottom = toCanvasUnit(2);
      const top = nodeY + markTop;
      const h = Math.max(1, mark.h === undefined ? nodeH - markTop - markBottom : toCanvasUnit(mark.h));
      const x = nodeX + toCanvasUnit(mark.x || 0);
      const w = Math.max(1, toCanvasUnit(mark.w || 2));
      if (mark.isUnderlay) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, top, w, h);
      } else if (mark.isRange) {
        const leftCapW = Math.max(1, toCanvasUnit(mark.splitLeftCap ? 1 : 2));
        const rightCapW = Math.max(1, toCanvasUnit(mark.splitRightCap ? 1 : 2));
        ctx.fillStyle = rangeColor;
        ctx.fillRect(x, top, w, h);
        ctx.fillStyle = lineColor;
        ctx.fillRect(x, top, leftCapW, h);
        if (!mark.hideRightCap) ctx.fillRect(x + Math.max(0, w - rightCapW), top, rightCapW, h);
      } else {
        ctx.fillStyle = lineColor;
        ctx.fillRect(x, top, mark.splitPoint ? Math.max(1, w) : Math.max(1, toCanvasUnit(2), w), h);
      }
    });
  },

  _drawMarriageIconFallback(ctx, x, y, filled = false, color = TREE_STYLE.iconBorderColor) {
    const size = TREE_STYLE.marriageIconSize || TREE_STYLE.iconSize || 18;
    const scale = size / 18;
    const cx1 = x + 7 * scale;
    const cx2 = x + 11 * scale;
    const cy = y + 9 * scale;
    const r = 5 * scale;
    ctx.save();
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if (filled) {
      const halfGap = (cx2 - cx1) / 2;
      const midX = (cx1 + cx2) / 2;
      const intersectionY = Math.sqrt(Math.max(0, r * r - halfGap * halfGap));
      const theta = Math.atan2(intersectionY, halfGap);
      ctx.beginPath();
      ctx.moveTo(midX, cy - intersectionY);
      ctx.arc(cx1, cy, r, -theta, theta, true);
      ctx.arc(cx2, cy, r, Math.PI - theta, Math.PI + theta, false);
      ctx.closePath();
      ctx.moveTo(midX, cy - intersectionY);
      ctx.arc(cx2, cy, r, Math.PI + theta, Math.PI - theta, false);
      ctx.arc(cx1, cy, r, theta, -theta, true);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx1, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx2, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx1, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx2, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  },

  _drawScreenshotIcon(ctx, nodeOrType, x, y, color) {
    const style = TREE_STYLE;
    const node = typeof nodeOrType === 'object' ? nodeOrType : null;
    const type = node ? node.iconType : nodeOrType;
    const iconSrc = node ? node.iconSrc : getTreeIconSrc(type, '');
    const iconColor = color || style.iconBorderColor;
    const drawIconSize = (type === 'marriage' || type === 'marriageCollapsed')
      ? (style.marriageIconSize || style.iconSize)
      : style.iconSize;
    const iconImage = iconSrc && this._screenshotTreeIconImages && this._screenshotTreeIconImages[iconSrc];
    if (iconImage) {
      ctx.drawImage(iconImage, x, y, drawIconSize, drawIconSize);
      return;
    }

    if (type === 'marriage' || type === 'marriageCollapsed') {
      this._drawMarriageIconFallback(ctx, x, y, type === 'marriageCollapsed', iconColor);
      return;
    }


    const slotSize = style.iconSize;
    const iconSize = type === 'leaf' ? style.leafIconSize : style.iconSize;
    const iconInset = (slotSize - iconSize) / 2;
    const pathInset = style.iconStrokeWidth / 2;
    this._strokeRoundRect(
      ctx,
      x + iconInset + pathInset,
      y + iconInset + pathInset,
      iconSize - style.iconStrokeWidth,
      iconSize - style.iconStrokeWidth,
      type === 'leaf' ? style.leafIconRadius : 4,
      iconColor,
      style.iconStrokeWidth
    );

    if (type === 'plus' || type === 'minus') {
      const centerX = x + slotSize / 2;
      const centerY = y + slotSize / 2;
      const stroke = style.iconStrokeWidth;
      const strokeLen = Math.max(6, iconSize - 10);
      ctx.fillStyle = iconColor;
      ctx.fillRect(centerX - strokeLen / 2, centerY - stroke / 2, strokeLen, stroke);
      if (type === 'plus') {
        ctx.fillRect(centerX - stroke / 2, centerY - strokeLen / 2, stroke, strokeLen);
      }
    }
  },

  _colorToRgb(color) {
    const raw = String(color || '').trim();
    const hex = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hex) {
      const body = hex[1].length === 3
        ? hex[1].split('').map(ch => ch + ch).join('')
        : hex[1];
      return {
        r: parseInt(body.slice(0, 2), 16),
        g: parseInt(body.slice(2, 4), 16),
        b: parseInt(body.slice(4, 6), 16),
        a: 1
      };
    }
    const rgba = raw.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (rgba) {
      return {
        r: Number(rgba[1]),
        g: Number(rgba[2]),
        b: Number(rgba[3]),
        a: rgba[4] === undefined ? 1 : Number(rgba[4])
      };
    }
    return null;
  },

  _makeScreenshotFadeStyle(ctx, x, w, color, fadeStartPercent) {
    const percent = Number(fadeStartPercent);
    const rgb = this._colorToRgb(color);
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 100 || !rgb) return color;
    const start = Math.max(0, Math.min(1, percent / 100));
    const gradient = ctx.createLinearGradient(x, 0, x + Math.max(1, w), 0);
    const solid = `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`;
    const clear = `rgba(${rgb.r},${rgb.g},${rgb.b},0)`;
    gradient.addColorStop(0, solid);
    gradient.addColorStop(start, solid);
    gradient.addColorStop(1, clear);
    return gradient;
  },

  _drawRoundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth) {
    this._traceRoundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      const strokeW = lineWidth || 1;
      const inset = strokeW / 2;
      this._traceRoundRect(
        ctx,
        x + inset,
        y + inset,
        Math.max(0, w - strokeW),
        Math.max(0, h - strokeW),
        Math.max(0, r - inset)
      );
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeW;
      ctx.stroke();
    }
  },

  _traceRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  _strokeRoundRect(ctx, x, y, w, h, r, stroke, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
  },

  // ─────────────────────────────────────────────
  // Offline sharing and persistence

  _getCurrentWorkspaceId() {
    return this._getCurrentWorkspaceIdFromDb(this.data.db || {}) || null;
  },

  _collectWorkspace(workspaceId) {
    const db = this.data.db || { people: {} };
    const people = db.people || {};
    const collected = new Set();
    const roots = [];

    Object.keys(people).forEach(id => {
      const person = people[id] || {};
      if (!this._isProgenitor(id)) return;
      if (!workspaceId || id === workspaceId || person.workspaceId === workspaceId || this._extractProgenitorId(id) === workspaceId) {
        roots.push(id);
      }
    });

    if (roots.length === 0 && db.activeRootId) roots.push(db.activeRootId);
    roots.forEach(rootId => {
      this._collectFamilyNetwork(rootId).forEach(id => collected.add(id));
    });
    return collected;
  },

  _collectFamilyNetwork(rootId) {
    const people = (this.data.db && this.data.db.people) || {};
    const collected = new Set();

    const collectPerson = (id) => {
      if (!id || collected.has(id) || !people[id]) return;
      collected.add(id);
      const person = people[id];

      (person.spouses || []).forEach(spouseId => {
        if (spouseId && people[spouseId]) collected.add(spouseId);
      });

      (person.children || []).forEach(childId => collectPerson(childId));
    };

    collectPerson(rootId);
    return collected;
  },

  onShareAppMessage() {
    const title = this.data.familyName ? this.data.familyName + '家谱' : '我的家谱';
    return {
      title,
      path: '/pages/tree/tree'
    };
  },

  _saveData(db) {
    Data.saveSession(this._ensureTimelineEvents(db));
  }
});
