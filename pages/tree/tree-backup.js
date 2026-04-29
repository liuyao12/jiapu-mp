// pages/tree/tree.js
console.log('[tree.js] module loading...');
const Logic = require('../../utils/family-logic.js');
console.log('[tree.js] family-logic loaded');
const Data = require('../../utils/data-service.js');
console.log('[tree.js] data-service loaded, calling Page()...');

Page({
  data: {
    db: { activeRootId: null, people: {} },
    nodes: [], lines: [], rulerTicks: [],
    showTimeline: false, showSpouses: true, showMaternal: false,
    collapsedNodes: [], showDrawer: false,
    editingId: '',           // 当前编辑的人物ID，空字符串表示新建
    draftPerson: {},         // 新建人物时的草稿对象（未保存到db）
    _editingPerson: {},      // 当前正在编辑的人物对象（用于传递给profile-editor）
    _pendingEdits: {},       // 现有人物的待保存编辑（保存前不写入db）
    _pendingMotherSelected: false, // 母亲是否已选择（用于高亮）
    _displaySpouses: [], _displayChildren: [], _displayFather: null,
    motherRange: [], currentMotherName: '',
    maxR: 750, maxH: 1000, memberCount: 0, familyName: '',
    creatingProfile: false,
    _hometownHint: '',
    // Progenitor list modal
    showProgenitorList: false,
    progenitorList: [],
    // Progenitor dropdown menu
    showProgenitorDropdown: false,
    progenitorWorkspaces: [], // array of workspace objects
    // Cloud sharing
    currentSharedId: null,  // 当前分享的云数据库文档ID
    lastSyncTime: null,     // 最后同步时间
    isSyncing: false,       // 是否正在同步
    // Canvas scaling
    viewScale: 1,           // 当前视图缩放比例（1=原尺寸，<1=缩小）
    fitWidthOffset: 0,       // fit-width模式下的水平偏移量（用于居中）
    minNodeX: 0,            // 最左侧节点X坐标（不含时间轴）
    maxNodeX: 750,          // 最右侧节点X坐标（不含时间轴）
    lockHorizontalScroll: false, // 锁定横向滚动(fit-width模式)
    _syncingScroll: false,    // 防止循环同步的标志
  },

  // Non-reactive state cached here (not in this.data to avoid setData overhead)
  _windowHeight: 0,
  _layoutCache: null,  // Changed to null, initialized in onLoad
  _refreshingTree: false,  // Guard flag to prevent recursive refreshTree calls
  _refreshingDrawer: false,  // Guard flag to prevent recursive drawer operations
  _syncInterval: null,       // 定时同步定时器
  _hasPendingChanges: false,  // 是否有待保存的更改

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  onLoad(options) {
    console.log('[tree.js] onLoad called');
    if (this._loadedFromOnLoad) return;
    try {
      this._loadedFromOnLoad = true;
      this._refreshingTree = false;
      this._refreshingDrawer = false;
      this._layoutCache = { standard: null, timeline: null };
      const sys = wx.getSystemInfoSync();
      this._windowHeight = sys.windowHeight;

      if (options.sharedId) {
        this.loadSharedGenealogy(options.sharedId);
        return;
      }

      let db = Data.getSession();
      if (!db) {
        db = { activeRootId: null, people: {} };
        this._saveData(db);
      }
      if (!db || typeof db !== 'object') db = { activeRootId: null, people: {} };
      if (!db.people) db.people = {};

      db = this._migrateIdFormat(db);
      db = this._migrateWorkspaceId(db);
      db = this._migrateRemoveFatherId(db);

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
  _migrateIdFormat(db) {
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
        if (p.paternalRootId) p.paternalRootId = idRenameMap[p.paternalRootId] || p.paternalRootId;
        if (p.progenitorId_)  p.progenitorId_  = convertProgenitorId(p.progenitorId_);
        if (p.children)  p.children  = p.children.map(c  => idRenameMap[c]  || c);
        if (p.spouses)   p.spouses   = p.spouses.map(s   => idRenameMap[s]  || s);
        newPeople[newKey] = p;
      });
      db = {
        ...db,
        activeRootId: idRenameMap[db.activeRootId] || db.activeRootId,
        people: newPeople
      };
      Data.saveSession(db);
    } else {
      // No key migration needed; but still ensure progenitorId_ field is in new format
      let fieldChanged = false;
      Object.values(db.people).forEach(person => {
        if (person.progenitorId_) {
          const converted = convertProgenitorId(person.progenitorId_);
          if (converted !== person.progenitorId_) {
            person.progenitorId_ = converted;
            fieldChanged = true;
          }
        } else {
          // Derive progenitorId_ from person's own ID
          person.progenitorId_ = convertProgenitorId(
            person.id.length >= 12 ? person.id.slice(0, 12) : person.id
          );
          fieldChanged = true;
        }
      });
      if (fieldChanged) {
        this._saveData(db);
      }
    }
    return db;
  },

  // ─────────────────────────────────────────────
  // WorkspaceId migration
  // Old data has no workspaceId. Assign each progenitor tree its own workspaceId
  // (= the progenitor's own ID) and propagate to all connected nodes.
  // ─────────────────────────────────────────────
  _migrateWorkspaceId(db) {
    const people = db.people;
    if (!people) return db;

    // Check if any local person is missing workspaceId
    const needsMigration = Object.values(people).some(
      p => !p.workspaceId && !p.sharedId
    );
    if (!needsMigration) return db;

    // Collect all progenitors (local only — no sharedId, and is a root ID)
    const localProgenitors = Object.keys(people).filter(
      id => this._isProgenitor(id) && !people[id].sharedId
    );

    // For each progenitor, BFS/DFS to assign workspaceId to entire connected tree
    localProgenitors.forEach(progenitorId => {
      // workspaceId = progenitor's own ID
      const wsId = progenitorId;

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
          if (people[sid] && !people[sid].workspaceId && !people[sid].sharedId) {
            people[sid].workspaceId = wsId;
          }
        });
      };

      assign(progenitorId);
    });

    console.log('[migrateWorkspaceId] assigned workspaceId to legacy data');
    this._saveData(db);
    return db;
  },

  // ─────────────────────────────────────────────
  // fatherId cleanup migration
  // fatherId is no longer stored — deduced from ID at runtime.
  // This removes any lingering fatherId fields from old data.
  // ─────────────────────────────────────────────
  _migrateRemoveFatherId(db) {
    if (!db.people) return db;
    let changed = false;
    Object.values(db.people).forEach(p => {
      if (p.fatherId) {
        delete p.fatherId;
        changed = true;
      }
    });
    if (changed) {
      console.log('[migrateRemoveFatherId] removed fatherId from legacy data');
      this._saveData(db);
    }
    return db;
  },

  // 显示添加祖先的对话框（用于空树状态）
  _showAddAncestorDialog() {
    // Guard: prevent recursive calls
    if (this._refreshingDrawer) {
      console.warn('_showAddAncestorDialog: already showing');
      return;
    }
    this._refreshingDrawer = true;

    try {
      console.log('_showAddAncestorDialog: preparing');

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
        alias: '',
        rank: '',
        children: [],
        spouses: [],
        _isNewAncestor: true // 标记是新增的祖先
      };

      console.log('_showAddAncestorDialog: setData');

      // Compute hometown hint for new ancestor: find any hometown from existing people
      let hometownHint = '';
      const people = Object.values(this.data.db.people);
      if (people.length > 0) {
        const withHometown = people.find(pp => pp.hometown && pp.hometown.trim());
        if (withHometown) hometownHint = withHometown.hometown.trim();
      }

      this.setData({
        editingId: '', // 空ID表示新建
        draftPerson: draftPerson,
        _editingPerson: { ...draftPerson },
        showDrawer: true,
        _displaySpouses: [],
        _displayChildren: [],
        creatingProfile: true,
        _hometownHint: hometownHint
      });
      console.log('_showAddAncestorDialog: done');

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

    // 获取scroll-view节点引用
    const query = wx.createSelectorQuery();
    query.select('#mainScroll').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        // 存储scroll-view的实例,后续用于直接控制滚动
        this._mainScrollNode = res[0];
      }
    });

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
      // Resume cloud sync
      if (this.data.currentSharedId && !this._syncInterval) {
        this._startSyncInterval();
      }
    });
  },

  // Manual trigger: "＋ 添加始祖" button on empty state screen
  onAddAncestorBtnTap() {
    try {
      console.log('onAddAncestorBtnTap');

      this._showAddAncestorDialog();
    } catch (e) {
      console.error('onAddAncestorBtnTap error:', e);
    }
  },



  // ─────────────────────────────────────────────
  // Layout helpers
  // ─────────────────────────────────────────────

  refreshTree() {
    const { db, showSpouses, showMaternal, collapsedNodes } = this.data;
    const rootId = db.activeRootId;

    console.log('[refreshTree] CALLED rootId:', rootId, 'people:', Object.keys(db.people || {}).length);

    // 处理空树状态
    if (!rootId) {
      this._layoutCache.standard = { nodes: [], lines: [], rulerTicks: [], maxR: 750, maxH: 1000 };
      this._layoutCache.timeline = { nodes: [], lines: [], rulerTicks: [], maxR: 750, maxH: 1000 };
      this._applyCurrentLayout();
      return;
    }
    const common = { rootId: db.activeRootId, showSpouses, showMaternal, collapsedNodes };
    this._layoutCache.standard = Logic.calculateLayout(db, { ...common, showTimeline: false });
    this._layoutCache.timeline = Logic.calculateLayout(db, { ...common, showTimeline: true });
    this._applyCurrentLayout();
  },

  _applyCurrentLayout() {
    const layout = this.data.showTimeline
      ? this._layoutCache.timeline
      : this._layoutCache.standard;
    const { db } = this.data;

    console.log('[_applyCurrentLayout] nodes:', layout.nodes.length, 'lines:', layout.lines.length, 'timeline:', this.data.showTimeline);

    // 计算2026年线高度（使用窗口高度）
    const currentYearLineHeight = this._windowHeight * 2; // px转rpx（wx.getSystemInfoSync.windowHeight是px，需要乘以2转为rpx）

    // 处理空树状态时的标题
    let familyName = '新建家谱';
    if (db.activeRootId && db.people[db.activeRootId]) {
      const rootPerson = db.people[db.activeRootId];
      familyName = (rootPerson.name || (rootPerson.surname ? rootPerson.surname + '氏' : '始祖')) + ' 世系';
    }

    // 计算节点最小/最大X坐标（不含时间轴）
    // 需要计算完整的边界：最左端到最右端（包括节点宽度）
    let minNodeX = Infinity;
    let maxNodeX = -Infinity;
    layout.nodes.forEach(node => {
      // 时间轴视图中，X坐标是基于年份计算的；标准视图中，X坐标是固定的
      const actualX = this.data.showTimeline ? (node.yearX || node.x) : node.x;
      const nodeW = node.w || 80;  // 节点宽度

      // 最左端：节点的X坐标
      minNodeX = Math.min(minNodeX, actualX);

      // 最右端：节点X + 节点宽度
      maxNodeX = Math.max(maxNodeX, actualX + nodeW);
    });

    this.setData({
      'db.activeRootId': db.activeRootId,  // 更新activeRootId以触发正确的空状态显示
      nodes: layout.nodes,
      lines: layout.lines,
      rulerTicks: layout.rulerTicks,
      maxR: layout.maxR,
      maxH: layout.maxH,
      currentYearLineX: layout.currentYearLineX || -1,
      currentYear: layout.currentYear || 2026,
      currentYearLineHeight: currentYearLineHeight,
      memberCount: Object.keys(db.people).length,
      familyName: familyName,
      minNodeX: minNodeX === Infinity ? 0 : minNodeX,
      maxNodeX: maxNodeX === -Infinity ? 750 : maxNodeX
    });
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

  onNodeTap(e) {
    const id = e.id || e.currentTarget.dataset.id;
    const p = this.data.db.people[id];
    if (!p) return;

    const motherNode = this.data.db.people[p.motherId];
    let currentMotherName = '';
    if (motherNode) {
      const displayName = this._computeDisplayName(motherNode);
      currentMotherName = displayName + (motherNode.bYear ? ' ' + motherNode.bYear : '');
    }

    // Determine if we should show the jump button
    // Show only if the person's progenitorId is different from currentRootId
    const currentRootId = this.data.db.activeRootId;
    let showJumpBtn = false;
    
    // Extract progenitorId from person's ID (first 12 characters)
    const personProgenitorId = p.id ? p.id.slice(0, 12) : null;
    
    if (personProgenitorId && personProgenitorId !== currentRootId) {
      showJumpBtn = true;
    }

    // Detect if we are creating a new profile (not viewing an existing one)
    // This is true when adding a new person (ancestor, child, father, spouse)
    // When viewing an existing person, this is false regardless of whether they have a name
    const creatingProfile = !p.id || p.id.startsWith('P_') || p.id.startsWith('S_') || p.id.startsWith('spouse_');

    
    console.log(`[onNodeTap] ${p.name} (${id})`);

    // Get spouse objects
    const spouseObjects = (p.spouses || []).map(sid => this.data.db.people[sid]).filter(Boolean);

    // Any progenitor (ID is 12 chars ending with '-') can have a father added.
    // The father's relationship is deduced from ID at runtime (remove last char).
    const canAddFather = this._isProgenitor(id);

    // Compute hometown hint: find hometown from relatives in same workspace,
    // preferring father > siblings > children (by generation distance)
    const wsId = p.workspaceId || (p.id ? p.id.slice(0, 12) : null);
    let hometownHint = '';
    if (wsId) {
      const candidates = Object.values(this.data.db.people)
        .filter(pp => {
          if (pp.id === id) return false;
          const ppWs = pp.workspaceId || (pp.id ? pp.id.slice(0, 12) : null);
          return ppWs === wsId && pp.hometown && pp.hometown.trim();
        });
      if (candidates.length > 0) hometownHint = candidates[0].hometown.trim();
    }

    this.setData({
      editingId: id,
      draftPerson: {},
      _editingPerson: p,
      _pendingEdits: {},
      _pendingMotherSelected: false,
      showDrawer: true,
      _displaySpouses: spouseObjects.filter(Boolean),
      _displayChildren: (p.children || []).map(cid => this.data.db.people[cid]).filter(Boolean),
      _displayFather: (() => {
        const father = this._getFather(id, this.data.db);
        if (!father) return null;
        const s = (father.surname || '').trim();
        const fi = (father.firstname || '').trim();
        let name = (father.name && father.name.trim()) ? father.name.trim() : '';
        if (!name) {
          name = s && fi ? s + fi : s ? s + '氏' : '无名氏';
        } else if (s && !fi && name === s) {
          name = s + '氏';
        }
        return { ...father, name };
      })(),
      motherRange: this._buildMotherRange(id),
      currentMotherName,
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
    const id = e.detail?.id || e.currentTarget?.dataset?.id;
    if (!id) {
      wx.showToast({ title: '无法跳转', icon: 'none' });
      return;
    }
    const targetPerson = this.data.db.people[id];
    if (!targetPerson) {
      wx.showToast({ title: '找不到该人物', icon: 'none' });
      return;
    }
    
    // Find the paternal ancestor (progenitor)
    const people = this.data.db.people;
    let progenitorId = id;
    
    // Try to find paternalRootId first
    if (targetPerson.paternalRootId && people[targetPerson.paternalRootId]) {
      progenitorId = targetPerson.paternalRootId;
    } else {
      // Traverse up to find the oldest paternal ancestor
      let current = targetPerson;
      while (current) {
        // Find father: look for someone who has current in their children
        const father = Object.values(people).find(p => 
          p.gender === 'male' && (p.children || []).includes(current.id)
        );
        if (father) {
          progenitorId = father.id;
          current = father;
        } else {
          break;
        }
      }
    }
    
    const progenitor = people[progenitorId];
    if (!progenitor) {
      wx.showToast({ title: '找不到始祖', icon: 'none' });
      return;
    }
    
    // Close drawer first
    this.setData({ showDrawer: false, editingId: '', creatingProfile: false });
    
    // Set the progenitor as the new root
    // Deep copy people to isolate this tree's data
    const newDb = {
      activeRootId: progenitorId,
      people: JSON.parse(JSON.stringify(this.data.db.people))
    };
    
    this.setData({
      db: newDb
    }, () => {
      this.refreshTree();
      this._saveData(newDb);
      wx.showToast({ title: `查看 ${progenitor.name} 的家谱`, icon: 'none' });
    });
  },

  _buildMotherRange(id) {
    const people = this.data.db.people;
    const person = people[id];
    const range = [{ id: '', label: '未知' }];


    if (!person) return range;

    // Try to find all possible mothers:
    // 1. Find the person's father first
    // 2. Add father's female spouses
    // 3. Add person's existing motherId
    // 4. Add any female who has person in their children array

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

    // Also add any female who has this person in their children array
    Object.values(people).forEach(p => {
      if (p.gender === 'female' && (p.children || []).includes(id)) {
        if (!range.find(r => r.id === p.id)) {
          const displayName = this._computeDisplayName(p);
          const label = `${displayName} ${p.bYear || ''}`.trim();
          range.push({ id: p.id, label: label });
        }
      }
    });

    return range;
  },

  // ─────────────────────────────────────────────
  // Progenitor management
  // ─────────────────────────────────────────────

  // Get all progenitors grouped by workspace
  _getProgenitorsByWorkspace() {
    const { people } = this.data.db;
    const workspaces = {}; // workspaceId -> {id, isShared, progenitors[]}

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
            console.warn('_getProgenitorsByWorkspace: skipping entry with empty id, person:', person);
            return;
          }

          // Determine workspace ID:
          // - sharedId (cloud) gets its own workspace
          // - workspaceId (local, set at "新建家谱" time) gets its own workspace
          const workspaceId = person.sharedId || person.workspaceId;

          if (!workspaceId) {
            console.warn('_getProgenitorsByWorkspace: skipping', id, '(no workspaceId/sharedId)');
            return;
          }

          if (!workspaces[workspaceId]) {
            workspaces[workspaceId] = {
              id: workspaceId,
              isShared: !!person.sharedId,
              progenitors: []
            };
          }

          workspaces[workspaceId].progenitors.push({
            id: id,
            name: person.name || (person.surname ? person.surname + '氏' : '无名氏'),
            bYear: person.bYear,
            maleDescendants: stats.maleDescendants,
            femaleDescendants: stats.femaleDescendants,
            marriageCount: stats.marriageCount,
            totalDescendants: stats.totalDescendants
          });
        }
      }
    });

    console.log(`[workspaces] ${Object.keys(workspaces).length} workspace(s), ${Object.values(workspaces).reduce((s, w) => s + w.progenitors.length, 0)} progenitor(s)`);

    // Sort progenitors within each workspace
    Object.keys(workspaces).forEach(workspaceId => {
      workspaces[workspaceId].progenitors.sort((a, b) => {
        const totalA = a.totalDescendants || 0;
        const totalB = b.totalDescendants || 0;
        if (totalA !== totalB) return totalB - totalA;
        if (a.bYear && b.bYear && a.bYear !== b.bYear) return a.bYear - b.bYear;
        if (a.name && b.name) return a.name.localeCompare(b.name);
        return 0;
      });
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
    this.setData({ showProgenitorDropdown: false });
  },

  // Sentinel: stops tap event from bubbling through dropdown-content to overlay
  catchTap() {},

  // Select a progenitor from dropdown menu
  onSelectProgenitor(e) {
    let id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    // Defensive: if id is empty/undefined, try to get it from progenitorList using index
    if (!id && index !== undefined) {
      const item = this.data.progenitorList[index];
      if (item && item.id) {
        console.warn('onSelectProgenitor: recovered id from index, id:', item.id);
        id = item.id;
      }
    }
    
    // Defensive: if id is still empty/undefined, don't proceed
    if (!id) {
      console.warn('onSelectProgenitor: empty id, ignoring');
      console.warn('onSelectProgenitor: event:', e);
      console.warn('onSelectProgenitor: currentTarget:', e.currentTarget);
      console.warn('onSelectProgenitor: dataset:', e.currentTarget.dataset);
      console.warn('onSelectProgenitor: progenitorList:', this.data.progenitorList);
      return;
    }
    
    // Look up by the db key (which may differ from person.id in legacy data)
    const people = this.data.db.people;
    // First try direct key lookup; then scan for a matching .id property as fallback
    let person = people[id];
    let actualKey = id;
    if (!person) {
      const entry = Object.entries(people).find(([k, p]) => p.id === id);
      if (entry) { actualKey = entry[0]; person = entry[1]; }
    }
    
    if (!person) {
      wx.showToast({ title: '找不到该人物', icon: 'none' });
      return;
    }

    // Update to new progenitor view
    const newDb = {
      activeRootId: actualKey,      // use the real db key, not person.id
      people: JSON.parse(JSON.stringify(this.data.db.people))
    };
    
    this.setData({
      db: newDb,
      collapsedNodes: [],
      showProgenitorDropdown: false
    }, () => {
      this.refreshTree();
      this._saveData(newDb);
      wx.showToast({ title: `已切换到 ${person.name} 的家谱`, icon: 'none' });
    });
  },

  // ─────────────────────────────────────────────
  // Jump to different tree (for outsiders with different paternalRootId)
  // ─────────────────────────────────────────────
  
  onJumpToTree(e) {
    const id = e.currentTarget.dataset.id;
    const targetPerson = this.data.db.people[id];
    if (!targetPerson || !targetPerson.id) {
      wx.showToast({ title: '无法跳转', icon: 'none' });
      return;
    }

    // Use paternalRootId instead of extracting from ID prefix
    // This is more reliable because progenitorId_ doesn't get updated when adding father
    let newRootId = targetPerson.paternalRootId || this._extractProgenitorId(id);
    let newRootPerson = this.data.db.people[newRootId];

    // If progenitor doesn't exist, find the actual progenitor by traversing up the family tree
    if (!newRootPerson) {
      // Look for the actual progenitor (a person whose ID is a root)
      let currentPerson = targetPerson;
      let checkedIds = new Set([targetPerson.id]);

      while (currentPerson && !this._isProgenitor(currentPerson.id)) {
        const fatherId = this._getFatherId(currentPerson.id);
        const father = fatherId ? this.data.db.people[fatherId] : null;
        if (!father) {
          // Father doesn't exist, currentPerson is the progenitor
          newRootPerson = currentPerson;
          newRootId = currentPerson.id;
          break;
        }
        if (checkedIds.has(father.id)) {
          // Circular reference detected, stop here
          newRootPerson = currentPerson;
          newRootId = currentPerson.id;
          break;
        }
        checkedIds.add(father.id);
        currentPerson = father;
      }

      // If we reached the top without a father, currentPerson is the progenitor
      if (!newRootPerson && currentPerson) {
        newRootPerson = currentPerson;
        newRootId = currentPerson.id;
      }
    }

    if (!newRootPerson) {
      wx.showToast({ title: '找不到对应的家族', icon: 'none' });
      return;
    }

    // Update to new tree
    // Deep copy people to isolate this tree's data
    const newDb = {
      activeRootId: newRootId,
      people: JSON.parse(JSON.stringify(this.data.db.people))
    };

    this.setData({
      db: newDb,
      collapsedNodes: []
    }, () => {
      this.refreshTree();
      this._saveData(newDb);
      wx.showToast({ title: `已跳转到 ${newRootPerson.name} 的家谱`, icon: 'none' });
    });
  },

  // ─────────────────────────────────────────────
  // Drawer events from profile-editor component
  // ─────────────────────────────────────────────

  onUpdateField(e) {
    const editingId = this.data.editingId;
    const field = e.detail.field;
    const value = e.detail.value;
    
    if (!editingId) {
      // 新建人物：更新 draftPerson 和 _editingPerson

      const draftPerson = { ...this.data.draftPerson, [field]: value };
      this.setData({ draftPerson, _editingPerson: draftPerson });
    } else {
      // 现有人物：只写入 _pendingEdits，不更新数据库，不刷新树
      const pending = { ...(this.data._pendingEdits || {}), [field]: value };
      this.setData({ _pendingEdits: pending });
    }
  },

  onMotherChange(e) {
    const m = this.data.motherRange[e.detail.value];
    const editingId = this.data.editingId;
    
    if (!editingId) {
      // 新建人物：更新 draftPerson
      const draftPerson = { ...this.data.draftPerson, motherId: m.id };
      this.setData({
        draftPerson,
        currentMotherName: m.id ? m.label : ''
      });
    } else {
      // 现有人物：写入 _pendingEdits，并标记母亲已选（用于高亮显示）
      const pending = { ...(this.data._pendingEdits || {}), motherId: m.id };
      this.setData({ _pendingEdits: pending, currentMotherName: m.id ? m.label : '', _pendingMotherSelected: true });
    }
  },

  onCommit() {
    const editingId = this.data.editingId;
    
    if (!editingId) {
      // 新建人物：保存 draftPerson 到数据库
      this._doCommitNewPerson();
    } else {
      // 现有人物：把 _pendingEdits 合并入数据库再保存
      const pending = this.data._pendingEdits || {};
      if (Object.keys(pending).length > 0) {
        const db = JSON.parse(JSON.stringify(this.data.db));
        if (db.people[editingId]) {
          db.people[editingId] = { ...db.people[editingId], ...pending };
          // Update family name if root person's surname/name changed
          let familyName = this.data.familyName;
          if (editingId === db.activeRootId && (pending.surname !== undefined || pending.name !== undefined)) {
            const rootPerson = db.people[editingId];
            familyName = (rootPerson.name || (rootPerson.surname ? rootPerson.surname + '氏' : '始祖')) + ' 世系';
          }
          this.setData({ db, familyName, _pendingEdits: {}, _pendingMotherSelected: false }, () => {
            this.refreshTree();
          });
          this._saveData(db);
        }
      }
      this.setData({ showDrawer: false, editingId: '', creatingProfile: false, _pendingEdits: {}, _pendingMotherSelected: false });
    }
  },
  
  // 保存新建的人物（draftPerson）
  _doCommitNewPerson() {
    const draftPerson = this.data.draftPerson;
    const db = JSON.parse(JSON.stringify(this.data.db));
    
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
    console.log('_saveNewPerson:', { isNewChild, isNewFather, isNewSpouse, isNewAncestor });

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
    
    console.log('_saveNewPerson: newId:', newId);
    
    // 清理临时标记
    const personData = { ...draftPerson };
    delete personData._isNewChild;
    delete personData._isNewFather;
    delete personData._isNewSpouse;
    delete personData._isNewAncestor;
    delete personData._parentId;
    delete personData._childId;
    delete personData._mainPersonId;
    
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
      personData.paternalRootId = newId;
      personData.progenitorId_ = newId;  // 始祖的 progenitorId_ 就是自身
      personData.workspaceId = newId;    // 新建家谱 = 新工作空间
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
        const oldRoot = db.people[db.activeRootId];
        oldProgenitorId_ = oldRoot?.progenitorId_;
        if (!oldProgenitorId_) {
          const rid = db.activeRootId || '';
          oldProgenitorId_ = rid.endsWith('-') ? rid : (rid.length === 11 ? rid.replace(/-/g, '_') + '-' : rid + '-');
        }
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
      personData.paternalRootId = newId;
      personData.progenitorId_ = newId;  // new father is the new progenitor
      // Inherit workspaceId from child (stay in the same workspace)
      if (!personData.workspaceId) {
        personData.workspaceId = child?.workspaceId;
      }
      db.activeRootId = newId;
    }

    // Set ID here (after all branches have determined newId, including isNewFather)
    personData.id = newId;

    console.log('[SavePerson] saving:', personData.id, personData.name);

    // 处理子女的情况
    if (isNewChild) {
      const parentId = draftPerson._parentId;
      const parent = db.people[parentId];
      if (parent) {
        if (!parent.children) parent.children = [];
        if (!parent.children.includes(newId)) {
          parent.children.push(newId);
        }
        // Inherit progenitor ID from parent.
        // Use _extractProgenitorId to correctly derive the 9-char progenitor segment.
      personData.progenitorId_ = parent.progenitorId_ || this._extractProgenitorId(parentId);
      // No fatherId stored — deduced from ID at runtime
      // Inherit workspaceId from parent
      if (!personData.workspaceId) {
        personData.workspaceId = parent.workspaceId;
      }
    } else {
      console.error('[SaveChild] Parent not found! parentId:', parentId);
      }
      personData.paternalRootId = db.people[parentId]?.paternalRootId || parentId;
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
      // Spouse is their own progenitor (independent root)
      personData.progenitorId_ = newId;
      // Inherit workspaceId from main person
      if (!personData.workspaceId) {
        personData.workspaceId = mainPerson?.workspaceId;
      }
    }

    db.people[newId] = personData;

    // Save to local storage first
    this._saveData(db);

    // Update internal db reference (for refreshTree to use)
    this.data.db = db;

    // Then update UI state - first close drawer
    this.setData({
      showDrawer: false,
      editingId: '',
      creatingProfile: false,
      draftPerson: {},
      _editingPerson: {},
      'db.activeRootId': db.activeRootId  // Only update activeRootId
    }, () => {
      console.log('[SaveNewPerson] saved, refreshing tree');
      this.refreshTree();
    });
  },

  onCloseDrawer() {
    this.setData({ showDrawer: false, editingId: '', creatingProfile: false, _editingPerson: {}, _pendingEdits: {}, _pendingMotherSelected: false });
  },

  // ─────────────────────────────────────────────
  // Collapse / expand
  // ─────────────────────────────────────────────

  onToggleCollapse(e) {
    const id = e.currentTarget.dataset.id;
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
      console.log('onNewTree: ignoring event with id, delegating to onSelectProgenitor');
      return;
    }

    // Close dropdown menu first
    this.setData({ showProgenitorDropdown: false });

    // New tree = create a new independent workspace (new progenitor)
    this._showAddAncestorDialog();
  },

  onAddChild() {
    if (this._addingChild) return;
    this._addingChild = true;
    setTimeout(() => { this._addingChild = false; }, 500);

    const parent = this.data.db.people[this.data.editingId];
    // 自动继承父亲的姓氏和籍贯
    const surname = parent.surname || (parent.name ? parent.name.charAt(0) : '') || '未';
    const hometown = parent.hometown || '';
    // 继承父系的 paternalRootId
    const paternalRootId = parent.paternalRootId || parent.id;

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
      alias: '',
      rank: '',
      children: [],
      spouses: [],
      paternalRootId: paternalRootId,
      _isNewChild: true, // 标记是新增的子女
      _parentId: this.data.editingId // 记录父节点ID
    };

    this.setData({
      editingId: '', // 空ID表示新建
      draftPerson: draftPerson,
      _editingPerson: { ...draftPerson },  // 创建副本避免引用问题
      showDrawer: true,
      _displaySpouses: [],
      _displayChildren: [],
      creatingProfile: true,
      _hometownHint: hometown
    });
  },

  // Add father to current person
  onAddFather() {
    if (this._addingFather) return;
    this._addingFather = true;
    setTimeout(() => { this._addingFather = false; }, 500);

    const child = this.data.db.people[this.data.editingId];
    // 自动继承子女的姓氏和籍贯
    const surname = child.surname || (child.name ? child.name.charAt(0) : '') || '未';
    const hometown = child.hometown || '';

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
      alias: '',
      rank: '',
      children: [this.data.editingId], // 把当前节点加为子女
      spouses: [],
      paternalRootId: '', // 暂时为空，保存时设为自己的ID
      _isNewFather: true, // 标记是新增的父亲
      _childId: this.data.editingId // 记录子节点ID
    };

    this.setData({
      editingId: '', // 空ID表示新建
      draftPerson: draftPerson,
      _editingPerson: { ...draftPerson },  // 创建副本避免引用问题
      showDrawer: true,
      _displaySpouses: [],
      _displayChildren: [],
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
          console.log('[_generateChildId]', candidate);
          return candidate;
        }
      }
    } else {
      // Non-root (has suffix): children get double-letter suffix
      for (let j = 0; j < suffixChars.length; j++) {
        const candidate = parentId + suffixChars[j];
        if (!existingIds.has(candidate)) {
          console.log('[_generateChildId]', candidate);
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
    console.log('[_shiftTreeDown] progenitorId:', progenitorId);

    const renameMap = {};
    Object.keys(db.people).forEach(id => {
      const person = db.people[id];
      if (person.id !== id) person.id = id;
      if (id === progenitorId || id.startsWith(progenitorId)) {
        const suffix = id.slice(progenitorId.length);
        const newSuffix = 'A' + suffix;
        const newId = progenitorId + newSuffix;
        renameMap[id] = newId;
      }
    });

    if (Object.keys(renameMap).length === 0) {
      console.warn('_shiftTreeDown: no IDs matched progenitorId=', progenitorId);
      return db;
    }

    // Rebuild people with new IDs
    const newPeople = {};
    Object.entries(db.people).forEach(([oldId, person]) => {
      const pid = renameMap[oldId] || oldId;
      const p = { ...person, id: pid };

      if (p.motherId)        p.motherId        = renameMap[p.motherId]        || p.motherId;
      if (p.paternalRootId)  p.paternalRootId  = renameMap[p.paternalRootId]  || p.paternalRootId;
      // CRITICAL: progenitorId_ always points to the 12-char progenitor ID (xxx_xxx_xxx-).
      // It must NEVER be updated during tree shifting.
      if (p.children)  p.children  = p.children.map(c  => renameMap[c]  || c);
      if (p.spouses)   p.spouses   = p.spouses.map(s   => renameMap[s] || s);

      newPeople[pid] = p;
    });

    const newActiveRootId = renameMap[db.activeRootId] || db.activeRootId;
    return { ...db, activeRootId: newActiveRootId, people: newPeople };
  },

  onAddSpouse() {
    // Guard against double-fire (touch + tap)
    if (this._addingSpouse) return;
    this._addingSpouse = true;
    setTimeout(() => { this._addingSpouse = false; }, 500);

    const currentPerson = this.data.db.people[this.data.editingId];
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
      alias: '',
      rank: '',
      spouses: [], // 将在保存时设置
      children: [],
      _isNewSpouse: true, // 标记是新增的配偶
      _mainPersonId: this.data.editingId // 记录主人物ID
    };

    this.setData({
      editingId: '', // 空ID表示新建
      draftPerson: draftPerson,
      _editingPerson: { ...draftPerson },  // 创建副本避免引用问题
      showDrawer: true,
      _displaySpouses: [],
      _displayChildren: [],
      creatingProfile: true,
      _hometownHint: currentPerson.hometown || ''
    });
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '将永久删除该成员，此操作不可撤销。',
      confirmColor: '#c62828',
      success: (res) => {
        if (!res.confirm) return;
        const db = JSON.parse(JSON.stringify(this.data.db));
        const deletedId = this.data.editingId;
        delete db.people[deletedId];
        // Clean up references in all other people
        Object.values(db.people).forEach(p => {
          if (p.children) p.children = p.children.filter(c => c !== deletedId);
          if (p.spouses)  p.spouses  = p.spouses.filter(s => s !== deletedId);
          // If deleted person was this child's mother, reset motherId to unknown
          if (p.motherId === deletedId) p.motherId = '';
        });
        this.setData({ db, showDrawer: false, editingId: '', creatingProfile: false });
        this._saveData(db);   // ← was missing: persist deletion
        this.refreshTree();
      }
    });
  },

  // ─────────────────────────────────────────────
  // Import / export / reset
  // ─────────────────────────────────────────────

  onImport() {
    Data.importFromChat()
      .then(db => { this.setData({ db }); this.refreshTree(); })
      .catch(() => wx.showToast({ title: '导入失败', icon: 'error' }));
  },

  onExport() {
    // Export only the current workspace
    const wsId = this._getCurrentWorkspaceId();
    const wsIds = this._collectWorkspace(wsId);
    const wsPeople = {};
    wsIds.forEach(id => { wsPeople[id] = this.data.db.people[id]; });
    const wsDb = {
      activeRootId: this.data.db.activeRootId,
      people: wsPeople
    };
    Data.exportToChat(wsDb);
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
    this.setData({ showTimeline: e.detail.value }, () => {
      // 如果在适应宽度模式下切换时间轴，退出适应宽度模式
      if (this.data.viewScale !== 1) {
        this.setData({ viewScale: 1, fitWidthOffset: 0, lockHorizontalScroll: false });
      }
      this._applyCurrentLayout();
    });
  },
  toggleSpouses(e)  { this.setData({ showSpouses:  e.detail.value }, () => this.refreshTree()); },
  toggleMaternal(e) { this.setData({ showMaternal: e.detail.value }, () => this.refreshTree()); },

  // 主内容滚动时同步标尺区域
  onMainScroll(e) {
    // 标尺现在使用 sticky 定位在 canvas 内部，不需要同步滚动
  },

  // 切换适应宽度模式
  toggleFitWidth() {
    const { viewScale, maxNodeX } = this.data;

    if (viewScale === 1) {
      // 计算缩放比例，使内容适应屏幕宽度
      const screenWidth = 750;
      const contentWidth = maxNodeX;
      const newScale = contentWidth > screenWidth ? screenWidth / contentWidth : 1;

      // Fit-width模式：缩放并靠左对齐（offset=0），用户可自由横向滚动
      this.setData({
        viewScale: newScale,
        fitWidthOffset: 0,
        lockHorizontalScroll: false,
        mainScrollTop: 0  // 滚动到顶部
      });
    } else {
      // 恢复原比例
      this.setData({
        viewScale: 1,
        fitWidthOffset: 0,
        lockHorizontalScroll: false
      });
    }
  },



  // ─────────────────────────────────────────────
  // Export image (Canvas 2D)
  // ─────────────────────────────────────────────

  // Export image: let user choose local (4096 limit) or web export (unlimited)
  onExportImage() {
    const W = this.data.maxR;
    const H = this.data.maxH;
    const MAX_SIZE = 4096;

    // Save current view settings for web export
    const viewSettings = {
      showTimeline: this.data.showTimeline,
      showSpouses: this.data.showSpouses,
      showMaternal: this.data.showMaternal,
      collapsedNodes: this.data.collapsedNodes
    };
    wx.setStorageSync('genealogy_view_settings', JSON.stringify(viewSettings));

    // If small enough, try local export first
    if (W <= MAX_SIZE && H <= MAX_SIZE) {
      this._doLocalExport();
      return;
    }

    // Exceeds limit: ask user to choose
    wx.showModal({
      title: '选择导出方式',
      content: '当前家谱较长，小程序截图有 4096px 限制。\n\n选择「网页导出」可生成完整长图（推荐）。\n选择「本地截图」可导出部分（不推荐）。',
      confirmText: '网页导出',
      cancelText: '本地截图',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '网页导出步骤',
            content: '1. 点击右上角「...」→「复制链接」\n\n2. 在浏览器中打开：\ngenealogy_export.html\n\n3. 网页会自动读取小程序数据，生成完整长图\n4. 长按图片保存到相册',
            confirmText: '复制数据',
            cancelText: '关闭',
            success: (r) => {
              if (r.confirm) {
                // Copy current db to clipboard as JSON (user can paste in browser console if needed)
                const jsonStr = JSON.stringify(this.data.db);
                wx.setClipboardData({
                  data: jsonStr,
                  success: () => wx.showToast({ title: '数据已复制', icon: 'success' })
                });
              }
            }
          });
        } else {
          this._doLocalExport();
        }
      }
    });
  },

  // Local canvas export (4096px limit)
  _saveCanvas(canvas, w, h) {
    wx.canvasToTempFilePath({
      canvas,
      fileType: 'jpg',
      quality: 0.92,
      success: (r) => {
        wx.saveImageToPhotosAlbum({
          filePath: r.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => wx.previewImage({ urls: [r.tempFilePath] })
        });
        wx.hideLoading();
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '图片生成失败', icon: 'error' }); }
    });
  },

  // Local canvas export (4096px limit)
  _doLocalExport() {
    const W = this.data.maxR;
    const H = this.data.maxH;

    const drawAt = (ctx, offX, offY, drawH) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(offX, offY, W, drawH);

      // Ruler
      if (this.data.rulerTicks.length > 0) {
        ctx.strokeStyle = '#bbbbbb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(offX, offY + 62);
        ctx.lineTo(offX + W, offY + 62);
        ctx.stroke();
        this.data.rulerTicks.forEach(tick => {
          const tx = tick.x + 40;
          ctx.strokeStyle = '#cccccc';
          ctx.beginPath();
          ctx.moveTo(offX + tx, offY + 52);
          ctx.lineTo(offX + tx, offY + 62);
          ctx.stroke();
          if (tick.label) {
            ctx.fillStyle = '#888888';
            ctx.font = '11px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(tick.label), offX + tx, offY + 48);
          }
        });
      }

      const PADDING_TOP = 80;
      const chunkEndY = offY + drawH - PADDING_TOP;

      // Lines
      this.data.lines.forEach(line => {
        const ly = line.y + PADDING_TOP;
        if (ly < offY - PADDING_TOP || ly > chunkEndY + 100) return;
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (line.type === 'branch') {
          ctx.moveTo(line.x + 40 + offX, ly + offY);
          ctx.lineTo(line.x + 40 + (line.w || 0) + offX, ly + offY);
        } else {
          ctx.moveTo(line.x + 40 + offX, ly + offY);
          ctx.lineTo(line.x + 40 + offX, ly + (line.h || 0) + offY);
        }
        ctx.stroke();
      });

      // Nodes
      const NODE_H = 72;
      this.data.nodes.forEach(node => {
        const ny = node.y + PADDING_TOP;
        if (ny < offY - NODE_H - PADDING_TOP || ny > chunkEndY) return;
        const nx = node.x + 40;
        const nw = Math.max(node.w || 0, 80);

        if (node.gender === 'male') ctx.fillStyle = '#bbdefb';
        else if (node.gender === 'female') ctx.fillStyle = '#fce4ec';
        else ctx.fillStyle = '#dcedc8';

        const r = 4;
        ctx.beginPath();
        ctx.moveTo(nx + offX, ny + offY);
        ctx.lineTo(nx + nw - r + offX, ny + offY);
        ctx.quadraticCurveTo(nx + nw + offX, ny + offY, nx + nw + offX, ny + r + offY);
        ctx.lineTo(nx + nw + offX, ny + NODE_H - r + offY);
        ctx.quadraticCurveTo(nx + nw + offX, ny + NODE_H + offY, nx + nw - r + offX, ny + NODE_H + offY);
        ctx.lineTo(nx + offX, ny + NODE_H + offY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icons: collapse/expand/leaf/marriage
        const iconX = nx + 16;
        const iconY = ny + NODE_H / 2;
        ctx.fillStyle = '#555555';
        
        if (node.iconType === 'plus') {
          // + circle
          ctx.beginPath();
          ctx.arc(iconX, iconY, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#4CAF50';
          ctx.fill();
          ctx.strokeStyle = '#388E3C';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(iconX - 5, iconY - 1.5, 10, 3);
          ctx.fillRect(iconX - 1.5, iconY - 5, 3, 10);
        } else if (node.iconType === 'minus') {
          // - circle
          ctx.beginPath();
          ctx.arc(iconX, iconY, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#FF9800';
          ctx.fill();
          ctx.strokeStyle = '#F57C00';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(iconX - 5, iconY - 1.5, 10, 3);
        } else if (node.iconType === 'leaf') {
          // · dot
          ctx.beginPath();
          ctx.arc(iconX, iconY, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#9E9E9E';
          ctx.fill();
        } else if (node.iconType === 'marriage') {
          // ⚭ marriage symbol
          ctx.font = '16px sans-serif';
          ctx.fillText('⚭', iconX - 8, iconY + 5);
        }

        ctx.fillStyle = '#000000';
        ctx.font = node.isSpouse ? 'italic 14px STKaiti, KaiTi, SimSun, serif' : '14px SimSun, serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, nx + 50 + offX, ny + NODE_H / 2 - 6 + offY);

        if (node.life) {
          ctx.fillStyle = '#666666';
          ctx.font = '10px Consolas, monospace';
          ctx.fillText(node.life, nx + 50 + offX, ny + NODE_H / 2 + 10 + offY);
        }
      });
    };

    wx.showLoading({ title: '生成图片中…', mask: true });

    const query = wx.createSelectorQuery().in(this);
    query.select('#exportCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading();
        wx.showToast({ title: '画布初始化失败', icon: 'error' });
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      drawAt(ctx, 0, 0, H);

      wx.canvasToTempFilePath({
        canvas,
        fileType: 'jpg',
        quality: 0.92,
        success: (r) => {
          wx.saveImageToPhotosAlbum({
            filePath: r.tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
            fail: () => wx.previewImage({ urls: [r.tempFilePath] })
          });
          wx.hideLoading();
        },
        fail: () => { wx.hideLoading(); wx.showToast({ title: '图片生成失败', icon: 'error' }); }
      });
    });
  },

  // ─────────────────────────────────────────────
  // Cloud Sharing Functions
  // ─────────────────────────────────────────────

  // 分享家谱到群聊
  async shareGenealogy() {
    wx.showActionSheet({
      itemList: ['分享给好友（协作编辑）', '导出到聊天（备份）'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          // 分享到云端
          await this._shareToCloud();
        } else if (res.tapIndex === 1) {
          // 导出文件
          this.onExport();
        }
      }
    });
  },

  async _shareToCloud() {
    wx.showLoading({ title: '准备分享...' });

    try {
      // 获取当前工作空间的共享ID（如果是从云端加载的家谱）
      const currentWorkspaceId = this._getCurrentWorkspaceId();

      // 收集整个工作空间的所有节点（不仅仅是当前显示的始祖）
      const workspaceIds = this._collectWorkspace(currentWorkspaceId);

      // 创建包含整个工作空间的数据库副本
      const sharedDb = {
        familyName: this.data.db.familyName,
        people: {},
        activeRootId: this.data.db.activeRootId, // 当前查看的始祖
        sharedWorkspaceId: currentWorkspaceId // 工作空间ID标识
      };

      // 复制工作空间的所有节点
      workspaceIds.forEach(id => {
        sharedDb.people[id] = { ...this.data.db.people[id] };
        // 为每个节点标记工作空间ID
        sharedDb.people[id].sharedId = currentWorkspaceId;
      });

      // 1. 上传到云数据库
      const db = wx.cloud.database();
      const result = await db.collection('genealogies').add({
        data: {
          title: sharedDb.familyName + '家谱',
          content: sharedDb,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      });

      const docId = result._id;

      // 2. 保存当前分享的文档ID（用 setData 保证后续读取一致）
      this.setData({ currentSharedId: docId });

      // 3. 启动10秒协作同步
      this._startSyncInterval();

      // 4. 显示分享菜单
      wx.hideLoading();
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });

      wx.showToast({
        title: '请点击右上角分享',
        icon: 'none',
        duration: 3000
      });

    } catch (err) {
      wx.hideLoading();
      console.error('Share failed:', err);

      // 检查是否是云开发未初始化
      if (err.errMsg && err.errMsg.includes('cloud')) {
        wx.showModal({
          title: '云服务未配置',
          content: '请先在小程序管理后台开通云开发，并在 app.js 中配置环境ID。',
          confirmText: '我知道了',
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '分享失败',
          icon: 'error'
        });
      }
    }
  },

  // 获取当前工作空间ID
  _getCurrentWorkspaceId() {
    const activeRootId = this.data.db.activeRootId;
    if (!activeRootId) return null;

    const activePerson = this.data.db.people[activeRootId];
    if (!activePerson) return null;

    // 工作空间ID: 云端用sharedId，本地用workspaceId
    return activePerson.sharedId || activePerson.workspaceId || null;
  },

  // 收集整个工作空间的所有节点
  _collectWorkspace(workspaceId) {
    const collected = new Set();
    const allPeople = this.data.db.people;

    // 工作空间ID就是始祖的ID（本地）或sharedId（云端）
    // 收集该始祖及其所有后代和配偶
    const collectFromProgenitor = (progenitorId) => {
      if (!progenitorId || !allPeople[progenitorId]) return;

      const collect = (personId, visited = new Set()) => {
        if (visited.has(personId) || !allPeople[personId]) return;
        visited.add(personId);

        const person = allPeople[personId];
        collected.add(personId);

        // 收集配偶
        if (person.spouses) {
          person.spouses.forEach(spouseId => {
            if (!visited.has(spouseId) && allPeople[spouseId]) {
              collected.add(spouseId);
              // 配偶也属于这个工作空间（标记相同的sharedId）
              visited.add(spouseId);
            }
          });
        }

        // 收集子女
        if (person.children) {
          person.children.forEach(childId => {
            collect(childId, visited);
          });
        }
      };

      collect(progenitorId);
    };

    // 如果有workspaceId，只收集该工作空间的节点
    if (workspaceId) {
      // 收集所有具有相同workspaceId（或sharedId）的始祖及其后代
      Object.keys(allPeople).forEach(id => {
        const person = allPeople[id];
        if (this._isProgenitor(id) && (person.workspaceId === workspaceId || person.sharedId === workspaceId)) {
          collectFromProgenitor(id);
        }
      });
    } else {
      // 没有workspaceId（兼容旧数据）: 收集所有本地始祖
      Object.keys(allPeople).forEach(id => {
        const person = allPeople[id];
        if (!person.sharedId && !person.workspaceId && this._isProgenitor(id)) {
          collectFromProgenitor(id);
        }
      });
    }

    return collected;
  },

  // 收集当前家谱的所有相关人员：始祖 + 直系后代 + 所有配偶 + 配偶的其他配偶（一层）
  _collectFamilyNetwork(rootId) {
    const collected = new Set();
    const allPeople = this.data.db.people;

    // 向下收集：递归查找某个人的所有后代
    const collectDescendants = (id) => {
      if (!id || collected.has(id) || !allPeople[id]) return;

      collected.add(id);
      const person = allPeople[id];

      // 收集配偶（包括配偶的其他配偶，但不再递归）
      if (person.spouses) {
        person.spouses.forEach(spouseId => {
          if (spouseId && !collected.has(spouseId)) {
            collected.add(spouseId);
            // 只收集配偶的其他配偶，不递归
            const spouse = allPeople[spouseId];
            if (spouse && spouse.spouses) {
              spouse.spouses.forEach(spouseOfSpouseId => {
                if (spouseOfSpouseId && !collected.has(spouseOfSpouseId)) {
                  collected.add(spouseOfSpouseId);
                }
              });
            }
          }
        });
      }

      // 向下收集子女
      if (person.children) {
        person.children.forEach(childId => {
          collectDescendants(childId);
        });
      }
    };

    // 从始祖开始向下收集所有后代（包括所有相关配偶）
    collectDescendants(rootId);

    return collected;
  },

  // 加载分享的家谱
  async loadSharedGenealogy(docId) {
    wx.showLoading({ title: '加载家谱...' });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('genealogies').doc(docId).get();

      if (res.data && res.data.content) {
        // 加载家谱数据
        const sharedDb = res.data.content;

        // 确保数据结构正确
        if (!sharedDb.people) {
          sharedDb.people = {};
        }

        // 合并模式：将云端工作空间节点合并进本地 db（云端优先）
        const currentDb = this.data.db;
        const mergedPeople = { ...currentDb.people };

        Object.keys(sharedDb.people).forEach(id => {
          // Cloud data takes priority — always overwrite/add
          mergedPeople[id] = { ...sharedDb.people[id] };
        });

        const mergedDb = {
          familyName: currentDb.familyName,
          people: mergedPeople,
          activeRootId: sharedDb.activeRootId  // 切换到新加载的家谱
        };

        // 设置当前分享ID，启动10秒协作同步
        this.setData({
          db: mergedDb,
          currentSharedId: docId,
          lastSyncTime: Date.now()
        });

        // 保存到本地缓存
        Data.saveSession(mergedDb, docId);

        // 初始化界面
        this.refreshTree();

        // 启动10秒自动同步
        this._startSyncInterval();

        wx.hideLoading();
        wx.showToast({ title: '加载成功', icon: 'success' });

        // 显示欢迎提示（协作模式提示）
        const collabGuideShown = wx.getStorageSync('collabGuideShown');
        if (!collabGuideShown) {
          setTimeout(() => {
            wx.showModal({
              title: '协作编辑模式',
              content: '这是共享家谱，您和家族成员可以同时编辑，所有修改会实时同步（2秒内）。\n\n注意：多人同时编辑时，后保存的会覆盖先保存的。',
              confirmText: '我知道了',
              success: () => {
                wx.setStorageSync('collabGuideShown', true);
              }
            });
          }, 1000);
        }

      } else {
        wx.hideLoading();
        wx.showToast({ title: '家谱不存在', icon: 'error' });
      }

    } catch (err) {
      wx.hideLoading();
      console.error('Load failed:', err);
      wx.showModal({
        title: '加载失败',
        content: '无法加载家谱数据，请检查网络连接或尝试重新打开。',
        confirmText: '我知道了',
        showCancel: false
      });
    }
  },

  // 配置分享卡片
  onShareAppMessage() {
    const title = this.data.familyName ? this.data.familyName + '家谱' : '我的家谱';

    if (this.data.currentSharedId) {
      return {
        title: title,
        path: `/pages/tree/tree?sharedId=${this.data.currentSharedId}`,
        imageUrl: '' // 可选：家谱预览图
      };
    } else {
      // 如果没有分享ID，提示用户先点击分享按钮
      return {
        title: title,
        path: '/pages/tree/tree'
      };
    }
  },

  // ─────────────────────────────────────────────
  // Lifecycle cleanup
  // ─────────────────────────────────────────────

  onUnload() {
    // Clear sync interval
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  },

  onHide() {
    // Pause sync when app is hidden (optional optimization)
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  },



  // ─────────────────────────────────────────────
  // Cloud sync helpers
  // ─────────────────────────────────────────────

  // Start auto-sync interval (every 10 seconds for collaborative editing)
  _startSyncInterval() {
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
    }
    this._syncInterval = setInterval(() => {
      this._syncFromCloud();
    }, 10000); // 10 seconds as agreed
  },

  // Save data locally and sync to cloud if shared
  _saveData(db, isUpdate = false) {
    const sharedId = this.data.currentSharedId;


    // Save to local storage (with sharedId if applicable)
    Data.saveSession(db, sharedId);

    // If in shared mode, sync to cloud
    if (sharedId) {
      this._hasPendingChanges = true;
      this._syncToCloud();
    }
  },

  // Sync current changes to cloud database
  async _syncToCloud() {
    if (!this.data.currentSharedId || this.data.isSyncing) {
      return;
    }

    this.setData({ isSyncing: true });

    try {
      // Only push the current workspace's people, not the entire local db
      const wsId = this.data.currentSharedId;
      const wsPersonIds = this._collectWorkspace(wsId);
      const wsPeople = {};
      wsPersonIds.forEach(id => {
        wsPeople[id] = { ...this.data.db.people[id] };
      });

      const cloudDb = wx.cloud.database();
      await cloudDb.collection('genealogies').doc(wsId).update({
        data: {
          content: {
            people: wsPeople,
            activeRootId: this.data.db.activeRootId
          },
          updatedAt: Date.now()
        }
      });

      this.setData({
        lastSyncTime: Date.now(),
        isSyncing: false,
        _hasPendingChanges: false
      });
    } catch (err) {
      console.error('[syncToCloud] failed:', err);
      this.setData({ isSyncing: false });
    }
  },

  // Pull latest data from cloud database
  async _syncFromCloud() {
    if (!this.data.currentSharedId || this.data.isSyncing) {
      return;
    }

    // Don't overwrite if we have unsaved local edits
    if (this._hasPendingChanges) return;

    try {
      const cloudDb = wx.cloud.database();
      const res = await cloudDb.collection('genealogies').doc(this.data.currentSharedId).get();

      if (res.data && res.data.content) {
        const remoteContent = res.data.content;
        const remotePeople = remoteContent.people || {};

        // Merge remote workspace people into local db (only this workspace)
        // Other local workspaces are untouched
        const mergedPeople = { ...this.data.db.people };
        Object.keys(remotePeople).forEach(id => {
          mergedPeople[id] = remotePeople[id];
        });

        const mergedDb = {
          ...this.data.db,
          people: mergedPeople
        };

        // Update local cache and UI
        Data.saveSession(mergedDb, this.data.currentSharedId);

        this.setData({
          db: mergedDb,
          lastSyncTime: Date.now()
        }, () => this.refreshTree());
      }
    } catch (err) {
      console.error('[syncFromCloud] failed:', err);
    }
  }
});
