/**
 * Radar V4 — purely hypothetical odds/value calculator.
 * No odds feeds, no auto betting and no projection derived from raw historical frequency.
 * A historical frequency such as 7/10 is NOT a calibrated future probability.
 */
export type OddsValueResult={
 status:'invalid_odds'|'invalid_stake'|'missing_probability'|'invalid_probability'|
  'positive'|'negative'|'neutral';
 odd:number|null;stake:number|null;probability:number|null;breakEvenPercent:number|null;
 edgePoints:number|null;expectedRoiPercent:number|null;expectedProfit:number|null;
 winningReturn:number|null;winningProfit:number|null;losingProfit:number|null;
};
function numberPtBR(raw:string):number|null{
 const input=raw.trim();
 if(!/^\\d+(?:[.,]\\d+)?$/.test(input))return null;
 const n=Number(input.replace(',','.'));
 return Number.isFinite(n)?n:null;
}
/** Conservative interpretation: blank = not supplied, malformed never defaults to zero. */
export function evaluateV4OddsValue(
 oddRaw:string,probabilityRaw:string,stakeRaw:string='2'
):OddsValueResult{
 const blank:OddsValueResult={status:'invalid_odds',odd:null,stake:null,probability:null,
  breakEvenPercent:null,edgePoints:null,expectedRoiPercent:null,expectedProfit:null,
  winningReturn:null,winningProfit:null,losingProfit:null};
 const odd=numberPtBR(oddRaw);
 if(odd===null||odd<=1||odd>1000)return blank;
 const breakEvenPercent=100/odd;
 const base={...blank,odd,breakEvenPercent};
 const stake=numberPtBR(stakeRaw);
 if(stake===null||stake<=0||stake>1000000)
  return {...base,status:'invalid_stake'};
 const pre={...base,stake,winningReturn:stake*odd,winningProfit:stake*(odd-1),
  losingProfit:-stake};
 if(probabilityRaw.trim()==='')return {...pre,status:'missing_probability'};
 const percent=numberPtBR(probabilityRaw);
 if(percent===null||percent<0||percent>100)return {...pre,status:'invalid_probability'};
 const p=percent/100;
 const roi=p*odd-1;
 const status=roi>1e-10?'positive':roi< -1e-10?'negative':'neutral';
 return {...pre,status,probability:percent,edgePoints:percent-breakEvenPercent,
  expectedRoiPercent:roi*100,expectedProfit:stake*roi};
}
