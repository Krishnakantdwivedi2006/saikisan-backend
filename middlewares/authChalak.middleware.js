import ChalakModel from "../model/chalak.model.js";

const authChalak = async (req, res, next) => {
  try {

    const userId = req.user.id;
    const chalak = await ChalakModel.findOne({ userId });

    if (!chalak) {
      return res.status(403).json({
        success: false,
        message: "Chalak profile not found. Please register as chalak."
      });
    }

    // attach chalak info to request
    req.chalakId = chalak._id;

    next();

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Chalak verification failed"
    });

  }
};

export default authChalak;