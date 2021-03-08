export class ApPerSkillDialog extends Dialog {

    /** @override */
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          template: "templates/hud/dialog.html",
        classes: ["dialog"],
        width: 200,
        height: 120,
        jQuery: true
      });
    }

    /**
     * Show dialog that allows to choose how many AP a character will spend for a skill use
     * 
     */
    static async show(title, maxAp = 5, onAdd, onCancel) {
        onAdd = onAdd || function () {};
        onCancel = onCancel || function () {};

        const html = await renderTemplate('systems/bounty-hunters-ttrpg/template/dialog/ap-per-skill.html', {maxAp: maxAp});

        let d = new ApPerSkillDialog({
            title: title,
            content: this.buildDivHtmlDialog(html),
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "",
                    callback: async function (dialogHtml) {
                        let ap = await ApPerSkillDialog.getApAmount(dialogHtml);
                        onAdd(ap);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "",
                    callback: onCancel
                },
            },
            default: "ok",
        });
        d.render(true);
    }
    
    /**
     * @param  {string} html Dialog content
     */
    activateListeners(html) {
        super.activateListeners(html);

        let input = html.find('.ap-per-skill-input');
        let min = 1;
        let max = input.attr('max');
        html.find('.ap-per-skill').bind('mousewheel', function (e) {
            let curVal = input.val();
            e.originalEvent.wheelDelta > 0 ? input.val(Math.min(++curVal, max)) : input.val(Math.max(--curVal, min));
        });
    }

    static async getApAmount(html) {
        let ap = html.find('.ap-per-skill-input').val();

        return ap;
    }
    
    /**
     * @param  {string} divContent
     */
    static buildDivHtmlDialog(divContent) {
        return "<div class='skill-picker-dialog'>" + divContent + "</div>";
    }
}