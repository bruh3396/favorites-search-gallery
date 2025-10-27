// import { FINAL_API_POST_URL, FINAL_API_TAG_URL, PRIVATE_API_POST_URL, PUBLIC_API_POST_URL, PUBLIC_API_TAG_URL } from "./api_url";

// export async function configureFinalAPI(): Promise<void> {
//   fetch(PRIVATE_API_POST_URL + 50);
//   try {
//     const response = await fetch(`${PUBLIC_API_TAG_URL}50`);

//     if (response.ok) {
//       FINAL_API_POST_URL = PUBLIC_API_POST_URL;
//     } else {
//       console.error(response.statusText);
//     }

//   } catch (error) {
//     console.error(error);
//   }

//   try {
//     const response = await fetch(`${PUBLIC_API_TAG_URL}1girls`);

//     if (response.ok) {
//       FINAL_API_TAG_URL = PUBLIC_API_TAG_URL;
//     } else {
//       console.error(response.statusText);
//     }

//   } catch (error) {
//     console.error(error);
//   }
// }
