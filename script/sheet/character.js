import { BountyHunterActorSheet } from "./actor.js";
import { AddItemDialog } from "../dialog/add-item-dialog.js";
import { ReputationStats } from '../component/reputation-stats.js';
import { ApPerSkillDialog } from "../dialog/ap-per-skill-dialog.js";
import { BountyHunterActor } from "../actor/bounty-hunter.js";
import { CharacterCreation } from "../component/character-creation.js";

export class BountyHunterCharacterSheet extends BountyHunterActorSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "actor"],
      template: "systems/bounty-hunter-ttrpg/template/character.html",
      width: 620,
      height: 740,
      resizable: false,
      scrollY: [
        ".armors .item-list .items",
        ".gears.item-list .items",
        ".skills .item-list .items",
        ".abilities .item-list .items",
        ".weapons .item-list .items",
      ],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
        },
      ],
    });
  }
  
  // ********** OVERRIDES *************

  getData() {
    const data = super.getData();
    data.data.user = game.user;
    data.data.data.itemsByCategory = this.categorizeItems();
    this.computeEncumbrance(data.data);
    this.computeSkillData(data.data);
    this.computeAbilityData(data.data);
    data.data.data.ammoCounts = this.getAmmoCounts(data.data);
    this.computeWeaponData(data.data);
    this.computeStarshipQualifications(data.data);
    data.data.displayWizard = Object.keys(data.data.itemsByCategory.skill).length === 0;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.ability-delete').click(this.handleRemoveItem.bind(this));
    html.find('.add-ability').click(this.handleAddAbility.bind(this));
    html.find('.use-item').click(this.handleUseItem.bind(this));
    html.find('.use-weapon').click(this.handleUseWeapon.bind(this));

    html.find('.skill-delete').click(this.handleRemoveItem.bind(this));
    html.find('.add-skill').click(this.handleAddSkill.bind(this));
    html.find('.use-skill').click(this.handleUseSkill.bind(this));
    html.find('.use-skill-hard').click(this.handleUseSkillHard.bind(this));

    html.find('.recover-ap-half').click(this.handleRecoverApHalf.bind(this));
    html.find('.recover-ap-all').click(this.handleRecoverApAll.bind(this));

    html.find('.recover-uses-scene').click(this.handleRecoverUsesScene.bind(this));
    html.find('.recover-uses-day').click(this.handleRecoverUsesDay.bind(this));

    html.find('.character-creation-wizard').click(this.handleCharacterCreation.bind(this));
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object} itemData     The item data requested for creation
   * @return {Promise<Actor>}
   * @private
   */
  async _onDropItemCreate(itemData) {
    if (itemData.type === 'skill') {
      let item;
      for (let id in this.actor.data.items) {
        item = this.actor.data.items[id];
        if (item.name === itemData.name && item.type === 'skill') {
          console.log("Actor already has skill " + item.name);
          return null;
        }
      }
    }
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }
  
  // ********** HANDLERS *************

  handleCharacterCreation() {
    const app = new (CONFIG.BountyHunter.characterCreationClass)(this.actor);
    app.render(true);
  }

  handleRecoverApHalf(e) {
    const half = Math.ceil(this.actor.data.data.bio.ap.max / 2);
    this.actor.restoreAP(half);
  }

  handleRecoverApAll(e) {
    const max = this.actor.data.data.bio.ap.max;
    this.actor.restoreAP(max);
  }

  handleRecoverUsesScene(e) {
    this.handleRecoverUses('scene');
  }

  handleRecoverUsesDay(e) {
    this.handleRecoverUses('day');
  }

  handleRecoverUses(refresh) {
    let updateData;
    this.actor.items.forEach(function(item) {
      if (item.data.data.refresh === refresh && item.data.data.uses !== undefined) {
        updateData = {
          'data.uses.value': item.data.data.uses.max,
        };
        item.update(updateData);
      }
    });
  }

  handleUseSkillHard(e) {
    const div = $(e.currentTarget).parents(".skill");
    const entityId = div.data("entity-id");
    let skill = this.actor.items.get(entityId);
    let that = this;

    ApPerSkillDialog.show(
      game.i18n.localize('BH.HOW_MANY'),
      Math.min(game.settings.get("bounty-hunter-ttrpg", "maxApPerSkill"), this.actor.data.data.bio.ap.value),
      function (ap) {
        that.actor.reduceAP(ap);
        that._postSkillUse(skill.name, ap);
      }
    );
  }

  handleUseSkill(e) {
    const div = $(e.currentTarget).parents(".skill");
    const entityId = div.data("entity-id");
    let skill = this.actor.items.get(entityId);
    let that = this;

    const defaultBehaviour = game.settings.get("bounty-hunter-ttrpg", "shiftClickMoreAp");
    const doUseSkill = function (ap) {
      that.actor.reduceAP(ap);
      that._postSkillUse(skill.name, ap);
    }

    if (e.shiftKey && defaultBehaviour || !e.shiftKey && !defaultBehaviour) {
      ApPerSkillDialog.show(
        game.i18n.localize('BH.HOW_MANY'),
        Math.min(game.settings.get("bounty-hunter-ttrpg", "maxApPerSkill"), this.actor.data.data.bio.ap.value),
        doUseSkill
      );
    } else {
      doUseSkill(1);
    }
  }

  async handleUseItem(e) {
    const div = $(e.currentTarget).parents(".item");
    const entityId = div.data("entity-id");
    let item = this.actor.items.get(entityId);
    if (parseInt(item.data.data.uses.value) === 0) return;
    
    this._reduceItemUses(item);
    this._postItemUse(item);
  }

  async handleUseWeapon(e) {
    const div = $(e.currentTarget).parents(".item");
    const entityId = div.data("entity-id");
    let item = this.actor.items.get(entityId);
    let that = this;

    const defaultBehaviour = game.settings.get("bounty-hunter-ttrpg", "shiftClickMoreAp");
    const doUseWeapon = async function (ap) {
      const ammoHasBeenSpent = await that._spendAmmo(item);
      if (ammoHasBeenSpent) {
        that.actor.reduceAP(ap);
      }
      that._postWeaponUse(item, ammoHasBeenSpent, ap);
    }
    
    if (e.shiftKey && defaultBehaviour || !e.shiftKey && !defaultBehaviour) {
      ApPerSkillDialog.show(
        game.i18n.localize('BH.HOW_MANY'),
        Math.min(game.settings.get("bounty-hunter-ttrpg", "maxApPerSkill"), this.actor.data.data.bio.ap.value),
        doUseWeapon
      );
      return;
    }

    await doUseWeapon(1);
  }

  handleAddSkill() {
    let that = this;
    let d = AddItemDialog.show(
      "Skill Picker",
      this.categorizeItems().skill,
      'skill',
      function (skills) {
        that.actor.createEmbeddedDocuments("Item", skills);
      }
    );
  }

  handleRemoveItem(e) {
    const div = $(e.currentTarget).parents(".item");
    const entityId = div.data("entity-id");

    this.actor.deleteEmbeddedDocuments("Item", [entityId]);
  }

  handleAddAbility() {
    let that = this;
    let d = AddItemDialog.show(
      "Ability Picker",
      this.categorizeItems().ability,
      'ability',
      function (abilities) {
        that.actor.createEmbeddedDocuments("Item", abilities);
      }
    );
  }
  
  // ********** PREPARE DATA *************

  computeEncumbrance(data) {
    let itemsCarried = 0;
    for (let item of Object.values(data.items)) {
      itemsCarried += this._computerItemEncumbrance(item);
    }
    data.data.encumbrance = {
      value: itemsCarried,
      max: this.actor.data.carryingCapacity,
      over: itemsCarried > this.actor.data.carryingCapacity,
    };
  }

  computeSkillData(data) {
    data.data.skillCount = Object.keys(data.data.itemsByCategory.skill).length;
    data.data.allowedSkillCount = ReputationStats.getForReputation(data.data.bio.reputation.value ?? 1).skill + game.settings.get("bounty-hunter-ttrpg", "bonusSkills");
  }

  computeAbilityData(data) {
    data.data.abilityCount = Object.keys(data.data.itemsByCategory.ability).length;
    data.data.allowedAbilityCount = ReputationStats.getForReputation(data.data.bio.reputation.value ?? 1).ability;
  }

  getAmmoCounts(data) {
    if (data.data.itemsByCategory.gear.Ammo === undefined) return {};

    let ammoCounts = {};
    for (const [key, ammo] of Object.entries(data.data.itemsByCategory.gear.Ammo)) {
      if (ammoCounts[ammo.name] === undefined) ammoCounts[ammo.name] = 0;
      ammoCounts[ammo.name] += ammo.data.data.uses.value;
    }
    return ammoCounts;
  }

  computeWeaponData(data) {
    let newData;
    const weapons = Object.keys(data.data.itemsByCategory.weapon).reduce(
      (retVal, id) => {
        newData = data.data.itemsByCategory.weapon[id];
        newData.data.data.ammoCount = newData.data.data.ammo === '' 
          ? false 
          : (data.data.ammoCounts[newData.data.data.ammo] ?? 0);
        // special case for grenades - they use themselves as ammo
        if (newData.data.data.ammo === newData.name) {
          newData.data.data.ammoCount = newData.data.data.uses.value;
        }

        // check that actor has the necessary skill to use the weapon
        newData.data.data.canUse = newData.data.data.skill === '' 
          ? true 
          : (data.data.itemsByCategory.skill[newData.data.data.skill] !== undefined);

        newData.data.data.modifiedDamage = newData.data.data.damage + this._getWeaponBonusDamage(newData.data.data.skill);

        retVal[id] = newData;
        return retVal;
      },
      {}
    );

    data.data.itemsByCategory.weapon = weapons;
  }

  computeStarshipQualifications(data) {
    let qualifications = JSON.parse(JSON.stringify(CONFIG.BountyHunter['starship-roles'])); // deep clone
    let canDoCount, canDo, missingSkills;
    for (let [keyRole, role] of Object.entries(qualifications)) {
      canDoCount = 0;
      missingSkills = [];
      for (const [keyFunc, func] of Object.entries(role.functions)) {
        for(const skills of func.skill) {
          if (Array.isArray(skills)) { // skill chain
            canDo = true;
            for(const skill of skills) {
              if (data.data.itemsByCategory.skill[skill] === undefined) {
                canDo = false;
                missingSkills.push(skill);
              }
            }
            if (canDo) canDoCount++;
          } else { // single skill
            if (data.data.itemsByCategory.skill[skills] !== undefined) {
              canDoCount++;
              break;
            } else {
              missingSkills.push(skills);
            }
          }
        }
      }

      role.canDoFunctions = canDoCount;
      role.totalFunctions = Object.keys(role.functions).length;
      role.missingSkills = missingSkills;
    }

    data.data.qualifications = qualifications;
  }
  
  // ********** HELPERS *************

  _getWeaponBonusDamage(skillName) {
    let skillCode = skillName.replace(/[\W_]+/g, "");
    if (skillCode === '') skillCode = 'noSkill';

    return this.actor.data.bonusDamage[skillCode] ?? 0;
  }

  _computerItemEncumbrance(data) {
    switch (data.type) {
      case "armor":
      case "gear":
      case "weapon":
        return parseInt(data.data.encumbrance);
      default:
        return 0;
    }
  }

  async _postSkillUse(skillName, apSpent) {
    let chatCard = await renderTemplate(
      'systems/bounty-hunter-ttrpg/template/chat/skill-use.html', 
      {skillName: skillName, apSpent: apSpent}
    );
    let chatData = {
      speaker: {actor: this.actor.id},
      // @todo localize
      content: chatCard
    };
    ChatMessage.create(chatData, {});
  }

  async _postItemUse(item) {
    let titleMap = {
      ability: 'BH.CHAT.ABILITY_USE',
      gear: 'BH.CHAT.GEAR_USE',
    }
    let chatCard = await renderTemplate(
      'systems/bounty-hunter-ttrpg/template/chat/item-use.html', 
      {title: game.i18n.localize(titleMap[item.type]), itemName: item.name, description: item.data.data['use-description']}
    );
    let chatData = {
      speaker: {actor: this.actor.id},
      // @todo localize
      content: chatCard
    };
    ChatMessage.create(chatData, {});
  }

  async _postWeaponUse(weapon, success, apSpent) {
    let chatCard = await renderTemplate(
      'systems/bounty-hunter-ttrpg/template/chat/weapon-use.html', 
      {
        itemName: weapon.name, 
        description: weapon.data.data['use-description'], 
        skillName: weapon.data.data.skill || false,
        apSpent: success ? apSpent : 0,
        ammoName: weapon.data.data.ammo,
        success: success,
        damage: weapon.data.data.damage + this._getWeaponBonusDamage(weapon.data.data.skill),
        range: weapon.data.data.range,
      }
    );
    let chatData = {
      speaker: {actor: this.actor.id},
      content: chatCard,
    };
    ChatMessage.create(chatData, {});
  }

  async _reduceItemUses(item) {
    let success = true;
    const current = item.data.data.uses.value;
    if (current === 0) success = false;
    else {
      let updateData = {
        'data.uses.value': Math.max(0, current - 1),
      };
      await item.update(updateData);
    } 

    item = this.actor.items.get(item.id);
    if (parseInt(item.data.data.uses.value) === 0 && item.data.data.refresh === 'never') {
      this.actor.deleteEmbeddedDocuments("Item", [item.id]);
    }

    return success;
  }

  async _spendAmmo(weapon) {
    if (weapon.data.data.ammo === '') return true;

    let ammo = this.actor.items.getName(weapon.data.data.ammo);
    if (!ammo) return false;

    return this._reduceItemUses(ammo);
  }
}

Hooks.on('preUpdateActor', async (entity, updateData, options, userId) => {
  if (!(entity instanceof BountyHunterActor)) return true;
  
  if ( updateData.data?.bio?.reputation?.value ) {
    let stats = ReputationStats.getForReputation(updateData.data.bio.reputation.value);
    if (stats !== false && entity.data.data.bio.ap.max !== stats.ap) {
      if (updateData.data.bio.ap === undefined) updateData.data.bio.ap = {max: stats.ap};
      else updateData.data.bio.ap.max = stats.ap;
    }
  }

  return true;
});

Hooks.on('createActor', async (entity, options, userId) => {
  if (!(entity instanceof BountyHunterActor) || entity.data.type !== 'character') return true;
  
  const punchingAttack = game.items.getName("Punching Attack");
  if (!punchingAttack) return true;

  entity.createEmbeddedDocuments("Item", [punchingAttack.data]);

  return true;
});

Hooks.on('preCreateOwnedItem', async (entity, data, options, userId) => {
  if (!(entity instanceof BountyHunterActor) || data.type !== 'skill' || data.name !== 'Martial Arts') return true;
  
  const martialArtsAttack = game.items.getName("Martial Arts Attack");
  if (!martialArtsAttack) return true;

  entity.createEmbeddedDocuments("Item", [martialArtsAttack.data]);

  return true;
});

Hooks.on('preDeleteOwnedItem', async (entity, data, options, userId) => {
  if (!(entity instanceof BountyHunterActor) || data.type !== 'skill' || data.name !== 'Martial Arts') return true;
  
  const martialArtsAttack = entity.items.getName("Martial Arts Attack");
  if (!martialArtsAttack || martialArtsAttack.data.type !== 'weapon') return true;

  entity.deleteEmbeddedDocuments("Item", [martialArtsAttack._id]);

  return true;
});
