import app from "./src/app.js";
import { CREDENTIALS } from "./src/constant/credentials.js";

app.listen(CREDENTIALS.PORT, () => {
  console.log(`Server running on port http://localhost:${CREDENTIALS.PORT}`);
});
