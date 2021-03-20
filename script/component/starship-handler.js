export class StarshipHandler {
  doAction(starship, character, action) {
    Hooks.call(`pre${action.key}`, starship, character, action);

    // check that character has skills
    /** @var {Array|false} */
    const skillset = this.getSkillset(character, action);
    if (!skillset) {
      ui.notifications.error(`${character.name} does not have necessary skills`);
      return;
    }

    // check that character has enough AP
    const apCost = skillset.length;
    // if (character.data.data.bio.ap.value < apCost) {
    //   ui.notifications.error(`${character.name} does not have enough Action Points`);
    //   return;
    // }

    // do custom logic

    character.reduceAP(apCost);
    this._postActionMessage(character, action, apCost);

    Hooks.call(`post${action.key}`, starship, character, action);
  }

  _getSkillset(character, action) {
    let skillset = [], hasAll, minCost = 999;
    for (const chain of action.skill) {
      if (!Array.isArray(chain)) chain = [chain];
      hasAll = true;
      for (const skill of chain) {
        if (!character.hasSkill(skill)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll && chain.length < minCost) {
        skillset = chain;
      }
    }

    return skillset.length ? skillset : false;
  }
  
  _postActionMessage(character, action, apSpent) {
    let chatData = {
      speaker: {actor: character._id},
      // @todo localize
      content: `<span style="font-size: 16px;"><b>${action.name}</b></span> <i style="font-size:10px">(${apSpent} AP spent)<i>`
    };
    ChatMessage.create(chatData, {});
  }
}