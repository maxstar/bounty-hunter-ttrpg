import { BountyHunterActor, BountyHunterItem } from "./actor/bounty-hunter.js";
import { initializeHandlebars } from "./hooks/handlebars.js";
import { migrateWorld } from "./hooks/migration.js";
import { registerSheets } from "./hooks/sheets.js";
import { loadSystemSettings } from "./hooks/system-settings.js";

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
});
