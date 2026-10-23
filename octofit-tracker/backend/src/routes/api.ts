import { Router } from 'express';
import { createActivity, createTeam, deleteActivity, getLeaderboard, listActivities, listTeams, suggestWorkouts, updateActivity } from '../services/octofitService.js';

export const apiRouter = Router();

apiRouter.get('/activities', async (_request, response, next) => {
  try { response.json({ activities: await listActivities() }); } catch (error) { next(error); }
});
apiRouter.post('/activities', async (request, response, next) => {
  try { response.status(201).json({ activity: await createActivity(request.body) }); } catch (error) { next(error); }
});
apiRouter.put('/activities/:id', async (request, response, next) => {
  try { response.json({ activity: await updateActivity(request.params.id, request.body) }); } catch (error) { next(error); }
});
apiRouter.patch('/activities/:id', async (request, response, next) => {
  try { response.json({ activity: await updateActivity(request.params.id, request.body) }); } catch (error) { next(error); }
});
apiRouter.delete('/activities/:id', async (request, response, next) => {
  try {
    await deleteActivity(request.params.id);
    response.status(204).send();
  } catch (error) { next(error); }
});
apiRouter.get('/teams', async (_request, response, next) => {
  try { response.json({ teams: await listTeams() }); } catch (error) { next(error); }
});
apiRouter.post('/teams', async (request, response, next) => {
  try { response.status(201).json({ team: await createTeam(request.body) }); } catch (error) { next(error); }
});
apiRouter.get('/leaderboard', async (_request, response, next) => {
  try { response.json({ leaderboard: await getLeaderboard() }); } catch (error) { next(error); }
});
apiRouter.get('/workouts/suggestions/:userEmail', async (request, response, next) => {
  try { response.json({ suggestions: await suggestWorkouts(request.params.userEmail) }); } catch (error) { next(error); }
});
