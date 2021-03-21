import { StarshipHandler } from "../component/starship-handler.js";

export class BountyHunterStarshipSheet extends ActorSheet {
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
      width: 700,
      height: 840,
      resizable: false,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
      dragDrop: dragDrop,
    });
  }

  getData() {
    const data = super.getData();

    data.user = game.user;
    data.crewMembers = {};
    data.starship = {};
    data.starshipRoles = CONFIG.BountyHunter['starship-roles'];
    let ownedActorId, assignedActorId, starshipRole;
    for (let i = 0; i < (data.actor.flags.crewMembers || []).length; i++) {
      ownedActorId = data.actor.flags.crewMembers[i];
      data.crewMembers[ownedActorId] = game.actors.get(ownedActorId).data;
    }
    for (let starshipRoleKey in data.actor.flags.starship) {
      starshipRole = data.actor.flags.starship[starshipRoleKey];
      data.starship[starshipRoleKey] = {};

      if (typeof starshipRole === 'object') {
        for (let i = 0; i < starshipRole.length; i++) {
          assignedActorId = starshipRole[i];
          data.starship[starshipRoleKey][assignedActorId] = game.actors.get(assignedActorId).data;
        }
      } else if (starshipRole !== "") {
        data.starship[starshipRoleKey][starshipRole] = game.actors.get(starshipRole).data;
      }
    }
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.item-delete').click(this.handleRemoveCrewMember.bind(this));
    html.find('.reset').click(ev => {
      this.assignCrewMembersToRole(this.getCrewMembers(), 'other');
      this.render(true);
    });

    html.find('.function-button').click(this.handleFunctionUsage.bind(this));
  }

  getCrewMembers() {
    return this.actor.data.flags.crewMembers || [];
  }

  handleFunctionUsage(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const roleKey = btn.closest(".starship-role").dataset.key;
    let assignedPartyMembers = this._getOwnedCharacters(this.actor.data.flags.starship[btn.dataset.action]);
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

    div.slideUp(200, () => this.render(false));
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

  async handleStarshipRoleAssignment(event, actor) {
    let roleContainer = event.toElement.classList.contains('starship-role') ? event.toElement : event.toElement.closest('.starship-role');
    if (roleContainer === null) return; // character was dragged god knows where; just pretend it never happened

    this.assignCrewMembersToRole(actor, roleContainer.dataset.starshipRole);
  }

  async assignCrewMembersToRole(crewMembers, starshipRoleKey) {
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

      // add starship member to a new assignment
      updDataKey = 'flags.starship.' + starshipRoleKey;
      if (typeof this.actor.data.flags.starship[starshipRoleKey] === 'object') {
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

  async handleAddToStarshipCrew(actor) {
    let crewMembers = [...this.getCrewMembers()];
    let initialCount = crewMembers.length;
    crewMembers.push(actor.data._id);
    crewMembers = [...new Set(crewMembers)]; // remove duplicate values
    if (initialCount === crewMembers.length) return; // nothing changed

    let starshipOther = [...this.actor.data.flags.starship.other];
    starshipOther.push(actor.data._id);
    await this.actor.update({ 'flags.crewMembers': crewMembers, 'flags.starship.other': starshipOther });
  }
  
  _getOwnedCharacters(characterIds) {
    characterIds = typeof characterIds !== 'object' && characterIds !== '' ? [characterIds] : characterIds;
    
    let characters = characterIds
      .map(id => game.actors.get(id))
      .filter((character) => character.owner);

    return characters;
  }
}
