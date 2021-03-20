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
    return this.items.filter(i => i.name === skillName && i.type === 'skill').length > 0;
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
  