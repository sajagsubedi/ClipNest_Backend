import mongoose from "mongoose";
import Tweet from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//-----------CONTROLLERS--------------

//CONTROLLER 1: TO CREATE TWEET BY POST IN "api/v1/tweets/"
export const createTweet = async (req, res) => {
  const { content } = req.body;

  if (!content) throw new ApiError(400, "content is required!");

  const newTweet = await Tweet.create({ content, owner: req?.user?._id });

  if (!newTweet)
    throw new ApiError(
      400,
      "Error creating tweet. Please try again after sometime !"
    );

  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully!"));
};

//CONTROLLER 2: TO GET USERS TWEET BY GET IN "/api/v1/tweets/users/:userId"
export const getUserTweets = async (req, res) => {
  const { userId } = req.params;

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        ownerDetails: {
          $first: "$ownerDetails",
        },
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id || "", "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        ownerDetails: {
          fullName: 1,
          username: 1,
          avatar: {
            url: 1,
          },
          email: 1,
        },
        isLiked: 1,
        likesCount: 1,
      },
    },
  ]);

  
  return res
    .status(200)
    .json(new ApiResponse(201, userTweets, "Tweets fetched successfully!"));
};
