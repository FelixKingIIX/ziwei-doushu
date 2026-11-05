/**
 * Purely local, deterministic Ziwei commentary. No AI, fetch, API key or backend.
 * This is an educational traditional-culture interpretation, not a prediction.
 */
import type { ZiweiChart, Palace, Star } from './ziwei/types';

const STAR: Record<string, string> = {
  '紫微':'传统象征统筹、责任与组织能力，宜留意独断与沟通',
  '天机':'传统象征思考、谋划与适应变化，宜留意反复权衡',
  '太阳':'传统象征外向、付出与公开表达，宜留意精力分配',
  '武曲':'传统象征执行、纪律与资源管理，宜留意过于刚硬',
  '天同':'传统象征温和、协调与生活情趣，宜留意安逸和拖延',
  '廉贞':'传统象征原则、界限与人际张力，宜留意情绪化判断',
  '天府':'传统象征稳健、储备与管理，宜留意求稳造成迟疑',
  '太阴':'传统象征细致、内省与积累，宜留意过度担忧',
  '贪狼':'传统象征兴趣、人缘与多元尝试，宜留意分心',
  '巨门':'传统象征分析、表达与质疑，宜留意误解和争执',
  '天相':'传统象征协调、公正与规范，宜留意迎合他人',
  '天梁':'传统象征照拂、原则与经验，宜留意承担过多',
  '七杀':'传统象征决断、突破与压力应对，宜留意冒进',
  '破军':'传统象征调整、革新与重新开始，宜留意变动成本',
};

const PALACE: Record<string, { title: string; concern: string; action: string }> = {
  '命宫':{title:'命格与自我',concern:'性格倾向、行动方式与自我认识',action:'结合实际经历检验个人长处，避免用命盘限定自己'},
  '兄弟宫':{title:'手足与伙伴',concern:'手足、同辈与合作互动',action:'重视沟通边界与互相支持'},
  '夫妻宫':{title:'亲密关系',concern:'亲密关系中的期待、沟通与协商',action:'以具体行为、尊重和沟通处理关系，而非依赖命盘下结论'},
  '子女宫':{title:'子女与带领',concern:'教养、照顾和带领较年轻成员的方式',action:'尊重个体差异与真实需求'},
  '财帛宫':{title:'资源与财务',concern:'资源使用、收支观念与工作回报',action:'以实际预算、风险承受能力和财务记录做决策'},
  '疾厄宫':{title:'健康与习惯',concern:'日常身心照护与生活节奏',action:'优先根据体检、症状和专业医嘱安排健康管理'},
  '迁移宫':{title:'外出与环境',concern:'外部环境、迁动和公共活动',action:'评估真实机会、成本与安全条件'},
  '交友宫':{title:'朋友与团队',concern:'朋友、合作伙伴与团队关系',action:'用长期合作表现判断可信度'},
  '仆役宫':{title:'朋友与团队',concern:'朋友、合作伙伴与团队关系',action:'用长期合作表现判断可信度'},
  '官禄宫':{title:'事业与职责',concern:'职业路径、承担责任与任务方式',action:'以个人能力、岗位要求和现实机会规划职业'},
  '田宅宫':{title:'居住与积累',concern:'居住环境、家庭资源与长期积累',action:'根据需求与现金流规划居住安排'},
  '福德宫':{title:'精神与生活',concern:'兴趣、休息、情绪调适与内在满足',action:'为休息和支持关系保留空间'},
  '父母宫':{title:'长辈与支持',concern:'长辈、指导关系和代际沟通',action:'以具体交往事实理解双方'},
};
const normalize = (s: string) => s.endsWith('宫') ? s : s+'宫';
const palace = (chart: ZiweiChart, name: string): Palace | undefined =>
  chart.palaces.find(p => normalize(p.name) === normalize(name) ||
    (['交友宫','仆役宫'].includes(normalize(name)) && ['交友宫','仆役宫'].includes(normalize(p.name))));
const major = (p: Palace) => p.stars.filter(s=>s.type==='major');
const list = (p: Palace) => {
  const stars=major(p);
  return stars.length ? stars.map(s=>s.name+(s.brightnessRaw?'（'+s.brightnessRaw+'）':'')+(s.siHua?'化'+s.siHua:'')).join('、')
    : '无本宫主星（传统看法可参考对宫，但不能照搬判断）';
};
const starMeaning = (s: Star) => STAR[s.name] || '可结合所在宫位与整体结构作象征性理解';
const describe = (p?: Palace): string => {
  if(!p) return '本盘未找到对应宫位。';
  const stars=major(p);
  const topic=PALACE[normalize(p.name)] || PALACE['命宫'];
  const details=stars.length
    ? stars.map(s=>'【'+s.name+'】'+starMeaning(s)).join('；')
    : '该宫无主星，可参考对宫和三方宫位，不宜只凭空宫断言。'+
      (p.borrowedStars?.length ? '对宫可参考：'+p.borrowedStars.join('、')+'。' : '');
  const sihua=p.stars.filter(s=>s.siHua).map(s=>s.name+'化'+s.siHua);
  const good=p.stars.filter(s=>['左辅','右弼','文昌','文曲','天魁','天钺'].includes(s.name)).map(s=>s.name);
  const sha=p.stars.filter(s=>['擎羊','陀罗','火星','铃星','地空','地劫'].includes(s.name)).map(s=>s.name);
  return '**【'+topic.title+'·盘面依据】**\n'+
    '宫位：'+normalize(p.name)+'；主星：'+list(p)+'。\n'+
    '关注主题：'+topic.concern+'。\n\n'+
    '**【传统星曜解释】**\n'+details+'\n\n'+
    '**【辅星与四化】**\n'+
    (sihua.length?'本宫四化：'+sihua.join('、')+'。':'本宫未标注本命四化。')+
    (good.length?' 辅助星：'+good.join('、')+'。':'')+
    (sha.length?' 煞曜：'+sha.join('、')+'（象征困难因素，不表示必然发生负面事件）。':'')+'\n\n'+
    '**【可执行建议】**\n'+topic.action+'。';
};
const related=(chart:ZiweiChart,p:Palace):string => {
  const branches=[(p.branch+4)%12,(p.branch+8)%12,(p.branch+6)%12];
  const ps=branches.map(b=>chart.palaces.find(x=>x.branch===b)).filter((x):x is Palace=>!!x);
  return ps.map(x=>normalize(x.name)+'（'+list(x)+'）').join('；');
};
const daxian=(chart:ZiweiChart):string=>{
 const d=chart.daXians?.[chart.currentDaXianIndex];
 if(!d)return '当前大限数据未提供，不推断十年运势。';
 return '当前大限：'+d.startAge+'—'+d.endAge+'岁，落'+normalize(d.palaceName)+'。'+
   (d.siHua ? '大限四化：化禄'+d.siHua.lu+'、化权'+d.siHua.quan+'、化科'+d.siHua.ke+'、化忌'+d.siHua.ji+'。':'')+
   '这里只说明盘面位置，不代表未来事件必然发生。';
};
const disclaimer='**【阅读说明】**\n本内容依据当前排盘与固定规则生成，属于传统文化学习材料，不具备预测个人命运、诊断疾病或判断投资收益的科学依据。';
const choose = (text:string):string=>{
 if(/【(命|夫妻|官禄|财帛|疾厄|田宅|迁移|福德|父母|兄弟|子女|交友|仆役)宫】/.test(text)){
   return text.match(/【([^】]+宫)】/)?.[1] || '命宫';
 }
 if(/感情|婚姻|伴侣|夫妻/.test(text)) return '夫妻宫';
 if(/事业|工作|职业|官禄/.test(text)) return '官禄宫';
 if(/财富|财运|理财|赚钱|收入|财帛/.test(text)) return '财帛宫';
 if(/健康|疾病|疾厄|身体/.test(text)) return '疾厄宫';
 if(/性格|命格|命宫|主星/.test(text)) return '命宫';
 if(/住|房|田宅/.test(text)) return '田宅宫';
 if(/朋友|社交|交友/.test(text))return '交友宫';
 return '命宫';
};
export function interpretChart(chart:ZiweiChart, messages:{role:'user'|'assistant';content:string}[]):string{
 if(!chart || chart.palaces?.length!==12) return '命盘数据不完整，无法生成规则解释。';
 const prompt=[...messages].reverse().find(m=>m.role==='user')?.content || '命格';
 const key=choose(prompt),p=palace(chart,key);
 if(!p)return '未找到'+key+'，请检查命盘数据。';
 const trend=/流年|大限|当下|现在|今年/.test(prompt);
 const leading='**【本次解读】**\n已使用本地规则匹配'+normalize(p.name)+'，无网络请求、无AI生成。\n\n';
 const four='\n\n**【三方四正】**\n'+related(chart,p)+'。单宫星曜须结合这些宫位整体理解。';
 const luck='\n\n**【大限资料】**\n'+daxian(chart);
 const extra=/化[禄权科忌]|四化/.test(prompt)
  ? '\n\n**【四化说明】**\n化禄常作资源与机会象征，化权作责任与推动，化科作学习与名誉，化忌作阻力与反思；应结合具体星曜与落宫，不应机械断吉凶。'
  : '';
 return leading+describe(p)+four+(trend||key==='命宫'?luck:'')+extra+'\n\n'+disclaimer;
}
export function interpretHeming(a:ZiweiChart,b:ZiweiChart,question?:string):string{
 if(!a||!b||a.palaces?.length!==12||b.palaces?.length!==12)return '双方命盘不完整，请重新排盘。';
 const aM=palace(a,'命宫'),bM=palace(b,'命宫'),aF=palace(a,'夫妻宫'),bF=palace(b,'夫妻宫');
 const score=(aP?:Palace,bP?:Palace)=> {
   if(!aP||!bP)return '数据不足';
   const common=major(aP).map(s=>s.name).filter(name=>major(bP).some(s=>s.name===name));
   return common.length?'双方均出现'+common.join('、')+'等主星主题，可讨论相似处与分工':'双方主星组合不同，可交流各自的沟通与处事习惯';
 };
 return '**【双方盘面】**\n甲方命宫：'+(aM?list(aM):'无')+'；夫妻宫：'+(aF?list(aF):'无')+'。\n'+
  '乙方命宫：'+(bM?list(bM):'无')+'；夫妻宫：'+(bF?list(bF):'无')+'。\n\n'+
  '**【传统命宫对照】**\n'+score(aM,bM)+'。\n\n'+
  '**【甲方关系主题】**\n'+describe(aF)+'\n\n'+
  '**【乙方关系主题】**\n'+describe(bF)+'\n\n'+
  '**【相处建议】**\n沟通双方对责任、边界与生活节奏的期待；遇到分歧优先关注实际行为。'+
  (question?'\n提问：'+question.slice(0,150)+'。本地规则只能提供固定主题解读，不能理解复杂追问。':'')+
  '\n\n'+disclaimer;
}
