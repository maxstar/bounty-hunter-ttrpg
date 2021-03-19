import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterComponentSheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/bounty-hunter-ttrpg/template/component.html",
      classes: ["bounty-hunter", "sheet", 'item', "component"],
      tabs: [],
    });
  }
}
