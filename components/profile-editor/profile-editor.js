// components/profile-editor/profile-editor.js
const { dateHintForYear } = require('../../utils/chinese-era');
const { formatLifeRange } = require('../../utils/life-format');
const EventColors = require('../../utils/event-colors.js');

Component({
  properties: {
    show: Boolean,
    person: Object,
    spouses: Array,
    children: Array,
    father: Object,
    mother: Object,
    paternalRows: Array,
    personalEventSuggestions: Array,
    motherRange: Array,
    currentMotherName: String,
    pendingMotherSelected: Boolean,
    canAddFather: Boolean,
    showJumpBtn: Boolean,
    creatingProfile: Boolean,
    hometownHint: String,
    relationVisibilityEnabled: Boolean
  },

  data: {
    drawerY: 2000,
    drawerShowClass: '',
    drawerMotionClass: '',
    hasChanges: false,
    editGender: false,
    showGenderDisplay: true,
    showGenderEditor: false,
    genderDisplayClass: 'gender-display-text male',
    genderLabel: '男',
    maleGenderClass: 'gender-btn male active',
    femaleGenderClass: 'gender-btn female',
    isMale: true,
    isFemale: false,

    displayName: '',
    displayNameRankSuffix: '',
    editSurname: '',
    editFirstname: '',
    fullNameValue: '',
    fullNamePlaceholder: '',
    fullNameEditing: false,
    showProfileSummary: false,
    profileSummaryAlias: '',
    profileSummaryRank: '',
    profileSummaryHometown: '',
    nameManual: false,
    activeField: '',
    changedFields: {},
    showNameCollapsed: true,
    showNameExpanded: false,
    nameSectionExpanded: false,
    lifeSectionExpanded: false,
    lifeSectionCollapsed: true,
    showHeaderTreeChip: false,

    surnameInputClass: 'val-text-inline surname-input',
    firstnameInputClass: 'val-text-inline',
    surnameHeaderClass: 'name-header-input-wrap surname-wrap',
    firstnameHeaderClass: 'name-header-input-wrap firstname-wrap',
    surnamePartStyle: '',
    surnameHeaderStyle: '',
    firstnamePartStyle: '',
    firstnameHeaderStyle: '',
    fullNameInputClass: 'val-text-inline is-auto',
    aliasInputClass: 'val-text-inline',
    rankInputClass: 'val-text-inline rank-input',
    rankInputStyle: '',
    hometownInputClass: 'val-text-inline',
    bYearInputClass: 'life-val',
    bDateInputClass: 'life-val',
    bPlaceInputClass: 'life-val',
    dYearInputClass: 'life-val',
    dDateInputClass: 'life-val',
    dPlaceInputClass: 'life-val',
    ageInputClass: 'life-val life-age-input',
    bYearTextClass: 'life-val-text',
    dYearTextClass: 'life-val-text',
    ageTextClass: 'life-val-text',

    aliasHint: '(字)子瞻, (号)东坡',
    hometownPlaceholder: '江苏吴县',
    bYearDisplay: '公元纪年',
    dYearDisplay: '公元纪年',
    bYearValue: '',
    dYearValue: '',
    bDateValue: '',
    dDateValue: '',
    bDatePlaceholder: '生辰',
    dDatePlaceholder: '忌日',
    ageValue: '',
    ageLabel: '享年',
    ageDisplay: '虚岁',
    agePhraseDisplay: '享年虚岁',
    lifeCompactDisplay: '',
    lifeCompactSubDisplay: '',
    lifeAutoField: '',
    ageManual: false,
    ageComputedClass: '',
    bYearDisabled: false,
    dYearDisabled: false,
    ageDisabled: false,
    showDeathInline: true,
    isLivingChecked: false,
    isDeceasedChecked: true,
    livingStatusExplicit: false,
    livingToggleDisabled: false,
    lifeStatusToggleClass: 'life-status-toggle',
    livingStatusClass: 'living-radio-label',
    deceasedStatusClass: 'living-radio-label active',

    localPaternalRows: [],
    showPaternalRows: false,
    showRelations: true,
    showAddFatherBtn: false,
    showAddChildBtn: false,
    showFemaleChildHint: false,

    showMotherPicker: false,
    showMotherInvitation: false,
    showMotherPickerCard: false,
    showMotherMenu: false,
    showMotherStatic: false,
    showMotherEmpty: true,
    motherPickerCardClass: 'rel-card female',
    motherPickerTriggerClass: 'picker-box invitation',
    motherStaticCardClass: 'rel-card female',
    motherPickerName: '',
    motherPickerYear: '',
    motherPickerRank: '',
    motherPickerIndex: 0,
    showMotherPickerSheet: false,
    motherPickerDraftIndex: 0,
    motherPickerSheetValue: [0],
    motherStaticName: '',
    motherStaticYear: '',
    motherStaticRank: '',
    localMotherId: '',

    personalEventRows: [],
    personalEventDraftName: '',
    personalEventDraftYear: '',
    personalEventDraftTone: 0,
    personalEventDraftNameWidth: '84rpx',
    personalEventDraftYearWidth: '82rpx',
    showPersonalEventDraft: false,
    showPersonalEventEditor: false,
    personalEventSummaryText: '',

    localSpouses: [],
    localChildren: [],
    draggingRelationType: '',
    draggingRelationId: '',
    draggingOffsetY: 0,
    saveButtonClass: 'save-btn-main disabled',
    deleteVisible: false
  },

  _winH: 667,
  _peekY: 434,
  _rowStep: 30,
  _lastPersonId: null,
  _isReady: false,
  _relationDrag: null,

  lifetimes: {
    attached() {
      let windowInfo = null;
      try {
        windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null;
      } catch (e) {
        windowInfo = null;
      }
      this._winH = windowInfo ? windowInfo.windowHeight : 667;
      this._rowStep = windowInfo ? Math.max(28, Math.round(windowInfo.windowWidth * 60 / 750)) : 30;
      this._peekY = this._winH * 0.65;
      this._isReady = true;
      if (this.properties.show) {
        const p = this.properties.person || {};
        this._lastPersonId = p.id || null;
        this._initializeDrawer();
      }
    }
  },

  observers: {
    show(show) {
      if (!this._isReady) return;
      if (show) {
        const p = this.properties.person || {};
        this._lastPersonId = p.id || null;
        this._initializeDrawer();
      } else {
        this._lastPersonId = null;
        this.setData({
          drawerY: this._winH,
          drawerShowClass: '',
          drawerMotionClass: '',
          hasChanges: false,
          editGender: false,
          showGenderDisplay: true,
          showGenderEditor: false,
          activeField: '',
          personalEventDraftName: '',
          personalEventDraftYear: '',
          personalEventDraftTone: 0,
          ...this._personalEventDraftWidthPatch('', ''),
          showPersonalEventDraft: false,
          showPersonalEventEditor: false,
          personalEventSummaryText: '',
          changedFields: {},
          saveButtonClass: 'save-btn-main disabled'
        });
      }
    },

    person(newPerson) {
      if (!this._isReady || !this.properties.show) return;
      const nextId = newPerson && newPerson.id ? newPerson.id : null;
      if (nextId !== this._lastPersonId) {
        this._lastPersonId = nextId;
        this._initializeDrawer();
      }
    },

    mother(mother) {
      if (!this._isReady || !this.properties.show) return;
      this.setData(this._buildMotherState(this._decoratePerson(mother)));
    },

    spouses(spouses) {
      if (!this._isReady || !this.properties.show) return;
      this.setData({ localSpouses: this._decorateRelationList(spouses || [], 'spouses') });
    },

    children(children) {
      if (!this._isReady || !this.properties.show) return;
      this.setData({ localChildren: this._decorateRelationList(children || [], 'children') });
    },

    hometownHint(hint) {
      this.setData({
        hometownPlaceholder: hint || '江苏吴县'
      });
    },

    personalEventSuggestions() {
      if (!this._isReady || !this.properties.show) return;
      const personalEventRows = this._decoratePersonalEvents(this.data.personalEventRows || []);
      this.setData({
        personalEventRows,
        personalEventSummaryText: this._personalEventSummaryText(personalEventRows)
      });
    }
  },

  methods: {
    _isProgenitor(id) {
      return !!id && String(id).endsWith('-');
    },

    _computeDisplayName(fullName, surname, firstname, isManual) {
      const s = (surname || '').trim();
      const f = (firstname || '').trim();
      const n = (fullName || '').trim();
      if (isManual && n) {
        if (s && !f && n === s) return s + '氏';
        return n;
      }
      if (n && (!s || !f)) {
        if (s && !f && n === s) return s + '氏';
        return n;
      }
      if (s && f) return s + f;
      if (s) return s + '氏';
      return '无名';
    },

    _splitNameForEditor(person) {
      const p = person || {};
      let surname = String(p.surname || '').trim();
      let firstname = String(p.firstname || '').trim();
      const storedName = String(p.name || '').trim();

      if (storedName && (!surname || !firstname)) {
        if (storedName.endsWith('氏')) {
          surname = surname || storedName.slice(0, -1);
          firstname = firstname || '';
        } else if (surname && !firstname && storedName.startsWith(surname) && storedName.length > surname.length) {
          firstname = storedName.slice(surname.length);
        } else if (!surname && !firstname) {
          const compoundSurnames = ['欧阳', '歐陽', '司马', '司馬', '上官', '诸葛', '諸葛', '夏侯', '皇甫', '尉迟', '尉遲', '公孙', '公孫', '慕容', '司徒', '司空', '端木', '东方', '東方', '南宫', '南宮'];
          const compound = compoundSurnames.find(item => storedName.startsWith(item));
          if (compound && storedName.length > compound.length) {
            surname = compound;
            firstname = storedName.slice(compound.length);
          } else if (storedName.length > 1) {
            surname = storedName.slice(0, 1);
            firstname = storedName.slice(1);
          } else {
            surname = storedName;
          }
        }
      }

      return { surname, firstname };
    },

    _defaultFullName(surname, firstname) {
      const s = String(surname || '').trim();
      const f = String(firstname || '').trim();
      if (s && f) return s + f;
      if (s) return s + '氏';
      return '';
    },

    _nameEditorState(person) {
      const p = person || {};
      const parts = this._splitNameForEditor(p);
      const defaultFullName = this._defaultFullName(parts.surname, parts.firstname);
      const storedName = String(p.name || '').trim();
      const nameManual = !!(storedName && storedName !== defaultFullName && storedName !== parts.surname);
      const displayName = nameManual
        ? storedName
        : (defaultFullName || storedName || '无名');

      return {
        editSurname: parts.surname,
        editFirstname: parts.firstname,
        fullNameValue: nameManual ? storedName : '',
        fullNamePlaceholder: defaultFullName || storedName || '无名',
        fullNameEditing: false,
        nameManual,
        displayName
      };
    },

    _decoratePerson(person) {
      if (!person) return null;
      const decorated = { ...person };
      decorated._displayName = decorated._displayName || this._computeDisplayName(decorated.name, decorated.surname, decorated.firstname, false);
      decorated._displayYear = decorated._displayYear || decorated.bYear || '';
      decorated.rankText = this._normalizeRankText(decorated.rank);
      return decorated;
    },

    _decoratePersonalEvents(events, options = {}) {
      const toneMap = this._personalEventToneMap(events);
      const rows = (Array.isArray(events) ? events : [])
        .map((event, index) => {
          if (!event || typeof event !== 'object') return null;
          const name = String(event.name || event.title || event.label || '').trim();
          const ranges = this._personalEventYearRangesFromEvent(event);
          const parsed = ranges && ranges.length ? ranges[0] : null;
          const rawYearLabel = String(event.yearLabel || event.year || '').trim();
          if (!name && (!ranges || !ranges.length)) return null;
          const startYear = parsed ? parsed.startYear : '';
          const finalEndYear = parsed ? parsed.endYear : '';
          const yearLabel = ranges && ranges.length ? this._formatPersonalEventYearRanges(ranges) : rawYearLabel;
          return {
            id: event.id || `personal_event_${index}`,
            name,
            year: yearLabel,
            startYear,
            endYear: finalEndYear,
            yearLabel,
            ...this._personalEventInputWidths(name, yearLabel),
            tone: Object.prototype.hasOwnProperty.call(toneMap, name) ? toneMap[name] : 0,
            hidden: event.hidden === true || event.hidden === 'true' || event.checked === false
          };
        })
        .filter(Boolean);
      return options.sort === false ? rows : this._sortPersonalEventRows(rows);
    },

    _personalEventToneMap(events = []) {
      const stats = {};
      const touch = (name, years = null) => {
        if (!name) return;
        if (!stats[name]) stats[name] = { name, startYear: Number.MAX_SAFE_INTEGER, endYear: Number.MAX_SAFE_INTEGER };
        if (!years) return;
        const start = parseInt(years.startYear, 10);
        const end = parseInt(years.endYear, 10);
        if (!Number.isFinite(start)) return;
        if (start < stats[name].startYear || (start === stats[name].startYear && Number.isFinite(end) && end < stats[name].endYear)) {
          stats[name].startYear = start;
          stats[name].endYear = Number.isFinite(end) ? end : start;
        }
      };
      (this.properties.personalEventSuggestions || []).forEach(item => {
        const name = String((item && item.name) || item || '').trim();
        touch(name);
      });
      (Array.isArray(events) ? events : []).forEach(item => {
        const name = String(item && item.name || '').trim();
        touch(name, this._personalEventYearRangeFromEvent(item || {}));
      });
      const map = {};
      const rows = Object.values(stats)
        .sort((a, b) => (
          a.startYear - b.startYear
          || a.endYear - b.endYear
          || a.name.localeCompare(b.name, 'zh-Hans-CN')
        ));
      const tonePicker = EventColors.makeEventTonePicker(rows, 3);
      rows
        .forEach(item => {
          map[item.name] = tonePicker(item.name);
        });
      return map;
    },

    _personalEventToneForName(name) {
      const fixedTone = EventColors.getFixedEventTone(name, 3);
      return fixedTone !== null ? fixedTone : 0;
    },

    _personalEventYearRangeFromEvent(event = {}) {
      const inlineYears = this._parsePersonalEventYears(event.yearLabel || event.year || '');
      const startYear = (inlineYears && inlineYears.startYear) || '';
      const endYear = (inlineYears && inlineYears.endYear) || startYear;
      if (!startYear) return null;
      const start = parseInt(startYear, 10);
      const end = parseInt(endYear, 10);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
      return {
        startYear: String(Math.min(start, end)),
        endYear: String(Math.max(start, end))
      };
    },

    _parsePersonalEventYears(text) {
      const raw = String(text || '').trim();
      if (!raw) return null;
      const match = raw.match(/^(-?\d{1,4})(?:\s*[-~—至到]\s*(-?\d{1,4}))?$/);
      if (!match) return null;
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : start;
      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
      return {
        startYear: String(Math.min(start, end)),
        endYear: String(Math.max(start, end))
      };
    },

    _formatPersonalEventYears(event) {
      return String(event && event.year || '').trim();
    },

    _parsePersonalEventYearRange(text) {
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

    _parsePersonalEventYearRanges(text) {
      const raw = String(text || '').trim();
      if (!raw) return null;
      const parts = raw.split(/[,\uFF0C\u3001;\uFF1B]+/).map(part => part.trim()).filter(Boolean);
      if (!parts.length) return null;
      const ranges = [];
      for (let i = 0; i < parts.length; i++) {
        const range = this._parsePersonalEventYearRange(parts[i]);
        if (!range) return null;
        ranges.push(range);
      }
      return ranges;
    },

    _parsePersonalEventYears(text) {
      const ranges = this._parsePersonalEventYearRanges(text);
      return ranges && ranges.length ? ranges[0] : null;
    },

    _personalEventYearRangesFromEvent(event = {}) {
      return this._parsePersonalEventYearRanges(event.yearLabel || event.year || '');
    },

    _personalEventYearRangeFromEvent(event = {}) {
      const ranges = this._personalEventYearRangesFromEvent(event);
      return ranges && ranges.length ? ranges[0] : null;
    },

    _formatPersonalEventYearRanges(ranges = []) {
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

    _formatPersonalEventYears(event) {
      const ranges = event && event.yearRanges;
      if (Array.isArray(ranges) && ranges.length) return this._formatPersonalEventYearRanges(ranges);
      const parsedRanges = this._personalEventYearRangesFromEvent(event || {});
      if (parsedRanges && parsedRanges.length) return this._formatPersonalEventYearRanges(parsedRanges);
      return String(event && event.year || '').trim();
    },

    _personalEventTextWidth(text, options = {}) {
      const raw = String(text || '');
      const min = options.min || 80;
      const max = options.max || 220;
      const ascii = options.ascii || 13;
      const cjk = options.cjk || 24;
      const padding = options.padding || 22;
      const contentWidth = Array.from(raw).reduce((sum, char) => (
        sum + (/[\x00-\x7F]/.test(char) ? ascii : cjk)
      ), 0);
      return `${Math.min(max, Math.max(min, Math.ceil(contentWidth + padding)))}rpx`;
    },

    _personalEventInputWidths(name = '', yearLabel = '') {
      return {
        nameInputWidth: this._personalEventTextWidth(name, { min: 84, max: 360, ascii: 13, cjk: 24, padding: 24 }),
        yearInputWidth: this._personalEventTextWidth(yearLabel, { min: 82, max: 520, ascii: 13, cjk: 22, padding: 24 })
      };
    },

    _personalEventDraftWidthPatch(name = this.data.personalEventDraftName, year = this.data.personalEventDraftYear) {
      const widths = this._personalEventInputWidths(name, year);
      return {
        personalEventDraftNameWidth: widths.nameInputWidth,
        personalEventDraftYearWidth: widths.yearInputWidth
      };
    },

    _sortPersonalEventRows(rows = []) {
      return (Array.isArray(rows) ? rows : [])
        .map((row, index) => ({ row, index, years: this._personalEventYearRangeFromEvent(row || {}) }))
        .sort((a, b) => {
          const aStart = a.years ? parseInt(a.years.startYear, 10) : Number.MAX_SAFE_INTEGER;
          const bStart = b.years ? parseInt(b.years.startYear, 10) : Number.MAX_SAFE_INTEGER;
          const aEnd = a.years ? parseInt(a.years.endYear, 10) : Number.MAX_SAFE_INTEGER;
          const bEnd = b.years ? parseInt(b.years.endYear, 10) : Number.MAX_SAFE_INTEGER;
          return (
            aStart - bStart
            || aEnd - bEnd
            || String(a.row && a.row.name || '').localeCompare(String(b.row && b.row.name || ''), 'zh-Hans-CN')
            || a.index - b.index
          );
        })
        .map(item => item.row);
    },

    _personalEventRowsToStorage(rows) {
      const used = new Set();
      return this._sortPersonalEventRows(Array.isArray(rows) ? rows : [])
        .map((row, index) => {
          const name = String(row && row.name || '').trim();
          const ranges = this._personalEventYearRangesFromEvent(row || {});
          if (!name || !ranges || !ranges.length) return null;
          const yearLabel = this._formatPersonalEventYearRanges(ranges);
          let id = String(row.id || `personal_event_${index}`);
          while (used.has(id)) id = `${id}_${index}`;
          used.add(id);
          const event = {
            id,
            name,
            year: yearLabel
          };
          if (row.hidden) event.hidden = true;
          return event;
        })
        .filter(Boolean);
    },

    _personalEventSummaryText(rows = []) {
      return (Array.isArray(rows) ? rows : [])
        .map(row => {
          const name = String(row && row.name || '').trim();
          const year = this._formatPersonalEventYears(row);
          return [name, year].filter(Boolean).join(' ');
        })
        .filter(Boolean)
        .join(' · ');
    },

    _makePersonalEventId(rows = []) {
      const used = new Set((rows || []).map(row => row && row.id).filter(Boolean));
      let id = `personal_event_${Date.now()}`;
      let index = 1;
      while (used.has(id)) id = `personal_event_${Date.now()}_${index++}`;
      return id;
    },

    _setPersonalEventRows(rows, extra = {}, options = {}) {
      const personalEventRows = this._decoratePersonalEvents(rows, { sort: options.sort !== false });
      const changedFields = { ...(this.data.changedFields || {}), events: true };
      this.setData({
        hasChanges: true,
        changedFields,
        saveButtonClass: 'save-btn-main active',
        personalEventRows,
        personalEventSummaryText: this._personalEventSummaryText(personalEventRows),
        ...this._fieldClasses(changedFields, this.data.activeField, this.data.nameManual, this.data.fullNameEditing, this.data.lifeAutoField),
        ...extra
      });
      this.triggerEvent('updatefield', {
        field: 'events',
        value: this._personalEventRowsToStorage(personalEventRows)
      });
    },

    _namePartWidthPatch(surname, firstname) {
      const countChars = (value) => Array.from(String(value || '').trim()).length;
      const surnameChars = countChars(surname);
      const firstnameChars = countChars(firstname);
      const surnameHeaderWidth = Math.min(230, Math.max(96, surnameChars * 42 + 34));
      const surnamePartWidth = surnameHeaderWidth + 32;
      const firstnameHeaderWidth = Math.max(118, Math.min(246, firstnameChars * 42 + 38));
      return {
        surnamePartStyle: `flex: 0 0 ${surnamePartWidth}rpx;`,
        surnameHeaderStyle: `width: ${surnameHeaderWidth}rpx; min-width: ${surnameHeaderWidth}rpx; max-width: 230rpx;`,
        firstnamePartStyle: 'flex: 1 1 0; max-width: none;',
        firstnameHeaderStyle: `min-width: 0; max-width: ${firstnameHeaderWidth}rpx;`
      };
    },

    _rankWidthPatch(rank) {
      const chars = Array.from(this._normalizeRankText(rank)).length;
      const width = Math.min(104, Math.max(64, chars * 30 + 24));
      return {
        rankInputStyle: `flex-basis: ${width}rpx; width: ${width}rpx; min-width: ${width}rpx; max-width: 104rpx;`
      };
    },

    _fieldClasses(changedFields, activeField, nameManual, fullNameEditing, lifeAutoField = '') {
      const cls = (base, field) => {
        let out = base;
        if (activeField === field) out += ' is-active';
        if (changedFields && changedFields[field]) out += ' is-changed';
        if (lifeAutoField === field) out += ' is-auto-life';
        return out;
      };
      let fullName = cls('val-text-inline', 'name');
      fullName += (nameManual || fullNameEditing) ? ' is-manual' : ' is-auto';
      return {
        surnameInputClass: cls('val-text-inline surname-input', 'surname'),
        firstnameInputClass: cls('val-text-inline', 'firstname'),
        surnameHeaderClass: cls('name-header-input-wrap surname-wrap', 'surname'),
        firstnameHeaderClass: cls('name-header-input-wrap firstname-wrap', 'firstname'),
        fullNameInputClass: fullName,
        aliasInputClass: cls('val-text-inline', 'alias'),
        rankInputClass: cls('val-text-inline rank-input', 'rank'),
        hometownInputClass: cls('val-text-inline', 'hometown'),
        bYearInputClass: cls('life-val', 'bYear'),
        bDateInputClass: cls('life-val', 'bDate'),
        bPlaceInputClass: cls('life-val', 'bPlace'),
        dYearInputClass: cls('life-val', 'dYear'),
        dDateInputClass: cls('life-val', 'dDate'),
        dPlaceInputClass: cls('life-val', 'dPlace'),
        ageInputClass: cls('life-val life-age-input', 'age'),
        bYearTextClass: 'life-val-text' + (changedFields && changedFields.bYear ? ' is-changed' : '') + (lifeAutoField === 'bYear' ? ' is-auto-life' : ''),
        dYearTextClass: 'life-val-text' + (changedFields && changedFields.dYear ? ' is-changed' : '') + (lifeAutoField === 'dYear' ? ' is-auto-life' : ''),
        ageTextClass: 'life-val-text' + (changedFields && (changedFields.age || changedFields.bYear || changedFields.dYear) ? ' is-changed' : '') + (lifeAutoField ? ' is-auto-life' : '')
      };
    },

    _genderState(gender) {
      const isFemale = gender === 'female';
      return {
        genderLabel: isFemale ? '女' : '男',
        genderDisplayClass: 'gender-display-text ' + (isFemale ? 'female' : 'male'),
        maleGenderClass: isFemale ? 'gender-btn male' : 'gender-btn male active',
        femaleGenderClass: isFemale ? 'gender-btn female active' : 'gender-btn female',
        isMale: !isFemale,
        isFemale
      };
    },

    _sectionState(nameExpanded, lifeExpanded, creatingProfile) {
      const safeNameExpanded = creatingProfile ? true : !!nameExpanded;
      const safeLifeExpanded = creatingProfile ? true : !!lifeExpanded;
      return {
        nameSectionExpanded: safeNameExpanded,
        lifeSectionExpanded: safeLifeExpanded,
        lifeSectionCollapsed: !safeLifeExpanded,
        showNameExpanded: safeNameExpanded,
        showNameCollapsed: !safeNameExpanded && !creatingProfile
      };
    },

    _profileSummaryState(person) {
      const p = person || {};
      const alias = String(p.alias || '').trim();
      const rank = this._normalizeRankText(p.rank);
      const hometown = String(p.hometown || '').trim();
      return {
        showProfileSummary: !!(alias || rank || hometown),
        profileSummaryAlias: alias,
        profileSummaryRank: rank,
        displayNameRankSuffix: rank ? ` (${rank})` : '',
        profileSummaryHometown: hometown
      };
    },

    _normalizeRankText(rank) {
      let text = String(rank || '').trim();
      if ((text.startsWith('(') && text.endsWith(')')) || (text.startsWith('\uff08') && text.endsWith('\uff09'))) {
        text = text.slice(1, -1).trim();
      }
      return text;
    },

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

    _lifeAutoDisabledState(lifeAutoField = '') {
      return {
        bYearDisabled: lifeAutoField === 'bYear',
        dYearDisabled: lifeAutoField === 'dYear',
        ageDisabled: lifeAutoField === 'age'
      };
    },

    _lifeYearDisplay(value) {
      return value ? String(value) : '\u516c\u5143\u7eaa\u5e74';
    },

    _dateHintForYear(year) {
      return dateHintForYear(year);
    },

    _lifeDateDisplay(person, kind) {
      const p = person || {};
      const year = kind === 'birth' ? p.bYear : p.dYear;
      const storedValue = kind === 'birth' ? p.bDate : p.dDate;
      const stored = String(storedValue || '').trim();
      return stored || this._dateHintForYear(year);
    },

    _computeLifeAuto(person, changedField = '') {
      const p = { ...(person || {}) };
      const changedValue = changedField ? String(p[changedField] || '').trim() : '';
      const previousAutoField = String(p._lifeAutoField || '');

      if (changedField && !changedValue) {
        if (previousAutoField && previousAutoField !== changedField) {
          p[previousAutoField] = '';
        } else if (changedField === 'bYear' || changedField === 'dYear') {
          p.age = '';
        }
        p._lifeAutoField = '';
        return { person: p, autoField: '' };
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

        p._lifeAutoField = autoField || '';
        return { person: p, autoField: p._lifeAutoField };
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

      p._lifeAutoField = autoField || '';
      return { person: p, autoField: p._lifeAutoField };
    },

    _normalizeLivingValue(value) {
      return value === true || value === 'true' || value === '1' || value === 'living';
    },

    _hasDeathDetails(person) {
      const p = person || {};
      return !!(
        String(p.dYear || '').trim()
        || String(p.dDate || '').trim()
        || String(p.dPlace || '').trim()
        || String(p.age || '').trim()
      );
    },

    _resolveLiving(person) {
      const p = person || {};
      if (p.isLiving !== undefined && p.isLiving !== null && p.isLiving !== '') {
        return this._normalizeLivingValue(p.isLiving);
      }
      const b = parseInt(String(p.bYear || '').trim(), 10);
      const currentYear = new Date().getFullYear();
      const hasDeathMarker = this._hasDeathDetails(p);
      return !hasDeathMarker && Number.isFinite(b) && b >= 1930 && b <= currentYear;
    },

    _toChineseInteger(value) {
      const n = parseInt(String(value || '').trim(), 10);
      if (!Number.isFinite(n) || n <= 0) return String(value || '').trim();
      const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      if (n < 10) return digits[n];
      if (n < 100) {
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        return (tens === 1 ? '' : digits[tens]) + '十' + (ones ? digits[ones] : '');
      }
      if (n < 1000) {
        const hundreds = Math.floor(n / 100);
        const rest = n % 100;
        if (!rest) return digits[hundreds] + '百';
        if (rest < 10) return digits[hundreds] + '百零' + digits[rest];
        const tens = Math.floor(rest / 10);
        const ones = rest % 10;
        return digits[hundreds] + '百' + digits[tens] + '十' + (ones ? digits[ones] : '');
      }
      return String(n);
    },

    _ageState(person) {
      const p = person || {};
      const storedAge = String(p.age || '').trim();
      const explicitLiving = p.isLiving !== undefined && p.isLiving !== null && p.isLiving !== '';
      const living = this._resolveLiving(p);
      const hasDeathYear = !!String(p.dYear || '').trim();
      const hasDeathDetails = this._hasDeathDetails(p);
      const computedAge = hasDeathYear ? this._computeSuiAge(p.bYear, p.dYear) : '';
      const livingAge = living ? this._computeLivingSuiAge(p.bYear) : '';
      const rawAge = (living ? (livingAge || storedAge) : (storedAge || computedAge));
      const isManual = !!storedAge && storedAge !== computedAge;
      const displayAge = rawAge ? `${this._toChineseInteger(rawAge)}岁` : '虚岁';
      const ageLabel = living ? '现年' : '享年';
      const livingToggleDisabled = !living && hasDeathDetails;
      const lifeAutoField = living
        ? String(p._lifeAutoField || (livingAge ? 'age' : ''))
        : String(p._lifeAutoField || (storedAge && storedAge === computedAge ? 'age' : ''));
      return {
        ageValue: rawAge,
        ageLabel,
        ageDisplay: displayAge,
        agePhraseDisplay: rawAge ? `${ageLabel}${displayAge}` : ageLabel,
        ageManual: !living && isManual,
        ageComputedClass: lifeAutoField === 'age' ? 'is-auto-age' : '',
        lifeAutoField,
        ...this._lifeAutoDisabledState(lifeAutoField),
        showDeathInline: !living && hasDeathYear,
        isLivingChecked: living,
        isDeceasedChecked: !living,
        livingStatusExplicit: explicitLiving,
        livingToggleDisabled,
        lifeStatusToggleClass: 'life-status-toggle ' + (living ? 'is-living' : 'is-deceased') + (livingToggleDisabled ? ' is-disabled' : ''),
        livingStatusClass: living ? 'living-radio-label active' : 'living-radio-label',
        deceasedStatusClass: living ? 'living-radio-label' : 'living-radio-label active'
      };
    },

    _lifeCompactDisplay(person, ageState) {
      const p = person || {};
      const state = ageState || this._ageState(p);
      const b = String(p.bYear || '').trim();
      const d = String(p.dYear || '').trim();
      const agePhrase = state.ageValue ? state.agePhraseDisplay : '';

      if (state.isLivingChecked) {
        return [b, agePhrase].filter(Boolean).join(' ');
      }

      const yearRange = formatLifeRange(b, d);
      return [yearRange, agePhrase].filter(Boolean).join(' ');
    },

    _lifeCompactSubDisplay(person, ageState) {
      const p = person || {};
      const state = ageState || this._ageState(p);
      const birthDate = this._lifeDateDisplay(p, 'birth');
      const deathDate = this._lifeDateDisplay(p, 'death');
      const birthPhrase = birthDate ? `生于${birthDate}` : '';
      const deathPhrase = (!state.isLivingChecked && deathDate) ? `卒于${deathDate}` : '';
      return [birthPhrase, deathPhrase].filter(Boolean).join(' ');
    },

    _decorateRelationList(list, type, draggingId = '', dragOffsetY = 0) {
      const source = (list || []).map(item => this._decoratePerson(item)).filter(Boolean);
      const showReorder = source.length > 1 && !source.some(item => item._disableReorder);
      return source.map((item) => {
        const gender = item.gender || 'unknown';
        const isDragging = item.id === draggingId;
        return {
          ...item,
          cardClass: 'rel-card ' + gender + ' relation-' + type + (item._otherTree ? ' external-tree' : '') + (item._treeHidden ? ' tree-hidden' : '') + (isDragging ? ' dragging' : ''),
          cardStyle: isDragging ? `transform: translateY(${dragOffsetY}px) scale(1.02);` : '',
          yearText: item._displayYear || item.bYear || '',
          rankText: this._normalizeRankText(item.rank),
          showReorder,
          relationType: type
        };
      });
    },

    _decoratePaternalRows(rows) {
      const source = (rows || []).map(row => this._decoratePerson(row)).filter(Boolean);
      return source.map(row => ({
        ...row,
        rowClass: 'lineage-bar-row level-' + (row.level || 1),
        contentClass: 'lineage-bar-content' + (row._otherTree ? ' external-tree' : ''),
        yearText: row._displayYear || row.bYear || '',
        rankText: this._normalizeRankText(row.rank)
      }));
    },

    _buildMotherState(localMother) {
      const range = this.properties.motherRange || [];
      const hasPicker = range.length > 1 || !!localMother;
      const pending = this.properties.pendingMotherSelected === true;
      const currentGender = localMother ? (localMother.gender || 'female') : 'female';
      const pickerName = localMother ? localMother._displayName : (this.properties.currentMotherName || '');
      const pickerYear = localMother ? (localMother._displayYear || localMother.bYear || '') : '';
      const pickerRank = localMother ? this._normalizeRankText(localMother.rank) : '';
      const selectedMotherId = localMother ? localMother.id : '';
      const selectedIndex = Math.max(0, range.findIndex(item => item && item.id === selectedMotherId));
      const cardClass = 'rel-card ' + currentGender + (pending ? ' pending-highlight' : '') + (localMother && localMother._otherTree ? ' external-tree' : '');
      const triggerClass = hasPicker && !localMother && !pending ? 'picker-box invitation' : cardClass;

      return {
        showMotherPicker: hasPicker,
        showMotherInvitation: hasPicker && !localMother && !pending,
        showMotherPickerCard: hasPicker && (!!localMother || pending),
        showMotherStatic: !hasPicker && !!localMother,
        showMotherEmpty: !hasPicker && !localMother,
        motherPickerCardClass: cardClass,
        motherPickerTriggerClass: triggerClass,
        motherStaticCardClass: localMother ? ('rel-card ' + (localMother.gender || 'female') + (localMother._otherTree ? ' external-tree' : '')) : 'rel-card female',
        motherPickerName: pickerName,
        motherPickerYear: pickerYear,
        motherPickerRank: pickerRank,
        motherPickerIndex: selectedIndex,
        motherPickerDraftIndex: selectedIndex,
        motherPickerSheetValue: [selectedIndex],
        motherStaticName: localMother ? localMother._displayName : '',
        motherStaticYear: localMother ? (localMother._displayYear || localMother.bYear || '') : '',
        motherStaticRank: localMother ? this._normalizeRankText(localMother.rank) : '',
        localMotherId: localMother ? localMother.id : ''
      };
    },

    _initializeDrawer() {
      const p = this.properties.person || {};
      const creatingProfile = this.properties.creatingProfile === true;
      const nameState = this._nameEditorState(p);
      const realChildren = Array.isArray(p.children) ? p.children.filter(Boolean) : [];
      const spouseCount = (this.properties.spouses || []).length;
      const hasSpouses = spouseCount > 0;
      const hasFather = !!this.properties.father;
      const isSpouseNode = !!p.isSpouse;
      const isSpouseProgenitor = isSpouseNode && this._isProgenitor(p.id);
      const canDeletePromotableRoot = !isSpouseNode
        && p.gender === 'male'
        && this._isProgenitor(p.id)
        && realChildren.length === 1
        && !hasSpouses;
      const canDeleteLinkedLeaf = realChildren.length === 0 && spouseCount + (hasFather ? 1 : 0) <= 1;
      const canDelete = canDeleteLinkedLeaf || (isSpouseProgenitor && realChildren.length === 0) || canDeletePromotableRoot;
      const localMother = this._decoratePerson(this.properties.mother);
      const localPaternalRows = this._decoratePaternalRows(this.properties.paternalRows || []);
      const changedFields = {};
      const lifeAuto = this._computeLifeAuto(p, '');
      const lifePerson = lifeAuto.person;
      const ageState = this._ageState(lifePerson);
      const personalEventRows = this._decoratePersonalEvents(p.events || []);

      this.setData({
        drawerY: creatingProfile ? 50 : Math.floor(this._winH * 0.55),
        drawerShowClass: 'show',
        draggingRelationType: '',
        draggingRelationId: '',
        draggingOffsetY: 0,
        hasChanges: false,
        editGender: false,
        showGenderDisplay: true,
        showGenderEditor: false,
        activeField: '',
        changedFields,
        ...nameState,
        ...this._profileSummaryState(p),
        aliasHint: p.gender === 'female' ? '(号)易安' : '(字)子瞻, (号)东坡',
        hometownPlaceholder: this.properties.hometownHint || '江苏吴县',
        bYearDisplay: this._lifeYearDisplay(lifePerson.bYear),
        dYearDisplay: this._lifeYearDisplay(lifePerson.dYear),
        bYearValue: lifePerson.bYear || '',
        dYearValue: lifePerson.dYear || '',
        bDateValue: p.bDate || '',
        dDateValue: p.dDate || '',
        bDatePlaceholder: this._dateHintForYear(lifePerson.bYear) || '生辰',
        dDatePlaceholder: this._dateHintForYear(lifePerson.dYear) || '忌日',
        ...ageState,
        lifeCompactDisplay: this._lifeCompactDisplay(lifePerson, ageState),
        lifeCompactSubDisplay: this._lifeCompactSubDisplay(lifePerson, ageState),
        personalEventRows,
        personalEventSummaryText: this._personalEventSummaryText(personalEventRows),
        personalEventDraftName: '',
        personalEventDraftYear: '',
        personalEventDraftTone: 0,
        ...this._personalEventDraftWidthPatch('', ''),
        showPersonalEventDraft: false,
        showPersonalEventEditor: false,
        localSpouses: this._decorateRelationList(this.properties.spouses || [], 'spouses'),
        localChildren: this._decorateRelationList(this.properties.children || [], 'children'),
        localPaternalRows,
        showPaternalRows: localPaternalRows.length > 0,
        showRelations: !creatingProfile,
        showAddFatherBtn: !this.properties.father && this.properties.canAddFather,
        showAddChildBtn: p.gender === 'male',
        showFemaleChildHint: p.gender === 'female',
        showHeaderTreeChip: this.properties.showJumpBtn === true,
        saveButtonClass: creatingProfile ? 'save-btn-main active' : 'save-btn-main disabled',
        deleteVisible: canDelete && !creatingProfile,
        ...this._genderState(p.gender || 'male'),
        ...this._sectionState(creatingProfile, false, creatingProfile),
        ...this._fieldClasses(changedFields, '', nameState.nameManual, nameState.fullNameEditing, ageState.lifeAutoField),
        ...this._namePartWidthPatch(nameState.editSurname, nameState.editFirstname),
        ...this._rankWidthPatch(p.rank),
        ...this._buildMotherState(localMother)
      });
    },

    _markChanged(field, extra = {}) {
      const changedFields = { ...(this.data.changedFields || {}) };
      if (field) changedFields[field] = true;
      this.setData({
        hasChanges: true,
        changedFields,
        saveButtonClass: 'save-btn-main active',
        ...this._fieldClasses(changedFields, this.data.activeField, this.data.nameManual, this.data.fullNameEditing, this.data.lifeAutoField),
        ...extra
      });
    },

    _eventField(e) {
      return (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.f)
        || (e && e.target && e.target.dataset && e.target.dataset.f)
        || '';
    },

    _normalizedFieldValue(field, value) {
      return field === 'rank' ? this._normalizeRankText(value) : String(value || '');
    },

    _isLifeNumberField(field) {
      return field === 'bYear' || field === 'dYear' || field === 'age';
    },

    _lifeNumberDraftPatch(field, value) {
      if (field === 'bYear') return { bYearValue: value };
      if (field === 'dYear') return { dYearValue: value };
      if (field === 'age') return { ageValue: value };
      return {};
    },

    _currentFieldValue(field) {
      if (field === 'age') return this.data.ageValue;
      if (field === 'bYear') return this.data.bYearValue;
      if (field === 'dYear') return this.data.dYearValue;
      if (field === 'bDate') return this.data.bDateValue;
      if (field === 'dDate') return this.data.dDateValue;
      return (this.properties.person || {})[field];
    },

    _fieldDisplayPatch(field, value) {
      const extra = {};
      const lifeFields = ['bYear', 'bDate', 'bPlace', 'dYear', 'dDate', 'dPlace', 'age', 'isLiving'];
      if (field === 'gender') {
        extra.aliasHint = value === 'female' ? '(\u53f7)\u6613\u5b89' : '(\u5b57)\u5b50\u77bb, (\u53f7)\u4e1c\u5761';
        extra.showAddChildBtn = value === 'male';
        extra.showFemaleChildHint = value === 'female';
        Object.assign(extra, this._genderState(value));
      }
      if (field === 'rank') {
        Object.assign(extra, this._rankWidthPatch(value));
      }
      if (field === 'alias' || field === 'rank' || field === 'hometown') {
        extra.profileSummaryAlias = field === 'alias' ? String(value || '').trim() : this.data.profileSummaryAlias;
        extra.profileSummaryRank = field === 'rank' ? this._normalizeRankText(value) : this.data.profileSummaryRank;
        extra.profileSummaryHometown = field === 'hometown' ? String(value || '').trim() : this.data.profileSummaryHometown;
        extra.displayNameRankSuffix = extra.profileSummaryRank ? ` (${extra.profileSummaryRank})` : '';
        extra.showProfileSummary = !!(extra.profileSummaryAlias || extra.profileSummaryRank || extra.profileSummaryHometown);
      }
      if (lifeFields.includes(field)) {
        const person = this.properties.person || {};
        const nextLifePerson = {
          ...person,
          bYear: field === 'bYear' ? value : (this.data.bYearValue !== undefined ? this.data.bYearValue : person.bYear),
          bDate: field === 'bDate' ? value : person.bDate,
          bPlace: field === 'bPlace' ? value : person.bPlace,
          dYear: field === 'dYear' ? value : (this.data.dYearValue !== undefined ? this.data.dYearValue : person.dYear),
          dDate: field === 'dDate' ? value : person.dDate,
          dPlace: field === 'dPlace' ? value : person.dPlace,
          age: field === 'age' ? value : (this.data.ageValue !== undefined ? this.data.ageValue : person.age),
          isLiving: field === 'isLiving' ? value : this.data.isLivingChecked,
          _lifeAutoField: this.data.lifeAutoField || ''
        };
        const auto = this._computeLifeAuto(nextLifePerson, ['bYear', 'dYear', 'age'].includes(field) ? field : '');
        const lifePerson = auto.person;
        const ageState = this._ageState(lifePerson);
        const changedFields = { ...(this.data.changedFields || {}), [field]: true };
        ['bYear', 'dYear', 'age'].forEach((name) => {
          if (String(lifePerson[name] || '') !== String(person[name] || '')) changedFields[name] = true;
        });
        Object.assign(extra, ageState, {
          changedFields,
          bYearValue: lifePerson.bYear || '',
          dYearValue: lifePerson.dYear || '',
          bDateValue: lifePerson.bDate || '',
          dDateValue: lifePerson.dDate || '',
          bDatePlaceholder: this._dateHintForYear(lifePerson.bYear) || '生辰',
          dDatePlaceholder: this._dateHintForYear(lifePerson.dYear) || '忌日',
          bYearDisplay: this._lifeYearDisplay(lifePerson.bYear),
          dYearDisplay: this._lifeYearDisplay(lifePerson.dYear),
          lifeCompactDisplay: this._lifeCompactDisplay(lifePerson, ageState),
          lifeCompactSubDisplay: this._lifeCompactSubDisplay(lifePerson, ageState),
          ...this._lifeAutoDisabledState(ageState.lifeAutoField),
          ...this._fieldClasses(changedFields, this.data.activeField, this.data.nameManual, this.data.fullNameEditing, ageState.lifeAutoField)
        });
      }
      return extra;
    },

    _applyFieldChange(field, value) {
      if (!field) return;
      const patch = this._fieldDisplayPatch(field, value);
      this._markChanged(field, patch);
      this.triggerEvent('updatefield', { field, value });
      return patch;
    },

    _setDrawerInternalState(patch) {
      this.setData({
        drawerMotionClass: 'no-motion',
        ...patch
      }, () => {
        setTimeout(() => {
          if (this.data.drawerMotionClass === 'no-motion') {
            this.setData({ drawerMotionClass: '' });
          }
        }, 80);
      });
    },

    onFocus(e) {
      const activeField = this._eventField(e);
      this._focusField = activeField;
      this._focusFieldValue = this._normalizedFieldValue(activeField, this._currentFieldValue(activeField));
      const patch = {
        activeField,
        ...this._fieldClasses(this.data.changedFields || {}, activeField, this.data.nameManual, this.data.fullNameEditing, this.data.lifeAutoField)
      };
      if (activeField === 'name' && !this.data.nameManual && !this.data.fullNameValue) {
        patch.fullNameValue = this.data.fullNamePlaceholder || '';
        patch.fullNameEditing = true;
        Object.assign(patch, this._fieldClasses(this.data.changedFields || {}, activeField, false, true, this.data.lifeAutoField));
      }
      if (activeField === 'bDate' || activeField === 'dDate') {
        const hint = activeField === 'bDate' ? this.data.bDatePlaceholder : this.data.dDatePlaceholder;
        const defaultText = activeField === 'bDate' ? '生辰' : '忌日';
        const current = String(this._currentFieldValue(activeField) || '').trim();
        if (!current && hint && hint !== defaultText) {
          patch[activeField === 'bDate' ? 'bDateValue' : 'dDateValue'] = hint;
          this._focusFieldValue = hint;
          this._dateHintFocusField = activeField;
          this._dateHintFocusValue = hint;
        }
      }
      if (activeField === 'hometown') {
        const current = String((this.properties.person && this.properties.person.hometown) || '').trim();
        const hint = String(this.properties.hometownHint || '').trim();
        if (!current && hint) {
          const changedFields = { ...(this.data.changedFields || {}), hometown: true };
          patch['person.hometown'] = hint;
          patch.hasChanges = true;
          patch.changedFields = changedFields;
          patch.saveButtonClass = 'save-btn-main active';
          Object.assign(patch, this._fieldDisplayPatch('hometown', hint));
          Object.assign(patch, this._fieldClasses(changedFields, activeField, this.data.nameManual, this.data.fullNameEditing, this.data.lifeAutoField));
          this.triggerEvent('updatefield', { field: 'hometown', value: hint });
        }
      }
      if ((this.data.drawerY || 0) > 0) {
        patch.drawerY = 0;
      }
      this._setDrawerInternalState(patch);
    },

    onBlur(e) {
      const field = this._eventField(e);
      const blurValue = e && e.detail && e.detail.value !== undefined
        ? e.detail.value
        : this._currentFieldValue(field);
      const emitBlur = () => {
        if (field) this.triggerEvent('fieldblur', { field, value: blurValue });
      };
      if (field === 'name') {
        const patch = { activeField: '' };
        if (!this.data.nameManual && !(this.data.changedFields || {}).name) {
          patch.fullNameValue = '';
          patch.fullNameEditing = false;
          Object.assign(patch, this._fieldClasses(this.data.changedFields || {}, '', false, false, this.data.lifeAutoField));
        } else {
          Object.assign(patch, this._fieldClasses(this.data.changedFields || {}, '', this.data.nameManual, this.data.fullNameEditing, this.data.lifeAutoField));
        }
        this.setData(patch, emitBlur);
        return;
      }
      let appliedPatch = {};
      if (field && e && e.detail && e.detail.value !== undefined) {
        const current = this._focusField === field
          ? this._focusFieldValue
          : this._normalizedFieldValue(field, this._currentFieldValue(field));
        const nextValue = e.detail.value;
        const untouchedDateHint = this._dateHintFocusField === field
          && !(this.data.changedFields || {})[field]
          && (String(nextValue || '') === this._dateHintFocusValue || String(nextValue || '') === '');
        if (!untouchedDateHint && this._normalizedFieldValue(field, nextValue) !== current) {
          appliedPatch = this._applyFieldChange(field, nextValue) || {};
        }
      }
      this._focusField = '';
      this._focusFieldValue = '';
      const clearDateHint = this._dateHintFocusField === field
        && (String(e.detail && e.detail.value || '') === this._dateHintFocusValue || String(e.detail && e.detail.value || '') === '')
        && !(this.data.changedFields || {})[field];
      this._dateHintFocusField = '';
      this._dateHintFocusValue = '';
      const nextChangedFields = appliedPatch.changedFields || this.data.changedFields || {};
      const nextLifeAutoField = appliedPatch.lifeAutoField !== undefined ? appliedPatch.lifeAutoField : this.data.lifeAutoField;
      const blurPatch = {
        activeField: '',
        ...this._fieldClasses(nextChangedFields, '', this.data.nameManual, this.data.fullNameEditing, nextLifeAutoField)
      };
      if (clearDateHint) {
        blurPatch[field === 'bDate' ? 'bDateValue' : 'dDateValue'] = '';
      }
      this.setData(blurPatch, emitBlur);
    },

    onExitEdit() {
      const creatingProfile = this.properties.creatingProfile === true;
      const nextSections = this._sectionState(creatingProfile, false, creatingProfile);
      if (this.data.showPersonalEventEditor || this.data.showPersonalEventDraft) {
        this._finishPersonalEventEditing();
      }
      this._setDrawerInternalState({
        editGender: false,
        showGenderDisplay: true,
        showGenderEditor: false,
        activeField: '',
        ...nextSections,
        ...this._fieldClasses(this.data.changedFields || {}, '', this.data.nameManual, this.data.fullNameEditing, this.data.lifeAutoField)
      });
    },

    stop(e) {
      if (e && e.stopPropagation) e.stopPropagation();
    },

    onToggleNameSection() {
      if (this.properties.creatingProfile === true) return;
      const expanded = !this.data.nameSectionExpanded;
      const expandLife = expanded
        && !String(this.data.lifeCompactDisplay || '').trim()
        && !String(this.data.lifeCompactSubDisplay || '').trim()
        ? true
        : this.data.lifeSectionExpanded;
      this._setDrawerInternalState(this._sectionState(expanded, expandLife, false));
    },

    onToggleLifeSection() {
      const expanded = !this.data.lifeSectionExpanded;
      this._setDrawerInternalState(this._sectionState(this.data.nameSectionExpanded, expanded, this.properties.creatingProfile === true));
    },

    onAgeInfoTap() {
      wx.showModal({
        title: '年份与享年',
        content: '出生、去世年份均按传统纪年理解：如 1900 指庚子年正月至辛丑年正月前。1949 年以后的现代年份也沿用同一规则。享年按传统岁数（虚岁）计算。',
        showCancel: false,
        confirmText: '知道了'
      });
    },

    onStartEditGender() {
      this._setDrawerInternalState({
        editGender: true,
        showGenderDisplay: false,
        showGenderEditor: true
      });
    },

    onToggleLivingStatus() {
      if (!this.data.isLivingChecked && this.data.livingToggleDisabled) {
        wx.showToast({ title: '请先清空去世信息', icon: 'none' });
        return;
      }
      this._applyFieldChange('isLiving', !this.data.isLivingChecked);
    },

    onUpdateNameParts(e) {
      const field = e.currentTarget.dataset.f;
      const value = e.detail.value;
      const nameManual = this.data.nameManual;
      const surname = field === 'surname' ? value : (this.data.editSurname || '');
      const firstname = field === 'firstname' ? value : (this.data.editFirstname || '');
      const defaultFullName = this._defaultFullName(surname, firstname);
      const manualName = nameManual ? (this.data.fullNameValue || '') : '';
      const displayName = nameManual
        ? this._computeDisplayName(manualName, surname, firstname, true)
        : (defaultFullName || '无名');

      this._markChanged(field, {
        editSurname: surname,
        editFirstname: firstname,
        displayName,
        fullNamePlaceholder: defaultFullName || '无名',
        fullNameValue: (!nameManual && this.data.fullNameEditing) ? (defaultFullName || '') : this.data.fullNameValue,
        ...this._namePartWidthPatch(surname, firstname)
      });
      this.triggerEvent('updatefield', { field, value });
      if (!nameManual && defaultFullName) {
        this.triggerEvent('updatefield', { field: 'name', value: '' });
      }
    },

    onUpdateFullName(e) {
      const value = e.detail.value || '';
      const defaultFullName = this._defaultFullName(this.data.editSurname, this.data.editFirstname);
      const nameManual = value !== '';
      const displayName = nameManual
        ? value
        : (defaultFullName || '无名');

      this.setData({ nameManual, fullNameValue: value, fullNameEditing: nameManual });
      this._markChanged('name', {
        displayName,
        fullNameValue: value,
        fullNameEditing: nameManual,
        ...this._fieldClasses({ ...(this.data.changedFields || {}), name: true }, this.data.activeField, nameManual, nameManual, this.data.lifeAutoField)
      });
      this.triggerEvent('updatefield', { field: 'name', value });
    },

    onUpdate(e) {
      const field = this._eventField(e);
      const value = e.detail.value;
      if (this._isLifeNumberField(field)) {
        if (this.data.lifeAutoField === field) return;
        const patch = this._lifeNumberDraftPatch(field, value);
        if (field === 'bYear') {
          patch.bDatePlaceholder = this._dateHintForYear(value) || '生辰';
        } else if (field === 'dYear') {
          patch.dDatePlaceholder = this._dateHintForYear(value) || '忌日';
        }
        this.setData(patch);
        return;
      }
      this._applyFieldChange(field, value);
    },

    openMotherPickerSheet() {
      if (!this.data.showMotherPicker) return;
      const index = Math.max(0, Number(this.data.motherPickerIndex) || 0);
      this.setData({
        showMotherPickerSheet: true,
        motherPickerDraftIndex: index,
        motherPickerSheetValue: [index]
      });
    },

    closeMotherPickerSheet() {
      this.setData({ showMotherPickerSheet: false });
    },

    onMotherPickerViewChange(e) {
      const value = e && e.detail && Array.isArray(e.detail.value) ? e.detail.value : [0];
      const index = Math.max(0, Number(value[0]) || 0);
      this.setData({
        motherPickerDraftIndex: index,
        motherPickerSheetValue: [index]
      });
    },

    confirmMotherPickerSheet() {
      const index = Math.max(0, Number(this.data.motherPickerDraftIndex) || 0);
      this._markChanged('motherId');
      this.setData({ showMotherPickerSheet: false });
      this.triggerEvent('motherchange', { value: index });
    },

    onMotherChange(e) {
      this._markChanged('motherId');
      this.triggerEvent('motherchange', e.detail);
    },

    onPersonalEventDraftInput(e) {
      const field = e.currentTarget.dataset.field;
      if (!field) return;
      const value = e.detail && e.detail.value !== undefined ? e.detail.value : '';
      const nextName = field === 'personalEventDraftName' ? value : this.data.personalEventDraftName;
      const nextYear = field === 'personalEventDraftYear' ? value : this.data.personalEventDraftYear;
      const hasDraft = !!(String(nextName || '').trim() || String(nextYear || '').trim());
      this.setData({
        [field]: value,
        personalEventDraftTone: this._personalEventToneForName(nextName),
        ...this._personalEventDraftWidthPatch(nextName, nextYear),
        showPersonalEventDraft: true,
        saveButtonClass: hasDraft ? 'save-btn-main active' : (this.data.hasChanges ? 'save-btn-main active' : 'save-btn-main disabled')
      });
    },

    onShowPersonalEventDraft() {
      this.setData({
        showPersonalEventDraft: true,
        showPersonalEventEditor: true,
        drawerY: 0
      });
    },

    onCancelPersonalEventDraft() {
      this.setData({
        personalEventDraftName: '',
        personalEventDraftYear: '',
        personalEventDraftTone: 0,
        ...this._personalEventDraftWidthPatch('', ''),
        showPersonalEventDraft: false,
        showPersonalEventEditor: false,
        saveButtonClass: this.data.hasChanges ? 'save-btn-main active' : 'save-btn-main disabled'
      });
    },

    onEditPersonalEvents() {
      this.setData({
        showPersonalEventEditor: true,
        showPersonalEventDraft: false,
        drawerY: 0
      });
    },

    _commitPersonalEventDraft(options = {}) {
      const silent = options.silent === true;
      const name = String(this.data.personalEventDraftName || '').trim();
      const ranges = this._parsePersonalEventYearRanges(this.data.personalEventDraftYear);
      if (!name) {
        if (!silent) wx.showToast({ title: '请填写事件名', icon: 'none' });
        return false;
      }
      if (!ranges || !ranges.length) {
        if (!silent) wx.showToast({ title: '请填写年份', icon: 'none' });
        return false;
      }
      const yearLabel = this._formatPersonalEventYearRanges(ranges);
      const rows = [
        ...(this.data.personalEventRows || []),
        {
          id: this._makePersonalEventId(this.data.personalEventRows || []),
          name,
          year: yearLabel,
          yearLabel
        }
      ];
      this._setPersonalEventRows(rows, {
        personalEventDraftName: '',
        personalEventDraftYear: '',
        personalEventDraftTone: 0,
        ...this._personalEventDraftWidthPatch('', ''),
        showPersonalEventDraft: false,
        showPersonalEventEditor: false
      });
      return true;
    },

    _finishPersonalEventEditing() {
      const hasDraft = !!(
        String(this.data.personalEventDraftName || '').trim()
        || String(this.data.personalEventDraftYear || '').trim()
      );
      if (hasDraft && this._commitPersonalEventDraft({ silent: true })) return;
      this.setData({
        personalEventDraftName: '',
        personalEventDraftYear: '',
        personalEventDraftTone: 0,
        ...this._personalEventDraftWidthPatch('', ''),
        showPersonalEventDraft: false,
        showPersonalEventEditor: false,
        saveButtonClass: this.data.hasChanges ? 'save-btn-main active' : 'save-btn-main disabled'
      });
    },

    onAddPersonalEvent() {
      this._commitPersonalEventDraft();
    },

    onPersonalEventInput(e) {
      const index = Number(e.currentTarget.dataset.index);
      const field = e.currentTarget.dataset.field;
      if (!Number.isFinite(index) || !field) return;
      const rows = [...(this.data.personalEventRows || [])];
      if (!rows[index]) return;
      rows[index] = {
        ...rows[index],
        [field]: e.detail && e.detail.value !== undefined ? e.detail.value : ''
      };
      this._setPersonalEventRows(rows, {}, { sort: false });
    },

    onTogglePersonalEventVisibility(e) {
      const index = Number(e.currentTarget.dataset.index);
      const rows = [...(this.data.personalEventRows || [])];
      if (!Number.isFinite(index) || index < 0 || index >= rows.length) return;
      const targetName = String(rows[index] && rows[index].name || '').trim();
      if (!targetName) return;
      const nextHidden = !rows[index].hidden;
      const updatedRows = rows.map(row => (
        String(row && row.name || '').trim() === targetName
          ? { ...row, hidden: nextHidden }
          : row
      ));
      const personalEventRows = this._decoratePersonalEvents(updatedRows, { sort: false });
      const value = this._personalEventRowsToStorage(personalEventRows);
      this.setData({
        personalEventRows,
        personalEventSummaryText: this._personalEventSummaryText(personalEventRows)
      });
      this.triggerEvent('updatefield', { field: 'events', value });
      this.triggerEvent('personaleventvisibilitychange', {
        name: targetName,
        hidden: nextHidden,
        value
      });
    },

    onDeletePersonalEvent(e) {
      const index = Number(e.currentTarget.dataset.index);
      const rows = [...(this.data.personalEventRows || [])];
      if (!Number.isFinite(index) || index < 0 || index >= rows.length) return;
      rows.splice(index, 1);
      this._setPersonalEventRows(rows);
    },

    _swapRelation(type, index, nextIndex, dragOffsetY = 0) {
      const listKey = type === 'spouses' ? 'localSpouses' : 'localChildren';
      const list = [...(this.data[listKey] || [])];
      if (nextIndex < 0 || nextIndex >= list.length || index === nextIndex) return null;

      [list[index], list[nextIndex]] = [list[nextIndex], list[index]];
      return {
        listKey,
        list: this._decorateRelationList(list, type, this.data.draggingRelationId, dragOffsetY)
      };
    },

    startRelationDrag(e) {
      const type = e.currentTarget.dataset.type;
      const index = Number(e.currentTarget.dataset.index);
      const listKey = type === 'spouses' ? 'localSpouses' : 'localChildren';
      const list = this.data[listKey] || [];
      const item = list[index];
      const touch = e.touches && e.touches[0];
      if (!item || list.length <= 1 || !touch) return;

      this._relationDrag = {
        type,
        listKey,
        index,
        startY: touch.clientY,
        lastY: touch.clientY,
        offsetY: 0,
        rowStep: this._rowStep,
        changed: false
      };
      this.setData({
        draggingRelationType: type,
        draggingRelationId: item.id,
        draggingOffsetY: 0,
        [listKey]: this._decorateRelationList(list, type, item.id, 0)
      });
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    },

    moveRelationDrag(e) {
      if (!this._relationDrag) return;
      const touch = e.touches && e.touches[0];
      if (!touch) return;

      const drag = this._relationDrag;
      let offsetY = touch.clientY - drag.startY;
      let nextIndex = drag.index;
      let direction = 0;

      if (offsetY > drag.rowStep) {
        direction = 1;
        nextIndex = drag.index + 1;
      } else if (offsetY < -drag.rowStep) {
        direction = -1;
        nextIndex = drag.index - 1;
      }

      if (direction !== 0) {
        const adjustedOffset = offsetY - (direction * drag.rowStep);
        const swapped = this._swapRelation(drag.type, drag.index, nextIndex, adjustedOffset);
        if (swapped) {
          drag.index = nextIndex;
          drag.startY += direction * drag.rowStep;
          drag.offsetY = adjustedOffset;
          drag.changed = true;
          this._relationDrag = drag;
          this.setData({
            draggingOffsetY: adjustedOffset,
            [swapped.listKey]: swapped.list,
            hasChanges: true,
            saveButtonClass: 'save-btn-main active'
          });
          return;
        }
      }

      drag.offsetY = offsetY;
      this._relationDrag = drag;
      const list = this.data[drag.listKey] || [];
      this.setData({
        draggingOffsetY: offsetY,
        [drag.listKey]: this._decorateRelationList(list, drag.type, this.data.draggingRelationId, offsetY)
      });
    },

    endRelationDrag() {
      if (!this._relationDrag) return;
      const drag = this._relationDrag;
      const list = this.data[drag.listKey] || [];
      this._relationDrag = null;
      this.setData({
        draggingRelationType: '',
        draggingRelationId: '',
        draggingOffsetY: 0,
        [drag.listKey]: this._decorateRelationList(list, drag.type, '', 0)
      });
      if (drag.changed) {
        this.triggerEvent('updatefield', { field: drag.type, value: list.map(item => item.id) });
      }
    },

    touchStart(e) {
      this._dragStartY = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
    },

    touchMove(e) {
      const touch = e.touches && e.touches[0];
      if (!touch) return;
      const y = touch.clientY;
      this.setData({ drawerY: y < 50 ? 50 : y });
    },

    touchEnd() {
      const y = this.data.drawerY;
      if (y < this._winH * 0.4) this.setData({ drawerY: 50 });
      else if (y > this._winH * 0.85) this.onClose();
      else this.setData({ drawerY: this._peekY });
    },

    onSave() {
      const hasEventDraft = !!(
        String(this.data.personalEventDraftName || '').trim()
        || String(this.data.personalEventDraftYear || '').trim()
      );
      if (!this.data.hasChanges && this.properties.creatingProfile !== true && !hasEventDraft) return;
      if (hasEventDraft && !this._commitPersonalEventDraft()) return;
      this.triggerEvent('commit');
    },

    onClose() { this.triggerEvent('close'); },
    onDelete() { this.triggerEvent('delete'); },
    onJump(e) { this.triggerEvent('jump', e.currentTarget.dataset); },

    onRelationCardTap(e) {
      const dataset = (e && e.currentTarget && e.currentTarget.dataset) || {};
      if (!dataset.id) return;
      if (!this.properties.relationVisibilityEnabled) {
        this.triggerEvent('jump', dataset);
        return;
      }
      this.triggerEvent('relationvisibilitytoggle', {
        id: dataset.id,
        type: dataset.type || ''
      });
    },
    onJumpToTree(e) {
      this.triggerEvent('closeprofile');
      this.triggerEvent('jumptotree', e.currentTarget.dataset);
    },
    onAddSpouse() { this.triggerEvent('addspouse'); },
    onAddChild() { this.triggerEvent('addchild'); },
    onAddFather() { this.triggerEvent('addfather'); }
  }
});
