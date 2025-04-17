import Database from "../components/database";

class FavoritesSearchGallery {

}

new FavoritesSearchGallery();

async function testDatabase(): Promise<void> {
  const database = new Database("Favorites", "user2236924", 1);
  const objectStoreName = "user2236924";
  const favorites = await database.load();

  console.log(favorites.length);
  await database.deleteRecords(["50"], objectStoreName);
  console.log(favorites.length);
}

testDatabase();
