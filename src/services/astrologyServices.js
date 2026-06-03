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

/**
 * Common API caller
 */
const callAstrologyApi = async (endpoint, payload) => {
  try {
    const { data } = await astrologyClient.post(
      endpoint,
      payload
    );

    return data;
  } catch (error) {
    console.error(
      `Astrology API Error (${endpoint}):`,
      error?.response?.data || error.message
    );

    throw new Error(
      error?.response?.data?.message ||
        "Astrology API request failed"
    );
  }
};

/**
 * Generate complete kundali data
 */
const generateKundali = async (payload) => {
  try {
    const [
      BirthData,
      Avakhada,
      PlanetsData,
      AscendantData1,
      AscendantData2,
      KalsarpaData,
      ManglikData,
      VimMahaDasha,
    ] = await Promise.all([
      callAstrologyApi("/birth_details", payload),
      callAstrologyApi("/astro_details", payload),
      callAstrologyApi("/planets/extended", payload),
      callAstrologyApi("/general_ascendant_report", payload),
      callAstrologyApi("/general_nakshatra_report", payload),
      callAstrologyApi("/kalsarpa_details", payload),
      callAstrologyApi("/manglik", payload),
      callAstrologyApi("/major_vdasha", payload),
    ]);

    return {
      BirthData,
      Avakhada,
      PlanetsData,
      AscendantData1,
      AscendantData2,
      KalsarpaData,
      ManglikData,
      VimMahaDasha,
    };
  } catch (error) {
    throw error;
  }
};

export { astrologyClient, callAstrologyApi, generateKundali };