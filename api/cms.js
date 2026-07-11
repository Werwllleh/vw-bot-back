import express from "express";
import {authenticateAccessToken} from "../services/auth.js";
import {validateData} from "./protect.js";
import {UserCompanies, Users} from "../models.js";
import axios from "axios";
import {CMS_API, CMS_API_TOKEN} from "../utils/consts.js";


const router = express.Router();

router.post(
  '/attach-company',
  authenticateAccessToken,
  async (req, res) => {

    try {
      const hashData = await validateData(req, res);

      if (!hashData) {
        if (!res.headersSent) {
          return res.status(401).json({
            message: 'Не удалось проверить пользователя',
          });
        }

        return;
      }

      const chatId = hashData.chatId;

      if (!chatId) {
        return res.status(401).json({
          message: 'Не удалось определить пользователя',
        });
      }

      const user = await Users.findOne({
        where: {
          chatId,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: 'Пользователь не найден',
        });
      }

      const {
        title,
        description,
        categories,
        logo,
        gallery,
        address,
        discount,
        contacts,
        coordinates,
      } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({
          message: 'Название компании обязательно',
        });
      }

      if (!description?.trim()) {
        return res.status(400).json({
          message: 'Описание компании обязательно',
        });
      }

      if (!Array.isArray(categories) || !categories.length) {
        return res.status(400).json({
          message: 'Выберите хотя бы одну категорию',
        });
      }

      const cmsPayload = {
        title: title.trim(),
        description: description.trim(),
        categories,

        logo: logo || undefined,

        gallery:
          Array.isArray(gallery) && gallery.length
            ? gallery
            : undefined,

        address: address?.trim() || undefined,
        discount: discount || undefined,

        contacts: {
          instagram:
            contacts?.instagram?.trim() || undefined,

          telegram:
            contacts?.telegram?.trim() || undefined,

          max:
            contacts?.max?.trim() || undefined,

          vk:
            contacts?.vk?.trim() || undefined,

          avito:
            contacts?.avito?.trim() || undefined,

          site:
            contacts?.site?.trim() || undefined,

          yandexMaps:
            contacts?.yandexMaps?.trim() || undefined,

          phones: Array.isArray(contacts?.phones)
            ? contacts.phones
              .filter((item) => item?.phone?.trim())
              .map((item) => ({
                phone: item.phone.trim(),
              }))
            : [],

          emails: Array.isArray(contacts?.emails)
            ? contacts.emails
              .filter((item) => item?.email?.trim())
              .map((item) => ({
                email: item.email.trim(),
              }))
            : [],
        },

        coordinates: {
          lat: coordinates?.lat ?? undefined,
          lng: coordinates?.lng ?? undefined,
        },
      };

      const cmsResponse = await axios.post(
        `${CMS_API}/api/partner`,
        cmsPayload,
      );

      const createdCompany = cmsResponse.data?.doc ?? cmsResponse.data;

      if (!createdCompany?.id) {
        return res.status(502).json({
          message: 'CMS не вернула ID созданной компании',
        });
      }

      const userCompany = await UserCompanies.create({
        userId: user.id,
        companyId: createdCompany.id,
      });

      return res.status(201).json({
        message: 'Компания успешно создана',
        company: createdCompany,
        userCompany,
      });
    } catch (error) {
      console.error(
        'Ошибка attach-company:',
        error?.response?.data ?? error,
      );

      if (res.headersSent) {
        return;
      }


      return res.status(
        error?.response?.status || 500,
      ).json({
        message:
          error?.response?.data?.errors?.[0]?.message ||
          error?.response?.data?.message ||
          error?.message ||
          'Ошибка при прикреплении компании',
      });
    }
  },
);

export default router;
