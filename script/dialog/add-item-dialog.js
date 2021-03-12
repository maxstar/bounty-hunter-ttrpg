export class AddItemDialog extends Dialog {

    /** @override */
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          template: "templates/hud/dialog.html",
        classes: ["dialog"],
        width: 600,
        height: 600,
        jQuery: true
      });
    }

    /**
     * Show dialog that allows to add items to a character
     * 
     */
    static async show(title, existingItems = {}, type, onAdd, onCancel) {
        onAdd = onAdd || function () {};
        onCancel = onCancel || function () {};

        const itemList = await this.buildItemList(existingItems, type);

        let d = new AddItemDialog({
            title: title,
            content: this.buildDivHtmlDialog(itemList),
            width: 600,
            buttons: {
                add: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Add",
                    callback: async function (dialogHtml) {
                        let items = await AddItemDialog.getSelectedItems(dialogHtml);
                        onAdd(items);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: onCancel
                },
            },
            default: "add",
        });
        d.render(true);
    }
    
    /**
     * @param  {string} html Dialog content
     */
    activateListeners(html) {
        super.activateListeners(html);
    }

    static async getSelectedItems(dialogHtml) {
        let items = [];
        let item;
        let elems = dialogHtml.find('input[type="checkbox"]:checked');
        for (let elem of elems) {
            item = await this.findItem(elem.getAttribute('id'));
            items.push(item.data);
        }

        return items;
    }

    static async findItem(id) {
        let item = game.items.get(id);
        if (item === null) {
            for (let pack of game.packs.filter((p) => p.metadata.entity === "Item")) {
                item = await pack.getEntry(id);
                if (item !== null) break;
            }
        }
        return item;
    }
    
    /**
     * @param  {Array} existingItems Array with items that character already has
     */
    static async buildItemList(existingItems, type) {
        let items = await this.collectAllItems(type);
        let html = '';
        for (let itemName in items) {
            if (existingItems[itemName] !== undefined) continue;
            html += await renderTemplate('systems/bounty-hunter-ttrpg/template/partial/item-picker.html', {item: items[itemName]});
        }
        return `<div class="grid-container">${html}</div>`;
    }

    static async collectAllItems(type) {
        let items = {};
        for (let item of game.items) {
            if (item.type !== type) continue;

            items[item.name] = item;
        }

        return items;
    }
    
    /**
     * @param  {string} divContent
     */
    static buildDivHtmlDialog(divContent) {
        return "<div class='item-picker-dialog'>" + divContent + "</div>";
    }
}