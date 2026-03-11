import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED PALETTE & GLOBAL SCORE STORE
// ═══════════════════════════════════════════════════════════════════════════════
const C = {
  bg:"#fdf2f8", bgCard:"#ffffff", bgSoft:"#fce7f3", bgDeep:"#fdf4ff",
  border:"#fbcfe8", borderSoft:"#f9a8d4",
  pink:"#db2777", pinkL:"#f472b6", pinkXL:"#fce7f3",
  teal:"#0e7490", tealL:"#22d3ee",
  violet:"#7c3aed", violetL:"#c084fc",
  gold:"#d97706", goldL:"#fbbf24",
  green:"#059669", greenL:"#6ee7b7",
  red:"#dc2626", redL:"#fca5a5",
  orange:"#ea580c", orangeL:"#fb923c",
  text:"#1e1b2e", textMd:"#4a3f5c", textSm:"#9580a8",
  phoneBg:"#1a1a2e",
};

// Global combined leaderboard — persists for the session across all modules
let GLOBAL_SCORES = [];
function addGlobalScore(name, moduleId, moduleName, score, detail) {
  GLOBAL_SCORES = [
    ...GLOBAL_SCORES,
    { name, moduleId, moduleName, score, detail,
      date: new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) }
  ].sort((a,b) => b.score - a.score).slice(0, 30);
}

// Per-module score stores
const MODULE_STORES = { 1:[], 2:[], 3:[], 4:[] };
function addModuleScore(moduleId, entry) {
  MODULE_STORES[moduleId] = [...MODULE_STORES[moduleId], entry]
    .sort((a,b) => b.score - a.score).slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED CSS UTILITIES (injected once at root level)
// ═══════════════════════════════════════════════════════════════════════════════
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&family=Share+Tech+Mono&family=Roboto+Mono:wght@400;600;700&display=swap');
  *{box-sizing:border-box;}
  body{margin:0;background:#fdf2f8;}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes slideIn{from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes popIn{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
  @keyframes notifPop{0%{transform:translateY(-10px) scale(.95);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes barGrow{from{width:0}to{width:var(--w)}}
  .shimmer{background:linear-gradient(90deg,#db2777,#7c3aed,#0e7490,#db2777);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite;}
  .card{background:#fff;border:1.5px solid #fbcfe8;border-radius:20px;padding:22px;box-shadow:0 2px 20px rgba(219,39,119,.07);}
  .chip{background:#fff;border:1.5px solid #fbcfe8;border-radius:14px;padding:8px 16px;text-align:center;box-shadow:0 2px 10px rgba(219,39,119,.06);}
  .pill{display:flex;align-items:center;gap:8px;background:#fce7f3;border:1.5px solid #fbcfe8;border-radius:50px;padding:7px 14px;}
  .btn-main{background:linear-gradient(135deg,#db2777,#7c3aed);border:none;color:#fff;cursor:pointer;padding:14px 36px;border-radius:50px;font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;letter-spacing:.5px;transition:all .25s;box-shadow:0 6px 22px rgba(219,39,119,.35);}
  .btn-main:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(219,39,119,.5);}
  .btn-out{background:transparent;border:2px solid #db2777;color:#db2777;cursor:pointer;padding:12px 28px;border-radius:50px;font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;transition:all .2s;}
  .btn-out:hover{background:#db2777;color:#fff;transform:translateY(-1px);}
  .btn-next{background:linear-gradient(135deg,#0e7490,#7c3aed);border:none;color:#fff;cursor:pointer;padding:12px 28px;border-radius:50px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;transition:all .2s;box-shadow:0 4px 14px rgba(14,116,144,.3);}
  .btn-next:hover{transform:translateY(-1px);}
  .btn-exit{background:rgba(255,255,255,.9);border:1.5px solid #fbcfe8;color:#9580a8;cursor:pointer;padding:8px 18px;border-radius:50px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;transition:all .2s;}
  .btn-exit:hover{border-color:#db2777;color:#db2777;}
  .inp{background:#fff;border:2px solid #fbcfe8;border-radius:14px;padding:13px 18px;font-family:'Nunito',sans-serif;font-size:15px;color:#1e1b2e;width:100%;transition:border .2s;outline:none;}
  .inp:focus{border-color:#db2777;box-shadow:0 0 0 3px rgba(219,39,119,.14);}
  .score-row{display:flex;align-items:center;gap:12px;border-radius:12px;padding:10px 14px;}
  .score-row:nth-child(odd){background:#fce7f3;}
  .pwd-inp{background:#fdf4ff;border:2px solid #fbcfe8;border-radius:16px;padding:16px 56px 16px 20px;font-family:'Share Tech Mono',monospace;font-size:18px;color:#1e1b2e;width:100%;transition:all .25s;outline:none;letter-spacing:2px;}
  .pwd-inp:focus{border-color:#db2777;box-shadow:0 0 0 4px rgba(219,39,119,.14);background:#fff;}
  .req-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;transition:all .3s;}
  .req-dot.met{background:#059669;}
  .req-dot.unmet{background:#fbcfe8;}
  .challenge-card{background:#fff;border:1.5px solid #fbcfe8;border-radius:16px;padding:18px 20px;transition:all .3s;}
  .challenge-card.done{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#86efac;}
  .challenge-card.active{border-color:#db2777;box-shadow:0 0 0 3px rgba(219,39,119,.12);}
  .flag-item{animation:fadeUp .3s ease forwards;opacity:0;}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// BG PARTICLES (shared component)
// ═══════════════════════════════════════════════════════════════════════════════
function BgParticles({ dots }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-140,right:-140,width:460,height:460,borderRadius:"50%",background:`radial-gradient(circle,${C.pinkL}1c,transparent 70%)`}}/>
      <div style={{position:"absolute",bottom:-100,left:-100,width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,${C.tealL}18,transparent 70%)`}}/>
      <div style={{position:"absolute",top:"40%",left:"42%",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${C.violetL}14,transparent 70%)`}}/>
      {dots.map(d=>(
        <div key={d.id} style={{position:"absolute",left:`${d.x}%`,top:`${d.y}%`,width:d.r*2,height:d.r*2,borderRadius:"50%",background:d.c,opacity:.28,animation:`float ${d.dur}s ease-in-out ${d.del}s infinite`}}/>
      ))}
    </div>
  );
}

// Branding bar
function BrandBar() {
  return (
    <div style={{display:"flex",justifyContent:"center",marginBottom:28}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:50,padding:"8px 22px",boxShadow:`0 2px 14px rgba(219,39,119,.1)`}}>
        <span style={{fontSize:18}}>💜</span>
        <span style={{fontSize:12,fontWeight:800,color:C.textMd}}>Girls in ICT Day · ITU</span>
        <span style={{width:1,height:16,background:C.border,display:"inline-block"}}/>
        <span style={{fontSize:12,fontWeight:800,color:C.teal}}>DICT Region IV-A</span>
      </div>
    </div>
  );
}

// Medal row
function ScoreRow({ s, i, playerName, detail }) {
  return (
    <div className="score-row" style={{background:s.name===playerName?C.pinkXL:i%2===0?C.bgSoft:"#fff"}}>
      <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,flexShrink:0,
        background:i===0?`linear-gradient(135deg,#f59e0b,#d97706)`:i===1?`linear-gradient(135deg,#9ca3af,#6b7280)`:i===2?`linear-gradient(135deg,#b45309,#92400e)`:C.bgSoft,
        color:i<3?"#fff":C.textSm}}>
        {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:s.name===playerName?900:700,fontSize:14,color:s.name===playerName?C.pink:C.text}}>
          {s.name}{s.name===playerName?" 👈":""}
        </div>
        <div style={{fontSize:11,color:C.textSm}}>{s.date}{detail ? ` · ${detail(s)}` : ""}</div>
      </div>
      <div style={{fontWeight:900,fontSize:18,color:C.pink}}>{s.score.toLocaleString()}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — PHISHGUARD
// ═══════════════════════════════════════════════════════════════════════════════
const PH_LEVELS = [
  { id:1, difficulty:"Rookie", color:"#f472b6", xp:50, description:"Obvious scams with glaring red flags",
    scenarios:[
      { type:"email", from:"Nigerian.Prince@hotmail.com", subject:"YOU HAVE WON $5,000,000 DOLLARS!!!", isPhishing:true,
        body:`Dear Beloved Friend,\n\nI am Prince Adebayo of Nigeria. My father the king has died and left me $47,000,000 but I cannot access it without YOUR HELP!!!\n\nI need you to send $500 to unlock the funds. You will receive $5,000,000 in return. This is 100% REAL and LEGAL.\n\nPlease send your bank details, SSN, and $500 Western Union to:\nPO Box 1234, Lagos\n\nGOD BLESS YOU,\nPrince Adebayo`,
        redFlags:["Unsolicited email from a stranger promising huge money","Requesting $500 upfront — classic advance-fee fraud","Hotmail address for a 'prince'","Asking for SSN and bank details"],
        lesson:"Advance-fee fraud (419 scam) promises large rewards in exchange for a small upfront payment. Legitimate windfalls never require you to pay money first." },
      { type:"email", from:"support@paypa1.com", subject:"Your account has been limited - Act Now!", isPhishing:true,
        body:`Dear Customer,\n\nWe have detected unusual activity on your PayPal account. Your account has been TEMPORARILY LIMITED.\n\nTo restore access click the link below IMMEDIATELY:\nhttp://paypa1.support-login.xyz/verify\n\nYou must verify within 24 HOURS or your account will be permanently closed.\n\nPayPal Security Team`,
        redFlags:["Sender domain is 'paypa1.com' — not 'paypal.com' (letter 'l' replaced with '1')","Link goes to 'paypa1.support-login.xyz' — not paypal.com","Urgent 24-hour deadline creates panic","No personalization — uses 'Dear Customer'"],
        lesson:"Domain spoofing replaces letters with lookalikes (l→1, o→0). Always hover over links before clicking and check the real sender domain carefully." },
      { type:"email", from:"noreply@amazon.com", subject:"Your Amazon order #114-2847591 has shipped", isPhishing:false, redFlags:[],
        body:`Hello Jane,\n\nYour order has shipped!\n\nOrder #114-2847591\nItem: Sony WH-1000XM5 Headphones\nEstimated delivery: Thursday, March 14\n\nTrack your package: amazon.com/track/114-2847591\n\nThanks for shopping with Amazon.`,
        lesson:"This is a legitimate shipping confirmation. It uses your real name, links only to amazon.com, and doesn't ask for sensitive information." },
    ]},
  { id:2, difficulty:"Cadet", color:"#c084fc", xp:100, description:"More convincing fakes — look closely",
    scenarios:[
      { type:"email", from:"security@accounts-google.com", subject:"Critical security alert for your Google Account", isPhishing:true,
        body:`Hi,\n\nWe detected a new sign-in to your Google Account from:\nDevice: Windows PC\nLocation: Kyiv, Ukraine\nTime: March 11, 2026 at 3:42 AM\n\nIf you didn't sign in, secure your account immediately:\n→ Review activity: accounts-google.com/security/review\n\nThe Google Accounts Team`,
        redFlags:["Sender domain is 'accounts-google.com' — NOT 'google.com'. Real Google emails come from @google.com","Link goes to 'accounts-google.com' — a fake domain","No account username mentioned"],
        lesson:"Phishers register convincing domains like 'accounts-google.com'. Legitimate companies' emails always come from their official domain." },
      { type:"sms", from:"+1 (800) 935-9935",
        body:`USPS: Your package could not be delivered due to an incomplete address. Update your delivery preferences at: usps-deliveryupdate.com/track?id=9400111899223397978 Reply STOP to opt out.`,
        isPhishing:true, redFlags:["URL is 'usps-deliveryupdate.com' — not 'usps.com'","USPS never sends texts asking you to visit external sites","'Reply STOP' mimics legitimate opt-outs to seem real"],
        lesson:"Package delivery scams ('smishing') are extremely common. The real USPS website is usps.com. Never click — go directly to the official site." },
      { type:"email", from:"no-reply@github.com", subject:"Your GitHub account: new SSH key added", isPhishing:false, redFlags:[],
        body:`Hi devuser,\n\nA new public SSH key was added to your GitHub account.\n\nKey fingerprint: SHA256:uNiVztksCsDhcc0u9e8BujQXVUpKZIDTMczCvj3tD2s\n\nIf you did NOT add this key, remove it immediately: github.com/settings/keys\n\nGitHub Security`,
        lesson:"This is a legitimate GitHub security notification from @github.com. It asks you to act only if you didn't perform the action — no urgency, no credential harvesting." },
    ]},
  { id:3, difficulty:"Analyst", color:"#22d3ee", xp:150, description:"Sophisticated attacks targeting professionals",
    scenarios:[
      { type:"email", from:"hr@yourcompany-benefits.com", subject:"2026 Open Enrollment — Action Required by Friday", isPhishing:true,
        body:`Hi Team,\n\nOpen enrollment for 2026 benefits closes this Friday, March 14.\n\nIf you don't make your selections, you'll be auto-enrolled in last year's plan. New this year: HSA contribution limits increased to $4,300.\n\nLog in to update your selections:\n→ yourcompany-benefits.com/enroll2026\n\nHuman Resources\nYourCompany`,
        redFlags:["Email is from 'yourcompany-benefits.com' — NOT your actual company domain","Deadline pressure designed to rush action","Login link harvests credentials on the fake domain","Correct-sounding details (HSA limits) build false credibility"],
        lesson:"Spear phishing uses company-specific context to seem legitimate. Always verify HR emails come from your actual company domain." },
      { type:"email", from:"docusign@docusign.net", subject:"Sarah Chen has sent you a document to review and sign", isPhishing:false, redFlags:[],
        body:`DocuSign\n\nSarah Chen (s.chen@partnerfirm.com) has sent you a document.\n\nDOCUMENT: Q1 2026 Partnership Agreement — Final\n\nPlease review and sign by: March 13, 2026\n\n→ REVIEW DOCUMENT\n\nThis message was sent to you by DocuSign. Questions? Visit docusign.com/contact`,
        lesson:"This appears to be a legitimate DocuSign notification from @docusign.net. To be safest, log in directly to docusign.com rather than clicking the link." },
      { type:"email", from:"billing@microsoft365-invoice.com", subject:"Invoice #INV-2026-03114: Microsoft 365 Business — $1,847.00", isPhishing:true,
        body:`Microsoft 365 Business Invoice\n\nInvoice #: INV-2026-03114\nDate: March 11, 2026\nAmount Due: $1,847.00\nDue Date: March 18, 2026\n\nIf you did not authorize this charge:\n→ Cancel subscription: microsoft365-invoice.com/cancel\n\nMicrosoft Billing`,
        redFlags:["Sender domain is 'microsoft365-invoice.com' — NOT microsoft.com","Large unexpected charge designed to trigger panic","Cancellation link goes to the fake domain"],
        lesson:"Billing panic attacks create urgency with a surprising charge. Microsoft billing emails ONLY come from @microsoft.com." },
    ]},
  { id:4, difficulty:"Expert", color:"#fb923c", xp:200, description:"Near-perfect fakes — extreme detail needed",
    scenarios:[
      { type:"email", from:"security-noreply@apple.com", subject:"Your Apple ID was used to sign in to iCloud on a new device", isPhishing:false, redFlags:[],
        body:`Your Apple ID (j.smith@email.com) was used to sign in to iCloud via a web browser.\n\nDate and Time: March 11, 2026 at 9:14 AM PST\nBrowser: Chrome\nLocation: Chicago, IL\n\nIf you recently signed in, you can disregard this email.\n\nIf you did not sign in:\n→ appleid.apple.com\n\nApple Support`,
        lesson:"This is a legitimate Apple security notification from @apple.com that links only to apple.com subdomains. Concise, non-urgent, no credential harvesting." },
      { type:"email", from:"notifications@linkedln.com", subject:"You appeared in 14 searches this week", isPhishing:true,
        body:`LinkedIn\n\nHi Alex,\n\nYou appeared in 14 searches this week.\n› 3 people from Fortune 500 companies viewed your profile\n\nSee all your viewers:\nlinkedln.com/in/alex/viewers\n\nThe LinkedIn Team`,
        redFlags:["Sender uses 'linkedln.com' — NOT 'linkedin.com'. The 'i' and 'n' are swapped to 'ln'","Extremely subtle typosquat — nearly invisible at a glance","Entices clicks with flattering profile view stats"],
        lesson:"'linkedln.com' vs 'linkedin.com' — just two transposed letters. Expert attackers register near-identical domains. Check domain names character by character." },
      { type:"sms", from:"Chase Bank",
        body:`Chase: Unusual activity detected on your account ending in 4821. A $2,340 transfer was initiated. If not you, call us: 1-800-935-9935 or reply FREEZE to block.`,
        isPhishing:true, redFlags:["Real Chase fraud alerts never ask you to 'reply FREEZE'","SMS sender names are trivially spoofed","Designed to create panic with a large transfer amount"],
        lesson:"SMS sender names are completely spoofable. Real banks will NEVER ask you to reply with commands. Call the number on the back of your card." },
    ]},
];

const PH_BADGES = [
  { score:50, name:"First Steps", icon:"🌱", desc:"Started your security journey" },
  { score:150, name:"Skeptic", icon:"🔍", desc:"Developing a suspicious eye" },
  { score:300, name:"Red Flag Spotter", icon:"🚩", desc:"Catching obvious phish" },
  { score:500, name:"Security Aware", icon:"🛡️", desc:"Above-average phishing defense" },
  { score:750, name:"Cyber Guardian", icon:"⚔️", desc:"Protecting yourself and others" },
  { score:1000, name:"Phish Hunter", icon:"🎯", desc:"Elite threat detector" },
];

function PhishGuard({ playerName, onComplete, onExit }) {
  const [screen, setScreen] = useState("game");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [score, setScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [newBadge, setNewBadge] = useState(null);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [lives, setLives] = useState(3);
  const [levelResults, setLevelResults] = useState([]);

  const level = PH_LEVELS[currentLevel];
  const scenario = level?.scenarios[currentScenario];
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  function tryBadges(ns, current) {
    let updated = [...current]; let toast = null;
    for (const b of PH_BADGES) {
      if (ns >= b.score && !updated.find(e => e.name === b.name)) { updated.push(b); toast = b; }
    }
    return { updated, toast };
  }

  function handleAnswer(choice) {
    if (showResult) return;
    const isCorrect = (choice === "phishing") === scenario.isPhishing;
    setCorrect(isCorrect); setShowResult(true); setTotalAnswered(p => p + 1);
    if (isCorrect) {
      const ns2 = streak + 1; if (ns2 > maxStreak) setMaxStreak(ns2); setStreak(ns2);
      setTotalCorrect(p => p + 1);
      const pts = level.xp + Math.min(streak, 4) * 10;
      const ns = score + pts; setScore(ns); setLevelScore(p => p + pts);
      const { updated, toast } = tryBadges(ns, earnedBadges);
      setEarnedBadges(updated);
      if (toast) { setNewBadge(toast); setTimeout(() => setNewBadge(null), 3500); }
      setLevelResults(p => [...p, { correct: true, pts }]);
    } else {
      setStreak(0); setLives(p => p - 1); setLevelResults(p => [...p, { correct: false, pts: 0 }]);
    }
  }

  function nextScenario() {
    setShowResult(false); setCorrect(null);
    const outOfLives = !correct && lives <= 1;
    const lastScenario = currentScenario + 1 >= level.scenarios.length;
    if (outOfLives || lastScenario) setScreen("levelComplete");
    else setCurrentScenario(p => p + 1);
  }

  function nextLevel() {
    if (currentLevel + 1 >= PH_LEVELS.length) {
      addModuleScore(1, { name: playerName, score, accuracy, date: new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) });
      addGlobalScore(playerName, 1, "PhishGuard", score, s => `${s.accuracy}% accuracy`);
      onComplete(score);
    } else {
      setCurrentLevel(p => p + 1); setCurrentScenario(0);
      setLevelScore(0); setLevelResults([]); setLives(3); setScreen("game");
    }
  }

  if (screen === "levelComplete") return (
    <div style={{position:"relative",zIndex:1,maxWidth:560,margin:"0 auto",padding:"60px 20px",textAlign:"center"}}>
      <button className="btn-exit" style={{position:"fixed",top:16,left:16,zIndex:50}} onClick={onExit}>← Hub</button>
      <div style={{fontSize:60,marginBottom:14,animation:"popIn .4s ease"}}>{levelResults.filter(r=>r.correct).length >= level.scenarios.length*.6?"🎯":"📖"}</div>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:3,color:level.color,marginBottom:10}}>LEVEL {level.id} COMPLETE</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:32,margin:"0 0 6px",color:C.text}}>{level.difficulty}</h2>
      <div style={{color:C.textSm,marginBottom:28}}>{levelResults.filter(r=>r.correct).length} / {levelResults.length} correct</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
        {[{label:"LEVEL XP",val:levelScore,c:C.pink},{label:"TOTAL SCORE",val:score.toLocaleString(),c:C.teal},{label:"ACCURACY",val:`${accuracy}%`,c:accuracy>=80?C.green:accuracy>=60?C.gold:C.red}].map((s,i)=>(
          <div key={i} className="chip"><div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.val}</div><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:1}}>{s.label}</div></div>
        ))}
      </div>
      {earnedBadges.length > 0 && (
        <div className="card" style={{marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:C.textSm,marginBottom:12}}>BADGES EARNED</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {earnedBadges.map((b,i)=>(<div key={i} className="pill">{b.icon}<span style={{fontSize:12,fontWeight:700}}>{b.name}</span></div>))}
          </div>
        </div>
      )}
      <button className="btn-main" onClick={nextLevel}>
        {currentLevel + 1 >= PH_LEVELS.length ? "See Final Results →" : `Level ${currentLevel+2}: ${PH_LEVELS[currentLevel+1]?.difficulty} →`}
      </button>
    </div>
  );

  if (!scenario) return null;
  return (
    <div style={{position:"relative",zIndex:1,maxWidth:840,margin:"0 auto",padding:"20px 16px 40px"}}>
      <button className="btn-exit" style={{position:"fixed",top:16,left:16,zIndex:50}} onClick={onExit}>← Hub</button>
      {newBadge && (
        <div style={{position:"fixed",top:20,right:20,zIndex:300,background:"#fff",border:`2px solid ${C.goldL}`,borderRadius:18,padding:"14px 20px",boxShadow:`0 8px 36px rgba(217,119,6,.28)`,animation:"slideIn .4s ease",maxWidth:270}}>
          <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:4}}>🏆 BADGE UNLOCKED</div>
          <div style={{fontSize:18,fontWeight:900}}>{newBadge.icon} {newBadge.name}</div>
        </div>
      )}
      {/* HUD */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div className="chip" style={{borderColor:`${level.color}55`}}><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>LEVEL</div><div style={{fontSize:14,fontWeight:900,color:level.color}}>{level.difficulty}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>SCORE</div><div style={{fontSize:14,fontWeight:900,color:C.pink}}>{score.toLocaleString()}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>STREAK</div><div style={{fontSize:14,fontWeight:900,color:C.gold}}>{streak>0?`🔥 ${streak}`:"—"}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>LIVES</div><div style={{fontSize:15}}>{"❤️".repeat(lives)}{"🤍".repeat(3-lives)}</div></div>
        <div style={{flex:1,textAlign:"right",fontSize:13,fontWeight:700,color:C.textSm}}>{playerName} · {currentScenario+1}/{level.scenarios.length}</div>
      </div>
      <div style={{height:5,background:C.bgSoft,borderRadius:5,marginBottom:20,overflow:"hidden"}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${C.pink},${C.violet})`,borderRadius:5,width:`${((currentScenario+(showResult?1:0))/level.scenarios.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:3,color:C.textSm,marginBottom:8}}>ANALYZE THIS {scenario.type==="sms"?"TEXT MESSAGE":"EMAIL"} ▼</div>
      {/* Message card */}
      <div style={{background:"#fff",border:`1.5px solid ${showResult?(correct?C.greenL+"88":C.redL+"88"):C.border}`,borderRadius:20,overflow:"hidden",marginBottom:18,boxShadow:showResult?(correct?`0 4px 28px rgba(5,150,105,.14)`:`0 4px 28px rgba(220,38,38,.14)`):`0 2px 18px rgba(219,39,119,.08)`,transition:"all .3s"}}>
        {scenario.type==="email"?(
          <>
            <div style={{background:C.bgSoft,padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                <div style={{width:11,height:11,borderRadius:"50%",background:"#ef4444"}}/><div style={{width:11,height:11,borderRadius:"50%",background:"#facc15"}}/><div style={{width:11,height:11,borderRadius:"50%",background:"#4ade80"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"64px 1fr",gap:"5px 0",fontSize:13}}>
                <span style={{color:C.textSm,fontWeight:600}}>From:</span><span style={{color:C.pink,fontWeight:900}}>{scenario.from}</span>
                <span style={{color:C.textSm,fontWeight:600}}>Subject:</span><span style={{color:C.text,fontWeight:700}}>{scenario.subject}</span>
              </div>
            </div>
            <div style={{padding:"20px 24px",whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.8,color:C.textMd}}>{scenario.body}</div>
          </>
        ):(
          <div style={{padding:24}}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{background:C.bgSoft,borderRadius:"50%",width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📱</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:900,color:C.pink,marginBottom:10}}>{scenario.from}</div>
                <div style={{background:C.bgSoft,border:`1px solid ${C.border}`,borderRadius:"4px 18px 18px 18px",padding:"13px 18px",fontSize:14,color:C.textMd,lineHeight:1.7,maxWidth:520}}>{scenario.body}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {!showResult && (
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
          <button style={{background:`linear-gradient(135deg,${C.red},#b91c1c)`,border:`2px solid ${C.redL}`,color:"#fff",cursor:"pointer",padding:"13px 28px",borderRadius:50,fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:800,transition:"all .2s",boxShadow:`0 4px 14px rgba(220,38,38,.25)`}} onClick={()=>handleAnswer("phishing")}>⚠️ Phishing Attempt</button>
          <button style={{background:`linear-gradient(135deg,${C.green},#047857)`,border:`2px solid ${C.greenL}`,color:"#fff",cursor:"pointer",padding:"13px 28px",borderRadius:50,fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:800,transition:"all .2s",boxShadow:`0 4px 14px rgba(5,150,105,.25)`}} onClick={()=>handleAnswer("legit")}>✓ Looks Legitimate</button>
        </div>
      )}
      {showResult && (
        <div style={{background:correct?"rgba(236,253,245,.95)":"rgba(254,242,242,.95)",border:`1.5px solid ${correct?C.greenL:C.redL}`,borderRadius:20,padding:"20px 22px",marginBottom:18,animation:"fadeUp .3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <span style={{fontSize:34}}>{correct?"✅":"❌"}</span>
            <div>
              <div style={{fontSize:17,fontWeight:900,color:correct?C.green:C.red}}>{correct?"Correct! Well spotted.":"Oops — incorrect!"}</div>
              <div style={{fontSize:12,color:C.textSm}}>{scenario.isPhishing?"This WAS a phishing attempt.":"This was a legitimate message."}{correct&&streak>1&&<span style={{color:C.gold,marginLeft:8,fontWeight:700}}>🔥 {streak}x streak!</span>}</div>
            </div>
          </div>
          {scenario.isPhishing && scenario.redFlags.length > 0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:C.red,marginBottom:10}}>🚩 RED FLAGS:</div>
              {scenario.redFlags.map((f,i)=>(
                <div key={i} className="flag-item" style={{display:"flex",gap:10,marginBottom:8,fontSize:13,color:C.textMd,lineHeight:1.6,animationDelay:`${i*.08}s`}}>
                  <span style={{color:C.red,fontWeight:900,flexShrink:0}}>▸</span><span>{f}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{background:"#fff",borderRadius:12,padding:"12px 16px",fontSize:13,color:C.textMd,lineHeight:1.7,borderLeft:`3px solid ${C.teal}`}}>
            <span style={{color:C.teal,fontWeight:800}}>💡 Lesson: </span>{scenario.lesson}
          </div>
          <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
            <button className="btn-next" onClick={nextScenario}>{currentScenario+1>=level.scenarios.length?"Complete Level →":"Next Scenario →"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — PASSWORD ARENA
// ═══════════════════════════════════════════════════════════════════════════════
const COMMON_PASSWORDS = new Set(["password","123456","password1","12345678","qwerty","abc123","monkey","letmein","trustno1","dragon","iloveyou","master","sunshine","passw0rd","shadow","123123","superman","football","password123","admin","welcome","hello","starwars","summer","zxcvbn","qwerty123","1q2w3e4r","111111","1234567890"]);
const DICT_WORDS = ["the","be","to","of","and","a","in","that","have","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us","love","cat","dog","house","car","blue","red","green","black","white","happy","cool","sun","moon","star","fire","water","tree","flower","bird"];
const KEYBOARD_PATTERNS = ["qwerty","qwertyuiop","asdfgh","asdfghjkl","zxcvbn","1234","12345","123456","1234567","12345678","abcdef","qazwsx","!@#$%"];

function analyzePassword(pwd) {
  if (!pwd) return null;
  const len = pwd.length;
  const hasLower=/[a-z]/.test(pwd), hasUpper=/[A-Z]/.test(pwd), hasDigit=/[0-9]/.test(pwd), hasSymbol=/[^a-zA-Z0-9]/.test(pwd), hasSpace=/ /.test(pwd);
  let charsetSize = 0;
  if (hasLower) charsetSize+=26; if (hasUpper) charsetSize+=26; if (hasDigit) charsetSize+=10; if (hasSymbol) charsetSize+=32; if (hasSpace) charsetSize+=1;
  charsetSize = Math.max(charsetSize, 1);
  let entropy = len * Math.log2(charsetSize);
  const penalties=[], bonuses=[];
  if (COMMON_PASSWORDS.has(pwd.toLowerCase())) { entropy=Math.min(entropy,8); penalties.push({icon:"💀",text:"One of the most commonly used passwords — crackers check these first, instantly."}); }
  const lw=pwd.toLowerCase(), matchedWord=DICT_WORDS.find(w=>w.length>3&&lw.includes(w));
  if (matchedWord&&len<16) { entropy*=0.65; penalties.push({icon:"📖",text:`Contains common word "${matchedWord}" — dictionary attacks target these.`}); }
  const kp=KEYBOARD_PATTERNS.find(p=>lw.includes(p));
  if (kp) { entropy*=0.55; penalties.push({icon:"⌨️",text:`Contains keyboard pattern "${kp}" — in every cracker's ruleset.`}); }
  const leet=lw.replace(/@/g,"a").replace(/0/g,"o").replace(/1/g,"i").replace(/3/g,"e").replace(/\$/g,"s");
  if (COMMON_PASSWORDS.has(leet)&&!COMMON_PASSWORDS.has(lw)) { entropy*=0.5; penalties.push({icon:"🔄",text:"Leet-speak substitutions (@ for a, 0 for o) won't fool modern tools."}); }
  if (/(.)\\1{2,}/.test(pwd)) { entropy*=0.7; penalties.push({icon:"🔁",text:"Repeated characters reduce entropy significantly."}); }
  if (!hasUpper&&!hasSymbol&&!hasDigit) { entropy*=0.8; penalties.push({icon:"🔡",text:"Lowercase-only — much smaller search space."}); }
  if (len<8) { entropy*=0.5; penalties.push({icon:"📏",text:`Only ${len} characters — brute-forced in seconds.`}); }
  if (len>=16) bonuses.push({icon:"📏",text:`Long password (${len} chars) — length is the single most powerful factor.`});
  if (len>=20) bonuses.push({icon:"🚀",text:"20+ characters makes brute force practically impossible."});
  if (hasLower&&hasUpper&&hasDigit&&hasSymbol) bonuses.push({icon:"🎨",text:"Uses all four character types — maximizes the search space."});
  if (hasSpace) bonuses.push({icon:"🌌",text:"Contains spaces — uncommon and adds meaningful entropy."});
  const wordCount=pwd.trim().split(/\s+/).filter(w=>w.length>1).length;
  if (wordCount>=3&&len>=16) { entropy=Math.max(entropy,55); bonuses.push({icon:"💬",text:"Passphrase detected — high entropy that's also memorable."}); }
  entropy=Math.max(0,Math.min(entropy,128));
  const secondsToCrack=Math.pow(2,entropy)/1e10/2;
  return { entropy:Math.round(entropy), charsetSize, secondsToCrack, penalties, bonuses, hasLower, hasUpper, hasDigit, hasSymbol, len };
}
function fmtCrack(s) {
  if (s<0.001) return {label:"Instantly",color:"#ef4444",tier:0};
  if (s<1) return {label:"< 1 second",color:"#ef4444",tier:0};
  if (s<60) return {label:`${Math.round(s)}s`,color:"#f97316",tier:1};
  if (s<3600) return {label:`${Math.round(s/60)} min`,color:"#f97316",tier:1};
  if (s<86400) return {label:`${Math.round(s/3600)} hours`,color:"#eab308",tier:2};
  if (s<2592000) return {label:`${Math.round(s/86400)} days`,color:"#eab308",tier:2};
  if (s<31536000) return {label:`${Math.round(s/2592000)} months`,color:"#84cc16",tier:3};
  if (s<3153600000) return {label:`${Math.round(s/31536000)} years`,color:"#22c55e",tier:4};
  if (s<3.15e13) return {label:`${Math.round(s/3153600000).toLocaleString()} centuries`,color:"#06b6d4",tier:5};
  return {label:"Age of the universe+",color:"#8b5cf6",tier:6};
}
function strLabel(e) {
  if (e<25) return {label:"Catastrophic",color:"#ef4444"};
  if (e<35) return {label:"Very Weak",color:"#f97316"};
  if (e<50) return {label:"Weak",color:"#eab308"};
  if (e<65) return {label:"Fair",color:"#84cc16"};
  if (e<80) return {label:"Strong",color:"#22c55e"};
  if (e<100) return {label:"Very Strong",color:"#06b6d4"};
  return {label:"Unbreakable",color:"#8b5cf6"};
}
const PW_CHALLENGES = [
  {id:1,title:"Escape the Basics",task:"12+ chars, uppercase, lowercase, and numbers.",checkRaw:(_,a)=>a&&a.len>=12&&a.hasUpper&&a.hasLower&&a.hasDigit,xp:100},
  {id:2,title:"Symbol Power",task:"14+ characters including at least one symbol.",checkRaw:(_,a)=>a&&a.len>=14&&a.hasSymbol,xp:150},
  {id:3,title:"Passphrase Builder",task:"3+ words with spaces, 20+ characters total.",checkRaw:(pwd,a)=>{if(!a||a.len<20)return false;return pwd.trim().split(/\s+/).filter(w=>w.length>1).length>=3;},xp:200},
  {id:4,title:"Crack-Proof Fortress",task:"Password that takes more than 1,000 years to crack.",checkRaw:(_,a)=>a&&a.secondsToCrack>31536000*1000,xp:250},
  {id:5,title:"Entropy Master",task:"Achieve 80+ bits of entropy.",checkRaw:(_,a)=>a&&a.entropy>=80,xp:300},
];

function PasswordArena({ playerName, onComplete, onExit }) {
  const [screen, setScreen] = useState("game");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [crackTime, setCrackTime] = useState(null);
  const [strength, setStrength] = useState(null);
  const [score, setScore] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(new Set());
  const [newlyCompleted, setNewlyCompleted] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [crackAnim, setCrackAnim] = useState(false);
  const prevTierRef = useRef(0);

  useEffect(() => {
    if (!password) { setAnalysis(null); setCrackTime(null); setStrength(null); return; }
    const a = analyzePassword(password);
    const ct = fmtCrack(a.secondsToCrack);
    setAnalysis(a); setCrackTime(ct); setStrength(strLabel(a.entropy));
    if (ct.tier !== prevTierRef.current) { setCrackAnim(true); setTimeout(()=>setCrackAnim(false),600); prevTierRef.current=ct.tier; }
    const ch = PW_CHALLENGES[currentChallenge];
    if (ch) {
      const pass = ch.checkRaw(password, a);
      if (pass && !completedChallenges.has(ch.id)) {
        const updated = new Set(completedChallenges); updated.add(ch.id);
        setCompletedChallenges(updated); setScore(p=>p+ch.xp); setNewlyCompleted(ch);
        setTimeout(()=>setNewlyCompleted(null),3000);
        if (currentChallenge+1<PW_CHALLENGES.length) setTimeout(()=>{setCurrentChallenge(p=>p+1);setPassword("");},1500);
      }
    }
  }, [password]);

  function finish() {
    addModuleScore(2,{name:playerName,score,completed:completedChallenges.size,date:new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})});
    addGlobalScore(playerName,2,"Password Arena",score,s=>`${s.completed}/${PW_CHALLENGES.length} challenges`);
    onComplete(score);
  }

  const barColor = strength?.color || C.border;
  const barWidth = analysis ? Math.min(100,(analysis.entropy/128)*100) : 0;

  return (
    <div style={{position:"relative",zIndex:1,maxWidth:900,margin:"0 auto",padding:"20px 16px 60px"}}>
      <button className="btn-exit" style={{position:"fixed",top:16,left:16,zIndex:50}} onClick={onExit}>← Hub</button>
      {newlyCompleted && (
        <div style={{position:"fixed",top:20,right:20,zIndex:300,background:"#fff",border:`2px solid ${C.goldL}`,borderRadius:18,padding:"14px 20px",boxShadow:`0 8px 36px rgba(217,119,6,.28)`,animation:"slideIn .4s ease",maxWidth:280}}>
          <div style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:2,marginBottom:4}}>✅ CHALLENGE COMPLETE</div>
          <div style={{fontSize:17,fontWeight:900}}>{newlyCompleted.title}</div>
          <div style={{fontSize:13,color:C.textSm,marginTop:3}}>+{newlyCompleted.xp} XP!</div>
        </div>
      )}
      {/* HUD */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>PLAYER</div><div style={{fontSize:13,fontWeight:900,color:C.pink}}>{playerName}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>XP</div><div style={{fontSize:13,fontWeight:900,color:C.gold}}>{score}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>DONE</div><div style={{fontSize:13,fontWeight:900,color:C.violet}}>{completedChallenges.size}/{PW_CHALLENGES.length}</div></div>
        <div style={{flex:1,textAlign:"right"}}><button className="btn-next" onClick={finish}>Finish & See Results →</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:18,alignItems:"start"}}>
        {/* Left: input + analysis */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="card">
            <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:C.textSm,marginBottom:12}}>🔑 TYPE YOUR PASSWORD</div>
            <div style={{position:"relative"}}>
              <input className="pwd-inp" type={showPwd?"text":"password"} placeholder="Start typing…" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="off"/>
              <button onClick={()=>setShowPwd(p=>!p)} style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.textSm}}>{showPwd?"🙈":"👁️"}</button>
            </div>
            {password && (
              <div style={{marginTop:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:C.textSm}}>STRENGTH</span>
                  <span style={{fontSize:12,fontWeight:900,color:strength?.color}}>{strength?.label}</span>
                </div>
                <div style={{height:8,background:C.bgSoft,borderRadius:8,overflow:"hidden",marginBottom:14}}>
                  <div style={{height:"100%",background:`linear-gradient(90deg,${barColor},${barColor}cc)`,borderRadius:8,width:`${barWidth}%`,transition:"width .4s ease, background .4s ease"}}/>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[{label:"Lowercase",met:analysis?.hasLower},{label:"Uppercase",met:analysis?.hasUpper},{label:"Numbers",met:analysis?.hasDigit},{label:"Symbols",met:analysis?.hasSymbol}].map((r,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:r.met?`${C.green}15`:C.bgSoft,border:`1px solid ${r.met?C.greenL:C.border}`,borderRadius:50,padding:"4px 10px",transition:"all .3s"}}>
                      <div className={`req-dot ${r.met?"met":"unmet"}`}/><span style={{fontSize:11,fontWeight:700,color:r.met?C.green:C.textSm}}>{r.label}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",alignItems:"center",gap:5,background:C.bgSoft,border:`1px solid ${C.border}`,borderRadius:50,padding:"4px 10px"}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.textSm}}>{analysis?.len} chars</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {analysis && crackTime && (
            <div style={{background:"#fff",border:`2px solid ${crackTime.color}44`,borderRadius:20,padding:"20px 22px",boxShadow:`0 4px 24px ${crackTime.color}18`,transition:"all .4s"}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:C.textSm,marginBottom:6}}>⚡ ESTIMATED CRACK TIME</div>
              <div style={{fontSize:11,color:C.textSm,marginBottom:10}}>Using a modern GPU cluster (~10 billion guesses/sec)</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"clamp(22px,4vw,34px)",fontWeight:700,color:crackTime.color,marginBottom:12,animation:crackAnim?"popIn .5s ease":""}}>{crackTime.label}</div>
              <div style={{display:"flex",gap:12,fontSize:12,color:C.textSm,marginBottom:12}}>
                <span>Entropy: <strong style={{color:C.violet}}>{analysis.entropy} bits</strong></span>
                <span>Charset: <strong style={{color:C.teal}}>{analysis.charsetSize}</strong></span>
              </div>
              {analysis.penalties.length>0 && (
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:C.red,marginBottom:6}}>WEAKNESSES</div>
                  {analysis.penalties.map((p,i)=>(<div key={i} style={{fontSize:11,color:C.textMd,marginBottom:5,display:"flex",gap:6}}><span>{p.icon}</span><span>{p.text}</span></div>))}
                </div>
              )}
              {analysis.bonuses.length>0 && (
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:C.green,marginBottom:6}}>STRENGTHS</div>
                  {analysis.bonuses.map((b,i)=>(<div key={i} style={{fontSize:11,color:C.textMd,marginBottom:5,display:"flex",gap:6}}><span>{b.icon}</span><span>{b.text}</span></div>))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Right: challenges */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:C.textSm,marginBottom:4}}>🎯 CHALLENGES</div>
          {PW_CHALLENGES.map((ch,i)=>{
            const done=completedChallenges.has(ch.id), active=i===currentChallenge&&!done;
            return (
              <div key={i} className={`challenge-card ${done?"done":active?"active":""}`}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:done?4:8}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:done?`linear-gradient(135deg,${C.green},#047857)`:active?`linear-gradient(135deg,${C.pink},${C.violet})`:C.bgSoft,color:done||active?"#fff":C.textSm,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>
                    {done?"✓":i+1}
                  </div>
                  <div style={{flex:1,fontSize:13,fontWeight:800,color:done?C.green:C.text}}>{ch.title}</div>
                  <div style={{fontSize:11,fontWeight:700,color:C.gold}}>+{ch.xp}</div>
                </div>
                {!done && <div style={{fontSize:11,color:C.textSm,lineHeight:1.5,paddingLeft:36}}>{ch.task}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — SAFE BROWSING CHALLENGE
// ═══════════════════════════════════════════════════════════════════════════════
const SB_SCENARIOS = [
  { id:1,level:1,difficulty:"Rookie",isSafe:false,ssl:false,url:"http://bankofamerica-secure-login.com/account/verify",displayUrl:"http://bankofamerica-secure-login.com/account/verify",favicon:"🏦",pageTitle:"Bank of America – Secure Login",sslLabel:"Not Secure",sslColor:"#ef4444",pageContent:{header:"Bank of America",subheader:"Secure Account Verification",body:"Your account has been temporarily suspended. Please verify your identity to restore access.",form:true,formFields:["Email Address","Password","Social Security Number","Card Number"],submitLabel:"Verify My Account",footerText:"© 2026 Bank of America. Member FDIC."},redFlags:[{icon:"🔓",title:"No HTTPS",detail:"The URL starts with 'http://' not 'https://'. Real banks always use HTTPS."},{icon:"🌐",title:"Fake domain",detail:"'bankofamerica-secure-login.com' is NOT Bank of America. The real site is bankofamerica.com."},{icon:"📋",title:"Requesting SSN & card number",detail:"Legitimate banks never ask for SSN and card number on a login page."},{icon:"🚨",title:"Urgency tactic",detail:"'Account suspended' rushes you into acting without thinking."}],lesson:"Real bank sites always use HTTPS and their exact official domain. Never enter financial details on a page without a padlock.",points:100},
  { id:2,level:1,difficulty:"Rookie",isSafe:true,ssl:true,url:"https://www.wikipedia.org/wiki/Cybersecurity",displayUrl:"https://www.wikipedia.org/wiki/Cybersecurity",favicon:"📖",pageTitle:"Cybersecurity – Wikipedia",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"Cybersecurity",subheader:"From Wikipedia, the free encyclopedia",body:"Cybersecurity is the protection of computer systems and networks from attack by malicious actors...",form:false,footerText:"Creative Commons Attribution-ShareAlike License 4.0"},redFlags:[],lesson:"Wikipedia uses HTTPS, its real domain (wikipedia.org), and asks for no personal information. A safe site to read.",points:80},
  { id:3,level:1,difficulty:"Rookie",isSafe:false,ssl:false,url:"http://free-iphone-winner.xyz/claim?user=you",displayUrl:"http://free-iphone-winner.xyz/claim?user=you",favicon:"🎁",pageTitle:"🎉 Congratulations! You've been selected!",sslLabel:"Not Secure",sslColor:"#ef4444",pageContent:{header:"🎉 YOU HAVE BEEN SELECTED!",subheader:"Claim Your FREE iPhone 16 Pro Max Now!",body:"You are our 1,000,000th visitor! This offer expires in 09:47. Enter your details to claim your prize!",form:true,formFields:["Full Name","Home Address","Phone Number","Credit Card (shipping fee $1.99)"],submitLabel:"CLAIM MY FREE iPHONE NOW!",footerText:"By claiming, you agree to a $89.99/month subscription."},redFlags:[{icon:"🔓",title:"No HTTPS",detail:"No padlock — any data you enter can be intercepted."},{icon:"🌐",title:"Suspicious .xyz domain",detail:".xyz domains are extremely cheap and commonly used for scam sites."},{icon:"⏰",title:"Countdown timer",detail:"Fake urgency countdowns stop you from thinking critically."},{icon:"💳",title:"Credit card for 'free' prize",detail:"The '$1.99 shipping' is a front for a $89.99/month subscription."}],lesson:"Prize scam pages create excitement and urgency. The '$1.99 shipping fee' trick captures credit card details for unauthorized charges.",points:100},
  { id:4,level:2,difficulty:"Cadet",isSafe:true,ssl:true,url:"https://github.com/login",displayUrl:"https://github.com/login",favicon:"🐙",pageTitle:"Sign in to GitHub · GitHub",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"Sign in to GitHub",subheader:"",body:"Welcome back! Sign in to continue to GitHub.",form:true,formFields:["Username or email address","Password"],submitLabel:"Sign in",footerText:"By signing in, you agree to GitHub's Terms of Service."},redFlags:[],lesson:"GitHub's login is at github.com/login — a legitimate domain with valid HTTPS. Only asks for username and password.",points:80},
  { id:5,level:2,difficulty:"Cadet",isSafe:false,ssl:true,url:"https://paypal-secure-account.support/login",displayUrl:"https://paypal-secure-account.support/login",favicon:"💳",pageTitle:"PayPal – Log In",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"PayPal",subheader:"Log in to your account",body:"Access your PayPal account to send money, pay online, and manage your transactions.",form:true,formFields:["Email address","Password"],submitLabel:"Log In",footerText:"© 2026 PayPal, Inc. All rights reserved."},redFlags:[{icon:"🌐",title:"Wrong domain — not paypal.com",detail:"'paypal-secure-account.support' is NOT 'paypal.com'. PayPal's real login is paypal.com/signin."},{icon:"🔒",title:"HTTPS doesn't mean safe",detail:"HTTPS only means the connection is encrypted — NOT that the site is legitimate. Scammers get HTTPS certificates too."}],lesson:"HTTPS (the padlock) does NOT mean a site is safe — it only means the connection is encrypted. Attackers routinely get free HTTPS certificates for phishing sites.",points:150},
  { id:6,level:2,difficulty:"Cadet",isSafe:false,ssl:true,url:"https://www.amazon.com.account-update.net/signin",displayUrl:"https://www.amazon.com.account-update.net/signin",favicon:"📦",pageTitle:"Amazon Sign-In",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"amazon",subheader:"Sign in",body:"Enter your email or mobile phone number and password to sign in.",form:true,formFields:["Email or mobile phone number","Password"],submitLabel:"Continue",footerText:"© 2026 Amazon.com, Inc. All rights reserved."},redFlags:[{icon:"🌐",title:"Subdomain trick — NOT amazon.com",detail:"The real domain here is 'account-update.net'. 'amazon.com' appearing before it is just a subdomain."},{icon:"🧠",title:"How to read a URL",detail:"In 'www.amazon.com.account-update.net', the actual domain is 'account-update.net'. Everything before is a subdomain."}],lesson:"Subdomain spoofing puts the real brand name early in the URL. Read the domain right-to-left from the first slash — the TLD and word left of it is the real domain.",points:150},
  { id:7,level:3,difficulty:"Analyst",isSafe:true,ssl:true,url:"https://accounts.google.com/signin/v2/identifier",displayUrl:"https://accounts.google.com/signin/v2/identifier",favicon:"🔵",pageTitle:"Sign in – Google Accounts",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"Sign in",subheader:"Use your Google Account",body:"Sign in with your Google account to access Gmail, Drive, YouTube, and all other Google services.",form:true,formFields:["Email or phone"],submitLabel:"Next",footerText:"Before using Google's products, please review Privacy Policy and Terms."},redFlags:[],lesson:"Google's sign-in is at accounts.google.com — a legitimate subdomain of google.com. Only asks for email/phone on the first step.",points:100},
  { id:8,level:3,difficulty:"Analyst",isSafe:false,ssl:true,url:"https://secure.dict-gov-ph.online/employee-portal/login",displayUrl:"https://secure.dict-gov-ph.online/employee-portal/login",favicon:"🏛️",pageTitle:"DICT Employee Portal – Secure Login",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"DICT Philippines",subheader:"Employee Portal – Secure Login",body:"Access the DICT employee portal. This portal is for authorized DICT personnel only.",form:true,formFields:["Employee ID","Password","One-Time PIN"],submitLabel:"Access Portal",footerText:"DICT Philippines – Building a digitally empowered nation.",warning:"⚠️ Unauthorized access is prohibited under RA 10175."},redFlags:[{icon:"🌐",title:"Not a .gov.ph domain",detail:"The real DICT website is dict.gov.ph. Philippine government sites always use .gov.ph — 'dict-gov-ph.online' is fake."},{icon:"🏛️",title:"Philippine gov sites use .gov.ph",detail:"All legitimate Philippine government websites end in .gov.ph: dict.gov.ph, doh.gov.ph, bir.gov.ph."}],lesson:"In the Philippines, ALL government websites use the .gov.ph domain. 'dict-gov-ph.online' mimics the pattern but .online is a commercial domain anyone can register.",points:175},
  { id:9,level:3,difficulty:"Analyst",isSafe:false,ssl:true,url:"https://rn-facebook.com/login/",displayUrl:"https://rn-facebook.com/login/",favicon:"📘",pageTitle:"Facebook – Log In or Sign Up",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"facebook",subheader:"Log in to Facebook",body:"Connect with friends and the world around you on Facebook.",form:true,formFields:["Email address or phone number","Password"],submitLabel:"Log In",footerText:"© 2026 Meta Platforms, Inc."},redFlags:[{icon:"🌐",title:"'rn-facebook.com' is not Facebook",detail:"Facebook's domain is facebook.com. 'rn-facebook.com' is a completely different domain."},{icon:"🔒",title:"HTTPS on a fake site",detail:"The padlock only means encrypted traffic to the fake domain. Your credentials go to the attacker."}],lesson:"Facebook clones are among the most common phishing sites. The only real Facebook is facebook.com. Any other domain is fake regardless of how the page looks.",points:175},
  { id:10,level:4,difficulty:"Expert",isSafe:true,ssl:true,url:"https://myaccount.google.com/security-checkup",displayUrl:"https://myaccount.google.com/security-checkup",favicon:"🔵",pageTitle:"Security Checkup – Google Account",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"Security Checkup",subheader:"Manage your Google Account security",body:"Review and improve the security of your Google Account. Check recent security events.",form:false,footerText:"Google LLC, Mountain View, CA 94043"},redFlags:[],lesson:"myaccount.google.com is a legitimate Google subdomain. Google owns google.com — any subdomain of google.com is authentic.",points:120},
  { id:11,level:4,difficulty:"Expert",isSafe:false,ssl:true,url:"https://signin.microsoft.com.auth-verify.io/oauth2/v2.0/login",displayUrl:"https://signin.microsoft.com.auth-verify.io/oauth2/v2.0/login",favicon:"🪟",pageTitle:"Microsoft – Sign In",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"Microsoft",subheader:"Sign in",body:"Sign in to access Outlook, Teams, OneDrive, Office 365, and all Microsoft services.",form:true,formFields:["Email, phone, or Skype"],submitLabel:"Next",footerText:"© Microsoft 2026   Terms of use   Privacy & cookies"},redFlags:[{icon:"🧠",title:"Subdomain trap — real domain is auth-verify.io",detail:"'signin.microsoft.com' is just a subdomain of 'auth-verify.io'. Real Microsoft login is login.microsoft.com."},{icon:"🛣️",title:"OAuth2 path adds false legitimacy",detail:"'/oauth2/v2.0/login' mimics Microsoft's real OAuth URL structure — but the domain makes it fake."}],lesson:"The real domain in 'signin.microsoft.com.auth-verify.io' is 'auth-verify.io'. Microsoft's real login URLs are login.microsoft.com and login.microsoftonline.com.",points:200},
  { id:12,level:4,difficulty:"Expert",isSafe:false,ssl:true,url:"https://www.g00gle.com/accounts/login",displayUrl:"https://www.g00gle.com/accounts/login",favicon:"🔵",pageTitle:"Google Accounts",sslLabel:"Connection is secure",sslColor:"#059669",pageContent:{header:"Google",subheader:"Sign in to continue",body:"Sign in to your Google account to access Gmail, Drive, YouTube, and all Google services.",form:true,formFields:["Email or phone","Password"],submitLabel:"Sign in",footerText:"© 2026 Google LLC · Privacy · Terms"},redFlags:[{icon:"🔢",title:"Zero substitution: 'g00gle.com' not 'google.com'",detail:"The two 'o's in 'google' are replaced with zeros ('0'). g00gle vs google."},{icon:"🔍",title:"Look character by character",detail:"Typosquatting uses near-identical characters: 0 vs o, 1 vs l, rn vs m."}],lesson:"Typosquatting replaces visually similar characters. The domain 'g00gle.com' is completely different from 'google.com'. Always scan domain names character by character.",points:200},
];

function HighlightedURL({ url, isSafe, revealed }) {
  if (!revealed) return <span style={{fontFamily:"'Roboto Mono',monospace",fontSize:12,color:C.textMd}}>{url}</span>;
  try {
    const u = new URL(url); const protocol=u.protocol+"//"; const parts=u.hostname.split(".");
    const rest=u.pathname+u.search;
    const tlds=["com","net","org","io","xyz","online","support","ph","gov"];
    let tldIdx=-1; for(let i=parts.length-1;i>=0;i--){if(tlds.includes(parts[i])){tldIdx=i;break;}}
    const realDomainStart=tldIdx>0?tldIdx-1:-1;
    return (
      <span style={{fontFamily:"'Roboto Mono',monospace",fontSize:12,wordBreak:"break-all"}}>
        <span style={{color:isSafe?C.green:C.textSm,fontWeight:700}}>{protocol}</span>
        {parts.map((part,i)=>{
          const isReal=(i===realDomainStart||i===tldIdx)&&!isSafe;
          return (<span key={i}>{i>0&&<span style={{color:C.textSm}}>.</span>}<span style={{color:isReal?C.red:isSafe?C.green:C.textMd,fontWeight:isReal?900:600,background:isReal?`${C.red}15`:"transparent",borderRadius:isReal?3:0,padding:isReal?"0 2px":0}}>{part}</span></span>);
        })}
        <span style={{color:C.textSm}}>{rest}</span>
      </span>
    );
  } catch { return <span style={{fontFamily:"'Roboto Mono',monospace",fontSize:12}}>{url}</span>; }
}

function BrowserMock({ s, revealed }) {
  return (
    <div style={{background:"#f1f3f4",borderRadius:14,overflow:"hidden",border:`1.5px solid ${C.border}`,boxShadow:"0 6px 24px rgba(0,0,0,.09)",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{background:"#e8eaed",padding:"8px 14px 0",display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:10,height:10,borderRadius:"50%",background:"#ef4444"}}/><div style={{width:10,height:10,borderRadius:"50%",background:"#facc15"}}/><div style={{width:10,height:10,borderRadius:"50%",background:"#4ade80"}}/>
        <div style={{flex:1,marginLeft:10}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fff",borderRadius:"6px 6px 0 0",padding:"5px 12px",fontSize:11,color:C.textMd,maxWidth:220}}>
            <span>{s.favicon}</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>{s.pageTitle}</span>
          </div>
        </div>
      </div>
      <div style={{background:"#e8eaed",padding:"6px 14px 8px",display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1,background:"#fff",borderRadius:50,padding:"6px 12px",display:"flex",alignItems:"center",gap:7,border:"1px solid #dadce0"}}>
          <span style={{fontSize:12}}>{s.ssl?"🔒":"⚠️"}</span>
          <span style={{fontSize:10,fontWeight:700,color:s.sslColor,whiteSpace:"nowrap"}}>{s.sslLabel}</span>
          <div style={{width:1,height:12,background:"#e0e0e0",flexShrink:0}}/>
          <div style={{flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
            <HighlightedURL url={s.displayUrl} isSafe={s.isSafe} revealed={revealed}/>
          </div>
          {revealed && !s.isSafe && <div style={{flexShrink:0,fontSize:9,fontWeight:800,color:C.red,background:`${C.red}15`,border:`1px solid ${C.red}44`,borderRadius:50,padding:"2px 6px",whiteSpace:"nowrap"}}>FAKE</div>}
          {revealed && s.isSafe && <div style={{flexShrink:0,fontSize:9,fontWeight:800,color:C.green,background:`${C.green}15`,border:`1px solid ${C.green}44`,borderRadius:50,padding:"2px 6px",whiteSpace:"nowrap"}}>✓ REAL</div>}
        </div>
      </div>
      <div style={{background:"#fff",minHeight:180,padding:"20px 24px"}}>
        <div style={{maxWidth:420,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:900,color:C.text,margin:"0 0 4px"}}>{s.pageContent.header}</h2>
          {s.pageContent.subheader&&<p style={{fontSize:12,color:C.textSm,margin:"0 0 10px"}}>{s.pageContent.subheader}</p>}
          <p style={{fontSize:12,color:C.textMd,lineHeight:1.7,margin:"0 0 14px"}}>{s.pageContent.body}</p>
          {s.pageContent.warning&&<div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:6,padding:"8px 12px",fontSize:11,color:"#92400e",marginBottom:12,fontWeight:600}}>{s.pageContent.warning}</div>}
          {s.pageContent.form&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {s.pageContent.formFields.map((f,i)=>(<div key={i} style={{background:C.bgSoft,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:12,color:C.textSm}}>{f}</div>))}
              <div style={{background:s.isSafe?`linear-gradient(135deg,${C.teal},${C.violet})`:`linear-gradient(135deg,${C.red},#b91c1c)`,color:"#fff",borderRadius:6,padding:"10px",textAlign:"center",fontSize:12,fontWeight:800}}>{s.pageContent.submitLabel}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{background:"#f8f9fa",padding:"3px 14px",borderTop:"1px solid #e0e0e0",display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:9,color:C.textSm}}>{s.ssl?"✓ Encrypted":"⚠ Not encrypted"}</span>
        <span style={{fontSize:9,color:C.textSm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{s.pageContent.footerText}</span>
      </div>
    </div>
  );
}

function SafeBrowsing({ playerName, onComplete, onExit }) {
  const QUIZ = SB_SCENARIOS;
  const [qIndex, setQIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState(null);
  const [urlRevealed, setUrlRevealed] = useState(false);

  const current = QUIZ[qIndex];
  const levelColors = {1:C.pinkL,2:C.violetL,3:C.tealL,4:C.orangeL};

  function handleAnswer(choice) {
    if (answered) return;
    setPlayerChoice(choice); setAnswered(true); setUrlRevealed(true);
    const correct = (choice==="safe")===current.isSafe;
    if (correct) {
      const ns = streak+1; const bonus=Math.min(ns-1,3)*20;
      setScore(p=>p+current.points+bonus); setCorrectCount(p=>p+1); setStreak(ns);
      if (ns>=3){setToast(`🔥 ${ns}x Streak! +${bonus} bonus`);setTimeout(()=>setToast(null),2500);}
    } else { setStreak(0); }
  }

  function next() {
    if (qIndex+1>=QUIZ.length) {
      addModuleScore(3,{name:playerName,score,correct:correctCount,total:QUIZ.length,date:new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})});
      addGlobalScore(playerName,3,"Safe Browsing",score,s=>`${s.correct}/${s.total} correct`);
      onComplete(score);
    } else { setQIndex(p=>p+1); setAnswered(false); setPlayerChoice(null); setUrlRevealed(false); }
  }

  const consequence = answered ? (playerChoice==="safe"?current.isSafe?"✅ Correct — this site is safe.":"❌ Incorrect — this site is actually unsafe.":!current.isSafe?"✅ Correct — this site is unsafe.":"❌ Incorrect — this site is actually safe.") : "";
  const choiceCorrect = answered && ((playerChoice==="safe")===current.isSafe);

  return (
    <div style={{position:"relative",zIndex:1,maxWidth:820,margin:"0 auto",padding:"20px 16px 50px"}}>
      <button className="btn-exit" style={{position:"fixed",top:16,left:16,zIndex:50}} onClick={onExit}>← Hub</button>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:300,background:"#fff",border:`2px solid ${C.goldL}`,borderRadius:18,padding:"14px 20px",boxShadow:`0 8px 36px rgba(217,119,6,.28)`,animation:"slideIn .4s ease",fontSize:15,fontWeight:800,color:C.gold}}>{toast}</div>}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>PLAYER</div><div style={{fontSize:13,fontWeight:900,color:C.pink}}>{playerName}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>SCORE</div><div style={{fontSize:13,fontWeight:900,color:C.gold}}>{score}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>STREAK</div><div style={{fontSize:13,fontWeight:900,color:C.gold}}>{streak>0?`🔥${streak}`:"—"}</div></div>
        <div className="chip" style={{borderColor:`${levelColors[current.level]}55`}}><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>LEVEL</div><div style={{fontSize:13,fontWeight:900,color:levelColors[current.level]}}>{current.difficulty}</div></div>
        <div style={{flex:1,textAlign:"right",fontSize:13,fontWeight:700,color:C.textSm}}>{qIndex+1}/{QUIZ.length}</div>
      </div>
      <div style={{height:5,background:C.bgSoft,borderRadius:5,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${C.pink},${C.violet})`,borderRadius:5,width:`${(qIndex/QUIZ.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:3,color:C.textSm,marginBottom:10}}>🌐 IS THIS WEBSITE SAFE OR UNSAFE?</div>
      <div style={{marginBottom:12}}><BrowserMock s={current} revealed={urlRevealed}/></div>
      {!answered && (
        <div style={{background:"#fff",border:`1.5px dashed ${C.border}`,borderRadius:12,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>💡</span>
          <span style={{fontSize:12,color:C.textMd,fontWeight:600}}><strong style={{color:C.pink}}>Tip:</strong> Focus on the address bar. HTTPS (the padlock) does NOT automatically mean the site is safe.</span>
        </div>
      )}
      {!answered && (
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>
          <button style={{background:`linear-gradient(135deg,${C.green},#047857)`,border:"none",color:"#fff",cursor:"pointer",padding:"14px 32px",borderRadius:50,fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:800,boxShadow:`0 6px 20px rgba(5,150,105,.3)`,transition:"all .2s"}} onClick={()=>handleAnswer("safe")}>✅ Safe — I'd use this site</button>
          <button style={{background:`linear-gradient(135deg,${C.red},#b91c1c)`,border:"none",color:"#fff",cursor:"pointer",padding:"14px 32px",borderRadius:50,fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:800,boxShadow:`0 6px 20px rgba(220,38,38,.3)`,transition:"all .2s"}} onClick={()=>handleAnswer("unsafe")}>🚫 Unsafe — Something's wrong</button>
        </div>
      )}
      {answered && (
        <div style={{background:choiceCorrect?"rgba(236,253,245,.95)":"rgba(254,242,242,.95)",border:`1.5px solid ${choiceCorrect?C.greenL:C.redL}`,borderRadius:20,padding:"18px 20px",animation:"fadeUp .3s ease"}}>
          <div style={{fontSize:16,fontWeight:900,color:choiceCorrect?C.green:C.red,marginBottom:12}}>{consequence}</div>
          {current.redFlags.length>0 && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:C.red,marginBottom:8}}>🚩 RED FLAGS:</div>
              {current.redFlags.map((f,i)=>(<div key={i} style={{display:"flex",gap:10,marginBottom:8}}><span style={{fontSize:18,flexShrink:0}}>{f.icon}</span><div><div style={{fontSize:12,fontWeight:800,color:C.text}}>{f.title}</div><div style={{fontSize:11,color:C.textSm,lineHeight:1.5}}>{f.detail}</div></div></div>))}
            </div>
          )}
          <div style={{background:"#fff",borderRadius:10,padding:"10px 14px",fontSize:12,color:C.textMd,lineHeight:1.7,borderLeft:`3px solid ${C.teal}`,marginBottom:12}}>
            <span style={{color:C.teal,fontWeight:800}}>💡 </span>{current.lesson}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button className="btn-next" onClick={next}>{qIndex+1>=QUIZ.length?"See Final Results →":"Next Site →"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — MFA ATTACK SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════
const MFA_SCENARIOS = [
  { id:1,type:"fatigue",difficulty:"Rookie",level:1,title:"The Midnight Bombing",subtitle:"MFA Push Fatigue Attack",icon:"💥",levelColor:C.pinkL,points:100,
    context:"It's 2:14 AM. You're asleep. An attacker has your email and password from a data breach and is flooding your phone with push notifications hoping you'll tap Approve to make them stop.",
    attackType:"MFA Fatigue (Push Bombing)",
    steps:[
      {id:"s1",type:"phone_notification",time:"2:14 AM",app:"Microsoft Authenticator",appIcon:"🔐",title:"Sign-in request",body:"Are you trying to sign in?\nLocation: Lagos, Nigeria\nDevice: Chrome on Windows",actions:[{label:"✓ Approve",value:"approve",danger:true},{label:"✗ Deny",value:"deny",safe:true}],correctAction:"deny",hint:"You are asleep at 2:14 AM and did NOT initiate this login.",consequence:{approve:"❌ You approved it! The attacker now has full access to your Microsoft 365 account.",deny:"✅ Correct — you denied it. But the attacker keeps going…"}},
      {id:"s2",type:"phone_notification",time:"2:14 AM",subtext:"(5th request in 1 minute)",app:"Microsoft Authenticator",appIcon:"🔐",title:"Sign-in request",body:"Are you trying to sign in?\nLocation: Lagos, Nigeria\nDevice: Chrome on Windows",actions:[{label:"✓ Approve",value:"approve",danger:true},{label:"✗ Deny",value:"deny",safe:true}],correctAction:"deny",hint:"5 push notifications in 1 minute at 2 AM. The attacker counts on fatigue or confusion. Never approve a push you didn't initiate.",consequence:{approve:"❌ The attacker wins after 5 attempts. This is why 'number matching' MFA is safer.",deny:"✅ You held firm! Change your password now and report this to IT."}}
    ],
    lesson:"MFA push fatigue floods your phone hoping you'll approve one to stop the noise. NEVER approve a push you didn't personally trigger. Unsolicited MFA requests mean your password is compromised.",
    defenses:["Only approve MFA pushes YOU initiated","Use number-matching MFA instead of simple approve/deny","If bombarded, deny all and immediately change your password","Report unsolicited MFA requests to your IT security team"]},
  { id:2,type:"social_engineering",difficulty:"Rookie",level:1,title:"The Helpful IT Guy",subtitle:"MFA Code Social Engineering",icon:"📞",levelColor:C.pinkL,points:120,
    context:"You receive a phone call from someone claiming to be from IT helpdesk. They say your account has been flagged and will send a verification code to confirm your identity.",
    attackType:"Social Engineering — OTP Harvesting",
    steps:[
      {id:"s1",type:"phone_call",caller:"IT Helpdesk (02) 8XXX-XXXX",callerIcon:"👨‍💼",dialogue:[{speaker:"caller",text:"Hello, this is Mark from IT Security. We've detected unusual login attempts and need to verify your identity before locking your account."},{speaker:"caller",text:"I'm going to send a 6-digit verification code to your phone right now. Please read it back to me once you receive it."}],actions:[{label:"📱 Read them the code",value:"give_code",danger:true},{label:"🚫 Refuse and hang up",value:"refuse",safe:true},{label:"✅ Ask for their employee ID",value:"verify",neutral:true}],correctAction:"refuse",hint:"Legitimate IT departments NEVER ask you to read back an MFA code over the phone. Sharing it defeats its entire purpose.",consequence:{give_code:"❌ You gave away your MFA code. The attacker used it immediately. IT staff never need your OTP — they have admin tools.",refuse:"✅ Correct. Legitimate IT staff never need you to read back a verification code.",verify:"⚠️ Smart instinct, but employee IDs can be stolen too. The safest move is to hang up and call IT back using the official number."}},
      {id:"s2",type:"sms_message",from:"MYCOMPANY",messages:[{text:"Your verification code is: 847291\nThis code expires in 5 minutes. Do not share this code with anyone."}],phoneCall:"IT Helpdesk is still on the line: \"Did you receive the code? Please read it to me now.\"",actions:[{label:"📢 Read: '847291'",value:"give_code",danger:true},{label:"🚫 Hang up — this is a scam",value:"refuse",safe:true},{label:"📞 Call IT back directly",value:"callback",safe:true}],correctAction:"refuse",hint:"The SMS itself says 'Do not share this code with anyone.' The caller triggered YOUR MFA for THEIR login attempt.",consequence:{give_code:"❌ The attacker used 847291 to complete their login. That warning on the SMS existed specifically to prevent this.",refuse:"✅ Perfect. The 'IT caller' triggered your MFA by attempting to log in themselves — that code was THEIR login code.",callback:"✅ Excellent. When you call back, real IT will have no record of contacting you — confirming it was a scam."}}
    ],
    lesson:"Attackers call posing as IT, then attempt to log in while on the phone, triggering an MFA code the victim reads back. The 'Do not share' warning on OTPs exists precisely for this attack.",
    defenses:["NEVER read MFA codes to anyone over the phone — ever","Legitimate IT support will never need your OTP","If you receive unexpected OTPs, your password may already be compromised","Always call IT back using the official number in your company directory"]},
  { id:3,type:"sim_swap",difficulty:"Cadet",level:2,title:"The SIM Swap",subtitle:"Carrier-Level MFA Bypass",icon:"📡",levelColor:C.violetL,points:150,
    context:"An attacker gathered your name, birthday, and last 4 digits of your SSN from social media and a data breach. They call your carrier pretending to be you and request a SIM transfer. YOUR number now routes to THEIR device.",
    attackType:"SIM Swapping Attack",
    steps:[
      {id:"s1",type:"narrative",title:"The Attacker Calls Your Carrier",events:[{icon:"📞",text:"Attacker calls Globe/Smart: 'Hi, I'm Maria Santos. I lost my phone and need to transfer my number to this new SIM.'"},{icon:"🔐",text:"Rep: 'For verification, your birthday and last 4 digits of SSN?' Attacker answers correctly — birthday was on Facebook."},{icon:"✅",text:"Rep: 'Transfer complete. Active in 15 minutes.'"},{icon:"📵",text:"YOUR phone loses signal. 'No service.' You assume it's a carrier outage."}],question:"Your phone just lost signal suddenly. What do you do?",actions:[{label:"😴 Wait for signal to return",value:"wait",danger:true},{label:"📞 Call carrier immediately",value:"call",safe:true},{label:"💻 Check email for account alerts",value:"check",neutral:true}],correctAction:"call",hint:"Sudden loss of mobile service — especially with no outage in your area — is a major warning sign of a SIM swap. Every minute matters.",consequence:{wait:"❌ While you wait, the attacker receives SMS OTPs and resets passwords to your email, bank, and social media.",call:"✅ You discover the SIM swap and the carrier reverses it within minutes.",check:"⚠️ Smart — you find 'password reset' notifications. Now call your carrier immediately."}},
      {id:"s2",type:"narrative",title:"Which MFA Would Have Protected You?",events:[{icon:"📱",text:"Attacker now receives ALL SMS messages sent to your number — including OTP codes."},{icon:"🏦",text:"They go to your bank's forgot-password, enter your email. Bank sends OTP to 'your' number — attacker receives it."},{icon:"🔑",text:"Bank password reset complete. Transfer initiated."}],question:"Which MFA method would have prevented the bank hack even after the SIM swap?",actions:[{label:"📱 SMS OTP (what they had)",value:"sms",danger:true},{label:"⏱️ Authenticator App (TOTP)",value:"totp",safe:true},{label:"🔑 Hardware Security Key (FIDO2)",value:"key",safe:true}],correctAction:"totp",hint:"SMS-based MFA depends on your phone number — which the attacker now controls. Authenticator apps generate codes on the physical device, not via SMS.",consequence:{sms:"❌ SMS OTP is exactly what failed. The attacker controls your number so they receive every SMS.",totp:"✅ Correct! Authenticator apps generate codes on the physical device — SIM swap cannot intercept them.",key:"✅ Also correct! FIDO2 hardware keys require physical possession. SIM swap is completely ineffective."}}
    ],
    lesson:"SIM swap attacks redirect your phone number to an attacker's device by socially engineering your carrier. This defeats SMS-based MFA entirely. Use authenticator apps (TOTP) or hardware keys instead.",
    defenses:["Use authenticator apps (TOTP) instead of SMS-based OTP","Set a SIM lock / port freeze PIN with your mobile carrier","Limit personal info on social media — birthday and SSN fragments help attackers","If your phone loses signal unexpectedly, call your carrier immediately"]},
  { id:4,type:"totp_phishing",difficulty:"Analyst",level:3,title:"The Ticking Clock",subtitle:"TOTP Real-Time Interception",icon:"⏱️",levelColor:C.tealL,points:200,
    context:"A fake bank login page captures your credentials and immediately prompts you for your authenticator app code — relaying it to the real bank before the 30-second TOTP window expires.",
    attackType:"Real-Time TOTP Interception + AiTM",
    steps:[
      {id:"s1",type:"narrative",title:"How TOTP Interception Works",events:[{icon:"1️⃣",text:"You land on a convincing fake bank site and enter your username + password."},{icon:"2️⃣",text:"The fake site relays your credentials to the real bank — in milliseconds."},{icon:"3️⃣",text:"The real bank responds: 'MFA required.' The fake site shows you a TOTP prompt."},{icon:"4️⃣",text:"You open your authenticator app and enter the 6-digit code."},{icon:"5️⃣",text:"The attacker relays YOUR code to the real bank within the 30-second window — logging in as you."},{icon:"⚠️",text:"Your TOTP code is only valid for 30 seconds — but automated relays complete in milliseconds."}],question:"You're on a login page at 'https://bdo-online-secure.net' and it asks for your TOTP. What do you do?",actions:[{label:"📱 Open authenticator and enter code",value:"enter",danger:true},{label:"🔍 Close tab — check URL first",value:"check_url",safe:true},{label:"🔑 TOTP means it's secure — proceed",value:"assume",danger:true}],correctAction:"check_url",hint:"TOTP being requested doesn't mean the site is safe. The real BDO site is bdo.com.ph, not 'bdo-online-secure.net'. The attacker's proxy already relayed your password.",consequence:{enter:"❌ Your TOTP code was relayed to the real BDO in seconds. Automated AiTM attacks complete faster than you can blink.",check_url:"✅ The URL is 'bdo-online-secure.net' — NOT 'bdo.com.ph'. Close the tab and change your password immediately.",assume:"❌ TOTP adds security — but only on the REAL site. On a fake proxy, entering your TOTP helps the attacker complete their relay."}},
      {id:"s2",type:"mfa_comparison",title:"Which MFA Resists Relay Attacks?",description:"Not all MFA is equally resistant to relay attacks. The core question: can the MFA credential be intercepted and replayed by an attacker sitting between you and the real server?",question:"Your bank is upgrading MFA. Which option is immune to relay attacks?",actions:[{label:"📱 SMS OTP",value:"sms",danger:true},{label:"⏱️ TOTP Authenticator App",value:"totp",neutral:true},{label:"🔑 FIDO2 / Passkey",value:"fido2",safe:true},{label:"📧 Email OTP",value:"email",danger:true}],correctAction:"fido2",hint:"FIDO2 uses cryptographic challenge-response tied to the origin domain. An attacker relaying from a fake domain cannot produce a valid response.",consequence:{sms:"❌ SMS OTP can be intercepted via SIM swap and relayed in real-time. Not phishing-resistant.",totp:"⚠️ TOTP is better than SMS but still relay-able in the 30-second window.",fido2:"✅ FIDO2/Passkeys use public-key cryptography tied to the specific domain — a fake proxy cannot forge a valid response.",email:"❌ Email OTP has the same relay vulnerability as SMS OTP."}}
    ],
    lesson:"TOTP codes can be intercepted in real time by a relay proxy within the 30-second window. The only truly phishing-resistant MFA is FIDO2/passkeys — cryptographically bound to the exact domain.",
    defenses:["Use FIDO2 / passkeys wherever available — immune to relay attacks","Always verify the URL BEFORE opening your authenticator app","Banks in the Philippines: BDO = bdo.com.ph, BPI = bpi.com.ph, Metrobank = metrobank.com.ph"]},
  { id:5,type:"recovery_abuse",difficulty:"Expert",level:4,title:"The Backdoor",subtitle:"Account Recovery Exploitation",icon:"🔓",levelColor:C.orangeL,points:250,
    context:"You have Google Authenticator set up. But an attacker with your email and password tries a different approach: your account recovery — a phone number you set up 6 years ago that's now owned by someone else.",
    attackType:"Account Recovery Exploitation",
    steps:[
      {id:"s1",type:"narrative",title:"The Forgotten Backdoor",events:[{icon:"🔐",text:"You have Google Authenticator set up — the attacker can't get past your TOTP."},{icon:"📋",text:"Attacker clicks 'Try another way' on Google sign-in."},{icon:"📱",text:"Google offers: 'Send a verification code to +63 917 XXX 1234' — your old number."},{icon:"👤",text:"That number was recycled by Globe 3 years ago. A stranger now owns it."},{icon:"📩",text:"Google sends the OTP to your old number — the stranger receives it and hands it to the attacker."}],question:"Which account settings should you review RIGHT NOW on all important accounts?",actions:[{label:"📱 Review all recovery phone numbers",value:"phones",safe:true},{label:"📧 Review all recovery email addresses",value:"emails",safe:true},{label:"🔑 Store backup codes securely offline",value:"codes",safe:true},{label:"✅ All of the above — full audit",value:"all",safe:true}],correctAction:"all",hint:"Account recovery is only as strong as the weakest link. Old phone numbers get recycled; old emails may be hacked or abandoned.",consequence:{phones:"✅ Good — old phone numbers may be owned by strangers now.",emails:"✅ Good — an 8-year-old email you no longer monitor is high-risk.",codes:"✅ Good — backup codes should be stored offline, not in cloud notes or email drafts.",all:"✅ Perfect. A full account recovery audit addresses all attack surfaces."}},
      {id:"s2",type:"scenario_choice",title:"You Find These Recovery Items",recoveryItems:[{type:"phone",value:"+63 917 XXX 1234",age:"Added 6 years ago",status:"unknown",risk:"high"},{type:"phone",value:"+63 9XX XXX 5678",age:"Added 1 year ago",status:"active",risk:"low"},{type:"email",value:"oldgmail1998@yahoo.com",age:"Added 8 years ago",status:"unknown",risk:"high"},{type:"email",value:"work@company.com",age:"Added 2 years ago",status:"active",risk:"medium"}],question:"Which recovery items should you remove IMMEDIATELY?",actions:[{label:"Remove +63 917 XXX 1234 (6-year-old number)",value:"old_phone",safe:true},{label:"Remove oldgmail1998@yahoo.com (8-year-old email)",value:"old_email",safe:true},{label:"Remove both old/unknown items",value:"both",safe:true},{label:"Keep them — they might be useful",value:"keep",danger:true}],correctAction:"both",hint:"Any recovery method you no longer actively use or control is a potential backdoor. Old phone numbers get recycled; old email accounts may be hacked.",consequence:{old_phone:"✅ Correct — old phone numbers may be owned by strangers now.",old_email:"✅ Correct — an 8-year-old Yahoo account you no longer monitor is high-risk.",both:"✅ Excellent. Remove everything you don't actively control and monitor.",keep:"❌ Stale recovery items are backdoors. Old phone numbers are recycled, old emails are vulnerable."}}
    ],
    lesson:"MFA is only as strong as its weakest recovery path. Attackers bypass strong MFA by targeting forgotten backup numbers. Audit your account recovery settings on all important accounts at least once per year.",
    defenses:["Audit recovery options on Google, Microsoft, and banking accounts annually","Remove phone numbers you no longer use — they get recycled to new owners","Recovery email accounts must also have strong MFA","Store backup codes offline (printed) — not in email drafts or cloud notes"]},
];

// MFA sub-components
function MFA_PhoneNotification({ step, onAction, answered, playerChoice }) {
  const [ring, setRing] = useState(true);
  useEffect(()=>{const t=setTimeout(()=>setRing(false),1200);return()=>clearTimeout(t);},[step.id]);
  return (
    <div style={{display:"flex",justifyContent:"center",margin:"14px 0"}}>
      <div style={{width:280,background:C.phoneBg,borderRadius:32,padding:"10px 0 20px",boxShadow:ring?`0 0 0 6px ${C.pinkL}44,0 20px 60px rgba(0,0,0,.5)`:`0 20px 60px rgba(0,0,0,.4)`,transition:"box-shadow .6s"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><div style={{width:70,height:5,background:"#333",borderRadius:3}}/></div>
        <div style={{padding:"0 14px"}}>
          {step.time&&<div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:32,fontWeight:300,color:"#fff",lineHeight:1}}>{step.time}</div></div>}
          <div style={{background:"rgba(255,255,255,.12)",borderRadius:18,padding:"12px 14px",border:"1px solid rgba(255,255,255,.15)",animation:ring?"notifPop .4s ease":"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{fontSize:20}}>{step.appIcon}</div>
              <div><div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:600}}>{step.app}</div>{step.subtext&&<div style={{fontSize:9,color:C.pinkL}}>{step.subtext}</div>}</div>
              <div style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,.5)"}}>now</div>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:3}}>{step.title}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.75)",lineHeight:1.6,whiteSpace:"pre-line"}}>{step.body}</div>
          </div>
          {!answered&&<div style={{marginTop:12,display:"flex",gap:8}}>{step.actions.map((a,i)=>(<button key={i} onClick={()=>onAction(a.value)} style={{flex:1,padding:"9px 4px",borderRadius:12,border:"none",cursor:"pointer",background:a.safe?"rgba(5,150,105,.8)":a.danger?"rgba(220,38,38,.7)":"rgba(255,255,255,.15)",color:"#fff",fontSize:11,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{a.label}</button>))}</div>}
          {answered&&<div style={{marginTop:10,display:"flex",gap:6}}>{step.actions.map((a,i)=>(<div key={i} style={{flex:1,padding:"9px 4px",borderRadius:12,textAlign:"center",background:a.value===playerChoice?(a.safe?"rgba(5,150,105,.9)":"rgba(220,38,38,.8)"):"rgba(255,255,255,.08)",color:a.value===playerChoice?"#fff":"rgba(255,255,255,.4)",fontSize:11,fontWeight:700}}>{a.label}</div>))}</div>}
        </div>
      </div>
    </div>
  );
}

function MFA_SMSMock({ step, onAction, answered, playerChoice }) {
  return (
    <div style={{maxWidth:320,margin:"0 auto"}}>
      <div style={{background:C.phoneBg,borderRadius:28,padding:"18px 0 24px",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><div style={{width:70,height:5,background:"#333",borderRadius:3}}/></div>
        <div style={{padding:"0 14px"}}>
          <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>💬 Messages</div><div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>{step.from}</div></div>
          {step.messages.map((m,i)=>(<div key={i} style={{background:"rgba(255,255,255,.12)",borderRadius:"18px 18px 4px 18px",padding:"10px 12px",marginBottom:6,fontSize:12,color:"#fff",lineHeight:1.6,border:"1px solid rgba(255,255,255,.1)"}}>{m.text}</div>))}
          {step.phoneCall&&<div style={{background:"rgba(219,39,119,.2)",border:`1px solid ${C.pinkL}44`,borderRadius:10,padding:"8px 10px",marginTop:8,fontSize:11,color:C.pinkL,lineHeight:1.5}}>📞 {step.phoneCall}</div>}
        </div>
      </div>
      {!answered&&<div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>{step.actions.map((a,i)=>(<button key={i} onClick={()=>onAction(a.value)} style={{padding:"12px 18px",borderRadius:50,border:"none",cursor:"pointer",background:a.safe?`linear-gradient(135deg,${C.green},#047857)`:a.danger?`linear-gradient(135deg,${C.red},#b91c1c)`:`linear-gradient(135deg,${C.teal},${C.violet})`,color:"#fff",fontSize:12,fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>{a.label}</button>))}</div>}
    </div>
  );
}

function MFA_NarrativeStep({ step, onAction, answered, playerChoice }) {
  const [visible, setVisible] = useState(0);
  useEffect(()=>{const events=step.events||[];let i=0;const t=setInterval(()=>{i++;setVisible(i);if(i>=events.length)clearInterval(t);},700);return()=>clearInterval(t);},[step.id]);
  const events=step.events||[];
  return (
    <div>
      <div style={{marginBottom:16}}>
        {events.map((ev,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:10,padding:"10px 14px",background:i<visible?"#fff":"transparent",border:`1px solid ${i<visible?C.border:"transparent"}`,borderRadius:12,transition:"all .35s",opacity:i<visible?1:0,transform:i<visible?"translateY(0)":"translateY(8px)"}}>
          <span style={{fontSize:20,flexShrink:0}}>{ev.icon}</span>
          <span style={{fontSize:12,color:C.textMd,lineHeight:1.6,fontWeight:600}}>{ev.text}</span>
        </div>))}
      </div>
      {step.recoveryItems&&(
        <div style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px",marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:C.textSm,marginBottom:10}}>⚙️ ACCOUNT RECOVERY SETTINGS</div>
          {step.recoveryItems.map((item,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:item.risk==="high"?`${C.red}0d`:item.risk==="medium"?`${C.gold}0d`:`${C.green}0d`,border:`1px solid ${item.risk==="high"?C.redL:item.risk==="medium"?C.goldL:C.greenL}`,borderRadius:8,marginBottom:6}}>
            <span style={{fontSize:16}}>{item.type==="phone"?"📱":"📧"}</span>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:C.text}}>{item.value}</div><div style={{fontSize:10,color:C.textSm}}>{item.age}</div></div>
            <div style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:50,background:item.risk==="high"?`${C.red}15`:item.risk==="medium"?`${C.gold}15`:`${C.green}15`,color:item.risk==="high"?C.red:item.risk==="medium"?C.gold:C.green}}>{item.risk==="high"?"HIGH RISK":item.risk==="medium"?"REVIEW":"ACTIVE"}</div>
          </div>))}
        </div>
      )}
      {step.question&&<div style={{background:C.bgDeep,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:12}}><div style={{fontSize:12,fontWeight:800,color:C.violet,marginBottom:2}}>❓ Your Decision</div><div style={{fontSize:13,color:C.text,fontWeight:700}}>{step.question}</div></div>}
      {!answered&&step.actions&&<div style={{display:"flex",flexDirection:"column",gap:8}}>{step.actions.map((a,i)=>(<button key={i} onClick={()=>onAction(a.value)} style={{padding:"12px 18px",borderRadius:50,border:"none",cursor:"pointer",background:a.safe?`linear-gradient(135deg,${C.green},#047857)`:a.danger?`linear-gradient(135deg,${C.red},#b91c1c)`:`linear-gradient(135deg,${C.teal},${C.violet})`,color:"#fff",fontSize:12,fontWeight:800,fontFamily:"'Nunito',sans-serif",textAlign:"left"}}>{a.label}</button>))}</div>}
    </div>
  );
}

function MFA_PhoneCallStep({ step, onAction, answered, playerChoice }) {
  const [lineVisible, setLineVisible] = useState(0);
  useEffect(()=>{let i=0;const t=setInterval(()=>{i++;setLineVisible(i);if(i>=step.dialogue.length)clearInterval(t);},900);return()=>clearInterval(t);},[step.id]);
  return (
    <div style={{display:"flex",justifyContent:"center",margin:"14px 0"}}>
      <div style={{width:280,background:C.phoneBg,borderRadius:32,padding:"18px 0 24px",boxShadow:"0 20px 60px rgba(0,0,0,.45)"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><div style={{width:70,height:5,background:"#333",borderRadius:3}}/></div>
        <div style={{padding:"0 18px",textAlign:"center"}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${C.teal},${C.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 10px"}}>{step.callerIcon}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginBottom:3}}>Incoming call</div>
          <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:2}}>{step.caller}</div>
          <div style={{fontSize:10,color:C.greenL,marginBottom:16,animation:"pulse 1.5s infinite"}}>● Connected</div>
          <div style={{textAlign:"left",marginBottom:12}}>
            {step.dialogue.map((line,i)=>(<div key={i} style={{background:i<lineVisible?"rgba(255,255,255,.12)":"transparent",border:`1px solid ${i<lineVisible?"rgba(255,255,255,.15)":"transparent"}`,borderRadius:"4px 14px 14px 14px",padding:i<lineVisible?"9px 10px":"0",marginBottom:i<lineVisible?8:0,fontSize:11,color:"rgba(255,255,255,.85)",lineHeight:1.6,opacity:i<lineVisible?1:0,maxHeight:i<lineVisible?200:0,overflow:"hidden",transition:"all .4s ease"}}>
              {i<lineVisible&&<><span style={{fontSize:9,color:C.tealL,fontWeight:700,display:"block",marginBottom:2}}>👨‍💼 IT</span>{line.text}</>}
            </div>))}
          </div>
          {!answered&&lineVisible>=step.dialogue.length&&<div style={{display:"flex",flexDirection:"column",gap:7}}>{step.actions.map((a,i)=>(<button key={i} onClick={()=>onAction(a.value)} style={{width:"100%",padding:"10px 12px",borderRadius:12,border:"none",cursor:"pointer",background:a.safe?"rgba(5,150,105,.85)":a.danger?"rgba(220,38,38,.75)":"rgba(255,255,255,.15)",color:"#fff",fontSize:11,fontWeight:700,fontFamily:"'Nunito',sans-serif",textAlign:"left"}}>{a.label}</button>))}</div>}
          {!answered&&lineVisible<step.dialogue.length&&<div style={{fontSize:10,color:"rgba(255,255,255,.4)",animation:"pulse 1.2s infinite"}}>Listening…</div>}
          {answered&&<div style={{display:"flex",flexDirection:"column",gap:6}}>{step.actions.map((a,i)=>(<div key={i} style={{padding:"9px 12px",borderRadius:12,textAlign:"left",background:a.value===playerChoice?(a.safe?"rgba(5,150,105,.9)":a.danger?"rgba(220,38,38,.8)":"rgba(124,58,237,.8)"):"rgba(255,255,255,.07)",color:a.value===playerChoice?"#fff":"rgba(255,255,255,.35)",fontSize:11,fontWeight:700}}>{a.label}</div>))}</div>}
        </div>
      </div>
    </div>
  );
}

function MFA_MFAComparison({ step, onAction, answered, playerChoice }) {
  const details = { sms:{icon:"📱",name:"SMS OTP",risk:"High",color:C.red,desc:"Vulnerable to SIM swap, SS7, and relay"}, totp:{icon:"⏱️",name:"TOTP App",risk:"Medium",color:C.gold,desc:"Better than SMS but relayable in 30s"}, fido2:{icon:"🔑",name:"FIDO2 / Passkey",risk:"Very Low",color:C.green,desc:"Cryptographically bound to real domain — relay-proof"}, email:{icon:"📧",name:"Email OTP",risk:"High",color:C.red,desc:"Same relay vulnerability as SMS"} };
  return (
    <div>
      <div style={{fontSize:13,color:C.textMd,lineHeight:1.7,marginBottom:14}}>{step.description}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:14}}>
        {Object.entries(details).map(([key,m])=>(<div key={key} style={{background:playerChoice===key?`${m.color}15`:"#fff",border:`1.5px solid ${playerChoice===key?m.color:C.border}`,borderRadius:12,padding:"12px",transition:"all .3s"}}>
          <div style={{fontSize:22,marginBottom:5}}>{m.icon}</div>
          <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:1}}>{m.name}</div>
          <div style={{fontSize:10,fontWeight:700,color:m.color,marginBottom:5}}>Risk: {m.risk}</div>
          <div style={{fontSize:10,color:C.textSm,lineHeight:1.4}}>{m.desc}</div>
        </div>))}
      </div>
      {!answered&&<div style={{display:"flex",flexDirection:"column",gap:8}}>{step.actions.map((a,i)=>(<button key={i} onClick={()=>onAction(a.value)} style={{padding:"12px 18px",borderRadius:50,border:"none",cursor:"pointer",background:a.safe?`linear-gradient(135deg,${C.green},#047857)`:a.danger?`linear-gradient(135deg,${C.red},#b91c1c)`:a.neutral?`linear-gradient(135deg,${C.gold},${C.orange})`:`linear-gradient(135deg,${C.teal},${C.violet})`,color:"#fff",fontSize:12,fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>{a.label}</button>))}</div>}
    </div>
  );
}

function MFA_StepRenderer({ step, onAction, answered, playerChoice }) {
  if (step.type==="phone_notification") return <MFA_PhoneNotification step={step} onAction={onAction} answered={answered} playerChoice={playerChoice}/>;
  if (step.type==="phone_call")         return <MFA_PhoneCallStep step={step} onAction={onAction} answered={answered} playerChoice={playerChoice}/>;
  if (step.type==="sms_message")        return <MFA_SMSMock step={step} onAction={onAction} answered={answered} playerChoice={playerChoice}/>;
  if (step.type==="narrative")          return <MFA_NarrativeStep step={step} onAction={onAction} answered={answered} playerChoice={playerChoice}/>;
  if (step.type==="scenario_choice")    return <MFA_NarrativeStep step={{...step,events:[]}} onAction={onAction} answered={answered} playerChoice={playerChoice}/>;
  if (step.type==="mfa_comparison")     return <MFA_MFAComparison step={step} onAction={onAction} answered={answered} playerChoice={playerChoice}/>;
  return null;
}

function MFASimulator({ playerName, onComplete, onExit }) {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState(null);
  const [showContext, setShowContext] = useState(true);
  const [results, setResults] = useState([]);

  const scenario = MFA_SCENARIOS[scenarioIdx];
  const step = scenario?.steps[stepIdx];
  const totalSteps = MFA_SCENARIOS.reduce((a,s)=>a+s.steps.length,0);
  const completedSteps = MFA_SCENARIOS.slice(0,scenarioIdx).reduce((a,s)=>a+s.steps.length,0)+stepIdx;

  function handleAction(choice) {
    if (answered) return;
    setPlayerChoice(choice); setAnswered(true);
    const isCorrect = choice===step.correctAction || (step.actions.find(a=>a.value===choice)?.safe && step.actions.filter(a=>a.safe).length>1);
    if (isCorrect) {
      const ns=streak+1; setStreak(ns);
      const pts=Math.round(scenario.points/scenario.steps.length+(ns>2?20:0));
      setScore(p=>p+pts); setCorrectCount(p=>p+1);
      if (ns>=3){setToast(`🔥 ${ns}x Streak! +20`);setTimeout(()=>setToast(null),2500);}
      setResults(p=>[...p,{correct:true,scenario,step}]);
    } else { setStreak(0); setResults(p=>[...p,{correct:false,scenario,step}]); }
  }

  function nextStep() {
    if (stepIdx+1<scenario.steps.length) { setStepIdx(p=>p+1); setAnswered(false); setPlayerChoice(null); setShowContext(false); }
    else if (scenarioIdx+1<MFA_SCENARIOS.length) { setScenarioIdx(p=>p+1); setStepIdx(0); setAnswered(false); setPlayerChoice(null); setShowContext(true); }
    else {
      addModuleScore(4,{name:playerName,score,correct:correctCount,total:totalSteps,date:new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})});
      addGlobalScore(playerName,4,"MFA Simulator",score,s=>`${s.correct}/${s.total} correct`);
      onComplete(score);
    }
  }

  const consequence = answered && step ? step.consequence?.[playerChoice] : null;
  const choiceCorrect = answered && (playerChoice===step?.correctAction||(step?.actions.find(a=>a.value===playerChoice)?.safe&&step?.actions.filter(a=>a.safe).length>1));

  return (
    <div style={{position:"relative",zIndex:1,maxWidth:820,margin:"0 auto",padding:"20px 16px 60px"}}>
      <button className="btn-exit" style={{position:"fixed",top:16,left:16,zIndex:50}} onClick={onExit}>← Hub</button>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:300,background:"#fff",border:`2px solid ${C.goldL}`,borderRadius:18,padding:"14px 20px",boxShadow:`0 8px 36px rgba(217,119,6,.28)`,animation:"slideIn .4s ease",fontSize:14,fontWeight:800,color:C.gold}}>{toast}</div>}
      {/* HUD */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>PLAYER</div><div style={{fontSize:13,fontWeight:900,color:C.pink}}>{playerName}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>SCORE</div><div style={{fontSize:13,fontWeight:900,color:C.gold}}>{score}</div></div>
        <div className="chip"><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>STREAK</div><div style={{fontSize:13,fontWeight:900,color:C.gold}}>{streak>0?`🔥${streak}`:"—"}</div></div>
        <div className="chip" style={{borderColor:`${scenario.levelColor}55`}}><div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:2}}>LEVEL</div><div style={{fontSize:13,fontWeight:900,color:scenario.levelColor}}>{scenario.difficulty}</div></div>
        <div style={{flex:1,textAlign:"right",fontSize:12,fontWeight:700,color:C.textSm}}>Scene {scenarioIdx+1}/{MFA_SCENARIOS.length} · Step {stepIdx+1}/{scenario.steps.length}</div>
      </div>
      <div style={{height:5,background:C.bgSoft,borderRadius:5,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${C.pink},${C.violet})`,borderRadius:5,width:`${(completedSteps/totalSteps)*100}%`,transition:"width .4s"}}/>
      </div>
      {/* Scenario header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:16,padding:"14px 18px"}}>
        <span style={{fontSize:32}}>{scenario.icon}</span>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:scenario.levelColor,letterSpacing:2,marginBottom:1}}>{scenario.attackType.toUpperCase()}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:C.text}}>{scenario.title}</div>
          <div style={{fontSize:11,color:C.textSm}}>{scenario.subtitle}</div>
        </div>
      </div>
      {/* Context */}
      {showContext&&<div style={{background:`${scenario.levelColor}12`,border:`1.5px solid ${scenario.levelColor}44`,borderRadius:14,padding:"14px 16px",marginBottom:14,animation:"fadeUp .4s ease"}}>
        <div style={{fontSize:10,fontWeight:800,color:scenario.levelColor,letterSpacing:2,marginBottom:6}}>📖 SCENARIO CONTEXT</div>
        <div style={{fontSize:12,color:C.textMd,lineHeight:1.75,marginBottom:10}}>{scenario.context}</div>
        <button onClick={()=>setShowContext(false)} style={{background:"none",border:`1px solid ${scenario.levelColor}`,color:scenario.levelColor,borderRadius:50,padding:"5px 16px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>Got it — start the scenario →</button>
      </div>}
      {!showContext&&step&&(
        <>
          {!answered&&<div style={{background:"#fff",border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0}}>💡</span>
            <span style={{fontSize:11,color:C.textMd,fontWeight:600,lineHeight:1.6}}>{step.hint}</span>
          </div>}
          <MFA_StepRenderer step={step} onAction={handleAction} answered={answered} playerChoice={playerChoice}/>
          {answered&&consequence&&(
            <div style={{background:choiceCorrect?"rgba(236,253,245,.95)":"rgba(254,242,242,.95)",border:`1.5px solid ${choiceCorrect?C.greenL:C.redL}`,borderRadius:18,padding:"16px 18px",marginTop:14,animation:"fadeUp .3s ease"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                <span style={{fontSize:28,flexShrink:0}}>{choiceCorrect?"✅":"❌"}</span>
                <div style={{fontSize:13,color:C.textMd,lineHeight:1.65}}>{consequence}</div>
              </div>
              {stepIdx===scenario.steps.length-1&&(
                <>
                  <div style={{background:"#fff",borderRadius:10,padding:"10px 14px",fontSize:12,color:C.textMd,lineHeight:1.7,borderLeft:`3px solid ${C.teal}`,marginBottom:12}}>
                    <span style={{color:C.teal,fontWeight:800}}>💡 Lesson: </span>{scenario.lesson}
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:C.green,marginBottom:6}}>🛡️ DEFENSES</div>
                    {scenario.defenses.map((d,i)=>(<div key={i} className="flag-item" style={{display:"flex",gap:8,marginBottom:6,fontSize:11,color:C.textMd,lineHeight:1.55,animationDelay:`${i*.07}s`}}><span style={{color:C.green,fontWeight:900,flexShrink:0}}>✓</span><span>{d}</span></div>))}
                  </div>
                </>
              )}
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
                <button className="btn-next" onClick={nextStep}>
                  {scenarioIdx+1>=MFA_SCENARIOS.length&&stepIdx+1>=scenario.steps.length?"See Final Results →":stepIdx+1<scenario.steps.length?`Next Step (${stepIdx+2}/${scenario.steps.length}) →`:`Next: ${MFA_SCENARIOS[scenarioIdx+1]?.title} →`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE COMPLETE SCREEN (shared)
// ═══════════════════════════════════════════════════════════════════════════════
function ModuleComplete({ moduleId, moduleName, playerName, score, onBackToHub, onPlayAgain }) {
  const takeaways = {
    1:["Always check the sender's domain — not just the display name","Urgency and fear are manipulation tactics — slow down","SMS sender names are trivially spoofable","If in doubt, go directly to the official website"],
    2:["Length is the single most powerful factor in password strength","Passphrases (3+ random words) are both strong and memorable","Leet-speak substitutions won't fool modern cracking tools","Use a password manager for unique passwords on every site"],
    3:["HTTPS (the padlock) does NOT mean a site is safe","Read domain names right-to-left from the TLD to find the real owner","All Philippine government sites end in .gov.ph — no exceptions","Pixel-perfect clones exist — visual appearance tells you nothing"],
    4:["Only approve MFA pushes YOU personally initiated","NEVER read an OTP to anyone over the phone — ever","Use authenticator apps (TOTP) instead of SMS-based OTP","FIDO2 / passkeys are the only relay-proof MFA","Audit account recovery options annually"],
  };
  const icons = {1:"🎯",2:"🔐",3:"🌐",4:"🛡️"};
  return (
    <div style={{position:"relative",zIndex:1,maxWidth:600,margin:"0 auto",padding:"50px 20px 80px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:64,marginBottom:14,animation:"popIn .5s ease"}}>{icons[moduleId]}</div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:3,color:C.gold,marginBottom:10}}>MODULE COMPLETE</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:32,margin:"0 0 8px",color:C.text}}>Well done, {playerName}!</h2>
        <div style={{fontSize:13,color:C.textSm}}>You completed {moduleName}</div>
        <div style={{fontSize:28,fontWeight:900,color:C.pink,marginTop:12}}>{score.toLocaleString()} pts</div>
      </div>
      <div className="card" style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:C.teal,marginBottom:14}}>KEY TAKEAWAYS</div>
        {(takeaways[moduleId]||[]).map((tip,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:10,fontSize:13,color:C.textMd,lineHeight:1.55}}>
            <span style={{color:C.green,fontWeight:900,flexShrink:0}}>✓</span><span>{tip}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn-main" onClick={onBackToHub}>🏠 Back to Hub</button>
        <button className="btn-out" onClick={onPlayAgain}>↺ Play Again</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUB — MAIN HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const MODULES_INFO = [
  { id:1, title:"PhishGuard", subtitle:"Phishing Detection Simulator", icon:"🎣", color:C.pink, bg:"#fff1f9",
    desc:"Identify real phishing emails and SMS attacks across 4 difficulty levels. 12 scenarios, 6 unlockable badges.",
    skills:["Email header analysis","Domain spoofing","SMS phishing (smishing)","Urgency tactics"],
    totalXP:2200, levels:4, questions:12 },
  { id:2, title:"Password Arena", subtitle:"Strength & Crack-Time Simulator", icon:"🔐", color:C.violet, bg:"#f5f3ff",
    desc:"Type passwords and see real crack times. Complete 5 progressive challenges to earn XP.",
    skills:["Entropy & charset","Dictionary attacks","Passphrase technique","Crack time visualization"],
    totalXP:1000, levels:1, questions:5 },
  { id:3, title:"Safe Browsing", subtitle:"Browser Security Challenge", icon:"🌐", color:C.teal, bg:"#f0fdff",
    desc:"Analyze realistic browser mocks. Judge each site as safe or unsafe across 4 difficulty levels.",
    skills:["HTTPS misconceptions","Domain anatomy","Subdomain tricks","Philippine .gov.ph domains"],
    totalXP:1500, levels:4, questions:12 },
  { id:4, title:"MFA Simulator", subtitle:"Multi-Factor Attack Defense", icon:"🛡️", color:C.orange, bg:"#fff7ed",
    desc:"Experience 5 real MFA attack scenarios and make decisions in real time.",
    skills:["Push fatigue bombing","OTP social engineering","SIM swap attacks","AiTM relay attacks"],
    totalXP:1720, levels:4, questions:10 },
];

function Hub({ playerName, completedModules, moduleScores, onSelectModule, onViewLeaderboard, onChangeName }) {
  const [dots] = useState(() => Array.from({length:18},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,r:1.5+Math.random()*3,dur:5+Math.random()*7,del:Math.random()*4,c:i%3===0?C.pinkL:i%3===1?C.tealL:C.violetL})));
  const totalScore = Object.values(moduleScores).reduce((a,b)=>a+b,0);
  const allDone = completedModules.size === 4;

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,position:"relative",overflow:"hidden"}}>
      <BgParticles dots={dots}/>
      <div style={{position:"relative",zIndex:1,maxWidth:1000,margin:"0 auto",padding:"36px 20px 80px"}}>
        <BrandBar/>
        {/* Hero */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:4,color:C.textSm,marginBottom:10,textTransform:"uppercase"}}>Girls in ICT Day · Cyber Awareness Training</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,7vw,68px)",fontWeight:900,margin:"0 0 10px",lineHeight:1.05}}>
            <span className="shimmer">CyberSafe</span>
            <br/><span style={{fontSize:"clamp(20px,4vw,36px)",color:C.textMd,WebkitTextFillColor:C.textMd}}>Training Suite</span>
          </h1>
          <p style={{color:C.textMd,maxWidth:560,margin:"0 auto",lineHeight:1.8,fontSize:15}}>
            Four interactive modules covering phishing, passwords, browser safety, and MFA attacks. Learn by doing — every woman in tech deserves to stay cyber-safe. 💜
          </p>
        </div>

        {/* Player card */}
        <div style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:20,padding:"20px 24px",marginBottom:32,display:"flex",alignItems:"center",gap:18,flexWrap:"wrap",boxShadow:`0 4px 24px rgba(219,39,119,.08)`}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>👩‍💻</div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:900,color:C.text}}>{playerName}</div>
            <div style={{fontSize:12,color:C.textSm}}>{completedModules.size}/4 modules complete · {totalScore.toLocaleString()} total XP</div>
          </div>
          {/* Mini progress */}
          <div style={{display:"flex",gap:8}}>
            {MODULES_INFO.map(m=>(
              <div key={m.id} title={m.title} style={{width:36,height:36,borderRadius:"50%",background:completedModules.has(m.id)?`linear-gradient(135deg,${m.color},${m.color}aa)`:`${m.color}18`,border:`2px solid ${completedModules.has(m.id)?m.color:`${m.color}44`}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transition:"all .3s",boxShadow:completedModules.has(m.id)?`0 3px 10px ${m.color}44`:"none"}}>
                {completedModules.has(m.id)?"✓":m.icon}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {allDone&&<button className="btn-main" style={{padding:"10px 20px",fontSize:13}} onClick={onViewLeaderboard}>🏆 Leaderboard</button>}
            <button className="btn-out" style={{padding:"9px 18px",fontSize:12}} onClick={onViewLeaderboard}>🏆 Scores</button>
            <button className="btn-exit" onClick={onChangeName}>✏️ Change name</button>
          </div>
        </div>

        {/* Module cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:32}}>
          {MODULES_INFO.map((m,i)=>{
            const done = completedModules.has(m.id);
            const pts = moduleScores[m.id] || 0;
            return (
              <div key={i} style={{background:m.bg,border:`1.5px solid ${done?m.color:C.border}`,borderRadius:24,padding:"24px",transition:"all .25s",cursor:"pointer",boxShadow:done?`0 6px 24px ${m.color}22`:`0 2px 12px rgba(219,39,119,.06)`,position:"relative",overflow:"hidden"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 36px ${m.color}2a`}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=done?`0 6px 24px ${m.color}22`:`0 2px 12px rgba(219,39,119,.06)`}}
                onClick={()=>onSelectModule(m.id)}>
                {done&&<div style={{position:"absolute",top:16,right:16,background:`linear-gradient(135deg,${C.green},#047857)`,color:"#fff",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:50}}>COMPLETED ✓</div>}
                <div style={{fontSize:40,marginBottom:12}}>{m.icon}</div>
                <div style={{fontSize:11,fontWeight:800,color:m.color,letterSpacing:2,marginBottom:4}}>MODULE {m.id}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.text,marginBottom:4,lineHeight:1.2}}>{m.title}</div>
                <div style={{fontSize:12,color:C.textSm,marginBottom:12}}>{m.subtitle}</div>
                <div style={{fontSize:12,color:C.textMd,lineHeight:1.65,marginBottom:16}}>{m.desc}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                  {m.skills.map((s,j)=>(<span key={j} style={{fontSize:10,fontWeight:700,color:m.color,background:`${m.color}14`,border:`1px solid ${m.color}33`,borderRadius:50,padding:"3px 10px"}}>{s}</span>))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:11,color:C.textSm}}>{m.levels} {m.levels>1?"levels":"track"} · {m.questions} {m.questions>5?"scenarios":"challenges"}</div>
                  {done ? <div style={{fontSize:14,fontWeight:900,color:m.color}}>{pts.toLocaleString()} pts</div>
                        : <div style={{background:`linear-gradient(135deg,${m.color},${m.color}aa)`,color:"#fff",fontSize:12,fontWeight:800,padding:"8px 20px",borderRadius:50,boxShadow:`0 4px 14px ${m.color}33`}}>Start →</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Combined score teaser */}
        {totalScore > 0 && (
          <div className="card" style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:3,color:C.textSm,marginBottom:8}}>YOUR COMBINED SCORE</div>
            <div style={{fontSize:42,fontWeight:900,color:C.pink,marginBottom:4}}>{totalScore.toLocaleString()}</div>
            <div style={{fontSize:12,color:C.textSm}}>across {completedModules.size} completed module{completedModules.size!==1?"s":""}</div>
            <button className="btn-next" style={{marginTop:14}} onClick={onViewLeaderboard}>View Combined Leaderboard →</button>
          </div>
        )}

        <div style={{textAlign:"center",fontSize:12,color:C.textSm,lineHeight:2}}>
          <strong style={{color:C.pink}}>Girls in ICT Day</strong> · Facilitated by <strong style={{color:C.teal}}>DICT Region IV-A</strong> · In partnership with <strong style={{color:C.violet}}>ITU</strong><br/>
          Empowering women and girls in technology 💜
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED LEADERBOARD SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function CombinedLeaderboard({ playerName, onBack }) {
  const [tab, setTab] = useState("combined");
  const tabs = [{id:"combined",label:"🌟 Overall",color:C.pink},{id:"1",label:"🎣 PhishGuard",color:C.pink},{id:"2",label:"🔐 Passwords",color:C.violet},{id:"3",label:"🌐 Browsing",color:C.teal},{id:"4",label:"🛡️ MFA",color:C.orange}];
  const [dots] = useState(()=>Array.from({length:12},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,r:1.5+Math.random()*3,dur:5+Math.random()*7,del:Math.random()*4,c:i%3===0?C.pinkL:i%3===1?C.tealL:C.violetL})));

  const scores = tab==="combined" ? GLOBAL_SCORES : MODULE_STORES[parseInt(tab)]||[];
  const detail = tab==="combined" ? s=>`${s.moduleName} · ${s.detail(s)}` : null;
  const detailFns = {1:s=>`${s.accuracy}%`,2:s=>`${s.completed}/5 challenges`,3:s=>`${s.correct}/${s.total}`,4:s=>`${s.correct}/${s.total}`};

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,position:"relative",overflow:"hidden"}}>
      <BgParticles dots={dots}/>
      <div style={{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto",padding:"40px 20px 80px"}}>
        <BrandBar/>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:56,marginBottom:12,animation:"popIn .4s ease"}}>🏆</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:36,margin:"0 0 8px",color:C.text}}>Hall of Fame</h2>
          <div style={{fontSize:13,color:C.textSm}}>Girls in ICT Day · CyberSafe Training Suite</div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",justifyContent:"center"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",borderRadius:50,border:`1.5px solid ${tab===t.id?t.color:C.border}`,background:tab===t.id?`linear-gradient(135deg,${t.color},${t.color}aa)`:"#fff",color:tab===t.id?"#fff":C.textMd,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Nunito',sans-serif",transition:"all .2s",boxShadow:tab===t.id?`0 4px 14px ${t.color}33`:"none"}}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="card" style={{marginBottom:24}}>
          {scores.length===0?(
            <div style={{textAlign:"center",padding:"40px 0",color:C.textSm}}>
              <div style={{fontSize:40,marginBottom:12}}>🎮</div>
              <div>No scores yet for this module — be the first!</div>
            </div>
          ):scores.slice(0,15).map((s,i)=>(
            <ScoreRow key={i} s={s} i={i} playerName={playerName} detail={tab==="combined"?()=>`${s.moduleName}`:detailFns[tab]||null}/>
          ))}
        </div>

        <div style={{textAlign:"center"}}>
          <button className="btn-main" onClick={onBack}>← Back to Hub</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAME ENTRY SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function NameEntry({ onStart }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [dots] = useState(()=>Array.from({length:16},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,r:1.5+Math.random()*3,dur:5+Math.random()*7,del:Math.random()*4,c:i%3===0?C.pinkL:i%3===1?C.tealL:C.violetL})));

  function go() {
    if (!name.trim()) { setError("Please enter your name to begin. 🌸"); return; }
    onStart(name.trim());
  }

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",padding:20}}>
      <BgParticles dots={dots}/>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:480}}>
        <BrandBar/>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:4,color:C.textSm,marginBottom:12,textTransform:"uppercase"}}>Girls in ICT Day</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,8vw,62px)",fontWeight:900,margin:"0 0 10px",lineHeight:1.05}}>
            <span className="shimmer">CyberSafe</span>
          </h1>
          <div style={{fontSize:13,fontWeight:700,letterSpacing:3,color:C.textSm,textTransform:"uppercase",marginBottom:16}}>Training Suite</div>
          <p style={{color:C.textMd,lineHeight:1.8,fontSize:14}}>
            Four interactive cybersecurity modules.<br/>Learn to spot phishing, build strong passwords,<br/>browse safely, and defeat MFA attacks.
          </p>
        </div>
        <div style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:24,padding:"28px",boxShadow:`0 8px 36px rgba(219,39,119,.1)`}}>
          <div style={{fontSize:13,fontWeight:800,color:C.pink,letterSpacing:1,marginBottom:16,textAlign:"center"}}>✨ ENTER YOUR NAME TO BEGIN</div>
          <input className="inp" placeholder="Your name or username…" value={name} onChange={e=>{setName(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&go()} maxLength={30} autoFocus/>
          {error&&<div style={{fontSize:12,color:C.red,marginTop:8,fontWeight:600}}>{error}</div>}
          <button className="btn-main" style={{width:"100%",marginTop:18}} onClick={go}>Start Training →</button>
          <div style={{display:"flex",gap:12,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
            {MODULES_INFO.map(m=>(<span key={m.id} style={{fontSize:18}} title={m.title}>{m.icon}</span>))}
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:24,fontSize:11,color:C.textSm,lineHeight:2}}>
          <strong style={{color:C.pink}}>Girls in ICT Day</strong> · <strong style={{color:C.teal}}>DICT Region IV-A</strong> · <strong style={{color:C.violet}}>ITU</strong>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("name"); // name | hub | module | complete | leaderboard
  const [playerName, setPlayerName] = useState("");
  const [activeModule, setActiveModule] = useState(null);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [moduleScores, setModuleScores] = useState({});
  const [lastScore, setLastScore] = useState(0);

  function handleStart(name) { setPlayerName(name); setView("hub"); }

  function handleSelectModule(id) { setActiveModule(id); setView("module"); }

  function handleModuleComplete(score) {
    setLastScore(score);
    setCompletedModules(p => new Set([...p, activeModule]));
    setModuleScores(p => ({...p, [activeModule]: Math.max(score, p[activeModule]||0)}));
    setView("complete");
  }

  function handleBackToHub() { setActiveModule(null); setView("hub"); }

  function handlePlayAgain() { setView("module"); }

  const moduleNames = {1:"PhishGuard",2:"Password Arena",3:"Safe Browsing Challenge",4:"MFA Attack Simulator"};

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <style>{SHARED_CSS}</style>

      {view==="name" && <NameEntry onStart={handleStart}/>}

      {view==="hub" && (
        <Hub playerName={playerName} completedModules={completedModules} moduleScores={moduleScores}
          onSelectModule={handleSelectModule} onViewLeaderboard={()=>setView("leaderboard")}
          onChangeName={()=>setView("name")}/>
      )}

      {view==="module" && activeModule===1 && (
        <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Nunito',sans-serif",position:"relative",overflow:"hidden"}}>
          <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-140,right:-140,width:460,height:460,borderRadius:"50%",background:`radial-gradient(circle,${C.pinkL}1c,transparent 70%)`}}/>
            <div style={{position:"absolute",bottom:-100,left:-100,width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,${C.tealL}18,transparent 70%)`}}/>
          </div>
          <PhishGuard playerName={playerName} onComplete={handleModuleComplete} onExit={handleBackToHub}/>
        </div>
      )}

      {view==="module" && activeModule===2 && (
        <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Nunito',sans-serif",position:"relative",overflow:"hidden"}}>
          <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-140,right:-140,width:460,height:460,borderRadius:"50%",background:`radial-gradient(circle,${C.pinkL}1c,transparent 70%)`}}/>
          </div>
          <PasswordArena playerName={playerName} onComplete={handleModuleComplete} onExit={handleBackToHub}/>
        </div>
      )}

      {view==="module" && activeModule===3 && (
        <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Nunito',sans-serif",position:"relative",overflow:"hidden"}}>
          <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-140,right:-140,width:460,height:460,borderRadius:"50%",background:`radial-gradient(circle,${C.pinkL}1c,transparent 70%)`}}/>
          </div>
          <SafeBrowsing playerName={playerName} onComplete={handleModuleComplete} onExit={handleBackToHub}/>
        </div>
      )}

      {view==="module" && activeModule===4 && (
        <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Nunito',sans-serif",position:"relative",overflow:"hidden"}}>
          <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-140,right:-140,width:460,height:460,borderRadius:"50%",background:`radial-gradient(circle,${C.pinkL}1c,transparent 70%)`}}/>
          </div>
          <MFASimulator playerName={playerName} onComplete={handleModuleComplete} onExit={handleBackToHub}/>
        </div>
      )}

      {view==="complete" && (
        <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Nunito',sans-serif",position:"relative",overflow:"hidden"}}>
          <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-140,right:-140,width:460,height:460,borderRadius:"50%",background:`radial-gradient(circle,${C.pinkL}1c,transparent 70%)`}}/>
          </div>
          <ModuleComplete moduleId={activeModule} moduleName={moduleNames[activeModule]} playerName={playerName}
            score={lastScore} onBackToHub={handleBackToHub} onPlayAgain={handlePlayAgain}/>
        </div>
      )}

      {view==="leaderboard" && (
        <CombinedLeaderboard playerName={playerName} onBack={()=>setView("hub")}/>
      )}
    </div>
  );
}
