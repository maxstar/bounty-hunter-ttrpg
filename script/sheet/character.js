import { BountyHunterActorSheet } from "./actor.js";
import { AddItemDialog } from "../dialog/add-item-dialog.js";
import { ReputationStats } from '../component/reputation-stats.js';
import { ApPerSkillDialog } from "../dialog/ap-per-skill-dialog.js";

export class BountyHunterCharacterSheet extends BountyHunterActorSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "actor"],
      template: "systems/bounty-hunter-ttrpg/template/character.html",
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
    this.computeAbilityData(data);
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.ability-delete').click(this.handleRemoveItem.bind(this));
    html.find('.add-ability').click(this.handleAddAbility.bind(this));
    html.find('.use-item').click(this.handleUseItem.bind(this));

    html.find('.skill-delete').click(this.handleRemoveItem.bind(this));
    html.find('.add-skill').click(this.handleAddSkill.bind(this));
    html.find('.use-skill').click(this.handleUseSkill.bind(this));
    html.find('.use-skill-hard').click(this.handleUseSkillHard.bind(this));

    html.find('.recover-ap-half').click(this.handleRecoverApHalf.bind(this));
    html.find('.recover-ap-all').click(this.handleRecoverApAll.bind(this));

    html.find('.recover-uses-scene').click(this.handleRecoverUsesScene.bind(this));
    html.find('.recover-uses-day').click(this.handleRecoverUsesDay.bind(this));

    html.find(".item-create").click(this.handleItemCreate.bind(this));
  }

  handleRecoverApHalf(e) {
    const half = Math.ceil(this.actor.data.data.bio.ap.max / 2);
    this.restoreAP(half);
  }

  handleRecoverApAll(e) {
    const max = this.actor.data.data.bio.ap.max;
    this.restoreAP(max);
  }

  handleRecoverUsesScene(e) {
    this.handleRecoverUses('scene');
  }

  handleRecoverUsesDay(e) {
    this.handleRecoverUses('day');
  }

  handleRecoverUses(refresh) {
    let updateData;
    this.actor.items.forEach(function(item) {
      if (item.data.data.refresh === refresh && item.data.data.uses !== undefined) {
        updateData = {
          'data.uses.value': item.data.data.uses.max,
        };
        item.update(updateData);
      }
    });
  }

  handleUseSkillHard(e) {
    const div = $(e.currentTarget).parents(".skill");
    const entityId = div.data("entity-id");
    let skill = this.actor.items.get(entityId);
    let that = this;

    ApPerSkillDialog.show(
      game.i18n.localize('BH.HOW_MANY'),
      Math.min(game.settings.get("bounty-hunter-ttrpg", "maxApPerSkill"), this.actor.data.data.bio.ap.value),
      function (ap) {
        that.reduceAP(ap);
        that.postSkillUse(skill.name, ap);
      }
    );
  }

  handleUseSkill(e) {
    const div = $(e.currentTarget).parents(".skill");
    const entityId = div.data("entity-id");
    let skill = this.actor.items.get(entityId);
    
    this.reduceAP(1);
    this.postSkillUse(skill.name, 1);
  }

  async handleUseItem(e) {
    const div = $(e.currentTarget).parents(".item");
    const entityId = div.data("entity-id");
    let item = this.actor.items.get(entityId);
    if (parseInt(item.data.data.uses.value) === 0) return;
    
    let promise = this.reduceItemUses(item);
    this.postItemUse(item.name, item.data.data['use-description']);

    await promise;
    item = this.actor.items.get(entityId);
    if (parseInt(item.data.data.uses.value) === 0 && item.data.data.refresh === 'never') {
      this.actor.deleteEmbeddedEntity("OwnedItem", entityId);
    }
  }

  postSkillUse(skillName, apSpent) {
    let chatData = {
      speaker: {actor: this.actor._id},
      // @todo localize
      content: `<span style="font-size: 16px;">Uses <b>${game.i18n.localize(skillName)}</b>!</span> <i style="font-size:10px">(${apSpent} AP spent)<i>`
    };
    ChatMessage.create(chatData, {});
  }

  postItemUse(abilityName, useDescription) {
    let chatData = {
      speaker: {actor: this.actor._id},
      // @todo localize
      content: `<span style="font-size: 16px;">Uses <b>${game.i18n.localize(abilityName)}</b> to ${useDescription}</span>`
    };
    ChatMessage.create(chatData, {});
  }

  reduceAP(amount) {
    const current = this.actor.data.data.bio.ap.value;
    const min = current > 0 ? 0 : -1;
    let updateData = {
      'data.bio.ap.value': Math.max(min, current - amount),
    };
    this.actor.update(updateData);
  }

  reduceItemUses(item) {
    const current = item.data.data.uses.value;
    let updateData = {
      'data.uses.value': Math.max(0, current - 1),
    };
    return item.update(updateData);
  }

  restoreAP(amount) {
    const current = this.actor.data.data.bio.ap.value;
    const max = this.actor.data.data.bio.ap.max;
    let updateData = {
      'data.bio.ap.value': Math.min(max, current + amount),
    };
    this.actor.update(updateData);
  }

  handleAddSkill() {
    let that = this;
    let d = AddItemDialog.show(
      "Skill Picker",
      this.categorizeItems().skill,
      'skill',
      function (skills) {
        that.actor.createEmbeddedEntity("OwnedItem", skills);
      }
    );
  }

  handleRemoveItem(e) {
    const div = $(e.currentTarget).parents(".item");
    const entityId = div.data("entity-id");

    this.actor.deleteEmbeddedEntity("OwnedItem", entityId);
  }

  handleAddAbility() {
    let that = this;
    let d = AddItemDialog.show(
      "Ability Picker",
      this.categorizeItems().ability,
      'ability',
      function (abilities) {
        that.actor.createEmbeddedEntity("OwnedItem", abilities);
      }
    );
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
    const carryingCapacity = game.settings.get("bounty-hunter-ttrpg", "baseCarryingCapacity") + (this.actor.overrides["CARRYING_CAPACITY"] ?? 0);
    data.data.encumbrance = {
      value: itemsCarried,
      max: carryingCapacity,
      over: itemsCarried > carryingCapacity,
    };
  }

  categorizeItems() {
    let itemsByCategory = {skill: {}, ability: {}, gear: {}, weapon: {}};

    this.actor.items.forEach((item) => {
      if (itemsByCategory[item.data.type] === undefined) {
        itemsByCategory[item.data.type] = {};
      }
      if (item.type === 'skill') {
        item.data.localizedDescr = "SKILL.DESCR." + item.name;
      }
      itemsByCategory[item.data.type][item.data.name] = item;
    });

    itemsByCategory.skill = this.sortItems(itemsByCategory.skill);
    itemsByCategory.ability = this.sortItems(itemsByCategory.ability);
    itemsByCategory.gear = this.sortItems(itemsByCategory.gear);
    itemsByCategory.weapon = this.sortItems(itemsByCategory.weapon);

    return itemsByCategory;
  }

  sortItems(items) {
    return Object.keys(items).sort().reduce(
      (obj, key) => { 
        obj[key] = items[key]; 
        return obj;
      }, 
      {}
    );
  }

  computeSkillData(data) {
    data.data.skillCount = Object.keys(data.data.itemsByCategory.skill).length;
    data.data.allowedSkillCount = ReputationStats.getForReputation(data.data.bio.reputation.value).skill + game.settings.get("bounty-hunter-ttrpg", "bonusSkills");
  }

  computeAbilityData(data) {
    data.data.abilityCount = Object.keys(data.data.itemsByCategory.ability).length;
    data.data.allowedAbilityCount = ReputationStats.getForReputation(data.data.bio.reputation.value).ability;
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

  handleItemCreate(event) {
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
