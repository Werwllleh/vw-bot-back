const express = require("express");
const {cars} = require("../utils/consts");
const router = express.Router();

router.get("/get-cars", async (req, res) => {
  try {
    return res.json(cars);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
