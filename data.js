// Обновленная структура данных для приюта "Лапкин Дом"

// Данные о животных
let petsData = [
  {
    id: 1,
    name: "Рекс",
    type: "dog",
    breed: "Овчарка",
    age: "1 год",
    gender: "Мальчик",
    status: "Ищет дом",
    price: 1500,
    miniDesc: "Активный и дружелюбный пёс, отлично ладит с детьми",
    fullDesc:
      "Рекс - очень умный и преданный пёс. Прошел курс дрессировки, знает основные команды. Ищет активную семью, которая будет много гулять и заниматься с ним.",
    photoUrl: "./img/3.jpg",
    inCart: false,
  },
  {
    id: 2,
    name: "Мурка",
    type: "cat",
    breed: "Сиамская",
    age: "2 года",
    gender: "Девочка",
    status: "Ищет дом",
    price: 1000,
    miniDesc: "Ласковая и нежная кошечка, любит внимание",
    fullDesc:
      "Мурка - очень ласковая кошечка. Любит сидеть на руках и мурлыкать. Приучена к лотку, стерилизована. Ищет спокойный дом без других животных.",
    photoUrl:
      "./img/1.webp",
    inCart: false,
  },
  {
    id: 3,
    name: "Барсик",
    type: "cat",
    breed: "Дворняжка",
    age: "1 год",
    gender: "Мальчик",
    status: "Ищет дом",
    price: 800,
    miniDesc: "Игривый и весёлый котёнок, обожает игрушки",
    fullDesc:
      "Барсик - молодой и активный кот. Очень игривый, любит охотиться за игрушками. Привит, здоров. Ищет дом, где будет много внимания и заботы.",
    photoUrl:
      "./img/barsic.jpg",
    inCart: false,
  },
  {
    id: 4,
    name: "Джесси",
    type: "dog",
    breed: "-",
    age: "2 года",
    gender: "Девочка",
    status: "Ищет дом",
    price: 2000,
    miniDesc: "Добрая и спокойная собака, отлично ладит с детьми",
    fullDesc:
      "Джесси - очень добрая и терпеливая собака. Обожает детей, отлично подойдет для семьи. Знает команды, приучена к поводку.",
    photoUrl: "./img/7.jpg",
    inCart: false,
  },
  {
    id: 5,
    name: "Снежок",
    type: "cat",
    breed: "Персидская",
    age: "4 года",
    gender: "Мальчик",
    status: "На лечении",
    price: 0,
    miniDesc: "Спокойный кот, восстанавливается после лечения",
    fullDesc:
      "Снежок находится на лечении, ему требуется особый уход. Скоро поправится и будет искать дом. Пока можно оформить опеку.",
    photoUrl:
      "./img/6.jpg",
    inCart: false,
  },
];


const savedPetsData = localStorage.getItem("petsData");

if (savedPetsData) {
  try {
    petsData = JSON.parse(savedPetsData);
  } catch (error) {
    localStorage.setItem("petsData", JSON.stringify(petsData));
  }
} else {
  localStorage.setItem("petsData", JSON.stringify(petsData));
}
