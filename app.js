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
const kgLabel=(n,over=false)=>(over?'Over ':'Under ')+'~'+Math.round(n)+' kg';
const choices=(list,placeholder)=>[{label:placeholder,value:''},...list.map(v=>({label:v,value:v}))];
function replaceOptions(el,opts,fallback=''){const current=el.value;el.replaceChildren(...opts.map(o=>new Option(o.label,o.value)));el.value=opts.some(o=>o.value===current)?current:fallback;}
function weightOptions(age,gender,el){if(age===null||!gender){replaceOptions(el,choices([], 'Enter age and gender first'));return;}const vals=classes(age,gender);replaceOptions(el,choices([...vals.map(n=>kgLabel(n)),kgLabel(vals.at(-1),true)],'Choose weight division'));}
function suggestion(age,gender,w){if(age===null||!gender||!Number.isFinite(w)||w<=0)return '';const vals=classes(age,gender);const n=vals.find(n=>w<=n);return n===undefined?kgLabel(vals.at(-1),true):kgLabel(n);}
function skill(age,belt){if(!belt)return '';if(age<16)return ({White:'Beginner',Grey:'Intermediate',Yellow:'Advanced',Orange:'Advanced',Green:'Expert'})[belt];if(age<18)return ({White:'Beginner',Blue:'Advanced'})[belt];return ({White:'Beginner',Blue:'Intermediate',Purple:'Advanced',Brown:'Advanced',Black:'Advanced'})[belt];}
function message(id,text,kind=''){const el=$(id);el.hidden=!text;el.className='notice '+kind;el.textContent=text;}
const dob=()=>validDate(+$('birthDay').value,+$('birthMonth').value,+$('birthYear').value);
let age=null,prevBeltType='';
function update(){const d=dob();age=d?years(d):null;const minor=age!==null&&age<18;const valid=age!==null&&age>=4&&age<=100&&d<=E;
 const type=age===null?'':age<16?'kids':age<18?'teens':'adults';if(type!==prevBeltType){prevBeltType=type;replaceOptions($('belt'),choices(type?belts(age):[],type?'Choose belt':'Enter birth date first'));}
 replaceOptions($('ageDivision'),choices(valid?ageGroups(age):[],'Choose age division'),valid?ageGroups(age)[0]:'');
 $('guardianArea').hidden=!minor;$('guardianConsentArea').hidden=!minor;$('guardianName').required=minor;$('guardianConsent').required=minor;
 if(!minor)$('guardianConsent').checked=false;
 $('absoluteArea').hidden=!valid||minor;if(minor){$('absoluteGi').checked=false;$('absoluteNoGi').checked=false;}
 weightOptions(age,$('gender').value,$('weightDivision'));updateWeight();updateSkill();
}
function updateWeight(){const s=suggestion(age,$('gender').value,Number($('weight').value));$('weightHint').textContent=(s?`Suggested: ${s}. `:'')+'Rounded kg approximations for gym planning. Official weigh-in limits apply with no allowance.';}
function updateSkill(){$('skillResult').textContent=age!==null&&$('belt').value?`Suggested No-Gi skill: ${skill(age,$('belt').value)}.`:'';}
function updateFormats(){const f=document.querySelector('input[name="format"]:checked').value;$('absoluteGi').disabled=f==='No-Gi';$('absoluteNoGi').disabled=f==='Gi';if(f==='No-Gi')$('absoluteGi').checked=false;if(f==='Gi')$('absoluteNoGi').checked=false;}
['birthDay','birthMonth','birthYear','gender'].forEach(id=>$(id).addEventListener('input',update));$('weight').addEventListener('input',updateWeight);$('belt').addEventListener('change',updateSkill);document.querySelectorAll('input[name="format"]').forEach(e=>e.addEventListener('change',updateFormats));
const base={eventId:'32871',eventName:C.eventName};
async function transmit(payload){await fetch(C.appsScriptUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});}
form.addEventListener('submit',async ev=>{ev.preventDefault();message('formMessage','');const d=dob();if(!d||age===null||age<4||age>100){message('formMessage','Enter a valid date of birth.','error');return;}
 if(!form.checkValidity()||!$('ageDivision').value){form.reportValidity();message('formMessage','Please complete all required fields.','error');return;}
 if(age<18&&!$('guardianConsent').checked){message('formMessage','Parent/guardian permission is required.','error');return;}
 const payload={...base,fullName:$('fullName').value.trim(),dob:d.toISOString().slice(0,10),ageOnEvent:age,gender:$('gender').value,belt:$('belt').value,weightKg:Number($('weight').value),ageDivision:$('ageDivision').value,weightDivision:$('weightDivision').value,format:document.querySelector('input[name="format"]:checked').value,absoluteGi:$('absoluteGi').checked,absoluteNoGi:$('absoluteNoGi').checked,guardianName:age<18?$('guardianName').value.trim():'',guardianConsent:age<18?$('guardianConsent').checked:false,dataConsent:$('dataConsent').checked,source:'gym-form-v2',clientEntryId:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)};
 const button=$('submitButton');button.disabled=true;button.textContent='Sending…';try{await transmit(payload);message('formMessage','Complete','success');}catch(_){message('formMessage','Could not send. Please try again.','error');}finally{button.disabled=false;button.textContent='Send to coach';}
});
if(!C.appsScriptUrl||!Number.isFinite(E.getTime())){message('setupWarning','Configuration incomplete. Form submissions are unavailable.','error');$('setupWarning').hidden=false;$('submitButton').disabled=true;}
update();updateFormats();
})();
