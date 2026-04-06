import jwt from "jsonwebtoken";
let jwtSecret: string = process.env.JWT_SECRET ?? "";
export function config(secret: string) {
    jwtSecret = secret;
}
export const generate = (user: object | string | Buffer, expiresIn: string = "7d"): string => {
    try {
        const token = jwt.sign(user, jwtSecret, {
            expiresIn,
        });
        return token;
    } catch (error) {
        throw new Error('Error generating token');
    }
}

export const verify = (token: string): string | jwt.JwtPayload => {
    try {
        const decoded = jwt.verify(token, jwtSecret);
        return decoded;
    } catch (error) {
        console.log({ token });
        throw new Error('Invalid token');
    }
}

export default {
    config,
    generate,
    verify
}