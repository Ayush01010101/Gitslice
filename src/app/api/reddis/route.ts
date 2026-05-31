import ApiResponce from "@/utities/ApiResponce";

export function POST() {
  return (
    ApiResponce({ statusCode: 200, message: "sucess", data: { status: "everything is good" } })
  )
}

