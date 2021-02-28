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
