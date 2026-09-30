// Citizen of Rome - Dynasty Ascendant :: trainer via Chrome DevTools Protocol
//
// Requisitos: Node 22+ (usa fetch y WebSocket nativos, sin dependencias).
// Uso:
//   1. Steam -> juego -> Propiedades -> Opciones de lanzamiento:
//        --remote-debugging-port=9222
//   2. Abre el juego y carga tu partida.
//   3. node trainer.mjs
//   4. En el juego, pulsa F8 para mostrar/ocultar el panel del trainer.
//
// El script queda conectado y vuelve a inyectar el panel si el juego recarga
// la página. Ctrl+C para salir (el panel desaparece al recargar el juego).

const PORT = Number(process.env.CDP_PORT || 9222)

// Código que se ejecuta DENTRO del juego. Crea un panel flotante que modifica
// el estado Vuex del juego (document.querySelector('#app').__vue__.$store).
const PANEL = String.raw`(() => {
  const store = () => document.querySelector('#app')?.__vue__?.$store
  const S = () => store()?.state
  const player = () => { const s = S(); return s?.characters?.[s.current.id] }
  const dynasty = () => { const s = S(), p = player(); return p && s.dynasties?.[p.dynastyId] }
  const ls = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  }

  // --- Idiomas ---------------------------------------------------------------
  // Los nombres de rasgos, trabajos y propiedades vienen del juego (solo trae inglés).
  const I18N = {
    es: {
      langName: 'Español (Argentina)', resizeHint: 'Arrastrar para redimensionar', estate: 'Propiedades de la casa', toLimit: 'Al límite', allToLimit: 'Todo al límite', propNote: 'El límite depende de tu clase y administración. Por encima de 1,2× el límite el juego puede hacerte perder propiedades (robos, enfermedades).', moveUp: 'Mover antes', moveDown: 'Mover después', dragHint: 'Arrastrar para mover el panel · bordes y esquinas para redimensionar', resetLayout: 'Restablecer posición, tamaño y orden', dragSection: 'Arrastrar para reordenar · clic en el nombre para plegar', petLife: 'adulta a los {adult}, vive ~{life} años', age: 'Edad', bornIn: 'nació en el año {year}', hideHint: 'F8 oculta',
      resources: 'Recursos', family: 'Familia', pets: 'Mascotas', multipliers: 'Multiplicadores',
      cash: 'Dinero', influence: 'Influencia', prestige: 'Prestigio',
      intelligence: 'Inteligencia', stewardship: 'Administración', eloquence: 'Elocuencia', combat: 'Combate',
      allTo: 'Todo a', familyAllTo: 'Toda la familia a', petsAllTo: 'Todas a',
      jobLevel: 'Nivel trabajo', max: 'Máx', maxTip: 'Sube al nivel máximo de este trabajo', noJob: 'sin trabajo', maxShort: 'máx',
      traits: 'Rasgos', petTraits: 'Rasgos de la mascota', add: 'Añadir',
      addTip: 'Usa la función del juego: suma los bonus del rasgo y quita sus opuestos',
      traitNote: 'Añadir/quitar un rasgo también suma/resta sus bonus de habilidad. Los opuestos se quitan solos.',
      notAvailable: 'No disponible en esta versión del juego.', noTraits: 'Sin rasgos', removeTrait: 'Quitar rasgo',
      you: '(vos)', noFamily: 'Sin familia', noPets: 'Sin mascotas', petOwner: 'de {owner}',
      aptitude: 'Aptitud', vigor: 'Vigor', tameness: 'Docilidad',
      g_education: 'Educación', g_personality: 'Personalidad', g_good: 'Buenos', g_bad: 'Malos', g_goodGenetic: 'Genética buena',
      g_badGenetic: 'Genética mala', g_neutralGenetic: 'Genética neutral', g_skill: 'Habilidad', g_militaryHonor: 'Honores militares', g_neutral: 'Neutrales / cargos',
      household: 'Casa', householdHealth: 'Salud de la casa', revenue: 'Ingresos', householdFertility: 'Fertilidad de la casa',
      householdExpenses: 'Gastos de la casa', householdStewardship: 'Administración de la casa',
      personal: 'Personal', personalHealth: 'Salud personal', personalFertility: 'Fertilidad personal',
      personalExpenses: 'Gastos personales', personalStewardship: 'Administración personal',
      petGroup: 'Mascota', petHealth: 'Salud de la mascota', petFertility: 'Fertilidad de la mascota', petExpenses: 'Gastos de la mascota',
      jobs: 'Trabajos', jobPrefix: 'Trabajo', properties: 'Propiedades', propPrefix: 'Propiedad',
      trainerFactor: 'Factor trainer', removeFactor: 'Quitar', removeFactorTip: 'Quita el factor del trainer', total: 'Total en juego',
      modNote: 'Se multiplica con los del juego. En "Gastos" conviene un factor menor que 1 (p. ej. 0.5 = mitad de gastos).',
      activeNow: 'Activos ahora', none: 'Ninguno', clickToEdit: 'Clic para editarlo arriba', removeAll: 'Quitar todos los del trainer',
      legend: '★ = incluye un factor del trainer. Verde = te favorece.',
      health: 'Salud', fertility: 'Fertilidad', expenses: 'Gastos', stewardshipShort: 'Administración', xOfY: '{x} de {y}',
    },
    pt: {
      langName: 'Português (Brasil)', resizeHint: 'Arraste para redimensionar', estate: 'Propriedades da casa', toLimit: 'No limite', allToLimit: 'Tudo no limite', propNote: 'O limite depende da sua classe e administração. Acima de 1,2× o limite o jogo pode fazer você perder propriedades (roubos, doenças).', moveUp: 'Mover para antes', moveDown: 'Mover para depois', dragHint: 'Arraste para mover o painel · bordas e cantos para redimensionar', resetLayout: 'Restaurar posição, tamanho e ordem', dragSection: 'Arraste para reordenar · clique no nome para recolher', petLife: 'adulto aos {adult}, vive ~{life} anos', age: 'Idade', bornIn: 'nasceu no ano {year}', hideHint: 'F8 oculta',
      resources: 'Recursos', family: 'Família', pets: 'Mascotes', multipliers: 'Multiplicadores',
      cash: 'Dinheiro', influence: 'Influência', prestige: 'Prestígio',
      intelligence: 'Inteligência', stewardship: 'Administração', eloquence: 'Eloquência', combat: 'Combate',
      allTo: 'Tudo em', familyAllTo: 'Família toda em', petsAllTo: 'Todos em',
      jobLevel: 'Nível trabalho', max: 'Máx', maxTip: 'Sobe para o nível máximo deste trabalho', noJob: 'sem trabalho', maxShort: 'máx',
      traits: 'Traços', petTraits: 'Traços do mascote', add: 'Adicionar',
      addTip: 'Usa a função do jogo: soma os bônus do traço e remove os opostos',
      traitNote: 'Adicionar/remover um traço também soma/subtrai seus bônus de habilidade. Os opostos são removidos sozinhos.',
      notAvailable: 'Indisponível nesta versão do jogo.', noTraits: 'Sem traços', removeTrait: 'Remover traço',
      you: '(você)', noFamily: 'Sem família', noPets: 'Sem mascotes', petOwner: 'de {owner}',
      aptitude: 'Aptidão', vigor: 'Vigor', tameness: 'Docilidade',
      g_education: 'Educação', g_personality: 'Personalidade', g_good: 'Bons', g_bad: 'Ruins', g_goodGenetic: 'Genética boa',
      g_badGenetic: 'Genética ruim', g_neutralGenetic: 'Genética neutra', g_skill: 'Habilidade', g_militaryHonor: 'Honras militares', g_neutral: 'Neutros / cargos',
      household: 'Casa', householdHealth: 'Saúde da casa', revenue: 'Renda', householdFertility: 'Fertilidade da casa',
      householdExpenses: 'Despesas da casa', householdStewardship: 'Administração da casa',
      personal: 'Pessoal', personalHealth: 'Saúde pessoal', personalFertility: 'Fertilidade pessoal',
      personalExpenses: 'Despesas pessoais', personalStewardship: 'Administração pessoal',
      petGroup: 'Mascote', petHealth: 'Saúde do mascote', petFertility: 'Fertilidade do mascote', petExpenses: 'Despesas do mascote',
      jobs: 'Trabalhos', jobPrefix: 'Trabalho', properties: 'Propriedades', propPrefix: 'Propriedade',
      trainerFactor: 'Fator trainer', removeFactor: 'Remover', removeFactorTip: 'Remove o fator do trainer', total: 'Total no jogo',
      modNote: 'Multiplica-se com os do jogo. Em "Despesas" convém um fator menor que 1 (ex.: 0.5 = metade das despesas).',
      activeNow: 'Ativos agora', none: 'Nenhum', clickToEdit: 'Clique para editar acima', removeAll: 'Remover todos do trainer',
      legend: '★ = inclui um fator do trainer. Verde = te favorece.',
      health: 'Saúde', fertility: 'Fertilidade', expenses: 'Despesas', stewardshipShort: 'Administração', xOfY: '{x} de {y}',
    },
    en: {
      langName: 'English (US)', resizeHint: 'Drag to resize', estate: 'Household properties', toLimit: 'To limit', allToLimit: 'All to limit', propNote: 'The limit depends on your class and stewardship. Above 1.2× the limit the game may make you lose properties (theft, disease).', moveUp: 'Move earlier', moveDown: 'Move later', dragHint: 'Drag to move the panel · edges and corners to resize', resetLayout: 'Reset position, size and order', dragSection: 'Drag to reorder · click the name to collapse', petLife: 'adult at {adult}, lives ~{life} yrs', age: 'Age', bornIn: 'born in year {year}', hideHint: 'F8 hides',
      resources: 'Resources', family: 'Family', pets: 'Pets', multipliers: 'Multipliers',
      cash: 'Money', influence: 'Influence', prestige: 'Prestige',
      intelligence: 'Intelligence', stewardship: 'Stewardship', eloquence: 'Eloquence', combat: 'Combat',
      allTo: 'All to', familyAllTo: 'Whole family to', petsAllTo: 'All pets to',
      jobLevel: 'Job level', max: 'Max', maxTip: "Raise to this job's max level", noJob: 'no job', maxShort: 'max',
      traits: 'Traits', petTraits: 'Pet traits', add: 'Add',
      addTip: "Uses the game's own function: applies the trait's bonuses and removes opposites",
      traitNote: 'Adding/removing a trait also adds/subtracts its skill bonuses. Opposite traits are removed automatically.',
      notAvailable: 'Not available in this game version.', noTraits: 'No traits', removeTrait: 'Remove trait',
      you: '(you)', noFamily: 'No family', noPets: 'No pets', petOwner: "{owner}'s",
      aptitude: 'Aptitude', vigor: 'Vigor', tameness: 'Tameness',
      g_education: 'Education', g_personality: 'Personality', g_good: 'Good', g_bad: 'Bad', g_goodGenetic: 'Good genetic',
      g_badGenetic: 'Bad genetic', g_neutralGenetic: 'Neutral genetic', g_skill: 'Skill', g_militaryHonor: 'Military honors', g_neutral: 'Neutral / offices',
      household: 'Household', householdHealth: 'Household health', revenue: 'Revenue', householdFertility: 'Household fertility',
      householdExpenses: 'Household expenses', householdStewardship: 'Household stewardship',
      personal: 'Personal', personalHealth: 'Personal health', personalFertility: 'Personal fertility',
      personalExpenses: 'Personal expenses', personalStewardship: 'Personal stewardship',
      petGroup: 'Pet', petHealth: 'Pet health', petFertility: 'Pet fertility', petExpenses: 'Pet expenses',
      jobs: 'Jobs', jobPrefix: 'Job', properties: 'Properties', propPrefix: 'Property',
      trainerFactor: 'Trainer factor', removeFactor: 'Remove', removeFactorTip: 'Removes the trainer factor', total: 'In-game total',
      modNote: 'Multiplies with the game\'s own. For "Expenses" use a factor below 1 (e.g. 0.5 = half the expenses).',
      activeNow: 'Active now', none: 'None', clickToEdit: 'Click to edit above', removeAll: 'Remove all trainer factors',
      legend: '★ = includes a trainer factor. Green = in your favor.',
      health: 'Health', fertility: 'Fertility', expenses: 'Expenses', stewardshipShort: 'Stewardship', xOfY: '{x} of {y}',
    },
    ru: {
      langName: 'Русский', resizeHint: 'Перетащите, чтобы изменить размер', estate: 'Имущество семьи', toLimit: 'До лимита', allToLimit: 'Всё до лимита', propNote: 'Лимит зависит от вашего класса и управления. Если превысить его в 1,2 раза, игра может отнять часть имущества (кражи, болезни).', moveUp: 'Переместить раньше', moveDown: 'Переместить позже', dragHint: 'Перетащите, чтобы переместить панель · края и углы — изменить размер', resetLayout: 'Сбросить положение, размер и порядок', dragSection: 'Перетащите для смены порядка · нажмите на название, чтобы свернуть', petLife: 'взрослый в {adult}, живёт ~{life} лет', age: 'Возраст', bornIn: 'год рождения: {year}', hideHint: 'F8 — скрыть',
      resources: 'Ресурсы', family: 'Семья', pets: 'Питомцы', multipliers: 'Множители',
      cash: 'Деньги', influence: 'Влияние', prestige: 'Престиж',
      intelligence: 'Интеллект', stewardship: 'Управление', eloquence: 'Красноречие', combat: 'Бой',
      allTo: 'Всё на', familyAllTo: 'Вся семья на', petsAllTo: 'Все на',
      jobLevel: 'Уровень работы', max: 'Макс', maxTip: 'Поднять до максимального уровня этой работы', noJob: 'без работы', maxShort: 'макс',
      traits: 'Черты', petTraits: 'Черты питомца', add: 'Добавить',
      addTip: 'Использует функцию игры: применяет бонусы черты и убирает противоположные',
      traitNote: 'Добавление/удаление черты также прибавляет/вычитает её бонусы к навыкам. Противоположные черты убираются автоматически.',
      notAvailable: 'Недоступно в этой версии игры.', noTraits: 'Нет черт', removeTrait: 'Убрать черту',
      you: '(вы)', noFamily: 'Нет семьи', noPets: 'Нет питомцев', petOwner: 'хозяин: {owner}',
      aptitude: 'Способности', vigor: 'Сила', tameness: 'Покладистость',
      g_education: 'Образование', g_personality: 'Характер', g_good: 'Хорошие', g_bad: 'Плохие', g_goodGenetic: 'Хорошая генетика',
      g_badGenetic: 'Плохая генетика', g_neutralGenetic: 'Нейтральная генетика', g_skill: 'Навыки', g_militaryHonor: 'Воинские награды', g_neutral: 'Нейтральные / должности',
      household: 'Дом', householdHealth: 'Здоровье семьи', revenue: 'Доход', householdFertility: 'Плодовитость семьи',
      householdExpenses: 'Расходы семьи', householdStewardship: 'Управление домом',
      personal: 'Личное', personalHealth: 'Личное здоровье', personalFertility: 'Личная плодовитость',
      personalExpenses: 'Личные расходы', personalStewardship: 'Личное управление',
      petGroup: 'Питомец', petHealth: 'Здоровье питомца', petFertility: 'Плодовитость питомца', petExpenses: 'Расходы на питомца',
      jobs: 'Работы', jobPrefix: 'Работа', properties: 'Имущество', propPrefix: 'Имущество',
      trainerFactor: 'Множитель трейнера', removeFactor: 'Убрать', removeFactorTip: 'Убирает множитель трейнера', total: 'Итого в игре',
      modNote: 'Перемножается с игровыми. Для «Расходов» лучше множитель меньше 1 (напр. 0.5 = вдвое меньше расходов).',
      activeNow: 'Активные сейчас', none: 'Нет', clickToEdit: 'Нажмите, чтобы изменить выше', removeAll: 'Убрать все множители трейнера',
      legend: '★ = есть множитель трейнера. Зелёный = в вашу пользу.',
      health: 'Здоровье', fertility: 'Плодовитость', expenses: 'Расходы', stewardshipShort: 'Управление', xOfY: '{x}: {y}',
    },
    fr: {
      langName: 'Français', resizeHint: 'Glisser pour redimensionner', estate: 'Propriétés du foyer', toLimit: 'Au max', allToLimit: 'Tout au max', propNote: 'La limite dépend de votre classe et de votre intendance. Au-delà de 1,2× la limite, le jeu peut vous faire perdre des propriétés (vols, maladies).', moveUp: 'Déplacer avant', moveDown: 'Déplacer après', dragHint: 'Glisser pour déplacer le panneau · bords et coins pour redimensionner', resetLayout: 'Réinitialiser position, taille et ordre', dragSection: 'Glisser pour réordonner · cliquer sur le nom pour replier', petLife: 'adulte à {adult} ans, vit ~{life} ans', age: 'Âge', bornIn: "né en l'an {year}", hideHint: 'F8 masque',
      resources: 'Ressources', family: 'Famille', pets: 'Animaux', multipliers: 'Multiplicateurs',
      cash: 'Argent', influence: 'Influence', prestige: 'Prestige',
      intelligence: 'Intelligence', stewardship: 'Intendance', eloquence: 'Éloquence', combat: 'Combat',
      allTo: 'Tout à', familyAllTo: 'Toute la famille à', petsAllTo: 'Tous à',
      jobLevel: 'Niveau métier', max: 'Max', maxTip: 'Monter au niveau maximum de ce métier', noJob: 'sans métier', maxShort: 'max',
      traits: 'Traits', petTraits: "Traits de l'animal", add: 'Ajouter',
      addTip: 'Utilise la fonction du jeu : applique les bonus du trait et retire les opposés',
      traitNote: 'Ajouter/retirer un trait ajoute/retire aussi ses bonus de compétence. Les traits opposés sont retirés automatiquement.',
      notAvailable: 'Indisponible dans cette version du jeu.', noTraits: 'Aucun trait', removeTrait: 'Retirer le trait',
      you: '(vous)', noFamily: 'Pas de famille', noPets: "Pas d'animaux", petOwner: 'à {owner}',
      aptitude: 'Aptitude', vigor: 'Vigueur', tameness: 'Docilité',
      g_education: 'Éducation', g_personality: 'Personnalité', g_good: 'Bons', g_bad: 'Mauvais', g_goodGenetic: 'Génétique favorable',
      g_badGenetic: 'Génétique défavorable', g_neutralGenetic: 'Génétique neutre', g_skill: 'Compétence', g_militaryHonor: 'Honneurs militaires', g_neutral: 'Neutres / charges',
      household: 'Foyer', householdHealth: 'Santé du foyer', revenue: 'Revenus', householdFertility: 'Fertilité du foyer',
      householdExpenses: 'Dépenses du foyer', householdStewardship: 'Intendance du foyer',
      personal: 'Personnel', personalHealth: 'Santé personnelle', personalFertility: 'Fertilité personnelle',
      personalExpenses: 'Dépenses personnelles', personalStewardship: 'Intendance personnelle',
      petGroup: 'Animal', petHealth: "Santé de l'animal", petFertility: "Fertilité de l'animal", petExpenses: "Dépenses de l'animal",
      jobs: 'Métiers', jobPrefix: 'Métier', properties: 'Propriétés', propPrefix: 'Propriété',
      trainerFactor: 'Facteur trainer', removeFactor: 'Retirer', removeFactorTip: 'Retire le facteur du trainer', total: 'Total en jeu',
      modNote: 'Se multiplie avec ceux du jeu. Pour « Dépenses », mieux vaut un facteur inférieur à 1 (ex. 0.5 = moitié des dépenses).',
      activeNow: 'Actifs maintenant', none: 'Aucun', clickToEdit: 'Cliquez pour le modifier ci-dessus', removeAll: 'Retirer tous ceux du trainer',
      legend: '★ = inclut un facteur du trainer. Vert = en votre faveur.',
      health: 'Santé', fertility: 'Fertilité', expenses: 'Dépenses', stewardshipShort: 'Intendance', xOfY: '{x} de {y}',
    },
    de: {
      langName: 'Deutsch', resizeHint: 'Ziehen zum Ändern der Größe', estate: 'Besitz des Haushalts', toLimit: 'Bis Limit', allToLimit: 'Alles bis Limit', propNote: 'Das Limit hängt von Klasse und Verwaltung ab. Über dem 1,2-Fachen des Limits kann das Spiel dir Besitz wegnehmen (Diebstahl, Krankheit).', moveUp: 'Nach vorne', moveDown: 'Nach hinten', dragHint: 'Ziehen zum Verschieben · Ränder und Ecken zum Ändern der Größe', resetLayout: 'Position, Größe und Reihenfolge zurücksetzen', dragSection: 'Ziehen zum Umordnen · auf den Namen klicken zum Einklappen', petLife: 'erwachsen mit {adult}, lebt ~{life} Jahre', age: 'Alter', bornIn: 'geboren im Jahr {year}', hideHint: 'F8 blendet aus',
      resources: 'Ressourcen', family: 'Familie', pets: 'Haustiere', multipliers: 'Multiplikatoren',
      cash: 'Geld', influence: 'Einfluss', prestige: 'Prestige',
      intelligence: 'Intelligenz', stewardship: 'Verwaltung', eloquence: 'Redekunst', combat: 'Kampf',
      allTo: 'Alles auf', familyAllTo: 'Ganze Familie auf', petsAllTo: 'Alle auf',
      jobLevel: 'Berufsstufe', max: 'Max', maxTip: 'Auf die Höchststufe dieses Berufs setzen', noJob: 'ohne Beruf', maxShort: 'max',
      traits: 'Eigenschaften', petTraits: 'Eigenschaften des Haustiers', add: 'Hinzufügen',
      addTip: 'Nutzt die Spielfunktion: wendet die Boni der Eigenschaft an und entfernt Gegensätze',
      traitNote: 'Hinzufügen/Entfernen einer Eigenschaft addiert/subtrahiert auch ihre Fertigkeitsboni. Gegensätzliche Eigenschaften werden automatisch entfernt.',
      notAvailable: 'In dieser Spielversion nicht verfügbar.', noTraits: 'Keine Eigenschaften', removeTrait: 'Eigenschaft entfernen',
      you: '(du)', noFamily: 'Keine Familie', noPets: 'Keine Haustiere', petOwner: 'von {owner}',
      aptitude: 'Begabung', vigor: 'Vitalität', tameness: 'Zahmheit',
      g_education: 'Bildung', g_personality: 'Persönlichkeit', g_good: 'Gut', g_bad: 'Schlecht', g_goodGenetic: 'Gute Genetik',
      g_badGenetic: 'Schlechte Genetik', g_neutralGenetic: 'Neutrale Genetik', g_skill: 'Fertigkeit', g_militaryHonor: 'Militärische Ehren', g_neutral: 'Neutral / Ämter',
      household: 'Haushalt', householdHealth: 'Gesundheit des Haushalts', revenue: 'Einnahmen', householdFertility: 'Fruchtbarkeit des Haushalts',
      householdExpenses: 'Ausgaben des Haushalts', householdStewardship: 'Verwaltung des Haushalts',
      personal: 'Persönlich', personalHealth: 'Persönliche Gesundheit', personalFertility: 'Persönliche Fruchtbarkeit',
      personalExpenses: 'Persönliche Ausgaben', personalStewardship: 'Persönliche Verwaltung',
      petGroup: 'Haustier', petHealth: 'Gesundheit des Haustiers', petFertility: 'Fruchtbarkeit des Haustiers', petExpenses: 'Ausgaben für das Haustier',
      jobs: 'Berufe', jobPrefix: 'Beruf', properties: 'Besitztümer', propPrefix: 'Besitz',
      trainerFactor: 'Trainer-Faktor', removeFactor: 'Entfernen', removeFactorTip: 'Entfernt den Trainer-Faktor', total: 'Gesamt im Spiel',
      modNote: 'Wird mit denen des Spiels multipliziert. Bei „Ausgaben“ lieber einen Faktor unter 1 (z. B. 0.5 = halbe Ausgaben).',
      activeNow: 'Jetzt aktiv', none: 'Keine', clickToEdit: 'Klicken, um oben zu bearbeiten', removeAll: 'Alle Trainer-Faktoren entfernen',
      legend: '★ = enthält einen Trainer-Faktor. Grün = zu deinen Gunsten.',
      health: 'Gesundheit', fertility: 'Fruchtbarkeit', expenses: 'Ausgaben', stewardshipShort: 'Verwaltung', xOfY: '{x} von {y}',
    },
  }

  // Banderas en SVG (Windows no dibuja los emojis de banderas).
  const stripesH = colors => colors.map((c, i) => '<rect y="' + (20 / colors.length) * i + '" width="30" height="' + (20 / colors.length + 0.05) + '" fill="' + c + '"/>').join('')
  const stripesV = colors => colors.map((c, i) => '<rect x="' + 10 * i + '" width="10.05" height="20" fill="' + c + '"/>').join('')
  const usa = () => {
    let s = '<rect width="30" height="20" fill="#b22234"/>'
    for (let i = 1; i < 13; i += 2) s += '<rect y="' + (20 / 13) * i + '" width="30" height="' + 20 / 13 + '" fill="#fff"/>'
    s += '<rect width="12" height="' + (20 / 13) * 7 + '" fill="#3c3b6e"/>'
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) s += '<circle cx="' + (1.4 + c * 2.3) + '" cy="' + (1.4 + r * 2.5) + '" r=".45" fill="#fff"/>'
    return s
  }
  const FLAGS = [
    ['es', stripesH(['#74acdf', '#fff', '#74acdf']) + '<circle cx="15" cy="10" r="2.3" fill="#f6b40e"/>'],
    ['pt', '<rect width="30" height="20" fill="#009c3b"/><polygon points="15,2.2 27.5,10 15,17.8 2.5,10" fill="#ffdf00"/><circle cx="15" cy="10" r="4.3" fill="#002776"/>'],
    ['en', usa()],
    ['ru', stripesH(['#fff', '#0039a6', '#d52b1e'])],
    ['fr', stripesV(['#0055a4', '#fff', '#ef4135'])],
    ['de', stripesH(['#000', '#dd0000', '#ffce00'])],
  ]

  let lang = ls.get('corTrainerLang', 'es')
  if (!I18N[lang]) lang = 'es'
  const t = (key, vars) => {
    let s = I18N[lang][key] ?? I18N.es[key] ?? key
    for (const k in vars || {}) s = s.replace('{' + k + '}', vars[k])
    return s
  }

  // Módulos internos del juego (webpack). Se usan las mismas funciones que usa
  // el juego (rasgos, nivel de trabajo, multiplicadores), así se aplican sus
  // efectos secundarios. No activa el modo mods (los logros siguen activos).
  function gameRequire() {
    if (window.__corReq) return window.__corReq
    const key = Object.keys(window).find(k => /^webpackJsonp/.test(k))
    if (!key) return null
    const mid = '__cor' + Date.now()
    window[key].push([[mid], { [mid]: (m, e, r) => { window.__corReq = r } }, [[mid]]])
    return window.__corReq || null
  }
  const load = (what, fn) => { try { return fn(gameRequire()) } catch (e) { console.warn('[trainer] ' + what + ' no disponible', e); return null } }

  const TR = load('rasgos', req => {
    const defs = req('50ab').default()
    return { list: defs.list, titles: req('7073').default(), discoverable: defs.discoverable || [],
      add: (ch, id) => req('a822').a(S(), ch.id, id), remove: (ch, id) => req('cc6f').a(S(), ch.id, id, true) }
  })
  const AGE = load('edad', req => req('9b55').default)
  const JOBS = load('trabajos', req => ({ types: req('0262').default.types, titles: req('c9c8').default.titles || {}, set: req('6cf7').a }))
  const PETS = load('mascotas', req => {
    const P = req('ed26').a
    return { types: P.types || {}, traitList: P.traits.list, traitTitles: req('c7db').default.traits || {},
      add: (p, id) => req('d6d3').a({ state: S(), petId: p.id, trait: id }),
      remove: (p, id) => req('d217').a({ state: S(), petId: p.id, trait: id, forceClearStack: true }) }
  })
  const PROPS = load('propiedades', req => {
    const P = req('08e5').default, L = req('5785').default
    return { types: P.types, groups: P.groups, titles: L.types || {}, groupTitles: L.groups || {}, max: k => req('40cf').default(S(), k) }
  })
  const MODS = load('multiplicadores', req => ({
    add: (key, id, factor, description) => req('dbe5').default(S(), { key, id, factor, description }),
    remove: (key, id) => req('f761').a(S(), key, id),
    value: key => req('fc68').a(S(), { key }),
    propTypes: req('08e5').default.types, propTitles: req('5785').default.types || {},
  }))

  const GROUP_ORDER = ['education', 'personality', 'good', 'bad', 'goodGenetic', 'badGenetic', 'neutralGenetic', 'skill', 'militaryHonor', 'neutral']
  const groupName = g => GROUP_ORDER.includes(g) ? t('g_' + g) : g
  const SKILL_MAX = 30 // a partir de ~27 las fórmulas del juego ya dan el máximo (99%)
  const TRAINER_MOD_ID = 'cor_trainer'

  // --- Selección (se conserva al cambiar de idioma) ---------------------------
  let selectedId = null, selectedPetId = null, modKey = 'household_health'
  const selected = () => S()?.characters?.[selectedId]
  const household = () => {
    const s = S()
    if (!s) return []
    const ids = [s.current.id, ...(s.current.householdCharacterIds || [])]
    return [...new Set(ids)].map(id => s.characters[id]).filter(c => c && !c.isDead)
  }
  const pets = () => S()?.current?.pets || {}
  const selectedPet = () => pets()[selectedPetId]
  const householdPets = () => {
    const s = S()
    if (!s) return []
    const ids = [...(s.current.petIds || []), ...(s.current.householdPetIds || [])]
    household().forEach(ch => ids.push(...(ch.petIds || [])))
    return [...new Set(ids)].map(id => pets()[id]).filter(p => p && !p.isDead)
  }

  const fmt = v => typeof v === 'number' ? String(Math.round(v * 100) / 100) : ''
  const CTRL_CSS = 'background:#3a2e20;color:#f3e6c8;border:1px solid #b08d57;border-radius:4px'
  const el = (tag, css, parent) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (parent) parent.appendChild(e); return e }

  const DEFAULT_W = 360
  const SECTION_IDS = ['resources', 'family', 'pets', 'estate', 'multipliers']

  // Construye el panel entero en el idioma actual. Cambiar de idioma lo reconstruye.
  let refresh = () => {}
  function build() {
    document.getElementById('cor-trainer')?.remove()
    window.__corTrainerRO?.disconnect()
    // Posición y tamaño: el panel se puede arrastrar (desde el título) y
    // redimensionar desde cualquier borde o esquina. Ambos se recuerdan.
    // "frame" es la ventana (borde, sombra, asas de redimensionado);
    // "box" es el contenido con scroll.
    const layout = ls.get('corTrainerLayout', {})
    const frame = el('div', 'position:fixed;z-index:2147483647;background:rgba(20,16,12,.94);box-sizing:border-box;' +
      'color:#f3e6c8;font:13px/1.4 system-ui,sans-serif;border:1px solid #b08d57;display:flex;flex-direction:column;' +
      'border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.5);user-select:none')
    frame.id = 'cor-trainer'
    frame.lang = lang
    const box = el('div', 'padding:10px 12px;overflow:auto;flex:1 1 auto;min-height:0', frame)
    const MIN_W = 280, MIN_H = 120
    frame.style.width = Math.min(layout.w || DEFAULT_W, innerWidth - 8) + 'px'
    if (layout.h) frame.style.height = Math.min(layout.h, innerHeight - 8) + 'px'
    else frame.style.maxHeight = '90vh'
    const place = (x, y) => {
      frame.style.left = Math.round(Math.max(0, Math.min(x, innerWidth - 80))) + 'px'
      frame.style.top = Math.round(Math.max(0, Math.min(y, innerHeight - 40))) + 'px'
    }
    place(layout.x ?? innerWidth - parseInt(frame.style.width) - 12, layout.y ?? 12)
    let saveTimer
    const saveLayout = () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => frame.offsetWidth > 0 && ls.set('corTrainerLayout', { // oculto (F8) = no guardar
        x: frame.offsetLeft, y: frame.offsetTop, w: frame.offsetWidth, h: frame.style.height ? frame.offsetHeight : undefined,
      }), 250)
    }
    window.__corTrainerRO = new ResizeObserver(saveLayout)
    window.__corTrainerRO.observe(frame)
    // Que las teclas escritas en el panel no disparen atajos del juego (salvo F8).
    frame.addEventListener('keydown', e => { if (e.key !== 'F8') e.stopPropagation() })

    // Asas de redimensionado: 4 bordes + 4 esquinas. Sobresalen 4px hacia fuera
    // para que sean fáciles de agarrar sin tapar el contenido.
    const HANDLES = {
      n: 'top:-4px;left:10px;right:10px;height:8px;cursor:ns-resize',
      s: 'bottom:-4px;left:10px;right:10px;height:8px;cursor:ns-resize',
      e: 'right:-4px;top:10px;bottom:10px;width:8px;cursor:ew-resize',
      w: 'left:-4px;top:10px;bottom:10px;width:8px;cursor:ew-resize',
      ne: 'top:-5px;right:-5px;width:14px;height:14px;cursor:nesw-resize',
      nw: 'top:-5px;left:-5px;width:14px;height:14px;cursor:nwse-resize',
      se: 'bottom:-5px;right:-5px;width:14px;height:14px;cursor:nwse-resize',
      sw: 'bottom:-5px;left:-5px;width:14px;height:14px;cursor:nesw-resize',
    }
    for (const [dir, css] of Object.entries(HANDLES)) {
      const h = el('div', 'position:absolute;z-index:2;' + css, frame)
      h.title = t('resizeHint')
      h.addEventListener('mousedown', e => {
        if (e.button !== 0) return
        e.preventDefault()
        const sx = e.clientX, sy = e.clientY
        const r = { x: frame.offsetLeft, y: frame.offsetTop, w: frame.offsetWidth, h: frame.offsetHeight }
        const move = ev => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy
          let { x, y, w, h: hh } = r
          if (dir.includes('e')) w = Math.min(Math.max(MIN_W, r.w + dx), innerWidth - r.x)
          if (dir.includes('s')) hh = Math.min(Math.max(MIN_H, r.h + dy), innerHeight - r.y)
          if (dir.includes('w')) { w = Math.min(Math.max(MIN_W, r.w - dx), r.x + r.w); x = r.x + r.w - w }
          if (dir.includes('n')) { hh = Math.min(Math.max(MIN_H, r.h - dy), r.y + r.h); y = r.y + r.h - hh }
          frame.style.left = x + 'px'
          frame.style.top = y + 'px'
          frame.style.width = w + 'px'
          if (dir.includes('n') || dir.includes('s')) { frame.style.height = hh + 'px'; frame.style.maxHeight = 'none' }
        }
        const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); document.body.style.cursor = ''; saveLayout() }
        document.body.style.cursor = getComputedStyle(h).cursor
        addEventListener('mousemove', move)
        addEventListener('mouseup', up)
      })
    }

    // Cabecera: título (arrastrable) + botón de reinicio + banderas de idioma.
    const header = el('div', 'margin-bottom:6px', box)
    const titleLine = el('div', 'display:flex;align-items:baseline;gap:8px;cursor:move', header)
    titleLine.title = t('dragHint')
    const title = el('span', 'font-weight:600;color:#e0c07a;flex:1', titleLine)
    title.textContent = '⠿ Trainer'
    const hint = el('span', 'font-size:11px;opacity:.7', titleLine)
    hint.textContent = t('hideHint')
    const reset = el('button', 'background:none;border:none;color:#e0c07a;cursor:pointer;padding:0 2px;font-size:14px', titleLine)
    reset.textContent = '↺'
    reset.title = t('resetLayout')
    reset.onclick = () => { ls.set('corTrainerLayout', {}); ls.set('corTrainerOrder', null); build() }
    titleLine.addEventListener('mousedown', e => {
      if (e.button !== 0 || e.target.closest('button')) return
      const dx = e.clientX - frame.offsetLeft, dy = e.clientY - frame.offsetTop
      const move = ev => place(ev.clientX - dx, ev.clientY - dy)
      const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); saveLayout() }
      addEventListener('mousemove', move)
      addEventListener('mouseup', up)
      e.preventDefault()
    })
    const flags = el('div', 'display:flex;gap:6px;margin-top:6px', header)
    for (const [code, svg] of FLAGS) {
      const active = code === lang
      const b = el('button', 'padding:0;line-height:0;cursor:pointer;background:none;border-radius:3px;' +
        'border:2px solid ' + (active ? '#e0c07a' : 'transparent') + ';opacity:' + (active ? '1' : '.55') + ';transition:opacity .15s', flags)
      b.title = I18N[code].langName
      b.setAttribute('aria-label', I18N[code].langName)
      b.setAttribute('aria-pressed', String(active))
      b.innerHTML = '<svg width="30" height="20" viewBox="0 0 30 20" style="display:block;border-radius:1px">' + svg + '</svg>'
      b.onmouseenter = () => { b.style.opacity = '1' }
      b.onmouseleave = () => { b.style.opacity = active ? '1' : '.55' }
      b.onclick = () => { if (code !== lang) { lang = code; ls.set('corTrainerLang', lang); build() } }
    }

    const button = (parent, text, fn, tip) => {
      const b = el('button', CTRL_CSS + ';padding:1px 6px;cursor:pointer', parent)
      b.textContent = text
      if (tip) b.title = tip
      b.onclick = () => { try { fn(); refresh(true) } catch (e) { console.warn('[trainer]', e) } }
      return b
    }
    const select = (parent, onchange) => {
      const s = el('select', CTRL_CSS + ';width:100%;padding:2px;margin:2px 0', parent)
      s.onchange = () => { onchange(s.value); refresh(true) }
      return s
    }
    const note = (parent, text) => { const n = el('div', 'font-size:11px;opacity:.7;margin-top:3px', parent); n.textContent = text; return n }
    const subheading = (parent, text) => { const h = el('div', 'margin-top:6px;color:#d9bf8c;font-weight:600', parent); h.textContent = text }

    // Secciones: tarjetas en una rejilla. Si el panel es ancho se reparten en
    // varias columnas. Se pueden plegar (clic en el título) y reordenar
    // (arrastrando la cabecera o con ▲▼). Plegado y orden se recuerdan.
    const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));column-gap:18px;align-items:start', box)
    const collapsed = ls.get('corTrainerCollapsedV2', {})
    const cards = {}
    let order = (ls.get('corTrainerOrder', null) || []).filter(id => SECTION_IDS.includes(id))
    order = order.concat(SECTION_IDS.filter(id => !order.includes(id)))
    const applyOrder = () => order.forEach(id => cards[id] && grid.appendChild(cards[id]))
    const moveSection = (id, to) => {
      const from = order.indexOf(id)
      if (from < 0 || to < 0 || to >= order.length || to === from) return
      order.splice(from, 1)
      order.splice(to, 0, id)
      ls.set('corTrainerOrder', order)
      applyOrder()
    }
    let dragging = null
    function section(id) {
      const card = el('div', 'border-radius:6px;transition:background .1s', grid)
      cards[id] = card
      const head = el('div', 'display:flex;align-items:center;gap:4px;margin:8px 0 2px;padding-top:6px;border-top:1px solid #5a4630;color:#e0c07a;font-weight:600', card)
      head.draggable = true
      head.title = t('dragSection')
      const grip = el('span', 'cursor:grab;opacity:.55;font-weight:400', head)
      grip.textContent = '⠿'
      const name = el('span', 'flex:1;cursor:pointer', head)
      const arrow = (text, tip, delta) => {
        const b = el('button', 'background:none;border:none;color:#e0c07a;cursor:pointer;padding:0 3px;font-size:10px;opacity:.7', head)
        b.textContent = text
        b.title = tip
        b.onclick = e => { e.stopPropagation(); moveSection(id, order.indexOf(id) + delta) }
      }
      arrow('▲', t('moveUp'), -1)
      arrow('▼', t('moveDown'), 1)
      const body = el('div', '', card)
      const paint = () => { name.textContent = (collapsed[id] ? '▸ ' : '▾ ') + t(id); body.style.display = collapsed[id] ? 'none' : '' }
      name.onclick = () => { collapsed[id] = !collapsed[id]; ls.set('corTrainerCollapsedV2', collapsed); paint() }
      paint()
      head.addEventListener('dragstart', e => { dragging = id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); card.style.opacity = '.5' })
      head.addEventListener('dragend', () => { dragging = null; card.style.opacity = ''; Object.values(cards).forEach(c => { c.style.background = '' }) })
      card.addEventListener('dragover', e => { if (dragging && dragging !== id) { e.preventDefault(); card.style.background = 'rgba(224,192,122,.12)' } })
      card.addEventListener('dragleave', () => { card.style.background = '' })
      card.addEventListener('drop', e => { e.preventDefault(); card.style.background = ''; if (dragging) moveSection(dragging, order.indexOf(id)) })
      return body
    }

    // Fila: etiqueta, campo editable (Enter o salir del campo = aplicar) y botones +N.
    // Opcionales: c.enabled() desactiva la fila, c.extra añade botones, c.suffix() una nota debajo,
    // c.inline() un texto corto junto al campo (con c.inlineColor()), c.wide = etiqueta flexible
    // y campo estrecho (para nombres largos), c.tip = ayuda al pasar el ratón por la etiqueta.
    const rows = []
    function addRow(c, parent) {
      const row = el('div', 'display:flex;align-items:center;gap:4px;margin:4px 0', parent)
      const label = el('span', c.wide ? 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' : 'width:92px;flex-shrink:0', row)
      label.textContent = c.label
      label.title = c.tip || (c.wide ? c.label : '')
      const input = el('input', CTRL_CSS + ';' + (c.wide ? 'width:72px;flex:none' : 'flex:1;min-width:0') + ';padding:1px 4px;text-align:right;font-variant-numeric:tabular-nums', row)
      const inline = c.inline ? el('span', 'font-size:11px;min-width:44px;font-variant-numeric:tabular-nums', row) : null
      input.type = 'number'
      input.step = 'any'
      input.addEventListener('change', () => {
        const v = parseFloat(input.value)
        if (!Number.isNaN(v)) { try { c.set(v) } catch (e) { console.warn('[trainer]', e) } }
        refresh(true)
      })
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur()
        else if (e.key === 'Escape') { input.value = fmt(c.get()); input.blur() }
      })
      const short = n => n >= 1000 ? (n / 1000) + 'k' : String(n)
      const btns = (c.steps || []).map(n => button(row, '+' + short(n), () => c.set((c.get() || 0) + n)))
      for (const [text, fn, tip] of c.extra || []) btns.push(button(row, text, fn, tip))
      let sub = null
      if (c.suffix) sub = el('div', 'font-size:11px;opacity:.7;text-align:right;margin:-3px 0 4px', parent)
      rows.push({ c, input, btns, sub, inline })
    }

    // Editor de rasgos reutilizable (personajes y mascotas).
    const refreshers = []
    function traitEditor(parent, { entity, list, title, describe, add, remove, available }) {
      const chips = el('div', 'display:flex;flex-wrap:wrap;gap:4px;margin:4px 0', parent)
      const line = el('div', 'display:flex;gap:4px;margin-top:4px', parent)
      const pick = el('select', CTRL_CSS + ';flex:1;min-width:0;padding:2px', line)
      button(line, t('add'), () => { const e = entity(); if (e && pick.value) add(e, pick.value) }, t('addTip'))
      note(parent, t('traitNote'))
      if (!available) { chips.textContent = t('notAvailable'); line.style.display = 'none'; return }
      let sig = ''
      refreshers.push(force => {
        const e = entity(), owned = e?.traits || []
        const now = (e?.id || '') + ':' + owned.join(',')
        if (now === sig && !force) return
        sig = now
        chips.innerHTML = ''
        if (!e) { chips.innerHTML = '<span style="opacity:.6">—</span>'; pick.innerHTML = ''; return }
        if (!owned.length) { const n = el('span', 'opacity:.6', chips); n.textContent = t('noTraits') }
        for (const id of owned) {
          const chip = el('span', 'display:inline-flex;align-items:center;gap:3px;background:#2a2118;border:1px solid #5a4630;border-radius:10px;padding:0 4px 0 8px', chips)
          chip.title = describe(id)
          chip.append(title(id))
          const x = button(chip, '×', () => remove(e, id), t('removeTrait'))
          x.style.cssText += ';border:none;background:none;padding:0 2px;font-weight:700'
        }
        const prev = pick.value
        pick.innerHTML = ''
        const byGroup = {}
        for (const [id, def] of Object.entries(list())) {
          if (!owned.includes(id)) (byGroup[def.group] = byGroup[def.group] || []).push(id)
        }
        for (const g of GROUP_ORDER.concat(Object.keys(byGroup).filter(g => !GROUP_ORDER.includes(g)))) {
          if (!byGroup[g]) continue
          const og = el('optgroup', '', pick)
          og.label = groupName(g)
          byGroup[g].sort((a, b) => title(a).localeCompare(title(b))).forEach(id => {
            const o = el('option', '', og)
            o.value = id
            o.textContent = title(id)
            o.title = describe(id)
          })
        }
        if (prev && !owned.includes(prev)) pick.value = prev
      })
    }

    // Desplegable que se reconstruye solo cuando cambia la lista.
    function rosterSelect(sel, list, getId, setId, label, emptyText) {
      let sig = ''
      refreshers.push(() => {
        const items = list()
        const now = items.map(x => x.id + label(x)).join('|')
        if (now === sig) return
        sig = now
        if (!items.some(x => x.id === getId())) setId(items[0]?.id ?? null)
        sel.innerHTML = ''
        if (!items.length) { const o = el('option', '', sel); o.value = ''; o.textContent = emptyText }
        for (const x of items) { const o = el('option', '', sel); o.value = x.id; o.textContent = label(x) }
        sel.value = getId() ?? ''
      })
    }

    // --- Sección: Recursos ---------------------------------------------------
    const secRes = section('resources')
    ;[
      { label: t('cash'),       get: () => S()?.current.cash,      set: v => { S().current.cash = v },      steps: [1000, 10000] },
      { label: t('influence'),  get: () => S()?.current.influence, set: v => { S().current.influence = v }, steps: [1000, 10000] },
      { label: t('prestige'),   get: () => dynasty()?.prestige,    set: v => { dynasty().prestige = v },    steps: [1000, 10000] },
    ].forEach(c => addRow(c, secRes))

    // --- Sección: Familia ----------------------------------------------------
    const secFam = section('family')
    const pick = select(secFam, v => { selectedId = v })
    rosterSelect(pick, household, () => selectedId, v => { selectedId = v },
      ch => ch.praenomen + (ch.id === S().current.id ? ' ' + t('you') : ''), t('noFamily'))
    // Edad: el juego la calcula a partir de birthMonth/birthYear, así que cambiarla
    // es mover el año de nacimiento (se conserva el mes). Sirve para personajes y mascotas.
    const ageOf = x => AGE ? AGE(S(), x.birthMonth, x.birthYear) : S().year - x.birthYear
    const ageRow = (entity, parent, extraNote) => {
      const years = () => Math.floor(ageOf(entity()))
      const setAge = v => {
        const x = entity()
        if (!x) return
        x.birthYear += Math.floor(ageOf(x)) - Math.max(0, Math.floor(v))
      }
      addRow({
        label: t('age'),
        get: () => entity() ? years() : undefined,
        set: setAge,
        enabled: () => !!entity(),
        steps: [1, 5],
        extra: [['−1', () => setAge(years() - 1)], ['−5', () => setAge(years() - 5)]],
        suffix: () => {
          const x = entity()
          if (!x) return ''
          const more = extraNote ? extraNote(x) : ''
          return t('bornIn', { year: x.birthYear }) + (more ? ' · ' + more : '')
        },
      }, parent)
    }
    ageRow(selected, secFam)

    const SKILLS = ['intelligence', 'stewardship', 'eloquence', 'combat']
    SKILLS.forEach(key => addRow({
      label: t(key), get: () => selected()?.skills?.[key], set: v => { selected().skills[key] = v }, steps: [1, 5],
    }, secFam))
    const bulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px', secFam)
    button(bulk, t('allTo') + ' ' + SKILL_MAX, () => { for (const k of SKILLS) selected().skills[k] = SKILL_MAX })
    button(bulk, t('familyAllTo') + ' ' + SKILL_MAX, () => household().forEach(ch => { for (const k of SKILLS) ch.skills[k] = SKILL_MAX }))

    const jobMax = () => { const ch = selected(); return (ch?.job && JOBS?.types[ch.job]?.maxLevel) || 0 }
    const setJobLevel = v => {
      const ch = selected()
      if (!ch?.job) return
      if (JOBS) JOBS.set(S(), { characterId: ch.id, jobLevel: v })
      else ch.jobLevel = Math.max(0, v)
    }
    addRow({
      label: t('jobLevel'),
      get: () => selected()?.job ? selected().jobLevel : undefined,
      set: setJobLevel,
      enabled: () => !!selected()?.job,
      steps: [1, 5],
      extra: [[t('max'), () => setJobLevel(jobMax()), t('maxTip')]],
      suffix: () => {
        const ch = selected()
        if (!ch?.job) return t('noJob')
        return (JOBS?.titles[ch.job] || ch.job) + ' · ' + t('maxShort') + ' ' + jobMax()
      },
    }, secFam)

    subheading(secFam, t('traits'))
    traitEditor(secFam, {
      available: !!TR, entity: selected, list: () => TR.list,
      title: id => TR.titles[id]?.title || id, describe: id => TR.titles[id]?.description || '',
      add: (ch, id) => {
        TR.add(ch, id)
        if (TR.discoverable.includes(id)) {
          ch.discoveredTraits = ch.discoveredTraits || []
          if (!ch.discoveredTraits.includes(id)) ch.discoveredTraits.push(id)
        }
      },
      remove: (ch, id) => TR.remove(ch, id),
    })

    // --- Sección: Mascotas ---------------------------------------------------
    const secPets = section('pets')
    const petPick = select(secPets, v => { selectedPetId = v })
    const petLabel = p => {
      const owner = S().characters[p.ownerId]?.praenomen
      return p.name + ' (' + (PETS?.types[p.type]?.breed || p.type) + (owner ? ', ' + t('petOwner', { owner }) : '') + ')'
    }
    rosterSelect(petPick, householdPets, () => selectedPetId, v => { selectedPetId = v }, petLabel, t('noPets'))
    ageRow(selectedPet, secPets, p => {
      const type = PETS?.types[p.type]
      return type ? t('petLife', { adult: type.adultAge, life: type.lifeExpectancy }) : ''
    })
    const PET_SKILLS = ['aptitude', 'vigor', 'tameness']
    PET_SKILLS.forEach(key => addRow({
      label: t(key), get: () => selectedPet()?.skills?.[key], set: v => { selectedPet().skills[key] = v },
      enabled: () => !!selectedPet(), steps: [1, 5],
    }, secPets))
    const petBulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px', secPets)
    button(petBulk, t('allTo') + ' ' + SKILL_MAX, () => { const p = selectedPet(); if (p) for (const k of PET_SKILLS) p.skills[k] = SKILL_MAX })
    button(petBulk, t('petsAllTo') + ' ' + SKILL_MAX, () => householdPets().forEach(p => { for (const k of PET_SKILLS) p.skills[k] = SKILL_MAX }))
    subheading(secPets, t('petTraits'))
    traitEditor(secPets, {
      available: !!PETS, entity: selectedPet, list: () => PETS.traitList,
      title: id => PETS.traitTitles[id]?.title || id, describe: id => PETS.traitTitles[id]?.description || '',
      add: (p, id) => PETS.add(p, id), remove: (p, id) => PETS.remove(p, id),
    })

    // --- Sección: Multiplicadores --------------------------------------------
    // El juego multiplica todos los modificadores activos de una clave. El trainer
    // añade UNO propio por clave (id "cor_trainer", permanente) que puedes cambiar
    // o quitar sin tocar los del juego.
    const secMods = section('multipliers')
    const modCatalog = () => {
      const out = [
        [t('household'), [['household_health', t('householdHealth')], ['revenue', t('revenue')], ['household_fertility', t('householdFertility')],
          ['household_expenses', t('householdExpenses')], ['household_stewardship', t('householdStewardship')]]],
      ]
      const ch = selected(), p = selectedPet()
      if (ch) out.push([t('personal') + ': ' + ch.praenomen, [['character_health_' + ch.id, t('personalHealth')], ['character_fertility_' + ch.id, t('personalFertility')],
        ['character_expenses_' + ch.id, t('personalExpenses')], ['character_stewardship_' + ch.id, t('personalStewardship')]]])
      if (p) out.push([t('petGroup') + ': ' + p.name, [['pet_health_' + p.id, t('petHealth')], ['pet_fertility_' + p.id, t('petFertility')],
        ['pet_expenses_' + p.id, t('petExpenses')]]])
      if (JOBS) out.push([t('jobs'), Object.keys(JOBS.types).map(j => ['job_' + j, t('jobPrefix') + ': ' + (JOBS.titles[j] || j)]).sort((a, b) => a[1].localeCompare(b[1]))])
      if (MODS) out.push([t('properties'), Object.keys(MODS.propTypes).map(k => ['property_' + k, t('propPrefix') + ': ' + (MODS.propTitles[k]?.title || k)]).sort((a, b) => a[1].localeCompare(b[1]))])
      return out
    }
    const PERSONAL = { health: 'health', fertility: 'fertility', expenses: 'expenses', stewardship: 'stewardshipShort' }
    const modName = key => {
      for (const [, items] of modCatalog()) for (const [k, n] of items) if (k === key) return n
      const m = key.match(/^(character|pet)_(health|fertility|expenses|stewardship)_(.+)$/)
      if (m) {
        const who = m[1] === 'pet' ? pets()[m[3]]?.name : S().characters[m[3]]?.praenomen
        return t('xOfY', { x: t(PERSONAL[m[2]]), y: who || '?' })
      }
      return key
    }
    const trainerFactor = key => (S()?.current?.modifiers?.[key] || []).find(m => m.id === TRAINER_MOD_ID)?.factor
    const setTrainerFactor = (key, f) => {
      MODS.remove(key, TRAINER_MOD_ID)
      if (f && Math.abs(f - 1) > 1e-9) MODS.add(key, TRAINER_MOD_ID, Math.max(0.01, f), 'Trainer')
    }

    const modPick = select(secMods, v => { modKey = v })
    let modSig = ''
    refreshers.push(() => {
      const cat = modCatalog()
      const now = cat.map(([g, items]) => g + items.length).join('|')
      if (now === modSig) return
      modSig = now
      modPick.innerHTML = ''
      for (const [g, items] of cat) {
        const og = el('optgroup', '', modPick)
        og.label = g
        for (const [k, n] of items) { const o = el('option', '', og); o.value = k; o.textContent = n }
      }
      if (![...modPick.options].some(o => o.value === modKey)) modKey = 'household_health'
      modPick.value = modKey
    })
    addRow({
      label: t('trainerFactor'), get: () => trainerFactor(modKey) ?? 1, set: f => setTrainerFactor(modKey, f), enabled: () => !!MODS,
      extra: [['×2', () => setTrainerFactor(modKey, (trainerFactor(modKey) ?? 1) * 2)], [t('removeFactor'), () => setTrainerFactor(modKey, 1), t('removeFactorTip')]],
      suffix: () => t('total') + ': ×' + fmt(MODS?.value(modKey) ?? 1),
    }, secMods)
    note(secMods, t('modNote'))

    subheading(secMods, t('activeNow'))
    const active = el('div', 'font-size:12px;margin-top:2px', secMods)
    const clearAll = el('div', 'display:flex;justify-content:flex-end;margin-top:4px', secMods)
    button(clearAll, t('removeAll'), () => {
      for (const key of Object.keys(S().current.modifiers || {})) MODS.remove(key, TRAINER_MOD_ID)
    })
    let activeSig = ''
    refreshers.push(force => {
      if (!MODS) { active.textContent = t('notAvailable'); return }
      const items = Object.keys(S()?.current?.modifiers || {})
        .map(k => [k, MODS.value(k), trainerFactor(k)])
        .filter(([, v]) => typeof v === 'number' && Math.abs(v - 1) > 0.005)
      const now = items.map(x => x.join(':')).join('|')
      if (now === activeSig && !force) return
      activeSig = now
      active.innerHTML = ''
      if (!items.length) { const n = el('span', 'opacity:.6', active); n.textContent = t('none') }
      for (const [k, v, tf] of items) {
        const row = el('div', 'display:flex;justify-content:space-between;gap:6px;cursor:pointer', active)
        row.title = t('clickToEdit')
        row.onclick = () => { modKey = k; modSig = ''; refresh(true) }
        const name = el('span', '', row)
        name.textContent = modName(k) + (tf ? ' ★' : '')
        const val = el('span', 'font-variant-numeric:tabular-nums;color:' + ((k.includes('expenses') ? v < 1 : v > 1) ? '#9fd38a' : '#e38a7a'), row)
        val.textContent = '×' + fmt(v)
      }
    })
    note(secMods, t('legend'))

    // --- Sección: Propiedades de la casa -------------------------------------
    // current.propertyDetails guarda cuántas unidades tienes de cada tipo. El
    // juego calcula un límite administrable (según clase y administración); por
    // encima de 1,2× el límite hay eventos que te hacen perder propiedades.
    // Esta sección ocupa todo el ancho del panel y reparte sus grupos en columnas.
    const secProps = section('estate')
    cards.estate.style.gridColumn = '1 / -1'
    if (!PROPS) note(secProps, t('notAvailable'))
    else {
      const details = () => S().current.propertyDetails
      const setCount = (k, v) => {
        const d = details(), n = Math.max(0, Math.floor(v))
        if (k in d) d[k] = n
        else store()._vm.$set(d, k, n) // clave nueva: hacerla reactiva (Vue 2)
      }
      const limit = k => Math.floor(PROPS.max(k) || 0)
      const propBulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin:2px 0 4px', secProps)
      button(propBulk, t('allToLimit'), () => Object.keys(PROPS.types).forEach(k => setCount(k, limit(k))))
      const propGrid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));column-gap:22px;align-items:start', secProps)
      for (const g of ['land', 'animal', 'boat', 'estate']) {
        const keys = (PROPS.groups[g]?.properties || []).filter(k => PROPS.types[k])
        if (!keys.length) continue
        const col = el('div', 'min-width:0', propGrid)
        subheading(col, PROPS.groupTitles[g] || g)
        for (const k of keys) addRow({
          label: PROPS.titles[k]?.title || k, wide: true,
          tip: (PROPS.titles[k]?.title || k) + (PROPS.titles[k]?.units ? ' (' + PROPS.titles[k].units + ')' : ''),
          get: () => details()?.[k] || 0,
          set: v => setCount(k, v),
          steps: [10],
          extra: [[t('toLimit'), () => setCount(k, limit(k))]],
          inline: () => '/ ' + limit(k),
          inlineColor: () => {
            const n = details()?.[k] || 0, m = limit(k)
            return n > m * 1.2 ? '#e38a7a' : n > m ? '#e0c07a' : ''
          },
        }, col)
      }
      note(secProps, t('propNote'))
    }

    applyOrder()
    document.body.appendChild(frame)

    // --- Refresco -------------------------------------------------------------
    refresh = force => {
      for (const fn of refreshers) { try { fn(force) } catch (e) { console.warn('[trainer]', e) } }
      for (const { c, input, btns, sub, inline } of rows) {
        let on = true; try { on = c.enabled ? c.enabled() : true } catch { on = false }
        input.disabled = !on
        btns.forEach(b => { b.disabled = !on; b.style.opacity = on ? '' : '.4' })
        if (sub) { try { sub.textContent = c.suffix() } catch {} }
        if (inline) {
          try { inline.textContent = c.inline(); inline.style.color = c.inlineColor ? c.inlineColor() : ''; inline.style.opacity = inline.style.color ? '1' : '.7' } catch {}
        }
        if (document.activeElement === input) continue // no pisar lo que estás escribiendo
        let v; try { v = c.get() } catch {}
        input.value = fmt(v)
      }
    }
    clearInterval(window.__corTrainerTimer)
    window.__corTrainerTimer = setInterval(() => refresh(), 500)
    refresh(true)
  }

  build()

  // Si la ventana del juego se achica, que el panel no quede fuera de pantalla.
  if (!window.__corTrainerResize) {
    window.__corTrainerResize = true
    addEventListener('resize', () => {
      const p = document.getElementById('cor-trainer')
      if (!p) return
      p.style.left = Math.max(0, Math.min(p.offsetLeft, innerWidth - 80)) + 'px'
      p.style.top = Math.max(0, Math.min(p.offsetTop, innerHeight - 40)) + 'px'
    })
  }

  if (!window.__corTrainerKeys) {
    window.__corTrainerKeys = true
    window.addEventListener('keydown', e => {
      if (e.key === 'F8') {
        const p = document.getElementById('cor-trainer')
        if (p) p.style.display = p.style.display === 'none' ? '' : 'none'
      }
    })
  }
  return store() ? 'ok' : 'store-not-ready'
})()`

async function findGamePage() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
  const targets = await res.json()
  const page = targets.find(t => t.type === 'page' && /index\.html/.test(t.url))
    || targets.find(t => t.type === 'page')
  if (!page) throw new Error('No se encontró la ventana del juego en el puerto de depuración.')
  return page
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let nextId = 1
  const pending = new Map()
  const listeners = new Set()
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) {
      listeners.forEach(fn => fn(msg))
    }
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const opened = new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('No se pudo abrir el WebSocket de depuración.'))
  })
  return { ws, send, opened, on: fn => listeners.add(fn) }
}

async function inject(send) {
  // Reintenta hasta que Vue y la partida estén listos.
  for (let i = 0; i < 60; i++) {
    const r = await send('Runtime.evaluate', { expression: PANEL, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'error al inyectar')
    if (r.result.value === 'ok') return true
    await new Promise(res => setTimeout(res, 1000))
  }
  return false
}

async function main() {
  let page
  try {
    page = await findGamePage()
  } catch (e) {
    console.error(`No pude conectar con el juego en el puerto ${PORT}.`)
    console.error('¿Está abierto con la opción de lanzamiento --remote-debugging-port=9222?')
    process.exit(1)
  }
  console.log(`Conectado a: ${page.title || page.url}`)

  const { ws, send, opened, on } = connect(page.webSocketDebuggerUrl)
  await opened
  await send('Page.enable')

  on(async msg => {
    if (msg.method === 'Page.loadEventFired') {
      console.log('El juego recargó la página, reinyectando panel...')
      if (await inject(send)) console.log('Panel listo (F8).')
    }
  })

  if (await inject(send)) console.log('Panel listo. Pulsa F8 dentro del juego para mostrarlo u ocultarlo.')
  else console.log('El juego aún no tiene una partida cargada; el panel aparecerá al recargar.')

  ws.onclose = () => { console.log('El juego se cerró. Saliendo.'); process.exit(0) }
  console.log('Deja esta ventana abierta. Ctrl+C para salir.')
}

main()
