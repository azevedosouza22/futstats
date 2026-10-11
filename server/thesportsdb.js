// Server-only: never import this module from src/.
export function createService(fetcher = fetch, now = Date.now, key = () => process.env.THESPORTSDB_API_KEY || '123') {
  const cache = new Map(), pending = new Map();
  let windowStart = 0, requests = 0, cooldown = 0;
  return async function search(params) {
    const kind = params.get('kind'), query = (params.get('q') || '').trim();
    if (!['teams', 'events'].includes(kind) || query.length < 3 || query.length > 80) return {status:400,body:{error:'Informe uma busca de 3 a 80 caracteres.'}};
    const id = `${kind}:${query.toLowerCase()}`;
    const hit = cache.get(id);
    if (hit && hit.expires > now()) return {status:200,body:hit.body};
    if (pending.has(id)) return pending.get(id);
    if (now() < cooldown) return {status:429,body:{error:'Limite da API atingido. Aguarde um minuto antes de tentar novamente.'}};
    if (now() - windowStart >= 60000) {windowStart = now(); requests = 0;}
    if (requests >= 15) return {status:429,body:{error:'Limite de buscas desta instância atingido. Aguarde um minuto.'}};
    requests++;
    const task = (async()=>{
      try {
        const endpoint = kind === 'teams' ? 'searchteams.php?t=' : 'searchevents.php?e=';
        const response = await fetcher(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key())}/${endpoint}${encodeURIComponent(query)}`, {signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
        if(response.status===429){cooldown=now()+60000;return {status:429,body:{error:'A TheSportsDB limitou as consultas. Aguarde um minuto.'}};}
        if(!response.ok)return {status:502,body:{error:'A TheSportsDB está indisponível. Tente novamente mais tarde.'}};
        const payload = await response.json();
        const raw = payload?.[kind === 'teams' ? 'teams' : 'event'];
        if(raw !== null && !Array.isArray(raw))return {status:502,body:{error:'Resposta inesperada da TheSportsDB.'}};
        const items = (raw || []).filter(x=>x && x.strSport === 'Soccer').slice(0,30).map(x=> kind === 'teams' ? {idTeam:x.idTeam,strTeam:x.strTeam,strSport:x.strSport,strCountry:x.strCountry} : {idEvent:x.idEvent,idHomeTeam:x.idHomeTeam,idAwayTeam:x.idAwayTeam,strHomeTeam:x.strHomeTeam,strAwayTeam:x.strAwayTeam,strSport:x.strSport,dateEvent:x.dateEvent,strLeague:x.strLeague,intHomeScore:x.intHomeScore,intAwayScore:x.intAwayScore,strStatus:x.strStatus,intHomeScoreExtra:x.intHomeScoreExtra,intAwayScoreExtra:x.intAwayScoreExtra});
        const body={items};if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(id,{body,expires:now()+300000});return {status:200,body};
      } catch {return {status:502,body:{error:'Não foi possível consultar a TheSportsDB. Verifique a conexão e tente mais tarde.'}};}
    })();
    pending.set(id,task);try{return await task;}finally{pending.delete(id);}
  };
}
export const search = createService();
export async function handle(request, response) {
  response.setHeader('Cache-Control','no-store');
  response.setHeader('Content-Type','application/json; charset=utf-8');
  if(request.method!=='GET'){response.statusCode=405;response.setHeader('Allow','GET');response.end(JSON.stringify({error:'Método não permitido.'}));return;}
  const result=await search(new URL(request.url,'http://internal').searchParams);
  if(result.status===429)response.setHeader('Retry-After','60');
  response.statusCode=result.status;response.setHeader('Content-Type','application/json; charset=utf-8');response.end(JSON.stringify(result.body));
}
