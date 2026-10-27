/** In-memory fictional dataset to demonstrate the four-context UI.
 * No network, localStorage, imported CSVs, or original predictions touched.
 * All dates, teams and results in this factory are DEMONSTRATION ONLY.
 */
import type {Data,Match,Stats} from './model';
import type {RadarFixture} from './radar';

const current='Bundesliga 2026/27',previous='Bundesliga 2025/26';
const demoHome='demo-hoffenheim',demoAway='demo-schalke';
const teamIds=[demoHome,demoAway,...Array.from({length:24},(_,i)=>'demo-club-'+(i+1))];
const teams=teamIds.map((id,i)=>({
  id,name:i===0?'Hoffenheim (DEMONSTRAÇÃO)':i===1?'Schalke (DEMONSTRAÇÃO)':`Equipe fictícia ${i-1}`,
  color:'#567579'
}));
function stats(goals:number,shots:number,target:number,corners:number):Stats{
  return {goals,shots,target,corners,yellow:0,red:0};
}
function fixture(id:string,date:string,competition:string,home:string,away:string,
  hShots:number,aShots:number,hTarget:number,aTarget:number,hCorners:number,aCorners:number,
  hGoals=1,aGoals=1):Match{
  const first=(g:number,s:number,t:number,c:number)=>stats(
    Math.floor(g/2),Math.floor(s/2),Math.floor(t/2),Math.floor(c/2)
  );
  const second=(g:number,s:number,t:number,c:number)=>stats(
    g-Math.floor(g/2),s-Math.floor(s/2),t-Math.floor(t/2),c-Math.floor(c/2)
  );
  return {
    id,date,competition,home,away,
    first:[first(hGoals,hShots,hTarget,hCorners),first(aGoals,aShots,aTarget,aCorners)],
    second:[second(hGoals,hShots,hTarget,hCorners),second(aGoals,aShots,aTarget,aCorners)]
  };
}
const matches:Match[]=[];
const totalsHome=[26,36,21,25,25,29,27,23,31,24,26,33,24];
const totalsAway=[24,26,30,27,22,25,26,29,24,23,28,25,27];
for(let i=0;i<13;i++){
  const thisYear=i<6,month=thisYear?'10':'08',day=thisYear?String(13+i).padStart(2,'0'):String(i+3).padStart(2,'0');
  const date=(thisYear?'2026':'2025')+'-'+month+'-'+day;
  const opp=teamIds[2+i];
  const a=11+(i%5),b=totalsHome[i]-a;
  matches.push(fixture('demo-h-'+i,date,thisYear?current:previous,demoHome,opp,
    a,b,Math.min(5,a),Math.min(4,b),4+i%4,3+i%3));
  const x=10+i%6,y=totalsAway[i]-x;
  matches.push(fixture('demo-s-'+i,date,thisYear?current:previous,opp,demoAway,
    x,y,Math.min(4,x),Math.min(5,y),3+i%3,4+i%4));
}
// Demonstrate one in-season and two older direct home-v-away fixtures.
// They are deliberately fictional, but counted in the general contexts as well.
matches.push(fixture('demo-h2h-1','2025-09-18',previous,demoHome,demoAway,16,10,5,3,5,4));
matches.push(fixture('demo-h2h-2','2025-12-10',previous,demoHome,demoAway,12,13,3,4,4,6));
matches.push(fixture('demo-h2h-3','2026-10-21',current,demoHome,demoAway,13,11,4,3,6,5));
export const demoFourContextData:Data={teams,matches};
export const demoFourContextFixture:RadarFixture={
  home:demoHome,away:demoAway,date:'2026-11-08',competition:current
};
