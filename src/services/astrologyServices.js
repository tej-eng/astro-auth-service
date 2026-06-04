import axios from "axios";

const BASE_URL = "https://json.astrologyapi.com/v1";

const USER_ID = process.env.ASTROLOGY_USER_ID;
const API_KEY = process.env.ASTROLOGY_API_KEY;

const authToken = Buffer.from(
  `${USER_ID}:${API_KEY}`
).toString("base64");

const astrologyClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Authorization: `Basic ${authToken}`,
    "Content-Type": "application/json",
  },
});

const callAstrologyApi = async (
  endpoint,
  payload
) => {
  try {
    const { data } =
      await astrologyClient.post(
        endpoint,
        payload
      );

    return data;
  } catch (error) {
    console.error(
      `Astrology API Error (${endpoint}):`,
      error?.response?.data ||
        error.message
    );

    throw new Error(
      error?.response?.data?.message ||
        "Astrology API request failed"
    );
  }
};

const generateKundali = async (
  payload
) => {
  try {
    const planets = [
      "sun",
      "moon",
      "mars",
      "mercury",
      "jupiter",
      "venus",
      "saturn",
    ];

    const [
      BirthData,
      Avakhada,
      PlanetsData,
      AscendantData1,
      AscendantData2,
      KalsarpaData,
      ManglikData,
      VimMahaDasha,
      planetaryReport,
    ] = await Promise.all([
      callAstrologyApi(
        "/birth_details",
        payload
      ),

      callAstrologyApi(
        "/astro_details",
        payload
      ),

      callAstrologyApi(
        "/planets/extended",
        payload
      ),

      callAstrologyApi(
        "/general_ascendant_report",
        payload
      ),

      callAstrologyApi(
        "/general_nakshatra_report",
        payload
      ),

      callAstrologyApi(
        "/kalsarpa_details",
        payload
      ),

      callAstrologyApi(
        "/manglik",
        payload
      ),

      callAstrologyApi(
        "/major_vdasha",
        payload
      ),

      Promise.all(
        planets.map((planet) =>
          callAstrologyApi(
            `/general_house_report/${planet}`,
            payload
          )
        )
      ),
    ]);

    const chartPayload = {
      day: payload.day,
      month: payload.month,
      year: payload.year,
      hour: payload.hour,
      min: payload.min,
      lat: payload.lat,
      lon: payload.lon,
      tzone: payload.tzone,
      lineColor: "black",
      chartType: "north",
    };

    const chartEndpoints = {
      D1: "Lagna",
      D9: "Navamsa",
      chalit: "Chalit",
      SUN: "Sun",
      MOON: "Moon",
      D2: "Hora",
      D3: "Drekkana",
      D4: "Chaturthamsa",
      D7: "Saptamsa",
      D10: "Dasamsa",
      D12: "Dwadasamsa",
      D16: "Shodasamsa",
      D20: "Vishamansha",
      D24: "Chaturvimsamsa",
      D30: "Trimsamsa",
      D40: "Khavedamsa",
      D45: "Akshavedamsa",
      D60: "Shastiamsa",
    };

    const charts = {};

    await Promise.all(
      Object.entries(
        chartEndpoints
      ).map(
        async ([endpoint, label]) => {
          try {
            charts[label] =
              await callAstrologyApi(
                `/horo_chart_image/${endpoint}`,
                chartPayload
              );
          } catch (err) {
            charts[label] = {
              error: err.message,
            };
          }
        }
      )
    );

    let finalManglikData =
      ManglikData;

    if (
      typeof ManglikData ===
      "string"
    ) {
      finalManglikData =
        ManglikData.replace(
          /LESS_EFFECTIVE/g,
          "Yes, You are manglik"
        )
          .replace(
            /EFFECTIVE/g,
            "Yes, You are manglik"
          )
          .replace(
            /NO_EFFECTIVE/g,
            "No, You are not manglik"
          );
    }

    return {
      BirthData,
      Avakhada,
      PlanetsData,
      AscendantData1,
      AscendantData2,
      KalsarpaData,
      ManglikData:
        finalManglikData,
      VimMahaDasha,

      charts,

      planetaryReport,

      generated_at:
        new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      "Generate Kundali Error:",
      error
    );

    throw error;
  }
};

export { astrologyClient, callAstrologyApi, generateKundali };