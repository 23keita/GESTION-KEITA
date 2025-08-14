const request = require('supertest');
const mongoose = require('mongoose');
// Charger les variables d'environnement pour l'environnement de test
const dotenv = require('dotenv');
dotenv.config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');
const User = require('./models/User');
const Task = require('./models/Task');
const Team = require('./models/Team');

let mongoServer;

// We will need two users to test permissions
let leaderAuthToken, memberAuthToken;
let leaderId, memberId;

const leaderUser = {
  username: 'leaderuser',
  email: 'leader@example.com',
  password: 'password123',
};
const memberUser = {
  username: 'memberuser',
  email: 'member@example.com',
  password: 'password123',
};

// Démarrer le serveur de BDD en mémoire avant tous les tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Arrêter le serveur de BDD après tous les tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Nettoyer la BDD et créer un utilisateur de test avant chaque test
beforeEach(async () => {
  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Team.deleteMany({}),
  ]);

  // Create two users: one will be a team leader, the other a regular member
  const leader = await User.create(leaderUser);
  leaderId = leader._id;
  const member = await User.create(memberUser);
  memberId = member._id;

  // Get auth tokens for both users
  const leaderRes = await request(app).post('/api/auth/login').send({
    email: leaderUser.email,
    password: leaderUser.password,
  });
  leaderAuthToken = leaderRes.body.token;

  const memberRes = await request(app).post('/api/auth/login').send({
    email: memberUser.email,
    password: memberUser.password,
  });
  memberAuthToken = memberRes.body.token;
});

describe('API Endpoints', () => {
  // ==================================
  // ==      Auth Endpoints          ==
  // ==================================
  describe('POST /api/auth/register', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      const newUser = {
        username: 'newUser',
        email: 'new@example.com',
        password: 'password123',
      };
      const res = await request(app).post('/api/auth/register').send(newUser);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait connecter un utilisateur et retourner un token', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: leaderUser.email,
        password: leaderUser.password,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  // ==================================
  // ==      Tasks Endpoints         ==
  // ==================================
  describe('Tasks API', () => {
    it('POST /api/tasks - devrait créer une nouvelle tâche', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({
          title: 'Test Task',
          description: 'A task for testing',
          assignedTo: leaderId,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('title', 'Test Task');
    });

    it('GET /api/tasks - devrait lister les tâches', async () => {
      // Créer une tâche d'abord
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({ title: 'Another Task', assignedTo: leaderId });

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${leaderAuthToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.tasks.length).toBeGreaterThan(0);
    });

    it('PUT /api/tasks/:id - devrait mettre à jour une tâche', async () => {
      // Créer une tâche
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({ title: 'Task to update', assignedTo: leaderId });
      const createdTaskId = taskRes.body._id;

      const res = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({ status: 'terminée' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'terminée');
    });

    it('DELETE /api/tasks/:id - devrait supprimer une tâche', async () => {
      // Créer une tâche
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({ title: 'Task to delete', assignedTo: leaderId });
      const createdTaskId = taskRes.body._id;

      const res = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${leaderAuthToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Tâche supprimée avec succès');
    });

    it('DELETE /api/tasks/:id - un utilisateur non autorisé ne devrait PAS pouvoir supprimer une tâche', async () => {
      // Le leader crée une tâche et l'assigne au membre
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({ title: 'A task only leader can delete', assignedTo: memberId });
      const createdTaskId = taskRes.body._id;

      // Le membre (qui est assigné mais pas créateur) essaie de la supprimer
      const res = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${memberAuthToken}`); // Token du membre

      expect(res.statusCode).toEqual(403); // Forbidden
    });
  });

  // ==================================
  // ==      Teams Endpoints         ==
  // ==================================
  describe('Teams API', () => {
    let teamId;
    // Create a team before each team-related test, led by the leader
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({ name: 'Test Team', description: 'A team for testing' });
      teamId = res.body._id;
    });

    it('POST /api/teams - devrait créer une nouvelle équipe', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${leaderAuthToken}`)
        .send({ name: 'Another Team', description: 'A team for testing' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('name', 'Another Team');
      expect(res.body.leader).toEqual(leaderId.toString());
    });

    it('GET /api/teams - devrait lister les équipes de l\'utilisateur', async () => {
      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${leaderAuthToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Test Team');
    });

    it('GET /api/teams/:id - devrait obtenir les détails d\'une équipe', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${leaderAuthToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', 'Test Team');
    });

    describe('Team Membership and Permissions', () => {
      it('POST /api/teams/:id/members - le leader devrait pouvoir ajouter un membre', async () => {
        const res = await request(app)
          .post(`/api/teams/${teamId}/members`)
          .set('Authorization', `Bearer ${leaderAuthToken}`)
          .send({ userId: memberId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.members).toHaveLength(2);
        const memberIds = res.body.members.map((m) => m._id);
        expect(memberIds).toContain(memberId.toString());
      });

      it('POST /api/teams/:id/members - un membre standard ne devrait PAS pouvoir ajouter un membre', async () => {
        const res = await request(app)
          .post(`/api/teams/${teamId}/members`)
          .set('Authorization', `Bearer ${memberAuthToken}`) // Using member's token
          .send({ userId: leaderId });

        expect(res.statusCode).toEqual(403); // Forbidden
      });

      it('DELETE /api/teams/:id/members/:memberId - le leader devrait pouvoir retirer un membre', async () => {
        // First, add the member to the team
        await request(app)
          .post(`/api/teams/${teamId}/members`)
          .set('Authorization', `Bearer ${leaderAuthToken}`)
          .send({ userId: memberId });

        // Then, remove the member
        const res = await request(app)
          .delete(`/api/teams/${teamId}/members/${memberId}`)
          .set('Authorization', `Bearer ${leaderAuthToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.members).toHaveLength(1);
        expect(res.body.members[0]._id).toEqual(leaderId.toString());
      });

      it('DELETE /api/teams/:id - un membre standard ne devrait PAS pouvoir supprimer l\'équipe', async () => {
        const res = await request(app)
          .delete(`/api/teams/${teamId}`)
          .set('Authorization', `Bearer ${memberAuthToken}`); // Using member's token

        expect(res.statusCode).toEqual(403); // Forbidden
      });

      it('DELETE /api/teams/:id - le leader devrait pouvoir supprimer l\'équipe', async () => {
        const res = await request(app)
          .delete(`/api/teams/${teamId}`)
          .set('Authorization', `Bearer ${leaderAuthToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Équipe supprimée avec succès');
      });
    });
  });
});