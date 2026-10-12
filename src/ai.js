// Gemini (free tier) through Firebase AI Logic. No API key in the code; the Firebase project holds it.
import {fbApp,LIVE} from './store.js';
const MODELS=['gemini-3.5-flash','gemini-3.5-flash-lite','gemini-2.5-flash'];
let sdk=null,acInit=false,good=0;
const RECAPTCHA_SITE_KEY='6Ld0OustAAAAACNswzs7NSjq_VZkn9Qx8PJ9sTms'; // public site key (App Check, protects the free Gemini quota)
function quota(){const k='db_ai',now=Date.now();let a=[];try{a=JSON.parse(localStorage.getItem(k)||'[]').filter(t=>now-t<3600000);}catch(e){}
  if(a.length>=30)return false;a.push(now);try{localStorage.setItem(k,JSON.stringify(a));}catch(e){}return true;}
const wait=ms=>new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms));
// input: string | parts array | {contents:[...]}. schema: (Schema)=>schema for JSON replies.
export async function gen({system,input,schema,temperature=0.2}){
  if(!LIVE||!fbApp)throw new Error('AI is not connected');
  if(!quota())throw new Error('Too many AI requests from this device. Please try again in an hour.');
  if(!sdk)sdk=await import('firebase/ai');
  if(!acInit){const ac=await import('firebase/app-check');ac.initializeAppCheck(fbApp,{provider:new ac.ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),isTokenAutoRefreshEnabled:true});acInit=true;}
  const ai=sdk.getAI(fbApp,{backend:new sdk.GoogleAIBackend()});
  let last;
  for(const name of [...MODELS.slice(good),...MODELS.slice(0,good)]){
    try{
      const cfg={temperature};if(schema){cfg.responseMimeType='application/json';cfg.responseSchema=schema(sdk.Schema);}
      const model=sdk.getGenerativeModel(ai,{model:name,generationConfig:cfg,...(system?{systemInstruction:system}:{})});
      const r=await Promise.race([model.generateContent(input),wait(35000)]);
      good=MODELS.indexOf(name);return r.response.text();
    }catch(e){last=e;}
  }
  throw last||new Error('AI unavailable');
}
export const friendly=e=>/Too many/.test(e&&e.message)?e.message:'The AI helper is busy or unavailable right now. You can still fill the details by hand.';
export function shrinkImage(file,maxSide=1600){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);
  img.onload=()=>{const sc=Math.min(1,maxSide/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',0.88).split(',')[1]);};
  img.onerror=()=>rej(new Error('Could not open this image'));img.src=u;});}
const jparse=t=>{try{return JSON.parse(t);}catch(e){const m=String(t).match(/[\[{][\s\S]*[\]}]/);return m?JSON.parse(m[0]):null;}};
// 1) Read a pasted message or photo into request fields.
export async function parseRequest({text,imageB64}){
  const parts=[];if(imageB64)parts.push({inlineData:{mimeType:'image/jpeg',data:imageB64}});
  parts.push({text:(text?'Message:\n'+text.slice(0,3000):'The photo is the request.')});
  const out=await gen({temperature:0,input:parts,
    system:'You read blood requests from pasted WhatsApp messages (English, Telugu, Hindi or mixed) and photos of hospital slips in Visakhapatnam, India. Return JSON only. Never invent details: use "" or 0 when something is not written. bg is one of A+,A-,B+,B-,AB+,AB-,O+,O-. units is the number of units/bottles. urgency is critical (emergency, immediately, now, today surgery), urgent (within hours), or routine (scheduled). phone is the contact mobile as 10 digits. area is the hospital locality in Visakhapatnam if written.',
    schema:S=>S.object({properties:{bg:S.string(),units:S.integer(),patientName:S.string(),age:S.integer(),gender:S.string(),hospital:S.string(),area:S.string(),phone:S.string(),urgency:S.string()}})});
  return jparse(out);
}
// 2) Better wording. The AI never sees the patient name, hospital, area or link: placeholders are filled in after.
export const PH=['[PATIENT]','[AGE]','[GENDER]','[HOSPITAL]','[AREA]','[LINK]'];
export async function rewriteMessage({bg,units,urgency,groups,lang}){
  const out=await gen({temperature:0.5,input:`Blood group needed: ${bg}. Units: ${units}. Urgency: ${urgency}. Groups that can donate: ${groups.join(', ')}. Language: ${lang}.`,
    system:'You write short WhatsApp messages asking for blood donors in Visakhapatnam. Use these placeholders exactly as written, each at least once: [PATIENT] [AGE] [GENDER] [HOSPITAL] [AREA] [LINK]. Do not write any real names, phone numbers or places. Under 90 words. First line starts with 🩸 and the blood group. Tone fits the urgency: critical = urgent and direct, routine = calm and polite. Ask donors to tap [LINK] to check eligibility and reply, mention donors who gave blood in the last 3 months should not donate, and ask people to forward it. Reply with the message text only.'});
  const t=String(out).trim();if(PH.some(p=>!t.includes(p)))throw new Error('bad template');return t;
}
// 3) Area distances for donor matching (area names only, no personal data).
export async function areaDistances(from,areas){
  const key='db_prox2';let c={};try{c=JSON.parse(localStorage.getItem(key)||'{}');}catch(e){}
  const need=areas.filter(a=>c[from+'|'+a]==null);
  if(need.length){
    const out=await gen({temperature:0,input:`From: ${from}, Visakhapatnam.\nTo: ${need.join('; ')}`,
      system:'Estimate approximate road distance in km between localities of Visakhapatnam city. Return a JSON array of {area, km} for every "To" locality, using the exact names given. Use your best estimate; round to whole km.',
      schema:S=>S.array({items:S.object({properties:{area:S.string(),km:S.number()}})})});
    (jparse(out)||[]).forEach(x=>{if(x&&x.area&&typeof x.km==='number')c[from+'|'+x.area]=Math.max(0,Math.round(x.km));});
    try{localStorage.setItem(key,JSON.stringify(c));}catch(e){}
  }
  const m={};areas.forEach(a=>{if(c[from+'|'+a]!=null)m[a]=c[from+'|'+a];});return m;
}
// 4) Chat assistant.
export async function chatReply(history,stockSummary,live){
  return gen({temperature:0.3,input:{contents:history.map(m=>({role:m.role==='me'?'user':'model',parts:[{text:m.text}]}))},
    system:`You are the Digi Blood assistant for Vizag Volunteers in Visakhapatnam, India. The person may be stressed or scared and needs blood for someone. Your job is to ease that: answer directly, give the exact next steps, and never send them away to "check the website" or "see the app" instead of answering.
LANGUAGE: reply in the language of the user's LAST message. English message -> English. Telugu script -> Telugu. Hindi script -> Hindi. Default is English. Never switch language on your own.
STYLE: under 90 words, plain short sentences, calm and kind, no markdown, no bold. Give real numbers and names from the live data below. Use numbered steps when guiding.
ACTION BUTTONS: when an action is the next step, end your reply with ONE tag on its own line, exactly one of: [[request]] (open the Request Blood form), [[donor]] (open the donor registration form), [[availability]] (stock page), [[requests]] (open requests page), [[camps]] (camps page). The app turns the tag into a button. Never write URLs. Use the tag only as the next step, after you have already answered.
HOW THE APP WORKS: Request Blood = pick group, units, area, see live blood bank stock with call buttons, and if banks are empty or far, prepare a WhatsApp message (with AI wording and poster) to send to friends and groups. Donors who tap the link do a quick eligibility check, then accept or ignore. Register as Donor = adds a donor, reviewed by staff before public. Availability = all banks. For an urgent need: first say which banks have the group now (from live stock) and to call them, then offer [[request]].
Donor eligibility (whole blood): age 18-65, weight 50 kg or more, haemoglobin at least 12.5 g/dL, healthy that day, no whole-blood donation in the last 3 months. Compatibility (patient can receive from): ${Object.entries({'A+':'A+ A- O+ O-','A-':'A- O-','B+':'B+ B- O+ O-','B-':'B- O-','AB+':'all groups','AB-':'A- B- AB- O-','O+':'O+ O-','O-':'O- only'}).map(([k,v])=>k+': '+v).join('; ')}.
You are not a doctor. For medical conditions, medicines, recent illness, surgery, tattoos, pregnancy: say the blood bank doctor decides at screening. Never promise blood is available; say to call the bank first. Do not ask for names, phone numbers or medical records.
LIVE blood bank stock now (units per group citywide, top banks with phone): ${stockSummary||'not loaded'}
LIVE community data: ${live||'not loaded'}`});
}
