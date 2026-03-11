import { UserDocument } from "../../models/user.model";

/**
 * Mở rộng interface User của Express để bao gồm các thuộc tính từ UserDocument.
 * Điều này giúp TypeScript nhận diện được req.user có các trường như currentWorkspace, email, name...
 */
declare global {
    namespace Express {
        interface User extends UserDocument {
            _id?: any
        }
    }
}
