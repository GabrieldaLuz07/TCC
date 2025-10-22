import { getAllItems, getItemById, createItem, updateItem, deleteItem } from '../services/index.js';

export const fetchAllItems = async (req, res) => {
    try {
        const items = await getAllItems();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error });
    }
};

export const fetchItemById = async (req, res) => {
    try {
        const item = await getItemById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching item', error });
    }
};

export const createNewItem = async (req, res) => {
    try {
        const newItem = await createItem(req.body);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: 'Error creating item', error });
    }
};

export const updateExistingItem = async (req, res) => {
    try {
        const updatedItem = await updateItem(req.params.id, req.body);
        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating item', error });
    }
};

export const deleteExistingItem = async (req, res) => {
    try {
        const deletedItem = await deleteItem(req.params.id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item', error });
    }
};