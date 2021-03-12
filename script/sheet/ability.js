import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterAbilitySheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/bounty-hunter-ttrpg/template/ability.html",
      height: 200,
    });
  }
}
