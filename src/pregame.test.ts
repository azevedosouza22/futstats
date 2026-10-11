import {describe, it, expect} from 'vitest';
import {empty, type Match} from './model';
import {pregameAverage, recentMatches} from './pregame';
import {importEvent} from './sportsdb';
const games: Match[] = Array.from({length: 12}, (_, i) => ({id: String(i), home: i % 2 ? 'b' : 'a', away: i % 2 ? 'a' : 'b', date: `2026-09-${String(i + 1).padStart(2, '0')}`, competition: 'Liga', first: [{...empty(), goals: 1, target: 1, shots: 2}, {...empty(), goals: 2, target: 2, shots: 3}], second: [{...empty(), goals: 3, target: 3, shots: 4}, {...empty(), goals: 4, target: 4, shots: 5}]}));
describe('Pré-jogo', () => {
  it('seleciona últimos 5 e 10 sem mutar a base', () => {
    expect(recentMatches(games, 'a', 5, '2026-10-01').map(m => m.id)).toEqual(['11','10','9','8','7']);
    expect(recentMatches(games, 'a', 10, '2026-10-01')).toHaveLength(10);
    expect(games[0].id).toBe('0');
  });
  it('considera mandante e visitante e separa primeiro tempo do total', () => {
    const first = pregameAverage(games, 'a', 5, 'first', '2026-10-01');
    const full = pregameAverage(games, 'a', 5, 'full', '2026-10-01');
    expect(first.values.goals).toBe(1.6); expect(full.values.goals).toBe(5.2);
  });
  it('não utiliza jogos no dia do confronto ou posteriores', () => {
    expect(recentMatches(games, 'a', 5, '2026-09-04').map(m => m.id)).toEqual(['2','1','0']);
  });
  it('amostra vazia não vira média zero', () => {
    const result = pregameAverage([], 'a', 10, 'first', '2026-10-01');
    expect(result.values.goals).toBeNull(); expect(result.count).toBe(0); expect(result.samples.shots).toBe(0);
  });
  it('não retrocede a janela para preencher estatísticas ausentes e exclui importações sem status final', () => {
    const imported = importEvent({teams: [], matches: []}, {idEvent:'1',idHomeTeam:'11',idAwayTeam:'22',strHomeTeam:'A',strAwayTeam:'B',strSport:'Soccer',dateEvent:'2026-09-13',intHomeScore:'0',intAwayScore:'1',strStatus:'FT'}).matches[0];
    const missing = {...imported, home:'a',away:'b'};
    const result = pregameAverage([...games, missing], 'a', 5, 'first', '2026-10-01');
    expect(result.count).toBe(5); expect(result.samples.goals).toBe(4);
    expect(result.selected[0].id).toBe(missing.id);
    const future = structuredClone(missing); future.id = 'future'; future.external!.status = '1H';
    expect(recentMatches([future], 'a', 5, '2026-10-01')).toHaveLength(0);
  });
});
