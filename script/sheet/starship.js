import { BountyHunterActorSheet } from "./actor.js";

export class BountyHunterStarshipSheet extends BountyHunterActorSheet {

  itemCache = {};

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "actor"],
      template: "systems/bounty-hunters-ttrpg/template/starship.html",
      width: 620,
      height: 740,
      resizable: false,
      scrollY: [
        ".components .item-list .items",
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

  onItemCreate(event) {
    event.preventDefault();
    let header = event.currentTarget;
    let data = duplicate(header.dataset);
    data["name"] = `New ${data.type.capitalize()}`;
    this.actor.createEmbeddedEntity("OwnedItem", data, { renderSheet: true });
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    if (this.actor.owner) {
      buttons = [
        {
          label: game.i18n.localize("SHEET.HEADER.ROLL"),
          class: "custom-roll",
          icon: "fas fa-dice",
          onclick: (ev) => RollDialog.prepareRollDialog("DICE.ROLL", 0, 0, 0, "", 0, 0, this.diceRoller),
        },
        {
          label: game.i18n.localize("SHEET.HEADER.PUSH"),
          class: "push-roll",
          icon: "fas fa-skull",
          onclick: (ev) => this.diceRoller.push(),
        },
      ].concat(buttons);
    }

    return buttons;
  }
}
