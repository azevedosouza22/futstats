declare const __FUTSTATS_BUILD_SHA__:string;
export const clientBuild=typeof __FUTSTATS_BUILD_SHA__==='string'?__FUTSTATS_BUILD_SHA__:'unknown';
export function safeBuild(value:unknown){return typeof value==='string'&&/^[a-f0-9]{40}$/i.test(value)?value:value==='local'?'local':'unknown';}
export function shortBuild(value:string){return value==='unknown'?'Não informado':value==='local'?'local':value.slice(0,7);}
