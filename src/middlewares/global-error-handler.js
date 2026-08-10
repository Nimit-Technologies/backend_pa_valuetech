import { AppError } from "../utils/app-error.js";
import { ZodError } from "zod";

const sendErrorDev = (err, res) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;

    res.status(statusCode).json({
        success: false,
        status: err instanceof AppError ? err.status : 'error',
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
            status: 'fail',
            message: 'Validation Error',
            errors: err.errors || err.issues,
        });
    }
    // Programming or other unknown error: don't leak details
    else {
        // 1) Log error
        console.error('ERROR 💥', err);

        // 2) Send generic message
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        // Clone error to preserve prototype if possible, but simplest is to pass err directly
        // or handle specific types. ZodError needs special handling as it doesn't inherit AppError.

        // In a real app we might want to cast specific errors (like Mongoose CastError) to AppError here

        sendErrorProd(err, res);
    }
};
