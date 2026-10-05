// Escenarios del mod "Play a Scenario" de los mods de ejemplo oficiales:
// github.com/CitizenOfRomeDynastyAscendant/example-mods (mods/play_scenario).
// Software: Citizen Of Rome - Dynasty Ascendant; Example Mods.
// Licensor: Sathvik Software Solutions. Licencia: CC BY-NC-SA 4.0
// (https://creativecommons.org/licenses/by-nc-sa/4.0/) con la condición
// "Commons Clause" v1.0: no se concede el derecho a venderlo.
//
// Los datos son los del mod; solo cambia la forma: cada escenario es una función
// para que las habilidades al azar se tiren de nuevo en cada partida. El título y
// la descripción están en locales/*.json (scn_<id> y scn_<id>_info).

// Habilidad al azar: base + 0..10.
const r = (base = 0) => Math.round(Math.random() * 10) + base
const skills = (i, s, e, c) => ({ intelligence: r(i), stewardship: r(s), eloquence: r(e), combat: r(c) })
// Hijos que empiezan estudiando en un ludus privado.
const ludus = () => ({
  flagIsBusy: true, flagAttendingLudus: 'private',
  actions: { beginLudusEducation: { isAvailable: false }, endLudusEducation: { isAvailable: false } },
  statuses: {},
})

const caesar = () => ({
  characterId: 'Gaius_Julius_Caesar_Father',
  date: { day: 14, month: 6, year: 661 },
  cash: 250000,
  influence: 30000,
  property: { farmland: 25, vinyard: 20, latifundiumAnimal: 2 },
  dynasties: {
    Julius_Caesar: { id: 'Julius_Caesar', nomen: 'Julius', cognomen: 'Caesar', prestige: 150000, heritage: 'roman_patrician' },
    Aurelius_Cotta: { id: 'Aurelius_Cotta', nomen: 'Aurelius', cognomen: 'Cotta', prestige: 100000, heritage: 'roman_novus_homo' },
  },
  characters: {
    Gaius_Julius_Caesar_Father: {
      id: 'Gaius_Julius_Caesar_Father', dynastyId: 'Julius_Caesar', isDead: false, gender: 'male', isMale: true,
      praenomen: 'Gaius', agnomen: '', birthMonth: 3, birthYear: 613, job: 'senator', jobLevel: 0,
      spouseId: 'Aurelia_Mother', fatherId: null, motherId: null,
      childrenIds: ['Julia_Major', 'Julia_Minor', 'Gaius_Julius_Caesar'],
      traits: ['oratorDeliberative', 'formerMagistrate', 'formerMilitaryTribune', 'veteran', 'senator', 'formerQuaestor', 'formerPraetor', 'formerProPraetor'],
      skills: skills(20, 20, 20, 20), look: { group: 'roman', type: 'black' },
      flagServedQuaestor: true, flagServedPraetor: true, inheritance: 0,
    },
    Aurelia_Mother: {
      id: 'Aurelia_Mother', dynastyId: 'Aurelius_Cotta', isDead: false, gender: 'female', isMale: false,
      praenomen: 'Aurelia', agnomen: '', birthMonth: 5, birthYear: 633, job: null, jobLevel: 0,
      spouseId: 'Gaius_Julius_Caesar_Father', fatherId: null, motherId: null,
      childrenIds: ['Julia_Major', 'Julia_Minor', 'Gaius_Julius_Caesar'],
      traits: ['educated'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type: 'brown' }, inheritance: 50000,
    },
    Julia_Major: {
      id: 'Julia_Major', dynastyId: 'Julius_Caesar', isDead: false, gender: 'female', isMale: false,
      praenomen: 'Julia', agnomen: 'Major', birthMonth: 8, birthYear: 651, job: null, jobLevel: 0,
      spouseId: null, fatherId: 'Gaius_Julius_Caesar_Father', motherId: 'Aurelia_Mother', childrenIds: [],
      traits: ['literate'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type: 'black' }, inheritance: 0, ...ludus(),
    },
    Julia_Minor: {
      id: 'Julia_Minor', dynastyId: 'Julius_Caesar', isDead: false, gender: 'female', isMale: false,
      praenomen: 'Julia', agnomen: 'Minor', birthMonth: 2, birthYear: 652, job: null, jobLevel: 0,
      spouseId: null, fatherId: 'Gaius_Julius_Caesar_Father', motherId: 'Aurelia_Mother', childrenIds: [],
      traits: ['literate'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type: 'brown' }, inheritance: 0, ...ludus(),
    },
    Gaius_Julius_Caesar: {
      id: 'Gaius_Julius_Caesar', dynastyId: 'Julius_Caesar', isDead: false, gender: 'male', isMale: true,
      praenomen: 'Gaius', agnomen: '', birthMonth: 6, birthYear: 653, job: null, jobLevel: 0,
      spouseId: null, fatherId: 'Gaius_Julius_Caesar_Father', motherId: 'Aurelia_Mother', childrenIds: [],
      traits: ['ambitious', 'authoritative', 'faunnic'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type: 'black' },
      inheritance: 0, flagAssignedPersonalityTrait: true, ...ludus(),
    },
  },
})

const agrippa = () => ({
  characterId: 'Marcus_Vipsanius_Agrippa',
  date: { day: 1, month: 4, year: 716 },
  cash: 10000,
  influence: 20000,
  property: { horse: 1, farmland: 2, vinyard: 3, insulae: 5, tradeships: 5, fishingBoat: 20, donkey: 30, pig: 30, cattle: 25, chicken: 25 },
  dynasties: {
    Vipsanius_Agrippa: { id: 'Vipsanius_Agrippa', nomen: 'Vipsanius', cognomen: 'Agrippa', prestige: 1500, heritage: 'roman_plebian' },
    Aurelius_Mysticus: { id: 'Aurelius_Mysticus', nomen: 'Aurelius', cognomen: 'Mysticus', prestige: 100, heritage: 'roman_freedman' },
  },
  characters: {
    Marcus_Vipsanius_Agrippa_Father: {
      id: 'Marcus_Vipsanius_Agrippa_Father', dynastyId: 'Vipsanius_Agrippa', isDead: true, gender: 'male', isMale: true,
      praenomen: 'Lucius', agnomen: '', birthMonth: 11, birthYear: 664, deathMonth: 3, deathYear: 705, job: null, jobLevel: 0,
      spouseId: 'Aurelia_Mother', fatherId: null, motherId: null,
      childrenIds: ['Lucius_Vipsanius', 'Vipsania_Polla', 'Marcus_Vipsanius_Agrippa'],
      traits: ['veteran', 'oratorDeliberative'], skills: skills(10, 0, 0, 7), inheritance: 0, flagAssignedPersonalityTrait: true,
    },
    Aurelia_Mother: {
      id: 'Aurelia_Mother', dynastyId: 'Aurelius_Mysticus', isDead: false, gender: 'female', isMale: false,
      praenomen: 'Aurelia', agnomen: '', birthMonth: 9, birthYear: 669, job: 'physician', jobLevel: 6,
      spouseId: 'Marcus_Vipsanius_Agrippa_Father', fatherId: null, motherId: null,
      childrenIds: ['Lucius_Vipsanius', 'Vipsania_Polla', 'Marcus_Vipsanius_Agrippa'],
      traits: ['educated', 'illness', 'mystic'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type: 'auburn' },
      inheritance: 0, flagAssignedPersonalityTrait: true,
    },
    Marcus_Vipsanius_Agrippa: {
      id: 'Marcus_Vipsanius_Agrippa', dynastyId: 'Vipsanius_Agrippa', isDead: false, gender: 'male', isMale: true,
      praenomen: 'Marcus', agnomen: '', cognomen: 'Agrippa', birthMonth: 1, birthYear: 690, job: null, jobLevel: 0,
      spouseId: null, fatherId: 'Marcus_Vipsanius_Agrippa_Father', motherId: 'Aurelia_Mother', childrenIds: [],
      traits: ['genius', 'erudite', 'oratorJudicial', 'philosopher', 'honorable', 'formerPlebianTribune', 'formerPraetor'],
      skills: skills(20, 10, 15, 10), look: { group: 'roman', type: 'black' },
      flagAssignedPersonalityTrait: true, flagPlayScenarioModIsMarcusAgrippa: true,
    },
    Vipsania_Polla: {
      id: 'Vipsania_Polla', dynastyId: 'Vipsanius_Agrippa', isDead: false, gender: 'female', isMale: false,
      praenomen: 'Vipsania Polla', nomen: ' ', agnomen: '', cognomen: ' ', birthMonth: 2, birthYear: 684, job: null, jobLevel: 0,
      fatherId: 'Marcus_Vipsanius_Agrippa_Father', motherId: 'Aurelia_Mother', childrenIds: [],
      traits: ['oratorDeliberative', 'honorable'], skills: skills(10, 5, 10, 5), look: { group: 'roman', type: 'black' },
      flagAssignedPersonalityTrait: true,
    },
    Lucius_Vipsanius: {
      id: 'Lucius_Vipsanius', dynastyId: 'Vipsanius_Agrippa', isDead: false, gender: 'male', isMale: true,
      praenomen: 'Lucius', agnomen: '', birthMonth: 3, birthYear: 685, job: null, jobLevel: 0,
      fatherId: 'Marcus_Vipsanius_Agrippa_Father', motherId: 'Aurelia_Mother', childrenIds: [],
      traits: ['oratorJudicial'], skills: skills(10, 0, 0, 10), look: { group: 'roman', type: 'black' },
      flagAssignedPersonalityTrait: false,
    },
  },
})

const antony = () => {
  const son = (id, praenomen, birthYear, type, extra) => ({
    id, dynastyId: 'Antonius', isDead: false, gender: 'male', isMale: true,
    praenomen, agnomen: '', birthMonth: 1, birthYear, job: null, jobLevel: 0,
    spouseId: null, fatherId: 'Marcus_Antonius_Creticus', motherId: 'Julia', childrenIds: [],
    traits: ['literate', 'rude', 'gregarious'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type },
    inheritance: 0, flagAssignedPersonalityTrait: true, ...ludus(), ...extra,
  })
  return {
    characterId: 'Julia',
    date: { day: 14, month: 6, year: 683 },
    cash: 2000,
    influence: 1000,
    property: { farmland: 15, vinyard: 10 },
    dynasties: {
      Antonius: { id: 'Antonius', nomen: 'Antonius', cognomen: '', prestige: 1500, heritage: 'roman_plebian' },
    },
    characters: {
      Julia: {
        id: 'Julia', dynastyId: 'Antonius', isDead: false, gender: 'female', isMale: false,
        praenomen: 'Julia', agnomen: '', cognomen: 'Caesar', birthMonth: 3, birthYear: 650, job: null, jobLevel: 0,
        spouseId: 'Marcus_Antonius_Creticus', fatherId: null, motherId: null,
        childrenIds: ['Antonia', 'Mark_Antony', 'Gaius', 'Lucius'],
        traits: ['educated', 'stress'], skills: skills(20, 20, 20, 20), look: { group: 'roman', type: 'black' },
        flagServedPraetor: true, inheritance: 0,
      },
      Marcus_Antonius_Creticus: {
        id: 'Marcus_Antonius_Creticus', dynastyId: 'Antonius', isDead: true, gender: 'male', isMale: true,
        praenomen: 'Marcus', agnomen: 'Creticus', birthMonth: 5, birthYear: 644,
        deathday: 1, deathMonth: 5, deathYear: 683, deathCause: 'executed', job: 'praetor', jobLevel: 0,
        spouseId: 'Julia', fatherId: null, motherId: null,
        childrenIds: ['Antonia', 'Mark_Antony', 'Gaius', 'Lucius'],
        traits: ['educated'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type: 'brown' },
        inheritance: 50000, flagServedPraetor: true,
      },
      Antonia: {
        id: 'Antonia', dynastyId: 'Antonius', isDead: false, gender: 'female', isMale: false,
        praenomen: 'Antonia', agnomen: '', birthDay: 14, birthMonth: 1, birthYear: 670, job: null, jobLevel: 0,
        spouseId: null, fatherId: 'Marcus_Antonius_Creticus', motherId: 'Julia', childrenIds: [],
        traits: ['literate'], skills: skills(10, 10, 10, 10), look: { group: 'roman', type: 'auburn' }, inheritance: 0, ...ludus(),
      },
      Mark_Antony: son('Mark_Antony', 'Marcus', 671, 'black', { birthDay: 14 }),
      Gaius: son('Gaius', 'Gaius', 672, 'brown'),
      Lucius: son('Lucius', 'Lucius', 676, 'brown_curly'),
    },
  }
}

// Evento del escenario de Agrippa (marry_attica): a los 25½–26½ años, si no está
// casado, puede casarse con Attica (o negarse, con una penalización).
const attica = () => ({
  characterFeatures: {
    isDead: false, isMale: false, praenomen: 'Attica', agnomen: '', birthMonth: 3, birthYear: 695,
    job: null, jobLevel: 0, spouseId: null, fatherId: null, motherId: null, childrenIds: [],
    traits: ['oratorDeliberative', 'weak'],
    skills: { intelligence: r(4), stewardship: r(6), eloquence: r(8), combat: r(0) },
    look: { group: 'roman', type: 'blonde' }, flagAssignedPersonalityTrait: false,
  },
  dynastyFeatures: { id: 'Pomponius_Atticus', nomen: 'Pomponius', cognomen: 'Atticus', prestige: 40000, heritage: 'roman_novus_homo' },
})

module.exports = {
  list: [
    { id: 'caesar', data: caesar },
    { id: 'agrippa', data: agrippa },
    { id: 'antony', data: antony },
  ],
  attica,
}
