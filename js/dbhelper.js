/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    fetch(DBHelper.DATABASE_URL + '/' + id)
      .then(response => response.json())
      .then(restaurant => callback(null, restaurant))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => restaurants.filter(r => r.cuisine_type == cuisine))
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => restaurants.filter(r => r.neighborhood == neighborhood))
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results
      })
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => restaurants.map((v, i) => restaurants[i].neighborhood))
      .then(neighborhoods => neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i))
      .then(uniqueNeighborhoods => callback(null, uniqueNeighborhoods))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => restaurants.map((v, i) => restaurants[i].cuisine_type))
      .then(cuisines => cuisines.filter((v, i) => cuisines.indexOf(v) == i))
      .then(uniqueCuisines => callback(null, uniqueCuisines))
      .catch(error => callback(error, null))
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph || restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }

}
