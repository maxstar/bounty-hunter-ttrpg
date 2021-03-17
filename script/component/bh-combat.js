export class BhCombat extends Combat {

  /**
   * Prepare turn data for one specific combatant.
   * @private
   */
  _prepareCombatant(c, scene, players, settings={}) {
    let combatant = super._prepareCombatant(c, scene, players, settings);

    
    return combatant;
  }
  
  /**
   * Roll initiative for one or multiple Combatants within the Combat entity
   * @param {string|string[]} ids     A Combatant id or Array of ids for which to roll
   * @param {string|null} [formula]   A non-default initiative formula to roll. Otherwise the system default is used.
   * @param {boolean} [updateTurn]    Update the Combat turn after adding new initiative scores to keep the turn on
   *                                  the same Combatant.
   * @param {object} [messageOptions] Additional options with which to customize created Chat Messages
   * @return {Promise<Combat>}        A promise which resolves to the updated Combat entity once updates are complete.
   */
   async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    const currentId = this.combatant._id;

    // Iterate over Combatants, performing an initiative roll for each
    const [updates, messages] = ids.reduce((results, id, i) => {
      let [updates, messages] = results;

      // Get Combatant data
      const c = this.getCombatant(id);
      if ( !c || !c.owner ) return results;

      updates.push({_id: id, initiative: 1});

      // Return the Roll and the chat data
      return results;
    }, [[], []]);
    if ( !updates.length ) return this;

    // Update multiple combatants
    await this.updateEmbeddedEntity("Combatant", updates);

    // Ensure the turn order remains with the same combatant
    if ( updateTurn ) {
      await this.update({turn: this.turns.findIndex(t => t._id === currentId)});
    }

    // Return the updated Combat
    return this;
  }

  /**
   * Begin the combat encounter, advancing to round 1 and turn 1
   * @return {Promise<Combat>}
   */
  async startCombat() {
    this.rollInitiative(this.turns.map(t => t._id));
    return super.startCombat();
  }
  
  /**
   * Advance the combat to the next turn
   * @return {Promise<Combat>}
   */
   async nextTurn() {
    this.rollInitiative(this.turns.map(t => t._id));
    return super.nextTurn();
   }
}