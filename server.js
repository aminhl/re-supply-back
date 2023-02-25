const mongoose = require('mongoose').default;
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

// database connection

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
  })
  .then(() => console.log('resupply-DB connection established'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`ReSupply Application listening on port ${port}`);
});
