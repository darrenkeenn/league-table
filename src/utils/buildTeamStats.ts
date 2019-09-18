import * as data from '../json/data.json';

import { IMatch, IMatchTeamsStats, IRound, ITeamMatchStats, ITeamStats, WinTypeEnum } from '~/models';
import {
  calculateResult,
  sortByGoalsScored,
  sortByPoints,
  sortByGoalDifference,
  getAwardedPoints,
  calculateGoalDifference
} from '~/utils';

interface ILeagueTable {
  teamStats: { [key: string]: ITeamStats };
  addTeamStats: (currentTeam: ITeamMatchStats) => void;
  getSortedTeamStats: () => ITeamStats[];
}

export const leagueTable:ILeagueTable = {
  teamStats: {},
  addTeamStats: (currentTeam: ITeamMatchStats): void => {
    const teamInArray = leagueTable.teamStats[currentTeam.code];
    const { code } = currentTeam;

    if (teamInArray) {
      const existingTeam = leagueTable.teamStats[code];
      leagueTable.teamStats[code] = {
        ...existingTeam,
        scored: existingTeam.scored + currentTeam.scored,
        conceded: existingTeam.conceded + currentTeam.conceded,
        points: existingTeam.points + getAwardedPoints(currentTeam.result),
        winCount: existingTeam.winCount + (currentTeam.result === WinTypeEnum.Win ? 1 : 0),
        drawCount: existingTeam.drawCount + (currentTeam.result === WinTypeEnum.Draw ? 1 : 0),
        loseCount: existingTeam.loseCount + (currentTeam.result === WinTypeEnum.Lose ? 1 : 0),
        form: [...existingTeam.form, currentTeam.result],
      };
    } else {
      const { name, scored, conceded, result } = currentTeam;
      leagueTable.teamStats[code] = {
        name,
        scored,
        conceded,
        points: getAwardedPoints(result),
        winCount: (result === WinTypeEnum.Win ? 1 : 0),
        drawCount: (result === WinTypeEnum.Draw ? 1 : 0),
        loseCount: (result === WinTypeEnum.Lose ? 1 : 0),
        form: [result],
      };
    }
  },
  getSortedTeamStats: () => {
    return Object.values(leagueTable.teamStats).sort((teamA: ITeamStats, teamB: ITeamStats): 1 | -1 => {
      if (sortByPoints(teamA.points, teamB.points)) {
        return sortByPoints(teamA.points, teamB.points);
      }

      if (sortByGoalDifference(calculateGoalDifference(teamA), calculateGoalDifference(teamB))) {
        return sortByGoalDifference(calculateGoalDifference(teamA), calculateGoalDifference(teamB));
      }

      if (sortByGoalsScored(teamA.scored, teamB.scored)) {
        return sortByGoalsScored(teamA.scored, teamB.scored);
      }
    });
  },
};

// TODO: REDUCE?
data.rounds.forEach((round: IRound) => {
  const parsedMatches: IMatchTeamsStats[] = round.matches.map((match: IMatch) => ({
    teams: [{
      name: match.team1.name,
      code: match.team1.code,
      scored: match.score1,
      conceded: match.score2,
      result: calculateResult(match.score1, match.score2),
    }, {
      name: match.team2.name,
      code: match.team2.code,
      scored: match.score2,
      conceded: match.score1,
      result: calculateResult(match.score2, match.score1),
    }],
  }));

  parsedMatches.forEach((match: IMatchTeamsStats) => {
    match.teams.forEach((team: ITeamMatchStats) => leagueTable.addTeamStats(team));
  });
});
