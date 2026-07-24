import {Users, UserCompanies} from '../models.js';
import {getUserCompanyInfo} from './cms.js';

// Прикреплена ли компания (companyId из CMS) хоть к какому-нибудь пользователю.
export const isCompanyClaimed = async (companyId) => {
  const id = Number(companyId);
  if (!Number.isInteger(id) || id <= 0) return false;
  const count = await UserCompanies.count({where: {companyId: id}});
  return count > 0;
};

// Прикрепление компании (companyId из CMS) к пользователю по chatId.
// Идемпотентно (unique userId+companyId). Бросает Error с кодом-строкой.
export const attachCompany = async (chatId, companyId) => {
  const id = Number(companyId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('INVALID_COMPANY_ID');

  const user = await Users.findOne({where: {chatId}});
  if (!user) throw new Error('USER_NOT_FOUND');

  // Проверяем, что такая компания есть в CMS (иначе прикрепляем «пустышку»).
  const company = await getUserCompanyInfo(id);
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const [row, created] = await UserCompanies.findOrCreate({
    where: {userId: user.id, companyId: id},
    defaults: {userId: user.id, companyId: id},
  });

  return {userId: user.id, companyId: row.companyId, created};
};

// Открепление компании от пользователя по chatId.
export const detachCompany = async (chatId, companyId) => {
  const id = Number(companyId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('INVALID_COMPANY_ID');

  const user = await Users.findOne({where: {chatId}});
  if (!user) throw new Error('USER_NOT_FOUND');

  const removed = await UserCompanies.destroy({where: {userId: user.id, companyId: id}});

  return {userId: user.id, companyId: id, removed: removed > 0};
};
