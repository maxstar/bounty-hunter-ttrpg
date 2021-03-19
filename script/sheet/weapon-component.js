import { BountyHunterComponentSheet } from "./component.js";

export class BountyHunterWeaponComponentSheet extends BountyHunterComponentSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/bounty-hunter-ttrpg/template/weapon-component.html",
      classes: ["bounty-hunter", "sheet", 'item', 'component', "weapon-component"],
      tabs: [],
    });
  }
}
