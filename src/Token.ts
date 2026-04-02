import jwt from "jsonwebtoken";

export const generate = (user: object | string | Buffer, expiresIn: string = "7d"): string => {
    try {
        const token = jwt.sign(user, process.env.JWT_SECRET as string, {
            expiresIn,
        });
        return token;
    } catch (error) {
        throw new Error('Error generating token');
    }
}

export const verify = (token: string): string | jwt.JwtPayload => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        return decoded;
    } catch (error) {
        console.log({ token });
        throw new Error('Invalid token');
    }
}

export default {
    generate,
    verify
}