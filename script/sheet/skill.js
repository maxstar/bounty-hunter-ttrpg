import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterSkillSheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/bounty-hunters-ttrpg/template/skill.html",
    });
  }
}
