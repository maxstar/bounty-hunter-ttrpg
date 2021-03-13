import { BountyHunterItemSheet } from "./item.js";

export class BountyHunterAbilitySheet extends BountyHunterItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["bounty-hunter", "sheet", "item", "ability"],
      template: "systems/bounty-hunter-ttrpg/template/ability.html",
      height: 400,
    });
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
