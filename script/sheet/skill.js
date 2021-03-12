import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterSkillSheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/bounty-hunter-ttrpg/template/skill.html",
      height: 200,
    });
  }
}
