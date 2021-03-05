export class ReputationStats {

    static totalsByReputationLevel = null;

    static getForReputation(reputationLevel) {
        if (CONFIG.BountyHunter === undefined) return false;
        if (ReputationStats.totalsByReputationLevel === null) ReputationStats.computeReputationStats();

        return ReputationStats.totalsByReputationLevel[reputationLevel];
    }

    static computeReputationStats(reputation) {
        let totals = {
            skill: 0,
            ability: 0,
            ap: 0
        };
        let byLevel = [{
            skill: 0,
            ability: 0,
            ap: 0
        }];
        for (const [repLevel, data] of Object.entries(CONFIG.BountyHunter.reputation)) {
            while (byLevel.length < repLevel) {
                byLevel.push({
                    skill: totals.skill,
                    ability: totals.ability,
                    ap: totals.ap
                });
            }

            totals.skill += data.skill;
            totals.ability += data.ability;
            totals.ap += data.ap;

            byLevel.push({
                skill: totals.skill,
                ability: totals.ability,
                ap: totals.ap
            });
        }

        ReputationStats.totalsByReputationLevel = byLevel;
    }
  }