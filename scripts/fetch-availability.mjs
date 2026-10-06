// Pulls Visakhapatnam blood stock from eRaktKosh (public MoHFW portal) into public/availability.json
import {writeFileSync,existsSync} from 'node:fs';
const url='https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/nearbyBB.cnt?hmode=GETNEARBYSTOCKDETAILS&stateCode=28&districtCode=544&bloodGroup=all&bloodComponent=11&lang=0';
try{
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});
  const j=await r.json();
  if(!Array.isArray(j.data)||!j.data.length)throw new Error('empty');
  j.fetchedAt=new Date().toISOString();
  writeFileSync('public/availability.json',JSON.stringify(j));
  console.log('rows',j.data.length);
}catch(e){console.log('fetch failed, keeping existing file:',e.message);}
