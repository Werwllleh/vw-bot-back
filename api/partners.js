import express from "express";
import {

} from "../db/partners-methods.js";
import {validateData} from "./protect.js";
import {translite} from "../functions/translite.js";
import {Partners} from "../models.js";
import {randomColor} from "../functions/randomColor.js";

const router = express.Router();

//добавление партнера
router.post('/partners', async (req, res) => {

  const hashData = await validateData(req, res);

  const partnerData = req.body;
  const chatId = hashData.chatId;

  if (!chatId) {
    return res.status(403).json({
      message: 'Неавторизованный пользователь',
    });
  }

  const payload = {
    title: partnerData.title.trim(),
    slug: translite(partnerData.title.trim()),
    description: partnerData?.description?.trim() || "",
    phones: partnerData.phones,
    site: partnerData?.site?.trim() || "",
    instagram: partnerData?.instagram?.trim() || "",
    telegram: partnerData?.instagram?.trim() || "",
    whatsapp: partnerData?.instagram?.trim() || "",
    max: partnerData?.instagram?.trim() || "",
    vk: partnerData?.instagram?.trim() || "",
    yandex_profile: partnerData?.yandex_profile?.trim() || "",
    address: partnerData?.address?.trim() || "",
    coordinates: partnerData?.coordinates?.trim() || "",
    chatId: chatId
  }

  try {
    await Partners.create(payload);
    return res.status(200).json();
  } catch (error) {
    console.error('Ошибка при создании партнера', error);
    return res.status(500).json({
      message: 'Ошибка при создании партнера',
    });
  }
});


export default router;
