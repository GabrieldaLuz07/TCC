import { getUserData, createUser, updateUser, deleteUser } from '../models';

export const fetchUserData = async (userId) => {
    try {
        const userData = await getUserData(userId);
        return userData;
    } catch (error) {
        throw new Error('Error fetching user data');
    }
};

export const registerUser = async (userDetails) => {
    try {
        const newUser = await createUser(userDetails);
        return newUser;
    } catch (error) {
        throw new Error('Error registering user');
    }
};

export const modifyUser = async (userId, userDetails) => {
    try {
        const updatedUser = await updateUser(userId, userDetails);
        return updatedUser;
    } catch (error) {
        throw new Error('Error updating user');
    }
};

export const removeUser = async (userId) => {
    try {
        await deleteUser(userId);
        return { message: 'User deleted successfully' };
    } catch (error) {
        throw new Error('Error deleting user');
    }
};