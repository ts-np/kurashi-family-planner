import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlanner, acceptRevision } from '../web/model.js';
const make=()=>({move:'',total:100000,locations:['リビング'],items:[{id:'sofa',name:'ソファ',room:'リビング',cat:'家具',status:'検討中',priority:'必須',budget:60000,days:45,deadline:'',req:'幅180cm以下',notes:'搬入確認',candidates:[{name:'候補A',price:50000,url:'https://example.com/sofa',memo:'サイズを確認',selected:true}]}]});
test('Sites backup remains compatible, including candidates and custom rooms',()=>{const d=make();assert.equal(validatePlanner(d),d)});
test('stale writes are rejected rather than overwriting family edits',()=>{assert.doesNotThrow(()=>acceptRevision(5,5));assert.throws(()=>acceptRevision(6,5),e=>e.code==='conflict')});
test('malformed or unsafe records are rejected',()=>{for(const alter of [d=>d.items.push(d.items[0]),d=>d.items[0].candidates[0].url='javascript:alert(1)',d=>d.items[0].budget=-1,d=>d.items[0].room='存在しない場所',d=>d.items[0].candidates[0]=null,d=>d.locations=[],d=>d.items[0].req=null]){const d=make();alter(d);assert.throws(()=>validatePlanner(d))}});
