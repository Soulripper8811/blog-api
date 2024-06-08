const Post = require("../models/postModel");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/ErrorModel");

//post: http://localhost:5000/api/posts/
// protected
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(
        new HttpError("fill in all the details and choose thumbnail")
      );
    }
    const { thumbnail } = req.files;
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError("thumbnail too big.File Should be less then 2mb")
      );
    }
    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail: newFilename,
            creator: req.user.id,
          });
          const currenUser = await User.findById(req.user.id);
          const userPostCount = currenUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, {
            posts: userPostCount,
          });
          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};
//get: http://localhost:5000/api/posts/
// protected
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};
//get: http://localhost:5000/api/posts/:id
// unprotected
const getPost = async (req, res, next) => {
  res.json("get single post");
};
//get: http://localhost:5000/api/posts/categories/:category
// unprotected
const getCatPost = async (req, res, next) => {
  res.json("get catgory post");
};
//get: http://localhost:5000/api/posts/user/:id
// unprotected
const getUserPosts = async (req, res, next) => {
  res.json("get user post");
};
//patch: http://localhost:5000/api/posts/:id
// protected
const editPost = async (req, res, next) => {
  res.json("edit  post");
};
//delete: http://localhost:5000/api/posts/:id
// protected
const deletePost = async (req, res, next) => {
  res.json("delete  post");
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  getUserPosts,
  editPost,
  deletePost,
  getCatPost,
};
