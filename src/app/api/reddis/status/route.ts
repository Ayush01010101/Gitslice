import { redis } from "@/lib/reddis"
import ApiResponce from "@/utities/ApiResponce"
export async function GET() {
  const status = await redis.ping()
  if (status) {
    return ApiResponce({ statusCode: 200, message: "success", data: { status } })
  }

  return ApiResponce({ statusCode: 500, message: "health is down", data: { status } })
}
