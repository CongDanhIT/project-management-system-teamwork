const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://buicongdanhcm2004_db_user:cprRNtB6luXjXEbu@cluster0.97lwaex.mongodb.net/teamsync_db').then(async () => {
  const db = mongoose.connection.db;
  const res = await db.collection('projects').updateMany({}, { $set: { isAutoTaggingEnabled: true } });
  console.log('Updated projects:', res.modifiedCount);
  process.exit(0);
});
