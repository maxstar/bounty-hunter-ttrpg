import { BountyHunterActorSheet } from "./actor.js";

export class BountyHunterCharacterSheet extends BountyHunterActorSheet {

  itemCache = {};

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
    this.categorizeItems(data);
    this.computeEncumbrance(data);
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-create").click((ev) => {
      this.onItemCreate(ev);
    });
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
    const carryingCapacity = game.settings.get("bounty-hunter-ttrpg", "baseCarryingCapacity") + this.getModifier("CARRYING_CAPACITY");
    data.data.encumbrance = {
      value: itemsCarried,
      max: carryingCapacity,
      over: itemsCarried > carryingCapacity,
    };
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

  categorizeItems(data) {
    let itemsByCategory = {};

    this.actor.items.forEach((item) => {
      if (itemsByCategory[item.data.type] === undefined) {
        itemsByCategory[item.data.type] = {};
      }
      itemsByCategory[item.data.type][item.data.name] = item;
    });

    data.data.itemsByCategory = itemsByCategory;
  }

  onItemCreate(event) {
    event.preventDefault();
    let header = event.currentTarget;
    let data = duplicate(header.dataset);
    data["name"] = `New ${data.type.capitalize()}`;
    this.actor.createEmbeddedEntity("OwnedItem", data, { renderSheet: true });
  }
}
