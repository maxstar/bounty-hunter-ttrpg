import { BountyHunterCharacterSheet } from "../sheet/character.js";
import { BountyHunterStarshipSheet } from "../sheet/starship.js";
import { BountyHunterWeaponSheet } from "../sheet/weapon.js";
import { BountyHunterGearSheet } from "../sheet/gear.js";
import { BountyHunterSkillSheet } from "../sheet/skill.js";
import { BountyHunterAbilitySheet } from "../sheet/ability.js";
import { BountyHunterComponentSheet } from "../sheet/component.js";
import { BountyHunterCargoSheet } from "../sheet/cargo.js";

export function registerSheets() {
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("bounty-hunter-ttrpg", BountyHunterCharacterSheet, { types: ["character"], makeDefault: true });
  Actors.registerSheet("bounty-hunter-ttrpg", BountyHunterStarshipSheet, { types: ["starship"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("bounty-hunter-ttrpg", BountyHunterWeaponSheet, { types: ["weapon"], makeDefault: true });
  Items.registerSheet("bounty-hunter-ttrpg", BountyHunterGearSheet, { types: ["gear"], makeDefault: true });
  Items.registerSheet("bounty-hunter-ttrpg", BountyHunterSkillSheet, { types: ["skill"], makeDefault: true });
  Items.registerSheet("bounty-hunter-ttrpg", BountyHunterAbilitySheet, { types: ["ability"], makeDefault: true });
  Items.registerSheet("bounty-hunter-ttrpg", BountyHunterComponentSheet, { types: ["component"], makeDefault: true });
  Items.registerSheet("bounty-hunter-ttrpg", BountyHunterCargoSheet, { types: ["cargo"], makeDefault: true });
}
