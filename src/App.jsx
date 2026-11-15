import { useEffect, useMemo, useRef, useState } from 'react';

const SAVE_KEY = 'adler-legends-game-v3';
const OPPONENTS = [
  ['SV Falkenheim', 16], ['FC Stahlbrück', 18], ['TSV Moosbach', 14], ['Viktoria Nordtal', 20],
  ['Rot-Weiß Eichen', 17], ['Dynamo Höhenfeld', 19], ['SC Nebelwald', 15], ['Union Kiesfurt', 21],
  ['Blau-Gold Linden', 13], ['TuS Morgenrot', 18], ['Germania Steinau', 16], ['Eintracht Silbersee', 20],
  ['Borussia Tannen', 15], ['SpVgg Adlerhorst', 22], ['FC Küstenwind', 17], ['SV Abendhain', 19],
  ['Olympia Brücken', 14], ['VfB Sonnental', 21]
];
const FIRST_NAMES = ['Milan','Jonas','Elias','Noah','Finn','Luca','Ben','Timo','Levin','Mats','Nico','Oskar','David','Emil','Paul','Jannis','Theo','Fabian'];
const LAST_NAMES = ['Hartwig','Keller','Brandt','Seidel','Vogel','Krüger','Falk','Neumann','Berger','Winter','Kunz','Albrecht','Sommer','Reuter','Jäger','Wolff'];
const POSITIONS = ['TW','RV','IV','IV','LV','ZM','ZM','OM','RA','ST','LA'];
const NODES = [
  {id:'fitness',branch:'Team',name:'Athletiktraining',desc:'+8 Teamstärke',cost:120,icon:'⚡'},
  {id:'coach',branch:'Team',name:'Co-Trainer',desc:'Mehr Entwicklungspunkte',cost:260,icon:'🎽'},
  {id:'synergy',branch:'Team',name:'Adler-DNA',desc:'+20 % Teamchemie',cost:650,icon:'🦅',requires:'fitness'},
  {id:'academy',branch:'Infrastruktur',name:'Jugendakademie',desc:'+2 Teamstärke je Saison',cost:500,icon:'🎓'},
  {id:'canteen',branch:'Wirtschaft',name:'Vereinskantine',desc:'+4 Coins / Sekunde',cost:150,icon:'🍲'},
  {id:'shop',branch:'Wirtschaft',name:'Fanshop',desc:'+9 Coins / Sekunde',cost:430,icon:'🛍️',requires:'canteen'},
  {id:'automation',branch:'Personal',name:'Geschäftsstellen-Team',desc:'+50 % Einnahmen',cost:900,icon:'⚙️',requires:'shop'}
];
const BUILDINGS = [
  {id:'training',name:'Trainingszentrum',icon:'⚽',base:90,desc:'Steigert die Stärke deiner Mannschaft.'},
  {id:'stadium',name:'Stadion',icon:'🏟️',base:150,desc:'Mehr Fans, bessere Atmosphäre und Einnahmen.'},
  {id:'food',name:'Fanshop & Gastronomie',icon:'🥤',base:110,desc:'Verdient automatisch Vereins-Coins.'}
];
function makeSquad(){return FIRST_NAMES.slice(0,11).map((n,i)=>{const rating=54+((i*7)%13);return {id:i,name:n+' '+LAST_NAMES[(i*3+2)%LAST_NAMES.length],pos:POSITIONS[i],rating,level:1,xp:0,potential:76+(i%5)*4,rarity:i===9?'rare':i===7?'uncommon':'common',tier:'Talent',stats:baseStats(POSITIONS[i],rating),special:i===9?'Abschlussstärke':i===7?'Spielmacher':''};});}
function baseStats(pos,r){const s={tempo:r,schuss:r-2,pass:r-1,technik:r,verteidigung:r-4,physis:r};if(pos==='TW')return {tempo:r-15,schuss:r-18,pass:r-3,technik:r-8,verteidigung:r+2,physis:r};if(['IV','RV','LV'].includes(pos))return {...s,verteidigung:r+7,physis:r+4,schuss:r-9};if(['ST','RA','LA'].includes(pos))return {...s,tempo:r+5,schuss:r+7,verteidigung:r-12};return {...s,pass:r+6,technik:r+4};}
function normalizePlayer(p,i){const stats=p.stats||baseStats(p.pos,p.rating||55);const level=p.level||1;return {...p,level,xp:p.xp||0,potential:p.potential||Math.max(75,(p.rating||55)+20),rarity:p.rarity||'common',tier:p.tier||playerTier(level),stats};}
function playerTier(level){return level>=15?'Vereinslegende':level>=10?'Leistungsträger':level>=5?'Stammkraft':'Talent';}
function playerXpNext(level){return 100+Math.max(0,level-1)*35;}
function rarityName(r){return r==='legendary'?'Legende':r==='epic'?'Episch':r==='rare'?'Selten':r==='uncommon'?'Ungewöhnlich':'Amateur';}
function freshGame(clubName,shortName,colors){
 return {created:true,clubName,shortName,colors,coins:260,fans:38,prestige:0,wins:0,draws:0,losses:0,season:1,division:11,teamPower:18,development:100,unlocked:[],buildings:{training:1,stadium:1,food:0},squad:makeSquad(),matchday:1,lastSeen:Date.now(),lastMatch:null};
}
function readGame(){try{const x=JSON.parse(localStorage.getItem(SAVE_KEY));if(!x?.created)return null;const elapsed=Math.min(28800,Math.max(0,(Date.now()-x.lastSeen)/1000));return {...x,squad:(x.squad||[]).map(normalizePlayer),coins:(x.coins||0)+Math.floor(elapsed*incomeRate(x)),development:(x.development||0)+Math.floor(elapsed*devRate(x)),offlineGain:Math.floor(elapsed*incomeRate(x))};}catch{return null;}}
function incomeRate(g){return 1+(g.buildings?.food||0)*2+(g.unlocked?.includes('canteen')?4:0)+(g.unlocked?.includes('shop')?9:0)+(g.unlocked?.includes('automation')?5:0);}
function devRate(g){return .35+(g.buildings?.training||1)*.35+(g.unlocked?.includes('coach')?1:0);}
function strength(g){return Math.round((g.teamPower+(g.buildings?.training||1)*2+(g.unlocked?.includes('fitness')?8:0)+(g.unlocked?.includes('academy')?g.season*2:0))*(g.unlocked?.includes('synergy')?1.2:1));}
function leagueName(d){return d>=11?'Kreisklasse':d===10?'Kreisliga':d===9?'Bezirksliga':d===8?'Landesliga':d===7?'Verbandsliga':d===6?'Oberliga':d===5?'Regionalliga':d===4?'3. Liga':d===3?'2. Bundesliga':d===2?'Bundesliga':'Champions League';}
function opponentFor(g){return OPPONENTS[(g.matchday-1)%OPPONENTS.length];}
function makeMatch(g){
 const [opponent,base]=opponentFor(g);const home=g.matchday%2===1;const own=strength(g)+(home?3:0);const rival=base+Math.max(0,11-g.division)*3+Math.floor(Math.random()*9);
 const events=[];let a=0,b=0;
 for(let minute=5;minute<=90;minute+=5){
  const chance=Math.random();
  if(chance < (own > rival ? .16 : .11)){a++;events.push({minute,text:(Math.random()>.5?'⚽ Tor für ':'⚽ ')+g.shortName+'! '+(g.squad[Math.floor(Math.random()*g.squad.length)].name),side:'home'});}
  else if(chance>.87){b++;events.push({minute,text:'⚽ Tor für '+opponent,side:'away'});}
  else if(chance>.75)events.push({minute,text:['🟨 Gelbe Karte','🥅 Großchance vergeben','🧤 Starke Parade'][Math.floor(Math.random()*3)],side:'neutral'});
 }
 return {opponent,home,own,rival,minute:0,homeScore:0,awayScore:0,events,feed:[],status:'live',reward:0};
}
function App(){
 const [game,setGame]=useState(readGame);const [screen,setScreen]=useState('home');const [selectedPlayerId,setSelectedPlayerId]=useState(9);const [toast,setToast]=useState('');const [match,setMatch]=useState(null);const [clubDraft,setClubDraft]=useState({name:'FC Adler',short:'FCA',colors:'red'});
 const income=useMemo(()=>game?incomeRate(game):0,[game]);const power=game?strength(game):0;
 useEffect(()=>{if(!game)return;const t=setInterval(()=>setGame(g=>g?({...g,coins:g.coins+incomeRate(g),development:g.development+devRate(g),lastSeen:Date.now()}):g),1000);return()=>clearInterval(t);},[!!game]);
 useEffect(()=>{if(game)localStorage.setItem(SAVE_KEY,JSON.stringify({...game,lastSeen:Date.now()}));},[game]);
 useEffect(()=>{if(!match||match.status!=='live')return;const t=setInterval(()=>setMatch(m=>{
  if(!m||m.status!=='live')return m;
  const minute=m.minute+1;const event=m.events.find(e=>e.minute===minute);
  let next={...m,minute,homeScore:m.homeScore+(event?.side==='home'?1:0),awayScore:m.awayScore+(event?.side==='away'?1:0),feed:event?[event,...m.feed].slice(0,8):m.feed};
  if(minute>=90){next.status='done';next.reward=Math.round((next.homeScore>next.awayScore?90:next.homeScore===next.awayScore?48:28)*(1+(12-game.division)*.07));setGame(g=>{
   const won=next.homeScore>next.awayScore,draw=next.homeScore===next.awayScore;
   const wins=g.wins+(won?1:0),losses=g.losses+(!won&&!draw?1:0),draws=g.draws+(draw?1:0);
   const promote=won&&wins%4===0&&g.division>1;
   return {...g,coins:g.coins+next.reward,fans:g.fans+(won?14:draw?5:1),prestige:g.prestige+(won?6:2),wins,losses,draws,division:promote?g.division-1:g.division,season:promote?g.season+1:g.season,teamPower:g.teamPower+(won?1:0),matchday:g.matchday+1,lastMatch:{opponent:next.opponent,homeScore:next.homeScore,awayScore:next.awayScore,won,draw,reward:next.reward,promote}};});}
  return next;
 }),420);return()=>clearInterval(t);},[match?.status,game?.division]);
 function startMatch(){if(match?.status==='live')return;setMatch(makeMatch(game));setScreen('match');}
 function upgrade(id){const b=BUILDINGS.find(x=>x.id===id),level=game.buildings[id]||0,cost=Math.floor(b.base*Math.pow(1.7,level));if(game.coins<cost){setToast('Noch nicht genug Coins.');return;}setGame(g=>({...g,coins:g.coins-cost,buildings:{...g.buildings,[id]:level+1}}));}
 function trainPlayer(playerId,focus){const cost=14;if(game.development<cost){setToast('Nicht genug Entwicklungspunkte für diese Trainingseinheit.');return;}setGame(g=>({...g,development:g.development-cost,squad:g.squad.map((raw,i)=>{const p=normalizePlayer(raw,i);if(p.id!==playerId)return p;const current=p.stats[focus]||p.rating;const nextStats={...p.stats,[focus]:Math.min(99,Math.min(p.potential,current+1))};const xp=p.xp+40;let level=p.level,rating=p.rating;let remaining=xp;while(remaining>=playerXpNext(level)){remaining-=playerXpNext(level);level++;if(level%2===1&&rating<p.potential)rating++;}return {...p,stats:nextStats,xp:remaining,level,rating,tier:playerTier(level)};})}));setToast('Training abgeschlossen! Dein Spieler hat Fortschritt gemacht.');}
 function unlock(n){if(n.requires&&!game.unlocked.includes(n.requires)){setToast('Erst die Voraussetzung freischalten.');return;}if(game.development<n.cost){setToast('Noch nicht genug Entwicklungspunkte.');return;}setGame(g=>({...g,development:g.development-n.cost,unlocked:[...g.unlocked,n.id]}));}
 if(!game)return <div className="create-screen"><div className="create-art"><div className="crest-big">🦅</div><div className="stadium-glow"/></div><div className="create-panel"><div className="brand-mark">ADLER <em>LEGENDS</em><small>DEINE GESCHICHTE. DEIN VEREIN.</small></div><span className="kicker">KARRIERE BEGINNEN</span><h1>Schreib deine<br/><em>eigene Legende.</em></h1><p>Gründe deinen Verein, stelle dein Team auf und kämpfe dich aus der Kreisklasse bis an die Spitze Europas.</p><label>VEREINSNAME<input maxLength="24" value={clubDraft.name} onChange={e=>setClubDraft({...clubDraft,name:e.target.value})}/></label><label>KURZNAME / KÜRZEL<input maxLength="4" value={clubDraft.short} onChange={e=>setClubDraft({...clubDraft,short:e.target.value.toUpperCase()})}/></label><label>VEREINSFARBEN<div className="color-picks">{['red','blue','gold','green'].map(c=><button key={c} className={'swatch '+c+(clubDraft.colors===c?' picked':'')} onClick={()=>setClubDraft({...clubDraft,colors:c})}/>)}</div></label><button className="big-action" disabled={!clubDraft.name.trim()||!clubDraft.short.trim()} onClick={()=>setGame(freshGame(clubDraft.name.trim(),clubDraft.short.trim(),clubDraft.colors))}>VEREIN GRÜNDEN <b>→</b></button><small className="save-note">Dein Abenteuer beginnt in der Kreisklasse · Saison 1</small></div></div>;
 const nav=[['home','⌂','Übersicht'],['squad','♟','Mannschaft'],['fixtures','▤','Spielplan'],['training','⚽','Training'],['stadium','🏟','Stadion'],['club','✦','Verein'],['economy','◈','Wirtschaft']];
 const opponent=opponentFor(game);
 return <main className={'game-world theme-'+game.colors}>
  <aside className="game-sidebar"><div className="brand-mark">ADLER <em>LEGENDS</em><small>CLUB MANAGER</small></div><div className="club-identity"><div className="crest-small">🦅</div><div><b>{game.clubName}</b><small>{leagueName(game.division)} · S{game.season}</small></div></div><nav>{nav.map(([id,ico,label])=><button key={id} className={screen===id?'active':''} onClick={()=>setScreen(id)}><span>{ico}</span>{label}</button>)}</nav><div className="sidebar-bottom">● SAISON LÄUFT <small>SPIELTAG {game.matchday} / 34</small></div></aside>
  <section className="game-main"><header className="game-top"><div><span className="kicker">{leagueName(game.division).toUpperCase()} · SAISON {game.season}</span><h1>{nav.find(n=>n[0]===screen)?.[2]||'Spieltag'}</h1></div><div className="wallet"><div>🪙 <b>{Math.floor(game.coins).toLocaleString('de-DE')}</b><small>+{income}/s</small></div><div>👥 <b>{game.fans.toLocaleString('de-DE')}</b><small>Fans</small></div><div>⚡ <b>{power}</b><small>Teamstärke</small></div></div></header>
  {toast&&<button className="toast" onClick={()=>setToast('')}>{toast} ×</button>}
  {screen==='home'&&<div className="game-page"><section className="hero-match"><div className="hero-copy"><span className="kicker">NÄCHSTER SPIELTAG · {game.matchday}. SPIEL</span><h2>Der nächste<br/><em>Schritt nach oben.</em></h2><p>Die Liga wartet. Deine Mannschaft ist bereit. Jeder Spieltag zählt auf dem Weg zur Meisterschaft.</p><button className="big-action" onClick={startMatch}>SPIELTAG STARTEN <b>▶</b></button></div><div className="versus-card"><div className="versus-team"><div className="team-crest">{game.shortName.slice(0,1)}</div><b>{game.clubName}</b><small>HEIM</small></div><div className="versus-mid"><span>VS</span><small>SPIEL {game.matchday}</small></div><div className="versus-team"><div className="team-crest rival">{opponent[0].slice(0,1)}</div><b>{opponent[0]}</b><small>GAST</small></div><div className="versus-bottom">🏟 {game.buildings.stadium<3?'Sportplatz am Waldrand':'Adler-Arena'} <span>· Anstoß 15:30</span></div></div></section>
  <div className="stat-strip"><div><small>BILANZ</small><b>{game.wins} S · {game.draws} U · {game.losses} N</b></div><div><small>SAISONZIEL</small><b>Aufstieg in die Kreisliga</b></div><div><small>ENTWICKLUNG</small><b>{Math.floor(game.development)} Punkte</b></div><div><small>PRESTIGE</small><b>★ {game.prestige}</b></div></div>
  {game.lastMatch&&<div className="last-score"><span>LETZTES ERGEBNIS</span><b>{game.lastMatch.homeScore} : {game.lastMatch.awayScore}</b><strong>{game.lastMatch.opponent}</strong><small>{game.lastMatch.promote?'AUFSTIEG GESCHAFFT!':game.lastMatch.won?'SIEG':'SPIEL BEENDET'} · +{game.lastMatch.reward} COINS</small></div>}
  <section className="section-head"><div><span className="kicker">DEIN CLUB</span><h2>Der Weg zur Legende</h2></div><small>BAUE. ENTWICKLE. SIEGE.</small></section><div className="world-cards"><button onClick={()=>setScreen('squad')}><span>♟</span><b>Mannschaft</b><small>Deine Spieler & Teamstärke</small></button><button onClick={()=>setScreen('training')}><span>⚽</span><b>Trainingszentrum</b><small>Werte und Fitness verbessern</small></button><button onClick={()=>setScreen('stadium')}><span>🏟️</span><b>Stadion</b><small>Dein Zuhause ausbauen</small></button></div></div>}
  {screen==='match'&&<div className="game-page"><MatchAudio match={match} game={game}/><div className="match-stage"><div className="match-scorebar"><div><small>{game.clubName}</small><b>{match?.homeScore??0}</b></div><div className="match-clock">{match?.status==='done'?'ABPFIFF':match?.minute+"'"}<small>{match?.status==='done'?'ENDSTAND':'LIVE-SIMULATION'}</small></div><div><small>{match?.opponent}</small><b>{match?.awayScore??0}</b></div></div><MatchArena match={match} game={game}/><div className="match-controls">{match?.status==='live'?<><div className="live-indicator">● LIVE · DIE PARTIE LÄUFT</div><div className="match-progress"><i style={{width:(match.minute/90*100)+'%'}}/></div><p>Die Simulation läuft Minute für Minute. Jedes Tor und jede wichtige Szene wird protokolliert.</p></>:<><b>ABGEPFIFFEN</b><p>{match?.homeScore>match?.awayScore?'Was für ein Auftritt! Deine Mannschaft holt den Sieg.':match?.homeScore===match?.awayScore?'Ein umkämpftes Unentschieden.':'Heute hat es nicht gereicht. Weiterarbeiten!'}</p><button className="big-action" onClick={()=>setScreen('fixtures')}>ZUM SPIELPLAN →</button></>}</div></div><div className="event-log"><h3>SPIELBERICHT</h3>{match?.feed.length?match.feed.map((e,i)=><div className={'event '+e.side} key={i}><b>{e.minute}'</b><span>{e.text}</span></div>):<p>Der Ball rollt. Die ersten Minuten laufen …</p>}</div></div>}
  {screen==='squad'&&<div className="game-page"><div className="section-head"><div><span className="kicker">KADER · {game.squad.length} SPIELER</span><h2>Die Adler-Elf</h2></div><b className="power-pill">⚡ {power} STÄRKE</b></div><div className="squad-layout"><div className="tactics-pitch"><div className="formation-label">4 – 3 – 3</div>{game.squad.map((raw,i)=>{const p=normalizePlayer(raw,i);return <button className={'player-dot p'+i+(selectedPlayerId===p.id?' selected':'')} key={p.id} onClick={()=>setSelectedPlayerId(p.id)}><b>{p.rating}</b><small>{p.pos}</small></button>})}</div><div className="player-list">{game.squad.map((raw,i)=>{const p=normalizePlayer(raw,i);return <button className={'player-row rarity-'+p.rarity+(selectedPlayerId===p.id?' chosen':'')} key={p.id} onClick={()=>setSelectedPlayerId(p.id)}><b className="player-rating">{p.rating}</b><div><strong>{p.name}</strong><small>{p.pos} · Lv. {p.level} · {p.tier}</small></div><span>{rarityName(p.rarity)}</span></button>})}</div></div><PlayerDevelopment player={normalizePlayer(game.squad.find(p=>p.id===selectedPlayerId)||game.squad[0],0)} onTrain={trainPlayer}/></div>}
  {screen==='fixtures'&&<div className="game-page"><div className="section-head"><div><span className="kicker">KREISKLASSE · SPIELTAG {game.matchday}</span><h2>Spielplan & Ergebnisse</h2></div><button className="big-action" onClick={startMatch}>NÄCHSTES SPIEL ▶</button></div><div className="fixture-card next"><span>NÄCHSTE PARTIE · {game.matchday}. SPIELTAG</span><div><b>{game.clubName}</b><strong>VS</strong><b>{opponent[0]}</b></div><small>Gegnerstärke {opponent[1]} · {game.matchday%2?'Heimspiel':'Auswärtsspiel'}</small></div>{game.lastMatch&&<div className="fixture-card"><span>LETZTES ERGEBNIS</span><div><b>{game.clubName}</b><strong>{game.lastMatch.homeScore} : {game.lastMatch.awayScore}</strong><b>{game.lastMatch.opponent}</b></div><small>{game.lastMatch.won?'Sieg':game.lastMatch.draw?'Unentschieden':'Niederlage'}</small></div>}<div className="league-table"><h3>TABELLE · DEIN VEREIN</h3><div className="table-head"><span>PL</span><span>VEREIN</span><span>SP</span><span>PKT</span></div><div className="table-row own"><b>1</b><strong>{game.clubName}</strong><span>{game.wins+game.draws+game.losses}</span><b>{game.wins*3+game.draws}</b></div>{OPPONENTS.slice(0,9).map((o,i)=><div className="table-row" key={o[0]}><span>{i+2}</span><span>{o[0]}</span><span>{Math.max(0,game.matchday-1)}</span><span>{Math.max(0,20-i*2+game.matchday)}</span></div>)}</div></div>}
  {screen==='training'&&<div className="game-page"><div className="section-head"><div><span className="kicker">LEISTUNGSZENTRUM</span><h2>Training & Entwicklung</h2></div><b className="power-pill">{Math.floor(game.development)} ENTWICKLUNGSPUNKTE</b></div><p className="intro-text">Deine Spieler werden mit jeder Einheit besser. Investiere in Trainingsplätze und entwickle die Stärken deines Teams.</p>{BUILDINGS.filter(b=>b.id==='training').map(b=><BuildingCard key={b.id} b={b} game={game} upgrade={upgrade}/>)}<div className="unlock-grid">{NODES.filter(n=>n.branch==='Team').map(n=><NodeCard key={n.id} n={n} game={game} unlock={unlock}/>)}</div></div>}
  {screen==='stadium'&&<div className="game-page"><div className="section-head"><div><span className="kicker">UNSER ZUHAUSE</span><h2>Die Adler-Arena</h2></div><b>STUFE {game.buildings.stadium}</b></div><div className="stadium-art"><div className="stadium-roof"/><div className="stadium-stands">ADLER · ADLER · ADLER · ADLER</div><div className="stadium-field"/></div><p className="intro-text">Aus dem kleinen Sportplatz wird eine echte Fußballarena. Jeder Ausbau bringt mehr Kapazität, Fans und Einnahmen.</p>{BUILDINGS.filter(b=>b.id==='stadium').map(b=><BuildingCard key={b.id} b={b} game={game} upgrade={upgrade}/>)}</div>}
  {screen==='club'&&<div className="game-page"><div className="section-head"><div><span className="kicker">VEREINSENTWICKLUNG</span><h2>Dein Club, deine Vision</h2></div></div><div className="unlock-grid">{NODES.filter(n=>n.branch!=='Team').map(n=><NodeCard key={n.id} n={n} game={game} unlock={unlock}/>)}</div></div>}
  {screen==='economy'&&<div className="game-page"><div className="section-head"><div><span className="kicker">VEREINSKASSE</span><h2>Wirtschaft & Sponsoren</h2></div><b>+{income} COINS / SEK.</b></div><p className="intro-text">Baue Fanshop und Gastronomie aus. Dein Verein verdient auch dann, wenn du gerade nicht spielst.</p>{BUILDINGS.filter(b=>b.id==='food').map(b=><BuildingCard key={b.id} b={b} game={game} upgrade={upgrade}/>)}<NodeCard n={NODES.find(n=>n.id==='canteen')} game={game} unlock={unlock}/><NodeCard n={NODES.find(n=>n.id==='shop')} game={game} unlock={unlock}/></div>}
  <div className="game-footer">ADLER LEGENDS <span>VOM KREISKLASSE-PLATZ ZUM TRIPLE.</span></div></section>
  <nav className="mobile-game-nav">{nav.slice(0,5).map(([id,ico,label])=><button key={id} className={screen===id?'active':''} onClick={()=>setScreen(id)}><span>{ico}</span><small>{label}</small></button>)}</nav>
 </main>;
}



function MatchAudio({match,game}){
 const [enabled,setEnabled]=useState(false);
 const [volume,setVolume]=useState(55);
 const audioRef=useRef(null);
 const lastEvent=useRef('');
 const leagueLevel=Math.max(0,Math.min(10,11-game.division));
 useEffect(()=>{
  if(!enabled||match?.status!=='live')return;
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return;
  const ctx=new AudioCtx();audioRef.current=ctx;
  const master=ctx.createGain();master.gain.value=volume/100;master.connect(ctx.destination);
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450+leagueLevel*115;filter.connect(master);
  const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.28;
  const crowd=ctx.createBufferSource();crowd.buffer=buffer;crowd.loop=true;
  const crowdGain=ctx.createGain();crowdGain.gain.value=.10+leagueLevel*.035;crowd.connect(filter);filter.connect(crowdGain);crowdGain.connect(master);crowd.start();
  const hum=ctx.createOscillator();hum.type='sawtooth';hum.frequency.value=75+leagueLevel*9;
  const humGain=ctx.createGain();humGain.gain.value=.012+leagueLevel*.003;hum.connect(humGain);humGain.connect(master);hum.start();
  return ()=>{try{crowd.stop();hum.stop();ctx.close();}catch{}};
 },[enabled,match?.status,leagueLevel,volume]);
 useEffect(()=>{
  if(!enabled||!match)return;
  const ctx=audioRef.current;if(!ctx||ctx.state==='closed')return;
  const latest=match.feed?.[0];if(!latest||lastEvent.current===latest.minute+latest.text)return;
  lastEvent.current=latest.minute+latest.text;
  const now=ctx.currentTime;
  const tone=(freq,dur,type='sine',gain=.1)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.001,now+dur);o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+dur);};
  if(latest.text.includes('Tor')){tone(115,.16,'triangle',.18);tone(440,.35,'sine',.08);}
  else if(latest.text.includes('Karte'))tone(1450,.22,'square',.035);
  else tone(170,.09,'triangle',.12);
  if(latest.text.includes('Tor')&&window.speechSynthesis){const u=new SpeechSynthesisUtterance('Toooor!');u.lang='de-DE';u.rate=.85;u.volume=volume/100;window.speechSynthesis.speak(u);}
 },[match?.feed?.[0]?.minute,enabled,volume]);
 const coach=()=>{if(!enabled)return;const lines=leagueLevel>7?['Weiter, weiter!','Raus auf den Ball!','Zusammen bleiben!']:leagueLevel>3?['Verschieben!','Druck machen!','Hintermann sichern!']:['Auf gehts!','Spiel den Pass!','Bleib dran!'];if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(lines[Math.floor(Math.random()*lines.length)]);u.lang='de-DE';u.rate=1.08;u.volume=volume/100;window.speechSynthesis.speak(u);}};
 return <div className="match-audio-panel"><div className="audio-label"><span>🔊 MATCH-SOUND</span><small>{leagueLevel>7?'KREISKLASSE-SPORTPLATZ':leagueLevel>3?'LIGA-STADION':'GROSSE STADIONKULISSE'}</small></div><button className={enabled?'audio-toggle active':'audio-toggle'} onClick={()=>{setEnabled(v=>!v);if(!enabled&&audioRef.current?.state==='suspended')audioRef.current.resume();}}>{enabled?'SOUND AN':'SOUND AUS'}</button><input aria-label="Match-Lautstärke" type="range" min="0" max="100" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><button className="coach-call" onClick={coach} disabled={!enabled}>📣 Trainer-Ruf</button></div>;
}
\nfunction PlayerDevelopment({player,onTrain}){
 if(!player)return null;
 const xpPct=Math.min(100,player.xp/playerXpNext(player.level)*100);
 const fields=[['tempo','Tempo','⚡'],['schuss','Schuss','🎯'],['pass','Passspiel','🧭'],['technik','Technik','✨'],['verteidigung','Verteidigung','🛡️'],['physis','Physis','💪']];
 return <section className={'player-development rarity-panel-'+player.rarity}>
  <div className="player-profile-head"><div className={'player-avatar rarity-avatar-'+player.rarity}>{player.pos==='TW'?'🧤':'⚽'}</div><div className="player-profile-title"><span className="kicker">SPIELERENTWICKLUNG · {rarityName(player.rarity).toUpperCase()}</span><h2>{player.name}</h2><small>{player.pos} · {player.tier} · Potenzial {player.potential}</small></div><div className="player-overall"><b>{player.rating}</b><small>GES</small></div></div>
  <div className="level-line"><b>LEVEL {player.level}</b><span>{player.xp} / {playerXpNext(player.level)} XP</span></div><div className="xp-track"><i style={{width:xpPct+'%'}}/></div>
  <div className="attribute-grid">{fields.map(([key,label,icon])=><div className="attribute" key={key}><div><span>{icon} {label}</span><b>{player.stats[key]}</b></div><div className="attribute-track"><i style={{width:player.stats[key]+'%'}}/></div></div>)}</div>
  <div className="training-actions"><div><b>Gezieltes Einzeltraining</b><small>+1 Attribut · +40 XP · 14 Entwicklungspunkte</small></div><div className="training-buttons">{fields.map(([key,label])=><button key={key} disabled={player.stats[key]>=Math.min(99,player.potential)} onClick={()=>onTrain(player.id,key)}>{label} trainieren</button>)}</div></div>
  <div className="evolution-track"><span className={player.level>=1?'reached':''}>Talent</span><i/><span className={player.level>=5?'reached':''}>Stammkraft</span><i/><span className={player.level>=10?'reached':''}>Leistungsträger</span><i/><span className={player.level>=15?'reached':''}>Legende</span></div>
 </section>;
}
\nfunction MatchArena({match,game}){
 const minute=match?.minute||0;
 const home=[[50,88],[17,73],[37,76],[63,76],[83,73],[30,53],[50,60],[70,53],[22,29],[50,22],[78,29]];
 const away=[[50,12],[17,27],[37,24],[63,24],[83,27],[30,47],[50,40],[70,47],[22,71],[50,78],[78,71]];
 const phase=(minute%24)/24;
 const ballX=match?.status==='done'?50:(minute%18<9?18+phase*64:82-phase*64);
 const ballY=match?.status==='done'?50:50+Math.sin(minute*.7)*17;
 const move=(p,i,side)=>{const drift=Math.sin(minute*.31+i*1.7)*2.8;const press=Math.sin(minute*.13+i)*4;return {x:Math.max(7,Math.min(93,p[0]+(side==='home'?press:-press))),y:Math.max(6,Math.min(94,p[1]+drift))};};
 return <div className="match-pitch live-pitch">
  <div className="stadium-crowd">ADLER-ARENA　·　DIE FANS SIND LAUT</div>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Live-Ansicht des Fußballspiels mit beiden Mannschaften">
   <defs><pattern id="grass" width="20" height="100" patternUnits="userSpaceOnUse"><rect width="10" height="100" fill="#ffffff08"/></pattern><filter id="glow"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <rect width="100" height="100" fill="#28613d"/><rect width="100" height="100" fill="url(#grass)"/>
   <rect x="2" y="3" width="96" height="94" fill="none" stroke="#eaf2e7" strokeWidth=".65"/>
   <path d="M50 3V97 M2 50H98" stroke="#eaf2e7" strokeWidth=".55" fill="none"/>
   <circle cx="50" cy="50" r="11" stroke="#eaf2e7" strokeWidth=".55" fill="none"/>
   <rect x="2" y="35" width="12" height="30" stroke="#eaf2e7" strokeWidth=".55" fill="none"/><rect x="86" y="35" width="12" height="30" stroke="#eaf2e7" strokeWidth=".55" fill="none"/>
   <rect x="0" y="43" width="2" height="14" fill="#dce7d9"/><rect x="98" y="43" width="2" height="14" fill="#dce7d9"/>
   {home.map((p,i)=>{const q=move(p,i,'home');return <g key={'h'+i} style={{transition:'all .42s ease'}}><circle cx={q.x} cy={q.y} r="2.15" fill="#f0eee8" stroke="#bd3448" strokeWidth="1.05"/><text x={q.x} y={q.y+.7} textAnchor="middle" fontSize="1.8" fontWeight="bold" fill="#9e2435">{i+1}</text></g>;})}
   {away.map((p,i)=>{const q=move(p,i,'away');return <g key={'a'+i} style={{transition:'all .42s ease'}}><circle cx={q.x} cy={q.y} r="2.15" fill="#e6c77d" stroke="#263d57" strokeWidth="1.05"/><text x={q.x} y={q.y+.7} textAnchor="middle" fontSize="1.8" fontWeight="bold" fill="#263d57">{i+1}</text></g>;})}
   <circle cx={ballX} cy={ballY} r="1.4" fill="#fff" stroke="#151515" strokeWidth=".45" filter="url(#glow)"/>
  </svg>
  <div className="pitch-legend"><span><i/> {game.shortName} · 4-3-3</span><span><i/> {match?.opponent} · 4-3-3</span></div>
  <div className="pitch-caption">BALLBESIT & POSITIONSSPIEL · MINUTE {minute}</div>
 </div>;
}
function BuildingCard({b,game,upgrade}){const level=game.buildings[b.id]||0,cost=Math.floor(b.base*Math.pow(1.7,level));return <div className="building-card"><span>{b.icon}</span><div><b>{b.name}</b><small>Stufe {level} · {b.desc}</small></div><button onClick={()=>upgrade(b.id)}>AUSBAUEN · {cost} 🪙</button></div>}
function NodeCard({n,game,unlock}){if(!n)return null;const yes=game.unlocked.includes(n.id),locked=n.requires&&!game.unlocked.includes(n.requires);return <div className="node-card"><span>{n.icon}</span><div><b>{n.name}</b><small>{n.desc}</small></div><button disabled={yes||locked||game.development<n.cost} onClick={()=>unlock(n)}>{yes?'FREI':n.cost+' EP'}</button></div>}
export default App;
