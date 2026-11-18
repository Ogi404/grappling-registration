(() => {
'use strict';
const C=window.REGISTRATION_CONFIG, $=id=>document.getElementById(id), form=$('registration');
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
months.forEach((name,i)=>$('birthMonth').add(new Option(name,String(i+1))));
const E=new Date(C.eventDate+'T12:00:00Z');
const validDate=(d,m,y)=>{if(!d||!m||!y||y<1920||y>2026)return null;const v=new Date(Date.UTC(y,m-1,d));return v.getUTCFullYear()===y&&v.getUTCMonth()===m-1&&v.getUTCDate()===d?v:null;};
const years=dob=>{let n=E.getUTCFullYear()-dob.getUTCFullYear();if(E.getUTCMonth()<dob.getUTCMonth()||(E.getUTCMonth()===dob.getUTCMonth()&&E.getUTCDate()<dob.getUTCDate()))n--;return n;};
const belts=age=>age<16?['White','Grey','Yellow','Orange','Green']:age<18?['White','Blue']:['White','Blue','Purple','Brown','Black'];
const ageGroups=age=>{if(age<4||age>100)return [];if(age<18){const a=age===16||age===17?[16,17]:[Math.floor((age-4)/2)*2+4,Math.floor((age-4)/2)*2+5];return [(age>=16?'Teens ':'Kids ')+a[0]+'-'+a[1]];}return ['Adult',...(age>=30?['Master']:[]),...(age>=40&&$('gender').value==='Male'?['Senior']:[])];};
const classes=(age,gender)=>age<16?C.weightClassesKg.kids:age<18?C.weightClassesKg.teens:C.weightClassesKg[gender==='Female'?'female':'male'];
const kgLabel=(n,over=false)=>(over?'Over ':'Under ')+n.toFixed(2)+' kg';
const choices=(list,placeholder)=>[{label:placeholder,value:''},...list.map(v=>({label:v,value:v}))];
function replaceOptions(el,opts,fallback=''){const current=el.value;el.replaceChildren(...opts.map(o=>new Option(o.label,o.value)));el.value=opts.some(o=>o.value===current)?current:fallback;}
function weightOptions(age,gender,el){if(age===null||!gender){replaceOptions(el,choices([], 'Enter age and gender first'));return;}const vals=classes(age,gender);replaceOptions(el,choices([...vals.map(n=>kgLabel(n)),kgLabel(vals.at(-1),true)],'Choose weight division'));}
function suggestion(age,gender,w){if(age===null||!gender||!Number.isFinite(w)||w<=0)return '';const vals=classes(age,gender);const n=vals.find(n=>w<=n);return n===undefined?kgLabel(vals.at(-1),true):kgLabel(n);}
function skill(age,belt){if(!belt)return '';if(age<16)return ({White:'Beginner',Grey:'Intermediate',Yellow:'Advanced',Orange:'Advanced',Green:'Expert'})[belt];if(age<18)return ({White:'Beginner',Blue:'Advanced'})[belt];return ({White:'Beginner',Blue:'Intermediate',Purple:'Advanced',Brown:'Advanced',Black:'Advanced'})[belt];}
function message(id,text,kind=''){const el=$(id);el.hidden=!text;el.className='notice '+kind;el.textContent=text;}
const dob=()=>validDate(+$('birthDay').value,+$('birthMonth').value,+$('birthYear').value);
let age=null,prevBeltType='';
function update(){const d=dob();age=d?years(d):null;const minor=age!==null&&age<18;const valid=age!==null&&age>=4&&age<=100&&d<=E;
 $('ageResult').textContent=!d?'Enter date of birth to calculate the age division.':!valid?'Please check the birth date; standard divisions start at age 4.':`Age on event day: ${age} · ${minor?'Kids / teens':'Adult'}`;
 const type=age===null?'':age<16?'kids':age<18?'teens':'adults';if(type!==prevBeltType){prevBeltType=type;replaceOptions($('belt'),choices(type?belts(age):[],type?'Choose belt':'Enter birth date first'));}
 replaceOptions($('ageDivision'),choices(valid?ageGroups(age):[],'Choose age division'),valid?ageGroups(age)[0]:'');
 $('guardianArea').hidden=!minor;$('guardianConsentArea').hidden=!minor;$('guardianName').required=minor;$('guardianConsent').required=minor;
 if(!minor)$('guardianConsent').checked=false;
 $('absoluteArea').hidden=!valid||minor;if(minor){$('absoluteGi').checked=false;$('absoluteNoGi').checked=false;}
 weightOptions(age,$('gender').value,$('weightDivision'));updateWeight();updateSkill();
}
function updateWeight(){const s=suggestion(age,$('gender').value,Number($('weight').value));$('weightHint').textContent=(s?`Suggested: ${s}. `:'')+'General Grappling Industries kg classes; coach to confirm available event categories.';}
function updateSkill(){$('skillResult').textContent=age!==null&&$('belt').value?`Suggested No-Gi skill: ${skill(age,$('belt').value)}.`:'';}
function updateFormats(){const f=document.querySelector('input[name="format"]:checked').value;$('absoluteGi').disabled=f==='No-Gi';$('absoluteNoGi').disabled=f==='Gi';if(f==='No-Gi')$('absoluteGi').checked=false;if(f==='Gi')$('absoluteNoGi').checked=false;}
['birthDay','birthMonth','birthYear','gender'].forEach(id=>$(id).addEventListener('input',update));$('weight').addEventListener('input',updateWeight);$('belt').addEventListener('change',updateSkill);document.querySelectorAll('input[name="format"]').forEach(e=>e.addEventListener('change',updateFormats));
const base={eventId:'32871',eventName:C.eventName};
async function transmit(payload){await fetch(C.appsScriptUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});}
function showMode(bulk){$('registration').hidden=bulk;$('bulkSection').hidden=!bulk;for(const [id,active] of [['singleMode',!bulk],['bulkMode',bulk]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}}
$('singleMode').addEventListener('click',()=>showMode(false));$('bulkMode').addEventListener('click',()=>showMode(true));
form.addEventListener('submit',async ev=>{ev.preventDefault();message('formMessage','');const d=dob();if(!d||age===null||age<4||age>100){message('formMessage','Enter a valid date of birth.','error');return;}
 if(!form.checkValidity()||!$('ageDivision').value){form.reportValidity();message('formMessage','Please complete all required fields.','error');return;}
 if(age<18&&!$('guardianConsent').checked){message('formMessage','Parent/guardian permission is required.','error');return;}
 const payload={...base,fullName:$('fullName').value.trim(),dob:d.toISOString().slice(0,10),ageOnEvent:age,gender:$('gender').value,belt:$('belt').value,weightKg:Number($('weight').value),ageDivision:$('ageDivision').value,weightDivision:$('weightDivision').value,format:document.querySelector('input[name="format"]:checked').value,absoluteGi:$('absoluteGi').checked,absoluteNoGi:$('absoluteNoGi').checked,guardianName:age<18?$('guardianName').value.trim():'',guardianConsent:age<18?$('guardianConsent').checked:false,dataConsent:$('dataConsent').checked,source:'gym-form-v2'};
 const button=$('submitButton');button.disabled=true;button.textContent='Sending…';try{await transmit(payload);form.reset();update();message('formMessage','Request sent. Ask your coach to verify it appears in the team sheet.','success');}catch(_){message('formMessage','Could not send. Please try again.','error');}finally{button.disabled=false;button.textContent='Send to coach';}
});
let counter=0;
function makeKid(){const num=++counter;const card=document.createElement('article');card.className='kid-card';card.innerHTML=`<div class="kid-header"><h3>Child ${num}</h3><button type="button" class="remove-child">Remove</button></div>
<div class="kid-fields"><div class="wide"><label>Full name *</label><input data-field="name" maxlength="100" placeholder="First and last name" required></div>
<div><label>Birth day *</label><input data-field="day" type="number" inputmode="numeric" placeholder="DD" min="1" max="31" required></div>
<div><label>Birth month *</label><select data-field="month" required><option value="">Month</option>${months.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}</select></div>
<div><label>Birth year *</label><input data-field="year" type="number" inputmode="numeric" placeholder="YYYY" min="2008" max="2022" required></div>
<div><label>Gender *</label><select data-field="gender" required><option value="">Choose…</option><option>Male</option><option>Female</option></select></div>
<div><label>BJJ belt *</label><select data-field="belt" required><option value="">Enter birth date</option></select></div>
<div><label>Weight (kg) *</label><input data-field="weight" type="number" inputmode="decimal" step="0.1" min="10" max="300" placeholder="e.g. 38.5" required></div>
<div><label>Format *</label><select data-field="format"><option value="Both">Gi + No-Gi</option><option value="Gi">Gi only</option><option value="No-Gi">No-Gi only</option></select></div>
<div class="wide"><label>Preferred weight division (optional)</label><select data-field="division"><option value="">Enter birth date</option></select></div></div><div class="result kid-result" aria-live="polite">Enter date of birth to see division.</div>`;
 const f=name=>card.querySelector(`[data-field="${name}"]`);let currentType='';
 const compute=()=>{const d=validDate(+f('day').value,+f('month').value,+f('year').value),a=d?years(d):null,valid=a!==null&&a>=4&&a<=17&&d<=E;
 const type=valid?(a<16?'kids':'teens'):'';if(type!==currentType){currentType=type;replaceOptions(f('belt'),choices(valid?belts(a):[],valid?'Choose belt':'Enter birth date'));}
 weightOptions(valid?a:null,f('gender').value,f('division'));
 card.querySelector('.kid-result').textContent=valid?`Age ${a} · ${ageGroups(a)[0]}${f('belt').value?' · No-Gi '+skill(a,f('belt').value):''}${suggestion(a,f('gender').value,Number(f('weight').value))?' · Suggested '+suggestion(a,f('gender').value,Number(f('weight').value)):''}`:d?'Only ages 4–17 are supported in the kids list.':'Enter date of birth to see division.';};
 card.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',compute));card.querySelector('.remove-child').addEventListener('click',()=>{card.remove();if(!$('kidsList').children.length)makeKid();});$('kidsList').appendChild(card);compute();}
$('addChild').addEventListener('click',makeKid);makeKid();
$('sendKids').addEventListener('click',async()=>{message('bulkMessage','');if(!$('bulkConsent').checked){message('bulkMessage','Confirm you have parental permission first.','error');return;}
 const entries=[];const cards=[...$('kidsList').children];if(cards.length>40){message('bulkMessage','Send up to 40 kids in one batch.','error');return;}
 for(let i=0;i<cards.length;i++){const card=cards[i],f=name=>card.querySelector(`[data-field="${name}"]`);for(const el of card.querySelectorAll('input[required],select[required]')){if(!el.checkValidity()){el.reportValidity();message('bulkMessage',`Check child ${i+1}: required information is missing or invalid.`,'error');return;}}
 const d=validDate(+f('day').value,+f('month').value,+f('year').value),a=d?years(d):null;if(a===null||a<4||a>17){message('bulkMessage',`Check child ${i+1}: date of birth must give age 4–17 on event day.`,'error');return;}
 entries.push({...base,fullName:f('name').value.trim(),dob:d.toISOString().slice(0,10),ageOnEvent:a,gender:f('gender').value,belt:f('belt').value,weightKg:Number(f('weight').value),ageDivision:ageGroups(a)[0],weightDivision:f('division').value,format:f('format').value,absoluteGi:false,absoluteNoGi:false,guardianName:'',guardianConsent:true,dataConsent:true,source:'coach-bulk-v2'});
 }
 const button=$('sendKids');button.disabled=true;button.textContent='Sending…';try{await transmit({eventId:'32871',coachBulk:true,entries});$('kidsList').replaceChildren();makeKid();$('bulkConsent').checked=false;message('bulkMessage',`Request sent for ${entries.length} children. Check your private sheet for all rows before considering them received.`,'success');}catch(_){message('bulkMessage','Could not send the batch; please try again.','error');}finally{button.disabled=false;button.textContent='Send kids to coach';}
});
if(!C.appsScriptUrl||!Number.isFinite(E.getTime())){message('setupWarning','Configuration incomplete. Form submissions are unavailable.','error');$('setupWarning').hidden=false;$('submitButton').disabled=true;$('sendKids').disabled=true;}
update();updateFormats();
})();
