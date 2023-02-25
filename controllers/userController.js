const userModel = require('./../models/userModel');

exports.getAllUsers = async (req, res) => {
  const users = await userModel.find();
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
};
