let db;
const request = indexedDB.open("mangaDB", 1);

request.onerror = function (event) {
  console.log("Erreur d’ouverture de la base de données");
};

request.onsuccess = function (event) {
  db = event.target.result;
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  db.createObjectStore("mangas", { keyPath: "id" });
};

axios
  .get("https://api.jikan.moe/v4/anime")
  .then((response) => {
    const animes = response.data.data;
    displayAnimes(animes);
  })
  .catch((error) => {
    console.error("Erreur lors de la récupération des animes", error);
  });

function displayAnimes(animes) {
  const animeCards = document.getElementById("anime-cards");
  animeCards.innerHTML = ""; // Clear existing cards

  animes.forEach((anime) => {
    const card = document.createElement("div");
    card.classList.add("anime-card");
    card.innerHTML = `
                <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
                <h3>${anime.title}</h3>
                <button class="add-to-db">Ajouter à mes mangas</button>
            `;

    // EventListener for adding to IndexedDB
    card.querySelector(".add-to-db").addEventListener("click", () => {
      addToIndexedDB(anime);
    });

    animeCards.appendChild(card);
  });
}

function addToIndexedDB(anime) {
  const transaction = db.transaction(["mangas"], "readwrite");
  const store = transaction.objectStore("mangas");

  const animeId = anime.mal_id; // Utilisez 'mal_id' comme clé primaire

  // Vérifiez si le manga est déjà dans la base
  const getRequest = store.get(animeId);

  getRequest.onsuccess = function () {
    if (getRequest.result) {
      // Manga déjà présent dans la base
      Swal.fire({
        icon: "info",
        title: "Déjà ajouté",
        text: `L'anime "${anime.title}" est déjà dans votre collection.`,
      });
    } else {
      // Manga non présent, ajoutons-le
      const animeWithId = { ...anime, id: animeId }; // Ajoutez une clé id basée sur mal_id
      const addRequest = store.add(animeWithId);

      addRequest.onsuccess = function () {
        Swal.fire({
          icon: "success",
          title: "Anime ajouté",
          text: `L'anime "${anime.title}" a été ajouté à votre collection !`,
        });
      };

      addRequest.onerror = function (event) {
        console.error(
          "Erreur lors de l'ajout à IndexedDB : ",
          event.target.error
        );
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: `Impossible d'ajouter "${anime.title}" à la collection.`,
        });
      };
    }
  };

  getRequest.onerror = function (event) {
    console.error(
      "Erreur lors de la vérification de l'anime dans IndexedDB : ",
      event.target.error
    );
    Swal.fire({
      icon: "error",
      title: "Erreur",
      text: "Une erreur s'est produite lors de l'accès à IndexedDB.",
    });
  };
}

// Animation pour les cartes d'anime
anime({
  targets: ".anime-card",
  opacity: [0, 1],
  translateY: [-50, 0],
  duration: 1000,
  delay: anime.stagger(200), // Delayed animation for each card
});
