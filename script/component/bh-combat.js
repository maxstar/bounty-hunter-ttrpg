export class BhCombat extends Combat {
  constructor(...args) {
    super(...args);

    /**
     * Track the sorted turn order of this combat encounter
     * @type {Array}
     */
    this.phases = this.phases || [];
  }

  /**
   * The numeric turn of the combat round in the Combat encounter
   * @type {number}
   */
  get phase() {
    return Math.max(this.data.flags.phase, 0);
  }
  
  /**
  * Prepare Embedded Entities which exist within the parent Combat.
  * For example, in the case of an Actor, this method is responsible for preparing the Owned Items the Actor contains.
  */
 prepareEmbeddedEntities() {
   super.prepareEmbeddedEntities();

   this.phases = this.setupPhases();
 }

 setupPhases() {
   this.data.flags.phase = this.data.flags.phase ?? 0;
   return this.phases = [[], [], this.turns];
 }

  /**
   * Prepare turn data for one specific combatant.
   * @private
   */
  _prepareCombatant(c, scene, players, settings={}) {
    let combatant = super._prepareCombatant(c, scene, players, settings);
    const fastDraw = combatant.actor.items.find(i => i.name === 'Fast Draw' && i.type === 'ability');
    combatant.hasFastDraw = fastDraw !== null && fastDraw.data.data.uses.value > 0;
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

      updates.push({_id: id, initiative: 2});

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
    return await this.update({round: 1, turn: 0, 'flags.phase': 0});
  }
  
  /**
   * Advance the combat to the next turn
   * @return {Promise<Combat>}
   */
   async nextRound() {
    this.rollInitiative(this.turns.map(t => t._id));
    let turn = 0;
    if ( this.settings.skipDefeated ) {
      turn = this.turns.findIndex(t => {
        return !(t.defeated ||
        t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId ));
      });
      if (turn === -1) {
        ui.notifications.warn(game.i18n.localize("COMBAT.NoneRemaining"));
        turn = 0;
      }
    }
    let advanceTime = Math.max(this.turns.length - this.data.turn, 1) * CONFIG.time.turnTime;
    advanceTime += CONFIG.time.roundTime;
    return this.update({round: this.round+1, turn: turn, 'flags.phase': 0}, {advanceTime});
   }

   /**
    * Rewind the combat to the previous round
    * @return {Promise<Combat>}
    */
   async previousRound() {
     let phase = ( this.round === 0 ) ? 0 : 2;
     const round = Math.max(this.round - 1, 0);
     let advanceTime = -1 * this.data.flags.phase * CONFIG.time.turnTime;
     if ( round > 0 ) advanceTime -= CONFIG.time.roundTime;
     return this.update({round, 'flags.phase': phase}, {advanceTime});
   }

   /**
    * Advance the combat to the next phase
    * 
    * Phases:
    *   0 - declaration
    *   1 - First Phase
    *   2 - Last Phase
    * 
    * @return {Promise<Combat>}
    */
   async nextPhase() {
     let phase = this.phase ?? 0;
 
     // Determine the next phase number
     let next = phase + 1;
 
     // Maybe advance to the next round
     let round = this.round;
     if ( (this.round === 0) || (next === null) || (next >= 3) ) {
       return this.nextRound();
     }
 
     // Update the encounter
     const advanceTime = CONFIG.time.turnTime;
     this.update({round: round, 'flags.phase': next}, {advanceTime});
   }

   /**
    * Rewind the combat to the previous phase
    * @return {Promise<Combat>}
    */
   async previousPhase() {
     if ( this.phase === 0 && this.round === 0 ) return Promise.resolve();
     else if ( this.phase === 0 ) return this.previousRound();
     const advanceTime = -1 * CONFIG.time.turnTime;
     return this.update({'flags.phase': this.phase - 1}, {advanceTime});
 
   }

   /** @override */
   _onModifyEmbeddedEntity(...args) {
     this.setupTurns();
     this.setupPhases();
     if ( this === this.collection.viewed ) this.collection.render();
   }
}