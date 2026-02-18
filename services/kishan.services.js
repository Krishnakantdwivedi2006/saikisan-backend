import KishanModel from "../model/kishan.model.js";
import mongoose from "mongoose";

class KishanServices {

    // models/Kishan.js
    static currentLocation = async ({ userId, coordinates }) => {
        // 1. Validate input structure
        if (!coordinates || coordinates.lat === undefined || coordinates.lng === undefined) {
            const error = new Error("Invalid coordinates format. Expected {lat, lng}");
            error.statusCode = 400;
            throw error;
        }

        // 2. Prepare GeoJSON (Longitude FIRST for MongoDB)
        const geoPoint = {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
        };

        // 3. Update or Create
        const kishan = await KishanModel.findOneAndUpdate(
            { userId },
            { $set: { currentLocation: geoPoint } }, // Correct field name from your schema
            { new: true, upsert: true, runValidators: true }
        );

        if (!kishan) {
            const error = new Error("Failed to update user location profile");
            error.statusCode = 500;
            throw error;
        }

        return kishan;
    };

    static findNearby = async (lng, lat, maxDistanceInMeters = 5000) => {
        return await KishanModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat]
                    },
                    $maxDistance: maxDistanceInMeters
                }
            }
        });
    };

    static deleteSavedAddress = async ({
        addressId, kishan
    }) => {
        if (!addressId) {
            throw new Error("AddressId is not provided");
        }

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid addressId");
        }

        const addressObjectId = new mongoose.Types.ObjectId(addressId);

        const beforeLength = kishan.savedAddresses.length;

        kishan.savedAddresses.pull({ _id: addressObjectId });
        await kishan.save();

        if (kishan.savedAddresses.length === beforeLength) {
            throw new Error("Address not found");
        }

        return true;
    };

    static fetchBalance = async (userId) => {
        // 1. Look up the wallet for the specific user
        const wallet = await KishanModel.findOne({ userId: userId });
        // console.log(wallet);        

        if (!wallet) {
            const error = new Error("Wallet not found");
            error.statusCode = 404;
            throw error;
        }

        // 2. Return the relevant data
        return {
            balance: wallet.walletBalance,
            currency: wallet.currency || 'INR',
            lastUpdated: wallet.updatedAt
        };
    };

}

export default KishanServices;
