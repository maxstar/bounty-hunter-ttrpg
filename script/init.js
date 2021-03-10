import { BountyHunterActor, BountyHunterItem } from "./actor/bounty-hunter.js";
import { initializeHandlebars } from "./hooks/handlebars.js";
import { migrateWorld } from "./hooks/migration.js";
import { registerSheets } from "./hooks/sheets.js";
import { loadSystemSettings } from "./hooks/system-settings.js";
import { ReputationStats } from './component/reputation-stats.js';

// CONFIG.debug.hooks = true;

Hooks.once("init", () => {
  CONFIG.Actor.entityClass = BountyHunterActor;
  CONFIG.Item.entityClass = BountyHunterItem;
  registerSheets();
  initializeHandlebars();
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
    default: 3,
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
});

Hooks.once("ready", async () => {
  migrateWorld();
  loadSystemSettings();
  window.TextEditor.activateListeners();
});

Hooks.on('preUpdateActor', async (entity, updateData, options, userId) => {
  if (!(entity instanceof BountyHunterActor)) return true;
  
  if ( updateData.data?.bio?.reputation?.value ) {
    let stats = ReputationStats.getForReputation(updateData.data.bio.reputation.value);
    if (stats !== false && entity.data.data.bio.ap.max !== stats.ap) {
      if (updateData.data.bio.ap === undefined) updateData.data.bio.ap = {max: stats.ap};
      else updateData.data.bio.ap.max = stats.ap;
    }
  }

  return true;
});
