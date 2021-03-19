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

    const combat = this.combat;
    const hasCombat = combat !== null;
    if ( !hasCombat ) return data;

    const phases = [
      {active: 0 === (combat.phase ?? 0), combatants: []},
      {active: 1 === (combat.phase ?? 0), combatants: []},
      {active: 2 === (combat.phase ?? 0), combatants: []},
    ];
    for ( let [i, combatant] of data.turns.entries() ) {
      phases[combatant.initiative ?? 2].combatants.push(combatant);
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
    const c = this.combat.getCombatant(li.dataset.combatantId);

    // Switch control action
    switch (btn.dataset.control) {

      case "goFirstPhase":
        await this.combat.updateCombatant({_id: c._id, initiative: 1});
        await c.actor.reduceAP(1);
        break;

      // Toggle combatant defeated flag
      case "goLastPhase":
        await this.combat.updateCombatant({_id: c._id, initiative: 2});
        await c.actor.restoreAP(1);
        break;
    }

    // Render tracker updates
    this.render();
  }
}