import { AppError } from "../utils/app-error.js";
import { ZodError } from "zod";

// body-parser and anything else built on `http-errors` report the HTTP code as
// a number on `status` (and usually `statusCode` too), and set `expose: true`
// when the message is safe to hand back. AppError uses `status` for its
// "fail" / "error" label instead, so the numeric code has to be read from
// whichever field actually holds a number rather than from `status` alone.
const httpStatusOf = (err) => {
  for (const candidate of [err.statusCode, err.status]) {
    if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
      return candidate;
    }
  }

  return 500;
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }
  // Zod Validation Errors
  else if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      status: "fail",
      message: "Validation Error",
      errors: err.errors || err.issues,
    });
  }
  // Malformed JSON, an oversized body, an unsupported charset: the client's
  // mistake, not the server's. Reporting these as 500 tells the caller to
  // retry something that can never succeed, and buries real server faults in
  // the same metric. `expose` is http-errors' own signal that the message is
  // safe to return.
  else if (err.expose && err.statusCode < 500) {
    res.status(err.statusCode).json({
      success: false,
      status: "fail",
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak details
  else {
    // 1) Log error
    console.error("ERROR", err);

    // 2) Send generic message
    res.status(500).json({
      success: false,
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export const globalErrorHandler = (err, req, res, next) => {
  if (!(err instanceof Error)) {
    err = new Error(typeof err === "string" ? err : "Non-Error value thrown", {
      cause: err,
    });
  }

  err.statusCode = httpStatusOf(err);

  // AppError sets this to "fail" / "error"; a numeric `status` left by
  // http-errors would otherwise be echoed back in the body as if it were one.
  if (typeof err.status !== "string") {
    err.status = err.statusCode >= 500 ? "error" : "fail";
  }

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};
