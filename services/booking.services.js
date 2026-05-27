import BookingModel from "../model/booking.model.js";
import ChalakModel from "../model/chalak.model.js";
import { NotificationService } from "../connectons/connectFirebase.js";
import KisanModel from "../model/kisan.model.js";
import { v4 as uuidv4 } from "uuid";

const ROLE_MODEL = {
  chalak: ChalakModel,
  kisan: KisanModel
};

class BookingServices {
  static BATCH_SIZE = 3;
  static BATCH_DELAY = 20000;

  // CORE MATCHING ENGINE

  static async startChalakMatching(bookingId, location) {
    console.log(`🚀 Dispatch Engine Started for Booking: ${bookingId}`);

    const chalaks = await this.findNearbyChalaks(location);

    if (!chalaks.length) {
      console.log("⚠️ No online chalaks found in 5km radius.");
      return;
    }

    // Log online chalaks as requested
    console.log("📱 Online Chalaks found:", chalaks.map(c => ({ id: c._id })));

    // Run the batching in the background
    this.dispatchInBatches(chalaks, bookingId);
  }

  static async dispatchInBatches(allChalaks, bookingId) {
    let index = 0;

    while (index < allChalaks.length) {
      // 🛡️ RE-VALIDATE: Check if booking was already accepted by someone else
      const booking = await BookingModel.findById(bookingId);
      if (!booking || booking.bookingStatus !== "searching") {
        console.log(`🛑 Stopping dispatch: Booking ${bookingId} is no longer searching.`);
        break;
      }

      const batch = allChalaks.slice(index, index + this.BATCH_SIZE);
      console.log(`📢 Notifying Batch ${Math.floor(index / this.BATCH_SIZE) + 1} (${batch.length} drivers)`);

      await this.notifyChalakBatch(batch, bookingId);

      // Wait for the next batch "ripple"
      await new Promise(res => setTimeout(res, this.BATCH_DELAY));
      index += this.BATCH_SIZE;
    }
  }

  static async acceptBooking(bookingId, chalakId) {
    // Atomic update ensures only ONE driver can ever take this booking
    return await BookingModel.findOneAndUpdate(
      { _id: bookingId, bookingStatus: "searching" },
      {
        bookingStatus: "accepted",
        chalakId: chalakId,
        acceptedAt: new Date()
      },
      { new: true }
    );
  }

  static async denyBooking(bookingId, chalakId) {
    return await BookingModel.findOneAndUpdate(
      { _id: bookingId, bookingStatus: "searching" },
      {
        $push: { rejectedChalaks: chalakId } 
      },
      { new: true }
    );
}

  static async findNearbyChalaks(location) {
    return await ChalakModel.find({
      availability: "ONLINE",
      currentLocation: {
        $near: {
          $geometry: location,
          $maxDistance: 5000 // 5km
        }
      }
    });
  }

  static async notifyChalakBatch(chalaks, bookingId) {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) return;
    const measure = booking.serviceType === "field_work" ? (booking.landArea ? `${booking.landArea} Acres` : "N/A") : `${booking.landArea} Km`;

    // 👉 Dummy values for now (later calculate real distance via geo)
    const payloadTemplate = {
      notificationId: uuidv4(),
      screen: "NEW_BOOKING",
      bookingId: bookingId.toString(),
      bookingType: booking.serviceType || "General",
      measure: measure,
      distance: "2.5 km",
      amount: booking.amount || "N/A",
      type: "BOOKING_REQUEST"
    };

    console.log("Payload for notification: ", payloadTemplate);

    const tokens = chalaks.map(c => c.fcmToken).filter(Boolean);
    if (!tokens.length) return;

    await NotificationService.sendMulticast(
      tokens,
      "🚜 New Booking Nearby",
      `${payloadTemplate.bookingType} job ${payloadTemplate.distance} away in ${payloadTemplate.area}`,
      payloadTemplate
    );
  }

  static async getAllBookings(appType, userId) {


      const RoleModel = ROLE_MODEL[appType];
      if (!RoleModel) {
          throw new Error("Invalid app type");
      }

  }
}

export default BookingServices; 