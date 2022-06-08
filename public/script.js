// access all form elems
const originInput = document.getElementById("origin-input");
const originOptions = document.getElementById("origin-options");
const destinationInput = document.getElementById("destination-input");
const destinationOptions = document.getElementById("destination-options");
const flightTypeSelect = document.getElementById("flight-type-select");
const departureDateInput = document.getElementById("departure-date-input");
const returnDate = document.getElementById("return-date");
const returnDateInput = document.getElementById("return-date-input");
const travelClassSelect = document.getElementById("travel-class-select");
const adultsInput = document.getElementById("adults-input");
const childrenInput = document.getElementById("children-input");
const infantsInput = document.getElementById("infants-input");
const searchButton = document.getElementById("search-button");
const searchResultsSeparator = document.getElementById(
  "search-results-separator"
);
const searchResultsLoader = document.getElementById("search-results-loader");
const searchResults = document.getElementById("search-results");

// reset func to set all form vals to default
const reset = () => {
  originInput.value = "";
  destinationInput.value = "";
  flightTypeSelect.value = "one-way";
  departureDateInput.valueAsDate = new Date();
  returnDateInput.valueAsDate = new Date();
  returnDate.classList.add("d-none");
  travelClassSelect.value = "ECONOMY";
  adultsInput.value = 1;
  childrenInput.value = 0;
  infantsInput.value = 0;
  searchButton.disabled = true;
  searchResultsSeparator.classList.add("d-none");
  searchResultsLoader.classList.add("d-none");
};

// events for these 4 cases:
// 1. disable/enable search on form completion
document.body.addEventListener("input", () => {
  searchButton.disabled = !originInput.value || !destinationInput.value;
});

// 2. autocomplete loation inputs from Amadeus Airport & City Search API
// a. define autocomplete func. Throttle API call with setTimeout so they
// happen only when user slows/ stops inputting - vars defined first:
const autocompleteTimeout = 3000;
let autocompleteTimeoutHandle = 0;
// b. IATA codes corresponding to the given cities are saved to an object
// for later use with the search endpoint
let destinationCityCodes = {};
let originCityCodes = {};

const autocomplete = (input, datalist, cityCodes) => {
  clearTimeout(autocompleteTimeoutHandle);
  autocompleteTimeoutHandle = setTimeout(async () => {
    try {
      const params = new URLSearchParams({ keyword: input.value });
      // make sure fetch jas params stringified and esacaped with URLSearchParams,
      // clean up datalist elem and add using option elements
      const response = await fetch(`/api/autocomplete?${params}`);
      const data = await response.json();
      datalist.textContent = "";
      data.forEach((entry) => {
        cityCodes[entry.name.toLowerCase()] = entry.iataCode;
        datalist.insertAdjacentHTML(
          "beforeend",
          `<option value="${entry.name}"></option>`
        );
      });
    } catch (error) {
      console.error(error);
    }
  }, autocompleteTimeout);
};

// autocomplete can handle both inputs
originInput.addEventListener("input", () => {
  if (originInput) {
    autocomplete(originInput, originOptions, originCityCodes);
  }
});
// autocomplete can handle both inputs
destinationInput.addEventListener("input", () => {
  if (destinationInput) {
    autocomplete(destinationInput, destinationOptions, destinationCityCodes);
  }
});

// 3. showing/hiding the return date input for round trip
flightTypeSelect.addEventListener("change", () => {
  if (flightTypeSelect.value === "one-way") {
    returnDate.classList.add("d-none");
  } else {
    returnDate.classList.remove("d-none");
  }
});

// 4. searching for flight offers with the Amadeus Flight Offers
// a. define search func - only req a return data - presentation
// of results will be in separate func
const search = async () => {
  try {
    const returns = flightTypeSelect.value === "round-trip";
    const params = new URLSearchParams({
      origin: originCityCodes[originInput.value.toLowerCase()],
      destination: destinationCityCodes[destinationInput.value.toLowerCase()],
      departureDate: formatDate(departureDateInput.valueAsDate),
      adults: formatNumber(adultsInput.value),
      children: formatNumber(childrenInput.value),
      infants: formatNumber(infantsInput.value),
      travelClass: travelClassSelect.value,
      ...(returns
        ? { returnDate: formatDate(returnDateInput.valueAsDate) }
        : {}),
    });
    const response = await fetch(`/api/search?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

// nice YYYY-MM-DD formatting string that Flight Offers Search API accepts as
// well as no float-points for pasenger numbers
const formatDate = (date) => {
  const [formattedDate] = date.toISOString().split("T");
  return formattedDate;
};
const formatNumber = (number) => {
  return `${Math.abs(parseInt(number))}`;
};

searchButton.addEventListener("click", async () => {
  searchResultsSeparator.classList.remove("d-none");
  searchResultsLoader.classList.remove("d-none");
  searchResults.textContent = "";
  const results = await search();
  searchResultsLoader.classList.add("d-none");
  showResults(results);
});

// display results
const showResults = (results) => {
  if (results.length === 0) {
    searchResults.insertAdjacentHTML(
      "beforeend",
      `<li class="list-group-item d-flex justify-content-center align-items-center" id="search-no-results">
        No results
      </li>`
    );
  }
  results.forEach(({ itineraries, price }) => {
    const priceLabel = `${price.total} ${price.currency}`;
    searchResults.insertAdjacentHTML(
      "beforeend",
      `<li class="flex-column flex-sm-row list-group-item d-flex justify-content-between align-items-sm-center">
          ${itineraries
            .map((itinerary, index) => {
              const [, hours, minutes] = itinerary.duration.match(/(\d+)H(\d+)?/);
              const travelPath = itinerary.segments
                .flatMap(({ arrival, departure }, index, segments) => {
                  if (index === segments.length - 1) {
                    return [departure.iataCode, arrival.iataCode];
                  }
                  return [departure.iataCode];
                })
                .join(" → ");
              return `
              <div class="flex-column flex-1 m-2 d-flex">
                <small class="text-muted">${
                  index === 0 ? "Outbound" : "Return"
                }</small>
                <span class="fw-bold">${travelPath}</span>
                <div>${hours || 0}h ${minutes || 0}m</div>
              </div>
            `;
            })
            .join("")}
          <span class="bg-primary rounded-pill m-2 badge fs-6">${priceLabel}</span>
        </li>`
    );
  });
};



reset();
