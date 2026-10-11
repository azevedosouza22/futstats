import {describe, it, expect, vi} from 'vitest';
import {createSportsDBProvider, normalizeSnapshot} from './providers';
const event = {idEvent:'123',strSport:'Soccer',strHomeTeam:'A',strAwayTeam:'B',strStatus:'1H',intHomeScore:'0',intAwayScore:'1'};
const time = '2026-10-11T12:00:00Z';
describe('Provedor autorizado / Ao vivo', () => {
  it('preserva zero real, não inventa minuto, período ou estatísticas', () => {
    const s = normalizeSnapshot('123', event, [], time, time);
    expect(s.score).toEqual([0,1]); expect(s.minute).toBeNull(); expect(s.aggregate[0].shots).toBeNull();
    expect(s.source).toBe('TheSportsDB V1'); expect(s.providerUpdatedAt).toBeNull(); expect(s.warnings).toHaveLength(1);
  });
  it('mapeia apenas métricas explícitas do evento e nunca mistura períodos ou eventos', () => {
    const rows = [{idEvent:'123',strStat:'Total Shots',intHome:'4',intAway:null}, {idEvent:'other',strStat:'Corner Kicks',intHome:'8',intAway:'8'}, {idEvent:'123',strStat:'Shots on Goal',intHome:'2',intAway:'2',strPeriod:'1H'}];
    const s = normalizeSnapshot('123', event, rows, time, time);
    expect(s.aggregate[0].shots).toBe(4); expect(s.aggregate[1].shots).toBeNull(); expect(s.aggregate[0].corners).toBeNull(); expect(s.aggregate[0].target).toBeNull();
  });
  it('métricas duplicadas, vazias ou inválidas são N/D', () => {
    const rows = [{idEvent:'123',strStat:'Yellow Cards',intHome:'-1',intAway:''}, ...[1,2].map(n => ({idEvent:'123',strStat:'Total Shots',intHome:String(n),intAway:'1'}))];
    const s = normalizeSnapshot('123', event, rows, time, time);
    expect(s.aggregate[0].yellow).toBeNull(); expect(s.aggregate[1].yellow).toBeNull(); expect(s.aggregate[0].shots).toBeNull(); expect(s.warnings.length).toBeGreaterThan(0);
  });
  it('não atribui placar zero a partida agendada e rejeita identidade incorreta', () => {
    expect(normalizeSnapshot('123',{...event,strStatus:'NS'},[],time,time).score).toEqual([null,null]);
    expect(() => normalizeSnapshot('123', {...event,idEvent:'456'}, [],time,time)).toThrow();
    expect(() => normalizeSnapshot('123', {...event,strSport:'Basketball'}, [],time,time)).toThrow();
  });
  it('retém placar novo sem reutilizar estatísticas antigas quando a consulta falha', async () => {
    const request = vi.fn().mockResolvedValueOnce({items:[event],fetchedAt:time}).mockRejectedValueOnce(Error('quota'));
    const provider = createSportsDBProvider(request);
    const result = await provider.snapshot('123', new AbortController().signal);
    expect(result.score).toEqual([0,1]); expect(result.aggregate[0].shots).toBeNull(); expect(result.statisticsFetchedAt).toBeNull(); expect(result.warnings.join()).toContain('quota');
  });
  it('partida ausente não consome pedido adicional e entrada inválida não consulta rede', async () => {
    const request = vi.fn().mockResolvedValue({items:[]}); const p = createSportsDBProvider(request);
    await expect(p.snapshot('url-maliciosa',new AbortController().signal)).rejects.toThrow(); expect(request).not.toHaveBeenCalled();
    await expect(p.snapshot('123',new AbortController().signal)).rejects.toThrow('não encontrada'); expect(request).toHaveBeenCalledTimes(1);
  });
  it('aborto não é convertido em resposta parcial bem-sucedida', async () => {
    const c=new AbortController();
    const request=vi.fn().mockResolvedValueOnce({items:[event]}).mockImplementationOnce(()=>{c.abort();throw Error('aborted');});
    await expect(createSportsDBProvider(request).snapshot('123',c.signal)).rejects.toThrow('aborted');
  });
});
