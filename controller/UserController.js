const HttpError = require("../models/ErrorModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

// api:http://localhost:5000/api/users/register
//unprotected
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;
    if (!name || !email || !password || !password2) {
      return next(new HttpError("Fill in all fields", 422));
    }
    const newEmail = email.toLowerCase();
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new HttpError("Email already exist", 422));
    }
    if (password.trim().length < 6) {
      return next(new HttpError("password should be at least 6 character"));
    }
    if (password !== password2) {
      return next(new HttpError("password does not match.", 422));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
    });
    res.status(201).json(`New user -${newEmail} Registerd.`);
  } catch (error) {
    return next(new HttpError("User Registration failed", 422));
  }
};
// api:http://localhost:5000/api/users/login
//unprotected
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Fill in all field", 422));
    }
    const newEmail = email.toLowerCase();
    const user = await User.findOne({ email: newEmail });
    if (!user) {
      return next(new HttpError("Invalid credentials"));
    }
    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return next(new HttpError("Invalid credentials"));
    }
    const { _id: id, name } = user;
    const token = await jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      token,
      id,
      name,
    });
  } catch (error) {}
};

// api:http://localhost:5000/api/users/:id
//protected
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return next(new HttpError("user Not Found", 404));
    }
    res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// api:http://localhost:5000/api/users/authors
//unprotected
const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-password");
    res.status(200).json(authors);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// api:http://localhost:5000/api/users/change-avatar
//protected
const changeAvatar = async (req, res, next) => {
  try {
    if (!req.files.avatar) {
      return next(new HttpError("please choose an image", 422));
    }
    // find the user
    const user = await User.findById(req.user.id);
    //delete if any photo was their
    if (user.avatar) {
      fs.unlink(path.join(__dirname, "..", "uploads", user.avatar), (err) => {
        if (err) {
          return next(new HttpError(err));
        }
      });
    }
    const { avatar } = req.files;
    // check file size
    if (avatar.size > 500000) {
      return next(
        new HttpError("Profile picture too big.Should be less than 500kb")
      );
    }
    let filename = avatar.name;
    let splittedName = filename.split(".");
    let newFileName =
      splittedName[0] + uuid() + "." + splittedName[splittedName.length - 1];
    avatar.mv(
      path.join(__dirname, "..", "uploads", newFileName),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        }
        const updatedAvatar = await User.findByIdAndUpdate(
          req.user.id,
          { avatar: newFileName },
          { new: true }
        );
        if (!updatedAvatar) {
          return next(new HttpError("Avatar could't be changed", 422));
        }
        res.status(200).json(updatedAvatar);
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

// api:http://localhost:5000/api/users/edit-user
//protected
const editUser = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, confirmNewPassword } =
      req.body;
    if (
      !name ||
      !email ||
      !currentPassword ||
      !newPassword ||
      !confirmNewPassword
    ) {
      return next(new HttpError("Fill al the field", 422));
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found", 403));
    }
    const emailExisted = await User.findOne({ email });
    if (emailExisted && emailExisted._id !== req.user.id) {
      return next(new HttpError("Email already Existed", 422));
    }
    const ValidateUserPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!ValidateUserPassword) {
      return next(new HttpError("Invalid Current password", 422));
    }
    if (confirmNewPassword !== newPassword) {
      return next(new HttpError("New password do not match", 422));
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const newInfo = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, password: hashedPassword },
      { new: true }
    );
    res.status(200).json(newInfo);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  getAuthors,
  editUser,
};
