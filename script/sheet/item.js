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
    data.data.isOwned = this.item.isOwned;
    return data;
  }
  
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.add-active-effect').on('click', async (ev) => {
      const transfer = $(ev.currentTarget).data('transfer');
      const id = (
        await this.item.createEmbeddedEntity('ActiveEffect', {
          label: game.i18n
            .localize('ENTITY.New')
            .replace('{entity}', game.i18n.localize('Active Effect')),
          icon: '/icons/svg/mystery-man.svg',
          transfer: transfer,
        })
      )._id;
      return new ActiveEffectConfig(this.item.effects.get(id)).render(true);
    });

    html.find('.effect-action').on('click', (ev) => {
      const a = ev.currentTarget;
      const effectId = a.closest('li').dataset.effectId;
      const effect = this.item.effects.get(effectId);
      const action = a.dataset.action;
      switch (action) {
        case 'edit':
          return effect.sheet.render(true);
        case 'delete':
          return effect.delete();
        case 'toggle':
          return effect.update({ disabled: !effect.data.disabled });
      }
    });
  }
}
