import { BountyHunterActor, BountyHunterItem } from "./actor/bounty-hunter.js";
import { initializeHandlebars } from "./hooks/handlebars.js";
import { migrateWorld } from "./hooks/migration.js";
import { registerSheets } from "./hooks/sheets.js";
import { loadSystemSettings, registerSettings } from "./hooks/system-settings.js";
import { ReputationStats } from './component/reputation-stats.js';
import { BhCombat } from './component/bh-combat.js';
import { BhCombatTracker } from './component/bh-combat-tracker.js';

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
