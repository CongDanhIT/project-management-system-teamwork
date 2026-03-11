import { v4 as uuidv4 } from "uuid";

export const generateInviteCode = (): string => {
    return uuidv4().slice(0, 8).toUpperCase();
};
