import { BountyHunterActor, BountyHunterItem } from "./actor/bounty-hunter.js";
import { initializeHandlebars } from "./hooks/handlebars.js";
import { migrateWorld } from "./hooks/migration.js";
import { registerSheets } from "./hooks/sheets.js";

// CONFIG.debug.hooks = true;

Hooks.once("init", () => {
  CONFIG.Actor.entityClass = BountyHunterActor;
  CONFIG.Item.entityClass = BountyHunterItem;
  registerSheets();
  initializeHandlebars();
  game.settings.register("bounty-hunter-ttrpg", "worldSchemaVersion", {
    name: "World Version",
    hint: "Used to automatically upgrade worlds data when the system is upgraded.",
    scope: "world",
    config: true,
    default: 0,
    type: Number,
  });
  game.settings.register("bounty-hunter-ttrpg", "baseCarryingCapacity", {
    name: "Carrying Capacity",
    hint: "How many items a character can carry.",
    scope: "world",
    config: true,
    default: 12,
    type: Number,
  });
  game.settings.register("bounty-hunter-ttrpg", "bonusSkills", {
    name: "Additional Skills",
    hint: "How many additional skills a character can have depending on your party size. Players/Skills: 1/8, 2/6, 3/5, 4/3, 5/2, 6+/1.",
    scope: "world",
    config: true,
    default: 3,
    type: Number,
  });
});

Hooks.once("ready", () => {
  migrateWorld();
});
