import express from "express";
import {createPartner, addPartnerCategory, deletePartnerCategory, getPartnersCategories} from "../db/partners-methods.js";

const router = express.Router();

router.get("/get-partners-categories", async (req, res) => {
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

    const createPartnerCategory = await addPartnerCategory(chatId, category);

    if (createPartnerCategory) {
      return res.status(200).send("OK");
    } else {
      return res.status(500).send();
    }

  } catch (err) {
    return res.status(500).send(err);
  }
})

router.post("/delete-partner-category", async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const chatId = req.body.chatId;

    await deletePartnerCategory(chatId, categoryId);

    return res.status(200).send("OK");

  } catch (err) {
    return res.status(500).send(err);
  }
})

router.post("/add-partner", async (req, res) => {
  try {


    const chatId = req.body.chatId;
    const data = req.body.data;

    const create = await createPartner(chatId, data);

    if (create) {
      return res.status(200).send(create);
    } else {
      return res.status(500).send();
    }

  } catch (err) {
    return res.status(500).send(err);
  }
})

export default router;
