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

  hasSkill(skillName) {
    return this.items.find(i => i.name === skillName && i.type === 'skill') !== null;
  }

  hasSkillChain(skillNames) {
    return this.items.filter(i => skillNames.includes(i.name) && i.type === 'skill').length === skillNames.length;
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
        const itemData = duplicate(this.data);
        if (itemData.img.includes("/mystery-man")) {
        itemData.img = null;
        }
        itemData.link = this.link;
        itemData.isArmor = itemData.type === "armor";
        itemData.isBuilding = itemData.type === "building";
        itemData.isCriticalInjury = itemData.type === "criticalInjury";
        itemData.isGear = itemData.type === "gear";
        itemData.isHireling = itemData.type === "hireling";
        itemData.isMonsterAttack = itemData.type === "monsterAttack";
        itemData.isMonsterTalent = itemData.type === "monsterTalent";
        itemData.isRawMaterial = itemData.type === "rawMaterial";
        itemData.isSpell = itemData.type === "spell";
        itemData.isTalent = itemData.type === "talent";
        itemData.isWeapon = itemData.type === "weapon";
        itemData.hasRollModifiers = itemData.data.rollModifiers && Object.values(itemData.data.rollModifiers).length > 0;
        const html = await renderTemplate("systems/bounty-hunter-ttrpg/template/chat/item.html", itemData);
        const chatData = {
        user: game.user._id,
        rollMode: game.settings.get("core", "rollMode"),
        content: html,
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
        chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        } else if (chatData.rollMode === "selfroll") {
        chatData.whisper = [game.user];
        }
        ChatMessage.create(chatData);
    }
}
  