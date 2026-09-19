const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type',
  'Access-Control-Allow-Methods':'POST,OPTIONS'
};
const REGIONAL_ROUTES=new Set(['americas','europe','asia','sea']);

function json(status,body){
  return new Response(JSON.stringify(body),{
    status,
    headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
  });
}
function parseRiotId(value){
  const text=String(value??'').trim();
  const idx=text.lastIndexOf('#');
  if(idx<=0||idx===text.length-1) throw new Error('Riot ID inválido. Usá Nombre#TAG.');
  return {gameName:text.slice(0,idx).trim(),tagLine:text.slice(idx+1).trim()};
}
function routeHost(route){
  if(!REGIONAL_ROUTES.has(route)) throw new Error('Ruta regional inválida.');
  return 'https://'+route+'.api.riotgames.com';
}
async function riotFetch(url,apiKey){
  const r=await fetch(url,{headers:{'X-Riot-Token':apiKey}});
  const raw=await r.text();
  let data=null;
  try{data=raw?JSON.parse(raw):null}catch{data=raw}
  if(!r.ok){
    let msg='Riot API respondió '+r.status+'.';
    if(r.status===401) msg='Riot API rechazó la autorización (401). Revisá la API key.';
    if(r.status===403) msg='Riot API rechazó la clave (403). Probablemente venció o es inválida.';
    if(r.status===404) msg='Riot API no encontró el recurso (404).';
    if(r.status===429) msg='Límite de Riot alcanzado (429). Esperá y reintentá.';
    return {ok:false,status:r.status,msg,data,retryAfter:Number(r.headers.get('retry-after')||10)};
  }
  return {ok:true,status:r.status,data};
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST') return json(405,{error:'Método no permitido.'});
  try{
    const body=await req.json();
    const action=String(body?.action??'');
    const apiKey=String(body?.apiKey??'').trim();
    const route=String(body?.route??'americas').trim();
    if(!apiKey.startsWith('RGAPI-')) return json(400,{error:'API key inválida.'});
    if(!REGIONAL_ROUTES.has(route)) return json(400,{error:'Ruta regional inválida.'});

    let url='';
    if(action==='account'){
      const id=parseRiotId(body.riotId);
      url=routeHost(route)+'/riot/account/v1/accounts/by-riot-id/'+encodeURIComponent(id.gameName)+'/'+encodeURIComponent(id.tagLine);
    }else if(action==='matchIds'){
      const puuid=String(body.puuid??'').trim();
      const start=Math.max(0,Math.floor(Number(body.start??0)));
      const count=Math.max(1,Math.min(100,Math.floor(Number(body.count??100))));
      const params=new URLSearchParams({start:String(start),count:String(count)});
      const startTime=Number(body.startTime),endTime=Number(body.endTime);
      if(Number.isFinite(startTime)&&startTime>0) params.set('startTime',String(Math.floor(startTime)));
      if(Number.isFinite(endTime)&&endTime>0) params.set('endTime',String(Math.floor(endTime)));
      url=routeHost(route)+'/lol/match/v5/matches/by-puuid/'+encodeURIComponent(puuid)+'/ids?'+params.toString();
    }else if(action==='match'){
      url=routeHost(route)+'/lol/match/v5/matches/'+encodeURIComponent(String(body.matchId??'').trim());
    }else{
      return json(400,{error:'Acción inválida.'});
    }

    const out=await riotFetch(url,apiKey);
    if(!out.ok) return json(out.status,{error:out.msg,details:out.data,retryAfter:out.retryAfter});
    return json(200,{data:out.data});
  }catch(err){
    return json(400,{error:err instanceof Error?err.message:'Error inesperado.'});
  }
});