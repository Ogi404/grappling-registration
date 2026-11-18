(() => {
'use strict';
const C = window.REGISTRATION_CONFIG;
const $ = id => document.getElementById(id);
const form = $('registration');
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
monthNames.forEach((name,i) => $('birthMonth').add(new Option(name,String(i+1))));
const kidsBelts = ['White','Grey','Yellow','Orange','Green'];
const adultBelts = ['White','Blue','Purple','Brown','Black'];
const kidBrackets = [[4,5],[6,7],[8,9],[10,11],[12,13],[14,15],[16,17]];
const getFormat = () => document.querySelector('input[name="format"]:checked').value;
let age = null;
let minor = false;
let previousBeltType = '';
function birthDate() {
 const d = +$('birthDay').value, m = +$('birthMonth').value, y = +$('birthYear').value;
 if (!d || !m || !y || y < 1920 || y > 2100) return null;
 const dt = new Date(Date.UTC(y,m-1,d));
 if (dt.getUTCFullYear()!==y || dt.getUTCMonth()!==m-1 || dt.getUTCDate()!==d) return null;
 return dt;
}
function eventDate() {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(C.eventDate)) return null;
 const [y,m,d] = C.eventDate.split('-').map(Number);
 const dt = new Date(Date.UTC(y,m-1,d));
 return dt.getUTCFullYear()===y && dt.getUTCMonth()===m-1 && dt.getUTCDate()===d ? dt : null;
}
function yearsOld(dob,at) {
 let a=at.getUTCFullYear()-dob.getUTCFullYear();
 if (at.getUTCMonth()<dob.getUTCMonth() || (at.getUTCMonth()===dob.getUTCMonth() && at.getUTCDate()<dob.getUTCDate())) a--;
 return a;
}
function setOptions(el, items, value) {
 const old = value===undefined ? el.value : value;
 el.replaceChildren(...items.map(item => new Option(item.label,item.value)));
 if (items.some(item=>item.value===old)) el.value=old;
}
function warning(message,style='') {
 const el=$('formMessage'); el.hidden=!message; el.textContent=message; el.className='notice '+style;
}
function beltsUpdate() {
 const type=age===null?'':(age<18?'kid':'adult');
 if (type===previousBeltType) return;
 previousBeltType=type;
 const belts=type==='kid'?kidsBelts:type==='adult'?adultBelts:[];
 setOptions($('belt'),[{label:type?'Choose belt':'Enter date of birth first',value:''},...belts.map(x=>({label:x,value:x}))], '');
}
function updateAge() {
 const dob=birthDate(), at=eventDate(); age=dob&&at?yearsOld(dob,at):null;
 minor=age!==null && age<18;
 const active=age!==null && age>=4 && age<=100 && dob<=at;
 $('ageResult').textContent=!at?'Event date is not configured yet. Division calculation will work when the coach enters it.' : !dob?'Enter your full date of birth to calculate your division.' : !active?'No standard division can be suggested for this age. Please speak to your coach.' : `Age on competition day: ${age}. ${minor?'Kids / teens':'Adult'} competitor.`;
 beltsUpdate();
 const ageOptions=[{label:'Choose division',value:''}];
 if(active) {
  if(minor) {
   const group=kidBrackets.find(([lo,hi])=>age>=lo&&age<=hi);
   if(group) ageOptions.push({label:`Kids ${group[0]}–${group[1]} years`,value:`Kids ${group[0]}-${group[1]}`});
  } else {
   ageOptions.push({label:'Adult (18+)',value:'Adult'});
   if(age>=30) ageOptions.push({label:'Master (30+)',value:'Master'});
   if(age>=40 && $('gender').value==='Male') ageOptions.push({label:'Senior (40+)',value:'Senior'});
  }
 }
 const prev=$('ageDivision').value;
 setOptions($('ageDivision'),ageOptions,ageOptions.some(x=>x.value===prev)?prev:(ageOptions[1]?.value||''));
 $('guardianArea').hidden=!minor; $('guardianConsentArea').hidden=!minor;
 $('guardianName').required=minor;
 $('guardianConsent').required=minor;
 if(!minor) $('guardianConsent').checked=false;
 $('phoneLabel').textContent=minor?'Parent / guardian phone / WhatsApp':'Contact phone / WhatsApp';
 $('absoluteArea').hidden=!active||minor;
 if (minor) {$('absoluteGi').checked=false;$('absoluteNoGi').checked=false;}
 updateWeight(); updateFormats(); updateSkill();
}
function formatDisplay(n) {return n.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2});}
function updateWeight() {
 const old=$('weightDivision').value;
 const gender=$('gender').value;
 const classes=age===null?null:(minor?C.weightClassesKg.kids:(gender==='Female'?C.weightClassesKg.female:gender==='Male'?C.weightClassesKg.male:null));
 const opts=[{label:(!classes||!gender)?'Enter age and gender first':'Choose weight division',value:''}];
 if(classes&&gender) {
  classes.forEach(n=>opts.push({value:`Under ${formatDisplay(n)} kg`,label:`Under ${formatDisplay(n)} kg`}));
  opts.push({value:`Over ${formatDisplay(classes.at(-1))} kg`,label:`Over ${formatDisplay(classes.at(-1))} kg`});
 }
 const kg=parseFloat($('weight').value);
 let recommended='';
 if(Number.isFinite(kg)&&kg>0&&classes?.length) {
  const x=classes.find(n=>kg<=n);
  recommended=x===undefined?`Over ${formatDisplay(classes.at(-1))} kg`:`Under ${formatDisplay(x)} kg`;
 }
 setOptions($('weightDivision'),opts,old&&opts.some(x=>x.value===old)?old:'');
 $('weightHint').textContent=(C.eventDivisionsVerified?'':'PROVISIONAL classes converted into kg — exact event classes NOT verified. ') + (recommended?`Possible class: ${recommended}. `:'') + 'Optional: leave blank and your coach will choose the official class.';
}
function updateFormats() {
 const f=getFormat();
 $('absoluteGi').disabled=f==='No-Gi'; $('absoluteNoGi').disabled=f==='Gi';
 if(f==='No-Gi') $('absoluteGi').checked=false;
 if(f==='Gi') $('absoluteNoGi').checked=false;
}
function updateSkill() {
 const b=$('belt').value; if(!b){$('skillResult').textContent='';return;}
 let skill='';
 if(minor) skill=({White:'Beginner',Grey:'Intermediate',Yellow:'Advanced',Orange:'Advanced',Green:'Expert'})[b];
 else skill=({White:'Beginner',Blue:'Intermediate',Purple:'Advanced',Brown:'Advanced',Black:'Advanced'})[b];
 $('skillResult').textContent=`Suggested No-Gi skill category: ${skill}. Your coach can review or adjust this.`;
}
['birthDay','birthMonth','birthYear','gender'].forEach(id=>$(id).addEventListener('input',updateAge));
$('weight').addEventListener('input',updateWeight);$('belt').addEventListener('change',updateSkill);
document.querySelectorAll('input[name="format"]').forEach(el=>el.addEventListener('change',updateFormats));
const missing=[];
if(!eventDate()) missing.push('competition date');
if(!C.appsScriptUrl) missing.push('Google Sheets endpoint');
// Unverified classes do not block a gym interest list; the coach will finalize divisions.
if(missing.length) {
 $('setupWarning').hidden=false;
 $('setupWarning').textContent=`Setup required before sharing: ${missing.join(', ')}. This preview cannot submit registrations yet.`;
}
form.addEventListener('submit',async event=>{
 event.preventDefault(); warning('');
 if(missing.length){warning('Coach setup is incomplete. This preview cannot collect registrations.','error');return;}
 const dob=birthDate(), at=eventDate();
 if(!dob||!at||age===null||age<4||age>100){warning('Enter a valid birth date for an eligible competitor.','error');return;}
 if(!form.checkValidity()||!$('ageDivision').value){form.reportValidity();warning('Please complete all required fields.','error');return;}
 if(minor&&!$('guardianConsent').checked){warning('Parent/guardian acknowledgement is required for children.','error');return;}
 const submit=$('submitButton');submit.disabled=true;submit.textContent='Sending…';
 const payload={
  eventId:'32871',eventName:C.eventName,
  fullName:$('fullName').value.trim(),dob:dob.toISOString().slice(0,10),ageOnEvent:age,
  gender:$('gender').value,belt:$('belt').value,weightKg:Number($('weight').value),
  ageDivision:$('ageDivision').value,weightDivision:$('weightDivision').value,
  format:getFormat(),absoluteGi:$('absoluteGi').checked,absoluteNoGi:$('absoluteNoGi').checked,
  guardianName:minor?$('guardianName').value.trim():'',phone:$('phone').value.trim(),guardianConsent:minor?$('guardianConsent').checked:false,
  dataConsent:$('dataConsent').checked,source:'gym-form-v1'
 };
 if(!payload.fullName||!payload.phone||!payload.dataConsent){warning('Name, contact and consent are required.','error');submit.disabled=false;submit.textContent='Send to coach';return;}
 try {
  // Apps Script ContentService redirects lack CORS response headers. Opaque POST permits delivery,
  // but the browser cannot verify the server's success. Never claim confirmed storage.
  await fetch(C.appsScriptUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
  form.reset();updateAge();updateWeight();
  warning('Submission request sent. Ask your coach to confirm that your entry appears on the team list. This is not official Smoothcomp registration.','success');
  $('formMessage').scrollIntoView({behavior:'smooth',block:'center'});
 } catch(err) {warning('Could not send your details. Check your connection and try again, or contact your coach.','error');}
 finally{submit.disabled=false;submit.textContent='Send to coach';}
});
updateAge();
})();
