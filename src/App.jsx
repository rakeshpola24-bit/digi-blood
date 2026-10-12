import React,{useState,useEffect,useContext,createContext,useCallback,useRef,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import {LIVE,watch,guard,submitRecord,logReply} from './store.js';
import Admin from './Admin.jsx';
import {CAN_RECEIVE_FROM,helpLink,parseHelp,helpMessage,URG_TEXT} from './match.js';
import {parseRequest,rewriteMessage,chatReply,gen,friendly,shrinkImage,PH} from './ai.js';


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
  {q:'How can I register as a donor?',a:'Tap "Register as Donor" and fill the registration form. You will be added to our voluntary donor network and notified when your blood group is urgently needed.'},
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
  const div=document.createElement('div');div.innerHTML=nameHtml.replace(/<br\s*\/?>/gi,'\n');
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
  function show(msg,type=''){const id=Date.now();setList(l=>[...l,{id,msg,type}]);setTimeout(()=>setList(l=>l.filter(x=>x.id!==id)),6500);}
  return[list,show];
}
function Toasts({list}){return <div className="db-toast-wrap">{list.map(t=><div key={t.id} className={`db-toast ${t.type}`}><span className="material-symbols-outlined">{t.type==='ok'?'check_circle':t.type==='err'?'error':'info'}</span>{t.msg}</div>)}</div>;}

const NAV_TABS=[{id:'home',icon:'home',label:'Home'},{id:'avail',icon:'bloodtype',label:'Availability'},{id:'req',icon:'priority_high',label:'Requests'},{id:'donors',icon:'volunteer_activism',label:'Donors'},{id:'camps',icon:'event',label:'Camps'},{id:'about',icon:'info',label:'About'}];
const PAGE_TITLES={home:'Digi Blood — Vizag Volunteers',avail:'Blood Availability — Digi Blood',req:'Active Requests — Digi Blood',donors:'Donors — Digi Blood',camps:'Camps — Digi Blood',about:'About Digi Blood'};

/* ── SubNav ── */
function SubNav({page,setPage,openDonor,openReq}){
  return <div className="db-subnav"><div className="db-subnav-inner">
    <div style={{display:'flex',alignItems:'stretch',overflowX:'auto'}}>{NAV_TABS.map(n=><button key={n.id} className={`db-subnav-btn${page===n.id?' db-active':''}`} onClick={()=>setPage(n.id)}><span className="material-symbols-outlined">{n.icon}</span>{n.label}</button>)}</div>
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',flexShrink:0}}>
      <button className="db-btn db-btn-outline db-btn-sm" onClick={openReq}><span className="material-symbols-outlined">add_circle</span>Request Blood</button>
      <button className="db-btn db-btn-primary db-btn-sm" onClick={openDonor}><span className="material-symbols-outlined">favorite</span>Register as Donor</button>
    </div>
  </div></div>;
}

/* ── Modal wrapper ── */
function Modal({open,onClose,title,sub,children}){
  useEffect(()=>{if(!open)return;const k=e=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);},[open]);
  if(!open)return null;
  return <div className="db-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="db-modal">
      <div className="db-modal-hd">
        <div><div className="db-modal-title">{title}</div>{sub&&<div style={{fontSize:13,color:'var(--db-gray-500)',marginTop:4}}>{sub}</div>}</div>
        <button className="db-modal-close" aria-label="Close" onClick={onClose}><span className="material-symbols-outlined" style={{fontSize:22}}>close</span></button>
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
  function qrImg(){return import('qrcode').then(function(Q){var m=Q.default||Q;return m.toDataURL(helpLink({name:req.patient_name||req.name,age:'',gender:'',units:req.units||1,bg:req.bg,hospital:req.hospital,area:req.area,phone:req.phone||req.contact,urgency:String(req.urgency||'urgent').toLowerCase()}),{errorCorrectionLevel:'L',margin:1,width:300});}).then(loadImg).catch(function(){return null;});}
  return Promise.all([loadImg(import.meta.env.BASE_URL+"vv-logo.svg"),qrImg()]).then(function(imgs){var vvImg=imgs[0],qrI=imgs[1];
    var ctx=canvas.getContext('2d');
    var RED='#C0141A',DARK='#8B0000',INK='#1A1A1A',GRAY='#8A8A8A';
    function trunc(text,maxW){text=String(text||'');if(ctx.measureText(text).width<=maxW)return text;while(text.length>0&&ctx.measureText(text+'\u2026').width>maxW)text=text.slice(0,-1);return text+'\u2026';}
    // background
    var bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#FFFAF3');bg.addColorStop(1,'#F6E9DA');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    // top bar
    ctx.fillStyle=DARK;ctx.fillRect(0,0,W,12);
    // header: logo + name
    if(vvImg){ctx.save();ctx.beginPath();ctx.arc(90,90,62,0,Math.PI*2);ctx.clip();ctx.drawImage(vvImg,28,28,124,124);ctx.restore();}
    ctx.textAlign='left';ctx.fillStyle=INK;ctx.font='bold 40px Oswald';ctx.fillText('VIZAG VOLUNTEERS',172,86);
    ctx.fillStyle=GRAY;ctx.font='22px Inter';ctx.fillText('Powered by DigiBlood',172,120);
    // emergency pill
    var urg=String(req.urgency||'').toLowerCase();
    var tag=(urg==='urgent'||urg==='critical'||urg==='emergency'||!urg)?'EMERGENCY':'BLOOD NEEDED';
    ctx.font='bold 34px Oswald';var tw=ctx.measureText(tag).width+56;
    ctx.fillStyle=RED;ctx.beginPath();ctx.roundRect?ctx.roundRect(W-40-tw,52,tw,70,35):ctx.rect(W-40-tw,52,tw,70);ctx.fill();
    ctx.fillStyle='#FFF';ctx.textAlign='center';ctx.fillText(tag,W-40-tw/2,100);
    // title
    ctx.fillStyle=INK;ctx.font='bold 150px Oswald';ctx.fillText('BLOOD REQUEST',W/2,300);
    // blood drop with group (vibrant ruby gradient + soft glow)
    var cx=W/2,top=318,bot=598;
    function dropPath(){ctx.beginPath();ctx.moveTo(cx,top);ctx.bezierCurveTo(cx+28,top+72,cx+155,top+145,cx+155,top+205);
    ctx.bezierCurveTo(cx+155,top+258,cx+85,bot,cx,bot);ctx.bezierCurveTo(cx-85,bot,cx-155,top+258,cx-155,top+205);
    ctx.bezierCurveTo(cx-155,top+145,cx-28,top+72,cx,top);}
    var g=ctx.createLinearGradient(0,top,0,bot);g.addColorStop(0,'#D32F2F');g.addColorStop(1,'#B71C1C');
    ctx.save();ctx.shadowColor='rgba(211,47,47,0.55)';ctx.shadowBlur=45;ctx.fillStyle=g;dropPath();ctx.fill();ctx.restore();
    ctx.lineWidth=6;ctx.strokeStyle='#FFFFFF';dropPath();ctx.stroke();
    ctx.lineWidth=2;ctx.strokeStyle='rgba(183,28,28,0.5)';dropPath();ctx.stroke();
    ctx.fillStyle='#FFF';ctx.textAlign='center';ctx.save();ctx.shadowColor='rgba(0,0,0,0.25)';ctx.shadowBlur=8;ctx.font='bold 130px Oswald';ctx.fillText(req.bg||'Any',cx,top+215);ctx.restore();
    ctx.font='bold 26px Oswald';ctx.fillText('BLOOD NEEDED',cx,top+252);
    // left: why donate
    ctx.textAlign='center';ctx.fillStyle=RED;ctx.font='bold 120px Oswald';ctx.fillText('3',150,455);
    ctx.fillStyle=INK;ctx.font='bold 30px Oswald';ctx.fillText('LIVES SAVED',150,495);ctx.fillText('BY 1 DONATION',150,530);
    // right: real QR to the donor page
    if(qrI){ctx.fillStyle='#FFF';ctx.beginPath();ctx.roundRect?ctx.roundRect(830,350,200,200,16):ctx.rect(830,350,200,200);ctx.fill();ctx.strokeStyle='rgba(192,20,26,0.35)';ctx.lineWidth=2;ctx.stroke();ctx.drawImage(qrI,840,360,180,180);
      ctx.fillStyle=RED;ctx.font='bold 22px Inter';ctx.fillText('SCAN TO HELP',930,580);}
    // details card
    var cy=622,ch=190;
    ctx.fillStyle='#FFF';ctx.beginPath();ctx.roundRect?ctx.roundRect(40,cy,W-80,ch,22):ctx.rect(40,cy,W-80,ch);ctx.fill();
    ctx.strokeStyle='rgba(192,20,26,0.35)';ctx.lineWidth=2;ctx.stroke();
    function lbl(t,x,y,col){ctx.textAlign='left';ctx.fillStyle=col||GRAY;ctx.font='bold 20px Inter';try{ctx.letterSpacing='4px';}catch(e){}ctx.fillText(t.split('').join(''),x,y);try{ctx.letterSpacing='0px';}catch(e){}}
    function field(l,val,x,y,maxW,size,col,lc){lbl(l,x,y,lc);ctx.fillStyle=col||INK;ctx.font='bold '+(size||40)+'px Oswald';ctx.textAlign='left';ctx.fillText(trunc(val,maxW),x,y+42);}
    var hosp=[req.hospital,req.area].filter(Boolean);
    var hv=hosp.length==2&&hosp[0].toLowerCase()===hosp[1].toLowerCase()?hosp[0]:hosp.join(', ');
    field('PATIENT',req.patient_name||req.name||'-',72,cy+36,300,34);
    field('UNITS',(req.units||1)+(parseInt(req.units)===1?' UNIT':' UNITS'),460,cy+36,200,34);
    field('URGENCY',req.urgency||'Urgent',700,cy+36,300,34,RED);
    ctx.strokeStyle='rgba(192,20,26,0.2)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(72,cy+98);ctx.lineTo(W-72,cy+98);ctx.stroke();
    ctx.font='bold 46px Oswald';
    field('HOSPITAL',hv,72,cy+128,W-144,46,INK,RED);
    // contact call-to-action capsule
    var py=828,ph=106;
    ctx.save();ctx.shadowColor='rgba(183,28,28,0.35)';ctx.shadowBlur=18;ctx.shadowOffsetY=6;
    var pg=ctx.createLinearGradient(0,py,0,py+ph);pg.addColorStop(0,'#D32F2F');pg.addColorStop(1,'#B71C1C');
    ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect?ctx.roundRect(40,py,W-80,ph,48):ctx.rect(40,py,W-80,ph);ctx.fill();ctx.restore();
    ctx.fillStyle='#FFE9A8';ctx.textAlign='center';ctx.font='bold 22px Inter';try{ctx.letterSpacing='4px';}catch(e){}ctx.fillText('CALL / WHATSAPP NOW',W/2,py+34);try{ctx.letterSpacing='0px';}catch(e){}
    ctx.fillStyle='#FFF';ctx.font='bold 56px Oswald';try{ctx.letterSpacing='3px';}catch(e){}ctx.fillText(trunc(req.phone||req.contact||'-',W-200),W/2,py+90);try{ctx.letterSpacing='0px';}catch(e){}
    // request id
    ctx.fillStyle=GRAY;ctx.font='bold 22px Inter';ctx.textAlign='center';ctx.fillText('REQUEST ID  '+(req.request_no||'VVDBR00000000'),W/2,962);
    // footer
    ctx.fillStyle=DARK;ctx.fillRect(0,975,W,105);
    ctx.fillStyle='#FFF';ctx.font='italic bold 32px Georgia';ctx.fillText('Your blood today can bring back a tomorrow.',W/2,1022);
    ctx.fillStyle='#FFDDDD';ctx.font='22px Inter';ctx.fillText('Safe & quick  \u2022  Every drop counts  \u2022  www.vizagvolunteers.org',W/2,1058);
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
        <button className="db-modal-close" aria-label="Close" onClick={onClose}><span className="material-symbols-outlined" style={{fontSize:22}}>close</span></button>
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

const VIZAG_AREAS=['Akkayyapalem','Allipuram','Anakapalle','Anandapuram','Arilova','Arilova Colony','Asilmetta','Auto Nagar','Bheemunipatnam (Bheemili)','Birla Junction','Chinagadili','Chinamushidiwada','Chinnawaltair','Convent Junction','Dabagardens','Dondaparthy','Dwaraka Nagar','Endada','Gajuwaka','Gnanapuram','Gopalapatnam','Gopalapatnam Old','Hanumanthawaka','Health City','HB Colony','Isukathota','Jagadamba Junction','Jnana Puram','Kancharapalem','Kailasagiri','Kapuluppada','Kommadi','Kurmannapalem','Lawsons Bay Colony','Madhurawada','Maddilapalem','Maharani Peta','Marripalem','Mindi','MVP Colony','MVP Sector 1','MVP Sector 6','NAD Junction','Narava','Nakkavanipalem','Old Gajuwaka','One Town','Pedagantyada','Pedagadili','Pedawaltair','Pendurthi','Poorna Market','PM Palem','Port Area','Rama Talkies Road','Rushikonda','Sagar Nagar','Sampath Vinayaka Temple Road','Sankaramatham','Satyam Junction','Seethammadhara','Seethammapeta','Sheela Nagar','Simhachalam','Sriharipuram','Steel Plant Township','Siripuram','Tagarapuvalasa','Thatichetlapalem','Town Kotha Road','Tenneti Park','Vadlapudi','Vepagunta','Vijayanagaram Road','Visalakshi Nagar','Waltair Uplands','Yendada','Zilla Parishad Junction','Balayya Sastri Layout','Bowdara Road','Butchirajupalem','Ukkunagaram','Malkapuram','Kurupam Market','Venkojipalem','Lalitha Nagar','Bakkannapalem','Pothinamallayyapalem','Paradesipalem','Mudasarlova','Appughar','Relli Veedhi','Suryabagh','Resapuvanipalem','Jaggarajupeta'];
function AreaPicker({label,req,placeholder,value,onChange,error,other,setOther}){
  const[open,setOpen]=useState(false);
  const q=(value||'').trim().toLowerCase();
  const list=[...new Set(VIZAG_AREAS)].sort();
  const hits=(q?list.filter(a=>a.toLowerCase().includes(q)).sort((a,b)=>(a.toLowerCase().startsWith(q)?0:1)-(b.toLowerCase().startsWith(q)?0:1)):list).slice(0,8);
  const exact=list.some(a=>a.toLowerCase()===q);
  return <div className="db-form-group" style={{position:'relative'}}>
    <label className="db-form-label">{label}{req&&<span> *</span>}</label>
    <input className={`db-input${error?' err':''}`} value={value} autoComplete="off" placeholder={other?'Type your area name':placeholder}
      onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),180)}
      onChange={e=>{onChange(e.target.value);setOpen(true);}}/>
    {open&&!other&&!exact&&<div className="db-ac">
      {hits.map(a=><button type="button" key={a} className="db-ac-item" onMouseDown={e=>e.preventDefault()} onClick={()=>{onChange(a);setOther(false);setOpen(false);}}><span className="material-symbols-outlined">location_on</span>{a}</button>)}
      <button type="button" className="db-ac-item other" onMouseDown={e=>e.preventDefault()} onClick={()=>{setOther(true);setOpen(false);}}><span className="material-symbols-outlined">edit_location</span>My area isn't listed</button>
    </div>}
    {other&&<div style={{fontSize:12,color:'var(--db-gray-500)',marginTop:4}}>Custom area. Staff will check it. <a href="#" onClick={e=>{e.preventDefault();setOther(false);onChange('');}} style={{color:'var(--db-primary)'}}>Pick from list instead</a></div>}
    {!other&&!exact&&(value||'').trim()&&!open&&<div style={{fontSize:12,color:'var(--db-gray-500)',marginTop:4}}>Choose an area from the list, or tap "My area isn't listed".</div>}
    {error&&<div className="db-form-err">{error}</div>}
  </div>;
}
function areaErr(v,other){const s=(v||'').trim();if(!s)return 'Required';if(VIZAG_AREAS.some(a=>a.toLowerCase()===s.toLowerCase()))return '';if(!other)return 'Pick from the list or tap "My area isn\'t listed"';if(!/^[A-Za-z][A-Za-z0-9 .,'()\/-]{2,39}$/.test(s)||/^(.)\1+$/.test(s)||/(test|asdf|xxx|none|na|n\/a)$/i.test(s))return 'Enter a real area name';return '';}

/* ── Donor Registration Form ── */
function ThankYou({done,onClose,onPoster,goAvail}){
  useEffect(()=>{if(!done)return;const k=e=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);},[done]);
  if(!done)return null;
  const K=done.kind;
  const C={
    donor:{icon:'favorite',h:'Thank you, '+done.name+'!',sub:'You just became a lifesaver.',lead:'One donation can save up to 3 lives. By joining Vizag\u2019s donor network, you may be the reason a family gets good news someday.',steps:['Our team verifies your details','You appear on the donor list once approved','We may call you when a patient needs '+(done.bg?done.bg+' blood':'your blood group')]},
    request:{icon:'volunteer_activism',h:'We\u2019re on it, '+done.name+'.',sub:'Your request is with our team.',lead:'We know this is a stressful time. Our volunteers will review your request and reach out to matching donors as fast as they can.',steps:['Our team verifies and publishes your request','Matching donors are contacted','Keep your phone nearby - we may call you']},
    camp:{icon:'event_available',h:'Thank you, '+done.name+'!',sub:'You are helping Vizag give blood.',lead:'Every camp brings in units that save lives. Thank you for taking the lead and bringing your people together.',steps:['Our team reviews your request','We call you to fix the date, venue and logistics','Your camp is listed on Digi Blood once approved']}
  }[K];
  const pieces=Array.from({length:26},(_,i)=>({l:(i*37)%100,d:(i%7)*0.18,c:['#E63946','#FFC107','#2E9E5B','#1D6FB8','#F78FB3'][i%5],r:(i*53)%360}));
  return <div className="db-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="db-modal db-thanks" role="dialog" aria-label="Thank you">
      <div className="db-confetti" aria-hidden="true">{pieces.map((p,i)=><i key={i} style={{left:p.l+'%',background:p.c,animationDelay:p.d+'s',transform:'rotate('+p.r+'deg)'}}/>)}</div>
      <div className="db-thanks-body">
        <div className="db-thanks-badge"><span className="material-symbols-outlined">{C.icon}</span></div>
        <div className="db-thanks-h">{C.h}</div>
        <div className="db-thanks-sub">{C.sub}</div>
        <p className="db-thanks-lead">{C.lead}</p>
        <div className="db-thanks-next"><b>What happens next</b><ol>{C.steps.map((x,i)=><li key={i}>{x}</li>)}</ol></div>
        <div className="db-form-actions" style={{flexDirection:'column'}}>
          {K==='request'&&<button type="button" className="db-btn db-btn-primary" onClick={()=>onPoster(done.poster)}><span className="material-symbols-outlined">campaign</span>Create Poster to Share</button>}
          {K==='request'&&<button type="button" className="db-btn db-btn-outline" onClick={goAvail}><span className="material-symbols-outlined">water_drop</span>Check Blood Bank Stock</button>}
          {K==='donor'&&<a className="db-btn db-btn-outline" style={{justifyContent:'center'}} target="_blank" rel="noopener" href={'https://wa.me/?text='+encodeURIComponent('I just registered as a blood donor with Vizag Volunteers - Digi Blood. You can too, it takes a minute: https://rakeshpola24-bit.github.io/digi-blood/#register')}><span className="material-symbols-outlined">share</span>Inspire a Friend to Donate</a>}
          <button type="button" className={`db-btn ${K==='request'?'db-btn-outline':'db-btn-primary'}`} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  </div>;
}
const SEEN_KEY='db_seen';
const np=s=>{let d=String(s||'').replace(/\D/g,'');if(d.length===12&&d.startsWith('91'))d=d.slice(2);if(d.length===11&&d[0]==='0')d=d.slice(1);return d;};
async function sendRecord(kind,data,key){
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return{ok:false,msg:'You seem to be offline. Please check your internet and try again.'};
  let seen={};try{seen=JSON.parse(localStorage.getItem(SEEN_KEY)||'{}');}catch(e){}
  const k=kind+':'+key;if(seen[k]&&Date.now()-seen[k]<86400000)return{ok:false,msg:kind==='donors'?'This number is already registered. Thank you - our team is reviewing it.':'You already sent this. Our team has it and will get in touch.'};
  try{if(localStorage.getItem('db_dry')!=='1')await Promise.race([submitRecord(kind,data),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),12000))]);}
  catch(e){return{ok:false,msg:'Could not send right now. Please try again in a moment.'};}
  seen[k]=Date.now();try{localStorage.setItem(SEEN_KEY,JSON.stringify(seen));}catch(e){}
  return{ok:true};
}
const dbDone=d=>window.dispatchEvent(new CustomEvent('db-done',{detail:d}));
const dbToast=(msg,type)=>window.dispatchEvent(new CustomEvent('db-toast',{detail:{msg,type}}));
function DonorForm({open,onClose}){
  const INIT={name:'',phone:'',bg:'',area:'',age:'',lastDon:'first',note:''};
  const[f,setF]=useState(INIT);
  const[errs,setErrs]=useState({});const[busy,setBusy]=useState(false);const[aOther,setAOther]=useState(false);
  function ch(k){return e=>setF(p=>({...p,[k]:e.target.value}));}
  function close(){setAOther(false);setF(INIT);setErrs({});onClose();}
  function validate(){
    const e={};
    if(!f.name.trim())e.name='Required';
    if(!/^\d{10}$/.test(f.phone.replace(/\D/g,'')))e.phone='Enter valid 10-digit number';
    if(!f.bg)e.bg='Select blood group';
    {const m=areaErr(f.area,aOther);if(m)e.area=m;}
    const age=parseInt(f.age);if(!f.age||isNaN(age)||age<18||age>65)e.age='Must be 18–65';
    return e;
  }
  async function submit(ev){
    ev.preventDefault();const e=validate();setErrs(e);if(Object.keys(e).length){setTimeout(()=>document.querySelector('.db-input.err')?.scrollIntoView({block:'center',behavior:'smooth'}),60);return;}
    const lastMap={first:'First time donor',gt6:'More than 6 months ago',lt6:'3–6 months ago',lt3:'Less than 3 months ago'};
    const msg=`Donor Registration — Vizag Volunteers Digi Blood\n\nName: ${f.name}\nPhone: ${f.phone}\nBlood Group: ${f.bg}\nAge: ${f.age}\nArea: ${f.area}\nLast Donation: ${lastMap[f.lastDon]}${f.note?'\nNotes: '+f.note:''}\n\nPlease add me to the Digi Blood donor network.`;
    const g=guard(ev);if(g==='consent')return;
    if(g==='rate'){dbToast('Too many submissions from this device. Please try again after an hour.','err');return;}
    if(g==='ok'){setBusy(true);const r=await sendRecord('donors',{name:f.name.trim(),phone:f.phone.replace(/\D/g,''),bg:f.bg,age:parseInt(f.age),area:f.area.trim(),lastDonation:f.lastDon,note:(f.note||'').slice(0,300)},f.phone.replace(/\D/g,''));setBusy(false);if(!r.ok){dbToast(r.msg,'err');return;}}
    if(location.hash==='#register')history.replaceState(null,'','#donors');dbDone({kind:'donor',name:f.name.trim().split(/\s+/)[0],bg:f.bg});
    close();
  }
  function Inp({k,label,req,...rest}){return <div className="db-form-group"><label className="db-form-label">{label}{req&&<span> *</span>}</label><input className={`db-input${errs[k]?' err':''}`} value={f[k]} onChange={ch(k)} {...rest}/>{errs[k]&&<div className="db-form-err">{errs[k]}</div>}</div>;}
  const IR=useRef();IR.current=Inp;const InpS=useMemo(()=>(pp)=>IR.current(pp),[]);
  return <Modal open={open} onClose={close} title="Register as Donor" sub="Join Vizag's voluntary blood donor network">
    <form onSubmit={submit} noValidate>
      <div className="db-form-row"><InpS k="name" label="Full Name" req placeholder="Your name"/><InpS k="phone" label="Phone" req placeholder="10-digit mobile" type="tel"/></div>
      <div className="db-form-row">
        <div className="db-form-group"><label className="db-form-label">Blood Group <span>*</span></label><select className={`db-input${errs.bg?' err':''}`} value={f.bg} onChange={ch('bg')}><option value="">Select…</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select>{errs.bg&&<div className="db-form-err">{errs.bg}</div>}</div>
        <InpS k="age" label="Age" req placeholder="18–65" type="number" min="18" max="65"/>
      </div>
      <AreaPicker label="Area / Locality in Vizag" req placeholder="Start typing, e.g. MVP Colony" value={f.area} onChange={v=>setF(p=>({...p,area:v}))} error={errs.area} other={aOther} setOther={setAOther}/>
      <div className="db-form-group"><label className="db-form-label">Last Blood Donation</label><select className="db-input" value={f.lastDon} onChange={ch('lastDon')}><option value="first">First time donor</option><option value="gt6">More than 6 months ago</option><option value="lt6">3–6 months ago</option><option value="lt3">Less than 3 months ago</option></select></div>
      <div className="db-form-group"><label className="db-form-label">Notes <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label><textarea className="db-input" rows={2} value={f.note} onChange={ch('note')} placeholder="Any medical conditions or preferences…" style={{resize:'vertical'}}/></div>
      <Consent/><div className="db-form-actions"><button type="submit" disabled={busy} className="db-btn db-btn-primary" style={{flex:1}}><span className="material-symbols-outlined">check_circle</span>{busy?'Sending…':'Submit Registration'}</button><button type="button" className="db-btn db-btn-outline" onClick={close}>Cancel</button></div>
      <div className="db-form-note"><span className="material-symbols-outlined">info</span>Submitting opens WhatsApp with a pre-filled message to our Digi Blood coordinator. Your details are reviewed by our team before being shown publicly.</div>
    </form>
  </Modal>;
}

/* ── Blood Request Form ── */
function RequestForm({open,onClose,onSuccess}){
  const INIT={name:'',phone:'',bg:'',units:'1',hospital:'',area:'',urgency:'urgent',note:''};
  const[f,setF]=useState(INIT);
  const[errs,setErrs]=useState({});const[busy,setBusy]=useState(false);const[aOther,setAOther]=useState(false);
  function ch(k){return e=>setF(p=>({...p,[k]:e.target.value}));}
  function close(){setAOther(false);setF(INIT);setErrs({});onClose();}
  function validate(){
    const e={};
    if(!f.name.trim())e.name='Required';
    if(!/^\d{10}$/.test(f.phone.replace(/\D/g,'')))e.phone='Enter valid 10-digit number';
    if(!f.bg)e.bg='Select blood group';
    if(!f.hospital.trim())e.hospital='Required';
    {const m=areaErr(f.area,aOther);if(m)e.area=m;}
    return e;
  }
  async function submit(ev){
    ev.preventDefault();const e=validate();setErrs(e);if(Object.keys(e).length){setTimeout(()=>document.querySelector('.db-input.err')?.scrollIntoView({block:'center',behavior:'smooth'}),60);return;}
    const urgLabel={critical:'CRITICAL — Immediate',urgent:'Urgent — Few hours',routine:'Routine — Scheduled'}[f.urgency];
    const msg=`Blood Request — Vizag Volunteers Digi Blood\n\nPatient: ${f.name}\nContact: ${f.phone}\nBlood Group: ${f.bg}\nUnits: ${f.units}\nHospital: ${f.hospital}\nArea: ${f.area}\nUrgency: ${urgLabel}${f.note?'\nNotes: '+f.note:''}\n\nKindly help connect us with a matching donor. Thank you.`;
    const g=guard(ev);if(g==='consent')return;
    if(g==='rate'){dbToast('Too many submissions from this device. Please try again after an hour.','err');return;}
    if(g==='ok'){setBusy(true);const r=await sendRecord('requests',{name:f.name.trim(),phone:f.phone.replace(/\D/g,''),bg:f.bg,units:parseInt(f.units),hospital:f.hospital.trim(),area:f.area.trim(),urgency:f.urgency,note:(f.note||'').slice(0,300)},f.phone.replace(/\D/g,'')+f.hospital.trim().toLowerCase());setBusy(false);if(!r.ok){dbToast(r.msg,'err');return;}}
    
    close();
    dbDone({kind:'request',name:f.name.trim().split(/\s+/)[0],poster:{patient_name:f.name,request_no:'VVDBR'+new Date().toISOString().slice(2,10).replace(/-/g,'')+String(Math.floor(1000+Math.random()*9000)),name:f.name,bg:f.bg,units:parseInt(f.units),hospital:f.hospital,area:f.area,phone:f.phone,urgency:(f.urgency||'').charAt(0).toUpperCase()+(f.urgency||'').slice(1),contact:f.phone}});
  }
  function Inp({k,label,req,...rest}){return <div className="db-form-group"><label className="db-form-label">{label}{req&&<span> *</span>}</label><input className={`db-input${errs[k]?' err':''}`} value={f[k]} onChange={ch(k)} {...rest}/>{errs[k]&&<div className="db-form-err">{errs[k]}</div>}</div>;}
  const IR=useRef();IR.current=Inp;const InpS=useMemo(()=>(pp)=>IR.current(pp),[]);
  return <Modal open={open} onClose={close} title="Request Blood" sub="We'll connect you with a matching donor as soon as possible">
    <form onSubmit={submit} noValidate>
      <div className="db-form-row"><InpS k="name" label="Patient Name" req placeholder="Full name"/><InpS k="phone" label="Contact Number" req placeholder="10-digit mobile" type="tel"/></div>
      <div className="db-form-row">
        <div className="db-form-group"><label className="db-form-label">Blood Group <span>*</span></label><select className={`db-input${errs.bg?' err':''}`} value={f.bg} onChange={ch('bg')}><option value="">Select…</option><option value="Any">Any Blood Group</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select>{errs.bg&&<div className="db-form-err">{errs.bg}</div>}</div>
        <div className="db-form-group"><label className="db-form-label">Units Needed <span>*</span></label><select className="db-input" value={f.units} onChange={ch('units')}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></div>
      </div>
      <InpS k="hospital" label="Hospital Name" req placeholder="e.g. KGH, Apollo, Care Hospital…"/>
      <AreaPicker label="Hospital Area" req placeholder="Start typing the area" value={f.area} onChange={v=>setF(p=>({...p,area:v}))} error={errs.area} other={aOther} setOther={setAOther}/>
      <div className="db-form-group"><label className="db-form-label">Urgency <span>*</span></label><select className="db-input" value={f.urgency} onChange={ch('urgency')}><option value="critical">Critical — Needed immediately</option><option value="urgent">Urgent — Within a few hours</option><option value="routine">Routine — Scheduled procedure</option></select></div>
      <div className="db-form-group"><label className="db-form-label">Notes <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label><textarea className="db-input" rows={2} value={f.note} onChange={ch('note')} placeholder="Reason, special requirements…" style={{resize:'vertical'}}/></div>
      <Consent/><div className="db-form-actions"><button type="submit" disabled={busy} className="db-btn db-btn-primary" style={{flex:1}}><span className="material-symbols-outlined">check_circle</span>{busy?'Sending…':'Submit Request'}</button><button type="button" className="db-btn db-btn-outline" onClick={close}>Cancel</button></div>
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
  const init={name:'',phone:'',org:'',date:'',venue:'',area:'',count:'',notes:''};
  const[f,setF]=useState(init);
  const[errs,setErrs]=useState({});const[busy,setBusy]=useState(false);const[aOther,setAOther]=useState(false);
  function ch(k){return e=>setF(p=>({...p,[k]:e.target.value}));}
  function close(){setAOther(false);setF(init);setErrs({});onClose();}
  function validate(){const e={};if(!f.name.trim())e.name='Required';if(!f.phone.trim()||!/^\d{10}$/.test(f.phone.replace(/\s/g,'')))e.phone='Valid 10-digit number required';if(!f.venue.trim())e.venue='Required';if(!f.date)e.date='Pick a date';else if(f.date<new Date().toISOString().slice(0,10))e.date='Date must be today or later';{const m=areaErr(f.area,aOther);if(m)e.area=m;}return e;}
  async function submit(ev){
    ev.preventDefault();const e=validate();setErrs(e);if(Object.keys(e).length){setTimeout(()=>document.querySelector('.db-input.err')?.scrollIntoView({block:'center',behavior:'smooth'}),60);return;}
    const msg=`Camp Organiser Request — Vizag Volunteers Digi Blood\n\nOrganiser: ${f.name}\nPhone: ${f.phone}${f.org?'\nOrganisation: '+f.org:''}${f.date?'\nPreferred Date: '+f.date:''}\nVenue: ${f.venue}\nArea: ${f.area}${f.count?'\nExpected Participants: '+f.count:''}${f.notes?'\nNotes: '+f.notes:''}\n\nPlease help us organise a blood donation camp. Thank you.`;
    const g=guard(ev);if(g==='consent')return;
    if(g==='rate'){dbToast('Too many submissions from this device. Please try again after an hour.','err');return;}
    if(g==='ok'){setBusy(true);const r=await sendRecord('camps',{organizer:f.name.trim(),contact:f.name.trim()+' - '+f.phone.replace(/\D/g,''),org:f.org.trim(),date:f.date||'',venue:f.venue.trim()+', '+f.area.trim(),slots:parseInt(f.count)||0,note:(f.notes||'').slice(0,300),title:(f.org.trim()||f.name.trim())+' blood camp'},f.phone.replace(/\D/g,'')+f.venue.trim().toLowerCase());setBusy(false);if(!r.ok){dbToast(r.msg,'err');return;}}
    dbDone({kind:'camp',name:f.name.trim().split(/\s+/)[0]});
    close();
  }
  function Inp({k,label,req,...rest}){return <div className="db-form-group"><label className="db-form-label">{label}{req&&<span> *</span>}</label><input className={`db-input${errs[k]?' err':''}`} value={f[k]} onChange={ch(k)} {...rest}/>{errs[k]&&<div className="db-form-err">{errs[k]}</div>}</div>;}
  const IR=useRef();IR.current=Inp;const InpS=useMemo(()=>(pp)=>IR.current(pp),[]);
  return <Modal open={open} onClose={close} title="Organise a Blood Donation Camp" sub="Fill in your details and we'll get back to you to plan the camp">
    <form onSubmit={submit} noValidate>
      <div className="db-form-row"><InpS k="name" label="Your Name" req placeholder="Full name"/><InpS k="phone" label="Phone Number" req placeholder="10-digit mobile" type="tel"/></div>
      <InpS k="org" label="Organisation / Company" placeholder="Company, college, RWA… (optional)"/>
      <div className="db-form-row"><InpS k="date" label="Preferred Date" req placeholder="" type="date" min={new Date().toISOString().slice(0,10)}/><InpS k="count" label="Expected Participants" placeholder="e.g. 50" type="number" min="1"/></div>
      <InpS k="venue" label="Proposed Venue" req placeholder="e.g. JNTU Auditorium, college, office…"/>
      <AreaPicker label="Area / Locality" req placeholder="Start typing the area" value={f.area} onChange={v=>setF(p=>({...p,area:v}))} error={errs.area} other={aOther} setOther={setAOther}/>
      <div className="db-form-group"><label className="db-form-label">Notes <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label><textarea className="db-input" rows={2} value={f.notes} onChange={ch('notes')} placeholder="Any special requirements or questions…" style={{resize:'vertical'}}/></div>
      <Consent/><div className="db-form-actions"><button type="submit" disabled={busy} className="db-btn db-btn-primary" style={{flex:1}}><span className="material-symbols-outlined">check_circle</span>{busy?'Sending…':'Submit Camp Request'}</button><button type="button" className="db-btn db-btn-outline" onClick={close}>Cancel</button></div>
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
          {[{to:DC.requests.filter(r=>r.status==='open').length,suffix:'',lbl:'Open Requests'},{to:DC.donors.length,suffix:'',lbl:'Donors'},{to:DC.camps.filter(c=>c.status==='upcoming').length,suffix:'',lbl:'Upcoming Camps'},{to:BC.banks.length,suffix:'',lbl:'Blood Banks'}].filter(c=>c.to>0).map((c,i)=><div key={i} className="db-slide-counters-item"><div className="cv"><CountUp to={c.to} active={slide===0} suffix={c.suffix}/></div><div className="cl">{c.lbl}</div></div>)}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="db-btn db-btn-primary db-btn-lg" onClick={openDonor}><span className="material-symbols-outlined">favorite</span>Register as Donor</button>
          <button className="db-btn db-btn-outline-light db-btn-lg" onClick={()=>setPage('req')}><span className="material-symbols-outlined">assignment</span>View Requests</button>
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
          {[{to:DC.camps.filter(c=>c.status==='upcoming').length,suffix:'',lbl:'Upcoming Camps'},{to:DC.camps.filter(c=>c.status==='past').length,suffix:'',lbl:'Past Camps'},{to:DC.camps.reduce((a,c)=>a+c.slots,0),suffix:'',lbl:'Total Slots'},{to:DC.camps.reduce((a,c)=>a+c.registered,0),suffix:'',lbl:'Registered'}].filter(c=>c.to>0).map((c,i)=><div key={i} className="db-slide-counters-item"><div className="cv"><CountUp to={c.to} active={slide===1} suffix={c.suffix}/></div><div className="cl">{c.lbl}</div></div>)}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="db-btn db-btn-yellow db-btn-lg" onClick={()=>setCampOpen(true)}><span className="material-symbols-outlined">volunteer_activism</span>Organise a Camp</button>
          <button className="db-btn db-btn-outline-light db-btn-lg" onClick={()=>setPage('camps')}><span className="material-symbols-outlined">event_available</span>View Camps</button>
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
          {[{to:1,suffix:' unit',lbl:'You Donate'},{to:3,suffix:' lives',lbl:'You Save'},{to:450,suffix:'ml',lbl:'Per Donation'},{to:56,suffix:' days',lbl:'Waiting Period'}].filter(c=>c.to>0).map((c,i)=><div key={i} className="db-slide-counters-item"><div className="cv"><CountUp to={c.to} active={slide===2} suffix={c.suffix}/></div><div className="cl">{c.lbl}</div></div>)}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="db-btn db-btn-primary db-btn-lg" onClick={openDonor}><span className="material-symbols-outlined">favorite</span>Register as Donor</button>
          <button className="db-btn db-btn-outline-light db-btn-lg" onClick={()=>setPage('about')}><span className="material-symbols-outlined">info</span>About Digi Blood</button>
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
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:20}}><div><div className="db-sec-title">Urgent Requests</div><div className="db-sec-sub">Help someone today &mdash; your blood can be the difference</div></div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('req')}>View all requests &rarr;</button></div>
      {REQUESTS.filter(r=>r.status==='open').length===0?<div className="db-empty"><span className="material-symbols-outlined">task_alt</span><b>No urgent requests right now</b><span>Need blood for a patient? Tap Request Blood at the top.</span></div>:<div className="db-grid-3">{REQUESTS.filter(r=>r.status==='open').slice(0,3).map(r=><ReqCard key={r.id} req={r}/>)}</div>}
    </div></div>
    <div className="db-sec"><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:20}}><div><div className="db-sec-title">Blood Availability</div><div className="db-sec-sub">Aggregated stock across Vizag blood banks &middot; Live from eRaktKosh</div></div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('avail')}>View availability &rarr;</button></div>
      <div className="db-grid-4">{BLOOD_GROUPS.map(bg=>{const tot=groupTotalLive(banks,bg);return <div key={bg} className="db-card" style={{cursor:'pointer'}} onClick={()=>setPage('avail')}><div className="db-card-body" style={{textAlign:'center'}}><div className="db-bg-chip lg" style={{margin:'0 auto 12px'}}>{bg}</div><div className={'db-tile-status '+availCls(tot)}>{loading?'Loading…':tot===0?'Not available':tot<=5?'Limited':'Available'}</div><div className="db-tile-sub">{loading?'':tot===0?'Call banks directly':banks.filter(b=>b.stock[bg]>0).length+' of '+banks.length+' banks · '+tot+' units'}</div></div></div>;})}</div>
    </div></div>
    <div className="db-callout-yellow"><h2>Blood Must Circulate</h2><p>Voluntary blood donation is the safest source. Join Vizag's network of heroes &mdash; every donation can save up to 3 lives.</p><div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}><button className="db-btn db-btn-primary db-btn-lg" onClick={openDonor}><span className="material-symbols-outlined">volunteer_activism</span>Register as Donor</button><button className="db-btn db-btn-dark db-btn-lg" onClick={()=>setPage('about')}>About Digi Blood</button></div></div>
    <div className="db-sec" style={{background:'#fff'}}><div className="db-cnt"><div className="db-grid-2">
      <div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><div className="db-sec-title" style={{fontSize:22,marginBottom:0}}>Top Donors</div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('donors')}>View all donors &rarr;</button></div>
        {donors.length===0?<div className="db-empty"><span className="material-symbols-outlined">volunteer_activism</span><b>Be the first donor</b><span>Register once and help Vizag in an emergency.</span><button type="button" className="db-btn db-btn-primary db-btn-sm" onClick={openDonor}>Register as Donor</button></div>:<div className="db-card"><div className="db-card-body">{donors.slice(0,5).map((d,i)=><div key={d.id} className="db-donor-row"><div className={`db-rank-num ${i<3?'top':''}`}>{['🥇','🥈','🥉'][i]||i+1}</div><div className="db-donor-av">{d.initials}</div><div className="db-donor-info"><div className="dn">{d.name}</div><div className="ds">{d.area} &middot; Last: {d.last}</div></div><div className="db-bg-chip sm">{d.bg}</div><div className="db-donor-count">{d.donations>0?d.donations:<span style={{fontSize:11,fontWeight:700,color:'var(--db-secondary)'}}>NEW</span>}</div></div>)}</div></div>}
      </div>
      <div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><div className="db-sec-title" style={{fontSize:22,marginBottom:0}}>Upcoming Camps</div><button className="db-btn db-btn-outline db-btn-sm" onClick={()=>setPage('camps')}>View all camps &rarr;</button></div>
        {CAMPS.filter(c=>c.status==='upcoming').length===0?<div className="db-empty"><span className="material-symbols-outlined">event</span><b>No camps scheduled yet</b><span>Want to host one at your office or college?</span><button type="button" className="db-btn db-btn-primary db-btn-sm" onClick={()=>setPage('camps')}>View all camps &rarr;</button></div>:<div style={{display:'flex',flexDirection:'column',gap:12}}>{CAMPS.filter(c=>c.status==='upcoming').slice(0,3).map(c=><div key={c.id} className="db-card"><div className="db-card-body" style={{display:'flex',gap:14,alignItems:'flex-start'}}><div className="db-date-badge"><span className="day">{c.day}</span><span className="mon">{c.mon}</span></div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{c.title}</div><div style={{fontSize:13,color:'var(--db-secondary)',fontWeight:600}}>{c.organizer}</div><div style={{fontSize:13,color:'var(--db-gray-500)',marginTop:4}}>{c.venue}</div><div className="db-slot-bar mt-8"><div className="db-slot-fill" style={{width:Math.round(c.registered/c.slots*100)+'%'}}></div></div><div style={{fontSize:12,color:'var(--db-gray-500)',marginTop:3}}>{c.registered}/{c.slots} slots filled</div></div><button className="db-btn db-btn-primary db-btn-sm" onClick={openDonor}>Register as Donor</button></div></div>)}</div>}
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
    <Forecast/>
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
      <strong>Could not load live data</strong> &mdash; {err}.  Please refresh in a minute.
    </div>}
    {!loading&&filtered.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'var(--db-gray-500)'}}>No blood banks found for selected filters.</div>}
    {!loading&&filtered.length>0&&<div className="db-bank-cards">{filtered.map(bank=>{
      const digits=(bank.phone||'').replace(/\D/g,'').slice(-10);const mobile=/^[6-9]\d{9}$/.test(digits);
      const shown=groups.filter(g=>fG!=='All'||bank.stock[g]>0||BLOOD_GROUPS.includes(g));
      const total=BLOOD_GROUPS.reduce((a,g)=>a+bank.stock[g],0);
      return <div key={bank.id} className="db-bank-card">
        <div className="db-bank-head"><div style={{minWidth:0}}><div className="db-bank-name">{bank.name}</div>{bank.area&&<div className="db-bank-area"><span className="material-symbols-outlined">location_on</span>{bank.area}</div>}</div>
          <span className="db-bank-type" style={{background:typeBg(bank.type).bg,color:typeBg(bank.type).color}}>{bank.type}</span></div>
        <div className="db-bank-groups">{shown.map(g=><div key={g} className={'db-bank-g '+cellCls(bank.stock[g])}><b>{g}</b><span>{bank.stock[g]}</span></div>)}</div>
        <div className="db-bank-foot"><span>{total>0?total+' units':'No stock listed'}{bank.updated?' · updated '+bank.updated.split(' ')[1]?.slice(0,5):''}</span></div>
        <div className="db-bank-actions">
          {digits&&<a className="db-btn db-btn-outline db-btn-sm" href={'tel:+91'+digits}><span className="material-symbols-outlined">call</span>Call</a>}
          {mobile&&<a className="db-btn db-btn-wa db-btn-sm" href={'https://wa.me/91'+digits} target="_blank" rel="noopener"><span className="material-symbols-outlined">chat</span>WhatsApp</a>}
          <a className="db-btn db-btn-outline db-btn-sm" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(bank.name+' Visakhapatnam')} target="_blank" rel="noopener"><span className="material-symbols-outlined">directions</span>Map</a>
        </div></div>;})}</div>}
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
        <button className="db-btn db-btn-primary" onClick={openReq}><span className="material-symbols-outlined">add_circle</span>Request Blood</button>
      </div>
    </div></div>
    <div className="db-pw"><div className="db-cnt">
    <div className="db-grid-4 mb-24">{[{label:'Total',val:stats.total,icon:'list',c:'b'},{label:'Open',val:stats.open,icon:'schedule',c:'y'},{label:'Critical',val:stats.crit,icon:'priority_high',c:'r'},{label:'Fulfilled',val:stats.done,icon:'check_circle',c:'g'}].filter(s=>s.val!==0).map((s,i)=><div key={i} className={`db-kpi-card ${s.c}`}><div className={`db-kpi-card__icon ${s.c}`}><span className="material-symbols-outlined">{s.icon}</span></div><div className="db-kpi-card__val">{s.val}</div><div className="db-kpi-card__label">{s.label}</div></div>)}</div>
    <div className="db-filter-bar"><input type="text" placeholder="Search name, hospital or area..." value={search} onChange={e=>setSearch(e.target.value)} style={{minWidth:220}}/><label>Group</label><select value={fBg} onChange={e=>setFBg(e.target.value)}><option>All</option>{BLOOD_GROUPS.map(bg=><option key={bg}>{bg}</option>)}</select><label>Urgency</label><select value={fUrg} onChange={e=>setFUrg(e.target.value)}><option>All</option><option value="critical">Critical</option><option value="urgent">Urgent</option><option value="routine">Routine</option></select><label>Status</label><select value={fSt} onChange={e=>setFSt(e.target.value)}><option value="All">All</option><option value="open">Open</option><option value="matched">Matched</option><option value="fulfilled">Fulfilled</option></select></div>
    {filtered.length===0?<div className="db-empty" style={{margin:'8px 0'}}><span className="material-symbols-outlined">search_off</span>{REQUESTS.length===0?'No blood requests yet':'No requests match your filters.'}<div style={{marginTop:14}}><button type="button" className="db-btn db-btn-primary db-btn-sm" onClick={openReq}>Request Blood</button></div></div>:<div className="db-grid-3">{filtered.map(r=><ReqCard key={r.id} req={r}/>)}</div>}
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
    <div className="db-grid-4 mb-24">{[{label:'Registered Donors',val:donors.length,icon:'people',c:'b'},{label:'Total Donations',val:donors.reduce((a,d)=>a+(d.donations||0),0),icon:'water_drop',c:'r'},{label:'Requests Fulfilled',val:REQ_ALL.filter(r=>r.status==='fulfilled').length,icon:'favorite',c:'g'}].filter(s=>s.val!==0).map((s,i)=><div key={i} className={`db-kpi-card ${s.c}`}><div className={`db-kpi-card__icon ${s.c}`}><span className="material-symbols-outlined">{s.icon}</span></div><div className="db-kpi-card__val">{s.val}</div><div className="db-kpi-card__label">{s.label}</div></div>)}</div>
    <div className="db-grid-2">
      <div><div className="db-sec-title mb-16" style={{fontSize:22}}>Leaderboard</div>{donors.length===0?<div className="db-empty"><span className="material-symbols-outlined">emoji_events</span><b>Leaderboard is waiting for its first hero</b><span>Register as a donor and earn your first badge.</span><button type="button" className="db-btn db-btn-primary db-btn-sm" onClick={openDonor}>Register as Donor</button></div>:<div className="db-card"><div className="db-card-body">{donors.map((d,i)=><div key={d.id} className="db-donor-row"><div className={`db-rank-num ${i<3?'top':''}`}>{['🥇','🥈','🥉'][i]||i+1}</div><div className="db-donor-av">{d.initials}</div><div className="db-donor-info"><div className="dn">{d.name}</div><div className="ds">{d.area} &middot; Last: {d.last}</div></div><div className="db-bg-chip sm">{d.bg}</div><div style={{textAlign:'right'}}><div className="db-donor-count">{d.donations>0?d.donations:<span style={{fontSize:11,fontWeight:700,color:'var(--db-secondary)'}}>NEW</span>}</div><div style={{fontSize:11,color:'var(--db-gray-500)'}}>donations</div></div></div>)}</div></div>}</div>
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
  const[campOpen,setCampOpen]=useState(false);
  const{camps:CAMPS}=useContext(DataCtx);
  const[tab,setTab]=useState('upcoming');const shown=CAMPS.filter(c=>c.status===tab);
  return <React.Fragment>
    <div style={{background:'#fff',borderBottom:'1px solid var(--db-gray-200)',padding:'28px 0'}}><div className="db-cnt">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><div className="db-sec-title">Blood Donation Camps</div><div className="db-sec-sub">Upcoming and past donation drives across Visakhapatnam</div></div>
        <button className="db-btn db-btn-primary" onClick={()=>setCampOpen(true)}><span className="material-symbols-outlined">add_circle</span>Organise a Camp</button>
      </div>
    </div></div>
    <div className="db-pw"><div className="db-cnt">
    <div className="db-grid-4 mb-24">{[{label:'Upcoming',val:CAMPS.filter(c=>c.status==='upcoming').length,icon:'event_upcoming',c:'y'},{label:'Past Camps',val:CAMPS.filter(c=>c.status==='past').length,icon:'event_available',c:'g'},{label:'Total Slots',val:CAMPS.reduce((a,c)=>a+c.slots,0),icon:'chair',c:'b'},{label:'Registered',val:CAMPS.reduce((a,c)=>a+c.registered,0),icon:'how_to_reg',c:'r'}].filter(s=>s.val!==0).map((s,i)=><div key={i} className={`db-kpi-card ${s.c}`}><div className={`db-kpi-card__icon ${s.c}`}><span className="material-symbols-outlined">{s.icon}</span></div><div className="db-kpi-card__val">{s.val}</div><div className="db-kpi-card__label">{s.label}</div></div>)}</div>
    <div style={{display:'flex',gap:4,padding:4,background:'var(--db-gray-200)',borderRadius:10,width:'fit-content',marginBottom:20}}>{['upcoming','past'].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'8px 20px',borderRadius:8,fontWeight:600,fontSize:13.5,cursor:'pointer',background:tab===t?'#fff':'transparent',color:tab===t?'var(--db-black)':'var(--db-gray-500)',border:0,boxShadow:tab===t?'0 1px 3px rgba(0,0,0,.08)':'none'}}>{t==='upcoming'?'Upcoming':'Past'}</button>)}</div>
    {shown.length===0?<div className="db-empty" style={{margin:'8px 0'}}><span className="material-symbols-outlined">event_busy</span>No {tab} camps yet.<div style={{marginTop:14}}><button type="button" className="db-btn db-btn-primary db-btn-sm" onClick={()=>setCampOpen(true)}>Organise a Camp</button></div></div>:<div className="db-grid-3">{shown.map(c=><div key={c.id} className="db-camp-card"><div className={`db-camp-stripe ${c.status}`}></div><div className="db-camp-body"><div style={{display:'flex',gap:14,alignItems:'flex-start'}}><div className="db-date-badge"><span className="day">{c.day}</span><span className="mon">{c.mon}</span></div><div className="db-camp-info"><div className="ctitle">{c.title}</div><div className="corg">{c.organizer}</div><div className="caddr"><span className="material-symbols-outlined">location_on</span>{c.venue}</div></div></div>{c.status==='upcoming'&&<React.Fragment><div style={{fontSize:13,color:'var(--db-gray-500)',display:'flex',alignItems:'center',gap:6}}><span className="material-symbols-outlined" style={{fontSize:15,color:'var(--db-green)'}}>how_to_reg</span>{c.registered}/{c.slots} slots filled</div><div className="db-slot-bar"><div className="db-slot-fill" style={{width:Math.round(c.registered/c.slots*100)+'%'}}></div></div>{c.contact&&<div style={{fontSize:13,color:'var(--db-gray-500)',display:'flex',gap:6,alignItems:'center'}}><span className="material-symbols-outlined" style={{fontSize:14}}>contact_phone</span>{c.contact}</div>}<button className="db-btn db-btn-primary" style={{width:'100%'}} onClick={openDonor}><span className="material-symbols-outlined">how_to_reg</span>Register as Donor</button></React.Fragment>}{c.status==='past'&&<div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'var(--db-green-soft)',borderRadius:6,fontSize:13,color:'var(--db-green)',fontWeight:600}}><span className="material-symbols-outlined" style={{fontSize:16}}>check_circle</span>{c.registered} donors participated &mdash; Completed</div>}</div></div>)}</div>}
  </div></div>
  <CampForm open={campOpen} onClose={()=>setCampOpen(false)}/>
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
      <details className="db-acc" open={window.innerWidth>768}><summary>Project Brief</summary><div className="db-card"><div className="db-card-body">{[{icon:'calendar_today',label:'Project Launch',val:'20 April 2021'},{icon:'check_circle',label:'Status',val:'Active'},{icon:'location_on',label:'Service Area',val:'Visakhapatnam, Andhra Pradesh'},{icon:'person',label:'Project Leads',val:'Tanuja Bakke & Tanuja Seeranam'},{icon:'groups',label:'Team Leads',val:'Sudharshan Lotla, Monika Vechalapu, Kavya Sambangi'},{icon:'home',label:'Address',val:'Flat 401, Vinayagar Heights, Sampath Vinayaka Temple Road, Visakhapatnam - 530003'}].map((item,i,arr)=><div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'12px 0',borderBottom:i<arr.length-1?'1px solid var(--db-gray-200)':'none'}}><span className="material-symbols-outlined" style={{color:'var(--db-secondary)',flexShrink:0}}>{item.icon}</span><div><div style={{fontSize:11,fontWeight:700,color:'var(--db-gray-500)',letterSpacing:'.07em',textTransform:'uppercase'}}>{item.label}</div><div style={{fontSize:14,fontWeight:600,marginTop:2}}>{item.val}</div></div></div>)}</div></div></details>
      <details className="db-acc" open={window.innerWidth>768}><summary>Safety Protocols</summary><div className="db-card"><div className="db-card-body">{SAFETY.map((s,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 0',borderBottom:i<SAFETY.length-1?'1px solid var(--db-gray-200)':'none'}}><span className="material-symbols-outlined" style={{color:'var(--db-green)',fontSize:18,flexShrink:0,marginTop:2}}>verified</span><span style={{fontSize:14,color:'var(--db-gray-700)',lineHeight:1.6}}>{s}</span></div>)}</div></div></details>
    </div>
    <details className="db-acc" open={window.innerWidth>768}><summary>Donor Eligibility</summary><div style={{display:'flex',flexDirection:'column',gap:8}}>{ELIGIBILITY.map((e,i)=><div key={i} className={`db-elig-item ${e.ok?'ok':'no'}`}><span className="material-symbols-outlined">{e.ok?'check_circle':'cancel'}</span><div><div className="et">{e.title}</div><div className="es">{e.sub}</div></div></div>)}</div></details>
    <details className="db-acc" open={window.innerWidth>768}><summary>Frequently Asked Questions</summary><div className="db-card"><div className="db-card-body">{FAQS.map((f,i)=><FaqItem key={i} faq={f}/>)}</div></div></details>
    <div className="db-card" style={{background:'var(--db-black)',border:'none'}}><div className="db-card-body-lg" style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}><div style={{flex:1}}><div style={{fontFamily:'var(--db-font-head)',fontWeight:700,fontSize:22,color:'#fff',letterSpacing:'.04em',textTransform:'uppercase'}}>Get in Touch</div><div style={{color:'rgba(255,255,255,.6)',marginTop:8,fontSize:14}}>Flat 401, Vinayagar Heights, Sampath Vinayaka Temple Road, Visakhapatnam - 530003</div><a href="https://www.vizagvolunteers.org/projects/digi-blood" target="_blank" style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--db-primary)',fontWeight:600,fontSize:14,marginTop:12}}><span className="material-symbols-outlined" style={{fontSize:16}}>language</span>vizagvolunteers.org/projects/digi-blood</a></div><a href="https://www.vizagvolunteers.org/projects/digi-blood" target="_blank" className="db-btn db-btn-yellow db-btn-lg"><span className="material-symbols-outlined">open_in_new</span>Visit Official Page</a></div></div>
  </div></div>
  </React.Fragment>;
}
/* ── Donor request: find blood, then ask donors on WhatsApp ── */
function FindFlow({open,onClose,onPoster}){
  const{banks,loading}=useContext(BloodCtx);
  const INIT={bg:'',units:'1',area:'',name:'',age:'',gender:'',hospital:'',phone:'',urgency:'urgent'};
  const[f,setF]=useState(INIT);const[step,setStep]=useState(1);const[errs,setErrs]=useState({});const[aOther,setAOther]=useState(false);const[busy,setBusy]=useState(false);const[copied,setCopied]=useState(false);
  const donorsAll=useContext(DataCtx).donors;
  const[paste,setPaste]=useState('');const[imgName,setImgName]=useState('');const imgRef=useRef(null);const[reading,setReading]=useState(false);const[readMsg,setReadMsg]=useState('');const[mode,setMode]=useState('');const[captured,setCaptured]=useState('');
  const[wording,setWording]=useState(false);const[custom,setCustom]=useState('');
  function set(k,v){setF(p=>({...p,[k]:v}));}
  function close(){setStep(1);setF(INIT);setErrs({});setAOther(false);setCopied(false);setPaste('');setImgName('');setReadMsg('');setMode('');setCaptured('');setCustom('');onClose();}
  const areaWords=(f.area||'').toLowerCase().split(/[\s,()]+/).filter(w=>w.length>3);
  const list=banks.filter(b=>b.stock[f.bg]>0).map(b=>({...b,near:areaWords.some(w=>(b.area+' '+b.name).toLowerCase().includes(w))}))
    .sort((a,b)=>(b.near-a.near)||(b.stock[f.bg]-a.stock[f.bg])).slice(0,5);
  const units=parseInt(f.units)||1;
  const enough=list.some(b=>b.stock[f.bg]>=units);
  const compat=f.bg?CAN_RECEIVE_FROM[f.bg]:[];
  const donorCount=donorsAll.filter(d=>compat.includes(d.bg)&&d.last!=='Under 3 months ago').length;

  async function readIt(){
    const file=imgRef.current&&imgRef.current.files[0];
    if(!paste.trim()&&!file){setReadMsg('Paste the message or choose a photo first.');return;}
    setReading(true);setReadMsg('Reading... this can take up to 30 seconds.');
    try{
      const b64=file?await shrinkImage(file):null;
      const r=await parseRequest({text:paste.trim(),imageB64:b64});
      if(!r)throw new Error('empty');
      const up=(r.bg||'').toUpperCase().replace(/POSITIVE|PLUS|POS/g,'+').replace(/NEGATIVE|MINUS|NEG/g,'-').replace(/\s/g,'').replace(/VE$/,'');
      const ra=(r.area||'').toLowerCase().trim();const area=!ra?'':(VIZAG_AREAS.find(a=>a.toLowerCase()===ra)||VIZAG_AREAS.find(a=>ra.includes(a.toLowerCase()))||VIZAG_AREAS.find(a=>a.toLowerCase().startsWith(ra))||'');
      const ph=String(r.phone||'').replace(/\D/g,'').slice(-10);
      const g=/^m/i.test(r.gender||'')?'Male':/^f/i.test(r.gender||'')?'Female':/\S/.test(r.gender||'')?'Other':'';
      setF(p=>({...p,bg:BLOOD_GROUPS.includes(up)?up:p.bg,units:String(Math.min(10,Math.max(1,parseInt(r.units)||parseInt(p.units)||1))),area:area||p.area,name:r.patientName||p.name,age:r.age?String(r.age):p.age,gender:g||p.gender,hospital:r.hospital||p.hospital,phone:ph.length===10?ph:p.phone,urgency:['critical','urgent','routine'].includes(r.urgency)?r.urgency:p.urgency}));
      setCaptured((file?'photo':'pasted message'));setReadMsg('');setMode('');
    }catch(e){setReadMsg(friendly(e));}
    setReading(false);
  }
  function next1(){const e={};if(!f.bg)e.bg='Choose the blood group';{const m=areaErr(f.area,aOther);if(m)e.area=m;}setErrs(e);if(!Object.keys(e).length)setStep(2);}
  async function next3(ev){
    ev.preventDefault();const e={};
    if(!f.name.trim())e.name='Required';const age=parseInt(f.age);if(!age||age<0||age>110)e.age='Enter age';
    if(!f.gender)e.gender='Choose one';if(!f.hospital.trim())e.hospital='Required';
    if(!/^\d{10}$/.test(np(f.phone)))e.phone='Enter valid 10-digit number';
    setErrs(e);if(Object.keys(e).length){setTimeout(()=>{const el=document.querySelector('.db-modal .db-input.err,.db-modal .db-input.error,.db-modal [class*="err"]');if(el&&el.scrollIntoView)el.scrollIntoView({block:'center',behavior:'smooth'});},50);return;}
    const g=guard(ev);if(g==='consent')return;
    /* never block the message: when over the limit we just skip saving a copy for staff */
    if(g==='ok'){setBusy(true);try{// also lets the Vizag Volunteers team see it (staff approve before it is public)
      await sendRecord('requests',{name:f.name.trim(),phone:np(f.phone),bg:f.bg,units,hospital:f.hospital.trim(),area:f.area.trim(),urgency:f.urgency,note:('Age '+age+', '+f.gender+'. Donor request sent on WhatsApp.').slice(0,300)},np(f.phone)+f.hospital.trim().toLowerCase()+'-find');
      }catch(x){}setBusy(false);}
    setStep(4);window.scrollTo({top:0});
  }
  const req={...f,units,phone:np(f.phone)};
  const msg=step===4?helpMessage(req):'';
  async function improve(lang){
    setWording(true);
    try{
      const t=await rewriteMessage({bg:req.bg,units:req.units,urgency:req.urgency,groups:compat,lang});
      const out=t.split('[PATIENT]').join(req.name).split('[AGE]').join(req.age).split('[GENDER]').join(req.gender).split('[HOSPITAL]').join(req.hospital).split('[AREA]').join(req.area).split('[LINK]').join(helpLink(req));
      setCustom(out);
    }catch(e){dbToast(friendly(e).replace('fill the details by hand','use the standard message'),'err');}
    setWording(false);
  }
  function copy(){try{navigator.clipboard.writeText(custom||msg);}catch(e){}setCopied(true);setTimeout(()=>setCopied(false),2500);}
  const titles={1:'Find Blood',2:'Blood banks for '+f.bg,3:'Ask donors for help',4:'Send to donors'};
  return <Modal open={open} onClose={close} title={titles[step]} sub={step===1?'Tell us what is needed. We will check blood banks first.':step===2?'Live stock from eRaktKosh. Call the bank before you go.':step===3?'A few details for the message':'Step 4 of 4'}>
    {step===1&&<div>
      <div className="ff-ai">
        {!mode&&<button type="button" className="ff-ai-btn" onClick={()=>setMode('open')}><span className="material-symbols-outlined">auto_awesome</span><span><b>Have a message or a photo of the slip?</b><small>Paste it or upload it - AI fills the form for you</small></span></button>}
        {mode&&<div>
          <textarea className="db-input" rows={4} placeholder="Paste the WhatsApp message here (English, Telugu or Hindi)" value={paste} onChange={e=>setPaste(e.target.value)} style={{resize:'vertical',marginBottom:8}}/>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <label className="db-btn db-btn-outline db-btn-sm" style={{cursor:'pointer'}}><span className="material-symbols-outlined">photo_camera</span>{imgName||'Add photo'}<input ref={imgRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>setImgName(e.target.files[0]?'Photo added':'')}/></label>
            <button type="button" className="db-btn db-btn-primary db-btn-sm" disabled={reading} onClick={readIt}><span className="material-symbols-outlined">auto_awesome</span>{reading?'Reading...':'Read it'}</button>
            <button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={()=>{setMode('');setReadMsg('');}}>Cancel</button>
          </div>
          {readMsg&&<div style={{fontSize:13,marginTop:8,color:'var(--db-gray-700)'}}>{readMsg}</div>}
          <div style={{fontSize:11,color:'var(--db-gray-500)',marginTop:8}}>The text or photo is sent to Google Gemini (free) to read it, and is not saved by us. Please check what it filled in. Prefer not to share? Just type below.</div>
        </div>}
        {captured&&<div className="ff-ok"><span className="material-symbols-outlined">check_circle</span><div>Read from your {captured}. Please check the details below{f.name?' and on the next screens':''}. Nothing is sent until you confirm.</div></div>}
      </div>
      <div className="db-form-group"><label className="db-form-label">Blood group needed <span>*</span></label>
        <div className="ff-bg">{BLOOD_GROUPS.map(g=><button type="button" key={g} className={'ff-chip'+(f.bg===g?' on':'')} onClick={()=>set('bg',g)}>{g}</button>)}</div>
        {errs.bg&&<div className="db-form-err">{errs.bg}</div>}</div>
      <div className="db-form-group"><label className="db-form-label">Units needed</label><select className="db-input" value={f.units} onChange={e=>set('units',e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></div>
      <AreaPicker label="Where is the patient? (area)" req placeholder="Start typing, e.g. MVP Colony" value={f.area} onChange={v=>set('area',v)} error={errs.area} other={aOther} setOther={setAOther}/>
      <div className="db-form-actions"><button type="button" className="db-btn db-btn-primary" style={{flex:1}} onClick={next1}><span className="material-symbols-outlined">search</span>Show blood banks</button></div>
    </div>}
    {step===2&&<div>
      {loading?<div className="db-empty">Loading blood bank stock...</div>:list.length===0?<div className="ff-warn"><span className="material-symbols-outlined">warning</span><div><b>No blood bank has {f.bg} right now.</b><br/>The best next step is to ask donors.</div></div>
        :<React.Fragment>
          {!enough&&<div className="ff-warn"><span className="material-symbols-outlined">warning</span><div><b>No single bank has {units} units of {f.bg}.</b> You may need donors too.</div></div>}
          {list.map(b=><div key={b.id} className="ff-bank"><div style={{flex:1,minWidth:0}}><div className="n">{b.name}</div><div className="a">{b.area||'Visakhapatnam'}{b.near?' · near you':''}</div></div>
            <div className={'ff-st '+availCls(b.stock[f.bg])}>{b.stock[f.bg]}<small> units</small></div>
            {b.phone&&<a className="db-btn db-btn-outline db-btn-sm" href={'tel:'+b.phone.replace(/[^\d+]/g,'')}><span className="material-symbols-outlined">call</span>Call</a>}</div>)}
        </React.Fragment>}
      <div className="ff-ask"><div><b>Banks too far or empty?</b><div style={{fontSize:13,color:'var(--db-gray-500)'}}>Send a request to donors on WhatsApp.{donorCount>0&&<React.Fragment> {donorCount} registered donor{donorCount>1?'s':''} match ({compat.join(', ')}); donors who gave blood in the last 3 months are skipped.</React.Fragment>}</div></div>
        <button type="button" className="db-btn db-btn-primary" onClick={()=>setStep(3)}><span className="material-symbols-outlined">volunteer_activism</span>Ask donors</button></div>
      <div className="db-form-actions"><button type="button" className="db-btn db-btn-outline" onClick={()=>setStep(1)}>Back</button><button type="button" className="db-btn db-btn-outline" onClick={close}>Done</button></div>
    </div>}
    {step===3&&<form onSubmit={next3} noValidate>
      <div className="db-form-row"><div className="db-form-group"><label className="db-form-label">Patient name <span>*</span></label><input className={'db-input'+(errs.name?' err':'')} value={f.name} onChange={e=>set('name',e.target.value)}/>{errs.name&&<div className="db-form-err">{errs.name}</div>}</div>
        <div className="db-form-group"><label className="db-form-label">Age <span>*</span></label><input className={'db-input'+(errs.age?' err':'')} type="number" inputMode="numeric" min="0" max="110" value={f.age} onChange={e=>set('age',e.target.value)}/>{errs.age&&<div className="db-form-err">{errs.age}</div>}</div></div>
      <div className="db-form-row"><div className="db-form-group"><label className="db-form-label">Gender <span>*</span></label><select className={'db-input'+(errs.gender?' err':'')} value={f.gender} onChange={e=>set('gender',e.target.value)}><option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option></select>{errs.gender&&<div className="db-form-err">{errs.gender}</div>}</div>
        <div className="db-form-group"><label className="db-form-label">Urgency</label><select className="db-input" value={f.urgency} onChange={e=>set('urgency',e.target.value)}><option value="critical">Critical - now</option><option value="urgent">Urgent - few hours</option><option value="routine">Routine - scheduled</option></select></div></div>
      <div className="db-form-group"><label className="db-form-label">Hospital <span>*</span></label><input className={'db-input'+(errs.hospital?' err':'')} value={f.hospital} placeholder="e.g. KGH, Apollo, Care" onChange={e=>set('hospital',e.target.value)}/>{errs.hospital&&<div className="db-form-err">{errs.hospital}</div>}</div>
      <div className="db-form-group"><label className="db-form-label">Your phone (donors will message you) <span>*</span></label><input className={'db-input'+(errs.phone?' err':'')} type="tel" inputMode="numeric" placeholder="10-digit mobile" value={f.phone} onChange={e=>set('phone',e.target.value)}/>{errs.phone&&<div className="db-form-err">{errs.phone}</div>}</div>
      <div style={{fontSize:13,color:'var(--db-gray-500)',marginBottom:6}}>Needs {units} unit{units>1?'s':''} of <b>{f.bg}</b> at {f.area}. Donors who can give: {compat.join(', ')}.</div>
      <Consent/><div className="db-form-actions"><button type="submit" disabled={busy} className="db-btn db-btn-primary" style={{flex:1}}><span className="material-symbols-outlined">edit_note</span>{busy?'Please wait…':'Prepare message'}</button><button type="button" className="db-btn db-btn-outline" onClick={()=>setStep(2)}>Back</button></div>
    </form>}
    {step===4&&<div>
      <div className="ff-msg">{custom||msg}</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
        <button type="button" className="db-btn db-btn-outline db-btn-sm" disabled={wording} onClick={()=>improve('English')}><span className="material-symbols-outlined">auto_awesome</span>{wording?'Writing...':'Improve wording'}</button>
        <button type="button" className="db-btn db-btn-outline db-btn-sm" disabled={wording} onClick={()=>improve('Telugu')}><span className="material-symbols-outlined">translate</span>తెలుగులో</button>
        {custom&&<button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={()=>setCustom('')}>Use original</button>}
      </div>
      <a className="db-btn db-btn-primary" style={{width:'100%',justifyContent:'center',marginBottom:10}} href={'https://wa.me/?text='+encodeURIComponent(custom||msg)} target="_blank" rel="noopener"><span className="material-symbols-outlined">send</span>Send on WhatsApp</a>
      <div style={{fontSize:13,color:'var(--db-gray-500)',marginBottom:12}}>WhatsApp opens. Pick friends, family or groups (Vizag blood groups, colony, college). Donors who tap the link can accept or ignore, and a match messages you directly.</div>
      <div className="db-form-actions" style={{flexWrap:'wrap'}}><button type="button" className="db-btn db-btn-outline" onClick={copy}><span className="material-symbols-outlined">{copied?'check':'content_copy'}</span>{copied?'Copied':'Copy message'}</button>
        <button type="button" className="db-btn db-btn-outline" onClick={()=>{const r=req;close();onPoster({patient_name:r.name,request_no:'VVDBR'+new Date().toISOString().slice(2,10).replace(/-/g,'')+String(Math.floor(1000+Math.random()*9000)),name:r.name,bg:r.bg,units:r.units,hospital:r.hospital,area:r.area,phone:r.phone,urgency:(r.urgency||'').charAt(0).toUpperCase()+(r.urgency||'').slice(1),contact:r.phone});}}><span className="material-symbols-outlined">campaign</span>Share poster</button>
        <button type="button" className="db-btn db-btn-outline" onClick={close}>Close</button></div>
    </div>}
  </Modal>;
}
/* What a donor sees when they open the shared link */
function HelpView({r,goHome}){
  const[checks,setChecks]=useState({age:false,weight:false,gap:false,well:false});
  const[mybg,setMybg]=useState('');const[ans,setAns]=useState('');const[dn,setDn]=useState('');const[dp,setDp]=useState('');const[dnErr,setDnErr]=useState('');
  const all=Object.values(checks).every(Boolean);
  const compatible=mybg&&CAN_RECEIVE_FROM[r.bg].includes(mybg);
  const fwd=helpMessage(r);
  const items=[['age','I am 18 to 65 years old'],['weight','I weigh 50 kg or more'],['gap','I have NOT donated blood in the last 3 months'],['well','I feel healthy today (no fever, no recent illness or surgery)']];
  const yes=`Hi, I saw your blood request for ${r.name} (${r.bg}) at ${r.hospital}. I can donate. I have done the eligibility check on Digi Blood. My blood group is ${mybg}.`;
  return <div className="db-pw"><div className="db-cnt" style={{maxWidth:560}}>
    <div className="ff-hcard"><div className="db-bg-chip lg">{r.bg}</div><div style={{flex:1}}>
      <div className="ff-htitle">Blood needed: {r.bg}</div>
      <div>{r.name}, {r.age} yrs, {r.gender}</div><div>{r.units} unit{r.units>1?'s':''} · {r.hospital}, {r.area}</div>
      <div style={{marginTop:4,fontWeight:700,color:'var(--db-secondary)',textTransform:'capitalize'}}>{r.urgency}</div></div></div>
    {ans==='no'?<div className="db-card" style={{padding:20,marginTop:14}}><b>Thank you for looking.</b><p style={{margin:'8px 0 14px'}}>You can still help: forward this request to a friend who may be able to donate.</p>
        <a className="db-btn db-btn-primary" href={'https://wa.me/?text='+encodeURIComponent(fwd)} target="_blank" rel="noopener"><span className="material-symbols-outlined">share</span>Forward on WhatsApp</a></div>
    :ans==='yes'?<div className="db-card" style={{padding:20,marginTop:14}}><b>Thank you, you may save a life.</b><p style={{margin:'8px 0 14px'}}>Tap below to tell the family on WhatsApp. They will share the hospital details with you.</p>
        <a className="db-btn db-btn-primary" href={'https://wa.me/91'+r.phone+'?text='+encodeURIComponent(yes)} target="_blank" rel="noopener"><span className="material-symbols-outlined">chat</span>Message {r.name.split(' ')[0]}'s family</a>
        <p style={{margin:'16px 0 8px'}}>Know someone else who can give {r.bg}?</p>
        <a className="db-btn db-btn-outline" href={'https://wa.me/?text='+encodeURIComponent(fwd)} target="_blank" rel="noopener"><span className="material-symbols-outlined">person_add</span>Invite another donor</a></div>
    :<div className="db-card" style={{padding:20,marginTop:14}}>
      <div className="db-form-group"><label className="db-form-label">Your blood group</label><select className="db-input" value={mybg} onChange={e=>setMybg(e.target.value)}><option value="">Select…</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select></div>
      {mybg&&!compatible&&<div className="ff-warn"><span className="material-symbols-outlined">info</span><div>{mybg} cannot give to a {r.bg} patient. Please forward this to someone with {CAN_RECEIVE_FROM[r.bg].join(', ')}.</div></div>}
      <div className="db-form-row"><div className="db-form-group"><label className="db-form-label">Your first name</label><input className={'db-input'+(dnErr?' err':'')} value={dn} onChange={e=>{setDn(e.target.value);setDnErr('');}}/>{dnErr&&<div className="db-form-err">{dnErr}</div>}</div>
        <div className="db-form-group"><label className="db-form-label">Phone <span style={{textTransform:'none',fontWeight:400}}>(optional, staff only)</span></label><input className="db-input" type="tel" inputMode="numeric" value={dp} onChange={e=>setDp(e.target.value)}/></div></div>
      <div className="db-form-label" style={{margin:'6px 0'}}>Quick eligibility check</div>
      {items.map(([k,t])=><label key={k} className="ff-check"><input type="checkbox" checked={checks[k]} onChange={e=>setChecks(c=>({...c,[k]:e.target.checked}))}/><span>{t}</span></label>)}
      <div className="db-form-actions" style={{flexWrap:'wrap'}}>
        <button type="button" className="db-btn db-btn-primary" style={{flex:1}} disabled={!all||!compatible} onClick={()=>{if(!dn.trim()){setDnErr('Please enter your first name');return;}logReply({reqPhone:r.phone,reqBg:r.bg,hospital:String(r.hospital).slice(0,120),donorName:dn.trim().slice(0,60),donorPhone:dp.replace(/\D/g,'').slice(-10),donorBg:mybg});setAns('yes');}}><span className="material-symbols-outlined">favorite</span>I can donate</button>
        <button type="button" className="db-btn db-btn-outline" onClick={()=>setAns('no')}>Ignore</button></div>
      {!all&&<div style={{fontSize:12,color:'var(--db-gray-500)',marginTop:8}}>Tick all four to accept. If one does not fit you, tap Ignore and forward it to a friend.</div>}
      <button type="button" className="ff-link" onClick={()=>window.dispatchEvent(new CustomEvent('db-chat',{detail:{q:'Am I eligible to donate blood? I have a question.'}}))}><span className="material-symbols-outlined">chat</span>Not sure? Ask the assistant</button>
    </div>}
    <div style={{textAlign:'center',marginTop:18}}><button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={goHome}>Open Digi Blood</button></div>
  </div></div>;
}
/* ── Assistant chatbot (Gemini free tier) ── */
const ACT_LBL={request:'Request Blood',donor:'Register as Donor',availability:'See blood availability',requests:'See active requests',camps:'See donation camps'};
function Assistant({onAction}){
  const{banks}=useContext(BloodCtx);const DCa=useContext(DataCtx);
  const[open,setOpen]=useState(false);const[msgs,setMsgs]=useState([]);const[txt,setTxt]=useState('');const[busy,setBusy]=useState(false);const end=useRef(null);
  const stock=useMemo(()=>BLOOD_GROUPS.map(g=>g+': '+banks.reduce((s,b)=>s+(b.stock[g]||0),0)+' total ('+banks.filter(b=>b.stock[g]>0).sort((a,b)=>b.stock[g]-a.stock[g]).slice(0,3).map(b=>b.name.split(/[ ,]/).slice(0,4).join(' ')+' '+b.stock[g]+(b.phone?' tel '+b.phone:'')).join(', ')+')').join('; '),[banks]);
  async function send(t){
    t=(t||'').trim();if(!t||busy)return;
    const next=[...msgs,{role:'me',text:t.slice(0,500)}];setMsgs(next);setTxt('');setBusy(true);
    try{const dn=(DCa&&DCa.donors)||[],rq=((DCa&&DCa.requests)||[]).filter(r=>r.status!=='fulfilled'&&r.status!=='closed');const bgc={};dn.forEach(d=>{bgc[d.bg]=(bgc[d.bg]||0)+1;});const live='Registered donors: '+(dn.length?Object.entries(bgc).map(([k,v])=>k+' '+v).join(', '):'none yet')+'. Open requests: '+(rq.length?rq.slice(0,6).map(r=>r.bg+' x'+r.units+' at '+r.hospital+' ('+r.area+', '+r.urgency+')').join('; '):'none right now')+'. Upcoming camps: '+((DCa&&DCa.camps)||[]).filter(c=>c.status!=='past').slice(0,3).map(c=>c.title+' '+c.day+' '+c.mon+' at '+c.venue).join('; ')+'.';const a=await chatReply(next.slice(-8),stock,live);const raw=String(a).replace(/\*\*/g,'').trim();const tg=(raw.match(/\[\[(request|donor|availability|requests|camps)\]\]/)||[])[1];setMsgs(m=>[...m,{role:'bot',text:raw.replace(/\[\[[a-z]+\]\]/g,'').trim(),act:tg}]);}
    catch(e){setMsgs(m=>[...m,{role:'bot',text:(/Too many/.test(e&&e.message)?e.message:'Sorry, I could not answer just now. Please try again in a minute.')+' Meanwhile you can see live stock and call banks right here.',err:1,act:'availability'}]);}
    setBusy(false);
  }
  useEffect(()=>{const h=e=>{setOpen(true);if(e.detail&&e.detail.q)setTimeout(()=>send(e.detail.q),50);};window.addEventListener('db-chat',h);return()=>window.removeEventListener('db-chat',h);});
  useEffect(()=>{if(end.current)end.current.scrollIntoView({block:'end'});},[msgs,busy,open]);
  const chips=['My father needs B+ blood urgently','I want to donate blood','Where is O- blood now?','Can I donate? I am 45 and 60 kg'];
  return <React.Fragment>
    {!open&&<button type="button" className="ca-fab" onClick={()=>setOpen(true)} aria-label="Ask the Digi Blood assistant"><span className="material-symbols-outlined">smart_toy</span><span className="ca-fab-t">Ask AI</span></button>}
    {open&&<div className="ca-panel">
      <div className="ca-hd"><div><b>Digi Blood assistant</b><small>Free AI helper. Not a doctor.</small></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close"><span className="material-symbols-outlined">close</span></button></div>
      <div className="ca-body">
        {msgs.length===0&&<div className="ca-msg bot">Hi! I can help with donating, requesting blood, or finding stock. Ask in English, Telugu or Hindi.<div className="ca-chips">{chips.map(c=><button type="button" key={c} onClick={()=>send(c)}>{c}</button>)}</div></div>}
        {msgs.map((m,i)=><div key={i} className={'ca-msg '+(m.role==='me'?'me':'bot')}>{m.text}{m.act&&<button type="button" className="ca-act" onClick={()=>{setOpen(false);onAction&&onAction(m.act);}}>{ACT_LBL[m.act]}</button>}</div>)}
        {busy&&<div className="ca-msg bot">Typing...</div>}
        <div ref={end}/>
      </div>
      <form className="ca-in" onSubmit={e=>{e.preventDefault();send(txt);}}><input value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Type your question" maxLength={300}/><button type="submit" disabled={busy||!txt.trim()} aria-label="Send"><span className="material-symbols-outlined">send</span></button></form>
      <div className="ca-note">Do not type names, phone numbers or medical records. Answers may be wrong; the blood bank doctor decides.</div>
    </div>}
  </React.Fragment>;
}

/* ── Availability forecast from our own saved history ── */
function Forecast(){
  const[h,setH]=useState(null);const[exp,setExp]=useState('');const[busy,setBusy]=useState(false);
  useEffect(()=>{fetch(import.meta.env.BASE_URL+'history.json?t='+Math.floor(Date.now()/600000)).then(r=>r.ok?r.json():null).then(j=>setH(j&&j.points?j.points:[])).catch(()=>setH([]));},[]);
  if(h===null)return null;
  const hrs=h.length>1?(new Date(h[h.length-1].t)-new Date(h[0].t))/3600000:0;
  const rows=h.length>=2&&hrs>=12?BLOOD_GROUPS.map(g=>{
    const last=h[h.length-1],tL=new Date(last.t).getTime();
    const win=h.filter(p=>tL-new Date(p.t).getTime()<=48*3600000);
    const n=win.length;const xs=win.map(p=>(new Date(p.t).getTime()-tL)/3600000),ys=win.map(p=>p.g[g]||0);
    const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
    const den=xs.reduce((a,x)=>a+(x-mx)*(x-mx),0)||1;const slope=xs.reduce((a,x,i)=>a+(x-mx)*(ys[i]-my),0)/den;
    const now=last.g[g]||0;const proj=Math.max(0,Math.round(now+slope*24));
    const lo=Math.min(...ys);
    const trend=slope*24>Math.max(2,now*0.15)?'up':slope*24<-Math.max(2,now*0.15)?'down':'flat';
    const risk=proj<=Math.max(5,lo*0.5)||(trend==='down'&&proj<15)?'low':'ok';
    return{g,now,proj,trend,risk,lo};
  }):null;
  async function explain(){
    setBusy(true);
    try{const t=await gen({temperature:0.3,input:'Citywide blood stock now and projected in 24h (units): '+rows.map(r=>`${r.g} ${r.now} -> ${r.proj}`).join('; '),system:'You explain blood stock trends for the public in Visakhapatnam. In 2 short plain sentences say which groups may run low soon and which look fine. These are estimates from a simple trend of the last days, not guarantees. No medical advice.'});setExp(String(t).trim());}
    catch(e){setExp(friendly(e));}
    setBusy(false);
  }
  return <div className="fc-card">
    <div className="fc-hd"><span className="material-symbols-outlined">trending_up</span><div><b>Stock forecast (next 24 hours)</b><small>Estimate from the last days of eRaktKosh data. Not a guarantee.</small></div></div>
    {!rows?<div className="fc-wait">Collecting data. The forecast appears after about a day of history ({h.length} reading{h.length===1?'':'s'} saved so far, one every 2 hours).</div>
    :<React.Fragment>
      <div className="fc-grid">{rows.map(r=><div key={r.g} className={'fc-cell '+(r.risk==='low'?'low':'')}><div className="g">{r.g}</div><div className="n">{r.now}<span className="material-symbols-outlined">{r.trend==='up'?'trending_up':r.trend==='down'?'trending_down':'trending_flat'}</span></div><div className="p">{r.risk==='low'?'May run low':'Likely OK'} · ~{r.proj}</div></div>)}</div>
      {exp?<div className="fc-exp">{exp}</div>:<button type="button" className="db-btn db-btn-outline db-btn-sm" disabled={busy} onClick={explain}><span className="material-symbols-outlined">auto_awesome</span>{busy?'Thinking...':'Explain in simple words'}</button>}
    </React.Fragment>}
  </div>;
}
function DigiBloodApp(){
  const[page,setPage]=useState(()=>{const h=location.hash.slice(1);return ['avail','req','donors','camps','about'].includes(h)?h:h==='register'?'donors':'home'});
  const[toasts,showToast]=useToast();
  useEffect(()=>{const h=e=>showToast(e.detail.msg,e.detail.type||'ok');window.addEventListener('db-toast',h);return()=>window.removeEventListener('db-toast',h);},[]);
  const[donorOpen,setDonorOpen]=useState(()=>location.hash==='#register');
  useEffect(()=>{const h=()=>{if(location.hash==='#register')setDonorOpen(true);};window.addEventListener('hashchange',h);return()=>window.removeEventListener('hashchange',h);},[]);
  const[reqOpen,setReqOpen]=useState(false);
  const[helpReq,setHelpReq]=useState(()=>location.hash.startsWith('#help=')?parseHelp(location.hash):null);
  const[done,setDone]=useState(null);
  useEffect(()=>{const h=e=>setDone(e.detail);window.addEventListener('db-done',h);return()=>window.removeEventListener('db-done',h);},[]);
  const[posterData,setPosterData]=useState(null);
  useEffect(()=>{document.title=PAGE_TITLES[page]||'Digi Blood';},[page]);
  const openDonor=()=>setDonorOpen(true);
  const openReq=()=>setReqOpen(true);
  const pages={
    home:<HomePage setPage={p=>{setPage(p);window.scrollTo({top:0});}} openDonor={openDonor} openReq={openReq}/>,
    avail:<AvailPage/>,
    req:<RequestsPage openReq={openReq}/>,
    donors:<DonorsPage openDonor={openDonor}/>,
    camps:<CampsPage openDonor={openDonor}/>,
    about:<AboutPage/>
  };
  return <BloodProvider><DataProvider>
    <div className="db-app">
      <SubNav page={page} setPage={p=>{setPage(p);window.scrollTo({top:0});}} openDonor={openDonor} openReq={openReq}/>
      <main>{helpReq?<HelpView r={helpReq} goHome={()=>{history.replaceState(null,'',location.pathname);setHelpReq(null);}}/>:pages[page]}</main>
      <footer className="db-footer"><div className="db-cnt">
        <div className="db-footer-brand"><b>Digi Blood</b><span>A Vizag Volunteers initiative &middot; Visakhapatnam</span></div>
        <div className="db-footer-links"><a href="https://www.vizagvolunteers.org" target="_blank" rel="noopener">vizagvolunteers.org</a><a href="https://wa.me/917337335556" target="_blank" rel="noopener">WhatsApp us</a><button type="button" onClick={()=>{setPage('about');window.scrollTo({top:0,behavior:'smooth'});}}>About &amp; FAQ</button></div>
        <div className="db-footer-note">Details you share are stored with your consent, reviewed by our team before they appear publicly, and removed on request. Blood stock is from eRaktKosh (MoHFW) - please call the blood bank to confirm before visiting.</div>
      </div></footer>
      <DonorForm open={donorOpen} onClose={()=>setDonorOpen(false)}/>
      <FindFlow open={reqOpen} onClose={()=>setReqOpen(false)} onPoster={setPosterData}/>
      <PosterModal req={posterData} onClose={()=>setPosterData(null)}/>
      <ThankYou done={done} onClose={()=>setDone(null)} onPoster={p=>{setDone(null);setPosterData(p);}} goAvail={()=>{setDone(null);setPage('avail');window.scrollTo({top:0});}}/>
      <Assistant onAction={k=>{if(k==='request')openReq();else if(k==='donor')openDonor();else{setPage(k==='availability'?'avail':k);window.scrollTo({top:0});}}}/>
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
