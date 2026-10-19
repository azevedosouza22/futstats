export type ScheduledFixture = {
  id: string;
  date: string;
  time: string | null;
  competition: string;
  home: string;
  away: string;
  sourceUrl: string;
};

export type CalendarWindow = 'today' | 'week' | 'month';

function readCsv(content: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [], current = '', quoted = false;
  for(let i=0; i<content.length; i++) {
    const ch=content[i];
    if(ch==='"') {
      if(quoted && content[i+1]==='"') {current+='"'; i++;}
      else quoted=!quoted;
    } else if(ch===','&&!quoted) {row.push(current);current='';}
    else if((ch==='\n'||ch==='\r')&&!quoted) {
      if(ch==='\r'&&content[i+1]==='\n')i++;
      row.push(current);current='';
      if(row.some(v=>v.trim()))lines.push(row);
      row=[];
    } else current+=ch;
  }
  if(quoted)throw Error('CSV com aspas incompletas.');
  row.push(current);
  if(row.some(v=>v.trim()))lines.push(row);
  return lines;
}

const required=['data','horario_brasilia','competicao','mandante','visitante','url_fonte'];
const dateOk=(date:string)=>/^\d{4}-\d\d-\d\d$/.test(date)&&
  !Number.isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;

export const normalizeTeam=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function fixtureId(f: Pick<ScheduledFixture,'date'|'competition'|'home'|'away'>) {
  return [f.date,f.competition,f.home,f.away].map(normalizeTeam).join('|');
}
function urlOk(link:string) {
  try {
    const u=new URL(link);
    return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.');
  }catch{return false;}
}

export function parseCalendarCsv(csv:string): ScheduledFixture[] {
  if(csv.length>2_000_000)throw Error('Agenda muito grande. Limite de 2 MB.');
  const rows=readCsv(csv.replace(/^\uFEFF/,''));
  if(rows.length<2)throw Error('Agenda vazia.');
  if(rows.length>1001)throw Error('Importe no máximo 1.000 confrontos.');
  const header=rows[0].map(s=>s.trim().toLowerCase());
  if(new Set(header).size!==header.length||required.some(h=>!header.includes(h)))
    throw Error('Cabeçalho incompatível. Use data,horario_brasilia,competicao,mandante,visitante,url_fonte.');
  const unique=new Set<string>();
  return rows.slice(1).map((values,i)=>{
    const line=i+2;
    if(values.length!==header.length)throw Error('Linha '+line+': número incorreto de colunas.');
    const r=Object.fromEntries(header.map((h,j)=>[h,values[j].trim()])) as Record<string,string>;
    const date=r.data,time=r.horario_brasilia;
    if(!dateOk(date))throw Error('Linha '+line+': data inválida.');
    if(time && time.toUpperCase()!=='N/D'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
      throw Error('Linha '+line+': horário inválido.');
    for(const field of ['competicao','mandante','visitante'] as const) {
      if(!r[field]||r[field].length>120)throw Error('Linha '+line+': campo '+field+' inválido.');
    }
    if(normalizeTeam(r.mandante)===normalizeTeam(r.visitante))throw Error('Linha '+line+': equipes iguais.');
    if(!urlOk(r.url_fonte))throw Error('Linha '+line+': URL não é HTTPS válida.');
    const partial={date,competition:r.competicao,home:r.mandante,away:r.visitante};
    const id=fixtureId(partial);
    if(unique.has(id))throw Error('Linha '+line+': confronto duplicado no próprio CSV.');
    unique.add(id);
    return {...partial,id,time:!time||time.toUpperCase()==='N/D'?null:time,sourceUrl:r.url_fonte};
  });
}

export function mergeCalendar(existing:ScheduledFixture[], incoming:ScheduledFixture[]) {
  const seen=new Set(existing.map(f=>f.id));
  const added=incoming.filter(f=>!seen.has(f.id));
  return {entries:[...existing,...added].sort((a,b)=>a.date.localeCompare(b.date)|| (a.time??'99:99').localeCompare(b.time??'99:99')),added:added.length,duplicates:incoming.length-added.length};
}

export function brasiliaDate(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23',
  }).formatToParts(now);
  const part=(name:string)=>parts.find(p=>p.type===name)?.value??'';
  return {date:part('year')+'-'+part('month')+'-'+part('day'),time:part('hour')+':'+part('minute')};
}

export function isUpcoming(f:ScheduledFixture,now=new Date()) {
  const current=brasiliaDate(now);
  if(f.date<current.date)return false;
  return f.date>current.date || f.time===null || f.time>current.time;
}

export function calendarWindow(entries:ScheduledFixture[],window:CalendarWindow,now=new Date()) {
  const current=brasiliaDate(now).date;
  const end=new Date(current+'T12:00:00Z');
  end.setUTCDate(end.getUTCDate()+(window==='today'?0:window==='week'?7:30));
  const endDate=end.toISOString().slice(0,10);
  return entries.filter(f=>f.date>=current&&f.date<=endDate&&isUpcoming(f,now))
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.time??'99:99').localeCompare(b.time??'99:99'));
}
