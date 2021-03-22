import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterCargoSheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "item", "cargo"],
      template: "systems/bounty-hunter-ttrpg/template/cargo.html",
      tabs: [],
    });
  }
}
