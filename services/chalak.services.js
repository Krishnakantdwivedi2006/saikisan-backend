import ChalakModel from "../model/chalak.model.js";

export const createChalakProfile = async ({
    userId,
    vehicleType,
    documents,
    currentLocation,
}) => {
    if (!userId || !vehicleType) {
        throw new Error("All fields required");
    }
    
    const chalak = await ChalakModel.create({
        userId,
        vehicleType,
        documents,
        currentLocation,
    });

    return chalak;
};