import express from "express";
import {
  addPartnerCategory,
  deletePartnerCategory,
  getPartnersCategories,
  getPartnersWithCategories,
  createUpdatePartner,
  deletePartner, getPartnersForUsers
} from "../db/partners-methods.js";

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
    const partnerId = req.body.partnerId;

    const createUpdatePartnerStatus = await createUpdatePartner(chatId, data, partnerId);

    if (createUpdatePartnerStatus) {
      return res.status(200).send(createUpdatePartnerStatus);
    } else {
      return res.status(500).send();
    }

  } catch (err) {
    return res.status(500).send(err);
  }
})

router.post("/delete-partner", async (req, res) => {
  try {

    const chatId = req.body.chatId;
    const partnerId = req.body.partnerId;

    const deleteStatus = await deletePartner(chatId, partnerId);

    if (deleteStatus) {
      return res.status(200).send(deleteStatus);
    } else {
      return res.status(500).send();
    }

  } catch (err) {
    return res.status(500).send(err);
  }
})

router.get("/get-partners-admin", async (req, res) => {
  try {
    const data = await getPartnersWithCategories();
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send(err);
  }
})

router.get("/get-partners-users", async (req, res) => {
  try {
    const data = await getPartnersForUsers();
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send(err);
  }
})

export default router;
