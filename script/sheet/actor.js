
import { CharacterPickerDialog } from "../dialog/character-picker-dialog.js";

export class BountyHunterActorSheet extends ActorSheet {

  activateListeners(html) {
    super.activateListeners(html);

    // Items
    html.find(".item-edit").click((ev) => {
      const div = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(div.data("entity-id"));
      item.sheet.render(true);
    });
    html.find(".item-delete").click((ev) => {
      const div = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(div.data("entity-id"));
      div.slideUp(200, () => this.render(false));
    });
    html.find(".item-post").click((ev) => {
      const div = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(div.data("entity-id"));
      item.sendToChat();
    });
    html.find(".item-create").click(this.handleItemCreate.bind(this));
    html.find(".item-transfer").click(this.handleItemTransfer.bind(this));
  }

  getData() {
    const data = super.getData();
    data.data.itemsByCategory = this.categorizeItems();
    return data;
  }

  categorizeItems() {
    let itemsByCategory = {skill: {}, ability: {}, gear: {}, weapon: {}};
    let category;

    this.actor.items.forEach((item) => {
      if (itemsByCategory[item.data.type] === undefined) {
        itemsByCategory[item.data.type] = {};
      }

      if (item.data.type === 'gear') {
        category = item.data.data.category === '' ? game.i18n.localize('Other') : item.data.data.category;
          
        if (itemsByCategory.gear[category] === undefined) {
          itemsByCategory.gear[category] = {};
        }
        itemsByCategory.gear[category][item.id] = item;
      } else {
        itemsByCategory[item.data.type][item.data.name] = item;
      }
    });

    itemsByCategory.skill = this._sortItems(itemsByCategory.skill);
    itemsByCategory.ability = this._sortItems(itemsByCategory.ability);
    itemsByCategory.weapon = this._sortItems(
      itemsByCategory.weapon, 
      (itemId1, itemId2) => itemsByCategory.weapon[itemId1].name.localeCompare(itemsByCategory.weapon[itemId2].name)
    );
    Object.keys(itemsByCategory.gear).reduce(
      (retVal, key) => {
        retVal[key] = this._sortItems(
          itemsByCategory.gear[key], 
          (itemId1, itemId2) => itemsByCategory.gear[key][itemId1].name.localeCompare(itemsByCategory.gear[key][itemId2].name)
        );
        return retVal;
      },
      {}
    );

    return itemsByCategory;
  }

  handleItemCreate(event) {
    event.preventDefault();
    let header = event.currentTarget;
    let data = duplicate(header.dataset);
    data["name"] = `New ${data.type.capitalize()}`;
    this.actor.createEmbeddedEntity("OwnedItem", data, { renderSheet: true });
  }

  handleItemTransfer(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents(".item");
    const item = this.actor.getOwnedItem(div.data("entity-id"));
    const that = this;

    if (item === null) return;
    
    CharacterPickerDialog.show(
      game.i18n.format('BH.TRANSFER_DIALOG', {item: item.name}), 
      this._getPlayerActors(), 
      function (containerId) {
        const container = game.actors.get(containerId);
        console.log(`Transfering ${item.name} to ${container.name}`);
        container.createEmbeddedEntity("OwnedItem", item);
        that.actor.deleteEmbeddedEntity("OwnedItem", item._id);
      }
    );
  }

  _getPlayerActors() {
    return game.actors.filter(a => a.hasPlayerOwner && a.id !== this.actor.id);
  }

  _sortItems(items, comparator) {
    return Object.keys(items).sort(comparator).reduce(
      (obj, key) => { 
        obj[key] = items[key]; 
        return obj;
      }, 
      {}
    );
  }
}
