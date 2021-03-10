import { BhTextEditor } from '../component/bh-text-editor.js';

function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/bounty-hunter-ttrpg/template/chat/item.html",
    "systems/bounty-hunter-ttrpg/template/character.html",
    "systems/bounty-hunter-ttrpg/template/starship.html",
    "systems/bounty-hunter-ttrpg/template/weapon.html",
    "systems/bounty-hunter-ttrpg/template/armor.html",
    "systems/bounty-hunter-ttrpg/template/gear.html",
    "systems/bounty-hunter-ttrpg/template/skill.html",
    "systems/bounty-hunter-ttrpg/template/ability.html",
    "systems/bounty-hunter-ttrpg/template/component.html",
    "systems/bounty-hunter-ttrpg/template/cargo.html",
    "systems/bounty-hunter-ttrpg/template/tab/main.html",
    "systems/bounty-hunter-ttrpg/template/tab/bio.html",
    "systems/bounty-hunter-ttrpg/template/partial/skill-picker.html",
    "systems/bounty-hunter-ttrpg/template/dialog/ap-per-skill.html",
    "systems/bounty-hunter-ttrpg/template/chat/skill-challenge.html",
  ];
  return loadTemplates(templatePaths);
}

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("plaintextToHTML", function (value) {
    // strip tags, add <br/> tags
    return new Handlebars.SafeString(value.replace(/(<([^>]+)>)/gi, "").replace(/(?:\r\n|\r|\n)/g, "<br/>"));
  });
  Handlebars.registerHelper("toUpperCase", function (str) {
    return str.toUpperCase();
  });
  Handlebars.registerHelper("hasLocalization", function (str) {
    return game.i18n.has(str);
  });
  Handlebars.registerHelper("bh_localize_skill_descr", function (str, defaultStr) {
    //{{#if (hasLocalization skill.data.localizedDescr)}}{{localize skill.data.localizedDescr}}{{else}}{{skill.data.data.description}}{{/if}}
    return game.i18n.has(str) ? game.i18n.localize(str) : defaultStr;
  });
  Handlebars.registerHelper("eq", function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
      return args[0] === expression;
    });
  });
  Handlebars.registerHelper("or", function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.reduce((x, y) => x || y);
  });
  Handlebars.registerHelper("editor", function(options) {
    const target = options.hash['target'];
    if ( !target ) throw new Error("You must define the name of a target field.");

    // Enrich the content
    const owner = Boolean(options.hash['owner']);
    const content = BhTextEditor.enrichHTML(options.hash['content'] || "", {secrets: owner, entities: true});

    // Construct the HTML
    let editor = $(`<div class="editor"><div class="editor-content" data-edit="${target}">${content}</div></div>`);

    // Append edit button
    const button = Boolean(options.hash['button']);
    const editable = Boolean(options.hash['editable']);
    if ( button && editable ) editor.append($('<a class="editor-edit"><i class="fas fa-edit"></i></a>'));
    return new Handlebars.SafeString(editor[0].outerHTML);
  });
}

function normalize(data, defaultValue) {
  if (data) {
    return data.toLowerCase();
  } else {
    return defaultValue;
  }
}

export const initializeHandlebars = () => {
  registerHandlebarsHelpers();
  preloadHandlebarsTemplates();
};
