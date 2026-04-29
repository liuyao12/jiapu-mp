const ds = require('./utils/data-service.js');
const db = ds.getDB();

console.log('=== Nodes with spouses ===');
Object.values(db.people).forEach(p => {
  if (p.spouses && p.spouses.length > 0) {
    console.log((p.name || p.id) + ': spouses=' + p.spouses.join(','));
  }
});

console.log('\n=== Nodes with children ===');
Object.values(db.people).forEach(p => {
  if (p.children && p.children.length > 0) {
    console.log((p.name || p.id) + ': children=' + p.children.join(','));
  }
});
