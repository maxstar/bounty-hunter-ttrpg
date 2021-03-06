export class BhCombatTracker extends CombatTracker {
  get template() {
    return "systems/bounty-hunter-ttrpg/template/component/bh-combat-tracker.html";
  }

  /** @override */
	activateListeners(html) {
	  super.activateListeners(html);

    html.find('.phase-control').click(ev => this._onPhaseControl(ev));
  }

  async getData(options) {
    let data = await super.getData(options);

    const combat = this.viewed;
    const hasCombat = combat !== null;
    if ( !hasCombat ) return data;

    const phases = [
      {active: 0 === (combat.phase ?? 0), combatants: []},
      {active: 1 === (combat.phase ?? 0), combatants: []},
      {active: 2 === (combat.phase ?? 0), combatants: []},
    ];
    let combatant;
    for ( let [i, combatantData] of data.turns.entries() ) {
      combatant = combat.combatants.get(combatantData.id);
      combatantData.hasFastDraw = combatant.data.hasFastDraw;
      combatantData.usedFastDraw = combatant.data.flags.usedFastDraw || false;
      phases[combatantData.initiative ?? 2].combatants.push(combatantData);
    }

    data.phases = phases;
    data.displayPhaseControl = combat.started && phases[0].active;

    return data;
  }


  /**
   * Handle a phase control buttons
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onPhaseControl(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const c = this.viewed.combatants.get(li.dataset.combatantId);
    let fastDraw, usageSuccess;

    // Switch control action
    switch (btn.dataset.control) {

      case "goFirstPhase":
        await this.viewed.combatants.get(c.id).update({initiative: 1});
        await c.actor.reduceAP(1);
        break;

      case "goLastPhase":
        await this.viewed.combatants.get(c.id).update({initiative: 2});
        await c.actor.restoreAP(1);
        break;

      case "useFastDraw":
        fastDraw = c.actor.items.getName('Fast Draw');
        usageSuccess = await c.actor.sheet._reduceItemUses(fastDraw);
        if (usageSuccess) await c.actor.sheet._postItemUse(fastDraw);
        await c.update({'flags.usedFastDraw': true, initiative: 1});
        break;

      case "cancelFastDraw":
        fastDraw = c.actor.items.getName('Fast Draw');
        await fastDraw.update({'data.uses.value': Math.min(fastDraw.data.data.uses.max, fastDraw.data.data.uses.value + 1)});
        await c.update({'flags.usedFastDraw': false, initiative: 2});
        break;
    }

    // Render tracker updates
    this.render(true);
  }
}