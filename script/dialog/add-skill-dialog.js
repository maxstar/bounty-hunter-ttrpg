export class AddSkillDialog extends Dialog {

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
     * Show dialog that allows to add skills to a character
     * 
     */
    static async show(title, learnedSkills = {}, onAdd, onCancel) {
        onAdd = onAdd || function () {};
        onCancel = onCancel || function () {};

        const skillList = await this.buildSkillList(learnedSkills);

        let d = new AddSkillDialog({
            title: title,
            content: this.buildDivHtmlDialog(skillList),
            width: 600,
            buttons: {
                add: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Add",
                    callback: async function (dialogHtml) {
                        let skills = await AddSkillDialog.getSelectedSkills(dialogHtml);
                        onAdd(skills);
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

    static async getSelectedSkills(dialogHtml) {
        let skills = [];
        let skill;
        let elems = dialogHtml.find('input[type="checkbox"]:checked');
        for (let elem of elems) {
            skill = await this.findSkill(elem.getAttribute('id'));
            skills.push(skill.data);
        }

        return skills;
    }

    static async findSkill(id) {
        let skill = game.items.get(id);
        if (skill === null) {
            for (let pack of game.packs.filter((p) => p.metadata.entity === "Item")) {
                skill = await pack.getEntry(id);
                if (skill !== null) break;
            }
        }
        return skill;
    }
    
    /**
     * @param  {Array} learnedSkills Array with skills that character already has
     */
    static async buildSkillList(learnedSkills) {
        let skills = await this.collectAllSkills();
        let html = '';
        for (let skillName in skills) {
            if (learnedSkills[skillName] !== undefined) continue;
            html += await renderTemplate('systems/bounty-hunters-ttrpg/template/partial/skill-picker.html', {skill: skills[skillName]});
        }
        return `<div class="grid-container">${html}</div>`;
    }

    static async collectAllSkills() {
        let skills = {};
        for (let pack of game.packs.filter((p) => p.metadata.entity === "Item")) {
            const content = await pack.getContent();
            for (let ent of content) {
                if (ent.type !== 'skill') continue;

                skills[ent.name] = ent;
            }
        }
        for (let item of game.items) {
            if (item.type !== 'skill') continue;

            skills[item.name] = item;
        }

        return skills;
    }
    
    /**
     * @param  {string} divContent
     */
    static buildDivHtmlDialog(divContent) {
        return "<div class='skill-picker-dialog'>" + divContent + "</div>";
    }
}