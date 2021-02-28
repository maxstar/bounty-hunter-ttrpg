import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterCargoSheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/bounty-hunter-ttrpg/template/cargo.html",
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
