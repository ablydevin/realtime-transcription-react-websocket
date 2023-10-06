import Ably from "ably/promises";

export const GET = async (req, res) => {
    const client = new Ably.Rest(import.meta.env.VITE_ABLY_API_KEY);
    const tokenRequestData = await client.auth.createTokenRequest({ clientId: 'ably-demo' });

    console.log(`Request: ${JSON.stringify(tokenRequestData)}`)
    return res.json(tokenRequestData);
}
