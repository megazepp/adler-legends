import { useEffect, useMemo, useState } from 'react';

const SAVE_KEY = 'adler-legends-incremental-v2';
const NODES = [
  { id: 'fitness', branch: 'Spieler', name: 'Athletik-Grundlagen', desc: '+15 % Teamstärke', cost: 120, icon: '🏃', effect: 'power' },
  { id: 'coach', branch: 'Spieler', name: 'Erster Co-Trainer', desc: 'Training produziert Entwicklungspunkte', cost: 260, icon: '🧑‍🏫', effect: 'training' },
  { id: 'synergy', branch: 'Spieler', name: 'Adler-DNA', desc: 'Spieler-Synergie: +35 % Teamstärke', cost: 850, icon: '🧬', effect: 'synergy', requires: 'fitness' },
  { id: 'grounds', branch: 'Infrastruktur', name: 'Zweiter Trainingsplatz', desc: '+3 Entwicklungspunkte / Sek.', cost: 180, icon: '🌱', effect: 'training' },
  { id: 'academy', branch: 'Infrastruktur', name: 'Nachwuchsakademie', desc: '+2 Teamstärke / Saison', cost: 520, icon: '🎓', effect: 'power', requires: 'grounds' },
  { id: 'canteen', branch: 'Wirtschaft', name: 'Vereinskantine', desc: '+4 Coins / Sek.', cost: 150, icon: '🍲', effect: 'income' },
  { id: 'shop', branch: 'Wirtschaft', name: 'Fanshop', desc: '+9 Coins / Sek.', cost: 430, icon: '🛍️', effect: 'income', requires: 'canteen' },
  { id: 'automation', branch: 'Automatisierung', name: 'Geschäftsstellen-Team', desc: 'Alle Einnahmen +50 %', cost: 1100, icon: '⚙️', effect: 'multiplier', requires: 'shop' },
  { id: 'chef', branch: 'Personal', name: 'Vereinskoch', desc: 'Kantine arbeitet automatisch: +8 Coins / Sek.', cost: 700, icon: '👨‍🍳', effect: 'income', requires: 'canteen' },
  { id: 'analyst', branch: 'Personal', name: 'Datenanalyst', desc: 'Spielsimulationen: +20 % Belohnung', cost: 950, icon: '📊', effect: 'reward', requires: 'coach' },
];
const BUILDINGS = [
  { id: 'training', name: 'Trainingsgelände', icon: '🌱', base: 90, gain: 'Entwicklung', description: 'Bessere Plätze und moderne Trainingsgeräte.' },
  { id: 'stadium', name: 'Stadion', icon: '🏟️', base: 150, gain: 'Fans & Prestige', description: 'Mehr Plätze, Tribünen und Flutlicht.' },
  { id: 'office', name: 'Geschäftsstelle', icon: '🏢', base: 130, gain: 'Automatisierung', description: 'Personal und Vereinsabläufe.' },
  { id: 'food', name: 'Verkaufsstellen', icon: '🍔', base: 110, gain: 'Coins / Sek.', description: 'Kioske, Fanshop und Gastronomie.' },
];
const INITIAL = {
  coins: 180, fans: 42, prestige: 0, wins: 0, losses: 0, season: 1, division: 11,
  teamPower: 18, development: 90, lastSeen: Date.now(), unlocked: [], buildings: { training: 1, stadium: 1, office: 1, food: 0 }, lastMatch: null,
};
function readSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!data) return INITIAL;
    const elapsed = Math.min(8 * 3600, Math.max(0, (Date.now() - data.lastSeen) / 1000));
    const income = incomePerSecond(data);
    return { ...INITIAL, ...data, coins: data.coins + Math.floor(elapsed * income), development: (data.development || 0) + Math.floor(elapsed * trainingPerSecond(data)), offlineGain: Math.floor(elapsed * income) };
  } catch { return INITIAL; }
}
function incomePerSecond(g) {
  const b = g.buildings || INITIAL.buildings;
  let value = 1 + b.food * 2 + (g.unlocked?.includes('canteen') ? 4 : 0) + (g.unlocked?.includes('shop') ? 9 : 0) + (g.unlocked?.includes('chef') ? 8 : 0);
  if (g.unlocked?.includes('automation')) value *= 1.5;
  return value;
}
function trainingPerSecond(g) {
  return (g.buildings?.training || 1) * (g.unlocked?.includes('grounds') ? 3 : 0.4) + (g.unlocked?.includes('coach') ? 1 : 0);
}
function powerOf(g) {
  let p = g.teamPower + (g.buildings?.training || 1) * 2 + (g.unlocked?.includes('fitness') ? 8 : 0) + (g.unlocked?.includes('academy') ? g.season * 2 : 0);
  if (g.unlocked?.includes('synergy')) p *= 1.35;
  return Math.round(p);
}
function divisionName(d) {
  return d >= 11 ? 'Kreisklasse' : d === 10 ? 'Kreisliga' : d === 9 ? 'Bezirksliga' : d === 8 ? 'Landesliga' : d === 7 ? 'Verbandsliga' : d === 6 ? 'Oberliga' : d === 5 ? 'Regionalliga' : d === 4 ? '3. Liga' : d === 3 ? '2. Bundesliga' : d === 2 ? 'Bundesliga' : 'Champions League';
}
function App() {
  const [game, setGame] = useState(readSave);
  const [screen, setScreen] = useState('overview');
  const [toast, setToast] = useState('');
  const [matchBusy, setMatchBusy] = useState(false);
  const power = useMemo(() => powerOf(game), [game]);
  const income = useMemo(() => incomePerSecond(game), [game]);
  const trainingRate = useMemo(() => trainingPerSecond(game), [game]);
  const tier = game.division <= 2 ? 4 : game.division <= 5 ? 3 : game.division <= 8 ? 2 : 1;

  useEffect(() => {
    const timer = setInterval(() => setGame(g => ({ ...g, coins: g.coins + incomePerSecond(g), development: g.development + trainingPerSecond(g), lastSeen: Date.now() })), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...game, lastSeen: Date.now() }));
  }, [game]);

  function upgradeBuilding(id) {
    const current = game.buildings[id] || 0;
    const def = BUILDINGS.find(b => b.id === id);
    const cost = Math.floor(def.base * Math.pow(1.72, current));
    if (game.coins < cost) return setToast('Dafür fehlen noch Vereins-Coins.');
    setGame(g => ({ ...g, coins: g.coins - cost, buildings: { ...g.buildings, [id]: current + 1 } }));
    setToast(`${def.name} wurde auf Stufe ${current + 1} ausgebaut.`);
  }
  function unlockNode(node) {
    if (game.unlocked.includes(node.id)) return;
    if (node.requires && !game.unlocked.includes(node.requires)) return setToast('Schalte zuerst die Voraussetzung frei.');
    if (game.development < node.cost) return setToast('Es fehlen noch Entwicklungspunkte.');
    setGame(g => ({ ...g, development: g.development - node.cost, unlocked: [...g.unlocked, node.id] }));
    setToast(`${node.name} freigeschaltet!`);
  }
  function simulateMatch(type = 'league') {
    if (matchBusy) return;
    setMatchBusy(true);
    window.setTimeout(() => {
      setGame(g => {
        const strength = powerOf(g);
        const opponent = Math.round(12 + (12 - g.division) * 8 + g.season * 2 + Math.random() * 18);
        const scoreA = Math.max(0, Math.floor(Math.random() * 3 + (strength - opponent) / 22));
        const scoreB = Math.max(0, Math.floor(Math.random() * 3 + (opponent - strength) / 25));
        const won = scoreA > scoreB;
        const draw = scoreA === scoreB;
        const multiplier = g.unlocked.includes('analyst') ? 1.2 : 1;
        const reward = Math.round((won ? 65 : draw ? 35 : 20) * multiplier * (1 + (12 - g.division) * 0.08));
        const wins = g.wins + (won ? 1 : 0);
        const promote = type === 'league' && won && wins % 4 === 0 && g.division > 1;
        return { ...g, coins: g.coins + reward, fans: g.fans + (won ? 12 : draw ? 4 : 1), prestige: g.prestige + (won ? 5 : 1), wins, losses: g.losses + (!won && !draw ? 1 : 0), division: promote ? g.division - 1 : g.division, season: promote ? g.season + 1 : g.season, teamPower: g.teamPower + (won ? 1 : 0), lastMatch: { scoreA, scoreB, won, draw, reward, type, promote } };
      });
      setMatchBusy(false);
      setToast('Die Partie wurde vollständig simuliert.');
    }, 850);
  }
  const stadiumLevel = game.buildings.stadium;
  const venue = stadiumLevel < 3 ? 'Sportplatz am Ortsrand' : stadiumLevel < 6 ? 'Kleines Vereinsstadion' : stadiumLevel < 10 ? 'Moderne Fußballarena' : 'Internationales Fußballstadion';

  const nav = [
    ['overview','⌂','Verein'], ['development','✦','Entwicklung'], ['training','⚽','Trainingsgelände'],
    ['stadium','▤','Stadion'], ['office','▦','Geschäftsstelle'], ['economy','◈','Wirtschaft'], ['matches','◉','Wettbewerbe'],
  ];
  return <main className={`game tier-${tier}`}>
    <aside className="sidebar">
      <div className="logo"><div className="logo-emblem">A</div><div><b>ADLER <i>LEGENDS</i></b><small>BUILD YOUR LEGACY</small></div></div>
      <div className="club-mini"><div className="club-badge">🦅</div><div><b>FC Adler</b><small>{divisionName(game.division)}</small></div></div>
      <nav>{nav.map(([id,icon,label]) => <button key={id} className={screen===id?'selected':''} onClick={()=>setScreen(id)}><span>{icon}</span>{label}</button>)}</nav>
      <div className="sidebar-bottom"><span className="online-dot"/> AUTOSAVE AKTIV <small>SAISON {game.season}</small></div>
    </aside>
    <section className="main-area">
      <header className="topbar">
        <div><span className="eyebrow">DEIN VEREIN · DEINE ENTWICKLUNG</span><h1>{nav.find(n=>n[0]===screen)?.[2] || 'Verein'}</h1></div>
        <div className="resources"><Resource icon="🪙" value={Math.floor(game.coins).toLocaleString('de-DE')} label={`+${income.toFixed(1)}/s`}/><Resource icon="👥" value={game.fans.toLocaleString('de-DE')} label="Fans"/><Resource icon="⭐" value={game.prestige.toLocaleString('de-DE')} label="Prestige"/></div>
      </header>
      {game.offlineGain > 0 && <div className="offline-note">🌙 Während deiner Abwesenheit hat dein Verein {game.offlineGain.toLocaleString('de-DE')} Coins erwirtschaftet.</div>}
      {toast && <button className="toast" onClick={()=>setToast('')}>{toast} <b>×</b></button>}
      {screen==='overview' && <Overview game={game} power={power} income={income} venue={venue} onNavigate={setScreen} onMatch={()=>simulateMatch('league')} busy={matchBusy}/>}
      {screen==='development' && <Development game={game} onUnlock={unlockNode}/>}
      {screen==='training' && <Facilities game={game} kind="training" onUpgrade={upgradeBuilding} power={power}/>}
      {screen==='stadium' && <Facilities game={game} kind="stadium" onUpgrade={upgradeBuilding} power={power} venue={venue}/>}
      {screen==='office' && <Facilities game={game} kind="office" onUpgrade={upgradeBuilding}/>}
      {screen==='economy' && <Economy game={game} onUpgrade={upgradeBuilding} income={income}/>}
      {screen==='matches' && <Matches game={game} onMatch={simulateMatch} busy={matchBusy}/>}
      <footer><span>ADLER LEGENDS</span><span>VOM KREISLIGAPLATZ ZUM TRIPLE.</span></footer>
    </section>
    <nav className="mobile-nav">{nav.slice(0,5).map(([id,icon,label])=><button key={id} className={screen===id?'selected':''} onClick={()=>setScreen(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>
  </main>;
}
function Resource({icon,value,label}) { return <div className="resource"><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>; }
function PanelTitle({tag,title,desc}) { return <div className="panel-title"><div><span>{tag}</span><h2>{title}</h2></div><p>{desc}</p></div>; }
function Overview({game,power,income,venue,onNavigate,onMatch,busy}) {
  return <div className="page">
    <section className="welcome-banner"><div className="welcome-copy"><span className="eyebrow">SAISON {String(game.season).padStart(2,'0')} · DER ANFANG EINER ÄRA</span><h2>Vom kleinen Platz<br/><em>nach ganz oben.</em></h2><p>Ein Verein. Große Träume. Baue deine Infrastruktur aus, entwickle dein Team und kämpfe dich bis an die Weltspitze.</p><button className="primary" onClick={onMatch} disabled={busy}>{busy?'SIMULIERE…':'NÄCHSTES SPIEL SIMULIEREN'} <b>→</b></button></div><div className={`ground-scene stage-${Math.min(4,Math.ceil(game.buildings.stadium/3))}`}><div className="scene-lights"/><div className="scene-stand"><span>FC ADLER</span><span>FC ADLER</span></div><div className="scene-pitch"><div className="scene-circle"/></div><div className="scene-label">{venue.toUpperCase()}</div></div></section>
    <div className="metric-grid"><Metric icon="⚡" label="TEAMSTÄRKE" value={power}/><Metric icon="🏆" label="LIGA" value={game.division===1?'Bundesliga':divisionName(game.division)}/><Metric icon="📈" label="SIEGE" value={game.wins}/><Metric icon="🪙" label="EINNAHMEN" value={`+${income.toFixed(1)} / Sek.`}/></div>
    {game.lastMatch && <section className="last-result"><div><span>LETZTES ERGEBNIS</span><b>{game.lastMatch.scoreA} : {game.lastMatch.scoreB}</b><small>{game.lastMatch.won?'Sieg eingefahren':game.lastMatch.draw?'Unentschieden':'Niederlage'} · +{game.lastMatch.reward} Coins</small></div>{game.lastMatch.promote&&<strong>AUFSTIEG! 🎉</strong>}</section>}
    <PanelTitle tag="DEIN VEREIN" title="Was möchtest du ausbauen?" desc="Jede Investition bringt deinen Club einen Schritt weiter."/>
    <div className="shortcut-grid"><Shortcut icon="✦" title="Entwicklungsbaum" text="Neue Systeme und Synergien" onClick={()=>onNavigate('development')}/><Shortcut icon="🌱" title="Trainingsgelände" text="Spieler und Trainingsplätze" onClick={()=>onNavigate('training')}/><Shortcut icon="🏟️" title="Stadion" text="Kapazität und Atmosphäre" onClick={()=>onNavigate('stadium')}/><Shortcut icon="🍔" title="Vereinswirtschaft" text="Automatische Einnahmen" onClick={()=>onNavigate('economy')}/></div>
    <section className="goal-banner"><div><span>ULTIMATIVES SAISonzIEL</span><h3>Das Triple. Eine Legende.</h3><p>Bundesliga · DFB-Pokal · Champions League</p></div><div className="trophy-row">🏆 🏆 🏆</div></section>
  </div>;
}
function Metric({icon,label,value}) { return <div className="metric"><span>{icon}</span><div><small>{label}</small><b>{value}</b></div></div>; }
function Shortcut({icon,title,text,onClick}) { return <button className="shortcut" onClick={onClick}><span>{icon}</span><b>{title}</b><small>{text}</small><i>ÖFFNEN →</i></button>; }
function Development({game,onUnlock}) {
  const branches=['Spieler','Infrastruktur','Personal','Wirtschaft','Automatisierung'];
  return <div className="page"><PanelTitle tag="FORSCHUNG & FORTSCHRITT" title="Der Entwicklungsbaum" desc="Investiere in deinen Verein. Kombiniere Freischaltungen und erschaffe mächtige Synergien."/>
    <div className="tree-intro"><div><b>✦ Entwicklungspunkte</b><strong>{Math.floor(game.development).toLocaleString('de-DE')}</strong></div><p>Dein Verein sammelt kontinuierlich Erfahrung. Coins finanzieren die Freischaltungen.</p></div>
    {branches.map(branch=><section className="branch" key={branch}><h3>{branch}</h3><div className="node-grid">{NODES.filter(n=>n.branch===branch).map(node=>{const unlocked=game.unlocked.includes(node.id);const locked=node.requires&&!game.unlocked.includes(node.requires);return <article className={`node ${unlocked?'unlocked':''} ${locked?'locked':''}`} key={node.id}><div className="node-icon">{node.icon}</div><div className="node-copy"><b>{node.name}</b><small>{node.desc}</small>{node.requires&&<em>Voraussetzung: {NODES.find(n=>n.id===node.requires)?.name}</em>}</div><button disabled={unlocked} onClick={()=>onUnlock(node)}>{unlocked?'✓ FREI':`✦ ${node.cost}`}</button></article>})}</div></section>)}
  </div>;
}
function Facilities({game,kind,onUpgrade,power,venue}) {
  const def=BUILDINGS.find(b=>b.id===kind);const level=game.buildings[kind]||0;const cost=Math.floor(def.base*Math.pow(1.72,level));
  const descriptions={training:['Platz mit Kreidelinien','Zwei gepflegte Trainingsplätze','Trainingszentrum mit Fitnessbereich','Modernes Leistungszentrum'],stadium:['Einfacher Sportplatz','Kleine überdachte Tribüne','Flutlicht und neue Ränge','Moderne Arena mit VIP-Bereich'],office:['Ein Raum im Vereinsheim','Kleine Geschäftsstelle','Mehrere Abteilungen','Professionelles Club-Hauptquartier'],food:['Ein Getränkestand','Kiosk und Imbiss','Fanshop und Gastronomie','Kommerzielle Vereinswelt']};
  return <div className="page"><PanelTitle tag="VEREINSENTWICKLUNG" title={def.name} desc={def.description}/><div className={`facility-visual facility-${kind} stage-${Math.min(4,Math.max(1,level))}`}><div className="facility-sky"/><div className="facility-object">{def.icon}</div><div className="facility-scene-title">{descriptions[kind][Math.min(3,Math.floor((level-1)/2))]}</div><div className="facility-scene-level">AUSBAUSTUFE {level}</div></div><div className="facility-detail"><div><span>AKTUELLER AUSBAU</span><h3>{descriptions[kind][Math.min(3,Math.floor((level-1)/2))]}</h3><p>{kind==='stadium'?venue:`Dein ${def.name.toLowerCase()} entwickelt sich mit jeder Ausbaustufe sichtbar weiter.`}</p></div><div className="facility-level"><small>STUFE</small><b>{level}</b></div></div><div className="upgrade-card"><div><span>NÄCHSTE VERBESSERUNG</span><h3>{def.gain} steigern</h3><p>Jede Stufe verbessert die Leistungsfähigkeit deines Vereins.</p></div><button className="primary" onClick={()=>onUpgrade(kind)}>AUSBAUEN · 🪙 {cost.toLocaleString('de-DE')}</button></div></div>;
}
function Economy({game,onUpgrade,income}) {
  return <div className="page"><PanelTitle tag="VEREINSBETRIEB" title="Wirtschaft & Einnahmen" desc="Baue Verkaufsstellen auf und lass deinen Verein automatisch Geld verdienen."/><div className="economy-total"><span>PASSIVES EINKOMMEN</span><b>🪙 {income.toFixed(1)} <small>Coins / Sekunde</small></b></div><div className="economy-grid">{BUILDINGS.filter(b=>b.id==='food'||b.id==='office').map(b=><FacilityCard key={b.id} b={b} game={game} onUpgrade={onUpgrade}/>) }{NODES.filter(n=>['canteen','shop','chef','automation'].includes(n.id)).map(n=><div className="economy-card" key={n.id}><span>{n.icon}</span><b>{n.name}</b><small>{n.desc}</small><em>{game.unlocked.includes(n.id)?'FREIGESCHALTET':'Im Entwicklungsbaum verfügbar'}</em></div>)}</div></div>;
}
function FacilityCard({b,game,onUpgrade}) {const level=game.buildings[b.id]||0;const cost=Math.floor(b.base*Math.pow(1.72,level));return <div className="economy-card"><span>{b.icon}</span><b>{b.name}</b><small>Stufe {level} · {b.description}</small><button onClick={()=>onUpgrade(b.id)}>Ausbauen · {cost} Coins</button></div>}
function Matches({game,onMatch,busy}) {
  return <div className="page"><PanelTitle tag="WETTBEWERBE" title="Der Weg nach oben" desc="Alle Partien werden simuliert. Stärke deinen Verein und steige in höhere Wettbewerbe auf."/><div className="competition-list"><Competition icon="⚽" title="Ligabetrieb" subtitle={divisionName(game.division)} status="AKTIV" onClick={()=>onMatch('league')} busy={busy}/><Competition icon="🏆" title="Nationaler Pokal" subtitle={game.division<=8?'Wird in einer späteren Ausbaustufe freigeschaltet':'Noch nicht verfügbar'} status={game.division<=8?'BALD':'GESPERRT'} onClick={()=>onMatch('cup')} busy={busy} disabled={game.division>8}/><Competition icon="🌍" title="Champions League" subtitle={game.division<=2?'Qualifikation in Reichweite':'Erst Bundesliga erreichen'} status={game.division<=2?'ZIEL':'GESPERRT'} onClick={()=>onMatch('europe')} busy={busy} disabled={game.division>2}/></div><div className="season-progress"><span>SAISONFORTSCHRITT</span><b>{game.wins % 4}/4 Siege bis zum nächsten Aufstieg</b><div className="progress"><i style={{width:`${(game.wins%4)*25}%`}}/></div></div><button className="primary" onClick={()=>onMatch('league')} disabled={busy}>{busy?'SIMULIERE…':'LIGASPIEL SIMULIEREN →'}</button></div>;
}
function Competition({icon,title,subtitle,status,onClick,busy,disabled}) {return <div className={`competition ${disabled?'disabled':''}`}><span>{icon}</span><div><b>{title}</b><small>{subtitle}</small></div><em>{status}</em><button disabled={disabled||busy} onClick={onClick}>SIMULIEREN</button></div>}
