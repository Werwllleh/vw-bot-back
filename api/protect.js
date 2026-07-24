import express from "express";
import {authenticateAccessToken, verifyToken} from "../services/auth.js";
import {getUserInfo} from "../services/users.js";
import {getUserCompanyInfo} from "../services/cms.js";


export const protectRouter = express.Router();

protectRouter.use('/protect', (req, res, next) => {
  /*console.log('Request URL:', req.originalUrl);
  console.log('Request Type:', req.method);*/
  next();
});


export const validateData = async (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({error: 'jwt expired'});
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return res.status(401).json({error: 'jwt invalid'});
  }

  return decoded;
}


protectRouter.use('/protect', authenticateAccessToken);

protectRouter.post('/protect/user', async (req, res) => {

  const hashData = await validateData(req, res);

  const userData = await getUserInfo(hashData.chatId);

  if (!userData) {
    return res.status(404).json({error: 'User not found'});
  }

  let userCompanies = []

  if (userData?.companies?.length) {
    for (const company of userData.companies) {
      try {
        const result = await getUserCompanyInfo(company.companyId);
        if (result) {
          userCompanies.push(result);
        }
      } catch (error) {
        console.error(`Ошибка при получении данных компании ${company.id}:`, error);
      }
    }
  }

  res.status(200).json({
    user: {
      data: userData,
      userPhoto: hashData.photo,
      companies: userCompanies || []
    }
  });
});

export default protectRouter;
