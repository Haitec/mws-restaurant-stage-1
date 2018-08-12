let restaurant;
let reviews;
var map;

/**
 * Initialize map, as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
* Initialize leaflet map
*/
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiaGFpdGVjIiwiYSI6ImNqa3BvODU1djFnMjMzd3A4N3ByN2hoZWMifQ.PQ4eGrB-A6Pe11YhDw5UQw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(map);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
  fetchReviewsFromURL((error, reviews) => {
    if (error) { // Got an error!
      console.error(error);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get current reviews from page URL.
 */
fetchReviewsFromURL = (callback) => {
  if (self.reviews) { // restaurant already fetched!
    callback(null, self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      callback(null, reviews)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'Picture of ' + restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  fillRestaurantFavoriteHTML()
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create restaurant favorite HTML and add it to the webpage
 */
fillRestaurantFavoriteHTML = (restaurant = self.restaurant) => {
  const favorite = document.getElementById('restaurant-favorite');

  const favoriteButton = document.querySelector('#restaurant-favorite button');
  if (favoriteButton) {
    favoriteButton.remove();
  }

  const button = document.createElement('button');
  button.tabIndex = 0
  if (restaurant.is_favorite === 'true') {
    button.innerText = 'Remove as favorite'
    button.onclick = () => saveAsFavorite(false)
  } else {
    button.innerText = 'Mark as favorite'
    button.onclick = () => saveAsFavorite(true)
  }

  function saveAsFavorite(favorite) {
    DBHelper.saveFavorite(restaurant.id, favorite, (error, restaurant) => {
      fillRestaurantFavoriteHTML(restaurant);
    })
  }

  favorite.appendChild(button)
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.tabIndex = 0;
  container.appendChild(title);

  const ul = document.getElementById('reviews-list');
  if (!reviews || !reviews.length) {
    const noReviews = document.createElement('p');
    noReviews.id = 'no-reviews';
    noReviews.innerHTML = 'No reviews yet!';
    ul.appendChild(noReviews);
  } else {
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
  }
  ul.appendChild(createReviewFormHTML());
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.tabIndex = 0;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt).toLocaleString();
  date.tabIndex = 0;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.tabIndex = 0;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex = 0;
  li.appendChild(comments);

  return li;
}

/**
 * Create review HTML form and add it to the webpage.
 */
createReviewFormHTML = () => {
  const li = document.createElement('li');
  li.id = 'review-form';

  const name = document.createElement('p');
  name.innerHTML = 'Name';
  name.tabIndex = 0;
  li.appendChild(name);

  const nameInput = document.createElement('input');
  nameInput.tabIndex = 0;
  nameInput.name = 'name';
  li.appendChild(nameInput);

  li.appendChild(document.createElement('br'));
  li.appendChild(document.createElement('br'));

  const rating = document.createElement('p');
  rating.innerHTML = 'Rating';
  rating.tabIndex = 0;
  li.appendChild(rating);

  const ratingSelect = document.createElement('select');
  ratingSelect.tabIndex = 0;
  ratingSelect.name = 'rating';
  li.appendChild(ratingSelect);

  const option = document.createElement('option');
  ratingSelect.appendChild(option);

  for (let i = 1; i <= 5; i++) {
    const option = document.createElement('option');
    option.innerHTML = i;
    option.value = i;
    ratingSelect.appendChild(option);
  }

  li.appendChild(document.createElement('br'));
  li.appendChild(document.createElement('br'));

  const message = document.createElement('textarea');
  message.tabIndex = 0;
  message.name = 'message';
  message.rows = 5;
  li.appendChild(message);

  li.appendChild(document.createElement('br'));

  const submit = document.createElement('button');
  submit.tabIndex = 0;
  submit.innerText = 'Submit';
  submit.onclick = () => {
    const review = {
      "restaurant_id": self.restaurant.id,
      "name": nameInput.value,
      "rating": ratingSelect.value,
      "comments": message.value
    }

    if (!review.name || !review.rating || !review.comments) {
      alert('Please fill in the form.')
      return
    }

    DBHelper.saveReview(review, (error, review) => {
      self.reviews.push(review);
      if (!review) {
        console.error(error);
        return;
      }

      const noReviews = document.getElementById('no-reviews');
      if (noReviews) {
        noReviews.remove();
      }
      document.getElementById('review-form').remove();

      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(review));
      ul.appendChild(createReviewFormHTML());
    })
  }
  li.appendChild(submit);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
