const tangImperialSample = require('./samples/tang-imperial.json');
const duguXinSample = require('./samples/dugu-xin.json');
const soongFamilySample = require('./samples/soong-family.json');

const TANG_IMPERIAL_WORKSPACE_ID = 'sample_tang_imperial';
const TANG_IMPERIAL_ROOT_ID = 'tan_imp_001-';
const TANG_IMPERIAL_SAMPLE_VERSION = '20';
const DUGU_XIN_WORKSPACE_ID = 'sample_dugu_xin';
const DUGU_XIN_ROOT_ID = 'dug_xin_001-';
const DUGU_XIN_SAMPLE_VERSION = '17';
const SOONG_FAMILY_WORKSPACE_ID = 'sample_soong_family';
const SOONG_FAMILY_ROOT_ID = 'soo_jia_001-';
const SOONG_FAMILY_SAMPLE_VERSION = '9';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createTangImperialWorkspace() {
  return deepClone(tangImperialSample);
}

function createDuguXinWorkspace() {
  return deepClone(duguXinSample);
}

function createSoongFamilyWorkspace() {
  return deepClone(soongFamilySample);
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
