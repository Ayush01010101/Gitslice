import { redis } from "./reddis";

async function GetDataFromReddis(key: string): Promise<string | null> {
  const data: string | null = await redis.get(key)
  console.log(data)
  return data;

}

export default GetDataFromReddis
