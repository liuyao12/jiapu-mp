const { convertYear } = require('./cn-era');
const { RULER_PREFIXES } = require('./ruler-prefix');

const EARLIEST_PRECISE_CHINESE_YEAR = -841;
const GONGHE_START_YEAR = -841;
const GONGHE_END_YEAR = -828;

const TRADITIONAL_TO_SIMPLIFIED = {
  '萬': '万',
  '與': '与',
  '丟': '丢',
  '並': '并',
  '亂': '乱',
  '亞': '亚',
  '來': '来',
  '侖': '仑',
  '侶': '侣',
  '俠': '侠',
  '倉': '仓',
  '個': '个',
  '們': '们',
  '偉': '伟',
  '側': '侧',
  '僑': '侨',
  '儀': '仪',
  '價': '价',
  '儉': '俭',
  '儒': '儒',
  '優': '优',
  '兒': '儿',
  '內': '内',
  '兩': '两',
  '冊': '册',
  '凈': '净',
  '劉': '刘',
  '則': '则',
  '剛': '刚',
  '創': '创',
  '劍': '剑',
  '勛': '勋',
  '勝': '胜',
  '勞': '劳',
  '勢': '势',
  '勳': '勋',
  '區': '区',
  '卻': '却',
  '厲': '厉',
  '參': '参',
  '叢': '丛',
  '吳': '吴',
  '啟': '启',
  '喬': '乔',
  '單': '单',
  '嚴': '严',
  '國': '国',
  '圍': '围',
  '圖': '图',
  '圓': '圆',
  '聖': '圣',
  '場': '场',
  '壞': '坏',
  '壯': '壮',
  '壽': '寿',
  '夢': '梦',
  '夥': '伙',
  '奮': '奋',
  '奧': '奥',
  '婦': '妇',
  '嬰': '婴',
  '寧': '宁',
  '實': '实',
  '寵': '宠',
  '寶': '宝',
  '將': '将',
  '對': '对',
  '尋': '寻',
  '導': '导',
  '屬': '属',
  '岡': '冈',
  '嶺': '岭',
  '嶽': '岳',
  '巖': '岩',
  '幣': '币',
  '幫': '帮',
  '廣': '广',
  '廟': '庙',
  '廢': '废',
  '廬': '庐',
  '開': '开',
  '異': '异',
  '張': '张',
  '彌': '弥',
  '彥': '彦',
  '後': '后',
  '徵': '征',
  '德': '德',
  '復': '复',
  '恆': '恒',
  '惡': '恶',
  '愛': '爱',
  '慶': '庆',
  '慣': '惯',
  '應': '应',
  '懷': '怀',
  '懸': '悬',
  '戰': '战',
  '戶': '户',
  '拋': '抛',
  '挾': '挟',
  '捨': '舍',
  '據': '据',
  '攝': '摄',
  '擇': '择',
  '擊': '击',
  '斂': '敛',
  '數': '数',
  '齊': '齐',
  '斷': '断',
  '於': '于',
  '時': '时',
  '晉': '晋',
  '莊': '庄',
  '質': '质',
  '沖': '冲',
  '欽': '钦',
  '韋': '韦',
  '鬱': '郁',
  '煬': '炀',
  '憲': '宪',
  '閔': '闵',
  '靚': '靓',
  '暉': '晖',
  '暢': '畅',
  '曆': '历',
  '歷': '历',
  '書': '书',
  '會': '会',
  '朧': '胧',
  '東': '东',
  '極': '极',
  '樂': '乐',
  '樞': '枢',
  '標': '标',
  '機': '机',
  '權': '权',
  '歡': '欢',
  '歲': '岁',
  '歸': '归',
  '殘': '残',
  '殤': '殇',
  '氣': '气',
  '漢': '汉',
  '湯': '汤',
  '溫': '温',
  '滅': '灭',
  '滿': '满',
  '漁': '渔',
  '漢': '汉',
  '濟': '济',
  '濤': '涛',
  '燈': '灯',
  '營': '营',
  '燦': '灿',
  '爾': '尔',
  '牆': '墙',
  '獻': '献',
  '獲': '获',
  '現': '现',
  '環': '环',
  '璽': '玺',
  '畫': '画',
  '當': '当',
  '疊': '叠',
  '發': '发',
  '盡': '尽',
  '監': '监',
  '盧': '卢',
  '眾': '众',
  '睿': '睿',
  '確': '确',
  '禎': '祯',
  '禮': '礼',
  '禪': '禅',
  '禦': '御',
  '禱': '祷',
  '禿': '秃',
  '秈': '籼',
  '稅': '税',
  '穀': '谷',
  '積': '积',
  '穩': '稳',
  '窮': '穷',
  '竊': '窃',
  '競': '竞',
  '筆': '笔',
  '節': '节',
  '範': '范',
  '築': '筑',
  '簡': '简',
  '糧': '粮',
  '紀': '纪',
  '紛': '纷',
  '紹': '绍',
  '終': '终',
  '組': '组',
  '結': '结',
  '絕': '绝',
  '絳': '绛',
  '絲': '丝',
  '統': '统',
  '綏': '绥',
  '經': '经',
  '綜': '综',
  '綠': '绿',
  '緒': '绪',
  '總': '总',
  '繁': '繁',
  '繼': '继',
  '續': '续',
  '纘': '缵',
  '羅': '罗',
  '義': '义',
  '習': '习',
  '聽': '听',
  '肅': '肃',
  '脅': '胁',
  '脩': '修',
  '臨': '临',
  '興': '兴',
  '舉': '举',
  '艱': '艰',
  '華': '华',
  '萬': '万',
  '葉': '叶',
  '號': '号',
  '蜀': '蜀',
  '衛': '卫',
  '衝': '冲',
  '補': '补',
  '製': '制',
  '複': '复',
  '襄': '襄',
  '覺': '觉',
  '觀': '观',
  '規': '规',
  '視': '视',
  '親': '亲',
  '覲': '觐',
  '訓': '训',
  '託': '托',
  '記': '记',
  '詔': '诏',
  '詠': '咏',
  '詩': '诗',
  '誠': '诚',
  '誕': '诞',
  '語': '语',
  '誥': '诰',
  '誦': '诵',
  '說': '说',
  '調': '调',
  '諒': '谅',
  '論': '论',
  '諸': '诸',
  '諡': '谥',
  '謙': '谦',
  '證': '证',
  '豐': '丰',
  '貞': '贞',
  '負': '负',
  '貢': '贡',
  '財': '财',
  '責': '责',
  '賢': '贤',
  '賜': '赐',
  '賞': '赏',
  '賢': '贤',
  '贊': '赞',
  '趙': '赵',
  '跡': '迹',
  '踐': '践',
  '軒': '轩',
  '載': '载',
  '輔': '辅',
  '輝': '辉',
  '遼': '辽',
  '遜': '逊',
  '遞': '递',
  '遠': '远',
  '適': '适',
  '運': '运',
  '遷': '迁',
  '選': '选',
  '遺': '遗',
  '還': '还',
  '邊': '边',
  '鄉': '乡',
  '鄭': '郑',
  '醫': '医',
  '釋': '释',
  '里': '里',
  '錄': '录',
  '鎮': '镇',
  '長': '长',
  '門': '门',
  '閏': '闰',
  '開': '开',
  '閣': '阁',
  '關': '关',
  '陳': '陈',
  '際': '际',
  '隱': '隐',
  '雜': '杂',
  '雙': '双',
  '雲': '云',
  '電': '电',
  '靈': '灵',
  '靜': '静',
  '響': '响',
  '順': '顺',
  '顯': '显',
  '風': '风',
  '飛': '飞',
  '餘': '余',
  '饒': '饶',
  '馬': '马',
  '駿': '骏',
  '體': '体',
  '髮': '发',
  '鬥': '斗',
  '魯': '鲁',
  '鳳': '凤',
  '鴻': '鸿',
  '龍': '龙',
  '龜': '龟',
  '龐': '庞',
  '黃': '黄'
};

function toSimplified(text) {
  return String(text || '').replace(/[\u4e00-\u9fff]/g, char => TRADITIONAL_TO_SIMPLIFIED[char] || char);
}

function parseYear(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const year = parseInt(text, 10);
  return Number.isFinite(year) && year !== 0 ? year : null;
}

function ganzhiYear(value) {
  const year = parseYear(value);
  if (!Number.isFinite(year)) return '';
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const astronomicalYear = year < 0 ? year + 1 : year;
  const index = ((astronomicalYear - 4) % 60 + 60) % 60;
  return stems[index % 10] + branches[index % 12];
}

function toChineseInteger(num) {
  const n = Number(num);
  if (!Number.isFinite(n) || n <= 0) return '';
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n < 10) return digits[n];
  if (n === 10) return '十';
  if (n < 20) return `十${digits[n - 10]}`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${digits[tens]}十${ones ? digits[ones] : ''}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    return `${digits[hundreds]}百${rest ? toChineseInteger(rest) : ''}`;
  }
  return String(n);
}

function normalizedDynastyName(name) {
  const dynasty = toSimplified(name);
  const aliases = {
    '西晋': '晋',
    '东晋': '晋',
    '蜀汉': '蜀',
    '刘宋': '宋',
    '南齐': '齐',
    '南梁': '梁',
    '北宋': '宋',
    '南宋': '宋',
    '武周': '周'
  };
  return aliases[dynasty] || dynasty;
}

function displayDynastyName(name) {
  const dynasty = toSimplified(name);
  const aliases = {
    '西汉': '汉',
    '东汉': '汉',
    '西晋': '晋',
    '东晋': '晋',
    '蜀汉': '蜀',
    '刘宋': '宋',
    '南齐': '齐',
    '南梁': '梁',
    '北宋': '宋',
    '南宋': '宋'
  };
  return aliases[dynasty] || dynasty;
}

function rulerPrefixFor(year, dynastyName) {
  const dynasty = toSimplified(dynastyName);
  if (dynasty === '明' || dynasty === '清' || dynasty === '中华民国') return '';

  const targetDynasty = normalizedDynastyName(dynasty);
  const ruler = RULER_PREFIXES.find(item => {
    const start = item[0];
    const end = item[1];
    const itemDynasty = normalizedDynastyName(item[2]);
    return year >= start && year <= end && itemDynasty === targetDynasty;
  });

  if (!ruler) return displayDynastyName(dynasty);
  return `${displayDynastyName(ruler[2])}${toSimplified(ruler[3])}`;
}

function regnalYearLabel(year) {
  if (year < EARLIEST_PRECISE_CHINESE_YEAR) return '';
  if (year >= GONGHE_START_YEAR && year <= GONGHE_END_YEAR) {
    const gongheYear = year - GONGHE_START_YEAR + 1;
    const yearText = gongheYear === 1 ? '元' : toChineseInteger(gongheYear);
    return `周共和${yearText}年`;
  }
  const ruler = RULER_PREFIXES.find(item => year >= item[0] && year <= item[1]);
  if (!ruler) return '';
  const regnalYear = year - ruler[0] + 1;
  const yearText = regnalYear === 1 ? '元' : toChineseInteger(regnalYear);
  return `${displayDynastyName(ruler[2])}${toSimplified(ruler[3])}${yearText}年`;
}

function eraUsesZaiSuffix(era, year) {
  if (!era) return false;
  const dynasty = toSimplified(era.dynasty_name);
  const reign = toSimplified(era.reign_title).replace(/\s*\([^)]*\)\s*/g, '');
  const eraYear = Number(era.year);
  return dynasty === '唐'
    && year >= 744
    && year <= 758
    && (
      (reign === '天宝' && eraYear >= 3)
      || reign === '至德'
    );
}

function formatEraYearNum(era, year) {
  const yearNum = toSimplified(era && era.year_num);
  if (!eraUsesZaiSuffix(era, year)) return yearNum;
  return yearNum.endsWith('年') ? `${yearNum.slice(0, -1)}载` : yearNum;
}

function selectEra(candidates) {
  const eras = candidates || [];
  return eras[0] || null;
}

function eraYearLabel(value) {
  const year = parseYear(value);
  if (!Number.isFinite(year)) return '';
  if (year < EARLIEST_PRECISE_CHINESE_YEAR) return '';
  try {
    const candidates = convertYear(year, { mode: 'mainline' });
    const era = selectEra(candidates);
    if (!era) return regnalYearLabel(year);
    const dynasty = toSimplified(era.dynasty_name);
    const reign = toSimplified(era.reign_title).replace(/\s*\([^)]*\)\s*/g, '');
    const yearNum = formatEraYearNum(era, year);
    const dynastyPrefix = (reign === '民国') ? '' : rulerPrefixFor(year, dynasty);
    return `${dynastyPrefix}${reign}${yearNum}`;
  } catch (err) {
    return regnalYearLabel(year);
  }
}

function dateHintForYear(value) {
  const year = parseYear(value);
  if (!Number.isFinite(year)) return '';
  if (year < EARLIEST_PRECISE_CHINESE_YEAR) return '';
  const ganzhi = ganzhiYear(year);
  if (year > 1949) return `${year}年${ganzhi}`;
  const era = eraYearLabel(year);
  return [era, ganzhi].filter(Boolean).join('');
}

module.exports = {
  dateHintForYear,
  eraYearLabel,
  ganzhiYear
};
