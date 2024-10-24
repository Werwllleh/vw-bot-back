const express = require("express");
const {cars} = require("../utils/consts");
const {v4: uuidv4} = require("uuid");
const fs = require('fs');
const path = require("path");
const {access, unlink} = require("fs");
const router = express.Router();

router.get("/get-cars", async (req, res) => {
  try {
    return res.json(cars);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/upload", async (req, res) => {
  try {
    if (req.files.avatar) {
      const image = req.files.avatar;
      const format = image.name.split(".").pop();
      const imageFinalFile = `${uuidv4(image.name)}.${format}`;

      const uploadDir = path.resolve(__dirname, "..", "img/cars");

      // Проверяем, существует ли директория
      if (!fs.existsSync(uploadDir)) {
        // Если директория не существует, создаем её
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      await image.mv(
        path.resolve(__dirname, "..", "img/cars", imageFinalFile)
      );

      return res.json(imageFinalFile);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/upload/remove", async (req, res) => {
  try {
    const imageFile = req.body.fileName;

    if (imageFile) {
      access(
        path.resolve(__dirname, "..", "img/cars", imageFile),
        (err) => {
          if (err) {
            return res.json("err");
          }
          unlink(
            path.resolve(__dirname, "..", "img/cars", imageFile),
            (err) => {
              if (!err) {
                return res.json({status: "delete"});
              } else {
                return console.log(err);
              }
            }
          );
        }
      );
    }

  } catch (error) {
    console.log(error);
  }
});


module.exports = router;
