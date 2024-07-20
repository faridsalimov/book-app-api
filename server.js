const mongoose = require('mongoose');
const dotenv = require("dotenv");
const app = require('./app');

dotenv.config({ path: "./config.env" });

mongoose.connect('mongodb://localhost:27017/bookapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});