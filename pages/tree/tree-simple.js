// tree-simple.js - 简化版家谱树页面
console.log('[tree-simple] module loading...');
const Logic = require('../../utils/family-logic.js');
console.log('[tree-simple] family-logic loaded');
const Data = require('../../utils/data-service.js');
console.log('[tree-simple] data-service loaded, calling Page()...');

Page({
  data: {
    db: { activeRootId: null, people: {} },
    nodes: [], lines: [], rulerTicks: [],
    showTimeline: false, showSpouses: true, showMaternal: false,
    collapsedNodes: [], showDrawer: false,
    editingId: '',
    draftPerson: {},
    _editingPerson: {},
    _pendingEdits: {},
    _pendingMotherSelected: false,
    _displaySpouses: [], _displayChildren: [], _displayFather: null,
    motherRange: [], currentMotherName: '',
    maxR: 750, maxH: 1000, memberCount: 0, familyName: '',
    creatingProfile: false,
    showJumpBtn: false,
    canAddFather: false,
    _hometownHint: '',
    showProgenitorList: false,
    progenitorList: [],
    showProgenitorDropdown: false,
    progenitorWorkspaces: [],
    currentSharedId: null,
    lastSyncTime: null,
    isSyncing: false,
    viewScale: 1,
    fitWidthOffset: 0,
    minNodeX: 0,
    maxNodeX: 750,
    lockHorizontalScroll: false,
    _syncingScroll: false,
  },

  // Non-reactive state
  _windowHeight: 0,
  _layoutCache: null,
  _refreshingTree: false,
  _refreshingDrawer: false,
  _syncInterval: null,
  _hasPendingChanges: false,
  _addingChild: false,
  _addingFather: false,
  _addingSpouse: false,

  onLoad(options) {
    console.log('[tree-simple] onLoad called');
    if (this._loadedFromOnLoad) return;
    try {
      this._loadedFromOnLoad = true;
      this._refreshingTree = false;
      this._refreshingDrawer = false;
      this._layoutCache = { standard: null, timeline: null };
      // 获取窗口高度，优先使用新 API，不支持时回退到旧 API
      let windowHeight = 800; // 默认值
      try {
        if (wx.getWindowInfo) {
          windowHeight = wx.getWindowInfo().windowHeight;
        } else if (wx.getSystemInfoSync) {
          windowHeight = wx.getSystemInfoSync().windowHeight;
        }
      } catch (e) {
        console.warn('Failed to get window height:', e);
      }
      this._windowHeight = windowHeight;

      if (options.sharedId) {
        // 简化：不加载分享家谱
        console.log('sharedId ignored in simple version');
      }

      let db = Data.getSession();
      if (!db) {
        db = { activeRootId: null, people: {} };
        this._saveData(db);
      }
      if (!db || typeof db !== 'object') db = { activeRootId: null, people: {} };
      if (!db.people) db.people = {};

      // 立即设置初始 db 数据，避免空状态检查错误
      this.setData({ db }, () => {
        // 延迟运行数据迁移，避免阻塞主线程
        setTimeout(() => {
          try {
            // 运行数据迁移
            db = this._migrateIdFormat(db);
            db = this._migrateWorkspaceId(db);
            db = this._migrateRemoveFatherId(db);

            const isEmpty = !db.activeRootId || !db.people || Object.keys(db.people).length === 0 || !db.people[db.activeRootId];

            this.setData({ db }, () => {
              console.log('[tree-simple] db set, page ready');
              this.refreshTree();
              if (isEmpty) {
                // 延迟显示添加祖先对话框，确保页面完全渲染
                setTimeout(() => {
                  if (!this.data.showDrawer) this._showAddAncestorDialog();
                }, 200);
              }
            });
          } catch (e) {
            console.error('onLoad migration error:', e);
            // Fallback to empty state
            this.setData({ db: { activeRootId: null, people: {} } }, () => {
              this.refreshTree();
              setTimeout(() => this._showAddAncestorDialog(), 200);
            });
          }
        }, 10); // 短延迟，让初始渲染完成
      });
    } catch (e) {
      console.error('onLoad error:', e);
      this._loadedFromOnLoad = true;
      this.setData({ db: { activeRootId: null, people: {} }, nodes: [], lines: [], familyName: '新建家谱' }, () => {
        this.refreshTree();
        setTimeout(() => this._showAddAncestorDialog(), 200);
      });
    }
  },

  // 仅保留一个核心方法
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

  // 必要的私有方法占位
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

  // Check if a person is a progenitor (root of a tree, no father)
  _isProgenitor(personId) {
    if (!personId || typeof personId !== 'string') return false;
    if (personId.length === 12 && personId.endsWith('-')) return true;
    return false;
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
      this._saveData(db);
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
  // Workspace ID migration
  // Assign workspaceId to all nodes that don't have one yet.
  // WorkspaceId is equal to the progenitor's own ID (12‑char root ID)
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

  // Get father ID by deducing from person's ID (remove last character)
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

  // Build list of possible mothers for a person
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

  // Handle tapping on a node to open the edit drawer
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

  // Save person profile (called from profile-editor component)
  onSaveProfile(e) {
    const detail = e.detail;
    if (!detail) return;
    const person = detail.person;
    if (!person || !person.id) return;
    const db = this.data.db;
    db.people[person.id] = person;
    this.setData({ db }, () => {
      this.refreshTree();
      this._saveData(db);
      wx.showToast({ title: '保存成功', icon: 'success' });
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

  onImport() {
    Data.importFromChat()
      .then(db => { this.setData({ db }); this.refreshTree(); })
      .catch(() => wx.showToast({ title: '导入失败', icon: 'error' }));
  },

  onExport() {
    // Export entire database (simple version)
    const db = this.data.db;
    Data.exportToChat(db);
  },

  onReset() {
    wx.showModal({
      title: '确认清空',
      content: '将清除所有数据，此操作不可撤销。',
      success: (res) => {
        if (!res.confirm) return;
        const emptyDb = { activeRootId: null, people: {} };
        this.setData({ db: emptyDb, showDrawer: false, editingId: '', creatingProfile: false });
        this._saveData(emptyDb);
        this.refreshTree();
      }
    });
  },

  toggleTimeline() {
    this.setData({ showTimeline: !this.data.showTimeline }, () => this.refreshTree());
  },

  toggleSpouses() {
    this.setData({ showSpouses: !this.data.showSpouses }, () => this.refreshTree());
  },

  toggleMaternal() {
    this.setData({ showMaternal: !this.data.showMaternal }, () => this.refreshTree());
  },

  // 处理空状态页面中的"添加始祖"按钮点击
  onAddAncestorBtnTap() {
    this._showAddAncestorDialog();
  },

  // 节点展开/折叠切换（简化版仅占位）
  onToggleCollapse(e) {
    const id = e.currentTarget.dataset.id;
    console.log('[onToggleCollapse]', id);
    // 简化版不实现展开/折叠逻辑
  },

  // 关闭编辑抽屉
  onCloseDrawer() {
    this.setData({
      showDrawer: false,
      editingId: '',
      creatingProfile: false
    });
  },

  _saveData(db) {
    Data.saveSession(db);
  }
});