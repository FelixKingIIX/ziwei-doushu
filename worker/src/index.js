// DeepSeek API proxy for GitHub Pages; deploy as a Cloudflare Worker.
const enc = new TextEncoder();
const system = "你是一名紫微斗数传统文化研究助手。按照命盘十二宫、星曜、四化、大限解释，明确民俗解读并非科学预测。不得杜撰古籍或倪海厦逐字引语，不做诊断、投资保证或确定性未来预测。用中文回答，分段简明。";
const headers = o => ({
  "Access-Control-Allow-Origin": o,
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Vary": "Origin"
});
const reply = (data, status, h) => new Response(JSON.stringify(data), {status, headers:h});
const compact = c => {
  if (!c || !Array.isArray(c.palaces) || c.palaces.length !== 12) throw Error("Invalid chart");
  return {
    birthInfo: {year:c.birthInfo?.year,month:c.birthInfo?.month,day:c.birthInfo?.day,hour:c.birthInfo?.hour,gender:c.birthInfo?.gender},
    lunarInfo:c.lunarInfo, wuxingJuName:c.wuxingJuName,currentAge:c.currentAge,
    daXians:c.daXians, currentDaXianIndex:c.currentDaXianIndex,
    palaces:c.palaces.map(p => ({
      name:p.name,branch:p.branch,stars:p.stars,selfSihua:p.selfSihua,
      daXianAge:p.daXianAge,isCurrentDaXian:p.isCurrentDaXian,borrowedStars:p.borrowedStars
    }))
  };
};
export default { async fetch(request, env) {
  const origin = env.ALLOWED_ORIGIN || "https://felixkingiix.github.io";
  const h = headers(origin);
  const path = new URL(request.url).pathname;
  if(request.method === "OPTIONS") return new Response(null,{status:204,headers:h});
  if(path === "/health") return reply({ok:true},200,h);
  if(!["/api/interpret","/api/heming"].includes(path)) return reply({error:"Not found"},404,h);
  if(request.method !== "POST") return reply({error:"Method not allowed"},405,h);
  if(request.headers.get("Origin") !== origin) return reply({error:"Origin forbidden"},403,h);
  if(!env.ACCESS_TOKEN || !env.DEEPSEEK_API_KEY) return reply({error:"Secrets not configured"},503,h);
  if(request.headers.get("Authorization") !== "Bearer "+env.ACCESS_TOKEN) return reply({error:"Unauthorized"},401,h);
  let body;
  try {
    const raw = await request.text();
    if(raw.length > 100000) return reply({error:"Too large"},413,h);
    body = JSON.parse(raw);
  } catch { return reply({error:"Invalid JSON"},400,h); }
  let messages;
  try {
    if(path === "/api/interpret") {
      const chart = compact(body.chart);
      if(!Array.isArray(body.messages) || !body.messages.length) throw Error();
      const history = body.messages.slice(-10).filter(m => ["user","assistant"].includes(m?.role) && typeof m.content === "string")
        .map(m => ({role:m.role,content:m.content.slice(0,2500)}));
      messages = [{role:"system",content:system+"\n命盘："+JSON.stringify(chart)},...history];
    } else {
      messages = [
        {role:"system",content:system+"\n双方命盘甲："+JSON.stringify(compact(body.chartA))+"\n乙："+JSON.stringify(compact(body.chartB))},
        {role:"user",content: typeof body.question==="string" ? body.question.slice(0,1500) : "请从传统文化角度分析双方相处、关系与互补之处。"}
      ];
    }
  } catch { return reply({error:"Invalid request"},400,h); }
  let upstream;
  try {
    upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method:"POST",
      headers:{"Authorization":"Bearer "+env.DEEPSEEK_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({model:env.DEEPSEEK_MODEL||"deepseek-chat",messages,stream:true,max_tokens:1800})
    });
  } catch { return reply({error:"Upstream unreachable"},502,h); }
  if(!upstream.ok || !upstream.body) return reply({error:"DeepSeek error",status:upstream.status},502,h);
  const reader=upstream.body.getReader(),decoder=new TextDecoder();
  let pending="";
  const sse = new ReadableStream({
    async start(controller) {
      try {
        while(true) {
          const {done,value}=await reader.read();
          if(done) break;
          pending+=decoder.decode(value,{stream:true});
          const lines=pending.split(/\r?\n/);pending=lines.pop()||"";
          for(const line of lines) {
            if(!line.startsWith("data:"))continue;
            const payload=line.slice(5).trim();
            if(payload==="[DONE]")continue;
            try {
              const chunk=JSON.parse(payload).choices?.[0]?.delta?.content;
              if(typeof chunk === "string" && chunk)controller.enqueue(enc.encode("data: "+JSON.stringify({delta:{text:chunk}})+"\n\n"));
            } catch {}
          }
        }
      } catch {
        controller.enqueue(enc.encode('data: {"delta":{"text":"[响应中断，请重试]"}}\n\n'));
      }
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
    cancel() { reader.cancel().catch(()=>{}); }
  });
  return new Response(sse,{status:200,headers:{...h,"Content-Type":"text/event-stream; charset=utf-8"}});
}};
