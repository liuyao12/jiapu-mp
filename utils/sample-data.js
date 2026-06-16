const TANG_IMPERIAL_WORKSPACE_ID = 'sample_tang_imperial';
const TANG_IMPERIAL_ROOT_ID = 'tan_imp_001-';
const TANG_IMPERIAL_SAMPLE_VERSION = '20';
const DUGU_XIN_WORKSPACE_ID = 'sample_dugu_xin';
const DUGU_XIN_ROOT_ID = 'dug_xin_001-';
const DUGU_XIN_SAMPLE_VERSION = '17';
const SOONG_FAMILY_WORKSPACE_ID = 'sample_soong_family';
const SOONG_FAMILY_ROOT_ID = 'soo_jia_001-';
const SOONG_FAMILY_SAMPLE_VERSION = '9';

const IDS = {
  gaozu: TANG_IMPERIAL_ROOT_ID,
  taizong: `${TANG_IMPERIAL_ROOT_ID}A`,
  gaozong: `${TANG_IMPERIAL_ROOT_ID}AA`,
  zhongzong: `${TANG_IMPERIAL_ROOT_ID}AAA`,
  shangdi: `${TANG_IMPERIAL_ROOT_ID}AAAA`,
  chongjun: `${TANG_IMPERIAL_ROOT_ID}AAAB`,
  anlePrincess: `${TANG_IMPERIAL_ROOT_ID}AAAC`,
  ruizong: `${TANG_IMPERIAL_ROOT_ID}AAB`,
  xuanzong: `${TANG_IMPERIAL_ROOT_ID}AABA`,
  suzong: `${TANG_IMPERIAL_ROOT_ID}AABAA`,
  daizong: `${TANG_IMPERIAL_ROOT_ID}AABAAA`,
  dezong: `${TANG_IMPERIAL_ROOT_ID}AABAAAA`,
  shunzong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAA`,
  xianzong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAA`,
  muzong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAA`,
  jingzong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAAA`,
  chengmei: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAAAA`,
  wenzong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAAB`,
  liyong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAABA`,
  wuzong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAAC`,
  xuanzongLiChen: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAB`,
  yizong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAABA`,
  xizong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAABAA`,
  zhaozong: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAABAB`,
  aidi: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAABABA`,
  lichengqi: `${TANG_IMPERIAL_ROOT_ID}AABB`,
  liying: `${TANG_IMPERIAL_ROOT_ID}AABAB`,
  lining: `${TANG_IMPERIAL_ROOT_ID}AABAAAAAAC`,
  jiancheng: `${TANG_IMPERIAL_ROOT_ID}B`,
  yuanji: `${TANG_IMPERIAL_ROOT_ID}C`,
  chengqian: `${TANG_IMPERIAL_ROOT_ID}AB`,
  lizhong: `${TANG_IMPERIAL_ROOT_ID}AAC`,
  lihong: `${TANG_IMPERIAL_ROOT_ID}AAD`,
  lixianZhanghuai: `${TANG_IMPERIAL_ROOT_ID}AAE`,
  taipingPrincess: `${TANG_IMPERIAL_ROOT_ID}AAF`,
  wuZetian: 'tan_wuz_001-',
  empressZhangsun: 'tan_zhs_001-',
  empressWei: 'tan_wei_001-',
  yangGuifei: 'tan_ygy_001-',
  empressZhang: 'tan_zhg_001-'
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function eventWithYear(id, name, year) {
  return { id, name, year: String(year || '').trim() };
}

function reignEvent(id, years) {
  return eventWithYear(id, '皇帝', years);
}

function crownPrinceEvent(id, years) {
  return eventWithYear(id, '太子', years);
}

function personInWorkspace(id, workspaceId, data) {
  return {
    id,
    gender: 'male',
    isLiving: false,
    workspaceId,
    children: [],
    spouses: [],
    events: [],
    ...data
  };
}

function person(id, data) {
  return personInWorkspace(id, TANG_IMPERIAL_WORKSPACE_ID, data);
}

const SOONG_IDS = {
  charlie: SOONG_FAMILY_ROOT_ID,
  ni: 'soo_ni_001-',
  ailing: `${SOONG_FAMILY_ROOT_ID}A`,
  qingling: `${SOONG_FAMILY_ROOT_ID}B`,
  ziwen: `${SOONG_FAMILY_ROOT_ID}C`,
  meiling: `${SOONG_FAMILY_ROOT_ID}D`,
  ziliang: `${SOONG_FAMILY_ROOT_ID}E`,
  zian: `${SOONG_FAMILY_ROOT_ID}F`,
  kong: 'soo_kong_001-',
  sun: 'soo_sun_001-',
  chiang: 'soo_chi_001-',
  kongLingyi: 'soo_kong_001-A',
  kongLingkan: 'soo_kong_001-B',
  kongLingwei: 'soo_kong_001-C',
  kongLingjie: 'soo_kong_001-D',
  sunKe: 'soo_sun_001-A',
  sunYan: 'soo_sun_001-B',
  sunWan: 'soo_sun_001-C',
  sunZhiqiang: 'soo_sun_001-AA',
  sunZhiping: 'soo_sun_001-AB',
  chiangChingKuo: 'soo_chi_001-A',
  chiangWeiKuo: 'soo_chi_001-B',
  chiangHsiaoWen: 'soo_chi_001-AA',
  chiangHsiaoChang: 'soo_chi_001-AB',
  chiangHsiaoWu: 'soo_chi_001-AC',
  chiangHsiaoYung: 'soo_chi_001-AD',
  chiangHsiaoYen: 'soo_chi_001-AE',
  chiangHsiaoTzu: 'soo_chi_001-AF',
  chiangHsiaoKang: 'soo_chi_001-BA',
  chiangYoubo: 'soo_chi_001-ADA',
  wayneChiang: 'soo_chi_001-AEA',
  ziwenWife: 'soo_zhang_001-',
  ziwenQiongyi: 'soo_jia_001-CA',
  ziwenManyi: 'soo_jia_001-CB',
  ziwenRuiyi: 'soo_jia_001-CC',
  fengYanda: 'soo_feng_001-',
  fengYinghan: 'soo_feng_001-A',
  fengYingxiang: 'soo_feng_001-B',
  fengYongjian: 'soo_feng_001-BA',
  ziliangWife: 'soo_xi_001-',
  ziliangQingyi: 'soo_jia_001-EA',
  zianWife: 'soo_wu_001-',
  zianBoxiong: 'soo_jia_001-FA',
  zianZhonghu: 'soo_jia_001-FB',
  zianYuanxiao: 'soo_jia_001-FBA'
};

function soongPerson(id, data) {
  return personInWorkspace(id, SOONG_FAMILY_WORKSPACE_ID, data);
}

const soongPeople = {
  [SOONG_IDS.charlie]: soongPerson(SOONG_IDS.charlie, {
    name: '宋嘉树（耀如）',
    surname: '宋',
    firstname: '嘉树',
    alias: '耀如',
    hometown: '广东文昌',
    bYear: '1864',
    dYear: '1918',
    children: [SOONG_IDS.ailing, SOONG_IDS.qingling, SOONG_IDS.ziwen, SOONG_IDS.meiling, SOONG_IDS.ziliang, SOONG_IDS.zian],
    spouses: [SOONG_IDS.ni]
  }),
  [SOONG_IDS.ni]: soongPerson(SOONG_IDS.ni, {
    name: '倪桂珍',
    surname: '倪',
    firstname: '桂珍',
    alias: '珪贞',
    gender: 'female',
    bYear: '1869',
    dYear: '1931',
    spouses: [SOONG_IDS.charlie]
  }),
  [SOONG_IDS.ailing]: soongPerson(SOONG_IDS.ailing, {
    name: '宋霭龄',
    surname: '宋',
    firstname: '霭龄',
    gender: 'female',
    bYear: '1889',
    dYear: '1973',
    motherId: SOONG_IDS.ni,
    spouses: [SOONG_IDS.kong]
  }),
  [SOONG_IDS.qingling]: soongPerson(SOONG_IDS.qingling, {
    name: '宋庆龄',
    surname: '宋',
    firstname: '庆龄',
    gender: 'female',
    bYear: '1893',
    dYear: '1981',
    motherId: SOONG_IDS.ni,
    spouses: [SOONG_IDS.sun]
  }),
  [SOONG_IDS.ziwen]: soongPerson(SOONG_IDS.ziwen, {
    name: '宋子文',
    surname: '宋',
    firstname: '子文',
    bYear: '1894',
    dYear: '1971',
    motherId: SOONG_IDS.ni,
    spouses: [SOONG_IDS.ziwenWife],
    children: [SOONG_IDS.ziwenQiongyi, SOONG_IDS.ziwenManyi, SOONG_IDS.ziwenRuiyi]
  }),
  [SOONG_IDS.meiling]: soongPerson(SOONG_IDS.meiling, {
    name: '宋美龄',
    surname: '宋',
    firstname: '美龄',
    gender: 'female',
    bYear: '1898',
    dYear: '2003',
    motherId: SOONG_IDS.ni,
    spouses: [SOONG_IDS.chiang]
  }),
  [SOONG_IDS.ziliang]: soongPerson(SOONG_IDS.ziliang, {
    name: '宋子良',
    surname: '宋',
    firstname: '子良',
    bYear: '1899',
    dYear: '1987',
    motherId: SOONG_IDS.ni,
    spouses: [SOONG_IDS.ziliangWife],
    children: [SOONG_IDS.ziliangQingyi]
  }),
  [SOONG_IDS.zian]: soongPerson(SOONG_IDS.zian, {
    name: '宋子安',
    surname: '宋',
    firstname: '子安',
    bYear: '1906',
    dYear: '1969',
    motherId: SOONG_IDS.ni,
    spouses: [SOONG_IDS.zianWife],
    children: [SOONG_IDS.zianBoxiong, SOONG_IDS.zianZhonghu]
  }),
  [SOONG_IDS.kong]: soongPerson(SOONG_IDS.kong, {
    name: '孔祥熙',
    surname: '孔',
    firstname: '祥熙',
    gender: 'male',
    hometown: '山西太谷',
    bYear: '1880',
    dYear: '1967',
    spouses: [SOONG_IDS.ailing],
    children: [SOONG_IDS.kongLingyi, SOONG_IDS.kongLingkan, SOONG_IDS.kongLingwei, SOONG_IDS.kongLingjie]
  }),
  [SOONG_IDS.sun]: soongPerson(SOONG_IDS.sun, {
    name: '孙中山',
    surname: '孙',
    firstname: '中山',
    alias: '逸仙',
    gender: 'male',
    hometown: '广东香山',
    bYear: '1866',
    dYear: '1925',
    spouses: [SOONG_IDS.qingling],
    children: [SOONG_IDS.sunKe, SOONG_IDS.sunYan, SOONG_IDS.sunWan],
    events: [eventWithYear('soong_sun_president', '总统', '1912')]
  }),
  [SOONG_IDS.chiang]: soongPerson(SOONG_IDS.chiang, {
    name: '蒋介石',
    surname: '蒋',
    firstname: '介石',
    gender: 'male',
    hometown: '浙江奉化',
    bYear: '1887',
    dYear: '1975',
    spouses: [SOONG_IDS.meiling],
    children: [SOONG_IDS.chiangChingKuo, SOONG_IDS.chiangWeiKuo],
    events: [eventWithYear('soong_chiang_president', '总统', '1927-1975')]
  }),
  [SOONG_IDS.kongLingyi]: soongPerson(SOONG_IDS.kongLingyi, {
    name: '孔令仪', surname: '孔', firstname: '令仪', gender: 'female', bYear: '1915', dYear: '2008', motherId: SOONG_IDS.ailing
  }),
  [SOONG_IDS.kongLingkan]: soongPerson(SOONG_IDS.kongLingkan, {
    name: '孔令侃', surname: '孔', firstname: '令侃', bYear: '1916', dYear: '1992', motherId: SOONG_IDS.ailing
  }),
  [SOONG_IDS.kongLingwei]: soongPerson(SOONG_IDS.kongLingwei, {
    name: '孔令伟', surname: '孔', firstname: '令伟', gender: 'female', bYear: '1919', dYear: '1994', motherId: SOONG_IDS.ailing
  }),
  [SOONG_IDS.kongLingjie]: soongPerson(SOONG_IDS.kongLingjie, {
    name: '孔令杰', surname: '孔', firstname: '令杰', bYear: '1921', dYear: '1996', motherId: SOONG_IDS.ailing
  }),
  [SOONG_IDS.sunKe]: soongPerson(SOONG_IDS.sunKe, {
    name: '孙科', surname: '孙', firstname: '科', bYear: '1891', dYear: '1973', children: [SOONG_IDS.sunZhiping, SOONG_IDS.sunZhiqiang]
  }),
  [SOONG_IDS.sunYan]: soongPerson(SOONG_IDS.sunYan, {
    name: '孙娫', surname: '孙', firstname: '娫', gender: 'female', bYear: '1894', dYear: '1913'
  }),
  [SOONG_IDS.sunWan]: soongPerson(SOONG_IDS.sunWan, {
    name: '孙婉', surname: '孙', firstname: '婉', gender: 'female', bYear: '1896', dYear: '1979'
  }),
  [SOONG_IDS.sunZhiqiang]: soongPerson(SOONG_IDS.sunZhiqiang, {
    name: '孙治强', surname: '孙', firstname: '治强', bYear: '1915', dYear: '2001'
  }),
  [SOONG_IDS.sunZhiping]: soongPerson(SOONG_IDS.sunZhiping, {
    name: '孙治平', surname: '孙', firstname: '治平', bYear: '1913', dYear: '2005'
  }),
  [SOONG_IDS.chiangChingKuo]: soongPerson(SOONG_IDS.chiangChingKuo, {
    name: '蒋经国', surname: '蒋', firstname: '经国', bYear: '1910', dYear: '1988', children: [SOONG_IDS.chiangHsiaoWen, SOONG_IDS.chiangHsiaoChang, SOONG_IDS.chiangHsiaoWu, SOONG_IDS.chiangHsiaoYung, SOONG_IDS.chiangHsiaoYen, SOONG_IDS.chiangHsiaoTzu],
    events: [eventWithYear('soong_chingkuo_president', '总统', '1978-1988')]
  }),
  [SOONG_IDS.chiangWeiKuo]: soongPerson(SOONG_IDS.chiangWeiKuo, {
    name: '蒋纬国', surname: '蒋', firstname: '纬国', bYear: '1916', dYear: '1997', children: [SOONG_IDS.chiangHsiaoKang]
  }),
  [SOONG_IDS.chiangHsiaoWen]: soongPerson(SOONG_IDS.chiangHsiaoWen, {
    name: '蒋孝文', surname: '蒋', firstname: '孝文', bYear: '1935', dYear: '1989'
  }),
  [SOONG_IDS.chiangHsiaoChang]: soongPerson(SOONG_IDS.chiangHsiaoChang, {
    name: '蒋孝章', surname: '蒋', firstname: '孝章', gender: 'female', bYear: '1937', isLiving: true
  }),
  [SOONG_IDS.chiangHsiaoWu]: soongPerson(SOONG_IDS.chiangHsiaoWu, {
    name: '蒋孝武', surname: '蒋', firstname: '孝武', bYear: '1945', dYear: '1991'
  }),
  [SOONG_IDS.chiangHsiaoYung]: soongPerson(SOONG_IDS.chiangHsiaoYung, {
    name: '蒋孝勇', surname: '蒋', firstname: '孝勇', bYear: '1948', dYear: '1996', children: [SOONG_IDS.chiangYoubo]
  }),
  [SOONG_IDS.chiangHsiaoYen]: soongPerson(SOONG_IDS.chiangHsiaoYen, {
    name: '蒋孝严', surname: '蒋', firstname: '孝严', bYear: '1942', isLiving: true, children: [SOONG_IDS.wayneChiang]
  }),
  [SOONG_IDS.chiangHsiaoTzu]: soongPerson(SOONG_IDS.chiangHsiaoTzu, {
    name: '蒋孝慈', surname: '蒋', firstname: '孝慈', bYear: '1942', dYear: '1996'
  }),
  [SOONG_IDS.chiangHsiaoKang]: soongPerson(SOONG_IDS.chiangHsiaoKang, {
    name: '蒋孝刚', surname: '蒋', firstname: '孝刚', bYear: '1962', isLiving: true
  }),
  [SOONG_IDS.chiangYoubo]: soongPerson(SOONG_IDS.chiangYoubo, {
    name: '蒋友柏', surname: '蒋', firstname: '友柏', bYear: '1976', isLiving: true
  }),
  [SOONG_IDS.wayneChiang]: soongPerson(SOONG_IDS.wayneChiang, {
    name: '蒋万安', surname: '蒋', firstname: '万安', bYear: '1978', isLiving: true
  }),
  [SOONG_IDS.ziwenWife]: soongPerson(SOONG_IDS.ziwenWife, {
    name: '张乐怡', surname: '张', firstname: '乐怡', gender: 'female', bYear: '1907', dYear: '1988', spouses: [SOONG_IDS.ziwen]
  }),
  [SOONG_IDS.ziwenQiongyi]: soongPerson(SOONG_IDS.ziwenQiongyi, {
    name: '宋琼颐', surname: '宋', firstname: '琼颐', gender: 'female', motherId: SOONG_IDS.ziwenWife, spouses: [SOONG_IDS.fengYanda], children: [SOONG_IDS.fengYinghan, SOONG_IDS.fengYingxiang]
  }),
  [SOONG_IDS.ziwenManyi]: soongPerson(SOONG_IDS.ziwenManyi, {
    name: '宋曼颐', surname: '宋', firstname: '曼颐', gender: 'female', motherId: SOONG_IDS.ziwenWife
  }),
  [SOONG_IDS.ziwenRuiyi]: soongPerson(SOONG_IDS.ziwenRuiyi, {
    name: '宋瑞颐', surname: '宋', firstname: '瑞颐', gender: 'female', motherId: SOONG_IDS.ziwenWife
  }),
  [SOONG_IDS.fengYanda]: soongPerson(SOONG_IDS.fengYanda, {
    name: '冯彦达', surname: '冯', firstname: '彦达', gender: 'male', spouses: [SOONG_IDS.ziwenQiongyi], children: [SOONG_IDS.fengYinghan, SOONG_IDS.fengYingxiang]
  }),
  [SOONG_IDS.fengYinghan]: soongPerson(SOONG_IDS.fengYinghan, {
    name: '冯英翰', surname: '冯', firstname: '英翰', motherId: SOONG_IDS.ziwenQiongyi
  }),
  [SOONG_IDS.fengYingxiang]: soongPerson(SOONG_IDS.fengYingxiang, {
    name: '冯英祥', surname: '冯', firstname: '英祥', motherId: SOONG_IDS.ziwenQiongyi, children: [SOONG_IDS.fengYongjian]
  }),
  [SOONG_IDS.fengYongjian]: soongPerson(SOONG_IDS.fengYongjian, {
    name: '冯永健', surname: '冯', firstname: '永健'
  }),
  [SOONG_IDS.ziliangWife]: soongPerson(SOONG_IDS.ziliangWife, {
    name: '席曼英', surname: '席', firstname: '曼英', gender: 'female', bYear: '1915', dYear: '1994', spouses: [SOONG_IDS.ziliang]
  }),
  [SOONG_IDS.ziliangQingyi]: soongPerson(SOONG_IDS.ziliangQingyi, {
    name: '宋庆颐', surname: '宋', firstname: '庆颐', gender: 'female', bYear: '1943', dYear: '1991', motherId: SOONG_IDS.ziliangWife
  }),
  [SOONG_IDS.zianWife]: soongPerson(SOONG_IDS.zianWife, {
    name: '吴其英', surname: '吴', firstname: '其英', gender: 'female', spouses: [SOONG_IDS.zian]
  }),
  [SOONG_IDS.zianBoxiong]: soongPerson(SOONG_IDS.zianBoxiong, {
    name: '宋伯熊', surname: '宋', firstname: '伯熊', motherId: SOONG_IDS.zianWife
  }),
  [SOONG_IDS.zianZhonghu]: soongPerson(SOONG_IDS.zianZhonghu, {
    name: '宋仲虎', surname: '宋', firstname: '仲虎', motherId: SOONG_IDS.zianWife, children: [SOONG_IDS.zianYuanxiao]
  }),
  [SOONG_IDS.zianYuanxiao]: soongPerson(SOONG_IDS.zianYuanxiao, {
    name: '宋元孝', surname: '宋', firstname: '元孝'
  })
};

const soongTimelineEvents = [
  { id: 'soong_xinhai', name: '辛亥', year: '1911', workspaceId: SOONG_FAMILY_WORKSPACE_ID },
  { id: 'soong_northern_expedition', name: '北伐', year: '1927', workspaceId: SOONG_FAMILY_WORKSPACE_ID },
  { id: 'soong_1949', name: '1949', year: '1949', workspaceId: SOONG_FAMILY_WORKSPACE_ID }
];


const people = {
  [IDS.gaozu]: person(IDS.gaozu, {
    name: '唐高祖 李渊',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '渊',
    bYear: '566',
    dYear: '635',
    children: [IDS.jiancheng, IDS.taizong, IDS.yuanji],
    events: [reignEvent('tang_emperor_gaozu', '618-626')]
  }),
  [IDS.jiancheng]: person(IDS.jiancheng, {
    name: '隐太子 李建成',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '建成',
    rank: '一',
    bYear: '589',
    dYear: '626',
    events: [crownPrinceEvent('tang_crown_prince_jiancheng', '618-626')]
  }),
  [IDS.yuanji]: person(IDS.yuanji, {
    name: '巢剌王 李元吉',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '元吉',
    rank: '四',
    bYear: '603',
    dYear: '626'
  }),
  [IDS.taizong]: person(IDS.taizong, {
    name: '唐太宗 李世民',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '世民',
    rank: '二',
    bYear: '598',
    dYear: '649',
    children: [IDS.chengqian, IDS.gaozong],
    spouses: [IDS.empressZhangsun],
    events: [
      reignEvent('tang_emperor_taizong', '626-649'),
      crownPrinceEvent('tang_crown_prince_taizong', '626')
    ]
  }),
  [IDS.chengqian]: person(IDS.chengqian, {
    name: '废太子 李承乾',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '承乾',
    rank: '一',
    bYear: '619',
    dYear: '645',
    motherId: IDS.empressZhangsun,
    events: [crownPrinceEvent('tang_crown_prince_chengqian', '626-643')]
  }),
  [IDS.gaozong]: person(IDS.gaozong, {
    name: '唐高宗 李治',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '治',
    rank: '九',
    bYear: '628',
    dYear: '683',
    motherId: IDS.empressZhangsun,
    children: [IDS.lizhong, IDS.lihong, IDS.lixianZhanghuai, IDS.zhongzong, IDS.ruizong, IDS.taipingPrincess],
    spouses: [IDS.wuZetian],
    events: [
      reignEvent('tang_emperor_gaozong', '649-683'),
      crownPrinceEvent('tang_crown_prince_gaozong', '643-649')
    ]
  }),
  [IDS.lizhong]: person(IDS.lizhong, {
    name: '燕王 李忠',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '忠',
    rank: '一',
    bYear: '643',
    dYear: '665',
    events: [crownPrinceEvent('tang_crown_prince_lizhong', '652-656')]
  }),
  [IDS.lihong]: person(IDS.lihong, {
    name: '孝敬皇帝 李弘',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '弘',
    rank: '五',
    bYear: '652',
    dYear: '675',
    motherId: IDS.wuZetian,
    events: [crownPrinceEvent('tang_crown_prince_lihong', '656-675')]
  }),
  [IDS.lixianZhanghuai]: person(IDS.lixianZhanghuai, {
    name: '章怀太子 李贤',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '贤',
    rank: '六',
    bYear: '655',
    dYear: '684',
    motherId: IDS.wuZetian,
    events: [crownPrinceEvent('tang_crown_prince_lixian_zhanghuai', '675-680')]
  }),
  [IDS.zhongzong]: person(IDS.zhongzong, {
    name: '唐中宗 李显',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '显',
    rank: '七',
    bYear: '656',
    dYear: '710',
    motherId: IDS.wuZetian,
    children: [IDS.chongjun, IDS.anlePrincess, IDS.shangdi],
    spouses: [IDS.empressWei],
    events: [
      reignEvent('tang_emperor_zhongzong', '684, 705-710'),
      crownPrinceEvent('tang_crown_prince_zhongzong', '680-683')
    ]
  }),
  [IDS.chongjun]: person(IDS.chongjun, {
    name: '节愍太子 李重俊',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '重俊',
    rank: '三',
    bYear: '682',
    dYear: '707',
    events: [crownPrinceEvent('tang_crown_prince_chongjun', '706-707')]
  }),
  [IDS.anlePrincess]: person(IDS.anlePrincess, {
    name: '安乐公主 李裹儿',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '裹儿',
    gender: 'female',
    bYear: '684',
    dYear: '710',
    motherId: IDS.empressWei
  }),
  [IDS.shangdi]: person(IDS.shangdi, {
    name: '唐殇帝 李重茂',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '重茂',
    rank: '四',
    bYear: '695',
    dYear: '714',
    events: [reignEvent('tang_emperor_shangdi', '710')]
  }),
  [IDS.ruizong]: person(IDS.ruizong, {
    name: '唐睿宗 李旦',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '旦',
    rank: '八',
    bYear: '662',
    dYear: '716',
    motherId: IDS.wuZetian,
    children: [IDS.lichengqi, IDS.xuanzong],
    events: [reignEvent('tang_emperor_ruizong', '684-690, 710-712')]
  }),
  [IDS.taipingPrincess]: person(IDS.taipingPrincess, {
    name: '太平公主',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '',
    gender: 'female',
    bYear: '665',
    dYear: '713',
    motherId: IDS.wuZetian
  }),
  [IDS.lichengqi]: person(IDS.lichengqi, {
    name: '让皇帝 李宪',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '宪',
    rank: '一',
    bYear: '679',
    dYear: '742',
    events: [crownPrinceEvent('tang_crown_prince_lichengqi', '684-690')]
  }),
  [IDS.xuanzong]: person(IDS.xuanzong, {
    name: '唐玄宗 李隆基',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '隆基',
    rank: '三',
    bYear: '685',
    dYear: '762',
    children: [IDS.liying, IDS.suzong],
    spouses: [IDS.yangGuifei],
    events: [
      reignEvent('tang_emperor_xuanzong', '712-756'),
      crownPrinceEvent('tang_crown_prince_xuanzong', '710-712')
    ]
  }),
  [IDS.liying]: person(IDS.liying, {
    name: '废太子 李瑛',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '瑛',
    rank: '二',
    bYear: '706',
    dYear: '737',
    events: [crownPrinceEvent('tang_crown_prince_liying', '715-737')]
  }),
  [IDS.suzong]: person(IDS.suzong, {
    name: '唐肃宗 李亨',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '亨',
    rank: '三',
    bYear: '711',
    dYear: '762',
    children: [IDS.daizong],
    spouses: [IDS.empressZhang],
    events: [
      reignEvent('tang_emperor_suzong', '756-762'),
      crownPrinceEvent('tang_crown_prince_suzong', '738-756')
    ]
  }),
  [IDS.daizong]: person(IDS.daizong, {
    name: '唐代宗 李豫',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '豫',
    rank: '一',
    bYear: '727',
    dYear: '779',
    children: [IDS.dezong],
    events: [
      reignEvent('tang_emperor_daizong', '762-779'),
      crownPrinceEvent('tang_crown_prince_daizong', '758-762')
    ]
  }),
  [IDS.dezong]: person(IDS.dezong, {
    name: '唐德宗 李适',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '适',
    rank: '一',
    bYear: '742',
    dYear: '805',
    children: [IDS.shunzong],
    events: [
      reignEvent('tang_emperor_dezong', '779-805'),
      crownPrinceEvent('tang_crown_prince_dezong', '764-779')
    ]
  }),
  [IDS.shunzong]: person(IDS.shunzong, {
    name: '唐顺宗 李诵',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '诵',
    rank: '一',
    bYear: '761',
    dYear: '806',
    children: [IDS.xianzong],
    events: [
      reignEvent('tang_emperor_shunzong', '805'),
      crownPrinceEvent('tang_crown_prince_shunzong', '779-805')
    ]
  }),
  [IDS.xianzong]: person(IDS.xianzong, {
    name: '唐宪宗 李纯',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '纯',
    rank: '一',
    bYear: '778',
    dYear: '820',
    children: [IDS.lining, IDS.muzong, IDS.xuanzongLiChen],
    events: [
      reignEvent('tang_emperor_xianzong', '805-820'),
      crownPrinceEvent('tang_crown_prince_xianzong', '805')
    ]
  }),
  [IDS.lining]: person(IDS.lining, {
    name: '惠昭太子 李宁',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '宁',
    rank: '一',
    bYear: '793',
    dYear: '812',
    events: [crownPrinceEvent('tang_crown_prince_lining', '809-811')]
  }),
  [IDS.muzong]: person(IDS.muzong, {
    name: '唐穆宗 李恒',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '恒',
    rank: '三',
    bYear: '795',
    dYear: '824',
    children: [IDS.jingzong, IDS.wenzong, IDS.wuzong],
    events: [
      reignEvent('tang_emperor_muzong', '820-824'),
      crownPrinceEvent('tang_crown_prince_muzong', '812-820')
    ]
  }),
  [IDS.jingzong]: person(IDS.jingzong, {
    name: '唐敬宗 李湛',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '湛',
    rank: '一',
    bYear: '809',
    dYear: '827',
    children: [IDS.chengmei],
    events: [
      reignEvent('tang_emperor_jingzong', '824-827'),
      crownPrinceEvent('tang_crown_prince_jingzong', '823-824')
    ]
  }),
  [IDS.chengmei]: person(IDS.chengmei, {
    name: '陈王 李成美',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '成美',
    rank: '六',
    bYear: '825',
    dYear: '840',
    events: [crownPrinceEvent('tang_crown_prince_chengmei', '839-840')]
  }),
  [IDS.wenzong]: person(IDS.wenzong, {
    name: '唐文宗 李昂',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '昂',
    rank: '二',
    bYear: '809',
    dYear: '840',
    children: [IDS.liyong],
    events: [reignEvent('tang_emperor_wenzong', '827-840')]
  }),
  [IDS.liyong]: person(IDS.liyong, {
    name: '庄恪太子 李永',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '永',
    rank: '一',
    bYear: '826',
    dYear: '838',
    events: [crownPrinceEvent('tang_crown_prince_liyong', '832-838')]
  }),
  [IDS.wuzong]: person(IDS.wuzong, {
    name: '唐武宗 李炎',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '炎',
    rank: '五',
    bYear: '814',
    dYear: '846',
    events: [reignEvent('tang_emperor_wuzong', '840-846')]
  }),
  [IDS.xuanzongLiChen]: person(IDS.xuanzongLiChen, {
    name: '唐宣宗 李忱',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '忱',
    rank: '十三',
    bYear: '810',
    dYear: '859',
    children: [IDS.yizong],
    events: [reignEvent('tang_emperor_xuanzong_lichen', '846-859')]
  }),
  [IDS.yizong]: person(IDS.yizong, {
    name: '唐懿宗 李漼',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '漼',
    rank: '一',
    bYear: '833',
    dYear: '873',
    children: [IDS.xizong, IDS.zhaozong],
    events: [
      reignEvent('tang_emperor_yizong', '859-873'),
      crownPrinceEvent('tang_crown_prince_yizong', '859')
    ]
  }),
  [IDS.xizong]: person(IDS.xizong, {
    name: '唐僖宗 李儇',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '儇',
    rank: '五',
    bYear: '862',
    dYear: '888',
    events: [
      reignEvent('tang_emperor_xizong', '873-888'),
      crownPrinceEvent('tang_crown_prince_xizong', '873')
    ]
  }),
  [IDS.zhaozong]: person(IDS.zhaozong, {
    name: '唐昭宗 李晔',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '晔',
    rank: '七',
    bYear: '867',
    dYear: '904',
    children: [IDS.aidi],
    events: [
      reignEvent('tang_emperor_zhaozong', '888-904'),
      crownPrinceEvent('tang_crown_prince_zhaozong', '888')
    ]
  }),
  [IDS.aidi]: person(IDS.aidi, {
    name: '唐哀帝 李柷',
    hometown: '陇西狄道',
    surname: '李',
    firstname: '柷',
    rank: '九',
    bYear: '892',
    dYear: '908',
    events: [
      reignEvent('tang_emperor_aidi', '904-907'),
      crownPrinceEvent('tang_crown_prince_aidi', '904')
    ]
  }),
  [IDS.wuZetian]: person(IDS.wuZetian, {
    name: '(周)则天皇帝 武曌',
    hometown: '太原文水',
    surname: '武',
    firstname: '曌',
    gender: 'female',
    bYear: '624',
    dYear: '705',
    spouses: [IDS.gaozong],
    events: [
      eventWithYear('tang_empress_wuzetian', '皇后', '655-683'),
      reignEvent('tang_emperor_wuzetian', '690-705')
    ]
  }),
  [IDS.empressZhangsun]: person(IDS.empressZhangsun, {
    name: '(唐)文德皇后 长孙氏',
    hometown: '河南洛阳',
    surname: '长孙',
    gender: 'female',
    bYear: '601',
    dYear: '636',
    spouses: [IDS.taizong],
    events: [eventWithYear('tang_empress_zhangsun', '皇后', '626-636')]
  }),
  [IDS.empressWei]: person(IDS.empressWei, {
    name: '(唐)皇后 韦氏',
    hometown: '京兆万年',
    surname: '韦',
    gender: 'female',
    dYear: '710',
    spouses: [IDS.zhongzong],
    events: [eventWithYear('tang_empress_wei', '皇后', '684, 705-710')]
  }),
  [IDS.yangGuifei]: person(IDS.yangGuifei, {
    name: '(唐)贵妃 杨玉环',
    hometown: '河东永乐',
    surname: '杨',
    firstname: '玉环',
    gender: 'female',
    bYear: '719',
    dYear: '756',
    spouses: [IDS.xuanzong],
    events: [eventWithYear('tang_guifei_yang_yuhuan', '贵妃', '745-756')]
  }),
  [IDS.empressZhang]: person(IDS.empressZhang, {
    name: '(唐)皇后 张氏',
    hometown: '南阳向城',
    surname: '张',
    gender: 'female',
    dYear: '762',
    spouses: [IDS.suzong],
    events: [eventWithYear('tang_empress_zhang', '皇后', '758-762')]
  })
};

const timelineEvents = [
  {
    id: 'evt_sui_dynasty',
    name: '隋朝',
    year: '581-618',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  },
  {
    id: 'evt_tang_shenlong',
    name: '神龙革命',
    year: '705',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  },
  {
    id: 'evt_tang_anshi',
    name: '安史之乱',
    year: '755-763',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  },
  {
    id: 'evt_tang_buddha_relic',
    name: '迎佛骨',
    year: '819',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  },
  {
    id: 'evt_tang_ganlu',
    name: '甘露之变',
    year: '835',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  },
  {
    id: 'evt_tang_wuzong_buddhism',
    name: '武宗灭佛',
    year: '842-845',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  },
  {
    id: 'evt_tang_huang_chao',
    name: '黄巢起义',
    year: '875-884',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  },
  {
    id: 'evt_later_liang',
    name: '后梁',
    year: '907-923',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID
  }
];

const DUGU_IDS = {
  duguXin: DUGU_XIN_ROOT_ID,
  duguLuo: `${DUGU_XIN_ROOT_ID}A`,
  mingjing: `${DUGU_XIN_ROOT_ID}B`,
  yuanzhen: `${DUGU_XIN_ROOT_ID}C`,
  jialuo: `${DUGU_XIN_ROOT_ID}D`,
  yuwenTai: 'dug_ywt_001-',
  yuwenYu: 'dug_ywt_001-A',
  yuwenYong: 'dug_ywt_001-B',
  yuwenYun: 'dug_ywt_001-BA',
  yuwenChan: 'dug_ywt_001-BAA',
  yuwenEying: 'dug_ywt_001-BAB',
  yangJian: 'dug_yji_001-',
  yangLihua: 'dug_yji_001-A',
  yangYong: 'dug_yji_001-B',
  yangGuang: 'dug_yji_001-C',
  liXian: 'dug_lix_001-',
  liChong: 'dug_lix_001-A',
  liMin: 'dug_lix_001-AA',
  liJingxun: 'dug_lix_001-AAA',
  liBing: 'dug_lib_001-',
  liYuan: 'dug_lib_001-A',
  liJiancheng: 'dug_lib_001-AA',
  liShimin: 'dug_lib_001-AB'
};

function duguPerson(id, data) {
  return personInWorkspace(id, DUGU_XIN_WORKSPACE_ID, data);
}

const duguPeople = {
  [DUGU_IDS.duguXin]: duguPerson(DUGU_IDS.duguXin, {
    name: '河内戾公 独孤信',
    hometown: '河南洛阳',
    surname: '独孤',
    firstname: '信',
    bYear: '504',
    dYear: '557',
    children: [DUGU_IDS.duguLuo, DUGU_IDS.mingjing, DUGU_IDS.yuanzhen, DUGU_IDS.jialuo],
    events: [eventWithYear('dugu_pillar_general', '八柱国', '550-557')]
  }),
  [DUGU_IDS.duguLuo]: duguPerson(DUGU_IDS.duguLuo, {
    name: '独孤罗',
    hometown: '河南洛阳',
    surname: '独孤',
    firstname: '罗',
    rank: '一',
    bYear: '535',
    dYear: '599'
  }),
  [DUGU_IDS.mingjing]: duguPerson(DUGU_IDS.mingjing, {
    name: '(周)明敬皇后 独孤氏',
    hometown: '河南洛阳',
    surname: '独孤',
    gender: 'female',
    rank: '一',
    dYear: '558',
    spouses: [DUGU_IDS.yuwenYu]
  }),
  [DUGU_IDS.yuwenTai]: duguPerson(DUGU_IDS.yuwenTai, {
    name: '周文帝 宇文泰',
    hometown: '代郡武川',
    surname: '宇文',
    firstname: '泰',
    bYear: '507',
    dYear: '556',
    children: [DUGU_IDS.yuwenYu, DUGU_IDS.yuwenYong]
  }),
  [DUGU_IDS.yuwenYu]: duguPerson(DUGU_IDS.yuwenYu, {
    name: '周明帝 宇文毓',
    hometown: '代郡武川',
    surname: '宇文',
    firstname: '毓',
    rank: '一',
    bYear: '534',
    dYear: '560',
    spouses: [DUGU_IDS.mingjing],
    events: [reignEvent('zhou_mingdi_reign', '557-560')]
  }),
  [DUGU_IDS.yuwenYong]: duguPerson(DUGU_IDS.yuwenYong, {
    name: '周武帝 宇文邕',
    hometown: '代郡武川',
    surname: '宇文',
    firstname: '邕',
    rank: '四',
    bYear: '543',
    dYear: '578',
    children: [DUGU_IDS.yuwenYun],
    events: [reignEvent('zhou_wudi_reign', '560-578')]
  }),
  [DUGU_IDS.yuwenYun]: duguPerson(DUGU_IDS.yuwenYun, {
    name: '周宣帝 宇文赟',
    hometown: '代郡武川',
    surname: '宇文',
    firstname: '赟',
    rank: '一',
    bYear: '559',
    dYear: '580',
    spouses: [DUGU_IDS.yangLihua],
    children: [DUGU_IDS.yuwenChan, DUGU_IDS.yuwenEying],
    events: [reignEvent('zhou_xuandi_reign', '578-579')]
  }),
  [DUGU_IDS.yuwenChan]: duguPerson(DUGU_IDS.yuwenChan, {
    name: '周静帝 宇文阐',
    hometown: '代郡武川',
    surname: '宇文',
    firstname: '阐',
    rank: '一',
    bYear: '573',
    dYear: '581',
    events: [reignEvent('zhou_jingdi_reign', '579-581')]
  }),
  [DUGU_IDS.yuwenEying]: duguPerson(DUGU_IDS.yuwenEying, {
    name: '宇文娥英',
    hometown: '代郡武川',
    surname: '宇文',
    firstname: '娥英',
    gender: 'female',
    rank: '二',
    bYear: '578',
    dYear: '615',
    spouses: [DUGU_IDS.liMin],
    motherId: DUGU_IDS.yangLihua
  }),
  [DUGU_IDS.yuanzhen]: duguPerson(DUGU_IDS.yuanzhen, {
    name: '(唐)元贞皇后 独孤氏',
    hometown: '河南洛阳',
    surname: '独孤',
    gender: 'female',
    rank: '四',
    spouses: [DUGU_IDS.liBing]
  }),
  [DUGU_IDS.liBing]: duguPerson(DUGU_IDS.liBing, {
    name: '唐世祖 李昞',
    hometown: '陇西成纪',
    surname: '李',
    firstname: '昞',
    dYear: '572',
    spouses: [DUGU_IDS.yuanzhen],
    children: [DUGU_IDS.liYuan]
  }),
  [DUGU_IDS.liYuan]: duguPerson(DUGU_IDS.liYuan, {
    name: '唐高祖 李渊',
    hometown: '陇西成纪',
    surname: '李',
    firstname: '渊',
    bYear: '566',
    dYear: '635',
    motherId: DUGU_IDS.yuanzhen,
    children: [DUGU_IDS.liJiancheng, DUGU_IDS.liShimin],
    events: [reignEvent('dugu_tang_gaozu_reign', '618-626')]
  }),
  [DUGU_IDS.liJiancheng]: duguPerson(DUGU_IDS.liJiancheng, {
    name: '隐太子 李建成',
    hometown: '陇西成纪',
    surname: '李',
    firstname: '建成',
    rank: '一',
    bYear: '589',
    dYear: '626',
    events: [crownPrinceEvent('dugu_li_jiancheng_crown_prince', '618-626')]
  }),
  [DUGU_IDS.liShimin]: duguPerson(DUGU_IDS.liShimin, {
    name: '唐太宗 李世民',
    hometown: '陇西成纪',
    surname: '李',
    firstname: '世民',
    rank: '二',
    bYear: '598',
    dYear: '649',
    events: [
      reignEvent('dugu_tang_taizong_reign', '626-649'),
      crownPrinceEvent('dugu_li_shimin_crown_prince', '626')
    ]
  }),
  [DUGU_IDS.jialuo]: duguPerson(DUGU_IDS.jialuo, {
    name: '(隋)文献皇后 独孤伽罗',
    hometown: '河南洛阳',
    surname: '独孤',
    firstname: '伽罗',
    gender: 'female',
    rank: '七',
    bYear: '544',
    dYear: '602',
    spouses: [DUGU_IDS.yangJian]
  }),
  [DUGU_IDS.yangJian]: duguPerson(DUGU_IDS.yangJian, {
    name: '隋文帝 杨坚',
    hometown: '弘农华阴',
    surname: '杨',
    firstname: '坚',
    bYear: '541',
    dYear: '604',
    spouses: [DUGU_IDS.jialuo],
    children: [DUGU_IDS.yangLihua, DUGU_IDS.yangYong, DUGU_IDS.yangGuang],
    events: [reignEvent('sui_wendi_reign', '581-604')]
  }),
  [DUGU_IDS.yangLihua]: duguPerson(DUGU_IDS.yangLihua, {
    name: '(周)皇后 杨丽华',
    hometown: '弘农华阴',
    surname: '杨',
    firstname: '丽华',
    gender: 'female',
    rank: '一',
    bYear: '561',
    dYear: '609',
    spouses: [DUGU_IDS.yuwenYun],
    motherId: DUGU_IDS.jialuo
  }),
  [DUGU_IDS.liXian]: duguPerson(DUGU_IDS.liXian, {
    name: '北周大将军 李贤',
    hometown: '陇西成纪',
    surname: '李',
    firstname: '贤',
    bYear: '502',
    dYear: '569',
    children: [DUGU_IDS.liChong]
  }),
  [DUGU_IDS.liChong]: duguPerson(DUGU_IDS.liChong, {
    name: '幽州总管 李崇',
    hometown: '陇西成纪',
    surname: '李',
    firstname: '崇',
    rank: '一',
    bYear: '536',
    dYear: '583',
    children: [DUGU_IDS.liMin]
  }),
  [DUGU_IDS.liMin]: duguPerson(DUGU_IDS.liMin, {
    hometown: '陇西成纪',
    surname: '李',
    firstname: '敏',
    rank: '一',
    bYear: '576',
    dYear: '615',
    spouses: [DUGU_IDS.yuwenEying],
    children: [DUGU_IDS.liJingxun]
  }),
  [DUGU_IDS.liJingxun]: duguPerson(DUGU_IDS.liJingxun, {
    name: '李静训',
    hometown: '陇西成纪',
    surname: '李',
    firstname: '静训',
    gender: 'female',
    rank: '四',
    bYear: '600',
    dYear: '608',
    motherId: DUGU_IDS.yuwenEying
  }),
  [DUGU_IDS.yangYong]: duguPerson(DUGU_IDS.yangYong, {
    name: '房陵王 杨勇',
    hometown: '弘农华阴',
    surname: '杨',
    firstname: '勇',
    rank: '一',
    bYear: '562',
    dYear: '604',
    motherId: DUGU_IDS.jialuo,
    events: [crownPrinceEvent('yang_yong_crown_prince', '581-600')]
  }),
  [DUGU_IDS.yangGuang]: duguPerson(DUGU_IDS.yangGuang, {
    name: '隋炀帝 杨广',
    hometown: '弘农华阴',
    surname: '杨',
    firstname: '广',
    rank: '二',
    bYear: '569',
    dYear: '618',
    motherId: DUGU_IDS.jialuo,
    events: [reignEvent('sui_yangdi_reign', '604-618')]
  })
};

const duguTimelineEvents = [
  {
    id: 'evt_dugu_western_wei',
    name: '西魏',
    year: '535-557',
    workspaceId: DUGU_XIN_WORKSPACE_ID
  },
  {
    id: 'evt_dugu_northern_zhou',
    name: '北周',
    year: '557-581',
    workspaceId: DUGU_XIN_WORKSPACE_ID
  },
  {
    id: 'evt_dugu_sui',
    name: '隋朝',
    year: '581-618',
    workspaceId: DUGU_XIN_WORKSPACE_ID
  }
];

function createTangImperialWorkspace() {
  return deepClone({
    activeRootId: TANG_IMPERIAL_ROOT_ID,
    people,
    timelineEvents
  });
}

function createDuguXinWorkspace() {
  return deepClone({
    activeRootId: DUGU_XIN_ROOT_ID,
    people: duguPeople,
    timelineEvents: duguTimelineEvents
  });
}

function createSoongFamilyWorkspace() {
  return deepClone({
    activeRootId: SOONG_FAMILY_ROOT_ID,
    people: soongPeople,
    timelineEvents: soongTimelineEvents
  });
}

const BUNDLED_SAMPLES = [
  {
    key: 'tangImperial',
    label: '唐室示例',
    workspaceId: TANG_IMPERIAL_WORKSPACE_ID,
    rootId: TANG_IMPERIAL_ROOT_ID,
    version: TANG_IMPERIAL_SAMPLE_VERSION,
    createWorkspace: createTangImperialWorkspace
  },
  {
    key: 'duguXin',
    label: '独孤信示例',
    workspaceId: DUGU_XIN_WORKSPACE_ID,
    rootId: DUGU_XIN_ROOT_ID,
    version: DUGU_XIN_SAMPLE_VERSION,
    createWorkspace: createDuguXinWorkspace,
    viewOptions: { showMaternal: true }
  },
  {
    key: 'soongFamily',
    label: '宋氏家族示例',
    workspaceId: SOONG_FAMILY_WORKSPACE_ID,
    rootId: SOONG_FAMILY_ROOT_ID,
    version: SOONG_FAMILY_SAMPLE_VERSION,
    createWorkspace: createSoongFamilyWorkspace,
    viewOptions: { showSpouses: true, showMaternal: true, showTimeline: true }
  }
];

module.exports = {
  TANG_IMPERIAL_WORKSPACE_ID,
  TANG_IMPERIAL_ROOT_ID,
  TANG_IMPERIAL_SAMPLE_VERSION,
  DUGU_XIN_WORKSPACE_ID,
  DUGU_XIN_ROOT_ID,
  DUGU_XIN_SAMPLE_VERSION,
  SOONG_FAMILY_WORKSPACE_ID,
  SOONG_FAMILY_ROOT_ID,
  SOONG_FAMILY_SAMPLE_VERSION,
  BUNDLED_SAMPLES,
  createTangImperialWorkspace,
  createDuguXinWorkspace,
  createSoongFamilyWorkspace
};
