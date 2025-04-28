import express from "express";
import {
  addPartnerCategory,
  deletePartnerCategory,
  getPartnersCategories,
  getPartnersWithCategories,
  createUpdatePartner,
  deletePartner, getPartnersForUsers, updatePartnerStatus, getPartners, getPartner
} from "../db/partners-methods.js";
import {verifyToken} from "../functions/authorization.js";

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

router.post("/update-partner-status", async (req, res) => {
  try {

    const chatId = req.body.chatId;
    const partnerId = req.body.partnerId;
    const data = req.body.data;

    const updatePartnerStatusFunc = await updatePartnerStatus(chatId, partnerId, data);

    if (updatePartnerStatusFunc) {
      return res.status(200).send(updatePartnerStatusFunc);
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

//site

router.post('/partners', async (req, res) => {


  const filter = req.body;

  if (filter) {
    const filteredPartners = await getPartners(filter);

    if (!filteredPartners.length) {
      return res.status(200).json(null);
    }

    return res.status(200).json(filteredPartners);
  } else {
    const partners = await getPartners();

    if (!partners) {
      return res.status(404).json({ error: 'Partners not found' });
    }

    return res.status(200).json(partners);
  }
});

router.post('/partner', async (req, res) => {

  const {slug} = req.body;

  const partner = await getPartner(slug);

  if (!partner) {
    return res.status(404).json({ error: 'Partner not found' });
  }

  res.status(200).json(partner);
});


export default router;
