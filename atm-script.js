let API_KEY =
        "97bce941-0fcd-4547-b642-b0391a86e9b0a5f40b83-4852-4f00-805b-0486f6872a92";
mapboxgl.accessToken = "pk.eyJ1IjoicG9uY2ViYW5rIiwiYSI6ImNsbnVkaXpvcjBhZ2kycm1maW44dDBpa2sifQ.Z64WawPBDYfTOj4NdUDIkw";

let excelUrl =
  "https://uploads-ssl.webflow.com/63500fd89166a09e3c3efaf0/657ae4b5ccaafa204032df56_Citibank_BranchList%20-%20Sheet1.csv";

let data = new URLSearchParams();
let ENDPOINT = "https://locatorapistaging.moneypass.com/Service.svc";
const GET_ATM_URL = "/locations/atm";
let lat, long;
let page = 1;
let count = 20;
let radius = 2;
let resObj = [];
let totalFound = 0;
let searchVal = "";
let filterCount = 0;
let languages = [];
var markers = [];
let csvData = [];
let csvStartPosition = 0;
let csvEndPosition = 4;
let min = 0;
let max = 5;
let csvDataCount = 0;
let checkLocationPermission = false;

const geoCloneObj = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [],
  },
  properties: {
    title: "",
    description: "",
  },
  id: "",
  className: "atm_map_marker filtered",
};
const geojson = {
  type: "FeatureCollection",
  features: [],
};
const csvImportObj = {
  atmLocation: {
    address: {
      city: "",
      country: "",
      postalCode: "",
      state: "",
      street: "",
    },
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    id: "",
    name: "",
    isAvailable24Hours: false,
    isDepositAvailable: false,
    isCashDepositAvailable: false,
    isHandicappedAccessible: false,
    isOffPremise: false,
    isSeasonal: false,
    languageType: "",
    locationDescription: "",
    logoName: "",
    terminalId: "",
    participantId: "",
  },
  distance: 0.0,
};

const directionGeoJson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        properties: {},
        coordinates: [],
      },
    },
  ],
};

const map = new mapboxgl.Map({
  container: "mapContainer",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-73.855608, 40.833251],
  zoom: 14,
  scrollZoom: false,
  boxZoom: false,
  doubleClickZoom: false,
  // dragPan: false,
});

const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
  },
  showAccuracyCircle: false,
  showUserLocation: false,
  trackUserLocation: true,
});

let showZoom = true;
if (window.innerWidth < 479) {
  showZoom = false;
}
// Add the control to the map.
map.addControl(
  new mapboxgl.NavigationControl({
    showCompass: false,
    showZoom: showZoom,
  }),
  "bottom-right"
);
map.addControl(geolocate, "bottom-right");

const el = document.createElement("div");
el.className = "my-blue-location";
const locationMarker = new mapboxgl.Marker(el);

geolocate.on("geolocate", (event) => {
  const latitude = event.coords.latitude;
  const longitude = event.coords.longitude;
  // const latitude = 40.833251;
  // const longitude = -73.855608;
  locationMarker.setLngLat({ lon: longitude, lat: latitude }).addTo(map);
});

$(document).ready(async function () {
  await handleShow(".simple-spinner");
  await handleFilterCount();
  if (navigator.geolocation) {
    await navigator.geolocation.getCurrentPosition(
      async function (position) {
        // lat = 40.833251;
        // long = -73.855608;
        lat = position.coords.latitude;
        long = position.coords.longitude;
        geolocate.trigger();
        // data.set("spatialFilter", `nearby(${lat},${long},${radius})`);
        data.set(
          "spatialFilter",
          `nearby(${position.coords.latitude},${position.coords.longitude},${radius})`
        );
        data.set("count", count);
        data.set("format", "json");
        data.set("key", API_KEY);
        data.set("distanceUnit", "mile");
        const ATMData = await getATMData(data, GET_ATM_URL, ".simple-spinner");
        await handleResponse(ATMData);
        await handleHide(".simple-spinner");
      },
      async function (error) {
        lat = 40.833251;
        long = -73.855608;
        geolocate.trigger();
        data.set("spatialFilter", `nearby(${lat},${long},${radius})`);
        data.set("count", count);
        data.set("format", "json");
        data.set("key", API_KEY);
        data.set("distanceUnit", "mile");
        const ATMData = await getATMData(data, GET_ATM_URL, ".simple-spinner");
        await handleResponse(ATMData);
        await handleHide(".simple-spinner");
        //   await handleShow(".atm_list--empty");
      }
    );
  } else {
    lat = 40.833251;
    long = -73.855608;
    geolocate.trigger();
    data.set("spatialFilter", `nearby(${lat},${long},${radius})`);
    data.set("count", count);
    data.set("format", "json");
    data.set("key", API_KEY);
    data.set("distanceUnit", "mile");
    const ATMData = await getATMData(data, GET_ATM_URL, ".simple-spinner");
    await handleResponse(ATMData);
    await handleHide(".simple-spinner");
    //   await handleShow(".atm_list--empty");
  }
  map.on("click", "circle", (e) => {
    map.flyTo({
      center: e.features[0].geometry.coordinates,
    });
  });
  if (window.innerWidth < 479) {
    document.querySelectorAll(".mapboxgl-ctrl-group")?.[1].remove();
  }
});
handleDirections();

if (window.innerWidth < 479) {
  $("#pinkTrigger").click(function () {
    if ($("#atmList").hasClass("show-list")) {
      $("#atmMain").removeClass("open-detail");
    }

    $("#atmList").toggleClass("show-list");
    $(".atm_list--empty").toggleClass("show-list");
  });

  $("#filtersTrigger").click(function () {
    if (!$("#atmList").hasClass("show-list")) {
      $("#atmList").toggleClass("show-list");
      $(".atm_list--empty").toggleClass("show-list");
    }
  });
  $("input#name").click(function () {
    if (!$("#atmList").hasClass("show-list")) {
      $("#atmList").toggleClass("show-list");
      $(".atm_list--empty").toggleClass("show-list");
    }
  });

  const resizeObserver = new ResizeObserver((entries) => {
    if (!$("#atmList").hasClass("show-list")) {
      $(".mapboxgl-ctrl-bottom-right")[0].style.setProperty(
        "bottom",
        "58px",
        "important"
      );
    } else {
      $(".mapboxgl-ctrl-bottom-right")[0].style.setProperty(
        "bottom",
        $(".atm_content").height() - 39 + "px",
        "important"
      );
    }
  });

  resizeObserver.observe($("#atmList")[0]);
}

let isScroll = false;
let isRes = false;
document.getElementById("atmMain").addEventListener("scroll", async (event) => {
  if (
    // totalFound < 50 &&
    (totalFound > 0 || csvDataCount > 10) &&
    searchVal == "" &&
    languages.length <= 0
  ) {
    const scrollableElement = document.getElementById("atmMain");
    const scrollTop = scrollableElement.scrollTop + 1;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight) {
      isScroll = true;
    }

    if (isScroll && !isRes) {
      isScroll = false;
      await data.set("start", totalFound + 1);
      isRes = true;
      const ATMData = await getATMData(data, GET_ATM_URL, ".bottom-spinner");
      await handleResponse(ATMData);
      isRes = false;
    }
  }
});

async function getATMData(data, GET_ATM_URL, spinnerCls) {
  await handleShow(spinnerCls);
  const response = await fetch(ENDPOINT + GET_ATM_URL + "?" + data.toString())
    .then((response) => response.json())
    .then((data) => data)
    .catch((error) => error);
  return response;
}

async function getCSVData() {
  const csvFileResponse = await readCsv();
  var parsedData = await csvParser(csvFileResponse);
  if (parsedData.length > 0) {
    parsedData = await parsedData.filter(
      (parsedObj) => parsedObj.distance >= min && parsedObj.distance <= max
    );
    if (parsedData.length > 0) {
      //check service filter applied or not
      var serviceFilterData = data.get("filter")
        ? data.get("filter").split("&&")
        : [];
      if (serviceFilterData.length > 0) {
        var filteredServiceCSV = [];
        await serviceFilterData.forEach(async (service) => {
          var serviceFilterArray = await parsedData
            .filter((csv) => csv.atmLocation[`${service}`])
            .map((filtredData) => filtredData);
          if (
            serviceFilterArray.length > 0 &&
            serviceFilterArray[0] != undefined
          ) {
            serviceFilterArray.map(async (data) => {
              filteredServiceCSV.push(data);
            });
          }
        });
        parsedData = filteredServiceCSV.filter(
          (a, i) =>
            a != undefined &&
            filteredServiceCSV.findIndex(
              (s) => a.atmLocation.id === s.atmLocation.id
            ) === i
        );
      }
      csvDataCount = parsedData.length;
      parsedData = parsedData.filter(
        (a, i) =>
          a != undefined &&
          parsedData.findIndex((s) => a.atmLocation.id === s.atmLocation.id) ===
            i
      );
      await Promise.all(parsedData.map((csvSlice) => resObj.push(csvSlice)));
    }
  }
  return true;
}

async function readCsv() {
  const csvResponse = await fetch(excelUrl, {
    method: "get",
    headers: {
      "content-type": "text/csv;charset=UTF-8",
    },
  })
    .then((response) => response.text())
    .then((data) => data)
    .catch((error) => error);
  return csvResponse;
}

async function csvParser(csvData) {
  const text = csvData.split(/\r\n|\n/);
  const [first, ...lines] = text;
  const headers = first.split(",");
  const rows = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const values = line.split(",");
    let csvImportCloneObj = JSON.parse(JSON.stringify(csvImportObj));
    if (values[0] !== undefined && values.length > 1) {
      csvImportCloneObj.atmLocation.name =
        values[0] !== null && values[0] !== "" ? values[0] : "";
      csvImportCloneObj.atmLocation.address.street =
        values[1] !== null && values[1] !== "" ? values[1] : "";
      csvImportCloneObj.atmLocation.address.city =
        values[2] !== null && values[2] !== "" ? values[2] : "";
      csvImportCloneObj.atmLocation.address.state =
        values[3] !== null && values[3] !== "" ? values[3] : "";
      csvImportCloneObj.atmLocation.address.postalCode =
        values[4] !== null && values[4] !== "" ? values[4] : "";
      csvImportCloneObj.atmLocation.coordinates.latitude =
        values[5] !== null && values[5] !== "" ? values[5] : "";
      csvImportCloneObj.atmLocation.coordinates.longitude =
        values[6] !== null && values[6] !== "" ? values[6] : "";
      csvImportCloneObj.atmLocation.isAvailable24Hours =
        values[7] !== null && values[7] !== ""
          ? await stringToBoolean(values[7])
          : false;
      csvImportCloneObj.atmLocation.isDepositAvailable =
        values[8] !== null && values[8] !== ""
          ? await stringToBoolean(values[8])
          : false;
      csvImportCloneObj.atmLocation.isCashDepositAvailable =
        values[9] !== null && values[9] !== ""
          ? await stringToBoolean(values[9])
          : false;
      csvImportCloneObj.atmLocation.isHandicappedAccessible =
        values[10] !== null && values[10] !== ""
          ? await stringToBoolean(values[10])
          : false;
      csvImportCloneObj.atmLocation.languageType =
        values[11] !== null && values[11] !== "" ? values[11] : "";
      csvImportCloneObj.atmLocation.locationDescription = `${
        csvImportCloneObj.atmLocation.address.street
          ? csvImportCloneObj.atmLocation.address.street
          : ""
      } , ${
        csvImportCloneObj.atmLocation.address.city
          ? csvImportCloneObj.atmLocation.address.city
          : ""
      } , ${
        csvImportCloneObj.atmLocation.address.state
          ? csvImportCloneObj.atmLocation.address.state
          : ""
      }, ${
        csvImportCloneObj.atmLocation.address.postalCode
          ? csvImportCloneObj.atmLocation.address.postalCode
          : ""
      }`;
      csvImportCloneObj.distance = null;
      csvImportCloneObj.type = "csv";

      if (
        csvImportCloneObj.atmLocation.coordinates.latitude != "" &&
        csvImportCloneObj.atmLocation.coordinates.longitude != ""
      ) {
        let distance = await calculateDistance(
          csvImportCloneObj.atmLocation.coordinates.latitude * 1,
          csvImportCloneObj.atmLocation.coordinates.longitude * 1,
          lat,
          long
        );
        csvImportCloneObj.distance = distance.toFixed(2) * 1;
      }

      csvImportCloneObj.atmLocation.id = await uid();

      // if (
      //   csvImportCloneObj.distance !== null &&
      //   csvImportCloneObj.distance <= 100
      // ) {
      if (
        csvImportCloneObj.atmLocation.coordinates.latitude &&
        csvImportCloneObj.atmLocation.coordinates.longitude
      ) {
        rows.push(csvImportCloneObj);
      }
      // }
    }
  }
  return rows;
}

async function handleResponse(response) {
  let status = response.status ? response.status : "error";
  if (
    response.results &&
    response.results !== null &&
    response.results.length > 0
  ) {
    if (resObj.length > 0) {
      response.results.map((res) => resObj.push(res));
      if (response.results.length > 0) {
        min = await Math.min(
          ...response.results.map((item) => item.distance)
        ).toFixed(2);
      }
    } else {
      resObj = response.results;
      min = 0;
    }

    if (response.results.length > 0) {
      max = await Math.max(
        ...response.results.map((item) => item.distance)
      ).toFixed(2);
    }
  } else {
    max = radius;
  }

  if (excelUrl) {
    await getCSVData();
  }
  resObj = resObj.sort((a, b) => a.distance - b.distance);
  switch (status) {
    case "fail":
      if (resObj.length > 0) {
        await mapATMData(resObj);
      } else {
        await handleShow(".atm_list--empty");
        await handleHide("#atmList");
        await handleHide(".bottom-spinner");
      }
      break;
    case "Success":
      totalFound = totalFound += response.totalFound;
      await mapATMData(resObj);
      break;
    case "error":
      if (resObj.length > 0) {
        await mapATMData(resObj);
      } else {
        await handleShow(".atm_list--empty");
        await handleHide("#atmList");
        await handleHide(".bottom-spinner");
      }
      break;
    default:
      if (resObj.length > 0) {
        await mapATMData(resObj);
      } else {
        await handleShow(".atm_list--empty");
        await handleHide("#atmList");
        await handleHide(".bottom-spinner");
      }
      break;
  }
}

async function mapATMData(resObject) {
  if (resObject.length > 0) {
    let html = "";
    await Promise.all(
      resObject.map(async (obj) => {
        let atmItemDiv = await getATMDiv(obj);
        html += atmItemDiv;
      })
    );
    document.getElementById("atmList").innerHTML = html;
    await handleShow("#atmList");
    await handleHide(".atm_list--empty");
  } else {
    await handleHide("#atmList");
    await handleShow(".atm_list--empty");
  }
  await handleHide(".simple-spinner");
  await handleHide(".bottom-spinner");
  await handleMapData(resObject);
}

async function getATMDiv(cloneObj) {
  var atmCloneItem = null;
  atmCloneItem = document.querySelector(".atm-clone-item").cloneNode(true);
  atmCloneItem.classList.remove("atm-clone-item");
  atmCloneItem.classList.remove("hide");
  var atmLocation = cloneObj.atmLocation ? cloneObj.atmLocation : {};
  var distance = cloneObj.distance ? cloneObj.distance : 0;
  atmCloneItem.setAttribute("id", "atm_" + atmLocation.id);
  atmCloneItem.setAttribute("atm-id", atmLocation.id);
  atmCloneItem.setAttribute(
    "data-lat",
    atmLocation.coordinates && atmLocation.coordinates.latitude
      ? atmLocation.coordinates.latitude
      : 0.0
  );
  atmCloneItem.setAttribute(
    "data-long",
    atmLocation.coordinates && atmLocation.coordinates.longitude
      ? atmLocation.coordinates.longitude
      : 0.0
  );

  atmCloneItem
    .querySelectorAll(`#atm_${atmLocation.id} .atm-title`)
    .forEach((ele) => {
      ele.innerText = atmLocation.name ? capitalizeWords(atmLocation.name) : "";
    });
  atmCloneItem
    .querySelectorAll(`#atm_${atmLocation.id} .atm-distance`)
    .forEach((ele) => {
      ele.innerText =
        (Math.round(distance) === 0
          ? distance.toFixed(2)
          : Math.round(distance)) + " miles";
    });
  atmCloneItem
    .querySelectorAll(`#atm_${atmLocation.id} .atm-address`)
    .forEach((ele) => {
      var text = atmLocation.locationDescription
        ? atmLocation.locationDescription
        : cloneObj.type === "csv"
        ? `${
            atmLocation.address && atmLocation.address.street
              ? atmLocation.address.street
              : ""
          } , ${
            atmLocation.address && atmLocation.address.city
              ? atmLocation.address.city
              : ""
          } , ${
            atmLocation.address && atmLocation.address.state
              ? atmLocation.address.state
              : ""
          }, ${
            atmLocation.address && atmLocation.address.postalCode
              ? atmLocation.address.postalCode
              : ""
          }`
        : "";

      ele.innerText = capitalizeWords(text);
    });
  atmCloneItem
    .querySelectorAll(`#atm_${atmLocation.id} .atm-direction`)
    .forEach((directionElement) => {
      directionElement.setAttribute("id", atmLocation.id),
        directionElement.setAttribute(
          "data-lat",
          atmLocation.coordinates && atmLocation.coordinates.latitude
            ? atmLocation.coordinates.latitude
            : 0.0
        ),
        directionElement.setAttribute(
          "data-long",
          atmLocation.coordinates && atmLocation.coordinates.longitude
            ? atmLocation.coordinates.longitude
            : 0.0
        );
    });
  if (atmLocation.isAvailable24Hours) {
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id} .atm-time`)
      .forEach((el) => {
        el.classList.remove("hide");
      });
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id}  .atm-service-time`)
      .forEach((el) => {
        el.classList.remove("hide");
      });
  } else {
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id} .atm-time`)
      .forEach((el) => {
        el.classList.add("hide");
      });
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id} .atm-service-time`)
      .forEach((el) => {
        el.classList.add("hide");
      });
  }

  if (atmLocation.isDepositAvailable) {
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id} .atm-service-deposit`)
      .forEach((el) => {
        el.classList.remove("hide");
      });
  } else {
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id} .atm-service-deposit`)
      .forEach((el) => {
        el.classList.add("hide");
      });
  }

  if (atmLocation.isHandicappedAccessible) {
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id} .atm-service-wheelchair`)
      .forEach((el) => {
        el.classList.remove("hide");
      });
  } else {
    atmCloneItem
      .querySelectorAll(`#atm_${atmLocation.id} .atm-service-wheelchair`)
      .forEach((el) => {
        el.classList.add("hide");
      });
  }
  return atmCloneItem.outerHTML;
}

document
  .querySelector(".atm_search-field")
  .addEventListener("keypress", async (event) => {
    if (event.key == "Enter") {
      $("input#name").trigger("blur");
      event.preventDefault();
      return false;
    }
  });

document
  .querySelector(".atm_search-field")
  .addEventListener("keyup", async (event) => {
    searchVal = event.target.value.toLowerCase();
    if (resObj.length > 0) {
      if (searchVal && searchVal.length > 0) {
        var searchObj = resObj.filter(
          (obj) =>
            obj.atmLocation.address.city.toLowerCase().includes(searchVal) ||
            obj.atmLocation.address.postalCode.toLowerCase().includes(searchVal)
        );
        await mapATMData(searchObj);
      } else {
        await mapATMData(resObj);
      }
    } else {
      await mapATMData(resObj);
    }
  });

document
  .querySelector(".atm_filters_toggle, #close-filters")
  .addEventListener("click", async (event) => {
    if (filterCount <= 0) {
      document.querySelectorAll("input[type=checkbox]").forEach((ele) => {
        if (ele.checked) {
          ele.setAttribute("checked", false);
          ele.previousElementSibling.classList.remove("w--redirected-checked");
        }
      });
    }
    // $("#atmMain").slideToggle("slow");
  });

document
  .getElementById("wf-form-Filters")
  .addEventListener("submit", (event) => {
    if (window.innerWidth < 479) {
      $("input#name").trigger("blur");
    }
    event.preventDefault();
    return false;
  });

const filterApply = document.getElementById("filterApply");
filterApply?.setAttribute("type", "button");

document
  .querySelector("#filterApply")
  .addEventListener("click", async (event) => {
    event.preventDefault();
    let serviceFilter = [];
    languages = Array.from(document.querySelectorAll(".language-filter"))
      .filter((ele) => ele.querySelector("input").checked)
      .map((filtredData) => {
        return filtredData.querySelector("input").getAttribute("data-val");
      });

    document.getElementById("isAvailable24Hours").checked
      ? serviceFilter.push("isAvailable24Hours")
      : "";
    document.getElementById("isHandicappedAccessible").checked
      ? serviceFilter.push("isHandicappedAccessible")
      : "";
    filterCount = serviceFilter.length + (languages.length > 0 ? 1 : 0);
    await handleFilterCount(
      serviceFilter.length + (languages.length > 0 ? 1 : 0)
    );
    document.getElementsByClassName("atm_filters_toggle")[0].click();
    await handleHide("#atmList");
    await handleHide(".atm_list--empty");
    await handleShow(".simple-spinner");
    if (serviceFilter.length > 0 || languages.length > 0) {
      csvData = [];
      csvStartPosition = 0;
      csvEndPosition = 4;
      await handleServiceFilter(serviceFilter);
      await handleLanguageFilter(languages);
    } else {
      csvData = [];
      csvStartPosition = 0;
      csvEndPosition = 4;
      await handleClearFilter();
    }
    searchVal = "";
    document.getElementsByClassName("atm_search-field")[0].value = "";
    await handleHide(".simple-spinner");
  });

document
  .querySelector("#reset-filters")
  .addEventListener("click", async (event) => {
    searchVal = "";
    document.getElementsByClassName("atm_search-field")[0].value = "";
    await handleHide(".atm_list--empty");
    await handleHide("#atmList");
    document.getElementsByClassName("atm_filters_toggle")[0].click();
    if (filterCount > 0) {
      filterCount = 0;
      await handleClearFilter();
    } else {
      if (resObj.length <= 0) {
        await handleShow(".atm_list--empty");
        await handleHide("#atmList");
        await handleHide(".simple-spinner");
        await handleHide(".bottom-spinner");
      } else {
        await mapATMData(resObj);
      }
    }
  });

async function handleClearFilter() {
  await handleFilterCount();
  languages = [];
  document.querySelectorAll("input[type=checkbox]").forEach((ele) => {
    // ele.setAttribute("checked", false);
    ele.checked = false;
    ele.previousElementSibling.classList.remove("w--redirected-checked");
  });
  totalFound = 0;
  count = 10;
  csvStartPosition = 0;
  csvEndPosition = 4;
  csvData = [];
  filterCount = 0;
  resObj = [];
  await data.set("start", totalFound);
  await data.delete("filter");
  const ATMData = await getATMData(data, GET_ATM_URL, ".simple-spinner");
  await handleResponse(ATMData);
}

async function handleServiceFilter(serviceFilter) {
  if (serviceFilter.length > 0) {
    totalFound = 0;
    count = 10;
    csvStartPosition = 0;
    csvEndPosition = 4;
    csvData = [];
    resObj = [];
    await data.set("start", totalFound);
    await data.set("filter", serviceFilter.join("&&"));
    const ATMData = await getATMData(data, GET_ATM_URL, ".simple-spinner");
    await handleResponse(ATMData);
  } else {
    await handleShow(".atm_list--empty");
    await handleHide("#atmList");
    await handleHide(".simple-spinner");
    await handleHide(".bottom-spinner");
  }
}

async function handleLanguageFilter(languages) {
  if (resObj.length > 0) {
    if (languages.length > 0) {
      var searchObj = resObj.filter((obj) =>
        languages.includes(obj.atmLocation.languageType.toLowerCase())
      );
      if (searchObj.length > 0) {
        await handleShow("#atmList");
        await handleHide(".atm_list--empty");
      } else {
        await handleHide("#atmList");
        await handleShow(".atm_list--empty");
      }
      await mapATMData(searchObj);
    }
  } else {
    await handleShow(".atm_list--empty");
    await handleHide("#atmList");
    await handleHide(".simple-spinner");
    await handleHide(".bottom-spinner");
  }
}

async function handleFilterCount() {
  if (filterCount > 0) {
    await handleShow(".filter-number-wr");
    document.querySelector(".filter_number").innerText = filterCount;
  } else {
    await handleHide(".filter-number-wr");
  }
}

async function handleHide(element) {
  let elementDiv = document.querySelector(element);
  elementDiv.style.display = "none";
  return true;
}

async function handleShow(element) {
  let elementDiv = document.querySelector(element);
  elementDiv.style.display = element == ".filter-number-wr" ? "" : "block";
  return true;
}

async function handleMapData(resObject) {
  geojson.features = [];
  if (resObject.length > 0) {
    await Promise.all(
      await resObject.map(async (obj) => {
        let cloneMapObj = JSON.parse(JSON.stringify(geoCloneObj));
        cloneMapObj.geometry.coordinates =
          obj.atmLocation && obj.atmLocation.coordinates
            ? {
                lon: obj.atmLocation.coordinates.longitude,
                lat: obj.atmLocation.coordinates.latitude,
              }
            : { lon: 0, lat: 0 };
        cloneMapObj.properties.title =
          obj.atmLocation && obj.atmLocation.name
            ? capitalizeWords(obj.atmLocation.name)
            : "";
        cloneMapObj.properties.description =
          obj.atmLocation && obj.atmLocation.locationDescription
            ? obj.atmLocation.locationDescription
            : obj.type === "csv"
            ? `${
                obj.atmLocation.address.street
                  ? obj.atmLocation.address.street
                  : ""
              } , ${
                obj.atmLocation.address.city ? obj.atmLocation.address.city : ""
              } , ${
                obj.atmLocation.address.state
                  ? obj.atmLocation.address.state
                  : ""
              }, ${
                obj.atmLocation.address.postalCode
                  ? obj.atmLocation.address.postalCode
                  : ""
              }`
            : "";
        cloneMapObj.id = obj.atmLocation.id;
        await geojson.features.push(cloneMapObj);
      })
    );
    await handleClickEvent();
  }
  await handleDirections();
  await loadMap();
}

const targetDiv = document.querySelector(".atm_page");
document.addEventListener("click", async (e) => {
  // e.preventDefault();
  const isClickedInsideDiv = e.composedPath().includes(targetDiv);
  if (!isClickedInsideDiv) {
    await handleMapReset();
  } else {
    return true;
  }
});

async function loadMap() {
  await clearMarkers();
  for (const feature of geojson.features) {
    const el = document.createElement("div");
    el.className = feature.className;
    el.id = `atm_popup_marker${feature.id}`;
    el.setAttribute("dataId", feature.id);
    const htmlModalData = await getPopupModal(feature.id);
    const popup = await new mapboxgl.Popup({
      closeButton: false,
      className: "atm_marker-wr",
      focusAfterOpen: false,
      offset: { bottom: [0, -23] },
    }).setHTML(htmlModalData);
    popup._content.setAttribute("id", `atm_popup${feature.id}`);
    popup._content.setAttribute("class", `atm_item--on-map`);
    const marker = await new mapboxgl.Marker(el)
      .setLngLat(feature.geometry.coordinates)
      .setPopup(popup)
      .addTo(map);
    marker.getPopup().on("open", async () => {
      document
        .querySelector(`#atm_popup${feature.id} .open-modal-details`)
        .addEventListener("click", function (e) {
          var currentAtmId = e.currentTarget.getAttribute("atm-id");
          var atmItem = document.getElementById("atm_" + currentAtmId);
          atmItem
            .closest(".atm_item")
            .querySelector(".atm_detail")
            .classList.add("open");
          atmItem.closest(".atm_list-wr").classList.add("open-detail");
          document.querySelector(".atm_show-trigger").click();
          setTimeout(() => {
            if (window.innerWidth < 479) {
              const link = document.querySelector(".mobile_close-trigger");
              link.click();
            }
          }, 500);
        });
      document
        .querySelector(`#atm_popup${feature.id} .close-marker-detail`)
        .addEventListener("click", (event) => {
          var currentAtmId = event.currentTarget.getAttribute("atm-id");
          var atmItem = document.getElementById("atm_" + currentAtmId);
          if (atmItem) {
            atmItem
              .closest(".atm_item")
              .querySelector(".atm_detail")
              .classList.remove("open");
            atmItem.closest(".atm_list-wr").classList.remove("open-detail");
            handleMapReset(popup);
          }
        });
      document
        .querySelector(`#atm_${feature.id} .close-detail`)
        .addEventListener("click", async (e) => {
          e.preventDefault();
          await handleMapReset(popup);
        });
      document.addEventListener("click", (e) => {
        const targetDiv = document.querySelector(".atm_page");
        const isClickedInsideDiv = e.composedPath().includes(targetDiv);
        if (!isClickedInsideDiv) {
          handleMapReset(popup);
        } else {
          return true;
        }
      });
      handleDirections();
    });
    // marker.getPopup().on("close", () => {
    //   console.log("test");
    // handleAtmItemSelected();
    // handleMarkerCss();
    // var atmItem = document.getElementById("atm_" + feature.id);
    // if (atmItem) {
    //   atmItem
    //     .closest(".atm_item")
    //     .querySelector(".atm_detail")
    //     .classList.remove("open");
    //   atmItem.closest(".atm_list-wr").classList.remove("open-detail");
    // }
    // });
    marker.getElement().addEventListener("click", (e) => {
      e.preventDefault();
      var atmMainDiv = document.querySelector(".atm_item .open");
      if (atmMainDiv) {
        atmMainDiv.classList.remove("open");
        atmMainDiv.closest(".atm_list-wr").classList.remove("open-detail");
      }
      handleMapReset("", e.target.getAttribute("dataId"));
      // if (document.querySelector(".atm_hide-trigger").style.display == "none") {
      //   document.querySelector(".atm_show-trigger").click();
      // }
      var offsets = document.getElementById(
        `atm_${e.target.getAttribute("dataId")}`
      ).offsetTop;
      document
        .getElementById("atmMain")
        .scroll({ top: offsets, behavior: "smooth" });

      if (window.innerWidth < 479) {
        map.flyTo({
          offset: [0, 80],
          center: marker.getLngLat(),
          zoom: 14,
        });
      } else {
        map.flyTo({
          offset: [100, 0],
          center: marker.getLngLat(),
          zoom: 14,
        });
      }
    });

    // map.on('click', event => {
    //   const target = event.originalEvent.target;
    //   const markerWasClicked = marker.getElement().contains(target);
    //   console.log("markerWasClicked", markerWasClicked)
    //   marker.togglePopup();
    // });

    /* document
              .querySelector(`#atm_popup_marker${feature.id}`)
              .addEventListener("mouseover", (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                marker.getElement().click();
                handleMarkerCss();
                // handleAtmItemSelected();
                // popup.setLngLat(feature.geometry.coordinates).setHTML(htmlModalData).addTo(map);
              }); */

    /* marker
              .getElement()
              .addEventListener(
                "mouseenter",
                () => (map.getCanvas().style.cursor = "pointer")
              );
            marker
              .getElement()
              .addEventListener(
                "mouseleave",
                () => (map.getCanvas().style.cursor = "")
              ); */
    /*   document
              .querySelector(`#atm_popup_marker${feature.id}`)
              .addEventListener("mouseleave", () => marker.togglePopup());
            document
              .querySelector(`#atm_popup_marker${feature.id}`)
              .addEventListener("mouseover", () => marker.togglePopup()); */
    markers.push(marker);
  }
}

async function handleClickEvent() {
  document.querySelectorAll(".atm_item").forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();
      if (window.innerWidth < 479) {
        let atmDetailLink = e.target.closest(".atm-detail-link");
        let atmDirection = e.target.closest(".atm-direction");
        let atmDetail = e.target.closest(".atm_detail");
        if (
          atmDetailLink ||
          atmDirection ||
          atmDetail ||
          e.target.classList.contains("atm-detail-link") ||
          e.target.classList.contains("atm-direction") ||
          e.target.classList.contains("atm_detail") ||
          (e.target.closest(".close-detail") &&
            e.target
              .closest(".close-detail")
              .classList.contains("close-detail"))
        ) {
          if (
            e.target.closest(".close-detail") &&
            e.target.closest(".close-detail").classList.contains("close-detail")
          ) {
            await handleMapReset();
          }
          return true;
        }
      }
      let closeDetail = e.target.closest(".close-detail");
      if (closeDetail || e.target.classList.contains("close-detail")) {
        return true;
      }
      var atmId = e.currentTarget.getAttribute("atm-id");
      document
        .querySelector(`#atm_${atmId} .close-detail`)
        .addEventListener("click", (event) => {
          event.preventDefault();
          handleMapReset();
        });
      await handleMapReset("", atmId);
      const popups = document.getElementsByClassName("mapboxgl-popup");
      if (
        popups.length > 0 &&
        popups[0].querySelector(".atm_item--on-map")?.getAttribute("id") !=
          `atm_popup${atmId}`
      ) {
        popups[0].remove();
      }
      // handleMarkerClass(atmId);
      map.flyTo({
        offset: [100, 0],
        center: {
          lon: e.currentTarget.getAttribute("data-long"),
          lat: e.currentTarget.getAttribute("data-lat"),
        },
        zoom: 14,
      });
      setTimeout(() => {
        if (window.innerWidth < 479) {
          document.querySelector(".mobile_close-trigger").click();
        }
      }, 500);
    });
  });
}

async function clearMarkers() {
  markers.forEach((marker) => marker.remove());
  markers = [];
}

async function getPopupModal(atmId) {
  var atmClonePopupItem = null;
  atmClonePopupItem = document.querySelector(".clone-popup").cloneNode(true);
  atmClonePopupItem.classList.remove("clone-popup");
  atmClonePopupItem.style.display = "block";
  atmClonePopupItem.classList.remove("hide");
  var atmData = resObj
    .filter((atm) => atm.atmLocation.id == atmId)
    .map((filteredAtm) => filteredAtm);
  var atmLocation =
    atmData.length > 0 && atmData[0].atmLocation ? atmData[0].atmLocation : {};
  var distance =
    atmData.length > 0 && atmData[0].distance ? atmData[0].distance : 0;
  atmClonePopupItem.setAttribute("id", "atm_popup" + atmLocation.id);
  atmClonePopupItem.querySelector(
    `#atm_popup${atmLocation.id} #modal-title`
  ).innerText = atmLocation.name ? capitalizeWords(atmLocation.name) : "";
  atmClonePopupItem.querySelector(
    `#atm_popup${atmLocation.id} #modal-distance`
  ).innerText =
    (Math.round(distance) === 0 ? distance.toFixed(2) : Math.round(distance)) +
    " miles";
  atmClonePopupItem.querySelector(
    `#atm_popup${atmLocation.id} #modal-address`
  ).innerText = atmLocation.locationDescription
    ? capitalizeWords(atmLocation.locationDescription)
    : "";
  if (atmLocation.isAvailable24Hours) {
    atmClonePopupItem
      .querySelector(`#atm_popup${atmLocation.id} #address`)
      ?.classList.remove("hide");
  } else {
    atmClonePopupItem
      .querySelector(`#atm_popup${atmLocation.id} #address`)
      ?.classList.add("hide");
  }
  atmClonePopupItem
    .querySelector(`#atm_popup${atmLocation.id} .close-marker-detail`)
    .setAttribute("atm-id", atmLocation.id);

  atmClonePopupItem
    .querySelector(`#atm_popup${atmLocation.id} .open-modal-details`)
    .setAttribute("atm-id", atmLocation.id);

  var directionElement = atmClonePopupItem.querySelector(
    `#atm_popup${atmLocation.id} .atm-direction`
  );
  if (directionElement) {
    directionElement.setAttribute("id", atmLocation.id),
      directionElement.setAttribute(
        "data-lat",
        atmLocation.coordinates && atmLocation.coordinates.latitude
          ? atmLocation.coordinates.latitude
          : 0.0
      ),
      directionElement.setAttribute(
        "data-long",
        atmLocation.coordinates && atmLocation.coordinates.longitude
          ? atmLocation.coordinates.longitude
          : 0.0
      );
  }
  return atmClonePopupItem.innerHTML;
}

async function fetchRoute(destinationLong, destinationLat) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${long},${lat};${destinationLong},${destinationLat}?access_token=${mapboxgl.accessToken}&geometries=geojson`
    );
    const data = await response.json();
    const routeGeometry = data.routes[0].geometry;
    directionGeoJson.features[0].geometry.coordinates =
      routeGeometry.coordinates;
    return true;
  } catch (error) {
    console.error("Error fetching or processing route:", error);
  }
}

async function handleDirections() {
  await checkGeoLocationPermission();
  document.querySelectorAll(".atm-direction").forEach((ele) => {
    ele.addEventListener("click", async (e) => {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      if (checkLocationPermission) {
        var atm_id = e.currentTarget.getAttribute("id");
        // await handleMarkerClass(atm_id);
        handleMapReset("", atm_id);
        var destinationLong = e.currentTarget.getAttribute("data-long");
        var destinationLat = e.currentTarget.getAttribute("data-lat");
        var routeJson = await fetchRoute(destinationLong, destinationLat);
        map.addSource(`route`, {
          type: "geojson",
          data: directionGeoJson,
        });
        map.addLayer({
          id: `route`,
          type: "line",
          source: `route`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#1f4d6f",
            "line-width": 4,
          },
        });
        const coordinates = directionGeoJson.features[0].geometry.coordinates;
        const bounds = new mapboxgl.LngLatBounds(
          coordinates[0],
          coordinates[0]
        );
        for (const coord of coordinates) {
          bounds.extend(coord);
        }
        map.fitBounds(bounds, {
          padding: 20,
          linear: true,
          maxZoom: 15,
        });
      } else {
        alert(
          "Unable to retrieve your location, please check your location permission!"
        );
      }
    });
  });
}

async function handleMarkerClass(atmId) {
  if (map.getLayer("route")) {
    map.removeLayer("route");
  }
  if (map.getSource("route")) {
    map.removeSource("route");
  }
  if (atmId) {
    const filteredData = await geojson.features.map((feature) => {
      if (feature.id == atmId) {
        return {
          ...feature,
          className: "atm_map_marker atm_map_marker_selected",
        };
      } else {
        return { ...feature, className: "atm_map_marker" };
      }
      return feature;
    });
    geojson.features = filteredData;
  }
  await loadMap();
}

async function checkGeoLocationPermission() {
  if (navigator.geolocation) {
    await navigator.geolocation.getCurrentPosition(
      async function (position) {
        checkLocationPermission = true;
      },
      async function (error) {
        checkLocationPermission = false;
      }
    );
  } else {
    checkLocationPermission = false;
  }
  return checkLocationPermission;
}

async function handleMarkerCss(markerId) {
  if (markerId) {
    await geojson.features.map((feature) => {
      var markerEle = document.querySelector(`#atm_popup_marker${feature.id}`);
      if (feature.id == markerId) {
        markerEle.className =
          "mapboxgl-marker mapboxgl-marker-anchor-centeratm_map_marker atm_map_marker atm_map_marker_selected";
      } else {
        markerEle.className =
          "mapboxgl-marker mapboxgl-marker-anchor-centeratm_map_marker atm_map_marker";
      }
    });
  } else {
    await geojson.features.map((feature) => {
      var markerEle = document.querySelector(`#atm_popup_marker${feature.id}`);
      markerEle.className =
        "atm_map_marker filtered mapboxgl-marker mapboxgl-marker-anchor-center";
    });
  }
}

async function handleAtmItemSelected(atmID) {
  if (atmID) {
    await document.querySelectorAll(".atm_item").forEach((ele) => {
      if (ele.getAttribute("atm-id") == atmID) {
        ele.style.backgroundColor = "#f2f9ff";
      } else {
        ele.style = "";
      }
    });
  } else {
    await document.querySelectorAll(".atm_item").forEach((ele) => {
      ele.style = "";
      ele.style.backgroundColor = "transparent";
    });
  }
}

async function stringToBoolean(stringValue) {
  switch (stringValue?.toLowerCase()?.trim()) {
    case "true":
    case "yes":
    case "1":
      return true;

    case "false":
    case "no":
    case "0":
    case null:
    case undefined:
      return false;

    default:
      return false;
  }
}

async function calculateDistance(lat1, lon1, lat2, lon2, unit) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
}

async function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function handleMapReset(popup, atmDivId) {
  if (popup) {
    popup?.remove();
  }
  if (map.getLayer("route")) {
    map.removeLayer("route");
  }
  if (map.getSource("route")) {
    map.removeSource("route");
  }
  if (atmDivId) {
    await handleMarkerCss(atmDivId);
    await handleAtmItemSelected(atmDivId);
  } else {
    await handleMarkerCss();
    await handleAtmItemSelected();
  }
}

function capitalizeWords(input) {
  return input.toLowerCase().replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
}
