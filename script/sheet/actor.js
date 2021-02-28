
export class BountyHunterActorSheet extends ActorSheet {

  activateListeners(html) {
    super.activateListeners(html);

    // Attribute markers
    html.find(".change-attribute").on("click contextmenu", (ev) => {
      const attributeName = $(ev.currentTarget).data("attribute");
      const attribute = this.actor.data.data.attribute[attributeName];
      let value = attribute.value;
      if (ev.type === "click") {
        value = Math.max(value - 1, 0);
      } else if (ev.type === "contextmenu") {
        value = Math.min(value + 1, attribute.max);
      }
      this.actor.update({
        ["data.attribute." + attributeName + ".value"]: value,
      });
    });

    // Willpower markers
    html.find(".change-willpower").on("click contextmenu", (ev) => {
      const attribute = this.actor.data.data.bio.willpower;
      let value = attribute.value;
      if (ev.type === "click") {
        value = Math.max(value - 1, 0);
      } else if (ev.type === "contextmenu") {
        value = Math.min(value + 1, attribute.max);
      }
      this.actor.update({"data.bio.willpower.value": value});
    });

    // Items
    html.find(".item-edit").click((ev) => {
      const div = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(div.data("itemId"));
      item.sheet.render(true);
    });
    html.find(".item-delete").click((ev) => {
      const div = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(div.data("itemId"));
      div.slideUp(200, () => this.render(false));
    });
    html.find(".item-post").click((ev) => {
      const div = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(div.data("itemId"));
      item.sendToChat();
    });
    html.find(".change-item-bonus").on("click contextmenu", (ev) => {
      const itemId = $(ev.currentTarget).data("itemId");
      const item = this.actor.getOwnedItem(itemId);
      let value = item.data.data.bonus.value;
      if (ev.type === "click") {
        value = Math.max(value - 1, 0);
      } else if (ev.type === "contextmenu") {
        value = Math.min(value + 1, item.data.data.bonus.max);
      }
      item.update({
        "data.bonus.value": value,
      });
    });
  }
}
