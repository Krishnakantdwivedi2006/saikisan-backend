import KisanModel from "../model/kisan.model.js";

const authKisan = async (req, res, next) => {
  try {

    const userId = req.user.id;
    const kisan = await KisanModel.findOne({ userId });

    if (!kisan) {
      return res.status(403).json({
        success: false,
        message: "Kisan profile not found. Please register as kisan."
      });
    }

    // attach kisan info to request
    req.kisanId = kisan._id;
    console.log("kisan id :",  req.kisanId);
    
    next();

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "kisan verification failed"
    });

  }
};

export default authKisan;