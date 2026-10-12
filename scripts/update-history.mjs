// Appends a citywide stock snapshot (per blood group) to public/history.json at most every 2 hours; keeps 14 days.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const MAP={'a+ve':'A+','a-ve':'A-','b+ve':'B+','b-ve':'B-','ab+ve':'AB+','ab-ve':'AB-','o+ve':'O+','o-ve':'O-'};
try{
  const av=JSON.parse(readFileSync('public/availability.json','utf8'));
  const g=Object.fromEntries(Object.values(MAP).map(k=>[k,0]));
  for(const row of av.data||[]){for(const m of (row[3]||'').match(/[A-Za-z]+[+-]Ve:\d+/gi)||[]){const[k,v]=m.split(':');const b=MAP[k.toLowerCase()];if(b)g[b]+=parseInt(v,10);}}
  const t=av.fetchedAt||new Date().toISOString();
  const h=existsSync('public/history.json')?JSON.parse(readFileSync('public/history.json','utf8')):{points:[]};
  const last=h.points[h.points.length-1];
  if(!last||new Date(t)-new Date(last.t)>=105*60000){
    h.points.push({t,g});
    h.points=h.points.filter(p=>new Date(t)-new Date(p.t)<=14*86400000);
    writeFileSync('public/history.json',JSON.stringify(h));console.log('history points',h.points.length);
  }else console.log('history: too soon, skipped');
}catch(e){console.log('history skipped:',e.message);}
