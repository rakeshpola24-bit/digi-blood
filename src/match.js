// Shared helpers: blood compatibility, request links/messages, donor ranking (used by the app and #admin).
export const CAN_RECEIVE_FROM={'A+':['A+','A-','O+','O-'],'A-':['A-','O-'],'B+':['B+','B-','O+','O-'],'B-':['B-','O-'],'AB+':['A+','A-','B+','B-','AB+','AB-','O+','O-'],'AB-':['A-','B-','AB-','O-'],'O+':['O+','O-'],'O-':['O-']};
export const clean=s=>String(s||'').replace(/[~\n\r]/g,' ').trim();
export function helpLink(r){return location.origin+location.pathname+'#help='+encodeURIComponent([r.name,r.age||'',r.gender||'',r.units,r.bg,r.hospital,r.area,r.phone,r.urgency].map(clean).join('~'));}
export function parseHelp(hash){
  try{const p=decodeURIComponent(hash.slice(6)).split('~');if(p.length<9)return null;
    const[name,age,gender,units,bg,hospital,area,phone,urgency]=p;if(!CAN_RECEIVE_FROM[bg]||!/^\d{10}$/.test(phone))return null;
    return{name,age,gender,units,bg,hospital,area,phone,urgency};}catch(e){return null;}
}
export const URG_TEXT={critical:'CRITICAL - needed immediately',urgent:'Urgent - within a few hours',routine:'Routine - scheduled'};
export function patientLine(r){return [r.name,r.age?r.age+' yrs':'',r.gender].filter(Boolean).join(', ');}
export function helpMessage(r){
  return `🩸 Blood needed - ${r.bg}\n\nPatient: ${patientLine(r)}\nUnits: ${r.units}\nHospital: ${r.hospital}, ${r.area}\nUrgency: ${URG_TEXT[r.urgency]||''}\nWho can give: ${CAN_RECEIVE_FROM[r.bg].join(', ')}\n\nIf you can donate (and have not donated in the last 3 months), tap here to check and reply:\n${helpLink(r)}\n\nPlease forward to a friend who may help. - Vizag Volunteers Digi Blood`;
}
// Donors recorded as donated in the last 3 months are skipped.
export const RECENT='lt3';
// prox: {area: km from the patient}. Higher score = better match.
export function rankDonors(req,donors,prox={}){
  const ok=CAN_RECEIVE_FROM[req.bg]||[];
  const reqArea=(req.area||'').toLowerCase();
  return donors.filter(d=>d.status==='approved'&&ok.includes(d.bg)&&d.lastDonation!==RECENT).map(d=>{
    let s=0;const why=[];
    if(d.bg===req.bg){s+=30;why.push('same group');}else{s+=15;why.push('compatible');}
    const a=(d.area||'').toLowerCase();let km=a&&a===reqArea?0:prox[d.area];
    if(km==null)km=99;
    s+=km<=0?30:km<=3?22:km<=8?12:km<=15?5:0;
    if(km===0)why.push('same area');else if(km<99)why.push('~'+km+' km');
    s+=({gt6:10,lt6:4,first:3})[d.lastDonation]||0;
    return{...d,score:s,km,why};
  }).sort((a,b)=>b.score-a.score);
}
