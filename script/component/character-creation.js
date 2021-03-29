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
    // data.model.species = this.dataset.species[this.model.species] ?? this.customEntry;
    // data.model.birthright = this.dataset.birthright[this.model.birthright] ?? this.customEntry;
    // data.model.education = this.dataset.education[this.model.education] ?? this.customEntry;
    // data.model.career = this.dataset.career[this.model.career] ?? this.customEntry;
    // data.model.reason = this.dataset.reason[this.model.reason] ?? this.customEntry;

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

      // html.find('.chargen-select-species').change(this.handleInputSpecies.bind(this));
      // html.find('.chargen-select-birthright').change(this.handleInputBirthright.bind(this));
      // html.find('.chargen-select-education').change(this.handleInputEducation.bind(this));
      // html.find('.chargen-select-career').change(this.handleInputCareer.bind(this));
      // html.find('.chargen-select-reason').change(this.handleInputReason.bind(this));
  }

  // *************** HANDLERS ******************

  handleInput(event) {
    this.model[event.currentTarget.dataset.section] = $(event.currentTarget).val();
    this.render(true);

    return false;
  }

  handleConfirm(event) {
    let updateData = {}, languages = ['Galactic'], section;

    for (let [sectionKey, sectionValue] of Object.entries(this.model)) {
      if (sectionValue === 'custom') continue;

      section = this.dataset[sectionKey][sectionValue];
      // add skills
      
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

      // fill bio fields
      updateData[`data.bio.${sectionKey}.value`] = game.i18n.localize(section.name);
      if (sectionKey !== 'species') {
        updateData[`data.bio.${sectionKey}.value`] += ' - ' + game.i18n.localize(section.description)
      }
    }
    // note languages
    updateData['data.bio.other.value'] = game.i18n.localize('HEADER.LANGUAGES') + ': ' + languages.join(', ');

    this.character.update(updateData);

    this.close();
  }

  // *************** HELPERS ******************

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