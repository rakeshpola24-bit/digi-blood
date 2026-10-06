import React,{useState,useEffect,useContext,createContext,useCallback,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import {LIVE,watch,guard,submitRecord} from './store.js';
import Admin from './Admin.jsx';


const BLOOD_GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const TABLE_GROUPS=[...BLOOD_GROUPS,'Bombay'];
const REQUESTS=[
  {id:'R001',name:'Ravi Kumar',bg:'O-',units:2,hospital:'KGH',area:'Maharani Peta',urgency:'critical',status:'open',contact:'98491 11234',postedAgo:'2 hrs ago',note:'Required for emergency surgery tonight'},
  {id:'R002',name:'Priya Sharma',bg:'B+',units:1,hospital:'Apollo Hospitals',area:'Waltair Uplands',urgency:'urgent',status:'open',contact:'98491 22345',postedAgo:'5 hrs ago',note:'Post-delivery complication'},
  {id:'R003',name:'Anil Reddy',bg:'A-',units:3,hospital:'NIMS',area:'Pedawaltair',urgency:'critical',status:'matched',contact:'98491 33456',postedAgo:'8 hrs ago',note:'Thalassemia patient - regular need'},
  {id:'R004',name:'Sujatha Rao',bg:'AB+',units:1,hospital:'Care Hospital',area:'MVP Colony',urgency:'routine',status:'open',contact:'98491 44567',postedAgo:'1 day ago',note:'Scheduled knee-replacement surgery'},
  {id:'R005',name:'Kiran Babu',bg:'O+',units:2,hospital:'Apollo Specialty',area:'Rushikonda',urgency:'urgent',status:'open',contact:'98491 55678',postedAgo:'6 hrs ago',note:'Road accident victim'},
  {id:'R006',name:'Meena Devi',bg:'B-',units:1,hospital:'KGH',area:'Maharani Peta',urgency:'routine',status:'fulfilled',contact:'98491 66789',postedAgo:'2 days ago',note:''},
];
const DONORS=[
  {id:'D001',name:'Sudharshan Lotla',initials:'SL',bg:'O+',donations:28,last:'Mar 2025',area:'MVP Colony'},
  {id:'D002',name:'Monika Vechalapu',initials:'MV',bg:'B+',donations:19,last:'Apr 2025',area:'Dwaraka Nagar'},
  {id:'D003',name:'Kavya Sambangi',initials:'KS',bg:'A+',donations:14,last:'Feb 2025',area:'Gajuwaka'},
  {id:'D004',name:'Tanuja Bakke',initials:'TB',bg:'AB+',donations:12,last:'May 2025',area:'Rushikonda'},
  {id:'D005',name:'Rajesh Varma',initials:'RV',bg:'O-',donations:10,last:'Jan 2025',area:'Seethammadhara'},
  {id:'D006',name:'Anitha Patel',initials:'AP',bg:'B-',donations:8,last:'Apr 2025',area:'Gajuwaka'},
  {id:'D007',name:'Venugopal Rao',initials:'VR',bg:'A-',donations:6,last:'Mar 2025',area:'MVP Colony'},
  {id:'D008',name:'Srinivas Kumar',initials:'SK',bg:'O+',donations:5,last:'May 2025',area:'Dwaraka Nagar'},
];
const CAMPS=[
  {id:'C001',title:'Mega Blood Donation Drive',organizer:'Vizag Volunteers x Rotary Club',day:'14',mon:'Jun',venue:'Indoor Stadium, Near RK Beach, Visakhapatnam',slots:150,registered:97,status:'upcoming',contact:'Tanuja Bakke - 90001 11111'},
  {id:'C002',title:'World Blood Donor Day Special',organizer:'Vizag Volunteers',day:'14',mon:'Jun',venue:'Town Hall, Dwaraka Nagar, Visakhapatnam',slots:100,registered:68,status:'upcoming',contact:'Sudharshan Lotla - 90001 22222'},
  {id:'C003',title:'Community Health Camp',organizer:'Apollo Hospitals & Vizag Volunteers',day:'5',mon:'Jul',venue:'St. Joseph School Ground, Adavi Kolanu',slots:80,registered:24,status:'upcoming',contact:'Monika Vechalapu - 90001 33333'},
  {id:'C004',title:'Republic Day Blood Drive',organizer:'Vizag Volunteers',day:'26',mon:'Jan',venue:'Collectorate Grounds, Visakhapatnam',slots:200,registered:200,status:'past',contact:''},
  {id:'C005',title:'Youth Donation Marathon',organizer:'Andhra University NSS',day:'15',mon:'Mar',venue:'AU Engineering College, Waltair',slots:120,registered:118,status:'past',contact:''},
];
const DataCtx=createContext({requests:REQUESTS,donors:DONORS,camps:CAMPS});
function DataProvider({children}){
  const[d,setD]=useState({requests:LIVE?[]:REQUESTS,donors:LIVE?[]:DONORS,camps:LIVE?[]:CAMPS});
  useEffect(()=>{
    const u=['requests','donors','camps'].map(k=>watch(k,v=>setD(p=>({...p,[k]:v}))));
    return()=>u.forEach(f=>f());
  },[]);
  return <DataCtx.Provider value={d}>{children}</DataCtx.Provider>;
}
function Consent(){return <div style={{margin:'8px 0 12px',fontSize:13,color:'#495057'}}>
  <label style={{display:'flex',gap:8,alignItems:'flex-start',cursor:'pointer'}}><input type="checkbox" name="consent" style={{marginTop:3}}/><span>I agree that Vizag Volunteers may store these details and share my name, blood group, area and (for requests) contact number on Digi Blood to help match donors. I can ask for removal anytime.</span></label>
  <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" style={{position:'absolute',left:'-9999px',height:0,width:0,opacity:0}}/>
</div>;}
const BADGE_DEFS=[
  {id:'starter',emoji:'🌱',name:'First Drop',desc:'1st donation',cls:'blue'},
  {id:'helper',emoji:'🤝',name:'Helper',desc:'5+ donations',cls:'bronze'},
  {id:'hero',emoji:'🦸',name:'Hero',desc:'10+ donations',cls:'silver'},
  {id:'veteran',emoji:'⭐',name:'Veteran',desc:'20+ donations',cls:'gold'},
  {id:'saver',emoji:'💉',name:'Life Saver',desc:'Saved 10+ lives',cls:'red'},
  {id:'motiv',emoji:'📣',name:'Motivator',desc:'Referred 5+ donors',cls:'blue'},
];
const FAQS=[
  {q:'Who can donate blood?',a:'Anyone between 18-65 years of age, weighing at least 50 kg, with haemoglobin >= 12.5 g/dL, and in good health can donate. You should not have donated in the last 3 months (whole blood).'},
  {q:'How often can I donate blood?',a:'Whole blood: once every 3 months. Platelets: up to once every 2 weeks. Plasma: once every 4 weeks.'},
  {q:'Is blood donation safe?',a:'Yes. All needles and blood bags are sterile, single-use, and disposed after each donation. You cannot get any infection from donating blood.'},
  {q:'Does donating blood hurt?',a:'You may feel a brief pinch when the needle is inserted. The actual donation takes only 8-10 minutes and is generally painless.'},
  {q:'What should I do before donating?',a:'Eat a healthy meal at least 2 hours before. Drink extra water. Avoid fatty foods. Get a good night sleep. Avoid alcohol for 24 hours before.'},
  {q:'What happens after donation?',a:'Rest for 10-15 minutes. Drink extra fluids for 24 hours. Avoid strenuous activity for the day.'},
  {q:'How can I register as a donor?',a:'Click "Donate Now" and fill the registration form. You will be added to our voluntary donor network and notified when your blood group is urgently needed.'},
];
const ELIGIBILITY=[
  {ok:true,title:'Age 18-65 years',sub:'Both men and women are eligible'},
  {ok:true,title:'Weight >= 50 kg',sub:'Minimum body weight requirement'},
  {ok:true,title:'Haemoglobin >= 12.5 g/dL',sub:'Checked before collection at centre'},
  {ok:true,title:'3-month gap since last donation',sub:'Minimum interval for whole blood'},
  {ok:true,title:'No fever, cold or flu on that day',sub:'Must be in good health during donation'},
  {ok:false,title:'Not on certain medications',sub:'Aspirin, antibiotics - wait 48 hrs after course ends'},
  {ok:false,title:'No recent tattoo/piercing',sub:'Wait 6 months after tattooing or piercing'},
];
const SAFETY=['All needles and collection sets are sterile, single-use, and disposed immediately after use.','Trained medical professionals conduct a brief health check before every donation.','Blood pressure, haemoglobin level, and pulse are checked prior to donation.','Donors are monitored during and 10-15 minutes after the donation.','Refreshments and rest are provided post-donation at all camps and centres.','Blood is tested for HIV, Hepatitis B, Hepatitis C, Syphilis, and Malaria before use.','All data is handled with strict confidentiality as per applicable regulations.'];

/* ── eRaktKosh context (single shared fetch) ── */
const BG_MAP={'A+Ve':'A+','A-Ve':'A-','B+Ve':'B+','B-Ve':'B-','AB+Ve':'AB+','AB-Ve':'AB-','O+Ve':'O+','O-Ve':'O-','Oh+Ve':'Bombay','Oh-Ve':'Bombay'};
const BloodCtx=createContext({banks:[],loading:true,err:null,updatedAt:null,refresh:()=>{}});
function parseAvailStr(html){
  const stock={};TABLE_GROUPS.forEach(g=>stock[g]=0);
  if(!html||html.includes('Not Available'))return stock;
  const m=html.match(/([A-Za-z]+[+-]Ve):(\d+)/gi)||[];
  m.forEach(s=>{const[k,v]=s.split(':');const kk=k.replace(/ve$/i,'Ve');const bg=BG_MAP[kk];if(bg)stock[bg]=(stock[bg]||0)+parseInt(v,10);});
  return stock;
}
function parseBank(row,idx){
  const nameHtml=row[1]||'';
  const div=document.createElement('div');div.innerHTML=nameHtml;
  const lines=(div.textContent||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const name=lines[0]||'Unknown';
  const phoneM=nameHtml.match(/Phone:\s*([\d\s,/+-]+?)(?:\s*,Fax|$)/);
  const phone=phoneM?phoneM[1].trim().split(',')[0].trim():'';
  const addrM=nameHtml.match(/<br\/?>(.*?)<br\/?>/i);
  const area=addrM?addrM[1].replace(/<[^>]+>/g,'').trim().split(',').slice(-3,-1).join(', '):'';
  const rawType=row[2]||'';
  const type=rawType.includes('Govt')||rawType.includes('Gov')?'Government':rawType.includes('Char')||rawType.includes('Vol')?'Charitable':'Private';
  const stock=parseAvailStr(row[3]||'');
  const updated=row[4]||'';
  return{id:idx,name,area,phone,type,stock,updated};
}
function bankScore(b){return BLOOD_GROUPS.reduce((s,g)=>s+b.stock[g],0);}
function BloodProvider({children}){
  const[banks,setBanks]=useState([]);
  const[loading,setLoading]=useState(true);
  const[err,setErr]=useState(null);
  const[updatedAt,setUpdatedAt]=useState(null);
  const fetchData=useCallback(()=>{
    setLoading(true);setErr(null);
    // availability.json is refreshed from eRaktKosh every 30 min by a GitHub Action (browsers cannot call eRaktKosh directly).
    fetch(import.meta.env.BASE_URL+'availability.json?t='+Math.floor(Date.now()/300000))
      .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
      .then(json=>{
        const rows=json.data||[];
        const parsed=rows.map((r,i)=>parseBank(r,i)).filter(b=>b.name!=='Unknown');
        parsed.sort((a,b)=>bankScore(b)-bankScore(a));
        setBanks(parsed);setUpdatedAt(json.fetchedAt?new Date(json.fetchedAt):new Date());setLoading(false);
      })
      .catch(e=>{setErr(e.message);setLoading(false);});
  },[]);
  useEffect(()=>{fetchData();},[fetchData]);
  return <BloodCtx.Provider value={{banks,loading,err,updatedAt,refresh:fetchData}}>{children}</BloodCtx.Provider>;
}
function groupTotalLive(banks,bg){return banks.reduce((s,b)=>s+(b.stock[bg]||0),0);}

/* ── Helpers ── */
function availCls(n){return n===0?'db-avail-no':n<=5?'db-avail-lo':'db-avail-hi';}
function availLbl(n){return n===0?'Nil':n<=5?'Low':'OK';}
function cellCls(n){return n===0?'db-avail-no':n<=5?'db-avail-lo':'db-avail-hi';}
function cellLbl(n){return n===0?'Nil':n<=5?'Low\u00A0'+n:'Avail\u00A0'+n;}
function typeBg(t){return t==='Government'?{bg:'#D1ECF1',color:'#0C5460'}:t==='Charitable'?{bg:'#D4EDDA',color:'#155724'}:{bg:'#FFF3CD',color:'#856404'};}
function fmtTime(d){return d?d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'--';}

/* ── Toast ── */
function useToast(){
  const[list,setList]=useState([]);
  function show(msg,type=''){const id=Date.now();setList(l=>[...l,{id,msg,type}]);setTimeout(()=>setList(l=>l.filter(x=>x.id!==id)),3500);}
  return[list,show];
}
function Toasts({list}){return <div className="db-toast-wrap">{list.map(t=><div key={t.id} className={`db-toast ${t.type}`}><span className="material-symbols-outlined">{t.type==='ok'?'check_circle':t.type==='err'?'error':'info'}</span>{t.msg}</div>)}</div>;}

const NAV_TABS=[{id:'home',icon:'home',label:'Overview'},{id:'avail',icon:'bloodtype',label:'Blood Availability'},{id:'req',icon:'emergency',label:'Active Requests'},{id:'donors',icon:'volunteer_activism',label:'Donors'},{id:'camps',icon:'event',label:'Camps'},{id:'about',icon:'info',label:'About'}];
const PAGE_TITLES={home:'Digi Blood — Vizag Volunteers',avail:'Blood Availability — Digi Blood',req:'Active Requests — Digi Blood',donors:'Donors — Digi Blood',camps:'Camps — Digi Blood',about:'About Digi Blood'};

/* ── SubNav ── */
function SubNav({page,setPage,openDonor,openReq}){
  return <div className="db-subnav"><div className="db-subnav-inner">
    <div style={{display:'flex',alignItems:'stretch',overflowX:'auto'}}>{NAV_TABS.map(n=><button key={n.id} className={`db-subnav-btn${page===n.id?' db-active':''}`} onClick={()=>setPage(n.id)}><span className="material-symbols-outlined">{n.icon}</span>{n.label}</button>)}</div>
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',flexShrink:0}}>
      <button className="db-btn db-btn-outline db-btn-sm" onClick={openReq}><span className="material-symbols-outlined">add_circle</span>Request Blood</button>
      <button className="db-btn db-btn-primary db-btn-sm" onClick={openDonor}><span className="material-symbols-outlined">favorite</span>Donate Now</button>
    </div>
  </div></div>;
}

/* ── Modal wrapper ── */
function Modal({open,onClose,title,sub,children}){
  if(!open)return null;
  return <div className="db-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="db-modal">
      <div className="db-modal-hd">
        <div><div className="db-modal-title">{title}</div>{sub&&<div style={{fontSize:13,color:'var(--db-gray-500)',marginTop:4}}>{sub}</div>}</div>
        <button className="db-modal-close" onClick={onClose}><span className="material-symbols-outlined" style={{fontSize:22}}>close</span></button>
      </div>
      <div className="db-modal-body">{children}</div>
    </div>
  </div>;
}

/* ── Poster drawing helpers ── */
function rrect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
function drawBloodPoster(canvas,req){
  const W=1080,H=1080;
  canvas.width=W;canvas.height=H;
  function loadImg(src){return new Promise(function(res){var i=new Image();i.crossOrigin='anonymous';i.onload=function(){res(i);};i.onerror=function(){res(null);};i.src=src;});}
  function removeWhiteBg(img){var oc=document.createElement('canvas');oc.width=img.naturalWidth;oc.height=img.naturalHeight;var ox=oc.getContext('2d');ox.drawImage(img,0,0);var d=ox.getImageData(0,0,oc.width,oc.height);var px=d.data;for(var i=0;i<px.length;i+=4){var r=px[i],g=px[i+1],b=px[i+2];if(r>210&&g>210&&b>210){px[i+3]=0;}}ox.putImageData(d,0,0);return oc;}
  return Promise.all([
    loadImg(import.meta.env.BASE_URL+"vv-logo.svg")
  ]).then(function(imgs){
    var vvImg = imgs[0];
    var ctx = canvas.getContext('2d');
    var W = 1080, H = 1080;

    // ── Helpers ────────────────────────────────────────────────────
    function rrect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x+r, y);
      ctx.lineTo(x+w-r, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+r);
      ctx.lineTo(x+w, y+h-r);
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      ctx.lineTo(x+r, y+h);
      ctx.quadraticCurveTo(x, y+h, x, y+h-r);
      ctx.lineTo(x, y+r);
      ctx.quadraticCurveTo(x, y, x+r, y);
      ctx.closePath();
    }

    function trunc(text, maxW) {
      if (!text) return '';
      text = String(text);
      if (ctx.measureText(text).width <= maxW) return text;
      while (text.length > 0 && ctx.measureText(text + '\u2026').width > maxW) text = text.slice(0, -1);
      return text + '\u2026';
    }

    function line(x1, y1, x2, y2) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // ── Background ────────────────────────────────────────────────
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#FDF8F0');
    bg.addColorStop(1, '#F5E8D8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Faint ECG watermark (right side background)
    ctx.save();
    ctx.strokeStyle = 'rgba(192,20,26,0.07)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    var ex = 560, ey = 330;
    ctx.moveTo(ex, ey); ctx.lineTo(ex+70, ey);
    ctx.lineTo(ex+92, ey-75); ctx.lineTo(ex+118, ey+95);
    ctx.lineTo(ex+142, ey-48); ctx.lineTo(ex+162, ey);
    ctx.lineTo(ex+310, ey);
    ctx.stroke();
    // Faint heart shapes
    ctx.font = '90px Arial';
    ctx.fillStyle = 'rgba(192,20,26,0.05)';
    ctx.textAlign = 'center';
    ctx.fillText('\u2665', 980, 305);
    ctx.font = '45px Arial';
    ctx.fillText('\u2665', 850, 190);
    ctx.restore();

    // ── HEADER (y 0–182) ─────────────────────────────────────────
    // VV Logo circle
    if (vvImg) {
      ctx.save();
      ctx.beginPath(); ctx.arc(92, 92, 78, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(vvImg, 14, 14, 156, 156);
      ctx.restore();
    }

    // Taglines
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1A1A1A';
    ctx.font = 'bold 36px Oswald';
    ctx.fillText("SOMEONE\u2019S LIFE", 188, 60);
    ctx.font = 'bold 50px Oswald';
    ctx.fillText('IS IN YOUR HANDS  \u2661', 188, 110);
    ctx.fillStyle = '#C0141A';
    ctx.font = 'bold 32px Oswald';
    ctx.fillText('BE A HERO.  DONATE BLOOD.', 188, 150);

    // EMERGENCY badge (top right)
    rrect(762, 18, 298, 74, 14);
    ctx.fillStyle = '#C0141A'; ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center';
    ctx.fillText('\uD83D\uDEA8', 798, 64); // alarm emoji via surrogate pair → just use text
    ctx.font = 'bold 40px Oswald';
    ctx.fillText('EMERGENCY', 930, 65);

    // ECG divider
    ctx.strokeStyle = '#C0141A'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(18, 173); ctx.lineTo(395, 173); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(395, 173); ctx.lineTo(414, 173);
    ctx.lineTo(424, 148); ctx.lineTo(440, 198);
    ctx.lineTo(453, 153); ctx.lineTo(464, 173);
    ctx.lineTo(488, 173);
    ctx.stroke();
    ctx.fillStyle = '#C0141A'; ctx.font = '28px Arial'; ctx.textAlign = 'center';
    ctx.fillText('\u2665', 508, 182);
    ctx.textAlign = 'left';

    // ── LEFT: BLOOD REQUEST heading ──────────────────────────────
    ctx.fillStyle = '#1A1A1A';
    ctx.font = 'bold 162px Oswald';
    ctx.fillText('BLOOD', 16, 362);
    ctx.fillText('REQUEST', 16, 502);

    // Red brush banner
    ctx.save();
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(16, 512); ctx.lineTo(546, 508);
    ctx.lineTo(544, 566); ctx.lineTo(14, 570);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px Oswald'; ctx.textAlign = 'center';
    ctx.fillText('A SMALL ACT FOR YOU, A LIFELINE FOR SOMEONE.  \u2661', 280, 546);
    ctx.restore();

    // ── INFO CARDS ───────────────────────────────────────────────
    var CX = 16, CW = 530;

    function infoCard(y, h, iconFn, label, value, extra) {
      rrect(CX, y, CW, h, 13);
      ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.strokeStyle = 'rgba(192,20,26,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();

      // Icon circle
      ctx.beginPath(); ctx.arc(CX + 50, y + h / 2, 29, 0, Math.PI * 2);
      ctx.fillStyle = '#C0141A'; ctx.fill();
      iconFn(CX + 50, y + h / 2);

      var valX = CX + 94, valMaxW = extra ? CW - 210 : CW - 110;

      ctx.fillStyle = '#999999'; ctx.font = '19px Inter'; ctx.textAlign = 'left';
      ctx.fillText(label, valX, y + h / 2 - 13);
      ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 33px Oswald';
      ctx.fillText(trunc(value, valMaxW), valX, y + h / 2 + 23);

      if (extra) {
        // Vertical divider
        ctx.strokeStyle = 'rgba(192,20,26,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(CX + CW - 155, y + 10); ctx.lineTo(CX + CW - 155, y + h - 10); ctx.stroke();
        ctx.fillStyle = '#999'; ctx.font = '19px Inter'; ctx.textAlign = 'left';
        ctx.fillText(extra.lbl, CX + CW - 143, y + h / 2 - 13);
        ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 27px Oswald';
        ctx.fillText(String(extra.val), CX + CW - 143, y + h / 2 + 21);
      }

      // Dashed bottom divider
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(192,20,26,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CX + 86, y + h - 1); ctx.lineTo(CX + CW - 10, y + h - 1);
      ctx.stroke();
      ctx.restore();
    }

    function icoPatient(cx, cy) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(cx, cy - 9, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy + 8, 14, Math.PI, 2 * Math.PI); ctx.fill();
    }

    function icoHeart(cx, cy) {
      ctx.save();
      ctx.fillStyle = '#FFFFFF'; ctx.font = '26px Arial'; ctx.textAlign = 'center';
      ctx.fillText('\u2665', cx, cy + 9);
      ctx.restore();
    }

    function icoHospital(cx, cy) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 11, cy - 14, 22, 22);
      ctx.fillStyle = '#C0141A';
      ctx.fillRect(cx - 3, cy - 12, 6, 18);
      ctx.fillRect(cx - 9, cy - 6, 18, 6);
    }

    var unitStr = req.units ? (req.units + ' Unit' + (req.units > 1 ? 's' : '')) : '';
    infoCard(582, 86, icoPatient, 'PATIENT NAME', req.patient_name || 'N/A',
      unitStr ? { lbl: 'UNITS', val: unitStr } : null);
    infoCard(676, 82, icoHeart, 'URGENCY / REASON', req.urgency || 'N/A', null);
    infoCard(766, 82, icoHospital, 'HOSPITAL',
      (req.hospital || '') + (req.area ? ', ' + req.area : ''), null);

    // ── BRANDING BAR ─────────────────────────────────────────────
    var bY = 858;
    rrect(CX, bY, CW, 78, 10);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = 'rgba(192,20,26,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();

    if (vvImg) {
      ctx.save();
      ctx.beginPath(); ctx.arc(54, bY + 39, 30, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(vvImg, 24, bY + 9, 60, 60);
      ctx.restore();
    }
    ctx.fillStyle = '#AAAAAA'; ctx.font = '14px Inter'; ctx.textAlign = 'left';
    ctx.fillText('An initiative by', 96, bY + 22);
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 24px Oswald';
    ctx.fillText('VIZAG VOLUNTEERS', 96, bY + 46);
    ctx.fillStyle = '#999'; ctx.font = '14px Inter';
    ctx.fillText('Feel Good, Do Good', 96, bY + 64);

    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
    line(308, bY + 10, 308, bY + 68);

    ctx.fillStyle = '#AAAAAA'; ctx.font = '14px Inter'; ctx.textAlign = 'left';
    ctx.fillText('Powered by', 322, bY + 24);
    // Digi drop icon
    ctx.save();
    ctx.fillStyle = '#C0141A';
    ctx.beginPath();
    ctx.moveTo(332, bY + 53); ctx.bezierCurveTo(332, bY + 44, 322, bY + 40, 322, bY + 54);
    ctx.bezierCurveTo(322, bY + 63, 332, bY + 67, 342, bY + 63);
    ctx.bezierCurveTo(352, bY + 59, 352, bY + 47, 342, bY + 47);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 28px Oswald'; ctx.textAlign = 'left';
    ctx.fillText('DigiBlood', 358, bY + 66);

    // ── CONTACT BAR ──────────────────────────────────────────────
    var ctY = 946;
    rrect(CX, ctY, CW, 86, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    ctx.strokeStyle = 'rgba(192,20,26,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Location pin
    ctx.fillStyle = '#C0141A';
    ctx.beginPath(); ctx.arc(47, ctY + 38, 12, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.moveTo(35, ctY + 38); ctx.lineTo(47, ctY + 56); ctx.lineTo(59, ctY + 38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FDF8F0';
    ctx.beginPath(); ctx.arc(47, ctY + 38, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#999'; ctx.font = '16px Inter'; ctx.textAlign = 'left';
    ctx.fillText('HOSPITAL', 74, ctY + 27);
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 23px Oswald';
    ctx.fillText(trunc(req.hospital || '', 128), 74, ctY + 50);
    ctx.fillStyle = '#888'; ctx.font = '14px Inter';
    ctx.fillText(req.area || '', 74, ctY + 70);

    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
    line(220, ctY + 10, 220, ctY + 76);

    // Phone icon (simple)
    rrect(231, ctY + 24, 20, 34, 4);
    ctx.fillStyle = '#C0141A'; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(234, ctY + 28, 14, 20);
    ctx.fillStyle = '#C0141A';
    ctx.beginPath(); ctx.arc(241, ctY + 51, 2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#999'; ctx.font = '16px Inter'; ctx.textAlign = 'left';
    ctx.fillText('CONTACT', 264, ctY + 27);
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 26px Oswald';
    ctx.fillText(trunc(req.phone || req.contact || 'N/A', 150), 264, ctY + 53);
    ctx.fillStyle = '#888'; ctx.font = '14px Inter';
    ctx.fillText('CALL / WHATSAPP', 264, ctY + 72);

    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
    line(430, ctY + 10, 430, ctY + 76);

    // Blood drop icon right cell
    ctx.fillStyle = '#C0141A';
    ctx.beginPath();
    ctx.moveTo(452, ctY + 24); ctx.bezierCurveTo(452, ctY + 16, 442, ctY + 12, 442, ctY + 28);
    ctx.bezierCurveTo(442, ctY + 38, 452, ctY + 42, 462, ctY + 38);
    ctx.bezierCurveTo(472, ctY + 34, 472, ctY + 22, 462, ctY + 22);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 16px Oswald'; ctx.textAlign = 'left';
    ctx.fillText('DONATE BLOOD.', 444, ctY + 56);
    ctx.fillText('SAVE LIVES.', 444, ctY + 74);

    // ── RIGHT: "Every drop counts" text ──────────────────────────
    ctx.fillStyle = '#666'; ctx.font = 'italic 23px Georgia'; ctx.textAlign = 'right';
    ctx.fillText('Every drop', 1066, 210);
    ctx.fillText('counts.', 1066, 238);
    ctx.fillText('Every', 1066, 266);
    ctx.fillStyle = '#C0141A'; ctx.font = 'italic bold 23px Georgia';
    ctx.fillText('donor', 1066, 294);
    ctx.fillStyle = '#666'; ctx.font = 'italic 23px Georgia';
    ctx.fillText('is a hero.', 1066, 322);
    ctx.fillStyle = '#C0141A'; ctx.font = '26px Arial'; ctx.textAlign = 'right';
    ctx.fillText('\u2661', 1066, 352);

    // ── BLOOD DROP ───────────────────────────────────────────────
    var dCX = 805, dCY = 435, dR = 188;

    ctx.save();
    ctx.shadowColor = 'rgba(80,0,0,0.45)';
    ctx.shadowBlur = 42;
    ctx.shadowOffsetX = 14;
    ctx.shadowOffsetY = 20;
    var dG = ctx.createRadialGradient(dCX - 72, dCY - 72, 12, dCX, dCY, dR);
    dG.addColorStop(0, '#FF5555');
    dG.addColorStop(0.3, '#CC1111');
    dG.addColorStop(0.7, '#960808');
    dG.addColorStop(1, '#680000');
    ctx.fillStyle = dG;
    ctx.beginPath();
    ctx.moveTo(dCX, dCY - dR);
    ctx.bezierCurveTo(dCX + dR * 0.56, dCY - dR * 0.24, dCX + dR * 0.96, dCY + dR * 0.32, dCX, dCY + dR);
    ctx.bezierCurveTo(dCX - dR * 0.96, dCY + dR * 0.32, dCX - dR * 0.56, dCY - dR * 0.24, dCX, dCY - dR);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Highlight
    var hlG = ctx.createRadialGradient(dCX - 82, dCY - 95, 6, dCX - 56, dCY - 68, 88);
    hlG.addColorStop(0, 'rgba(255,255,255,0.48)');
    hlG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlG;
    ctx.beginPath();
    ctx.moveTo(dCX, dCY - dR);
    ctx.bezierCurveTo(dCX + dR * 0.56, dCY - dR * 0.24, dCX + dR * 0.96, dCY + dR * 0.32, dCX, dCY + dR);
    ctx.bezierCurveTo(dCX - dR * 0.96, dCY + dR * 0.32, dCX - dR * 0.56, dCY - dR * 0.24, dCX, dCY - dR);
    ctx.closePath();
    ctx.fill();

    // Decorative dashes around drop
    ctx.strokeStyle = '#C0141A'; ctx.lineWidth = 3.5;
    [[-168, -148, 0.62], [-198, -55, 0.62], [168, -148, 0.62], [198, -55, 0.62]].forEach(function (d) {
      ctx.beginPath();
      ctx.moveTo(dCX + d[0], dCY + d[1]);
      ctx.lineTo(dCX + d[0] * d[2], dCY + d[1] * d[2]);
      ctx.stroke();
    });

    // Blood group text
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 118px Oswald'; ctx.textAlign = 'center';
    ctx.fillText(req.blood_group || 'O+', dCX, dCY + 28);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 35px Oswald';
    ctx.fillText('BLOOD GROUP', dCX, dCY + 74);
    ctx.font = 'bold 42px Oswald';
    ctx.fillText('NEEDED', dCX, dCY + 118);
    ctx.restore();

    // ── "Your blood today…" brush banner ─────────────────────────
    var bbY = 644;
    ctx.save();
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(558, bbY); ctx.lineTo(1066, bbY - 6);
    ctx.lineTo(1064, bbY + 58); ctx.lineTo(556, bbY + 64);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'italic bold 26px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('Your blood today', 812, bbY + 22);
    ctx.fillText('can bring back a tomorrow.  \u2661', 812, bbY + 50);
    ctx.restore();

    // ── REQUEST ID BOX ───────────────────────────────────────────
    var rBY = 722;
    rrect(558, rBY, 502, 94, 14);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = '#C0141A'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#C0141A'; ctx.font = 'bold 21px Inter'; ctx.textAlign = 'center';
    ctx.fillText('REQUEST ID', 809, rBY + 27);
    ctx.strokeStyle = '#C0141A'; ctx.lineWidth = 1;
    line(585, rBY + 35, 1033, rBY + 35);
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 44px Oswald';
    ctx.fillText(trunc(req.request_no || 'VVDBR00000000', 470), 809, rBY + 82);

    // ── QUOTE (right side) ───────────────────────────────────────
    ctx.fillStyle = '#C0141A'; ctx.font = 'bold 54px Georgia'; ctx.textAlign = 'left';
    ctx.fillText('\u201C', 1016, 840);
    ctx.fillStyle = '#555'; ctx.font = '21px Inter'; ctx.textAlign = 'right';
    ctx.fillText('One donation', 1068, 852);
    ctx.fillText('can save up to 3 lives.', 1068, 877);
    ctx.fillStyle = '#C0141A'; ctx.font = 'bold 21px Inter';
    ctx.fillText('DONATE BLOOD.', 1068, 902);
    ctx.fillText('SAVE LIVES.', 1068, 927);
    ctx.fillStyle = '#555'; ctx.font = '20px Inter';
    ctx.fillText('Be the reason', 1068, 952);
    ctx.fillText('someone lives.', 1068, 975);
    ctx.fillStyle = '#C0141A'; ctx.font = 'bold 54px Georgia'; ctx.textAlign = 'right';
    ctx.fillText('\u201D', 1070, 988);

    // ── QR PLACEHOLDER ───────────────────────────────────────────
    var qX = 558, qY = 826, qS = 86;
    rrect(qX, qY, qS, qS, 7);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = '#C0141A'; ctx.lineWidth = 1.5; ctx.stroke();
    // QR finder squares
    ctx.fillStyle = '#1A1A1A';
    var qs = 9;
    [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2],
     [5,0],[6,0],[7,0],[5,1],[7,1],[5,2],[6,2],[7,2],
     [0,5],[1,5],[2,5],[0,6],[2,6],[0,7],[1,7],[2,7],
     [3,3],[4,3],[5,3],[3,4],[5,4],[3,5],[4,6],[5,5],[6,4]
    ].forEach(function(p) {
      ctx.fillRect(qX + 5 + p[0] * qs, qY + 5 + p[1] * qs, qs - 1, qs - 1);
    });
    ctx.fillStyle = '#888'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
    ctx.fillText('SCAN TO SHARE', qX + qS / 2, qY + qS + 14);

    // ── FOOTER ───────────────────────────────────────────────────
    var ftY = 972;

    // Dark red main footer bar
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, ftY, W, 72);

    // Left: community icon + text
    ctx.fillStyle = '#FFFFFF';
    // Simple people icon
    ctx.beginPath(); ctx.arc(28, ftY + 22, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(46, ftY + 22, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, ftY + 22, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(56, ftY + 22, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(37, ftY + 22, 11, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(18, ftY + 22, 9, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(56, ftY + 22, 9, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.font = 'bold 17px Oswald'; ctx.textAlign = 'left';
    ctx.fillText('TOGETHER,', 70, ftY + 24);
    ctx.fillText('WE CAN CREATE MIRACLES.', 70, ftY + 44);

    // Center: thank you
    ctx.fillStyle = '#FFDDDD'; ctx.font = 'italic 22px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('Thank you for your kindness.  \u2661', W / 2, ftY + 36);

    // Right: website + social icons
    ctx.fillStyle = '#FFFFFF'; ctx.font = '16px Inter'; ctx.textAlign = 'right';
    ctx.fillText('www.vizagvolunteers.org', W - 18, ftY + 22);
    // Social circles
    var socY = ftY + 52, socR = 12;
    [[W - 60, 'f'], [W - 38, 'ig'], [W - 16, 'wa']].forEach(function(s) {
      ctx.beginPath(); ctx.arc(s[0], socY, socR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(s[1], s[0], socY + 4);
    });

    // Sub-ticker strip
    ctx.fillStyle = '#C0141A';
    ctx.fillRect(0, ftY + 72, W, 36);
    // Blood drop icon ticker
    ctx.fillStyle = '#FEC73E';
    ctx.beginPath();
    ctx.moveTo(14, ftY + 82); ctx.bezierCurveTo(14, ftY + 74, 6, ftY + 70, 6, ftY + 84);
    ctx.bezierCurveTo(6, ftY + 94, 14, ftY + 97, 22, ftY + 93);
    ctx.bezierCurveTo(30, ftY + 89, 30, ftY + 78, 22, ftY + 78);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px Oswald'; ctx.textAlign = 'left';
    ctx.fillText('ONE DONATION CAN SAVE UP TO 3 LIVES.', 36, ftY + 96);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
    line(480, ftY + 76, 480, ftY + 102);
    ctx.fillText('DONATE BLOOD. SPREAD HOPE. SAVE LIVES.', 495, ftY + 96);
    // Trailing drop
    ctx.fillStyle = '#FEC73E';
    ctx.beginPath();
    ctx.moveTo(W - 14, ftY + 82); ctx.bezierCurveTo(W - 14, ftY + 74, W - 22, ftY + 70, W - 22, ftY + 84);
    ctx.bezierCurveTo(W - 22, ftY + 94, W - 14, ftY + 97, W - 6, ftY + 93);
    ctx.bezierCurveTo(W + 2, ftY + 89, W + 2, ftY + 78, W - 6, ftY + 78);
    ctx.closePath(); ctx.fill();
  });
}

/* ── PosterModal ── */
function PosterModal({req,onClose}){
  if(!req)return null;
  const cvRef=useRef(null);
  const[ready,setReady]=useState(false);
  useEffect(()=>{
    setReady(false);
    if(!cvRef.current)return;
    document.fonts.ready.then(()=>drawBloodPoster(cvRef.current,req)).then(()=>setReady(true));
  },[req]);
  function dl(){
    const a=document.createElement('a');
    a.download='blood-request-'+(req.bg||'any').replace('+','pos').replace('-','neg')+'.png';
    a.href=cvRef.current.toDataURL('image/png');a.click();
  }
  async function shareNative(){
    if(navigator.share&&cvRef.current){
      cvRef.current.toBlob(async blob=>{
        try{const f=new File([blob],'blood-request.png',{type:'image/png'});await navigator.share({title:'Blood Request — Vizag Volunteers',text:'🩸 Urgent: '+(req.bg||'Any')+' blood needed at '+req.hospital+', '+req.area+'. Please help!',files:[f]});}
        catch(e){dl();}
      });
    }else{dl();}
  }
  const waText=encodeURIComponent('🩸 *URGENT BLOOD REQUEST*\n\nBlood Group: '+(req.bg||'Any')+'\nHospital: '+req.hospital+', '+req.area+'\nUnits: '+(req.units||1)+'\nContact: '+(req.phone||req.contact||'')+'\n\nPlease share & help save a life!\nVizag Volunteers Digi Blood — vizagvolunteers.org');
  const twText=encodeURIComponent('🩸 Urgent: '+(req.bg||'Any')+' blood needed at '+req.hospital+', Vizag. Contact: '+(req.phone||req.contact||'')+' Please help! #VizagVolunteers #DigiBlood #BloodDonation #Vizag');
  const fbUrl=encodeURIComponent('https://www.vizagvolunteers.org/digi-blood');
  return <div className="db-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="db-modal" style={{maxWidth:540}}>
      <div className="db-modal-hd">
        <div><div className="db-modal-title">Share Poster</div><div style={{fontSize:13,color:'var(--db-gray-500)',marginTop:4}}>Download &amp; share this poster on social media to find a donor fast</div></div>
        <button className="db-modal-close" onClick={onClose}><span className="material-symbols-outlined" style={{fontSize:22}}>close</span></button>
      </div>
      <div className="db-modal-body">
        <div className="db-poster-preview">
          {!ready&&<div style={{padding:'32px 0',textAlign:'center',color:'#888',fontSize:14}}>Generating poster…</div>}
          <canvas ref={cvRef} style={{width:'100%',height:'auto',display:ready?'block':'none'}}/>
        </div>
        <div className="db-share-grid">
          <button className="db-btn db-btn-dark" onClick={dl} style={{justifyContent:'center'}}><span className="material-symbols-outlined">download</span>Download PNG</button>
          <button className="db-btn db-btn-primary" onClick={shareNative} style={{justifyContent:'center'}}><span className="material-symbols-outlined">share</span>Share…</button>
        </div>
        <div className="db-share-row">
          <a href={'https://wa.me/?text='+waText} target="_blank" rel="noopener noreferrer" style={{flex:1,display:'block'}}>
            <button className="db-btn db-btn-wa" style={{width:'100%',justifyContent:'center'}}>
              <svg style={{width:17,height:17,fill:'#fff',flexShrink:0}} viewBox="0 0 32 32"><path d="M16 .5C7.44.5.5 7.44.5 16c0 2.72.69 5.27 1.9 7.5L.5 31.5l8.22-1.87A15.42 15.42 0 0016 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.18a13.6 13.6 0 01-6.96-1.91l-.5-.3-5.17 1.18 1.2-5.04-.33-.52A13.6 13.6 0 1116 28.68zM22.9 19.1c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18s-.93 1.17-1.14 1.41c-.21.24-.42.27-.78.09s-1.52-.56-2.9-1.78c-1.07-.95-1.8-2.13-2.01-2.49-.21-.36-.02-.55.16-.73.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63s-.81-1.95-1.11-2.67c-.29-.7-.59-.6-.81-.61l-.69-.01c-.24 0-.63.09-.96.45s-1.26 1.23-1.26 3 1.29 3.48 1.47 3.72c.18.24 2.54 3.88 6.15 5.44.86.37 1.53.59 2.05.76.86.27 1.65.23 2.27.14.69-.1 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.69-.42z"/></svg>
              WhatsApp
            </button>
          </a>
          <a href={'https://www.facebook.com/sharer/sharer.php?u='+fbUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,display:'block'}}>
            <button className="db-btn db-btn-outline db-btn-fb" style={{width:'100%',justifyContent:'center'}}>
              <svg style={{width:17,height:17,fill:'#1877F2',flexShrink:0}} viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </a>
          <a href={'https://twitter.com/intent/tweet?text='+twText} target="_blank" rel="noopener noreferrer" style={{flex:1,display:'block'}}>
            <button className="db-btn db-btn-outline db-btn-tw" style={{width:'100%',justifyContent:'center'}}>
              <svg style={{width:17,height:17,fill:'currentColor',flexShrink:0}} viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </button>
          </a>
        </div>
        <div className="db-poster-hint"><span className="material-symbols-outlined" style={{fontSize:14,flexShrink:0,marginTop:1}}>info</span>Download the poster first, then attach the image when sharing on WhatsApp or Facebook for best impact.</div>
      </div>
    </div>
  </div>;
}

/* ── Donor Registration Form ── */
function DonorForm({open,onClose}){
  const INIT={name:'',phone:'',bg:'',area:'',age:'',lastDon:'first',note:''};
  const[f,setF]=useState(INIT);
  const[errs,setErrs]=useState({});
  function ch(k){return e=>setF(p=>({...p,[k]:e.target.value}));}
  function close(){setF(INIT);setErrs({});onClose();}
  function validate(){
    const e={};
    if(!f.name.trim())e.name='Required';
    if(!/^\d{10}$/.test(f.phone.replace(/\D/g,'')))e.phone='Enter valid 10-digit number';
    if(!f.bg)e.bg='Select blood group';
    if(!f.area.trim())e.area='Required';
    const age=parseInt(f.age);if(!f.age||isNaN(age)||age<18||age>65)e.age='Must be 18–65';
    return e;
  }
  function submit(ev){
    ev.preventDefault();const e=validate();setErrs(e);if(Object.keys(e).length)return;
    const lastMap={first:'First time donor',gt6:'More than 6 months ago',lt6:'3–6 months ago',lt3:'Less than 3 months ago'};
    const msg=`Donor Registration — Vizag Volunteers Digi Blood\n\nName: ${f.name}\nPhone: ${f.phone}\nBlood Group: ${f.bg}\nAge: ${f.age}\nArea: ${f.area}\nLast Donation: ${lastMap[f.lastDon]}${f.note?'\nNotes: '+f.note:''}\n\nPlease add me to the Digi Blood donor network.`;
    const g=guard(ev);if(g==='consent')return;
    if(g==='ok')submitRecord('donors',{name:f.name.trim(),phone:f.phone.replace(/\D/g,''),bg:f.bg,age:parseInt(f.age),area:f.area.trim(),lastDonation:f.lastDon,note:(f.note||'').slice(0,300)}).catch(()=>{});
    window.open('https://wa.me/917337335556?text='+encodeURIComponent(msg),'_blank');
    close();
  }
  function Inp({k,label,req,...rest}){return <div className="db-form-group"><label className="db-form-label">{label}{req&&<span> *</span>}</label><input className={`db-input${errs[k]?' err':''}`} value={f[k]} onChange={ch(k)} {...rest}/>{errs[k]&&<div className="db-form-err">{errs[k]}</div>}</div>;}
  return <Modal open={open} onClose={close} title="Register as Donor" sub="Join Vizag's voluntary blood donor network">
    <form onSubmit={submit} noValidate>
      <div className="db-form-row"><Inp k="name" label="Full Name" req placeholder="Your name"/><Inp k="phone" label="Phone" req placeholder="10-digit mobile" type="tel"/></div>
      <div className="db-form-row">
        <div className="db-form-group"><label className="db-form-label">Blood Group <span>*</span></label><select className={`db-input${errs.bg?' err':''}`} value={f.bg} onChange={ch('bg')}><option value="">Select…</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select>{errs.bg&&<div className="db-form-err">{errs.bg}</div>}</div>
        <Inp k="age" label="Age" req placeholder="18–65" type="number" min="18" max="65"/>
      </div>
      <Inp k="area" label="Area / Locality in Vizag" req placeholder="e.g. MVP Colony, Dwaraka Nagar…"/>
      <div className="db-form-group"><label className="db-form-label">Last Blood Donation</label><select className="db-input" value={f.lastDon} onChange={ch('lastDon')}><option value="first">First time donor</option><option value="gt6">More than 6 months ago</option><option value="lt6">3–6 months ago</option><option value="lt3">Less than 3 months ago</option></select></div>
      <div className="db-form-group"><label className="db-form-label">Notes <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label><textarea className="db-input" rows={2} value={f.note} onChange={ch('note')} placeholder="Any medical conditions or preferences…" style={{resize:'vertical'}}/></div>
      <Consent/><div className="db-form-actions"><button type="submit" className="db-btn db-btn-primary" style={{flex:1}}><span className="material-symbols-outlined">whatsapp</span>Submit via WhatsApp</button><button type="button" className="db-btn db-btn-outline" onClick={close}>Cancel</button></div>
      <div className="db-form-note"><span className="material-symbols-outlined">info</span>Submitting opens WhatsApp with a pre-filled message to our Digi Blood coordinator. Your details are reviewed by our team before being shown publicly.</div>
    </form>
  </Modal>;
}

/* ── Blood Request Form ── */
function RequestForm({open,onClose,onSuccess}){
  const INIT={name:'',phone:'',bg:'',units:'1',hospital:'',area:'',urgency:'urgent',note:''};
  const[f,setF]=useState(INIT);
  const[errs,setErrs]=useState({});
  function ch(k){return e=>setF(p=>({...p,[k]:e.target.value}));}
  function close(){setF(INIT);setErrs({});onClose();}
  function validate(){
    const e={};
    if(!f.name.trim())e.name='Required';
    if(!/^\d{10}$/.test(f.phone.replace(/\D/g,'')))e.phone='Enter valid 10-digit number';
    if(!f.bg)e.bg='Select blood group';
    if(!f.hospital.trim())e.hospital='Required';
    if(!f.area.trim())e.area='Required';
    return e;
  }
  function submit(ev){
    ev.preventDefault();const e=validate();setErrs(e);if(Object.keys(e).length)return;
    const urgLabel={critical:'CRITICAL — Immediate',urgent:'Urgent — Few hours',routine:'Routine — Scheduled'}[f.urgency];
    const msg=`Blood Request — Vizag Volunteers Digi Blood\n\nPatient: ${f.name}\nContact: ${f.phone}\nBlood Group: ${f.bg}\nUnits: ${f.units}\nHospital: ${f.hospital}\nArea: ${f.area}\nUrgency: ${urgLabel}${f.note?'\nNotes: '+f.note:''}\n\nKindly help connect us with a matching donor. Thank you.`;
    const g=guard(ev);if(g==='consent')return;
    if(g==='ok')submitRecord('requests',{name:f.name.trim(),phone:f.phone.replace(/\D/g,''),bg:f.bg,units:parseInt(f.units),hospital:f.hospital.trim(),area:f.area.trim(),urgency:f.urgency,note:(f.note||'').slice(0,300)}).catch(()=>{});
    window.open('https://wa.me/917337335556?text='+encodeURIComponent(msg),'_blank');
    close();
    if(onSuccess)onSuccess({name:f.name,bg:f.bg,units:parseInt(f.units),hospital:f.hospital,area:f.area,phone:f.phone,urgency:f.urgency,contact:f.phone});
  }
  function Inp({k,label,req,...rest}){return <div className="db-form-group"><label className="db-form-label">{label}{req&&<span> *</span>}</label><input className={`db-input${errs[k]?' err':''}`} value={f[k]} onChange={ch(k)} {...rest}/>{errs[k]&&<div className="db-form-err">{errs[k]}</div>}</div>;}
  return <Modal open={open} onClose={close} title="Request Blood" sub="We'll connect you with a matching donor as soon as possible">
    <form onSubmit={submit} noValidate>
      <div className="db-form-row"><Inp k="name" label="Patient Name" req placeholder="Full name"/><Inp k="phone" label="Contact Number" req placeholder="10-digit mobile" type="tel"/></div>
      <div className="db-form-row">
        <div className="db-form-group"><label className="db-form-label">Blood Group <span>*</span></label><select className={`db-input${errs.bg?' err':''}`} value={f.bg} onChange={ch('bg')}><option value="">Select…</option><option value="Any">Any Blood Group</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select>{errs.bg&&<div className="db-form-err">{errs.bg}</div>}</div>
        <div className="db-form-group"><label className="db-form-label">Units Needed <span>*</span></label><select className="db-input" value={f.units} onChange={ch('units')}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></div>
      </div>
      <Inp k="hospital" label="Hospital Name" req placeholder="e.g. KGH, Apollo, Care Hospital…"/>
      <Inp k="area" label="Hospital Area" req placeholder="Area where hospital is located"/>
      <div className="db-form-group"><label className="db-form-label">Urgency <span>*</span></label><select className="db-input" value={f.urgency} onChange={ch('urgency')}><option value="critical">Critical — Needed immediately</option><option value="urgent">Urgent — Within a few hours</option><option value="routine">Routine — Scheduled procedure</option></select></div>
      <div className="db-form-group"><label className="db-form-label">Notes <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label><textarea className="db-input" rows={2} value={f.note} onChange={ch('note')} placeholder="Reason, special requirements…" style={{resize:'vertical'}}/></div>
      <Consent/><div className="db-form-actions"><button type="submit" className="db-btn db-btn-primary" style={{flex:1}}><span className="material-symbols-outlined">whatsapp</span>Submit via WhatsApp</button><button type="button" className="db-btn db-btn-outline" onClick={close}>Cancel</button></div>
      <div className="db-form-note"><span className="material-symbols-outlined">info</span>Submitting opens WhatsApp with a pre-filled message to our coordinator who will match you with a donor.</div>
    </form>
  </Modal>;
}
function ReqCard({req}){
  const urgCls=req.urgency==='critical'?'db-urg-crit':req.urgency==='urgent'?'db-urg-urg':'db-urg-rou';
  const leftCls=req.urgency==='critical'?'crit':req.urgency==='urgent'?'urg-c':'';
  const[posterOpen,setPosterOpen]=useState(false);
  return <React.Fragment>
    <div className={`db-req-card ${leftCls}`}>
      <div className="top"><div className="db-bg-chip sm">{req.bg}</div><div className="meta"><div className="rname">{req.name}</div><div className="detail"><span><span className="material-symbols-outlined">local_hospital</span>{req.hospital}</span><span><span className="material-symbols-outlined">location_on</span>{req.area}</span></div></div><span className={`db-urg ${urgCls}`}>{req.urgency}</span></div>
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}><span style={{fontSize:13,color:'var(--db-gray-500)'}}>{req.units} unit{req.units>1?'s':''} &middot; {req.postedAgo}</span><span className={`db-pill db-pill-${req.status==='fulfilled'?'done':req.status==='matched'?'matched':'open'}`}><span className="material-symbols-outlined">{req.status==='fulfilled'?'check_circle':req.status==='matched'?'link':'schedule'}</span>{req.status}</span></div>
      {req.note&&<div style={{fontSize:13,color:'var(--db-gray-500)',fontStyle:'italic'}}>"{req.note}"</div>}
      <div className="actions"><a href={'https://wa.me/'+req.contact.replace(/\D/g,'')} target="_blank" className="db-btn db-btn-primary db-btn-sm" style={{flex:1}}><span className="material-symbols-outlined">phone_in_talk</span>I Can Help</a><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPosterOpen(true)}><span className="material-symbols-outlined">campaign</span>Share Poster</button></div>
    </div>
    <PosterModal req={posterOpen?req:null} onClose={()=>setPosterOpen(false)}/>
  </React.Fragment>;
}
/* ── CampForm ── */
function CampForm({open,onClose}){
  const init={name:'',phone:'',org:'',date:'',venue:'',count:'',notes:''};
  const[f,setF]=useState(init);
  const[errs,setErrs]=useState({});
  function ch(k){return e=>setF(p=>({...p,[k]:e.target.value}));}
  function close(){setF(init);setErrs({});onClose();}
  function validate(){const e={};if(!f.name.trim())e.name='Required';if(!f.phone.trim()||!/^\d{10}$/.test(f.phone.replace(/\s/g,'')))e.phone='Valid 10-digit number required';if(!f.venue.trim())e.venue='Required';return e;}
  function submit(ev){
    ev.preventDefault();const e=validate();setErrs(e);if(Object.keys(e).length)return;
    const msg=`Camp Organiser Request — Vizag Volunteers Digi Blood\n\nOrganiser: ${f.name}\nPhone: ${f.phone}${f.org?'\nOrganisation: '+f.org:''}${f.date?'\nPreferred Date: '+f.date:''}\nVenue / Area: ${f.venue}${f.count?'\nExpected Participants: '+f.count:''}${f.notes?'\nNotes: '+f.notes:''}\n\nPlease help us organise a blood donation camp. Thank you.`;
    const g=guard(ev);if(g==='consent')return;
    if(g==='ok')submitRecord('camps',{organizer:f.name.trim(),contact:f.name.trim()+' - '+f.phone.replace(/\D/g,''),org:f.org.trim(),date:f.date||'',venue:f.venue.trim(),slots:parseInt(f.count)||0,note:(f.notes||'').slice(0,300),title:(f.org.trim()||f.name.trim())+' blood camp'}).catch(()=>{});
    window.open('https://wa.me/917337335556?text='+encodeURIComponent(msg),'_blank');
    close();
  }
  function Inp({k,label,req,...rest}){return <div className="db-form-group"><label className="db-form-label">{label}{req&&<span> *</span>}</label><input className={`db-input${errs[k]?' err':''}`} value={f[k]} onChange={ch(k)} {...rest}/>{errs[k]&&<div className="db-form-err">{errs[k]}</div>}</div>;}
  return <Modal open={open} onClose={close} title="Organise a Blood Donation Camp" sub="Fill in your details and we'll get back to you to plan the camp">
    <form onSubmit={submit} noValidate>
      <div className="db-form-row"><Inp k="name" label="Your Name" req placeholder="Full name"/><Inp k="phone" label="Phone Number" req placeholder="10-digit mobile" type="tel"/></div>
      <Inp k="org" label="Organisation / Company" placeholder="Company, college, RWA… (optional)"/>
      <div className="db-form-row"><Inp k="date" label="Preferred Date" placeholder="" type="date"/><Inp k="count" label="Expected Participants" placeholder="e.g. 50" type="number" min="1"/></div>
      <Inp k="venue" label="Proposed Venue / Area" req placeholder="e.g. JNTU Auditorium, Kakinada Road…"/>
      <div className="db-form-group"><label className="db-form-label">Notes <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label><textarea className="db-input" rows={2} value={f.notes} onChange={ch('notes')} placeholder="Any special requirements or questions…" style={{resize:'vertical'}}/></div>
      <Consent/><div className="db-form-actions"><button type="submit" className="db-btn db-btn-primary" style={{flex:1}}><span className="material-symbols-outlined">whatsapp</span>Submit via WhatsApp</button><button type="button" className="db-btn db-btn-outline" onClick={close}>Cancel</button></div>
      <div className="db-form-note"><span className="material-symbols-outlined">info</span>Our team will contact you within 24 hours to finalise logistics, volunteers, and blood bank coordination.</div>
    </form>
  </Modal>;
}
/* ── HeroCarousel ── */
function CountUp({to,active,suffix,duration}){
  duration=duration||1400;suffix=suffix||'';
  const[val,setVal]=useState(0);
  useEffect(()=>{
    if(!active){setVal(0);return;}
    const num=parseInt(String(to).replace(/\D/g,''));
    let start=null,raf;
    function step(ts){if(!start)start=ts;const p=Math.min((ts-start)/duration,1);const ease=1-Math.pow(1-p,3);setVal(Math.floor(ease*num));if(p<1){raf=requestAnimationFrame(step);}else setVal(num);}
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[active,to]);
  return React.createElement(React.Fragment,null,val>=1000?val.toLocaleString():val,suffix);
}
function HeroCarousel({setPage,openDonor,openReq}){
  const DC=useContext(DataCtx);const BC=useContext(BloodCtx);
  const{banks,loading}=useContext(BloodCtx);
  const[slide,setSlide]=useState(0);
  const[campOpen,setCampOpen]=useState(false);
  const paused=useRef(false);
  useEffect(()=>{
    const t=setInterval(()=>{if(!paused.current)setSlide(s=>(s+1)%3);},5500);
    return()=>clearInterval(t);
  },[]);
  const prev=()=>setSlide(s=>(s+2)%3);
  const next=()=>setSlide(s=>(s+1)%3);
  const W={color:'#fff'};
  const WM={color:'rgba(255,255,255,.75)'};
  const SLIDES=[
    /* Slide 1 — dark red */
    <div className="db-cnt" style={{display:'flex',alignItems:'center',gap:64,position:'relative',zIndex:1}}>
      <div className="db-slide-orb o1"/><div className="db-slide-orb o2"/><div className="db-slide-orb o3"/>
      <svg className="db-slide-svg-deco" style={{width:340,height:420,left:'-40px',bottom:'-60px'}} viewBox="0 0 100 130" fill="white"><path d="M50 5 C50 5 10 55 10 80 A40 40 0 0 0 90 80 C90 55 50 5 50 5Z"/></svg>
      <div style={{flex:1,position:'relative',zIndex:1}}>
        <div className="db-hero-eyebrow db-hero-eyebrow-light"><span className="material-symbols-outlined" style={{fontSize:13}}>water_drop</span>Visakhapatnam Blood Network</div>
        <h1 style={{fontFamily:'var(--db-font-head)',fontWeight:700,fontSize:58,letterSpacing:'.03em',textTransform:'uppercase',lineHeight:1.0,...W,margin:'0 0 4px'}}>Every Drop<br/><span style={{color:'var(--db-primary)'}}>Saves a Life</span></h1>
        <p style={{fontSize:17,...WM,margin:'14px 0 0',maxWidth:500,lineHeight:1.75}}>Connecting voluntary blood donors with patients in urgent need across Vizag. Real-time requests, live availability, zero middlemen.</p>
        <div className="db-slide-counters">
          {[{to:DC.requests.filter(r=>r.status==='open').length,suffix:'',lbl:'Open Requests'},{to:DC.donors.length,suffix:'',lbl:'Donors'},{to:DC.camps.filter(c=>c.status==='upcoming').length,suffix:'',lbl:'Upcoming Camps'},{to:BC.banks.length,suffix:'',lbl:'Blood Banks'}].map((c,i)=><div key={i} className="db-slide-counters-item"><div className="cv"><CountUp to={c.to} active={slide===0} suffix={c.suffix}/></div><div className="cl">{c.lbl}</div></div>)}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="db-btn db-btn-primary db-btn-lg" onClick={openDonor}><span className="material-symbols-outlined">favorite</span>Become a Donor</button>
          <button className="db-btn db-btn-outline-light db-btn-lg" onClick={()=>setPage('req')}><span className="material-symbols-outlined">emergency</span>View Requests</button>
        </div>
      </div>
      <div style={{width:330,flexShrink:0,position:'relative',zIndex:1}}>
        <div className="db-bg-grid-panel">
          <div className="db-label">Live Blood Availability &middot; All Banks</div>
          {loading?<div style={{textAlign:'center',padding:'24px 0',color:'var(--db-gray-500)',fontSize:13}}><span className="material-symbols-outlined" style={{fontSize:28,display:'block',marginBottom:6,animation:'spin 1s linear infinite'}}>progress_activity</span>Loading&hellip;</div>
          :<div className="db-bg-tile-grid">{BLOOD_GROUPS.map(bg=>{const tot=groupTotalLive(banks,bg);return <div key={bg} className="db-bg-tile" onClick={()=>setPage('avail')}><div className="db-bg-label">{bg}</div><div className={`db-avail-tag ${availCls(tot)}`}>{availLbl(tot)}</div></div>;})}</div>}
          <div style={{marginTop:12,fontSize:12,color:'var(--db-gray-500)',textAlign:'center'}}>Tap to see bank-wise details &rarr;</div>
        </div>
      </div>
    </div>,
    /* Slide 2 — dark warm / camp */
    <div className="db-cnt" style={{display:'flex',alignItems:'center',gap:64,position:'relative',zIndex:1}}>
      <div className="db-slide-orb o1"/><div className="db-slide-orb o2"/><div className="db-slide-orb o3"/>
      <svg className="db-slide-svg-deco" style={{width:260,height:260,right:'0px',bottom:'-20px',opacity:.07}} viewBox="0 0 200 200">{Array.from({length:100},(_, i)=><circle key={i} cx={(i%10)*20+10} cy={Math.floor(i/10)*20+10} r="2.5" fill="white"/>)}</svg>
      <div style={{flex:1,position:'relative',zIndex:1}}>
        <div className="db-hero-eyebrow db-hero-eyebrow-light"><span className="material-symbols-outlined" style={{fontSize:13}}>event</span>Host a Donation Drive</div>
        <h1 style={{fontFamily:'var(--db-font-head)',fontWeight:700,fontSize:52,letterSpacing:'.03em',textTransform:'uppercase',lineHeight:1.0,...W,margin:'0 0 4px'}}>Be The Reason<br/><span style={{color:'var(--db-primary)'}}>100 People Donate</span></h1>
        <p style={{fontSize:17,...WM,margin:'14px 0 0',maxWidth:500,lineHeight:1.75}}>Partner with Vizag Volunteers to host a blood donation camp at your office, college, or community. We handle everything — you just invite your people.</p>
        <div className="db-slide-counters">
          {[{to:DC.camps.filter(c=>c.status==='upcoming').length,suffix:'',lbl:'Upcoming Camps'},{to:DC.camps.filter(c=>c.status==='past').length,suffix:'',lbl:'Past Camps'},{to:DC.camps.reduce((a,c)=>a+c.slots,0),suffix:'',lbl:'Total Slots'},{to:DC.camps.reduce((a,c)=>a+c.registered,0),suffix:'',lbl:'Registered'}].map((c,i)=><div key={i} className="db-slide-counters-item"><div className="cv"><CountUp to={c.to} active={slide===1} suffix={c.suffix}/></div><div className="cl">{c.lbl}</div></div>)}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="db-btn db-btn-yellow db-btn-lg" onClick={()=>setCampOpen(true)}><span className="material-symbols-outlined">volunteer_activism</span>Organise a Camp</button>
          <button className="db-btn db-btn-outline-light db-btn-lg" onClick={()=>setPage('camps')}><span className="material-symbols-outlined">event_available</span>Past Camps</button>
        </div>
      </div>
      <div style={{width:330,flexShrink:0,position:'relative',zIndex:1}}>
        <div className="db-slide-panel-glass">
          <div style={{borderRadius:12,overflow:'hidden',marginBottom:16,height:130,position:'relative',background:'linear-gradient(135deg,#3D1F00 0%,#5C2E00 50%,#1A0D00 100%)'}}>
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 330 130" preserveAspectRatio="xMidYMid slice">
              <circle cx="270" cy="30" r="22" fill="rgba(254,199,62,.25)"/>
              <circle cx="270" cy="30" r="14" fill="rgba(254,199,62,.35)"/>
              {[0,45,90,135,180,225,270,315].map((a,i)=><line key={i} x1={270+18*Math.cos(a*Math.PI/180)} y1={30+18*Math.sin(a*Math.PI/180)} x2={270+26*Math.cos(a*Math.PI/180)} y2={30+26*Math.sin(a*Math.PI/180)} stroke="rgba(254,199,62,.3)" strokeWidth="2"/>)}
              <polygon points="80,100 130,55 180,100" fill="rgba(230,46,50,.35)" stroke="rgba(230,46,50,.5)" strokeWidth="1.5"/>
              <rect x="100" y="80" width="60" height="20" fill="rgba(230,46,50,.25)"/>
              {[30,60,90,120,160,200,240,280,310].map((x,i)=><g key={i}><circle cx={x} cy={85} r={5} fill="rgba(255,255,255,.18)"/><rect x={x-4} y={90} width={8} height={14} rx="2" fill="rgba(255,255,255,.14)"/></g>)}
              <rect x="0" y="108" width="330" height="22" fill="rgba(0,0,0,.25)"/>
              <rect x="145" y="58" width="3" height="30" fill="rgba(230,46,50,.7)"/>
              <rect x="137" y="66" width="19" height="3" fill="rgba(230,46,50,.7)"/>
            </svg>
            <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,.6)',padding:'18px 12px 10px',fontSize:11,color:'rgba(255,255,255,.9)',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>Vizag Donation Camp</div>
          </div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.5)',marginBottom:12}}>What We Provide</div>
          {[{icon:'water_drop',text:'Blood supply on demand — we connect donors whenever you need'},{icon:'groups',text:'Dedicated volunteer team to coordinate & manage the camp'},{icon:'campaign',text:'Awareness drives to encourage voluntary blood donation'},{icon:'analytics',text:'Post-camp report with donor count & units collected'}].map((item,i)=><div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'9px 0',borderBottom:i<3?'1px solid rgba(255,255,255,.08)':'none'}}><span className="material-symbols-outlined" style={{color:'var(--db-primary)',fontSize:17,flexShrink:0,marginTop:2}}>{item.icon}</span><span style={{fontSize:13,...WM,lineHeight:1.6}}>{item.text}</span></div>)}
        </div>
      </div>
    </div>,
    /* Slide 3 — dark navy / science */
    <div className="db-cnt" style={{display:'flex',alignItems:'center',gap:64,position:'relative',zIndex:1}}>
      <div className="db-slide-orb o1"/><div className="db-slide-orb o2"/><div className="db-slide-orb o3"/>
      <svg className="db-slide-svg-deco" style={{width:380,height:460,right:'-60px',top:'-60px',opacity:.05}} viewBox="0 0 100 130" fill="none" stroke="white" strokeWidth="2"><path d="M50 5 C50 5 10 55 10 80 A40 40 0 0 0 90 80 C90 55 50 5 50 5Z"/><path d="M50 20 C50 20 22 60 22 80 A28 28 0 0 0 78 80 C78 60 50 20 50 20Z" strokeWidth="1" opacity=".5"/></svg>
      <div style={{flex:1,position:'relative',zIndex:1}}>
        <div className="db-hero-eyebrow db-hero-eyebrow-light"><span className="material-symbols-outlined" style={{fontSize:13}}>science</span>The Science of Giving</div>
        <h1 style={{fontFamily:'var(--db-font-head)',fontWeight:700,fontSize:52,letterSpacing:'.03em',textTransform:'uppercase',lineHeight:1.0,...W,margin:'0 0 4px'}}>One Drop.<br/><span style={{color:'var(--db-primary)'}}>Three Miracles.</span></h1>
        <p style={{fontSize:17,...WM,margin:'14px 0 0',maxWidth:500,lineHeight:1.75}}>One unit of blood is separated into three life-saving components — each going to a different patient. Your single donation can save up to 3 lives today.</p>
        <div className="db-slide-counters">
          {[{to:1,suffix:' unit',lbl:'You Donate'},{to:3,suffix:' lives',lbl:'You Save'},{to:450,suffix:'ml',lbl:'Per Donation'},{to:56,suffix:' days',lbl:'Waiting Period'}].map((c,i)=><div key={i} className="db-slide-counters-item"><div className="cv"><CountUp to={c.to} active={slide===2} suffix={c.suffix}/></div><div className="cl">{c.lbl}</div></div>)}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="db-btn db-btn-primary db-btn-lg" onClick={openDonor}><span className="material-symbols-outlined">favorite</span>Become a Donor</button>
          <button className="db-btn db-btn-outline-light db-btn-lg" onClick={()=>setPage('about')}><span className="material-symbols-outlined">info</span>Learn More</button>
        </div>
      </div>
      <div style={{width:330,flexShrink:0,position:'relative',zIndex:1}}>
        <div className="db-slide-panel-glass">
          <div style={{borderRadius:12,overflow:'hidden',marginBottom:16,height:110,position:'relative',background:'linear-gradient(135deg,#1a0305 0%,#3D0A0C 50%,#0a0115 100%)'}}>
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 330 110" preserveAspectRatio="xMidYMid slice">
              <path d="M165 15 C165 15 130 55 130 75 A35 35 0 0 0 200 75 C200 55 165 15 165 15Z" fill="rgba(230,46,50,.3)" stroke="rgba(230,46,50,.5)" strokeWidth="1.5"/>
              <polyline points="20,60 60,60 75,30 90,85 105,45 120,60 310,60" fill="none" stroke="rgba(230,46,50,.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="165" cy="75" r="4" fill="rgba(254,199,62,.6)"/>
              {[[40,30],[290,25],[310,80],[50,85]].map(([x,y],i)=><path key={i} d={`M${x} ${y-8} C${x} ${y-8} ${x-6} ${y} ${x-6} ${y+4} A6 6 0 0 0 ${x+6} ${y+4} C${x+6} ${y} ${x} ${y-8} ${x} ${y-8}Z`} fill="rgba(230,46,50,.2)"/>)}
            </svg>
            <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,.65))',padding:'16px 12px 10px',fontSize:11,color:'rgba(255,255,255,.9)',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>Our Donor Heroes</div>
          </div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.5)',marginBottom:12}}>1 Unit = 3 Life-Saving Components</div>
          {[{icon:'favorite',color:'#FF8080',bg:'rgba(230,46,50,.2)',title:'Red Blood Cells',sub:'Surgeries, anaemia & trauma'},{icon:'water_drop',color:'#7EC8D8',bg:'rgba(14,156,186,.2)',title:'Platelets',sub:'Cancer, dengue & bleeding disorders'},{icon:'opacity',color:'#FFD66B',bg:'rgba(254,199,62,.2)',title:'Plasma',sub:'Burns, clotting & trauma'}].map((item,i)=><div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'11px 0',borderBottom:i<2?'1px solid rgba(255,255,255,.08)':'none'}}><div style={{width:34,height:34,borderRadius:8,background:item.bg,display:'grid',placeItems:'center',flexShrink:0}}><span className="material-symbols-outlined" style={{color:item.color,fontSize:17}}>{item.icon}</span></div><div><div style={{fontWeight:700,fontSize:13,...W}}>{item.title}</div><div style={{fontSize:12,...WM,marginTop:2}}>{item.sub}</div></div></div>)}
        </div>
      </div>
    </div>
  ];
  const slideClasses=['db-slide-1','db-slide-2','db-slide-3'];
  return <React.Fragment>
    <div className="db-carousel" onMouseEnter={()=>{paused.current=true;}} onMouseLeave={()=>{paused.current=false;}}>
      <div className="db-carousel-track" style={{transform:`translateX(-${slide*100/3}%)`}}>
        {SLIDES.map((s,i)=><div key={i} className={`db-carousel-slide ${slideClasses[i]}`}>{s}</div>)}
      </div>
      <button className="db-carousel-nav prev" onClick={prev} aria-label="Previous slide"><span className="material-symbols-outlined" style={{fontSize:22}}>chevron_left</span></button>
      <button className="db-carousel-nav next" onClick={next} aria-label="Next slide"><span className="material-symbols-outlined" style={{fontSize:22}}>chevron_right</span></button>
      <div className="db-carousel-dots">
        {[0,1,2].map(i=><button key={i} className={`db-carousel-dot${slide===i?' active':''}`} onClick={()=>setSlide(i)} aria-label={`Slide ${i+1}`}/>)}
      </div>
    </div>
    <CampForm open={campOpen} onClose={()=>setCampOpen(false)}/>
  </React.Fragment>;
}
function HomePage({setPage,openDonor,openReq}){
  const{requests:REQUESTS,camps:CAMPS}=useContext(DataCtx);
  const{banks,loading}=useContext(BloodCtx);
  const{donors}=useContext(DataCtx);
  const openReqs=REQUESTS.filter(r=>r.status==='open');
  const critCount=openReqs.filter(r=>r.urgency==='critical').length;
  return <React.Fragment>
    <HeroCarousel setPage={setPage} openDonor={openDonor} openReq={openReq}/>
    <div className="db-stats-strip"><div className="db-stats-strip-inner">{[{val:donors.length,label:'Registered Donors',sub:'Vizag network'},{val:CAMPS.filter(c=>c.status==='upcoming').length,label:'Upcoming Camps',sub:'Join one near you'},{val:openReqs.length,label:'Open Requests',sub:critCount+' critical'},{val:banks.length,label:'Blood Banks',sub:'Stock updated every 30 min'}].filter(x=>x.val>0).map((s,i)=><div key={i} className="db-stat-item"><div className="db-stat-item__val">{s.val}</div><div className="db-stat-item__label">{s.label}</div><div className="db-stat-item__sub">{s.sub}</div></div>)}</div></div>
    <div className="db-sec" style={{background:'#fff',borderBottom:'1px solid var(--db-gray-200)'}}><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:20}}><div><div className="db-sec-title">Urgent Requests</div><div className="db-sec-sub">Help someone today &mdash; your blood can be the difference</div></div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('req')}>View all &rarr;</button></div>
      {REQUESTS.filter(r=>r.status==='open').length===0?<div className="db-empty"><span className="material-symbols-outlined">task_alt</span><b>No urgent requests right now</b><span>Need blood for a patient? Tap Request Blood at the top.</span></div>:<div className="db-grid-3">{REQUESTS.filter(r=>r.status==='open').slice(0,3).map(r=><ReqCard key={r.id} req={r}/>)}</div>}
    </div></div>
    <div className="db-sec"><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:20}}><div><div className="db-sec-title">Blood Availability</div><div className="db-sec-sub">Aggregated stock across Vizag blood banks &middot; Live from eRaktKosh</div></div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('avail')}>Detailed view &rarr;</button></div>
      <div className="db-grid-4">{BLOOD_GROUPS.map(bg=>{const tot=groupTotalLive(banks,bg);return <div key={bg} className="db-card" style={{cursor:'pointer'}} onClick={()=>setPage('avail')}><div className="db-card-body" style={{textAlign:'center'}}><div className="db-bg-chip lg" style={{margin:'0 auto 12px'}}>{bg}</div><div style={{fontWeight:700,fontSize:14}}>{loading?'Loading…':tot===0?'Not Available':tot<=5?'Limited Stock':'Available'}</div><div style={{fontSize:12,color:'var(--db-gray-500)',marginTop:4}}>{loading?'':tot===0?'Contact hospitals directly':'Across '+banks.length+' banks'}</div></div></div>;})}</div>
    </div></div>
    <div className="db-callout-yellow"><h2>Blood Must Circulate</h2><p>Voluntary blood donation is the safest source. Join Vizag's network of heroes &mdash; every donation can save up to 3 lives.</p><div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}><button className="db-btn db-btn-primary db-btn-lg" onClick={openDonor}><span className="material-symbols-outlined">volunteer_activism</span>Register as Donor</button><button className="db-btn db-btn-dark db-btn-lg" onClick={()=>setPage('about')}>Learn More</button></div></div>
    <div className="db-sec" style={{background:'#fff'}}><div className="db-cnt"><div className="db-grid-2">
      <div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><div className="db-sec-title" style={{fontSize:22,marginBottom:0}}>Top Donors</div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('donors')}>All donors &rarr;</button></div>
        <div className="db-card"><div className="db-card-body">{donors.slice(0,5).map((d,i)=><div key={d.id} className="db-donor-row"><div className={`db-rank-num ${i<3?'top':''}`}>{['🥇','🥈','🥉'][i]||i+1}</div><div className="db-donor-av">{d.initials}</div><div className="db-donor-info"><div className="dn">{d.name}</div><div className="ds">{d.area} &middot; Last: {d.last}</div></div><div className="db-bg-chip sm">{d.bg}</div><div className="db-donor-count">{d.donations}</div></div>)}</div></div>
      </div>
      <div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><div className="db-sec-title" style={{fontSize:22,marginBottom:0}}>Upcoming Camps</div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('camps')}>All camps &rarr;</button></div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>{CAMPS.filter(c=>c.status==='upcoming').slice(0,3).map(c=><div key={c.id} className="db-card"><div className="db-card-body" style={{display:'flex',gap:14,alignItems:'flex-start'}}><div className="db-date-badge"><span className="day">{c.day}</span><span className="mon">{c.mon}</span></div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{c.title}</div><div style={{fontSize:13,color:'var(--db-secondary)',fontWeight:600}}>{c.organizer}</div><div style={{fontSize:13,color:'var(--db-gray-500)',marginTop:4}}>{c.venue}</div><div className="db-slot-bar mt-8"><div className="db-slot-fill" style={{width:Math.round(c.registered/c.slots*100)+'%'}}></div></div><div style={{fontSize:12,color:'var(--db-gray-500)',marginTop:3}}>{c.registered}/{c.slots} slots filled</div></div><button className="db-btn db-btn-primary db-btn-sm" onClick={openDonor}>Register</button></div></div>)}</div>
      </div>
    </div></div></div>
  </React.Fragment>;
}
function AvailPage(){
  const[fG,setFG]=useState('All');const[fT,setFT]=useState('All');
  const{banks,loading,err,updatedAt,refresh}=useContext(BloodCtx);
  const[refreshing,setRefreshing]=useState(false);
  function doRefresh(){setRefreshing(true);refresh();setTimeout(()=>setRefreshing(false),2000);}
  const filtered=banks.filter(b=>fT==='All'||b.type===fT);
  const groups=fG==='All'?TABLE_GROUPS:[fG];
  return <React.Fragment>
    <div style={{background:'#fff',borderBottom:'1px solid var(--db-gray-200)',padding:'28px 0'}}><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <div className="db-sec-title">Blood Availability</div>
          <div className="db-sec-sub">Live stock across Visakhapatnam blood banks &middot; Source: eRaktKosh / MoHFW</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {updatedAt&&<span style={{fontSize:12,color:'var(--db-gray-500)',display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-outlined" style={{fontSize:14}}>schedule</span>Updated {fmtTime(updatedAt)}</span>}
          <button className="db-btn db-btn-outline db-btn-sm" onClick={doRefresh} disabled={loading||refreshing}><span className="material-symbols-outlined" style={{animation:loading||refreshing?'spin 1s linear infinite':'none'}}>refresh</span>Refresh</button>
        </div>
      </div>
    </div></div>
    <div className="db-pw"><div className="db-cnt">
    <div className="db-filter-bar">
      <label>Blood Group</label>
      <select value={fG} onChange={e=>setFG(e.target.value)}><option>All</option>{TABLE_GROUPS.map(bg=><option key={bg}>{bg}</option>)}</select>
      <label>Bank Type</label>
      <select value={fT} onChange={e=>setFT(e.target.value)}><option>All</option><option>Government</option><option>Private</option><option>Charitable</option></select>
    </div>
    {loading&&<div style={{textAlign:'center',padding:'48px 0',color:'var(--db-gray-500)'}}>
      <span className="material-symbols-outlined" style={{fontSize:36,display:'block',marginBottom:8,animation:'spin 1s linear infinite'}}>progress_activity</span>
      Fetching live data from eRaktKosh&hellip;
    </div>}
    {err&&<div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:8,padding:'14px 18px',marginBottom:20,fontSize:14}}>
      <strong>Could not load live data</strong> &mdash; {err}. In production deploy the Laravel proxy; in this preview a CORS proxy is used.
    </div>}
    {!loading&&filtered.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'var(--db-gray-500)'}}>No blood banks found for selected filters.</div>}
    {!loading&&filtered.length>0&&<div className="db-avail-wrap"><table className="db-avail-tbl">
      <thead><tr>
        <th style={{textAlign:'left'}}>Blood Bank</th>
        {groups.map(bg=><th key={bg}>{bg}</th>)}
        <th>Updated</th>
      </tr></thead>
      <tbody>{filtered.map(bank=><tr key={bank.id}>
        <td>
          <div style={{fontWeight:700,fontSize:14}}>{bank.name}</div>
          {bank.area&&<div style={{fontSize:12,color:'var(--db-gray-500)',marginTop:2}}>{bank.area}</div>}
          {bank.phone&&<a href={'tel:'+bank.phone} style={{fontSize:12,color:'var(--db-secondary)',fontWeight:600,marginTop:2,display:'block'}}>{bank.phone}</a>}
          <span style={{fontSize:11,padding:'1px 7px',borderRadius:4,background:typeBg(bank.type).bg,color:typeBg(bank.type).color,fontWeight:600,marginTop:4,display:'inline-block'}}>{bank.type}</span>
        </td>
        {groups.map(bg=><td key={bg}><span className={cellCls(bank.stock[bg])}>{cellLbl(bank.stock[bg])}</span></td>)}
        <td style={{fontSize:11,color:'var(--db-gray-500)',whiteSpace:'nowrap'}}>{bank.updated?bank.updated.split(' ')[1]?.slice(0,5):'--'}</td>
      </tr>)}</tbody>
    </table></div>}
    <div className="db-updated-note" style={{marginTop:16}}><span className="material-symbols-outlined" style={{fontSize:14}}>info</span>Data sourced live from <strong>eRaktKosh (MoHFW)</strong>. Banks sorted by total availability. Call to confirm before visiting.</div>
  </div></div>
  </React.Fragment>;
}
function RequestsPage({openReq}){
  const{requests:REQUESTS}=useContext(DataCtx);
  const[fBg,setFBg]=useState('All');const[fUrg,setFUrg]=useState('All');const[fSt,setFSt]=useState('open');const[search,setSearch]=useState('');
  const filtered=REQUESTS.filter(r=>{if(fBg!=='All'&&r.bg!==fBg)return false;if(fUrg!=='All'&&r.urgency!==fUrg)return false;if(fSt!=='All'&&r.status!==fSt)return false;if(search&&![r.name,r.hospital,r.area].join(' ').toLowerCase().includes(search.toLowerCase()))return false;return true;});
  const stats={total:REQUESTS.length,open:REQUESTS.filter(r=>r.status==='open').length,crit:REQUESTS.filter(r=>r.urgency==='critical'&&r.status==='open').length,done:REQUESTS.filter(r=>r.status==='fulfilled').length};
  return <React.Fragment>
    <div style={{background:'#fff',borderBottom:'1px solid var(--db-gray-200)',padding:'28px 0'}}><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><div className="db-sec-title">Active Blood Requests</div><div className="db-sec-sub">Real-time requests from Vizag hospitals &mdash; respond and save a life</div></div>
        <button className="db-btn db-btn-primary" onClick={openReq}><span className="material-symbols-outlined">add_circle</span>Post a Request</button>
      </div>
    </div></div>
    <div className="db-pw"><div className="db-cnt">
    <div className="db-grid-4 mb-24">{[{label:'Total',val:stats.total,icon:'list',c:'b'},{label:'Open',val:stats.open,icon:'schedule',c:'y'},{label:'Critical',val:stats.crit,icon:'emergency',c:'r'},{label:'Fulfilled',val:stats.done,icon:'check_circle',c:'g'}].map((s,i)=><div key={i} className={`db-kpi-card ${s.c}`}><div className={`db-kpi-card__icon ${s.c}`}><span className="material-symbols-outlined">{s.icon}</span></div><div className="db-kpi-card__val">{s.val}</div><div className="db-kpi-card__label">{s.label}</div></div>)}</div>
    <div className="db-filter-bar"><input type="text" placeholder="Search name, hospital or area..." value={search} onChange={e=>setSearch(e.target.value)} style={{minWidth:220}}/><label>Group</label><select value={fBg} onChange={e=>setFBg(e.target.value)}><option>All</option>{BLOOD_GROUPS.map(bg=><option key={bg}>{bg}</option>)}</select><label>Urgency</label><select value={fUrg} onChange={e=>setFUrg(e.target.value)}><option>All</option><option value="critical">Critical</option><option value="urgent">Urgent</option><option value="routine">Routine</option></select><label>Status</label><select value={fSt} onChange={e=>setFSt(e.target.value)}><option value="All">All</option><option value="open">Open</option><option value="matched">Matched</option><option value="fulfilled">Fulfilled</option></select></div>
    {filtered.length===0?<div style={{textAlign:'center',padding:48,color:'var(--db-gray-500)'}}><span className="material-symbols-outlined" style={{fontSize:48,display:'block',marginBottom:12}}>search_off</span>No requests match your filters.</div>:<div className="db-grid-3">{filtered.map(r=><ReqCard key={r.id} req={r}/>)}</div>}
  </div></div>
  </React.Fragment>;
}
function DonorsPage({openDonor}){
  const REQ_ALL=useContext(DataCtx).requests;
  const{donors}=useContext(DataCtx);
  return <React.Fragment>
    <div style={{background:'#fff',borderBottom:'1px solid var(--db-gray-200)',padding:'28px 0'}}><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><div className="db-sec-title">Our Heroes</div><div className="db-sec-sub">Recognising the generous souls who keep Vizag's blood supply alive</div></div>
        <button className="db-btn db-btn-primary" onClick={openDonor}><span className="material-symbols-outlined">add_circle</span>Register as Donor</button>
      </div>
    </div></div>
    <div className="db-pw"><div className="db-cnt">
    <div className="db-grid-4 mb-24">{[{label:'Registered Donors',val:donors.length,icon:'people',c:'b'},{label:'Total Donations',val:donors.reduce((a,d)=>a+(d.donations||0),0),icon:'water_drop',c:'r'},{label:'Requests Fulfilled',val:REQ_ALL.filter(r=>r.status==='fulfilled').length,icon:'favorite',c:'g'},{label:'Blood Groups',val:'8 / 8',icon:'bloodtype',c:'y'}].map((s,i)=><div key={i} className={`db-kpi-card ${s.c}`}><div className={`db-kpi-card__icon ${s.c}`}><span className="material-symbols-outlined">{s.icon}</span></div><div className="db-kpi-card__val">{s.val}</div><div className="db-kpi-card__label">{s.label}</div></div>)}</div>
    <div className="db-grid-2">
      <div><div className="db-sec-title mb-16" style={{fontSize:22}}>Leaderboard</div><div className="db-card"><div className="db-card-body">{donors.map((d,i)=><div key={d.id} className="db-donor-row"><div className={`db-rank-num ${i<3?'top':''}`}>{['🥇','🥈','🥉'][i]||i+1}</div><div className="db-donor-av">{d.initials}</div><div className="db-donor-info"><div className="dn">{d.name}</div><div className="ds">{d.area} &middot; Last: {d.last}</div></div><div className="db-bg-chip sm">{d.bg}</div><div style={{textAlign:'right'}}><div className="db-donor-count">{d.donations}</div><div style={{fontSize:11,color:'var(--db-gray-500)'}}>donations</div></div></div>)}</div></div></div>
      <div>
        <div className="db-sec-title mb-16" style={{fontSize:22}}>Badges &amp; Milestones</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>{BADGE_DEFS.map(b=><div key={b.id} className="db-badge-card"><div className={`db-badge-ico ${b.cls}`}>{b.emoji}</div><div className="db-badge-name">{b.name}</div><div className="db-badge-desc">{b.desc}</div></div>)}</div>
        <div className="db-card" style={{background:'var(--db-primary-soft)',border:'2px solid var(--db-primary)',textAlign:'center'}}><div className="db-card-body"><span className="material-symbols-outlined" style={{fontSize:32,color:'var(--db-secondary)',display:'block',marginBottom:8}}>volunteer_activism</span><div style={{fontWeight:700,fontSize:16}}>Join Our Donor Network</div><div style={{fontSize:14,color:'var(--db-gray-700)',margin:'6px 0 16px'}}>Register today and earn your first badge!</div><button className="db-btn db-btn-primary" onClick={openDonor}>Register as Donor</button></div></div>
      </div>
    </div>
  </div></div>
  </React.Fragment>;
}
function CampsPage({openDonor}){
  const{camps:CAMPS}=useContext(DataCtx);
  const[tab,setTab]=useState('upcoming');const shown=CAMPS.filter(c=>c.status===tab);
  return <React.Fragment>
    <div style={{background:'#fff',borderBottom:'1px solid var(--db-gray-200)',padding:'28px 0'}}><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><div className="db-sec-title">Blood Donation Camps</div><div className="db-sec-sub">Upcoming and past donation drives across Visakhapatnam</div></div>
        <button className="db-btn db-btn-primary" onClick={openDonor}><span className="material-symbols-outlined">add_circle</span>Organise a Camp</button>
      </div>
    </div></div>
    <div className="db-pw"><div className="db-cnt">
    <div className="db-grid-4 mb-24">{[{label:'Upcoming',val:CAMPS.filter(c=>c.status==='upcoming').length,icon:'event_upcoming',c:'y'},{label:'Past Camps',val:CAMPS.filter(c=>c.status==='past').length,icon:'event_available',c:'g'},{label:'Total Slots',val:CAMPS.reduce((a,c)=>a+c.slots,0),icon:'chair',c:'b'},{label:'Registered',val:CAMPS.reduce((a,c)=>a+c.registered,0),icon:'how_to_reg',c:'r'}].map((s,i)=><div key={i} className={`db-kpi-card ${s.c}`}><div className={`db-kpi-card__icon ${s.c}`}><span className="material-symbols-outlined">{s.icon}</span></div><div className="db-kpi-card__val">{s.val}</div><div className="db-kpi-card__label">{s.label}</div></div>)}</div>
    <div style={{display:'flex',gap:4,padding:4,background:'var(--db-gray-200)',borderRadius:10,width:'fit-content',marginBottom:20}}>{['upcoming','past'].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'8px 20px',borderRadius:8,fontWeight:600,fontSize:13.5,cursor:'pointer',background:tab===t?'#fff':'transparent',color:tab===t?'var(--db-black)':'var(--db-gray-500)',border:0,boxShadow:tab===t?'0 1px 3px rgba(0,0,0,.08)':'none'}}>{t==='upcoming'?'Upcoming':'Past'}</button>)}</div>
    {shown.length===0?<div style={{textAlign:'center',padding:48,color:'var(--db-gray-500)'}}><span className="material-symbols-outlined" style={{fontSize:48,display:'block',marginBottom:12}}>event_busy</span>No {tab} camps found.</div>:<div className="db-grid-3">{shown.map(c=><div key={c.id} className="db-camp-card"><div className={`db-camp-stripe ${c.status}`}></div><div className="db-camp-body"><div style={{display:'flex',gap:14,alignItems:'flex-start'}}><div className="db-date-badge"><span className="day">{c.day}</span><span className="mon">{c.mon}</span></div><div className="db-camp-info"><div className="ctitle">{c.title}</div><div className="corg">{c.organizer}</div><div className="caddr"><span className="material-symbols-outlined">location_on</span>{c.venue}</div></div></div>{c.status==='upcoming'&&<React.Fragment><div style={{fontSize:13,color:'var(--db-gray-500)',display:'flex',alignItems:'center',gap:6}}><span className="material-symbols-outlined" style={{fontSize:15,color:'var(--db-green)'}}>how_to_reg</span>{c.registered}/{c.slots} slots filled</div><div className="db-slot-bar"><div className="db-slot-fill" style={{width:Math.round(c.registered/c.slots*100)+'%'}}></div></div>{c.contact&&<div style={{fontSize:13,color:'var(--db-gray-500)',display:'flex',gap:6,alignItems:'center'}}><span className="material-symbols-outlined" style={{fontSize:14}}>contact_phone</span>{c.contact}</div>}<button className="db-btn db-btn-primary" style={{width:'100%'}} onClick={openDonor}><span className="material-symbols-outlined">how_to_reg</span>Register Slot</button></React.Fragment>}{c.status==='past'&&<div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'var(--db-green-soft)',borderRadius:6,fontSize:13,color:'var(--db-green)',fontWeight:600}}><span className="material-symbols-outlined" style={{fontSize:16}}>check_circle</span>{c.registered} donors participated &mdash; Completed</div>}</div></div>)}</div>}
  </div></div>
  </React.Fragment>;
}
function FaqItem({faq}){const[open,setOpen]=useState(false);return <div className="db-faq-item"><div className={`db-faq-q ${open?'open':''}`} onClick={()=>setOpen(o=>!o)}>{faq.q}<span className="material-symbols-outlined">expand_more</span></div><div className={`db-faq-a ${open?'open':''}`}>{faq.a}</div></div>;}
function AboutPage(){
  return <React.Fragment>
    <div style={{background:'#fff',borderBottom:'1px solid var(--db-gray-200)',padding:'28px 0'}}><div className="db-cnt">
      <div><div className="db-sec-title">About Digi Blood</div><div className="db-sec-sub">A Vizag Volunteers initiative since 20 April 2021</div></div>
    </div></div>
    <div className="db-pw"><div className="db-cnt">
    <div className="db-grid-2 mb-24">
      <div className="db-card" style={{borderTop:'4px solid var(--db-secondary)'}}><div className="db-card-body-lg"><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><div style={{width:38,height:38,borderRadius:8,background:'#F8D7DA',display:'grid',placeItems:'center'}}><span className="material-symbols-outlined" style={{color:'var(--db-secondary)'}}>visibility</span></div><div style={{fontFamily:'var(--db-font-head)',fontWeight:700,fontSize:20,letterSpacing:'.04em',textTransform:'uppercase'}}>Our Vision</div></div><p style={{color:'var(--db-gray-700)',fontSize:15,lineHeight:1.7}}>A Visakhapatnam where no patient ever waits for blood &mdash; a city where voluntary blood donation is a social norm and every unit is traceable, available, and delivered in time.</p></div></div>
      <div className="db-card" style={{borderTop:'4px solid var(--db-primary)'}}><div className="db-card-body-lg"><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><div style={{width:38,height:38,borderRadius:8,background:'var(--db-primary-soft)',display:'grid',placeItems:'center'}}><span className="material-symbols-outlined" style={{color:'var(--db-primary-dark)'}}>flag</span></div><div style={{fontFamily:'var(--db-font-head)',fontWeight:700,fontSize:20,letterSpacing:'.04em',textTransform:'uppercase'}}>Our Mission</div></div><p style={{color:'var(--db-gray-700)',fontSize:15,lineHeight:1.7}}>To build a transparent, technology-driven platform that bridges voluntary blood donors with patients in urgent need &mdash; eliminating delays and building a culture of regular voluntary donation in Vizag.</p></div></div>
    </div>
    <div className="db-grid-2 mb-24">
      <div><div className="db-sec-title mb-16" style={{fontSize:22}}>Project Brief</div><div className="db-card"><div className="db-card-body">{[{icon:'calendar_today',label:'Project Launch',val:'20 April 2021'},{icon:'check_circle',label:'Status',val:'Active'},{icon:'location_on',label:'Service Area',val:'Visakhapatnam, Andhra Pradesh'},{icon:'person',label:'Project Leads',val:'Tanuja Bakke & Tanuja Seeranam'},{icon:'groups',label:'Team Leads',val:'Sudharshan Lotla, Monika Vechalapu, Kavya Sambangi'},{icon:'home',label:'Address',val:'Flat 401, Vinayagar Heights, Sampath Vinayaka Temple Road, Visakhapatnam - 530003'}].map((item,i,arr)=><div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'12px 0',borderBottom:i<arr.length-1?'1px solid var(--db-gray-200)':'none'}}><span className="material-symbols-outlined" style={{color:'var(--db-secondary)',flexShrink:0}}>{item.icon}</span><div><div style={{fontSize:11,fontWeight:700,color:'var(--db-gray-500)',letterSpacing:'.07em',textTransform:'uppercase'}}>{item.label}</div><div style={{fontSize:14,fontWeight:600,marginTop:2}}>{item.val}</div></div></div>)}</div></div></div>
      <div><div className="db-sec-title mb-16" style={{fontSize:22}}>Safety Protocols</div><div className="db-card"><div className="db-card-body">{SAFETY.map((s,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 0',borderBottom:i<SAFETY.length-1?'1px solid var(--db-gray-200)':'none'}}><span className="material-symbols-outlined" style={{color:'var(--db-green)',fontSize:18,flexShrink:0,marginTop:2}}>verified</span><span style={{fontSize:14,color:'var(--db-gray-700)',lineHeight:1.6}}>{s}</span></div>)}</div></div></div>
    </div>
    <div style={{marginBottom:32}}><div className="db-sec-title mb-16" style={{fontSize:22}}>Donor Eligibility</div><div style={{display:'flex',flexDirection:'column',gap:8}}>{ELIGIBILITY.map((e,i)=><div key={i} className={`db-elig-item ${e.ok?'ok':'no'}`}><span className="material-symbols-outlined">{e.ok?'check_circle':'cancel'}</span><div><div className="et">{e.title}</div><div className="es">{e.sub}</div></div></div>)}</div></div>
    <div style={{marginBottom:32}}><div className="db-sec-title mb-16" style={{fontSize:22}}>Frequently Asked Questions</div><div className="db-card"><div className="db-card-body">{FAQS.map((f,i)=><FaqItem key={i} faq={f}/>)}</div></div></div>
    <div className="db-card" style={{background:'var(--db-black)',border:'none'}}><div className="db-card-body-lg" style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}><div style={{flex:1}}><div style={{fontFamily:'var(--db-font-head)',fontWeight:700,fontSize:22,color:'#fff',letterSpacing:'.04em',textTransform:'uppercase'}}>Get in Touch</div><div style={{color:'rgba(255,255,255,.6)',marginTop:8,fontSize:14}}>Flat 401, Vinayagar Heights, Sampath Vinayaka Temple Road, Visakhapatnam - 530003</div><a href="https://www.vizagvolunteers.org/projects/digi-blood" target="_blank" style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--db-primary)',fontWeight:600,fontSize:14,marginTop:12}}><span className="material-symbols-outlined" style={{fontSize:16}}>language</span>vizagvolunteers.org/projects/digi-blood</a></div><a href="https://www.vizagvolunteers.org/projects/digi-blood" target="_blank" className="db-btn db-btn-yellow db-btn-lg"><span className="material-symbols-outlined">open_in_new</span>Visit Official Page</a></div></div>
  </div></div>
  </React.Fragment>;
}
function DigiBloodApp(){
  const[page,setPage]=useState('home');
  const[toasts,showToast]=useToast();
  const[donorOpen,setDonorOpen]=useState(false);
  const[reqOpen,setReqOpen]=useState(false);
  const[posterData,setPosterData]=useState(null);
  useEffect(()=>{document.title=PAGE_TITLES[page]||'Digi Blood';},[page]);
  const openDonor=()=>setDonorOpen(true);
  const openReq=()=>setReqOpen(true);
  const pages={
    home:<HomePage setPage={setPage} openDonor={openDonor} openReq={openReq}/>,
    avail:<AvailPage/>,
    req:<RequestsPage openReq={openReq}/>,
    donors:<DonorsPage openDonor={openDonor}/>,
    camps:<CampsPage openDonor={openDonor}/>,
    about:<AboutPage/>
  };
  return <BloodProvider><DataProvider>
    <div className="db-app">
      <SubNav page={page} setPage={setPage} openDonor={openDonor} openReq={openReq}/>
      <main>{pages[page]}</main>
      <DonorForm open={donorOpen} onClose={()=>setDonorOpen(false)}/>
      <RequestForm open={reqOpen} onClose={()=>setReqOpen(false)} onSuccess={data=>{setReqOpen(false);setPosterData(data);}}/>
      <PosterModal req={posterData} onClose={()=>setPosterData(null)}/>
      <Toasts list={toasts}/>
    </div>
  </DataProvider></BloodProvider>;
}
createRoot(document.getElementById('db-root')).render(location.hash==='#admin'?<Admin/>:<DigiBloodApp/>);

// Tell a parent page (iframe embed) how tall we are, so VV's page can resize the frame.
if(window.parent!==window){
  const send=()=>window.parent.postMessage({type:'digi-blood-height',height:document.documentElement.scrollHeight},'*');
  new ResizeObserver(send).observe(document.body);send();
}
