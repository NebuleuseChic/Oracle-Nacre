import { firebaseConfig } from './firebase-config.js';

const app = document.getElementById('app');

const routes = {
  '/': 'home-template',
  '/onboarding': 'onboarding-template',
  '/dashboard': 'dashboard-template',
  '/chat': 'chat-template'
};

const state = {
  profile: JSON.parse(localStorage.getItem('sn_profile') || 'null'),
  chat: JSON.parse(localStorage.getItem('sn_chat') || '[]')
};

function getApiBase(){
  const fromStorage = localStorage.getItem('sn_api_base') || '';
  const fromEnv = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_API_BASE_URL || '') : '';
  return (fromStorage || fromEnv || '').trim().replace(/\/$/, '');
}

function mount(route){
  const tId = routes[route] || routes['/'];
  const tpl = document.getElementById(tId);
  if (!tpl) return;
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  if(route === '/onboarding') setupOnboarding();
  if(route === '/dashboard') setupDashboard();
  if(route === '/chat') setupChat();
}

function navigate(){
  const route = location.hash.replace('#','') || '/';
  mount(route);
}

window.addEventListener('hashchange', navigate);
window.addEventListener('load', navigate);

function setupOnboarding(){
  const form = document.getElementById('onboardingForm');
  const msg = document.getElementById('onboardingMsg');
  if(!form) return;

  if(state.profile){
    Object.entries(state.profile).forEach(([k,v])=>{
      if(form.elements[k] && form.elements[k].type !== 'checkbox'){
        form.elements[k].value = v;
      }
    });
  }

  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    state.profile = data;
    localStorage.setItem('sn_profile', JSON.stringify(data));
    msg.textContent = 'Profil sauvegardé avec succès ✨';
  });
}

async function safeFetch(url, options = {}){
  try{
    const r = await fetch(url, options);
    const contentType = r.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await r.json() : await r.text();
    if(!r.ok){
      const detail = typeof data === 'string' ? data : (data.detail || `HTTP ${r.status}`);
      throw new Error(detail);
    }
    return data;
  }catch(err){
    return { error:true, message: err.message };
  }
}

function lifePathFromBirthDate(dateStr){
  if(!dateStr) return 7;
  const digits = dateStr.replace(/\D/g, '').split('').reduce((a,b)=>a+Number(b),0);
  let n = digits;
  while(n > 9 && n !== 11 && n !== 22 && n !== 33){
    n = String(n).split('').reduce((a,b)=>a+Number(b),0);
  }
  return n;
}

async function setupDashboard(){
  const oracleEl = document.getElementById('dailyOracle');
  const astroEl = document.getElementById('astroTransit');
  const numEl = document.getElementById('numerology');
  const btn = document.getElementById('refreshGuidance');
  if(!oracleEl || !astroEl || !numEl || !btn) return;

  async function load(){
    const quote = await safeFetch('https://api.quotable.io/random?tags=inspirational');
    const path = lifePathFromBirthDate(state.profile?.birthDate || '');
    oracleEl.textContent = quote.error
      ? 'La carte du jour parle d’un recentrage, d’un silence utile et d’un regard plus net.'
      : `« ${quote.content} »`;

    astroEl.textContent = 'Transit du moment : la Lune favorise l’intuition, le tri émotionnel et les décisions plus franches.';
    numEl.textContent = `Chiffre du moment : ${path}. Aujourd’hui, avance sur une seule chose, mais avance pour vrai.`;
  }

  btn.addEventListener('click', load);
  load();
}

function renderChat(){
  const win = document.getElementById('chatWindow');
  const ctx = document.getElementById('memoryContext');
  if(!win || !ctx) return;

  win.innerHTML = '';
  state.chat.forEach((m)=>{
    const d = document.createElement('div');
    d.className = `msg ${m.role === 'user' ? 'me' : 'ai'}`;
    d.textContent = m.text;
    win.appendChild(d);
  });

  win.scrollTop = win.scrollHeight;
  ctx.textContent = `Contexte mémoire: ${state.chat.length} messages.`;
}

async function askAI(prompt){
  const apiBase = getApiBase();

  if(!apiBase){
    return "Backend non configuré.";
  }

  const res = await safeFetch(`${apiBase}/api/chat`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({
      message: prompt,
      history: state.chat.slice(-6),
      profile: state.profile || null
    })
  });

  if(res.error){
    return `Le chat est indisponible pour le moment: ${res.message}`;
  }

  return res.reply || 'Silence cosmique temporaire.';
}

function setupChat(){
  renderChat();

  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const speak = document.getElementById('speakLast');
  const apiState = document.getElementById('apiState');

  if(!form || !input || !speak || !apiState) return;

  const currentApi = getApiBase();
  apiState.textContent = currentApi ? `Backend: ${currentApi}` : 'Backend non configuré';

  let sending = false;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(sending) return;

    const q = input.value.trim();
    if(!q) return;

    sending = true;

    state.chat.push({ role:'user', text:q });
    localStorage.setItem('sn_chat', JSON.stringify(state.chat));
    renderChat();
    input.value = '';

    try{
      const reply = await askAI(q);
      state.chat.push({ role:'assistant', text:reply });
    }catch{
      state.chat.push({ role:'assistant', text:'Erreur de connexion au backend.' });
    }

    localStorage.setItem('sn_chat', JSON.stringify(state.chat));
    renderChat();
    sending = false;
  });

  speak.addEventListener('click', ()=>{
    const last = [...state.chat].reverse().find((m)=>m.role === 'assistant');
    if(!last || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(last.text);
    u.lang = 'fr-CA';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

console.info('Firebase template loaded:', firebaseConfig.projectId || 'non configuré');
