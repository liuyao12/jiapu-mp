// utils/data-service.js
const STORAGE_KEY_BASE = 'family_db_session';
const CLOUD_CACHE_KEY = 'family_cloud_cache';

module.exports = {
  // Get session from local storage
  // If sharedId is provided, get the specific shared genealogy cache
  getSession: function(sharedId = null) {
    try {
      const storageKey = sharedId ? `${CLOUD_CACHE_KEY}_${sharedId}` : STORAGE_KEY_BASE;
      const raw = wx.getStorageSync(storageKey);
      if (!raw) return null;
      // Defensive: verify it's a valid object before deep copy
      if (typeof raw !== 'object' || raw === null) {
        console.warn('getSession: invalid storage data, clearing');
        wx.removeStorageSync(storageKey);
        return null;
      }
      return JSON.parse(JSON.stringify(raw));
    } catch (e) {
      console.error('getSession error, clearing storage:', e);
      const storageKey = sharedId ? `${CLOUD_CACHE_KEY}_${sharedId}` : STORAGE_KEY_BASE;
      wx.removeStorageSync(storageKey);
      return null;
    }
  },

  // Save session to local storage
  // If sharedId is provided, save as shared genealogy cache
  saveSession: function(db, sharedId = null) {
    try {
      const storageKey = sharedId ? `${CLOUD_CACHE_KEY}_${sharedId}` : STORAGE_KEY_BASE;
      // Always save a deep copy to prevent reference issues
      wx.setStorageSync(storageKey, JSON.parse(JSON.stringify(db)));
    } catch (e) { }
  },

  // Get list of all cached shared genealogies
  getSharedGenealogies: function() {
    try {
      const res = wx.getStorageInfoSync();
      const sharedKeys = res.keys.filter(key => key.startsWith(CLOUD_CACHE_KEY) && key !== CLOUD_CACHE_KEY);
      return sharedKeys.map(key => ({
        sharedId: key.replace(`${CLOUD_CACHE_KEY}_`, ''),
        lastUpdated: Date.now() // Can be enhanced with actual timestamp
      }));
    } catch (e) {
      console.error('getSharedGenealogies error:', e);
      return [];
    }
  },

  // Clear specific shared genealogy cache
  clearSharedCache: function(sharedId) {
    try {
      const storageKey = `${CLOUD_CACHE_KEY}_${sharedId}`;
      wx.removeStorageSync(storageKey);
    } catch (e) {
      console.error('clearSharedCache error:', e);
    }
  },
  importFromChat: function() {
    return new Promise((resolve, reject) => {
      wx.chooseMessageFile({
        count: 1, type: 'file', extension: ['json'],
        success: (res) => {
          const fs = wx.getFileSystemManager();
          try {
            const data = JSON.parse(fs.readFileSync(res.tempFiles[0].path, 'utf8'));
            // Deep copy to ensure data isolation
            const isolatedData = JSON.parse(JSON.stringify(data));
            wx.setStorageSync(STORAGE_KEY_BASE, isolatedData);
            resolve(isolatedData);
          } catch (e) { reject(e); }
        },
        fail: reject
      });
    });
  },
  // Legacy function: collect all descendants and related people (spouses, children, grandchildren, etc.)
  // Used for backward compatibility - new export logic uses different approach
  _collectDescendants: function(people, rootId, collected = new Set()) {
    if (!rootId || collected.has(rootId)) return collected;
    
    const person = people[rootId];
    if (!person) return collected;
    
    // Add this person
    collected.add(rootId);
    
    // Add spouse (only the spouse themselves, not their relatives)
    if (person.spouse) {
      collected.add(person.spouse);
    }
    
    // Recursively collect all children
    if (person.children && person.children.length > 0) {
      const self = this;
      person.children.forEach(childId => {
        self._collectDescendants(people, childId, collected);
      });
    }
    
    return collected;
  },

  exportToChat: function(db) {
    const fs = wx.getFileSystemManager();
    const root = db.people[db.activeRootId];
    const name = root ? (root.name || ((root.surname || '') + (root.firstname || '')) || '未命名') : '未命名';
    const now = new Date();
    const dateStr = now.getFullYear() + '-' +
                   String(now.getMonth() + 1).padStart(2, '0') + '-' +
                   String(now.getDate()).padStart(2, '0') + '_' +
                   String(now.getHours()).padStart(2, '0') +
                   String(now.getMinutes()).padStart(2, '0');
    const fileName = `${name}_家谱_${dateStr}.json`;
    const path = `${wx.env.USER_DATA_PATH}/${fileName}`;

    // Export all people in the database (entire workspace)
    // This includes all progenitors and their descendants
    const exportDb = {
      activeRootId: db.activeRootId,
      people: db.people
    };

    fs.writeFileSync(path, JSON.stringify(exportDb, null, 2), 'utf8');
    wx.shareFileMessage({ filePath: path, fileName: fileName });
  }
};