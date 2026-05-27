import mongoose from "mongoose";

const kisanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    fcmToken: {
        type: String,
        default: null
    },
    walletBalance: {
        type: Number,
        default: 0
        
    },
    saikisanCoin: {
        type: Number,
        default: 0
    },
    savedAddresses: [
        {
            label: {
                type: String,
                trim: true
            },
            location: {
                type: String,
                trim: true
            },
            coordinates: {
                type: [Number]
            }
        }
    ],
    wishlistFields: [
        {
            area: {
                type: Number,
                required: true
            },

            polygon: {
                type: {
                    type: String,
                    enum: ['Polygon'],
                    required: true,
                    default: 'Polygon'
                },

                coordinates: {
                    type: [[[Number]]],
                    required: true,
                    validate: {
                        validator: function (coords) {
                            // must have at least one linear ring
                            if (!coords || !coords.length) return false;

                            const ring = coords[0];

                            // polygon needs minimum 4 points
                            if (ring.length < 4) return false;

                            const first = ring[0];
                            const last = ring[ring.length - 1];

                            // first & last point must match
                            return first[0] === last[0] && first[1] === last[1];
                        },
                        message: 'Invalid GeoJSON Polygon'
                    }
                }
            },

            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5
    },
    currentLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [lng, lat]
            default: [0, 0]
        }
    },
    totalBookings: {
        type: Number,
        default: 0
    },
    canceledBookings: {
        type: Number,
        default: 0
    },
    defaultPaymentMethod: {
        type: String,
        enum: ["upi", "card", "cash", "netbanking", "wallet"],
        default: "cash",
    },
    verificationStatus: {
        type: String,
        enum: ["pending", "verified", "rejected", "blocked"],
        default: "pending"
    }
}, { timestamps: true });

kisanSchema.index({ currentLocation: "2dsphere" });
kisanSchema.index({ "wishlistFields.polygon": "2dsphere" });

const KisanModel = mongoose.model("Kisan", kisanSchema);

export default KisanModel;