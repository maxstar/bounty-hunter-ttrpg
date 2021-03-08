function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/bounty-hunters-ttrpg/template/chat/item.html",
    "systems/bounty-hunters-ttrpg/template/character.html",
    "systems/bounty-hunters-ttrpg/template/starship.html",
    "systems/bounty-hunters-ttrpg/template/weapon.html",
    "systems/bounty-hunters-ttrpg/template/armor.html",
    "systems/bounty-hunters-ttrpg/template/gear.html",
    "systems/bounty-hunters-ttrpg/template/skill.html",
    "systems/bounty-hunters-ttrpg/template/ability.html",
    "systems/bounty-hunters-ttrpg/template/component.html",
    "systems/bounty-hunters-ttrpg/template/cargo.html",
    "systems/bounty-hunters-ttrpg/template/tab/main.html",
    "systems/bounty-hunters-ttrpg/template/tab/bio.html",
    "systems/bounty-hunters-ttrpg/template/partial/skill-picker.html",
    "systems/bounty-hunters-ttrpg/template/dialog/ap-per-skill.html",
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
