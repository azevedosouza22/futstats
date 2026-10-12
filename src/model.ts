export const coreMetrics = ['goals','shots','target','corners','yellow','red'] as const;
export const extraMetrics = ['possession','xg','chances'] as const;
export const metrics = [...coreMetrics, ...extraMetrics] as const;
export type CoreMetric = typeof coreMetrics[number];
export type ExtraMetric = typeof extraMetrics[number];
export type Metric = typeof metrics[number];
// Extra fields are optional in old backups. All consumers receive normalized N/D.
export type Stats = Record<CoreMetric, number | null> & Partial<Record<ExtraMetric, number | null>>;
export type ResolvedStats = Record<Metric, number | null>;
export type Period = 'first' | 'second' | 'full';
export type FieldOrigin = 'recognized' | 'corrected' | 'calculated';
export type ImageOrigin = {
  importedAt: string; confirmed: true; periods: Period[];
  full: [Stats, Stats];
  fields: Partial<Record<Period, Partial<Record<Metric, [FieldOrigin | null, FieldOrigin | null]>>>>;
  matchFields: Record<'home' | 'away' | 'date' | 'competition', FieldOrigin | null>;
};
export type Team = {id: string; name: string; color: string; externalId?: string};
export type Match = {
  id: string; home: string; away: string; date: string; competition: string;
  first: [Stats, Stats]; second: [Stats, Stats]; image?: ImageOrigin;
  external?: {provider: 'thesportsdb'; id: string; importedAt: string; status: string; full: [Stats, Stats]};
};
export type Data = {teams: Team[]; matches: Match[]};
export const labels: Record<Metric, string> = {goals:'Gols',shots:'Finalizações',target:'No alvo',corners:'Escanteios',yellow:'Cartões amarelos',red:'Cartões vermelhos',possession:'Posse de bola (%)',xg:'Gols esperados (xG)',chances:'Chances claras'};
export const additiveMetrics: Metric[] = [...coreMetrics, 'chances'];
export const unavailable = (): ResolvedStats => Object.fromEntries(metrics.map(k=>[k,null])) as ResolvedStats;
export const empty = (): ResolvedStats => ({...unavailable(),goals:0,shots:0,target:0,corners:0,yellow:0,red:0});
export const normalized = (s: Stats): ResolvedStats => Object.fromEntries(metrics.map(k=>[k,s[k]??null])) as ResolvedStats;

export function stats(m: Match, side: number, period: Period): ResolvedStats {
  if (m.external) return normalized(period==='full'?m.external.full[side]:m[period][side]);
  if (period!=='full') return normalized(m[period][side]);
  if (m.image) return normalized(m.image.full[side]);
  return Object.fromEntries(metrics.map(k=>[k, additiveMetrics.includes(k)&&m.first[side][k]!=null&&m.second[side][k]!=null ? m.first[side][k]!+m.second[side][k]! : null])) as ResolvedStats;
}
export function average(matches: Match[], team: string, period: 'first'|'full') {
  const games=matches.filter(m=>m.home===team||m.away===team);
  const values=Object.fromEntries(metrics.map(k=>[k,games.map(m=>stats(m,m.home===team?0:1,period)[k]).filter((v):v is number=>v!==null)])) as Record<Metric,number[]>;
  return {count:games.length,samples:Object.fromEntries(metrics.map(k=>[k,values[k].length])) as Record<Metric,number>,values:Object.fromEntries(metrics.map(k=>[k,values[k].length?values[k].reduce((a,b)=>a+b,0)/values[k].length:null])) as ResolvedStats};
}
export function matchAverage(matches: Match[], k: Metric, period: 'first'|'full') {
  const values=matches.map(m=>[stats(m,0,period)[k],stats(m,1,period)[k]]).filter((v):v is [number,number]=>v[0]!==null&&v[1]!==null).map(v=>v[0]+v[1]);
  return {count:values.length,total:values.length?values.reduce((a,b)=>a+b,0):null,value:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};
}
export function validDate(value: unknown): value is string {
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
}
export function validStats(s: Stats, nullable: boolean): boolean {
  return !!s && metrics.every(k=> {
    const v=s[k];
    if (v==null) return nullable || extraMetrics.includes(k as ExtraMetric);
    return typeof v==='number'&&Number.isFinite(v)&&v>=0&&(k==='xg'||k==='possession'||Number.isSafeInteger(v))&&(k!=='possession'||v<=100);
  });
}
const validPair=(p: [Stats,Stats], nullable: boolean) => Array.isArray(p)&&p.length===2&&p.every(s=>validStats(s,nullable));
const isoDate=(value: unknown)=>typeof value==='string'&&!Number.isNaN(Date.parse(value));
const originValues=['recognized','corrected','calculated'];
export function validateMatch(m: Match): string {
  if (!m.home||!m.away||m.home===m.away) return 'Selecione duas equipes diferentes.';
  if (!validDate(m.date)) return 'Informe a data da partida.';
  if (!validPair(m.first,!!m.external||!!m.image)||!validPair(m.second,!!m.external||!!m.image)) return 'Períodos ou valores inválidos.';
  if (m.external&&m.image) return 'Origens incompatíveis.';
  if (m.external) {
    const e=m.external;
    if (e.provider!=='thesportsdb'||!/^\d+$/.test(e.id)||typeof e.status!=='string'||!isoDate(e.importedAt)||!validPair(e.full,true)||!e.full.every(s=>metrics.every(k=>k==='goals'||s[k]==null)&&(['FT','Match Finished'].includes(e.status)||s.goals===null))||[...m.first,...m.second].some(s=>metrics.some(k=>s[k]!=null))) return 'Importação inválida.';
    return '';
  }
  if (m.image) {
    const i=m.image;
    if (!isoDate(i.importedAt)||i.confirmed!==true||!Array.isArray(i.periods)||!i.periods.length||new Set(i.periods).size!==i.periods.length||i.periods.some(p=>!['first','second','full'].includes(p))||!validPair(i.full,true)||!i.fields||typeof i.fields!=='object'||!i.matchFields||typeof i.matchFields!=='object') return 'Metadados da imagem inválidos.';
    for (const p of ['first','second','full'] as const) {
      const pair=p==='full'?i.full:m[p];
      if (!i.periods.includes(p)&&pair.some(s=>metrics.some(k=>s[k]!=null))) return 'Período não declarado.';
      const fields=i.fields[p];
      if (fields!==undefined&&(!fields||typeof fields!=='object'||Object.entries(fields).some(([k,v])=>!metrics.includes(k as Metric)||!Array.isArray(v)||v.length!==2||v.some(x=>x!==null&&!originValues.includes(x))))) return 'Proveniência inválida.';
      for (const k of metrics) for (const side of [0,1]) {
        const provenance=fields?.[k]?.[side];
        if (pair[side][k]!=null&&!originValues.includes(provenance??'')) return 'Valor sem proveniência.';
        if (pair[side][k]==null&&provenance!=null) return 'Proveniência sem valor.';
        if (provenance==='calculated') {
          if (!additiveMetrics.includes(k)) return 'Cálculo em métrica ou período inválido.';
          const a=m.first[side][k],b=m.second[side][k],c=i.full[side][k];
          if (p==='first' ? (b==null||c==null||c<b||a!==c-b) : p==='second' ? (a==null||c==null||c<a||b!==c-a) : (a==null||b==null||c!==a+b)) return 'Valor calculado incompatível.';
        }
      }
    }
    if (['home','away','date','competition'].some(k=>i.matchFields[k as keyof typeof i.matchFields]!==null&&!originValues.includes(i.matchFields[k as keyof typeof i.matchFields]??''))) return 'Origem dos dados da partida inválida.';
    for (const k of additiveMetrics) for (const side of [0,1]) {const a=m.first[side][k],b=m.second[side][k],c=i.full[side][k];if(a!=null&&c!=null&&(c<a||(b!=null&&a+b!==c)))return 'Estatísticas incompatíveis entre períodos.';}
  }
  for (const s of [...m.first,...m.second,...(m.image?.full??[])]) {
    if (s.target!=null&&s.shots!=null&&s.target>s.shots) return 'Finalizações no alvo não podem superar as finalizações.';
    // Keep the existing manual convention; imported images may include own goals.
    if (!m.image&&s.goals!=null&&s.target!=null&&s.goals>s.target) return 'Gols não podem superar as finalizações no alvo.';
  }
  return '';
}
export function validData(value: unknown): value is Data {
  if (!value||typeof value!=='object') return false;
  const d=value as Data;
  if (!Array.isArray(d.teams)||!Array.isArray(d.matches)) return false;
  const ids=new Set<string>(),externalTeams=new Set<string>();
  for (const t of d.teams) {
    if (!t||typeof t.id!=='string'||ids.has(t.id)||typeof t.name!=='string'||!t.name.trim()||typeof t.color!=='string'||!/^#[0-9a-f]{6}$/i.test(t.color)||t.externalId!==undefined&&(typeof t.externalId!=='string'||!/^\d+$/.test(t.externalId)||externalTeams.has(t.externalId))) return false;
    ids.add(t.id); if(t.externalId) externalTeams.add(t.externalId);
  }
  const matchIds=new Set(),externalMatches=new Set();
  return d.matches.every(m=> {
    if (!m||typeof m.id!=='string'||matchIds.has(m.id)||!ids.has(m.home)||!ids.has(m.away)||typeof m.competition!=='string'||validateMatch(m)) return false;
    matchIds.add(m.id);
    if (m.external) {if(externalMatches.has(m.external.id)) return false; externalMatches.add(m.external.id);}
    return true;
  });
}
export const STORAGE='futstats:v1';
