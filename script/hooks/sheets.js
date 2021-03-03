import { BountyHunterCharacterSheet } from "../sheet/character.js";
import { BountyHunterStarshipSheet } from "../sheet/starship.js";
import { BountyHunterWeaponSheet } from "../sheet/weapon.js";
import { BountyHunterArmorSheet } from "../sheet/armor.js";
import { BountyHunterGearSheet } from "../sheet/gear.js";
import { BountyHunterSkillSheet } from "../sheet/skill.js";
import { BountyHunterAbilitySheet } from "../sheet/ability.js";
import { BountyHunterComponentSheet } from "../sheet/component.js";
import { BountyHunterCargoSheet } from "../sheet/cargo.js";

export function registerSheets() {
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("bounty-hunters-ttrpg", BountyHunterCharacterSheet, { types: ["character"], makeDefault: true });
  Actors.registerSheet("bounty-hunters-ttrpg", BountyHunterStarshipSheet, { types: ["starship"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("bounty-hunters-ttrpg", BountyHunterWeaponSheet, { types: ["weapon"], makeDefault: true });
  Items.registerSheet("bounty-hunters-ttrpg", BountyHunterArmorSheet, { types: ["armor"], makeDefault: true });
  Items.registerSheet("bounty-hunters-ttrpg", BountyHunterGearSheet, { types: ["gear"], makeDefault: true });
  Items.registerSheet("bounty-hunters-ttrpg", BountyHunterSkillSheet, { types: ["skill"], makeDefault: true });
  Items.registerSheet("bounty-hunters-ttrpg", BountyHunterAbilitySheet, { types: ["ability"], makeDefault: true });
  Items.registerSheet("bounty-hunters-ttrpg", BountyHunterComponentSheet, { types: ["component"], makeDefault: true });
  Items.registerSheet("bounty-hunters-ttrpg", BountyHunterCargoSheet, { types: ["cargo"], makeDefault: true });
}
