import client from "./axiosClient";

export const getCurrentBusiness = async () => {
    const response = await client.get("/businesses/me");
    return response.data;
};