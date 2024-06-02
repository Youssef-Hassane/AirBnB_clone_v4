$(document).ready(init);

const HOST = "0.0.0.0";
const amenityObj = {};
const stateObj = {};
const cityObj = {};
let obj = {};
let debounceTimeout;

function init() {
  $(".amenities .popover input").change(
    debounce(() => {
      obj = amenityObj;
      checkedObjects.call(this, 1);
    }, 300)
  );

  $(".state_input").change(
    debounce(() => {
      obj = stateObj;
      checkedObjects.call(this, 2);
    }, 300)
  );

  $(".city_input").change(
    debounce(() => {
      obj = cityObj;
      checkedObjects.call(this, 3);
    }, 300)
  );

  apiStatus();
  searchPlaces();
}

function debounce(func, wait) {
  return function (...args) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function checkedObjects(nObject) {
  if ($(this).is(":checked")) {
    obj[$(this).attr("data-name")] = $(this).attr("data-id");
  } else {
    delete obj[$(this).attr("data-name")];
  }
  updateSelectedFilters(nObject);
  searchPlaces();
}

function updateSelectedFilters(nObject) {
  const names = Object.keys(obj).sort().join(", ");
  if (nObject === 1) {
    $(".amenities h4").text(names);
  } else if (nObject === 2) {
    $(".locations h4").text(names);
  }
}

function apiStatus() {
  const API_URL = `http://${HOST}:5001/api/v1/status/`;
  $.get(API_URL)
    .done((data) => {
      if (data.status === "OK") {
        $("#api_status").addClass("available");
      } else {
        $("#api_status").removeClass("available");
      }
    })
    .fail(() => {
      $("#api_status").removeClass("available");
    });
}

function searchPlaces() {
  const PLACES_URL = `http://${HOST}:5001/api/v1/places_search/`;
  showLoadingIndicator(true);
  $.ajax({
    url: PLACES_URL,
    type: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      amenities: Object.values(amenityObj),
      states: Object.values(stateObj),
      cities: Object.values(cityObj),
    }),
  })
    .done(renderPlaces)
    .fail((error) => {
      console.error(error);
      alert("An error occurred while searching for places.");
    })
    .always(() => {
      showLoadingIndicator(false);
    });
}

function renderPlaces(response) {
  const $placesSection = $("SECTION.places").empty();
  response.forEach(async (place) => {
    const article = await createPlaceArticle(place);
    $placesSection.append(article);
  });
}

async function createPlaceArticle(place) {
  let placeLength = await fetchReviews(place.id);
  return `
    <article>
      <div class="title_box">
        <h2>${place.name}</h2>
        <div class="price_by_night">$${place.price_by_night}</div>
      </div>
      <div class="information">
        <div class="max_guest">${place.max_guest} Guest(s)</div>
        <div class="number_rooms">${place.number_rooms} Bedroom(s)</div>
        <div class="number_bathrooms">${place.number_bathrooms} Bathroom(s)</div>
      </div>
      <div class="description">${place.description}</div>
      <div class="reviews">
        <h2>
        <span id="${place.id}" class="toggle-reviews no-select">Show</span>
          <span id="${place.id}n" class="treview">${placeLength.length} Reviews</span>
        </h2>
        <ul id="${place.id}r"></ul>
      </div>
    </article>`;
}

function showLoadingIndicator(show) {
  if (show) {
    $("#loading-indicator").show();
  } else {
    $("#loading-indicator").hide();
  }
}

$(document).on("click", ".toggle-reviews", function () {
  const placeId = this.id;
  toggleReviews(this, placeId);
});

function toggleReviews(toggleButton, placeId) {
  const $reviewsContainer = $(`#${placeId}r`);

  fetchReviews(placeId).done((data) => {
  if (toggleButton.textContent === "Show") {
    toggleButton.textContent = "Hide";
      $(`#${placeId}n`).text(`${data.length} Reviews`);
      data.forEach((review) => appendReview(review, placeId));
    } else {
      toggleButton.textContent = "Show";
      $(`#${placeId}n`).text(`${data.length} Reviews`);
      $reviewsContainer.empty();
    }
  });
}

function fetchReviews(placeId) {
  return $.get(`http://${HOST}:5001/api/v1/places/${placeId}/reviews`);
}

function appendReview(review, placeId) {
  const date = new Date(review.created_at);
  const formattedDate = `${dateOrdinal(date.getDate())} ${date.toLocaleString(
    "en",
    { month: "long" }
  )} ${date.getFullYear()}`;

  fetchUser(review.user_id).done((user) => {
    const reviewHtml = `
        <li>
          <h3>From ${user.first_name} ${user.last_name} the ${formattedDate}</h3>
          <p>${review.text}</p>
        </li>`;
    $(`#${placeId}r`).append(reviewHtml);
  });
}

function fetchUser(userId) {
  return $.get(`http://${HOST}:5001/api/v1/users/${userId}`);
}

function dateOrdinal(dom) {
  if ([1, 21, 31].includes(dom)) return `${dom}st`;
  if ([2, 22].includes(dom)) return `${dom}nd`;
  if ([3, 23].includes(dom)) return `${dom}rd`;
  return `${dom}th`;
}
