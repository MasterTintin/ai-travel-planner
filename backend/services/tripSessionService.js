class TripSessionService {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create new session
   */
  createSession(sessionId, tripData) {
    this.sessions.set(sessionId, {
      id: sessionId,

      originalTrip: JSON.parse(JSON.stringify(tripData)),
      currentTrip: JSON.parse(JSON.stringify(tripData)),

      history: [],

      // ⭐ AI Memory
      preferences: {
        likes: [],
        dislikes: [],
        lockedPlaces: [],
        budget: null,
        travelStyle: null
      },

      // ⭐ Quick Commands
      aiCommands: [],

      // ⭐ Trip Versions
      tripVersions: [
        {
          version: 1,
          name: "Original AI Plan",
          createdAt: new Date(),
          command: "Initial Generate",
          trip: JSON.parse(JSON.stringify(tripData))
        }
      ],

      createdAt: new Date(),
      updatedAt: new Date()
    });

    return this.sessions.get(sessionId);
  }

  /**
   * Get session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Update current trip
   */
  updateTrip(sessionId, newTrip, command = "") {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    session.history.push({
      timestamp: new Date(),
      command,
      tripSnapshot: JSON.parse(JSON.stringify(session.currentTrip))
    });

    session.currentTrip = JSON.parse(JSON.stringify(newTrip));

    session.tripVersions.push({
      version: session.tripVersions.length + 1,
      name: `Version ${session.tripVersions.length + 1}`,
      createdAt: new Date(),
      command,
      trip: JSON.parse(JSON.stringify(newTrip))
    });

    session.aiCommands.push({
      command,
      timestamp: new Date()
    });

    session.updatedAt = new Date();

    return session.currentTrip;
  }

  setPreferences(sessionId, preferences) {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    session.preferences = {
      ...session.preferences,
      ...preferences
    };

    session.updatedAt = new Date();

    return session.preferences;
  }

  addLike(sessionId, item) {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    if (!session.preferences.likes.includes(item)) {
      session.preferences.likes.push(item);
    }

    session.updatedAt = new Date();

    return session.preferences.likes;
  }

  addDislike(sessionId, item) {
    const session = this.sessions.get(sessionId);

    if (!session) return;

    if (!session.preferences.dislikes.includes(item))
      session.preferences.dislikes.push(item);
    session.updatedAt = new Date();

    return session.preferences.dislikes;
  }

  lockPlace(sessionId, place) {
    const session = this.sessions.get(sessionId);

    if (!session) return;

    if (!session.preferences.lockedPlaces.includes(place))
      session.preferences.lockedPlaces.push(place);

    session.updatedAt = new Date();

    return session.preferences.lockedPlaces;
  }

  getCommandHistory(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) return [];

    return session.aiCommands;
  }

  getVersions(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) return [];

    return session.tripVersions;
  }

  restoreVersion(sessionId, version) {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    const target = session.tripVersions.find((v) => v.version === version);

    if (!target) return null;

    session.currentTrip = JSON.parse(JSON.stringify(target.trip));

    session.history.push({
      timestamp: new Date(),

      command: `Restore Version ${version}`,

      tripSnapshot: JSON.parse(JSON.stringify(session.currentTrip))
    });
    session.updatedAt = new Date();

    return session.currentTrip;
  }

  /**
   * Undo
   */
  undo(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    if (session.history.length === 0) return session.currentTrip;

    const lastVersion = session.history.pop();

    session.currentTrip = lastVersion.tripSnapshot;
    session.updatedAt = new Date();

    return session.currentTrip;
  }

  /**
   * Reset to original AI result
   */
  reset(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    session.currentTrip = JSON.parse(JSON.stringify(session.originalTrip));

    session.history = [];

    session.aiCommands = [];

    session.preferences = {
      likes: [],
      dislikes: [],
      lockedPlaces: [],
      budget: null,
      travelStyle: null
    };

    session.tripVersions = [
      {
        version: 1,
        name: "Original AI Plan",
        createdAt: new Date(),
        command: "Initial Generate",
        trip: JSON.parse(JSON.stringify(session.originalTrip))
      }
    ];

    session.updatedAt = new Date();

    return session.currentTrip;
  }

  /**
   * Delete
   */
  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * Get versions
   */
  getHistory(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) return [];

    return session.history;
  }

  /**
   * Get current trip
   */
  getCurrentTrip(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    return session.currentTrip;
  }

  /**
   * Count sessions
   */
  getSessionCount() {
    return this.sessions.size;
  }

  /**
   * Auto cleanup (>2 hours)
   */
  cleanup() {
    const now = Date.now();

    let removed = 0;

    for (const [id, session] of this.sessions) {
      const diff = now - session.updatedAt.getTime();

      if (diff > 1000 * 60 * 60 * 2) {
        this.sessions.delete(id);

        removed++;
      }
    }

    return removed;
  }
}

module.exports = new TripSessionService();
