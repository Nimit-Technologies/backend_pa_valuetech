import { AppError } from "../utils/app-error.js";
import { ZodError } from "zod";

const sendErrorDev = (err, res) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    status: err instanceof AppError ? err.status : "error",
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
  // Defensive: this is the last error handler in the chain, so if
  // something upstream does `throw "a string"` / `throw { ... }` instead
  // of `throw new Error(...)`, `err` won't be an Error instance. Assigning
  // `err.statusCode` on a primitive throws (ES modules are always strict
  // mode), which would otherwise blow up this handler itself. AppError,
  // ZodError, and Prisma's errors are all real Error subclasses, so this
  // only ever kicks in for a genuinely non-Error throw.
  if (!(err instanceof Error)) {
    err = new Error(typeof err === "string" ? err : "Non-Error value thrown", {
      cause: err,
    });
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    // Clone error to preserve prototype if possible, but simplest is to pass err directly
    // or handle specific types. ZodError needs special handling as it doesn't inherit AppError.

    // In a real app we might want to cast specific errors (like Mongoose CastError) to AppError here

    sendErrorProd(err, res);
  }
};
