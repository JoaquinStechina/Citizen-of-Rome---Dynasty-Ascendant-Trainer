// Mascotas: edad, habilidades y rasgos de las mascotas de la casa.
const { el } = require('core/dom')
const { t } = require('core/i18n')
const game = require('game')
const sel = require('core/selection')

const PET_SKILLS = ['aptitude', 'vigor', 'tameness']

module.exports = {
  id: 'pets',
  build({ body, ui }) {
    const { S, PETS, SKILL_MAX } = game
    const selectedPet = sel.pet

    const petPick = ui.select(body, v => { sel.petId = v })
    const petLabel = p => {
      const owner = S().characters[p.ownerId]?.praenomen
      return p.name + ' (' + (PETS?.types[p.type]?.breed || p.type) + (owner ? ', ' + t('petOwner', { owner }) : '') + ')'
    }
    ui.rosterSelect(petPick, game.householdPets, () => sel.petId, v => { sel.petId = v }, petLabel, t('noPets'))
    ui.ageRow(selectedPet, body, p => {
      const type = PETS?.types[p.type]
      return type ? t('petLife', { adult: type.adultAge, life: type.lifeExpectancy }) : ''
    })

    PET_SKILLS.forEach(key => ui.addRow({
      label: t(key), get: () => selectedPet()?.skills?.[key], set: v => { selectedPet().skills[key] = v },
      enabled: () => !!selectedPet(), steps: [1, 5],
    }, body))
    const petBulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px', body)
    ui.button(petBulk, t('allTo') + ' ' + SKILL_MAX, () => { const p = selectedPet(); if (p) for (const k of PET_SKILLS) p.skills[k] = SKILL_MAX })
    ui.button(petBulk, t('petsAllTo') + ' ' + SKILL_MAX, () => game.householdPets().forEach(p => { for (const k of PET_SKILLS) p.skills[k] = SKILL_MAX }))

    ui.subheading(body, t('petTraits'))
    ui.traitEditor(body, {
      available: !!PETS, entity: selectedPet, list: () => PETS.traitList,
      title: id => PETS.traitTitles[id]?.title || id, describe: id => PETS.traitTitles[id]?.description || '',
      add: (p, id) => PETS.add(p, id), remove: (p, id) => PETS.remove(p, id),
    })
  },
}
