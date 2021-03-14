import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterGearSheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "item", "gear"],
      template: "systems/bounty-hunter-ttrpg/template/gear.html",
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
        },
      ],
    });
  }
}
