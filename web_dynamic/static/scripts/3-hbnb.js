$(document).ready(main);

const HOST = "0.0.0.0";

function main() {
  const amenityObj = {};
  $(".amenities .popover input").change(function () {
    if ($(this).is(":checked")) {
      amenityObj[$(this).attr("data-name")] = $(this).attr("data-id");
    } else if ($(this).is(":not(:checked)")) {
      delete amenityObj[$(this).attr("data-name")];
    }
    const names = Object.keys(amenityObj);
    $(".amenities h4").text(names.sort().join(", "));
  });
  const API_URL = `http://${HOST}:5001/api/v1/status/`;
  $.get(API_URL, (data, textStatus) => {
    if (textStatus === "success" && data.status === "OK") {
      $("#api_status").addClass("available");
    } else {
      $("#api_status").removeClass("available");
    }
  });
  getPlaces();
}

function getPlaces() {
  const PLACES_URL = `http://${HOST}:5001/api/v1/places_search/`;
  $.ajax({
    url: PLACES_URL,
    type: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({}),
    success: function (response) {
      for (const articleData of response) {
        const article = [
          "<article>",
          '<div class="title_box">',
          `<h2>${articleData.name}</h2>`,
          `<div class="price_by_night">$${articleData.price_by_night}</div>`,
          "</div>",
          '<div class="information">',
          `<div class="max_guest">${articleData.max_guest} Guest(s)</div>`,
          `<div class="number_rooms">${articleData.number_rooms} Bedroom(s)</div>`,
          `<div class="number_bathrooms">${articleData.number_bathrooms} Bathroom(s)</div>`,
          "</div>",
          '<div class="description">',
          `${articleData.description}`,
          "</div>",
          "</article>",
        ];
        $("SECTION.places").append(article.join(""));
      }
    },
    error: function (error) {
      console.log(error);
    },
  });
}
