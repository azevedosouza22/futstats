import csv,json,pathlib,hashlib,datetime,collections,math,statistics,re
import numpy as np
P=pathlib.Path(__file__).parent;O=P/'out';S=P/'source'
def read(p):return list(csv.DictReader(open(p,encoding='utf-8-sig')))
def dump(n,x): (O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False))
def csvout(n,rs):
 if not rs:return
 with open(O/n,'w',encoding='utf-8-sig',newline='') as f:w=csv.DictWriter(f,fieldnames=list(rs[0]));w.writeheader();w.writerows(rs)
def fnum(v):
 try:
  n=float(v);return n if math.isfinite(n) and n>=0 else None
 except:return None
M={'Gols':'gols','Finalizações':'finalizacoes','Chutes no gol':'chutes_no_alvo','Escanteios':'escanteios'};PER={'FT':'jogo','1T':'1t','2T':'2t'}
base=read(P.parent/'cp04/BASE_EXPERIMENTAL_CP16_5732_55COL.csv');assert len(base)==5732
assert hashlib.sha256((P.parent/'cp04/BASE_EXPERIMENTAL_CP16_5732_55COL.csv').read_bytes()).hexdigest()=='1982fbc1e074a6a722cc9947cc023ec2520a6df2321f31b366716590bbf35423'
byid={r['id_fonte']:r for r in base};direct=json.load(open(O/'FLASHScore_24x2_DIRETO.json'))
pres=[]
for slug in ['SPFC-REMO','ALFAYSALY-DIRIYAH']:pres+=read(S/f'PREJOGO_ESTUDOS__F360-PRE-20261126-{slug}-12_INDICADORES.csv')
prelim=read(S/'POSJOGO__F360-POS-20261126-PREL-COND__AUDITORIA_24_PRELIMINAR.csv');aud=[];increment=[]
for j in direct:
 vals=j['values'];assert len(vals)==3 and all(len(v)==8 for v in vals)
 assert all(vals[0][i]==vals[1][i]+vals[2][i] for i in range(8))
 assert all(v[4]<=v[2] and v[5]<=v[3] for v in vals)
 r={k:'' for k in base[0]};r.update(id_fonte=j['id'],tipo_amostra='BASE_EXPERIMENTAL_F360_PESQUISA',equipe_amostra='N/D',competicao=j['competicao'],data=j['data'],data_titulo_fonte=j['titulo_data'],hora_exibida_fonte=j['hora'],fuso_horario_fonte='America/Sao_Paulo',divergencia_data='nao',mandante=j['mandante'],visitante=j['visitante'],fonte='Flashscore — leitura direta CP17 fechamento26NOV',url_fonte=j['urls'][0],url_fonte_1t=j['urls'][1],url_fonte_2t=j['urls'][2],url_fonte_gols_por_tempo=j['urls'][0].split('resumo/estatisticas/')[0]+'?mid='+j['id'],sofascore_status='NAO_CONSULTADO',observacoes=j['metodo']+' Consulta UTC '+j['consulta']+'. Só pesquisa; sem alteração de produção ou previsão.')
 for pi,(per,suffix) in enumerate(PER.items()):
  for mi,(m,k) in enumerate(M.items()):
   h,a=vals[pi][mi*2:mi*2+2]
   for side,v in [('mandante',h),('visitante',a),('total',h+a)]:r[f'{k}_{side}_{suffix}']=str(v)
   pre=next(x for x in pres if x['mandante']==j['mandante'] and x['periodo']==per and x['mercado']==m);line=fnum(pre['linha']);result='ABSTER' if line is None else 'ACERTO' if h+a>line else 'ERRO'
   old=next(x for x in prelim if x['jogo'].startswith(j['mandante']) and x['periodo']==per and x['mercado']==m)
   aud.append(dict(registro_prejogo_id=pre['registro_id'],jogo_id=j['id'],data_brt=j['data'],jogo=j['mandante']+' × '+j['visitante'],mercado=m,periodo=per,direcao_original=pre['direcao'],linha_original=pre['linha'],media_original=pre['media'],margem_original=pre['margem'],elite_original=pre['elite_documental'],sdd_original=pre['sdd'],mandante_real=h,visitante_real=a,total_real=h+a,resultado=result,resultado_preliminar=old['resultado'],total_preliminar=old['total_real'],delta_total=(h+a)-float(old['total_real']),qualidade='FLASHScore_DIRETO_24_DE_24',fonte=j['urls'][pi],consulta_utc=j['consulta'],prospectivo_nativo='NAO',aposta_executada='NAO_INFERIR'))
 if j['id'] in byid:
  assert all(byid[j['id']][k]==r[k] for k in r if any(k.startswith(m+'_') for m in M.values()))
 else:increment.append(r)
csvout('AUDITORIA_24_FINAL.csv',aud);csvout('INCREMENTAL_CP17_2_55COL.csv',increment);csvout(f'BASE_EXPERIMENTAL_CP17_{len(base)+len(increment)}_55COL.csv',base+increment)
def agg(rs,keys,filename):
 groups=collections.defaultdict(list)
 for r in rs:groups[tuple(r[k] for k in keys)].append(r)
 out=[]
 for key,vs in groups.items():
  n=sum(v['resultado'] in ['ACERTO','ERRO'] for v in vs);a=sum(v['resultado']=='ACERTO' for v in vs)
  out.append(dict(zip(keys,key))|{'celulas':len(vs),'acertos':a,'erros':n-a,'abster':sum(v['resultado']=='ABSTER' for v in vs),'nd':sum(v['resultado']=='N_D' for v in vs),'taxa':round(a/n*100,4) if n else None})
 csvout(filename,out);return out
for keys,name in [(['jogo'],'JOGOS'),(['mercado'],'MERCADOS'),(['periodo'],'PERIODOS'),(['mercado','periodo'],'MERCADO_PERIODO')]:agg(aud,keys,'DESEMPENHO_'+name+'.csv')
for r in aud:r['grupo']='ELITE_DOCUMENTAL' if r['elite_original']=='SIM' else 'LV4_CONVENCIONAL'
agg(aud,['grupo'],'DESEMPENHO_GRUPOS.csv')
# Reconstituição auditável dos 10 IDs congelados, sem substituir a seleção histórica.
hist=read(S/'PREJOGO_ESTUDOS__F360-PRE-20261126-SPFC-REMO-10_HISTORICOS.csv');histfull=[byid[r['id_fonte']] for r in hist];assert len({r['id_fonte'] for r in histfull})==10
def tot(r,m,p):return fnum(r.get(m+'_total_'+p,''))
diagnostics=[];historylong=[]
for pick in [x for x in aud if x['jogo_id']=='tlP20OtQ']:
 m=M[pick['mercado']];per=PER[pick['periodo']];line=fnum(pick['linha_original']);pool=[tot(r,m,per) for r in histfull];assert all(v is not None for v in pool);mean=round(sum(pool)/len(pool),1);assert abs(mean-float(pick['media_original']))<.051
 if line is not None:assert sum(v>line for v in pool)==int(next(x for x in pres if x['registro_id']==pick['registro_prejogo_id'] and x['mercado']==pick['mercado'] and x['periodo']==pick['periodo'])['ocorrencias'])
 d={'mercado':pick['mercado'],'periodo':pick['periodo'],'linha':line,'media_pool':mean,'desvio_padrao':round(statistics.stdev(pool),4),'real':pick['total_real'],'real_menos_media':round(pick['total_real']-mean,3),'real_menos_linha':round(pick['total_real']-line,3) if line is not None else None,'media_ultimos3_por_equipe':None,'resultado':pick['resultado']}
 for team,role in [('São Paulo','mandante'),('Remo','visitante')]:
  rr=sorted([r for r in histfull if team in [r['mandante'],r['visitante']]],key=lambda r:r['data']);vv=[tot(r,m,per) for r in rr];venue=[r for r in rr if r[role]==team];tag='sp' if team=='São Paulo' else 'remo'
  d.update({tag+'_n':len(rr),tag+'_media_total':round(statistics.mean(vv),3),tag+'_taxa_na_linha':sum(v>line for v in vv)/len(vv) if line is not None else None,tag+'_media_ultimos3':round(statistics.mean(vv[-3:]),3),tag+'_media_primeiros2':round(statistics.mean(vv[:2]),3),tag+'_n_mesmo_mando':len(venue),tag+'_media_total_mesmo_mando':round(statistics.mean([tot(r,m,per) for r in venue]),3),tag+'_media_propria':round(statistics.mean([fnum(r[m+'_'+('mandante' if r['mandante']==team else 'visitante')+'_'+per]) for r in rr]),3),tag+'_ids':'|'.join(r['id_fonte'] for r in rr)})
  for r,v in zip(rr,vv):historylong.append({'equipe':team,'id':r['id_fonte'],'data':r['data'],'mandante':r['mandante'],'visitante':r['visitante'],'mando':('casa' if r['mandante']==team else 'fora'),'mercado':pick['mercado'],'periodo':pick['periodo'],'total':v,'linha':line,'acima_linha':(v>line) if line is not None else None})
 d['media_ultimos3_por_equipe']=round((d['sp_media_ultimos3']+d['remo_media_ultimos3'])/2,3);diagnostics.append(d)
csvout('AUDITORIA_ERROS_E_AMOSTRA.csv',diagnostics);csvout('HISTORICOS_10_DETALHADOS.csv',historylong)
# Fechamentos anteriores: manter classes documentais e exclusões originais.
previous=[]
for r in read(S/'previous1920.csv'):
 previous.append({'data':r['data_evento_brt'],'jogo':r['confronto'],'id':r['jogo_id'],'mercado':{'gols':'Gols','finalizacoes':'Finalizações','chutes_no_gol':'Chutes no gol','chutes_no_alvo':'Chutes no gol','escanteios':'Escanteios'}.get(r['mercado'],r['mercado']),'periodo':r['periodo'],'resultado':r['status'],'elite':str(r['elite_original']).lower()=='true','grupo':'ELITE_DOCUMENTAL' if str(r['elite_original']).lower()=='true' else 'LV4_CONVENCIONAL'})
for day,count in [('21','204'),('22','132')]:
 for r in read(S/f'POSJOGO__F360-POS-202611{day}-FINAL-COND__AUDITORIA_{count}.csv'):
  previous.append({'data':'2026-11-'+day,'jogo':r['confronto'],'id':r['flashscore_id'],'mercado':r['mercado'],'periodo':r['periodo'],'resultado':r['resultado'],'elite':str(r['elite']).lower()=='true','grupo':'ELITE_DOCUMENTAL' if str(r['elite']).lower()=='true' else 'LV4_CONVENCIONAL'})
for r in read(S/'POSJOGO__F360-POS-20261123-FINAL-COND__AUDITORIA_96.csv'):
 if r['tipo_contagem']!='INCLUIDO_ESTUDO_OBSERVAR':continue
 e=str(r['elite_provisorio']).lower()=='true'
 previous.append({'data':'2026-11-23','jogo':r['jogo'],'id':r['id_alvo_resolvido'],'mercado':{'shots':'Finalizações','goals':'Gols','target':'Chutes no gol','corners':'Escanteios'}[r['mercado']],'periodo':{'full':'FT','first':'1T','second':'2T'}[r['periodo']],'resultado':r['resultado'],'elite':e,'grupo':'ELITE_DOCUMENTAL' if e else 'LV4_CONVENCIONAL'})
for r in aud:previous.append({'data':'2026-11-26','jogo':r['jogo'],'id':r['jogo_id'],'mercado':r['mercado'],'periodo':r['periodo'],'resultado':r['resultado'],'elite':r['elite_original']=='SIM','grupo':r['grupo']})
for r in previous:r['recorte']='26NOV' if r['data']=='2026-11-26' else '19A23NOV'
csvout('FECHAMENTOS_NORMALIZADOS.csv',previous)
agg(previous,['recorte','mercado','periodo'],'COMPARACAO_HISTORICA_MERCADO_PERIODO.csv');agg(previous,['data','grupo'],'COMPARACAO_HISTORICA_ELITE_LV4.csv');agg(previous,['recorte','grupo'],'COMPARACAO_HISTORICA_GRUPOS.csv')
# Backtest temporal documental. O CP16 é fonte fixa, mas NÃO é base vintage prospectiva.
aliases={'Brasileirão':'Brasileirão Série A 2026','Argentina':'Primera División Argentina 2026','Bundesliga':'Bundesliga 2026/27','Eliteserien':'Eliteserien Noruega 2026','La Liga':'La Liga espanhola 2026/27','Ligue 1':'Ligue 1 francesa 2026/27','MLS':'MLS 2026','Premier League':'Premier League inglesa 2026/27','Saudi Pro League':'Saudi Pro League 2026/27','Serie A italiana':'Serie A italiana 2026/27'}
lines={'FT':{'Finalizações':[20.5,22.5,24.5,26.5],'Escanteios':[6.5,7.5,8.5,9.5],'Chutes no gol':[5.5,6.5,7.5,8.5],'Gols':[1.5,2.5,3.5]},'1T':{'Finalizações':[8.5,10.5,12.5],'Escanteios':[2.5,3.5,4.5,5.5],'Chutes no gol':[2.5,3.5,4.5],'Gols':[.5,1.5,2.5]},'2T':{'Finalizações':[9.5,11.5,13.5],'Escanteios':[2.5,3.5,4.5,5.5],'Chutes no gol':[2.5,3.5,4.5],'Gols':[.5,1.5,2.5]}}
histories=collections.defaultdict(list);replay=[];elig=[];excluded=[]
def normalized(r):return aliases.get(r['competicao'],r['competicao'])
def valid_reg(r):
 if r['id_fonte']=='tMgLJeAF':return False
 if 'all-star' in (r['mandante']+' '+r['visitante']+' '+r['observacoes']).lower():return False
 for m in M.values():
  for side in ['mandante','visitante']:
   vs=[fnum(r.get(f'{m}_{side}_{p}')) for p in ['jogo','1t','2t']]
   if all(x is not None for x in vs) and abs(vs[0]-vs[1]-vs[2])>1e-6:return False
 return True
allrows=sorted(base,key=lambda r:(r['data'],r['id_fonte']))
for date,g in __import__('itertools').groupby(allrows,key=lambda r:r['data']):
 daily=list(g)
 for r in daily:
  league=normalized(r)
  if date>'2026-11-23' or league=='Liga Europa' or not valid_reg(r):excluded.append({'id':r['id_fonte'],'data':date,'reason':'fora_corte_ou_qualidade_regulamentar'});continue
  hs=histories[(league,r['mandante'])][-5:];aws=histories[(league,r['visitante'])][-5:];pool=list({x['id_fonte']:x for x in hs+aws}.values())
  if len(hs)<5 or len(aws)<5 or len(pool)<8:continue
  assert all(x['data']<date for x in pool);assert r['id_fonte'] not in {x['id_fonte'] for x in pool}
  cohort='DEVELOPMENT' if date<='2026-09-30' else 'VALIDATION' if date<='2026-11-17' else 'SECONDARY'
  gap=max((datetime.date.fromisoformat(date)-datetime.date.fromisoformat(x[-1]['data'])).days for x in [hs,aws]);elig.append({'id':r['id_fonte'],'data':date,'cohort':cohort})
  for per in PER:
   for market in M:
    vv=[tot(x,M[market],PER[per]) for x in pool];vs=[x for x in vv if x is not None];real=tot(r,M[market],PER[per]);selected=None
    if len(vs)>=8:
     choices=[l for l in lines[per][market] if sum(v>l for v in vs)/len(vs)>=.7];selected=choices[-1] if choices else None
    if selected is None or real is None:continue
    mean=math.floor(statistics.mean(vs)*10+.5)/10;support=[]
    for teamhist in [hs,aws]:
     tv=[tot(x,M[market],PER[per]) for x in teamhist];support.append(sum(v is not None and v>selected for v in tv)/5)
    h1=gap<=21;h2=min(support)>=.6;h3=(mean-selected)/selected>=.1
    replay.append({'id':r['id_fonte'],'data':date,'liga':league,'cohort':cohort,'mercado':market,'periodo':per,'linha':selected,'mean':mean,'real':real,'acerto':int(real>selected),'observed':len(vs),'max_gap_days':gap,'support_home':support[0],'support_away':support[1],'H1':int(h1),'H2':int(h2),'H3':int(h3),'H123':int(h1 and h2 and h3),'history_ids':'|'.join(x['id_fonte'] for x in pool)})
 for r in daily:
  if valid_reg(r):
   for team in [r['mandante'],r['visitante']]:histories[(normalized(r),team)].append(r)
csvout('BACKTEST_SINAIS.csv',replay);csvout('BACKTEST_JOGOS_ELEGIVEIS.csv',elig);csvout('BACKTEST_EXCLUSOES.csv',excluded)
summary=[];detail=[];rng=np.random.default_rng(20261127)
for cohort in ['DEVELOPMENT','VALIDATION','SECONDARY']:
 rr=[r for r in replay if r['cohort']==cohort];eg=[r for r in elig if r['cohort']==cohort];base_a=sum(r['acerto'] for r in rr)
 for candidate in ['BASELINE','H1','H2','H3','H123']:
  kept=rr if candidate=='BASELINE' else [r for r in rr if r[candidate]];a=sum(r['acerto'] for r in kept);ci=None
  if candidate!='BASELINE' and kept:
   gameids=sorted({r['id'] for r in rr});gi={k:i for i,k in enumerate(gameids)};arr=np.zeros((len(gameids),4))
   for r in rr:
    i=gi[r['id']];arr[i,0]+=1;arr[i,1]+=r['acerto']
    if r[candidate]:arr[i,2]+=1;arr[i,3]+=r['acerto']
   dif=[]
   for z in range(2000):
    v=arr[rng.integers(0,len(arr),len(arr))].sum(axis=0)
    if v[2]>0:dif.append(100*(v[3]/v[2]-v[1]/v[0]))
   ci=[round(float(x),4) for x in np.percentile(dif,[2.5,97.5])]
  summary.append({'cohort':cohort,'candidate':candidate,'eligible_games':len(eg),'games_with_signals':len({r['id'] for r in kept}),'signals':len(kept),'hits':a,'errors':len(kept)-a,'accuracy_pct':round(a/len(kept)*100,4) if kept else None,'coverage_pct':round(len(kept)/len(rr)*100,4),'retained_hits':a,'lost_hits':base_a-a,'avoided_errors':len(rr)-base_a-(len(kept)-a),'delta_accuracy_pp':round((a/len(kept)-base_a/len(rr))*100,4) if kept else None,'delta_ci95_cluster':json.dumps(ci)})
  for market in M:
   for per in PER:
    rs=[r for r in kept if r['mercado']==market and r['periodo']==per];hits=sum(r['acerto'] for r in rs);detail.append({'cohort':cohort,'candidate':candidate,'mercado':market,'periodo':per,'signals':len(rs),'hits':hits,'errors':len(rs)-hits,'accuracy_pct':round(hits/len(rs)*100,4) if rs else None})
csvout('BACKTEST_RESUMO.csv',summary);csvout('BACKTEST_MERCADO_PERIODO.csv',detail)
dump('RESULTADO_CHECKPOINT.json',{'base_before':len(base),'base_after':len(base)+len(increment),'new_ids':[r['id_fonte'] for r in increment],'direct_values':48,'derived_values':0,'counts':dict(collections.Counter(r['resultado'] for r in aud)),'elite_counts':dict(collections.Counter(r['resultado'] for r in aud if r['elite_original']=='SIM')),'changed_outcomes':[r for r in aud if r['resultado']!=r['resultado_preliminar']],'changed_values':[r for r in aud if r['delta_total']!=0],'sha256_base':hashlib.sha256((O/f'BASE_EXPERIMENTAL_CP17_{len(base)+len(increment)}_55COL.csv').read_bytes()).hexdigest(),'backtest_rows':len(replay),'backtest_summary':summary,'old_snapshots_untouched':True,'native_TS_execution':False,'merge':False,'deploy':False})
print(json.dumps({'counts':dict(collections.Counter(r['resultado'] for r in aud)),'changed_outcomes':[(r['jogo'],r['mercado'],r['periodo']) for r in aud if r['resultado']!=r['resultado_preliminar']],'backtest_summary':[x for x in summary if x['candidate'] in ['BASELINE','H123']],'diagnostic_errors':[{k:r[k] for k in ['mercado','periodo','media_pool','real','sp_media_total','remo_media_total','sp_taxa_na_linha','remo_taxa_na_linha','sp_n_mesmo_mando','remo_n_mesmo_mando']} for r in diagnostics if r['resultado']=='ERRO']},ensure_ascii=False))
