package services

import "github.com/gin-gonic/gin"

// 触发服务器内部错误时，使用。会伴随500的状态码
func SendErrorResponse(ctx *gin.Context, message string) {
	ctx.JSON(500, gin.H{
		"success": false,
		"message": message,
	})
}

// 用户参数不规范时使用，本身没有触发服务器内部错误，返回状态码200
func SendFailResponse(ctx *gin.Context, message string) {
	ctx.JSON(200, gin.H{
		"success": false,
		"message": message,
	})
}

func SendSuccessResponse(ctx *gin.Context, payload interface{}) {
	ctx.JSON(200, gin.H{
		"success": true,
		"data":    payload,
	})
}
