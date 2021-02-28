export class BountyHunterItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "item"],
      width: 400,
      height: "auto",
      resizable: false,
    });
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    buttons = [
      {
        label: game.i18n.localize("SHEET.HEADER.POST_ITEM"),
        class: "item-post",
        icon: "fas fa-comment",
        onclick: (ev) => this.item.sendToChat(),
      },
    ].concat(buttons);
    return buttons;
  }

  getData() {
    const data = super.getData();
    this._computeQuality(data);
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
