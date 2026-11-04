/* Synthetic insurance verification records. This is NOT connected to Japan's online eligibility service. */
window.JHTS_INSURANCE = window.JHTS_PATIENTS.map((p,i)=>({
  id:'INS-'+String(i+1).padStart(3,'0'), patientId:p.id,
  document: i%4===0?'certificate':'myna',
  status: i%9===0?'needs_review':i%11===0?'expired':i%13===0?'unverified':'verified',
  checkedOn: i%9===0?'': new Date().toLocaleDateString('sv-SE')
}));
