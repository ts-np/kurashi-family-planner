export function acceptRevision(actual, expected) {
  if (actual !== expected) {
    const error = new Error('家族が先に更新しました。入力をバックアップして、最新データを読み込んでください。');
    error.code = 'conflict';
    throw error;
  }
}
export function validatePlanner(d) {
  const fail=()=>{throw new Error('購入リストの形式を確認してください。')};
  const text=(v,max=20000)=>typeof v==='string'&&v.length<=max;
  const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  const date=v=>text(v,10)&&(!v||/^\d{4}-\d{2}-\d{2}$/.test(v));
  if(!d||!date(d.move)||!number(d.total)||!Array.isArray(d.locations)||!d.locations.length||d.locations.length>100||d.locations.some(r=>!text(r,100)||!r.trim())||new Set(d.locations).size!==d.locations.length||!Array.isArray(d.items)||d.items.length>2000)fail();
  const ids=new Set();
  for(const i of d.items){
    if(!i||!text(i.id,100)||!i.id||ids.has(i.id)||!text(i.name,300)||!i.name.trim()||!d.locations.includes(i.room)||!['家具','家電','雑貨'].includes(i.cat)||!['未検討','検討中','決定','購入済','不要'].includes(i.status)||!['必須','できれば','後で'].includes(i.priority)||!number(i.budget)||!number(i.days)||i.days>3650||!date(i.deadline)||!text(i.req)||!text(i.notes)||!Array.isArray(i.candidates)||i.candidates.length>100)fail();
    ids.add(i.id);
    for(const c of i.candidates){if(!c||!text(c.name,1000)||!text(c.memo)||!text(c.url,4000)||!number(c.price)||typeof c.selected!=='boolean')fail();if(c.url){try{if(!['https:','http:'].includes(new URL(c.url).protocol))fail()}catch{fail()}}}
  }
  if(new TextEncoder().encode(JSON.stringify(d)).length>850000)throw new Error('リストが大きすぎます。コメントや候補を整理してください。');
  return d;
}
