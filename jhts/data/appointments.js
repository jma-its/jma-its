/* Fictional appointments with real relational IDs. Dates are demo dates, not live medical schedules. */
const JHTS_DEPTS=['internal','orthopedics','dermatology','pediatrics','ophthalmology','ent'];
const JHTS_START = new Date();
JHTS_START.setDate(JHTS_START.getDate()+3);
const JHTS_DEMO_DATE = (extraDays)=>{const d=new Date(JHTS_START);d.setDate(d.getDate()+extraDays);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
window.JHTS_APPOINTMENTS = window.JHTS_PATIENTS.map((p,i)=>({
  id:'A-'+String(101+i), patientId:p.id,
  date: JHTS_DEMO_DATE(i<15?0:1),
  time: String(9+Math.floor((i%15)/3)).padStart(2,'0')+':'+['00','20','40'][i%3],
  dept:JHTS_DEPTS[i%JHTS_DEPTS.length], status:i%13===0?'cancelled':'scheduled'
}));

window.JHTS_DEMO_DATE=JHTS_DEMO_DATE;
