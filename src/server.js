require("dotenv").config();
const app = require("./app");
const database = require("./config/database");

const port = process.env.PORT || 3000;

database
  .connect(process.env.MONGODB_URI)
  .then(() =>
    app.listen(port, () =>
      console.log(`App Hotel Pura Vida running on http://localhost:${port}`),
    ),
  )
  .catch((error) => {
    console.error(`Unable to start application: ${error.message}`);
    process.exitCode = 1;
  });
