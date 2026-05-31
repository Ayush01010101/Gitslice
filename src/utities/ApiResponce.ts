import { NextResponse } from "next/server"
interface props {
  statusCode: number
  message: string,
  data?: any
}
function ApiResponce({ statusCode = 200, message = "", data = null }: props) {

  return NextResponse.json({
    message,
    data

  }, { status: statusCode })
}

export default ApiResponce
