import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

const invalidInput = (message: string, status = 400) => Object.assign(new Error(message), { status });

function requireObjectId(value: unknown, label: string) {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw invalidInput(`Invalid ${label}.`, 400);
  }
  return new mongoose.Types.ObjectId(value);
}

function requireNonEmptyString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required.`, 400);
  }
  return value.trim();
}

function requireObjectIdString(value: string, label: string) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw invalidInput(`Invalid ${label}.`, 400);
  }
  return value;
}

function toNumber(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw invalidInput(`${label} must be a positive number.`, 400);
  }
  return parsed;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw invalidInput('Activity payload is required.', 400);
  }

  const payload = input as Record<string, unknown>;
  const userId = requireObjectId(payload.userId, 'userId');
  const teamId = requireObjectId(payload.teamId, 'teamId');
  const type = requireNonEmptyString(payload.type, 'Type');
  const minutes = toNumber(payload.minutes, 'Minutes');
  const user = await User.findById(userId);
  if (!user) {
    throw invalidInput('User not found.', 404);
  }
  const team = await Team.findById(teamId);
  if (!team) {
    throw invalidInput('Team not found.', 404);
  }

  const points = typeof payload.points === 'undefined' ? minutes : toNumber(payload.points, 'Points');
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function updateActivity(activityId: string, input: unknown) {
  const id = requireObjectIdString(activityId, 'Activity id');
  const current = await Activity.findById(id);
  if (!current) {
    throw invalidInput('Activity not found.', 404);
  }

  if (!input || typeof input !== 'object') {
    throw invalidInput('Activity payload is required.', 400);
  }

  const payload = input as Record<string, unknown>;
  const nextUserId = payload.userId !== undefined ? requireObjectId(payload.userId, 'userId') : current.user;
  const nextTeamId = payload.teamId !== undefined ? requireObjectId(payload.teamId, 'teamId') : current.team;
  const nextType = payload.type !== undefined ? requireNonEmptyString(payload.type, 'Type') : current.type;
  const nextMinutes = payload.minutes !== undefined ? toNumber(payload.minutes, 'Minutes') : current.minutes;
  const nextPoints = payload.points !== undefined ? toNumber(payload.points, 'Points') : current.points ?? nextMinutes;

  const user = await User.findById(nextUserId);
  if (!user) {
    throw invalidInput('User not found.', 404);
  }
  const team = await Team.findById(nextTeamId);
  if (!team) {
    throw invalidInput('Team not found.', 404);
  }

  const updated = await Activity.findByIdAndUpdate(
    id,
    {
      $set: {
        user: nextUserId,
        team: nextTeamId,
        type: nextType,
        minutes: nextMinutes,
        points: nextPoints,
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt as string) : current.occurredAt,
      },
    },
    { new: true },
  );

  if (!updated) {
    throw invalidInput('Activity not found.', 404);
  }

  return updated.toObject();
}

export async function deleteActivity(activityId: string) {
  const id = requireObjectIdString(activityId, 'Activity id');
  const result = await Activity.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    throw invalidInput('Activity not found.', 404);
  }
  return { deleted: true };
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw invalidInput('Team payload is required.', 400);
  }

  const payload = input as Record<string, unknown>;
  const name = requireNonEmptyString(payload.name, 'Name');
  const mascot = requireNonEmptyString(payload.mascot, 'Mascot');
  const rawMembers = Array.isArray(payload.members) ? payload.members : [];
  const memberIds = rawMembers.map((member) => requireObjectId(member, 'Member'));

  const team = await Team.create({
    name,
    mascot,
    members: memberIds,
  });

  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }

  return team.toObject();
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return entries.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw invalidInput('User not found.', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentTypeCounts = new Map<string, number>();
  for (const activity of recentActivities) {
    const key = String(activity.type ?? '').trim().toLowerCase();
    if (!key) continue;
    recentTypeCounts.set(key, (recentTypeCounts.get(key) ?? 0) + 1);
  }

  const preferredFocus =
    typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim()
      ? user.fitnessGoal.trim().toLowerCase()
      : [...recentTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  const workouts = await Workout.find().lean();
  const ranked = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').trim().toLowerCase();
      const score =
        (focus === preferredFocus ? 3 : 0) +
        (focus === String(user.fitnessGoal ?? '').trim().toLowerCase() ? 2 : 0) +
        (recentTypeCounts.has(focus) ? 2 : 0);
      return { workout, score };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title));

  if (ranked.length === 0) {
    return [];
  }

  const suggestions = ranked.map(({ workout }) => ({
    ...workout,
    reason: buildWorkoutReason(user, workout, recentActivities),
  }));

  return suggestions;
}

function buildWorkoutReason(
  user: { fitnessGoal?: string | null },
  workout: { focus?: string | null; title?: string | null },
  recentActivities: Array<{ type?: string | null }>,
) {
  const goal = typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim() ? user.fitnessGoal.trim() : 'overall fitness';
  const recentType = recentActivities[0]?.type?.trim() ?? 'activity';
  const focus = String(workout.focus ?? '').trim() || 'general fitness';

  if (focus.toLowerCase() === goal.toLowerCase()) {
    return `${workout.title ?? 'This workout'} matches your ${goal} goal and recent ${recentType} activity.`;
  }

  return `${workout.title ?? 'This workout'} supports your recent ${recentType} activity and keeps your ${goal} goal on track.`;
}

export { User };
