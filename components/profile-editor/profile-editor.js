// components/profile-editor/profile-editor.js
// SIMPLIFIED: Single source of truth - all data comes from 'person' prop
// Changes are only applied when 'Save' is clicked (triggering 'commit' event)
Component({
  properties: {
    show:              Boolean,
    person:            Object,   // Single source of truth - all fields come from here
    spouses:           Array,
    children:          Array,
    father:            Object,   // Father object (if exists)
    motherRange:       Array,
    currentMotherName: String,
    pendingMotherSelected: Boolean,
    currentRootId:     String,
    canAddFather:      Boolean,
    showJumpBtn:       Boolean,
    creatingProfile:   Boolean,
    hometownHint:      String
  },

  data: {
    drawerY: 2000,
    hasChanges: false,
    editGender: false,
    draggingIndex: -1,
    dragType: '',
    dragVisualY: 0,
    localSpouses: [],
    localChildren: [],
    currentMotherBYear: '',
    currentMotherGender: 'female',
    nameManual: false,
    activeField: '',
    aliasHint: '(字)子瞻, (号)东坡',
    displayName: '',
    unsaved: {},
    canDelete: false,
    paternalAncestors: {
      greatGrandfather: '',
      greatGrandfatherYear: '',
      grandfather: '',
      grandfatherYear: '',
      father: '',
      fatherYear: ''
    },
    // Collapsible sections
    nameSectionExpanded: false,
    lifeSectionExpanded: false,
    // Track which fields have been modified
    changedFields: {}
  },

  // Cache window height once so we don't call window‑info APIs on every touch event
  _winH: 0,
  _peekY: 0,
  _lastPersonId: null,

  lifetimes: {
    attached() {
      try {
        // 优先使用新 API wx.getWindowInfo，不支持时回退到 wx.getSystemInfoSync
        if (wx.getWindowInfo) {
          this._winH = wx.getWindowInfo().windowHeight;
        } else {
          this._winH = wx.getSystemInfoSync().windowHeight;
        }
        this._peekY = this._winH * 0.65;
        this._lastPersonId = null;
      } catch (e) {
        this._winH = 800;
        this._peekY = 520;
      }
      // If show is already true when attached, initialize drawer
      if (this.properties.show) {
        const p = this.properties.person;
        this._lastPersonId = (p && p.id) ? p.id : null;
        this._initializeDrawer();
      }
    }
  },

  observers: {
    'show': function (show) {
      // Ensure _winH is initialized
      if (!this._winH || this._winH <= 0) {
        try {
          // 优先使用新 API wx.getWindowInfo，不支持时回退到 wx.getSystemInfoSync
          if (wx.getWindowInfo) {
            this._winH = wx.getWindowInfo().windowHeight;
          } else {
            this._winH = wx.getSystemInfoSync().windowHeight;
          }
          this._peekY = this._winH * 0.65;
        } catch (e) {
          this._winH = 800;
          this._peekY = 520;
        }
      }
      
      if (show) {
        const p = this.properties.person;
        this._lastPersonId = (p && p.id) ? p.id : null;
        this._initializeDrawer();
      } else {
        this._lastPersonId = null;
        this.setData({
          drawerY: this._winH,
          creatingProfile: false,
          nameSectionExpanded: false,
          lifeSectionExpanded: false,
          hasChanges: false,
          editGender: false,
          activeField: '',
          changedFields: {}
        });
      }
    },
    // Also re-initialize when person changes while drawer is open
    // NOTE: NOT observing creatingProfile to avoid infinite loop
    // because _initializeDrawer sets creatingProfile in data, which would re-trigger observer
    'person': function (newPerson) {
      if (this.properties.show) {
        // Only re-initialize if the person ID actually changed
        // Normalize IDs: treat undefined, null, and empty string as equivalent
        const normalizeId = (id) => id || null;
        const newId = normalizeId(newPerson ? newPerson.id : null);
        const lastId = normalizeId(this._lastPersonId);
        if (newId !== lastId) {
          this._lastPersonId = newId;
          this._initializeDrawer();
        }
      }
    },
    'hometownHint': function (hint) {
      this.setData({ hometownHint: hint || '' });
    }
  },

  methods: {
    // ── Drawer initialization ─────────────────────────────────────
    _initializeDrawer() {
      try {
        // Ensure _winH is valid
        if (!this._winH || this._winH <= 0) {
          this._winH = 800;
          this._peekY = this._winH * 0.65;
        }

        const p = this.properties.person || {};

        const autoName = (p.surname || '') + (p.firstname || '');
        const isManual = !!(p.name && p.name !== autoName);

        const hasChildren = (this.properties.children || []).length > 0;
        const hasSpouses = (this.properties.spouses || []).length > 0;
        const isSpouseNode = !!p.isSpouse;
        // Spouse node: deletable only if it is a progenitor itself (no father)
        // Child node:  deletable only if leaf (no spouses, no children)
        const isSpouseProgenitor = isSpouseNode && this._isProgenitor(p.id);
        const canDelete = isSpouseNode ? (isSpouseProgenitor && !hasChildren) : (!hasChildren && !hasSpouses);

        // creatingProfile: name section always expanded, auto-focus on name field
        const creatingProfile = this.properties.creatingProfile === true;

        // For new profile with surname but no firstname (e.g., adding father), focus on firstname
        const hasSurnameOnly = p.surname && !p.firstname;
        // Only auto-focus when creating a new profile; when viewing, no field should be active
        const activeField = creatingProfile ? (hasSurnameOnly ? 'firstname' : 'surname') : '';

        const displayName = this._computeDisplayName(p.name, p.surname, p.firstname, isManual);

        // When creating a new profile, expand drawer fully to top so keyboard has room
        // When viewing existing person, show at a position where birth/death years are visible
        const drawerY = creatingProfile ? 50 : (this._winH * 0.55);

        // Get mother info if available
        const range = this.properties.motherRange;
        let currentMotherBYear = '';
        let currentMotherGender = 'female';
        if (range && range.length) {
          const motherId = p.motherId;
          const mother = range.find(m => m.id === motherId);
          if (mother) {
            currentMotherBYear = mother.bYear || '';
            currentMotherGender = mother.gender || 'female';
          }
        }

        // Prepare localSpouses with display names
        const spouses = this.properties.spouses || [];
        const localSpouses = spouses.map(s => ({
          ...s,
          _displayName: this._computeDisplayName(s.name, s.surname, s.firstname, false)
        }));

        // Compute paternal ancestors (great grandfather, grandfather, father)
        const father = this.properties.father;
        const paternalAncestors = this._computePaternalAncestors(father);

        this.setData({
          drawerY: drawerY,
          hasChanges: false,
          editGender: false,
          activeField: activeField,
          nameManual: isManual,
          localSpouses: localSpouses,
          localChildren: [...(this.properties.children || [])],
          aliasHint: p.gender === 'female' ? '(号)易安' : '(字)子瞻, (号)东坡',
          canDelete: canDelete,
          creatingProfile: creatingProfile,
          displayName,
          currentMotherBYear,
          currentMotherGender,
          paternalAncestors,
          nameSectionExpanded: creatingProfile,
          lifeSectionExpanded: false,
          changedFields: {},
          bYearDisplay: p.bYear ? p.bYear + (this._toChineseEra(p.bYear) ? ' (' + this._toChineseEra(p.bYear) + ')' : '') : '',
          dYearDisplay: p.dYear ? p.dYear + (this._toChineseEra(p.dYear) ? ' (' + this._toChineseEra(p.dYear) + ')' : '') : '',
          hometownHint: this.properties.hometownHint || ''
        });
      } catch (e) {
        console.error('_initializeDrawer error:', e);
      }
    },
    
    // ── Focus / blur helpers ──────────────────────────────────────
    onFocus(e)    {
      this.setData({ activeField: e.currentTarget.dataset.f });
      // When user focuses on any input field, expand drawer to top for better keyboard experience
      this.setData({ drawerY: 50 });
    },
    onExitEdit() {
      this.setData({ 
        editGender: false, 
        activeField: '',
        // Collapse sections when exiting edit mode
        nameSectionExpanded: false,
        lifeSectionExpanded: false
      });
    },
    onBlur()       { this.setData({ activeField: '' }); },
    stop(e) {
      // Only block propagation when a field is actively being edited
      // Otherwise let the tap bubble so onExitEdit fires
      if (this.data.activeField) {
        e.stopPropagation();
      }
    },

    // ── Collapsible sections ──────────────────────────────────────
    onToggleNameSection() {
      // Don't collapse when creating a new profile
      if (this.data.creatingProfile) return;
      this.setData({ nameSectionExpanded: !this.data.nameSectionExpanded });
    },
    onToggleLifeSection() {
      this.setData({ lifeSectionExpanded: !this.data.lifeSectionExpanded });
    },

    // ── Name editing ──────────────────────────────────────────────
    onUpdateNameParts(e) {
      const f = e.currentTarget.dataset.f;  // 'surname' or 'firstname'
      const v = e.detail.value;
      
      // Get current person data from properties (single source of truth)
      const p = this.properties.person || {};
      
      // Auto-compute full name if both parts exist and not in manual mode
      const nameManual = this.data.nameManual;
      const newSurname = f === 'surname' ? v : (p.surname || '');
      const newFirstname = f === 'firstname' ? v : (p.firstname || '');
      const hasBothParts = newSurname && newFirstname;
      
      let newName = p.name;
      if (!nameManual && hasBothParts) {
        newName = newSurname + newFirstname;
      }
      
      // Compute display name
      const displayName = this._computeDisplayName(newName, newSurname, newFirstname, nameManual);

      this.setData({
        displayName,
        hasChanges: true,
        [`changedFields.${f}`]: true
      });

      // Trigger events to parent for saving to person object
      this.triggerEvent('updatefield', { field: f, value: v });
      if (!nameManual && hasBothParts) {
        this.triggerEvent('updatefield', { field: 'name', value: newName });
      }
    },

    onUpdateFullName(e) {
      const v = e.detail.value;
      const p = this.properties.person || {};
      const autoName = (p.surname || '') + (p.firstname || '');
      
      // Manual mode if user enters anything different from auto-generated name
      const isManual = v !== '' && v !== autoName;
      const displayName = isManual ? v : this._computeDisplayName(null, p.surname, p.firstname, false);
      
      // Don't auto-fill fullName - keep it empty if user hasn't entered anything
      const finalName = v || '';
      
      this.setData({ 
        nameManual: isManual, 
        hasChanges: true, 
        displayName,
        'changedFields.name': true
      });
      this.triggerEvent('updatefield', { field: 'name', value: finalName });
    },

    onUpdate(e) {
      const f = e.currentTarget.dataset.f;
      const v = e.detail.value;

      const updates = { hasChanges: true, [`changedFields.${f}`]: true };
      if (f === 'bYear') updates.bYearDisplay = v ? v + (this._toChineseEra(v) ? ' (' + this._toChineseEra(v) + ')' : '') : '';
      if (f === 'dYear') updates.dYearDisplay = v ? v + (this._toChineseEra(v) ? ' (' + this._toChineseEra(v) + ')' : '') : '';
      if (f === 'gender') updates.aliasHint = v === 'female' ? '(号)易安' : '(字)子瞻, (号)东坡';

      this.setData(updates);
      this.triggerEvent('updatefield', { field: f, value: v });
    },

    // Compute hometown placeholder from same workspace/progenitor group.
    // Returns the hometown of the nearest relative (by generation distance),
    // or empty string if none found. Computed by the parent tree page.
    // _computeHometownHint() { /* removed — tree page computes and passes as property */ }

    // Convert Western year to Chinese era display string (purely for display)
    // Covers Qing dynasty (1644–1911) and Minguo / Republic of China (1912–1949)
    _toChineseEra(year) {
      if (!year) return '';
      const y = parseInt(year, 10);
      if (isNaN(y) || y < 1644) return '';

      // Minguo: year 1 = 1912 (民国元年 = 1912)
      if (y >= 1912 && y <= 1949) {
        const minguo = y - 1911;
        const minguoStr = minguo === 1 ? '元' : this._toChineseNum(minguo);
        return '民国' + minguoStr + '年';
      }

      // Qing dynasty reign eras
      const ERAS = [
        { name: '顺治', start: 1644, end: 1661 },
        { name: '康熙', start: 1662, end: 1722 },
        { name: '雍正', start: 1723, end: 1735 },
        { name: '乾隆', start: 1736, end: 1795 },
        { name: '嘉庆', start: 1796, end: 1820 },
        { name: '道光', start: 1821, end: 1850 },
        { name: '咸丰', start: 1851, end: 1861 },
        { name: '同治', start: 1862, end: 1874 },
        { name: '光绪', start: 1875, end: 1908 },
        { name: '宣统', start: 1909, end: 1911 },
      ];

      for (const era of ERAS) {
        if (y >= era.start && y <= era.end) {
          const reignYear = y - era.start + 1;
          const reignStr = reignYear === 1 ? '元' : this._toChineseNum(reignYear);
          return era.name + reignStr + '年';
        }
      }
      return '';
    },

    // Convert integer to Chinese numerals (1→一, 2→二 ... 38→三十八)
    _toChineseNum(n) {
      const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      if (n === 0) return '零';
      if (n < 10) return DIGITS[n];
      if (n < 20) return '十' + (n === 10 ? '' : DIGITS[n - 10]);
      if (n < 100) {
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        return DIGITS[tens] + '十' + (ones === 0 ? '' : DIGITS[ones]);
      }
      if (n < 1000) {
        const hundreds = Math.floor(n / 100);
        const rest = n % 100;
        return DIGITS[hundreds] + '百' + (rest === 0 ? '' : this._toChineseNum(rest));
      }
      return String(n);  // fallback
    },

    // Compute the display name shown in the collapsed header:
    //   - manual full name → use it
    //   - surname + firstname → surname+firstname
    //   - surname only → "surname氏"
    //   - both empty → "无名"
    _computeDisplayName(fullName, surname, firstname, isManual) {
      if (isManual && fullName) {
        // Special case: if fullName is only surname (no firstname), display as "surname氏"
        // This covers old data where _saveNewPerson incorrectly stored just surname
        const s = (surname || '').trim();
        const f = (firstname || '').trim();
        const n = fullName.trim();
        if (s && !f && n === s) return s + '氏';
        return fullName;
      }
      const s = (surname || '').trim();
      const f = (firstname || '').trim();
      if (s && f) return s + f;
      if (s) return s + '氏';
      return '无名';
    },

    // Compute paternal ancestors (great grandfather, grandfather, father)
    // Uses ID-based deduction: remove last char to get father
    // Returns object with display names and birth years
    _computePaternalAncestors(father) {
      const ancestors = {
        greatGrandfather: '',
        greatGrandfatherYear: '',
        grandfather: '',
        grandfatherYear: '',
        father: '',
        fatherYear: ''
      };

      if (!father) return ancestors;

      // Father
      ancestors.father = this._computeDisplayName(father.name, father.surname, father.firstname, false);
      ancestors.fatherYear = father.bYear || '';
      console.log('[_computePaternalAncestors] Father:', father.id, father.name);

      // Grandfather (father's father — deduce from father's ID)
      const db = this._getDb();
      const grandfatherId = this._getFatherId(father.id);
      if (grandfatherId) {
        const grandfather = db?.people?.[grandfatherId];
        console.log('[_computePaternalAncestors] Grandfather ID:', grandfatherId, 'Found:', grandfather ? grandfather.name : 'NOT FOUND');
        if (grandfather) {
          ancestors.grandfather = this._computeDisplayName(grandfather.name, grandfather.surname, grandfather.firstname, false);
          ancestors.grandfatherYear = grandfather.bYear || '';

          // Great grandfather (grandfather's father)
          const greatGrandfatherId = this._getFatherId(grandfather.id);
          if (greatGrandfatherId) {
            const greatGrandfather = db?.people?.[greatGrandfatherId];
            console.log('[_computePaternalAncestors] Great grandfather ID:', greatGrandfatherId, 'Found:', greatGrandfather ? greatGrandfather.name : 'NOT FOUND');
            if (greatGrandfather) {
              ancestors.greatGrandfather = this._computeDisplayName(greatGrandfather.name, greatGrandfather.surname, greatGrandfather.firstname, false);
              ancestors.greatGrandfatherYear = greatGrandfather.bYear || '';
            }
          }
        }
      }

      return ancestors;
    },

    // Deduce father ID by removing last character from person's ID
    // Returns null if person is a progenitor (no father)
    _getFatherId(personId) {
      if (!personId || typeof personId !== 'string') return null;
      if (personId.length <= 12) return null;
      const prefix = personId.slice(0, 12);
      const suffix = personId.slice(12);
      if (prefix.endsWith('-') && /^[A-Z]+$/.test(suffix)) {
        return personId.slice(0, -1);
      }
      return null;
    },

    // Get database reference from page (via triggerEvent is too complex, use getApp().globalData)
    _getDb() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      return currentPage?.data?.db;
    },

    onMotherChange(e) {
      this.triggerEvent('motherchange', e.detail);
      this.setData({ hasChanges: true });
    },

    // ── Drag-to-reorder ──────────────────────────────────────────
    startReorder(e) {
      const { index, type } = e.currentTarget.dataset;
      this.initialTouchY = e.touches[0].clientY;
      this.setData({ draggingIndex: parseInt(index), dragType: type, dragVisualY: parseInt(index) * 36 });
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    },

    moveReorder(e) {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - this.initialTouchY;
      const cardStep = 36;
      this.setData({ dragVisualY: (this.data.draggingIndex * cardStep) + deltaY });
      if (Math.abs(deltaY) > cardStep) {
        const direction = deltaY > 0 ? 1 : -1;
        const targetIndex = this.data.draggingIndex + direction;
        const listKey = this.data.dragType === 'spouses' ? 'localSpouses' : 'localChildren';
        const list = [...this.data[listKey]];
        if (targetIndex >= 0 && targetIndex < list.length) {
          [list[this.data.draggingIndex], list[targetIndex]] = [list[targetIndex], list[this.data.draggingIndex]];
          const newOrderIds = list.map(i => i.id);
          this.setData({
            [listKey]: list,
            draggingIndex: targetIndex,
            hasChanges: true
          });
          // Notify parent about the reorder
          this.triggerEvent('updatefield', { field: this.data.dragType, value: newOrderIds });
          this.initialTouchY = currentY;
        }
      }
    },

    endReorder() { this.setData({ draggingIndex: -1, dragType: '' }); },

    // ── Drawer drag ──────────────────────────────────────────────
    touchStart(e) {
      if (this.data.draggingIndex === -1) this._dragStartY = e.touches[0].clientY;
    },
    touchMove(e) {
      if (this.data.draggingIndex !== -1) return;
      const y = e.touches[0].clientY;
      this.setData({ drawerY: y < 50 ? 50 : y });
    },
    touchEnd() {
      if (this.data.draggingIndex !== -1) return;
      const y = this.data.drawerY;
      if (y < this._winH * 0.4)  this.setData({ drawerY: 50 });
      else if (y > this._winH * 0.85) this.onClose();
      else this.setData({ drawerY: this._peekY });
    },

    // ── Name / gender toggle ─────────────────────────────────────
    onStartEditGender() { this.setData({ editGender: true }); },

    // ── Save / close / delete / navigation ───────────────────────
    onSave() {
      // Guard: only fire if there are actual changes (replaces invalid dynamic bindtap)
      if (!this.data.hasChanges) return;
      this.triggerEvent('commit');
    },
    onClose()     { this.triggerEvent('close'); },
    onDelete()    { this.triggerEvent('delete'); },
    onJump(e)     { this.triggerEvent('jump', e.currentTarget.dataset); },
    onJumpToTree(e) {
      this.triggerEvent('closeprofile');  // 先关闭profile
      this.triggerEvent('jumptotree', e.currentTarget.dataset);  // 然后跳转
    },
    onAddSpouse() { this.triggerEvent('addspouse'); },
    onAddChild()  { this.triggerEvent('addchild'); },
    onAddFather() { this.triggerEvent('addfather'); }
  }
});
