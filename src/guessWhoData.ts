// src/guessWhoData.ts
// Handcrafted Guess Who characters based on authentic cards:
// Deck 1: Classic 1980s Retro Edition (Alex, Alfred, Anita, Anne, Bernard, Bill, Charles, Claire, David, Eric, Frans, George, Herman, Joe, Maria, Max, Paul, Peter, Philip, Richard, Robert, Sam, Susan, Tom)
// Deck 2: Modern Friend Cards Edition (Amy, David, Leo, Gabe, Katie, Olivia, Jordan, Carmen, Laura, Joe, Mike, Al, Daniel, Sophia, Nick, Lily, Liz, Mia, Emma, Rachel, Ben, Eric, Farah, Sam)

export interface GuessWhoChar {
  id: string;
  name: string;
  female: number;  // 1: female, 0: male
  hat: number;     // 1: has hat / headwear, 0: no
  glasses: number; // 1: wearing glasses, 0: no
  facial: number;  // 1: beard / mustache / goatee, 0: clean
  bald: number;    // 1: bald on top or completely bald, 0: full hair
  earrings: number;// 1: wearing earrings, 0: no
  hairColor: 'blonde' | 'red' | 'brown' | 'black' | 'white';
  eyeColor: 'blue' | 'brown';
  badgeIcon?: string;
  badgeName?: string;
  renderSvg: (elim: boolean) => string;
}

export type DeckEdition = 'classic' | 'modern';

// Helper to wrap SVG in Guess Who card frame
function wrapCard(content: string, name: string, elim: boolean, edition: DeckEdition, badge?: string) {
  const bg = edition === 'classic' ? '#d92b2b' : '#ffffff';
  const border = edition === 'classic' ? '#ffffff' : '#f5c518';
  const nameBg = edition === 'classic' ? '#ffffff' : '#f5c518';
  const nameColor = edition === 'classic' ? '#c82323' : '#2d1f04';

  return `
    <svg viewBox="0 0 100 132" class="gw-card-svg" style="width:100%; height:auto; display:block; filter:${elim ? 'grayscale(0.85) contrast(0.8)' : 'none'}; opacity:${elim ? '0.35' : '1'}; transition:all 0.3s ease;">
      <!-- Card frame -->
      <rect x="2" y="2" width="96" height="128" rx="8" fill="${border}" stroke="#222" stroke-width="2"/>
      <rect x="6" y="6" width="88" height="98" rx="5" fill="${bg}" />
      
      <!-- Portrait artwork -->
      <g id="portrait">
        ${content}
      </g>

      ${badge ? `
      <!-- Corner Hobby/Badge -->
      <g transform="translate(68, 70)">
        <circle cx="12" cy="12" r="11" fill="#fff" stroke="#444" stroke-width="1.2"/>
        <text x="12" y="16" font-size="12" text-anchor="middle">${badge}</text>
      </g>
      ` : ''}

      <!-- Name banner at bottom -->
      <rect x="6" y="106" width="88" height="20" rx="3" fill="${nameBg}" stroke="#333" stroke-width="1"/>
      <text x="50" y="120" font-family="Arial, Impact, sans-serif" font-weight="900" font-size="10" text-anchor="middle" fill="${nameColor}" letter-spacing="0.5">${name.toUpperCase()}</text>
      ${elim ? `
        <!-- Eliminated cross line -->
        <line x1="8" y1="8" x2="92" y2="102" stroke="#e11d48" stroke-width="3" stroke-linecap="round"/>
        <line x1="92" y1="8" x2="8" y2="102" stroke="#e11d48" stroke-width="3" stroke-linecap="round"/>
      ` : ''}
    </svg>
  `;
}

/* ======================================================================
   CLASSIC 1980s GUESS WHO CHARACTERS (from s-l400.jpg)
   ====================================================================== */

export const CLASSIC_DECK: GuessWhoChar[] = [
  // 1. Alex: black hair, handlebar mustache, brown eyes
  {
    id: 'c_alex',
    name: 'Alex',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <!-- Face & Body -->
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#2d3748"/>
        <ellipse cx="50" cy="55" rx="20" ry="25" fill="#fcd3b0"/>
        <!-- Ears -->
        <ellipse cx="28" cy="55" rx="4" ry="7" fill="#fcd3b0"/>
        <ellipse cx="72" cy="55" rx="4" ry="7" fill="#fcd3b0"/>
        <!-- Eyes & brows -->
        <ellipse cx="42" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="58" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="42" cy="50" r="2" fill="#3e2723"/>
        <circle cx="58" cy="50" r="2" fill="#3e2723"/>
        <path d="M37 44 Q42 41 47 43" stroke="#111" stroke-width="2" fill="none"/>
        <path d="M53 43 Q58 41 63 44" stroke="#111" stroke-width="2" fill="none"/>
        <!-- Nose -->
        <path d="M48 52 Q50 60 52 59" stroke="#d97706" stroke-width="1.8" fill="none"/>
        <!-- Handlebar mustache -->
        <path d="M36 67 Q44 63 50 67 Q56 63 64 67 Q58 72 50 70 Q42 72 36 67 Z" fill="#111"/>
        <path d="M36 67 Q32 64 34 60" stroke="#111" stroke-width="2" fill="none"/>
        <path d="M64 67 Q68 64 66 60" stroke="#111" stroke-width="2" fill="none"/>
        <!-- Mouth -->
        <path d="M46 73 Q50 75 54 73" stroke="#991b1b" stroke-width="1.5" fill="none"/>
        <!-- Black parted hair -->
        <path d="M28 48 C27 30 73 30 72 48 C68 34 56 33 50 36 C44 33 32 34 28 48 Z" fill="#111"/>
      `, this.name, elim, 'classic');
    }
  },

  // 2. Alfred: long parted reddish hair, droopy mustache, blue eyes
  {
    id: 'c_alfred',
    name: 'Alfred',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'red', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M24 104 C24 84 76 84 76 104 Z" fill="#4b5563"/>
        <!-- Long red hair behind -->
        <path d="M24 45 C20 65 24 90 32 95 L68 95 C76 90 80 65 76 45 Z" fill="#b45309"/>
        <ellipse cx="50" cy="56" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Eyes & brows -->
        <ellipse cx="43" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="50" r="2" fill="#2563eb"/>
        <circle cx="57" cy="50" r="2" fill="#2563eb"/>
        <path d="M38 45 Q43 42 47 44" stroke="#78350f" stroke-width="2" fill="none"/>
        <path d="M53 44 Q57 42 62 45" stroke="#78350f" stroke-width="2" fill="none"/>
        <!-- Long nose -->
        <path d="M48 49 L50 63 L46 64" stroke="#d97706" stroke-width="1.8" fill="none"/>
        <!-- Droopy reddish mustache -->
        <path d="M38 68 Q44 65 50 68 Q56 65 62 68 Q56 78 50 74 Q44 78 38 68 Z" fill="#92400e"/>
        <!-- Parted hair front -->
        <path d="M26 48 C28 26 72 26 74 48 C68 36 53 34 50 42 C47 34 32 36 26 48 Z" fill="#b45309"/>
      `, this.name, elim, 'classic');
    }
  },

  // 3. Anita: blonde pigtails with red bows, rosy cheeks, blue eyes
  {
    id: 'c_anita',
    name: 'Anita',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#3b82f6"/>
        <!-- Pigtails -->
        <ellipse cx="22" cy="65" rx="7" ry="16" fill="#facc15"/>
        <ellipse cx="78" cy="65" rx="7" ry="16" fill="#facc15"/>
        <!-- Red bows -->
        <polygon points="18,52 26,52 22,56" fill="#ef4444"/>
        <polygon points="18,60 26,60 22,56" fill="#ef4444"/>
        <polygon points="74,52 82,52 78,56" fill="#ef4444"/>
        <polygon points="74,60 82,60 78,56" fill="#ef4444"/>
        <!-- Face -->
        <ellipse cx="50" cy="55" rx="20" ry="24" fill="#fde2d0"/>
        <!-- Rosy cheeks -->
        <circle cx="36" cy="62" r="5" fill="#f87171" opacity="0.4"/>
        <circle cx="64" cy="62" r="5" fill="#f87171" opacity="0.4"/>
        <!-- Blue eyes with lashes -->
        <ellipse cx="42" cy="51" rx="3.5" ry="4" fill="#fff"/>
        <ellipse cx="58" cy="51" rx="3.5" ry="4" fill="#fff"/>
        <circle cx="42" cy="51" r="2.2" fill="#0284c7"/>
        <circle cx="58" cy="51" r="2.2" fill="#0284c7"/>
        <path d="M38 46 Q42 45 46 47" stroke="#713f12" stroke-width="1.5" fill="none"/>
        <path d="M54 47 Q58 45 62 46" stroke="#713f12" stroke-width="1.5" fill="none"/>
        <!-- Cute nose & smiling mouth -->
        <ellipse cx="50" cy="58" rx="1.8" ry="1.2" fill="#fca5a5"/>
        <path d="M44 67 Q50 73 56 67" stroke="#dc2626" stroke-width="2" fill="none"/>
        <!-- Blonde bangs -->
        <path d="M28 48 C28 30 72 30 72 48 C66 40 54 38 50 42 C46 38 34 40 28 48 Z" fill="#facc15"/>
      `, this.name, elim, 'classic');
    }
  },

  // 4. Anne: short curly black afro hair, dark skin, brown eyes
  {
    id: 'c_anne',
    name: 'Anne',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 1,
    hairColor: 'black', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#10b981"/>
        <!-- Afro curls background -->
        <circle cx="32" cy="40" r="14" fill="#18181b"/>
        <circle cx="50" cy="32" r="15" fill="#18181b"/>
        <circle cx="68" cy="40" r="14" fill="#18181b"/>
        <circle cx="26" cy="52" r="11" fill="#18181b"/>
        <circle cx="74" cy="52" r="11" fill="#18181b"/>
        <!-- Dark skin face -->
        <ellipse cx="50" cy="56" rx="20" ry="24" fill="#8d5b4c"/>
        <!-- Stud earrings -->
        <circle cx="28" cy="62" r="2.5" fill="#facc15"/>
        <circle cx="72" cy="62" r="2.5" fill="#facc15"/>
        <!-- Eyes & brows -->
        <ellipse cx="42" cy="51" rx="3.5" ry="3.5" fill="#fff"/>
        <ellipse cx="58" cy="51" rx="3.5" ry="3.5" fill="#fff"/>
        <circle cx="42" cy="51" r="2" fill="#261c14"/>
        <circle cx="58" cy="51" r="2" fill="#261c14"/>
        <path d="M37 45 Q42 43 47 45" stroke="#18181b" stroke-width="1.8" fill="none"/>
        <path d="M53 45 Q58 43 63 45" stroke="#18181b" stroke-width="1.8" fill="none"/>
        <!-- Nose & smiling lips -->
        <ellipse cx="50" cy="59" rx="3.5" ry="2" fill="#6d4336"/>
        <path d="M44 68 Q50 74 56 68" stroke="#be123c" stroke-width="2.4" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 5. Bernard: dark brown floppy cap/hat, big nose, brown eyes
  {
    id: 'c_bernard',
    name: 'Bernard',
    female: 0, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'brown', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#374151"/>
        <ellipse cx="50" cy="60" rx="19" ry="23" fill="#fcd3b0"/>
        <!-- Ears -->
        <ellipse cx="29" cy="60" rx="4" ry="6" fill="#fcd3b0"/>
        <ellipse cx="71" cy="60" rx="4" ry="6" fill="#fcd3b0"/>
        <!-- Dark brown hair peek -->
        <path d="M28 50 Q28 62 33 60 M67 60 Q72 62 72 50" stroke="#451a03" stroke-width="3" fill="none"/>
        <!-- Eyes & brows -->
        <ellipse cx="43" cy="53" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="53" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="53" r="2" fill="#451a03"/>
        <circle cx="57" cy="53" r="2" fill="#451a03"/>
        <path d="M38 48 Q43 46 47 48" stroke="#451a03" stroke-width="2" fill="none"/>
        <path d="M53 48 Q57 46 62 48" stroke="#451a03" stroke-width="2" fill="none"/>
        <!-- Large nose -->
        <path d="M48 50 Q52 64 47 66 Q44 66 45 62" stroke="#d97706" stroke-width="2.5" fill="#fcd3b0"/>
        <!-- Mouth -->
        <path d="M45 74 Q50 76 55 74" stroke="#991b1b" stroke-width="2" fill="none"/>
        <!-- Bernard's hat/cap -->
        <path d="M24 46 C24 24 76 24 76 46 Z" fill="#4b5563"/>
        <ellipse cx="50" cy="46" rx="28" ry="6" fill="#374151"/>
      `, this.name, elim, 'classic');
    }
  },

  // 6. Bill: bald dome on top, orange-red goatee beard and mustache, chubby cheeks
  {
    id: 'c_bill',
    name: 'Bill',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 1, earrings: 0,
    hairColor: 'red', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M24 104 C24 84 76 84 76 104 Z" fill="#1e3a8a"/>
        <!-- Chubby face -->
        <ellipse cx="50" cy="56" rx="23" ry="25" fill="#fcd3b0"/>
        <circle cx="34" cy="62" r="5" fill="#fca5a5" opacity="0.5"/>
        <circle cx="66" cy="62" r="5" fill="#fca5a5" opacity="0.5"/>
        <!-- Red side hair puffs -->
        <ellipse cx="26" cy="56" rx="4" ry="10" fill="#c2410c"/>
        <ellipse cx="74" cy="56" rx="4" ry="10" fill="#c2410c"/>
        <!-- Bald dome shine -->
        <path d="M42 34 Q50 32 58 34" stroke="#fff" stroke-width="1.5" opacity="0.7" fill="none"/>
        <!-- Eyes & brows -->
        <ellipse cx="43" cy="49" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="57" cy="49" rx="3" ry="3" fill="#fff"/>
        <circle cx="43" cy="49" r="1.8" fill="#451a03"/>
        <circle cx="57" cy="49" r="1.8" fill="#451a03"/>
        <path d="M38 44 Q43 42 47 44" stroke="#9a3412" stroke-width="2" fill="none"/>
        <path d="M53 44 Q57 42 62 44" stroke="#9a3412" stroke-width="2" fill="none"/>
        <!-- Nose -->
        <circle cx="50" cy="55" r="3.5" fill="#f87171" opacity="0.5"/>
        <!-- Orange goatee & mustache -->
        <path d="M40 64 Q50 62 60 64 Q56 70 50 67 Q44 70 40 64 Z" fill="#ea580c"/>
        <path d="M44 72 Q50 82 56 72 Z" fill="#ea580c"/>
      `, this.name, elim, 'classic');
    }
  },

  // 7. Charles: blonde bowl cut, massive blonde horseshoe mustache, blue eyes
  {
    id: 'c_charles',
    name: 'Charles',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#047857"/>
        <ellipse cx="50" cy="56" rx="20" ry="24" fill="#fcd3b0"/>
        <!-- Big blonde bowl cut -->
        <path d="M26 50 C26 26 74 26 74 50 C74 44 65 38 50 38 C35 38 26 44 26 50 Z" fill="#facc15"/>
        <!-- Eyes & brows -->
        <ellipse cx="43" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="50" r="2" fill="#0284c7"/>
        <circle cx="57" cy="50" r="2" fill="#0284c7"/>
        <path d="M38 45 Q43 43 47 45" stroke="#a16207" stroke-width="2" fill="none"/>
        <path d="M53 45 Q57 43 62 45" stroke="#a16207" stroke-width="2" fill="none"/>
        <!-- Nose -->
        <path d="M49 50 L50 60 L47 62" stroke="#d97706" stroke-width="1.8" fill="none"/>
        <!-- Big blonde mustache -->
        <path d="M36 65 Q44 62 50 65 Q56 62 64 65 Q66 76 60 76 Q56 71 50 71 Q44 71 40 76 Q34 76 36 65 Z" fill="#eab308"/>
      `, this.name, elim, 'classic');
    }
  },

  // 8. Claire: red hair, big orange/red hat with flower, red glasses
  {
    id: 'c_claire',
    name: 'Claire',
    female: 1, hat: 1, glasses: 1, facial: 0, bald: 0, earrings: 0,
    hairColor: 'red', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#ec4899"/>
        <!-- Face -->
        <ellipse cx="50" cy="60" rx="20" ry="23" fill="#fde2d0"/>
        <!-- Red hair curls at side -->
        <circle cx="28" cy="62" r="7" fill="#b45309"/>
        <circle cx="72" cy="62" r="7" fill="#b45309"/>
        <!-- Big fancy hat -->
        <ellipse cx="50" cy="40" rx="36" ry="14" fill="#dc2626"/>
        <path d="M30 40 C30 20 70 20 70 40 Z" fill="#b91c1c"/>
        <rect x="30" y="36" width="40" height="5" fill="#fef08a"/>
        <!-- Flower on hat -->
        <circle cx="36" cy="34" r="5" fill="#f43f5e"/>
        <circle cx="36" cy="34" r="2" fill="#fef08a"/>
        <!-- Round red glasses -->
        <circle cx="42" cy="56" r="6" stroke="#b91c1c" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="56" r="6" stroke="#b91c1c" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="56" x2="52" y2="56" stroke="#b91c1c" stroke-width="2"/>
        <!-- Eyes inside glasses -->
        <circle cx="42" cy="56" r="1.8" fill="#451a03"/>
        <circle cx="58" cy="56" r="1.8" fill="#451a03"/>
        <!-- Smiling mouth -->
        <path d="M45 72 Q50 77 55 72" stroke="#be123c" stroke-width="2" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 9. David: blonde hair, blonde goatee, blue eyes
  {
    id: 'c_david',
    name: 'David',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#4f46e5"/>
        <ellipse cx="50" cy="55" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Blonde wavy hair -->
        <path d="M28 46 C28 28 72 28 72 46 C67 36 55 34 50 38 C45 34 33 36 28 46 Z" fill="#facc15"/>
        <!-- Eyes & brows -->
        <ellipse cx="43" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="50" r="2" fill="#0284c7"/>
        <circle cx="57" cy="50" r="2" fill="#0284c7"/>
        <path d="M38 45 Q43 43 47 45" stroke="#a16207" stroke-width="2" fill="none"/>
        <path d="M53 45 Q57 43 62 45" stroke="#a16207" stroke-width="2" fill="none"/>
        <!-- Nose -->
        <path d="M49 52 L50 61 L47 62" stroke="#d97706" stroke-width="1.8" fill="none"/>
        <!-- Blonde goatee & mustache -->
        <path d="M44 67 Q50 65 56 67" stroke="#eab308" stroke-width="2.5" fill="none"/>
        <path d="M46 72 Q50 78 54 72 Z" fill="#eab308"/>
      `, this.name, elim, 'classic');
    }
  },

  // 10. Eric: blue/yellow peaked captain hat, blonde hair, chubby face
  {
    id: 'c_eric',
    name: 'Eric',
    female: 0, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#1e40af"/>
        <!-- Chubby face -->
        <ellipse cx="50" cy="58" rx="22" ry="24" fill="#fcd3b0"/>
        <circle cx="34" cy="64" r="4.5" fill="#fca5a5" opacity="0.4"/>
        <circle cx="66" cy="64" r="4.5" fill="#fca5a5" opacity="0.4"/>
        <!-- Blonde hair fringe -->
        <path d="M30 52 Q50 48 70 52" stroke="#facc15" stroke-width="4" fill="none"/>
        <!-- Sailor/captain hat -->
        <path d="M26 44 C26 26 74 26 74 44 Z" fill="#1e3a8a"/>
        <ellipse cx="50" cy="44" rx="26" ry="6" fill="#facc15"/>
        <path d="M32 46 Q50 50 68 46" stroke="#111" stroke-width="3" fill="none"/>
        <!-- Eyes & brows -->
        <ellipse cx="43" cy="54" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="54" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="54" r="2" fill="#0284c7"/>
        <circle cx="57" cy="54" r="2" fill="#0284c7"/>
        <!-- Smiling mouth -->
        <path d="M44 69 Q50 75 56 69" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 11. Frans: short orange-red hair, upturned nose, blue eyes
  {
    id: 'c_frans',
    name: 'Frans',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'red', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#059669"/>
        <ellipse cx="50" cy="56" rx="20" ry="24" fill="#fcd3b0"/>
        <!-- Spiky orange hair -->
        <path d="M26 46 C26 24 74 24 74 46 L70 42 L66 32 L58 36 L52 28 L46 34 L38 30 L32 40 Z" fill="#ea580c"/>
        <!-- Eyes & brows -->
        <ellipse cx="43" cy="51" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="51" rx="3.5" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="51" r="2" fill="#0284c7"/>
        <circle cx="57" cy="51" r="2" fill="#0284c7"/>
        <!-- Upturned nose -->
        <path d="M49 52 Q50 60 46 62 Q50 63 54 62" stroke="#d97706" stroke-width="1.8" fill="none"/>
        <!-- Neutral mouth -->
        <line x1="45" y1="70" x2="55" y2="70" stroke="#991b1b" stroke-width="2"/>
      `, this.name, elim, 'classic');
    }
  },

  // 12. George: dark fedora hat, white hair & droopy white mustache, sad eyes
  {
    id: 'c_george',
    name: 'George',
    female: 0, hat: 1, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'white', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#374151"/>
        <ellipse cx="50" cy="58" rx="19" ry="23" fill="#fcd3b0"/>
        <!-- White hair at sides -->
        <ellipse cx="28" cy="58" rx="4" ry="7" fill="#e5e7eb"/>
        <ellipse cx="72" cy="58" rx="4" ry="7" fill="#e5e7eb"/>
        <!-- Sad droopy eyes -->
        <ellipse cx="43" cy="52" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="57" cy="52" rx="3" ry="3" fill="#fff"/>
        <circle cx="43" cy="52" r="1.8" fill="#0284c7"/>
        <circle cx="57" cy="52" r="1.8" fill="#0284c7"/>
        <!-- Droopy brows -->
        <path d="M38 46 Q43 49 47 48" stroke="#9ca3af" stroke-width="2" fill="none"/>
        <path d="M53 48 Q57 49 62 46" stroke="#9ca3af" stroke-width="2" fill="none"/>
        <!-- White mustache -->
        <path d="M38 67 Q44 64 50 67 Q56 64 62 67 Q56 75 50 71 Q44 75 38 67 Z" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
        <!-- Fedora hat -->
        <path d="M30 44 C30 24 70 24 70 44 Z" fill="#1f2937"/>
        <ellipse cx="50" cy="44" rx="28" ry="6" fill="#111827"/>
        <rect x="34" y="38" width="32" height="4" fill="#4b5563"/>
      `, this.name, elim, 'classic');
    }
  },

  // 13. Herman: bald dome, orange hair on sides, big bulbous nose
  {
    id: 'c_herman',
    name: 'Herman',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 1, earrings: 0,
    hairColor: 'red', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#6b21a8"/>
        <!-- Face -->
        <ellipse cx="50" cy="55" rx="20" ry="25" fill="#fcd3b0"/>
        <!-- Red side tufts -->
        <circle cx="27" cy="56" r="6" fill="#ea580c"/>
        <circle cx="73" cy="56" r="6" fill="#ea580c"/>
        <!-- Bald dome shine -->
        <path d="M42 34 Q50 32 58 34" stroke="#fff" stroke-width="1.8" opacity="0.8" fill="none"/>
        <!-- Small eyes -->
        <circle cx="43" cy="49" r="2.2" fill="#451a03"/>
        <circle cx="57" cy="49" r="2.2" fill="#451a03"/>
        <!-- Huge bulbous nose -->
        <circle cx="50" cy="58" r="7" fill="#fb923c" stroke="#ea580c" stroke-width="1"/>
        <!-- Mouth -->
        <path d="M44 72 Q50 74 56 72" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 14. Joe: curly blonde hair, wire-rimmed glasses, blue eyes
  {
    id: 'c_joe',
    name: 'Joe',
    female: 0, hat: 0, glasses: 1, facial: 0, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#0284c7"/>
        <ellipse cx="50" cy="57" rx="18" ry="24" fill="#fcd3b0"/>
        <!-- Curly blonde hair puffs -->
        <circle cx="34" cy="38" r="9" fill="#facc15"/>
        <circle cx="50" cy="33" r="10" fill="#facc15"/>
        <circle cx="66" cy="38" r="9" fill="#facc15"/>
        <circle cx="28" cy="48" r="7" fill="#facc15"/>
        <circle cx="72" cy="48" r="7" fill="#facc15"/>
        <!-- Wire-rim glasses -->
        <circle cx="42" cy="54" r="6" stroke="#4b5563" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="54" r="6" stroke="#4b5563" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="54" x2="52" y2="54" stroke="#4b5563" stroke-width="1.8"/>
        <!-- Blue eyes in glasses -->
        <circle cx="42" cy="54" r="2" fill="#0284c7"/>
        <circle cx="58" cy="54" r="2" fill="#0284c7"/>
        <!-- Nose & smile -->
        <path d="M49 57 L50 63 L47 64" stroke="#d97706" stroke-width="1.5" fill="none"/>
        <path d="M45 72 Q50 76 55 72" stroke="#991b1b" stroke-width="1.8" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 15. Maria: green beret hat, wavy dark brown hair, pearl earrings
  {
    id: 'c_maria',
    name: 'Maria',
    female: 1, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 1,
    hairColor: 'brown', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#9333ea"/>
        <ellipse cx="50" cy="58" rx="19" ry="23" fill="#fde2d0"/>
        <!-- Dark brown wavy hair -->
        <path d="M27 48 C20 62 24 80 32 84 M73 48 C80 62 76 80 68 84" stroke="#451a03" stroke-width="6" fill="none"/>
        <!-- Green beret -->
        <path d="M24 44 C24 24 74 24 78 40 Z" fill="#15803d"/>
        <ellipse cx="50" cy="42" rx="26" ry="7" fill="#16a34a"/>
        <circle cx="50" cy="30" r="2.5" fill="#15803d"/>
        <!-- Pearl earrings -->
        <circle cx="28" cy="65" r="3" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.8"/>
        <circle cx="72" cy="65" r="3" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.8"/>
        <!-- Brown eyes -->
        <ellipse cx="43" cy="53" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="53" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="53" r="2" fill="#451a03"/>
        <circle cx="57" cy="53" r="2" fill="#451a03"/>
        <!-- Red smile -->
        <path d="M44 70 Q50 76 56 70" stroke="#dc2626" stroke-width="2" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 16. Max: curly dark hair, big bushy black mustache, brown eyes
  {
    id: 'c_max',
    name: 'Max',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M24 104 C24 84 76 84 76 104 Z" fill="#374151"/>
        <ellipse cx="50" cy="56" rx="20" ry="24" fill="#fcd3b0"/>
        <!-- Curly black hair -->
        <circle cx="34" cy="38" r="9" fill="#18181b"/>
        <circle cx="50" cy="32" r="10" fill="#18181b"/>
        <circle cx="66" cy="38" r="9" fill="#18181b"/>
        <circle cx="27" cy="48" r="7" fill="#18181b"/>
        <circle cx="73" cy="48" r="7" fill="#18181b"/>
        <!-- Eyes & thick brows -->
        <ellipse cx="43" cy="49" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="49" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="49" r="2" fill="#18181b"/>
        <circle cx="57" cy="49" r="2" fill="#18181b"/>
        <path d="M37 43 Q43 40 47 43" stroke="#18181b" stroke-width="3" fill="none"/>
        <path d="M53 43 Q57 40 63 43" stroke="#18181b" stroke-width="3" fill="none"/>
        <!-- Thick bushy mustache -->
        <path d="M35 63 Q44 58 50 63 Q56 58 65 63 Q63 74 50 71 Q37 74 35 63 Z" fill="#18181b"/>
      `, this.name, elim, 'classic');
    }
  },

  // 17. Paul: wavy white hair, round glasses, blue eyes
  {
    id: 'c_paul',
    name: 'Paul',
    female: 0, hat: 0, glasses: 1, facial: 0, bald: 0, earrings: 0,
    hairColor: 'white', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#0f766e"/>
        <ellipse cx="50" cy="56" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Wavy white hair -->
        <path d="M26 48 C26 26 74 26 74 48 C68 36 55 34 50 38 C45 34 32 36 26 48 Z" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="1"/>
        <!-- Round brown glasses -->
        <circle cx="42" cy="52" r="6" stroke="#78350f" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="52" r="6" stroke="#78350f" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="52" x2="52" y2="52" stroke="#78350f" stroke-width="1.8"/>
        <circle cx="42" cy="52" r="1.8" fill="#0284c7"/>
        <circle cx="58" cy="52" r="1.8" fill="#0284c7"/>
        <!-- Gentle smile -->
        <path d="M46 70 Q50 74 54 70" stroke="#991b1b" stroke-width="1.8" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 18. Peter: white hair parted, big bulbous nose, blue eyes
  {
    id: 'c_peter',
    name: 'Peter',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'white', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#b91c1c"/>
        <ellipse cx="50" cy="56" rx="20" ry="24" fill="#fcd3b0"/>
        <!-- White hair parted -->
        <path d="M27 48 C27 28 73 28 73 48 C66 36 53 34 50 40 C47 34 34 36 27 48 Z" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
        <!-- Rosy cheeks -->
        <circle cx="34" cy="62" r="4.5" fill="#fca5a5" opacity="0.4"/>
        <circle cx="66" cy="62" r="4.5" fill="#fca5a5" opacity="0.4"/>
        <!-- Blue eyes -->
        <ellipse cx="43" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <ellipse cx="57" cy="50" rx="3" ry="3.5" fill="#fff"/>
        <circle cx="43" cy="50" r="2" fill="#0284c7"/>
        <circle cx="57" cy="50" r="2" fill="#0284c7"/>
        <!-- Huge bulbous nose -->
        <circle cx="50" cy="58" r="6.5" fill="#f87171" opacity="0.6"/>
        <!-- Cheerful smile -->
        <path d="M44 71 Q50 76 56 71" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 19. Philip: black hair, full black jawline beard, rosy cheeks
  {
    id: 'c_philip',
    name: 'Philip',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#4338ca"/>
        <!-- Full black beard behind chin -->
        <path d="M30 55 C28 85 72 85 70 55 Z" fill="#18181b"/>
        <ellipse cx="50" cy="54" rx="18" ry="21" fill="#fcd3b0"/>
        <!-- Thick black hair -->
        <path d="M26 46 C26 26 74 26 74 46 C68 35 56 34 50 38 C44 34 32 35 26 46 Z" fill="#18181b"/>
        <!-- Rosy cheeks -->
        <circle cx="36" cy="58" r="4" fill="#fca5a5" opacity="0.4"/>
        <circle cx="64" cy="58" r="4" fill="#fca5a5" opacity="0.4"/>
        <!-- Brown eyes -->
        <circle cx="43" cy="49" r="2.2" fill="#18181b"/>
        <circle cx="57" cy="49" r="2.2" fill="#18181b"/>
        <path d="M45 68 Q50 72 55 68" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 20. Richard: bald dome, thick dark beard and mustache, dark eyes
  {
    id: 'c_richard',
    name: 'Richard',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 1, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#b45309"/>
        <!-- Beard outline -->
        <path d="M29 55 C26 90 74 90 71 55 Z" fill="#261c14"/>
        <ellipse cx="50" cy="52" rx="19" ry="22" fill="#fcd3b0"/>
        <!-- Bald head highlight -->
        <path d="M42 32 Q50 30 58 32" stroke="#fff" stroke-width="2" opacity="0.8" fill="none"/>
        <!-- Intense dark eyes & thick brows -->
        <circle cx="43" cy="48" r="2.2" fill="#18181b"/>
        <circle cx="57" cy="48" r="2.2" fill="#18181b"/>
        <path d="M37 42 Q43 40 47 43" stroke="#261c14" stroke-width="2.8" fill="none"/>
        <path d="M53 43 Q57 40 63 42" stroke="#261c14" stroke-width="2.8" fill="none"/>
        <!-- Mustache -->
        <path d="M38 60 Q50 56 62 60 Q56 68 50 64 Q44 68 38 60 Z" fill="#261c14"/>
      `, this.name, elim, 'classic');
    }
  },

  // 21. Robert: brown side-parted hair, sad blue eyes, long face
  {
    id: 'c_robert',
    name: 'Robert',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'brown', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#334155"/>
        <ellipse cx="50" cy="58" rx="18" ry="26" fill="#fcd3b0"/>
        <!-- Brown side-parted hair -->
        <path d="M28 48 C28 26 72 26 72 48 C68 34 52 32 46 38 C42 32 32 36 28 48 Z" fill="#582f0e"/>
        <!-- Sad droopy blue eyes & eyebrows -->
        <ellipse cx="43" cy="52" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="57" cy="52" rx="3" ry="3" fill="#fff"/>
        <circle cx="43" cy="52" r="1.8" fill="#0284c7"/>
        <circle cx="57" cy="52" r="1.8" fill="#0284c7"/>
        <path d="M38 46 Q43 50 47 48" stroke="#582f0e" stroke-width="1.8" fill="none"/>
        <path d="M53 48 Q57 50 62 46" stroke="#582f0e" stroke-width="1.8" fill="none"/>
        <!-- Long nose & sad mouth -->
        <path d="M49 51 L50 64 L47 65" stroke="#d97706" stroke-width="1.8" fill="none"/>
        <path d="M45 74 Q50 71 55 74" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'classic');
    }
  },

  // 22. Sam: completely smooth bald head, round glasses
  {
    id: 'c_sam',
    name: 'Sam',
    female: 0, hat: 0, glasses: 1, facial: 0, bald: 1, earrings: 0,
    hairColor: 'white', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#d97706"/>
        <ellipse cx="50" cy="56" rx="20" ry="25" fill="#fcd3b0"/>
        <!-- Completely bald scalp highlight -->
        <path d="M40 34 Q50 31 60 34" stroke="#fff" stroke-width="2.5" opacity="0.9" fill="none"/>
        <!-- Round glasses -->
        <circle cx="42" cy="52" r="6.5" stroke="#1f2937" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="52" r="6.5" stroke="#1f2937" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="52" x2="52" y2="52" stroke="#1f2937" stroke-width="1.8"/>
        <circle cx="42" cy="52" r="1.8" fill="#451a03"/>
        <circle cx="58" cy="52" r="1.8" fill="#451a03"/>
        <!-- Small mouth -->
        <line x1="46" y1="71" x2="54" y2="71" stroke="#991b1b" stroke-width="2"/>
      `, this.name, elim, 'classic');
    }
  },

  // 23. Susan: long glamourous blonde hair, red lipstick, blue eyes
  {
    id: 'c_susan',
    name: 'Susan',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#7c3aed"/>
        <!-- Long flowing blonde hair behind -->
        <path d="M22 45 C16 70 18 95 30 100 L70 100 C82 95 84 70 78 45 Z" fill="#fde047"/>
        <ellipse cx="50" cy="55" rx="19" ry="23" fill="#fde2d0"/>
        <!-- Rosy cheeks -->
        <circle cx="36" cy="62" r="5" fill="#f43f5e" opacity="0.4"/>
        <circle cx="64" cy="62" r="5" fill="#f43f5e" opacity="0.4"/>
        <!-- Glamour blue eyes with lashes -->
        <ellipse cx="43" cy="50" rx="3.5" ry="4" fill="#fff"/>
        <ellipse cx="57" cy="50" rx="3.5" ry="4" fill="#fff"/>
        <circle cx="43" cy="50" r="2.2" fill="#0284c7"/>
        <circle cx="57" cy="50" r="2.2" fill="#0284c7"/>
        <path d="M38 45 Q43 43 48 45" stroke="#854d0e" stroke-width="1.8" fill="none"/>
        <path d="M52 45 Q57 43 62 45" stroke="#854d0e" stroke-width="1.8" fill="none"/>
        <!-- Bright red lips -->
        <path d="M44 68 Q50 72 56 68 Q50 77 44 68 Z" fill="#e11d48"/>
        <!-- Blonde bangs front -->
        <path d="M26 46 C26 26 74 26 74 46 C66 38 56 36 50 40 C44 36 34 38 26 46 Z" fill="#facc15"/>
      `, this.name, elim, 'classic');
    }
  },

  // 24. Tom: bald top with black hair fringes, black glasses, long face
  {
    id: 'c_tom',
    name: 'Tom',
    female: 0, hat: 0, glasses: 1, facial: 0, bald: 1, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#155e75"/>
        <ellipse cx="50" cy="58" rx="18" ry="26" fill="#fcd3b0"/>
        <!-- Black hair fringes on sides -->
        <path d="M28 50 C26 62 28 66 32 64 M72 50 C74 62 72 66 68 64" stroke="#18181b" stroke-width="4" fill="none"/>
        <!-- Bald top shine -->
        <path d="M42 34 Q50 32 58 34" stroke="#fff" stroke-width="2" opacity="0.8" fill="none"/>
        <!-- Thick black glasses -->
        <circle cx="42" cy="52" r="6.5" stroke="#18181b" stroke-width="2.2" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="52" r="6.5" stroke="#18181b" stroke-width="2.2" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="52" x2="52" y2="52" stroke="#18181b" stroke-width="2.2"/>
        <circle cx="42" cy="52" r="1.8" fill="#18181b"/>
        <circle cx="58" cy="52" r="1.8" fill="#18181b"/>
        <!-- Long nose & neutral mouth -->
        <path d="M49 52 L50 65 L47 66" stroke="#d97706" stroke-width="1.8" fill="none"/>
        <line x1="45" y1="74" x2="55" y2="74" stroke="#991b1b" stroke-width="2"/>
      `, this.name, elim, 'classic');
    }
  }
];

/* ======================================================================
   MODERN FRIEND CARDS GUESS WHO CHARACTERS (from GuessWho-Screen-5.jpg)
   ====================================================================== */

export const MODERN_DECK: GuessWhoChar[] = [
  // 1. Amy: black bob with purple tips, glasses, notepad badge
  {
    id: 'm_amy',
    name: 'Amy',
    female: 1, hat: 0, glasses: 1, facial: 0, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    badgeIcon: '📝', badgeName: 'Notes',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#1e1b4b"/>
        <!-- Purple tips hair bob -->
        <path d="M24 45 C20 70 24 88 32 88 L68 88 C76 88 80 70 76 45 Z" fill="#581c87"/>
        <ellipse cx="50" cy="56" rx="19" ry="23" fill="#fde2d0"/>
        <!-- Dark bob with bangs -->
        <path d="M25 50 C24 30 76 30 75 50 C70 42 58 40 50 42 C42 40 30 42 25 50 Z" fill="#18181b"/>
        <!-- Black rectangular glasses -->
        <rect x="36" y="47" width="12" height="10" rx="2" stroke="#18181b" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
        <rect x="52" y="47" width="12" height="10" rx="2" stroke="#18181b" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="52" x2="52" y2="52" stroke="#18181b" stroke-width="2"/>
        <circle cx="42" cy="52" r="2" fill="#3b0764"/>
        <circle cx="58" cy="52" r="2" fill="#3b0764"/>
        <path d="M45 68 Q50 72 55 68" stroke="#be123c" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 2. David: blonde, blue baseball cap, baseball badge
  {
    id: 'm_david',
    name: 'David',
    female: 0, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    badgeIcon: '⚾', badgeName: 'Baseball',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#1e3a8a"/>
        <ellipse cx="50" cy="57" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Blonde locks -->
        <path d="M28 50 C26 62 30 68 34 66 M72 50 C74 62 70 68 66 66" stroke="#facc15" stroke-width="4" fill="none"/>
        <!-- Blue cap -->
        <path d="M26 44 C26 26 74 26 74 44 Z" fill="#2563eb"/>
        <ellipse cx="50" cy="44" rx="26" ry="6" fill="#1d4ed8"/>
        <path d="M28 44 Q50 48 78 42" stroke="#1e40af" stroke-width="3" fill="none"/>
        <!-- Eyes & smile -->
        <circle cx="43" cy="52" r="2.2" fill="#0284c7"/>
        <circle cx="57" cy="52" r="2.2" fill="#0284c7"/>
        <path d="M44 68 Q50 75 56 68" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 3. Leo: gray hair swept back, tan skin, lizard badge
  {
    id: 'm_leo',
    name: 'Leo',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'white', eyeColor: 'brown',
    badgeIcon: '🦎', badgeName: 'Lizard',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#047857"/>
        <ellipse cx="50" cy="56" rx="19" ry="24" fill="#d4a373"/>
        <!-- Gray swept back hair -->
        <path d="M26 46 C26 24 74 24 74 46 C68 32 56 30 50 34 C44 30 32 32 26 46 Z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
        <!-- Warm brown eyes -->
        <circle cx="43" cy="51" r="2.2" fill="#3f2e1a"/>
        <circle cx="57" cy="51" r="2.2" fill="#3f2e1a"/>
        <path d="M44 68 Q50 74 56 68" stroke="#78350f" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 4. Gabe: dark clean buzz cut, olive skin, soccer ball badge
  {
    id: 'm_gabe',
    name: 'Gabe',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    badgeIcon: '⚽', badgeName: 'Soccer',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#0284c7"/>
        <ellipse cx="50" cy="55" rx="20" ry="24" fill="#e5b88f"/>
        <!-- Clean dark buzz cut -->
        <path d="M28 44 C28 28 72 28 72 44 Z" fill="#27272a"/>
        <circle cx="43" cy="50" r="2.2" fill="#18181b"/>
        <circle cx="57" cy="50" r="2.2" fill="#18181b"/>
        <path d="M44 67 Q50 73 56 67" stroke="#854d0e" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 5. Katie: blonde ponytail, green cap, basketball badge
  {
    id: 'm_katie',
    name: 'Katie',
    female: 1, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'blue',
    badgeIcon: '🏀', badgeName: 'Basketball',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#ea580c"/>
        <!-- High blonde ponytail coming through back of cap -->
        <path d="M68 38 C76 26 84 40 82 54 C78 50 72 44 68 38 Z" fill="#facc15"/>
        <ellipse cx="50" cy="57" rx="19" ry="23" fill="#fde2d0"/>
        <!-- Green baseball cap -->
        <path d="M26 44 C26 26 74 26 74 44 Z" fill="#16a34a"/>
        <ellipse cx="50" cy="44" rx="26" ry="6" fill="#15803d"/>
        <!-- Eyes & smile -->
        <circle cx="43" cy="53" r="2.2" fill="#0284c7"/>
        <circle cx="57" cy="53" r="2.2" fill="#0284c7"/>
        <path d="M44 69 Q50 75 56 69" stroke="#dc2626" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 6. Olivia: dreadlocks with red/burgundy highlights, palette badge
  {
    id: 'm_olivia',
    name: 'Olivia',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'red', eyeColor: 'brown',
    badgeIcon: '🎨', badgeName: 'Art',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#4338ca"/>
        <!-- Red highlighted dreads behind -->
        <path d="M22 45 C18 68 22 92 32 94 M78 45 C82 68 78 92 68 94" stroke="#991b1b" stroke-width="6" fill="none"/>
        <ellipse cx="50" cy="56" rx="19" ry="23" fill="#6d4c41"/>
        <!-- Top dreads -->
        <path d="M30 40 C34 26 46 24 50 38 M44 26 C52 24 64 26 68 40" stroke="#18181b" stroke-width="5" fill="none"/>
        <path d="M36 32 L40 44 M56 32 L54 44" stroke="#dc2626" stroke-width="3" fill="none"/>
        <circle cx="43" cy="51" r="2.2" fill="#271c19"/>
        <circle cx="57" cy="51" r="2.2" fill="#271c19"/>
        <path d="M44 68 Q50 74 56 68" stroke="#be123c" stroke-width="2.2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 7. Jordan: blonde frosted tips dreads, goatee, football badge
  {
    id: 'm_jordan',
    name: 'Jordan',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'blonde', eyeColor: 'brown',
    badgeIcon: '🏈', badgeName: 'Football',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#b91c1c"/>
        <ellipse cx="50" cy="56" rx="19" ry="24" fill="#5d4037"/>
        <!-- Spiky dreads with blonde tips -->
        <path d="M30 38 L30 24 M40 34 L40 20 M50 32 L50 18 M60 34 L60 20 M70 38 L70 24" stroke="#18181b" stroke-width="5" stroke-linecap="round"/>
        <path d="M30 26 L30 22 M40 22 L40 18 M50 20 L50 16 M60 22 L60 18 M70 26 L70 22" stroke="#facc15" stroke-width="5" stroke-linecap="round"/>
        <circle cx="43" cy="51" r="2.2" fill="#18181b"/>
        <circle cx="57" cy="51" r="2.2" fill="#18181b"/>
        <!-- Goatee -->
        <path d="M47 70 Q50 75 53 70 Z" fill="#18181b"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 8. Carmen: cropped silver-white hair, gold hoop, dark skin, skates badge
  {
    id: 'm_carmen',
    name: 'Carmen',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 1,
    hairColor: 'white', eyeColor: 'brown',
    badgeIcon: '⛸️', badgeName: 'Skates',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#1e293b"/>
        <ellipse cx="50" cy="56" rx="20" ry="24" fill="#6d4c41"/>
        <!-- Chic short silver hair -->
        <path d="M28 44 C28 26 72 26 72 44 Z" fill="#e2e8f0"/>
        <!-- Gold hoop earring -->
        <circle cx="28" cy="62" r="4.5" stroke="#facc15" stroke-width="1.8" fill="none"/>
        <circle cx="72" cy="62" r="4.5" stroke="#facc15" stroke-width="1.8" fill="none"/>
        <circle cx="43" cy="51" r="2.2" fill="#261c14"/>
        <circle cx="57" cy="51" r="2.2" fill="#261c14"/>
        <path d="M44 68 Q50 74 56 68" stroke="#be123c" stroke-width="2.2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 9. Laura: long wavy black hair, gold earrings, violin badge
  {
    id: 'm_laura',
    name: 'Laura',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 1,
    hairColor: 'black', eyeColor: 'brown',
    badgeIcon: '🎻', badgeName: 'Violin',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#831843"/>
        <!-- Long black hair flowing down -->
        <path d="M22 45 C18 68 20 95 30 100 L70 100 C80 95 82 68 78 45 Z" fill="#18181b"/>
        <ellipse cx="50" cy="55" rx="19" ry="23" fill="#d4a373"/>
        <!-- Gold earrings -->
        <circle cx="28" cy="62" r="4" stroke="#facc15" stroke-width="1.8" fill="none"/>
        <circle cx="72" cy="62" r="4" stroke="#facc15" stroke-width="1.8" fill="none"/>
        <circle cx="43" cy="50" r="2.2" fill="#18181b"/>
        <circle cx="57" cy="50" r="2.2" fill="#18181b"/>
        <path d="M44 68 Q50 74 56 68" stroke="#be123c" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 10. Joe: bald dark skin, round glasses, gray beard, space shuttle badge
  {
    id: 'm_joe',
    name: 'Joe',
    female: 0, hat: 0, glasses: 1, facial: 1, bald: 1, earrings: 0,
    hairColor: 'white', eyeColor: 'brown',
    badgeIcon: '🚀', badgeName: 'Space',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#0f172a"/>
        <!-- Gray beard -->
        <path d="M34 60 C32 86 68 86 66 60 Z" fill="#9ca3af"/>
        <ellipse cx="50" cy="54" rx="19" ry="23" fill="#6d4c41"/>
        <!-- Bald scalp highlight -->
        <path d="M42 32 Q50 30 58 32" stroke="#fff" stroke-width="2" opacity="0.8" fill="none"/>
        <!-- Round silver glasses -->
        <circle cx="42" cy="50" r="6" stroke="#9ca3af" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="50" r="6" stroke="#9ca3af" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="50" x2="52" y2="50" stroke="#9ca3af" stroke-width="1.8"/>
        <circle cx="42" cy="50" r="1.8" fill="#18181b"/>
        <circle cx="58" cy="50" r="1.8" fill="#18181b"/>
        <!-- Gray mustache -->
        <path d="M40 62 Q50 59 60 62" stroke="#e5e7eb" stroke-width="2.5" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 11. Mike: red beanie, dark hair, roller skate badge
  {
    id: 'm_mike',
    name: 'Mike',
    female: 0, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    badgeIcon: '👟', badgeName: 'Skate',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#0284c7"/>
        <ellipse cx="50" cy="57" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Dark hair bangs -->
        <path d="M28 50 C32 60 40 54 44 52" stroke="#18181b" stroke-width="3" fill="none"/>
        <!-- Slouchy Red beanie -->
        <path d="M26 44 C24 22 76 22 74 44 Z" fill="#dc2626"/>
        <rect x="25" y="40" width="50" height="6" rx="2" fill="#b91c1c"/>
        <circle cx="43" cy="53" r="2.2" fill="#18181b"/>
        <circle cx="57" cy="53" r="2.2" fill="#18181b"/>
        <path d="M44 69 Q50 76 56 69" stroke="#991b1b" stroke-width="2.2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 12. Al: white hair & big bushy white beard, glasses, science badge
  {
    id: 'm_al',
    name: 'Al',
    female: 0, hat: 0, glasses: 1, facial: 1, bald: 0, earrings: 0,
    hairColor: 'white', eyeColor: 'brown',
    badgeIcon: '🧪', badgeName: 'Science',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#047857"/>
        <!-- Big white beard -->
        <path d="M28 58 C24 96 76 96 72 58 Z" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="1"/>
        <ellipse cx="50" cy="54" rx="19" ry="22" fill="#8d5b4c"/>
        <!-- White curly hair -->
        <circle cx="30" cy="40" r="9" fill="#f3f4f6"/>
        <circle cx="50" cy="34" r="10" fill="#f3f4f6"/>
        <circle cx="70" cy="40" r="9" fill="#f3f4f6"/>
        <!-- Glasses -->
        <circle cx="42" cy="50" r="6" stroke="#18181b" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="50" r="6" stroke="#18181b" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="50" x2="52" y2="50" stroke="#18181b" stroke-width="1.8"/>
        <circle cx="42" cy="50" r="1.8" fill="#18181b"/>
        <circle cx="58" cy="50" r="1.8" fill="#18181b"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 13. Daniel: red hair top bun, full red beard, pencil badge
  {
    id: 'm_daniel',
    name: 'Daniel',
    female: 0, hat: 0, glasses: 0, facial: 1, bald: 0, earrings: 0,
    hairColor: 'red', eyeColor: 'blue',
    badgeIcon: '✏️', badgeName: 'Sketch',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#78350f"/>
        <!-- Top bun -->
        <circle cx="64" cy="30" r="7" fill="#ea580c"/>
        <!-- Full red beard -->
        <path d="M28 56 C24 94 76 94 72 56 Z" fill="#ea580c"/>
        <ellipse cx="50" cy="54" rx="19" ry="22" fill="#fcd3b0"/>
        <!-- Red hair -->
        <path d="M28 46 C28 28 72 28 72 46 Z" fill="#ea580c"/>
        <circle cx="43" cy="50" r="2.2" fill="#0284c7"/>
        <circle cx="57" cy="50" r="2.2" fill="#0284c7"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 14. Sophia: curly brown afro hair, red lipstick, lipstick badge
  {
    id: 'm_sophia',
    name: 'Sophia',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 1,
    hairColor: 'brown', eyeColor: 'brown',
    badgeIcon: '💄', badgeName: 'Style',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#ec4899"/>
        <!-- Voluminous curly brown hair puffs -->
        <circle cx="28" cy="38" r="12" fill="#451a03"/>
        <circle cx="50" cy="30" r="14" fill="#451a03"/>
        <circle cx="72" cy="38" r="12" fill="#451a03"/>
        <circle cx="22" cy="54" r="11" fill="#451a03"/>
        <circle cx="78" cy="54" r="11" fill="#451a03"/>
        <ellipse cx="50" cy="57" rx="19" ry="23" fill="#a16207"/>
        <!-- Red earrings -->
        <circle cx="28" cy="64" r="3.5" fill="#e11d48"/>
        <circle cx="72" cy="64" r="3.5" fill="#e11d48"/>
        <circle cx="43" cy="52" r="2.2" fill="#291e17"/>
        <circle cx="57" cy="52" r="2.2" fill="#291e17"/>
        <!-- Red lipstick -->
        <path d="M44 69 Q50 74 56 69 Q50 77 44 69 Z" fill="#e11d48"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 15. Nick: spiky blonde hair, silver hoop earring, cat badge
  {
    id: 'm_nick',
    name: 'Nick',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 1,
    hairColor: 'blonde', eyeColor: 'blue',
    badgeIcon: '🐱', badgeName: 'Cat',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#3b82f6"/>
        <ellipse cx="50" cy="56" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Spiky bleached blonde hair -->
        <path d="M26 44 L32 26 L40 34 L48 24 L56 34 L66 26 L74 44 Z" fill="#fde047"/>
        <!-- Earring on left ear -->
        <circle cx="29" cy="60" r="3.5" stroke="#94a3b8" stroke-width="1.8" fill="none"/>
        <circle cx="43" cy="51" r="2.2" fill="#0284c7"/>
        <circle cx="57" cy="51" r="2.2" fill="#0284c7"/>
        <!-- Smirk -->
        <path d="M44 68 Q52 74 58 66" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 16. Lily: blue hijab headscarf, brown hair framing face, high heel badge
  {
    id: 'm_lily',
    name: 'Lily',
    female: 1, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'brown', eyeColor: 'brown',
    badgeIcon: '👠', badgeName: 'Heel',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M24 104 C24 84 76 84 76 104 Z" fill="#0369a1"/>
        <!-- Royal blue hijab drapery -->
        <path d="M24 45 C20 70 24 95 32 98 L68 98 C76 95 80 70 76 45 Z" fill="#0284c7"/>
        <path d="M24 45 C24 22 76 22 76 45 C76 60 70 82 50 82 C30 82 24 60 24 45 Z" fill="#0369a1"/>
        <!-- Face inside scarf -->
        <ellipse cx="50" cy="56" rx="16" ry="20" fill="#d4a373"/>
        <circle cx="43" cy="51" r="2.2" fill="#3b2d1f"/>
        <circle cx="57" cy="51" r="2.2" fill="#3b2d1f"/>
        <path d="M45 68 Q50 73 55 68" stroke="#be123c" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 17. Liz: white hair, cat-eye glasses, easel badge
  {
    id: 'm_liz',
    name: 'Liz',
    female: 1, hat: 0, glasses: 1, facial: 0, bald: 0, earrings: 0,
    hairColor: 'white', eyeColor: 'blue',
    badgeIcon: '🎨', badgeName: 'Easel',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#475569"/>
        <!-- White bob hair -->
        <path d="M24 48 C24 28 76 28 76 48 C76 68 72 82 66 84 L34 84 C28 82 24 68 24 48 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
        <ellipse cx="50" cy="56" rx="18" ry="22" fill="#fde2d0"/>
        <!-- Cat-eye glasses -->
        <path d="M34 46 L46 48 L44 56 L34 50 Z" stroke="#0f172a" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <path d="M66 46 L54 48 L56 56 L66 50 Z" stroke="#0f172a" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <line x1="46" y1="48" x2="54" y2="48" stroke="#0f172a" stroke-width="1.8"/>
        <circle cx="40" cy="51" r="1.8" fill="#0284c7"/>
        <circle cx="60" cy="51" r="1.8" fill="#0284c7"/>
        <path d="M45 69 Q50 73 55 69" stroke="#be123c" stroke-width="1.8" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 18. Mia: long sleek black hair, dark skin, handbag badge
  {
    id: 'm_mia',
    name: 'Mia',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    badgeIcon: '👜', badgeName: 'Fashion',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#eab308"/>
        <!-- Sleek black hair -->
        <path d="M24 45 C20 70 20 95 32 100 L68 100 C80 95 80 70 76 45 Z" fill="#18181b"/>
        <ellipse cx="50" cy="55" rx="19" ry="23" fill="#6d4c41"/>
        <circle cx="43" cy="50" r="2.2" fill="#271c19"/>
        <circle cx="57" cy="50" r="2.2" fill="#271c19"/>
        <path d="M44 68 Q50 74 56 68" stroke="#be123c" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 19. Emma: copper red ponytail, freckles, dog badge
  {
    id: 'm_emma',
    name: 'Emma',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'red', eyeColor: 'blue',
    badgeIcon: '🐕', badgeName: 'Puppy',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#059669"/>
        <!-- High red ponytail -->
        <ellipse cx="26" cy="38" rx="8" ry="14" fill="#c2410c"/>
        <ellipse cx="50" cy="56" rx="19" ry="23" fill="#fde2d0"/>
        <path d="M26 48 C26 28 74 28 74 48 C68 38 56 36 50 40 C44 36 32 38 26 48 Z" fill="#ea580c"/>
        <!-- Freckles -->
        <circle cx="44" cy="58" r="0.8" fill="#b45309"/>
        <circle cx="47" cy="59" r="0.8" fill="#b45309"/>
        <circle cx="53" cy="59" r="0.8" fill="#b45309"/>
        <circle cx="56" cy="58" r="0.8" fill="#b45309"/>
        <circle cx="43" cy="51" r="2.2" fill="#0284c7"/>
        <circle cx="57" cy="51" r="2.2" fill="#0284c7"/>
        <path d="M44 68 Q50 74 56 68" stroke="#dc2626" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 20. Rachel: brunette wavy hair, round glasses, hoops, snare drum badge
  {
    id: 'm_rachel',
    name: 'Rachel',
    female: 1, hat: 0, glasses: 1, facial: 0, bald: 0, earrings: 1,
    hairColor: 'brown', eyeColor: 'brown',
    badgeIcon: '🥁', badgeName: 'Drums',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#b91c1c"/>
        <path d="M22 45 C18 68 22 90 32 92 M78 45 C82 68 78 90 68 92" stroke="#582f0e" stroke-width="6" fill="none"/>
        <ellipse cx="50" cy="56" rx="19" ry="23" fill="#fde2d0"/>
        <path d="M26 46 C26 26 74 26 74 46 Z" fill="#78350f"/>
        <!-- Hoop earrings -->
        <circle cx="28" cy="62" r="4.5" stroke="#facc15" stroke-width="1.8" fill="none"/>
        <circle cx="72" cy="62" r="4.5" stroke="#facc15" stroke-width="1.8" fill="none"/>
        <!-- Round glasses -->
        <circle cx="42" cy="52" r="6" stroke="#92400e" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="52" r="6" stroke="#92400e" stroke-width="1.8" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="52" x2="52" y2="52" stroke="#92400e" stroke-width="1.8"/>
        <circle cx="42" cy="52" r="1.8" fill="#451a03"/>
        <circle cx="58" cy="52" r="1.8" fill="#451a03"/>
        <path d="M44 69 Q50 74 56 69" stroke="#be123c" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 21. Ben: tousled brown hair, black spectacles, Saturn planet badge
  {
    id: 'm_ben',
    name: 'Ben',
    female: 0, hat: 0, glasses: 1, facial: 0, bald: 0, earrings: 0,
    hairColor: 'brown', eyeColor: 'brown',
    badgeIcon: '🪐', badgeName: 'Planet',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#312e81"/>
        <ellipse cx="50" cy="56" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Tousled brown hair -->
        <path d="M26 44 C26 24 74 24 74 44 C66 32 58 36 50 32 C42 36 34 32 26 44 Z" fill="#582f0e"/>
        <!-- Black rectangular glasses -->
        <rect x="36" y="47" width="12" height="10" rx="2" stroke="#18181b" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
        <rect x="52" y="47" width="12" height="10" rx="2" stroke="#18181b" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
        <line x1="48" y1="52" x2="52" y2="52" stroke="#18181b" stroke-width="2"/>
        <circle cx="42" cy="52" r="1.8" fill="#451a03"/>
        <circle cx="58" cy="52" r="1.8" fill="#451a03"/>
        <path d="M44 68 Q50 74 56 68" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 22. Eric: electric blue spiky hair, electric guitar badge
  {
    id: 'm_eric',
    name: 'Eric',
    female: 0, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'blue',
    badgeIcon: '🎸', badgeName: 'Guitar',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#0f172a"/>
        <ellipse cx="50" cy="56" rx="19" ry="24" fill="#fcd3b0"/>
        <!-- Spiky electric blue hair -->
        <path d="M26 46 L30 26 L38 34 L46 20 L54 34 L62 24 L72 46 Z" fill="#2563eb"/>
        <circle cx="43" cy="51" r="2.2" fill="#0284c7"/>
        <circle cx="57" cy="51" r="2.2" fill="#0284c7"/>
        <path d="M44 68 Q50 74 56 68" stroke="#991b1b" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 23. Farah: sleek black high ponytail, deep brown skin, fish badge
  {
    id: 'm_farah',
    name: 'Farah',
    female: 1, hat: 0, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'black', eyeColor: 'brown',
    badgeIcon: '🐠', badgeName: 'Fish',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 86 74 86 74 104 Z" fill="#0e7490"/>
        <!-- High sleek black ponytail -->
        <ellipse cx="74" cy="40" rx="8" ry="16" fill="#18181b"/>
        <ellipse cx="50" cy="56" rx="19" ry="23" fill="#5d4037"/>
        <path d="M28 44 C28 26 72 26 72 44 Z" fill="#18181b"/>
        <circle cx="43" cy="51" r="2.2" fill="#18181b"/>
        <circle cx="57" cy="51" r="2.2" fill="#18181b"/>
        <path d="M44 68 Q50 74 56 68" stroke="#be123c" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  },

  // 24. Sam: yellow flat cap / cabbie hat, trumpet badge
  {
    id: 'm_sam',
    name: 'Sam',
    female: 0, hat: 1, glasses: 0, facial: 0, bald: 0, earrings: 0,
    hairColor: 'brown', eyeColor: 'brown',
    badgeIcon: '🎺', badgeName: 'Trumpet',
    renderSvg(elim) {
      return wrapCard(`
        <path d="M26 104 C26 84 74 84 74 104 Z" fill="#047857"/>
        <ellipse cx="50" cy="57" rx="19" ry="24" fill="#d4a373"/>
        <path d="M28 50 C26 62 30 66 34 64 M72 50 C74 62 70 66 66 64" stroke="#451a03" stroke-width="3" fill="none"/>
        <!-- Yellow newsboy/cabbie flat cap -->
        <ellipse cx="50" cy="40" rx="26" ry="14" fill="#eab308"/>
        <path d="M26 44 Q50 48 76 42" stroke="#ca8a04" stroke-width="3" fill="none"/>
        <circle cx="50" cy="28" r="2.5" fill="#ca8a04"/>
        <circle cx="43" cy="52" r="2.2" fill="#291e17"/>
        <circle cx="57" cy="52" r="2.2" fill="#291e17"/>
        <path d="M44 68 Q50 74 56 68" stroke="#78350f" stroke-width="2" fill="none"/>
      `, this.name, elim, 'modern', this.badgeIcon);
    }
  }
];

export function getDeck(edition: DeckEdition): GuessWhoChar[] {
  return edition === 'modern' ? MODERN_DECK : CLASSIC_DECK;
}
