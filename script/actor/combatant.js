export class BountyHunterCombatant extends Combatant {

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    if ( !this.parent.data ) return;
    
    const fastDraw = this.actor.items.find(i => i.name === 'Fast Draw' && i.type === 'ability');
    this.data.hasFastDraw = !!fastDraw && fastDraw.data.data.uses.value > 0;
  }
}