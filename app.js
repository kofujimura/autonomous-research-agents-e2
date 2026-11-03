'use strict';

// ---- Definitions (fixed before any rater reads a paper) ----

const FORM_ID = 'autonomous-research-agents-e2';
const FORM_VERSION = '1.0';
const STORAGE_KEY = 'ara-e2-v1';

const PAPERS = [
  { id: 'run-014', pages: 35, title: 'Screening one-year tree-cover transitions in CONUS with annual satellite embeddings' },
  { id: 'run-015', pages: 20, title: 'Spatial temperature-exceedance probabilities from ensemble summaries: an empirical partial-identification study' },
  { id: 'run-016', pages: 21, title: 'Revisiting reference locations for changes in Swiss declared crop-group diversity: a resampling benchmark' },
  { id: 'run-017', pages: 21, title: 'Training Point Allocation and Recovery of Small Wetland Patches from Satellite Embeddings' },
  { id: 'run-018', pages: 36, title: 'Do annual satellite embedding distances improve matching of wetland inventory water regimes?' },
];

// The six axes and their definitions follow the E1 reviewer prompt (e1-eval/prompt-pdf.md).
const SCORE_DEFS = [
  ['correctness', '正しさ（correctness）', '主な主張は、論文が報告する証拠に支えられているか。分析と解釈は妥当か。'],
  ['verifiability', '検証可能性（verifiability）', '論文の記述から、他の人が結果を確かめたり再現したりできるか（データ、コード、手順、記録、報告されている詳細）。'],
  ['novelty', '新規性（novelty）', '先行研究に対して新しい貢献か。新規性の主張は適切か。論文が触れていない近い先行研究があれば、理由の欄に挙げてください。'],
  ['generality', '一般性（generality）', '調べた対象を超えて成り立つか。調べた対象は、主張の範囲を代表しているか。'],
  ['usefulness', '有用性（usefulness）', '読者にとって役立つか。その問題に取り組む研究者や実務者の理解や判断を変えるか。'],
  ['clarity', 'わかりやすさ（clarity）', '背景と重要性の説明、用語の使い方、要旨と本文が探索的な結果で過密になっていないか、を含めて。'],
];

const YES_BORDER_NO = [['yes', 'はい'], ['borderline', '境界'], ['no', 'いいえ']];

const SECTIONS = [
  {
    title: '読む前に',
    note: '論文を読み始める前にお答えください。',
    fields: [
      { key: 'expertise', type: 'scale', min: 1, max: 5, required: true,
        label: 'この論文の分野についての、ご自身の専門性',
        anchors: { 1: 'ほとんど知らない', 3: '関連分野の研究者', 5: 'この分野の専門家' } },
      { key: 'familiarity', type: 'choice', required: true,
        label: 'この論文そのものを、今回より前に読んだり見たりしたことがありますか',
        options: [['no', 'ない'], ['yes', 'ある']] },
      { key: 'familiarity_note', type: 'text', label: '「ある」の場合、どこで見たか',
        showIf: (v) => v.familiarity === 'yes' },
    ],
  },
  {
    title: '6つの観点',
    note: '1〜5の5段階で、5が最良です。理由は1行程度で、任意です。',
    fields: SCORE_DEFS.map(([key, label, help]) => ({
      key, type: 'scale', min: 1, max: 5, required: true, label, help,
      anchors: { 1: '低い', 5: '高い' }, reason: key + '_reason',
    })),
  },
  {
    title: '総合評価',
    fields: [
      { key: 'verdict', type: 'choice', required: true, label: '判定',
        help: '査読者として、この論文をどう判定しますか。',
        options: [['accept', '採録', 'accept'], ['minor revision', '小修正', 'minor revision'],
          ['major revision', '大修正', 'major revision'], ['reject', '不採録', 'reject']] },
      { key: 'overall_10', type: 'scale', min: 1, max: 10, required: true, label: '総合点（ICLRの尺度）',
        help: 'その分野の有力な査読付きの会議・論文誌に出たフル論文として評価してください。',
        anchors: { 1: '強く不採録', 3: '不採録', 5: '基準をやや下回る', 6: '基準をやや上回る', 8: '採録', 10: '強く採録' } },
      { key: 'workshop_level', type: 'choice', required: true, label: 'ワークショップの水準',
        help: 'その分野の査読付きワークショップ（採択率 約70%）に採録されるか。', options: YES_BORDER_NO },
      { key: 'main_track_level', type: 'choice', required: true, label: '一流の会議の本会議の水準',
        help: 'その分野の一流の会議の本会議（採択率 約25〜30%）に採録されるか。', options: YES_BORDER_NO },
    ],
  },
  {
    title: '研究の問い',
    fields: [
      { key: 'rq_question', type: 'textarea', short: true, label: '論文の主な研究の問いを1文で' },
      { key: 'question_quality', type: 'scale', min: 1, max: 5, required: true, label: '問いの質',
        help: '実行の出来とは別に、問いそのものの重要さと鋭さ。', anchors: { 1: '低い', 5: '高い' } },
      { key: 'predictable', type: 'choice', required: true, label: '答えの予想しやすさ',
        help: '研究を行う前に、その設計、定義、データの作られ方から、主な答えがおおむね予想できたか。',
        options: [['yes', 'はい'], ['partly', '部分的に'], ['no', 'いいえ']] },
      { key: 'predictable_reason', type: 'text', label: 'その理由（1行程度）' },
    ],
  },
  {
    title: '問題点と長所',
    note: 'すべて任意です。1行に1件ずつ書いてください。',
    fields: [
      { key: 'summary', type: 'textarea', label: '論文の要約（数行）' },
      { key: 'issues_critical', type: 'textarea', label: '重大な問題（critical）',
        help: '最も重要な問題を、重大・中程度・軽微の3つの欄をあわせて8件まで。' },
      { key: 'issues_moderate', type: 'textarea', label: '中程度の問題（moderate）' },
      { key: 'issues_minor', type: 'textarea', label: '軽微な問題（minor）' },
      { key: 'strengths', type: 'textarea', label: '長所（4件まで）' },
      { key: 'closest_prior_work', type: 'textarea', label: '最も近い先行研究（5件まで）',
        help: '文献、URL（あれば）、この論文との違いを1件ずつ。' },
    ],
  },
  {
    title: '最後に',
    fields: [
      { key: 'figures_viewed', type: 'choice', required: true, label: '論文の図表を見ましたか',
        options: [['yes', '見た'], ['no', '見ていない']] },
      { key: 'time_minutes', type: 'number', label: 'この論文の評価にかかった時間（分、おおよそ）' },
      { key: 'comments', type: 'textarea', label: 'そのほかのコメント' },
    ],
  },
];

const FIELDS = SECTIONS.flatMap((s) => s.fields);
const REQUIRED = FIELDS.filter((f) => f.required);
const KNOWN_KEYS = new Set(FIELDS.flatMap((f) => (f.reason ? [f.key, f.reason] : [f.key])));

// ---- Pure functions ----

function normalizeId(raw) {
  return String(raw || '').normalize('NFKC').trim().toUpperCase();
}

function isValidId(id) {
  return /^[A-Z0-9_-]{1,16}$/.test(id);
}

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (const ch of s) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Reading order is a fixed function of the rater ID, so it can be recorded in advance.
function orderFor(id) {
  const rnd = mulberry32(hashStr('ara-e2|' + id));
  const a = PAPERS.map((p) => p.id);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isFilled(x) {
  return typeof x === 'string' && x.trim() !== '';
}

function missingFields(values) {
  return REQUIRED.filter((f) => !isFilled(values[f.key]));
}

function statusOf(values) {
  const v = values || {};
  const any = Object.keys(v).some((k) => isFilled(v[k]));
  if (!any) return 'none';
  return missingFields(v).length === 0 ? 'complete' : 'partial';
}

function toInt(x) {
  if (!isFilled(x)) return null;
  const n = Number(x);
  return Number.isInteger(n) ? n : null;
}

function toNum(x) {
  if (!isFilled(x)) return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function lines(x) {
  return isFilled(x) ? x.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
}

function buildExport(st, now) {
  const papers = {};
  st.order.forEach((pid, i) => {
    const r = st.responses[pid] || {};
    const v = r.values || {};
    papers[pid] = {
      position: i + 1,
      status: statusOf(v),
      started_at: r.started_at || null,
      updated_at: r.updated_at || null,
      // Same field names as the E1 schema (e1-eval/schema.json) where the item is shared.
      review: {
        summary: v.summary || '',
        scores: Object.fromEntries(SCORE_DEFS.map(([k]) => [k, toInt(v[k])])),
        score_reasons: Object.fromEntries(SCORE_DEFS.map(([k]) => [k, v[k + '_reason'] || ''])),
        verdict: v.verdict || null,
        overall_10: toInt(v.overall_10),
        workshop_level: v.workshop_level || null,
        main_track_level: v.main_track_level || null,
        research_question: {
          question: v.rq_question || '',
          question_quality: toInt(v.question_quality),
          predictable: v.predictable || null,
          predictable_reason: v.predictable_reason || '',
        },
        main_issues: [
          ...lines(v.issues_critical).map((issue) => ({ severity: 'critical', issue })),
          ...lines(v.issues_moderate).map((issue) => ({ severity: 'moderate', issue })),
          ...lines(v.issues_minor).map((issue) => ({ severity: 'minor', issue })),
        ],
        strengths: lines(v.strengths),
        closest_prior_work: v.closest_prior_work || '',
        familiarity: v.familiarity === 'yes' ? ('yes: ' + (v.familiarity_note || '')).trim() : v.familiarity || null,
        figures_viewed: v.figures_viewed === 'yes' ? true : v.figures_viewed === 'no' ? false : null,
      },
      rater: {
        expertise: toInt(v.expertise),
        time_minutes: toNum(v.time_minutes),
        comments: v.comments || '',
      },
      raw: { ...v },
    };
  });
  return {
    form: FORM_ID,
    form_version: FORM_VERSION,
    rater_id: st.raterId,
    exported_at: (now || new Date()).toISOString(),
    paper_order: st.order.slice(),
    complete: st.order.every((pid) => statusOf((st.responses[pid] || {}).values) === 'complete'),
    papers,
  };
}

// Returns {raterId, responses} or throws an Error with a message for the rater.
function parseImport(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    throw new Error('ファイルを読めませんでした（JSONではありません）。');
  }
  if (!obj || obj.form !== FORM_ID || typeof obj.papers !== 'object' || !obj.papers) {
    throw new Error('この評価用紙の回答ファイルではありません。');
  }
  const raterId = normalizeId(obj.rater_id);
  if (!isValidId(raterId)) throw new Error('ファイルの評価者IDが正しくありません。');
  const responses = {};
  for (const p of PAPERS) {
    const src = obj.papers[p.id];
    if (!src || typeof src.raw !== 'object' || !src.raw) continue;
    const values = {};
    for (const [k, val] of Object.entries(src.raw)) {
      if (KNOWN_KEYS.has(k) && typeof val === 'string') values[k] = val;
    }
    responses[p.id] = {
      values,
      started_at: typeof src.started_at === 'string' ? src.started_at : null,
      updated_at: typeof src.updated_at === 'string' ? src.updated_at : null,
    };
  }
  return { raterId, responses };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PAPERS, SECTIONS, FIELDS, REQUIRED, normalizeId, isValidId, orderFor, statusOf, missingFields, buildExport, parseImport };
}

// ---- Browser UI ----

if (typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);
  const paperById = Object.fromEntries(PAPERS.map((p) => [p.id, p]));
  const STATUS_LABEL = { none: '未着手', partial: '記入中', complete: '完了' };

  let storageOk = true;
  try {
    const t = '__ara_e2_test__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
  } catch (e) {
    storageOk = false;
  }

  const state = { raterId: null, order: [], responses: {}, current: null };

  function load() {
    if (!storageOk) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      const id = normalizeId(s.raterId);
      if (!isValidId(id)) return;
      state.raterId = id;
      state.order = orderFor(id);
      state.responses = s.responses && typeof s.responses === 'object' ? s.responses : {};
      state.current = state.order.includes(s.current) ? s.current : state.order[0];
    } catch (e) {
      /* start fresh */
    }
  }

  function save() {
    if (!storageOk) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        raterId: state.raterId, responses: state.responses, current: state.current,
      }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v === null || v === undefined) continue;
      if (k === 'text') n.textContent = v;
      else if (k === 'class') n.className = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(children || [])) {
      if (c === null || c === undefined || c === false) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  function valuesOf(pid) {
    if (!state.responses[pid]) state.responses[pid] = { values: {}, started_at: null, updated_at: null };
    if (!state.responses[pid].values) state.responses[pid].values = {};
    return state.responses[pid].values;
  }

  function hasAnyAnswer() {
    return PAPERS.some((p) => statusOf((state.responses[p.id] || {}).values) !== 'none');
  }

  function setMsg(node, text, kind) {
    node.textContent = text;
    node.className = 'msg' + (kind ? ' ' + kind : '');
  }

  function labelWithReq(f) {
    return [f.label, f.required ? el('span', { class: 'req', 'aria-hidden': 'true', text: '★' }) : null,
      f.required ? el('span', { class: 'sr-only', text: '（必須）' }) : null];
  }

  function renderField(f, pid, v) {
    const fid = pid + '__' + f.key;
    let node;
    if (f.type === 'scale' || f.type === 'choice') {
      node = el('fieldset', { class: 'field' + (f.type === 'scale' ? ' scale' : ''), id: 'f-' + fid });
      node.appendChild(el('legend', {}, labelWithReq(f)));
      if (f.help) node.appendChild(el('p', { class: 'help', text: f.help }));
      const opts = el('div', { class: 'options' });
      const list = f.type === 'scale'
        ? Array.from({ length: f.max - f.min + 1 }, (_, i) => {
          const n = String(f.min + i);
          return [n, n, (f.anchors || {})[n]];
        })
        : f.options;
      list.forEach(([value, text, sub], i) => {
        const input = el('input', {
          type: 'radio', name: fid, value, 'data-key': f.key, id: fid + '__' + i,
          checked: v[f.key] === value,
        });
        opts.appendChild(el('label', { class: 'opt', for: fid + '__' + i }, [
          input, el('span', {}, [text, sub ? el('small', { text: sub }) : null]),
        ]));
      });
      node.appendChild(opts);
      if (f.reason) {
        const rid = fid + '__reason';
        node.appendChild(el('div', { class: 'reason' }, [
          el('label', { for: rid, text: '理由（任意）' }),
          el('input', { type: 'text', id: rid, 'data-key': f.reason, value: v[f.reason] || '' }),
        ]));
      }
    } else {
      node = el('div', { class: 'field', id: 'f-' + fid });
      node.appendChild(el('label', { for: fid }, labelWithReq(f)));
      if (f.help) node.appendChild(el('p', { class: 'help', text: f.help }));
      let input;
      if (f.type === 'textarea') {
        input = el('textarea', { id: fid, 'data-key': f.key, class: f.short ? 'short' : null });
        input.value = v[f.key] || '';
      } else {
        input = el('input', {
          type: f.type === 'number' ? 'number' : 'text', id: fid, 'data-key': f.key,
          min: f.type === 'number' ? '0' : null, step: f.type === 'number' ? '1' : null,
          inputmode: f.type === 'number' ? 'numeric' : null, value: v[f.key] || '',
        });
      }
      node.appendChild(input);
    }
    if (f.showIf) {
      node.dataset.showIf = f.key;
      node.hidden = !f.showIf(v);
    }
    return node;
  }

  function renderMissing(pid) {
    const box = $('missing-box');
    if (!box) return;
    const v = valuesOf(pid);
    const miss = missingFields(v);
    box.textContent = '';
    if (miss.length === 0) {
      box.className = 'missing-list done';
      box.textContent = 'この論文の必須項目はすべて記入済みです。';
      return;
    }
    box.className = 'missing-list';
    box.appendChild(el('p', { style: 'margin:0', text: '未記入の必須項目（' + miss.length + '）：' }));
    const ul = el('ul');
    miss.forEach((f) => {
      const b = el('button', { type: 'button', text: f.label });
      b.addEventListener('click', () => {
        const target = $('f-' + pid + '__' + f.key);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const first = target.querySelector('input, textarea');
          if (first) first.focus({ preventScroll: true });
        }
      });
      ul.appendChild(el('li', {}, [b]));
    });
    box.appendChild(ul);
  }

  function renderPanel() {
    const pid = state.current;
    const p = paperById[pid];
    const pos = state.order.indexOf(pid);
    const v = valuesOf(pid);
    const panel = $('paper-panel');
    panel.textContent = '';
    panel.appendChild(el('p', { class: 'paper-meta', text: '論文 ' + (pos + 1) + ' / ' + state.order.length }));
    panel.appendChild(el('h3', { class: 'paper-title', lang: 'en', text: p.title }));
    panel.appendChild(el('a', {
      class: 'pdf-link', href: 'papers/' + p.id + '.pdf', target: '_blank', rel: 'noopener',
      text: 'PDFを開く（' + p.pages + 'ページ）',
    }));
    SECTIONS.forEach((s) => {
      const sec = el('section', { class: 'form-section' });
      sec.appendChild(el('h3', { text: s.title }));
      if (s.note) sec.appendChild(el('p', { class: 'section-note', text: s.note }));
      s.fields.forEach((f) => sec.appendChild(renderField(f, pid, v)));
      panel.appendChild(sec);
    });
    panel.appendChild(el('div', { id: 'missing-box', class: 'missing-list', 'aria-live': 'polite' }));
    const nav = el('div', { class: 'panel-nav' });
    if (pos > 0) {
      const prev = el('button', { type: 'button', class: 'btn', text: '← 前の論文' });
      prev.addEventListener('click', () => go(state.order[pos - 1]));
      nav.appendChild(prev);
    } else {
      nav.appendChild(el('span'));
    }
    if (pos < state.order.length - 1) {
      const next = el('button', { type: 'button', class: 'btn primary', text: '次の論文 →' });
      next.addEventListener('click', () => go(state.order[pos + 1]));
      nav.appendChild(next);
    } else {
      const toSubmit = el('button', { type: 'button', class: 'btn primary', text: '回答の送付へ' });
      toSubmit.addEventListener('click', () => $('submit').scrollIntoView({ behavior: 'smooth', block: 'start' }));
      nav.appendChild(toSubmit);
    }
    panel.appendChild(nav);
    renderMissing(pid);
  }

  function renderTabs() {
    const ol = $('paper-tabs');
    ol.textContent = '';
    state.order.forEach((pid, i) => {
      const st = statusOf((state.responses[pid] || {}).values);
      const b = el('button', { type: 'button', 'data-pid': pid, 'aria-current': pid === state.current ? 'true' : 'false' }, [
        el('span', { class: 'tab-num', text: '論文 ' + (i + 1) }),
        el('span', { class: 'tab-title', lang: 'en', text: paperById[pid].title }),
        el('span', { class: 'badge ' + st, text: STATUS_LABEL[st] }),
      ]);
      b.addEventListener('click', () => go(pid));
      ol.appendChild(el('li', {}, [b]));
    });
  }

  function renderProgress() {
    const done = state.order.filter((pid) => statusOf((state.responses[pid] || {}).values) === 'complete').length;
    $('progress-text').textContent = '完了 ' + done + ' / ' + state.order.length;
    $('submit-status').textContent = done === state.order.length
      ? '5本すべての記入が終わりました。ありがとうございました。'
      : '完了 ' + done + ' / ' + state.order.length + '。途中でも保存して送ることができます。';
    $('btn-change-id').hidden = hasAnyAnswer();
  }

  function renderAll() {
    const started = !!state.raterId;
    $('id-form').hidden = started;
    $('id-current').hidden = !started;
    $('work').hidden = !started;
    $('submit').hidden = !started;
    $('storage-warning').hidden = storageOk;
    if (!started) return;
    $('id-label').textContent = state.raterId;
    renderTabs();
    renderPanel();
    renderProgress();
  }

  function go(pid) {
    state.current = pid;
    save();
    renderTabs();
    renderPanel();
    $('work').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function timeLabel(d) {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function onFieldChange(e) {
    const t = e.target;
    const key = t.dataset && t.dataset.key;
    if (!key || !state.current) return;
    if (t.type === 'radio' && !t.checked) return;
    const pid = state.current;
    const v = valuesOf(pid);
    v[key] = t.value;
    const r = state.responses[pid];
    const nowIso = new Date().toISOString();
    if (!r.started_at) r.started_at = nowIso;
    r.updated_at = nowIso;
    $('paper-panel').querySelectorAll('[data-show-if]').forEach((node) => {
      const f = FIELDS.find((x) => x.key === node.dataset.showIf);
      if (f && f.showIf) node.hidden = !f.showIf(v);
    });
    const ok = save();
    $('saved-text').textContent = ok ? '自動保存しました ' + timeLabel(new Date()) : '';
    renderMissing(pid);
    const badge = $('paper-tabs').querySelector('[data-pid="' + pid + '"] .badge');
    if (badge) {
      const st = statusOf(v);
      badge.className = 'badge ' + st;
      badge.textContent = STATUS_LABEL[st];
    }
    renderProgress();
  }

  function fileStamp(d) {
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function exportJson() {
    return JSON.stringify(buildExport(state, new Date()), null, 2);
  }

  function download() {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'e2-' + state.raterId + '-' + fileStamp(new Date()) + '.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg($('submit-msg'), 'ファイルを保存しました。依頼メールへの返信に添付してください。', 'ok');
  }

  async function copy() {
    const json = exportJson();
    try {
      await navigator.clipboard.writeText(json);
      setMsg($('submit-msg'), '回答をコピーしました。メールの本文に貼り付けてください。', 'ok');
      return;
    } catch (e) {
      /* fall back below */
    }
    const ta = el('textarea', { style: 'position:fixed;left:-9999px;top:0', readonly: true });
    ta.value = json;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    ta.remove();
    setMsg($('submit-msg'), ok ? '回答をコピーしました。メールの本文に貼り付けてください。'
      : 'コピーできませんでした。「回答ファイルを保存」をお使いください。', ok ? 'ok' : 'err');
  }

  function startWith(id) {
    state.raterId = id;
    state.order = orderFor(id);
    state.current = state.order[0];
    save();
    $('intro').open = false;
    renderAll();
    $('work').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('form-version').textContent = FORM_VERSION;

  $('id-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = normalizeId($('rater-id').value);
    if (!isValidId(id)) {
      setMsg($('id-msg'), 'IDは英数字で入れてください（例：H1）。', 'err');
      return;
    }
    setMsg($('id-msg'), '', '');
    startWith(id);
  });

  $('btn-change-id').addEventListener('click', () => {
    if (hasAnyAnswer()) return;
    state.raterId = null;
    state.order = [];
    state.current = null;
    state.responses = {};
    if (storageOk) {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    }
    renderAll();
    $('rater-id').focus();
  });

  $('paper-panel').addEventListener('input', onFieldChange);
  $('paper-panel').addEventListener('change', onFieldChange);
  $('btn-download').addEventListener('click', download);
  $('btn-copy').addEventListener('click', copy);

  $('file-import').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = parseImport(String(reader.result));
        if (state.raterId && res.raterId !== state.raterId) {
          throw new Error('評価者IDが違います（ファイル：' + res.raterId + '、このブラウザ：' + state.raterId + '）。');
        }
        state.raterId = res.raterId;
        state.order = orderFor(res.raterId);
        state.responses = res.responses;
        state.current = state.order[0];
        save();
        renderAll();
        setMsg($('import-msg'), '読み込みました。続きから記入できます。', 'ok');
      } catch (err) {
        setMsg($('import-msg'), err.message, 'err');
      }
      e.target.value = '';
    };
    reader.onerror = () => setMsg($('import-msg'), 'ファイルを読めませんでした。', 'err');
    reader.readAsText(file);
  });

  $('btn-clear').addEventListener('click', () => { $('clear-confirm').hidden = false; });
  $('btn-clear-no').addEventListener('click', () => { $('clear-confirm').hidden = true; });
  $('btn-clear-yes').addEventListener('click', () => {
    if (storageOk) {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    }
    state.raterId = null;
    state.order = [];
    state.responses = {};
    state.current = null;
    $('clear-confirm').hidden = true;
    $('rater-id').value = '';
    $('intro').open = true;
    renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  load();
  if (state.raterId) $('intro').open = false;
  renderAll();
}
