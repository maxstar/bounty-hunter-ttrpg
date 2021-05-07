import { BountyHunterActor, BountyHunterItem } from "./actor/bounty-hunter.js";
import { initializeHandlebars } from "./hooks/handlebars.js";
import { migrateWorld } from "./hooks/migration.js";
import { registerSheets } from "./hooks/sheets.js";
import { loadSystemSettings, registerSettings } from "./hooks/system-settings.js";
import { BhCombat } from './component/bh-combat.js';
import { BhCombatTracker } from './component/bh-combat-tracker.js';
import { BountyHunterStarshipSheet } from './sheet/starship.js';
import { BountyHunterActorSheet } from './sheet/actor.js';

// CONFIG.debug.hooks = true;

Hooks.once("init", () => {
  CONFIG.Actor.entityClass = BountyHunterActor;
  CONFIG.Item.entityClass = BountyHunterItem;
  CONFIG.Combat.entityClass = BhCombat;
  CONFIG.ui.combat = BhCombatTracker;

  CONFIG.Combat.initiative.formula = "1";
  registerSheets();
  initializeHandlebars();
  registerSettings();
});

Hooks.once("ready", async () => {
  migrateWorld();
  loadSystemSettings();
  window.TextEditor.activateListeners();
  BountyHunterActorSheet.setupSocketListeners();
});

/**
 * Initialize internal actor data
 */
Hooks.on("renderActorSheet", async (app, html, data) => {
  if (!(app instanceof BountyHunterStarshipSheet)) return; // not our thing

  let actor = game.actors.get(data.entity._id);
  // either we opened a ship from a compendium or everything is already initialized
  if (actor === null || actor.data.flags.crewMembers !== undefined) return; 

  console.log("Bounty Hunter TTRPG: initializing starship sheet");
  let initialData = {
    "flags.crewMembers": [],
  };

  for (let key in CONFIG.BountyHunter['starship-roles']) {
    if (key === 'gunner') continue; // this will be handled by special logic for manning weapons
    initialData[`flags.starship.${key}`] = [];
  }
  initialData['flags.starship.other'] = [];
  await actor.update(initialData);
});

Hooks.on( "renderChatLog", async function (cLog) {
  const cLogHtml = document.getElementById("chat-log");

  cLogHtml.addEventListener("click", chatChallenge.bind(this));

  function chatChallenge(event) {
    const origin = event.target;
    if (!origin.classList.contains("skill-challenge-succeed")) return;

    const msgId = $(origin).closest('.chat-message.message').data('message-id');
    let msg = game.messages.get(msgId);

    succeedChallenge(origin, msg);
  }
});

async function succeedChallenge(button, msg) {
  // msg.update(chatData);
  ui.chat.updateMessage(msg, true);
}
