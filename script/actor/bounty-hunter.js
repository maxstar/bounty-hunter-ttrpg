export class BountyHunterActor extends Actor {

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
      let chatCard = await renderTemplate(
        'systems/bounty-hunter-ttrpg/template/chat/item.html', 
        {item: this.data}
      );
      let chatData = {
        speaker: {actor: this.actor ? this.actor._id : game.user._id},
        content: chatCard,
      };
      ChatMessage.create(chatData, {});
    }
}
  