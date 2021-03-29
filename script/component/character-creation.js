

class CharacterCreation extends Application {
  
  constructor(character, options = {}) {
    super(options);

    if (!(character instanceof BountyHunterActor) || character.type !== 'character') {
      throw 'You must pass a valid character entity to CharacterCreation';
    }
    this.character = character;
    this.model = null;

    this.dataset = CONFIG.BountyHunter['character-creation'];

    this.customEntry = {
      key: 'custom',
      name: 'BH.CUSTOM',
      description: '',
      skills: [],
      languages: [],
    };
  }

  get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "actor"],
      template: "system/bounty-hunter-ttrpg/template/character-creation.html",
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
      data.dataset.species.options = data.dataset.species;
      data.dataset.species.selected = this.dataset.species[this.model.species] ?? this.customEntry;

      data.dataset.birthright.options = data.dataset.birthright;
      data.dataset.birthright.selected = this.dataset.birthright[this.model.birthright] ?? this.customEntry;

      data.dataset.education.options = data.dataset.education;
      data.dataset.education.selected = this.dataset.education[this.model.education] ?? this.customEntry;

      data.dataset.career.options = data.dataset.career;
      data.dataset.career.selected = this.dataset.career[this.model.career] ?? this.customEntry;

      data.dataset.reason.options = data.dataset.reason;
      data.dataset.reason.selected = this.dataset.reason[this.model.reason] ?? this.customEntry;

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
    this.model[event.currentTarget.dataset.category] = $(event.currentTarget).val();
    this.render(true);

    return false;
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