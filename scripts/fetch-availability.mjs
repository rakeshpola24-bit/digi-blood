// Pulls Visakhapatnam blood stock from eRaktKosh (public MoHFW portal) into public/availability.json
// Components: 11 = Whole Blood, 12 = Packed Red Blood Cells. Stock is summed per blood group (both are red-cell units used for transfusion).
import {writeFileSync} from 'node:fs';
const base='https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/nearbyBB.cnt?hmode=GETNEARBYSTOCKDETAILS&stateCode=28&districtCode=544&bloodGroup=all&lang=0&bloodComponent=';
const get=async c=>{const r=await fetch(base+c,{signal:AbortSignal.timeout(30000)});const j=await r.json();if(!Array.isArray(j.data)||!j.data.length)throw new Error('empty '+c);return j;};
try{
  const parts=await Promise.all(['11','12'].map(get));
  const out=parts[0];
  out.data=out.data.map((row,i)=>{
    const sums={};let newest=row[4]||'';
    for(const p of parts){
      const other=p.data.find(r=>r[1]===row[1])||p.data[i];
      if(!other)continue;
      if((other[4]||'')>newest)newest=other[4];
      for(const m of (other[3]||'').match(/[A-Za-z]+[+-]Ve:\d+/gi)||[]){const [k0,v]=m.split(':');const k=k0.replace(/ve$/i,'Ve');sums[k]=(sums[k]||0)+parseInt(v,10);}
    }
    const keys=Object.keys(sums);
    const html=keys.length?'<p class="text-success">Available, '+keys.map(k=>k+':'+sums[k]).join(', ')+'</p>':'<p class="text-danger">Not Available</p>';
    return [row[0],row[1],row[2],html,newest,row[5]];
  });
  out.fetchedAt=new Date().toISOString();
  writeFileSync('public/availability.json',JSON.stringify(out));
  console.log('rows',out.data.length);
}catch(e){console.log('fetch failed, keeping existing file:',e.message);}
