
export async function loadSystemSettings() {
  CONFIG.BountyHunter = {
    reputation: await loadReputation(),
    'starship-roles': await loadStarshipRoles(),
  };
}

async function loadReputation() {
  const datasetDir = game.settings.get("bounty-hunter-ttrpg", "datasetDir");
  const resp = await fetch(datasetDir + '/reputation.json').catch(err => { return {} });
  return resp.json();
}

async function loadStarshipRoles() {
  const datasetDir = game.settings.get("bounty-hunter-ttrpg", "datasetDir");
  const resp = await fetch(datasetDir + '/starship-roles.json').catch(err => { return {} });
  return resp.json();
}