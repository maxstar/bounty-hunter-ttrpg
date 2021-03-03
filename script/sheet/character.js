import { BountyHunterActorSheet } from "./actor.js";
import { AddSkillDialog } from "../dialog/add-skill-dialog.js";

export class BountyHunterCharacterSheet extends BountyHunterActorSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "actor"],
      template: "systems/bounty-hunters-ttrpg/template/character.html",
      width: 620,
      height: 740,
      resizable: false,
      scrollY: [
        ".armors .item-list .items",
        ".gears.item-list .items",
        ".skills .item-list .items",
        ".abilities .item-list .items",
        ".weapons .item-list .items",
      ],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
        },
      ],
    });
  }

  getData() {
    const data = super.getData();
    this.computeItems(data);
    data.data.itemsByCategory = this.categorizeItems();
    this.computeEncumbrance(data);
    this.computeSkillData(data);
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.skill-delete').click(this.handleRemoveSkill.bind(this));
    html.find('.add-skill').click(this.handleAddSkill.bind(this));
    html.find('.use-skill').click(this.handleUseSkill.bind(this));
    html.find(".item-create").click((ev) => {
      this.onItemCreate(ev);
    });
  }

  handleUseSkill() {

  }

  handleAddSkill() {
    let that = this;
    let d = AddSkillDialog.show(
      "Skill Picker",
      this.categorizeItems().skill,
      function (skills) {
        that.actor.createEmbeddedEntity("OwnedItem", skills);
      }
    );
  }

  handleRemoveSkill(e) {
    const div = $(e.currentTarget).parents(".skill");
    const entityId = div.data("entity-id");

    this.actor.deleteEmbeddedEntity("OwnedItem", entityId);
  }

  computeItems(data) {
    for (let item of Object.values(data.items)) {
      item.isWeapon = item.type === "weapon";
      item.isArmor = item.type === "armor";
      item.isGear = item.type === "gear";
      item.isSkill = item.type === "skill";
      item.isAbility = item.type === "ability";
      item.isComponent = item.type === "component";
      item.isCargo = item.type === "cargo";
    }
  }

  _computerItemEncumbrance(data) {
    switch (data.type) {
      case "armor":
      case "gear":
      case "weapon":
        return 1;
      default:
        return 0;
    }
  }

  computeEncumbrance(data) {
    let itemsCarried = 0;
    for (let item of Object.values(data.items)) {
      itemsCarried += this._computerItemEncumbrance(item);
    }
    const carryingCapacity = game.settings.get("bounty-hunters-ttrpg", "baseCarryingCapacity") + this.getModifier("CARRYING_CAPACITY");
    data.data.encumbrance = {
      value: itemsCarried,
      max: carryingCapacity,
      over: itemsCarried > carryingCapacity,
    };
  }

  categorizeItems() {
    let itemsByCategory = {};

    this.actor.items.forEach((item) => {
      if (itemsByCategory[item.data.type] === undefined) {
        itemsByCategory[item.data.type] = {};
      }
      if (item.type === 'skill') {
        item.data.localizedDescr = "SKILL.DESCR." + item.name;
      }
      itemsByCategory[item.data.type][item.data.name] = item;
    });

    itemsByCategory.skill = this.sortSkills(itemsByCategory.skill);

    return itemsByCategory;
  }

  sortSkills(skills) {
    return Object.keys(skills).sort().reduce(
      (obj, key) => { 
        obj[key] = skills[key]; 
        return obj;
      }, 
      {}
    );
  }

  computeSkillData(data) {
    data.data.skillCount = Object.keys(data.data.itemsByCategory.skill).length;
    data.data.allowedSkillCount = this.getBaseSkillCount(data.data.bio.reputation.value) + game.settings.get("bounty-hunters-ttrpg", "bonusSkills");
  }

  getBaseSkillCount(reputation) {
    let result = 0;
    for (const [repLevel, data] of Object.entries(CONFIG.BountyHunter.reputation)) {
      if (repLevel > reputation) {
        break;
      }
      result += data.skill;
    }
    return result;
  }

  getModifier(modifierName) {
    let modifier = 0;

    this.actor.items.forEach((item) => {
      if (item.data.data.modifiers === undefined) {
        return;
      }
      if (item.data.data.modifiers[modifierName] === undefined) {
        return;
      }
      modifier += item.data.data.modifiers[modifierName];
    });

    return modifier;
  }

  hasAbility(abilityName) {
    if (this.itemCache === {}) {
      this.buildItemCache();
    }

    return this.itemCache["ability"][abilityName] !== undefined;
  }

  hasSkill(skillName) {
    if (this.itemCache === {}) {
      this.buildItemCache();
    }

    return this.itemCache["skill"][skillName] !== undefined;
  }

  onItemCreate(event) {
    event.preventDefault();
    let header = event.currentTarget;
    let data = duplicate(header.dataset);
    data["name"] = `New ${data.type.capitalize()}`;
    this.actor.createEmbeddedEntity("OwnedItem", data, { renderSheet: true });
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object} itemData     The item data requested for creation
   * @return {Promise<Actor>}
   * @private
   */
  async _onDropItemCreate(itemData) {
    if (itemData.type === 'skill') {
      let item;
      for (let id in this.actor.data.items) {
        item = this.actor.data.items[id];
        if (item.name === itemData.name && item.type === 'skill') {
          console.log("Actor already has skill " + item.name);
          return null;
        }
      }
    }
    return this.actor.createEmbeddedEntity("OwnedItem", itemData);
  }
}
