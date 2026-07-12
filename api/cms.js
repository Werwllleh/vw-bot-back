import express from "express";
import {authenticateAccessToken} from "../services/auth.js";
import {validateData} from "./protect.js";
import {UserCompanies, Users} from "../models.js";
import axios from "axios";
import {CMS_API} from "../utils/consts.js";


const cmsRouter = express.Router();

cmsRouter.post(
  '/attach-user-company',
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
        company: createdCompany?.id,
        // userCompany,
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
        message: 'Ошибка при прикреплении компании',
      });
    }
  },
);

cmsRouter.patch(
  '/attach-user-company',
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

      /*
       * Frontend отправляет:
       *
       * {
       *   id: 15,
       *   data: {
       *     title: "...",
       *     description: "...",
       *     ...
       *   }
       * }
       */
      const {
        id: rawCompanyId,
        data,
      } = req.body ?? {};

      const companyId = Number(rawCompanyId);

      if (
        !Number.isInteger(companyId) ||
        companyId <= 0
      ) {
        return res.status(400).json({
          message: 'Некорректный ID компании',
        });
      }

      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data)
      ) {
        return res.status(400).json({
          message: 'Данные компании не переданы',
        });
      }

      /*
       * Проверяем, что эта компания действительно
       * принадлежит авторизованному пользователю.
       */
      const userCompany = await UserCompanies.findOne({
        where: {
          userId: user.id,
          companyId,
        },
      });

      if (!userCompany) {
        return res.status(403).json({
          message:
            'У вас нет прав на обновление этой компании',
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
      } = data;

      if (
        typeof title !== 'string' ||
        !title.trim()
      ) {
        return res.status(400).json({
          message: 'Название компании обязательно',
        });
      }

      if (
        typeof description !== 'string' ||
        !description.trim()
      ) {
        return res.status(400).json({
          message: 'Описание компании обязательно',
        });
      }

      if (
        !Array.isArray(categories) ||
        !categories.length
      ) {
        return res.status(400).json({
          message:
            'Выберите хотя бы одну категорию',
        });
      }

      if (
        gallery !== undefined &&
        gallery !== null &&
        !Array.isArray(gallery)
      ) {
        return res.status(400).json({
          message: 'Галерея должна быть массивом',
        });
      }

      if (
        contacts !== undefined &&
        contacts !== null &&
        (
          typeof contacts !== 'object' ||
          Array.isArray(contacts)
        )
      ) {
        return res.status(400).json({
          message: 'Некорректный формат контактов',
        });
      }

      if (
        coordinates !== undefined &&
        coordinates !== null &&
        (
          typeof coordinates !== 'object' ||
          Array.isArray(coordinates)
        )
      ) {
        return res.status(400).json({
          message: 'Некорректный формат координат',
        });
      }

      const getRelationId = (value) => {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return null;
        }

        if (
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          return value.id ?? null;
        }

        return value;
      };

      const categoryIds = categories
        .map(getRelationId)
        .filter(
          (id) =>
            id !== null &&
            id !== undefined &&
            id !== '',
        );

      if (!categoryIds.length) {
        return res.status(400).json({
          message:
            'Выберите хотя бы одну категорию',
        });
      }

      const galleryIds = Array.isArray(gallery)
        ? gallery
          .map(getRelationId)
          .filter(
            (id) =>
              id !== null &&
              id !== undefined &&
              id !== '',
          )
        : [];

      const normalizeString = (value) => {
        if (typeof value !== 'string') {
          return null;
        }

        const normalizedValue = value.trim();

        return normalizedValue || null;
      };

      const normalizeCoordinate = (value) => {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return null;
        }

        const parsedValue = Number(value);

        return Number.isFinite(parsedValue)
          ? parsedValue
          : Number.NaN;
      };

      const lat = normalizeCoordinate(
        coordinates?.lat,
      );

      const lng = normalizeCoordinate(
        coordinates?.lng,
      );

      if (
        Number.isNaN(lat) ||
        (
          lat !== null &&
          (lat < -90 || lat > 90)
        )
      ) {
        return res.status(400).json({
          message:
            'Широта должна быть числом от -90 до 90',
        });
      }

      if (
        Number.isNaN(lng) ||
        (
          lng !== null &&
          (lng < -180 || lng > 180)
        )
      ) {
        return res.status(400).json({
          message:
            'Долгота должна быть числом от -180 до 180',
        });
      }

      const normalizedPhones = Array.isArray(
        contacts?.phones,
      )
        ? contacts.phones
          .filter((item) =>
            item?.phone?.trim(),
          )
          .map((item) => ({
            /*
             * Если ID строки пришёл с frontend,
             * сохраняем его.
             */
            ...(
              item.id !== undefined &&
              item.id !== null &&
              item.id !== ''
                ? {
                  id: item.id,
                }
                : {}
            ),

            phone: item.phone.trim(),
          }))
        : [];

      const normalizedEmails = Array.isArray(
        contacts?.emails,
      )
        ? contacts.emails
          .filter((item) =>
            item?.email?.trim(),
          )
          .map((item) => ({
            ...(
              item.id !== undefined &&
              item.id !== null &&
              item.id !== ''
                ? {
                  id: item.id,
                }
                : {}
            ),

            email: item.email.trim(),
          }))
        : [];

      const cmsPayload = {
        title: title.trim(),

        description: description.trim(),

        categories: categoryIds,

        /*
         * null удалит логотип у компании.
         */
        logo: getRelationId(logo),

        /*
         * Пустой массив полностью очистит галерею.
         */
        gallery: galleryIds,

        /*
         * null очистит значение в Payload.
         */
        address: normalizeString(address),

        discount:
          discount === undefined ||
          discount === null ||
          discount === ''
            ? null
            : discount,

        contacts: {
          instagram: normalizeString(
            contacts?.instagram,
          ),

          telegram: normalizeString(
            contacts?.telegram,
          ),

          max: normalizeString(
            contacts?.max,
          ),

          vk: normalizeString(
            contacts?.vk,
          ),

          avito: normalizeString(
            contacts?.avito,
          ),

          site: normalizeString(
            contacts?.site,
          ),

          yandexMaps: normalizeString(
            contacts?.yandexMaps,
          ),

          phones: normalizedPhones,

          emails: normalizedEmails,
        },

        coordinates: {
          lat,
          lng,
        },
      };

      /*
       * Важно:
       *
       * Для обновления конкретной компании
       * ID должен быть в URL:
       *
       * PATCH /api/partner/15
       */
      const cmsResponse = await axios.patch(
        `${CMS_API}/api/partner/${encodeURIComponent(
          String(companyId),
        )}`,
        cmsPayload,
      );

      const updatedCompany =
        cmsResponse.data?.doc ??
        cmsResponse.data;

      if (!updatedCompany?.id) {
        return res.status(502).json({
          message:
            'CMS не вернула обновлённую компанию',
        });
      }

      /*
       * UserCompanies.create здесь не нужен.
       *
       * Связь пользователя с компанией уже существует.
       */
      return res.status(200).json({
        message: 'Компания успешно обновлена',
        company: updatedCompany,
      });
    } catch (error) {
      console.error(
        'Ошибка обновления компании:',
        error?.response?.data ?? error,
      );

      if (res.headersSent) {
        return;
      }

      const cmsStatus =
        error?.response?.status;

      const status =
        Number.isInteger(cmsStatus) &&
        cmsStatus >= 400 &&
        cmsStatus <= 599
          ? cmsStatus
          : 500;

      const cmsMessage =
        error?.response?.data?.errors?.[0]
          ?.message ??
        error?.response?.data?.message;

      return res.status(status).json({
        message:
          cmsMessage ||
          'Ошибка при обновлении компании',
      });
    }
  },
);

export default cmsRouter;
