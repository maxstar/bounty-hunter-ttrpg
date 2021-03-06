export class StarshipHandler {
  doAction(starship, character, action) {
    Hooks.call(`pre${action.key}`, starship, character, action);

    // check that character has skills
    /** @var {Array|false} */
    const skillset = this._getSkillset(character, action);
    if (!skillset) {
      ui.notifications.error(`${character.name} does not have necessary skills`);
      return;
    }

    // check that character has enough AP
    const apCost = skillset.length;
    if (character.data.data.bio.ap.value < apCost) {
      ui.notifications.error(`${character.name} does not have enough Action Points`);
      return;
    }

    // do custom logic

    character.reduceAP(apCost);
    this._postActionMessage(character, action, skillset, apCost);

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
  
  async _postActionMessage(character, action, skillset, apSpent) {
    let chatCard = await renderTemplate(
      'systems/bounty-hunter-ttrpg/template/chat/starship-action-use.html', 
      {
        actionName: game.i18n.localize(action.name), 
        description: game.i18n.localize(action.description), 
        skills: skillset,
        apSpent: apSpent,
      }
    );
    let chatData = {
      speaker: {actor: character.id},
      content: chatCard,
    };
    ChatMessage.create(chatData, {});
  }
}