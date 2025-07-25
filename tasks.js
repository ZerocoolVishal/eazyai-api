// tasks.js
const tasks = {};

function createTask() {
    const id = crypto.randomUUID();
    tasks[id] = {
        status: 'pending',
        progress: 0,
        total: 0,
        results: [],
        startedAt: new Date(),
        completedAt: null,
    };
    return id;
}

function updateTask(id, update) {
    if (tasks[id]) {
        Object.assign(tasks[id], update);
    }
}

function getTask(id) {
    return tasks[id] || null;
}

module.exports = { createTask, updateTask, getTask };
