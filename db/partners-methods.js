import {PartnerCategoryConnect, Partners, PartnersCategories} from '../models.js';
import {getUserInfo} from "./user-methods.js";
import {getRandomColor} from "../functions/randomColor.js";
import {translite} from "../functions/translite.js";


const adminId = process.env.ADMIN;

export const getPartnersCategories = async () => {
  try {

    const partnersCategories = await PartnersCategories.findAll();
    return partnersCategories;

  } catch (err) {
    console.error('Ошибка при получении категорий партнеров', err);
  }
}

export const addPartnerCategory = async (chatId, category) => {
  try {

    const userInfo = await getUserInfo(chatId);

    if (userInfo.user_admin) {
      await PartnersCategories.create({
        label: category.value,
        value: translite(category.value),
      });

      return true;
    } else {
      return false;
    }

  } catch (err) {
    console.error('Ошибка при добавлении категории партнеров', err);
  }
}

export const deletePartnerCategory = async (chatId, categoryId) => {
  try {

    const checkUser = await getUserInfo(chatId);

    if (checkUser && checkUser.user_admin) {
      await PartnersCategories.destroy({
        where: {id: categoryId},
      });
      return true;
    } else {
      return false;
    }

  } catch (err) {
    console.error('Ошибка при получении категорий партнеров', err);
  }
}

export const createPartner = async (chatId, data) => {
  try {
    const userInfo = await getUserInfo(chatId);

    // console.log(data)
    const categoriesIdArr = data.categories;

    const createPartner = await Partners.create({
      title: data.title,
      description: data.description,
      categories: JSON.stringify(categoriesIdArr),
      links: JSON.stringify(data.links),
      phones: JSON.stringify(data.phones),
      address_text: data.address_text,
      address_coordinates: JSON.stringify(data.address_coordinates),
      status: false
    });

    await Partners.findByPk(createPartner.id)
      .then(partner => {
        if(!partner) return;

        categoriesIdArr.map(categoryId => {
          PartnersCategories.findByPk(categoryId)
          .then(category => {

            partner.addPartnersCategories(category);
          })
        })

      })

    /*Student.findOne({where: {name: "Tom"}})
      .then(student=>{
        if(!student) return;

        // добавим Тому курс по JavaScript
        Course.findOne({where: {name: "JavaScript"}})
          .then(course=>{
            if(!course) return;
            student.addCourse(course, {through:{grade:1}});
          });
      });*/

    /*await Student.findOne({where: {name: "Tom"}})
      .then(student=>{
        if(!student) return;
        student.getCourses().then(courses=>{
          courses.map(course => {
            console.log(course.name);
          })
          /!*for(course of courses){

          }*!/
        });
      });*/



    /*if (userInfo.user_admin) {
      await Partners.create({
        title: data.title,
        description: data.description,
        categories: JSON.stringify(data.categories),
        links: JSON.stringify(data.links),
        phones: JSON.stringify(data.phones),
        address_text: data.address_text,
        address_coordinates: JSON.stringify(data.address_coordinates),
        status: true
      });
    } else {
      await Partners.create({
        title: data.title,
        description: data.description,
        categories: JSON.stringify(data.categories),
        links: JSON.stringify(data.links),
        phones: JSON.stringify(data.phones),
        address_text: data.address_text,
        address_coordinates: JSON.stringify(data.address_coordinates),
        status: false
      });
    }*/

    /*
    const category = await PartnersCategories.findByPk(categoryId);

    */



    return true;
  } catch (err) {
    console.error('Ошибка при добавлении партнера', err);
    throw err; // Для дальнейшей обработки ошибки
  }
};
