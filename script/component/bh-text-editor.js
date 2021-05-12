/**
 * A collection of helper functions and utility methods related to the rich text editor
 */
export class BhTextEditor extends TextEditor {

  /**
   * Enrich HTML content by replacing or augmenting components of it
   * @param {string} content        The original HTML content (as a string)
   * @param {boolean} secrets       Include secret tags in the final HTML? If false secret blocks will be removed.
   * @param {boolean} entities      Replace dynamic entity links?
   * @param {boolean} links         Replace hyperlink content?
   * @param {boolean} rolls         Replace inline dice rolls?
   * @param {Object} rollData       The data object providing context for inline rolls
   * @return {string}               The enriched HTML content
   */
  static enrichHTML(content, {secrets=false, entities=true, links=true, rolls=true, rollData=null}={}) {
  
      const cont = TextEditor.enrichHTML(content, {secrets:secrets, entities:entities, links:links, rolls:rolls, rollData:rollData});

      // Create the HTML element
      const html = document.createElement("div");
      html.innerHTML = String(cont);

      // Plan text content replacements
      let updateTextArray = true;
      let text = [];
      
      // Replace skill challenge links
      if ( updateTextArray ) text = this._getTextNodes(html);
      // @Challenge[Acrobatics:3]{Jump over the chasm}
      const rgx = new RegExp("@Challenge\\[([^\\]]+)\\]\\[(\\d)\\](?:{([^}]+)})?", 'g');
      updateTextArray = this._replaceTextContent(text, rgx, this._createChallengeLink);

      // Return the enriched HTML
      return html.innerHTML;
  };

  /* -------------------------------------------- */
  /*  Text Replacement Functions
  /* -------------------------------------------- */

  /**
   * Create a dynamic challenge link from a regular expression match
   * @param {string} match          The full matched string
   * @param {string} skill          Skill necessary to succeed in the challenge
   * @param {string} apCost         AP cost to succeed in challenge
   * @param {string} description    A customized description of the challenge
   * @return {HTMLAnchorElement}    An HTML element for the entity link
   * @private
   */
  static _createChallengeLink(match, skillName, apCost, description) {

      // Prepare replacement data
      const data = {
          cls: ["skill-challenge-link"],
          icon: null,
          dataset: {},
          apCost: apCost,
          description: description,
      };
      let broken = false;

      // Get the linked Entity
      const entity = BhTextEditor.findSkillByName(skillName);
      if (!entity || entity.type !== 'skill') broken = true;

      // Update link data
      skillName = broken ? skill : entity.name;
      data.skillName = skillName;
      data.description = data.description || game.i18n.localize('BH.CHALLENGE') + ': ' + skillName;
      data.icon = 'fas fa-cog';
      data.dataset = {entity: 'Item', id: broken ? null : entity.id, apCost: apCost, description: description, skillName: skillName};

    // Flag a link as broken
    if (broken) {
      data.icon = "fas fa-unlink";
      data.cls.push("broken");
    }

    // Construct the formed link
    const a = document.createElement('a');
    a.classList.add(...data.cls);
    a.draggable = true;
    for (let [k, v] of Object.entries(data.dataset)) {
      a.dataset[k] = v;
    }
    a.innerHTML = `<i class="${data.icon}"></i> [${data.skillName}:${data.apCost}] ${data.description}`;
    return a;
  }

  static findSkillByName(skillName) {
      const collection = CONFIG.Item.documentClass.collection;
      const skill = /^[a-zA-Z0-9]{16}$/.test(skillName) ? collection.get(skillName) : collection.getName(skillName);
      return skill;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  static activateListeners() {
    const body = $("body");
    body.on("click", "a.skill-challenge-link", this._onClickSkillChallengeLink);
  }

  /* -------------------------------------------- */

  /**
   * Handle click events on Entity Links
   * @param {Event} event
   * @private
   */
  static async _onClickSkillChallengeLink(event) {
      event.preventDefault();
      const  a = event.currentTarget;
      // let entity = game.items.get(a.dataset.id);

      const pcs = BhTextEditor._getPlayerCharacters();
      const pcData = BhTextEditor._buildPcData(a.dataset, pcs);
      let challenge = a.dataset;
      challenge.challengeId = randomID();

      const html = await renderTemplate("systems/bounty-hunter-ttrpg/template/chat/skill-challenge.html", {challenge: challenge, characters: pcData});
      const chatData = {
          user: game.user._id,
          rollMode: game.settings.get("core", "rollMode"),
          content: html,
      };
      ChatMessage.create(chatData, {});
  }
  
  static _getPlayerCharacters() {
    return game.actors.filter(a => a.hasPlayerOwner);
  }
  
  static _buildPcData(challenge, playerCharacters) {
    let data = {};
    let canSucceed;
    for (const char of playerCharacters) {
      canSucceed = char.items.getName(challenge.skillName) !== null;
      data[char.name] = {name: char.name, canSucceed: canSucceed, visible: char.owner};
    }
    return data;
  }
}
  
window.TextEditor = BhTextEditor;