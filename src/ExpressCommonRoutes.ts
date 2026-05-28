import { Request, Response, NextFunction } from "express";
import eventStream from "./EventStream.js";

export async function fallbackRoute(req: Request, res: Response) {
    eventStream.emitEvent("fallback", {
        headers: req.headers,
        data: req.body
    })
    return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
}

export function errorRoute(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const {
        status: statusCode, message
    } = error;
    eventStream.emitEvent("error", error)
    return res
        .status(statusCode ?? 404)
        .json({
            status: "error",
            message
        });
}