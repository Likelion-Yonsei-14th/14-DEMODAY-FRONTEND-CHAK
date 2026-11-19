#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const date = process.argv[2]
const root = process.argv[3] || '/opt/chak/load-test'
if (!/^2026-11-(19|20)$/.test(date || '')) throw new Error('사용법: node chak-load-journeys.mjs 2026-11-19|2026-11-20 [load-root]')

const source = readFileSync(join(root, 'out', `load-${date}`, 'load.k6.js'), 'utf8')
const match = source.match(/^const events = (.*);$/m)
if (!match) throw new Error('당일 부하 이벤트를 읽을 수 없습니다')
const mainEvents = JSON.parse(match[1])
const startEpoch = Date.parse(process.env.CHAK_LOAD_TEST_START || `${date}T00:00:00+09:00`)
if (!Number.isFinite(startEpoch)) throw new Error('CHAK_LOAD_TEST_START 형식이 잘못됐습니다')
const cutoff = Math.max(0, Math.ceil((Date.now() - startEpoch) / 1000) + 300)
const maxRpm = 55 // 메인 시험과 합친 60초 이동 구간에 5요청 여유를 둔다.
const rolling = new Uint16Array(86400)
const addCost = (at, cost) => {
  for (let start = Math.max(0, at - 59); start <= at; start++) rolling[start] += cost
}
for (const event of mainEvents) addCost(event.at, event.member ? 5 : 3)

let state = Number(date.replaceAll('-', '')) >>> 0
const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
// 수험생 대상 혜택 광고의 실측 CTR이 없으므로 지면별 시험 가정값을 쓴다.
const clickIntentRates = { banner: 0.01, benefits: 0.03 }
const journeys = []
for (const event of mainEvents) {
  if (event.at < cutoff || event.at >= 86100 || !/^\d{2}$/.test(event.region || '')) continue
  const choice = random()
  const kind = choice < 0.12 ? 'benefits' : choice < 0.22 ? 'banner' : null
  if (!kind) continue
  const creative = kind === 'banner' && random() < 0.2
  const cost = (kind === 'benefits' ? 3 : 1) + Number(creative)
  let fits = true
  for (let start = Math.max(0, event.at - 59); start <= event.at; start++) {
    if (rolling[start] + cost + 2 > maxRpm) { fits = false; break }
  }
  if (!fits) continue
  addCost(event.at, cost)
  journeys.push({ at: event.at, region: event.region, kind, creative, clickIntent: random() < clickIntentRates[kind] })
}
if (!journeys.length) throw new Error('남은 시간에 배치할 읽기 방문이 없습니다')

const k6 = `// Read-only CHAK benefits and ad-placement journeys. No ad analytics or outbound clicks.
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const events = ${JSON.stringify(journeys)};
const front = (__ENV.TARGET_URL || '').replace(/\\/$/, '');
const api = (__ENV.API_URL || '').replace(/\\/$/, '');
const startEpoch = Date.parse(__ENV.CHAK_LOAD_TEST_START || '${date}T00:00:00+09:00');
const resumeCutoff = Date.now();
const runId = __ENV.CHAK_LOAD_TEST_RUN_ID || 'chak-journeys-${date.replaceAll('-', '')}';
const clickIntents = new Counter('simulated_ad_click_intents');
const journeyFailures = new Rate('journey_failures');
const VUS = 8;
export const options = {
  scenarios: { journeys: { executor: 'per-vu-iterations', vus: VUS, iterations: 1, maxDuration: '26h' } },
  thresholds: { journey_failures: ['rate<0.05'] },
};
function read(url, opts, statuses = [200]) {
  const response = http.get(url, opts);
  journeyFailures.add(statuses.includes(response.status) ? 0 : 1);
  return response;
}
export default function () {
  const headers = { 'X-CHAK-Load-Test': runId, 'User-Agent': 'chak-sim-load-test/1.0' };
  for (let i = __VU - 1; i < events.length; i += VUS) {
    const event = events[i];
    if (startEpoch + event.at * 1000 <= resumeCutoff) continue;
    const wait = (startEpoch + event.at * 1000 - Date.now()) / 1000;
    if (wait > 0) sleep(wait);
    const opts = { headers, tags: { load_test: 'true', journey: event.kind }, timeout: '10s', redirects: 0 };
    if (event.kind === 'benefits') {
      read(front + '/discounts', opts);
      read(api + '/api/public/discounts', opts);
      const sponsored = read(api + '/api/public/discounts/sponsored?geoCountry=KR&geoRegion=' + event.region, opts);
      if (sponsored.status === 200 && event.clickIntent) {
        try { if (sponsored.json()?.items?.length) clickIntents.add(1, { surface: 'benefits' }); }
        catch (_) { journeyFailures.add(1); }
      }
    } else {
      const ad = read(api + '/api/public/ads/serve?placement=BANNER&geoCountry=KR&geoRegion=' + event.region, opts, [200, 204]);
      if (ad.status !== 200) continue;
      let body = null;
      try { body = ad.json(); } catch (_) { journeyFailures.add(1); }
      if (event.creative && /^https:\\/\\/www\\.chak\\.live\\/api\\/public\\/ads\\/creatives\\/\\d+$/.test(body?.creativeUrl || '')) {
        read(body.creativeUrl, opts);
      }
      if (event.clickIntent) clickIntents.add(1, { surface: 'banner' });
    }
  }
}
`

const out = join(root, 'out', `load-${date}-journeys`)
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'load.k6.js'), k6)
const peak = Math.max(...rolling) + 2
const summary = {
  date, runId: `chak-journeys-${date.replaceAll('-', '')}`, count: journeys.length,
  benefits: journeys.filter((event) => event.kind === 'benefits').length,
  banner: journeys.filter((event) => event.kind === 'banner').length,
  creative: journeys.filter((event) => event.creative).length,
  simulatedClickIntents: journeys.filter((event) => event.clickIntent).length,
  clickIntentRates, rollingRequestBudget: peak,
  firstAt: journeys[0].at, lastAt: journeys.at(-1).at,
  note: '광고 클릭 의향은 k6 시험 지표에만 기록한다. 외부 링크와 광고 CLICK 이벤트는 호출하지 않는다.',
}
writeFileSync(join(out, 'plan.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify(summary))
