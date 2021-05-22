export class BountyHunterActor extends Actor {

  /**
   * Prepare data related to this Document itself, before any embedded Documents or derived data is computed.
   * @memberof ClientDocumentMixin#
   */
  prepareBaseData() {
    super.prepareBaseData();

    this.data.carryingCapacity = game.settings.get("bounty-hunter-ttrpg", "baseCarryingCapacity");
    this.data.bonusDamage = {
      noSkill: 0,
      rangedAttack: 0,
      martialArts: 0,
      meleeCombat: 0,
    };
  }

  reduceAP(amount) {
    const current = this.data.data.bio.ap.value;
    const min = current > 0 ? 0 : -1;
    let updateData = {
      'data.bio.ap.value': Math.max(min, current - amount),
    };
    this.update(updateData);
  }

  restoreAP(amount) {
    const current = this.data.data.bio.ap.value;
    const max = this.data.data.bio.ap.max;
    let updateData = {
      'data.bio.ap.value': Math.min(max, current + amount),
    };
    this.update(updateData);
  }

  hasAbility(abilityName) {
    return this.items.find(i => i.name === abilityName && i.type === 'ability') !== null;
  }

  hasSkill(skillName) {
    return this.items.find(i => i.name === skillName && i.type === 'skill') !== null;
  }

  hasSkillChain(skillNames) {
    return this.items.filter(i => skillNames.includes(i.name) && i.type === 'skill').length === skillNames.length;
  }

  canDoAction(action, checkAP = true) {
    return action.skill.reduce(
      (a, b) => a || (this.hasSkillChain(b) && (checkAP ? this.data.data.bio.ap.value >= b.length : true)), 
      false
    );
  }

  /** @override */
  _onDeleteEmbeddedEntity(embeddedName, child, options, userId) {
    super._onDeleteEmbeddedEntity(embeddedName, child, options, userId);

    if ( embeddedName !== "OwnedItem" ) return;
    const item = this.getOwnedItem(child._id);
    if (child.type !== 'weapon-component') return; // not a weapon component

    const key = `gunner-${child._id}`;
    // assign crew members to Other activity
    this.sheet.assignCrewMembersToRole(this.data.flags.starship[key], 'other');

    // remove role key
    const updateKey = `flags.starship.-=${key}`;
    this.update({[updateKey]: null});
  }
}
  
export class BountyHunterItem extends Item {
    async sendToChat() {
      let templateMap = {
        gear: 'systems/bounty-hunter-ttrpg/template/chat/item.html',
        weapon: 'systems/bounty-hunter-ttrpg/template/chat/weapon.html',
        skill: 'systems/bounty-hunter-ttrpg/template/chat/skill.html',
        ability: 'systems/bounty-hunter-ttrpg/template/chat/ability.html',
        cargo: 'systems/bounty-hunter-ttrpg/template/chat/cargo.html',
      };
      if (templateMap[this.type] === undefined) return;

      let chatCard = await renderTemplate(
        templateMap[this.type], 
        {item: this.data}
      );
      let chatData = {
        speaker:  this.actor 
          ? {actor: this.actor.id} 
          : {actor: game.user._id, alias: game.user.name},
        content: chatCard,
      };
      ChatMessage.create(chatData, {});
    }
}
  