import express from "express";
import {addPartnerCategory, getPartnersCategories} from "../db/partners-methods.js";

const router = express.Router();

router.post("/get-partners-categories", async (req, res) => {
  try {
    const data = await getPartnersCategories();
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send(err);
  }
})

router.post("/add-partner-category", async (req, res) => {
  try {
    const data = req.body;

    const chatId = data.chatId;
    const category = data.category;

    const addFunc = await addPartnerCategory(chatId, category);

    if (addFunc) {
      return res.status(200).send("OK");
    } else {
      return res.status(500).send();
    }

  } catch (err) {
    return res.status(500).send(err);
  }
})

export default router;
