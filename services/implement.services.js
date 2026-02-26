import ImplementsModel from "../model/implements.model.js";

class ImplementServices {
    static async create(data) {
        return await ImplementsModel.create(data);
    }

    static async update(id, updateData) {
        // Find and update in one atomic operation
        const updatedDoc = await ImplementsModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true, lean: true }
        );
        return updatedDoc;
    }

    static async delete(id) {
        return await ImplementsModel.findByIdAndDelete(id);
    }

    static async getById(id) {
        return await ImplementsModel.findById(id).lean();
    }

    static async getAll(query = {}) {
    const { category, equipmentName, rateType, sort } = query;
    let filters = {};

    if (category) {
        // If it's a comma-separated string, turn it into an array
        const categoryArray = category.split(',');
        filters.category = { $in: categoryArray }; 
    }
    
    if (equipmentName) filters.equipmentName = equipmentName;
    if (rateType) filters.rateType = rateType;

    return await ImplementsModel.find(filters)
        .sort(sort || "-createdAt")
        .lean();
}
}

export default ImplementServices;