export const SERVER_URL = process.env.VUE_APP_SERVER_URL!;
export const LOGIN_COOKIE = 'atxLogin';
const url = window.location.href;
const split = url.match(/https:.+\.custom\.pods\.latch\.bio/i);
export const PROD_SERVER_URL = `${split}`;