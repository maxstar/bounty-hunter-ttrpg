import { StarshipHandler } from "../component/starship-handler.js";

export async function loadSystemSettings() {
  CONFIG.BountyHunter = {
    reputation: await loadReputation(),
    'starship-roles': await loadStarshipRoles(),
    starshipHandlerClass: StarshipHandler,
    'character-creation': await loadCharacterCreation(),
  };
}

async function loadReputation() {
  const datasetDir = game.settings.get("bounty-hunter-ttrpg", "datasetDir");
  const resp = await fetch(datasetDir + '/reputation.json').catch(err => { return {} });
  return resp.json();
}

async function loadStarshipRoles() {
  const datasetDir = game.settings.get("bounty-hunter-ttrpg", "datasetDir");
  const resp = await fetch(datasetDir + '/starship-roles.json').catch(err => { return {} });
  return resp.json();
}

async function loadCharacterCreation() {
  const datasetDir = game.settings.get("bounty-hunter-ttrpg", "datasetDir");
  const resp = await fetch(datasetDir + '/character-creation.json').catch(err => { return {} });
  return resp.json();
}

export function registerSettings() {
  game.settings.register("bounty-hunter-ttrpg", "worldSchemaVersion", {
    name: game.i18n.localize("BH.SETTINGS.WORLD_VERSION"),
    hint: game.i18n.localize("BH.SETTINGS.WORLD_VERSION_HINT"),
    scope: "world",
    config: true,
    default: 0,
    type: Number,
  });
  game.settings.register("bounty-hunter-ttrpg", "maxApPerSkill", {
    name: game.i18n.localize("BH.SETTINGS.MAX_AP_PER_SKILL"),
    hint: game.i18n.localize("BH.SETTINGS.MAX_AP_PER_SKILL_HINT"),
    scope: "world",
    config: true,
    default: 5,
    type: Number,
  });
  game.settings.register("bounty-hunter-ttrpg", "baseCarryingCapacity", {
    name: game.i18n.localize("BH.SETTINGS.CARRYING_CAPACITY"),
    hint: game.i18n.localize("BH.SETTINGS.CARRYING_CAPACITY_HINT"),
    scope: "world",
    config: true,
    default: 12,
    type: Number,
  });
  game.settings.register("bounty-hunter-ttrpg", "bonusSkills", {
    name: game.i18n.localize("BH.SETTINGS.BONUS_SKILLS"),
    hint: game.i18n.localize("BH.SETTINGS.BONUS_SKILLS_HINT"),
    scope: "world",
    config: true,
    default: 2,
    type: Number,
  });
  game.settings.register("bounty-hunter-ttrpg", "crewCost", {
    name: game.i18n.localize("BH.SETTINGS.CREW_COST"),
    hint: game.i18n.localize("BH.SETTINGS.CREW_COST_HINT"),
    scope: "world",
    config: true,
    default: 200,
    type: Number,
  });
  game.settings.register("bounty-hunter-ttrpg", "datasetDir", {
    name: game.i18n.localize("BH.SETTINGS.DATASET_DIR"),
    hint: game.i18n.localize("BH.SETTINGS.DATASET_DIR_HINT"),
    scope: "world",
    config: true,
    default: "systems/bounty-hunter-ttrpg/asset/dataset",
    type: window.Azzu.SettingsTypes.DirectoryPicker
  });
}