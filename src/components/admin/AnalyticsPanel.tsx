import { useEffect, useState } from 'react';
import type { AnalyticsReport } from '../../lib/analytics';

const duration = (seconds: number) => `${Math.floor(Math.round(seconds) / 60)}분 ${Math.round(seconds) % 60}초`;
const dateTime = (time: number) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(time);

export default function AnalyticsPanel() {
  const [days, setDays] = useState('7');
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/admin/analytics?days=${days}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const body = await response.json() as AnalyticsReport & { error?: string };
        if (!response.ok) throw new Error(body.error ?? '방문 통계를 불러오지 못했습니다.');
        return body as AnalyticsReport;
      }).then(setReport).catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, revision]);
  const maximum = Math.max(1, ...(report?.daily.map(row => row.sessions) ?? []));
  return <div className="analytics-dashboard" aria-busy={loading}>
    <div className="analytics-controls">
      <div role="group" aria-label="통계 기간">{[['1', '오늘'], ['7', '최근 7일'], ['30', '최근 30일']].map(([value, label]) =>
        <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}>{label}</button>)}</div>
      <button type="button" disabled={loading} onClick={() => setRevision(value => value + 1)}>새로고침</button>
    </div>
    <p className="analytics-note">한국 시간 기준 · 세션은 방문 흐름이며 실제 인원 수가 아닙니다. 활성 열람 시간은 추정치입니다.</p>
    {error ? <p role="alert" className="admin-alert error">{error}</p> : loading ? <p role="status">통계를 불러오는 중입니다.</p> : report ? <>
      <dl className="analytics-metrics">
        <div><dt>방문 세션</dt><dd>{report.summary.sessions.toLocaleString()}</dd></div>
        <div><dt>페이지 조회</dt><dd>{report.summary.views.toLocaleString()}</dd></div>
        <div><dt>세션당 활성 열람</dt><dd>{duration(report.summary.sessions ? report.summary.seconds / report.summary.sessions : 0)}</dd></div>
      </dl>
      {report.summary.sessions === 0 ? <p className="analytics-empty">아직 기록된 방문이 없습니다.</p> : <>
        <section><h3>일별 방문</h3><div className="analytics-days">{report.daily.slice().reverse().map(row => <div key={row.day}>
          <time>{row.day}</time><meter min={0} max={maximum} value={row.sessions} aria-label={`${row.day} 방문 세션`} /><strong>{row.sessions}</strong>
        </div>)}</div></section>
        <section><h3>많이 본 프로젝트</h3>{report.projects.length ? <div className="analytics-table"><table>
          <thead><tr><th>프로젝트</th><th>조회</th><th>세션</th><th>활성 열람</th></tr></thead>
          <tbody>{report.projects.map(row => <tr key={row.path}><td><a href={row.path} target="_blank" rel="noreferrer">{row.title}</a></td><td>{row.views}</td><td>{row.sessions}</td><td>{duration(row.seconds)}</td></tr>)}</tbody>
        </table></div> : <p>아직 프로젝트 조회가 없습니다.</p>}</section>
        <section><h3>최근 방문 세션 <small>최근 100개</small></h3><div className="analytics-table"><table>
          <thead><tr><th>세션</th><th>처음 / 마지막</th><th>환경 · 유입</th><th>열어본 페이지</th><th>활성 열람</th></tr></thead>
          <tbody>{report.recent.map(row => <tr key={row.sessionId}>
            <td><code title={row.sessionId}>{row.sessionId.slice(0, 8)}</code><br />{row.views}회 조회</td>
            <td>{dateTime(row.firstSeen)}<br />{dateTime(row.lastSeen)}</td>
            <td>{row.device === 'mobile' ? '모바일' : '데스크톱'}<br />{row.referrer || '직접 / 알 수 없음'}</td>
            <td>{row.paths.split(',').map(path => <a className="analytics-path" href={path} key={path} target="_blank" rel="noreferrer">{report.projects.find(project => project.path === path)?.title ?? path}</a>)}</td>
            <td>{duration(row.seconds)}</td>
          </tr>)}</tbody>
        </table></div></section>
      </>}
    </> : null}
  </div>;
}
