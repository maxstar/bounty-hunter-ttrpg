import { StarshipHandler } from "../component/starship-handler.js";
import { BountyHunterActorSheet } from "./actor.js";

export class BountyHunterStarshipSheet extends BountyHunterActorSheet {
  constructor(...args) {
    super(...args);

    /**
     * Class that handles character interaction with a starship
     * @type {StarshipHandler}
     */
    this.starshipHandler = new (CONFIG.BountyHunter.starshipHandlerClass)();
  }

  static get defaultOptions() {
    let dragDrop = [...super.defaultOptions.dragDrop];
    dragDrop.push({ dragSelector: '.crew-member', dropSelector: '.crew-member-list' });
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "actor"],
      template: "systems/bounty-hunter-ttrpg/template/starship.html",
      width: 750,
      height: 840,
      resizable: false,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
      dragDrop: dragDrop,
    });
  }
  
  // ********** OVERRIDES *************

  getData() {
    const data = super.getData();

    data.user = game.user;
    data.starshipRoles = this.getStarshipRoles();
    data.starshipWeapons = this.prepareStarshipWeapons(data);
    data.crewMembers = this.prepareCrewMembers(data);
    this.prepareStarshipControlData(data);
    data.cargoWeight = this.computeCargo(data);
    data.crewCost = this.computeCrewCost();
    data.starshipComponents = this.prepareComponents();
    if (data.starshipRoles.gunner) delete data.starshipRoles.gunner;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.crew-delete').click(this.handleRemoveCrewMember.bind(this));
    html.find('.reset').click(ev => {
      this.assignCrewMembersToRole(this.getCrewMembers(), 'other');
      this.render(true);
    });

    html.find('.starship-action').click(this.handleStarshipActionUsage.bind(this));
  }

  _onDragStart(event) {
    if (event.currentTarget.dataset.itemId !== undefined) {
      super._onDragStart(event);
      return;
    }

    let entityId = event.currentTarget.dataset.entityId;
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "Actor",
        action: "assign",
        id: entityId,
      })
    );
  }

  async _onDrop(event) {
    super._onDrop(event);

    const json = event.dataTransfer.getData('text/plain');
    if (!json) return;

    let draggedItem = JSON.parse(json);
    if (draggedItem.type !== 'Actor') return;

    const actor = game.actors.get(draggedItem.id);
    if (actor.data.type !== 'character') return;

    if (draggedItem.action === 'assign') {
      this.handleStarshipRoleAssignment(event, actor);
    } else {
      this.handleAddToStarshipCrew(actor);
    }
    this.render(true);
  }
  
  // ********** HANDLERS *************

  handleItemDelete(event) {
    const div = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(div.data("entity-id"));
    if (!['weapon-component', 'component'].includes(item.type) 
      || confirm('Are you sure you want to remove this component?')
    ) {
      this.actor.deleteOwnedItem(item.data._id);
      div.slideUp(200, () => this.render(false));
    }
  }

  handleStarshipActionUsage(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const starshipRoleKey = btn.closest(".starship-role").dataset.starshipRole;
    const roleKey = starshipRoleKey.includes('gunner') ? 'gunner' : starshipRoleKey; // special case for weapon roles
    let assignedPartyMembers = this._getOwnedCharacters(this.actor.data.flags.starship[starshipRoleKey]);
    let action = CONFIG.BountyHunter['starship-roles'][roleKey].functions[btn.dataset.action];

    if (assignedPartyMembers.length === 1) {
      this.starshipHandler.doAction(this.actor, assignedPartyMembers[0], action);
    } else if (assignedPartyMembers.length > 1) {
      ui.notifications.error(game.i18n.localize('BH.NOTIFICATION.MULTIPLE_CREW_PER_ROLE_NOT_SUPPORTED'));
    }

    // this.render();
  }

  async handleRemoveCrewMember(event) {
    const div = $(event.currentTarget).parents(".crew-member");
    const entityId = div.data("entity-id");
    const character = game.actors.get(entityId);

    let crewMembers = [...this.getCrewMembers()];
    crewMembers.splice(crewMembers.indexOf(entityId), 1);

    let updateData = {
      'flags.crewMembers': crewMembers,
    };

    let starshipRole, roleParticipants;
    for (let starshipRoleKey in this.actor.data.flags.starship) {
      starshipRole = this.actor.data.flags.starship[starshipRoleKey];
      if (starshipRole.indexOf(entityId) < 0) continue;

      if (typeof starshipRole === 'object') {
        roleParticipants = [...starshipRole];
        roleParticipants.splice(roleParticipants.indexOf(entityId), 1);
        updateData['flags.starship.' + starshipRoleKey] = roleParticipants;
      } else {
        updateData['flags.starship.' + starshipRoleKey] = "";
      }
    }

    await this.actor.update(updateData);

    if (character.data.flags.starship === this.actor.data._id) {
      character.update({'flags.starship': ""});
    }

    div.slideUp(200, () => this.render(false));
  }

  async handleStarshipRoleAssignment(event, actor) {
    let roleContainer = event.toElement.classList.contains('starship-role') ? event.toElement : event.toElement.closest('.starship-role');
    if (roleContainer === null) return; // character was dragged god knows where; just pretend it never happened

    this.assignCrewMembersToRole(actor, roleContainer.dataset.starshipRole);
  }

  async handleAddToStarshipCrew(actor) {
    let crewMembers = [...this.getCrewMembers()];
    let initialCount = crewMembers.length;
    crewMembers.push(actor.data._id);
    crewMembers = [...new Set(crewMembers)]; // remove duplicate values
    if (initialCount === crewMembers.length) return; // nothing changed

    let starshipOther = [...this.actor.data.flags.starship.other];
    starshipOther.push(actor.data._id);
    await this.actor.update({ 'flags.crewMembers': crewMembers, 'flags.starship.other': starshipOther });
    actor.update({'flags.starship': this.actor.data._id});
  }
  
  // ********** PREPARE DATA *************

  getStarshipRoles() {
    let roles = duplicate(CONFIG.BountyHunter['starship-roles']);
    roles.other = {
      key: 'other',
      name: 'Other',
      functions: {},
    };

    return roles;
  }

  prepareCrewMembers(data) {
    let ownedActorId, crewMembers = {};
    for (let i = 0; i < (data.actor.flags.crewMembers || []).length; i++) {
      ownedActorId = data.actor.flags.crewMembers[i];
      crewMembers[ownedActorId] = game.actors.get(ownedActorId).data;
    }
    return crewMembers;
  }

  prepareStarshipControlData(data) {
    let assignedActorId, starshipRoleAssignees;
    for (let starshipRoleKey in data.starshipRoles) {
      // handle role assignees
      starshipRoleAssignees = data.actor.flags.starship[starshipRoleKey] ?? [];
      data.starshipRoles[starshipRoleKey].assignees = {}

      if (typeof starshipRoleAssignees === 'object') {
        for (let i = 0; i < starshipRoleAssignees.length; i++) {
          assignedActorId = starshipRoleAssignees[i];
          if (!assignedActorId) continue;
          data.starshipRoles[starshipRoleKey].assignees[assignedActorId] = game.actors.get(assignedActorId).data;
        }
      } else if (starshipRoleAssignees !== "") {
        data.starshipRoles[starshipRoleKey].assignees[starshipRoleAssignees] = game.actors.get(starshipRoleAssignees).data;
      }

      this.prepareActionInfo(data.starshipRoles[starshipRoleKey])
    }
  }
  
  prepareStarshipWeapons(data) {
    let weapons = this.actor.itemTypes['weapon-component'];
    const gunnerRole = JSON.stringify(data.starshipRoles.gunner);
    let starshipWeapons = {}, key, assignees;
    for (let weapon of weapons) {
      key = `gunner-${weapon.id}`;
      assignees = data.actor.flags.starship[key] ?? [];
      starshipWeapons[key] = JSON.parse(gunnerRole);
      starshipWeapons[key].key = key;
      starshipWeapons[key].name = weapon.name;
      starshipWeapons[key].weapon = weapon;
      starshipWeapons[key].isWeapon = true;
      starshipWeapons[key].assignees = {};

      for (let assignedActorId of assignees) {
        if (!assignedActorId) continue;
        starshipWeapons[key].assignees[assignedActorId] = game.actors.get(assignedActorId).data;
      }

      this.prepareActionInfo(starshipWeapons[key])
    }

    return starshipWeapons;
  }

  prepareActionInfo(role) {
    let ownedAssignees, ownedAssignee, hasSkillsAndAp, componentIsOnline;
    for (let [actionKey, action] of Object.entries(role.functions)) {
      action.skillRequirements = action.skill
        .map(chain => chain.join(' + ') + ` (${chain.length} AP)`)
        .join(' OR ');
      action.componentRequirements = action.component ? `${game.i18n.localize('BH.STARSHIP.COMPONENTS.HEADING')}: ${action.component}` : '';
      
      // can use if there is an assigned character that 
      // has required skills, has enough AP, required component is online
      ownedAssignees = this._getOwnedCharacters(Object.keys(role.assignees));
      if (ownedAssignees.length) {
        ownedAssignee = ownedAssignees[0];
        hasSkillsAndAp = ownedAssignee.canDoAction(action);
        componentIsOnline = action.component === '' 
          || this.actor.items.find(i => i.name.includes(action.component) && i.data.data.pp.value > 0);
        action.canUse = hasSkillsAndAp && componentIsOnline;
      } else {
        action.canUse = false;
      }
    }
  }

  computeCargo(data) {
    let weightTransported = 0;
    for (let item of Object.values(data.items)) {
      weightTransported += this._computerItemEncumbrance(item);
    }
    weightTransported += this.actor.data.data.crew.additional / 10; // 10 people take up 1 ton worth of cargo space

    const cargoCapacity = this.actor.data.data['cargo-capacity'].value + (this.actor.overrides["CARGO_CAPACITY"] ?? 0);

    return {
      value: weightTransported,
      max: cargoCapacity,
      over: weightTransported > cargoCapacity,
    };
  }

  computeCrewCost() {
    return this.actor.data.data.crew.additional * game.settings.get("bounty-hunter-ttrpg", "crewCost");
  }

  prepareComponents() {
    return this.actor.itemTypes.component ?? [];
  }
  
  // ********** HELPERS *************

  _computerItemEncumbrance(data) {
    switch (data.type) {
      case "cargo":
        return data.data.weight;
      default:
        return 0;
    }
  }

  async assignCrewMembersToRole(crewMembers, starshipRoleKey) {
    if (!crewMembers) return;
    if (!Array.isArray(crewMembers)) crewMembers = [crewMembers];

    let updateData = {}, updDataKey, crewMemberId;
    for (let i = 0; i < crewMembers.length; i++) {
      crewMemberId = typeof crewMembers[i] === 'object' ? crewMembers[i].data._id : crewMembers[i];

      // remove crew member from the current assignment
      let starshipRole, roleParticipants;
      for (let key in this.actor.data.flags.starship) {
        starshipRole = this.actor.data.flags.starship[key];
        if (starshipRole.indexOf(crewMemberId) < 0) continue;

        updDataKey = 'flags.starship.' + key;
        if (typeof starshipRole === 'object') {
          if (updateData[updDataKey] === undefined) {
            roleParticipants = [...starshipRole];
            roleParticipants.splice(roleParticipants.indexOf(crewMemberId), 1);
            updateData[updDataKey] = roleParticipants;
          } else {
            updateData[updDataKey].splice(updateData[updDataKey].indexOf(crewMemberId), 1);
          }
        } else {
          updateData[updDataKey] = "";
        }
      }

      // add crew member to a new assignment
      updDataKey = 'flags.starship.' + starshipRoleKey;
      if (this.actor.data.flags.starship[starshipRoleKey] === undefined) {
        updateData[updDataKey] = [crewMemberId];
      } else if (typeof this.actor.data.flags.starship[starshipRoleKey] === 'object') {
        if (updateData[updDataKey] === undefined) {
          roleParticipants = [...this.actor.data.flags.starship[starshipRoleKey]];
          roleParticipants.push(crewMemberId);
          updateData[updDataKey] = roleParticipants;
        } else {
          updateData[updDataKey].push(crewMemberId);
        }
      } else {
        updateData[updDataKey] = crewMemberId;
        // if someone was already assigned here we must move that character to the "Other" assignment
        if (this.actor.data.flags.starship[starshipRoleKey] !== "") {
          if (updateData['flags.starship.other'] === undefined) {
            roleParticipants = [...this.actor.data.flags.starship.other];
            roleParticipants.push(this.actor.data.flags.starship[starshipRoleKey]);
            updateData['flags.starship.other'] = roleParticipants;
          } else {
            updateData['flags.starship.other'].push(this.actor.data.flags.starship[starshipRoleKey]);
          }
        }
      }
    }

    await this.actor.update(updateData);
  }
  
  _getOwnedCharacters(characterIds) {
    characterIds = typeof characterIds !== 'object' && characterIds !== '' ? [characterIds] : characterIds;
    
    let characters = characterIds
      .map(id => game.actors.get(id))
      .filter((character) => character.owner);

    return characters;
  }

  getCrewMembers() {
    return this.actor.data.flags.crewMembers || [];
  }
}
