import { BountyHunterActor } from "../actor/bounty-hunter.js";


export class CharacterCreation extends Application {
  
  constructor(character, options = {}) {
    super(options);

    if (!(character instanceof BountyHunterActor) || character.data.type !== 'character') {
      throw 'You must pass a valid character entity to CharacterCreation';
    }

    this.character = character;
    this.model = null;

    this.dataset = CONFIG.BountyHunter['character-creation'];

    this.customEntry = {
      key: 'custom',
      name: 'BH.CUSTOM',
      description: '',
      skills: [[]],
      languages: [],
    };
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "actor"],
      template: "systems/bounty-hunter-ttrpg/template/component/character-creation.html",
      title: game.i18n.localize("BH.CHARGEN.TITLE"),
      width: 700,
      height: 840,
      resizable: false,
    });
  }

  getData() {
    const data = super.getData();
    if (this.model === null) {
        this.model = this._getBlankModel();
    }

    data.dataset = duplicate(this.dataset);
    data.model = this.model;

    Object.keys(data.dataset).map(
      (sectionKey) => {
        data.dataset[sectionKey] = {
          title: `BIO.${sectionKey.toUpperCase()}`,
          options: data.dataset[sectionKey],
          selected: this.dataset[sectionKey][this.model[sectionKey]] ?? this.customEntry,
        };
      }
    );

    return data;
  }

  activateListeners(html) {
      super.activateListeners(html);

      // html.find('.chargen-randomize-all').click(this.handleRandomizeAll.bind(this));
      html.find('.chargen-confirm').click(this.handleConfirm.bind(this));

      // html.find('.chargen-roll-species').click(this.handleRollSpecies.bind(this));
      // html.find('.chargen-roll-birthright').click(this.handleRollBirthright.bind(this));
      // html.find('.chargen-roll-education').click(this.handleRollEducation.bind(this));
      // html.find('.chargen-roll-career').click(this.handleRollCareer.bind(this));
      // html.find('.chargen-roll-reason').click(this.handleRollReason.bind(this));

      html.find('.chargen-select').change(this.handleInput.bind(this));
  }

  // *************** HANDLERS ******************

  handleInput(event) {
    this.model[event.currentTarget.dataset.section] = $(event.currentTarget).val();
    this.render(true);

    return false;
  }

  handleConfirm(event) {
    let updateData = {}, languages = ['Galactic'], section, skills = [], other = [];

    for (let [sectionKey, sectionValue] of Object.entries(this.model)) {
      if (sectionValue === 'custom') continue;

      section = this.dataset[sectionKey][sectionValue];

      if (section.skills.length > 0) {
        skills = skills.concat(section.skills[0]);
      }
      languages = this._handleLanguages(section, languages);
      updateData = Object.assign(updateData, this._handleBio(sectionKey, section));

      if (section.other !== undefined && section.other.length > 0) {
        other = other.concat(section.other[0]);
      }
    }

    // note languages
    updateData['data.bio.other.value'] = game.i18n.localize('HEADER.LANGUAGES') + ': ' + languages.join(', ');
    if (other.length > 0) {
      updateData['data.bio.other.value'] += "\n" + other.join("\n");
    }

    this.character.update(updateData);

    // add skills
    this._addSkills(skills);

    this.close();
  }

  // *************** HELPERS ******************

  _addSkills(skillNames) {
    let items = [], item;
    skillNames =  [...new Set(skillNames)]; // remove duplicates
    for (const skillName of skillNames) {
      item = game.items.getName(skillName);
      if (item) {
        items.push(item.data);
      } else {
        const msg = `Couldn't find skill "${skillName}"`;
        console.warn(msg);
        ui.notifications.warn(msg);
      }
    }
    this.character.createEmbeddedDocuments("Item", items);
  }

  _handleLanguages(section, languages) {
    if (section.languages.length > 0) {
      languages.push(
        section.languages.reduce(
          (retVal, langSet) => { 
            retVal.push(langSet.join(', '));
            return retVal;
          }, 
          []
        ).join(' or ')
      );
    }

    return languages;
  }

  _handleBio(sectionKey, section) {
    let updateData = {};

    updateData[`data.bio.${sectionKey}.value`] = game.i18n.localize(section.name);
    if (sectionKey !== 'species') {
      updateData[`data.bio.${sectionKey}.value`] += ' - ' + game.i18n.localize(section.description)
    }

    return updateData;
  }

  _getBlankModel() {
    return {
      species: 'custom',
      birthright: 'custom',
      education: 'custom',
      career: 'custom',
      reason: 'custom',
    };
  }
}