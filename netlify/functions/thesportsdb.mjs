import {search} from '../../server/thesportsdb.js';
export default async request => {
  if(request.method !== 'GET')return Response.json({error:'Método não permitido.'},{status:405,headers:{Allow:'GET'}});
  const result=await search(new URL(request.url).searchParams);
  return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store',...(result.status===429?{'Retry-After':'60'}:{})}});
};
