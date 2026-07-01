import { check } from "express-validator";

const Check = [
  check("email", "Please provide a valid email").isEmail(),
  check(
    "password",
    "Password must be at least 8 characters with 1 upper case letter and 1 number",
  ).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
];

export { Check };