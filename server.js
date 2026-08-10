import app from "./src/app.js";
import { CREDENTIALS } from "./src/constant/credentials.js";

if (
  !CREDENTIALS.BACKEND_BASE_URL ||
  CREDENTIALS.BACKEND_BASE_URL === undefined ||
  CREDENTIALS.BACKEND_BASE_URL === null ||
  CREDENTIALS.BACKEND_BASE_URL === ""
) {
  console.error(`backend base url is not defined in the environment`);
}
if (
  !CREDENTIALS.PORT ||
  CREDENTIALS.PORT === undefined ||
  CREDENTIALS.PORT === null ||
  CREDENTIALS.PORT === ""
) {
  console.error(`backend port is not defined in the environment`);
}

app.listen(CREDENTIALS.PORT, () => {
  console.log(
    `Server running on port ${CREDENTIALS.BACKEND_BASE_URL}:${CREDENTIALS.PORT}`,
  );
});
