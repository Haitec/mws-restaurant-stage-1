/**
 * Common database helper functions.
 */
class DBHelper {

  static get port() {
    return 1337
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:${this.port}/restaurants`
  }

  /**
   * Reviews URL.
   * Change this to review.json file location on your server.
   */
  static get REVIEWS_URL() {
    return `http://localhost:${this.port}/reviews`
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
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    fetch(DBHelper.REVIEWS_URL)
      .then(response => response.json())
      .then(reviews => callback(null, reviews))
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
   * Fetch reviews by their restaurant ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    fetch(DBHelper.REVIEWS_URL + '/?restaurant_id=' + id)
      .then(response => response.json())
      .then(reviews => callback(null, reviews))
      .catch(error => callback(error, null))
  }

  /**
   * Save favorite status of restaurant.
   */
  static saveFavorite(id, isFavorite, callback) {
    fetch(DBHelper.DATABASE_URL + '/' + id + '/?is_favorite=' + isFavorite, {
      method: 'PUT'
    })
      .then(response => response.json())
      .then(restaurant => callback(null, restaurant))
      .catch(error => callback(error, null))
  }

  /**
   * Save review of restaurant.
   */
  static saveReview(review, callback) {
    fetch(DBHelper.REVIEWS_URL, {
      method: 'post',
      body: JSON.stringify(review)
    })
      .then(response => response.json())
      .then(review => callback(null, review))
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
          results = results.filter(r => r.cuisine_type == cuisine)
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood)
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
    return (`./restaurant.html?id=${restaurant.id}`)
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph || restaurant.id}.jpg`)
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(map)
    return marker
  }

}
