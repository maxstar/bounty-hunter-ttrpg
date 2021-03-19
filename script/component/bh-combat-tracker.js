export class BhCombatTracker extends CombatTracker {
  get template() {
    return "systems/bounty-hunter-ttrpg/template/component/bh-combat-tracker.html";
  }

  async getData(options) {
    let data = await super.getData(options);

    const combat = this.combat;
    const hasCombat = combat !== null;
    if ( !hasCombat ) return data;

    const phases = [];
    for ( let [p, phase] of combat.phases.entries() ) {
      const newPhase = {active: p === (combat.phase ?? 0), combatants: []};
      for ( let [i, combatant] of phase.entries() ) {
        if ( !combatant.visible ) continue;
  
        // Thumbnail image for video tokens
        if ( VideoHelper.hasVideoExtension(combatant.img) ) {
          if ( combatant.thumb ) combatant.img = combatant.thumb;
          else combatant.img = combatant.thumb = await game.video.createThumbnail(combatant.img, {width: 100, height: 100});
        }
  
        // Copy the turn data
        const c = duplicate(combatant);
        if ( Number.isFinite(c.initiative) && !Number.isInteger(c.initiative) ) hasDecimals = true;
  
        // Token status effect icons
        c.effects = new Set(c.token?.effects || []);
        if ( c.token?.overlayEffect ) c.effects.add(c.token.overlayEffect);
        if ( combatant.actor ) combatant.actor.temporaryEffects.forEach(e => {
          if ( e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId ) c.defeated = true;
          else if ( e.data.icon ) c.effects.add(e.data.icon);
        });
  
        // Track resources
        if ( c.permission < ENTITY_PERMISSIONS.OBSERVER ) c.resource = null;
  
        // Rendering states
        c.active = c.initiative === combat.phase;
        c.css = [
          c.active ? "active" : "",
          c.hidden ? "hidden" : "",
          c.defeated ? "defeated" : ""
        ].join(" ").trim();
        c.hasResource = c.resource !== null;

        newPhase.combatants.push(c);
      }
      phases.push(newPhase);
    }

    data.phases = phases;

    return data;
  }
}