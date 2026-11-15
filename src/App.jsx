import { useEffect, useMemo, useState } from 'react';

const STARTERS = [
  { id: 1, name: 'Adler-Kapitän', role: 'TW', rating: 62, attack: 8, defense: 24, pace: 12, rarity: 'Selten', emoji: '🧤' },
  { id: 2, name: 'Mainwand', role: 'IV', rating: 59, attack: 12, defense: 25, pace: 13, rarity: 'Gewöhnlich', emoji: '🛡️' },
  { id: 3, name: 'Bornheimer', role: 'IV', rating: 58, attack: 11, defense: 24, pace: 14, rarity: 'Gewöhnlich', emoji: '🦅' },
  { id: 4, name: 'Flügelwind', role: 'RV', rating: 60, attack: 16, defense: 21, pace: 19, rarity: 'Selten', emoji: '💨' },
  { id: 5, name: 'Kurvenläufer', role: 'LV', rating: 57, attack: 15, defense: 20, pace: 18, rarity: 'Gewöhnlich', emoji: '⚡' },
  { id: 6, name: 'Spielmacher', role: 'ZM', rating: 64, attack: 22, defense: 19, pace: 18, rarity: 'Selten', emoji: '🎯' },
  { id: 7, name: 'Dauerläufer', role: 'ZM', rating: 58, attack: 17, defense: 19, pace: 22, rarity: 'Gewöhnlich', emoji: '🏃' },
  { id: 8, name: 'Der Zehner', role: 'OM', rating: 65, attack: 25, defense: 12, pace: 20, rarity: 'Episch', emoji: '✨' },
  { id: 9, name: 'Flankenblitz', role: 'RA', rating: 61, attack: 24, defense: 10, pace: 25, rarity: 'Selten', emoji: '🚀' },
  { id: 10, name: 'Torjäger', role: 'ST', rating: 66, attack: 29, defense: 8, pace: 22, rarity: 'Episch', emoji: '⚽' },
  { id: 11, name: 'Linksfuß', role: 'LA', rating: 60, attack: 23, defense: 11, pace: 24, rarity: 'Gewöhnlich', emoji: '🔥' },
];

const OPPONENTS = ['Stadtwald-Auswahl', 'Rhein-Main-Rivalen', 'Traditionself', 'Aufstiegsjäger', 'Flutlicht-Elf', 'Meistermacher'];
const SAVE_KEY = 'adler-legends-save-v1';

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return null;
    const elapsed = Math.min(8 * 60 * 60, Math.max(0, (Date.now() - saved.lastSeen) / 1000));
    return { ...saved, coins: saved.coins + Math.floor(elapsed / 60) * 2, lastOffline: Math.floor(elapsed / 60) * 2 };
  } catch { return null; }
}

const initial = loadGame() || {
  coins: 120, wins: 0, level: 1, upgrades: 0, lastSeen: Date.now(), lastOffline: 0,
  players: STARTERS,
};

function teamPower(players) {
  return Math.round(players.reduce((sum, player) => sum + player.rating, 0) / players.length * 1.65);
}

export default function App() {
  const [game, setGame] = useState(initial);
  const [tab, setTab] = useState('team');
  const [battle, setBattle] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setGame((current) => ({ ...current, lastSeen: Date.now() })), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...game, lastSeen: Date.now() }));
  }, [game]);

  const power = useMemo(() => teamPower(game.players), [game.players]);
  const opponentPower = 91 + (game.wins * 13) + (game.level - 1) * 18;

  function playBattle() {
    const attack = power + Math.floor(Math.random() * 25);
    const defense = opponentPower + Math.floor(Math.random() * 25);
    const won = attack >= defense;
    const reward = won ? 45 + game.level * 8 : 16 + game.level * 3;
    setBattle({ won, attack, defense, reward });
    setGame((current) => ({
      ...current,
      coins: current.coins + reward,
      wins: current.wins + (won ? 1 : 0),
      level: won && (current.wins + 1) % 3 === 0 ? current.level + 1 : current.level,
    }));
    setNotice(won ? 'Heimsieg! Die Adler holen die Punkte.' : 'Knapp geschlagen – weiterkämpfen, Adler!');
  }

  function trainPlayer(id) {
    const cost = 35 + game.upgrades * 10;
    if (game.coins < cost) { setNotice('Nicht genug Adler-Coins für das Training.'); return; }
    setGame((current) => ({
      ...current,
      coins: current.coins - cost,
      upgrades: current.upgrades + 1,
      players: current.players.map((player) => player.id === id
        ? { ...player, rating: player.rating + 2, attack: player.attack + 1, defense: player.defense + 1 }
        : player),
    }));
    setNotice('Training erfolgreich! Dein Spieler wird stärker.');
  }

  const nextOpponent = OPPONENTS[(game.wins + game.level - 1) % OPPONENTS.length];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setTab('team')}>
          <span className="brand-mark">🦅</span><span>ADLER <b>LEGENDS</b><small>DEIN WEG ZUM TITEL</small></span>
        </a>
        <div className="wallet"><span>🪙</span><strong>{game.coins.toLocaleString('de-DE')}</strong><small>COINS</small></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> SAISON 01 · DER WEG BEGINNT</div>
          <h1>Eine Stadt.<br /><em>Ein Verein.</em><br />Dein Team.</h1>
          <p>Baue deine Adler-Elf auf, kämpfe dich nach oben und schreibe deine eigene Geschichte.</p>
          <button className="primary-button" onClick={() => setTab('battle')}>NÄCHSTES DUELL <span>→</span></button>
        </div>
        <div className="stadium-art" aria-label="Flutlicht-Stadion Illustration">
          <div className="light light-left" /><div className="light light-right" />
          <div className="stands"><span>ADLER</span><span>ADLER</span><span>ADLER</span></div>
          <div className="pitch"><div className="center-circle" /><div className="pitch-line" /></div>
          <div className="stadium-caption">FLUTLICHT. GÄNSEHAUT. EINTRACHT.</div>
        </div>
      </section>

      <section className="stats-grid">
        <Stat label="TEAMSTÄRKE" value={power} icon="⚡" />
        <Stat label="SIEGE" value={game.wins} icon="🏆" />
        <Stat label="LIGA" value={game.level} icon="🏟️" />
        <Stat label="KADER" value={game.players.length} icon="👥" />
      </section>

      {game.lastOffline > 0 && <div className="offline-banner">🌙 Willkommen zurück! Während deiner Pause hast du {game.lastOffline} Coins gesammelt.</div>}
      {notice && <div className="notice" role="status">{notice}</div>}

      <nav className="tabs" aria-label="Spielnavigation">
        <Tab active={tab === 'team'} onClick={() => setTab('team')}>⚽ Mannschaft</Tab>
        <Tab active={tab === 'battle'} onClick={() => setTab('battle')}>⚔️ Duell</Tab>
        <Tab active={tab === 'training'} onClick={() => setTab('training')}>📈 Training</Tab>
      </nav>

      {tab === 'team' && <section className="content-section">
        <SectionHeading kicker="DIE STARTELF" title="Unsere Adler" detail="4–3–3 · Gemeinsam stark" />
        <div className="formation">
          {game.players.slice(5).map((p) => <PlayerTile key={p.id} player={p} />)}
          <div className="formation-mid">{game.players.slice(1, 5).map((p) => <PlayerTile key={p.id} player={p} />)}</div>
          <div className="formation-keeper"><PlayerTile player={game.players[0]} /></div>
        </div>
        <p className="helper-text">Deine Mannschaft ist bereit. Im Training kannst du einzelne Spieler verbessern.</p>
      </section>}

      {tab === 'battle' && <section className="content-section">
        <SectionHeading kicker="MATCHDAY" title="Das nächste Duell" detail="Jeder Sieg bringt dich dem Titel näher." />
        <div className="battle-card">
          <div className="match-label">SAISON {String(game.level).padStart(2, '0')} · SPIELTAG {game.wins + 1}</div>
          <div className="versus">
            <div className="club"><div className="club-crest">🦅</div><b>ADLER<br />LEGENDS</b><small>{power} STÄRKE</small></div>
            <div className="versus-mid"><span>VS</span><small>HEUTE · FLUTLICHT</small></div>
            <div className="club"><div className="opponent-crest">⚔️</div><b>{nextOpponent.toUpperCase()}</b><small>{opponentPower} STÄRKE</small></div>
          </div>
          {battle && <div className={`battle-result ${battle.won ? 'win' : 'loss'}`}>
            <strong>{battle.won ? 'SIEG! 🏆' : 'NIEDERLAGE'}</strong>
            <span>Deine Stärke {battle.attack} : {battle.defense} Gegnerstärke</span>
            <small>Belohnung: +{battle.reward} Adler-Coins</small>
          </div>}
          <button className="primary-button battle-button" onClick={playBattle}>⚽ {battle ? 'NOCH EIN DUELL' : 'KAMPF STARTEN'} <span>→</span></button>
          <p className="helper-text">Der Ausgang wird aus Teamstärke und einer kleinen Portion Spielglück berechnet.</p>
        </div>
      </section>}

      {tab === 'training' && <section className="content-section">
        <SectionHeading kicker="CAMPUS" title="Spieler entwickeln" detail="Investiere Adler-Coins und mach deine Elf stärker." />
        <div className="training-list">
          {game.players.map((player) => <div className="training-row" key={player.id}>
            <div className="player-avatar">{player.emoji}</div>
            <div className="player-info"><b>{player.name}</b><small>{player.role} · GES {player.rating} · {player.rarity}</small></div>
            <button className="train-button" onClick={() => trainPlayer(player.id)}>+2 <small>35+ Coins</small></button>
          </div>)}
        </div>
      </section>}

      <footer><span>🦅 ADLER LEGENDS</span><span>FÜR ALLE, DIE DIE ADLER LIEBEN.</span></footer>
    </main>
  );
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}
function Tab({ active, onClick, children }) {
  return <button className={`tab ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>;
}
function SectionHeading({ kicker, title, detail }) {
  return <div className="section-heading"><div><small>{kicker}</small><h2>{title}</h2></div><p>{detail}</p></div>;
}
function PlayerTile({ player }) {
  return <div className="player-tile"><span>{player.emoji}</span><b>{player.rating}</b><small>{player.role}</small></div>;
}