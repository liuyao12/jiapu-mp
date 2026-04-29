// utils/family-logic.js
const ROW_H = 72;
const ROW_STEP = 70; 
const INDENT_W = 80; 
const PX_PER_YEAR = 6; 
const CURRENT_YEAR = 2026;
const TRUNK_OFFSET = 42; 

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

function getBYear(db, id) { return db.people[id]?._estBYear || 1900; }

function runEstimation(db, rootId) {
  if (!db || !db.people) return;
  Object.values(db.people).forEach(p => p._estBYear = p.bYear ? parseInt(p.bYear) : null);
  const estimateRecursive = (id, parentYear, visitedEst) => {
    if (visitedEst.has(id)) return;
    visitedEst.add(id);
    const p = db.people[id]; if (!p) return;
    if (p._estBYear === null) {
      // findAnchor: walk children to find nearest known bYear
      const findAnchor = (currId, dist, visitedAnc) => {
        if (visitedAnc.has(currId)) return null;
        visitedAnc.add(currId);
        const curr = db.people[currId]; if (!curr) return null;
        if (curr.bYear) return { year: parseInt(curr.bYear), dist };
        for (let cid of (curr.children || [])) {
          let res = findAnchor(cid, dist + 1, visitedAnc); if (res) return res;
        }
        return null;
      };
      let anchor = findAnchor(id, 0, new Set());
      p._estBYear = anchor ? Math.floor(anchor.year - (anchor.dist * 25)) : parentYear + 25;
    }
    const kids = (p.children || []).filter(cid => db.people[cid]);
    kids.forEach(cid => estimateRecursive(cid, p._estBYear, visitedEst));
  };
  if (rootId) estimateRecursive(rootId, 1850, new Set());
  
  // Second pass: estimate birth years for spouses that weren't visited
  // (spouses are not in the children chain, so estimateRecursive skips them)
  // Strategy: among a married pair, pick the better-known year and share it.
  // "Better" = real bYear beats estimated; higher confidence beats lower.
  // This must be bidirectional: viewing from wife's tree should give husband
  // the same year as viewing from husband's tree, and vice versa.
  Object.values(db.people).forEach(p => {
    (p.spouses || []).forEach(sid => {
      const s = db.people[sid];
      if (!s) return;
      const pHasReal  = !!p.bYear;
      const sHasReal  = !!s.bYear;
      const pYear = pHasReal ? parseInt(p.bYear) : p._estBYear;
      const sYear = sHasReal ? parseInt(s.bYear) : s._estBYear;

      if (pHasReal && !sHasReal) {
        // p has real bYear, s has no real bYear → s inherits p's real year
        s._estBYear = parseInt(p.bYear);
      } else if (sHasReal && !pHasReal) {
        // s has real bYear, p has no real bYear → p inherits s's real year
        p._estBYear = parseInt(s.bYear);
      } else if (!pHasReal && !sHasReal) {
        // Neither has a real bYear — share whichever estimated year is non-null
        if (pYear && !sYear) {
          s._estBYear = pYear;
        } else if (sYear && !pYear) {
          p._estBYear = sYear;
        }
        // If both have estimates, keep them as-is (estimated independently)
      }
      // If both have real bYears, nothing to do
    });
  });
}

function calculateLayout(db, config) {
  const { rootId, showTimeline, showSpouses, showMaternal, collapsedNodes } = config;
  const nodes = [], lines = [], rulerTicks = [];
  let maxR = 0, minY = 2026, maxD = 1, maxRow = 0;

  if (!db || !db.people || !rootId || !db.people[rootId]) {
    return { nodes: [], lines: [], rulerTicks: [], maxR: 750, maxH: 1000 };
  }

  runEstimation(db, rootId);
  Object.values(db.people).forEach(p => { if (p._estBYear) minY = Math.min(minY, p._estBYear); });
  const startYear = Math.floor((minY - 20) / 20) * 20;

  // For nodes without death year in timeline view: 
  // Assume person lives to 80 years
  // Box shows from bYear to min(bYear+80, CURRENT_YEAR)
  // Fade zone: from (bYear+70) to boxEnd
  const getMask = (id, bYear, dYear) => {
    if (!showTimeline || dYear) return "";
    // No fade if person would be younger than 70
    if (bYear + 70 > CURRENT_YEAR) return "";
    const assumedDeathYear = bYear + 80;
    // Box ends at min(assumed death year, current year)
    const boxEnd = Math.min(assumedDeathYear, CURRENT_YEAR);
    const boxStart = bYear;
    // Fade starts at bYear+70 (age 70), not at boxEnd-10
    const fadeStartYear = bYear + 70;
    // Calculate fade start as percentage of total box width
    const fadeStartPercent = ((fadeStartYear - boxStart) / (boxEnd - boxStart)) * 100;
    // Apply gradient: fade from fadeStartYear to boxEnd
    return `-webkit-mask-image: linear-gradient(to right, black ${fadeStartPercent}%, transparent 100%);`;
  };

  // Current year line position (2026)
  const currentYearLineX = showTimeline ? (CURRENT_YEAR - startYear) * PX_PER_YEAR : -1;

  const findMaxRight = (id, depth, visitedFmr) => {
    if (visitedFmr.has(id)) return;
    visitedFmr.add(id);
    const p = db.people[id]; if (!p) return;
    maxD = Math.max(maxD, depth + 1);
    const startX = showTimeline ? (getBYear(db, id) - startYear) * PX_PER_YEAR : depth * INDENT_W;
    maxR = Math.max(maxR, startX + (getDisplayName(p).length * 30) + 350);
    if (!(collapsedNodes || []).includes(id)) {
      if (showSpouses && p.spouses) {
        p.spouses.forEach(sid => {
          const s = db.people[sid]; if (s) maxR = Math.max(maxR, (showTimeline ? (getBYear(db, sid) - startYear) * PX_PER_YEAR : startX) + (getDisplayName(s).length * 30) + 350);
        });
      }
      let kids = (p.children || []).filter(cid => db.people[cid]);
      // 只从男性节点绘制连接线到自己的子女
      if (p.gender !== 'male') {
        kids = []; // 女性节点不绘制连接线到自己的子女
      }
      // 外孙功能:如果当前节点是女性且 showMaternal=true,把配偶的子女添加到遍历列表
      // 这些子女会在 traverse() 中被处理,连接线从配偶节点(男性)出发
      if (p.gender === 'female' && showMaternal && p.spouses && p.spouses.length > 0) {
        p.spouses.forEach(sid => {
          const spouse = db.people[sid];
          if (spouse && spouse.children && spouse.children.length > 0) {
            spouse.children.forEach(cid => {
              if (db.people[cid] && !kids.includes(cid)) {
                kids.push(cid);
              }
            });
          }
        });
      }
      kids.forEach(cid => findMaxRight(cid, depth + 1, visitedFmr));
    }
  };
  findMaxRight(rootId, 0, new Set());

  const visitedTraverse = new Set();
  const traverse = (id, depth, rowIdx) => {
    if (visitedTraverse.has(id)) return rowIdx;
    visitedTraverse.add(id);
    const p = db.people[id]; 
    if (!p) return rowIdx;
    maxRow = Math.max(maxRow, rowIdx);
    const isCollapsed = (collapsedNodes || []).includes(id);
    const myX = showTimeline ? (getBYear(db, id) - startYear) * PX_PER_YEAR : depth * INDENT_W;
    const myY = rowIdx * ROW_STEP;
    const midY = myY + ROW_H / 2;
    
    let kids = (p.children || []).filter(cid => db.people[cid]);
    // 只从男性节点绘制连接线到自己的子女
    if (p.gender !== 'male') {
      kids = []; // 女性节点不绘制连接线到自己的子女
    }
    // 外孙功能:如果当前节点是女性且 showMaternal=true,把配偶的子女添加到遍历列表
    // 这些子女会在 traverse() 中被处理,连接线从配偶节点(男性)出发
    if (p.gender === 'female' && showMaternal && p.spouses && p.spouses.length > 0) {
      p.spouses.forEach(sid => {
        const spouse = db.people[sid];
        if (spouse && spouse.children && spouse.children.length > 0) {
          spouse.children.forEach(cid => {
            if (db.people[cid] && !kids.includes(cid)) {
              kids.push(cid);
            }
          });
        }
      });
    }
    const sIds = (showSpouses && p.spouses) ? p.spouses : [];

    // Check if this person is an outsider (different paternalRootId from current root)
    const isOutsider = p.paternalRootId && rootId && p.paternalRootId !== rootId;
    
    // In timeline view: box ends at current year line, no right border line needed
    let nodeWidth;
    if (showTimeline) {
      const boxEndYear = p.dYear ? parseInt(p.dYear) : Math.min(getBYear(db, id) + 80, CURRENT_YEAR);
      const maxWidth = currentYearLineX - myX;
      nodeWidth = Math.max(boxEndYear - getBYear(db, id), 12) * PX_PER_YEAR;
      nodeWidth = Math.min(nodeWidth, maxWidth); // Cap at current year line
    } else {
      nodeWidth = maxR - myX;
    }
    // CRITICAL: Use the 'id' parameter (db key) instead of p.id to ensure consistency
    // p.id might not match the db key if there was a data inconsistency
    const topEdge = myY;
    const bottomEdge = myY + ROW_H;
    nodes.push({
      id: id, name: getDisplayName(p), gender: p.gender || 'unknown',
      life: (p.bYear || p.dYear) ? `${p.bYear || (p.dYear ? '?' : '')}–${p.dYear || ''}` : '',
      x: myX, y: myY, h: ROW_H, iconType: (kids.length > 0 || sIds.length > 0) ? (isCollapsed ? 'plus' : 'minus') : 'leaf',
      maskStyle: getMask(id, getBYear(db, id), p.dYear),
      w: nodeWidth,
      isOutsider: isOutsider
    });

    let nextAvailableRow = rowIdx + 1;
    const parentIconX = myX + TRUNK_OFFSET;

    if (!isCollapsed) {
      sIds.forEach(sid => {
        const s = db.people[sid]; if (!s) return;
        // Skip if this node was already rendered via traverse() (e.g. it appeared in someone's
        // children array before we got here). Rendering it again would consume an extra row → gap.
        if (visitedTraverse.has(sid)) return;
        // Mark spouse as visited so traverse() won't accidentally re-process it
        // if the same ID also appears in someone's children array (data inconsistency guard)
        visitedTraverse.add(sid);
        const sX = showTimeline ? (getBYear(db, sid) - startYear) * PX_PER_YEAR : myX;
        const sY = nextAvailableRow * ROW_STEP;
        // In timeline view: box ends at current year line
        let spouseWidth;
        if (showTimeline) {
          const boxEndYear = s.dYear ? parseInt(s.dYear) : Math.min(getBYear(db, sid) + 80, CURRENT_YEAR);
          const maxWidth = currentYearLineX - sX;
          spouseWidth = Math.max(boxEndYear - getBYear(db, sid), 12) * PX_PER_YEAR;
          spouseWidth = Math.min(spouseWidth, maxWidth);
        } else {
          spouseWidth = maxR - sX;
        }
        nodes.push({
          id: sid, name: getDisplayName(s), gender: s.gender || 'female', isSpouse: true,
          life: (s.bYear || s.dYear) ? `${s.bYear || (s.dYear ? '?' : '')}–${s.dYear || ''}` : '',
          x: sX, y: sY, h: ROW_H, iconType: 'marriage',
          maskStyle: getMask(sid, getBYear(db, sid), s.dYear),
          w: spouseWidth
        });
        
        // 添加婚姻连接线（从主人物到配偶的垂直线）
        if (!showTimeline) {
          // 在标准树状视图中,从主人物图标位置向下到配偶节点
          const lineX = myX + TRUNK_OFFSET; // 主人物图标右侧
          const lineStartY = midY; // 主人物中间位置
          const lineEndY = sY + ROW_H / 2; // 配偶中间位置
          const lineHeight = lineEndY - lineStartY; // 垂直线高度

          if (lineHeight > 0) {
            lines.push({
              type: 'marriage',
              x: lineX,
              y: lineStartY,
              w: 1.5,
              h: lineHeight
            });
          }
        }
        
        nextAvailableRow++;
      });
      if (kids.length > 0) {
        const childXBase = showTimeline ? (Math.min(...kids.map(c => getBYear(db, c))) - 5 - startYear) * PX_PER_YEAR : parentIconX;
        if (showTimeline) {
          const branchLine = { type: 'branch', x: Math.min(parentIconX, childXBase), y: midY, w: Math.abs(childXBase - parentIconX) };
          lines.push(branchLine);
        }
        let lastChildMidY = midY;
        let actualChildCount = 0;
        kids.forEach((cid) => {
          // Skip if this child was already rendered via a different path
          if (visitedTraverse.has(cid)) {
            return;
          }
          actualChildCount++;

          // IMPORTANT: Record child row BEFORE traverse to use for branch line
          const childRow = nextAvailableRow;
          const childY = childRow * ROW_STEP;
          const childX = showTimeline ? (getBYear(db, cid) - startYear) * PX_PER_YEAR : (depth + 1) * INDENT_W;
          const targetX = showTimeline ? childX : (childX + TRUNK_OFFSET);
          const childMidY = childY + ROW_H / 2;
          const branchLine = { type: 'branch', x: childXBase, y: childMidY, w: Math.max(targetX - childXBase, 0) };
          lines.push(branchLine);

          // Save nextAvailableRow before traverse to detect if any descendants were actually rendered
          const beforeTraverseRow = nextAvailableRow;
          // traverse returns the total rows consumed by this child and all its descendants
          nextAvailableRow = traverse(cid, depth + 1, nextAvailableRow);

          // Only update lastChildMidY if this child or its descendants actually consumed rows
          // (i.e., nextAvailableRow increased after the traverse)
          if (nextAvailableRow > beforeTraverseRow) {
            // Last node is at row (nextAvailableRow - 1)
            // Use the actual child row that was recorded before traverse
            lastChildMidY = childRow * ROW_STEP + ROW_H / 2;
          }
        });
        const stemLine = { type: 'stem', x: childXBase, y: midY, h: (lastChildMidY - midY) };
        lines.push(stemLine);

        // 在 stem 线的末端添加一横(就像树枝末端的标记)
        if (actualChildCount > 0 && lastChildMidY > midY) {
          const stemEndWidth = 20; // 末端横线的宽度
          // 像其他子节点的横线一样，从 childXBase 向右延伸
          const stemEndLine = { type: 'branch', x: childXBase, y: lastChildMidY, w: stemEndWidth };
          lines.push(stemEndLine);
        }
      }
    }
    return nextAvailableRow;
  };

  traverse(rootId, 0, 0);

  // Ensure enough height for current year line to extend full screen
  const minHeight = Math.max((maxRow * ROW_STEP) + 80 + 400, (CURRENT_YEAR - startYear + 20) * PX_PER_YEAR + 200);

  if (showTimeline) {
    // 时间轴视图：每10年一个小刻度，每20年一个大刻度（带标签），每100年一个更大的刻度
    for (let y = startYear; y <= CURRENT_YEAR + 10; y += 10) {
      const isCentennial = y % 100 === 0;
      const isTwentyYear = y % 20 === 0;
      const isCurrent = y === CURRENT_YEAR;

      rulerTicks.push({
        x: (y - startYear) * PX_PER_YEAR,
        label: isTwentyYear || isCurrent ? y : '',
        type: isCentennial ? 'major' : (isTwentyYear ? 'medium' : 'minor'),
        isCurrentYear: isCurrent
      });
    }
  } else {
    // 标准视图：代际块，左边界对齐对应代节点的左边缘
    // 节点 left = depth*INDENT_W + 40（WXML 固定偏移），TRUNK_OFFSET(42) 是连接线位置（偏右2px，不用于节点对齐）
    const generationsToShow = Math.max(maxD, 3);
    for (let i = 0; i < generationsToShow; i++) {
      // 垂直线在 x=40, 120, 200... 对齐各代节点左缘（节点 left = depth*80+40）
      // 块：左边界在垂直线位置，宽80，文字居中于块中点
      rulerTicks.push({
        x: (i + 1) * INDENT_W - 40,  // 垂直线/块左边界：40, 120, 200...
        label: (i + 1) + '世',         // "1世"居中于x=80，"2世"居中于x=160...
        type: 'standard'
      });
    }
  }
  // In timeline view, ensure maxR extends at least to current year line with padding
  const finalMaxR = showTimeline ? Math.max(maxR, currentYearLineX + 150) : maxR + 150;
  
  return { 
    nodes, 
    lines, 
    rulerTicks, 
    maxR: finalMaxR, 
    maxH: minHeight,
    currentYearLineX: showTimeline ? (CURRENT_YEAR - startYear) * PX_PER_YEAR : -1,
    currentYear: CURRENT_YEAR
  };
}

module.exports = { calculateLayout };