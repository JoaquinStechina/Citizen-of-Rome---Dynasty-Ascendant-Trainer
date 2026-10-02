// Árboles de decisión de los eventos militares del juego (v1.6.36), copiados de
// su código (módulos 'war/<evento>'). Si una actualización cambia un evento,
// se corrige aquí.
//
// Cada evento: quién lo recibe (who: 'soldier' | 'commander'), el primer aviso
// (start, o starts por tipo de personaje) y sus pasos (steps). Un paso es un
// método del juego: la clave es su nombre, o 'método:contexto' cuando el juego le
// pasa context.examine / context.type y eso cambia el resultado.
//
// Un paso es una lista de ramas al azar: { p, ...efectos, options }.
//   p        probabilidad (número o función del personaje); si falta, 1.
//   efectos  pr / inf / cash (prestigio, influencia, dinero; sc = cuáles escala el
//            juego por ingresos, por defecto prestigio e influencia), death,
//            crown (rasgo de la corona; también da su logro), traits (lista de
//            rasgos o función del personaje), endWar (adelanta el fin de la
//            guerra), endTerm (termina tu servicio militar), exile.
//   options  la ventana siguiente: [{ text, to, st }]; `to` es el paso al que
//            lleva (nada = sin consecuencias) y `st` lo que cambia al pulsarla.
//   roll     en los pasos con azar, los valores que tiene que devolver Math.random
//            (en orden, uno por llamada del método del juego) para que salga
//            esta rama. Lo usa "forzar resultado" del consejo (game.chooseOption).

const SCALED = ['prestige', 'influence']
const ALL = ['prestige', 'influence', 'cash']
const HI = 0.9999 // tirada alta (las comparaciones del juego son > 0,x o < 0,x)

// Heridas que dependen de las que ya se tienen.
const leg = ch => ch?.traits?.includes('noLeg') ? [] : ch?.traits?.includes('oneLeg') ? ['noLeg'] : ['oneLeg'] // con noLeg el juego intenta 'severlyMangled', que no existe
const hand = (ch, worst = 'mangled') => ch?.traits?.includes('noHand') ? [worst] : ch?.traits?.includes('oneHand') ? ['noHand'] : ['oneHand']
const eye = ch => ch?.traits?.includes('oneEyed') ? ['blind'] : ['oneEyed']
const has = (ch, id) => !!ch?.traits?.includes(id)
const sk = (ch, k) => ch?.skills?.[k] || 0
const clamp = x => Math.max(0, Math.min(1, x))

const EVENTS = {
  'war/coronaCivica': {
    who: 'soldier', title: 'War: At Battle', crown: 'coronaCivica',
    start: [{ text: 'To each their own' }, { text: 'Assist them!', to: 'assist' }],
    steps: {
      assist: [{ options: [{ text: 'Stand my ground', to: 'stand' }, { text: 'Let the fellow soldier die a martyr', to: 'die' }] }],
      stand: [{ p: 0.3, roll: [0], options: [{ text: 'I have done my best', to: 'vGood' }] }, { p: 0.7, roll: [HI, HI], death: true }],
      vGood: [{ p: 0.3, roll: [0], crown: 'coronaCivica', endWar: true }, { p: 0.7, roll: [HI], endWar: true }],
      die: [{ traits: ['depression'] }],
    },
  },

  'war/coronaRostrata': {
    who: 'commander', title: 'War: At Sea', crown: 'coronaRostrata',
    start: [
      { text: 'Agree to lead the Naval Battle', to: 'agree' },
      { text: 'This is a very big assignment I am not yet ready for', st: { inf: -150, pr: -50 } },
    ],
    steps: {
      agree: [{ options: [{ text: 'Pray to the Gods and lead the attack now!', to: 'attack' }, { text: 'Wait out the bad weather just in case', to: 'wait' }] }],
      attack: [{ pr: -2000, inf: -1500, traits: ['mangled'], endTerm: true }],
      wait: [{ options: [{ text: 'Let the rumors reach the enemies', to: 'let' }, { text: 'Curb the rumors immediately', to: 'curb' }] }],
      let: [{ options: [{ text: 'Launch attack now!', to: 'betterEnd' }, { text: 'Train for a little longer', to: 'betterEnd' }] }],
      curb: [{ options: [{ text: 'Dig channels', to: 'dig' }, { text: 'Look for a better strategy', to: 'better' }] }],
      better: [{ options: [{ text: 'Surprise attack the enemy harbor with the untrained fleet', to: 'betterEnd' }, { text: 'Train the men first', to: 'betterEnd' }] }],
      betterEnd: [{ pr: -2000, inf: -1500, traits: leg, endTerm: true }],
      dig: [{ options: [{ text: 'Go ahead with the heavy artillery', to: 'ahead' }, { text: 'Perhaps heavy artillery is too risky', to: 'risky' }] }],
      ahead: [
        { p: 0.5, roll: [HI], pr: 2500, inf: 2800, crown: 'coronaRostrata', traits: hand, endTerm: true },
        { p: 0.5, roll: [0], pr: -2000, inf: -1500, traits: hand, endTerm: true },
      ],
      risky: [{ pr: -2000, inf: -1500, traits: ['mangled'], endTerm: true }],
    },
  },

  'war/coronaCastrensis': {
    title: 'At War: Campaign', crown: 'coronaCastrensis',
    starts: {
      soldier: [{ text: 'Volunteer for surveying', to: 'volunteer' }, { text: 'Stay and help set up camp', to: 'stay' }],
      commander: [{ text: 'Deploy both light infantry and cavalry', to: 'survey' }, { text: 'Just light infantry should do', to: 'survey' }],
    },
    steps: {
      volunteer: [{ options: [{ text: 'Stay here and fight', to: 'fight' }, { text: 'Report and get reinforcements', to: 'report' }] }],
      stay: [{ options: [{ text: 'Not my place to decide, must wait for further orders', to: 'wait' }, { text: 'Destroy their camps!', to: 'camp' }] }],
      fight: [
        { p: 0.5, roll: [HI], options: [{ text: 'Not my place to decide, must wait for further orders', to: 'wait' }, { text: 'Destroy their camps!', to: 'camp' }] },
        { p: 0.5, roll: [0], death: true, pr: 900, inf: 800 },
      ],
      report: [
        { p: 0.5, roll: [HI], options: [{ text: 'Not my place to decide, must wait for further orders', to: 'wait' }, { text: 'Destroy their camps!', to: 'camp' }] },
        { p: 0.5, roll: [0], death: true, pr: 900, inf: 800 },
      ],
      wait: [{ pr: 1200, inf: 1400 }],
      camp: [{ p: 0.5, roll: [HI], crown: 'coronaCastrensis', pr: 2500, inf: 2000, endWar: true }, { p: 0.5, roll: [0], pr: 2000, inf: 1500, endWar: true }],
      survey: [{ options: [{ text: 'Can’t rush into battle unprepared', to: 'no' }, { text: 'Send reinforcement immediately', to: 'reinfo' }] }],
      no: [{ pr: -3000, inf: -1500 }],
      reinfo: [{ options: [{ text: 'Attack the enemy camps!', to: 'attack' }, { text: 'Ignore the enemy camps', to: 'ignore' }] }],
      attack: [{ pr: 3000, inf: 1500 }],
      ignore: [{ pr: -3500, inf: -2500 }],
    },
  },

  'war/coronaMuralis': {
    who: 'soldier', title: 'At War: Seige', crown: 'coronaMuralis',
    start: [{ text: 'I cannot leave them behind', to: 'friend' }, { text: 'I will burn incense for them if I survive this battle', to: 'nofriend' }],
    steps: {
      friend: [{ p: 0.7, roll: [HI], death: true }, { p: 0.3, roll: [0], options: [{ text: 'I did the best I could', to: 'nofriend' }] }],
      nofriend: [
        { p: 0.5, roll: [HI], options: [{ text: 'This is not how I planned to enter the city walls', to: 'slave' }] },
        { p: 0.5, roll: [0], options: [{ text: 'Escape with them definitely', to: 'escape' }, { text: 'I cannot run away like this with no honor', to: 'slave' }] },
      ],
      escape: [{}],
      slave: [{ options: [{ text: 'Strangle the guard and escape', to: 'strangle' }, { text: 'Carefully sneak past the gaurd', to: 'sneak' }] }],
      strangle: [{ p: 0.9, roll: [HI], options: [{ text: "I wish I could've saved the other soldiers as well", to: 'next' }] }, { p: 0.1, roll: [0], death: true }],
      sneak: [{ death: true }],
      next: [{ options: [
        { text: 'Agree to the treaty for now and take down the city once backup arrives', to: 'agree' },
        { text: "Let's get our friends back and leave", to: 'neutral' },
        { text: 'Reject the treaty', to: 'reject' },
      ] }],
      agree: [{ traits: ch => [...eye(ch), ...hand(ch, 'oneHand'), 'wounded'], options: [
        { text: 'Sit this one out', to: 'sit' },
        { text: "What's losing a limb for my land, go into the battle", to: 'ahead' },
      ] }],
      neutral: [{ pr: 800, inf: 500 }],
      reject: [{ death: true, pr: 750, inf: 700 }],
      sit: [{ traits: ['depression'], pr: 750, inf: 700, endWar: true }],
      ahead: [{ options: [
        { text: 'Kill the enraged civilians, I have to protect my own skin', to: 'last' },
        { text: 'Dodge their attacks, they will all be taken in as war booty anyway.', to: 'last' },
        { text: 'How dare they, kill them!', to: 'last' },
      ] }],
      last: [{ options: [{ text: 'Bring back the corpses home', to: 'bring' }, { text: 'Let them hang. What good are rotting corpses', to: 'hang' }] }],
      bring: [{ traits: ['depression'], pr: 750, inf: 700, endWar: true }],
      hang: [{ p: 0.3, roll: [HI], crown: 'coronaMuralis', pr: 2150, inf: 2700, endWar: true }, { p: 0.7, roll: [0], pr: 750, inf: 700, endWar: true }],
    },
  },

  'war/coronaObsidionalis': {
    who: 'commander', title: 'For my Legionnaires', crown: 'coronaObsidimalis',
    start: [
      { text: 'Take this case to the senate', to: 'request' },
      { text: 'Ignore the men, I only have to be here for a couple more months' },
    ],
    steps: {
      request: [{ options: [
        { text: 'Continue to plead', to: 'cont' },
        { text: 'Help my men with my own pocket', to: 'myown', st: { cash: -76000, inf: 1000, pr: 1250 } },
        { text: 'I did my part' },
      ] }],
      cont: [{ options: [{ text: 'I have no choice but to agree', to: 'war' }] }],
      myown: [{ options: [{ text: 'I have no choice but to agree', to: 'war' }] }],
      war: [{ options: [
        { text: 'Let them fight it out, we can fight off the exhausted winning army', to: 'wait' },
        { text: 'How dare they! Engage in battle now', to: 'now' },
        { text: 'Join the weaker looking army to drive out the leading army', to: 'join' },
      ] }],
      wait: [{ p: 0.4, roll: [HI], crown: 'coronaObsidimalis', pr: 3250, inf: 3000 }, { p: 0.6, roll: [0, 0], death: true }],
      now: [{ death: true }],
      join: [{ death: true }],
    },
  },

  'war/grassCrownTrack': {
    who: 'commander', title: 'A Call for Help', crown: 'coronaObsidimalis', note: 'grassNote',
    start: [
      { text: "I must rush to my fellow soldier's aid.", to: 'rushToAid' },
      { text: 'I cannot put my men in danger, you must find help elsewhere.', to: 'onSkip', st: { inf: -20, pr: -20 } },
    ],
    steps: {
      onSkip: [{}],
      rushToAid: [{ options: [
        { text: "We'll take them headon. Charge at the enemy!", to: 'result:charge' },
        { text: "We'll attack them from all sides. Split our troops!", to: 'result:split' },
      ] }],
      // Éxito si aleatorio + (habilidades)/100 > 0,8 (Strong lo asegura al cargar). El juego
      // tira dos veces (una para cargar y otra para dividir) antes de mirar cuál elegiste.
      'result:charge': [
        { p: ch => has(ch, 'strong') ? 1 : clamp(0.2 + (sk(ch, 'combat') + sk(ch, 'eloquence')) / 100), roll: [HI, HI], options: [{ text: 'No one can best the Roman army!', to: 'outcome:victory' }] },
        { p: ch => has(ch, 'strong') ? 0 : 1 - clamp(0.2 + (sk(ch, 'combat') + sk(ch, 'eloquence')) / 100), roll: [0, 0], options: [{ text: 'I will not fail my men!', to: 'probable' }] },
      ],
      'result:split': [
        { p: ch => clamp(0.2 + (sk(ch, 'intelligence') + sk(ch, 'combat')) / 100), roll: [HI, HI], options: [{ text: 'It worked!', to: 'outcome:victory' }] },
        { p: ch => 1 - clamp(0.2 + (sk(ch, 'intelligence') + sk(ch, 'combat')) / 100), roll: [0, 0], options: [{ text: 'I will not fail my men!', to: 'probable' }] },
      ],
      probable: [{ options: [
        { text: 'Keep Fighting! Our fellow Romans need us!', to: 'finalStand' },
        { text: 'We cannot hold for much longer. Retreat!', to: 'outcome:retreat' },
      ] }],
      // Éxito si aleatorio/3 + (combate + elocuencia)/120 > 0,95.
      finalStand: [
        { p: ch => clamp(1 - 3 * (0.95 - (sk(ch, 'combat') + sk(ch, 'eloquence')) / 120)), roll: [HI], options: [{ text: 'No one can best the Roman army!', to: 'outcome:victory' }] },
        { p: ch => 1 - clamp(1 - 3 * (0.95 - (sk(ch, 'combat') + sk(ch, 'eloquence')) / 120)), roll: [0], options: [
          { text: 'I must run and save my life!', to: 'outcome:run' },
          { text: 'I will stand my ground and fight!', to: 'outcome:pSafety' },
        ] },
      ],
      // outcome tira una vez (resistir) antes de mirar el tipo; huir tira otra.
      'outcome:victory': [{ crown: 'coronaObsidimalis', inf: 100, pr: 100, cash: 500, sc: ALL, endWar: true }],
      'outcome:retreat': [{ inf: -20, pr: -20, endWar: true }],
      'outcome:pSafety': [
        { p: ch => has(ch, 'strong') ? 1 : clamp(0.2 + sk(ch, 'combat') / 100), roll: [HI], traits: ['deserter'], endWar: true,
          options: [{ text: 'I have failed Rome.', to: 'desert', st: { inf: -100, pr: -100, cash: -50, sc: ALL } }] },
        { p: ch => has(ch, 'strong') ? 0 : 1 - clamp(0.2 + sk(ch, 'combat') / 100), roll: [0], death: true, pr: 100, cash: 50, sc: ['prestige', 'cash'], endWar: true },
      ],
      'outcome:run': [
        { p: 0.5, roll: [0.5, HI], endWar: true, options: [{ text: 'I will turn myself in.', to: 'desert' }, { text: 'I will run away and start my life anew.', to: 'abandon' }] },
        { p: 0.5, roll: [0.5, 0], death: true, pr: 100, cash: 50, sc: ['prestige', 'cash'], endWar: true },
      ],
      desert: [{ traits: ['deserter'], inf: -2000, pr: -2000, cash: -500, sc: ALL, exile: true }],
      abandon: [{ death: true, pr: 100, cash: 50, sc: ['prestige', 'cash'] }],
    },
  },

  'war/coronaTriumphalis': {
    who: 'commander', title: 'At War: Invasion', crown: 'coronaTriumphalis', note: 'triumphNote',
    start: [
      { text: 'We can do without inventors', to: 'noinventors' },
      { text: 'Having inventors could not hurt', to: 'inventors' },
      { text: 'If need be I can always send for some', to: 'noinventors' },
    ],
    steps: {
      inventors: [{ options: [
        { text: 'Hire a man to take out the inventor', to: 'hire' },
        { text: 'Persevere and continue to tighten the supplies', to: 'persevere:persevere' },
        { text: 'Send envoys to negotiate a surrender', to: 'envoys' },
      ] }],
      noinventors: [{ options: [{ text: 'Request the senate for inventors immediately', to: 'reqinventors' }, { text: 'Hire a man to take out the inventor', to: 'hire' }] }],
      reqinventors: [{ traits: ch => [...hand(ch, 'oneHand'), ...leg(ch)], options: [
        { text: 'Persevere and continue to tighten the supplies', to: 'persevere:persevere' },
        { text: 'Must take out the inventor!', to: 'hire' },
      ] }],
      envoys: [{ options: [{ text: 'We will persevere', to: 'persevere:envoys' }, { text: 'Wise leaders know when to quit', to: 'wise' }] }],
      wise: [{ pr: 1500, inf: 500, endTerm: true }],
      hire: [{ options: [
        { text: 'No deserter of Rome should escape punishment', to: 'persevere:deserter' },
        { text: 'We are in a bind, agree to reach out to the transfugi', to: 'transfugi' },
      ] }],
      transfugi: [
        { p: 0.5, roll: [HI], options: [{ text: 'Rome can still win', to: 'win' }] },
        { p: 0.5, roll: [0], options: [
          { text: 'Write to them personally', to: 'write', st: { cash: -6700 } },
          { text: 'Talk to the soldiers to keep up their morale', to: 'talk' },
        ] },
      ],
      write: [{ options: [{ text: 'Rome can still win', to: 'win' }] }],
      talk: [{ options: [
        { text: 'I resign as the commander', to: 'resignAsCommander', st: { pr: -5500, inf: -6500 } },
        { text: 'I can still lead my soldiers to victory', to: 'defeat' },
      ] }],
      resignAsCommander: [{ endTerm: true }],
      defeat: [{ traits: ['depression'], pr: -7500, inf: -5500, endTerm: true }],
      win: [
        { p: 0.75 * 0.45, roll: [0, 0], traits: ['severelyMangled'], crown: 'coronaTriumphalis', endWar: true },
        { p: 0.75 * 0.55, roll: [0, HI], traits: ['severelyMangled'], endWar: true },
        { p: 0.25, roll: [HI], crown: 'coronaTriumphalis', endWar: true },
      ],
      'persevere:persevere': [{ traits: ['depression'], endTerm: true }],
      'persevere:deserter': [{ traits: ['depression'], endTerm: true }],
      'persevere:envoys': [{ traits: ['depression'], pr: -4500, inf: -5500, endTerm: true }],
    },
  },

  // Desfile triunfal: llega tras ganar la Corona Triumphalis, ya en paz. El
  // contexto 'wood' (tableaux baratos) se arrastra hasta procession2.
  'war/coronaTriumphalisII': {
    who: 'triumph', title: 'Triumphator',
    start: [
      { text: 'The Kalends of March', to: 'next', st: { cash: 55000, pr: 450, inf: 150 } },
      { text: 'An upcoming auspicious day', to: 'next', st: { cash: 55000, pr: 450, inf: 150 } },
    ],
    steps: {
      next: [{ options: [
        { text: 'My paintings must be a thing of wonder', to: 'tableaux', st: { cash: -12000 } },
        { text: 'Hire a run of the mill artist', to: 'procession1:wood', st: { cash: -1500, pr: -40, inf: -100, sc: [] } },
      ] }],
      tableaux: [{ options: [
        { text: 'Ivory', to: 'procession1', st: { cash: -9000 } },
        { text: 'Wood', to: 'procession1:wood', st: { cash: -4000 } },
        { text: 'Something modest by local craftsmen will do', to: 'procession1:wood', st: { cash: -500, pr: -40, inf: -100, sc: [] } },
      ] }],
      procession1: [{ options: [{ text: 'Toga Praetexta', to: 'chariot' }, { text: 'Toga Picta', to: 'chariot' }] }],
      'procession1:wood': [{ options: [{ text: 'Toga Praetexta', to: 'chariot:wood' }, { text: 'Toga Picta', to: 'chariot:wood' }] }],
      chariot: [{ options: [{ text: 'The heirs of my house / A trusted servent', to: 'procession2' }, { text: 'My life long companion', to: 'procession2' }] }],
      'chariot:wood': [{ options: [{ text: 'The heirs of my house / A trusted servent', to: 'procession2:wood' }, { text: 'My life long companion', to: 'procession2:wood' }] }],
      procession2: [{ options: [{ text: 'This is truly the greatest feeling', to: 'ascension', st: { pr: 30000, inf: 25000 } }] }],
      'procession2:wood': [{ options: [{ text: 'This is a great feeling', to: 'ascension', st: { pr: 3000, inf: 2500 } }] }],
      ascension: [{ options: [
        { text: 'I will be merciful today', to: 'execute', st: { pr: 17000, inf: 19000 } },
        { text: 'The gods demand a sacrifice!', to: 'execute', st: { pr: 19000, inf: 15000 } },
      ] }],
      execute: [{ options: [
        { text: 'Sponsor Ludi', to: 'final', st: { cash: -43000, pr: 20000, inf: 15000 } },
        { text: 'Grandest of banquets', to: 'final', st: { cash: -33000, pr: 19000, inf: 13000 } },
        { text: 'Games and a Banquet', to: 'final', st: { cash: -60000, pr: 29000, inf: 23000 } },
        { text: 'A modest celebration will suffice', to: 'final', st: { cash: -1000, pr: -500, inf: -1000 } },
      ] }],
      final: [{ pr: 500, inf: 300 / 1.8, cash: 15000 }],
    },
  },
}

module.exports = { EVENTS, SCALED }
