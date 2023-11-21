
  let API_KEY =
    "97bce941-0fcd-4547-b642-b0391a86e9b0a5f40b83-4852-4f00-805b-0486f6872a92";
  mapboxgl.accessToken =
    "pk.eyJ1IjoicG9uY2ViYW5rIiwiYSI6ImNsbnVkaXpvcjBhZ2kycm1maW44dDBpa2sifQ.Z64WawPBDYfTOj4NdUDIkw";

  let data = new URLSearchParams();
  let ENDPOINT = "https://locatorapistaging.moneypass.com/Service.svc";
  const GET_ATM_URL = "/locations/atm";
  let lat, long;
  let page = 1;
  let count = 10;
  let radius = 100;
  let resObj = [];
  let totalFound = 0;
  let searchVal = "";
  let filterCount = 0;
  let languages = [];
  var markers = [];
  let isScroll = false;
  let isRes = false;
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

  document.addEventListener(
    "DOMContentLoaded",
    async function () {
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
            const ATMData = await getATMData(
              data,
              GET_ATM_URL,
              ".simple-spinner"
            );
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
            const ATMData = await getATMData(
              data,
              GET_ATM_URL,
              ".simple-spinner"
            );
            await handleResponse(ATMData);
            await handleHide(".simple-spinner");
            await handleShow(".atm_list--empty");
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
        await handleShow(".atm_list--empty");
      }
      map.on("click", "circle", (e) => {
        map.flyTo({
          center: e.features[0].geometry.coordinates,
        });
      });

      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [0, 0],
        zoom: 11.15,
      });

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        showAccuracyCircle: false,
        showUserLocation: false,
        trackUserLocation: true,
      });

      // Add the control to the map.
      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false,
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
    },
    false
  );

  document
    .getElementById("atmMain")
    .addEventListener("wheel", async (event) => {
      const postScroll = document.getElementById("atmMain");
      if (
        // totalFound < 50 &&
        totalFound > 0 &&
        searchVal == "" &&
        languages.length <= 0
      ) {
        if (
          (postScroll.scrollTop == 0 && !isScroll) ||
          (!isScroll &&
            postScroll.scrollTop ==
              postScroll.scrollHeight - postScroll.clientHeight)
        ) {
          isScroll = true;
        }
        if (isScroll && !isRes) {
          postScroll.scrollBy({
            top: event.deltaY < 0 ? -70 : 70,
          });
          event.preventDefault();
          if (
            postScroll.scrollTop >=
            postScroll.scrollHeight - postScroll.clientHeight
          ) {
            isScroll = false;
            await data.set("start", totalFound + 1);
            isRes = true;
            const ATMData = await getATMData(
              data,
              GET_ATM_URL,
              ".bottom-spinner"
            );
            await handleResponse(ATMData);
            isRes = false;
          }
        } else {
          return true;
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

  async function handleResponse(response) {
    let status = response.status ? response.status : "error";
    let statusMessage = response.statusMessage;
    if (
      response.results &&
      response.results !== null &&
      response.results.length > 0
    ) {
      resObj.length > 0
        ? response.results.map((res) => resObj.push(res))
        : (resObj = response.results);
    }
    switch (status) {
      case "fail":
        await handleShow(".atm_list--empty");
        await handleHide("#atmList");
        break;
      case "Success":
        totalFound += response.totalFound;
        await mapATMData(resObj);
        break;
      case "error":
        await handleShow(".atm_list--empty");
        await handleHide("#atmList");
        break;
      default:
        await handleShow(".atm_list--empty");
        await handleHide("#atmList");
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
        ele.innerText = atmLocation.name ? atmLocation.name : "";
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
        ele.innerText = atmLocation.locationDescription
          ? atmLocation.locationDescription
          : "";
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
    .addEventListener("keyup", async (event) => {
      searchVal = event.target.value.toLowerCase();
      if (resObj.length > 0) {
        if (searchVal && searchVal.length > 0) {
          var searchObj = resObj.filter(
            (obj) =>
              obj.atmLocation.name.toLowerCase().includes(searchVal) ||
              obj.atmLocation.locationDescription
                .toLowerCase()
                .includes(searchVal)
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
            ele.previousElementSibling.classList.remove(
              "w--redirected-checked"
            );
          }
        });
      }
      $("#atmMain").slideToggle("slow");
    });

  document
    .querySelector("#filterApply")
    .addEventListener("click", async (event) => {
      let serviceFilter = [];
      languages = Array.from(
        document.querySelectorAll("input[name=language]:checked")
      ).map((ele) => {
        return ele.getAttribute("data-val");
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
        await handleServiceFilter(serviceFilter);
        await handleLanguageFilter(languages);
      } else {
        await handleClearFilter();
      }
      searchVal = "";
      document.getElementsByClassName("atm_search-field")[0].value = "";
      await handleHide(".simple-spinner");
    });

  document
    .querySelector("#reset-filters")
    .addEventListener("click", async (event) => {
      document.getElementsByClassName("atm_filters_toggle")[0].click();
      if (filterCount > 0) {
        filterCount = 0;
        await handleClearFilter();
      }
    });

  async function handleClearFilter() {
    await handleFilterCount();
    languages = [];
    document.querySelectorAll("input[type=checkbox]").forEach((ele) => {
      ele.setAttribute("checked", false);
      ele.previousElementSibling.classList.remove("w--redirected-checked");
    });
    totalFound = 0;
    resObj = [];
    await data.set("start", totalFound);
    await data.delete("filter");
    const ATMData = await getATMData(data, GET_ATM_URL, ".simple-spinner");
    await handleResponse(ATMData);
  }

  async function handleServiceFilter(serviceFilter) {
    if (serviceFilter.length > 0) {
      totalFound = 0;
      resObj = [];
      await data.set("start", totalFound);
      await data.set("filter", serviceFilter.join("&&"));
      const ATMData = await getATMData(data, GET_ATM_URL, ".simple-spinner");
      await handleResponse(ATMData);
    } else {
      return true;
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
      return true;
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
        resObject.map(async (obj) => {
          let cloneMapObj = JSON.parse(JSON.stringify(geoCloneObj));
          cloneMapObj.geometry.coordinates =
            obj.atmLocation && obj.atmLocation.coordinates
              ? {
                  lon: obj.atmLocation.coordinates.longitude,
                  lat: obj.atmLocation.coordinates.latitude,
                }
              : { lon: 0, lat: 0 };
          cloneMapObj.properties.title =
            obj.atmLocation && obj.atmLocation.name ? obj.atmLocation.name : "";
          cloneMapObj.properties.description =
            obj.atmLocation && obj.atmLocation.locationDescription
              ? obj.atmLocation.locationDescription
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

  async function loadMap() {
    await clearMarkers();
    for (const feature of geojson.features) {
      const el = document.createElement("div");
      el.className = feature.className;
      el.id = `atm_popup_marker${feature.id}`;
      const htmlModalData = await getPopupModal(feature.id);
      const popup = await new mapboxgl.Popup({
        className: "atm_item--on-map atm-popup-outer-div",
      }).setHTML(htmlModalData);
      popup._content.setAttribute("id", `atm_popup${feature.id}`);
      const marker = await new mapboxgl.Marker(el)
        .setLngLat(feature.geometry.coordinates)
        .setPopup(popup)
        .addTo(map);
      marker.getPopup().on("open", () => {
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
          });
      });
      marker.getPopup().on("close", () => {
        var atmItem = document.getElementById("atm_" + feature.id);
        if (atmItem) {
          atmItem
            .closest(".atm_item")
            .querySelector(".atm_detail")
            .classList.remove("open");
          atmItem.closest(".atm_list-wr").classList.remove("open-detail");
        }
      });
      marker.getElement().addEventListener("click", (e) => {
        if (map.getLayer("route")) {
          map.removeLayer("route");
        }
        if (map.getSource("route")) {
          map.removeSource("route");
        }
        map.flyTo({
          center: marker.getLngLat(),
          zoom: 14,
        });
      });
      marker
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
        );
      document
        .querySelector(`#atm_popup_marker${feature.id}`)
        .addEventListener("mouseleave", () => marker.togglePopup());
      document
        .querySelector(`#atm_popup_marker${feature.id}`)
        .addEventListener("mouseover", () => marker.togglePopup());
      markers.push(marker);
    }
  }

  async function handleClickEvent() {
    document.querySelectorAll(".atm_item").forEach((item) => {
      item.addEventListener("click", async (e) => {
        e.preventDefault();
        var atmId = e.currentTarget.getAttribute("atm-id");
        await handleMarkerClass(atmId);
        map.flyTo({
          center: {
            lon: e.currentTarget.getAttribute("data-long"),
            lat: e.currentTarget.getAttribute("data-lat"),
          },
          zoom: 14,
        });
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
      atmData.length > 0 && atmData[0].atmLocation
        ? atmData[0].atmLocation
        : {};
    var distance =
      atmData.length > 0 && atmData[0].distance ? atmData[0].distance : 0;
    atmClonePopupItem.setAttribute("id", "atm_popup" + atmLocation.id);
    atmClonePopupItem.querySelector(
      `#atm_popup${atmLocation.id} #modal-title`
    ).innerText = atmLocation.name ? atmLocation.name : "";
    atmClonePopupItem.querySelector(
      `#atm_popup${atmLocation.id} #modal-distance`
    ).innerText =
      (Math.round(distance) === 0
        ? distance.toFixed(2)
        : Math.round(distance)) + " miles";
    atmClonePopupItem.querySelector(
      `#atm_popup${atmLocation.id} #modal-address`
    ).innerText = atmLocation.locationDescription
      ? atmLocation.locationDescription
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
      .querySelector(`#atm_popup${atmLocation.id} .open-modal-details`)
      .setAttribute("atm-id", atmLocation.id);
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
    document.querySelectorAll(".atm-direction").forEach((ele) => {
      ele.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (map.getLayer("route")) {
          map.removeLayer("route");
        }
        if (map.getSource("route")) {
          map.removeSource("route");
        }
        var atm_id = e.currentTarget.getAttribute("id");
        await handleMarkerClass(atm_id);
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
