import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterWeaponSheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "item", "weapon"],
      template: "systems/bounty-hunter-ttrpg/template/weapon.html",
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
    data.skills = this._collectAllItems('skill');
    return data;
  }

  _collectAllItems(type) {
      let items = {};
      for (let item of game.items) {
          if (item.type !== type) continue;

          items[item.name] = item;
      }

      return items;
  }
}
