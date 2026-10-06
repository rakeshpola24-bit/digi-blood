import React,{useState,useEffect} from 'react';
import {LIVE,staff} from './store.js';

const TABS=[['requests','Blood requests'],['donors','Donors'],['camps','Camps']];
const box={background:'#fff',border:'1px solid #E9ECEF',borderRadius:12,padding:14,marginBottom:10};
const btn=(bg,c)=>({background:bg,color:c||'#fff',border:0,borderRadius:8,padding:'8px 14px',fontWeight:600,fontSize:14,cursor:'pointer'});

function Row({kind,r}){
  const[ph,setPh]=useState('');
  useEffect(()=>{if(kind==='donors')staff.phone(r.id).then(setPh)},[kind,r.id]);
  const set=s=>staff.setStatus(kind,r.id,s);
  const title=kind==='camps'?(r.title||r.venue):r.name;
  const line=kind==='requests'?`${r.bg} x${r.units} - ${r.hospital}, ${r.area} - ${r.urgency} - call ${r.phone}`
    :kind==='donors'?`${r.bg} - age ${r.age||'?'} - ${r.area} - ${ph||'(phone not found)'}`
    :`${r.date||'no date'} - ${r.venue} - ${r.contact||''}`;
  return <div style={{...box,borderLeft:'4px solid '+(r.status==='pending'?'#FEC73E':r.status==='approved'?'#28A745':'#868E96')}}>
    <div style={{fontWeight:700}}>{title} <span style={{fontWeight:400,color:'#868E96',fontSize:12}}>({r.status})</span></div>
    <div style={{fontSize:14,color:'#495057',margin:'4px 0 8px'}}>{line}</div>
    {r.note&&<div style={{fontSize:13,fontStyle:'italic',color:'#868E96',marginBottom:8}}>"{r.note}"</div>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {r.status!=='approved'&&<button style={btn('#28A745')} onClick={()=>set('approved')}>Approve &amp; show</button>}
      {r.status==='approved'&&<button style={btn('#868E96')} onClick={()=>set('rejected')}>Hide</button>}
      {r.status==='pending'&&<button style={btn('#FD7E14')} onClick={()=>set('rejected')}>Reject</button>}
      {kind==='requests'&&r.status==='approved'&&<>
        <button style={btn('#0C5460')} onClick={()=>staff.update('requests',r.id,{progress:'matched'})}>Matched</button>
        <button style={btn('#155724')} onClick={()=>staff.update('requests',r.id,{progress:'fulfilled'})}>Fulfilled</button></>}
      {kind==='donors'&&r.status==='approved'&&<button style={btn('#E62E32')} onClick={()=>{const n=prompt('Total donations so far?',r.donations||0);if(n!==null)staff.update('donors',r.id,{donations:parseInt(n)||0})}}>Set donations</button>}
      <button style={btn('#fff','#E62E32')} onClick={()=>{if(confirm('Delete permanently?')){staff.remove(kind,r.id);if(kind==='donors')staff.remove('donorContacts',r.id)}}}>Delete</button>
    </div>
  </div>;
}

function List({kind}){
  const[rows,setRows]=useState(null);
  useEffect(()=>staff.watchAll(kind,setRows),[kind]);
  if(!rows)return <p>Loading...</p>;
  const order={pending:0,approved:1,rejected:2};
  const sorted=[...rows].sort((a,b)=>(order[a.status]??3)-(order[b.status]??3));
  const pend=rows.filter(r=>r.status==='pending').length;
  return <div>
    <p style={{color:'#495057'}}>{pend} waiting for review, {rows.length} total.</p>
    {kind==='camps'&&<AddCamp/>}
    {sorted.map(r=><Row key={r.id} kind={kind} r={r}/>)}
    {!rows.length&&<p>Nothing here yet.</p>}
  </div>;
}

function AddCamp(){
  const[f,setF]=useState({title:'',organizer:'Vizag Volunteers',date:'',venue:'',slots:'',contact:''});
  const ch=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const inp={padding:8,border:'1px solid #ccc',borderRadius:8,fontSize:14,width:'100%',marginBottom:6};
  return <details style={box}><summary style={{fontWeight:700,cursor:'pointer'}}>+ Add a camp</summary>
    <input style={inp} placeholder="Camp title" value={f.title} onChange={ch('title')}/>
    <input style={inp} placeholder="Organizer" value={f.organizer} onChange={ch('organizer')}/>
    <input style={inp} type="date" value={f.date} onChange={ch('date')}/>
    <input style={inp} placeholder="Venue" value={f.venue} onChange={ch('venue')}/>
    <input style={inp} type="number" placeholder="Slots" value={f.slots} onChange={ch('slots')}/>
    <input style={inp} placeholder="Contact (name - phone)" value={f.contact} onChange={ch('contact')}/>
    <button style={btn('#E62E32')} onClick={()=>{if(!f.title||!f.date||!f.venue)return alert('Title, date and venue needed');staff.add('camps',{...f,slots:parseInt(f.slots)||0,registered:0}).then(()=>setF({...f,title:'',venue:'',date:'',slots:'',contact:''}))}}>Publish camp</button>
  </details>;
}

export default function Admin(){
  const[user,setUser]=useState(undefined);
  const[tab,setTab]=useState('requests');
  const[e,setE]=useState('');const[p,setP]=useState('');const[err,setErr]=useState('');
  useEffect(()=>staff.onUser(setUser),[]);
  const wrap={maxWidth:760,margin:'0 auto',padding:16,fontFamily:'Inter,system-ui,sans-serif'};
  if(!LIVE)return <div style={wrap}><h2>Digi Blood staff</h2><p>Demo mode: Firebase is not connected yet, so there is nothing to review.</p><a href="#" onClick={()=>{location.hash='';location.reload()}}>Back to app</a></div>;
  if(user===undefined)return <div style={wrap}>Loading...</div>;
  if(!user)return <div style={wrap}><h2>Digi Blood staff login</h2>
    <input style={{padding:10,width:'100%',marginBottom:8}} placeholder="Email" value={e} onChange={x=>setE(x.target.value)}/>
    <input style={{padding:10,width:'100%',marginBottom:8}} type="password" placeholder="Password" value={p} onChange={x=>setP(x.target.value)}/>
    <button style={btn('#E62E32')} onClick={()=>staff.login(e,p).catch(()=>setErr('Wrong email or password'))}>Sign in</button>
    {err&&<p style={{color:'#E62E32'}}>{err}</p>}</div>;
  return <div style={wrap}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={{margin:0}}>Digi Blood staff</h2><button style={btn('#868E96')} onClick={staff.logout}>Sign out</button></div>
    <div style={{display:'flex',gap:8,margin:'14px 0',flexWrap:'wrap'}}>{TABS.map(([k,l])=><button key={k} style={btn(tab===k?'#E62E32':'#E9ECEF',tab===k?'#fff':'#212529')} onClick={()=>setTab(k)}>{l}</button>)}</div>
    <List key={tab} kind={tab}/>
  </div>;
}
