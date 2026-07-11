import {CMS_API, CMS_API_TOKEN} from "../utils/consts.js";

export const createCmsPartner = async (data) => {
  const response = await fetch(
    `${CMS_API}/api/partner`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CMS_API_TOKEN}`,
      },

      body: JSON.stringify(data),
    },
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      result?.errors?.[0]?.message ||
      result?.message ||
      'Не удалось создать компанию в CMS',
    );

    error.status = response.status;
    error.data = result;

    throw error;
  }

  return result?.doc ?? result;
};
