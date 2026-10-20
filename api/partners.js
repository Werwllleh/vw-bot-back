import express from "express";
import {authenticateAccessToken} from "../services/auth.js";
import {validateData} from "./protect.js";
import {translite} from "../functions/translite.js";
import {Partners} from "../models.js";
import {randomColor} from "../functions/randomColor.js";
import {isCompanyClaimed} from "../services/companies.js";

const router = express.Router();

// Публичная проверка: занята ли компания (прикреплена ли к какому-либо пользователю).
// Нужна фронту, чтобы скрывать блок «оставить заявку на прикрепление».
router.get('/company/:id/attached', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({error: 'Некорректный id компании'});
  }
  try {
    const attached = await isCompanyClaimed(id);
    return res.status(200).json({attached});
  } catch (error) {
    console.error('Ошибка проверки прикрепления компании', error);
    return res.status(500).json({error: 'internal error'});
  }
});

//добавление партнера
router.post('/partners', authenticateAccessToken, async (req, res) => {
  const hashData = await validateData(req, res);

  const partnerData = req.body;
  const chatId = hashData?.chatId;

  if (!chatId) {
    return res.status(403).json({
      message: 'Неавторизованный пользователь',
    });
  }

  if (!partnerData?.title?.trim()) {
    return res.status(400).json({
      message: 'Название компании обязательно',
    });
  }

  const payload = {
    title: partnerData.title.trim(),
    slug: translite(partnerData.title.trim()),
    description: partnerData?.description?.trim() || "",
    phones: partnerData.phones,
    site: partnerData?.site?.trim() || "",
    instagram: partnerData?.instagram?.trim() || "",
    telegram: partnerData?.telegram?.trim() || "",
    whatsapp: partnerData?.whatsapp?.trim() || "",
    max: partnerData?.max?.trim() || "",
    vk: partnerData?.vk?.trim() || "",
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
