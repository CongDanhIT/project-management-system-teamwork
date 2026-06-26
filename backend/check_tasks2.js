require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const tasks = await mongoose.connection.db.collection('tasks').find({ taskCode: { $in: ['TX-28', 'TX-29', 'TX-30', 'TX-31'] } }).toArray();
    console.log(JSON.stringify(tasks.map(t => ({ taskCode: t.taskCode, title: t.title, assignedTo: t.assignedTo })), null, 2));
    process.exit(0);
}

check();
